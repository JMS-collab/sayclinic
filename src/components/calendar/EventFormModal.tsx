'use client';

import React, { useState, useEffect } from 'react';
import { 
  CalendarEvent, 
  EventType, 
  CLINIC_ROOMS, 
  CLINIC_STAFF, 
  SURGERY_EQUIPMENT_OPTIONS, 
  SURGERY_MATERIAL_OPTIONS, 
  FREEFORM_PRESETS,
  ClinicStayType,
  POST_OP_CONTROL_PRESETS,
  calculateTargetControlDate,
  getPostOpTimeDiff
} from '@/data/calendarConfig';

interface EventFormModalProps {
  isOpen: boolean;
  isEditing?: boolean;
  mode?: 'create' | 'edit';
  initialData: Partial<CalendarEvent>;
  onClose: () => void;
  onSave: (eventData: Partial<CalendarEvent>) => void;
  isSaving?: boolean;
}

export default function EventFormModal({
  isOpen,
  isEditing = false,
  mode,
  initialData,
  onClose,
  onSave,
  isSaving = false
}: EventFormModalProps) {
  const isEditMode = isEditing || mode === 'edit' || Boolean(initialData?.id);

  const getInitialState = (data: Partial<CalendarEvent>) => ({
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
    type: 'operacia' as EventType,
    freeformCategory: 'obed' as const,
    anesthesiaType: data.anesthesiaType || 'TIVA',
    clinicStay: (data.clinicStay as ClinicStayType) || 'dospanie',
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
    // POOPERAČNÁ KONTROLA
    operationTitle: data.operationTitle || '',
    operationDate: data.operationDate || '',
    operationRecordId: data.operationRecordId || '',
    operationDoctor: data.operationDoctor || 'MUDr. Ján Mráz',
    operationNotes: data.operationNotes || '',
    controlInterval: data.controlInterval || '',
    ...data
  });

  const [formData, setFormData] = useState<Partial<CalendarEvent>>(() => getInitialState(initialData));

  // Funkcia na automatické načítanie operácie z dokumentov pacienta
  const handleAutoLoadPostOpData = () => {
    try {
      const recordsRaw = localStorage.getItem('say_clinic_patient_records');
      if (!recordsRaw) return;
      const recordsMap = JSON.parse(recordsRaw);

      let patientRecs: any[] = [];
      if (formData.patientId && recordsMap[formData.patientId]) {
        patientRecs = recordsMap[formData.patientId];
      } else {
        const patientsRaw = localStorage.getItem('say_clinic_patients');
        if (patientsRaw) {
          const patList = JSON.parse(patientsRaw);
          const foundPat = patList.find((p: any) => 
            p.name?.toLowerCase().includes((formData.patientName || '').toLowerCase()) ||
            (formData.patientName || '').toLowerCase().includes(p.name?.toLowerCase())
          );
          if (foundPat && recordsMap[foundPat.id]) {
            patientRecs = recordsMap[foundPat.id];
          }
        }
      }

      if (patientRecs && patientRecs.length > 0) {
        const opRecord = patientRecs.find((r: any) => 
          r.type?.toLowerCase().includes('opera') || 
          r.type?.toLowerCase().includes('protokol') ||
          r.title?.toLowerCase().includes('augmentác') ||
          r.title?.toLowerCase().includes('lipo') ||
          r.title?.toLowerCase().includes('blefaro') ||
          r.title?.toLowerCase().includes('plastik')
        ) || patientRecs[0];

        if (opRecord) {
          const opTitle = opRecord.title || 'Operačný zákrok';
          const opDate = opRecord.date || new Date().toISOString().split('T')[0];
          const opDoc = opRecord.doctor || 'MUDr. Ján Mráz';
          const opNotes = opRecord.content || '';

          setFormData(prev => ({
            ...prev,
            operationTitle: opTitle,
            operationDate: opDate,
            operationDoctor: opDoc,
            operationNotes: opNotes,
            operationRecordId: opRecord.id || '',
            controlInterval: prev.controlInterval || '1. pooperačná kontrola / preväz',
            title: (!prev.title || prev.title === 'Kontrola' || prev.title.startsWith('Pooperačná')) 
              ? `Pooperačná kontrola — ${opTitle} (op. ${opDate})` 
              : prev.title
          }));
        }
      }
    } catch (e) {
      console.error('Failed to load patient records', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialState(initialData));
    }
  }, [isOpen, initialData]);

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

  const handleAnesthesiaSelect = (selectedType: string) => {
    setFormData(prev => {
      const updates: Partial<CalendarEvent> = {
        ...prev,
        anesthesiaType: selectedType
      };

      if (selectedType === 'LA') {
        if (!prev.clinicStay || prev.clinicStay === 'dospanie' || prev.clinicStay === 'hospitalizacia') {
          updates.clinicStay = 'ambulantne';
        }
        if (!prev.anesthesiologist || prev.anesthesiologist === 'MUDr. Peter Kováč' || prev.anesthesiologist === 'MUDr. Viera Nováková') {
          updates.anesthesiologist = 'Lokálna anestézia (bez OAIM)';
        }
        if (prev.anesthesiaNurse === 'Bc. Jana Malá') {
          updates.anesthesiaNurse = 'Žiadna (lokálna anestézia)';
        }
      } else if (selectedType === 'TIVA') {
        if (!prev.clinicStay || prev.clinicStay === 'ambulantne') {
          updates.clinicStay = 'dospanie';
        }
        if (prev.anesthesiologist === 'Lokálna anestézia (bez OAIM)') {
          updates.anesthesiologist = 'MUDr. Peter Kováč';
        }
        if (prev.anesthesiaNurse === 'Žiadna (lokálna anestézia)') {
          updates.anesthesiaNurse = 'Bc. Jana Malá';
        }
      }

      return updates;
    });
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
              {isEditMode ? 'Upraviť udalosť / termín' : 'Naplánovať novú udalosť'}
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

          {/* 5. POOPERAČNÁ KONTROLA: PREPOJENIE NA PREDCHÁDZAJÚCU OPERÁCIU A INTERVÁLY */}
          {formData.type === 'kontrola' && (
            <div className="bg-sky-50/90 p-4 rounded-xl border border-sky-200 space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-200 pb-2.5">
                <div>
                  <h4 className="text-[11px] uppercase font-bold text-sky-950 flex items-center gap-1.5">
                    <span>🩺</span> Pooperačná kontrola — Údaje o predchádzajúcej operácii
                  </h4>
                  <p className="text-[10px] text-sky-700 font-medium">
                    Informácia po akej operácii a kedy bol zákrok vykonaný
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAutoLoadPostOpData}
                  className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                  title="Vyhľadá a natiahne posledný operačný protokol pacienta z kartotéky"
                >
                  <span>⚡</span> Načítať z dokumentov pacienta
                </button>
              </div>

              {/* RÝCHLE INTERVALY KONTROLY OD DÁTUMU OPERÁCIE */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-sky-900 mb-1.5 flex items-center justify-between">
                  <span>Rýchly výber termínu kontroly (od dátumu operácie):</span>
                  {formData.operationDate && (
                    <span className="text-[9px] text-sky-700 lowercase font-medium">
                      operácia: {formData.operationDate}
                    </span>
                  )}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {POST_OP_CONTROL_PRESETS.map(preset => {
                    const isSelected = formData.controlInterval === preset.label;
                    const calculatedDate = formData.operationDate 
                      ? calculateTargetControlDate(formData.operationDate, preset.daysOffset) 
                      : null;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          const updates: Partial<CalendarEvent> = {
                            controlInterval: preset.label
                          };
                          if (formData.operationDate) {
                            updates.date = calculateTargetControlDate(formData.operationDate, preset.daysOffset);
                          }
                          setFormData(prev => ({ ...prev, ...updates }));
                        }}
                        className={`p-2 rounded-lg text-[10px] text-left transition-all border ${
                          isSelected 
                            ? 'bg-sky-700 text-white border-sky-700 shadow-2xs font-bold' 
                            : 'bg-white text-sky-950 border-sky-200 hover:bg-sky-100/70 font-semibold'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{preset.shortLabel}</span>
                          {calculatedDate && (
                            <span className={`text-[9px] ${isSelected ? 'text-sky-200' : 'text-sky-600 font-bold'}`}>
                              {calculatedDate.split('-').reverse().slice(0, 2).join('.')}
                            </span>
                          )}
                        </div>
                        <div className={`text-[8.5px] mt-0.5 truncate ${isSelected ? 'text-sky-100' : 'text-[#8C857B]'}`}>
                          {preset.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ZÁKLADNÉ POLIA: PO ČOM A KEDY BOLA OPERÁCIA */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-sky-900 mb-1">
                    Po akej operácii / Druh zákroku *
                  </label>
                  <input
                    type="text"
                    placeholder="napr. Augmentácia prsníkov, Blefaroplastika, VASER Liposukcia..."
                    value={formData.operationTitle || ''}
                    onChange={e => setFormData(prev => ({ ...prev, operationTitle: e.target.value }))}
                    className="w-full border border-sky-300 p-2 rounded-lg bg-white text-xs font-bold text-sky-950 focus:outline-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-sky-900 mb-1">
                    Dátum operácie *
                  </label>
                  <input
                    type="date"
                    value={formData.operationDate || ''}
                    onChange={e => setFormData(prev => ({ ...prev, operationDate: e.target.value }))}
                    className="w-full border border-sky-300 p-2 rounded-lg bg-white text-xs font-semibold text-sky-950 focus:outline-sky-500"
                  />
                </div>
              </div>

              {/* OPERATÉR A ODSTUP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-sky-900 mb-1">
                    Operatér predchádzajúceho zákroku
                  </label>
                  <select
                    value={formData.operationDoctor || 'MUDr. Ján Mráz'}
                    onChange={e => setFormData(prev => ({ ...prev, operationDoctor: e.target.value }))}
                    className="w-full border border-sky-300 p-2 rounded-lg bg-white text-xs font-semibold text-sky-950 focus:outline-sky-500"
                  >
                    {CLINIC_STAFF.map(st => (
                      <option key={st.id} value={st.name}>
                        {st.name} ({st.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-sky-900 mb-1">
                    Časový odstup od operácie k tomuto termínu
                  </label>
                  <div className="p-2 rounded-lg bg-white border border-sky-200 text-xs font-bold text-blue-700 flex items-center gap-1.5 h-[38px]">
                    {(() => {
                      if (!formData.operationDate) return <span className="text-gray-400 font-normal">Zadajte dátum operácie</span>;
                      const diff = getPostOpTimeDiff(formData.operationDate, formData.date);
                      return (
                        <>
                          <span>⏱️</span>
                          <span>{diff.displayText}</span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* ŠPECIFIKÁ, IMPLANTÁTY A MATERIÁLY Z OPERÁCIE */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-sky-900 mb-1">
                  Použité implantáty, materiál & pooperačné poznámky z protokolu
                </label>
                <textarea
                  rows={2}
                  placeholder="napr. Motiva Ergonomix 320cc pod sval, kompresná podprsenka Lipoelastic, vstrebateľné stehy Monocryl..."
                  value={formData.operationNotes || ''}
                  onChange={e => setFormData(prev => ({ ...prev, operationNotes: e.target.value }))}
                  className="w-full border border-sky-300 p-2 rounded-lg bg-white text-xs font-medium text-[#2C2A29] focus:outline-sky-500"
                />
              </div>
            </div>
          )}

          {/* 6. OPERAČNÝ DEŇ: OPERAČNÝ TÍM, ŠPECIÁLNE VYBAVENIE & POTREBNÝ MATERIÁL */}
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

              {/* 1. DRUH ANESTÉZIE (ROBÍME HLAVNE TIVU A LA) */}
              <div className="bg-white p-3 rounded-xl border border-[#E0D8C8] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-bold text-[#2C2A29] flex items-center gap-1.5">
                    <span>💉</span> Druh anestézie *
                  </label>
                  <span className="text-[9px] text-[#8C857B] font-semibold">Klinika preferuje primárne TIVA a LA</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* TIVA */}
                  <button
                    type="button"
                    onClick={() => handleAnesthesiaSelect('TIVA')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      formData.anesthesiaType === 'TIVA'
                        ? 'bg-purple-50 border-purple-600 ring-2 ring-purple-500/20 shadow-xs'
                        : 'bg-[#FBF9F6] border-[#E8E2D9] hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-black text-purple-950">TIVA</span>
                      <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-purple-200 text-purple-900 uppercase">
                        Hlavné
                      </span>
                    </div>
                    <p className="text-[10px] text-purple-900/80 leading-tight">
                      Totálna intravenózna anestézia (OAIM)
                    </p>
                  </button>

                  {/* LA */}
                  <button
                    type="button"
                    onClick={() => handleAnesthesiaSelect('LA')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      formData.anesthesiaType === 'LA'
                        ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-[#FBF9F6] border-[#E8E2D9] hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-black text-emerald-950">LA</span>
                      <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-900 uppercase">
                        Hlavné
                      </span>
                    </div>
                    <p className="text-[10px] text-emerald-900/80 leading-tight">
                      Lokálna anestézia operatérom
                    </p>
                  </button>

                  {/* Sedácia */}
                  <button
                    type="button"
                    onClick={() => handleAnesthesiaSelect('Sedácia')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      formData.anesthesiaType === 'Sedácia' || formData.anesthesiaType === 'sedacia'
                        ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-[#FBF9F6] border-[#E8E2D9] hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-black text-blue-950">Sedácia</span>
                    </div>
                    <p className="text-[10px] text-blue-900/80 leading-tight">
                      Analgosedácia s monitoringom
                    </p>
                  </button>

                  {/* Celková anestézia */}
                  <button
                    type="button"
                    onClick={() => handleAnesthesiaSelect('Celková anestézia (OAIM)')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      formData.anesthesiaType === 'Celková anestézia (OAIM)' || formData.anesthesiaType === 'celkova'
                        ? 'bg-amber-50 border-amber-600 ring-2 ring-amber-500/20 shadow-xs'
                        : 'bg-[#FBF9F6] border-[#E8E2D9] hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-black text-amber-950">Celková</span>
                    </div>
                    <p className="text-[10px] text-amber-900/80 leading-tight">
                      Klasická inhalačná anestézia
                    </p>
                  </button>
                </div>
              </div>

              {/* 2. POBYT NA KLINIKE: AMBULANTNE, DOSPANIE, HOSPITALIZÁCIA */}
              <div className="bg-white p-3 rounded-xl border border-[#E0D8C8] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-bold text-[#2C2A29] flex items-center gap-1.5">
                    <span>🏥</span> Pobyt na klinike *
                  </label>
                  <span className="text-[9px] text-[#8C857B] font-semibold">Režim zotavenia po operácii</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Ambulantne */}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, clinicStay: 'ambulantne' }))}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                      formData.clinicStay === 'ambulantne'
                        ? 'bg-sky-50 border-sky-600 ring-2 ring-sky-500/20 shadow-xs'
                        : 'bg-[#FBF9F6] border-[#E8E2D9] hover:border-sky-300'
                    }`}
                  >
                    <span className="text-xl p-1 bg-white rounded-lg border border-sky-200">🚶</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-xs text-sky-950 block">Ambulantne</strong>
                        {formData.clinicStay === 'ambulantne' && (
                          <span className="text-sky-600 text-xs font-bold">✓ Vybraté</span>
                        )}
                      </div>
                      <p className="text-[10px] text-sky-900/80 leading-tight mt-0.5">
                        Odchod domov v deň zákroku (po zotavení)
                      </p>
                    </div>
                  </button>

                  {/* Dospanie */}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, clinicStay: 'dospanie' }))}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                      formData.clinicStay === 'dospanie'
                        ? 'bg-amber-50 border-amber-600 ring-2 ring-amber-500/20 shadow-xs'
                        : 'bg-[#FBF9F6] border-[#E8E2D9] hover:border-amber-300'
                    }`}
                  >
                    <span className="text-xl p-1 bg-white rounded-lg border border-amber-200">🛏️</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-xs text-amber-950 block">Dospanie</strong>
                        {formData.clinicStay === 'dospanie' && (
                          <span className="text-amber-600 text-xs font-bold">✓ Vybraté</span>
                        )}
                      </div>
                      <p className="text-[10px] text-amber-900/80 leading-tight mt-0.5">
                        Observácia na dospávacej izbe po anestézii
                      </p>
                    </div>
                  </button>

                  {/* Hospitalizácia */}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, clinicStay: 'hospitalizacia' }))}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                      formData.clinicStay === 'hospitalizacia'
                        ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'bg-[#FBF9F6] border-[#E8E2D9] hover:border-indigo-300'
                    }`}
                  >
                    <span className="text-xl p-1 bg-white rounded-lg border border-indigo-200">🏥</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-xs text-indigo-950 block">Hospitalizácia</strong>
                        {formData.clinicStay === 'hospitalizacia' && (
                          <span className="text-indigo-600 text-xs font-bold">✓ Vybraté</span>
                        )}
                      </div>
                      <p className="text-[10px] text-indigo-900/80 leading-tight mt-0.5">
                        Prenocovanie na lôžku s 24h starostlivosťou
                      </p>
                    </div>
                  </button>
                </div>
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
              disabled={isSaving}
              className="px-6 py-2 bg-[#2C2A29] hover:bg-[#C5A059] text-white font-bold text-[11px] uppercase tracking-wider rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Ukladám...' : (isEditMode ? 'Uložiť zmeny' : 'Vytvoriť termín')}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
