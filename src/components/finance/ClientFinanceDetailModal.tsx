'use client';

import React, { useState, useEffect } from 'react';
import { 
  PatientFinancialProfile, 
  FinanceBillingService, 
  PaymentMethod 
} from '@/services/financeBillingService';
import { 
  X, 
  Coins, 
  FileText, 
  AlertCircle, 
  Package,
  Award,
  CheckCircle2,
  Clock,
  Save,
  Check
} from 'lucide-react';
import { LoyaltyService } from '@/services/loyaltyService';

interface ClientFinanceDetailModalProps {
  profile: PatientFinancialProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated: (updated: PatientFinancialProfile) => void;
  onOpenInvoiceDetail?: (invoiceNumber: string) => void;
  onCreateInvoiceForClient?: (clientName: string, procedureName: string, amount: number, type: 'advance' | 'standard') => void;
  onOpenLoyaltyModal?: (patientId: string | undefined, patientName: string) => void;
}

export default function ClientFinanceDetailModal({
  profile,
  isOpen,
  onClose,
  onProfileUpdated,
  onOpenInvoiceDetail,
  onOpenLoyaltyModal
}: ClientFinanceDetailModalProps) {
  // Stav pre zaevidovanie platby
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('card');
  const [payNote, setPayNote] = useState('');

  // Stav pre úpravu / dobitie kreditu
  const [showCreditForm, setShowCreditForm] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditAction, setCreditAction] = useState<'add' | 'deduct'>('add');
  const [creditType, setCreditType] = useState<'deposit_topup' | 'gift_voucher' | 'refund'>('deposit_topup');
  const [creditNote, setCreditNote] = useState('');

  // Stavy pre evidenciu externých faktúr z účtovného programu kliniky
  const [advanceNumber, setAdvanceNumber] = useState('');
  const [advanceAmt, setAdvanceAmt] = useState('');
  const [isAdvPaid, setIsAdvPaid] = useState(false);
  const [advDate, setAdvDate] = useState('');
  const [advMethod, setAdvMethod] = useState<PaymentMethod>('bank_transfer');

  const [finalNumber, setFinalNumber] = useState('');
  const [finalAmt, setFinalAmt] = useState('');
  const [isFinPaid, setIsFinPaid] = useState(false);
  const [finDate, setFinDate] = useState('');
  const [finMethod, setFinMethod] = useState<PaymentMethod>('card');

  const [saveSuccess, setSaveSuccess] = useState(false);

  // Synchronizácia stavov pri otvorení alebo zmene profilu
  useEffect(() => {
    if (profile) {
      setAdvanceNumber(profile.advanceInvoiceNumber || '');
      setAdvanceAmt(profile.advanceAmount !== undefined ? String(profile.advanceAmount) : (profile.depositPaid ? String(profile.depositPaid) : (profile.depositRequired ? String(profile.depositRequired) : '')));
      setIsAdvPaid(Boolean(profile.isAdvancePaid));
      setAdvDate(profile.advancePaidDate || '');
      setAdvMethod(profile.advancePaymentMethod || 'bank_transfer');

      setFinalNumber(profile.finalInvoiceNumber || '');
      setFinalAmt(profile.finalAmount !== undefined ? String(profile.finalAmount) : (profile.balanceDue ? String(profile.balanceDue) : ''));
      setIsFinPaid(Boolean(profile.isFinalPaid));
      setFinDate(profile.finalPaidDate || '');
      setFinMethod(profile.finalPaymentMethod || 'card');
      setSaveSuccess(false);
    }
  }, [profile?.id, profile?.advanceInvoiceNumber, profile?.finalInvoiceNumber, profile?.isAdvancePaid, profile?.isFinalPaid]);

  if (!isOpen || !profile) return null;

  const isPlanned = profile.status === 'planned';
  const loyaltyStatus = LoyaltyService.calculateClientLoyalty({
    id: profile.patientId,
    name: profile.patientName
  });

  // Uloženie údajov externých faktúr (ZF & DF)
  const handleSaveInvoices = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = FinanceBillingService.updateClientInvoiceTracking(profile.id, {
      advanceInvoiceNumber: advanceNumber,
      advanceAmount: advanceAmt ? parseFloat(advanceAmt) : undefined,
      isAdvancePaid: isAdvPaid,
      advancePaidDate: advDate || (isAdvPaid ? new Date().toISOString().split('T')[0] : undefined),
      advancePaymentMethod: advMethod,

      finalInvoiceNumber: finalNumber,
      finalAmount: finalAmt ? parseFloat(finalAmt) : undefined,
      isFinalPaid: isFinPaid,
      finalPaidDate: finDate || (isFinPaid ? new Date().toISOString().split('T')[0] : undefined),
      finalPaymentMethod: finMethod
    });

    if (updated) {
      onProfileUpdated(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  // Načítanie spotrebovaného materiálu zo skladu
  const materialUsage = FinanceBillingService.calculateClientMaterialUsage(profile.patientName, profile.patientId);

  // Zaevidovanie úhrady
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) return;

    const updated = FinanceBillingService.recordClientPayment(profile.id, amount, payMethod, payNote);
    if (updated) {
      onProfileUpdated(updated);
      setShowPaymentForm(false);
      setPayAmount('');
    }
  };

  // Úprava kreditu
  const handleAdjustCredit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(creditAmount);
    if (!amount || amount <= 0) return;

    const finalAmount = creditAction === 'add' ? amount : -amount;
    const { profile: updated } = FinanceBillingService.adjustClientCredit(
      profile.patientId || profile.id,
      profile.patientName,
      finalAmount,
      creditType,
      creditNote || (creditAction === 'add' ? 'Dobitie kreditu' : 'Čerpanie kreditu'),
      'SAY CLINIC Recepcia'
    );

    if (updated) {
      onProfileUpdated(updated);
    } else {
      // Ak bol upravený len lokálne
      const updatedProf = {
        ...profile,
        clientCredit: Math.max(0, profile.clientCredit + finalAmount),
        balanceDue: Math.max(0, profile.totalAgreedPrice - profile.totalPaid - Math.max(0, profile.clientCredit + finalAmount))
      };
      onProfileUpdated(updatedProf);
    }
    setShowCreditForm(false);
    setCreditAmount('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-[#E8E2D9] my-8 overflow-hidden">
        
        {/* HLAVIČKA MODÁLU */}
        <div className="flex items-center justify-between px-6 py-5 bg-[#FBF9F6] border-b border-[#E8E2D9]">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              isPlanned
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
            }`}>
              {isPlanned ? '📅 Plánovaný zákrok' : '✅ Odoperovaný klient'}
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-brand text-xl font-bold text-[#2C2A29]">
                  {profile.patientName}
                </h3>
                <button
                  type="button"
                  onClick={() => onOpenLoyaltyModal?.(profile.patientId, profile.patientName)}
                  title={`Vernostná kategória klienta: ${loyaltyStatus.tierDef.name} (${loyaltyStatus.tierDef.discountPercent}% zľava). Minuté za 365d (Skin Care + Ošetrenia): ${loyaltyStatus.eligibleSpend365d.toFixed(0)} €`}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                    loyaltyStatus.tier === 'vip'
                      ? 'bg-[#2C2A29] text-[#C5A059] border-[#C5A059]'
                      : loyaltyStatus.tier === 'premium'
                        ? 'bg-[#FAF6EF] text-[#8A6827] border-[#C5A059]'
                        : 'bg-white text-[#8C857B] border-[#E8E2D9] hover:border-[#C5A059]'
                  }`}
                >
                  <Award className="w-3 h-3 text-[#C5A059]" />
                  <span>{loyaltyStatus.tierDef.name} • {loyaltyStatus.tierDef.discountPercent > 0 ? `-${loyaltyStatus.tierDef.discountPercent}%` : '0%'}</span>
                </button>
              </div>
              <p className="text-xs text-[#8C857B] flex items-center gap-2">
                <span>{profile.procedureName}</span>
                <span>•</span>
                <span>Termín: {profile.procedureDate}</span>
                <span>•</span>
                <span>Lekár: {profile.doctorName}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#E8E2D9]/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* FINANČNÉ METRIKY KLIENTA (4 KARTY) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* CELKOVÁ DOHODNUTÁ CENA */}
            <div className="bg-[#FBF9F6] p-4 rounded-2xl border border-[#E8E2D9]">
              <p className="text-[10px] uppercase font-bold text-[#8C857B] tracking-wider">Celková cena zákroku</p>
              <p className="text-2xl font-brand font-bold text-[#2C2A29] mt-1">
                {profile.totalAgreedPrice.toLocaleString('sk-SK')} €
              </p>
              <p className="text-[10px] text-[#8C857B] mt-0.5">Dohodnutá kalkulácia</p>
            </div>

            {/* ZÁLOHOVÁ PLATBA */}
            <div className={`p-4 rounded-2xl border ${
              profile.isDepositPaid 
                ? 'bg-emerald-50/60 border-emerald-200' 
                : 'bg-rose-50/60 border-rose-200'
            }`}>
              <div className="flex justify-between items-center">
                <p className="text-[10px] uppercase font-bold text-[#8C857B] tracking-wider">Záloha</p>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  profile.isDepositPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {profile.isDepositPaid ? 'Uhradená' : 'Neuhradená'}
                </span>
              </div>
              <p className={`text-2xl font-brand font-bold mt-1 ${
                profile.isDepositPaid ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                {profile.depositPaid} / {profile.depositRequired} €
              </p>
              <p className="text-[10px] text-[#8C857B] mt-0.5">Rezervácia sály & termínu</p>
            </div>

            {/* KREDIT PACIENTA */}
            <div className="bg-[#FBF9F6] p-4 rounded-2xl border border-[#E8E2D9] relative group">
              <div className="flex justify-between items-center">
                <p className="text-[10px] uppercase font-bold text-[#8C857B] tracking-wider">Kredit / Peňaženka</p>
                <Coins className="w-4 h-4 text-[#C5A059]" />
              </div>
              <p className="text-2xl font-brand font-bold text-[#C5A059] mt-1">
                {profile.clientCredit.toLocaleString('sk-SK')} €
              </p>
              <button
                type="button"
                onClick={() => setShowCreditForm(true)}
                className="text-[10px] font-bold text-[#C5A059] hover:underline mt-0.5 block"
              >
                + Upraviť kredit
              </button>
            </div>

            {/* ZOZTÁVA DOPLATIŤ */}
            <div className={`p-4 rounded-2xl border ${
              profile.balanceDue <= 0 
                ? 'bg-emerald-50/60 border-emerald-200' 
                : 'bg-amber-50/60 border-amber-200'
            }`}>
              <div className="flex justify-between items-center">
                <p className="text-[10px] uppercase font-bold text-[#8C857B] tracking-wider">K úhrade (doplatok)</p>
                {profile.balanceDue > 0 && <AlertCircle className="w-4 h-4 text-amber-600" />}
              </div>
              <p className={`text-2xl font-brand font-bold mt-1 ${
                profile.balanceDue <= 0 ? 'text-emerald-700' : 'text-amber-800'
              }`}>
                {profile.balanceDue.toLocaleString('sk-SK')} €
              </p>
              {profile.balanceDue > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setPayAmount(profile.balanceDue.toString());
                    setShowPaymentForm(true);
                  }}
                  className="text-[10px] font-bold text-amber-800 hover:underline mt-0.5 block"
                >
                  💳 Zaevidovať doplatok
                </button>
              ) : (
                <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">Kompletne vyrovnané</p>
              )}
            </div>
          </div>

          {/* FORMULÁR PRE ZAEVIDOVANIE PLATBY */}
          {showPaymentForm && (
            <div className="bg-[#FAF4E9] p-4 rounded-2xl border border-[#E6D4B2] animate-fadeIn space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-xs uppercase text-[#8A6827]">Zaevidovať platbu od klienta</h4>
                <button 
                  type="button" 
                  onClick={() => setShowPaymentForm(false)}
                  className="text-xs text-[#8C857B] hover:text-[#2C2A29]"
                >
                  ✕ Zavrieť
                </button>
              </div>

              <form onSubmit={handleRecordPayment} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Suma úhrady (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full border border-[#E8E2D9] p-2 rounded-xl text-xs bg-white font-mono font-bold text-[#2C2A29]"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Spôsob platby</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                    className="w-full border border-[#E8E2D9] p-2 rounded-xl text-xs bg-white text-[#2C2A29]"
                  >
                    <option value="card">Platobná karta / Terminál</option>
                    <option value="cash">Hotovosť</option>
                    <option value="bank_transfer">Bankový prevod</option>
                    <option value="credit_deduction">Odpočet z kreditu klienta</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Poznámka</label>
                  <input
                    type="text"
                    value={payNote}
                    onChange={(e) => setPayNote(e.target.value)}
                    placeholder="napr. Doplatok pred sálou"
                    className="w-full border border-[#E8E2D9] p-2 rounded-xl text-xs bg-white text-[#2C2A29]"
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    className="w-full bg-[#2C2A29] hover:bg-[#C5A059] text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                  >
                    Potvrdiť úhradu
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* FORMULÁR PRE ÚPRAVU KREDITU */}
          {showCreditForm && (
            <div className="bg-[#FBF9F6] p-4 rounded-2xl border border-[#C5A059]/40 animate-fadeIn space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-xs uppercase text-[#2C2A29] flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-[#C5A059]" />
                  Dobiť alebo upraviť kredit pacienta
                </h4>
                <button 
                  type="button" 
                  onClick={() => setShowCreditForm(false)}
                  className="text-xs text-[#8C857B] hover:text-[#2C2A29]"
                >
                  ✕ Zavrieť
                </button>
              </div>

              <form onSubmit={handleAdjustCredit} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Operácia</label>
                  <select
                    value={creditAction}
                    onChange={(e) => setCreditAction(e.target.value as 'add' | 'deduct')}
                    className="w-full border border-[#E8E2D9] p-2 rounded-xl text-xs bg-white text-[#2C2A29]"
                  >
                    <option value="add">+ Dobiť / Pridať kredit</option>
                    <option value="deduct">- Odpočítať kredit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Suma (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    className="w-full border border-[#E8E2D9] p-2 rounded-xl text-xs bg-white font-mono font-bold text-[#2C2A29]"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Typ pohybu</label>
                  <select
                    value={creditType}
                    onChange={(e) => setCreditType(e.target.value as any)}
                    className="w-full border border-[#E8E2D9] p-2 rounded-xl text-xs bg-white text-[#2C2A29]"
                  >
                    <option value="deposit_topup">Vklad zálohy / Hotovosť</option>
                    <option value="gift_voucher">Darčekový poukaz</option>
                    <option value="refund">Preplatok / Kompenzácia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Dôvod / Poznámka</label>
                  <input
                    type="text"
                    value={creditNote}
                    onChange={(e) => setCreditNote(e.target.value)}
                    placeholder="napr. Darčekový poukaz od rodiny"
                    className="w-full border border-[#E8E2D9] p-2 rounded-xl text-xs bg-white text-[#2C2A29]"
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    className="w-full bg-[#C5A059] hover:bg-[#b08d48] text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                  >
                    Uložiť zmenu
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* DVA STĹPCE: REÁLNA SPOTREBA MATERIÁLU ZO SKLADU & FAKTÚRY / RENTABILITA */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* SPOTREBOVANÝ MATERIÁL ZO SKLADU (7 STĹPCOV) */}
            <div className="lg:col-span-7 bg-[#FBF9F6] p-5 rounded-2xl border border-[#E8E2D9] space-y-4">
              <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-3">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#2C2A29]" />
                  <h4 className="font-bold text-xs uppercase text-[#2C2A29] tracking-wider">
                    Reálna spotreba materiálu zo skladu
                  </h4>
                </div>
                <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                  Náklad: -{materialUsage.totalCost.toFixed(2)} €
                </span>
              </div>

              {materialUsage.logs.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#8C857B] space-y-1">
                  <p>Pre tohto klienta zatiaľ nebol zaevidovaný spotrebovaný materiál.</p>
                  <p className="text-[10px]">Materiál sa automaticky odpisuje zo skladu v operačnom protokole alebo v záložke Sklad & Materiál.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#E8E2D9] text-[10px] uppercase text-[#8C857B]">
                        <th className="pb-2">Dátum</th>
                        <th className="pb-2">Názov materiálu</th>
                        <th className="pb-2">Množstvo</th>
                        <th className="pb-2">Šarža / LOT</th>
                        <th className="pb-2 text-right">Nákupná cena</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E2D9]">
                      {materialUsage.logs.map((log) => (
                        <tr key={log.id} className="hover:bg-white/60">
                          <td className="py-2 text-[#8C857B] font-mono text-[11px]">{log.date}</td>
                          <td className="py-2 font-semibold text-[#2C2A29]">
                            {log.itemName}
                            <span className="block text-[10px] text-[#8C857B] font-normal">{log.procedureName}</span>
                          </td>
                          <td className="py-2 font-mono">{log.quantity} {log.unit}</td>
                          <td className="py-2 font-mono text-[11px] text-[#8C857B]">{log.lotNumber || '—'}</td>
                          <td className="py-2 text-right font-mono font-bold text-rose-600">
                            {(log.costAtUsage * log.quantity).toFixed(2)} €
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* RENTABILITA / UNIT ECONOMICS PRE TENTO ZÁKROK */}
              <div className="p-4 rounded-xl bg-white border border-[#E8E2D9] flex justify-between items-center">
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#8C857B] tracking-wider">Hrubý zisk zo zákroku (Marža)</p>
                  <p className="text-xl font-brand font-bold text-emerald-700 mt-0.5">
                    +{(profile.totalAgreedPrice - materialUsage.totalCost).toFixed(2)} €
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-[#8C857B] tracking-wider">Maržovosť</p>
                  <p className="text-xl font-mono font-bold text-[#C5A059] mt-0.5">
                    {profile.totalAgreedPrice > 0 
                      ? (((profile.totalAgreedPrice - materialUsage.totalCost) / profile.totalAgreedPrice) * 100).toFixed(1)
                      : '0'} %
                  </p>
                </div>
              </div>
            </div>

            {/* EVIDENCIA EXTERNÝCH FAKTÚR (ZF & DF) Z ÚČTOVNÉHO PROGRAMU (5 STĹPCOV) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-[#FBF9F6] p-5 rounded-2xl border border-[#E8E2D9] space-y-4 shadow-2xs">
                <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#C5A059]" />
                    <h4 className="font-bold text-xs uppercase text-[#2C2A29] tracking-wider">
                      Faktúry z účtovného programu
                    </h4>
                  </div>
                  {saveSuccess && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 animate-fadeIn">
                      <Check className="w-3 h-3 text-emerald-600" />
                      Uložené
                    </span>
                  )}
                </div>

                <form onSubmit={handleSaveInvoices} className="space-y-4">
                  {/* 1. BLOK: ZÁLOHOVÁ FAKTÚRA (ZF) */}
                  <div className="bg-white p-3.5 rounded-xl border border-[#E8E2D9] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        Zálohová faktúra (ZF)
                      </span>
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-[#2C2A29]">
                        <input
                          type="checkbox"
                          checked={isAdvPaid}
                          onChange={(e) => {
                            setIsAdvPaid(e.target.checked);
                            if (e.target.checked && !advDate) {
                              setAdvDate(new Date().toISOString().split('T')[0]);
                            }
                          }}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                        />
                        <span className={isAdvPaid ? 'text-emerald-700 font-bold' : 'text-[#8C857B]'}>
                          {isAdvPaid ? '✓ Uhradená' : 'Neuhradená'}
                        </span>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Číslo ZF</label>
                        <input
                          type="text"
                          value={advanceNumber}
                          onChange={(e) => setAdvanceNumber(e.target.value)}
                          placeholder="napr. 20260012"
                          className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs font-mono font-bold text-[#2C2A29] bg-[#FBF9F6] focus:bg-white focus:outline-none focus:border-[#C5A059]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Suma zálohy (€)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={advanceAmt}
                          onChange={(e) => setAdvanceAmt(e.target.value)}
                          placeholder="0.00"
                          className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs font-mono font-bold text-[#2C2A29] bg-[#FBF9F6] focus:bg-white focus:outline-none focus:border-[#C5A059]"
                        />
                      </div>
                    </div>

                    {isAdvPaid && (
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#F0ECE1]">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Dátum úhrady</label>
                          <input
                            type="date"
                            value={advDate}
                            onChange={(e) => setAdvDate(e.target.value)}
                            className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-[11px] font-mono text-[#2C2A29] bg-[#FBF9F6]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Spôsob úhrady</label>
                          <select
                            value={advMethod}
                            onChange={(e) => setAdvMethod(e.target.value as PaymentMethod)}
                            className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-[11px] text-[#2C2A29] bg-[#FBF9F6]"
                          >
                            <option value="bank_transfer">Bankový prevod</option>
                            <option value="card">Platobná karta</option>
                            <option value="cash">Hotovosť</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. BLOK: DEFINITÍVNA FAKTÚRA (DF) */}
                  <div className="bg-white p-3.5 rounded-xl border border-[#E8E2D9] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        Definitívna faktúra (DF)
                      </span>
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-[#2C2A29]">
                        <input
                          type="checkbox"
                          checked={isFinPaid}
                          onChange={(e) => {
                            setIsFinPaid(e.target.checked);
                            if (e.target.checked && !finDate) {
                              setFinDate(new Date().toISOString().split('T')[0]);
                            }
                          }}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                        />
                        <span className={isFinPaid ? 'text-emerald-700 font-bold' : 'text-[#8C857B]'}>
                          {isFinPaid ? '✓ Uhradená' : 'Neuhradená'}
                        </span>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Číslo DF</label>
                        <input
                          type="text"
                          value={finalNumber}
                          onChange={(e) => setFinalNumber(e.target.value)}
                          placeholder="napr. 20260145"
                          className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs font-mono font-bold text-[#2C2A29] bg-[#FBF9F6] focus:bg-white focus:outline-none focus:border-[#C5A059]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Suma DF (€)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={finalAmt}
                          onChange={(e) => setFinalAmt(e.target.value)}
                          placeholder="0.00"
                          className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs font-mono font-bold text-[#2C2A29] bg-[#FBF9F6] focus:bg-white focus:outline-none focus:border-[#C5A059]"
                        />
                      </div>
                    </div>

                    {isFinPaid && (
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#F0ECE1]">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Dátum úhrady</label>
                          <input
                            type="date"
                            value={finDate}
                            onChange={(e) => setFinDate(e.target.value)}
                            className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-[11px] font-mono text-[#2C2A29] bg-[#FBF9F6]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Spôsob úhrady</label>
                          <select
                            value={finMethod}
                            onChange={(e) => setFinMethod(e.target.value as PaymentMethod)}
                            className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-[11px] text-[#2C2A29] bg-[#FBF9F6]"
                          >
                            <option value="card">Platobná karta</option>
                            <option value="bank_transfer">Bankový prevod</option>
                            <option value="cash">Hotovosť</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#2C2A29] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Uložiť fakturačné údaje</span>
                  </button>
                </form>
              </div>
            </div>

          </div>

        </div>

        {/* SPODNÁ LIŠTA */}
        <div className="flex justify-between items-center px-6 py-4 bg-[#FBF9F6] border-t border-[#E8E2D9]">
          <span className="text-xs text-[#8C857B]">
            ID profilu: <span className="font-mono">{profile.id}</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#2C2A29] text-white text-xs font-bold hover:bg-[#C5A059] transition-colors"
          >
            Zavrieť detail
          </button>
        </div>

      </div>
    </div>
  );
}
