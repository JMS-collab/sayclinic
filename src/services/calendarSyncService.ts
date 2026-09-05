import { CalendarEvent } from '@/data/calendarConfig';
import { getAccessToken } from '@/lib/workspaceAuth';

export interface GoogleCalendarItem {
  id: string;
  summary: string;
  primary?: boolean;
}

export interface FetchCalendarResult {
  calendars: GoogleCalendarItem[];
  successfulCalendarIds: string[];
  events: CalendarEvent[];
}

/**
 * Získa platný OAuth Access Token pre Google Workspace / Calendar API
 * Prioritizuje token z Firebase Workspace OAuth, s fallbackom na NextAuth session token
 */
export async function getCalendarAuthToken(session?: any): Promise<string | null> {
  try {
    const wsToken = await getAccessToken();
    if (wsToken) return wsToken;
  } catch (err) {
    console.warn('Chyba pri čítaní workspace tokenu:', err);
  }

  if (session?.accessToken) {
    return session.accessToken;
  }

  return null;
}

/**
 * Zostaví HTTP hlavičky s autorizáciou pre /api/calendar
 */
async function buildAuthHeaders(session?: any): Promise<HeadersInit> {
  const token = await getCalendarAuthToken(session);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Načíta všetky kalendáre a udalosti z Google Kalendára cez /api/calendar
 */
export async function fetchGoogleCalendarEvents(session?: any): Promise<FetchCalendarResult | null> {
  try {
    const headers = await buildAuthHeaders(session);
    const res = await fetch('/api/calendar', {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.warn('Chyba GET /api/calendar:', res.status, errorData);
      return null;
    }

    const data = await res.json();
    return {
      calendars: data.calendars || [],
      successfulCalendarIds: data.successfulCalendarIds || [],
      events: data.events || [],
    };
  } catch (err) {
    console.error('Chyba spojenia s /api/calendar:', err);
    return null;
  }
}

/**
 * Vytvorí novú udalosť v Google Kalendári a vráti pridelené googleEventId
 */
export async function createGoogleCalendarEvent(
  event: CalendarEvent,
  session?: any
): Promise<{ success: boolean; googleEventId?: string; error?: string }> {
  try {
    const headers = await buildAuthHeaders(session);
    const res = await fetch('/api/calendar', {
      method: 'POST',
      headers,
      body: JSON.stringify(event),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Chyba pri vytváraní udalosti na Google Kalendári' };
    }

    return {
      success: true,
      googleEventId: data.googleEventId,
    };
  } catch (err: any) {
    console.error('Chyba pri volaní POST /api/calendar:', err);
    return { success: false, error: err.message || 'Chyba siete' };
  }
}

/**
 * Aktualizuje existujúcu udalosť v Google Kalendári (čas, dátum, personál, poznámky, storno)
 */
export async function updateGoogleCalendarEvent(
  event: CalendarEvent,
  session?: any
): Promise<{ success: boolean; googleEventId?: string; notFound?: boolean; error?: string }> {
  try {
    const eventId = event.googleEventId || event.id;
    if (!eventId) {
      return { success: false, error: 'Udalosť nemá identifikátor pre Google Kalendár' };
    }

    const headers = await buildAuthHeaders(session);
    const res = await fetch('/api/calendar', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        ...event,
        eventId,
        googleEventId: eventId,
        calendarId: event.calendarId || 'primary',
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      if (res.status === 404 || data.notFound) {
        return { success: false, notFound: true, error: 'Udalosť neexistuje na Google Kalendári' };
      }
      return { success: false, error: data.error || 'Chyba aktualizácie udalosti na Google Kalendári' };
    }

    return {
      success: true,
      googleEventId: data.googleEventId,
    };
  } catch (err: any) {
    console.error('Chyba pri volaní PATCH /api/calendar:', err);
    return { success: false, error: err.message || 'Chyba siete' };
  }
}

/**
 * Zmaže udalosť z Google Kalendára
 */
export async function deleteGoogleCalendarEvent(
  googleEventId: string,
  calendarId: string = 'primary',
  session?: any
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!googleEventId) {
      return { success: true };
    }

    const headers = await buildAuthHeaders(session);
    const res = await fetch(
      `/api/calendar?eventId=${encodeURIComponent(googleEventId)}&calendarId=${encodeURIComponent(calendarId)}`,
      {
        method: 'DELETE',
        headers,
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Chyba pri mazaní udalosti na Google Kalendári' };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Chyba pri volaní DELETE /api/calendar:', err);
    return { success: false, error: err.message || 'Chyba siete' };
  }
}

/**
 * Obojsmerné zlučovanie lokálnych udalostí SAY OS a vzdialených udalostí z Google Kalendára
 * 
 * Pravidlá:
 * 1. Každá udalosť z Google Kalendára sa premietne do SAY OS.
 *    Ak už v SAY OS existuje (podľa googleEventId alebo id), zaktualizujú sa jej časy, dátum, stavy a poznámky,
 *    pričom sa zachovajú špecifické interné SAY OS polia.
 * 2. Ak udalosť existuje lokálne v SAY OS a MALA googleEventId patriace do načítaného kalendára,
 *    ale na Google Kalendári už NIE JE, znamená to, že bola zmazaná v Google Kalendári -> vymaže sa aj zo SAY OS.
 * 3. Ak udalosť v SAY OS ešte nemá googleEventId (vytvorená lokálne alebo offline), ponechá sa.
 */
export function mergeCalendarEvents(
  localEvents: CalendarEvent[],
  googleEvents: CalendarEvent[],
  successfulCalendarIds: string[]
): CalendarEvent[] {
  const googleMapByGId = new Map<string, CalendarEvent>();
  const googleMapById = new Map<string, CalendarEvent>();

  googleEvents.forEach((gEvt) => {
    if (gEvt.googleEventId) googleMapByGId.set(gEvt.googleEventId, gEvt);
    if (gEvt.id) googleMapById.set(gEvt.id, gEvt);
  });

  const merged: CalendarEvent[] = [];
  const processedGoogleIds = new Set<string>();

  // 1. Spracovanie lokálnych udalostí
  for (const loc of localEvents) {
    const matchingGoogle = 
      (loc.googleEventId && googleMapByGId.get(loc.googleEventId)) ||
      (loc.id && googleMapById.get(loc.id)) ||
      (loc.id && googleMapByGId.get(loc.id));

    if (matchingGoogle) {
      // Udalosť existuje na oboch stranách: aktualizujeme najnovšie údaje z Google
      processedGoogleIds.add(matchingGoogle.googleEventId || matchingGoogle.id);

      merged.push({
        ...loc,
        ...matchingGoogle,
        // Zachováme lokálne špecifické atribúty, ak ich Google neobsahuje
        roomId: matchingGoogle.roomId || loc.roomId,
        roomName: matchingGoogle.roomName || loc.roomName,
        operator: matchingGoogle.operator || loc.operator,
        anesthesiologist: matchingGoogle.anesthesiologist || loc.anesthesiologist,
        patientPhone: matchingGoogle.patientPhone || loc.patientPhone,
        patientEmail: matchingGoogle.patientEmail || loc.patientEmail,
        materials: matchingGoogle.materials || loc.materials,
        specialEquipment: matchingGoogle.specialEquipment || loc.specialEquipment,
        isGoogleSynced: true,
      });
    } else {
      // Udalosť nie je v Google odpovedi
      const targetCalId = loc.calendarId || 'primary';
      const isCalendarCovered = successfulCalendarIds.includes(targetCalId);

      // Ak mala googleEventId a kalendár bol úspešne stiahnutý, bola zmazaná na Google!
      if (loc.googleEventId && isCalendarCovered) {
        // Preskočíme ju (zmazaná v Google Kalendári)
        continue;
      }

      // Lokálna udalosť bez Google ID alebo zatiaľ nesynchronizovaná
      merged.push(loc);
    }
  }

  // 2. Pridanie nových udalostí vytvorených priamo na Google Kalendári
  for (const gEvt of googleEvents) {
    const key = gEvt.googleEventId || gEvt.id;
    if (!processedGoogleIds.has(key)) {
      merged.push({
        ...gEvt,
        isGoogleSynced: true,
      });
    }
  }

  return merged;
}
