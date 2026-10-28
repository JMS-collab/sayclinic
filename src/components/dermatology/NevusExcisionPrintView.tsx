'use client';

import React from 'react';
import { NevusExcisionData } from './nevusExcisionTypes';

interface NevusExcisionPrintViewProps {
  data: NevusExcisionData;
}

export default function NevusExcisionPrintView({ data }: NevusExcisionPrintViewProps) {
  // Calculations
  const subtotal = data.items.reduce((acc, it) => acc + (Number(it.price) || 0), 0);
  const discountAmount = data.discountType === 'percent'
    ? (subtotal * (Number(data.discountValue) || 0)) / 100
    : Math.min(subtotal, Number(data.discountValue) || 0);
  const finalPrice = Math.max(0, subtotal - discountAmount);

  const methodBadgeText = {
    chirurgicky: 'Chirurgická excízia (skalpelová)',
    laser: 'Laserová ablácia / vaporizácia (CO2)',
    kombinovane: 'Kombinovaný zákrok (Chirurgia + Laser)'
  }[data.primaryMethod];

  const paymentMethodLabel = {
    karta: 'Platobná karta (POS terminál)',
    hotovost: 'Hotovosť',
    prevod: 'Bankový prevod',
    poukaz: 'Darčekový poukaz / Kredit'
  }[data.paymentMethod];

  const paymentStatusLabel = {
    uhradene: 'Uhradené',
    pos_caka: 'Čaká na úhradu na recepcii',
    faktura: 'Fakturované'
  }[data.paymentStatus];

  const histologyCount = data.items.filter(i => i.histology).length;

  return (
    <div className="space-y-6 text-[#2C2A29]">
      {/* 1. ZÁKROKOVÝ A METODICKÝ SÚHRN */}
      <div className="border border-[#E8E2D9] rounded-xl p-3.5 bg-[#FBF9F6]">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-2.5 pb-2 border-b border-[#E8E2D9]">
          <div className="flex items-center gap-2">
            <span className="text-[9px] uppercase font-bold text-[#C5A059] tracking-wider">
              Zákrokový protokol
            </span>
            <span className="bg-[#2C2A29] text-white px-2 py-0.5 rounded text-[9px] font-bold">
              {methodBadgeText}
            </span>
          </div>
          <span className="text-[9px] text-[#8C857B] font-mono">
            Počet ošetrených lézií: <strong className="text-[#2C2A29]">{data.items.length}</strong>
            {histologyCount > 0 && ` | Biopsia: ${histologyCount} vz.`}
          </span>
        </div>

        <div className="space-y-2 text-[10px]">
          {/* Indikácia na plnú šírku */}
          <div className="bg-white p-2.5 rounded-lg border border-[#E8E2D9]/80 flex flex-wrap items-baseline gap-1.5">
            <span className="text-[8px] text-[#8C857B] uppercase font-bold tracking-wider shrink-0">
              Klinická indikácia:
            </span>
            <span className="font-bold text-[#2C2A29] text-[11px] leading-snug">
              {data.indication || 'Preventívna onkodermatologická indikácia na základe dermatoskopie'}
            </span>
          </div>

          {/* Anestézia a dezinfekcia */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="bg-white p-2 rounded-lg border border-[#E8E2D9]/80">
              <span className="block text-[8px] text-[#8C857B] uppercase font-bold">Lokálna anestézia & Dávka</span>
              <span className="font-semibold text-[#2C2A29] text-[10px]">
                {data.anesthesiaType || 'Mesocain 1% + Adrenalín'} {data.anesthesiaVolume && `(${data.anesthesiaVolume})`}
              </span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-[#E8E2D9]/80">
              <span className="block text-[8px] text-[#8C857B] uppercase font-bold">Antisepsa & príprava poľa</span>
              <span className="font-semibold text-[#2C2A29] text-[10px]">
                {data.disinfection || 'Skinman Soft / Cutasept F'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PROTOKOL A TABUĽKA ODSTRÁNENÝCH LÉZIÍ */}
      <div className="border border-[#E8E2D9] rounded-xl p-3.5 bg-white space-y-2.5 print-avoid-break">
        <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-1.5">
          <p className="text-[9px] uppercase font-bold text-[#C5A059] tracking-wider">
            Špecifikácia odstránených lézií & použitý postup
          </p>
          <span className="text-[8px] text-[#8C857B]">
            Jednotlivé položky zákroku ({data.items.length})
          </span>
        </div>

        {data.items.length === 0 ? (
          <p className="text-xs text-[#8C857B] italic py-2">Nie sú zadané žiadne položky výkonu.</p>
        ) : (
          <div className="border border-[#E8E2D9] rounded-xl overflow-x-auto text-[10px]">
            <table className="w-full text-left border-collapse min-w-[540px]">
              <thead>
                <tr className="bg-[#2C2A29] text-white text-[9px] uppercase tracking-wider">
                  <th className="p-2 font-bold w-7 text-center">#</th>
                  <th className="p-2 font-bold w-[22%]">Lokalizácia</th>
                  <th className="p-2 font-bold w-[28%]">Nález / Predbežná dg</th>
                  <th className="p-2 font-bold w-[22%]">Metóda & Ošetrenie</th>
                  <th className="p-2 font-bold w-[16%]">Histológia (HP)</th>
                  <th className="p-2 font-bold text-right w-[12%]">Cena</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9]">
                {data.items.map((item, idx) => (
                  <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#FBF9F6]'}>
                    <td className="p-2 text-center font-bold text-[#C5A059]">{idx + 1}</td>
                    <td className="p-2 font-bold text-[#2C2A29] leading-snug">{item.location}</td>
                    <td className="p-2 text-[#2C2A29] leading-snug">{item.typeOrDiagnosis}</td>
                    <td className="p-2">
                      <div className="font-semibold text-[#2C2A29] text-[9px]">
                        {item.method === 'laser_vaporizacia' 
                          ? 'CO2 Laser' 
                          : item.method === 'shave_excizia' 
                          ? 'Shave excízia' 
                          : 'Chirurgická excízia'}
                      </div>
                      <div className="text-[8px] text-[#8C857B] mt-0.5 leading-tight">
                        {item.sutureType}
                      </div>
                    </td>
                    <td className="p-2">
                      {item.histology ? (
                        <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold text-[8px] whitespace-nowrap">
                          Áno {item.histologyCode && `(${item.histologyCode})`}
                        </span>
                      ) : (
                        <span className="text-[#8C857B] text-[8px]">Bez HP (benígne)</span>
                      )}
                    </td>
                    <td className="p-2 font-bold text-right text-[#2C2A29] font-mono whitespace-nowrap">
                      {Number(item.price).toFixed(2)} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. ZÚČTOVANIE VÝKONU (FINANČNÝ SÚHRN) */}
      <div className="border border-[#C5A059]/50 rounded-xl p-3.5 bg-[#FBF9F6] print-avoid-break">
        <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-2 mb-2.5">
          <span className="text-[9px] uppercase font-bold text-[#C5A059] tracking-wider">
            Zúčtovanie výkonu a platobné podmienky
          </span>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-white border border-[#E8E2D9] text-[#2C2A29]">
            Stav: <strong className={data.paymentStatus === 'uhradene' ? 'text-emerald-700' : 'text-amber-800'}>{paymentStatusLabel}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div className="text-[10px] space-y-1 text-[#8C857B]">
            <p><strong className="text-[#2C2A29]">Spôsob úhrady:</strong> {paymentMethodLabel}</p>
            <p>Výkon bol realizovaný v súlade so schváleným cenníkom SAY CLINIC s.r.o.</p>
            <p className="text-[8px] italic leading-tight">V cene chirurgickej excízie je zahrnuté: lokálna anestézia, samotná excízia, plastická sutúra, sterilné krytie a následné vybratie stehov.</p>
          </div>

          <div className="bg-white p-3 rounded-lg border border-[#E8E2D9] space-y-1 text-right text-xs">
            <div className="flex justify-between text-[#8C857B] text-[10px]">
              <span>Medzisúčet položiek:</span>
              <span className="font-mono">{subtotal.toFixed(2)} €</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-rose-700 text-[10px] font-semibold">
                <span>Zľava {data.discountType === 'percent' ? `(${data.discountValue}%)` : '(fixná)'}:</span>
                <span className="font-mono">-{discountAmount.toFixed(2)} €</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-1.5 border-t border-[#E8E2D9] font-bold text-sm text-[#2C2A29]">
              <span className="uppercase text-[10px] tracking-wider text-[#C5A059]">K úhrade spolu:</span>
              <span className="text-base font-extrabold text-[#2C2A29] font-mono">{finalPrice.toFixed(2)} €</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. OPERAČNÝ NÁLEZ A POSTUP */}
      <div className="border border-[#E8E2D9] rounded-xl p-3.5 bg-white space-y-1.5 print-avoid-break">
        <p className="text-[9px] uppercase font-bold text-[#C5A059] tracking-wider border-b border-[#E8E2D9] pb-1">
          Popis priebehu výkonu a operačný nález
        </p>
        <p className="text-xs leading-relaxed text-[#2C2A29] whitespace-pre-line bg-[#FBF9F6] p-2.5 rounded-lg border border-[#E8E2D9]/50">
          {data.procedureCourse || 'Dezinfekcia operačného poľa, lokálna infiltrácia anestetikom. Zákrok prebehol bez komplikácií, dosiahnutá spoľahlivá hemostáza, aplikované sterilné krytie.'}
        </p>
        {data.doctorNotes && (
          <div className="pt-1 text-[10px]">
            <span className="text-[#8C857B] uppercase font-bold text-[8px] block">Doplňujúca poznámka lekára:</span>
            <p className="text-[#2C2A29] italic">{data.doctorNotes}</p>
          </div>
        )}
      </div>

      {/* 5. POKYNY PRE PACIENTA & POOPERAČNÝ REŽIM */}
      <div className="border border-[#E8E2D9] rounded-xl p-3.5 bg-[#FBF9F6] space-y-3 print-avoid-break">
        <p className="text-[9px] uppercase font-bold text-[#C5A059] tracking-wider border-b border-[#E8E2D9] pb-1">
          Pooperačný režim, ošetrovanie a pokyny pre pacienta
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs leading-relaxed">
          {/* OŠETROVANIE A REŽIM */}
          <div>
            <strong className="text-[#8C857B] uppercase text-[8px] block mb-1">
              1. Ošetrovanie operačných rán:
            </strong>
            <ul className="list-disc pl-4 space-y-1 bg-white p-2.5 rounded-lg border border-[#E8E2D9] text-[#2C2A29] text-[10px]">
              {data.aftercareInstructions && data.aftercareInstructions.length > 0 ? (
                data.aftercareInstructions.map((inst, i) => (
                  <li key={i}>{inst}</li>
                ))
              ) : (
                <li>Ranu udržiavať v suchu a čistote po dobu 48 hodín.</li>
              )}
            </ul>
          </div>

          {/* VYBRATIE STEHOV & HISTOLÓGIA */}
          <div className="space-y-2">
            <div>
              <strong className="text-[#8C857B] uppercase text-[8px] block mb-0.5">
                2. Extrakcia stehov (sutúry):
              </strong>
              <p className="bg-white p-2 rounded-lg border border-[#E8E2D9] text-[#2C2A29] text-[10px] font-medium">
                {data.sutureRemovalNotes || 'Termín vybratia stehov: podľa lokalizácie (tvár 7 dní, telo 10–14 dní).'}
              </p>
            </div>

            <div>
              <strong className="text-[#8C857B] uppercase text-[8px] block mb-0.5">
                3. Výsledky histologického vyšetrenia:
              </strong>
              <p className="bg-white p-2 rounded-lg border border-[#E8E2D9] text-[#2C2A29] text-[10px]">
                {data.histologyNotice || 'Výsledky bioptického vyšetrenia sú k dispozícii o 10–14 pracovných dní. O výsledku bude pacient informovaný SMS/telefonicky.'}
              </p>
            </div>
          </div>
        </div>

        {/* FOTOPROTEKCIA A VAROVNÉ PRÍZNAKY */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] pt-1 border-t border-[#E8E2D9]">
          <div className="bg-amber-50/70 border border-amber-200 p-2.5 rounded-lg">
            <strong className="text-amber-900 uppercase text-[8px] block mb-0.5 font-bold">
              4. Fotoprotekcia a starostlivosť o jazvu:
            </strong>
            <p className="text-amber-950 text-[9px] leading-tight">
              {data.photoprotection || 'Striktná ochrana pred UV žiarením (SPF 50+ minerálny krém) po dobu minimálne 3 až 6 mesiacov na prevenciu hyperpigmentácie.'}
            </p>
          </div>

          <div className="bg-rose-50/70 border border-rose-200 p-2.5 rounded-lg">
            <strong className="text-rose-900 uppercase text-[8px] block mb-0.5 font-bold">
              5. Varovné príznaky & kontakt v prípade komplikácií:
            </strong>
            <p className="text-rose-950 text-[9px] leading-tight">
              {data.warningSigns || 'Pri zvýšenej bolesti, pulzovaní, krvácaní, opuchu alebo teplote okamžite kontaktujte kliniku SAY CLINIC.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
