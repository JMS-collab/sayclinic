'use client';

import React, { useState } from 'react';
import { 
  DermatologyExamData, 
  DermLesion, 
  DermDiagnosisItem, 
  FITZPATRICK_DATA, 
  FitzpatrickType, 
  COMMON_DERM_DIAGNOSES, 
  DERMOSCOPY_FEATURE_OPTIONS,
  DERMATOLOGY_PRESETS,
  DERM_THERAPY_PACKAGES,
  calculateTDS,
  generateSmartFinding,
  BodyMapView,
  LesionRiskLevel
} from './dermatologyTypes';
import DermBodyMap from './DermBodyMap';
import { MKCHItem } from '../../data/mkch';
import { 
  Sparkles, 
  Scissors, 
  Pill, 
  FolderOpen, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Bot, 
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  Copy,
  Layers,
  Calendar,
  Eye,
  FileText
} from 'lucide-react';

interface DermatologyExamEditorProps {
  data: DermatologyExamData;
  onChange: (data: DermatologyExamData) => void;
  mkchDatabase: MKCHItem[];
  onTransferToExcision?: (lesions: DermLesion[]) => void;
  onOpenPrescription?: (therapy: { local: string; systemic: string; dermocosmetics: string }) => void;
  onOpenPatientDrive?: () => void;
  patientName?: string;
}

export default function DermatologyExamEditor({
  data,
  onChange,
  mkchDatabase,
  onTransferToExcision,
  onOpenPrescription,
  onOpenPatientDrive,
  patientName
}: DermatologyExamEditorProps) {
  // Aktívny pohľad a záložky
  const [activeTab, setActiveTab] = useState<'skin' | 'dermoscopy' | 'diagnoses' | 'anamnesis' | 'therapy'>('skin');
  const [bodyMapView, setBodyMapView] = useState<BodyMapView>('back');
  const [selectedLesionIdx, setSelectedLesionIdx] = useState<number | null>(0);

  // MKCH vyhľadávanie
  const [newDiagSearch, setNewDiagSearch] = useState('');
  const [newDiagCode, setNewDiagCode] = useState('');
  const [newDiagName, setNewDiagName] = useState('');

  // AI Modal
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiStatusMsg, setAiStatusMsg] = useState<string | null>(null);

  // Toast notifikácia pre Smart syntézu
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const updateField = <K extends keyof DermatologyExamData>(field: K, value: DermatologyExamData[K]) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  // 1. Aplikácia presetov
  const handleApplyPreset = (presetId: string) => {
    const preset = DERMATOLOGY_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    // Prepočet TDS pre lézie v presete
    const updatedLesions = (preset.data.examinedLesions !== undefined 
      ? preset.data.examinedLesions 
      : data.examinedLesions).map(l => {
        const evalRes = calculateTDS(l);
        return {
          ...l,
          tdsScore: evalRes.score,
          riskLevel: evalRes.risk
        };
      });

    onChange({
      ...data,
      ...preset.data,
      examinedLesions: updatedLesions,
      secondaryDiagnoses: preset.data.secondaryDiagnoses !== undefined ? preset.data.secondaryDiagnoses : data.secondaryDiagnoses,
    });

    showToast(`Šablóna '${preset.title}' úspešne načítaná.`);
  };

  // 2. Správa lézií a Body Map
  const handleAddLesionAtCoords = (coords: { 
    x: number; 
    y: number; 
    view: BodyMapView; 
    regionName: string; 
    initialRisk?: LesionRiskLevel 
  }) => {
    const newIdx = data.examinedLesions.length + 1;
    const initialRisk: LesionRiskLevel = coords.initialRisk || 'low';

    let defaultConclusion: DermLesion['conclusion'] = 'Benígny melanocytový névus';
    let defaultRecommendation: DermLesion['recommendation'] = 'Pravidelné sledovanie (digitálna kontrola o 12 mes.)';
    let defaultColor: DermLesion['color'] = 'Homogénna svetlohnedá';
    let defaultAsymmetry: DermLesion['asymmetry'] = 'Symetrická';
    let defaultBorders: DermLesion['borders'] = 'Ostré a pravidelné';
    let defaultEvolution: DermLesion['evolution'] = 'Stabilný bez zmeny';
    let defaultFeatures = ['Typická pravidelná pigmentová sieť'];

    if (initialRisk === 'moderate') {
      defaultConclusion = 'Atypický (dysplastický) névus';
      defaultRecommendation = 'Kontrola o 3-6 mesiacov (krátkodobé digitálne sledovanie)';
      defaultColor = 'Tmavohnedá';
      defaultAsymmetry = 'Asymetria v 1 osi';
      defaultBorders = 'Mierne nepravidelné';
      defaultEvolution = 'Zmena farby / okrajov';
      defaultFeatures = ['Mierne nepravidelná pigmentová sieť', 'Fokálne globuly'];
    } else if (initialRisk === 'high') {
      defaultConclusion = 'Suspektný malígny melanóm';
      defaultRecommendation = 'Preventívna chirurgická excízia s bioptickým overením (histológia)';
      defaultColor = 'Polychrómna (hnedá, čierna, ružová)';
      defaultAsymmetry = 'Asymetria v 2 osiach';
      defaultBorders = 'Zúbkované / neostré / rozpité';
      defaultEvolution = 'Rast / zväčšenie';
      defaultFeatures = ['Atypická pigmentová sieť', 'Nepravidelné globuly', 'Modro-biely závoj'];
    }

    const defaultLesion: DermLesion = {
      id: `lesion-${Date.now()}-${newIdx}`,
      location: coords.regionName || 'Nová lézia',
      sizeMm: initialRisk === 'high' ? '7 x 6 mm' : initialRisk === 'moderate' ? '5 x 5 mm' : '4 x 4 mm',
      asymmetry: defaultAsymmetry,
      borders: defaultBorders,
      color: defaultColor,
      diameterMm: initialRisk === 'high' ? '7 mm' : initialRisk === 'moderate' ? '5 mm' : '4 mm',
      evolution: defaultEvolution,
      dermoscopyFeatures: defaultFeatures,
      conclusion: defaultConclusion,
      recommendation: defaultRecommendation,
      riskLevel: initialRisk,
      coords: {
        x: coords.x,
        y: coords.y,
        view: coords.view,
        regionName: coords.regionName
      }
    };

    const evalRes = calculateTDS(defaultLesion);
    defaultLesion.tdsScore = evalRes.score;
    // Prefer explicitly chosen risk level if specified by right-click/user
    defaultLesion.riskLevel = initialRisk;

    const updated = [...data.examinedLesions, defaultLesion];
    updateField('examinedLesions', updated);
    setSelectedLesionIdx(updated.length - 1);
    setActiveTab('dermoscopy');
    
    const riskLabel = initialRisk === 'low' ? '🟢 Zelená (Benígne)' : initialRisk === 'moderate' ? '🟡 Žltá (Sledovať)' : '🔴 Červená (Excízia)';
    showToast(`Pridaný pin #${newIdx}: ${coords.regionName} [${riskLabel}]`);
  };

  const handleUpdateLesionRisk = (index: number, risk: LesionRiskLevel) => {
    const target = data.examinedLesions[index];
    if (!target) return;

    let conclusion: DermLesion['conclusion'] = target.conclusion;
    let recommendation: DermLesion['recommendation'] = target.recommendation;

    if (risk === 'low') {
      conclusion = 'Benígny melanocytový névus';
      recommendation = 'Pravidelné sledovanie (digitálna kontrola o 12 mes.)';
    } else if (risk === 'moderate') {
      conclusion = 'Atypický (dysplastický) névus';
      recommendation = 'Kontrola o 3-6 mesiacov (krátkodobé digitálne sledovanie)';
    } else if (risk === 'high') {
      conclusion = 'Suspektný malígny melanóm';
      recommendation = 'Preventívna chirurgická excízia s bioptickým overením (histológia)';
    }

    const updated: DermLesion = {
      ...target,
      riskLevel: risk,
      conclusion,
      recommendation
    };

    const newLesions = [...data.examinedLesions];
    newLesions[index] = updated;
    updateField('examinedLesions', newLesions);

    const riskBadge = risk === 'low' ? '🟢 Zelená (Benígne)' : risk === 'moderate' ? '🟡 Žltá (Sledovať)' : '🔴 Červená (Excízia)';
    showToast(`Lézia #${index + 1} nastavená na: ${riskBadge}`);
  };

  const handleAddManualLesion = () => {
    const newIdx = data.examinedLesions.length + 1;
    const defaultCoords = bodyMapView === 'back'
      ? { x: 50, y: 30, view: 'back' as BodyMapView, regionName: 'Chrbát' }
      : bodyMapView === 'front'
      ? { x: 50, y: 25, view: 'front' as BodyMapView, regionName: 'Hrudník' }
      : { x: 50, y: 45, view: 'face' as BodyMapView, regionName: 'Tvár' };

    handleAddLesionAtCoords(defaultCoords);
  };

  const handleUpdateLesion = (index: number, updated: DermLesion) => {
    const evalRes = calculateTDS(updated);
    const enriched: DermLesion = {
      ...updated,
      tdsScore: evalRes.score,
      riskLevel: evalRes.risk
    };

    const newLesions = [...data.examinedLesions];
    newLesions[index] = enriched;
    updateField('examinedLesions', newLesions);
  };

  const handleRemoveLesion = (index: number) => {
    const newLesions = data.examinedLesions.filter((_, i) => i !== index);
    updateField('examinedLesions', newLesions);
    if (selectedLesionIdx === index) {
      setSelectedLesionIdx(newLesions.length > 0 ? 0 : null);
    } else if (selectedLesionIdx !== null && selectedLesionIdx > index) {
      setSelectedLesionIdx(selectedLesionIdx - 1);
    }
    showToast(`Lézia #${index + 1} odstránená.`);
  };

  const toggleFeatureInLesion = (lesionIndex: number, feature: string) => {
    const lesion = data.examinedLesions[lesionIndex];
    if (!lesion) return;
    const exists = lesion.dermoscopyFeatures.includes(feature);
    const updatedFeatures = exists
      ? lesion.dermoscopyFeatures.filter(f => f !== feature)
      : [...lesion.dermoscopyFeatures, feature];
    handleUpdateLesion(lesionIndex, { ...lesion, dermoscopyFeatures: updatedFeatures });
  };

  // 3. Smart syntéza nálezu (lokálna)
  const handleRunSmartSynthesis = () => {
    const syn = generateSmartFinding(data);
    onChange({
      ...data,
      morphologyDescription: syn.morphology,
      dermoscopySummary: syn.dermoscopySummary,
      regimeRecommendations: syn.regime
    });
    showToast('✨ Odborný nález bol syntetizovaný z lézií a fototypu.');
  };

  // 4. Aplikácia liečebného balíka
  const handleApplyTherapyPackage = (pkg: typeof DERM_THERAPY_PACKAGES[0]) => {
    onChange({
      ...data,
      localTherapy: pkg.localTherapy,
      systemicTherapy: pkg.systemicTherapy,
      dermocosmetics: pkg.dermocosmetics,
      regimeRecommendations: pkg.regime
    });
    showToast(`Liečebný balíček '${pkg.name}' aplikovaný.`);
  };

  // 5. AI Asistent (Gemini)
  const handleExecuteAiSynthesis = async () => {
    if (!aiPrompt && !data) return;
    setIsAiLoading(true);
    setAiStatusMsg(null);

    try {
      const res = await fetch('/api/ai/dermatology-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, currentData: data })
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Zlyhala komunikácia s AI');

      const r = resData.result;
      onChange({
        ...data,
        morphologyDescription: r.morphologyDescription || data.morphologyDescription,
        dermoscopySummary: r.dermoscopySummary || data.dermoscopySummary,
        primaryDiagnosis: r.primaryDiagnosis || data.primaryDiagnosis,
        secondaryDiagnoses: r.secondaryDiagnoses && Array.isArray(r.secondaryDiagnoses) && r.secondaryDiagnoses.length > 0
          ? r.secondaryDiagnoses.map((d: any, idx: number) => ({ id: `ai-diag-${idx}`, code: d.code, name: d.name }))
          : data.secondaryDiagnoses,
        localTherapy: r.localTherapy || data.localTherapy,
        systemicTherapy: r.systemicTherapy || data.systemicTherapy,
        dermocosmetics: r.dermocosmetics || data.dermocosmetics,
        regimeRecommendations: r.regimeRecommendations || data.regimeRecommendations,
        nextCheckup: r.nextCheckup || data.nextCheckup
      });

      setIsAiModalOpen(false);
      setAiPrompt('');
      showToast('🤖 AI Asistent úspešne zosyntetizoval správu vyšetrenia.');
    } catch (err: any) {
      setAiStatusMsg(err.message || 'Nepodarilo sa vygenerovať syntézu');
    } finally {
      setIsAiLoading(false);
    }
  };

  // 6. Prevod na excíziu
  const highRiskOrExcisionLesions = data.examinedLesions.filter(
    l => l.riskLevel === 'high' || l.recommendation.includes('excízia')
  );

  const handleTriggerExcisionTransfer = (targetLesions?: DermLesion[]) => {
    const listToTransfer = targetLesions || (highRiskOrExcisionLesions.length > 0 ? highRiskOrExcisionLesions : data.examinedLesions);
    if (listToTransfer.length === 0) {
      alert('Nie sú označené žiadne lézie indikované na excíziu.');
      return;
    }
    if (onTransferToExcision) {
      onTransferToExcision(listToTransfer);
    }
  };

  // 7. Pridávanie vedľajších diagnóz
  const handleAddSecondaryDiagnosis = (code: string, name: string) => {
    if (!code) return;
    const exists = data.secondaryDiagnoses.some(d => d.code.toLowerCase() === code.toLowerCase());
    if (exists) return;

    const newItem: DermDiagnosisItem = {
      id: `sec-diag-${code.trim().replace(/[^a-zA-Z0-9]/g, '_')}-${data.secondaryDiagnoses.length + 1}`,
      code: code.trim(),
      name: name.trim() || code.trim()
    };

    updateField('secondaryDiagnoses', [...data.secondaryDiagnoses, newItem]);
    setNewDiagCode('');
    setNewDiagName('');
    setNewDiagSearch('');
  };

  const handleRemoveSecondaryDiagnosis = (id: string) => {
    updateField('secondaryDiagnoses', data.secondaryDiagnoses.filter(d => d.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* TOAST OZNÁMENIE */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#2C2A29] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 border border-[#C5A059]/40 text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#C5A059]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. HLAVNÝ HORNÝ PANEL S RÝCHLYMI AKCIAMI & ŠABLÓNAMI */}
      <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 pb-3 border-b border-[#E8E2D9]/70">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-brand text-sm uppercase font-bold text-[#2C2A29] tracking-wider flex items-center gap-1.5">
                <span>🩺</span> Dermatologické vyšetrenie & Dermatoskopia
              </h3>
              <span className="text-[9px] font-mono font-bold bg-[#C5A059]/10 text-[#C5A059] px-2 py-0.5 rounded-md border border-[#C5A059]/30 uppercase">
                SAY CLINIC Suite
              </span>
            </div>
            <p className="text-[10px] text-[#8C857B] mt-0.5">
              Interaktívna 2D Body Map s pinmi, Stolz TDS skóre, digitálna dermatoskopia ABCDE, fotodokumentácia a prepojenie na excízie.
            </p>
          </div>

          {/* AKČNÉ TLAČIDLÁ: SMART SYNTÉZA, AI, EXCÍZIA, DRIVE */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRunSmartSynthesis}
              className="px-3 py-1.5 rounded-xl bg-[#FBF9F6] hover:bg-[#C5A059]/15 border border-[#E8E2D9] hover:border-[#C5A059] text-[#2C2A29] text-[10px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title="Automaticky syntetizuje lekársky nález z označených lézií a fototypu"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Smart syntéza</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAiModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#2C2A29] to-[#3f3c3a] text-white text-[10px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 shadow-xs hover:shadow-md"
              title="Diktát alebo analýza vyšetrenia pomocou Gemini AI"
            >
              <Bot className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>AI Asistent</span>
            </button>

            {highRiskOrExcisionLesions.length > 0 && onTransferToExcision && (
              <button
                type="button"
                onClick={() => handleTriggerExcisionTransfer()}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 shadow-xs animate-pulse"
                title="Preniesť indikované lézie do chirurgického/laserového protokolu"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>Odoslať na excíziu ({highRiskOrExcisionLesions.length})</span>
              </button>
            )}

            {onOpenPatientDrive && (
              <button
                type="button"
                onClick={onOpenPatientDrive}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FBF9F6] border border-[#E8E2D9] text-[#2C2A29] text-[10px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="Otvoriť Google Drive fotodokumentáciu pacienta"
              >
                <FolderOpen className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Disk fotiek</span>
              </button>
            )}
          </div>
        </div>

        {/* PRESET CHIPS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2.5 text-[10px]">
          <span className="text-[#8C857B] font-bold shrink-0 mr-1">Rýchle šablóny:</span>
          {DERMATOLOGY_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleApplyPreset(p.id)}
              className="px-2.5 py-1 rounded-lg bg-[#FBF9F6] hover:bg-[#C5A059]/15 border border-[#E8E2D9] hover:border-[#C5A059] text-[#2C2A29] font-medium transition-all whitespace-nowrap cursor-pointer shadow-2xs"
              title={p.subtitle}
            >
              {p.title}
            </button>
          ))}
        </div>
      </div>

      {/* 2. SPLIT-SCREEN WORKSPACE (VĽAVO BODY MAP, VPRAVO PRACOVNÝ EDITOR) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* ========================================================================= */}
        {/* ĽAVÝ STĹPEC (5 / 12 = cca 40%): INTERAKTÍVNA 2D BODY MAP & QUICK STRIP     */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-3 sticky top-4">
          <div className="h-[520px]">
            <DermBodyMap
              lesions={data.examinedLesions}
              activeView={bodyMapView}
              onViewChange={setBodyMapView}
              selectedLesionIndex={selectedLesionIdx}
              onSelectLesion={(idx) => {
                setSelectedLesionIdx(idx);
                setActiveTab('dermoscopy');
              }}
              onAddLesionAtCoords={handleAddLesionAtCoords}
              onUpdateLesionRisk={handleUpdateLesionRisk}
              onRemoveLesion={handleRemoveLesion}
            />
          </div>

          {/* RÝCHLY PÁS LÉZIÍ (MINI-STRIP) */}
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-3 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#8C857B] tracking-wider">
                Zoznam lézií ({data.examinedLesions.length})
              </span>
              <button
                type="button"
                onClick={handleAddManualLesion}
                className="text-[9px] uppercase font-bold text-[#C5A059] hover:underline cursor-pointer flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" />
                <span>Pridať léziu</span>
              </button>
            </div>

            {data.examinedLesions.length === 0 ? (
              <p className="text-[10px] text-[#8C857B] italic py-1">
                Kliknite na siluetu tela vyššie pre vytvorenie pinu lézie.
              </p>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                {data.examinedLesions.map((lesion, idx) => {
                  const evalRes = calculateTDS(lesion);
                  const isSel = selectedLesionIdx === idx;
                  const riskColorClass = 
                    evalRes.risk === 'high' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                    evalRes.risk === 'moderate' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-emerald-50 text-emerald-700 border-emerald-200';

                  return (
                    <div
                      key={lesion.id || idx}
                      onClick={() => {
                        setSelectedLesionIdx(idx);
                        if (lesion.coords) {
                          setBodyMapView(lesion.coords.view);
                        }
                        setActiveTab('dermoscopy');
                      }}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between text-xs ${
                        isSel 
                          ? 'border-[#C5A059] bg-[#C5A059]/10 shadow-2xs ring-1 ring-[#C5A059]' 
                          : 'border-[#E8E2D9] bg-[#FBF9F6] hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 text-white ${
                          evalRes.risk === 'high' ? 'bg-rose-600' :
                          evalRes.risk === 'moderate' ? 'bg-amber-500' : 'bg-emerald-600'
                        }`}>
                          {idx + 1}
                        </span>
                        <div className="truncate">
                          <span className="font-bold text-[#2C2A29] text-[11px] block truncate">
                            {lesion.location}
                          </span>
                          <span className="text-[9px] text-[#8C857B]">
                            {lesion.sizeMm || 'rozmer neuvedený'} • {lesion.conclusion}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold border ${riskColorClass}`}>
                          TDS {evalRes.score.toFixed(1)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveLesion(idx);
                          }}
                          className="text-gray-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                          title="Zmazať léziu"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PRAVÝ STĹPEC (7 / 12 = cca 60%): WORKSPACE TABY                           */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-4">
          {/* TAB NAVIGÁCIA */}
          <div className="flex border-b border-[#E8E2D9] bg-white rounded-xl p-1 gap-1 shadow-2xs overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('skin')}
              className={`flex-1 min-w-[110px] py-2 text-center text-[10px] uppercase font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'skin'
                  ? 'bg-[#2C2A29] text-white shadow-xs'
                  : 'text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#FBF9F6]'
              }`}
            >
              1. Koža & Fototyp
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('dermoscopy')}
              className={`flex-1 min-w-[125px] py-2 text-center text-[10px] uppercase font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1 ${
                activeTab === 'dermoscopy'
                  ? 'bg-[#2C2A29] text-white shadow-xs'
                  : 'text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#FBF9F6]'
              }`}
            >
              <span>2. Dermatoskopia</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[#C5A059] text-white text-[9px]">
                {data.examinedLesions.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('diagnoses')}
              className={`flex-1 min-w-[110px] py-2 text-center text-[10px] uppercase font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'diagnoses'
                  ? 'bg-[#2C2A29] text-white shadow-xs'
                  : 'text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#FBF9F6]'
              }`}
            >
              3. MKCH ({1 + data.secondaryDiagnoses.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('anamnesis')}
              className={`flex-1 min-w-[110px] py-2 text-center text-[10px] uppercase font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'anamnesis'
                  ? 'bg-[#2C2A29] text-white shadow-xs'
                  : 'text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#FBF9F6]'
              }`}
            >
              4. Anamnéza & UV
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('therapy')}
              className={`flex-1 min-w-[110px] py-2 text-center text-[10px] uppercase font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'therapy'
                  ? 'bg-[#2C2A29] text-white shadow-xs'
                  : 'text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#FBF9F6]'
              }`}
            >
              5. Terapia & Režim
            </button>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: KOŽA & FITZPATRICK FOTOTYP                                          */}
          {/* ========================================================================= */}
          {activeTab === 'skin' && (
            <div className="space-y-4">
              {/* FITZPATRICK FOTOTYP */}
              <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#C5A059] tracking-wider">
                      Fototyp kože podľa Fitzpatricka
                    </label>
                    <p className="text-[9px] text-[#8C857B]">
                      Určuje fotosenzitivitu, riziko spálenia a onkologický rizikový profil.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-[#2C2A29] bg-[#FBF9F6] px-2.5 py-1 rounded-lg border border-[#E8E2D9]">
                    Zvolený: {data.fitzpatrick} ({FITZPATRICK_DATA[data.fitzpatrick].name})
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {(['I', 'II', 'III', 'IV', 'V', 'VI'] as FitzpatrickType[]).map((ft) => {
                    const info = FITZPATRICK_DATA[ft];
                    const isSelected = data.fitzpatrick === ft;
                    return (
                      <button
                        key={ft}
                        type="button"
                        onClick={() => updateField('fitzpatrick', ft)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected 
                            ? 'border-[#C5A059] bg-[#C5A059]/10 shadow-sm ring-2 ring-[#C5A059]/30' 
                            : 'border-[#E8E2D9] bg-[#FBF9F6] hover:bg-white hover:border-[#C5A059]/60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div 
                            className="w-4 h-4 rounded-full border border-black/20 shadow-2xs" 
                            style={{ backgroundColor: info.colorSwatch }}
                          />
                          <span className="text-[10px] font-bold text-[#2C2A29]">{info.label}</span>
                        </div>
                        <span className="text-[9px] font-bold text-[#2C2A29] truncate">{info.name}</span>
                        <span className="text-[8px] text-[#8C857B] line-clamp-2 mt-1 leading-tight">
                          {info.sunReaction}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="p-3 bg-[#FBF9F6] rounded-xl border border-[#E8E2D9] text-[10px] text-[#2C2A29] flex flex-col sm:flex-row justify-between gap-2">
                  <div>
                    <strong className="text-[#C5A059] uppercase text-[9px] tracking-wider block">Charakteristika fototypu:</strong>
                    <p className="mt-0.5">{FITZPATRICK_DATA[data.fitzpatrick].description}</p>
                  </div>
                  <div className="shrink-0 sm:text-right">
                    <strong className="text-[#C5A059] uppercase text-[9px] tracking-wider block">Riziko melanómu:</strong>
                    <span className="font-bold text-rose-700">{FITZPATRICK_DATA[data.fitzpatrick].cancerRisk}</span>
                  </div>
                </div>
              </div>

              {/* STATUS DERMATOLOGICUS GENERALIS */}
              <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4 shadow-xs space-y-3">
                <p className="text-[10px] uppercase font-bold text-[#C5A059] tracking-wider">
                  Status Dermatologicus Localis & Generalis
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[9px] text-[#8C857B] uppercase font-bold mb-1">Hydratácia & Seborea</label>
                    <select
                      value={data.skinHydration}
                      onChange={(e) => updateField('skinHydration', e.target.value)}
                      className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]"
                    >
                      <option value="Normálna pokožka (euderma)">Normálna (euderma)</option>
                      <option value="Xeróza (suchá pokožka)">Xeróza (suchá pokožka)</option>
                      <option value="Výrazná xeróza s deskvamáciou">Výrazná xeróza s deskvamáciou</option>
                      <option value="Seborea (mastná pokožka s hyperfunkciou žliaz)">Seborea (mastná pokožka)</option>
                      <option value="Zmiešaná pokožka (T-zóna mastná, líca suché)">Zmiešaná pokožka</option>
                      <option value="Atopická / hypersenzitívna reaktívna pokožka">Atopická / hypersenzitívna</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] text-[#8C857B] uppercase font-bold mb-1">Turgor & Elasticita</label>
                    <select
                      value={data.skinTurgor}
                      onChange={(e) => updateField('skinTurgor', e.target.value)}
                      className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]"
                    >
                      <option value="Zachovaný, elastická pokožka">Zachovaný, elastická</option>
                      <option value="Primeraný veku">Primeraný veku</option>
                      <option value="Mierne znížený turgor">Mierne znížený turgor</option>
                      <option value="Výrazne znížený turgor, laxicita">Výrazne znížený turgor</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] text-[#8C857B] uppercase font-bold mb-1">Fotostarnutie (Glogau)</label>
                    <select
                      value={data.skinPhotodamage}
                      onChange={(e) => updateField('skinPhotodamage', e.target.value)}
                      className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]"
                    >
                      <option value="Glogau I (Mierne / žiadne fotostarnutie, bez vrások v pokoji)">Glogau I (Mierne)</option>
                      <option value="Glogau II (Vrásky pri pohybe, solárne lentigá, počiatočná dyschrómia)">Glogau II (Stredné)</option>
                      <option value="Glogau III (Vrásky v pokoji, dyschrómie, teleangiektázie)">Glogau III (Pokročilé)</option>
                      <option value="Glogau IV (Ťažké fotostarnutie, aktinická elastóza, žltnutie)">Glogau IV (Ťažké)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] text-[#8C857B] uppercase font-bold mb-1">Rozsah vyšetrenia</label>
                    <select
                      value={data.skinDistribution}
                      onChange={(e) => updateField('skinDistribution', e.target.value)}
                      className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]"
                    >
                      <option value="Celotelový skríning znamienok (head-to-toe)">Celotelový skríning (head-to-toe)</option>
                      <option value="Lokalizované vyšetrenie konkrétnej lézie">Lokalizované vyšetrenie</option>
                      <option value="Diseminované eflorescencie (trup a končatiny)">Diseminované eflorescencie</option>
                      <option value="Oblasť tváre a dekoltu">Tvár & dekolt</option>
                      <option value="Kapilícium a akrálne partie">Kapilícium & akrá</option>
                    </select>
                  </div>
                </div>

                {/* POPIS MORFOLÓGIE S RÝCHLYMI ČIPMI */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[9px] text-[#8C857B] uppercase font-bold">
                      Klinický popis eflorescencií (Morfy, sfarbenie, erytém)
                    </label>
                    <div className="flex flex-wrap gap-1 text-[9px]">
                      <button
                        type="button"
                        onClick={() => updateField('morphologyDescription', data.morphologyDescription + (data.morphologyDescription ? ' ' : '') + 'Pokožka kľudná, bez akútneho zápalového exantému.')}
                        className="text-[#C5A059] hover:underline cursor-pointer"
                      >
                        + Kľudná pokožka
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        type="button"
                        onClick={() => updateField('morphologyDescription', data.morphologyDescription + (data.morphologyDescription ? ' ' : '') + 'Diseminované benígne névy trupu a končatín, bez známok malignity.')}
                        className="text-[#C5A059] hover:underline cursor-pointer"
                      >
                        + Benígne névy
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        type="button"
                        onClick={() => updateField('morphologyDescription', data.morphologyDescription + (data.morphologyDescription ? ' ' : '') + 'Solárne lentigá ramien a dekoltu bez podozrenia.')}
                        className="text-[#C5A059] hover:underline cursor-pointer"
                      >
                        + Solárne lentigá
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={3}
                    value={data.morphologyDescription}
                    onChange={(e) => updateField('morphologyDescription', e.target.value)}
                    placeholder="Podrobný popis kožného nálezu, prítomné makuly, papuly, plaky, erytém, deskvamácia..."
                    className="w-full border border-[#E8E2D9] p-2.5 rounded-lg text-xs bg-white text-[#2C2A29] leading-relaxed"
                  />
                </div>

                {/* KOŽNÉ ADNEXÁ */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1 border-t border-[#E8E2D9]/60">
                  <div>
                    <label className="block text-[9px] text-[#8C857B] uppercase font-bold mb-1">Vlasy & Kapilícium</label>
                    <input
                      type="text"
                      value={data.hairScalp}
                      onChange={(e) => updateField('hairScalp', e.target.value)}
                      placeholder="b.n.o., bez ložiskovej alopécie..."
                      className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white text-[#2C2A29]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-[#8C857B] uppercase font-bold mb-1">Nechty & Lôžka</label>
                    <input
                      type="text"
                      value={data.nails}
                      onChange={(e) => updateField('nails', e.target.value)}
                      placeholder="Hladké, bez dystrofie a mykózy..."
                      className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white text-[#2C2A29]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-[#8C857B] uppercase font-bold mb-1">Viditeľné sliznice</label>
                    <input
                      type="text"
                      value={data.mucosae}
                      onChange={(e) => updateField('mucosae', e.target.value)}
                      placeholder="Ružové, intaktné, b.n.o..."
                      className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white text-[#2C2A29]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: DERMATOSKOPIA & PODROBNÉ LÉZIE S TDS KALKULAČKOU                    */}
          {/* ========================================================================= */}
          {activeTab === 'dermoscopy' && (
            <div className="space-y-4">
              {/* SÚHRN DERMATOSKOPIE */}
              <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] uppercase font-bold text-[#C5A059] tracking-wider">
                    Celkový dermatoskopický nález tela
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#8C857B] font-bold">Počet névov:</span>
                    <select
                      value={data.neviCountCategory}
                      onChange={(e) => updateField('neviCountCategory', e.target.value)}
                      className="border border-[#E8E2D9] px-2 py-1 rounded-lg text-[10px] bg-white font-bold text-[#2C2A29]"
                    >
                      <option value="< 20 névov">&lt; 20 névov</option>
                      <option value="20 – 50 névov">20 – 50 névov</option>
                      <option value="50 – 100 névov">50 – 100 névov</option>
                      <option value="> 100 névov (syndróm dysplastických névov)">&gt; 100 névov (dysplastický syndróm)</option>
                    </select>
                  </div>
                </div>

                <textarea
                  rows={2}
                  value={data.dermoscopySummary}
                  onChange={(e) => updateField('dermoscopySummary', e.target.value)}
                  placeholder="Zhrnutie digitálnej dermatoskopie celého tela..."
                  className="w-full border border-[#E8E2D9] p-2.5 rounded-lg text-xs bg-white text-[#2C2A29] leading-relaxed"
                />
              </div>

              {/* ZOZNAM LÉZIÍ S TDS REAL-TIME KALKULÁCIOU */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-[#C5A059] tracking-wider">
                    Podrobne vyšetrené lézie ({data.examinedLesions.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddManualLesion}
                    className="px-3 py-1.5 bg-[#C5A059] hover:bg-[#b08d48] text-white text-[10px] uppercase font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Pridať léziu</span>
                  </button>
                </div>

                {data.examinedLesions.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-[#E8E2D9] rounded-2xl bg-[#FBF9F6] space-y-2">
                    <p className="text-xs text-[#8C857B] font-medium">Zatiaľ nie sú pridané samostatné sledované lézie.</p>
                    <p className="text-[10px] text-[#8C857B]">
                      Kliknite priamo na anatomickú siluetu vľavo a umiestnite pin, alebo kliknite na tlačidlo vyššie.
                    </p>
                  </div>
                ) : (
                  data.examinedLesions.map((lesion, idx) => {
                    const evalRes = calculateTDS(lesion);
                    const isSelected = selectedLesionIdx === idx;

                    return (
                      <div
                        key={lesion.id || idx}
                        id={`lesion-card-${idx}`}
                        className={`border rounded-2xl p-4 bg-[#FBF9F6] space-y-3 transition-all relative ${
                          isSelected 
                            ? 'border-[#C5A059] ring-2 ring-[#C5A059]/20 bg-white shadow-sm' 
                            : 'border-[#E8E2D9] hover:border-[#C5A059]/50'
                        }`}
                      >
                        {/* HORNÝ RIADOK LÉZIE S FARBOU RIZIKA */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2.5 border-b border-[#E8E2D9]">
                          <div className="flex items-center gap-2">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                              evalRes.risk === 'high' ? 'bg-rose-600' :
                              evalRes.risk === 'moderate' ? 'bg-amber-500' : 'bg-emerald-600'
                            }`}>
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-[#2C2A29]">
                              {lesion.location || `Lézia č. ${idx + 1}`}
                            </span>
                            {lesion.coords && (
                              <span className="text-[9px] bg-white border border-[#E8E2D9] px-2 py-0.5 rounded-md font-mono text-[#8C857B]">
                                Pin: {lesion.coords.view === 'front' ? 'Vpredu' : lesion.coords.view === 'back' ? 'Zozadu' : 'Tvár'} ({lesion.coords.x}%, {lesion.coords.y}%)
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {/* INDIKÁTOR RIZIKA SEMAFOR */}
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border ${evalRes.badgeColorClass}`}>
                              {evalRes.badgeLabel} • TDS {evalRes.score.toFixed(2)}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleRemoveLesion(idx)}
                              className="text-gray-400 hover:text-rose-600 p-1 rounded-lg transition-colors cursor-pointer"
                              title="Odstrániť túto léziu"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* ZÁKLADNÉ POLIA LÉZIE */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-0.5">Anatomická lokalizácia</label>
                            <input
                              type="text"
                              value={lesion.location}
                              onChange={(e) => handleUpdateLesion(idx, { ...lesion, location: e.target.value })}
                              placeholder="napr. Chrbát medziscapulárne vpravo"
                              className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white text-[#2C2A29] font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-0.5">Rozmery (mm)</label>
                            <input
                              type="text"
                              value={lesion.sizeMm}
                              onChange={(e) => handleUpdateLesion(idx, { ...lesion, sizeMm: e.target.value, diameterMm: e.target.value })}
                              placeholder="napr. 5 x 4 mm"
                              className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white text-[#2C2A29]"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-0.5">E - Evolúcia / Vývoj</label>
                            <select
                              value={lesion.evolution}
                              onChange={(e) => handleUpdateLesion(idx, { ...lesion, evolution: e.target.value as any })}
                              className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white text-[#2C2A29]"
                            >
                              <option value="Stabilný bez zmeny">Stabilný bez zmeny</option>
                              <option value="Novo vzniknutý prejav">Novo vzniknutý prejav</option>
                              <option value="Rast / zväčšenie">Rast / zväčšenie</option>
                              <option value="Zmena farby / okrajov">Zmena farby / okrajov</option>
                              <option value="Svrbenie / krvácanie / ulcerácia">Svrbenie / krvácanie / ulcerácia</option>
                            </select>
                          </div>
                        </div>

                        {/* ABCDE KRITÉRIÁ S STOLZ BODOVANÍM */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                          <div>
                            <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-0.5">
                              A - Asymetria (váha 1.3)
                            </label>
                            <select
                              value={lesion.asymmetry}
                              onChange={(e) => handleUpdateLesion(idx, { ...lesion, asymmetry: e.target.value as any })}
                              className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white text-[#2C2A29]"
                            >
                              <option value="Symetrická">Symetrická (0 bodov)</option>
                              <option value="Asymetria v 1 osi">Asymetria v 1 osi (1 bod)</option>
                              <option value="Asymetria v 2 osiach">Asymetria v 2 osiach (2 body)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-0.5">
                              B - Okraje (váha 0.1)
                            </label>
                            <select
                              value={lesion.borders}
                              onChange={(e) => handleUpdateLesion(idx, { ...lesion, borders: e.target.value as any })}
                              className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white text-[#2C2A29]"
                            >
                              <option value="Ostré a pravidelné">Ostré a pravidelné (0 bodov)</option>
                              <option value="Mierne nepravidelné">Mierne nepravidelné (3 body)</option>
                              <option value="Zúbkované / neostré / rozpité">Zúbkované / neostré (6 bodov)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-0.5">
                              C - Farba (váha 0.5)
                            </label>
                            <select
                              value={lesion.color}
                              onChange={(e) => handleUpdateLesion(idx, { ...lesion, color: e.target.value as any })}
                              className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white text-[#2C2A29]"
                            >
                              <option value="Homogénna svetlohnedá">Homogénna svetlohnedá (1 odtieň)</option>
                              <option value="Tmavohnedá">Tmavohnedá (1 odtieň)</option>
                              <option value="Polychrómna (hnedá, čierna, ružová)">Polychrómna (3+ farby)</option>
                              <option value="Čierna">Čierna (2 odtiene)</option>
                              <option value="Depigmentovaná">Depigmentovaná</option>
                              <option value="Ružovo-červená / vaskulárna">Ružovo-červená / vaskulárna</option>
                            </select>
                          </div>
                        </div>

                        {/* DERMATOSKOPICKÉ ŠTRUKTÚRY - CHIP SELECTOR */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-[9px] uppercase font-bold text-[#8C857B]">
                              Dermatoskopické štruktúry ({lesion.dermoscopyFeatures.length})
                            </label>
                            <span className="text-[8px] font-mono text-[#8C857B]">
                              Dermatoskopické kritériá pre Stolz kalkuláciu
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {DERMOSCOPY_FEATURE_OPTIONS.map((feat) => {
                              const active = lesion.dermoscopyFeatures.includes(feat);
                              return (
                                <button
                                  key={feat}
                                  type="button"
                                  onClick={() => toggleFeatureInLesion(idx, feat)}
                                  className={`px-2 py-0.5 rounded text-[9px] font-medium transition-colors cursor-pointer border ${
                                    active
                                      ? 'bg-[#C5A059] text-white border-[#C5A059]'
                                      : 'bg-white text-[#2C2A29] border-[#E8E2D9] hover:bg-[#F4EFEA]'
                                  }`}
                                >
                                  {feat}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* ZÁVER, ODPORÚČANIE & 1-KLIK EXCÍZIA */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-[#E8E2D9]/70">
                          <div>
                            <label className="block text-[9px] uppercase font-bold text-[#C5A059] mb-0.5">Dermatoskopický záver</label>
                            <select
                              value={lesion.conclusion}
                              onChange={(e) => handleUpdateLesion(idx, { ...lesion, conclusion: e.target.value as any })}
                              className="w-full border border-[#C5A059]/40 p-1.5 rounded-lg text-xs bg-white text-[#2C2A29] font-bold"
                            >
                              <option value="Benígny melanocytový névus">Benígny melanocytový névus</option>
                              <option value="Atypický (dysplastický) névus">Atypický (dysplastický) névus</option>
                              <option value="Suspektný malígny melanóm">Suspektný malígny melanóm</option>
                              <option value="Suspektný bazocelulárny karcinóm (BCC)">Suspektný bazocelulárny karcinóm (BCC)</option>
                              <option value="Suspektný spinocelulárny karcinóm (SCC)">Suspektný spinocelulárny karcinóm (SCC)</option>
                              <option value="Seboroická keratóza">Seboroická keratóza</option>
                              <option value="Vaskulárna lézia (hemangióm)">Vaskulárna lézia (hemangióm)</option>
                              <option value="Dermatofibróm">Dermatofibróm</option>
                              <option value="Iný benígny nález">Iný benígny nález</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[9px] uppercase font-bold text-[#C5A059] mb-0.5">Odporúčaný manažment</label>
                            <select
                              value={lesion.recommendation}
                              onChange={(e) => handleUpdateLesion(idx, { ...lesion, recommendation: e.target.value as any })}
                              className="w-full border border-[#C5A059]/40 p-1.5 rounded-lg text-xs bg-white text-[#2C2A29] font-medium"
                            >
                              <option value="Pravidelné sledovanie (digitálna kontrola o 12 mes.)">Pravidelné sledovanie (kontrola o 12 mes.)</option>
                              <option value="Kontrola o 3-6 mesiacov (krátkodobé digitálne sledovanie)">Kontrola o 3-6 mesiacov</option>
                              <option value="Preventívna chirurgická excízia s bioptickým overením (histológia)">Preventívna chirurgická excízia (histológia)</option>
                              <option value="Laserová ablácia / vaporizácia">Laserová ablácia / vaporizácia</option>
                              <option value="Kryodeštrukcia tekutým dusíkom">Kryodeštrukcia tekutým dusíkom</option>
                              <option value="Exstirpácia / kyretáž">Exstirpácia / kyretáž</option>
                              <option value="Bez nutnosti intervencie">Bez nutnosti intervencie</option>
                            </select>
                          </div>
                        </div>

                        {/* SPODNÁ LIŠTA KARTY: ODKAZ NA DISK & PREVOD NA EXCÍZIU */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-2 border-t border-[#E8E2D9]/50 text-[10px]">
                          <div className="text-[#8C857B] font-mono flex items-center gap-1.5">
                            <span className="text-[9px] font-bold text-[#C5A059]">Skóre:</span>
                            <span>{evalRes.formulaDetails}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {lesion.recommendation.includes('excízia') && onTransferToExcision && (
                              <button
                                type="button"
                                onClick={() => handleTriggerExcisionTransfer([lesion])}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[9px] uppercase transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <Scissors className="w-3 h-3" />
                                <span>Odoslať na excíziu</span>
                              </button>
                            )}

                            {onOpenPatientDrive && (
                              <button
                                type="button"
                                onClick={onOpenPatientDrive}
                                className="text-[#C5A059] hover:underline font-bold text-[9px] cursor-pointer flex items-center gap-1"
                              >
                                <FolderOpen className="w-3 h-3" />
                                <span>Drive fotky</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: MKCH-10 DIAGNÓZY                                                   */}
          {/* ========================================================================= */}
          {activeTab === 'diagnoses' && (
            <div className="space-y-4">
              {/* HLAVNÁ DIAGNÓZA */}
              <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] uppercase font-bold text-[#C5A059] tracking-wider">
                    Hlavná diagnóza (MKCH-10)
                  </label>
                  <span className="text-[9px] font-bold bg-[#C5A059]/10 text-[#C5A059] px-2 py-0.5 rounded border border-[#C5A059]/20">
                    Primárna
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-1">
                    <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-1">Kód MKCH</label>
                    <input
                      type="text"
                      value={data.primaryDiagnosis.code}
                      onChange={(e) => updateField('primaryDiagnosis', { ...data.primaryDiagnosis, code: e.target.value })}
                      placeholder="napr. Z01.8"
                      className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs font-mono font-bold bg-white text-[#2C2A29]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-1">Názov diagnózy</label>
                    <input
                      type="text"
                      value={data.primaryDiagnosis.name}
                      onChange={(e) => updateField('primaryDiagnosis', { ...data.primaryDiagnosis, name: e.target.value })}
                      placeholder="napr. Preventívny celotelový dermatoskopický skríning"
                      className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29] font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* VEDĽAJŠIE DIAGNÓZY */}
              <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4 shadow-xs space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-[#C5A059] tracking-wider">
                      Vedľajšie a sprievodné diagnózy ({data.secondaryDiagnoses.length})
                    </p>
                    <p className="text-[9px] text-[#8C857B]">
                      Môžete pridať ľubovoľný počet vedľajších diagnóz. Zobrazia sa v tlačovom protokole.
                    </p>
                  </div>
                </div>

                {data.secondaryDiagnoses.length > 0 ? (
                  <div className="space-y-1.5">
                    {data.secondaryDiagnoses.map((diag, i) => (
                      <div 
                        key={diag.id || i}
                        className="flex items-center justify-between p-2.5 bg-[#FBF9F6] border border-[#E8E2D9] rounded-xl text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono font-bold bg-[#2C2A29] text-[#C5A059] px-2 py-0.5 rounded text-[10px]">
                            {diag.code}
                          </span>
                          <span className="font-medium text-[#2C2A29] truncate">
                            {diag.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSecondaryDiagnosis(diag.id)}
                          className="text-[11px] text-rose-600 hover:text-rose-800 font-bold px-2 py-0.5 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          ✕ Zmazať
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#8C857B] italic py-1">
                    Zatiaľ nie sú pridané žiadne vedľajšie diagnózy.
                  </p>
                )}

                {/* RÝCHLE PRIDANIE Z BEŽNÝCH DIAGNÓZ */}
                <div className="pt-2 border-t border-[#E8E2D9]/70 space-y-2">
                  <label className="block text-[10px] uppercase font-bold text-[#8C857B]">
                    Rýchle pridanie z bežných kožných diagnóz:
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {COMMON_DERM_DIAGNOSES.map((d) => {
                      const isAlreadyAdded = data.primaryDiagnosis.code === d.code || data.secondaryDiagnoses.some(sec => sec.code === d.code);
                      return (
                        <button
                          key={d.code}
                          type="button"
                          disabled={isAlreadyAdded}
                          onClick={() => handleAddSecondaryDiagnosis(d.code, d.name)}
                          className={`text-[9px] px-2.5 py-1 rounded-lg border text-left transition-all cursor-pointer font-medium ${
                            isAlreadyAdded
                              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                              : 'bg-white text-[#2C2A29] border-[#E8E2D9] hover:border-[#C5A059] hover:bg-[#C5A059]/10'
                          }`}
                        >
                          + <span className="font-mono font-bold text-[#C5A059]">{d.code}</span> {d.name.replace(`${d.code} - `, '')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* FULL SEARCH MKCH */}
                <div className="pt-2 border-t border-[#E8E2D9]/70 space-y-2">
                  <label className="block text-[10px] uppercase font-bold text-[#8C857B]">
                    Vyhľadať diagnózu z celej databázy MKCH-10:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      list="all-mkch-suggestions"
                      value={newDiagSearch}
                      onChange={(e) => {
                        setNewDiagSearch(e.target.value);
                        const matched = mkchDatabase.find(item => 
                          item.name.toLowerCase() === e.target.value.toLowerCase() ||
                          item.code.toLowerCase() === e.target.value.toLowerCase()
                        );
                        if (matched) {
                          setNewDiagCode(matched.code);
                          setNewDiagName(matched.name);
                        } else if (e.target.value.includes(' - ')) {
                          const parts = e.target.value.split(' - ');
                          setNewDiagCode(parts[0].trim());
                          setNewDiagName(e.target.value.trim());
                        }
                      }}
                      placeholder="Začnite písať kód alebo názov (napr. L70.0, melanóm, veruka...)"
                      className="flex-1 border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]"
                    />
                    <datalist id="all-mkch-suggestions">
                      {mkchDatabase.slice(0, 500).map((item) => (
                        <option key={item.code} value={item.name.includes(item.code) ? item.name : `${item.code} - ${item.name}`} />
                      ))}
                    </datalist>

                    <button
                      type="button"
                      disabled={!newDiagSearch.trim()}
                      onClick={() => {
                        const code = newDiagCode || (newDiagSearch.includes(' - ') ? newDiagSearch.split(' - ')[0].trim() : newDiagSearch.trim());
                        const name = newDiagName || newDiagSearch.trim();
                        handleAddSecondaryDiagnosis(code, name);
                      }}
                      className="px-4 py-2 bg-[#2C2A29] hover:bg-black text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                    >
                      + Pridať
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: ANAMNÉZA & ONKODERMATOLÓGIA                                         */}
          {/* ========================================================================= */}
          {activeTab === 'anamnesis' && (
            <div className="space-y-4">
              <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] uppercase font-bold text-[#C5A059] tracking-wider">
                    Dermatologická & Onkodermatologická Anamnéza
                  </p>
                  <div className="flex gap-2 text-[9px]">
                    <button
                      type="button"
                      onClick={() => {
                        updateField('familyMelanoma', 'Negatívna. V rodine sa nevyskytol malígny melanóm ani iné kožné malignity.');
                        updateField('sunExposure', 'Bežná rekreačná expozícia. V detstve bez spálenia s pľuzgiermi. Soláriá nenavštevuje.');
                        updateField('sunProtection', 'Pravidelné používanie SPF 50+ na exponované oblasti.');
                        showToast('Predvyplnená negatívna anamnéza');
                      }}
                      className="text-[#C5A059] hover:underline font-bold cursor-pointer"
                    >
                      + Negatívna onko anamnéza
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] text-[#8C857B] uppercase font-bold mb-1">
                      Osobná dermatologická anamnéza (OA kožná)
                    </label>
                    <textarea
                      rows={2}
                      value={data.dermatologicOA}
                      onChange={(e) => updateField('dermatologicOA', e.target.value)}
                      placeholder="Kožné ochorenia, minulé excízie, histológie névov, akné, ekzém..."
                      className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] text-[#8C857B] uppercase font-bold mb-1">
                      Rodinná anamnéza (Melanóm / Ca kože v rodine)
                    </label>
                    <textarea
                      rows={2}
                      value={data.familyMelanoma}
                      onChange={(e) => updateField('familyMelanoma', e.target.value)}
                      placeholder="Výskyt melanómu alebo iných malignít u príbuzných 1. a 2. stupňa..."
                      className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] text-[#8C857B] uppercase font-bold mb-1">
                      Slnečná expozícia & Spálenie v minulosti (Soláriá)
                    </label>
                    <textarea
                      rows={2}
                      value={data.sunExposure}
                      onChange={(e) => updateField('sunExposure', e.target.value)}
                      placeholder="Spálenie v detstve s pľuzgiermi, návšteva solárií, pobyt v trópoch..."
                      className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] text-[#8C857B] uppercase font-bold mb-1">
                      Návyky fotoprotekcie (Používanie SPF)
                    </label>
                    <textarea
                      rows={2}
                      value={data.sunProtection}
                      onChange={(e) => updateField('sunProtection', e.target.value)}
                      placeholder="Denné SPF 50+, nepravidelné, len pri mori, žiadne..."
                      className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]"
                    />
                  </div>
                </div>
              </div>

              {/* VŠEOBECNÁ OA, ALERGIE, LIEKY, CAVE */}
              <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4 shadow-xs space-y-3">
                <p className="text-[10px] uppercase font-bold text-[#C5A059] tracking-wider">
                  Všeobecná Anamnéza & Rizikové faktory
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[9px] text-[#8C857B] uppercase font-bold mb-1">Všeobecná OA</label>
                    <input
                      type="text"
                      value={data.generalOA}
                      onChange={(e) => updateField('generalOA', e.target.value)}
                      placeholder="Interné ochorenia, DM, HT..."
                      className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-[#8C857B] uppercase font-bold mb-1">Alergie (AA)</label>
                    <input
                      type="text"
                      value={data.allergies}
                      onChange={(e) => updateField('allergies', e.target.value)}
                      placeholder="Lieky, náplasti, kovy, kozmetika..."
                      className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-[#8C857B] uppercase font-bold mb-1">Užívaná liečba (FA / Fotosenzibilizácia)</label>
                    <input
                      type="text"
                      value={data.medication}
                      onChange={(e) => updateField('medication', e.target.value)}
                      placeholder="Lieky, fotosenzibilizujúce látky..."
                      className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] uppercase font-bold text-rose-600 mb-1 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>CAVE (Závažné riziká / Alergia na lokálne anestetiká / Antikoagulanciá)</span>
                  </label>
                  <input
                    type="text"
                    value={data.cave}
                    onChange={(e) => updateField('cave', e.target.value)}
                    placeholder="napr. Alergia na mesocain/lidocain, antikoagulačná liečba Warfarin/Eliquis, kardiostimulátor..."
                    className="w-full border border-rose-200 p-2 rounded-lg text-xs bg-rose-50 text-rose-800 font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: TERAPIA, REŽIM & PREDPIS RECEPTU                                   */}
          {/* ========================================================================= */}
          {activeTab === 'therapy' && (
            <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-[#E8E2D9]">
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#C5A059] tracking-wider">
                    Terapeutický plán, Režimové opatrenia & Ordinácia
                  </p>
                  <p className="text-[9px] text-[#8C857B]">
                    Vyberte inteligentný balíček terapie alebo zadajte vlastnú ordináciu a recepty.
                  </p>
                </div>

                {onOpenPrescription && (
                  <button
                    type="button"
                    onClick={() => onOpenPrescription({
                      local: data.localTherapy,
                      systemic: data.systemicTherapy,
                      dermocosmetics: data.dermocosmetics
                    })}
                    className="px-3 py-1.5 bg-[#C5A059] hover:bg-[#b08d48] text-white text-[10px] uppercase font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    title="Otvoriť a predvyplniť receptový modul v SAY OS"
                  >
                    <Pill className="w-3.5 h-3.5" />
                    <span>Vystaviť recept</span>
                  </button>
                )}
              </div>

              {/* RÝCHLE LIEČEBNÉ BALÍČKY */}
              <div className="space-y-1.5">
                <span className="text-[9px] uppercase font-bold text-[#8C857B] block">
                  Predpripravené liečebné balíčky (1-klik aplikácia):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DERM_THERAPY_PACKAGES.map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => handleApplyTherapyPackage(pkg)}
                      className="p-2.5 rounded-xl border border-[#E8E2D9] bg-[#FBF9F6] hover:bg-white hover:border-[#C5A059] text-left transition-all cursor-pointer group"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-xs text-[#2C2A29] group-hover:text-[#C5A059] transition-colors">
                          {pkg.name}
                        </span>
                        <span className="text-[8px] uppercase font-bold px-1.5 py-0.5 rounded bg-white border border-[#E8E2D9] text-[#8C857B]">
                          {pkg.category}
                        </span>
                      </div>
                      <p className="text-[9px] text-[#8C857B] line-clamp-2">
                        {pkg.localTherapy}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* DETAILNÉ POLIA TERAPIE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[9px] text-[#8C857B] uppercase font-bold mb-1">
                    Lokálna dermatologická terapia (Externá dermatoterapia)
                  </label>
                  <textarea
                    rows={3}
                    value={data.localTherapy}
                    onChange={(e) => updateField('localTherapy', e.target.value)}
                    placeholder="Ordinované receptúry, emulzie, krémy, roztoky..."
                    className="w-full border border-[#E8E2D9] p-2.5 rounded-lg text-xs bg-white text-[#2C2A29]"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-[#8C857B] uppercase font-bold mb-1">
                    Systémová farmakoterapia
                  </label>
                  <textarea
                    rows={3}
                    value={data.systemicTherapy}
                    onChange={(e) => updateField('systemicTherapy', e.target.value)}
                    placeholder="Celková perorálna medikácia (ak je indikovaná)..."
                    className="w-full border border-[#E8E2D9] p-2.5 rounded-lg text-xs bg-white text-[#2C2A29]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] text-[#8C857B] uppercase font-bold mb-1">
                    Odporúčaná dermokozmetická starostlivosť
                  </label>
                  <textarea
                    rows={3}
                    value={data.dermocosmetics}
                    onChange={(e) => updateField('dermocosmetics', e.target.value)}
                    placeholder="Čistenie pleti, hydratácia, bariérová regenerácia, širokospektrálne SPF 50+..."
                    className="w-full border border-[#E8E2D9] p-2.5 rounded-lg text-xs bg-white text-[#2C2A29]"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-[#8C857B] uppercase font-bold mb-1">
                    Režimové opatrenia & Poučenie o fotoprotekcii a ABCDE
                  </label>
                  <textarea
                    rows={3}
                    value={data.regimeRecommendations}
                    onChange={(e) => updateField('regimeRecommendations', e.target.value)}
                    placeholder="Pravidlá pobytu na slnku, zákaz solária, domáce samovyšetrenie podľa ABCDE..."
                    className="w-full border border-[#E8E2D9] p-2.5 rounded-lg text-xs bg-white text-[#2C2A29]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[#E8E2D9]/60">
                <div>
                  <label className="block text-[9px] text-[#8C857B] uppercase font-bold mb-1">
                    Vykonané ambulantné výkony počas návštevy
                  </label>
                  <input
                    type="text"
                    value={data.performedProcedures}
                    onChange={(e) => updateField('performedProcedures', e.target.value)}
                    placeholder="Celotelová digitálna dermatoskopia, odber biopsie, kryoterapia..."
                    className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]"
                  />
                </div>

                <div>
                  <label className="block text-[9px] uppercase font-bold text-[#C5A059] mb-1">
                    Plánovaná kontrola & Follow-up
                  </label>
                  <input
                    type="text"
                    value={data.nextCheckup}
                    onChange={(e) => updateField('nextCheckup', e.target.value)}
                    placeholder="napr. O 12 mesiacov na preventívnu digitálnu kontrolu..."
                    className="w-full border border-[#C5A059]/50 p-2 rounded-lg text-xs bg-white text-[#2C2A29] font-bold"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. MODAL: AI ASISTENT (GEMINI) PRE DIKTÁT A ANALÝZU */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 border border-[#E8E2D9] shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D9]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2C2A29] to-[#C5A059] flex items-center justify-center text-white">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-brand text-xs uppercase font-bold text-[#2C2A29]">
                    AI Asistent (Gemini 2.5 Flash)
                  </h4>
                  <p className="text-[10px] text-[#8C857B]">
                    Zadajte voľný diktát alebo inštrukciu k nálezu pacienta
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] uppercase font-bold text-[#8C857B]">
                Voľný diktát lekára / poznámka:
              </label>
              <textarea
                rows={4}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Napr.: 'Pacient s fototypom 2, na chrbte vpravo atypický névus 6 mm s asymetriou a tmavým centrom, navrhnúť excíziu na plastickej chirurgii. Inak celotelovo bežné benígne znamienka. Režim SPF 50...'"
                className="w-full border border-[#E8E2D9] p-3 rounded-xl text-xs bg-[#FBF9F6] text-[#2C2A29] focus:bg-white focus:border-[#C5A059] outline-none leading-relaxed"
              />
            </div>

            {aiStatusMsg && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {aiStatusMsg}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E2D9]">
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="px-3 py-2 rounded-xl border border-[#E8E2D9] text-[#2C2A29] text-xs font-medium hover:bg-gray-50 cursor-pointer"
              >
                Zrušiť
              </button>

              <button
                type="button"
                disabled={isAiLoading || (!aiPrompt.trim() && data.examinedLesions.length === 0)}
                onClick={handleExecuteAiSynthesis}
                className="px-4 py-2 rounded-xl bg-[#2C2A29] hover:bg-black text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
              >
                {isAiLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Spracúvam...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Syntetizovať nález</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
