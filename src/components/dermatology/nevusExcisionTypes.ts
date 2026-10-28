export type ExcisionMethod = 'chirurgicky' | 'laser' | 'kombinovane';

export interface ExcisionLesionItem {
  id: string;
  location: string;
  typeOrDiagnosis: string;
  method: 'chirurgicka_excizia' | 'laser_vaporizacia' | 'shave_excizia';
  methodLabel: string;
  histology: boolean;
  histologyCode?: string;
  sutureType: string;
  sutureRemovalDays: string;
  price: number;
}

export interface ExcisionCatalogPreset {
  id: string;
  name: string;
  category: 'chirurgia' | 'laser' | 'histologia' | 'podkozne';
  defaultMethod: 'chirurgicka_excizia' | 'laser_vaporizacia' | 'shave_excizia';
  defaultHistology: boolean;
  defaultSuture: string;
  defaultPrice: number;
  description: string;
}

export interface NevusExcisionData {
  primaryMethod: ExcisionMethod;
  indication: string;
  anesthesiaType: string;
  anesthesiaVolume: string;
  disinfection: string;
  procedureCourse: string;
  
  items: ExcisionLesionItem[];
  
  discountType: 'percent' | 'fixed';
  discountValue: number;
  paymentMethod: 'hotovost' | 'karta' | 'prevod' | 'poukaz';
  paymentStatus: 'uhradene' | 'pos_caka' | 'faktura';
  
  aftercareInstructions: string[];
  sutureRemovalNotes: string;
  histologyNotice: string;
  warningSigns: string;
  photoprotection: string;
  doctorNotes: string;
}

export const EXCISION_PRESETS: ExcisionCatalogPreset[] = [
  {
    id: 'chir_1',
    name: 'Chirurgická excízia – 1. lézia',
    category: 'chirurgia',
    defaultMethod: 'chirurgicka_excizia',
    defaultHistology: true,
    defaultSuture: 'Intradermálna pokračujúca sutúra (Prolene 5-0)',
    defaultPrice: 90,
    description: 'Skalpelová excízia, anestézia, plastická sutúra & histológia'
  },
  {
    id: 'chir_next',
    name: 'Chirurgická excízia – každá ďalšia',
    category: 'chirurgia',
    defaultMethod: 'chirurgicka_excizia',
    defaultHistology: true,
    defaultSuture: 'Intradermálna / uzličková sutúra',
    defaultPrice: 50,
    description: 'Zvýhodnená sadzba pre 2. a ďalšie znamienko v jednom sedení'
  },
  {
    id: 'chir_face',
    name: 'Chirurgická excízia – Tvár / Estetika',
    category: 'chirurgia',
    defaultMethod: 'chirurgicka_excizia',
    defaultHistology: true,
    defaultSuture: 'Mikro-intradermálny atraumatický steh (Ethilon/Monocryl 6-0)',
    defaultPrice: 120,
    description: 'Plasticko-chirurgická technika pre minimálnu jazvu na tvári'
  },
  {
    id: 'laser_1',
    name: 'CO2 Laser – 1. lézia',
    category: 'laser',
    defaultMethod: 'laser_vaporizacia',
    defaultHistology: false,
    defaultSuture: 'Bez sutúry – hojenie pod chrastou (Cicaplast Baume B5+)',
    defaultPrice: 50,
    description: 'Laserová vaporizácia bez rezu a šitia, okamžitá koagulácia'
  },
  {
    id: 'laser_next',
    name: 'CO2 Laser – každá ďalšia (2.–5.)',
    category: 'laser',
    defaultMethod: 'laser_vaporizacia',
    defaultHistology: false,
    defaultSuture: 'Bez sutúry – hojenie pod chrastou',
    defaultPrice: 25,
    description: 'Zvýhodnená cena za kus pri ošetrení viacerých prejavov'
  },
  {
    id: 'laser_multi',
    name: 'CO2 Laser – Balík (nad 5 prejavov)',
    category: 'laser',
    defaultMethod: 'laser_vaporizacia',
    defaultHistology: false,
    defaultSuture: 'Bez sutúry – laserová vaporizácia',
    defaultPrice: 150,
    description: 'Paušál pre mnohopočetné fibrómy, keratózy a bradavice'
  },
  {
    id: 'shave_excision',
    name: 'Shave excízia lézie',
    category: 'chirurgia',
    defaultMethod: 'shave_excizia',
    defaultHistology: true,
    defaultSuture: 'Bez sutúry – hemostáza a krytie',
    defaultPrice: 60,
    description: 'Tangenciálne zrezanie v úrovni kože so zachovaním vzorky'
  },
  {
    id: 'subcut_lesion',
    name: 'Podkožný útvar (Lipóm / Ateróm)',
    category: 'podkozne',
    defaultMethod: 'chirurgicka_excizia',
    defaultHistology: true,
    defaultSuture: 'Vrstvová sutúra podkožia + intradermálny steh',
    defaultPrice: 130,
    description: 'Kompletná exstirpácia tumoru s puzdrom, prevencia recidívy'
  },
  {
    id: 'histo_1',
    name: 'Histopatológia – 1. vzorka',
    category: 'histologia',
    defaultMethod: 'chirurgicka_excizia',
    defaultHistology: true,
    defaultSuture: '—',
    defaultPrice: 30,
    description: 'Bioptické vyšetrenie vzorky v akreditovanom laboratóriu'
  },
  {
    id: 'histo_next',
    name: 'Histopatológia – každá ďalšia',
    category: 'histologia',
    defaultMethod: 'chirurgicka_excizia',
    defaultHistology: true,
    defaultSuture: '—',
    defaultPrice: 25,
    description: 'Doplnkové histopatologické vyšetrenie ďalšej vzorky'
  }
];

export const COMMON_INDICATIONS = [
  'Preventívna onkodermatologická indikácia (suspektný melanocytový névus)',
  'Chronické mechanické dráždenie a traumatizácia odevom',
  'Estetická indikácia na žiadosť pacienta (benígny kožný prejav)',
  'Atypický névus s dermatoskopickou dynamikou / dysplázia',
  'Iritovaná seboroická veruka / keratóza',
  'Podkožný útvar (ateróm / lipóm) s progresiou veľkosti'
];

export const COMMON_LOCATIONS = [
  'Tvár – čelo',
  'Tvár – pravé líce',
  'Tvár – ľavé líce',
  'Tvár – nos',
  'Tvár – brada',
  'Tvár – okolie očí / viečka',
  'Krk – predná strana',
  'Krk – laterálne vpravo',
  'Krk – laterálne vľavo',
  'Chrbát – medzilopatková oblasť',
  'Chrbát – drieková oblasť',
  'Hrudník / Dekolt',
  'Brucho',
  'Rameno vpravo',
  'Rameno vľavo',
  'Predlaktie / Ruka',
  'Stehno / Predkolenie'
];

export const COMMON_DIAGNOSES = [
  'Melanocytový pigmentový névus (D22.5)',
  'Atypický (dysplastický) névus (D22)',
  'Seboroická veruka (L82)',
  'Mäkký fibróm / Akrochordón (D21)',
  'Hemangióm (D18.0)',
  'Epidermoidná cysta / Ateróm (L72.0)',
  'Lipóm podkožia (D17.0)',
  'Veruka vulgaris (B07)',
  'Aktinická keratóza (L57.0)',
  'Dermatofibróm / Histiocytóm (D21.9)'
];

export const INITIAL_NEVUS_EXCISION_DATA: NevusExcisionData = {
  primaryMethod: 'chirurgicky',
  indication: 'Preventívna onkodermatologická indikácia na základe dermatoskopie, chronické mechanické dráždenie',
  anesthesiaType: 'Lokálna infiltračná anestézia (Mesocain 1% + Adrenalín 1:200 000)',
  anesthesiaVolume: '3.0 ml',
  disinfection: 'Skinman Soft / Cutasept F',
  procedureCourse: 'V lokálnej infiltračnej anestézii po dôkladnej dezinfekcii a sterilnom zarúškovaní vykonaná eliptická excízia v Langerových líniách štiepiteľnosti kože. Elektrokoagulačná hemostáza spodiny. Rany uzatvorené intradermálnym pokračujúcim stehom / jednotlivými uzličkovými stehmi. Sterilné krytie.',
  items: [
    {
      id: 'lesion-1',
      location: 'Chrbát – interskapulárne vpravo',
      typeOrDiagnosis: 'Melanocytový pigmentový névus (D22.5)',
      method: 'chirurgicka_excizia',
      methodLabel: 'Chirurgická excízia so sutúrou',
      histology: true,
      histologyCode: 'Nádobka č. 1',
      sutureType: 'Intradermálna sutúra (Prolene 5-0)',
      sutureRemovalDays: '10 – 12 dní (trup)',
      price: 90
    },
    {
      id: 'lesion-2',
      location: 'Chrbát – drieková oblasť',
      typeOrDiagnosis: 'Melanocytový pigmentový névus (D22.5)',
      method: 'chirurgicka_excizia',
      methodLabel: 'Chirurgická excízia (ďalšia lézia)',
      histology: true,
      histologyCode: 'Nádobka č. 2',
      sutureType: 'Intradermálna sutúra (Prolene 5-0)',
      sutureRemovalDays: '10 – 12 dní (trup)',
      price: 50
    },
    {
      id: 'lesion-3',
      location: 'Histopatologické vyšetrenie (2 vzorky)',
      typeOrDiagnosis: 'Bioptické vyšetrenie – akreditované laboratórium',
      method: 'chirurgicka_excizia',
      methodLabel: 'Histopatológia',
      histology: true,
      histologyCode: '2 bioptické nádobky',
      sutureType: '—',
      sutureRemovalDays: '—',
      price: 55
    }
  ],
  discountType: 'percent',
  discountValue: 0,
  paymentMethod: 'karta',
  paymentStatus: 'uhradene',
  aftercareInstructions: [
    'Ponechať sterilné krytie v suchu po dobu 48 hodín.',
    'Po 48 hodinách osprchovať vlažnou vodou, jemne osušiť čistým uterákom/gázou a dezinfikovať (Betadine / Alfadine / Cutasept).',
    'Zákaz kúpania vo vani, bazéne, wellness a sauny do vybratia stehov a zhojenia rán.',
    'Pri laserovej vaporizácii: vzniknutú chrastu nestrhávať! Premasťovať hojivým balzamom (La Roche-Posay Cicaplast Baume B5+).',
    'Striktná ochrana pred slnečným žiarením (SPF 50+) minimálne 6 mesiacov na prevenciu tmavej pigmentácie jazvy.'
  ],
  sutureRemovalNotes: 'Vybratie stehov: o 10 – 12 dní v ambulancii SAY CLINIC (pri tvári o 5 – 7 dní).',
  histologyNotice: 'Bioptická vzorka odoslaná na histopatologické vyšetrenie. Výsledok bude doručený z laboratória do 10 – 14 pracovných dní. V prípade patologického nálezu bude pacient bezodkladne kontaktovaný.',
  warningSigns: 'V prípade náhleho krvácania, narastajúceho opuchu, pulzujúcej bolesti alebo horúčky ihneď kontaktujte SAY CLINIC.',
  photoprotection: 'Striktná ochrana pred UV žiarením (SPF 50+) každé ráno min. 6 mesiacov.',
  doctorNotes: 'Výkon prebehol bez komplikácií, pacient poučený, stav stabilizovaný.'
};
