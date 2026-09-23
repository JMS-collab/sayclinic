// Služba pre správu financií, fakturácie, zálohových faktúr, kreditu a finančných profilov klientov SAY CLINIC
import { MaterialUsageLog, InventoryService } from './inventoryService';
import { CalendarEvent } from '../data/calendarConfig';
import { Patient } from '../components/PatientDatabase';

export type InvoiceType = 'standard' | 'advance' | 'proforma';
export type InvoiceStatus = 'paid' | 'unpaid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'bank_transfer' | 'card' | 'cash' | 'credit_deduction';

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number; // Cena bez DPH alebo konečná
  vatRate: number; // % napr. 20 alebo 0 (oslobodené od DPH pri zdravotnej starostlivosti § 29 zákona o DPH)
  total: number;
}

export interface Invoice {
  id: string; // napr. 'FA-2026-0042' alebo 'ZF-2026-0018'
  invoiceNumber: string;
  type: InvoiceType;
  patientId?: string;
  patientName: string;
  patientBirthNumber?: string;
  patientAddress?: string;
  patientEmail?: string;
  patientPhone?: string;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  deliveryDate?: string; // Dátum dodania tovaru / poskytnutia služby
  paidDate?: string;
  status: InvoiceStatus;
  paymentMethod: PaymentMethod;
  variableSymbol: string;
  items: InvoiceLineItem[];
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  appliedCredit: number;
  linkedSurgeryEventId?: string;
  linkedRecordId?: string;
  notes?: string;
  createdBy: string;
}

export interface PatientFinancialProfile {
  id: string;
  patientId?: string;
  patientName: string;
  patientBirthNumber?: string;
  patientPhone?: string;
  patientEmail?: string;
  patientAddress?: string;
  status: 'planned' | 'operated' | 'consultation';
  procedureName: string;
  procedureDate: string; // YYYY-MM-DD
  doctorName: string;
  roomName?: string;
  anesthesiaType?: string;
  
  // Financie
  totalAgreedPrice: number; // Dohodnutá celková cena operácie/zákroku
  depositRequired: number;  // Požadovaná záloha
  depositPaid: number;      // Už zaplatená záloha
  isDepositPaid: boolean;
  clientCredit: number;     // Aktuálny voľný kredit pacienta (napr. preplatok, voucher)
  totalBilled: number;      // Celková vyfakturovaná suma
  totalPaid: number;        // Celková uhradená suma
  balanceDue: number;       // Zostáva doplatiť: totalAgreedPrice - totalPaid - clientCredit
  
  // Reálna spotreba materiálu zo skladu
  materialCost: number;     // Súčet nákupných cien použitého materiálu
  materialItemsCount: number;
  netProcedureMargin: number; // Zisk zo zákroku: totalAgreedPrice - materialCost
  marginPercentage: number;   // % marža: (netProcedureMargin / totalAgreedPrice) * 100

  // Prepojenia
  linkedEventId?: string;
  linkedRecordId?: string;
  invoices: string[]; // Zoznam ID faktúr
  notes?: string;
}

export interface CreditTransaction {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  timestamp: string;
  type: 'deposit_topup' | 'usage_deduction' | 'refund' | 'gift_voucher';
  amount: number; // kladné pre dobitie, záporné pre odpočet
  balanceAfter: number;
  note: string;
  recordedBy: string;
}

// Predvolené počiatočné faktúry a zálohové faktúry (Ostrá prevádzka - čistý štart)
export const INITIAL_INVOICES: Invoice[] = [];

// Predvolené počiatočné profily klientov (Ostrá prevádzka - čistý štart)
export const INITIAL_CLIENT_PROFILES: PatientFinancialProfile[] = [];

// Predvolené transakcie kreditov (Ostrá prevádzka - čistý štart)
export const INITIAL_CREDIT_LOGS: CreditTransaction[] = [];

export class FinanceBillingService {
  private static STORAGE_KEY_INVOICES = 'say_clinic_invoices_v1';
  private static STORAGE_KEY_CLIENT_PROFILES = 'say_clinic_client_financial_profiles_v1';
  private static STORAGE_KEY_CREDIT_LOGS = 'say_clinic_credit_logs_v1';
  private static STORAGE_KEY_CLEAN_INIT = 'say_clinic_finance_clean_v2';

  // Overenie a vyčistenie starých demo dát pri prvom spustení ostrej verzie
  public static checkAndMigrateCleanState(): void {
    if (typeof window === 'undefined') return;
    try {
      if (localStorage.getItem(this.STORAGE_KEY_CLEAN_INIT) !== 'true') {
        localStorage.setItem(this.STORAGE_KEY_INVOICES, JSON.stringify([]));
        localStorage.setItem(this.STORAGE_KEY_CLIENT_PROFILES, JSON.stringify([]));
        localStorage.setItem(this.STORAGE_KEY_CREDIT_LOGS, JSON.stringify([]));
        localStorage.setItem('say_clinic_expenses_v1', JSON.stringify([]));
        localStorage.setItem('say_clinic_sales_v1', JSON.stringify([]));
        localStorage.setItem(this.STORAGE_KEY_CLEAN_INIT, 'true');
      }
    } catch (e) {
      console.error('Chyba migrácie ostrej verzie financií:', e);
    }
  }

  // Kompletné vynulovanie všetkých finančných dát (Ostrý štart na požiadanie)
  public static resetAllFinancialData(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.STORAGE_KEY_INVOICES, JSON.stringify([]));
      localStorage.setItem(this.STORAGE_KEY_CLIENT_PROFILES, JSON.stringify([]));
      localStorage.setItem(this.STORAGE_KEY_CREDIT_LOGS, JSON.stringify([]));
      localStorage.setItem('say_clinic_expenses_v1', JSON.stringify([]));
      localStorage.setItem('say_clinic_sales_v1', JSON.stringify([]));
      localStorage.setItem(this.STORAGE_KEY_CLEAN_INIT, 'true');

      window.dispatchEvent(new CustomEvent('say_clinic_invoices_changed', { detail: [] }));
      window.dispatchEvent(new CustomEvent('say_clinic_client_profiles_changed', { detail: [] }));
      window.dispatchEvent(new CustomEvent('say_clinic_credit_logs_changed', { detail: [] }));
      window.dispatchEvent(new CustomEvent('say_clinic_sales_changed', { detail: [] }));
      window.dispatchEvent(new CustomEvent('say_clinic_expenses_changed', { detail: [] }));
    } catch (e) {
      console.error('Chyba pri nulovaní finančných dát:', e);
    }
  }

  // Načítanie všetkých faktúr
  public static getInvoices(): Invoice[] {
    if (typeof window === 'undefined') return INITIAL_INVOICES;
    this.checkAndMigrateCleanState();
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY_INVOICES);
      if (saved !== null) {
        return JSON.parse(saved);
      }
      localStorage.setItem(this.STORAGE_KEY_INVOICES, JSON.stringify(INITIAL_INVOICES));
      return INITIAL_INVOICES;
    } catch (e) {
      console.error('Chyba načítania faktúr:', e);
      return INITIAL_INVOICES;
    }
  }

  // Uloženie faktúr
  public static saveInvoices(invoices: Invoice[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.STORAGE_KEY_INVOICES, JSON.stringify(invoices));
      window.dispatchEvent(new CustomEvent('say_clinic_invoices_changed', { detail: invoices }));
    } catch (e) {
      console.error('Chyba ukladania faktúr:', e);
    }
  }

  // Pridanie alebo aktualizácia faktúry
  public static saveInvoice(invoice: Invoice): Invoice[] {
    const all = this.getInvoices();
    const idx = all.findIndex(i => i.id === invoice.id || i.invoiceNumber === invoice.invoiceNumber);
    let updated: Invoice[];
    if (idx >= 0) {
      updated = [...all];
      updated[idx] = invoice;
    } else {
      updated = [invoice, ...all];
    }
    this.saveInvoices(updated);

    // Automatická aktualizácia zostatku u klienta
    this.syncInvoiceToClientProfile(invoice);
    return updated;
  }

  // Označenie faktúry ako uhradenej
  public static markInvoicePaid(invoiceId: string, paymentMethod: PaymentMethod = 'bank_transfer', amountPaid?: number): Invoice | null {
    const all = this.getInvoices();
    const invoice = all.find(i => i.id === invoiceId);
    if (!invoice) return null;

    const actualAmount = amountPaid !== undefined ? amountPaid : invoice.totalAmount;
    invoice.paidAmount = actualAmount;
    invoice.remainingAmount = Math.max(0, invoice.totalAmount - actualAmount);
    invoice.status = invoice.remainingAmount <= 0 ? 'paid' : 'unpaid';
    invoice.paidDate = new Date().toISOString().split('T')[0];
    invoice.paymentMethod = paymentMethod;

    this.saveInvoices(all);
    this.syncInvoiceToClientProfile(invoice);
    return invoice;
  }

  // Načítanie finančných profilov klientov (Plánovaní a Odoperovaní)
  public static getClientProfiles(): PatientFinancialProfile[] {
    if (typeof window === 'undefined') return INITIAL_CLIENT_PROFILES;
    this.checkAndMigrateCleanState();
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY_CLIENT_PROFILES);
      if (saved !== null) {
        return JSON.parse(saved);
      }
      localStorage.setItem(this.STORAGE_KEY_CLIENT_PROFILES, JSON.stringify(INITIAL_CLIENT_PROFILES));
      return INITIAL_CLIENT_PROFILES;
    } catch (e) {
      console.error('Chyba načítania profilov klientov:', e);
      return INITIAL_CLIENT_PROFILES;
    }
  }

  // Uloženie finančných profilov klientov
  public static saveClientProfiles(profiles: PatientFinancialProfile[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.STORAGE_KEY_CLIENT_PROFILES, JSON.stringify(profiles));
      window.dispatchEvent(new CustomEvent('say_clinic_client_profiles_changed', { detail: profiles }));
    } catch (e) {
      console.error('Chyba ukladania profilov klientov:', e);
    }
  }

  // Pridanie alebo aktualizácia profilu klienta
  public static saveClientProfile(profile: PatientFinancialProfile): PatientFinancialProfile[] {
    const all = this.getClientProfiles();
    const idx = all.findIndex(p => p.id === profile.id || (p.patientName.toLowerCase() === profile.patientName.toLowerCase() && p.procedureName === profile.procedureName));
    let updated: PatientFinancialProfile[];
    if (idx >= 0) {
      updated = [...all];
      updated[idx] = profile;
    } else {
      updated = [profile, ...all];
    }
    this.saveClientProfiles(updated);
    return updated;
  }

  // Záznam platby od klienta (hotovosť, karta, prevod, odpočet z kreditu)
  public static recordClientPayment(profileId: string, amount: number, paymentMethod: PaymentMethod, note?: string): PatientFinancialProfile | null {
    const all = this.getClientProfiles();
    const profile = all.find(p => p.id === profileId);
    if (!profile) return null;

    profile.totalPaid = (profile.totalPaid || 0) + amount;
    if (amount >= profile.depositRequired && !profile.isDepositPaid) {
      profile.depositPaid = Math.min(amount, profile.depositRequired);
      profile.isDepositPaid = true;
    }
    
    // Zostáva doplatiť
    profile.balanceDue = Math.max(0, profile.totalAgreedPrice - profile.totalPaid - profile.clientCredit);
    
    const paymentRecordNote = `Platba ${amount} € (${paymentMethod})${note ? `: ${note}` : ''}`;
    profile.notes = profile.notes ? `${profile.notes} | ${paymentRecordNote}` : paymentRecordNote;

    this.saveClientProfiles(all);
    return profile;
  }

  // Úprava alebo dobitie kreditu pacienta
  public static adjustClientCredit(
    patientId: string, 
    patientName: string, 
    amount: number, 
    type: 'deposit_topup' | 'usage_deduction' | 'refund' | 'gift_voucher',
    note: string,
    recordedBy: string = 'SAY CLINIC Recepcia'
  ): { newBalance: number; profile?: PatientFinancialProfile } {
    const allProfiles = this.getClientProfiles();
    const profile = allProfiles.find(p => (p.patientId && p.patientId === patientId) || p.patientName.toLowerCase() === patientName.toLowerCase());

    const currentCredit = profile ? profile.clientCredit : 0;
    const newBalance = Math.max(0, currentCredit + amount);

    if (profile) {
      profile.clientCredit = newBalance;
      profile.balanceDue = Math.max(0, profile.totalAgreedPrice - profile.totalPaid - newBalance);
      this.saveClientProfiles(allProfiles);
    }

    // Zalogovanie transakcie kreditu
    const logs = this.getCreditLogs();
    const newLog: CreditTransaction = {
      id: `c-log-${Date.now()}`,
      patientId: patientId || (profile?.id || 'P-UNKNOWN'),
      patientName,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      type,
      amount,
      balanceAfter: newBalance,
      note,
      recordedBy
    };
    this.saveCreditLogs([newLog, ...logs]);

    return { newBalance, profile };
  }

  // Načítanie knihy kreditných pohybov
  public static getCreditLogs(): CreditTransaction[] {
    if (typeof window === 'undefined') return INITIAL_CREDIT_LOGS;
    this.checkAndMigrateCleanState();
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY_CREDIT_LOGS);
      if (saved !== null) {
        return JSON.parse(saved);
      }
      localStorage.setItem(this.STORAGE_KEY_CREDIT_LOGS, JSON.stringify(INITIAL_CREDIT_LOGS));
      return INITIAL_CREDIT_LOGS;
    } catch (e) {
      console.error('Chyba načítania logov kreditu:', e);
      return INITIAL_CREDIT_LOGS;
    }
  }

  public static saveCreditLogs(logs: CreditTransaction[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.STORAGE_KEY_CREDIT_LOGS, JSON.stringify(logs));
      window.dispatchEvent(new CustomEvent('say_clinic_credit_logs_changed', { detail: logs }));
    } catch (e) {
      console.error('Chyba ukladania logov kreditu:', e);
    }
  }

  // Synchronizácia faktúry k profilu klienta
  private static syncInvoiceToClientProfile(invoice: Invoice): void {
    const all = this.getClientProfiles();
    const profile = all.find(p => 
      (invoice.patientId && p.patientId === invoice.patientId) || 
      p.patientName.toLowerCase() === invoice.patientName.toLowerCase()
    );
    if (!profile) return;

    if (!profile.invoices.includes(invoice.invoiceNumber)) {
      profile.invoices.push(invoice.invoiceNumber);
    }

    if (invoice.type === 'advance' && invoice.status === 'paid') {
      profile.depositPaid = invoice.paidAmount;
      profile.isDepositPaid = true;
    }

    if (invoice.type === 'standard' && invoice.status === 'paid') {
      profile.totalPaid = Math.max(profile.totalPaid, invoice.paidAmount);
    }

    profile.balanceDue = Math.max(0, profile.totalAgreedPrice - profile.totalPaid - profile.clientCredit);
    this.saveClientProfiles(all);
  }

  // Prepojenie reálnej skladovej spotreby materiálu ku klientovi
  public static calculateClientMaterialUsage(patientName: string, patientId?: string): { totalCost: number; itemsCount: number; logs: MaterialUsageLog[] } {
    const allLogs = InventoryService.getUsageLogs();
    const patientLogs = allLogs.filter(l => 
      (patientId && l.patientId === patientId) || 
      (l.patientName && l.patientName.toLowerCase().trim() === patientName.toLowerCase().trim())
    );

    const totalCost = patientLogs.reduce((acc, item) => acc + (item.costAtUsage * item.quantity), 0);
    return {
      totalCost,
      itemsCount: patientLogs.length,
      logs: patientLogs
    };
  }

  // Generátor ďalšieho čísla faktúry
  public static generateNextInvoiceNumber(type: InvoiceType): string {
    const invoices = this.getInvoices();
    const prefix = type === 'advance' ? 'ZF-2026-' : 'FA-2026-';
    const existing = invoices
      .filter(i => i.invoiceNumber.startsWith(prefix))
      .map(i => {
        const numPart = i.invoiceNumber.replace(prefix, '');
        return parseInt(numPart, 10) || 0;
      });
    const maxNum = existing.length > 0 ? Math.max(...existing) : 0;
    const nextNum = maxNum + 1;
    return `${prefix}${nextNum.toString().padStart(4, '0')}`;
  }

  // Synchronizácia kalendárových udalostí do finančných profilov
  public static syncFromCalendarAndDatabase(events: CalendarEvent[], patients: Patient[]): PatientFinancialProfile[] {
    const currentProfiles = this.getClientProfiles();
    const updatedProfiles = [...currentProfiles];

    // Prechádzame kalendárové udalosti typu operácia a ošetrenie
    events.forEach(evt => {
      if (evt.type !== 'operacia' && evt.type !== 'osetrenie') return;
      if (!evt.patientName || evt.patientName === 'Personál kliniky') return;
      if (evt.id && (evt.id.startsWith('seed-') || evt.id.startsWith('demo-'))) return;

      const matchedPatient = patients.find(p => 
        (evt.patientId && p.id === evt.patientId) || 
        p.name.toLowerCase().trim() === evt.patientName.toLowerCase().trim()
      );

      const existing = updatedProfiles.find(p => 
        (evt.id && p.linkedEventId === evt.id) ||
        (p.patientName.toLowerCase() === evt.patientName.toLowerCase() && p.procedureDate === evt.date)
      );

      const isPast = new Date(evt.date) < new Date();
      const status = isPast ? 'operated' : 'planned';
      const agreedPrice = evt.totalPrice || (evt.type === 'operacia' ? 3800 : 250);
      const depositReq = evt.depositAmount || (evt.type === 'operacia' ? 800 : 0);
      const depositPaid = evt.isDepositPaid ? depositReq : 0;

      // Zistíme reálnu spotrebu materiálu pre tohto pacienta
      const materialUsage = this.calculateClientMaterialUsage(evt.patientName, evt.patientId);

      if (!existing) {
        const newProf: PatientFinancialProfile = {
          id: `prof-${evt.id || Date.now()}`,
          patientId: evt.patientId || matchedPatient?.id,
          patientName: evt.patientName,
          patientBirthNumber: matchedPatient?.birthNumber,
          patientPhone: evt.patientPhone || matchedPatient?.phone,
          patientEmail: evt.patientEmail || matchedPatient?.email,
          patientAddress: matchedPatient?.address,
          status,
          procedureName: evt.title,
          procedureDate: evt.date,
          doctorName: evt.doctorName || evt.operator || 'MUDr. Ján Mráz',
          roomName: evt.roomName,
          anesthesiaType: evt.anesthesiaType,
          totalAgreedPrice: agreedPrice,
          depositRequired: depositReq,
          depositPaid: depositPaid,
          isDepositPaid: evt.isDepositPaid || false,
          clientCredit: 0,
          totalBilled: depositPaid > 0 ? depositPaid : 0,
          totalPaid: depositPaid,
          balanceDue: Math.max(0, agreedPrice - depositPaid),
          materialCost: materialUsage.totalCost,
          materialItemsCount: materialUsage.itemsCount,
          netProcedureMargin: agreedPrice - materialUsage.totalCost,
          marginPercentage: agreedPrice > 0 ? parseFloat((((agreedPrice - materialUsage.totalCost) / agreedPrice) * 100).toFixed(1)) : 0,
          linkedEventId: evt.id,
          invoices: [],
          notes: evt.notes
        };
        updatedProfiles.push(newProf);
      } else {
        // Aktualizujeme spotrebu materiálu a linky
        existing.materialCost = materialUsage.totalCost > 0 ? materialUsage.totalCost : existing.materialCost;
        existing.materialItemsCount = materialUsage.itemsCount > 0 ? materialUsage.itemsCount : existing.materialItemsCount;
        existing.netProcedureMargin = existing.totalAgreedPrice - existing.materialCost;
        existing.marginPercentage = existing.totalAgreedPrice > 0 ? parseFloat((((existing.totalAgreedPrice - existing.materialCost) / existing.totalAgreedPrice) * 100).toFixed(1)) : 0;
        if (evt.id) existing.linkedEventId = evt.id;
        if (evt.totalPrice && evt.totalPrice !== existing.totalAgreedPrice) {
          existing.totalAgreedPrice = evt.totalPrice;
          existing.balanceDue = Math.max(0, existing.totalAgreedPrice - existing.totalPaid - existing.clientCredit);
        }
      }
    });

    this.saveClientProfiles(updatedProfiles);
    return updatedProfiles;
  }
}
