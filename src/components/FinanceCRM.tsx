'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { SaleItem } from '../app/page';
import { CalendarEvent } from '../data/calendarConfig';
import { Patient } from './PatientDatabase';
import { 
  FinanceBillingService, 
  Invoice, 
  PatientFinancialProfile, 
  CreditTransaction 
} from '@/services/financeBillingService';
import { InventoryService } from '@/services/inventoryService';
import InvoiceDetailModal from './finance/InvoiceDetailModal';
import CreateInvoiceModal from './finance/CreateInvoiceModal';
import ClientFinanceDetailModal from './finance/ClientFinanceDetailModal';
import MonthlyFinancialVisualizer from './finance/MonthlyFinancialVisualizer';
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
  BarChart3
} from 'lucide-react';

interface ExpenseItem {
  id: string;
  date: string;
  title: string;
  category: 'Material' | 'Implants' | 'Rent' | 'Salaries' | 'Utilities' | 'Other';
  amount: number;
}

const INITIAL_EXPENSES: ExpenseItem[] = [
  { id: 'E1', date: '2026-08-01', title: 'Nákup implantátov Motiva Ergonomix (faktúra sklad)', category: 'Implants', amount: 2760 },
  { id: 'E2', date: '2026-08-02', title: 'Nájomné priestorov Rudlovská cesta', category: 'Rent', amount: 1500 },
  { id: 'E3', date: '2026-08-05', title: 'Zdravotnícky materiál, šitie a kanyly', category: 'Material', amount: 450 },
  { id: 'E4', date: '2026-08-10', title: 'Energia a čisté priestory sály SAY', category: 'Utilities', amount: 320 },
  { id: 'E5', date: '2026-08-15', title: 'Nákup toxínov Dysport & výplní Stylage', category: 'Material', amount: 1250 },
];

interface FinanceCRMProps {
  sales?: SaleItem[];
  calendarEvents?: CalendarEvent[];
  patients?: Patient[];
}

export default function FinanceCRM({ 
  sales = [], 
  calendarEvents = [], 
  patients = [] 
}: FinanceCRMProps) {
  // Hlavné podzáložky
  const [activeSubTab, setActiveSubTab] = useState<'clients' | 'overview' | 'monthly_analytics' | 'invoices' | 'unit_economics' | 'credits'>('clients');

  // Stavy pre dáta
  const [clientProfiles, setClientProfiles] = useState<PatientFinancialProfile[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [creditLogs, setCreditLogs] = useState<CreditTransaction[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>(INITIAL_EXPENSES);

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
  const [clientFilter, setClientFilter] = useState<'all' | 'planned' | 'operated' | 'due' | 'credit'>('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [createInvoicePreset, setCreateInvoicePreset] = useState<{
    patientName: string;
    procedureName: string;
    amount: number;
    type: 'advance' | 'standard';
  }>({
    patientName: '',
    procedureName: '',
    amount: 800,
    type: 'advance'
  });

  const [selectedProfile, setSelectedProfile] = useState<PatientFinancialProfile | null>(null);
  const [isProfileDetailOpen, setIsProfileDetailOpen] = useState(false);

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

    window.addEventListener('say_clinic_invoices_changed', handleInvoicesChanged);
    window.addEventListener('say_clinic_client_profiles_changed', handleProfilesChanged);
    window.addEventListener('say_clinic_credit_logs_changed', handleCreditsChanged);

    return () => {
      window.removeEventListener('say_clinic_invoices_changed', handleInvoicesChanged);
      window.removeEventListener('say_clinic_client_profiles_changed', handleProfilesChanged);
      window.removeEventListener('say_clinic_credit_logs_changed', handleCreditsChanged);
    };
  }, [calendarEvents.length, patients.length]);

  // VÝPOČTY PRE FINANČNÝ PREHĽAD KLINIKY (P&L, SPOTREBA, PRÍJEM)
  const financials = useMemo(() => {
    // 1. Tržby z uhradených faktúr a priamych predajov
    const invoiceRevenue = invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + i.paidAmount, 0);

    const posSalesRevenue = sales.reduce((sum, s) => sum + s.amount, 0);
    const totalRevenue = Math.max(invoiceRevenue, posSalesRevenue) > 0 
      ? invoiceRevenue + posSalesRevenue 
      : 12450; // Konzistentný základ

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
    const totalStockValue = inventoryItems.reduce((sum, item) => sum + (item.unitPrice * item.currentStock), 0);

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

  // FILTROVANIE ZOZNAMU KLIENTOV
  const filteredClients = useMemo(() => {
    return clientProfiles.filter(p => {
      // Filter podľa kategórie
      if (clientFilter === 'planned' && p.status !== 'planned') return false;
      if (clientFilter === 'operated' && p.status !== 'operated') return false;
      if (clientFilter === 'due' && p.balanceDue <= 0) return false;
      if (clientFilter === 'credit' && (p.clientCredit || 0) <= 0) return false;

      // Vyhľadávanie
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.patientName.toLowerCase().includes(q);
        const matchProc = p.procedureName.toLowerCase().includes(q);
        const matchDoc = p.doctorName.toLowerCase().includes(q);
        return matchName || matchProc || matchDoc;
      }

      return true;
    });
  }, [clientProfiles, clientFilter, searchQuery]);

  // FILTROVANIE FAKTÚR
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      if (invoiceTypeFilter === 'advance' && inv.type !== 'advance') return false;
      if (invoiceTypeFilter === 'standard' && inv.type !== 'standard') return false;
      if (invoiceStatusFilter === 'paid' && inv.status !== 'paid') return false;
      if (invoiceStatusFilter === 'unpaid' && inv.status !== 'unpaid') return false;
      return true;
    });
  }, [invoices, invoiceTypeFilter, invoiceStatusFilter]);

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

    setExpenses([newExpense, ...expenses]);
    setExpTitle('');
    setExpAmount('');
    setShowAddExpense(false);
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

  // Otvorenie modálu pre vystavenie faktúry s predvyplnenými hodnotami
  const handleTriggerCreateInvoice = (patientName: string, procedureName: string, amount: number, type: 'advance' | 'standard') => {
    setCreateInvoicePreset({ patientName, procedureName, amount, type });
    setIsCreateInvoiceOpen(true);
  };

  // Otvorenie detailu klienta
  const handleOpenClientDetail = (profile: PatientFinancialProfile) => {
    setSelectedProfile(profile);
    setIsProfileDetailOpen(true);
  };

  // Export do CSV
  const handleExportCSV = () => {
    const headers = ['Meno klienta', 'Stav', 'Zákrok', 'Dátum', 'Celková cena (€)', 'Zaplatená záloha (€)', 'Kredit (€)', 'Zostáva doplatiť (€)', 'Spotreba materiálu (€)', 'Čistá marža (€)', 'Maržovosť (%)'];
    const rows = clientProfiles.map(p => [
      `"${p.patientName}"`,
      `"${p.status === 'planned' ? 'Plánovaný' : 'Odoperovaný'}"`,
      `"${p.procedureName}"`,
      `"${p.procedureDate}"`,
      p.totalAgreedPrice.toFixed(2),
      p.depositPaid.toFixed(2),
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
              <h2 className="text-xl font-brand font-bold text-[#2C2A29] uppercase tracking-wide">
                Finančné riadenie & Výsledky kliniky
              </h2>
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
            <span>Kniha faktúr & Zálohy</span>
            <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-white/20">
              {invoices.length}
            </span>
          </button>

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
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
              
              {/* FILTRAČNÉ PILLSY */}
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
              </div>

              {/* HĽADANIE A AKČNÉ TLAČIDLÁ */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 md:w-64">
                  <Search className="w-4 h-4 text-[#8C857B] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Hľadať klienta, zákrok, lekára..."
                    className="w-full bg-[#FBF9F6] border border-[#E8E2D9] pl-9 pr-3 py-2 rounded-xl text-xs text-[#2C2A29] focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FBF9F6] hover:bg-[#E8E2D9]/60 border border-[#E8E2D9] text-xs font-bold text-[#2C2A29] transition-colors"
                  title="Export do CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">CSV Export</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTriggerCreateInvoice('', '', 800, 'advance')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2C2A29] hover:bg-[#C5A059] text-white text-xs font-bold transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Vystaviť doklad</span>
                </button>
              </div>
            </div>

            {/* HLAVNÁ TABUĽKA KLIENTOV */}
            <div className="overflow-x-auto rounded-2xl border border-[#E8E2D9]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FBF9F6] border-b border-[#E8E2D9] text-[10px] uppercase text-[#8C857B] font-bold tracking-wider">
                    <th className="py-3 px-3">Klient & Výkon</th>
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

                      return (
                        <tr key={p.id} className="hover:bg-[#FBF9F6]/70 transition-colors">
                          
                          {/* KLIENT A VÝKON */}
                          <td className="py-3 px-3">
                            <button
                              type="button"
                              onClick={() => handleOpenClientDetail(p)}
                              className="text-left group"
                            >
                              <p className="font-bold text-sm text-[#2C2A29] group-hover:text-[#C5A059] transition-colors flex items-center gap-1.5">
                                {p.patientName}
                                <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#C5A059]" />
                              </p>
                              <p className="text-[11px] text-[#8C857B] line-clamp-1">{p.procedureName}</p>
                            </button>
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
                              p.isDepositPaid 
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}>
                              {p.depositPaid} / {p.depositRequired} €
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
                                className="p-1.5 rounded-lg bg-[#FBF9F6] hover:bg-[#E8E2D9] text-[#2C2A29] transition-colors"
                                title="Detail klienta, platby a spotrebovaný materiál"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleTriggerCreateInvoice(p.patientName, p.procedureName, p.balanceDue || p.totalAgreedPrice, 'standard')}
                                className="p-1.5 rounded-lg bg-[#2C2A29] hover:bg-[#C5A059] text-white transition-colors"
                                title="Vystaviť faktúru"
                              >
                                <FileText className="w-4 h-4" />
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
      {/* 2. SUB-TAB: MESAČNÁ VIZUALIZÁCIA TRŽIEB VS. VÝDAVKOV & POŽIADAVKY KLIENTOV */}
      {/* ========================================================================= */}
      {activeSubTab === 'monthly_analytics' && (
        <MonthlyFinancialVisualizer
          invoices={invoices}
          clientProfiles={clientProfiles}
          calendarEvents={calendarEvents}
          patients={patients}
          sales={sales}
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
          onTriggerCreateInvoice={(patientName, procedureName, amount, type) => {
            handleTriggerCreateInvoice(patientName, procedureName, amount, type);
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
      {activeSubTab === 'overview' && (
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
                      <tr key={e.id} className="hover:bg-[#FBF9F6]">
                        <td className="py-2.5 text-[#8C857B] font-mono">{e.date}</td>
                        <td className="py-2.5 font-semibold text-rose-600">Prevádzka ({e.category})</td>
                        <td className="py-2.5 text-[#2C2A29]">{e.title}</td>
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
      {/* 3. SUB-TAB: KNIHA FAKTÚR & ZÁLOHOVÉ FAKTÚRY (INVOICING HUB)              */}
      {/* ========================================================================= */}
      {activeSubTab === 'invoices' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-5 border border-[#E8E2D9] shadow-xs space-y-4">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-[#8C857B] uppercase tracking-wider mr-1">Typ:</span>
                <button
                  type="button"
                  onClick={() => setInvoiceTypeFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    invoiceTypeFilter === 'all'
                      ? 'bg-[#2C2A29] text-white'
                      : 'bg-[#FBF9F6] text-[#8C857B] hover:text-[#2C2A29] border border-[#E8E2D9]'
                  }`}
                >
                  Všetky ({invoices.length})
                </button>
                <button
                  type="button"
                  onClick={() => setInvoiceTypeFilter('advance')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    invoiceTypeFilter === 'advance'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-900 border border-amber-200'
                  }`}
                >
                  📄 Zálohové faktúry ({invoices.filter(i => i.type === 'advance').length})
                </button>
                <button
                  type="button"
                  onClick={() => setInvoiceTypeFilter('standard')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    invoiceTypeFilter === 'standard'
                      ? 'bg-purple-700 text-white'
                      : 'bg-purple-50 text-purple-900 border border-purple-200'
                  }`}
                >
                  🧾 Vyúčtovacie faktúry ({invoices.filter(i => i.type === 'standard').length})
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleTriggerCreateInvoice('', '', 800, 'advance')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2C2A29] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>+ Vystaviť novú faktúru</span>
              </button>
            </div>

            {/* TABUĽKA FAKTÚR */}
            <div className="overflow-x-auto rounded-2xl border border-[#E8E2D9]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FBF9F6] border-b border-[#E8E2D9] text-[10px] uppercase text-[#8C857B] font-bold tracking-wider">
                    <th className="py-3 px-3">Číslo dokladu</th>
                    <th className="py-3 px-3">Typ</th>
                    <th className="py-3 px-3">Klient / Pacient</th>
                    <th className="py-3 px-3">Vystavenie / Splatnosť</th>
                    <th className="py-3 px-3">Var. symbol</th>
                    <th className="py-3 px-3">Platba</th>
                    <th className="py-3 px-3 text-right">Celková suma</th>
                    <th className="py-3 px-3 text-center">Stav</th>
                    <th className="py-3 px-3 text-center">Akcie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D9] bg-white">
                  {filteredInvoices.map((inv) => {
                    const isAdvance = inv.type === 'advance';
                    const isPaid = inv.status === 'paid';

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
                            {isAdvance ? 'Zálohová (ZF)' : 'Vyúčtovacia (FA)'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-[#2C2A29]">
                          {inv.patientName}
                          {inv.patientPhone && <span className="block text-[10px] text-[#8C857B] font-normal">{inv.patientPhone}</span>}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px]">
                          <div>{inv.issueDate}</div>
                          <div className={!isPaid ? 'text-rose-700 font-bold' : 'text-[#8C857B]'}>spl. {inv.dueDate}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-[#8C857B]">
                          {inv.variableSymbol}
                        </td>
                        <td className="py-3 px-3 capitalize text-[#8C857B]">
                          {inv.paymentMethod === 'bank_transfer' ? 'Prevod' : inv.paymentMethod === 'card' ? 'Karta' : 'Hotovosť'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-sm text-[#2C2A29]">
                          {inv.totalAmount.toFixed(2)} €
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isPaid 
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' 
                              : 'bg-rose-100 text-rose-900 border border-rose-200'
                          }`}>
                            {isPaid ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {isPaid ? 'Uhradená' : 'Čaká na úhradu'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenInvoiceModal(inv)}
                            className="flex items-center gap-1 mx-auto px-2.5 py-1 rounded-lg bg-[#FBF9F6] hover:bg-[#2C2A29] text-[#2C2A29] hover:text-white text-xs font-bold transition-all border border-[#E8E2D9]"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Tlač dokladu</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SUB-TAB: MARŽE & RENTABILITA VÝKONOV (UNIT ECONOMICS)                   */}
      {/* ========================================================================= */}
      {activeSubTab === 'unit_economics' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-[#E8E2D9] shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-brand font-bold text-[#2C2A29] uppercase">
                Ziskovosť a rentabilita jednotlivých výkonov kliniky
              </h3>
              <p className="text-xs text-[#8C857B]">
                Analýza tržieb, nákladov na spotrebovaný materiál (implantáty, liečivá, spotrebný materiál) a skutočnej marže
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* AUGMENTÁCIA PRSNÍKOV */}
              <div className="p-5 rounded-2xl bg-[#FBF9F6] border border-[#E8E2D9] space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-sm text-[#2C2A29]">Augmentácia prsníkov</h4>
                  <span className="text-xs font-mono font-bold text-[#C5A059] bg-[#FAF6EF] px-2 py-0.5 rounded-lg border border-[#E6D4B2]">
                    Marža 66 %
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#8C857B]">Priemerná cena výkonu:</span>
                    <span className="font-mono font-bold">4 200 €</span>
                  </div>
                  <div className="flex justify-between text-rose-700">
                    <span>Náklad: Motiva implantáty:</span>
                    <span className="font-mono font-semibold">-1 380 €</span>
                  </div>
                  <div className="flex justify-between text-rose-700">
                    <span>Náklad: Podprsenka & šitie:</span>
                    <span className="font-mono font-semibold">-40.12 €</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#E8E2D9] text-emerald-800 font-bold">
                    <span>Hrubý zisk na výkon:</span>
                    <span className="font-mono text-base">+2 779.88 €</span>
                  </div>
                </div>
              </div>

              {/* BLEFAROPLASTIKA */}
              <div className="p-5 rounded-2xl bg-[#FBF9F6] border border-[#E8E2D9] space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-sm text-[#2C2A29]">Blefaroplastika viečok</h4>
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                    Marža 95 %
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#8C857B]">Priemerná cena výkonu:</span>
                    <span className="font-mono font-bold">950 €</span>
                  </div>
                  <div className="flex justify-between text-rose-700">
                    <span>Náklad: Šitie PDS / Monocryl:</span>
                    <span className="font-mono font-semibold">-25 €</span>
                  </div>
                  <div className="flex justify-between text-rose-700">
                    <span>Náklad: Dermabond & kompresy:</span>
                    <span className="font-mono font-semibold">-20 €</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#E8E2D9] text-emerald-800 font-bold">
                    <span>Hrubý zisk na výkon:</span>
                    <span className="font-mono text-base">+905.00 €</span>
                  </div>
                </div>
              </div>

              {/* LIPOSUKCIA PAL MICROAIRE */}
              <div className="p-5 rounded-2xl bg-[#FBF9F6] border border-[#E8E2D9] space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-sm text-[#2C2A29]">Vibračná liposukcia PAL</h4>
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                    Marža 95 %
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#8C857B]">Priemerná cena výkonu:</span>
                    <span className="font-mono font-bold">2 800 €</span>
                  </div>
                  <div className="flex justify-between text-rose-700">
                    <span>Náklad: Lipoelastic pás:</span>
                    <span className="font-mono font-semibold">-42 €</span>
                  </div>
                  <div className="flex justify-between text-rose-700">
                    <span>Náklad: Kanyly & sety:</span>
                    <span className="font-mono font-semibold">-85 €</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#E8E2D9] text-emerald-800 font-bold">
                    <span>Hrubý zisk na výkon:</span>
                    <span className="font-mono text-base">+2 673.00 €</span>
                  </div>
                </div>
              </div>

            </div>
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

      {/* MODAL: VYSTAVENIE NOVEJ FAKTÚRY / ZÁLOHOVEJ FAKTÚRY */}
      <CreateInvoiceModal
        isOpen={isCreateInvoiceOpen}
        onClose={() => setIsCreateInvoiceOpen(false)}
        onInvoiceCreated={(newInv) => {
          refreshData();
          setSelectedInvoice(newInv);
          setIsInvoiceDetailOpen(true);
        }}
        patients={patients}
        initialPatientName={createInvoicePreset.patientName}
        initialProcedureName={createInvoicePreset.procedureName}
        initialAmount={createInvoicePreset.amount}
        initialType={createInvoicePreset.type}
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
        onCreateInvoiceForClient={(patName, procName, amt, type) => {
          setIsProfileDetailOpen(false);
          handleTriggerCreateInvoice(patName, procName, amt, type);
        }}
      />

    </div>
  );
}
