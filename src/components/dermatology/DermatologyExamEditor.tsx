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
  DERMATOLOGY_PRESETS
} from './dermatologyTypes';
import { MKCHItem } from '../../data/mkch';

interface DermatologyExamEditorProps {
  data: DermatologyExamData;
  onChange: (data: DermatologyExamData) => void;
  mkchDatabase: MKCHItem[];
}

export default function DermatologyExamEditor({ data, onChange, mkchDatabase }: DermatologyExamEditorProps) {
  const [activeTab, setActiveTab] = useState<'anamnesis' | 'skin' | 'dermoscopy' | 'diagnoses' | 'therapy'>('skin');
  const [newDiagSearch, setNewDiagSearch] = useState('');
  const [newDiagCode, setNewDiagCode] = useState('');
  const [newDiagName, setNewDiagName] = useState('');

  const updateField = <K extends keyof DermatologyExamData>(field: K, value: DermatologyExamData[K]) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  const handleApplyPreset = (presetId: string) => {
    const preset = DERMATOLOGY_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    
    onChange({
      ...data,
      ...preset.data,
      // preserve existing lesions if preset doesn't define them
      examinedLesions: preset.data.examinedLesions !== undefined ? preset.data.examinedLesions : data.examinedLesions,
      secondaryDiagnoses: preset.data.secondaryDiagnoses !== undefined ? preset.data.secondaryDiagnoses : data.secondaryDiagnoses,
    });
  };

  // Správa lézií
  const handleAddLesion = () => {
    const newIndex = data.examinedLesions.length + 1;
    const newLesion: DermLesion = {
      id: `lesion-${newIndex}`,
      location: 'Chrbát / Trup',
      sizeMm: '4 x 4 mm',
      asymmetry: 'Symetrická',
      borders: 'Ostré a pravidelné',
      color: 'Homogénna svetlohnedá',
      diameterMm: '4 mm',
      evolution: 'Stabilný bez zmeny',
      dermoscopyFeatures: ['Typická pravidelná pigmentová sieť'],
      conclusion: 'Benígny melanocytový névus',
      recommendation: 'Pravidelné sledovanie (digitálna kontrola o 12 mes.)'
    };

    updateField('examinedLesions', [...data.examinedLesions, newLesion]);
  };

  const handleUpdateLesion = (index: number, updated: DermLesion) => {
    const newLesions = [...data.examinedLesions];
    newLesions[index] = updated;
    updateField('examinedLesions', newLesions);
  };

  const handleRemoveLesion = (index: number) => {
    const newLesions = data.examinedLesions.filter((_, i) => i !== index);
    updateField('examinedLesions', newLesions);
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

  // Správa vedľajších diagnóz
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
      {/* 1. HLAVIČKA A VÝBER RÝCHLYCH ŠABLÓN / PRESETOV */}
      <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
          <div>
            <h3 className="font-brand text-xs uppercase font-bold text-[#2C2A29] tracking-wider">
              Dermatologické vyšetrenie & Dermatoskopia
            </h3>
            <p className="text-[10px] text-[#8C857B]">
              Kompletná karta pacienta: anamnéza, Fitzpatrick fototyp, status localis, digitálna dermatoskopia lézií, viacnásobné MKCH diagnózy a terapia.
            </p>
          </div>
          <span className="text-[9px] font-mono font-bold bg-[#C5A059]/10 text-[#C5A059] px-2 py-1 rounded-md border border-[#C5A059]/30 uppercase">
            Štandard SAY CLINIC
          </span>
        </div>

        {/* PRESET CHIPS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
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

      {/* 2. TAB NAVIGÁCIA PRE PREHĽADNOSŤ */}
      <div className="flex border-b border-[#E8E2D9] bg-white rounded-xl p-1 gap-1 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab('skin')}
          className={`flex-1 py-2 text-center text-[10px] uppercase font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'skin'
              ? 'bg-[#2C2A29] text-white shadow-xs'
              : 'text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#FBF9F6]'
          }`}
        >
          1. Koža & Fitzpatrick
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('dermoscopy')}
          className={`flex-1 py-2 text-center text-[10px] uppercase font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'dermoscopy'
              ? 'bg-[#2C2A29] text-white shadow-xs'
              : 'text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#FBF9F6]'
          }`}
        >
          2. Dermatoskopia ({data.examinedLesions.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('diagnoses')}
          className={`flex-1 py-2 text-center text-[10px] uppercase font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'diagnoses'
              ? 'bg-[#2C2A29] text-white shadow-xs'
              : 'text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#FBF9F6]'
          }`}
        >
          3. MKCH Diagnózy ({1 + data.secondaryDiagnoses.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('anamnesis')}
          className={`flex-1 py-2 text-center text-[10px] uppercase font-bold rounded-lg transition-all cursor-pointer ${
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
          className={`flex-1 py-2 text-center text-[10px] uppercase font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'therapy'
              ? 'bg-[#2C2A29] text-white shadow-xs'
              : 'text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#FBF9F6]'
          }`}
        >
          5. Odporúčania & Terapia
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: KOŽA & FITZPATRICK FOTOTYP                                          */}
      {/* ========================================================================= */}
      {activeTab === 'skin' && (
        <div className="space-y-4">
          {/* FITZPATRICK FOTOTYP - VIZUÁLNY VOLIČ */}
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#C5A059] tracking-wider">
                  Fototyp kože podľa Fitzpatricka
                </label>
                <p className="text-[9px] text-[#8C857B]">
                  Určuje fotosenzitivitu, riziko spálenia a fotokarcinogenézy pri UV žiarení.
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
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between relative ${
                      isSelected 
                        ? 'border-[#C5A059] bg-[#C5A059]/10 shadow-sm ring-2 ring-[#C5A059]/30' 
                        : 'border-[#E8E2D9] bg-[#FBF9F6] hover:bg-white hover:border-[#C5A059]/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div 
                        className="w-5 h-5 rounded-full border border-black/20 shadow-2xs" 
                        style={{ backgroundColor: info.colorSwatch }}
                      />
                      <span className="text-[11px] font-bold text-[#2C2A29]">{info.label}</span>
                    </div>
                    <span className="text-[9px] font-bold text-[#2C2A29] truncate">{info.name}</span>
                    <span className="text-[8px] text-[#8C857B] line-clamp-2 mt-1 leading-tight">
                      {info.sunReaction}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Zhrnutie zvoleného fototypu */}
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
              Status Dermatologicus (Celkový stav pokožky)
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] text-[#8C857B] uppercase font-bold mb-1">Hydratácia & Seborea</label>
                <select
                  value={data.skinHydration}
                  onChange={(e) => updateField('skinHydration', e.target.value)}
                  className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29] font-medium"
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
                <label className="block text-[10px] text-[#8C857B] uppercase font-bold mb-1">Turgor & Elasticita</label>
                <select
                  value={data.skinTurgor}
                  onChange={(e) => updateField('skinTurgor', e.target.value)}
                  className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29] font-medium"
                >
                  <option value="Zachovaný, elastická pokožka">Zachovaný, elastická pokožka</option>
                  <option value="Primeraný veku">Primeraný veku</option>
                  <option value="Mierne znížený turgor">Mierne znížený turgor</option>
                  <option value="Výrazne znížený turgor, laxicita">Výrazne znížený turgor</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-[#8C857B] uppercase font-bold mb-1">Fotostarnutie (Glogau)</label>
                <select
                  value={data.skinPhotodamage}
                  onChange={(e) => updateField('skinPhotodamage', e.target.value)}
                  className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29] font-medium"
                >
                  <option value="Glogau I (Mierne / žiadne fotostarnutie, bez vrások v pokoji)">Glogau I (Mierne)</option>
                  <option value="Glogau II (Vrásky pri pohybe, solárne lentigá, počiatočná dyschrómia)">Glogau II (Stredné)</option>
                  <option value="Glogau III (Vrásky v pokoji, dyschrómie, teleangiektázie)">Glogau III (Pokročilé)</option>
                  <option value="Glogau IV (Ťažké fotostarnutie, aktinická elastóza, žltnutie)">Glogau IV (Ťažké)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-[#8C857B] uppercase font-bold mb-1">Distribúcia vyšetrenia</label>
                <select
                  value={data.skinDistribution}
                  onChange={(e) => updateField('skinDistribution', e.target.value)}
                  className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29] font-medium"
                >
                  <option value="Celotelový skríning znamienok (head-to-toe)">Celotelový skríning (head-to-toe)</option>
                  <option value="Lokalizované vyšetrenie konkrétnej lézie">Lokalizované vyšetrenie</option>
                  <option value="Diseminované eflorescencie (trup a končatiny)">Diseminované eflorescencie</option>
                  <option value="Oblasť tváre a dekoltu">Tvár & dekolt</option>
                  <option value="Kapilícium a akrálne partie">Kapilícium & akrá</option>
                </select>
              </div>
            </div>

            {/* DETAILNÝ POPIS MORFOLÓGIE A EFLORESCENCIÍ */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] text-[#8C857B] uppercase font-bold">
                  Klinický popis eflorescencií (Morfy, sfarbenie, erytém, exantém)
                </label>
                <div className="flex gap-1 text-[9px]">
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
                </div>
              </div>
              <textarea
                rows={3}
                value={data.morphologyDescription}
                onChange={(e) => updateField('morphologyDescription', e.target.value)}
                placeholder="Podrobný popis kožného nálezu, prítomné makuly, papuly, plaky, erytém, deskvamácia, morfológia..."
                className="w-full border border-[#E8E2D9] p-2.5 rounded-lg text-xs bg-white text-[#2C2A29] leading-relaxed"
              />
            </div>

            {/* KOŽNÉ ADNEXÁ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 border-t border-[#E8E2D9]/60">
              <div>
                <label className="block text-[10px] text-[#8C857B] uppercase font-bold mb-1">Vlasy & Kapilícium</label>
                <input
                  type="text"
                  value={data.hairScalp}
                  onChange={(e) => updateField('hairScalp', e.target.value)}
                  placeholder="b.n.o., bez ložiskovej alopécie..."
                  className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#8C857B] uppercase font-bold mb-1">Nechty & Lôžka</label>
                <input
                  type="text"
                  value={data.nails}
                  onChange={(e) => updateField('nails', e.target.value)}
                  placeholder="Hladké, bez dystrofie a mykózy..."
                  className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#8C857B] uppercase font-bold mb-1">Viditeľné sliznice</label>
                <input
                  type="text"
                  value={data.mucosae}
                  onChange={(e) => updateField('mucosae', e.target.value)}
                  placeholder="Ružové, intaktné, b.n.o..."
                  className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DERMATOSKOPICKÉ VYŠETRENIE & ABCDE PODROBNE PRE LÉZIE               */}
      {/* ========================================================================= */}
      {activeTab === 'dermoscopy' && (
        <div className="space-y-4">
          {/* SÚHRN DERMATOSKOPIE */}
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-[10px] uppercase font-bold text-[#C5A059] tracking-wider">
                Celkový dermatoskopický nález & Digitálna fotodermatoskopia
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
              rows={3}
              value={data.dermoscopySummary}
              onChange={(e) => updateField('dermoscopySummary', e.target.value)}
              placeholder="Celkové zhodnotenie dermatoskopického nálezu tela..."
              className="w-full border border-[#E8E2D9] p-2.5 rounded-lg text-xs bg-white text-[#2C2A29] leading-relaxed"
            />
          </div>

          {/* ZOZNAM PODROBNE VYŠETRENÝCH LÉZIÍ (ABCDE) */}
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] uppercase font-bold text-[#C5A059] tracking-wider">
                  Podrobne vyšetrené pigmentové prejavy / Sledované lézie ({data.examinedLesions.length})
                </p>
                <p className="text-[9px] text-[#8C857B]">
                  Zadajte konkrétne rizikové, atypické alebo sledované lézie s kritériami ABCDE a dermatoskopickými štruktúrami.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddLesion}
                className="px-3 py-1.5 bg-[#C5A059] hover:bg-[#b08d48] text-white text-[10px] uppercase font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1"
              >
                <span>+</span> Pridať léziu / znamienko
              </button>
            </div>

            {data.examinedLesions.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-[#E8E2D9] rounded-xl bg-[#FBF9F6]">
                <p className="text-xs text-[#8C857B] font-medium">Nie sú pridané žiadne samostatné sledované lézie.</p>
                <p className="text-[10px] text-[#8C857B] mt-1">Ak sú všetky névy benígne a nevyžadujú osobitný manažment, postačuje celkový dermatoskopický nález vyššie.</p>
                <button
                  type="button"
                  onClick={handleAddLesion}
                  className="mt-3 text-[10px] font-bold text-[#C5A059] hover:underline cursor-pointer"
                >
                  + Pridať prvú léziu
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {data.examinedLesions.map((lesion, idx) => (
                  <div 
                    key={lesion.id || idx} 
                    className="border border-[#E8E2D9] rounded-xl p-3.5 bg-[#FBF9F6] space-y-3 relative group"
                  >
                    {/* HORNÝ RIADOK LÉZIE */}
                    <div className="flex justify-between items-center pb-2 border-b border-[#E8E2D9]">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#2C2A29] text-[#C5A059] text-[10px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-[#2C2A29]">
                          {lesion.location || `Lézia č. ${idx + 1}`}
                        </span>
                        <span className="text-[10px] bg-white border border-[#E8E2D9] px-2 py-0.5 rounded font-mono text-[#8C857B]">
                          {lesion.sizeMm || 'rozmer neurčený'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveLesion(idx)}
                        className="text-[10px] text-rose-600 hover:text-rose-800 font-bold px-2 py-0.5 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        ✕ Odstrániť léziu
                      </button>
                    </div>

                    {/* ZÁKLADNÉ POLIA LÉZIE */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-0.5">Anatomická lokalizácia</label>
                        <input
                          type="text"
                          value={lesion.location}
                          onChange={(e) => handleUpdateLesion(idx, { ...lesion, location: e.target.value })}
                          placeholder="napr. Chrbát medziscapulárne vľavo"
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

                    {/* ABCDE KRITÉRIÁ */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-0.5">A - Asymetria</label>
                        <select
                          value={lesion.asymmetry}
                          onChange={(e) => handleUpdateLesion(idx, { ...lesion, asymmetry: e.target.value as any })}
                          className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white text-[#2C2A29]"
                        >
                          <option value="Symetrická">Symetrická (0 bodov)</option>
                          <option value="Asymetria v 1 osi">Asymetria v 1 osi</option>
                          <option value="Asymetria v 2 osiach">Asymetria v 2 osiach</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-0.5">B - Okraje (Borders)</label>
                        <select
                          value={lesion.borders}
                          onChange={(e) => handleUpdateLesion(idx, { ...lesion, borders: e.target.value as any })}
                          className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white text-[#2C2A29]"
                        >
                          <option value="Ostré a pravidelné">Ostré a pravidelné</option>
                          <option value="Mierne nepravidelné">Mierne nepravidelné</option>
                          <option value="Zúbkované / neostré / rozpité">Zúbkované / neostré / rozpité</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-0.5">C - Farba (Color)</label>
                        <select
                          value={lesion.color}
                          onChange={(e) => handleUpdateLesion(idx, { ...lesion, color: e.target.value as any })}
                          className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white text-[#2C2A29]"
                        >
                          <option value="Homogénna svetlohnedá">Homogénna svetlohnedá</option>
                          <option value="Tmavohnedá">Tmavohnedá</option>
                          <option value="Polychrómna (hnedá, čierna, ružová)">Polychrómna (viacfarebná)</option>
                          <option value="Čierna">Čierna</option>
                          <option value="Depigmentovaná">Depigmentovaná</option>
                          <option value="Ružovo-červená / vaskulárna">Ružovo-červená / vaskulárna</option>
                        </select>
                      </div>
                    </div>

                    {/* DERMATOSKOPICKÉ ŠTRUKTÚRY - CHIP SELECTOR */}
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-1">
                        Dermatoskopické štruktúry & kritériá
                      </label>
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

                    {/* ZÁVER A ODPORÚČANÝ POSTUP LÉZIE */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 border-t border-[#E8E2D9]/70">
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
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MKCH-10 DIAGNÓZY (VIACERO DIAGNÓZ)                                */}
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
                  Vedľajšie & Doplňujúce diagnózy (MKCH-10)
                </p>
                <p className="text-[9px] text-[#8C857B]">
                  Môžete pridať ľubovoľný počet vedľajších diagnóz. Zobrazia sa v tlačovom výstupe.
                </p>
              </div>
              <span className="text-[10px] font-bold text-[#2C2A29] bg-[#FBF9F6] px-2.5 py-1 rounded-lg border border-[#E8E2D9]">
                {data.secondaryDiagnoses.length} {data.secondaryDiagnoses.length === 1 ? 'vedľajšia diagnóza' : 'vedľajších diagnóz'}
              </span>
            </div>

            {/* ZOZNAM PRIDANÝCH VEDĽAJŠÍCH DIAGNÓZ */}
            {data.secondaryDiagnoses.length > 0 ? (
              <div className="space-y-1.5">
                {data.secondaryDiagnoses.map((diag, i) => (
                  <div 
                    key={diag.id || i}
                    className="flex items-center justify-between p-2.5 bg-[#FBF9F6] border border-[#E8E2D9] rounded-xl text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold bg-[#2C2A29] text-[#C5A059] px-2 py-0.5 rounded text-[10px]">
                        {diag.code}
                      </span>
                      <span className="font-medium text-[#2C2A29]">
                        {diag.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSecondaryDiagnosis(diag.id)}
                      className="text-[11px] text-rose-600 hover:text-rose-800 font-bold px-2 py-0.5 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Odstrániť túto diagnózu"
                    >
                      ✕ Zmazať
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#8C857B] italic py-2">
                Zatiaľ nie sú pridané žiadne vedľajšie diagnózy.
              </p>
            )}

            {/* RÝCHLY VÝBER Z NAJČASTEJŠÍCH DERMATOLOGICKÝCH DIAGNÓZ */}
            <div className="pt-2 border-t border-[#E8E2D9]/70 space-y-2">
              <label className="block text-[10px] uppercase font-bold text-[#8C857B]">
                Rýchle pridanie z bežných dermatologických diagnóz:
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

            {/* VLASTNÉ VYHĽADÁVANIE A PRIDANIE DIAGNÓZY */}
            <div className="pt-2 border-t border-[#E8E2D9]/70 space-y-2">
              <label className="block text-[10px] uppercase font-bold text-[#8C857B]">
                Alebo vyhľadať / manuálne pridať diagnózu z celého zoznamu MKCH-10:
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
                  placeholder="Začnite písať kód alebo názov diagnózy (napr. L70.0, melanóm, veruka...)"
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
      {/* TAB 4: ANAMNÉZA & SLNEČNÁ EXPOZÍCIA                                       */}
      {/* ========================================================================= */}
      {activeTab === 'anamnesis' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4 shadow-xs space-y-3">
            <p className="text-[10px] uppercase font-bold text-[#C5A059] tracking-wider">
              Dermatologická & Onkodermatologická Anamnéza
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-[#8C857B] uppercase font-bold mb-1">
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
                <label className="block text-[10px] text-[#8C857B] uppercase font-bold mb-1">
                  Rodinná onkodermatologická anamnéza (Melanóm / Ca kože v rodine)
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
                <label className="block text-[10px] text-[#8C857B] uppercase font-bold mb-1">
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
                <label className="block text-[10px] text-[#8C857B] uppercase font-bold mb-1">
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

          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4 shadow-xs space-y-3">
            <p className="text-[10px] uppercase font-bold text-[#C5A059] tracking-wider">
              Všeobecná Anamnéza & Lieky
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-[#8C857B] uppercase font-bold mb-1">Všeobecná OA</label>
                <input
                  type="text"
                  value={data.generalOA}
                  onChange={(e) => updateField('generalOA', e.target.value)}
                  placeholder="Interné ochorenia, DM, HT..."
                  className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#8C857B] uppercase font-bold mb-1">Alergie (AA)</label>
                <input
                  type="text"
                  value={data.allergies}
                  onChange={(e) => updateField('allergies', e.target.value)}
                  placeholder="Lieky, náplasti, kovy, kozmetika..."
                  className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#8C857B] uppercase font-bold mb-1">Užívaná liečba (FA / Fotosenzibilizácia)</label>
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
              <label className="block text-[10px] uppercase font-bold text-rose-600 mb-1">
                CAVE (Závažné riziká / Upozornenia)
              </label>
              <input
                type="text"
                value={data.cave}
                onChange={(e) => updateField('cave', e.target.value)}
                placeholder="napr. Alergia na lokálne anestetiká, antikoagulanciá, kardiostimulátor..."
                className="w-full border border-rose-200 p-2 rounded-lg text-xs bg-rose-50 text-rose-800 font-medium"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: ODPORÚČANIA, TERAPIA & KONTROLA                                     */}
      {/* ========================================================================= */}
      {activeTab === 'therapy' && (
        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4 shadow-xs space-y-4">
          <p className="text-[10px] uppercase font-bold text-[#C5A059] tracking-wider">
            Terapeutický plán, Režimové opatrenia a Ordinácia
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-[#8C857B] uppercase font-bold mb-1">
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
              <label className="block text-[10px] text-[#8C857B] uppercase font-bold mb-1">
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
              <label className="block text-[10px] text-[#8C857B] uppercase font-bold mb-1">
                Odporúčaná dermokozmetická starostlivosť (SAY Clinic Lab)
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
              <label className="block text-[10px] text-[#8C857B] uppercase font-bold mb-1">
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
              <label className="block text-[10px] text-[#8C857B] uppercase font-bold mb-1">
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
              <label className="block text-[10px] uppercase font-bold text-[#C5A059] mb-1">
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
  );
}
