import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { SSEHub } from '@/lib/sseHub';

const SEED_DATA_FILE = path.join(process.cwd(), 'src', 'data', 'clinic_data.json');
const RUNTIME_DATA_FILE = path.join(process.cwd(), '.next', 'cache', 'clinic_data_runtime.json');

// In-memory stav pre Live Presence a cache dát (aby sme pri každom heartbeate/syncu neprepisovali súbor v src/ a nespúšťali Next.js Fast Refresh loop)
const globalForSync = globalThis as unknown as {
  __sayClinicPresenceMap?: Record<string, Record<string, any>>;
  __sayClinicDataCache?: Record<string, any> | null;
};
if (!globalForSync.__sayClinicPresenceMap) {
  globalForSync.__sayClinicPresenceMap = {};
}

// Bezpečné načítanie centrálnych klinických dát zo servera
function readClinicData(): Record<string, any> {
  if (globalForSync.__sayClinicDataCache) {
    return globalForSync.__sayClinicDataCache;
  }
  try {
    let baseData: Record<string, any> = {};
    if (fs.existsSync(SEED_DATA_FILE)) {
      const content = fs.readFileSync(SEED_DATA_FILE, 'utf-8');
      baseData = JSON.parse(content);
    }
    if (fs.existsSync(RUNTIME_DATA_FILE)) {
      try {
        const runtimeContent = fs.readFileSync(RUNTIME_DATA_FILE, 'utf-8');
        const runtimeData = JSON.parse(runtimeContent);
        // Zlúčime runtime zmeny so seed dátami (so zachovaním reálnych kontaktov pacientov)
        for (const [key, val] of Object.entries(runtimeData)) {
          if (key === 'patients' && Array.isArray(val) && Array.isArray(baseData.patients)) {
            baseData.patients = mergeClinicalCollection('patients', baseData.patients, val);
          } else {
            baseData[key] = val;
          }
        }
      } catch {}
    }
    globalForSync.__sayClinicDataCache = baseData;
    return baseData;
  } catch (err) {
    console.error('Chyba pri čítaní clinic_data.json na serveri:', err);
  }
  return {};
}

// Bezpečný zápis centrálnych dát mimo sledovaný src/ priečinok (do .next/cache), aby Webpack nespúšťal nekonečný reload stránky
function writeClinicData(data: Record<string, any>): boolean {
  try {
    globalForSync.__sayClinicDataCache = data;
    const dir = path.dirname(RUNTIME_DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(RUNTIME_DATA_FILE, JSON.stringify(data), 'utf-8');
    return true;
  } catch (err) {
    console.error('Chyba pri zápise do clinic_data_runtime.json na serveri:', err);
    return false;
  }
}

// GET /api/sync - vráti centrálne klinické dáta pre hydratáciu alebo kontrolu stavu
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const collection = searchParams.get('collection');
    const allData = readClinicData();

    if (collection) {
      return NextResponse.json({
        success: true,
        collection,
        data: allData[collection] !== undefined ? allData[collection] : null,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      data: allData,
      timestamp: new Date().toISOString(),
      activeClients: SSEHub.getActiveCount(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Chyba servera pri čítaní dát' },
      { status: 500 }
    );
  }
}

// Pomocná funkcia na inteligentné zlučovanie záznamov bez straty dát lekara ani sestry
function mergeClinicalCollection(collection: string, existing: any, incoming: any): any {
  if (!existing) return incoming;
  if (!incoming) return existing;

  // 1. Pre záznamy pacientov: { [patientId]: PatientRecord[] }
  if (collection === 'patient_records') {
    const merged: Record<string, any[]> = { ...existing };
    for (const [patientId, incRecords] of Object.entries(incoming as Record<string, any[]>)) {
      if (!Array.isArray(incRecords)) continue;
      const existRecords = merged[patientId] || [];
      const map = new Map<string, any>();
      
      existRecords.forEach(r => {
        if (r && r.id) map.set(r.id, r);
      });

      incRecords.forEach(r => {
        if (!r || !r.id) return;
        const old = map.get(r.id);
        if (!old) {
          map.set(r.id, r);
        } else {
          // Ak položka existuje na oboch stranách, zoberieme novšiu verziu
          const oldTime = new Date(old.updatedAt || old.date || 0).getTime();
          const newTime = new Date(r.updatedAt || r.date || 0).getTime();
          map.set(r.id, newTime >= oldTime ? r : old);
        }
      });

      merged[patientId] = Array.from(map.values()).sort((a, b) => {
        const tA = new Date(a.date || a.createdAt || 0).getTime();
        const tB = new Date(b.date || b.createdAt || 0).getTime();
        return tB - tA; // Chronologicky od najnovšieho
      });
    }
    return merged;
  }

  // 2. Pre časovú os a klinické profily: { [patientId]: { clinicalNotes: ClinicalNote[], ... } }
  if (collection === 'clinical_timeline_profiles') {
    const merged: Record<string, any> = { ...existing };
    for (const [patientId, incProfile] of Object.entries(incoming as Record<string, any>)) {
      if (!incProfile) continue;
      const existProfile = merged[patientId] || {};
      const mapNotes = new Map<string, any>();

      (existProfile.clinicalNotes || []).forEach((n: any) => {
        if (n && n.id) mapNotes.set(n.id, n);
      });

      (incProfile.clinicalNotes || []).forEach((n: any) => {
        if (n && n.id) {
          const old = mapNotes.get(n.id);
          if (!old) {
            mapNotes.set(n.id, n);
          } else {
            const oldT = new Date(old.createdAt || 0).getTime();
            const newT = new Date(n.createdAt || 0).getTime();
            mapNotes.set(n.id, newT >= oldT ? n : old);
          }
        }
      });

      merged[patientId] = {
        ...existProfile,
        ...incProfile,
        clinicalNotes: Array.from(mapNotes.values()).sort((a: any, b: any) => {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        })
      };
    }
    return merged;
  }

  // 3. Pre zoznam pacientov: Patient[]
  if (collection === 'patients' && Array.isArray(incoming) && Array.isArray(existing)) {
    const map = new Map<string, any>();
    existing.forEach(p => { if (p && p.id) map.set(p.id, p); });
    incoming.forEach(p => {
      if (p && p.id) {
        const old = map.get(p.id);
        if (!old) {
          map.set(p.id, p);
        } else {
          // Nikdy neprepíšeme reálne kontaktné údaje zo Sheetu (RČ, tel, email) prázdnymi "Importované z Drive" hodnotami
          const oldHasRealRC = old.birthNumber && old.birthNumber !== 'Importované z Drive' && old.birthNumber !== '---';
          const newHasDummyRC = !p.birthNumber || p.birthNumber === 'Importované z Drive' || p.birthNumber === '---';
          const oldT = new Date(old.updatedAt || 0).getTime();
          const newT = new Date(p.updatedAt || 0).getTime();
          const base = newT >= oldT ? { ...old, ...p } : { ...p, ...old };
          if (oldHasRealRC && newHasDummyRC) {
            base.birthNumber = old.birthNumber;
            base.dob = old.dob && old.dob !== '---' ? old.dob : p.dob;
            base.phone = old.phone && old.phone !== '---' ? old.phone : p.phone;
            base.email = old.email && old.email !== '---' ? old.email : p.email;
            base.address = old.address && old.address !== '---' ? old.address : p.address;
            base.sheetStatus = old.sheetStatus || p.sheetStatus;
          }
          map.set(p.id, base);
        }
      }
    });
    return Array.from(map.values());
  }

  // Pre ostatné kolekcie vrátime prichádzajúce dáta
  return incoming;
}

// POST /api/sync - aktualizácia dát na serveri s okamžitým real-time broadcastom pre všetky počítače
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { collection, data, sourceUserId } = body;

    if (!collection) {
      return NextResponse.json(
        { success: false, error: 'Chýba názov kolekcie (collection)' },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();
    const nowMs = Date.now();

    // Špeciálne spracovanie pre Live Presence (Kto má pacienta otvoreného) - čisto v pamäti RAM bez prepisovania disku!
    if (collection === 'patient_presence') {
      const presenceMap: Record<string, Record<string, any>> = globalForSync.__sayClinicPresenceMap || {};
      const { action, patientId, userId, userName, userTitle, userRole, avatarUrl } = data || {};

      if (patientId && userId) {
        if (!presenceMap[patientId]) presenceMap[patientId] = {};
        
        if (action === 'leave') {
          delete presenceMap[patientId][userId];
        } else {
          // 'join' alebo 'heartbeat'
          presenceMap[patientId][userId] = {
            userId,
            userName: userName || 'Kolega',
            userTitle: userTitle || '',
            userRole: userRole || 'staff',
            avatarUrl: avatarUrl || '',
            lastSeen: nowMs,
          };
        }
      }

      // Prečistenie neaktívnych prítomností starších ako 40 sekúnd
      for (const pId of Object.keys(presenceMap)) {
        for (const uId of Object.keys(presenceMap[pId])) {
          if (nowMs - presenceMap[pId][uId].lastSeen > 40000) {
            delete presenceMap[pId][uId];
          }
        }
        if (Object.keys(presenceMap[pId]).length === 0) {
          delete presenceMap[pId];
        }
      }

      globalForSync.__sayClinicPresenceMap = presenceMap;

      // Okamžitý broadcast prítomnosti
      SSEHub.broadcast({
        type: 'change',
        collection: 'patient_presence',
        data: presenceMap,
        sourceUserId,
        timestamp: nowIso,
      });

      return NextResponse.json({
        success: true,
        collection: 'patient_presence',
        data: presenceMap,
        timestamp: nowIso,
      });
    }

    const currentData = readClinicData();

    // Inteligentné zlúčenie klinických dát s existujúcim stavom servera
    const mergedData = mergeClinicalCollection(collection, currentData[collection], data);

    // Zápis na disk vykonáme IBA vtedy, ak sa obsah kolekcie reálne zmenil (zabraňuje zbytočnému disk I/O a dev server reloadom)
    const existingSerialized = JSON.stringify(currentData[collection]);
    const mergedSerialized = JSON.stringify(mergedData);

    if (existingSerialized !== mergedSerialized) {
      currentData[collection] = mergedData;
      currentData[`_${collection}_updatedAt`] = nowIso;
      currentData[`_${collection}_updatedBy`] = sourceUserId || 'system';

      const written = writeClinicData(currentData);
      if (!written) {
        return NextResponse.json(
          { success: false, error: 'Nepodarilo sa uložiť dáta na server' },
          { status: 500 }
        );
      }

      // Okamžitý broadcast cez SSE do všetkých otvorených prehliadačov a počítačov kliniky!
      SSEHub.broadcast({
        type: 'change',
        collection,
        data: mergedData,
        sourceUserId,
        timestamp: nowIso,
      });
    }

    return NextResponse.json({
      success: true,
      collection,
      data: mergedData,
      timestamp: nowIso,
      activeClients: SSEHub.getActiveCount(),
    });
  } catch (error: any) {
    console.error('Chyba v POST /api/sync:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Chyba spracovania synchronizácie' },
      { status: 500 }
    );
  }
}
