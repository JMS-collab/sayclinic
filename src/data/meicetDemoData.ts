import { MeicetAnalysisResult, MeicetSkinMetrics, MeicetAnamnesisContext } from '@/types/meicet';

export const SAMPLE_MEICET_METRICS: MeicetSkinMetrics = {
  skinScoreOverall: 68,
  skinAge: 41,
  actualAge: 38,
  skinType: 'zmiešaná',
  fitzpatrickPhototype: 'II',
  hydration: {
    score: 44,
    percentile: 38,
    status: 'mierne zhoršený',
    description: 'Epidermálna dehydratácia v oblasti líc a čela so zvýšenou transepidermálnou stratou vody (TEWL).',
    clinicalSignificance: 'Narušená hydrolipidová bariéra zvyšuje prienik dráždivých látok a prehlbuje jemné vrásky.',
    tewlLevel: 'vysoká',
    moistureZoneNote: 'Kritický deficit v malárnej zóne líc, T-zóna má zachovanú sekréciu mazu.'
  },
  pores: {
    score: 61,
    percentile: 52,
    status: 'mierne zhoršený',
    description: 'Zväčšený priemer pórov a nahromadený zoxidovaný maz v centrálnom reliéfe.',
    clinicalSignificance: 'Vyžaduje cielené zjemnenie stratum corneum a reguláciu keratinizácie infundíbula.',
    poreCountEstimate: 1420,
    predominantZone: 'Nos, mediálne líca a oblasť brady (T-zóna)'
  },
  wrinkles: {
    score: 54,
    percentile: 45,
    status: 'mierne zhoršený',
    description: 'Dynamické linky v glabelárnej a frontálnej zóne, počínajúce statické periorbitálne vejáriky.',
    clinicalSignificance: 'Kombinácia mimickej hyperaktivity s úbytkom dermálneho kolagénu.',
    fineLinesScore: 58,
    deepWrinklesScore: 49,
    primaryZones: ['Glabela', 'Čelo (frontálne ryhy)', 'Periorbitálne (vejáriky)', 'Počínajúce nazolabiálne záhyby']
  },
  texture: {
    score: 66,
    percentile: 60,
    status: 'dobrý',
    description: 'Mierne zhrubnutý kožný reliéf s mikrošupinkami v dehydratovaných zónach.',
    clinicalSignificance: 'Indikácia pre jemnú chemickú exfoliáciu polyhydroxykyselinami (PHA/LHA) a hydratačný skinbooster.',
    roughnessIndex: 34,
    keratinizationState: 'Subklinická hyperkeratóza v zóne T'
  },
  uvDamage: {
    score: 48,
    percentile: 40,
    status: 'mierne zhoršený',
    description: 'Subepidermálne fotopoškodenie zistené v UV spektre (skryté melanínové zhluky pod povrchom).',
    clinicalSignificance: 'Vysoké riziko prepuknutia viditeľných solárnych lentíg po expozícii slnečnému žiareniu.',
    hiddenSpotsRisk: 'vysoké',
    photodamageSeverity: 'Mierna až stredná solárna elastóza z kumulatívneho UV'
  },
  brownSpots: {
    score: 72,
    percentile: 68,
    status: 'dobrý',
    description: 'Ohraničené povrchové pehy a mierne solárne lentigá v oblasti nosa a líc.',
    clinicalSignificance: 'Vyžaduje inhibítory tyrozinázy (kyselina tranexamová, vitamín C, arbutín) a celoročné SPF 50+.',
    melasmaTendency: false,
    pigmentDepth: 'epidermálny'
  },
  redAreas: {
    score: 52,
    percentile: 46,
    status: 'mierne zhoršený',
    description: 'Difúzny erytém v krídlach nosa a na lícach s viditeľnou vaskularizáciou v krížovo-polarizovanom svetle.',
    clinicalSignificance: 'Reaktívna cievna stena, predispozícia na kuperózu / počínajúcu rosaceu.',
    erythemaLevel: 'mierne reaktívna',
    rosaceaRisk: true,
    telangiectasiaZones: ['Alar base nosa', 'Malárne líca obojstranne']
  },
  sebumAndPorphyrins: {
    score: 75,
    percentile: 72,
    status: 'dobrý',
    description: 'Fyziologická distribúcia porfyrínov v UV spektre, bez rozsiahlej mikrobiálnej kolonizácie C. acnes.',
    clinicalSignificance: 'Priaznivý mikrobióm bez rizika závažnej inflamácie akné.',
    tZoneOiliness: 'zvýšená',
    microbialActivity: 'stredná'
  }
};

export function createDemoMeicetResult(
  patientId: string = 'P1',
  patientName: string = 'Mária Kováčová',
  birthNumber: string = '885512/6789',
  preferredTier: 'high_end' | 'mid_end' = 'high_end'
): MeicetAnalysisResult {
  const anamnesis: MeicetAnamnesisContext = {
    pastSurgeries: [
      'Blefaroplastika horných viečok (pred 6 mesiacmi, SAY CLINIC - MUDr. Ján Mráz)',
      'Excízia pigmentového névu v oblasti ramena (histológia benígna)'
    ],
    allergies: ['Penicilín (kožný exantém)', 'Nikel (kontaktná dermatitída)'],
    aestheticTreatments: [
      'Aplikácia botulotoxínu do glabelly a čela (pred 5 mesiacmi - efekt doznieva)',
      'Mezoterapia NCTF 135HA (pred rokom)'
    ],
    scarHistory: [
      {
        location: 'Horné viečka obojstranne (v sulcus palpebralis superior)',
        origin: 'Pooperačná jazva po blefaroplastike (6 mesiacov)',
        maturityMonths: 6,
        appearance: 'čerstvá erytematózna',
        currentCare: 'Aplikácia silikónového gélu Strataderm nepravidelne, chýba dôsledná tlaková masáž.'
      }
    ],
    clientConcerns: [
      'Pretrvávajúce jemné ružovkasté zafarbenie jaziev po operácii viečok',
      'Pocit pnutia a suchej pleti po umytí',
      'Zvýraznené vrásky okolo očí a na čele',
      'Obavy z pigmentácií počas letných mesiacov'
    ],
    contraindications: [
      'Alergia na penicilín',
      'Zákaz ablatívneho lasera v letnom období kvôli fototypu II a riziku PIH'
    ],
    lifestyleNotes: 'Práca v klimatizovanej kancelárii pri PC (modré svetlo), príležitostný šport v prírode.'
  };

  return {
    id: `meicet-${Date.now()}`,
    patientId,
    patientName,
    patientBirthNumber: birthNumber,
    scanDate: new Date().toISOString().split('T')[0],
    deviceModel: 'Meicet Pro-A (ISEMECO 3D Spectral Facial Diagnostic System)',
    pdfSourceFilename: 'Meicet_ProA_Report_Kovacova_2026.pdf',
    metrics: SAMPLE_MEICET_METRICS,
    anamnesis,
    clinicalSynthesis: {
      summary: 'Objektívna 3D analýza Meicet Pro-A preukázala nesúlad medzi chronologickým vekom (38 r.) a vekom pleti (41 r.), spôsobený predovšetkým hĺbkovou dehydratáciou (skóre 44/100), subklinickým fotopoškodením v UV spektre a reaktívnym cievnym erytémom na lícach a viečkach. V kontexte anamnézy je kľúčová prebiehajúca maturácia pooperačných jaziev po blefaroplastike horných viečok (6. mesiac), ktoré vykazujú cievnu neovaskularizáciu a vyžadujú cielený vaskulárny laser a fotoprotekciu pred začiatkom leta.',
      keyFindings: [
        'Vysoká transepidermálna strata vody (TEWL) oslabuje kožnú bariéru a akcentuje mimické vrásky.',
        'Jazva po blefaroplastike horných viečok je v aktívnej fáze zrenia s prítomným cievnym erytémom – indikovaný vaskulárny laser.',
        'Skryté UV fotopoškodenie v strednej tretine tváre vyžaduje prevenciu melazmy a striktnú širokospektrálnu fotoprotekciu SPF 50+ s ochranou proti HEV (modrému svetlu).',
        'Doznievajúci efekt botulotoxínu v glabele a na čele – odporúčaná re-aplikácia pred nástupom intenzívneho letného slnka.'
      ],
      riskAlerts: [
        'Riziko pozápalovej hyperpigmentácie (PIH) pooperačnej jazvy pri expozícii slnečnému žiareniu bez minerálneho SPF 50+.',
        'Kontraindikácia ablatívneho frakčného CO2 lasera počas letného obdobia (jún – august).'
      ],
      synergyWithSurgeries: 'Stav po blefaroplastike (6 mesiacov): Jazva v záhybe viečka je pevná, bez hypertrofie, no vykazuje v spektre krížovej polarizácie reziduálny cievny erytém. Cielená starostlivosť silikónovými preparátmi a vaskulárnym laserom zamedzí neskoršej pigmentácii.'
    },
    annualSchedule: [
      {
        quarter: 'Q1 (Zima / Jar)',
        season: 'jar',
        title: 'Bariérová obnova, cievne upokojenie & refresh mimiky',
        focus: 'Obnova hydratácie, cievny laser na jazvy a líca, aplikácia botulotoxínu pred sezónou žmúrenia.',
        seasonalConsideration: 'Ideálny čas pred nástupom silného slnečného žiarenia. Príprava pleti na slnko.',
        treatments: [
          {
            id: 'trt-q1-1',
            name: 'Vaskulárny laser KTP / Excel V (oblasť viečok & nos)',
            category: 'laser',
            targetArea: 'Jazvy po blefaroplastike + alárne cievky nosa',
            seasonOrMonth: 'Marec',
            frequency: '1 sedenie',
            priority: 'vysoká',
            estimatedPrice: 180,
            reasoning: 'Zatvorenie reziduálnych dilatovaných kapilár v jazve a prevencia trvalého začervenania.',
            status: 'planned'
          },
          {
            id: 'trt-q1-2',
            name: 'Aplikácia botulotoxínu (Allergan / Bocouture)',
            category: 'injectable',
            targetArea: 'Glabela + čelo + periokulárne vejáriky',
            seasonOrMonth: 'Apríl',
            frequency: '1 sedenie (cca 35-40 BJ)',
            priority: 'vysoká',
            estimatedPrice: 240,
            reasoning: 'Relaxácia mimiky pred letnými mesiacmi, prevencia prehlbovania vrások pri žmúrení na slnku.',
            status: 'planned'
          },
          {
            id: 'trt-q1-3',
            name: 'Biorevitalizačný Skinbooster (Profhilo / Restylane Vital)',
            category: 'injectable',
            targetArea: 'Stredná a dolná tretina tváre, krk',
            seasonOrMonth: 'Máj',
            frequency: '2 sedenia s odstupom 4 týždňov',
            priority: 'odporúčaná',
            estimatedPrice: 320,
            reasoning: 'Okamžité navýšenie dermálnej hydratácie zistené Meicetom na 44% a zníženie TEWL.',
            status: 'planned'
          }
        ]
      },
      {
        quarter: 'Q2 (Letné obdobie)',
        season: 'leto',
        title: 'Intenzívna fotoprotekcia, antioxidačný štít & neinvazívna hydratácia',
        focus: 'Zákaz ablatívnych laserov! Maximálna ochrana pred UV poškodením a dehydratáciou.',
        seasonalConsideration: 'Striktná ochrana jaziev viečok pred UV. Žiadne fotosenzibilizujúce kyseliny ani frakčné lasery.',
        treatments: [
          {
            id: 'trt-q2-1',
            name: 'Meicet Pro-A Kontrolné premeranie pleti (3. mesiac)',
            category: 'skin_care',
            targetArea: 'Celá tvár',
            seasonOrMonth: 'Jún',
            frequency: '1 kontrola',
            priority: 'vysoká',
            estimatedPrice: 45,
            reasoning: 'Objektívne porovnanie parametrov hydratácie po skinboosteri a zhodnotenie cievneho erytému po laseri.',
            status: 'planned',
            isMeicetScan: true
          },
          {
            id: 'trt-q2-2',
            name: 'HydraFacial Deluxe + infúzia kyseliny hyalurónovej a peptidov',
            category: 'skin_care',
            targetArea: 'Tvár a dekolt',
            seasonOrMonth: 'Júl',
            frequency: '1 sedenie mesačne',
            priority: 'udržiavacia',
            estimatedPrice: 130,
            reasoning: 'Hĺbkové bezpečné prečistenie zväčšených pórov a hydratácia bez rizika fotoreaktivity.',
            status: 'planned'
          },
          {
            id: 'trt-q2-3',
            name: 'Mezoterapia polynukleotidmi (Plenhyage / PhilArt)',
            category: 'injectable',
            targetArea: 'Periorbitálne okolie a oblasť viečok',
            seasonOrMonth: 'August',
            frequency: '1 sedenie',
            priority: 'odporúčaná',
            estimatedPrice: 210,
            reasoning: 'Biostimulácia fibroblastov v tenkej koži viečok a regenerácia tkaniva okolo jazvy bez fotosenzitivity.',
            status: 'planned'
          }
        ]
      },
      {
        quarter: 'Q3 (Jeseň)',
        season: 'jesen',
        title: 'Cievny laser, cielená vaskulárna fototermolýza & pigmentový detox',
        focus: 'Kľúčová sezóna cievneho lasera SAY CLINIC: ošetrenie erytému, cievok a vaskularizovaných jaziev po lete.',
        seasonalConsideration: 'Klesajúci UV index vytvára ideálne podmienky na ošetrenie cievnym laserom bez rizika pozápalovej hyperpigmentácie.',
        treatments: [
          {
            id: 'trt-q3-1',
            name: 'Meicet Pro-A Kontrolné premeranie pleti (6. mesiac)',
            category: 'skin_care',
            targetArea: 'Celá tvár',
            seasonOrMonth: 'September',
            frequency: '1 kontrola',
            priority: 'vysoká',
            estimatedPrice: 45,
            reasoning: 'Detekcia nového solárneho pigmentu po letnej sezóne na plánovanie laserových parametrov.',
            status: 'planned',
            isMeicetScan: true
          },
          {
            id: 'trt-q3-2',
            name: 'Cievny laser (ošetrenie cievneho erytému, teleangiektázií a vaskularizovaných jaziev)',
            category: 'laser',
            targetArea: 'Jazvy horných viečok + lícne oblasti + nos',
            seasonOrMonth: 'Október',
            frequency: '1 sedenie',
            priority: 'vysoká',
            estimatedPrice: 180,
            reasoning: 'Cielená vaskulárna fototermolýza na uzavretie dilatovaných kapilár a redukciu erytému po blefaroplastike.',
            status: 'planned'
          },
          {
            id: 'trt-q3-3',
            name: 'Medicínsky depigmentačný peeling (Mandelic + Tranexamic)',
            category: 'skin_care',
            targetArea: 'Celá tvár',
            seasonOrMonth: 'November',
            frequency: '2 sedenia po 3 týždňoch',
            priority: 'odporúčaná',
            estimatedPrice: 120,
            reasoning: 'Zosvetlenie hlbokých UV škvŕn odhalených analyzátorom Meicet.',
            status: 'planned'
          }
        ]
      },
      {
        quarter: 'Q4 (Zima)',
        season: 'zima',
        title: 'Objemová harmonizácia, biostimulácia & ročný audit pleti',
        focus: 'Kyselina hyalurónová do malárnej zóny, botox refresh a kompletné záverečné porovnanie Meicet.',
        seasonalConsideration: 'Stabilné zimné obdobie, ideálne na hojenie a prípravu na ďalší cyklus.',
        treatments: [
          {
            id: 'trt-q4-1',
            name: 'Refresh botulotoxínu (Glabela & čelo)',
            category: 'injectable',
            targetArea: 'Horná tretina tváre',
            seasonOrMonth: 'December',
            frequency: '1 sedenie',
            priority: 'odporúčaná',
            estimatedPrice: 200,
            reasoning: 'Udržanie hladkej textúry a prevencia mimického lámania dermis.',
            status: 'planned'
          },
          {
            id: 'trt-q4-2',
            name: 'Kyselina hyalurónová – malárna oblasť & nazolabiálna opora',
            category: 'injectable',
            targetArea: 'Lícne kosti a nazolabiálne ryhy (1.5 ml Juvederm Voluma)',
            seasonOrMonth: 'Január',
            frequency: '1 sedenie',
            priority: 'odporúčaná',
            estimatedPrice: 360,
            reasoning: 'Obnova mladistvého objemu a podpora oporných vektorov tváre.',
            status: 'planned'
          },
          {
            id: 'trt-q4-3',
            name: 'Ročný finálny audit pleti na Meicet Pro-A (12. mesiac)',
            category: 'skin_care',
            targetArea: 'Celá tvár (všetky spektrá)',
            seasonOrMonth: 'Február',
            frequency: '1 audit',
            priority: 'vysoká',
            estimatedPrice: 0,
            reasoning: 'Kompletné 3D vyhodnotenie posunu veku pleti z 41 r. na cieľových ≤36 r. a zhodnotenie stavu jaziev.',
            status: 'planned',
            isMeicetScan: true
          }
        ]
      }
    ],
    skincareRoutine: {
      selectedTier: preferredTier,
      highEnd: {
        tier: 'high_end',
        tierLabel: 'High-End (SkinCeuticals)',
        brandDescription: 'Klinický luxus z cenníka – patentované zloženia s maximálnou koncentráciou antioxidantov a lipidov',
        totalEstimatedPrice: 538,
        morning: [
          {
            step: 1,
            category: 'Jemné čistenie pórov',
            productName: 'SkinCeuticals Simply Clean Gél',
            brand: 'SkinCeuticals',
            activeIngredients: 'Aminokyseliny, ovocné kyseliny, harmanček a aloe vera',
            usage: 'Vytvoriť jemnú penu s vlažnou vodou, jemne masírovať 45 sekúnd, opláchnuť. Netrieť viečka!',
            purpose: 'Šetrné odstránenie mazu bez vysušenia kožnej bariéry a príprava na antioxidant.',
            price: 48,
            meicetJustification: 'Znížené skóre TEWL vyžaduje šetrný čistič s fyziologickým pH bez sulfátov.'
          },
          {
            step: 2,
            category: 'Klinický antioxidačný etalón',
            productName: 'SkinCeuticals C E Ferulic Sérum',
            brand: 'SkinCeuticals',
            activeIngredients: '15% čistá kyselina L-askorbová, 1% alfa-tokoferol, 0.5% kyselina ferulová',
            usage: '4-5 kvapiek ráno na suchú tvár a krk pred nanesením krému.',
            purpose: '8-násobná fotoprotekcia, neutralizácia voľných radikálov, zosvetlenie UV škvŕn a stimulácia kolagénu.',
            price: 175,
            meicetJustification: 'Kompenzácia zisteného skrytého fotopoškodenia v UV spektre Meicet (skóre 48/100).'
          },
          {
            step: 3,
            category: 'Hĺbkové hyalurónové sérum',
            productName: 'SkinCeuticals H.A. Intensifier',
            brand: 'SkinCeuticals',
            activeIngredients: 'Kyselina hyalurónová, 10% Proxylane™, extrakt z koreňa sladkého drievka a fialovej ryže',
            usage: '4-6 kvapiek vklepať do líc, čela a krku.',
            purpose: 'Zvýšenie hladiny kyseliny hyalurónovej v pleti o 30% a vyplnenie jemných vrások.',
            price: 118,
            meicetJustification: 'Riešenie kritickej dehydratácie zistenej na Meicet (skóre 44%) a podpora elasticity.'
          },
          {
            step: 4,
            category: 'Klinický lipidový krém 2:4:2',
            productName: 'SkinCeuticals Triple Lipid Restore 2:4:2',
            brand: 'SkinCeuticals',
            activeIngredients: '2% čisté ceramidy, 4% prírodný cholesterol, 2% mastné kyseliny',
            usage: 'Veľkosť hrášku jemne zahriať medzi prstami a vtlačiť do pleti tváre a dekoltu.',
            purpose: 'Patentovaný pomer na obnovu poškodenej kožnej bariéry a redukciu transepidermálnej straty vody.',
            price: 155,
            meicetJustification: 'Uzatvorenie vlhkosti v pokožke a redukcia TEWL (transepidermálnej straty vody).'
          },
          {
            step: 5,
            category: 'Širokospektrálna fotoprotekcia SPF 50+',
            productName: 'SkinCeuticals Ultra Facial Defense SPF 50+',
            brand: 'SkinCeuticals',
            activeIngredients: 'Mexoryl SX & XL fotostabilné filtre, vitamín E',
            usage: 'Aplikovať každé ráno 15 minút pred odchodom. Dôkladne prekryť oblasť jaziev viečok!',
            purpose: 'Komplexná ochrana pred UVA/UVB lúčmi, prevencia nových pigmentácií a stmavnutia jaziev.',
            price: 42,
            meicetJustification: 'Kritická ochrana pooperačnej jazvy pred stmavnutím a prevencia solárnych lentíg.'
          }
        ],
        evening: [
          {
            step: 1,
            category: 'Večerné čistenie pleti',
            productName: 'SkinCeuticals Simply Clean Gél',
            brand: 'SkinCeuticals',
            activeIngredients: 'Aminokyseliny, glycerín a jemné botanické zložky',
            usage: 'Odstrániť denný SPF a nečistoty, opláchnuť vlažnou vodou a osušiť prikladaním uteráka.',
            purpose: 'Dokonale čistá pleť pripravená na nočnú regeneráciu.',
            price: 48,
            meicetJustification: 'Efektívne uvoľnenie pórov v T-zóne bez narušenia kožného filmu.'
          },
          {
            step: 2,
            category: 'Upokojujúce sérum na cievny erytém',
            productName: 'SkinCeuticals Phyto Corrective Gel',
            brand: 'SkinCeuticals',
            activeIngredients: 'Kyselina hyalurónová, botanické extrakty (uhorka, tymián, olivový list), morušovník',
            usage: '3-4 kvapky vklepať do začervenaných zón a líc.',
            purpose: 'Upokojenie reaktívnych cievnych zón, zmiernenie začervenania a zjednotenie tónu pleti.',
            price: 85,
            meicetJustification: 'Cielené riešenie reaktívneho cievneho erytému zisteného v spektre krížovej polarizácie.'
          },
          {
            step: 3,
            category: 'Bunková obnova & Retinoid',
            productName: 'SkinCeuticals Retinol 0.3 Obnovujúci nočný krém',
            brand: 'SkinCeuticals',
            activeIngredients: '0.3% čistý enkapsulovaný retinol, bisabolol, extrakt z boswellie',
            usage: 'Veľkosť hrášku 2-3x týždenne večer na suchú pleť. Vyhnúť sa jazve horných viečok!',
            purpose: 'Stimulácia kolagénovej syntézy, vyhladenie jemných vrások a zmenšenie priemeru pórov.',
            price: 98,
            meicetJustification: 'Zamerané na omladenie biologického veku pleti (41 r.) a normalizáciu keratinizácie.'
          },
          {
            step: 4,
            category: 'Intenzívny nočný regeneračný krém',
            productName: 'SkinCeuticals Triple Lipid Restore 2:4:2',
            brand: 'SkinCeuticals',
            activeIngredients: '2% ceramidy, 4% cholesterol, 2% mastné kyseliny',
            usage: 'Naniesť na celú tvár a krk ako záverečný nočný krok.',
            purpose: 'Hĺbková nočná obnova lipidového plášťa a kompenzácia účinku retinolu.',
            price: 155,
            meicetJustification: 'Maximálna regenerácia epidermy a zníženie citlivosti po aktívnych látkach.'
          }
        ],
        weeklyCare: [
          '1x týždenne: Šetrná enzymatická exfoliácia a upokojujúca gélová kúra SkinCeuticals Phyto Corrective Masque.',
          '1x týždenne: Intenzívny nočný zábal Triple Lipid Restore 2:4:2 na dehydratované zóny líc.',
          'Každý víkend: Kontrola vyzrievania pooperačnej jazvy viečok (tlaková masáž).'
        ]
      },
      midEnd: {
        tier: 'mid_end',
        tierLabel: 'Mid-End (La Roche-Posay, CeraVe, Vichy)',
        brandDescription: 'Dostupná lekárenská starostlivosť z nášho cenníka – overená dermatologická tolerancia a obnova bariéry',
        totalEstimatedPrice: 216,
        morning: [
          {
            step: 1,
            category: 'Jemné čistenie s ceramidmi',
            productName: 'CeraVe Hydratačný čistiaci gél (Hydrating Cleanser)',
            brand: 'CeraVe',
            activeIngredients: '3 esenciálne ceramidy (1, 3, 6-II), kyselina hyalurónová, MVE technológia',
            usage: 'Naniesť na navlhčenú pleť, jemne premasírovať 30 sekúnd a opláchnuť vlažnou vodou.',
            purpose: 'Šetrne čistí a hydratuje bez narušenia ochrannej kožnej bariéry.',
            price: 14.5,
            meicetJustification: 'Kritické skóre hydratácie 44% vyžaduje čistenie bez penidiel a sulfátov.'
          },
          {
            step: 2,
            category: 'Antioxidačné sérum s vitamínom C',
            productName: 'Vichy Liftactiv Vitamín C 15% Sérum',
            brand: 'Vichy',
            activeIngredients: '15% čistý vitamín C, vitamín E, pyknogenol z borovicovej kôry, vulkanická voda Vichy',
            usage: '4-5 kvapiek ráno na suchú tvár a krk pred nanesením hydratačného krému.',
            purpose: 'Antioxidačný štít proti voľným radikálom a rozjasnenie UV pigmentácií.',
            price: 38,
            meicetJustification: 'Zosvetlenie podpovrchových solárnych pigmentácií zistených v UV spektre Meicet.'
          },
          {
            step: 3,
            category: 'Denný hyalurónový posilňovač bariéry',
            productName: 'Vichy Minéral 89 Hyaluron Booster',
            brand: 'Vichy',
            activeIngredients: '89% termálna vulkanická voda Vichy s 15 minerálmi, prírodná kyselina hyalurónová',
            usage: '2 pumpičky vklepať do pleti tváre a okolo očí.',
            purpose: 'Posilnenie kožnej bariéry, hĺbková hydratácia a pružnosť.',
            price: 24.5,
            meicetJustification: 'Riešenie nízkej hydratácie pleti a ochrana pred vonkajšími vplyvmi.'
          },
          {
            step: 4,
            category: 'Upokojujúci bariérový krém',
            productName: 'La Roche-Posay Toleriane Dermallergo Krém',
            brand: 'La Roche-Posay',
            activeIngredients: 'Sphingobioma, Neurosensine, termálna voda La Roche-Posay',
            usage: 'Aplikovať ráno na tvár, krk a očné okolie.',
            purpose: 'Okamžité upokojenie začervenania, zníženie reaktivity a hydratácia po dobu 48h.',
            price: 23,
            meicetJustification: 'Upokojenie reaktívnych cievnych zón zistených v spektre krížovej polarizácie.'
          },
          {
            step: 5,
            category: 'Najvyššia UVA fotoprotekcia SPF 50+',
            productName: 'La Roche-Posay Anthelios UVMune 400 Invisible Fluid SPF 50+',
            brand: 'La Roche-Posay',
            activeIngredients: 'Mexoryl 400 (chráni pred ultra-dlhým UVA až do 400nm), Netlock technológia',
            usage: 'Pretrepať a aplikovať ráno 15 minút pred odchodom. Prekryť oblasť jazvy viečka.',
            purpose: 'Maximálna ochrana pred bunkovým poškodením a ochrana jazvy pred pigmentáciou.',
            price: 21.5,
            meicetJustification: 'Kritická ochrana pooperačnej jazvy pred stmavnutím a prevencia solárnych lentíg.'
          }
        ],
        evening: [
          {
            step: 1,
            category: 'Večerné čistiace penenie',
            productName: 'CeraVe Čistiaci penivý gél (Foaming Cleanser)',
            brand: 'CeraVe',
            activeIngredients: '3 ceramidy, niacínamid, kyselina hyalurónová',
            usage: 'Vytvoriť penu, jemne umyť tvár od denného SPF a opláchnuť.',
            purpose: 'Dôkladné večerné odstránenie nečistôt a mazu bez pocitu pnutia.',
            price: 14.5,
            meicetJustification: 'Uvoľnenie pórov v T-zóne bez narušenia prirodzeného lipidového plášťa.'
          },
          {
            step: 2,
            category: 'Sérum proti pigmentovým škvrnám',
            productName: 'La Roche-Posay Mela B3 Sérum proti pigmentácii',
            brand: 'La Roche-Posay',
            activeIngredients: 'Melasyl™ (patentovaná molekula proti pigmentu), 10% niacínamid, LHA',
            usage: '3-4 kvapky večer na celú tvár pred aplikáciou krému.',
            purpose: 'Zachytenie prekurzorov melanínu a redukcia solárnych škvŕn a pozápalových stôp.',
            price: 44.5,
            meicetJustification: 'Cielené pôsobenie na subklinické UV pigmentácie zistené analyzátorom Meicet.'
          },
          {
            step: 3,
            category: 'Obnovujúce sérum s retinolom',
            productName: 'CeraVe Retinolové obnovujúce sérum (Resurfacing Retinol)',
            brand: 'CeraVe',
            activeIngredients: 'Enkapsulovaný retinol, extrakt z koreňa sladkého drievka, 3 ceramidy, niacínamid',
            usage: 'Aplikovať večer 2-3x týždenne. Vyhnúť sa priamej aplikácii na jazvu viečka!',
            purpose: 'Podpora bunkovej obnovy, zjemnenie pórov a zlepšenie hladkosti pleti.',
            price: 18.5,
            meicetJustification: 'Zamerané na omladenie zisteného biologického veku pleti (41 r.) a zjemnenie textúry.'
          },
          {
            step: 4,
            category: 'Intenzívny nočný regeneračný balzam',
            productName: 'La Roche-Posay Cicaplast Baume B5+ Obnovujúci balzam',
            brand: 'La Roche-Posay',
            activeIngredients: 'Madecassoside, 5% panthenol, Tribioma prebiotický komplex, meď, zinok',
            usage: 'Naniesť na celú tvár, hrubšia vrstva na oblasť jazvy viečka.',
            purpose: 'Urýchlenie obnovy kožnej bariéry, upokojenie erytému a optimálne zrenie jazvy.',
            price: 17.5,
            meicetJustification: 'Podpora epitelizácie a upokojenie citlivých cievnych zón zistených na Meicet.'
          }
        ],
        weeklyCare: [
          '1x týždenne: CeraVe SA Zjemňujúci čistiaci gél s kyselinou salicylovou na šetrné uvoľnenie pórov v T-zóne.',
          '1x týždenne: Chladivý obklad s termálnou vodou La Roche-Posay na zmiernenie cievneho erytému.',
          'Každý víkend: Kontrola jazvy po blefaroplastike a jemná tlaková ischemická masáž.'
        ]
      },
      // Predvolená ranná a večerná rutina rešpektuje zvolený preferovaný tier (high_end alebo mid_end)
      morning: preferredTier === 'mid_end' ? [
        {
          step: 1,
          category: 'Jemné čistenie s ceramidmi',
          productName: 'CeraVe Hydratačný čistiaci gél (Hydrating Cleanser)',
          brand: 'CeraVe',
          activeIngredients: '3 esenciálne ceramidy (1, 3, 6-II), kyselina hyalurónová, MVE technológia',
          usage: 'Naniesť na navlhčenú pleť, jemne premasírovať 30 sekúnd a opláchnuť vlažnou vodou.',
          purpose: 'Šetrne čistí a hydratuje bez narušenia ochrannej kožnej bariéry.',
          price: 14.5,
          meicetJustification: 'Kritické skóre hydratácie 44% vyžaduje čistenie bez penidiel a sulfátov.'
        },
        {
          step: 2,
          category: 'Antioxidačné sérum s vitamínom C',
          productName: 'Vichy Liftactiv Vitamín C 15% Sérum',
          brand: 'Vichy',
          activeIngredients: '15% čistý vitamín C, vitamín E, pyknogenol z borovicovej kôry, vulkanická voda Vichy',
          usage: '4-5 kvapiek ráno na suchú tvár a krk pred nanesením hydratačného krému.',
          purpose: 'Antioxidačný štít proti voľným radikálom a rozjasnenie UV pigmentácií.',
          price: 38,
          meicetJustification: 'Zosvetlenie podpovrchových solárnych pigmentácií zistených v UV spektre Meicet.'
        },
        {
          step: 3,
          category: 'Denný hyalurónový posilňovač bariéry',
          productName: 'Vichy Minéral 89 Hyaluron Booster',
          brand: 'Vichy',
          activeIngredients: '89% termálna vulkanická voda Vichy s 15 minerálmi, prírodná kyselina hyalurónová',
          usage: '2 pumpičky vklepať do vyčistenej pleti ráno.',
          purpose: 'Posilnenie kožnej bariéry, hĺbková hydratácia a ochrana pred znečistením.',
          price: 24.5,
          meicetJustification: 'Zvýšenie vnútrokožnej hydratácie a zníženie citlivosti cievnych zón.'
        },
        {
          step: 4,
          category: 'Upokojujúci hydratačný krém',
          productName: 'La Roche-Posay Toleriane Dermallergo Krém',
          brand: 'La Roche-Posay',
          activeIngredients: 'Neurosensine, Sphingobioma, termálna voda La Roche-Posay, bambucké maslo',
          usage: 'Naniesť ráno na tvár a krk.',
          purpose: 'Okamžité upokojenie reaktívnej pleti, redukcia začervenania a obnova mikrobiómu.',
          price: 23,
          meicetJustification: 'Priame zmiernenie cievneho erytému zisteného v polarizovanom spektre Meicet.'
        },
        {
          step: 5,
          category: 'Širokospektrálna fotoprotekcia SPF 50+',
          productName: 'La Roche-Posay Anthelios UVMune 400 Invisible Fluid SPF 50+',
          brand: 'La Roche-Posay',
          activeIngredients: 'Mexoryl 400 (chráni pred ultra-dlhým UVA až do 400nm), Netlock technológia',
          usage: 'Pretrepať a aplikovať ráno 15 minút pred odchodom. Prekryť oblasť jazvy viečka.',
          purpose: 'Maximálna ochrana pred bunkovým poškodením a ochrana jazvy pred pigmentáciou.',
          price: 21.5,
          meicetJustification: 'Kritická ochrana pooperačnej jazvy pred stmavnutím a prevencia solárnych lentíg.'
        }
      ] : [
        {
          step: 1,
          category: 'Jemné čistenie pórov',
          productName: 'SkinCeuticals Simply Clean Gél',
          brand: 'SkinCeuticals',
          activeIngredients: 'Aminokyseliny, ovocné kyseliny, harmanček a aloe vera',
          usage: 'Vytvoriť jemnú penu s vlažnou vodou, jemne masírovať 45 sekúnd, opláchnuť. Netrieť viečka!',
          purpose: 'Šetrné odstránenie mazu bez vysušenia kožnej bariéry a príprava na antioxidant.',
          price: 48,
          meicetJustification: 'Znížené skóre TEWL vyžaduje šetrný čistič s fyziologickým pH bez sulfátov.'
        },
        {
          step: 2,
          category: 'Klinický antioxidačný etalón',
          productName: 'SkinCeuticals C E Ferulic Sérum',
          brand: 'SkinCeuticals',
          activeIngredients: '15% čistá kyselina L-askorbová, 1% alfa-tokoferol, 0.5% kyselina ferulová',
          usage: '4-5 kvapiek ráno na suchú tvár a krk pred nanesením krému.',
          purpose: '8-násobná fotoprotekcia, neutralizácia voľných radikálov, zosvetlenie UV škvŕn a stimulácia kolagénu.',
          price: 175,
          meicetJustification: 'Kompenzácia zisteného skrytého fotopoškodenia v UV spektre Meicet (skóre 48/100).'
        },
        {
          step: 3,
          category: 'Hĺbkové hyalurónové sérum',
          productName: 'SkinCeuticals H.A. Intensifier',
          brand: 'SkinCeuticals',
          activeIngredients: 'Kyselina hyalurónová, 10% Proxylane™, extrakt z koreňa sladkého drievka a fialovej ryže',
          usage: '4-6 kvapiek vklepať do líc, čela a krku.',
          purpose: 'Zvýšenie hladiny kyseliny hyalurónovej v pleti o 30% a vyplnenie jemných vrások.',
          price: 118,
          meicetJustification: 'Riešenie kritickej dehydratácie zistenej na Meicet (skóre 44%) a podpora elasticity.'
        },
        {
          step: 4,
          category: 'Klinický lipidový krém 2:4:2',
          productName: 'SkinCeuticals Triple Lipid Restore 2:4:2',
          brand: 'SkinCeuticals',
          activeIngredients: '2% čisté ceramidy, 4% prírodný cholesterol, 2% mastné kyseliny',
          usage: 'Veľkosť hrášku jemne zahriať medzi prstami a vtlačiť do pleti tváre a dekoltu.',
          purpose: 'Patentovaný pomer na obnovu poškodenej kožnej bariéry a redukciu transepidermálnej straty vody.',
          price: 155,
          meicetJustification: 'Uzatvorenie vlhkosti v pokožke a redukcia TEWL (transepidermálnej straty vody).'
        },
        {
          step: 5,
          category: 'Širokospektrálna fotoprotekcia SPF 50+',
          productName: 'SkinCeuticals Ultra Facial Defense SPF 50+',
          brand: 'SkinCeuticals',
          activeIngredients: 'Mexoryl SX & XL fotostabilné filtre, vitamín E',
          usage: 'Aplikovať každé ráno 15 minút pred odchodom. Dôkladne prekryť oblasť jaziev viečok!',
          purpose: 'Komplexná ochrana pred UVA/UVB lúčmi, prevencia nových pigmentácií a stmavnutia jaziev.',
          price: 42,
          meicetJustification: 'Kritická ochrana pooperačnej jazvy pred stmavnutím a prevencia solárnych lentíg.'
        }
      ],
      evening: preferredTier === 'mid_end' ? [
        {
          step: 1,
          category: 'Večerné čistiace penenie',
          productName: 'CeraVe Čistiaci penivý gél (Foaming Cleanser)',
          brand: 'CeraVe',
          activeIngredients: '3 ceramidy, niacínamid, kyselina hyalurónová',
          usage: 'Vytvoriť penu, jemne umyť tvár od denného SPF a opláchnuť.',
          purpose: 'Dôkladné večerné odstránenie nečistôt a mazu bez pocitu pnutia.',
          price: 14.5,
          meicetJustification: 'Uvoľnenie pórov v T-zóne bez narušenia prirodzeného lipidového plášťa.'
        },
        {
          step: 2,
          category: 'Sérum proti pigmentovým škvrnám',
          productName: 'La Roche-Posay Mela B3 Sérum proti pigmentácii',
          brand: 'La Roche-Posay',
          activeIngredients: 'Melasyl™ (patentovaná molekula proti pigmentu), 10% niacínamid, LHA',
          usage: '3-4 kvapky večer na celú tvár pred aplikáciou krému.',
          purpose: 'Zachytenie prekurzorov melanínu a redukcia solárnych škvŕn a pozápalových stôp.',
          price: 44.5,
          meicetJustification: 'Cielené pôsobenie na subklinické UV pigmentácie zistené analyzátorom Meicet.'
        },
        {
          step: 3,
          category: 'Obnovujúce sérum s retinolom',
          productName: 'CeraVe Retinolové obnovujúce sérum (Resurfacing Retinol)',
          brand: 'CeraVe',
          activeIngredients: 'Enkapsulovaný retinol, extrakt z koreňa sladkého drievka, 3 ceramidy, niacínamid',
          usage: 'Aplikovať večer 2-3x týždenne. Vyhnúť sa priamej aplikácii na jazvu viečka!',
          purpose: 'Podpora bunkovej obnovy, zjemnenie pórov a zlepšenie hladkosti pleti.',
          price: 18.5,
          meicetJustification: 'Zamerané na omladenie zisteného biologického veku pleti (41 r.) a zjemnenie textúry.'
        },
        {
          step: 4,
          category: 'Intenzívny nočný regeneračný balzam',
          productName: 'La Roche-Posay Cicaplast Baume B5+ Obnovujúci balzam',
          brand: 'La Roche-Posay',
          activeIngredients: 'Madecassoside, 5% panthenol, Tribioma prebiotický komplex, meď, zinok',
          usage: 'Naniesť na celú tvár, hrubšia vrstva na oblasť jazvy viečka.',
          purpose: 'Urýchlenie obnovy kožnej bariéry, upokojenie erytému a optimálne zrenie jazvy.',
          price: 17.5,
          meicetJustification: 'Podpora epitelizácie a upokojenie citlivých cievnych zón zistených na Meicet.'
        }
      ] : [
        {
          step: 1,
          category: 'Večerné čistenie pleti',
          productName: 'SkinCeuticals Simply Clean Gél',
          brand: 'SkinCeuticals',
          activeIngredients: 'Aminokyseliny, glycerín a jemné botanické zložky',
          usage: 'Odstrániť denný SPF a nečistoty, opláchnuť vlažnou vodou a osušiť prikladaním uteráka.',
          purpose: 'Dokonale čistá pleť pripravená na nočnú regeneráciu.',
          price: 48,
          meicetJustification: 'Efektívne uvoľnenie pórov v T-zóne bez narušenia kožného filmu.'
        },
        {
          step: 2,
          category: 'Upokojujúce sérum na cievny erytém',
          productName: 'SkinCeuticals Phyto Corrective Gel',
          brand: 'SkinCeuticals',
          activeIngredients: 'Kyselina hyalurónová, botanické extrakty (uhorka, tymián, olivový list), morušovník',
          usage: '3-4 kvapky vklepať do začervenaných zón a líc.',
          purpose: 'Upokojenie reaktívnych cievnych zón, zmiernenie začervenania a zjednotenie tónu pleti.',
          price: 85,
          meicetJustification: 'Cielené riešenie reaktívneho cievneho erytému zisteného v spektre krížovej polarizácie.'
        },
        {
          step: 3,
          category: 'Bunková obnova & Retinoid',
          productName: 'SkinCeuticals Retinol 0.3 Obnovujúci nočný krém',
          brand: 'SkinCeuticals',
          activeIngredients: '0.3% čistý enkapsulovaný retinol, bisabolol, extrakt z boswellie',
          usage: 'Veľkosť hrášku 2-3x týždenne večer na suchú pleť. Vyhnúť sa jazve horných viečok!',
          purpose: 'Stimulácia kolagénovej syntézy, vyhladenie jemných vrások a zmenšenie priemeru pórov.',
          price: 98,
          meicetJustification: 'Zamerané na omladenie biologického veku pleti (41 r.) a normalizáciu keratinizácie.'
        },
        {
          step: 4,
          category: 'Intenzívny nočný regeneračný krém',
          productName: 'SkinCeuticals Triple Lipid Restore 2:4:2',
          brand: 'SkinCeuticals',
          activeIngredients: '2% ceramidy, 4% cholesterol, 2% mastné kyseliny',
          usage: 'Naniesť na celú tvár a krk ako záverečný nočný krok.',
          purpose: 'Hĺbková nočná obnova lipidového plášťa a kompenzácia účinku retinolu.',
          price: 155,
          meicetJustification: 'Maximálna regenerácia epidermy a zníženie citlivosti po aktívnych látkach.'
        }
      ],
      weeklyCare: preferredTier === 'mid_end' ? [
        '1x týždenne: CeraVe SA Zjemňujúci čistiaci gél s kyselinou salicylovou na šetrné uvoľnenie pórov v T-zóne.',
        '1x týždenne: Chladivý obklad s termálnou vodou La Roche-Posay na zmiernenie cievneho erytému.',
        'Každý víkend: Kontrola jazvy po blefaroplastike a jemná tlaková ischemická masáž.'
      ] : [
        '1x týždenne: Šetrná enzymatická exfoliácia a upokojujúca gélová kúra SkinCeuticals Phyto Corrective Masque.',
        '1x týždenne: Intenzívny nočný zábal Triple Lipid Restore 2:4:2 na dehydratované zóny líc.',
        'Každý víkend: Kontrola vyzrievania pooperačnej jazvy viečok (tlaková masáž).'
      ],
      seasonalTips: preferredTier === 'mid_end'
        ? 'V letnom období (máj - september) vynechať retinolové sérum a zamerať sa na Mela B3 sérum, hydratačný booster Minéral 89 a SPF 50+ Anthelios. V zime pridať Cicaplast Baume B5+ ako nočnú bariéru.'
        : 'V období od mája do septembra vymeniť nočný retinol za antioxidačné peptidy a Phyto Corrective Gel. V zime pridať nočný zábal s Triple Lipid Restore 2:4:2.'
    },
    scarProtocol: {
      hasScars: true,
      scarSummary: 'Pooperačná jazva po blefaroplastike horných viečok v 6. mesiaci hojenia. Jazva je v štádiu prebiehajúcej remodelácie kolagénu s viditeľným cievnym erytémom v spektre polarizovaného svetla.',
      dailyRoutine: {
        cleansing: 'Umývať viečka iba vlažnou vodou alebo fyziologickým roztokom, vyhnúť sa mydlu a drhnutiu.',
        siliconeTherapy: 'Aplikovať lekársky silikónový gél (Strataderm / Kelo-cote) 2x denne (ráno po vstrebaní séra a večer pred spaním) vo veľmi tenkej vrstve. Silikón udržiava ideálnu hydratáciu tkaniva a normalizuje produkciu kolagénu.',
        pressureMassage: 'Tlaková ischemická masáž: 3x denne po dobu 3-5 minút. Prstami jemne stlačiť jazvu proti očnicovej kosti do zblednutia (ischemizácia), podržať 10 sekúnd, uvoľniť a posunúť sa o kúsok ďalej. Nikdy jazvu nerozťahovať do šírky!',
        sunProtection: 'Striktná ochrana minerálnym filtrom SPF 50+ s oxidom zinočnatým každé ráno a pri pobyte vonku slnečné okuliare s UV400 filtrom. UV žiarenie v prvých 12-18 mesiacoch spôsobuje trvalú ireverzibilnú pigmentáciu jazvy!'
      },
      clinicalLaserTherapy: {
        recommendedProcedures: [
          'Cievny laser (Vaskulárny laser na uzavretie kapilár a elimináciu ružového zafarbenia jazvy)',
          'Kontrolné sedenie cievnym laserom po 4-6 týždňoch pre dosiahnutie rovnomerného tónu pleti'
        ],
        bestSeason: 'Cievny laser je optimálny na jeseň, v zime aj na jar (pri dôslednom krytí minerálnym SPF 50+)',
        precautions: 'Pred ošetrením cievnym laserom neopaľovať pokožku a po zákroku minimálne 4 týždne aplikovať minerálny SPF 50+ filter.'
      },
      warningSigns: [
        'Výrazné svrbenie, zhrubnutie alebo vyvýšenie jazvy nad úroveň kože (podozrenie na počínajúcu hypertrofiu – indikácia pre silikónovú náplasť alebo aplikáciu diprophosu).',
        'Zvýšená bolestivosť, opuch alebo hnisavý exsudát (ihneď kontaktovať ambulanciu SAY CLINIC).'
      ]
    },
    milestones: [
      {
        timeframe: 'Po 3 mesiacoch (Kontrola 1)',
        title: 'Overenie obnovy kožnej bariéry a cievneho erytému',
        focusArea: 'Hydratácia pleti a stav pooperačnej jazvy viečok',
        targetMetrics: 'Nárast hydratácie z 44% na >65%, zníženie cievneho indexu erytému o min. 25%, pokojná blednúca jazva.',
        rescanChecklist: [
          '3D spektrálny sken Meicet Pro-A (RGB, UV, Cross-Polarized)',
          'Kontrola turgoru a elasticity viečok',
          'Úprava letnej skincare rutiny a kontrola SPF fotoprotekcie'
        ]
      },
      {
        timeframe: 'Po 6 mesiacoch (Kontrola 2)',
        title: 'Post-letný fototoxický audit a plánovanie ošetrení cievnym laserom',
        focusArea: 'Cievny erytém, teleangiektázie v polarizovanom svetle a pripravenosť na cievny laser',
        targetMetrics: 'Stabilizované UV škvrny bez nových pigmentov, zmenšenie pórov o 20%, jazva viečka mäkká a normotrofická.',
        rescanChecklist: [
          'Meicet UV analýza podpovrchového melanínu',
          'Naplánovanie termínu cievneho lasera v kalendári sál SAY CLINIC',
          'Príprava pleti na ošetrenie cievnym laserom a fotoprotekcia'
        ]
      },
      {
        timeframe: 'Po 12 mesiacoch (Finálny audit ročného plánu)',
        title: 'Celkové klinické zhodnotenie a omladenie biologického veku',
        focusArea: 'Komplexný 360° profil pleti',
        targetMetrics: 'Zníženie Meicet veku pleti z 41 r. na ≤36 r., celkové skóre zdravia pleti nárast z 68 na >85 bodov.',
        rescanChecklist: [
          'Finálny porovnávací report Meicet Pro-A (Before vs After 12 mesiacov)',
          'Stanovenie udržiavacieho protokolu pre ďalší rok',
          'Vystavenie certifikátu zdravia pleti SAY CLINIC'
        ]
      }
    ],
    doctorNotes: 'Pacientka bola podrobne poučená o význame synergie medzi domácou starostlivosťou a klinickými ošetreniami. Zvláštny dôraz bol kladený na ochranu pooperačných jaziev viečok pred UV žiarením v jarnom a letnom období. Harmonogram ošetrení je synchronizovaný so sezónnymi bezpečnostnými pravidlami kliniky SAY CLINIC.',
    doctorName: 'MUDr. Ján Mráz',
    createdAt: new Date().toISOString()
  };
}
