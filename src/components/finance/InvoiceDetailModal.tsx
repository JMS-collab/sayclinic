'use client';

import React, { useRef } from 'react';
import { Invoice, FinanceBillingService, PaymentMethod } from '@/services/financeBillingService';
import { 
  X, 
  Printer, 
  CheckCircle2, 
  Clock, 
  QrCode 
} from 'lucide-react';

interface InvoiceDetailModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onInvoiceUpdated?: (updatedInvoice: Invoice) => void;
}

export default function InvoiceDetailModal({
  invoice,
  isOpen,
  onClose,
  onInvoiceUpdated
}: InvoiceDetailModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !invoice) return null;

  const isAdvance = invoice.type === 'advance';
  const isPaid = invoice.status === 'paid';

  const handlePrint = () => {
    if (typeof window === 'undefined') return;
    window.print();
  };

  const handleMarkAsPaid = (method: PaymentMethod) => {
    const updated = FinanceBillingService.markInvoicePaid(invoice.id, method);
    if (updated && onInvoiceUpdated) {
      onInvoiceUpdated(updated);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn print:p-0 print:bg-white">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-[#E8E2D9] my-8 overflow-hidden print:border-none print:shadow-none print:m-0 print:w-full print:max-w-none">
        
        {/* HORNÁ LIŠTA S AKCIAMI (SKRYTÁ PRI TLAČI) */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#FBF9F6] border-b border-[#E8E2D9] print:hidden">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              isAdvance 
                ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                : 'bg-purple-100 text-purple-900 border border-purple-300'
            }`}>
              {isAdvance ? '📄 Zálohová faktúra' : '🧾 Daňový doklad / Faktúra'}
            </span>
            <span className="font-mono font-bold text-sm text-[#2C2A29]">
              {invoice.invoiceNumber}
            </span>
            <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
              isPaid 
                ? 'bg-emerald-100 text-emerald-800' 
                : 'bg-rose-100 text-rose-800'
            }`}>
              {isPaid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
              {isPaid ? 'UHRADENÁ' : 'ČAKÁ NA ÚHRADU'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isPaid && (
              <div className="flex items-center gap-1 mr-2">
                <button
                  type="button"
                  onClick={() => handleMarkAsPaid('bank_transfer')}
                  className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-xs"
                >
                  ✓ Uhradiť prevodom
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAsPaid('card')}
                  className="px-3 py-1.5 text-xs font-bold bg-[#2C2A29] hover:bg-[#C5A059] text-white rounded-xl transition-all shadow-xs"
                >
                  💳 Terminál / Karta
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAsPaid('cash')}
                  className="px-3 py-1.5 text-xs font-bold bg-[#8C857B] hover:bg-[#6b655d] text-white rounded-xl transition-all shadow-xs"
                >
                  💶 Hotovosť
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C5A059] hover:bg-[#b08d48] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Tlačiť doklad
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#E8E2D9]/40 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SAMOTNÉ TELO DOKLADU NA TLAČ */}
        <div ref={printRef} className="p-8 sm:p-12 space-y-8 text-[#2C2A29] bg-white print:p-0 print:space-y-6">
          
          {/* HLAVIČKA FAKTÚRY */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b-2 border-[#C5A059] pb-6">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2C2A29] flex items-center justify-center text-[#C5A059] font-brand font-bold text-xl">
                  S
                </div>
                <div>
                  <h1 className="font-brand text-2xl font-bold tracking-widest text-[#2C2A29] uppercase">SAY CLINIC</h1>
                  <p className="text-[10px] tracking-widest uppercase text-[#8C857B] font-semibold">Klinika plastickej chirurgie & estetickej medicíny</p>
                </div>
              </div>
              <div className="mt-4 text-xs text-[#6B655D] space-y-0.5">
                <p className="font-bold text-[#2C2A29]">SAY CLINIC s.r.o.</p>
                <p>Rudlovská cesta 85, 974 11 Banská Bystrica</p>
                <p>IČO: 52 123 456 | DIČ: 2120987654 | IČ DPH: SK2120987654</p>
                <p className="text-[10px] text-[#8C857B]">Zapísaná v OR Okresného súdu Banská Bystrica, oddiel Sro, vl. č. 36789/S</p>
              </div>
            </div>

            <div className="text-right sm:w-72 bg-[#FBF9F6] p-4 rounded-2xl border border-[#E8E2D9]">
              <h2 className="text-lg font-bold font-brand uppercase text-[#2C2A29]">
                {isAdvance ? 'ZÁLOHOVÁ FAKTÚRA' : 'FAKTÚRA - DAŇOVÝ DOKLAD'}
              </h2>
              <p className="font-mono text-xl font-bold text-[#C5A059] mt-1">
                {invoice.invoiceNumber}
              </p>
              <div className="mt-3 text-xs space-y-1 text-left">
                <div className="flex justify-between">
                  <span className="text-[#8C857B]">Variabilný symbol:</span>
                  <span className="font-mono font-bold text-[#2C2A29]">{invoice.variableSymbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8C857B]">Dátum vystavenia:</span>
                  <span className="font-medium text-[#2C2A29]">{invoice.issueDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8C857B]">Dátum splatnosti:</span>
                  <span className="font-bold text-rose-700">{invoice.dueDate}</span>
                </div>
                {invoice.deliveryDate && (
                  <div className="flex justify-between">
                    <span className="text-[#8C857B]">Dátum dodania:</span>
                    <span className="font-medium text-[#2C2A29]">{invoice.deliveryDate}</span>
                  </div>
                )}
                {isPaid && (
                  <div className="flex justify-between pt-1 border-t border-[#E8E2D9]">
                    <span className="text-emerald-700 font-bold">Uhradené dňa:</span>
                    <span className="font-bold text-emerald-700">{invoice.paidDate || invoice.dueDate}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* DVA STĹPCE: DODÁVATEĽ A ODBERATEĽ / PLATOBNÉ ÚDAJE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {/* PLATOBNÉ ÚDAJE */}
            <div className="bg-[#FBF9F6] p-5 rounded-2xl border border-[#E8E2D9] space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-[#8C857B] font-bold">Bankové spojenie & Platobné údaje</p>
              <div className="space-y-1 text-xs">
                <p><span className="text-[#8C857B]">Banka:</span> <span className="font-semibold">Tatra banka, a.s.</span></p>
                <p><span className="text-[#8C857B]">IBAN:</span> <span className="font-mono font-bold tracking-wider text-[#2C2A29]">SK48 1100 0000 0029 4512 8890</span></p>
                <p><span className="text-[#8C857B]">SWIFT / BIC:</span> <span className="font-mono font-semibold">TATRSKBX</span></p>
                <p><span className="text-[#8C857B]">Spôsob úhrady:</span> <span className="font-semibold capitalize">{invoice.paymentMethod === 'bank_transfer' ? 'Bankový prevod' : invoice.paymentMethod === 'card' ? 'Platobná karta' : invoice.paymentMethod === 'cash' ? 'Hotovosť' : 'Kreditný odpočet'}</span></p>
                <p><span className="text-[#8C857B]">Konštantný symbol:</span> <span className="font-mono font-semibold">0308</span></p>
              </div>
            </div>

            {/* ODBERATEĽ */}
            <div className="bg-[#FBF9F6] p-5 rounded-2xl border border-[#E8E2D9] space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-[#8C857B] font-bold">Odberateľ (Klient / Pacient)</p>
              <div className="text-xs space-y-1">
                <p className="font-bold text-base text-[#2C2A29]">{invoice.patientName}</p>
                {invoice.patientBirthNumber && (
                  <p className="text-[#6B655D]">Rodné číslo: <span className="font-mono font-medium">{invoice.patientBirthNumber}</span></p>
                )}
                <p className="text-[#6B655D]">{invoice.patientAddress || 'Banská Bystrica, Slovenská republika'}</p>
                {invoice.patientPhone && (
                  <p className="text-[#6B655D]">Tel: {invoice.patientPhone}</p>
                )}
                {invoice.patientEmail && (
                  <p className="text-[#6B655D]">Email: {invoice.patientEmail}</p>
                )}
              </div>
            </div>
          </div>

          {/* TABUĽKA POLOŽIEK */}
          <div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-[#2C2A29] text-[10px] uppercase text-[#8C857B] font-bold">
                  <th className="py-2.5 px-2">#</th>
                  <th className="py-2.5 px-2">Názov položky / Výkon / Služba</th>
                  <th className="py-2.5 px-2 text-center">Množstvo</th>
                  <th className="py-2.5 px-2 text-right">Jedn. cena bez DPH</th>
                  <th className="py-2.5 px-2 text-center">DPH %</th>
                  <th className="py-2.5 px-2 text-right">Spolu s DPH (€)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9]">
                {invoice.items.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-[#FBF9F6]/50">
                    <td className="py-3 px-2 text-[#8C857B] font-mono">{idx + 1}</td>
                    <td className="py-3 px-2">
                      <p className="font-semibold text-[#2C2A29]">{item.description}</p>
                      {item.unitPrice < 0 && (
                        <span className="text-[10px] text-emerald-700 font-semibold">Odpočet uhradenej zálohy</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center font-mono">{item.quantity} {item.unit}</td>
                    <td className="py-3 px-2 text-right font-mono">
                      {(item.unitPrice / (1 + item.vatRate / 100)).toFixed(2)} €
                    </td>
                    <td className="py-3 px-2 text-center font-mono">
                      {item.vatRate === 0 ? '0 % (oslob.)' : `${item.vatRate} %`}
                    </td>
                    <td className={`py-3 px-2 text-right font-bold font-mono ${
                      item.total < 0 ? 'text-emerald-700' : 'text-[#2C2A29]'
                    }`}>
                      {item.total.toFixed(2)} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SÚHRN SUMY & QR KÓD */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-8 pt-4 border-t border-[#E8E2D9]">
            {/* ĽAVÁ STRANA: PAY BY SQUARE QR KÓD & POZNÁMKY */}
            <div className="flex items-start gap-4 max-w-sm">
              <div className="w-28 h-28 bg-[#FBF9F6] border-2 border-dashed border-[#C5A059]/60 rounded-2xl flex flex-col items-center justify-center p-2 text-center shrink-0">
                <QrCode className="w-12 h-12 text-[#2C2A29] mb-1" />
                <span className="text-[9px] font-bold text-[#C5A059] uppercase tracking-wider">PAY by square</span>
              </div>
              <div className="text-[11px] text-[#6B655D] space-y-1">
                <p className="font-bold text-[#2C2A29]">Rýchla platba mobilom</p>
                <p>Naskenujte QR kód vo vašej bankovej aplikácii (Tatra banka, VÚB, SLSP, ČSOB, Prima banka).</p>
                <p className="text-[10px] text-[#8C857B] italic">Zdravotná starostlivosť a súvisiace výkony sú oslobodené od DPH podľa § 29 zákona č. 222/2004 Z.z. o DPH.</p>
              </div>
            </div>

            {/* PRAVÁ STRANA: REKAPITULÁCIA SUMY */}
            <div className="w-full sm:w-80 space-y-2 bg-[#FBF9F6] p-5 rounded-2xl border border-[#E8E2D9]">
              <div className="flex justify-between text-xs text-[#6B655D]">
                <span>Základ bez DPH:</span>
                <span className="font-mono font-medium">{invoice.subtotal.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-xs text-[#6B655D]">
                <span>DPH celkovo:</span>
                <span className="font-mono font-medium">{invoice.vatAmount.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#2C2A29] pt-2 border-t border-[#E8E2D9]">
                <span>Celková suma:</span>
                <span className="font-mono text-xl text-[#C5A059]">{invoice.totalAmount.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-emerald-800 pt-1">
                <span>Zaplatené:</span>
                <span className="font-mono">{invoice.paidAmount.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-rose-700 pt-1 border-t border-[#E8E2D9]">
                <span>K úhrade (zostáva):</span>
                <span className="font-mono text-sm">{invoice.remainingAmount.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          {/* PEČIATKA, PODPIS A VYSTAVIL */}
          <div className="flex justify-between items-end pt-8 border-t border-[#E8E2D9] text-xs text-[#8C857B]">
            <div>
              <p>Vystavil(a): <span className="font-semibold text-[#2C2A29]">{invoice.createdBy || 'SAY CLINIC Manažment'}</span></p>
              <p>Dátum tlače dokladu: <span className="font-mono">{new Date().toLocaleDateString('sk-SK')}</span></p>
            </div>

            <div className="text-center w-56 border-t border-dashed border-[#8C857B] pt-2">
              <p className="text-[10px] uppercase font-bold text-[#2C2A29]">Pečiatka a podpis</p>
              <p className="text-[9px] text-[#8C857B]">SAY CLINIC s.r.o.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
