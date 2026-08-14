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
  const [filterScope, setFilterScope] = useState<'today' | 'week' | 'all'>('week');
  const [searchTerm, setSearchTerm] = useState('');

  // Pomocné funkcie pre dátumy
  const todayISO = new Date().toISOString().split('T')[0];

  const getEndOfWeekISO = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() + (7 - (day === 0 ? 7 : day)); // Do konca aktuálneho týždňa (Nedeľa)
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  };

  const endOfWeekISO = getEndOfWeekISO();

  // Filtrovanie udalostí podľa výberu (Dnes / Tento Týždeň / Všetky) + Vyhľadávanie
  const filteredEvents = events.filter(evt => {
    const evtDate = evt.date ? evt.date.split('T')[0] : '';
    
    // Filtrovanie podľa času
    let matchesScope = true;
    if (filterScope === 'today') {
      matchesScope = evtDate === todayISO;
    } else if (filterScope === 'week') {
      matchesScope = evtDate >= todayISO && evtDate <= endOfWeekISO;
    }

    // Vyhľadávanie podľa textu
    const matchesSearch = 
      (evt.patientName && evt.patientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (evt.title && evt.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (evt.patientPhone && evt.patientPhone.includes(searchTerm));

    return matchesScope && matchesSearch;
  });

  const [reminderLogs, setReminderLogs] = useState<Record<string, 'pending' | 'sent' | 'confirmed'>>({});
  const [customMessageTemplate, setCustomMessageTemplate] = useState(
    "Dobrý deň {meno}, pripomíname Vám Váš termín zákroku ({zakrok}) na SAY CLINIC dňa {datum} o {cas}. Adresa: Lazovná 43, Banská Bystrica. Prosíme o potvrdenie odpoveďou na túto správu."
  );

  // Automatické vyhľadanie telefónu z Kartotéky ak chýba v udalosti
  const getPatientPhone = (evt: CalendarEvent) => {
    if (evt.patientPhone && evt.patientPhone.trim() !== '') return evt.patientPhone;
    
    // Vyhľadanie v kartotéke podľa mena
    if (evt.patientName && patients.length > 0) {
      const found = patients.find(p => p.name.toLowerCase().trim() === evt.patientName.toLowerCase().trim());
      if (found && found.phone) return found.phone;
    }
    return '';
  };

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
      alert('Pacient nemá priradené telefónne číslo ani v kalendári, ani v kartotéke.');
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
      alert('Pacient nemá priradené telefónne číslo.');
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
          <p className="text-[10px] uppercase tracking-widest text-[#8C857B]">Správa a odosielanie pripomienok pre klientov SAY CLINIC</p>
        </div>

        <div className="flex items-center gap-2">
          {/* PREPÍNAČ ROZSAHU: DNES / TENTO TÝŽDEŇ / VŠETKY */}
          <div className="bg-[#FBF9F6] p-1 border border-[#E8E2D9] rounded-xl flex gap-1 text-xs font-bold uppercase">
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
              onClick={() => setFilterScope('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${filterScope === 'all' ? 'bg-[#2C2A29] text-white' : 'text-[#8C857B]'}`}
            >
              Všetky termíny ({events.length})
            </button>
          </div>
        </div>
      </div>

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
            Zobrazený rozsah: <strong className="text-[#2C2A29]">{filterScope === 'today' ? 'Dnešný deň' : filterScope === 'week' ? 'Aktuálny týždeň' : 'Všetky záznamy'}</strong>
          </span>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-[#8C857B] text-xs italic bg-[#FBF9F6] rounded-xl border border-[#E8E2D9]">
            Pre zvolený filter sa nenašli žiadne termíny. Prepnite na tlačidlo <strong>„Všetky termíny“</strong> pre zobrazenie kompletnej histórie.
          </div>
        ) : (
          <div className="overflow-x-auto border border-[#E8E2D9] rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FBF9F6] border-b border-[#E8E2D9] text-[10px] uppercase text-[#8C857B] font-bold">
                  <th className="p-3">Dátum & Čas</th>
                  <th className="p-3">Klient</th>
                  <th className="p-3">Telefón</th>
                  <th className="p-3">Zákrok</th>
                  <th className="p-3">Stav Pripomienky</th>
                  <th className="p-3 text-right">Odoslať Notifikáciu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9]">
                {filteredEvents.map(evt => {
                  const status = reminderLogs[evt.id] || 'pending';
                  const phone = getPatientPhone(evt);

                  return (
                    <tr key={evt.id} className="hover:bg-[#FBF9F6] transition-colors">
                      <td className="p-3 font-mono font-bold text-[#2C2A29]">
                        {evt.date} <span className="text-[#C5A059]">{evt.startTime}</span>
                      </td>
                      <td className="p-3 font-bold text-[#2C2A29]">{evt.patientName || evt.title || 'Klient'}</td>
                      <td className="p-3 font-mono text-[#8C857B]">
                        {phone ? phone : <span className="text-rose-500 italic">Chýba číslo</span>}
                      </td>
                      <td className="p-3 text-[#8C857B]">{evt.title}</td>
                      <td className="p-3">
                        {status === 'pending' && <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[9px] uppercase font-bold">🔴 Neodoslané</span>}
                        {status === 'sent' && <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded text-[9px] uppercase font-bold">🟡 Odoslané</span>}
                        {status === 'confirmed' && <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[9px] uppercase font-bold">🟢 Potvrdené klientom</span>}
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button 
                          onClick={() => handleSendWhatsApp(evt)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors"
                        >
                          💬 WhatsApp
                        </button>
                        <button 
                          onClick={() => handleSendSMS(evt)}
                          className="bg-[#2C2A29] hover:bg-[#C5A059] text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors"
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