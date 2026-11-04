'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { filterAndRankPatients, matchesQuery } from '@/utils/fuzzySearch';
import { 
  CalendarEvent, 
  EventType, 
  EventAttendanceStatus,
  EVENT_STATUS_OPTIONS,
  CLINIC_ROOMS, 
  CLINIC_STAFF, 
  SURGERY_EQUIPMENT_OPTIONS, 
  SURGERY_MATERIAL_OPTIONS, 
  SURGERY_PROCEDURE_PRESETS,
  TREATMENT_PROCEDURE_PRESETS,
  DURATION_PRESET_MINUTES,
  FREEFORM_PRESETS,
  ClinicStayType,
  POST_OP_CONTROL_PRESETS,
  calculateTargetControlDate,
  getPostOpTimeDiff,
  formatLocalDate,
  getRoomInfo,
  EventSaveExtraOptions,
  RecurrenceRule,
  getSurgeryReadinessSummary
} from '@/data/calendarConfig';

interface EventFormModalProps {
  isOpen: boolean;
  isEditing?: boolean;
  mode?: 'create' | 'edit';
  initialData: Partial<CalendarEvent>;
  existingEvents?: CalendarEvent[];
  hidePrices?: boolean;
  lockRoomId?: string;
  onClose: () => void;
  onSave: (eventData: Partial<CalendarEvent>, extraOptions?: EventSaveExtraOptions) => void;
  onDelete?: (eventData: Partial<CalendarEvent>) => void;
  isSaving?: boolean;
}

const timeToMin = (t?: string): number => {
  if (!t) return 540;
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const minToTime = (min: number): string => {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, min));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export default function EventFormModal({
  isOpen,
  isEditing = false,
  mode,
  initialData,
  existingEvents,
  hidePrices = false,
  lockRoomId,
  onClose,
  onSave,
  onDelete,
  isSaving = false
}: EventFormModalProps) {
  const isEditMode = isEditing || mode === 'edit' || Boolean(initialData?.id);

  const getInitialState = (data: Partial<CalendarEvent>): Partial<CalendarEvent> => ({
    roomId: lockRoomId || data.roomId || 'sala_say',
    assignedTo: 'MUDr. Ján Mráz',
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    doctorName: 'MUDr. Ján Mráz',
    title: '',
    date: formatLocalDate(),
    startTime: '09:00',
    endTime: '10:00',
    isAllDay: false,
    type: 'operacia' as EventType,
    status: (data.status as EventAttendanceStatus) || 'planned',
    freeformCategory: 'obed' as const,
    anesthesiaType: data.anesthesiaType || 'TIVA',
    clinicStay: (data.clinicStay as ClinicStayType) || 'dospanie',
    operator: 'MUDr. Ján Mráz',
    anesthesiologist: 'MUDr. Martin Kasáč',
    anesthesiaNurse: 'Denisa Halajová',
    scrubNurse: 'Katarína Otiepková',
    specialEquipment: data.specialEquipment || [],
    specialEquipmentOther: data.specialEquipmentOther || '',
    materials: data.materials || [],
    materialNotes: data.materialNotes || '',
    totalPrice: data.totalPrice !== undefined ? data.totalPrice : 3500,
    depositAmount: data.depositAmount !== undefined ? data.depositAmount : 500,
    isDepositPaid: data.isDepositPaid || false,
    preOpExamReady: data.preOpExamReady || false,
    materialsReady: data.materialsReady || false,
    consentsSigned: data.consentsSigned || false,
    notes: data.notes || '',
    // POOPERAČNÁ KONTROLA
    operationTitle: data.operationTitle || '',
    operationDate: data.operationDate || '',
    operationRecordId: data.operationRecordId || '',
    operationDoctor: data.operationDoctor || 'MUDr. Ján Mráz',
    operationNotes: data.operationNotes || '',
    controlInterval: data.controlInterval || '',
    ...data,
    ...(lockRoomId ? { roomId: lockRoomId } : {})
  });

  const [formData, setFormData] = useState<Partial<CalendarEvent>>(() => getInitialState(initialData));
  const [allPatients, setAllPatients] = useState<any[]>([]);
  const [cachedEvents, setCachedEvents] = useState<CalendarEvent[]>([]);
  const [showPatientSuggestions, setShowPatientSuggestions] = useState(false);
  const [selectedPresetHint, setSelectedPresetHint] = useState<string>('');
  const [extraOptions, setExtraOptions] = useState<EventSaveExtraOptions>({
    autoCreateSanitationBlock: false,
    sanitationMinutes: 20,
    autoCreateRecoveryBlock: false,
    recoveryMinutes: 120,
    recurrenceRule: 'none',
    recurrenceCount: 4,
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem('say_clinic_patients');
      if (stored) {
        setAllPatients(JSON.parse(stored));
      }
      if (!existingEvents) {
        const storedEvts = localStorage.getItem('say_clinic_calendar_events');
        if (storedEvts) {
          setCachedEvents(JSON.parse(storedEvts));
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [existingEvents]);

  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialState(initialData));
      setSelectedPresetHint('');
      setExtraOptions({
        autoCreateSanitationBlock: false,
        sanitationMinutes: 20,
        autoCreateRecoveryBlock: false,
        recoveryMinutes: 120,
        recurrenceRule: 'none',
        recurrenceCount: 4,
      });
    }
  }, [isOpen, initialData]);

  const patientSuggestions = useMemo(() => {
    if (!formData.patientName || formData.patientName.trim().length < 2 || !showPatientSuggestions) {
      return [];
    }
    return filterAndRankPatients(allPatients, formData.patientName).slice(0, 6);
  }, [allPatients, formData.patientName, showPatientSuggestions]);

  // DETEKCIA KOLÍZIÍ (ROVNAKÁ MIESTNOSŤ ALEBO ROVNAKÝ LEKÁR V ROVNAKOM ČASE)
  const conflictingEvents = useMemo(() => {
    if (formData.isAllDay || !formData.date || !formData.startTime || !formData.endTime) return [];
    const pool = existingEvents || cachedEvents;
    if (!Array.isArray(pool) || pool.length === 0) return [];

    const startMin = timeToMin(formData.startTime);
    const endMin = timeToMin(formData.endTime);
    if (endMin <= startMin) return [];

    const targetRoom = formData.roomId || 'ambulancia';
    const targetDoc = (formData.operator || formData.assignedTo || formData.doctorName || '').toLowerCase().trim();

    return pool.filter(evt => {
      if (!evt || evt.isCancelled || evt.id === formData.id) return false;
      if (evt.date !== formData.date) return false;
      if (evt.isAllDay || (evt.startTime === '00:00' && evt.endTime === '23:59')) return false;

      const evtStart = timeToMin(evt.startTime);
      const evtEnd = Math.max(evtStart + 15, timeToMin(evt.endTime));

      const overlaps = startMin < evtEnd && endMin > evtStart;
      if (!overlaps) return false;

      const evtRoom = evt.roomId || (evt.type === 'operacia' ? 'sala_say' : 'ambulancia');
      const evtDoc = (evt.operator || evt.assignedTo || evt.doctorName || '').toLowerCase().trim();

      const sameRoom = evtRoom === targetRoom;
      const sameDoc = targetDoc && targetDoc !== 'celý tím kliniky' && evtDoc === targetDoc;

      return sameRoom || sameDoc;
    });
  }, [existingEvents, cachedEvents, formData.id, formData.date, formData.startTime, formData.endTime, formData.isAllDay, formData.roomId, formData.operator, formData.assignedTo, formData.doctorName]);

  // Výpočet aktuálneho trvania v minútach
  const currentDurationMinutes = useMemo(() => {
    const diff = timeToMin(formData.endTime) - timeToMin(formData.startTime);
    return diff > 0 ? diff : 0;
  }, [formData.startTime, formData.endTime]);

  const handleSetDuration = (minutes: number) => {
    const start = timeToMin(formData.startTime || '09:00');
    const newEnd = minToTime(start + minutes);
    setFormData(prev => ({ ...prev, endTime: newEnd }));
  };

  const handleStartTimeChange = (newStartStr: string) => {
    const prevDur = Math.max(15, timeToMin(formData.endTime) - timeToMin(formData.startTime));
    const newStartMin = timeToMin(newStartStr);
    const newEndStr = minToTime(newStartMin + prevDur);
    setFormData(prev => ({
      ...prev,
      startTime: newStartStr,
      endTime: newEndStr
    }));
  };

  // Funkcia na automatické načítanie operácie z dokumentov pacienta
  const handleAutoLoadPostOpData = (overridePatientId?: string, overridePatientName?: string) => {
    try {
      const recordsRaw = localStorage.getItem('say_clinic_patient_records');
      if (!recordsRaw) return;
      const recordsMap = JSON.parse(recordsRaw);

      const patId = overridePatientId ?? formData.patientId;
      const patName = overridePatientName ?? formData.patientName;

      let patientRecs: any[] = [];
      if (patId && recordsMap[patId]) {
        patientRecs = recordsMap[patId];
      } else if (patName) {
        const patientsRaw = localStorage.getItem('say_clinic_patients');
        if (patientsRaw) {
          const patList = JSON.parse(patientsRaw);
          const foundPat = patList.find((p: any) => 
            matchesQuery(p.name || '', patName).match ||
            matchesQuery(patName, p.name || '').match
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
          const opDate = opRecord.date || formatLocalDate();
          const opDoc = opRecord.doctor || 'MUDr. Ján Mráz';
          const opNotes = opRecord.content || '';

          setFormData(prev => ({
            ...prev,
            operationTitle: opTitle,
            operationDate: opDate,
            operationDoctor: opDoc,
            operationNotes: opNotes,
            operationRecordId: opRecord.id || '',
            controlInterval: prev.controlInterval || '1. pooperačná kontrola / preväz (7 dní)',
            title: (!prev.title || prev.title === 'Kontrola' || prev.title.startsWith('Pooperačná')) 
              ? `Pooperačná kontrola — ${opTitle}` 
              : prev.title
          }));
        }
      }
    } catch (e) {
      console.error('Failed to load patient records', e);
    }
  };

  if (!isOpen) return null;

  const handleTypeChange = (type: EventType) => {
    let price = 0;
    let deposit = 0;
    let room = formData.roomId;
    let defaultDuration = 60;

    if (type === 'operacia') {
      price = 3500;
      deposit = 500;
      defaultDuration = 120;
      if (!room || room === 'ambulancia') room = 'sala_say';
    } else if (type === 'konzultacia') {
      price = 50;
      deposit = 0;
      defaultDuration = 30;
      room = 'ambulancia';
    } else if (type === 'osetrenie') {
      price = 220;
      deposit = 0;
      defaultDuration = 30;
      room = 'ambulancia';
    } else if (type === 'kontrola') {
      price = 0;
      deposit = 0;
      defaultDuration = 20;
      room = 'ambulancia';
    } else if (type === 'volno') {
      price = 0;
      deposit = 0;
      defaultDuration = 60;
    }

    const startMin = timeToMin(formData.startTime || '09:00');
    const newEndTime = minToTime(startMin + defaultDuration);

    setFormData(prev => ({
      ...prev,
      type,
      roomId: lockRoomId || room,
      endTime: isEditMode ? prev.endTime : newEndTime,
      totalPrice: price,
      depositAmount: deposit,
      patientName: type === 'volno' && (!prev.patientName || prev.patientName.trim() === '') ? 'Personál kliniky' : prev.patientName
    }));
  };

  const handleApplySurgeryPreset = (preset: typeof SURGERY_PROCEDURE_PRESETS[0]) => {
    const startMin = timeToMin(formData.startTime || '09:00');
    const newEndTime = minToTime(startMin + preset.durationMinutes);
    const isLA = preset.anesthesiaType === 'LA';

    setSelectedPresetHint(preset.materialNotesHint || '');

    setFormData(prev => ({
      ...prev,
      type: 'operacia',
      roomId: prev.roomId === 'ambulancia' ? 'sala_say' : (prev.roomId || 'sala_say'),
      title: preset.label,
      endTime: newEndTime,
      anesthesiaType: preset.anesthesiaType,
      clinicStay: preset.clinicStay,
      anesthesiologist: isLA ? 'Lokálna anestézia (bez OAIM)' : (prev.anesthesiologist === 'Lokálna anestézia (bez OAIM)' ? 'MUDr. Peter Kováč' : (prev.anesthesiologist || 'MUDr. Peter Kováč')),
      anesthesiaNurse: isLA ? 'Žiadna (lokálna anestézia)' : (prev.anesthesiaNurse === 'Žiadna (lokálna anestézia)' ? 'Bc. Jana Malá' : (prev.anesthesiaNurse || 'Bc. Jana Malá')),
      totalPrice: preset.defaultPrice,
      depositAmount: preset.defaultDeposit,
      specialEquipment: [...preset.equipment],
      materials: [...preset.materials],
    }));
  };

  const handleApplyTreatmentPreset = (preset: typeof TREATMENT_PROCEDURE_PRESETS[0]) => {
    const startMin = timeToMin(formData.startTime || '09:00');
    const newEndTime = minToTime(startMin + preset.durationMinutes);

    setFormData(prev => ({
      ...prev,
      type: 'osetrenie',
      roomId: 'ambulancia',
      title: preset.label,
      endTime: newEndTime,
      totalPrice: preset.defaultPrice,
      depositAmount: preset.defaultDeposit,
      materials: [...preset.materials],
    }));
  };

  const handleFreeformCategorySelect = (preset: typeof FREEFORM_PRESETS[0]) => {
    const isFullDayPreset = preset.category === 'dovolenka' || preset.category === 'sanitarny_den' || preset.category === 'teambuilding';
    setFormData(prev => ({
      ...prev,
      freeformCategory: preset.category,
      title: preset.defaultTitle,
      isAllDay: isFullDayPreset ? true : prev.isAllDay,
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
        if (prev.anesthesiaNurse === 'Bc. Jana Malá' || prev.anesthesiaNurse === 'Anesteziologická sestra') {
          updates.anesthesiaNurse = 'Žiadna (lokálna anestézia)';
        }
      } else if (selectedType === 'TIVA' || selectedType === 'Celková anestézia (OAIM)') {
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

    let finalTitle = formData.title?.trim();
    if (!finalTitle) {
      if (formData.type === 'volno') {
        const found = FREEFORM_PRESETS.find(p => p.category === formData.freeformCategory);
        finalTitle = found ? found.defaultTitle : 'Interná udalosť';
      } else if (formData.type === 'kontrola' && formData.operationTitle) {
        finalTitle = `Pooperačná kontrola — ${formData.operationTitle}`;
      } else if (formData.type === 'konzultacia') {
        finalTitle = `Konzultácia — ${formData.patientName || 'Klient'}`;
      } else {
        finalTitle = 'Termín pacienta';
      }
    }

    // Validácia času konca voči času začiatku
    let validEndTime = formData.endTime || '10:00';
    if (!formData.isAllDay && timeToMin(validEndTime) <= timeToMin(formData.startTime)) {
      validEndTime = minToTime(timeToMin(formData.startTime) + 30);
    }

    onSave(
      {
        ...formData,
        title: finalTitle,
        endTime: validEndTime,
        patientName: formData.type === 'volno' ? (formData.patientName || 'Personál kliniky') : (formData.patientName || 'Bez mena')
      },
      extraOptions
    );
  };

  return (
    <div className="fixed inset-0 bg-[#2C2A29]/70 flex items-center justify-center z-50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white p-5 sm:p-6 rounded-2xl w-full max-w-2xl shadow-2xl border border-[#E8E2D9] my-auto max-h-[93vh] flex flex-col">
        
        {/* HLAVIČKA MODALU */}
        <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-3 mb-4 shrink-0">
          <div>
            <h3 className="font-brand text-lg sm:text-xl font-bold text-[#2C2A29] uppercase">
              {isEditMode ? '✏️ Upraviť udalosť / termín' : '➕ Naplánovať novú udalosť'}
            </h3>
            <p className="text-[10px] uppercase tracking-wider text-[#8C857B]">
              Výber miestnosti, šablóny zákroku, operačného tímu, času a materiálov
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* SCROLLOVATEĽNÉ TELO FORMULÁRA */}
        <form onSubmit={handleSubmit} className="overflow-y-auto pr-1 space-y-4 text-xs flex-1">
          
          {/* UPOZORNENIE NA KOLÍZIU SÁLY ALEBO LEKÁRA */}
          {conflictingEvents.length > 0 && (
            <div className="bg-amber-50 border-2 border-amber-400 p-3 rounded-xl space-y-1.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase text-amber-950 flex items-center gap-1.5">
                  <span>⚠️</span> Pozor: Časová kolízia ({conflictingEvents.length}x)
                </span>
                <span className="text-[9px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded uppercase">
                  Prekrytie v kalendári
                </span>
              </div>
              <div className="space-y-1">
                {conflictingEvents.slice(0, 3).map(cEvt => {
                  const cRoom = getRoomInfo(cEvt.roomId);
                  return (
                    <div key={cEvt.id} className="text-[11px] text-amber-900 bg-white/80 px-2.5 py-1 rounded border border-amber-200 flex items-center justify-between gap-2">
                      <span className="font-bold truncate">
                        ⏱️ {cEvt.startTime} – {cEvt.endTime} • {cEvt.title} ({cEvt.patientName})
                      </span>
                      <span className="text-[10px] font-semibold text-amber-800 shrink-0">
                        {cRoom.icon} {cRoom.shortName} • {cEvt.operator || cEvt.doctorName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 1. VÝBER MIESTNOSTI / SÁLY (KALENDÁRA) */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-bold text-[#8C857B] mb-1.5">
              1. Miestnosť / Sála (Pracovisko) *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CLINIC_ROOMS
                .filter(room => !lockRoomId || room.id === lockRoomId)
                .map(room => {
                const isSelected = (formData.roomId || 'ambulancia') === room.id;
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, roomId: room.id }))}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
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
                className={`py-2 px-2 text-[10px] font-bold rounded-xl border uppercase transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  formData.type === 'operacia' ? 'bg-[#2C2A29] text-white border-[#2C2A29] shadow-xs' : 'bg-[#FBF9F6] text-[#2C2A29] border-[#E8E2D9]'
                }`}
              >
                <span>🔪</span> Operácia
              </button>
              <button 
                type="button" 
                onClick={() => handleTypeChange('konzultacia')} 
                className={`py-2 px-2 text-[10px] font-bold rounded-xl border uppercase transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  formData.type === 'konzultacia' ? 'bg-amber-100 border-amber-500 text-amber-900 shadow-xs' : 'bg-[#FBF9F6] text-[#2C2A29] border-[#E8E2D9]'
                }`}
              >
                <span>🩺</span> Konzultácia
              </button>
              <button 
                type="button" 
                onClick={() => handleTypeChange('osetrenie')} 
                className={`py-2 px-2 text-[10px] font-bold rounded-xl border uppercase transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  formData.type === 'osetrenie' ? 'bg-emerald-100 border-emerald-500 text-emerald-900 shadow-xs' : 'bg-[#FBF9F6] text-[#2C2A29] border-[#E8E2D9]'
                }`}
              >
                <span>💉</span> Ošetrenie
              </button>
              <button 
                type="button" 
                onClick={() => handleTypeChange('kontrola')} 
                className={`py-2 px-2 text-[10px] font-bold rounded-xl border uppercase transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  formData.type === 'kontrola' ? 'bg-blue-100 border-blue-500 text-blue-900 shadow-xs' : 'bg-[#FBF9F6] text-[#2C2A29] border-[#E8E2D9]'
                }`}
              >
                <span>🔍</span> Kontrola
              </button>
              <button 
                type="button" 
                onClick={() => handleTypeChange('volno')} 
                className={`py-2 px-2 text-[10px] font-bold rounded-xl border uppercase transition-all flex items-center justify-center gap-1 col-span-2 sm:col-span-1 cursor-pointer ${
                  formData.type === 'volno' ? 'bg-indigo-100 border-indigo-500 text-indigo-900 shadow-xs' : 'bg-[#FBF9F6] text-[#2C2A29] border-[#E8E2D9]'
                }`}
              >
                <span>🎉</span> Voľno / Interné
              </button>
            </div>
          </div>

          {/* RÝCHLE ŠABLÓNY PRE OPERÁCIE */}
          {formData.type === 'operacia' && (
            <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E8E2D9] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-[#2C2A29] flex items-center gap-1">
                  <span>⚡</span> Rýchla šablóna operácie (predvyplní trvanie, anestéziu, pobyt a materiál)
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SURGERY_PROCEDURE_PRESETS.map(preset => {
                  const isActive = formData.title === preset.label;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplySurgeryPreset(preset)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border cursor-pointer flex items-center gap-1 ${
                        isActive
                          ? 'bg-[#2C2A29] text-white border-[#2C2A29] shadow-2xs'
                          : 'bg-white text-[#2C2A29] border-[#E0D8C8] hover:border-[#C5A059] hover:bg-[#FBF9F6]'
                      }`}
                    >
                      <span>{preset.shortLabel}</span>
                      <span className={`text-[8.5px] px-1 rounded ${isActive ? 'bg-white/20 text-white' : 'bg-black/5 text-[#8C857B]'}`}>
                        {preset.durationMinutes}m • {preset.anesthesiaType}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* RÝCHLE ŠABLÓNY PRE ESTETICKÉ OŠETRENIA */}
          {formData.type === 'osetrenie' && (
            <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200 space-y-2">
              <span className="text-[10px] uppercase font-bold text-emerald-950 flex items-center gap-1">
                <span>✨</span> Rýchla voľba estetického ošetrenia:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {TREATMENT_PROCEDURE_PRESETS.map(preset => {
                  const isActive = formData.title === preset.label;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyTreatmentPreset(preset)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border cursor-pointer flex items-center gap-1 ${
                        isActive
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                          : 'bg-white text-emerald-950 border-emerald-200 hover:bg-emerald-100/60'
                      }`}
                    >
                      <span>{preset.shortLabel}</span>
                      <span className={`text-[8.5px] px-1 rounded ${isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                        {preset.durationMinutes}m • {preset.defaultPrice} €
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. ŠPECIFICKÁ SEKCIA: VOĽNÝ POPIS UDALOSTI (OBED, DOVOLENKA, TEAMBUILDING, ŠKOLENIE...) */}
          {formData.type === 'volno' && (
            <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-indigo-900 flex items-center gap-1">
                  <span>📌</span> Rýchla voľba internej udalosti
                </span>
                <span className="text-[9px] text-indigo-700">Kliknutím predvyplníte kategóriu</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {FREEFORM_PRESETS.map(preset => {
                  const isSelected = formData.freeformCategory === preset.category;
                  return (
                    <button
                      key={preset.category}
                      type="button"
                      onClick={() => handleFreeformCategorySelect(preset)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 border cursor-pointer ${
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
                <div className="relative">
                  <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Meno pacienta *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Meno a priezvisko (aj bez diakritiky)..."
                    value={formData.patientName || ''} 
                    onFocus={() => setShowPatientSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowPatientSuggestions(false), 180)}
                    onChange={e => {
                      setFormData(prev => ({ ...prev, patientName: e.target.value }));
                      setShowPatientSuggestions(true);
                    }} 
                    className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6] font-semibold text-xs" 
                  />
                  {patientSuggestions.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-[#E8E2D9] rounded-xl shadow-lg overflow-hidden py-1 max-h-48 overflow-y-auto">
                      <div className="px-3 py-1 text-[9px] font-bold text-[#8C857B] bg-[#FAF8F5] uppercase tracking-wider">
                        Našepkávač z kartotéky:
                      </div>
                      {patientSuggestions.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setFormData(prev => ({
                              ...prev,
                              patientName: p.name,
                              patientPhone: p.phone || prev.patientPhone,
                              patientEmail: p.email || prev.patientEmail,
                              patientId: p.id,
                            }));
                            setShowPatientSuggestions(false);
                            if (formData.type === 'kontrola') {
                              handleAutoLoadPostOpData(p.id, p.name);
                            }
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-[#FAF8F5] flex items-center justify-between border-b border-[#E8E2D9]/40 last:border-b-0 transition-colors cursor-pointer"
                        >
                          <div>
                            <span className="text-xs font-bold text-[#2C2A29]">{p.name}</span>
                            {p.birthNumber && (
                              <span className="text-[10px] text-[#8C857B] ml-2">RČ: {p.birthNumber}</span>
                            )}
                          </div>
                          {p._isFuzzyMatch && (
                            <span className="text-[9px] bg-[#C5A059]/15 text-[#9C7D2B] px-1.5 py-0.5 rounded font-medium">
                              Zhoda
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
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

          {/* 5. POOPERAČNÁ KONTROLA: PREPOJENIE NA PREDCHÁDZAJÚCU OPERÁCIU A INTERVALY */}
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
                  onClick={() => handleAutoLoadPostOpData()}
                  className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                  title="Vyhľadá a natiahne posledný operačný protokol pacienta z kartotéky"
                >
                  <span>⚡</span> Načítať z dokumentov pacienta
                </button>
              </div>

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
                        className={`p-2 rounded-lg text-[10px] text-left transition-all border cursor-pointer ${
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
                    {CLINIC_STAFF.filter(s => s.type === 'doctor').map(st => (
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

              {/* 1. DRUH ANESTÉZIE */}
              <div className="bg-white p-3 rounded-xl border border-[#E0D8C8] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-bold text-[#2C2A29] flex items-center gap-1.5">
                    <span>💉</span> Druh anestézie *
                  </label>
                  <span className="text-[9px] text-[#8C857B] font-semibold">Klinika preferuje primárne TIVA a LA</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAnesthesiaSelect('TIVA')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
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

                  <button
                    type="button"
                    onClick={() => handleAnesthesiaSelect('LA')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
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

                  <button
                    type="button"
                    onClick={() => handleAnesthesiaSelect('Sedácia')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
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

                  <button
                    type="button"
                    onClick={() => handleAnesthesiaSelect('Celková anestézia (OAIM)')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
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
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, clinicStay: 'ambulantne' }))}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
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
                          <span className="text-sky-600 text-xs font-bold">✓</span>
                        )}
                      </div>
                      <p className="text-[10px] text-sky-900/80 leading-tight mt-0.5">
                        Odchod domov v deň zákroku
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, clinicStay: 'dospanie' }))}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
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
                          <span className="text-amber-600 text-xs font-bold">✓</span>
                        )}
                      </div>
                      <p className="text-[10px] text-amber-900/80 leading-tight mt-0.5">
                        Observácia na dospávacej izbe
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, clinicStay: 'hospitalizacia' }))}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
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
                          <span className="text-indigo-600 text-xs font-bold">✓</span>
                        )}
                      </div>
                      <p className="text-[10px] text-indigo-900/80 leading-tight mt-0.5">
                        Prenocovanie s 24h starostlivosťou
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* A. Tím na sále */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-1">
                    🔪 Kto operuje (Operatér) *
                  </label>
                  <select
                    value={formData.operator || formData.doctorName || 'MUDr. Ján Mráz'}
                    onChange={e => setFormData(prev => ({ ...prev, operator: e.target.value, doctorName: e.target.value, assignedTo: e.target.value }))}
                    className="w-full border border-[#D9CFC0] p-1.5 rounded-lg bg-white font-bold text-xs"
                  >
                    <option value="MUDr. Ján Mráz">MUDr. Ján Mráz (Plastický chirurg)</option>
                    <option value="MUDr. Zuzana Sroková">MUDr. Zuzana Sroková (Plastický chirurg)</option>
                    <option value="MUDr. Minh Tuong Tran">MUDr. Minh Tuong Tran (Chirurg)</option>
                    <option value="Iný externý operatér">Iný externý operatér...</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-1">
                    💉 Kto je anesteziológ *
                  </label>
                  <select
                    value={formData.anesthesiologist || 'MUDr. Martin Kasáč'}
                    onChange={e => setFormData(prev => ({ ...prev, anesthesiologist: e.target.value }))}
                    className="w-full border border-[#D9CFC0] p-1.5 rounded-lg bg-white font-bold text-xs"
                  >
                    <optgroup label="Stáli anesteziológovia kliniky">
                      <option value="MUDr. Martin Kasáč">MUDr. Martin Kasáč (OAIM)</option>
                      <option value="MUDr. Vladimír Vrban">MUDr. Vladimír Vrban (OAIM)</option>
                      <option value="MUDr. Monika Gombošová">MUDr. Monika Gombošová (OAIM)</option>
                      <option value="MUDr. Martina Hudecová">MUDr. Martina Hudecová (OAIM)</option>
                    </optgroup>
                    <optgroup label="Ostatní / Externí">
                      <option value="MUDr. Peter Kováč">MUDr. Peter Kováč (OAIM)</option>
                      <option value="MUDr. Viera Nováková">MUDr. Viera Nováková (OAIM)</option>
                      <option value="Externý anesteziológ">Externý anesteziológ</option>
                    </optgroup>
                    <optgroup label="Typ anestézie bez OAIM">
                      <option value="Lokálna anestézia (bez OAIM)">Lokálna anestézia (bez OAIM)</option>
                      <option value="Sedácia / Analgosedácia">Sedácia / Analgosedácia</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-1">
                    🩺 Anesteziologická sestra
                  </label>
                  <select
                    value={formData.anesthesiaNurse || 'Denisa Halajová'}
                    onChange={e => setFormData(prev => ({ ...prev, anesthesiaNurse: e.target.value }))}
                    className="w-full border border-[#D9CFC0] p-1.5 rounded-lg bg-white text-xs"
                  >
                    <optgroup label="Stále anest. sestry kliniky">
                      <option value="Denisa Halajová">Denisa Halajová (Anest. sestra)</option>
                      <option value="Ivana Bešinová">Ivana Bešinová (Anest. sestra)</option>
                    </optgroup>
                    <optgroup label="Ostatné sestry">
                      <option value="Bc. Jana Malá">Bc. Jana Malá</option>
                      <option value="Ema Foltáni">Ema Foltáni</option>
                      <option value="Sabina Lenhartová">Sabina Lenhartová</option>
                      <option value="Viktória Foltániová">Viktória Foltániová</option>
                      <option value="Anesteziologická sestra">Anesteziologická sestra</option>
                    </optgroup>
                    <option value="Žiadna (lokálna anestézia)">Žiadna (lokálna anestézia)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-1">
                    🧤 Inštrumentárka *
                  </label>
                  <select
                    value={formData.scrubNurse || 'Katarína Otiepková'}
                    onChange={e => setFormData(prev => ({ ...prev, scrubNurse: e.target.value }))}
                    className="w-full border border-[#D9CFC0] p-1.5 rounded-lg bg-white text-xs font-semibold"
                  >
                    <optgroup label="Stále inštrumentárky kliniky">
                      <option value="Katarína Otiepková">Katarína Otiepková</option>
                      <option value="Erika Čunderlíková">Erika Čunderlíková</option>
                      <option value="Izabela Rafanedisová">Izabela Rafanedisová</option>
                      <option value="Anna Papánová">Anna Papánová</option>
                      <option value="Sabina Lenhartová">Sabina Lenhartová</option>
                      <option value="Ema Foltáni">Ema Foltáni</option>
                    </optgroup>
                    <optgroup label="Ostatný personál">
                      <option value="Viktória Foltániová">Viktória Foltániová</option>
                      <option value="Bc. Jana Malá">Bc. Jana Malá</option>
                      <option value="Externá inštrumentárka">Externá inštrumentárka</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* B. Špeciálne vybavenie / prístroje */}
              <div className="pt-2 border-t border-[#E0D8C8] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[9px] uppercase font-bold text-[#8C857B]">
                    ⚡ Špeciálne vybavenie / prístroje (vyberte kliknutím)
                  </label>
                  {(formData.specialEquipment || []).length > 0 && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, specialEquipment: [] }))}
                      className="text-[9px] text-rose-700 hover:underline font-bold cursor-pointer"
                    >
                      Vymazať výber ({(formData.specialEquipment || []).length})
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SURGERY_EQUIPMENT_OPTIONS.map(eq => {
                    const isChecked = (formData.specialEquipment || []).includes(eq);
                    return (
                      <button
                        key={eq}
                        type="button"
                        onClick={() => toggleEquipment(eq)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
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
                <input
                  type="text"
                  placeholder="Iný špecifický prístroj / inštrumentárium (nepovinné)..."
                  value={formData.specialEquipmentOther || ''}
                  onChange={e => setFormData(prev => ({ ...prev, specialEquipmentOther: e.target.value }))}
                  className="w-full border border-[#D9CFC0] p-1.5 rounded-lg bg-white text-xs focus:outline-[#C5A059]"
                />
              </div>

              {/* C. Potrebný materiál */}
              <div className="pt-2 border-t border-[#E0D8C8] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[9px] uppercase font-bold text-[#8C857B]">
                    🍈 Potrebný materiál & Implantáty (vyberte kliknutím)
                  </label>
                  {(formData.materials || []).length > 0 && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, materials: [] }))}
                      className="text-[9px] text-rose-700 hover:underline font-bold cursor-pointer"
                    >
                      Vymazať výber ({(formData.materials || []).length})
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SURGERY_MATERIAL_OPTIONS.map(mat => {
                    const isChecked = (formData.materials || []).includes(mat);
                    return (
                      <button
                        key={mat}
                        type="button"
                        onClick={() => toggleMaterial(mat)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
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
                  placeholder={selectedPresetHint || 'Presná špecifikácia materiálu (napr. Motiva Ergonomix 340cc Demi, Lipoelastic veľkosť M...)'}
                  value={formData.materialNotes || ''}
                  onChange={e => setFormData(prev => ({ ...prev, materialNotes: e.target.value }))}
                  className="w-full border border-[#D9CFC0] p-2 rounded-lg bg-white text-xs focus:outline-[#C5A059]"
                />
              </div>

              {/* D. PREDOPERAČNÝ SEMAFOR (PRIPRAVENOSŤ PACIENTA NA SÁLU) */}
              <div className="pt-2 border-t border-[#E0D8C8] space-y-2">
                {(() => {
                  const readiness = getSurgeryReadinessSummary(formData);
                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <label className="block text-[9px] uppercase font-bold text-[#2C2A29] flex items-center gap-1.5">
                          <span>🚦</span> Predoperačný semafor pripravenosti
                        </label>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${readiness.badgeClass}`}>
                          {readiness.statusLabel}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {readiness.items.map(item => (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                            className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                              item.ready
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-950 shadow-2xs'
                                : 'bg-white border-[#D9CFC0] text-[#6B6357] hover:border-[#C5A059]'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-sm shrink-0">{item.icon}</span>
                              <span className="text-[10px] font-bold leading-tight truncate">{item.shortLabel}</span>
                            </div>
                            <span className={`text-[10px] font-black shrink-0 px-1.5 py-0.5 rounded ${
                              item.ready ? 'bg-emerald-600 text-white' : 'bg-rose-100 text-rose-700'
                            }`}>
                              {item.ready ? '✓ OK' : 'Chýba'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* E. AUTOMATICKÉ NADVÄZUJÚCE BLOKY PO OPERÁCII (LEN PRI VYTVÁRANÍ) */}
              {!isEditMode && (
                <div className="pt-2 border-t border-[#E0D8C8] space-y-2">
                  <span className="block text-[9px] uppercase font-bold text-[#8C857B]">
                    ⚙️ Automatické nadväzujúce bloky v kalendári po skončení operácie
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className={`p-2.5 rounded-xl border flex items-start gap-2 cursor-pointer transition-all ${
                      extraOptions.autoCreateSanitationBlock
                        ? 'bg-indigo-50/80 border-indigo-400 text-indigo-950'
                        : 'bg-white border-[#D9CFC0] text-[#2C2A29]'
                    }`}>
                      <input
                        type="checkbox"
                        checked={!!extraOptions.autoCreateSanitationBlock}
                        onChange={e => setExtraOptions(prev => ({ ...prev, autoCreateSanitationBlock: e.target.checked }))}
                        className="accent-indigo-600 mt-0.5 w-3.5 h-3.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold">🧼 Sanitácia sály po operácii</span>
                          <select
                            value={extraOptions.sanitationMinutes || 20}
                            onClick={e => e.stopPropagation()}
                            onChange={e => setExtraOptions(prev => ({ ...prev, sanitationMinutes: Number(e.target.value) }))}
                            className="text-[9px] font-bold bg-white border border-indigo-200 rounded px-1 py-0.5"
                          >
                            <option value={15}>15 min</option>
                            <option value={20}>20 min</option>
                            <option value={30}>30 min</option>
                          </select>
                        </div>
                        <p className="text-[9px] text-[#8C857B] leading-tight mt-0.5">
                          Automaticky vytvorí blok upratovania a sterilizácie v tej istej sále
                        </p>
                      </div>
                    </label>

                    <label className={`p-2.5 rounded-xl border flex items-start gap-2 cursor-pointer transition-all ${
                      extraOptions.autoCreateRecoveryBlock
                        ? 'bg-emerald-50/80 border-emerald-400 text-emerald-950'
                        : 'bg-white border-[#D9CFC0] text-[#2C2A29]'
                    }`}>
                      <input
                        type="checkbox"
                        checked={!!extraOptions.autoCreateRecoveryBlock}
                        onChange={e => setExtraOptions(prev => ({ ...prev, autoCreateRecoveryBlock: e.target.checked }))}
                        className="accent-emerald-600 mt-0.5 w-3.5 h-3.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold">🛏️ Rezervovať Dospávaciu izbu</span>
                          <select
                            value={extraOptions.recoveryMinutes || 120}
                            onClick={e => e.stopPropagation()}
                            onChange={e => setExtraOptions(prev => ({ ...prev, recoveryMinutes: Number(e.target.value) }))}
                            className="text-[9px] font-bold bg-white border border-emerald-200 rounded px-1 py-0.5"
                          >
                            <option value={60}>1 hod</option>
                            <option value={120}>2 hod</option>
                            <option value={180}>3 hod</option>
                            <option value={240}>4 hod</option>
                          </select>
                        </div>
                        <p className="text-[9px] text-[#8C857B] leading-tight mt-0.5">
                          Automaticky vytvorí nadväzujúci blok lôžka v Dospávacej miestnosti
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 6. DÁTUM, ČASOVÝ ROZSAH A RÝCHLA DĹŽKA TRVANIA */}
          <div className="bg-[#FBF9F6] p-3.5 rounded-xl border border-[#E8E2D9] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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
                  onChange={e => handleStartTimeChange(e.target.value)} 
                  className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white disabled:opacity-50 font-mono font-bold" 
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">
                  Čas konca {currentDurationMinutes > 0 && !formData.isAllDay ? `(${currentDurationMinutes} min)` : ''}
                </label>
                <input 
                  type="time" 
                  disabled={formData.isAllDay}
                  value={formData.endTime || '10:00'} 
                  onChange={e => setFormData(prev => ({ ...prev, endTime: e.target.value }))} 
                  className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white disabled:opacity-50 font-mono font-bold" 
                />
              </div>
            </div>

            {!formData.isAllDay && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#E8E2D9]/60">
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[9px] uppercase font-bold text-[#8C857B] mr-1">Trvanie:</span>
                  {DURATION_PRESET_MINUTES.map(d => {
                    const isActive = currentDurationMinutes === d.minutes;
                    return (
                      <button
                        key={d.minutes}
                        type="button"
                        onClick={() => handleSetDuration(d.minutes)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors border cursor-pointer ${
                          isActive
                            ? 'bg-[#2C2A29] text-white border-[#2C2A29]'
                            : 'bg-white text-[#6B6357] border-[#E8E2D9] hover:border-[#C5A059]'
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>

                <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2.5 py-1 border border-[#E8E2D9] rounded-lg">
                  <input 
                    type="checkbox" 
                    checked={formData.isAllDay || false} 
                    onChange={e => setFormData(prev => ({ ...prev, isAllDay: e.target.checked }))} 
                    className="accent-[#C5A059] w-3.5 h-3.5" 
                  />
                  <span className="text-[10px] uppercase font-bold text-[#2C2A29]">☀️ Celodenná</span>
                </label>
              </div>
            )}

            {formData.isAllDay && (
              <label className="flex items-center gap-2 cursor-pointer bg-amber-50 px-3 py-1.5 border border-amber-300 rounded-lg w-fit">
                <input 
                  type="checkbox" 
                  checked={formData.isAllDay || false} 
                  onChange={e => setFormData(prev => ({ ...prev, isAllDay: e.target.checked }))} 
                  className="accent-[#C5A059] w-3.5 h-3.5" 
                />
                <span className="text-[10px] uppercase font-bold text-amber-950">☀️ Celodenná udalosť (kliknite pre zadanie hodín)</span>
              </label>
            )}

            {/* OPAKOVANIE UDALOSTI (LEN PRI VYTVÁRANÍ) */}
            {!isEditMode && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E8E2D9]/60">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] uppercase font-bold text-[#8C857B]">🔁 Opakovanie:</span>
                  <select
                    value={extraOptions.recurrenceRule || 'none'}
                    onChange={e => setExtraOptions(prev => ({ ...prev, recurrenceRule: e.target.value as RecurrenceRule }))}
                    className="border border-[#E8E2D9] bg-white rounded-lg px-2.5 py-1 text-[10px] font-bold text-[#2C2A29] focus:outline-[#C5A059]"
                  >
                    <option value="none">Bez opakovania (jednorazovo)</option>
                    <option value="workdays_week">Po – Pi (každý pracovný deň v týždni)</option>
                    <option value="weekly">Každý týždeň (rovnaký deň)</option>
                    <option value="biweekly">Každé 2 týždne</option>
                    <option value="monthly">Každý mesiac</option>
                  </select>
                </div>

                {extraOptions.recurrenceRule && extraOptions.recurrenceRule !== 'none' && extraOptions.recurrenceRule !== 'workdays_week' && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] uppercase font-bold text-[#8C857B]">Počet výskytov:</span>
                    <select
                      value={extraOptions.recurrenceCount || 4}
                      onChange={e => setExtraOptions(prev => ({ ...prev, recurrenceCount: Number(e.target.value) }))}
                      className="border border-[#E8E2D9] bg-white rounded-lg px-2 py-1 text-[10px] font-bold text-[#C5A059]"
                    >
                      {[2, 3, 4, 6, 8, 10, 12].map(cnt => (
                        <option key={cnt} value={cnt}>{cnt}x po sebe</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 7. FINANČNÉ POLOŽKY & STAV POTVRDENIA (LEN PRE MEDICÍNSKE ZÁKROKY) */}
          {formData.type !== 'volno' && (
            hidePrices ? (
              <div className="bg-[#FBF9F6] p-3 rounded-xl border border-[#E8E2D9]">
                <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-1">Stav návštevy</label>
                <select
                  value={formData.status || 'planned'}
                  onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as EventAttendanceStatus }))}
                  className="w-full border border-[#E8E2D9] p-1.5 rounded-lg bg-white font-bold"
                >
                  {EVENT_STATUS_OPTIONS.filter(s => s.id !== 'cancelled').map(st => (
                    <option key={st.id} value={st.id}>
                      {st.icon} {st.shortLabel}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-[#FBF9F6] p-3 rounded-xl border border-[#E8E2D9]">
                <div>
                  <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-1">Celková cena (€)</label>
                  <input 
                    type="number" 
                    value={formData.totalPrice ?? 0} 
                    onChange={e => setFormData(prev => ({ ...prev, totalPrice: Number(e.target.value) }))} 
                    className="w-full border border-[#E8E2D9] p-1.5 rounded-lg bg-white font-mono font-bold" 
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-1">Záloha (€)</label>
                  <input 
                    type="number" 
                    value={formData.depositAmount ?? 0} 
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
                    <option value="unpaid">🔴 Neuhradené</option>
                    <option value="paid">🟢 Hradené</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-1">Stav návštevy</label>
                  <select
                    value={formData.status || 'planned'}
                    onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as EventAttendanceStatus }))}
                    className="w-full border border-[#E8E2D9] p-1.5 rounded-lg bg-white font-bold"
                  >
                    {EVENT_STATUS_OPTIONS.filter(s => s.id !== 'cancelled').map(st => (
                      <option key={st.id} value={st.id}>
                        {st.icon} {st.shortLabel}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )
          )}

          {/* 8. POZNÁMKY */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Podrobný popis / Poznámky</label>
            <textarea
              rows={2}
              placeholder="Doplňujúce pokyny k výkonu, alergiám, predoperačnému vyšetreniu alebo organizácii dňa..."
              value={formData.notes || ''}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6] text-xs focus:outline-[#C5A059]"
            />
          </div>

          {/* TLAČIDLÁ V SPODNEJ ČASTI */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#E8E2D9] shrink-0">
            <div>
              {isEditMode && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Naozaj chcete natrvalo zmazať udalosť "${formData.title || 'tento termín'}" zo SAY OS aj z Google Kalendára?`)) {
                      onDelete(formData);
                    }
                  }}
                  className="px-3.5 py-2 text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer"
                  title="Odstrániť zo systému a z Google Kalendára"
                >
                  <span>🗑️</span> Zmazať udalosť
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-4 py-2 font-bold text-[11px] uppercase tracking-wider text-[#8C857B] hover:text-[#2C2A29] cursor-pointer"
              >
                Zrušiť
              </button>
              <button 
                type="submit" 
                disabled={isSaving}
                className="px-6 py-2 bg-[#2C2A29] hover:bg-[#C5A059] text-white font-bold text-[11px] uppercase tracking-wider rounded-xl shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? 'Ukladám...' : (isEditMode ? 'Uložiť zmeny' : 'Vytvoriť termín')}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
