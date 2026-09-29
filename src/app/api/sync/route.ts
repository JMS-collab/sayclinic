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

    // Aktualizácia kolekcie v databáze servera
    currentData[collection] = data;
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
      data,
      sourceUserId,
      timestamp: nowIso,
    });

    return NextResponse.json({
      success: true,
      collection,
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
