'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  AIHealthRoadmap, 
  RoadmapIntervention, 
  RoadmapMonth, 
  INTERVENTION_META, 
  InterventionType 
} from '@/data/healthRoadmapTypes';
import { 
  Sparkles, 
  Printer, 
  Download,
  CalendarPlus, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  RotateCw, 
  SlidersHorizontal, 
  Sun, 
  Moon, 
  Leaf, 
  Snowflake, 
  CloudSun, 
  Check, 
  Calendar as CalendarIcon,
  FileText,
  Eye,
  X
} from 'lucide-react';
import { CalendarEvent } from '@/data/calendarConfig';
import { generatePdfFilename, exportElementToPdf } from '@/lib/pdfGenerator';
import { AIHealthRoadmapPdfDocument } from './AIHealthRoadmapPdfDocument';

interface AIHealthRoadmapViewProps {
  patient: {
    id: string;
    name: string;
    birthNumber: string;
    dob?: string;
    phone?: string;
    email?: string;
  };
  proceduresHistory?: any[];
  aestheticsHistory?: any[];
  onScheduleEvent?: (event: Partial<CalendarEvent>) => void;
  onNavigateToCalendar?: () => void;
}

const FITZPATRICK_TYPES = [
  { value: 'I', label: 'Typ I – Veľmi svetlá, modré oči, vždy spáli, nikdy neopáli' },
  { value: 'II', label: 'Typ II – Svetlá pleť, svetlé vlasy, zvyčajne spáli, minimálne opáli' },
  { value: 'III', label: 'Typ III – Stredne svetlá/olivová, občas spáli, postupne opáli' },
  { value: 'IV', label: 'Typ IV – Olivová/hnedá, zriedka spáli, ľahko opáli' },
  { value: 'V', label: 'Typ V – Tmavá hnedá, veľmi zriedkavo spáli' },
  { value: 'VI', label: 'Typ VI – Veľmi tmavá, nikdy nespáli' },
];

const SKIN_CONCERN_OPTIONS = [
  'Mimické a dynamické vrásky',
  'Strata elasticity a dermálnej hustoty',
  'Pokles kontúr tváre a nazolabiálne ryhy',
  'Hyperpigmentácie a melasma',
  'Rozšírené cievky a difúzny erytém (rosacea)',
  'Dehydratácia a poškodená kožná bariéra',
  'Rozšírené póry a nerovnomerná textúra',
  'Pooperačné jazvy / jazvičky po akné',
  'Kruhy a ochabnutie očného okolia',
  'Objem a asymetria pier'
];

export default function AIHealthRoadmapView({
  patient,
  proceduresHistory = [],
  aestheticsHistory = [],
  onScheduleEvent,
  onNavigateToCalendar
}: AIHealthRoadmapViewProps) {
  const [roadmap, setRoadmap] = useState<AIHealthRoadmap | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<InterventionType | 'all'>('all');
  const [selectedSeason, setSelectedSeason] = useState<'all' | 'jar' | 'leto' | 'jesen' | 'zima'>('all');
  const [activeTab, setActiveTab] = useState<'timeline' | 'skincare' | 'analysis'>('timeline');
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);
  const [showPdfPreviewModal, setShowPdfPreviewModal] = useState<boolean>(false);
  const pdfDocumentRef = useRef<HTMLDivElement>(null);

  // Form state for fine-tuning
  const [skinType, setSkinType] = useState<string>('zmiešaná');
  const [phototype, setPhototype] = useState<string>('II');
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([
    'Mimické a dynamické vrásky',
    'Strata elasticity a dermálnej hustoty',
    'Dehydratácia a poškodená kožná bariéra'
  ]);
  const [customNotes, setCustomNotes] = useState<string>('');

  // 1. Generovanie nového plánu cez server API (Gemini 3.8 Flash)
  const handleGenerateRoadmap = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const payload = {
        patientId: patient.id,
        patientName: patient.name,
        patientBirthNumber: patient.birthNumber,
        proceduresHistory: proceduresHistory.map(p => {
          if (typeof p === 'string') return p;
          return {
            title: p.title || p.type || 'Zákrok',
            type: p.type || 'Chirurgický/dermatologický zákrok',
            date: p.date,
            doctor: p.doctor || 'MUDr. Ján Mráz',
            diagnosis: p.diagnosis || '',
            notes: p.content || p.notes || ''
          };
        }),
        aestheticsHistory: aestheticsHistory.map(a => {
          if (typeof a === 'string') return a;
          return {
            title: a.title || 'Estetické ošetrenie',
            date: a.date || a.formattedDate,
            doctor: a.doctor || 'MUDr. Ján Mráz',
            protocolNumber: a.protocolNumber || '',
            notes: a.notes || '',
            vectors: Array.isArray(a.vectors)
              ? a.vectors.map((v: any) => ({
                  zone: v.zoneName || 'Zóna tváre',
                  product: v.productName || 'Materiál',
                  lot: v.lotNumber || '',
                  dose: v.details || '',
                  type: v.type
                }))
              : []
          };
        }),
        skinCondition: {
          skinType,
          fitzpatrickPhototype: phototype,
          primaryConcerns: selectedConcerns,
          notes: customNotes
        },
        doctorName: 'MUDr. Ján Mráz'
      };

      const res = await fetch('/api/ai/health-roadmap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.success && data.roadmap) {
        setRoadmap(data.roadmap);
        localStorage.setItem(`say_clinic_health_roadmap_${patient.id}`, JSON.stringify(data.roadmap));
        setShowConfigModal(false);
      } else {
        throw new Error(data.error || 'Generovanie zlyhalo');
      }
    } catch (err: any) {
      console.error('Error generating roadmap:', err);
      setErrorMsg(err.message || 'Nepodarilo sa vygenerovať AI Plán Liečby. Skúste to znova.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Načítanie existujúceho plánu z localStorage alebo automatická inicializácia pri prvom otvorení pacienta
  useEffect(() => {
    if (!patient?.id) return;
    try {
      const stored = localStorage.getItem(`say_clinic_health_roadmap_${patient.id}`);
      if (stored) {
        setRoadmap(JSON.parse(stored));
      } else {
        handleGenerateRoadmap();
      }
    } catch (e) {
      console.error('Failed to load stored roadmap:', e);
    }
  }, [patient?.id]);

  const handleToggleInterventionStatus = (monthIndex: number, interventionId: string) => {
    if (!roadmap) return;

    const updatedMonths = roadmap.months.map(m => {
      if (m.monthIndex !== monthIndex) return m;
      return {
        ...m,
        interventions: m.interventions.map(inv => {
          if (inv.id !== interventionId) return inv;
          const nextStatus: 'planned' | 'completed' = inv.status === 'completed' ? 'planned' : 'completed';
          return { ...inv, status: nextStatus };
        })
      };
    });

    const updatedRoadmap = { ...roadmap, months: updatedMonths, updatedAt: new Date().toISOString() };
    setRoadmap(updatedRoadmap);
    localStorage.setItem(`say_clinic_health_roadmap_${patient.id}`, JSON.stringify(updatedRoadmap));
  };

  const handleScheduleIntervention = (month: RoadmapMonth, inv: RoadmapIntervention) => {
    if (!onScheduleEvent) {
      alert(`Termín pre ${inv.title} bol pripravený. Prejdite do klinického kalendára.`);
      if (onNavigateToCalendar) onNavigateToCalendar();
      return;
    }

    onScheduleEvent({
      patientId: patient.id,
      patientName: patient.name,
      patientBirthNumber: patient.birthNumber,
      title: `${inv.title} (${month.name})`,
      type: inv.type === 'surgical_followup' ? 'kontrola' : 'osetrenie',
      doctorName: 'MUDr. Ján Mráz',
      notes: `AI Health Roadmap: ${inv.description}. Cieľová zóna: ${inv.targetArea}. Priorita: ${inv.priority}.`
    });

    // Označíme ako scheduled
    const updatedMonths = roadmap?.months.map(m => {
      if (m.monthIndex !== month.monthIndex) return m;
      return {
        ...m,
        interventions: m.interventions.map(i => i.id === inv.id ? { ...i, status: 'scheduled' as const } : i)
      };
    });

    if (roadmap && updatedMonths) {
      const updated = { ...roadmap, months: updatedMonths };
      setRoadmap(updated);
      localStorage.setItem(`say_clinic_health_roadmap_${patient.id}`, JSON.stringify(updated));
    }
  };

  const toggleConcern = (concern: string) => {
    if (selectedConcerns.includes(concern)) {
      setSelectedConcerns(selectedConcerns.filter(c => c !== concern));
    } else {
      setSelectedConcerns([...selectedConcerns, concern]);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportToPdf = async () => {
    if (!roadmap) return;
    if (!pdfDocumentRef.current) {
      setErrorMsg('Tlačová šablóna nie je pripravená na export do PDF.');
      return;
    }

    setIsExportingPdf(true);
    setPdfSuccessMessage(null);
    setErrorMsg(null);

    try {
      const todayIso = new Date().toISOString().split('T')[0];
      const filename = generatePdfFilename('Plan_Liecby_12M', patient.name, todayIso);
      await exportElementToPdf(pdfDocumentRef.current, filename, {
        format: 'a4',
        headerTitle: '12-Mesačný Plán Liečby & Starostlivosti',
        patientName: patient.name,
      });
      setPdfSuccessMessage(`Plán liečby bol úspešne vygenerovaný a stiahnutý (${filename}).`);
      setTimeout(() => {
        setPdfSuccessMessage(null);
      }, 6000);
    } catch (err: any) {
      console.error('Chyba pri exporte do PDF:', err);
      setErrorMsg('Nastala chyba pri generovaní PDF dokumentu. Skúste to prosím znova alebo použite systémovú tlač do PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Sezónna ikona
  const getSeasonBadge = (season: 'jar' | 'leto' | 'jesen' | 'zima') => {
    switch (season) {
      case 'jar':
        return <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold"><Leaf className="w-3 h-3" /> Jar</span>;
      case 'leto':
        return <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold"><Sun className="w-3 h-3" /> Leto</span>;
      case 'jesen':
        return <span className="inline-flex items-center gap-1 text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded text-[10px] font-bold"><CloudSun className="w-3 h-3" /> Jeseň</span>;
      case 'zima':
        return <span className="inline-flex items-center gap-1 text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded text-[10px] font-bold"><Snowflake className="w-3 h-3" /> Zima</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. HLAVNÝ HEADER BANNER */}
      <div className="bg-gradient-to-r from-[#2C2A29] via-[#3D3A38] to-[#2C2A29] text-white p-6 rounded-2xl shadow-md border border-[#C5A059]/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-[#C5A059] text-[#2C2A29] text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> GEMINI AI PLÁN LIEČBY
              </span>
              <span className="bg-white/10 text-white/90 text-[10px] font-semibold px-2 py-0.5 rounded">
                12-Mesačný personalizovaný plán liečby a ošetrení
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-bold font-serif tracking-tight text-white flex items-center gap-2">
              <span>{roadmap ? roadmap.title : `AI Plán Liečby 12M • ${patient.name}`}</span>
            </h2>

            <p className="text-xs text-white/80 max-w-2xl leading-relaxed">
              Klinický systém na báze Gemini AI detailne analyzuje históriu pacienta (predchádzajúce operácie, zákroky, lekárske poznámky a estetické mapy s vektormi aplikácie) a generuje 12-mesačný personalizovaný plán ošetrení a domácej starostlivosti rozdelený po mesiacoch.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <button
              onClick={() => setShowConfigModal(true)}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-white/20 cursor-pointer"
              title="Nastaviť parametre pleti, fototyp a primárne ciele"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Parametre analýzy</span>
            </button>

            {roadmap && (
              <>
                <button
                  onClick={handleExportToPdf}
                  disabled={isExportingPdf}
                  className="px-3.5 py-2 bg-[#C5A059] hover:bg-[#B38F46] text-[#2C2A29] font-black hover:text-white rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md border border-[#E8E2D9]/30 disabled:opacity-50 cursor-pointer"
                  title="Stiahnuť čistú, profesionálnu verziu 12-mesačného plánu v PDF formáte"
                >
                  {isExportingPdf ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Generujem PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 text-[#2C2A29]" />
                      <span>Exportovať do PDF</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowPdfPreviewModal(true)}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-white/20 cursor-pointer"
                  title="Otvoriť náhľad dokumentu vhodného na tlač alebo zaslanie pacientovi"
                >
                  <Eye className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Náhľad PDF</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-white/20 cursor-pointer"
                  title="Vytlačiť plán pre pacienta"
                >
                  <Printer className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Tlačiť</span>
                </button>
              </>
            )}

            <button
              onClick={handleGenerateRoadmap}
              disabled={isLoading}
              className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold transition-all border border-white/20 shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Analyzujem pacienta s Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#C5A059]" />
                  <span>{roadmap ? 'Preanalyzovať s Gemini' : 'Vygenerovať AI Plán Liečby'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* METADÁTA O PACIENTOVI V HLAVIČKE */}
        {roadmap && (
          <div className="relative z-10 mt-6 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-white/50 block text-[9px] uppercase font-bold tracking-wider">Analyzované zákroky</span>
              <span className="font-semibold text-white/90">
                {roadmap.patientAnalysis.analyzedProceduresCount} klinických záznamov
              </span>
            </div>
            <div>
              <span className="text-white/50 block text-[9px] uppercase font-bold tracking-wider">Estetická história</span>
              <span className="font-semibold text-white/90">
                {roadmap.patientAnalysis.analyzedAestheticSessionsCount} ošetrení (Botox / Výplne)
              </span>
            </div>
            <div>
              <span className="text-white/50 block text-[9px] uppercase font-bold tracking-wider">Fitzpatrick fototyp</span>
              <span className="font-semibold text-[#C5A059]">
                Fototyp {roadmap.patientAnalysis.fitzpatrickPhototype || 'II'}
              </span>
            </div>
            <div>
              <span className="text-white/50 block text-[9px] uppercase font-bold tracking-wider">Garant protokolu</span>
              <span className="font-semibold text-white/90">{roadmap.doctorName || 'MUDr. Ján Mráz'}</span>
            </div>
          </div>
        )}
      </div>

      {/* SPRÁVY A OZNÁMENIA */}
      {pdfSuccessMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{pdfSuccessMessage}</span>
          </div>
          <button
            onClick={() => setPdfSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-2 py-0.5 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* PRÁZDNY STAV - VÝZVA NA GENEROVANIE */}
      {!roadmap && !isLoading && (
        <div className="bg-white border-2 border-dashed border-[#E8E2D9] rounded-2xl p-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#FAF4E9] text-[#C5A059] flex items-center justify-center mx-auto text-2xl shadow-inner">
            <Sparkles className="w-8 h-8" />
          </div>

          <div className="max-w-lg mx-auto space-y-2">
            <h3 className="text-base font-bold text-[#2C2A29]">
              Pre pacienta sa pripravuje 12-Mesačný AI Plán Liečby
            </h3>
            <p className="text-xs text-[#8C857B] leading-relaxed">
              Kliknutím na tlačidlo nižšie spustíte Gemini AI analýzu. Model automaticky prejde operačné protokoly, poznámky lekára, aplikácie botulotoxínu a estetické mapy výplní a zostaví štruktúrovaný 12-mesačný liečebný harmonogram rozdelený po mesiacoch a kategóriách intervencií.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              onClick={() => setShowConfigModal(true)}
              className="px-4 py-2.5 bg-white border border-[#E8E2D9] hover:border-[#C5A059] text-[#2C2A29] rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#C5A059]" />
              <span>Nastaviť parametre pleti</span>
            </button>

            <button
              onClick={handleGenerateRoadmap}
              disabled={isLoading}
              className="px-5 py-2.5 bg-[#C5A059] hover:bg-[#B38F46] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Vygenerovať AI Plán Liečby teraz</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. HLAVNÝ OBSAH AK MÁME ROADMAP */}
      {roadmap && (
        <div className="space-y-6">
          {/* LIŠTA PREPÍNAČA POHĽADOV & FILTROV */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FBF9F6] p-3 rounded-2xl border border-[#E8E2D9] print:hidden">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'timeline'
                    ? 'bg-[#2C2A29] text-white shadow-xs'
                    : 'bg-white border border-[#E8E2D9] text-[#6B6357] hover:border-[#C5A059]'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>12-Mesačná časová os</span>
              </button>

              <button
                onClick={() => setActiveTab('skincare')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'skincare'
                    ? 'bg-[#2C2A29] text-white shadow-xs'
                    : 'bg-white border border-[#E8E2D9] text-[#6B6357] hover:border-[#C5A059]'
                }`}
              >
                <span>🧴 Domáca Skincare Rutina</span>
              </button>

              <button
                onClick={() => setActiveTab('analysis')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'analysis'
                    ? 'bg-[#2C2A29] text-white shadow-xs'
                    : 'bg-white border border-[#E8E2D9] text-[#6B6357] hover:border-[#C5A059]'
                }`}
              >
                <span>🔬 Klinická AI Analýza</span>
              </button>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* SEZÓNNY FILTER */}
              {activeTab === 'timeline' && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[10px] uppercase font-bold text-[#8C857B] mr-1">Sezóna:</span>
                  {(['all', 'jar', 'leto', 'jesen', 'zima'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setSelectedSeason(s)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        selectedSeason === s
                          ? 'bg-[#C5A059] text-white font-bold'
                          : 'bg-white border border-[#E8E2D9] text-[#6B6357] hover:border-[#C5A059]'
                      }`}
                    >
                      {s === 'all' ? 'Všetky' : s === 'jar' ? '🌸 Jar' : s === 'leto' ? '☀️ Leto' : s === 'jesen' ? '🍂 Jeseň' : '❄️ Zima'}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={handleExportToPdf}
                disabled={isExportingPdf}
                className="px-3 py-1 bg-[#FAF4E9] hover:bg-[#F2E8D5] text-[#8A6827] hover:text-[#684C18] border border-[#E6D4B2] rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Stiahnuť oficiálny PDF plán liečby a ošetrení"
              >
                {isExportingPdf ? (
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-[#C5A059]" />
                )}
                <span>Exportovať do PDF</span>
              </button>
            </div>
          </div>

          {/* KATEGÓRIE FILTRA INTERVENCIÍ */}
          {activeTab === 'timeline' && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs bg-white p-2.5 rounded-xl border border-[#E8E2D9] print:hidden">
              <span className="text-[10px] uppercase font-bold text-[#8C857B] mr-1">Typ intervencie:</span>
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                  filterType === 'all' ? 'bg-[#2C2A29] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Všetky typy
              </button>

              {(Object.keys(INTERVENTION_META) as InterventionType[]).map(typeKey => {
                const meta = INTERVENTION_META[typeKey];
                const isActive = filterType === typeKey;
                return (
                  <button
                    key={typeKey}
                    onClick={() => setFilterType(typeKey)}
                    className={`px-3 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
                      isActive ? `${meta.badgeBg} ${meta.badgeText} font-bold border ${meta.borderColor}` : 'bg-[#FAF8F5] text-[#6B6357] hover:bg-[#E8E2D9]'
                    }`}
                  >
                    <span>{meta.icon}</span>
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* POHĽAD 1: 12-MESAČNÁ ČASOVÁ OS */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              {roadmap.months
                .filter(m => selectedSeason === 'all' || m.season === selectedSeason)
                .map((month) => {
                  const filteredInterventions = month.interventions.filter(inv => 
                    filterType === 'all' || inv.type === filterType
                  );

                  if (filteredInterventions.length === 0 && filterType !== 'all') {
                    return null;
                  }

                  return (
                    <div
                      key={month.monthIndex}
                      className="border border-[#E8E2D9] rounded-2xl bg-white shadow-2xs overflow-hidden transition-all hover:border-[#C5A059]/50"
                    >
                      {/* HLAVIČKA MESIACA */}
                      <div className="p-4 bg-gradient-to-r from-[#FAF8F5] to-white border-b border-[#E8E2D9] flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#2C2A29] text-[#C5A059] flex items-center justify-center font-bold text-sm shadow-xs">
                            {month.monthIndex}M
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-base text-[#2C2A29]">{month.calendarMonthName}</h4>
                              {getSeasonBadge(month.season)}
                            </div>
                            <p className="text-xs text-[#8C857B] mt-0.5">
                              Téma: <strong className="text-[#2C2A29]">{month.focusTheme}</strong> • Cieľ: {month.clinicalGoal}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-[#8C857B] bg-black/5 px-2 py-1 rounded">
                            {month.interventions.length} plánované intervencie
                          </span>
                        </div>
                      </div>

                      {/* ZOZNAM INTERVENCIÍ V MESIACI */}
                      <div className="p-4 divide-y divide-[#F0EBE1]">
                        {filteredInterventions.map((inv) => {
                          const meta = INTERVENTION_META[inv.type] || INTERVENTION_META.dermatology_care;
                          const isDone = inv.status === 'completed';
                          const isScheduled = inv.status === 'scheduled';

                          return (
                            <div key={inv.id} className="py-3.5 first:pt-0 last:pb-0 space-y-2.5">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="space-y-1 max-w-2xl">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.badgeBg} ${meta.badgeText} ${meta.borderColor} flex items-center gap-1`}>
                                      <span>{meta.icon}</span>
                                      <span>{meta.label}</span>
                                    </span>

                                    <h5 className={`font-bold text-sm ${isDone ? 'line-through text-gray-400' : 'text-[#2C2A29]'}`}>
                                      {inv.title}
                                    </h5>

                                    <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                                      inv.priority === 'vysoká' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                                    }`}>
                                      {inv.priority} priorita
                                    </span>

                                    {isDone && (
                                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Absolvované
                                      </span>
                                    )}

                                    {isScheduled && !isDone && (
                                      <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <CalendarIcon className="w-3 h-3" /> V kalendári
                                      </span>
                                    )}
                                  </div>

                                  <p className="text-xs text-[#5C554E] leading-relaxed">
                                    {inv.description}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2 print:hidden">
                                  <button
                                    onClick={() => handleToggleInterventionStatus(month.monthIndex, inv.id)}
                                    className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 ${
                                      isDone
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                                        : 'bg-white border border-[#E8E2D9] text-[#6B6357] hover:border-[#C5A059]'
                                    }`}
                                    title="Označiť zákrok ako absolvovaný"
                                  >
                                    <CheckCircle2 className={`w-3.5 h-3.5 ${isDone ? 'text-emerald-600' : 'text-gray-400'}`} />
                                    <span>{isDone ? 'Hotovo' : 'Označiť'}</span>
                                  </button>

                                  <button
                                    onClick={() => handleScheduleIntervention(month, inv)}
                                    className="text-xs bg-sky-700 hover:bg-sky-800 text-white px-2.5 py-1 rounded-lg font-bold shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                                    title="Naplánovať tento zákrok priamo do klinického kalendára"
                                  >
                                    <CalendarPlus className="w-3.5 h-3.5" />
                                    <span>Do kalendára</span>
                                  </button>
                                </div>
                              </div>

                              {/* DETAILNÉ KLINICKÉ PARAMETRE INTERVENCIE */}
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-[#8C857B] bg-[#FAF8F5] p-2.5 rounded-xl border border-[#F0EBE1]">
                                <div>
                                  <span className="font-bold text-[#2C2A29]">Zóna:</span> {inv.targetArea}
                                </div>
                                <div className="h-3 w-px bg-gray-300 hidden sm:block" />
                                <div>
                                  <span className="font-bold text-[#2C2A29]">Intenzita:</span> {inv.intensity}
                                </div>
                                {inv.estimatedDuration && (
                                  <>
                                    <div className="h-3 w-px bg-gray-300 hidden sm:block" />
                                    <div>
                                      <span className="font-bold text-[#2C2A29]">Trvanie:</span> {inv.estimatedDuration}
                                    </div>
                                  </>
                                )}
                                {inv.estimatedPrice !== undefined && inv.estimatedPrice > 0 && (
                                  <>
                                    <div className="h-3 w-px bg-gray-300 hidden sm:block" />
                                    <div>
                                      <span className="font-bold text-[#2C2A29]">Orientačne:</span> {inv.estimatedPrice} €
                                    </div>
                                  </>
                                )}
                                {inv.homeCareProduct && (
                                  <>
                                    <div className="h-3 w-px bg-gray-300 hidden sm:block" />
                                    <div className="flex items-center gap-1 text-[#8A6827]">
                                      <span>🧴</span> <span className="font-semibold">{inv.homeCareProduct}</span>
                                    </div>
                                  </>
                                )}
                              </div>

                              {inv.clinicalRationale && (
                                <p className="text-[10px] text-[#8C857B] italic pl-2 border-l-2 border-[#C5A059]">
                                  Medicínske odôvodnenie: {inv.clinicalRationale}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* POHĽAD 2: DOMÁCA SKINCARE RUTINA */}
          {activeTab === 'skincare' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* RANNÁ RUTINA */}
                <div className="bg-white border border-[#E8E2D9] rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-[#F0EBE1] pb-3">
                    <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                      <Sun className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#2C2A29] uppercase tracking-wider">Ranná Skincare Rutina (AM)</h4>
                      <p className="text-[10px] text-[#8C857B]">Antioxidačná ochrana, hĺbková hydratácia a maximálne SPF 50+</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {roadmap.dailySkincareRoutine.morning.map((step) => (
                      <div key={step.step} className="p-3 bg-[#FAF8F5] rounded-xl border border-[#F0EBE1] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-wider">
                            Krok {step.step}: {step.category}
                          </span>
                          <span className="text-[9px] bg-white px-2 py-0.5 rounded text-[#8C857B] font-semibold border border-[#E8E2D9]">
                            {step.frequency}
                          </span>
                        </div>
                        <h5 className="font-bold text-xs text-[#2C2A29]">{step.productName}</h5>
                        <p className="text-[11px] text-[#8C857B]">
                          <strong className="text-[#5C554E]">Aktívne zložky:</strong> {step.activeIngredients}
                        </p>
                        <p className="text-[10px] text-[#7A7268] italic mt-1">{step.usageNote}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* VEČERNÁ RUTINA */}
                <div className="bg-white border border-[#E8E2D9] rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-[#F0EBE1] pb-3">
                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                      <Moon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#2C2A29] uppercase tracking-wider">Večerná Skincare Rutina (PM)</h4>
                      <p className="text-[10px] text-[#8C857B]">Dvojfázové čistenie, bunková obnova retinolom a lipidová bariéra</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {roadmap.dailySkincareRoutine.evening.map((step) => (
                      <div key={step.step} className="p-3 bg-[#FAF8F5] rounded-xl border border-[#F0EBE1] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-wider">
                            Krok {step.step}: {step.category}
                          </span>
                          <span className="text-[9px] bg-white px-2 py-0.5 rounded text-[#8C857B] font-semibold border border-[#E8E2D9]">
                            {step.frequency}
                          </span>
                        </div>
                        <h5 className="font-bold text-xs text-[#2C2A29]">{step.productName}</h5>
                        <p className="text-[11px] text-[#8C857B]">
                          <strong className="text-[#5C554E]">Aktívne zložky:</strong> {step.activeIngredients}
                        </p>
                        <p className="text-[10px] text-[#7A7268] italic mt-1">{step.usageNote}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SEZÓNNE PRAVIDLÁ & FOTOPROTEKCIA */}
              <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl p-5 space-y-4">
                <h4 className="font-bold text-sm text-[#2C2A29] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
                  <span>Sezónne pravidlá SAY CLINIC & Bezpečnosť procedúr</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-[#E8E2D9] space-y-1">
                    <span className="font-bold text-emerald-800 block text-[11px] uppercase">🌸 Jar</span>
                    <p className="text-[11px] text-[#5C554E] leading-relaxed">{roadmap.seasonalGuidelines.jar}</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#E8E2D9] space-y-1">
                    <span className="font-bold text-amber-800 block text-[11px] uppercase">☀️ Leto</span>
                    <p className="text-[11px] text-[#5C554E] leading-relaxed">{roadmap.seasonalGuidelines.leto}</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#E8E2D9] space-y-1">
                    <span className="font-bold text-orange-800 block text-[11px] uppercase">🍂 Jeseň</span>
                    <p className="text-[11px] text-[#5C554E] leading-relaxed">{roadmap.seasonalGuidelines.jesen}</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#E8E2D9] space-y-1">
                    <span className="font-bold text-sky-800 block text-[11px] uppercase">❄️ Zima</span>
                    <p className="text-[11px] text-[#5C554E] leading-relaxed">{roadmap.seasonalGuidelines.zima}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* POHĽAD 3: KLINICKÁ AI ANALÝZA PACIENTA */}
          {activeTab === 'analysis' && (
            <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 space-y-6 shadow-2xs">
              <div>
                <h4 className="font-serif font-bold text-lg text-[#2C2A29] mb-1">
                  Klinická diagnostika & Medicínske zhrnutie pacienta
                </h4>
                <p className="text-xs text-[#8C857B]">
                  Automatický rozbor vypracovaný modelom Gemini 3.8 Flash na základe anamnézy a ošetrení SAY CLINIC.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E8E2D9] space-y-2">
                  <span className="text-[10px] font-bold text-[#8C857B] uppercase tracking-wider block">Stav pleti & Fototyp</span>
                  <p className="text-xs text-[#2C2A29] leading-relaxed">
                    {roadmap.patientAnalysis.skinConditionSummary}
                  </p>
                  <div className="pt-2 flex flex-wrap gap-1.5">
                    {roadmap.patientAnalysis.identifiedConcerns.map((con, idx) => (
                      <span key={idx} className="text-[10px] bg-white border border-[#E8E2D9] px-2 py-0.5 rounded-md font-semibold text-[#2C2A29]">
                        • {con}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E8E2D9] space-y-2">
                  <span className="text-[10px] font-bold text-[#8C857B] uppercase tracking-wider block">Klinické posúdenie lekára</span>
                  <p className="text-xs text-[#2C2A29] leading-relaxed">
                    {roadmap.patientAnalysis.clinicalAssessment}
                  </p>
                  {roadmap.patientAnalysis.pastSurgeriesSummary && (
                    <p className="text-[11px] text-sky-900 bg-sky-50 p-2 rounded-lg border border-sky-200 mt-2">
                      <strong>Chirurgické súvislosti:</strong> {roadmap.patientAnalysis.pastSurgeriesSummary}
                    </p>
                  )}
                </div>
              </div>

              {/* HISTÓRIA ZÁKROKOV, POZNÁMOK A ESTETICKÝCH MÁP ANALYZOVANÁ MODELOM */}
              <div className="border-t border-[#E8E2D9] pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-[#2C2A29] flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#C5A059]" />
                    <span>Vstupné dáta pacienta analyzované modelom Gemini</span>
                  </h5>
                  <span className="text-[10px] bg-[#FAF4E9] text-[#8A6827] px-2 py-0.5 rounded-full font-bold">
                    Zákroky: {proceduresHistory.length} | Estetické mapy: {aestheticsHistory.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* KLINICKÉ ZÁKROKY & LEKÁRSKE POZNÁMKY */}
                  <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E8E2D9] space-y-3">
                    <span className="text-[10px] font-bold text-[#8C857B] uppercase tracking-wider block flex items-center gap-1">
                      <span>🩺</span> Zákroky & Operačné protokoly
                    </span>
                    {proceduresHistory.length === 0 ? (
                      <p className="text-xs text-[#8C857B] italic">Žiadne zaznamenané chirurgické zákroky.</p>
                    ) : (
                      <div className="space-y-2">
                        {proceduresHistory.map((rec: any, idx: number) => {
                          const title = typeof rec === 'string' ? rec : rec.title || rec.type || `Záznam #${idx + 1}`;
                          const date = typeof rec === 'object' ? rec.date : null;
                          const doctor = typeof rec === 'object' ? rec.doctor : null;
                          const diagnosis = typeof rec === 'object' ? rec.diagnosis : null;
                          const notes = typeof rec === 'object' ? (rec.content || rec.notes) : null;

                          return (
                            <div key={idx} className="p-3 bg-white rounded-lg border border-[#E8E2D9] space-y-1.5 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-[#2C2A29]">{title}</span>
                                {date && <span className="text-[10px] text-[#8C857B]">{date}</span>}
                              </div>
                              <div className="flex flex-wrap gap-2 text-[10px] text-[#8C857B]">
                                {doctor && <span>Lekár: {doctor}</span>}
                                {diagnosis && <span className="bg-gray-100 px-1.5 py-0.5 rounded">Dg: {diagnosis}</span>}
                              </div>
                              {notes && (
                                <p className="text-[11px] text-[#5C554E] bg-[#FBF9F6] p-2 rounded border border-[#F0EBE1] line-clamp-3">
                                  {notes}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* ESTETICKÉ MAPY & FACE SCULPTURE */}
                  <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E8E2D9] space-y-3">
                    <span className="text-[10px] font-bold text-[#8C857B] uppercase tracking-wider block flex items-center gap-1">
                      <span>💉</span> Estetické mapy & Face Sculpture
                    </span>
                    {aestheticsHistory.length === 0 ? (
                      <p className="text-xs text-[#8C857B] italic">Žiadne zaznamenané estetické ošetrenia.</p>
                    ) : (
                      <div className="space-y-2">
                        {aestheticsHistory.map((aes: any, idx: number) => {
                          const title = typeof aes === 'string' ? aes : aes.title || `Estetické ošetrenie #${idx + 1}`;
                          const date = typeof aes === 'object' ? (aes.formattedDate || aes.date) : null;
                          const protocol = typeof aes === 'object' ? aes.protocolNumber : null;
                          const vectors = typeof aes === 'object' && Array.isArray(aes.vectors) ? aes.vectors : [];

                          return (
                            <div key={idx} className="p-3 bg-white rounded-lg border border-[#E8E2D9] space-y-2 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-[#2C2A29]">{title}</span>
                                {date && <span className="text-[10px] text-[#8C857B]">{date}</span>}
                              </div>
                              {protocol && <div className="text-[10px] text-[#C5A059] font-mono">Protokol: {protocol}</div>}
                              {aes.notes && (
                                <p className="text-[11px] text-[#5C554E] italic bg-[#FAF4E9]/50 p-1.5 rounded border border-[#E6D4B2]/40">
                                  "{aes.notes}"
                                </p>
                              )}
                              {vectors.length > 0 && (
                                <div className="space-y-1 pt-1">
                                  <span className="text-[9px] font-bold text-[#8C857B] uppercase tracking-wider block">
                                    Vektory a zóny tváre:
                                  </span>
                                  <div className="grid grid-cols-1 gap-1">
                                    {vectors.map((vec: any, vIdx: number) => (
                                      <div key={vIdx} className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded border border-gray-200 text-[10px]">
                                        <span className="font-semibold text-[#2C2A29]">
                                          {vec.zoneName || vec.zone || 'Zóna tváre'}
                                        </span>
                                        <span className="text-[#8C857B]">
                                          {vec.productName || vec.product} ({vec.details || vec.dose})
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* BEZPEČNOSTNÉ PREKAUČNÉ POKYNY */}
              <div className="space-y-3 pt-2">
                <h5 className="font-bold text-xs uppercase tracking-wider text-[#2C2A29] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Klinické bezpečnostné opatrenia & Kontraindikácie</span>
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {roadmap.safetyPrecautions.map((sec, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-[#5C554E]">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>{sec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {roadmap.doctorRecommendations && (
                <div className="p-4 bg-[#FAF4E9] rounded-xl border border-[#E6D4B2] space-y-1">
                  <span className="text-[10px] font-bold text-[#8A6827] uppercase tracking-wider block">Odporúčanie vedúceho lekára</span>
                  <p className="text-xs text-[#2C2A29] leading-relaxed">
                    {roadmap.doctorRecommendations}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. MODÁLNE OKNO NA ÚPRAVU PARAMETROV PRED GENEROVANÍM */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-[#E8E2D9] space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#FAF4E9] text-[#C5A059]">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#2C2A29]">Nastavenie parametrov analýzy pacienta</h3>
                  <p className="text-xs text-[#8C857B]">Prispôsobte vstupy pre Gemini AI podľa dermatologického nálezu</p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* TYP PLETI */}
              <div>
                <label className="font-bold text-[#2C2A29] block mb-1">Typ pleti pacienta:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['suchá', 'normálna', 'zmiešaná', 'mastná / problematická'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSkinType(type)}
                      className={`p-2 rounded-xl text-center capitalize font-semibold transition-all ${
                        skinType === type
                          ? 'bg-[#2C2A29] text-white'
                          : 'bg-[#FAF8F5] border border-[#E8E2D9] text-[#6B6357] hover:border-[#C5A059]'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* FITZPATRICK FOTOTYP */}
              <div>
                <label className="font-bold text-[#2C2A29] block mb-1">Fitzpatrick fototyp (určuje riziko laserov):</label>
                <select
                  value={phototype}
                  onChange={e => setPhototype(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E8E2D9] bg-white text-xs text-[#2C2A29] focus:outline-none focus:border-[#C5A059]"
                >
                  {FITZPATRICK_TYPES.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              {/* CIELE A INDIKÁCIE */}
              <div>
                <label className="font-bold text-[#2C2A29] block mb-1.5">Primárne ciele ošetrenia & Nález:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-1">
                  {SKIN_CONCERN_OPTIONS.map(c => {
                    const checked = selectedConcerns.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleConcern(c)}
                        className={`text-left p-2 rounded-lg transition-all flex items-center gap-2 ${
                          checked
                            ? 'bg-[#FAF4E9] border border-[#C5A059] text-[#2C2A29] font-semibold'
                            : 'bg-white border border-[#E8E2D9] text-[#6B6357] hover:border-[#C5A059]'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${
                          checked ? 'bg-[#C5A059] text-white' : 'border border-gray-300'
                        }`}>
                          {checked ? '✓' : ''}
                        </span>
                        <span className="truncate">{c}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* VLASTNÁ POZNÁMKA DERMATOLÓGA */}
              <div>
                <label className="font-bold text-[#2C2A29] block mb-1">Klinická poznámka lekára (voliteľné):</label>
                <textarea
                  value={customNotes}
                  onChange={e => setCustomNotes(e.target.value)}
                  placeholder="Napr. pacient plánuje pobyt pri mori v júli, v minulosti precitlivenosť na kyselinu glykolovú..."
                  className="w-full p-2.5 rounded-xl border border-[#E8E2D9] text-xs focus:outline-none focus:border-[#C5A059] h-16 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#F0EBE1]">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Zrušiť
              </button>
              <button
                type="button"
                onClick={handleGenerateRoadmap}
                disabled={isLoading}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#C5A059] hover:bg-[#B38F46] text-white shadow-sm flex items-center gap-2 cursor-pointer"
              >
                {isLoading ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Uložiť & Spustiť AI generovanie</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. SKRYTÝ DOKUMENT PRE HTMl2CANVAS PDF EXPORT A PRE SYSTÉMOVÚ TLAČ */}
      {roadmap && (
        <div
          style={{
            position: 'fixed',
            left: '-9999px',
            top: 0,
            zIndex: -999,
            pointerEvents: 'none'
          }}
          className="print:static print:left-0 print:top-0 print:block"
          aria-hidden="true"
        >
          <AIHealthRoadmapPdfDocument
            ref={pdfDocumentRef}
            roadmap={roadmap}
            patient={patient}
          />
        </div>
      )}

      {/* 5. NÁHĽAD DOKUMENTU PRED EXPORTOM / TLAČOU (A4 PREVIEW MODAL) */}
      {showPdfPreviewModal && roadmap && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs print:hidden animate-in fade-in">
          <div className="bg-[#2C2A29] text-white rounded-2xl max-w-5xl w-full max-h-[95vh] flex flex-col shadow-2xl border border-[#C5A059]/40 overflow-hidden">
            {/* Hlavička modálu */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#242221]">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-[#C5A059]" />
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <span>Náhľad dokumentu: 12-Mesačný Plán Liečby & Starostlivosti</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#C5A059] text-[#2C2A29]">
                      A4 Tlačový formát
                    </span>
                  </h3>
                  <p className="text-[11px] text-white/60">
                    Čistá, vysoko profesionálna verzia určená na tlač a priame odovzdanie pacientovi
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportToPdf}
                  disabled={isExportingPdf}
                  className="px-3.5 py-1.5 bg-[#C5A059] hover:bg-[#B38F46] text-[#2C2A29] font-black hover:text-white rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                  title="Stiahnuť PDF súbor do počítača"
                >
                  {isExportingPdf ? (
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
                  <span>Tlačiť</span>
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
                <AIHealthRoadmapPdfDocument
                  roadmap={roadmap}
                  patient={patient}
                />
              </div>
            </div>

            {/* Pätička modálu */}
            <div className="p-3 border-t border-white/10 bg-[#242221] flex justify-between items-center text-xs text-white/60">
              <span>Protokol SAY CLINIC • MUDr. Ján Mráz</span>
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
