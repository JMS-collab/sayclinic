'use client';

import React, { useState } from 'react';
import { 
  NevusExcisionData, 
  ExcisionLesionItem, 
  EXCISION_PRESETS, 
  COMMON_LOCATIONS, 
  COMMON_DIAGNOSES,
  ExcisionMethod
} from './nevusExcisionTypes';
import { 
  Scissors, 
  Sparkles, 
  Plus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  Receipt, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  FileCheck,
  Tag,
  Stethoscope
} from 'lucide-react';

interface NevusExcisionEditorProps {
  data: NevusExcisionData;
  onChange: (data: NevusExcisionData) => void;
}

export default function NevusExcisionEditor({ data, onChange }: NevusExcisionEditorProps) {
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'chirurgia' | 'laser' | 'histologia'>('all');

  const updateField = <K extends keyof NevusExcisionData>(field: K, value: NevusExcisionData[K]) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  // Výpočet zúčtovania
  const subtotal = data.items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  const discountAmount = data.discountType === 'percent'
    ? Math.round(((subtotal * (Number(data.discountValue) || 0)) / 100) * 100) / 100
    : Math.min(Number(data.discountValue) || 0, subtotal);
  const finalTotalPrice = Math.max(0, subtotal - discountAmount);

  // Pridanie položky z cenníka
  const handleAddPresetItem = (presetId: string) => {
    const preset = EXCISION_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    const count = data.items.length + 1;
    const newItem: ExcisionLesionItem = {
      id: `lesion-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      location: COMMON_LOCATIONS[0],
      typeOrDiagnosis: preset.category === 'histologia' 
        ? 'Histopatologické bioptické overenie' 
        : COMMON_DIAGNOSES[0],
      method: preset.defaultMethod,
      methodLabel: preset.name,
      histology: preset.defaultHistology,
      histologyCode: preset.defaultHistology ? `Nádobka č. ${count}` : undefined,
      sutureType: preset.defaultSuture,
      sutureRemovalDays: preset.defaultMethod === 'laser_vaporizacia' 
        ? 'Bez stehov (hojenie pod chrastou)' 
        : '10 – 12 dní (trup) / 5 – 7 dní (tvár)',
      price: preset.defaultPrice
    };

    updateField('items', [...data.items, newItem]);
  };

  // Pridanie vlastnej položky
  const handleAddCustomItem = () => {
    const count = data.items.length + 1;
    const isLaser = data.primaryMethod === 'laser';
    const newItem: ExcisionLesionItem = {
      id: `lesion-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      location: COMMON_LOCATIONS[0],
      typeOrDiagnosis: COMMON_DIAGNOSES[0],
      method: isLaser ? 'laser_vaporizacia' : 'chirurgicka_excizia',
      methodLabel: isLaser ? 'CO2 Laserové odstránenie' : 'Chirurgická excízia',
      histology: !isLaser,
      histologyCode: !isLaser ? `Nádobka č. ${count}` : undefined,
      sutureType: isLaser ? 'Bez sutúry' : 'Intradermálna sutúra (Prolene 5-0)',
      sutureRemovalDays: isLaser ? 'Bez stehov' : '10 – 12 dní',
      price: isLaser ? 50 : 90
    };

    updateField('items', [...data.items, newItem]);
  };

  // Úprava konkrétnej položky
  const handleUpdateItem = (index: number, updates: Partial<ExcisionLesionItem>) => {
    const next = [...data.items];
    next[index] = { ...next[index], ...updates };
    updateField('items', next);
  };

  // Zmazanie položky
  const handleDeleteItem = (index: number) => {
    const next = data.items.filter((_, i) => i !== index);
    updateField('items', next);
  };

  // Zmena hlavnej metódy s prednastavením textu
  const handleMethodChange = (m: ExcisionMethod) => {
    let newCourse = data.procedureCourse;
    if (m === 'laser') {
      newCourse = 'V lokálnej anestézii po dôkladnej dezinfekcii vykonaná cielená ablácia a vaporizácia lézií frakčným/kontinuálnym CO2 laserom. Spodina vaporizovaná do úrovne retikulárnej dermis, okamžitá koagulácia kapilár. Rany ošetrené antibakteriálnou masťou a kryté sterilnou náplasťou. Bez sutúry, hojenie per secundam pod chrastou.';
    } else if (m === 'chirurgicky') {
      newCourse = 'V lokálnej infiltračnej anestézii po dôkladnej dezinfekcii a sterilnom zarúškovaní vykonaná eliptická excízia v Langerových líniách štiepiteľnosti kože. Elektrokoagulačná hemostáza spodiny. Rany uzatvorené intradermálnym pokračujúcim stehom / jednotlivými uzličkovými stehmi. Sterilné krytie.';
    } else {
      newCourse = 'Kombinovaný zákrok: Suspektné a hlbšie prejavy excidované chirurgicky skalpelom so sutúrou a odoslané na histopatológiu. Drobné a benígne seboroické prejavy vaporizované CO2 laserom bez nutnosti šitia. Dôsledná hemostáza a sterilné ošetrenie.';
    }

    onChange({
      ...data,
      primaryMethod: m,
      procedureCourse: newCourse
    });
  };

  return (
    <div className="space-y-6 text-xs text-[#2C2A29]">
      {/* 1. VÝBER METÓDY A ZÁKLADNÉ NASTAVENIE ZÁKROKU */}
      <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E2D9] pb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#C5A059] block">
              Záznam o výkone • Dermatologická & Plastická chirurgia
            </span>
            <h3 className="text-sm sm:text-base font-bold text-[#2C2A29] mt-0.5">
              Odstránenie kožných névov a lézií
            </h3>
          </div>
          <span className="text-[10px] font-bold bg-[#C5A059]/15 text-[#9C7D2B] px-3 py-1 rounded-full border border-[#C5A059]/30">
            SAY CLINIC Štandard
          </span>
        </div>

        {/* PREPÍNAČ HLAVNEJ METÓDY */}
        <div>
          <label className="block text-[10px] font-bold text-[#8C857B] uppercase mb-2">
            Prevládajúca metóda odstránenia:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => handleMethodChange('chirurgicky')}
              className={`p-3 rounded-xl border font-bold text-left transition-all flex items-center gap-3 cursor-pointer ${
                data.primaryMethod === 'chirurgicky'
                  ? 'bg-[#2C2A29] text-white border-[#2C2A29] shadow-sm'
                  : 'bg-white text-[#2C2A29] border-[#E8E2D9] hover:border-[#C5A059]'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${data.primaryMethod === 'chirurgicky' ? 'bg-[#C5A059] text-white' : 'bg-[#FAF8F5] text-[#C5A059]'}`}>
                <Scissors className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs">Chirurgická excízia</p>
                <p className={`text-[10px] font-normal ${data.primaryMethod === 'chirurgicky' ? 'text-white/80' : 'text-[#8C857B]'}`}>
                  Skalpel, sutúra & histológia
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleMethodChange('laser')}
              className={`p-3 rounded-xl border font-bold text-left transition-all flex items-center gap-3 cursor-pointer ${
                data.primaryMethod === 'laser'
                  ? 'bg-[#2C2A29] text-white border-[#2C2A29] shadow-sm'
                  : 'bg-white text-[#2C2A29] border-[#E8E2D9] hover:border-[#C5A059]'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${data.primaryMethod === 'laser' ? 'bg-[#C5A059] text-white' : 'bg-[#FAF8F5] text-[#C5A059]'}`}>
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs">CO2 Laserová ablácia</p>
                <p className={`text-[10px] font-normal ${data.primaryMethod === 'laser' ? 'text-white/80' : 'text-[#8C857B]'}`}>
                  Bez rezu, bez šitia, pod chrastou
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleMethodChange('kombinovane')}
              className={`p-3 rounded-xl border font-bold text-left transition-all flex items-center gap-3 cursor-pointer ${
                data.primaryMethod === 'kombinovane'
                  ? 'bg-[#2C2A29] text-white border-[#2C2A29] shadow-sm'
                  : 'bg-white text-[#2C2A29] border-[#E8E2D9] hover:border-[#C5A059]'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${data.primaryMethod === 'kombinovane' ? 'bg-[#C5A059] text-white' : 'bg-[#FAF8F5] text-[#C5A059]'}`}>
                <Stethoscope className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs">Kombinovaný zákrok</p>
                <p className={`text-[10px] font-normal ${data.primaryMethod === 'kombinovane' ? 'text-white/80' : 'text-[#8C857B]'}`}>
                  Chirurgia + Laser v sedení
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* KLINICKÉ PARAMETRE VÝKONU */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div>
            <label className="block text-[10px] font-bold text-[#8C857B] mb-1">
              Indikácia zákroku:
            </label>
            <input
              type="text"
              value={data.indication}
              onChange={(e) => updateField('indication', e.target.value)}
              className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white text-xs"
              placeholder="napr. Onkodermatologická / Estetická..."
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#8C857B] mb-1">
              Lokálna anestézia:
            </label>
            <input
              type="text"
              value={data.anesthesiaType}
              onChange={(e) => updateField('anesthesiaType', e.target.value)}
              className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white text-xs"
              placeholder="Mesocain 1% s Adrenalínom..."
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#8C857B] mb-1">
              Objem anestézie & Dezinfekcia:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={data.anesthesiaVolume}
                onChange={(e) => updateField('anesthesiaVolume', e.target.value)}
                className="w-1/3 border border-[#E8E2D9] p-2 rounded-lg bg-white text-xs font-mono"
                placeholder="3.0 ml"
              />
              <input
                type="text"
                value={data.disinfection}
                onChange={(e) => updateField('disinfection', e.target.value)}
                className="w-2/3 border border-[#E8E2D9] p-2 rounded-lg bg-white text-xs"
                placeholder="Skinman Soft..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. RÝCHLY VÝBER POLOŽIEK Z CENNÍKA (KATALÓG AKO PRI VÝPLNIACH) */}
      <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E2D9] pb-3">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#C5A059]" />
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#2C2A29]">
              Katalóg výkonov & Cenník (Rýchle pridanie položky)
            </h4>
          </div>

          {/* Filtre kategórií */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                activeCategoryFilter === 'all'
                  ? 'bg-[#2C2A29] text-white'
                  : 'bg-[#FAF8F5] text-[#8C857B] hover:text-[#2C2A29]'
              }`}
            >
              Všetko
            </button>
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('chirurgia')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                activeCategoryFilter === 'chirurgia'
                  ? 'bg-[#2C2A29] text-white'
                  : 'bg-[#FAF8F5] text-[#8C857B] hover:text-[#2C2A29]'
              }`}
            >
              Chirurgia
            </button>
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('laser')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                activeCategoryFilter === 'laser'
                  ? 'bg-[#2C2A29] text-white'
                  : 'bg-[#FAF8F5] text-[#8C857B] hover:text-[#2C2A29]'
              }`}
            >
              Laser
            </button>
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('histologia')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                activeCategoryFilter === 'histologia'
                  ? 'bg-[#2C2A29] text-white'
                  : 'bg-[#FAF8F5] text-[#8C857B] hover:text-[#2C2A29]'
              }`}
            >
              Histológia
            </button>
          </div>
        </div>

        {/* MRIEŽKA PREDNASTAVENÝCH POLOŽIEK NA 1-KLIK */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {EXCISION_PRESETS
            .filter(p => activeCategoryFilter === 'all' || p.category === activeCategoryFilter)
            .map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleAddPresetItem(preset.id)}
                className="p-2.5 rounded-xl border border-[#E8E2D9] hover:border-[#C5A059] bg-[#FAF8F5]/80 hover:bg-white text-left transition-all shadow-2xs group flex items-start justify-between gap-2 cursor-pointer"
              >
                <div className="space-y-0.5 min-w-0">
                  <p className="font-bold text-xs text-[#2C2A29] group-hover:text-[#C5A059] transition-colors truncate">
                    {preset.name}
                  </p>
                  <p className="text-[10px] text-[#8C857B] line-clamp-1">
                    {preset.description}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                  <span className="font-bold font-mono text-xs text-[#2C2A29] bg-white group-hover:bg-[#C5A059] group-hover:text-white px-2 py-0.5 rounded-md border border-[#E8E2D9] transition-colors">
                    {preset.defaultPrice} €
                  </span>
                  <Plus className="w-3.5 h-3.5 text-[#C5A059]" />
                </div>
              </button>
            ))}
        </div>
      </div>

      {/* 3. ROZPIS ZVOLENÝCH POLOŽIEK / LÉZIÍ (S DETAILMI A CENOU) */}
      <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E2D9] pb-3">
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#2C2A29]">
              Zoznam odstraňovaných lézií a výkonov ({data.items.length})
            </h4>
            <p className="text-[10px] text-[#8C857B]">
              Lokalizácia, diagnostika, metóda odstránenia, sutúra a cena položky
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddCustomItem}
            className="px-3 py-1.5 bg-[#2C2A29] hover:bg-[#C5A059] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Pridať vlastný riadok</span>
          </button>
        </div>

        {data.items.length === 0 ? (
          <div className="text-center py-8 px-4 bg-[#FAF8F5]/60 rounded-xl border border-dashed border-[#E8E2D9] space-y-2">
            <p className="text-xs text-[#8C857B]">
              Zatiaľ ste nepridali žiadnu léziu. Kliknite na položku z katalógu vyššie alebo na „+ Pridať vlastný riadok“.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.items.map((item, idx) => (
              <div 
                key={item.id}
                className="p-3.5 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5]/50 hover:bg-white hover:border-[#C5A059]/60 transition-all space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#2C2A29] text-[#C5A059] font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-xs text-[#2C2A29]">
                      Lézia #{idx + 1}
                    </span>
                    <span className="text-[10px] font-semibold text-[#8C857B] bg-white px-2 py-0.5 rounded border border-[#E8E2D9]">
                      {item.method === 'chirurgicka_excizia' ? 'Chirurgia' : item.method === 'laser_vaporizacia' ? 'CO2 Laser' : 'Shave'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-[#8C857B] font-bold uppercase">Cena:</span>
                      <input
                        type="number"
                        min="0"
                        step="5"
                        value={item.price}
                        onChange={(e) => handleUpdateItem(idx, { price: parseFloat(e.target.value) || 0 })}
                        className="w-20 border border-[#E8E2D9] p-1.5 rounded-lg text-right font-bold font-mono text-xs bg-white text-[#2C2A29]"
                      />
                      <span className="font-bold text-xs text-[#2C2A29]">€</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteItem(idx)}
                      className="text-[#8C857B] hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Odstrániť položku"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* FORMULÁR PRE POLOŽKU */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[9px] font-bold text-[#8C857B] uppercase mb-0.5">
                      Lokalizácia
                    </label>
                    <input
                      type="text"
                      list={`loc-list-${idx}`}
                      value={item.location}
                      onChange={(e) => handleUpdateItem(idx, { location: e.target.value })}
                      placeholder="napr. Tvár – líce, Chrbát..."
                      className="w-full border border-[#E8E2D9] p-1.5 rounded-lg bg-white text-xs"
                    />
                    <datalist id={`loc-list-${idx}`}>
                      {COMMON_LOCATIONS.map((loc, lIdx) => (
                        <option key={lIdx} value={loc} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-[#8C857B] uppercase mb-0.5">
                      Typ lézie / Predbežná dg
                    </label>
                    <input
                      type="text"
                      list={`diag-list-${idx}`}
                      value={item.typeOrDiagnosis}
                      onChange={(e) => handleUpdateItem(idx, { typeOrDiagnosis: e.target.value })}
                      placeholder="Melanocytový névus..."
                      className="w-full border border-[#E8E2D9] p-1.5 rounded-lg bg-white text-xs"
                    />
                    <datalist id={`diag-list-${idx}`}>
                      {COMMON_DIAGNOSES.map((d, dIdx) => (
                        <option key={dIdx} value={d} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-[#8C857B] uppercase mb-0.5">
                      Metóda odstránenia
                    </label>
                    <select
                      value={item.method}
                      onChange={(e) => {
                        const m = e.target.value as any;
                        const label = m === 'laser_vaporizacia' 
                          ? 'CO2 Laserová vaporizácia' 
                          : m === 'shave_excizia' 
                          ? 'Shave excízia' 
                          : 'Chirurgická excízia so sutúrou';
                        handleUpdateItem(idx, { 
                          method: m, 
                          methodLabel: label,
                          histology: m !== 'laser_vaporizacia',
                          sutureType: m === 'laser_vaporizacia' ? 'Bez sutúry' : item.sutureType
                        });
                      }}
                      className="w-full border border-[#E8E2D9] p-1.5 rounded-lg bg-white text-xs"
                    >
                      <option value="chirurgicka_excizia">Chirurgická excízia so sutúrou</option>
                      <option value="laser_vaporizacia">CO2 Laserová vaporizácia (bez stehov)</option>
                      <option value="shave_excizia">Shave excízia (tangenciálny rez)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-[#8C857B] uppercase mb-0.5">
                      Sutúra & Stehy
                    </label>
                    <input
                      type="text"
                      value={item.sutureType}
                      onChange={(e) => handleUpdateItem(idx, { sutureType: e.target.value })}
                      placeholder="Intradermálny Prolene 5-0 / Bez stehov..."
                      className="w-full border border-[#E8E2D9] p-1.5 rounded-lg bg-white text-xs"
                    />
                  </div>
                </div>

                {/* HISTOLÓGIA & TERMÍN STEHOV */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#E8E2D9]/70 text-[11px]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.histology}
                      onChange={(e) => handleUpdateItem(idx, { 
                        histology: e.target.checked,
                        histologyCode: e.target.checked ? (item.histologyCode || `Nádobka č. ${idx + 1}`) : undefined
                      })}
                      className="w-3.5 h-3.5 text-[#C5A059] rounded cursor-pointer"
                    />
                    <span className="font-semibold text-[#2C2A29]">
                      Odoslané na histopatologické vyšetrenie
                    </span>
                    {item.histology && (
                      <input
                        type="text"
                        value={item.histologyCode || ''}
                        onChange={(e) => handleUpdateItem(idx, { histologyCode: e.target.value })}
                        placeholder="Označenie nádobky..."
                        className="border border-[#E8E2D9] px-2 py-0.5 rounded text-[10px] bg-white font-mono ml-1"
                      />
                    )}
                  </label>

                  <div className="flex items-center gap-1.5 text-[#8C857B]">
                    <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span className="text-[10px]">Vybratie stehov:</span>
                    <input
                      type="text"
                      value={item.sutureRemovalDays}
                      onChange={(e) => handleUpdateItem(idx, { sutureRemovalDays: e.target.value })}
                      className="border border-[#E8E2D9] px-2 py-0.5 rounded text-[10px] bg-white"
                      placeholder="10 – 12 dní..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. ZÚČTOVANIE NA KONCI (PRESNÉ AKO PRI VÝPLNIACH) */}
      <div className="bg-white border-2 border-[#C5A059]/40 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#C5A059]" />
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#2C2A29]">
              Zúčtovanie výkonu & Platobné podmienky
            </h4>
          </div>
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Klinické zúčtovanie
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* ĽAVÁ ČASŤ: ZĽAVA A PLATOBNÉ PARAMETRE */}
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-[#8C857B] uppercase mb-1">
                Zľava pre klienta:
              </label>
              <div className="flex gap-2">
                <select
                  value={data.discountType}
                  onChange={(e) => updateField('discountType', e.target.value as 'percent' | 'fixed')}
                  className="border border-[#E8E2D9] p-2 rounded-lg bg-white text-xs font-semibold"
                >
                  <option value="percent">Percentuálna (%)</option>
                  <option value="fixed">Pevná suma (€)</option>
                </select>

                <input
                  type="number"
                  min="0"
                  step={data.discountType === 'percent' ? '5' : '10'}
                  value={data.discountValue}
                  onChange={(e) => updateField('discountValue', parseFloat(e.target.value) || 0)}
                  placeholder="Hodnota zľavy..."
                  className="w-28 border border-[#E8E2D9] p-2 rounded-lg bg-white text-xs font-bold text-right font-mono"
                />
                <span className="self-center font-bold text-xs text-[#8C857B]">
                  {data.discountType === 'percent' ? '%' : '€'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="block text-[10px] font-bold text-[#8C857B] uppercase mb-1">
                  Spôsob platby:
                </label>
                <select
                  value={data.paymentMethod}
                  onChange={(e) => updateField('paymentMethod', e.target.value as any)}
                  className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white text-xs"
                >
                  <option value="karta">💳 Platobná karta</option>
                  <option value="hotovost">💵 V hotovosti</option>
                  <option value="prevod">🏦 Prevod na účet</option>
                  <option value="poukaz">🎁 Darčekový poukaz</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#8C857B] uppercase mb-1">
                  Stav úhrady:
                </label>
                <select
                  value={data.paymentStatus}
                  onChange={(e) => updateField('paymentStatus', e.target.value as any)}
                  className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white text-xs font-semibold"
                >
                  <option value="uhradene">✅ Uhradené na mieste (POS)</option>
                  <option value="pos_caka">⏳ Čakajúci účet v POS</option>
                  <option value="faktura">📄 Vystaviť faktúru</option>
                </select>
              </div>
            </div>
          </div>

          {/* PRAVÁ ČASŤ: PREHĽADNÝ SÚHRN SUMÁRU */}
          <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E8E2D9] space-y-2 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#8C857B]">Počet odstránených položiek:</span>
                <span className="font-bold text-[#2C2A29]">{data.items.length} ks</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-[#8C857B]">Medzisúčet (Subtotal):</span>
                <span className="font-bold font-mono text-[#2C2A29]">{subtotal.toFixed(2)} €</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-xs text-emerald-700">
                  <span>Zľava {data.discountType === 'percent' ? `(${data.discountValue} %)` : '(pevná suma)'}:</span>
                  <span className="font-bold font-mono">- {discountAmount.toFixed(2)} €</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-[#E8E2D9] flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C857B] block">
                  Celková cena k úhrade:
                </span>
                <span className="text-xs font-semibold text-[#8C857B]">
                  {data.paymentMethod === 'karta' ? 'Platobná karta' : data.paymentMethod === 'hotovost' ? 'V hotovosti' : data.paymentMethod === 'prevod' ? 'Prevod' : 'Poukaz'}
                </span>
              </div>
              <div className="bg-white border border-[#C5A059] px-3.5 py-1.5 rounded-xl shadow-2xs text-right">
                <span className="text-lg font-black font-mono text-[#2C2A29]">
                  {finalTotalPrice.toFixed(2)} €
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. PRIEBEH ZÁKROKU & POOPERAČNÉ POUČENIE */}
      <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-[#E8E2D9] pb-2">
          <FileCheck className="w-4 h-4 text-[#C5A059]" />
          <h4 className="font-bold text-xs uppercase tracking-wider text-[#2C2A29]">
            Operačný popis, stehy & pooperačný protokol pre pacienta
          </h4>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-[#8C857B] uppercase mb-1">
              Podrobný popis priebehu výkonu:
            </label>
            <textarea
              rows={3}
              value={data.procedureCourse}
              onChange={(e) => updateField('procedureCourse', e.target.value)}
              className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white text-xs leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-[#8C857B] uppercase mb-1">
                Vybratie stehov & Kontrola:
              </label>
              <input
                type="text"
                value={data.sutureRemovalNotes}
                onChange={(e) => updateField('sutureRemovalNotes', e.target.value)}
                className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#8C857B] uppercase mb-1">
                Histopatologické overenie:
              </label>
              <input
                type="text"
                value={data.histologyNotice}
                onChange={(e) => updateField('histologyNotice', e.target.value)}
                className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#8C857B] uppercase mb-1">
              Odporúčania po zákroku a domáca starostlivosť:
            </label>
            <div className="space-y-1.5">
              {data.aftercareInstructions.map((ins, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[#C5A059] font-bold">•</span>
                  <input
                    type="text"
                    value={ins}
                    onChange={(e) => {
                      const updated = [...data.aftercareInstructions];
                      updated[i] = e.target.value;
                      updateField('aftercareInstructions', updated);
                    }}
                    className="flex-1 border border-[#E8E2D9] p-1.5 rounded-lg bg-white text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = data.aftercareInstructions.filter((_, idx) => idx !== i);
                      updateField('aftercareInstructions', updated);
                    }}
                    className="text-[#8C857B] hover:text-rose-600 p-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => updateField('aftercareInstructions', [...data.aftercareInstructions, 'Ďalšie odporúčanie...'])}
                className="text-[10px] text-[#C5A059] font-bold hover:underline cursor-pointer pt-1"
              >
                + Pridať odporúčanie
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
