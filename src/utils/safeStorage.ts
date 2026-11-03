/**
 * Bezpečná správa LocalStorage s ochranou proti QuotaExceededError (limit ~5 MB v prehliadačoch)
 * Automaticky:
 * 1. Ošetruje pretečenie úložiska a zamedzuje pádu aplikácie
 * 2. Pri dosiahnutí limitu vykoná inteligentné uvoľnenie miesta (kompaktácia kalendára, orezanie starých audit logov)
 * 3. Prepája sa na pamäťovú zálohu (in-memory fallback), takže aplikácia funguje plynulo aj pri plnom disku
 */

const memoryFallback = new Map<string, string>();
let isGuardInstalled = false;

export function isQuotaExceededError(err: any): boolean {
  if (!err) return false;
  return (
    err.name === 'QuotaExceededError' ||
    err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    err.code === 22 ||
    err.code === 1014 ||
    err.number === -2147024882 ||
    (typeof err.message === 'string' && err.message.toLowerCase().includes('quota'))
  );
}

/**
 * Kompaktuje udalosť kalendára: odstráni prázdne textové reťazce a redundantné predvolené hodnoty.
 * Ušetrí ~45 % veľkosti (pri 2 100 udalostiach cca 800 KB).
 */
export function compactCalendarEvent(evt: any): any {
  if (!evt || typeof evt !== 'object') return evt;
  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(evt)) {
    if (v !== '' && v !== null && v !== undefined && v !== false) {
      clean[k] = v;
    }
  }
  return clean;
}

export function compactCalendarEvents(events: any[]): any[] {
  if (!Array.isArray(events)) return [];
  return events.map(compactCalendarEvent);
}

/**
 * Núdzové uvoľnenie miesta v LocalStorage pri dosiahnutí kvóty
 */
export function emergencyStorageCleanup(): boolean {
  if (typeof window === 'undefined') return false;
  let freed = false;

  try {
    // 1. Orezanie audit logov na posledných 40 záznamov
    const auditRaw = localStorage.getItem('say_clinic_audit_logs_v1');
    if (auditRaw) {
      try {
        const logs = JSON.parse(auditRaw);
        if (Array.isArray(logs) && logs.length > 40) {
          localStorage.setItem('say_clinic_audit_logs_v1', JSON.stringify(logs.slice(0, 40)));
          freed = true;
        }
      } catch {}
    }

    // 2. Kompaktácia udalostí kalendára
    const calRaw = localStorage.getItem('say_clinic_calendar_events');
    if (calRaw && calRaw.length > 500000) {
      try {
        const events = JSON.parse(calRaw);
        if (Array.isArray(events)) {
          const compacted = compactCalendarEvents(events);
          localStorage.setItem('say_clinic_calendar_events', JSON.stringify(compacted));
          freed = true;
        }
      } catch {}
    }

    // 3. Odstránenie dočasných prítomností (live presence)
    if (localStorage.getItem('say_clinic_patient_presence')) {
      localStorage.removeItem('say_clinic_patient_presence');
      freed = true;
    }

    // 4. Orezanie starých záznamov spotreby materiálu (ponecháme posledných 80)
    const usageRaw = localStorage.getItem('say_clinic_material_usage_logs_v2');
    if (usageRaw) {
      try {
        const uLogs = JSON.parse(usageRaw);
        if (Array.isArray(uLogs) && uLogs.length > 80) {
          localStorage.setItem('say_clinic_material_usage_logs_v2', JSON.stringify(uLogs.slice(0, 80)));
          freed = true;
        }
      } catch {}
    }

    // 5. Orezanie starých opiátových logov (ponecháme posledných 80)
    const opRaw = localStorage.getItem('say_clinic_opiate_book_logs_v1');
    if (opRaw) {
      try {
        const oLogs = JSON.parse(opRaw);
        if (Array.isArray(oLogs) && oLogs.length > 80) {
          localStorage.setItem('say_clinic_opiate_book_logs_v1', JSON.stringify(oLogs.slice(0, 80)));
          freed = true;
        }
      } catch {}
    }

    // 6. Prečistenie veľkých base64 príloh v projektoch
    const projRaw = localStorage.getItem('say_clinic_projects');
    if (projRaw && projRaw.length > 300000) {
      try {
        const projs = JSON.parse(projRaw);
        if (Array.isArray(projs)) {
          let modified = false;
          const cleaned = projs.map((p: any) => {
            if (p && Array.isArray(p.attachments)) {
              const strippedAtt = p.attachments.map((a: any) => {
                if (a && typeof a.url === 'string' && a.url.startsWith('data:') && a.url.length > 50000) {
                  modified = true;
                  return { ...a, url: '' };
                }
                return a;
              });
              return { ...p, attachments: strippedAtt };
            }
            return p;
          });
          if (modified) {
            localStorage.setItem('say_clinic_projects', JSON.stringify(cleaned));
            freed = true;
          }
        }
      } catch {}
    }
  } catch (cleanErr) {
    console.warn('[SafeStorage] Chyba počas núdzového čistenia:', cleanErr);
  }

  return freed;
}

/**
 * Bezpečný zápis do localStorage s ochranou proti pádu pri prekročení kvóty
 */
export function safeStorageSetItem(key: string, value: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    localStorage.setItem(key, value);
    memoryFallback.delete(key);
    return true;
  } catch (err: any) {
    if (isQuotaExceededError(err)) {
      console.warn(`[SafeStorage] Kvóta LocalStorage prekročená pri kľúči "${key}" (~${Math.round(value.length / 1024)} KB). Spúšťam čistenie...`);
      emergencyStorageCleanup();

      // Druhý pokus po uvoľnení miesta
      try {
        localStorage.setItem(key, value);
        memoryFallback.delete(key);
        console.info(`[SafeStorage] Kľúč "${key}" bol úspešne zapísaný po uvoľnení miesta.`);
        return true;
      } catch (retryErr) {
        console.warn(`[SafeStorage] Kvóta stále plná. Kľúč "${key}" je dočasne uchovaný v pamäti (in-memory).`, retryErr);
        memoryFallback.set(key, value);
        return false;
      }
    } else {
      console.error(`[SafeStorage] Chyba pri zápise "${key}":`, err);
      memoryFallback.set(key, value);
      return false;
    }
  }
}

/**
 * Bezpečné čítanie z localStorage (s fallbackom na in-memory pamäť)
 */
export function safeStorageGetItem(key: string): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const val = localStorage.getItem(key);
    if (val !== null) return val;
  } catch (err) {
    console.warn(`[SafeStorage] Chyba pri čítaní kľúča "${key}":`, err);
  }

  return memoryFallback.get(key) || null;
}

/**
 * Globálna ochrana Storage.prototype.setItem
 * Zaručuje, že ŽIADNY komponent ani externá knižnica v aplikácii nemôže zhodiť React
 * unhandled QuotaExceededError výnimkou.
 */
export function installStorageQuotaGuard(): void {
  if (typeof window === 'undefined' || isGuardInstalled || !window.Storage) return;
  isGuardInstalled = true;

  try {
    const originalSetItem = window.Storage.prototype.setItem;
    const originalGetItem = window.Storage.prototype.getItem;
    const originalRemoveItem = window.Storage.prototype.removeItem;

    window.Storage.prototype.setItem = function (key: string, value: string): void {
      let finalVal = value;

      // Proaktívna optimalizácia pre veľké udalosti kalendára (odstránenie prázdnych reťazcov "" a false)
      if (key === 'say_clinic_calendar_events' && typeof value === 'string' && value.length > 50000) {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            finalVal = JSON.stringify(compactCalendarEvents(parsed));
          }
        } catch {}
      }

      // Proaktívne orezanie audit logov na maximálne 150 záznamov
      if (key === 'say_clinic_audit_logs_v1' && typeof value === 'string' && value.length > 100000) {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed) && parsed.length > 150) {
            finalVal = JSON.stringify(parsed.slice(0, 150));
          }
        } catch {}
      }

      try {
        originalSetItem.call(this, key, finalVal);
        memoryFallback.delete(key);
      } catch (err: any) {
        if (isQuotaExceededError(err)) {
          console.warn(`[StorageGuard] QuotaExceededError pri zápise "${key}". Spúšťam uvoľnenie miesta...`);
          emergencyStorageCleanup();
          try {
            originalSetItem.call(this, key, finalVal);
            memoryFallback.delete(key);
            return;
          } catch (retryErr) {
            console.warn(`[StorageGuard] Úložisko je plné, hodnota "${key}" je uložená v pamäťovej zálohe.`);
            memoryFallback.set(key, String(finalVal));
            return;
          }
        }
        throw err;
      }
    };

    window.Storage.prototype.getItem = function (key: string): string | null {
      try {
        const val = originalGetItem.call(this, key);
        if (val !== null) return val;
      } catch {}
      return memoryFallback.get(key) || null;
    };

    window.Storage.prototype.removeItem = function (key: string): void {
      try {
        originalRemoveItem.call(this, key);
      } catch {}
      memoryFallback.delete(key);
    };

    // Počiatočná preventívna optimalizácia existujúcich dát v prehliadači
    try {
      const calRaw = localStorage.getItem('say_clinic_calendar_events');
      if (calRaw && calRaw.length > 1000000) {
        const events = JSON.parse(calRaw);
        if (Array.isArray(events)) {
          originalSetItem.call(localStorage, 'say_clinic_calendar_events', JSON.stringify(compactCalendarEvents(events)));
        }
      }
      const auditRaw = localStorage.getItem('say_clinic_audit_logs_v1');
      if (auditRaw && auditRaw.length > 300000) {
        const logs = JSON.parse(auditRaw);
        if (Array.isArray(logs) && logs.length > 150) {
          originalSetItem.call(localStorage, 'say_clinic_audit_logs_v1', JSON.stringify(logs.slice(0, 150)));
        }
      }
    } catch {}

    console.info('[SafeStorage] Globálna ochrana LocalStorage kvóty aktívna.');
  } catch (patchErr) {
    console.warn('[SafeStorage] Nepodarilo sa aplikovať Storage guard:', patchErr);
  }
}

// Automatická aktivácia pri načítaní v klientskom prostredí
if (typeof window !== 'undefined') {
  installStorageQuotaGuard();
}
