export interface CosmeticRoutineItem {
  step: number;
  category: string; // 'Čistenie' | 'Sérum / Antioxidant' | 'Hydratácia' | 'SPF Ochrana' | 'Retinoidy' | 'Nočná regenerácia'
  productName: string;
  brand: string;
  usage: string;
  purpose: string;
  price?: number;
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
  calendarEventId?: string;
}

export interface PreOpInstruction {
  id: string;
  timeframe: string; // '4 týždne pred' | '2-3 týždne pred' | '1 týždeň pred' | 'Deň pred zákrokom' | 'Deň operácie'
  title: string;
  description: string;
  mandatory: boolean;
  completed?: boolean;
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
  analysisSummary?: {
    skinType?: string;
    skinTonePhototype?: string;
    mainConcerns?: string[];
    vectorZones?: string[];
    facialAgeEstimated?: number;
  };
  cosmeticsRoutine: {
    morning: CosmeticRoutineItem[];
    evening: CosmeticRoutineItem[];
    specialWeeklyCare: string[];
  };
  annualTreatments: ScheduledTreatment[];
  preOpCare?: {
    procedureName: string;
    targetSurgeryDate?: string;
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
      morning: [
        {
          step: 1,
          category: 'Čistenie',
          productName: 'CeraVe Hydratačný čistiaci gél (Hydrating Cleanser)',
          brand: 'CeraVe',
          usage: 'Ráno na vlhkú pokožku, jemne vmasírovať 60 sekúnd, opláchnuť vlažnou vodou.',
          purpose: 'Šetrné odstránenie mazu bez narušenia kožnej bariéry vďaka 3 esenciálnym ceramidom.',
          price: 14.50
        },
        {
          step: 2,
          category: 'Sérum / Antioxidant',
          productName: 'C E Ferulic Triple Antioxidant Treatment',
          brand: 'SkinCeuticals',
          usage: '4-5 kvapiek na vyčistenú suchú tvár, krk a dekolt.',
          purpose: 'Zlatý štandard antioxidantov (15% vit C + 1% vit E + 0.5% ferulová kyselina), neutralizácia voľných radikálov a stimulácia kolagénu.',
          price: 175.00
        },
        {
          step: 3,
          category: 'Hydratácia & Bariéra',
          productName: 'Triple Lipid Restore 2:4:2 Patentovaný bariérový krém',
          brand: 'SkinCeuticals',
          usage: 'Veľkosť hrášku rovnomerne rozotrieť na tvár a krk.',
          purpose: 'Patentovaný pomer 2% ceramidov, 4% cholesterolu a 2% mastných kyselín pre maximálnu hustotu a elasticitu pleti.',
          price: 155.00
        },
        {
          step: 4,
          category: 'SPF Ochrana',
          productName: 'Anthelios UVMune 400 Invisible Fluid SPF 50+',
          brand: 'La Roche-Posay',
          usage: 'Každé ráno ako finálny krok starostlivosti, 2 prsty prípravku rovnomerne na tvár a krk.',
          purpose: 'Revolučná ochrana pred ultra-dlhým UVA žiarením (Mexoryl 400), prevencia fotostarnutia a pigmentových škvŕn.',
          price: 21.50
        }
      ],
      evening: [
        {
          step: 1,
          category: 'Čistenie',
          productName: 'CeraVe Hydratačný čistiaci gél (Hydrating Cleanser)',
          brand: 'CeraVe',
          usage: 'Dvojité večerné čistenie pre odstránenie SPF a mestských nečistôt.',
          purpose: 'Hĺbkové a jemné prečistenie pórov bez vysušovania.',
          price: 14.50
        },
        {
          step: 2,
          category: 'Peptidy & Spevnenie',
          productName: 'P-TIOX Pokročilé peptidové sérum proti mimickým vráskam',
          brand: 'SkinCeuticals',
          usage: '5 kvapiek na miesta s mimickými vráskami (čelo, glabela, okolie očí a úst).',
          purpose: 'Inovácia 2025/2026 s Argireline Amplified pre relaxáciu mimických kontrakcií a vyhladenie reliéfu.',
          price: 142.00
        },
        {
          step: 3,
          category: 'Retinoidy & Bunková obnova',
          productName: 'Retinol 0.3 Nočný obnovujúci krém',
          brand: 'SkinCeuticals',
          usage: 'Aplikovať večer na suchú pleť 3x týždenne (postupne zvyšovať frekvenciu).',
          purpose: 'Čistý enkapsulovaný retinol stimuluje obnovu buniek, zjemňuje textúru a spevňuje dermis.',
          price: 98.00
        },
        {
          step: 4,
          category: 'Nočná regenerácia',
          productName: 'Minéral 89 72h Intenzívny hydratačný krém',
          brand: 'Vichy',
          usage: 'Nanesenie 15 minút po retinole ako ochranný a upokojujúci závoj.',
          purpose: '72-hodinová hĺbková hydratácia so skvalánom a vulkanickou vodou Vichy pre regeneráciu počas noci.',
          price: 23.00
        }
      ],
      specialWeeklyCare: [
        'Enzymatický peeling 1x týždenne večer namiesto retinolu pre šetrné odstránenie odumretých buniek.',
        'Hydratačná maska s kyselinou hyalurónovou (Vichy Minéral 89 Booster) po intenzívnych procedúrach.',
        'Vnútorná suplementácia: SAY Marine Pure Collagen Peptides 10,000mg každé ráno do vody.'
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
    doctorNote: 'Plán je koncipovaný na mieru pre prirodzený, nestarnúci vzhľad bez preplnenia tváre (French touch). Zameriava sa na kvalitu samotného kožného krytu a štrukturálnu pevnosť.'
  },

  breast_surgery_care: {
    title: 'Pred a pooperačný plán: Augmentácia prsníkov & Starostlivosť o jazvy',
    planType: 'pre_post_op',
    diagnosisOrGoal: 'Plánovaná augmentácia prsníkov silikónovými implantátmi, príprava tkanív na operáciu, bezproblémové hojenie a minimalizácia pooperačných jaziev.',
    preOpCare: {
      procedureName: 'Augmentácia prsníkov silikónovými implantátmi',
      instructions: [
        {
          id: 'pre-1',
          timeframe: '4-6 týždňov pred',
          title: 'Zákaz fajčenia a nikotínových produktov',
          description: 'Nikotín spôsobuje vazokonstrikciu mikrocirkulácie, čo drasticky zhoršuje hojenie rán a zvyšuje riziko infekcie a nekrózy tkaniva. Striktný zákaz aspoň 4 týždne pred a 4 týždne po.',
          mandatory: true
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
          category: 'Starostlivosť o modriny',
          productName: 'Cicatrix Recovery Balm & Arnica Montana',
          brand: 'SAY Clinic Lab',
          usage: 'Nanášať na oblasť hematómov a pooperačných opuchov okolo prsníkov (nie do otvorenej rany).',
          purpose: 'Arnika a madecassoside pre rýchle vstrebávanie krvných podliatin a zníženie edému.',
          price: 38.00
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
        'Užívanie SAY Marine Collagen 10,000mg + Vitamín C počas 3 mesiacov pre pevnosť a elastické hojenie.',
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
      instructions: [
        {
          id: 'blef-pre-1',
          timeframe: '2-3 týždne pred',
          title: 'Vysadenie antikoagulancií a ASA liekov',
          description: 'Oblasť viečok je extrémne cievne zásobená. Prísny zákaz Acylpyrínu, Ibuprofénu a ginkga na prevenciu retrobulbárneho hematómu.',
          mandatory: true
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
        siliconeApplication: 'Oftalmologicky bezpečný silikónový gél (Stratamed / Kelo-cote) 2x denne po dobu 3 mesiacov.',
        pressureMassage: 'Veľmi jemné bodové pritláčanie jazvičky na viečku končekom prsta 2-3x denne.',
        sunProtection: 'Kvalitné UV400 slnečné okuliare a očný minerálny fluid SPF 50+ minimálne 6-12 mesiacov.',
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
          category: 'Starostlivosť o modriny',
          productName: 'Cicatrix Recovery Balm & Arnica Montana',
          brand: 'SAY Clinic Lab',
          usage: 'Jemne naniesť na oblasť pod očami a líca (nie do spojovkového vaku), kde steká hematóm.',
          purpose: 'Rýchla resorpcia podliatin a zníženie periorbitálneho edému.',
          price: 38.00
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
        'SAY Collagen Peptides nápoj každé ráno.'
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
