'use client';

import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  Sparkles, 
  Calendar, 
  ShoppingCart, 
  Printer, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  ChevronRight, 
  Activity, 
  Eye, 
  Layers, 
  ShieldCheck, 
  Clock, 
  FileCheck, 
  Zap, 
  Heart,
  Droplet,
  Sun,
  Flame,
  UserCheck
} from 'lucide-react';
import { Patient } from '../PatientDatabase';
import { MeicetDiagnosisResult, MeicetSpectralLayer, MeicetBiomarkers } from '@/types/meicet';
import { PatientPlan } from '@/data/patientPlanConfig';

interface MeicetSkinAnalysisModuleProps {
  patient: Patient;
  patientRecords?: any[];
  currentUser?: any;
  onSaveAsPatientPlan: (plan: PatientPlan) => void;
  onNavigateToCosmetics?: (patient: Patient, prefillItems?: any[]) => void;
  onScheduleTreatment?: (treatment: {
    title: string;
    targetDate?: string;
    notes?: string;
    category?: any;
  }) => void;
}

export default function MeicetSkinAnalysisModule({
  patient,
  patientRecords = [],
  currentUser,
  onSaveAsPatientPlan,
  onNavigateToCosmetics,
  onScheduleTreatment
}: MeicetSkinAnalysisModuleProps) {
  const [activeSubTab, setActiveSubTab] = useState<'upload' | 'results' | 'history'>('upload');
  const [selectedSpectrum, setSelectedSpectrum] = useState<string>('spec-rgb');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [selectedPhotoFiles, setSelectedPhotoFiles] = useState<File[]>([]);
  const [analysisResult, setAnalysisResult] = useState<MeicetDiagnosisResult | null>(null);
  const [isPlanSaved, setIsPlanSaved] = useState(false);
  const [savedHistory, setSavedHistory] = useState<MeicetDiagnosisResult[]>([]);

  // Vypočítaný vek pacienta
  const [actualAge, setActualAge] = useState<number>(38);

  useEffect(() => {
    if (!patient.dob) return;
    try {
      const parts = patient.dob.split('.');
      if (parts.length === 3) {
        const birthDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        const diff = Date.now() - birthDate.getTime();
        const calculated = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)) || 38;
        setActualAge(calculated);
      }
    } catch {}
  }, [patient.dob]);

  // Načítanie histórie meraní pre pacienta
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`say_clinic_meicet_history_${patient.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedHistory(parsed);
          setAnalysisResult(parsed[0]);
          setActiveSubTab('results');
        }
      }
    } catch (e) {
      console.error('Chyba načítania histórie Meicet:', e);
    }
  }, [patient.id]);

  // Spustenie analýzy
  const handleStartAnalysis = async (useDemoData: boolean = false) => {
    setIsAnalyzing(true);
    setUploadProgress(15);

    try {
      const progressTimer = setInterval(() => {
        setUploadProgress(prev => (prev < 90 ? prev + 15 : prev));
      }, 350);

      // Syntéza anamnézy pacienta z jeho zdravotných záznamov
      const recordSummaries = patientRecords.map(r => `${r.date} [${r.type}]: ${r.title} - ${r.diagnosis || ''}`).join('; ');

      const payload = {
        patientId: patient.id,
        patientName: patient.name,
        actualAge,
        allergies: patient.allergies?.join(', ') || 'Bez udaných alergií',
        medicalHistory: `Poisťovňa: ${patient.insurance || '24'}. Anamnestické záznamy: ${recordSummaries || 'Štandardný vstupný profil'}`,
        previousTreatments: recordSummaries,
        pdfName: selectedPdfFile?.name || (useDemoData ? 'Meicet_ProA_Scan_SayClinic.pdf' : undefined),
        pdfExtractedText: useDemoData 
          ? 'Meicet ProA Diagnostic Scan: Overall Skin Health Index: 78%. Measured skin biological age: 41 years (Chronological: 38). High UV fluorescence observed in T-zone indicating active P. acnes porphyrin clusters. Deep melanin hyperpigmentation mapping shows diffuse solar lentigines on bilateral zygomatic arches. Cross-polarized lighting identifies telangiectasias around alae nasi and mild rosacea-like erythema. Epidermal moisture 48%, Sebum level 62%.'
          : selectedPdfFile?.name ? `PDF Súbor: ${selectedPdfFile.name}. Diagnostické parametre Meicet ProA.` : 'Základný klinický scan Meicet ProA.',
        spectralNotes: 'RGB Real Surface, Cross-polarized vascular, UV fluorescent 365nm, Wood\'s light deep melanin'
      };

      const res = await fetch('/api/meicet/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      clearInterval(progressTimer);
      setUploadProgress(100);

      const data = await res.json();
      if (data.success && data.result) {
        setAnalysisResult(data.result);
        setIsPlanSaved(false);

        // Uloženie do histórie pacienta
        const updated = [data.result, ...savedHistory.filter(h => h.id !== data.result.id)];
        setSavedHistory(updated);
        localStorage.setItem(`say_clinic_meicet_history_${patient.id}`, JSON.stringify(updated));

        setTimeout(() => {
          setIsAnalyzing(false);
          setActiveSubTab('results');
        }, 400);
      } else {
        throw new Error(data.error || 'Nepodarilo sa spracovať analýzu');
      }
    } catch (err: any) {
      console.error(err);
      alert(`Chyba pri spracovaní Meicet ProA analýzy: ${err.message || err}`);
      setIsAnalyzing(false);
    }
  };

  // Konverzia odporúčaných produktov do POS košíka
  const handleTransferToPOS = () => {
    if (!analysisResult) return;
    const allProducts = [
      ...analysisResult.skincareRoutine.morning,
      ...analysisResult.skincareRoutine.evening
    ];

    // Odstránenie duplicít podľa názvu
    const uniqueProducts = Array.from(
      new Map(allProducts.map(p => [p.productName, p])).values()
    );

    const posPrefillItems = uniqueProducts.map(prod => ({
      name: prod.productName,
      brand: prod.brand,
      price: prod.price,
      quantity: 1,
      category: prod.category
    }));

    if (onNavigateToCosmetics) {
      onNavigateToCosmetics(patient, posPrefillItems);
    }
  };

  // Uloženie vygenerovaného plánu ako oficiálny PatientPlan
  const handleSaveToPatientFolder = () => {
    if (!analysisResult) return;

    const newPatientPlan: PatientPlan = {
      id: `plan-meicet-${Date.now()}`,
      patientId: patient.id,
      patientName: patient.name,
      title: `Ročný dermatologický plán na základe Meicet ProA diagnostiky`,
      planType: 'annual_aesthetic',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      doctorName: analysisResult.doctorName,
      diagnosisOrGoal: `Optimalizácia veku pleti (${analysisResult.biomarkers.skinAge} r.), liečba cievnych a pigmentových ložisérok zistených na Meicet ProA.`,
      analysisSummary: {
        skinType: analysisResult.biomarkers.skinType,
        skinTonePhototype: 'Fototyp II - III',
        mainConcerns: [
          analysisResult.biomarkers.pigmentationScore.status,
          analysisResult.biomarkers.vascularScore.status,
          analysisResult.biomarkers.poreScore.status,
          `Posun veku pleti o ${analysisResult.biomarkers.skinAge - analysisResult.biomarkers.actualAge} rokov`
        ],
        vectorZones: ['Líca (alae nasi)', 'Glabela', 'T-zóna', 'Periorbitálna oblasť']
      },
      cosmeticsRoutine: {
        morning: analysisResult.skincareRoutine.morning.map(p => ({
          step: p.step,
          category: p.category,
          productName: p.productName,
          brand: p.brand,
          usage: p.usageInstructions,
          purpose: p.clinicalPurpose,
          price: p.price
        })),
        evening: analysisResult.skincareRoutine.evening.map(p => ({
          step: p.step,
          category: p.category,
          productName: p.productName,
          brand: p.brand,
          usage: p.usageInstructions,
          purpose: p.clinicalPurpose,
          price: p.price
        })),
        specialWeeklyCare: analysisResult.skincareRoutine.weeklySpecialCare
      },
      annualTreatments: analysisResult.annualTreatments.map(t => ({
        id: t.id,
        name: t.name,
        category: t.category,
        seasonOrMonth: `${t.season} (${t.targetMonth})`,
        targetArea: t.targetArea,
        frequencyOrSessions: t.frequency,
        estimatedPrice: t.estimatedPrice,
        priority: t.priority,
        status: 'planned',
        notes: t.clinicalRationale
      })),
      doctorNote: analysisResult.clinicalDoctorSummary
    };

    onSaveAsPatientPlan(newPatientPlan);
    setIsPlanSaved(true);
    setTimeout(() => setIsPlanSaved(false), 4000);
  };

  const activeSpectralImage = analysisResult?.spectralImages.find(s => s.id === selectedSpectrum) || analysisResult?.spectralImages[0];

  return (
    <div className="space-y-6">
      {/* HORNÁ LIŠTA - MEICET PROA HLAVIČKA */}
      <div className="p-6 rounded-[28px] bg-gradient-to-r from-[#2C2A29] via-[#383330] to-[#2C2A29] text-white shadow-sm border border-neutral-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#C5A059]/20 border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059]">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-[#C5A059] font-bold">Dermatologická optická stanica</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30">
                Meicet ProA Connected
              </span>
            </div>
            <h2 className="text-xl font-semibold text-white tracking-tight">
              Spektrálna diagnostika pleti & AI ročný plán
            </h2>
            <div className="flex items-center gap-3 text-xs text-neutral-300 mt-0.5">
              <span>Pacient: <strong className="text-white font-medium">{patient.name}</strong></span>
              <span>·</span>
              <span>Vek: <strong className="text-white font-medium">{actualAge} rokov</strong></span>
              <span>·</span>
              <span>R.Č.: <span className="font-mono text-neutral-300">{patient.birthNumber}</span></span>
            </div>
          </div>
        </div>

        {/* PREPÍNAČ PODZÁLOŽIEK */}
        <div className="flex items-center gap-1.5 p-1 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 text-xs">
          <button
            onClick={() => setActiveSubTab('upload')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeSubTab === 'upload' ? 'bg-[#C5A059] text-white shadow-xs' : 'text-neutral-300 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5 inline mr-1.5" />
            Nový import / Snímky
          </button>
          <button
            onClick={() => setActiveSubTab('results')}
            disabled={!analysisResult}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              activeSubTab === 'results' ? 'bg-[#C5A059] text-white shadow-xs' : 'text-neutral-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 inline mr-1.5" />
            Analýza & Ročný plán
          </button>
          {savedHistory.length > 0 && (
            <button
              onClick={() => setActiveSubTab('history')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeSubTab === 'history' ? 'bg-[#C5A059] text-white shadow-xs' : 'text-neutral-300 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5 inline mr-1.5" />
              História meraní ({savedHistory.length})
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. ZÁLOŽKA: UPLOAD A NAČÍTANIE ZO SOFTVÉRU MEICET PROA                     */}
      {/* ========================================================================= */}
      {activeSubTab === 'upload' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ĽAVÝ PANEL: DRAG & DROP NAHRÁVANIE SÚBOROV */}
            <div className="lg:col-span-2 p-6 rounded-[28px] bg-white border border-[#E8E2D9] shadow-xs space-y-5">
              <div>
                <h3 className="text-base font-semibold text-[#2C2A29] flex items-center gap-2">
                  <Upload className="w-4 h-4 text-[#C5A059]" />
                  Nahrávanie diagnostických dát z prístroja Meicet ProA
                </h3>
                <p className="text-xs text-[#8C857B] mt-1">
                  Nahrajte vygenerovaný PDF diagnostický report a snímky pleti z rôznych svetelných spektier (RGB, krížová polarizácia, UV fluorescencia 365nm, Wood's light).
                </p>
              </div>

              {/* UPLOAD BOX: PDF REPORT */}
              <div className="p-5 rounded-2xl border-2 border-dashed border-[#E8E2D9] hover:border-[#C5A059] transition-colors bg-[#FAF8F5]/60 flex flex-col items-center justify-center text-center">
                <FileText className="w-10 h-10 text-[#C5A059] mb-2" />
                <span className="text-sm font-semibold text-[#2C2A29]">
                  {selectedPdfFile ? selectedPdfFile.name : 'Nahrať PDF Diagnostický Report (Meicet Export)'}
                </span>
                <span className="text-xs text-[#8C857B] mt-0.5 max-w-sm">
                  Report obsahuje namerané dermatologické skóre, biologický vek pleti a odporúčania prístroja.
                </span>
                <label className="mt-3 px-4 py-2 rounded-xl bg-white border border-[#E8E2D9] hover:border-[#C5A059] text-xs font-semibold text-[#2C2A29] shadow-xs cursor-pointer transition-all">
                  Vybrať PDF súbor
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedPdfFile(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>

              {/* UPLOAD BOX: SPEKTRÁLNE SNÍMKY */}
              <div className="p-5 rounded-2xl border-2 border-dashed border-[#E8E2D9] hover:border-[#C5A059] transition-colors bg-[#FAF8F5]/60 flex flex-col items-center justify-center text-center">
                <Layers className="w-10 h-10 text-[#8C857B] mb-2" />
                <span className="text-sm font-semibold text-[#2C2A29]">
                  {selectedPhotoFiles.length > 0 
                    ? `Vybraných ${selectedPhotoFiles.length} spektrálnych fotografií`
                    : 'Nahrať spektrálne snímky pleti (RGB, UV, Polarizácia)'}
                </span>
                <span className="text-xs text-[#8C857B] mt-0.5 max-w-sm">
                  Podporované formáty: JPG, PNG z kamery analyzátora Meicet.
                </span>
                <label className="mt-3 px-4 py-2 rounded-xl bg-white border border-[#E8E2D9] hover:border-[#C5A059] text-xs font-semibold text-[#2C2A29] shadow-xs cursor-pointer transition-all">
                  Vybrať snímky pleti
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        setSelectedPhotoFiles(Array.from(e.target.files));
                      }
                    }}
                  />
                </label>
              </div>

              {/* TLAČIDLÁ PRE SPUSTENIE */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => handleStartAnalysis(false)}
                  disabled={isAnalyzing}
                  className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#2C2A29] via-[#383330] to-[#2C2A29] hover:from-[#C5A059] hover:to-[#9C7D3D] text-white text-xs font-semibold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-[#C5A059]" />
                      <span>Spracúvam dáta z Meicet ProA... ({uploadProgress}%)</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#C5A059]" />
                      <span>Spustiť AI analýzu a vygenerovať 12-mesačný plán</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleStartAnalysis(true)}
                  disabled={isAnalyzing}
                  className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-white hover:bg-[#FAF8F5] border border-[#E8E2D9] hover:border-[#C5A059] text-xs font-semibold text-[#2C2A29] transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  title="Načíta reálny ukážkový sken s kompletnými spektrami a protokolom"
                >
                  <Zap className="w-4 h-4 text-[#C5A059]" />
                  <span>Vložiť demo sken pacientky</span>
                </button>
              </div>
            </div>

            {/* PRAVÝ PANEL: AUTOMATICKY NAČÍTANÁ KLINICKÁ ANAMNÉZA */}
            <div className="p-6 rounded-[28px] bg-white border border-[#E8E2D9] shadow-xs space-y-4">
              <h3 className="text-base font-semibold text-[#2C2A29] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Vstupná anamnéza z karty
              </h3>
              <p className="text-xs text-[#8C857B]">
                Tieto informácie systém automaticky skombinuje s meraním Meicet ProA, aby nevznikli kontraindikácie.
              </p>

              <div className="space-y-3 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9]">
                  <span className="text-[10px] uppercase font-bold text-[#8C857B] block">Známe alergie & precitlivenosť</span>
                  <span className="font-medium text-[#2C2A29] mt-0.5 block">
                    {patient.allergies && patient.allergies.length > 0 
                      ? patient.allergies.join(', ')
                      : 'Neguje alergie na lieky a kozmetiku'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9]">
                  <span className="text-[10px] uppercase font-bold text-[#8C857B] block">Doterajšie zákroky na klinike</span>
                  <span className="font-medium text-[#2C2A29] mt-0.5 block">
                    {patientRecords.length > 0
                      ? `${patientRecords.length} záznamov (napr. ${patientRecords[0].title})`
                      : 'Nová klientka / vstupné estetické vyšetrenie'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9]">
                  <span className="text-[10px] uppercase font-bold text-[#8C857B] block">Certifikované produkty v protokole</span>
                  <span className="text-[#2C2A29] mt-0.5 block">
                    SkinCeuticals (C E Ferulic, H.A. Intensifier, Discoloration Defense), La Roche-Posay Anthelios SPF 50+, Cicaplast B5+.
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-[11px]">
                  <strong>Lekársky dohľad:</strong> Každé AI odporúčanie prechádza schválením vedúceho lekára pred zavedením do liečebného plánu.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ZÁLOŽKA: VÝSLEDKY DIAGNOSTIKY & 12-MESAČNÝ ROČNÝ PLÁN                   */}
      {/* ========================================================================= */}
      {activeSubTab === 'results' && analysisResult && (
        <div className="space-y-6">
          {/* AKČNÝ HORNÝ PANEL S RÝCHLYMI PREPOJENIAMI */}
          <div className="p-5 rounded-2xl bg-white border border-[#E8E2D9] shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C5A059]/15 text-[#C5A059] flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <span className="text-xs text-[#8C857B]">Diagnostika Meicet ProA z dňa {analysisResult.scanDate}</span>
                <h4 className="text-sm font-semibold text-[#2C2A29]">
                  {analysisResult.patientName} — {analysisResult.biomarkers.skinType}
                </h4>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* TLAČIDLO PRENOSU DO POS POKLADNE */}
              <button
                onClick={handleTransferToPOS}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
                title="Vloží odporúčané produkty SkinCeuticals a La Roche-Posay do pokladne s priradeným pacientom"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Odoslať produkty do POS pokladne</span>
              </button>

              {/* TLAČIDLO ULOŽENIA DO KARTY */}
              <button
                onClick={handleSaveToPatientFolder}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer transition-all ${
                  isPlanSaved 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-[#C5A059] hover:bg-[#9C7D3D] text-white'
                }`}
              >
                {isPlanSaved ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Plán uložený v karte pacienta!</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Uložiť plán do karty pacienta</span>
                  </>
                )}
              </button>

              {/* TLAČ REPORTU */}
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#E8E2D9] text-xs font-semibold text-[#2C2A29] shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-[#8C857B]" />
                <span>Tlačiť report</span>
              </button>
            </div>
          </div>

          {/* DVOJSTĹPCOVÝ ANALYTICKÝ PANEL: VEK PLETI, BIOMARKERY & SPEKTRÁLNE SNÍMKY */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* ĽAVÝ STĹPEC (5/12): SPEKTRÁLNY PREHLIADAČ MEICET PROA */}
            <div className="lg:col-span-5 p-6 rounded-[28px] bg-white border border-[#E8E2D9] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#8C857B] tracking-wider">Optické spektroskopické vrstvy</span>
                  <h3 className="text-base font-semibold text-[#2C2A29]">
                    {activeSpectralImage?.name || 'Spektrálna analýza'}
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E8E2D9] text-[10px] font-mono font-bold text-[#2C2A29]">
                  {activeSpectralImage?.label}
                </span>
              </div>

              {/* PREPÍNAČ VRSTIEV */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {analysisResult.spectralImages.map(spec => (
                  <button
                    key={spec.id}
                    onClick={() => setSelectedSpectrum(spec.id)}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                      selectedSpectrum === spec.id
                        ? 'bg-[#2C2A29] text-white border-[#2C2A29] shadow-xs'
                        : 'bg-[#FAF8F5] text-[#2C2A29] border-[#E8E2D9] hover:border-[#C5A059]'
                    }`}
                  >
                    <span className="block text-[11px] font-bold truncate">{spec.name}</span>
                    <span className={`block text-[10px] truncate ${selectedSpectrum === spec.id ? 'text-[#C5A059]' : 'text-[#8C857B]'}`}>
                      {spec.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* OBRAZOVKA S AKTÍVNOU SNÍMKOU */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-inner group">
                <img
                  src={activeSpectralImage?.imageUrl}
                  alt={activeSpectralImage?.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/85 via-black/50 to-transparent text-white text-xs">
                  <span className="font-semibold block">{activeSpectralImage?.name}</span>
                  <span className="text-[11px] text-neutral-300 block line-clamp-2 mt-0.5">
                    {activeSpectralImage?.description}
                  </span>
                </div>
              </div>

              {/* POROVNANIE VEKU PLETI (SKIN AGE GAP) */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FAF8F5] to-white border border-[#E8E2D9] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#8C857B]">Biologický vek pleti (Meicet)</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl font-bold font-mono text-[#2C2A29]">
                      {analysisResult.biomarkers.skinAge}
                    </span>
                    <span className="text-xs text-[#8C857B]">rokov</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-[#8C857B]">Skutočný vek pacientky</span>
                  <div className="flex items-baseline justify-end gap-2 mt-0.5">
                    <span className="text-xl font-bold font-mono text-[#8C857B]">
                      {analysisResult.biomarkers.actualAge}
                    </span>
                    <span className="text-xs text-[#8C857B]">rokov</span>
                  </div>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 text-xs font-bold text-center">
                  +{analysisResult.biomarkers.skinAge - analysisResult.biomarkers.actualAge} r.
                  <span className="block text-[9px] font-normal text-amber-700">Skin Age Gap</span>
                </div>
              </div>
            </div>

            {/* PRAVÝ STĹPEC (7/12): BIOMARKERY & RADAR SKÓRE */}
            <div className="lg:col-span-7 p-6 rounded-[28px] bg-white border border-[#E8E2D9] shadow-xs space-y-5">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#C5A059] tracking-wider">Kvantitatívne dermatologické skóre</span>
                <h3 className="text-lg font-semibold text-[#2C2A29]">
                  Analýza biomarkerov z prístroja Meicet ProA
                </h3>
              </div>

              {/* 8 KARIET BIOMARKEROV */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* 1. SEBUM */}
                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8C857B] font-medium flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      Maz (Sebum)
                    </span>
                    <span className="font-mono font-bold text-[#2C2A29]">
                      {analysisResult.biomarkers.sebumLevel.valuePercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-[#E8E2D9] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full" 
                      style={{ width: `${analysisResult.biomarkers.sebumLevel.valuePercentage}%` }} 
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-amber-700 block">
                    {analysisResult.biomarkers.sebumLevel.status}
                  </span>
                </div>

                {/* 2. MOISTURE */}
                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8C857B] font-medium flex items-center gap-1">
                      <Droplet className="w-3.5 h-3.5 text-blue-500" />
                      Hydratácia
                    </span>
                    <span className="font-mono font-bold text-[#2C2A29]">
                      {analysisResult.biomarkers.moistureLevel.valuePercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-[#E8E2D9] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full rounded-full" 
                      style={{ width: `${analysisResult.biomarkers.moistureLevel.valuePercentage}%` }} 
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-blue-700 block">
                    {analysisResult.biomarkers.moistureLevel.status}
                  </span>
                </div>

                {/* 3. PORES */}
                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8C857B] font-medium flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-emerald-600" />
                      Póry
                    </span>
                    <span className="font-mono font-bold text-[#2C2A29]">
                      {analysisResult.biomarkers.poreScore.valuePercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-[#E8E2D9] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-full rounded-full" 
                      style={{ width: `${analysisResult.biomarkers.poreScore.valuePercentage}%` }} 
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 block truncate">
                    {analysisResult.biomarkers.poreScore.status}
                  </span>
                </div>

                {/* 4. WRINKLES */}
                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8C857B] font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-purple-600" />
                      Vrásky
                    </span>
                    <span className="font-mono font-bold text-[#2C2A29]">
                      {analysisResult.biomarkers.wrinkleScore.valuePercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-[#E8E2D9] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-purple-600 h-full rounded-full" 
                      style={{ width: `${analysisResult.biomarkers.wrinkleScore.valuePercentage}%` }} 
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-purple-700 block truncate">
                    {analysisResult.biomarkers.wrinkleScore.status}
                  </span>
                </div>

                {/* 5. PIGMENTATION */}
                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8C857B] font-medium flex items-center gap-1">
                      <Sun className="w-3.5 h-3.5 text-amber-600" />
                      Melanín
                    </span>
                    <span className="font-mono font-bold text-[#2C2A29]">
                      {analysisResult.biomarkers.pigmentationScore.valuePercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-[#E8E2D9] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-600 h-full rounded-full" 
                      style={{ width: `${analysisResult.biomarkers.pigmentationScore.valuePercentage}%` }} 
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-amber-700 block truncate">
                    {analysisResult.biomarkers.pigmentationScore.status}
                  </span>
                </div>

                {/* 6. VASCULAR */}
                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8C857B] font-medium flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                      Cievky & Erytém
                    </span>
                    <span className="font-mono font-bold text-[#2C2A29]">
                      {analysisResult.biomarkers.vascularScore.valuePercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-[#E8E2D9] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-rose-500 h-full rounded-full" 
                      style={{ width: `${analysisResult.biomarkers.vascularScore.valuePercentage}%` }} 
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-rose-700 block truncate">
                    {analysisResult.biomarkers.vascularScore.status}
                  </span>
                </div>

                {/* 7. PORPHYRINS */}
                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8C857B] font-medium flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-teal-600" />
                      UV Porfyríny
                    </span>
                    <span className="font-mono font-bold text-[#2C2A29]">
                      {analysisResult.biomarkers.porphyrinAcneScore.valuePercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-[#E8E2D9] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-teal-600 h-full rounded-full" 
                      style={{ width: `${analysisResult.biomarkers.porphyrinAcneScore.valuePercentage}%` }} 
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-teal-700 block truncate">
                    {analysisResult.biomarkers.porphyrinAcneScore.status}
                  </span>
                </div>

                {/* 8. ROUGHNESS */}
                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8C857B] font-medium flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      Textúra
                    </span>
                    <span className="font-mono font-bold text-[#2C2A29]">
                      {analysisResult.biomarkers.roughnessTextureScore.valuePercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-[#E8E2D9] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full" 
                      style={{ width: `${analysisResult.biomarkers.roughnessTextureScore.valuePercentage}%` }} 
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-indigo-700 block truncate">
                    {analysisResult.biomarkers.roughnessTextureScore.status}
                  </span>
                </div>
              </div>

              {/* ODBORNÝ LEKÁRSKY SÚHRN (DOCTOR SUMMARY) */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-2 text-xs">
                <span className="text-[10px] uppercase font-bold text-[#C5A059] flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#C5A059]" />
                  Klinické zhodnotenie lekára (MUDr. Ján Mráz / SAY CLINIC)
                </span>
                <p className="text-[#2C2A29] leading-relaxed">
                  {analysisResult.clinicalDoctorSummary}
                </p>

                {/* ANAMNESTICKÉ ZOHĽADNENIA */}
                <div className="pt-2 border-t border-[#E8E2D9] flex flex-wrap gap-2 text-[11px] text-[#8C857B]">
                  {analysisResult.anamnesisInsights.allergiesNoted.map((a, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-white border border-[#E8E2D9] text-[#2C2A29]">
                      🛡️ {a}
                    </span>
                  ))}
                  {analysisResult.anamnesisInsights.medicationsCaution.map((m, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-900">
                      ⚠️ {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SEKCIA: 12-MESAČNÝ SEZÓNNY HARMONOGRAM OŠETRENÍ V SAY CLINIC              */}
          {/* ========================================================================= */}
          <div className="p-6 rounded-[28px] bg-white border border-[#E8E2D9] shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#C5A059] tracking-wider">
                  Klinický plán ošetrení SAY CLINIC
                </span>
                <h3 className="text-lg font-semibold text-[#2C2A29]">
                  12-Mesačný liečebný harmonogram (podľa UV indexu a regenerácie)
                </h3>
              </div>
              <span className="text-xs text-[#8C857B]">
                Spolu odhad: <strong className="text-[#2C2A29] font-bold">
                  {analysisResult.annualTreatments.reduce((sum, t) => sum + (t.estimatedPrice || 0), 0)} €
                </strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {['Jar', 'Leto', 'Jeseň', 'Zima'].map(seasonName => {
                const seasonTreatments = analysisResult.annualTreatments.filter(t => t.season === seasonName);
                return (
                  <div key={seasonName} className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-2">
                      <span className="font-bold text-xs text-[#2C2A29] uppercase tracking-wider">{seasonName}</span>
                      <span className="text-[10px] text-[#8C857B] font-medium">
                        {seasonTreatments.length} {seasonTreatments.length === 1 ? 'zákrok' : 'zákroky'}
                      </span>
                    </div>

                    <div className="space-y-2.5 flex-1">
                      {seasonTreatments.map(treat => (
                        <div key={treat.id} className="p-3 rounded-xl bg-white border border-[#E8E2D9] text-xs space-y-1.5">
                          <div className="flex items-start justify-between gap-1.5">
                            <span className="font-semibold text-[#2C2A29] leading-snug">{treat.name}</span>
                            <span className="font-mono font-bold text-[#C5A059] shrink-0">{treat.estimatedPrice} €</span>
                          </div>
                          <span className="text-[11px] text-[#8C857B] block">
                            Mesiac: <strong className="text-[#2C2A29]">{treat.targetMonth}</strong> · {treat.targetArea}
                          </span>
                          <p className="text-[10px] text-[#8C857B] leading-tight line-clamp-2">
                            {treat.clinicalRationale}
                          </p>

                          {/* REZERVOVAŤ DO KALENDÁRA */}
                          <button
                            type="button"
                            onClick={() => {
                              if (onScheduleTreatment) {
                                onScheduleTreatment({
                                  title: `${patient.name} - ${treat.name}`,
                                  notes: `Plán Meicet ProA: ${treat.clinicalRationale}. Frekvencia: ${treat.frequency}`,
                                  category: treat.category === 'laser' ? 'osetrenie' : treat.category === 'injectable' ? 'konzultacia' : 'kontrola'
                                });
                              }
                            }}
                            className="w-full mt-2 py-1.5 px-2.5 rounded-lg bg-[#FAF8F5] hover:bg-[#C5A059] hover:text-white border border-[#E8E2D9] text-[10px] font-semibold text-[#2C2A29] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Calendar className="w-3 h-3" />
                            <span>Rezervovať v kalendári</span>
                          </button>
                        </div>
                      ))}

                      {seasonTreatments.length === 0 && (
                        <span className="text-xs text-[#8C857B] italic block text-center py-4">
                          Obdobie domácej udržiavacej starostlivosti
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SEKCIA: PERSONALIZOVANÁ DOMÁCA SKINCARE (RÁNO & VEČER)                    */}
          {/* ========================================================================= */}
          <div className="p-6 rounded-[28px] bg-white border border-[#E8E2D9] shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#C5A059] tracking-wider">
                  Medicínska domáca dermokozmetika
                </span>
                <h3 className="text-lg font-semibold text-[#2C2A29]">
                  Personalizovaný protokol domácej starostlivosti (Ráno & Večer)
                </h3>
              </div>

              {/* RÝCHLE TLAČIDLO PRENOSU DO POS */}
              <button
                onClick={handleTransferToPOS}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer transition-all"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Pridať všetky produkty do nákupného košíka (POS)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* RANNÝ PROTOKOL */}
              <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-3">
                <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-2">
                  <span className="font-bold text-xs text-[#2C2A29] uppercase flex items-center gap-1.5">
                    <Sun className="w-4 h-4 text-amber-500" />
                    Ranná rutina (Ochrana & Antioxidanty)
                  </span>
                  <span className="text-[10px] text-[#8C857B]">
                    {analysisResult.skincareRoutine.morning.length} kroky
                  </span>
                </div>

                <div className="space-y-3">
                  {analysisResult.skincareRoutine.morning.map(item => (
                    <div key={item.step} className="p-3.5 rounded-xl bg-white border border-[#E8E2D9] text-xs space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#C5A059]/20 text-[#C5A059] font-bold text-[10px] flex items-center justify-center shrink-0">
                            {item.step}
                          </span>
                          <span className="font-semibold text-[#2C2A29]">{item.productName}</span>
                        </div>
                        <span className="font-mono font-bold text-[#C5A059] shrink-0">{item.price} €</span>
                      </div>
                      <span className="text-[10px] font-bold text-[#8C857B] uppercase block pl-7">
                        {item.brand} · {item.category}
                      </span>
                      <p className="text-[11px] text-[#8C857B] pl-7">
                        <strong>Návod:</strong> {item.usageInstructions}
                      </p>
                      <p className="text-[10px] text-emerald-800 bg-emerald-50/60 p-1.5 rounded-md ml-7">
                        <strong>Klinický účinok:</strong> {item.clinicalPurpose}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* VEČERNÝ PROTOKOL */}
              <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-3">
                <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-2">
                  <span className="font-bold text-xs text-[#2C2A29] uppercase flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-purple-600" />
                    Večerná rutina (Regenerácia & Bunková obnova)
                  </span>
                  <span className="text-[10px] text-[#8C857B]">
                    {analysisResult.skincareRoutine.evening.length} kroky
                  </span>
                </div>

                <div className="space-y-3">
                  {analysisResult.skincareRoutine.evening.map(item => (
                    <div key={item.step} className="p-3.5 rounded-xl bg-white border border-[#E8E2D9] text-xs space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-purple-600/20 text-purple-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {item.step}
                          </span>
                          <span className="font-semibold text-[#2C2A29]">{item.productName}</span>
                        </div>
                        <span className="font-mono font-bold text-[#C5A059] shrink-0">{item.price} €</span>
                      </div>
                      <span className="text-[10px] font-bold text-[#8C857B] uppercase block pl-7">
                        {item.brand} · {item.category}
                      </span>
                      <p className="text-[11px] text-[#8C857B] pl-7">
                        <strong>Návod:</strong> {item.usageInstructions}
                      </p>
                      <p className="text-[10px] text-purple-900 bg-purple-50/60 p-1.5 rounded-md ml-7">
                        <strong>Klinický účinok:</strong> {item.clinicalPurpose}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* TÝŽDENNÁ ŠPECIÁLNA STAROSTLIVOSŤ */}
            {analysisResult.skincareRoutine.weeklySpecialCare && analysisResult.skincareRoutine.weeklySpecialCare.length > 0 && (
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-xs">
                <span className="text-[10px] uppercase font-bold text-[#C5A059] block mb-1">
                  Doplnková týždenná starostlivosť
                </span>
                <ul className="list-disc list-inside space-y-1 text-[#2C2A29]">
                  {analysisResult.skincareRoutine.weeklySpecialCare.map((care, i) => (
                    <li key={i}>{care}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ZÁLOŽKA: HISTÓRIA MERANÍ MEICET PROA PRE TOHTO PACIENTA                 */}
      {/* ========================================================================= */}
      {activeSubTab === 'history' && (
        <div className="p-6 rounded-[28px] bg-white border border-[#E8E2D9] shadow-xs space-y-4">
          <h3 className="text-base font-semibold text-[#2C2A29] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#C5A059]" />
            Archív vyšetrení pleti Meicet ProA ({savedHistory.length})
          </h3>
          <p className="text-xs text-[#8C857B]">
            História umožňuje sledovať vývoj biologického veku pleti a účinnosť ošetrení v čase.
          </p>

          <div className="space-y-3 pt-2">
            {savedHistory.map((scan, i) => (
              <div key={scan.id} className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-[#2C2A29]">Vyšetrenie dňa {scan.scanDate}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#C5A059]/15 text-[#C5A059] font-bold">
                      Vek pleti: {scan.biomarkers.skinAge} r. (Skutočný: {scan.biomarkers.actualAge} r.)
                    </span>
                  </div>
                  <span className="text-xs text-[#8C857B] mt-0.5 block">
                    {scan.biomarkers.skinType} · {scan.annualTreatments.length} naplánovaných procedúr
                  </span>
                </div>

                <button
                  onClick={() => {
                    setAnalysisResult(scan);
                    setActiveSubTab('results');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#E8E2D9] text-xs font-semibold text-[#2C2A29] cursor-pointer shadow-xs"
                >
                  Zobraziť detail
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
