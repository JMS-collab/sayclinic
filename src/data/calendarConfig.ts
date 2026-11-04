export type EventType = 'operacia' | 'konzultacia' | 'osetrenie' | 'kontrola' | 'volno';

export type FreeformCategory = 'obed' | 'dovolenka' | 'teambuilding' | 'skolenie' | 'sanitarny_den' | 'ine';

export type AnesthesiaType = 'TIVA' | 'LA' | 'sedacia' | 'celkova' | 'ina';

export type ClinicStayType = 'ambulantne' | 'dospanie' | 'hospitalizacia';

export type EventAttendanceStatus = 'planned' | 'confirmed' | 'arrived' | 'completed' | 'cancelled';

/**
 * Bezpečne naformátuje Date objekt na lokálny reťazec YYYY-MM-DD (bez UTC posunu cez toISOString)
 */
export const formatLocalDate = (date: Date = new Date()): string => {
  const d = isNaN(date.getTime()) ? new Date() : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Bezpečne parsuje YYYY-MM-DD reťazec na lokálny Date objekt (na 12:00 napoludnie kvôli letnému/zimnému času)
 */
export const parseLocalDate = (dateStr?: string): Date => {
  if (!dateStr) return new Date();
  const clean = dateStr.split('T')[0];
  const parts = clean.split('-').map(Number);
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0, 0);
  }
  const fallback = new Date(dateStr);
  return isNaN(fallback.getTime()) ? new Date() : fallback;
};

export interface EventStatusOption {
  id: EventAttendanceStatus;
  label: string;
  shortLabel: string;
  icon: string;
  badge: string;
  dotColor: string;
}

export const EVENT_STATUS_OPTIONS: EventStatusOption[] = [
  {
    id: 'planned',
    label: 'Naplánované (čaká na potvrdenie)',
    shortLabel: 'Naplánované',
    icon: '🗓️',
    badge: 'bg-slate-100 text-slate-800 border-slate-300',
    dotColor: 'bg-slate-400',
  },
  {
    id: 'confirmed',
    label: 'Potvrdené pacientom',
    shortLabel: 'Potvrdené',
    icon: '✅',
    badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    dotColor: 'bg-emerald-500',
  },
  {
    id: 'arrived',
    label: 'Pacient na klinike (Check-in)',
    shortLabel: 'Na klinike',
    icon: '🏥',
    badge: 'bg-amber-100 text-amber-900 border-amber-300',
    dotColor: 'bg-amber-500',
  },
  {
    id: 'completed',
    label: 'Zákrok / Termín ukončený',
    shortLabel: 'Ukončené',
    icon: '🏁',
    badge: 'bg-sky-100 text-sky-900 border-sky-300',
    dotColor: 'bg-sky-500',
  },
  {
    id: 'cancelled',
    label: 'Zrušené (Storno)',
    shortLabel: 'Zrušené',
    icon: '❌',
    badge: 'bg-rose-100 text-rose-900 border-rose-300',
    dotColor: 'bg-rose-500',
  },
];

export const getEventStatusInfo = (status?: EventAttendanceStatus | string, isCancelled?: boolean): EventStatusOption => {
  if (isCancelled || status === 'cancelled') {
    return EVENT_STATUS_OPTIONS.find(s => s.id === 'cancelled')!;
  }
  const match = EVENT_STATUS_OPTIONS.find(s => s.id === status);
  return match || EVENT_STATUS_OPTIONS[0];
};

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
  status?: EventAttendanceStatus;
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

  // PREDOPERAČNÝ SEMAFOR (KONTROLA PRIPRAVENOSTI OPERÁCIE)
  preOpExamReady?: boolean;   // Interné predoperačné vyšetrenie + odbery
  materialsReady?: boolean;   // Implantáty / špecializovaný materiál na sklade
  consentsSigned?: boolean;   // Informované súhlasy pripravené / podpísané

  // PREPOJENIE NADVÄZUJÚCICH / OPAKOVANÝCH BLOKOV
  parentEventId?: string;

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
  { id: 'mraz', name: 'MUDr. Ján Mráz', role: 'Plastický chirurg & CEO', specialization: 'Plastická chirurgia', type: 'doctor' },
  { id: 'srokova', name: 'MUDr. Zuzana Sroková', role: 'Lekár / Plastický chirurg', specialization: 'Plastická chirurgia', type: 'doctor' },
  { id: 'tran', name: 'MUDr. Minh Tuong Tran', role: 'Lekár / Chirurg', specialization: 'Chirurgia', type: 'doctor' },
  { id: 'kasac', name: 'MUDr. Martin Kasáč', role: 'Anesteziológ (OAIM)', specialization: 'OAIM', type: 'anesthesiologist' },
  { id: 'vrban', name: 'MUDr. Vladimír Vrban', role: 'Anesteziológ (OAIM)', specialization: 'OAIM', type: 'anesthesiologist' },
  { id: 'gombosova', name: 'MUDr. Monika Gombošová', role: 'Anesteziologička (OAIM)', specialization: 'OAIM', type: 'anesthesiologist' },
  { id: 'hudecova', name: 'MUDr. Martina Hudecová', role: 'Anesteziologička (OAIM)', specialization: 'OAIM', type: 'anesthesiologist' },
  { id: 'kovac', name: 'MUDr. Peter Kováč', role: 'Anesteziológ (OAIM)', specialization: 'OAIM', type: 'anesthesiologist' },
  { id: 'novakova', name: 'MUDr. Viera Nováková', role: 'Anesteziologička (OAIM)', specialization: 'OAIM', type: 'anesthesiologist' },
  { id: 'anesteziolog', name: 'Anesteziológ', role: 'Externý anesteziológ (OAIM)', specialization: 'OAIM', type: 'anesthesiologist' },
  { id: 'otiepkova', name: 'Katarína Otiepková', role: 'Inštrumentárka / Sestra', specialization: 'Inštrumentárka', type: 'nurse' },
  { id: 'cunderlikova', name: 'Erika Čunderlíková', role: 'Inštrumentárka / Sestra', specialization: 'Inštrumentárka', type: 'nurse' },
  { id: 'rafanedisova', name: 'Izabela Rafanedisová', role: 'Inštrumentárka / Sestra', specialization: 'Inštrumentárka', type: 'nurse' },
  { id: 'papanova', name: 'Anna Papánová', role: 'Anesteziologická sestra', specialization: 'Anest. sestra', type: 'nurse' },
  { id: 'lenhartova', name: 'Sabina Lenhartová', role: 'Zdravotná sestra', specialization: 'Zdravotná sestra', type: 'nurse' },
  { id: 'foltani', name: 'Ema Foltáni', role: 'Zdravotná sestra', specialization: 'Zdravotná sestra', type: 'nurse' },
  { id: 'foltaniova', name: 'Viktória Foltániová', role: 'Zdravotná sestra', specialization: 'Ambulancia & Sála', type: 'nurse' },
  { id: 'halajova', name: 'Denisa Halajová', role: 'Anesteziologická sestra', specialization: 'Anest. sestra', type: 'nurse' },
  { id: 'besinova', name: 'Ivana Bešinová', role: 'Anesteziologická sestra', specialization: 'Anest. sestra', type: 'nurse' },
  { id: 'mala', name: 'Bc. Jana Malá', role: 'Anesteziologická sestra', specialization: 'Anest. sestra', type: 'nurse' },
  { id: 'anest_sestra', name: 'Anesteziologická sestra', role: 'Externá anest. sestra', specialization: 'Anest. sestra', type: 'nurse' },
  { id: 'mecerodova', name: 'Ing. Barbara Mecerodová, MBA', role: 'Klinický manažment', specialization: 'Manažment', type: 'manager' },
  { id: 'solivajsova', name: 'Mgr. Elena Solivajsová', role: 'Recepcia & Manažment', specialization: 'Recepcia', type: 'manager' },
];

export const SURGERY_EQUIPMENT_OPTIONS = [
  '⚡ Liposukcia MicroAire (PAL)',
  '🔊 VASER Ultrasonic',
  '⚡ Bipolárna elektrokoagulácia',
  '🔥 Monopolárna koagulácia / Elektrokauter',
  '🔬 Operačné lupy / mikroskop',
  '💡 Čelové svetlo / LED svetlovod',
  '🧪 Lipofilling / Coleman kanyly + centrifúga',
  '🩸 Redonova odsávačka / aktívne drény',
  '💨 Ohrev pacienta (Bair Hugger)',
  '🦵 Pneumatická kompresia DK (prevencia TEN)',
  '🫁 Monitor vitálnych funkcií / TIVA pumpa',
  '☢️ C-rameno / RTG zosilňovač',
  '🔦 Keller Funnel (bezdotykový aplikátor implantátov)'
];

export const SURGERY_MATERIAL_OPTIONS = [
  '🍈 Silikónové implantáty Motiva',
  '🍈 Silikónové implantáty Polytech',
  '🍈 Silikónové implantáty Mentor',
  '📏 Sizer (skúšobný implantát)',
  '👙 Kompresívne prádlo Lipoelastic (podprsenka + pás)',
  '🩲 Kompresívne prádlo Lipoelastic (nohavice / vesta)',
  '🎀 Kompresívna čelenka / tvárová maska',
  '🧵 Vstrebateľné stehy PDS / Monocryl / Vicryl',
  '🪡 Nevstrebateľné stehy Prolene / Ethilon',
  '🧴 Tkanivové lepidlo Dermabond / Steri-Strip',
  '🩹 Špeciálne silikónové krytie Mepitel / Mepilex',
  '🧪 Odberová nádobka na histológiu (formalín)',
  '💉 Kyselina hyalurónová / výplň',
  '🧪 Botulotoxín (Bocouture / Dysport / Vistabel)',
  '✨ Skinbooster / Profhilo / Polynukleotidy'
];

export interface SurgeryProcedurePreset {
  id: string;
  label: string;
  shortLabel: string;
  icon: string;
  durationMinutes: number;
  anesthesiaType: string;
  clinicStay: ClinicStayType;
  defaultPrice: number;
  defaultDeposit: number;
  equipment: string[];
  materials: string[];
  materialNotesHint?: string;
}

export const SURGERY_PROCEDURE_PRESETS: SurgeryProcedurePreset[] = [
  {
    id: 'augmentacia',
    label: 'Augmentácia prsníkov (zväčšenie implantátmi)',
    shortLabel: '🍈 Augmentácia prsníkov',
    icon: '🍈',
    durationMinutes: 120,
    anesthesiaType: 'TIVA',
    clinicStay: 'hospitalizacia',
    defaultPrice: 3900,
    defaultDeposit: 500,
    equipment: [
      '⚡ Bipolárna elektrokoagulácia',
      '💡 Čelové svetlo / LED svetlovod',
      '🔦 Keller Funnel (bezdotykový aplikátor implantátov)',
      '💨 Ohrev pacienta (Bair Hugger)',
      '🦵 Pneumatická kompresia DK (prevencia TEN)'
    ],
    materials: [
      '🍈 Silikónové implantáty Motiva',
      '👙 Kompresívne prádlo Lipoelastic (podprsenka + pás)',
      '🧵 Vstrebateľné stehy PDS / Monocryl / Vicryl',
      '🧴 Tkanivové lepidlo Dermabond / Steri-Strip'
    ],
    materialNotesHint: 'napr. Motiva Ergonomix 340cc Demi pod sval, Lipoelastic PI Unique veľ. S/M'
  },
  {
    id: 'mastopexia',
    label: 'Modelácia prsníkov (Mastopexia / + implantát)',
    shortLabel: '👙 Modelácia prsníkov',
    icon: '👙',
    durationMinutes: 150,
    anesthesiaType: 'TIVA',
    clinicStay: 'hospitalizacia',
    defaultPrice: 3600,
    defaultDeposit: 500,
    equipment: [
      '⚡ Bipolárna elektrokoagulácia',
      '💨 Ohrev pacienta (Bair Hugger)',
      '🦵 Pneumatická kompresia DK (prevencia TEN)'
    ],
    materials: [
      '👙 Kompresívne prádlo Lipoelastic (podprsenka + pás)',
      '🧵 Vstrebateľné stehy PDS / Monocryl / Vicryl',
      '🧴 Tkanivové lepidlo Dermabond / Steri-Strip'
    ],
    materialNotesHint: 'napr. T-rez / vertikálna mastopexia, kompresná podprsenka Lipoelastic'
  },
  {
    id: 'blefaro_horna',
    label: 'Horná blefaroplastika (korekcia horných viečok)',
    shortLabel: '👁️ Horné viečka (LA)',
    icon: '👁️',
    durationMinutes: 60,
    anesthesiaType: 'LA',
    clinicStay: 'ambulantne',
    defaultPrice: 950,
    defaultDeposit: 200,
    equipment: [
      '⚡ Bipolárna elektrokoagulácia',
      '🔬 Operačné lupy / mikroskop'
    ],
    materials: [
      '🪡 Nevstrebateľné stehy Prolene / Ethilon',
      '🧴 Tkanivové lepidlo Dermabond / Steri-Strip'
    ],
    materialNotesHint: 'Prolene 6-0, Steri-Strip, chladiace vankúšiky po zákroku'
  },
  {
    id: 'blefaro_komplet',
    label: 'Dolná / Kompletná blefaroplastika (horné + dolné viečka)',
    shortLabel: '👀 Dolné / Komplet viečka',
    icon: '👀',
    durationMinutes: 120,
    anesthesiaType: 'TIVA',
    clinicStay: 'dospanie',
    defaultPrice: 1900,
    defaultDeposit: 400,
    equipment: [
      '⚡ Bipolárna elektrokoagulácia',
      '🔬 Operačné lupy / mikroskop'
    ],
    materials: [
      '🪡 Nevstrebateľné stehy Prolene / Ethilon',
      '🧴 Tkanivové lepidlo Dermabond / Steri-Strip'
    ],
    materialNotesHint: 'Subciliárny / transkonjunktiválny prístup, Prolene 6-0, Steri-Strip'
  },
  {
    id: 'liposukcia',
    label: 'VASER / PAL Liposukcia',
    shortLabel: '🔊 VASER Liposukcia',
    icon: '🔊',
    durationMinutes: 120,
    anesthesiaType: 'TIVA',
    clinicStay: 'dospanie',
    defaultPrice: 2800,
    defaultDeposit: 500,
    equipment: [
      '⚡ Liposukcia MicroAire (PAL)',
      '🔊 VASER Ultrasonic',
      '💨 Ohrev pacienta (Bair Hugger)'
    ],
    materials: [
      '🩲 Kompresívne prádlo Lipoelastic (nohavice / vesta)',
      '🪡 Nevstrebateľné stehy Prolene / Ethilon',
      '🩹 Špeciálne silikónové krytie Mepitel / Mepilex'
    ],
    materialNotesHint: 'Oblasti: brucho + boky / stehná, tumescentný roztok, Lipoelastic VH/VD'
  },
  {
    id: 'abdominoplastika',
    label: 'Abdominoplastika (plastika brucha + diastáza)',
    shortLabel: '⏳ Abdominoplastika',
    icon: '⏳',
    durationMinutes: 180,
    anesthesiaType: 'TIVA',
    clinicStay: 'hospitalizacia',
    defaultPrice: 4200,
    defaultDeposit: 500,
    equipment: [
      '⚡ Bipolárna elektrokoagulácia',
      '🔥 Monopolárna koagulácia / Elektrokauter',
      '⚡ Liposukcia MicroAire (PAL)',
      '🩸 Redonova odsávačka / aktívne drény',
      '💨 Ohrev pacienta (Bair Hugger)',
      '🦵 Pneumatická kompresia DK (prevencia TEN)'
    ],
    materials: [
      '🩲 Kompresívne prádlo Lipoelastic (nohavice / vesta)',
      '🧵 Vstrebateľné stehy PDS / Monocryl / Vicryl',
      '🧴 Tkanivové lepidlo Dermabond / Steri-Strip'
    ],
    materialNotesHint: 'Sutúra diastázy priamych brušných svalov PDS 0, brušný pás Lipoelastic'
  },
  {
    id: 'facelift',
    label: 'Facelift / Deep Plane Facelift & Necklift',
    shortLabel: '✨ Facelift / Krk',
    icon: '✨',
    durationMinutes: 210,
    anesthesiaType: 'TIVA',
    clinicStay: 'hospitalizacia',
    defaultPrice: 4800,
    defaultDeposit: 500,
    equipment: [
      '⚡ Bipolárna elektrokoagulácia',
      '🔬 Operačné lupy / mikroskop',
      '💡 Čelové svetlo / LED svetlovod',
      '💨 Ohrev pacienta (Bair Hugger)'
    ],
    materials: [
      '🎀 Kompresívna čelenka / tvárová maska',
      '🧵 Vstrebateľné stehy PDS / Monocryl / Vicryl',
      '🪡 Nevstrebateľné stehy Prolene / Ethilon'
    ],
    materialNotesHint: 'Deep plane SMAS platysmaplastika, tvárová ohlávka Lipoelastic'
  },
  {
    id: 'rhinoplastika',
    label: 'Rhinoplastika / Septorhinoplastika',
    shortLabel: '👃 Rhinoplastika',
    icon: '👃',
    durationMinutes: 150,
    anesthesiaType: 'TIVA',
    clinicStay: 'hospitalizacia',
    defaultPrice: 3800,
    defaultDeposit: 500,
    equipment: [
      '⚡ Bipolárna elektrokoagulácia',
      '💡 Čelové svetlo / LED svetlovod',
      '🔬 Operačné lupy / mikroskop'
    ],
    materials: [
      '🧵 Vstrebateľné stehy PDS / Monocryl / Vicryl',
      '🪡 Nevstrebateľné stehy Prolene / Ethilon',
      '🧴 Tkanivové lepidlo Dermabond / Steri-Strip'
    ],
    materialNotesHint: 'Termoplastická dlaha, silikónové dlahy (splinty), Steri-Strip'
  },
  {
    id: 'otoplastika',
    label: 'Otoplastika (korekcia odstávajúcich ušníc)',
    shortLabel: '👂 Otoplastika (LA)',
    icon: '👂',
    durationMinutes: 90,
    anesthesiaType: 'LA',
    clinicStay: 'ambulantne',
    defaultPrice: 1200,
    defaultDeposit: 200,
    equipment: [
      '⚡ Bipolárna elektrokoagulácia',
      '🔬 Operačné lupy / mikroskop'
    ],
    materials: [
      '🎀 Kompresívna čelenka / tvárová maska',
      '🧵 Vstrebateľné stehy PDS / Monocryl / Vicryl',
      '🪡 Nevstrebateľné stehy Prolene / Ethilon'
    ],
    materialNotesHint: 'Modelácia chrupavky ušnice, kompresívna čelenka Lipoelastic'
  },
  {
    id: 'labiaplastika',
    label: 'Labiaplastika (korekcia malých pyskov)',
    shortLabel: '🌸 Labiaplastika',
    icon: '🌸',
    durationMinutes: 60,
    anesthesiaType: 'LA',
    clinicStay: 'ambulantne',
    defaultPrice: 1300,
    defaultDeposit: 200,
    equipment: [
      '⚡ Bipolárna elektrokoagulácia'
    ],
    materials: [
      '🧵 Vstrebateľné stehy PDS / Monocryl / Vicryl'
    ],
    materialNotesHint: 'Vstrebateľné stehy Vicryl Rapide 5-0'
  },
  {
    id: 'excizia',
    label: 'Chirurgická excízia znamienka / útvaru + histológia',
    shortLabel: '🩹 Excízia + histológia',
    icon: '🩹',
    durationMinutes: 30,
    anesthesiaType: 'LA',
    clinicStay: 'ambulantne',
    defaultPrice: 180,
    defaultDeposit: 0,
    equipment: [
      '⚡ Bipolárna elektrokoagulácia'
    ],
    materials: [
      '🪡 Nevstrebateľné stehy Prolene / Ethilon',
      '🧪 Odberová nádobka na histológiu (formalín)',
      '🧴 Tkanivové lepidlo Dermabond / Steri-Strip'
    ],
    materialNotesHint: 'Lokalizácia lézie, odoslanie na histopatologické vyšetrenie'
  }
];

export interface TreatmentProcedurePreset {
  id: string;
  label: string;
  shortLabel: string;
  icon: string;
  durationMinutes: number;
  defaultPrice: number;
  defaultDeposit: number;
  materials: string[];
}

export const TREATMENT_PROCEDURE_PRESETS: TreatmentProcedurePreset[] = [
  {
    id: 'botox',
    label: 'Aplikácia botulotoxínu (korekcia vrások / hyperhidróza)',
    shortLabel: '🧪 Botulotoxín',
    icon: '🧪',
    durationMinutes: 30,
    defaultPrice: 220,
    defaultDeposit: 0,
    materials: ['🧪 Botulotoxín (Bocouture / Dysport / Vistabel)']
  },
  {
    id: 'hyaluron',
    label: 'Výplň kyselinou hyalurónovou (pery / kontúry / vrásky)',
    shortLabel: '💉 Kyselina hyalurónová',
    icon: '💉',
    durationMinutes: 45,
    defaultPrice: 320,
    defaultDeposit: 0,
    materials: ['💉 Kyselina hyalurónová / výplň']
  },
  {
    id: 'skinbooster',
    label: 'Bioremodelácia Profhilo / Skinbooster / Polynukleotidy',
    shortLabel: '✨ Profhilo / Skinbooster',
    icon: '✨',
    durationMinutes: 45,
    defaultPrice: 290,
    defaultDeposit: 0,
    materials: ['✨ Skinbooster / Profhilo / Polynukleotidy']
  },
  {
    id: 'prp_mezo',
    label: 'Plazmaterapia (PRP) / Mezoterapia',
    shortLabel: '🩸 Plazmaterapia / Mezo',
    icon: '🩸',
    durationMinutes: 45,
    defaultPrice: 200,
    defaultDeposit: 0,
    materials: []
  },
  {
    id: 'korekcia_jaziev',
    label: 'Korekcia jazvy / aplikácia Diprophos / Kenalog',
    shortLabel: '🩹 Korekcia jazvy',
    icon: '🩹',
    durationMinutes: 20,
    defaultPrice: 90,
    defaultDeposit: 0,
    materials: []
  }
];

export const DURATION_PRESET_MINUTES: { label: string; minutes: number }[] = [
  { label: '15m', minutes: 15 },
  { label: '30m', minutes: 30 },
  { label: '45m', minutes: 45 },
  { label: '1h', minutes: 60 },
  { label: '1.5h', minutes: 90 },
  { label: '2h', minutes: 120 },
  { label: '2.5h', minutes: 150 },
  { label: '3h', minutes: 180 },
  { label: '4h', minutes: 240 },
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
 * Vypočíta cieľový dátum (YYYY-MM-DD) posunom o daný počet dní od dátumu operácie (bez UTC posunu)
 */
export const calculateTargetControlDate = (opDateStr: string, daysOffset: number): string => {
  if (!opDateStr) return formatLocalDate();
  try {
    const op = parseLocalDate(opDateStr);
    if (isNaN(op.getTime())) return formatLocalDate();
    const target = new Date(op.getFullYear(), op.getMonth(), op.getDate() + daysOffset, 12, 0, 0);
    return formatLocalDate(target);
  } catch {
    return formatLocalDate();
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
    const opDate = parseLocalDate(opDateStr);
    opDate.setHours(0, 0, 0, 0);

    const refDate = targetDateStr ? parseLocalDate(targetDateStr) : new Date();
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
      displayText = `Naplánované pred operáciou (${absDays} d.)`;
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

export type RecurrenceRule = 'none' | 'workdays_week' | 'weekly' | 'biweekly' | 'monthly';

export interface EventSaveExtraOptions {
  autoCreateSanitationBlock?: boolean;
  sanitationMinutes?: number;
  autoCreateRecoveryBlock?: boolean;
  recoveryMinutes?: number;
  recurrenceRule?: RecurrenceRule;
  recurrenceCount?: number;
}

export interface SurgeryReadinessItem {
  key: 'isDepositPaid' | 'preOpExamReady' | 'materialsReady' | 'consentsSigned';
  label: string;
  shortLabel: string;
  icon: string;
  ready: boolean;
}

export interface SurgeryReadinessSummary {
  items: SurgeryReadinessItem[];
  readyCount: number;
  totalCount: number;
  isAllReady: boolean;
  badgeClass: string;
  dotClass: string;
  statusLabel: string;
}

/**
 * Vypočíta stav predoperačného semaforu (4 kontrolné body pripravenosti) pre operáciu
 */
export const getSurgeryReadinessSummary = (event: Partial<CalendarEvent>): SurgeryReadinessSummary => {
  const depositRelevant = (event.depositAmount || 0) > 0;
  const depositReady = depositRelevant ? !!event.isDepositPaid : !!event.isDepositPaid || (event.depositAmount === 0 && (event.totalPrice || 0) > 0);

  const items: SurgeryReadinessItem[] = [
    {
      key: 'isDepositPaid',
      label: 'Záloha uhradená',
      shortLabel: 'Záloha',
      icon: '💳',
      ready: !!event.isDepositPaid || (!depositRelevant && event.isDepositPaid !== false && event.depositAmount === 0 && !!event.preOpExamReady),
    },
    {
      key: 'preOpExamReady',
      label: 'Predoperačné vyšetrenie & odbery',
      shortLabel: 'Predop.',
      icon: '🩸',
      ready: !!event.preOpExamReady,
    },
    {
      key: 'materialsReady',
      label: 'Implantáty & materiál na sklade',
      shortLabel: 'Materiál',
      icon: '🍈',
      ready: !!event.materialsReady,
    },
    {
      key: 'consentsSigned',
      label: 'Informované súhlasy pripravené',
      shortLabel: 'Súhlasy',
      icon: '✍️',
      ready: !!event.consentsSigned,
    },
  ];

  // Ak má explicitne nastavené isDepositPaid, rešpektujeme bool hodnotu
  items[0].ready = !!event.isDepositPaid;

  const readyCount = items.filter(i => i.ready).length;
  const totalCount = items.length;
  const isAllReady = readyCount === totalCount;

  let badgeClass = 'bg-rose-100 text-rose-900 border-rose-300';
  let dotClass = 'bg-rose-500';
  let statusLabel = `Nepripravené (${readyCount}/${totalCount})`;

  if (isAllReady) {
    badgeClass = 'bg-emerald-100 text-emerald-900 border-emerald-300';
    dotClass = 'bg-emerald-500';
    statusLabel = `Pripravené na sálu (${readyCount}/${totalCount})`;
  } else if (readyCount >= 2) {
    badgeClass = 'bg-amber-100 text-amber-900 border-amber-300';
    dotClass = 'bg-amber-500';
    statusLabel = `Čiastočne pripravené (${readyCount}/${totalCount})`;
  }

  return {
    items,
    readyCount,
    totalCount,
    isAllReady,
    badgeClass,
    dotClass,
    statusLabel,
  };
};

// ==========================================
// FAREBNÉ SCHÉMY PODĽA LEKÁRA / OPERATÉRA
// ==========================================

export interface DoctorColorScheme {
  id: string;
  doctorName: string;
  shortName: string;
  cardBg: string;
  borderAccent: string;
  badgeBg: string;
  dotColor: string;
  hex: string;
}

export const DOCTOR_COLOR_SCHEMES: DoctorColorScheme[] = [
  {
    id: 'mraz',
    doctorName: 'MUDr. Ján Mráz',
    shortName: 'Dr. Mráz',
    cardBg: 'bg-indigo-50/95 border-indigo-200 text-indigo-950',
    borderAccent: 'border-l-indigo-600',
    badgeBg: 'bg-indigo-600 text-white',
    dotColor: 'bg-indigo-600',
    hex: '#4F46E5',
  },
  {
    id: 'srokova',
    doctorName: 'MUDr. Zuzana Sroková',
    shortName: 'Dr. Sroková',
    cardBg: 'bg-fuchsia-50/95 border-fuchsia-200 text-fuchsia-950',
    borderAccent: 'border-l-fuchsia-600',
    badgeBg: 'bg-fuchsia-600 text-white',
    dotColor: 'bg-fuchsia-600',
    hex: '#C026D3',
  },
  {
    id: 'tran',
    doctorName: 'MUDr. Minh Tuong Tran',
    shortName: 'Dr. Tran',
    cardBg: 'bg-teal-50/95 border-teal-200 text-teal-950',
    borderAccent: 'border-l-teal-600',
    badgeBg: 'bg-teal-600 text-white',
    dotColor: 'bg-teal-600',
    hex: '#0D9488',
  },
  {
    id: 'kovac',
    doctorName: 'MUDr. Peter Kováč',
    shortName: 'Dr. Kováč (OAIM)',
    cardBg: 'bg-cyan-50/95 border-cyan-200 text-cyan-950',
    borderAccent: 'border-l-cyan-600',
    badgeBg: 'bg-cyan-700 text-white',
    dotColor: 'bg-cyan-600',
    hex: '#0891B2',
  },
  {
    id: 'other',
    doctorName: 'Ostatní / Tím',
    shortName: 'Tím kliniky',
    cardBg: 'bg-amber-50/95 border-amber-200 text-amber-950',
    borderAccent: 'border-l-[#C5A059]',
    badgeBg: 'bg-[#2C2A29] text-[#C5A059]',
    dotColor: 'bg-[#C5A059]',
    hex: '#C5A059',
  },
];

export const getDoctorColorScheme = (doctorOrOperator?: string): DoctorColorScheme => {
  if (!doctorOrOperator) return DOCTOR_COLOR_SCHEMES[DOCTOR_COLOR_SCHEMES.length - 1];
  const lower = doctorOrOperator.toLowerCase();
  if (lower.includes('mráz') || lower.includes('mraz')) return DOCTOR_COLOR_SCHEMES[0];
  if (lower.includes('srokov')) return DOCTOR_COLOR_SCHEMES[1];
  if (lower.includes('tran')) return DOCTOR_COLOR_SCHEMES[2];
  if (lower.includes('kováč') || lower.includes('kovac')) return DOCTOR_COLOR_SCHEMES[3];
  return DOCTOR_COLOR_SCHEMES[DOCTOR_COLOR_SCHEMES.length - 1];
};

// ==========================================
// ČAKACIA LISTINA (WAITING LIST)
// ==========================================

export type WaitingListPriority = 'urgent' | 'normal' | 'flexible';

export interface WaitingListEntry {
  id: string;
  patientId?: string;
  patientName: string;
  patientPhone?: string;
  patientEmail?: string;
  type: EventType;
  procedureTitle: string;
  preferredDoctor: string;
  roomId: string;
  durationMinutes: number;
  anesthesiaType?: string;
  totalPrice?: number;
  depositAmount?: number;
  isDepositPaid?: boolean;
  preferredDatesNote?: string; // napr. "Čo najskôr, môže prísť do 24h", "Utorky alebo štvrtky ráno"
  priority: WaitingListPriority;
  notes?: string;
  createdAt: string;
}

export const generateDefaultWaitingList = (): WaitingListEntry[] => [
  {
    id: 'WL-DEFAULT-1',
    patientName: 'Mgr. Simona Kráľová',
    patientPhone: '+421 905 412 889',
    patientEmail: 'simona.kralova@example.sk',
    type: 'operacia',
    procedureTitle: 'Horná blefaroplastika (korekcia horných viečok)',
    preferredDoctor: 'MUDr. Ján Mráz',
    roomId: 'sala_say',
    durationMinutes: 60,
    anesthesiaType: 'LA',
    totalPrice: 950,
    depositAmount: 200,
    isDepositPaid: true,
    preferredDatesNote: 'Má predoperačné aj zálohu, vie prísť kedykoľvek pri uvoľnení termínu',
    priority: 'urgent',
    notes: 'Pacientka prosí o skorší termín pred letom.',
    createdAt: formatLocalDate(),
  },
  {
    id: 'WL-DEFAULT-2',
    patientName: 'Ing. Michaela Vargová',
    patientPhone: '+421 911 774 302',
    patientEmail: 'michaela.vargova@example.sk',
    type: 'konzultacia',
    procedureTitle: 'Konzultácia - Augmentácia prsníkov Motiva',
    preferredDoctor: 'MUDr. Ján Mráz',
    roomId: 'ambulancia',
    durationMinutes: 30,
    totalPrice: 50,
    depositAmount: 0,
    isDepositPaid: false,
    preferredDatesNote: 'Preferuje doobedné hodiny (08:00 - 12:00)',
    priority: 'normal',
    notes: 'Záujem o Motiva Ergonomix.',
    createdAt: formatLocalDate(),
  },
];

export const generateDefaultEvents = (): CalendarEvent[] => {
  return [];
};
