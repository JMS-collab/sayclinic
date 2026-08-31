'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  Search, 
  Check, 
  AlertCircle, 
  FileText, 
  Sliders, 
  Sparkles 
} from './Icons';
import { 
  SurgeryConsentProfile, 
  getSurgeryConsentDatabase, 
  saveSurgeryConsentProfile, 
  resetSurgeryConsentProfile, 
  resetAllSurgeryConsentProfiles,
  getCustomSurgeryConsentDatabase,
  SURGERY_CONSENT_DATABASE,
  exportSurgeryConsentProfilesJson,
  importSurgeryConsentProfilesJson
} from '../data/surgeryConsentCatalog';

interface SurgeryConsentTemplateManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAndApply?: (profile: SurgeryConsentProfile) => void;
}

export const SurgeryConsentTemplateManager: React.FC<SurgeryConsentTemplateManagerProps> = ({
  isOpen,
  onClose,
  onSelectAndApply
}) => {
  const [database, setDatabase] = useState<Record<string, SurgeryConsentProfile>>({});
  const [customIds, setCustomIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string>('op_aug_impl');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // State aktuálne editovaného profilu
  const [editingProfile, setEditingProfile] = useState<SurgeryConsentProfile | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadData = () => {
    const db = getSurgeryConsentDatabase();
    const customs = getCustomSurgeryConsentDatabase();
    setDatabase(db);
    setCustomIds(Object.keys(customs));
    
    if (selectedId && db[selectedId]) {
      setEditingProfile({ ...db[selectedId] });
    } else {
      const firstKey = Object.keys(db)[0] || 'op_aug_impl';
      setSelectedId(firstKey);
      if (db[firstKey]) {
        setEditingProfile({ ...db[firstKey] });
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedId && database[selectedId]) {
      setEditingProfile({ ...database[selectedId] });
    }
  }, [selectedId]);

  if (!isOpen) return null;

  const filteredKeys = Object.keys(database).filter(key => {
    const p = database[key];
    const term = searchTerm.toLowerCase();
    return (
      p.procedureName.toLowerCase().includes(term) ||
      p.anatomicalArea.toLowerCase().includes(term) ||
      (p.keywords && p.keywords.some(k => k.toLowerCase().includes(term)))
    );
  });

  const handleSelect = (id: string) => {
    setSelectedId(id);
    if (database[id]) {
      setEditingProfile({ ...database[id] });
    }
  };

  const handleSave = () => {
    if (!editingProfile) return;
    if (!editingProfile.procedureName.trim()) {
      setStatusMessage({ text: 'Názov operácie je povinný!', type: 'error' });
      return;
    }

    saveSurgeryConsentProfile(editingProfile);
    setStatusMessage({ text: 'Šablóna bola úspešne uložená a aktualizovaná!', type: 'success' });
    loadData();
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleResetSingle = () => {
    if (!editingProfile) return;
    if (window.confirm(`Naozaj chcete obnoviť šablónu "${editingProfile.procedureName}" na predvolené výrobné znenie?`)) {
      resetSurgeryConsentProfile(editingProfile.id);
      loadData();
      setStatusMessage({ text: 'Šablóna bola obnovená na pôvodné znenie.', type: 'success' });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleResetAll = () => {
    if (window.confirm('Naozaj chcete obnoviť VŠETKY šablóny na predvolené výrobné znenie? Vaše individuálne úpravy budú vymazané.')) {
      resetAllSurgeryConsentProfiles();
      loadData();
      setStatusMessage({ text: 'Všetky šablóny boli obnovené na výrobné nastavenia.', type: 'success' });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleCreateNew = () => {
    const newId = `custom_op_${Date.now()}`;
    const newProfile: SurgeryConsentProfile = {
      id: newId,
      keywords: ['novy vykor', 'esteticky zakrok'],
      procedureName: 'Nová vlastná operácia / zákrok',
      anatomicalArea: 'Operovaná anatomická oblasť',
      purposeAndNature: 'Účelom výkonu je...',
      technique: 'Predoperačné meranie a zakreslenie...',
      anesthesiaType: 'Celková anestézia',
      alternatives: 'Konzervatívny postup, neinvazívne metódy...',
      refusalConsequences: 'Zotrvanie pôvodného stavu bez ohrozenia života.',
      specificRisks: 'Krvácanie, hematóm, infekcia, asymetria, zmena citlivosti...',
      postopCare: {
        restAndPositioning: 'Kľudový režim na lôžku 48 hodín...',
        compressionGarment: 'Nosenie elastického obväzu / bielizne 4–6 týždňov.',
        physicalRestrictions: 'Obmedzenie fyzickej záťaže na 4 týždne.',
        woundCare: 'Udržiavať rany v suchu a čistote, dezinfekcia Octenisept.',
        environmentalRestrictions: 'Zákaz sauny, bazéna a priameho slnka 6 týždňov.',
        medication: 'Analgetiká pri bolesti, profylaktické antibiotiká.',
        checkupSchedule: 'Kontrola o 7–10 dní, extrakcia stehov.'
      }
    };

    saveSurgeryConsentProfile(newProfile);
    loadData();
    setSelectedId(newId);
    setEditingProfile(newProfile);
    setStatusMessage({ text: 'Vytvorená nová šablóna. Môžete ju upraviť a uložiť.', type: 'success' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleDeleteCustom = () => {
    if (!editingProfile) return;
    if (window.confirm(`Naozaj chcete natrvalo zmazať šablónu "${editingProfile.procedureName}"?`)) {
      resetSurgeryConsentProfile(editingProfile.id);
      loadData();
      setStatusMessage({ text: 'Šablóna bola vymazaná.', type: 'success' });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleExport = () => {
    const json = exportSurgeryConsentProfilesJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SAY_CLINIC_Sablony_Informovanych_Suhlasov_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        const success = importSurgeryConsentProfilesJson(content);
        if (success) {
          loadData();
          setStatusMessage({ text: 'Šablóny boli úspešne importované zo súboru!', type: 'success' });
          setTimeout(() => setStatusMessage(null), 3000);
        } else {
          setStatusMessage({ text: 'Neplatný formát JSON súboru!', type: 'error' });
          setTimeout(() => setStatusMessage(null), 3000);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const isCustomized = editingProfile ? customIds.includes(editingProfile.id) : false;
  const isOriginalBuiltIn = editingProfile ? Boolean(SURGERY_CONSENT_DATABASE[editingProfile.id]) : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* HLAVIČKA MODÁLU */}
        <div className="bg-white px-6 py-4 border-b border-[#E8E2D9] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#C5A059]/10 text-[#C5A059] rounded-xl border border-[#C5A059]/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#2C2A29] uppercase tracking-wide">
                Správa preddefinovaných textov & šablón informovaných súhlasov
              </h2>
              <p className="text-xs text-[#8C857B]">
                Úprava znenia operačných techník, špecifických rizík a pooperačných pokynov (§ 6 zákona č. 576/2004 Z. z.)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              title="Zálohovať šablóny do JSON"
              className="px-3 py-1.5 rounded-lg border border-[#E8E2D9] bg-white text-xs font-semibold text-[#2C2A29] hover:bg-[#FBF9F6] flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Export</span>
            </button>

            <label 
              title="Obnoviť šablóny zo zálohy JSON"
              className="px-3 py-1.5 rounded-lg border border-[#E8E2D9] bg-white text-xs font-semibold text-[#2C2A29] hover:bg-[#FBF9F6] flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Import</span>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#E8E2D9]/50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* STATUS HLÁSENIE */}
        {statusMessage && (
          <div className={`px-6 py-2 text-xs font-semibold flex items-center gap-2 transition-all ${
            statusMessage.type === 'success' 
              ? 'bg-[#10B981]/15 text-[#047857] border-b border-[#10B981]/30' 
              : 'bg-[#EF4444]/15 text-[#B91C1C] border-b border-[#EF4444]/30'
          }`}>
            {statusMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* TELO MODÁLU: 2-STĹPCOVÝ LAYOUT */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* ĽAVÝ PANEL: ZOZNAM ŠABLÓN */}
          <div className="w-80 bg-white border-r border-[#E8E2D9] flex flex-col">
            
            {/* Vyhľadávanie a tlačidlo novej šablóny */}
            <div className="p-3 border-b border-[#E8E2D9] space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8C857B]" />
                <input
                  type="text"
                  placeholder="Hľadať výkon v katalógu..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E8E2D9] rounded-lg focus:outline-hidden focus:border-[#C5A059]"
                />
              </div>

              <button
                type="button"
                onClick={handleCreateNew}
                className="w-full py-2 px-3 bg-[#C5A059]/10 text-[#C5A059] hover:bg-[#C5A059]/20 border border-[#C5A059]/30 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Pridať novú šablónu výkonu</span>
              </button>
            </div>

            {/* Zoznam položiek */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredKeys.map(key => {
                const item = database[key];
                const isSelected = selectedId === key;
                const isItemCustom = customIds.includes(key);

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelect(key)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex flex-col gap-1 cursor-pointer ${
                      isSelected 
                        ? 'bg-[#2C2A29] text-white shadow-xs' 
                        : 'hover:bg-[#FAF8F5] text-[#2C2A29] border border-transparent hover:border-[#E8E2D9]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-bold line-clamp-2 leading-tight">
                        {item.procedureName}
                      </span>
                      {isItemCustom && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                          isSelected ? 'bg-[#C5A059] text-[#2C2A29]' : 'bg-[#C5A059]/20 text-[#C5A059]'
                        }`}>
                          Upravené
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] truncate ${isSelected ? 'text-[#C5A059]' : 'text-[#8C857B]'}`}>
                      {item.anatomicalArea}
                    </span>
                  </button>
                );
              })}

              {filteredKeys.length === 0 && (
                <div className="p-6 text-center text-xs text-[#8C857B]">
                  Nenašli sa žiadne šablóny pre zadaný výraz.
                </div>
              )}
            </div>

            {/* Spodný reset panel */}
            <div className="p-3 border-t border-[#E8E2D9] bg-[#FAF8F5]">
              <button
                type="button"
                onClick={handleResetAll}
                className="w-full py-1.5 text-[11px] text-[#8C857B] hover:text-[#B91C1C] hover:underline flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Obnoviť všetky šablóny na predvolené</span>
              </button>
            </div>
          </div>

          {/* PRAVÝ PANEL: KOMPLETNÝ EDITOR ŠABLÓNY */}
          {editingProfile ? (
            <div className="flex-1 flex flex-col bg-[#FAF8F5] overflow-y-auto">
              
              {/* Horná lišta editora s akciami */}
              <div className="sticky top-0 bg-white/95 backdrop-blur-xs px-6 py-3 border-b border-[#E8E2D9] flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#C5A059] uppercase tracking-wider">
                    Úprava šablóny:
                  </span>
                  <span className="text-xs font-bold text-[#2C2A29] max-w-md truncate">
                    {editingProfile.procedureName}
                  </span>
                  {isCustomized && (
                    <span className="text-[10px] bg-[#C5A059]/20 text-[#C5A059] px-2 py-0.5 rounded font-bold">
                      Používateľsky upravené
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isOriginalBuiltIn && isCustomized && (
                    <button
                      type="button"
                      onClick={handleResetSingle}
                      className="px-3 py-1.5 rounded-lg border border-[#E8E2D9] bg-white text-xs font-semibold text-[#8C857B] hover:text-[#B91C1C] hover:bg-white flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Obnoviť pôvodné znenie</span>
                    </button>
                  )}

                  {!isOriginalBuiltIn && (
                    <button
                      type="button"
                      onClick={handleDeleteCustom}
                      className="px-3 py-1.5 rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 text-xs font-semibold text-[#B91C1C] hover:bg-[#EF4444]/20 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Vymazať šablónu</span>
                    </button>
                  )}

                  {onSelectAndApply && (
                    <button
                      type="button"
                      onClick={() => {
                        handleSave();
                        if (editingProfile) {
                          onSelectAndApply(editingProfile);
                          onClose();
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#2C2A29] text-white text-xs font-bold hover:bg-black flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>Použiť v otvorenom zázname</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-4 py-1.5 rounded-lg bg-[#C5A059] text-white text-xs font-bold hover:bg-[#b08d48] flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Uložiť šablónu</span>
                  </button>
                </div>
              </div>

              {/* Formulárové polia editora */}
              <div className="p-6 space-y-6">

                {/* 1. ZÁKLADNÉ ÚDAJE OPERÁCIE */}
                <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] space-y-4 shadow-2xs">
                  <div className="flex items-center gap-2 border-b border-[#E8E2D9] pb-2">
                    <FileText className="w-4 h-4 text-[#C5A059]" />
                    <h3 className="text-xs font-bold text-[#2C2A29] uppercase tracking-wider">
                      1. Základné parametre výkonu
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-[#8C857B] uppercase mb-1">
                        Názov operačného výkonu
                      </label>
                      <input
                        type="text"
                        value={editingProfile.procedureName}
                        onChange={e => setEditingProfile({ ...editingProfile, procedureName: e.target.value })}
                        className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-[#FAF8F5] font-bold text-[#2C2A29] focus:bg-white focus:border-[#C5A059]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#8C857B] uppercase mb-1">
                        Anatomická oblasť a lokalizácia
                      </label>
                      <input
                        type="text"
                        value={editingProfile.anatomicalArea}
                        onChange={e => setEditingProfile({ ...editingProfile, anatomicalArea: e.target.value })}
                        className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-[#FAF8F5] focus:bg-white focus:border-[#C5A059]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#8C857B] uppercase mb-1">
                        Predvolený druh anestézie
                      </label>
                      <select
                        value={editingProfile.anesthesiaType}
                        onChange={e => setEditingProfile({ ...editingProfile, anesthesiaType: e.target.value })}
                        className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-[#FAF8F5] font-medium focus:bg-white focus:border-[#C5A059]"
                      >
                        <option value="Celková anestézia">Celková anestézia</option>
                        <option value="Analgosedácia">Analgosedácia</option>
                        <option value="Lokálna anestézia">Lokálna anestézia</option>
                        <option value="Zvodová (regionálna) anestézia">Zvodová anestézia</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-[#8C857B] uppercase mb-1">
                        Kľúčové slová pre automatické párovanie (oddelené čiarkou)
                      </label>
                      <input
                        type="text"
                        value={(editingProfile.keywords || []).join(', ')}
                        onChange={e => setEditingProfile({ 
                          ...editingProfile, 
                          keywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                        })}
                        placeholder="napr. augmentacia, zvacsenie prsnikov, silikonove implantaty"
                        className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-[#FAF8F5] focus:bg-white focus:border-[#C5A059]"
                      />
                      <span className="text-[9px] text-[#8C857B] mt-0.5 block">
                        Keď lekár napíše alebo vyberie niektoré z týchto kľúčových slov, táto šablóna sa automaticky načíta.
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. MEDICÍNSKY POPIS A TECHNIKA */}
                <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] space-y-4 shadow-2xs">
                  <div className="flex items-center gap-2 border-b border-[#E8E2D9] pb-2">
                    <FileText className="w-4 h-4 text-[#C5A059]" />
                    <h3 className="text-xs font-bold text-[#2C2A29] uppercase tracking-wider">
                      2. Účel, povaha, technika a alternatívy (§ 6 ods. 1 zákona)
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-[#8C857B] uppercase mb-1">
                        Účel a povaha operačného výkonu
                      </label>
                      <textarea
                        rows={3}
                        value={editingProfile.purposeAndNature}
                        onChange={e => setEditingProfile({ ...editingProfile, purposeAndNature: e.target.value })}
                        className="w-full border border-[#E8E2D9] p-2.5 rounded-lg text-xs bg-[#FAF8F5] focus:bg-white focus:border-[#C5A059] leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#8C857B] uppercase mb-1">
                        Predpokladaný postup a operačná technika
                      </label>
                      <textarea
                        rows={4}
                        value={editingProfile.technique}
                        onChange={e => setEditingProfile({ ...editingProfile, technique: e.target.value })}
                        className="w-full border border-[#E8E2D9] p-2.5 rounded-lg text-xs bg-[#FAF8F5] focus:bg-white focus:border-[#C5A059] leading-relaxed"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-[#8C857B] uppercase mb-1">
                          Možné alternatívy k výkonu
                        </label>
                        <textarea
                          rows={2}
                          value={editingProfile.alternatives}
                          onChange={e => setEditingProfile({ ...editingProfile, alternatives: e.target.value })}
                          className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-[#FAF8F5] focus:bg-white focus:border-[#C5A059]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#8C857B] uppercase mb-1">
                          Dôsledky odmietnutia výkonu
                        </label>
                        <textarea
                          rows={2}
                          value={editingProfile.refusalConsequences}
                          onChange={e => setEditingProfile({ ...editingProfile, refusalConsequences: e.target.value })}
                          className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-[#FAF8F5] focus:bg-white focus:border-[#C5A059]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. ŠPECIFICKÉ RIZIKÁ A KOMPLIKÁCIE */}
                <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-[#C5A059]" />
                      <h3 className="text-xs font-bold text-[#2C2A29] uppercase tracking-wider">
                        3. Špecifické riziká & komplikácie viazané na tento výkon
                      </h3>
                    </div>
                  </div>

                  <div>
                    <textarea
                      rows={5}
                      value={editingProfile.specificRisks}
                      onChange={e => setEditingProfile({ ...editingProfile, specificRisks: e.target.value })}
                      className="w-full border border-[#E8E2D9] p-3 rounded-lg text-xs bg-[#FAF8F5] focus:bg-white focus:border-[#C5A059] leading-relaxed font-medium text-[#2C2A29]"
                    />
                    <span className="text-[9px] text-[#8C857B] mt-1 block">
                      Všeobecné chirurgické riziká (infekcia, krvácanie, trombóza, anestézia) sú automaticky zahrnuté v zákonom danom znení; sem uveďte špecifiká operácie.
                    </span>
                  </div>
                </div>

                {/* 4. POOPERAČNÁ STAROSTLIVOSŤ A POKYNY */}
                <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] space-y-4 shadow-2xs">
                  <div className="flex items-center gap-2 border-b border-[#E8E2D9] pb-2">
                    <Check className="w-4 h-4 text-[#C5A059]" />
                    <h3 className="text-xs font-bold text-[#2C2A29] uppercase tracking-wider">
                      4. Pooperačný režim, obmedzenia a harmonogram kontrol
                    </h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-[#8C857B] uppercase mb-0.5">
                        Kľudový režim a polohovanie
                      </label>
                      <textarea
                        rows={2}
                        value={editingProfile.postopCare.restAndPositioning}
                        onChange={e => setEditingProfile({
                          ...editingProfile,
                          postopCare: { ...editingProfile.postopCare, restAndPositioning: e.target.value }
                        })}
                        className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FAF8F5] focus:bg-white focus:border-[#C5A059]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#8C857B] uppercase mb-0.5">
                        Kompresívna / fixačná bielizeň a obväzy
                      </label>
                      <textarea
                        rows={2}
                        value={editingProfile.postopCare.compressionGarment}
                        onChange={e => setEditingProfile({
                          ...editingProfile,
                          postopCare: { ...editingProfile.postopCare, compressionGarment: e.target.value }
                        })}
                        className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FAF8F5] focus:bg-white focus:border-[#C5A059]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#8C857B] uppercase mb-0.5">
                        Fyzické obmedzenia a šport
                      </label>
                      <textarea
                        rows={2}
                        value={editingProfile.postopCare.physicalRestrictions}
                        onChange={e => setEditingProfile({
                          ...editingProfile,
                          postopCare: { ...editingProfile.postopCare, physicalRestrictions: e.target.value }
                        })}
                        className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FAF8F5] focus:bg-white focus:border-[#C5A059]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#8C857B] uppercase mb-0.5">
                        Starostlivosť o rany, stehy a jazvy
                      </label>
                      <textarea
                        rows={2}
                        value={editingProfile.postopCare.woundCare}
                        onChange={e => setEditingProfile({
                          ...editingProfile,
                          postopCare: { ...editingProfile.postopCare, woundCare: e.target.value }
                        })}
                        className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FAF8F5] focus:bg-white focus:border-[#C5A059]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#8C857B] uppercase mb-0.5">
                        Environmentálne obmedzenia (voda, sauna, slnko)
                      </label>
                      <textarea
                        rows={2}
                        value={editingProfile.postopCare.environmentalRestrictions}
                        onChange={e => setEditingProfile({
                          ...editingProfile,
                          postopCare: { ...editingProfile.postopCare, environmentalRestrictions: e.target.value }
                        })}
                        className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FAF8F5] focus:bg-white focus:border-[#C5A059]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-[#8C857B] uppercase mb-0.5">
                          Medikamentózna liečba
                        </label>
                        <input
                          type="text"
                          value={editingProfile.postopCare.medication}
                          onChange={e => setEditingProfile({
                            ...editingProfile,
                            postopCare: { ...editingProfile.postopCare, medication: e.target.value }
                          })}
                          className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FAF8F5] focus:bg-white focus:border-[#C5A059]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#8C857B] uppercase mb-0.5">
                          Harmonogram kontrol
                        </label>
                        <input
                          type="text"
                          value={editingProfile.postopCare.checkupSchedule}
                          onChange={e => setEditingProfile({
                            ...editingProfile,
                            postopCare: { ...editingProfile.postopCare, checkupSchedule: e.target.value }
                          })}
                          className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FAF8F5] focus:bg-white focus:border-[#C5A059]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Spodné tlačidlo uloženia */}
                <div className="flex justify-end gap-3 pt-2 pb-6">
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-6 py-2.5 rounded-xl bg-[#C5A059] text-white text-xs font-bold hover:bg-[#b08d48] flex items-center gap-2 shadow-md cursor-pointer transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>Uložiť všetky zmeny tejto šablóny</span>
                  </button>
                </div>

              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-[#8C857B]">
              Vyberte šablónu zo zoznamu vľavo alebo vytvorte novú.
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
