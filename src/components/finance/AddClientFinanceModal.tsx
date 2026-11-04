'use client';

import React, { useState, useMemo } from 'react';
import { 
  X, 
  UserPlus, 
  Search, 
  Calendar, 
  User, 
  Receipt, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  FileText,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { Patient } from '../PatientDatabase';
import { 
  FinanceBillingService, 
  PatientFinancialProfile, 
  PaymentMethod 
} from '@/services/financeBillingService';
import { filterAndRankPatients } from '@/utils/fuzzySearch';

interface AddClientFinanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  onClientAdded: (profile: PatientFinancialProfile) => void;
}

const COMMON_PROCEDURES = [
  'Augmentácia prsníkov',
  'Blefaroplastika',
  'Facelift & Necklift',
  'Rinoplastika',
  'Liposukcia',
  'Abdominoplastika',
  'Aplikácia botulotoxínu',
  'Výplň kyselinou hyalurónovou',
  'Konzultácia plastická chirurgia'
];

const DOCTOR_OPTIONS = [
  'MUDr. Ján Mráz',
  'MUDr. Tran',
  'MUDr. Sroka',
  'MUDr. Šebeňová'
];

export default function AddClientFinanceModal({
  isOpen,
  onClose,
  patients,
  onClientAdded
}: AddClientFinanceModalProps) {
  // Výber pacienta
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [manualPatientName, setManualPatientName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualBirthNumber, setManualBirthNumber] = useState('');

  // Parametre zákroku
  const [procedureName, setProcedureName] = useState('');
  const [procedureDate, setProcedureDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [doctorName, setDoctorName] = useState('MUDr. Ján Mráz');
  const [customDoctor, setCustomDoctor] = useState('');
  const [status, setStatus] = useState<'planned' | 'operated'>('planned');

  // Finančné parametre
  const [totalAgreedPrice, setTotalAgreedPrice] = useState<string>('');
  const [depositRequired, setDepositRequired] = useState<string>('');
  const [isDepositPaid, setIsDepositPaid] = useState<boolean>(false);
  const [depositPaidAmount, setDepositPaidAmount] = useState<string>('');
  const [depositPaidDate, setDepositPaidDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [depositPaymentMethod, setDepositPaymentMethod] = useState<PaymentMethod>('bank_transfer');

  // Externé čísla faktúr (z účtovníctva kliniky)
  const [advanceInvoiceNumber, setAdvanceInvoiceNumber] = useState('');
  const [finalInvoiceNumber, setFinalInvoiceNumber] = useState('');
  const [isFinalPaid, setIsFinalPaid] = useState<boolean>(false);
  const [finalPaidAmount, setFinalPaidAmount] = useState<string>('');
  const [finalPaidDate, setFinalPaidDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [finalPaymentMethod, setFinalPaymentMethod] = useState<PaymentMethod>('card');

  // Poznámka
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Našepkávanie pacientov z kartotéky
  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return [];
    return filterAndRankPatients(patients, patientSearch).slice(0, 6);
  }, [patients, patientSearch]);

  if (!isOpen) return null;

  const handleSelectPatient = (p: Patient) => {
    setSelectedPatient(p);
    setPatientSearch(p.name);
    setManualPatientName('');
    setManualPhone(p.phone || '');
    setManualEmail(p.email || '');
    setManualBirthNumber(p.birthNumber || '');
  };

  const handleClearSelectedPatient = () => {
    setSelectedPatient(null);
    setPatientSearch('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const clientName = selectedPatient ? selectedPatient.name : manualPatientName.trim();
    if (!clientName) {
      setErrorMsg('Zadajte alebo vyberte meno klienta z kartotéky.');
      return;
    }

    if (!procedureName.trim()) {
      setErrorMsg('Zadajte názov zákroku alebo operácie.');
      return;
    }

    const priceNum = Math.max(0, parseFloat(totalAgreedPrice) || 0);
    const depReqNum = Math.max(0, parseFloat(depositRequired) || 0);
    let depPaidNum = 0;
    if (isDepositPaid) {
      depPaidNum = depositPaidAmount ? Math.max(0, parseFloat(depositPaidAmount) || 0) : (depReqNum > 0 ? depReqNum : priceNum);
    }

    let finPaidNum = 0;
    if (isFinalPaid) {
      finPaidNum = finalPaidAmount ? Math.max(0, parseFloat(finalPaidAmount) || 0) : Math.max(0, priceNum - depPaidNum);
    }

    const totalPaidCalculated = depPaidNum + finPaidNum;
    const balanceDueCalculated = Math.max(0, priceNum - totalPaidCalculated);

    const activeDoctor = doctorName === 'custom' ? (customDoctor.trim() || 'MUDr. Ján Mráz') : doctorName;

    // Spotreba materiálu zo skladu
    const matUsage = FinanceBillingService.calculateClientMaterialUsage(clientName, selectedPatient?.id);
    const netMargin = priceNum - matUsage.totalCost;
    const marginPct = priceNum > 0 ? parseFloat(((netMargin / priceNum) * 100).toFixed(1)) : 0;

    const invoicesList: string[] = [];
    if (advanceInvoiceNumber.trim()) invoicesList.push(advanceInvoiceNumber.trim());
    if (finalInvoiceNumber.trim()) invoicesList.push(finalInvoiceNumber.trim());

    const newProfile: PatientFinancialProfile = {
      id: `prof-manual-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      patientId: selectedPatient?.id,
      patientName: clientName,
      patientBirthNumber: selectedPatient?.birthNumber || manualBirthNumber.trim() || undefined,
      patientPhone: selectedPatient?.phone || manualPhone.trim() || undefined,
      patientEmail: selectedPatient?.email || manualEmail.trim() || undefined,
      patientAddress: selectedPatient?.address || undefined,
      status,
      procedureName: procedureName.trim(),
      procedureDate,
      doctorName: activeDoctor,
      totalAgreedPrice: priceNum,
      depositRequired: depReqNum,
      depositPaid: depPaidNum,
      isDepositPaid,
      clientCredit: 0,
      totalBilled: priceNum,
      totalPaid: totalPaidCalculated,
      balanceDue: balanceDueCalculated,

      // Externé faktúry
      advanceInvoiceNumber: advanceInvoiceNumber.trim() || undefined,
      advanceAmount: depReqNum > 0 ? depReqNum : (depPaidNum > 0 ? depPaidNum : undefined),
      isAdvancePaid: isDepositPaid,
      advancePaidDate: isDepositPaid ? depositPaidDate : undefined,
      advancePaymentMethod: isDepositPaid ? depositPaymentMethod : undefined,

      finalInvoiceNumber: finalInvoiceNumber.trim() || undefined,
      finalAmount: finPaidNum > 0 ? finPaidNum : (balanceDueCalculated > 0 ? balanceDueCalculated : undefined),
      isFinalPaid,
      finalPaidDate: isFinalPaid ? finalPaidDate : undefined,
      finalPaymentMethod: isFinalPaid ? finalPaymentMethod : undefined,

      materialCost: matUsage.totalCost,
      materialItemsCount: matUsage.itemsCount,
      netProcedureMargin: netMargin,
      marginPercentage: marginPct,
      invoices: invoicesList,
      notes: notes.trim() || undefined
    };

    FinanceBillingService.saveClientProfile(newProfile);
    onClientAdded(newProfile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#E8E2D9] flex flex-col">
        {/* HLAVIČKA */}
        <div className="p-6 border-b border-[#E8E2D9] flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF6EF] text-[#C5A059] flex items-center justify-center border border-[#E6D4B2]">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-brand font-bold text-[#2C2A29]">Pridať klienta do finančného riadenia</h2>
              <p className="text-xs text-[#8C857B]">
                Manuálne zaevidovanie zákroku, dohodnutej ceny a čísel externých faktúr
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#FBF9F6] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORMULÁR */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. VÝBER ALEBO ZADANIE PACIENTA */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-[#8C857B]">
              1. Pacient / Klient <span className="text-rose-600">*</span>
            </label>

            {!selectedPatient ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-[#8C857B] absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    placeholder="Vyhľadať pacienta z kartotéky SAY OS (meno, rodné číslo, telefón)..."
                    className="w-full bg-[#FBF9F6] border border-[#E8E2D9] pl-9 pr-3 py-2.5 rounded-xl text-xs text-[#2C2A29] focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                {filteredPatients.length > 0 && (
                  <div className="border border-[#E8E2D9] rounded-2xl bg-white shadow-lg overflow-hidden divide-y divide-[#E8E2D9]">
                    {filteredPatients.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPatient(p)}
                        className="w-full p-2.5 text-left hover:bg-[#FAF6EF] transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <div>
                          <p className="text-xs font-bold text-[#2C2A29] group-hover:text-[#C5A059]">{p.name}</p>
                          <p className="text-[10px] text-[#8C857B] font-mono">
                            {p.birthNumber || 'Bez RČ'} {p.phone ? `• ${p.phone}` : ''}
                          </p>
                        </div>
                        <span className="text-[10px] text-[#C5A059] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                          Vybrať &rarr;
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="pt-1">
                  <p className="text-[11px] text-[#8C857B] mb-1.5">Alebo zadajte údaje nového klienta manuálne:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={manualPatientName}
                      onChange={(e) => setManualPatientName(e.target.value)}
                      placeholder="Meno a priezvisko klienta"
                      className="bg-[#FBF9F6] border border-[#E8E2D9] px-3 py-2 rounded-xl text-xs text-[#2C2A29] focus:outline-none focus:border-[#C5A059]"
                    />
                    <input
                      type="text"
                      value={manualBirthNumber}
                      onChange={(e) => setManualBirthNumber(e.target.value)}
                      placeholder="Rodné číslo (voliteľné)"
                      className="bg-[#FBF9F6] border border-[#E8E2D9] px-3 py-2 rounded-xl text-xs text-[#2C2A29] focus:outline-none focus:border-[#C5A059]"
                    />
                    <input
                      type="text"
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                      placeholder="Telefón (voliteľné)"
                      className="bg-[#FBF9F6] border border-[#E8E2D9] px-3 py-2 rounded-xl text-xs text-[#2C2A29] focus:outline-none focus:border-[#C5A059]"
                    />
                    <input
                      type="email"
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                      placeholder="Email (voliteľné)"
                      className="bg-[#FBF9F6] border border-[#E8E2D9] px-3 py-2 rounded-xl text-xs text-[#2C2A29] focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-[#FAF6EF] border border-[#E6D4B2] rounded-2xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#2C2A29]">{selectedPatient.name}</span>
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-[#E6D4B2] text-[#8A6827] font-semibold">
                      Z kartotéky SAY OS
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8C857B] font-mono mt-0.5">
                    {selectedPatient.birthNumber || 'Bez RČ'} • {selectedPatient.phone || 'Bez tel.'} • {selectedPatient.email || 'Bez emailu'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClearSelectedPatient}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors"
                >
                  Zmeniť
                </button>
              </div>
            )}
          </div>

          {/* 2. ZÁKROK, DÁTUM, LEKÁR A STAV */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-[#8C857B]">
              2. Zákrok, Dátum & Operatér <span className="text-rose-600">*</span>
            </label>

            <div>
              <input
                type="text"
                value={procedureName}
                onChange={(e) => setProcedureName(e.target.value)}
                placeholder="Názov operácie / estetického zákroku (napr. Augmentácia prsníkov)"
                className="w-full bg-[#FBF9F6] border border-[#E8E2D9] px-3 py-2.5 rounded-xl text-xs text-[#2C2A29] focus:outline-none focus:border-[#C5A059] font-medium"
              />
              {/* Rýchle predvoľby */}
              <div className="flex flex-wrap gap-1 mt-2">
                {COMMON_PROCEDURES.map(proc => (
                  <button
                    key={proc}
                    type="button"
                    onClick={() => setProcedureName(proc)}
                    className="px-2 py-1 rounded-lg text-[10px] bg-[#FBF9F6] hover:bg-[#FAF6EF] text-[#8C857B] hover:text-[#C5A059] border border-[#E8E2D9] transition-all cursor-pointer"
                  >
                    + {proc}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Dátum */}
              <div>
                <label className="block text-[11px] text-[#8C857B] mb-1">Dátum výkonu</label>
                <input
                  type="date"
                  value={procedureDate}
                  onChange={(e) => setProcedureDate(e.target.value)}
                  className="w-full bg-[#FBF9F6] border border-[#E8E2D9] px-3 py-2 rounded-xl text-xs font-mono text-[#2C2A29] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              {/* Lekár */}
              <div>
                <label className="block text-[11px] text-[#8C857B] mb-1">Operatér / Lekár</label>
                <select
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full bg-[#FBF9F6] border border-[#E8E2D9] px-3 py-2 rounded-xl text-xs text-[#2C2A29] focus:outline-none focus:border-[#C5A059]"
                >
                  {DOCTOR_OPTIONS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                  <option value="custom">Iný lekár...</option>
                </select>
                {doctorName === 'custom' && (
                  <input
                    type="text"
                    value={customDoctor}
                    onChange={(e) => setCustomDoctor(e.target.value)}
                    placeholder="Meno lekára"
                    className="w-full mt-1.5 bg-[#FBF9F6] border border-[#E8E2D9] px-3 py-1.5 rounded-xl text-xs text-[#2C2A29] focus:outline-none focus:border-[#C5A059]"
                  />
                )}
              </div>

              {/* Stav */}
              <div>
                <label className="block text-[11px] text-[#8C857B] mb-1">Stav klienta</label>
                <div className="grid grid-cols-2 gap-1 bg-[#FBF9F6] p-1 rounded-xl border border-[#E8E2D9]">
                  <button
                    type="button"
                    onClick={() => setStatus('planned')}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                      status === 'planned'
                        ? 'bg-amber-100 text-amber-900 shadow-xs'
                        : 'text-[#8C857B] hover:text-[#2C2A29]'
                    }`}
                  >
                    Plánovaný
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('operated')}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                      status === 'operated'
                        ? 'bg-emerald-100 text-emerald-900 shadow-xs'
                        : 'text-[#8C857B] hover:text-[#2C2A29]'
                    }`}
                  >
                    Odoperovaný
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 3. DOHODNUTÁ CENA A ZÁLOHA */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-[#8C857B]">
              3. Financie & Záloha
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-[#8C857B] mb-1">
                  Celková dohodnutá cena (€) <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={totalAgreedPrice}
                    onChange={(e) => setTotalAgreedPrice(e.target.value)}
                    placeholder="napr. 3500"
                    className="w-full bg-[#FBF9F6] border border-[#E8E2D9] px-3 py-2 rounded-xl text-xs font-mono font-bold text-[#2C2A29] focus:outline-none focus:border-[#C5A059]"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-[#8C857B]">€</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#8C857B] mb-1">Požadovaná záloha (€)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={depositRequired}
                    onChange={(e) => setDepositRequired(e.target.value)}
                    placeholder="napr. 500"
                    className="w-full bg-[#FBF9F6] border border-[#E8E2D9] px-3 py-2 rounded-xl text-xs font-mono font-bold text-[#2C2A29] focus:outline-none focus:border-[#C5A059]"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-[#8C857B]">€</span>
                </div>
              </div>
            </div>

            {/* Checkbox stavu úhrady zálohy */}
            <div className="p-3 bg-[#FBF9F6] border border-[#E8E2D9] rounded-2xl space-y-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isDepositPaid}
                  onChange={(e) => setIsDepositPaid(e.target.checked)}
                  className="rounded text-[#C5A059] focus:ring-[#C5A059] w-4 h-4"
                />
                <span className="text-xs font-bold text-[#2C2A29]">Záloha už bola uhradená</span>
              </label>

              {isDepositPaid && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-[#E8E2D9]">
                  <div>
                    <label className="block text-[10px] text-[#8C857B] mb-1">Uhradená suma zálohy (€)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={depositPaidAmount}
                      onChange={(e) => setDepositPaidAmount(e.target.value)}
                      placeholder={depositRequired || '500'}
                      className="w-full bg-white border border-[#E8E2D9] px-2.5 py-1.5 rounded-lg text-xs font-mono text-[#2C2A29]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#8C857B] mb-1">Dátum úhrady</label>
                    <input
                      type="date"
                      value={depositPaidDate}
                      onChange={(e) => setDepositPaidDate(e.target.value)}
                      className="w-full bg-white border border-[#E8E2D9] px-2.5 py-1.5 rounded-lg text-xs font-mono text-[#2C2A29]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#8C857B] mb-1">Spôsob úhrady</label>
                    <select
                      value={depositPaymentMethod}
                      onChange={(e) => setDepositPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full bg-white border border-[#E8E2D9] px-2.5 py-1.5 rounded-lg text-xs text-[#2C2A29]"
                    >
                      <option value="bank_transfer">Bankový prevod</option>
                      <option value="card">Platobná karta</option>
                      <option value="cash">Hotovosť</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4. EVIDENCIA EXTERNÝCH FAKTÚR (ZF & DF Z ÚČTOVNÍCTVA) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#8C857B]">
                4. Evidencia externých faktúr (z účtovníctva)
              </label>
              <span className="text-[10px] text-[#8C857B]">Voliteľné</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* ZF */}
              <div className="p-3 bg-amber-50/40 border border-amber-200/60 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900">Zálohová faktúra (ZF)</span>
                  <Receipt className="w-3.5 h-3.5 text-amber-700" />
                </div>
                <input
                  type="text"
                  value={advanceInvoiceNumber}
                  onChange={(e) => setAdvanceInvoiceNumber(e.target.value)}
                  placeholder="napr. ZF-2026-0045"
                  className="w-full bg-white border border-amber-300 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-[#2C2A29] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              {/* DF */}
              <div className="p-3 bg-purple-50/40 border border-purple-200/60 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-900">Definitívna faktúra (DF)</span>
                  <FileText className="w-3.5 h-3.5 text-purple-700" />
                </div>
                <input
                  type="text"
                  value={finalInvoiceNumber}
                  onChange={(e) => setFinalInvoiceNumber(e.target.value)}
                  placeholder="napr. 20260189"
                  className="w-full bg-white border border-purple-300 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-[#2C2A29] focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>

            {/* Checkbox stavu úhrady konečnej faktúry */}
            <div className="p-3 bg-[#FBF9F6] border border-[#E8E2D9] rounded-2xl space-y-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isFinalPaid}
                  onChange={(e) => setIsFinalPaid(e.target.checked)}
                  className="rounded text-[#C5A059] focus:ring-[#C5A059] w-4 h-4"
                />
                <span className="text-xs font-bold text-[#2C2A29]">Konečná suma / definitívna faktúra je už vyrovnaná</span>
              </label>

              {isFinalPaid && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-[#E8E2D9]">
                  <div>
                    <label className="block text-[10px] text-[#8C857B] mb-1">Uhradená suma (€)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={finalPaidAmount}
                      onChange={(e) => setFinalPaidAmount(e.target.value)}
                      placeholder="Doplatok"
                      className="w-full bg-white border border-[#E8E2D9] px-2.5 py-1.5 rounded-lg text-xs font-mono text-[#2C2A29]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#8C857B] mb-1">Dátum úhrady</label>
                    <input
                      type="date"
                      value={finalPaidDate}
                      onChange={(e) => setFinalPaidDate(e.target.value)}
                      className="w-full bg-white border border-[#E8E2D9] px-2.5 py-1.5 rounded-lg text-xs font-mono text-[#2C2A29]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#8C857B] mb-1">Spôsob úhrady</label>
                    <select
                      value={finalPaymentMethod}
                      onChange={(e) => setFinalPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full bg-white border border-[#E8E2D9] px-2.5 py-1.5 rounded-lg text-xs text-[#2C2A29]"
                    >
                      <option value="card">Platobná karta</option>
                      <option value="bank_transfer">Bankový prevod</option>
                      <option value="cash">Hotovosť</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 5. POZNÁMKA */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#8C857B]">Interná poznámka</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Doplňujúce informácie k dohodnutej cene, zľavám alebo termínu..."
              className="w-full bg-[#FBF9F6] border border-[#E8E2D9] px-3 py-2 rounded-xl text-xs text-[#2C2A29] focus:outline-none focus:border-[#C5A059]"
            />
          </div>

          {/* TLAČIDLÁ */}
          <div className="pt-4 border-t border-[#E8E2D9] flex items-center justify-end gap-3 sticky bottom-0 bg-white py-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#E8E2D9] text-xs font-bold text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#FBF9F6] transition-colors"
            >
              Zrušiť
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#2C2A29] hover:bg-[#C5A059] text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Uložiť klienta do financií</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
