import { UserAccount, SAY_CLINIC_USERS } from '../components/LoginForm';

// Predvolené heslá pre tím SAY CLINIC pri prvom produkčnom štarte
// Používatelia si môžu heslo kedykoľvek zmeniť.
const DEFAULT_INITIAL_PASSWORD = 'SayClinic2026!';

export interface StoredCredentials {
  [userIdOrEmail: string]: {
    passwordHash: string;
    isCustomPassword: boolean;
    updatedAt: string;
  };
}

export interface ActiveSession {
  user: UserAccount;
  loginTime: number;
  rememberMe: boolean;
  expiresAt: number;
}

const CREDENTIALS_KEY = 'say_clinic_credentials_v1';
const SESSION_KEY = 'say_clinic_user';
const OTP_STORE_KEY = 'say_clinic_active_otps';

export const AuthService = {
  // Inicializácia prihlasovacích údajov v úložisku
  initCredentials(): StoredCredentials {
    if (typeof window === 'undefined') return {};
    
    try {
      const stored = localStorage.getItem(CREDENTIALS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Chyba pri čítaní poverení:', e);
    }

    // Nastavenie počiatočných produkčných hesiel pre všetkých členov tímu
    const initialCreds: StoredCredentials = {};
    SAY_CLINIC_USERS.forEach(u => {
      initialCreds[u.id] = {
        passwordHash: DEFAULT_INITIAL_PASSWORD,
        isCustomPassword: false,
        updatedAt: new Date().toISOString(),
      };
      initialCreds[u.email.toLowerCase()] = initialCreds[u.id];
    });

    try {
      localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(initialCreds));
    } catch (e) {
      console.error('Chyba pri zápise počiatočných poverení:', e);
    }

    return initialCreds;
  },

  // Overenie zadaného hesla
  verifyPassword(identifier: string, enteredPass: string): boolean {
    if (typeof window === 'undefined') return false;
    const creds = this.initCredentials();
    const idKey = identifier.toLowerCase();
    
    const record = creds[idKey];
    if (!record) {
      // Ak by záznam ešte neexistoval, overíme voči predvolenému klinickému heslu
      return enteredPass === DEFAULT_INITIAL_PASSWORD;
    }

    return record.passwordHash === enteredPass;
  },

  // Zmena hesla používateľa
  changePassword(identifier: string, oldPass: string, newPass: string): { success: boolean; message: string } {
    if (typeof window === 'undefined') return { success: false, message: 'Nedostupný prehliadač.' };
    
    if (!this.verifyPassword(identifier, oldPass)) {
      return { success: false, message: 'Pôvodné heslo nie je správne.' };
    }

    if (newPass.length < 6) {
      return { success: false, message: 'Nové heslo musí mať aspoň 6 znakov.' };
    }

    const creds = this.initCredentials();
    const idKey = identifier.toLowerCase();
    
    const user = SAY_CLINIC_USERS.find(u => u.id === identifier || u.email.toLowerCase() === idKey);
    const keysToUpdate = [idKey];
    if (user) {
      keysToUpdate.push(user.id);
      keysToUpdate.push(user.email.toLowerCase());
    }

    keysToUpdate.forEach(k => {
      creds[k] = {
        passwordHash: newPass,
        isCustomPassword: true,
        updatedAt: new Date().toISOString(),
      };
    });

    try {
      localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(creds));
      return { success: true, message: 'Heslo bolo úspešne zmenené.' };
    } catch (e) {
      return { success: false, message: 'Nepodarilo sa uložiť nové heslo.' };
    }
  },

  // Nastavenie nového hesla po obnove cez kód
  setNewPassword(identifier: string, newPass: string): { success: boolean; message: string } {
    if (typeof window === 'undefined') return { success: false, message: 'Nedostupný prehliadač.' };
    
    if (newPass.length < 6) {
      return { success: false, message: 'Nové heslo musí mať aspoň 6 znakov.' };
    }

    const creds = this.initCredentials();
    const idKey = identifier.toLowerCase();
    
    const user = SAY_CLINIC_USERS.find(u => u.id === identifier || u.email.toLowerCase() === idKey);
    const keysToUpdate = [idKey];
    if (user) {
      keysToUpdate.push(user.id);
      keysToUpdate.push(user.email.toLowerCase());
    }

    keysToUpdate.forEach(k => {
      creds[k] = {
        passwordHash: newPass,
        isCustomPassword: true,
        updatedAt: new Date().toISOString(),
      };
    });

    try {
      localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(creds));
      return { success: true, message: 'Heslo bolo úspešne aktualizované.' };
    } catch (e) {
      return { success: false, message: 'Nepodarilo sa uložiť nové heslo.' };
    }
  },

  // Generovanie a odoslanie 2FA kódu
  async generateAndSendOtp(user: UserAccount, type: 'login' | 'reset' = 'login'): Promise<{ success: boolean; fallbackOtp?: string; emailSent?: boolean; message: string }> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Uloženie OTP do session pamäte pre overenie (platnosť 10 minút)
    try {
      const activeOtps = JSON.parse(sessionStorage.getItem(OTP_STORE_KEY) || '{}');
      activeOtps[user.email.toLowerCase()] = {
        code: otp,
        expiresAt: Date.now() + 10 * 60 * 1000,
      };
      sessionStorage.setItem(OTP_STORE_KEY, JSON.stringify(activeOtps));
    } catch (e) {
      console.error('Chyba uloženia OTP:', e);
    }

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          userName: user.name,
          otpCode: otp,
          type,
        }),
      });

      const data = await res.json();
      return {
        success: true,
        emailSent: data.emailSent ?? false,
        fallbackOtp: data.fallbackCode || otp,
        message: data.message || `Overovací kód bol pripravený pre ${user.email}`,
      };
    } catch (e) {
      console.warn('API send-otp zlyhalo, použitá interná verifikácia:', e);
      return {
        success: true,
        emailSent: false,
        fallbackOtp: otp,
        message: `Overovací kód bol pripravený pre ${user.email}`,
      };
    }
  },

  // Rýchle obnovenie na predvolené klinické heslo
  resetToDefaultPassword(identifier: string): { success: boolean; message: string } {
    return this.setNewPassword(identifier, DEFAULT_INITIAL_PASSWORD);
  },

  // Overenie 2FA kódu
  verifyOtp(email: string, enteredCode: string, fallbackOtp?: string): boolean {
    if (!enteredCode || enteredCode.length !== 6) return false;

    // 1. Priama zhoda s aktuálnym kódom v session
    try {
      const activeOtps = JSON.parse(sessionStorage.getItem(OTP_STORE_KEY) || '{}');
      const record = activeOtps[email.toLowerCase()];
      if (record && record.code === enteredCode && record.expiresAt > Date.now()) {
        // Vymazať po úspešnom použití
        delete activeOtps[email.toLowerCase()];
        sessionStorage.setItem(OTP_STORE_KEY, JSON.stringify(activeOtps));
        return true;
      }
    } catch (e) {
      console.error('Chyba pri čítaní aktívnych OTP:', e);
    }

    // 2. Zhoda s fallbackom z volania
    if (fallbackOtp && enteredCode === fallbackOtp) {
      return true;
    }

    return false;
  },

  // Uloženie aktívnej relácie
  saveSession(user: UserAccount, rememberMe: boolean = true) {
    if (typeof window === 'undefined') return;
    const session: ActiveSession = {
      user,
      loginTime: Date.now(),
      rememberMe,
      expiresAt: rememberMe ? Date.now() + 30 * 86400000 : Date.now() + 12 * 3600000, // 30 dní alebo 12 hodín
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    localStorage.setItem('say_clinic_session_meta', JSON.stringify(session));
  },

  // Získanie existujúcej platnej relácie
  getCurrentSession(): UserAccount | null {
    if (typeof window === 'undefined') return null;
    try {
      const userJson = localStorage.getItem(SESSION_KEY);
      if (!userJson) return null;

      const metaJson = localStorage.getItem('say_clinic_session_meta');
      if (metaJson) {
        const meta: ActiveSession = JSON.parse(metaJson);
        if (meta.expiresAt && meta.expiresAt < Date.now()) {
          // Relácia vypršala
          this.clearSession();
          return null;
        }
      }

      return JSON.parse(userJson);
    } catch (e) {
      console.error('Chyba pri načítaní session:', e);
      return null;
    }
  },

  // Odhlásenie
  clearSession() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('say_clinic_session_meta');
  },

  // Zistiť, či používateľ používa pôvodné predvolené heslo
  isUsingDefaultPassword(identifier: string): boolean {
    const creds = this.initCredentials();
    const idKey = identifier.toLowerCase();
    const record = creds[idKey];
    if (!record) return true;
    return !record.isCustomPassword;
  }
};
