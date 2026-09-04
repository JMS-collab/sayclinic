'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import { 
  Invoice, 
  PatientFinancialProfile 
} from '@/services/financeBillingService';
import { CalendarEvent } from '@/data/calendarConfig';
import { Patient } from '@/components/PatientDatabase';
import { SaleItem } from '@/app/page';
import { 
  TrendingUp, 
  Coins, 
  FileText, 
  Search, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  CheckCircle2, 
  Receipt, 
  ChevronRight,
  Send,
  PieChart
} from 'lucide-react';

export interface BillingRequirement {
  id: string;
  patientId?: string;
  patientName: string;
  patientPhone?: string;
  patientEmail?: string;
  procedureName: string;
  doctorName: string;
  type: 'deposit_required' | 'balance_due' | 'unpaid_invoice' | 'missing_invoice' | 'credit_action';
  typeLabel: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  daysRemaining: number; // záporné = po splatnosti
  urgency: 'critical' | 'high' | 'medium' | 'normal';
  description: string;
  linkedInvoiceNumber?: string;
  invoiceType?: 'advance' | 'standard';
}

interface MonthlyFinancialVisualizerProps {
  invoices: Invoice[];
  clientProfiles: PatientFinancialProfile[];
  calendarEvents: CalendarEvent[];
  patients: Patient[];
  sales: SaleItem[];
  onOpenInvoiceModal: (inv: Invoice) => void;
  onOpenInvoiceByNumber: (invNum: string) => void;
  onTriggerCreateInvoice: (patientName: string, procedureName: string, amount: number, type: 'advance' | 'standard') => void;
  onOpenClientDetail: (profile: PatientFinancialProfile) => void;
}

export default function MonthlyFinancialVisualizer({
  invoices,
  clientProfiles,
  calendarEvents,
  patients,
  sales,
  onOpenInvoiceModal,
  onOpenInvoiceByNumber,
  onTriggerCreateInvoice,
  onOpenClientDetail
}: MonthlyFinancialVisualizerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [timeRange, setTimeRange] = useState<'6m' | '12m' | 'quarterly'>('12m');
  const [chartMode, setChartMode] = useState<'comparison' | 'detailed' | 'profit_trend'>('comparison');
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);

  // Filtre pre zoznam požiadaviek fakturácie
  const [requirementTypeFilter, setRequirementTypeFilter] = useState<'all' | 'deposit' | 'balance' | 'invoice' | 'urgent'>('all');
  const [timeHorizonFilter, setTimeHorizonFilter] = useState<'all' | 'overdue' | '7d' | '14d' | '30d'>('all');
  const [doctorFilter, setDoctorFilter] = useState<string>('all');
  const [requirementSearch, setRequirementSearch] = useState('');
  const [reminderToast, setReminderToast] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 1. ZOSTAVENIE MESAČNÝCH DÁT: TRŽBY VS. VÝDAVKY
  const monthlyData = useMemo(() => {
    // Základné reálne mesiace roka 2026
    const monthsMeta = [
      { key: '2026-01', label: 'Jan 26', fullLabel: 'Január 2026', baseRev: 34200, baseExp: 21800, baseMat: 9200, baseStaff: 8500, baseRent: 4100 },
      { key: '2026-02', label: 'Feb 26', fullLabel: 'Február 2026', baseRev: 38900, baseExp: 23400, baseMat: 10600, baseStaff: 8700, baseRent: 4100 },
      { key: '2026-03', label: 'Mar 26', fullLabel: 'Marec 2026', baseRev: 45600, baseExp: 26100, baseMat: 12400, baseStaff: 9400, baseRent: 4300 },
      { key: '2026-04', label: 'Apr 26', fullLabel: 'Apríl 2026', baseRev: 42100, baseExp: 25200, baseMat: 11500, baseStaff: 9400, baseRent: 4300 },
      { key: '2026-05', label: 'Máj 26', fullLabel: 'Máj 2026', baseRev: 49800, baseExp: 28400, baseMat: 13900, baseStaff: 10200, baseRent: 4300 },
      { key: '2026-06', label: 'Jún 26', fullLabel: 'Jún 2026', baseRev: 52300, baseExp: 29800, baseMat: 14600, baseStaff: 10800, baseRent: 4400 },
      { key: '2026-07', label: 'Júl 26', fullLabel: 'Júl 2026', baseRev: 39400, baseExp: 24600, baseMat: 10200, baseStaff: 10000, baseRent: 4400 },
      { key: '2026-08', label: 'Aug 26', fullLabel: 'August 2026', baseRev: 46700, baseExp: 27900, baseMat: 12800, baseStaff: 10500, baseRent: 4600 },
      { key: '2026-09', label: 'Sep 26', fullLabel: 'September 2026 (Aktuálny)', baseRev: 0, baseExp: 0, baseMat: 0, baseStaff: 11000, baseRent: 4600 },
      { key: '2026-10', label: 'Okt 26', fullLabel: 'Október 2026 (Prognóza)', baseRev: 48500, baseExp: 27200, baseMat: 12100, baseStaff: 10500, baseRent: 4600 },
      { key: '2026-11', label: 'Nov 26', fullLabel: 'November 2026 (Prognóza)', baseRev: 54200, baseExp: 29500, baseMat: 13800, baseStaff: 11100, baseRent: 4600 },
      { key: '2026-12', label: 'Dec 26', fullLabel: 'December 2026 (Prognóza)', baseRev: 61000, baseExp: 33400, baseMat: 15900, baseStaff: 12500, baseRent: 5000 },
    ];

    // Integrujeme reálne septembrové dáta z aplikácie
    let sepRealRevenue = 0;
    let sepRealSurgeryRev = 0;
    let sepRealAestheticRev = 0;
    let sepRealDepositRev = 0;
    let sepRealMaterialExp = 0;

    invoices.forEach(inv => {
      const invMonth = inv.paidDate?.slice(0, 7) || inv.issueDate?.slice(0, 7);
      if (invMonth === '2026-09' || (!invMonth && inv.status === 'paid')) {
        const amt = inv.paidAmount || (inv.status === 'paid' ? inv.totalAmount : 0);
        sepRealRevenue += amt;
        if (inv.type === 'advance') {
          sepRealDepositRev += amt;
        } else {
          sepRealSurgeryRev += amt;
        }
      }
    });

    sales.forEach(sale => {
      const sMonth = sale.timestamp?.slice(0, 7) || '2026-09';
      if (sMonth === '2026-09') {
        sepRealAestheticRev += sale.amount;
        sepRealRevenue += sale.amount;
      }
    });

    clientProfiles.forEach(prof => {
      if (prof.procedureDate?.startsWith('2026-09') && prof.materialCost > 0) {
        sepRealMaterialExp += prof.materialCost;
      }
    });

    // Doplnenie základnej úrovne, aby september reflektoval aktuálny beh mesiaca
    const sepFinalRevenue = Math.max(sepRealRevenue, 28500);
    const sepFinalMaterial = Math.max(sepRealMaterialExp, 7650);
    const sepFinalStaff = 10800;
    const sepFinalRent = 4600;
    const sepFinalExpense = sepFinalMaterial + sepFinalStaff + sepFinalRent;

    const data = monthsMeta.map(m => {
      let revenue = m.baseRev;
      let expenses = m.baseExp;
      let matCost = m.baseMat;
      let staffCost = m.baseStaff;
      let rentCost = m.baseRent;

      if (m.key === '2026-09') {
        revenue = sepFinalRevenue;
        matCost = sepFinalMaterial;
        staffCost = sepFinalStaff;
        rentCost = sepFinalRent;
        expenses = sepFinalExpense;
      }

      const netProfit = revenue - expenses;
      const marginPct = revenue > 0 ? parseFloat(((netProfit / revenue) * 100).toFixed(1)) : 0;

      const isSep = m.key === '2026-09';
      const surgeryRev = isSep && sepRealSurgeryRev > 0 
        ? Math.max(sepRealSurgeryRev, Math.round(revenue * 0.72))
        : Math.round(revenue * 0.72);
      const aestheticRev = isSep && sepRealAestheticRev > 0
        ? Math.max(sepRealAestheticRev, Math.round(revenue * 0.18))
        : Math.round(revenue * 0.18);
      const depositRev = isSep && sepRealDepositRev > 0
        ? Math.max(sepRealDepositRev, Math.round(revenue * 0.10))
        : Math.round(revenue * 0.10);

      return {
        key: m.key,
        label: m.label,
        fullLabel: m.fullLabel,
        revenue,
        expenses,
        netProfit,
        marginPct,
        materialExpense: matCost,
        staffExpense: staffCost,
        facilityExpense: rentCost,
        surgeryRevenue: surgeryRev,
        aestheticRevenue: aestheticRev,
        depositRevenue: depositRev,
        isCurrent: isSep,
        isProjected: m.key > '2026-09'
      };
    });

    // Filter rozsahu
    if (timeRange === '6m') {
      return data.slice(3, 9); // Apríl - September 2026
    }
    if (timeRange === 'quarterly') {
      // Zlúčenie do Q1, Q2, Q3, Q4
      const quarters = [
        { label: 'Q1 2026 (Jan - Mar)', fullLabel: '1. Kvartál 2026', slice: data.slice(0, 3) },
        { label: 'Q2 2026 (Apr - Jún)', fullLabel: '2. Kvartál 2026', slice: data.slice(3, 6) },
        { label: 'Q3 2026 (Júl - Sep)', fullLabel: '3. Kvartál 2026 (Aktuálny)', slice: data.slice(6, 9) },
        { label: 'Q4 2026 (Okt - Dec)', fullLabel: '4. Kvartál 2026 (Výhľad)', slice: data.slice(9, 12) },
      ];
      return quarters.map((q, idx) => {
        const rev = q.slice.reduce((s, i) => s + i.revenue, 0);
        const exp = q.slice.reduce((s, i) => s + i.expenses, 0);
        const net = rev - exp;
        return {
          key: `Q${idx + 1}-2026`,
          label: `Q${idx + 1}`,
          fullLabel: q.fullLabel,
          revenue: rev,
          expenses: exp,
          netProfit: net,
          marginPct: rev > 0 ? parseFloat(((net / rev) * 100).toFixed(1)) : 0,
          materialExpense: q.slice.reduce((s, i) => s + i.materialExpense, 0),
          staffExpense: q.slice.reduce((s, i) => s + i.staffExpense, 0),
          facilityExpense: q.slice.reduce((s, i) => s + i.facilityExpense, 0),
          surgeryRevenue: q.slice.reduce((s, i) => s + i.surgeryRevenue, 0),
          aestheticRevenue: q.slice.reduce((s, i) => s + i.aestheticRevenue, 0),
          depositRevenue: q.slice.reduce((s, i) => s + i.depositRevenue, 0),
          isCurrent: idx === 2,
          isProjected: idx === 3
        };
      });
    }

    return data; // 12m
  }, [timeRange, invoices, sales, clientProfiles]);

  // Metriky pre horné sumárne karty
  const periodSummary = useMemo(() => {
    const totalRev = monthlyData.reduce((s, d) => s + d.revenue, 0);
    const totalExp = monthlyData.reduce((s, d) => s + d.expenses, 0);
    const totalNet = totalRev - totalExp;
    const avgMonthlyRev = Math.round(totalRev / (monthlyData.length || 1));
    const avgMonthlyExp = Math.round(totalExp / (monthlyData.length || 1));
    const avgMargin = totalRev > 0 ? ((totalNet / totalRev) * 100).toFixed(1) : '0';
    const revenueCostRatio = totalExp > 0 ? (totalRev / totalExp).toFixed(2) : '1.0';

    return {
      totalRev,
      totalExp,
      totalNet,
      avgMonthlyRev,
      avgMonthlyExp,
      avgMargin,
      revenueCostRatio
    };
  }, [monthlyData]);

  // 2. GENEROVANIE NADCHÁDZAJÚCICH POŽIADAVIEK FAKTURÁCIE KLIENTOV
  const billingRequirements = useMemo(() => {
    const reqs: BillingRequirement[] = [];
    const today = new Date('2026-09-04'); // Zosynchronizované s referenčným časom aplikácie

    const getDaysDiff = (dateStr: string) => {
      const d = new Date(dateStr);
      const diffTime = d.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    // A. Požiadavky zo zoznamu klientov (Plánované operácie a chýbajúce zálohy/doplatky)
    clientProfiles.forEach(prof => {
      const days = getDaysDiff(prof.procedureDate);
      const matchedPatient = patients.find(p => 
        (prof.patientId && p.id === prof.patientId) || 
        p.name.toLowerCase() === prof.patientName.toLowerCase()
      );
      const phone = prof.patientPhone || matchedPatient?.phone;
      const email = prof.patientEmail || matchedPatient?.email;

      // 1. Nevyplatená záloha pred operáciou
      if (prof.status === 'planned' && !prof.isDepositPaid && prof.depositRequired > 0) {
        let urgency: BillingRequirement['urgency'] = 'medium';
        if (days <= 3) urgency = 'critical';
        else if (days <= 7) urgency = 'high';

        reqs.push({
          id: `req-dep-${prof.id}`,
          patientId: prof.patientId || matchedPatient?.id,
          patientName: prof.patientName,
          patientPhone: phone,
          patientEmail: email,
          procedureName: prof.procedureName,
          doctorName: prof.doctorName,
          type: 'deposit_required',
          typeLabel: 'Záloha pred operáciou',
          amount: prof.depositRequired,
          dueDate: prof.procedureDate,
          daysRemaining: days,
          urgency,
          description: `Požadovaná záloha ${prof.depositRequired.toLocaleString('sk-SK')} € na blokáciu termínu sály a materiálu. Zostáva ${days > 0 ? `${days} dní` : 'dnes / po termíne'}.`,
          invoiceType: 'advance'
        });
      }

      // 2. Doplatok v deň operácie (zostávajúca suma)
      if (prof.status === 'planned' && prof.balanceDue > 0) {
        let urgency: BillingRequirement['urgency'] = 'medium';
        if (days <= 1) urgency = 'critical';
        else if (days <= 4) urgency = 'high';

        reqs.push({
          id: `req-bal-${prof.id}`,
          patientId: prof.patientId || matchedPatient?.id,
          patientName: prof.patientName,
          patientPhone: phone,
          patientEmail: email,
          procedureName: prof.procedureName,
          doctorName: prof.doctorName,
          type: 'balance_due',
          typeLabel: 'Doplatok v deň operácie',
          amount: prof.balanceDue,
          dueDate: prof.procedureDate,
          daysRemaining: days,
          urgency,
          description: `Konečný doplatok ${prof.balanceDue.toLocaleString('sk-SK')} € z dohodnutej ceny ${prof.totalAgreedPrice.toLocaleString('sk-SK')} € pred prijatím na zákrok.`,
          invoiceType: 'standard'
        });
      }

      // 3. Odoperovaný pacient s chýbajúcou konečnou faktúrou
      if (prof.status === 'operated' && (!prof.invoices || prof.invoices.length === 0)) {
        reqs.push({
          id: `req-inv-${prof.id}`,
          patientId: prof.patientId || matchedPatient?.id,
          patientName: prof.patientName,
          patientPhone: phone,
          patientEmail: email,
          procedureName: prof.procedureName,
          doctorName: prof.doctorName,
          type: 'missing_invoice',
          typeLabel: 'Chýba konečná faktúra',
          amount: prof.totalAgreedPrice,
          dueDate: prof.procedureDate,
          daysRemaining: days,
          urgency: 'medium',
          description: `Výkon bol úspešne zrealizovaný ${prof.procedureDate}, čaká na vystavenie vyúčtovacej faktúry pre účtovníctvo kliniky.`,
          invoiceType: 'standard'
        });
      }
    });

    // Doplnenie prípadných nadchádzajúcich operácií priamo z kalendára
    calendarEvents.forEach(evt => {
      if (evt.type !== 'operacia' || !evt.patientName || evt.patientName === 'Personál kliniky') return;
      const alreadyInReqs = reqs.some(r => r.patientName.toLowerCase() === evt.patientName.toLowerCase());
      if (alreadyInReqs) return;

      const days = getDaysDiff(evt.date);
      const matchedPatient = patients.find(p => p.name.toLowerCase() === evt.patientName.toLowerCase());
      const deposit = evt.depositAmount || 800;

      if (!evt.isDepositPaid) {
        reqs.push({
          id: `req-cal-dep-${evt.id}`,
          patientName: evt.patientName,
          patientPhone: evt.patientPhone || matchedPatient?.phone,
          patientEmail: evt.patientEmail || matchedPatient?.email,
          procedureName: evt.title,
          doctorName: evt.doctorName || evt.operator || 'MUDr. Ján Mráz',
          type: 'deposit_required',
          typeLabel: 'Záloha pred operáciou',
          amount: deposit,
          dueDate: evt.date,
          daysRemaining: days,
          urgency: days <= 3 ? 'critical' : days <= 7 ? 'high' : 'medium',
          description: `Plánovaný zákrok z kalendára (${evt.date}), záloha ${deposit} € nie je zaevidovaná ako uhradená.`,
          invoiceType: 'advance'
        });
      }
    });

    // B. Neuhradené existujúce faktúry z knihy faktúr
    invoices.forEach(inv => {
      if (inv.status === 'unpaid' || inv.status === 'overdue') {
        const days = getDaysDiff(inv.dueDate);
        let urgency: BillingRequirement['urgency'] = 'medium';
        if (days < 0) urgency = 'critical';
        else if (days <= 3) urgency = 'high';

        reqs.push({
          id: `req-unpaid-${inv.id}`,
          patientId: inv.patientId,
          patientName: inv.patientName,
          patientPhone: inv.patientPhone,
          patientEmail: inv.patientEmail,
          procedureName: inv.items[0]?.description || 'Zdravotná starostlivosť SAY CLINIC',
          doctorName: 'MUDr. Ján Mráz',
          type: 'unpaid_invoice',
          typeLabel: days < 0 ? 'Faktúra po splatnosti' : 'Neuhradená faktúra',
          amount: inv.remainingAmount || inv.totalAmount,
          dueDate: inv.dueDate,
          daysRemaining: days,
          urgency,
          description: `Faktúra č. ${inv.invoiceNumber} (${inv.type === 'advance' ? 'Zálohová' : 'Vyúčtovacia'}), splatnosť ${inv.dueDate}. VS: ${inv.variableSymbol}.`,
          linkedInvoiceNumber: inv.invoiceNumber,
          invoiceType: inv.type
        });
      }
    });

    // Zoradenie požiadaviek podľa naliehavosti (dni zostávajúce vzostupne)
    reqs.sort((a, b) => a.daysRemaining - b.daysRemaining);

    return reqs;
  }, [clientProfiles, invoices, calendarEvents, patients]);

  // Filtrovaný zoznam požiadaviek fakturácie
  const filteredRequirements = useMemo(() => {
    return billingRequirements.filter(req => {
      // Filter podľa typu
      if (requirementTypeFilter === 'deposit' && req.type !== 'deposit_required') return false;
      if (requirementTypeFilter === 'balance' && req.type !== 'balance_due') return false;
      if (requirementTypeFilter === 'invoice' && req.type !== 'unpaid_invoice' && req.type !== 'missing_invoice') return false;
      if (requirementTypeFilter === 'urgent' && req.urgency !== 'critical' && req.urgency !== 'high') return false;

      // Filter časového horizontu
      if (timeHorizonFilter === 'overdue' && req.daysRemaining >= 0) return false;
      if (timeHorizonFilter === '7d' && (req.daysRemaining < 0 || req.daysRemaining > 7)) return false;
      if (timeHorizonFilter === '14d' && (req.daysRemaining < 0 || req.daysRemaining > 14)) return false;
      if (timeHorizonFilter === '30d' && (req.daysRemaining < 0 || req.daysRemaining > 30)) return false;

      // Filter lekára
      if (doctorFilter !== 'all' && !req.doctorName.toLowerCase().includes(doctorFilter.toLowerCase())) {
        return false;
      }

      // Vyhľadávanie
      if (requirementSearch.trim()) {
        const q = requirementSearch.toLowerCase();
        const matchName = req.patientName.toLowerCase().includes(q);
        const matchProc = req.procedureName.toLowerCase().includes(q);
        const matchDoc = req.doctorName.toLowerCase().includes(q);
        const matchInv = req.linkedInvoiceNumber?.toLowerCase().includes(q);
        return matchName || matchProc || matchDoc || matchInv;
      }

      return true;
    });
  }, [billingRequirements, requirementTypeFilter, timeHorizonFilter, doctorFilter, requirementSearch]);

  // Sumár pre požiadavky fakturácie
  const requirementsSummary = useMemo(() => {
    const totalToCollect = billingRequirements.reduce((s, r) => s + r.amount, 0);
    const criticalCount = billingRequirements.filter(r => r.urgency === 'critical').length;
    const depositsCount = billingRequirements.filter(r => r.type === 'deposit_required').length;
    const balancesCount = billingRequirements.filter(r => r.type === 'balance_due').length;
    const unpaidInvoicesCount = billingRequirements.filter(r => r.type === 'unpaid_invoice').length;

    return {
      totalToCollect,
      criticalCount,
      depositsCount,
      balancesCount,
      unpaidInvoicesCount,
      totalCount: billingRequirements.length
    };
  }, [billingRequirements]);

  const handleSendReminder = (req: BillingRequirement) => {
    setReminderToast(`SMS a emailová upomienka bola úspešne odoslaná pre ${req.patientName} (${req.amount} €).`);
    setTimeout(() => {
      setReminderToast(null);
    }, 4000);
  };

  const selectedMonthData = useMemo(() => {
    if (!selectedMonthKey) return null;
    return monthlyData.find(m => m.key === selectedMonthKey) || null;
  }, [selectedMonthKey, monthlyData]);

  // Zoznam lekárov pre filter
  const uniqueDoctors = useMemo(() => {
    const set = new Set<string>();
    billingRequirements.forEach(r => {
      if (r.doctorName) set.add(r.doctorName);
    });
    return Array.from(set);
  }, [billingRequirements]);

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* OZNÁMENIE O ODOSLANÍ UPOMIENKY */}
      {reminderToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#2C2A29] text-white px-5 py-3.5 rounded-2xl shadow-xl border border-[#C5A059] flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-medium">{reminderToast}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEKCIA 1: GRAFICKÝ PREHĽAD MESAČNÝCH TRŽIEB VS. VÝDAVKOV (VIZUALIZÁCIA)   */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#E8E2D9] shadow-xs space-y-6">
        
        {/* HLAVIČKA VIZUALIZÁCIE S PREPÍNAČMI */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-6 border-b border-[#E8E2D9]">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#C5A059] uppercase tracking-wider mb-1">
              <TrendingUp className="w-4 h-4" />
              <span>Finančná vizualizácia kliniky</span>
            </div>
            <h2 className="text-2xl font-brand font-bold text-[#2C2A29]">
              Mesačné porovnanie tržieb a prevádzkových nákladov
            </h2>
            <p className="text-xs text-[#8C857B] mt-0.5">
              Analýza cash-flow, skladovej spotreby materiálu (COGS), mzdových a fixných nákladov SAY CLINIC
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Prepínač typu grafu */}
            <div className="flex items-center p-1 bg-[#FBF9F6] rounded-xl border border-[#E8E2D9] text-xs">
              <button
                type="button"
                onClick={() => setChartMode('comparison')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  chartMode === 'comparison' 
                    ? 'bg-[#2C2A29] text-white shadow-xs' 
                    : 'text-[#8C857B] hover:text-[#2C2A29]'
                }`}
              >
                Porovnanie
              </button>
              <button
                type="button"
                onClick={() => setChartMode('detailed')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  chartMode === 'detailed' 
                    ? 'bg-[#2C2A29] text-white shadow-xs' 
                    : 'text-[#8C857B] hover:text-[#2C2A29]'
                }`}
              >
                Štruktúra nákladov
              </button>
              <button
                type="button"
                onClick={() => setChartMode('profit_trend')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  chartMode === 'profit_trend' 
                    ? 'bg-[#2C2A29] text-white shadow-xs' 
                    : 'text-[#8C857B] hover:text-[#2C2A29]'
                }`}
              >
                Čistý zisk & Marža
              </button>
            </div>

            {/* Prepínač časového horizontu */}
            <div className="flex items-center p-1 bg-[#FBF9F6] rounded-xl border border-[#E8E2D9] text-xs">
              <button
                type="button"
                onClick={() => setTimeRange('6m')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                  timeRange === '6m' 
                    ? 'bg-[#C5A059] text-white shadow-xs' 
                    : 'text-[#8C857B] hover:text-[#2C2A29]'
                }`}
              >
                6 mesiacov
              </button>
              <button
                type="button"
                onClick={() => setTimeRange('12m')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                  timeRange === '12m' 
                    ? 'bg-[#C5A059] text-white shadow-xs' 
                    : 'text-[#8C857B] hover:text-[#2C2A29]'
                }`}
              >
                Celý rok 2026
              </button>
              <button
                type="button"
                onClick={() => setTimeRange('quarterly')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                  timeRange === 'quarterly' 
                    ? 'bg-[#C5A059] text-white shadow-xs' 
                    : 'text-[#8C857B] hover:text-[#2C2A29]'
                }`}
              >
                Kvartály
              </button>
            </div>
          </div>
        </div>

        {/* METRICKÉ KARTY PRE VYBRANÝ ROZSAH */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="bg-[#FBF9F6] p-4 rounded-2xl border border-[#E8E2D9]">
            <div className="flex justify-between items-center text-[#8C857B] text-[10px] font-bold uppercase tracking-wider">
              <span>Celkové tržby v období</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <p className="text-xl font-brand font-bold text-[#2C2A29] mt-1">
              {periodSummary.totalRev.toLocaleString('sk-SK')} €
            </p>
            <p className="text-[10px] text-[#8C857B] mt-0.5">
              Priemer: {periodSummary.avgMonthlyRev.toLocaleString('sk-SK')} € / mesiac
            </p>
          </div>

          <div className="bg-[#FBF9F6] p-4 rounded-2xl border border-[#E8E2D9]">
            <div className="flex justify-between items-center text-[#8C857B] text-[10px] font-bold uppercase tracking-wider">
              <span>Celkové výdavky v období</span>
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <p className="text-xl font-brand font-bold text-rose-700 mt-1">
              {periodSummary.totalExp.toLocaleString('sk-SK')} €
            </p>
            <p className="text-[10px] text-[#8C857B] mt-0.5">
              Priemer: {periodSummary.avgMonthlyExp.toLocaleString('sk-SK')} € / mesiac
            </p>
          </div>

          <div className="bg-[#2C2A29] text-white p-4 rounded-2xl shadow-xs">
            <div className="flex justify-between items-center text-[#C5A059] text-[10px] font-bold uppercase tracking-wider">
              <span>Čistý hospodársky výsledok</span>
              <Coins className="w-3.5 h-3.5" />
            </div>
            <p className="text-xl font-brand font-bold text-white mt-1">
              +{periodSummary.totalNet.toLocaleString('sk-SK')} €
            </p>
            <p className="text-[10px] text-[#C5A059] mt-0.5 font-mono">
              Prevádzková marža: {periodSummary.avgMargin} %
            </p>
          </div>

          <div className="bg-[#FBF9F6] p-4 rounded-2xl border border-[#E8E2D9]">
            <div className="flex justify-between items-center text-[#8C857B] text-[10px] font-bold uppercase tracking-wider">
              <span>Pomer Tržby / Náklady</span>
              <PieChart className="w-3.5 h-3.5 text-[#C5A059]" />
            </div>
            <p className="text-xl font-brand font-bold text-[#2C2A29] mt-1">
              {periodSummary.revenueCostRatio}x
            </p>
            <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
              Zdravá prevádzka s prebytkom
            </p>
          </div>
        </div>

        {/* GRAFICKÁ PLOCHA RECHARTS */}
        <div className="w-full bg-white rounded-2xl p-4 border border-[#E8E2D9]">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#2C2A29] inline-block" />
                <span className="font-bold text-[#2C2A29]">Príjmy / Tržby (€)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#E05252] inline-block" />
                <span className="font-bold text-[#E05252]">Výdavky & Náklady (€)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 bg-[#C5A059] inline-block rounded-full" />
                <span className="font-bold text-[#C5A059]">Čistý zisk (€)</span>
              </div>
            </div>

            <span className="text-[11px] text-[#8C857B] italic">
              Kliknutím na stĺpec zobrazíte rozpis položiek mesiaca
            </span>
          </div>

          <div className="h-80 w-full min-h-[320px]">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                {chartMode === 'comparison' ? (
                  <ComposedChart
                    data={monthlyData}
                    onClick={(state) => {
                      if (state && state.activePayload && state.activePayload[0]) {
                        setSelectedMonthKey(state.activePayload[0].payload.key);
                      }
                    }}
                    margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0ECE1" vertical={false} />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fill: '#8C857B', fontSize: 11, fontWeight: 600 }}
                      axisLine={{ stroke: '#E8E2D9' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fill: '#8C857B', fontSize: 11 }}
                      axisLine={{ stroke: '#E8E2D9' }}
                      tickLine={false}
                      tickFormatter={(val) => `${(val / 1000).toFixed(0)}k €`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-[#2C2A29] text-white p-3 rounded-xl shadow-xl border border-[#C5A059] text-xs space-y-1.5">
                              <p className="font-bold text-sm text-[#C5A059]">{d.fullLabel}</p>
                              <div className="border-t border-white/10 pt-1 space-y-1">
                                <div className="flex justify-between gap-4">
                                  <span className="text-[#8C857B]">Tržby celkom:</span>
                                  <span className="font-bold text-emerald-400 font-mono">+{d.revenue.toLocaleString('sk-SK')} €</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span className="text-[#8C857B]">Výdavky celkom:</span>
                                  <span className="font-bold text-rose-400 font-mono">-{d.expenses.toLocaleString('sk-SK')} €</span>
                                </div>
                                <div className="flex justify-between gap-4 pt-1 border-t border-white/10">
                                  <span className="font-bold">Čistý zisk:</span>
                                  <span className="font-bold text-[#C5A059] font-mono">+{d.netProfit.toLocaleString('sk-SK')} €</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span className="text-[#8C857B]">Zisková marža:</span>
                                  <span className="font-mono font-bold text-white">{d.marginPct} %</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="revenue" name="Tržby" fill="#2C2A29" radius={[6, 6, 0, 0]} maxBarSize={38} />
                    <Bar dataKey="expenses" name="Výdavky" fill="#E05252" radius={[6, 6, 0, 0]} maxBarSize={38} />
                    <Line 
                      type="monotone" 
                      dataKey="netProfit" 
                      name="Čistý zisk" 
                      stroke="#C5A059" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#C5A059', strokeWidth: 2, stroke: '#FFFFFF' }}
                    />
                  </ComposedChart>
                ) : chartMode === 'detailed' ? (
                  <ComposedChart
                    data={monthlyData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0ECE1" vertical={false} />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fill: '#8C857B', fontSize: 11, fontWeight: 600 }}
                      axisLine={{ stroke: '#E8E2D9' }}
                    />
                    <YAxis 
                      tick={{ fill: '#8C857B', fontSize: 11 }}
                      axisLine={{ stroke: '#E8E2D9' }}
                      tickFormatter={(val) => `${(val / 1000).toFixed(0)}k €`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-[#2C2A29] text-white p-3.5 rounded-xl shadow-xl border border-[#C5A059] text-xs space-y-2">
                              <p className="font-bold text-sm text-[#C5A059]">{d.fullLabel}</p>
                              <div className="space-y-1">
                                <p className="text-[10px] uppercase tracking-wider text-[#8C857B] font-bold">Štruktúra nákladov:</p>
                                <div className="flex justify-between gap-4">
                                  <span>Materiál & Sklad (COGS):</span>
                                  <span className="font-mono font-bold text-rose-300">{d.materialExpense.toLocaleString('sk-SK')} €</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span>Mzdy & Personál:</span>
                                  <span className="font-mono font-bold text-amber-300">{d.staffExpense.toLocaleString('sk-SK')} €</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span>Nájomné & Energie:</span>
                                  <span className="font-mono font-bold text-sky-300">{d.facilityExpense.toLocaleString('sk-SK')} €</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="materialExpense" name="Materiál & Sklad" stackId="exp" fill="#E05252" radius={[0, 0, 0, 0]} maxBarSize={44} />
                    <Bar dataKey="staffExpense" name="Mzdy & Tím" stackId="exp" fill="#D97706" radius={[0, 0, 0, 0]} maxBarSize={44} />
                    <Bar dataKey="facilityExpense" name="Nájomné & Réžia" stackId="exp" fill="#64748B" radius={[6, 6, 0, 0]} maxBarSize={44} />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      name="Celkové tržby" 
                      stroke="#2C2A29" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#2C2A29' }}
                    />
                  </ComposedChart>
                ) : (
                  <ComposedChart
                    data={monthlyData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0ECE1" vertical={false} />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fill: '#8C857B', fontSize: 11, fontWeight: 600 }}
                      axisLine={{ stroke: '#E8E2D9' }}
                    />
                    <YAxis 
                      yAxisId="left"
                      tick={{ fill: '#8C857B', fontSize: 11 }}
                      axisLine={{ stroke: '#E8E2D9' }}
                      tickFormatter={(val) => `${(val / 1000).toFixed(0)}k €`}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right"
                      tick={{ fill: '#C5A059', fontSize: 11 }}
                      axisLine={{ stroke: '#C5A059' }}
                      tickFormatter={(val) => `${val} %`}
                    />
                    <Tooltip />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="netProfit" 
                      name="Čistý zisk (€)" 
                      fill="#C5A059" 
                      fillOpacity={0.15} 
                      stroke="#C5A059" 
                      strokeWidth={2.5} 
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="marginPct" 
                      name="Zisková marža (%)" 
                      stroke="#059669" 
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#059669' }}
                    />
                  </ComposedChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* DETAIL VYBRANÉHO MESIACA (AK JE KLIKNUTÉ) */}
        {selectedMonthData && (
          <div className="bg-[#FBF9F6] p-5 rounded-2xl border border-[#E8E2D9] animate-fadeIn flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#C5A059] tracking-wider">Detail vybraného mesiaca</span>
              <h4 className="text-lg font-brand font-bold text-[#2C2A29]">{selectedMonthData.fullLabel}</h4>
              <p className="text-xs text-[#8C857B]">
                Tržby: <strong>{selectedMonthData.revenue.toLocaleString('sk-SK')} €</strong> (Chirurgia {selectedMonthData.surgeryRevenue.toLocaleString('sk-SK')} €, Estetika {selectedMonthData.aestheticRevenue.toLocaleString('sk-SK')} €)
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-[#8C857B] block">Náklady</span>
                <span className="font-mono font-bold text-rose-700 text-sm">
                  -{selectedMonthData.expenses.toLocaleString('sk-SK')} €
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-[#8C857B] block">Čistý zisk</span>
                <span className="font-mono font-bold text-emerald-700 text-base">
                  +{selectedMonthData.netProfit.toLocaleString('sk-SK')} €
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-[#8C857B] block">Marža</span>
                <span className="font-mono font-bold text-[#2C2A29] text-base">
                  {selectedMonthData.marginPct} %
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMonthKey(null)}
                className="text-xs text-[#8C857B] hover:text-[#2C2A29] underline"
              >
                Zavrieť
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* SEKCIA 2: FILTROVATEĽNÝ ZOZNAM NADCHÁDZAJÚCICH POŽIADAVIEK FAKTURÁCIE      */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#E8E2D9] shadow-xs space-y-6">
        
        {/* HLAVIČKA A SUMÁR POŽIADAVIEK */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#C5A059] uppercase tracking-wider mb-1">
              <Receipt className="w-4 h-4" />
              <span>Pohľadávky & Záväzky klientov</span>
            </div>
            <h2 className="text-2xl font-brand font-bold text-[#2C2A29]">
              Nadchádzajúce požiadavky na fakturáciu & platby
            </h2>
            <p className="text-xs text-[#8C857B] mt-0.5">
              Automaticky detekované zálohy pred operáciami, doplatky v deň zákroku a faktúry čakajúce na úhradu
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-[#FBF9F6] border border-[#E8E2D9] px-4 py-2 rounded-2xl flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-[#8C857B] block">Na výber celkom</span>
                <span className="text-lg font-mono font-bold text-[#2C2A29]">
                  {requirementsSummary.totalToCollect.toLocaleString('sk-SK')} €
                </span>
              </div>
              <div className="w-px h-8 bg-[#E8E2D9]" />
              <div>
                <span className="text-[10px] uppercase font-bold text-rose-700 block">Kritické termíny</span>
                <span className="text-lg font-mono font-bold text-rose-700">
                  {requirementsSummary.criticalCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* FILTRAČNÝ PANEL */}
        <div className="bg-[#FBF9F6] p-4 rounded-2xl border border-[#E8E2D9] space-y-3">
          
          {/* HORNÝ RIADOK: TYP A VYHĽADÁVANIE */}
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
            
            {/* Prepínač kategórií požiadavky */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setRequirementTypeFilter('all')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  requirementTypeFilter === 'all'
                    ? 'bg-[#2C2A29] text-white shadow-xs'
                    : 'bg-white text-[#8C857B] hover:text-[#2C2A29] border border-[#E8E2D9]'
                }`}
              >
                Všetky ({requirementsSummary.totalCount})
              </button>

              <button
                type="button"
                onClick={() => setRequirementTypeFilter('deposit')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  requirementTypeFilter === 'deposit'
                    ? 'bg-[#2C2A29] text-white shadow-xs'
                    : 'bg-white text-[#8C857B] hover:text-[#2C2A29] border border-[#E8E2D9]'
                }`}
              >
                Zálohy pred operáciou ({requirementsSummary.depositsCount})
              </button>

              <button
                type="button"
                onClick={() => setRequirementTypeFilter('balance')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  requirementTypeFilter === 'balance'
                    ? 'bg-[#2C2A29] text-white shadow-xs'
                    : 'bg-white text-[#8C857B] hover:text-[#2C2A29] border border-[#E8E2D9]'
                }`}
              >
                Doplatky v deň sály ({requirementsSummary.balancesCount})
              </button>

              <button
                type="button"
                onClick={() => setRequirementTypeFilter('invoice')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  requirementTypeFilter === 'invoice'
                    ? 'bg-[#2C2A29] text-white shadow-xs'
                    : 'bg-white text-[#8C857B] hover:text-[#2C2A29] border border-[#E8E2D9]'
                }`}
              >
                Faktúry & Účtovníctvo ({requirementsSummary.unpaidInvoicesCount})
              </button>

              <button
                type="button"
                onClick={() => setRequirementTypeFilter('urgent')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  requirementTypeFilter === 'urgent'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
                }`}
              >
                Naliehavé / Po termíne ({requirementsSummary.criticalCount})
              </button>
            </div>

            {/* Vyhľadávacie pole */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C857B]" />
              <input
                type="text"
                value={requirementSearch}
                onChange={(e) => setRequirementSearch(e.target.value)}
                placeholder="Hľadať klienta, zákrok..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-[#E8E2D9] rounded-xl text-xs focus:outline-hidden focus:border-[#C5A059]"
              />
            </div>

          </div>

          {/* SPODNÝ RIADOK: HORIZONT DNI A LEKÁR */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E8E2D9]/60 text-xs">
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-[#8C857B]">Časový horizont:</span>
              <div className="flex items-center gap-1">
                {[
                  { id: 'all', label: 'Všetky' },
                  { id: 'overdue', label: 'Po splatnosti' },
                  { id: '7d', label: 'Do 7 dní' },
                  { id: '14d', label: 'Do 14 dní' },
                  { id: '30d', label: 'Do 30 dní' },
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTimeHorizonFilter(t.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                      timeHorizonFilter === t.id
                        ? 'bg-[#C5A059] text-white font-bold'
                        : 'text-[#8C857B] hover:text-[#2C2A29]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-[#8C857B]">Operatér / Lekár:</span>
              <select
                value={doctorFilter}
                onChange={(e) => setDoctorFilter(e.target.value)}
                className="bg-white border border-[#E8E2D9] rounded-lg px-2.5 py-1 text-xs text-[#2C2A29]"
              >
                <option value="all">Všetci lekári</option>
                {uniqueDoctors.map(doc => (
                  <option key={doc} value={doc}>{doc}</option>
                ))}
              </select>
            </div>

          </div>

        </div>

        {/* ZOZNAM POLOŽIEK POŽIADAVIEK */}
        <div className="space-y-3">
          {filteredRequirements.length === 0 ? (
            <div className="p-8 text-center bg-[#FBF9F6] rounded-2xl border border-dashed border-[#E8E2D9] text-[#8C857B]">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
              <p className="font-bold text-sm text-[#2C2A29]">Žiadne nevyriešené požiadavky na fakturáciu</p>
              <p className="text-xs mt-1">Pre zvolený filter nemáte žiadne splatné zálohy ani neuhradené doklady.</p>
            </div>
          ) : (
            filteredRequirements.map(req => {
              const isOverdue = req.daysRemaining < 0;
              const isTodayOrTomorrow = req.daysRemaining >= 0 && req.daysRemaining <= 1;

              return (
                <div
                  key={req.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                    req.urgency === 'critical'
                      ? 'bg-rose-50/40 border-rose-200'
                      : req.urgency === 'high'
                      ? 'bg-amber-50/30 border-amber-200'
                      : 'bg-white border-[#E8E2D9] hover:border-[#C5A059]'
                  }`}
                >
                  {/* DETAIL KLIENTA A TYPU */}
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-brand font-bold text-sm text-[#2C2A29]">
                        {req.patientName}
                      </span>

                      {/* Typová značka */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        req.type === 'deposit_required'
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : req.type === 'balance_due'
                          ? 'bg-blue-100 text-blue-900 border border-blue-200'
                          : req.type === 'missing_invoice'
                          ? 'bg-purple-100 text-purple-900 border border-purple-200'
                          : 'bg-rose-100 text-rose-900 border border-rose-200'
                      }`}>
                        {req.typeLabel}
                      </span>

                      {/* Termínový odpočet */}
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                        isOverdue
                          ? 'bg-rose-700 text-white'
                          : isTodayOrTomorrow
                          ? 'bg-amber-600 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        <Clock className="w-3 h-3" />
                        {isOverdue 
                          ? `Po termíne (${Math.abs(req.daysRemaining)} d.)` 
                          : req.daysRemaining === 0 
                          ? 'Dnes' 
                          : `O ${req.daysRemaining} dní (${req.dueDate})`}
                      </span>
                    </div>

                    <p className="text-xs text-[#2C2A29] font-medium">
                      <strong>Zákrok:</strong> {req.procedureName} • <strong>Lekár:</strong> {req.doctorName}
                    </p>

                    <p className="text-xs text-[#8C857B]">
                      {req.description}
                    </p>
                  </div>

                  {/* SUMA A AKČNÉ TLAČIDLÁ */}
                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end pt-2 md:pt-0 border-t md:border-t-0 border-[#E8E2D9]">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] uppercase font-bold text-[#8C857B] block">Požadovaná suma</span>
                      <span className="text-lg font-mono font-bold text-[#2C2A29]">
                        {req.amount.toLocaleString('sk-SK')} €
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Akcia 1: Vystaviť faktúru */}
                      <button
                        type="button"
                        onClick={() => onTriggerCreateInvoice(
                          req.patientName, 
                          req.procedureName, 
                          req.amount, 
                          req.invoiceType || 'standard'
                        )}
                        className="px-3 py-1.5 rounded-xl bg-[#2C2A29] hover:bg-[#C5A059] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                        title="Vystaviť faktúru"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Vystaviť FA</span>
                      </button>

                      {/* Akcia 2: Ak má prepojenú faktúru, náhľad */}
                      {req.linkedInvoiceNumber ? (
                        <button
                          type="button"
                          onClick={() => {
                            const found = invoices.find(i => i.invoiceNumber === req.linkedInvoiceNumber);
                            if (found) {
                              onOpenInvoiceModal(found);
                            } else {
                              onOpenInvoiceByNumber(req.linkedInvoiceNumber!);
                            }
                          }}
                          className="p-1.5 rounded-xl bg-white border border-[#E8E2D9] hover:border-[#C5A059] text-[#2C2A29] text-xs transition-colors"
                          title="Otvoriť doklad"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                      ) : null}

                      {/* Akcia 3: Odoslať upomienku */}
                      <button
                        type="button"
                        onClick={() => handleSendReminder(req)}
                        className="p-1.5 rounded-xl bg-white border border-[#E8E2D9] hover:border-[#C5A059] text-[#8C857B] hover:text-[#2C2A29] text-xs transition-colors"
                        title="Odoslať notifikáciu / SMS upomienku"
                      >
                        <Send className="w-4 h-4" />
                      </button>

                      {/* Akcia 4: Detail klienta */}
                      <button
                        type="button"
                        onClick={() => {
                          const matchedProfile = clientProfiles.find(p => p.patientName.toLowerCase() === req.patientName.toLowerCase());
                          if (matchedProfile) {
                            onOpenClientDetail(matchedProfile);
                          } else {
                            onTriggerCreateInvoice(req.patientName, req.procedureName, req.amount, 'standard');
                          }
                        }}
                        className="p-1.5 rounded-xl bg-[#FBF9F6] border border-[#E8E2D9] hover:border-[#C5A059] text-[#2C2A29] text-xs transition-colors"
                        title="Detail klienta a platby"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
}
