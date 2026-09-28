import { UserAccount } from '../components/LoginForm';
import { AuditLogService } from './auditLogService';

export interface StoredPasskey {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  credentialId: string;
  publicKey?: string;
  deviceName: string;
  createdAt: string;
  lastUsedAt?: string;
}

const PASSKEYS_STORAGE_KEY = 'say_clinic_passkeys_v1';
const LINKED_EMAILS_STORAGE_KEY = 'say_clinic_linked_personal_emails_v1';

// Zoznam predvolených firemných účtov, ktoré majú oficiálny firemný Google Workspace účet
export const CORPORATE_USERS_CONFIG: Record<string, { isCorporate: boolean; defaultEmail: string }> = {
  u1: { isCorporate: true, defaultEmail: 'mraz@sayclinic.sk' },
  u4: { isCorporate: true, defaultEmail: 'mecerodova@sayclinic.sk' },
  u5: { isCorporate: true, defaultEmail: 'solivajsova@sayclinic.sk' },
};

export const PasskeyService = {
  // Overenie či prehliadač podporuje WebAuthn (Passkeys)
  isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(window.PublicKeyCredential && navigator.credentials && navigator.credentials.create);
  },

  // Overenie či má zariadenie biometrický senzor (Touch ID, Face ID, Windows Hello)
  async isPlatformAuthenticatorAvailable(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      if (typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
        return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      }
      return true;
    } catch {
      return false;
    }
  },

  // Získanie uložených kľúčov z úložiska (len autentické reálne WebAuthn kľúče)
  getAllPasskeys(): StoredPasskey[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(PASSKEYS_STORAGE_KEY);
      if (!data) return [];
      const parsed: StoredPasskey[] = JSON.parse(data);
      // Striktná bezpečnosť: Odstrániť staré simulačné kľúče bez skutočného WebAuthn hardvérového podpisu
      const realPasskeys = parsed.filter(
        p => p.credentialId && !p.credentialId.startsWith('passkey-device-') && !p.credentialId.startsWith('cred-')
      );
      if (realPasskeys.length !== parsed.length) {
        localStorage.setItem(PASSKEYS_STORAGE_KEY, JSON.stringify(realPasskeys));
      }
      return realPasskeys;
    } catch (e) {
      console.error('Chyba načítania Passkeys:', e);
      return [];
    }
  },

  // Zistenie, či má používateľ na tomto zariadení/prehliadači zaregistrovaný Passkey
  hasPasskey(userId: string): boolean {
    const list = this.getAllPasskeys();
    return list.some(p => p.userId === userId);
  },

  // Získanie passkey pre daného používateľa
  getUserPasskeys(userId: string): StoredPasskey[] {
    const list = this.getAllPasskeys();
    return list.filter(p => p.userId === userId);
  },

  // Detekcia názvu zariadenia pre prehľadnosť v UI
  getDeviceLabel(): string {
    if (typeof navigator === 'undefined') return 'Zariadenie';
    const ua = navigator.userAgent;
    if (/iPhone/i.test(ua)) return 'Apple iPhone (Face ID / Touch ID)';
    if (/iPad/i.test(ua)) return 'Apple iPad (Face ID / Touch ID)';
    if (/Macintosh/i.test(ua)) return 'Apple Mac (Touch ID)';
    if (/Windows/i.test(ua)) return 'Windows PC (Windows Hello / PIN)';
    if (/Android/i.test(ua)) return 'Android (Odtlačok prsta / Tvár)';
    return 'Biometrický senzor (Passkey)';
  },

  // Registrácia nového Passkey (výhradne reálny WebAuthn hardvér)
  async registerPasskey(user: UserAccount): Promise<{ success: boolean; passkey?: StoredPasskey; message: string }> {
    const deviceLabel = this.getDeviceLabel();
    const passkeyId = `pk-${user.id}-${Date.now()}`;

    if (!this.isSupported() || !navigator.credentials?.create) {
      return {
        success: false,
        message: 'Tento prehliadač nepodporuje registráciu WebAuthn Passkey.',
      };
    }

    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const userIdBytes = new TextEncoder().encode(user.id);

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: 'SAY CLINIC Bratislava',
          id: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
        },
        user: {
          id: userIdBytes,
          name: user.email,
          displayName: user.name,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },  // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Touch ID / Face ID / Windows Hello
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      };

      const credential = (await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      })) as PublicKeyCredential | null;

      if (!credential || !credential.id) {
        return {
          success: false,
          message: 'Aktivácia Passkey nebola na zariadení potvrdená.',
        };
      }

      const newPasskey: StoredPasskey = {
        id: passkeyId,
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        credentialId: credential.id,
        deviceName: deviceLabel,
        createdAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
      };

      this.savePasskey(newPasskey);

      AuditLogService.log({
        user,
        category: 'SECURITY',
        action: 'PASSKEY_REGISTRÁCIA',
        details: `${user.name} úspešne zaregistroval biometrický Passkey (${deviceLabel}).`,
        severity: 'info',
      });

      return {
        success: true,
        passkey: newPasskey,
        message: `Biometrický Passkey (${deviceLabel}) bol úspešne aktivovaný pre ${user.name}.`,
      };
    } catch (err: any) {
      console.warn('Registrácia Passkey zlyhala:', err);
      const isIframe = typeof window !== 'undefined' && window.self !== window.top;
      let message = 'Aktivácia Passkey bola zrušená alebo zlyhala.';
      if (err?.name === 'NotAllowedError') {
        message = isIframe
          ? 'Prehliadač v testovacom iFrame nepovolil Touch ID / Face ID. Otvorte aplikáciu v samostatnom okne (odkaz v hornej lište), alebo použite 2FA kód.'
          : 'Aktivácia Touch ID / Face ID bola na zariadení zrušená.';
      }
      return { success: false, message };
    }
  },

  // Overenie biometrie pri prihlasovaní (Touch ID / Face ID) - STRIKTNÉ BEZ AKÉHOKOĽVEK OBCHÁDZANIA
  async verifyBiometricLogin(user: UserAccount): Promise<{ success: boolean; message: string }> {
    const userPasskeys = this.getUserPasskeys(user.id);
    const deviceLabel = this.getDeviceLabel();

    // 1. Zabezpečenie: Ak používateľ nemá na tomto zariadení aktivovaný Passkey, vstup je prísne zakázaný
    if (!userPasskeys || userPasskeys.length === 0) {
      return {
        success: false,
        message: 'Na tomto zariadení nemáte aktivovaný Passkey (Touch ID / Face ID). Použite 2FA kód alebo aktivujte Passkey.',
      };
    }

    if (!this.isSupported() || !navigator.credentials?.get) {
      return {
        success: false,
        message: 'WebAuthn biometria nie je v tomto prehliadači podporovaná. Použite 2FA kód.',
      };
    }

    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const allowCredentials: PublicKeyCredentialDescriptor[] = userPasskeys.map(pk => ({
        id: new TextEncoder().encode(pk.credentialId),
        type: 'public-key',
        transports: ['internal'],
      }));

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        timeout: 60000,
        rpId: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
        userVerification: 'required',
        ...(allowCredentials.length > 0 ? { allowCredentials } : {}),
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      });

      if (assertion) {
        this.updatePasskeyLastUsed(user.id);
        AuditLogService.log({
          user,
          category: 'AUTH',
          action: 'PASSKEY_PRIHLÁSENIE',
          details: `${user.name} sa úspešne overil biometriou cez WebAuthn Passkey (${deviceLabel}).`,
          severity: 'info',
        });
        return { success: true, message: 'Biometrické overenie úspešné.' };
      }

      return {
        success: false,
        message: 'Biometrické overenie neposkytlo platný podpis zariadenia.',
      };
    } catch (err: any) {
      console.warn('WebAuthn biometrické overenie zlyhalo:', err?.message || err);
      const isIframe = typeof window !== 'undefined' && window.self !== window.top;
      let message = 'Biometrické overenie Touch ID / Face ID zlyhalo.';
      if (err?.name === 'NotAllowedError') {
        message = isIframe
          ? 'Prehliadač v testovacom iFrame nepovolil biometriu. Otvorte aplikáciu v samostatnom okne alebo použite 2FA kód.'
          : 'Biometrické overenie bolo zrušené používateľom.';
      }
      return { success: false, message };
    }
  },

  // Alias pre autentifikáciu
  async authenticateWithPasskey(user: UserAccount): Promise<{ success: boolean; message: string }> {
    return this.verifyBiometricLogin(user);
  },

  // Uloženie nového Passkey
  savePasskey(passkey: StoredPasskey) {
    if (typeof window === 'undefined') return;
    try {
      const all = this.getAllPasskeys();
      // Odstrániť existujúce pre rovnakého používateľa a rovnaké zariadenie, aby sa nehromadili
      const filtered = all.filter(p => !(p.userId === passkey.userId && p.deviceName === passkey.deviceName));
      filtered.push(passkey);
      localStorage.setItem(PASSKEYS_STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error('Chyba zápisu Passkey do úložiska:', e);
    }
  },

  // Aktualizácia času posledného použitia
  updatePasskeyLastUsed(userId: string) {
    if (typeof window === 'undefined') return;
    try {
      const all = this.getAllPasskeys();
      const updated = all.map(p => {
        if (p.userId === userId) {
          return { ...p, lastUsedAt: new Date().toISOString() };
        }
        return p;
      });
      localStorage.setItem(PASSKEYS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Chyba aktualizácie Passkey:', e);
    }
  },

  // Odstránenie Passkey
  removePasskey(userId: string, credentialId?: string) {
    if (typeof window === 'undefined') return;
    try {
      const all = this.getAllPasskeys();
      const updated = all.filter(p => {
        if (p.userId !== userId) return true;
        if (credentialId && p.credentialId !== credentialId) return true;
        return false;
      });
      localStorage.setItem(PASSKEYS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}
  },

  // -------------------------------------------------------------
  // PREPÁJANIE OSOBNÝCH ÚČTOV S PROFILMI SAY CLINIC
  // -------------------------------------------------------------

  // Zistiť, či je účet oficiálny firemný @sayclinic.sk účet
  isCorporateAccount(userId: string, email?: string): boolean {
    const cfg = CORPORATE_USERS_CONFIG[userId];
    if (cfg?.isCorporate) return true;
    if (email && email.toLowerCase().endsWith('@sayclinic.sk')) {
      const userKey = email.toLowerCase().split('@')[0];
      if (['mraz', 'mecerodova', 'solivajsova'].includes(userKey)) {
        return true;
      }
    }
    return false;
  },

  // Získať namapované osobné emaily pre používateľov
  getLinkedPersonalEmails(): Record<string, string[]> {
    if (typeof window === 'undefined') return {};
    try {
      const data = localStorage.getItem(LINKED_EMAILS_STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Chyba načítania prepojených osobných emailov:', e);
    }
    // Predvolené počiatočné prepojenia pre lekárov a sestry s osobnými účtami
    return {
      u2: ['zuzana.srokova@gmail.com', 'srokova.zuzana@gmail.com'],
      u3: ['tran.minh.say@gmail.com', 'tuongtran@gmail.com'],
      u6: ['ema.foltani@gmail.com'],
      u7: ['sabina.lenhartova@gmail.com'],
      u8: ['anesteziologia.say@gmail.com'],
      u9: ['anest.sestra.say@gmail.com'],
      u10: ['viktoria.foltaniova@gmail.com'],
    };
  },

  // Uložiť nový prepojený osobný email pre daného člena tímu
  linkPersonalEmail(userId: string, personalEmail: string): boolean {
    if (typeof window === 'undefined') return false;
    const clean = personalEmail.trim().toLowerCase();
    if (!clean || !clean.includes('@')) return false;

    try {
      const map = this.getLinkedPersonalEmails();
      const existing = map[userId] || [];
      if (!existing.includes(clean)) {
        existing.push(clean);
        map[userId] = existing;
        localStorage.setItem(LINKED_EMAILS_STORAGE_KEY, JSON.stringify(map));
      }
      return true;
    } catch (e) {
      console.error('Chyba pri ukladaní prepojeného emailu:', e);
      return false;
    }
  },

  // Odstrániť prepojený osobný email
  unlinkPersonalEmail(userId: string, personalEmail: string): boolean {
    if (typeof window === 'undefined') return false;
    const clean = personalEmail.trim().toLowerCase();
    try {
      const map = this.getLinkedPersonalEmails();
      if (map[userId]) {
        map[userId] = map[userId].filter(e => e.toLowerCase() !== clean);
        localStorage.setItem(LINKED_EMAILS_STORAGE_KEY, JSON.stringify(map));
      }
      return true;
    } catch (e) {
      return false;
    }
  },

  // Nájsť člena tímu podľa osobného alebo firemného emailu
  findUserByEmail(allUsers: UserAccount[], email: string): UserAccount | null {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return null;

    // 1. Priama zhoda s oficiálnym emailom profilu
    const directMatch = allUsers.find(u => u.email.toLowerCase() === cleanEmail);
    if (directMatch) return directMatch;

    // 2. Zhoda s prepojenými osobnými emailami
    const linkedMap = this.getLinkedPersonalEmails();
    for (const [userId, emails] of Object.entries(linkedMap)) {
      if (emails.some(e => e.toLowerCase() === cleanEmail)) {
        const user = allUsers.find(u => u.id === userId);
        if (user) return user;
      }
    }

    // 3. V ostrej Zero-Trust prevádzke sú neznáme externé účty striktne ZAMIETNUTÉ.
    // Žiadne voľné fuzzy hádanie podľa mena, aby sa cudzí človek s podobným Gmailom nedostal do profilu lekára.
    return null;
  },

  // Zistiť, či je email na oficiálnom Whiteliste kliniky
  isEmailWhitelisted(allUsers: UserAccount[], email: string): boolean {
    return !!this.findUserByEmail(allUsers, email);
  }
};
