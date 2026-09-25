'use client';

import QRCode from 'qrcode';

// Base32 abeceda pre RFC 4648 / RFC 6238 TOTP
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// Predvolené stabilné kľúče pre tím SAY CLINIC (každý člen má svoj unikátny overovací kľúč)
const SEED_TOTP_SECRETS: Record<string, string> = {
  u1: 'JBSWY3DPEHPK3PXPMRZ1SAYCLINICCEO', // MUDr. Ján Mráz
  u2: 'KZXW65TFOJZSE3DPEHPK3PXPSROKOVA', // MUDr. Zuzana Sroková
  u3: 'NBSWY3DPEHPK3PXPMINHTUONGTRAN99', // MUDr. Minh Tuong Tran
  u4: 'ORXW233FOJZSE3DPEHPK3PXPMECEROD', // Ing. Barbara Mecerodová, MBA
  u5: 'PJXW65TFOJZSE3DPEHPK3PXPSOLIVAJ', // Mgr. Elena Solivajsová
  u6: 'QZXW65TFOJZSE3DPEHPK3PXPFOLTANI', // Ema Foltáni
  u7: 'RJXW65TFOJZSE3DPEHPK3PXPLENHART', // Sabina Lenhartová
  u8: 'SJXW65TFOJZSE3DPEHPK3PXPANESTEZ', // Anesteziológ
  u9: 'TJXW65TFOJZSE3DPEHPK3PXPSESANST', // Anesteziologická sestra
  u10: 'UJXW65TFOJZSE3DPEHPK3PXPVFOLTAN', // Viktória Foltániová
};

const STORAGE_KEY = 'say_clinic_totp_secrets_v1';
const ACTIVATED_STORAGE_KEY = 'say_clinic_totp_activated_v1';

// Dekódovanie Base32 reťazca do Uint8Array
function base32Decode(base32: string): Uint8Array {
  const clean = base32.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(clean[i]);
    if (idx === -1) continue; // preskočiť neplatné znaky
    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(output);
}

export const TotpService = {
  // Získať alebo vytvoriť overovací kľúč (Verification Key / Secret) pre používateľa
  getUserSecret(userId: string): string {
    if (typeof window === 'undefined') return SEED_TOTP_SECRETS[userId] || 'JBSWY3DPEHPK3PXP';
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (stored[userId]) return stored[userId];

      const secret = SEED_TOTP_SECRETS[userId] || this.generateRandomSecret();
      stored[userId] = secret;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      return secret;
    } catch {
      return SEED_TOTP_SECRETS[userId] || 'JBSWY3DPEHPK3PXP';
    }
  },

  // Generovanie nového náhodného Base32 kľúča
  generateRandomSecret(length = 32): string {
    let secret = '';
    const array = new Uint8Array(length);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array);
    } else {
      for (let i = 0; i < length; i++) array[i] = Math.floor(Math.random() * 256);
    }
    for (let i = 0; i < length; i++) {
      secret += BASE32_ALPHABET[array[i] % BASE32_ALPHABET.length];
    }
    return secret;
  },

  // Zistiť, či používateľ už má aktivované 2FA
  is2FAActivated(userId: string): boolean {
    if (typeof window === 'undefined') return true;
    try {
      const stored = JSON.parse(localStorage.getItem(ACTIVATED_STORAGE_KEY) || '{}');
      // Predvolene predpokladáme, že 2FA je aktivované pre všetkých členov
      if (stored[userId] !== undefined) return stored[userId];
      return true;
    } catch {
      return true;
    }
  },

  // Označiť 2FA ako aktivované po úspešnom overení
  set2FAActivated(userId: string, activated = true) {
    if (typeof window === 'undefined') return;
    try {
      const stored = JSON.parse(localStorage.getItem(ACTIVATED_STORAGE_KEY) || '{}');
      stored[userId] = activated;
      localStorage.setItem(ACTIVATED_STORAGE_KEY, JSON.stringify(stored));
    } catch (e) {
      console.error('Chyba uloženia 2FA stavu:', e);
    }
  },

  // Zostavenie štandardného otpauth:// URI pre Apple / Google / Microsoft Authenticator
  getOtpAuthUri(user: { id: string; email: string; name: string }): string {
    const secret = this.getUserSecret(user.id);
    const label = `SAY CLINIC:${user.email}`;
    const issuer = 'SAY CLINIC';
    return `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
  },

  // Vygenerovanie QR kódu ako obrázku (Data URL)
  async generateQrCodeDataUrl(user: { id: string; email: string; name: string }): Promise<string> {
    const uri = this.getOtpAuthUri(user);
    try {
      return await QRCode.toDataURL(uri, {
        width: 260,
        margin: 2,
        color: {
          dark: '#2C2A29',
          light: '#FFFFFF'
        }
      });
    } catch (err) {
      console.error('Chyba pri generovaní QR kódu:', err);
      return '';
    }
  },

  // Výpočet 6-miestneho TOTP kódu pre daný časový krok pomocou Web Crypto API
  async calculateToken(secretBase32: string, timeStep: number): Promise<string> {
    const keyBytes = base32Decode(secretBase32);
    
    // Časový krok ako 8-bajtový Big-Endian buffer
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setBigInt64(0, BigInt(timeStep), false);

    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyBytes.buffer as ArrayBuffer,
      { name: 'HMAC', hash: { name: 'SHA-1' } },
      false,
      ['sign']
    );

    const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, buffer);
    const hmacResult = new Uint8Array(signature);

    // Dynamické orezanie podľa RFC 4226 / 6238
    const offset = hmacResult[hmacResult.length - 1] & 0xf;
    const binary =
      ((hmacResult[offset] & 0x7f) << 24) |
      ((hmacResult[offset + 1] & 0xff) << 16) |
      ((hmacResult[offset + 2] & 0xff) << 8) |
      (hmacResult[offset + 3] & 0xff);

    const token = binary % 1000000;
    return token.toString().padStart(6, '0');
  },

  // Overenie 6-miestneho kódu z aplikácie (s toleranciou ±30s na časový posun)
  async verifyTotpCode(userId: string, enteredCode: string): Promise<boolean> {
    if (!enteredCode || enteredCode.trim().length !== 6) return false;
    const cleanCode = enteredCode.trim();
    const secret = this.getUserSecret(userId);

    const nowSeconds = Math.floor(Date.now() / 1000);
    const currentStep = Math.floor(nowSeconds / 30);

    // Tolerancia časového posunu: krok predchádzajúci (-30s), aktuálny, a nasledujúci (+30s)
    const stepsToCheck = [currentStep, currentStep - 1, currentStep + 1];

    for (const step of stepsToCheck) {
      try {
        const expectedToken = await this.calculateToken(secret, step);
        if (expectedToken === cleanCode) {
          return true;
        }
      } catch (e) {
        console.error('Chyba overenia TOTP tokenu:', e);
      }
    }

    return false;
  },

  // Získanie aktuálneho kódu (pre demonštráciu alebo overenie správcu)
  async getCurrentExpectedCode(userId: string): Promise<string> {
    const secret = this.getUserSecret(userId);
    const nowSeconds = Math.floor(Date.now() / 1000);
    const currentStep = Math.floor(nowSeconds / 30);
    return await this.calculateToken(secret, currentStep);
  }
};
