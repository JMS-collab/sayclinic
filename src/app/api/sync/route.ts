import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { SSEHub } from '@/lib/sseHub';

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'clinic_data.json');

// Bezpečné načítanie centrálnych klinických dát zo servera
function readClinicData(): Record<string, any> {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Chyba pri čítaní clinic_data.json na serveri:', err);
  }
  return {};
}

// Bezpečný zápis centrálnych dát na disk servera
function writeClinicData(data: Record<string, any>): boolean {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Chyba pri zápise do clinic_data.json na serveri:', err);
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
          const oldT = new Date(old.updatedAt || 0).getTime();
          const newT = new Date(p.updatedAt || 0).getTime();
          map.set(p.id, newT >= oldT ? p : old);
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

    const currentData = readClinicData();
    const nowIso = new Date().toISOString();
    const nowMs = Date.now();

    // Špeciálne spracovanie pre Live Presence (Kto má pacienta otvoreného)
    if (collection === 'patient_presence') {
      const presenceMap: Record<string, Record<string, any>> = currentData.patient_presence || {};
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

      currentData.patient_presence = presenceMap;
      writeClinicData(currentData);

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

    // Inteligentné zlúčenie klinických dát s existujúcim stavom servera
    const mergedData = mergeClinicalCollection(collection, currentData[collection], data);

    // Aktualizácia kolekcie v databáze servera
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
