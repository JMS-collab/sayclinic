// Centrálna služba pre real-time synchronizáciu všetkých klinických dát naprieč počítačmi v SAY CLINIC

export type SyncCollection = 
  | 'patients'
  | 'patient_records'
  | 'clinical_timeline_profiles'
  | 'patient_surgeries'
  | 'patient_plans'
  | 'patient_presence'
  | 'custom_macros'
  | 'aesthetic_sessions'
  | 'calendar_events'
  | 'sales'
  | 'invoices'
  | 'inventory'
  | 'inventory_logs'
  | 'opiates'
  | 'opiate_logs'
  | 'projects'
  | 'custom_avatars'
  | 'users_updated'
  | 'audit_logs';

interface CollectionMapping {
  storageKey: string;
  eventName: string;
}

const COLLECTION_MAP: Record<SyncCollection, CollectionMapping> = {
  patients: {
    storageKey: 'say_clinic_patients',
    eventName: 'say_clinic_patients_changed',
  },
  patient_records: {
    storageKey: 'say_clinic_patient_records',
    eventName: 'say_clinic_patient_records_changed',
  },
  clinical_timeline_profiles: {
    storageKey: 'say_clinic_clinical_timeline_profiles_v1',
    eventName: 'say_clinic_timeline_profiles_changed',
  },
  patient_surgeries: {
    storageKey: 'say_clinic_patient_surgeries',
    eventName: 'say_clinic_patient_surgeries_changed',
  },
  patient_plans: {
    storageKey: 'say_clinic_patient_plans',
    eventName: 'say_clinic_patient_plans_changed',
  },
  patient_presence: {
    storageKey: 'say_clinic_patient_presence',
    eventName: 'say_clinic_patient_presence_changed',
  },
  custom_macros: {
    storageKey: 'say_clinic_custom_macros',
    eventName: 'say_clinic_custom_macros_changed',
  },
  aesthetic_sessions: {
    storageKey: 'say_clinic_aesthetic_sessions',
    eventName: 'say_clinic_aesthetic_sessions_changed',
  },
  calendar_events: {
    storageKey: 'say_clinic_calendar_events',
    eventName: 'say_clinic_calendar_events_changed',
  },
  sales: {
    storageKey: 'say_clinic_sales_v1',
    eventName: 'say_clinic_sales_changed',
  },
  invoices: {
    storageKey: 'say_clinic_invoices_v1',
    eventName: 'say_clinic_invoices_changed',
  },
  inventory: {
    storageKey: 'say_clinic_inventory_v1',
    eventName: 'say_clinic_inventory_changed',
  },
  inventory_logs: {
    storageKey: 'say_clinic_inventory_logs_v1',
    eventName: 'say_clinic_material_usage_logged',
  },
  opiates: {
    storageKey: 'say_clinic_opiates_v1',
    eventName: 'say_clinic_opiates_changed',
  },
  opiate_logs: {
    storageKey: 'say_clinic_opiate_logs_v1',
    eventName: 'say_clinic_opiate_logs_changed',
  },
  projects: {
    storageKey: 'say_clinic_projects',
    eventName: 'say_clinic_projects_changed',
  },
  custom_avatars: {
    storageKey: 'say_clinic_custom_avatars',
    eventName: 'say_clinic_avatars_changed',
  },
  users_updated: {
    storageKey: 'say_clinic_users_custom',
    eventName: 'say_clinic_users_updated',
  },
  audit_logs: {
    storageKey: 'say_clinic_audit_logs_v1',
    eventName: 'say_clinic_audit_log_added',
  },
};

let eventSource: EventSource | null = null;
let broadcastChannel: BroadcastChannel | null = null;
let isInitialized = false;
let reconnectTimer: any = null;
let reconnectAttempts = 0;

export const RealtimeSyncService = {
  // Inicializácia real-time synchronizácie pri štarte aplikácie
  init(): void {
    if (typeof window === 'undefined' || isInitialized) return;
    isInitialized = true;

    // 1. Lokálny kanál pre bleskovú synchronizáciu medzi kartami v rovnakom prehliadači (0ms)
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        broadcastChannel = new BroadcastChannel('say_clinic_realtime_channel');
        broadcastChannel.onmessage = (event) => {
          const { collection, data } = event.data || {};
          if (collection && data !== undefined) {
            this.applyIncomingUpdate(collection, data, false);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel nie je podporovaný:', e);
      }
    }

    // 2. Úvodné stiahnutie centrálnych dát zo servera (initial hydration)
    this.hydrateFromServer();

    // 3. Spustenie real-time SSE spojenia so serverom
    this.connectSSE();
  },

  // Pripojenie k Server-Sent Events streamu
  connectSSE(): void {
    if (typeof window === 'undefined') return;
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }

    try {
      eventSource = new EventSource('/api/sync/events');

      eventSource.onopen = () => {
        reconnectAttempts = 0;
        window.dispatchEvent(new CustomEvent('say_clinic_realtime_status', { detail: { status: 'connected' } }));
      };

      eventSource.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.type === 'change' && payload.collection) {
            this.applyIncomingUpdate(payload.collection, payload.data, false);
          }
        } catch (parseErr) {
          console.error('Chyba spracovania SSE správy:', parseErr);
        }
      };

      eventSource.onerror = () => {
        window.dispatchEvent(new CustomEvent('say_clinic_realtime_status', { detail: { status: 'reconnecting' } }));
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }

        // Automatické znovupripojenie s exponenciálnym spätným intervalom
        reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts), 15000);
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(() => {
          this.connectSSE();
        }, delay);
      };
    } catch (err) {
      console.warn('Nepodarilo sa spustiť SSE stream:', err);
    }
  },

  // Aplikovanie prichádzajúcej zmeny z iného počítača do lokálnej pamäte a notifikácia UI
  applyIncomingUpdate(collection: SyncCollection | string, data: any, notifyBroadcastChannel = true): void {
    const mapping = COLLECTION_MAP[collection as SyncCollection];
    if (!mapping) return;

    try {
      const currentRaw = localStorage.getItem(mapping.storageKey);
      const incomingRaw = JSON.stringify(data);

      // Ak je obsah identický, nevysielame zbytočné re-rendery
      if (currentRaw === incomingRaw) return;

      localStorage.setItem(mapping.storageKey, incomingRaw);

      // Oznámime komponentom v aplikácii novú verziu dát
      window.dispatchEvent(new CustomEvent(mapping.eventName, { detail: data }));
      window.dispatchEvent(new CustomEvent('say_clinic_global_sync', { detail: { collection, data } }));

      // Ak zmena prišla cez SSE, odošleme ju aj do ostatných kariet lokálneho prehliadača
      if (notifyBroadcastChannel && broadcastChannel) {
        broadcastChannel.postMessage({ collection, data });
      }
    } catch (e) {
      console.error(`Chyba pri ukladaní prichádzajúcej zmeny pre ${collection}:`, e);
    }
  },

  // Zverejnenie zmeny: Uloží lokálne, rozošle do lokálnych kariet a cez POST na server pre všetky ostatné počítače
  publish(collection: SyncCollection, data: any, sourceUserId?: string): void {
    if (typeof window === 'undefined') return;

    const mapping = COLLECTION_MAP[collection];
    if (!mapping) return;

    // 1. Optimistic lokálny zápis a dispatch (iba ak sa obsah reálne zmenil)
    try {
      const currentRaw = localStorage.getItem(mapping.storageKey);
      const incomingRaw = JSON.stringify(data);
      if (currentRaw === incomingRaw) {
        return;
      }
      localStorage.setItem(mapping.storageKey, incomingRaw);
      window.dispatchEvent(new CustomEvent(mapping.eventName, { detail: data }));
    } catch (e) {
      console.error(`Chyba lokálneho uloženia ${collection}:`, e);
    }

    // 2. Broadcast lokálnym kartám
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage({ collection, data });
      } catch (bcErr) {}
    }

    // 3. Odoslanie na centrálny server SAY CLINIC pre okamžitý broadcast ostatným počítačom
    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        collection,
        data,
        sourceUserId: sourceUserId || 'local_user',
      }),
    }).catch((err) => {
      console.warn(`Nepodarilo sa odoslať zmenu ${collection} na server:`, err);
    });
  },

  // Úvodné zosúladenie so serverom pri načítaní stránky
  async hydrateFromServer(): Promise<void> {
    try {
      const res = await fetch('/api/sync');
      if (!res.ok) return;
      const json = await res.json();
      if (!json.success || !json.data) return;

      const serverData = json.data;
      const toSeedToServer: Record<string, any> = {};

      for (const [colKey, mapping] of Object.entries(COLLECTION_MAP)) {
        const col = colKey as SyncCollection;
        const sVal = serverData[col];
        const localRaw = localStorage.getItem(mapping.storageKey);

        if (sVal !== undefined && sVal !== null) {
          // Server má dáta -> aktualizujeme lokálny cache ak je odlišný
          if (localRaw !== JSON.stringify(sVal)) {
            localStorage.setItem(mapping.storageKey, JSON.stringify(sVal));
            window.dispatchEvent(new CustomEvent(mapping.eventName, { detail: sVal }));
          }
        } else if (localRaw) {
          // Server ešte tieto dáta nemá, ale lokálny počítač áno -> odošleme ich na server na počiatočné nasadenie
          try {
            const parsed = JSON.parse(localRaw);
            if (Array.isArray(parsed) ? parsed.length > 0 : Object.keys(parsed).length > 0) {
              toSeedToServer[col] = parsed;
            }
          } catch (e) {}
        }
      }

      // Ak sme našli lokálne dáta, ktoré na serveri chýbali, pošleme ich
      for (const [col, data] of Object.entries(toSeedToServer)) {
        fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ collection: col, data, sourceUserId: 'seed' }),
        }).catch(() => {});
      }
    } catch (err) {
      console.warn('Hydratácia zo servera nebola úspešná, pokračuje sa s lokálnymi dátami:', err);
    }
  },

  // Pomocná funkcia na prihlásenie sa k odberu zmien kolekcie v komponente
  subscribe(collection: SyncCollection, callback: (data: any) => void): () => void {
    if (typeof window === 'undefined') return () => {};

    const mapping = COLLECTION_MAP[collection];
    if (!mapping) return () => {};

    const handler = (e: any) => {
      callback(e.detail);
    };

    window.addEventListener(mapping.eventName, handler);
    return () => {
      window.removeEventListener(mapping.eventName, handler);
    };
  },

  // Odoslanie prítomnosti (Heartbeat), že používateľ má kartu pacienta otvorenú
  reportPresence(
    patientId: string,
    user: { id: string; name: string; title?: string; role: string; avatarUrl?: string }
  ): void {
    if (typeof window === 'undefined' || !patientId || !user?.id) return;
    this.publish('patient_presence', {
      action: 'heartbeat',
      patientId,
      userId: user.id,
      userName: user.name,
      userTitle: user.title,
      userRole: user.role,
      avatarUrl: user.avatarUrl,
    }, user.id);
  },

  // Odchod z karty pacienta
  leavePresence(patientId: string, userId: string): void {
    if (typeof window === 'undefined' || !patientId || !userId) return;
    this.publish('patient_presence', {
      action: 'leave',
      patientId,
      userId,
    }, userId);
  },

  // Získanie kolegov, ktorí majú aktuálne tohto pacienta otvoreného (okrem prihláseného používateľa)
  getConcurrentUsersForPatient(patientId: string, currentUserId?: string): any[] {
    if (typeof window === 'undefined' || !patientId) return [];
    try {
      const stored = localStorage.getItem('say_clinic_patient_presence');
      if (!stored) return [];
      const map: Record<string, Record<string, any>> = JSON.parse(stored);
      const patientUsers = map[patientId];
      if (!patientUsers) return [];

      const now = Date.now();
      return Object.values(patientUsers).filter((u: any) => {
        return u.userId !== currentUserId && (now - (u.lastSeen || 0) < 40000);
      });
    } catch {
      return [];
    }
  },
};
