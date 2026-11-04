'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { SaleItem } from '../app/page';
import { CalendarEvent } from '../data/calendarConfig';
import { Patient } from './PatientDatabase';
import { 
  FinanceBillingService, 
  Invoice, 
  PatientFinancialProfile, 
  CreditTransaction,
  PaymentMethod 
} from '@/services/financeBillingService';
import { InventoryService } from '@/services/inventoryService';
import { matchesQuery, normalizeDigits } from '@/utils/fuzzySearch';
import InvoiceDetailModal from './finance/InvoiceDetailModal';
import ClientFinanceDetailModal from './finance/ClientFinanceDetailModal';
import MonthlyFinancialVisualizer from './finance/MonthlyFinancialVisualizer';
import ClientLoyaltyModal from './ClientLoyaltyModal';
import AddClientFinanceModal from './finance/AddClientFinanceModal';
import {
  LoyaltyService,
  LOYALTY_TIERS,
  LoyaltyTierId,
  ClientLoyaltySummary
} from '@/services/loyaltyService';
import { 
  Coins, 
  FileText, 
  TrendingUp, 
  Receipt, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus, 
  Search, 
  Download, 
  Printer, 
  Package, 
  PieChart, 
  Calendar, 
  ArrowUpRight, 
  Building2, 
  ChevronRight,
  ShieldCheck,
  BarChart3,
  X,
  Sparkles,
  RotateCcw,
  Trash2,
  Lock,
  Award,
  UserPlus,
  Filter
} from 'lucide-react';
import { UserAccount } from './LoginForm';
import { PermissionsService } from '../services/permissionsService';

interface ExpenseItem {
  id: string;
  date: string;
  title: string;
  category: 'Material' | 'Implants' | 'Rent' | 'Salaries' | 'Utilities' | 'Other';
  amount: number;
}

const INITIAL_EXPENSES: ExpenseItem[] = [];

interface FinanceCRMProps {
  sales?: SaleItem[];
  calendarEvents?: CalendarEvent[];
  patients?: Patient[];
  currentUser?: UserAccount;
}

export default function FinanceCRM({ 
  sales = [], 
  calendarEvents = [], 
  patients = [],
  currentUser
}: FinanceCRMProps) {
  // Prístupové práva podľa roly
  const canViewPnl = PermissionsService.canUserDo(currentUser || null, 'view_clinic_pnl');
  const canResetFinancials = PermissionsService.canUserDo(currentUser || null, 'reset_financial_data');
  const canManageInvoices = PermissionsService.canUserDo(currentUser || null, 'manage_invoices');

  // Hlavné podzáložky
  const [activeSubTab, setActiveSubTab] = useState<'clients' | 'loyalty' | 'overview' | 'monthly_analytics' | 'invoices' | 'unit_economics' | 'credits'>('clients');

  // Bezpečnostná poistka: ak používateľ nemá oprávnenie na P&L výkazy kliniky, nepovolíme mu tieto podzáložky
  useEffect(() => {
    if (!canViewPnl && (activeSubTab === 'overview' || activeSubTab === 'unit_economics')) {
      setActiveSubTab('clients');
    }
  }, [canViewPnl, activeSubTab]);

  // Stavy pre dáta
  const [clientProfiles, setClientProfiles] = useState<PatientFinancialProfile[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [creditLogs, setCreditLogs] = useState<CreditTransaction[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('say_clinic_expenses_v1');
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {
        console.error('Chyba načítania výdavkov:', e);
      }
    }
    return INITIAL_EXPENSES;
  });

  // Ostrý štart / Vynulovanie testovacích údajov
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // Počet nadchádzajúcich požiadaviek na fakturáciu pre odznak na záložke
  const upcomingBillingCount = useMemo(() => {
    let count = 0;
    clientProfiles.forEach(p => {
      if (p.status === 'planned' && (!p.isDepositPaid || p.balanceDue > 0)) count++;
      if (p.status === 'operated' && (!p.invoices || p.invoices.length === 0)) count++;
    });
    invoices.forEach(i => {
      if (i.status === 'unpaid' || i.status === 'overdue') count++;
    });
    return count;
  }, [clientProfiles, invoices]);

  // Filtre a vyhľadávanie pre klientov
  const [clientFilter, setClientFilter] = useState<'all' | 'planned' | 'operated' | 'due' | 'credit' | 'missing_advance' | 'missing_final'>('all');
  const [doctorFilter, setDoctorFilter] = useState<string>('all');
  const [billingStatusFilter, setBillingStatusFilter] = useState<'all' | 'advance_unpaid' | 'advance_paid' | 'balance_due' | 'settled'>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'this_month' | 'next_month' | 'this_year' | 'custom'>('all');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modály pre správu klientov
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<PatientFinancialProfile | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);

  // Filtre pre faktúry
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState<'all' | 'advance' | 'standard'>('all');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');

  // Formulár pre nový prevádzkový výdavok
  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState<ExpenseItem['category']>('Material');
  const [expAmount, setExpAmount] = useState('');
  const [showAddExpense, setShowAddExpense] = useState(false);

  // Modály
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isInvoiceDetailOpen, setIsInvoiceDetailOpen] = useState(false);

  // Rýchla úprava externých faktúr (ZF / DF) priamo pri riadku klienta
  const [quickEditProfile, setQuickEditProfile] = useState<PatientFinancialProfile | null>(null);
  const [quickAdvNum, setQuickAdvNum] = useState('');
  const [quickAdvAmt, setQuickAdvAmt] = useState('');
  const [quickIsAdvPaid, setQuickIsAdvPaid] = useState(false);
  const [quickAdvDate, setQuickAdvDate] = useState('');
  const [quickAdvMethod, setQuickAdvMethod] = useState<PaymentMethod>('bank_transfer');

  const [quickFinNum, setQuickFinNum] = useState('');
  const [quickFinAmt, setQuickFinAmt] = useState('');
  const [quickIsFinPaid, setQuickIsFinPaid] = useState(false);
  const [quickFinDate, setQuickFinDate] = useState('');
  const [quickFinMethod, setQuickFinMethod] = useState<PaymentMethod>('card');

  const handleOpenQuickInvoiceEdit = (p: PatientFinancialProfile, target?: 'advance' | 'final') => {
    setQuickEditProfile(p);
    setQuickAdvNum(p.advanceInvoiceNumber || '');
    setQuickAdvAmt(p.advanceAmount !== undefined ? String(p.advanceAmount) : (p.depositPaid || p.depositRequired ? String(p.depositPaid || p.depositRequired) : ''));
    setQuickIsAdvPaid(Boolean(p.isAdvancePaid));
    setQuickAdvDate(p.advancePaidDate || '');
    setQuickAdvMethod(p.advancePaymentMethod || 'bank_transfer');

    setQuickFinNum(p.finalInvoiceNumber || '');
    setQuickFinAmt(p.finalAmount !== undefined ? String(p.finalAmount) : (p.balanceDue ? String(p.balanceDue) : ''));
    setQuickIsFinPaid(Boolean(p.isFinalPaid));
    setQuickFinDate(p.finalPaidDate || '');
    setQuickFinMethod(p.finalPaymentMethod || 'card');
  };

  const handleSaveQuickInvoiceEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickEditProfile) return;

    const updated = FinanceBillingService.updateClientInvoiceTracking(quickEditProfile.id, {
      advanceInvoiceNumber: quickAdvNum,
      advanceAmount: quickAdvAmt ? parseFloat(quickAdvAmt) : undefined,
      isAdvancePaid: quickIsAdvPaid,
      advancePaidDate: quickAdvDate || (quickIsAdvPaid ? new Date().toISOString().split('T')[0] : undefined),
      advancePaymentMethod: quickAdvMethod,
      finalInvoiceNumber: quickFinNum,
      finalAmount: quickFinAmt ? parseFloat(quickFinAmt) : undefined,
      isFinalPaid: quickIsFinPaid,
      finalPaidDate: quickFinDate || (quickIsFinPaid ? new Date().toISOString().split('T')[0] : undefined),
      finalPaymentMethod: quickFinMethod
    });

    if (updated) {
      setClientProfiles(prev => prev.map(item => item.id === updated.id ? updated : item));
      setQuickEditProfile(null);
    }
  };

  const [selectedProfile, setSelectedProfile] = useState<PatientFinancialProfile | null>(null);
  const [isProfileDetailOpen, setIsProfileDetailOpen] = useState(false);

  // Vernostný systém (Loyalty 365d)
  const [loyaltyTierFilter, setLoyaltyTierFilter] = useState<'all' | LoyaltyTierId | 'surgery_upgrade'>('all');
  const [loyaltySearchQuery, setLoyaltySearchQuery] = useState('');
  const [loyaltyModalPatient, setLoyaltyModalPatient] = useState<{ id?: string; name: string } | null>(null);
  const [loyaltyRefreshCounter, setLoyaltyRefreshCounter] = useState(0);

  // Načítanie a synchronizácia dát pri štarte
  const refreshData = () => {
    // 1. Zosynchronizujeme udalosti z kalendára a kartotéky
    const synced = FinanceBillingService.syncFromCalendarAndDatabase(calendarEvents, patients);
    setClientProfiles(synced);

    // 2. Načítame faktúry
    const invs = FinanceBillingService.getInvoices();
    setInvoices(invs);

    // 3. Načítame kredity
    const cLogs = FinanceBillingService.getCreditLogs();
    setCreditLogs(cLogs);

    // 4. Načítame výdavky
    if (typeof window !== 'undefined') {
      try {
        const savedExp = localStorage.getItem('say_clinic_expenses_v1');
        if (savedExp !== null) {
          const parsed = JSON.parse(savedExp);
          if (Array.isArray(parsed)) setExpenses(parsed);
        }
      } catch (e) {
        console.error('Chyba načítania výdavkov:', e);
      }
    }
  };

  useEffect(() => {
    refreshData();

    const handleInvoicesChanged = (e: any) => {
      if (e.detail) setInvoices(e.detail);
    };
    const handleProfilesChanged = (e: any) => {
      if (e.detail) setClientProfiles(e.detail);
    };
    const handleCreditsChanged = (e: any) => {
      if (e.detail) setCreditLogs(e.detail);
    };
    const handleExpensesChanged = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setExpenses(e.detail);
    };
    const handleLoyaltyChanged = () => {
      setLoyaltyRefreshCounter(c => c + 1);
    };

    window.addEventListener('say_clinic_invoices_changed', handleInvoicesChanged);
    window.addEventListener('say_clinic_client_profiles_changed', handleProfilesChanged);
    window.addEventListener('say_clinic_credit_logs_changed', handleCreditsChanged);
    window.addEventListener('say_clinic_expenses_changed', handleExpensesChanged);
    window.addEventListener('say_clinic_loyalty_changed', handleLoyaltyChanged);

    return () => {
      window.removeEventListener('say_clinic_invoices_changed', handleInvoicesChanged);
      window.removeEventListener('say_clinic_client_profiles_changed', handleProfilesChanged);
      window.removeEventListener('say_clinic_credit_logs_changed', handleCreditsChanged);
      window.removeEventListener('say_clinic_expenses_changed', handleExpensesChanged);
      window.removeEventListener('say_clinic_loyalty_changed', handleLoyaltyChanged);
    };
  }, [calendarEvents.length, patients.length]);

  // Vynulovanie všetkých testovacích dát pre ostrý štart kliniky
  const handleResetForProduction = () => {
    FinanceBillingService.resetAllFinancialData();
    setExpenses([]);
    setInvoices([]);
    setClientProfiles([]);
    setCreditLogs([]);
    setShowResetConfirmModal(false);
    setResetSuccessMessage('Všetky testovacie finančné údaje a výsledky boli úspešne vynulované. Finančný modul je v čistom stave pripravený na ostrú prevádzku.');
    setTimeout(() => {
      setResetSuccessMessage(null);
    }, 6000);
  };

  // VÝPOČTY PRE FINANČNÝ PREHĽAD KLINIKY (P&L, SPOTREBA, PRÍJEM)
  const financials = useMemo(() => {
    // 1. Tržby z uhradených záloh a definitívnych faktúr klientov + priame predaje POS
    let trackedInvoiceRevenue = 0;
    clientProfiles.forEach(p => {
      if (p.isAdvancePaid) {
        trackedInvoiceRevenue += (p.advanceAmount !== undefined ? p.advanceAmount : (p.depositPaid || p.depositRequired || 0));
      }
      if (p.isFinalPaid) {
        trackedInvoiceRevenue += (p.finalAmount !== undefined ? p.finalAmount : Math.max(0, p.totalAgreedPrice - (p.depositPaid || 0)));
      }
    });

    const legacyInvoiceRevenue = invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + i.paidAmount, 0);

    const invoiceRevenue = trackedInvoiceRevenue > 0 ? trackedInvoiceRevenue : legacyInvoiceRevenue;
    const posSalesRevenue = sales.reduce((sum, s) => sum + s.amount, 0);
    const totalRevenue = invoiceRevenue + posSalesRevenue;

    // 2. Reálna skladová spotreba materiálu zo skladu
    const usageLogs = InventoryService.getUsageLogs();
    const stockConsumptionCost = usageLogs.reduce((sum, item) => sum + (item.costAtUsage * item.quantity), 0);

    // 3. Prevádzkové výdavky (nájom, energie, réžie)
    const operatingExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    // 4. Celkové náklady (spotreba + réžia)
    const totalExpenses = stockConsumptionCost + operatingExpenses;

    // 5. Čistý zisk
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';

    // 6. Plánované doplatky (očakávaný cash-flow z dohodnutých plánovaných operácií)
    const pendingCollections = clientProfiles
      .filter(p => p.status === 'planned')
      .reduce((sum, p) => sum + p.balanceDue, 0);

    // 7. Celkový aktívny kredit pacientov na ich účtoch
    const totalClientCredit = clientProfiles.reduce((sum, p) => sum + (p.clientCredit || 0), 0);

    // 8. Celková hodnota tovaru viazaného v sklade
    const inventoryItems = InventoryService.getInventory();
    const totalStockValue = inventoryItems.reduce((sum, item) => sum + ((item.costPerUnit || 0) * (item.quantity || 0)), 0);

    return {
      totalRevenue,
      invoiceRevenue,
      posSalesRevenue,
      stockConsumptionCost,
      operatingExpenses,
      totalExpenses,
      netProfit,
      profitMargin,
      pendingCollections,
      totalClientCredit,
      totalStockValue
    };
  }, [invoices, sales, expenses, clientProfiles]);

  // VÝPOČET JEDNOTKOVEJ EKONOMIKY (UNIT ECONOMICS) ZO SKUTOČNÝCH ZÁKROKOV
  const procedureEconomics = useMemo(() => {
    const groups: { [proc: string]: { count: number; totalPrice: number; totalMaterial: number; name: string } } = {};
    clientProfiles.forEach(p => {
      if (!p.procedureName) return;
      const key = p.procedureName.trim();
      if (!groups[key]) {
        groups[key] = { count: 0, totalPrice: 0, totalMaterial: 0, name: key };
      }
      groups[key].count += 1;
      groups[key].totalPrice += (p.totalAgreedPrice || 0);
      groups[key].totalMaterial += (p.materialCost || 0);
    });

    return Object.values(groups).map(g => {
      const avgPrice = g.totalPrice / (g.count || 1);
      const avgMaterial = g.totalMaterial / (g.count || 1);
      const avgProfit = avgPrice - avgMaterial;
      const margin = avgPrice > 0 ? ((avgProfit / avgPrice) * 100).toFixed(1) : '0';
      return {
        name: g.name,
        count: g.count,
        avgPrice,
        avgMaterial,
        avgProfit,
        margin
      };
    });
  }, [clientProfiles]);

  // Zoznam dostupných lekárov pre filter
  const availableDoctors = useMemo(() => {
    const defaultDocs = ['MUDr. Ján Mráz', 'MUDr. Tran', 'MUDr. Sroka', 'MUDr. Šebeňová'];
    const docsFromProfiles = clientProfiles.map(p => p.doctorName).filter(Boolean);
    const combined = Array.from(new Set([...defaultDocs, ...docsFromProfiles]));
    return combined.sort();
  }, [clientProfiles]);

  // Vymazanie jedného klienta
  const handleConfirmDeleteClient = () => {
    if (!clientToDelete) return;
    const remaining = FinanceBillingService.deleteClientProfile(clientToDelete.id);
    setClientProfiles(remaining);
    setClientToDelete(null);
  };

  // Vyčistenie všetkých klientov
  const handleConfirmClearAllClients = () => {
    FinanceBillingService.clearAllClientProfiles();
    setClientProfiles([]);
    setShowClearAllConfirm(false);
  };

  // FILTROVANIE ZOZNAMU KLIENTOV (Rozšírené o lekára, stav fakturácie, obdobie a čísla ZF/DF)
  const filteredClients = useMemo(() => {
    const today = new Date();
    const currentMonthKey = today.toISOString().slice(0, 7); // YYYY-MM
    const nextMonthObj = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const nextMonthKey = nextMonthObj.toISOString().slice(0, 7);
    const currentYearKey = String(today.getFullYear());

    return clientProfiles.filter(p => {
      // 1. Filter podľa kategórie
      if (clientFilter === 'planned' && p.status !== 'planned') return false;
      if (clientFilter === 'operated' && p.status !== 'operated') return false;
      if (clientFilter === 'due' && p.balanceDue <= 0) return false;
      if (clientFilter === 'credit' && (p.clientCredit || 0) <= 0) return false;
      if (clientFilter === 'missing_advance' && (p.advanceInvoiceNumber || p.status === 'operated')) return false;
      if (clientFilter === 'missing_final' && (p.finalInvoiceNumber || p.status === 'planned')) return false;

      // 2. Filter podľa lekára / operatéra
      if (doctorFilter !== 'all' && p.doctorName !== doctorFilter) {
        return false;
      }

      // 3. Filter podľa stavu fakturácie a úhrad
      if (billingStatusFilter === 'advance_unpaid') {
        if (p.isAdvancePaid || p.isDepositPaid || p.depositRequired <= 0) return false;
      } else if (billingStatusFilter === 'advance_paid') {
        if (!p.isAdvancePaid && !p.isDepositPaid) return false;
      } else if (billingStatusFilter === 'balance_due') {
        if (p.balanceDue <= 0) return false;
      } else if (billingStatusFilter === 'settled') {
        if (p.balanceDue > 0 || (!p.isAdvancePaid && !p.isFinalPaid && p.totalPaid <= 0)) return false;
      }

      // 4. Filter podľa obdobia
      if (dateRangeFilter === 'this_month') {
        if (!p.procedureDate || !p.procedureDate.startsWith(currentMonthKey)) return false;
      } else if (dateRangeFilter === 'next_month') {
        if (!p.procedureDate || !p.procedureDate.startsWith(nextMonthKey)) return false;
      } else if (dateRangeFilter === 'this_year') {
        if (!p.procedureDate || !p.procedureDate.startsWith(currentYearKey)) return false;
      } else if (dateRangeFilter === 'custom') {
        if (customDateFrom && p.procedureDate < customDateFrom) return false;
        if (customDateTo && p.procedureDate > customDateTo) return false;
      }

      // 5. Vyhľadávanie bez diakritiky a s toleranciou preklepov + čísla faktúr
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        if (p.advanceInvoiceNumber && p.advanceInvoiceNumber.toLowerCase().includes(query)) return true;
        if (p.finalInvoiceNumber && p.finalInvoiceNumber.toLowerCase().includes(query)) return true;
        if (p.invoices && p.invoices.some(inv => inv.toLowerCase().includes(query))) return true;

        const matchName = matchesQuery(p.patientName, searchQuery).match;
        const matchProc = matchesQuery(p.procedureName, searchQuery).match;
        const matchDoc = matchesQuery(p.doctorName, searchQuery).match;
        const matchRC = p.patientBirthNumber ? (
          p.patientBirthNumber.includes(searchQuery.trim()) ||
          (normalizeDigits(searchQuery).length >= 2 && normalizeDigits(p.patientBirthNumber).includes(normalizeDigits(searchQuery)))
        ) : false;
        const matchPhone = p.patientPhone ? (
          matchesQuery(p.patientPhone, searchQuery).match ||
          (normalizeDigits(searchQuery).length >= 3 && normalizeDigits(p.patientPhone).includes(normalizeDigits(searchQuery)))
        ) : false;
        return matchName || matchProc || matchDoc || matchRC || matchPhone;
      }

      return true;
    });
  }, [clientProfiles, clientFilter, doctorFilter, billingStatusFilter, dateRangeFilter, customDateFrom, customDateTo, searchQuery]);

  // Zoznam všetkých evidovaných externých faktúr (ZF & DF z účtovníctva) z profilov klientov
  const trackedExternalInvoices = useMemo(() => {
    const list: {
      id: string;
      profileId: string;
      profile: PatientFinancialProfile;
      type: 'advance' | 'standard';
      invoiceNumber: string;
      patientName: string;
      patientPhone?: string;
      procedureName: string;
      procedureDate: string;
      doctorName: string;
      amount: number;
      isPaid: boolean;
      paidDate?: string;
      paymentMethod?: PaymentMethod;
    }[] = [];

    clientProfiles.forEach(p => {
      if (p.advanceInvoiceNumber) {
        list.push({
          id: `zf-${p.id}`,
          profileId: p.id,
          profile: p,
          type: 'advance',
          invoiceNumber: p.advanceInvoiceNumber,
          patientName: p.patientName,
          patientPhone: p.patientPhone,
          procedureName: p.procedureName,
          procedureDate: p.procedureDate,
          doctorName: p.doctorName,
          amount: p.advanceAmount !== undefined ? p.advanceAmount : (p.depositPaid || p.depositRequired || 0),
          isPaid: Boolean(p.isAdvancePaid),
          paidDate: p.advancePaidDate,
          paymentMethod: p.advancePaymentMethod || 'bank_transfer'
        });
      }
      if (p.finalInvoiceNumber) {
        list.push({
          id: `df-${p.id}`,
          profileId: p.id,
          profile: p,
          type: 'standard',
          invoiceNumber: p.finalInvoiceNumber,
          patientName: p.patientName,
          patientPhone: p.patientPhone,
          procedureName: p.procedureName,
          procedureDate: p.procedureDate,
          doctorName: p.doctorName,
          amount: p.finalAmount !== undefined ? p.finalAmount : Math.max(0, p.totalAgreedPrice - (p.depositPaid || 0)),
          isPaid: Boolean(p.isFinalPaid),
          paidDate: p.finalPaidDate,
          paymentMethod: p.finalPaymentMethod || 'card'
        });
      }
    });

    return list;
  }, [clientProfiles]);

  // FILTROVANIE FAKTÚR
  const filteredInvoices = useMemo(() => {
    return trackedExternalInvoices.filter(inv => {
      if (invoiceTypeFilter === 'advance' && inv.type !== 'advance') return false;
      if (invoiceTypeFilter === 'standard' && inv.type !== 'standard') return false;
      if (invoiceStatusFilter === 'paid' && !inv.isPaid) return false;
      if (invoiceStatusFilter === 'unpaid' && inv.isPaid) return false;
      return true;
    });
  }, [trackedExternalInvoices, invoiceTypeFilter, invoiceStatusFilter]);

  // VÝPOČET VERNOSTNÉHO SYSTÉMU PRE VŠETKÝCH KLIENTOV KLINIKY (365 DNÍ)
  const allClientsLoyalty = useMemo(() => {
    const clientMap = new Map<string, { id?: string; name: string; phone?: string; email?: string }>();

    patients.forEach(p => {
      if (!p.name) return;
      const key = p.name.trim().toLowerCase();
      clientMap.set(key, {
        id: p.id,
        name: p.name,
        phone: p.phone,
        email: p.email
      });
    });

    clientProfiles.forEach(cp => {
      if (!cp.patientName) return;
      const key = cp.patientName.trim().toLowerCase();
      if (!clientMap.has(key)) {
        clientMap.set(key, {
          id: cp.patientId,
          name: cp.patientName,
          phone: cp.patientPhone
        });
      }
    });

    return Array.from(clientMap.values()).map(c => ({
      ...c,
      loyalty: LoyaltyService.calculateClientLoyalty({ id: c.id, name: c.name })
    })).sort((a, b) => {
      const rank = { vip: 3, premium: 2, basic: 1 };
      if (rank[b.loyalty.tier] !== rank[a.loyalty.tier]) {
        return rank[b.loyalty.tier] - rank[a.loyalty.tier];
      }
      return b.loyalty.eligibleSpend365d - a.loyalty.eligibleSpend365d;
    });
  }, [patients, clientProfiles, invoices, sales, loyaltyRefreshCounter]);

  const loyaltySummaryStats = useMemo(() => {
    const counts = { basic: 0, premium: 0, vip: 0, surgeryUpgrade: 0 };
    let totalEligibleSpend = 0;
    allClientsLoyalty.forEach(c => {
      counts[c.loyalty.tier] = (counts[c.loyalty.tier] || 0) + 1;
      if (c.loyalty.hasSurgeryOver1000) counts.surgeryUpgrade += 1;
      totalEligibleSpend += c.loyalty.eligibleSpend365d;
    });
    return { ...counts, totalEligibleSpend };
  }, [allClientsLoyalty]);

  const filteredLoyaltyClients = useMemo(() => {
    return allClientsLoyalty.filter(c => {
      if (loyaltyTierFilter === 'surgery_upgrade' && !c.loyalty.hasSurgeryOver1000) return false;
      if (loyaltyTierFilter !== 'all' && loyaltyTierFilter !== 'surgery_upgrade' && c.loyalty.tier !== loyaltyTierFilter) return false;

      if (loyaltySearchQuery.trim()) {
        const matchName = matchesQuery(c.name, loyaltySearchQuery).match;
        const matchPhone = c.phone ? matchesQuery(c.phone, loyaltySearchQuery).match : false;
        const matchEmail = c.email ? matchesQuery(c.email, loyaltySearchQuery).match : false;
        return matchName || matchPhone || matchEmail;
      }
      return true;
    });
  }, [allClientsLoyalty, loyaltyTierFilter, loyaltySearchQuery]);

  // Pridanie nového výdavku
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle || !expAmount) return;

    const newExpense: ExpenseItem = {
      id: `E-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      title: expTitle,
      category: expCategory,
      amount: parseFloat(expAmount) || 0,
    };

    const updated = [newExpense, ...expenses];
    setExpenses(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('say_clinic_expenses_v1', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('say_clinic_expenses_changed', { detail: updated }));
    }
    setExpTitle('');
    setExpAmount('');
    setShowAddExpense(false);
  };

  const handleDeleteExpense = (id: string) => {
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('say_clinic_expenses_v1', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('say_clinic_expenses_changed', { detail: updated }));
    }
  };

  // Otvorenie detailu faktúry
  const handleOpenInvoiceModal = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setIsInvoiceDetailOpen(true);
  };

  const handleOpenInvoiceByNumber = (invNum: string) => {
    const found = invoices.find(i => i.invoiceNumber === invNum);
    if (found) {
      setSelectedInvoice(found);
      setIsInvoiceDetailOpen(true);
    } else {
      alert(`Faktúra ${invNum} nebola nájdená.`);
    }
  };

  // Otvorenie detailu klienta
  const handleOpenClientDetail = (profile: PatientFinancialProfile) => {
    setSelectedProfile(profile);
    setIsProfileDetailOpen(true);
  };

  // Export do CSV
  const handleExportCSV = () => {
    const headers = [
      'Meno klienta', 
      'Stav', 
      'Zákrok', 
      'Dátum', 
      'Celková cena (€)', 
      'Číslo ZF',
      'Úhrada ZF',
      'Číslo DF',
      'Úhrada DF',
      'Kredit (€)', 
      'Zostáva doplatiť (€)', 
      'Spotreba materiálu (€)', 
      'Čistá marža (€)', 
      'Maržovosť (%)'
    ];
    const rows = clientProfiles.map(p => [
      `"${p.patientName}"`,
      `"${p.status === 'planned' ? 'Plánovaný' : 'Odoperovaný'}"`,
      `"${p.procedureName}"`,
      `"${p.procedureDate}"`,
      p.totalAgreedPrice.toFixed(2),
      `"${p.advanceInvoiceNumber || ''}"`,
      `"${p.isAdvancePaid ? `Uhradená (${p.advancePaidDate || ''})` : 'Neuhradená'}"`,
      `"${p.finalInvoiceNumber || ''}"`,
      `"${p.isFinalPaid ? `Uhradená (${p.finalPaidDate || ''})` : 'Neuhradená'}"`,
      p.clientCredit.toFixed(2),
      p.balanceDue.toFixed(2),
      p.materialCost.toFixed(2),
      p.netProcedureMargin.toFixed(2),
      p.marginPercentage.toFixed(1)
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SAY_CLINIC_Financie_Klienti_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* HLAVNÁ LIŠTA S TITULOM A PREPÍNAČOM ZÁLOŽIEK */}
      <div className="bg-white rounded-3xl p-6 border border-[#E8E2D9] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2C2A29] flex items-center justify-center text-[#C5A059] shadow-xs">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-brand font-bold text-[#2C2A29] uppercase tracking-wide">
                  Finančné riadenie & Výsledky kliniky
                </h2>
                {canResetFinancials && (
                  <button
                    type="button"
                    onClick={() => setShowResetConfirmModal(true)}
                    title="Vynulovať testovacie údaje pre ostrú prevádzku"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-rose-200 bg-rose-50/90 hover:bg-rose-100 text-rose-800 text-[11px] font-bold transition-all shadow-2xs cursor-pointer ml-1"
                  >
                    <RotateCcw className="w-3 h-3 text-rose-600" />
                    <span>Vynulovať na ostro</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-[#8C857B]">
                Prepojená spotreba skladu, tržby z operácií, zálohové faktúry, pohľadávky a kredit klientov
              </p>
            </div>
          </div>
        </div>

        {/* PREPÍNAČ SUB-TABS */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#FBF9F6] rounded-2xl border border-[#E8E2D9]">
          <button
            type="button"
            onClick={() => setActiveSubTab('clients')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'clients'
                ? 'bg-[#2C2A29] text-white shadow-xs'
                : 'text-[#8C857B] hover:text-[#2C2A29]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Klienti (Plánovaní & Odoperovaní)</span>
            <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-white/20">
              {clientProfiles.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('loyalty')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'loyalty'
                ? 'bg-[#2C2A29] text-[#C5A059] shadow-xs'
                : 'text-[#8C857B] hover:text-[#2C2A29]'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Vernostný systém (365d)</span>
            <span className={`ml-1 px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
              activeSubTab === 'loyalty' ? 'bg-[#C5A059] text-[#2C2A29]' : 'bg-[#FAF6EF] text-[#8A6827] border border-[#E6D4B2]'
            }`}>
              {allClientsLoyalty.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('monthly_analytics')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'monthly_analytics'
                ? 'bg-[#2C2A29] text-white shadow-xs'
                : 'text-[#8C857B] hover:text-[#2C2A29]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Mesačné tržby & Požiadavky</span>
            {upcomingBillingCount > 0 && (
              <span className={`ml-1 px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                activeSubTab === 'monthly_analytics' ? 'bg-[#C5A059] text-[#2C2A29]' : 'bg-amber-100 text-amber-900'
              }`}>
                {upcomingBillingCount}
              </span>
            )}
          </button>

          {canViewPnl && (
            <button
              type="button"
              onClick={() => setActiveSubTab('overview')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === 'overview'
                  ? 'bg-[#2C2A29] text-white shadow-xs'
                  : 'text-[#8C857B] hover:text-[#2C2A29]'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>P&L & Výsledky kliniky</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveSubTab('invoices')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'invoices'
                ? 'bg-[#2C2A29] text-white shadow-xs'
                : 'text-[#8C857B] hover:text-[#2C2A29]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Evidencia faktúr (ZF & DF)</span>
            <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-white/20">
              {trackedExternalInvoices.length}
            </span>
          </button>

          {canViewPnl && (
            <button
              type="button"
              onClick={() => setActiveSubTab('unit_economics')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === 'unit_economics'
                  ? 'bg-[#2C2A29] text-white shadow-xs'
                  : 'text-[#8C857B] hover:text-[#2C2A29]'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>Marže & Rentabilita</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveSubTab('credits')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'credits'
                ? 'bg-[#2C2A29] text-white shadow-xs'
                : 'text-[#8C857B] hover:text-[#2C2A29]'
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Kreditná peňaženka</span>
          </button>
        </div>
      </div>

      {/* OZNÁMENIE O VYNULOVANÍ ÚDAJOV PRE OSTRÚ PREVÁDZKU */}
      {resetSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-emerald-900 animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold">{resetSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setResetSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. SUB-TAB: ZOZNAM KLIENTOV (PLÁNOVANÍ & ODOPEROVANÍ) - HLAVNÁ POŽIADAVKA */}
      {/* ========================================================================= */}
      {activeSubTab === 'clients' && (
        <div className="space-y-6">
          
          {/* HLAVNÉ SÚHRNNÉ METRIKY KLIENTOV */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            
            {/* 1. PLÁNOVANÉ ZÁKROKY */}
            <div className="bg-white p-4 rounded-2xl border border-[#E8E2D9] shadow-xs">
              <div className="flex justify-between items-center text-[#8C857B] text-[10px] font-bold uppercase tracking-wider">
                <span>Plánované zákroky</span>
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <p className="text-xl font-brand font-bold text-[#2C2A29] mt-1">
                {clientProfiles.filter(p => p.status === 'planned').length} klientov
              </p>
              <p className="text-[10px] text-amber-800 font-medium mt-0.5">
                Objem: {clientProfiles.filter(p => p.status === 'planned').reduce((s, p) => s + p.totalAgreedPrice, 0).toLocaleString('sk-SK')} €
              </p>
            </div>

            {/* 2. UHRADENÉ ZÁLOHY */}
            <div className="bg-white p-4 rounded-2xl border border-[#E8E2D9] shadow-xs">
              <div className="flex justify-between items-center text-[#8C857B] text-[10px] font-bold uppercase tracking-wider">
                <span>Prijaté zálohy</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <p className="text-xl font-brand font-bold text-emerald-700 mt-1">
                {clientProfiles.reduce((s, p) => s + p.depositPaid, 0).toLocaleString('sk-SK')} €
              </p>
              <p className="text-[10px] text-[#8C857B] mt-0.5">
                Rezervačné zálohy sály
              </p>
            </div>

            {/* 3. ZOZTÁVA DOPLATIŤ (POHĽADÁVKY) */}
            <div className="bg-white p-4 rounded-2xl border border-[#E8E2D9] shadow-xs">
              <div className="flex justify-between items-center text-[#8C857B] text-[10px] font-bold uppercase tracking-wider">
                <span>Zostáva doplatiť</span>
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              </div>
              <p className="text-xl font-brand font-bold text-rose-700 mt-1">
                {financials.pendingCollections.toLocaleString('sk-SK')} €
              </p>
              <p className="text-[10px] text-rose-800 font-medium mt-0.5">
                Doplatky pred nástupom na sálu
              </p>
            </div>

            {/* 4. KREDIT KLIENTOV */}
            <div className="bg-white p-4 rounded-2xl border border-[#E8E2D9] shadow-xs">
              <div className="flex justify-between items-center text-[#8C857B] text-[10px] font-bold uppercase tracking-wider">
                <span>Kredit klientov</span>
                <Coins className="w-3.5 h-3.5 text-[#C5A059]" />
              </div>
              <p className="text-xl font-brand font-bold text-[#C5A059] mt-1">
                {financials.totalClientCredit.toLocaleString('sk-SK')} €
              </p>
              <p className="text-[10px] text-[#8C857B] mt-0.5">
                Vouchery a preplatky
              </p>
            </div>

            {/* 5. ODOPEROVANÍ KLIENTI */}
            <div className="bg-white p-4 rounded-2xl border border-[#E8E2D9] shadow-xs">
              <div className="flex justify-between items-center text-[#8C857B] text-[10px] font-bold uppercase tracking-wider">
                <span>Odoperovaní</span>
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <p className="text-xl font-brand font-bold text-[#2C2A29] mt-1">
                {clientProfiles.filter(p => p.status === 'operated').length} klientov
              </p>
              <p className="text-[10px] text-blue-800 font-medium mt-0.5">
                Zrealizované výkony
              </p>
            </div>

            {/* 6. SKLADOVÁ SPOTREBA MATERIÁLU */}
            <div className="bg-white p-4 rounded-2xl border border-[#E8E2D9] shadow-xs">
              <div className="flex justify-between items-center text-[#8C857B] text-[10px] font-bold uppercase tracking-wider">
                <span>Spotreba materiálu</span>
                <Package className="w-3.5 h-3.5 text-purple-600" />
              </div>
              <p className="text-xl font-brand font-bold text-purple-800 mt-1">
                {clientProfiles.reduce((s, p) => s + p.materialCost, 0).toLocaleString('sk-SK')} €
              </p>
              <p className="text-[10px] text-purple-700 font-medium mt-0.5">
                Z knižnice spotreby
              </p>
            </div>

          </div>

          {/* OVLÁDACIA LIŠTA PRE ZOZNAM KLIENTOV (FILTRE, VYHĽADÁVANIE, TLAČIDLÁ) */}
          <div className="bg-white rounded-3xl p-5 border border-[#E8E2D9] shadow-xs space-y-4">
            
            {/* HORNÝ RIADOK: KATEGÓRIE A HLAVNÉ AKCIE */}
            <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
              
              {/* FILTRAČNÉ PILLSY PODĽA STAVU KLIENTA */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setClientFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    clientFilter === 'all'
                      ? 'bg-[#2C2A29] text-white shadow-xs'
                      : 'bg-[#FBF9F6] text-[#8C857B] hover:text-[#2C2A29] border border-[#E8E2D9]'
                  }`}
                >
                  Všetci ({clientProfiles.length})
                </button>
                <button
                  type="button"
                  onClick={() => setClientFilter('planned')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    clientFilter === 'planned'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  📅 Plánovaní ({clientProfiles.filter(p => p.status === 'planned').length})
                </button>
                <button
                  type="button"
                  onClick={() => setClientFilter('operated')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    clientFilter === 'operated'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  ✅ Odoperovaní ({clientProfiles.filter(p => p.status === 'operated').length})
                </button>
                <button
                  type="button"
                  onClick={() => setClientFilter('due')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    clientFilter === 'due'
                      ? 'bg-rose-700 text-white shadow-xs'
                      : 'bg-rose-50 text-rose-900 hover:bg-rose-100 border border-rose-200'
                  }`}
                >
                  ⚠️ S nedoplatkom ({clientProfiles.filter(p => p.balanceDue > 0).length})
                </button>
                <button
                  type="button"
                  onClick={() => setClientFilter('credit')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    clientFilter === 'credit'
                      ? 'bg-[#C5A059] text-white shadow-xs'
                      : 'bg-[#FAF6EF] text-[#8A6827] hover:bg-[#F5EEDF] border border-[#E6D4B2]'
                  }`}
                >
                  🎁 S kreditom ({clientProfiles.filter(p => (p.clientCredit || 0) > 0).length})
                </button>
                <button
                  type="button"
                  onClick={() => setClientFilter('missing_advance')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    clientFilter === 'missing_advance'
                      ? 'bg-amber-800 text-white shadow-xs'
                      : 'bg-amber-50/60 text-amber-900 hover:bg-amber-100/60 border border-amber-300'
                  }`}
                  title="Plánovaní klienti bez priradeného čísla zálohovej faktúry"
                >
                  ⏳ Bez ZF ({clientProfiles.filter(p => p.status === 'planned' && !p.advanceInvoiceNumber).length})
                </button>
                <button
                  type="button"
                  onClick={() => setClientFilter('missing_final')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    clientFilter === 'missing_final'
                      ? 'bg-purple-800 text-white shadow-xs'
                      : 'bg-purple-50/60 text-purple-900 hover:bg-purple-100/60 border border-purple-300'
                  }`}
                  title="Odoperovaní klienti bez priradeného čísla definitívnej faktúry"
                >
                  📄 Bez DF ({clientProfiles.filter(p => p.status === 'operated' && !p.finalInvoiceNumber).length})
                </button>
              </div>

              {/* AKČNÉ TLAČIDLÁ */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsAddClientOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2C2A29] hover:bg-[#C5A059] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  title="Manuálne pridať klienta do evidencie financií"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Pridať klienta</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowClearAllConfirm(true)}
                  disabled={clientProfiles.length === 0}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Vymazať všetkých doterajších klientov z finančného riadenia"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Vyčistiť zoznam</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FBF9F6] hover:bg-[#E8E2D9]/60 border border-[#E8E2D9] text-xs font-bold text-[#2C2A29] transition-colors cursor-pointer"
                  title="Export do CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">CSV</span>
                </button>
              </div>
            </div>

            {/* DRUHÝ RIADOK: HĽADANIE A DETAILNÉ FILTRE (LEKÁR, STAV ÚHRADY, OBDOBIE) */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5 pt-1 border-t border-[#E8E2D9]/70">
              
              {/* VYHĽADÁVANIE */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#8C857B] absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Hľadať klienta, rodné číslo, zákrok, číslo ZF alebo DF..."
                  className="w-full bg-[#FBF9F6] border border-[#E8E2D9] pl-9 pr-8 py-2 rounded-xl text-xs text-[#2C2A29] focus:outline-none focus:border-[#C5A059]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-[#8C857B] hover:text-[#2C2A29]"
                    title="Zmazať"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* FILTER PODĽA LEKÁRA */}
              <div className="flex items-center gap-1.5 bg-[#FBF9F6] border border-[#E8E2D9] px-2.5 py-1.5 rounded-xl">
                <span className="text-[10px] font-bold uppercase text-[#8C857B] shrink-0">Lekár:</span>
                <select
                  value={doctorFilter}
                  onChange={(e) => setDoctorFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-[#2C2A29] focus:outline-none cursor-pointer"
                >
                  <option value="all">Všetci lekári</option>
                  {availableDoctors.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* FILTER PODĽA STAVU FAKTURÁCIE / ÚHRAD */}
              <div className="flex items-center gap-1.5 bg-[#FBF9F6] border border-[#E8E2D9] px-2.5 py-1.5 rounded-xl">
                <span className="text-[10px] font-bold uppercase text-[#8C857B] shrink-0">Stav úhrad:</span>
                <select
                  value={billingStatusFilter}
                  onChange={(e) => setBillingStatusFilter(e.target.value as any)}
                  className="bg-transparent text-xs font-semibold text-[#2C2A29] focus:outline-none cursor-pointer"
                >
                  <option value="all">Všetky stavy úhrad</option>
                  <option value="advance_unpaid">⏳ Záloha neuhradená</option>
                  <option value="advance_paid">✓ Záloha uhradená</option>
                  <option value="balance_due">⚠️ Doplatok neuhradený</option>
                  <option value="settled">✓ Kompletne vyrovnané</option>
                </select>
              </div>

              {/* FILTER PODĽA OBDOBIA */}
              <div className="flex items-center gap-1.5 bg-[#FBF9F6] border border-[#E8E2D9] px-2.5 py-1.5 rounded-xl">
                <span className="text-[10px] font-bold uppercase text-[#8C857B] shrink-0">Obdobie:</span>
                <select
                  value={dateRangeFilter}
                  onChange={(e) => setDateRangeFilter(e.target.value as any)}
                  className="bg-transparent text-xs font-semibold text-[#2C2A29] focus:outline-none cursor-pointer"
                >
                  <option value="all">Všetky termíny</option>
                  <option value="this_month">Tento mesiac</option>
                  <option value="next_month">Nasledujúci mesiac</option>
                  <option value="this_year">Tento rok</option>
                  <option value="custom">Vlastný rozsah...</option>
                </select>
              </div>

              {/* VLASTNÝ ROZSAH DÁTUMOV */}
              {dateRangeFilter === 'custom' && (
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                    className="bg-[#FBF9F6] border border-[#E8E2D9] px-2 py-1.5 rounded-xl text-xs font-mono text-[#2C2A29]"
                    title="Od dátumu"
                  />
                  <span className="text-[#8C857B] text-xs">–</span>
                  <input
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    className="bg-[#FBF9F6] border border-[#E8E2D9] px-2 py-1.5 rounded-xl text-xs font-mono text-[#2C2A29]"
                    title="Do dátumu"
                  />
                </div>
              )}

              {/* TLAČIDLO PRE RESET FILTROV */}
              {(doctorFilter !== 'all' || billingStatusFilter !== 'all' || dateRangeFilter !== 'all' || searchQuery.trim() || clientFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setClientFilter('all');
                    setDoctorFilter('all');
                    setBillingStatusFilter('all');
                    setDateRangeFilter('all');
                    setCustomDateFrom('');
                    setCustomDateTo('');
                    setSearchQuery('');
                  }}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#FBF9F6] transition-colors shrink-0"
                  title="Resetovať všetky filtre"
                >
                  Reset
                </button>
              )}

            </div>

            {/* HLAVNÁ TABUĽKA KLIENTOV */}
            <div className="overflow-x-auto rounded-2xl border border-[#E8E2D9]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FBF9F6] border-b border-[#E8E2D9] text-[10px] uppercase text-[#8C857B] font-bold tracking-wider">
                    <th className="py-3 px-3">Klient & Výkon (ZF & DF)</th>
                    <th className="py-3 px-3">Dátum & Operatér</th>
                    <th className="py-3 px-3 text-center">Stav</th>
                    <th className="py-3 px-3 text-right">Celková cena</th>
                    <th className="py-3 px-3 text-center">Záloha</th>
                    <th className="py-3 px-3 text-right">Kredit</th>
                    <th className="py-3 px-3 text-right">Koľko doplatiť</th>
                    <th className="py-3 px-3 text-right">Spotreba skladu</th>
                    <th className="py-3 px-3 text-right">Marža (%)</th>
                    <th className="py-3 px-3 text-center">Akcie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D9] bg-white">
                  {filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-[#8C857B]">
                        Neboli nájdení žiadni klienti podľa zvolených kritérií.
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((p) => {
                      const isPlanned = p.status === 'planned';
                      const hasDue = p.balanceDue > 0;
                      const hasCredit = (p.clientCredit || 0) > 0;
                      const clientLoyalty = LoyaltyService.calculateClientLoyalty({ id: p.patientId, name: p.patientName });

                      return (
                        <tr key={p.id} className="hover:bg-[#FBF9F6]/70 transition-colors">
                          
                          {/* KLIENT A VÝKON S EVIDENCIOU EXTERNÝCH FAKTÚR (ZF & DF) */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => handleOpenClientDetail(p)}
                                className="text-left group cursor-pointer"
                              >
                                <p className="font-bold text-sm text-[#2C2A29] group-hover:text-[#C5A059] transition-colors flex items-center gap-1">
                                  {p.patientName}
                                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#C5A059]" />
                                </p>
                              </button>
                              <button
                                type="button"
                                onClick={() => setLoyaltyModalPatient({ id: p.patientId, name: p.patientName })}
                                title={`Vernostný systém: ${clientLoyalty.tierDef.name} (${clientLoyalty.tierDef.discountPercent}% zľava). Minuté 365d (Skin Care + Ošetrenia): ${clientLoyalty.eligibleSpend365d.toFixed(0)} €`}
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                                  clientLoyalty.tier === 'vip'
                                    ? 'bg-[#2C2A29] text-[#C5A059] border-[#C5A059]'
                                    : clientLoyalty.tier === 'premium'
                                      ? 'bg-[#FAF6EF] text-[#8A6827] border-[#C5A059]'
                                      : 'bg-[#FBF9F6] text-[#8C857B] border-[#E8E2D9] hover:border-[#C5A059]'
                                }`}
                              >
                                <Award className="w-2.5 h-2.5 text-[#C5A059]" />
                                <span>{clientLoyalty.tierDef.name} {clientLoyalty.tierDef.discountPercent > 0 ? `-${clientLoyalty.tierDef.discountPercent}%` : '0%'}</span>
                              </button>
                            </div>
                            <p className="text-[11px] text-[#8C857B] line-clamp-1">{p.procedureName}</p>

                            {/* EVIDENCIA EXTERNÝCH FAKTÚR (ZF & DF) */}
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              {/* ZF BADGE */}
                              <button
                                type="button"
                                onClick={() => handleOpenQuickInvoiceEdit(p, 'advance')}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all border cursor-pointer ${
                                  p.advanceInvoiceNumber
                                    ? p.isAdvancePaid
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                      : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                                    : 'bg-[#FBF9F6] text-[#8C857B] border-dashed border-[#D5CEC4] hover:border-[#C5A059] hover:text-[#2C2A29]'
                                }`}
                                title={p.advanceInvoiceNumber ? `Zálohová faktúra: ${p.advanceInvoiceNumber} (${p.isAdvancePaid ? `Uhradená ${p.advancePaidDate || ''}` : 'Čaká na úhradu'}). Kliknutím upravíte.` : 'Priradiť číslo vystavenej zálohovej faktúry (ZF)'}
                              >
                                <span className="font-sans font-semibold text-[9px] uppercase tracking-wider text-[#8C857B]">ZF:</span>
                                <span>{p.advanceInvoiceNumber || '+ ZF'}</span>
                                {p.advanceInvoiceNumber && (
                                  p.isAdvancePaid ? <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" /> : <Clock className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                                )}
                              </button>

                              {/* DF BADGE */}
                              <button
                                type="button"
                                onClick={() => handleOpenQuickInvoiceEdit(p, 'final')}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all border cursor-pointer ${
                                  p.finalInvoiceNumber
                                    ? p.isFinalPaid
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                      : 'bg-purple-50 text-purple-900 border-purple-300 hover:bg-purple-100'
                                    : 'bg-[#FBF9F6] text-[#8C857B] border-dashed border-[#D5CEC4] hover:border-[#C5A059] hover:text-[#2C2A29]'
                                }`}
                                title={p.finalInvoiceNumber ? `Definitívna faktúra: ${p.finalInvoiceNumber} (${p.isFinalPaid ? `Uhradená ${p.finalPaidDate || ''}` : 'Čaká na úhradu'}). Kliknutím upravíte.` : 'Priradiť číslo vystavenej definitívnej faktúry (DF)'}
                              >
                                <span className="font-sans font-semibold text-[9px] uppercase tracking-wider text-[#8C857B]">DF:</span>
                                <span>{p.finalInvoiceNumber || '+ DF'}</span>
                                {p.finalInvoiceNumber && (
                                  p.isFinalPaid ? <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" /> : <Clock className="w-2.5 h-2.5 text-purple-600 shrink-0" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* DÁTUM A OPERATÉR */}
                          <td className="py-3 px-3">
                            <p className="font-mono font-medium text-[#2C2A29]">{p.procedureDate}</p>
                            <p className="text-[10px] text-[#8C857B]">{p.doctorName}</p>
                          </td>

                          {/* STAV */}
                          <td className="py-3 px-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              isPlanned 
                                ? 'bg-amber-100 text-amber-900 border border-amber-200' 
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                            }`}>
                              {isPlanned ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                              {isPlanned ? 'Plánovaný' : 'Odoperovaný'}
                            </span>
                          </td>

                          {/* CELKOVÁ DOHODNUTÁ CENA */}
                          <td className="py-3 px-3 text-right font-mono font-bold text-sm text-[#2C2A29]">
                            {p.totalAgreedPrice.toLocaleString('sk-SK')} €
                          </td>

                          {/* ZÁLOHA */}
                          <td className="py-3 px-3 text-center font-mono">
                            <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-bold ${
                              p.isDepositPaid || p.isAdvancePaid
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}>
                              {p.advanceAmount !== undefined ? p.advanceAmount : p.depositPaid} / {p.depositRequired} €
                            </span>
                          </td>

                          {/* KREDIT */}
                          <td className="py-3 px-3 text-right font-mono">
                            {hasCredit ? (
                              <span className="font-bold text-[#C5A059] bg-[#FAF6EF] px-2 py-0.5 rounded-lg border border-[#E6D4B2]">
                                +{p.clientCredit.toLocaleString('sk-SK')} €
                              </span>
                            ) : (
                              <span className="text-[#8C857B]">0 €</span>
                            )}
                          </td>

                          {/* ZOZTÁVA DOPLATIŤ */}
                          <td className="py-3 px-3 text-right font-mono">
                            {hasDue ? (
                              <span className="font-bold text-sm text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200">
                                {p.balanceDue.toLocaleString('sk-SK')} €
                              </span>
                            ) : (
                              <span className="font-bold text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                                Vyrovnané ✓
                              </span>
                            )}
                          </td>

                          {/* SKLADOVÁ SPOTREBA MATERIÁLU */}
                          <td className="py-3 px-3 text-right font-mono text-rose-600 font-semibold">
                            {p.materialCost > 0 ? `-${p.materialCost.toFixed(2)} €` : <span className="text-[#8C857B] font-normal">—</span>}
                          </td>

                          {/* MARŽA */}
                          <td className="py-3 px-3 text-right font-mono">
                            <p className="font-bold text-emerald-700">+{p.netProcedureMargin.toFixed(0)} €</p>
                            <p className="text-[10px] text-[#8C857B]">{p.marginPercentage}%</p>
                          </td>

                          {/* AKCIE */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenClientDetail(p)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FBF9F6] hover:bg-[#E8E2D9] text-[#2C2A29] text-xs font-bold transition-colors cursor-pointer"
                                title="Detail klienta, faktúry a spotrebovaný materiál"
                              >
                                <span>Detail</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setClientToDelete(p)}
                                className="p-1.5 rounded-lg bg-[#FBF9F6] hover:bg-rose-50 text-[#8C857B] hover:text-rose-600 transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                                title="Vymazať tohto klienta z evidencie financií"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB: VERNOSTNÝ SYSTÉM KLIENTOV (365 DNÍ • BASIC / PREMIUM / VIP)       */}
      {/* ========================================================================= */}
      {activeSubTab === 'loyalty' && (
        <div className="space-y-6 animate-fadeIn">
          {/* PRAVIDLÁ A KATEGÓRIE VERNOSTNÉHO SYSTÉMU */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* BASIC */}
            <div className="bg-white p-5 rounded-3xl border border-[#E8E2D9] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FBF9F6] text-[#8C857B] border border-[#E8E2D9]">
                    Basic • 0% zľava
                  </span>
                  <span className="font-mono font-bold text-lg text-[#2C2A29]">{loyaltySummaryStats.basic} kl.</span>
                </div>
                <p className="text-xl font-brand font-bold text-[#2C2A29] mt-2">Do 1 000 € / 365 dní</p>
                <p className="text-[11px] text-[#8C857B] mt-1">
                  Základná kategória pre všetkých klientov s obratom za Skin Care a Ošetrenia do 1 000 € za posledných 365 dní.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-[#E8E2D9] flex justify-between items-center text-[11px]">
                <span className="text-[#8C857B]">Vernostná zľava:</span>
                <span className="font-mono font-bold text-[#2C2A29]">0 %</span>
              </div>
            </div>

            {/* PREMIUM */}
            <div className="bg-[#FAF6EF] p-5 rounded-3xl border border-[#C5A059] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white text-[#8A6827] border border-[#C5A059]">
                    Premium • 5% zľava
                  </span>
                  <span className="font-mono font-bold text-lg text-[#8A6827]">{loyaltySummaryStats.premium} kl.</span>
                </div>
                <p className="text-xl font-brand font-bold text-[#2C2A29] mt-2">1 000 – 3 000 € / 365 dní</p>
                <p className="text-[11px] text-[#8A6827] mt-1">
                  Obrat 1 000 – 3 000 € za Skin Care a Ošetrenia <strong>alebo automaticky po operácii nad 1 000 €</strong>.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-[#E6D4B2] flex justify-between items-center text-[11px]">
                <span className="text-[#8A6827]">Vernostná zľava:</span>
                <span className="font-mono font-bold text-emerald-700">-5 %</span>
              </div>
            </div>

            {/* VIP */}
            <div className="bg-[#2C2A29] text-white p-5 rounded-3xl border border-[#C5A059] shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]">
                    ★ VIP • 10% zľava
                  </span>
                  <span className="font-mono font-bold text-lg text-[#C5A059]">{loyaltySummaryStats.vip} kl.</span>
                </div>
                <p className="text-xl font-brand font-bold text-white mt-2">Nad 3 000 € / 365 dní</p>
                <p className="text-[11px] text-[#E8E2D9]/80 mt-1">
                  Najvyššia vernostná kategória pri obrate nad 3 000 € za Skin Care a Ošetrenia za posledných 365 dní.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-white/15 flex justify-between items-center text-[11px]">
                <span className="text-[#C5A059]">Vernostná zľava:</span>
                <span className="font-mono font-bold text-[#C5A059]">-10 %</span>
              </div>
            </div>

            {/* PRAVIDLO PRE OPERÁCIE & CELKOVÝ OBRAT 365D */}
            <div className="bg-white p-5 rounded-3xl border border-[#E8E2D9] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-[#8C857B]">
                  <span>Pravidlo výpočtu (365 dní)</span>
                  <Sparkles className="w-4 h-4 text-[#C5A059]" />
                </div>
                <p className="text-xs font-bold text-[#2C2A29] mt-2 leading-relaxed">
                  ✅ Započítava sa: <span className="text-emerald-700">Skin Care + Ošetrenia</span>
                </p>
                <p className="text-[11px] text-[#8C857B] mt-1 leading-relaxed">
                  ❌ <strong>Operácie</strong> sa do minutej sumy nezapočítavajú, ale <strong>po operácii nad 1 000 €</strong> sa klient automaticky radí do <strong>Premium (5% zľava)</strong>.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-[#E8E2D9] flex justify-between items-center text-[11px]">
                <span className="text-[#8C857B]">Obrat Skin Care + Ošetrenia (365d):</span>
                <span className="font-mono font-bold text-[#2C2A29]">{loyaltySummaryStats.totalEligibleSpend.toLocaleString('sk-SK', { maximumFractionDigits: 0 })} €</span>
              </div>
            </div>
          </div>

          {/* FILTRE A TABUĽKA VŠETKÝCH KLIENTOV */}
          <div className="bg-white rounded-3xl p-5 border border-[#E8E2D9] shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setLoyaltyTierFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    loyaltyTierFilter === 'all'
                      ? 'bg-[#2C2A29] text-white shadow-xs'
                      : 'bg-[#FBF9F6] text-[#8C857B] hover:text-[#2C2A29] border border-[#E8E2D9]'
                  }`}
                >
                  Všetci klienti ({allClientsLoyalty.length})
                </button>
                <button
                  type="button"
                  onClick={() => setLoyaltyTierFilter('basic')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    loyaltyTierFilter === 'basic'
                      ? 'bg-[#2C2A29] text-white shadow-xs'
                      : 'bg-[#FBF9F6] text-[#8C857B] hover:text-[#2C2A29] border border-[#E8E2D9]'
                  }`}
                >
                  Basic • 0% ({loyaltySummaryStats.basic})
                </button>
                <button
                  type="button"
                  onClick={() => setLoyaltyTierFilter('premium')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    loyaltyTierFilter === 'premium'
                      ? 'bg-[#C5A059] text-white shadow-xs'
                      : 'bg-[#FAF6EF] text-[#8A6827] hover:bg-[#F5EEDF] border border-[#C5A059]'
                  }`}
                >
                  Premium • -5% ({loyaltySummaryStats.premium})
                </button>
                <button
                  type="button"
                  onClick={() => setLoyaltyTierFilter('vip')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    loyaltyTierFilter === 'vip'
                      ? 'bg-[#2C2A29] text-[#C5A059] border border-[#C5A059] shadow-xs'
                      : 'bg-[#2C2A29]/5 text-[#2C2A29] hover:bg-[#2C2A29]/10 border border-[#E8E2D9]'
                  }`}
                >
                  ★ VIP • -10% ({loyaltySummaryStats.vip})
                </button>
                <button
                  type="button"
                  onClick={() => setLoyaltyTierFilter('surgery_upgrade')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    loyaltyTierFilter === 'surgery_upgrade'
                      ? 'bg-amber-700 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  ✨ Po operácii &gt; 1 000 € ({loyaltySummaryStats.surgeryUpgrade})
                </button>
              </div>

              <div className="relative md:w-72">
                <Search className="w-4 h-4 text-[#8C857B] absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={loyaltySearchQuery}
                  onChange={(e) => setLoyaltySearchQuery(e.target.value)}
                  placeholder="Hľadať klienta podľa mena, tel..."
                  className="w-full bg-[#FBF9F6] border border-[#E8E2D9] pl-9 pr-8 py-2 rounded-xl text-xs text-[#2C2A29] focus:outline-none focus:border-[#C5A059]"
                />
                {loyaltySearchQuery && (
                  <button
                    type="button"
                    onClick={() => setLoyaltySearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-[#8C857B] hover:text-[#2C2A29]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[#E8E2D9]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FBF9F6] border-b border-[#E8E2D9] text-[10px] uppercase text-[#8C857B] font-bold tracking-wider">
                    <th className="py-3 px-3">Klient</th>
                    <th className="py-3 px-3 text-center">Kategória & Zľava</th>
                    <th className="py-3 px-3 text-right">Minuté 365d (Skin Care + Ošetrenia)</th>
                    <th className="py-3 px-3 text-right">Skin Care (365d)</th>
                    <th className="py-3 px-3 text-right">Ošetrenia (365d)</th>
                    <th className="py-3 px-3 text-center">Operácie &gt; 1 000 €</th>
                    <th className="py-3 px-3 text-center">Rýchle nastavenie kategórie</th>
                    <th className="py-3 px-3 text-center">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D9] bg-white">
                  {filteredLoyaltyClients.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-[#8C857B]">
                        Neboli nájdení žiadni klienti pre zvolený filter vernostného systému.
                      </td>
                    </tr>
                  ) : (
                    filteredLoyaltyClients.map((client) => {
                      const st = client.loyalty;

                      return (
                        <tr key={client.id || client.name} className="hover:bg-[#FBF9F6]/70 transition-colors">
                          <td className="py-3 px-3">
                            <p className="font-bold text-sm text-[#2C2A29]">{client.name}</p>
                            <p className="text-[10px] text-[#8C857B]">{client.phone || client.email || 'Klient SAY CLINIC'}</p>
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                              st.tier === 'vip'
                                ? 'bg-[#2C2A29] text-[#C5A059] border-[#C5A059]'
                                : st.tier === 'premium'
                                  ? 'bg-[#FAF6EF] text-[#8A6827] border-[#C5A059]'
                                  : 'bg-[#FBF9F6] text-[#8C857B] border-[#E8E2D9]'
                            }`}>
                              <Award className="w-3 h-3 text-[#C5A059]" />
                              <span>{st.tierDef.name} • {st.tierDef.discountPercent > 0 ? `-${st.tierDef.discountPercent}%` : '0%'}</span>
                            </span>
                            {st.upgradedToPremiumBySurgery && (
                              <span className="block text-[9px] text-amber-800 font-semibold mt-0.5">
                                Po operácii &gt; 1 000 €
                              </span>
                            )}
                            {st.isManualOverride && (
                              <span className="block text-[9px] text-[#8C857B] font-semibold mt-0.5">
                                Manuálne nastavené
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-right">
                            <p className="font-mono font-bold text-sm text-[#2C2A29]">
                              {st.eligibleSpend365d.toFixed(2)} €
                            </p>
                            {st.nextTier ? (
                              <p className="text-[10px] text-[#8C857B]">
                                Do {LOYALTY_TIERS[st.nextTier].name}: ešte {st.amountToNextTier.toFixed(0)} €
                              </p>
                            ) : (
                              <p className="text-[10px] text-[#C5A059] font-bold">Maximálna VIP úroveň</p>
                            )}
                          </td>

                          <td className="py-3 px-3 text-right font-mono text-xs text-emerald-700 font-semibold">
                            {st.skincareSpend365d.toFixed(2)} €
                          </td>

                          <td className="py-3 px-3 text-right font-mono text-xs text-[#8A6827] font-semibold">
                            {st.treatmentsSpend365d.toFixed(2)} €
                          </td>

                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                LoyaltyService.setClientLoyaltyOverride(
                                  client.id || client.name,
                                  client.name,
                                  st.overrideMode,
                                  { forceSurgeryPremium: !st.hasSurgeryOver1000 }
                                );
                              }}
                              title="Kliknutím prepnete príznak Operácia > 1 000 € (automatické zaradenie do Premium 5%)"
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                st.hasSurgeryOver1000
                                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                                  : 'bg-[#FBF9F6] text-[#8C857B] border-[#E8E2D9] hover:border-[#C5A059]'
                              }`}
                            >
                              {st.hasSurgeryOver1000
                                ? `✨ Áno (${st.surgeriesSpend365d > 0 ? `${st.surgeriesSpend365d.toFixed(0)} €` : '> 1 000 €'})`
                                : st.surgeriesSpend365d > 0
                                  ? `${st.surgeriesSpend365d.toFixed(0)} €`
                                  : 'Nie'}
                            </button>
                          </td>

                          <td className="py-3 px-3 text-center">
                            <div className="inline-flex items-center gap-1 bg-[#FBF9F6] p-1 rounded-xl border border-[#E8E2D9]">
                              {(['auto', 'basic', 'premium', 'vip'] as const).map((opt) => {
                                const isSelected = st.overrideMode === opt;
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => {
                                      LoyaltyService.setClientLoyaltyOverride(
                                        client.id || client.name,
                                        client.name,
                                        opt
                                      );
                                    }}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                      isSelected
                                        ? opt === 'vip'
                                          ? 'bg-[#2C2A29] text-[#C5A059] shadow-2xs'
                                          : opt === 'premium'
                                            ? 'bg-[#C5A059] text-white shadow-2xs'
                                            : 'bg-[#2C2A29] text-white shadow-2xs'
                                        : 'text-[#8C857B] hover:text-[#2C2A29]'
                                    }`}
                                  >
                                    {opt === 'auto' ? 'Auto' : opt === 'basic' ? 'Basic' : opt === 'premium' ? 'Premium' : 'VIP'}
                                  </button>
                                );
                              })}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => setLoyaltyModalPatient({ id: client.id, name: client.name })}
                              className="px-2.5 py-1.5 rounded-xl bg-[#2C2A29] hover:bg-[#C5A059] text-white text-[10px] font-bold transition-colors cursor-pointer"
                            >
                              Nastaviť / História
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SUB-TAB: MESAČNÁ VIZUALIZÁCIA TRŽIEB VS. VÝDAVKOV & POŽIADAVKY KLIENTOV */}
      {/* ========================================================================= */}
      {activeSubTab === 'monthly_analytics' && (
        <MonthlyFinancialVisualizer
          invoices={invoices}
          clientProfiles={clientProfiles}
          calendarEvents={calendarEvents}
          patients={patients}
          sales={sales}
          expenses={expenses}
          onOpenInvoiceModal={(inv) => {
            setSelectedInvoice(inv);
            setIsInvoiceDetailOpen(true);
          }}
          onOpenInvoiceByNumber={(invNum) => {
            const found = invoices.find(i => i.invoiceNumber === invNum);
            if (found) {
              setSelectedInvoice(found);
              setIsInvoiceDetailOpen(true);
            }
          }}
          onOpenClientDetail={(profile) => {
            setSelectedProfile(profile);
            setIsProfileDetailOpen(true);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* 3. SUB-TAB: FINANČNÝ PREHĽAD & P&L VÝSLEDKY KLINIKY                       */}
      {/* ========================================================================= */}
      {activeSubTab === 'overview' && canViewPnl && (
        <div className="space-y-6">
          
          {/* BANNER PRE PRECHOD NA DETAILNÚ MESAČNÚ VIZUALIZÁCIU A POŽIADAVKY */}
          <div className="bg-[#FBF9F6] p-4 rounded-2xl border border-[#E8E2D9] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#2C2A29] text-[#C5A059] rounded-xl">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-brand font-bold text-sm text-[#2C2A29]">
                  Mesačný rozpad tržieb vs. výdavkov & Požiadavky klientov
                </p>
                <p className="text-xs text-[#8C857B]">
                  Interaktívny graf vývoja nákladov, skladovej spotreby a zoznam nadchádzajúcich záloh a doplatkov
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveSubTab('monthly_analytics')}
              className="px-4 py-2 rounded-xl bg-[#2C2A29] hover:bg-[#C5A059] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs whitespace-nowrap"
            >
              <span>Zobraziť graf & požiadavky</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* HLAVNÉ KARTY VÝSLEDKOV */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* CELKOVÝ PRÍJEM (TRŽBY) */}
            <div className="bg-white p-5 rounded-3xl border border-[#E8E2D9] shadow-xs">
              <div className="flex justify-between items-center text-[#8C857B] text-xs font-bold uppercase tracking-wider">
                <span>Celkové tržby kliniky</span>
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-3xl font-brand font-bold text-[#2C2A29] mt-2">
                {financials.totalRevenue.toLocaleString('sk-SK')} €
              </p>
              <div className="mt-2 text-[11px] text-[#8C857B] space-y-0.5">
                <p>• Operácie & výkony: {financials.invoiceRevenue.toLocaleString('sk-SK')} €</p>
                <p>• Estetika & POS predaj: {financials.posSalesRevenue.toLocaleString('sk-SK')} €</p>
              </div>
            </div>

            {/* SKUTOČNÁ SPOTREBA MATERIÁLU ZO SKLADU */}
            <div className="bg-white p-5 rounded-3xl border border-[#E8E2D9] shadow-xs">
              <div className="flex justify-between items-center text-[#8C857B] text-xs font-bold uppercase tracking-wider">
                <span>Spotreba skladu (COGS)</span>
                <Package className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-3xl font-brand font-bold text-rose-700 mt-2">
                -{financials.stockConsumptionCost.toLocaleString('sk-SK')} €
              </p>
              <p className="mt-2 text-[11px] text-[#8C857B]">
                Reálne odpísaný materiál: implantáty, šitie, anestetiká a kanyly
              </p>
            </div>

            {/* PREVÁDZKOVÉ NÁKLADY */}
            <div className="bg-white p-5 rounded-3xl border border-[#E8E2D9] shadow-xs">
              <div className="flex justify-between items-center text-[#8C857B] text-xs font-bold uppercase tracking-wider">
                <span>Prevádzková réžia</span>
                <Building2 className="w-4 h-4 text-[#8C857B]" />
              </div>
              <p className="text-3xl font-brand font-bold text-[#2C2A29] mt-2">
                -{financials.operatingExpenses.toLocaleString('sk-SK')} €
              </p>
              <p className="mt-2 text-[11px] text-[#8C857B]">
                Nájomné Rudlovská, energie, sterilizácia a bežná réžia
              </p>
            </div>

            {/* ČISTÝ ZISK & MARŽA */}
            <div className="bg-[#2C2A29] text-white p-5 rounded-3xl shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-center text-[#C5A059] text-xs font-bold uppercase tracking-wider">
                <span>Čistý zisk kliniky</span>
                <span className="bg-[#C5A059]/20 px-2 py-0.5 rounded-full text-xs font-mono font-bold">
                  Marža {financials.profitMargin} %
                </span>
              </div>
              <p className="text-3xl font-brand font-bold text-white mt-2">
                +{financials.netProfit.toLocaleString('sk-SK')} €
              </p>
              <p className="mt-2 text-[11px] text-[#C5A059]">
                P&L po zohľadnení reálnej skladovej spotreby a réžie
              </p>
            </div>

          </div>

          {/* DVA BLOKY: CASH-FLOW & PEŇAŽNÝ DENNÍK NÁKLADOV */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* CASH-FLOW OČAKÁVANIA A SKLAD (5 STĹPCOV) */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* OČAKÁVANÝ CASH FLOW */}
              <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-xs space-y-4">
                <h3 className="font-brand font-bold text-base text-[#2C2A29] uppercase tracking-wide flex items-center gap-2">
                  <Coins className="w-4 h-4 text-[#C5A059]" />
                  Cash-flow prognóza & Pohľadávky
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-2xl bg-[#FBF9F6] border border-[#E8E2D9]">
                    <div>
                      <p className="font-bold text-xs text-[#2C2A29]">Očakávané doplatky z plánovaných operácií</p>
                      <p className="text-[10px] text-[#8C857B]">Klienti s rezervovaným termínom sály</p>
                    </div>
                    <span className="font-mono font-bold text-emerald-700 text-sm">
                      +{financials.pendingCollections.toLocaleString('sk-SK')} €
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 rounded-2xl bg-[#FBF9F6] border border-[#E8E2D9]">
                    <div>
                      <p className="font-bold text-xs text-[#2C2A29]">Viazaný kapitál v sklade kliniky</p>
                      <p className="text-[10px] text-[#8C857B]">Hodnota zásob materiálu a implantátov</p>
                    </div>
                    <span className="font-mono font-bold text-[#2C2A29] text-sm">
                      {financials.totalStockValue.toLocaleString('sk-SK')} €
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 rounded-2xl bg-[#FBF9F6] border border-[#E8E2D9]">
                    <div>
                      <p className="font-bold text-xs text-[#2C2A29]">Záväzky z predplatených kreditov</p>
                      <p className="text-[10px] text-[#8C857B]">Aktívny kredit pacientov na ďalšie zákroky</p>
                    </div>
                    <span className="font-mono font-bold text-[#C5A059] text-sm">
                      {financials.totalClientCredit.toLocaleString('sk-SK')} €
                    </span>
                  </div>
                </div>
              </div>

              {/* RÝCHLE PRIDANIE PREVÁDZKOVÉHO VÝDAVKU */}
              <div className="bg-[#FBF9F6] p-5 rounded-3xl border border-[#E8E2D9] space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-xs uppercase text-[#2C2A29] tracking-wider">
                    Zaevidovať prevádzkový náklad
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowAddExpense(!showAddExpense)}
                    className="text-xs font-bold text-[#C5A059] hover:underline"
                  >
                    {showAddExpense ? 'Zbaliť' : '+ Nový náklad'}
                  </button>
                </div>

                {showAddExpense && (
                  <form onSubmit={handleAddExpense} className="space-y-3 pt-2 animate-fadeIn">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Popis nákladu</label>
                      <input
                        type="text"
                        required
                        value={expTitle}
                        onChange={(e) => setExpTitle(e.target.value)}
                        placeholder="napr. Revízia odsávačky PAL"
                        className="w-full bg-white border border-[#E8E2D9] p-2 rounded-xl text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Kategória</label>
                        <select
                          value={expCategory}
                          onChange={(e) => setExpCategory(e.target.value as any)}
                          className="w-full bg-white border border-[#E8E2D9] p-2 rounded-xl text-xs"
                        >
                          <option value="Material">Materiál & Toxíny</option>
                          <option value="Implants">Implantáty</option>
                          <option value="Rent">Nájomné</option>
                          <option value="Salaries">Personál / Mzdy</option>
                          <option value="Utilities">Energie & Prístroje</option>
                          <option value="Other">Ostatné</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Suma (€)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={expAmount}
                          onChange={(e) => setExpAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-white border border-[#E8E2D9] p-2 rounded-xl text-xs font-mono font-bold"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-[#2C2A29] hover:bg-[#C5A059] text-white py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                      Uložiť náklad
                    </button>
                  </form>
                )}
              </div>

            </div>

            {/* PEŇAŽNÝ DENNÍK & KNIHA POHYBOV (7 STĹPCOV) */}
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-3">
                <h3 className="font-brand font-bold text-base text-[#2C2A29] uppercase tracking-wide flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#C5A059]" />
                  Finančný denník (Príjmy & Výdavky)
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E8E2D9] text-[10px] uppercase text-[#8C857B] font-bold">
                      <th className="pb-2">Dátum</th>
                      <th className="pb-2">Typ & Kategória</th>
                      <th className="pb-2">Popis / Pacient</th>
                      <th className="pb-2 text-right">Suma (€)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D9]">
                    {/* TRŽBY Z FAKTÚR */}
                    {invoices.filter(i => i.status === 'paid').map(i => (
                      <tr key={i.id} className="hover:bg-[#FBF9F6]">
                        <td className="py-2.5 text-[#8C857B] font-mono">{i.paidDate || i.issueDate}</td>
                        <td className="py-2.5 font-semibold text-emerald-700">
                          {i.type === 'advance' ? 'Záloha' : 'Faktúra'} ({i.paymentMethod})
                        </td>
                        <td className="py-2.5 text-[#2C2A29]">
                          {i.patientName} <span className="text-[#8C857B] font-mono">({i.invoiceNumber})</span>
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold text-emerald-700">
                          +{i.paidAmount.toFixed(2)} €
                        </td>
                      </tr>
                    ))}

                    {/* SPOTREBA MATERIÁLU ZO SKLADU */}
                    {InventoryService.getUsageLogs().slice(0, 4).map(u => (
                      <tr key={u.id} className="hover:bg-[#FBF9F6]">
                        <td className="py-2.5 text-[#8C857B] font-mono">{u.date}</td>
                        <td className="py-2.5 font-semibold text-purple-700">Spotreba materiálu</td>
                        <td className="py-2.5 text-[#2C2A29]">
                          {u.itemName} ({u.patientName})
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold text-purple-700">
                          -{(u.costAtUsage * u.quantity).toFixed(2)} €
                        </td>
                      </tr>
                    ))}

                    {/* PREVÁDZKOVÉ VÝDAVKY */}
                    {expenses.map(e => (
                      <tr key={e.id} className="hover:bg-[#FBF9F6] group">
                        <td className="py-2.5 text-[#8C857B] font-mono">{e.date}</td>
                        <td className="py-2.5 font-semibold text-rose-600">Prevádzka ({e.category})</td>
                        <td className="py-2.5 text-[#2C2A29]">
                          <div className="flex items-center justify-between gap-2">
                            <span>{e.title}</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteExpense(e.id)}
                              title="Vymazať náklad"
                              className="opacity-0 group-hover:opacity-100 p-1 text-[#8C857B] hover:text-rose-600 transition-opacity cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold text-rose-600">
                          -{e.amount.toFixed(2)} €
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SUB-TAB: EVIDENCIA EXTERNÝCH FAKTÚR (ZF & DF Z ÚČTOVNÍCTVA)            */}
      {/* ========================================================================= */}
      {activeSubTab === 'invoices' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-5 border border-[#E8E2D9] shadow-xs space-y-4">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-brand font-bold text-base text-[#2C2A29] uppercase tracking-wide">
                  Prehľad faktúr kliniky (ZF & DF)
                </h3>
                <p className="text-xs text-[#8C857B]">
                  Evidencia čísel vystavených v externom účtovnom programe a stav ich úhrad.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-[#8C857B] uppercase tracking-wider mr-1">Filter:</span>
                <button
                  type="button"
                  onClick={() => setInvoiceTypeFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    invoiceTypeFilter === 'all'
                      ? 'bg-[#2C2A29] text-white shadow-xs'
                      : 'bg-[#FBF9F6] text-[#8C857B] hover:text-[#2C2A29] border border-[#E8E2D9]'
                  }`}
                >
                  Všetky ({trackedExternalInvoices.length})
                </button>
                <button
                  type="button"
                  onClick={() => setInvoiceTypeFilter('advance')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    invoiceTypeFilter === 'advance'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-900 border border-amber-200'
                  }`}
                >
                  📄 Zálohové (ZF) ({trackedExternalInvoices.filter(i => i.type === 'advance').length})
                </button>
                <button
                  type="button"
                  onClick={() => setInvoiceTypeFilter('standard')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    invoiceTypeFilter === 'standard'
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'bg-purple-50 text-purple-900 border border-purple-200'
                  }`}
                >
                  🧾 Definitívne (DF) ({trackedExternalInvoices.filter(i => i.type === 'standard').length})
                </button>
              </div>
            </div>

            {/* TABUĽKA FAKTÚR */}
            <div className="overflow-x-auto rounded-2xl border border-[#E8E2D9]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FBF9F6] border-b border-[#E8E2D9] text-[10px] uppercase text-[#8C857B] font-bold tracking-wider">
                    <th className="py-3 px-3">Číslo dokladu</th>
                    <th className="py-3 px-3">Typ</th>
                    <th className="py-3 px-3">Klient / Pacient</th>
                    <th className="py-3 px-3">Zákrok & Termín</th>
                    <th className="py-3 px-3">Platba</th>
                    <th className="py-3 px-3 text-right">Suma dokladu</th>
                    <th className="py-3 px-3 text-center">Stav úhrady</th>
                    <th className="py-3 px-3 text-center">Akcie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D9] bg-white">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-[#8C857B]">
                        Zatiaľ nie sú zaevidované žiadne faktúry podľa zvoleného filtra. Číslo ZF a DF môžete zadať priamo pri mene klienta v záložke Klienti.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => {
                      const isAdvance = inv.type === 'advance';

                      return (
                        <tr key={inv.id} className="hover:bg-[#FBF9F6]/70 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-sm text-[#2C2A29]">
                            {inv.invoiceNumber}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              isAdvance 
                                ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                                : 'bg-purple-100 text-purple-900 border border-purple-300'
                            }`}>
                              {isAdvance ? 'Zálohová (ZF)' : 'Definitívna (DF)'}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-semibold text-[#2C2A29]">
                            {inv.patientName}
                            {inv.patientPhone && <span className="block text-[10px] text-[#8C857B] font-normal">{inv.patientPhone}</span>}
                          </td>
                          <td className="py-3 px-3 text-[#2C2A29]">
                            <div className="font-medium line-clamp-1">{inv.procedureName}</div>
                            <div className="font-mono text-[10px] text-[#8C857B]">{inv.procedureDate} • {inv.doctorName}</div>
                          </td>
                          <td className="py-3 px-3 capitalize text-[#8C857B]">
                            {inv.paymentMethod === 'bank_transfer' ? 'Prevod' : inv.paymentMethod === 'card' ? 'Karta' : 'Hotovosť'}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-sm text-[#2C2A29]">
                            {inv.amount.toFixed(2)} €
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              inv.isPaid 
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' 
                                : 'bg-rose-100 text-rose-900 border border-rose-200'
                            }`}>
                              {inv.isPaid ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-rose-600" />}
                              {inv.isPaid ? `Uhradená ${inv.paidDate ? `(${inv.paidDate})` : ''}` : 'Čaká na úhradu'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleOpenClientDetail(inv.profile)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FBF9F6] hover:bg-[#2C2A29] text-[#2C2A29] hover:text-white text-xs font-bold transition-all border border-[#E8E2D9] cursor-pointer"
                              title="Upraviť faktúry a detaily klienta"
                            >
                              <span>Upraviť</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SUB-TAB: MARŽE & RENTABILITA VÝKONOV (UNIT ECONOMICS)                   */}
      {/* ========================================================================= */}
      {activeSubTab === 'unit_economics' && canViewPnl && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-[#E8E2D9] shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-brand font-bold text-[#2C2A29] uppercase">
                Ziskovosť a rentabilita jednotlivých výkonov kliniky
              </h3>
              <p className="text-xs text-[#8C857B]">
                Reálna analýza tržieb, nákladov na spotrebovaný materiál zo skladu a skutočnej marže z evidovaných zákrokov
              </p>
            </div>

            {procedureEconomics.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {procedureEconomics.map((item, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-[#FBF9F6] border border-[#E8E2D9] space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-sm text-[#2C2A29]">{item.name}</h4>
                      <span className="text-xs font-mono font-bold text-[#C5A059] bg-[#FAF6EF] px-2 py-0.5 rounded-lg border border-[#E6D4B2]">
                        Marža {item.margin} %
                      </span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#8C857B]">Počet výkonov v CRM:</span>
                        <span className="font-mono font-bold">{item.count}x</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8C857B]">Priemerná dohodnutá cena:</span>
                        <span className="font-mono font-bold">{item.avgPrice.toLocaleString('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                      </div>
                      <div className="flex justify-between text-rose-700">
                        <span>Priemerný náklad na materiál:</span>
                        <span className="font-mono font-semibold">-{item.avgMaterial.toLocaleString('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-[#E8E2D9] text-emerald-800 font-bold">
                        <span>Hrubý zisk na výkon:</span>
                        <span className="font-mono text-base">+{item.avgProfit.toLocaleString('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-[#FBF9F6] rounded-2xl border border-dashed border-[#E8E2D9] space-y-3">
                <PieChart className="w-10 h-10 text-[#8C857B] mx-auto opacity-50" />
                <h4 className="font-bold text-[#2C2A29] text-sm">Žiadne testovacie dáta v rentabilite výkonov</h4>
                <p className="text-xs text-[#8C857B] max-w-md mx-auto">
                  Všetky vymyslené údaje boli vynulované pre ostrú prevádzku. Akonáhle v systéme zaevidujete reálne zákroky pacientov a ich skladový materiál, jednotková rentabilita a maržovosť sa tu vypočíta automaticky.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SUB-TAB: KREDITNÁ PEŇAŽENKA PACIENTOV                                   */}
      {/* ========================================================================= */}
      {activeSubTab === 'credits' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-[#E8E2D9] shadow-xs space-y-6">
            <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-4">
              <div>
                <h3 className="text-lg font-brand font-bold text-[#2C2A29] uppercase">
                  Kreditné účty & Pohyby peňaženky pacientov
                </h3>
                <p className="text-xs text-[#8C857B]">
                  Evidencia darčekových poukazov, preplatkov a vkladov na pooperačnú starostlivosť
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-[#8C857B] uppercase font-bold">Celkový aktívny kredit</span>
                <p className="text-2xl font-brand font-bold text-[#C5A059]">
                  {financials.totalClientCredit.toLocaleString('sk-SK')} €
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E8E2D9] text-[10px] uppercase text-[#8C857B] font-bold">
                    <th className="pb-2">Dátum</th>
                    <th className="pb-2">Pacient</th>
                    <th className="pb-2">Typ pohybu</th>
                    <th className="pb-2">Dôvod / Poznámka</th>
                    <th className="pb-2">Zaevidoval(a)</th>
                    <th className="pb-2 text-right">Zmena (€)</th>
                    <th className="pb-2 text-right">Zostatok po</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D9]">
                  {creditLogs.map((c) => (
                    <tr key={c.id} className="hover:bg-[#FBF9F6]">
                      <td className="py-2.5 font-mono text-[#8C857B]">{c.date}</td>
                      <td className="py-2.5 font-bold text-[#2C2A29]">{c.patientName}</td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF6EF] text-[#8A6827] border border-[#E6D4B2]">
                          {c.type === 'deposit_topup' ? 'Vklad / Záloha' : c.type === 'gift_voucher' ? 'Darčekový poukaz' : 'Preplatok'}
                        </span>
                      </td>
                      <td className="py-2.5 text-[#2C2A29]">{c.note}</td>
                      <td className="py-2.5 text-[#8C857B]">{c.recordedBy}</td>
                      <td className={`py-2.5 text-right font-mono font-bold ${
                        c.amount >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {c.amount >= 0 ? `+${c.amount.toFixed(2)}` : c.amount.toFixed(2)} €
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-[#C5A059]">
                        {c.balanceAfter.toFixed(2)} €
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODÁLY: DETAIL DOKLADU, VYSTAVENIE FAKTÚRY, DETAIL KLIENTA                */}
      {/* ========================================================================= */}
      
      {/* MODAL: DETAIL / TLAČ FAKTÚRY */}
      <InvoiceDetailModal
        invoice={selectedInvoice}
        isOpen={isInvoiceDetailOpen}
        onClose={() => setIsInvoiceDetailOpen(false)}
        onInvoiceUpdated={(updated) => {
          setSelectedInvoice(updated);
          refreshData();
        }}
      />

      {/* MODAL: DETAIL FINANCIÍ KLIENTA & REÁLNA SPOTREBA */}
      <ClientFinanceDetailModal
        profile={selectedProfile}
        isOpen={isProfileDetailOpen}
        onClose={() => setIsProfileDetailOpen(false)}
        onProfileUpdated={(updated) => {
          setSelectedProfile(updated);
          refreshData();
        }}
        onOpenInvoiceDetail={handleOpenInvoiceByNumber}
        onOpenLoyaltyModal={(patientId, patientName) => {
          setIsProfileDetailOpen(false);
          setLoyaltyModalPatient({ id: patientId, name: patientName });
        }}
      />

      {/* MODAL: RÝCHLA ÚPRAVA EXTERNÝCH FAKTÚR (ZF & DF) PRIAMO Z RIADKU KLIENTA */}
      {quickEditProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#E8E2D9] shadow-2xl space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-[#E8E2D9]">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#C5A059] tracking-wider">Účtovníctvo & Faktúry</span>
                <h3 className="text-base font-brand font-bold text-[#2C2A29]">{quickEditProfile.patientName}</h3>
                <p className="text-[11px] text-[#8C857B]">{quickEditProfile.procedureName}</p>
              </div>
              <button
                type="button"
                onClick={() => setQuickEditProfile(null)}
                className="text-[#8C857B] hover:text-[#2C2A29] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickInvoiceEdit} className="space-y-4">
              {/* ZF */}
              <div className="p-3.5 bg-[#FBF9F6] rounded-2xl border border-[#E8E2D9] space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-amber-900 uppercase flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Zálohová faktúra (ZF)
                  </span>
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer font-semibold">
                    <input
                      type="checkbox"
                      checked={quickIsAdvPaid}
                      onChange={(e) => {
                        setQuickIsAdvPaid(e.target.checked);
                        if (e.target.checked && !quickAdvDate) {
                          setQuickAdvDate(new Date().toISOString().split('T')[0]);
                        }
                      }}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                    />
                    <span className={quickIsAdvPaid ? 'text-emerald-700 font-bold' : 'text-[#8C857B]'}>
                      {quickIsAdvPaid ? '✓ Uhradená' : 'Neuhradená'}
                    </span>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-0.5">Číslo ZF</label>
                    <input
                      type="text"
                      value={quickAdvNum}
                      onChange={(e) => setQuickAdvNum(e.target.value)}
                      placeholder="napr. 20260012"
                      className="w-full bg-white border border-[#E8E2D9] p-2 rounded-lg text-xs font-mono font-bold text-[#2C2A29]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-0.5">Suma zálohy (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={quickAdvAmt}
                      onChange={(e) => setQuickAdvAmt(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-white border border-[#E8E2D9] p-2 rounded-lg text-xs font-mono font-bold text-[#2C2A29]"
                    />
                  </div>
                </div>
                {quickIsAdvPaid && (
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#E8E2D9]">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-0.5">Dátum úhrady</label>
                      <input
                        type="date"
                        value={quickAdvDate}
                        onChange={(e) => setQuickAdvDate(e.target.value)}
                        className="w-full bg-white border border-[#E8E2D9] p-1.5 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-0.5">Spôsob platby</label>
                      <select
                        value={quickAdvMethod}
                        onChange={(e) => setQuickAdvMethod(e.target.value as PaymentMethod)}
                        className="w-full bg-white border border-[#E8E2D9] p-1.5 rounded-lg text-xs"
                      >
                        <option value="bank_transfer">Prevod</option>
                        <option value="card">Karta</option>
                        <option value="cash">Hotovosť</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* DF */}
              <div className="p-3.5 bg-[#FBF9F6] rounded-2xl border border-[#E8E2D9] space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-purple-900 uppercase flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    Definitívna faktúra (DF)
                  </span>
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer font-semibold">
                    <input
                      type="checkbox"
                      checked={quickIsFinPaid}
                      onChange={(e) => {
                        setQuickIsFinPaid(e.target.checked);
                        if (e.target.checked && !quickFinDate) {
                          setQuickFinDate(new Date().toISOString().split('T')[0]);
                        }
                      }}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                    />
                    <span className={quickIsFinPaid ? 'text-emerald-700 font-bold' : 'text-[#8C857B]'}>
                      {quickIsFinPaid ? '✓ Uhradená' : 'Neuhradená'}
                    </span>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-0.5">Číslo DF</label>
                    <input
                      type="text"
                      value={quickFinNum}
                      onChange={(e) => setQuickFinNum(e.target.value)}
                      placeholder="napr. 20260145"
                      className="w-full bg-white border border-[#E8E2D9] p-2 rounded-lg text-xs font-mono font-bold text-[#2C2A29]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-0.5">Suma DF (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={quickFinAmt}
                      onChange={(e) => setQuickFinAmt(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-white border border-[#E8E2D9] p-2 rounded-lg text-xs font-mono font-bold text-[#2C2A29]"
                    />
                  </div>
                </div>
                {quickIsFinPaid && (
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#E8E2D9]">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-0.5">Dátum úhrady</label>
                      <input
                        type="date"
                        value={quickFinDate}
                        onChange={(e) => setQuickFinDate(e.target.value)}
                        className="w-full bg-white border border-[#E8E2D9] p-1.5 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-0.5">Spôsob platby</label>
                      <select
                        value={quickFinMethod}
                        onChange={(e) => setQuickFinMethod(e.target.value as PaymentMethod)}
                        className="w-full bg-white border border-[#E8E2D9] p-1.5 rounded-lg text-xs"
                      >
                        <option value="card">Karta</option>
                        <option value="bank_transfer">Prevod</option>
                        <option value="cash">Hotovosť</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickEditProfile(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[#E8E2D9] text-xs font-bold text-[#8C857B] hover:text-[#2C2A29] cursor-pointer"
                >
                  Zrušiť
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#2C2A29] hover:bg-[#C5A059] text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
                >
                  Uložiť faktúry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VERNOSTNÝ SYSTÉM KLIENTA (365 DNÍ) */}
      <ClientLoyaltyModal
        isOpen={!!loyaltyModalPatient}
        onClose={() => setLoyaltyModalPatient(null)}
        patientId={loyaltyModalPatient?.id}
        patientName={loyaltyModalPatient?.name || ''}
      />

      {/* MODAL: PRIDANIE KLIENTA DO FINANCIÍ */}
      <AddClientFinanceModal
        isOpen={isAddClientOpen}
        onClose={() => setIsAddClientOpen(false)}
        patients={patients}
        onClientAdded={(newProfile) => {
          setClientProfiles(prev => [newProfile, ...prev]);
        }}
      />

      {/* MODAL: POTVRDENIE VYMAZANIA JEDNÉHO KLIENTA */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-rose-200 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-brand font-bold text-[#2C2A29]">Vymazať klienta z financií?</h3>
                <p className="text-xs text-[#8C857B]">Tento úkon odstráni finančný profil klienta.</p>
              </div>
            </div>

            <div className="p-3 bg-[#FBF9F6] border border-[#E8E2D9] rounded-2xl text-xs space-y-1">
              <p className="font-bold text-[#2C2A29]">{clientToDelete.patientName}</p>
              <p className="text-[#8C857B]">{clientToDelete.procedureName} • {clientToDelete.procedureDate}</p>
              <p className="text-[#8C857B]">Dohodnutá cena: <span className="font-mono font-bold text-[#2C2A29]">{clientToDelete.totalAgreedPrice.toLocaleString('sk-SK')} €</span></p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#E8E2D9] text-[#2C2A29] text-xs font-bold hover:bg-[#FBF9F6] transition-colors cursor-pointer"
              >
                Zrušiť
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteClient}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                Áno, vymazať
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: POTVRDENIE VYČISTENIA ZOZNAMU KLIENTOV */}
      {showClearAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full border border-rose-200 shadow-2xl space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-brand font-bold text-[#2C2A29]">
                Vyčistiť zoznam klientov vo financiách?
              </h3>
              <p className="text-xs text-[#8C857B] leading-relaxed">
                Tento krok vymaže všetkých doterajších {clientProfiles.length} klientov z finančného modulu.
              </p>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-left text-xs text-emerald-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Čistý režim financií:
                </div>
                <ul className="list-disc list-inside text-[11px] text-emerald-800 space-y-0.5 pl-1">
                  <li>Žiadne fiktívne záznamy z Google Kalendára sa už automaticky neobnovia.</li>
                  <li>Klientov budete môcť pridávať postupne manuálne tlačidlom <strong>+ Pridať klienta</strong>.</li>
                  <li>Noví klienti pribudnú tiež automaticky po uzatvorení vyšetrenia priamo v SAY OS.</li>
                  <li>Kartotéka pacientov a kalendár zostanú nedotknuté.</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearAllConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-[#E8E2D9] text-[#2C2A29] text-xs font-bold hover:bg-[#FBF9F6] transition-colors cursor-pointer"
              >
                Zrušiť
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAllClients}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer"
              >
                Áno, vyčistiť zoznam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: POTVRDENIE VYNULOVANIA PRE OSTRÚ PREVÁDZKU */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full border border-rose-200 shadow-2xl space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-brand font-bold text-[#2C2A29] uppercase tracking-wide">
                Vynulovať finančné údaje na ostro?
              </h3>
              <p className="text-xs text-[#8C857B] leading-relaxed">
                Tento krok definitívne vymaže všetky cvičné a vymyslené faktúry, zálohy, finančné profily, kredity a prevádzkové náklady z pamäte prehliadača.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left text-xs text-amber-900 mt-3 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  Čo sa stane:
                </div>
                <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-0.5 pl-1">
                  <li>Tržby, faktúry a zálohy sa vynulujú na 0.00 €</li>
                  <li>Evidencia prevádzkových výdavkov bude prázdna</li>
                  <li>Počítadlo faktúr začne nanovo (napr. VF-2026-0001)</li>
                  <li>Zákroky v kalendári a kartotéka pacientov ostanú zachované</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="flex-1 py-3 rounded-xl border border-[#E8E2D9] text-[#2C2A29] text-xs font-bold hover:bg-[#FBF9F6] transition-colors cursor-pointer"
              >
                Zrušiť
              </button>
              <button
                type="button"
                onClick={handleResetForProduction}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer"
              >
                Áno, vynulovať na ostro
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
