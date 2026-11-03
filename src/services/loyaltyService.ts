// Služba pre Vernostný systém klientov SAY CLINIC (365-dňové plávajúce okno)
// Pravidlá:
// - Basic: do 1 000 € minutých za 365 dní -> zľava 0 %
// - Premium: 1 000 € – 3 000 € minutých za 365 dní -> zľava 5 %
// - VIP: nad 3 000 € minutých za 365 dní -> zľava 10 %
// - Do minutej ceny sa NEZARÁTAVAJÚ operácie (zarátava sa len Skin Care a Ošetrenia).
// - Po operácii nad 1 000 € sa klient automaticky radí minimálne do kategórie Premium (zľava 5 %).

import { RealtimeSyncService } from './realtimeSyncService';
import { CalendarEvent } from '../data/calendarConfig';
import { Patient } from '../components/PatientDatabase';

export type LoyaltyTierId = 'basic' | 'premium' | 'vip';
export type LoyaltyCategoryType = 'skincare' | 'treatment' | 'surgery';

export interface LoyaltyTierDefinition {
  id: LoyaltyTierId;
  name: string;
  shortLabel: string;
  discountPercent: number;
  minSpend: number;
  maxSpend: number | null;
  description: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  accentColor: string;
}

export const LOYALTY_TIERS: Record<LoyaltyTierId, LoyaltyTierDefinition> = {
  basic: {
    id: 'basic',
    name: 'Basic',
    shortLabel: 'BASIC (0%)',
    discountPercent: 0,
    minSpend: 0,
    maxSpend: 1000,
    description: 'Do 1 000 € minutých za 365 dní (Skin Care & Ošetrenia) • Zľava 0 %',
    badgeBg: 'bg-stone-100',
    badgeText: 'text-stone-700',
    badgeBorder: 'border-stone-300',
    accentColor: '#8C857B'
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    shortLabel: 'PREMIUM (-5%)',
    discountPercent: 5,
    minSpend: 1000,
    maxSpend: 3000,
    description: '1 000 – 3 000 € za 365 dní (alebo automaticky po operácii nad 1 000 €) • Zľava 5 %',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900',
    badgeBorder: 'border-amber-300',
    accentColor: '#C5A059'
  },
  vip: {
    id: 'vip',
    name: 'VIP',
    shortLabel: 'VIP (-10%)',
    discountPercent: 10,
    minSpend: 3000,
    maxSpend: null,
    description: 'Nad 3 000 € minutých za 365 dní (Skin Care & Ošetrenia) • Zľava 10 %',
    badgeBg: 'bg-[#2C2A29]',
    badgeText: 'text-[#C5A059]',
    badgeBorder: 'border-[#C5A059]',
    accentColor: '#2C2A29'
  }
};

export interface LoyaltyTransaction {
  id: string;
  patientId?: string;
  patientName: string;
  date: string; // YYYY-MM-DD
  category: LoyaltyCategoryType; // 'skincare' | 'treatment' | 'surgery'
  title: string;
  amount: number; // Konečná uhradená suma v €
  originalAmount?: number;
  discountPercent?: number;
  sourceId?: string; // Pre deduplikáciu (napr. ID účtu, protokolu, faktúry, udalosti)
  notes?: string;
}

export interface ClientLoyaltyOverride {
  patientId: string;
  patientName: string;
  mode: 'auto' | LoyaltyTierId; // 'auto' počíta automaticky za 365 dní, inak manuálne vynútená kategória
  forceSurgeryPremium?: boolean; // Ručné označenie absolvovanej operácie > 1000 €
  updatedAt: string;
  updatedBy?: string;
  note?: string;
}

export interface ClientLoyaltySummary {
  patientId: string;
  patientName: string;
  tier: LoyaltyTierId;
  tierDef: LoyaltyTierDefinition;
  computedTier: LoyaltyTierId;
  isManualOverride: boolean;
  overrideMode: 'auto' | LoyaltyTierId;

  // Obrat za posledných 365 dní
  skincareSpend365d: number;
  treatmentsSpend365d: number;
  eligibleSpend365d: number; // skincareSpend365d + treatmentsSpend365d (BEZ operácií)
  surgeriesSpend365d: number; // Operácie (nezapočítané do eligibleSpend365d)

  // Špeciálne pravidlo pre operáciu nad 1 000 €
  hasSurgeryOver1000: boolean;
  qualifyingSurgeryTitle?: string;
  qualifyingSurgeryAmount?: number;
  qualifyingSurgeryDate?: string;
  upgradedToPremiumBySurgery: boolean; // True ak má eligibleSpend365d < 1000, ale má operáciu > 1000 €

  // Progres do vyššej kategórie
  nextTier: LoyaltyTierId | null;
  amountToNextTier: number;
  progressPercent: number;

  // Zoznam transakcií za posledných 365 dní
  transactions365d: LoyaltyTransaction[];
}

const STORAGE_KEY_LOYALTY_TX = 'say_clinic_loyalty_transactions_v1';
const STORAGE_KEY_LOYALTY_OVERRIDES = 'say_clinic_loyalty_overrides_v1';

// Kľúčové slová pre rozpoznanie chirurgickej operácie vs. ošetrenia/skincare
const SURGERY_KEYWORDS = [
  'operácia',
  'operacia',
  'operačný protokol',
  'operacny protokol',
  'blefaroplastika',
  'blepharoplast',
  'augmentácia',
  'augmentacia',
  'rhinoplastika',
  'septorhinoplastika',
  'facelift',
  'deep plane',
  'abdominoplastika',
  'liposukcia',
  'mastopexia',
  'modelácia prsníkov',
  'redukcia prsníkov',
  'gynekomastia',
  'otoplastika',
  'labioplastika',
  'submentoplastika',
  'browlift',
  'bullhorn',
  'lip lift'
];

const SKINCARE_KEYWORDS = [
  'skinceuticals',
  'la roche-posay',
  'cerave',
  'vichy',
  'dermaceutic',
  'kozmetika',
  'dermokozmetika',
  'pos pokladňa',
  'pultový predaj',
  'sérum',
  'serum',
  'krém',
  'krem',
  'spf',
  'retinol',
  'ferulic',
  'cicaplast',
  'hyalu b5',
  'rutina',
  'skin care',
  'skincare'
];

export class LoyaltyService {
  /**
   * Overí, či dátum (YYYY-MM-DD alebo DD.MM.YYYY alebo ISO) spadá do posledných 365 dní
   */
  public static isWithinLast365Days(dateStr?: string, referenceDate: Date = new Date()): boolean {
    if (!dateStr) return false;
    const parsed = this.parseDate(dateStr);
    if (!parsed) return false;

    const diffMs = referenceDate.getTime() - parsed.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    // Povoľujeme od -1 dňa (dnešné/zajtrajšie uzavreté) až po 365 dní dozadu
    return diffDays >= -1 && diffDays <= 365;
  }

  public static parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    const trimmed = dateStr.trim();
    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      const d = new Date(trimmed);
      return isNaN(d.getTime()) ? null : d;
    }
    // DD.MM.YYYY alebo DD. MM. YYYY
    const skMatch = trimmed.match(/^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/);
    if (skMatch) {
      const day = parseInt(skMatch[1], 10);
      const month = parseInt(skMatch[2], 10) - 1;
      const year = parseInt(skMatch[3], 10);
      const d = new Date(year, month, day);
      return isNaN(d.getTime()) ? null : d;
    }
    const fallback = new Date(trimmed);
    return isNaN(fallback.getTime()) ? null : fallback;
  }

  public static normalizeDateToISO(dateStr?: string): string {
    const d = dateStr ? this.parseDate(dateStr) : new Date();
    if (!d) return new Date().toISOString().split('T')[0];
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Klasifikácia položky na 'skincare' | 'treatment' | 'surgery'
   */
  public static classifyProcedureOrItem(
    title: string,
    sourceHint?: 'aesthetics' | 'medical_record' | 'surgery' | 'pos_cosmetics' | string,
    amount?: number
  ): LoyaltyCategoryType {
    if (sourceHint === 'pos_cosmetics') return 'skincare';
    if (sourceHint === 'surgery') return 'surgery';
    if (sourceHint === 'aesthetics') return 'treatment';

    const lower = (title || '').toLowerCase();

    if (SURGERY_KEYWORDS.some(k => lower.includes(k))) {
      return 'surgery';
    }
    if (SKINCARE_KEYWORDS.some(k => lower.includes(k))) {
      return 'skincare';
    }
    return 'treatment';
  }

  // ============================================================================
  // ÚLOŽISKO EXPLICITNÝCH VERNOSTNÝCH TRANSAKCIÍ A NASTAVENÍ KLIENTOV
  // ============================================================================

  public static getStoredTransactions(): LoyaltyTransaction[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LOYALTY_TX);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Chyba čítania vernostných transakcií:', e);
    }
    return [];
  }

  public static saveStoredTransactions(txs: LoyaltyTransaction[]): void {
    if (typeof window === 'undefined') return;
    try {
      this.cachedSnapshot = null;
      RealtimeSyncService.publish('loyalty_transactions', txs);
    } catch (e) {
      console.error('Chyba ukladania vernostných transakcií:', e);
    }
  }

  public static recordTransaction(tx: Omit<LoyaltyTransaction, 'id'> & { id?: string }): LoyaltyTransaction {
    const all = this.getStoredTransactions();
    const newTx: LoyaltyTransaction = {
      ...tx,
      id: tx.id || `loy-tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: this.normalizeDateToISO(tx.date)
    };

    // Ak už existuje transakcia s rovnakým sourceId, aktualizujeme ju namiesto duplikácie
    if (newTx.sourceId) {
      const existingIdx = all.findIndex(t => t.sourceId === newTx.sourceId);
      if (existingIdx >= 0) {
        all[existingIdx] = newTx;
        this.saveStoredTransactions([...all]);
        return newTx;
      }
    }

    const updated = [newTx, ...all];
    this.saveStoredTransactions(updated);
    return newTx;
  }

  public static deleteTransaction(txId: string): void {
    const all = this.getStoredTransactions();
    this.saveStoredTransactions(all.filter(t => t.id !== txId));
  }

  public static getOverrides(): Record<string, ClientLoyaltyOverride> {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LOYALTY_OVERRIDES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {
      console.error('Chyba čítania vernostných nastavení:', e);
    }
    return {};
  }

  public static saveOverrides(overrides: Record<string, ClientLoyaltyOverride>): void {
    if (typeof window === 'undefined') return;
    try {
      this.cachedSnapshot = null;
      RealtimeSyncService.publish('loyalty_overrides', overrides);
    } catch (e) {
      console.error('Chyba ukladania vernostných nastavení:', e);
    }
  }

  /**
   * Nastavenie kategórie pre konkrétneho klienta ('auto' | 'basic' | 'premium' | 'vip')
   * alebo príznaku absolvovanej operácie > 1 000 €
   */
  public static setClientLoyaltyOverride(
    patientId: string,
    patientName: string,
    mode: 'auto' | LoyaltyTierId,
    options?: {
      forceSurgeryPremium?: boolean;
      note?: string;
      updatedBy?: string;
    }
  ): ClientLoyaltyOverride {
    const overrides = this.getOverrides();
    const key = this.getClientKey(patientId, patientName);
    const existing = overrides[key];

    const updated: ClientLoyaltyOverride = {
      patientId: patientId || key,
      patientName,
      mode,
      forceSurgeryPremium: options?.forceSurgeryPremium !== undefined ? options.forceSurgeryPremium : existing?.forceSurgeryPremium,
      updatedAt: new Date().toISOString(),
      updatedBy: options?.updatedBy || 'SAY CLINIC',
      note: options?.note !== undefined ? options.note : existing?.note
    };

    overrides[key] = updated;
    if (patientId) {
      overrides[patientId] = updated;
    }
    this.saveOverrides(overrides);
    return updated;
  }

  private static getClientKey(patientId?: string, patientName?: string): string {
    if (patientId && patientId.trim()) return patientId.trim();
    return (patientName || 'unknown').toLowerCase().trim();
  }

  private static matchesClient(
    targetId: string | undefined,
    targetName: string,
    itemPatientId?: string,
    itemPatientName?: string
  ): boolean {
    if (targetId && itemPatientId && targetId === itemPatientId) return true;
    const normTarget = (targetName || '').toLowerCase().trim();
    const normItem = (itemPatientName || '').toLowerCase().trim();
    if (normTarget && normItem && normTarget === normItem) return true;
    return false;
  }

  // ============================================================================
  // PRED-INDEXOVANÝ SNAPSHOT PRE OKAMŽITÝ O(1) VÝPOČET VERNOSTNÉHO SYSTÉMU
  // ============================================================================

  private static cachedSnapshot: {
    rawTx: string | null;
    rawAes: string | null;
    rawProf: string | null;
    rawInv: string | null;
    rawSales: string | null;
    rawCal: string | null;
    rawSurg: string | null;
    rawOverrides: string | null;
    externalCalRef?: CalendarEvent[];
    refDayKey: string;
    byId: Map<string, Array<{ seq: number; tx: LoyaltyTransaction }>>;
    byName: Map<string, Array<{ seq: number; tx: LoyaltyTransaction }>>;
    overrides: Record<string, ClientLoyaltyOverride>;
  } | null = null;

  private static lastValidatedAt = 0;
  private static listenersAttached = false;

  // Pri akejkoľvek zmene zdrojových dát okamžite zneplatníme snapshot
  private static ensureInvalidationListeners(): void {
    if (this.listenersAttached || typeof window === 'undefined') return;
    this.listenersAttached = true;
    const invalidate = () => {
      this.cachedSnapshot = null;
      this.lastValidatedAt = 0;
    };
    [
      'say_clinic_loyalty_changed',
      'say_clinic_invoices_changed',
      'say_clinic_client_profiles_changed',
      'say_clinic_sales_changed',
      'say_clinic_calendar_events_changed',
      'say_clinic_aesthetic_sessions_changed',
      'say_clinic_patient_surgeries_changed',
      'storage'
    ].forEach(evt => window.addEventListener(evt, invalidate));
  }

  private static getIndexedSnapshot(
    externalCalendarEvents?: CalendarEvent[],
    refDate: Date = new Date()
  ) {
    const refDayKey = `${refDate.getFullYear()}-${String(refDate.getMonth() + 1).padStart(2, '0')}-${String(refDate.getDate()).padStart(2, '0')}`;

    if (typeof window === 'undefined') {
      return {
        byId: new Map<string, Array<{ seq: number; tx: LoyaltyTransaction }>>(),
        byName: new Map<string, Array<{ seq: number; tx: LoyaltyTransaction }>>(),
        overrides: {} as Record<string, ClientLoyaltyOverride>
      };
    }

    this.ensureInvalidationListeners();

    // Rýchla cesta: v rámci krátkeho okna (jeden render tabuľky) nečítame localStorage opakovane
    const nowTs = Date.now();
    if (
      this.cachedSnapshot &&
      this.cachedSnapshot.refDayKey === refDayKey &&
      this.cachedSnapshot.externalCalRef === externalCalendarEvents &&
      nowTs - this.lastValidatedAt < 1000
    ) {
      return this.cachedSnapshot;
    }
    this.lastValidatedAt = nowTs;

    const rawTx = localStorage.getItem(STORAGE_KEY_LOYALTY_TX);
    const rawAes = localStorage.getItem('say_clinic_aesthetic_sessions');
    const rawProf = localStorage.getItem('say_clinic_client_financial_profiles_v1');
    const rawInv = localStorage.getItem('say_clinic_invoices_v1');
    const rawSales = localStorage.getItem('say_clinic_sales_v1');
    const rawCal = externalCalendarEvents ? null : localStorage.getItem('say_clinic_calendar_events');
    const rawSurg = localStorage.getItem('say_clinic_patient_surgeries');
    const rawOverrides = localStorage.getItem(STORAGE_KEY_LOYALTY_OVERRIDES);

    const snap = this.cachedSnapshot;
    if (
      snap &&
      snap.refDayKey === refDayKey &&
      snap.rawTx === rawTx &&
      snap.rawAes === rawAes &&
      snap.rawProf === rawProf &&
      snap.rawInv === rawInv &&
      snap.rawSales === rawSales &&
      snap.rawCal === rawCal &&
      snap.rawSurg === rawSurg &&
      snap.rawOverrides === rawOverrides &&
      snap.externalCalRef === externalCalendarEvents
    ) {
      return snap;
    }

    const byId = new Map<string, Array<{ seq: number; tx: LoyaltyTransaction }>>();
    const byName = new Map<string, Array<{ seq: number; tx: LoyaltyTransaction }>>();
    let seq = 0;

    const indexTx = (tx: LoyaltyTransaction, pId?: string, pName?: string) => {
      if (!tx || tx.amount <= 0) return;
      const item = { seq: seq++, tx };
      // Indexujeme iba podľa explicitne zadaných kľúčov (zachováva pôvodnú logiku párovania zdrojov)
      const cleanId = (pId || '').trim();
      if (cleanId) {
        let list = byId.get(cleanId);
        if (!list) {
          list = [];
          byId.set(cleanId, list);
        }
        list.push(item);
      }
      const cleanName = (pName || '').toLowerCase().trim();
      if (cleanName) {
        let list = byName.get(cleanName);
        if (!list) {
          list = [];
          byName.set(cleanName, list);
        }
        list.push(item);
      }
    };

    // 1. Explicitne uložené vernostné transakcie
    if (rawTx) {
      try {
        const storedTxs = JSON.parse(rawTx);
        if (Array.isArray(storedTxs)) {
          storedTxs.forEach(tx => indexTx(tx, tx?.patientId, tx?.patientName));
        }
      } catch {}
    }

    // 2. Estetické ošetrenia zo storage (say_clinic_aesthetic_sessions) -> vždy 'treatment'
    if (rawAes) {
      try {
        const allAes: Record<string, any[]> = JSON.parse(rawAes);
        if (allAes && typeof allAes === 'object') {
          Object.entries(allAes).forEach(([pKey, sessList]) => {
            if (!Array.isArray(sessList)) return;
            sessList.forEach(s => {
              const price = Number(s?.price ?? s?.subtotal ?? 0);
              if (price > 0) {
                indexTx(
                  {
                    id: `aes-${s.id}`,
                    sourceId: s.protocolNumber || s.id,
                    patientId: pKey,
                    patientName: s.patientName || '',
                    date: s.date || s.formattedDate,
                    category: 'treatment',
                    title: s.title || 'Estetické ošetrenie',
                    amount: price
                  },
                  pKey,
                  undefined
                );
              }
            });
          });
        }
      } catch {}
    }

    // 3. Finančné profily klientov (say_clinic_client_financial_profiles_v1)
    if (rawProf) {
      try {
        const profiles = JSON.parse(rawProf);
        if (Array.isArray(profiles)) {
          profiles.forEach(prof => {
            if (!prof) return;
            const procClass = this.classifyProcedureOrItem(prof.procedureName);
            const isSurgery = prof.status === 'operated' || procClass === 'surgery';

            const category: LoyaltyCategoryType = isSurgery ? 'surgery' : procClass;
            const effectiveAmount = isSurgery
              ? (prof.status === 'operated' ? Math.max(prof.totalAgreedPrice, prof.totalPaid) : prof.totalPaid)
              : (prof.totalPaid > 0 ? prof.totalPaid : prof.totalAgreedPrice);

            if (effectiveAmount > 0 && (prof.status === 'operated' || prof.status === 'consultation' || prof.totalPaid > 0)) {
              indexTx(
                {
                  id: `prof-${prof.id}`,
                  sourceId: prof.linkedEventId || prof.id,
                  patientId: prof.patientId,
                  patientName: prof.patientName,
                  date: prof.procedureDate,
                  category,
                  title: prof.procedureName,
                  amount: effectiveAmount
                },
                prof.patientId,
                prof.patientName
              );
            }
          });
        }
      } catch {}
    }

    // 4. Uhradené faktúry (say_clinic_invoices_v1)
    if (rawInv) {
      try {
        const invoices = JSON.parse(rawInv);
        if (Array.isArray(invoices)) {
          invoices.forEach(inv => {
            if (!inv || inv.status !== 'paid' || inv.type === 'advance') return;
            const itemsSummary = (inv.items || []).map((i: any) => i.description).join(', ') || inv.notes || 'Faktúra';
            const category = this.classifyProcedureOrItem(itemsSummary);
            const amount = inv.paidAmount || inv.totalAmount;
            if (amount > 0) {
              indexTx(
                {
                  id: `inv-${inv.id}`,
                  sourceId: inv.id,
                  patientId: inv.patientId,
                  patientName: inv.patientName,
                  date: inv.paidDate || inv.issueDate,
                  category,
                  title: itemsSummary,
                  amount
                },
                inv.patientId,
                inv.patientName
              );
            }
          });
        }
      } catch {}
    }

    // 5. Priame predaje z POS / Ambulancie (say_clinic_sales_v1)
    if (rawSales) {
      try {
        const salesList = JSON.parse(rawSales);
        if (Array.isArray(salesList)) {
          salesList.forEach((sale: any) => {
            if (!sale) return;
            const category = this.classifyProcedureOrItem(sale.serviceType || '');
            const amount = Number(sale.amount) || 0;
            if (amount > 0) {
              indexTx(
                {
                  id: `sale-${sale.id}`,
                  sourceId: sale.id,
                  patientId: sale.patientId,
                  patientName: sale.patientName,
                  date: sale.date,
                  category,
                  title: sale.serviceType || 'Predaj / Výkon',
                  amount
                },
                sale.patientId,
                sale.patientName
              );
            }
          });
        }
      } catch {}
    }

    // 6. Kalendárové udalosti (ak boli odoperované / zrealizované v minulosti)
    let calEvents = externalCalendarEvents;
    if (!calEvents && rawCal) {
      try {
        calEvents = JSON.parse(rawCal);
      } catch {}
    }
    if (Array.isArray(calEvents)) {
      const refTime = refDate.getTime();
      calEvents.forEach(evt => {
        if (!evt || (evt.type !== 'operacia' && evt.type !== 'osetrenie')) return;
        const evtDate = this.parseDate(evt.date);
        if (!evtDate || evtDate.getTime() > refTime) return;

        const category: LoyaltyCategoryType = evt.type === 'operacia' ? 'surgery' : 'treatment';
        const price = Number(evt.totalPrice) || 0;
        if (price > 0) {
          indexTx(
            {
              id: `evt-${evt.id}`,
              sourceId: evt.id,
              patientId: evt.patientId,
              patientName: evt.patientName,
              date: evt.date,
              category,
              title: evt.title || (evt.type === 'operacia' ? 'Operácia' : 'Ošetrenie'),
              amount: price
            },
            evt.patientId,
            evt.patientName
          );
        }
      });
    }

    // 7. Záznamy operácií pacienta (say_clinic_patient_surgeries)
    if (rawSurg) {
      try {
        const opsMap = JSON.parse(rawSurg);
        if (opsMap && typeof opsMap === 'object') {
          Object.entries(opsMap).forEach(([pId, pOps]) => {
            if (!Array.isArray(pOps)) return;
            pOps.forEach((op: any, idx: number) => {
              const price = Number(op?.price || op?.totalPrice || 1500);
              if (price > 0) {
                indexTx(
                  {
                    id: `surg-rec-${pId}-${idx}`,
                    sourceId: op.id || `surg-${pId}-${op.date}`,
                    patientId: pId,
                    patientName: op.patientName || '',
                    date: op.date || refDayKey,
                    category: 'surgery',
                    title: op.name || op.title || 'Operačný zákrok',
                    amount: price
                  },
                  pId,
                  undefined
                );
              }
            });
          });
        }
      } catch {}
    }

    let overrides: Record<string, ClientLoyaltyOverride> = {};
    if (rawOverrides) {
      try {
        const parsed = JSON.parse(rawOverrides);
        if (parsed && typeof parsed === 'object') overrides = parsed;
      } catch {}
    }

    this.cachedSnapshot = {
      rawTx,
      rawAes,
      rawProf,
      rawInv,
      rawSales,
      rawCal,
      rawSurg,
      rawOverrides,
      externalCalRef: externalCalendarEvents,
      refDayKey,
      byId,
      byName,
      overrides
    };

    return this.cachedSnapshot;
  }

  // ============================================================================
  // HLAVNÝ VÝPOČET VERNOSTNÉHO STATUSU KLIENTA ZA 365 DNÍ
  // ============================================================================

  /**
   * Vypočíta kompletný vernostný profil klienta za posledných 365 dní:
   * - Zbiera a deduplikuje dáta z:
   *   1. Explicitných vernostných transakcií (POS nákupy skincare, ošetrenia, manuálne záznamy)
   *   2. Estetických ošetrení (say_clinic_aesthetic_sessions) -> Ošetrenia
   *   3. Finančných profilov a faktúr (say_clinic_client_financial_profiles_v1, say_clinic_invoices_v1)
   *   4. Predajov POS (say_clinic_sales_v1)
   *   5. Kalendárových udalostí (operácie a ošetrenia v minulosti)
   * - Do minutej sumy (eligibleSpend365d) započítava IBA 'skincare' a 'treatment' za posledných 365 dní.
   * - Operácie ('surgery') sa do minutej sumy NEZAPOČÍTAVAJÚ.
   * - Ak má klient operáciu > 1 000 € (over1000), automaticky získava minimálne kategóriu Premium (5 %).
   */
  public static calculateClientLoyalty(
    patient: { id?: string; name: string; loyaltyTierOverride?: 'auto' | LoyaltyTierId },
    extraContext?: {
      calendarEvents?: CalendarEvent[];
      referenceDate?: Date;
    }
  ): ClientLoyaltySummary {
    const refDate = extraContext?.referenceDate || new Date();
    const patientId = (patient.id || '').trim();
    const patientName = patient.name || 'Neznámy klient';
    const normName = patientName.toLowerCase().trim();

    const snapshot = this.getIndexedSnapshot(extraContext?.calendarEvents, refDate);

    const collectedTxs: LoyaltyTransaction[] = [];
    const seenSignatures = new Set<string>();

    const addUniqueTx = (tx: LoyaltyTransaction) => {
      if (!tx || tx.amount <= 0) return;
      const normDate = this.normalizeDateToISO(tx.date);
      // Signature podľa sourceId alebo kombinácie dátumu, kategórie a zaokrúhlenej sumy
      if (tx.sourceId && seenSignatures.has(`src:${tx.sourceId}`)) return;
      const dateAmountSig = `${normDate}|${tx.category}|${Math.round(tx.amount)}`;
      if (seenSignatures.has(dateAmountSig)) return;

      if (tx.sourceId) seenSignatures.add(`src:${tx.sourceId}`);
      seenSignatures.add(dateAmountSig);
      collectedTxs.push({
        ...tx,
        patientId: tx.patientId || patientId,
        patientName: tx.patientName || patientName,
        date: normDate
      });
    };

    const byIdList = patientId ? snapshot.byId.get(patientId) : undefined;
    const byNameList = normName ? snapshot.byName.get(normName) : undefined;

    if (byIdList && byNameList) {
      const merged = [...byIdList, ...byNameList].sort((a, b) => a.seq - b.seq);
      const seenSeq = new Set<number>();
      for (let i = 0; i < merged.length; i++) {
        const item = merged[i];
        if (seenSeq.has(item.seq)) continue;
        seenSeq.add(item.seq);
        addUniqueTx(item.tx);
      }
    } else if (byIdList) {
      for (let i = 0; i < byIdList.length; i++) {
        addUniqueTx(byIdList[i].tx);
      }
    } else if (byNameList) {
      for (let i = 0; i < byNameList.length; i++) {
        addUniqueTx(byNameList[i].tx);
      }
    }

    // Filtrujeme transakcie za posledných 365 dní
    const transactions365d = collectedTxs
      .filter(tx => this.isWithinLast365Days(tx.date, refDate))
      .sort((a, b) => b.date.localeCompare(a.date));

    let skincareSpend365d = 0;
    let treatmentsSpend365d = 0;
    let surgeriesSpend365d = 0;

    transactions365d.forEach(tx => {
      if (tx.category === 'skincare') {
        skincareSpend365d += tx.amount;
      } else if (tx.category === 'treatment') {
        treatmentsSpend365d += tx.amount;
      } else if (tx.category === 'surgery') {
        surgeriesSpend365d += tx.amount;
      }
    });

    skincareSpend365d = Math.round(skincareSpend365d * 100) / 100;
    treatmentsSpend365d = Math.round(treatmentsSpend365d * 100) / 100;
    surgeriesSpend365d = Math.round(surgeriesSpend365d * 100) / 100;

    // Do minutej ceny sa NEZARÁTAVAJÚ operácie - zarátava sa len skin care a ošetrenia!
    const eligibleSpend365d = Math.round((skincareSpend365d + treatmentsSpend365d) * 100) / 100;

    // Kontrola operácie nad 1 000 € (za posledných 365 dní alebo v histórii klienta / manuálnom nastavení)
    const overrides = snapshot.overrides;
    const overrideEntry = (patientId && overrides[patientId]) || overrides[this.getClientKey(patientId, patientName)];

    const qualifyingSurgeryTx = transactions365d.find(tx => tx.category === 'surgery' && tx.amount > 1000) ||
      collectedTxs.find(tx => tx.category === 'surgery' && tx.amount > 1000);

    const hasSurgeryOver1000 = Boolean(qualifyingSurgeryTx) || Boolean(overrideEntry?.forceSurgeryPremium);

    // Výpočet automatickej kategórie podľa 365-dňového obratu + pravidla pre operáciu nad 1 000 €:
    // - Basic: do 1 000 € (0 %)
    // - Premium: 1 000 – 3 000 € (5 %) ALEBO automaticky po operácii nad 1 000 €
    // - VIP: nad 3 000 € (10 %)
    let computedTier: LoyaltyTierId = 'basic';
    let upgradedToPremiumBySurgery = false;

    if (eligibleSpend365d > 3000) {
      computedTier = 'vip';
    } else if (eligibleSpend365d >= 1000) {
      computedTier = 'premium';
    } else if (hasSurgeryOver1000) {
      computedTier = 'premium';
      upgradedToPremiumBySurgery = true;
    } else {
      computedTier = 'basic';
    }

    // Zohľadnenie prípadného manuálneho nastavenia kategórie u klienta
    const effectiveOverrideMode: 'auto' | LoyaltyTierId =
      patient.loyaltyTierOverride || overrideEntry?.mode || 'auto';

    const finalTier: LoyaltyTierId =
      effectiveOverrideMode !== 'auto' ? effectiveOverrideMode : computedTier;

    // Výpočet progresu do ďalšej úrovne (podľa eligibleSpend365d)
    let nextTier: LoyaltyTierId | null = null;
    let amountToNextTier = 0;
    let progressPercent = 100;

    if (finalTier === 'basic') {
      nextTier = 'premium';
      amountToNextTier = Math.max(0, Math.round((1000 - eligibleSpend365d) * 100) / 100);
      progressPercent = Math.min(100, Math.round((eligibleSpend365d / 1000) * 100));
    } else if (finalTier === 'premium') {
      nextTier = 'vip';
      amountToNextTier = Math.max(0, Math.round((3000.01 - eligibleSpend365d) * 100) / 100);
      progressPercent = Math.min(100, Math.round((eligibleSpend365d / 3000) * 100));
    } else {
      nextTier = null;
      amountToNextTier = 0;
      progressPercent = 100;
    }

    return {
      patientId,
      patientName,
      tier: finalTier,
      tierDef: LOYALTY_TIERS[finalTier],
      computedTier,
      isManualOverride: effectiveOverrideMode !== 'auto',
      overrideMode: effectiveOverrideMode,
      skincareSpend365d,
      treatmentsSpend365d,
      eligibleSpend365d,
      surgeriesSpend365d,
      hasSurgeryOver1000,
      qualifyingSurgeryTitle: qualifyingSurgeryTx?.title || (overrideEntry?.forceSurgeryPremium ? 'Operácia nad 1 000 € (potvrdené)' : undefined),
      qualifyingSurgeryAmount: qualifyingSurgeryTx?.amount,
      qualifyingSurgeryDate: qualifyingSurgeryTx?.date,
      upgradedToPremiumBySurgery,
      nextTier,
      amountToNextTier,
      progressPercent,
      transactions365d
    };
  }

  /**
   * Hromadný výpočet vernostných štatistík pre zoznam klientov
   */
  public static calculateAllClientsLoyalty(
    patients: Array<{ id: string; name: string; loyaltyTierOverride?: 'auto' | LoyaltyTierId }>,
    calendarEvents?: CalendarEvent[]
  ): Map<string, ClientLoyaltySummary> {
    const map = new Map<string, ClientLoyaltySummary>();
    const refDate = new Date();
    patients.forEach(p => {
      const summary = this.calculateClientLoyalty(p, { calendarEvents, referenceDate: refDate });
      map.set(p.id, summary);
      map.set(p.name.toLowerCase().trim(), summary);
    });
    return map;
  }
}
