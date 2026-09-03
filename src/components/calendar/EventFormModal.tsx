'use client';

import React, { useState } from 'react';
import { 
  CalendarEvent, 
  EventType, 
  CLINIC_ROOMS, 
  CLINIC_STAFF, 
  SURGERY_EQUIPMENT_OPTIONS, 
  SURGERY_MATERIAL_OPTIONS, 
  FREEFORM_PRESETS 
} from '@/data/calendarConfig';

interface EventFormModalProps {
  isOpen: boolean;
  isEditing?: boolean;
  initialData: Partial<CalendarEvent>;
  onClose: () => void;
  onSave: (eventData: Partial<CalendarEvent>) => void;
}

export default function EventFormModal({
  isOpen,
  isEditing = false,
  initialData,
  onClose,
  onSave
}: EventFormModalProps) {
  const [formData, setFormData] = useState<Partial<CalendarEvent>>({
    roomId: 'sala_say',
    assignedTo: 'MUDr. Ján Mráz',
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    doctorName: 'MUDr. Ján Mráz',
    title: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    isAllDay: false,
    type: 'operacia',
    freeformCategory: 'obed',
    operator: 'MUDr. Ján Mráz',
    anesthesiologist: 'MUDr. Peter Kováč',
    anesthesiaNurse: 'Bc. Jana Malá',
    scrubNurse: 'Sabina Lenhartová',
    specialEquipment: ['⚡ Liposukcia MicroAire (PAL)'],
    specialEquipmentOther: '',
    materials: ['🍈 Silikónové implantáty Motiva', '👙 Kompresívne prádlo Lipoelastic'],
    materialNotes: '',
    totalPrice: 3500,
    depositAmount: 500,
    isDepositPaid: false,
    notes: '',
    ...initialData
  });

  if (!isOpen) return null;

  const handleTypeChange = (type: EventType) => {
    let price = 0;
    let deposit = 0;
    let room = formData.roomId;

    if (type === 'operacia') {
      price = 3500;
      deposit = 500;
      if (!room || room === 'ambulancia') room = 'sala_say';
    } else if (type === 'konzultacia') {
      price = 50;
      deposit = 0;
      room = 'ambulancia';
    } else if (type === 'osetrenie') {
      price = 200;
      deposit = 50;
      room = 'ambulancia';
    } else if (type === 'kontrola') {
      price = 0;
      deposit = 0;
      room = 'ambulancia';
    } else if (type === 'volno') {
      price = 0;
      deposit = 0;
    }

    setFormData(prev => ({
      ...prev,
      type,
      roomId: room,
      totalPrice: price,
      depositAmount: deposit,
      patientName: type === 'volno' && (!prev.patientName || prev.patientName.trim() === '') ? 'Personál kliniky' : prev.patientName
    }));
  };

  const handleFreeformCategorySelect = (preset: typeof FREEFORM_PRESETS[0]) => {
    setFormData(prev => ({
      ...prev,
      freeformCategory: preset.category,
      title: preset.defaultTitle,
      patientName: 'Personál kliniky'
    }));
  };

  const toggleEquipment = (item: string) => {
    setFormData(prev => {
      const current = prev.specialEquipment || [];
      const updated = current.includes(item)
        ? current.filter(x => x !== item)
        : [...current, item];
      return { ...prev, specialEquipment: updated };
    });
  };

  const toggleMaterial = (item: string) => {
    setFormData(prev => {
      const current = prev.materials || [];
      const updated = current.includes(item)
        ? current.filter(x => x !== item)
        : [...current, item];
      return { ...prev, materials: updated };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Fallback title for freeform
    let finalTitle = formData.title?.trim();
    if (!finalTitle) {
      if (formData.type === 'volno') {
        const found = FREEFORM_PRESETS.find(p => p.category === formData.freeformCategory);
        finalTitle = found ? found.defaultTitle : 'Interná udalosť';
      } else {
        finalTitle = 'Termín bez názvu';
      }
    }

    onSave({
      ...formData,
      title: finalTitle,
      patientName: formData.type === 'volno' ? (formData.patientName || 'Personál kliniky') : formData.patientName
    });
  };

  return (
    <div className="fixed inset-0 bg-[#2C2A29]/70 flex items-center justify-center z-50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white p-5 sm:p-6 rounded-2xl w-full max-w-2xl shadow-2xl border border-[#E8E2D9] my-auto max-h-[92vh] flex flex-col">
        
        {/* HLAVIČKA MODALU */}
        <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-3 mb-4 shrink-0">
          <div>
            <h3 className="font-brand text-lg sm:text-xl font-bold text-[#2C2A29] uppercase">
              {isEditing ? 'Upraviť udalosť / termín' : 'Naplánovať novú udalosť'}
            </h3>
            <p className="text-[10px] uppercase tracking-wider text-[#8C857B]">
              Výber miestnosti, personálu, operačného tímu a materiálov
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* SCROLLOVATEĽNÉ TELO FORMULÁRA */}
        <form onSubmit={handleSubmit} className="overflow-y-auto pr-1 space-y-4 text-xs flex-1">
          
          {/* 1. VÝBER MIESTNOSTI / SÁLY (KALENDÁRA) */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C857B] mb-1.5">
              1. Miestnosť / Sála (Pracovisko) *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CLINIC_ROOMS.map(room => {
                const isSelected = (formData.roomId || 'ambulancia') === room.id;
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, roomId: room.id }))}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#C5A059] bg-[#FBF9F6] shadow-xs ring-2 ring-[#C5A059]/30'
                        : 'border-[#E8E2D9] bg-white hover:border-[#C5A059]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base">{room.icon}</span>
                      {isSelected && <span className="text-[9px] font-bold text-[#C5A059] font-mono">✓ AKTÍVNA</span>}
                    </div>
                    <div>
                      <span className="font-bold text-[11px] text-[#2C2A29] block leading-tight mt-1">{room.name}</span>
                      <span className="text-[9px] text-[#8C857B] block truncate leading-tight mt-0.5">{room.shortName}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. VÝBER TYPU NÁVŠTEVY */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C857B] mb-1.5">
              2. Typ návštevy / udalosti *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              <button 
                type="button" 
                onClick={() => handleTypeChange('operacia')} 
                className={`py-2 px-2 text-[10px] font-bold rounded-xl border uppercase transition-all flex items-center justify-center gap-1 ${
                  formData.type === 'operacia' ? 'bg-[#2C2A29] text-white border-[#2C2A29] shadow-xs' : 'bg-[#FBF9F6] text-[#2C2A29] border-[#E8E2D9]'
                }`}
              >
                <span>🔪</span> Operácia
              </button>
              <button 
                type="button" 
                onClick={() => handleTypeChange('konzultacia')} 
                className={`py-2 px-2 text-[10px] font-bold rounded-xl border uppercase transition-all flex items-center justify-center gap-1 ${
                  formData.type === 'konzultacia' ? 'bg-amber-100 border-amber-500 text-amber-900 shadow-xs' : 'bg-[#FBF9F6] text-[#2C2A29] border-[#E8E2D9]'
                }`}
              >
                <span>🩺</span> Konzultácia
              </button>
              <button 
                type="button" 
                onClick={() => handleTypeChange('osetrenie')} 
                className={`py-2 px-2 text-[10px] font-bold rounded-xl border uppercase transition-all flex items-center justify-center gap-1 ${
                  formData.type === 'osetrenie' ? 'bg-emerald-100 border-emerald-500 text-emerald-900 shadow-xs' : 'bg-[#FBF9F6] text-[#2C2A29] border-[#E8E2D9]'
                }`}
              >
                <span>💉</span> Ošetrenie
              </button>
              <button 
                type="button" 
                onClick={() => handleTypeChange('kontrola')} 
                className={`py-2 px-2 text-[10px] font-bold rounded-xl border uppercase transition-all flex items-center justify-center gap-1 ${
                  formData.type === 'kontrola' ? 'bg-blue-100 border-blue-500 text-blue-900 shadow-xs' : 'bg-[#FBF9F6] text-[#2C2A29] border-[#E8E2D9]'
                }`}
              >
                <span>🔍</span> Kontrola
              </button>
              <button 
                type="button" 
                onClick={() => handleTypeChange('volno')} 
                className={`py-2 px-2 text-[10px] font-bold rounded-xl border uppercase transition-all flex items-center justify-center gap-1 col-span-2 sm:col-span-1 ${
                  formData.type === 'volno' ? 'bg-indigo-100 border-indigo-500 text-indigo-900 shadow-xs' : 'bg-[#FBF9F6] text-[#2C2A29] border-[#E8E2D9]'
                }`}
              >
                <span>🎉</span> Voľno / Interné
              </button>
            </div>
          </div>

          {/* 3. ŠPECIFICKÁ SEKCIA: VOĽNÝ POPIS UDALOSTI (OBED, DOVOLENKA, TEAMBUILDING, ŠKOLENIE...) */}
          {formData.type === 'volno' && (
            <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-indigo-900 flex items-center gap-1">
                  <span>📌</span> Rýchla voľba internej udalosti
                </span>
                <span className="text-[9px] text-indigo-700">Kliknutím predvyplníte kategóriu</span>
              </div>

              {/* Rýchle chips */}
              <div className="flex flex-wrap gap-1.5">
                {FREEFORM_PRESETS.map(preset => {
                  const isSelected = formData.freeformCategory === preset.category;
                  return (
                    <button
                      key={preset.category}
                      type="button"
                      onClick={() => handleFreeformCategorySelect(preset)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 border ${
                        isSelected 
                          ? 'bg-indigo-700 text-white border-indigo-700 shadow-xs' 
                          : 'bg-white text-indigo-900 border-indigo-200 hover:bg-indigo-100'
                      }`}
                    >
                      <span>{preset.icon}</span>
                      <span>{preset.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Vlastný názov a popis */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-indigo-900 mb-1">
                  Vlastný názov udalosti *
                </label>
                <input 
                  type="text"
                  required
                  placeholder="napr. Obedňajšia pauza, Dovolenka MUDr. Mráz, Klinický seminár..."
                  value={formData.title || ''}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-indigo-200 p-2 rounded-lg bg-white text-xs font-semibold focus:outline-indigo-500"
                />
              </div>

              {/* Komu je pridelená udalosť */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-indigo-900 mb-1">
                  Komu je pridelená udalosť (Lekár / Personál)
                </label>
                <select
                  value={formData.assignedTo || 'Celý tím kliniky'}
                  onChange={e => setFormData(prev => ({ 
                    ...prev, 
                    assignedTo: e.target.value,
                    doctorName: e.target.value
                  }))}
                  className="w-full border border-indigo-200 p-2 rounded-lg bg-white text-xs font-semibold focus:outline-indigo-500"
                >
                  {CLINIC_STAFF.map(st => (
                    <option key={st.id} value={st.name}>
                      {st.type === 'team' ? '👥 ' : '👤 '}{st.name} — {st.role}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* 4. PACIENT & NÁZOV (PRE ŠTANDARDNÉ ZÁKROKY) */}
          {formData.type !== 'volno' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Meno pacienta *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Meno a priezvisko..."
                    value={formData.patientName || ''} 
                    onChange={e => setFormData(prev => ({ ...prev, patientName: e.target.value }))} 
                    className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6] font-semibold" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Telefón pacienta</label>
                  <input 
                    type="tel" 
                    placeholder="+421 9..."
                    value={formData.patientPhone || ''} 
                    onChange={e => setFormData(prev => ({ ...prev, patientPhone: e.target.value }))} 
                    className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">E-mail pacienta</label>
                  <input 
                    type="email" 
                    placeholder="klient@email.sk"
                    value={formData.patientEmail || ''} 
                    onChange={e => setFormData(prev => ({ ...prev, patientEmail: e.target.value }))} 
                    className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Názov zákroku / návštevy *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="napr. Augmentácia prsníkov, Blefaroplastika..."
                    value={formData.title || ''} 
                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} 
                    className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6] font-bold" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Zodpovedný lekár / Komu je pridelené</label>
                  <select
                    value={formData.assignedTo || formData.doctorName || 'MUDr. Ján Mráz'}
                    onChange={e => setFormData(prev => ({ 
                      ...prev, 
                      assignedTo: e.target.value,
                      doctorName: e.target.value,
                      operator: e.target.value
                    }))}
                    className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6] font-semibold"
                  >
                    {CLINIC_STAFF.map(st => (
                      <option key={st.id} value={st.name}>
                        {st.name} ({st.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 5. OPERAČNÝ DEŇ: OPERAČNÝ TÍM, ŠPECIÁLNE VYBAVENIE & POTREBNÝ MATERIÁL */}
          {formData.type === 'operacia' && (
            <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E0D8C8] space-y-3.5">
              <div className="flex items-center justify-between border-b border-[#E0D8C8] pb-2">
                <h4 className="text-[11px] uppercase font-bold text-[#2C2A29] flex items-center gap-1.5">
                  <span>🏥</span> Rozpis operačného dňa & Tímu
                </h4>
                <span className="text-[9px] bg-[#C5A059] text-white px-2 py-0.5 rounded font-bold uppercase">
                  Chirurgický protokol
                </span>
              </div>

              {/* A. Kto operuje, anesteziológ, anest. sestra, inštrumentárka */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Kto operuje */}
                <div>
                  <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-1">
                    🔪 Kto operuje (Operatér) *
                  </label>
                  <select
                    value={formData.operator || formData.doctorName || 'MUDr. Ján Mráz'}
                    onChange={e => setFormData(prev => ({ ...prev, operator: e.target.value, doctorName: e.target.value }))}
                    className="w-full border border-[#D9CFC0] p-1.5 rounded-lg bg-white font-bold text-xs"
                  >
                    <option value="MUDr. Ján Mráz">MUDr. Ján Mráz (Plastický chirurg)</option>
                    <option value="MUDr. Zuzana Sroková">MUDr. Zuzana Sroková (Plastický chirurg)</option>
                    <option value="MUDr. Minh Tuong Tran">MUDr. Minh Tuong Tran (Chirurg)</option>
                    <option value="Iný externý operater">Iný externý operatér...</option>
                  </select>
                </div>

                {/* Kto je anesteziológ */}
                <div>
                  <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-1">
                    💉 Kto je anesteziológ *
                  </label>
                  <select
                    value={formData.anesthesiologist || 'MUDr. Peter Kováč'}
                    onChange={e => setFormData(prev => ({ ...prev, anesthesiologist: e.target.value }))}
                    className="w-full border border-[#D9CFC0] p-1.5 rounded-lg bg-white font-bold text-xs"
                  >
                    <option value="MUDr. Peter Kováč">MUDr. Peter Kováč (OAIM)</option>
                    <option value="MUDr. Viera Nováková">MUDr. Viera Nováková (OAIM)</option>
                    <option value="Lokálna anestézia (bez OAIM)">Lokálna anestézia (bez OAIM)</option>
                    <option value="Sedácia / Analgosedácia">Sedácia / Analgosedácia</option>
                    <option value="Externý anesteziológ">Externý anesteziológ</option>
                  </select>
                </div>

                {/* Anesteziologická sestra */}
                <div>
                  <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-1">
                    🩺 Anesteziologická sestra
                  </label>
                  <select
                    value={formData.anesthesiaNurse || 'Bc. Jana Malá'}
                    onChange={e => setFormData(prev => ({ ...prev, anesthesiaNurse: e.target.value }))}
                    className="w-full border border-[#D9CFC0] p-1.5 rounded-lg bg-white text-xs"
                  >
                    <option value="Bc. Jana Malá">Bc. Jana Malá (Anest. sestra)</option>
                    <option value="Ema Foltáni">Ema Foltáni</option>
                    <option value="Sabina Lenhartová">Sabina Lenhartová</option>
                    <option value="Žiadna (lokálna anestézia)">Žiadna (lokálna anestézia)</option>
                  </select>
                </div>

                {/* Inštrumentárka */}
                <div>
                  <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-1">
                    🧤 Inštrumentárka *
                  </label>
                  <select
                    value={formData.scrubNurse || 'Sabina Lenhartová'}
                    onChange={e => setFormData(prev => ({ ...prev, scrubNurse: e.target.value }))}
                    className="w-full border border-[#D9CFC0] p-1.5 rounded-lg bg-white text-xs font-semibold"
                  >
                    <option value="Sabina Lenhartová">Sabina Lenhartová</option>
                    <option value="Ema Foltáni">Ema Foltáni</option>
                    <option value="Bc. Jana Malá">Bc. Jana Malá</option>
                    <option value="Externá inštrumentárka">Externá inštrumentárka</option>
                  </select>
                </div>
              </div>

              {/* B. Špeciálne vybavenie / prístroje (vyklikávanie) */}
              <div className="pt-2 border-t border-[#E0D8C8]">
                <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-1.5">
                  ⚡ Špeciálne vybavenie / prístroje (vyberte kliknutím)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SURGERY_EQUIPMENT_OPTIONS.map(eq => {
                    const isChecked = (formData.specialEquipment || []).includes(eq);
                    return (
                      <button
                        key={eq}
                        type="button"
                        onClick={() => toggleEquipment(eq)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                          isChecked 
                            ? 'bg-[#2C2A29] text-white border-[#2C2A29] shadow-2xs' 
                            : 'bg-white text-[#8C857B] border-[#D9CFC0] hover:border-[#C5A059]'
                        }`}
                      >
                        {isChecked ? '✓ ' : '+ '}{eq}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* C. Potrebný materiál (implantáty a pod.) */}
              <div className="pt-2 border-t border-[#E0D8C8]">
                <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-1.5">
                  🍈 Potrebný materiál & Implantáty (vyberte kliknutím)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {SURGERY_MATERIAL_OPTIONS.map(mat => {
                    const isChecked = (formData.materials || []).includes(mat);
                    return (
                      <button
                        key={mat}
                        type="button"
                        onClick={() => toggleMaterial(mat)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                          isChecked 
                            ? 'bg-[#C5A059] text-white border-[#C5A059] shadow-2xs' 
                            : 'bg-white text-[#8C857B] border-[#D9CFC0] hover:border-[#C5A059]'
                        }`}
                      >
                        {isChecked ? '✓ ' : '+ '}{mat}
                      </button>
                    );
                  })}
                </div>

                <input
                  type="text"
                  placeholder="Presná špecifikácia materiálu (napr. Motiva Ergonomix 340cc Demi, Lipoelastic veľkosť M...)"
                  value={formData.materialNotes || ''}
                  onChange={e => setFormData(prev => ({ ...prev, materialNotes: e.target.value }))}
                  className="w-full border border-[#D9CFC0] p-2 rounded-lg bg-white text-xs focus:outline-[#C5A059]"
                />
              </div>

            </div>
          )}

          {/* 6. DÁTUM A ČASOVÝ ROZSAH */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-[#FBF9F6] p-3 rounded-xl border border-[#E8E2D9]">
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Dátum *</label>
              <input 
                type="date" 
                required
                value={formData.date || ''} 
                onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))} 
                className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white font-bold" 
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Čas začiatku</label>
              <input 
                type="time" 
                disabled={formData.isAllDay}
                value={formData.startTime || '09:00'} 
                onChange={e => setFormData(prev => ({ ...prev, startTime: e.target.value }))} 
                className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white disabled:opacity-50 font-mono font-bold" 
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Čas konca</label>
              <input 
                type="time" 
                disabled={formData.isAllDay}
                value={formData.endTime || '10:00'} 
                onChange={e => setFormData(prev => ({ ...prev, endTime: e.target.value }))} 
                className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white disabled:opacity-50 font-mono font-bold" 
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer bg-[#FBF9F6] px-3 py-1.5 border border-[#E8E2D9] rounded-lg w-fit">
            <input 
              type="checkbox" 
              checked={formData.isAllDay || false} 
              onChange={e => setFormData(prev => ({ ...prev, isAllDay: e.target.checked }))} 
              className="accent-[#C5A059] w-3.5 h-3.5" 
            />
            <span className="text-[10px] uppercase font-bold text-[#2C2A29]">Celodenná udalosť</span>
          </label>

          {/* 7. FINANČNÉ POLOŽKY (LEN PRE MEDICÍNSKE ZÁKROKY) */}
          {formData.type !== 'volno' && (
            <div className="grid grid-cols-3 gap-2.5 bg-[#FBF9F6] p-3 rounded-xl border border-[#E8E2D9]">
              <div>
                <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-1">Celková cena (€)</label>
                <input 
                  type="number" 
                  value={formData.totalPrice || 0} 
                  onChange={e => setFormData(prev => ({ ...prev, totalPrice: Number(e.target.value) }))} 
                  className="w-full border border-[#E8E2D9] p-1.5 rounded-lg bg-white font-mono font-bold" 
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-1">Záloha (€)</label>
                <input 
                  type="number" 
                  value={formData.depositAmount || 0} 
                  onChange={e => setFormData(prev => ({ ...prev, depositAmount: Number(e.target.value) }))} 
                  className="w-full border border-[#E8E2D9] p-1.5 rounded-lg bg-white font-mono font-bold text-[#C5A059]" 
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-1">Stav zálohy</label>
                <select
                  value={formData.isDepositPaid ? 'paid' : 'unpaid'}
                  onChange={e => setFormData(prev => ({ ...prev, isDepositPaid: e.target.value === 'paid' }))}
                  className="w-full border border-[#E8E2D9] p-1.5 rounded-lg bg-white font-bold"
                >
                  <option value="unpaid">🔴 Neúhradené</option>
                  <option value="paid">🟢 Hradené</option>
                </select>
              </div>
            </div>
          )}

          {/* 8. POZNÁMKY */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Podrobný popis / Poznámky</label>
            <textarea
              rows={2}
              placeholder="Doplňujúce pokyny k výkonu, materiálu alebo organizácii dňa..."
              value={formData.notes || ''}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6] text-xs focus:outline-[#C5A059]"
            />
          </div>

          {/* TLAČIDLÁ V SPODNEJ ČASTI */}
          <div className="flex justify-end gap-2 pt-3 border-t border-[#E8E2D9] shrink-0">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 font-bold text-[11px] uppercase tracking-wider text-[#8C857B] hover:text-[#2C2A29]"
            >
              Zrušiť
            </button>
            <button 
              type="submit" 
              className="px-6 py-2 bg-[#2C2A29] hover:bg-[#C5A059] text-white font-bold text-[11px] uppercase tracking-wider rounded-xl shadow-sm transition-colors"
            >
              {isEditing ? 'Uložiť zmeny' : 'Vytvoriť termín'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
