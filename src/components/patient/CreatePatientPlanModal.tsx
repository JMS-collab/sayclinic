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
  Loader2 
} from 'lucide-react';

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
    initialContext?.planType || 'annual_aesthetic'
  );
  const [title, setTitle] = useState(
    initialContext?.procedureName 
      ? `Plán starostlivosti: ${initialContext.procedureName}` 
      : 'Ročný estetický plán rejuvenácie pleti a tváre'
  );
  const [diagnosisOrGoal, setDiagnosisOrGoal] = useState(
    initialContext?.diagnosisOrGoal || 'Komplexná starostlivosť, redukcia vrások, obnova elasticity a prevencia fotostarnutia.'
  );
  const [procedureName, setProcedureName] = useState(initialContext?.procedureName || '');
  const [skinType, setSkinType] = useState(initialContext?.skinType || 'Zmiešaná / normálna');
  const [mainConcerns, setMainConcerns] = useState(
    initialContext?.mainConcerns?.join(', ') || 'Mimické vrásky čela, strata elasticity líc, fotostarnutie'
  );
  const [doctorName, setDoctorName] = useState('MUDr. Ján Mráz');
  
  // Rýchle šablóny
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>('face_annual_rejuvenation');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyPreset = (key: string) => {
    setSelectedPresetKey(key);
    const preset = PRESET_PATIENT_PLANS[key];
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
          planType,
          title,
          diagnosisOrGoal,
          procedureName,
          skinType,
          mainConcerns: mainConcerns.split(',').map(s => s.trim()).filter(Boolean),
          vectorZones: initialContext?.vectorZones || [],
          doctorName
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
      console.error('Chyba AI generovania:', err);
      // Fallback: vytvoríme plán z lokálneho presetu
      const preset = PRESET_PATIENT_PLANS[selectedPresetKey] || PRESET_PATIENT_PLANS.face_annual_rejuvenation;
      const fallbackPlan: PatientPlan = {
        id: `plan-${Date.now()}`,
        patientId: patient.id,
        patientName: patient.name,
        patientBirthNumber: patient.birthNumber,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        doctorName: doctorName,
        planType: planType,
        title: title || preset.title || 'Plán pacienta SAY CLINIC',
        diagnosisOrGoal: diagnosisOrGoal || preset.diagnosisOrGoal || 'Komplexná starostlivosť',
        analysisSummary: {
          skinType: skinType,
          skinTonePhototype: 'Fitzpatrick II-III',
          mainConcerns: mainConcerns.split(',').map(s => s.trim()),
          vectorZones: initialContext?.vectorZones || ['Tvár & krk']
        },
        cosmeticsRoutine: preset.cosmeticsRoutine || PRESET_PATIENT_PLANS.face_annual_rejuvenation.cosmeticsRoutine!,
        annualTreatments: (preset.annualTreatments || []).map((t, idx) => ({
          ...t,
          id: `trt-${Date.now()}-${idx}`,
          status: 'planned'
        })),
        preOpCare: preset.preOpCare ? {
          ...preset.preOpCare,
          procedureName: procedureName || preset.preOpCare.procedureName
        } : undefined,
        postOpCare: preset.postOpCare ? {
          ...preset.postOpCare,
          procedureName: procedureName || preset.postOpCare.procedureName
        } : undefined,
        doctorNote: `Vytvorené na klinike SAY CLINIC pre pacienta ${patient.name}.`
      };

      onSavePlan(fallbackPlan);
      onClose();
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white border border-[#E8E2D9] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* HLAVIČKA MODALU */}
        <div className="bg-gradient-to-r from-[#2C2A29] to-[#3a3735] text-white p-5 flex justify-between items-center border-b border-[#C5A059]/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C5A059]/20 border border-[#C5A059]/50 flex items-center justify-center text-xl">
              ✨
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                Nový plán pacienta & Starostlivosť
              </h3>
              <p className="text-xs text-stone-300">
                Pacient: <strong className="text-white">{patient.name}</strong> • RČ: {patient.birthNumber}
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
          {/* RÝCHLE ŠABLÓNY */}
          <div className="space-y-2">
            <label className="font-bold text-[11px] uppercase tracking-wider text-[#8C857B] block">
              1. Zvoľte klinickú šablónu alebo zameranie:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleApplyPreset('face_annual_rejuvenation')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedPresetKey === 'face_annual_rejuvenation'
                    ? 'border-[#C5A059] bg-[#FAF8F5] shadow-xs'
                    : 'border-[#E8E2D9] hover:bg-stone-50'
                }`}
              >
                <div className="font-bold text-xs text-[#2C2A29] flex items-center gap-1.5">
                  <span>✨</span> Ročný anti-aging
                </div>
                <p className="text-[10px] text-[#8C857B] mt-1 leading-tight">
                  Kozmetika, botox, výplne, mezoterapia a frakčný CO2 laser.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('breast_surgery_care')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedPresetKey === 'breast_surgery_care'
                    ? 'border-purple-500 bg-purple-50/50 shadow-xs'
                    : 'border-[#E8E2D9] hover:bg-stone-50'
                }`}
              >
                <div className="font-bold text-xs text-[#2C2A29] flex items-center gap-1.5">
                  <span>🏥</span> Augmentácia prsníkov
                </div>
                <p className="text-[10px] text-[#8C857B] mt-1 leading-tight">
                  Predoperačná príprava, podprsenka, silikón, tlakové masáže jaziev.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('blepharoplasty_care')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedPresetKey === 'blepharoplasty_care'
                    ? 'border-sky-500 bg-sky-50/50 shadow-xs'
                    : 'border-[#E8E2D9] hover:bg-stone-50'
                }`}
              >
                <div className="font-bold text-xs text-[#2C2A29] flex items-center gap-1.5">
                  <span>👁️</span> Blefaroplastika viečok
                </div>
                <p className="text-[10px] text-[#8C857B] mt-1 leading-tight">
                  Chladenie, vybratie stehov, oftalmo silikón, prevencia pigmentácie.
                </p>
              </button>
            </div>
          </div>

          {/* TYP PLÁNU */}
          <div className="space-y-1.5">
            <label className="font-bold text-[11px] uppercase tracking-wider text-[#8C857B] block">
              2. Typ plánu:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label className={`flex items-center gap-2 p-2.5 border rounded-xl cursor-pointer text-xs ${planType === 'annual_aesthetic' ? 'border-[#C5A059] bg-[#C5A059]/10 font-bold text-[#2C2A29]' : 'border-[#E8E2D9] text-[#6B6357]'}`}>
                <input
                  type="radio"
                  name="planType"
                  value="annual_aesthetic"
                  checked={planType === 'annual_aesthetic'}
                  onChange={() => setPlanType('annual_aesthetic')}
                  className="text-[#C5A059]"
                />
                <span>✨ Ročný estetický</span>
              </label>

              <label className={`flex items-center gap-2 p-2.5 border rounded-xl cursor-pointer text-xs ${planType === 'pre_post_op' ? 'border-[#C5A059] bg-[#C5A059]/10 font-bold text-[#2C2A29]' : 'border-[#E8E2D9] text-[#6B6357]'}`}>
                <input
                  type="radio"
                  name="planType"
                  value="pre_post_op"
                  checked={planType === 'pre_post_op'}
                  onChange={() => setPlanType('pre_post_op')}
                  className="text-[#C5A059]"
                />
                <span>🏥 Pred / pooperačný</span>
              </label>

              <label className={`flex items-center gap-2 p-2.5 border rounded-xl cursor-pointer text-xs ${planType === 'combined' ? 'border-[#C5A059] bg-[#C5A059]/10 font-bold text-[#2C2A29]' : 'border-[#E8E2D9] text-[#6B6357]'}`}>
                <input
                  type="radio"
                  name="planType"
                  value="combined"
                  checked={planType === 'combined'}
                  onChange={() => setPlanType('combined')}
                  className="text-[#C5A059]"
                />
                <span>💎 Komplexný (oba)</span>
              </label>
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
                placeholder="napr. Ročný liečebný plán rejuvenácie tváre 2026"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[11px] uppercase tracking-wider text-[#8C857B]">
                Zákrok / Operácia (ak ide o chirurgiu):
              </label>
              <input
                type="text"
                value={procedureName}
                onChange={(e) => setProcedureName(e.target.value)}
                className="w-full border border-[#E8E2D9] rounded-xl p-2.5 text-xs text-[#2C2A29] focus:outline-hidden focus:border-[#C5A059]"
                placeholder="napr. Augmentácia prsníkov, Blefaroplastika..."
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-[11px] uppercase tracking-wider text-[#8C857B]">
              Cieľ liečby, diagnóza alebo sťažnosti pacienta:
            </label>
            <textarea
              rows={2}
              value={diagnosisOrGoal}
              onChange={(e) => setDiagnosisOrGoal(e.target.value)}
              className="w-full border border-[#E8E2D9] rounded-xl p-2.5 text-xs text-[#2C2A29] focus:outline-hidden focus:border-[#C5A059]"
              placeholder="Zlepšenie tonusu pleti, redukcia vrások, správna starostlivosť o jazvy..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-[11px] uppercase tracking-wider text-[#8C857B]">
                Typ pleti:
              </label>
              <input
                type="text"
                value={skinType}
                onChange={(e) => setSkinType(e.target.value)}
                className="w-full border border-[#E8E2D9] rounded-xl p-2 text-xs text-[#2C2A29] focus:outline-hidden focus:border-[#C5A059]"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="font-bold text-[11px] uppercase tracking-wider text-[#8C857B]">
                Hlavné indikácie / požiadavky:
              </label>
              <input
                type="text"
                value={mainConcerns}
                onChange={(e) => setMainConcerns(e.target.value)}
                className="w-full border border-[#E8E2D9] rounded-xl p-2 text-xs text-[#2C2A29] focus:outline-hidden focus:border-[#C5A059]"
              />
            </div>
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
                <span>Generujem plán pacienta...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#C5A059]" />
                <span>✨ Vygenerovať & Uložiť plán pacienta</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
