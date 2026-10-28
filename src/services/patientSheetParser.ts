/**
 * SAY CLINIC - Inteligentný parser údajov pacienta z Google Sheetu / Excelu / CSV
 * Dokáže rozpoznať kontaktné a identifikačné údaje v rôznych formátoch:
 * 1. Formulárové rozloženie (stĺpec A: Názov poľa, stĺpec B: Hodnota)
 * 2. Tabuľkové riadkové rozloženie (riadok 1: Hlavička, riadok 2: Hodnoty)
 * 3. Textové bunky obsahujúce kľúč aj hodnotu (napr. "Telefón: +421 905 123 456")
 * 4. Regex extrakcia špecifických vzorov (slovenské RČ, telefónne čísla, e-maily, dátumy)
 */

import * as XLSX from 'xlsx';

export interface ExtractedPatientData {
  name?: string;
  birthNumber?: string;
  dob?: string;
  phone?: string;
  email?: string;
  address?: string;
  insurance?: string;
  allergies?: string[];
  notes?: string;
  sourceFileName?: string;
  extractedFieldsCount: number;
}

/**
 * Odvodenie dátumu narodenia a pohlavia zo slovenského rodného čísla
 */
export function deriveDobFromBirthNumber(rc: string): string | undefined {
  const clean = rc.replace(/\D/g, '');
  if (clean.length !== 9 && clean.length !== 10) return undefined;

  let yearPrefix = 1900;
  const yy = parseInt(clean.substring(0, 2), 10);
  let mm = parseInt(clean.substring(2, 4), 10);
  const dd = parseInt(clean.substring(4, 6), 10);

  // Ženy majú k mesiacu pripočítané 50 (niekedy 20 pri špeciálnych prípadoch)
  if (mm > 50) mm -= 50;
  if (mm > 20) mm -= 20;

  if (clean.length === 10) {
    // 10-miestne RČ: ak rok < 54 (od roku 1954 sa zaviedli 10-miestne), môže ísť o 2000+
    yearPrefix = yy < 54 ? 2000 : 1900;
  } else {
    // 9-miestne RČ boli vydávané do roku 1953
    yearPrefix = 1900;
  }

  const fullYear = yearPrefix + yy;
  if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(dd)}.${pad(mm)}.${fullYear}`;
  }

  return undefined;
}

/**
 * Formátovanie telefónneho čísla do štandardizovaného slovenského tvaru
 */
export function normalizePhoneNumber(raw: string): string {
  const cleaned = raw.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+421') && cleaned.length >= 12) {
    // +421 905 123 456
    const num = cleaned.substring(4);
    if (num.length === 9) {
      return `+421 ${num.substring(0, 3)} ${num.substring(3, 6)} ${num.substring(6)}`;
    }
    return cleaned;
  }
  if (cleaned.startsWith('00421') && cleaned.length >= 14) {
    const num = cleaned.substring(5);
    if (num.length === 9) {
      return `+421 ${num.substring(0, 3)} ${num.substring(3, 6)} ${num.substring(6)}`;
    }
  }
  if (cleaned.startsWith('09') && cleaned.length === 10) {
    return `${cleaned.substring(0, 4)} ${cleaned.substring(4, 7)} ${cleaned.substring(7)}`;
  }
  return raw.trim();
}

/**
 * Vyčistenie a normalizácia rodného čísla (formát: 123456/7890)
 */
export function normalizeBirthNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.substring(0, 6)}/${digits.substring(6)}`;
  }
  if (digits.length === 9) {
    return `${digits.substring(0, 6)}/${digits.substring(6)}`;
  }
  return raw.trim();
}

/**
 * Normalizácia zdravotnej poisťovne
 */
export function normalizeInsurance(raw: string): string {
  const lower = raw.toLowerCase().trim();
  if (lower.includes('24') || lower.includes('dôver') || lower.includes('dovera')) {
    return '24 (Dôvera)';
  }
  if (lower.includes('25') || lower.includes('všzp') || lower.includes('vszp') || lower.includes('všeobecn')) {
    return '25 (VšZP)';
  }
  if (lower.includes('27') || lower.includes('union')) {
    return '27 (Union)';
  }
  if (lower.includes('samoplatca') || lower.includes('private') || lower.includes('priama')) {
    return 'Samoplatca';
  }
  return raw.trim();
}

/**
 * Hlavná funkcia na parsovanie 2D matice buniek (z XLSX alebo CSV)
 */
export function parseSheetGrid(grid: any[][], patientNameHint?: string): ExtractedPatientData {
  const result: ExtractedPatientData = {
    extractedFieldsCount: 0
  };

  const foundFields = new Set<string>();

  // 1. Priechod bunkami pre formulárový formát (Kľúč v bunke X, hodnota v bunke X+1 alebo pod ňou)
  for (let r = 0; r < grid.length; r++) {
    const row = grid[r] || [];
    for (let c = 0; c < row.length; c++) {
      const cell = String(row[c] || '').trim();
      if (!cell) continue;

      const lowerCell = cell.toLowerCase();

      // Pomocná funkcia na získanie susednej hodnoty
      const getNextVal = (): string => {
        // Skúsime bunku vpravo (stĺpec c+1)
        if (c + 1 < row.length && String(row[c + 1] || '').trim()) {
          return String(row[c + 1]).trim();
        }
        // Skúsime bunku pod ňou (riadok r+1, stĺpec c)
        if (r + 1 < grid.length && String(grid[r + 1][c] || '').trim()) {
          return String(grid[r + 1][c]).trim();
        }
        return '';
      };

      // TELEFÓN
      if (!result.phone && (
        lowerCell === 'telefón' || lowerCell === 'telefon' || lowerCell === 'tel' || lowerCell === 'mobil' || 
        lowerCell === 'telefónne číslo' || lowerCell === 'telefonne cislo' || lowerCell === 'tel.' || lowerCell.startsWith('tel:')
      )) {
        let val = getNextVal();
        if (!val && cell.includes(':')) {
          val = cell.split(':')[1]?.trim() || '';
        }
        if (val) {
          result.phone = normalizePhoneNumber(val);
          foundFields.add('phone');
        }
      }

      // EMAIL
      if (!result.email && (
        lowerCell === 'email' || lowerCell === 'e-mail' || lowerCell === 'mail' || lowerCell.startsWith('email:') || lowerCell.startsWith('e-mail:')
      )) {
        let val = getNextVal();
        if (!val && cell.includes(':')) {
          val = cell.split(':')[1]?.trim() || '';
        }
        if (val && val.includes('@')) {
          result.email = val.trim();
          foundFields.add('email');
        }
      }

      // RODNÉ ČÍSLO
      if (!result.birthNumber && (
        lowerCell === 'rodné číslo' || lowerCell === 'rodne cislo' || lowerCell === 'rč' || lowerCell === 'rc' || lowerCell === 'r.č.' || lowerCell.startsWith('rč:')
      )) {
        let val = getNextVal();
        if (!val && cell.includes(':')) {
          val = cell.split(':')[1]?.trim() || '';
        }
        if (val) {
          const norm = normalizeBirthNumber(val);
          if (norm.replace(/\D/g, '').length >= 9) {
            result.birthNumber = norm;
            foundFields.add('birthNumber');
            if (!result.dob) {
              const derived = deriveDobFromBirthNumber(norm);
              if (derived) {
                result.dob = derived;
                foundFields.add('dob');
              }
            }
          }
        }
      }

      // DÁTUM NARODENIA
      if (!result.dob && (
        lowerCell.includes('dátum narodenia') || lowerCell.includes('datum narodenia') || lowerCell === 'narodený' || lowerCell === 'narodená' || lowerCell === 'dob'
      )) {
        let val = getNextVal();
        if (!val && cell.includes(':')) {
          val = cell.split(':')[1]?.trim() || '';
        }
        if (val) {
          result.dob = val.trim();
          foundFields.add('dob');
        }
      }

      // ADRESA / BYDLISKO
      if (!result.address && (
        lowerCell === 'bydlisko' || lowerCell === 'adresa' || lowerCell === 'trvalý pobyt' || lowerCell === 'trvaly pobyt' || lowerCell === 'adresa trvalého pobytu' || lowerCell.startsWith('adresa:')
      )) {
        let val = getNextVal();
        if (!val && cell.includes(':')) {
          val = cell.split(':')[1]?.trim() || '';
        }
        if (val && val.length > 3) {
          result.address = val.trim();
          foundFields.add('address');
        }
      }

      // POISŤOVŇA
      if (!result.insurance && (
        lowerCell === 'poisťovňa' || lowerCell === 'poistovna' || lowerCell === 'zdravotná poisťovňa' || lowerCell === 'zp' || lowerCell.startsWith('poisťovňa:')
      )) {
        let val = getNextVal();
        if (!val && cell.includes(':')) {
          val = cell.split(':')[1]?.trim() || '';
        }
        if (val) {
          result.insurance = normalizeInsurance(val);
          foundFields.add('insurance');
        }
      }

      // MENO
      if (!result.name && (
        lowerCell === 'meno' || lowerCell === 'meno a priezvisko' || lowerCell === 'pacient' || lowerCell === 'klient'
      )) {
        const val = getNextVal();
        if (val && val.length > 3 && !val.includes('@') && !val.match(/^\+?\d/)) {
          result.name = val.trim();
          foundFields.add('name');
        }
      }
    }
  }

  // 2. Tabuľkový riadkový formát (Row Headers): Hľadáme riadok s hlavičkami
  if (foundFields.size < 2 && grid.length >= 2) {
    for (let r = 0; r < Math.min(grid.length - 1, 5); r++) {
      const headerRow = (grid[r] || []).map(c => String(c || '').toLowerCase().trim());
      const dataRow = grid[r + 1] || [];

      // Skontrolujeme, či riadok r pripomína hlavičku
      const hasPhoneHeader = headerRow.some(h => h.includes('tel') || h.includes('mobil') || h.includes('kontakt'));
      const hasMailHeader = headerRow.some(h => h.includes('mail'));
      const hasRcHeader = headerRow.some(h => h.includes('rodn') || h === 'rč' || h === 'rc');

      if (hasPhoneHeader || hasMailHeader || hasRcHeader) {
        headerRow.forEach((colName, cIdx) => {
          const val = String(dataRow[cIdx] || '').trim();
          if (!val) return;

          if (!result.phone && (colName.includes('tel') || colName.includes('mobil') || colName.includes('kontakt'))) {
            result.phone = normalizePhoneNumber(val);
            foundFields.add('phone');
          }
          if (!result.email && colName.includes('mail') && val.includes('@')) {
            result.email = val;
            foundFields.add('email');
          }
          if (!result.birthNumber && (colName.includes('rodn') || colName === 'rč' || colName === 'rc')) {
            const norm = normalizeBirthNumber(val);
            result.birthNumber = norm;
            foundFields.add('birthNumber');
            if (!result.dob) {
              const d = deriveDobFromBirthNumber(norm);
              if (d) {
                result.dob = d;
                foundFields.add('dob');
              }
            }
          }
          if (!result.address && (colName.includes('adresa') || colName.includes('bydlisko') || colName.includes('pobyt') || colName.includes('mesto'))) {
            result.address = val;
            foundFields.add('address');
          }
          if (!result.dob && (colName.includes('narod') || colName === 'dob')) {
            result.dob = val;
            foundFields.add('dob');
          }
          if (!result.insurance && (colName.includes('poist') || colName === 'zp')) {
            result.insurance = normalizeInsurance(val);
            foundFields.add('insurance');
          }
          if (!result.name && (colName.includes('meno') || colName.includes('klient') || colName.includes('pacient'))) {
            result.name = val;
            foundFields.add('name');
          }
        });
      }
    }
  }

  // 3. Globálne Regex vyhľadávanie po celej tabuľke pre chýbajúce kľúčové polia
  for (let r = 0; r < grid.length; r++) {
    const row = grid[r] || [];
    for (let c = 0; c < row.length; c++) {
      const cellStr = String(row[c] || '').trim();
      if (!cellStr) continue;

      // Hľadanie e-mailu kdekoľvek v texte
      if (!result.email) {
        const mailMatch = cellStr.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        if (mailMatch) {
          result.email = mailMatch[1];
          foundFields.add('email');
        }
      }

      // Hľadanie telefónneho čísla kdekoľvek v bunke
      if (!result.phone) {
        const phoneMatch = cellStr.match(/(?:\+?421|00421|0)[\s\-\/]?(?:9\d{2}|[2-8]\d)[\s\-\/]?\d{3}[\s\-\/]?\d{3}/);
        if (phoneMatch) {
          result.phone = normalizePhoneNumber(phoneMatch[0]);
          foundFields.add('phone');
        }
      }

      // Hľadanie rodného čísla (6 číslic / 3-4 číslice)
      if (!result.birthNumber) {
        const rcMatch = cellStr.match(/\b(\d{6})\s*[\/\-]?\s*(\d{3,4})\b/);
        if (rcMatch) {
          const norm = `${rcMatch[1]}/${rcMatch[2]}`;
          result.birthNumber = norm;
          foundFields.add('birthNumber');
          if (!result.dob) {
            const derived = deriveDobFromBirthNumber(norm);
            if (derived) {
              result.dob = derived;
              foundFields.add('dob');
            }
          }
        }
      }

      // Hľadanie dátumu narodenia (DD.MM.YYYY)
      if (!result.dob) {
        const dateMatch = cellStr.match(/\b([0-3]?\d)\.([0-1]?\d)\.(19\d{2}|20\d{2})\b/);
        if (dateMatch) {
          const day = dateMatch[1].padStart(2, '0');
          const month = dateMatch[2].padStart(2, '0');
          const year = dateMatch[3];
          result.dob = `${day}.${month}.${year}`;
          foundFields.add('dob');
        }
      }
    }
  }

  // Ak meno nebolo nájdené, použijeme hint (napr. názov zložky)
  if (!result.name && patientNameHint) {
    result.name = patientNameHint;
  }

  result.extractedFieldsCount = foundFields.size;
  return result;
}

/**
 * Hlavná vstupná brána: parsuje text CSV, reťazec alebo Buffer pomocou SheetJS (xlsx)
 */
export function parsePatientSheetData(
  fileContent: string | ArrayBuffer | Uint8Array,
  fileName?: string,
  patientNameHint?: string
): ExtractedPatientData {
  try {
    let workbook: XLSX.WorkBook;

    if (typeof fileContent === 'string') {
      // Skúsime najprv či to nie je JSON (profil_klienta.json)
      if (fileContent.trim().startsWith('{') && fileContent.trim().endsWith('}')) {
        try {
          const jsonObj = JSON.parse(fileContent);
          if (jsonObj && (jsonObj.phone || jsonObj.email || jsonObj.birthNumber || jsonObj.name)) {
            return {
              name: jsonObj.name || patientNameHint,
              birthNumber: jsonObj.birthNumber && jsonObj.birthNumber !== 'Importované z Drive' ? jsonObj.birthNumber : undefined,
              dob: jsonObj.dob && jsonObj.dob !== '---' ? jsonObj.dob : undefined,
              phone: jsonObj.phone && jsonObj.phone !== '---' ? normalizePhoneNumber(jsonObj.phone) : undefined,
              email: jsonObj.email && jsonObj.email !== '---' ? jsonObj.email : undefined,
              address: jsonObj.address && jsonObj.address !== '---' ? jsonObj.address : undefined,
              insurance: jsonObj.insurance && jsonObj.insurance !== 'Drive Klient' ? jsonObj.insurance : undefined,
              allergies: Array.isArray(jsonObj.allergies) ? jsonObj.allergies : undefined,
              notes: jsonObj.notes || undefined,
              sourceFileName: fileName || 'profil_klienta.json',
              extractedFieldsCount: 5
            };
          }
        } catch {
          // Nie je validný JSON profil, pokračujeme cez SheetJS
        }
      }

      workbook = XLSX.read(fileContent, { type: 'string', raw: true });
    } else {
      workbook = XLSX.read(fileContent, { type: 'array' });
    }

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return { extractedFieldsCount: 0 };
    }

    // Prehľadáme všetky hárky (primárne prvý)
    let bestResult: ExtractedPatientData = { extractedFieldsCount: 0 };

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;

      const grid: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      if (!grid || grid.length === 0) continue;

      const res = parseSheetGrid(grid, patientNameHint);
      res.sourceFileName = fileName || sheetName;

      if (res.extractedFieldsCount > bestResult.extractedFieldsCount) {
        bestResult = res;
      }
    }

    return bestResult;
  } catch (err) {
    console.error('Chyba pri parsovaní tabuľky pacienta:', err);
    return { extractedFieldsCount: 0 };
  }
}
