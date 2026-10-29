'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Award,
  ShoppingBag,
  Syringe,
  ShieldCheck,
  Plus,
  Trash2,
  Check,
  Info,
  Percent
} from 'lucide-react';
import {
  LoyaltyService,
  LoyaltyTierId,
  LoyaltyCategoryType,
  LOYALTY_TIERS,
  ClientLoyaltySummary
} from '../services/loyaltyService';

interface ClientLoyaltyModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId?: string;
  patientName: string;
  onLoyaltyUpdated?: (summary: ClientLoyaltySummary) => void;
}

export default function ClientLoyaltyModal({
  isOpen,
  onClose,
  patientId,
  patientName,
  onLoyaltyUpdated
}: ClientLoyaltyModalProps) {
  const [summary, setSummary] = useState<ClientLoyaltySummary | null>(null);
  const [overrideMode, setOverrideMode] = useState<'auto' | LoyaltyTierId>('auto');
  const [forceSurgeryPremium, setForceSurgeryPremium] = useState<boolean>(false);

  // Formulár pre pridanie položky (Skin Care / Ošetrenie / Operácia)
  const [txCategory, setTxCategory] = useState<LoyaltyCategoryType>('skincare');
  const [txTitle, setTxTitle] = useState<string>('');
  const [txAmount, setTxAmount] = useState<string>('');
  const [txDate, setTxDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const refreshSummary = () => {
    if (!patientName) return;
    const calc = LoyaltyService.calculateClientLoyalty({ id: patientId, name: patientName });
    setSummary(calc);
    setOverrideMode(calc.overrideMode);
    const overrides = LoyaltyService.getOverrides();
    const key = patientId || patientName.toLowerCase().trim();
    setForceSurgeryPremium(Boolean(overrides[key]?.forceSurgeryPremium));
  };

  useEffect(() => {
    if (isOpen && patientName) {
      refreshSummary();
    }
  }, [isOpen, patientId, patientName]);

  if (!isOpen || !summary) return null;

  const handleModeChange = (newMode: 'auto' | LoyaltyTierId) => {
    setOverrideMode(newMode);
    LoyaltyService.setClientLoyaltyOverride(patientId || '', patientName, newMode, {
      forceSurgeryPremium
    });
    const updated = LoyaltyService.calculateClientLoyalty({ id: patientId, name: patientName });
    setSummary(updated);
    if (onLoyaltyUpdated) onLoyaltyUpdated(updated);
    setSavedNotice(`Kategória klienta bola aktualizovaná (${updated.tierDef.name} • zľava ${updated.tierDef.discountPercent} %).`);
    setTimeout(() => setSavedNotice(null), 3500);
  };

  const handleToggleSurgeryPremium = (checked: boolean) => {
    setForceSurgeryPremium(checked);
    LoyaltyService.setClientLoyaltyOverride(patientId || '', patientName, overrideMode, {
      forceSurgeryPremium: checked
    });
    const updated = LoyaltyService.calculateClientLoyalty({ id: patientId, name: patientName });
    setSummary(updated);
    if (onLoyaltyUpdated) onLoyaltyUpdated(updated);
    setSavedNotice(
      checked
        ? 'Aktivované: Operácia nad 1 000 € -> klient je automaticky zaradený min. do kategórie Premium (5 %).'
        : 'Manuálny príznak operácie nad 1 000 € bol vypnutý.'
    );
    setTimeout(() => setSavedNotice(null), 3500);
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(txAmount);
    if (!amountNum || amountNum <= 0) return;

    const defaultTitle =
      txCategory === 'skincare'
        ? 'Nákup Skin Care kozmetiky'
        : txCategory === 'treatment'
        ? 'Ambulantné / Estetické ošetrenie'
        : 'Operačný zákrok';

    LoyaltyService.recordTransaction({
      patientId,
      patientName,
      date: txDate || new Date().toISOString().split('T')[0],
      category: txCategory,
      title: txTitle.trim() || defaultTitle,
      amount: amountNum
    });

    setTxTitle('');
    setTxAmount('');
    const updated = LoyaltyService.calculateClientLoyalty({ id: patientId, name: patientName });
    setSummary(updated);
    if (onLoyaltyUpdated) onLoyaltyUpdated(updated);
    setSavedNotice(`Záznam pridaný. Aktuálna kategória: ${updated.tierDef.name} (${updated.tierDef.discountPercent} % zľava).`);
    setTimeout(() => setSavedNotice(null), 3500);
  };

  const handleDeleteTx = (txId: string) => {
    LoyaltyService.deleteTransaction(txId);
    const updated = LoyaltyService.calculateClientLoyalty({ id: patientId, name: patientName });
    setSummary(updated);
    if (onLoyaltyUpdated) onLoyaltyUpdated(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn print:hidden">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-[#E8E2D9] my-8 overflow-hidden">
        {/* HLAVIČKA */}
        <div className="flex items-center justify-between px-6 py-5 bg-[#FBF9F6] border-b border-[#E8E2D9]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2C2A29] text-[#C5A059] flex items-center justify-center shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-brand text-xl font-bold text-[#2C2A29]">
                  Vernostný systém: {patientName}
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${summary.tierDef.badgeBg} ${summary.tierDef.badgeText} ${summary.tierDef.badgeBorder}`}
                >
                  {summary.tierDef.name.toUpperCase()} • Zľava {summary.tierDef.discountPercent} %
                </span>
              </div>
              <p className="text-xs text-[#8C857B]">
                Hodnotené obdobie: posledných <strong>365 dní</strong> • Započítava sa iba <strong>Skin Care & Ošetrenia</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#E8E2D9]/40 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {savedNotice && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{savedNotice}</span>
              </div>
              <button type="button" onClick={() => setSavedNotice(null)} className="text-emerald-700 font-bold">
                ✕
              </button>
            </div>
          )}

          {/* PREHĽAD 3 ÚROVNÍ VERNOSTNÉHO SYSTÉMU */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['basic', 'premium', 'vip'] as LoyaltyTierId[]).map((tId) => {
              const def = LOYALTY_TIERS[tId];
              const isActive = summary.tier === tId;
              return (
                <div
                  key={tId}
                  onClick={() => handleModeChange(tId)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                    isActive
                      ? 'border-2 border-[#C5A059] bg-[#FAF6EF] shadow-sm'
                      : 'border-[#E8E2D9] bg-[#FBF9F6] hover:border-[#C5A059]/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-brand font-bold text-base text-[#2C2A29] uppercase tracking-wider">
                      {def.name}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold ${
                        def.discountPercent > 0
                          ? 'bg-[#2C2A29] text-[#C5A059]'
                          : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      Zľava {def.discountPercent} %
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8C857B] leading-snug">
                    {tId === 'basic' && 'Do 1 000 € minutých za 365 dní'}
                    {tId === 'premium' && '1 000 – 3 000 € za 365 dní (alebo po operácii > 1 000 €)'}
                    {tId === 'vip' && 'Nad 3 000 € minutých za 365 dní'}
                  </p>
                  {isActive && (
                    <div className="mt-2 pt-2 border-t border-[#C5A059]/30 flex items-center justify-between text-[10px] font-bold text-[#9C7D2B]">
                      <span>✓ Aktívna kategória klienta</span>
                      {summary.isManualOverride ? <span>(Manuálne)</span> : <span>(Auto 365d)</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ROZPAD MINUTÝCH FINANCIÍ ZA 365 DNÍ */}
          <div className="bg-[#FBF9F6] p-5 rounded-2xl border border-[#E8E2D9] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E2D9] pb-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#2C2A29]">
                  Započítaný obrat klienta za posledných 365 dní
                </h4>
                <p className="text-[11px] text-[#8C857B]">
                  Do vernostného obratu sa zarátava iba <strong>Skin Care</strong> a <strong>Ošetrenia</strong>. Operácie sa do sumy nezarátavajú.
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-[#8C857B] block">Započítané spolu (365 dní)</span>
                <span className="text-2xl font-brand font-bold text-[#C5A059] font-mono">
                  {summary.eligibleSpend365d.toFixed(2)} €
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 1. SKIN CARE */}
              <div className="bg-white p-3.5 rounded-xl border border-[#E8E2D9]">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase text-[#8C857B]">
                  <span>Skin Care (Kozmetika)</span>
                  <ShoppingBag className="w-3.5 h-3.5 text-[#C5A059]" />
                </div>
                <p className="text-lg font-mono font-bold text-[#2C2A29] mt-1">
                  {summary.skincareSpend365d.toFixed(2)} €
                </p>
                <span className="text-[10px] text-emerald-700 font-semibold">✓ Zarátava sa do obratu</span>
              </div>

              {/* 2. OŠETRENIA */}
              <div className="bg-white p-3.5 rounded-xl border border-[#E8E2D9]">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase text-[#8C857B]">
                  <span>Ošetrenia (Estetika & Amb.)</span>
                  <Syringe className="w-3.5 h-3.5 text-[#C5A059]" />
                </div>
                <p className="text-lg font-mono font-bold text-[#2C2A29] mt-1">
                  {summary.treatmentsSpend365d.toFixed(2)} €
                </p>
                <span className="text-[10px] text-emerald-700 font-semibold">✓ Zarátava sa do obratu</span>
              </div>

              {/* 3. OPERÁCIE */}
              <div
                className={`p-3.5 rounded-xl border ${
                  summary.hasSurgeryOver1000
                    ? 'bg-amber-50/70 border-amber-300'
                    : 'bg-white border-[#E8E2D9]'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-bold uppercase text-[#8C857B]">
                  <span>Operácie (Chirurgia)</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                </div>
                <p className="text-lg font-mono font-bold text-[#2C2A29] mt-1">
                  {summary.surgeriesSpend365d.toFixed(2)} €
                </p>
                {summary.hasSurgeryOver1000 ? (
                  <span className="text-[10px] text-amber-900 font-bold block">
                    ★ Operácia &gt; 1 000 € → Automaticky min. PREMIUM (5 %)
                  </span>
                ) : (
                  <span className="text-[10px] text-[#8C857B]">Nezarátava sa do sumy (nad 1000 € = Premium)</span>
                )}
              </div>
            </div>

            {/* PROGRES BAR DO ĎALŠEJ KATEGÓRIE */}
            <div className="bg-white p-3.5 rounded-xl border border-[#E8E2D9] space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-[#2C2A29]">
                  {summary.nextTier ? (
                    <>
                      Do kategórie <strong>{LOYALTY_TIERS[summary.nextTier].name} ({LOYALTY_TIERS[summary.nextTier].discountPercent} %)</strong> zostáva minúť na Skin Care / Ošetreniach:{' '}
                      <strong className="font-mono text-[#C5A059]">{summary.amountToNextTier.toFixed(2)} €</strong>
                    </>
                  ) : (
                    <span className="text-emerald-700 font-bold">
                      ★ Klient dosiahol najvyššiu kategóriu VIP (zľava 10 %)
                    </span>
                  )}
                </span>
                <span className="font-mono text-[11px] font-bold text-[#8C857B]">
                  {summary.eligibleSpend365d.toFixed(0)} / {summary.tier === 'basic' ? '1 000' : '3 000'} €
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#FAF8F5] rounded-full overflow-hidden border border-[#E8E2D9]">
                <div
                  className="h-full bg-gradient-to-r from-[#C5A059] to-[#2C2A29] transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(4, summary.progressPercent))}%` }}
                />
              </div>
            </div>
          </div>

          {/* NASTAVENIE REŽIMU PRE TOHTO KLIENTA (AUTO VS MANUÁLNE + OPERÁCIA > 1000 €) */}
          <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#2C2A29] flex items-center gap-2">
              <Percent className="w-4 h-4 text-[#C5A059]" />
              <span>Nastavenie vernostnej kategórie klienta</span>
            </h4>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleModeChange('auto')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  overrideMode === 'auto'
                    ? 'bg-[#2C2A29] text-white border-[#2C2A29] shadow-xs'
                    : 'bg-[#FBF9F6] text-[#8C857B] border-[#E8E2D9] hover:text-[#2C2A29]'
                }`}
              >
                ⚡ Automaticky podľa 365 dní ({LOYALTY_TIERS[summary.computedTier].name} • {LOYALTY_TIERS[summary.computedTier].discountPercent} %)
              </button>

              {(['basic', 'premium', 'vip'] as LoyaltyTierId[]).map((tId) => {
                const def = LOYALTY_TIERS[tId];
                return (
                  <button
                    key={tId}
                    type="button"
                    onClick={() => handleModeChange(tId)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      overrideMode === tId
                        ? 'bg-[#C5A059] text-white border-[#C5A059] shadow-xs'
                        : 'bg-[#FBF9F6] text-[#2C2A29] border-[#E8E2D9] hover:border-[#C5A059]'
                    }`}
                  >
                    Nastaviť pevne: {def.name} ({def.discountPercent} %)
                  </button>
                );
              })}
            </div>

            {/* PREPÍNAČ PRE OPERÁCIU NAD 1000 EUR */}
            <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF6EF] border border-[#E6D4B2] cursor-pointer">
              <div className="pr-3">
                <span className="text-xs font-bold text-[#2C2A29] block">
                  Klient absolvoval operáciu nad 1 000 € (Automatické zaradenie do Premium -5 %)
                </span>
                <span className="text-[11px] text-[#8C857B]">
                  Cena operácie sa nezarátava do 365-dňového obratu, ale klient automaticky získava kategóriu Premium (5 % zľava na Skin Care a ošetrenia).
                </span>
              </div>
              <input
                type="checkbox"
                checked={summary.hasSurgeryOver1000}
                onChange={(e) => handleToggleSurgeryPremium(e.target.checked)}
                className="w-4 h-4 accent-[#C5A059] rounded cursor-pointer shrink-0"
              />
            </label>
          </div>

          {/* FORMULÁR PRE RÝCHLE ZAEVIDOVANIE POLOŽKY DO 365-DŇOVEJ HISTÓRIE */}
          <div className="bg-[#FBF9F6] p-5 rounded-2xl border border-[#E8E2D9] space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#2C2A29]">
              + Zaevidovať nákup Skin Care / Ošetrenie / Operáciu
            </h4>
            <form onSubmit={handleAddTransaction} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
              <div className="sm:col-span-3">
                <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Typ položky</label>
                <select
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value as LoyaltyCategoryType)}
                  className="w-full p-2 rounded-xl border border-[#E8E2D9] bg-white text-xs font-semibold text-[#2C2A29]"
                >
                  <option value="skincare">🧴 Skin Care (započítava sa)</option>
                  <option value="treatment">💉 Ošetrenie (započítava sa)</option>
                  <option value="surgery">🏥 Operácia (nezapočítava sa, &gt;1000€ = Premium)</option>
                </select>
              </div>
              <div className="sm:col-span-4">
                <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Názov výkonu / produktu</label>
                <input
                  type="text"
                  value={txTitle}
                  onChange={(e) => setTxTitle(e.target.value)}
                  placeholder={
                    txCategory === 'skincare'
                      ? 'napr. SkinCeuticals C E Ferulic'
                      : txCategory === 'treatment'
                      ? 'napr. Botox + Profhilo ošetrenie'
                      : 'napr. Horná blefaroplastika'
                  }
                  className="w-full p-2 rounded-xl border border-[#E8E2D9] bg-white text-xs text-[#2C2A29]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Suma (€)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-2 rounded-xl border border-[#E8E2D9] bg-white text-xs font-mono font-bold text-[#2C2A29]"
                />
              </div>
              <div className="sm:col-span-3 flex gap-1.5">
                <div className="flex-1">
                  <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Dátum</label>
                  <input
                    type="date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-[#E8E2D9] bg-white text-[11px] font-mono text-[#2C2A29]"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-[#2C2A29] hover:bg-[#C5A059] text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center cursor-pointer shrink-0 self-end h-[34px]"
                  title="Pridať záznam"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* ZOZNAM POLOŽIEK ZA POSLEDNÝCH 365 DNÍ */}
            {summary.transactions365d.length > 0 && (
              <div className="pt-3 border-t border-[#E8E2D9]">
                <p className="text-[10px] uppercase font-bold text-[#8C857B] mb-2">
                  Evidované položky klienta za posledných 365 dní ({summary.transactions365d.length})
                </p>
                <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                  {summary.transactions365d.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#E8E2D9] text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                            tx.category === 'skincare'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : tx.category === 'treatment'
                              ? 'bg-sky-50 text-sky-800 border border-sky-200'
                              : 'bg-amber-50 text-amber-900 border border-amber-200'
                          }`}
                        >
                          {tx.category === 'skincare'
                            ? 'Skin Care'
                            : tx.category === 'treatment'
                            ? 'Ošetrenie'
                            : 'Operácia (nezarátaná)'}
                        </span>
                        <span className="font-mono text-[11px] text-[#8C857B] shrink-0">{tx.date}</span>
                        <span className="font-semibold text-[#2C2A29] truncate">{tx.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`font-mono font-bold ${
                            tx.category === 'surgery' ? 'text-amber-700' : 'text-[#2C2A29]'
                          }`}
                        >
                          {tx.amount.toFixed(2)} €
                        </span>
                        {tx.id.startsWith('loy-tx-') && (
                          <button
                            type="button"
                            onClick={() => handleDeleteTx(tx.id)}
                            className="p-1 text-stone-400 hover:text-rose-600 cursor-pointer"
                            title="Odstrániť manuálny záznam"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SPODNÁ LIŠTA */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#FBF9F6] border-t border-[#E8E2D9]">
          <div className="flex items-center gap-1.5 text-[11px] text-[#8C857B]">
            <Info className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Basic: 0–1000 € (0%) • Premium: 1000–3000 € alebo operácia &gt;1000 € (5%) • VIP: nad 3000 € (10%)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#2C2A29] hover:bg-[#C5A059] text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Hotovo
          </button>
        </div>
      </div>
    </div>
  );
}
