export type EventType = 'operacia' | 'konzultacia' | 'osetrenie' | 'kontrola' | 'volno';

export type FreeformCategory = 'obed' | 'dovolenka' | 'teambuilding' | 'skolenie' | 'sanitarny_den' | 'ine';

export type AnesthesiaType = 'TIVA' | 'LA' | 'sedacia' | 'celkova' | 'ina';

export type ClinicStayType = 'ambulantne' | 'dospanie' | 'hospitalizacia';

export interface AnesthesiaOption {
  id: string;
  label: string;
  shortLabel: string;
  badge: string;
  pillBg: string;
  description: string;
  isPrimary?: boolean;
}

export const ANESTHESIA_OPTIONS: AnesthesiaOption[] = [
  { 
    id: 'TIVA', 
    label: 'TIVA (Totálna intravenózna anestézia)', 
    shortLabel: 'TIVA', 
    badge: 'bg-purple-100 text-purple-900 border-purple-300',
    pillBg: 'bg-purple-700 text-white',
    description: 'Kompletná vnútrožilová anestézia vedená anesteziológom (OAIM)',
    isPrimary: true
  },
  { 
    id: 'LA', 
    label: 'LA (Lokálna anestézia)', 
    shortLabel: 'LA', 
    badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    pillBg: 'bg-emerald-700 text-white',
    description: 'Miestne znecitlivenie operovanej oblasti operatérom',
    isPrimary: true
  },
  { 
    id: 'sedacia', 
    label: 'Analgosedácia / Sedácia', 
    shortLabel: 'Sedácia', 
    badge: 'bg-blue-100 text-blue-900 border-blue-300',
    pillBg: 'bg-blue-700 text-white',
    description: 'Tlmenie bolesti a vedomia pri zachovanom spontánnom dýchaní'
  },
  { 
    id: 'celkova', 
    label: 'Celková inhalačná anestézia (OAIM)', 
    shortLabel: 'Celková', 
    badge: 'bg-amber-100 text-amber-900 border-amber-300',
    pillBg: 'bg-amber-700 text-white',
    description: 'Klasická celková anestézia s intubáciou / LMA'
  },
  { 
    id: 'ina', 
    label: 'Iná anestézia', 
    shortLabel: 'Iná', 
    badge: 'bg-gray-100 text-gray-800 border-gray-300',
    pillBg: 'bg-gray-700 text-white',
    description: 'Iná špecifická technika anestézie'
  }
];

export interface ClinicStayOption {
  id: ClinicStayType;
  label: string;
  shortLabel: string;
  icon: string;
  badge: string;
  description: string;
}

export const CLINIC_STAY_OPTIONS: ClinicStayOption[] = [
  {
    id: 'ambulantne',
    label: 'Ambulantne',
    shortLabel: 'Ambulantne',
    icon: '🚶',
    badge: 'bg-sky-100 text-sky-900 border-sky-300',
    description: 'Odchod pacienta domov v deň zákroku (po zotavení)'
  },
  {
    id: 'dospanie',
    label: 'Dospanie na izbe',
    shortLabel: 'Dospanie',
    icon: '🛏️',
    badge: 'bg-amber-100 text-amber-900 border-amber-300',
    description: 'Zotavenie na dospávacej izbe po anestézii (observácia)'
  },
  {
    id: 'hospitalizacia',
    label: 'Hospitalizácia',
    shortLabel: 'Hospitalizácia',
    icon: '🏥',
    badge: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    description: 'Prenocovanie na klinike s nepretržitou 24h starostlivosťou'
  }
];

export const getAnesthesiaInfo = (anesthesiaType?: string) => {
  if (!anesthesiaType) return null;
  const match = ANESTHESIA_OPTIONS.find(o => 
    o.id.toLowerCase() === anesthesiaType.toLowerCase() || 
    o.shortLabel.toLowerCase() === anesthesiaType.toLowerCase() ||
    anesthesiaType.toLowerCase().includes(o.id.toLowerCase())
  );
  if (match) return match;
  return {
    id: anesthesiaType,
    label: anesthesiaType,
    shortLabel: anesthesiaType,
    badge: 'bg-gray-100 text-gray-800 border-gray-300',
    pillBg: 'bg-gray-700 text-white',
    description: anesthesiaType
  };
};

export const getClinicStayInfo = (stay?: string) => {
  if (!stay) return null;
  const match = CLINIC_STAY_OPTIONS.find(s => s.id === stay || s.label.toLowerCase() === stay.toLowerCase());
  if (match) return match;
  return {
    id: stay as ClinicStayType,
    label: stay,
    shortLabel: stay,
    icon: '🏥',
    badge: 'bg-gray-100 text-gray-800 border-gray-300',
    description: stay
  };
};

export interface CalendarEvent {
  id: string;
  googleEventId?: string; // ID udalosti v Google Kalendári (pre 2-smernú synchronizáciu)
  calendarId?: string;
  calendarName?: string;
  isGoogleSynced?: boolean;
  roomId?: string;
  roomName?: string;
  assignedTo?: string;
  patientId?: string;
  patientName: string;
  patientPhone?: string;
  patientEmail?: string;
  doctorName: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  isAllDay?: boolean;
  type: EventType;
  anesthesiaType?: string; // TIVA, LA, Sedácia, Celková...
  clinicStay?: ClinicStayType | string; // 'ambulantne' | 'dospanie' | 'hospitalizacia'
  notes?: string;

  // VOĽNÝ POPIS / INTERNÁ UDALOSŤ
  freeformCategory?: FreeformCategory;

  // OPERAČNÝ DEŇ & TÍM
  operator?: string;
  anesthesiologist?: string;
  anesthesiaNurse?: string;
  scrubNurse?: string;
  specialEquipment?: string[];
  specialEquipmentOther?: string;
  materials?: string[];
  materialNotes?: string;
  
  // FINANČNÉ POLOŽKY A ZÁLOHOVÁ FAKTÚRA
  totalPrice?: number;
  depositAmount?: number;
  isDepositPaid?: boolean;

  // STAV ZRUŠENIA A DÔVOD
  isCancelled?: boolean;
  cancelReason?: string;

  patientBirthNumber?: string;
  operationTitle?: string;     // Po akej operácii / zákroku je kontrola (napr. "Augmentácia prsníkov")
  operationDate?: string;      // Dátum kedy prebehla operácia (napr. "2026-08-12")
  operationRecordId?: string;  // ID lekárskeho záznamu / operačného protokolu
  operationDoctor?: string;    // Operatér predchádzajúceho zákroku (napr. "MUDr. Ján Mráz")
  operationNotes?: string;     // Použité implantáty, materiál a pooperačné inštrukcie
  controlInterval?: string;    // Fáza kontroly (napr. "1. pooperačná kontrola (preväz)", "14 dní (vybratie stehov)", "1 mesiac", "3 mesiace", "6 mesiacov", "Ročná kontrola")
}

export interface ClinicRoom {
  id: string;
  name: string;
  shortName: string;
  color: string;
  badgeBg: string;
  badgeColor?: string;
  borderAccent: string;
  icon: string;
  description: string;
}

export const CLINIC_ROOMS: ClinicRoom[] = [
  {
    id: 'ambulancia',
    name: 'Ambulancia',
    shortName: 'AMB',
    color: '#0284C7',
    badgeBg: 'bg-sky-50 text-sky-800 border-sky-300',
    badgeColor: 'bg-sky-50 text-sky-800 border-sky-300',
    borderAccent: 'border-l-sky-500',
    icon: '🩺',
    description: 'Konzultácie, vstupné vyšetrenia, kontroly a estetické ošetrenia'
  },
  {
    id: 'sala_say',
    name: 'Operačné sály SAY',
    shortName: 'SÁLA SAY',
    color: '#2C2A29',
    badgeBg: 'bg-[#2C2A29] text-white border-[#2C2A29]',
    badgeColor: 'bg-[#2C2A29] text-white border-[#2C2A29]',
    borderAccent: 'border-l-[#2C2A29]',
    icon: '🏥',
    description: 'Hlavné operačné sály SAY CLINIC (celková a lokálna anestézia)'
  },
  {
    id: 'sala_rudlova',
    name: 'Operačné sály Rudlová',
    shortName: 'SÁLA RUDLOVÁ',
    color: '#C5A059',
    badgeBg: 'bg-amber-100 text-amber-900 border-[#C5A059]',
    badgeColor: 'bg-amber-100 text-amber-900 border-[#C5A059]',
    borderAccent: 'border-l-[#C5A059]',
    icon: '🏛️',
    description: 'Operačné sály pracovisko Rudlová'
  },
  {
    id: 'dospavacia_izba',
    name: 'Dospávacia miestnosť',
    shortName: 'DOSPÁVACIA',
    color: '#059669',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    borderAccent: 'border-l-emerald-500',
    icon: '🛏️',
    description: 'Pooperačné zotavovacie lôžka a observácia pacientov'
  },
];

export const getRoomInfo = (roomId?: string): ClinicRoom => {
  return CLINIC_ROOMS.find(r => r.id === roomId) || CLINIC_ROOMS[0];
};

export interface ClinicStaffMember {
  id: string;
  name: string;
  role: string;
  specialization?: string;
  type: 'doctor' | 'anesthesiologist' | 'nurse' | 'manager' | 'team';
}

export const CLINIC_STAFF: ClinicStaffMember[] = [
  { id: 'all_team', name: 'Celý tím kliniky', role: 'Všetci pracovníci', type: 'team' },
  { id: 'mraz', name: 'MUDr. Ján Mráz', role: 'Plastický chirurg & CEO', type: 'doctor' },
  { id: 'srokova', name: 'MUDr. Zuzana Sroková', role: 'Lekár / Plastický chirurg', type: 'doctor' },
  { id: 'tran', name: 'MUDr. Minh Tuong Tran', role: 'Lekár / Chirurg', type: 'doctor' },
  { id: 'kovac', name: 'MUDr. Peter Kováč', role: 'Anesteziológ (OAIM)', type: 'anesthesiologist' },
  { id: 'novakova', name: 'MUDr. Viera Nováková', role: 'Anesteziologička', type: 'anesthesiologist' },
  { id: 'foltani', name: 'Ema Foltáni', role: 'Zdravotná sestra / Inštrumentárka', type: 'nurse' },
  { id: 'foltaniova', name: 'Viktória Foltániová', role: 'Zdravotná sestra', type: 'nurse' },
  { id: 'lenhartova', name: 'Sabina Lenhartová', role: 'Inštrumentárka / Sestra', type: 'nurse' },
  { id: 'mala', name: 'Bc. Jana Malá', role: 'Anesteziologická sestra', type: 'nurse' },
  { id: 'anesteziolog', name: 'Anesteziológ', role: 'Anesteziológ (OAIM)', type: 'anesthesiologist' },
  { id: 'anest_sestra', name: 'Anesteziologická sestra', role: 'Anesteziologická sestra', type: 'nurse' },
  { id: 'mecerodova', name: 'Ing. Barbara Mecerodová, MBA', role: 'Klinický manažment', type: 'manager' },
  { id: 'solivajsova', name: 'Mgr. Elena Solivajsová', role: 'Recepcia & Manažment', type: 'manager' },
];

export const SURGERY_EQUIPMENT_OPTIONS = [
  '⚡ Liposukcia MicroAire (PAL)',
  '🔊 VASER Ultrasonic',
  '⚡ Bipolárna elektrokoagulácia',
  '☢️ C-rameno / RTG zosilňovač',
  '🧪 Lipofilling / Coleman kanyly',
  '🔬 Operačné lupy / mikroskop',
  '🩸 Redonova odsávačka',
  '💨 Ohrev pacienta (Bair Hugger)',
  '🫁 Monitor vitálnych funkcií'
];

export const SURGERY_MATERIAL_OPTIONS = [
  '🍈 Silikónové implantáty Motiva',
  '🍈 Silikónové implantáty Polytech',
  '🍈 Silikónové implantáty Mentor',
  '👙 Kompresívne prádlo Lipoelastic',
  '🧵 Vstrebateľné stehy PDS / Monocryl',
  '🧴 Tkanivové lepidlo Dermabond',
  '🩹 Špeciálne silikónové krytie',
  '💉 Kyselina hyalurónová / výplň',
  '🧪 Botulotoxín'
];

export const FREEFORM_PRESETS: { category: FreeformCategory; label: string; icon: string; defaultTitle: string }[] = [
  { category: 'obed', label: 'Obed', icon: '🍽️', defaultTitle: 'Obedňajšia pauza' },
  { category: 'dovolenka', label: 'Dovolenka', icon: '🌴', defaultTitle: 'Dovolenka' },
  { category: 'teambuilding', label: 'Teambuilding', icon: '🎉', defaultTitle: 'Klinický teambuilding' },
  { category: 'skolenie', label: 'Školenie', icon: '🎓', defaultTitle: 'Odborné školenie / seminár' },
  { category: 'sanitarny_den', label: 'Sanitárny deň', icon: '🧼', defaultTitle: 'Sanitárny deň a sterilizácia sály' },
  { category: 'ine', label: 'Iné / Voľný popis', icon: '📌', defaultTitle: 'Interná udalosť' },
];

// ==========================================
// POMOCNÉ FUNKCIE PRE POOPERAČNÉ KONTROLY
// ==========================================

export interface PostOpIntervalOption {
  id: string;
  label: string;
  shortLabel: string;
  daysOffset: number;
  description: string;
}

export const POST_OP_CONTROL_PRESETS: PostOpIntervalOption[] = [
  { 
    id: 'prevaz_7d', 
    label: '1. pooperačná kontrola / preväz (7 dní)', 
    shortLabel: '+7 dní (preväz)', 
    daysOffset: 7, 
    description: 'Kontrola rany, výmena sterilného krytia, kontrola hojenia' 
  },
  { 
    id: 'stehy_14d', 
    label: 'Vybratie stehov / hygiena (14 dní)', 
    shortLabel: '+14 dní (stehy)', 
    daysOffset: 14, 
    description: 'Extrakcia stehov, kontrola stability, inštrukcie k tlakovým masážam' 
  },
  { 
    id: 'mesiac_1m', 
    label: 'Kontrola po 1 mesiaci (opuch & tvar)', 
    shortLabel: '+1 mesiac', 
    daysOffset: 30, 
    description: 'Vyhodnotenie ústupu edému, symetrie a usádzania tkanív / implantátov' 
  },
  { 
    id: 'mesiace_3m', 
    label: 'Kontrola po 3 mesiacoch (stabilizácia)', 
    shortLabel: '+3 mesiace', 
    daysOffset: 90, 
    description: 'Stabilizácia tvaru, uvoľnenie obmedzení športu, zhodnotenie jaziev' 
  },
  { 
    id: 'mesiace_6m', 
    label: 'Kontrola po 6 mesiacoch (výsledok)', 
    shortLabel: '+6 mesiacov', 
    daysOffset: 180, 
    description: 'Polročná kontrola výsledku, porovnávacie fotografie' 
  },
  { 
    id: 'rok_1y', 
    label: 'Ročná pooperačná kontrola (12 mesiacov)', 
    shortLabel: '+1 rok', 
    daysOffset: 365, 
    description: 'Dlhodobá ročná kontrola stavu tkanív a implantátov' 
  }
];

/**
 * Vypočíta cieľový dátum (YYYY-MM-DD) posunom o daný počet dní od dátumu operácie
 */
export const calculateTargetControlDate = (opDateStr: string, daysOffset: number): string => {
  if (!opDateStr) return new Date().toISOString().split('T')[0];
  try {
    const op = new Date(opDateStr);
    if (isNaN(op.getTime())) return new Date().toISOString().split('T')[0];
    const target = new Date(op.getTime() + daysOffset * 24 * 60 * 60 * 1000);
    return target.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
};

/**
 * Vypočíta časový odstup medzi dátumom operácie a dátumom kontroly (alebo dneškom)
 */
export const getPostOpTimeDiff = (opDateStr?: string, targetDateStr?: string): {
  days: number;
  weeks: number;
  months: number;
  displayText: string;
  badgeText: string;
  isFuture: boolean;
} => {
  if (!opDateStr) {
    return { days: 0, weeks: 0, months: 0, displayText: '', badgeText: '', isFuture: false };
  }

  try {
    const opDate = new Date(opDateStr);
    opDate.setHours(0, 0, 0, 0);

    const refDate = targetDateStr ? new Date(targetDateStr) : new Date();
    refDate.setHours(0, 0, 0, 0);

    const diffMs = refDate.getTime() - opDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const isFuture = diffDays < 0;
    const absDays = Math.abs(diffDays);
    const weeks = Math.floor(absDays / 7);
    const months = Math.floor(absDays / 30.4);

    let displayText = '';
    let badgeText = '';

    if (diffDays === 0) {
      displayText = 'V deň operácie (0. pooperačný deň)';
      badgeText = 'Dnes operované';
    } else if (diffDays > 0) {
      if (diffDays < 7) {
        displayText = `${diffDays}. pooperačný deň`;
        badgeText = `${diffDays}. deň po op.`;
      } else if (diffDays < 30) {
        displayText = `${diffDays}. pooperačný deň (${weeks}. týždeň)`;
        badgeText = `${diffDays} dní po op. (${weeks}. týždeň)`;
      } else if (months < 12) {
        displayText = `${months} mesiac${months > 1 && months < 5 ? 'e' : months >= 5 ? 'ov' : ''} po operácii (${absDays}. pooperačný deň)`;
        badgeText = `${months}m po op.`;
      } else {
        const years = (absDays / 365.25).toFixed(1);
        displayText = `${years} roka po operácii (${absDays}. deň)`;
        badgeText = `${years}r po op.`;
      }
    } else {
      displayText = `Naplánované pred operáciou`;
      badgeText = `Pred zákrokom`;
    }

    return {
      days: diffDays,
      weeks,
      months,
      displayText,
      badgeText,
      isFuture
    };
  } catch {
    return { days: 0, weeks: 0, months: 0, displayText: '', badgeText: '', isFuture: false };
  }
};

export const generateDefaultEvents = (): CalendarEvent[] => {
  return [];
};

