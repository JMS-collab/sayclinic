'use client';

import React, { useState, useRef } from 'react';
import { 
  PatientPlan, 
  ScheduledTreatment 
} from '@/data/patientPlanConfig';
import { 
  Sparkles, 
  Printer, 
  Download,
  ShieldAlert, 
  HeartHandshake, 
  AlertCircle, 
  CalendarPlus, 
  Stethoscope,
  ShoppingBag,
  Eye,
  CheckCircle2,
  RotateCw,
  X,
  FileText
} from 'lucide-react';
import { CosmeticRoutineItem } from '@/data/patientPlanConfig';
import { generatePdfFilename, exportElementToPdf } from '@/lib/pdfGenerator';
import { PatientPlanPdfDocument } from './PatientPlanPdfDocument';

interface PatientPlanViewerProps {
  plan: PatientPlan;
  patient?: any;
  onUpdatePlan: (updated: PatientPlan) => void;
  onScheduleTreatment?: (treatment: ScheduledTreatment) => void;
  onOpenInCosmeticsPOS?: (items: CosmeticRoutineItem[], patientId: string) => void;
  onClose?: () => void;
}

export default function PatientPlanViewer({
  plan,
  patient,
  onUpdatePlan,
  onScheduleTreatment,
  onOpenInCosmeticsPOS
}: PatientPlanViewerProps) {
  const [activeSection, setActiveSection] = useState<'all' | 'cosmetics' | 'schedule' | 'pre_op' | 'post_op'>('all');
  const [selectedTierFilter, setSelectedTierFilter] = useState<'both' | 'standard' | 'premium'>('both');
  
  const standardMorningTotal = (plan.cosmeticsRoutine?.morning || []).reduce((sum, item) => sum + (item.standardOption?.price ?? item.price ?? 0), 0);
  const standardEveningTotal = (plan.cosmeticsRoutine?.evening || []).reduce((sum, item) => sum + (item.standardOption?.price ?? item.price ?? 0), 0);
  const standardTotal = standardMorningTotal + standardEveningTotal;

  const premiumMorningTotal = (plan.cosmeticsRoutine?.morning || []).reduce((sum, item) => sum + (item.premiumOption?.price ?? item.price ?? 0), 0);
  const premiumEveningTotal = (plan.cosmeticsRoutine?.evening || []).reduce((sum, item) => sum + (item.premiumOption?.price ?? item.price ?? 0), 0);
  const premiumTotal = premiumMorningTotal + premiumEveningTotal;

  const [checklistState, setChecklistState] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    if (plan.preOpCare?.instructions) {
      plan.preOpCare.instructions.forEach(ins => {
        map[ins.id] = !!ins.completed;
      });
    }
    return map;
  });

  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);
  const [showPdfPreviewModal, setShowPdfPreviewModal] = useState(false);
  const planPrintRef = useRef<HTMLDivElement>(null);
  const pdfDocumentRef = useRef<HTMLDivElement>(null);

  const toggleChecklistItem = (id: string) => {
    const updated = { ...checklistState, [id]: !checklistState[id] };
    setChecklistState(updated);
    if (plan.preOpCare?.instructions) {
      const newInstructions = plan.preOpCare.instructions.map(ins => 
        ins.id === id ? { ...ins, completed: updated[id] } : ins
      );
      onUpdatePlan({
        ...plan,
        preOpCare: {
          ...plan.preOpCare,
          instructions: newInstructions
        }
      });
    }
  };

  const handlePrint = () => {
    if (typeof window === 'undefined') return;
    const tempStyle = document.createElement('style');
    tempStyle.id = 'say-patient-plan-print-style';
    tempStyle.innerHTML = `
      @page {
        size: A4 portrait !important;
        margin: 10mm 12mm !important;
      }
      @media print {
        body * { visibility: hidden !important; }
        #printable-patient-plan-container,
        #printable-patient-plan-container *,
        #printable-patient-plan-doc,
        #printable-patient-plan-doc * { visibility: visible !important; }
        #printable-patient-plan-container {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          display: block !important;
          z-index: 99999 !important;
        }
      }
    `;
    document.head.appendChild(tempStyle);

    const cleanup = () => {
      const s = document.getElementById('say-patient-plan-print-style');
      if (s) s.remove();
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup, { once: true });
    window.print();
    setTimeout(cleanup, 2500);
  };

  const handleDownloadPdf = async () => {
    const targetElement = pdfDocumentRef.current || planPrintRef.current;
    if (!targetElement) return;
    setGeneratingPdf(true);
    setPdfSuccessMessage(null);
    try {
      const dateStr = plan.createdAt ? plan.createdAt.split('T')[0] : new Date().toISOString().split('T')[0];
      const effectivePatientName = patient?.name || plan.patientName || 'Pacient';
      const filename = generatePdfFilename('Plan_Starostlivosti_SAY', effectivePatientName, dateStr);
      await exportElementToPdf(targetElement, filename, {
        format: 'a4',
        headerTitle: plan.title || 'Plán starostlivosti & Liečby',
        patientName: effectivePatientName,
      });
      setPdfSuccessMessage(`Plán starostlivosti bol úspešne vygenerovaný v špičkovej A4 kvalite (${filename}).`);
      setTimeout(() => {
        setPdfSuccessMessage(null);
      }, 5000);
    } catch (err) {
      console.error('Chyba exportu plánu do PDF:', err);
      alert('Nastala chyba pri generovaní PDF plánu starostlivosti.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const updateTreatmentStatus = (treatmentId: string, newStatus: 'planned' | 'booked' | 'completed') => {
    const updatedTreatments = plan.annualTreatments.map(t => 
      t.id === treatmentId ? { ...t, status: newStatus } : t
    );
    onUpdatePlan({
      ...plan,
      annualTreatments: updatedTreatments
    });
  };

  return (
    <div id="printable-patient-plan" ref={planPrintRef} className="space-y-6 printable-document relative">
      {/* OZNAM O ÚSPEŠNOM VYGENEROVANÍ PDF */}
      {pdfSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-1 print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{pdfSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setPdfSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {/* HLAVIČKA PLÁNU & AKCIE */}
      <div className="bg-gradient-to-r from-[#2C2A29] via-[#3a3735] to-[#2C2A29] text-white p-6 rounded-2xl shadow-lg border border-[#C5A059]/30">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-[#C5A059] text-[#2C2A29] text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-xs">
                SAY CLINIC PROTOKOL
              </span>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                plan.planType === 'annual_aesthetic' ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30' :
                plan.planType === 'pre_post_op' ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30' :
                'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
              }`}>
                {plan.planType === 'annual_aesthetic' ? '✨ Ročný estetický plán' :
                 plan.planType === 'pre_post_op' ? '🏥 Pred- a pooperačný plán' : '💎 Komplexný liečebný plán'}
              </span>
              <span className="text-xs text-stone-400">
                Vytvorené: {new Date(plan.createdAt).toLocaleDateString('sk-SK')}
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-stone-100">
              {plan.title}
            </h2>

            <p className="text-xs text-stone-300 leading-relaxed">
              <strong>Cieľ / Indikácia:</strong> {plan.diagnosisOrGoal}
            </p>

            {plan.analysisSummary && (
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-stone-300">
                {plan.analysisSummary.skinType && (
                  <span className="bg-white/10 px-2 py-0.5 rounded border border-white/10">
                    Typ pleti: <strong className="text-white">{plan.analysisSummary.skinType}</strong>
                  </span>
                )}
                {plan.analysisSummary.skinTonePhototype && (
                  <span className="bg-white/10 px-2 py-0.5 rounded border border-white/10">
                    Fototyp: <strong className="text-white">{plan.analysisSummary.skinTonePhototype}</strong>
                  </span>
                )}
                <span className="bg-white/10 px-2 py-0.5 rounded border border-white/10">
                  Lekár: <strong className="text-white">{plan.doctorName}</strong>
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <button
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              className="bg-gradient-to-r from-[#C5A059] to-[#d6b26b] hover:from-[#b08d4b] hover:to-[#c5a059] text-[#2C2A29] px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50 active:scale-95"
              title="Stiahnuť plán starostlivosti v čistom A4 PDF formáte s hlavičkou kliniky"
            >
              {generatingPdf ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 text-[#2C2A29] animate-spin" />
                  <span>Generujem A4 PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-[#2C2A29]" />
                  <span>Stiahnuť A4 PDF</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowPdfPreviewModal(true)}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:border-[#C5A059]"
              title="Zobraziť tlačový náhľad certifikovaného A4 dokumentu"
            >
              <Eye className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Náhľad A4</span>
            </button>
            <button
              onClick={handlePrint}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Vytlačiť plán pre pacienta na domov"
            >
              <Printer className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Tlačiť A4</span>
            </button>
          </div>
        </div>

        {/* NAVIGÁCIA MEDZI SEZÓNNYMI SEZÓNNYMI ČASŤAMI PLÁNU */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-white/10">
          <button
            onClick={() => setActiveSection('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSection === 'all'
                ? 'bg-[#C5A059] text-[#2C2A29] shadow-md'
                : 'bg-white/5 text-stone-300 hover:bg-white/10'
            }`}
          >
            📋 Kompletný prehľad
          </button>
          <button
            onClick={() => setActiveSection('cosmetics')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSection === 'cosmetics'
                ? 'bg-[#C5A059] text-[#2C2A29] shadow-md'
                : 'bg-white/5 text-stone-300 hover:bg-white/10'
            }`}
          >
            <span>🧴 Domáca kozmetika & Rutina</span>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full">
              {(plan.cosmeticsRoutine?.morning?.length || 0) + (plan.cosmeticsRoutine?.evening?.length || 0)}
            </span>
          </button>
          <button
            onClick={() => setActiveSection('schedule')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSection === 'schedule'
                ? 'bg-[#C5A059] text-[#2C2A29] shadow-md'
                : 'bg-white/5 text-stone-300 hover:bg-white/10'
            }`}
          >
            <span>🗓️ Ročný harmonogram procedúr</span>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full">
              {plan.annualTreatments?.length || 0}
            </span>
          </button>
          {plan.preOpCare && (
            <button
              onClick={() => setActiveSection('pre_op')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSection === 'pre_op'
                  ? 'bg-amber-500 text-[#2C2A29] shadow-md'
                  : 'bg-white/5 text-stone-300 hover:bg-white/10'
              }`}
            >
              <span>⚠️ Predoperačná príprava</span>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full">
                {plan.preOpCare.instructions.length}
              </span>
            </button>
          )}
          {plan.postOpCare && (
            <button
              onClick={() => setActiveSection('post_op')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSection === 'post_op'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'bg-white/5 text-stone-300 hover:bg-white/10'
              }`}
            >
              <span>🩹 Rekonvalescencia & Jazvy</span>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full">
                {plan.postOpCare.phases.length} fázy
              </span>
            </button>
          )}
        </div>
      </div>

      {/* 1. SEKCIA: DOMÁCA KOZMETIKA & RUTINA */}
      {(activeSection === 'all' || activeSection === 'cosmetics') && (
        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-3 border-b border-[#E8E2D9] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🧴</span>
                <h3 className="text-base font-bold text-[#2C2A29]">
                  Odporúčaná domáca dermokozmetická starostlivosť & Dve triedy produktov
                </h3>
              </div>
              <p className="text-xs text-[#8C857B] mt-0.5">
                Klinicky overené protokoly rozdelené na <strong>Lekárenskú dermokozmetiku</strong> (dostupnejšia) a <strong>Medicínsku kozmeceutiku</strong> (špičková bunková veda).
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {onOpenInCosmeticsPOS && (
                <button
                  type="button"
                  onClick={() => {
                    const allItems = [
                      ...(plan.cosmeticsRoutine?.morning || []),
                      ...(plan.cosmeticsRoutine?.evening || [])
                    ].map(item => {
                      if (selectedTierFilter === 'standard' && item.standardOption) {
                        return {
                          ...item,
                          productName: item.standardOption.productName,
                          brand: item.standardOption.brand,
                          price: item.standardOption.price
                        };
                      }
                      if (selectedTierFilter === 'premium' && item.premiumOption) {
                        return {
                          ...item,
                          productName: item.premiumOption.productName,
                          brand: item.premiumOption.brand,
                          price: item.premiumOption.price
                        };
                      }
                      return item;
                    });
                    onOpenInCosmeticsPOS(allItems, plan.patientId);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-[#2C2A29] hover:bg-[#C5A059] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Vložiť zvolené produkty do pokladničného košíka na recepcii"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Kúpiť {selectedTierFilter === 'standard' ? 'Lekárenskú' : selectedTierFilter === 'premium' ? 'Medicínsku' : ''} v POS pokladni</span>
                </button>
              )}
            </div>
          </div>

          {/* PREPÍNAČ TRIED KOZMETIKY (MID-END VS HIGH-END) */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#6B6357] uppercase tracking-wider">
                Cenová kategória:
              </span>
              <div className="inline-flex p-1 bg-white border border-[#E8E2D9] rounded-lg shadow-2xs">
                <button
                  type="button"
                  onClick={() => setSelectedTierFilter('both')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    selectedTierFilter === 'both'
                      ? 'bg-[#2C2A29] text-white shadow-xs'
                      : 'text-[#6B6357] hover:text-[#2C2A29]'
                  }`}
                >
                  Porovnanie 1:1 (Obe verzie)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTierFilter('standard')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedTierFilter === 'standard'
                      ? 'bg-sky-800 text-white shadow-xs'
                      : 'text-[#6B6357] hover:text-sky-800'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                  <span>Lekárenská dermokozmetika (~{standardTotal.toFixed(2)} €)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTierFilter('premium')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedTierFilter === 'premium'
                      ? 'bg-[#C5A059] text-white shadow-xs'
                      : 'text-[#6B6357] hover:text-[#C5A059]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-300"></span>
                  <span>Medicínska kozmeceutika (~{premiumTotal.toFixed(2)} €)</span>
                </button>
              </div>
            </div>
            <div className="text-xs text-[#8C857B] font-medium">
              {selectedTierFilter === 'both' ? (
                <span>Rozpočet rutiny: <strong className="text-sky-800 font-bold">{standardTotal.toFixed(0)} €</strong> (Lekáreň) vs. <strong className="text-[#C5A059] font-bold">{premiumTotal.toFixed(0)} €</strong> (Medicínska)</span>
              ) : selectedTierFilter === 'standard' ? (
                <span>Celková cena dostupnejšej rutiny: <strong className="text-sky-800 font-bold">{standardTotal.toFixed(2)} €</strong></span>
              ) : (
                <span>Celková cena prémiovej rutiny: <strong className="text-[#C5A059] font-bold">{premiumTotal.toFixed(2)} €</strong></span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* RANNÁ RUTINA */}
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-amber-50/70 border border-amber-200/80 p-3 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-lg">☀️</span>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-amber-900">
                    Ranná Rutina (Ochrana & Antioxidanty)
                  </h4>
                </div>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                  {plan.cosmeticsRoutine?.morning?.length || 0} kroky
                </span>
              </div>

              <div className="space-y-3">
                {plan.cosmeticsRoutine?.morning?.map((item, idx) => {
                  const hasBoth = !!(item.standardOption && item.premiumOption);
                  return (
                    <div 
                      key={idx} 
                      className="p-3.5 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5]/50 hover:bg-white hover:border-[#C5A059] transition-all space-y-2.5"
                    >
                      <div className="flex justify-between items-center gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#2C2A29] text-[#C5A059] text-[10px] font-bold flex items-center justify-center shrink-0">
                            {item.step}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059]">
                            {item.category}
                          </span>
                        </div>
                      </div>

                      {/* Zobrazenie možností podľa zvoleného filtra */}
                      {selectedTierFilter === 'both' && hasBoth ? (
                        <div className="space-y-2 pt-1">
                          {/* STANDARD MOŽNOSŤ */}
                          <div className="p-2.5 rounded-lg bg-sky-50/60 border border-sky-200/70 space-y-1">
                            <div className="flex justify-between items-start gap-2">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-sky-800 bg-sky-100 px-1.5 py-0.5 rounded">
                                Lekárenská dermokozmetika
                              </span>
                              <span className="text-xs font-mono font-bold text-sky-900">
                                {item.standardOption!.price.toFixed(2)} €
                              </span>
                            </div>
                            <h5 className="text-xs font-bold text-[#2C2A29]">
                              {item.standardOption!.productName}
                            </h5>
                            <p className="text-[10px] text-[#6B6357]">
                              <strong>Aplikácia:</strong> {item.standardOption!.usage}
                            </p>
                            <p className="text-[10px] text-[#8C857B] italic">
                              💡 {item.standardOption!.purpose}
                            </p>
                          </div>

                          {/* PREMIUM MOŽNOSŤ */}
                          <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200/70 space-y-1">
                            <div className="flex justify-between items-start gap-2">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-900 bg-amber-200/60 px-1.5 py-0.5 rounded">
                                Medicínska kozmeceutika
                              </span>
                              <span className="text-xs font-mono font-bold text-[#2C2A29]">
                                {item.premiumOption!.price.toFixed(2)} €
                              </span>
                            </div>
                            <h5 className="text-xs font-bold text-[#2C2A29]">
                              {item.premiumOption!.productName}
                            </h5>
                            <p className="text-[10px] text-[#6B6357]">
                              <strong>Aplikácia:</strong> {item.premiumOption!.usage}
                            </p>
                            <p className="text-[10px] text-[#8C857B] italic">
                              👑 {item.premiumOption!.purpose}
                            </p>
                          </div>
                        </div>
                      ) : (
                        // Jediná vybraná možnosť (štandard alebo prémium)
                        (() => {
                          const activeOpt = (selectedTierFilter === 'standard' && item.standardOption)
                            ? item.standardOption
                            : (selectedTierFilter === 'premium' && item.premiumOption)
                            ? item.premiumOption
                            : (item.standardOption || item.premiumOption || item);
                          const isPrem = activeOpt === item.premiumOption;
                          return (
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-start gap-2">
                                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                  isPrem ? 'bg-amber-100 text-amber-900' : 'bg-sky-100 text-sky-800'
                                }`}>
                                  {isPrem ? 'Medicínska kozmeceutika' : 'Lekárenská dermokozmetika'}
                                </span>
                                {activeOpt.price && (
                                  <span className="text-xs font-mono font-bold text-[#2C2A29]">
                                    {activeOpt.price.toFixed(2)} €
                                  </span>
                                )}
                              </div>
                              <h5 className="text-xs font-bold text-[#2C2A29]">
                                {activeOpt.productName}
                              </h5>
                              <p className="text-[11px] text-[#8C857B] leading-relaxed">
                                <strong>Aplikácia:</strong> {activeOpt.usage}
                              </p>
                              <p className="text-[10px] text-[#6B6357] italic bg-white p-2 rounded-lg border border-[#E8E2D9]/60">
                                💡 <strong>Účel:</strong> {activeOpt.purpose}
                              </p>
                            </div>
                          );
                        })()
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* VEČERNÁ RUTINA */}
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-indigo-50/70 border border-indigo-200/80 p-3 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🌙</span>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-900">
                    Večerná Rutina (Bunková Obnova & Regenerácia)
                  </h4>
                </div>
                <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded">
                  {plan.cosmeticsRoutine?.evening?.length || 0} kroky
                </span>
              </div>

              <div className="space-y-3">
                {plan.cosmeticsRoutine?.evening?.map((item, idx) => {
                  const hasBoth = !!(item.standardOption && item.premiumOption);
                  return (
                    <div 
                      key={idx} 
                      className="p-3.5 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5]/50 hover:bg-white hover:border-indigo-300 transition-all space-y-2.5"
                    >
                      <div className="flex justify-between items-center gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#2C2A29] text-indigo-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {item.step}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800">
                            {item.category}
                          </span>
                        </div>
                      </div>

                      {/* Zobrazenie možností podľa zvoleného filtra */}
                      {selectedTierFilter === 'both' && hasBoth ? (
                        <div className="space-y-2 pt-1">
                          {/* STANDARD MOŽNOSŤ */}
                          <div className="p-2.5 rounded-lg bg-sky-50/60 border border-sky-200/70 space-y-1">
                            <div className="flex justify-between items-start gap-2">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-sky-800 bg-sky-100 px-1.5 py-0.5 rounded">
                                Lekárenská dermokozmetika
                              </span>
                              <span className="text-xs font-mono font-bold text-sky-900">
                                {item.standardOption!.price.toFixed(2)} €
                              </span>
                            </div>
                            <h5 className="text-xs font-bold text-[#2C2A29]">
                              {item.standardOption!.productName}
                            </h5>
                            <p className="text-[10px] text-[#6B6357]">
                              <strong>Aplikácia:</strong> {item.standardOption!.usage}
                            </p>
                            <p className="text-[10px] text-[#8C857B] italic">
                              💡 {item.standardOption!.purpose}
                            </p>
                          </div>

                          {/* PREMIUM MOŽNOSŤ */}
                          <div className="p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-200/70 space-y-1">
                            <div className="flex justify-between items-start gap-2">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-900 bg-indigo-100 px-1.5 py-0.5 rounded">
                                Medicínska kozmeceutika
                              </span>
                              <span className="text-xs font-mono font-bold text-[#2C2A29]">
                                {item.premiumOption!.price.toFixed(2)} €
                              </span>
                            </div>
                            <h5 className="text-xs font-bold text-[#2C2A29]">
                              {item.premiumOption!.productName}
                            </h5>
                            <p className="text-[10px] text-[#6B6357]">
                              <strong>Aplikácia:</strong> {item.premiumOption!.usage}
                            </p>
                            <p className="text-[10px] text-[#8C857B] italic">
                              👑 {item.premiumOption!.purpose}
                            </p>
                          </div>
                        </div>
                      ) : (
                        // Jediná vybraná možnosť
                        (() => {
                          const activeOpt = (selectedTierFilter === 'standard' && item.standardOption)
                            ? item.standardOption
                            : (selectedTierFilter === 'premium' && item.premiumOption)
                            ? item.premiumOption
                            : (item.standardOption || item.premiumOption || item);
                          const isPrem = activeOpt === item.premiumOption;
                          return (
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-start gap-2">
                                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                  isPrem ? 'bg-indigo-100 text-indigo-900' : 'bg-sky-100 text-sky-800'
                                }`}>
                                  {isPrem ? 'Medicínska kozmeceutika' : 'Lekárenská dermokozmetika'}
                                </span>
                                {activeOpt.price && (
                                  <span className="text-xs font-mono font-bold text-[#2C2A29]">
                                    {activeOpt.price.toFixed(2)} €
                                  </span>
                                )}
                              </div>
                              <h5 className="text-xs font-bold text-[#2C2A29]">
                                {activeOpt.productName}
                              </h5>
                              <p className="text-[11px] text-[#8C857B] leading-relaxed">
                                <strong>Aplikácia:</strong> {activeOpt.usage}
                              </p>
                              <p className="text-[10px] text-[#6B6357] italic bg-white p-2 rounded-lg border border-[#E8E2D9]/60">
                                💡 <strong>Účel:</strong> {activeOpt.purpose}
                              </p>
                            </div>
                          );
                        })()
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ŠPECIÁLNA STAROSTLIVOSŤ */}
          {plan.cosmeticsRoutine?.specialWeeklyCare && plan.cosmeticsRoutine.specialWeeklyCare.length > 0 && (
            <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl p-4 space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-[#2C2A29] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                Doplnková týždenná & nutričná starostlivosť
              </h5>
              <ul className="space-y-1.5 text-xs text-[#6B6357]">
                {plan.cosmeticsRoutine.specialWeeklyCare.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#C5A059] font-bold">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 2. SEKCIA: ROČNÝ HARMONOGRAM PROCEDÚR NA 12 MESIACOV */}
      {(activeSection === 'all' || activeSection === 'schedule') && (
        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-3 border-b border-[#E8E2D9] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🗓️</span>
                <h3 className="text-base font-bold text-[#2C2A29]">
                  Ročný harmonogram procedúr, laserov & zákrokov
                </h3>
              </div>
              <p className="text-xs text-[#8C857B] mt-0.5">
                Časový plán rozdelený do kvartálov s rešpektovaním sezónnosti (lasery na jeseň/zimu, biostimulácia na jar, hydratácia na leto).
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-[#2C2A29]">
                Celkový odhadovaný rozpočet: {plan.annualTreatments?.reduce((sum, t) => sum + (t.estimatedPrice || 0), 0)} €
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {plan.annualTreatments?.map((treatment) => {
              const categoryColor = 
                treatment.category === 'laser' ? 'bg-purple-100 text-purple-900 border-purple-200' :
                treatment.category === 'injectable' ? 'bg-sky-100 text-sky-900 border-sky-200' :
                treatment.category === 'surgery' ? 'bg-rose-100 text-rose-900 border-rose-200' :
                treatment.category === 'scar_care' ? 'bg-amber-100 text-amber-900 border-amber-200' :
                'bg-emerald-100 text-emerald-900 border-emerald-200';

              const categoryName = 
                treatment.category === 'laser' ? '⚡ Laser & Resurfacing' :
                treatment.category === 'injectable' ? '💉 Injekčná aplikácia / Výplň' :
                treatment.category === 'surgery' ? '🏥 Chirurgický zákrok' :
                treatment.category === 'scar_care' ? '🩹 Terapia jaziev' :
                '✨ Prístrojová & Pleťová terapia';

              return (
                <div 
                  key={treatment.id}
                  className={`border rounded-xl p-4.5 transition-all space-y-2.5 ${
                    treatment.status === 'completed' ? 'bg-gray-50 border-gray-200 opacity-75' :
                    treatment.status === 'booked' ? 'bg-sky-50/60 border-sky-200' :
                    'bg-[#FAF8F5]/40 border-[#E8E2D9] hover:border-[#C5A059]'
                  }`}
                >
                  <div className="flex flex-wrap justify-between items-start gap-3">
                    <div className="space-y-1 max-w-xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${categoryColor}`}>
                          {categoryName}
                        </span>
                        <span className="text-[11px] font-bold text-[#2C2A29] bg-stone-200/80 px-2 py-0.5 rounded">
                          📅 {treatment.seasonOrMonth}
                        </span>
                        {treatment.priority === 'high' && (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                            Kľúčový zákrok
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-[#2C2A29]">
                        {treatment.name}
                      </h4>

                      <p className="text-xs text-[#8C857B]">
                        Oblasť: <strong className="text-[#2C2A29]">{treatment.targetArea}</strong> • Rozsah / Frekvencia: <strong className="text-[#2C2A29]">{treatment.frequencyOrSessions}</strong>
                      </p>

                      {treatment.notes && (
                        <p className="text-[11px] text-[#6B6357] italic bg-white p-2 rounded-lg border border-[#E8E2D9]/60">
                          {treatment.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {treatment.estimatedPrice ? (
                        <span className="text-sm font-mono font-bold text-[#2C2A29]">
                          {treatment.estimatedPrice} €
                        </span>
                      ) : (
                        <span className="text-xs text-[#8C857B] italic">V cene operácie</span>
                      )}

                      <div className="flex items-center gap-1.5">
                        {onScheduleTreatment && (
                          <button
                            onClick={() => onScheduleTreatment(treatment)}
                            className="text-xs bg-sky-700 hover:bg-sky-800 text-white px-3 py-1.5 rounded-lg font-bold shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                            title="Naplánovať tento zákrok priamo do klinického kalendára"
                          >
                            <CalendarPlus className="w-3.5 h-3.5" />
                            <span>Rezervovať v kalendári</span>
                          </button>
                        )}

                        <select
                          value={treatment.status}
                          onChange={(e) => updateTreatmentStatus(treatment.id, e.target.value as any)}
                          className="text-[11px] bg-white border border-[#E8E2D9] rounded-lg px-2 py-1.5 font-bold text-[#2C2A29] cursor-pointer"
                        >
                          <option value="planned">⏳ Plánované</option>
                          <option value="booked">📅 V kalendári</option>
                          <option value="completed">✅ Absolvované</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. SEKCIA: PREDOPERAČNÁ PRÍPRAVA (AK JE ZÁKROK SÚČASŤOU) */}
      {plan.preOpCare && (activeSection === 'all' || activeSection === 'pre_op') && (
        <div className="bg-white border border-amber-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-3 border-b border-amber-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-[#2C2A29]">
                  Predoperačná príprava pacienta: {plan.preOpCare.procedureName}
                </h3>
              </div>
              <p className="text-xs text-[#8C857B] mt-0.5">
                Dôsledné dodržanie predoperačného protokolu minimalizuje riziko krvácania, infekcie a zabezpečuje dokonalé hojenie.
              </p>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
              Bezpečnostný protokol operácie
            </span>
          </div>

          <div className="space-y-3">
            {plan.preOpCare.instructions.map((ins) => {
              const isDone = !!checklistState[ins.id];
              return (
                <div 
                  key={ins.id}
                  onClick={() => toggleChecklistItem(ins.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                    isDone 
                      ? 'bg-emerald-50/70 border-emerald-200' 
                      : ins.mandatory 
                      ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300' 
                      : 'bg-white border-[#E8E2D9] hover:border-[#C5A059]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => {}} // Handled by parent div
                    className="w-4 h-4 text-emerald-600 rounded mt-0.5 cursor-pointer"
                  />

                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded">
                        ⏰ {ins.timeframe}
                      </span>
                      <h4 className={`text-xs font-bold ${isDone ? 'line-through text-emerald-800' : 'text-[#2C2A29]'}`}>
                        {ins.title}
                      </h4>
                      {ins.mandatory && (
                        <span className="text-[9px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded uppercase">
                          Povinné
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] leading-relaxed ${isDone ? 'text-emerald-700' : 'text-[#6B6357]'}`}>
                      {ins.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. SEKCIA: POOPERAČNÁ STAROSTLIVOSŤ, REKONVALESCENCIA & JAZVY */}
      {plan.postOpCare && (activeSection === 'all' || activeSection === 'post_op') && (
        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-3 border-b border-[#E8E2D9] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-[#C5A059]" />
                <h3 className="text-base font-bold text-[#2C2A29]">
                  Pooperačná starostlivosť, rekonvalescencia & Zlatý štandard pre jazvy
                </h3>
              </div>
              <p className="text-xs text-[#8C857B] mt-0.5">
                Harmonogram fáz hojenia, tlakové masáže, silikónové gély a následné estetické zákroky (lasery, microneedling) pre neviditeľné jazvy.
              </p>
            </div>
          </div>

          {/* PROTOKOL STAROSTLIVOSTI O JAZVY (ZVÝRAZNENÝ PANEL) */}
          {plan.postOpCare.scarProtocol && (
            <div className="bg-gradient-to-br from-[#FAF8F5] via-amber-50/40 to-[#FAF8F5] border-2 border-[#C5A059]/40 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🩹</span>
                <h4 className="text-sm font-bold text-[#2C2A29] uppercase tracking-wider">
                  Medicínsky protokol starostlivosti o jazvy (SAY CLINIC SCAR PROTOCOL)
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-[#E8E2D9] space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#C5A059]">
                    <span>💧</span>
                    <span>1. Silikónový gél / krytie</span>
                  </div>
                  <p className="text-[11px] text-[#6B6357] leading-relaxed">
                    {plan.postOpCare.scarProtocol.siliconeApplication}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#E8E2D9] space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sky-800">
                    <span>🤏</span>
                    <span>2. Tlakové masáže jaziev</span>
                  </div>
                  <p className="text-[11px] text-[#6B6357] leading-relaxed">
                    {plan.postOpCare.scarProtocol.pressureMassage}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#E8E2D9] space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                    <span>☀️</span>
                    <span>3. SPF 50+ minerálna ochrana</span>
                  </div>
                  <p className="text-[11px] text-[#6B6357] leading-relaxed">
                    {plan.postOpCare.scarProtocol.sunProtection}
                  </p>
                </div>
              </div>

              {plan.postOpCare.scarProtocol.advancedScarTherapies && (
                <div className="bg-white p-3.5 rounded-xl border border-[#E8E2D9] space-y-1.5">
                  <span className="text-xs font-bold text-[#2C2A29] flex items-center gap-1.5">
                    <span>⚡</span> Následné klinické procedúry na jazvy v priebehu roka:
                  </span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {plan.postOpCare.scarProtocol.advancedScarTherapies.map((therapy, i) => (
                      <span key={i} className="text-[11px] bg-purple-50 text-purple-900 border border-purple-200 px-2.5 py-1 rounded-lg font-medium">
                        {therapy}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* FÁZY REKONVALESCENCIE */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#2C2A29]">
              Fázy zotavenia & Inštrukcie pre pacienta
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plan.postOpCare.phases.map((phase) => (
                <div 
                  key={phase.phaseId}
                  className="border border-[#E8E2D9] rounded-xl p-4.5 bg-[#FAF8F5]/30 space-y-3"
                >
                  <div className="flex justify-between items-start gap-2 border-b border-[#E8E2D9] pb-2.5">
                    <div>
                      <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-wider">
                        {phase.period}
                      </span>
                      <h5 className="text-xs font-bold text-[#2C2A29]">
                        {phase.title}
                      </h5>
                    </div>
                    <span className="text-[10px] font-mono text-[#8C857B] bg-white px-2 py-0.5 rounded border border-[#E8E2D9]">
                      {phase.focus}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-[#8C857B]">
                      Pokyny:
                    </span>
                    <ul className="space-y-1 text-xs text-[#6B6357]">
                      {phase.instructions.map((ins, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[#C5A059] font-bold">•</span>
                          <span>{ins}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {phase.scarCareGuidelines && phase.scarCareGuidelines.length > 0 && (
                    <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/60 space-y-1">
                      <span className="text-[10px] font-bold text-amber-900 uppercase">
                        Starostlivosť o jazvu:
                      </span>
                      <ul className="space-y-1 text-[11px] text-amber-950">
                        {phase.scarCareGuidelines.map((g, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span>🩹</span>
                            <span>{g}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {phase.warningSigns && phase.warningSigns.length > 0 && (
                    <div className="bg-rose-50 p-2.5 rounded-lg border border-rose-200 space-y-1">
                      <span className="text-[10px] font-bold text-rose-800 uppercase flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Varovné príznaky:
                      </span>
                      <ul className="space-y-0.5 text-[11px] text-rose-900">
                        {phase.warningSigns.map((w, idx) => (
                          <li key={idx}>• {w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* POZNÁMKA LEKÁRA */}
      {plan.doctorNote && (
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-xs text-[#6B6357] flex items-start gap-3">
          <Stethoscope className="w-5 h-5 text-[#C5A059] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h5 className="font-bold text-[#2C2A29]">Poznámka ošetrujúceho lekára:</h5>
            <p className="italic leading-relaxed">{plan.doctorNote}</p>
          </div>
        </div>
      )}

      {/* 5. SKRYTÝ OFF-SCREEN A4 DOKUMENT PRE ČISTÝ EXPORT DO PDF A TLAČ */}
      <div
        id="printable-patient-plan-container"
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          zIndex: -999,
          pointerEvents: 'none'
        }}
        className="printable-document print:static print:left-0 print:top-0 print:block"
        aria-hidden="true"
      >
        <PatientPlanPdfDocument
          ref={pdfDocumentRef}
          plan={plan}
          patient={patient}
        />
      </div>

      {/* 6. NÁHĽAD A4 DOKUMENTU PRED TLAČOU / STIAHNUTÍM */}
      {showPdfPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-xs print:hidden animate-in fade-in">
          <div className="bg-[#2C2A29] text-white rounded-2xl max-w-5xl w-full max-h-[95vh] flex flex-col shadow-2xl border border-[#C5A059]/40 overflow-hidden">
            {/* Hlavička modálu */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#242221]">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-[#C5A059]" />
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <span>Náhľad dokumentu: {plan.title}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#C5A059] text-[#2C2A29]">
                      A4 Tlačový formát SAY CLINIC
                    </span>
                  </h3>
                  <p className="text-[11px] text-white/60">
                    Klinický štandard s logom, kompletnou rutinou, ročným harmonogramom, protokolom jaziev a podpisom
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={generatingPdf}
                  className="px-3.5 py-1.5 bg-[#C5A059] hover:bg-[#B38F46] text-[#2C2A29] font-black hover:text-white rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                  title="Stiahnuť PDF súbor do počítača"
                >
                  {generatingPdf ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sťahujem PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 text-[#2C2A29]" />
                      <span>Stiahnuť PDF</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-white/20 cursor-pointer"
                  title="Vytlačiť cez tlačiareň"
                >
                  <Printer className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Tlačiť A4</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPdfPreviewModal(false)}
                  className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Telo modálu - zobrazenie A4 dokumentu */}
            <div className="p-6 overflow-y-auto bg-[#403D39] flex justify-center">
              <div className="shadow-2xl rounded-sm overflow-hidden bg-white max-w-[794px] w-full border border-[#D4C7B5]">
                <PatientPlanPdfDocument
                  plan={plan}
                  patient={patient}
                />
              </div>
            </div>

            {/* Pätička modálu */}
            <div className="p-3 border-t border-white/10 bg-[#242221] flex justify-between items-center text-xs text-white/60">
              <span>SAY CLINIC • Lazovná 43, Banská Bystrica • MUDr. Ján Mráz</span>
              <button
                type="button"
                onClick={() => setShowPdfPreviewModal(false)}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                Zavrieť náhľad
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
