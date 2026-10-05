export interface MemojiPreset {
  id: string;
  category: 'doctor' | 'nurse' | 'receptionist' | 'manager';
  categoryLabel: string;
  categoryIcon: string;
  name: string;
  roleDescription: string;
  url: string;
  badge?: string;
}

export const MEMOJI_CATEGORIES = [
  { key: 'all', label: 'Všetky avatary', icon: '✨', count: 30 },
  { key: 'doctor', label: 'Lekári & Chirurgovia', icon: '👨‍⚕️', count: 8 },
  { key: 'nurse', label: 'Zdravotné sestry', icon: '🩺', count: 11 },
  { key: 'receptionist', label: 'Recepcia & Klientsky servis', icon: '🛎️', count: 6 },
  { key: 'manager', label: 'Manažment & Vedenie', icon: '💼', count: 5 },
] as const;

export const MEMOJI_PRESETS: MemojiPreset[] = [
  // 1. LEKÁRI A CHIRURGOVIA
  {
    id: 'doc-mraz-ceo',
    category: 'doctor',
    categoryLabel: 'Lekári & Chirurgovia',
    categoryIcon: '👨‍⚕️',
    name: 'MUDr. Ján Mráz',
    roleDescription: 'Plastický chirurg & CEO',
    url: '/avatars/mraz.jpg?v=4',
    badge: 'CEO & Primár'
  },
  {
    id: 'doc-mraz-clean',
    category: 'doctor',
    categoryLabel: 'Lekári & Chirurgovia',
    categoryIcon: '👨‍⚕️',
    name: 'MUDr. Ján Mráz (Clean)',
    roleDescription: 'Štúdiový 3D Memoji',
    url: '/avatars/mraz_clean.jpg',
    badge: 'Štúdio'
  },
  {
    id: 'doc-female-surgeon',
    category: 'doctor',
    categoryLabel: 'Lekári & Chirurgovia',
    categoryIcon: '👩‍⚕️',
    name: 'Plastická chirurgička',
    roleDescription: 'Estetická & rekonštrukčná medicína',
    url: '/avatars/doctor_female_surgeon.jpg',
    badge: 'Chirurgička'
  },
  {
    id: 'doc-srokova-brunette',
    category: 'doctor',
    categoryLabel: 'Lekári & Chirurgovia',
    categoryIcon: '👩‍⚕️',
    name: 'MUDr. Zuzana Sroková',
    roleDescription: 'Lekárka / Chirurg (Bruneta)',
    url: '/avatars/srokova.jpg?v=2',
    badge: 'Lekárka'
  },
  {
    id: 'doc-srokova-blonde',
    category: 'doctor',
    categoryLabel: 'Lekári & Chirurgovia',
    categoryIcon: '👩‍⚕️',
    name: 'MUDr. Zuzana Sroková (Blond)',
    roleDescription: 'Lekárka / Chirurg',
    url: '/avatars/srokova_blonde.jpg',
    badge: 'Blond'
  },
  {
    id: 'doc-tran',
    category: 'doctor',
    categoryLabel: 'Lekári & Chirurgovia',
    categoryIcon: '👨‍⚕️',
    name: 'MUDr. Minh Tuong Tran',
    roleDescription: 'Lekár / Chirurg',
    url: '/avatars/tran.jpg?v=2',
    badge: 'Chirurg'
  },
  {
    id: 'doc-senior',
    category: 'doctor',
    categoryLabel: 'Lekári & Chirurgovia',
    categoryIcon: '👨‍⚕️',
    name: 'Primár / Špecialista',
    roleDescription: 'Konziliárny lekár s okuliarmi',
    url: '/avatars/doctor_senior.jpg',
    badge: 'Konziliár'
  },
  {
    id: 'doc-anest',
    category: 'doctor',
    categoryLabel: 'Lekári & Chirurgovia',
    categoryIcon: '👨‍⚕️',
    name: 'Anesteziológ (OAIM)',
    roleDescription: 'Špecialista anestéziológie',
    url: '/avatars/anesteziolog.jpg?v=3',
    badge: 'OAIM'
  },

  // 2. ZDRAVOTNÉ SESTRY
  {
    id: 'nurse-scrub-cap',
    category: 'nurse',
    categoryLabel: 'Zdravotné sestry',
    categoryIcon: '🩺',
    name: 'Operačná sestra (Čiapka)',
    roleDescription: 'Sála & fonendoskop',
    url: '/avatars/nurse_scrub_cap.jpg',
    badge: 'Sála'
  },
  {
    id: 'nurse-male',
    category: 'nurse',
    categoryLabel: 'Zdravotné sestry',
    categoryIcon: '🩺',
    name: 'Zdravotný brat (Navy)',
    roleDescription: 'Ambulantná starostlivosť',
    url: '/avatars/nurse_male.jpg',
    badge: 'Ambulancia'
  },
  {
    id: 'nurse-ema-scrubs',
    category: 'nurse',
    categoryLabel: 'Zdravotné sestry',
    categoryIcon: '🩺',
    name: 'Ema Foltáni',
    roleDescription: 'Zdravotná sestra (Zelené scrubs)',
    url: '/avatars/foltani.jpg?v=3',
    badge: 'Sestra'
  },
  {
    id: 'nurse-sabina',
    category: 'nurse',
    categoryLabel: 'Zdravotné sestry',
    categoryIcon: '🩺',
    name: 'Sabina Lenhartová',
    roleDescription: 'Klinická sestra',
    url: '/avatars/lenhartova.jpg?v=2',
    badge: 'Sestra'
  },
  {
    id: 'nurse-anest',
    category: 'nurse',
    categoryLabel: 'Zdravotné sestry',
    categoryIcon: '🩺',
    name: 'Anesteziologická sestra',
    roleDescription: 'Asistencia pri anestézii',
    url: '/avatars/anest_sestra.jpg?v=1',
    badge: 'OAIM Sestra'
  },
  {
    id: 'nurse-genmoji-ema',
    category: 'nurse',
    categoryLabel: 'Zdravotné sestry',
    categoryIcon: '🩺',
    name: 'Ema (3D Genmoji)',
    roleDescription: 'Štúdiová verzia',
    url: '/avatars/genmoji_ema.jpg',
    badge: 'Genmoji'
  },
  {
    id: 'nurse-classic',
    category: 'nurse',
    categoryLabel: 'Zdravotné sestry',
    categoryIcon: '🩺',
    name: 'Ambulantná sestra',
    roleDescription: 'Klinická starostlivosť',
    url: '/avatars/memoji_nurse_1788267100247.jpg',
    badge: 'Klinika'
  },
  {
    id: 'nurse-caucasian-blonde',
    category: 'nurse',
    categoryLabel: 'Zdravotné sestry',
    categoryIcon: '🩺',
    name: 'Sestra (Blond & Cop)',
    roleDescription: 'Ambulantná sestra v sage scruboch',
    url: '/avatars/nurse_caucasian_blonde.jpg',
    badge: 'Blond'
  },
  {
    id: 'nurse-caucasian-brunette',
    category: 'nurse',
    categoryLabel: 'Zdravotné sestry',
    categoryIcon: '🩺',
    name: 'Sestra (Okuliare & Teal)',
    roleDescription: 'Klinická sestra v teal scruboch',
    url: '/avatars/nurse_caucasian_brunette.jpg',
    badge: 'Okuliare'
  },
  {
    id: 'nurse-caucasian-black-hair',
    category: 'nurse',
    categoryLabel: 'Zdravotné sestry',
    categoryIcon: '🩺',
    name: 'Sestra (Čierne vlasy)',
    roleDescription: 'Klinická sestra – zelené scrubs, bez okuliarov',
    url: '/avatars/nurse_caucasian_black_hair.jpg',
    badge: 'Čierne vlasy'
  },
  {
    id: 'nurse-caucasian-black-bun',
    category: 'nurse',
    categoryLabel: 'Zdravotné sestry',
    categoryIcon: '🩺',
    name: 'Sestra (Čierny drdol)',
    roleDescription: 'Estetická sestra – drdol, navy scrubs, bez okuliarov',
    url: '/avatars/nurse_caucasian_black_bun.jpg',
    badge: 'Čierny drdol'
  },

  // 3. RECEPCIA & KLIENTSKY SERVIS
  {
    id: 'rec-headset',
    category: 'receptionist',
    categoryLabel: 'Recepcia & Klientsky servis',
    categoryIcon: '🎧',
    name: 'Recepčná s headsetom',
    roleDescription: 'Telefonický kontakt & objednávanie',
    url: '/avatars/reception_headset.jpg',
    badge: 'Headset'
  },
  {
    id: 'rec-brunette-glasses',
    category: 'receptionist',
    categoryLabel: 'Recepcia & Klientsky servis',
    categoryIcon: '🛎️',
    name: 'Klientska koordinátorka',
    roleDescription: 'Osobná recepcia s okuliarmi',
    url: '/avatars/reception_brunette.jpg',
    badge: 'Koordinátorka'
  },
  {
    id: 'rec-viktoria',
    category: 'receptionist',
    categoryLabel: 'Recepcia & Klientsky servis',
    categoryIcon: '🛎️',
    name: 'Viktória Foltániová',
    roleDescription: 'Recepčná & Koordinátorka',
    url: '/avatars/foltaniova.jpg?v=3',
    badge: 'Recepcia'
  },
  {
    id: 'rec-viktoria-gen',
    category: 'receptionist',
    categoryLabel: 'Recepcia & Klientsky servis',
    categoryIcon: '🛎️',
    name: 'Viktória (3D Genmoji)',
    roleDescription: 'Štúdiový portrét',
    url: '/avatars/genmoji_viktoria.jpg',
    badge: 'Genmoji'
  },
  {
    id: 'rec-solivajsova',
    category: 'receptionist',
    categoryLabel: 'Recepcia & Klientsky servis',
    categoryIcon: '🛎️',
    name: 'Mgr. Elena Solivajsová',
    roleDescription: 'Recepcia & Klientsky manažment',
    url: '/avatars/solivajsova.jpg?v=2',
    badge: 'Klientsky servis'
  },
  {
    id: 'rec-solivajsova-blonde',
    category: 'receptionist',
    categoryLabel: 'Recepcia & Klientsky servis',
    categoryIcon: '🛎️',
    name: 'Mgr. Elena Solivajsová (Blond)',
    roleDescription: 'Recepcia & Klientsky manažment',
    url: '/avatars/solivajsova_blonde.jpg',
    badge: 'Blond'
  },

  // 4. MANAŽMENT & VEDENIE KLINIKY
  {
    id: 'mgr-female-exec',
    category: 'manager',
    categoryLabel: 'Manažment & Vedenie',
    categoryIcon: '💼',
    name: 'Výkonná riaditeľka',
    roleDescription: 'Klinický manažment & riadenie',
    url: '/avatars/manager_female_exec.jpg',
    badge: 'Riaditeľka'
  },
  {
    id: 'mgr-male-exec',
    category: 'manager',
    categoryLabel: 'Manažment & Vedenie',
    categoryIcon: '💼',
    name: 'Prevádzkový riaditeľ',
    roleDescription: 'Operatíva & projekty',
    url: '/avatars/manager_male_exec.jpg',
    badge: 'Riaditeľ'
  },
  {
    id: 'mgr-mecerodova',
    category: 'manager',
    categoryLabel: 'Manažment & Vedenie',
    categoryIcon: '💼',
    name: 'Ing. Barbara Mecerodová, MBA',
    roleDescription: 'Klinický manažment & financie',
    url: '/avatars/mecerodova.jpg?v=2',
    badge: 'Manažment'
  },
  {
    id: 'mgr-mecerodova-blonde',
    category: 'manager',
    categoryLabel: 'Manažment & Vedenie',
    categoryIcon: '💼',
    name: 'Ing. Barbara Mecerodová (Blond)',
    roleDescription: 'Klinický manažment',
    url: '/avatars/mecerodova_blonde.jpg',
    badge: 'Blond'
  },
  {
    id: 'mgr-mraz-director',
    category: 'manager',
    categoryLabel: 'Manažment & Vedenie',
    categoryIcon: '👑',
    name: 'Vedenie SAY CLINIC',
    roleDescription: 'Executive Board',
    url: '/avatars/mraz_v4.jpg',
    badge: 'Executive'
  }
];
