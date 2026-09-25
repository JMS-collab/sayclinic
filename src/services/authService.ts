import { UserAccount, SAY_CLINIC_USERS } from '../components/LoginForm';
import { AuditLogService } from './auditLogService';

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
const LOCKOUT_KEY = 'say_clinic_lockouts_v1';
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minút blokovania po 5 zlých pokusoch

export const AuthService = {
  // Inicializácia prihlasovacích údajov v úložisku
  initCredentials(): StoredCredentials {
    if (typeof window === 'undefined') return {};
    
    try {
      const stored = localStorage.getItem(CREDENTIALS_KEY);
      if (stored) {
        const parsed: StoredCredentials = JSON.parse(stored);
        let hasChanges = false;
        SAY_CLINIC_USERS.forEach(u => {
          if (!parsed[u.id] || !parsed[u.email.toLowerCase()]) {
            const cred = parsed[u.id] || {
              passwordHash: DEFAULT_INITIAL_PASSWORD,
              isCustomPassword: false,
              updatedAt: new Date().toISOString(),
            };
            parsed[u.id] = cred;
            parsed[u.email.toLowerCase()] = cred;
            hasChanges = true;
          }
        });
        // Aliases
        if (!parsed['anestezia@sayclinic.sk'] && parsed['u8']) {
          parsed['anestezia@sayclinic.sk'] = parsed['u8'];
          hasChanges = true;
        }
        if (!parsed['anesteziologicka.sestra@sayclinic.sk'] && parsed['u9']) {
          parsed['anesteziologicka.sestra@sayclinic.sk'] = parsed['u9'];
          parsed['anesteziologickasestra@sayclinic.sk'] = parsed['u9'];
          hasChanges = true;
        }
        if (!parsed['viktoria.foltaniova@sayclinic.sk'] && parsed['u10']) {
          parsed['viktoria.foltaniova@sayclinic.sk'] = parsed['u10'];
          parsed['viktoria@sayclinic.sk'] = parsed['u10'];
          hasChanges = true;
        }
        if (hasChanges) {
          localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(parsed));
        }
        return parsed;
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

    // E-mailové aliasy
    if (initialCreds['u8']) {
      initialCreds['anestezia@sayclinic.sk'] = initialCreds['u8'];
    }
    if (initialCreds['u9']) {
      initialCreds['anesteziologicka.sestra@sayclinic.sk'] = initialCreds['u9'];
      initialCreds['anesteziologickasestra@sayclinic.sk'] = initialCreds['u9'];
    }
    if (initialCreds['u10']) {
      initialCreds['viktoria.foltaniova@sayclinic.sk'] = initialCreds['u10'];
      initialCreds['viktoria@sayclinic.sk'] = initialCreds['u10'];
    }

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
      let token: string | null = null;
      try {
        const { getAccessToken } = await import('../lib/workspaceAuth');
        token = await getAccessToken();
      } catch (tokenErr) {
        // workspace token not available yet
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: user.email,
          userName: user.name,
          otpCode: otp,
          type,
          token: token || undefined,
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

  // Kontrola stavu zablokovania účtu (Brute-Force ochrana)
  getLockoutStatus(identifier: string): { isLocked: boolean; remainingSeconds: number; attemptsLeft: number } {
    if (typeof window === 'undefined') return { isLocked: false, remainingSeconds: 0, attemptsLeft: MAX_FAILED_ATTEMPTS };
    try {
      const lockouts = JSON.parse(localStorage.getItem(LOCKOUT_KEY) || '{}');
      const key = identifier.toLowerCase();
      const record = lockouts[key];
      if (!record) return { isLocked: false, remainingSeconds: 0, attemptsLeft: MAX_FAILED_ATTEMPTS };

      const now = Date.now();
      if (record.lockedUntil && record.lockedUntil > now) {
        const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
        return { isLocked: true, remainingSeconds, attemptsLeft: 0 };
      }

      // Ak uplynul lockout alebo pokusy boli staršie ako 15 minút, vyčistíme
      if (record.lastAttempt && now - record.lastAttempt > 15 * 60 * 1000) {
        delete lockouts[key];
        localStorage.setItem(LOCKOUT_KEY, JSON.stringify(lockouts));
        return { isLocked: false, remainingSeconds: 0, attemptsLeft: MAX_FAILED_ATTEMPTS };
      }

      const attemptsLeft = Math.max(0, MAX_FAILED_ATTEMPTS - (record.attempts || 0));
      return { isLocked: false, remainingSeconds: 0, attemptsLeft };
    } catch (e) {
      return { isLocked: false, remainingSeconds: 0, attemptsLeft: MAX_FAILED_ATTEMPTS };
    }
  },

  // Zaznamenanie neúspešného pokusu o heslo
  recordFailedAttempt(identifier: string, emailHint?: string): { isLockedNow: boolean; remainingSeconds: number; attemptsLeft: number } {
    if (typeof window === 'undefined') return { isLockedNow: false, remainingSeconds: 0, attemptsLeft: MAX_FAILED_ATTEMPTS };
    try {
      const lockouts = JSON.parse(localStorage.getItem(LOCKOUT_KEY) || '{}');
      const key = identifier.toLowerCase();
      const now = Date.now();
      const current = lockouts[key] || { attempts: 0, lastAttempt: now };

      current.attempts = (current.attempts || 0) + 1;
      current.lastAttempt = now;

      let isLockedNow = false;
      let remainingSeconds = 0;

      if (current.attempts >= MAX_FAILED_ATTEMPTS) {
        current.lockedUntil = now + LOCKOUT_DURATION_MS;
        isLockedNow = true;
        remainingSeconds = Math.ceil(LOCKOUT_DURATION_MS / 1000);

        AuditLogService.log({
          user: { id: identifier, name: emailHint || identifier, role: 'neoverený', email: emailHint || identifier },
          category: 'SECURITY',
          action: 'BRUTE_FORCE_BLOKOVANIE',
          details: `Účet zablokovaný na 5 minút po ${MAX_FAILED_ATTEMPTS} neúspešných pokusoch o zadanie hesla.`,
          severity: 'critical'
        });
      } else {
        AuditLogService.log({
          user: { id: identifier, name: emailHint || identifier, role: 'neoverený', email: emailHint || identifier },
          category: 'AUTH',
          action: 'NEÚSPEŠNÝ POKUS O PRIHLÁSENIE',
          details: `Nesprávne heslo (pokus ${current.attempts}/${MAX_FAILED_ATTEMPTS}).`,
          severity: 'warning'
        });
      }

      lockouts[key] = current;
      localStorage.setItem(LOCKOUT_KEY, JSON.stringify(lockouts));

      const attemptsLeft = Math.max(0, MAX_FAILED_ATTEMPTS - current.attempts);
      return { isLockedNow, remainingSeconds, attemptsLeft };
    } catch (e) {
      return { isLockedNow: false, remainingSeconds: 0, attemptsLeft: MAX_FAILED_ATTEMPTS };
    }
  },

  // Vymazanie počítadla neúspešných pokusov po úspešnom prihlásení
  resetFailedAttempts(identifier: string) {
    if (typeof window === 'undefined') return;
    try {
      const lockouts = JSON.parse(localStorage.getItem(LOCKOUT_KEY) || '{}');
      const key = identifier.toLowerCase();
      if (lockouts[key]) {
        delete lockouts[key];
        localStorage.setItem(LOCKOUT_KEY, JSON.stringify(lockouts));
      }
    } catch (e) {}
  },

  // Uloženie aktívnej relácie
  saveSession(user: UserAccount, rememberMe: boolean = true) {
    if (typeof window === 'undefined') return;
    const session: ActiveSession = {
      user,
      loginTime: Date.now(),
      rememberMe,
      expiresAt: rememberMe ? Date.now() + 30 * 86400000 : Date.now() + 12 * 3600000,
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    localStorage.setItem('say_clinic_session_meta', JSON.stringify(session));

    // Reset lockoutu pre tohto používateľa
    this.resetFailedAttempts(user.id);
    this.resetFailedAttempts(user.email);

    // Záznam do GDPR auditu
    AuditLogService.log({
      user,
      category: 'AUTH',
      action: 'ÚSPEŠNÉ PRIHLÁSENIE',
      details: `${user.name} (${user.title}) sa úspešne prihlásil do systému SAY CLINIC.`,
      severity: 'info'
    });
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
          this.clearSession(null, 'Platnosť relácie vypršala');
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
  clearSession(user?: UserAccount | null, reason: string = 'Používateľské odhlásenie') {
    if (typeof window === 'undefined') return;
    
    if (user) {
      AuditLogService.log({
        user,
        category: 'AUTH',
        action: 'ODHLÁSENIE',
        details: `${user.name} bol odhlásený zo systému (${reason}).`,
        severity: 'info'
      });
    }

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
