'use client';

import React, { useState } from 'react';
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
  Package 
} from 'lucide-react';

interface ClientFinanceDetailModalProps {
  profile: PatientFinancialProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated: (updated: PatientFinancialProfile) => void;
  onOpenInvoiceDetail: (invoiceNumber: string) => void;
  onCreateInvoiceForClient: (clientName: string, procedureName: string, amount: number, type: 'advance' | 'standard') => void;
}

export default function ClientFinanceDetailModal({
  profile,
  isOpen,
  onClose,
  onProfileUpdated,
  onOpenInvoiceDetail,
  onCreateInvoiceForClient
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

  if (!isOpen || !profile) return null;

  const isPlanned = profile.status === 'planned';

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
              <h3 className="font-brand text-xl font-bold text-[#2C2A29]">
                {profile.patientName}
              </h3>
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

            {/* PREPOJENÉ FAKTÚRY & AKCIE (5 STĹPCOV) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-[#FBF9F6] p-5 rounded-2xl border border-[#E8E2D9] space-y-4">
                <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#2C2A29]" />
                    <h4 className="font-bold text-xs uppercase text-[#2C2A29] tracking-wider">
                      Vystavené faktúry & Zálohy
                    </h4>
                  </div>
                </div>

                {profile.invoices.length === 0 ? (
                  <p className="text-xs text-[#8C857B] py-2">
                    Pre tohto klienta zatiaľ nie je vystavená žiadna faktúra.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {profile.invoices.map((invNum) => (
                      <div 
                        key={invNum}
                        onClick={() => onOpenInvoiceDetail(invNum)}
                        className="flex justify-between items-center p-2.5 bg-white rounded-xl border border-[#E8E2D9] hover:border-[#C5A059] cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#C5A059]" />
                          <span className="font-mono font-bold text-xs text-[#2C2A29] group-hover:text-[#C5A059]">
                            {invNum}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#8C857B] font-bold group-hover:underline">
                          Náhľad a tlač ➔
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* TLAČIDLÁ PRE VYSTAVENIE FAKTÚR */}
                <div className="space-y-2 pt-2 border-t border-[#E8E2D9]">
                  <button
                    type="button"
                    onClick={() => onCreateInvoiceForClient(profile.patientName, profile.procedureName, profile.depositRequired || 800, 'advance')}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-bold transition-colors border border-amber-300"
                  >
                    <span>📄 Vystaviť zálohovú faktúru (ZF)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onCreateInvoiceForClient(profile.patientName, profile.procedureName, profile.balanceDue || profile.totalAgreedPrice, 'standard')}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#2C2A29] hover:bg-[#C5A059] text-white text-xs font-bold transition-colors shadow-xs"
                  >
                    <span>🧾 Vystaviť konečnú faktúru (FA)</span>
                  </button>
                </div>
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
