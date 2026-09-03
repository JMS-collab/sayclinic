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
  calendarId?: string;
  calendarName?: string;
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
}

export interface ClinicRoom {
  id: string;
  name: string;
  shortName: string;
  color: string;
  badgeBg: string;
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
  { id: 'lenhartova', name: 'Sabina Lenhartová', role: 'Inštrumentárka / Sestra', type: 'nurse' },
  { id: 'mala', name: 'Bc. Jana Malá', role: 'Anesteziologická sestra', type: 'nurse' },
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

export const generateDefaultEvents = () => {
  const today = new Date();
  const getISO = (offset: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0];
  };

  const todayStr = getISO(0);
  const tomorrowStr = getISO(1);
  const dayAfterStr = getISO(2);

  return [
    {
      id: 'seed-evt-1',
      roomId: 'sala_say',
      roomName: 'Operačné sály SAY',
      assignedTo: 'MUDr. Ján Mráz',
      doctorName: 'MUDr. Ján Mráz',
      operator: 'MUDr. Ján Mráz',
      anesthesiologist: 'MUDr. Peter Kováč',
      anesthesiaNurse: 'Bc. Jana Malá',
      scrubNurse: 'Sabina Lenhartová',
      patientName: 'Katarína Kováčová',
      patientPhone: '+421 905 123 456',
      patientEmail: 'katarina.kovacova@gmail.com',
      title: 'Augmentácia prsníkov (Motiva 340cc)',
      date: todayStr,
      startTime: '08:30',
      endTime: '11:00',
      type: 'operacia',
      anesthesiaType: 'TIVA',
      clinicStay: 'hospitalizacia',
      specialEquipment: ['⚡ Liposukcia MicroAire (PAL)', '💨 Ohrev pacienta (Bair Hugger)', '🫁 Monitor vitálnych funkcií'],
      materials: ['🍈 Silikónové implantáty Motiva', '👙 Kompresívne prádlo Lipoelastic'],
      materialNotes: 'Motiva Ergonomix 340cc Demi profil, Lipoelastic PI ideal veľkosť M',
      totalPrice: 4200,
      depositAmount: 800,
      isDepositPaid: true,
      notes: 'Plánovaný subfasciálny dual-plane prístup cez podprsníkovú ryhu.'
    },
    {
      id: 'seed-evt-2',
      roomId: 'dospavacia_izba',
      roomName: 'Dospávacia miestnosť',
      assignedTo: 'Ema Foltáni',
      doctorName: 'MUDr. Peter Kováč',
      patientName: 'Katarína Kováčová',
      patientPhone: '+421 905 123 456',
      title: 'Pooperačná observácia & zotavenie',
      date: todayStr,
      startTime: '11:00',
      endTime: '13:00',
      type: 'kontrola',
      anesthesiaType: 'Dospávanie po celkovej anestézii',
      notes: 'Observácia vitálnych funkcií, chladenie hrudníka, infúzna analgézia.',
      totalPrice: 0,
      depositAmount: 0,
      isDepositPaid: true
    },
    {
      id: 'seed-evt-3',
      roomId: 'ambulancia',
      roomName: 'Ambulancia',
      assignedTo: 'Celý tím kliniky',
      doctorName: 'MUDr. Ján Mráz',
      patientName: 'Personál kliniky',
      title: 'Obedňajšia pauza & klinický brífing',
      date: todayStr,
      startTime: '12:30',
      endTime: '13:30',
      type: 'volno',
      freeformCategory: 'obed',
      notes: 'Spoločný obed lekárov a sestier, koordinácia popoludňajších výkonov.',
      totalPrice: 0,
      depositAmount: 0
    },
    {
      id: 'seed-evt-4',
      roomId: 'sala_rudlova',
      roomName: 'Operačné sály Rudlová',
      assignedTo: 'MUDr. Zuzana Sroková',
      doctorName: 'MUDr. Zuzana Sroková',
      operator: 'MUDr. Zuzana Sroková',
      anesthesiologist: 'Lokálna anestézia (bez anesteziológa)',
      anesthesiaNurse: 'Žiadna (lokálka)',
      scrubNurse: 'Ema Foltáni',
      patientName: 'Martina Bieliková',
      patientPhone: '+421 911 789 123',
      title: 'Blefaroplastika horných viečok',
      date: todayStr,
      startTime: '14:00',
      endTime: '15:30',
      type: 'operacia',
      anesthesiaType: 'LA',
      clinicStay: 'ambulantne',
      specialEquipment: ['⚡ Bipolárna elektrokoagulácia', '🔬 Operačné lupy / mikroskop'],
      materials: ['🧵 Vstrebateľné stehy PDS / Monocryl', '🧴 Tkanivové lepidlo Dermabond'],
      materialNotes: 'Steri-Strip náplasti, pooperačné chladiace kompresy',
      totalPrice: 950,
      depositAmount: 200,
      isDepositPaid: true
    },
    {
      id: 'seed-evt-5',
      roomId: 'ambulancia',
      roomName: 'Ambulancia',
      assignedTo: 'MUDr. Ján Mráz',
      doctorName: 'MUDr. Ján Mráz',
      patientName: 'Peter Nagy',
      patientPhone: '+421 903 445 566',
      title: 'Vstupné vyšetrenie & Konzultácia (Rhinoplastika)',
      date: todayStr,
      startTime: '16:00',
      endTime: '17:00',
      type: 'konzultacia',
      totalPrice: 60,
      depositAmount: 0,
      notes: 'Fotodokumentácia nosa, konzultácia očakávaní, vyhodnotenie deviácie septa.'
    },
    {
      id: 'seed-evt-6',
      roomId: 'sala_say',
      roomName: 'Operačné sály SAY',
      assignedTo: 'MUDr. Ján Mráz',
      doctorName: 'MUDr. Ján Mráz',
      operator: 'MUDr. Ján Mráz',
      anesthesiologist: 'MUDr. Peter Kováč',
      anesthesiaNurse: 'Bc. Jana Malá',
      scrubNurse: 'Sabina Lenhartová',
      patientName: 'Veronika Malá',
      patientPhone: '+421 908 654 321',
      title: 'VASER Lipo & Abdominoplastika',
      date: tomorrowStr,
      startTime: '09:00',
      endTime: '13:00',
      type: 'operacia',
      anesthesiaType: 'TIVA',
      clinicStay: 'hospitalizacia',
      specialEquipment: ['🔊 VASER Ultrasonic', '⚡ Liposukcia MicroAire (PAL)', '🩸 Redonova odsávačka'],
      materials: ['👙 Kompresívne prádlo Lipoelastic', '🧵 Vstrebateľné stehy PDS / Monocryl'],
      materialNotes: 'Lipoelastic kompresný pás + nohavice veľkosť L, 2x Redonov drén',
      totalPrice: 5200,
      depositAmount: 1000,
      isDepositPaid: true
    },
    {
      id: 'seed-evt-7',
      roomId: 'ambulancia',
      roomName: 'Ambulancia',
      assignedTo: 'Celý tím kliniky',
      doctorName: 'MUDr. Ján Mráz',
      patientName: 'Tím SAY CLINIC',
      title: 'Klinický seminár & Teambuilding',
      date: dayAfterStr,
      startTime: '00:00',
      endTime: '23:59',
      isAllDay: true,
      type: 'volno',
      freeformCategory: 'teambuilding',
      notes: 'Klinické školenie nových techník a teambuilding celého kolektívu.',
      totalPrice: 0,
      depositAmount: 0
    }
  ];
};
