'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { RealtimeSyncService } from '../services/realtimeSyncService';
import { compactCalendarEvents } from '../utils/safeStorage';

import { 
  CalendarEvent,
  EventType, 
  EventAttendanceStatus,
  getEventStatusInfo,
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
  getClinicStayInfo,
  getPostOpTimeDiff,
  calculateTargetControlDate,
  formatLocalDate,
  parseLocalDate,
  getSurgeryReadinessSummary,
  getDoctorColorScheme,
  DOCTOR_COLOR_SCHEMES,
  WaitingListEntry,
  generateDefaultWaitingList,
  EventSaveExtraOptions
} from '../data/calendarConfig';

import EventFormModal from './calendar/EventFormModal';
import EventDetailModal from './calendar/EventDetailModal';
import {
  fetchGoogleCalendarEvents,
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  mergeCalendarEvents,
  getCalendarAuthToken,
} from '../services/calendarSyncService';
import { googleSignIn, subscribeWorkspaceAuth } from '../lib/workspaceAuth';

export type { CalendarEvent, EventType, FreeformCategory, ClinicRoom, ClinicStayType, AnesthesiaType };
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

export interface GoogleCalendarItem {
  id: string;
  summary: string;
  primary?: boolean;
}

import { UserAccount } from './LoginForm';

interface CalendarProps {
  events?: CalendarEvent[];
  patients?: Array<{ id: string; name: string; phone?: string; email?: string; birthNumber?: string }>;
  currentUser?: UserAccount | null;
  onOpenPatientFolder?: (patientId: string, patientName?: string) => void;
  onAddEvent?: (event: CalendarEvent) => void;
  onEventsChange?: (events: CalendarEvent[]) => void;
  onCheckoutInPOS?: (event: CalendarEvent) => void;
  onCreateMedicalDocument?: (event: CalendarEvent) => void;
  onPatientCreated?: (patient: any) => void;
}

type ViewMode = 'day' | 'week' | 'month' | 'agenda';

// Hodiny pre časovú os (06:00 - 20:00, pokrýva 06:00 až 21:00)
const DAY_START_HOUR = 6;
const DAY_END_HOUR = 21;
const TIME_SLOTS = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => {
  const hour = i + DAY_START_HOUR;
  return `${hour < 10 ? '0' : ''}${hour}:00`;
});

export default function Calendar({ 
  events: initialPropEvents = [], 
  patients = [], 
  currentUser,
  onOpenPatientFolder, 
  onAddEvent,
  onEventsChange,
  onCheckoutInPOS,
  onCreateMedicalDocument,
  onPatientCreated
}: CalendarProps) {
  const { data: session } = useSession();

  const isRudlovaOnly = Boolean(
    currentUser?.role === 'external_clinic' ||
    currentUser?.id === 'u21' ||
    currentUser?.email === 'rudlova@sayclinic.sk'
  );
  
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(initialPropEvents);
  const [availableCalendars, setAvailableCalendars] = useState<GoogleCalendarItem[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('all');
  const [selectedRoomId, setSelectedRoomId] = useState<string>(() => isRudlovaOnly ? 'sala_rudlova' : 'all');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hideCancelled, setHideCancelled] = useState<boolean>(false);

  useEffect(() => {
    if (isRudlovaOnly && selectedRoomId !== 'sala_rudlova') {
      setSelectedRoomId('sala_rudlova');
    }
  }, [isRudlovaOnly, selectedRoomId]);

  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [view, setView] = useState<ViewMode>('day');
  const [dayViewMode, setDayViewMode] = useState<'single' | 'rooms'>('single');
  const [colorMode, setColorMode] = useState<'type' | 'doctor'>('type');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [miniCalMonth, setMiniCalMonth] = useState<Date>(() => new Date());
  const [toastBanner, setToastBanner] = useState<string | null>(null);

  // Čakacia listina (Waiting List) & Hromadné pripomienky na zajtra
  const [waitingList, setWaitingList] = useState<WaitingListEntry[]>([]);
  const [isWaitingListModalOpen, setIsWaitingListModalOpen] = useState<boolean>(false);
  const [isTomorrowRemindersOpen, setIsTomorrowRemindersOpen] = useState<boolean>(false);
  const [newWaitEntry, setNewWaitEntry] = useState<Partial<WaitingListEntry>>({
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    type: 'operacia',
    procedureTitle: '',
    preferredDoctor: 'MUDr. Ján Mráz',
    roomId: 'sala_say',
    durationMinutes: 120,
    anesthesiaType: 'TIVA',
    totalPrice: 3500,
    depositAmount: 500,
    isDepositPaid: false,
    preferredDatesNote: 'Čo najskôr pri uvoľnení termínu',
    priority: 'urgent',
    notes: '',
  });
  
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
  const [isWorkspaceConnected, setIsWorkspaceConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  
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
    date: formatLocalDate(), 
    startTime: '09:00', 
    endTime: '10:00', 
    isAllDay: false,
    type: 'operacia',
    status: 'planned',
    freeformCategory: 'obed',
    operator: 'MUDr. Ján Mráz',
    anesthesiologist: 'MUDr. Martin Kasáč',
    anesthesiaNurse: 'Denisa Halajová',
    scrubNurse: 'Katarína Otiepková',
    specialEquipment: [],
    specialEquipmentOther: '',
    materials: [],
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
  const [createDragRoomId, setCreateDragRoomId] = useState('');
  const [dragStartMin, setDragStartMin] = useState(0);
  const [dragCurrentMin, setDragCurrentMin] = useState(0);

  // REF PRE ZACHYTÁVANIE CTRL + KOLIESKO MYŠI (ZOOM)
  const gridContainerRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((msg: string) => {
    setToastBanner(msg);
    setTimeout(() => {
      setToastBanner(prev => (prev === msg ? null : prev));
    }, 4500);
  }, []);

  const commitWaitingListUpdate = useCallback((updater: (prev: WaitingListEntry[]) => WaitingListEntry[]) => {
    setWaitingList(prev => {
      const next = updater(prev);
      try {
        localStorage.setItem('say_clinic_waiting_list', JSON.stringify(next));
      } catch (e) {
        console.error('Chyba uloženia čakacej listiny:', e);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    try {
      const savedWL = localStorage.getItem('say_clinic_waiting_list');
      if (savedWL) {
        const parsed = JSON.parse(savedWL);
        if (Array.isArray(parsed)) {
          setWaitingList(parsed);
        }
      } else {
        const defaults = generateDefaultWaitingList();
        setWaitingList(defaults);
        localStorage.setItem('say_clinic_waiting_list', JSON.stringify(defaults));
      }
    } catch {
      setWaitingList(generateDefaultWaitingList());
    }
  }, []);

  // Synchronizácia mini-kalendára s aktuálnym dátumom
  useEffect(() => {
    setMiniCalMonth(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1, 12, 0, 0));
  }, [currentDate]);

  // Referencie pre stabilné volania rodičovských callbackov bez re-render slučiek
  const onEventsChangeRef = useRef(onEventsChange);
  useEffect(() => {
    onEventsChangeRef.current = onEventsChange;
  }, [onEventsChange]);

  const onPatientCreatedRef = useRef(onPatientCreated);
  useEffect(() => {
    onPatientCreatedRef.current = onPatientCreated;
  }, [onPatientCreated]);

  const calendarEventsRef = useRef<CalendarEvent[]>(calendarEvents);
  calendarEventsRef.current = calendarEvents;

  // Centrálna funkcia na uloženie a publikovanie zmien v kalendári
  // DÔLEŽITÉ: Samotný updater pre setCalendarEvents musí byť čisto synchrónny a bez vedľajších účinkov.
  // Zápis do localStorage a publikovanie do RealtimeSync / onEventsChange beží bezpečne v microtasku mimo render fázy,
  // čo zabraňuje chybe "Cannot update a component ('Home') while rendering a different component ('Calendar')".
  const commitEventsUpdate = useCallback((updater: (prev: CalendarEvent[]) => CalendarEvent[]) => {
    let nextEvents: CalendarEvent[] = [];
    setCalendarEvents(prev => {
      nextEvents = updater(prev);
      calendarEventsRef.current = nextEvents;
      return nextEvents;
    });

    queueMicrotask(() => {
      try {
        localStorage.setItem('say_clinic_calendar_events', JSON.stringify(compactCalendarEvents(nextEvents)));
      } catch (e) {
        console.error('Chyba pri zápise kalendára do localStorage:', e);
      }
      RealtimeSyncService.publish('calendar_events', nextEvents);
      if (onEventsChangeRef.current) {
        onEventsChangeRef.current(nextEvents);
      }
    });
  }, []);

  const detectEventType = (title: string = ''): EventType => {
    const t = title.toLowerCase();
    if (t.includes('obed') || t.includes('dovolenk') || t.includes('teambuild') || t.includes('skolen') || t.includes('školen') || t.includes('sanitarn') || t.includes('sanitár')) return 'volno';
    if (t.includes('konzultac') || t.includes('konzultác') || t.includes('vysetren') || t.includes('vyšetren')) return 'konzultacia';
    if (t.includes('osetren') || t.includes('ošetren') || t.includes('botox') || t.includes('kyselina') || t.includes('aplikac') || t.includes('profhilo')) return 'osetrenie';
    if (t.includes('kontrol') || t.includes('stehy') || t.includes('prevaz') || t.includes('preväz') || t.includes('observac')) return 'kontrola';
    return 'operacia';
  };

  /**
   * Vykoná obojsmernú synchronizáciu:
   * Stiahne najnovšie udalosti z Google Kalendára a inteligentne ich zlúči s lokálnymi udalosťami
   */
  const performTwoWaySync = useCallback(async (silent: boolean = false) => {
    setIsSyncing(true);
    if (!silent) setSyncStatusMsg(null);

    try {
      const result = await fetchGoogleCalendarEvents(session);
      if (result) {
        commitEventsUpdate(prev => mergeCalendarEvents(prev, result.events, result.successfulCalendarIds));

        if (result.calendars && result.calendars.length > 0) {
          setAvailableCalendars(result.calendars);
          localStorage.setItem('say_clinic_calendars', JSON.stringify(result.calendars));
        }

        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        setLastSyncTime(timeStr);
        if (!silent) {
          setSyncStatusMsg(`Synchronizované o ${timeStr} (${result.events.length} udalostí)`);
          setTimeout(() => setSyncStatusMsg(null), 4000);
        }
      } else if (!silent) {
        setSyncStatusMsg('Synchronizácia neúspešná (overte prihlásenie)');
        setTimeout(() => setSyncStatusMsg(null), 4000);
      }
    } catch (err) {
      console.error('Chyba obojsmernej synchronizácie:', err);
      if (!silent) {
        setSyncStatusMsg('Chyba spojenia');
        setTimeout(() => setSyncStatusMsg(null), 4000);
      }
    } finally {
      setIsSyncing(false);
    }
  }, [session, commitEventsUpdate]);

  const performTwoWaySyncRef = useRef(performTwoWaySync);
  useEffect(() => {
    performTwoWaySyncRef.current = performTwoWaySync;
  }, [performTwoWaySync]);

  useEffect(() => {
    const cachedEvents = localStorage.getItem('say_clinic_calendar_events');
    const cachedCalendars = localStorage.getItem('say_clinic_calendars');

    if (cachedEvents) {
      try {
        const parsed = JSON.parse(cachedEvents);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((e: any) => 
            !e.id?.startsWith('seed-') && 
            !e.id?.startsWith('demo-') &&
            !['P1', 'P2', 'P3'].includes(e.patientId) &&
            !e.patientName?.includes('Mária Kováčová') &&
            !e.patientName?.includes('Ján Novák')
          );
          const formatted: CalendarEvent[] = cleaned.map((e: any) => ({
            ...e,
            roomId: e.roomId || (e.type === 'operacia' ? 'sala_say' : 'ambulancia'),
            type: (e.type || detectEventType(e.title)) as EventType
          }));
          setCalendarEvents(formatted);
          localStorage.setItem('say_clinic_calendar_events', JSON.stringify(compactCalendarEvents(formatted)));
        } else {
          setCalendarEvents([]);
          localStorage.setItem('say_clinic_calendar_events', JSON.stringify([]));
        }
      } catch (e) {
        console.error('Chyba načítania:', e);
      }
    } else {
      setCalendarEvents([]);
      localStorage.setItem('say_clinic_calendar_events', JSON.stringify([]));
    }

    if (cachedCalendars) {
      try {
        const parsedCal = JSON.parse(cachedCalendars);
        if (Array.isArray(parsedCal) && parsedCal.length > 0) setAvailableCalendars(parsedCal);
      } catch (e) {
        console.error('Chyba načítania kalendárov:', e);
      }
    }

    const unsub = subscribeWorkspaceAuth((user, token) => {
      const connected = Boolean(user && token);
      setIsWorkspaceConnected(connected);
      if (connected) {
        performTwoWaySyncRef.current?.(true);
      }
    });

    if (session) {
      performTwoWaySyncRef.current?.(true);
    }

    return () => unsub();
  }, [session]);

  // Synchronizácia pri zmene prop events z nadradeného page.tsx (napr. po pridaní termínu z karty pacienta)
  useEffect(() => {
    if (Array.isArray(initialPropEvents) && initialPropEvents.length > 0) {
      setCalendarEvents(prev => {
        if (initialPropEvents.length !== prev.length) {
          return initialPropEvents;
        }
        return prev;
      });
    }
  }, [initialPropEvents]);

  // Real-time odber udalostí kalendára z ostatných počítačov
  useEffect(() => {
    const unsub = RealtimeSyncService.subscribe('calendar_events', (updated) => {
      if (Array.isArray(updated)) {
        setCalendarEvents(updated);
      }
    });
    return () => unsub();
  }, []);

  const isGoogleConnected = Boolean((session as any)?.accessToken || isWorkspaceConnected);

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

  const adjustZoom = (delta: number) => {
    setHourHeight(prev => {
      const next = Math.min(220, Math.max(45, prev + delta));
      try {
        localStorage.setItem('say_clinic_calendar_hour_height', next.toString());
      } catch {}
      return next;
    });
  };

  // OBSLUHA CTRL + KOLIESKO MYŠI PRE PLYNULÝ ZOOM ROZOSTUPU HODÍN
  useEffect(() => {
    const container = gridContainerRef.current;
    if (!container) return;

    const handleNativeWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 12 : -12;
        adjustZoom(delta);
      }
    };

    container.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleNativeWheel);
    };
  }, [view, weekViewMode]);

  // POMOCNÉ VÝPOČTY PRE ČASOVÚ OS A KOLÍZIE
  const timeToMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h * 60) + (m || 0);
  };

  const minutesToTimeStr = (minutes: number) => {
    const clamped = Math.max(0, Math.min(23 * 60 + 59, minutes));
    const h = Math.floor(clamped / 60);
    const m = clamped % 60;
    return `${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m}`;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    const days: (Date | null)[] = Array(offset).fill(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i, 12, 0, 0));
    return days;
  };

  const getDaysInWeek = (date: Date) => {
    const current = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(current.getFullYear(), current.getMonth(), diff, 12, 0, 0);
    
    return Array.from({ length: 7 }).map((_, i) => {
      return new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + i, 12, 0, 0);
    });
  };

  // INTELIGENTNÝ VÝPOČET ROZLOŽENIA PREKRÝVAJÚCICH SA UDALOSTÍ DO STĹPCOV
  const computeEventLayout = (events: CalendarEvent[]): PositionedCalendarEvent[] => {
    if (events.length === 0) return [];

    const sorted = [...events].sort((a, b) => {
      const aStart = timeToMinutes(a.startTime);
      const bStart = timeToMinutes(b.startTime);
      if (aStart !== bStart) return aStart - bStart;
      return (timeToMinutes(b.endTime) - bStart) - (timeToMinutes(a.endTime) - aStart);
    });

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

  // Dátumový rozsah aktuálneho pohľadu (pre štatistiky a odznaky miestností)
  const currentPeriodDates = useMemo(() => {
    if (view === 'day') {
      const d = formatLocalDate(currentDate);
      return { start: d, end: d };
    }
    if (view === 'week') {
      const days = getDaysInWeek(currentDate);
      return { start: formatLocalDate(days[0]), end: formatLocalDate(days[6]) };
    }
    if (view === 'month') {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const first = new Date(year, month, 1, 12);
      const last = new Date(year, month + 1, 0, 12);
      return { start: formatLocalDate(first), end: formatLocalDate(last) };
    }
    // agenda - od dnes na 60 dní dopredu (alebo všetko pri vyhľadávaní)
    const start = formatLocalDate(currentDate);
    const future = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 90, 12);
    return { start, end: formatLocalDate(future) };
  }, [currentDate, view]);

  const filteredEvents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return calendarEvents.filter(e => {
      if (!e) return false;
      if (hideCancelled && e.isCancelled) return false;

      // Filter podľa Google Kalendára
      if (selectedCalendarId !== 'all' && e.calendarId && e.calendarId !== selectedCalendarId) {
        return false;
      }

      // Filter podľa miestnosti
      const eventRoom = e.roomId || (e.type === 'operacia' ? 'sala_say' : 'ambulancia');
      if (isRudlovaOnly) {
        if (eventRoom !== 'sala_rudlova' && e.calendarId !== 'sala_rudlova') return false;
      } else {
        const matchesRoom = selectedRoomId === 'all' || eventRoom === selectedRoomId || e.calendarId === selectedRoomId;
        if (!matchesRoom) return false;
      }
      
      // Filter podľa typu návštevy
      const matchesType = selectedTypeFilter === 'all' || e.type === selectedTypeFilter;
      if (!matchesType) return false;

      // Filter podľa pridelenej osoby / personálu
      if (selectedStaffFilter !== 'all') {
        const staffLower = selectedStaffFilter.toLowerCase();
        const matchesStaff =
          (e.assignedTo && e.assignedTo.toLowerCase().includes(staffLower)) ||
          (e.doctorName && e.doctorName.toLowerCase().includes(staffLower)) ||
          (e.operator && e.operator.toLowerCase().includes(staffLower)) ||
          (e.anesthesiologist && e.anesthesiologist.toLowerCase().includes(staffLower)) ||
          (e.anesthesiaNurse && e.anesthesiaNurse.toLowerCase().includes(staffLower)) ||
          (e.scrubNurse && e.scrubNurse.toLowerCase().includes(staffLower));
        if (!matchesStaff) return false;
      }

      // Textové vyhľadávanie
      if (query.length > 0) {
        const haystack = [
          e.title,
          e.patientName,
          e.patientPhone,
          e.patientEmail,
          e.doctorName,
          e.operator,
          e.notes,
          e.operationTitle,
          e.materialNotes
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      return true;
    });
  }, [calendarEvents, hideCancelled, selectedCalendarId, selectedRoomId, selectedTypeFilter, selectedStaffFilter, searchQuery, isRudlovaOnly]);

  // Udalosti spadajúce do aktuálne zobrazeného obdobia (Deň / Týždeň / Mesiac)
  const periodEvents = useMemo(() => {
    if (searchQuery.trim().length > 0 && view === 'agenda') {
      return filteredEvents;
    }
    return filteredEvents.filter(e => e.date >= currentPeriodDates.start && e.date <= currentPeriodDates.end);
  }, [filteredEvents, currentPeriodDates, searchQuery, view]);

  // KPI Štatistiky pre aktuálne obdobie
  const periodStats = useMemo(() => {
    const active = periodEvents.filter(e => !e.isCancelled);
    const surgeries = active.filter(e => e.type === 'operacia');
    const tivaCount = surgeries.filter(e => (e.anesthesiaType || 'TIVA').toUpperCase().includes('TIVA') || (e.anesthesiaType || '').toLowerCase().includes('celkov')).length;
    const laCount = surgeries.length - tivaCount;
    const consultations = active.filter(e => e.type === 'konzultacia').length;
    const checkups = active.filter(e => e.type === 'kontrola').length;
    const treatments = active.filter(e => e.type === 'osetrenie').length;
    const totalRevenue = active.reduce((sum, e) => sum + (Number(e.totalPrice) || 0), 0);
    const unpaidDeposits = active.filter(e => (Number(e.depositAmount) || 0) > 0 && !e.isDepositPaid).length;

    return {
      totalActive: active.length,
      surgeries: surgeries.length,
      tivaCount,
      laCount,
      consultations,
      checkups,
      treatments,
      totalRevenue,
      unpaidDeposits
    };
  }, [periodEvents]);

  const getEventPhone = useCallback((evt: CalendarEvent) => {
    if (customPhones[evt.id] !== undefined) return customPhones[evt.id];
    if (evt.patientPhone && evt.patientPhone.trim() !== '') return evt.patientPhone;
    if (evt.patientName && patients.length > 0) {
      const found = patients.find(p => p.name.toLowerCase().trim() === evt.patientName.toLowerCase().trim());
      if (found && found.phone) return found.phone;
    }
    return '';
  }, [customPhones, patients]);

  const getEventEmail = useCallback((evt: CalendarEvent) => {
    if (customEmails[evt.id] !== undefined) return customEmails[evt.id];
    if (evt.patientEmail && evt.patientEmail.trim() !== '') return evt.patientEmail;
    if (evt.patientName && patients.length > 0) {
      const found = patients.find(p => p.name.toLowerCase().trim() === evt.patientName.toLowerCase().trim());
      if (found && found.email) return found.email;
    }
    return '';
  }, [customEmails, patients]);

  // Trvalé uloženie telefónu a e-mailu do udalosti
  const handlePhoneChange = (eventId: string, phone: string) => {
    setCustomPhones(prev => ({ ...prev, [eventId]: phone }));
    let targetEvt: CalendarEvent | null = null;
    commitEventsUpdate(prev => prev.map(e => {
      if (e.id === eventId) {
        targetEvt = { ...e, patientPhone: phone };
        return targetEvt;
      }
      return e;
    }));
    if (selectedEvent && selectedEvent.id === eventId) {
      setSelectedEvent(prev => prev ? { ...prev, patientPhone: phone } : null);
    }
    if (targetEvt) {
      const ev = targetEvt as CalendarEvent;
      const gId = ev.googleEventId || (ev.id.startsWith('gcal-') ? ev.id.replace('gcal-', '') : null);
      if (gId) {
        updateGoogleCalendarEvent({ ...ev, googleEventId: gId }, session).catch(() => {});
      }
    }
  };

  const handleEmailChange = (eventId: string, email: string) => {
    setCustomEmails(prev => ({ ...prev, [eventId]: email }));
    let targetEvt: CalendarEvent | null = null;
    commitEventsUpdate(prev => prev.map(e => {
      if (e.id === eventId) {
        targetEvt = { ...e, patientEmail: email };
        return targetEvt;
      }
      return e;
    }));
    if (selectedEvent && selectedEvent.id === eventId) {
      setSelectedEvent(prev => prev ? { ...prev, patientEmail: email } : null);
    }
    if (targetEvt) {
      const ev = targetEvt as CalendarEvent;
      const gId = ev.googleEventId || (ev.id.startsWith('gcal-') ? ev.id.replace('gcal-', '') : null);
      if (gId) {
        updateGoogleCalendarEvent({ ...ev, googleEventId: gId }, session).catch(() => {});
      }
    }
  };

  const updateDepositStatus = useCallback((eventId: string, isPaid: boolean) => {
    let targetEvt: CalendarEvent | null = null;
    commitEventsUpdate(prev => prev.map(e => {
      if (e.id === eventId) {
        targetEvt = { ...e, isDepositPaid: isPaid };
        return targetEvt;
      }
      return e;
    }));
    if (targetEvt) {
      const ev = targetEvt as CalendarEvent;
      const gId = ev.googleEventId || (ev.id.startsWith('gcal-') ? ev.id.replace('gcal-', '') : null);
      if (gId) {
        updateGoogleCalendarEvent({ ...ev, googleEventId: gId }, session).catch(() => {});
      }
    }
  }, [commitEventsUpdate, session]);

  const handleTogglePreOpItem = useCallback((
    evt: CalendarEvent,
    key: 'isDepositPaid' | 'preOpExamReady' | 'materialsReady' | 'consentsSigned'
  ) => {
    const nextVal = !evt[key];
    const updatedEvent: CalendarEvent = {
      ...evt,
      [key]: nextVal,
    };
    commitEventsUpdate(prev => prev.map(e => e.id === evt.id ? updatedEvent : e));
    if (selectedEvent && selectedEvent.id === evt.id) {
      setSelectedEvent(updatedEvent);
    }
    const gId = updatedEvent.googleEventId || (updatedEvent.id.startsWith('gcal-') ? updatedEvent.id.replace('gcal-', '') : null);
    if (gId) {
      updateGoogleCalendarEvent({ ...updatedEvent, googleEventId: gId }, session).catch(() => {});
    }
  }, [commitEventsUpdate, selectedEvent, session]);

  // Automatické založenie nového pacienta do Kartotéky, ak ešte neexistuje
  const ensurePatientInDatabase = useCallback((eventData: Partial<CalendarEvent>): string => {
    if (eventData.type === 'volno') return '';
    const cleanName = (eventData.patientName || '').trim();
    if (!cleanName || cleanName === 'Bez mena' || cleanName === 'Personál kliniky') {
      return eventData.patientId || '';
    }

    try {
      const raw = localStorage.getItem('say_clinic_patients');
      const existingList: any[] = raw ? JSON.parse(raw) : [...patients];

      if (eventData.patientId) {
        const byId = existingList.find(p => p.id === eventData.patientId);
        if (byId) return byId.id;
      }

      const byName = existingList.find(
        p => (p.name || '').toLowerCase().trim() === cleanName.toLowerCase()
      );
      if (byName) return byName.id;

      // Vytvoríme novú kartu pacienta
      const newPat = {
        id: `P-${Date.now()}`,
        name: cleanName,
        birthNumber: eventData.patientBirthNumber || '',
        phone: eventData.patientPhone || '',
        email: eventData.patientEmail || '',
        address: '',
        insurance: 'Samoplatca',
      };
      const updatedPatients = [newPat, ...existingList];
      localStorage.setItem('say_clinic_patients', JSON.stringify(updatedPatients));
      RealtimeSyncService.publish('patients', updatedPatients);
      if (onPatientCreatedRef.current) {
        onPatientCreatedRef.current(newPat);
      }
      showToast(`👤 Nový pacient „${cleanName}“ bol automaticky založený do Kartotéky`);
      return newPat.id;
    } catch (e) {
      console.error('Chyba pri automatickom vytvorení pacienta:', e);
      return eventData.patientId || '';
    }
  }, [patients, showToast]);

  const handleStatusChange = useCallback((evt: CalendarEvent, newStatus: EventAttendanceStatus) => {
    const updatedEvent: CalendarEvent = {
      ...evt,
      status: newStatus,
      isCancelled: newStatus === 'cancelled'
    };
    commitEventsUpdate(prev => prev.map(e => e.id === evt.id ? updatedEvent : e));
    if (selectedEvent && selectedEvent.id === evt.id) {
      setSelectedEvent(updatedEvent);
    }
    const gId = updatedEvent.googleEventId || (updatedEvent.id.startsWith('gcal-') ? updatedEvent.id.replace('gcal-', '') : null);
    if (gId) {
      updateGoogleCalendarEvent({ ...updatedEvent, googleEventId: gId }, session).catch(() => {});
    }
  }, [commitEventsUpdate, selectedEvent, session]);

  const handleRestoreCancelledEvent = useCallback((evt: CalendarEvent) => {
    const restored: CalendarEvent = {
      ...evt,
      isCancelled: false,
      cancelReason: '',
      status: 'planned'
    };
    commitEventsUpdate(prev => prev.map(e => e.id === evt.id ? restored : e));
    if (selectedEvent && selectedEvent.id === evt.id) {
      setSelectedEvent(restored);
    }
    const gId = restored.googleEventId || (restored.id.startsWith('gcal-') ? restored.id.replace('gcal-', '') : null);
    if (gId) {
      updateGoogleCalendarEvent({ ...restored, googleEventId: gId }, session).catch(() => {});
    }
  }, [commitEventsUpdate, selectedEvent, session]);

  const handleDuplicateEvent = useCallback((evt: CalendarEvent) => {
    setSelectedEvent(null);
    const { id: _id, googleEventId: _gId, isGoogleSynced: _sync, ...rest } = evt;
    setNewEvent({
      ...rest,
      isCancelled: false,
      cancelReason: '',
      status: 'planned'
    });
    setIsAddingEvent(true);
  }, []);

  const handleScheduleFollowUp = useCallback((evt: CalendarEvent, daysOffset: number = 7) => {
    setSelectedEvent(null);
    const targetDate = calculateTargetControlDate(evt.date, daysOffset);
    const intervalLabel = daysOffset === 7
      ? '1. pooperačná kontrola / preväz (7 dní)'
      : daysOffset === 14
      ? 'Vybratie stehov / hygiena (14 dní)'
      : `Pooperačná kontrola (+${daysOffset} dní)`;

    setNewEvent({
      roomId: 'ambulancia',
      type: 'kontrola',
      status: 'planned',
      title: `Pooperačná kontrola — ${evt.title}`,
      patientId: evt.patientId || '',
      patientName: evt.patientName,
      patientPhone: getEventPhone(evt),
      patientEmail: getEventEmail(evt),
      doctorName: evt.operator || evt.doctorName || 'MUDr. Ján Mráz',
      assignedTo: evt.operator || evt.doctorName || 'MUDr. Ján Mráz',
      date: targetDate,
      startTime: '09:00',
      endTime: '09:30',
      isAllDay: false,
      operationTitle: evt.title,
      operationDate: evt.date,
      operationDoctor: evt.operator || evt.doctorName || 'MUDr. Ján Mráz',
      operationNotes: [
        ...(evt.materials || []),
        evt.materialNotes || ''
      ].filter(Boolean).join(', '),
      controlInterval: intervalLabel,
      totalPrice: 0,
      depositAmount: 0,
      isDepositPaid: false,
      notes: `Kontrola po zákroku: ${evt.title} (operované ${evt.date}).`
    });
    setIsAddingEvent(true);
  }, [getEventPhone, getEventEmail]);

  const handleConfirmCancelEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingEvent) return;

    const finalReason = cancelReasonInput === 'Iné (vlastný dôvod)' ? customCancelReason : cancelReasonInput;

    const cancelledEvent: CalendarEvent = {
      ...cancellingEvent,
      isCancelled: true,
      status: 'cancelled',
      cancelReason: finalReason
    };

    commitEventsUpdate(prev => prev.map(evt => evt.id === cancellingEvent.id ? cancelledEvent : evt));

    if (selectedEvent && selectedEvent.id === cancellingEvent.id) {
      setSelectedEvent(cancelledEvent);
    }

    setCancellingEvent(null);
    setCustomCancelReason('');

    try {
      const targetGId = cancelledEvent.googleEventId || (cancelledEvent.id.startsWith('gcal-') ? cancelledEvent.id.replace('gcal-', '') : null);
      if (targetGId) {
        await updateGoogleCalendarEvent({ ...cancelledEvent, googleEventId: targetGId }, session);
      }
    } catch (err) {
      console.error('Chyba zápisu storna do Google Kalendára:', err);
    }
  };

  const handleReplaceCancelledWithWaitingList = async (entry: WaitingListEntry) => {
    if (!cancellingEvent) return;

    const finalReason = cancelReasonInput === 'Iné (vlastný dôvod)'
      ? (customCancelReason || 'Nahradené pacientom z čakacej listiny')
      : `${cancelReasonInput} (nahradené z čakacej listiny: ${entry.patientName})`;

    const cancelledEvent: CalendarEvent = {
      ...cancellingEvent,
      isCancelled: true,
      status: 'cancelled',
      cancelReason: finalReason,
    };

    const startMin = timeToMinutes(cancellingEvent.startTime || '09:00');
    const endMin = Math.min(DAY_END_HOUR * 60, startMin + (entry.durationMinutes || 60));
    const ensuredPatId = ensurePatientInDatabase({
      patientId: entry.patientId,
      patientName: entry.patientName,
      patientPhone: entry.patientPhone,
      patientEmail: entry.patientEmail,
      type: entry.type,
    });

    const replacementEvent: CalendarEvent = {
      id: `evt-wl-${Date.now()}`,
      patientId: ensuredPatId,
      patientName: entry.patientName,
      patientPhone: entry.patientPhone || '',
      patientEmail: entry.patientEmail || '',
      doctorName: entry.preferredDoctor || cancellingEvent.doctorName || 'MUDr. Ján Mráz',
      assignedTo: entry.preferredDoctor || cancellingEvent.assignedTo || 'MUDr. Ján Mráz',
      operator: entry.preferredDoctor || cancellingEvent.operator || 'MUDr. Ján Mráz',
      roomId: cancellingEvent.roomId || entry.roomId || 'sala_say',
      title: entry.procedureTitle || cancellingEvent.title,
      date: cancellingEvent.date,
      startTime: cancellingEvent.startTime,
      endTime: minutesToTimeStr(endMin),
      isAllDay: false,
      type: entry.type || cancellingEvent.type,
      status: 'confirmed',
      anesthesiaType: entry.anesthesiaType || cancellingEvent.anesthesiaType || 'TIVA',
      clinicStay: entry.type === 'operacia' ? 'dospanie' : 'ambulantne',
      totalPrice: entry.totalPrice ?? cancellingEvent.totalPrice ?? 0,
      depositAmount: entry.depositAmount ?? 0,
      isDepositPaid: !!entry.isDepositPaid,
      notes: `Obsadené z čakacej listiny (pôvodný termín: ${cancellingEvent.patientName}). ${entry.notes || ''}`.trim(),
      calendarId: cancellingEvent.calendarId || 'primary',
    };

    commitEventsUpdate(prev => [
      replacementEvent,
      ...prev.map(evt => (evt.id === cancellingEvent.id ? cancelledEvent : evt)),
    ]);

    commitWaitingListUpdate(prev => prev.filter(w => w.id !== entry.id));

    setCancellingEvent(null);
    setCustomCancelReason('');
    showToast(`⚡ Termín bol obsadený pacientom ${entry.patientName} z čakacej listiny!`);

    try {
      const targetGId = cancelledEvent.googleEventId || (cancelledEvent.id.startsWith('gcal-') ? cancelledEvent.id.replace('gcal-', '') : null);
      if (targetGId) {
        updateGoogleCalendarEvent({ ...cancelledEvent, googleEventId: targetGId }, session).catch(() => {});
      }
      createGoogleCalendarEvent(replacementEvent, session).then(res => {
        if (res.success && res.googleEventId) {
          commitEventsUpdate(prev => prev.map(e => e.id === replacementEvent.id ? { ...e, googleEventId: res.googleEventId, isGoogleSynced: true } : e));
        }
      }).catch(() => {});
    } catch {}
  };

  const handleSaveModalEditedEvent = async (eventData: Partial<CalendarEvent>) => {
    if (!eventData.id) return;

    const ensuredPatientId = ensurePatientInDatabase(eventData);
    const finalStartTime = eventData.isAllDay ? '00:00' : (eventData.startTime || '09:00');
    const finalEndTime = eventData.isAllDay ? '23:59' : (eventData.endTime || '10:00');

    const updatedEvent = {
      ...eventData,
      patientId: ensuredPatientId || eventData.patientId || '',
      startTime: finalStartTime,
      endTime: finalEndTime
    } as CalendarEvent;

    commitEventsUpdate(prev => prev.map(evt => evt.id === eventData.id ? updatedEvent : evt));

    if (selectedEvent && selectedEvent.id === eventData.id) {
      setSelectedEvent(updatedEvent);
    }

    setIsEditingEvent(false);

    try {
      const targetGId = updatedEvent.googleEventId || (updatedEvent.id.startsWith('gcal-') ? updatedEvent.id.replace('gcal-', '') : null);
      if (targetGId) {
        await updateGoogleCalendarEvent({ ...updatedEvent, googleEventId: targetGId }, session);
      } else {
        const res = await createGoogleCalendarEvent(updatedEvent, session);
        if (res.success && res.googleEventId) {
          commitEventsUpdate(prev => prev.map(e => e.id === updatedEvent.id ? { ...e, googleEventId: res.googleEventId, isGoogleSynced: true } : e));
        }
      }
    } catch (err) {
      console.error('Chyba aktualizácie do Google Kalendára:', err);
    }
  };

  const handleDeleteCalendarEvent = useCallback(async (eventToDelete: CalendarEvent | Partial<CalendarEvent>) => {
    if (!eventToDelete.id) return;
    const targetId = eventToDelete.id;
    const gId = eventToDelete.googleEventId || (targetId.startsWith('gcal-') ? targetId.replace('gcal-', '') : targetId);

    commitEventsUpdate(prev => prev.filter(e => e.id !== targetId && e.googleEventId !== targetId && e.id !== gId));

    if (selectedEvent && (selectedEvent.id === targetId || selectedEvent.googleEventId === targetId)) {
      setSelectedEvent(null);
    }
    setIsEditingEvent(false);

    try {
      await deleteGoogleCalendarEvent(gId, eventToDelete.calendarId || 'primary', session);
    } catch (err) {
      console.error('Chyba zmazania z Google Kalendára:', err);
    }
  }, [commitEventsUpdate, selectedEvent, session]);

  const handleOpenFolderForEvent = useCallback((event: CalendarEvent) => {
    if (!onOpenPatientFolder) return;
    if (event.patientId) {
      onOpenPatientFolder(event.patientId, event.patientName);
      return;
    }
    const matched = patients.find(p => p.name.toLowerCase().includes((event.patientName || '').toLowerCase()));
    if (matched) {
      onOpenPatientFolder(matched.id, matched.name);
    } else if (event.patientName) {
      onOpenPatientFolder('', event.patientName);
    } else {
      alert('Pacient nebol nájdený v kartotéke.');
    }
  }, [onOpenPatientFolder, patients]);

  // Odber akcií z pravého kliknutia (GlobalContextMenu)
  useEffect(() => {
    const handleContextAction = (e: Event) => {
      const custom = e as CustomEvent<{ eventId: string; action: string }>;
      if (!custom.detail?.eventId) return;
      const target = calendarEvents.find(ev => ev.id === custom.detail.eventId);
      if (!target) return;

      switch (custom.detail.action) {
        case 'detail':
          setSelectedEvent(target);
          break;
        case 'edit':
          setEditingEventData(target);
          setIsEditingEvent(true);
          break;
        case 'folder':
          handleOpenFolderForEvent(target);
          break;
        case 'deposit':
          updateDepositStatus(target.id, !target.isDepositPaid);
          break;
        case 'duplicate':
          handleDuplicateEvent(target);
          break;
        case 'cancel':
          setCancellingEvent(target);
          break;
        case 'delete':
          if (window.confirm(`Naozaj chcete natrvalo zmazať udalosť "${target.title}"?`)) {
            handleDeleteCalendarEvent(target);
          }
          break;
      }
    };

    window.addEventListener('say_calendar_context_action', handleContextAction);
    const handleOpenAddEvent = (e: any) => {
      if (e.detail?.date) {
        setNewEvent((prev: any) => ({ ...prev, date: e.detail.date }));
      }
      setIsAddingEvent(true);
    };
    window.addEventListener('say_open_add_calendar_event', handleOpenAddEvent);

    return () => {
      window.removeEventListener('say_calendar_context_action', handleContextAction);
      window.removeEventListener('say_open_add_calendar_event', handleOpenAddEvent);
    };
  }, [calendarEvents, handleOpenFolderForEvent, updateDepositStatus, handleDuplicateEvent, handleDeleteCalendarEvent]);

  const sendWhatsApp = (evt: CalendarEvent) => {
    const phone = getEventPhone(evt);
    if (!phone) {
      alert('Prosím, zadajte najprv telefónne číslo pacienta.');
      return;
    }
    const cleanPhone = phone.replace(/[\s\+\-]/g, '');
    const phoneWithPrefix = cleanPhone.startsWith('421') || cleanPhone.startsWith('420') 
      ? cleanPhone : `421${cleanPhone.replace(/^0/, '')}`;

    const formattedDate = parseLocalDate(evt.date).toLocaleDateString('sk-SK');
    const msg = `Dobrý deň ${evt.patientName || ''}, pripomíname Vám Váš termín (${evt.title}) na SAY CLINIC dňa ${formattedDate}${evt.isAllDay ? '' : ` o ${evt.startTime}`}. Adresa: Lazovná 43, Banská Bystrica. Prosíme o potvrdenie.`;

    window.open(`https://wa.me/${phoneWithPrefix}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const sendSMS = (evt: CalendarEvent) => {
    const phone = getEventPhone(evt);
    if (!phone) {
      alert('Prosím, zadajte najprv telefónne číslo pacienta.');
      return;
    }
    const formattedDate = parseLocalDate(evt.date).toLocaleDateString('sk-SK');
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
      const formattedDate = parseLocalDate(evt.date).toLocaleDateString('sk-SK');
      
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
      const token = await getCalendarAuthToken(session);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/gmail/send', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          toEmail: email,
          subject: emailSubject,
          bodyHtml: emailBody.replace(/\n/g, '<br/>'),
          attachInvoice: attachAdvanceInvoice,
          attachInstructions: attachInstructions,
          attachPreOp: attachPreOpInstructions
        })
      });

      const resData = await res.json().catch(() => ({}));
      if (res.ok && resData.success !== false) {
        alert(`✉️ E-mail bol úspešne odoslaný cez Gmail na ${email}!`);
        setOpenEmailEventId(null);
      } else {
        alert(resData.error || 'Nepodarilo sa odoslať e-mail. Skontrolujte pripojenie Google Workspace.');
      }
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Chyba pri odosielaní e-mailu.');
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

  const navigate = (direction: -1 | 1 | 0) => {
    if (direction === 0) return setCurrentDate(new Date());
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 12, 0, 0);
    if (view === 'day' || view === 'agenda') newDate.setDate(newDate.getDate() + direction);
    if (view === 'week') newDate.setDate(newDate.getDate() + (direction * 7));
    if (view === 'month') newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const handleGoogleConnect = async () => {
    if (isGoogleConnected) {
      await performTwoWaySync(false);
    } else {
      try {
        const res = await googleSignIn();
        if (res?.accessToken) {
          await performTwoWaySync(false);
        }
      } catch (err: any) {
        if (err?.code !== 'auth/popup-closed-by-user') {
          signIn('google');
        }
      }
    }
  };

  const handleOpenAddEventModal = (overrideDate?: string) => {
    const defaultRoom = isRudlovaOnly ? 'sala_rudlova' : (selectedRoomId !== 'all' ? selectedRoomId : 'sala_say');
    const defaultType: EventType = defaultRoom === 'ambulancia' ? 'konzultacia' 
      : defaultRoom === 'dospavacia_izba' ? 'kontrola' 
      : 'operacia';
    const defaultStaff = selectedStaffFilter !== 'all' ? selectedStaffFilter : 'MUDr. Ján Mráz';

    setNewEvent({
      roomId: defaultRoom,
      assignedTo: defaultStaff,
      doctorName: defaultStaff,
      operator: defaultStaff,
      date: overrideDate || formatLocalDate(currentDate),
      startTime: '09:00',
      endTime: defaultType === 'operacia' ? '11:00' : '09:30',
      isAllDay: false,
      title: '',
      patientName: '',
      type: defaultType,
      status: 'planned',
      freeformCategory: 'obed',
      totalPrice: defaultType === 'operacia' ? 3500 : (defaultType === 'konzultacia' ? 50 : 0),
      depositAmount: defaultType === 'operacia' ? 500 : 0,
      isDepositPaid: false,
      specialEquipment: [],
      specialEquipmentOther: '',
      materials: [],
      materialNotes: ''
    });
    setIsAddingEvent(true);
  };

  const handleSaveModalCreatedEvent = async (
    eventData: Partial<CalendarEvent>,
    extraOptions?: EventSaveExtraOptions
  ) => {
    setIsSaving(true);
    const ensuredPatientId = ensurePatientInDatabase(eventData);
    const finalStartTime = eventData.isAllDay ? '00:00' : (eventData.startTime || '09:00');
    const finalEndTime = eventData.isAllDay ? '23:59' : (eventData.endTime || '10:00');
    const baseDateStr = eventData.date || formatLocalDate(currentDate);

    // Výpočet dátumov pri opakovaní
    const targetDates: string[] = [baseDateStr];
    const rule = extraOptions?.recurrenceRule || 'none';
    const count = Math.max(2, Math.min(12, extraOptions?.recurrenceCount || 4));

    if (rule === 'workdays_week') {
      const baseD = parseLocalDate(baseDateStr);
      const dayOfWeek = baseD.getDay();
      const diffToMonday = baseD.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(baseD.getFullYear(), baseD.getMonth(), diffToMonday, 12, 0, 0);
      targetDates.length = 0;
      for (let i = 0; i < 5; i++) {
        const wd = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i, 12, 0, 0);
        targetDates.push(formatLocalDate(wd));
      }
    } else if (rule === 'weekly' || rule === 'biweekly') {
      const stepDays = rule === 'weekly' ? 7 : 14;
      const baseD = parseLocalDate(baseDateStr);
      for (let i = 1; i < count; i++) {
        const nextD = new Date(baseD.getFullYear(), baseD.getMonth(), baseD.getDate() + i * stepDays, 12, 0, 0);
        targetDates.push(formatLocalDate(nextD));
      }
    } else if (rule === 'monthly') {
      const baseD = parseLocalDate(baseDateStr);
      for (let i = 1; i < count; i++) {
        const nextD = new Date(baseD.getFullYear(), baseD.getMonth() + i, baseD.getDate(), 12, 0, 0);
        targetDates.push(formatLocalDate(nextD));
      }
    }

    const generatedEvents: CalendarEvent[] = [];
    const baseTimestamp = Date.now();

    targetDates.forEach((dStr, idx) => {
      const mainId = `evt-${baseTimestamp}-${idx}`;
      const mainEvt: CalendarEvent = {
        id: mainId,
        patientName: eventData.patientName || (eventData.type === 'volno' ? 'Personál kliniky' : 'Bez mena'),
        patientPhone: eventData.patientPhone || '',
        patientEmail: eventData.patientEmail || '',
        doctorName: eventData.doctorName || eventData.assignedTo || 'MUDr. Ján Mráz',
        assignedTo: eventData.assignedTo || eventData.doctorName || 'MUDr. Ján Mráz',
        roomId: eventData.roomId || (eventData.type === 'operacia' ? 'sala_say' : 'ambulancia'),
        title: eventData.title || (eventData.type === 'volno' ? 'Interná udalosť' : 'Nový termín'),
        date: dStr,
        startTime: finalStartTime,
        endTime: finalEndTime,
        isAllDay: eventData.isAllDay || false,
        type: eventData.type || 'operacia',
        status: eventData.status || 'planned',
        freeformCategory: eventData.freeformCategory,
        anesthesiaType: eventData.anesthesiaType || 'TIVA',
        clinicStay: eventData.clinicStay || 'dospanie',
        operator: eventData.operator || eventData.doctorName || 'MUDr. Ján Mráz',
        anesthesiologist: eventData.anesthesiologist || 'MUDr. Martin Kasáč',
        anesthesiaNurse: eventData.anesthesiaNurse || 'Denisa Halajová',
        scrubNurse: eventData.scrubNurse || 'Katarína Otiepková',
        specialEquipment: eventData.specialEquipment || [],
        specialEquipmentOther: eventData.specialEquipmentOther || '',
        materials: eventData.materials || [],
        materialNotes: eventData.materialNotes || '',
        calendarId: eventData.calendarId || (selectedCalendarId !== 'all' ? selectedCalendarId : 'primary'),
        notes: eventData.notes || '',
        totalPrice: Number(eventData.totalPrice) || 0,
        depositAmount: Number(eventData.depositAmount) || 0,
        isDepositPaid: eventData.isDepositPaid || false,
        preOpExamReady: eventData.preOpExamReady || false,
        materialsReady: eventData.materialsReady || false,
        consentsSigned: eventData.consentsSigned || false,
        operationTitle: eventData.operationTitle || '',
        operationDate: eventData.operationDate || '',
        operationRecordId: eventData.operationRecordId || '',
        operationDoctor: eventData.operationDoctor || '',
        operationNotes: eventData.operationNotes || '',
        controlInterval: eventData.controlInterval || '',
        patientId: ensuredPatientId || eventData.patientId || ''
      };

      generatedEvents.push(mainEvt);

      // Nadväzujúce bloky po operácii (Sanitácia sály a Dospávacia izba)
      if (mainEvt.type === 'operacia' && !mainEvt.isAllDay) {
        const opEndMin = timeToMinutes(mainEvt.endTime);

        if (extraOptions?.autoCreateSanitationBlock) {
          const sanDur = extraOptions.sanitationMinutes || 20;
          const sanEndMin = Math.min(23 * 60 + 59, opEndMin + sanDur);
          generatedEvents.push({
            id: `${mainId}-san`,
            parentEventId: mainId,
            patientName: 'Personál kliniky',
            doctorName: mainEvt.scrubNurse || 'Tím sály',
            assignedTo: mainEvt.scrubNurse || 'Tím sály',
            roomId: mainEvt.roomId,
            title: `🧼 Sanitácia a príprava sály (po: ${mainEvt.patientName})`,
            date: dStr,
            startTime: mainEvt.endTime,
            endTime: minutesToTimeStr(sanEndMin),
            isAllDay: false,
            type: 'volno',
            freeformCategory: 'sanitarny_den',
            status: 'planned',
            calendarId: mainEvt.calendarId,
            notes: `Automatický blok dezinfekcie a prípravy sály po zákroku ${mainEvt.title} (${mainEvt.patientName}).`,
          });
        }

        if (extraOptions?.autoCreateRecoveryBlock) {
          const recDur = extraOptions.recoveryMinutes || 120;
          const recEndMin = Math.min(23 * 60 + 59, opEndMin + recDur);
          generatedEvents.push({
            id: `${mainId}-rec`,
            parentEventId: mainId,
            patientId: mainEvt.patientId,
            patientName: mainEvt.patientName,
            patientPhone: mainEvt.patientPhone,
            patientEmail: mainEvt.patientEmail,
            doctorName: mainEvt.anesthesiaNurse || mainEvt.operator || 'Služba izby',
            assignedTo: mainEvt.anesthesiaNurse || mainEvt.operator || 'Služba izby',
            roomId: 'dospavacia_izba',
            title: `🛏️ Pooperačné dospávanie — ${mainEvt.title}`,
            date: dStr,
            startTime: mainEvt.endTime,
            endTime: minutesToTimeStr(recEndMin),
            isAllDay: false,
            type: 'kontrola',
            status: 'planned',
            operationTitle: mainEvt.title,
            operationDate: dStr,
            operationDoctor: mainEvt.operator || mainEvt.doctorName,
            calendarId: mainEvt.calendarId,
            notes: `Pooperačné monitorovanie na dospávacej izbe (${mainEvt.anesthesiaType || 'TIVA'}).`,
          });
        }
      }
    });

    commitEventsUpdate(prev => [...generatedEvents, ...prev]);

    if (onAddEvent && generatedEvents[0]) onAddEvent(generatedEvents[0]);
    if (generatedEvents.length > 1) {
      showToast(`✅ Vytvorených ${generatedEvents.length} prepojených záznamov v kalendári`);
    }
    setIsSaving(false);
    setIsAddingEvent(false);

    // Synchronizácia vytvorených udalostí do Google Kalendára
    for (const ev of generatedEvents) {
      try {
        const gRes = await createGoogleCalendarEvent(ev, session);
        if (gRes.success && gRes.googleEventId) {
          commitEventsUpdate(prev => prev.map(e => e.id === ev.id ? { ...e, googleEventId: gRes.googleEventId, isGoogleSynced: true } : e));
        }
      } catch (err) {
        console.error('Chyba vytvorenia udalosti na Google Kalendári:', err);
      }
    }
  };

  // Tlač čistého denného / týždenného operačného a ambulantného rozpisu
  const handlePrintSchedule = () => {
    const printEvents = [...periodEvents]
      .filter(e => !e.isCancelled)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return (a.startTime || '').localeCompare(b.startTime || '');
      });

    const periodTitle = view === 'day'
      ? currentDate.toLocaleDateString('sk-SK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      : `${parseLocalDate(currentPeriodDates.start).toLocaleDateString('sk-SK')} – ${parseLocalDate(currentPeriodDates.end).toLocaleDateString('sk-SK')}`;

    const win = window.open('', '_blank', 'width=960,height=800');
    if (!win) return;

    const rowsHtml = printEvents.map(ev => {
      const room = getRoomInfo(ev.roomId);
      const timeStr = ev.isAllDay ? 'Celý deň' : `${ev.startTime} – ${ev.endTime}`;
      const details = ev.type === 'operacia'
        ? `Anestézia: <b>${ev.anesthesiaType || 'TIVA'}</b> | Pobyt: <b>${ev.clinicStay || 'dospanie'}</b> | Tím: ${ev.operator || ev.doctorName}, Anest: ${ev.anesthesiologist || '-'}, Inštrum: ${ev.scrubNurse || '-'}${ev.materialNotes ? `<br/>Materiál: ${ev.materialNotes}` : ''}`
        : `Lekár: ${ev.assignedTo || ev.doctorName}${ev.notes ? ` | Pozn: ${ev.notes}` : ''}`;

      return `
        <tr>
          <td style="padding:8px;border:1px solid #ddd;font-family:monospace;font-weight:bold;white-space:nowrap;">
            ${view !== 'day' ? `${parseLocalDate(ev.date).toLocaleDateString('sk-SK')}<br/>` : ''}${timeStr}
          </td>
          <td style="padding:8px;border:1px solid #ddd;font-weight:bold;">${room.name}</td>
          <td style="padding:8px;border:1px solid #ddd;text-transform:uppercase;font-size:11px;font-weight:bold;">${getEventTypeLabel(ev.type, ev.freeformCategory)}</td>
          <td style="padding:8px;border:1px solid #ddd;">
            <div style="font-weight:bold;font-size:13px;">${ev.title}</div>
            <div style="font-size:11px;color:#555;">${details}</div>
          </td>
          <td style="padding:8px;border:1px solid #ddd;">
            <b>${ev.patientName || '-'}</b><br/>
            <span style="font-size:11px;color:#555;">${getEventPhone(ev) || ''}</span>
          </td>
        </tr>
      `;
    }).join('');

    win.document.write(`
      <html>
        <head>
          <title>SAY CLINIC — Rozpis termínov (${periodTitle})</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #2C2A29; padding: 24px; }
            h1 { font-size: 18px; text-transform: uppercase; margin-bottom: 4px; }
            p.sub { font-size: 12px; color: #666; margin-top: 0; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { background: #FBF9F6; text-align: left; padding: 8px; border: 1px solid #ddd; text-transform: uppercase; font-size: 10px; }
          </style>
        </head>
        <body>
          <h1>SAY CLINIC — Harmonogram a Operačný Program</h1>
          <p class="sub">Obdobie: <b>${periodTitle}</b> • Počet aktívnych záznamov: ${printEvents.length}</p>
          <table>
            <thead>
              <tr>
                <th>Čas</th>
                <th>Miestnosť / Sála</th>
                <th>Typ</th>
                <th>Výkon & Protokol</th>
                <th>Pacient & Kontakt</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="5" style="padding:16px;text-align:center;">Žiadne naplánované udalosti</td></tr>'}
            </tbody>
          </table>
          <script>window.onload = () => { window.print(); };</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  // NAŤAHOVANIE MYŠOU (RESIZE OKRAJA PRE TRVANIE UDALOSTI)
  const handleMouseDownResize = (e: React.MouseEvent, evt: CalendarEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const startY = e.clientY;
    const startEndMin = timeToMinutes(evt.endTime);
    const pxPerMin = hourHeight / 60;
    let latestEndTimeStr = evt.endTime;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const snapInterval = hourHeight >= 140 ? 5 : 15;
      const deltaMinutes = Math.round((deltaY / pxPerMin) / snapInterval) * snapInterval;
      const newEndMin = Math.max(timeToMinutes(evt.startTime) + snapInterval, Math.min(DAY_END_HOUR * 60, startEndMin + deltaMinutes));
      latestEndTimeStr = minutesToTimeStr(newEndMin);

      setCalendarEvents(prev => prev.map(item => item.id === evt.id ? { ...item, endTime: latestEndTimeStr } : item));
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      
      let resizedEvent: CalendarEvent | null = null;
      commitEventsUpdate(prev => prev.map(item => {
        if (item.id === evt.id) {
          resizedEvent = { ...item, endTime: latestEndTimeStr };
          return resizedEvent;
        }
        return item;
      }));

      if (resizedEvent) {
        const targetEvt: CalendarEvent = resizedEvent;
        const targetGId = targetEvt.googleEventId || (targetEvt.id.startsWith('gcal-') ? targetEvt.id.replace('gcal-', '') : null);
        if (targetGId) {
          updateGoogleCalendarEvent({ ...targetEvt, googleEventId: targetGId }, session).catch(err =>
            console.error('Chyba update po resize:', err)
          );
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // PRESÚVANIE MYŠOU (DRAG & DROP PRE ZMENU ČASU AJ DŇA V TÝŽDNI)
  const handleMouseDownDrag = (e: React.MouseEvent, evt: CalendarEvent) => {
    if (e.button !== 0) return; // Ignorovať pravý klik
    const target = e.target as HTMLElement;
    
    if (target.tagName.toLowerCase() === 'button' || target.tagName.toLowerCase() === 'input' || target.closest('.resize-handle')) {
      return;
    }

    e.preventDefault(); 
    e.stopPropagation();

    let dragged = false;
    const startY = e.clientY;
    const startX = e.clientX;
    const originalStartMin = timeToMinutes(evt.startTime);
    const durationMin = Math.max(15, timeToMinutes(evt.endTime) - timeToMinutes(evt.startTime));
    const pxPerMin = hourHeight / 60;
    let latestStartStr = evt.startTime;
    let latestEndStr = evt.endTime;
    let latestDateStr = evt.date;
    let latestRoomId = evt.roomId || (evt.type === 'operacia' ? 'sala_say' : 'ambulancia');

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const deltaX = moveEvent.clientX - startX;
      
      if (Math.abs(deltaY) > 5 || Math.abs(deltaX) > 10) dragged = true;

      if (dragged) {
        const snapInterval = hourHeight >= 140 ? 5 : 15;
        const deltaMinutes = Math.round((deltaY / pxPerMin) / snapInterval) * snapInterval;
        let newStartMin = originalStartMin + deltaMinutes;
        
        if (newStartMin < DAY_START_HOUR * 60) newStartMin = DAY_START_HOUR * 60;
        if (newStartMin + durationMin > DAY_END_HOUR * 60) newStartMin = DAY_END_HOUR * 60 - durationMin;
        
        const newEndMin = newStartMin + durationMin;
        latestStartStr = minutesToTimeStr(newStartMin);
        latestEndStr = minutesToTimeStr(newEndMin);

        // Detekcia stĺpca dňa alebo miestnosti pri presune
        const elUnderMouse = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
        const dayCol = elUnderMouse?.closest('[data-day-date]');
        const hoveredDate = dayCol?.getAttribute('data-day-date');
        if (hoveredDate) {
          latestDateStr = hoveredDate;
        }
        const roomCol = elUnderMouse?.closest('[data-room-id]');
        const hoveredRoom = roomCol?.getAttribute('data-room-id');
        if (hoveredRoom) {
          latestRoomId = hoveredRoom;
        }

        setCalendarEvents(prev => prev.map(item => 
          item.id === evt.id
            ? { ...item, date: latestDateStr, roomId: latestRoomId, startTime: latestStartStr, endTime: latestEndStr }
            : item
        ));
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      
      if (!dragged) {
        setSelectedEvent(evt);
      } else {
        let movedEvent: CalendarEvent | null = null;
        commitEventsUpdate(prev => prev.map(item => {
          if (item.id === evt.id) {
            movedEvent = { ...item, date: latestDateStr, roomId: latestRoomId, startTime: latestStartStr, endTime: latestEndStr };
            return movedEvent;
          }
          return item;
        }));

        if (movedEvent) {
          const targetEvt: CalendarEvent = movedEvent;
          const targetGId = targetEvt.googleEventId || (targetEvt.id.startsWith('gcal-') ? targetEvt.id.replace('gcal-', '') : null);
          if (targetGId) {
            updateGoogleCalendarEvent({ ...targetEvt, googleEventId: targetGId }, session).catch(err =>
              console.error('Chyba update po presune:', err)
            );
          }
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // ŤAHANIE MYŠOU PO ČASOVEJ OSI PRE VYTVORENIE NOVEJ UDALOSTI
  const handleMouseDownCreate = (e: React.MouseEvent, targetDate: string, targetRoomId?: string) => {
    if (e.button !== 0) return;
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
    const dayStartMin = DAY_START_HOUR * 60;
    const dayEndMin = DAY_END_HOUR * 60;

    const rawMin = dayStartMin + Math.floor(startY / pxPerMin);
    const snapInterval = hourHeight >= 140 ? 5 : 15;
    const startMin = Math.max(dayStartMin, Math.min(dayEndMin - snapInterval, Math.floor(rawMin / snapInterval) * snapInterval));
    const initialEndMin = Math.min(dayEndMin, startMin + 30);

    let hasMoved = false;
    let currentEnd = initialEndMin;

    setIsCreatingDrag(true);
    setCreateDragDate(targetDate);
    setCreateDragRoomId(targetRoomId || '');
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
      setCreateDragRoomId('');

      let finalStart = startMin;
      let finalEnd = currentEnd;

      if (!hasMoved) {
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

      const defaultRoom = isRudlovaOnly ? 'sala_rudlova' : (targetRoomId || (selectedRoomId !== 'all' ? selectedRoomId : 'sala_say'));
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
        status: 'planned',
        specialEquipment: [],
        specialEquipmentOther: '',
        materials: [],
        materialNotes: '',
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
    const isMedium = height >= 46 && height < 88;
    const durationMin = Math.max(15, timeToMinutes(evt.endTime) - timeToMinutes(evt.startTime));
    const room = getRoomInfo(evt.roomId);
    const statusInfo = getEventStatusInfo(evt.status, evt.isCancelled);
    const docScheme = getDoctorColorScheme(evt.operator || evt.assignedTo || evt.doctorName);
    const surgeryReadiness = evt.type === 'operacia' ? getSurgeryReadinessSummary(evt) : null;

    const now = new Date();
    const todayStr = formatLocalDate(now);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const evtStartMin = timeToMinutes(evt.startTime);
    const evtEndMin = timeToMinutes(evt.endTime) || (evtStartMin + 30);
    const isOngoing = evt.date === todayStr && !evt.isCancelled && nowMinutes >= evtStartMin && nowMinutes < evtEndMin;

    const cardColorClasses = evt.isCancelled 
      ? 'bg-gray-100 border-gray-300 opacity-60 line-through' 
      : colorMode === 'doctor'
      ? `${docScheme.cardBg} border-l-4 ${docScheme.borderAccent}`
      : evt.type === 'operacia'
      ? 'bg-white border-[#2C2A29] border-l-4 border-l-[#2C2A29]'
      : evt.type === 'konzultacia'
      ? 'bg-[#FBF9F6] border-[#C5A059] border-l-4 border-l-[#C5A059]'
      : evt.type === 'osetrenie'
      ? 'bg-emerald-50/90 border-emerald-500 border-l-4 border-l-emerald-600'
      : evt.type === 'volno'
      ? 'bg-indigo-50/90 border-indigo-500 border-l-4 border-l-indigo-600'
      : 'bg-blue-50/90 border-blue-400 border-l-4 border-l-blue-500';

    return (
      <div 
        key={evt.id} 
        data-event-id={evt.id}
        onMouseDown={(e) => handleMouseDownDrag(e, evt)}
        className={`absolute rounded-xl p-2 shadow-xs border pointer-events-auto cursor-move active:cursor-grabbing transition-all hover:shadow-md flex flex-col justify-between z-10 overflow-hidden group/card ${
          isOngoing ? 'ring-2 ring-[#C5A059] shadow-lg shadow-[#C5A059]/25 z-20 border-[#C5A059]' : ''
        } ${cardColorClasses}`}
        style={{ 
          top: `${top}px`, 
          height: `${height}px`,
          left,
          width,
        }}
      >
        {isCompact ? (
          <div className="flex items-center gap-1.5 h-full truncate pointer-events-none">
            {isOngoing ? (
              <span className="w-2 h-2 rounded-full bg-[#C5A059] animate-ping shrink-0" title="Práve prebieha" />
            ) : (
              evt.type !== 'volno' && (
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusInfo.dotColor}`} title={statusInfo.label} />
              )
            )}
            <span className="font-mono text-[9px] font-bold text-[#2C2A29] shrink-0 leading-none">
              {evt.startTime}
            </span>
            <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-black/5 shrink-0" title={room.name}>
              {room.icon}
            </span>
            <span className="text-[10px] font-bold text-[#2C2A29] truncate leading-none">
              {evt.type === 'volno' ? evt.title : (evt.patientName || evt.title)}
            </span>
            {surgeryReadiness && !evt.isCancelled && (
              <span className={`ml-auto text-[8px] font-black px-1 py-0.2 rounded border shrink-0 ${surgeryReadiness.badgeClass}`} title={surgeryReadiness.statusLabel}>
                🚦 {surgeryReadiness.readyCount}/4
              </span>
            )}
          </div>
        ) : isMedium ? (
          <div className="flex-1 overflow-hidden pointer-events-none flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="font-mono text-[10px] font-bold text-[#2C2A29] bg-black/5 px-1 rounded flex items-center gap-1">
                  <span>{room.icon}</span> {evt.startTime} - {evt.endTime}
                </span>
                <div className="flex items-center gap-1">
                  {isOngoing && (
                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-[#C5A059] text-white flex items-center gap-1 shadow-2xs animate-pulse shrink-0">
                      <span className="w-1 h-1 rounded-full bg-white"></span>
                      <span>PREBIEHA</span>
                    </span>
                  )}
                  <div className="scale-90 origin-right">{getEventTypeBadge(evt.type, evt.freeformCategory)}</div>
                </div>
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
                    {surgeryReadiness && !evt.isCancelled && (
                      <div className="flex items-center gap-0.5 ml-auto bg-white/90 px-1 py-0.2 rounded border border-[#E0D8C8]">
                        {surgeryReadiness.items.map(it => (
                          <span
                            key={it.key}
                            title={`${it.label}: ${it.ready ? 'Pripravené' : 'Chýba'}`}
                            className={`text-[8px] px-0.5 rounded font-bold ${it.ready ? 'text-emerald-700 bg-emerald-100/80' : 'text-rose-600 opacity-50'}`}
                          >
                            {it.icon}{it.ready ? '✓' : '·'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (evt.type === 'kontrola' || evt.operationTitle) ? (
                <div className="space-y-0.5">
                  <p className="text-[10px] text-[#2C2A29] truncate font-bold">
                    👤 {evt.patientName || 'Bez mena'}
                  </p>
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-100 text-sky-900 border border-sky-300 truncate max-w-[180px]" title={evt.operationTitle || 'Pooperačná kontrola'}>
                      🔍 Po: {evt.operationTitle || 'operácii'}
                    </span>
                    {evt.operationDate && (
                      <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-blue-600 text-white shadow-2xs">
                        op. {evt.operationDate.split('-').reverse().slice(0, 2).join('.')}
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
          /* DETAILNÝ REŽIM PRI ZVÄČŠENOM ROZOSTUPE (ZOOM) */
          <div className="flex-1 overflow-hidden pointer-events-none space-y-1">
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <span className="font-mono text-xs font-bold text-[#2C2A29] bg-black/5 px-1.5 py-0.5 rounded">
                {evt.startTime} – {evt.endTime} ({durationMin}m)
              </span>
              <div className="flex items-center gap-1">
                {isOngoing && (
                  <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-[#C5A059] text-white flex items-center gap-1 shadow-xs animate-pulse shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                    <span>PRÁVE PREBIEHA</span>
                  </span>
                )}
                {evt.type !== 'volno' && evt.status && evt.status !== 'planned' && !evt.isCancelled && (
                  <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded border ${statusInfo.badge}`}>
                    {statusInfo.icon} {statusInfo.shortLabel}
                  </span>
                )}
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
                  {/* PREDOPERAČNÝ SEMAFOR PRIAMO NA KARTE OPERÁCIE */}
                  {surgeryReadiness && !evt.isCancelled && (
                    <div className="flex items-center gap-1 flex-wrap py-0.5">
                      {surgeryReadiness.items.map(it => (
                        <span
                          key={it.key}
                          className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded border flex items-center gap-0.5 ${
                            it.ready
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          <span>{it.icon}</span>
                          <span>{it.shortLabel}</span>
                          <span>{it.ready ? '✓' : '✗'}</span>
                        </span>
                      ))}
                    </div>
                  )}
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
              ) : (evt.type === 'kontrola' || evt.operationTitle) ? (
                <div className="text-[10px] text-[#2C2A29] space-y-1 pt-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-950 border border-sky-300 flex items-center gap-1">
                      <span>🔍 Pooperačná kontrola:</span>
                      <strong>{evt.operationTitle || 'zákrok'}</strong>
                    </span>
                    {evt.operationDate && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white shadow-2xs">
                        📅 Op: {evt.operationDate} ({getPostOpTimeDiff(evt.operationDate, evt.date).badgeText})
                      </span>
                    )}
                  </div>
                  {evt.operationDoctor && (
                    <p className="text-[#8C857B] truncate text-[9px]">
                      Operatér: <strong className="text-[#2C2A29]">{evt.operationDoctor}</strong>
                      {evt.controlInterval ? ` • Fáza: ${evt.controlInterval}` : ''}
                    </p>
                  )}
                </div>
              ) : evt.type !== 'volno' ? (
                <p className="text-[10px] text-[#8C857B] truncate">🩺 Lekár: {evt.assignedTo || evt.doctorName}</p>
              ) : null}
            </div>

            {!isRudlovaOnly && evt.totalPrice ? (
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

  // --- POHĽAD: DEŇ (SPOLOČNÁ ČASOVÁ OS ALEBO 4 STĹPCE MIESTNOSTÍ VEDĽA SEBA) ---
  const renderDayView = () => {
    const formattedDate = formatLocalDate(currentDate);
    const allEventsToday = filteredEvents
      .filter(e => e.date === formattedDate)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    const allDayEvents = allEventsToday.filter(e => e.isAllDay || (e.startTime === '00:00' && (e.endTime === '23:59' || e.endTime === '00:00')));
    const timedEvents = allEventsToday.filter(e => !(e.isAllDay || (e.startTime === '00:00' && (e.endTime === '23:59' || e.endTime === '00:00'))));

    const positioned = computeEventLayout(timedEvents);
    const pxPerMin = hourHeight / 60;
    const dayStartMin = DAY_START_HOUR * 60;
    const dayEndMin = DAY_END_HOUR * 60;

    // STĹPCOVÝ POHĽAD MIESTNOSTÍ VEDĽA SEBA (4 STĹPCE)
    if (dayViewMode === 'rooms') {
      const roomsToShow = isRudlovaOnly
        ? CLINIC_ROOMS.filter(r => r.id === 'sala_rudlova')
        : (selectedRoomId === 'all' ? CLINIC_ROOMS : CLINIC_ROOMS.filter(r => r.id === selectedRoomId));

      return (
        <div className="relative border border-[#E8E2D9] rounded-2xl bg-white overflow-hidden shadow-sm select-none flex flex-col">
          {/* CELODENNÉ UDALOSTI */}
          {allDayEvents.length > 0 && (
            <div className="bg-[#FBF9F6] border-b border-[#E8E2D9] p-2.5 z-20 relative shadow-2xs">
              <div className="text-[9px] font-bold uppercase text-[#8C857B] mb-1.5 tracking-widest flex items-center gap-1">
                <span>☀️ Celodenné udalosti ({allDayEvents.length})</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {allDayEvents.map((evt, idx) => (
                  <div
                    key={`${evt.id || 'allday'}-${idx}`}
                    data-event-id={evt.id}
                    onClick={() => setSelectedEvent(evt)}
                    className={`bg-white border hover:border-[#C5A059] px-2.5 py-1.5 rounded-xl cursor-pointer flex items-center gap-2 shadow-2xs transition-all ${evt.isCancelled ? 'opacity-60 border-rose-200 line-through' : 'border-[#E8E2D9]'}`}
                  >
                    {getEventTypeBadge(evt.type, evt.freeformCategory)}
                    <span className="font-bold text-xs text-[#2C2A29]">{evt.title}</span>
                    <span className="text-[10px] text-[#8C857B]">({evt.patientName})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* HLAVIČKA STĹPCOV MIESTNOSTÍ */}
          <div
            className="grid border-b border-[#E8E2D9] bg-[#FBF9F6] sticky top-0 z-20 shadow-2xs"
            style={{ gridTemplateColumns: `56px repeat(${roomsToShow.length}, minmax(180px, 1fr))` }}
          >
            <div className="p-2 text-center text-[10px] font-bold text-[#8C857B] border-r border-[#E8E2D9] flex items-center justify-center">
              Čas
            </div>
            {roomsToShow.map(room => {
              const roomEventsCount = timedEvents.filter(
                e => !e.isCancelled && (e.roomId || (e.type === 'operacia' ? 'sala_say' : 'ambulancia')) === room.id
              ).length;
              return (
                <div
                  key={room.id}
                  className="p-2.5 border-r border-[#E8E2D9] flex items-center justify-between gap-2 bg-[#FAF8F5]"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-base shrink-0">{room.icon}</span>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-[#2C2A29] block truncate">{room.name}</span>
                      <span className="text-[9px] text-[#8C857B] block truncate">{room.description}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${room.badgeColor}`}>
                    {roomEventsCount}
                  </span>
                </div>
              );
            })}
          </div>

          {/* ČASOVÁ OS PRE 4 MIESTNOSTI VEDĽA SEBA */}
          <div className="relative min-h-[600px] max-h-[760px] overflow-y-auto overflow-x-auto">
            <div
              className="grid relative"
              style={{ gridTemplateColumns: `56px repeat(${roomsToShow.length}, minmax(180px, 1fr))` }}
            >
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

              {/* STĹPCE JEDNOTLIVÝCH MIESTNOSTÍ */}
              {roomsToShow.map(room => {
                const roomTimedEvents = timedEvents.filter(
                  e => (e.roomId || (e.type === 'operacia' ? 'sala_say' : 'ambulancia')) === room.id
                );
                const roomPositioned = computeEventLayout(roomTimedEvents);

                return (
                  <div
                    key={room.id}
                    data-day-date={formattedDate}
                    data-room-id={room.id}
                    onMouseDown={(e) => handleMouseDownCreate(e, formattedDate, room.id)}
                    className="relative border-r border-[#E8E2D9]/60 cursor-crosshair hover:bg-amber-50/15 transition-colors"
                  >
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

                    {roomPositioned.map(item => {
                      const clampedStart = Math.max(dayStartMin, Math.min(dayEndMin - 15, item.startMin));
                      const clampedEnd = Math.max(clampedStart + 15, Math.min(dayEndMin, item.endMin));
                      const durationMin = clampedEnd - clampedStart;
                      const top = Math.max(0, (clampedStart - dayStartMin) * pxPerMin);
                      const height = Math.max(28, durationMin * pxPerMin);
                      const columnWidth = 100 / item.totalCols;
                      const left = `calc(${item.colIndex * columnWidth}% + 2px)`;
                      const width = `calc(${columnWidth}% - 4px)`;

                      return renderEventCard(item.event, top, height, left, width);
                    })}

                    {/* ČERVENÁ ČASOVÁ LINKA AKTUÁLNEHO ČASU (DNES) */}
                    {(() => {
                      const now = new Date();
                      const todayFormatted = formatLocalDate(now);
                      if (formattedDate !== todayFormatted) return null;
                      const nowMin = now.getHours() * 60 + now.getMinutes();
                      if (nowMin < dayStartMin || nowMin > dayEndMin) return null;
                      const lineTop = (nowMin - dayStartMin) * pxPerMin;
                      return (
                        <div
                          className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
                          style={{ top: `${lineTop}px` }}
                        >
                          <div className="w-2 h-2 rounded-full bg-rose-500 -ml-1 shadow-sm ring-1 ring-white shrink-0" />
                          <div className="flex-1 h-[2px] bg-rose-500 shadow-xs" />
                        </div>
                      );
                    })()}

                    {/* DUCH PRE TAHANIE NOVEJ UDALOSTI V DANEJ MIESTNOSTI */}
                    {isCreatingDrag && createDragDate === formattedDate && createDragRoomId === room.id && (
                      <div
                        className="absolute left-1 right-1 rounded-xl border-2 border-dashed border-[#C5A059] bg-[#C5A059]/25 backdrop-blur-xs p-2 pointer-events-none z-30 shadow-md flex flex-col justify-between animate-pulse"
                        style={{
                          top: `${(Math.min(dragStartMin, dragCurrentMin) - dayStartMin) * pxPerMin}px`,
                          height: `${Math.max(26, Math.abs(dragCurrentMin - dragStartMin) * pxPerMin)}px`,
                        }}
                      >
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[10px] font-bold text-[#2C2A29] bg-white px-1.5 py-0.5 rounded shadow-xs">
                            {minutesToTimeStr(Math.min(dragStartMin, dragCurrentMin))} – {minutesToTimeStr(Math.max(dragStartMin, dragCurrentMin))}
                          </span>
                          <span className="text-[10px] font-bold text-[#8A6827]">
                            {room.icon} {room.shortName}
                          </span>
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
    }

    return (
      <div className="relative border border-[#E8E2D9] rounded-2xl bg-white overflow-hidden shadow-sm select-none flex flex-col">
        
        {/* ZOBRAZENIE CELODENNÝCH UDALOSTÍ ÚPLNE NAVRCHU */}
        {allDayEvents.length > 0 && (
          <div className="bg-[#FBF9F6] border-b border-[#E8E2D9] p-3 z-20 relative shadow-sm">
            <div className="text-[9px] font-bold uppercase text-[#8C857B] mb-2 tracking-widest flex items-center gap-1">
              <span>☀️ Celodenné udalosti ({allDayEvents.length})</span>
            </div>
            <div className="flex flex-col gap-2">
              {allDayEvents.map((evt, idx) => (
                <div 
                  key={`${evt.id || 'allday'}-${idx}`} 
                  data-event-id={evt.id}
                  onClick={() => setSelectedEvent(evt)} 
                  className={`bg-white border hover:border-[#C5A059] p-2.5 rounded-xl cursor-pointer flex justify-between items-center shadow-sm transition-all ${evt.isCancelled ? 'opacity-60 border-rose-200' : 'border-[#E8E2D9]'}`}
                >
                  <div className="flex items-center gap-3">
                    {getEventTypeBadge(evt.type, evt.freeformCategory)}
                    <h4 className={`font-bold text-xs text-[#2C2A29] ${evt.isCancelled ? 'line-through' : ''}`}>{evt.title}</h4>
                    <span className="text-xs text-[#8C857B] hidden md:inline">| {evt.patientName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {evt.isCancelled && <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">ZRUŠENÉ</span>}
                    <span className="text-[9px] bg-gray-50 border border-[#E8E2D9] px-2 py-1 rounded font-bold uppercase text-[#C5A059]">Detail →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HODINOVÁ ČASOVÁ OS (06:00 - 21:00) */}
        <div className="relative min-h-[600px] max-h-[760px] overflow-y-auto">
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
              data-day-date={formattedDate}
              onMouseDown={(e) => handleMouseDownCreate(e, formattedDate)}
              className="flex-1 relative cursor-crosshair bg-[#FBF9F6]/20"
            >
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

              {/* VYKRESLENIE UDALOSTÍ BEZ PREKRÝVANIA */}
              {positioned.map(item => {
                const clampedStart = Math.max(dayStartMin, Math.min(dayEndMin - 15, item.startMin));
                const clampedEnd = Math.max(clampedStart + 15, Math.min(dayEndMin, item.endMin));
                const durationMin = clampedEnd - clampedStart;
                const top = Math.max(0, (clampedStart - dayStartMin) * pxPerMin);
                const height = Math.max(30, durationMin * pxPerMin);
                const columnWidth = 100 / item.totalCols;
                const left = `calc(${item.colIndex * columnWidth}% + 2px)`;
                const width = `calc(${columnWidth}% - 4px)`;

                return renderEventCard(item.event, top, height, left, width);
              })}

              {/* ČERVENÁ ČASOVÁ LINKA AKTUÁLNEHO ČASU (DNES) */}
              {(() => {
                const now = new Date();
                const todayFormatted = formatLocalDate(now);
                if (formattedDate !== todayFormatted) return null;
                const nowMin = now.getHours() * 60 + now.getMinutes();
                if (nowMin < dayStartMin || nowMin > dayEndMin) return null;
                const lineTop = (nowMin - dayStartMin) * pxPerMin;
                return (
                  <div 
                    className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
                    style={{ top: `${lineTop}px` }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 -ml-1 shadow-sm ring-2 ring-white shrink-0" />
                    <div className="flex-1 h-[2px] bg-rose-500 shadow-xs" />
                    <span className="bg-rose-500 text-white text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full mr-1 shadow-xs shrink-0">
                      {String(now.getHours()).padStart(2, '0')}:{String(now.getMinutes()).padStart(2, '0')}
                    </span>
                  </div>
                );
              })()}

              {/* DUCH PRE TAHANIE NOVEJ UDALOSTI */}
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

  // --- POHĽAD: TÝŽDEŇ ---
  const renderWeekView = () => {
    const weekDays = getDaysInWeek(currentDate);
    const dayNames = ['Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok', 'Sobota', 'Nedeľa'];
    const pxPerMin = hourHeight / 60;
    const dayStartMin = DAY_START_HOUR * 60;
    const dayEndMin = DAY_END_HOUR * 60;
    const todayFormatted = formatLocalDate(new Date());

    if (weekViewMode === 'cards') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2">
          {weekDays.map((date, idx) => {
            const formattedDate = formatLocalDate(date);
            const dayEvents = filteredEvents
              .filter(e => e.date === formattedDate)
              .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
            const isToday = formattedDate === todayFormatted;
            return (
              <div key={formattedDate} className={`border rounded-xl flex flex-col h-[520px] overflow-y-auto ${isToday ? 'border-[#C5A059] bg-[#FBF9F6]' : 'border-[#E8E2D9] bg-white'}`}>
                <div 
                  onClick={() => { setCurrentDate(date); setView('day'); }}
                  className={`text-center p-2 border-b text-[10px] uppercase font-bold sticky top-0 z-10 cursor-pointer transition-colors ${isToday ? 'bg-[#C5A059] text-white' : 'bg-[#FBF9F6] text-[#8C857B] hover:text-[#2C2A29]'}`}
                >
                  <span className="block">{dayNames[idx]}</span>
                  <span className="text-sm">{date.getDate()}.{date.getMonth() + 1}.</span>
                </div>
                <div className="p-1.5 flex-1 space-y-1.5">
                  {dayEvents.map((evt, eIdx) => {
                    const room = getRoomInfo(evt.roomId);
                    return (
                      <div 
                        key={`${evt.id || 'day-evt'}-${eIdx}`} 
                        data-event-id={evt.id} 
                        onClick={() => setSelectedEvent(evt)} 
                        className={`text-[9px] p-2 rounded-lg cursor-pointer border transition-all hover:shadow-xs hover:border-[#C5A059] ${
                          evt.isCancelled 
                            ? 'line-through opacity-50 bg-gray-100 border-gray-200' 
                            : evt.type === 'operacia'
                            ? 'bg-white border-l-4 border-l-[#2C2A29] border-[#E8E2D9]'
                            : evt.type === 'konzultacia'
                            ? 'bg-amber-50/50 border-l-4 border-l-[#C5A059] border-amber-200'
                            : 'bg-gray-50 border-[#E8E2D9] text-gray-800'
                        } space-y-0.5`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <strong className="font-mono">{evt.isAllDay ? '☀️ Celý deň' : `${evt.startTime} - ${evt.endTime}`}</strong>
                          <span>{room.icon}</span>
                        </div>
                        <span className="truncate block font-bold text-[#2C2A29] text-[10px]">{evt.patientName || evt.title}</span>
                        <span className="truncate block text-[9px] text-[#6B6357]">{evt.title}</span>
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
                    );
                  })}
                  <div 
                    onClick={() => handleOpenAddEventModal(formattedDate)}
                    className="text-center py-3 text-[10px] font-bold text-[#8C857B] hover:text-[#C5A059] cursor-pointer border border-dashed border-[#E8E2D9] rounded-lg hover:border-[#C5A059] transition-colors"
                  >
                    + Pridať termín
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // Zistenie, či v týždni existujú celodenné udalosti
    const weekHasAllDay = weekDays.some(d => {
      const fDate = formatLocalDate(d);
      return filteredEvents.some(e => e.date === fDate && (e.isAllDay || (e.startTime === '00:00' && (e.endTime === '23:59' || e.endTime === '00:00'))));
    });

    return (
      <div className="relative border border-[#E8E2D9] rounded-2xl bg-white overflow-hidden shadow-sm select-none flex flex-col">
        {/* HLAVIČKA S DŇAMI TÝŽDŇA */}
        <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-[#E8E2D9] bg-[#FBF9F6] sticky top-0 z-20 shadow-xs">
          <div className="p-2 text-center text-[10px] font-bold text-[#8C857B] border-r border-[#E8E2D9] flex items-center justify-center">
            Čas
          </div>
          {weekDays.map((date, idx) => {
            const formattedDate = formatLocalDate(date);
            const isToday = formattedDate === todayFormatted;
            const dayCount = filteredEvents.filter(e => e.date === formattedDate && !e.isCancelled).length;
            return (
              <div 
                key={formattedDate} 
                onClick={() => { setCurrentDate(date); setView('day'); }}
                className={`p-2 text-center border-r border-[#E8E2D9] cursor-pointer hover:bg-[#FAF4E9] transition-colors ${isToday ? 'bg-[#C5A059]/15' : ''}`}
                title="Kliknite pre zobrazenie dňa"
              >
                <span className="block text-[10px] uppercase font-bold text-[#8C857B]">{dayNames[idx]}</span>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <span className={`text-xs font-bold inline-block px-1.5 py-0.5 rounded-full ${isToday ? 'bg-[#C5A059] text-white' : 'text-[#2C2A29]'}`}>
                    {date.getDate()}.{date.getMonth() + 1}.
                  </span>
                  {dayCount > 0 && (
                    <span className="text-[9px] font-mono font-bold px-1 rounded bg-black/5 text-[#6B6357]">
                      {dayCount}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* LIŠTA CELODENNÝCH UDALOSTÍ V TÝŽDNI (AK EXISTUJÚ) */}
        {weekHasAllDay && (
          <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-[#E8E2D9] bg-[#FAF8F5] z-10">
            <div className="p-1.5 text-center text-[8.5px] font-bold uppercase text-[#8C857B] border-r border-[#E8E2D9] flex items-center justify-center">
              ☀️ Celý deň
            </div>
            {weekDays.map((date) => {
              const formattedDate = formatLocalDate(date);
              const allDayEvts = filteredEvents.filter(
                e => e.date === formattedDate && (e.isAllDay || (e.startTime === '00:00' && (e.endTime === '23:59' || e.endTime === '00:00')))
              );
              return (
                <div key={`allday-${formattedDate}`} className="p-1 border-r border-[#E8E2D9]/60 space-y-1 min-h-[28px]">
                  {allDayEvts.map(evt => (
                    <div
                      key={evt.id}
                      data-event-id={evt.id}
                      onClick={() => setSelectedEvent(evt)}
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded truncate cursor-pointer border transition-colors ${
                        evt.isCancelled
                          ? 'bg-gray-100 text-gray-500 line-through border-gray-200'
                          : evt.type === 'volno'
                          ? 'bg-indigo-100 text-indigo-950 border-indigo-300 hover:bg-indigo-200'
                          : 'bg-amber-100 text-amber-950 border-amber-300 hover:bg-amber-200'
                      }`}
                      title={`${evt.title} (${evt.patientName})`}
                    >
                      ☀️ {evt.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* SCROLLOVATEĽNÁ TÝŽDENNÁ ČASOVÁ OS */}
        <div className="relative min-h-[600px] max-h-[760px] overflow-y-auto">
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
              const formattedDate = formatLocalDate(date);
              const dayEvents = filteredEvents.filter(e => e.date === formattedDate);
              const timedEvents = dayEvents.filter(e => !(e.isAllDay || (e.startTime === '00:00' && (e.endTime === '23:59' || e.endTime === '00:00'))));
              const positioned = computeEventLayout(timedEvents);

              return (
                <div 
                  key={formattedDate}
                  data-day-date={formattedDate}
                  onMouseDown={(e) => handleMouseDownCreate(e, formattedDate)}
                  className="relative border-r border-[#E8E2D9]/60 cursor-crosshair group/col hover:bg-amber-50/20 transition-colors"
                >
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

                  {positioned.map(item => {
                    const clampedStart = Math.max(dayStartMin, Math.min(dayEndMin - 15, item.startMin));
                    const clampedEnd = Math.max(clampedStart + 15, Math.min(dayEndMin, item.endMin));
                    const durationMin = clampedEnd - clampedStart;
                    const top = Math.max(0, (clampedStart - dayStartMin) * pxPerMin);
                    const height = Math.max(28, durationMin * pxPerMin);
                    const columnWidth = 100 / item.totalCols;
                    const left = `calc(${item.colIndex * columnWidth}% + 1px)`;
                    const width = `calc(${columnWidth}% - 2px)`;

                    return renderEventCard(item.event, top, height, left, width);
                  })}

                  {/* ČERVENÁ ČASOVÁ LINKA AKTUÁLNEHO ČASU (DNES) */}
                  {(() => {
                    if (formattedDate !== todayFormatted) return null;
                    const now = new Date();
                    const nowMin = now.getHours() * 60 + now.getMinutes();
                    if (nowMin < dayStartMin || nowMin > dayEndMin) return null;
                    const lineTop = (nowMin - dayStartMin) * pxPerMin;
                    return (
                      <div 
                        className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
                        style={{ top: `${lineTop}px` }}
                      >
                        <div className="w-2 h-2 rounded-full bg-rose-500 -ml-1 shadow-sm ring-1 ring-white shrink-0" />
                        <div className="flex-1 h-[2px] bg-rose-500 shadow-xs" />
                      </div>
                    );
                  })()}

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

  // --- POHĽAD: MESIAC ---
  const renderMonthView = () => {
    const monthDays = getDaysInMonth(currentDate);
    const dayNames = ['Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok', 'Sobota', 'Nedeľa'];
    const todayFormatted = formatLocalDate(new Date());

    return (
      <div className="border border-[#E8E2D9] rounded-2xl overflow-hidden bg-white shadow-xs">
        <div className="grid grid-cols-7 bg-[#FBF9F6] border-b border-[#E8E2D9]">
          {dayNames.map(day => (
            <div key={day} className="text-center p-2.5 text-[10px] font-bold text-[#8C857B] uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-[125px]">
          {monthDays.map((date, idx) => {
            if (!date) return <div key={`empty-${idx}`} className="border-b border-r border-[#E8E2D9]/50 bg-[#FAF8F5]/60" />;
            const formattedDate = formatLocalDate(date);
            const dayEvents = filteredEvents
              .filter(e => e.date === formattedDate)
              .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
            const isToday = formattedDate === todayFormatted;
            const visibleEvents = dayEvents.slice(0, 3);
            const hiddenCount = dayEvents.length - visibleEvents.length;

            return (
              <div 
                key={formattedDate} 
                onDoubleClick={() => handleOpenAddEventModal(formattedDate)}
                className={`border-b border-r border-[#E8E2D9]/60 p-1.5 flex flex-col group/mday transition-colors ${
                  isToday ? 'bg-amber-50/35' : 'hover:bg-[#FAF8F5]/70'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <button
                    type="button"
                    onClick={() => handleOpenAddEventModal(formattedDate)}
                    className="opacity-0 group-hover/mday:opacity-100 text-[9px] font-bold text-[#C5A059] hover:text-[#2C2A29] px-1 rounded transition-opacity cursor-pointer"
                    title="Pridať termín na tento deň"
                  >
                    + Termín
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCurrentDate(date); setView('day'); }}
                    className={`text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                      isToday ? 'bg-[#C5A059] text-white shadow-2xs' : 'text-[#6B6357] hover:bg-black/5 hover:text-[#2C2A29]'
                    }`}
                    title="Zobraziť detail dňa"
                  >
                    {date.getDate()}
                  </button>
                </div>

                <div className="flex-1 overflow-hidden space-y-1">
                  {visibleEvents.map((evt, eIdx) => {
                    const pillClass = evt.isCancelled
                      ? 'bg-gray-100 text-gray-400 line-through border-gray-200'
                      : evt.type === 'operacia'
                      ? 'bg-[#2C2A29] text-white border-[#2C2A29]'
                      : evt.type === 'konzultacia'
                      ? 'bg-amber-100 text-amber-950 border-amber-300'
                      : evt.type === 'osetrenie'
                      ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                      : evt.type === 'volno'
                      ? 'bg-indigo-100 text-indigo-950 border-indigo-300'
                      : 'bg-sky-100 text-sky-950 border-sky-300';

                    return (
                      <div 
                        key={`${evt.id || 'month-evt'}-${eIdx}`} 
                        data-event-id={evt.id} 
                        onClick={() => setSelectedEvent(evt)} 
                        className={`text-[9px] px-1.5 py-0.5 rounded border truncate cursor-pointer font-semibold transition-transform hover:scale-[1.01] ${pillClass}`}
                        title={`${evt.isAllDay ? 'Celý deň' : `${evt.startTime}–${evt.endTime}`} • ${evt.title} (${evt.patientName})`}
                      >
                        <span className="font-mono font-bold mr-1">{evt.isAllDay ? '☀️' : evt.startTime}</span>
                        <span>{evt.type === 'volno' ? evt.title : (evt.patientName || evt.title)}</span>
                      </div>
                    );
                  })}

                  {hiddenCount > 0 && (
                    <button
                      type="button"
                      onClick={() => { setCurrentDate(date); setView('day'); }}
                      className="w-full text-left text-[9px] font-bold text-[#8A6827] bg-[#C5A059]/15 hover:bg-[#C5A059]/25 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                    >
                      + {hiddenCount} ďalš{hiddenCount === 1 ? 'ia udalosť' : hiddenCount < 5 ? 'ie udalosti' : 'ích udalostí'} →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // --- POHĽAD: AGENDA / CHRONOLOGICKÝ ZOZNAM ---
  const renderAgendaView = () => {
    const sorted = [...periodEvents].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
    });

    // Zoskupenie podľa dátumu
    const grouped = new Map<string, CalendarEvent[]>();
    for (const ev of sorted) {
      const list = grouped.get(ev.date) || [];
      list.push(ev);
      grouped.set(ev.date, list);
    }

    const todayStr = formatLocalDate(new Date());

    if (grouped.size === 0) {
      return (
        <div className="border border-[#E8E2D9] rounded-2xl bg-[#FAF8F5] p-12 text-center space-y-3">
          <div className="text-3xl">🗓️</div>
          <h4 className="font-brand text-base font-bold text-[#2C2A29] uppercase">
            Žiadne nájdené termíny v Agende
          </h4>
          <p className="text-xs text-[#8C857B] max-w-md mx-auto">
            Pre zvolené filtre alebo hľadaný výraz sa nenašli žiadne udalosti. Skúste upraviť filter alebo naplánovať nový termín.
          </p>
          <button
            type="button"
            onClick={() => handleOpenAddEventModal()}
            className="px-4 py-2 bg-[#2C2A29] hover:bg-[#C5A059] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            + Naplánovať termín
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {Array.from(grouped.entries()).map(([dateStr, eventsOnDay]) => {
          const parsedDate = parseLocalDate(dateStr);
          const isToday = dateStr === todayStr;

          return (
            <div key={dateStr} className="border border-[#E8E2D9] rounded-2xl overflow-hidden bg-white shadow-2xs">
              <div className={`px-4 py-2.5 border-b border-[#E8E2D9] flex items-center justify-between ${
                isToday ? 'bg-[#C5A059]/15' : 'bg-[#FBF9F6]'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="font-brand font-bold text-xs sm:text-sm uppercase text-[#2C2A29]">
                    {parsedDate.toLocaleDateString('sk-SK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  {isToday && (
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#C5A059] text-white">
                      Dnes
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold text-[#8C857B]">
                  {eventsOnDay.length} {eventsOnDay.length === 1 ? 'záznam' : eventsOnDay.length < 5 ? 'záznamy' : 'záznamov'}
                </span>
              </div>

              <div className="divide-y divide-[#E8E2D9]/60">
                {eventsOnDay.map(evt => {
                  const room = getRoomInfo(evt.roomId);
                  const statusInfo = getEventStatusInfo(evt.status, evt.isCancelled);
                  const phone = getEventPhone(evt);

                  return (
                    <div
                      key={evt.id}
                      data-event-id={evt.id}
                      onClick={() => setSelectedEvent(evt)}
                      className={`p-3.5 hover:bg-[#FAF8F5] transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        evt.isCancelled ? 'opacity-55 bg-gray-50' : ''
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="w-24 shrink-0 font-mono text-xs font-bold text-[#2C2A29]">
                          {evt.isAllDay ? '☀️ Celý deň' : `${evt.startTime} – ${evt.endTime}`}
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${room.badgeColor}`}>
                              {room.icon} {room.shortName}
                            </span>
                            {getEventTypeBadge(evt.type, evt.freeformCategory)}
                            {evt.type !== 'volno' && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${statusInfo.badge}`}>
                                {statusInfo.icon} {statusInfo.shortLabel}
                              </span>
                            )}
                            {evt.type === 'operacia' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-200">
                                💉 {evt.anesthesiaType || 'TIVA'}
                              </span>
                            )}
                            {evt.type === 'operacia' && !evt.isCancelled && (() => {
                              const rSum = getSurgeryReadinessSummary(evt);
                              return (
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${rSum.badgeClass}`} title={rSum.statusLabel}>
                                  🚦 Semafor {rSum.readyCount}/4
                                </span>
                              );
                            })()}
                          </div>

                          <h4 className={`font-bold text-sm text-[#2C2A29] ${evt.isCancelled ? 'line-through' : ''}`}>
                            {evt.title}
                          </h4>

                          <div className="text-xs text-[#6B6357] flex flex-wrap items-center gap-2">
                            <strong className="text-[#2C2A29]">👤 {evt.patientName}</strong>
                            {phone && <span className="font-mono text-[11px]">📞 {phone}</span>}
                            <span>• 🩺 {evt.operator || evt.assignedTo || evt.doctorName}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {!isRudlovaOnly && evt.totalPrice ? (
                          <span className="font-mono text-xs font-bold text-[#2C2A29] bg-[#FBF9F6] px-2.5 py-1 rounded-lg border border-[#E8E2D9]">
                            {evt.totalPrice} €
                          </span>
                        ) : null}

                        {!isRudlovaOnly && evt.depositAmount ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateDepositStatus(evt.id, !evt.isDepositPaid);
                            }}
                            className={`text-[9px] font-bold uppercase px-2.5 py-1 rounded-lg border cursor-pointer ${
                              evt.isDepositPaid
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : 'bg-rose-100 text-rose-900 border-rose-300'
                            }`}
                          >
                            Záloha {evt.depositAmount} € ({evt.isDepositPaid ? '✓' : '✗'})
                          </button>
                        ) : null}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingEventData(evt);
                            setIsEditingEvent(true);
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-gray-100 border border-[#E8E2D9] rounded-lg text-[10px] font-bold uppercase text-[#2C2A29] cursor-pointer"
                        >
                          ✏️ Upraviť
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Výpočet zajtrajších (alebo najbližších pracovných) udalostí pre Hromadné pripomienky
  const tomorrowInfo = useMemo(() => {
    const now = new Date();
    const tmr = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12, 0, 0);
    // Ak je zajtra sobota/nedeľa a nie sú tam žiadne udalosti, skontrolujeme pondelok
    const tmrStr = formatLocalDate(tmr);
    const tmrEvts = calendarEvents
      .filter(e => !e.isCancelled && e.type !== 'volno' && e.date === tmrStr)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    if (tmrEvts.length > 0) {
      return { dateObj: tmr, dateStr: tmrStr, label: 'Zajtra', events: tmrEvts };
    }

    // Ak zajtra nie je nič a je piatok/sobota, pozrieme najbližší deň s termínmi do 4 dní
    for (let offset = 2; offset <= 4; offset++) {
      const cand = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, 12, 0, 0);
      const candStr = formatLocalDate(cand);
      const candEvts = calendarEvents
        .filter(e => !e.isCancelled && e.type !== 'volno' && e.date === candStr)
        .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
      if (candEvts.length > 0) {
        return {
          dateObj: cand,
          dateStr: candStr,
          label: cand.toLocaleDateString('sk-SK', { weekday: 'long', day: 'numeric', month: 'numeric' }),
          events: candEvts,
        };
      }
    }

    return { dateObj: tmr, dateStr: tmrStr, label: 'Zajtra', events: tmrEvts };
  }, [calendarEvents]);

  // Bočný panel: Mini-kalendár, Zajtrajšie pripomienky, Čakacia listina & Legenda farieb
  const renderLeftSidebar = () => {
    const miniDays = getDaysInMonth(miniCalMonth);
    const miniDayLabels = ['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'];
    const todayFormatted = formatLocalDate(new Date());
    const selectedFormatted = formatLocalDate(currentDate);

    return (
      <div className="w-full xl:w-64 shrink-0 space-y-3.5">
        {/* 1. MINI-KALENDÁR */}
        <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl p-3 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setMiniCalMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1, 12, 0, 0))}
              className="w-6 h-6 rounded-lg bg-white border border-[#E8E2D9] hover:border-[#C5A059] text-xs font-bold text-[#2C2A29] cursor-pointer"
            >
              ‹
            </button>
            <span className="text-[11px] font-bold uppercase text-[#2C2A29] tracking-wide">
              {miniCalMonth.toLocaleDateString('sk-SK', { month: 'long', year: 'numeric' })}
            </span>
            <button
              type="button"
              onClick={() => setMiniCalMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1, 12, 0, 0))}
              className="w-6 h-6 rounded-lg bg-white border border-[#E8E2D9] hover:border-[#C5A059] text-xs font-bold text-[#2C2A29] cursor-pointer"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
            {miniDayLabels.map(dl => (
              <span key={dl} className="text-[9px] font-bold uppercase text-[#8C857B] py-0.5">
                {dl}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {miniDays.map((d, idx) => {
              if (!d) return <div key={`mc-empty-${idx}`} className="h-7" />;
              const dStr = formatLocalDate(d);
              const isSelected = dStr === selectedFormatted;
              const isToday = dStr === todayFormatted;
              const dayEvts = calendarEvents.filter(e => !e.isCancelled && e.date === dStr);
              const hasSurgery = dayEvts.some(e => e.type === 'operacia');
              const hasOther = dayEvts.length > 0;

              return (
                <button
                  key={dStr}
                  type="button"
                  onClick={() => setCurrentDate(d)}
                  className={`h-7 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#2C2A29] text-white shadow-2xs'
                      : isToday
                      ? 'bg-[#C5A059]/25 text-[#2C2A29] border border-[#C5A059]'
                      : 'hover:bg-white text-[#2C2A29]'
                  }`}
                >
                  <span className="leading-none">{d.getDate()}</span>
                  {hasOther && (
                    <span className="flex items-center gap-0.5 mt-0.5">
                      {hasSurgery && (
                        <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-[#C5A059]' : 'bg-[#2C2A29]'}`} />
                      )}
                      {dayEvts.length > (hasSurgery ? 1 : 0) && (
                        <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-[#C5A059]'}`} />
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. RÝCHLY PANEL: PRIPOMIENKY NA ZAJTRA */}
        <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl p-3 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-[#2C2A29] flex items-center gap-1">
              <span>🔔</span> Pripomienky ({tomorrowInfo.label})
            </span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white border border-[#E8E2D9] text-[#2C2A29]">
              {tomorrowInfo.events.filter(e => e.status === 'confirmed').length}/{tomorrowInfo.events.length} potv.
            </span>
          </div>

          {tomorrowInfo.events.length === 0 ? (
            <p className="text-[10px] text-[#8C857B] italic">Na zajtra nie sú naplánované žiadne pacientske termíny.</p>
          ) : (
            <div className="space-y-1 max-h-36 overflow-y-auto pr-0.5">
              {tomorrowInfo.events.slice(0, 4).map(ev => (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  className="bg-white p-1.5 rounded-lg border border-[#E8E2D9] hover:border-[#C5A059] cursor-pointer flex items-center justify-between gap-1 text-[10px]"
                >
                  <div className="min-w-0">
                    <span className="font-mono font-bold text-[#2C2A29] mr-1">{ev.startTime}</span>
                    <span className="font-semibold text-[#2C2A29] truncate">{ev.patientName}</span>
                  </div>
                  <span className="shrink-0 text-[9px]">
                    {ev.status === 'confirmed' ? '✅' : '⏳'}
                  </span>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsTomorrowRemindersOpen(true)}
            className="w-full py-1.5 bg-white hover:bg-[#2C2A29] hover:text-white text-[#2C2A29] border border-[#E8E2D9] rounded-xl text-[10px] font-bold uppercase transition-colors cursor-pointer"
          >
            📲 Otvoriť hromadné pripomienky
          </button>
        </div>

        {/* 3. RÝCHLY PANEL: ČAKACIA LISTINA (WAITING LIST) */}
        <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl p-3 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-[#2C2A29] flex items-center gap-1">
              <span>⏳</span> Čakacia listina
            </span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
              {waitingList.length} čaká
            </span>
          </div>

          {waitingList.length === 0 ? (
            <p className="text-[10px] text-[#8C857B] italic">Žiadni pacienti na čakacej listine.</p>
          ) : (
            <div className="space-y-1 max-h-40 overflow-y-auto pr-0.5">
              {waitingList.slice(0, 4).map(wl => (
                <div
                  key={wl.id}
                  onClick={() => setIsWaitingListModalOpen(true)}
                  className="bg-white p-1.5 rounded-lg border border-[#E8E2D9] hover:border-[#C5A059] cursor-pointer text-[10px] space-y-0.5"
                >
                  <div className="flex items-center justify-between gap-1">
                    <strong className="text-[#2C2A29] truncate">{wl.patientName}</strong>
                    <span className={`text-[8px] font-bold px-1 rounded uppercase ${
                      wl.priority === 'urgent'
                        ? 'bg-rose-100 text-rose-800'
                        : wl.priority === 'normal'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {wl.priority === 'urgent' ? '🔥 Urgent' : wl.priority === 'normal' ? 'Štandard' : 'Flexi'}
                    </span>
                  </div>
                  <div className="text-[9px] text-[#8C857B] truncate">
                    {wl.procedureTitle} ({wl.durationMinutes}m)
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsWaitingListModalOpen(true)}
            className="w-full py-1.5 bg-white hover:bg-[#C5A059] hover:text-white text-[#2C2A29] border border-[#E8E2D9] rounded-xl text-[10px] font-bold uppercase transition-colors cursor-pointer"
          >
            ⚡ Spravovať čakaciu listinu ({waitingList.length})
          </button>
        </div>

        {/* 4. LEGENDA FARIEB PRI REŽIME PODĽA LEKÁRA */}
        {colorMode === 'doctor' && (
          <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl p-3 space-y-1.5 shadow-2xs">
            <span className="text-[9px] font-bold uppercase text-[#8C857B] block">
              👨‍⚕️ Farebné odlíšenie lekárov:
            </span>
            {DOCTOR_COLOR_SCHEMES.map(ds => (
              <div key={ds.id} className="flex items-center gap-2 text-[10px] font-semibold text-[#2C2A29]">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${ds.dotColor}`} />
                <span className="truncate">{ds.doctorName}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-5">
      {toastBanner && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs animate-fadeIn">
          <span>{toastBanner}</span>
          <button
            type="button"
            onClick={() => setToastBanner(null)}
            className="text-emerald-800 hover:text-emerald-950 font-bold ml-3 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
      
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
            Kalendáre miestností, operačné tímy, šablóny výkonov a obojsmerná Google synchronizácia
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isGoogleConnected ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => performTwoWaySync(false)}
                disabled={isSyncing}
                className="bg-[#FBF9F6] hover:bg-white border border-[#E8E2D9] text-[#2C2A29] hover:border-[#C5A059] px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title={lastSyncTime ? `Posledná synchronizácia: ${lastSyncTime}` : 'Kliknite pre okamžitú obojsmernú synchronizáciu'}
              >
                <span className={isSyncing ? 'animate-spin inline-block' : ''}>🔄</span>
                <span>{isSyncing ? 'Synchronizujem...' : 'Synchronizovať'}</span>
                {lastSyncTime && <span className="text-[#8C857B] font-mono text-[9px]">({lastSyncTime})</span>}
              </button>

              {availableCalendars.length > 0 && (
                <select
                  value={selectedCalendarId}
                  onChange={(e) => setSelectedCalendarId(e.target.value)}
                  className="bg-[#FBF9F6] border border-[#E8E2D9] text-[#2C2A29] px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider focus:outline-none"
                >
                  <option value="all">🗓️ Všetky kalendáre ({availableCalendars.length})</option>
                  {availableCalendars.map(cal => (
                    <option key={cal.id} value={cal.id}>{cal.summary}</option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGoogleConnect}
              className="bg-white hover:bg-[#FBF9F6] border border-[#E8E2D9] hover:border-[#C5A059] text-[#2C2A29] px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>🌐</span> Pripojiť Google Kalendár
            </button>
          )}

          {syncStatusMsg && (
            <span className="text-[9px] bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded-lg font-bold animate-fadeIn">
              {syncStatusMsg}
            </span>
          )}

          <button
            type="button"
            onClick={() => setIsTomorrowRemindersOpen(true)}
            className="bg-[#FBF9F6] hover:bg-white border border-[#E8E2D9] hover:border-[#C5A059] text-[#2C2A29] px-3 py-2 rounded-xl text-[10px] uppercase tracking-wider font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Hromadné pripomienky na zajtra (WhatsApp / SMS / Potvrdenie)"
          >
            <span>🔔</span>
            <span>Pripomienky ({tomorrowInfo.events.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setIsWaitingListModalOpen(true)}
            className="bg-amber-50 hover:bg-amber-100 border border-[#C5A059] text-amber-950 px-3 py-2 rounded-xl text-[10px] uppercase tracking-wider font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Čakacia listina pacientov na skorší termín"
          >
            <span>⏳</span>
            <span>Čakacia listina ({waitingList.length})</span>
          </button>

          <button
            type="button"
            onClick={handlePrintSchedule}
            className="bg-[#FBF9F6] hover:bg-white border border-[#E8E2D9] hover:border-[#C5A059] text-[#2C2A29] px-3 py-2 rounded-xl text-[10px] uppercase tracking-wider font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Vytlačiť operačný a ambulantný rozpis pre vybrané obdobie"
          >
            <span>🖨️</span> Tlačiť rozpis
          </button>

          <button 
            onClick={() => handleOpenAddEventModal()} 
            className="bg-[#2C2A29] hover:bg-[#C5A059] text-white px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>+</span> Nový termín / záznam
          </button>
        </div>
      </div>

      {/* KPI SÚHRN PRE AKTUÁLNE ZOBRAZENÉ OBDOBIE */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl p-2.5 flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase font-bold text-[#8C857B] block">Termíny v období</span>
            <strong className="text-base font-bold text-[#2C2A29]">{periodStats.totalActive}</strong>
          </div>
          <span className="text-lg">📅</span>
        </div>

        <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl p-2.5 flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase font-bold text-[#8C857B] block">Operácie (TIVA / LA)</span>
            <strong className="text-base font-bold text-[#2C2A29]">
              {periodStats.surgeries} <span className="text-[10px] font-normal text-[#8C857B]">({periodStats.tivaCount} / {periodStats.laCount})</span>
            </strong>
          </div>
          <span className="text-lg">🔪</span>
        </div>

        <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl p-2.5 flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase font-bold text-[#8C857B] block">Konzultácie</span>
            <strong className="text-base font-bold text-amber-900">{periodStats.consultations}</strong>
          </div>
          <span className="text-lg">🩺</span>
        </div>

        <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl p-2.5 flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase font-bold text-[#8C857B] block">Poop. kontroly</span>
            <strong className="text-base font-bold text-sky-900">{periodStats.checkups}</strong>
          </div>
          <span className="text-lg">🔍</span>
        </div>

        <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl p-2.5 flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase font-bold text-[#8C857B] block">Ošetrenia / Botox</span>
            <strong className="text-base font-bold text-emerald-900">{periodStats.treatments}</strong>
          </div>
          <span className="text-lg">💉</span>
        </div>

        {!isRudlovaOnly && (
          <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl p-2.5 flex items-center justify-between">
            <div>
              <span className="text-[9px] uppercase font-bold text-[#8C857B] block">Plánovaný obrat</span>
              <strong className="text-sm font-bold text-[#2C2A29] font-mono">
                {periodStats.totalRevenue.toLocaleString('sk-SK')} €
              </strong>
              {periodStats.unpaidDeposits > 0 && (
                <span className="block text-[9px] font-bold text-rose-700">
                  ⚠️ {periodStats.unpaidDeposits}x čaká záloha
                </span>
              )}
            </div>
            <span className="text-lg">💳</span>
          </div>
        )}
      </div>

      {/* PREPÍNAČ KALENDÁROV / MIESTNOSTÍ KLINIKY */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C857B]">
            Miestnosti & Operačné sály kliniky (počet v aktuálnom období):
          </span>
          <span className="text-[10px] text-[#8C857B]">
            Zobrazených v období: <strong className="text-[#2C2A29]">{periodEvents.length}</strong> (celkovo {filteredEvents.length})
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar">
          {isRudlovaOnly ? (
            (() => {
              const rudlovaRoom = CLINIC_ROOMS.find(r => r.id === 'sala_rudlova') || {
                id: 'sala_rudlova',
                name: 'Operačné sály Rudlová',
                icon: '🏥',
                badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300'
              };
              const countInPeriod = calendarEvents.filter(e => 
                !e.isCancelled &&
                e.date >= currentPeriodDates.start && 
                e.date <= currentPeriodDates.end &&
                (e.roomId === 'sala_rudlova' || e.calendarId === 'sala_rudlova')
              ).length;
              return (
                <div
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border border-[#C5A059] bg-[#FAF8F5] text-[#2C2A29] shadow-xs"
                >
                  <span>{rudlovaRoom.icon}</span>
                  <span>{rudlovaRoom.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold bg-[#C5A059]/20 text-[#2C2A29]">
                    {countInPeriod}
                  </span>
                  <span className="text-[9px] text-[#C5A059] uppercase tracking-wider font-semibold ml-1">(Pevné zobrazenie)</span>
                </div>
              );
            })()
          ) : (
            <>
              <button
                onClick={() => setSelectedRoomId('all')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border cursor-pointer ${
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
                  { calendarEvents.filter(e => !e.isCancelled && e.date >= currentPeriodDates.start && e.date <= currentPeriodDates.end).length }
                </span>
              </button>

              {CLINIC_ROOMS.map(room => {
                const countInPeriod = calendarEvents.filter(e => 
                  !e.isCancelled &&
                  e.date >= currentPeriodDates.start && 
                  e.date <= currentPeriodDates.end &&
                  (e.roomId || (e.type === 'operacia' ? 'sala_say' : 'ambulancia')) === room.id
                ).length;
                const isActive = selectedRoomId === room.id;
                return (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoomId(room.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border cursor-pointer ${
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
                      {countInPeriod}
                    </span>
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* LIŠTA FILTROVANIA: VYHĽADÁVANIE, PERSONÁL, TYP, A RESET */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FBF9F6] p-3 rounded-xl border border-[#E8E2D9]">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          
          {/* VYHĽADÁVACIE POLE */}
          <div className="relative min-w-[210px] flex-1 sm:flex-initial">
            <input
              type="text"
              placeholder="🔍 Hľadať pacienta, výkon, tel..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim().length > 1 && view !== 'agenda') {
                  setView('agenda');
                }
              }}
              className="w-full bg-white border border-[#C5A059] text-[#2C2A29] px-3 py-1.5 rounded-lg text-xs font-semibold focus:outline-none shadow-2xs pr-7"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#8C857B] hover:text-[#2C2A29] font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* FILTER PRIDELENÉHO PERSONÁLU (OPRAVENÉ ROZDELENIE PODĽA s.type) */}
          <div className="flex items-center gap-1.5">
            <label className="text-[10px] font-bold uppercase text-[#8C857B]">Pridelené:</label>
            <select
              value={selectedStaffFilter}
              onChange={(e) => setSelectedStaffFilter(e.target.value)}
              className="bg-white border border-[#E8E2D9] hover:border-[#C5A059] text-[#2C2A29] px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider focus:outline-none shadow-2xs"
            >
              <option value="all">👤 Všetci pracovníci</option>
              <option value="Celý tím kliniky">👥 Celý tím kliniky</option>
              <optgroup label="Lekári & Operatéri">
                {CLINIC_STAFF.filter(s => s.type === 'doctor').map(doc => (
                  <option key={doc.id} value={doc.name}>{doc.name} ({doc.role})</option>
                ))}
              </optgroup>
              <optgroup label="Anesteziológovia (OAIM)">
                {CLINIC_STAFF.filter(s => s.type === 'anesthesiologist').map(anest => (
                  <option key={anest.id} value={anest.name}>{anest.name}</option>
                ))}
              </optgroup>
              <optgroup label="Sestry & Inštrumentárky">
                {CLINIC_STAFF.filter(s => s.type === 'nurse').map(nurse => (
                  <option key={nurse.id} value={nurse.name}>{nurse.name} ({nurse.specialization || nurse.role})</option>
                ))}
              </optgroup>
              <optgroup label="Manažment & Recepcia">
                {CLINIC_STAFF.filter(s => s.type === 'manager').map(mgr => (
                  <option key={mgr.id} value={mgr.name}>{mgr.name}</option>
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
              className="bg-white border border-[#E8E2D9] hover:border-[#C5A059] text-[#2C2A29] px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider focus:outline-none shadow-2xs"
            >
              <option value="all">🎯 Všetky typy udalostí</option>
              <option value="operacia">🔪 Iba Operácie</option>
              <option value="konzultacia">🩺 Iba Konzultácie</option>
              <option value="osetrenie">💉 Iba Ošetrenia</option>
              <option value="kontrola">🔍 Iba Kontroly</option>
              <option value="volno">🎉 Voľno / Interné</option>
            </select>
          </div>

          {/* PREPÍNAČ SKRYTIA ZRUŠENÝCH TERMÍNOV */}
          <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2.5 py-1.5 rounded-lg border border-[#E8E2D9] text-[10px] font-bold uppercase text-[#6B6357] hover:text-[#2C2A29]">
            <input
              type="checkbox"
              checked={hideCancelled}
              onChange={(e) => setHideCancelled(e.target.checked)}
              className="accent-[#C5A059]"
            />
            <span>Skryť storná</span>
          </label>

          {/* TLAČIDLO ZRUŠENIA FILTROV */}
          {((!isRudlovaOnly && selectedRoomId !== 'all') || selectedStaffFilter !== 'all' || selectedTypeFilter !== 'all' || selectedCalendarId !== 'all' || searchQuery !== '' || hideCancelled) && (
            <button
              onClick={() => {
                setSelectedRoomId(isRudlovaOnly ? 'sala_rudlova' : 'all');
                setSelectedStaffFilter('all');
                setSelectedTypeFilter('all');
                setSelectedCalendarId('all');
                setSearchQuery('');
                setHideCancelled(false);
              }}
              className="text-[10px] font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1.5 rounded-lg uppercase transition-colors cursor-pointer"
              title="Zrušiť aktívne filtre a zobraziť všetko"
            >
              ✕ Zrušiť filtre
            </button>
          )}
        </div>
      </div>

      {/* NAVIGÁCIA A OVLÁDANIE POHĽADOV */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3 bg-[#FBF9F6] p-3 rounded-xl border border-[#E8E2D9]">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(prev => !prev)}
            className={`px-2.5 py-1.5 border rounded-lg text-[10px] uppercase font-bold shadow-2xs transition-colors cursor-pointer flex items-center gap-1 ${
              isSidebarOpen
                ? 'bg-[#2C2A29] text-white border-[#2C2A29]'
                : 'bg-white text-[#2C2A29] border-[#E8E2D9] hover:border-[#C5A059]'
            }`}
            title="Zobraziť / skryť bočný mini-kalendár a nástroje"
          >
            <span>📅</span>
            <span className="hidden sm:inline">Mini-kalendár</span>
          </button>

          <button onClick={() => navigate(-1)} className="px-2.5 py-1.5 bg-white border border-[#E8E2D9] hover:border-[#C5A059] rounded-lg text-xs font-bold text-[#2C2A29] shadow-2xs cursor-pointer">←</button>
          <button onClick={() => navigate(0)} className="px-3.5 py-1.5 bg-white border border-[#E8E2D9] hover:border-[#C5A059] rounded-lg text-[10px] uppercase font-bold text-[#8C857B] hover:text-[#2C2A29] shadow-2xs cursor-pointer">Dnes</button>
          <button onClick={() => navigate(1)} className="px-2.5 py-1.5 bg-white border border-[#E8E2D9] hover:border-[#C5A059] rounded-lg text-xs font-bold text-[#2C2A29] shadow-2xs cursor-pointer">→</button>
          
          <input
            type="date"
            value={formatLocalDate(currentDate)}
            onChange={(e) => {
              if (e.target.value) setCurrentDate(parseLocalDate(e.target.value));
            }}
            className="bg-white border border-[#E8E2D9] hover:border-[#C5A059] px-2.5 py-1 rounded-lg text-xs font-bold text-[#2C2A29] cursor-pointer"
            title="Rýchly skok na konkrétny dátum"
          />

          <div className="pl-1 font-bold text-[#2C2A29] text-xs md:text-sm uppercase tracking-wide">
            {currentDate.toLocaleDateString('sk-SK', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* PREPÍNAČ FAREBNÉHO KÓDOVANIA KARIET (PODĽA TYPU VS PODĽA LEKÁRA) */}
          <button
            type="button"
            onClick={() => setColorMode(prev => (prev === 'type' ? 'doctor' : 'type'))}
            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-colors cursor-pointer flex items-center gap-1 shadow-2xs ${
              colorMode === 'doctor'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-[#2C2A29] border-[#E8E2D9] hover:border-[#C5A059]'
            }`}
            title="Prepínať zafarbenie kariet v kalendári podľa typu udalosti alebo podľa lekára"
          >
            <span>{colorMode === 'doctor' ? '👨‍⚕️' : '🎨'}</span>
            <span>{colorMode === 'doctor' ? 'Farby: Podľa lekára' : 'Farby: Podľa typu'}</span>
          </button>

          {/* PREPÍNAČ STĹPCOV MIESTNOSTÍ V DENNOM POHĽADE */}
          {view === 'day' && (
            <button
              type="button"
              onClick={() => setDayViewMode(prev => (prev === 'single' ? 'rooms' : 'single'))}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                dayViewMode === 'rooms'
                  ? 'bg-[#C5A059] text-white border-[#C5A059]'
                  : 'bg-white text-[#2C2A29] border-[#E8E2D9] hover:border-[#C5A059]'
              }`}
              title="Zobraziť 4 stĺpce miestností (Ambulancia, Sála SAY, Sála Rudlová, Dospávacia izba) vedľa seba"
            >
              <span>🏛️</span>
              <span>{dayViewMode === 'rooms' ? 'Stĺpce miestností (4) ✓' : 'Rozdeliť podľa miestností (4)'}</span>
            </button>
          )}

          {/* OVLÁDANIE ZOOMU ČASOVEJ OSI */}
          {(view === 'day' || (view === 'week' && weekViewMode === 'grid')) && (
            <div className="flex items-center bg-white border border-[#E8E2D9] px-1.5 py-0.5 rounded-lg shadow-2xs gap-1">
              <span className="text-[9px] font-bold uppercase text-[#8C857B] px-1">Zoom:</span>
              <button
                type="button"
                onClick={() => adjustZoom(-15)}
                className="w-6 h-6 rounded hover:bg-[#FAF8F5] font-bold text-xs text-[#2C2A29] cursor-pointer"
                title="Zmenšiť rozostup hodín"
              >
                −
              </button>
              <button
                type="button"
                onClick={() => setHourHeight(85)}
                className="text-[9px] font-mono font-bold text-[#6B6357] hover:text-[#2C2A29] px-1 cursor-pointer"
                title="Obnoviť predvolený zoom (alebo Ctrl + koliesko myši)"
              >
                {Math.round((hourHeight / 85) * 100)}%
              </button>
              <button
                type="button"
                onClick={() => adjustZoom(15)}
                className="w-6 h-6 rounded hover:bg-[#FAF8F5] font-bold text-xs text-[#2C2A29] cursor-pointer"
                title="Zväčšiť rozostup hodín"
              >
                +
              </button>
            </div>
          )}

          {/* PREPÍNAČ MEDZI TÝŽDENNOU ČASOVOU OSOU A KARTAMI */}
          {view === 'week' && (
            <div className="flex items-center bg-white border border-[#E8E2D9] p-0.5 rounded-lg shadow-2xs">
              <button 
                onClick={() => setWeekViewMode('grid')}
                className={`px-2.5 py-1 text-[9px] font-bold uppercase rounded cursor-pointer ${weekViewMode === 'grid' ? 'bg-[#C5A059] text-white' : 'text-[#8C857B] hover:text-[#2C2A29]'}`}
                title="Časová os s plným zobrazením hodín a zoomom"
              >
                ⏱️ Časová os
              </button>
              <button 
                onClick={() => setWeekViewMode('cards')}
                className={`px-2.5 py-1 text-[9px] font-bold uppercase rounded cursor-pointer ${weekViewMode === 'cards' ? 'bg-[#C5A059] text-white' : 'text-[#8C857B] hover:text-[#2C2A29]'}`}
                title="Kompaktný zoznam kariet"
              >
                🗂️ Karty
              </button>
            </div>
          )}

          {/* PREPÍNAČ DEŇ / TÝŽDEŇ / MESIAC / AGENDA */}
          <div className="flex gap-1 bg-white border border-[#E8E2D9] p-1 rounded-lg shadow-2xs">
            {(['day', 'week', 'month', 'agenda'] as ViewMode[]).map(m => (
              <button 
                key={m} 
                onClick={() => setView(m)} 
                className={`px-3 py-1 text-[10px] font-bold uppercase rounded transition-colors cursor-pointer ${
                  view === m ? 'bg-[#2C2A29] text-white' : 'text-[#8C857B] hover:text-[#2C2A29]'
                }`}
              >
                {m === 'day' ? 'Deň' : m === 'week' ? 'Týždeň' : m === 'month' ? 'Mesiac' : '📋 Agenda'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* HLAVNÝ KONTAJNER KALENDÁRA + VOLITEĽNÝ ĽAVÝ BOČNÝ PANEL */}
      <div className="flex flex-col xl:flex-row gap-4 items-start">
        {isSidebarOpen && renderLeftSidebar()}
        <div ref={gridContainerRef} className="flex-1 w-full min-w-0 min-h-[400px]">
          {view === 'day' && renderDayView()}
          {view === 'week' && renderWeekView()}
          {view === 'month' && renderMonthView()}
          {view === 'agenda' && renderAgendaView()}
        </div>
      </div>

      {/* MODAL DETAIL UDALOSTI A AKCIE */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          hidePrices={isRudlovaOnly}
          onClose={() => setSelectedEvent(null)}
          onEdit={(evt: CalendarEvent) => {
            setEditingEventData(evt);
            setIsEditingEvent(true);
            setSelectedEvent(null);
          }}
          onDelete={handleDeleteCalendarEvent}
          onRestoreCancelled={handleRestoreCancelledEvent}
          onStatusChange={handleStatusChange}
          onScheduleFollowUp={handleScheduleFollowUp}
          onDuplicate={handleDuplicateEvent}
          onTogglePreOpItem={handleTogglePreOpItem}
          onCheckoutInPOS={!isRudlovaOnly && onCheckoutInPOS ? (evt: CalendarEvent) => {
            setSelectedEvent(null);
            onCheckoutInPOS(evt);
          } : undefined}
          onCreateMedicalDocument={onCreateMedicalDocument ? (evt: CalendarEvent) => {
            setSelectedEvent(null);
            onCreateMedicalDocument(evt);
          } : undefined}
          onOpenPatientFolder={(evt: CalendarEvent) => {
            handleOpenFolderForEvent(evt);
            setSelectedEvent(null);
          }}
          onCancelRequest={(evt: CalendarEvent) => {
            setCancellingEvent(evt);
            setSelectedEvent(null);
          }}
          onToggleDepositPaid={(evt: CalendarEvent) => {
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
          existingEvents={calendarEvents}
          hidePrices={isRudlovaOnly}
          lockRoomId={isRudlovaOnly ? 'sala_rudlova' : undefined}
          onClose={() => setIsEditingEvent(false)}
          onSave={handleSaveModalEditedEvent}
          onDelete={handleDeleteCalendarEvent}
          isSaving={isSaving}
        />
      )}

      {/* MODAL PRE ZRUŠENIE TERMÍNU S DÔVODOM + PONUKA NÁHRADY Z ČAKACEJ LISTINY */}
      {cancellingEvent && (
        <div className="fixed inset-0 bg-[#2C2A29]/60 flex items-center justify-center z-50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-xl border border-[#E8E2D9] space-y-4 my-auto">
            <h3 className="font-brand text-lg font-bold text-rose-700 uppercase border-b pb-2">❌ Zrušenie Termínu</h3>
            <p className="text-xs text-[#8C857B]">
              Udalosť: <strong className="text-[#2C2A29]">{cancellingEvent.title}</strong> ({cancellingEvent.patientName}) •{' '}
              <span className="font-mono font-bold text-[#2C2A29]">{cancellingEvent.date} {cancellingEvent.startTime}–{cancellingEvent.endTime}</span>
            </p>

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

              {/* AUTOMATICKÁ PONUKA NÁHRADNÍKOV Z ČAKACEJ LISTINY */}
              {waitingList.length > 0 && (
                <div className="bg-amber-50/90 border border-[#C5A059] p-3 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase text-amber-950 flex items-center gap-1">
                      <span>⚡</span> Okamžite obsadiť uvoľnené okno z Čakacej listiny:
                    </span>
                    <span className="text-[9px] font-bold bg-amber-200 text-amber-950 px-1.5 py-0.5 rounded">
                      {waitingList.length} kandidáti
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
                    {waitingList.map(wl => (
                      <div
                        key={wl.id}
                        className="bg-white p-2 rounded-lg border border-amber-200 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-[#2C2A29] truncate">
                            👤 {wl.patientName} <span className="text-[10px] font-normal text-[#8C857B]">({wl.patientPhone || 'bez tel.'})</span>
                          </div>
                          <div className="text-[10px] text-[#6B6357] truncate">
                            {wl.procedureTitle} • {wl.durationMinutes} min • {wl.preferredDoctor}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleReplaceCancelledWithWaitingList(wl)}
                          className="px-2.5 py-1.5 bg-[#2C2A29] hover:bg-[#C5A059] text-white rounded-lg text-[9.5px] font-bold uppercase shrink-0 cursor-pointer transition-colors"
                        >
                          ⚡ Obsadiť termín
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setCancellingEvent(null)} className="px-4 py-2 font-bold text-[#8C857B] cursor-pointer">SPÄŤ</button>
                <button type="submit" className="px-5 py-2 bg-rose-700 text-white font-bold rounded-xl uppercase cursor-pointer">IBA ZRUŠIŤ TERMÍN</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: HROMADNÉ PRIPOMIENKY NA ZAJTRA (RECEPČNÝ PANEL) */}
      {isTomorrowRemindersOpen && (
        <div className="fixed inset-0 bg-[#2C2A29]/65 flex items-center justify-center z-50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white p-5 sm:p-6 rounded-2xl w-full max-w-2xl shadow-2xl border border-[#E8E2D9] space-y-4 my-auto max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-3 shrink-0">
              <div>
                <h3 className="font-brand text-lg font-bold text-[#2C2A29] uppercase flex items-center gap-2">
                  <span>🔔</span> Hromadné pripomienky termínov — {tomorrowInfo.label} ({tomorrowInfo.dateStr})
                </h3>
                <p className="text-[10px] uppercase tracking-wider text-[#8C857B]">
                  1-klikové odoslanie WhatsApp / SMS pripomienky a označenie potvrdenia účasti pacientom
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTomorrowRemindersOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto space-y-2.5 flex-1 pr-1">
              {tomorrowInfo.events.length === 0 ? (
                <div className="p-8 text-center bg-[#FAF8F5] rounded-xl border border-[#E8E2D9] text-xs text-[#8C857B]">
                  Na tento deň nie sú naplánované žiadne pacientske termíny.
                </div>
              ) : (
                tomorrowInfo.events.map(ev => {
                  const isConfirmed = ev.status === 'confirmed';
                  const phone = getEventPhone(ev);
                  const room = getRoomInfo(ev.roomId);
                  return (
                    <div
                      key={ev.id}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                        isConfirmed
                          ? 'bg-emerald-50/60 border-emerald-300'
                          : 'bg-[#FAF8F5] border-[#E8E2D9]'
                      }`}
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs font-bold text-[#2C2A29] bg-white px-2 py-0.5 rounded border border-[#E8E2D9]">
                            {ev.startTime} – {ev.endTime}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${room.badgeColor}`}>
                            {room.icon} {room.shortName}
                          </span>
                          {getEventTypeBadge(ev.type, ev.freeformCategory)}
                        </div>
                        <div className="font-bold text-sm text-[#2C2A29] truncate">
                          👤 {ev.patientName} <span className="font-normal text-xs text-[#6B6357]">— {ev.title}</span>
                        </div>
                        <div className="text-[11px] text-[#8C857B] font-mono">
                          📞 {phone || 'Telefón nezadaný'} • 🩺 {ev.operator || ev.doctorName}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                        <button
                          type="button"
                          onClick={() => sendWhatsApp(ev)}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold uppercase cursor-pointer flex items-center gap-1"
                        >
                          <span>💬</span> WhatsApp
                        </button>
                        <button
                          type="button"
                          onClick={() => sendSMS(ev)}
                          className="px-2.5 py-1.5 bg-[#2C2A29] hover:bg-[#C5A059] text-white rounded-lg text-[10px] font-bold uppercase cursor-pointer flex items-center gap-1"
                        >
                          <span>📲</span> SMS
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(ev, isConfirmed ? 'planned' : 'confirmed')}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border cursor-pointer transition-colors ${
                            isConfirmed
                              ? 'bg-emerald-700 text-white border-emerald-700'
                              : 'bg-white hover:bg-emerald-50 text-emerald-900 border-emerald-300'
                          }`}
                        >
                          {isConfirmed ? '✅ Potvrdené' : 'Označiť potvrdené'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#E8E2D9] shrink-0">
              <span className="text-[11px] font-bold text-[#6B6357]">
                Potvrdených: <strong className="text-emerald-700">{tomorrowInfo.events.filter(e => e.status === 'confirmed').length}</strong> z {tomorrowInfo.events.length}
              </span>
              <div className="flex items-center gap-2">
                {tomorrowInfo.events.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      tomorrowInfo.events.forEach(ev => {
                        if (ev.status !== 'confirmed') {
                          handleStatusChange(ev, 'confirmed');
                        }
                      });
                      showToast('✅ Všetky zajtrajšie termíny boli označené ako potvrdené');
                    }}
                    className="px-3.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 rounded-xl text-[10px] font-bold uppercase cursor-pointer"
                  >
                    ✅ Potvrdiť všetky
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsTomorrowRemindersOpen(false)}
                  className="px-4 py-1.5 bg-[#2C2A29] text-white rounded-xl text-[10px] font-bold uppercase cursor-pointer"
                >
                  Zavrieť
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ČAKACIA LISTINA (WAITING LIST) */}
      {isWaitingListModalOpen && (
        <div className="fixed inset-0 bg-[#2C2A29]/65 flex items-center justify-center z-50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white p-5 sm:p-6 rounded-2xl w-full max-w-3xl shadow-2xl border border-[#E8E2D9] space-y-4 my-auto max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-3 shrink-0">
              <div>
                <h3 className="font-brand text-lg font-bold text-[#2C2A29] uppercase flex items-center gap-2">
                  <span>⏳</span> Čakacia listina pacientov (Waiting List)
                </h3>
                <p className="text-[10px] uppercase tracking-wider text-[#8C857B]">
                  Pacienti čakajúci na skorší termín operácie alebo konzultácie pri uvoľnení okna
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsWaitingListModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 flex-1 pr-1 text-xs">
              {/* FORMULÁR PRIDANIA PACIENTA NA ČAKACIU LISTINU */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newWaitEntry.patientName?.trim()) return;
                  const entry: WaitingListEntry = {
                    id: `WL-${Date.now()}`,
                    patientName: newWaitEntry.patientName.trim(),
                    patientPhone: newWaitEntry.patientPhone || '',
                    patientEmail: newWaitEntry.patientEmail || '',
                    type: (newWaitEntry.type as EventType) || 'operacia',
                    procedureTitle: newWaitEntry.procedureTitle || 'Operácia / Konzultácia',
                    preferredDoctor: newWaitEntry.preferredDoctor || 'MUDr. Ján Mráz',
                    roomId: newWaitEntry.roomId || 'sala_say',
                    durationMinutes: Number(newWaitEntry.durationMinutes) || 60,
                    anesthesiaType: newWaitEntry.anesthesiaType || 'TIVA',
                    totalPrice: Number(newWaitEntry.totalPrice) || 0,
                    depositAmount: Number(newWaitEntry.depositAmount) || 0,
                    isDepositPaid: !!newWaitEntry.isDepositPaid,
                    preferredDatesNote: newWaitEntry.preferredDatesNote || '',
                    priority: (newWaitEntry.priority as any) || 'urgent',
                    notes: newWaitEntry.notes || '',
                    createdAt: formatLocalDate(),
                  };
                  commitWaitingListUpdate(prev => [entry, ...prev]);
                  setNewWaitEntry({
                    patientName: '',
                    patientPhone: '',
                    patientEmail: '',
                    type: 'operacia',
                    procedureTitle: '',
                    preferredDoctor: 'MUDr. Ján Mráz',
                    roomId: 'sala_say',
                    durationMinutes: 120,
                    anesthesiaType: 'TIVA',
                    totalPrice: 3500,
                    depositAmount: 500,
                    isDepositPaid: false,
                    preferredDatesNote: 'Čo najskôr pri uvoľnení termínu',
                    priority: 'urgent',
                    notes: '',
                  });
                  showToast(`⏳ Pacient ${entry.patientName} bol pridaný na čakaciu listinu`);
                }}
                className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E8E2D9] space-y-2.5"
              >
                <span className="text-[10px] font-bold uppercase text-[#2C2A29] block">
                  ➕ Pridať nového záujemcu na čakaciu listinu
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Meno pacienta *"
                    value={newWaitEntry.patientName || ''}
                    onChange={e => setNewWaitEntry(prev => ({ ...prev, patientName: e.target.value }))}
                    className="border border-[#E8E2D9] bg-white p-2 rounded-lg font-semibold"
                  />
                  <input
                    type="tel"
                    placeholder="Telefón (+421...)"
                    value={newWaitEntry.patientPhone || ''}
                    onChange={e => setNewWaitEntry(prev => ({ ...prev, patientPhone: e.target.value }))}
                    className="border border-[#E8E2D9] bg-white p-2 rounded-lg"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Požadovaný zákrok (napr. Augmentácia) *"
                    value={newWaitEntry.procedureTitle || ''}
                    onChange={e => setNewWaitEntry(prev => ({ ...prev, procedureTitle: e.target.value }))}
                    className="border border-[#E8E2D9] bg-white p-2 rounded-lg font-semibold"
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <select
                    value={newWaitEntry.type || 'operacia'}
                    onChange={e => setNewWaitEntry(prev => ({ ...prev, type: e.target.value as EventType }))}
                    className="border border-[#E8E2D9] bg-white p-2 rounded-lg font-bold"
                  >
                    <option value="operacia">🔪 Operácia</option>
                    <option value="konzultacia">🩺 Konzultácia</option>
                    <option value="osetrenie">💉 Ošetrenie</option>
                    <option value="kontrola">🔍 Kontrola</option>
                  </select>
                  <select
                    value={newWaitEntry.preferredDoctor || 'MUDr. Ján Mráz'}
                    onChange={e => setNewWaitEntry(prev => ({ ...prev, preferredDoctor: e.target.value }))}
                    className="border border-[#E8E2D9] bg-white p-2 rounded-lg font-semibold"
                  >
                    {CLINIC_STAFF.filter(s => s.type === 'doctor').map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                  <select
                    value={newWaitEntry.durationMinutes || 120}
                    onChange={e => setNewWaitEntry(prev => ({ ...prev, durationMinutes: Number(e.target.value) }))}
                    className="border border-[#E8E2D9] bg-white p-2 rounded-lg font-semibold"
                  >
                    <option value={30}>30 min</option>
                    <option value={60}>60 min (1h)</option>
                    <option value={90}>90 min (1.5h)</option>
                    <option value={120}>120 min (2h)</option>
                    <option value={180}>180 min (3h)</option>
                  </select>
                  <select
                    value={newWaitEntry.priority || 'urgent'}
                    onChange={e => setNewWaitEntry(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="border border-[#E8E2D9] bg-white p-2 rounded-lg font-bold"
                  >
                    <option value="urgent">🔥 Urgentné</option>
                    <option value="normal">⚡ Štandardné</option>
                    <option value="flexible">🌿 Flexibilné</option>
                  </select>
                  <button
                    type="submit"
                    className="bg-[#2C2A29] hover:bg-[#C5A059] text-white font-bold uppercase rounded-lg px-3 py-2 transition-colors cursor-pointer"
                  >
                    + Pridať
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Časová dostupnosť / poznámka (napr. Má predoperačné vyšetrenie aj zálohu, vie prísť do 24h)..."
                  value={newWaitEntry.preferredDatesNote || ''}
                  onChange={e => setNewWaitEntry(prev => ({ ...prev, preferredDatesNote: e.target.value }))}
                  className="w-full border border-[#E8E2D9] bg-white p-2 rounded-lg"
                />
              </form>

              {/* ZOZNAM ČAKAJÚCICH PACIENTOV */}
              <div className="space-y-2">
                {waitingList.length === 0 ? (
                  <div className="p-8 text-center text-[#8C857B] bg-[#FAF8F5] rounded-xl border border-[#E8E2D9]">
                    Čakacia listina je aktuálne prázdna.
                  </div>
                ) : (
                  waitingList.map(wl => (
                    <div
                      key={wl.id}
                      className="p-3 bg-white rounded-xl border border-[#E8E2D9] hover:border-[#C5A059] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                            wl.priority === 'urgent'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : wl.priority === 'normal'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-slate-100 text-slate-700 border border-slate-300'
                          }`}>
                            {wl.priority === 'urgent' ? '🔥 Urgentné' : wl.priority === 'normal' ? '⚡ Štandard' : '🌿 Flexibilné'}
                          </span>
                          {getEventTypeBadge(wl.type)}
                          <strong className="text-sm text-[#2C2A29]">{wl.patientName}</strong>
                          {wl.patientPhone && <span className="font-mono text-xs text-[#8C857B]">📞 {wl.patientPhone}</span>}
                        </div>
                        <div className="font-bold text-xs text-[#2C2A29]">
                          {wl.procedureTitle} <span className="font-normal text-[#6B6357]">• Trvanie: {wl.durationMinutes} min • Lekár: {wl.preferredDoctor}</span>
                        </div>
                        {wl.preferredDatesNote && (
                          <div className="text-[11px] text-amber-900 bg-amber-50/70 px-2 py-0.5 rounded border border-amber-200 inline-block">
                            📌 {wl.preferredDatesNote}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const startMin = 9 * 60;
                            const endMin = startMin + (wl.durationMinutes || 60);
                            setNewEvent({
                              roomId: wl.roomId || (wl.type === 'operacia' ? 'sala_say' : 'ambulancia'),
                              type: wl.type,
                              status: 'confirmed',
                              patientName: wl.patientName,
                              patientPhone: wl.patientPhone || '',
                              patientEmail: wl.patientEmail || '',
                              title: wl.procedureTitle,
                              doctorName: wl.preferredDoctor,
                              assignedTo: wl.preferredDoctor,
                              operator: wl.preferredDoctor,
                              date: formatLocalDate(currentDate),
                              startTime: minutesToTimeStr(startMin),
                              endTime: minutesToTimeStr(endMin),
                              isAllDay: false,
                              anesthesiaType: wl.anesthesiaType || 'TIVA',
                              totalPrice: wl.totalPrice ?? (wl.type === 'operacia' ? 3500 : 50),
                              depositAmount: wl.depositAmount ?? (wl.type === 'operacia' ? 500 : 0),
                              isDepositPaid: !!wl.isDepositPaid,
                              notes: wl.notes || wl.preferredDatesNote || '',
                            });
                            commitWaitingListUpdate(prev => prev.filter(item => item.id !== wl.id));
                            setIsWaitingListModalOpen(false);
                            setIsAddingEvent(true);
                          }}
                          className="px-3 py-1.5 bg-[#2C2A29] hover:bg-[#C5A059] text-white rounded-xl text-[10px] font-bold uppercase cursor-pointer transition-colors"
                        >
                          📅 Naplánovať do kalendára
                        </button>
                        <button
                          type="button"
                          onClick={() => commitWaitingListUpdate(prev => prev.filter(item => item.id !== wl.id))}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-[10px] font-bold cursor-pointer"
                          title="Odstrániť z čakacej listiny"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#E8E2D9] shrink-0">
              <button
                type="button"
                onClick={() => setIsWaitingListModalOpen(false)}
                className="px-5 py-2 bg-[#2C2A29] text-white rounded-xl text-[10px] font-bold uppercase cursor-pointer"
              >
                Zavrieť
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PRIDANIA NOVEJ UDALOSTI */}
      {isAddingEvent && (
        <EventFormModal
          isOpen={isAddingEvent}
          mode="create"
          initialData={newEvent}
          existingEvents={calendarEvents}
          hidePrices={isRudlovaOnly}
          lockRoomId={isRudlovaOnly ? 'sala_rudlova' : undefined}
          onClose={() => setIsAddingEvent(false)}
          onSave={handleSaveModalCreatedEvent}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
