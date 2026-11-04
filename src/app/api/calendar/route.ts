import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

function getAccessToken(req: Request, session: any): string | null {
  const authHeader = req.headers.get('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  return bearerToken || session?.accessToken || null;
}

function detectEventType(title: string): string {
  const t = (title || '').toLowerCase();
  if (t.includes('operác') || t.includes('augment') || t.includes('lipo') || t.includes('blefaro') || t.includes('plastik') || t.includes('sála') || t.includes('rhino') || t.includes('facelift') || t.includes('abdomino')) {
    return 'operacia';
  }
  if (t.includes('kontrol') || t.includes('preväz') || t.includes('stehy')) {
    return 'kontrola';
  }
  if (t.includes('ošetren') || t.includes('botox') || t.includes('kyselina') || t.includes('výplň') || t.includes('laser') || t.includes('profhilo')) {
    return 'osetrenie';
  }
  if (t.includes('obed') || t.includes('dovolenk') || t.includes('školen') || t.includes('seminár') || t.includes('teambuilding') || t.includes('voľno') || t.includes('sanitár')) {
    return 'volno';
  }
  return 'konzultacia';
}

function addOneDayStr(dateStr: string): string {
  const clean = (dateStr || '').split('T')[0];
  const parts = clean.split('-').map(Number);
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    const d = new Date(parts[0], parts[1] - 1, parts[2] + 1, 12, 0, 0);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return clean;
}

function extractBratislavaDateAndTime(isoStr: string): { date: string; time: string } {
  if (!isoStr) return { date: '', time: '09:00' };
  try {
    // Ak je to čisto lokálny zápis bez posunu, napr. 2026-11-03T09:00:00
    if (!isoStr.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(isoStr)) {
      const [dPart, tPart] = isoStr.split('T');
      return {
        date: dPart || '',
        time: tPart ? tPart.substring(0, 5) : '09:00',
      };
    }
    const parsed = new Date(isoStr);
    if (isNaN(parsed.getTime())) {
      const [dPart, tPart] = isoStr.split('T');
      return { date: dPart || '', time: tPart ? tPart.substring(0, 5) : '09:00' };
    }
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Bratislava',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(parsed);

    const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';
    const year = getPart('year');
    const month = getPart('month');
    const day = getPart('day');
    let hour = getPart('hour');
    if (hour === '24') hour = '00';
    const minute = getPart('minute');

    return {
      date: `${year}-${month}-${day}`,
      time: `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`,
    };
  } catch {
    const [dPart, tPart] = isoStr.split('T');
    return { date: dPart || '', time: tPart ? tPart.substring(0, 5) : '09:00' };
  }
}

function buildEventTimes(date: string, startTime: string, endTime: string, isAllDay?: boolean) {
  const cleanDate = (date || '').split('T')[0];
  if (isAllDay) {
    const nextDayStr = addOneDayStr(cleanDate);
    return {
      start: { date: cleanDate },
      end: { date: nextDayStr },
    };
  }

  const cleanStart = (startTime && startTime.length >= 5) ? startTime.slice(0, 5) : '09:00';
  let cleanEnd = (endTime && endTime.length >= 5) ? endTime.slice(0, 5) : '10:00';

  const [sh, sm] = cleanStart.split(':').map(Number);
  const [eh, em] = cleanEnd.split(':').map(Number);
  const startTotal = (sh || 0) * 60 + (sm || 0);
  const endTotal = (eh || 0) * 60 + (em || 0);

  if (endTotal <= startTotal) {
    const fixedEnd = Math.min(23 * 60 + 59, startTotal + 30);
    const fh = String(Math.floor(fixedEnd / 60)).padStart(2, '0');
    const fm = String(fixedEnd % 60).padStart(2, '0');
    cleanEnd = `${fh}:${fm}`;
  }

  return {
    start: {
      dateTime: `${cleanDate}T${cleanStart}:00`,
      timeZone: 'Europe/Bratislava',
    },
    end: {
      dateTime: `${cleanDate}T${cleanEnd}:00`,
      timeZone: 'Europe/Bratislava',
    },
  };
}

function buildGoogleEventPayload(eventData: any) {
  const {
    id,
    title,
    patientName,
    patientPhone,
    patientEmail,
    patientId,
    doctorName,
    assignedTo,
    roomId,
    roomName,
    date,
    startTime,
    endTime,
    isAllDay,
    type,
    status,
    freeformCategory,
    anesthesiaType,
    clinicStay,
    operator,
    anesthesiologist,
    anesthesiaNurse,
    scrubNurse,
    specialEquipment,
    specialEquipmentOther,
    materials,
    materialNotes,
    totalPrice,
    depositAmount,
    isDepositPaid,
    preOpExamReady,
    materialsReady,
    consentsSigned,
    parentEventId,
    isCancelled,
    cancelReason,
    operationTitle,
    operationDate,
    operationRecordId,
    operationDoctor,
    operationNotes,
    controlInterval,
    notes,
  } = eventData;

  const cancelledPrefix = isCancelled ? '[ZRUŠENÉ] ' : '';
  const cleanTitle = title || 'Udalosť SAY CLINIC';
  const cleanPatient = patientName && type !== 'volno' && !cleanTitle.toLowerCase().includes(patientName.toLowerCase())
    ? ` - ${patientName}`
    : '';
  const summary = `${cancelledPrefix}${cleanTitle}${cleanPatient}`;

  const descriptionParts: string[] = [];
  if (notes) descriptionParts.push(`Poznámky:\n${notes}\n`);
  descriptionParts.push(`--- SAY OS Informácie ---`);
  if (patientName) descriptionParts.push(`Pacient: ${patientName}`);
  if (patientPhone) descriptionParts.push(`Tel: ${patientPhone}`);
  if (patientEmail) descriptionParts.push(`E-mail: ${patientEmail}`);
  if (doctorName) descriptionParts.push(`Lekár / Personál: ${doctorName}`);
  if (roomId) descriptionParts.push(`Miestnosť: ${roomId}`);
  if (type) descriptionParts.push(`Typ termínu: ${type}`);
  if (anesthesiaType) descriptionParts.push(`Anestézia: ${anesthesiaType}`);
  if (clinicStay) descriptionParts.push(`Pobyt na klinike: ${clinicStay}`);
  if (totalPrice !== undefined && totalPrice !== '') descriptionParts.push(`Cena: ${totalPrice} €`);
  if (depositAmount !== undefined && depositAmount !== '') descriptionParts.push(`Záloha: ${depositAmount} € (${isDepositPaid ? 'Uhradená' : 'Neuhradená'})`);
  if (isCancelled) descriptionParts.push(`STAV: ZRUŠENÝ TERMÍN (Dôvod: ${cancelReason || 'neuvedený'})`);
  if (operationTitle) descriptionParts.push(`Pooperačná kontrola pre: ${operationTitle} (${operationDate || ''})`);

  const description = descriptionParts.join('\n');
  const times = buildEventTimes(date, startTime, endTime, isAllDay);

  const extendedPrivate: Record<string, string> = {
    sayEventId: String(id || `evt-${Date.now()}`),
    title: String(cleanTitle),
    patientName: String(patientName || ''),
    patientPhone: String(patientPhone || ''),
    patientEmail: String(patientEmail || ''),
    patientId: String(patientId || ''),
    doctorName: String(doctorName || ''),
    assignedTo: String(assignedTo || ''),
    roomId: String(roomId || ''),
    roomName: String(roomName || ''),
    type: String(type || 'operacia'),
    status: String(status || (isCancelled ? 'cancelled' : 'planned')),
    freeformCategory: String(freeformCategory || ''),
    anesthesiaType: String(anesthesiaType || ''),
    clinicStay: String(clinicStay || ''),
    operator: String(operator || ''),
    anesthesiologist: String(anesthesiologist || ''),
    anesthesiaNurse: String(anesthesiaNurse || ''),
    scrubNurse: String(scrubNurse || ''),
    specialEquipmentOther: String(specialEquipmentOther || ''),
    materialNotes: String(materialNotes || ''),
    totalPrice: String(totalPrice ?? ''),
    depositAmount: String(depositAmount ?? ''),
    isDepositPaid: String(Boolean(isDepositPaid)),
    preOpExamReady: String(Boolean(preOpExamReady)),
    materialsReady: String(Boolean(materialsReady)),
    consentsSigned: String(Boolean(consentsSigned)),
    parentEventId: String(parentEventId || ''),
    isCancelled: String(Boolean(isCancelled)),
    cancelReason: String(cancelReason || ''),
    operationTitle: String(operationTitle || ''),
    operationDate: String(operationDate || ''),
    operationRecordId: String(operationRecordId || ''),
    operationDoctor: String(operationDoctor || ''),
    operationNotes: String(operationNotes || ''),
    controlInterval: String(controlInterval || ''),
    notes: String(notes || ''),
  };

  if (specialEquipment && Array.isArray(specialEquipment)) {
    extendedPrivate.specialEquipment = JSON.stringify(specialEquipment);
  }
  if (materials && Array.isArray(materials)) {
    extendedPrivate.materials = JSON.stringify(materials);
  }

  return {
    summary,
    description,
    start: times.start,
    end: times.end,
    extendedProperties: {
      private: extendedPrivate,
    },
  };
}

// GET: Načítanie udalostí zo všetkých kalendárov Google
export async function GET(req: Request) {
  const session: any = await getServerSession(authOptions);
  const accessToken = getAccessToken(req, session);

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Nie ste prihlásený do Google účtu alebo chýba prístupový token.' }, 
      { status: 401 }
    );
  }

  try {
    const listRes = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const listData = await listRes.json();

    if (!listRes.ok) {
      return NextResponse.json(
        { error: listData.error?.message || 'Chyba pri načítaní zoznamu kalendárov' }, 
        { status: listRes.status }
      );
    }

    const calendars = (listData.items || []).map((cal: any) => ({
      id: cal.id,
      summary: cal.summary || 'Bez názvu',
      primary: cal.primary || false,
    }));

    const now = new Date();
    const pastYear = new Date(now);
    pastYear.setFullYear(pastYear.getFullYear() - 1);
    
    const futureYear = new Date(now);
    futureYear.setFullYear(futureYear.getFullYear() + 1);

    const timeMin = pastYear.toISOString();
    const timeMax = futureYear.toISOString();

    let allEvents: any[] = [];
    const successfulCalendarIds: string[] = [];

    for (const cal of calendars) {
      try {
        const eventsUrl = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events`);
        eventsUrl.searchParams.append('singleEvents', 'true');
        eventsUrl.searchParams.append('orderBy', 'startTime');
        eventsUrl.searchParams.append('maxResults', '2500');
        eventsUrl.searchParams.append('timeMin', timeMin);
        eventsUrl.searchParams.append('timeMax', timeMax);

        const eventsRes = await fetch(eventsUrl.toString(), {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (eventsRes.ok) {
          successfulCalendarIds.push(cal.id);
          const eventsData = await eventsRes.json();
          const items = eventsData.items || [];

          const formatted = items.map((item: any) => {
            const extProps = item.extendedProperties?.private || {};
            const start = item.start?.dateTime || item.start?.date || '';
            const end = item.end?.dateTime || item.end?.date || '';

            const isAllDay = !item.start?.dateTime && Boolean(item.start?.date);
            let startDate = start.split('T')[0] || '';
            let startTime = '09:00';
            let endTime = '10:00';

            if (isAllDay) {
              startTime = '00:00';
              endTime = '23:59';
            } else if (start.includes('T')) {
              const parsedStart = extractBratislavaDateAndTime(start);
              const parsedEnd = end.includes('T') ? extractBratislavaDateAndTime(end) : { date: parsedStart.date, time: '10:00' };
              startDate = parsedStart.date || startDate;
              startTime = parsedStart.time || '09:00';
              endTime = parsedEnd.time || '10:00';
            }

            const rawSummary = item.summary || 'Udalosť bez názvu';
            const cleanSummary = rawSummary.replace(/\[ZRUŠENÉ\]\s*/gi, '').trim();
            let title = cleanSummary;
            let patientName = cleanSummary;

            if (cleanSummary.includes(' - ')) {
              const parts = cleanSummary.split(' - ');
              title = parts[0].trim();
              patientName = parts.slice(1).join(' - ').trim();
            }

            const isCancelled = extProps.isCancelled === 'true' || rawSummary.includes('[ZRUŠENÉ]');

            let specialEquipment: string[] | undefined;
            if (extProps.specialEquipment) {
              try { specialEquipment = JSON.parse(extProps.specialEquipment); } catch {}
            }
            let materials: string[] | undefined;
            if (extProps.materials) {
              try { materials = JSON.parse(extProps.materials); } catch {}
            }

            const detectedType = extProps.type || detectEventType(rawSummary);

            return {
              id: extProps.sayEventId || `gcal-${item.id}`,
              googleEventId: item.id,
              calendarId: cal.id,
              calendarName: cal.summary,
              patientId: extProps.patientId || '',
              patientName: extProps.patientName || patientName,
              patientPhone: extProps.patientPhone || '',
              patientEmail: extProps.patientEmail || '',
              doctorName: extProps.doctorName || cal.summary,
              assignedTo: extProps.assignedTo || extProps.doctorName || cal.summary,
              roomId: extProps.roomId || (detectedType === 'operacia' ? 'sala_say' : 'ambulancia'),
              roomName: extProps.roomName || '',
              title: extProps.title || title,
              date: startDate,
              startTime: startTime,
              endTime: endTime,
              isAllDay: isAllDay,
              type: detectedType,
              status: extProps.status || (isCancelled ? 'cancelled' : 'planned'),
              freeformCategory: extProps.freeformCategory || undefined,
              anesthesiaType: extProps.anesthesiaType || '',
              clinicStay: extProps.clinicStay || '',
              operator: extProps.operator || extProps.doctorName || '',
              anesthesiologist: extProps.anesthesiologist || '',
              anesthesiaNurse: extProps.anesthesiaNurse || '',
              scrubNurse: extProps.scrubNurse || '',
              specialEquipment,
              specialEquipmentOther: extProps.specialEquipmentOther || '',
              materials,
              materialNotes: extProps.materialNotes || '',
              totalPrice: extProps.totalPrice !== undefined && extProps.totalPrice !== '' ? Number(extProps.totalPrice) : undefined,
              depositAmount: extProps.depositAmount !== undefined && extProps.depositAmount !== '' ? Number(extProps.depositAmount) : undefined,
              isDepositPaid: extProps.isDepositPaid === 'true',
              preOpExamReady: extProps.preOpExamReady === 'true',
              materialsReady: extProps.materialsReady === 'true',
              consentsSigned: extProps.consentsSigned === 'true',
              parentEventId: extProps.parentEventId || undefined,
              isCancelled: isCancelled,
              cancelReason: extProps.cancelReason || '',
              operationTitle: extProps.operationTitle || '',
              operationDate: extProps.operationDate || '',
              operationRecordId: extProps.operationRecordId || '',
              operationDoctor: extProps.operationDoctor || '',
              operationNotes: extProps.operationNotes || '',
              controlInterval: extProps.controlInterval || '',
              notes: extProps.notes || item.description || '',
              isGoogleSynced: true,
            };
          });

          allEvents = [...allEvents, ...formatted];
        }
      } catch (calErr) {
        console.warn(`Chyba načítania kalendára ${cal.id}:`, calErr);
      }
    }

    return NextResponse.json({
      calendars,
      successfulCalendarIds,
      events: allEvents,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Vytvorenie novej udalosti priamo v Google Kalendári
export async function POST(req: Request) {
  const session: any = await getServerSession(authOptions);
  const accessToken = getAccessToken(req, session);

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Nie ste prihlásený do Google účtu alebo chýba prístupový token.' }, 
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const targetCalendarId = body.calendarId || 'primary';
    const googleEvent = buildGoogleEventPayload(body);

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(googleEvent),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error?.message || 'Chyba pri vytváraní udalosti v Google Kalendári' }, 
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      googleEventId: data.id,
      calendarId: targetCalendarId,
      event: data,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Aktualizácia existujúcej udalosti v Google Kalendári
export async function PATCH(req: Request) {
  const session: any = await getServerSession(authOptions);
  const accessToken = getAccessToken(req, session);

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Nie ste prihlásený do Google účtu alebo chýba prístupový token.' }, 
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const eventId = body.googleEventId || body.eventId || body.id;
    const targetCalendarId = body.calendarId || 'primary';

    if (!eventId) {
      return NextResponse.json(
        { error: 'Chýba identifikátor udalosti (googleEventId / eventId).' }, 
        { status: 400 }
      );
    }

    const patchPayload = buildGoogleEventPayload(body);

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patchPayload),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json(
          { notFound: true, error: 'Udalosť nebola nájdená v Google Kalendári (možno bola vymazaná externe).' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: data.error?.message || 'Chyba pri aktualizácii udalosti v Google Kalendári' }, 
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      googleEventId: data.id,
      calendarId: targetCalendarId,
      event: data,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Odstránenie udalosti z Google Kalendára
export async function DELETE(req: Request) {
  const session: any = await getServerSession(authOptions);
  const accessToken = getAccessToken(req, session);

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Nie ste prihlásený do Google účtu alebo chýba prístupový token.' }, 
      { status: 401 }
    );
  }

  try {
    const url = new URL(req.url);
    let eventId = url.searchParams.get('eventId') || url.searchParams.get('googleEventId') || url.searchParams.get('id');
    let targetCalendarId = url.searchParams.get('calendarId') || 'primary';

    if (!eventId) {
      try {
        const body = await req.json();
        eventId = body.googleEventId || body.eventId || body.id;
        targetCalendarId = body.calendarId || targetCalendarId;
      } catch {}
    }

    if (!eventId) {
      return NextResponse.json(
        { error: 'Chýba identifikátor udalosti na zmazanie.' }, 
        { status: 400 }
      );
    }

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!res.ok && res.status !== 404 && res.status !== 410) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: data.error?.message || 'Chyba pri mazaní udalosti v Google Kalendári' }, 
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      eventId,
      calendarId: targetCalendarId,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
