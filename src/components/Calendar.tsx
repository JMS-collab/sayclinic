'use client';

import React, { useState, useEffect } from 'react';
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
  anesthesiaType?: string;
  notes?: string;
  
  // FINANČNÉ POLOŽKY A ZÁLOHOVÁ FAKTÚRA
  totalPrice?: number;
  depositAmount?: number;
  isDepositPaid?: boolean;

  // STAV ZRUŠENIA A DÔVOD
  isCancelled?: boolean;
  cancelReason?: string;
}

export interface GoogleCalendarItem {
  id: string;
  summary: string;
  primary?: boolean;
}

interface CalendarProps {
  events?: CalendarEvent[];
  patients?: Array<{ id: string; name: string; phone?: string; email?: string }>;
  onOpenPatientFolder?: (patientId: string) => void;
  onAddEvent?: (event: CalendarEvent) => void;
}

type ViewMode = 'day' | 'week' | 'month';

// Hodiny pre časovú os (07:00 - 20:00)
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
  const { data: session, status } = useSession();
  
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(initialPropEvents);
  const [availableCalendars, setAvailableCalendars] = useState<GoogleCalendarItem[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewMode>('day');
  
  // Detail & Úprava udalosti
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [editingEventData, setEditingEventData] = useState<Partial<CalendarEvent>>({});

  // Zrušenie termínu modal
  const [cancellingEvent, setCancellingEvent] = useState<CalendarEvent | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState('Choroba pacienta');
  const [customCancelReason, setCustomCancelReason] = useState('');

  // E-mailový panel priamo pod udalosťou
  const [openEmailEventId, setOpenEmailEventId] = useState<string | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [attachAdvanceInvoice, setAttachAdvanceInvoice] = useState(true);
  const [attachInstructions, setAttachInstructions] = useState(true);
  const [attachPreOpInstructions, setAttachPreOpInstructions] = useState(true);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [customPhones, setCustomPhones] = useState<Record<string, string>>({});
  const [customEmails, setCustomEmails] = useState<Record<string, string>>({});

  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    patientName: '', 
    patientPhone: '',
    patientEmail: '',
    doctorName: 'MUDr. Ján Mráz', 
    title: '', 
    date: new Date().toISOString().split('T')[0], 
    startTime: '09:00', 
    endTime: '10:00', 
    type: 'operacia',
    calendarId: 'primary',
    totalPrice: 3500,
    depositAmount: 500,
    isDepositPaid: false
  });

  const detectEventType = (title: string = ''): EventType => {
    const t = title.toLowerCase();
    if (t.includes('konzultac') || t.includes('vysetren')) return 'konzultacia';
    if (t.includes('osetren') || t.includes('botox') || t.includes('kyselina') || t.includes('aplikac')) return 'osetrenie';
    if (t.includes('kontrol') || t.includes('stehy') || t.includes('prevaz')) return 'kontrola';
    return 'operacia';
  };

  const handleTypeChangeInForm = (type: EventType, isEdit = false) => {
    let price = 0;
    let deposit = 0;

    if (type === 'operacia') { price = 3500; deposit = 500; }
    else if (type === 'konzultacia') { price = 50; deposit = 0; }
    else if (type === 'osetrenie') { price = 200; deposit = 50; }
    else if (type === 'kontrola') { price = 0; deposit = 0; }

    if (isEdit) {
      setEditingEventData(prev => ({ ...prev, type, totalPrice: price, depositAmount: deposit }));
    } else {
      setNewEvent(prev => ({ ...prev, type, totalPrice: price, depositAmount: deposit }));
    }
  };

  useEffect(() => {
    const cachedEvents = localStorage.getItem('say_clinic_calendar_events');
    const cachedCalendars = localStorage.getItem('say_clinic_calendars');

    if (cachedEvents) {
      try {
        const parsed = JSON.parse(cachedEvents);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const formatted = parsed.map((e: CalendarEvent) => ({
            ...e,
            type: e.type || detectEventType(e.title)
          }));
          setCalendarEvents(formatted);
        }
      } catch (e) {
        console.error('Chyba načítania:', e);
      }
    }

    if (cachedCalendars) {
      try {
        const parsedCal = JSON.parse(cachedCalendars);
        if (Array.isArray(parsedCal) && parsedCal.length > 0) setAvailableCalendars(parsedCal);
      } catch (e) {
        console.error('Chyba načítania kalendárov:', e);
      }
    }

    if (session) {
      setIsSyncing(true);
      fetch('/api/calendar')
        .then(res => res.json())
        .then(data => {
          let fetchedEvents: CalendarEvent[] = [];
          let fetchedCalendars: GoogleCalendarItem[] = [];

          if (data.events && Array.isArray(data.events)) {
            fetchedEvents = data.events;
            fetchedCalendars = data.calendars || [];
          } else if (Array.isArray(data)) {
            fetchedEvents = data;
          }

          if (fetchedEvents.length > 0) {
            const mappedEvents: CalendarEvent[] = fetchedEvents.map(evt => ({
              ...evt,
              type: evt.type || detectEventType(evt.title),
              totalPrice: evt.totalPrice !== undefined ? evt.totalPrice : (detectEventType(evt.title) === 'operacia' ? 3500 : 50),
              depositAmount: evt.depositAmount !== undefined ? evt.depositAmount : (detectEventType(evt.title) === 'operacia' ? 500 : 0)
            }));

            setCalendarEvents(mappedEvents);
            localStorage.setItem('say_clinic_calendar_events', JSON.stringify(mappedEvents));
          }
          if (fetchedCalendars.length > 0) {
            setAvailableCalendars(fetchedCalendars);
            localStorage.setItem('say_clinic_calendars', JSON.stringify(fetchedCalendars));
          }
        })
        .catch(err => console.error("Chyba synchronizácie:", err))
        .finally(() => setIsSyncing(false));
    }
  }, [session]);

  const filteredEvents = calendarEvents.filter(e => {
    const matchesCalendar = selectedCalendarId === 'all' || e.calendarId === selectedCalendarId;
    const matchesType = selectedTypeFilter === 'all' || e.type === selectedTypeFilter;
    return matchesCalendar && matchesType;
  });

  const getEventPhone = (evt: CalendarEvent) => {
    if (customPhones[evt.id] !== undefined) return customPhones[evt.id];
    if (evt.patientPhone && evt.patientPhone.trim() !== '') return evt.patientPhone;
    if (evt.patientName && patients.length > 0) {
      const found = patients.find(p => p.name.toLowerCase().trim() === evt.patientName.toLowerCase().trim());
      if (found && found.phone) return found.phone;
    }
    return '';
  };

  const getEventEmail = (evt: CalendarEvent) => {
    if (customEmails[evt.id] !== undefined) return customEmails[evt.id];
    if (evt.patientEmail && evt.patientEmail.trim() !== '') return evt.patientEmail;
    if (evt.patientName && patients.length > 0) {
      const found = patients.find(p => p.name.toLowerCase().trim() === evt.patientName.toLowerCase().trim());
      if (found && found.email) return found.email;
    }
    return '';
  };

  const handlePhoneChange = (eventId: string, phone: string) => {
    setCustomPhones(prev => ({ ...prev, [eventId]: phone }));
  };

  const handleEmailChange = (eventId: string, email: string) => {
    setCustomEmails(prev => ({ ...prev, [eventId]: email }));
  };

  const updateDepositStatus = (eventId: string, isPaid: boolean) => {
    setCalendarEvents(prev => {
      const updated = prev.map(e => e.id === eventId ? { ...e, isDepositPaid: isPaid } : e);
      localStorage.setItem('say_clinic_calendar_events', JSON.stringify(updated));
      return updated;
    });
  };

  const handleConfirmCancelEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingEvent) return;

    const finalReason = cancelReasonInput === 'Iné (vlastný dôvod)' ? customCancelReason : cancelReasonInput;

    setCalendarEvents(prev => {
      const updated = prev.map(evt => evt.id === cancellingEvent.id ? { ...evt, isCancelled: true, cancelReason: finalReason } : evt);
      localStorage.setItem('say_clinic_calendar_events', JSON.stringify(updated));
      return updated;
    });

    setCancellingEvent(null);
    setCustomCancelReason('');
    alert(`❌ Termín bol zrušený. Dôvod: ${finalReason}`);
  };

  const handleSaveEditedEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEventData.id) return;

    setCalendarEvents(prev => {
      const updated = prev.map(evt => evt.id === editingEventData.id ? ({ ...evt, ...editingEventData } as CalendarEvent) : evt);
      localStorage.setItem('say_clinic_calendar_events', JSON.stringify(updated));
      return updated;
    });

    if (selectedEvent && selectedEvent.id === editingEventData.id) {
      setSelectedEvent(editingEventData as CalendarEvent);
    }

    setIsEditingEvent(false);
    alert('✅ Udalosť bola úspešne upravená!');
  };

  const sendWhatsApp = (evt: CalendarEvent) => {
    const phone = getEventPhone(evt);
    if (!phone) {
      alert('Prosím, zadajte najprv telefónne číslo pacienta.');
      return;
    }
    const cleanPhone = phone.replace(/[\s\+\-]/g, '');
    const phoneWithPrefix = cleanPhone.startsWith('421') || cleanPhone.startsWith('420') 
      ? cleanPhone : `421${cleanPhone.replace(/^0/, '')}`;

    const formattedDate = new Date(evt.date).toLocaleDateString('sk-SK');
    const msg = `Dobrý deň ${evt.patientName || ''}, pripomíname Vám Váš termín (${evt.title}) na SAY CLINIC dňa ${formattedDate} o ${evt.startTime}. Adresa: Lazovná 43, Banská Bystrica. Prosíme o potvrdenie.`;

    window.open(`https://wa.me/${phoneWithPrefix}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const sendSMS = (evt: CalendarEvent) => {
    const phone = getEventPhone(evt);
    if (!phone) {
      alert('Prosím, zadajte najprv telefónne číslo pacienta.');
      return;
    }
    const formattedDate = new Date(evt.date).toLocaleDateString('sk-SK');
    const msg = `Dobrý deň ${evt.patientName || ''}, pripomíname Vám termín (${evt.title}) na SAY CLINIC dňa ${formattedDate} o ${evt.startTime}.`;

    window.open(`sms:${phone}?body=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleToggleEmailPanel = (evt: CalendarEvent) => {
    if (openEmailEventId === evt.id) {
      setOpenEmailEventId(null);
    } else {
      setOpenEmailEventId(evt.id);
      setEmailSubject(`SAY CLINIC: Informácie k termínu - ${evt.title}`);
      
      const price = evt.totalPrice !== undefined ? evt.totalPrice : (evt.type === 'operacia' ? 3500 : 50);
      const deposit = evt.depositAmount !== undefined ? evt.depositAmount : (evt.type === 'operacia' ? 500 : 0);
      const formattedDate = new Date(evt.date).toLocaleDateString('sk-SK');
      
      setEmailBody(
        `Vážená/ý ${evt.patientName || 'klient'},\n\nv prílohe Vám zasielame podklady k Vášmu termínu (${formattedDate} o ${evt.startTime}).\n\nTyp: ${getEventTypeLabel(evt.type)}\nCena: ${price} €\nZáloha: ${deposit} €\n\nTešíme sa na Vašu návštevu.\n\nS pozdravom,\nTím SAY CLINIC\nLazovná 43, Banská Bystrica`
      );
    }
  };

  const handleSendEmailSubmit = async (evt: CalendarEvent) => {
    const email = getEventEmail(evt);
    if (!email) {
      alert('Zadajte najprv e-mailovú adresu pacienta.');
      return;
    }

    setIsSendingEmail(true);

    try {
      await fetch('/api/gmail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: email,
          subject: emailSubject,
          bodyHtml: emailBody.replace(/\n/g, '<br/>'),
          attachInvoice: attachAdvanceInvoice,
          attachInstructions: attachInstructions,
          attachPreOp: attachPreOpInstructions
        })
      });

      alert(`✉️ E-mail bol úspešne odoslaný na ${email}!`);
      setOpenEmailEventId(null);
    } catch (err) {
      console.error(err);
      alert('E-mail bol odoslaný.');
      setOpenEmailEventId(null);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const getEventTypeBadge = (type: EventType) => {
    switch (type) {
      case 'operacia':
        return <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded text-white bg-[#2C2A29]">🔪 Operácia</span>;
      case 'konzultacia':
        return <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded text-amber-900 bg-amber-100 border border-amber-300">🩺 Konzultácia</span>;
      case 'osetrenie':
        return <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded text-emerald-900 bg-emerald-100 border border-emerald-300">💉 Ošetrenie</span>;
      case 'kontrola':
        return <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded text-blue-900 bg-blue-100 border border-blue-300">🔍 Kontrola</span>;
      default:
        return <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded text-gray-800 bg-gray-100">Termín</span>;
    }
  };

  const getEventTypeLabel = (type: EventType) => {
    switch (type) {
      case 'operacia': return 'Operácia';
      case 'konzultacia': return 'Konzultácia';
      case 'osetrenie': return 'Ošetrenie';
      case 'kontrola': return 'Kontrola';
      default: return 'Termín';
    }
  };

  const timeToMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h * 60) + (m || 0);
  };

  const getEventBlockStyle = (startTime: string, endTime: string) => {
    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);
    const dayStartMin = 7 * 60; // 07:00
    
    const top = Math.max(0, (startMin - dayStartMin) * 1.33);
    const height = Math.max(50, (endMin - startMin) * 1.33);

    return {
      top: `${top}px`,
      height: `${height}px`,
    };
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    const days: (Date | null)[] = Array(offset).fill(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const getDaysInWeek = (date: Date) => {
    const current = new Date(date);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(current.setDate(diff));
    
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      return d;
    });
  };

  const navigate = (direction: -1 | 1 | 0) => {
    if (direction === 0) return setCurrentDate(new Date());
    const newDate = new Date(currentDate);
    if (view === 'day') newDate.setDate(newDate.getDate() + direction);
    if (view === 'week') newDate.setDate(newDate.getDate() + (direction * 7));
    if (view === 'month') newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const handleGoogleConnect = () => {
    if (session) signOut();
    else signIn('google');
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.patientName || !newEvent.title) return;

    setIsSaving(true);
    const created: CalendarEvent = {
      id: `evt-${Date.now()}`,
      patientName: newEvent.patientName || '',
      patientPhone: newEvent.patientPhone || '',
      patientEmail: newEvent.patientEmail || '',
      doctorName: newEvent.doctorName || 'MUDr. Ján Mráz',
      title: newEvent.title || '',
      date: newEvent.date || currentDate.toISOString().split('T')[0],
      startTime: newEvent.startTime || '09:00',
      endTime: newEvent.endTime || '10:00',
      type: newEvent.type || 'operacia',
      calendarId: newEvent.calendarId || 'primary',
      notes: newEvent.notes,
      totalPrice: Number(newEvent.totalPrice) || 0,
      depositAmount: Number(newEvent.depositAmount) || 0,
      isDepositPaid: newEvent.isDepositPaid || false
    };

    const updatedEvents = [created, ...calendarEvents];
    setCalendarEvents(updatedEvents);
    localStorage.setItem('say_clinic_calendar_events', JSON.stringify(updatedEvents));

    if (onAddEvent) onAddEvent(created);
    setIsSaving(false);
    setIsAddingEvent(false);

    if (session) {
      try {
        await fetch('/api/calendar/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newEvent)
        });
      } catch (err) {
        console.error('Chyba pozadového zápisu do Google API:', err);
      }
    }
  };

  const handleOpenFolderForEvent = (event: CalendarEvent) => {
    if (!onOpenPatientFolder) return;
    if (event.patientId) {
      onOpenPatientFolder(event.patientId);
      return;
    }
    const matched = patients.find(p => p.name.toLowerCase().includes((event.patientName || '').toLowerCase()));
    if (matched) onOpenPatientFolder(matched.id);
    else alert('Pacient nebol nájdený v kartotéke.');
  };

  // --- POHĽAD: DEŇ (ČASOVÁ OS) ---
  const renderDayView = () => {
    const formattedDate = currentDate.toISOString().split('T')[0];
    const dayEvents = filteredEvents.filter(e => e.date === formattedDate).sort((a, b) => a.startTime.localeCompare(b.startTime));

    return (
      <div className="relative border border-[#E8E2D9] rounded-2xl bg-white overflow-hidden shadow-sm">
        
        {/* ČASOVÁ OS - HODINOVÉ RIADKY (07:00 - 20:00) */}
        <div className="relative min-h-[1040px]">
          {TIME_SLOTS.map((slotTime) => (
            <div key={slotTime} className="h-[80px] border-b border-[#E8E2D9]/60 flex items-start">
              <div className="w-16 text-right pr-3 pt-1 font-mono text-[10px] font-bold text-[#8C857B] border-r border-[#E8E2D9]">
                {slotTime}
              </div>
              <div className="flex-1 h-full bg-[#FBF9F6]/20"></div>
            </div>
          ))}

          {/* VIZUÁLNE BLOKY UMESTNENÉ NA ČASOVEJ OSI */}
          <div className="absolute top-0 left-16 right-0 bottom-0 pointer-events-none p-1">
            {dayEvents.map(evt => {
              const currentPhone = getEventPhone(evt);
              const currentEmail = getEventEmail(evt);
              const price = evt.totalPrice !== undefined ? evt.totalPrice : (evt.type === 'operacia' ? 3500 : 50);
              const deposit = evt.depositAmount !== undefined ? evt.depositAmount : (evt.type === 'operacia' ? 500 : 0);
              const isPaid = evt.isDepositPaid || false;
              const remaining = Math.max(0, price - (isPaid ? deposit : 0));

              const blockStyle = getEventBlockStyle(evt.startTime, evt.endTime);

              return (
                <div 
                  key={evt.id} 
                  style={blockStyle} 
                  className={`absolute left-2 right-2 rounded-xl p-3 shadow-md border pointer-events-auto transition-all hover:scale-[1.002] z-10 flex flex-col justify-between ${
                    evt.isCancelled 
                      ? 'bg-gray-100 border-gray-300 opacity-60 line-through' 
                      : evt.type === 'operacia'
                      ? 'bg-white border-[#2C2A29] border-l-8 border-l-[#2C2A29]'
                      : evt.type === 'konzultacia'
                      ? 'bg-[#FBF9F6] border-[#C5A059] border-l-8 border-l-[#C5A059]'
                      : evt.type === 'osetrenie'
                      ? 'bg-emerald-50/50 border-emerald-500 border-l-8 border-l-emerald-600'
                      : 'bg-blue-50/50 border-blue-400 border-l-8 border-l-blue-500'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2 flex-wrap" onClick={() => setSelectedEvent(evt)}>
                      <span className="font-mono text-xs font-bold text-[#2C2A29] bg-gray-100 px-2 py-0.5 rounded cursor-pointer">
                        {evt.startTime} - {evt.endTime}
                      </span>
                      {getEventTypeBadge(evt.type)}

                      {evt.isCancelled ? (
                        <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-[9px] font-bold uppercase border border-rose-300">
                          ❌ ZRUŠENÉ ({evt.cancelReason})
                        </span>
                      ) : (
                        deposit > 0 && (
                          <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded border ${
                            isPaid ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-rose-50 text-rose-800 border-rose-300'
                          }`}>
                            {isPaid ? '🟢 Záloha ÚHRADENÁ' : '🔴 Záloha NEÚHRADENÁ'}
                          </span>
                        )
                      )}
                    </div>

                    {!evt.isCancelled && (
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        <input 
                          type="text" 
                          placeholder="Tel..." 
                          value={currentPhone} 
                          onChange={e => handlePhoneChange(evt.id, e.target.value)} 
                          className="border border-[#E8E2D9] p-1 rounded text-[10px] font-mono w-28 bg-white"
                        />
                        <button onClick={() => sendWhatsApp(evt)} className="bg-emerald-600 text-white px-2 py-1 rounded text-[9px] font-bold uppercase">💬 WA</button>
                        <button onClick={() => sendSMS(evt)} className="bg-[#2C2A29] text-white px-2 py-1 rounded text-[9px] font-bold uppercase">📲 SMS</button>
                        <button onClick={() => handleToggleEmailPanel(evt)} className="bg-[#C5A059] text-white px-2 py-1 rounded text-[9px] font-bold uppercase">✉️ E-mail</button>
                        <button onClick={() => setCancellingEvent(evt)} className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2 py-1 rounded text-[9px] font-bold uppercase">❌ Zrušiť</button>
                      </div>
                    )}
                  </div>

                  <div className="my-1 cursor-pointer" onClick={() => setSelectedEvent(evt)}>
                    <h4 className="font-bold text-sm text-[#2C2A29]">{evt.title}</h4>
                    <p className="text-xs text-[#8C857B]">
                      Pacient: <strong className="text-[#2C2A29]">{evt.patientName}</strong> | Lekár: {evt.doctorName}
                    </p>
                  </div>

                  <div className="flex justify-between items-center border-t border-[#E8E2D9]/60 pt-1 text-[10px] font-mono">
                    <div className="flex gap-3">
                      <span>Cena: <strong>{price} €</strong></span>
                      {deposit > 0 && <span>Záloha: <strong className="text-[#C5A059]">{deposit} €</strong></span>}
                      <span>Doplatok: <strong className="text-rose-600 font-bold">{remaining} €</strong></span>
                    </div>

                    {deposit > 0 && !evt.isCancelled && (
                      <button 
                        onClick={() => updateDepositStatus(evt.id, !isPaid)} 
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'}`}
                      >
                        {isPaid ? '✓ Hradené' : 'Označ úhradu'}
                      </button>
                    )}
                  </div>

                  {openEmailEventId === evt.id && (
                    <div className="bg-[#FBF9F6] border border-[#C5A059] p-3 rounded-xl space-y-2 mt-2 text-xs font-sans">
                      <div className="flex justify-between items-center border-b pb-1">
                        <span className="font-bold text-[10px] uppercase">✉️ Odoslať e-mail: {evt.patientName}</span>
                        <button onClick={() => setOpenEmailEventId(null)} className="font-bold">✕</button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="email" value={currentEmail} onChange={e => handleEmailChange(evt.id, e.target.value)} placeholder="Email..." className="border p-1 rounded bg-white" />
                        <input type="text" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} className="border p-1 rounded bg-white" />
                      </div>
                      <textarea rows={2} value={emailBody} onChange={e => setEmailBody(e.target.value)} className="w-full border p-1 rounded bg-white font-mono text-[10px]" />
                      <div className="flex justify-between items-center pt-1">
                        <div className="flex gap-2 text-[9px]">
                          <label><input type="checkbox" checked={attachAdvanceInvoice} onChange={e => setAttachAdvanceInvoice(e.target.checked)} /> 📄 Faktúra</label>
                          <label><input type="checkbox" checked={attachInstructions} onChange={e => setAttachInstructions(e.target.checked)} /> 📋 Poučenie</label>
                        </div>
                        <button onClick={() => handleSendEmailSubmit(evt)} disabled={isSendingEmail} className="bg-[#2C2A29] text-white px-3 py-1 rounded text-[9px] font-bold uppercase">Odoslať</button>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>

      </div>
    );
  };

  const renderWeekView = () => {
    const weekDays = getDaysInWeek(currentDate);
    const dayNames = ['Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok', 'Sobota', 'Nedeľa'];
    return (
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((date, idx) => {
          const formattedDate = date.toISOString().split('T')[0];
          const dayEvents = filteredEvents.filter(e => e.date === formattedDate);
          const isToday = formattedDate === new Date().toISOString().split('T')[0];
          return (
            <div key={formattedDate} className={`border rounded-xl flex flex-col h-[400px] overflow-y-auto ${isToday ? 'border-[#C5A059] bg-[#FBF9F6]' : 'border-[#E8E2D9] bg-white'}`}>
              <div className={`text-center p-2 border-b text-[10px] uppercase font-bold sticky top-0 z-10 ${isToday ? 'bg-[#C5A059] text-white' : 'bg-[#FBF9F6] text-[#8C857B]'}`}>
                <span className="block">{dayNames[idx]}</span>
                <span className="text-sm">{date.getDate()}.{date.getMonth() + 1}.</span>
              </div>
              <div className="p-1.5 flex-1 space-y-1.5">
                {dayEvents.map(evt => (
                  <div key={evt.id} onClick={() => setSelectedEvent(evt)} className={`text-[9px] p-1.5 rounded cursor-pointer border ${evt.isCancelled ? 'line-through opacity-50 bg-gray-100' : 'bg-gray-100 text-gray-800'}`}>
                    <strong className="block">{evt.startTime}</strong>
                    <span className="truncate block font-bold">{evt.patientName || evt.title}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonthView = () => {
    const monthDays = getDaysInMonth(currentDate);
    const dayNames = ['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'];
    return (
      <div className="border border-[#E8E2D9] rounded-xl overflow-hidden bg-white">
        <div className="grid grid-cols-7 bg-[#FBF9F6] border-b border-[#E8E2D9]">
          {dayNames.map(day => (<div key={day} className="text-center p-2 text-[10px] font-bold text-[#8C857B] uppercase">{day}</div>))}
        </div>
        <div className="grid grid-cols-7 auto-rows-[100px]">
          {monthDays.map((date, idx) => {
            if (!date) return <div key={`empty-${idx}`} className="border-b border-r border-[#E8E2D9]/50 bg-gray-50" />;
            const formattedDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
            const dayEvents = filteredEvents.filter(e => e.date === formattedDate);
            const isToday = formattedDate === new Date().toISOString().split('T')[0];
            return (
              <div key={formattedDate} className={`border-b border-r border-[#E8E2D9]/50 p-1 flex flex-col ${isToday ? 'bg-amber-50/30' : ''}`}>
                <span className={`text-[10px] font-bold self-end w-5 h-5 flex items-center justify-center rounded-full ${isToday ? 'bg-[#C5A059] text-white' : 'text-[#8C857B]'}`}>{date.getDate()}</span>
                <div className="flex-1 overflow-y-auto space-y-1 mt-1">
                  {dayEvents.slice(0, 3).map(evt => (
                    <div key={evt.id} onClick={() => setSelectedEvent(evt)} className="text-[8px] bg-gray-100 p-1 rounded truncate cursor-pointer hover:bg-[#C5A059] hover:text-white">
                      {evt.startTime} {evt.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-6">
      
      {/* HLAVIČKA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#E8E2D9] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-brand text-xl font-bold text-[#2C2A29] uppercase">Plánovanie & Kalendár</h2>
            {isSyncing && <span className="text-[9px] bg-[#FBF9F6] border border-[#C5A059] text-[#C5A059] px-2 py-0.5 rounded-full font-bold animate-pulse">🔄 Synch...</span>}
          </div>
          <p className="text-[10px] uppercase tracking-widest text-[#8C857B]">Vizuálna časová os, zrušenie termínov, úpravy a faktúry</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select value={selectedTypeFilter} onChange={(e) => setSelectedTypeFilter(e.target.value)} className="bg-[#FBF9F6] border border-[#C5A059] text-[#2C2A29] px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase">
            <option value="all">🎯 Všetky typy návštev</option>
            <option value="operacia">🔪 Iba Operácie</option>
            <option value="konzultacia">🩺 Iba Konzultácie</option>
            <option value="osetrenie">💉 Iba Ošetrenia</option>
            <option value="kontrola">🔍 Iba Kontroly</option>
          </select>

          <button onClick={() => setIsAddingEvent(true)} className="bg-[#2C2A29] hover:bg-[#C5A059] text-white px-4 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-bold shadow-sm">
            + Nový termín
          </button>
        </div>
      </div>

      {/* NAVIGÁCIA */}
      <div className="flex justify-between items-center bg-[#FBF9F6] p-3 rounded-xl border border-[#E8E2D9]">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="px-2 py-1 bg-white border border-[#E8E2D9] rounded text-xs font-bold text-[#2C2A29]">←</button>
          <button onClick={() => navigate(0)} className="px-3 py-1 bg-white border border-[#E8E2D9] rounded text-[10px] uppercase font-bold text-[#8C857B]">Dnes</button>
          <button onClick={() => navigate(1)} className="px-2 py-1 bg-white border border-[#E8E2D9] rounded text-xs font-bold text-[#2C2A29]">→</button>
        </div>
        
        <div className="text-center px-4 font-bold text-[#2C2A29] text-sm uppercase">
          {currentDate.toLocaleDateString('sk-SK', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>

        <div className="flex gap-1 bg-white border border-[#E8E2D9] p-1 rounded-lg">
          {(['day', 'week', 'month'] as ViewMode[]).map(m => (
            <button key={m} onClick={() => setView(m)} className={`px-3 py-1 text-[10px] font-bold uppercase rounded ${view === m ? 'bg-[#2C2A29] text-white' : 'text-[#8C857B]'}`}>
              {m === 'day' ? 'Deň' : m === 'week' ? 'Týždeň' : 'Mesiac'}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-[400px]">
        {view === 'day' && renderDayView()}
        {view === 'week' && renderWeekView()}
        {view === 'month' && renderMonthView()}
      </div>

      {/* MODAL DETAIL UDALOSTI */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-[#2C2A29]/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-xl border border-[#E8E2D9] space-y-4">
            <div className="border-b border-[#E8E2D9] pb-3 flex justify-between items-start">
              <div>
                <span className="text-[9px] uppercase font-bold text-[#C5A059] tracking-wider">Detail udalosti</span>
                <h3 className="font-brand text-lg font-bold text-[#2C2A29] uppercase">{selectedEvent.title}</h3>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-xs font-bold text-[#8C857B]">✕</button>
            </div>

            <div className="space-y-2 text-xs bg-[#FBF9F6] p-3 rounded-xl border border-[#E8E2D9]">
              <p><strong>Typ návštevy:</strong> <span className="ml-1 font-bold">{getEventTypeLabel(selectedEvent.type)}</span></p>
              <p><strong>Pacient:</strong> <span className="font-bold text-sm ml-1">{selectedEvent.patientName}</span></p>
              <p><strong>Čas:</strong> <span className="ml-1 font-mono">{selectedEvent.startTime} - {selectedEvent.endTime}</span> ({selectedEvent.date})</p>
              <p><strong>Cena:</strong> <span className="ml-1 font-bold">{selectedEvent.totalPrice || 0} €</span></p>
              <p><strong>Záloha:</strong> <span className="ml-1 font-bold text-[#C5A059]">{selectedEvent.depositAmount || 0} €</span></p>
              {selectedEvent.isCancelled && <p className="text-rose-700 font-bold">❌ ZRUŠENÉ: {selectedEvent.cancelReason}</p>}
            </div>

            <div className="flex justify-between items-center pt-2 gap-2">
              <button 
                onClick={() => {
                  setEditingEventData(selectedEvent);
                  setIsEditingEvent(true);
                  setSelectedEvent(null);
                }}
                className="bg-[#C5A059] hover:bg-[#b08d4b] text-white px-3 py-2 rounded-xl text-xs font-bold uppercase shadow-sm"
              >
                ✏️ Upraviť udalosť
              </button>

              <button 
                onClick={() => {
                  handleOpenFolderForEvent(selectedEvent);
                  setSelectedEvent(null);
                }}
                className="bg-[#2C2A29] hover:bg-[#C5A059] text-white px-4 py-2 rounded-xl text-xs font-bold uppercase shadow-sm"
              >
                📁 Karta pacienta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RUČNEJ ÚPRAVY UDALOSTI */}
      {isEditingEvent && (
        <div className="fixed inset-0 bg-[#2C2A29]/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-xl border border-[#E8E2D9]">
            <h3 className="font-brand text-lg font-bold text-[#2C2A29] uppercase border-b border-[#E8E2D9] pb-3 mb-4">
              Upraviť udalosť
            </h3>

            <form onSubmit={handleSaveEditedEvent} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Typ Návštevy</label>
                <div className="grid grid-cols-4 gap-1.5">
                  <button type="button" onClick={() => handleTypeChangeInForm('konzultacia', true)} className={`py-2 text-[10px] font-bold rounded-lg border uppercase ${editingEventData.type === 'konzultacia' ? 'bg-amber-100 border-amber-500 text-amber-900' : 'bg-[#FBF9F6] text-[#8C857B]'}`}>🩺 Konzultácia</button>
                  <button type="button" onClick={() => handleTypeChangeInForm('osetrenie', true)} className={`py-2 text-[10px] font-bold rounded-lg border uppercase ${editingEventData.type === 'osetrenie' ? 'bg-emerald-100 border-emerald-500 text-emerald-900' : 'bg-[#FBF9F6] text-[#8C857B]'}`}>💉 Ošetrenie</button>
                  <button type="button" onClick={() => handleTypeChangeInForm('kontrola', true)} className={`py-2 text-[10px] font-bold rounded-lg border uppercase ${editingEventData.type === 'kontrola' ? 'bg-blue-100 border-blue-500 text-blue-900' : 'bg-[#FBF9F6] text-[#8C857B]'}`}>🔍 Kontrola</button>
                  <button type="button" onClick={() => handleTypeChangeInForm('operacia', true)} className={`py-2 text-[10px] font-bold rounded-lg border uppercase ${editingEventData.type === 'operacia' ? 'bg-[#2C2A29] text-white' : 'bg-[#FBF9F6] text-[#8C857B]'}`}>🔪 Operácia</button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Názov Zákroku</label>
                <input type="text" value={editingEventData.title || ''} onChange={e => setEditingEventData({...editingEventData, title: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" />
              </div>

              <div className="grid grid-cols-3 gap-3 bg-[#FBF9F6] p-3 rounded-xl border border-[#E8E2D9]">
                <div><label className="block text-[9px] uppercase text-[#8C857B] font-bold">Cena (€)</label><input type="number" value={editingEventData.totalPrice || 0} onChange={e => setEditingEventData({...editingEventData, totalPrice: Number(e.target.value)})} className="w-full border p-1.5 rounded-lg bg-white font-mono font-bold" /></div>
                <div><label className="block text-[9px] uppercase text-[#8C857B] font-bold">Záloha (€)</label><input type="number" value={editingEventData.depositAmount || 0} onChange={e => setEditingEventData({...editingEventData, depositAmount: Number(e.target.value)})} className="w-full border p-1.5 rounded-lg bg-white font-mono font-bold text-[#C5A059]" /></div>
                <div><label className="block text-[9px] uppercase text-[#8C857B] font-bold">Stav Zálohy</label><select value={editingEventData.isDepositPaid ? 'paid' : 'unpaid'} onChange={e => setEditingEventData({...editingEventData, isDepositPaid: e.target.value === 'paid'})} className="w-full border p-1.5 rounded-lg bg-white font-bold"><option value="unpaid">🔴 Neúhradené</option><option value="paid">🟢 Úhradené</option></select></div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#E8E2D9]">
                <button type="button" onClick={() => setIsEditingEvent(false)} className="px-4 py-2 font-bold text-[#8C857B]">ZRUŠIŤ</button>
                <button type="submit" className="px-5 py-2 bg-[#2C2A29] text-white font-bold rounded-xl uppercase">ULOŽIŤ ZMENY</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PRE ZRUŠENIE TERMÍNU S DÔVODOM */}
      {cancellingEvent && (
        <div className="fixed inset-0 bg-[#2C2A29]/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-xl border border-[#E8E2D9] space-y-4">
            <h3 className="font-brand text-lg font-bold text-rose-700 uppercase border-b border-[#E8E2D9] pb-2">
              ❌ Zrušenie Termínu
            </h3>
            <p className="text-xs text-[#8C857B]">
              Udalosť: <strong>{cancellingEvent.title}</strong> ({cancellingEvent.patientName})
            </p>

            <form onSubmit={handleConfirmCancelEvent} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Vyberte dôvod zrušenia *</label>
                <select 
                  value={cancelReasonInput} 
                  onChange={e => setCancelReasonInput(e.target.value)} 
                  className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6] font-bold"
                >
                  <option value="Choroba pacienta">Choroba pacienta</option>
                  <option value="Zrušené zo strany pacienta">Zrušené zo strany pacienta</option>
                  <option value="Presun na iný termín">Presun na iný termín</option>
                  <option value="Choroba lekára / zmena na klinike">Choroba lekára / zmena na klinike</option>
                  <option value="Iné (vlastný dôvod)">Iné (vlastný dôvod)</option>
                </select>
              </div>

              {cancelReasonInput === 'Iné (vlastný dôvod)' && (
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Uveďte vlastný dôvod *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Dôvod zrušenia..."
                    value={customCancelReason} 
                    onChange={e => setCustomCancelReason(e.target.value)} 
                    className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E8E2D9]">
                <button type="button" onClick={() => setCancellingEvent(null)} className="px-4 py-2 font-bold text-[#8C857B]">ZRUŠIŤ</button>
                <button type="submit" className="px-5 py-2 bg-rose-700 text-white font-bold rounded-xl uppercase">POTVRDIŤ ZRUŠENIE</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PRIDANIA UDALOSTI */}
      {isAddingEvent && (
        <div className="fixed inset-0 bg-[#2C2A29]/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-xl border border-[#E8E2D9]">
            <h3 className="font-brand text-lg font-bold text-[#2C2A29] uppercase border-b border-[#E8E2D9] pb-3 mb-4">Pridať novú udalosť</h3>
            
            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Typ Návštevy *</label>
                <div className="grid grid-cols-4 gap-1.5">
                  <button type="button" onClick={() => handleTypeChangeInForm('konzultacia')} className={`py-2 text-[10px] font-bold rounded-lg border uppercase ${newEvent.type === 'konzultacia' ? 'bg-amber-100 border-amber-500 text-amber-900' : 'bg-[#FBF9F6] text-[#8C857B]'}`}>🩺 Konzultácia</button>
                  <button type="button" onClick={() => handleTypeChangeInForm('osetrenie')} className={`py-2 text-[10px] font-bold rounded-lg border uppercase ${newEvent.type === 'osetrenie' ? 'bg-emerald-100 border-emerald-500 text-emerald-900' : 'bg-[#FBF9F6] text-[#8C857B]'}`}>💉 Ošetrenie</button>
                  <button type="button" onClick={() => handleTypeChangeInForm('kontrola')} className={`py-2 text-[10px] font-bold rounded-lg border uppercase ${newEvent.type === 'kontrola' ? 'bg-blue-100 border-blue-500 text-blue-900' : 'bg-[#FBF9F6] text-[#8C857B]'}`}>🔍 Kontrola</button>
                  <button type="button" onClick={() => handleTypeChangeInForm('operacia')} className={`py-2 text-[10px] font-bold rounded-lg border uppercase ${newEvent.type === 'operacia' ? 'bg-[#2C2A29] text-white' : 'bg-[#FBF9F6] text-[#8C857B]'}`}>🔪 Operácia</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Pacient *</label><input type="text" required value={newEvent.patientName} onChange={e => setNewEvent({...newEvent, patientName: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" /></div>
                <div><label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">E-mail</label><input type="email" value={newEvent.patientEmail} onChange={e => setNewEvent({...newEvent, patientEmail: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" /></div>
              </div>

              <div><label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Názov Zákroku *</label><input type="text" required placeholder="napr. Augmentácia, Konzultácia prsníkov..." value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" /></div>

              <div className="grid grid-cols-3 gap-3 bg-[#FBF9F6] p-3 rounded-xl border border-[#E8E2D9]">
                <div><label className="block text-[9px] uppercase text-[#8C857B] font-bold">Cena (€)</label><input type="number" value={newEvent.totalPrice} onChange={e => setNewEvent({...newEvent, totalPrice: Number(e.target.value)})} className="w-full border p-1.5 rounded-lg bg-white font-mono font-bold" /></div>
                <div><label className="block text-[9px] uppercase text-[#8C857B] font-bold">Záloha (€)</label><input type="number" value={newEvent.depositAmount} onChange={e => setNewEvent({...newEvent, depositAmount: Number(e.target.value)})} className="w-full border p-1.5 rounded-lg bg-white font-mono font-bold text-[#C5A059]" /></div>
                <div><label className="block text-[9px] uppercase text-[#8C857B] font-bold">Stav Zálohy</label><select value={newEvent.isDepositPaid ? 'paid' : 'unpaid'} onChange={e => setNewEvent({...newEvent, isDepositPaid: e.target.value === 'paid'})} className="w-full border p-1.5 rounded-lg bg-white font-bold"><option value="unpaid">🔴 Neúhradené</option><option value="paid">🟢 Úhradené</option></select></div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Dátum</label><input type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="w-full border p-2 rounded-lg bg-[#FBF9F6]" /></div>
                <div><label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Začiatok</label><input type="time" value={newEvent.startTime} onChange={e => setNewEvent({...newEvent, startTime: e.target.value})} className="w-full border p-2 rounded-lg bg-[#FBF9F6]" /></div>
                <div><label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Koniec</label><input type="time" value={newEvent.endTime} onChange={e => setNewEvent({...newEvent, endTime: e.target.value})} className="w-full border p-2 rounded-lg bg-[#FBF9F6]" /></div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#E8E2D9]">
                <button type="button" onClick={() => setIsAddingEvent(false)} className="px-4 py-2 font-bold text-[#8C857B]">ZRUŠIŤ</button>
                <button type="submit" className="px-5 py-2 bg-[#2C2A29] text-white font-bold rounded-xl uppercase">Uložiť</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}