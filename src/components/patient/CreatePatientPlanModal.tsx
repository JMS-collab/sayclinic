'use client';

import React, { useState } from 'react';
import {
  PatientPlan,
  PRESET_PATIENT_PLANS
} from '@/data/patientPlanConfig';
import { Patient } from '../PatientDatabase';
import {
  X,
  Sparkles,
  AlertCircle,
  Loader2,
  Check,
  ShieldCheck
} from 'lucide-react';
import { MeicetUploadModal } from '../meicet/MeicetUploadModal';
import { MeicetService } from '@/services/meicetService';
import { EBM_PROCEDURE_CATALOG, EBM_PROCEDURE_GROUPS, synthesizeEbmPatientPlan } from '@/services/ebmPlanSynthesizer';

interface CreatePatientPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  onSavePlan: (newPlan: PatientPlan) => void;
  initialContext?: {
    planType?: 'annual_aesthetic' | 'pre_post_op' | 'combined';
    procedureName?: string;
    diagnosisOrGoal?: string;
    skinType?: string;
    mainConcerns?: string[];
    vectorZones?: string[];
  };
}

export default function CreatePatientPlanModal({
  isOpen,
  onClose,
  patient,
  onSavePlan,
  initialContext
}: CreatePatientPlanModalProps) {
  const [planType, setPlanType] = useState<'annual_aesthetic' | 'pre_post_op' | 'combined'>(
    initialContext?.planType || 'combined'
  );
  const [title, setTitle] = useState(
    initialContext?.procedureName
      ? `Plán starostlivosti (3-v-1): ${initialContext.procedureName}`
      : 'Ročný plán pacienta (3-v-1)'
  );
  const [diagnosisOrGoal, setDiagnosisOrGoal] = useState(
    initialContext?.diagnosisOrGoal || ''
  );
  const [procedureName, setProcedureName] = useState(initialContext?.procedureName || '');
  const [skinType, setSkinType] = useState(initialContext?.skinType || 'Zmiešaná / normálna');
  const [mainConcerns, setMainConcerns] = useState(
    initialContext?.mainConcerns?.join(', ') || 'Optimalizácia stavu pleti, regenerácia a prevencia starnutia'
  );
  const [doctorName] = useState('MUDr. Ján Mráz');

  // Vybraté operácie a výkony, podľa ktorých AI zostaví celý ročný plán
  const [selectedProcedureIds, setSelectedProcedureIds] = useState<string[]>([
    'blepharoplasty_upper_lower',
    'fractional_co2_laser',
    'botulinum_hyaluronic',
    'polynucleotides_profhilo'
  ]);

  const [selectedPresetKey, setSelectedPresetKey] = useState<string>('face_sequential_transformation');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [showMeicetModal, setShowMeicetModal] = useState(false);

  if (!isOpen) return null;

  const toggleProcedureId = (id: string) => {
    setSelectedProcedureIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      const names = EBM_PROCEDURE_CATALOG.filter(p => next.includes(p.id)).map(p => p.shortLabel);
      if (names.length > 0) {
        setTitle(`Ročný plán starostlivosti: ${names.join(' ➔ ')}`);
        setProcedureName(names.join(', '));
      }
      return next;
    });
  };

  const handleApplyPreset = (key: string) => {
    setSelectedPresetKey(key);
    const preset = PRESET_PATIENT_PLANS[key];
    if (key === 'face_sequential_transformation') {
      setSelectedProcedureIds(['deep_plane_facelift', 'blepharoplasty_upper_lower', 'fractional_co2_laser', 'botulinum_hyaluronic']);
    } else if (key === 'face_annual_rejuvenation') {
      setSelectedProcedureIds(['fractional_co2_laser', 'botulinum_hyaluronic', 'polynucleotides_profhilo']);
    } else if (key === 'breast_surgery_care') {
      setSelectedProcedureIds(['breast_augmentation_mastopexy', 'vascular_scar_laser']);
    } else if (key === 'blepharoplasty_care') {
      setSelectedProcedureIds(['blepharoplasty_upper_lower', 'vascular_scar_laser', 'botulinum_hyaluronic']);
    }
    if (preset) {
      if (preset.title) setTitle(preset.title);
      if (preset.planType) setPlanType(preset.planType);
      if (preset.diagnosisOrGoal) setDiagnosisOrGoal(preset.diagnosisOrGoal);
      if (preset.preOpCare?.procedureName) setProcedureName(preset.preOpCare.procedureName);
      if (preset.analysisSummary?.skinType) setSkinType(preset.analysisSummary.skinType);
      if (preset.analysisSummary?.mainConcerns) setMainConcerns(preset.analysisSummary.mainConcerns.join(', '));
    }
  };

  const handleGeneratePlan = async () => {
    setIsGeneratingAI(true);
    setGenerationError(null);

    try {
      const response = await fetch('/api/ai/patient-plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: patient.name,
          patientId: patient.id,
          patientBirthNumber: patient.birthNumber,
          planType,
          title,
          diagnosisOrGoal,
          procedureName,
          skinType,
          selectedProcedureIds,
          mainConcerns: mainConcerns.split(',').map(s => s.trim()).filter(Boolean),
          vectorZones: initialContext?.vectorZones || [],
          doctorName,
          forceRefresh: true
        })
      });

      const data = await response.json();
      if (data.success && data.plan) {
        onSavePlan(data.plan);
        onClose();
      } else {
        throw new Error(data.error || 'Generovanie zlyhalo');
      }
    } catch (err: any) {
      console.error('Chyba AI generovania, aktivovaný EBM klinický syntetizátor:', err);
      const fallbackPlan = synthesizeEbmPatientPlan({
        patientId: patient.id,
        patientName: patient.name,
        patientBirthNumber: patient.birthNumber,
        doctorName,
        skinType,
        selectedProcedureIds,
        diagnosisOrGoal: diagnosisOrGoal || procedureName
      });
      onSavePlan(fallbackPlan);
      onClose();
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
      <div className="bg-white border border-[#E8E2D9] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* HLAVIČKA MODALU */}
        <div className="bg-gradient-to-r from-[#2C2A29] to-[#3a3735] text-white p-5 flex justify-between items-center border-b border-[#C5A059]/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C5A059]/20 border border-[#C5A059]/50 flex items-center justify-center text-xl">
              ✨
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>AI & EBM Zostavenie Ročného Plánu Pacienta (3-v-1)</span>
              </h3>
              <p className="text-xs text-stone-300">
                Pacient: <strong className="text-white">{patient.name}</strong> • RČ: {patient.birthNumber} • Overené podľa medzinárodných guidelinov (ERAS®, ASPS, EADV)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TELO FORMULÁRA */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#2C2A29]">
          {/* BANNER PRE MEICET PRO-A INTEGRÁCIU */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FAF8F5] via-white to-[#FAF8F5] border-2 border-[#C5A059] flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="text-2xl p-2 bg-[#C5A059]/20 rounded-xl">🔬</span>
              <div>
                <strong className="text-xs font-bold text-[#2C2A29] block">
                  Máte diagnostický PDF report z analyzátora pleti Meicet Pro-A?
                </strong>
                <p className="text-[10px] text-[#8C857B] mt-0.5">
                  AI extrahuje 8 spektier, posúdi ich s chirurgickou a dermatologickou anamnézou a zostaví ročný plán, skincare aj starostlivosť o jazvy.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowMeicetModal(true)}
              className="px-3.5 py-2 bg-[#2C2A29] hover:bg-[#C5A059] text-white rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Nahrať Meicet PDF</span>
            </button>
          </div>

          {/* DROPDOWN VŠETKÝCH VÝKONOV A ZVOLENÉ CHIPY PRE AI PLÁN */}
          <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <label className="font-bold text-xs uppercase tracking-wider text-[#2C2A29] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
                  <span>1. Vyberte operácie a výkony pre pacienta (Dropdown):</span>
                </label>
                <p className="text-[11px] text-[#8C857B] mt-0.5">
                  AI automaticky zostaví bezpečné rozostupy, Skincare rutinu, Prehabilitáciu aj protokol jaziev na mieru zvoleným výkonom.
                </p>
              </div>
              <span className="text-[10px] font-bold bg-[#2C2A29] text-[#C5A059] px-2.5 py-1 rounded-full">
                Zvolené: {selectedProcedureIds.length} výkonov
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <select
                  value=""
                  onChange={(e) => {
                    const id = e.target.value;
                    if (id && !selectedProcedureIds.includes(id)) {
                      toggleProcedureId(id);
                    }
                  }}
                  className="w-full bg-white border-2 border-[#C5A059]/80 focus:border-[#C5A059] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#2C2A29] shadow-xs cursor-pointer appearance-none pr-9 hover:border-[#C5A059]"
                >
                  <option value="" disabled>
                    ➕ Kliknite sem a zvoľte výkon (Plastická chirurgia, Lasery, Injekcie, Pleť)...
                  </option>
                  {EBM_PROCEDURE_GROUPS.map(group => {
                    const groupProcs = EBM_PROCEDURE_CATALOG.filter(p => p.group === group.key);
                    if (groupProcs.length === 0) return null;
                    return (
                      <optgroup key={group.key} label={`${group.icon} ${group.label} (${groupProcs.length})`}>
                        {groupProcs.map(proc => {
                          const isAlreadySelected = selectedProcedureIds.includes(proc.id);
                          return (
                            <option
                              key={proc.id}
                              value={proc.id}
                              className={isAlreadySelected ? 'font-bold text-emerald-700 bg-emerald-50' : 'text-[#2C2A29]'}
                            >
                              {isAlreadySelected ? '✓ [ZVOLENÉ] ' : '• '}
                              {proc.label} — {proc.recoveryTimePatient.split('(')[0].trim()} (~{proc.defaultPrice} €)
                            </option>
                          );
                        })}
                      </optgroup>
                    );
                  })}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#C5A059] font-bold text-xs">
                  ▼
                </div>
              </div>

              {selectedProcedureIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedProcedureIds([])}
                  className="px-3 py-2 rounded-xl bg-white hover:bg-rose-50 border border-[#E8E2D9] hover:border-rose-300 text-rose-700 text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-2xs"
                >
                  ✕ Vyčistiť ({selectedProcedureIds.length})
                </button>
              )}
            </div>

            {/* Zobrazenie zvolených čipov */}
            <div className="pt-1">
              {selectedProcedureIds.length === 0 ? (
                <div className="p-3 text-center rounded-xl border border-dashed border-[#E8E2D9] bg-white text-xs text-[#8C857B]">
                  Zatiaľ ste nezvolili žiadny výkon. Vyberte zákroky z <strong>dropdownu vyššie</strong> alebo zvoľte rýchly profil nižšie.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedProcedureIds.map(procId => {
                    const proc = EBM_PROCEDURE_CATALOG.find(p => p.id === procId);
                    if (!proc) return null;
                    return (
                      <div
                        key={proc.id}
                        className="inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl bg-[#2C2A29] text-white border border-[#C5A059] shadow-xs text-xs font-bold"
                      >
                        <span>{proc.icon}</span>
                        <span>{proc.shortLabel}</span>
                        <span className="text-[9px] font-normal text-amber-200 bg-white/10 px-1.5 py-0.5 rounded">
                          ~{proc.defaultPrice} €
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleProcedureId(proc.id)}
                          className="w-4 h-4 rounded-full bg-white/20 hover:bg-rose-500 hover:text-white flex items-center justify-center text-white/80 transition-colors cursor-pointer ml-1"
                          title="Odstrániť"
                        >
                          <X className="w-2.5 h-2.5 stroke-[2.5]" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RÝCHLE PREDVOLENÉ KOMBINÁCIE */}
          <div className="space-y-2">
            <label className="font-bold text-[11px] uppercase tracking-wider text-[#8C857B] block">
              2. Alebo zvoľte rýchly klinický profil:
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { key: 'face_sequential_transformation', icon: '💎', label: 'Kompletná tvár 3-v-1' },
                { key: 'face_annual_rejuvenation', icon: '✨', label: 'Neinvazívny Anti-Aging' },
                { key: 'breast_surgery_care', icon: '🏥', label: 'Prsníky & Jazvy' },
                { key: 'blepharoplasty_care', icon: '👁️', label: 'Očné viečka & Okolie' }
              ].map(preset => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => handleApplyPreset(preset.key)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedPresetKey === preset.key
                      ? 'border-[#C5A059] bg-[#FAF8F5] font-bold shadow-2xs'
                      : 'border-[#E8E2D9] hover:bg-stone-50'
                  }`}
                >
                  <div className="text-xs text-[#2C2A29] flex items-center gap-1.5">
                    <span>{preset.icon}</span>
                    <span>{preset.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* NÁZOV A DIAGNÓZA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-[11px] uppercase tracking-wider text-[#8C857B]">
                Názov plánu:
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-[#E8E2D9] rounded-xl p-2.5 text-xs text-[#2C2A29] focus:outline-hidden focus:border-[#C5A059]"
                placeholder="napr. Ročný liečebný plán rejuvenácie tváre"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[11px] uppercase tracking-wider text-[#8C857B]">
                Typ pleti pacienta:
              </label>
              <input
                type="text"
                value={skinType}
                onChange={(e) => setSkinType(e.target.value)}
                className="w-full border border-[#E8E2D9] rounded-xl p-2.5 text-xs text-[#2C2A29] focus:outline-hidden focus:border-[#C5A059]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-[11px] uppercase tracking-wider text-[#8C857B]">
              Špecifická indikácia, cieľ alebo poznámka pre AI:
            </label>
            <textarea
              rows={2}
              value={diagnosisOrGoal}
              onChange={(e) => setDiagnosisOrGoal(e.target.value)}
              className="w-full border border-[#E8E2D9] rounded-xl p-2.5 text-xs text-[#2C2A29] focus:outline-hidden focus:border-[#C5A059]"
              placeholder="Zadajte prípadné individuálne požiadavky pacienta..."
            />
          </div>

          {generationError && (
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{generationError}</span>
            </div>
          )}
        </div>

        {/* PÄTIČKA MODALU */}
        <div className="bg-[#FAF8F5] p-4 border-t border-[#E8E2D9] flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold uppercase text-[#8C857B] hover:text-[#2C2A29] transition-colors cursor-pointer"
          >
            Zrušiť
          </button>

          <button
            type="button"
            disabled={isGeneratingAI}
            onClick={handleGeneratePlan}
            className="bg-[#2C2A29] hover:bg-[#C5A059] text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isGeneratingAI ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#C5A059]" />
                <span>AI zostavuje plán podľa EBM guidelinov...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#C5A059]" />
                <span>✨ Zostaviť celý plán s AI podľa vybratých výkonov</span>
              </>
            )}
          </button>
        </div>
      </div>

      {showMeicetModal && (
        <MeicetUploadModal
          isOpen={showMeicetModal}
          onClose={() => setShowMeicetModal(false)}
          patient={patient}
          onAnalysisComplete={(res) => {
            const plan = MeicetService.convertToPatientPlan(res);
            onSavePlan(plan);
            setShowMeicetModal(false);
            onClose();
          }}
        />
      )}
    </div>
  );
}
