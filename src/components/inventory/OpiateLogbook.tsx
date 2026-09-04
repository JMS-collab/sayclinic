'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ShieldAlert, 
  Lock, 
  Plus, 
  Search, 
  Printer, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Download, 
  FileText, 
  X,
  ArrowDownRight,
  ArrowUpRight,
  Info
} from 'lucide-react';
import { 
  InventoryService, 
  OpiateItem, 
  OpiateLogEntry, 
  OpiateMovementType 
} from '../../services/inventoryService';

interface PatientOption {
  id: string;
  name: string;
  birthNumber: string;
}

export default function OpiateLogbook() {
  const [opiates, setOpiates] = useState<OpiateItem[]>([]);
  const [logs, setLogs] = useState<OpiateLogEntry[]>([]);
  const [patients, setPatients] = useState<PatientOption[]>([]);

  // Sub-záložka
  const [subTab, setSubTab] = useState<'kniha' | 'karty'>('kniha');

  // Filtre pre knihu
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOpiateFilter, setSelectedOpiateFilter] = useState<string>('all');
  const [selectedMovementFilter, setSelectedMovementFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Modaly
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isWasteModalOpen, setIsWasteModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState<OpiateLogEntry | null>(null);

  // Formulár: Podanie pacientovi
  const [usageOpiateId, setUsageOpiateId] = useState('');
  const [usagePatientMode, setUsagePatientMode] = useState<'select' | 'custom'>('select');
  const [usageSelectedPatientId, setUsageSelectedPatientId] = useState('');
  const [usagePatientName, setUsagePatientName] = useState('');
  const [usagePatientBirthNumber, setUsagePatientBirthNumber] = useState('');
  const [usageProcedure, setUsageProcedure] = useState('Augmentácia prsníkov v celkovej anestézii');
  const [usageDoctor, setUsageDoctor] = useState('MUDr. Ján Mráz');
  const [usageNurse, setUsageNurse] = useState('Bc. Simona Horváthová');
  const [usageWitness, setUsageWitness] = useState('PhDr. Veronika Vargová');
  const [usageQtyOut, setUsageQtyOut] = useState<number>(1);
  const [usageQtyWasted, setUsageQtyWasted] = useState<number>(0);
  const [usageNotes, setUsageNotes] = useState('');
  const [usageDate, setUsageDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [usageTime, setUsageTime] = useState(() => new Date().toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' }));

  // Formulár: Príjem novej dodávky
  const [receiptOpiateId, setReceiptOpiateId] = useState('');
  const [receiptDocNum, setReceiptDocNum] = useState('');
  const [receiptSupplier, setReceiptSupplier] = useState('Lekáreň Nemocnice s poliklinikou Banská Bystrica');
  const [receiptQtyIn, setReceiptQtyIn] = useState<number>(10);
  const [receiptLot, setReceiptLot] = useState('');
  const [receiptExp, setReceiptExp] = useState('');
  const [receiptPerson, setReceiptPerson] = useState('MUDr. Ján Mráz');
  const [receiptNotes, setReceiptNotes] = useState('Príjem na úradnú žiadanku OPL s modrým pruhom');

  // Formulár: Znehodnotenie
  const [wasteOpiateId, setWasteOpiateId] = useState('');
  const [wasteQtyUnits, setWasteQtyUnits] = useState<number>(1);
  const [wasteReason, setWasteReason] = useState('Rozbitá ampulka pri manipulácii');
  const [wasteDoctor, setWasteDoctor] = useState('MUDr. Ján Mráz');
  const [wasteNurse, setWasteNurse] = useState('Bc. Simona Horváthová');
  const [wasteWitness, setWasteWitness] = useState('PhDr. Veronika Vargová');
  const [wasteNotes, setWasteNotes] = useState('Zlikvidované a protokolárne znehodnotené v prítomnosti svedka.');

  // Formulár: Fyzická inventúra
  const [invDoctor, setInvDoctor] = useState('MUDr. Ján Mráz');
  const [invNurse, setInvNurse] = useState('Bc. Simona Horváthová');
  const [invNotes, setInvNotes] = useState('Pravidelná mesačná kontrola trezoru OPL. Fyzické stavy ampuliek a šarží plne súhlasia.');

  // Notifikácia
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const printAreaRef = useRef<HTMLDivElement>(null);

  const showNotify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Načítanie dát
  const loadData = () => {
    const ops = InventoryService.getOpiates();
    const lgs = InventoryService.getOpiateLogs();
    setOpiates(ops);
    setLogs(lgs);

    if (ops.length > 0) {
      if (!usageOpiateId) setUsageOpiateId(ops[0].id);
      if (!receiptOpiateId) setReceiptOpiateId(ops[0].id);
      if (!wasteOpiateId) setWasteOpiateId(ops[0].id);
    }

    // Načítanie pacientov pre rýchly výber
    try {
      const savedPatients = localStorage.getItem('say_clinic_patients');
      if (savedPatients) {
        const parsed = JSON.parse(savedPatients);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPatients(parsed.map(p => ({ id: p.id, name: p.name, birthNumber: p.birthNumber || '' })));
          return;
        }
      }
    } catch {
      // fallback
    }
    setPatients([
      { id: 'P1', name: 'Mária Kováčová', birthNumber: '885512/6789' },
      { id: 'P2', name: 'Ján Novák', birthNumber: '750314/1234' },
      { id: 'P3', name: 'Lucia Horváthová', birthNumber: '925820/4321' }
    ]);
  };

  useEffect(() => {
    loadData();

    const handleOpiateChange = () => loadData();
    const handleLogChange = () => loadData();

    window.addEventListener('say_clinic_opiates_changed', handleOpiateChange);
    window.addEventListener('say_clinic_opiate_logs_changed', handleLogChange);

    return () => {
      window.removeEventListener('say_clinic_opiates_changed', handleOpiateChange);
      window.removeEventListener('say_clinic_opiate_logs_changed', handleLogChange);
    };
  }, []);

  // Metriky trezoru
  const stats = useMemo(() => {
    const totalTypes = opiates.length;
    const totalUnitsInSafe = opiates.reduce((acc, o) => acc + o.currentStock, 0);
    const lowStockCount = opiates.filter(o => o.currentStock <= o.minStock).length;
    
    // Záznamy v tomto mesiaci
    const currentMonth = new Date().toISOString().substring(0, 7);
    const thisMonthLogs = logs.filter(l => l.date && l.date.startsWith(currentMonth));
    const thisMonthAdministrations = thisMonthLogs.filter(l => l.movementType === 'podanie').length;

    // Posledná kontrola
    const lastAudit = logs.find(l => l.movementType === 'inventura');

    return {
      totalTypes,
      totalUnitsInSafe,
      lowStockCount,
      thisMonthAdministrations,
      lastAuditDate: lastAudit ? `${lastAudit.date} ${lastAudit.time}` : '01.09.2026'
    };
  }, [opiates, logs]);

  // Filtrované záznamy knihy
  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const matchSearch = 
        l.opiateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.patientName && l.patientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (l.patientBirthNumber && l.patientBirthNumber.includes(searchTerm)) ||
        (l.procedureName && l.procedureName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (l.lotNumber && l.lotNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (l.prescribingDoctor && l.prescribingDoctor.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (l.administeringNurse && l.administeringNurse.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (l.deliveryNoteNumber && l.deliveryNoteNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (l.notes && l.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchOpiate = selectedOpiateFilter === 'all' || l.opiateId === selectedOpiateFilter;
      const matchMovement = selectedMovementFilter === 'all' || l.movementType === selectedMovementFilter;
      const matchDate = !dateFilter || l.date === dateFilter;

      return matchSearch && matchOpiate && matchMovement && matchDate;
    });
  }, [logs, searchTerm, selectedOpiateFilter, selectedMovementFilter, dateFilter]);

  // Handler: Podanie pacientovi
  const handleSubmitUsage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usageOpiateId) {
      showNotify('error', 'Vyberte liečivo z trezoru.');
      return;
    }

    let pName = usagePatientName.trim();
    let pBirth = usagePatientBirthNumber.trim();

    if (usagePatientMode === 'select') {
      const p = patients.find(pat => pat.id === usageSelectedPatientId);
      if (p) {
        pName = p.name;
        pBirth = p.birthNumber;
      }
    }

    if (!pName) {
      showNotify('error', 'Zadajte alebo vyberte pacienta, ktorému bol opiát podaný.');
      return;
    }

    const res = InventoryService.recordOpiateUsage({
      opiateId: usageOpiateId,
      patientName: pName,
      patientBirthNumber: pBirth,
      procedureName: usageProcedure,
      prescribingDoctor: usageDoctor,
      administeringNurse: usageNurse,
      witness: usageWitness || undefined,
      quantityOut: Number(usageQtyOut) || 1,
      quantityWasted: Number(usageQtyWasted) > 0 ? Number(usageQtyWasted) : undefined,
      notes: usageNotes,
      recordedBy: usageNurse,
      date: usageDate,
      time: usageTime
    });

    if (res.success) {
      showNotify('success', `Zápis č. ${res.log?.entryNumber} úspešne zapísaný do Opiátovej knihy.`);
      setIsUsageModalOpen(false);
      setUsageNotes('');
      setUsageQtyWasted(0);
      loadData();
    } else {
      showNotify('error', res.error || 'Nastala chyba pri odpise.');
    }
  };

  // Handler: Príjem do trezoru
  const handleSubmitReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptOpiateId) return;

    if (!receiptDocNum.trim()) {
      showNotify('error', 'Zadajte číslo úradnej žiadanky s modrým pruhom alebo dodacieho listu.');
      return;
    }

    const res = InventoryService.recordOpiateReceipt({
      opiateId: receiptOpiateId,
      deliveryNoteNumber: receiptDocNum,
      supplier: receiptSupplier,
      quantityIn: Number(receiptQtyIn) || 1,
      lotNumber: receiptLot || undefined,
      expirationDate: receiptExp || undefined,
      notes: receiptNotes,
      recordedBy: receiptPerson
    });

    if (res.success) {
      showNotify('success', `Naskladnenie úspešne zaevidované do Opiátovej knihy (zápis č. ${res.log?.entryNumber}).`);
      setIsReceiptModalOpen(false);
      setReceiptDocNum('');
      loadData();
    } else {
      showNotify('error', res.error || 'Nastala chyba.');
    }
  };

  // Handler: Protokolárne znehodnotenie
  const handleSubmitWaste = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wasteOpiateId) return;
    if (!wasteWitness.trim()) {
      showNotify('error', 'Podľa zákona č. 139/1998 Z. z. je pri znehodnotení povinný podpis svedka!');
      return;
    }

    const res = InventoryService.recordOpiateWaste({
      opiateId: wasteOpiateId,
      quantityWastedUnits: Number(wasteQtyUnits) || 1,
      wasteReason: wasteReason,
      prescribingDoctor: wasteDoctor,
      administeringNurse: wasteNurse,
      witness: wasteWitness,
      notes: wasteNotes,
      recordedBy: wasteDoctor
    });

    if (res.success) {
      showNotify('success', `Protokol o znehodnotení OPL zapísaný (zápis č. ${res.log?.entryNumber}).`);
      setIsWasteModalOpen(false);
      loadData();
    } else {
      showNotify('error', res.error || 'Chyba pri znehodnotení.');
    }
  };

  // Handler: Fyzická inventúra
  const handleSubmitInventory = (e: React.FormEvent) => {
    e.preventDefault();
    InventoryService.recordOpiateInventoryCheck({
      doctorName: invDoctor,
      nurseName: invNurse,
      notes: invNotes
    });
    showNotify('success', 'Fyzická inventúra a kontrola trezoru bola úspešne zaznamenaná v knihe.');
    setIsInventoryModalOpen(false);
    loadData();
  };

  // Handler: Zmazanie záznamu
  const handleConfirmDeleteLog = () => {
    if (!logToDelete) return;
    InventoryService.deleteOpiateLog(logToDelete.id);
    showNotify('success', `Záznam č. ${logToDelete.entryNumber} bol odstránený.`);
    setIsDeleteConfirmOpen(false);
    setLogToDelete(null);
    loadData();
  };

  // Export do CSV
  const handleExportCSV = () => {
    const headers = [
      'Poradove cislo',
      'Datum',
      'Cas',
      'Liecivo',
      'Ucinna latka',
      'Sarza',
      'Pohyb',
      'Prijem (ks)',
      'Vydaj (ks)',
      'Znehodnotene (ml)',
      'Zostatok',
      'Pacient',
      'Rodne cislo',
      'Vykon / Indikacia',
      'Doklad / Ziadanka',
      'Lekar',
      'Sestra',
      'Svedok',
      'Poznamka'
    ];

    const rows = logs.map(l => [
      l.entryNumber,
      l.date,
      l.time,
      `"${l.opiateName.replace(/"/g, '""')}"`,
      `"${l.activeSubstance}"`,
      `"${l.lotNumber}"`,
      l.movementType,
      l.quantityIn,
      l.quantityOut,
      l.quantityWasted || 0,
      l.balanceAfter,
      `"${(l.patientName || '').replace(/"/g, '""')}"`,
      `"${l.patientBirthNumber || ''}"`,
      `"${(l.procedureName || '').replace(/"/g, '""')}"`,
      `"${(l.deliveryNoteNumber || '').replace(/"/g, '""')}"`,
      `"${(l.prescribingDoctor || '').replace(/"/g, '""')}"`,
      `"${(l.administeringNurse || '').replace(/"/g, '""')}"`,
      `"${(l.witness || '').replace(/"/g, '""')}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SAY_CLINIC_Opiatova_kniha_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Tlač
  const handlePrint = () => {
    window.print();
  };

  const getMovementBadge = (type: OpiateMovementType) => {
    switch (type) {
      case 'podanie':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold px-2 py-0.5 rounded-md">
            <ArrowDownRight className="w-3 h-3 text-amber-600" />
            Výdaj / Podanie
          </span>
        );
      case 'prijem':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded-md">
            <ArrowUpRight className="w-3 h-3 text-emerald-600" />
            Príjem (Žiadanka OPL)
          </span>
        );
      case 'znehodnotenie':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-semibold px-2 py-0.5 rounded-md">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            Znehodnotenie
          </span>
        );
      case 'inventura':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-semibold px-2 py-0.5 rounded-md">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            Fyzická inventúra
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* TOAST NOTIFIKÁCIA */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 ${
          notification.type === 'success' 
            ? 'bg-[#2C2A29] text-white border border-[#C5A059]' 
            : 'bg-rose-900 text-white border border-rose-500'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-[#C5A059]" /> : <AlertTriangle className="w-4 h-4 text-rose-300" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* HLAVIČKA A BEZPEČNOSTNÝ STATUS TREZORU */}
      <div className="bg-gradient-to-r from-[#2C2A29] via-[#3A3735] to-[#2C2A29] text-white p-6 rounded-2xl shadow-md border border-[#C5A059]/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#C5A059]/20 border border-[#C5A059]/40 text-[#C5A059]">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-brand text-xl font-bold tracking-wide uppercase">
                    Evidencia omamných a psychotropných látok
                  </h3>
                  <span className="bg-[#C5A059] text-[#2C2A29] text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Opiátová kniha OPL
                  </span>
                </div>
                <p className="text-xs text-[#E8E2D9]/80 mt-0.5">
                  Úradný register v zmysle zákona NR SR č. 139/1998 Z. z. a vyhlášok MZ SR • SAY CLINIC Operačná sála & Anestézia
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-xs">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-[10px] uppercase text-[#C5A059] font-bold block">Režim zabezpečenia</span>
              <span className="text-white font-medium">Trezor s dvojitým zámkom • Zodpovedný: MUDr. Ján Mráz</span>
            </div>
          </div>
        </div>

        {/* ŠTATISTICKÝ PREHĽAD TREZORU */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10 text-xs">
          <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10">
            <span className="text-[10px] uppercase tracking-wider text-[#C5A059] font-bold block">Druhy OPL v trezore</span>
            <span className="text-xl font-bold font-mono text-white">{stats.totalTypes} preparátov</span>
            <span className="text-[10px] text-[#E8E2D9]/70 block mt-0.5">Fentanyl, Sufentanil, Dipidolor...</span>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10">
            <span className="text-[10px] uppercase tracking-wider text-[#C5A059] font-bold block">Celkový fyzický stav</span>
            <span className="text-xl font-bold font-mono text-emerald-400">{stats.totalUnitsInSafe} ampuliek</span>
            <span className="text-[10px] text-[#E8E2D9]/70 block mt-0.5">Všetky šarže zabezpečené</span>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10">
            <span className="text-[10px] uppercase tracking-wider text-[#C5A059] font-bold block">Podania v tomto mesiaci</span>
            <span className="text-xl font-bold font-mono text-amber-300">{stats.thisMonthAdministrations} zákrokov</span>
            <span className="text-[10px] text-[#E8E2D9]/70 block mt-0.5">V celkovej anestézii / analgosedácii</span>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10">
            <span className="text-[10px] uppercase tracking-wider text-[#C5A059] font-bold block">Posledná fyzická kontrola</span>
            <span className="text-sm font-bold font-mono text-white mt-1 block">{stats.lastAuditDate}</span>
            <span className="text-[10px] text-emerald-400 block mt-0.5">✓ Fyzický stav overený</span>
          </div>
        </div>
      </div>

      {/* HLAVNÝ PANEL AKCIÍ & NAVIGÁCIE */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[#FAF8F5] p-4 rounded-2xl border border-[#E8E2D9]">
        {/* Prepínač záložiek */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-[#E8E2D9] text-xs font-semibold">
          <button
            type="button"
            onClick={() => setSubTab('kniha')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === 'kniha' 
                ? 'bg-[#2C2A29] text-white shadow-xs' 
                : 'text-[#8C857B] hover:text-[#2C2A29]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Úradná kniha zápisov ({logs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('karty')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === 'karty' 
                ? 'bg-[#2C2A29] text-white shadow-xs' 
                : 'text-[#8C857B] hover:text-[#2C2A29]'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Trezorové karty OPL ({opiates.length})</span>
          </button>
        </div>

        {/* Tlačidlá operácií s OPL */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsUsageModalOpen(true)}
            className="bg-[#C5A059] hover:bg-[#B38F48] text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Podanie pacientovi</span>
          </button>

          <button
            type="button"
            onClick={() => setIsReceiptModalOpen(true)}
            className="bg-white hover:bg-[#FAF8F5] text-[#2C2A29] border border-[#E8E2D9] px-3.5 py-2 rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
            <span>+ Príjem do trezoru</span>
          </button>

          <button
            type="button"
            onClick={() => setIsWasteModalOpen(true)}
            className="bg-white hover:bg-[#FAF8F5] text-[#2C2A29] border border-[#E8E2D9] px-3 py-2 rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>Znehodnotenie OPL</span>
          </button>

          <button
            type="button"
            onClick={() => setIsInventoryModalOpen(true)}
            className="bg-white hover:bg-[#FAF8F5] text-[#2C2A29] border border-[#E8E2D9] px-3 py-2 rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Mesačná inventúra</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="bg-[#2C2A29] hover:bg-black text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Úradná tlač / Export</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            title="Stiahnuť CSV register"
            className="p-2 bg-white hover:bg-[#FAF8F5] border border-[#E8E2D9] text-[#8C857B] hover:text-[#2C2A29] rounded-xl text-xs cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. ZOBRAZENIE: ÚRADNÁ KNIHA ZÁPISOV (TABUĽKA) */}
      {/* ========================================================================= */}
      {subTab === 'kniha' && (
        <div className="space-y-4">
          {/* FILTRAČNÝ PANEL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-3.5 rounded-xl border border-[#E8E2D9]">
            <div className="relative">
              <Search className="w-4 h-4 text-[#8C857B] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Hľadať pacienta, liečivo, šaržu, lekára..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] rounded-xl border border-[#E8E2D9] text-xs outline-none focus:border-[#C5A059]"
              />
            </div>

            <div>
              <select
                value={selectedOpiateFilter}
                onChange={(e) => setSelectedOpiateFilter(e.target.value)}
                className="w-full py-2 px-3 bg-[#FAF8F5] rounded-xl border border-[#E8E2D9] text-xs outline-none focus:border-[#C5A059]"
              >
                <option value="all">Všetky opiáty v trezore</option>
                {opiates.map(op => (
                  <option key={op.id} value={op.id}>{op.name}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedMovementFilter}
                onChange={(e) => setSelectedMovementFilter(e.target.value)}
                className="w-full py-2 px-3 bg-[#FAF8F5] rounded-xl border border-[#E8E2D9] text-xs outline-none focus:border-[#C5A059]"
              >
                <option value="all">Všetky typy pohybov</option>
                <option value="podanie">Iba podanie pacientovi</option>
                <option value="prijem">Iba príjem (žiadanka OPL)</option>
                <option value="znehodnotenie">Iba znehodnotenie</option>
                <option value="inventura">Iba inventúra trezoru</option>
              </select>
            </div>

            <div className="flex gap-2">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="flex-1 py-2 px-3 bg-[#FAF8F5] rounded-xl border border-[#E8E2D9] text-xs outline-none focus:border-[#C5A059]"
              />
              {dateFilter && (
                <button
                  type="button"
                  onClick={() => setDateFilter('')}
                  className="px-2.5 py-2 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-xs text-[#8C857B] hover:text-[#2C2A29]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* TABUĽKA OPIÁTOVEJ KNIHY */}
          <div className="bg-white rounded-2xl border border-[#E8E2D9] shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] border-b border-[#E8E2D9] text-[#8C857B] uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-3 w-12 text-center">Por. č.</th>
                    <th className="py-3 px-3 w-28">Dátum a čas</th>
                    <th className="py-3 px-3 min-w-[180px]">Liečivo & Šarža</th>
                    <th className="py-3 px-3 w-32">Typ pohybu</th>
                    <th className="py-3 px-3 min-w-[180px]">Pacient / Výkon / Doklad</th>
                    <th className="py-3 px-3 min-w-[140px]">Zodpovední (Lekár / Sestra / Svedok)</th>
                    <th className="py-3 px-2 text-center w-16">Príjem</th>
                    <th className="py-3 px-2 text-center w-16">Výdaj</th>
                    <th className="py-3 px-2 text-center w-20">Zostatok</th>
                    <th className="py-3 px-3 min-w-[140px]">Poznámka</th>
                    <th className="py-3 px-2 w-10 text-center">Akcia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D9]/70">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-[#8C857B]">
                        <Lock className="w-8 h-8 mx-auto text-[#C5A059]/40 mb-2" />
                        <p className="font-semibold text-sm text-[#2C2A29]">Nenašli sa žiadne záznamy</p>
                        <p className="text-xs">Zadajte iné kritériá vyhľadávania alebo vykonajte nový zápis do knihy.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((entry) => (
                      <tr key={entry.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                        {/* Poradové číslo */}
                        <td className="py-3 px-3 text-center font-mono font-bold text-[#2C2A29]">
                          #{entry.entryNumber}
                        </td>

                        {/* Dátum a čas */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="font-semibold text-[#2C2A29]">{entry.date}</div>
                          <div className="text-[10px] text-[#8C857B] font-mono flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {entry.time}
                          </div>
                        </td>

                        {/* Liečivo & šarža */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-[#2C2A29]">{entry.opiateName}</div>
                          <div className="text-[10px] text-[#8C857B] flex items-center gap-1.5 mt-0.5">
                            <span className="bg-[#FAF8F5] border border-[#E8E2D9] px-1.5 py-0.5 rounded text-[9px] font-mono">
                              Šarža: {entry.lotNumber}
                            </span>
                            <span>{entry.activeSubstance}</span>
                          </div>
                        </td>

                        {/* Typ pohybu */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {getMovementBadge(entry.movementType)}
                        </td>

                        {/* Pacient / Zákrok / Doklad */}
                        <td className="py-3 px-3">
                          {entry.movementType === 'podanie' ? (
                            <div>
                              <div className="font-semibold text-[#2C2A29] flex items-center gap-1">
                                <User className="w-3 h-3 text-[#C5A059]" />
                                <span>{entry.patientName}</span>
                                {entry.patientBirthNumber && (
                                  <span className="text-[10px] text-[#8C857B] font-mono">({entry.patientBirthNumber})</span>
                                )}
                              </div>
                              <div className="text-[11px] text-[#8C857B] truncate max-w-[220px]">
                                {entry.procedureName}
                              </div>
                            </div>
                          ) : entry.movementType === 'prijem' ? (
                            <div>
                              <div className="font-semibold text-emerald-800">{entry.deliveryNoteNumber}</div>
                              <div className="text-[10px] text-[#8C857B]">{entry.supplier}</div>
                            </div>
                          ) : (
                            <div>
                              <div className="font-semibold text-[#2C2A29]">{entry.procedureName || 'Fyzická kontrola trezoru'}</div>
                            </div>
                          )}
                        </td>

                        {/* Personál / Svedok */}
                        <td className="py-3 px-3 text-[11px]">
                          {entry.prescribingDoctor && (
                            <div className="text-[#2C2A29]">
                              <span className="text-[9px] uppercase text-[#8C857B] font-bold">Ord: </span>
                              {entry.prescribingDoctor}
                            </div>
                          )}
                          {entry.administeringNurse && (
                            <div className="text-[#2C2A29]">
                              <span className="text-[9px] uppercase text-[#8C857B] font-bold">Podal: </span>
                              {entry.administeringNurse}
                            </div>
                          )}
                          {entry.witness && (
                            <div className="text-amber-800 font-medium">
                              <span className="text-[9px] uppercase text-amber-700 font-bold">Svedok: </span>
                              {entry.witness}
                            </div>
                          )}
                        </td>

                        {/* Príjem */}
                        <td className="py-3 px-2 text-center font-mono font-bold">
                          {entry.quantityIn > 0 ? (
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              +{entry.quantityIn}
                            </span>
                          ) : (
                            <span className="text-[#8C857B]/40">-</span>
                          )}
                        </td>

                        {/* Výdaj */}
                        <td className="py-3 px-2 text-center font-mono font-bold">
                          {entry.quantityOut > 0 ? (
                            <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              -{entry.quantityOut}
                            </span>
                          ) : (
                            <span className="text-[#8C857B]/40">-</span>
                          )}
                          {entry.quantityWasted && entry.quantityWasted > 0 ? (
                            <span className="block text-[9px] text-rose-600 font-normal mt-0.5" title="Nespotrebovaný znehodnotený zostatok">
                              (odpad: {entry.quantityWasted}ml)
                            </span>
                          ) : null}
                        </td>

                        {/* Zostatok */}
                        <td className="py-3 px-2 text-center font-mono font-bold">
                          {entry.movementType !== 'inventura' ? (
                            <span className="text-[#2C2A29] bg-[#FAF8F5] px-2.5 py-1 rounded border border-[#E8E2D9]">
                              {entry.balanceAfter} {entry.unit}
                            </span>
                          ) : (
                            <span className="text-blue-700 text-[10px] font-bold">Súhlasí ✓</span>
                          )}
                        </td>

                        {/* Poznámka */}
                        <td className="py-3 px-3 text-[11px] text-[#8C857B] max-w-[200px]">
                          <div className="truncate" title={entry.notes}>
                            {entry.notes || '-'}
                          </div>
                          <div className="text-[9px] text-[#8C857B]/70 mt-0.5">
                            Zapísal: {entry.recordedBy}
                          </div>
                        </td>

                        {/* Zmazanie */}
                        <td className="py-3 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setLogToDelete(entry);
                              setIsDeleteConfirmOpen(true);
                            }}
                            title="Odstrániť chybný záznam"
                            className="p-1 text-[#8C857B] hover:text-rose-600 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pätička tabuľky */}
            <div className="p-3 bg-[#FAF8F5] border-t border-[#E8E2D9] text-[10px] text-[#8C857B] flex flex-col sm:flex-row justify-between items-center gap-2">
              <div>
                Zobrazených <strong>{filteredLogs.length}</strong> z celkovo <strong>{logs.length}</strong> úradných záznamov Opiátovej knihy
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                <span>Všetky záznamy sú chronologicky číslované a digitálne archivované.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ZOBRAZENIE: TREZOROVÉ KARTY OPL (SKLADOVÝ STAV V TREZORE) */}
      {/* ========================================================================= */}
      {subTab === 'karty' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {opiates.map(op => {
            const isLow = op.currentStock <= op.minStock;
            return (
              <div 
                key={op.id}
                className={`bg-white rounded-2xl border p-5 transition-all shadow-xs flex flex-col justify-between ${
                  isLow ? 'border-amber-300 ring-2 ring-amber-100' : 'border-[#E8E2D9]'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059] bg-[#C5A059]/10 px-2 py-0.5 rounded">
                      {op.classification === 'omamna_latka_II' ? 'Omamná látka II. sk.' : 'Psychotropná látka'}
                    </span>
                    <span className="text-[10px] font-mono text-[#8C857B]">
                      ŠÚKL: {op.suklCode || '-'}
                    </span>
                  </div>

                  <h4 className="font-bold text-[#2C2A29] text-base mt-2">{op.name}</h4>
                  <p className="text-xs text-[#8C857B] mt-0.5">{op.activeSubstance} • {op.strength}</p>
                  <p className="text-[11px] text-[#8C857B] italic mt-1">{op.form}</p>

                  <div className="mt-4 p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[#8C857B]">Fyzický stav v trezore:</span>
                      <span className={`font-mono font-bold text-base ${isLow ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {op.currentStock} {op.packageUnit}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[#8C857B]">Minimálna rezerva:</span>
                      <span className="font-mono text-[#2C2A29]">{op.minStock} {op.packageUnit}</span>
                    </div>

                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[#8C857B]">Výrobná šarža:</span>
                      <span className="font-mono font-semibold text-[#2C2A29]">{op.lotNumber}</span>
                    </div>

                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[#8C857B]">Exspirácia:</span>
                      <span className="font-mono text-[#2C2A29]">{op.expirationDate}</span>
                    </div>

                    <div className="flex justify-between items-center text-[11px] pt-1 border-t border-[#E8E2D9]">
                      <span className="text-[#8C857B]">Uloženie:</span>
                      <span className="text-[#2C2A29] text-[10px] font-medium">{op.safeLocation}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E8E2D9] flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUsageOpiateId(op.id);
                      setIsUsageModalOpen(true);
                    }}
                    className="flex-1 bg-[#2C2A29] hover:bg-[#C5A059] text-white py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    <span>Odpísať podanie</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setReceiptOpiateId(op.id);
                      setIsReceiptModalOpen(true);
                    }}
                    className="bg-[#FAF8F5] hover:bg-[#F0EBE1] border border-[#E8E2D9] text-[#2C2A29] px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    title="Príjem do trezoru"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Príjem</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ZÁPIS O PODANÍ PACIENTOVI */}
      {/* ========================================================================= */}
      {isUsageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C2A29]/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-5 border-b border-[#E8E2D9] flex justify-between items-center bg-[#FAF8F5]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#C5A059]/20 text-[#C5A059]">
                  <ArrowDownRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-brand text-base font-bold text-[#2C2A29] uppercase">
                    Podanie opiátu pacientovi
                  </h3>
                  <p className="text-[11px] text-[#8C857B]">Odpis z trezoru OPL pri anestézii alebo analgézii</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUsageModalOpen(false)}
                className="p-1.5 rounded-full text-[#8C857B] hover:text-[#2C2A29] hover:bg-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitUsage} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              {/* Výber opiátu */}
              <div>
                <label className="block font-semibold text-[#2C2A29] mb-1">
                  Omamná / psychotropná látka z trezoru *
                </label>
                <select
                  value={usageOpiateId}
                  onChange={(e) => setUsageOpiateId(e.target.value)}
                  required
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#C5A059] font-medium text-[#2C2A29]"
                >
                  {opiates.map(op => (
                    <option key={op.id} value={op.id}>
                      {op.name} (na sklade: {op.currentStock} {op.packageUnit} | šarža: {op.lotNumber})
                    </option>
                  ))}
                </select>
              </div>

              {/* Pacient */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-[#2C2A29]">
                    Pacient *
                  </label>
                  <div className="flex gap-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setUsagePatientMode('select')}
                      className={`font-semibold cursor-pointer ${usagePatientMode === 'select' ? 'text-[#C5A059] underline' : 'text-[#8C857B]'}`}
                    >
                      Výber zo zoznamu
                    </button>
                    <span>|</span>
                    <button
                      type="button"
                      onClick={() => setUsagePatientMode('custom')}
                      className={`font-semibold cursor-pointer ${usagePatientMode === 'custom' ? 'text-[#C5A059] underline' : 'text-[#8C857B]'}`}
                    >
                      Ručné zadanie
                    </button>
                  </div>
                </div>

                {usagePatientMode === 'select' ? (
                  <select
                    value={usageSelectedPatientId}
                    onChange={(e) => {
                      setUsageSelectedPatientId(e.target.value);
                      const pat = patients.find(p => p.id === e.target.value);
                      if (pat) {
                        setUsagePatientName(pat.name);
                        setUsagePatientBirthNumber(pat.birthNumber);
                      }
                    }}
                    className="w-full p-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#C5A059]"
                  >
                    <option value="">-- Vyberte pacienta kliniky --</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.birthNumber || 'bez RČ'})</option>
                    ))}
                  </select>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Meno a priezvisko pacienta"
                      value={usagePatientName}
                      onChange={(e) => setUsagePatientName(e.target.value)}
                      required
                      className="p-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#C5A059]"
                    />
                    <input
                      type="text"
                      placeholder="Rodné číslo (napr. 885512/6789)"
                      value={usagePatientBirthNumber}
                      onChange={(e) => setUsagePatientBirthNumber(e.target.value)}
                      className="p-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#C5A059]"
                    />
                  </div>
                )}
              </div>

              {/* Operačný výkon / indikácia */}
              <div>
                <label className="block font-semibold text-[#2C2A29] mb-1">
                  Operačný výkon / Indikácia *
                </label>
                <input
                  type="text"
                  value={usageProcedure}
                  onChange={(e) => setUsageProcedure(e.target.value)}
                  required
                  placeholder="napr. Augmentácia prsníkov v CA, Facelift v analgosedácii..."
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#C5A059]"
                />
              </div>

              {/* Množstvá */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E2D9]">
                <div>
                  <label className="block font-semibold text-[#2C2A29] mb-1">
                    Počet podaných ampuliek *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={usageQtyOut}
                    onChange={(e) => setUsageQtyOut(Number(e.target.value))}
                    required
                    className="w-full p-2 bg-white border border-[#E8E2D9] rounded-lg font-mono font-bold text-center outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#2C2A29] mb-1">
                    Nespotrebovaný zvyšok (ml)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    value={usageQtyWasted}
                    onChange={(e) => setUsageQtyWasted(Number(e.target.value))}
                    placeholder="0.0"
                    className="w-full p-2 bg-white border border-[#E8E2D9] rounded-lg font-mono text-center outline-none focus:border-[#C5A059]"
                  />
                  <span className="text-[10px] text-[#8C857B] block mt-0.5 text-center">Znehodnotené do odpadu</span>
                </div>
              </div>

              {/* Personál: Lekár, Sestra, Svedok */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-[#2C2A29] mb-1">
                    Ordinoval (Lekár) *
                  </label>
                  <input
                    type="text"
                    value={usageDoctor}
                    onChange={(e) => setUsageDoctor(e.target.value)}
                    required
                    className="w-full p-2 bg-[#FAF8F5] border border-[#E8E2D9] rounded-lg outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#2C2A29] mb-1">
                    Podala (Sestra) *
                  </label>
                  <input
                    type="text"
                    value={usageNurse}
                    onChange={(e) => setUsageNurse(e.target.value)}
                    required
                    className="w-full p-2 bg-[#FAF8F5] border border-[#E8E2D9] rounded-lg outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#2C2A29] mb-1">
                    Svedok (Druhý podpis)
                  </label>
                  <input
                    type="text"
                    value={usageWitness}
                    onChange={(e) => setUsageWitness(e.target.value)}
                    placeholder="Povinný pri likvidácii zostatku"
                    className="w-full p-2 bg-[#FAF8F5] border border-[#E8E2D9] rounded-lg outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              {/* Dátum a čas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#2C2A29] mb-1">Dátum podania *</label>
                  <input
                    type="date"
                    value={usageDate}
                    onChange={(e) => setUsageDate(e.target.value)}
                    required
                    className="w-full p-2 bg-[#FAF8F5] border border-[#E8E2D9] rounded-lg outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#2C2A29] mb-1">Čas podania *</label>
                  <input
                    type="time"
                    value={usageTime}
                    onChange={(e) => setUsageTime(e.target.value)}
                    required
                    className="w-full p-2 bg-[#FAF8F5] border border-[#E8E2D9] rounded-lg outline-none"
                  />
                </div>
              </div>

              {/* Poznámka */}
              <div>
                <label className="block font-semibold text-[#2C2A29] mb-1">Poznámka / Aplikačná cesta</label>
                <input
                  type="text"
                  value={usageNotes}
                  onChange={(e) => setUsageNotes(e.target.value)}
                  placeholder="napr. podané i.v. v úvode anestézie, pooperačne i.m., VAS bolesť..."
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#E8E2D9]">
                <button
                  type="button"
                  onClick={() => setIsUsageModalOpen(false)}
                  className="px-4 py-2.5 border border-[#E8E2D9] rounded-xl font-semibold text-[#8C857B] hover:text-[#2C2A29]"
                >
                  Zrušiť
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#2C2A29] hover:bg-[#C5A059] text-white rounded-xl font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                >
                  Zapísať a odpísať z trezoru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PRÍJEM NOVEJ DODÁVKY OPL DO TREZORU */}
      {/* ========================================================================= */}
      {isReceiptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C2A29]/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-5 border-b border-[#E8E2D9] flex justify-between items-center bg-[#FAF8F5]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-brand text-base font-bold text-[#2C2A29] uppercase">
                    Príjem do trezoru (Žiadanka OPL)
                  </h3>
                  <p className="text-[11px] text-[#8C857B]">Naskladnenie omamných a psychotropných látok</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                className="p-1.5 rounded-full text-[#8C857B] hover:text-[#2C2A29] hover:bg-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReceipt} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#2C2A29] mb-1">
                  Prijímané liečivo *
                </label>
                <select
                  value={receiptOpiateId}
                  onChange={(e) => setReceiptOpiateId(e.target.value)}
                  required
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl outline-none font-medium"
                >
                  {opiates.map(op => (
                    <option key={op.id} value={op.id}>
                      {op.name} ({op.strength})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#2C2A29] mb-1">
                    Číslo žiadanky OPL / Dodacieho listu *
                  </label>
                  <input
                    type="text"
                    value={receiptDocNum}
                    onChange={(e) => setReceiptDocNum(e.target.value)}
                    required
                    placeholder="napr. Žiadanka OPL č. 2026/09-001"
                    className="w-full p-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#2C2A29] mb-1">
                    Počet prijatých ampuliek *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={receiptQtyIn}
                    onChange={(e) => setReceiptQtyIn(Number(e.target.value))}
                    required
                    className="w-full p-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl font-mono font-bold text-center outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#2C2A29] mb-1">Dodávateľ (Lekáreň / Distribútor) *</label>
                <input
                  type="text"
                  value={receiptSupplier}
                  onChange={(e) => setReceiptSupplier(e.target.value)}
                  required
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#2C2A29] mb-1">Výrobná šarža (Lot)</label>
                  <input
                    type="text"
                    value={receiptLot}
                    onChange={(e) => setReceiptLot(e.target.value)}
                    placeholder="LOT-..."
                    className="w-full p-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#2C2A29] mb-1">Dátum exspirácie</label>
                  <input
                    type="date"
                    value={receiptExp}
                    onChange={(e) => setReceiptExp(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#2C2A29] mb-1">Prevzal (Zodpovedný pracovník) *</label>
                <input
                  type="text"
                  value={receiptPerson}
                  onChange={(e) => setReceiptPerson(e.target.value)}
                  required
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#2C2A29] mb-1">Poznámka / Úradný účel príjmu</label>
                <input
                  type="text"
                  value={receiptNotes}
                  onChange={(e) => setReceiptNotes(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#C5A059]"
                  placeholder="napr. Žiadanka OPL s modrým pruhom"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#E8E2D9]">
                <button
                  type="button"
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="px-4 py-2.5 border border-[#E8E2D9] rounded-xl font-semibold text-[#8C857B] hover:text-[#2C2A29]"
                >
                  Zrušiť
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                >
                  Naskladniť do trezoru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: PROTOKOLÁRNE ZNEHODNOTENIE */}
      {/* ========================================================================= */}
      {isWasteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C2A29]/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-5 border-b border-[#E8E2D9] flex justify-between items-center bg-rose-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-brand text-base font-bold text-rose-900 uppercase">
                    Protokol o znehodnotení OPL
                  </h3>
                  <p className="text-[11px] text-rose-700">Vyradenie a likvidácia liečiva v zmysle zákona 139/1998 Z. z.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWasteModalOpen(false)}
                className="p-1.5 rounded-full text-[#8C857B] hover:text-[#2C2A29] hover:bg-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitWaste} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#2C2A29] mb-1">
                  Znehodnocované liečivo z trezoru *
                </label>
                <select
                  value={wasteOpiateId}
                  onChange={(e) => setWasteOpiateId(e.target.value)}
                  required
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl outline-none font-medium"
                >
                  {opiates.map(op => (
                    <option key={op.id} value={op.id}>
                      {op.name} (na sklade: {op.currentStock} {op.packageUnit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#2C2A29] mb-1">
                    Počet celých ampuliek *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={wasteQtyUnits}
                    onChange={(e) => setWasteQtyUnits(Number(e.target.value))}
                    required
                    className="w-full p-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl font-mono font-bold text-center outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#2C2A29] mb-1">
                    Dôvod znehodnotenia *
                  </label>
                  <select
                    value={wasteReason}
                    onChange={(e) => setWasteReason(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl outline-none"
                  >
                    <option value="Rozbitá ampulka pri manipulácii">Rozbitá ampulka pri manipulácii</option>
                    <option value="Znečistený alebo zakalený roztok">Znečistený alebo zakalený roztok</option>
                    <option value="Exspirované liečivo vyradené zo spotreby">Exspirované liečivo vyradené zo spotreby</option>
                    <option value="Iný dôvod likvidácie">Iný dôvod likvidácie</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <span>
                  Podľa zákona č. 139/1998 Z. z. musí byť znehodnotenie omamnej látky vykonané za prítomnosti svedka (druhého zdravotníckeho pracovníka) a zapísané s oboma podpismi.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#2C2A29] mb-1">Zodpovedný lekár *</label>
                  <input
                    type="text"
                    value={wasteDoctor}
                    onChange={(e) => setWasteDoctor(e.target.value)}
                    required
                    className="w-full p-2 bg-[#FAF8F5] border border-[#E8E2D9] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#2C2A29] mb-1">Svedok (Povinný podpis) *</label>
                  <input
                    type="text"
                    value={wasteWitness}
                    onChange={(e) => setWasteWitness(e.target.value)}
                    required
                    className="w-full p-2 bg-[#FAF8F5] border border-[#E8E2D9] rounded-lg font-semibold text-rose-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#2C2A29] mb-1">Asistujúca sestra</label>
                  <input
                    type="text"
                    value={wasteNurse}
                    onChange={(e) => setWasteNurse(e.target.value)}
                    className="w-full p-2 bg-[#FAF8F5] border border-[#E8E2D9] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#2C2A29] mb-1">Poznámka k protokolu</label>
                  <input
                    type="text"
                    value={wasteNotes}
                    onChange={(e) => setWasteNotes(e.target.value)}
                    className="w-full p-2 bg-[#FAF8F5] border border-[#E8E2D9] rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#E8E2D9]">
                <button
                  type="button"
                  onClick={() => setIsWasteModalOpen(false)}
                  className="px-4 py-2.5 border border-[#E8E2D9] rounded-xl font-semibold text-[#8C857B]"
                >
                  Zrušiť
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                >
                  Potvrdiť protokol o znehodnotení
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: FYZICKÁ INVENTÚRA TREZORU */}
      {/* ========================================================================= */}
      {isInventoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C2A29]/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-[#E8E2D9] flex justify-between items-center bg-[#FAF8F5]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-brand text-base font-bold text-[#2C2A29] uppercase">
                    Mesačná inventúra trezoru OPL
                  </h3>
                  <p className="text-[11px] text-[#8C857B]">Fyzická previerka skutočného stavu ampuliek</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInventoryModalOpen(false)}
                className="p-1.5 rounded-full text-[#8C857B] hover:text-[#2C2A29] hover:bg-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitInventory} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E2D9] space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-[#8C857B] block">Aktuálny súhrn na overenie:</span>
                <div className="flex justify-between font-mono font-semibold text-[#2C2A29]">
                  <span>Celkový počet evidovaných ampuliek:</span>
                  <span className="text-emerald-700">{stats.totalUnitsInSafe} ks</span>
                </div>
                <div className="flex justify-between font-mono text-[11px] text-[#8C857B]">
                  <span>Počet položiek:</span>
                  <span>{opiates.length} preparátov</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#2C2A29] mb-1">Zodpovedný lekár *</label>
                <input
                  type="text"
                  value={invDoctor}
                  onChange={(e) => setInvDoctor(e.target.value)}
                  required
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#2C2A29] mb-1">Vedúca / Anesteziologická sestra *</label>
                <input
                  type="text"
                  value={invNurse}
                  onChange={(e) => setInvNurse(e.target.value)}
                  required
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#2C2A29] mb-1">Záznam o zhode fyzického stavu</label>
                <textarea
                  rows={3}
                  value={invNotes}
                  onChange={(e) => setInvNotes(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#E8E2D9]">
                <button
                  type="button"
                  onClick={() => setIsInventoryModalOpen(false)}
                  className="px-4 py-2.5 border border-[#E8E2D9] rounded-xl font-semibold text-[#8C857B]"
                >
                  Zrušiť
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#2C2A29] hover:bg-[#C5A059] text-white rounded-xl font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                >
                  Potvrdiť inventúru trezoru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: POTVRDENIE ZMAZANIA ZÁZNAMU */}
      {/* ========================================================================= */}
      {isDeleteConfirmOpen && logToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C2A29]/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-brand font-bold text-base text-[#2C2A29]">
                Odstrániť záznam #{logToDelete.entryNumber}?
              </h3>
              <p className="text-xs text-[#8C857B] mt-1">
                Odstránenie záznamu z Opiátovej knihy ({logToDelete.opiateName} zo dňa {logToDelete.date}).
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setLogToDelete(null);
                }}
                className="px-4 py-2 border border-[#E8E2D9] text-[#8C857B] rounded-xl text-xs font-semibold"
              >
                Zrušiť
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteLog}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                Potvrdiť zmazanie
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: ÚRADNÁ TLAČ / EXPORT OPIÁTOVEJ KNIHY */}
      {/* ========================================================================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C2A29]/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-2xl max-w-4xl w-full flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-[#E8E2D9] flex justify-between items-center bg-[#FAF8F5]">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-[#C5A059]" />
                <h3 className="font-brand text-sm font-bold uppercase text-[#2C2A29]">
                  Tlačový náhľad: Úradná Opiátová kniha (MZ SR / ŠÚKL)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="bg-[#2C2A29] hover:bg-[#C5A059] text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Vytlačiť zostavu</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 rounded-full text-[#8C857B] hover:text-[#2C2A29]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* TLAČOVÝ DOKUMENT */}
            <div className="p-8 overflow-y-auto font-sans text-black space-y-6" ref={printAreaRef}>
              {/* Hlavička PZS */}
              <div className="border-b-2 border-black pb-4 flex justify-between items-start text-xs">
                <div>
                  <h1 className="text-xl font-bold uppercase tracking-wide">SAY CLINIC s.r.o.</h1>
                  <p className="font-medium text-gray-700">Klinika plastickej chirurgie a estetickej dermatológie</p>
                  <p className="text-gray-600 text-[11px]">Oddelenie jednodňovej chirurgie a anestéziológie</p>
                  <p className="text-gray-600 text-[11px]">Slnečná 15, Banská Bystrica • IČO: 45 123 456</p>
                </div>
                <div className="text-right">
                  <div className="font-bold uppercase text-sm">Kniha evidencie OPL</div>
                  <div className="text-[11px] text-gray-600">Zákon NR SR č. 139/1998 Z. z.</div>
                  <div className="text-[11px] text-gray-600">Dátum tlače: {new Date().toLocaleDateString('sk-SK')}</div>
                </div>
              </div>

              {/* Informácie o trezore */}
              <div className="grid grid-cols-2 text-xs bg-gray-50 p-3 border border-gray-300 rounded">
                <div>
                  <div><strong>Umiestnenie trezoru:</strong> Trezor OPL č. 1, Operačná sála</div>
                  <div><strong>Zodpovedný lekár:</strong> MUDr. Ján Mráz</div>
                </div>
                <div>
                  <div><strong>Vedúca sestra:</strong> Bc. Simona Horváthová</div>
                  <div><strong>Stav kontroly:</strong> Fyzický stav overený a odsúhlasený</div>
                </div>
              </div>

              {/* Tabuľka riadkov */}
              <table className="w-full text-left border-collapse border border-black text-[10px]">
                <thead>
                  <tr className="bg-gray-100 border-b border-black font-bold">
                    <th className="border border-black p-1.5 text-center w-8">Č.</th>
                    <th className="border border-black p-1.5 w-16">Dátum</th>
                    <th className="border border-black p-1.5">Názov OPL & Šarža</th>
                    <th className="border border-black p-1.5">Pohyb</th>
                    <th className="border border-black p-1.5">Pacient / Číslo žiadanky</th>
                    <th className="border border-black p-1.5 text-center w-12">Príjem</th>
                    <th className="border border-black p-1.5 text-center w-12">Výdaj</th>
                    <th className="border border-black p-1.5 text-center w-12">Zostatok</th>
                    <th className="border border-black p-1.5">Lekár / Sestra / Svedok</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((row) => (
                    <tr key={row.id} className="border-b border-gray-300">
                      <td className="border border-black p-1.5 text-center font-bold">#{row.entryNumber}</td>
                      <td className="border border-black p-1.5 whitespace-nowrap">{row.date}</td>
                      <td className="border border-black p-1.5">
                        <div className="font-bold">{row.opiateName}</div>
                        <div className="text-gray-600 text-[9px]">Šarža: {row.lotNumber}</div>
                      </td>
                      <td className="border border-black p-1.5 uppercase text-[9px] font-bold">
                        {row.movementType === 'podanie' ? 'Podanie' : row.movementType === 'prijem' ? 'Príjem' : row.movementType}
                      </td>
                      <td className="border border-black p-1.5">
                        {row.patientName ? (
                          <div>
                            <strong>{row.patientName}</strong> {row.patientBirthNumber && `(${row.patientBirthNumber})`}
                            <div className="text-gray-600 text-[9px]">{row.procedureName}</div>
                          </div>
                        ) : (
                          <div>{row.deliveryNoteNumber || row.notes || '-'}</div>
                        )}
                      </td>
                      <td className="border border-black p-1.5 text-center font-mono font-bold">
                        {row.quantityIn > 0 ? `+${row.quantityIn}` : '-'}
                      </td>
                      <td className="border border-black p-1.5 text-center font-mono font-bold">
                        {row.quantityOut > 0 ? `-${row.quantityOut}` : '-'}
                      </td>
                      <td className="border border-black p-1.5 text-center font-mono font-bold">
                        {row.balanceAfter} {row.unit}
                      </td>
                      <td className="border border-black p-1.5 text-[9px]">
                        <div>Ord: {row.prescribingDoctor || '-'}</div>
                        <div>Podal: {row.administeringNurse || '-'}</div>
                        {row.witness && <div>Svedok: {row.witness}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Podpisy */}
              <div className="pt-8 flex justify-between items-end text-xs">
                <div className="text-center">
                  <div className="w-48 border-b border-black pb-1 mb-1 font-mono">...............................................</div>
                  <div>Podpis zodpovednej sestry</div>
                </div>

                <div className="text-center">
                  <div className="w-48 border-b border-black pb-1 mb-1 font-mono">...............................................</div>
                  <div>Podpis a pečiatka vedúceho lekára</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
