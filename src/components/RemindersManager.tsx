'use client';

import React, { useState } from 'react';
import { CalendarEvent } from './Calendar';

export interface ReminderLog {
  eventId: string;
  patientName: string;
  phone: string;
  eventDate: string;
  eventTime: string;
  serviceType: string;
  channel: 'whatsapp' | 'sms';
  status: 'pending' | 'sent' | 'confirmed';
  sentAt?: string;
}

interface RemindersManagerProps {
  events?: CalendarEvent[];
  patients?: Array<{ id: string; name: string; phone?: string }>;
}

export default function RemindersManager({ events = [], patients = [] }: RemindersManagerProps) {
  const [filterScope, setFilterScope] = useState<'today' | 'week' | 'next_week' | 'upcoming' | 'custom' | 'all'>('week');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Vlastný dátumový rozsah (Od - Do)
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Lokálny stav pre rýchlo dopísané / upravené telefónne čísla
  const [customPhones, setCustomPhones] = useState<Record<string, string>>({});

  // Pomocné funkcie pre dátumy
  const todayISO = new Date().toISOString().split('T')[0];

  const getEndOfWeekISO = (offsetWeeks = 0) => {
    const d = new Date();
    const day = d.getDay();
    const diffToSunday = (day === 0 ? 0 : 7 - day) + (offsetWeeks * 7);
    const endOfWeek = new Date(d);
    endOfWeek.setDate(d.getDate() + diffToSunday);
    return endOfWeek.toISOString().split('T')[0];
  };

  const getStartOfNextWeekISO = () => {
    const d = new Date();
    const day = d.getDay();
    const diffToMonday = (day === 0 ? 1 : 8 - day);
    const startOfNext = new Date(d);
    startOfNext.setDate(d.getDate() + diffToMonday);
    return startOfNext.toISOString().split('T')[0];
  };

  // Automatické vyťaženie alebo ručné vyhľadanie telefónu
  const getPatientPhone = (evt: CalendarEvent) => {
    // 1. Ručne dopísané číslo užívateľom priamo v pripomienkovači
    if (customPhones[evt.id] !== undefined) {
      return customPhones[evt.id];
    }
    // 2. Číslo z kalendárovej udalosti
    if (evt.patientPhone && evt.patientPhone.trim() !== '') {
      return evt.patientPhone;
    }
    // 3. Číslo vyhľadané v Kartotéke podľa mena
    if (evt.patientName && patients.length > 0) {
      const found = patients.find(p => p.name.toLowerCase().trim() === evt.patientName.toLowerCase().trim());
      if (found && found.phone) return found.phone;
    }
    return '';
  };

  const handlePhoneChange = (eventId: string, newPhone: string) => {
    setCustomPhones(prev => ({
      ...prev,
      [eventId]: newPhone
    }));
  };

  // FILTROVANIE A CHRONOLOGICKÉ ZORADENIE
  const filteredEvents = events
    .filter(evt => {
      const evtDate = evt.date ? evt.date.split('T')[0] : '';

      // A) Rozsah dátumov
      let matchesScope = true;
      if (filterScope === 'today') {
        matchesScope = evtDate === todayISO;
      } else if (filterScope === 'week') {
        matchesScope = evtDate >= todayISO && evtDate <= getEndOfWeekISO(0);
      } else if (filterScope === 'next_week') {
        matchesScope = evtDate >= getStartOfNextWeekISO() && evtDate <= getEndOfWeekISO(1);
      } else if (filterScope === 'upcoming') {
        matchesScope = evtDate >= todayISO;
      } else if (filterScope === 'custom') {
        if (startDate && endDate) {
          matchesScope = evtDate >= startDate && evtDate <= endDate;
        } else if (startDate) {
          matchesScope = evtDate >= startDate;
        } else if (endDate) {
          matchesScope = evtDate <= endDate;
        }
      }

      // B) Vyhľadávanie podľa textu
      const currentPhone = getPatientPhone(evt);
      const matchesSearch = 
        (evt.patientName && evt.patientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (evt.title && evt.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (currentPhone && currentPhone.includes(searchTerm));

      return matchesScope && matchesSearch;
    })
    .sort((a, b) => {
      // Chronologické zoradenie od najskoršieho po najneskorší termín
      const dateA = `${a.date} ${a.startTime}`;
      const dateB = `${b.date} ${b.startTime}`;
      return dateA.localeCompare(dateB);
    });

  const [reminderLogs, setReminderLogs] = useState<Record<string, 'pending' | 'sent' | 'confirmed'>>({});
  const [customMessageTemplate, setCustomMessageTemplate] = useState(
    "Dobrý deň {meno}, pripomíname Vám Váš termín zákroku ({zakrok}) na SAY CLINIC dňa {datum} o {cas}. Adresa: Lazovná 43, Banská Bystrica. Prosíme o potvrdenie odpoveďou na túto správu."
  );

  const formatMessage = (event: CalendarEvent) => {
    const formattedDate = event.date?.includes('-') 
      ? new Date(event.date).toLocaleDateString('sk-SK') 
      : event.date;

    return customMessageTemplate
      .replace('{meno}', event.patientName || 'vážený klient')
      .replace('{zakrok}', event.title || 'konzultácia/zákrok')
      .replace('{datum}', formattedDate || 'dnes')
      .replace('{cas}', event.startTime || '');
  };

  const handleSendWhatsApp = (event: CalendarEvent) => {
    const phone = getPatientPhone(event);
    if (!phone) {
      alert('Prosím, zadajte najprv telefónne číslo pacienta priamo v tabuľke.');
      return;
    }

    const cleanPhone = phone.replace(/[\s\+\-]/g, '');
    const phoneWithPrefix = cleanPhone.startsWith('421') || cleanPhone.startsWith('420') 
      ? cleanPhone 
      : `421${cleanPhone.replace(/^0/, '')}`;

    const text = encodeURIComponent(formatMessage(event));
    const waUrl = `https://wa.me/${phoneWithPrefix}?text=${text}`;

    window.open(waUrl, '_blank');
    setReminderLogs(prev => ({ ...prev, [event.id]: 'sent' }));
  };

  const handleSendSMS = (event: CalendarEvent) => {
    const phone = getPatientPhone(event);
    if (!phone) {
      alert('Prosím, zadajte najprv telefónne číslo pacienta.');
      return;
    }

    const text = encodeURIComponent(formatMessage(event));
    window.open(`sms:${phone}?body=${text}`, '_blank');
    setReminderLogs(prev => ({ ...prev, [event.id]: 'sent' }));
  };

  const handleToggleConfirm = (eventId: string) => {
    setReminderLogs(prev => ({
      ...prev,
      [eventId]: prev[eventId] === 'confirmed' ? 'sent' : 'confirmed'
    }));
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#E8E2D9] pb-4">
        <div>
          <h2 className="font-brand text-2xl font-bold text-[#2C2A29] uppercase">📲 SMS & WhatsApp Pripomienkovač</h2>
          <p className="text-[10px] uppercase tracking-widest text-[#8C857B]">Správa, filtrovanie a odosielanie notifikácií klientom</p>
        </div>

        {/* HLAVNÉ FILTRE ROZSAHU */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-[#FBF9F6] p-1 border border-[#E8E2D9] rounded-xl flex gap-1 text-xs font-bold uppercase flex-wrap">
            <button 
              onClick={() => setFilterScope('today')}
              className={`px-3 py-1.5 rounded-lg transition-all ${filterScope === 'today' ? 'bg-[#2C2A29] text-white' : 'text-[#8C857B]'}`}
            >
              Dnes
            </button>
            <button 
              onClick={() => setFilterScope('week')}
              className={`px-3 py-1.5 rounded-lg transition-all ${filterScope === 'week' ? 'bg-[#2C2A29] text-white' : 'text-[#8C857B]'}`}
            >
              Tento Týždeň
            </button>
            <button 
              onClick={() => setFilterScope('next_week')}
              className={`px-3 py-1.5 rounded-lg transition-all ${filterScope === 'next_week' ? 'bg-[#2C2A29] text-white' : 'text-[#8C857B]'}`}
            >
              Budúci Týždeň
            </button>
            <button 
              onClick={() => setFilterScope('upcoming')}
              className={`px-3 py-1.5 rounded-lg transition-all ${filterScope === 'upcoming' ? 'bg-[#2C2A29] text-white' : 'text-[#8C857B]'}`}
            >
              Všetky Nadchádzajúce
            </button>
            <button 
              onClick={() => setFilterScope('custom')}
              className={`px-3 py-1.5 rounded-lg transition-all ${filterScope === 'custom' ? 'bg-[#C5A059] text-white' : 'text-[#8C857B]'}`}
            >
              📅 Vlastný Rozsah
            </button>
            <button 
              onClick={() => setFilterScope('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${filterScope === 'all' ? 'bg-[#2C2A29] text-white' : 'text-[#8C857B]'}`}
            >
              Všetky ({events.length})
            </button>
          </div>
        </div>
      </div>

      {/* VLASTNÝ DÁTUMOVÝ FILTER (ZOBRAZÍ SA PRI VÝBERE VLASTNÉHO ROZSAHU) */}
      {filterScope === 'custom' && (
        <div className="bg-[#FBF9F6] border border-[#C5A059] p-4 rounded-xl flex flex-col md:flex-row items-center gap-4">
          <span className="text-xs font-bold uppercase text-[#2C2A29]">Vyberte obdobie od - do:</span>
          <div className="flex items-center gap-2 text-xs">
            <label className="text-[10px] uppercase font-bold text-[#8C857B]">Od:</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
              className="border border-[#E8E2D9] p-2 rounded-lg bg-white font-bold text-[#2C2A29]"
            />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <label className="text-[10px] uppercase font-bold text-[#8C857B]">Do:</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)} 
              className="border border-[#E8E2D9] p-2 rounded-lg bg-white font-bold text-[#2C2A29]"
            />
          </div>
          {(startDate || endDate) && (
            <button 
              onClick={() => { setStartDate(''); setEndDate(''); }}
              className="text-xs text-rose-600 underline font-bold uppercase ml-auto"
            >
              Vymazať filter
            </button>
          )}
        </div>
      )}

      {/* VYHĽADÁVANIE A ŠABLÓNA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Vyhľadať klienta / Zákrok</label>
          <input 
            type="text" 
            placeholder="Meno, telefón, zákrok..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="w-full border border-[#E8E2D9] p-2.5 rounded-xl text-xs bg-[#FBF9F6] outline-none focus:border-[#C5A059]"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Šablóna Pripomienkovej Správy</label>
          <textarea 
            rows={2} 
            value={customMessageTemplate} 
            onChange={e => setCustomMessageTemplate(e.target.value)}
            className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white focus:outline-none focus:border-[#C5A059]"
          />
        </div>
      </div>

      {/* TABUĽKA TERMÍNOV */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-brand text-sm font-bold text-[#2C2A29] uppercase">
            Termíny na pripomenutie ({filteredEvents.length})
          </h3>
          <span className="text-[10px] text-[#8C857B]">
            Zobrazené obdobie: <strong className="text-[#2C2A29]">
              {filterScope === 'today' ? 'Dnes' : 
               filterScope === 'week' ? 'Tento týždeň' : 
               filterScope === 'next_week' ? 'Budúci týždeň' : 
               filterScope === 'upcoming' ? 'Všetky od dneška dopredu' : 
               filterScope === 'custom' ? `Od ${startDate || 'začiatku'} do ${endDate || 'konca'}` : 'Kompletná história'}
            </strong>
          </span>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-[#8C857B] text-xs italic bg-[#FBF9F6] rounded-xl border border-[#E8E2D9]">
            Pre zvolený filter sa nenašli žiadne termíny. Prepnite na tlačidlo <strong>„Všetky Nadchádzajúce“</strong> pre zobrazenie budúcich termínov.
          </div>
        ) : (
          <div className="overflow-x-auto border border-[#E8E2D9] rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FBF9F6] border-b border-[#E8E2D9] text-[10px] uppercase text-[#8C857B] font-bold">
                  <th className="p-3">Dátum & Čas</th>
                  <th className="p-3">Klient</th>
                  <th className="p-3">Telefónne číslo (WhatsApp/SMS)</th>
                  <th className="p-3">Zákrok</th>
                  <th className="p-3">Stav</th>
                  <th className="p-3 text-right">Odoslať Notifikáciu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9]">
                {filteredEvents.map(evt => {
                  const status = reminderLogs[evt.id] || 'pending';
                  const currentPhone = getPatientPhone(evt);

                  return (
                    <tr key={evt.id} className="hover:bg-[#FBF9F6] transition-colors">
                      <td className="p-3 font-mono font-bold text-[#2C2A29]">
                        {evt.date} <span className="text-[#C5A059]">{evt.startTime}</span>
                      </td>
                      <td className="p-3 font-bold text-[#2C2A29]">{evt.patientName || evt.title || 'Klient'}</td>
                      
                      {/* ÚPRAVA A DOPÍSANIE TELEFÓNNEHO ČÍSLA PRIAMO V TABUĽKE */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <input 
                            type="text"
                            placeholder="+421 905 123 456"
                            value={currentPhone}
                            onChange={(e) => handlePhoneChange(evt.id, e.target.value)}
                            className={`w-36 border p-1.5 rounded-lg text-xs font-mono outline-none transition-all ${
                              currentPhone 
                                ? 'bg-white border-[#E8E2D9] text-[#2C2A29] focus:border-[#C5A059]' 
                                : 'bg-rose-50 border-rose-300 text-rose-700 font-bold placeholder-rose-300'
                            }`}
                          />
                          {!currentPhone && (
                            <span className="text-[9px] text-rose-600 font-bold uppercase">Dopíšte číslo</span>
                          )}
                        </div>
                      </td>

                      <td className="p-3 text-[#8C857B]">{evt.title}</td>
                      <td className="p-3">
                        {status === 'pending' && <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[9px] uppercase font-bold">🔴 Neodoslané</span>}
                        {status === 'sent' && <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded text-[9px] uppercase font-bold">🟡 Odoslané</span>}
                        {status === 'confirmed' && <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[9px] uppercase font-bold">🟢 Potvrdené</span>}
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button 
                          onClick={() => handleSendWhatsApp(evt)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors shadow-sm"
                        >
                          💬 WhatsApp
                        </button>
                        <button 
                          onClick={() => handleSendSMS(evt)}
                          className="bg-[#2C2A29] hover:bg-[#C5A059] text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors shadow-sm"
                        >
                          📲 SMS
                        </button>
                        <button 
                          onClick={() => handleToggleConfirm(evt.id)}
                          className="border border-[#E8E2D9] bg-white text-[#2C2A29] hover:bg-gray-100 px-2.5 py-1.5 rounded-lg text-[10px] font-bold"
                          title="Označiť ako potvrdené"
                        >
                          ✓
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}