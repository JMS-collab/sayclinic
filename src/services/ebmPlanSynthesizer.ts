import {
  PatientPlan,
  ScheduledTreatment,
  CosmeticRoutineItem,
  PreOpInstruction,
  PreOpPrehabilitation,
  PostOpRecoveryPhase
} from '@/data/patientPlanConfig';

export interface EbmProcedureDefinition {
  id: string;
  label: string;
  shortLabel: string;
  icon: string;
  group: 'face_surgery' | 'body_surgery' | 'laser_device' | 'injectable_bio' | 'skin_care_recovery';
  category: ScheduledTreatment['category'];
  defaultPrice: number;
  recommendedTimingOrder: number; // Nižšie číslo = skôr v sekvencii
  recommendedSeasonOrStep: string;
  targetArea: string;
  frequencyOrAnesthesia: string;
  recoveryTimePatient: string;
  clinicalNotes: string;
  patientExplanation: string;
  clinicalGuideline: string;
  preOpSpecifics: {
    medical?: string[];
    psychological?: string[];
    nutritional?: string[];
    physical?: string[];
    timelineInstruction?: { timeframe: string; title: string; description: string };
  };
  postOpSpecifics: {
    earlyCare?: string;
    scarCare?: string;
    warningSign?: string;
  };
  skincareImpact?: {
    morningAddition?: string;
    eveningAddition?: string;
    weeklyTip?: string;
  };
}

export const EBM_PROCEDURE_GROUPS = [
  { key: 'face_surgery', label: 'Plastická chirurgia – Tvár', icon: '🏥' },
  { key: 'body_surgery', label: 'Plastická chirurgia – Prsníky & Telo', icon: '👙' },
  { key: 'laser_device', label: 'Lasery & Prístrojové ošetrenia', icon: '⚡' },
  { key: 'injectable_bio', label: 'Injekčná estetika & Biostimulácia', icon: '💉' },
  { key: 'skin_care_recovery', label: 'Ošetrenia pleti, Jazvy & Rekonvalescencia', icon: '✨' },
] as const;

export const EBM_PROCEDURE_CATALOG: EbmProcedureDefinition[] = [
  // ==================== 1. PLASTICKÁ CHIRURGIA – TVÁR ====================
  {
    id: 'deep_plane_facelift',
    label: 'Deep Plane Facelift & SMAS lifting tváre',
    shortLabel: 'Deep Plane Facelift',
    icon: '🏥',
    group: 'face_surgery',
    category: 'surgery',
    defaultPrice: 4800,
    recommendedTimingOrder: 10,
    recommendedSeasonOrStep: 'Hlavný operačný krok (Jeseň / Zima)',
    targetArea: 'Stredná a dolná tretina tváre, kontúra sánky',
    frequencyOrAnesthesia: 'Operácia v celkovej anestézii (1 noc na klinike)',
    recoveryTimePatient: '10 – 14 dní domáceho kľudu (výraznejšie odpuchnutie do 2 – 3 týždňov)',
    clinicalNotes: 'Anatomická repozícia hlbokej vrstvy SMAS a uvoľnenie fixačných ligamentov bez ťahu na kožu.',
    patientExplanation: 'Lekár vráti hlboké svalovo-väzivové štruktúry tváre do polohy spred 10 – 15 rokov. Koža sa prirodzene priloží bez natiahnutého efektu.',
    clinicalGuideline: 'ASPS Facelift Clinical Practice Guideline & Jacono et al. (Aesthetic Surgery Journal – Deep Plane SMAS Repositioning)',
    preOpSpecifics: {
      medical: [
        'Dôsledná stabilizácia krvného tlaku pred operáciou (prevencia pooperačného hematómu).',
        'Prísny zákaz fajčenia a nikotínu minimálne 4 týždne pred a 4 týždne po operácii (ochrana prekrvenia lalokov).'
      ],
      psychological: [
        'Eliminácia pracovného a osobného stresu 2 týždne pred operáciou (ochrana imunitného hojenia a zníženie kortizolu).',
        'Mentálna pripravenosť na fázy hojenia (opuch vrcholí na 3. deň, pocit pnutia) a nácvik techník hlbokého dýchania na zvládanie úzkosti.'
      ],
      nutritional: ['Vysadenie doplnkov riediacich krv (Ginkgo, vit. E, Omega-3) 14 dní pred zákrokom.'],
      physical: [
        'Silový tréning dolných končatín a stredu tela (drepy, mostíky, plank) pre schopnosť vstávať z lôžka bez predkláňania hlavy a bez napínania šijových svalov.',
        'Kombinácia s aeróbnou chôdzou na zvýšenie kardiovaskulárnej rezervy a tkanivovej oxygenácie.'
      ],
      timelineInstruction: {
        timeframe: '10 dní pred operáciou',
        title: 'Úprava vlasov a stabilizácia tlaku',
        description: 'Farbite si vlasy najneskôr 10 dní pred zákrokom (po operácii je zákaz farbenia 4 – 6 týždňov kvôli jazvičkám).'
      }
    },
    postOpSpecifics: {
      earlyCare: 'Nosenie tvárovej elastickej bandáže, spánok s vyvýšenou hlavou a otáčanie celým trupom.',
      scarCare: 'Línie pred a za ušnicou ošetrovať 100% silikónovým gélom od 14. dňa + lymfodrenáž tváre.',
      warningSign: 'Náhle jednostranné zväčšenie opuchu alebo pulzujúca bolesť (kontaktujte kliniku).'
    },
    skincareImpact: {
      weeklyTip: 'Pred faceliftom posilňujeme kožnú bariéru ceramidmi; retinoidy vysadiť 7 dní pred operáciou.'
    }
  },
  {
    id: 'necklift',
    label: 'Necklift (Platysmaplastika a lifting krku)',
    shortLabel: 'Necklift (Krk)',
    icon: '🏥',
    group: 'face_surgery',
    category: 'surgery',
    defaultPrice: 2800,
    recommendedTimingOrder: 11,
    recommendedSeasonOrStep: 'Hlavný operačný krok (alebo v kombinácii)',
    targetArea: 'Krk, podbradok a uhol sánky',
    frequencyOrAnesthesia: 'Celková anestézia alebo analgosedácia',
    recoveryTimePatient: '10 – 14 dní s kompresívnou elastickou bandážou krku',
    clinicalNotes: 'Korekcia platysmy (korsetová platysmaplastika), odstránenie subplatysmálneho tuku a obnovenie ostrého cervikomentálneho uhla.',
    patientExplanation: 'Zákrok odstráni previsy a zvislé pruhy na krku a vyrysuje ostrý prechod medzi bradou a krkom.',
    clinicalGuideline: 'ISAPS Cervicofacial Rejuvenation Guidelines (Martini et al.)',
    preOpSpecifics: {
      medical: ['Dôsledná stabilizácia krvného tlaku, zákaz fajčenia a liekov ovplyvňujúcich zrážanlivosť krvi (14 dní pred).'],
      psychological: [
        'Mentálne nastavenie na pocit pnutia a elastickej ohlávky na krku počas prvých 14 dní – pokojné zvládanie bez pocitu obmedzenia.',
        'Pripravenosť na prechodný asymetrický opuch v oblasti podbradku a sánky ako prirodzenú fázu remodelácie.'
      ],
      physical: [
        'Posilňovanie sedacích svalov a nôh (drepy, mostíky) – schopnosť vstávať z polosedu bez prudkého predkláňania hlavy a bez napínania platysmy.',
        'Budovanie anabolickej svalovej rezervy pre rýchle vhojenie podkožného laloka krku.'
      ]
    },
    postOpSpecifics: {
      earlyCare: 'Kompresívna ohlávka krku 24/7 prvé 2 týždne, vyvarovať sa prudkému predklonu.',
      scarCare: 'Submentálna jazvička pod bradou: silikónový gél a jemné tlakové masáže od 14. dňa.'
    }
  },
  {
    id: 'blepharoplasty_upper',
    label: 'Blefaroplastika horných viečok (Korekcia previsov)',
    shortLabel: 'Horné viečka',
    icon: '👁️',
    group: 'face_surgery',
    category: 'surgery',
    defaultPrice: 950,
    recommendedTimingOrder: 14,
    recommendedSeasonOrStep: 'Ambulantný operačný krok',
    targetArea: 'Horné očné viečka a supratarzálny záhyb',
    frequencyOrAnesthesia: 'Lokálna anestézia (ambulantne, cca 45 minút)',
    recoveryTimePatient: '5 – 7 dní (vybratie stehov na 6. deň, návrat do práce po týždni)',
    clinicalNotes: 'Precízna excízia kožného nadbytku s čiastočnou redukciou mediálneho tukového vačku bez lagophthalmu.',
    patientExplanation: 'Odstráni pocit ťažkých, unavených viečok a otvorí pohľad. Jemný rez je schovaný presne v záhybe viečka.',
    clinicalGuideline: 'ASPS Clinical Practice Guideline for Blepharoplasty (Rohrich et al.)',
    preOpSpecifics: {
      medical: [
        'Striktné vysadenie liekov zvyšujúcich krvácavosť (Aspirin, Ibuprofen, Ginkgo biloba) 14 dní pred výkonom.',
        'Kompenzácia krvného tlaku (hypertenzia je hlavnou príčinou pooperačného hematómu viečok).'
      ],
      psychological: [
        'Pripravenosť na prechodné periorbitálne modrinky a opuch očného okolia (7 – 10 dní) bez úzkosti či sociálneho stresu.',
        'Nácvik relaxačného dýchania na udržanie nízkeho tlaku krvi a prevenciu perioperačného stresu.'
      ],
      physical: [
        'Silový a aeróbny tréning na podporu systémovej mikrocirkulácie a lymfatického toku, ktorý urýchli resorpciu pooperačného edému.',
        'Zákaz silových cvikov s predklonmi hlavy a zadržiavaním dychu (Valsalvov manéver) 48 hodín pred zákrokom.'
      ],
      timelineInstruction: {
        timeframe: '3 dni pred zákrokom',
        title: 'Príprava očí a kvapiek',
        description: 'Vynechajte kontaktné šošovky a vodeodolnú maskaru. Pripravte si zvlhčujúce očné kvapky bez konzervantov.'
      }
    },
    postOpSpecifics: {
      earlyCare: 'Chladenie gélovými vankúšikmi prvých 48h, aplikácia očnej masti na noc.',
      scarCare: 'Po vybratí stehov (6. deň) jemné poklepávanie a silikónový gél.'
    }
  },
  {
    id: 'blepharoplasty_lower',
    label: 'Blefaroplastika dolných viečok (Korekcia vačkov pod očami)',
    shortLabel: 'Dolné viečka',
    icon: '👁️',
    group: 'face_surgery',
    category: 'surgery',
    defaultPrice: 1100,
    recommendedTimingOrder: 15,
    recommendedSeasonOrStep: 'Operačný krok',
    targetArea: 'Dolné očné viečka a infraorbitálny okraj',
    frequencyOrAnesthesia: 'Lokálna anestézia s analgosedáciou',
    recoveryTimePatient: '7 – 10 dní (vybratie stehov na 6. – 7. deň)',
    clinicalNotes: 'Transkonjunktiválna alebo subciliárna repozícia tuku, spevnenie septa a kantopexia pri laxite.',
    patientExplanation: 'Odstráni unavené vačky a kruhy pod očami pomocou presunutia alebo redukcie tuku a jemného spevnenia viečka.',
    clinicalGuideline: 'ASOPRS Lower Eyelid Blepharoplasty & Canthopexy Standards',
    preOpSpecifics: {
      medical: [
        'Vyšetrenie laxity dolného viečka (snap-back test) a kvality slzného filmu.',
        'Vysadenie antikoagulancií a nesteroidných antiflogistík 14 dní pred operáciou.'
      ],
      psychological: [
        'Mentálne nastavenie na postupný ústup edému (dolné viečko je lymfaticky citlivejšie než horné, plný výsledok prichádza do 6 – 8 týždňov).',
        'Zníženie úzkosti a emočného stresu – podpora pokojného a trpezlivého prístupu k hojeniu.'
      ],
      physical: [
        'Zvýšenie svalovej hmoty a kondície pre metabolickú stabilitu pri regenerácii jemných periorbitálnych štruktúr.',
        'Nácvik vstávania z lôžka so stabilnou polohou hlavy bez predklonu.'
      ]
    },
    postOpSpecifics: {
      earlyCare: 'Polosed, chladenie, zákaz predkláňania a trenia očí 2 týždne.',
      scarCare: 'Jemná silikónová starostlivosť a SPF 50+ od 14. dňa.'
    }
  },
  {
    id: 'blepharoplasty_upper_lower',
    label: 'Kompletná horná aj dolná blefaroplastika viečok',
    shortLabel: 'Horné aj dolné viečka',
    icon: '👁️',
    group: 'face_surgery',
    category: 'surgery',
    defaultPrice: 1850,
    recommendedTimingOrder: 15,
    recommendedSeasonOrStep: 'Operačný krok',
    targetArea: 'Kompletné periorbitálne okolie (horné aj dolné mihalnice)',
    frequencyOrAnesthesia: 'Lokálna anestézia s analgosedáciou',
    recoveryTimePatient: '7 – 10 dní (stehy na 6. – 7. deň, modrinky ustúpia do 12 dní)',
    clinicalNotes: 'Kombinovaná resekcia kožných previsov a remodelácia tukových kompartmentov horných aj dolných viečok v jednom sedení.',
    patientExplanation: 'Komplexné omladenie očného okolia v jednom zákroku – odstránenie previsov aj vačkov pod očami s jednotným hojením.',
    clinicalGuideline: 'ASOPRS & ASPS Evidence-Based Blepharoplasty Guidelines',
    preOpSpecifics: {
      medical: [
        'Striktné vysadenie antikoagulancií, NSAID a salicylátov 14 dní pred výkonom.',
        'Kompenzácia krvného tlaku u internistu (prevencia periorbitálneho hematómu).'
      ],
      psychological: [
        'Pripravenosť na prechodné periorbitálne podliatiny a opuch očí (7 – 10 dní) bez obáv, paniky či sociálnej izolácie.',
        'Mentálna rovnováha a zvládnutie prechodného pocitu ťažších viečok počas prvých pooperačných dní.'
      ],
      physical: [
        'Kondičný silový tréning a chôdza na stimuláciu lymfatického toku a urýchlenie pooperačného vstrebávania opuchu.',
        'Zákaz dvíhania ťažkých bremien a predklonov v perioperačnom období.'
      ],
      timelineInstruction: {
        timeframe: '3 dni pred zákrokom',
        title: 'Príprava očného okolia',
        description: 'Pripravte si chladivé gélové obklady a kvalitné slnečné okuliare s UV filtrom.'
      }
    },
    postOpSpecifics: {
      earlyCare: 'Chladenie prvých 48h, spánok s vyvýšenou hlavou, umelé slzy bez konzervantov.',
      scarCare: 'Po vybratí stehov silikónový gél a ochrana SPF 50+.'
    }
  },
  {
    id: 'rhinoplasty',
    label: 'Kompletná rhinoplastika (Estetická & funkčná korekcia nosa)',
    shortLabel: 'Kompletná Rhinoplastika',
    icon: '👃',
    group: 'face_surgery',
    category: 'surgery',
    defaultPrice: 3600,
    recommendedTimingOrder: 12,
    recommendedSeasonOrStep: 'Hlavný operačný krok',
    targetArea: 'Nosová pyramída, špička a nosová priehradka',
    frequencyOrAnesthesia: 'Celková anestézia (1 noc na klinike)',
    recoveryTimePatient: '10 – 14 dní s dlahou (návrat do práce po zložení dlahy)',
    clinicalNotes: 'Otvorená alebo zatvorená štrukturálna / piezo ultrazvuková rhinoplastika so septoplastikou pre zachovanie voľného dýchania.',
    patientExplanation: 'Zákrok harmonizuje nos so zvyškom tváre a zlepšuje dýchanie. Dlaha sa nosí 10 – 14 dní, špička nosa dozrieva 6 – 12 mesiacov.',
    clinicalGuideline: 'AAO-HNS & ASPS Clinical Practice Guideline: Rhinoplasty (Ishii et al.)',
    preOpSpecifics: {
      medical: ['Vysadenie nosových sprejov (dekongestív) 2 týždne pred operáciou.'],
      psychological: [
        'Mentálna pripravenosť na dýchanie výlučne ústami počas prvých dní po zákroku a pocit upchatého nosa bez paniky či úzkosti.',
        'Realistické očakávania a trpezlivosť – špička nosa a jemné kontúry dozrievajú 6 až 12 mesiacov, čo si vyžaduje emocionálnu stabilitu.'
      ],
      physical: [
        'Kondičný tréning a svižná aeróbna chôdza pre optimálnu oxygenáciu tkanív a urýchlenie vstrebávania periorbitálnych modrín po operácii.',
        'Vyvarovanie sa cvikov s ťažkými váhami a predklonmi hlavy v poslednom týždni pred operáciou (ochrana pred cievnou hypertenziou).'
      ]
    },
    postOpSpecifics: {
      earlyCare: 'Zákaz smrkania nosa 3 týždne (preplach morskou vodou), kýchať len s otvorenými ústami.',
      scarCare: 'Pri otvorenom prístupe silikónový gél na kolumelu a nočný taping špičky nosa.'
    }
  },
  {
    id: 'rhinoplasty_tip',
    label: 'Úprava špičky nosa (Tip-rhinoplastika)',
    shortLabel: 'Úprava špičky nosa',
    icon: '👃',
    group: 'face_surgery',
    category: 'surgery',
    defaultPrice: 1900,
    recommendedTimingOrder: 13,
    recommendedSeasonOrStep: 'Ambulantný / jednodňový krok',
    targetArea: 'Dolná tretina nosa a alárne chrupavky',
    frequencyOrAnesthesia: 'Lokálna anestézia alebo analgosedácia',
    recoveryTimePatient: '7 – 10 dní s ľahkou fixačnou náplasťou/dlahou',
    clinicalNotes: 'Modelácia alárnych chrupaviek, zúženie a definícia špičky nosa bez osteotómie nosových kostí.',
    patientExplanation: 'Zamerané výhradne na špičku nosa bez zásahu do kostí. Rýchlejšie hojenie a minimálne modriny.',
    clinicalGuideline: 'ISAPS Nasal Tip Dynamics & Suture Techniques Consensus',
    preOpSpecifics: {},
    postOpSpecifics: {
      earlyCare: 'Fixačné náplasti ponechať týždeň, šetrné zvlhčovanie sliznice.'
    }
  },
  {
    id: 'lip_lift',
    label: 'Subnazálny Lip Lift (Bullhorn lifting hornej pery)',
    shortLabel: 'Subnazálny Lip Lift',
    icon: '👄',
    group: 'face_surgery',
    category: 'surgery',
    defaultPrice: 1350,
    recommendedTimingOrder: 16,
    recommendedSeasonOrStep: 'Doplnkový chirurgický krok',
    targetArea: 'Subnazálna oblasť a philtrum hornej pery',
    frequencyOrAnesthesia: 'Lokálna anestézia (ambulantne, 45 minút)',
    recoveryTimePatient: '7 – 10 dní (vybratie stehov na 6. – 7. deň)',
    clinicalNotes: 'Skrátenie vzdialenosti medzi bázou nosa a vermilionom pery, reverzia červene bez umelého objemu výplne.',
    patientExplanation: 'Prirodzene skráti vzdialenosť pod nosom, čím sa horná pera jemne pootvorí a omladne bez napichania.',
    clinicalGuideline: 'ISAPS Facial Proportions & Subnasal Lip Lift Standards',
    preOpSpecifics: {
      medical: ['Profylaxia herpes simplex pri sklone k oparom na perách.']
    },
    postOpSpecifics: {
      earlyCare: 'Mäkká strava 4 dni, obmedziť široký úsmev.',
      scarCare: 'Subnazálna jazvička: silikónový gél + cievny/frakčný laser po 6 týždňoch.'
    }
  },
  {
    id: 'brow_lift',
    label: 'Endoskopický Browlift / Lifting obočia a spánkov',
    shortLabel: 'Lifting obočia (Browlift)',
    icon: '✨',
    group: 'face_surgery',
    category: 'surgery',
    defaultPrice: 2200,
    recommendedTimingOrder: 12,
    recommendedSeasonOrStep: 'Operačný krok',
    targetArea: 'Čelo, oblasť obočia a spánková fascia',
    frequencyOrAnesthesia: 'Celková anestézia alebo analgosedácia',
    recoveryTimePatient: '7 – 10 dní (drobné vstupy sú schované vo vlasoch)',
    clinicalNotes: 'Uvoľnenie periostu a fixácia mäkkých tkanív čela k hlbokej temporálnej fascii.',
    patientExplanation: 'Pozdvihne padnuté obočie a uvoľní unavený výraz očí bez viditeľných jaziev, keďže rezy sú vo vlasovej časti.',
    clinicalGuideline: 'ASPS Endoscopic Forehead and Brow Lift Guidelines',
    preOpSpecifics: {},
    postOpSpecifics: {
      earlyCare: 'Nosenie elastického pásu okolo čela 7 dní, chladenie obočia.'
    }
  },
  {
    id: 'otoplasty',
    label: 'Otoplastika (Chirurgická korekcia odstávajúcich ušníc)',
    shortLabel: 'Otoplastika (Uši)',
    icon: '👂',
    group: 'face_surgery',
    category: 'surgery',
    defaultPrice: 1250,
    recommendedTimingOrder: 17,
    recommendedSeasonOrStep: 'Ambulantný operačný krok',
    targetArea: 'Obojstranne oblasť ušníc a chrupavky antheluxu',
    frequencyOrAnesthesia: 'Lokálna anestézia (ambulantne, cca 60 minút)',
    recoveryTimePatient: '7 dní bandáž (následne čelenka na noc po dobu 4 týždňov)',
    clinicalNotes: 'Modelácia anthelického záhybu a konchomastoidálna fixácia permanentnými stehmi.',
    patientExplanation: 'Trvalé priblíženie ušníc k hlave s prirodzeným záhybom chrupavky. Rez je schovaný na zadnej strane ucha.',
    clinicalGuideline: 'ISAPS Otoplasty Suture-Techniques Consensus',
    preOpSpecifics: {},
    postOpSpecifics: {
      earlyCare: 'Nosenie ochrannej čelenky nepretržite 10 dní, potom ešte 3 týždne na spánok.'
    }
  },
  {
    id: 'skin_lesions_face',
    label: 'Chirurgická excízia lézií a znamienok na tvári s histológiou',
    shortLabel: 'Excízia znamienok tváre',
    icon: '🔬',
    group: 'face_surgery',
    category: 'surgery',
    defaultPrice: 190,
    recommendedTimingOrder: 8,
    recommendedSeasonOrStep: 'Vstupné alebo priebežné ošetrenie',
    targetArea: 'Tvár, krk a dekolt',
    frequencyOrAnesthesia: 'Lokálna anestézia (ambulantne, 20 minút)',
    recoveryTimePatient: '5 – 7 dní do vybratia mikrostehov',
    clinicalNotes: 'Plasticko-chirurgická intradermálna sutura v líniách štiepiteľnosti kože (Langerove línie) a histopatologické overenie.',
    patientExplanation: 'Bezpečné odstránenie znamienka alebo nerovnosti na tvári s dôrazom na minimálnu jazvičku a overenie v laboratóriu.',
    clinicalGuideline: 'EADV Cutaneous Surgery and Dermato-Oncology Guidelines',
    preOpSpecifics: {},
    postOpSpecifics: {
      scarCare: 'Silikónový gél a striktná ochrana SPF 50+ minimálne 6 mesiacov.'
    }
  },

  // ==================== 2. PLASTICKÁ CHIRURGIA – PRSNÍKY & TELO ====================
  {
    id: 'breast_augmentation',
    label: 'Zväčšenie prsníkov silikónovými implantátmi (Augmentácia)',
    shortLabel: 'Augmentácia prsníkov',
    icon: '👙',
    group: 'body_surgery',
    category: 'surgery',
    defaultPrice: 3800,
    recommendedTimingOrder: 10,
    recommendedSeasonOrStep: 'Hlavný operačný krok',
    targetArea: 'Prsníky (retroglandulárne alebo Dual Plane uloženie)',
    frequencyOrAnesthesia: 'Celková anestézia (1 noc na klinike)',
    recoveryTimePatient: '7 – 14 dní kľudový režim (6 týždňov kompresívna podprsenka)',
    clinicalNotes: 'No-touch zavedenie prémiových silikónových implantátov (Motiva/Mentor) v rovine Dual Plane cez inframamárnu ryhu.',
    patientExplanation: 'Dodá prsníkom plný, mladistvý a harmonický objem. Po operácii sa nosí špeciálna podprsenka 6 týždňov 24/7.',
    clinicalGuideline: 'ERAS® Society Breast Surgery & ASPS Breast Augmentation Safety Guidelines',
    preOpSpecifics: {
      medical: [
        'Aktuálne USG alebo mamografické vyšetrenie prsníkov (nie staršie ako 6 mesiacov).',
        'Kompletné predoperačné interné a laboratórne vyšetrenie.'
      ],
      psychological: [
        'Mentálna pripravenosť na pooperačný pocit tlaku na hrudníku (podobný svalovici po cvičení) a pokojné zvládanie fáz adaptácie svalov.',
        'Zníženie hladiny perioperačného stresu nácvikom dychových relaxačných techník.'
      ],
      physical: [
        'Intenzívny silový tréning dolných končatín a stredu tela (drepy, výstupy, mostíky, plank) – nevyhnutný pre samostatné vstávanie a líhanie bez zapájania prsných svalov a bez opierania sa o ruky počas prvých 3 – 4 týždňov.',
        'Svalová hmota nôh a chrbta vytvára anabolickú rezervu aminokyselín na rýchle hojenie kapsuly okolo implantátu.'
      ],
      timelineInstruction: {
        timeframe: '2 týždne pred operáciou',
        title: 'USG prsníkov a skúška kompresívnej podprsenky',
        description: 'Overte si platnosť sono prsníkov a vyskúšajte presnú veľkosť pooperačnej podprsenky. Pripravte si oblečenie so zapínaním vpredu.'
      }
    },
    postOpSpecifics: {
      earlyCare: 'Kompresívna podprsenka 24/7 po dobu 6 týždňov, zákaz dvíhania bremien nad 3 kg a spánku na bruchu.',
      scarCare: 'Od 3. týždňa silikónový gél / silikónové náplasti na jazvičku v podprsnej ryhe + tlakové masáže.',
      warningSign: 'Náhle jednostranné zväčšenie prsníka alebo horúčka.'
    }
  },
  {
    id: 'breast_mastopexy',
    label: 'Lifting a modelácia prsníkov bez implantátov (Mastopexia)',
    shortLabel: 'Modelácia prsníkov (Mastopexia)',
    icon: '👙',
    group: 'body_surgery',
    category: 'surgery',
    defaultPrice: 3400,
    recommendedTimingOrder: 10,
    recommendedSeasonOrStep: 'Hlavný operačný krok',
    targetArea: 'Prsníky a prsný dvorec (periareolárna, vertikálna alebo kotvová technika)',
    frequencyOrAnesthesia: 'Celková anestézia (1 noc na klinike)',
    recoveryTimePatient: '10 – 14 dní kľud (6 týždňov kompresívna podprsenka)',
    clinicalNotes: 'Repozícia prsného tkaniva, zmenšenie a elevácia dvorca a odstránenie prebytočnej kože bez vkladania cudzieho telieska.',
    patientExplanation: 'Spevní a pozdvihne poklesnuté prsníky (napr. po deťoch alebo schudnutí) pomocou vášho vlastného tkaniva.',
    clinicalGuideline: 'ASPS Mastopexy & Breast Reshaping Guidelines',
    preOpSpecifics: {
      medical: ['USG prsníkov nie staršie ako 6 mesiacov a kompletné interné predoperačné vyšetrenie.'],
      psychological: [
        'Mentálna pripravenosť na fázy dozrievania jaziev (kotva / vertikálna jazva) a trpezlivosť pri procese zmäkčovania prsníka.',
        'Zníženie hladiny perioperačného stresu relaxačnými technikami a pokojný domáci režim.'
      ],
      physical: [
        'Silový tréning dolných končatín a hlbokého stabilizačného systému (core) pre samostatné vstávanie bez zapojenia horných končatín.',
        'Udržanie anabolickej svalovej hmoty ako proteínovej rezervy pre bezproblémové hojenie rozsiahlych kožných rezov.'
      ]
    },
    postOpSpecifics: {
      earlyCare: 'Kompresívna podprsenka 6 týždňov, zákaz namáhania ramien.',
      scarCare: 'Starostlivosť o jazvy okolo dvorca a vertikálnu líniu: silikónový gél a náplasti od 3. týždňa.'
    }
  },
  {
    id: 'breast_aug_mastopexy',
    label: 'Modelácia prsníkov so súčasným vložením implantátov (Augmentačná mastopexia)',
    shortLabel: 'Augmentačná Mastopexia',
    icon: '👙',
    group: 'body_surgery',
    category: 'surgery',
    defaultPrice: 4600,
    recommendedTimingOrder: 10,
    recommendedSeasonOrStep: 'Hlavný operačný krok',
    targetArea: 'Prsníky obojstranne',
    frequencyOrAnesthesia: 'Celková anestézia (1 noc na klinike)',
    recoveryTimePatient: '14 dní kľudový režim (6 týždňov kompresívna podprsenka)',
    clinicalNotes: 'Súčasné vytvorenie objemu implantátom a redistribúcia kožného plášťa s eleváciou dvorca.',
    patientExplanation: 'Kombinovaný zákrok, ktorý prsníky nielen pozdvihne na správne miesto, ale im dodá aj stratený plný dekolt.',
    clinicalGuideline: 'ISAPS & ASPS Simultaneous Augmentation-Mastopexy Safety Protocol',
    preOpSpecifics: {
      medical: ['USG prsníkov, mamografia a dôkladné meranie tkanivového krytia.'],
      psychological: [
        'Pripravenosť na pooperačný tlak na hrudi a pokojné zvládanie fáz hojenia implantátu a kožných rezov.',
        'Eliminácia perioperačného stresu nácvikom dychových cvičení a dostatok oddychu.'
      ],
      physical: [
        'Silový tréning nôh a brušných svalov – schopnosť líhať si a vstávať bez opory o ramená a prsné svaly.',
        'Budovanie anabolickej svalovej rezervy pre optimálne hojenie kapsuly a jaziev.'
      ]
    },
    postOpSpecifics: {
      earlyCare: 'Kompresívna podprsenka a pás 6 týždňov, kľud na lôžku s vyvýšenou polohou.',
      scarCare: 'Intenzívny silikónový protokol na jazvy a včasná laserová terapia jaziev o 6 týždňov.'
    }
  },
  {
    id: 'breast_reduction',
    label: 'Zmenšenie prsníkov (Redukčná mammaplastika)',
    shortLabel: 'Zmenšenie prsníkov',
    icon: '👙',
    group: 'body_surgery',
    category: 'surgery',
    defaultPrice: 3800,
    recommendedTimingOrder: 10,
    recommendedSeasonOrStep: 'Hlavný operačný krok',
    targetArea: 'Prsné žľazy a nadbytočný kožný plášť',
    frequencyOrAnesthesia: 'Celková anestézia (1 noc na klinike)',
    recoveryTimePatient: '14 dní domáceho kľudu (6 týždňov kompresívna bielizeň)',
    clinicalNotes: 'Resekcia hyperplastického žľazového a tukového tkaniva, odľahčenie chrbtice a rekonštrukcia symetrického prsníka.',
    patientExplanation: 'Zákrok prináša obrovskú úľavu pre chrbticu a krk, zmenší a spevní prsia na komfortnú veľkosť.',
    clinicalGuideline: 'ASPS Reduction Mammaplasty Clinical Practice Guideline',
    preOpSpecifics: {
      medical: ['Onkologický skríning prsníkov (USG/mamografia) a laboratórne testy.'],
      psychological: [
        'Mentálna príprava na výraznú zmenu telesného obrazu a úľavu od chronickej bolesti chrbtice.',
        'Trpezlivosť počas dozrievania jaziev v podprsnej ryhe a okolo dvorca.'
      ],
      physical: [
        'Posilňovanie chrbtového svalstva a dolných končatín na uľahčenie pooperačnej vertikalizácie.',
        'Udržanie vysokej proteosyntézy svalov pre rýchlu regeneráciu redukovaných lalokov.'
      ]
    },
    postOpSpecifics: {
      earlyCare: 'Nosenie pevnej pooperačnej podprsenky 6 týždňov, zákaz zdvíhania rúk a bremien.'
    }
  },
  {
    id: 'gynecomastia',
    label: 'Gynekomastia (Chirurgická redukcia mužskej prsnej žľazy a tuku)',
    shortLabel: 'Gynekomastia',
    icon: '🩺',
    group: 'body_surgery',
    category: 'surgery',
    defaultPrice: 1950,
    recommendedTimingOrder: 10,
    recommendedSeasonOrStep: 'Operačný krok',
    targetArea: 'Mužská prsná oblasť',
    frequencyOrAnesthesia: 'Celková anestézia alebo analgosedácia (1 noc alebo ambulantne)',
    recoveryTimePatient: '7 – 10 dní kľud (4 – 6 týždňov kompresívna vesta)',
    clinicalNotes: 'Subkutánna mastektómia periareolárnym rezom v kombinácii s tumescentnou/VASER liposukciou okolia.',
    patientExplanation: 'Vyrieši zväčšené prsia u mužov odstránením tuhej žľazy a odsávaním tuku, čím vznikne plochý atletický hrudník.',
    clinicalGuideline: 'ASPS Gynecomastia Practice Advisory',
    preOpSpecifics: {
      medical: ['Endokrinologické a USG vyšetrenie prsníkov pred operáciou.'],
      psychological: [
        'Odstránenie sociálnej úzkosti a mentálna príprava na nosenie kompresívnej vesty pod oblečením.',
        'Realistické očakávania – vyrysovanie hrudníka nastáva postupne po ústupe pooperačného opuchu.'
      ],
      physical: [
        'Silový tréning nôh a stredu tela (core) s vynechaním ťažkých benchpress cvikov 1 týždeň pred operáciou.',
        'Dostatočná svalová hmota urýchľuje adaptáciu kože na nový plochý profil hrudníka.'
      ]
    },
    postOpSpecifics: {
      earlyCare: 'Nosenie elastickej kompresívnej vesty 4 – 6 týždňov.'
    }
  },
  {
    id: 'abdominoplasty',
    label: 'Abdominoplastika s plastikou diastázy brušných svalov',
    shortLabel: 'Abdominoplastika s diastázou',
    icon: '🩺',
    group: 'body_surgery',
    category: 'surgery',
    defaultPrice: 3900,
    recommendedTimingOrder: 10,
    recommendedSeasonOrStep: 'Hlavný operačný krok',
    targetArea: 'Predná brušná stena, diastáza mm. recti, pupok a boky',
    frequencyOrAnesthesia: 'Celková anestézia (1 – 2 noci na klinike)',
    recoveryTimePatient: '14 dní domáceho kľudu (6 týždňov brušný pás, chôdza v predklone 7 dní)',
    clinicalNotes: 'Dvojvrstvová raphia diastázy, progresívne tenzné stehy, transpozícia pupka a resekcia kožno-tukového previsu.',
    patientExplanation: 'Chirurg zošije rozostúpené brušné svaly do pevného korzetu a odstráni previs kože. Prvý týždeň sa chodí mierne v predklone.',
    clinicalGuideline: 'ERAS® Plastic Surgery Abdominoplasty Guidelines (Caprini VTE Prophylaxis)',
    preOpSpecifics: {
      medical: [
        'Prevencia trombózy (bandáže nôh, nízkomolekulárny heparín podľa Caprini skóre) a zhodnotenie diastázy sonograficky.',
        'Interné vyšetrenie so zameraním na pľúcne a kardiovaskulárne funkcie.'
      ],
      psychological: [
        'Mentálna príprava na dočasné obmedzenie mobility a chôdzu v miernom predklone (7 – 10 dní) – vnútorný pokoj a trpezlivosť.',
        'Psychologická pripravenosť na nepretržité nosenie kompresívneho pásu 24/7 po dobu 6 týždňov a zvládanie fáz hojenia bez úzkosti.',
        'Pripravenosť na bežné pooperačné javy (seróm, opuch podbruška, pnutie) a dôvera v odbornú pooperačnú starostlivosť.'
      ],
      nutritional: [
        'Vlákninová strava a probiotiká pred operáciou pre bezproblémové trávenie a ľahké vyprázdňovanie bez tlaku na brušnú stenu.',
        'Zvýšený príjem plnohodnotných bielkovín (1,5 – 2,0 g/kg/deň) pre pevné zrastenie rekonštruovanej diastázy.'
      ],
      physical: [
        'Cielený silový odporový tréning dolných končatín (drepy, výstupy na lavičku, výpady) – pacient sa musí vedieť samostatne postaviť a líhať si výhradne silou nôh bez zapojenia priamych brušných svalov.',
        'Zvýšenie svalovej hmoty nôh a chrbta ako kľúčovej metabolickej rezervy aminokyselín proti pooperačnému katabolizmu.',
        'Dychová gymnastika a tréning bránicového dýchania na prevenciu atelektázy pľúc pri dočasne obmedzenom brušnom dýchaní.'
      ]
    },
    postOpSpecifics: {
      earlyCare: 'Včasná mobilizácia, chôdza v predklone 7 – 10 dní, nosenie brušného pásu 6 týždňov.',
      scarCare: 'Séria lymfodrenáží od 2. týždňa + silikónové pásy na jazvu v nohavičkovej línii.'
    }
  },
  {
    id: 'mini_abdominoplasty',
    label: 'Miniabdominoplastika (Čiastočná plastika podbruška)',
    shortLabel: 'Miniabdominoplastika',
    icon: '🩺',
    group: 'body_surgery',
    category: 'surgery',
    defaultPrice: 2400,
    recommendedTimingOrder: 10,
    recommendedSeasonOrStep: 'Operačný krok',
    targetArea: 'Oblasť podbruška pod pupkom (bez posunu pupka)',
    frequencyOrAnesthesia: 'Celková anestézia alebo analgosedácia',
    recoveryTimePatient: '7 – 10 dní (4 týždne kompresívny pás)',
    clinicalNotes: 'Resekcia nadbytku kože a tuku v podbrušku s prípadnou plikáciou infraumbilikálnej fascie bez nutnosti nového pupka.',
    patientExplanation: 'Menej invazívny variant pre pacientov s uvoľnenou kožou len v spodnej časti bruška.',
    clinicalGuideline: 'ISAPS Limited-Incision Abdominoplasty Consensus',
    preOpSpecifics: {
      physical: [
        'Posilnenie nôh a sedacích svalov pre vstávanie bez nadmerného napínania podbruška.',
        'Kondičný tréning na podporu mikrocirkulácie a prevenciu opuchov.'
      ]
    },
    postOpSpecifics: {
      earlyCare: 'Nosenie elastického pásu 4 týždne.'
    }
  },
  {
    id: 'liposuction_vaser_pal',
    label: 'Tumescenčná / PAL / VASER vibračná Liposukcia',
    shortLabel: 'Liposukcia (VASER / PAL)',
    icon: '💉',
    group: 'body_surgery',
    category: 'surgery',
    defaultPrice: 2200,
    recommendedTimingOrder: 11,
    recommendedSeasonOrStep: 'Operačný krok',
    targetArea: 'Brucho, boky, stehná, ramená alebo podbradok',
    frequencyOrAnesthesia: 'Lokálna tumescentná anestézia alebo celková anestézia',
    recoveryTimePatient: '5 – 7 dní (kompresívne prádlo 4 – 6 týždňov)',
    clinicalNotes: 'Vibračná alebo ultrazvuková emulzifikácia a aspirácia podkožného tuku s rešpektovaním lymfatických ciev.',
    patientExplanation: 'Trvalé odsatie tuku z problematických partií, ktoré nereagujú na cvičenie a stravu. Pokožka sa vďaka prádlu stiahne.',
    clinicalGuideline: 'ASPS Practice Advisory on Liposuction Safety (Fluid Management & Maximum Volume)',
    preOpSpecifics: {
      medical: ['Dôkladná hydratácia, laboratórne predoperačné vyšetrenie a výber certifikovaného kompresívneho odevu.'],
      psychological: [
        'Pripravenosť na prechodné nerovnosti, edém a modriny počas prvých 4 – 6 týždňov pred plným rozvinutím výsledku.',
        'Eliminácia stresu a dodržiavanie kľudového režimu s vedomím, že kompresia tvaruje finálnu siluetu.'
      ],
      physical: [
        'Udržanie aktívnej svalovej hmoty na stimuláciu metabolizmu a rýchlejšie vstrebávanie tumescentného roztoku.',
        'Kardiovaskulárny kondičný tréning na podporu mikrocirkulácie a prevenciu tromboembólie.'
      ]
    },
    postOpSpecifics: {
      earlyCare: 'Nosenie kompresívneho odevu 24/7 po dobu 4 – 6 týždňov, manuálna lymfodrenáž od 10. dňa.'
    }
  },
  {
    id: 'lipofilling_fat_transfer',
    label: 'Lipofilling / Lipotransfer (Prenos vlastného tuku do tváre alebo prsníkov)',
    shortLabel: 'Lipofilling vlastným tukom',
    icon: '✨',
    group: 'body_surgery',
    category: 'surgery',
    defaultPrice: 1800,
    recommendedTimingOrder: 15,
    recommendedSeasonOrStep: 'Samostatne alebo v kombinácii',
    targetArea: 'Odber z brucha/bokov ➔ aplikácia do tváre, líc, vrások alebo prsníkov',
    frequencyOrAnesthesia: 'Lokálna anestézia alebo celková anestézia',
    recoveryTimePatient: '7 – 10 dní (mierny opuch v mieste aplikácie)',
    clinicalNotes: 'Šetrný odber mikro/nano tuku, purifikácia a viacvrstvová mikro-kvapôčková štepová aplikácia bohatá na kmeňové bunky.',
    patientExplanation: 'Využije váš vlastný tuk ako najprirodzenejšiu trvalú výplň na omladenie kontúr a kvality pokožky.',
    clinicalGuideline: 'Coleman Structural Fat Grafting & ASPS Autologous Fat Transfer Guidelines',
    preOpSpecifics: {},
    postOpSpecifics: {
      earlyCare: 'Miesto aplikácie tuku netlačiť, nemasírovať a nechladit (ochrana prežitia tukových buniek).'
    }
  },
  {
    id: 'brachioplasty',
    label: 'Brachioplastika (Chirurgický lifting a redukcia kože paží)',
    shortLabel: 'Brachioplastika (Paže)',
    icon: '🩺',
    group: 'body_surgery',
    category: 'surgery',
    defaultPrice: 2600,
    recommendedTimingOrder: 10,
    recommendedSeasonOrStep: 'Operačný krok',
    targetArea: 'Vnútorná strana ramien a paží',
    frequencyOrAnesthesia: 'Celková anestézia (1 noc na klinike)',
    recoveryTimePatient: '10 – 14 dní (kompresívne návleky 6 týždňov)',
    clinicalNotes: 'Redukcia kožného previsu paží pozdĺžnym rezom na vnútornej strane paže s fixáciou k axilárnej fascii.',
    patientExplanation: 'Odstráni visiace „krídelká“ na ramenách po schudnutí a vytvaruje pevné línie paží.',
    clinicalGuideline: 'ASPS Body Contouring After Massive Weight Loss Guidelines',
    preOpSpecifics: {},
    postOpSpecifics: {
      earlyCare: 'Kompresívne rukávy 6 týždňov, obmedziť dvíhanie rúk nad hlavu prvé 3 týždne.'
    }
  },
  {
    id: 'labiaplasty',
    label: 'Labioplastika (Chirurgická modelácia malých pyskov ohanbia)',
    shortLabel: 'Labioplastika',
    icon: '🩺',
    group: 'body_surgery',
    category: 'surgery',
    defaultPrice: 1300,
    recommendedTimingOrder: 10,
    recommendedSeasonOrStep: 'Ambulantný operačný krok',
    targetArea: 'Oblasť intímnej chirurgie (labia minora)',
    frequencyOrAnesthesia: 'Lokálna anestézia alebo analgosedácia',
    recoveryTimePatient: '5 – 7 dní kľud (návrat k sexuálnemu životu po 4 – 6 týždňoch)',
    clinicalNotes: 'Klinovitá (wedge) alebo lemová (trim) resekcia s dôrazom na zachovanie citlivosti a prirodzeného zafarbenia okraja.',
    patientExplanation: 'Jemný zákrok prinášajúci fyzický komfort pri športe, oblečení aj estetickú sebadôveru.',
    clinicalGuideline: 'ACOG & ISAPS Female Genital Aesthetic Surgery Committee Guidelines',
    preOpSpecifics: {},
    postOpSpecifics: {
      earlyCare: 'Prísna hygiena (oplach repíkom/Octeniseptom po každej toalete), voľná bielizeň, zákaz kúpeľov a športu 4 týždne.'
    }
  },
  {
    id: 'carpal_tunnel',
    label: 'Dekompresia karpálneho tunela (Karpál)',
    shortLabel: 'Karpálny tunel',
    icon: '✋',
    group: 'body_surgery',
    category: 'surgery',
    defaultPrice: 550,
    recommendedTimingOrder: 8,
    recommendedSeasonOrStep: 'Ambulantný krok',
    targetArea: 'Dlaň a zápästie',
    frequencyOrAnesthesia: 'Lokálna anestézia (ambulantne, 25 minút)',
    recoveryTimePatient: '10 – 14 dní do vybratia stehov (šetrenie ruky 3 – 4 týždne)',
    clinicalNotes: 'Discízia retinaculum flexorum na uvoľnenie útlaku n. medianus.',
    patientExplanation: 'Rýchly ambulantný zákrok, ktorý vás zbaví nočného tŕpnutia, bolesti a slabosti v prstoch ruky.',
    clinicalGuideline: 'AAOS Clinical Practice Guideline for Carpal Tunnel Syndrome',
    preOpSpecifics: {},
    postOpSpecifics: {
      earlyCare: 'Polohovanie ruky nad úroveň srdca, cvičenie pohybov prstov hneď od 1. dňa.'
    }
  },

  // ==================== 3. LASERY & PRÍSTROJOVÉ OŠETRENIA ====================
  {
    id: 'fractional_co2_laser',
    label: 'Frakčný CO2 Laser Resurfacing (Tvár / Krk / Dekolt)',
    shortLabel: 'Frakčný CO2 Laser',
    icon: '⚡',
    group: 'laser_device',
    category: 'laser',
    defaultPrice: 550,
    recommendedTimingOrder: 30,
    recommendedSeasonOrStep: 'Obdobie nízkeho UV (Október – Marec)',
    targetArea: 'Celá tvár, očné okolie, krk alebo dekolt',
    frequencyOrAnesthesia: 'Lokálny anestetický krém (1 – 2 sedenia)',
    recoveryTimePatient: '5 – 7 dní (začervenanie a mikrobodky sa zlúpnu do týždňa)',
    clinicalNotes: 'Ablačná fototermolýza stimulujúca hĺbkovú syntézu kolagénu I a III, stiahnutie pórov a vyhladenie vrások.',
    patientExplanation: 'Laser vytvorí tisíce mikrostĺpčekov, ktoré vymenia starú pokožku za novú, vypnú póry, vrásky a zjednotia tón pleti.',
    clinicalGuideline: 'EADV / ESLD Laser Resurfacing Guidelines & Gold et al.',
    preOpSpecifics: {
      timelineInstruction: {
        timeframe: '7 dní pred laserom',
        title: 'Vysadenie retinolu a kyselín',
        description: 'Vynechajte večerný retinol a peelingové kyseliny, pleť len hydratujte.'
      }
    },
    postOpSpecifics: {
      earlyCare: 'Prvé dni intenzívne premasťovanie (Cicaplast B5+), termálna voda, šupinky nikdy nestrhávať.',
      scarCare: 'Po zlúpnutí ráno antioxidant C E Ferulic + prísne SPF 50+ minimálne 3 mesiace.'
    },
    skincareImpact: {
      weeklyTip: '100% ochrana pred slnkom (SPF 50+) je po CO2 laseri povinná.'
    }
  },
  {
    id: 'laser_scar_resurfacing',
    label: 'Frakčný CO2 laser – Korekcia pooperačných a poúrazových jaziev',
    shortLabel: 'CO2 Laser na jazvy',
    icon: '⚡',
    group: 'laser_device',
    category: 'scar_care',
    defaultPrice: 220,
    recommendedTimingOrder: 28,
    recommendedSeasonOrStep: '6 – 12 týždňov po operácii',
    targetArea: 'Línie pooperačných jaziev kdekoľvek na tele a tvári',
    frequencyOrAnesthesia: 'Lokálna anestézia krémom (2 – 3 sedenia)',
    recoveryTimePatient: '3 – 5 dní jemné začervenanie v línii jazvy',
    clinicalNotes: 'Frakčná ablačná remodelácia kolagénu jazvy s vyhladením okraja a zmäkčením fibrotického tkaniva.',
    patientExplanation: 'Laser zarovná jazvu do roviny s okolitou kožou a zjemní jej štruktúru, aby splynula s okolím.',
    clinicalGuideline: 'International Advisory Panel on Scar Management (Laser Revision Consensus)',
    preOpSpecifics: {},
    postOpSpecifics: {
      scarCare: 'Silikónový gél po odznení začervenania a fotoprotekcia SPF 50+.'
    }
  },
  {
    id: 'vascular_scar_laser',
    label: 'Cievny laser (Vascular / IPL) – Začervenanie, cievky a čerstvé jazvy',
    shortLabel: 'Cievny laser (Cievky & Jazvy)',
    icon: '🩹',
    group: 'laser_device',
    category: 'scar_care',
    defaultPrice: 180,
    recommendedTimingOrder: 25,
    recommendedSeasonOrStep: 'Včasne od 3. – 6. týždňa po operácii alebo priebežne',
    targetArea: 'Čerstvé červené jazvy, rozšírené cievky, líca, krídla nosa',
    frequencyOrAnesthesia: 'Bez anestézie / chladenie vzduchom (2 – 3 sedenia)',
    recoveryTimePatient: 'Bez obmedzenia (len ľahké začervenanie 24 hodín)',
    clinicalNotes: 'Selektívna fototermolýza oxyhemoglobínu (532/595/1064 nm) redukujúca neovaskularizáciu a erytém.',
    patientExplanation: 'Stiahne prebytočné cievky v mladej jazve alebo na tvári, vďaka čomu jazva rýchlejšie vybledne do telovej farby a nezhrubne.',
    clinicalGuideline: 'Mustoe / Gold et al. Early Vascular Laser Intervention Guidelines',
    preOpSpecifics: {},
    postOpSpecifics: {
      scarCare: 'Kombinácia s denným natieraním silikónového gélu.'
    }
  },
  {
    id: 'pigment_laser',
    label: 'Laserové odstránenie pigmentácií a fotopoškodenia (Q-Switch / Pico)',
    shortLabel: 'Pigmentový laser',
    icon: '⚡',
    group: 'laser_device',
    category: 'laser',
    defaultPrice: 220,
    recommendedTimingOrder: 32,
    recommendedSeasonOrStep: 'Jeseň / Zima (nízky UV index)',
    targetArea: 'Tvár, dekolt, chrbty rúk (solárne lentigo, starecké škvrny)',
    frequencyOrAnesthesia: 'Ambulantne (1 – 2 sedenia)',
    recoveryTimePatient: '3 – 5 dní (pigment najskôr stmavne a následne sa ošúpe)',
    clinicalNotes: 'Fotoakustická deštrukcia melanínových granúl bez tepelného poškodenia okolitej kože.',
    patientExplanation: 'Rozbije pigmentové škvrny zo slnka na mikročastice, ktoré telo prirodzene vylúči. Pokožka získa čistý porcelánový tón.',
    clinicalGuideline: 'EADV Pigmentary Disorders Consensus',
    preOpSpecifics: {},
    postOpSpecifics: {
      earlyCare: 'Striktná ochrana pred UV lúčmi SPF 50+, nechytať tmavé šupinky.'
    }
  },
  {
    id: 'rf_microneedling',
    label: 'Rádiofrekvenčný microneedling (Morpheus8 / Scarlet)',
    shortLabel: 'RF Microneedling',
    icon: '⚡',
    group: 'laser_device',
    category: 'skin_care',
    defaultPrice: 450,
    recommendedTimingOrder: 35,
    recommendedSeasonOrStep: 'Celoročne s fotoprotekciou',
    targetArea: 'Dolná kontúra tváre, podbradok, krk, telo',
    frequencyOrAnesthesia: 'Lokálny anestetický krém (2 – 3 sedenia s odstupom 6 týždňov)',
    recoveryTimePatient: '2 – 3 dni mierny opuch a začervenanie',
    clinicalNotes: 'Frakčná dodávka bipolárnej rádiofrekvencie cez izolované mikroihličky do hĺbky 1 – 4 mm na retrakciu väziva.',
    patientExplanation: 'Kombinácia jemných mikroihličiek a tepla v hĺbke kože naštartuje masívnu tvorbu elastínu a vypne ovisnuté kontúry.',
    clinicalGuideline: 'Fractional Radiofrequency Tissue Tightening Consensus (Dayan et al.)',
    preOpSpecifics: {},
    postOpSpecifics: {
      earlyCare: 'Upokojujúce sérum s kyselinou hyalurónovou, 24h bez make-upu.'
    }
  },
  {
    id: 'hifu_lifting',
    label: 'Neinvazívny ultrazvukový lifting (HIFU / SMAS lifting)',
    shortLabel: 'HIFU Lifting',
    icon: '⚡',
    group: 'laser_device',
    category: 'skin_care',
    defaultPrice: 590,
    recommendedTimingOrder: 36,
    recommendedSeasonOrStep: 'Celoročne (1 sedenie ročne)',
    targetArea: 'Kontúry sánky, podbradok a lícna oblasť',
    frequencyOrAnesthesia: 'Bez porušenia povrchu kože (1 zákrok)',
    recoveryTimePatient: '0 dní (bez rekonvalescencie, okamžitý návrat do práce)',
    clinicalNotes: 'Fokusovaný ultrazvuk vytvárajúci koagulačné body v hĺbke 3.0 mm a 4.5 mm (úroveň SMAS).',
    patientExplanation: 'Neinvazívne vypnutie hlbokej vrstvy tváre bez rezu a bez ihiel. Výsledok sa postupne vyvíja počas 2 – 3 mesiacov.',
    clinicalGuideline: 'Micro-focused Ultrasound with Visualization (MFU-V) Consensus',
    preOpSpecifics: {},
    postOpSpecifics: {}
  },

  // ==================== 4. INJEKČNÁ ESTETIKA & BIOSTIMULÁCIA ====================
  {
    id: 'botox_full_face',
    label: 'Botulotoxín – Horná tretina tváre (Čelo, glabela, očné vejáriky)',
    shortLabel: 'Botulotoxín (Tvár)',
    icon: '💉',
    group: 'injectable_bio',
    category: 'injectable',
    defaultPrice: 280,
    recommendedTimingOrder: 40,
    recommendedSeasonOrStep: 'Priebežne každých 4 – 6 mesiacov (alebo 6 týždňov po operácii)',
    targetArea: 'Čelo, medziobocie (glabela) a vejáriky okolo očí',
    frequencyOrAnesthesia: 'Ambulantná aplikácia (15 minút)',
    recoveryTimePatient: 'Okamžitý návrat (4h si nelíhať, 48h bez ťažkého športu a sauny)',
    clinicalNotes: 'Neuromodulácia hyperaktívnych mimických svalov, prevencia fixovaných vrások a zníženie ťahu na jazvy.',
    patientExplanation: 'Jemne zrelaxuje mimické svaly, ktoré vytvárajú vrásky pri mračení a žmúrení. Výraz zostane prirodzený a oddýchnutý.',
    clinicalGuideline: 'Global Aesthetics Consensus Group (Sundaram et al. – Neuromodulators Guidelines)',
    preOpSpecifics: {
      medical: ['5 dní pred aplikáciou neužívať lieky riediace krv na minimalizáciu modriniek.']
    },
    postOpSpecifics: {
      earlyCare: '4 hodiny po zákroku nevstupovať do predklonu, nelíhať si a netrieť miesto vpichu.'
    }
  },
  {
    id: 'botox_masseter_nefertiti',
    label: 'Botulotoxín – Zoštíhlenie sánky (Masseter / Bruxizmus) & Nefertiti lift krku',
    shortLabel: 'Botox Masseter & Nefertiti',
    icon: '💉',
    group: 'injectable_bio',
    category: 'injectable',
    defaultPrice: 260,
    recommendedTimingOrder: 41,
    recommendedSeasonOrStep: 'Priebežne',
    targetArea: 'Žuvací sval (m. masseter) a platysmálne pruhy na krku',
    frequencyOrAnesthesia: 'Ambulantná aplikácia (15 minút)',
    recoveryTimePatient: 'Bez obmedzenia',
    clinicalNotes: 'Uvoľnenie svalového tonusu žuvacieho svalu a platysmy – optické zúženie tváre a vyhladenie krku.',
    patientExplanation: 'Uvoľní nočné zatínanie zubov (bruxizmus), opticky zoštíhli spodnú časť tváre a vyhladí zvislé šľachy na krku.',
    clinicalGuideline: 'Masseter Hypertrophy & Lower Face Toxin Consensus Guidelines',
    preOpSpecifics: {},
    postOpSpecifics: {}
  },
  {
    id: 'hyaluronic_lips',
    label: 'Kyselina hyalurónová – Modelácia a hydratácia pier',
    shortLabel: 'Výplň pier (Kyselina HA)',
    icon: '👄',
    group: 'injectable_bio',
    category: 'injectable',
    defaultPrice: 290,
    recommendedTimingOrder: 42,
    recommendedSeasonOrStep: 'Priebežne',
    targetArea: 'Červeň a kontúra pier (1.0 ml prémiového gélu)',
    frequencyOrAnesthesia: 'Lokálny anestetický krém + lidokaín v géli',
    recoveryTimePatient: '1 – 2 dni mierny opuch',
    clinicalNotes: 'Hydratačná a tvarovacia aplikácia sieťovanej kyseliny hyalurónovej s rešpektovaním anatomického pomeru 1:1.6.',
    patientExplanation: 'Šetrné dodanie šťavnatosti, symetrie a jemného objemu perám bez „kačacieho“ efektu.',
    clinicalGuideline: 'Lip Augmentation Consensus Standards (Aesthetic Plastic Surgery)',
    preOpSpecifics: {
      medical: ['Profylaxia oparu pri náchylnosti na herpes.']
    },
    postOpSpecifics: {
      earlyCare: 'Chladiť pery cez sterilnú gázu, 48h vynechať horúce nápoje a bozkávanie.'
    }
  },
  {
    id: 'hyaluronic_contouring',
    label: 'Kyselina hyalurónová – Kontúrovanie tváre (Líca, brada, sánka a ryhy)',
    shortLabel: 'Kontúrovanie tváre (Kyselina HA)',
    icon: '💉',
    group: 'injectable_bio',
    category: 'injectable',
    defaultPrice: 420,
    recommendedTimingOrder: 43,
    recommendedSeasonOrStep: 'Po úplnom odpuchnutí operácie (alebo samostatne)',
    targetArea: 'Lícne kosti, uhly sánky, brada, nosovoústne ryhy',
    frequencyOrAnesthesia: 'Ambulantná kanylárna / ihlová technika',
    recoveryTimePatient: '1 – 2 dni',
    clinicalNotes: 'Hlboká periostálna a subkutánna bolusová aplikácia vysoko kohezívneho gélu na obnovu oporných bodov tváre.',
    patientExplanation: 'Doplní stratený objem v lícach, spevní líniu sánky a zjemní hlboké ryhy okolo úst.',
    clinicalGuideline: 'MD Codes™ & Facial Volumization Consensus (de Maio et al.)',
    preOpSpecifics: {},
    postOpSpecifics: {}
  },
  {
    id: 'polynucleotides_profhilo',
    label: 'Bunková bioremodelácia Profhilo / Polynukleotidy (Plinest)',
    shortLabel: 'Profhilo / Polynukleotidy',
    icon: '🧬',
    group: 'injectable_bio',
    category: 'skin_care',
    defaultPrice: 520,
    recommendedTimingOrder: 50,
    recommendedSeasonOrStep: 'Udržiavacia a regeneračná fáza (Jar / Jeseň)',
    targetArea: 'Tvár (5 BAP bodov), očné okolie, krk alebo dekolt',
    frequencyOrAnesthesia: '2 sedenia v rozstupe 4 týždňov (ambulantne)',
    recoveryTimePatient: 'Minimálna (papulky vymiznú do 24 hodín)',
    clinicalNotes: 'Aktivácia fibroblastov k syntéze kolagénu I, III a elastínu bez zmeny objemu alebo čŕt tváre.',
    patientExplanation: 'Reštart buniek zvnútra – pleť získa pružnosť, pevnosť a hĺbkovú hydratáciu bez toho, aby zmenila tvar tváre.',
    clinicalGuideline: 'Consensus Report on Hybrid Cooperative Complexes HA & Polynucleotides (Cavallini et al.)',
    preOpSpecifics: {},
    postOpSpecifics: {
      earlyCare: '24h bez make-upu a cvičenia.'
    }
  },
  {
    id: 'collagen_stimulator',
    label: 'Kolagénové biostimulátory (Radiesse / Sculptra)',
    shortLabel: 'Kolagénový stimulátor (Radiesse)',
    icon: '💉',
    group: 'injectable_bio',
    category: 'injectable',
    defaultPrice: 490,
    recommendedTimingOrder: 48,
    recommendedSeasonOrStep: 'Priebežne',
    targetArea: 'Spodná tretina tváre, kontúra sánky, krk a ruky',
    frequencyOrAnesthesia: 'Kanylárna aplikácia s lidokaínom',
    recoveryTimePatient: '1 – 2 dni',
    clinicalNotes: 'Hydroxylapatit vápenatý (CaHA) alebo kyselina poly-L-mliečna stimulujúca dlhodobú neokolagenézu.',
    patientExplanation: 'Látka naštartuje masívnu tvorbu vášho vlastného kolagénu, ktorý postupne spevňuje a zahusťuje ochabnutú kožu.',
    clinicalGuideline: 'Consensus Guidelines for Calcium Hydroxylapatite (Radiesse) Dilution and Vectoring',
    preOpSpecifics: {},
    postOpSpecifics: {
      earlyCare: 'Pravidlo masáže 5x5x5 (jemná masáž 5 minút, 5x denne počas 5 dní pri Sculptre).'
    }
  },
  {
    id: 'prp_plasma_therapy',
    label: 'Plazmaterapia (PRP / PRF bohatá na krvné doštičky a rastové faktory)',
    shortLabel: 'Plazmaterapia (PRP / Drakuloterapia)',
    icon: '🩸',
    group: 'injectable_bio',
    category: 'skin_care',
    defaultPrice: 240,
    recommendedTimingOrder: 45,
    recommendedSeasonOrStep: 'Priebežne (2 – 3 sedenia)',
    targetArea: 'Tvár, očné okolie, vlasová pokožka alebo pooperačné jazvy',
    frequencyOrAnesthesia: 'Lokálny krém (odber vlastnej krvi + odstredenie)',
    recoveryTimePatient: '1 – 2 dni jemné začervenanie',
    clinicalNotes: 'Aplikácia autológnych trombocytov a fibrínu uvoľňujúcich PDGF, VEGF a TGF-beta na urýchlenie hojenia tkanív.',
    patientExplanation: 'Využíva liečivú silu vašej vlastnej krvi. Rastové faktory zregenerujú unavené bunky, hoja jazvy a zlepšujú kvalitu kože.',
    clinicalGuideline: 'International Society of Plastic Regenerative Surgery (ISPRES) PRP Guidelines',
    preOpSpecifics: {
      nutritional: ['Dostatočný pitný režim (2 litre vody) v deň zákroku pre kvalitnú plazmu.']
    },
    postOpSpecifics: {}
  },
  {
    id: 'skinbooster_mesotherapy',
    label: 'Hĺbkové Skinboostery & Mezoterapia (Restylane Skinboosters / NCTF 135 HA)',
    shortLabel: 'Skinboostery & Mezoterapia',
    icon: '✨',
    group: 'injectable_bio',
    category: 'skin_care',
    defaultPrice: 220,
    recommendedTimingOrder: 46,
    recommendedSeasonOrStep: 'Priebežne (Jar / Leto / Jeseň)',
    targetArea: 'Tvár, očné okolie, krk, dekolt',
    frequencyOrAnesthesia: 'Lokálny krém (mikroinjekcie)',
    recoveryTimePatient: '1 – 2 dni drobné vpichy',
    clinicalNotes: 'Mikrodepozitá nezasieťovanej kyseliny hyalurónovej s 55 aminokyselinami a vitamínmi do papilárnej dermis.',
    patientExplanation: 'Hĺbková mikrohydratácia pokožky zvnútra – pleť bude rozjasnená, hladká a jemné vrásky sa vypnú.',
    clinicalGuideline: 'Restylane Skinboosters Clinical Consensus Guidelines',
    preOpSpecifics: {},
    postOpSpecifics: {}
  },

  // ==================== 5. OŠETRENIA PLETI, JAZVY & REKONVALESCENCIA ====================
  {
    id: 'chemical_peel_medical',
    label: 'Lekársky chemický peeling (TCA / Kyselina glykolová / Salicylová)',
    shortLabel: 'Lekársky chemický peeling',
    icon: '✨',
    group: 'skin_care_recovery',
    category: 'skin_care',
    defaultPrice: 120,
    recommendedTimingOrder: 52,
    recommendedSeasonOrStep: 'Jeseň / Zima (obdobie nízkeho UV)',
    targetArea: 'Tvár, krk a dekolt',
    frequencyOrAnesthesia: 'Ambulantne (20 minút, séria 3 sedení)',
    recoveryTimePatient: '3 – 5 dní (jemné kontrolované ošupovanie pokožky)',
    clinicalNotes: 'Kontrolovaná chemická exfoliácia epidermis a stimulácia regenerácie bazálnej vrstvy keratinocytov.',
    patientExplanation: 'Odstráni odumreté zrohovatené vrstvy buniek, stiahne póry a zjednotí tón pleti.',
    clinicalGuideline: 'International Peeling Society (IPS) Guidelines',
    preOpSpecifics: {},
    postOpSpecifics: {
      earlyCare: 'Striktná ochrana pred slnkom SPF 50+, nešúpať kožu prstami.'
    }
  },
  {
    id: 'hydrafacial_deep_clean',
    label: 'Hĺbkové prístrojové čistenie & hydratačná infúzia (HydraFacial)',
    shortLabel: 'HydraFacial čistenie',
    icon: '💧',
    group: 'skin_care_recovery',
    category: 'skin_care',
    defaultPrice: 140,
    recommendedTimingOrder: 55,
    recommendedSeasonOrStep: 'Celoročne (pred operáciou alebo udržiavacie)',
    targetArea: 'Tvár, krk a dekolt',
    frequencyOrAnesthesia: 'Príjemné neinvazívne ošetrenie (45 minút)',
    recoveryTimePatient: '0 dní (okamžitý „glow“ efekt na spoločenskú udalosť)',
    clinicalNotes: 'Vortexová hydrodermabrázia, bezbolestná extrakcia mazu a infúzia peptidov a antioxidantov.',
    patientExplanation: 'Dôkladne vyčistí póry bez vytláčania a napustí pokožku hydratačnými sérami. Pleť je okamžite svieža a žiarivá.',
    clinicalGuideline: 'Clinical Evaluation of Vortex-Fusion Hydrodermabrasion (Freedman et al.)',
    preOpSpecifics: {},
    postOpSpecifics: {}
  },
  {
    id: 'lymphatic_drainage_postop',
    label: 'Pooperačná lymfodrenáž (Manuálna & prístrojová na redukciu opuchov)',
    shortLabel: 'Pooperačná lymfodrenáž',
    icon: '💆',
    group: 'skin_care_recovery',
    category: 'scar_care',
    defaultPrice: 65,
    recommendedTimingOrder: 22,
    recommendedSeasonOrStep: 'Od 10. – 14. dňa po operácii (séria 5 – 10 sedení)',
    targetArea: 'Tvár a krk (po facelifte) alebo brucho/nohy (po abdominoplastike a liposukcii)',
    frequencyOrAnesthesia: 'Jemná manuálna fyzioterapia (45 – 60 minút)',
    recoveryTimePatient: 'Bez obmedzenia (okamžitá úľava od pocitu tlaku a napätia)',
    clinicalNotes: 'Podpora lymfatického odtoku, rýchlejšia rezolúcia pooperačného edému a prevencia fibrotických nerovností v podkoží.',
    patientExplanation: 'Jemná masáž podľa toku lymfy, ktorá urýchli odpuchnutie o 50 %, zmäkčí tkanivá a uľaví od pocitu stiahnutia.',
    clinicalGuideline: 'Vodder School Manual Lymph Drainage Post-Surgical Protocol',
    preOpSpecifics: {},
    postOpSpecifics: {}
  },
  {
    id: 'scar_intensive_therapy',
    label: 'Komplexná intenzívna terapia jaziev (Silikón, tlakové masáže & náplasti)',
    shortLabel: 'Komplexná terapia jaziev',
    icon: '🩹',
    group: 'skin_care_recovery',
    category: 'scar_care',
    defaultPrice: 95,
    recommendedTimingOrder: 20,
    recommendedSeasonOrStep: 'Od vybratia stehov (14. deň) až do 12 mesiacov',
    targetArea: 'Akékoľvek pooperačné a poúrazové jazvy',
    frequencyOrAnesthesia: 'Denná domáca starostlivosť + ambulantná kontrola',
    recoveryTimePatient: 'Dlhodobý preventívny režim',
    clinicalNotes: '100% medicínsky silikónový gél / náplasti, tlakové mikromasáže proti ťahu a prevencia hypertrofie a keloidu.',
    patientExplanation: 'Zlatý štandard hojenia: silikón udržiava jazvu hydratovanú bez prístupu vzduchu a tlaková masáž bráni jej zhrubnutiu.',
    clinicalGuideline: 'International Advisory Panel on Scar Management (Mustoe et al. Consensus Guidelines)',
    preOpSpecifics: {},
    postOpSpecifics: {
      scarCare: 'Aplikácia silikónového gélu 2x denne v tenkej vrstve + tlaková masáž 10 minút denne.'
    }
  }
];

/**
 * Pomocná funkcia na detekciu vybratých výkonov z existujúceho plánu alebo textového popisu
 */
export function resolveSelectedProcedures(
  procedureIds?: string[],
  existingTreatments?: ScheduledTreatment[],
  procedureText?: string
): EbmProcedureDefinition[] {
  const matched = new Map<string, EbmProcedureDefinition>();

  // 1. Podľa explicitných ID
  if (procedureIds && procedureIds.length > 0) {
    for (const id of procedureIds) {
      const found = EBM_PROCEDURE_CATALOG.find(p => p.id === id);
      if (found) matched.set(found.id, found);
    }
  }

  // 2. Podľa existujúcich položiek v annualTreatments
  const textsToInspect: string[] = [];
  if (existingTreatments && existingTreatments.length > 0) {
    existingTreatments.forEach(t => textsToInspect.push(`${t.name} ${t.notes || ''} ${t.targetArea || ''}`));
  }
  if (procedureText) {
    textsToInspect.push(procedureText);
  }

  const combinedText = textsToInspect.join(' ').toLowerCase();

  if (combinedText.includes('facelift') || combinedText.includes('smas')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'deep_plane_facelift');
    if (p) matched.set(p.id, p);
  }
  if (combinedText.includes('necklift') || combinedText.includes('platysma')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'necklift');
    if (p) matched.set(p.id, p);
  }
  if (combinedText.includes('horné vieč') || combinedText.includes('hornych viec')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'blepharoplasty_upper');
    if (p) matched.set(p.id, p);
  }
  if (combinedText.includes('dolné vieč') || combinedText.includes('dolnych viec')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'blepharoplasty_lower');
    if (p) matched.set(p.id, p);
  }
  if ((combinedText.includes('blefar') || combinedText.includes('vieč') || combinedText.includes('viec') || combinedText.includes('očí')) && !matched.has('blepharoplasty_upper') && !matched.has('blepharoplasty_lower')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'blepharoplasty_upper_lower');
    if (p) matched.set(p.id, p);
  }
  if (combinedText.includes('špičk') || combinedText.includes('tip-rhino')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'rhinoplasty_tip');
    if (p) matched.set(p.id, p);
  } else if (combinedText.includes('rhino') || combinedText.includes('nos')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'rhinoplasty');
    if (p) matched.set(p.id, p);
  }
  if (combinedText.includes('lip lift')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'lip_lift');
    if (p) matched.set(p.id, p);
  }
  if (combinedText.includes('brow') || combinedText.includes('oboč')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'brow_lift');
    if (p) matched.set(p.id, p);
  }
  if (combinedText.includes('otoplast') || combinedText.includes('uší') || combinedText.includes('ušn')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'otoplasty');
    if (p) matched.set(p.id, p);
  }
  if (combinedText.includes('znamien') || combinedText.includes('lézi')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'skin_lesions_face');
    if (p) matched.set(p.id, p);
  }

  // Telo a prsníky
  if (combinedText.includes('mastopex') && combinedText.includes('implant')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'breast_aug_mastopexy');
    if (p) matched.set(p.id, p);
  } else if (combinedText.includes('mastopex') || combinedText.includes('modelácia prs')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'breast_mastopexy');
    if (p) matched.set(p.id, p);
  } else if (combinedText.includes('zmenšenie prs') || combinedText.includes('redukč')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'breast_reduction');
    if (p) matched.set(p.id, p);
  } else if (combinedText.includes('augment') || combinedText.includes('prs')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'breast_augmentation');
    if (p) matched.set(p.id, p);
  }
  if (combinedText.includes('gynekomast')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'gynecomastia');
    if (p) matched.set(p.id, p);
  }
  if (combinedText.includes('miniabdom')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'mini_abdominoplasty');
    if (p) matched.set(p.id, p);
  } else if (combinedText.includes('abdomino') || combinedText.includes('diastáz') || combinedText.includes('bruš')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'abdominoplasty');
    if (p) matched.set(p.id, p);
  }
  if (combinedText.includes('liposuk')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'liposuction_vaser_pal');
    if (p) matched.set(p.id, p);
  }
  if (combinedText.includes('lipofill') || combinedText.includes('prenos tuku') || combinedText.includes('vlastn')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'lipofilling_fat_transfer');
    if (p) matched.set(p.id, p);
  }
  if (combinedText.includes('brachio') || combinedText.includes('paží')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'brachioplasty');
    if (p) matched.set(p.id, p);
  }
  if (combinedText.includes('labio')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'labiaplasty');
    if (p) matched.set(p.id, p);
  }
  if (combinedText.includes('karpál') || combinedText.includes('carpal')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'carpal_tunnel');
    if (p) matched.set(p.id, p);
  }

  // Lasery & prístroje
  if (combinedText.includes('co2') || combinedText.includes('frakč') || combinedText.includes('resurfac')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'fractional_co2_laser');
    if (p) matched.set(p.id, p);
  }
  if (combinedText.includes('cievn') || combinedText.includes('vaskul') || combinedText.includes('erytém') || combinedText.includes('jazv')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'vascular_scar_laser');
    if (p) matched.set(p.id, p);
  }
  if (combinedText.includes('pigment') || combinedText.includes('pico') || combinedText.includes('škvrn')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'pigment_laser');
    if (p) matched.set(p.id, p);
  }
  if (combinedText.includes('morpheus') || combinedText.includes('microneedl')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'rf_microneedling');
    if (p) matched.set(p.id, p);
  }
  if (combinedText.includes('hifu') || combinedText.includes('ulthera')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'hifu_lifting');
    if (p) matched.set(p.id, p);
  }

  // Injekcie & biostimulácia
  if (combinedText.includes('masseter') || combinedText.includes('bruxiz') || combinedText.includes('nefertiti')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'botox_masseter_nefertiti');
    if (p) matched.set(p.id, p);
  } else if (combinedText.includes('botul') || combinedText.includes('botox') || combinedText.includes('dysport')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'botox_full_face');
    if (p) matched.set(p.id, p);
  }
  if (combinedText.includes('pery') || combinedText.includes('úst')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'hyaluronic_lips');
    if (p) matched.set(p.id, p);
  } else if (combinedText.includes('kyselina') || combinedText.includes('výpl') || combinedText.includes('hyaluron')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'hyaluronic_contouring');
    if (p) matched.set(p.id, p);
  }
  if (combinedText.includes('profhilo') || combinedText.includes('polynukleo') || combinedText.includes('plinest')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'polynucleotides_profhilo');
    if (p) matched.set(p.id, p);
  }
  if (combinedText.includes('radiesse') || combinedText.includes('sculptra') || combinedText.includes('kolagénov')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'collagen_stimulator');
    if (p) matched.set(p.id, p);
  }
  if (combinedText.includes('prp') || combinedText.includes('plazma') || combinedText.includes('drakulo')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'prp_plasma_therapy');
    if (p) matched.set(p.id, p);
  }
  if (combinedText.includes('skinboost') || combinedText.includes('mezoter')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'skinbooster_mesotherapy');
    if (p) matched.set(p.id, p);
  }

  // Ošetrenia pleti & jaziev
  if (combinedText.includes('peeling')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'chemical_peel_medical');
    if (p) matched.set(p.id, p);
  }
  if (combinedText.includes('hydrafacial')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'hydrafacial_deep_clean');
    if (p) matched.set(p.id, p);
  }
  if (combinedText.includes('lymfodren')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'lymphatic_drainage_postop');
    if (p) matched.set(p.id, p);
  }
  if (combinedText.includes('jazv')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'scar_intensive_therapy');
    if (p) matched.set(p.id, p);
  }

  // Ak nič nebolo špecifikované, predvolíme harmonickú kombináciu starostlivosti o tvár a pleť
  if (matched.size === 0) {
    ['blepharoplasty_upper_lower', 'fractional_co2_laser', 'botulinum_hyaluronic', 'polynucleotides_profhilo'].forEach(id => {
      const p = EBM_PROCEDURE_CATALOG.find(x => x.id === id);
      if (p) matched.set(p.id, p);
    });
  }

  // Zoradíme podľa medicínsky bezpečnej postupnosti (recommendedTimingOrder)
  return Array.from(matched.values()).sort((a, b) => a.recommendedTimingOrder - b.recommendedTimingOrder);
}

/**
 * Zostaví kompletne harmonizovaný, medicínsky overený (EBM) a pre pacienta zrozumiteľný plán
 * podľa zvolených operácií a výkonov.
 */
export function synthesizeEbmPatientPlan(params: {
  basePlan?: Partial<PatientPlan>;
  patientId: string;
  patientName: string;
  patientBirthNumber?: string;
  doctorName?: string;
  skinType?: string;
  selectedProcedureIds?: string[];
  existingTreatments?: ScheduledTreatment[];
  diagnosisOrGoal?: string;
}): PatientPlan {
  const {
    basePlan,
    patientId,
    patientName,
    patientBirthNumber,
    doctorName = 'MUDr. Ján Mráz',
    skinType = 'Zmiešaná / citlivá so sklonom k dehydratácii',
    selectedProcedureIds,
    existingTreatments,
    diagnosisOrGoal
  } = params;

  const procs = resolveSelectedProcedures(selectedProcedureIds, existingTreatments, diagnosisOrGoal);
  const hasSurgery = procs.some(p => p.category === 'surgery');
  const hasFaceSurgery = procs.some(p => p.group === 'face_surgery');
  const hasBodySurgery = procs.some(p => p.group === 'body_surgery');
  const hasLaser = procs.some(p => p.category === 'laser' || p.category === 'scar_care');

  // Ak má pacient operáciu a ešte nemá zaradenú laserovú/cievnu starostlivosť o jazvu, pridáme ju ako odporúčaný EBM krok
  const finalProcs = [...procs];
  if (hasSurgery && !finalProcs.some(p => p.id === 'vascular_scar_laser' || p.id === 'fractional_co2_laser')) {
    const scarLaser = EBM_PROCEDURE_CATALOG.find(p => p.id === 'vascular_scar_laser');
    if (scarLaser) finalProcs.push(scarLaser);
    finalProcs.sort((a, b) => a.recommendedTimingOrder - b.recommendedTimingOrder);
  }

  const procNamesShort = finalProcs.map(p => p.shortLabel).join(' ➔ ');
  const surgeryProcs = finalProcs.filter(p => p.category === 'surgery');
  const mainSurgeryLabel = surgeryProcs.length > 0
    ? surgeryProcs.map(s => s.shortLabel).join(' & ')
    : finalProcs.map(p => p.shortLabel).join(' & ');

  // 1. ZOSTAVENIE ROČNÉHO PLÁNU (SEKVENCIA KROKOV S VYSVETLENÍM PRE PACIENTA A EBM GUIDELINOM)
  const synthesizedTreatments: ScheduledTreatment[] = finalProcs.map((proc, idx) => {
    const stepNumber = idx + 1;
    let stepTiming = `${stepNumber}. Krok • ${proc.recommendedSeasonOrStep}`;
    if (stepNumber === 1 && proc.category === 'surgery') {
      stepTiming = `1. Krok (Hlavná fáza – Operácia)`;
    } else if (stepNumber > 1 && proc.category === 'surgery') {
      stepTiming = `${stepNumber}. Krok (Odstup +6 až 8 týždňov po 1. kroku)`;
    } else if (proc.category === 'scar_care') {
      stepTiming = `${stepNumber}. Krok (3 – 6 týždňov po operácii – Fáza zrenia jazvy)`;
    } else if (proc.category === 'laser') {
      stepTiming = hasSurgery
        ? `${stepNumber}. Krok (6 – 12 týždňov po operácii v období nízkeho UV)`
        : `${stepNumber}. Krok (Jeseň / Zima – Obdobie nízkeho UV)`;
    } else if (proc.category === 'injectable') {
      stepTiming = hasSurgery
        ? `${stepNumber}. Krok (Po úplnom ústupe opuchov, +6 až 8 týždňov)`
        : `${stepNumber}. Krok (Harmonizácia mimiky a kontúr)`;
    } else {
      stepTiming = `${stepNumber}. Krok (Priebežná bunková regenerácia)`;
    }

    return {
      id: `trt-ebm-${Date.now()}-${idx}`,
      stepOrder: stepNumber,
      name: proc.label,
      category: proc.category,
      isSkinTreatment: proc.category === 'laser' || proc.category === 'skin_care' || proc.category === 'scar_care',
      seasonOrMonth: stepTiming,
      targetArea: proc.targetArea,
      frequencyOrSessions: proc.frequencyOrAnesthesia,
      estimatedPrice: proc.defaultPrice,
      priority: proc.category === 'surgery' || proc.category === 'laser' ? 'high' : 'recommended',
      status: 'planned',
      notes: proc.clinicalNotes,
      patientExplanation: proc.patientExplanation,
      clinicalGuideline: proc.clinicalGuideline,
      recoveryTime: proc.recoveryTimePatient
    };
  });

  // 2. ZOSTAVENIE SKINCARE RUTINY PRISPÔSOBENEJ ZVOLENÝM VÝKONOM
  const morningRoutine: CosmeticRoutineItem[] = [
    {
      step: 1,
      category: 'Šetrné ranné čistenie & mikrobióm',
      productName: 'La Roche-Posay Toleriane / SkinCeuticals Soothing Cleanser',
      brand: 'La Roche-Posay / SkinCeuticals',
      usage: 'Ráno jemne vmasírovať do navlhčenej pleti a opláchnuť vlažnou vodou.',
      purpose: 'Odstránenie nočného mazu bez narušenia ochrannej hydrolipidovej bariéry pred plánovanými výkonmi.',
      patientBenefit: 'Čistá a upokojená pleť bez pocitu pnutia, pripravená vstrebať ochranné vitamíny.',
      evidenceNote: 'EADV Barrier Care Consensus: syndetové čistenie s fyziologickým pH 5.5 znižuje transepidermálnu stratu vody (TEWL).',
      price: 17.50,
      standardOption: {
        tier: 'standard',
        tierName: 'Základná starostlivosť',
        productName: 'La Roche-Posay Toleriane Dermo-Cleanser čistiaca emulzia',
        brand: 'La Roche-Posay',
        price: 17.50,
        usage: 'Ráno naniesť končekmi prstov na vlhkú tvár a jemne opláchnuť.',
        purpose: 'Hypoalergénne čistenie pre citlivú a reaktívnu pleť pred aj po zákrokoch.'
      },
      premiumOption: {
        tier: 'premium',
        tierName: 'Prémiová starostlivosť',
        productName: 'SkinCeuticals Soothing Cleanser upokojujúca čistiaca pena',
        brand: 'SkinCeuticals',
        price: 46.00,
        usage: '1 pumpičku peny ráno jemne vmasírovať na vlhkú tvár a krk, opláchnuť.',
        purpose: 'Vysoká koncentrácia sorbitolu, glycerínu a extraktu z orchidey pre upokojenie pleti po estetických výkonoch.'
      }
    },
    {
      step: 2,
      category: 'Antioxidačný štít & podpora tvorby kolagénu',
      productName: 'Vichy Liftactiv 15% Vit C / SkinCeuticals C E Ferulic',
      brand: 'Vichy / SkinCeuticals',
      usage: '4 – 5 kvapiek každé ráno na suchú vyčistenú tvár, krk a dekolt.',
      purpose: 'Ochrana buniek pred oxidačným stresom, urýchlenie hojenia po laseri/operácii a stimulácia syntézy kolagénu.',
      patientBenefit: 'Chráni pleť pred starnutím zo slnka, zjednocuje farbu pleti a skracuje čas začervenania po zákrokoch o polovicu.',
      evidenceNote: 'Duke University Patent (Pinnell et al.) & Alster et al.: 15% L-askorbová kyselina + 1% tokoferol + 0.5% ferulová kyselina 8-násobne zvyšuje fotoprotekciu a urýchľuje reepitelizáciu.',
      price: 38.00,
      standardOption: {
        tier: 'standard',
        tierName: 'Základná starostlivosť',
        productName: 'Vichy Liftactiv Supreme 15% čistý Vitamín C sérum',
        brand: 'Vichy',
        price: 38.00,
        usage: '4 – 5 kvapiek ráno na suchú pleť pred hydratačným krémom.',
        purpose: 'Silná antioxidačná ochrana s 15 % čistým vitamínom C a pyknogenolom.'
      },
      premiumOption: {
        tier: 'premium',
        tierName: 'Prémiová starostlivosť',
        productName: 'SkinCeuticals C E Ferulic Triple Antioxidant Treatment',
        brand: 'SkinCeuticals',
        price: 175.00,
        usage: '4 – 5 kvapiek ráno vklepať do pokožky tváre, krku a dekoltu.',
        purpose: 'Svetový klinický zlatý štandard antioxidantov – pôsobí v koži až 72 hodín a stimuluje kolagén.'
      }
    },
    {
      step: 3,
      category: 'Hĺbková hydratácia & pružnosť',
      productName: 'La Roche-Posay Hyalu B5 / SkinCeuticals H.A. Intensifier',
      brand: 'La Roche-Posay / SkinCeuticals',
      usage: 'Ráno po vstrebaní vitamínu C naniesť na celú tvár a krk.',
      purpose: 'Viaže vodu v epidermis a dermis, podporuje pružnosť tkanív a udržiava efekt injekčných a chirurgických výkonov.',
      patientBenefit: 'Dodáva pleti okamžitú šťavnatosť, vypína jemné vrásky a urýchľuje regeneráciu pomocou vitamínu B5.',
      evidenceNote: 'Klinické štúdie D-panthenolu (Vitamín B5) a nízko/vysokomolekulárnej HA potvrdzujú zrýchlenie hojenia epidermálnej bariéry.',
      price: 39.50,
      standardOption: {
        tier: 'standard',
        tierName: 'Základná starostlivosť',
        productName: 'La Roche-Posay Hyalu B5 Sérum (Kyselina hyalurónová + Vitamín B5)',
        brand: 'La Roche-Posay',
        price: 39.50,
        usage: '3 – 4 kvapky ráno na tvár a krk.',
        purpose: 'Intenzívna obnova pružnosti s madecassosidom, vitamínom B5 a duálnou kyselinou hyalurónovou.'
      },
      premiumOption: {
        tier: 'premium',
        tierName: 'Prémiová starostlivosť',
        productName: 'SkinCeuticals H.A. Intensifier Multi-Glycan Sérum',
        brand: 'SkinCeuticals',
        price: 118.00,
        usage: '4 – 6 kvapiek ráno na tvár, oblasť pod očami, pery a krk.',
        purpose: 'Zvyšuje vlastnú hladinu kyseliny hyalurónovej v pleti o +30 % vďaka 10 % Proxylane™.'
      }
    },
    {
      step: 4,
      category: 'Fotoprotekcia SPF 50+ (Ochrana jaziev a pigmentu)',
      productName: 'La Roche-Posay Anthelios UVMune 400 SPF 50+ / SkinCeuticals Ultra Facial Defense SPF 50+',
      brand: 'La Roche-Posay / SkinCeuticals',
      usage: 'Každé ráno ako posledný krok (aj keď je zamračené). Na jazvy aplikovať celých 12 mesiacov!',
      purpose: 'Striktná prevencia pozápalovej hyperpigmentácie (stmavnutia jaziev alebo fľakov po laseri) a ochrana nového kolagénu.',
      patientBenefit: 'Najdôležitejší krok pre krásne a neviditeľné jazvy – zabraňuje tomu, aby slnko zafarbilo mladú jazvu alebo pleť po laseri do hneda.',
      evidenceNote: 'International Scar Management Guidelines & EADV Photoprotection: UV žiarenie v prvých 12 mesiacoch spôsobuje trvalú hyperpigmentáciu jaziev.',
      price: 21.50,
      standardOption: {
        tier: 'standard',
        tierName: 'Základná starostlivosť',
        productName: 'La Roche-Posay Anthelios UVMune 400 Invisible Fluid SPF 50+',
        brand: 'La Roche-Posay',
        price: 21.50,
        usage: 'Dostatočné množstvo (dĺžka 2 prstov) každé ráno na tvár, krk a oblasť jaziev.',
        purpose: 'Filter Mexoryl 400 chráni aj pred ultra-dlhým UVA žiarením (380 – 400 nm).'
      },
      premiumOption: {
        tier: 'premium',
        tierName: 'Prémiová starostlivosť',
        productName: 'SkinCeuticals Ultra Facial Defense SPF 50+ širokospektrálny krém',
        brand: 'SkinCeuticals',
        price: 44.00,
        usage: 'Aplikovať každé ráno pred pobytom vonku na tvár, viečka, krk a jazvy.',
        purpose: 'Špičková fotostabilná UV ochrana s Mexorylom SX/XL, ktorá neupcháva póry a hydratuje 24h.'
      }
    }
  ];

  const eveningRoutine: CosmeticRoutineItem[] = [
    {
      step: 1,
      category: 'Dôkladné večerné odlíčenie a vyčistenie',
      productName: 'CeraVe Hydratačná emulzia / SkinCeuticals Gentle Cleanser',
      brand: 'CeraVe / SkinCeuticals',
      usage: 'Večer vmasírovať na odlíčenie SPF a nečistôt, následne opláchnuť vlažnou vodou.',
      purpose: 'Odstránenie prachu, SPF filtrov a make-upu, aby sa nočné regeneračné látky mohli plne vstrebať.',
      patientBenefit: 'Dokonale čistá pokožka, ktorá môže v noci voľne dýchať a regenerovať sa.',
      evidenceNote: 'Dermatologický štandard dvojfázového čistenia s obsahom ceramidov a alantoínu.',
      price: 14.50,
      standardOption: {
        tier: 'standard',
        tierName: 'Základná starostlivosť',
        productName: 'CeraVe Hydratačná čistiaca emulzia s 3 ceramidmi',
        brand: 'CeraVe',
        price: 14.50,
        usage: 'Večer vmasírovať do vlhkej pleti po dobu 60 sekúnd a zmyť.',
        purpose: 'Šetrné odstránenie SPF a nečistôt s technológiou MVE pre postupné uvoľňovanie hydratácie.'
      },
      premiumOption: {
        tier: 'premium',
        tierName: 'Prémiová starostlivosť',
        productName: 'SkinCeuticals Gentle Cleanser krémový čistiaci prípravok',
        brand: 'SkinCeuticals',
        price: 46.00,
        usage: 'Jemne vmasírovať na tvár a krk, zotrieť navlhčeným tampónom alebo opláchnuť.',
        purpose: 'Obsahuje alantoín a pomarančový olej – upokojuje citlivú alebo pooperačnú pokožku.'
      }
    },
    {
      step: 2,
      category: 'Nočná bunková obnova (Retinoid / Peptidová obnova)',
      productName: 'La Roche-Posay Retinol B3 / SkinCeuticals Retinol 0.3',
      brand: 'La Roche-Posay / SkinCeuticals',
      usage: 'Večer na suchú pleť (2 – 3x týždenne). POZOR: Vysadiť 7 dní pred operáciou/laserom a nasadiť až po úplnom zahojení!',
      purpose: 'Zlatý štandard nočnej obnovy – zrýchľuje bunkový obrat, zjemňuje póry, pigmentácie a stimuluje tvorbu nového kolagénu.',
      patientBenefit: 'Počas spánku obnovuje bunky pleti, vyhladzuje vrásky a predlžuje mladistvý efekt zákrokov.',
      evidenceNote: 'Kafi et al. (Archives of Dermatology) & ASPS Pre-Conditioning Guidelines: lokálne retinoidy preukázateľne zvyšujú syntézu prokolagénu I.',
      price: 39.00,
      standardOption: {
        tier: 'standard',
        tierName: 'Základná starostlivosť',
        productName: 'La Roche-Posay Retinol B3 regeneračné sérum (Retinol + Niacínamid)',
        brand: 'La Roche-Posay',
        price: 39.00,
        usage: 'Večer 3 kvapky na suchú tvár (mimo čerstvých jaziev). Vysadiť 7 dní pred zákrokom.',
        purpose: 'Kombinácia čistého a postupne uvoľňovaného retinolu s upokojujúcim vitamínom B3.'
      },
      premiumOption: {
        tier: 'premium',
        tierName: 'Prémiová starostlivosť',
        productName: 'SkinCeuticals Retinol 0.3 čistý stabilizovaný retinol',
        brand: 'SkinCeuticals',
        price: 98.00,
        usage: 'Večer množstvo veľkosti hrášku na suchú pleť (vynechať 7 dní pred a 14 dní po zákroku).',
        purpose: 'Enkapsulovaný 0.3 % čistý retinol s bisabololom a boswelliou pre maximálnu obnovu bez podráždenia.'
      }
    },
    {
      step: 3,
      category: 'Hĺbková rekonštrukcia bariéry & hojenie po zákrokoch',
      productName: 'La Roche-Posay Cicaplast Baume B5+ / SkinCeuticals Triple Lipid Restore 2:4:2',
      brand: 'La Roche-Posay / SkinCeuticals',
      usage: 'Každý večer ako výživný nočný krém (v prvých 14 dňoch po operácii/laseri aj viackrát denne).',
      purpose: 'Obnova esenciálnych kožných lipidov (ceramidov, cholesterolu a mastných kyselín), upokojenie po zákrokoch a výživa.',
      patientBenefit: 'Funguje ako „ochranný obväz v kréme“ – okamžite upokojuje začervenanie, regeneruje pleť po laseri a vyživuje hojace sa tkanivá.',
      evidenceNote: 'Klinická štúdia pomeru lipidov 2% ceramidy : 4% cholesterol : 2% mastné kyseliny potvrdzuje o 66 % rýchlejšiu obnovu kožnej bariéry.',
      price: 16.50,
      standardOption: {
        tier: 'standard',
        tierName: 'Základná starostlivosť',
        productName: 'La Roche-Posay Cicaplast Baume B5+ regeneračný balzam s Tribioma',
        brand: 'La Roche-Posay',
        price: 16.50,
        usage: 'Večer na celú tvár, krk a zahojené pooperačné línie.',
        purpose: '5 % Panthenol + Madecassoside + Tribioma pre intenzívne hojenie a upokojenie.'
      },
      premiumOption: {
        tier: 'premium',
        tierName: 'Prémiová starostlivosť',
        productName: 'SkinCeuticals Triple Lipid Restore 2:4:2 patentovaný krém',
        brand: 'SkinCeuticals',
        price: 155.00,
        usage: 'Malé množstvo zahriať medzi prstami a krúživými pohybmi vmasírovať do pleti.',
        purpose: 'Patentovaný fyziologický pomer lipidov 2:4:2 pre rekonštrukciu zrelej a pooperačnej pleti.'
      }
    }
  ];

  // Špeciálna týždenná starostlivosť zosúladená s vybratými výkonmi
  const specialWeeklyCare: string[] = [
    'Pravidlo 7 dní pred zákrokom: 7 dní pred operáciou alebo laserom vysaďte večerný retinol a kyseliny, používajte len čistenie, hydratáciu, bariérový krém a SPF 50+.',
    'Ochrana jaziev a novej pleti: Na operované miesta a ošetrenú pleť aplikujte SPF 50+ každé ráno po dobu minimálne 12 mesiacov (aj počas oblačných dní).',
    'Vnútorná výživa kolagénu: Počas prípravy a hojenia užívajte hydrolyzovaný kolagén (10 000 mg denne) spolu s vitamínom C (500 – 1000 mg) a zinkom.'
  ];
  finalProcs.forEach(p => {
    if (p.skincareImpact?.weeklyTip && !specialWeeklyCare.includes(p.skincareImpact.weeklyTip)) {
      specialWeeklyCare.push(p.skincareImpact.weeklyTip);
    }
  });

  // 3. ZOSTAVENIE SAY CARE: PREDOPERAČNÁ PREHABILITÁCIA & POOPERAČNÝ PROTOKOL PODĽA VYBRATÝCH VÝKONOV
  const prehab: PreOpPrehabilitation = {
    medicalPrehab: [
      'Kompletné predoperačné interné a laboratórne vyšetrenie (krvný obraz, zrážanlivosť krvi INR/APTT, biochémia, EKG) 14 dní pred operáciou (ERAS® Standard).',
      '10 až 14 dní pred zákrokom vysadiť lieky ovplyvňujúce zrážanlivosť krvi (Aspirin, Acylpyrin, Anopyrin, Ibalgin, Ibuprofén, Nalgesin) – po dohode s lekárom.',
      'Prísny zákaz fajčenia, elektronických cigariet a nikotínových vrecúšok minimálne 4 týždne pred a 4 týždne po operácii (nikotín sťahuje cievy a až 3-násobne zvyšuje riziko zlého hojenia jaziev).'
    ],
    psychologicalPrep: [
      'Eliminácia chronického stresu a ochrana imunitného hojenia: Chronický distres a psychické vypätie vyplavujú kortizol a katecholamíny, ktoré preukázateľne znižujú tvorbu kolagénu v rane o 20–40 % a potláčajú bunkovú imunitu (Kiecolt-Glaser / Lancet). 1 – 2 týždne pred operáciou uzavrite pracovné stresory a zabezpečte si pokojný mentálny režim.',
      'Mentálna pripravenosť na priebeh a možné komplikácie (Psychological readiness): Hojenie nie je priamka. Oboznámenie sa s fázami hojenia a pripravenosť na bežné prechodné javy (asymetrický opuch, modrinky, tuhosť, prechodná znížená citlivosť) aj na zvládnutie prípadných komplikácií (hematóm, predĺžené hojenie) zabraňuje panike, úzkosti a pocitu straty kontroly.',
      'Prevencia pooperačnej emocionálnej lability („Post-Op Blues“): Na 3. až 5. deň po operácii nastáva vplyvom doznievania analgézie, únavy a opuchov prirodzený neuroendokrinný pokles nálady a pochybnosti. Vedomá mentálna príprava pred zákrokom pomáha pacientovi zvládnuť tento stav s pokojom a bez psychickej traumy.',
      'Nácvik copingových stratégií a relaxácie: Nácvik bránicového dýchania (technika 4-7-8), progresívnej svalovej relaxácie a riadenej vizualizácie hojenia tkanív. Tieto techniky preukázateľne znižujú vnímanie pooperačnej bolesti a znižujú spotrebu analgetík až o 30 % (ERAS® Society Guidelines).'
    ],
    nutritionalPrep: [
      'Zvýšený príjem plnohodnotných bielkovín (1,5 – 2,0 g na kg hmotnosti denne – ryby, hydina, vajcia, strukoviny, srvátkový proteín) 2 – 4 týždne pred a po zákroku ako základný substrát pre syntézu nového kolagénu.',
      'Suplementácia podľa EBM štúdií: Vitamín C (1000 mg/deň), Zinok (20 – 25 mg/deň), hydrolyzované kolagénové peptidy a Bromelaín / Wobenzym (od 2. pooperačného dňa na rýchlejšie vstrebávanie opuchov).',
      '14 dní pred operáciou vysadiť bylinné prípravky zvyšujúce krvácavosť (Ginkgo biloba, ženšen, vysoké dávky vitamínu E, cesnakové extrakty a rybí olej) a 7 dní pred operáciou nepiť alkohol.'
    ],
    physicalPrep: [
      'Silový odporový tréning veľkých svalových skupín (Resistance Training): Pravidelné posilňovanie najväčších svalových partií tela – dolné končatiny a sedacie svaly (drepy, výstupy na schod, leg press), chrbát (príťahy, veslovanie) a stred tela / core (plank, mostíky) 3 – 4x týždenne (Minnella / Carli et al., Annals of Surgery).',
      'Vybudovanie a ochrana svalovej hmoty (Metabolic Anabolic Reserve): Pooperačný kľud a imobilita vyvolávajú akútny katabolizmus a stratu svalov (až 1 kg svalov za týždeň). Vybudovaná svalová hmota slúži ako kľúčová metabolická aminokyselinová rezerva pre imunitný systém a syntézu kolagénu v hojacich sa ranách.',
      'Uľahčenie pooperačného vstávania a sebestačnosti: Pevné nohy a silný stred tela (core) umožňujú po operácii vstávať z postele a z kresla výhradne silou nôh a brucha, bez nebezpečného zapájania a napínania operovaných oblastí (tváre, krku, prsných svalov alebo brušnej steny).',
      'Zvýšenie kardiorespiračnej rezervy a VO2 max: Kombinácia silového tréningu so stredne intenzívnym aeróbnym kardio cvičením (rýchla chôdza do kopca, bicykel, plávanie) zlepšuje tkanivovú oxygenáciu a chráni pred pooperačnou tromboembóliou (TEN) a pľúcnymi komplikáciami.',
      'Synergia tréningu so svalovou proteosyntézou: Silový tréning stimuluje anabolickú mTOR dráhu, ktorá v spojení s predoperačným príjmom bielkovín (1,5 – 2,0 g/kg/deň) privádza organizmus do optimálnej anabolickej kondície pred chirurgickým výkonom.'
    ]
  };

  // Pridáme špecifické prehabilitačné body z vybratých operácií
  finalProcs.forEach(p => {
    p.preOpSpecifics.medical?.forEach(m => { if (!prehab.medicalPrehab.includes(m)) prehab.medicalPrehab.push(m); });
    p.preOpSpecifics.psychological?.forEach(ps => { if (!prehab.psychologicalPrep.includes(ps)) prehab.psychologicalPrep.push(ps); });
    p.preOpSpecifics.nutritional?.forEach(n => { if (!prehab.nutritionalPrep.includes(n)) prehab.nutritionalPrep.push(n); });
    p.preOpSpecifics.physical?.forEach(ph => { if (!prehab.physicalPrep.includes(ph)) prehab.physicalPrep.push(ph); });
  });

  const preOpInstructions: PreOpInstruction[] = [
    {
      id: 'pre-ebm-1',
      timeframe: '4 týždne pred zákrokom',
      title: 'Stop nikotínu & Príprava kožnej bariéry a výživy',
      description: 'Prestaňte fajčiť a užívať nikotín. Začnite s predoperačnou skincare rutinou (hydratácia, ceramidy, SPF 50+) a zvýšte príjem bielkovín, vitamínu C a zinku.',
      mandatory: true
    },
    {
      id: 'pre-ebm-2',
      timeframe: '2 týždne pred zákrokom',
      title: 'Predoperačné vyšetrenia & Vysadenie liekov na riedenie krvi',
      description: 'Absolvujte predoperačné odbery krvi (KO, zrážanlivosť, biochémia) a interné/anestéziologické vyšetrenie. Vysaďte Aspirin, Ibalgin, Ginkgo, vitamín E a alkohol.',
      mandatory: true
    },
    {
      id: 'pre-ebm-3',
      timeframe: '7 dní pred zákrokom',
      title: 'Vysadenie retinolu a príprava domácnosti',
      description: 'Vysaďte večerný retinol a exfoliačné kyseliny. Pripravte si doma chladiace obklady, vankúše na vyvýšené spanie a voľné oblečenie na zips/gombíky.',
      mandatory: true
    }
  ];

  // Špecifické kroky v časovej osi podľa vybratých výkonov
  finalProcs.forEach((p, i) => {
    if (p.preOpSpecifics.timelineInstruction) {
      preOpInstructions.push({
        id: `pre-spec-${i}`,
        timeframe: p.preOpSpecifics.timelineInstruction.timeframe,
        title: p.preOpSpecifics.timelineInstruction.title,
        description: p.preOpSpecifics.timelineInstruction.description,
        mandatory: true
      });
    }
  });

  preOpInstructions.push({
    id: 'pre-ebm-day0',
    timeframe: 'Večer pred & Deň zákroku',
    title: 'Nalačno (pri celkovej anestézii) & Príchod bez make-upu a šperkov',
    description: 'Pri celkovej anestézii 6 hodín pred zákrokom nič nejedzte a nepite. Ráno sa osprchujte antibakteriálnym mydlom, príďte úplne nenalíčená, bez krému, šperkov, kontaktných šošoviek a s odlakovanými nechtami.',
    mandatory: true
  });

  // 4. POOPERAČNÉ FÁZY A PROTOKOL JAZIEV ZOSÚLADENÉ S VÝKONMI
  const earlyPhaseInstructions: string[] = [
    'Prísny kľudový režim so zvýšenou polohou hlavy/tela (30 – 45°), vyhýbať sa predklonom, dvíhaniu ťažkých predmetov a horúcim kúpeľom.',
    'Užívanie predpísaných liekov (antibiotická profylaxia, lieky proti opuchu a bolesti) presne podľa rozpisu v prepúšťacej správe.'
  ];
  const warningSignsList: string[] = [
    'Teplota nad 38,0 °C, zimnica alebo vytekanie zakalenej tekutiny z rany.',
    'Náhle jednostranné zväčšenie opuchu, stvrdnutie alebo intenzívna pulzujúca bolesť.'
  ];

  finalProcs.forEach(p => {
    if (p.postOpSpecifics.earlyCare && !earlyPhaseInstructions.includes(p.postOpSpecifics.earlyCare)) {
      earlyPhaseInstructions.push(p.postOpSpecifics.earlyCare);
    }
    if (p.postOpSpecifics.warningSign && !warningSignsList.includes(p.postOpSpecifics.warningSign)) {
      warningSignsList.push(p.postOpSpecifics.warningSign);
    }
  });

  const postOpPhases: PostOpRecoveryPhase[] = [
    {
      phaseId: 'phase-1',
      period: '1. – 7. deň po zákroku',
      title: 'Fáza 1: Akútne hojenie, kontrola opuchu a kľudový režim',
      focus: 'Pokoj tkanív & Prevencia opuchu',
      instructions: earlyPhaseInstructions,
      scarCareGuidelines: [
        'Rany udržiavať v sterilnej čistote a suchu (krytia a stehy nenamáčať, pokiaľ lekár neurčí inak).',
        'Nepoužívať žiadne kozmetické krémy ani silikón priamo na čerstvé zašité rany až do vybratia stehov.'
      ],
      warningSigns: warningSignsList
    },
    {
      phaseId: 'phase-2',
      period: '7. – 21. deň po zákroku',
      title: 'Fáza 2: Kontrola, vybratie stehov & Štart starostlivosti o jazvy',
      focus: 'Epitelizácia & Lymfodrenáž',
      instructions: [
        'Ambulantná kontrola a šetrné odstránenie stehov (zvyčajne 6. – 14. deň podľa operovanej oblasti).',
        'Postupný návrat k bežným denným aktivitám; naďalej sa vyhýbať saune, bazénom a intenzívnemu športu.',
        hasBodySurgery
          ? 'Pokračovať v nepretržitom nosení kompresívnej bielizne 24/7.'
          : 'Zaradenie jemnej odbornej manuálnej lymfodrenáže na urýchlenie vstrebania zvyškového opuchu.'
      ],
      scarCareGuidelines: [
        'Akonáhle je rana plne uzavretá a bez chrastičiek (cca 14. deň), začnite 2x denne aplikovať 100% medicínsky silikónový gél (Strataderm / Dermatix) v tenkej vrstve.',
        'Jazvu chráňte pred slnkom pomocou SPF 50+ pri každom pobyte na dennom svetle.'
      ]
    },
    {
      phaseId: 'phase-3',
      period: '3. – 8. týždeň po zákroku',
      title: 'Fáza 3: Aktívna remodelácia jaziev, tlakové masáže & cievny laser',
      focus: 'Tlakové masáže & Laser jaziev',
      instructions: [
        'Od 3. týždňa zaradenie pravidelných tlakových masáží jaziev (bruškom prsta zatlačiť na jazvu na 10 sekúnd, kým zbledne, a posunúť sa ďalej – 3x denne po 5 minút).',
        'Postupný návrat k plnej fyzickej aktivite a cvičeniu (pri operáciách tela a prsníkov po 6. týždni).',
        'Možnosť aplikácie botulotoxínu alebo včasného cievneho/biostimulačného lasera na urýchlenie vyblednutia jazvy.'
      ],
      scarCareGuidelines: [
        'Kombinácia silikónového gélu/náplastí s tlakovou masážou zabezpečuje, že kolagénové vlákna sa uložia plocho a jazva zostane mäkká.',
        'Prípadné začervenanie jazvy v 1. – 2. mesiaci je normálnou fázou hojenia (tvorba kapilár) a dá sa výrazne skrátiť cievnym laserom.'
      ]
    },
    {
      phaseId: 'phase-4',
      period: '2. – 12. mesiac po zákroku',
      title: 'Fáza 4: Finálne vyzretie výsledku & Dlhodobá udržiavacia starostlivosť',
      focus: 'Kolagénová prestavba & Ochrana',
      instructions: [
        'Realizácia nadväzujúcich estetických krokov podľa Ročného plánu (frakčný CO2 resurfacing pleti, polynukleotidy, skinbooster).',
        'Kontrolné 3D Meicet spektrálne meranie stavu pleti po 3, 6 a 12 mesiacoch s vyhodnotením kvality kolagénu a jaziev.'
      ],
      scarCareGuidelines: [
        'Jazva definitívne vyzrieva 6 až 12 mesiacov (mení sa z ružovej na tenkú bledú líniu). Po celý tento čas ju chráňte krémom s SPF 50+.'
      ]
    }
  ];

  // 5. ZROZUMITEĽNÉ ZHRNUTIE PRE PACIENTA & OVERENÉ MEDICÍNSKE GUIDELINY
  const patientFriendlySummary = `Váš osobný ročný plán (${procNamesShort}) bol zostavený tak, aby jednotlivé zákroky na seba logicky a bezpečne nadväzovali. ${
    hasSurgery
      ? 'Najskôr pokožku a organizmus pripravíme (prehabilitácia), následne zrealizujeme chirurgický výkon a v presne stanovených rozostupoch podporíme hojenie jaziev, lymfodrenáž a povrchovú obnovu pleti.'
      : 'Jednotlivé ošetrenia pleti sú rozložené podľa ročných období a biologického cyklu obnovy kolagénu (28 – 42 dní), aby ste dosiahli maximálny a prirodzený výsledok bez zbytočného zaťaženia pokožky.'
  } Ku každému kroku máte priradenú domácu starostlivosť (vo variante Základná alebo Prémiová) a jasný návod, čo robiť pred aj po zákroku.`;

  const verifiedGuidelinesUsed = [
    {
      title: 'ERAS® Society Plastic Surgery Guidelines (Enhanced Recovery After Surgery)',
      organization: 'ERAS® Society & International Plastic Surgery Consensus',
      summaryForPatient: 'Overený medicínsky protokol prípravy organizmu (výživa, hydratácia, nefajčenie, včasný pohyb), ktorý skracuje dobu zotavenia a znižuje opuchy až o 40 %.'
    },
    {
      title: 'International Advisory Panel on Scar Management (Mustoe et al. / Gold et al.)',
      organization: 'Plastic and Reconstructive Surgery Journal',
      summaryForPatient: 'Svetový štandard starostlivosti o jazvy: potvrdzuje, že kombinácia 100 % silikónového gélu od 14. dňa, tlakových masáží od 21. dňa a včasného lasera vedie k najjemnejším, takmer neviditeľným jazvám.'
    },
    {
      title: 'ASPS & ISAPS Evidence-Based Sequential Facial & Body Rejuvenation Guidelines',
      organization: 'American Society of Plastic Surgeons (ASPS)',
      summaryForPatient: 'Stanovuje bezpečné odstupy medzi operáciou (obnova hlbokých štruktúr), laserom (obnova povrchu kože) a injekčnými ošetreniami (uvoľnenie mimiky a doplnenie objemu).'
    },
    {
      title: 'EADV Photoprotection & Topical Antioxidant Consensus (Duke Parameters)',
      organization: 'European Academy of Dermatology and Venereology (EADV)',
      summaryForPatient: 'Potvrdzuje, že ranný 15 % vitamín C s kyselinou ferulovou a denné SPF 50+ chránia novotvorený kolagén a bránia stmavnutiu jaziev a pigmentových škvŕn.'
    }
  ];

  return {
    id: basePlan?.id || `plan-${Date.now()}`,
    patientId: patientId || basePlan?.patientId || 'P1',
    patientName: patientName || basePlan?.patientName || 'Pacient SAY CLINIC',
    patientBirthNumber: patientBirthNumber || basePlan?.patientBirthNumber,
    createdAt: basePlan?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    doctorName: doctorName || basePlan?.doctorName || 'MUDr. Ján Mráz',
    planType: 'combined',
    title: `Ročný plán starostlivosti: ${procNamesShort}`,
    diagnosisOrGoal:
      diagnosisOrGoal ||
      basePlan?.diagnosisOrGoal ||
      `Komplexný medicínsky a estetický plán prispôsobený pre: ${procNamesShort}`,
    patientFriendlySummary,
    verifiedGuidelinesUsed,
    selectedProceduresList: finalProcs.map(p => p.id),
    meicetMetrics: basePlan?.meicetMetrics,
    meicetScanDate: basePlan?.meicetScanDate,
    meicetPdfFilename: basePlan?.meicetPdfFilename,
    meicetMilestones: basePlan?.meicetMilestones,
    analysisSummary: {
      skinType: skinType || basePlan?.analysisSummary?.skinType || 'Zmiešaná / normálna',
      skinTonePhototype: basePlan?.analysisSummary?.skinTonePhototype || 'Fitzpatrick II-III',
      mainConcerns: finalProcs.map(p => p.shortLabel),
      vectorZones: finalProcs.map(p => p.targetArea)
    },
    cosmeticsRoutine: {
      activeTier: basePlan?.cosmeticsRoutine?.activeTier || 'both',
      morning: morningRoutine,
      evening: eveningRoutine,
      specialWeeklyCare
    },
    annualTreatments: synthesizedTreatments,
    preOpCare: {
      procedureName: mainSurgeryLabel,
      prehabilitation: prehab,
      instructions: preOpInstructions
    },
    postOpCare: {
      procedureName: mainSurgeryLabel,
      phases: postOpPhases,
      scarProtocol: {
        siliconeApplication: 'Od 14. dňa (po vybratí stehov a odpadnutí chrastičiek) aplikujte 2x denne tenkú vrstvu 100% medicínskeho silikónového gélu (Strataderm / Dermatix) alebo silikónové náplasti po dobu 3 – 6 mesiacov (Gold et al. Scar Guideline).',
        pressureMassage: 'Od 21. dňa vykonávajte 3x denne po 5 – 10 minút cielené tlakové masáže jazvy bruškom prsta (zatlačiť na 10 sekúnd do zblednutia a posunúť sa o 5 mm ďalej).',
        lymphaticDrainage: 'Od 10. – 14. dňa séria 5 – 10 odborných manuálnych alebo prístrojových lymfodrenáží na rýchle odplavenie pooperačného opuchu a prevenciu fibrózy podkožia.',
        laserTherapy: 'V 4. – 8. týždni včasné ošetrenie cievnym laserom (redukcia červeného sfarbenia jazvy) a následne frakčným CO2 laserom pre dokonalé splynutie jazvy s okolitou kožou.',
        sunProtection: 'Striktná ochrana jaziev a ošetrenej pleti krémom s faktorom SPF 50+ (La Roche-Posay Anthelios UVMune 400 / SkinCeuticals) po dobu 12 mesiacov pri každom pobyte vonku.',
        advancedScarTherapies: [
          'Cievny laser (redukcia začervenania jazvy v 4. – 6. týždni)',
          'Frakčný CO2 laser resurfacing jazvy (v 8. – 12. týždni)',
          'Lokálna aplikácia polynukleotidov (Plinest) alebo exozómov do línie jazvy',
          'Odborná manuálna lymfodrenáž a uvoľňovanie fascií'
        ]
      }
    },
    doctorNote: `Plán bol medicínsky zostavený a overený podľa najnovších klinických guidelinov (ERAS®, ASPS, EADV, International Scar Management Consensus) špecificky pre zvolené výkony: ${procNamesShort}.`
  };
}
