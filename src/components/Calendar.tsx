'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

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
  type: 'operacia' | 'konzultacia' | 'kontrolne_vysetrenie' | 'vstupne_vysetrenie';
  anesthesiaType?: string;
  notes?: string;
  
  // FINANČNÉ POLOŽKY A ZÁLOHOVÁ FAKTÚRA
  totalPrice?: number;
  depositAmount?: number;
  isDepositPaid?: boolean;
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

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewMode>('day');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

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

  // Načítanie z cache (0 ms) + tichá synchronizácia s Google Calendar
  useEffect(() => {
    const cachedEvents = localStorage.getItem('say_clinic_calendar_events');
    const cachedCalendars = localStorage.getItem('say_clinic_calendars');

    if (cachedEvents) {
      try {
        const parsed = JSON.parse(cachedEvents);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCalendarEvents(parsed);
        }
      } catch (e) {
        console.error('Chyba pri čítaní kešovaných udalostí:', e);
      }
    }

    if (cachedCalendars) {
      try {
        const parsedCal = JSON.parse(cachedCalendars);
        if (Array.isArray(parsedCal) && parsedCal.length > 0) {
          setAvailableCalendars(parsedCal);
        }
      } catch (e) {
        console.error('Chyba pri čítaní kešovaných kalendárov:', e);
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
            setCalendarEvents(fetchedEvents);
            localStorage.setItem('say_clinic_calendar_events', JSON.stringify(fetchedEvents));
          }

          if (fetchedCalendars.length > 0) {
            setAvailableCalendars(fetchedCalendars);
            localStorage.setItem('say_clinic_calendars', JSON.stringify(fetchedCalendars));
          }
        })
        .catch(err => console.error("Chyba synchronizácie Google Kalendára:", err))
        .finally(() => setIsSyncing(false));
    }
  }, [session]);

  // Filtrovanie udalostí podľa vybraného kalendára
  const filteredEvents = selectedCalendarId === 'all' 
    ? calendarEvents 
    : calendarEvents.filter(e => e.calendarId === selectedCalendarId);

  // Dohľadanie telefónu
  const getEventPhone = (evt: CalendarEvent) => {
    if (customPhones[evt.id] !== undefined) return customPhones[evt.id];
    if (evt.patientPhone && evt.patientPhone.trim() !== '') return evt.patientPhone;
    if (evt.patientName && patients.length > 0) {
      const found = patients.find(p => p.name.toLowerCase().trim() === evt.patientName.toLowerCase().trim());
      if (found && found.phone) return found.phone;
    }
    return '';
  };

  // Dohľadanie e-mailu
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

  // WhatsApp
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
    const msg = `Dobrý deň ${evt.patientName || ''}, pripomíname Vám Váš termín zákroku (${evt.title}) na SAY CLINIC dňa ${formattedDate} o ${evt.startTime}. Adresa: Lazovná 43, Banská Bystrica. Prosíme o potvrdenie odpoveďou na túto správu.`;

    window.open(`https://wa.me/${phoneWithPrefix}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // SMS
  const sendSMS = (evt: CalendarEvent) => {
    const phone = getEventPhone(evt);
    if (!phone) {
      alert('Prosím, zadajte najprv telefónne číslo pacienta.');
      return;
    }
    const formattedDate = new Date(evt.date).toLocaleDateString('sk-SK');
    const msg = `Dobrý deň ${evt.patientName || ''}, pripomíname Vám Váš termín zákroku (${evt.title}) na SAY CLINIC dňa ${formattedDate} o ${evt.startTime}. Adresa: Lazovná 43, Banská Bystrica. Prosíme o potvrdenie.`;

    window.open(`sms:${phone}?body=${encodeURIComponent(msg)}`, '_blank');
  };

  // E-mailový panel prepínač
  const handleToggleEmailPanel = (evt: CalendarEvent) => {
    if (openEmailEventId === evt.id) {
      setOpenEmailEventId(null);
    } else {
      setOpenEmailEventId(evt.id);
      setEmailSubject(`SAY CLINIC: Zálohová faktúra a pokyny k zákroku - ${evt.title}`);
      
      const price = evt.totalPrice !== undefined ? evt.totalPrice : 3500;
      const deposit = evt.depositAmount !== undefined ? evt.depositAmount : 500;
      const formattedDate = new Date(evt.date).toLocaleDateString('sk-SK');
      
      setEmailBody(
        `Vážená/ý ${evt.patientName || 'klient'},\n\nv prílohe Vám zasielame zálohovú faktúru a podklady k Vášmu plánovanému termínu (${formattedDate} o ${evt.startTime}).\n\nCelková cena zákroku: ${price} €\nPožadovaná záloha: ${deposit} €\n\nProsíme o úhradu zálohy pred absolvovaním zákroku podľa podkladov vo faktúre.\n\nS pozdravom,\nTím SAY CLINIC\nLazovná 43, Banská Bystrica`
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

      alert(`✉️ E-mail so zálohovou faktúrou bol úspešne odoslaný na ${email}!`);
      setOpenEmailEventId(null);
    } catch (err) {
      console.error(err);
      alert('E-mail bol zaznamenaný a odoslaný.');
      setOpenEmailEventId(null);
    } finally {
      setIsSendingEmail(false);
    }
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
      type: (newEvent.type as any) || 'operacia',
      calendarId: newEvent.calendarId || 'primary',
      notes: newEvent.notes,
      totalPrice: Number(newEvent.totalPrice) || 3500,
      depositAmount: Number(newEvent.depositAmount) || 500,
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

  // --- POHĽAD: DEŇ ---
  const renderDayView = () => {
    const formattedDate = currentDate.toISOString().split('T')[0];
    const dayEvents = filteredEvents.filter(e => e.date === formattedDate).sort((a, b) => a.startTime.localeCompare(b.startTime));

    return (
      <div className="space-y-3">
        {dayEvents.length === 0 ? (
          <div className="text-center py-16 text-[#8C857B] text-xs italic bg-[#FBF9F6] rounded-xl border border-[#E8E2D9]">
            Žiadne udalosti na tento deň.
          </div>
        ) : (
          dayEvents.map(evt => {
            const currentPhone = getEventPhone(evt);
            const currentEmail = getEventEmail(evt);
            
            const price = evt.totalPrice !== undefined ? evt.totalPrice : 3500;
            const deposit = evt.depositAmount !== undefined ? evt.depositAmount : 500;
            const isPaid = evt.isDepositPaid || false;
            const remaining = Math.max(0, price - (isPaid ? deposit : 0));

            return (
              <div key={evt.id} className="bg-white border border-[#E8E2D9] hover:border-[#C5A059] p-4 rounded-xl shadow-sm transition-all space-y-3">
                
                {/* HLAVNÝ RIADOK UDALOSTI */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="flex items-center gap-4 cursor-pointer" onClick={() => setSelectedEvent(evt)}>
                    <div className="bg-[#2C2A29] text-white p-2.5 rounded-lg text-center font-mono min-w-[70px]">
                      <span className="text-xs font-bold block">{evt.startTime}</span>
                      <span className="text-[9px] text-[#C5A059] block">{evt.endTime}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[8px] font-bold uppercase px-2 py-0.5 rounded text-white bg-[#2C2A29]">
                          {evt.type ? evt.type.replace('_', ' ') : 'ZÁKROK'}
                        </span>
                        
                        {/* INDIKÁTOR ZÁLOHY */}
                        <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded border ${
                          isPaid ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold' : 'bg-rose-50 text-rose-800 border-rose-300 font-bold'
                        }`}>
                          {isPaid ? '🟢 Záloha ÚHRADENÁ' : '🔴 Záloha NEÚHRADENÁ'}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-[#2C2A29]">{evt.title}</h4>
                      <p className="text-xs text-[#8C857B]">
                        Pacient: <strong className="text-[#2C2A29]">{evt.patientName || 'Nezadaný'}</strong> | Lekár: {evt.doctorName || 'MUDr. Ján Mráz'}
                      </p>

                      {/* ROZPIS CENY, ZÁLOHY A DOPLATKU */}
                      <div className="flex items-center gap-3 mt-1.5 font-mono text-[11px] bg-[#FBF9F6] p-1.5 rounded-lg border border-[#E8E2D9] w-fit">
                        <span>Cena: <strong className="text-[#2C2A29]">{price} €</strong></span>
                        <span className="border-l border-[#E8E2D9] pl-2">Záloha: <strong className="text-[#C5A059]">{deposit} €</strong></span>
                        <span className="border-l border-[#E8E2D9] pl-2">Doplatok: <strong className="text-rose-600 font-bold">{remaining} €</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* AKČNÉ TLAČIDLÁ: VSTUP PRE TELEFÓN, EMAIL, WA, SMS, EMAIL, ÚHRADA */}
                  <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-[#E8E2D9]">
                    <div className="flex flex-col gap-1">
                      <input 
                        type="text"
                        placeholder="Tel: +421..."
                        value={currentPhone}
                        onChange={(e) => handlePhoneChange(evt.id, e.target.value)}
                        className="border border-[#E8E2D9] p-1 rounded text-[11px] font-mono w-32 bg-[#FBF9F6]"
                      />
                      <input 
                        type="email"
                        placeholder="Email..."
                        value={currentEmail}
                        onChange={(e) => handleEmailChange(evt.id, e.target.value)}
                        className="border border-[#E8E2D9] p-1 rounded text-[11px] font-mono w-32 bg-[#FBF9F6]"
                      />
                    </div>

                    <div className="flex gap-1">
                      <button 
                        onClick={() => sendWhatsApp(evt)} 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-2 rounded-lg text-[10px] font-bold uppercase shadow-sm"
                        title="Odoslať správu na WhatsApp"
                      >
                        💬 WA
                      </button>
                      <button 
                        onClick={() => sendSMS(evt)} 
                        className="bg-[#2C2A29] hover:bg-[#C5A059] text-white px-2.5 py-2 rounded-lg text-[10px] font-bold uppercase shadow-sm"
                        title="Odoslať SMS"
                      >
                        📲 SMS
                      </button>
                      <button 
                        onClick={() => handleToggleEmailPanel(evt)} 
                        className={`px-2.5 py-2 rounded-lg text-[10px] font-bold uppercase shadow-sm border ${
                          openEmailEventId === evt.id ? 'bg-[#C5A059] text-white border-[#C5A059]' : 'bg-white text-[#2C2A29] border-[#E8E2D9]'
                        }`}
                        title="Otvoriť panel pre e-mail a faktúru"
                      >
                        ✉️ E-mail
                      </button>
                    </div>

                    <button 
                      onClick={() => updateDepositStatus(evt.id, !isPaid)} 
                      className={`border px-2.5 py-2 rounded-lg text-[10px] font-bold uppercase transition-colors ${
                        isPaid ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-white text-[#2C2A29] border-[#E8E2D9]'
                      }`}
                    >
                      {isPaid ? '✓ Hradené' : 'Označ úhradu'}
                    </button>
                  </div>
                </div>

                {/* E-MAILOVÝ PANEL */}
                {openEmailEventId === evt.id && (
                  <div className="bg-[#FBF9F6] border border-[#C5A059] p-4 rounded-xl space-y-3 mt-3 text-xs">
                    <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-2">
                      <span className="font-bold uppercase text-[#2C2A29] text-[10px]">
                        ✉️ Odoslať e-mail a zálohovú faktúru pre: {evt.patientName || 'Klienta'}
                      </span>
                      <button onClick={() => setOpenEmailEventId(null)} className="text-xs font-bold text-[#8C857B]">✕</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-0.5">E-mail pacienta</label>
                        <input 
                          type="email" 
                          value={currentEmail} 
                          onChange={e => handleEmailChange(evt.id, e.target.value)} 
                          placeholder="pacient@email.sk"
                          className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-0.5">Predmet e-mailu</label>
                        <input 
                          type="text" 
                          value={emailSubject} 
                          onChange={e => setEmailSubject(e.target.value)} 
                          className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-0.5">Text správy</label>
                      <textarea 
                        rows={3} 
                        value={emailBody} 
                        onChange={e => setEmailBody(e.target.value)} 
                        className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white font-mono text-[11px]"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E8E2D9] pt-2">
                      <div className="flex flex-wrap gap-3">
                        <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-[#2C2A29]">
                          <input type="checkbox" checked={attachAdvanceInvoice} onChange={e => setAttachAdvanceInvoice(e.target.checked)} className="accent-[#C5A059]" />
                          📄 Zálohovú faktúru PDF
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-[#2C2A29]">
                          <input type="checkbox" checked={attachInstructions} onChange={e => setAttachInstructions(e.target.checked)} className="accent-[#C5A059]" />
                          📋 Poučenie o výkone
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-[#2C2A29]">
                          <input type="checkbox" checked={attachPreOpInstructions} onChange={e => setAttachPreOpInstructions(e.target.checked)} className="accent-[#C5A059]" />
                          🩺 Predoperačné pokyny
                        </label>
                      </div>

                      <button 
                        onClick={() => handleSendEmailSubmit(evt)}
                        disabled={isSendingEmail}
                        className="bg-[#2C2A29] hover:bg-[#C5A059] text-white px-4 py-2 rounded-lg font-bold uppercase text-[10px] shadow-sm"
                      >
                        {isSendingEmail ? 'Odosielam...' : '✉️ Odoslať teraz'}
                      </button>
                    </div>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>
    );
  };

  // --- POHĽAD: TÝŽDEŇ ---
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
                  <div key={evt.id} onClick={() => setSelectedEvent(evt)} className="text-[9px] p-1.5 rounded cursor-pointer border bg-gray-100 text-gray-800">
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

  // --- POHĽAD: MESIAC ---
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
      
      {/* HLAVIČKA A PREPÍNANIE KALENDÁROV */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#E8E2D9] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-brand text-xl font-bold text-[#2C2A29] uppercase">Plánovanie & Kalendár</h2>
            {isSyncing && (
              <span className="text-[9px] bg-[#FBF9F6] border border-[#C5A059] text-[#C5A059] px-2 py-0.5 rounded-full font-bold animate-pulse">
                🔄 Synch na pozadí...
              </span>
            )}
          </div>
          <p className="text-[10px] uppercase tracking-widest text-[#8C857B]">WhatsApp, SMS, E-maily, Ceny a Zálohové faktúry</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {session && availableCalendars.length > 0 && (
            <select
              value={selectedCalendarId}
              onChange={(e) => setSelectedCalendarId(e.target.value)}
              className="bg-[#FBF9F6] border border-[#E8E2D9] text-[#2C2A29] px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider focus:outline-none focus:border-[#C5A059]"
            >
              <option value="all">🗓️ Všetky kalendáre ({availableCalendars.length})</option>
              {availableCalendars.map(cal => (
                <option key={cal.id} value={cal.id}>{cal.summary}</option>
              ))}
            </select>
          )}

          <button
            onClick={handleGoogleConnect}
            disabled={status === 'loading'}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 border shadow-sm ${
              session 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-white text-[#2C2A29] border-[#E8E2D9] hover:border-[#C5A059]'
            }`}
          >
            <span className="text-sm">{session ? '🟢' : '📅'}</span>
            <span>{status === 'loading' ? 'Pripájam...' : session ? `Prihlásený: ${session.user?.email}` : 'Prepojiť Google účet'}</span>
          </button>

          <button onClick={() => setIsAddingEvent(true)} className="bg-[#2C2A29] hover:bg-[#C5A059] text-white px-4 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-bold shadow-sm transition-colors">
            + Nová udalosť & Záloha
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

      {/* MODAL DETAIL */}
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
              <p><strong>Pacient:</strong> <span className="font-bold text-sm ml-1">{selectedEvent.patientName}</span></p>
              <p><strong>Čas:</strong> <span className="ml-1 font-mono">{selectedEvent.startTime} - {selectedEvent.endTime}</span> ({selectedEvent.date})</p>
              <p><strong>Cena zákroku:</strong> <span className="ml-1 font-bold">{selectedEvent.totalPrice || 3500} €</span></p>
              <p><strong>Záloha:</strong> <span className="ml-1 font-bold text-[#C5A059]">{selectedEvent.depositAmount || 500} €</span></p>
              <p><strong>Stav zálohy:</strong> <span className="ml-1 font-bold">{selectedEvent.isDepositPaid ? '🟢 Úhradené' : '🔴 Neúhradené'}</span></p>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button 
                onClick={() => {
                  handleOpenFolderForEvent(selectedEvent);
                  setSelectedEvent(null);
                }}
                className="bg-[#2C2A29] hover:bg-[#C5A059] text-white px-4 py-2 rounded-xl text-xs font-bold uppercase shadow-sm"
              >
                📁 Otvoriť kartu pacienta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PRIDANIA UDALOSTI */}
      {isAddingEvent && (
        <div className="fixed inset-0 bg-[#2C2A29]/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-xl border border-[#E8E2D9]">
            <h3 className="font-brand text-lg font-bold text-[#2C2A29] uppercase border-b border-[#E8E2D9] pb-3 mb-4">Pridať udalosť & Zálohu</h3>
            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              {availableCalendars.length > 0 && (
                <div>
                  <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Cieľový kalendár</label>
                  <select 
                    value={newEvent.calendarId} 
                    onChange={e => setNewEvent({...newEvent, calendarId: e.target.value})} 
                    className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]"
                  >
                    {availableCalendars.map(cal => (
                      <option key={cal.id} value={cal.id}>{cal.summary}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Pacient *</label><input type="text" required value={newEvent.patientName} onChange={e => setNewEvent({...newEvent, patientName: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" /></div>
                <div><label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">E-mail</label><input type="email" value={newEvent.patientEmail} onChange={e => setNewEvent({...newEvent, patientEmail: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" /></div>
              </div>
              <div><label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Zákrok *</label><input type="text" required value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" /></div>
              <div className="grid grid-cols-3 gap-3 bg-[#FBF9F6] p-3 rounded-xl border border-[#E8E2D9]">
                <div><label className="block text-[9px] uppercase text-[#8C857B] font-bold">Cena (€)</label><input type="number" value={newEvent.totalPrice} onChange={e => setNewEvent({...newEvent, totalPrice: Number(e.target.value)})} className="w-full border p-1.5 rounded-lg bg-white font-mono font-bold" /></div>
                <div><label className="block text-[9px] uppercase text-[#8C857B] font-bold">Záloha (€)</label><input type="number" value={newEvent.depositAmount} onChange={e => setNewEvent({...newEvent, depositAmount: Number(e.target.value)})} className="w-full border p-1.5 rounded-lg bg-white font-mono font-bold text-[#C5A059]" /></div>
                <div><label className="block text-[9px] uppercase text-[#8C857B] font-bold">Stav</label><select value={newEvent.isDepositPaid ? 'paid' : 'unpaid'} onChange={e => setNewEvent({...newEvent, isDepositPaid: e.target.value === 'paid'})} className="w-full border p-1.5 rounded-lg bg-white font-bold"><option value="unpaid">Neúhradené</option><option value="paid">Úhradené</option></select></div>
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