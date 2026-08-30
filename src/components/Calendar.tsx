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
  doctorName: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  type: 'operacia' | 'konzultacia' | 'kontrolne_vysetrenie' | 'vstupne_vysetrenie';
  anesthesiaType?: string;
  notes?: string;
}

export interface GoogleCalendarItem {
  id: string;
  summary: string;
  primary?: boolean;
}

interface CalendarProps {
  events?: CalendarEvent[];
  patients?: Array<{ id: string; name: string; phone?: string }>; // Zoznam importovaných pacientov z Google Drive
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Stavy pre ručne dopísané telefónne čísla a stavy pripomienok
  const [customPhones, setCustomPhones] = useState<Record<string, string>>({});
  const [reminderStatuses, setReminderStatuses] = useState<Record<string, 'pending' | 'sent' | 'confirmed'>>({});

  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    patientName: '', 
    patientPhone: '',
    doctorName: 'MUDr. Ján Mráz', 
    title: '', 
    date: new Date().toISOString().split('T')[0], 
    startTime: '09:00', 
    endTime: '10:00', 
    type: 'operacia',
    calendarId: 'primary'
  });

  // 1. KROK: Okamžité načítanie z keše (0 ms) + Následná synchronizácia na pozadí
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
        .catch(err => console.error("Chyba pri tichej synchronizácii Google Kalendára:", err))
        .finally(() => setIsSyncing(false));
    }
  }, [session]);

  // Filtrovanie udalostí podľa vybraného kalendára
  const filteredEvents = selectedCalendarId === 'all' 
    ? calendarEvents 
    : calendarEvents.filter(e => e.calendarId === selectedCalendarId);

  // Dohľadanie telefónu (z udalosti, z ručného zápisu alebo z kartotéky)
  const getEventPhone = (evt: CalendarEvent) => {
    if (customPhones[evt.id] !== undefined) return customPhones[evt.id];
    if (evt.patientPhone && evt.patientPhone.trim() !== '') return evt.patientPhone;
    if (evt.patientName && patients.length > 0) {
      const found = patients.find(p => p.name.toLowerCase().trim() === evt.patientName.toLowerCase().trim());
      if (found && found.phone) return found.phone;
    }
    return '';
  };

  const handlePhoneChange = (eventId: string, phone: string) => {
    setCustomPhones(prev => ({ ...prev, [eventId]: phone }));
  };

  // WhatsApp & SMS Odosielanie priamo z Kalendára
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
    setReminderStatuses(prev => ({ ...prev, [evt.id]: 'sent' }));
  };

  const sendSMS = (evt: CalendarEvent) => {
    const phone = getEventPhone(evt);
    if (!phone) {
      alert('Prosím, zadajte najprv telefónne číslo pacienta.');
      return;
    }
    const formattedDate = new Date(evt.date).toLocaleDateString('sk-SK');
    const msg = `Dobrý deň ${evt.patientName || ''}, pripomíname Vám Váš termín zákroku (${evt.title}) na SAY CLINIC dňa ${formattedDate} o ${evt.startTime}. Adresa: Lazovná 43, Banská Bystrica. Prosíme o potvrdenie odpoveďou na túto správu.`;

    window.open(`sms:${phone}?body=${encodeURIComponent(msg)}`, '_blank');
    setReminderStatuses(prev => ({ ...prev, [evt.id]: 'sent' }));
  };

  const toggleConfirm = (eventId: string) => {
    setReminderStatuses(prev => ({
      ...prev,
      [eventId]: prev[eventId] === 'confirmed' ? 'sent' : 'confirmed'
    }));
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
    if (session) {
      signOut();
    } else {
      signIn('google');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.patientName || !newEvent.title) return;

    setIsSaving(true);

    const created: CalendarEvent = {
      id: `evt-${Date.now()}`,
      patientName: newEvent.patientName || '',
      patientPhone: newEvent.patientPhone || '',
      doctorName: newEvent.doctorName || 'MUDr. Ján Mráz',
      title: newEvent.title || '',
      date: newEvent.date || currentDate.toISOString().split('T')[0],
      startTime: newEvent.startTime || '09:00',
      endTime: newEvent.endTime || '10:00',
      type: (newEvent.type as any) || 'operacia',
      calendarId: newEvent.calendarId || 'primary',
      notes: newEvent.notes
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

    const eventTitleLower = (event.title || '').toLowerCase().trim();
    const eventPatientLower = (event.patientName || '').toLowerCase().trim();

    let matchedPatient = patients.find(p => {
      const patientNameLower = p.name.toLowerCase().trim();
      if (!patientNameLower) return false;

      const matchInTitle = eventTitleLower.includes(patientNameLower);
      const matchInPatientName = eventPatientLower.includes(patientNameLower);
      const reverseMatchInTitle = patientNameLower.includes(eventTitleLower);
      const reverseMatchInPatient = patientNameLower.includes(eventPatientLower);

      return matchInTitle || matchInPatientName || reverseMatchInTitle || reverseMatchInPatient;
    });

    if (!matchedPatient) {
      const ignoreWords = ['operacia', 'konzultacia', 'kontrolne', 'vysetrenie', 'augmentacia', 'plastika', 'mraz', 'mudr'];
      const words = `${event.title} ${event.patientName}`
        .split(/[\s\-–—,]+/)
        .map(w => w.toLowerCase().trim())
        .filter(w => w.length > 3 && !ignoreWords.includes(w));

      matchedPatient = patients.find(p => 
        words.some(word => p.name.toLowerCase().includes(word))
      );
    }

    if (matchedPatient) {
      onOpenPatientFolder(matchedPatient.id);
    } else {
      alert(`Pacient pre udalosť "${event.title}" nebol automaticky nájdený v kartotéke.\nSkontrolujte, či názov zložky na Google Disku obsahuje meno klienta.`);
    }
  };

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
            const status = reminderStatuses[evt.id] || 'pending';

            return (
              <div key={evt.id} className="bg-white border border-[#E8E2D9] hover:border-[#C5A059] p-4 rounded-xl shadow-sm transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group">
                <div className="flex items-center gap-4 cursor-pointer" onClick={() => setSelectedEvent(evt)}>
                  <div className="bg-[#2C2A29] text-white p-2.5 rounded-lg text-center font-mono min-w-[70px]">
                    <span className="text-xs font-bold block">{evt.startTime}</span>
                    <span className="text-[9px] text-[#C5A059] block">{evt.endTime}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded text-white ${evt.type === 'operacia' ? 'bg-[#2C2A29]' : evt.type === 'vstupne_vysetrenie' ? 'bg-[#C5A059]' : 'bg-emerald-700'}`}>
                        {evt.type.replace('_', ' ')}
                      </span>
                      {evt.calendarName && (
                        <span className="text-[8px] bg-amber-50 text-[#C5A059] border border-[#C5A059]/30 px-2 py-0.5 rounded font-bold">
                          {evt.calendarName}
                        </span>
                      )}
                      {status === 'pending' && <span className="bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded text-[8px] uppercase font-bold">🔴 Neodoslané</span>}
                      {status === 'sent' && <span className="bg-blue-50 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded text-[8px] uppercase font-bold">🟡 Odoslané</span>}
                      {status === 'confirmed' && <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded text-[8px] uppercase font-bold">🟢 Potvrdené</span>}
                    </div>
                    <h4 className="font-bold text-sm text-[#2C2A29] group-hover:text-[#C5A059]">{evt.title}</h4>
                    <p className="text-xs text-[#8C857B]">Pacient: <strong className="text-[#2C2A29]">{evt.patientName}</strong> | Lekár: {evt.doctorName}</p>
                  </div>
                </div>

                {/* WHATSAPP & SMS AKCIE PRIAMO V KALENDÁRI */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-[#E8E2D9]">
                  <input 
                    type="text"
                    placeholder="+421 905 123 456"
                    value={currentPhone}
                    onChange={(e) => handlePhoneChange(evt.id, e.target.value)}
                    className="border border-[#E8E2D9] p-1.5 rounded-lg text-xs font-mono w-32 bg-[#FBF9F6] outline-none focus:border-[#C5A059]"
                  />
                  <button 
                    onClick={() => sendWhatsApp(evt)} 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors shadow-sm"
                  >
                    💬 WA
                  </button>
                  <button 
                    onClick={() => sendSMS(evt)} 
                    className="bg-[#2C2A29] hover:bg-[#C5A059] text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors shadow-sm"
                  >
                    📲 SMS
                  </button>
                  <button 
                    onClick={() => toggleConfirm(evt.id)} 
                    className="border border-[#E8E2D9] bg-white text-[#2C2A29] hover:bg-gray-100 px-2 py-1.5 rounded-lg text-[10px] font-bold"
                    title="Označiť ako potvrdené"
                  >
                    ✓
                  </button>
                </div>
              </div>
            );
          })
        )}
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
              <div className={`text-center p-2 border-b text-[10px] uppercase font-bold sticky top-0 z-10 ${isToday ? 'bg-[#C5A059] text-white border-[#C5A059]' : 'bg-[#FBF9F6] text-[#8C857B] border-[#E8E2D9]'}`}>
                <span className="block">{dayNames[idx]}</span>
                <span className="text-sm">{date.getDate()}.{date.getMonth() + 1}.</span>
              </div>
              <div className="p-1.5 flex-1 space-y-1.5">
                {dayEvents.map(evt => (
                  <div key={evt.id} onClick={() => setSelectedEvent(evt)} className={`text-[9px] p-1.5 rounded cursor-pointer border ${evt.type === 'operacia' ? 'bg-gray-100 border-gray-300 text-gray-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                    <strong className="block">{evt.startTime}</strong>
                    <span className="truncate block">{evt.patientName || evt.title}</span>
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
          {dayNames.map(day => (
            <div key={day} className="text-center p-2 text-[10px] font-bold text-[#8C857B] uppercase">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-[100px]">
          {monthDays.map((date, idx) => {
            if (!date) return <div key={`empty-${idx}`} className="border-b border-r border-[#E8E2D9]/50 bg-gray-50" />;
            
            const formattedDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
            const dayEvents = filteredEvents.filter(e => e.date === formattedDate);
            const isToday = formattedDate === new Date().toISOString().split('T')[0];

            return (
              <div key={formattedDate} className={`border-b border-r border-[#E8E2D9]/50 p-1 flex flex-col ${isToday ? 'bg-amber-50/30' : ''}`}>
                <span className={`text-[10px] font-bold self-end w-5 h-5 flex items-center justify-center rounded-full ${isToday ? 'bg-[#C5A059] text-white' : 'text-[#8C857B]'}`}>
                  {date.getDate()}
                </span>
                <div className="flex-1 overflow-y-auto space-y-1 mt-1">
                  {dayEvents.slice(0, 3).map(evt => (
                    <div key={evt.id} onClick={() => setSelectedEvent(evt)} className="text-[8px] bg-gray-100 p-1 rounded truncate cursor-pointer hover:bg-[#C5A059] hover:text-white transition-colors">
                      {evt.startTime} {evt.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && <div className="text-[8px] text-[#C5A059] font-bold text-center">+{dayEvents.length - 3} ďalšie</div>}
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
          <p className="text-[10px] uppercase tracking-widest text-[#8C857B]">Centrálny harmonogram SAY CLINIC s priamym WhatsApp/SMS pripomienkovačom</p>
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
                <option key={cal.id} value={cal.id}>
                  {cal.summary}
                </option>
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
            + Nová udalosť
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center bg-[#FBF9F6] p-3 rounded-xl border border-[#E8E2D9]">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="px-2 py-1 bg-white border border-[#E8E2D9] rounded text-xs font-bold text-[#2C2A29] hover:border-[#C5A059]">←</button>
          <button onClick={() => navigate(0)} className="px-3 py-1 bg-white border border-[#E8E2D9] rounded text-[10px] uppercase font-bold text-[#8C857B] hover:text-[#2C2A29]">Dnes</button>
          <button onClick={() => navigate(1)} className="px-2 py-1 bg-white border border-[#E8E2D9] rounded text-xs font-bold text-[#2C2A29] hover:border-[#C5A059]">→</button>
        </div>
        
        <div className="text-center px-4">
          <span className="text-sm font-bold text-[#2C2A29] uppercase">
            {view === 'month' 
              ? currentDate.toLocaleDateString('sk-SK', { month: 'long', year: 'numeric' })
              : currentDate.toLocaleDateString('sk-SK', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>

        <div className="flex gap-1 bg-white border border-[#E8E2D9] p-1 rounded-lg">
          {(['day', 'week', 'month'] as ViewMode[]).map(mode => (
            <button 
              key={mode} 
              onClick={() => setView(mode)}
              className={`px-3 py-1 text-[10px] font-bold uppercase rounded ${view === mode ? 'bg-[#2C2A29] text-white' : 'text-[#8C857B] hover:bg-gray-50'}`}
            >
              {mode === 'day' ? 'Deň' : mode === 'week' ? 'Týždeň' : 'Mesiac'}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-[400px]">
        {view === 'day' && renderDayView()}
        {view === 'week' && renderWeekView()}
        {view === 'month' && renderMonthView()}
      </div>

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
              {selectedEvent.calendarName && <p><strong>Kalendár:</strong> <span className="ml-1 font-bold text-[#C5A059]">{selectedEvent.calendarName}</span></p>}
              <p><strong>Pacient:</strong> <span className="font-bold text-sm ml-1">{selectedEvent.patientName}</span></p>
              <p><strong>Čas:</strong> <span className="ml-1 font-mono">{selectedEvent.startTime} - {selectedEvent.endTime}</span> ({selectedEvent.date})</p>
              {selectedEvent.notes && <p className="pt-2 border-t border-[#E8E2D9] text-[#8C857B]"><strong>Poznámky:</strong> {selectedEvent.notes}</p>}
            </div>

            <div className="flex justify-between items-center pt-2">
              <button 
                onClick={() => {
                  handleOpenFolderForEvent(selectedEvent);
                  setSelectedEvent(null);
                }}
                className="bg-[#2C2A29] hover:bg-[#C5A059] text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
              >
                📁 Otvoriť kartu pacienta
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddingEvent && (
        <div className="fixed inset-0 bg-[#2C2A29]/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-xl border border-[#E8E2D9]">
            <h3 className="font-brand text-lg font-bold text-[#2C2A29] uppercase border-b border-[#E8E2D9] pb-3 mb-4">Pridať do Google Kalendára</h3>

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

              <div><label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Meno pacienta *</label><input type="text" required value={newEvent.patientName} onChange={e => setNewEvent({...newEvent, patientName: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" /></div>
              <div><label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Telefón (pre WhatsApp/SMS)</label><input type="text" placeholder="+421 905 123 456" value={newEvent.patientPhone} onChange={e => setNewEvent({...newEvent, patientPhone: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" /></div>
              <div><label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Názov zákroku *</label><input type="text" required value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Dátum</label><input type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" /></div>
                <div><label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Začiatok</label><input type="time" value={newEvent.startTime} onChange={e => setNewEvent({...newEvent, startTime: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" /></div>
                <div><label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Koniec</label><input type="time" value={newEvent.endTime} onChange={e => setNewEvent({...newEvent, endTime: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" /></div>
              </div>
              
              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Poznámky</label>
                <textarea value={newEvent.notes} onChange={e => setNewEvent({...newEvent, notes: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" rows={2}></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#E8E2D9]">
                <button type="button" onClick={() => setIsAddingEvent(false)} className="px-4 py-2 font-bold text-[#8C857B]">ZRUŠIŤ</button>
                <button type="submit" disabled={isSaving} className="px-5 py-2 bg-[#2C2A29] text-white font-bold rounded-xl uppercase">
                  {isSaving ? 'Ukladám...' : 'ULOŽIŤ DO GOOGLE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}