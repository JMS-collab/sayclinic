'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, X, Check, Clock, Calendar, ShieldCheck, DollarSign } from 'lucide-react';
import { MeicetTreatmentPlanItem, TreatmentProtocol } from '@/types/meicet';

interface ProcedureProtocolEditModalProps {
  isOpen: boolean;
  treatment: MeicetTreatmentPlanItem | null;
  quarterKey: 'q1_spring' | 'q2_summer' | 'q3_autumn' | 'q4_winter';
  onClose: () => void;
  onSave: (updatedTreatment: MeicetTreatmentPlanItem) => void;
}

export const ProcedureProtocolEditModal: React.FC<ProcedureProtocolEditModalProps> = ({
  isOpen,
  treatment,
  quarterKey,
  onClose,
  onSave
}) => {
  const [sessionsCount, setSessionsCount] = useState<number>(4);
  const [intervalDays, setIntervalDays] = useState<number>(7);
  const [intervalLabel, setIntervalLabel] = useState<string>('1x týždenne');
  const [hasMaintenance, setHasMaintenance] = useState<boolean>(true);
  const [maintenanceMonths, setMaintenanceMonths] = useState<number>(6);
  const [maintenanceLabel, setMaintenanceLabel] = useState<string>('1x za 6 mesiacov');
  const [pricePerSession, setPricePerSession] = useState<number>(140);
  const [packagePrice, setPackagePrice] = useState<number>(560);
  const [phaseGoal, setPhaseGoal] = useState<string>('');

  useEffect(() => {
    if (!treatment) return;
    const proto = treatment.protocol;
    const basePrice = treatment.estimatedPrice || (treatment as any).price || 140;
    const count = proto?.induction?.sessionsCount || treatment.sessionsCount || 4;
    const intDays = proto?.induction?.intervalDays || 7;
    const intLabel = proto?.induction?.interval || '1x týždenne';
    const maintMo = proto?.maintenance?.intervalMonths || treatment.maintenanceIntervalMonths || 6;
    const maintLabel = proto?.maintenance?.interval || '1x za 6 mesiacov';
    const goal = proto?.induction?.phaseGoal || 'Intenzívna kúra na potlačenie zápalu a naštartovanie neokolagenogenézy.';

    setSessionsCount(count);
    setIntervalDays(intDays);
    setIntervalLabel(intLabel);
    setHasMaintenance(Boolean(proto?.maintenance || treatment.maintenanceIntervalMonths));
    setMaintenanceMonths(maintMo);
    setMaintenanceLabel(maintLabel);
    setPricePerSession(treatment.pricePerSession || basePrice);
    setPackagePrice(treatment.packagePrice || Math.round(basePrice * count * (count > 1 ? 0.9 : 1)));
    setPhaseGoal(goal);
  }, [treatment]);

  if (!isOpen || !treatment) return null;

  const handleSessionsChange = (newCount: number) => {
    setSessionsCount(newCount);
    const calculated = Math.round(pricePerSession * newCount * (newCount > 1 ? 0.9 : 1));
    setPackagePrice(calculated);
  };

  const handlePricePerSessionChange = (newPrice: number) => {
    setPricePerSession(newPrice);
    const calculated = Math.round(newPrice * sessionsCount * (sessionsCount > 1 ? 0.9 : 1));
    setPackagePrice(calculated);
  };

  const handleIntervalPreset = (days: number, label: string) => {
    setIntervalDays(days);
    setIntervalLabel(label);
  };

  const handleMaintenancePreset = (months: number, label: string) => {
    setHasMaintenance(true);
    setMaintenanceMonths(months);
    setMaintenanceLabel(label);
  };

  const summaryDisplay = sessionsCount > 1
    ? `Kúra: ${sessionsCount}x (${intervalLabel})${hasMaintenance ? ` ➔ Udržiavanie: ${maintenanceLabel}` : ''}`
    : `1x aplikácia${hasMaintenance ? ` ➔ Udržiavanie: ${maintenanceLabel}` : ''}`;

  const handleSaveProtocol = () => {
    const updatedProtocol: TreatmentProtocol = {
      isSeries: sessionsCount > 1,
      induction: {
        sessionsCount,
        interval: intervalLabel,
        intervalDays,
        phaseGoal
      },
      maintenance: hasMaintenance ? {
        interval: maintenanceLabel,
        intervalMonths: maintenanceMonths,
        phaseGoal: `Dlhodobé udržanie dermálnej stimulácie s frekvenciou ${maintenanceLabel}.`
      } : undefined,
      summaryDisplay,
      pricePerSession,
      packagePrice
    };

    const updatedTreatment: MeicetTreatmentPlanItem = {
      ...treatment,
      protocol: updatedProtocol,
      sessionsCount,
      intervalWeeks: Math.round(intervalDays / 7) || 1,
      maintenanceIntervalMonths: hasMaintenance ? maintenanceMonths : undefined,
      pricePerSession,
      packagePrice,
      frequency: summaryDisplay,
      estimatedPrice: packagePrice
    };

    onSave(updatedTreatment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full border-2 border-[#C5A059] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* HLAVIČKA */}
        <div className="bg-gradient-to-r from-[#2C2A29] via-[#3E3A37] to-[#2C2A29] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C5A059]/20 border border-[#C5A059]/50 flex items-center justify-center text-[#E8C882]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059] block">
                Klinický protokol procedúry
              </span>
              <h3 className="font-serif font-bold text-base text-white">
                {treatment.name}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#E8DFC9] hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* TELO FORMULÁRA */}
        <div className="p-6 space-y-5 text-[#2C2A29] text-xs">
          
          {/* 1. INTENZÍVNA KÚRA */}
          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                <Clock className="w-4 h-4 text-amber-700" />
                Fáza 1: Intenzívna kúra (Indukcia)
              </span>
              <span className="text-[11px] text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-md">
                {sessionsCount} {sessionsCount === 1 ? 'sedenie' : sessionsCount < 5 ? 'sedenia' : 'sedení'}
              </span>
            </div>

            {/* Počet sedení */}
            <div>
              <label className="text-[11px] font-medium text-[#5A524C] block mb-1.5">
                Počet sedení v útočnej sérii:
              </label>
              <div className="grid grid-cols-6 gap-1.5">
                {[1, 2, 3, 4, 6, 8].map(count => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => handleSessionsChange(count)}
                    className={`py-2 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
                      sessionsCount === count
                        ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                        : 'bg-white text-[#5A524C] border-[#E8DFC9] hover:border-amber-400'
                    }`}
                  >
                    {count}x
                  </button>
                ))}
              </div>
            </div>

            {/* Interval medzi sedeniami */}
            <div>
              <label className="text-[11px] font-medium text-[#5A524C] block mb-1.5">
                Interval medzi sedeniami:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { days: 7, label: '1x týždenne' },
                  { days: 14, label: 'každé 2 týždne' },
                  { days: 21, label: 'každé 3 týždne' },
                  { days: 28, label: 'každý mesiac' },
                  { days: 42, label: 'každých 6 týždňov' },
                  { days: 60, label: 'každé 2 mesiace' }
                ].map(item => (
                  <button
                    key={item.days}
                    type="button"
                    onClick={() => handleIntervalPreset(item.days, item.label)}
                    className={`p-2 rounded-xl font-medium text-[11px] transition-all cursor-pointer border text-center ${
                      intervalDays === item.days
                        ? 'bg-amber-600 text-white border-amber-700 font-bold shadow-xs'
                        : 'bg-white text-[#5A524C] border-[#E8DFC9] hover:border-amber-400'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. UDRŽIAVACIA FÁZA */}
          <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-teal-900 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                <ShieldCheck className="w-4 h-4 text-teal-700" />
                Fáza 2: Udržiavací režim (Maintenance)
              </span>
              <label className="flex items-center gap-1.5 text-xs text-teal-800 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasMaintenance}
                  onChange={(e) => setHasMaintenance(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span>Vyžaduje udržiavanie</span>
              </label>
            </div>

            {hasMaintenance && (
              <div>
                <label className="text-[11px] font-medium text-[#5A524C] block mb-1.5">
                  Frekvencia dlhodobého udržiavania výsledku:
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { months: 3, label: '1x za 3 mesiace' },
                    { months: 4, label: '1x za 4 mesiace' },
                    { months: 6, label: '1x za 6 mesiacov' },
                    { months: 12, label: '1x ročne (jeseň/zima)' },
                    { months: 18, label: '1x za 18 mesiacov' },
                    { months: 24, label: '1x za 2 roky' }
                  ].map(item => (
                    <button
                      key={item.months}
                      type="button"
                      onClick={() => handleMaintenancePreset(item.months, item.label)}
                      className={`p-2 rounded-xl font-medium text-[11px] transition-all cursor-pointer border text-center ${
                        maintenanceMonths === item.months
                          ? 'bg-teal-700 text-white border-teal-800 font-bold shadow-xs'
                          : 'bg-white text-[#5A524C] border-teal-200 hover:border-teal-400'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. CENOTVORBA & BALÍKOVÁ ZĽAVA */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D9]">
            <div>
              <label className="text-[11px] font-bold text-[#5A524C] block mb-1">
                Cena za 1 sedenie (€):
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={pricePerSession}
                  onChange={(e) => handlePricePerSessionChange(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#D4C5B1] bg-white font-bold text-sm text-[#2C2A29]"
                />
                <span className="absolute right-3 top-2.5 text-xs text-[#8C837A] font-bold">€</span>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#5A524C] block mb-1">
                Celá kúra ({sessionsCount}x sedenie):
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={packagePrice}
                  onChange={(e) => setPackagePrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-amber-50/50 font-bold text-sm text-amber-900"
                />
                <span className="absolute right-3 top-2.5 text-xs text-amber-700 font-bold">€</span>
              </div>
            </div>
          </div>

          {/* NÁHĽAD VÝSLEDNÉHO POPISU PRE PACIENTA */}
          <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-950">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 block mb-1">
              🔍 Výsledný protokol na karte a v PDF protokole:
            </span>
            <div className="font-serif font-bold text-sm text-purple-900">
              {summaryDisplay}
            </div>
            <p className="text-[10px] text-purple-800/80 mt-1">
              Celková orientačná investícia do kúry: <strong>{packagePrice} €</strong> ({pricePerSession} € / sedenie)
            </p>
          </div>
        </div>

        {/* PÄTIČKA S TLAČIDLAMI */}
        <div className="p-4 bg-[#FAF7F2] border-t border-[#E8E2D9] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-[#D4C5B1] bg-white hover:bg-stone-50 font-bold text-xs text-[#5A524C] cursor-pointer transition-colors"
          >
            Zrušiť
          </button>
          <button
            type="button"
            onClick={handleSaveProtocol}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#8C6D2D] hover:from-[#B8924B] hover:to-[#7E6125] text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Uložiť protokol procedúry</span>
          </button>
        </div>
      </div>
    </div>
  );
};
