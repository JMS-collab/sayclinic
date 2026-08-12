'use client';

import React, { useState } from 'react';

export interface CalendarEvent {
  id: string;
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
  durationHours?: number;
  notes?: string;
}

// UKÁŽKOVÉ UDALOSTI V KALENDÁRI
const INITIAL_EVENTS: CalendarEvent[] = [
  {
    id: 'evt-1',
    patientId: 'P1',
    patientName: 'Mária Kováčová',
    patientPhone: '+421 905 123 456',
    doctorName: 'MUDr. Ján Mráz',
    title: 'Augmentácia prsníkov',
    date: '2026-08-14',
    startTime: '09:00',
    endTime: '11:00',
    type: 'operacia',
    anesthesiaType: 'Celková',
    durationHours: 2,
    notes: 'Implantáty Motiva 320ml, hospitalization 1 deň'
  },
  {
    id: 'evt-2',
    patientId: 'P2',
    patientName: 'Ján Novák',
    patientPhone: '+421 948 987 654',
    doctorName: 'MUDr. Zuzana Sroková, MPH',
    title: 'Vstupné vyšetrenie - Rhinoplastika',
    date: '2026-08-14',
    startTime: '13:00',
    endTime: '13:30',
    type: 'vstupne_vysetrenie',
    anesthesiaType: 'Lokálna',
    durationHours: 0.5,
  }
];

interface CalendarProps {
  events?: CalendarEvent[];
  onOpenPatientFolder?: (patientId: string) => void;
  onAddEvent?: (event: CalendarEvent) => void;
}

export default function Calendar({ events = INITIAL_EVENTS, onOpenPatientFolder, onAddEvent }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date('2026-08-12'));
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modal na manuálne pridanie udalosti
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    patientName: '',
    doctorName: 'MUDr. Ján Mráz',
    title: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    type: 'operacia',
    anesthesiaType: 'Celková'
  });

  // Navigácia v dňoch
  const changeDate = (days: number) => {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + days);
    setCurrentDate(nextDate);
  };

  const formattedCurrentDate = currentDate.toISOString().split('T')[0];

  // Filtrovanie udalostí pre vybraný deň
  const dayEvents = events.filter(e => e.date === formattedCurrentDate);

  // Prepojenie s Google Útom
  const handleGoogleConnect = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsGoogleConnected(!isGoogleConnected);
      setIsSyncing(false);
    }, 1200);
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
      date: newEvent.date || formattedCurrentDate,
      startTime: newEvent.startTime || '09:00',
      endTime: newEvent.endTime || '10:00',
      type: newEvent.type as any || 'operacia',
      anesthesiaType: newEvent.anesthesiaType,
      notes: newEvent.notes
    };

    if (onAddEvent) onAddEvent(created);
    setIsAddingEvent(false);
    setNewEvent({
      patientName: '',
      doctorName: 'MUDr. Ján Mráz',
      title: '',
      date: formattedCurrentDate,
      startTime: '09:00',
      endTime: '10:00',
      type: 'operacia'
    });
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-6">
      
      {/* HLAVIČKA KALENDÁRA & GOOGLE SYNCHRONIZÁCIA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#E8E2D9] pb-4">
        <div>
          <h2 className="font-brand text-xl font-bold text-[#2C2A29] uppercase">Plánovací Kalendár SAY CLINIC</h2>
          <p className="text-[10px] uppercase tracking-widest text-[#8C857B]">Harmonogram operácií, konzultácií a kontrol</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Tlačidlo Google Synchronizácie */}
          <button
            onClick={handleGoogleConnect}
            disabled={isSyncing}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border shadow-sm ${
              isGoogleConnected 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' 
                : 'bg-white text-[#2C2A29] border-[#E8E2D9] hover:border-[#C5A059]'
            }`}
          >
            <span className="text-base">{isGoogleConnected ? '🟢' : '📅'}</span>
            <span>
              {isSyncing ? 'Pripájam...' : isGoogleConnected ? 'Google Kalendár Synch.' : 'Prepojiť Google Kalendár'}
            </span>
          </button>

          <button
            onClick={() => setIsAddingEvent(true)}
            className="bg-[#2C2A29] hover:bg-[#C5A059] text-white px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold shadow-sm transition-colors"
          >
            + Nová udalosť
          </button>
        </div>
      </div>

      {/* NAVIGÁCIA MEDZI DŇAMI */}
      <div className="flex justify-between items-center bg-[#FBF9F6] p-4 rounded-xl border border-[#E8E2D9]">
        <button onClick={() => changeDate(-1)} className="px-3 py-1 bg-white border border-[#E8E2D9] rounded-lg text-xs font-bold text-[#2C2A29] hover:border-[#C5A059]">
          ← Predchádzajúci deň
        </button>
        
        <div className="text-center">
          <span className="text-xs uppercase font-bold text-[#C5A059] block tracking-widest">Vybraný Dátum</span>
          <span className="text-base font-bold text-[#2C2A29]">
            {currentDate.toLocaleDateString('sk-SK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>

        <button onClick={() => changeDate(1)} className="px-3 py-1 bg-white border border-[#E8E2D9] rounded-lg text-xs font-bold text-[#2C2A29] hover:border-[#C5A059]">
          Nasledujúci deň →
        </button>
      </div>

      {/* HARMONOGRAM DŇA (ČASOVÁ OS) */}
      <div className="border border-[#E8E2D9] rounded-xl p-4 bg-[#FBF9F6] space-y-3 min-h-[400px]">
        <p className="text-[10px] uppercase font-bold text-[#8C857B] tracking-wider mb-2"> Program na deň ({dayEvents.length} udalostí)</p>

        {dayEvents.length === 0 ? (
          <div className="text-center py-16 text-[#8C857B] text-xs italic">
            Na tento deň zatiaľ nie sú naplánované žiadne zákroky ani vyšetrenia.
          </div>
        ) : (
          <div className="space-y-3">
            {dayEvents.map(evt => (
              <div 
                key={evt.id} 
                onClick={() => setSelectedEvent(evt)}
                className="bg-white border border-[#E8E2D9] hover:border-[#C5A059] p-4 rounded-xl shadow-sm cursor-pointer transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-[#2C2A29] text-white p-2.5 rounded-lg text-center font-mono min-w-[70px]">
                    <span className="text-xs font-bold block">{evt.startTime}</span>
                    <span className="text-[9px] text-[#C5A059] block">{evt.endTime}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded text-white ${
                        evt.type === 'operacia' ? 'bg-[#2C2A29]' : evt.type === 'vstupne_vysetrenie' ? 'bg-[#C5A059]' : 'bg-emerald-700'
                      }`}>
                        {evt.type === 'operacia' ? 'Operácia' : evt.type === 'vstupne_vysetrenie' ? 'Vstupné vyšetrenie' : 'Kontrola'}
                      </span>
                      {evt.anesthesiaType && (
                        <span className="text-[8px] font-bold uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-200">
                          {evt.anesthesiaType}
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-[#2C2A29] group-hover:text-[#C5A059] transition-colors mt-1">{evt.title}</h4>
                    <p className="text-xs text-[#8C857B]">Pacient: <strong className="text-[#2C2A29]">{evt.patientName}</strong> | Lekár: {evt.doctorName}</p>
                  </div>
                </div>

                <button className="text-[10px] uppercase font-bold text-[#C5A059] border border-[#C5A059] px-3 py-1.5 rounded-lg hover:bg-[#C5A059] hover:text-white transition-colors">
                  Detail / Zložka →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: DETAIL UDALOSTI A PREKLIK DO KARTOTÉKY */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-[#2C2A29]/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-xl border border-[#E8E2D9] space-y-4">
            <div className="border-b border-[#E8E2D9] pb-3 flex justify-between items-start">
              <div>
                <span className="text-[9px] uppercase font-bold text-[#C5A059] tracking-wider">Detail naplánovanej udalosti</span>
                <h3 className="font-brand text-lg font-bold text-[#2C2A29] uppercase">{selectedEvent.title}</h3>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-xs font-bold text-[#8C857B]">✕</button>
            </div>

            <div className="space-y-2 text-xs bg-[#FBF9F6] p-3 rounded-xl border border-[#E8E2D9]">
              <p><strong>Pacient:</strong> <span className="font-bold text-sm ml-1">{selectedEvent.patientName}</span></p>
              {selectedEvent.patientPhone && <p><strong>Telefón:</strong> <span className="ml-1">{selectedEvent.patientPhone}</span></p>}
              <p><strong>Lekár:</strong> <span className="ml-1">{selectedEvent.doctorName}</span></p>
              <p><strong>Čas:</strong> <span className="ml-1 font-mono">{selectedEvent.startTime} - {selectedEvent.endTime}</span> ({selectedEvent.date})</p>
              {selectedEvent.anesthesiaType && <p><strong>Anestézia:</strong> <span className="ml-1">{selectedEvent.anesthesiaType}</span></p>}
              {selectedEvent.notes && <p className="pt-2 border-t border-[#E8E2D9] text-[#8C857B]"><strong>Poznámky:</strong> {selectedEvent.notes}</p>}
            </div>

            <div className="flex justify-between items-center pt-2">
              {/* TLAČIDLO PRE PREKLIK DO KARTOTÉKY PACIENTA */}
              <button 
                onClick={() => {
                  if (selectedEvent.patientId && onOpenPatientFolder) {
                    onOpenPatientFolder(selectedEvent.patientId);
                  } else {
                    alert(`Otváram zložku pacienta: ${selectedEvent.patientName}`);
                  }
                  setSelectedEvent(null);
                }}
                className="bg-[#2C2A29] hover:bg-[#C5A059] text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
              >
                📁 Otvoriť kartu pacienta
              </button>

              <button onClick={() => setSelectedEvent(null)} className="text-xs font-bold text-[#8C857B]">
                Zavrieť
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PRIDANIE UDALOSTI */}
      {isAddingEvent && (
        <div className="fixed inset-0 bg-[#2C2A29]/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-xl border border-[#E8E2D9]">
            <h3 className="font-brand text-lg font-bold text-[#2C2A29] uppercase border-b border-[#E8E2D9] pb-3 mb-4">Pridať novú udalosť do kalendára</h3>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Meno pacienta *</label>
                <input type="text" required value={newEvent.patientName} onChange={e => setNewEvent({...newEvent, patientName: e.target.value})} placeholder="Mária Kováčová" className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Názov zákroku / Dôvod *</label>
                <input type="text" required value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} placeholder="napr. Augmentácia prsníkov" className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Dátum</label>
                  <input type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Začiatok</label>
                  <input type="time" value={newEvent.startTime} onChange={e => setNewEvent({...newEvent, startTime: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Koniec</label>
                  <input type="time" value={newEvent.endTime} onChange={e => setNewEvent({...newEvent, endTime: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Ošetrujúci lekár</label>
                  <select value={newEvent.doctorName} onChange={e => setNewEvent({...newEvent, doctorName: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]">
                    <option value="MUDr. Ján Mráz">MUDr. Ján Mráz</option>
                    <option value="MUDr. Zuzana Sroková, MPH">MUDr. Zuzana Sroková, MPH</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Typ udalosťi</label>
                  <select value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value as any})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]">
                    <option value="operacia">Operácia</option>
                    <option value="vstupne_vysetrenie">Vstupné vyšetrenie</option>
                    <option value="kontrolne_vysetrenie">Kontrolné vyšetrenie</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#E8E2D9]">
                <button type="button" onClick={() => setIsAddingEvent(false)} className="px-4 py-2 font-bold text-[#8C857B]">ZRUŠIŤ</button>
                <button type="submit" className="px-5 py-2 bg-[#2C2A29] text-white font-bold rounded-xl uppercase">ULOŽIŤ DO KALENDÁRA</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
