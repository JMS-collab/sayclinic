/**
 * Služba pre správu 4-miestneho PIN kódu viazaného na konkrétne zariadenie (machineId)
 * v súlade so zdravotníckym štandardom 2FA kliniky SAY CLINIC.
 */

export interface DevicePinRecord {
  machineId: string;
  machineName: string;
  userId: string;
  pinHash: string;
  salt: string;
  isSet: boolean;
  updatedAt: string;
  lastVerifiedAt?: string;
}

const STORAGE_KEY_MACHINE_ID = 'say_clinic_machine_id';
const STORAGE_KEY_MACHINE_NAME = 'say_clinic_machine_name';
const STORAGE_KEY_DEVICE_PINS = 'say_clinic_device_pin_auth';
const DEFAULT_FALLBACK_PIN = '2026';

// Pomocná funkcia pre bezpečné SHA-256 hashovanie v prehliadači
async function sha256(text: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    // Jednoduchý deterministický fallback pre staršie prostredia
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return 'fallback_' + Math.abs(hash).toString(16);
  }

  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const DevicePinService = {
  /**
   * Získa alebo vytvorí trvalý unikátny identifikátor tohto počítača/zariadenia
   */
  getMachineId(): string {
    if (typeof window === 'undefined') return 'server_machine';
    try {
      let id = localStorage.getItem(STORAGE_KEY_MACHINE_ID);
      if (!id) {
        const rand = Math.random().toString(36).substring(2, 9);
        const time = Date.now().toString(36);
        id = `SAY-MAC-${time.toUpperCase()}-${rand.toUpperCase()}`;
        localStorage.setItem(STORAGE_KEY_MACHINE_ID, id);
      }
      return id;
    } catch {
      return 'temp_machine_' + Date.now();
    }
  },

  /**
   * Názov pracoviska / počítača (napr. Ambulancia 1, Recepcia)
   */
  getMachineName(): string {
    if (typeof window === 'undefined') return 'Pracovná stanica SAY CLINIC';
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MACHINE_NAME);
      if (saved) return saved;

      // Inteligentná detekcia platformy pre predvolený názov
      const ua = navigator.userAgent;
      let detected = 'Pracovná stanica kliniky';
      if (/Macintosh|Mac OS X/.test(ua)) detected = 'Apple Mac (Ambulancia)';
      else if (/Windows/.test(ua)) detected = 'Windows PC (Ambulancia)';
      else if (/iPad|iPhone/.test(ua)) detected = 'Klinický iPad / Tablet';

      localStorage.setItem(STORAGE_KEY_MACHINE_NAME, detected);
      return detected;
    } catch {
      return 'Pracovná stanica SAY CLINIC';
    }
  },

  /**
   * Umožňuje používateľovi pomenovať svoje pracovisko (napr. "Ambulancia plastickej chirurgie")
   */
  setMachineName(name: string) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_MACHINE_NAME, name.trim());
    } catch (e) {
      console.error('Chyba zápisu názvu stanice:', e);
    }
  },

  /**
   * Načíta všetky záznamy PINov pre všetky stanice a používateľov z localStorage
   */
  getAllDevicePins(): Record<string, DevicePinRecord> {
    if (typeof window === 'undefined') return {};
    try {
      const data = localStorage.getItem(STORAGE_KEY_DEVICE_PINS);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Chyba načítania PIN údajov zariadenia:', e);
      return {};
    }
  },

  /**
   * Kľúč záznamu viazaný na machineId a userId
   */
  getStorageRecordKey(userId: string): string {
    const machineId = this.getMachineId();
    return `${machineId}__${userId.toLowerCase()}`;
  },

  /**
   * Zistí, či má používateľ na tomto zariadení nastavený vlastný PIN
   */
  hasConfiguredPin(userId: string): boolean {
    const all = this.getAllDevicePins();
    const key = this.getStorageRecordKey(userId);
    return !!(all[key] && all[key].isSet);
  },

  /**
   * Získa záznam o PINe pre daného používateľa na tomto zariadení
   */
  getDevicePinRecord(userId: string): DevicePinRecord | null {
    const all = this.getAllDevicePins();
    const key = this.getStorageRecordKey(userId);
    return all[key] || null;
  },

  /**
   * Uloží hash nového 4-miestneho PINu viazaného na toto konkrétne zariadenie (machineId)
   */
  async saveDevicePin(userId: string, pin: string): Promise<boolean> {
    if (!/^\d{4}$/.test(pin)) {
      throw new Error('PIN musí mať presne 4 číslice.');
    }

    try {
      const machineId = this.getMachineId();
      const machineName = this.getMachineName();
      const salt = Math.random().toString(36).substring(2, 10);
      const pinHash = await sha256(pin + '__' + salt + '__' + machineId);

      const record: DevicePinRecord = {
        machineId,
        machineName,
        userId: userId.toLowerCase(),
        pinHash,
        salt,
        isSet: true,
        updatedAt: new Date().toISOString(),
        lastVerifiedAt: new Date().toISOString(),
      };

      const all = this.getAllDevicePins();
      const key = this.getStorageRecordKey(userId);
      all[key] = record;
      localStorage.setItem(STORAGE_KEY_DEVICE_PINS, JSON.stringify(all));

      // Asynchrónne zálohovanie PINu na server v pozadí pre centrálnu bezpečnosť
      fetch('/api/auth/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updatePin',
          userId,
          machineId,
          pinHash,
          salt,
        }),
      }).catch(err => console.warn('Zálohovanie PINu na server:', err));

      return true;
    } catch (e) {
      console.error('Chyba pri ukladaní PINu zariadenia:', e);
      return false;
    }
  },

  /**
   * Overí zadaný 4-miestny PIN voči uloženému hashu viazanému na machineId
   */
  async verifyDevicePin(userId: string, enteredPin: string): Promise<{ valid: boolean; isDefault: boolean }> {
    if (!/^\d{4}$/.test(enteredPin)) {
      return { valid: false, isDefault: false };
    }

    const record = this.getDevicePinRecord(userId);
    const machineId = this.getMachineId();

    if (!record || !record.isSet) {
      // Ak používateľ ešte nemá nastavený vlastný PIN na tejto stanici,
      // akceptujeme predvolený štartovací klinický PIN 2026:
      const isDefault = enteredPin === DEFAULT_FALLBACK_PIN;
      if (isDefault) {
        // Automaticky zinicializujeme hash tohto PINu viazaný na tento počítač
        await this.saveDevicePin(userId, enteredPin);
      }
      return { valid: isDefault, isDefault };
    }

    // Overenie voči zahashovanému PINu
    const computedHash = await sha256(enteredPin + '__' + record.salt + '__' + machineId);
    const isValid = computedHash === record.pinHash;

    if (isValid) {
      // Aktualizujeme čas posledného overenia na tomto zariadení
      try {
        const all = this.getAllDevicePins();
        const key = this.getStorageRecordKey(userId);
        if (all[key]) {
          all[key].lastVerifiedAt = new Date().toISOString();
          localStorage.setItem(STORAGE_KEY_DEVICE_PINS, JSON.stringify(all));
        }
      } catch {
        // ignore
      }
    }

    return { valid: isValid, isDefault: false };
  },

  /**
   * Zaznamená, že používateľ sa dnes úspešne overil heslom na tomto zariadení.
   * Umožňuje rýchly PIN vstup po zvyšok dňa bez opakovaného písania hesla.
   */
  recordSameDayAuth(userId: string) {
    if (typeof window === 'undefined') return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const machineId = this.getMachineId();
      let records: Record<string, { date: string; machineId: string; timestamp: number }> = {};
      const saved = localStorage.getItem('say_clinic_same_day_auth');
      if (saved) records = JSON.parse(saved);

      records[userId.toLowerCase()] = {
        date: today,
        machineId,
        timestamp: Date.now(),
      };

      localStorage.setItem('say_clinic_same_day_auth', JSON.stringify(records));
    } catch (e) {
      console.error('Chyba zápisu same-day auth:', e);
    }
  },

  /**
   * Zistí, či sa používateľ už dnes na tomto zariadení overil heslom,
   * a teda mu stačí iba rýchly 4-miestny PIN bez hesla.
   */
  isEligibleForSameDayPinOnly(userId: string): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const today = new Date().toISOString().split('T')[0];
      const machineId = this.getMachineId();
      const saved = localStorage.getItem('say_clinic_same_day_auth');
      if (!saved) return false;
      const records = JSON.parse(saved);
      const userRecord = records[userId.toLowerCase()];
      if (!userRecord) return false;

      return userRecord.date === today && userRecord.machineId === machineId;
    } catch {
      return false;
    }
  },

  /**
   * Zruší same-day auth (napr. pri explicitnom odhlásení a požiadavke na heslo)
   */
  clearSameDayAuth(userId: string) {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('say_clinic_same_day_auth');
      if (!saved) return;
      const records = JSON.parse(saved);
      delete records[userId.toLowerCase()];
      localStorage.setItem('say_clinic_same_day_auth', JSON.stringify(records));
    } catch {
      // ignore
    }
  }
};
