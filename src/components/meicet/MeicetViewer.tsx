'use client';

import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Printer, 
  Download, 
  CalendarPlus, 
  ShoppingBag, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Flame, 
  Clock, 
  ShieldCheck, 
  Droplet, 
  Sun, 
  Moon, 
  Heart, 
  Eye, 
  Plus, 
  Check, 
  ArrowRight, 
  Calendar as CalendarIcon,
  ChevronRight,
  TrendingUp,
  Activity,
  Award,
  Layers,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { MeicetAnalysisResult, MeicetTreatmentPlanItem } from '@/types/meicet';
import { MeicetService } from '@/services/meicetService';
import { MeicetReportPdfDocument } from './MeicetReportPdfDocument';
import { CalendarEvent } from '@/data/calendarConfig';

interface MeicetViewerProps {
  report: MeicetAnalysisResult;
  onClose?: () => void;
  onSaveToPatientPlans?: (plan: any) => void;
  onScheduleTreatment?: (event: Partial<CalendarEvent>) => void;
  onTransferToCosmeticsPOS?: (products: any[]) => void;
  onNewScanRequested?: () => void;
}

export function MeicetViewer({
  report,
  onClose,
  onSaveToPatientPlans,
  onScheduleTreatment,
  onTransferToCosmeticsPOS,
  onNewScanRequested
}: MeicetViewerProps) {
  const [activeTab, setActiveTab] = useState<'metrics' | 'annual_plan' | 'skincare' | 'scars' | 'milestones'>('metrics');
  const [isSaved, setIsSaved] = useState(false);
  const [bookedTreatments, setBookedTreatments] = useState<Record<string, boolean>>({});
  const [showPdfModal, setShowPdfModal] = useState(false);

  const { metrics, anamnesis, clinicalSynthesis, annualSchedule, skincareRoutine, scarProtocol, milestones } = report;

  // Uloženie do karty pacienta
  const handleSavePlan = () => {
    const patientPlan = MeicetService.convertToPatientPlan(report);
    if (onSaveToPatientPlans) {
      onSaveToPatientPlans(patientPlan);
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Naplánovanie ošetrenia do kalendára kliniky
  const handleScheduleItem = (treatment: MeicetTreatmentPlanItem, season: string) => {
    if (onScheduleTreatment) {
      onScheduleTreatment({
        title: treatment.name,
        patientName: report.patientName,
        patientId: report.patientId,
        date: new Date().toISOString().split('T')[0],
        time: '10:00',
        duration: 45,
        type: treatment.category === 'laser' ? 'osetrenie' : treatment.category === 'surgery' ? 'operacia' : 'kontrola',
        category: 'laser',
        doctor: 'MUDr. Ján Mráz',
        notes: `Zákrok z ročného plánu Meicet Pro-A: ${treatment.name} (${treatment.seasonOrMonth}). Cieľ: ${treatment.targetArea}. Dôvod: ${treatment.reasoning}`
      });
      setBookedTreatments(prev => ({ ...prev, [treatment.id]: true }));
    }
  };

  // Preniesť celú skincare rutinu do pokladne POS
  const handleTransferToPOS = () => {
    if (!onTransferToCosmeticsPOS) return;
    const allProducts = [
      ...skincareRoutine.morning.map(p => ({
        id: `prod-m-${p.step}`,
        name: p.productName,
        brand: p.brand,
        price: p.price || 45,
        category: p.category,
        quantity: 1
      })),
      ...skincareRoutine.evening.map(p => ({
        id: `prod-e-${p.step}`,
        name: p.productName,
        brand: p.brand,
        price: p.price || 45,
        category: p.category,
        quantity: 1
      }))
    ];
    onTransferToCosmeticsPOS(allProducts);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* HORNÝ OVLÁDACÍ A AKČNÝ PANEL */}
      <div className="bg-gradient-to-r from-[#2C2A29] via-[#3A3836] to-[#2C2A29] text-white p-5 rounded-2xl border-2 border-[#C5A059] shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C5A059] to-[#8C6D2D] flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            🔬
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-serif text-xl font-bold tracking-wide">
                Meicet Pro-A 3D Analýza & Ročný plán ošetrení
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Syntéza s anamnézou aktívna
              </span>
            </div>
            <p className="text-xs text-[#E8E2D9] mt-0.5">
              Pacient: <strong>{report.patientName}</strong> | Sken: {report.scanDate} | Súbor: {report.pdfSourceFilename || 'Meicet_ProA_ISEMECO.pdf'}
            </p>
          </div>
        </div>

        {/* AKCIE */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* TLAČIŤ / EXPORTOVAŤ A4 PDF */}
          <button
            type="button"
            onClick={() => setShowPdfModal(true)}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-all border border-white/20 hover:border-white/40 cursor-pointer shadow-xs"
            title="Zobraziť a vytlačiť reprezentatívny A4 PDF report pre pacienta"
          >
            <Printer className="w-4 h-4 text-[#C5A059]" />
            <span>A4 Tlač / Export</span>
          </button>

          {/* PRENIESŤ SKINCARE DO POKLADNE (POS) */}
          {onTransferToCosmeticsPOS && (
            <button
              type="button"
              onClick={handleTransferToPOS}
              className="px-3 py-2 rounded-xl bg-purple-600/80 hover:bg-purple-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all border border-purple-400/40 cursor-pointer shadow-xs"
              title="Vystaviť odporúčanú dermokozmetiku priamo do pokladne (POS)"
            >
              <ShoppingBag className="w-4 h-4 text-purple-200" />
              <span>Predaj do POS</span>
            </button>
          )}

          {/* ULOŽIŤ DO KARTY PACIENTA */}
          <button
            type="button"
            onClick={handleSavePlan}
            className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
              isSaved 
                ? 'bg-emerald-600 text-white' 
                : 'bg-gradient-to-r from-[#C5A059] to-[#8C6D2D] hover:from-[#d8b167] hover:to-[#9f7d37] text-white'
            }`}
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4" />
                <span>Uložené v karte!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Synchronizovať s plánmi</span>
              </>
            )}
          </button>

          {/* NOVÝ SKEN */}
          {onNewScanRequested && (
            <button
              type="button"
              onClick={onNewScanRequested}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#E8E2D9] font-bold text-xs transition-colors cursor-pointer"
              title="Nahrať ďalší alebo nový PDF report Meicet Pro-A"
            >
              + Nový report
            </button>
          )}
        </div>
      </div>

      {/* KLINICKÉ SUMÁRNE KARTY (SKÓRE, VEK PLETI, ANAMNESTICKÁ SYNERGIA) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* KARTA 1: CELKOVÉ SKÓRE ZDRAVIA PLETI */}
        <div className="bg-white p-4 rounded-2xl border border-[#E8E2D9] shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-xl">
            {metrics.skinScoreOverall}
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#8C857B] block">Skin Health Score</span>
            <span className="text-xs font-bold text-[#2C2A29]">
              {metrics.skinScoreOverall >= 75 ? 'Výborný stav' : metrics.skinScoreOverall >= 60 ? 'Stredný stav pleti' : 'Vyžaduje cielenú terapiu'}
            </span>
            <span className="text-[10px] text-[#8C857B] block">Analyzátor Meicet Pro-A</span>
          </div>
        </div>

        {/* KARTA 2: BIOLOGICKÝ VEK PLETI VS SKUTOČNÝ VEK */}
        <div className="bg-white p-4 rounded-2xl border border-[#E8E2D9] shadow-xs flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl ${
            metrics.skinAge > metrics.actualAge 
              ? 'bg-amber-50 text-amber-800 border border-amber-200' 
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}>
            {metrics.skinAge}
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#8C857B] block">Vek pleti Meicet</span>
            <span className="text-xs font-bold text-[#2C2A29]">
              Skutočný vek: {metrics.actualAge} rokov
            </span>
            <span className={`text-[10px] font-bold block ${metrics.skinAge > metrics.actualAge ? 'text-amber-600' : 'text-emerald-700'}`}>
              {metrics.skinAge > metrics.actualAge 
                ? `+${metrics.skinAge - metrics.actualAge} r. (dehydratácia & UV)` 
                : `${metrics.actualAge - metrics.skinAge} r. mladšia pleť`}
            </span>
          </div>
        </div>

        {/* KARTA 3: HYDRATÁCIA & TEWL */}
        <div className="bg-white p-4 rounded-2xl border border-[#E8E2D9] shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 flex items-center justify-center font-bold text-xl">
            {metrics.hydration.score}%
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#8C857B] block">Hydratácia & Bariéra</span>
            <span className="text-xs font-bold text-sky-900">{metrics.hydration.status}</span>
            <span className="text-[10px] text-sky-700 block">TEWL: {metrics.hydration.tewlLevel}</span>
          </div>
        </div>

        {/* KARTA 4: STATUS JAZVY A OPERÁCIÍ */}
        <div className="bg-white p-4 rounded-2xl border border-[#E8E2D9] shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-center font-bold text-xl">
            🩹
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#8C857B] block">Scar Care Protocol</span>
            <span className="text-xs font-bold text-[#2C2A29] truncate max-w-[150px] block">
              {scarProtocol.hasScars ? 'Aktívna starostlivosť' : 'Bez evidencie jaziev'}
            </span>
            <span className="text-[10px] text-red-700 font-bold block">
              {scarProtocol.hasScars ? 'Silikón + Vaskulárny laser' : 'Preventívny režim'}
            </span>
          </div>
        </div>

      </div>

      {/* KLINICKÁ SYNTÉZA MEICET DÁT S ANAMNÉZOU */}
      <div className="bg-gradient-to-r from-[#FAF8F5] via-white to-[#FAF8F5] border border-[#C5A059]/40 p-5 rounded-2xl shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🩺</span>
            <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-[#2C2A29]">
              Lekárska syntéza: Synergia 3D Meicet nálezu a anamnézy pacienta
            </h3>
          </div>
          <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-wider">
            MUDr. Ján Mráz | SAY CLINIC
          </span>
        </div>

        <p className="text-xs text-[#2C2A29] leading-relaxed">
          {clinicalSynthesis.summary}
        </p>

        {/* KĽÚČOVÉ NÁLEZY V ODPOVEDI NA OPERÁCIE A JAZVY */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-white border border-[#E8E2D9] space-y-1">
            <span className="text-[10px] uppercase font-bold text-emerald-800 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Prioritné indikácie zistené analyzátorom Meicet:</span>
            </span>
            <ul className="space-y-1 text-xs text-[#2C2A29] pl-1">
              {clinicalSynthesis.keyFindings.map((finding, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-[#C5A059] font-bold">•</span>
                  <span>{finding}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-amber-900 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Klinické upozornenia a prevencia (Sezónnosť & Kontraindikácie):</span>
            </span>
            <ul className="space-y-1 text-xs text-amber-900 pl-1">
              {clinicalSynthesis.riskAlerts.map((risk, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-amber-700 font-bold">•</span>
                  <span>{risk}</span>
                </li>
              ))}
              {clinicalSynthesis.synergyWithSurgeries && (
                <li className="flex items-start gap-1.5 font-semibold text-red-800 pt-1 border-t border-amber-200/60 mt-1">
                  <span>🩹</span>
                  <span>{clinicalSynthesis.synergyWithSurgeries}</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* HLAVNÁ NAVIGÁCIA ZÁLOŽIEK */}
      <div className="flex flex-wrap gap-2 border-b border-[#E8E2D9]">
        <button
          type="button"
          onClick={() => setActiveTab('metrics')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'metrics'
              ? 'bg-[#2C2A29] text-white shadow-xs'
              : 'bg-white hover:bg-[#FAF8F5] text-[#8C857B] hover:text-[#2C2A29] border border-b-0 border-transparent hover:border-[#E8E2D9]'
          }`}
        >
          <Activity className="w-4 h-4 text-[#C5A059]" />
          <span>1. Metriky Meicet Pro-A (8 Spektier)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('annual_plan')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'annual_plan'
              ? 'bg-[#2C2A29] text-white shadow-xs'
              : 'bg-white hover:bg-[#FAF8F5] text-[#8C857B] hover:text-[#2C2A29] border border-b-0 border-transparent hover:border-[#E8E2D9]'
          }`}
        >
          <CalendarIcon className="w-4 h-4 text-emerald-400" />
          <span>2. Ročný plán ošetrení (12 Mesiacov)</span>
          <span className="px-1.5 py-0.2 rounded-full bg-[#C5A059] text-white text-[9px]">4Q</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('skincare')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'skincare'
              ? 'bg-[#2C2A29] text-white shadow-xs'
              : 'bg-white hover:bg-[#FAF8F5] text-[#8C857B] hover:text-[#2C2A29] border border-b-0 border-transparent hover:border-[#E8E2D9]'
          }`}
        >
          <Droplet className="w-4 h-4 text-sky-400" />
          <span>3. Denná Skincare Rutina (Ráno / Večer)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('scars')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'scars'
              ? 'bg-[#2C2A29] text-white shadow-xs'
              : 'bg-white hover:bg-[#FAF8F5] text-[#8C857B] hover:text-[#2C2A29] border border-b-0 border-transparent hover:border-[#E8E2D9]'
          }`}
        >
          <Flame className="w-4 h-4 text-red-500" />
          <span>4. Starostlivosť o jazvy (Scar Protocol)</span>
          {scarProtocol.hasScars && (
            <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[9px] animate-pulse">!</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('milestones')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'milestones'
              ? 'bg-[#2C2A29] text-white shadow-xs'
              : 'bg-white hover:bg-[#FAF8F5] text-[#8C857B] hover:text-[#2C2A29] border border-b-0 border-transparent hover:border-[#E8E2D9]'
          }`}
        >
          <Award className="w-4 h-4 text-amber-400" />
          <span>5. Kontrolné re-skeny Meicet</span>
        </button>
      </div>

      {/* OBSAH ZÁLOŽIEK */}
      <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm min-h-[400px]">
        
        {/* ZÁLOŽKA 1: DETAILNÉ METRIKY MEICET PRO-A */}
        {activeTab === 'metrics' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-serif text-base font-bold text-[#2C2A29]">
                  Multispektrálna 3D analýza pleti (Meicet Pro-A ISEMECO System)
                </h3>
                <p className="text-xs text-[#8C857B]">
                  Objektívne hodnotenie v spektre bieleho RGB svetla, UV svetla, krížovej a paralelnej polarizácie.
                </p>
              </div>
              <span className="text-[11px] px-3 py-1 rounded-full bg-[#FAF8F5] border border-[#C5A059] font-bold text-[#C5A059]">
                Fototyp: Fitzpatrick {metrics.fitzpatrickPhototype} | Typ pleti: {metrics.skinType}
              </span>
            </div>

            {/* MRIEŽKA 8 PARAMETROV S UKAZOVATEĽMI */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* 1. Hydratácia & TEWL */}
              <div className="p-4 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-xl p-2 rounded-lg bg-sky-100 text-sky-800 font-bold">💧</span>
                    <div>
                      <h4 className="font-bold text-xs text-[#2C2A29]">Hydratácia pleti & Bariéra (TEWL)</h4>
                      <p className="text-[10px] text-[#8C857B]">Krížová polarizácia & impedančný senzor</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-sky-700">{metrics.hydration.score}%</span>
                </div>
                <div className="w-full bg-[#E8E2D9] h-2 rounded-full overflow-hidden">
                  <div className="bg-sky-500 h-full rounded-full" style={{ width: `${metrics.hydration.score}%` }} />
                </div>
                <p className="text-xs text-[#2C2A29]">{metrics.hydration.description}</p>
                <p className="text-[10px] text-sky-900 bg-sky-50 p-2 rounded border border-sky-200">
                  <strong>Klinický záver:</strong> {metrics.hydration.clinicalSignificance}
                </p>
              </div>

              {/* 2. Póry & Infundíbulá */}
              <div className="p-4 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-xl p-2 rounded-lg bg-amber-100 text-amber-800 font-bold">🕳️</span>
                    <div>
                      <h4 className="font-bold text-xs text-[#2C2A29]">Póry & Infundíbulá</h4>
                      <p className="text-[10px] text-[#8C857B]">Paralelná polarizácia | Zóna: {metrics.pores.predominantZone}</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-amber-700">{metrics.pores.score}%</span>
                </div>
                <div className="w-full bg-[#E8E2D9] h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${metrics.pores.score}%` }} />
                </div>
                <p className="text-xs text-[#2C2A29]">{metrics.pores.description}</p>
                <p className="text-[10px] text-[#2C2A29] bg-white p-2 rounded border border-[#E8E2D9]">
                  <strong>Klinický záver:</strong> {metrics.pores.clinicalSignificance}
                </p>
              </div>

              {/* 3. Vrásky & Jemné linky */}
              <div className="p-4 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-xl p-2 rounded-lg bg-purple-100 text-purple-800 font-bold">〰️</span>
                    <div>
                      <h4 className="font-bold text-xs text-[#2C2A29]">Vrásky & Mimické linky</h4>
                      <p className="text-[10px] text-[#8C857B]">Glabela, čelo, periorbitálne vejáriky</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-purple-700">{metrics.wrinkles.score}%</span>
                </div>
                <div className="w-full bg-[#E8E2D9] h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: `${metrics.wrinkles.score}%` }} />
                </div>
                <p className="text-xs text-[#2C2A29]">{metrics.wrinkles.description}</p>
                <p className="text-[10px] text-purple-900 bg-purple-50 p-2 rounded border border-purple-200">
                  <strong>Klinický záver:</strong> {metrics.wrinkles.clinicalSignificance}
                </p>
              </div>

              {/* 4. UV Fotopoškodenie & Skrytý melanín */}
              <div className="p-4 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-xl p-2 rounded-lg bg-indigo-100 text-indigo-800 font-bold">☀️</span>
                    <div>
                      <h4 className="font-bold text-xs text-[#2C2A29]">UV Skryté fotopoškodenie</h4>
                      <p className="text-[10px] text-[#8C857B]">Detekcia v UV spektre 365nm | Riziko: {metrics.uvDamage.hiddenSpotsRisk}</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-indigo-700">{metrics.uvDamage.score}%</span>
                </div>
                <div className="w-full bg-[#E8E2D9] h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${metrics.uvDamage.score}%` }} />
                </div>
                <p className="text-xs text-[#2C2A29]">{metrics.uvDamage.description}</p>
                <p className="text-[10px] text-indigo-900 bg-indigo-50 p-2 rounded border border-indigo-200">
                  <strong>Klinický záver:</strong> {metrics.uvDamage.clinicalSignificance}
                </p>
              </div>

              {/* 5. Cievny erytém & Reaktivita (Krížová polarizácia) */}
              <div className="p-4 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-xl p-2 rounded-lg bg-rose-100 text-rose-800 font-bold">🩸</span>
                    <div>
                      <h4 className="font-bold text-xs text-[#2C2A29]">Cievny erytém & Citlivosť</h4>
                      <p className="text-[10px] text-[#8C857B]">Krížovo-polarizované spektrum | Kuperóza & jazvy</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-rose-700">{metrics.redAreas.score}%</span>
                </div>
                <div className="w-full bg-[#E8E2D9] h-2 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: `${metrics.redAreas.score}%` }} />
                </div>
                <p className="text-xs text-[#2C2A29]">{metrics.redAreas.description}</p>
                <p className="text-[10px] text-rose-900 bg-rose-50 p-2 rounded border border-rose-200">
                  <strong>Klinický záver:</strong> {metrics.redAreas.clinicalSignificance}
                </p>
              </div>

              {/* 6. Kožný maz & Porfyríny */}
              <div className="p-4 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-xl p-2 rounded-lg bg-emerald-100 text-emerald-800 font-bold">🧪</span>
                    <div>
                      <h4 className="font-bold text-xs text-[#2C2A29]">Maz & Porfyríny (C. acnes)</h4>
                      <p className="text-[10px] text-[#8C857B]">Fluorescenčná Woodova analýza</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-emerald-700">{metrics.sebumAndPorphyrins.score}%</span>
                </div>
                <div className="w-full bg-[#E8E2D9] h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${metrics.sebumAndPorphyrins.score}%` }} />
                </div>
                <p className="text-xs text-[#2C2A29]">{metrics.sebumAndPorphyrins.description}</p>
                <p className="text-[10px] text-[#2C2A29] bg-white p-2 rounded border border-[#E8E2D9]">
                  <strong>Klinický záver:</strong> {metrics.sebumAndPorphyrins.clinicalSignificance}
                </p>
              </div>

            </div>
          </div>
        )}

        {/* ZÁLOŽKA 2: ROČNÝ PLÁN OŠETRENÍ (12 MESIACOV) */}
        {activeTab === 'annual_plan' && (
          <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <h3 className="font-serif text-base font-bold text-[#2C2A29]">
                  Personalizovaný 12-mesačný harmonogram ošetrení SAY CLINIC
                </h3>
                <p className="text-xs text-[#8C857B]">
                  Zostavený na základe objektívnych Meicet Pro-A dát a prísnych bezpečnostných pravidiel sezónnosti.
                </p>
              </div>

              <span className="text-[10px] bg-amber-50 text-amber-800 px-3 py-1 rounded-full border border-amber-200 font-bold flex items-center gap-1">
                <span>☀️</span>
                <span>Sezónny protokol: Leto bez ablatívnych laserov | Jeseň = Laser season</span>
              </span>
            </div>

            {/* SEZÓNNE KVARTÁLY */}
            <div className="space-y-5">
              {annualSchedule.map((season, sIdx) => {
                const isSummer = season.season === 'leto';
                const isAutumn = season.season === 'jesen';

                return (
                  <div 
                    key={sIdx}
                    className={`rounded-2xl border p-5 space-y-4 transition-all ${
                      isSummer 
                        ? 'border-amber-200 bg-amber-50/20' 
                        : isAutumn 
                          ? 'border-orange-200 bg-orange-50/20' 
                          : 'border-[#E8E2D9] bg-[#FAF8F5]/60'
                    }`}
                  >
                    {/* KVARTÁL HLAVIČKA */}
                    <div className="flex flex-wrap justify-between items-center gap-2 border-b border-gray-200/80 pb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-xl bg-[#2C2A29] text-[#C5A059] flex items-center justify-center font-bold text-xs">
                          {sIdx + 1}Q
                        </span>
                        <div>
                          <h4 className="font-serif text-sm font-bold text-[#2C2A29]">
                            {season.quarter}: {season.title}
                          </h4>
                          <p className="text-[11px] text-[#8C857B]">{season.focus}</p>
                        </div>
                      </div>

                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        isSummer ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-gray-100 text-[#2C2A29]'
                      }`}>
                        {season.season}
                      </span>
                    </div>

                    <p className="text-xs text-amber-900 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/80 italic">
                      ⚠️ {season.seasonalConsideration}
                    </p>

                    {/* ZOZNAM PROCEDÚR V TOMTO KVARTÁLI */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {season.treatments.map((t) => {
                        const isBooked = bookedTreatments[t.id];

                        return (
                          <div 
                            key={t.id}
                            className="bg-white border border-[#E8E2D9] hover:border-[#C5A059] p-3.5 rounded-xl shadow-2xs flex flex-col justify-between transition-all group"
                          >
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-start gap-1">
                                <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                                  t.category === 'laser' 
                                    ? 'bg-rose-100 text-rose-800' 
                                    : t.category === 'injectable' 
                                      ? 'bg-purple-100 text-purple-800' 
                                      : t.isMeicetScan 
                                        ? 'bg-[#C5A059]/20 text-[#8C6D2D]' 
                                        : 'bg-sky-100 text-sky-800'
                                }`}>
                                  {t.category === 'laser' ? 'Laser' : t.category === 'injectable' ? 'Injekcia' : t.isMeicetScan ? 'Meicet 3D Sken' : 'Dermokozmetika'}
                                </span>

                                <span className="text-[10px] font-bold text-[#8C857B]">
                                  {t.seasonOrMonth}
                                </span>
                              </div>

                              <h5 className="font-bold text-xs text-[#2C2A29] group-hover:text-[#C5A059] transition-colors">
                                {t.name}
                              </h5>
                              <p className="text-[10px] text-[#8C857B]">Oblasť: <strong>{t.targetArea}</strong></p>
                              <p className="text-[11px] text-[#2C2A29] leading-snug">{t.reasoning}</p>
                            </div>

                            <div className="mt-3 pt-2.5 border-t border-[#E8E2D9] flex justify-between items-center">
                              <div>
                                {t.estimatedPrice ? (
                                  <span className="text-xs font-bold text-[#2C2A29]">{t.estimatedPrice} €</span>
                                ) : (
                                  <span className="text-[10px] text-[#8C857B]">V cene programu</span>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => handleScheduleItem(t, season.quarter)}
                                disabled={isBooked}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                                  isBooked 
                                    ? 'bg-emerald-100 text-emerald-800' 
                                    : 'bg-[#2C2A29] text-white hover:bg-[#C5A059]'
                                }`}
                              >
                                {isBooked ? (
                                  <>
                                    <Check className="w-3 h-3" />
                                    <span>V kalendári</span>
                                  </>
                                ) : (
                                  <>
                                    <CalendarPlus className="w-3 h-3 text-[#C5A059]" />
                                    <span>Rezervovať</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ZÁLOŽKA 3: DENNÁ SKINCARE RUTINA */}
        {activeTab === 'skincare' && (
          <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <h3 className="font-serif text-base font-bold text-[#2C2A29]">
                  Personalizovaná domáca starostlivosť (Ranný & Večerný protokol)
                </h3>
                <p className="text-xs text-[#8C857B]">
                  Predpísané aktívne látky priamo na základe skóre TEWL, UV fotopoškodenia a cievnej reaktivity.
                </p>
              </div>

              {onTransferToCosmeticsPOS && (
                <button
                  type="button"
                  onClick={handleTransferToPOS}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Vystaviť celú sadu do POS pokladne</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* RANNÁ RUTINA */}
              <div className="space-y-3 p-5 rounded-2xl bg-amber-50/20 border border-amber-200">
                <div className="flex items-center gap-2 border-b border-amber-200 pb-2">
                  <Sun className="w-5 h-5 text-amber-600" />
                  <h4 className="font-serif text-sm font-bold text-amber-950 uppercase tracking-wide">
                    ☀️ Ranná rutina (Ochrana & Hydratácia)
                  </h4>
                </div>

                <div className="space-y-3">
                  {skincareRoutine.morning.map(item => (
                    <div key={item.step} className="p-3 bg-white rounded-xl border border-[#E8E2D9] space-y-1.5 shadow-2xs">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                          Krok {item.step}: {item.category}
                        </span>
                        <span className="text-[10px] font-bold text-[#C5A059]">{item.brand}</span>
                      </div>
                      <p className="font-bold text-xs text-[#2C2A29]">{item.productName}</p>
                      <p className="text-[11px] text-[#8C857B] italic">Kľúčové zložky: {item.activeIngredients}</p>
                      <p className="text-xs text-[#2C2A29]">{item.usage}</p>
                      <p className="text-[10px] text-sky-800 bg-sky-50/70 p-1.5 rounded border border-sky-100">
                        <strong>Odôvodnenie Meicet:</strong> {item.meicetJustification}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* VEČERNÁ RUTINA */}
              <div className="space-y-3 p-5 rounded-2xl bg-indigo-50/20 border border-indigo-200">
                <div className="flex items-center gap-2 border-b border-indigo-200 pb-2">
                  <Moon className="w-5 h-5 text-indigo-700" />
                  <h4 className="font-serif text-sm font-bold text-indigo-950 uppercase tracking-wide">
                    🌙 Večerná rutina (Bunková regenerácia & Retinoidy)
                  </h4>
                </div>

                <div className="space-y-3">
                  {skincareRoutine.evening.map(item => (
                    <div key={item.step} className="p-3 bg-white rounded-xl border border-[#E8E2D9] space-y-1.5 shadow-2xs">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded">
                          Krok {item.step}: {item.category}
                        </span>
                        <span className="text-[10px] font-bold text-[#C5A059]">{item.brand}</span>
                      </div>
                      <p className="font-bold text-xs text-[#2C2A29]">{item.productName}</p>
                      <p className="text-[11px] text-[#8C857B] italic">Kľúčové zložky: {item.activeIngredients}</p>
                      <p className="text-xs text-[#2C2A29]">{item.usage}</p>
                      <p className="text-[10px] text-purple-900 bg-purple-50/70 p-1.5 rounded border border-purple-100">
                        <strong>Odôvodnenie Meicet:</strong> {item.meicetJustification}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* ŠPECIÁLNA TÝŽDENNÁ STAROSTLIVOSŤ */}
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-2">
              <h5 className="font-bold text-xs uppercase tracking-wider text-[#2C2A29] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#C5A059]" />
                <span>Týždenná starostlivosť a sezónne tipy</span>
              </h5>
              <ul className="space-y-1 text-xs text-[#2C2A29] pl-1">
                {skincareRoutine.weeklyCare.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-[#C5A059] font-bold">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
              {skincareRoutine.seasonalTips && (
                <p className="text-[11px] text-amber-900 bg-amber-50 p-2 rounded border border-amber-200 mt-2">
                  <strong>Sezónne striedanie:</strong> {skincareRoutine.seasonalTips}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ZÁLOŽKA 4: STAROSTLIVOSŤ O JAZVY (SCAR CARE PROTOCOL) */}
        {activeTab === 'scars' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-serif text-base font-bold text-[#2C2A29] flex items-center gap-2">
                  <span>Protokol starostlivosti o jazvy (SAY CLINIC Scar Protocol)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold uppercase">
                    Pooperačná & laserová ochrana
                  </span>
                </h3>
                <p className="text-xs text-[#8C857B]">
                  Komplexný protokol manažmentu zrenia jaziev po blefaroplastike, augmentácii, facelifte alebo po akné.
                </p>
              </div>
            </div>

            {/* STAV JAZVY */}
            <div className="p-4 rounded-xl bg-red-50/40 border border-red-200 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-900 block">
                Objektívne zhodnotenie jazvy v multispektrálnom rozbore Meicet:
              </span>
              <p className="text-xs text-[#2C2A29] font-medium leading-relaxed">
                {scarProtocol.scarSummary}
              </p>
            </div>

            {/* 3 PILIERE DOMÁCEJ STAROSTLIVOSTI */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="p-4 rounded-xl border border-[#E8E2D9] bg-white space-y-2 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <h4 className="font-bold text-xs text-[#2C2A29]">Silikónová terapia</h4>
                <p className="text-xs text-[#2C2A29] leading-relaxed">
                  {scarProtocol.dailyRoutine.siliconeTherapy}
                </p>
                <span className="text-[10px] text-[#8C857B] block pt-1 border-t border-gray-100">
                  Odporúčané preparáty: Strataderm, Kelo-cote, Dermatix silikónové plátky.
                </span>
              </div>

              <div className="p-4 rounded-xl border border-[#E8E2D9] bg-white space-y-2 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <h4 className="font-bold text-xs text-[#2C2A29]">Tlakové ischemické masáže</h4>
                <p className="text-xs text-[#2C2A29] leading-relaxed">
                  {scarProtocol.dailyRoutine.pressureMassage}
                </p>
                <span className="text-[10px] text-[#8C857B] block pt-1 border-t border-gray-100">
                  Technika: Stlačenie do zblednutia na 10 sekúnd, opakovať 3-5 minút. Nerozťahovať jazvu do šírky!
                </span>
              </div>

              <div className="p-4 rounded-xl border border-[#E8E2D9] bg-white space-y-2 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <h4 className="font-bold text-xs text-[#2C2A29]">Striktná UV Fotoprotekcia SPF 50+</h4>
                <p className="text-xs text-[#2C2A29] leading-relaxed">
                  {scarProtocol.dailyRoutine.sunProtection}
                </p>
                <span className="text-[10px] text-[#8C857B] block pt-1 border-t border-gray-100">
                  Dôvod: Nezrelá jazva vystavená UV žiareniu trvalo a ireverzibilne zhnedne (pozápalová hyperpigmentácia).
                </span>
              </div>

            </div>

            {/* KLINICKÁ PRÍSTROJOVÁ TERAPIA NA SAY CLINIC */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#FAF8F5] via-white to-[#FAF8F5] border border-[#C5A059] space-y-2">
              <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-[#2C2A29] flex items-center gap-1.5">
                <span>🔬</span>
                <span>Klinická laserová korekcia jazvy na klinike SAY CLINIC:</span>
              </h4>
              <ul className="space-y-1 text-xs text-[#2C2A29] pl-1">
                {scarProtocol.clinicalLaserTherapy.recommendedProcedures.map((proc, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-[#C5A059] font-bold">✓</span>
                    <span>{proc}</span>
                  </li>
                ))}
              </ul>
              <div className="text-[11px] text-[#8C857B] pt-2 border-t border-[#E8E2D9] flex justify-between items-center">
                <span><strong>Ideálna sezóna:</strong> {scarProtocol.clinicalLaserTherapy.bestSeason}</span>
                <span>{scarProtocol.clinicalLaserTherapy.precautions}</span>
              </div>
            </div>

            {/* VAROVNÉ PRÍZNAKY */}
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <strong className="block text-amber-950 font-bold uppercase text-[10px]">
                Varovné príznaky – kedy ihneď navštíviť ambulanciu:
              </strong>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                {scarProtocol.warningSigns.map((sign, idx) => (
                  <li key={idx}>{sign}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ZÁLOŽKA 5: KONTROLNÉ MÍĽNIKY A RE-SKENY MEICET */}
        {activeTab === 'milestones' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-serif text-base font-bold text-[#2C2A29]">
                  Kontrolné premerania a merateľné ciele na Meicet Pro-A
                </h3>
                <p className="text-xs text-[#8C857B]">
                  Objektívne preukázanie účinnosti ročného plánu pred a po intervenciách.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {milestones.map((m, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#C5A059] bg-white px-2.5 py-1 rounded-full border border-[#E8E2D9]">
                      {m.timeframe}
                    </span>
                    <span className="text-[10px] text-[#8C857B]">Zameranie: {m.focusArea}</span>
                  </div>

                  <h4 className="font-serif text-sm font-bold text-[#2C2A29]">{m.title}</h4>
                  
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-semibold">
                    🎯 <strong>Cieľové parametre Meicet:</strong> {m.targetMetrics}
                  </div>

                  <div className="text-xs text-[#8C857B]">
                    <strong>Kontrolný checklist:</strong> {m.rescanChecklist.join(' • ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* MODÁL PRE TLAČ / A4 PDF PRE PACIENTA */}
      {showPdfModal && (
        <div className="fixed inset-0 bg-[#2C2A29]/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-[#C5A059] overflow-hidden my-auto max-h-[95vh] flex flex-col">
            
            <div className="p-4 bg-[#2C2A29] text-white flex justify-between items-center border-b border-[#C5A059]">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-[#C5A059]" />
                <span className="font-serif font-bold text-sm">
                  Tlačový náhľad Meicet Pro-A správy (A4 Formát pre pacienta)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-1.5 rounded-xl bg-[#C5A059] hover:bg-[#b08d4b] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Vytlačiť / Uložiť ako PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPdfModal(false)}
                  className="text-white/60 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto bg-gray-100 flex justify-center">
              <div className="bg-white shadow-xl max-w-[210mm] w-full">
                <MeicetReportPdfDocument report={report} />
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
