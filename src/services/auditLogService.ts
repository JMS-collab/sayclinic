'use client';

export type AuditActionCategory = 
  | 'AUTH'            // Prihlásenie, odhlásenie, 2FA, zmena hesla, brute-force
  | 'PATIENT_RECORD'   // Zobrazenie karty pacienta, úprava údajov, anamnéza
  | 'DOCUMENT'        // Vytvorenie operačného protokolu, prepúšťacej správy, tlač, export do PDF
  | 'FINANCE'         // Vystavenie faktúry, zálohy, zobrazenie P&L, úprava cenníka
  | 'AESTHETICS'      // Zákroky tvárovej mapy, botox, aplikácia kyseliny hyalurónovej
  | 'SECURITY';       // Úprava oprávnení rolí, simulácia rolí, bezpečnostné zmeny

export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO
  formattedTime: string;
  userId: string;
  userName: string;
  userRole: string;
  userEmail: string;
  category: AuditActionCategory;
  action: string;
  details: string;
  patientId?: string;
  patientName?: string;
  severity: AuditSeverity;
  ipPlaceholder?: string;
}

const AUDIT_STORAGE_KEY = 'say_clinic_audit_logs_v1';
const MAX_LOGS_COUNT = 1500;

export const AuditLogService = {
  // Získať všetky auditné záznamy
  getLogs(): AuditLogEntry[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(AUDIT_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Chyba načítania audit logov:', e);
    }

    // Počiatočné počiatočné logy pre demonštráciu a overenie auditu
    const initialLogs = this.createInitialLogs();
    try {
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(initialLogs));
    } catch (e) {
      console.error('Chyba ukladania počiatočných logov:', e);
    }
    return initialLogs;
  },

  // Zaznamenať novú udalosť do auditu (GDPR nemenná stopa)
  log(params: {
    user?: { id: string; name: string; role: string; email: string } | null;
    category: AuditActionCategory;
    action: string;
    details: string;
    patientId?: string;
    patientName?: string;
    severity?: AuditSeverity;
  }): AuditLogEntry {
    const now = new Date();
    const formattedTime = now.toLocaleDateString('sk-SK') + ' ' + now.toLocaleTimeString('sk-SK', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });

    const entry: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now.toISOString(),
      formattedTime,
      userId: params.user?.id || 'system',
      userName: params.user?.name || 'Systém SAY CLINIC',
      userRole: params.user?.role || 'systém',
      userEmail: params.user?.email || 'system@sayclinic.sk',
      category: params.category,
      action: params.action,
      details: params.details,
      patientId: params.patientId,
      patientName: params.patientName,
      severity: params.severity || 'info',
      ipPlaceholder: 'Šifrovaná relácia TLS 1.3 (Slovakia)'
    };

    if (typeof window !== 'undefined') {
      try {
        const current = this.getLogs();
        const updated = [entry, ...current].slice(0, MAX_LOGS_COUNT);
        localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated));

        // Upozornenie pre poslucháčov
        window.dispatchEvent(new CustomEvent('say_clinic_audit_log_added', { detail: entry }));
      } catch (e) {
        console.error('Chyba zápisu audit logu:', e);
      }
    }

    return entry;
  },

  // Export záznamov do CSV (pre potreby GDPR auditu / ÚOOU)
  exportCsv(): string {
    const logs = this.getLogs();
    const headers = ['ID', 'Dátum a Čas', 'Používateľ', 'Rola', 'E-mail', 'Kategória', 'Akcia', 'Detail', 'Pacient', 'Závažnosť'];
    
    const rows = logs.map(l => [
      `"${l.id}"`,
      `"${l.formattedTime}"`,
      `"${l.userName}"`,
      `"${l.userRole}"`,
      `"${l.userEmail}"`,
      `"${l.category}"`,
      `"${l.action}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      `"${l.patientName || '-'}"`,
      `"${l.severity}"`
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  },

  // Export záznamov do JSON
  exportJson(): string {
    const logs = this.getLogs();
    return JSON.stringify(logs, null, 2);
  },

  // Počiatočná história pre auditný systém
  createInitialLogs(): AuditLogEntry[] {
    const now = Date.now();
    return [
      {
        id: `log-seed-1`,
        timestamp: new Date(now - 12 * 60000).toISOString(),
        formattedTime: new Date(now - 12 * 60000).toLocaleDateString('sk-SK') + ' ' + new Date(now - 12 * 60000).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        userId: 'u1',
        userName: 'MUDr. Ján Mráz',
        userRole: 'ceo',
        userEmail: 'mraz@sayclinic.sk',
        category: 'AUTH',
        action: 'ÚSPEŠNÉ PRIHLÁSENIE',
        details: 'Prihlásenie používateľa s 2FA zabezpečením (TLS 1.3)',
        severity: 'info',
        ipPlaceholder: 'Šifrovaná relácia TLS 1.3 (Slovakia)'
      },
      {
        id: `log-seed-2`,
        timestamp: new Date(now - 10 * 60000).toISOString(),
        formattedTime: new Date(now - 10 * 60000).toLocaleDateString('sk-SK') + ' ' + new Date(now - 10 * 60000).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        userId: 'u1',
        userName: 'MUDr. Ján Mráz',
        userRole: 'ceo',
        userEmail: 'mraz@sayclinic.sk',
        category: 'SECURITY',
        action: 'KONTROLA MATICE OPRÁVNENÍ',
        details: 'Kontrola prístupových práv modulov SAY CLINIC pre role: doctor, manager, nurse',
        severity: 'info',
        ipPlaceholder: 'Šifrovaná relácia TLS 1.3 (Slovakia)'
      },
      {
        id: `log-seed-3`,
        timestamp: new Date(now - 6 * 60000).toISOString(),
        formattedTime: new Date(now - 6 * 60000).toLocaleDateString('sk-SK') + ' ' + new Date(now - 6 * 60000).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        userId: 'u4',
        userName: 'Ing. Barbara Mecerodová, MBA',
        userRole: 'manager',
        userEmail: 'mecerodova@sayclinic.sk',
        category: 'PATIENT_RECORD',
        action: 'ZOBRAZENIE ZDRAVOTNEJ KARTY',
        details: 'Otvorenie karty a anamnézy pacientky: Mária Kováčová (kontrola pred operáciou)',
        patientId: 'p1',
        patientName: 'Mária Kováčová',
        severity: 'info',
        ipPlaceholder: 'Šifrovaná relácia TLS 1.3 (Slovakia)'
      }
    ];
  }
};
