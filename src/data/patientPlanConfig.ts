import { MeicetSkinMetrics, MeicetMilestone } from '@/types/meicet';

export interface RoutineProductOption {
  tier: 'standard' | 'premium';
  tierName: 'Základná starostlivosť' | 'Prémiová starostlivosť' | 'Lekárenská dermokozmetika' | 'Medicínska kozmeceutika';
  productName: string;
  brand: string;
  price: number;
  usage?: string;
  purpose?: string;
}

export interface CosmeticRoutineItem {
  step: number;
  category: string; // 'Čistenie' | 'Sérum / Antioxidant' | 'Hydratácia' | 'SPF Ochrana' | 'Retinoidy' | 'Nočná regenerácia'
  productName: string;
  brand: string;
  usage: string;
  purpose: string;
  price?: number;
  patientBenefit?: string; // Zrozumiteľné vysvetlenie prínosu pre pacienta
  evidenceNote?: string;   // Overený dermatologický guideline / štúdia
  // Dve voliteľné triedy: Základná starostlivosť vs. Prémiová starostlivosť
  standardOption?: RoutineProductOption;
  premiumOption?: RoutineProductOption;
  selectedTier?: 'standard' | 'premium';
}

export interface ScheduledTreatment {
  id: string;
  name: string;
  category: 'laser' | 'injectable' | 'skin_care' | 'surgery' | 'rehab' | 'scar_care';
  seasonOrMonth: string; // 'Q1 (Jan - Mar)' | 'Q2 (Apr - Jún)' | 'Q3 (Júl - Sep)' | 'Q4 (Okt - Dec)' alebo mesiac
  targetArea: string;
  frequencyOrSessions: string;
  estimatedPrice?: number;
  priority: 'high' | 'medium' | 'recommended';
  status: 'planned' | 'booked' | 'completed';
  notes?: string;
  patientExplanation?: string; // Zrozumiteľné vysvetlenie zákroku pre pacienta ľudskou rečou
  clinicalGuideline?: string;  // Overený medicínsky guideline / štúdia (ASPS, ERAS, EADV, Scar Consensus)
  recoveryTime?: string;       // Čas zotavenia pre pacienta
  calendarEventId?: string;
  stepOrder?: number;
  isSkinTreatment?: boolean; // Rozlíšenie medzi ošetrením pleti (SAY Skincare) a sekvenčným plánom (Ročný plán)
}

export interface PreOpInstruction {
  id: string;
  timeframe: string; // '4 týždne pred' | '2-3 týždne pred' | '1 týždeň pred' | 'Deň pred zákrokom' | 'Deň operácie'
  title: string;
  description: string;
  mandatory: boolean;
  completed?: boolean;
}

export interface PreOpPrehabilitation {
  medicalPrehab: string[];     // Prehabilitácia & medicínska príprava
  psychologicalPrep: string[]; // Psychologická príprava
  nutritionalPrep: string[];   // Nutričná príprava
  physicalPrep: string[];      // Fyzická príprava
}

export interface PostOpRecoveryPhase {
  phaseId: string;
  period: string; // '1. – 7. deň' | '7. – 14. deň' | '2. – 6. týždeň' | '2. – 6. mesiac' | '6. – 12. mesiac'
  title: string;
  focus: string;
  instructions: string[];
  scarCareGuidelines?: string[];
  recommendedProcedures?: string[];
  warningSigns?: string[];
}

export interface PatientPlan {
  id: string;
  patientId: string;
  patientName: string;
  patientBirthNumber?: string;
  createdAt: string;
  updatedAt: string;
  doctorName: string;
  planType: 'annual_aesthetic' | 'pre_post_op' | 'combined';
  title: string;
  diagnosisOrGoal: string;
  patientFriendlySummary?: string; // Zrozumiteľné zhrnutie celého plánu pre pacienta
  verifiedGuidelinesUsed?: Array<{
    title: string;
    organization: string;
    summaryForPatient: string;
  }>;
  selectedProceduresList?: string[]; // Zoznam ID vybratých operácií a výkonov
  // 1. SAY Skincare - Meicet 3D Spektrálne dáta & Analýza pleti
  meicetMetrics?: MeicetSkinMetrics;
  meicetScanDate?: string;
  meicetPdfFilename?: string;
  meicetMilestones?: MeicetMilestone[];
  analysisSummary?: {
    skinType?: string;
    skinTonePhototype?: string;
    mainConcerns?: string[];
    vectorZones?: string[];
    facialAgeEstimated?: number;
  };
  cosmeticsRoutine: {
    activeTier?: 'standard' | 'premium' | 'both';
    morning: CosmeticRoutineItem[];
    evening: CosmeticRoutineItem[];
    specialWeeklyCare: string[];
  };
  // 2. Ročný Plán & Ošetrenia pleti
  annualTreatments: ScheduledTreatment[];
  // 3. SAY Care - Predoperačný & Pooperačný protokol
  preOpCare?: {
    procedureName: string;
    targetSurgeryDate?: string;
    prehabilitation?: PreOpPrehabilitation;
    instructions: PreOpInstruction[];
  };
  postOpCare?: {
    procedureName: string;
    surgeryDate?: string;
    phases: PostOpRecoveryPhase[];
    scarProtocol: {
      siliconeApplication: string;
      pressureMassage: string;
      sunProtection: string;
      lymphaticDrainage?: string;
      laserTherapy?: string;
      advancedScarTherapies: string[];
    };
  };
  doctorNote?: string;
}

// KLINICKÉ ŠABLÓNY SAY CLINIC
export const PRESET_PATIENT_PLANS: Record<string, Partial<PatientPlan>> = {
  face_annual_rejuvenation: {
    title: 'Ročný estetický & anti-aging plán rejuvenácie tváre',
    planType: 'annual_aesthetic',
    diagnosisOrGoal: 'Komplexná rejuvenácia pleti, strata elasticity v strednej tretine tváre, mimické vrásky čela a glabelly, prevencia fotostarnutia.',
    analysisSummary: {
      skinType: 'Zmiešaná, sklon k dehydratácii',
      skinTonePhototype: 'Fitzpatrick II-III',
      mainConcerns: ['Mimické vrásky glabelly a periokulárne', 'Znížený turgor v oblasti líc', 'Mierne fotopoškodenie a nerovnomerný tón'],
      vectorZones: ['Čelo & Glabela', 'Lícne kosti & Malárna oblasť', 'Nazolabiálne ryhy']
    },
    cosmeticsRoutine: {
      activeTier: 'both',
      morning: [
        {
          step: 1,
          category: 'Čistenie',
          productName: 'CeraVe Hydratačná čistiaca emulzia / SkinCeuticals Simply Clean',
          brand: 'CeraVe / SkinCeuticals',
          usage: 'Ráno na vlhkú pokožku, jemne vmasírovať 60 sekúnd, opláchnuť vlažnou vodou.',
          purpose: 'Šetrné odstránenie mazu bez narušenia kožnej mikrobiómy a ochrannej bariéry.',
          price: 14.50,
          standardOption: {
            tier: 'standard',
            tierName: 'Základná starostlivosť',
            productName: 'CeraVe Hydratačná čistiaca emulzia (Hydrating Cleanser)',
            brand: 'CeraVe',
            price: 14.50,
            usage: 'Ráno na vlhkú pokožku, jemne vmasírovať 60 sekúnd a opláchnuť.',
            purpose: 'Šetrné čistenie s 3 esenciálnymi ceramidmi a kyselinou hyalurónovou bez pnutia.'
          },
          premiumOption: {
            tier: 'premium',
            tierName: 'Prémiová starostlivosť',
            productName: 'SkinCeuticals Simply Clean hĺbkový čistiaci gél s amíno-kombináciou',
            brand: 'SkinCeuticals',
            price: 48.00,
            usage: 'Malé množstvo vmasírovať na navlhčenú tvár a krk, zmyť vlažnou vodou.',
            purpose: 'Jemná enzymatická mikro-exfoliácia a hĺbkové prečistenie pórov pred nanesením antioxidantov.'
          }
        },
        {
          step: 2,
          category: 'Sérum / Antioxidant',
          productName: 'Vichy Liftactiv 15% Vit C / SkinCeuticals C E Ferulic',
          brand: 'Vichy / SkinCeuticals',
          usage: '4-5 kvapiek ráno na suchú vyčistenú tvár, krk a dekolt.',
          purpose: 'Neutralizácia voľných radikálov z UV žiarenia a smogu, stimulácia neokolagenézy a rozjasnenie.',
          price: 38.00,
          standardOption: {
            tier: 'standard',
            tierName: 'Základná starostlivosť',
            productName: 'Vichy Liftactiv Supreme 15% čistý Vitamín C rozjasňujúce sérum',
            brand: 'Vichy',
            price: 38.00,
            usage: '4-5 kvapiek každé ráno na suchú pokožku pred krémom.',
            purpose: 'Vysoká 15% koncentrácia kyseliny L-askorbovej s pyknogenolom a vitamínom E.'
          },
          premiumOption: {
            tier: 'premium',
            tierName: 'Prémiová starostlivosť',
            productName: 'SkinCeuticals C E Ferulic patentované antioxidačné sérum (Zlatý štandard)',
            brand: 'SkinCeuticals',
            price: 175.00,
            usage: '4-5 kvapiek ráno na tvár, krk a dekolt. Vstrebáva sa okamžite s 72h depozitným účinkom.',
            purpose: 'Duke University patent: 15% čistý vit C + 1% vit E + 0.5% kys. ferulová. Znižuje oxidačné poškodenie buniek o 41 %.'
          }
        },
        {
          step: 3,
          category: 'Hydratácia & Plnosť',
          productName: 'La Roche-Posay Hyalu B5 / SkinCeuticals H.A. Intensifier',
          brand: 'La Roche-Posay / SkinCeuticals',
          usage: 'Naniesť na tvár a krk ako hydratačnú a spevňujúcu bázu.',
          purpose: 'Obnova turgoru, pružnosti pleti a okamžité vyplnenie dehydratačných liniek.',
          price: 39.50,
          standardOption: {
            tier: 'standard',
            tierName: 'Základná starostlivosť',
            productName: 'La Roche-Posay Hyalu B5 intenzívne hydratačné sérum s vitamínom B5',
            brand: 'La Roche-Posay',
            price: 39.50,
            usage: 'Aplikovať 3-4 kvapky na tvár a krk ráno aj večer.',
            purpose: 'Dva druhy čistej kyseliny hyalurónovej + vitamín B5 pre rehydratáciu a obnovu objemu.'
          },
          premiumOption: {
            tier: 'premium',
            tierName: 'Prémiová starostlivosť',
            productName: 'SkinCeuticals H.A. Intensifier Multi-Glycan sérum stimulujúce tvorbu HA',
            brand: 'SkinCeuticals',
            price: 125.00,
            usage: '4-6 kvapiek rozotrieť na tvár, líca a čelo.',
            purpose: 'Klinicky preukázané zvýšenie vlastnej hladiny kyseliny hyalurónovej v koži o 30 % vďaka Proxylane™ a extraktu z fialovej ryže.'
          }
        },
        {
          step: 4,
          category: 'SPF Fotoprotekcia',
          productName: 'Anthelios UVMune 400 SPF 50+ / SkinCeuticals Ultra Facial Defense SPF 50',
          brand: 'La Roche-Posay / SkinCeuticals',
          usage: 'Každé ráno ako finálny krok starostlivosti, rovnomerne 2 prsty prípravku na tvár, uši a krk.',
          purpose: 'Absolútna ochrana pred UVA, ultra-dlhým UVA žiarením a UVB lúčmi – kľúčová prevencia fotostarnutia.',
          price: 21.50,
          standardOption: {
            tier: 'standard',
            tierName: 'Základná starostlivosť',
            productName: 'La Roche-Posay Anthelios UVMune 400 Invisible Fluid SPF 50+',
            brand: 'La Roche-Posay',
            price: 21.50,
            usage: 'Pred použitím pretrepať, naniesť ráno po sére/kréme.',
            purpose: 'Revolučný filter Mexoryl 400 chráni pred najzákernejšími ultra-dlhými UVA lúčmi (380–400 nm).'
          },
          premiumOption: {
            tier: 'premium',
            tierName: 'Prémiová starostlivosť',
            productName: 'SkinCeuticals Ultra Facial Defense SPF 50+ širokospektrálny fotoprotekčný krém',
            brand: 'SkinCeuticals',
            price: 44.00,
            usage: 'Naniesť ráno ako posledný krok pred make-upom. Ultraľahká nekomedogénna textúra.',
            purpose: 'Vysoko stabilný UV komplex novej generácie zabraňuje degradácii kolagénu a vzniku UV pigmentových škvŕn.'
          }
        }
      ],
      evening: [
        {
          step: 1,
          category: 'Čistenie / Odlíčenie',
          productName: 'LRP Toleriane Dermo-Cleanser / SkinCeuticals Soothing Cleanser',
          brand: 'La Roche-Posay / SkinCeuticals',
          usage: 'Večerné dôkladné čistenie pre odstránenie SPF, mazu a mikro-nečistôt.',
          purpose: 'Príprava epidermy na nočnú regeneráciu a bezpečné vstrebávanie retinolu.',
          price: 17.50,
          standardOption: {
            tier: 'standard',
            tierName: 'Základná starostlivosť',
            productName: 'La Roche-Posay Toleriane Dermo-Cleanser upokojujúce čistiace mlieko',
            brand: 'La Roche-Posay',
            price: 17.50,
            usage: 'Naniesť končekmi prstov, zľahka premasírovať a jemne zotrieť tampónom.',
            purpose: 'Minimalistické zloženie obohatené o termálnu vodu bez parfumácie pre nulové riziko podráždenia.'
          },
          premiumOption: {
            tier: 'premium',
            tierName: 'Prémiová starostlivosť',
            productName: 'SkinCeuticals Soothing Cleanser upokojujúca čistiaca pena s orchideou',
            brand: 'SkinCeuticals',
            price: 46.00,
            usage: '2 pumpy peny jemne vmasírovať na navlhčenú tvár a opláchnuť.',
            purpose: 'Bohatá pena s výťažkami z orchidey a uhorky, špeciálne vyvinutá pre pleť po estetických zákrokoch.'
          }
        },
        {
          step: 2,
          category: 'Retinoidy & Bunková obnova',
          productName: 'LRP Retinol B3 sérum / SkinCeuticals Retinol 0.3',
          brand: 'La Roche-Posay / SkinCeuticals',
          usage: 'Večer na úplne suchú pleť 2-3x týždenne (postupne podľa tolerancie zvyšovať).',
          purpose: 'Zrýchlenie bunkového obratu, prestavba kolagénu a vyhladenie jemných aj hlbších vrások.',
          price: 39.00,
          standardOption: {
            tier: 'standard',
            tierName: 'Základná starostlivosť',
            productName: 'La Roche-Posay Retinol B3 sérum proti vráskam a nepravidelnému tónu',
            brand: 'La Roche-Posay',
            price: 39.00,
            usage: 'Aplikovať večer 3-4 kvapky na tvár a krk. Následne použiť hydratačný balzam.',
            purpose: 'Kombinácia čistého a postupne uvoľňovaného retinolu s vitamínom B3 (niacínamid) pre šetrnú toleranciu.'
          },
          premiumOption: {
            tier: 'premium',
            tierName: 'Prémiová starostlivosť',
            productName: 'SkinCeuticals Retinol 0.3 čistý zapuzdrený nočný krém (alebo Medik8 Crystal Retinal)',
            brand: 'SkinCeuticals',
            price: 98.00,
            usage: 'Veľkosť hrášku večer na suchú pokožku. Po adaptácii možný prechod na Retinol 0.5.',
            purpose: 'Patentovaný systém enkapsulácie doručuje čistý retinol priamo do dermis bez povrchovej zápalovej reakcie.'
          }
        },
        {
          step: 3,
          category: 'Bariérový & Lipidový krém',
          productName: 'Cicaplast Baume B5+ / SkinCeuticals Triple Lipid Restore 2:4:2',
          brand: 'La Roche-Posay / SkinCeuticals',
          usage: 'Večer po retinole (odstup 15-20 minút) na uzavretie hydratácie a obnovu bariéry.',
          purpose: 'Hĺbková rekonštrukcia intercelulárnych lipidov a prevencia transepidermálnej straty vody.',
          price: 16.50,
          standardOption: {
            tier: 'standard',
            tierName: 'Základná starostlivosť',
            productName: 'La Roche-Posay Cicaplast Baume B5+ ultra-obnovujúci upokojujúci balzam',
            brand: 'La Roche-Posay',
            price: 16.50,
            usage: 'Aplikovať v tenkej vrstve na tvár po retinole, najmä na suchšie zóny.',
            purpose: 'Madecassoside, 5% panthenol a prebiotický komplex Tribioma pre okamžité upokojenie a regeneráciu.'
          },
          premiumOption: {
            tier: 'premium',
            tierName: 'Prémiová starostlivosť',
            productName: 'SkinCeuticals Triple Lipid Restore 2:4:2 patentovaný rekonštrukčný anti-aging krém',
            brand: 'SkinCeuticals',
            price: 155.00,
            usage: 'Zahriať malé množstvo medzi prstami a jemne vtlačiť do pokožky tváre, krku a dekoltu.',
            purpose: 'Zlatý rez lipidov: 2% čisté ceramidy, 4% prírodný cholesterol a 2% mastné kyseliny. Zlepšuje elasticitu o 66%.'
          }
        },
        {
          step: 4,
          category: 'Cielená starostlivosť o očné okolie',
          productName: 'Vichy Liftactiv Eyes / SkinCeuticals A.G.E. Advanced Eye',
          brand: 'Vichy / SkinCeuticals',
          usage: 'Večer jemne vklepať prstenníkom do okolia očných kostí a vejárikov.',
          purpose: 'Prevencia mimických vejárikov, podpora mikrocirkulácie a spevnenie tenkej periorbitálnej kože.',
          price: 29.00,
          standardOption: {
            tier: 'standard',
            tierName: 'Základná starostlivosť',
            productName: 'Vichy Liftactiv H.A. očné sérum proti vráskam a tmavým kruhom',
            brand: 'Vichy',
            price: 29.00,
            usage: '1 kvapku jemne vklepať pod oči a pozdĺž očnicového oblúka.',
            purpose: 'Kyselina hyalurónová, kofeín a peptidy redukujú opuchy a jemné mimické vrásky.'
          },
          premiumOption: {
            tier: 'premium',
            tierName: 'Prémiová starostlivosť',
            productName: 'SkinCeuticals A.G.E. Advanced Eye pokročilý očný krém proti glykácii kolagénu',
            brand: 'SkinCeuticals',
            price: 110.00,
            usage: 'Ráno aj večer nanášať pod oči a pod obočie. Vyhnúť sa pohyblivému viečku.',
            purpose: 'Proxylane a flavonoidy zabraňujú glykácii elastínu (lámaniu vlákien), spevňujú očné okolie a rozjasňujú pohľad.'
          }
        }
      ],
      specialWeeklyCare: [
        'Enzymatický peeling 1x týždenne večer namiesto retinolu pre šetrné odstránenie odumretých buniek.',
        'Hydratačná maska s kyselinou hyalurónovou (Vichy Minéral 89 Booster) po intenzívnych procedúrach.',
        'Vnútorná suplementácia: Bioaktívne kolagénové peptidy a antioxidanty každé ráno do vody.'
      ]
    },
    annualTreatments: [
      {
        id: 'trt-1',
        name: 'Aplikácia Botulotoxínu (Glabela, Čelo, Vrásky okolo očí)',
        category: 'injectable',
        seasonOrMonth: 'Q1 (Január - Február)',
        targetArea: 'Horná tretina tváre',
        frequencyOrSessions: '1 sedenie (opakovať o 4-6 mesiacov)',
        estimatedPrice: 240,
        priority: 'high',
        status: 'planned',
        notes: 'Uvoľnenie hyperkinetických mimických svalov a prevencia fixácie statických vrások.'
      },
      {
        id: 'trt-2',
        name: 'Biostimulácia & Bioremodelácia (Profhilo / Polynukleotidy)',
        category: 'injectable',
        seasonOrMonth: 'Q1 (Marec)',
        targetArea: 'Stredná a dolná tretina tváre + krk',
        frequencyOrSessions: '2 sedenia v odstupe 30 dní',
        estimatedPrice: 320,
        priority: 'high',
        status: 'planned',
        notes: 'Hĺbková hydratácia, stimulácia kolagénu typu I, III a elastínu bez neprirodzeného objemu.'
      },
      {
        id: 'trt-3',
        name: 'Hydratačný Skinbooster / Mezoterapia s antioxidantmi',
        category: 'skin_care',
        seasonOrMonth: 'Q2 (Máj - Jún)',
        targetArea: 'Celá tvár, dekolt',
        frequencyOrSessions: '1 sedenie pred letnou sezónou',
        estimatedPrice: 190,
        priority: 'medium',
        status: 'planned',
        notes: 'Príprava kože na letné UV zaťaženie a intenzívna hydro-rezerva.'
      },
      {
        id: 'trt-4',
        name: 'Aplikácia Botulotoxínu (Pretrvávajúci efekt)',
        category: 'injectable',
        seasonOrMonth: 'Q3 (Júl - August)',
        targetArea: 'Glabela + čelo',
        frequencyOrSessions: '1 udržiavacie sedenie',
        estimatedPrice: 220,
        priority: 'high',
        status: 'planned',
        notes: 'Druhá aplikácia v roku pred dovolenkou – prevencia mračenia sa na slnku.'
      },
      {
        id: 'trt-5',
        name: 'Frakčný CO2 Resurfacing alebo Morpheus8 mikroihličková RF',
        category: 'laser',
        seasonOrMonth: 'Q4 (Október - November)',
        targetArea: 'Tvár a okolie očí',
        frequencyOrSessions: '1 intenzívne sedenie v jesennom období',
        estimatedPrice: 420,
        priority: 'high',
        status: 'planned',
        notes: 'Zbrusenie mikroreliéfu kože, spevnenie dermis, stiahnutie rozšírených pórov.'
      },
      {
        id: 'trt-6',
        name: 'Vaskulárny laser na cievky a jemné začervenanie (V-Beam/IPL)',
        category: 'laser',
        seasonOrMonth: 'Q4 (November - December)',
        targetArea: 'Krídla nosa a líca',
        frequencyOrSessions: '1 sedenie',
        estimatedPrice: 130,
        priority: 'medium',
        status: 'planned',
        notes: 'Zahladenie teleangiektázií a zjednotenie farebného tónu pleti.'
      }
    ],
    preOpCare: {
      procedureName: 'Estetické & Chirurgické zákroky tváre (SAY Care Prehabilitácia)',
      prehabilitation: {
        medicalPrehab: [
          'Interné predoperačné vyšetrenie, KO, koagulácia (INR, APTT) a biochémia pred chirurgickými krokmi.',
          'Vysadenie kyseliny acetylsalicylovej (Aspirín, Acylpyrín), NSAID (Ibuprofen) a Ginkgo biloba 10–14 dní pred zákrokom.',
          'Striktné vynechanie fajčenia a nikotínových vrecúšok min. 4 týždne pred a po chirurgickom výkone (prevencia nekrózy a porúch hojenia).',
          'Profylaxia herpes simplex (Valaciklovir / Aciklovir) 2 dni pred laserovým resurfacingom alebo výkonom v periorálnej zóne.'
        ],
        psychologicalPrep: [
          'Eliminácia chronického stresu a ochrana imunitného hojenia: Chronický distres a psychické vypätie vyplavujú kortizol a katecholamíny, ktoré preukázateľne znižujú tvorbu kolagénu v rane o 20–40 % a potláčajú bunkovú imunitu (Kiecolt-Glaser / Lancet). 1 – 2 týždne pred operáciou uzavrite pracovné stresory a zabezpečte si pokojný mentálny režim.',
          'Mentálna pripravenosť na priebeh a možné komplikácie (Psychological readiness): Hojenie nie je priamka. Oboznámenie sa s fázami hojenia a pripravenosť na bežné prechodné javy (asymetrický opuch, modrinky, tuhosť) aj na zvládnutie prípadných komplikácií (hematóm, predĺžené hojenie) zabraňuje panike, úzkosti a pocitu straty kontroly.',
          'Prevencia pooperačnej emocionálnej lability („Post-Op Blues“): Na 3. až 5. deň po operácii nastáva vplyvom doznievania analgézie, únavy a opuchov prirodzený neuroendokrinný pokles nálady. Vedomá mentálna príprava pomáha pacientovi zvládnuť tento stav s pokojom a bez psychickej traumy.',
          'Nácvik copingových stratégií a relaxácie: Nácvik bránicového dýchania (technika 4-7-8), progresívnej svalovej relaxácie a riadenej vizualizácie hojenia tkanív. Tieto techniky preukázateľne znižujú vnímanie pooperačnej bolesti a znižujú spotrebu analgetík až o 30 % (ERAS® Society Guidelines).'
        ],
        nutritionalPrep: [
          'Zvýšený príjem plnohodnotných bielkovín (1,5 – 2,0 g/kg hmotnosti denne – ryby, hydina, vajcia, strukoviny, srvátkový proteín) ako základného substrátu pre syntézu nového kolagénu.',
          'Cielená suplementácia: Vitamín C (1000 mg/deň), Zinok (20 – 25 mg/deň), hydrolyzované kolagénové peptidy a Bromelaín na rýchlejšie vstrebávanie hematómov.',
          'Intenzívna hydratácia (2,5 l čistej vody denne) a striktná abstinencia od alkoholu min. 7 dní pred zákrokom.'
        ],
        physicalPrep: [
          'Silový odporový tréning veľkých svalových skupín (Resistance Training): Pravidelné posilňovanie nôh a sedacích svalov (drepy, výstupy), chrbta a stredu tela / core 3 – 4x týždenne (Minnella / Carli et al., Annals of Surgery).',
          'Vybudovanie a ochrana svalovej hmoty (Metabolic Anabolic Reserve): Pooperačný kľud a imobilita vyvolávajú akútny katabolizmus (strata až 1 kg svalov za týždeň). Svalová hmota slúži ako kľúčová aminokyselinová rezerva pre imunitný systém a syntézu kolagénu v hojacich sa ranách.',
          'Funkčná sebestačnosť a samostatná mobilizácia: Pevné dolné končatiny a silný core umožňujú po operácii vstávať z lôžka a z kresla výhradne silou nôh, bez nebezpečného zapájania a napínania operovaných oblastí (tváre, krku alebo trupu).',
          'Zvýšenie kardiorespiračnej rezervy a VO2 max: Kombinácia silového tréningu so stredne intenzívnym aeróbnym cvičením (rýchla chôdza) zlepšuje tkanivovú oxygenáciu a chráni pred pooperačnou tromboembóliou (TEN).'
        ]
      },
      instructions: [
        {
          id: 'face-pre-1',
          timeframe: '2-4 týždne pred',
          title: 'Prehabilitácia tkanív & Vysadenie antikoagulancií',
          description: 'Stop nikotínu, vysadenie liekov ovplyvňujúcich zrážanlivosť krvi (ASA, Ibuprofen, Vitamín E). Nasadenie Vitamínu C a zinku.',
          mandatory: true
        },
        {
          id: 'face-pre-home',
          timeframe: '7 dní pred',
          title: 'Príprava domáceho prostredia & odvoz',
          description: 'Zabezpečte si sprievodnú osobu a odvoz z kliniky, pripravte si vyvýšené vankúše na spanie v polosede a chladivé gélové obklady do chladničky.',
          mandatory: false
        },
        {
          id: 'face-pre-2',
          timeframe: '5-7 dní pred',
          title: 'Vysadenie lokálneho retinolu a AHA/BHA kyselín',
          description: 'Pred laserovým alebo chirurgickým zákrokom vysadiť lokálne retinoidy a exfoliačné kyseliny, prejsť na bariérový krém (Cicaplast Baume B5+ / Triple Lipid Restore).',
          mandatory: true
        },
        {
          id: 'face-pre-2',
          timeframe: '5-7 dní pred',
          title: 'Vysadenie lokálneho retinolu a AHA/BHA kyselín',
          description: 'Pred laserovým alebo chirurgickým zákrokom vysadiť lokálne retinoidy a exfoliačné kyseliny, prejsť na bariérový krém (Cicaplast Baume B5+ / Triple Lipid Restore).',
          mandatory: true
        },
        {
          id: 'face-pre-3',
          timeframe: 'Deň zákroku',
          title: 'Príchod s vyčistenou pleťou bez make-upu',
          description: 'Prísť bez líčidiel, šperkov a kontaktných šošoviek. Pri výkone v celkovej anestézii prísť nalačno (od polnoci nejesť a nepiť).',
          mandatory: true
        }
      ]
    },
    postOpCare: {
      procedureName: 'Rejuvenačné, Laserové & Chirurgické výkony tváre (SAY Care)',
      phases: [
        {
          phaseId: 'face-p1',
          period: '1. – 7. deň po zákroku',
          title: 'Akútna regenerácia, Chladenie & Ochrana bariéry',
          focus: 'Minimalizácia edému a hematómov, ochrana reepitelizujúcej sa pokožky a stehov.',
          instructions: [
            'Spánok na chrbte s hlavou vyvýšenou pod uhlom 30–45°.',
            'Pravidelné suché chladenie cez sterilnú gázu, vyhýbanie sa predklonom a fyzickej námahe.',
            'Aplikácia sterilných hojivých balzamov (La Roche-Posay Cicaplast Baume B5+) podľa ordinácie lekára.'
          ],
          warningSigns: ['Náhly jednostranný bolestivý opuch', 'Teplota nad 38 °C', 'Výsev herpetických pľuzgierikov']
        },
        {
          phaseId: 'face-p2',
          period: '2. – 6. týždeň po zákroku',
          title: 'Lymfodrenáž, Starostlivosť o jazvy & Fotoprotekcia',
          focus: 'Odplavenie pooperačného opuchu, tlakové masáže jaziev a prevencia PIH (pigmentácií).',
          instructions: [
            'Odborná manuálna lymfodrenáž tváre a krku na urýchlenie vstrebania opuchov a stvrdlín.',
            'Po vybratí stehov a odpadnutí chrastičiek začať so silikónovým gélom a jemnými tlakovými masážami jaziev.',
            'Každodenná striktná fotoprotekcia SPF 50+ (Anthelios UVMune 400 / SkinCeuticals Ultra Facial Defense).'
          ],
          scarCareGuidelines: [
            'Silikónový gél (Cicaplast Gel B5 / Strataderm) 2x denne v tenkej vrstve.',
            'Jemná bodová tlaková masáž jazvy končekom prsta 3x denne po 5 minút.'
          ],
          recommendedProcedures: [
            'LED biostimulačná fototerapia červeným svetlom (633 nm / 830 nm) na urýchlenie hojenia.',
            'Manuálna tvárová a krčná lymfodrenáž (séria 4–6 ošetrení).'
          ]
        }
      ],
      scarProtocol: {
        siliconeApplication: 'La Roche-Posay Cicaplast Gel B5 / Strataderm silikónový gél 2x denne ráno a večer po dobu 3–6 mesiacov.',
        pressureMassage: 'Bodové pritláčanie vyzretej jazvy (bez trenia kože) na 15 sekúnd do zblednutia lôžka, 3x denne.',
        sunProtection: 'Absolútny zákaz slnenia a solária, každodenná aplikácia SPF 50+ (Mexoryl 400 / minerálne filtre) po dobu 12 mesiacov.',
        lymphaticDrainage: 'Manuálna lymfodrenáž tváre, podbradku a krčných uzlín od 10.–14. dňa po zákroku (2x týždenne) + nosenie kompresívnej tvárovej ohlávky pri facelifte/liposukcii podbradku.',
        laserTherapy: 'Biostimulačné LED svetlo od 2. dňa po zákroku; cievny laser (V-Beam / IPL) od 6. týždňa pri erytéme jazvy; frakčný CO2 laser od 3. mesiaca na finálne vyhladenie textúry.',
        advancedScarTherapies: [
          'Biostimulačná LED terapia (okamžitá podpora hojenia a redukcia opuchu)',
          'Vaskulárny laser na cievne začervenanie jazvy (od 6. týždňa)',
          'Frakčný CO2 resurfacing a aplikácia polynukleotidov / exozómov do jazvy (od 3. mesiaca)'
        ]
      }
    },
    doctorNote: 'Plán spája 3 piliere: 1. SAY Skincare (Meicet 3D + duálna starostlivosť), 2. Ročný sekvenčný plán ošetrení a 3. SAY Care (komplexnú predoperačnú prehabilitáciu a pooperačný protokol).'
  },

  face_sequential_transformation: {
    title: 'Ročný plán pacienta (3-v-1)',
    planType: 'combined',
    diagnosisOrGoal: '',
    analysisSummary: {
      skinType: 'Zrelá pleť, znížená elasticita a fotopoškodenie',
      skinTonePhototype: 'Fitzpatrick II',
      mainConcerns: ['Pokles kontúr dolnej tretiny tváre a krku (jowls)', 'Previs horných viečok a tukové prolapsy dolných viečok', 'Periorálne a elastotické vrásky pleti'],
      vectorZones: ['SMAS & Hlboké štruktúry tváre a krku', 'Horné a dolné viečka', 'Celá tvár – epidermálny resurfacing']
    },
    cosmeticsRoutine: {
      activeTier: 'both',
      morning: [
        {
          step: 1,
          category: 'Čistenie',
          productName: 'CeraVe Hydratačná čistiaca emulzia / SkinCeuticals Simply Clean',
          brand: 'CeraVe / SkinCeuticals',
          usage: 'Ráno jemne vmasírovať na vlhkú tvár a krk, opláchnuť vlažnou vodou.',
          purpose: 'Šetrné čistenie bez narušenia hydrolipidového plášťa.',
          price: 14.50,
          standardOption: {
            tier: 'standard',
            tierName: 'Základná starostlivosť',
            productName: 'CeraVe Hydratačná čistiaca emulzia (Hydrating Cleanser)',
            brand: 'CeraVe',
            price: 14.50,
            usage: 'Ráno na vlhkú pokožku, jemne opláchnuť.',
            purpose: 'Ceramidy a kyselina hyalurónová chránia bariéru pred aj po zákrokoch.'
          },
          premiumOption: {
            tier: 'premium',
            tierName: 'Prémiová starostlivosť',
            productName: 'SkinCeuticals Soothing Cleanser upokojujúca čistiaca pena',
            brand: 'SkinCeuticals',
            price: 46.00,
            usage: '2 pumpy peny jemne naniesť na tvár a krk.',
            purpose: 'Špeciálne vyvinutá pena s orchideou a uhorkou pre pleť v chirurgickej a laserovej rekonvalescencii.'
          }
        },
        {
          step: 2,
          category: 'Antioxidant & Kolagén',
          productName: 'Vichy Liftactiv 15% Vit C / SkinCeuticals C E Ferulic',
          brand: 'Vichy / SkinCeuticals',
          usage: '4–5 kvapiek ráno na suchú vyčistenú pleť.',
          purpose: 'Maximálna podpora syntézy kolagénu a ochrana pred oxidačným stresom.',
          price: 38.00,
          standardOption: {
            tier: 'standard',
            tierName: 'Základná starostlivosť',
            productName: 'Vichy Liftactiv Supreme 15% čistý Vitamín C rozjasňujúce sérum',
            brand: 'Vichy',
            price: 38.00,
            usage: '4–5 kvapiek ráno na tvár a krk.',
            purpose: '15% kyselina L-askorbová na podporu hojenia a rozjasnenie.'
          },
          premiumOption: {
            tier: 'premium',
            tierName: 'Prémiová starostlivosť',
            productName: 'SkinCeuticals C E Ferulic patentované antioxidačné sérum',
            brand: 'SkinCeuticals',
            price: 175.00,
            usage: '4–5 kvapiek ráno. Ideálne pred aj po laserovom resurfacingu.',
            purpose: 'Zlatý štandard (15% Vit C + 1% Vit E + 0.5% kys. ferulová) – skracuje erytém po laseri a chráni novotvorený kolagén.'
          }
        },
        {
          step: 3,
          category: 'SPF 50+ Fotoprotekcia',
          productName: 'La Roche-Posay Anthelios UVMune 400 / SkinCeuticals Ultra Facial Defense SPF 50+',
          brand: 'La Roche-Posay / SkinCeuticals',
          usage: 'Každé ráno na celú tvár, okolie očí, uši a krk (vrátane jaziev).',
          purpose: 'Prevencia pooperačnej a polaserovej hyperpigmentácie.',
          price: 21.50,
          standardOption: {
            tier: 'standard',
            tierName: 'Základná starostlivosť',
            productName: 'La Roche-Posay Anthelios UVMune 400 Invisible Fluid SPF 50+',
            brand: 'La Roche-Posay',
            price: 21.50,
            usage: 'Ráno ako finálny krok pred odchodom z domu.',
            purpose: 'Mexoryl 400 filter proti ultra-dlhým UVA lúčom.'
          },
          premiumOption: {
            tier: 'premium',
            tierName: 'Prémiová starostlivosť',
            productName: 'SkinCeuticals Ultra Facial Defense SPF 50+ fotoprotekčný krém',
            brand: 'SkinCeuticals',
            price: 44.00,
            usage: 'Ráno rovnomerne na tvár, krk a dekolt.',
            purpose: 'Širokospektrálna UV ochrana s hydratačným komfortom pre zrelú pleť.'
          }
        }
      ],
      evening: [
        {
          step: 1,
          category: 'Rekonštrukcia lipidov & Bariéra',
          productName: 'La Roche-Posay Cicaplast Baume B5+ / SkinCeuticals Triple Lipid Restore 2:4:2',
          brand: 'La Roche-Posay / SkinCeuticals',
          usage: 'Každý večer na vyčistenú pleť tváre a krku.',
          purpose: 'Intenzívna obnova kožnej bariéry medzi jednotlivými etapami zákrokov.',
          price: 17.50,
          standardOption: {
            tier: 'standard',
            tierName: 'Základná starostlivosť',
            productName: 'La Roche-Posay Cicaplast Baume B5+ Ultra-Regeneračný balzam',
            brand: 'La Roche-Posay',
            price: 17.50,
            usage: 'Večer na tvár, krk a hojace sa línie.',
            purpose: '5% pantenol, madecassoside a prebiotický komplex Tribioma.'
          },
          premiumOption: {
            tier: 'premium',
            tierName: 'Prémiová starostlivosť',
            productName: 'SkinCeuticals Triple Lipid Restore 2:4:2 rekonštrukčný krém',
            brand: 'SkinCeuticals',
            price: 155.00,
            usage: 'Večer vmasírovať do pleti tváre a krku.',
            purpose: 'Patentovaný pomer 2% ceramidov, 4% cholesterolu a 2% mastných kyselín pre špičkovú pružnosť pleti.'
          }
        },
        {
          step: 2,
          category: 'Starostlivosť o jazvy & Očné okolie',
          productName: 'La Roche-Posay Cicaplast Gel B5 / SkinCeuticals A.G.E. Advanced Eye',
          brand: 'La Roche-Posay / SkinCeuticals',
          usage: 'Cielená aplikácia na preaurikulárne jazvy, viečka a očné okolie.',
          purpose: 'Neviditeľné zhojenie jaziev po facelifte a blefaroplastike.',
          price: 13.50,
          standardOption: {
            tier: 'standard',
            tierName: 'Základná starostlivosť',
            productName: 'La Roche-Posay Cicaplast Gel B5 Pro-Recovery Masážny gél na jazvy',
            brand: 'La Roche-Posay',
            price: 13.50,
            usage: 'Večer jemná tlaková masáž jaziev po vybratí stehov.',
            purpose: 'Silikónová ochranná textúra s pantenolom pre hladké zjazvenie.'
          },
          premiumOption: {
            tier: 'premium',
            tierName: 'Prémiová starostlivosť',
            productName: 'SkinCeuticals A.G.E. Advanced Eye pokročilý očný krém',
            brand: 'SkinCeuticals',
            price: 110.00,
            usage: 'Jemne vklepať do periorbitálnej oblasti.',
            purpose: 'Spevnenie očného okolia a prevencia glykácie kolagénových vlákien.'
          }
        }
      ],
      specialWeeklyCare: [
        'Séria 6 manuálnych lymfodrenáží tváre a krku po 1. a 2. etape chirurgického plánu.',
        'Vysokoproteínová výživa + kolagénové peptidy + Vitamín C počas celého 12-mesačného programu.'
      ]
    },
    annualTreatments: [
      {
        id: 'seq-1',
        stepOrder: 1,
        name: 'ETAPA 1: Deep Plane Facelift & Necklift (Chirurgický lifting tváre a krku)',
        category: 'surgery',
        seasonOrMonth: '1. Krok – Október (Jeseň)',
        targetArea: 'Stredná a dolná tretina tváre, SMAS, krk',
        frequencyOrSessions: 'Hlavný operačný výkon (celková anestézia)',
        estimatedPrice: 4800,
        priority: 'high',
        status: 'planned',
        notes: 'Základná štrukturálna repozícia hlbokých tkanív tváre a krku. Odporúčaný odstup pred ďalšou etapou: 8–12 týždňov.'
      },
      {
        id: 'seq-2',
        stepOrder: 2,
        name: 'ETAPA 2: Horná & Dolná Blefaroplastika (Korekcia očných viečok)',
        category: 'surgery',
        seasonOrMonth: '2. Krok – Január (+3 mesiace)',
        targetArea: 'Horné a dolné očné viečka',
        frequencyOrSessions: '1 zákrok (lokálna anestézia / analgosedácia)',
        estimatedPrice: 1650,
        priority: 'high',
        status: 'planned',
        notes: 'Omladenie pohľadu po usadení strednej tretiny tváre po facelifte. Odstránenie kožného nadbytku a tukových prolapsov.'
      },
      {
        id: 'seq-3',
        stepOrder: 3,
        name: 'ETAPA 3: Frakčný CO2 Laserový Resurfacing & Cievny laser jaziev',
        category: 'laser',
        seasonOrMonth: '3. Krok – Marec (+5 mesiacov)',
        targetArea: 'Celá tvár, periorálna oblasť a jazvy',
        frequencyOrSessions: '1 intenzívne laserové sedenie',
        estimatedPrice: 550,
        priority: 'high',
        status: 'planned',
        notes: 'Finálne zjednotenie textúry kože, vyhladenie jemných vrások nad hornou perou a remodelácia pooperačných jaziev.'
      },
      {
        id: 'seq-4',
        stepOrder: 4,
        name: 'ETAPA 4: Botulotoxín (Glabela & Čelo) + Polynukleotidy / Skinbooster',
        category: 'injectable',
        seasonOrMonth: '4. Krok – Jún (+8 mesiacov)',
        targetArea: 'Horná tretina tváre & Dermis',
        frequencyOrSessions: '1 kombinované ambulantné ošetrenie',
        estimatedPrice: 490,
        priority: 'medium',
        status: 'planned',
        notes: 'Udržanie hladkého čela a hĺbková biorevitalizácia pleti pred letnou sezónou.'
      }
    ],
    preOpCare: {
      procedureName: 'Komplexná starostlivosť a plánované výkony',
      prehabilitation: {
        medicalPrehab: [
          'Kompletné interné a anestéziologické predoperačné vyšetrenie (KO, hemokoagulácia, biochémia, EKG).',
          'Prísny zákaz fajčenia a všetkých foriem nikotínu minimálne 4–6 týždňov pred faceliftom (kľúčové pre prekrvenie kožných lalokov!).',
          'Vysadenie ASA, Ibuprofénu, Warfarínu/NOAK (po konzultácii s internistom), vitamínu E a Ginkgo biloba 14 dní pred zákrokom.'
        ],
        psychologicalPrep: [
          'Eliminácia chronického distresu a psychickej záťaže: Chronický stres vyplavuje kortizol, ktorý potláča syntézu kolagénu v rane o 20–40 % a oslabuje bunkovú imunitu (Kiecolt-Glaser / Lancet). 1 – 2 týždne pred operáciou uzavrite náročné pracovné projekty a vyhnite sa emocionálnemu vypätiu.',
          'Mentálna pripravenosť na priebeh a možné komplikácie (Psychological readiness): Hojenie tváre vyžaduje trpezlivosť. Pripravenosť na prechodné javy (asymetrický edém, napätie SMAS, podliatiny viečok) aj na zvládnutie prípadných komplikácií chráni pred úzkosťou a panikou.',
          'Prevencia pooperačnej emocionálnej lability („Post-Op Blues“): Na 3. až 5. deň po facelifte nastáva prirodzený neuroendokrinný pokles nálady. Vedomá mentálna príprava pomáha tento stav prekonať s pokojom a istotou.',
          'Nácvik copingových techník a relaxácie: Tréning bránicového dýchania (4-7-8) a Jacobsonovej progresívnej svalovej relaxácie na zníženie perioperačného tlaku a vnímania pooperačnej bolesti.'
        ],
        nutritionalPrep: [
          'Vysokobielkovinová strava (1,5 – 2,0 g/kg/deň) + hydrolyzované kolagénové peptidy (10 g denne) ako substrát pre pevné hojenie SMAS vrstvy a kože.',
          'Suplementácia podľa EBM: Vitamín C 1000 mg, Zinok 25 mg, Bromelaín + Arnika Montana (prevencia hematómov a urýchlenie resorpcie edému).',
          'Obmedzenie soli (sodíka) v strave 7 dní pred operáciou na minimalizáciu pooperačného zadržiavania tekutín a opuchu tváre.'
        ],
        physicalPrep: [
          'Silový odporový tréning veľkých svalových skupín (Resistance Training): Systematické posilňovanie nôh (drepy, výstupy) a chrbtového svalstva 3 – 4x týždenne (Minnella / Carli et al., Annals of Surgery).',
          'Vybudovanie a ochrana svalovej hmoty (Metabolic Anabolic Reserve): Svaly tvoria zásadnú metabolickú aminokyselinovú rezervu proti akútnemu pooperačnému katabolizmu počas kľudu na lôžku.',
          'Funkčná sebestačnosť a samostatná mobilizácia: Pevné nohy a stabilný stred tela (core) umožňujú po facelifte a viečkach vstávať z lôžka výlučne silou nôh, bez predkláňania hlavy a bez napínania šijových a tvárových svalov.',
          'Zvýšenie kardiorespiračnej rezervy (VO2 max): Aeróbna chôdza na stimuláciu mikrocirkulácie, tkanivovej oxygenácie a prevenciu tromboembólie.'
        ]
      },
      instructions: [
        {
          id: 'seq-pre-1',
          timeframe: '4-6 týždňov pred',
          title: 'Absolútny zákaz nikotínu a fajčenia',
          description: 'Kritická podmienka pre bezpečné zhojenie faceliftu bez rizika nekrózy kožného laloka za uchom.',
          mandatory: true
        },
        {
          id: 'seq-pre-2',
          timeframe: '14 dní pred',
          title: 'Predoperačné interné vyšetrenie & Vysadenie ASA/NSAID',
          description: 'Kompletné laboratórne odbery + EKG. Vysadiť lieky riediace krv a znížiť príjem soli v strave.',
          mandatory: true
        },
        {
          id: 'seq-pre-home',
          timeframe: '7 dní pred',
          title: 'Príprava domácnosti a odvozu',
          description: 'Zabezpečiť odvoz z kliniky a sprievodnú osobu, pripraviť vyvýšené vankúše na spanie v polosede a voľné oblečenie na zapínanie vpredu.',
          mandatory: false
        },
        {
          id: 'seq-pre-3',
          timeframe: 'Deň operácie',
          title: 'Príchod nalačno, bez šperkov a s umytými vlasmi',
          description: 'Ráno umyť vlasy dezinfekčným/šetrným šampónom, nepoužívať tužidlá ani krémy. Od polnoci nejesť a nepiť.',
          mandatory: true
        }
      ]
    },
    postOpCare: {
      procedureName: 'Facelift, Blefaroplastika & Frakčný Laser',
      phases: [
        {
          phaseId: 'seq-post-1',
          period: '1. – 14. deň po operácii',
          title: 'Kompresívna ohlávka, Chladenie & Vybratie stehov',
          focus: 'Stabilizácia tkanív, prevencia hematómu a primárne zhojenie rezov.',
          instructions: [
            'Nosenie kompresívnej tvárovej ohlávky 24/7 počas prvých 7–10 dní, následne na noc.',
            'Spánok výhradne na chrbte so zvýšenou hlavou, zákaz predkláňania a otáčania celej hlavy (otáčať sa celým trupom).',
            'Vybratie stehov na 7. deň (viečka a pred uchom) a 12.–14. deň (za uchom a vo vlasatej časti).'
          ],
          warningSigns: ['Jednostranný prudký opuch a bolesť na jednej strane tváre', 'Krvácanie z rany', 'Zhoršenie vízu po operácii viečok']
        },
        {
          phaseId: 'seq-post-2',
          period: '2. – 8. týždeň po operácii',
          title: 'Lymfodrenáže, Tlakové masáže jaziev & Silikónový protokol',
          focus: 'Rýchle vstrebanie opuchu, uvoľnenie stvrdnutých podkožných miest a neviditeľné jazvy.',
          instructions: [
            'Odborná manuálna lymfodrenáž tváre a krku 2x týždenne (od 14. dňa).',
            'Aplikácia silikónového gélu (Cicaplast Gel B5 / Strataderm) a tlakové masáže preaurikulárnych a retroaurikulárnych jaziev.',
            'Striktná ochrana SPF 50+ a slnečné okuliare UV400.'
          ]
        }
      ],
      scarProtocol: {
        siliconeApplication: 'Silikónový gél (La Roche-Posay Cicaplast Gel B5 / Strataderm) 2x denne na jazvy pred a za uchom a na viečkach po dobu 3–6 mesiacov.',
        pressureMassage: 'Od 18. dňa jemná bodová tlaková masáž jaziev pred a za uchom 3x denne po dobu 5–10 minút.',
        sunProtection: 'Striktný SPF 50+ (Anthelios UVMune 400 / SkinCeuticals) + klobúk a UV400 okuliare po dobu 12 mesiacov.',
        lymphaticDrainage: 'Kompresívna ohlávka Lipoelastic 24/7 prvých 10 dní (potom 2 týždne na noc) + séria 6–8 odborných manuálnych lymfodrenáží tváre a krku od 2. týždňa.',
        laserTherapy: 'Biostimulačné LED svetlo po každej etape; v 3. etape (po 3–5 mesiacoch) cievny laser + frakčný CO2 laser na kompletné vyhladenie pleti a jaziev.',
        advancedScarTherapies: [
          'Manuálna a prístrojová lymfodrenáž tváre a krku (od 14. dňa)',
          'LED fotobiomodulácia červeným a NIR svetlom',
          'Vaskulárny laser a Frakčný CO2 resurfacing jaziev a pleti'
        ]
      }
    },
    doctorNote: 'Etapovitý plán umožňuje dosiahnuť maximálny chirurgický aj dermatologický efekt s bezpečným časom na regeneráciu medzi jednotlivými krokmi.'
  },

  breast_surgery_care: {
    title: 'Pred a pooperačný plán: Augmentácia prsníkov & Starostlivosť o jazvy',
    planType: 'pre_post_op',
    diagnosisOrGoal: 'Plánovaná augmentácia prsníkov silikónovými implantátmi, príprava tkanív na operáciu, bezproblémové hojenie a minimalizácia pooperačných jaziev.',
    preOpCare: {
      procedureName: 'Augmentácia prsníkov silikónovými implantátmi',
      prehabilitation: {
        medicalPrehab: [
          'Kompletné interné predoperačné vyšetrenie, EKG, KO, hemokoagulácia (INR, APTT), biochémia a USG/MMG prsníkov.',
          'Vysadenie kyseliny acetylsalicylovej (Aspirín, Acylpyrín), Ibuprofénu, Ginkgo biloba a vysokých dávok Vitamínu E 14 dní pred zákrokom.',
          'Striktné vynechanie fajčenia a nikotínu min. 4 týždne pred a 4 týždne po operácii (prevencia kapsulárnej kontraktúry a nekrózy).'
        ],
        psychologicalPrep: [
          'Mentálna pripravenosť na pooperačné pocity tlaku a svalovej adaptácie: Pripravenosť na dočasný pocit tlaku na hrudníku (podobný svalovici) pri submuskulárnom uložení implantátu. Pokojné chápanie procesu klesania a zmäkčovania implantátov („drop and fluff“) počas prvých 3 mesiacov.',
          'Eliminácia perioperačného distresu: Zníženie hladiny kortizolu a úzkosti pre ochranu imunity a nekomplikované vhojenie implantátov bez nadmernej zápalovej reakcie.',
          'Pripravenosť na priebeh a možné komplikácie: Oboznámenie sa s bežným priebehom aj s postupom pri komplikáciách (hematóm, seróm, prechodná asymetria opuchu) eliminuje paniku a psychickú traumu.',
          'Nácvik bránicového dýchania a relaxácie: Pomáha uvoľniť spazmy prsného a medzirebrového svalstva po vložení implantátu a výrazne znižuje vnímanie pooperačnej bolesti.'
        ],
        nutritionalPrep: [
          'Zvýšený príjem plnohodnotných bielkovín (1,5 – 2,0 g/kg/deň) a kolagénových peptidov pre optimálne vhojenie fibromuskulárnej kapsuly okolo implantátu.',
          'Cielená suplementácia: Vitamín C (1000 mg/deň), Zinok (25 mg/deň), Bromelaín a Arnika na zmiernenie pooperačného opuchu a hematómov.',
          'Hydratácia (min. 2,5 l vody denne) a vynechanie alkoholu 14 dní pred operáciou.'
        ],
        physicalPrep: [
          'Silový odporový tréning dolných končatín a stredu tela (drepy, mostíky, výstupy): Pacientka sa musí vedieť po operácii samostatne postaviť a ľahnúť si výlučne silou nôh a brucha, bez akéhokoľvek opierania sa o ruky či napínania prsných svalov počas prvých 4 týždňov.',
          'Vybudovanie a ochrana svalovej hmoty veľkých svalových partií: Svalstvo nôh a chrbta vytvára anabolickú metabolickú rezervu aminokyselín proti pooperačnému katabolizmu.',
          'Aeróbna kardio kondícia (rýchla chôdza): Zvyšuje kardiorespiračnú rezervu a slúži ako kľúčová prevencia tromboembólie (TEN).',
          'Vynechanie intenzívneho cvičenia prsných svalov a ramien 1 týždeň pred operáciou pre pokojné svalové lôžko.'
        ]
      },
      instructions: [
        {
          id: 'pre-1',
          timeframe: '4-6 týždňov pred',
          title: 'Zákaz fajčenia a nikotínových produktov',
          description: 'Nikotín spôsobuje vazokonstrikciu mikrocirkulácie, čo drasticky zhoršuje hojenie rán a zvyšuje riziko infekcie a nekrózy tkaniva. Striktný zákaz aspoň 4 týždne pred a 4 týždne po.',
          mandatory: true
        },
        {
          id: 'pre-home',
          timeframe: '7 dní pred',
          title: 'Príprava domácnosti a voľného oblečenia',
          description: 'Presuňte predmety dennej potreby do výšky pása (zákaz dvíhania rúk nad hlavu po operácii), zabezpečte si odvoz z kliniky a voľné oblečenie so zapínaním vpredu.',
          mandatory: false
        },
        {
          id: 'pre-2',
          timeframe: '2-3 týždne pred',
          title: 'Vysadenie liekov na riedenie krvi a bylín',
          description: 'Vysadiť Acylpyrín, Aspirín, Ibuprofen, Diclofenac, Ginkgo Biloba, vysoké dávky vitamínu E a Omega-3 (zvyšujú krvácavosť). Pri bolesti užívať len Paracetamol.',
          mandatory: true
        },
        {
          id: 'pre-3',
          timeframe: '2-3 týždne pred',
          title: 'Nutričná podpora syntézy kolagénu',
          description: 'Doplniť Vitamín C 1000 mg/deň, Zinok 25 mg/deň a kvalitné kolagénové peptidy na posilnenie elasticity kože.',
          mandatory: false
        },
        {
          id: 'pre-4',
          timeframe: '10-14 dní pred',
          title: 'Kompletné predoperačné vyšetrenie + USG prsníkov',
          description: 'Interné predoperačné vyšetrenie, EKG, krvný obraz, koagulačné parametre (INR, APTT), biochémia, moč. USG (sonografia) alebo mamografia prsníkov nie staršia ako 6 mesiacov.',
          mandatory: true
        },
        {
          id: 'pre-5',
          timeframe: 'Deň pred zákrokom',
          title: 'Režim a hygiena pred operáciou',
          description: 'Ľahká večera do 18:00. Dôkladná sprcha antibakteriálnym mydlom. Nenanášať žiadne telové mlieka, dezodoranty ani parfumy.',
          mandatory: true
        },
        {
          id: 'pre-6',
          timeframe: 'Deň operácie',
          title: 'Príchod na kliniku nalačno',
          description: 'Od polnoci NEJESŤ, NEPIŤ, NEFAJČIŤ, NEŽUVAŤ ŽUVAČKY. Prísť bez make-upu, šperkov, umelých nechtov/laku. Voľné oblečenie na zips/gombíky vpredu.',
          mandatory: true
        }
      ]
    },
    postOpCare: {
      procedureName: 'Augmentácia prsníkov',
      phases: [
        {
          phaseId: 'phase-1',
          period: '1. – 7. deň po operácii',
          title: 'Akútna rekonvalescencia & Kľudový režim',
          focus: 'Prevencia hematómu, tlmenie bolesti, udržanie implantátov v anatomickej pozícii.',
          instructions: [
            'Nosenie špeciálnej kompresívnej podprsenky Lipoelastic a stabilizačného pásu 24 hodín denne (dole iba na rýchlu sprchu po povolení lekárom).',
            'Spánok výhradne na chrbte v polosede (uhol 30-45°).',
            'Zákaz dvíhania rúk nad úroveň ramien a dvíhania bremien nad 2 kg.',
            'Užívanie predpísaných analgetík a antibiotík podľa presného rozpisu lekára.',
            'Krytie na ranách ponechať suché a čisté, nepreliepať bez indikácie.'
          ],
          warningSigns: ['Náhly jednostranný asymetrický opuch a stuhnutie prsníka (podozrenie na hematóm)', 'Teplota nad 38°C', 'Presakovanie čerstvej krvi cez obväz']
        },
        {
          phaseId: 'phase-2',
          period: '7. – 14. deň po operácii',
          title: 'Kontrola u chirurga & Odstránenie stehov',
          focus: 'Kontrola hojenia rany, vybratie nevstrebateľných stehov, prechod na bežnú hygienu.',
          instructions: [
            'Ambulantná pooperačná kontrola u MUDr. Jána Mráza, preväz a vybratie stehov.',
            'Po vybratí stehov je možné ranky jemne sprchovať čistou vlažnou vodou, jemne vysušiť sterilným gázovým štvorcom.',
            'Naďalej nosiť kompresívnu podprsenku 24/7 bez výnimky.'
          ],
          scarCareGuidelines: [
            'Počkajte na úplné uzavretie rany a odpadnutie prípadných chrastičiek (cca 14. deň).',
            'Zatiaľ na ranu nenanášajte žiadne krémy ani oleje, kým nie je pokožka zhojená.'
          ]
        },
        {
          phaseId: 'phase-3',
          period: '2. – 12. týždeň po operácii',
          title: 'Zlatý štandard starostlivosti o jazvy',
          focus: 'Prevencia hypertrofie jazvy, zjemnenie a zblednutie jazvy, prevencia pigmentácie.',
          instructions: [
            'Od 4. týždňa možný pozvoľný návrat k ľahkej chôdzi a nenáročným aktivitám.',
            'Od 6. týždňa prechod na nosenie kompresívnej podprsenky len na noc (alebo podľa pokynu lekára).',
            'Striktný zákaz posilňovania prsných svalov a ťažkého športu minimálne 8-12 týždňov.'
          ],
          scarCareGuidelines: [
            'SILIKÓNOVÝ GÉL / NÁPLASTI (Strataderm / Lipoelastic): Aplikovať 2x denne v tenučkej vrstve po dobu minimálne 3 až 6 mesiacov. Silikón udržiava optimálnu hydratáciu tkaniva a normalizuje syntézu kolagénu.',
            'TLAKOVÁ MASÁŽ JAZVY: 2-3 týždne po vybratí stehov začať tlakové masáže. Palcom zatlačiť kolmo na jazvu na 15-20 sekúnd tak silno, aby lôžko odkrvilo a zbledlo, potom povoliť. Postupovať bod po bode pozdĺž celej jazvy 3x denne po dobu 5-10 minút. Nikdy netrieť!',
            'SPF 50+ MINERÁLNA OCHRANA: Jazva nesmie prísť do kontaktu so slnkom ani soláriom minimálne 12 mesiacov. Pri pobyte na slnku natierať minerálny SPF 50+ blokátor, inak jazva trvalo stmavne (post-zápalová hyperpigmentácia).'
          ],
          recommendedProcedures: [
            'Lymfatická drenáž horných končatín a hrudníka na urýchlenie vstrebávania tekutín.',
            'LED terapia červeným svetlom na podporu bunkovej regenerácie.'
          ]
        },
        {
          phaseId: 'phase-4',
          period: '3. – 12. mesiac po operácii',
          title: 'Finálna remodelácia & Následné estetické procedúry',
          focus: 'Dokonalý kozmetický výsledok, optimálna mäkkosť implantátu a neviditeľná jazva.',
          instructions: [
            'Návrat ku všetkým športovým aktivitám vrátane behu, plávania a fitness.',
            'Pravidelné ročné USG kontroly prsníkov.',
            'Pretrvávajúca ochrana jaziev pred UV žiarením.'
          ],
          recommendedProcedures: [
            'VASKULÁRNY LASER (od 6.-8. týždňa): Ak je jazva pretrvávajúco červená, laser cielene zataví rozšírené kapiláry a zosvetlí jazvu do farby okolitej kože.',
            'FRAKČNÝ CO2 LASER / RESURFACING (od 3. mesiaca): Zbrusuje a vyhladzuje reliéf jazvy, aby bola v jednej rovine s okolitou kožou.',
            'MIKROHLIČKOVANIE (MICRONEEDLING) S POLYDEOXYRIBONUKLEOTIDMI (PDRN): Podpora elasticity a pružnosti tkaniva jazvy.'
          ]
        }
      ],
      scarProtocol: {
        siliconeApplication: 'Strataderm / Kelo-cote silikónový gél 2x denne v tenkej vrstve ráno a večer, alebo silikónové krytie Lipoelastic nalepené 12-24h denne po dobu min. 6 mesiacov.',
        pressureMassage: 'Tlak palcom kolmo na jazvu (15-20 s podržať do zblednutia) 3-4x denne po dobu 10 minút. Nesmie sa masírovať trením.',
        sunProtection: 'Striktná ochrana pred UV žiarením (SPF 50+ minerálny krém) počas 1 celého roka od operácie.',
        lymphaticDrainage: 'Kompresívna podprsenka Lipoelastic + stabilizačný pás 24/7 po dobu 6 týždňov + manuálna lymfodrenáž horných končatín a hrudníka od 3. týždňa.',
        laserTherapy: 'Biostimulačná LED fototerapia červeným svetlom na podporu hojenia; cievny laser od 8. týždňa pri začervenaní jazvy; frakčný CO2 laser od 3. mesiaca.',
        advancedScarTherapies: [
          'Vaskulárny laser na redukciu začervenania (od 2. mesiaca)',
          'Frakčný CO2 laser na vyhladenie vystúpenej jazvy (od 3. mesiaca)',
          'Aplikácia kortikoidov intralézionálne (len v prípade hypertrofie alebo keloidu po konzultácii)'
        ]
      }
    },
    cosmeticsRoutine: {
      morning: [
        {
          step: 1,
          category: 'Čistenie',
          productName: 'CeraVe Hydratačný čistiaci gél (Hydrating Cleanser)',
          brand: 'CeraVe',
          usage: 'Vlažná sprcha, šetrné omytie tela a okolia operačnej rany.',
          purpose: 'Jemná hygiena s ceramidmi bez narušenia kožnej bariéry.',
          price: 14.50
        },
        {
          step: 2,
          category: 'Starostlivosť o modriny a opuchy',
          productName: 'Cicaplast Baume B5+ Ultra-Regeneračný balzam',
          brand: 'La Roche-Posay',
          usage: 'Nanášať na oblasť hematómov a pooperačných opuchov okolo prsníkov (nie do otvorenej rany).',
          purpose: 'Madecassoside, pantenol a zinok pre rýchle upokojenie a resorpciu pooperačných edémov.',
          price: 17.50
        },
        {
          step: 3,
          category: 'Starostlivosť o jazvy',
          productName: 'Cicaplast Gel B5 Pro-Recovery Masážny gél na jazvy',
          brand: 'La Roche-Posay',
          usage: 'Po zhojení rany (od 14. dňa) tenká vrstva na jazvu, jemná tlaková masáž.',
          purpose: 'Ochranná silikónová textúra s 5% pantenolom a kyselinou hyalurónovou proti hypertrofii.',
          price: 13.50
        }
      ],
      evening: [
        {
          step: 1,
          category: 'Hydratácia tela',
          productName: 'Lipikar Baume AP+M Trojitý relipidačný balzam',
          brand: 'La Roche-Posay',
          usage: 'Natierať pokožku prsníkov a dekoltu pre zlepšenie elasticity namáhanej kože po vložení implantátov.',
          purpose: 'Intenzívna obnova lipidov a prevencia vzniku strií pri napnutí tkaniva.',
          price: 24.50
        },
        {
          step: 2,
          category: 'Bariérové hojenie',
          productName: 'Cicaplast Baume B5+ Ultra-Regeneračný balzam',
          brand: 'La Roche-Posay',
          usage: 'Aplikácia večer na citlivé a napnuté miesta v okolí rezu.',
          purpose: 'Prebiotický komplex Tribioma a madecassoside pre urýchlenie hojenia tkanív.',
          price: 17.50
        }
      ],
      specialWeeklyCare: [
        'Užívanie hydrolyzovaných kolagénových peptidov 10 000 mg + Vitamín C počas 3 mesiacov pre pevnosť a elastické hojenie.',
        'Lipoelastic kompresívny pás a podprsenka nosené poctivo podľa protokolu kliniky.'
      ]
    },
    annualTreatments: [
      {
        id: 'trt-b1',
        name: 'Pooperačná kontrola č. 1 (Previez rany, kontrola drenáže/kompresie)',
        category: 'surgery',
        seasonOrMonth: '+2 až +3 dni po operácii',
        targetArea: 'Prsníky',
        frequencyOrSessions: '1 kontrola',
        estimatedPrice: 0,
        priority: 'high',
        status: 'planned',
        notes: 'Kontrola symetrie, absencia hematómu, preväz.'
      },
      {
        id: 'trt-b2',
        name: 'Pooperačná kontrola č. 2 (Odstránenie stehov)',
        category: 'surgery',
        seasonOrMonth: '+12 až +14 dní po operácii',
        targetArea: 'Jazvy v podprsníkovej ryhe',
        frequencyOrSessions: '1 kontrola',
        estimatedPrice: 0,
        priority: 'high',
        status: 'planned',
        notes: 'Vybratie stehov, inštruktáž k tlakovým masážam a silikónovým gélom.'
      },
      {
        id: 'trt-b3',
        name: 'Lymfodrenáže hrudníka a chrbta (Zmiernenie opuchu a bolesti chrbta)',
        category: 'rehab',
        seasonOrMonth: '3. – 6. týždeň po operácii',
        targetArea: 'Horná polovica tela',
        frequencyOrSessions: '4 sedenia',
        estimatedPrice: 180,
        priority: 'medium',
        status: 'planned',
        notes: 'Uvoľnenie svalstva chrbta z polohy na chrbte a urýchlenie odpuchnutia.'
      },
      {
        id: 'trt-b4',
        name: 'Pooperačná kontrola č. 3 (Kontrola usadenia implantátov a stavu jaziev)',
        category: 'surgery',
        seasonOrMonth: '+6 týždňov po operácii',
        targetArea: 'Prsníky & jazvy',
        frequencyOrSessions: '1 kontrola',
        estimatedPrice: 0,
        priority: 'high',
        status: 'planned',
        notes: 'Zhodnotenie tvaru, povolenie odloženia stabilizačného pásu.'
      },
      {
        id: 'trt-b5',
        name: 'Laserové ošetrenie jaziev (Vaskulárny laser na začervenanie / CO2)',
        category: 'laser',
        seasonOrMonth: '2. – 3. mesiac po operácii',
        targetArea: 'Podprsníkové jazvy',
        frequencyOrSessions: '1-2 sedenia podľa potreby',
        estimatedPrice: 140,
        priority: 'recommended',
        status: 'planned',
        notes: 'Zosvetlenie jazvy, minimalizácia cievneho prekrvácania jazvy.'
      },
      {
        id: 'trt-b6',
        name: 'Finálna kontrola tvaru & Fotodokumentácia výsledku',
        category: 'surgery',
        seasonOrMonth: '+6 mesiacov po operácii',
        targetArea: 'Prsníky',
        frequencyOrSessions: '1 kontrola',
        estimatedPrice: 0,
        priority: 'high',
        status: 'planned',
        notes: 'Porovnávacia fotodokumentácia PRED a PO, zhodnotenie výsledku.'
      }
    ],
    doctorNote: 'Pred a pooperačný protokol zabezpečuje maximálnu bezpečnosť, prevenciu kapsulárnej kontraktúry a dokonalý kozmetický vzhľad jazvy.'
  },

  blepharoplasty_care: {
    title: 'Pred a pooperačný plán: Blefaroplastika (Operácia očných viečok) & Laserová starostlivosť',
    planType: 'pre_post_op',
    diagnosisOrGoal: 'Dermatochaláza horných viečok, previs kože znižujúci zorné pole, únava očí. Plán na predoperačnú prípravu, ochranu zraku, rýchle vstrebanie modrín a neviditeľnú jazvu v záhybe viečka.',
    preOpCare: {
      procedureName: 'Blefaroplastika horných (alebo dolných) očných viečok',
      prehabilitation: {
        medicalPrehab: [
          'Vysadenie kyseliny acetylsalicylovej (Aspirín, Acylpyrín), Ibuprofénu a Ginkgo biloba 14 dní pred zákrokom (prevencia retrobulbárneho hematómu).',
          'Stabilizácia krvného tlaku (arteriálnej hypertenzie) v spolupráci s internistom – kolísavý tlak zvyšuje pooperačné opuchy a krvácavosť viečok.',
          'Vynechanie fajčenia a nikotínu min. 2–4 týždne pred zákrokom.'
        ],
        psychologicalPrep: [
          'Eliminácia perioperačného stresu a stabilizácia autonómneho systému: Chronický stres vyplavuje katecholamíny a kortizol, ktoré zvyšujú krvný tlak a zhoršujú krvácavosť jemných periorbitálnych kapilár. 1 – 2 týždne pred zákrokom minimalizujte pracovný stres.',
          'Mentálna pripravenosť na priebeh a možné komplikácie (Psychological readiness): Realistické oboznámenie sa s fázami hojenia a pripravenosť na prechodné periorbitálne modrinky a asymetrický opuch (7 – 10 dní) bez úzkosti, paniky či sociálneho stresu. Pokojná myseľ urýchľuje regeneráciu.',
          'Nácvik relaxačného a bránicového dýchania (technika 4-7-8): Zmierňuje perioperačné napätie a pomáha udržať optimálny krvný tlak pred a počas lokálneho zákroku.'
        ],
        nutritionalPrep: [
          'Obmedzenie príjmu soli a sodíka 5 – 7 dní pred operáciou (kľúčová prevencia nadmerného zadržiavania tekutín v periorbitálnej oblasti).',
          'Suplementácia podľa EBM: Arnika Montana, Bromelaín, Vitamín C (1000 mg) a Rutín (Ascorutin) na spevnenie cievnej steny a urýchlenie vstrebania hematómov.',
          'Dostatočná hydratácia čistou vodou a vynechanie alkoholu min. 7 dní pred zákrokom.'
        ],
        physicalPrep: [
          'Silový tréning veľkých svalových skupín (nohy, chrbát, core) a aeróbna kardio chôdza: Stimulujú systémovú mikrocirkuláciu a lymfatický obeh, čím významne zrýchľujú resorpciu pooperačného edému a podliatin.',
          'Vybudovanie a ochrana svalovej hmoty: Svalová hmota slúži ako anabolická rezerva aminokyselín potrebných pre dokonalú syntézu kolagénu a reepitelizáciu jazvy vo viečkovom záhybe.',
          'Vynechanie cvikov s hlbokými predklonmi hlavy a ťažkými váhami 48 hodín pred zákrokom (ochrana pred cievnou hypertenziou očného okolia).'
        ]
      },
      instructions: [
        {
          id: 'blef-pre-1',
          timeframe: '2-3 týždne pred',
          title: 'Vysadenie antikoagulancií a ASA liekov',
          description: 'Oblasť viečok je extrémne cievne zásobená. Prísny zákaz Acylpyrínu, Ibuprofénu a ginkga na prevenciu retrobulbárneho hematómu.',
          mandatory: true
        },
        {
          id: 'blef-pre-home',
          timeframe: '3 dni pred',
          title: 'Príprava domáceho prostredia & odvoz',
          description: 'Pripraviť si chladivé gélové obklady, tmavé slnečné okuliare s UV filtrom, audio-obsah (podcasty/audioknihy) a zabezpečiť si odvoz z kliniky po zákroku.',
          mandatory: false
        },
        {
          id: 'blef-pre-2',
          timeframe: '1 týždeň pred',
          title: 'Zabezpečenie gélových obkladov a slnečných okuliarov',
          description: 'Zakúpiť chladivé gélové vankúšiky (do chladničky, nie mrazničky) a kvalitné tmavé slnečné okuliare s UV filtrom na cestu domov a prvé dni.',
          mandatory: false
        },
        {
          id: 'blef-pre-3',
          timeframe: 'Deň operácie',
          title: 'Príchod na kliniku bez líčidiel a kontaktných šošoviek',
          description: 'Absolútny zákaz očného make-upu, špirály, krémov. Kontaktné šošovky nechať doma (vziať si dioptrické okuliare). Odvoz zabezpečený doprovodom.',
          mandatory: true
        }
      ]
    },
    postOpCare: {
      procedureName: 'Blefaroplastika',
      phases: [
        {
          phaseId: 'blef-p1',
          period: '1. – 5. deň po operácii',
          title: 'Chladenie & Prevencia opuchov',
          focus: 'Intenzívne suché chladenie, polohovanie hlavy, minimalizácia námahy očí.',
          instructions: [
            'Suché chladenie gélovými vankúšikmi cez sterilnú gázu 15 minút každú hodinu počas dňa.',
            'Spánok s vyvýšenou hlavou (2 vankúše), nezohýbať sa pod úroveň pásu.',
            'Očnú náplasť (steri-stripy) na stehoch nechať nalepenú, nestrhávať.',
            'Nenamáhať oči čítaním, mobilom ani TV prvé 2-3 dni.',
            'Aplikovať očné kvapky (umelé slzy) pri pocite suchého oka.'
          ],
          warningSigns: ['Zhoršenie ostrosti zraku alebo dvojité videnie', 'Neznesiteľná pulzujúca bolesť za okom', 'Výrazné krvácanie']
        },
        {
          phaseId: 'blef-p2',
          period: '5. – 7. deň po operácii',
          title: 'Odstránenie stehov u lekára',
          focus: 'Vybratie jemného intradermálneho stehu, uvoľnenie ťahu na viečku.',
          instructions: [
            'Kontrola u MUDr. Jána Mráza, bezbolestné vytiahnutie stehu.',
            'Ešte 48 hodín po vybratí stehov nenanášať očný make-up.',
            'Pri pobyte vonku neustále nosiť slnečné okuliare.'
          ],
          scarCareGuidelines: [
            'Od 10. dňa začať s jemnou starostlivosťou o jazvu v záhybe viečka.'
          ]
        },
        {
          phaseId: 'blef-p3',
          period: '2. týždeň – 3. mesiac po operácii',
          title: 'Jazvy & Regenerácia periokulárnej oblasti',
          focus: 'Úplné vyhladenie jazvy, zmäknutie tkaniva, spevnenie okolia očí.',
          instructions: [
            'Používať špeciálny oftalmologicky testovaný silikónový gél na okolie očí.',
            'Tlaková masáž: jemný tlak bruškom prsta na jazvu smerom k spánkom (od 14. dňa).',
            'Striktná ochrana pred UV žiarením (slnečné okuliare + minerálny očný SPF).'
          ],
          recommendedProcedures: [
            'Vaskulárny laser (po 4-6 týždňoch) na redukciu jemných cievok.',
            'Frakčný laser alebo mezoterapia kyselinou hyalurónovou na vyhladenie vejárikovitých vrások.'
          ]
        }
      ],
      scarProtocol: {
        siliconeApplication: 'Oftalmologicky bezpečný silikónový gél (Stratamed / Kelo-cote / Cicaplast Gel B5) 2x denne po dobu 3 mesiacov.',
        pressureMassage: 'Veľmi jemné bodové pritláčanie jazvičky na viečku končekom prsta 2-3x denne.',
        sunProtection: 'Kvalitné UV400 slnečné okuliare a očný minerálny fluid SPF 50+ minimálne 6-12 mesiacov.',
        lymphaticDrainage: 'Jemná manuálna periorbitálna a krčná lymfodrenáž od 10. dňa po operácii + spánok s vyvýšenou hlavou a chladivé gélové obklady.',
        laserTherapy: 'Biostimulačné LED svetlo po vybratí stehov; cievny laser od 4.–6. týždňa pri pretrvávajúcom začervenaní; frakčný CO2 laser dolných viečok od 3. mesiaca.',
        advancedScarTherapies: [
          'Vaskulárny laser na elimináciu reziduálneho začervenania jazvy',
          'Frakčný CO2 laser na vyhladenie okolitej ochabnutej kože'
        ]
      }
    },
    cosmeticsRoutine: {
      morning: [
        {
          step: 1,
          category: 'Čistenie',
          productName: 'CeraVe Hydratačný čistiaci gél (Hydrating Cleanser)',
          brand: 'CeraVe',
          usage: 'Veľmi jemné omytie tváre a okolia očí vlažnou vodou bez trenia.',
          purpose: 'Šetrné čistenie s ceramidmi a kyselinou hyalurónovou bez podráždenia očí.',
          price: 14.50
        },
        {
          step: 2,
          category: 'Starostlivosť o modriny a opuchy',
          productName: 'Cicaplast Baume B5+ Ultra-Regeneračný balzam',
          brand: 'La Roche-Posay',
          usage: 'Jemne naniesť na oblasť pod očami a líca (nie do spojovkového vaku), kde steká hematóm.',
          purpose: 'Rýchla úľava, podpora hojenia a zníženie periorbitálneho edému s madecassoside a pantenolom.',
          price: 17.50
        },
        {
          step: 3,
          category: 'Starostlivosť o jazvy',
          productName: 'Cicaplast Gel B5 Pro-Recovery Masážny gél na jazvy',
          brand: 'La Roche-Posay',
          usage: 'Po vybratí stehov tenučká vrstva na jazvu v záhybe viečka, jemná bodová masáž.',
          purpose: 'Diskrétna silikónová ochrana s pantenolom pre optimálne nenápadné zjazvenie.',
          price: 13.50
        },
        {
          step: 4,
          category: 'SPF Ochrana',
          productName: 'Anthelios UVMune 400 Invisible Fluid SPF 50+',
          brand: 'La Roche-Posay',
          usage: 'Aplikácia na periorbitálnu oblasť (doplniť kvalitnými slnečnými okuliarmi UV400).',
          purpose: 'Mexoryl 400 ochrana zabraňuje trvalej hyperpigmentácii hojacich sa viečok.',
          price: 21.50
        }
      ],
      evening: [
        {
          step: 1,
          category: 'Očný krém & Výživa',
          productName: 'CeraVe Obnovujúci očný krém (Eye Repair Cream)',
          brand: 'CeraVe',
          usage: 'Jemné vklepanie končekom prstenníka na orbitálnu kosť pod okom.',
          purpose: 'Redukcia tmavých kruhov a opuchov s morským komplexom a ceramidmi.',
          price: 13.00
        },
        {
          step: 2,
          category: 'Nočná obnova jazvy',
          productName: 'Cicaplast Baume B5+ Ultra-Regeneračný balzam',
          brand: 'La Roche-Posay',
          usage: 'Tenká vrstva na očné viečka a líca pred spaním.',
          purpose: 'Hĺbková regenerácia a prevencia suchosti periorbitálnej zóny.',
          price: 17.50
        }
      ],
      specialWeeklyCare: [
        'Kvapky umelé slzy bez konzervantov pri únave očí.',
        'Bioaktívne kolagénové peptidy + Vitamín C každé ráno.'
      ]
    },
    annualTreatments: [
      {
        id: 'trt-bl-1',
        name: 'Pooperačná kontrola & Odstránenie stehov z viečok',
        category: 'surgery',
        seasonOrMonth: '+5 až +7 dní po operácii',
        targetArea: 'Očné viečka',
        frequencyOrSessions: '1 sedenie',
        estimatedPrice: 0,
        priority: 'high',
        status: 'planned',
        notes: 'Vytiahnutie stehov, inštruktáž k masážam viečka.'
      },
      {
        id: 'trt-bl-2',
        name: 'Kontrola stavu jazvičiek & Hojenia rany',
        category: 'surgery',
        seasonOrMonth: '+1 mesiac po operácii',
        targetArea: 'Očné viečka',
        frequencyOrSessions: '1 sedenie',
        estimatedPrice: 0,
        priority: 'high',
        status: 'planned',
        notes: 'Kontrola symetrie, zmäknutie jazvy, odporúčanie lasera v prípade potreby.'
      },
      {
        id: 'trt-bl-3',
        name: 'Aplikácia Botulotoxínu do vonkajších kútikov očí (Vejáriky)',
        category: 'injectable',
        seasonOrMonth: '+2 mesiace po operácii',
        targetArea: 'Periokulárna oblasť',
        frequencyOrSessions: '1 sedenie',
        estimatedPrice: 120,
        priority: 'medium',
        status: 'planned',
        notes: 'Vyhladenie dynamických vrások a otvorenie pohľadu pre dokonalý celkový efekt.'
      },
      {
        id: 'trt-bl-4',
        name: 'Frakčný CO2 laser dolných viečok alebo líce (podpora pružnosti)',
        category: 'laser',
        seasonOrMonth: 'Jeseň / Zima',
        targetArea: 'Dolné viečka',
        frequencyOrSessions: '1 sedenie',
        estimatedPrice: 180,
        priority: 'recommended',
        status: 'planned',
        notes: 'Spevnenie jemnej ochabnutej kože dolných viečok.'
      }
    ],
    doctorNote: 'Blefaroplastika prináša okamžité rozjasnenie a omladenie očného okolia o 7-10 rokov. Starostlivosť o jazvu zaručí jej úplnú neviditeľnosť v prirodzenom záhybe oka.'
  }
};
