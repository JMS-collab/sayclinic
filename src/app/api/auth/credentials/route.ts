import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Cesta k trvalému serverovému úložisku poverení
const CREDENTIALS_FILE = path.join(process.cwd(), 'src', 'data', 'credentials.json');

const DEFAULT_INITIAL_PASSWORD = 'SayClinic2026!';

interface CredentialEntry {
  passwordHash: string;
  isCustomPassword: boolean;
  updatedAt: string;
}

interface StoredCredentials {
  [key: string]: CredentialEntry;
}

// Načítanie poverení zo serverového súboru
function readServerCredentials(): StoredCredentials {
  try {
    if (fs.existsSync(CREDENTIALS_FILE)) {
      const data = fs.readFileSync(CREDENTIALS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Chyba pri čítaní credentials.json na serveri:', err);
  }
  return {};
}

// Zápis poverení do serverového súboru
function writeServerCredentials(creds: StoredCredentials): boolean {
  try {
    const dir = path.dirname(CREDENTIALS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(creds, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Chyba pri zápise do credentials.json na serveri:', err);
    return false;
  }
}

// Mapovanie aliasov pre SAY CLINIC tím
const ALIAS_MAP: Record<string, string[]> = {
  u1: ['mraz@sayclinic.sk'],
  u2: ['srokova@sayclinic.sk'],
  u3: ['tran@sayclinic.sk'],
  u4: ['mecerodova@sayclinic.sk'],
  u5: ['solivajsova@sayclinic.sk'],
  u6: ['foltani@sayclinic.sk'],
  u7: ['lenhartova@sayclinic.sk'],
  u8: ['anesteziolog@sayclinic.sk', 'anestezia@sayclinic.sk'],
  u9: ['anest.sestra@sayclinic.sk', 'anesteziologicka.sestra@sayclinic.sk', 'anesteziologickasestra@sayclinic.sk'],
  u10: ['foltaniova@sayclinic.sk', 'viktoria.foltaniova@sayclinic.sk', 'viktoria@sayclinic.sk'],
};

// GET /api/auth/credentials - vráti centrálne uložené heslá pre synchronizáciu naprieč počítačmi
export async function GET(req: NextRequest) {
  try {
    const creds = readServerCredentials();
    return NextResponse.json({
      success: true,
      credentials: creds,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Chyba servera' },
      { status: 500 }
    );
  }
}

// POST /api/auth/credentials - aktualizácia alebo overenie hesla centrálne na serveri
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, userId, identifier, password, newPassword, credentials } = body;

    const currentCreds = readServerCredentials();

    // 1. Overenie hesla na serveri (pre akýkoľvek počítač)
    if (action === 'verify') {
      const idKey = (identifier || userId || '').toLowerCase().trim();
      let userRecord = currentCreds[idKey];
      
      if (!userRecord) {
        for (const [uid, aliases] of Object.entries(ALIAS_MAP)) {
          if (idKey === uid || aliases.includes(idKey)) {
            userRecord = currentCreds[uid] || currentCreds[aliases[0]];
            break;
          }
        }
      }
      
      let isValid = false;
      if (!userRecord) {
        // Ak záznam neexistuje, porovná sa s predvoleným heslom
        isValid = password === DEFAULT_INITIAL_PASSWORD;
      } else if (userRecord.isCustomPassword) {
        // Ak má používateľ nastavené vlastné heslo, predvolené počiatočné heslo už neplatí
        isValid = userRecord.passwordHash === password;
      } else {
        isValid = password === DEFAULT_INITIAL_PASSWORD || userRecord.passwordHash === password;
      }

      return NextResponse.json({
        success: true,
        valid: isValid,
        isCustomPassword: userRecord ? userRecord.isCustomPassword : false,
        updatedAt: userRecord ? userRecord.updatedAt : undefined,
      });
    }

    // 2. Aktualizácia hesla (prenesie sa na všetky počítače a zariadenia)
    if (action === 'update') {
      const idKey = (userId || identifier || '').toLowerCase().trim();
      if (!idKey || !newPassword) {
        return NextResponse.json(
          { success: false, error: 'Chýba identifikátor používateľa alebo nové heslo.' },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: 'Nové heslo musí mať minimálne 6 znakov.' },
          { status: 400 }
        );
      }

      const now = new Date().toISOString();
      const newEntry: CredentialEntry = {
        passwordHash: newPassword,
        isCustomPassword: true,
        updatedAt: now,
      };

      // Aktualizujeme daný kľúč
      currentCreds[idKey] = newEntry;

      // Zistíme, či patrí do SAY CLINIC tímu a aktualizujeme všetky aliasy (ID aj e-maily)
      for (const [uid, aliases] of Object.entries(ALIAS_MAP)) {
        if (idKey === uid || aliases.includes(idKey)) {
          currentCreds[uid] = newEntry;
          for (const alias of aliases) {
            currentCreds[alias] = newEntry;
          }
          break;
        }
      }

      const written = writeServerCredentials(currentCreds);
      if (!written) {
        return NextResponse.json(
          { success: false, error: 'Nepodarilo sa uložiť heslo do súboru na serveri.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Heslo bolo úspešne zmenené a synchronizované na serveri pre všetky počítače.',
        updatedAt: now,
      });
    }

    // 3. Obojsmerná synchronizácia (mergovanie s klientskym stavom)
    if (action === 'sync') {
      const clientCreds: StoredCredentials = credentials || {};
      let changed = false;

      for (const [key, clientEntry] of Object.entries(clientCreds)) {
        const serverEntry = currentCreds[key];
        if (!serverEntry) {
          currentCreds[key] = clientEntry;
          changed = true;
        } else if (
          clientEntry.isCustomPassword &&
          (!serverEntry.isCustomPassword ||
            new Date(clientEntry.updatedAt) > new Date(serverEntry.updatedAt))
        ) {
          currentCreds[key] = clientEntry;
          changed = true;
        }
      }

      if (changed) {
        writeServerCredentials(currentCreds);
      }

      return NextResponse.json({
        success: true,
        credentials: currentCreds,
      });
    }

    return NextResponse.json({ success: false, error: 'Neznáma akcia' }, { status: 400 });
  } catch (error: any) {
    console.error('Chyba v POST /api/auth/credentials:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Chyba spracovania požiadavky' },
      { status: 500 }
    );
  }
}
