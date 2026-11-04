'use client';

import React, { useState, useRef, useMemo } from 'react';
import { 
  Sparkles, 
  Printer, 
  Download, 
  CalendarPlus, 
  ShoppingBag, 
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
  Award,
  Layers,
  Trash2,
  X,
  FlaskConical,
  Lightbulb,
  HardDrive,
  MoreHorizontal,
  Home,
  ArrowLeftRight
} from 'lucide-react';
import { MeicetAnalysisResult, MeicetTreatmentPlanItem, SkincareTier, MeicetSkincareProduct, MeicetSkincareTierRoutine } from '@/types/meicet';
import { MeicetService } from '@/services/meicetService';
import { MeicetReportPdfDocument } from './MeicetReportPdfDocument';
import { CalendarEvent } from '@/data/calendarConfig';
import { generatePdfFilename, exportElementToPdf, generatePdfBase64 } from '@/lib/pdfGenerator';
import { getLiveClinicPriceList, ClinicPriceItem } from '@/data/clinicPriceList';
import { MeicetClinicalEducationCard } from './MeicetClinicalEducationCard';
import { MeicetClinicalEducationService } from '@/services/meicetClinicalEducationService';
import { MeicetProductContextMenu } from './MeicetProductContextMenu';
import { MeicetProductSwapModal } from './MeicetProductSwapModal';
import { MeicetTitrationEditModal } from './MeicetTitrationEditModal';
import { MeicetProcedureContextMenu } from './MeicetProcedureContextMenu';
import { MeicetProcedureSwapModal } from './MeicetProcedureSwapModal';

interface MeicetViewerProps {
  report: MeicetAnalysisResult;
  onClose?: () => void;
  onUpdateReport?: (report: MeicetAnalysisResult) => void;
  onSaveToDriveAndRecords?: (report: MeicetAnalysisResult, pdfBase64?: string) => Promise<{ success: boolean; driveWebViewLink?: string }> | void;
  onSaveToPatientPlans?: (plan: any) => void;
  onScheduleTreatment?: (event: Partial<CalendarEvent>) => void;
  onTransferToCosmeticsPOS?: (products: any[]) => void;
  onNewScanRequested?: () => void;
}

const SKIN_TREATMENT_IDS = [
  'vascular_laser_face',
  'vascular_laser_lesion',
  'coolpeel_co2_face',
  'co2_laser_fractional_face',
  'co2_laser_eyelids',
  'botox_1_area',
  'botox_2_areas',
  'botox_3_areas',
  'hyaluronic_acid_1ml',
  'skinbooster_1ml',
  'rejuran_healer_2ml',
  'rejuran_i_1ml',
  'rejuran_s_1ml',
  'crystal_hydro_pdrn',
  'philart_2ml',
  'profhilo_2ml',
  'sculptra_1vial',
  'radiesse_1_5ml',
  'exosomes_asce',
  'biorepeel_face',
  'chemical_peel_tca',
  'microneedling_dermapen',
];

const EXTERNAL_TREATMENT_IDS = [
  'ext_hydrafacial',
  'ext_ipl_photorejuvenation',
  'ext_morpheus8_rf',
  'ext_aha_fruit_peel',
  'ext_emsculpt_stimulation',
  'ext_cryolipolysis'
];

export function MeicetViewer({
  report,
  onClose,
  onUpdateReport,
  onSaveToDriveAndRecords,
  onSaveToPatientPlans,
  onScheduleTreatment,
  onTransferToCosmeticsPOS,
  onNewScanRequested
}: MeicetViewerProps) {
  const [activeTab, setActiveTab] = useState<'metrics' | 'skincare' | 'annual_plan'>('metrics');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedDriveLink, setSavedDriveLink] = useState<string | null>(null);
  const [bookedTreatments, setBookedTreatments] = useState<Record<string, boolean>>({});
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [posTransferNotice, setPosTransferNotice] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<SkincareTier>(
    report.skincareRoutine?.selectedTier || 'mid_end'
  );
  const [selectedSeasonKey, setSelectedSeasonKey] = useState<'q1_spring' | 'q2_summer' | 'q3_autumn' | 'q4_winter'>('q1_spring');
  const [selectedNewTreatmentId, setSelectedNewTreatmentId] = useState<string>('biorepeel_face');

  // Kontextové menu a modaly pre skincare produkty
  const [productContextMenu, setProductContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    product: MeicetSkincareProduct | null;
    routineType: 'morning' | 'evening';
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    product: null,
    routineType: 'morning'
  });

  const [productSwapModal, setProductSwapModal] = useState<{
    isOpen: boolean;
    product: MeicetSkincareProduct | null;
    routineType: 'morning' | 'evening';
  }>({
    isOpen: false,
    product: null,
    routineType: 'morning'
  });

  const [titrationEditModal, setTitrationEditModal] = useState<{
    isOpen: boolean;
    product: MeicetSkincareProduct | null;
    routineType: 'morning' | 'evening';
  }>({
    isOpen: false,
    product: null,
    routineType: 'morning'
  });

  // Kontextové menu a modaly pre procedúry v ročnom pláne
  const [procedureContextMenu, setProcedureContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    treatment: MeicetTreatmentPlanItem | null;
    quarterKey: 'q1_spring' | 'q2_summer' | 'q3_autumn' | 'q4_winter';
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    treatment: null,
    quarterKey: 'q1_spring'
  });

  const [procedureSwapModal, setProcedureSwapModal] = useState<{
    isOpen: boolean;
    treatment: MeicetTreatmentPlanItem | null;
    quarterKey: 'q1_spring' | 'q2_summer' | 'q3_autumn' | 'q4_winter';
  }>({
    isOpen: false,
    treatment: null,
    quarterKey: 'q1_spring'
  });

  // Klinická edukatívna syntéza EBM
  const clinicalEducation = useMemo(() => {
    return MeicetClinicalEducationService.getClinicalEducation(report);
  }, [report]);

  const pdfReportRef = useRef<HTMLDivElement>(null);
  const hiddenPdfRef = useRef<HTMLDivElement>(null);

  const rawMetrics: any = report.metrics || {};
  const overallSkinScore = rawMetrics.overallSkinScore ?? rawMetrics.skinScoreOverall ?? 75;
  const fitzpatrickType = rawMetrics.fitzpatrickType ?? rawMetrics.fitzpatrickPhototype ?? 'II';
  const chronologicalAge = rawMetrics.chronologicalAge ?? rawMetrics.actualAge ?? 35;
  const skinAge = rawMetrics.skinAge ?? chronologicalAge;
  const skinType = rawMetrics.skinType ?? 'zmiešaná';

  const hydrationAndSebum = rawMetrics.hydrationAndSebum || {
    label: 'Hydratácia a kožný maz (TEWL)',
    lightMode: 'Krížovo polarizované svetlo',
    score: rawMetrics.hydration?.score ?? 50,
    percentile: rawMetrics.hydration?.percentile ?? 50,
    level: (rawMetrics.hydration?.score ?? 50) < 50 ? 'critical' : 'moderate',
    description: rawMetrics.hydration?.description || 'Hydratácia pleti'
  };
  const poresAndTexture = rawMetrics.poresAndTexture || {
    label: 'Póry a reliéf pleti',
    lightMode: 'Paralelne polarizované svetlo',
    score: rawMetrics.pores?.score ?? 60,
    percentile: rawMetrics.pores?.percentile ?? 55,
    level: (rawMetrics.pores?.score ?? 60) < 50 ? 'critical' : 'mild',
    description: rawMetrics.pores?.description || 'Textúra a póry'
  };
  const wrinklesAndElasticity = rawMetrics.wrinklesAndElasticity || {
    label: 'Vrásky a elasticita pleti',
    lightMode: 'Štandardné biele svetlo RGB',
    score: rawMetrics.wrinkles?.score ?? 55,
    percentile: rawMetrics.wrinkles?.percentile ?? 50,
    level: (rawMetrics.wrinkles?.score ?? 55) < 50 ? 'critical' : 'mild',
    description: rawMetrics.wrinkles?.description || 'Mimické vrásky'
  };
  const surfacePigmentation = rawMetrics.surfacePigmentation || {
    label: 'Povrchová pigmentácia a škvrny',
    lightMode: 'Paralelne polarizované svetlo',
    score: rawMetrics.brownSpots?.score ?? 65,
    percentile: rawMetrics.brownSpots?.percentile ?? 60,
    level: (rawMetrics.brownSpots?.score ?? 65) < 50 ? 'critical' : 'mild',
    description: rawMetrics.brownSpots?.description || 'Povrchové pigmentácie'
  };
  const uvDeepSpots = rawMetrics.uvDeepSpots || {
    label: 'Hĺbkové UV fotopoškodenie',
    lightMode: 'UV spektrum (365 nm)',
    score: rawMetrics.uvDamage?.score ?? 50,
    percentile: rawMetrics.uvDamage?.percentile ?? 45,
    level: (rawMetrics.uvDamage?.score ?? 50) < 50 ? 'critical' : 'moderate',
    description: rawMetrics.uvDamage?.description || 'UV poškodenie'
  };
  const vascularityAndRedness = rawMetrics.vascularityAndRedness || {
    label: 'Cievny erytém a začervenanie',
    lightMode: 'Krížovo polarizované svetlo (Red spectrum)',
    score: rawMetrics.redAreas?.score ?? 55,
    percentile: rawMetrics.redAreas?.percentile ?? 50,
    level: (rawMetrics.redAreas?.score ?? 55) < 50 ? 'critical' : 'mild',
    description: rawMetrics.redAreas?.description || 'Cievny erytém'
  };
  const porphyrinsAndAcne = rawMetrics.porphyrinsAndAcne || {
    label: 'Porfyríny a bakteriálna aktivita',
    lightMode: 'Fluorescenčné Woodovo svetlo',
    score: rawMetrics.sebumAndPorphyrins?.score ?? 70,
    percentile: rawMetrics.sebumAndPorphyrins?.percentile ?? 70,
    level: 'optimal',
    description: rawMetrics.sebumAndPorphyrins?.description || 'Mikrobiálna aktivita'
  };
  const sensitivityAndBarrier = rawMetrics.sensitivityAndBarrier || {
    label: 'Citlivosť a reaktivita bariéry',
    lightMode: 'Kombinované spektrum',
    score: rawMetrics.hydration?.score ?? 52,
    percentile: rawMetrics.hydration?.percentile ?? 50,
    level: (rawMetrics.hydration?.score ?? 52) < 50 ? 'critical' : 'mild',
    description: 'Bariérová funkcia stratum corneum'
  };

  const metrics = {
    ...rawMetrics,
    overallSkinScore,
    fitzpatrickType,
    chronologicalAge,
    skinAge,
    skinType,
    hydrationAndSebum,
    poresAndTexture,
    wrinklesAndElasticity,
    surfacePigmentation,
    uvDeepSpots,
    vascularityAndRedness,
    porphyrinsAndAcne,
    sensitivityAndBarrier
  };

  const rawSynthesis: any = report.clinicalSynthesis || {};
  const clinicalSynthesis = {
    ...rawSynthesis,
    executiveSummary: rawSynthesis.executiveSummary || rawSynthesis.summary || 'Klinická syntéza stavu pleti na základe spektrálnej analýzy.',
    primaryConcerns: rawSynthesis.primaryConcerns || rawSynthesis.keyFindings || ['Hydratácia', 'Vrásky'],
    contraindicationsAndAlerts: rawSynthesis.contraindicationsAndAlerts || rawSynthesis.riskAlerts || report.anamnesis?.contraindications || []
  };

  let annualSchedule: any = report.annualSchedule;
  if (Array.isArray(report.annualSchedule)) {
    const q1 = (report.annualSchedule.find((s: any) => s.season === 'jar' || s.quarter?.includes('Q1')) as any)?.treatments || [];
    const q2 = (report.annualSchedule.find((s: any) => s.season === 'leto' || s.quarter?.includes('Q2')) as any)?.treatments || [];
    const q3 = (report.annualSchedule.find((s: any) => s.season === 'jesen' || s.quarter?.includes('Q3')) as any)?.treatments || [];
    const q4 = (report.annualSchedule.find((s: any) => s.season === 'zima' || s.quarter?.includes('Q4')) as any)?.treatments || [];
    annualSchedule = {
      q1_spring: q1,
      q2_summer: q2,
      q3_autumn: q3,
      q4_winter: q4,
    };
  } else if (!annualSchedule) {
    annualSchedule = {
      q1_spring: [],
      q2_summer: [],
      q3_autumn: [],
      q4_winter: [],
    };
  }

  const { anamnesis, skincareRoutine } = report;

  // Interné procedúry SAY CLINIC
  const internalSkinTreatments: ClinicPriceItem[] = React.useMemo(() => {
    const allLive = getLiveClinicPriceList();
    return SKIN_TREATMENT_IDS
      .map(id => allLive.find(item => item.id === id))
      .filter((item): item is ClinicPriceItem => Boolean(item));
  }, []);

  // Externé procedúry mimo portfólia SAY CLINIC
  const externalSkinTreatments: ClinicPriceItem[] = React.useMemo(() => {
    const allLive = getLiveClinicPriceList();
    return EXTERNAL_TREATMENT_IDS
      .map(id => allLive.find(item => item.id === id))
      .filter((item): item is ClinicPriceItem => Boolean(item));
  }, []);

  // Všetky dostupné na výber
  const availableSkinTreatments: ClinicPriceItem[] = React.useMemo(() => {
    return [...internalSkinTreatments, ...externalSkinTreatments];
  }, [internalSkinTreatments, externalSkinTreatments]);

  // Expertná optimálna rutina EBM (to najlepšie pre pleť bez ohľadu na značku a sklad)
  const expertRoutine: any = React.useMemo(() => {
    return report.skincareRoutine?.expert || MeicetClinicalEducationService.generateExpertOptimalRoutine(report);
  }, [report]);

  // Hybridná rutina ADVANCED (kľúčové aktíva SkinCeuticals + lekárenská báza, 100% sklad kliniky)
  const advancedRoutine: any = React.useMemo(() => {
    return report.skincareRoutine?.advanced || MeicetClinicalEducationService.generateAdvancedRoutine(report);
  }, [report]);

  // Aktívna skincare rutina podľa zvoleného tieru:
  // 1. Essential (mid_end): La Roche-Posay, CeraVe, Vichy
  // 2. Advanced (advanced): SkinCeuticals aktíva + lekárenská báza (100% sklad kliniky)
  // 3. Premium (high_end): SkinCeuticals
  // 4. Clinical Optimum (expert): To najlepšie pre pleť bez ohľadu na značku a sklad
  const activeTierRoutine: MeicetSkincareTierRoutine = selectedTier === 'expert'
    ? expertRoutine
    : selectedTier === 'advanced'
      ? advancedRoutine
      : selectedTier === 'mid_end'
        ? (report.skincareRoutine?.midEnd || {
            tier: 'mid_end',
            tierLabel: 'Essential (La Roche-Posay, CeraVe, Vichy)',
            brandDescription: 'Dostupná lekárenská starostlivosť z nášho cenníka – overená dermatologická tolerancia a obnova bariéry',
            totalEstimatedPrice: 121,
            morning: report.skincareRoutine?.morning || [],
            evening: report.skincareRoutine?.evening || [],
            weeklyCare: report.skincareRoutine?.weeklyCare || []
          })
        : (report.skincareRoutine?.highEnd || {
            tier: 'high_end',
            tierLabel: 'Premium (SkinCeuticals)',
            brandDescription: 'Klinický luxus z cenníka – patentované zloženia s maximálnou koncentráciou antioxidantov a lipidov',
            totalEstimatedPrice: 538,
            morning: report.skincareRoutine?.morning || [],
            evening: report.skincareRoutine?.evening || [],
            weeklyCare: report.skincareRoutine?.weeklyCare || []
          });

  const currentMorning: MeicetSkincareProduct[] = activeTierRoutine.morning || [];
  const currentEvening: MeicetSkincareProduct[] = activeTierRoutine.evening || [];
  const currentWeeklyCare: string[] = activeTierRoutine.weeklyCare || [];

  const allRoutineProducts = [...currentMorning, ...currentEvening];
  const productsToBuy = allRoutineProducts.filter(item => !item.alreadyOwned);
  const ownedProducts = allRoutineProducts.filter(item => item.alreadyOwned);

  const currentTotalPrice = productsToBuy.reduce((sum, item) => sum + (item.price || 0), 0);
  const totalOwnedSaved = ownedProducts.reduce((sum, item) => sum + (item.price || 0), 0);

  // Pomocná funkcia na aplikáciu zmien v skincare rutine
  const updateSkincareRoutine = (
    newMorning: MeicetSkincareProduct[],
    newEvening: MeicetSkincareProduct[]
  ) => {
    const updatedTierData = {
      ...activeTierRoutine,
      morning: newMorning,
      evening: newEvening
    };

    const updatedSkincare: any = {
      ...report.skincareRoutine,
      selectedTier,
      morning: newMorning,
      evening: newEvening,
      highEnd: selectedTier === 'high_end' ? updatedTierData : report.skincareRoutine?.highEnd,
      advanced: selectedTier === 'advanced' ? updatedTierData : (report.skincareRoutine?.advanced || advancedRoutine),
      midEnd: selectedTier === 'mid_end' ? updatedTierData : report.skincareRoutine?.midEnd,
      expert: selectedTier === 'expert' ? updatedTierData : (report.skincareRoutine?.expert || expertRoutine)
    };

    const updatedReport: MeicetAnalysisResult = {
      ...report,
      skincareRoutine: updatedSkincare
    };

    if (onUpdateReport) {
      onUpdateReport(updatedReport);
    }
  };

  // 1. Nahradenie produktu za iný
  const handleSwapSkincareProduct = (
    newProduct: MeicetSkincareProduct,
    routineType: 'morning' | 'evening'
  ) => {
    if (routineType === 'morning') {
      const updated = currentMorning.map(p => p.step === newProduct.step ? newProduct : p);
      updateSkincareRoutine(updated, currentEvening);
    } else {
      const updated = currentEvening.map(p => p.step === newProduct.step ? newProduct : p);
      updateSkincareRoutine(currentMorning, updated);
    }
  };

  // 2. Prepnutie "Klient už vlastní doma"
  const handleToggleProductAlreadyOwned = (
    targetProduct: MeicetSkincareProduct,
    routineType: 'morning' | 'evening'
  ) => {
    const toggle = (p: MeicetSkincareProduct) => 
      p.step === targetProduct.step ? { ...p, alreadyOwned: !p.alreadyOwned } : p;

    if (routineType === 'morning') {
      updateSkincareRoutine(currentMorning.map(toggle), currentEvening);
    } else {
      updateSkincareRoutine(currentMorning, currentEvening.map(toggle));
    }
  };

  // 3. Úprava frekvencie a titrácie
  const handleSaveProductTitration = (
    targetProduct: MeicetSkincareProduct,
    routineType: 'morning' | 'evening',
    frequency: string,
    titration?: string
  ) => {
    const edit = (p: MeicetSkincareProduct) => 
      p.step === targetProduct.step 
        ? { ...p, frequencySchedule: frequency, usage: frequency, titrationNotes: titration } 
        : p;

    if (routineType === 'morning') {
      updateSkincareRoutine(currentMorning.map(edit), currentEvening);
    } else {
      updateSkincareRoutine(currentMorning, currentEvening.map(edit));
    }
  };

  // 4. Odstránenie produktu z rutiny (s prečíslovaním krokov)
  const handleRemoveSkincareProduct = (
    targetProduct: MeicetSkincareProduct,
    routineType: 'morning' | 'evening'
  ) => {
    if (routineType === 'morning') {
      const filtered = currentMorning
        .filter(p => p.step !== targetProduct.step)
        .map((p, idx) => ({ ...p, step: idx + 1 }));
      updateSkincareRoutine(filtered, currentEvening);
    } else {
      const filtered = currentEvening
        .filter(p => p.step !== targetProduct.step)
        .map((p, idx) => ({ ...p, step: idx + 1 }));
      updateSkincareRoutine(currentMorning, filtered);
    }
  };

  // 5. Nahradenie procedúry v kvartáli
  const handleSwapProcedureItem = (
    newTreatment: MeicetTreatmentPlanItem,
    quarterKey: 'q1_spring' | 'q2_summer' | 'q3_autumn' | 'q4_winter'
  ) => {
    const updatedQuarter = (annualSchedule[quarterKey] || []).map((item: any) => 
      item.id === newTreatment.id ? newTreatment : item
    );
    const updatedSchedule = {
      ...annualSchedule,
      [quarterKey]: updatedQuarter
    };
    if (onUpdateReport) {
      onUpdateReport({ ...report, annualSchedule: updatedSchedule });
    }
  };

  // 6. Presun procedúry do iného kvartálu
  const handleMoveProcedureQuarter = (
    treatment: MeicetTreatmentPlanItem,
    sourceQuarterKey: 'q1_spring' | 'q2_summer' | 'q3_autumn' | 'q4_winter',
    targetQuarterKey: 'q1_spring' | 'q2_summer' | 'q3_autumn' | 'q4_winter'
  ) => {
    if (sourceQuarterKey === targetQuarterKey) return;
    const seasonLabels: Record<'q1_spring' | 'q2_summer' | 'q3_autumn' | 'q4_winter', string> = {
      q1_spring: 'Jar (Q1)',
      q2_summer: 'Leto (Q2)',
      q3_autumn: 'Jeseň (Q3)',
      q4_winter: 'Zima (Q4)'
    };
    const movedItem = {
      ...treatment,
      seasonOrMonth: seasonLabels[targetQuarterKey]
    };
    const updatedSchedule = {
      ...annualSchedule,
      [sourceQuarterKey]: (annualSchedule[sourceQuarterKey] || []).filter((i: any) => i.id !== treatment.id),
      [targetQuarterKey]: [...(annualSchedule[targetQuarterKey] || []), movedItem]
    };
    if (onUpdateReport) {
      onUpdateReport({ ...report, annualSchedule: updatedSchedule });
    }
  };

  // 7. Zmena priority procedúry
  const handleChangeProcedurePriority = (
    treatment: MeicetTreatmentPlanItem,
    quarterKey: 'q1_spring' | 'q2_summer' | 'q3_autumn' | 'q4_winter',
    priority: 'vysoká' | 'odporúčaná' | 'udržiavacia'
  ) => {
    const updatedQuarter = (annualSchedule[quarterKey] || []).map((item: any) => 
      item.id === treatment.id ? { ...item, priority } : item
    );
    const updatedSchedule = {
      ...annualSchedule,
      [quarterKey]: updatedQuarter
    };
    if (onUpdateReport) {
      onUpdateReport({ ...report, annualSchedule: updatedSchedule });
    }
  };

  // 8. Označenie procedúry ako externý zákrok
  const handleToggleProcedureExternal = (
    treatment: MeicetTreatmentPlanItem,
    quarterKey: 'q1_spring' | 'q2_summer' | 'q3_autumn' | 'q4_winter'
  ) => {
    const updatedQuarter = (annualSchedule[quarterKey] || []).map((item: any) => 
      item.id === treatment.id ? { ...item, isExternal: !item.isExternal } : item
    );
    const updatedSchedule = {
      ...annualSchedule,
      [quarterKey]: updatedQuarter
    };
    if (onUpdateReport) {
      onUpdateReport({ ...report, annualSchedule: updatedSchedule });
    }
  };

  const allAnnualProcedures = [
    ...(annualSchedule?.q1_spring || []),
    ...(annualSchedule?.q2_summer || []),
    ...(annualSchedule?.q3_autumn || []),
    ...(annualSchedule?.q4_winter || []),
  ];
  const internalAnnualProcedures = allAnnualProcedures.filter((item: any) => !item.isExternal);
  const totalAnnualProceduresPrice = internalAnnualProcedures.reduce((sum, item: any) => sum + (item.price ?? item.estimatedPrice ?? 0), 0);

  const handleSelectTier = (tier: SkincareTier) => {
    setSelectedTier(tier);
    const tierRoutine = tier === 'expert'
      ? (report.skincareRoutine?.expert || expertRoutine)
      : tier === 'advanced'
        ? (report.skincareRoutine?.advanced || advancedRoutine)
        : tier === 'mid_end'
          ? report.skincareRoutine?.midEnd
          : report.skincareRoutine?.highEnd;

    if (onUpdateReport && tierRoutine) {
      onUpdateReport({
        ...report,
        skincareRoutine: {
          ...report.skincareRoutine,
          selectedTier: tier,
          morning: tierRoutine.morning,
          evening: tierRoutine.evening,
          weeklyCare: tierRoutine.weeklyCare,
        }
      });
    }
  };

  // Pridanie procedúry do vybraného kvartálu v ročnom pláne pleti
  const handleAddProcedureToQuarter = () => {
    const found = availableSkinTreatments.find(t => t.id === selectedNewTreatmentId);
    if (!found) return;

    const seasonLabels: Record<'q1_spring' | 'q2_summer' | 'q3_autumn' | 'q4_winter', string> = {
      q1_spring: 'Jar (Q1)',
      q2_summer: 'Leto (Q2)',
      q3_autumn: 'Jeseň (Q3)',
      q4_winter: 'Zima (Q4)'
    };

    const isLaser = (found.category as string) === 'laser' || found.id.toLowerCase().includes('laser');
    const isInjectable = (found.category as string).includes('injekc') || found.id.includes('botox') || found.id.includes('rejuran') || found.id.includes('profhilo');
    const mappedCategory: MeicetTreatmentPlanItem['category'] = isLaser ? 'laser' : isInjectable ? 'injectable' : 'skin_care';

    const newItem: any = {
      id: `proc-${found.id}-${Date.now()}`,
      seasonOrMonth: seasonLabels[selectedSeasonKey],
      category: mappedCategory,
      name: found.name,
      targetArea: 'Tvár / Dekolt',
      reasoning: found.description || 'Cielené klinické ošetrenie pleti podľa diagnostiky Meicet Pro-A.',
      price: found.price,
      estimatedPrice: found.price,
      frequency: '1 sedenie',
      sessionsCount: 1,
      intervalWeeks: 4,
      downtime: isLaser ? '2 - 5 dní' : '0 - 24 hodín',
      priority: 'vysoká',
      status: 'planned',
      isExternal: Boolean(found.isExternal),
      externalProviderNote: found.externalProviderNote
    };

    const updatedSchedule = {
      ...annualSchedule,
      [selectedSeasonKey]: [...(annualSchedule[selectedSeasonKey] || []), newItem]
    };

    const updatedReport: MeicetAnalysisResult = {
      ...report,
      annualSchedule: updatedSchedule
    };

    if (onUpdateReport) {
      onUpdateReport(updatedReport);
    }
  };

  // Odstránenie procedúry z kvartálu
  const handleRemoveProcedureFromQuarter = (
    seasonKey: 'q1_spring' | 'q2_summer' | 'q3_autumn' | 'q4_winter',
    itemId: string
  ) => {
    const updatedSchedule = {
      ...annualSchedule,
      [seasonKey]: (annualSchedule[seasonKey] || []).filter((item: any) => item.id !== itemId)
    };
    if (onUpdateReport) {
      onUpdateReport({
        ...report,
        annualSchedule: updatedSchedule
      });
    }
  };

  // Uloženie Meicet analýzy: do histórie Meicet, do zdravotných záznamov a na Google Drive (s PDF)
  const handleSavePlan = async () => {
    setIsSaving(true);
    try {
      const updatedReport: MeicetAnalysisResult = {
        ...report,
        skincareRoutine: {
          ...report.skincareRoutine,
          selectedTier,
          morning: currentMorning,
          evening: currentEvening,
          weeklyCare: currentWeeklyCare
        }
      };

      if (onUpdateReport) {
        onUpdateReport(updatedReport);
      }

      // 1. Uložiť do histórie MeicetService (uchováva celú históriu skenov pacienta)
      MeicetService.saveReport(updatedReport);

      // 2. Vygenerovať Base64 PDF z A4 dokumentu pre nahranie na Google Drive
      let pdfBase64: string | undefined = undefined;
      const targetElement = hiddenPdfRef.current || pdfReportRef.current;
      if (targetElement) {
        try {
          pdfBase64 = await generatePdfBase64(targetElement, {
            format: 'a4',
            headerTitle: 'Meicet Pro-A 3D Analýza & Ročný plán pleti',
            patientName: report.patientName
          });
        } catch (pdfErr) {
          console.warn('Nepodarilo sa vygenerovať PDF base64:', pdfErr);
        }
      }

      // 3. Uložiť cez CloudRecordService do Záznamov & Dokumentácie a na Google Drive
      let driveLink: string | undefined = undefined;
      if (onSaveToDriveAndRecords) {
        const res = await onSaveToDriveAndRecords(updatedReport, pdfBase64);
        if (res && res.driveWebViewLink) {
          driveLink = res.driveWebViewLink;
        }
      }

      setIsSaved(true);
      setSavedDriveLink(driveLink || null);
      setTimeout(() => setIsSaved(false), 6000);
    } catch (err) {
      console.error('Chyba pri ukladaní plánu pleti:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Naplánovanie ošetrenia do kalendára kliniky
  const handleScheduleItem = (treatment: MeicetTreatmentPlanItem) => {
    if (onScheduleTreatment) {
      onScheduleTreatment({
        title: treatment.name,
        patientName: report.patientName,
        patientId: report.patientId,
        date: new Date().toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '10:45',
        type: 'osetrenie',
        doctorName: 'MUDr. Ján Mráz',
        notes: `Zákrok z ročného plánu pleti Meicet Pro-A: ${treatment.name} (${treatment.seasonOrMonth}). Cieľ: ${treatment.targetArea}. Dôvod: ${treatment.reasoning}`
      });
      setBookedTreatments(prev => ({ ...prev, [treatment.id]: true }));
    }
  };

  // Preniesť zvolenú skincare rutinu do pokladne POS (výhradne interné produkty SAY CLINIC a ktoré klient ešte nevlastní)
  const handleTransferToPOS = () => {
    if (!onTransferToCosmeticsPOS) return;
    const internalMorning = currentMorning.filter(p => !p.isExternal && !p.alreadyOwned);
    const internalEvening = currentEvening.filter(p => !p.isExternal && !p.alreadyOwned);
    const externalMorning = currentMorning.filter(p => p.isExternal && !p.alreadyOwned);
    const externalEvening = currentEvening.filter(p => p.isExternal && !p.alreadyOwned);

    const clinicPriceToPay = [...internalMorning, ...internalEvening].reduce((sum, p) => sum + (p.price || 0), 0);
    const externalPriceToPay = [...externalMorning, ...externalEvening].reduce((sum, p) => sum + (p.price || 0), 0);

    const allProducts = [
      ...internalMorning.map(p => ({
        id: `prod-${selectedTier}-m-${p.step}`,
        name: p.productName,
        brand: p.brand,
        price: p.price || 45,
        category: p.category,
        tier: selectedTier,
        quantity: 1
      })),
      ...internalEvening.map(p => ({
        id: `prod-${selectedTier}-e-${p.step}`,
        name: p.productName,
        brand: p.brand,
        price: p.price || 45,
        category: p.category,
        tier: selectedTier,
        quantity: 1
      }))
    ];
    // Deduplikácia podľa názvu produktu (napr. rovnaký čistiaci gél)
    const uniqueProducts = Array.from(new Map(allProducts.map(p => [p.name, p])).values());
    if (uniqueProducts.length > 0) {
      onTransferToCosmeticsPOS(uniqueProducts);
    }

    const tierName = selectedTier === 'expert' 
      ? 'Clinical Optimum (Expert)' 
      : selectedTier === 'advanced'
        ? 'Advanced (SkinCeuticals & Essential)'
        : selectedTier === 'high_end' 
          ? 'Premium (SkinCeuticals)' 
          : 'Essential (La Roche-Posay / CeraVe / Vichy)';

    if (uniqueProducts.length > 0 && externalPriceToPay > 0) {
      setPosTransferNotice(`Sada ${tierName}: do POS pokladne bolo odoslaných ${uniqueProducts.length} skladových produktov (${clinicPriceToPay} €). Zostávajúce položky (~${externalPriceToPay} €) sú určené na nákup v lekárni / e-shope.`);
    } else if (uniqueProducts.length > 0) {
      setPosTransferNotice(`Sada ${tierName} (${uniqueProducts.length} položiek k úhrade, spolu ${currentTotalPrice} €${totalOwnedSaved > 0 ? `, ušetrené ${totalOwnedSaved} € za produkty, ktoré klient už má` : ''}) bola odoslaná do POS pokladne.`);
    } else {
      setPosTransferNotice(`V sade ${tierName} sú všetky položky na nákup v lekárni / e-shope (~${externalPriceToPay} €). Do pokladne kliniky neboli pridané žiadne položky.`);
    }
    setTimeout(() => setPosTransferNotice(null), 6000);
  };

  const handlePrint = () => {
    if (typeof window === 'undefined') return;
    const tempStyle = document.createElement('style');
    tempStyle.id = 'say-meicet-print-style';
    tempStyle.innerHTML = `
      @page {
        size: A4 portrait !important;
        margin: 10mm 12mm !important;
      }
      @media print {
        body * { visibility: hidden !important; }
        #printable-meicet-report, #printable-meicet-report * { visibility: visible !important; }
        #printable-meicet-report {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
        }
      }
    `;
    document.head.appendChild(tempStyle);

    const cleanup = () => {
      const s = document.getElementById('say-meicet-print-style');
      if (s) s.remove();
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup, { once: true });
    window.print();
    setTimeout(cleanup, 2500);
  };

  const handleDownloadPdf = async () => {
    if (!pdfReportRef.current) return;
    setGeneratingPdf(true);
    try {
      const filename = generatePdfFilename('Meicet_ProA_Analyza', report.patientName, report.scanDate);
      await exportElementToPdf(pdfReportRef.current, filename, {
        format: 'a4',
        headerTitle: 'Meicet Pro-A 3D Analýza & Ročný plán pleti',
        patientName: report.patientName,
      });
    } catch (err) {
      console.error('Chyba exportu Meicet do PDF:', err);
      alert('Nastala chyba pri generovaní Meicet PDF správy.');
    } finally {
      setGeneratingPdf(false);
    }
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
                Meicet AI & Plán pleti (Skincare + Ročný plán procedúr)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Čistý pleťový protokol
              </span>
            </div>
            <p className="text-xs text-[#E8E2D9] mt-0.5">
              Pacient: <strong>{report.patientName}</strong> | Dátum: {report.scanDate} | Zdroj: {report.pdfSourceFilename || 'Meicet Pro-A / Rýchla diagnostika'}
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
              <span>Predaj Skincare do POS ({currentTotalPrice} €)</span>
            </button>
          )}

          {/* ULOŽIŤ NA DISK, DO ZÁZNAMOV A HISTÓRIE MEICET */}
          <button
            type="button"
            onClick={handleSavePlan}
            disabled={isSaving}
            className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
              isSaved 
                ? 'bg-emerald-600 text-white' 
                : isSaving
                ? 'bg-amber-700 text-white opacity-85 cursor-wait'
                : 'bg-gradient-to-r from-[#C5A059] to-[#8C6D2D] hover:from-[#d8b167] hover:to-[#9f7d37] text-white'
            }`}
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4" />
                <span>Uložené na Disku & v histórii!</span>
              </>
            ) : isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Ukladám na Drive & do záznamov...</span>
              </>
            ) : (
              <>
                <HardDrive className="w-4 h-4" />
                <span>Uložiť na Disk & do záznamov</span>
              </>
            )}
          </button>

          {/* VOLITEĽNÉ: KOPÍROVAŤ PROCEDÚRY DO CHIRURGICKÉHO PLÁNU */}
          {onSaveToPatientPlans && (
            <button
              type="button"
              onClick={() => {
                const updatedReport: MeicetAnalysisResult = {
                  ...report,
                  skincareRoutine: {
                    ...report.skincareRoutine,
                    selectedTier,
                    morning: currentMorning,
                    evening: currentEvening,
                    weeklyCare: currentWeeklyCare
                  }
                };
                const patientPlan = MeicetService.convertToPatientPlan(updatedReport);
                onSaveToPatientPlans(patientPlan);
              }}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#E8E2D9] font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              title="Voliteľné: Preniesť procedúry pleti do kombinovaného Chirurgického plánu (Pre-Op/Post-Op)"
            >
              <span>🏥</span>
              <span>Preniesť do chirurgického plánu</span>
            </button>
          )}

          {/* NOVÝ SKEN / ZMENA PROBLÉMU PLETI */}
          {onNewScanRequested && (
            <button
              type="button"
              onClick={onNewScanRequested}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#E8E2D9] font-bold text-xs transition-colors cursor-pointer"
            >
              Zmeniť diagnostiku / Nový sken (PDF / JPG)
            </button>
          )}
        </div>
      </div>

      {/* NOTIFIKÁCIA O ULOŽENÍ NA DISK A DO HISTÓRIE */}
      {isSaved && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-between text-emerald-900 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 text-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-emerald-950">
                Plán pleti bol úspešne uložený do histórie Meicet a nahraný na Google Drive!
              </p>
              <p className="text-[11px] text-emerald-700 font-normal mt-0.5">
                PDF report s analýzou a ročným plánom procedúr bol zaradený medzi záznamy pacienta (kategória Dokumentácia) a uložený na Google Drive.
              </p>
            </div>
          </div>
          {savedDriveLink && (
            <a
              href={savedDriveLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer ml-3"
            >
              <span>📂</span>
              <span>Otvoriť PDF na Disku ↗</span>
            </a>
          )}
        </div>
      )}

      {/* NOTIFIKÁCIA O PRENOSE DO POS */}
      {posTransferNotice && (
        <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between text-purple-900 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 text-xs font-bold">
            <ShoppingBag className="w-4 h-4 text-purple-600" />
            <span>{posTransferNotice}</span>
          </div>
          <button onClick={() => setPosTransferNotice(null)} className="text-purple-500 hover:text-purple-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SÚHRNNÉ KARTY SKÓRE PLETI & SKINCARE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        
        {/* CELKOVÉ SKÓRE PLETI */}
        <div className="bg-white rounded-2xl border border-[#E8E2D9] p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C837A] block">
              Index zdravia pleti
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-serif font-bold text-[#2C2A29]">
                {metrics.overallSkinScore}
              </span>
              <span className="text-xs font-bold text-[#8C837A]">/ 100</span>
            </div>
            <p className="text-[11px] font-medium text-amber-700 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Cieľ o 12 mesiacov: <strong>85+ / 100</strong></span>
            </p>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-[#C5A059] bg-[#FDFBF7] flex flex-col items-center justify-center">
            <span className="text-xs font-bold text-[#8C6D2D]">FITZ</span>
            <span className="text-sm font-serif font-bold text-[#2C2A29]">{metrics.fitzpatrickType}</span>
          </div>
        </div>

        {/* VEK PLETI VS REÁLNY VEK */}
        <div className="bg-white rounded-2xl border border-[#E8E2D9] p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C837A] block">
              Biologický vek pleti
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-3xl font-serif font-bold ${metrics.skinAge > metrics.chronologicalAge ? 'text-rose-600' : 'text-emerald-600'}`}>
                {metrics.skinAge} r.
              </span>
              <span className="text-xs text-[#8C837A]">
                (vek: {metrics.chronologicalAge} r.)
              </span>
            </div>
            <p className="text-[11px] font-medium text-[#6B635B] mt-1">
              {metrics.skinAge > metrics.chronologicalAge 
                ? `Optické starnutie +${metrics.skinAge - metrics.chronologicalAge} roky` 
                : `Mladistvý profil pleti`}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* TYP A KONDÍCIA PLETI */}
        <div className="bg-white rounded-2xl border border-[#E8E2D9] p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C837A] block">
              Typ pleti & Hydratácia
            </span>
            <div className="text-base font-serif font-bold text-[#2C2A29] mt-1">
              {metrics.skinType}
            </div>
            <p className="text-[11px] text-[#6B635B] mt-1 flex items-center gap-1.5">
              <Droplet className="w-3.5 h-3.5 text-sky-500" />
              <span>Bariéra: <strong>{metrics.hydrationAndSebum.score}%</strong> ({metrics.hydrationAndSebum.level})</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
            <Droplet className="w-6 h-6" />
          </div>
        </div>

        {/* ZVOLENÁ SKINCARE & ROČNÝ PLÁN */}
        <div className="bg-gradient-to-br from-[#FAF7F2] to-[#F3EDE2] rounded-2xl border border-[#D4C5B1] p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C6D2D] block">
              Zvolená Skincare & Plán
            </span>
            <div className="text-sm font-serif font-bold text-[#2C2A29] mt-1">
              {selectedTier === 'expert' ? 'Clinical Optimum' : selectedTier === 'advanced' ? 'Advanced' : selectedTier === 'mid_end' ? 'Essential (Lekáreň)' : 'Premium (SkinCeuticals)'}: {currentTotalPrice} €
            </div>
            <p className="text-[11px] text-[#5A524C] mt-1">
              Klinické procedúry: <strong>{allAnnualProcedures.length}x</strong> ({totalAnnualProceduresPrice} €)
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#C5A059]/15 border border-[#C5A059]/30 flex items-center justify-center text-[#8C6D2D]">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* SYNTÉZA A KONTRAINDIKÁCIE PLETI */}
      <div className="bg-white rounded-2xl border border-[#E8E2D9] p-5 shadow-xs space-y-4">
        <div className="border-b border-[#E8E2D9] pb-4 space-y-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#C5A059]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#2C2A29]">
              Klinická syntéza pleti & Primárne ciele ošetrenia
            </h3>
          </div>
          <p className="text-xs text-[#5A524C] leading-relaxed">
            {clinicalSynthesis.executiveSummary}
          </p>
          {clinicalSynthesis.primaryConcerns && clinicalSynthesis.primaryConcerns.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#F0EBE1]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C857B] mr-1">
                Kľúčové ciele:
              </span>
              {clinicalSynthesis.primaryConcerns.map((concern: string, idx: number) => (
                <span key={idx} className="px-3 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-1.5 shadow-2xs">
                  <span className="text-rose-600 font-bold">🎯</span>
                  <span>{concern}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5 mb-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              Bezpečnostné upozornenia & Kontraindikácie
            </span>
            <ul className="text-[11px] text-amber-950 space-y-1">
              {((clinicalSynthesis as any).contraindicationsAndAlerts || (clinicalSynthesis as any).riskAlerts || []).map((alert: any, i: number) => (
                <li key={i} className="leading-snug">• {alert}</li>
              ))}
            </ul>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Portfólio kliniky SAY (Klinicky overené metódy)
            </span>
            <p className="text-[11px] text-emerald-950 leading-snug">
              Plán využíva výhradne reálne dostupné procedúry kliniky: <strong>Cievny laser</strong>, <strong>Frakčný CO2 laser / CoolPeel</strong>, <strong>Injekčné biostimulátory a polynukleotidy (Rejuran, Profhilo, Sculptra, Radiesse, Botox, HA)</strong> a <strong>Lekársky peeling (BioRePeel, TCA) & Dermapen 4</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* PREPÍNAČ 3 ČISTÝCH SEKCIÍ MODULU */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E8E2D9] pb-3">
        {[
          { id: 'metrics', label: '1. Stav pleti (Meicet 3D Metriky)', icon: Eye, badge: '8 vrstiev' },
          { id: 'skincare', label: '2. Domáca Skincare (Essential ⇄ Advanced ⇄ Premium ⇄ Optimum)', icon: Sun, badge: `${currentTotalPrice} €` },
          { id: 'annual_plan', label: '3. Ročný plán procedúr na pleť (Q1 – Q4)', icon: CalendarIcon, badge: `${allAnnualProcedures.length} zákrokov` },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#2C2A29] text-white shadow-md border border-[#C5A059]'
                  : 'bg-white text-[#5A524C] hover:bg-[#FAF7F2] border border-[#E8E2D9]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#C5A059]' : 'text-[#8C837A]'}`} />
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                isActive ? 'bg-[#C5A059]/25 text-[#E8C882]' : 'bg-[#F5F2EB] text-[#8C837A]'
              }`}>
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* ===================================================================================== */}
      {/* TAB 1: STAV PLETI (MEICET 3D METRIKY) */}
      {/* ===================================================================================== */}
      {activeTab === 'metrics' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              metrics.hydrationAndSebum,
              metrics.poresAndTexture,
              metrics.wrinklesAndElasticity,
              metrics.surfacePigmentation,
              metrics.uvDeepSpots,
              metrics.vascularityAndRedness,
              metrics.porphyrinsAndAcne,
              metrics.sensitivityAndBarrier,
            ].map((m, idx) => {
              const badgeColor =
                m.level === 'critical'
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : m.level === 'moderate'
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : m.level === 'mild'
                  ? 'bg-sky-100 text-sky-800 border-sky-300'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-300';

              const barColor =
                m.level === 'critical'
                  ? 'bg-rose-500'
                  : m.level === 'moderate'
                  ? 'bg-amber-500'
                  : m.level === 'mild'
                  ? 'bg-sky-500'
                  : 'bg-emerald-500';

              return (
                <div key={idx} className="bg-white rounded-2xl border border-[#E8E2D9] p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C837A] block">
                          Spektrálny režim: {m.lightMode}
                        </span>
                        <h4 className="text-base font-serif font-bold text-[#2C2A29]">
                          {m.label}
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${badgeColor}`}>
                          {m.level === 'critical' ? 'Kritické' : m.level === 'moderate' ? 'Stredné' : m.level === 'mild' ? 'Mierne' : 'Optimálne'} ({m.score}/100)
                        </span>
                        {m.percentile !== undefined && (
                          <span className="block text-[10px] text-[#8C837A] mt-0.5">
                            Percentil rovesníkov: {m.percentile}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-2 bg-[#F5F2EB] rounded-full overflow-hidden my-3">
                      <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${m.score}%` }} />
                    </div>

                    <p className="text-xs text-[#4A433D] leading-relaxed mb-3">
                      <strong>Nález:</strong> {m.finding}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9] text-xs text-[#2C2A29]">
                    <span className="font-bold text-[#8C6D2D] block mb-0.5">
                      💡 Klinická indikácia:
                    </span>
                    {m.clinicalImplication}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================================== */}
      {/* TAB 2: DOMÁCA SKINCARE RÁNO / VEČER (BASIC ⇄ PREMIUM) */}
      {/* ===================================================================================== */}
      {activeTab === 'skincare' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* 🔬 KLINICKÁ DIAGNOSTICKO-TERAPEUTICKÁ MAPA & EDUKÁCIA */}
          <MeicetClinicalEducationCard 
            education={clinicalEducation} 
            patientName={report.patientName} 
          />

          {/* HORNÁ LIŠTA S PREPÍNAČOM BASIC VS PREMIUM A PRENOSOM DO POKLADNE */}
          <div className="bg-white rounded-2xl border-2 border-[#C5A059]/60 p-5 shadow-sm flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C6D2D] block">
                  Krok 2: Personalizovaná domáca dermokozmetika podľa cenníka kliniky
                </span>
                <h3 className="text-lg font-serif font-bold text-[#2C2A29] mt-0.5">
                  Ranný a večerný protokol na mieru ({activeTierRoutine.tierLabel})
                </h3>
                <p className="text-xs text-[#6B635B] mt-1">
                  {activeTierRoutine.brandDescription}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {totalOwnedSaved > 0 && (
                  <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center gap-1.5 shadow-2xs">
                    <Home className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Klient už má <strong>{ownedProducts.length}</strong> {ownedProducts.length === 1 ? 'produkt' : 'produkty'} (ušetrené <strong>{totalOwnedSaved} €</strong>)
                    </span>
                  </div>
                )}
                {onTransferToCosmeticsPOS && (
                  <button
                    type="button"
                    onClick={handleTransferToPOS}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm shrink-0"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Preniesť sadu do POS pokladne ({currentTotalPrice} €)</span>
                  </button>
                )}
              </div>
            </div>

            {/* PREPÍNAČ TIEROV: ESSENTIAL vs ADVANCED vs PREMIUM vs CLINICAL OPTIMUM */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5 pt-2 border-t border-[#E8E2D9]">
              {/* 1. ESSENTIAL / LEKÁREŇ */}
              <button
                type="button"
                onClick={() => handleSelectTier('mid_end')}
                className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedTier === 'mid_end'
                    ? 'border-sky-600 bg-sky-50/70 shadow-sm ring-1 ring-sky-500/20'
                    : 'border-[#E8E2D9] bg-[#FAF7F2] hover:border-sky-300'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-sky-600 text-white text-[10px] font-bold uppercase">
                      ESSENTIAL
                    </span>
                    <span className="text-sm font-serif font-bold text-[#2C2A29]">
                      Lekárenský základ
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-sky-950 mt-1">
                    La Roche-Posay, CeraVe, Vichy
                  </p>
                  <p className="text-[10px] text-[#6B635B] mt-0.5">
                    Dostupná dermokozmetika s overenou znášanlivosťou z nášho cenníka
                  </p>
                </div>
                <div className="text-right mt-3 pt-2 border-t border-sky-100 flex items-end justify-between">
                  <span className="text-[10px] text-sky-800 font-medium">100% sklad</span>
                  <div>
                    <span className="text-xs text-[#8C837A] block">Kompletná sada</span>
                    <span className="text-lg font-serif font-bold text-sky-900">
                      {report.skincareRoutine?.midEnd?.totalEstimatedPrice || 121} €
                    </span>
                  </div>
                </div>
              </button>

              {/* 2. ADVANCED / ZLATÁ STREDNÁ CESTA */}
              <button
                type="button"
                onClick={() => handleSelectTier('advanced')}
                className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedTier === 'advanced'
                    ? 'border-indigo-600 bg-gradient-to-br from-indigo-50/80 via-purple-50/30 to-white shadow-sm ring-1 ring-indigo-500/30'
                    : 'border-[#E8E2D9] bg-[#FAF7F2] hover:border-indigo-300'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-700 text-white text-[10px] font-bold uppercase shadow-2xs">
                      💎 ADVANCED
                    </span>
                    <span className="text-sm font-serif font-bold text-[#2C2A29]">
                      Hybridný balance
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-indigo-950 mt-1">
                    SkinCeuticals aktíva + lekárenská báza
                  </p>
                  <p className="text-[10px] text-[#6B635B] mt-0.5">
                    Patentovaný antioxidant / retinol SkinCeuticals s jemným čistením a SPF (100% náš sklad)
                  </p>
                </div>
                <div className="text-right mt-3 pt-2 border-t border-indigo-100 flex items-end justify-between">
                  <span className="text-[10px] text-indigo-800 font-medium">100% sklad</span>
                  <div>
                    <span className="text-xs text-[#8C837A] block">Kompletná sada</span>
                    <span className="text-lg font-serif font-bold text-indigo-900">
                      {advancedRoutine.totalEstimatedPrice || 310} €
                    </span>
                  </div>
                </div>
              </button>

              {/* 3. PREMIUM / KLINICKÝ LUXUS */}
              <button
                type="button"
                onClick={() => handleSelectTier('high_end')}
                className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedTier === 'high_end'
                    ? 'border-[#C5A059] bg-gradient-to-r from-[#FDFBF7] to-[#F5EFE4] shadow-sm ring-1 ring-[#C5A059]/30'
                    : 'border-[#E8E2D9] bg-[#FAF7F2] hover:border-[#C5A059]/50'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-[#2C2A29] text-[#E8C882] text-[10px] font-bold uppercase border border-[#C5A059]">
                      👑 PREMIUM
                    </span>
                    <span className="text-sm font-serif font-bold text-[#2C2A29]">
                      Klinický luxus
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-[#8C6D2D] mt-1">
                    SkinCeuticals Medical-Grade
                  </p>
                  <p className="text-[10px] text-[#6B635B] mt-0.5">
                    100% patentované zloženia C E Ferulic, H.A. Intensifier a Triple Lipid 2:4:2
                  </p>
                </div>
                <div className="text-right mt-3 pt-2 border-t border-[#E8DFC9] flex items-end justify-between">
                  <span className="text-[10px] text-[#8C6D2D] font-medium">100% sklad</span>
                  <div>
                    <span className="text-xs text-[#8C837A] block">Kompletná sada</span>
                    <span className="text-lg font-serif font-bold text-[#8C6D2D]">
                      {report.skincareRoutine?.highEnd?.totalEstimatedPrice || 538} €
                    </span>
                  </div>
                </div>
              </button>

              {/* 4. CLINICAL OPTIMUM / EXPERT */}
              <button
                type="button"
                onClick={() => handleSelectTier('expert')}
                className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedTier === 'expert'
                    ? 'border-emerald-600 bg-gradient-to-br from-emerald-50/80 via-teal-50/40 to-white shadow-sm ring-1 ring-emerald-500/30'
                    : 'border-[#E8E2D9] bg-[#FAF7F2] hover:border-emerald-400'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-700 text-white text-[10px] font-bold uppercase shadow-2xs">
                      ⭐ OPTIMUM
                    </span>
                    <span className="text-sm font-serif font-bold text-[#2C2A29]">
                      To najlepšie pre pleť
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-emerald-950 mt-1">
                    Medik8, Theramid, Rx, SkinCeuticals
                  </p>
                  <p className="text-[10px] text-[#6B635B] mt-0.5">
                    Nezávislý EBM výber najlepších molekúl na trhu bez ohľadu na sklad
                  </p>
                </div>
                <div className="text-right mt-3 pt-2 border-t border-emerald-100 flex items-end justify-between">
                  <span className="text-[10px] text-emerald-800 font-medium">
                    {expertRoutine.clinicEstimatedPrice ? `Sklad: ${expertRoutine.clinicEstimatedPrice} €` : ''}
                  </span>
                  <div>
                    <span className="text-xs text-[#8C837A] block">Kompletná sada</span>
                    <span className="text-lg font-serif font-bold text-emerald-800">
                      {expertRoutine.totalEstimatedPrice || 245} €
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* RANNÁ RUTINA */}
            <div className="bg-white rounded-2xl border border-[#E8E2D9] overflow-hidden shadow-xs">
              <div className="bg-gradient-to-r from-amber-500/15 to-orange-500/10 p-4 border-b border-[#E8E2D9] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                    <Sun className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-base text-[#2C2A29]">
                      Ranná rutina (AM Ochrana & Bariéra)
                    </h4>
                    <p className="text-[11px] text-[#6B635B]">
                      Antioxidačný štít, hydratácia a širokospektrálna UV ochrana
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg">
                  {currentMorning.length} kroky
                </span>
              </div>

              <div className="p-4 space-y-3">
                {currentMorning.map((stepItem) => {
                  const isExt = Boolean(stepItem.isExternal);
                  const isRx = Boolean(stepItem.prescriptionOnly);
                  const isOwned = Boolean(stepItem.alreadyOwned);

                  return (
                    <div 
                      key={stepItem.step} 
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setProductContextMenu({
                          isOpen: true,
                          x: e.clientX,
                          y: e.clientY,
                          product: stepItem,
                          routineType: 'morning'
                        });
                      }}
                      className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all group relative cursor-pointer ${
                        isOwned
                          ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-300/50 shadow-2xs'
                          : isExt 
                            ? 'bg-stone-100/80 border-stone-300 hover:border-stone-400' 
                            : 'bg-[#FAF7F2] border-[#E8E2D9] hover:border-[#C5A059]'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 ${
                        isOwned 
                          ? 'bg-emerald-600 text-white' 
                          : isExt 
                            ? 'bg-stone-500 text-white' 
                            : 'bg-amber-500 text-white'
                      }`}>
                        {stepItem.step}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                              isOwned
                                ? 'text-emerald-800 bg-emerald-100/90'
                                : isExt 
                                  ? 'text-stone-700 bg-stone-200/80' 
                                  : 'text-amber-800 bg-amber-100/80'
                            }`}>
                              {stepItem.category}
                            </span>
                            {isOwned && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                <Home className="w-3 h-3 text-emerald-700" />
                                🏠 Klient už vlastní doma
                              </span>
                            )}
                            {isExt && !isOwned && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                isRx 
                                  ? 'bg-rose-50 text-rose-800 border-rose-300' 
                                  : 'bg-stone-200 text-stone-700 border-stone-300'
                              }`}>
                                {isRx ? '💊 Liek na predpis (Rp.)' : '🌐 Lekáreň / Mimo kliniky'}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {stepItem.price && (
                              <div className="text-right">
                                {isOwned ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-serif font-bold line-through text-stone-400">
                                      {stepItem.price} €
                                    </span>
                                    <span className="text-[11px] font-bold text-emerald-700">
                                      (0 €)
                                    </span>
                                  </div>
                                ) : (
                                  <span className={`text-xs font-serif font-bold ${isExt ? 'text-stone-600' : 'text-[#2C2A29]'}`}>
                                    {isExt ? `~${stepItem.price} € (lekáreň)` : `${stepItem.price} €`}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Tlačidlo rýchlych možností (alebo pravý klik) */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const rect = e.currentTarget.getBoundingClientRect();
                                setProductContextMenu({
                                  isOpen: true,
                                  x: rect.left - 200,
                                  y: rect.bottom + 4,
                                  product: stepItem,
                                  routineType: 'morning'
                                });
                              }}
                              className="p-1 rounded-lg text-[#8C837A] hover:text-[#2C2A29] hover:bg-black/5 transition-all opacity-70 group-hover:opacity-100 cursor-pointer"
                              title="Možnosti produktu (alebo kliknite pravým tlačidlom)"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <h5 className="font-serif font-bold text-sm text-[#2C2A29] mt-1 flex items-center justify-between">
                          <span>{stepItem.brand} – {stepItem.productName}</span>
                        </h5>

                        {/* BLOK 1: 🧪 Kľúčová účinná látka & koncentrácia */}
                        <div className="mt-2">
                          <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#8C6D2D] bg-[#F5EFE6] px-2.5 py-1 rounded-lg border border-[#E8DFC9] flex-wrap">
                            <FlaskConical className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                            <span className="font-bold text-[#634812]">Účinná látka:</span>
                            <span className="text-[#3E3833]">{stepItem.keyActiveIngredient || (stepItem as any).keyIngredients || stepItem.activeIngredients}</span>
                          </div>
                        </div>

                        {/* BLOK 2: 💡 Prečo je dôležitá pre vašu pleť */}
                        {(stepItem.whyItMatters || stepItem.meicetJustification) && (
                          <div className="mt-2 text-[11px] bg-amber-50/80 border border-amber-200/70 rounded-lg p-2.5 text-[#5A4315] leading-relaxed">
                            <div className="font-bold text-amber-900 flex items-center gap-1 mb-0.5">
                              <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              Prečo je dôležitá pre vašu pleť:
                            </div>
                            <p className="text-[#4E3A10]">{stepItem.whyItMatters || stepItem.meicetJustification}</p>
                          </div>
                        )}

                        {/* BLOK 3: ⏱️ Frekvencia aplikácie a protokol titrácie */}
                        <div className="mt-2 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700 bg-slate-100/90 px-2.5 py-1 rounded-lg border border-slate-200 flex-wrap">
                            <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="font-bold text-slate-800">Frekvencia:</span>
                            <span className="text-slate-700">{stepItem.frequencySchedule || (stepItem as any).usageNotes || stepItem.usage}</span>
                          </div>
                          {stepItem.titrationNotes && (
                            <div className="text-[11px] text-indigo-950 bg-indigo-50/90 border border-indigo-200/80 rounded-lg p-2 leading-relaxed">
                              <span className="font-bold text-indigo-900">⚠️ Protokol aplikácie / Titrácia:</span> {stepItem.titrationNotes}
                            </div>
                          )}
                        </div>

                        {isExt && (stepItem.externalProviderNote || isRx) && (
                          <p className="text-[10px] italic text-stone-500 mt-2 bg-white/70 p-1.5 rounded-lg border border-stone-200">
                            ℹ️ {stepItem.externalProviderNote || (isRx ? 'Vyžaduje lekársky predpis (Rp.), zakúpiť v lekárni' : 'Zakúpiť v lekárni alebo drogérii')}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* VEČERNÁ RUTINA */}
            <div className="bg-white rounded-2xl border border-[#E8E2D9] overflow-hidden shadow-xs">
              <div className="bg-gradient-to-r from-indigo-500/15 to-purple-500/10 p-4 border-b border-[#E8E2D9] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <Moon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-base text-[#2C2A29]">
                      Večerná rutina (PM Obnova & Remodelácia)
                    </h4>
                    <p className="text-[11px] text-[#6B635B]">
                      Dvojfázové čistenie, bunkový obrat a hĺbková obnova lipidov
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-indigo-800 bg-indigo-100 px-2.5 py-1 rounded-lg">
                  {currentEvening.length} kroky
                </span>
              </div>

              <div className="p-4 space-y-3">
                {currentEvening.map((stepItem) => {
                  const isExt = Boolean(stepItem.isExternal);
                  const isRx = Boolean(stepItem.prescriptionOnly);
                  const isOwned = Boolean(stepItem.alreadyOwned);

                  return (
                    <div 
                      key={stepItem.step} 
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setProductContextMenu({
                          isOpen: true,
                          x: e.clientX,
                          y: e.clientY,
                          product: stepItem,
                          routineType: 'evening'
                        });
                      }}
                      className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all group relative cursor-pointer ${
                        isOwned
                          ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-300/50 shadow-2xs'
                          : isExt 
                            ? 'bg-stone-100/80 border-stone-300 hover:border-stone-400' 
                            : 'bg-[#FAF7F2] border-[#E8E2D9] hover:border-[#C5A059]'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 ${
                        isOwned 
                          ? 'bg-emerald-600 text-white' 
                          : isExt 
                            ? 'bg-stone-500 text-white' 
                            : 'bg-indigo-600 text-white'
                      }`}>
                        {stepItem.step}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                              isOwned
                                ? 'text-emerald-800 bg-emerald-100/90'
                                : isExt 
                                  ? 'text-stone-700 bg-stone-200/80' 
                                  : 'text-indigo-800 bg-indigo-100/80'
                            }`}>
                              {stepItem.category}
                            </span>
                            {isOwned && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                <Home className="w-3 h-3 text-emerald-700" />
                                🏠 Klient už vlastní doma
                              </span>
                            )}
                            {isExt && !isOwned && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                isRx 
                                  ? 'bg-rose-50 text-rose-800 border-rose-300' 
                                  : 'bg-stone-200 text-stone-700 border-stone-300'
                              }`}>
                                {isRx ? '💊 Liek na predpis (Rp.)' : '🌐 Lekáreň / Mimo kliniky'}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {stepItem.price && (
                              <div className="text-right">
                                {isOwned ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-serif font-bold line-through text-stone-400">
                                      {stepItem.price} €
                                    </span>
                                    <span className="text-[11px] font-bold text-emerald-700">
                                      (0 €)
                                    </span>
                                  </div>
                                ) : (
                                  <span className={`text-xs font-serif font-bold ${isExt ? 'text-stone-600' : 'text-[#2C2A29]'}`}>
                                    {isExt ? `~${stepItem.price} € (lekáreň)` : `${stepItem.price} €`}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Tlačidlo rýchlych možností (alebo pravý klik) */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const rect = e.currentTarget.getBoundingClientRect();
                                setProductContextMenu({
                                  isOpen: true,
                                  x: rect.left - 200,
                                  y: rect.bottom + 4,
                                  product: stepItem,
                                  routineType: 'evening'
                                });
                              }}
                              className="p-1 rounded-lg text-[#8C837A] hover:text-[#2C2A29] hover:bg-black/5 transition-all opacity-70 group-hover:opacity-100 cursor-pointer"
                              title="Možnosti produktu (alebo kliknite pravým tlačidlom)"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <h5 className="font-serif font-bold text-sm text-[#2C2A29] mt-1 flex items-center justify-between">
                          <span>{stepItem.brand} – {stepItem.productName}</span>
                        </h5>

                        {/* BLOK 1: 🧪 Kľúčová účinná látka & koncentrácia */}
                        <div className="mt-2">
                          <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#8C6D2D] bg-[#F5EFE6] px-2.5 py-1 rounded-lg border border-[#E8DFC9] flex-wrap">
                            <FlaskConical className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                            <span className="font-bold text-[#634812]">Účinná látka:</span>
                            <span className="text-[#3E3833]">{stepItem.keyActiveIngredient || (stepItem as any).keyIngredients || stepItem.activeIngredients}</span>
                          </div>
                        </div>

                        {/* BLOK 2: 💡 Prečo je dôležitá pre vašu pleť */}
                        {(stepItem.whyItMatters || stepItem.meicetJustification) && (
                          <div className="mt-2 text-[11px] bg-amber-50/80 border border-amber-200/70 rounded-lg p-2.5 text-[#5A4315] leading-relaxed">
                            <div className="font-bold text-amber-900 flex items-center gap-1 mb-0.5">
                              <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              Prečo je dôležitá pre vašu pleť:
                            </div>
                            <p className="text-[#4E3A10]">{stepItem.whyItMatters || stepItem.meicetJustification}</p>
                          </div>
                        )}

                        {/* BLOK 3: ⏱️ Frekvencia aplikácie a protokol titrácie */}
                        <div className="mt-2 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700 bg-slate-100/90 px-2.5 py-1 rounded-lg border border-slate-200 flex-wrap">
                            <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="font-bold text-slate-800">Frekvencia:</span>
                            <span className="text-slate-700">{stepItem.frequencySchedule || (stepItem as any).usageNotes || stepItem.usage}</span>
                          </div>
                          {stepItem.titrationNotes && (
                            <div className="text-[11px] text-indigo-950 bg-indigo-50/90 border border-indigo-200/80 rounded-lg p-2 leading-relaxed">
                              <span className="font-bold text-indigo-900">⚠️ Protokol aplikácie / Titrácia:</span> {stepItem.titrationNotes}
                            </div>
                          )}
                        </div>

                        {isExt && (stepItem.externalProviderNote || isRx) && (
                          <p className="text-[10px] italic text-stone-500 mt-2 bg-white/70 p-1.5 rounded-lg border border-stone-200">
                            ℹ️ {stepItem.externalProviderNote || (isRx ? 'Vyžaduje lekársky predpis (Rp.), zakúpiť v lekárni' : 'Zakúpiť v lekárni alebo drogérii')}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* TÝŽDENNÁ STAROSTLIVOSŤ A PRAVIDLÁ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-[#E8E2D9] p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#2C2A29] mb-2.5 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#C5A059]" />
                Doplnková týždenná starostlivosť ({activeTierRoutine.tierLabel})
              </h4>
              <ul className="space-y-1.5 text-xs text-[#4A433D]">
                {currentWeeklyCare.map((w, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-rose-50/60 rounded-2xl border border-rose-200 p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900 mb-2.5 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                Čomu sa prísne vyhnúť (Kontraindikované zložky)
              </h4>
              <ul className="space-y-1.5 text-xs text-rose-950">
                {((skincareRoutine as any)?.ingredientsToAvoid || [
                  'Agresívne mechanické abrazívne peelingy s ostrými čiastočkami',
                  'Vysokopercentný denaturovaný alkohol',
                  'Kyseliny a retinoidy 7 dní pred laserom'
                ]).map((avoid: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-rose-600 font-bold">✕</span>
                    <span>{avoid}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================================== */}
      {/* TAB 3: ROČNÝ PLÁN PROCEDÚR NA PLEŤ (12 MESIACOV / Q1 - Q4) */}
      {/* ===================================================================================== */}
      {activeTab === 'annual_plan' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* RÝCHLE PRIDANIE PROCEDÚRY DO KVARTÁLU Z CENNÍKA KLINIKY */}
          <div className="bg-white rounded-2xl border-2 border-[#C5A059]/60 p-5 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C6D2D] block">
                  Krok 3: Klinické procedúry na pleť podľa sezóny (Q1 – Q4)
                </span>
                <h3 className="text-base font-serif font-bold text-[#2C2A29] mt-0.5">
                  Ročný harmonogram ošetrení pleti ({allAnnualProcedures.length} zákrokov | Spolu {totalAnnualProceduresPrice} €)
                </h3>
                <p className="text-xs text-[#6B635B] mt-0.5">
                  Cievny laser • Frakčný CO2 laser / CoolPeel • Botox, HA, Rejuran, Profhilo, Sculptra, Radiesse • BioRePeel, TCA peeling & Dermapen 4
                </p>
              </div>

              {/* PRIDAŤ ZÁKROK DO KVARTÁLU */}
              <div className="flex flex-wrap items-center gap-2 bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E8E2D9]">
                <select
                  value={selectedSeasonKey}
                  onChange={e => setSelectedSeasonKey(e.target.value as any)}
                  className="px-2.5 py-2 rounded-lg bg-white border border-[#D4C5B1] text-xs font-bold text-[#2C2A29]"
                >
                  <option value="q1_spring">🌸 Q1: Jar</option>
                  <option value="q2_summer">☀️ Q2: Leto</option>
                  <option value="q3_autumn">🍂 Q3: Jeseň</option>
                  <option value="q4_winter">❄️ Q4: Zima</option>
                </select>

                <select
                  value={selectedNewTreatmentId}
                  onChange={e => setSelectedNewTreatmentId(e.target.value)}
                  className="px-2.5 py-2 rounded-lg bg-white border border-[#D4C5B1] text-xs font-bold text-[#2C2A29] max-w-[290px]"
                >
                  <optgroup label="⭐ Portfólio SAY CLINIC">
                    {internalSkinTreatments.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.price} €)
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🌐 Mimo portfólia (Externé)">
                    {externalSkinTreatments.map(item => (
                      <option key={item.id} value={item.id} className="text-stone-500 bg-stone-50">
                        ⚪ {item.name} (~{item.price} €)
                      </option>
                    ))}
                  </optgroup>
                </select>

                <button
                  type="button"
                  onClick={handleAddProcedureToQuarter}
                  className="px-3 py-2 rounded-lg bg-[#2C2A29] hover:bg-[#3A3836] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Pridať do sezóny</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[
              {
                key: 'q1_spring' as const,
                title: '🌸 Q1: Jar (Marec – Máj)',
                subtitle: 'Biorevitalizácia, kontrola erytému a príprava bariéry pred letom',
                headerBg: 'from-emerald-600 to-teal-700',
                items: annualSchedule.q1_spring
              },
              {
                key: 'q2_summer' as const,
                title: '☀️ Q2: Leto (Jún – August)',
                subtitle: 'Hĺbková injekčná hydratácia, polynukleotidy a bezpečné letné protokoly',
                headerBg: 'from-amber-500 to-orange-600',
                items: annualSchedule.q2_summer
              },
              {
                key: 'q3_autumn' as const,
                title: '🍂 Q3: Jeseň (September – November)',
                subtitle: 'Korekcia fotopoškodenia, cievny laser, lekársky peeling a kolagénová stimulácia',
                headerBg: 'from-rose-600 to-amber-700',
                items: annualSchedule.q3_autumn
              },
              {
                key: 'q4_winter' as const,
                title: '❄️ Q4: Zima (December – Február)',
                subtitle: 'Hlboký laserový resurfacing (Frakčný CO2 / CoolPeel) v období nízkeho UV indexu',
                headerBg: 'from-slate-700 to-indigo-900',
                items: annualSchedule.q4_winter
              }
            ].map(season => (
              <div key={season.key} className="bg-white rounded-2xl border border-[#E8E2D9] overflow-hidden shadow-xs flex flex-col">
                <div className={`bg-gradient-to-r ${season.headerBg} text-white p-4 flex items-center justify-between`}>
                  <div>
                    <h4 className="font-serif font-bold text-base">{season.title}</h4>
                    <p className="text-[11px] text-white/85 mt-0.5">{season.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-lg bg-white/15 text-white text-xs font-bold">
                      {(season.items || []).filter((i: any) => !i.isExternal).reduce((sum: number, i: any) => sum + (i.price ?? i.estimatedPrice ?? 0), 0)} €
                    </span>
                    {(season.items || []).some((i: any) => i.isExternal) && (
                      <span className="text-[10px] text-white/80 bg-white/10 px-2 py-0.5 rounded-full border border-white/20">
                        + externé
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-3 flex-1">
                  {(!season.items || season.items.length === 0) ? (
                    <div className="p-6 text-center text-xs text-[#8C837A] border border-dashed border-[#E8E2D9] rounded-xl">
                      Žiadne naplánované ošetrenia v tomto kvartáli. Pridajte zákrok vyššie.
                    </div>
                  ) : (
                    season.items.map((item: any) => {
                      const isBooked = bookedTreatments[item.id];
                      const isExt = Boolean(item.isExternal);
                      return (
                        <div 
                          key={item.id} 
                          onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setProcedureContextMenu({
                              isOpen: true,
                              x: e.clientX,
                              y: e.clientY,
                              treatment: item,
                              quarterKey: season.key
                            });
                          }}
                          className={`p-4 rounded-xl border transition-all group relative cursor-pointer ${
                            isExt 
                              ? 'bg-stone-100/90 border-stone-300 hover:border-stone-400' 
                              : 'bg-[#FAF7F2] border-[#E8E2D9] hover:border-[#C5A059]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mb-1 ${
                                isExt 
                                  ? 'bg-stone-600 text-stone-100' 
                                  : 'bg-[#2C2A29] text-[#E8C882]'
                              }`}>
                                {isExt ? '🌐 Mimo ponuky SAY CLINIC • ' : ''}{item.seasonOrMonth} • {item.targetArea}
                              </span>
                              <h5 className="font-serif font-bold text-sm text-[#2C2A29]">
                                {item.name}
                              </h5>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="text-right">
                                <span className={`text-base font-serif font-bold block ${isExt ? 'text-stone-600' : 'text-[#8C6D2D]'}`}>
                                  {isExt ? `~${(item as any).price ?? (item as any).estimatedPrice ?? 0} €` : `${(item as any).price ?? (item as any).estimatedPrice ?? 0} €`}
                                </span>
                                <span className="text-[10px] text-[#8C837A] block">
                                  {isExt ? 'odhadom mimo kliniky' : `Rekonvalescencia: ${(item as any).downtime || (item as any).recovery || 'Bez obmedzenia'}`}
                                </span>
                              </div>

                              {/* Tlačidlo možností procedúry */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setProcedureContextMenu({
                                    isOpen: true,
                                    x: rect.left - 200,
                                    y: rect.bottom + 4,
                                    treatment: item,
                                    quarterKey: season.key
                                  });
                                }}
                                className="p-1.5 rounded-lg text-[#8C837A] hover:text-[#2C2A29] hover:bg-black/5 transition-colors opacity-70 group-hover:opacity-100 cursor-pointer"
                                title="Možnosti zákroku (alebo kliknite pravým tlačidlom)"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>

                              {onUpdateReport && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveProcedureFromQuarter(season.key, item.id)}
                                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Odstrániť procedúru z kvartálu"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-[#5A524C] mt-2 leading-relaxed">
                            {item.reasoning}
                          </p>

                          {isExt && item.externalProviderNote && (
                            <p className="text-[10px] text-stone-600 italic bg-white/80 p-1.5 rounded-md border border-stone-200 mt-2">
                              ℹ️ {item.externalProviderNote}
                            </p>
                          )}

                          <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-[#E8E2D9]">
                            <span className="text-[11px] font-medium text-[#6B635B]">
                              Počet sedení: <strong>{item.sessionsCount}x</strong>
                              {item.intervalWeeks ? ` (interval ${item.intervalWeeks} týž.)` : ''}
                            </span>

                            {isExt ? (
                              <span className="text-[10px] font-semibold text-stone-600 bg-stone-200/80 px-2.5 py-1 rounded-md border border-stone-300">
                                🌐 Mimo pokladne & kalendára SAY CLINIC
                              </span>
                            ) : (
                              onScheduleTreatment && (
                                <button
                                  type="button"
                                  onClick={() => handleScheduleItem(item)}
                                  disabled={isBooked}
                                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                    isBooked
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : 'bg-[#2C2A29] hover:bg-[#3A3836] text-white'
                                  }`}
                                >
                                  {isBooked ? (
                                    <>
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Zapísané v kalendári</span>
                                    </>
                                  ) : (
                                    <>
                                      <CalendarPlus className="w-3.5 h-3.5 text-[#C5A059]" />
                                      <span>Objednať do kalendára</span>
                                    </>
                                  )}
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================================== */}
      {/* MODÁLNE OKNO PRE REPREZENTATÍVNU A4 TLAČ / PDF EXPORT */}
      {/* ===================================================================================== */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FAF7F2] rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border-2 border-[#C5A059] shadow-2xl">
            
            {/* HORNÁ LIŠTA MODÁLU */}
            <div className="bg-[#2C2A29] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <Printer className="w-5 h-5 text-[#C5A059]" />
                <div>
                  <h3 className="font-serif font-bold text-base">
                    Náhľad A4 protokolu pleti pre pacienta ({report.patientName})
                  </h3>
                  <p className="text-[11px] text-[#E8E2D9]">
                    1. Stav pleti • 2. Domáca Skincare ({selectedTier === 'expert' ? 'Clinical Optimum' : selectedTier === 'advanced' ? 'Advanced' : selectedTier === 'mid_end' ? 'Essential' : 'Premium'}) • 3. Ročný plán procedúr na pleť
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-white/20"
                >
                  <Printer className="w-4 h-4 text-[#C5A059]" />
                  <span>Vytlačiť (A4)</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={generatingPdf}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#8C6D2D] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>{generatingPdf ? 'Generujem PDF...' : 'Stiahnuť PDF'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPdfModal(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* OBSAH DOKUMENTU */}
            <div className="p-6 overflow-y-auto flex-1 bg-stone-200">
              <div ref={pdfReportRef} className="shadow-xl mx-auto">
                <MeicetReportPdfDocument
                  report={{
                    ...report,
                    skincareRoutine: {
                      ...report.skincareRoutine,
                      selectedTier,
                      morning: currentMorning,
                      evening: currentEvening,
                      weeklyCare: currentWeeklyCare
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      {/* KONTEXTOVÉ MENU A MODALY PRE SKINCARE PRODUKTY */}
      <MeicetProductContextMenu
        isOpen={productContextMenu.isOpen}
        x={productContextMenu.x}
        y={productContextMenu.y}
        product={productContextMenu.product}
        routineType={productContextMenu.routineType}
        onClose={() => setProductContextMenu(prev => ({ ...prev, isOpen: false }))}
        onSwapProduct={() => {
          setProductSwapModal({
            isOpen: true,
            product: productContextMenu.product,
            routineType: productContextMenu.routineType
          });
        }}
        onEditTitration={() => {
          setTitrationEditModal({
            isOpen: true,
            product: productContextMenu.product,
            routineType: productContextMenu.routineType
          });
        }}
        onToggleAlreadyOwned={() => {
          if (productContextMenu.product) {
            handleToggleProductAlreadyOwned(productContextMenu.product, productContextMenu.routineType);
          }
        }}
        onRemoveProduct={() => {
          if (productContextMenu.product) {
            handleRemoveSkincareProduct(productContextMenu.product, productContextMenu.routineType);
          }
        }}
      />

      <MeicetProductSwapModal
        isOpen={productSwapModal.isOpen}
        onClose={() => setProductSwapModal(prev => ({ ...prev, isOpen: false }))}
        currentProduct={productSwapModal.product}
        routineType={productSwapModal.routineType}
        onSelectAlternative={(newProduct) => {
          handleSwapSkincareProduct(newProduct, productSwapModal.routineType);
        }}
      />

      <MeicetTitrationEditModal
        isOpen={titrationEditModal.isOpen}
        onClose={() => setTitrationEditModal(prev => ({ ...prev, isOpen: false }))}
        product={titrationEditModal.product}
        onSave={(newFreq, newTitr) => {
          if (titrationEditModal.product) {
            handleSaveProductTitration(titrationEditModal.product, titrationEditModal.routineType, newFreq, newTitr);
          }
        }}
      />

      {/* KONTEXTOVÉ MENU A MODALY PRE PROCEDÚRY */}
      <MeicetProcedureContextMenu
        isOpen={procedureContextMenu.isOpen}
        x={procedureContextMenu.x}
        y={procedureContextMenu.y}
        treatment={procedureContextMenu.treatment}
        currentQuarterKey={procedureContextMenu.quarterKey}
        onClose={() => setProcedureContextMenu(prev => ({ ...prev, isOpen: false }))}
        onSwapProcedure={() => {
          setProcedureSwapModal({
            isOpen: true,
            treatment: procedureContextMenu.treatment,
            quarterKey: procedureContextMenu.quarterKey
          });
        }}
        onMoveQuarter={(targetQuarter) => {
          if (procedureContextMenu.treatment) {
            handleMoveProcedureQuarter(procedureContextMenu.treatment, procedureContextMenu.quarterKey, targetQuarter);
          }
        }}
        onChangePriority={(priority) => {
          if (procedureContextMenu.treatment) {
            handleChangeProcedurePriority(procedureContextMenu.treatment, procedureContextMenu.quarterKey, priority);
          }
        }}
        onToggleExternal={() => {
          if (procedureContextMenu.treatment) {
            handleToggleProcedureExternal(procedureContextMenu.treatment, procedureContextMenu.quarterKey);
          }
        }}
        onRemoveProcedure={() => {
          if (procedureContextMenu.treatment) {
            handleRemoveProcedureFromQuarter(procedureContextMenu.quarterKey, procedureContextMenu.treatment.id);
          }
        }}
      />

      <MeicetProcedureSwapModal
        isOpen={procedureSwapModal.isOpen}
        onClose={() => setProcedureSwapModal(prev => ({ ...prev, isOpen: false }))}
        currentTreatment={procedureSwapModal.treatment}
        quarterLabel={
          procedureSwapModal.quarterKey === 'q1_spring' ? '🌸 Q1: Jar' :
          procedureSwapModal.quarterKey === 'q2_summer' ? '☀️ Q2: Leto' :
          procedureSwapModal.quarterKey === 'q3_autumn' ? '🍂 Q3: Jeseň' : '❄️ Q4: Zima'
        }
        onSelectAlternative={(newProc) => {
          handleSwapProcedureItem(newProc, procedureSwapModal.quarterKey);
        }}
      />

      {/* Skrytý A4 DOM kontajner pre spoľahlivé generovanie Base64 PDF na Google Drive */}
      <div style={{ position: 'fixed', left: -9999, top: 0, width: '210mm', opacity: 0, pointerEvents: 'none' }} aria-hidden="true">
        <div ref={hiddenPdfRef} className="bg-white p-2">
          <MeicetReportPdfDocument
            report={{
              ...report,
              skincareRoutine: {
                ...report.skincareRoutine,
                selectedTier,
                morning: currentMorning,
                evening: currentEvening,
                weeklyCare: currentWeeklyCare
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
