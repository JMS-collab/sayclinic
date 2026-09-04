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

// Predvolené počiatočné faktúry a zálohové faktúry
export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-zf-1',
    invoiceNumber: 'ZF-2026-0024',
    type: 'advance',
    patientId: 'P-KAT-KOV',
    patientName: 'Katarína Kováčová',
    patientBirthNumber: '915214/4512',
    patientAddress: 'Kráľovohoľská 12, Banská Bystrica',
    patientEmail: 'katarina.kovacova@gmail.com',
    patientPhone: '+421 905 123 456',
    issueDate: '2026-08-20',
    dueDate: '2026-08-27',
    paidDate: '2026-08-25',
    status: 'paid',
    paymentMethod: 'bank_transfer',
    variableSymbol: '260024',
    items: [
      {
        id: 'it-1',
        description: 'Záloha na plánovanú operáciu: Augmentácia prsníkov Motiva 340cc (rezervácia termínu a operačnej sály)',
        quantity: 1,
        unit: 'pobyt/výkon',
        unitPrice: 800,
        vatRate: 0,
        total: 800
      }
    ],
    subtotal: 800,
    vatAmount: 0,
    totalAmount: 800,
    paidAmount: 800,
    remainingAmount: 0,
    appliedCredit: 0,
    linkedSurgeryEventId: 'seed-evt-1',
    notes: 'Záloha pripísaná na účet Tatra banka dňa 25.08.2026. Zostáva doplatiť 3 400 € v deň nástupu na operáciu.',
    createdBy: 'Ing. Barbara Mecerodová, MBA'
  },
  {
    id: 'inv-fa-1',
    invoiceNumber: 'FA-2026-0038',
    type: 'standard',
    patientId: 'P1',
    patientName: 'Mária Kováčová',
    patientBirthNumber: '885512/6789',
    patientAddress: 'Slnečná 15, Banská Bystrica',
    patientEmail: 'maria.kovacova@email.sk',
    patientPhone: '+421 905 123 456',
    issueDate: '2026-08-12',
    dueDate: '2026-08-12',
    deliveryDate: '2026-08-12',
    paidDate: '2026-08-12',
    status: 'paid',
    paymentMethod: 'card',
    variableSymbol: '260038',
    items: [
      {
        id: 'it-2',
        description: 'Augmentácia prsníkov silikónovými implantátmi Motiva Ergonomix (operatér MUDr. Ján Mráz)',
        quantity: 1,
        unit: 'výkon',
        unitPrice: 3400,
        vatRate: 0,
        total: 3400
      },
      {
        id: 'it-3',
        description: 'Zálohová platba odpočítaná (ZF-2026-0012)',
        quantity: 1,
        unit: 'odpočet',
        unitPrice: -800,
        vatRate: 0,
        total: -800
      },
      {
        id: 'it-4',
        description: 'Kompresívna pooperačná podprsenka Lipoelastic PI Ideal',
        quantity: 1,
        unit: 'ks',
        unitPrice: 65,
        vatRate: 20,
        total: 65
      },
      {
        id: 'it-5',
        description: 'Celková anestézia TIVA vedená anesteziológom (OAIM)',
        quantity: 1,
        unit: 'anestézia',
        unitPrice: 350,
        vatRate: 0,
        total: 350
      },
      {
        id: 'it-6',
        description: 'Dospávanie a observácia na pooperačnej izbe',
        quantity: 1,
        unit: 'pobyt',
        unitPrice: 150,
        vatRate: 0,
        total: 150
      }
    ],
    subtotal: 3165,
    vatAmount: 13,
    totalAmount: 3178,
    paidAmount: 3178,
    remainingAmount: 0,
    appliedCredit: 0,
    linkedSurgeryEventId: 'seed-evt-postop',
    linkedRecordId: 'rec-1',
    notes: 'Konečné vyúčtovanie po operácii. Pôvodná záloha 800 € bola riadne zúčtovaná.',
    createdBy: 'Ing. Barbara Mecerodová, MBA'
  },
  {
    id: 'inv-zf-2',
    invoiceNumber: 'ZF-2026-0027',
    type: 'advance',
    patientName: 'Martina Bieliková',
    patientPhone: '+421 911 789 123',
    patientAddress: 'Námestie Slobody 4, Zvolen',
    issueDate: '2026-08-28',
    dueDate: '2026-09-02',
    paidDate: '2026-09-01',
    status: 'paid',
    paymentMethod: 'card',
    variableSymbol: '260027',
    items: [
      {
        id: 'it-7',
        description: 'Zálohová platba: Blefaroplastika horných viečok v lokálnej anestézii',
        quantity: 1,
        unit: 'výkon',
        unitPrice: 200,
        vatRate: 0,
        total: 200
      }
    ],
    subtotal: 200,
    vatAmount: 0,
    totalAmount: 200,
    paidAmount: 200,
    remainingAmount: 0,
    appliedCredit: 0,
    linkedSurgeryEventId: 'seed-evt-4',
    notes: 'Zaplatené na recepcii kliniky platobným terminálom.',
    createdBy: 'Mgr. Elena Solivajsová'
  },
  {
    id: 'inv-zf-3',
    invoiceNumber: 'ZF-2026-0031',
    type: 'advance',
    patientName: 'Elena Kmeťová',
    patientPhone: '+421 908 654 321',
    patientEmail: 'elena.kmetova@centrum.sk',
    patientAddress: 'Partizánska cesta 28, Banská Bystrica',
    issueDate: '2026-09-01',
    dueDate: '2026-09-08',
    status: 'unpaid',
    paymentMethod: 'bank_transfer',
    variableSymbol: '260031',
    items: [
      {
        id: 'it-8',
        description: 'Zálohová faktúra na plánovanú redukčnú mammaplastiku (modelácia s redukciou)',
        quantity: 1,
        unit: 'výkon',
        unitPrice: 600,
        vatRate: 0,
        total: 600
      }
    ],
    subtotal: 600,
    vatAmount: 0,
    totalAmount: 600,
    paidAmount: 0,
    remainingAmount: 600,
    appliedCredit: 0,
    notes: 'Čaká na úhradu prevodom. Splatnosť do 08.09.2026.',
    createdBy: 'Ing. Barbara Mecerodová, MBA'
  }
];

// Predvolené počiatočné profily klientov (Plánovaní a Odoperovaní)
export const INITIAL_CLIENT_PROFILES: PatientFinancialProfile[] = [
  {
    id: 'prof-1',
    patientId: 'P1',
    patientName: 'Mária Kováčová',
    patientBirthNumber: '885512/6789',
    patientPhone: '+421 905 123 456',
    patientEmail: 'maria.kovacova@email.sk',
    patientAddress: 'Slnečná 15, Banská Bystrica',
    status: 'operated',
    procedureName: 'Augmentácia prsníkov Motiva 320cc',
    procedureDate: '2026-08-12',
    doctorName: 'MUDr. Ján Mráz',
    roomName: 'Operačné sály SAY',
    anesthesiaType: 'TIVA',
    totalAgreedPrice: 4200,
    depositRequired: 800,
    depositPaid: 800,
    isDepositPaid: true,
    clientCredit: 150, // Bonusový kredit na pooperačné laserové vyhladenie jazvy
    totalBilled: 4200,
    totalPaid: 4200,
    balanceDue: 0,
    materialCost: 1420.12, // Motiva implantáty (1380 €) + Lipoelastic podprsenka (39 €) + Mepore krytie (1.12 €)
    materialItemsCount: 3,
    netProcedureMargin: 2779.88,
    marginPercentage: 66.2,
    linkedRecordId: 'rec-1',
    invoices: ['FA-2026-0038', 'ZF-2026-0012'],
    notes: 'Operácia prebehla úspešne, pacientka má uhradené všetko. Kredit 150 € je aktívny na ďalšiu starostlivosť.'
  },
  {
    id: 'prof-2',
    patientId: 'P-KAT-KOV',
    patientName: 'Katarína Kováčová',
    patientBirthNumber: '915214/4512',
    patientPhone: '+421 905 123 456',
    patientEmail: 'katarina.kovacova@gmail.com',
    patientAddress: 'Kráľovohoľská 12, Banská Bystrica',
    status: 'planned',
    procedureName: 'Augmentácia prsníkov (Motiva 340cc)',
    procedureDate: new Date().toISOString().split('T')[0],
    doctorName: 'MUDr. Ján Mráz',
    roomName: 'Operačné sály SAY',
    anesthesiaType: 'TIVA',
    totalAgreedPrice: 4200,
    depositRequired: 800,
    depositPaid: 800,
    isDepositPaid: true,
    clientCredit: 0,
    totalBilled: 800,
    totalPaid: 800,
    balanceDue: 3400, // Zostáva doplatiť
    materialCost: 1419, // Pripravené implantáty Motiva 340cc (1380 €) + podprsenka (39 €)
    materialItemsCount: 2,
    netProcedureMargin: 2781,
    marginPercentage: 66.2,
    linkedEventId: 'seed-evt-1',
    invoices: ['ZF-2026-0024'],
    notes: 'Záloha 800 € je riadne uhradená. Doplatok 3 400 € bude vyrovnaný pri nástupe na kliniku.'
  },
  {
    id: 'prof-3',
    patientName: 'Martina Bieliková',
    patientPhone: '+421 911 789 123',
    patientAddress: 'Námestie Slobody 4, Zvolen',
    status: 'planned',
    procedureName: 'Blefaroplastika horných viečok',
    procedureDate: new Date().toISOString().split('T')[0],
    doctorName: 'MUDr. Zuzana Sroková',
    roomName: 'Operačné sály Rudlová',
    anesthesiaType: 'LA (Lokálna anestézia)',
    totalAgreedPrice: 950,
    depositRequired: 200,
    depositPaid: 200,
    isDepositPaid: true,
    clientCredit: 50, // Darčekový poukaz uplatniteľný na zákrok
    totalBilled: 200,
    totalPaid: 200,
    balanceDue: 700, // 950 - 200 - 50 = 700 €
    materialCost: 45, // Vstrebateľné šitie a Dermabond lepidlo
    materialItemsCount: 2,
    netProcedureMargin: 905,
    marginPercentage: 95.3,
    linkedEventId: 'seed-evt-4',
    invoices: ['ZF-2026-0027'],
    notes: 'Záloha 200 € zaplatená, pacientka má kredit 50 €, k úhrade zostáva 700 €.'
  },
  {
    id: 'prof-4',
    patientId: 'P2',
    patientName: 'Ján Novák',
    patientBirthNumber: '750314/1234',
    patientPhone: '+421 948 987 654',
    patientEmail: 'novak.j@email.sk',
    patientAddress: 'Kvetná 8, Zvolen',
    status: 'operated',
    procedureName: 'Korekcia vrások glabela a čelo (Dysport)',
    procedureDate: '2026-09-02',
    doctorName: 'MUDr. Ján Mráz',
    roomName: 'Ambulancia',
    anesthesiaType: 'Lokálne chladenie',
    totalAgreedPrice: 220,
    depositRequired: 0,
    depositPaid: 0,
    isDepositPaid: true,
    clientCredit: 0,
    totalBilled: 220,
    totalPaid: 220,
    balanceDue: 0,
    materialCost: 145, // Dysport 500U vialka zo skladu
    materialItemsCount: 1,
    netProcedureMargin: 75,
    marginPercentage: 34.1,
    invoices: [],
    notes: 'Ambulantné ošetrenie, platba v hotovosti na mieste.'
  },
  {
    id: 'prof-5',
    patientName: 'Elena Kmeťová',
    patientPhone: '+421 908 654 321',
    patientEmail: 'elena.kmetova@centrum.sk',
    patientAddress: 'Partizánska cesta 28, Banská Bystrica',
    status: 'planned',
    procedureName: 'Redukčná mammaplastika s modeláciou',
    procedureDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
    doctorName: 'MUDr. Ján Mráz',
    roomName: 'Operačné sály SAY',
    anesthesiaType: 'TIVA',
    totalAgreedPrice: 3600,
    depositRequired: 600,
    depositPaid: 0,
    isDepositPaid: false,
    clientCredit: 0,
    totalBilled: 600,
    totalPaid: 0,
    balanceDue: 3600,
    materialCost: 125, // Šijací materiál, pooperačná podprsenka, elastické bandáže
    materialItemsCount: 3,
    netProcedureMargin: 3475,
    marginPercentage: 96.5,
    invoices: ['ZF-2026-0031'],
    notes: 'Vystavená zálohová faktúra ZF-2026-0031, čakáme na úhradu prevodom.'
  },
  {
    id: 'prof-6',
    patientName: 'Simona Vargová',
    patientPhone: '+421 917 555 444',
    patientEmail: 'simona.vargova@gmail.com',
    patientAddress: 'Ružová 19, Zvolen',
    status: 'operated',
    procedureName: 'Vibračná liposukcia brucha a bokov MicroAire PAL',
    procedureDate: '2026-08-20',
    doctorName: 'MUDr. Ján Mráz',
    roomName: 'Operačné sály SAY',
    anesthesiaType: 'TIVA + Tumescencia',
    totalAgreedPrice: 2800,
    depositRequired: 600,
    depositPaid: 600,
    isDepositPaid: true,
    clientCredit: 100, // Preplatok z anestézie prenesený do kreditu
    totalBilled: 2800,
    totalPaid: 2800,
    balanceDue: 0,
    materialCost: 127, // Lipoelastic kompresívny pás (42 €) + kanyly a sterilné sety (85 €)
    materialItemsCount: 2,
    netProcedureMargin: 2673,
    marginPercentage: 95.5,
    invoices: ['FA-2026-0035'],
    notes: 'Úplne vyrovnané. Kredit 100 € k dispozícii na LPG / lymfodrenážne ošetrenie.'
  }
];

export const INITIAL_CREDIT_LOGS: CreditTransaction[] = [
  {
    id: 'c-log-1',
    patientId: 'P1',
    patientName: 'Mária Kováčová',
    date: '2026-08-12',
    timestamp: '2026-08-12T14:30:00.000Z',
    type: 'deposit_topup',
    amount: 150,
    balanceAfter: 150,
    note: 'Bonusový kredit za komplexný operačný balík (určený na pooperačný laser)',
    recordedBy: 'MUDr. Ján Mráz'
  },
  {
    id: 'c-log-2',
    patientId: 'prof-3',
    patientName: 'Martina Bieliková',
    date: '2026-08-25',
    timestamp: '2026-08-25T11:00:00.000Z',
    type: 'gift_voucher',
    amount: 50,
    balanceAfter: 50,
    note: 'Uplatnený darčekový poukaz SAY CLINIC č. GC-8821',
    recordedBy: 'Mgr. Elena Solivajsová'
  },
  {
    id: 'c-log-3',
    patientId: 'prof-6',
    patientName: 'Simona Vargová',
    date: '2026-08-20',
    timestamp: '2026-08-20T16:00:00.000Z',
    type: 'deposit_topup',
    amount: 100,
    balanceAfter: 100,
    note: 'Presun preplatku z hospitalizácie do kreditu klienta na ďalšie ošetrenia',
    recordedBy: 'Ing. Barbara Mecerodová, MBA'
  }
];

export class FinanceBillingService {
  private static STORAGE_KEY_INVOICES = 'say_clinic_invoices_v1';
  private static STORAGE_KEY_CLIENT_PROFILES = 'say_clinic_client_financial_profiles_v1';
  private static STORAGE_KEY_CREDIT_LOGS = 'say_clinic_credit_logs_v1';

  // Načítanie všetkých faktúr
  public static getInvoices(): Invoice[] {
    if (typeof window === 'undefined') return INITIAL_INVOICES;
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY_INVOICES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY_CLIENT_PROFILES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY_CREDIT_LOGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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
    const maxNum = existing.length > 0 ? Math.max(...existing) : (type === 'advance' ? 31 : 38);
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
