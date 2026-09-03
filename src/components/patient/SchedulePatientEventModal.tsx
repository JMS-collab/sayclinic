'use client';

import React, { useState, useEffect } from 'react';
import { 
  CalendarEvent, 
  EventType, 
  CLINIC_ROOMS, 
  CLINIC_STAFF, 
  POST_OP_CONTROL_PRESETS,
  calculateTargetControlDate,
  getPostOpTimeDiff
} from '../../data/calendarConfig';
import { Patient, MedicalRecord } from '../PatientDatabase';
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  X, 
  User, 
  Sparkles,
  CalendarCheck
} from 'lucide-react';

interface SchedulePatientEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  sourceRecord?: MedicalRecord | null;
  allRecords?: MedicalRecord[];
  initialEventDetails?: {
    title?: string;
    eventType?: EventType;
    notes?: string;
    targetDate?: string;
    doctor?: string;
  };
  onSaveEvent: (event: CalendarEvent) => Promise<void> | void;
  onNavigateToCalendar?: () => void;
}

export default function SchedulePatientEventModal({
  isOpen,
  onClose,
  patient,
  sourceRecord,
  allRecords = [],
  initialEventDetails,
  onSaveEvent,
  onNavigateToCalendar
}: SchedulePatientEventModalProps) {
  // Nájdenie relevantných operačných záznamov pacienta
  const surgeryRecords = allRecords.filter(r => 
    r.type?.toLowerCase().includes('opera') || 
    r.type?.toLowerCase().includes('protokol') ||
    r.title?.toLowerCase().includes('augmentác') ||
    r.title?.toLowerCase().includes('lipo') ||
    r.title?.toLowerCase().includes('blefaro') ||
    r.title?.toLowerCase().includes('plastik')
  );

  const initialSurgery = sourceRecord || (surgeryRecords.length > 0 ? surgeryRecords[0] : null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Výpočet počiatočného termínu (napr. 14 dní po operácii alebo zajtra)
  const defaultTargetDate = initialSurgery?.date 
    ? calculateTargetControlDate(initialSurgery.date, 14)
    : todayStr;

  const [eventType, setEventType] = useState<EventType>('kontrola');
  const [selectedRecordId, setSelectedRecordId] = useState<string>(initialSurgery?.id || '');
  const [operationTitle, setOperationTitle] = useState<string>(initialSurgery?.title || '');
  const [operationDate, setOperationDate] = useState<string>(initialSurgery?.date || '');
  const [operationDoctor, setOperationDoctor] = useState<string>(initialSurgery?.doctor || 'MUDr. Ján Mráz');
  const [operationNotes, setOperationNotes] = useState<string>(initialSurgery?.content || '');
  const [controlInterval, setControlInterval] = useState<string>('Vybratie stehov / kontrola jazvy (+14 dní)');

  const [eventDate, setEventDate] = useState<string>(defaultTargetDate);
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('09:30');
  const [roomId, setRoomId] = useState<string>('ambulancia');
  const [assignedDoctor, setAssignedDoctor] = useState<string>(initialSurgery?.doctor || 'MUDr. Ján Mráz');
  const [notes, setNotes] = useState<string>('');

  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializácia hodnôt pri otvorení modálu
  useEffect(() => {
    if (isOpen) {
      setIsSavedSuccessfully(false);
      
      if (initialEventDetails) {
        setSelectedRecordId('');
        setOperationTitle(initialEventDetails.title || '');
        setOperationDate('');
        setEventType(initialEventDetails.eventType || 'osetrenie');
        setControlInterval('');
        setEventDate(initialEventDetails.targetDate || new Date().toISOString().split('T')[0]);
        if (initialEventDetails.doctor) setAssignedDoctor(initialEventDetails.doctor);
        setNotes(initialEventDetails.notes || '');
        return;
      }

      const surg = sourceRecord || (surgeryRecords.length > 0 ? surgeryRecords[0] : null);
      if (surg) {
        setSelectedRecordId(surg.id);
        setOperationTitle(surg.title);
        setOperationDate(surg.date);
        setOperationDoctor(surg.doctor || 'MUDr. Ján Mráz');
        setOperationNotes(surg.content || '');
        setEventType('kontrola');
        setControlInterval('Vybratie stehov / kontrola jazvy (+14 dní)');
        setEventDate(calculateTargetControlDate(surg.date, 14));
        setAssignedDoctor(surg.doctor || 'MUDr. Ján Mráz');
        setNotes(`Pooperačná kontrola po ${surg.title}. Skontrolovať hojenie rán.`);
      } else {
        const today = new Date().toISOString().split('T')[0];
        setSelectedRecordId('');
        setOperationTitle('');
        setOperationDate('');
        setEventType('kontrola');
        setControlInterval('');
        setEventDate(today);
        setNotes('');
      }
    }
  }, [isOpen, sourceRecord, surgeryRecords, initialEventDetails]);

  if (!isOpen) return null;

  // Prepnutie vybraného operačného záznamu
  const handleSelectRecord = (recId: string) => {
    setSelectedRecordId(recId);
    const rec = allRecords.find(r => r.id === recId);
    if (rec) {
      setOperationTitle(rec.title);
      setOperationDate(rec.date);
      setOperationDoctor(rec.doctor || 'MUDr. Ján Mráz');
      setOperationNotes(rec.content || '');
      setAssignedDoctor(rec.doctor || 'MUDr. Ján Mráz');
      setEventDate(calculateTargetControlDate(rec.date, 14));
      setControlInterval('Vybratie stehov / kontrola jazvy (+14 dní)');
      setNotes(`Pooperačná kontrola po ${rec.title}. Skontrolovať hojenie rán.`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let finalTitle = '';
    if (eventType === 'kontrola') {
      finalTitle = operationTitle 
        ? `Pooperačná kontrola — ${operationTitle}` 
        : `Pooperačná kontrola: ${patient.name}`;
    } else if (eventType === 'operacia') {
      finalTitle = operationTitle ? `Operácia: ${operationTitle}` : `Operačný zákrok: ${patient.name}`;
    } else if (eventType === 'konzultacia') {
      finalTitle = `Konzultácia: ${patient.name}`;
    } else {
      finalTitle = `Ošetrenie: ${patient.name}`;
    }

    const newCalendarEvent: CalendarEvent = {
      id: `evt-${Date.now()}`,
      title: finalTitle,
      date: eventDate,
      startTime,
      endTime,
      isAllDay: false,
      type: eventType,
      roomId: roomId as any,
      doctorName: assignedDoctor,
      assignedTo: assignedDoctor,
      patientName: patient.name,
      patientPhone: patient.phone,
      patientEmail: patient.email,
      patientId: patient.id,
      notes: notes.trim(),
      // POOPERAČNÉ DÁTA Z DOKUMENTOV
      operationTitle: eventType === 'kontrola' ? operationTitle : undefined,
      operationDate: eventType === 'kontrola' ? operationDate : undefined,
      operationRecordId: eventType === 'kontrola' ? selectedRecordId : undefined,
      operationDoctor: eventType === 'kontrola' ? operationDoctor : undefined,
      operationNotes: eventType === 'kontrola' ? operationNotes : undefined,
      controlInterval: eventType === 'kontrola' ? controlInterval : undefined,
      totalPrice: eventType === 'operacia' ? 3500 : (eventType === 'konzultacia' ? 50 : 0),
      depositAmount: 0,
      isDepositPaid: false
    };

    try {
      await onSaveEvent(newCalendarEvent);
      setIsSavedSuccessfully(true);
    } catch (err) {
      console.error('Chyba pri ukladaní termínu:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#2C2A29]/75 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white p-5 sm:p-6 rounded-2xl w-full max-w-2xl shadow-2xl border border-[#E8E2D9] my-auto max-h-[92vh] flex flex-col">
        
        {/* HLAVIČKA MODALU */}
        <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-100 text-sky-800 rounded-xl">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-brand text-lg sm:text-xl font-bold text-[#2C2A29] uppercase">
                Naplánovať termín z karty pacienta
              </h3>
              <p className="text-[11px] text-[#8C857B] font-medium flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#C5A059]" />
                <strong className="text-[#2C2A29]">{patient.name}</strong> • {patient.phone || 'Bez tel.'} • RČ: {patient.birthNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#FBF9F6] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ÚSPEŠNÉ ULOŽENIE OBSAH */}
        {isSavedSuccessfully ? (
          <div className="p-6 text-center space-y-4 my-auto">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-brand text-xl font-bold text-emerald-950 uppercase">
                Termín bol úspešne zapísaný do kalendára!
              </h4>
              <p className="text-xs text-[#6B6357] mt-1">
                Požiadavka pre pacienta <strong>{patient.name}</strong> bola zaradená na <strong>{eventDate}</strong> o <strong>{startTime}</strong> v miestnosti <strong>{CLINIC_ROOMS.find(r => r.id === roomId)?.name}</strong>.
              </p>
            </div>

            {operationTitle && (
              <div className="bg-sky-50 border border-sky-200 p-3 rounded-xl max-w-md mx-auto text-left text-xs space-y-1">
                <div className="font-bold text-sky-950 flex items-center gap-1.5">
                  <span>🩺</span> Prepojené s operáciou:
                </div>
                <p className="text-sky-900 font-semibold">{operationTitle} (dátum: {operationDate})</p>
                {controlInterval && <p className="text-sky-700 text-[11px]">Fáza: {controlInterval}</p>}
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-3 pt-3">
              {onNavigateToCalendar && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToCalendar();
                  }}
                  className="px-4 py-2.5 bg-[#2C2A29] text-[#FBF9F6] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#C5A059] transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <CalendarIcon className="w-4 h-4" /> Prejsť do kalendára
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-white border border-[#E8E2D9] text-[#2C2A29] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#FBF9F6] transition-colors cursor-pointer"
              >
                Zavrieť a zostať v karte
              </button>
            </div>
          </div>
        ) : (
          /* FORMULÁR NA VYTVORENIE TERMÍNU */
          <form onSubmit={handleSubmit} className="overflow-y-auto space-y-4 pr-1 flex-1">
            
            {/* 1. TYP TERMÍNU */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#8C857B] tracking-wider mb-1.5">
                Druh požadovaného termínu *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setEventType('kontrola')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    eventType === 'kontrola'
                      ? 'bg-sky-50 border-sky-600 text-sky-950 shadow-xs ring-1 ring-sky-600'
                      : 'bg-white border-[#E8E2D9] text-[#2C2A29] hover:bg-[#FBF9F6]'
                  }`}
                >
                  <span className="text-base">🩺</span>
                  <span>Poop. kontrola</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEventType('konzultacia')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    eventType === 'konzultacia'
                      ? 'bg-amber-50 border-[#C5A059] text-[#2C2A29] shadow-xs ring-1 ring-[#C5A059]'
                      : 'bg-white border-[#E8E2D9] text-[#2C2A29] hover:bg-[#FBF9F6]'
                  }`}
                >
                  <span className="text-base">💬</span>
                  <span>Konzultácia</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEventType('operacia')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    eventType === 'operacia'
                      ? 'bg-purple-50 border-purple-600 text-purple-950 shadow-xs ring-1 ring-purple-600'
                      : 'bg-white border-[#E8E2D9] text-[#2C2A29] hover:bg-[#FBF9F6]'
                  }`}
                >
                  <span className="text-base">🏥</span>
                  <span>Operácia</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEventType('osetrenie')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    eventType === 'osetrenie'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-xs ring-1 ring-emerald-600'
                      : 'bg-white border-[#E8E2D9] text-[#2C2A29] hover:bg-[#FBF9F6]'
                  }`}
                >
                  <span className="text-base">✨</span>
                  <span>Ošetrenie / Botox</span>
                </button>
              </div>
            </div>

            {/* 2. AUTOMATICKÉ PREPOJENIE S OPERÁCIOU (DOKUMENTY PACIENTA) */}
            {eventType === 'kontrola' && (
              <div className="bg-sky-50/90 border border-sky-200 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between border-b border-sky-200 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sky-950">
                    <Sparkles className="w-4 h-4 text-sky-700" />
                    <span>Údaje o predchádzajúcej operácii (z dokumentov pacienta)</span>
                  </div>
                  {operationDate && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-600 text-white shadow-2xs">
                      {getPostOpTimeDiff(operationDate, eventDate).badgeText}
                    </span>
                  )}
                </div>

                {/* VÝBER DOKUMENTU ZO ZOZNAMU AK EXISTUJÚ ZÁZNAMY */}
                {surgeryRecords.length > 0 ? (
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-sky-900 mb-1">
                      Vybrať konkrétny operačný protokol / dokument:
                    </label>
                    <select
                      value={selectedRecordId}
                      onChange={(e) => handleSelectRecord(e.target.value)}
                      className="w-full border border-sky-300 p-2 rounded-lg bg-white text-xs font-semibold text-sky-950 focus:outline-sky-500"
                    >
                      {surgeryRecords.map(rec => (
                        <option key={rec.id} value={rec.id}>
                          {rec.title} ({rec.date}) — {rec.doctor}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <p className="text-[11px] text-sky-800 italic">
                    ℹ️ Pacient nemá v karte uložený žiadny operačný protokol. Údaje o operácii môžete vyplniť nižšie ručne.
                  </p>
                )}

                {/* EDITOVATEĽNÉ POLIA OPERÁCIE: PO ČOM A KEDY BOLA OPERÁCIA */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] uppercase font-bold text-sky-900 mb-1">
                      Po akej operácii bola kontrola *
                    </label>
                    <input
                      type="text"
                      placeholder="napr. Augmentácia prsníkov, Blefaroplastika..."
                      value={operationTitle}
                      onChange={e => setOperationTitle(e.target.value)}
                      className="w-full border border-sky-300 p-2 rounded-lg bg-white text-xs font-bold text-sky-950 focus:outline-sky-500"
                      required={eventType === 'kontrola'}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-sky-900 mb-1">
                      Dátum operácie *
                    </label>
                    <input
                      type="date"
                      value={operationDate}
                      onChange={e => {
                        setOperationDate(e.target.value);
                        if (e.target.value) {
                          setEventDate(calculateTargetControlDate(e.target.value, 14));
                        }
                      }}
                      className="w-full border border-sky-300 p-2 rounded-lg bg-white text-xs font-semibold text-sky-950 focus:outline-sky-500"
                      required={eventType === 'kontrola'}
                    />
                  </div>
                </div>

                {/* RÝCHLE PRESETY KONTROL VZŤAHUJÚCE SA K DÁTUMU OPERÁCIE */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-sky-900 mb-1.5 flex items-center justify-between">
                    <span>Odporúčané termíny kontroly od dátumu operácie:</span>
                    {operationDate && (
                      <span className="text-[9px] text-sky-700 font-normal">
                        Dátum operácie: {operationDate}
                      </span>
                    )}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {POST_OP_CONTROL_PRESETS.map(preset => {
                      const isSelected = controlInterval === preset.label;
                      const calculatedDate = operationDate 
                        ? calculateTargetControlDate(operationDate, preset.daysOffset) 
                        : null;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setControlInterval(preset.label);
                            if (operationDate) {
                              setEventDate(calculateTargetControlDate(operationDate, preset.daysOffset));
                            }
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

                {/* DETAIL OPERÁCIE / MATERIÁL */}
                {operationNotes && (
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-sky-900 mb-1">
                      Poznámky & implantáty z operačného protokolu
                    </label>
                    <div className="p-2 bg-white border border-sky-200 rounded-lg text-xs text-[#2C2A29] max-h-20 overflow-y-auto font-mono text-[11px] leading-relaxed">
                      {operationNotes}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. DÁTUM A ČAS TERMÍNU */}
            <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E8E2D9] space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#8C857B] tracking-wider mb-1">
                    Dátum termínu *
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white text-xs font-bold text-[#2C2A29]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#8C857B] tracking-wider mb-1">
                    Čas od *
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white text-xs font-bold text-[#2C2A29]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#8C857B] tracking-wider mb-1">
                    Čas do *
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white text-xs font-bold text-[#2C2A29]"
                    required
                  />
                </div>
              </div>

              {/* MIESTNOSŤ & LEKÁR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#8C857B] tracking-wider mb-1">
                    Miestnosť / Pracovisko *
                  </label>
                  <select
                    value={roomId}
                    onChange={e => setRoomId(e.target.value)}
                    className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white text-xs font-bold text-[#2C2A29]"
                  >
                    {CLINIC_ROOMS.map(room => (
                      <option key={room.id} value={room.id}>
                        {room.icon} {room.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#8C857B] tracking-wider mb-1">
                    Pridelený lekár / Operatér *
                  </label>
                  <select
                    value={assignedDoctor}
                    onChange={e => setAssignedDoctor(e.target.value)}
                    className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white text-xs font-bold text-[#2C2A29]"
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

            {/* 4. POZNÁMKY K TERMÍNU */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#8C857B] tracking-wider mb-1">
                Poznámka k termínu / Inštrukcie pre personál
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="napr. Skontrolovať usádzanie implantátu, preväz, vybratie stehov, nosenie prádla..."
                className="w-full border border-[#E8E2D9] p-2.5 rounded-lg bg-[#FBF9F6] text-xs font-medium text-[#2C2A29] focus:outline-[#C5A059]"
              />
            </div>

            {/* TLAČIDLÁ V SPODNEJ ČASTI */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8E2D9] shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs uppercase font-bold tracking-wider text-[#8C857B] hover:text-[#2C2A29] transition-colors"
                disabled={isSubmitting}
              >
                Zrušiť
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-[#2C2A29] text-[#FBF9F6] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#C5A059] transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Ukladám...</span>
                ) : (
                  <>
                    <CalendarCheck className="w-4 h-4 text-[#C5A059]" />
                    <span>Uložiť termín do kalendára</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
