'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

export type EventType = 'operacia' | 'konzultacia' | 'osetrenie' | 'kontrola';

export interface CalendarEvent {
  id: string;
  calendarId?: string;
  calendarName?: string;
  patientId?: string;
  patientName: string;
  patientPhone?: string;
  patientEmail?: string;
  doctorName: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  type: EventType;
  notes?: string;
  totalPrice?: number;
  depositAmount?: number;
  isDepositPaid?: boolean;
  isCancelled?: boolean;
  cancelReason?: string;
}

export interface GoogleCalendarItem {
  id: string;
  summary: string;
}

interface CalendarProps {
  events?: CalendarEvent[];
  patients?: Array<{ id: string; name: string; phone?: string; email?: string }>;
  onOpenPatientFolder?: (patientId: string) => void;
  onAddEvent?: (event: CalendarEvent) => void;
}

type ViewMode = 'day' | 'week' | 'month';

const TIME_SLOTS = Array.from({ length: 14 }, (_, i) => {
  const hour = i + 7;
  return `${hour < 10 ? '0' : ''}${hour}:00`;
});

export default function Calendar({ 
  events: initialPropEvents = [], 
  patients = [], 
  onOpenPatientFolder, 
  onAddEvent 
}: CalendarProps) {
  const { data: session } = useSession();
  
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(initialPropEvents);
  const [availableCalendars, setAvailableCalendars] = useState<GoogleCalendarItem[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewMode>('day');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Stav pre naťahovanie okraja (Resizing)
  const [resizingEventId, setResizingEventId] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const [cancellingEvent, setCancellingEvent] = useState<CalendarEvent | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState('Choroba pacienta');
  const [customCancelReason, setCustomCancelReason] = useState('');

  const [openEmailModal, setOpenEmailModal] = useState<CalendarEvent | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [attachAdvanceInvoice, setAttachAdvanceInvoice] = useState(true);
  const [attachInstructions, setAttachInstructions] = useState(true);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const [isSyncing, setIsSyncing] = useState(false);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  
  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    patientName: '', 
    doctorName: 'MUDr. Ján Mráz', 
    title: '', 
    date: new Date().toISOString().split('T')[0], 
    startTime: '09:00', 
    endTime: '10:00', 
    type: 'operacia',
    totalPrice: 3500,
    depositAmount: 500,
  });

  useEffect(() => {
    const cachedEvents = localStorage.getItem('say_clinic_calendar_events');
    if (cachedEvents) {
      try {
        const parsed = JSON.parse(cachedEvents);
        if (Array.isArray(parsed) && parsed.length > 0) setCalendarEvents(parsed);
      } catch (e) { console.error(e); }
    }
  }, []);

  // Výpočet pozície na časovej osi
  const timeToMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h * 60) + (m || 0);
  };

  const minutesToTimeStr = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m}`;
  };

  // REISZING (Ťahanie za spodný okraj karty)
  const handleMouseDownResize = (e: React.MouseEvent, evt: CalendarEvent) => {
    e.stopPropagation();
    setResizingEventId(evt.id);

    const startY = e.clientY;
    const startEndMin = timeToMinutes(evt.endTime);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      // 80px = 60 minut => 1.33px na minutu -> zaokrúhľujeme na 15 minút
      const deltaMinutes = Math.round((deltaY / 1.33) / 15) * 15;
      const newEndMin = Math.max(timeToMinutes(evt.startTime) + 15, startEndMin + deltaMinutes);
      const newEndTimeStr = minutesToTimeStr(newEndMin);

      setCalendarEvents(prev => {
        const updated = prev.map(item => item.id === evt.id ? { ...item, endTime: newEndTimeStr } : item);
        localStorage.setItem('say_clinic_calendar_events', JSON.stringify(updated));
        return updated;
      });
    };

    const handleMouseUp = () => {
      setResizingEventId(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const getEventBlockStyle = (startTime: string, endTime: string) => {
    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);
    const dayStartMin = 7 * 60; // 07:00
    
    const top = Math.max(0, (startMin - dayStartMin) * 1.33);
    const height = Math.max(40, (endMin - startMin) * 1.33);

    return { top: `${top}px`, height: `${height}px` };
  };

  const filteredEvents = calendarEvents.filter(e => {
    const matchesCalendar = selectedCalendarId === 'all' || e.calendarId === selectedCalendarId;
    const matchesType = selectedTypeFilter === 'all' || e.type === selectedTypeFilter;
    return matchesCalendar && matchesType;
  });

  const handleConfirmCancelEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingEvent) return;
    const finalReason = cancelReasonInput === 'Iné' ? customCancelReason : cancelReasonInput;

    setCalendarEvents(prev => {
      const updated = prev.map(evt => evt.id === cancellingEvent.id ? { ...evt, isCancelled: true, cancelReason: finalReason } : evt);
      localStorage.setItem('say_clinic_calendar_events', JSON.stringify(updated));
      return updated;
    });

    setCancellingEvent(null);
    setSelectedEvent(null);
  };

  const renderDayView = () => {
    const formattedDate = currentDate.toISOString().split('T')[0];
    const dayEvents = filteredEvents.filter(e => e.date === formattedDate);

    return (
      <div ref={timelineRef} className="relative border border-[#E8E2D9] rounded-2xl bg-white overflow-hidden shadow-sm select-none">
        <div className="relative min-h-[1040px]">
          {TIME_SLOTS.map((slotTime) => (
            <div key={slotTime} className="h-[80px] border-b border-[#E8E2D9]/50 flex items-start">
              <div className="w-16 text-right pr-3 pt-1 font-mono text-[10px] font-bold text-[#8C857B] border-r border-[#E8E2D9]">
                {slotTime}
              </div>
              <div className="flex-1 h-full bg-[#FBF9F6]/20"></div>
            </div>
          ))}

          {/* ČISTÉ A PREHĽADNÉ KARTY NA OSIS */}
          <div className="absolute top-0 left-16 right-0 bottom-0 p-1 pointer-events-none">
            {dayEvents.map(evt => {
              const blockStyle = getEventBlockStyle(evt.startTime, evt.endTime);

              return (
                <div 
                  key={evt.id} 
                  style={blockStyle} 
                  onClick={() => setSelectedEvent(evt)}
                  className={`absolute left-3 right-3 rounded-xl p-2.5 shadow-sm border pointer-events-auto cursor-pointer transition-all flex flex-col justify-between group ${
                    evt.isCancelled 
                      ? 'bg-gray-100 border-gray-300 opacity-60 line-through' 
                      : evt.type === 'operacia'
                      ? 'bg-white border-[#2C2A29] border-l-4 border-l-[#2C2A29]'
                      : evt.type === 'konzultacia'
                      ? 'bg-[#FBF9F6] border-[#C5A059] border-l-4 border-l-[#C5A059]'
                      : evt.type === 'osetrenie'
                      ? 'bg-emerald-50/60 border-emerald-500 border-l-4 border-l-emerald-600'
                      : 'bg-blue-50/60 border-blue-400 border-l-4 border-l-blue-500'
                  }`}
                >
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-[#2C2A29]">
                        {evt.startTime} - {evt.endTime}
                      </span>
                      <span className="text-[9px] uppercase font-bold text-[#8C857B]">
                        {evt.type}
                      </span>
                    </div>
                    {evt.totalPrice ? (
                      <span className="font-mono text-xs font-bold text-[#2C2A29]">
                        {evt.totalPrice} €
                      </span>
                    ) : null}
                  </div>

                  <div className="truncate my-0.5">
                    <strong className="text-xs text-[#2C2A29] block truncate">{evt.title}</strong>
                    <span className="text-[10px] text-[#8C857B] block truncate">{evt.patientName}</span>
                  </div>

                  {/* SPODNÁ LIŠTA NA NAŤAHOVANIE ČASU (RESIZE HANDLE) */}
                  <div 
                    onMouseDown={(e) => handleMouseDownResize(e, evt)}
                    className="h-3 w-full bg-gray-200/50 hover:bg-[#C5A059] rounded-b-lg cursor-ns-resize flex items-center justify-center transition-colors"
                    title="Potiahnite pre zmenu trvania zákroku"
                  >
                    <div className="w-6 h-0.5 bg-gray-400 rounded-full"></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-6">
      <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-4">
        <div>
          <h2 className="font-brand text-xl font-bold text-[#2C2A29] uppercase">Plánovanie & Kalendár</h2>
          <p className="text-[10px] uppercase tracking-widest text-[#8C857B]">Prehľadná časová os s naťahovaním trvania</p>
        </div>
        <button onClick={() => setIsAddingEvent(true)} className="bg-[#2C2A29] text-white px-4 py-2 rounded-xl text-xs font-bold uppercase">
          + Nový termín
        </button>
      </div>

      <div className="min-h-[400px]">
        {renderDayView()}
      </div>

      {/* DETAIL MODAL (VŠETKY AKCIE SÚ SÚSTREDENÉ SEM) */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-[#2C2A29]/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-xl border border-[#E8E2D9] space-y-4">
            <div className="border-b border-[#E8E2D9] pb-3 flex justify-between items-start">
              <div>
                <span className="text-[9px] uppercase font-bold text-[#C5A059]">Detail termínu</span>
                <h3 className="font-brand text-lg font-bold text-[#2C2A29] uppercase">{selectedEvent.title}</h3>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-xs font-bold text-[#8C857B]">✕</button>
            </div>

            <div className="space-y-2 text-xs bg-[#FBF9F6] p-4 rounded-xl border border-[#E8E2D9]">
              <p><strong>Pacient:</strong> {selectedEvent.patientName}</p>
              <p><strong>Čas:</strong> {selectedEvent.startTime} - {selectedEvent.endTime} ({selectedEvent.date})</p>
              <p><strong>Cena:</strong> {selectedEvent.totalPrice || 0} € | Záloha: {selectedEvent.depositAmount || 0} €</p>
              {selectedEvent.isCancelled && <p className="text-rose-600 font-bold">❌ ZRUŠENÉ: {selectedEvent.cancelReason}</p>}
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button onClick={() => setOpenEmailModal(selectedEvent)} className="flex-1 bg-[#C5A059] text-white py-2 rounded-xl text-xs font-bold uppercase">
                ✉️ E-mail / Faktúra
              </button>
              <button onClick={() => setCancellingEvent(selectedEvent)} className="bg-rose-50 text-rose-700 border border-rose-200 px-3 py-2 rounded-xl text-xs font-bold uppercase">
                ❌ Zrušiť
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}