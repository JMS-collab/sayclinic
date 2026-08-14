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
}

export default function RemindersManager({ events = [] }: RemindersManagerProps) {
  // Pomocná funkcia na prevod akéhokoľvek dátumu do porovnateľného tvaru YYYY-MM-DD
  const parseDateToISO = (dateStr: string) => {
    if (!dateStr) return '';
    if (dateStr.includes('-')) return dateStr.split('T')[0]; // Už je vo formáte YYYY-MM-DD
    
    // Ak je vo formáte DD.MM.YYYY
    if (dateStr.includes('.')) {
      const parts = dateStr.split('.').map(p => p.trim());
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
    }
    return dateStr;
  };

  const todayISO = new Date().toISOString().split('T')[0];

  // Odfiltrovanie nadchádzajúcich aj dnešných udalostí
  const upcomingEvents = events.filter(e => {
    const eventISO = parseDateToISO(e.date);
    return eventISO >= todayISO || !e.date; // Zobrazí dnešné, budúce aj udalosti bez presného ISO formátu
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
    const phone = event.patientPhone;
    if (!phone) {
      alert('Pacient nemá v kalendári zadané telefónne číslo. Zadajte telefón do karty alebo poznámky termínu.');
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
    const phone = event.patientPhone;
    if (!phone) {
      alert('Pacient nemá v kalendári zadané telefónne číslo.');
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
          <p className="text-[10px] uppercase tracking-widest text-[#8C857B]">Automatické notifikácie termínov pre klientov SAY CLINIC</p>
        </div>

        <div className="flex gap-2">
          <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
            🟢 WhatsApp Click-to-Chat Ready
          </span>
        </div>
      </div>

      {/* ŠABLÓNA SPRÁVY */}
      <div className="bg-[#FBF9F6] border border-[#E8E2D9] p-4 rounded-xl space-y-2">
        <label className="block text-[10px] uppercase text-[#8C857B] font-bold">Šablóna Pripomienkovej Správy</label>
        <textarea 
          rows={2} 
          value={customMessageTemplate} 
          onChange={e => setCustomMessageTemplate(e.target.value)}
          className="w-full border border-[#E8E2D9] p-2.5 rounded-lg text-xs bg-white focus:outline-none focus:border-[#C5A059]"
        />
        <p className="text-[9px] text-[#8C857B]">
          Dostupné značky: <code className="text-[#C5A059]">{'{meno}'}</code>, <code className="text-[#C5A059]">{'{zakrok}'}</code>, <code className="text-[#C5A059]">{'{datum}'}</code>, <code className="text-[#C5A059]">{'{cas}'}</code>
        </p>
      </div>

      {/* ZOZNAM TERMÍNOV */}
      <div className="space-y-3">
        <h3 className="font-brand text-sm font-bold text-[#2C2A29] uppercase">
          Nadchádzajúce a dnešné termíny na pripomenutie ({upcomingEvents.length})
        </h3>

        {upcomingEvents.length === 0 ? (
          <div className="text-center py-10 text-[#8C857B] text-xs italic bg-[#FBF9F6] rounded-xl border border-[#E8E2D9]">
            V kalendári zatiaľ nie sú žiadne nadchádzajúce termíny.
          </div>
        ) : (
          <div className="overflow-x-auto border border-[#E8E2D9] rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FBF9F6] border-b border-[#E8E2D9] text-[10px] uppercase text-[#8C857B] font-bold">
                  <th className="p-3">Dátum & Čas</th>
                  <th className="p-3">Klient / Udalosť</th>
                  <th className="p-3">Telefón</th>
                  <th className="p-3">Zákrok</th>
                  <th className="p-3">Stav Pripomienky</th>
                  <th className="p-3 text-right">Odoslať Notifikáciu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9]">
                {upcomingEvents.map(evt => {
                  const status = reminderLogs[evt.id] || 'pending';

                  return (
                    <tr key={evt.id} className="hover:bg-[#FBF9F6] transition-colors">
                      <td className="p-3 font-mono font-bold text-[#2C2A29]">
                        {evt.date} <span className="text-[#C5A059]">{evt.startTime}</span>
                      </td>
                      <td className="p-3 font-bold text-[#2C2A29]">{evt.patientName || evt.title || 'Klient'}</td>
                      <td className="p-3 font-mono text-[#8C857B]">{evt.patientPhone || '---'}</td>
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