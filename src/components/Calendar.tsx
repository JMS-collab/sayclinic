'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

import { 
  EventType, 
  FreeformCategory, 
  ClinicRoom, 
  CLINIC_ROOMS, 
  getRoomInfo, 
  CLINIC_STAFF, 
  SURGERY_EQUIPMENT_OPTIONS, 
  SURGERY_MATERIAL_OPTIONS, 
  FREEFORM_PRESETS, 
  generateDefaultEvents,
  ClinicStayType,
  AnesthesiaType,
  ANESTHESIA_OPTIONS,
  CLINIC_STAY_OPTIONS,
  getAnesthesiaInfo,
  getClinicStayInfo
} from '../data/calendarConfig';

import EventFormModal from './calendar/EventFormModal';
import EventDetailModal from './calendar/EventDetailModal';

export type { EventType, FreeformCategory, ClinicRoom, ClinicStayType, AnesthesiaType };
export { 
  CLINIC_ROOMS, 
  getRoomInfo, 
  CLINIC_STAFF, 
  SURGERY_EQUIPMENT_OPTIONS, 
  SURGERY_MATERIAL_OPTIONS, 
  FREEFORM_PRESETS, 
  generateDefaultEvents,
  ANESTHESIA_OPTIONS,
  CLINIC_STAY_OPTIONS,
  getAnesthesiaInfo,
  getClinicStayInfo
};

export interface PositionedCalendarEvent {
  event: CalendarEvent;
  colIndex: number;
  totalCols: number;
  startMin: number;
  endMin: number;
}

export interface CalendarEvent {
  id: string;
  calendarId?: string;
  calendarName?: string;
  roomId?: string; // 'ambulancia' | 'sala_say' | 'sala_rudlova' | 'dospavacia_izba'
  roomName?: string;
  assignedTo?: string; // Komu je pridelená udalosť (napr. MUDr. Mráz, Celý tím)
  patientId?: string;
  patientName: string;
  patientPhone?: string;
  patientEmail?: string;
  doctorName: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  isAllDay?: boolean;
  type: EventType;
  anesthesiaType?: string; // TIVA, LA, Sedácia, Celková...
  clinicStay?: ClinicStayType | string; // 'ambulantne' | 'dospanie' | 'hospitalizacia'
  notes?: string;

  // VOĽNÝ POPIS / INTERNÁ UDALOSŤ (nie operácia ani kontrola: obed, dovolenka, teambuilding...)
  freeformCategory?: FreeformCategory;

  // OPERAČNÝ DEŇ & TÍM (kto operuje, anesteziológ, anest. sestra, inštrumentárka)
  operator?: string;
  anesthesiologist?: string;
  anesthesiaNurse?: string;
  scrubNurse?: string;
  specialEquipment?: string[]; // špeciálne vybavenie (MicroAire, VASER, C-rameno...)
  specialEquipmentOther?: string;
  materials?: string[]; // potrebný materiál (implantáty Motiva, Polytech, prádlo...)
  materialNotes?: string; // špecifikácia implantátov, profil, veľkosti
  
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
  const [selectedRoomId, setSelectedRoomId] = useState<string>('all');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('all');
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

  // E-mailový panel
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
    roomId: 'sala_say',
    assignedTo: 'MUDr. Ján Mráz',
    patientName: '', 
    patientPhone: '',
    patientEmail: '',
    doctorName: 'MUDr. Ján Mráz', 
    title: '', 
    date: new Date().toISOString().split('T')[0], 
    startTime: '09:00', 
    endTime: '10:00', 
    isAllDay: false,
    type: 'operacia',
    freeformCategory: 'obed',
    operator: 'MUDr. Ján Mráz',
    anesthesiologist: 'MUDr. Peter Kováč',
    anesthesiaNurse: 'Bc. Jana Malá',
    scrubNurse: 'Sabina Lenhartová',
    specialEquipment: ['⚡ Liposukcia MicroAire (PAL)'],
    specialEquipmentOther: '',
    materials: ['🍈 Silikónové implantáty Motiva', '👙 Kompresívne prádlo Lipoelastic'],
    materialNotes: '',
    calendarId: 'primary',
    totalPrice: 3500,
    depositAmount: 500,
    isDepositPaid: false
  });

  // ZOOM ROZOSTUPU HODÍN (VÝŠKA JEDNEJ HODINY V PIXELOCH)
  const [hourHeight, setHourHeight] = useState<number>(85);
  // PREPÍNAČ MEDZI INTERAKTÍVNOU ČASOVOU OSOU TÝŽDŇA A KARTAMI
  const [weekViewMode, setWeekViewMode] = useState<'grid' | 'cards'>('grid');

  // TAHANIE MYŠOU PRE VYTVORENIE UDALOSTI (DRAG-TO-CREATE)
  const [isCreatingDrag, setIsCreatingDrag] = useState(false);
  const [createDragDate, setCreateDragDate] = useState('');
  const [dragStartMin, setDragStartMin] = useState(0);
  const [dragCurrentMin, setDragCurrentMin] = useState(0);

  // REF PRE ZACHYTÁVANIE CTRL + KOLIESKO MYŠI (ZOOM)
  const gridContainerRef = useRef<HTMLDivElement>(null);

  const detectEventType = (title: string = ''): EventType => {
    const t = title.toLowerCase();
    if (t.includes('obed') || t.includes('dovolenk') || t.includes('teambuild') || t.includes('skolen') || t.includes('sanitarn')) return 'volno';
    if (t.includes('konzultac') || t.includes('vysetren')) return 'konzultacia';
    if (t.includes('osetren') || t.includes('botox') || t.includes('kyselina') || t.includes('aplikac')) return 'osetrenie';
    if (t.includes('kontrol') || t.includes('stehy') || t.includes('prevaz') || t.includes('observac')) return 'kontrola';
    return 'operacia';
  };

  const handleTypeChangeInForm = (type: EventType, isEdit = false) => {
    let price = 0;
    let deposit = 0;

    if (type === 'operacia') { price = 3500; deposit = 500; }
    else if (type === 'konzultacia') { price = 50; deposit = 0; }
    else if (type === 'osetrenie') { price = 200; deposit = 50; }
    else if (type === 'kontrola') { price = 0; deposit = 0; }
    else if (type === 'volno') { price = 0; deposit = 0; }

    const targetRoomId = type === 'operacia' ? 'sala_say' : 'ambulancia';

    if (isEdit) {
      setEditingEventData(prev => ({ 
        ...prev, 
        type, 
        totalPrice: price, 
        depositAmount: deposit,
        roomId: prev.roomId || targetRoomId
      }));
    } else {
      setNewEvent(prev => ({ 
        ...prev, 
        type, 
        totalPrice: price, 
        depositAmount: deposit,
        roomId: prev.roomId || targetRoomId,
        patientName: type === 'volno' && !prev.patientName ? 'Personál kliniky' : prev.patientName
      }));
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
            roomId: e.roomId || (e.type === 'operacia' ? 'sala_say' : 'ambulancia'),
            type: e.type || detectEventType(e.title)
          }));
          setCalendarEvents(formatted);
        } else {
          const defEvents = generateDefaultEvents();
          setCalendarEvents(defEvents);
          localStorage.setItem('say_clinic_calendar_events', JSON.stringify(defEvents));
        }
      } catch (e) {
        console.error('Chyba načítania:', e);
      }
    } else {
      const defEvents = generateDefaultEvents();
      setCalendarEvents(defEvents);
      localStorage.setItem('say_clinic_calendar_events', JSON.stringify(defEvents));
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
              depositAmount: evt.depositAmount !== undefined ? evt.depositAmount : (detectEventType(evt.title) === 'operacia' ? 500 : 0),
              isAllDay: evt.isAllDay || (evt.startTime === '00:00' && evt.endTime === '23:59')
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

  // NAČÍTANIE ULOŽENÉHO ROZOSTUPU HODÍN Z LOCALSTORAGE
  useEffect(() => {
    try {
      const saved = localStorage.getItem('say_clinic_calendar_hour_height');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 45 && val <= 240) {
          setHourHeight(val);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // OBSLUHA CTRL + KOLIESKO MYŠI PRE PLYNULÝ ZOOM ROZOSTUPU HODÍN
  useEffect(() => {
    const container = gridContainerRef.current;
    if (!container) return;

    const handleNativeWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault(); // Zamedzí predvolenému zoomu celej webstránky
        const delta = e.deltaY < 0 ? 12 : -12; // Scroll hore = zväčšiť, scroll dole = zmenšiť
        setHourHeight(prev => {
          const next = Math.min(220, Math.max(45, prev + delta));
          try {
            localStorage.setItem('say_clinic_calendar_hour_height', next.toString());
          } catch {
            // ignore
          }
          return next;
        });
      }
    };

    container.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleNativeWheel);
    };
  }, [view, weekViewMode]);

  // INTELIGENTNÝ VÝPOČET ROZLOŽENIA PREKRÝVAJÚCICH SA UDALOSTÍ DO STĹPCOV
  const computeEventLayout = (events: CalendarEvent[]): PositionedCalendarEvent[] => {
    if (events.length === 0) return [];

    // Zoradenie podľa času začiatku vzostupne, potom podľa dĺžky trvania zostupne
    const sorted = [...events].sort((a, b) => {
      const aStart = timeToMinutes(a.startTime);
      const bStart = timeToMinutes(b.startTime);
      if (aStart !== bStart) return aStart - bStart;
      return (timeToMinutes(b.endTime) - bStart) - (timeToMinutes(a.endTime) - aStart);
    });

    // Zoskupenie do zhlukov prekrývajúcich sa udalostí
    const clusters: CalendarEvent[][] = [];
    let currentCluster: CalendarEvent[] = [];
    let clusterEnd = -1;

    for (const evt of sorted) {
      const start = timeToMinutes(evt.startTime);
      const end = Math.max(start + 15, timeToMinutes(evt.endTime));

      if (currentCluster.length === 0) {
        currentCluster.push(evt);
        clusterEnd = end;
      } else if (start < clusterEnd) {
        currentCluster.push(evt);
        clusterEnd = Math.max(clusterEnd, end);
      } else {
        clusters.push(currentCluster);
        currentCluster = [evt];
        clusterEnd = end;
      }
    }
    if (currentCluster.length > 0) {
      clusters.push(currentCluster);
    }

    const result: PositionedCalendarEvent[] = [];

    for (const cluster of clusters) {
      const columns: number[] = [];
      const clusterItems: { event: CalendarEvent; colIndex: number; startMin: number; endMin: number }[] = [];

      for (const evt of cluster) {
        const start = timeToMinutes(evt.startTime);
        const end = Math.max(start + 15, timeToMinutes(evt.endTime));

        let placedCol = -1;
        for (let c = 0; c < columns.length; c++) {
          if (columns[c] <= start) {
            columns[c] = end;
            placedCol = c;
            break;
          }
        }

        if (placedCol === -1) {
          columns.push(end);
          placedCol = columns.length - 1;
        }

        clusterItems.push({
          event: evt,
          colIndex: placedCol,
          startMin: start,
          endMin: end
        });
      }

      const totalCols = Math.max(1, columns.length);
      for (const item of clusterItems) {
        result.push({
          ...item,
          totalCols
        });
      }
    }

    return result;
  };

  const filteredEvents = calendarEvents.filter(e => {
    // Filter podľa miestnosti / kalendára
    const eventRoom = e.roomId || (e.type === 'operacia' ? 'sala_say' : 'ambulancia');
    const matchesRoom = selectedRoomId === 'all' || eventRoom === selectedRoomId || e.calendarId === selectedRoomId;
    
    // Filter podľa typu návštevy
    const matchesType = selectedTypeFilter === 'all' || e.type === selectedTypeFilter;

    // Filter podľa pridelenej osoby / personálu
    const staffLower = selectedStaffFilter.toLowerCase();
    const matchesStaff = selectedStaffFilter === 'all' || 
      (e.assignedTo && e.assignedTo.toLowerCase().includes(staffLower)) ||
      (e.doctorName && e.doctorName.toLowerCase().includes(staffLower)) ||
      (e.operator && e.operator.toLowerCase().includes(staffLower)) ||
      (e.anesthesiologist && e.anesthesiologist.toLowerCase().includes(staffLower)) ||
      (e.anesthesiaNurse && e.anesthesiaNurse.toLowerCase().includes(staffLower)) ||
      (e.scrubNurse && e.scrubNurse.toLowerCase().includes(staffLower));

    return matchesRoom && matchesType && matchesStaff;
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

  const handleSaveModalEditedEvent = (eventData: Partial<CalendarEvent>) => {
    if (!eventData.id) return;

    const finalStartTime = eventData.isAllDay ? '00:00' : (eventData.startTime || '09:00');
    const finalEndTime = eventData.isAllDay ? '23:59' : (eventData.endTime || '10:00');

    const updatedEvent = {
      ...eventData,
      startTime: finalStartTime,
      endTime: finalEndTime
    } as CalendarEvent;

    setCalendarEvents(prev => {
      const updated = prev.map(evt => evt.id === eventData.id ? updatedEvent : evt);
      localStorage.setItem('say_clinic_calendar_events', JSON.stringify(updated));
      return updated;
    });

    if (selectedEvent && selectedEvent.id === eventData.id) {
      setSelectedEvent(updatedEvent);
    }

    setIsEditingEvent(false);
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
    const msg = `Dobrý deň ${evt.patientName || ''}, pripomíname Vám Váš termín (${evt.title}) na SAY CLINIC dňa ${formattedDate}${evt.isAllDay ? '' : ` o ${evt.startTime}`}. Adresa: Lazovná 43, Banská Bystrica. Prosíme o potvrdenie.`;

    window.open(`https://wa.me/${phoneWithPrefix}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const sendSMS = (evt: CalendarEvent) => {
    const phone = getEventPhone(evt);
    if (!phone) {
      alert('Prosím, zadajte najprv telefónne číslo pacienta.');
      return;
    }
    const formattedDate = new Date(evt.date).toLocaleDateString('sk-SK');
    const msg = `Dobrý deň ${evt.patientName || ''}, pripomíname Vám termín (${evt.title}) na SAY CLINIC dňa ${formattedDate}${evt.isAllDay ? '' : ` o ${evt.startTime}`}.`;

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
        `Vážená/ý ${evt.patientName || 'klient'},\n\nv prílohe Vám zasielame podklady k Vášmu termínu (${formattedDate}${evt.isAllDay ? '' : ` o ${evt.startTime}`}).\n\nTyp: ${getEventTypeLabel(evt.type)}\nCena: ${price} €\nZáloha: ${deposit} €\n\nTešíme sa na Vašu návštevu.\n\nS pozdravom,\nTím SAY CLINIC\nLazovná 43, Banská Bystrica`
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

  const getEventTypeBadge = (type: EventType, freeformCategory?: FreeformCategory) => {
    switch (type) {
      case 'operacia': 
        return <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded text-white bg-[#2C2A29]">🔪 Operácia</span>;
      case 'konzultacia': 
        return <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded text-amber-900 bg-amber-100 border border-amber-300">🩺 Konzultácia</span>;
      case 'osetrenie': 
        return <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded text-emerald-900 bg-emerald-100 border border-emerald-300">💉 Ošetrenie</span>;
      case 'kontrola': 
        return <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded text-blue-900 bg-blue-100 border border-blue-300">🔍 Kontrola</span>;
      case 'volno': {
        const cat = freeformCategory || 'ine';
        const label = cat === 'obed' ? '🍽️ Obed'
          : cat === 'dovolenka' ? '🌴 Dovolenka'
          : cat === 'teambuilding' ? '🎉 Teambuilding'
          : cat === 'skolenie' ? '🎓 Školenie'
          : cat === 'sanitarny_den' ? '🧼 Sanitárny deň'
          : '📌 Voľný popis / Interné';
        return <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded text-indigo-900 bg-indigo-100 border border-indigo-300">{label}</span>;
      }
      default: 
        return <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded text-gray-800 bg-gray-100">Termín</span>;
    }
  };

  const getEventTypeLabel = (type: EventType, freeformCategory?: FreeformCategory) => {
    switch (type) {
      case 'operacia': return 'Operácia';
      case 'konzultacia': return 'Konzultácia';
      case 'osetrenie': return 'Ošetrenie';
      case 'kontrola': return 'Kontrola';
      case 'volno': {
        if (freeformCategory === 'obed') return 'Obed';
        if (freeformCategory === 'dovolenka') return 'Dovolenka';
        if (freeformCategory === 'teambuilding') return 'Teambuilding';
        if (freeformCategory === 'skolenie') return 'Školenie';
        if (freeformCategory === 'sanitarny_den') return 'Sanitárny deň';
        return 'Voľný popis / Interné';
      }
      default: return 'Termín';
    }
  };

  // POMOCNÉ VÝPOČTY PRE ČASOVÚ OS A KOLÍZIE
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

  const handleOpenAddEventModal = () => {
    const defaultRoom = selectedRoomId !== 'all' ? selectedRoomId : 'sala_say';
    const defaultType: EventType = defaultRoom === 'ambulancia' ? 'konzultacia' 
      : defaultRoom === 'dospavacia_izba' ? 'kontrola' 
      : 'operacia';
    const defaultStaff = selectedStaffFilter !== 'all' ? selectedStaffFilter : 'MUDr. Ján Mráz';

    setNewEvent({
      roomId: defaultRoom,
      assignedTo: defaultStaff,
      doctorName: defaultStaff,
      operator: defaultStaff,
      date: currentDate.toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00',
      isAllDay: false,
      title: '',
      patientName: '',
      type: defaultType,
      freeformCategory: 'obed',
      totalPrice: defaultType === 'operacia' ? 3500 : (defaultType === 'konzultacia' ? 50 : 0),
      depositAmount: defaultType === 'operacia' ? 500 : 0,
      isDepositPaid: false,
      specialEquipment: ['⚡ Liposukcia MicroAire (PAL)'],
      materials: ['🍈 Silikónové implantáty Motiva', '👙 Kompresívne prádlo Lipoelastic']
    });
    setIsAddingEvent(true);
  };

  const handleSaveModalCreatedEvent = async (eventData: Partial<CalendarEvent>) => {
    setIsSaving(true);
    const finalStartTime = eventData.isAllDay ? '00:00' : (eventData.startTime || '09:00');
    const finalEndTime = eventData.isAllDay ? '23:59' : (eventData.endTime || '10:00');

    const created: CalendarEvent = {
      id: `evt-${Date.now()}`,
      patientName: eventData.patientName || (eventData.type === 'volno' ? 'Personál kliniky' : 'Bez mena'),
      patientPhone: eventData.patientPhone || '',
      patientEmail: eventData.patientEmail || '',
      doctorName: eventData.doctorName || eventData.assignedTo || 'MUDr. Ján Mráz',
      assignedTo: eventData.assignedTo || eventData.doctorName || 'MUDr. Ján Mráz',
      roomId: eventData.roomId || (eventData.type === 'operacia' ? 'sala_say' : 'ambulancia'),
      title: eventData.title || (eventData.type === 'volno' ? 'Interná udalosť' : 'Nový termín'),
      date: eventData.date || currentDate.toISOString().split('T')[0],
      startTime: finalStartTime,
      endTime: finalEndTime,
      isAllDay: eventData.isAllDay || false,
      type: eventData.type || 'operacia',
      freeformCategory: eventData.freeformCategory,
      operator: eventData.operator || eventData.doctorName || 'MUDr. Ján Mráz',
      anesthesiologist: eventData.anesthesiologist || 'MUDr. Peter Kováč',
      anesthesiaNurse: eventData.anesthesiaNurse || 'Bc. Jana Malá',
      scrubNurse: eventData.scrubNurse || 'Sabina Lenhartová',
      specialEquipment: eventData.specialEquipment || [],
      specialEquipmentOther: eventData.specialEquipmentOther || '',
      materials: eventData.materials || [],
      materialNotes: eventData.materialNotes || '',
      calendarId: eventData.calendarId || 'primary',
      notes: eventData.notes || '',
      totalPrice: Number(eventData.totalPrice) || 0,
      depositAmount: Number(eventData.depositAmount) || 0,
      isDepositPaid: eventData.isDepositPaid || false
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
          body: JSON.stringify(created)
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

  // NAŤAHOVANIE MYŠOU (RESIZE OKRAJA PRE TRVANIE UDALOSTI)
  const handleMouseDownResize = (e: React.MouseEvent, evt: CalendarEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const startY = e.clientY;
    const startEndMin = timeToMinutes(evt.endTime);
    const pxPerMin = hourHeight / 60;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const snapInterval = hourHeight >= 140 ? 5 : 15;
      const deltaMinutes = Math.round((deltaY / pxPerMin) / snapInterval) * snapInterval;
      const newEndMin = Math.max(timeToMinutes(evt.startTime) + snapInterval, startEndMin + deltaMinutes);
      const newEndTimeStr = minutesToTimeStr(newEndMin);

      setCalendarEvents(prev => {
        const updated = prev.map(item => item.id === evt.id ? { ...item, endTime: newEndTimeStr } : item);
        return updated;
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      setCalendarEvents(prev => {
        localStorage.setItem('say_clinic_calendar_events', JSON.stringify(prev));
        return prev;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // PRESÚVANIE MYŠOU (DRAG & DROP PRE ZMENU ČASU UDALOSTI)
  const handleMouseDownDrag = (e: React.MouseEvent, evt: CalendarEvent) => {
    const target = e.target as HTMLElement;
    
    // Ignoruj kliknutie, ak sa kliká na resize úchop, tlačidlá atď.
    if (target.tagName.toLowerCase() === 'button' || target.tagName.toLowerCase() === 'input' || target.closest('.resize-handle')) {
      return;
    }

    e.preventDefault(); 
    e.stopPropagation();

    let dragged = false;
    const startY = e.clientY;
    const originalStartMin = timeToMinutes(evt.startTime);
    const durationMin = timeToMinutes(evt.endTime) - timeToMinutes(evt.startTime);
    const pxPerMin = hourHeight / 60;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      
      if (Math.abs(deltaY) > 5) dragged = true;

      if (dragged) {
        const snapInterval = hourHeight >= 140 ? 5 : 15;
        const deltaMinutes = Math.round((deltaY / pxPerMin) / snapInterval) * snapInterval;
        let newStartMin = originalStartMin + deltaMinutes;
        
        if (newStartMin < 7 * 60) newStartMin = 7 * 60; // minimum na osi 07:00
        if (newStartMin + durationMin > 21 * 60) newStartMin = 21 * 60 - durationMin; // max 21:00
        
        const newEndMin = newStartMin + durationMin;

        setCalendarEvents(prev => prev.map(item => 
          item.id === evt.id ? { ...item, startTime: minutesToTimeStr(newStartMin), endTime: minutesToTimeStr(newEndMin) } : item
        ));
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      
      if (!dragged) {
        setSelectedEvent(evt);
      } else {
        setCalendarEvents(prev => {
          localStorage.setItem('say_clinic_calendar_events', JSON.stringify(prev));
          return prev;
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // ŤAHANIE MYŠOU PO ČASOVEJ OSI PRE VYTVORENIE NOVEJ UDALOSTI ĽUBOVOĽNEJ DĹŽKY (GOOGLE KALENDÁR ŠTÝL)
  const handleMouseDownCreate = (e: React.MouseEvent, targetDate: string) => {
    if (e.button !== 0) return; // Len hlavné ľavé tlačidlo myši
    const target = e.target as HTMLElement;
    if (
      target.closest('[data-event-id]') || 
      target.closest('button') || 
      target.closest('input') || 
      target.closest('select') || 
      target.closest('.resize-handle')
    ) {
      return;
    }

    e.preventDefault();
    const columnEl = e.currentTarget as HTMLElement;
    const rect = columnEl.getBoundingClientRect();
    const startY = e.clientY - rect.top;

    const pxPerMin = hourHeight / 60;
    const dayStartMin = 7 * 60; // 07:00
    const dayEndMin = 21 * 60; // 21:00

    const rawMin = dayStartMin + Math.floor(startY / pxPerMin);
    const snapInterval = hourHeight >= 140 ? 5 : 15;
    const startMin = Math.max(dayStartMin, Math.min(dayEndMin - snapInterval, Math.floor(rawMin / snapInterval) * snapInterval));
    const initialEndMin = Math.min(dayEndMin, startMin + 30);

    let hasMoved = false;
    let currentEnd = initialEndMin;

    setIsCreatingDrag(true);
    setCreateDragDate(targetDate);
    setDragStartMin(startMin);
    setDragCurrentMin(initialEndMin);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const currentY = moveEvent.clientY - rect.top;
      const deltaY = moveEvent.clientY - e.clientY;
      if (Math.abs(deltaY) > 6) {
        hasMoved = true;
      }

      const curRawMin = dayStartMin + Math.floor(currentY / pxPerMin);
      const snappedCurMin = Math.max(dayStartMin, Math.min(dayEndMin, Math.round(curRawMin / snapInterval) * snapInterval));
      currentEnd = snappedCurMin;
      setDragCurrentMin(snappedCurMin);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      setIsCreatingDrag(false);

      let finalStart = startMin;
      let finalEnd = currentEnd;

      if (!hasMoved) {
        // Jednoduché kliknutie bez ťahania - predvolená dĺžka 30 minút
        finalStart = startMin;
        finalEnd = Math.min(dayEndMin, startMin + 30);
      } else {
        if (finalStart > finalEnd) {
          const tmp = finalStart;
          finalStart = finalEnd;
          finalEnd = tmp;
        }
        if (finalEnd - finalStart < 15) {
          finalEnd = finalStart + 15;
        }
      }

      const startTimeStr = minutesToTimeStr(finalStart);
      const endTimeStr = minutesToTimeStr(finalEnd);

      const defaultRoom = selectedRoomId !== 'all' ? selectedRoomId : 'sala_say';
      const defaultType: EventType = defaultRoom === 'ambulancia' ? 'konzultacia' 
        : defaultRoom === 'dospavacia_izba' ? 'kontrola' 
        : 'operacia';
      const defaultStaff = selectedStaffFilter !== 'all' ? selectedStaffFilter : 'MUDr. Ján Mráz';

      setNewEvent(prev => ({
        ...prev,
        roomId: defaultRoom,
        assignedTo: defaultStaff,
        doctorName: defaultStaff,
        operator: defaultStaff,
        date: targetDate,
        startTime: startTimeStr,
        endTime: endTimeStr,
        isAllDay: false,
        title: '',
        patientName: '',
        type: defaultType,
        totalPrice: defaultType === 'operacia' ? 3500 : (defaultType === 'konzultacia' ? 50 : 0),
        depositAmount: defaultType === 'operacia' ? 500 : 0,
        isDepositPaid: false
      }));
      setIsAddingEvent(true);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // VYKRESLENIE KARTY UDALOSTI S ADAPTÍVNYM ZOBRAZENÍM PODROBNOSTÍ PODĽA ZOOMU
  const renderEventCard = (
    evt: CalendarEvent, 
    top: number, 
    height: number, 
    left: string, 
    width: string
  ) => {
    const isCompact = height < 46;
    const isMedium = height >= 46 && height < 85;
    const durationMin = timeToMinutes(evt.endTime) - timeToMinutes(evt.startTime);
    const room = getRoomInfo(evt.roomId);

    return (
      <div 
        key={evt.id} 
        data-event-id={evt.id}
        onMouseDown={(e) => handleMouseDownDrag(e, evt)}
        className={`absolute rounded-xl p-2 shadow-xs border pointer-events-auto cursor-move active:cursor-grabbing transition-all hover:shadow-md flex flex-col justify-between z-10 overflow-hidden group/card ${
          evt.isCancelled 
            ? 'bg-gray-100 border-gray-300 opacity-60 line-through' 
            : evt.type === 'operacia'
            ? 'bg-white border-[#2C2A29] border-l-4 border-l-[#2C2A29]'
            : evt.type === 'konzultacia'
            ? 'bg-[#FBF9F6] border-[#C5A059] border-l-4 border-l-[#C5A059]'
            : evt.type === 'osetrenie'
            ? 'bg-emerald-50/90 border-emerald-500 border-l-4 border-l-emerald-600'
            : evt.type === 'volno'
            ? 'bg-indigo-50/90 border-indigo-500 border-l-4 border-l-indigo-600'
            : 'bg-blue-50/90 border-blue-400 border-l-4 border-l-blue-500'
        }`}
        style={{ 
          top: `${top}px`, 
          height: `${height}px`,
          left,
          width,
        }}
      >
        {isCompact ? (
          <div className="flex items-center gap-1.5 h-full truncate pointer-events-none">
            <span className="font-mono text-[9px] font-bold text-[#2C2A29] shrink-0 leading-none">
              {evt.startTime}
            </span>
            <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-black/5 shrink-0" title={room.name}>
              {room.icon}
            </span>
            <span className="text-[10px] font-bold text-[#2C2A29] truncate leading-none">
              {evt.type === 'volno' ? evt.title : (evt.patientName || evt.title)}
            </span>
          </div>
        ) : isMedium ? (
          <div className="flex-1 overflow-hidden pointer-events-none flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="font-mono text-[10px] font-bold text-[#2C2A29] bg-black/5 px-1 rounded flex items-center gap-1">
                  <span>{room.icon}</span> {evt.startTime} - {evt.endTime}
                </span>
                <div className="scale-90 origin-right">{getEventTypeBadge(evt.type, evt.freeformCategory)}</div>
              </div>
              <h4 className="font-bold text-xs text-[#2C2A29] truncate leading-tight">{evt.title}</h4>
              {evt.type === 'volno' ? (
                <p className="text-[10px] text-indigo-700 truncate font-semibold">👤 {evt.assignedTo || 'Celý tím'}</p>
              ) : evt.type === 'operacia' ? (
                <div className="space-y-0.5">
                  <p className="text-[10px] text-[#8C857B] truncate font-medium">
                    👤 {evt.patientName || 'Bez mena'} • 🔪 {evt.operator || evt.doctorName}
                  </p>
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-900 border border-purple-200">
                      💉 {evt.anesthesiaType || 'TIVA'}
                    </span>
                    {evt.clinicStay && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-200">
                        {getClinicStayInfo(evt.clinicStay)?.icon || '🏥'} {getClinicStayInfo(evt.clinicStay)?.shortLabel || evt.clinicStay}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-[#8C857B] truncate font-medium">
                  👤 {evt.patientName || 'Bez mena'} • 🩺 {evt.assignedTo || evt.doctorName}
                </p>
              )}
            </div>
          </div>
        ) : (
          /* DETAILNÝ REŽIM PRI ZVÄČŠENOM ROZOSTUPE (ZOOM) - KOMPLETNÉ PODROBNOSTI */
          <div className="flex-1 overflow-hidden pointer-events-none space-y-1">
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <span className="font-mono text-xs font-bold text-[#2C2A29] bg-black/5 px-1.5 py-0.5 rounded">
                {evt.startTime} – {evt.endTime} ({durationMin}m)
              </span>
              <div className="flex items-center gap-1">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${room.badgeColor}`}>
                  {room.icon} {room.shortName}
                </span>
                {getEventTypeBadge(evt.type, evt.freeformCategory)}
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-xs md:text-sm text-[#2C2A29] leading-tight truncate">{evt.title}</h4>
              {evt.type === 'volno' ? (
                <p className="text-xs text-indigo-950 font-bold flex items-center gap-1 mt-0.5 truncate">
                  <span>👤 Pridelené: {evt.assignedTo || 'Celý tím kliniky'}</span>
                </p>
              ) : (
                <p className="text-xs text-[#2C2A29] font-bold flex items-center gap-1 mt-0.5 truncate">
                  <span>👤 {evt.patientName || 'Bez mena'}</span>
                  {getEventPhone(evt) && (
                    <span className="text-[10px] font-normal text-[#8C857B] font-mono">({getEventPhone(evt)})</span>
                  )}
                </p>
              )}
              {evt.type === 'operacia' ? (
                <div className="text-[10px] text-[#8C857B] space-y-0.5 pt-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap pb-0.5">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-200 flex items-center gap-1">
                      <span>💉</span> Anestézia: <strong className="text-purple-950">{evt.anesthesiaType || 'TIVA'}</strong>
                    </span>
                    {evt.clinicStay && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                        <span>{getClinicStayInfo(evt.clinicStay)?.icon || '🏥'}</span> Pobyt: <strong className="text-amber-950">{getClinicStayInfo(evt.clinicStay)?.shortLabel || evt.clinicStay}</strong>
                      </span>
                    )}
                  </div>
                  <p className="truncate">🔪 Operatér: <strong className="text-[#2C2A29]">{evt.operator || evt.doctorName}</strong> • 💉 Anest: {evt.anesthesiologist || 'Lokálna'}</p>
                  <p className="truncate">🧤 Inštrum: {evt.scrubNurse || 'Sestra'} • 🩺 Sestra: {evt.anesthesiaNurse || '–'}</p>
                  {((evt.specialEquipment && evt.specialEquipment.length > 0) || (evt.materials && evt.materials.length > 0)) && (
                    <div className="flex items-center gap-1 flex-wrap pt-0.5">
                      {evt.specialEquipment?.slice(0, 2).map(eq => (
                        <span key={eq} className="px-1.5 py-0.2 bg-black/5 text-[#2C2A29] rounded text-[9px] font-semibold truncate max-w-[110px]">{eq}</span>
                      ))}
                      {evt.materials?.slice(0, 2).map(mat => (
                        <span key={mat} className="px-1.5 py-0.2 bg-[#C5A059]/20 text-[#8C6B28] rounded text-[9px] font-semibold truncate max-w-[110px]">{mat}</span>
                      ))}
                    </div>
                  )}
                </div>
              ) : evt.type !== 'volno' ? (
                <p className="text-[10px] text-[#8C857B] truncate">🩺 Lekár: {evt.assignedTo || evt.doctorName}</p>
              ) : null}
            </div>

            {evt.totalPrice ? (
              <div className="flex items-center gap-2 text-[10px] pt-1 border-t border-black/5">
                <span className="font-bold text-[#2C2A29]">💰 {evt.totalPrice} €</span>
                {evt.depositAmount ? (
                  <span className={`px-1.5 py-0.2 rounded font-bold text-[9px] ${evt.isDepositPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    Záloha {evt.depositAmount} € ({evt.isDepositPaid ? '✓' : '✗'})
                  </span>
                ) : null}
              </div>
            ) : null}

            {evt.notes && (
              <p className="text-[10px] text-[#6B6357] italic line-clamp-1 border-t border-black/5 pt-0.5">
                📝 {evt.notes}
              </p>
            )}
          </div>
        )}

        {/* SPODNÝ ÚCHOP PRE RESIZE TRVANIA UDALOSTI */}
        {!evt.isCancelled && (
          <div 
            onMouseDown={(e) => handleMouseDownResize(e, evt)}
            className="resize-handle absolute bottom-0 left-0 right-0 h-2.5 cursor-ns-resize flex items-center justify-center transition-colors group/resize bg-gradient-to-t from-black/10 to-transparent hover:from-black/25"
            title="Potiahnite pre zmenu trvania udalosti"
          >
            <div className="w-8 h-1 bg-black/25 group-hover/resize:bg-black/60 rounded-full mb-0.5 transition-colors"></div>
          </div>
        )}
      </div>
    );
  };

  // --- POHĽAD: DEŇ (S INTELIGENTNÝM VÝPOČTOM KOLÍZIÍ, DYNAMICKÝM ZOOMOM, DRAG, RESIZE A DRAG-TO-CREATE) ---
  const renderDayView = () => {
    const formattedDate = currentDate.toISOString().split('T')[0];
    const allEventsToday = filteredEvents
      .filter(e => e.date === formattedDate)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    // ROZDELENIE NA CELODENNÉ A ČASOVÉ UDALOSTI
    const allDayEvents = allEventsToday.filter(e => e.isAllDay || (e.startTime === '00:00' && (e.endTime === '23:59' || e.endTime === '00:00')));
    const timedEvents = allEventsToday.filter(e => !(e.isAllDay || (e.startTime === '00:00' && (e.endTime === '23:59' || e.endTime === '00:00'))));

    const positioned = computeEventLayout(timedEvents);
    const pxPerMin = hourHeight / 60;
    const dayStartMin = 7 * 60; // 07:00

    return (
      <div className="relative border border-[#E8E2D9] rounded-2xl bg-white overflow-hidden shadow-sm select-none flex flex-col">
        
        {/* ZOBRAZENIE CELODENNÝCH UDALOSTÍ ÚPLNE NAVRCHU */}
        {allDayEvents.length > 0 && (
          <div className="bg-[#FBF9F6] border-b border-[#E8E2D9] p-3 z-20 relative shadow-sm">
            <div className="text-[9px] font-bold uppercase text-[#8C857B] mb-2 tracking-widest flex items-center gap-1">
              <span>☀️ Celodenné udalosti ({allDayEvents.length})</span>
            </div>
            <div className="flex flex-col gap-2">
              {allDayEvents.map(evt => (
                <div 
                  key={evt.id} 
                  data-event-id={evt.id}
                  onClick={() => setSelectedEvent(evt)} 
                  className={`bg-white border hover:border-[#C5A059] p-2.5 rounded-xl cursor-pointer flex justify-between items-center shadow-sm transition-all ${evt.isCancelled ? 'opacity-60 border-rose-200' : 'border-[#E8E2D9]'}`}
                >
                  <div className="flex items-center gap-3">
                    {getEventTypeBadge(evt.type)}
                    <h4 className={`font-bold text-xs text-[#2C2A29] ${evt.isCancelled ? 'line-through' : ''}`}>{evt.title}</h4>
                    <span className="text-xs text-[#8C857B] hidden md:inline">| {evt.patientName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {evt.isCancelled && <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">ZRUŠENÉ</span>}
                    <span className="text-[9px] bg-gray-50 border border-[#E8E2D9] px-2 py-1 rounded font-bold uppercase text-[#C5A059]">Otvoriť →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HODINOVÁ ČASOVÁ OS (07:00 - 20:00) */}
        <div className="relative min-h-[600px] max-h-[750px] overflow-y-auto">
          <div className="flex">
            
            {/* ĽAVÝ STĹPEC S HODINAMI */}
            <div className="w-16 shrink-0 border-r border-[#E8E2D9] bg-white sticky left-0 z-10 select-none">
              {TIME_SLOTS.map((slotTime) => (
                <div 
                  key={slotTime} 
                  style={{ height: `${hourHeight}px` }}
                  className="border-b border-[#E8E2D9]/50 pr-3 pt-1 font-mono text-[10px] font-bold text-[#8C857B] text-right"
                >
                  {slotTime}
                </div>
              ))}
            </div>

            {/* PRAVÁ PLOCHA PRE UDALOSTI A TAHANIE NOVÝCH UDALOSTÍ */}
            <div 
              onMouseDown={(e) => handleMouseDownCreate(e, formattedDate)}
              className="flex-1 relative cursor-crosshair bg-[#FBF9F6]/20"
            >
              {/* VODIACE ČIARY HODÍN A JEMNÉ POLHODINOVÉ LINKY */}
              {TIME_SLOTS.map((slotTime) => (
                <div 
                  key={slotTime} 
                  style={{ height: `${hourHeight}px` }}
                  className="border-b border-[#E8E2D9]/50 relative pointer-events-none"
                >
                  <div 
                    style={{ top: `${hourHeight / 2}px` }}
                    className="absolute left-0 right-0 border-b border-dashed border-[#E8E2D9]/30"
                  />
                </div>
              ))}

              {/* VYKRESLENIE UDALOSTÍ BEZ PREKRÝVANIA (STĹPCE) */}
              {positioned.map(item => {
                const durationMin = item.endMin - item.startMin;
                const top = Math.max(0, (item.startMin - dayStartMin) * pxPerMin);
                const height = Math.max(30, durationMin * pxPerMin);
                const columnWidth = 100 / item.totalCols;
                const left = `calc(${item.colIndex * columnWidth}% + 2px)`;
                const width = `calc(${columnWidth}% - 4px)`;

                return renderEventCard(item.event, top, height, left, width);
              })}

              {/* DUCH PRE TAHANIE NOVEJ UDALOSTI (LIVE PREVIEW AKO V GOOGLE KALENDÁRI) */}
              {isCreatingDrag && createDragDate === formattedDate && (
                <div 
                  className="absolute left-1 right-2 rounded-xl border-2 border-dashed border-[#C5A059] bg-[#C5A059]/25 backdrop-blur-xs p-2.5 pointer-events-none z-30 shadow-lg flex flex-col justify-between animate-pulse"
                  style={{
                    top: `${(Math.min(dragStartMin, dragCurrentMin) - dayStartMin) * pxPerMin}px`,
                    height: `${Math.max(28, Math.abs(dragCurrentMin - dragStartMin) * pxPerMin)}px`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#2C2A29] bg-white px-2 py-0.5 rounded shadow-xs">
                      {minutesToTimeStr(Math.min(dragStartMin, dragCurrentMin))} – {minutesToTimeStr(Math.max(dragStartMin, dragCurrentMin))}
                    </span>
                    <span className="text-[11px] font-bold text-[#8A6827] uppercase">
                      ({Math.abs(dragCurrentMin - dragStartMin)} min) + Nový termín
                    </span>
                  </div>
                  <span className="text-[10px] text-[#2C2A29]/70 font-semibold italic">
                    Pustite tlačidlo myši pre otvorenie formulára
                  </span>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>
    );
  };

  // --- POHĽAD: TÝŽDEŇ (S DVOJITÝM REŽIMOM: ČASOVÁ OS GOOGLE ŠTÝL ALEBO PREHĽADNÉ KARTY) ---
  const renderWeekView = () => {
    const weekDays = getDaysInWeek(currentDate);
    const dayNames = ['Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok', 'Sobota', 'Nedeľa'];
    const pxPerMin = hourHeight / 60;
    const dayStartMin = 7 * 60; // 07:00

    if (weekViewMode === 'cards') {
      return (
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((date, idx) => {
            const formattedDate = date.toISOString().split('T')[0];
            const dayEvents = filteredEvents.filter(e => e.date === formattedDate);
            const isToday = formattedDate === new Date().toISOString().split('T')[0];
            return (
              <div key={formattedDate} className={`border rounded-xl flex flex-col h-[480px] overflow-y-auto ${isToday ? 'border-[#C5A059] bg-[#FBF9F6]' : 'border-[#E8E2D9] bg-white'}`}>
                <div className={`text-center p-2 border-b text-[10px] uppercase font-bold sticky top-0 z-10 ${isToday ? 'bg-[#C5A059] text-white' : 'bg-[#FBF9F6] text-[#8C857B]'}`}>
                  <span className="block">{dayNames[idx]}</span>
                  <span className="text-sm">{date.getDate()}.{date.getMonth() + 1}.</span>
                </div>
                <div className="p-1.5 flex-1 space-y-1.5">
                  {dayEvents.map(evt => (
                    <div key={evt.id} data-event-id={evt.id} onClick={() => setSelectedEvent(evt)} className={`text-[9px] p-1.5 rounded cursor-pointer border hover:border-[#C5A059] ${evt.isCancelled ? 'line-through opacity-50 bg-gray-100' : 'bg-gray-50 text-gray-800 space-y-0.5'}`}>
                      <strong className="block">{evt.isAllDay ? 'Celý deň' : `${evt.startTime} - ${evt.endTime}`}</strong>
                      <span className="truncate block font-bold text-[#2C2A29]">{evt.patientName || evt.title}</span>
                      <span className="block text-[8px] font-bold text-[#C5A059] uppercase">{getEventTypeLabel(evt.type)}</span>
                      {evt.type === 'operacia' && (
                        <div className="flex items-center gap-1 flex-wrap pt-0.5">
                          <span className="text-[8px] px-1 py-0.2 rounded bg-purple-100 text-purple-900 font-bold border border-purple-200">
                            💉 {evt.anesthesiaType || 'TIVA'}
                          </span>
                          {evt.clinicStay && (
                            <span className="text-[8px] px-1 py-0.2 rounded bg-amber-100 text-amber-900 font-bold border border-amber-200">
                              {getClinicStayInfo(evt.clinicStay)?.icon} {getClinicStayInfo(evt.clinicStay)?.shortLabel}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {dayEvents.length === 0 && (
                    <div 
                      onClick={() => {
                        setNewEvent(prev => ({
                          ...prev,
                          date: formattedDate,
                          startTime: '09:00',
                          endTime: '10:00'
                        }));
                        setIsAddingEvent(true);
                      }}
                      className="text-center py-6 text-[10px] text-[#8C857B] hover:text-[#C5A059] cursor-pointer border border-dashed border-[#E8E2D9] rounded-lg hover:border-[#C5A059] transition-colors"
                    >
                      + Pridať termín
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // TÝŽDENNÁ ČASOVÁ OS S PLNÝM ZOOMOM A TAHANÍM (GOOGLE KALENDÁR)
    return (
      <div className="relative border border-[#E8E2D9] rounded-2xl bg-white overflow-hidden shadow-sm select-none flex flex-col">
        {/* HLAVIČKA S DŇAMI TÝŽDŇA */}
        <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-[#E8E2D9] bg-[#FBF9F6] sticky top-0 z-20 shadow-xs">
          <div className="p-2 text-center text-[10px] font-bold text-[#8C857B] border-r border-[#E8E2D9] flex items-center justify-center">
            Čas
          </div>
          {weekDays.map((date, idx) => {
            const formattedDate = date.toISOString().split('T')[0];
            const isToday = formattedDate === new Date().toISOString().split('T')[0];
            return (
              <div 
                key={formattedDate} 
                onClick={() => { setCurrentDate(date); setView('day'); }}
                className={`p-2 text-center border-r border-[#E8E2D9] cursor-pointer hover:bg-[#FAF4E9] transition-colors ${isToday ? 'bg-[#C5A059]/15' : ''}`}
                title="Kliknite pre zobrazenie dňa"
              >
                <span className="block text-[10px] uppercase font-bold text-[#8C857B]">{dayNames[idx]}</span>
                <span className={`text-xs font-bold inline-block px-1.5 py-0.5 rounded-full ${isToday ? 'bg-[#C5A059] text-white' : 'text-[#2C2A29]'}`}>
                  {date.getDate()}.{date.getMonth() + 1}.
                </span>
              </div>
            );
          })}
        </div>

        {/* SCROLLOVATEĽNÁ TÝŽDENNÁ ČASOVÁ OS */}
        <div className="relative min-h-[600px] max-h-[750px] overflow-y-auto">
          <div className="grid grid-cols-[56px_repeat(7,1fr)] relative">
            
            {/* ĽAVÝ STĹPEC S ČASMI */}
            <div className="border-r border-[#E8E2D9] bg-white sticky left-0 z-10 select-none">
              {TIME_SLOTS.map((slotTime) => (
                <div 
                  key={slotTime} 
                  style={{ height: `${hourHeight}px` }}
                  className="border-b border-[#E8E2D9]/60 pr-2 pt-1 font-mono text-[10px] font-bold text-[#8C857B] text-right"
                >
                  {slotTime}
                </div>
              ))}
            </div>

            {/* 7 INTERAKTÍVNYCH STĹPCOV PRE JEDNOTLIVÉ DNI */}
            {weekDays.map((date) => {
              const formattedDate = date.toISOString().split('T')[0];
              const dayEvents = filteredEvents.filter(e => e.date === formattedDate);
              const timedEvents = dayEvents.filter(e => !(e.isAllDay || (e.startTime === '00:00' && (e.endTime === '23:59' || e.endTime === '00:00'))));
              const positioned = computeEventLayout(timedEvents);

              return (
                <div 
                  key={formattedDate}
                  onMouseDown={(e) => handleMouseDownCreate(e, formattedDate)}
                  className="relative border-r border-[#E8E2D9]/60 cursor-crosshair group/col hover:bg-amber-50/20 transition-colors"
                >
                  {/* HODINOVÉ RIADKY V POZADÍ */}
                  {TIME_SLOTS.map((slotTime) => (
                    <div 
                      key={slotTime}
                      style={{ height: `${hourHeight}px` }}
                      className="border-b border-[#E8E2D9]/40 relative pointer-events-none"
                    >
                      <div 
                        style={{ top: `${hourHeight / 2}px` }} 
                        className="absolute left-0 right-0 border-b border-dashed border-[#E8E2D9]/30"
                      />
                    </div>
                  ))}

                  {/* VYKRESLENIE UDALOSTÍ PRE DOKONALÉ NEPREKRÝVANIE */}
                  {positioned.map(item => {
                    const durationMin = item.endMin - item.startMin;
                    const top = Math.max(0, (item.startMin - dayStartMin) * pxPerMin);
                    const height = Math.max(28, durationMin * pxPerMin);
                    const columnWidth = 100 / item.totalCols;
                    const left = `calc(${item.colIndex * columnWidth}% + 1px)`;
                    const width = `calc(${columnWidth}% - 2px)`;

                    return renderEventCard(item.event, top, height, left, width);
                  })}

                  {/* DUCH PRE TAHANIE NOVEJ UDALOSTI V TÝŽDNI */}
                  {isCreatingDrag && createDragDate === formattedDate && (
                    <div 
                      className="absolute left-0.5 right-1 rounded-xl border-2 border-dashed border-[#C5A059] bg-[#C5A059]/25 backdrop-blur-xs p-1.5 pointer-events-none z-30 shadow-md flex flex-col justify-between animate-pulse"
                      style={{
                        top: `${(Math.min(dragStartMin, dragCurrentMin) - dayStartMin) * pxPerMin}px`,
                        height: `${Math.max(26, Math.abs(dragCurrentMin - dragStartMin) * pxPerMin)}px`,
                      }}
                    >
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="font-mono text-[9px] font-bold text-[#2C2A29] bg-white px-1 py-0.5 rounded shadow-xs">
                          {minutesToTimeStr(Math.min(dragStartMin, dragCurrentMin))} – {minutesToTimeStr(Math.max(dragStartMin, dragCurrentMin))}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold text-[#8A6827]">
                        + Nový ({Math.abs(dragCurrentMin - dragStartMin)}m)
                      </span>
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
                    <div key={evt.id} data-event-id={evt.id} onClick={() => setSelectedEvent(evt)} className="text-[8px] bg-gray-100 p-1 rounded truncate cursor-pointer hover:bg-[#C5A059] hover:text-white">
                      {evt.isAllDay ? '☀️' : evt.startTime} {evt.title}
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
      
      {/* HLAVIČKA A AKCIE */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#E8E2D9] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-brand text-xl font-bold text-[#2C2A29] uppercase">Plánovanie & Kalendár</h2>
            {isSyncing && (
              <span className="text-[9px] bg-[#FBF9F6] border border-[#C5A059] text-[#C5A059] px-2 py-0.5 rounded-full font-bold animate-pulse">
                🔄 Synch...
              </span>
            )}
          </div>
          <p className="text-[10px] uppercase tracking-widest text-[#8C857B]">
            Kalendáre miestností, operačné tímy, personál a časová os s dynamickým rozostupom
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {session && availableCalendars.length > 0 && (
            <select
              value={selectedCalendarId}
              onChange={(e) => setSelectedCalendarId(e.target.value)}
              className="bg-[#FBF9F6] border border-[#E8E2D9] text-[#2C2A29] px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider focus:outline-none"
            >
              <option value="all">🗓️ Google kalendáre ({availableCalendars.length})</option>
              {availableCalendars.map(cal => (
                <option key={cal.id} value={cal.id}>{cal.summary}</option>
              ))}
            </select>
          )}

          <button 
            onClick={handleOpenAddEventModal} 
            className="bg-[#2C2A29] hover:bg-[#C5A059] text-white px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-bold shadow-sm transition-all flex items-center gap-1.5"
          >
            <span>+</span> Nový termín / záznam
          </button>
        </div>
      </div>

      {/* PREPÍNAČ KALENDÁROV / MIESTNOSTÍ KLINIKY */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C857B]">
            Miestnosti & Operačné sály kliniky:
          </span>
          <span className="text-[10px] text-[#8C857B]">
            Zobrazených udalostí: <strong className="text-[#2C2A29]">{filteredEvents.length}</strong> z {calendarEvents.length}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar">
          <button
            onClick={() => setSelectedRoomId('all')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border ${
              selectedRoomId === 'all'
                ? 'bg-[#2C2A29] text-white border-[#2C2A29] shadow-sm'
                : 'bg-[#FBF9F6] text-[#6B6357] hover:bg-white hover:text-[#2C2A29] border-[#E8E2D9]'
            }`}
          >
            <span>🌐</span>
            <span>Všetky miestnosti</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
              selectedRoomId === 'all' ? 'bg-white/20 text-white' : 'bg-black/5 text-[#8C857B]'
            }`}>
              {calendarEvents.length}
            </span>
          </button>

          {CLINIC_ROOMS.map(room => {
            const count = calendarEvents.filter(e => (e.roomId || (e.type === 'operacia' ? 'sala_say' : 'ambulancia')) === room.id).length;
            const isActive = selectedRoomId === room.id;
            return (
              <button
                key={room.id}
                onClick={() => setSelectedRoomId(room.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                  isActive
                    ? `${room.badgeColor} border-current shadow-sm scale-[1.02]`
                    : 'bg-white text-[#6B6357] hover:bg-[#FBF9F6] hover:text-[#2C2A29] border-[#E8E2D9]'
                }`}
              >
                <span>{room.icon}</span>
                <span>{room.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                  isActive ? 'bg-current/15' : 'bg-black/5 text-[#8C857B]'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* LIŠTA FILTROVANIA: PERSONÁL, TYP, A RESET */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FBF9F6] p-3 rounded-xl border border-[#E8E2D9]">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* FILTER PRIDELENÉHO PERSONÁLU */}
          <div className="flex items-center gap-1.5">
            <label className="text-[10px] font-bold uppercase text-[#8C857B]">Pridelené:</label>
            <select
              value={selectedStaffFilter}
              onChange={(e) => setSelectedStaffFilter(e.target.value)}
              className="bg-white border border-[#C5A059] text-[#2C2A29] px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider focus:outline-none shadow-xs"
            >
              <option value="all">👤 Všetci pracovníci / ktokoľvek</option>
              <option value="Celý tím kliniky">👥 Celý tím kliniky</option>
              <optgroup label="Lekári & Operatéri">
                {CLINIC_STAFF.filter(s => s.role === 'doctor').map(doc => (
                  <option key={doc.id} value={doc.name}>{doc.name}</option>
                ))}
              </optgroup>
              <optgroup label="Sestry & Inštrumentárky">
                {CLINIC_STAFF.filter(s => s.role !== 'doctor').map(nurse => (
                  <option key={nurse.id} value={nurse.name}>{nurse.name} ({nurse.specialization || 'Sestra'})</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* FILTER TYPU NÁVŠTEVY / UDALOSTI */}
          <div className="flex items-center gap-1.5">
            <label className="text-[10px] font-bold uppercase text-[#8C857B]">Typ:</label>
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="bg-white border border-[#C5A059] text-[#2C2A29] px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider focus:outline-none shadow-xs"
            >
              <option value="all">🎯 Všetky typy udalostí</option>
              <option value="operacia">🔪 Iba Operácie</option>
              <option value="konzultacia">🩺 Iba Konzultácie</option>
              <option value="osetrenie">💉 Iba Ošetrenia</option>
              <option value="kontrola">🔍 Iba Kontroly</option>
              <option value="volno">🎉 Voľno / Interné (obed, dovolenka, teambuilding...)</option>
            </select>
          </div>

          {/* TLAČIDLO ZRUŠENIA FILTROV */}
          {(selectedRoomId !== 'all' || selectedStaffFilter !== 'all' || selectedTypeFilter !== 'all') && (
            <button
              onClick={() => {
                setSelectedRoomId('all');
                setSelectedStaffFilter('all');
                setSelectedTypeFilter('all');
              }}
              className="text-[10px] font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1.5 rounded-lg uppercase transition-colors"
              title="Zrušiť aktívne filtre a zobraziť všetko"
            >
              ✕ Zrušiť filtre
            </button>
          )}
        </div>

        {/* STATISTIKA FILTRA */}
        <div className="text-[10px] text-[#8C857B] font-medium hidden sm:block">
          {selectedRoomId !== 'all' && <span>Miestnosť: <strong className="text-[#2C2A29]">{getRoomInfo(selectedRoomId).name}</strong> • </span>}
          {selectedStaffFilter !== 'all' && <span>Pracovník: <strong className="text-[#2C2A29]">{selectedStaffFilter}</strong> • </span>}
          {selectedTypeFilter !== 'all' && <span>Typ: <strong className="text-[#2C2A29]">{selectedTypeFilter}</strong></span>}
        </div>
      </div>

      {/* NAVIGÁCIA A OVLÁDANIE POHĽADOV */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3 bg-[#FBF9F6] p-3 rounded-xl border border-[#E8E2D9]">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="px-2.5 py-1.5 bg-white border border-[#E8E2D9] hover:border-[#C5A059] rounded-lg text-xs font-bold text-[#2C2A29] shadow-xs">←</button>
          <button onClick={() => navigate(0)} className="px-3.5 py-1.5 bg-white border border-[#E8E2D9] hover:border-[#C5A059] rounded-lg text-[10px] uppercase font-bold text-[#8C857B] hover:text-[#2C2A29] shadow-xs">Dnes</button>
          <button onClick={() => navigate(1)} className="px-2.5 py-1.5 bg-white border border-[#E8E2D9] hover:border-[#C5A059] rounded-lg text-xs font-bold text-[#2C2A29] shadow-xs">→</button>
          <div className="pl-2 font-bold text-[#2C2A29] text-xs md:text-sm uppercase tracking-wide">
            {currentDate.toLocaleDateString('sk-SK', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* PREPÍNAČ MEDZI TÝŽDENNOU ČASOVOU OSOU A KARTAMI */}
          {view === 'week' && (
            <div className="flex items-center bg-white border border-[#E8E2D9] p-0.5 rounded-lg shadow-xs mr-1">
              <button 
                onClick={() => setWeekViewMode('grid')}
                className={`px-2.5 py-1 text-[9px] font-bold uppercase rounded ${weekViewMode === 'grid' ? 'bg-[#C5A059] text-white' : 'text-[#8C857B] hover:text-[#2C2A29]'}`}
                title="Časová os s plným zobrazením hodín a zoomom"
              >
                ⏱️ Časová os
              </button>
              <button 
                onClick={() => setWeekViewMode('cards')}
                className={`px-2.5 py-1 text-[9px] font-bold uppercase rounded ${weekViewMode === 'cards' ? 'bg-[#C5A059] text-white' : 'text-[#8C857B] hover:text-[#2C2A29]'}`}
                title="Kompaktný zoznam kariet"
              >
                🗂️ Karty
              </button>
            </div>
          )}

          {/* PREPÍNAČ DEŇ / TÝŽDEŇ / MESIAC */}
          <div className="flex gap-1 bg-white border border-[#E8E2D9] p-1 rounded-lg shadow-xs">
            {(['day', 'week', 'month'] as ViewMode[]).map(m => (
              <button key={m} onClick={() => setView(m)} className={`px-3 py-1 text-[10px] font-bold uppercase rounded transition-colors ${view === m ? 'bg-[#2C2A29] text-white' : 'text-[#8C857B] hover:text-[#2C2A29]'}`}>
                {m === 'day' ? 'Deň' : m === 'week' ? 'Týždeň' : 'Mesiac'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* LIŠTA PRE ZOOM A TIPY (AKTÍVNA PRE DEŇ A TÝŽDENNÚ ČASOVÚ OS) */}
      {(view === 'day' || (view === 'week' && weekViewMode === 'grid')) && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FAF8F5] border border-[#E8E2D9] px-3.5 py-2 rounded-xl text-xs">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C857B] flex items-center gap-1">
              <span>🔍</span> Rozostup hodín:
            </span>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setHourHeight(prev => Math.max(45, prev - 15))}
                disabled={hourHeight <= 45}
                className="w-7 h-7 flex items-center justify-center bg-white border border-[#E8E2D9] hover:border-[#C5A059] disabled:opacity-40 rounded font-bold text-xs shadow-2xs"
                title="Zmenšiť rozostup hodín"
              >
                −
              </button>
              <input 
                type="range"
                min="45"
                max="220"
                step="5"
                value={hourHeight}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setHourHeight(val);
                  try {
                    localStorage.setItem('say_clinic_calendar_hour_height', val.toString());
                  } catch {
                    // ignore
                  }
                }}
                className="w-24 md:w-36 accent-[#C5A059] cursor-pointer"
                title={`Aktuálna výška: ${hourHeight}px za hodinu`}
              />
              <button 
                onClick={() => setHourHeight(prev => Math.min(220, prev + 15))}
                disabled={hourHeight >= 220}
                className="w-7 h-7 flex items-center justify-center bg-white border border-[#E8E2D9] hover:border-[#C5A059] disabled:opacity-40 rounded font-bold text-xs shadow-2xs"
                title="Zväčšiť rozostup hodín"
              >
                +
              </button>
              <button 
                onClick={() => setHourHeight(85)}
                className="px-2 py-1 text-[9px] font-bold uppercase bg-white border border-[#E8E2D9] hover:border-[#C5A059] text-[#8C857B] hover:text-[#2C2A29] rounded shadow-2xs"
                title="Obnoviť predvolený rozostup (85px)"
              >
                Reset ({hourHeight}px)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-[#8C857B] flex-wrap">
            <span className="bg-white px-2 py-1 rounded border border-[#E8E2D9] flex items-center gap-1 font-medium">
              <kbd className="font-mono bg-gray-100 px-1 py-0.5 rounded border border-gray-300 text-[#2C2A29]">Ctrl</kbd> + <span className="font-medium text-[#2C2A29]">koliesko myši</span> = zoom rozostupu
            </span>
            <span className="bg-white px-2 py-1 rounded border border-[#E8E2D9] flex items-center gap-1 font-medium hidden sm:flex">
              <span className="text-[#C5A059]">✦</span> Ťahaním myšou (drag) vytvoríte ľubovoľne dlhú novú udalosť
            </span>
          </div>
        </div>
      )}

      {/* HLAVNÝ KONTAJNER KALENDÁRA SO ZACHYTÁVANÍM CTRL + SCROLL PRE ZOOM */}
      <div ref={gridContainerRef} className="min-h-[400px]">
        {view === 'day' && renderDayView()}
        {view === 'week' && renderWeekView()}
        {view === 'month' && renderMonthView()}
      </div>

      {/* MODAL DETAIL UDALOSTI A AKCIE */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={(evt) => {
            setEditingEventData(evt);
            setIsEditingEvent(true);
            setSelectedEvent(null);
          }}
          onOpenPatientFolder={(evt) => {
            handleOpenFolderForEvent(evt);
            setSelectedEvent(null);
          }}
          onCancelRequest={(evt) => {
            setCancellingEvent(evt);
            setSelectedEvent(null);
          }}
          onToggleDepositPaid={(evt) => {
            const newStatus = !evt.isDepositPaid;
            updateDepositStatus(evt.id, newStatus);
            setSelectedEvent({ ...evt, isDepositPaid: newStatus });
          }}
          getEventPhone={getEventPhone}
          getEventEmail={getEventEmail}
          getEventTypeBadge={getEventTypeBadge}
          onPhoneChange={handlePhoneChange}
          onEmailChange={handleEmailChange}
          onSendWhatsApp={sendWhatsApp}
          onSendSMS={sendSMS}
          onToggleEmailPanel={handleToggleEmailPanel}
          openEmailEventId={openEmailEventId}
          setOpenEmailEventId={setOpenEmailEventId}
          onSendEmailSubmit={handleSendEmailSubmit}
          isSendingEmail={isSendingEmail}
          emailSubject={emailSubject}
          setEmailSubject={setEmailSubject}
          emailBody={emailBody}
          setEmailBody={setEmailBody}
          attachAdvanceInvoice={attachAdvanceInvoice}
          setAttachAdvanceInvoice={setAttachAdvanceInvoice}
          attachInstructions={attachInstructions}
          setAttachInstructions={setAttachInstructions}
          attachPreOpInstructions={attachPreOpInstructions}
          setAttachPreOpInstructions={setAttachPreOpInstructions}
        />
      )}

      {/* MODAL RUČNEJ ÚPRAVY UDALOSTI */}
      {isEditingEvent && (
        <EventFormModal
          isOpen={isEditingEvent}
          mode="edit"
          initialData={editingEventData}
          onClose={() => setIsEditingEvent(false)}
          onSave={handleSaveModalEditedEvent}
          isSaving={isSaving}
        />
      )}

      {/* MODAL PRE ZRUŠENIE TERMÍNU S DÔVODOM */}
      {cancellingEvent && (
        <div className="fixed inset-0 bg-[#2C2A29]/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-xl border border-[#E8E2D9] space-y-4">
            <h3 className="font-brand text-lg font-bold text-rose-700 uppercase border-b pb-2">❌ Zrušenie Termínu</h3>
            <p className="text-xs text-[#8C857B]">Udalosť: <strong>{cancellingEvent.title}</strong> ({cancellingEvent.patientName})</p>

            <form onSubmit={handleConfirmCancelEvent} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Dôvod zrušenia *</label>
                <select value={cancelReasonInput} onChange={e => setCancelReasonInput(e.target.value)} className="w-full border p-2 rounded-lg bg-[#FBF9F6] font-bold">
                  <option value="Choroba pacienta">Choroba pacienta</option>
                  <option value="Zrušené zo strany pacienta">Zrušené zo strany pacienta</option>
                  <option value="Presun na iný termín">Presun na iný termín</option>
                  <option value="Choroba lekára / zmena na klinike">Choroba lekára / zmena na klinike</option>
                  <option value="Iné (vlastný dôvod)">Iné (vlastný dôvod)</option>
                </select>
              </div>

              {cancelReasonInput === 'Iné (vlastný dôvod)' && (
                <div>
                  <input type="text" required placeholder="Vlastný dôvod zrušenia..." value={customCancelReason} onChange={e => setCustomCancelReason(e.target.value)} className="w-full border p-2 rounded-lg bg-[#FBF9F6]" />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setCancellingEvent(null)} className="px-4 py-2 font-bold text-[#8C857B]">SPÄŤ</button>
                <button type="submit" className="px-5 py-2 bg-rose-700 text-white font-bold rounded-xl uppercase">POTVRDIŤ ZRUŠENIE</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PRIDANIA NOVEJ UDALOSTI */}
      {isAddingEvent && (
        <EventFormModal
          isOpen={isAddingEvent}
          mode="create"
          initialData={newEvent}
          onClose={() => setIsAddingEvent(false)}
          onSave={handleSaveModalCreatedEvent}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}