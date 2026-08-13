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

const INITIAL_EVENTS: CalendarEvent[] = [
  {
    id: 'evt-1',
    patientId: 'P1',
    patientName: 'Mária Kováčová',
    patientPhone: '+421 905 123 456',
    doctorName: 'MUDr. Ján Mráz',
    title: 'Augmentácia prsníkov',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '11:00',
    type: 'operacia',
    anesthesiaType: 'Celková',
    notes: 'Implantáty Motiva 320ml, hospitalizácia 1 deň'
  }
];

interface CalendarProps {
  events?: CalendarEvent[];
  onOpenPatientFolder?: (patientId: string) => void;
  onAddEvent?: (event: CalendarEvent) => void;
}

type ViewMode = 'day' | 'week' | 'month';

export default function Calendar({ events: initialPropEvents = INITIAL_EVENTS, onOpenPatientFolder, onAddEvent }: CalendarProps) {
  const { data: session, status } = useSession();
  
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(initialPropEvents);
  const [availableCalendars, setAvailableCalendars] = useState<GoogleCalendarItem[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('all');

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewMode>('day');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    patientName: '', doctorName: 'MUDr. Ján Mráz', title: '', 
    date: new Date().toISOString().split('T')[0], startTime: '09:00', endTime: '10:00', type: 'operacia'
  });

  // Načítanie kalendárov a udalostí
  useEffect(() => {
    if (session) {
      setIsLoadingGoogle(true);
      fetch('/api/calendar')
        .then(res => res.json())
        .then(data => {
          if (data.events && Array.isArray(data.events)) {
            setCalendarEvents(data.events);
            setAvailableCalendars(data.calendars || []);
          } else if (Array.isArray(data)) {
            setCalendarEvents(data);
          }
        })
        .catch(err => console.error("Chyba pri načítaní Google Kalendára:", err))
        .finally(() => setIsLoadingGoogle(false));
    } else {
      setCalendarEvents(initialPropEvents);
      setAvailableCalendars([]);
    }
  }, [session]);

  // Filtrovanie udalostí podľa vybraného kalendára
  const filteredEvents = selectedCalendarId === 'all' 
    ? calendarEvents 
    : calendarEvents.filter(e => e.calendarId === selectedCalendarId);

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

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.patientName || !newEvent.title) return;

    const created: CalendarEvent = {
      id: `evt-${Date.now()}`,
      patientName: newEvent.patientName || '',
      patientPhone: newEvent.patientPhone || '',
      doctorName: newEvent.doctorName || 'MUDr. Ján Mráz',
      title: newEvent.title || '',
      date: newEvent.date || currentDate.toISOString().split('T')[0],
      startTime: newEvent.startTime || '09:00',
      endTime: newEvent.endTime || '10:00',
      type: newEvent.type as any || 'operacia',
      anesthesiaType: newEvent.anesthesiaType,
      notes: newEvent.notes
    };

    if (onAddEvent) onAddEvent(created);
    setCalendarEvents(prev => [...prev, created]);
    setIsAddingEvent(false);
  };

  const renderDayView = () => {
    const formattedDate = currentDate.toISOString().split('T')[0];
    const dayEvents = filteredEvents.filter(e => e.date === formattedDate).sort((a, b) => a.startTime.localeCompare(b.startTime));

    return (
      <div className="space-y-3">
        {dayEvents.length === 0 ? (
          <div className="text-center py-16 text-[#8C857B] text-xs italic">
            {isLoadingGoogle ? 'Nahrávam udobrenia z Google Kalendára...' : 'Žiadne zákroky na tento deň.'}
          </div>
        ) : (
          dayEvents.map(evt => (
            <div key={evt.id} onClick={() => setSelectedEvent(evt)} className="bg-white border border-[#E8E2D9] hover:border-[#C5A059] p-4 rounded-xl shadow-sm cursor-pointer transition-all flex justify-between items-center group">
              <div className="flex items-center gap-4">
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
                  </div>
                  <h4 className="font-bold text-sm text-[#2C2A29] group-hover:text-[#C5A059]">{evt.title}</h4>
                  <p className="text-xs text-[#8C857B]">{evt.patientName} | {evt.doctorName}</p>
                </div>
              </div>
            </div>
          ))
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
                    <span className="truncate block">{evt.patientName}</span>
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
          <h2 className="font-brand text-xl font-bold text-[#2C2A29] uppercase">Plánovanie & Kalendár</h2>
          <p className="text-[10px] uppercase tracking-widest text-[#8C857B]">Centrálny harmonogram SAY CLINIC</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Výber kalendára */}
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
              {selectedEvent.patientPhone && <p><strong>Telefón:</strong> <span className="ml-1">{selectedEvent.patientPhone}</span></p>}
              <p><strong>Čas:</strong> <span className="ml-1 font-mono">{selectedEvent.startTime} - {selectedEvent.endTime}</span> ({selectedEvent.date})</p>
              {selectedEvent.notes && <p className="pt-2 border-t border-[#E8E2D9] text-[#8C857B]"><strong>Poznámky:</strong> {selectedEvent.notes}</p>}
            </div>

            <div className="flex justify-between items-center pt-2">
              <button 
                onClick={() => {
                  if (selectedEvent.patientId && onOpenPatientFolder) onOpenPatientFolder(selectedEvent.patientId);
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
            <h3 className="font-brand text-lg font-bold text-[#2C2A29] uppercase border-b border-[#E8E2D9] pb-3 mb-4">Pridať do kalendára</h3>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div><label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Meno pacienta *</label><input type="text" required value={newEvent.patientName} onChange={e => setNewEvent({...newEvent, patientName: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" /></div>
              <div><label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Názov zákroku *</label><input type="text" required value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Dátum</label><input type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" /></div>
                <div><label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Začiatok</label><input type="time" value={newEvent.startTime} onChange={e => setNewEvent({...newEvent, startTime: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" /></div>
                <div><label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Koniec</label><input type="time" value={newEvent.endTime} onChange={e => setNewEvent({...newEvent, endTime: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Lekár</label>
                  <select value={newEvent.doctorName} onChange={e => setNewEvent({...newEvent, doctorName: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]">
                    <option value="MUDr. Ján Mráz">MUDr. Ján Mráz</option><option value="MUDr. Zuzana Sroková, MPH">MUDr. Zuzana Sroková, MPH</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Typ</label>
                  <select value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value as any})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]">
                    <option value="operacia">Operácia</option><option value="vstupne_vysetrenie">Vstupné vyšetrenie</option><option value="kontrolne_vysetrenie">Kontrola</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-[#E8E2D9]">
                <button type="button" onClick={() => setIsAddingEvent(false)} className="px-4 py-2 font-bold text-[#8C857B]">ZRUŠIŤ</button>
                <button type="submit" className="px-5 py-2 bg-[#2C2A29] text-white font-bold rounded-xl uppercase">ULOŽIŤ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}