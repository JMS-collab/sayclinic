'use client';

import React, { useState, useRef } from 'react';
import { 
  PatientPlan, 
  ScheduledTreatment,
  CosmeticRoutineItem,
  PRESET_PATIENT_PLANS
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
  FileText,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Activity
} from 'lucide-react';
import { generatePdfFilename, exportElementToPdf } from '@/lib/pdfGenerator';
import { PatientPlanPdfDocument } from './PatientPlanPdfDocument';
import { MeicetUploadModal } from '../meicet/MeicetUploadModal';
import { MeicetService } from '@/services/meicetService';

interface PatientPlanViewerProps {
  plan: PatientPlan;
  patient?: any;
  onUpdatePlan: (updated: PatientPlan) => void;
  onScheduleTreatment?: (treatment: ScheduledTreatment) => void;
  onOpenInCosmeticsPOS?: (items: CosmeticRoutineItem[], patientId: string) => void;
  onClose?: () => void;
}

const QUICK_SEQUENTIAL_PROCEDURES: Array<{
  label: string;
  icon: string;
  name: string;
  category: ScheduledTreatment['category'];
  seasonOrMonth: string;
  targetArea: string;
  frequencyOrSessions: string;
  estimatedPrice: number;
  priority: ScheduledTreatment['priority'];
  notes: string;
}> = [
  {
    label: 'Facelift (Deep Plane)',
    icon: '🏥',
    name: 'Deep Plane Facelift & Necklift (SMAS lifting)',
    category: 'surgery',
    seasonOrMonth: '1. Krok (Jeseň / Zima)',
    targetArea: 'Stredná a dolná tretina tváre, krk',
    frequencyOrSessions: 'Operácia v celkovej anestézii',
    estimatedPrice: 4800,
    priority: 'high',
    notes: 'Chirurgická repozícia hlbokých štruktúr SMAS a platyzmy.'
  },
  {
    label: 'Blefaroplastika viečok',
    icon: '👁️',
    name: 'Horná a dolná blefaroplastika (Korekcia viečok)',
    category: 'surgery',
    seasonOrMonth: '2. Krok (+2-3 mesiace)',
    targetArea: 'Horné a dolné očné viečka',
    frequencyOrSessions: 'Operácia v lokálnej anestézii',
    estimatedPrice: 1650,
    priority: 'high',
    notes: 'Odstránenie nadbytku kože a tukových prolapsov v periorbitálnej zóne.'
  },
  {
    label: 'Frakčný CO2 Laser',
    icon: '⚡',
    name: 'Frakčný CO2 Laser Resurfacing & Laserová korekcia jaziev',
    category: 'laser',
    seasonOrMonth: '3. Krok (Zima / Jar)',
    targetArea: 'Celá tvár, periorálna zóna & jazvy',
    frequencyOrSessions: '1-2 sedenia',
    estimatedPrice: 550,
    priority: 'high',
    notes: 'Zjednotenie textúry pleti, stiahnutie pórov a vyhladenie pooperačných jaziev.'
  },
  {
    label: 'Botulotoxín & Výplň',
    icon: '💉',
    name: 'Aplikácia Botulotoxínu (Dysport) & Kyselina Hyalurónová',
    category: 'injectable',
    seasonOrMonth: '4. Krok (Jar / Leto)',
    targetArea: 'Horná tretina tváre (čelo, glabela, vějířky) + kontúry',
    frequencyOrSessions: '1 aplikácia (kontrola o 14 dní)',
    estimatedPrice: 420,
    priority: 'medium',
    notes: 'Dynamická relaxácia mimických svalov a jemné doplnenie objemu.'
  },
  {
    label: 'Polynukleotidy & Skinbooster',
    icon: '🧬',
    name: 'Bioremodelácia Profhilo / Polynukleotidy (Plinest)',
    category: 'skin_care',
    seasonOrMonth: 'Priebežne (Leto / Jeseň)',
    targetArea: 'Tvár, očné okolie, krk a dekolt',
    frequencyOrSessions: '2 sedenia v rozstupe 4 týždňov',
    estimatedPrice: 520,
    priority: 'recommended',
    notes: 'Bunková biostimulácia fibroblastov a hĺbková hydratácia dermis.',
  },
  {
    label: 'Augmentácia / Mammaplastika',
    icon: '🏥',
    name: 'Augmentácia prsníkov / Modelácia (Mastopexia)',
    category: 'surgery',
    seasonOrMonth: 'Hlavný operačný krok',
    targetArea: 'Prsníky (obojstranne)',
    frequencyOrSessions: 'Operácia v celkovej anestézii (1 noc na klinike)',
    estimatedPrice: 4300,
    priority: 'high',
    notes: 'Vrátane 6-týždňového kompresívneho režimu a pooperačného SAY Care protokolu.'
  }
];

export default function PatientPlanViewer({
  plan,
  patient,
  onUpdatePlan,
  onScheduleTreatment,
  onOpenInCosmeticsPOS
}: PatientPlanViewerProps) {
  const [activeSection, setActiveSection] = useState<'all' | 'say_skincare' | 'rocny_plan' | 'say_care'>('all');
  const [selectedTierFilter, setSelectedTierFilter] = useState<'both' | 'standard' | 'premium'>('both');
  const [showMeicetModal, setShowMeicetModal] = useState(false);

  // Stav pre pridanie vlastného kroku do 2. Ročného plánu
  const [isAddingStep, setIsAddingStep] = useState(false);
  const [newStepName, setNewStepName] = useState('');
  const [newStepCategory, setNewStepCategory] = useState<ScheduledTreatment['category']>('surgery');
  const [newStepSeason, setNewStepSeason] = useState('Krok na mieru (podľa dohody)');
  const [newStepArea, setNewStepArea] = useState('Tvár / Telo');
  const [newStepSessions, setNewStepSessions] = useState('1 zákrok / sedenie');
  const [newStepPrice, setNewStepPrice] = useState('450');
  const [newStepNotes, setNewStepNotes] = useState('');

  const standardMorningTotal = (plan.cosmeticsRoutine?.morning || []).reduce((sum, item) => sum + (item.standardOption?.price ?? item.price ?? 0), 0);
  const standardEveningTotal = (plan.cosmeticsRoutine?.evening || []).reduce((sum, item) => sum + (item.standardOption?.price ?? item.price ?? 0), 0);
  const standardTotal = standardMorningTotal + standardEveningTotal;

  const premiumMorningTotal = (plan.cosmeticsRoutine?.morning || []).reduce((sum, item) => sum + (item.premiumOption?.price ?? item.price ?? 0), 0);
  const premiumEveningTotal = (plan.cosmeticsRoutine?.evening || []).reduce((sum, item) => sum + (item.premiumOption?.price ?? item.price ?? 0), 0);
  const premiumTotal = premiumMorningTotal + premiumEveningTotal;

  // Zabezpečíme, že SAY Care má vždy k dispozícii predoperačný aj pooperačný protokol (fallback na predvolený protokol, ak v staršom pláne chýbal)
  const defaultPreOp = PRESET_PATIENT_PLANS.face_sequential_transformation.preOpCare!;
  const defaultPostOp = PRESET_PATIENT_PLANS.face_sequential_transformation.postOpCare!;
  const effectivePreOp = plan.preOpCare || defaultPreOp;
  const effectivePrehab = effectivePreOp.prehabilitation || defaultPreOp.prehabilitation!;
  const effectivePostOp = plan.postOpCare || defaultPostOp;

  const [checklistState, setChecklistState] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    if (effectivePreOp?.instructions) {
      effectivePreOp.instructions.forEach(ins => {
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
    const currentInstructions = effectivePreOp.instructions || [];
    const newInstructions = currentInstructions.map(ins => 
      ins.id === id ? { ...ins, completed: updated[id] } : ins
    );
    onUpdatePlan({
      ...plan,
      preOpCare: {
        ...effectivePreOp,
        prehabilitation: effectivePrehab,
        instructions: newInstructions
      }
    });
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

  const handleMoveTreatment = (index: number, direction: 'up' | 'down') => {
    const list = [...(plan.annualTreatments || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;
    const reordered = list.map((item, idx) => ({ ...item, stepOrder: idx + 1 }));
    onUpdatePlan({
      ...plan,
      annualTreatments: reordered
    });
  };

  const handleDeleteTreatment = (treatmentId: string) => {
    const filtered = (plan.annualTreatments || [])
      .filter(t => t.id !== treatmentId)
      .map((item, idx) => ({ ...item, stepOrder: idx + 1 }));
    onUpdatePlan({
      ...plan,
      annualTreatments: filtered
    });
  };

  const handleQuickAddProcedure = (proc: typeof QUICK_SEQUENTIAL_PROCEDURES[0]) => {
    const currentList = plan.annualTreatments || [];
    const nextOrder = currentList.length + 1;
    const newTreatment: ScheduledTreatment = {
      id: `trt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      stepOrder: nextOrder,
      name: proc.name,
      category: proc.category,
      isSkinTreatment: proc.category === 'skin_care' || proc.category === 'laser',
      seasonOrMonth: `${nextOrder}. Krok • ${proc.seasonOrMonth.replace(/^\d+\.\s*Krok\s*/i, '')}`,
      targetArea: proc.targetArea,
      frequencyOrSessions: proc.frequencyOrSessions,
      estimatedPrice: proc.estimatedPrice,
      priority: proc.priority,
      status: 'planned',
      notes: proc.notes
    };
    onUpdatePlan({
      ...plan,
      annualTreatments: [...currentList, newTreatment]
    });
  };

  const handleAddCustomStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStepName.trim()) return;
    const currentList = plan.annualTreatments || [];
    const nextOrder = currentList.length + 1;
    const newTreatment: ScheduledTreatment = {
      id: `trt-custom-${Date.now()}`,
      stepOrder: nextOrder,
      name: newStepName.trim(),
      category: newStepCategory,
      isSkinTreatment: newStepCategory === 'skin_care' || newStepCategory === 'laser',
      seasonOrMonth: newStepSeason || `${nextOrder}. Krok`,
      targetArea: newStepArea || 'Tvár / Telo',
      frequencyOrSessions: newStepSessions || '1 zákrok',
      estimatedPrice: parseFloat(newStepPrice) || 0,
      priority: 'high',
      status: 'planned',
      notes: newStepNotes.trim() || undefined
    };
    onUpdatePlan({
      ...plan,
      annualTreatments: [...currentList, newTreatment]
    });
    setNewStepName('');
    setNewStepNotes('');
    setIsAddingStep(false);
  };

  const handleLoadDemoMeicetMetrics = () => {
    onUpdatePlan({
      ...plan,
      meicetScanDate: new Date().toISOString().split('T')[0],
      meicetPdfFilename: 'Meicet_ProA_3D_Report_SAY.pdf',
      meicetMetrics: {
        skinScoreOverall: 78,
        skinAge: 36,
        actualAge: 34,
        skinType: 'zmiešaná',
        fitzpatrickPhototype: 'III',
        hydration: {
          score: 62,
          status: 'mierne zhoršený',
          description: 'Znížená epidermálna hydratácia v oblasti líc a periorbitálne.',
          clinicalSignificance: 'Indikované 2% HA sérum a ceramidový krém 2:4:2.',
          tewlLevel: 'stredná',
          moistureZoneNote: 'Dehydratácia v malárnej zóne'
        },
        pores: {
          score: 68,
          status: 'dobrý',
          description: 'Mierne rozšírené póry v T-zóne.',
          clinicalSignificance: 'Odporúčané jemné čistenie a večerný retinoid.',
          predominantZone: 'T-zóna a nos'
        },
        wrinkles: {
          score: 71,
          status: 'dobrý',
          description: 'Jemné dynamické vrásky v hornej tretine tváre.',
          clinicalSignificance: 'Vhodná kombinácia peptidov, retinolu a botulotoxínu.',
          fineLinesScore: 74,
          deepWrinklesScore: 68,
          primaryZones: ['Periorbitálne', 'Čelo a glabela']
        },
        texture: {
          score: 76,
          status: 'dobrý',
          description: 'Mierne nerovnomerný mikroreliéf pokožky.',
          clinicalSignificance: 'Frakčný laser a bunková obnova retinoidmi.',
          roughnessIndex: 24,
          keratinizationState: 'Normálna keratinizácia'
        },
        uvDamage: {
          score: 64,
          status: 'mierne zhoršený',
          description: 'Latentné fotopoškodenie v hlbšom UV spektre.',
          clinicalSignificance: 'Nevyhnutná celoročná ochrana SPF 50+ a 15% Vitamín C.',
          hiddenSpotsRisk: 'stredné',
          photodamageSeverity: 'Mierna aktinická elastóza'
        },
        brownSpots: {
          score: 69,
          status: 'dobrý',
          description: 'Drobné epidermálne hyperpigmentácie.',
          clinicalSignificance: 'Kyselina ferulová, niacínamid a fotoprotekcia.',
          melasmaTendency: false,
          pigmentDepth: 'epidermálny'
        },
        redAreas: {
          score: 66,
          status: 'dobrý',
          description: 'Mierna cievna reaktivita v oblasti krídel nosa a líc.',
          clinicalSignificance: 'Bariérová obnova Panthenolom B5 a cievny laser.',
          erythemaLevel: 'mierne reaktívna',
          rosaceaRisk: false,
          telangiectasiaZones: ['Líca', 'Okolie nosa']
        },
        sebumAndPorphyrins: {
          score: 74,
          status: 'výborný',
          description: 'Vyvážená produkcia mazu bez zápalovej aktivity porfyrínov.',
          clinicalSignificance: 'Nekomedogénna denná fotoprotekcia.',
          tZoneOiliness: 'vyvážená',
          microbialActivity: 'minimálna'
        }
      },
      meicetMilestones: [
        {
          timeframe: 'Po 3 mesiacoch',
          title: 'Obnova kožnej bariéry & Hydratácia',
          focusArea: 'Kontrolný 3D sken hydratácie, TEWL a cievnej reaktivity.',
          targetMetrics: 'Zvýšenie epidermálnej hydratácie z 62 % na >78 %.',
          rescanChecklist: ['RGB povrchový sken', 'Krížovo-polarizovaný sken erytému']
        },
        {
          timeframe: 'Po 6 mesiacoch',
          title: 'Redukcia pigmentácií & Remodelácia kolagénu',
          focusArea: 'Porovnanie UV spektra, hĺbky vrások a kvality jaziev.',
          targetMetrics: 'Zjemnenie textúry a pórov o +20 % po laserovej terapii.',
          rescanChecklist: ['UV fluorescenčný sken', '3D topografia vrások']
        },
        {
          timeframe: 'Po 12 mesiacoch',
          title: 'Ročné vyhodnotenie omladenia pleti',
          focusArea: 'Kompletná ročná 3D spektrálna bilancia pred ďalším cyklom.',
          targetMetrics: 'Zníženie biologického veku pleti o 3–5 rokov oproti vstupu.',
          rescanChecklist: ['Kompletné 8-spektrálne Meicet Pro-A meranie']
        }
      ]
    });
  };

  // Ošetrenia zamerané špecificky na pleť pre sekciu 1. SAY Skincare
  const skinFocusedTreatments = (plan.annualTreatments || []).filter(
    t => t.category === 'skin_care' || t.category === 'laser' || t.category === 'injectable' || t.isSkinTreatment
  );

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

      {/* HLAVIČKA PLÁNU & 3 PILIERE NAVIGÁCIA */}
      <div className="bg-gradient-to-r from-[#2C2A29] via-[#3a3735] to-[#2C2A29] text-white p-6 rounded-2xl shadow-lg border border-[#C5A059]/30">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-[#C5A059] text-[#2C2A29] text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-xs">
                SAY CLINIC 3-V-1 PROTOKOL
              </span>
              <span className="bg-white/10 text-amber-200 border border-[#C5A059]/40 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                1. SAY Skincare • 2. Ročný Plán • 3. SAY Care
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
              type="button"
              onClick={() => setShowMeicetModal(true)}
              className="bg-white/10 hover:bg-white/20 text-white border border-[#C5A059]/60 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Nahrať alebo aktualizovať 3D spektrálny PDF report z prístroja Meicet Pro-A"
            >
              <Activity className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>🔬 Meicet 3D PDF</span>
            </button>
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

        {/* NAVIGÁCIA MEDZI 3 KLINICKÝMI PILIERMI */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-white/10 print:hidden">
          <button
            onClick={() => setActiveSection('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSection === 'all'
                ? 'bg-[#C5A059] text-[#2C2A29] shadow-md'
                : 'bg-white/5 text-stone-300 hover:bg-white/10'
            }`}
          >
            📋 Kompletný prehľad (3-v-1)
          </button>
          <button
            onClick={() => setActiveSection('say_skincare')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === 'say_skincare'
                ? 'bg-[#C5A059] text-[#2C2A29] shadow-md'
                : 'bg-white/5 text-stone-300 hover:bg-white/10'
            }`}
          >
            <span>1. SAY Skincare</span>
            <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full">
              Meicet 3D + Rutina + Pleť
            </span>
          </button>
          <button
            onClick={() => setActiveSection('rocny_plan')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === 'rocny_plan'
                ? 'bg-[#C5A059] text-[#2C2A29] shadow-md'
                : 'bg-white/5 text-stone-300 hover:bg-white/10'
            }`}
          >
            <span>2. Ročný Plán</span>
            <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full">
              {plan.annualTreatments?.length || 0} zákrokov v sekvencii
            </span>
          </button>
          <button
            onClick={() => setActiveSection('say_care')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === 'say_care'
                ? 'bg-[#C5A059] text-[#2C2A29] shadow-md'
                : 'bg-white/5 text-stone-300 hover:bg-white/10'
            }`}
          >
            <span>3. SAY Care</span>
            <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full">
              Prehabilitácia & Pooperačný protokol
            </span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 1. PILIER: SAY SKINCARE (MEICET 3D + SKINCARE RUTINA + OŠETRENIA PLETI) */}
      {/* ===================================================================== */}
      {(activeSection === 'all' || activeSection === 'say_skincare') && (
        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-xs space-y-6">
          {/* Hlavička 1. piliera */}
          <div className="flex flex-wrap justify-between items-center gap-3 border-b border-[#E8E2D9] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-[#2C2A29] text-[#C5A059] text-xs font-black uppercase tracking-wider">
                  1. PILIER
                </span>
                <h3 className="text-base md:text-lg font-bold text-[#2C2A29]">
                  SAY Skincare (Meicet 3D diagnostika + Domáca Skincare + Ročný plán ošetrení pleti)
                </h3>
              </div>
              <p className="text-xs text-[#8C857B] mt-1">
                Prepojenie 8-spektrálnej diagnostiky pleti s duálnou domácou rutinou (<strong>Základná starostlivosť</strong> vs. <strong>Prémiová starostlivosť</strong>) a dermatologickými ošetreniami.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <button
                type="button"
                onClick={() => setShowMeicetModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#FAF8F5] hover:bg-[#C5A059]/20 border border-[#C5A059] text-[#2C2A29] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>🔬</span>
                <span>{plan.meicetMetrics ? 'Aktualizovať Meicet 3D PDF' : 'Nahrať Meicet 3D PDF'}</span>
              </button>
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
                  <span>Kúpiť {selectedTierFilter === 'standard' ? 'Základnú' : selectedTierFilter === 'premium' ? 'Prémiovú' : 'Skincare'} v POS pokladni</span>
                </button>
              )}
            </div>
          </div>

          {/* 1A: MEICET PRO-A 3D SPEKTRÁLNA DIAGNOSTIKA PLETI */}
          {plan.meicetMetrics ? (
            <div className="bg-gradient-to-br from-[#FAF8F5] via-white to-[#FAF8F5] border-2 border-[#C5A059]/40 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E2D9] pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl p-2 bg-[#2C2A29] text-[#C5A059] rounded-xl">🔬</span>
                  <div>
                    <h4 className="text-sm font-bold text-[#2C2A29] uppercase tracking-wider">
                      1A. Meicet Pro-A 3D Spektrálna Analýza Pleti (8 Spektier)
                    </h4>
                    <p className="text-[11px] text-[#8C857B]">
                      {plan.meicetPdfFilename ? `Zdroj: ${plan.meicetPdfFilename} • ` : ''}
                      Typ pleti: <strong className="text-[#2C2A29]">{plan.meicetMetrics.skinType}</strong> • Fototyp: <strong className="text-[#2C2A29]">Fitzpatrick {plan.meicetMetrics.fitzpatrickPhototype}</strong>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 bg-white rounded-xl border border-[#E8E2D9] text-center">
                    <span className="text-[9px] uppercase font-bold text-[#8C857B] block">Vek pleti vs. Skutočný</span>
                    <span className="text-sm font-black text-[#2C2A29]">
                      {plan.meicetMetrics.skinAge} r. <span className="text-xs font-normal text-[#8C857B]">/ {plan.meicetMetrics.actualAge} r.</span>
                    </span>
                  </div>
                  <div className="px-3.5 py-1.5 bg-[#2C2A29] text-white rounded-xl text-center">
                    <span className="text-[9px] uppercase font-bold text-[#C5A059] block">Skóre pleti</span>
                    <span className="text-sm font-black text-white">{plan.meicetMetrics.skinScoreOverall} / 100</span>
                  </div>
                </div>
              </div>

              {/* 8 Spektrálnych metrík */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: '💧 Hydratácia epidermis', value: plan.meicetMetrics.hydration?.score ?? 65, status: plan.meicetMetrics.hydration?.status },
                  { label: '🔬 Póry & Textúra', value: plan.meicetMetrics.pores?.score ?? 68, status: plan.meicetMetrics.pores?.status },
                  { label: '〰️ Vrásky & Elasticita', value: plan.meicetMetrics.wrinkles?.score ?? 70, status: plan.meicetMetrics.wrinkles?.status },
                  { label: '✨ Hladkosť povrchu', value: plan.meicetMetrics.texture?.score ?? 75, status: plan.meicetMetrics.texture?.status },
                  { label: '☀️ UV Poškodenie (hlboké)', value: plan.meicetMetrics.uvDamage?.score ?? 64, status: plan.meicetMetrics.uvDamage?.status },
                  { label: '🎯 Pigmentové škvrny', value: plan.meicetMetrics.brownSpots?.score ?? 69, status: plan.meicetMetrics.brownSpots?.status },
                  { label: '🩸 Cievne oblasti (Erytém)', value: plan.meicetMetrics.redAreas?.score ?? 66, status: plan.meicetMetrics.redAreas?.status },
                  { label: '🧪 Maz & Porfyríny', value: plan.meicetMetrics.sebumAndPorphyrins?.score ?? 72, status: plan.meicetMetrics.sebumAndPorphyrins?.status }
                ].map((m, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-xl border border-[#E8E2D9] space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-[#2C2A29] truncate">{m.label}</span>
                      <span className="font-mono font-bold text-[#C5A059]">{m.value}%</span>
                    </div>
                    <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          m.value >= 75 ? 'bg-emerald-500' : m.value >= 60 ? 'bg-[#C5A059]' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(10, m.value))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Míľniky kontrolných skenov 3M / 6M / 12M */}
              {plan.meicetMilestones && plan.meicetMilestones.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  {plan.meicetMilestones.map((ms, i) => (
                    <div key={i} className="bg-white/90 p-3 rounded-xl border border-[#E8E2D9] space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059]">
                        🎯 {ms.timeframe}: {ms.title}
                      </span>
                      <p className="text-[11px] text-[#2C2A29] font-medium">{ms.targetMetrics}</p>
                      <p className="text-[10px] text-[#8C857B] italic">{ms.focusArea}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#FAF8F5] border border-dashed border-[#C5A059]/60 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div className="flex items-center gap-3">
                <span className="text-2xl p-2 bg-[#C5A059]/15 rounded-xl">🔬</span>
                <div>
                  <h4 className="text-xs font-bold text-[#2C2A29]">
                    1A. Meicet Pro-A 3D Spektrálna Diagnostika Pleti
                  </h4>
                  <p className="text-[11px] text-[#8C857B]">
                    Nahrajte PDF report z prístroja Meicet Pro-A pre zobrazenie 8 spektrálnych metrík (hydratácia, póry, UV, cievky, vrásky) alebo načítajte referenčný 3D profil.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadDemoMeicetMetrics}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-50 border border-[#E8E2D9] text-[#2C2A29] text-xs font-bold cursor-pointer transition-colors"
                >
                  ⚡ Načítať 8-spektrálny profil pleti
                </button>
                <button
                  type="button"
                  onClick={() => setShowMeicetModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#2C2A29] hover:bg-[#C5A059] text-white text-xs font-bold cursor-pointer transition-colors"
                >
                  🔬 Nahrať Meicet PDF
                </button>
              </div>
            </div>
          )}

          {/* 1B: PREPÍNAČ TRIED KOZMETIKY (ZÁKLADNÁ VS PRÉMIOVÁ STAROSTLIVOSŤ) */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-[#2C2A29] uppercase tracking-wider">
                  1B. Duálna domáca Skincare rutina:
                </span>
                <div className="inline-flex p-1 bg-white border border-[#E8E2D9] rounded-lg shadow-2xs flex-wrap">
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
                    <span>Základná starostlivosť (~{standardTotal.toFixed(2)} €)</span>
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
                    <span>Prémiová starostlivosť (~{premiumTotal.toFixed(2)} €)</span>
                  </button>
                </div>
              </div>
              <div className="text-xs text-[#8C857B] font-medium">
                {selectedTierFilter === 'both' ? (
                  <span>Rozpočet rutiny: <strong className="text-sky-800 font-bold">{standardTotal.toFixed(0)} €</strong> (Základná) vs. <strong className="text-[#C5A059] font-bold">{premiumTotal.toFixed(0)} €</strong> (Prémiová)</span>
                ) : selectedTierFilter === 'standard' ? (
                  <span>Celková cena základnej rutiny: <strong className="text-sky-800 font-bold">{standardTotal.toFixed(2)} €</strong></span>
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

                        {selectedTierFilter === 'both' && hasBoth ? (
                          <div className="space-y-2 pt-1">
                            {/* ZÁKLADNÁ STAROSTLIVOSŤ */}
                            <div className="p-2.5 rounded-lg bg-sky-50/60 border border-sky-200/70 space-y-1">
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-sky-800 bg-sky-100 px-1.5 py-0.5 rounded">
                                    Základná starostlivosť
                                  </span>
                                  {item.standardOption!.brand && (
                                    <span className="text-[9px] font-extrabold uppercase tracking-wide text-sky-950 bg-sky-200/90 px-1.5 py-0.5 rounded border border-sky-300">
                                      Značka: {item.standardOption!.brand}
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs font-mono font-bold text-sky-900 shrink-0">
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

                            {/* PRÉMIOVÁ STAROSTLIVOSŤ */}
                            <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200/70 space-y-1">
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-amber-900 bg-amber-200/60 px-1.5 py-0.5 rounded">
                                    Prémiová starostlivosť
                                  </span>
                                  {item.premiumOption!.brand && (
                                    <span className="text-[9px] font-extrabold uppercase tracking-wide text-amber-950 bg-amber-200/90 px-1.5 py-0.5 rounded border border-amber-300">
                                      Značka: {item.premiumOption!.brand}
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs font-mono font-bold text-[#2C2A29] shrink-0">
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
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                      isPrem ? 'bg-amber-100 text-amber-900' : 'bg-sky-100 text-sky-800'
                                    }`}>
                                      {isPrem ? 'Prémiová starostlivosť' : 'Základná starostlivosť'}
                                    </span>
                                    {(activeOpt.brand || item.brand) && (
                                      <span className={`text-[9px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded border ${
                                        isPrem ? 'bg-amber-200/90 text-amber-950 border-amber-300' : 'bg-sky-200/90 text-sky-950 border-sky-300'
                                      }`}>
                                        Značka: {activeOpt.brand || item.brand}
                                      </span>
                                    )}
                                  </div>
                                  {activeOpt.price && (
                                    <span className="text-xs font-mono font-bold text-[#2C2A29] shrink-0">
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

                        {selectedTierFilter === 'both' && hasBoth ? (
                          <div className="space-y-2 pt-1">
                            {/* ZÁKLADNÁ STAROSTLIVOSŤ */}
                            <div className="p-2.5 rounded-lg bg-sky-50/60 border border-sky-200/70 space-y-1">
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-sky-800 bg-sky-100 px-1.5 py-0.5 rounded">
                                    Základná starostlivosť
                                  </span>
                                  {item.standardOption!.brand && (
                                    <span className="text-[9px] font-extrabold uppercase tracking-wide text-sky-950 bg-sky-200/90 px-1.5 py-0.5 rounded border border-sky-300">
                                      Značka: {item.standardOption!.brand}
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs font-mono font-bold text-sky-900 shrink-0">
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

                            {/* PRÉMIOVÁ STAROSTLIVOSŤ */}
                            <div className="p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-200/70 space-y-1">
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-900 bg-indigo-100 px-1.5 py-0.5 rounded">
                                    Prémiová starostlivosť
                                  </span>
                                  {item.premiumOption!.brand && (
                                    <span className="text-[9px] font-extrabold uppercase tracking-wide text-indigo-950 bg-indigo-200/80 px-1.5 py-0.5 rounded border border-indigo-300">
                                      Značka: {item.premiumOption!.brand}
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs font-mono font-bold text-[#2C2A29] shrink-0">
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
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                      isPrem ? 'bg-indigo-100 text-indigo-900' : 'bg-sky-100 text-sky-800'
                                    }`}>
                                      {isPrem ? 'Prémiová starostlivosť' : 'Základná starostlivosť'}
                                    </span>
                                    {(activeOpt.brand || item.brand) && (
                                      <span className={`text-[9px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded border ${
                                        isPrem ? 'bg-indigo-200/80 text-indigo-950 border-indigo-300' : 'bg-sky-200/90 text-sky-950 border-sky-300'
                                      }`}>
                                        Značka: {activeOpt.brand || item.brand}
                                      </span>
                                    )}
                                  </div>
                                  {activeOpt.price && (
                                    <span className="text-xs font-mono font-bold text-[#2C2A29] shrink-0">
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
          </div>

          {/* 1C: ROČNÝ PLÁN OŠETRENÍ PLETI (SÚČASŤ SAY SKINCARE) */}
          <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C5A059]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#2C2A29]">
                  1C. Ročný plán ambulantných ošetrení pleti & Sezónna harmonizácia
                </h4>
              </div>
              <span className="text-[10px] font-bold text-[#8C857B]">
                Prepojené s domácou rutinou a UV indexom
              </span>
            </div>

            {skinFocusedTreatments.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {skinFocusedTreatments.map((st, idx) => (
                  <div key={st.id || idx} className="bg-white border border-[#E8E2D9] rounded-xl p-3 flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-[#C5A059] uppercase">
                        📅 {st.seasonOrMonth}
                      </span>
                      <h5 className="text-xs font-bold text-[#2C2A29]">{st.name}</h5>
                      <p className="text-[10px] text-[#8C857B]">{st.targetArea} • {st.frequencyOrSessions}</p>
                    </div>
                    {st.estimatedPrice ? (
                      <span className="text-xs font-mono font-bold text-[#2C2A29] shrink-0">{st.estimatedPrice} €</span>
                    ) : null}
                  </div>
                ))}
              </div>
            )}

            {plan.cosmeticsRoutine?.specialWeeklyCare && plan.cosmeticsRoutine.specialWeeklyCare.length > 0 && (
              <div className="pt-2 border-t border-[#E8E2D9]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C857B] block mb-1.5">
                  Týždenný režim & Dermatologické odporúčania k ošetreniam pleti:
                </span>
                <ul className="space-y-1 text-xs text-[#6B6357]">
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
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. PILIER: ROČNÝ PLÁN (VOĽNE ZOSTAVITEĽNÁ SEKVENCIA ZÁKROKOV)          */}
      {/* ===================================================================== */}
      {(activeSection === 'all' || activeSection === 'rocny_plan') && (
        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-3 border-b border-[#E8E2D9] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-[#2C2A29] text-[#C5A059] text-xs font-black uppercase tracking-wider">
                  2. PILIER
                </span>
                <h3 className="text-base md:text-lg font-bold text-[#2C2A29]">
                  Ročný Plán (Voľná sekvencia zákrokov: napr. Facelift ➔ Viečka ➔ Laser...)
                </h3>
              </div>
              <p className="text-xs text-[#8C857B] mt-1">
                Krok za krokom naplánovaná postupnosť operačných výkonov, laserov a estetických ošetrení s možnosťou ľubovoľnej úpravy poradia.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-mono font-bold text-[#2C2A29] bg-[#FAF8F5] px-3 py-1.5 rounded-xl border border-[#E8E2D9]">
                Celkový rozpočet krokov: {plan.annualTreatments?.reduce((sum, t) => sum + (t.estimatedPrice || 0), 0)} €
              </span>
              <button
                type="button"
                onClick={() => setIsAddingStep(prev => !prev)}
                className="px-3.5 py-1.5 rounded-xl bg-[#2C2A29] hover:bg-[#C5A059] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer print:hidden"
              >
                <Plus className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>+ Pridať vlastný krok</span>
              </button>
            </div>
          </div>

          {/* RÝCHLE PRIDANIE KROKU DO SEKVENCIE (1-KLIK CHIPY) */}
          <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl p-3.5 space-y-2 print:hidden">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C857B] block">
              ⚡ Rýchlo pridať ďalší krok do sekvencie Ročného plánu (1-klikom):
            </span>
            <div className="flex flex-wrap gap-2">
              {QUICK_SEQUENTIAL_PROCEDURES.map((proc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickAddProcedure(proc)}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#2C2A29] text-[#2C2A29] hover:text-white border border-[#E8E2D9] hover:border-[#C5A059] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <span>{proc.icon}</span>
                  <span>+ {proc.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* FORMULÁR PRE VLASTNÝ KROK V SEKVENCII */}
          {isAddingStep && (
            <form onSubmit={handleAddCustomStep} className="bg-amber-50/50 border border-[#C5A059] rounded-2xl p-4 space-y-3 print:hidden">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#2C2A29]">
                  Pridať nový krok do sekvencie Ročného plánu
                </h4>
                <button type="button" onClick={() => setIsAddingStep(false)} className="text-[#8C857B] hover:text-[#2C2A29] cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold uppercase text-[#8C857B] block mb-1">Názov zákroku / kroku *</label>
                  <input
                    type="text"
                    required
                    value={newStepName}
                    onChange={e => setNewStepName(e.target.value)}
                    placeholder="napr. 1. Deep Plane Facelift, 2. Horné viečka, 3. Frakčný CO2 Laser..."
                    className="w-full border border-[#E8E2D9] bg-white rounded-xl p-2 text-xs text-[#2C2A29]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#8C857B] block mb-1">Kategória</label>
                  <select
                    value={newStepCategory}
                    onChange={e => setNewStepCategory(e.target.value as ScheduledTreatment['category'])}
                    className="w-full border border-[#E8E2D9] bg-white rounded-xl p-2 text-xs text-[#2C2A29] font-bold"
                  >
                    <option value="surgery">🏥 Plastická chirurgia / Operácia</option>
                    <option value="laser">⚡ Laser & Resurfacing</option>
                    <option value="injectable">💉 Injekčná aplikácia (Botox / Výplň)</option>
                    <option value="skin_care">✨ Dermatologické ošetrenie pleti</option>
                    <option value="scar_care">🩹 Korekcia jaziev & Rekonvalescencia</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#8C857B] block mb-1">Obdobie / Krok</label>
                  <input
                    type="text"
                    value={newStepSeason}
                    onChange={e => setNewStepSeason(e.target.value)}
                    placeholder="napr. 1. Krok (Október)"
                    className="w-full border border-[#E8E2D9] bg-white rounded-xl p-2 text-xs text-[#2C2A29]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#8C857B] block mb-1">Anatomická oblasť</label>
                  <input
                    type="text"
                    value={newStepArea}
                    onChange={e => setNewStepArea(e.target.value)}
                    placeholder="napr. Tvár a krk"
                    className="w-full border border-[#E8E2D9] bg-white rounded-xl p-2 text-xs text-[#2C2A29]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#8C857B] block mb-1">Rozsah / Anestézia</label>
                  <input
                    type="text"
                    value={newStepSessions}
                    onChange={e => setNewStepSessions(e.target.value)}
                    placeholder="napr. Celková anestézia / 1 sedenie"
                    className="w-full border border-[#E8E2D9] bg-white rounded-xl p-2 text-xs text-[#2C2A29]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#8C857B] block mb-1">Odhadovaná cena (€)</label>
                  <input
                    type="number"
                    value={newStepPrice}
                    onChange={e => setNewStepPrice(e.target.value)}
                    className="w-full border border-[#E8E2D9] bg-white rounded-xl p-2 text-xs text-[#2C2A29] font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-[#8C857B] block mb-1">Klinická poznámka</label>
                <input
                  type="text"
                  value={newStepNotes}
                  onChange={e => setNewStepNotes(e.target.value)}
                  placeholder="Špecifické pokyny k načasovaniu alebo kombinácii s inými výkonmi..."
                  className="w-full border border-[#E8E2D9] bg-white rounded-xl p-2 text-xs text-[#2C2A29]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingStep(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#E8E2D9] bg-white text-xs font-bold text-[#6B6357] cursor-pointer"
                >
                  Zrušiť
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#2C2A29] hover:bg-[#C5A059] text-white text-xs font-bold cursor-pointer"
                >
                  ✓ Pridať krok do sekvencie
                </button>
              </div>
            </form>
          )}

          {/* SEKVENCIA ZÁKROKOV */}
          <div className="space-y-3">
            {plan.annualTreatments?.map((treatment, idx) => {
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
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#2C2A29] text-[#C5A059] text-xs font-black flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${categoryColor}`}>
                          {categoryName}
                        </span>
                        <span className="text-[11px] font-bold text-[#2C2A29] bg-stone-200/80 px-2 py-0.5 rounded">
                          📅 {treatment.seasonOrMonth}
                        </span>
                        {treatment.priority === 'high' && (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                            Kľúčový krok
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-[#2C2A29] pl-8">
                        {treatment.name}
                      </h4>

                      <p className="text-xs text-[#8C857B] pl-8">
                        Oblasť: <strong className="text-[#2C2A29]">{treatment.targetArea}</strong> • Rozsah / Frekvencia: <strong className="text-[#2C2A29]">{treatment.frequencyOrSessions}</strong>
                      </p>

                      {treatment.notes && (
                        <p className="text-[11px] text-[#6B6357] italic bg-white p-2 rounded-lg border border-[#E8E2D9]/60 ml-8">
                          {treatment.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center gap-2">
                        {treatment.estimatedPrice ? (
                          <span className="text-sm font-mono font-bold text-[#2C2A29]">
                            {treatment.estimatedPrice} €
                          </span>
                        ) : (
                          <span className="text-xs text-[#8C857B] italic">V cene operácie</span>
                        )}

                        {/* Tlačidlá na zmenu poradia a vymazanie kroku */}
                        <div className="flex items-center gap-1 print:hidden">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveTreatment(idx, 'up')}
                            className="p-1 rounded bg-white border border-[#E8E2D9] hover:border-[#C5A059] text-[#6B6357] disabled:opacity-30 cursor-pointer"
                            title="Posunúť krok vyššie v sekvencii"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === (plan.annualTreatments?.length || 1) - 1}
                            onClick={() => handleMoveTreatment(idx, 'down')}
                            className="p-1 rounded bg-white border border-[#E8E2D9] hover:border-[#C5A059] text-[#6B6357] disabled:opacity-30 cursor-pointer"
                            title="Posunúť krok nižšie v sekvencii"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTreatment(treatment.id)}
                            className="p-1 rounded bg-white border border-[#E8E2D9] hover:border-rose-400 text-rose-600 cursor-pointer"
                            title="Odstrániť tento krok z Ročného plánu"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 print:hidden">
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

      {/* ===================================================================== */}
      {/* 3. PILIER: SAY CARE (PREDOPERAČNÝ & POOPERAČNÝ PROTOKOL)              */}
      {/* ===================================================================== */}
      {(activeSection === 'all' || activeSection === 'say_care') && (
        <div className="space-y-6">
          {/* 3A: PREDOPERAČNÝ PROTOKOL & 4 PILIERE PREHABILITÁCIE */}
          <div className="bg-white border border-amber-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-3 border-b border-amber-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#2C2A29] text-[#C5A059] text-xs font-black uppercase tracking-wider">
                    3. PILIER • ČASŤ A
                  </span>
                  <ShieldAlert className="w-5 h-5 text-amber-600" />
                  <h3 className="text-base md:text-lg font-bold text-[#2C2A29]">
                    SAY Care – Predoperačný protokol ({effectivePreOp.procedureName})
                  </h3>
                </div>
                <p className="text-xs text-[#8C857B] mt-1">
                  Komplexná 4-pilierová príprava organizmu (Prehabilitácia, Psychologická, Nutričná a Fyzická príprava) pre bezpečný priebeh a zrýchlené hojenie.
                </p>
              </div>
              <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
                SAY Prehabilitation Protocol
              </span>
            </div>

            {/* 4 PILIERE PREDOPERAČNEJ PRÍPRAVY */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#2C2A29] uppercase tracking-wider">
                  <span className="text-base">🩺</span>
                  <span>1. Medicínska prehabilitácia</span>
                </div>
                <ul className="space-y-1.5 text-xs text-[#6B6357]">
                  {effectivePrehab.medicalPrehab.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#C5A059] font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#2C2A29] uppercase tracking-wider">
                  <span className="text-base">🧠</span>
                  <span>2. Psychologická príprava</span>
                </div>
                <ul className="space-y-1.5 text-xs text-[#6B6357]">
                  {effectivePrehab.psychologicalPrep.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#C5A059] font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#2C2A29] uppercase tracking-wider">
                  <span className="text-base">🥗</span>
                  <span>3. Nutričná príprava</span>
                </div>
                <ul className="space-y-1.5 text-xs text-[#6B6357]">
                  {effectivePrehab.nutritionalPrep.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#C5A059] font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#2C2A29] uppercase tracking-wider">
                  <span className="text-base">🏃‍♀️</span>
                  <span>4. Fyzická príprava</span>
                </div>
                <ul className="space-y-1.5 text-xs text-[#6B6357]">
                  {effectivePrehab.physicalPrep.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#C5A059] font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* ČASOVÝ CHECKLIST PREDOPERAČNÝCH POKYNOV */}
            <div className="space-y-2.5 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#2C2A29]">
                Kontrolný predoperačný checklist pacienta:
              </h4>
              {effectivePreOp.instructions.map((ins) => {
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
                      onChange={() => {}}
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

          {/* 3B: POOPERAČNÝ PROTOKOL (JAZVY, LYMFODRENÁŽ, LASER & REKONVALESCENCIA) */}
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-3 border-b border-[#E8E2D9] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#2C2A29] text-[#C5A059] text-xs font-black uppercase tracking-wider">
                    3. PILIER • ČASŤ B
                  </span>
                  <HeartHandshake className="w-5 h-5 text-[#C5A059]" />
                  <h3 className="text-base md:text-lg font-bold text-[#2C2A29]">
                    SAY Care – Pooperačný protokol (Jazvy, Lymfodrenáž, Laser & Rekonvalescencia)
                  </h3>
                </div>
                <p className="text-xs text-[#8C857B] mt-1">
                  Riadený pooperačný manažment opuchov, kompresívnej terapie, silikónového krytia, tlakových masáží a laserovej korekcie jaziev.
                </p>
              </div>
            </div>

            {effectivePostOp.scarProtocol && (
              <div className="bg-gradient-to-br from-[#FAF8F5] via-amber-50/40 to-[#FAF8F5] border-2 border-[#C5A059]/40 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🩹</span>
                  <h4 className="text-sm font-bold text-[#2C2A29] uppercase tracking-wider">
                    4 Piliere Pooperačného SAY Care Protokolu (Jazvy, Lymfodrenáž & Laser)
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-[#E8E2D9] space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#C5A059]">
                      <span>💧</span>
                      <span>1. Jazvy & Silikónová terapia</span>
                    </div>
                    <p className="text-[11px] text-[#6B6357] leading-relaxed">
                      {effectivePostOp.scarProtocol.siliconeApplication}
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-[#E8E2D9] space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-sky-800">
                      <span>🤏</span>
                      <span>2. Tlakové masáže jaziev</span>
                    </div>
                    <p className="text-[11px] text-[#6B6357] leading-relaxed">
                      {effectivePostOp.scarProtocol.pressureMassage}
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-[#E8E2D9] space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                      <span>🌊</span>
                      <span>3. Lymfodrenáž & Opuchy</span>
                    </div>
                    <p className="text-[11px] text-[#6B6357] leading-relaxed">
                      {effectivePostOp.scarProtocol.lymphaticDrainage || 'Manuálna a prístrojová lymfodrenáž od 10.–14. pooperačného dňa (5–10 sedení) v kombinácii s kompresívnym prádlom pre urýchlené vstrebanie edému.'}
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-[#E8E2D9] space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                      <span>⚡</span>
                      <span>4. Laser & Fotoprotekcia SPF 50+</span>
                    </div>
                    <p className="text-[11px] text-[#6B6357] leading-relaxed">
                      {effectivePostOp.scarProtocol.laserTherapy || effectivePostOp.scarProtocol.sunProtection}
                    </p>
                  </div>
                </div>

                {effectivePostOp.scarProtocol.advancedScarTherapies && (
                  <div className="bg-white p-3.5 rounded-xl border border-[#E8E2D9] space-y-1.5">
                    <span className="text-xs font-bold text-[#2C2A29] flex items-center gap-1.5">
                      <span>⚡</span> Následné klinické procedúry v rámci pooperačného SAY Care protokolu:
                    </span>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {effectivePostOp.scarProtocol.advancedScarTherapies.map((therapy, i) => (
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
                Chronologické fázy pooperačného zotavenia:
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {effectivePostOp.phases.map((phase) => (
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
                        Pokyny pre pacienta:
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
                          Starostlivosť o jazvu & lymfodrenáž:
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

      {/* SKRYTÝ OFF-SCREEN A4 DOKUMENT PRE ČISTÝ EXPORT DO PDF A TLAČ */}
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

      {/* MODAL PRE NAHRATIE MEICET PRO-A 3D PDF DO EXISTUJÚCEHO PLÁNU */}
      {showMeicetModal && (
        <MeicetUploadModal
          isOpen={showMeicetModal}
          onClose={() => setShowMeicetModal(false)}
          patient={patient || { id: plan.patientId, name: plan.patientName, birthNumber: plan.patientBirthNumber || '' }}
          onAnalysisComplete={(res) => {
            const mergedPlan = MeicetService.mergeMeicetIntoPlan(plan, res);
            onUpdatePlan(mergedPlan);
            setShowMeicetModal(false);
          }}
        />
      )}

      {/* NÁHĽAD A4 DOKUMENTU PRED TLAČOU / STIAHNUTÍM */}
      {showPdfPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-xs print:hidden animate-in fade-in">
          <div className="bg-[#2C2A29] text-white rounded-2xl max-w-5xl w-full max-h-[95vh] flex flex-col shadow-2xl border border-[#C5A059]/40 overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#242221]">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-[#C5A059]" />
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <span>Náhľad dokumentu: {plan.title}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#C5A059] text-[#2C2A29]">
                      A4 Tlačový formát SAY CLINIC (3-v-1)
                    </span>
                  </h3>
                  <p className="text-[11px] text-white/60">
                    1. SAY Skincare • 2. Ročný Plán • 3. SAY Care (Prehabilitácia & Pooperačný protokol)
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

            <div className="p-6 overflow-y-auto bg-[#403D39] flex justify-center">
              <div className="shadow-2xl rounded-sm overflow-hidden bg-white max-w-[794px] w-full border border-[#D4C7B5]">
                <PatientPlanPdfDocument
                  plan={plan}
                  patient={patient}
                />
              </div>
            </div>

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
