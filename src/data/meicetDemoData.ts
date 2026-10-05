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
  birthNumber: string = '885512/6789'
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
        title: 'Laserový resurfacing, remodelácia jazvy & pigmentový detox',
        focus: 'Kľúčová laserová sezóna SAY CLINIC: frakčný laser na textúru a jazvu, depigmentácia po lete.',
        seasonalConsideration: 'Klesajúci UV index umožňuje aplikáciu vysokovýkonných frakčných a ablatívnych prístrojov.',
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
            name: 'Frakčný neablatívny / jemný CO2 laserový resurfacing',
            category: 'laser',
            targetArea: 'Jazvy horných viečok + lícne oblasti + periorálne vrásky',
            seasonOrMonth: 'Október',
            frequency: '1 sedenie',
            priority: 'vysoká',
            estimatedPrice: 380,
            reasoning: 'Kolagénová remodelácia vyzretej jazvy viečka na úplné splynutie s okolitou kožou a stiahnutie pórov.',
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
      morning: [
        {
          step: 1,
          category: 'Jemné čistenie',
          productName: 'Gentle Foaming Cleanser with Ceramides',
          brand: 'SkinCeuticals / CeraVe',
          activeIngredients: 'Ceramidy 1, 3, 6-II, Niacínamid 2%, Panthenol',
          usage: 'Naniesť na navlhčenú tvár, jemne masírovať 45 sekúnd, opláchnuť vlažnou vodou. Netrieť viečka!',
          purpose: 'Šetrné odstránenie nočného mazu bez poškodenia lipidovej bariéry.',
          price: 36,
          meicetJustification: 'Znížené skóre TEWL vyžaduje nulové sulfáty a zachovanie prirodzeného pH 5.5.'
        },
        {
          step: 2,
          category: 'Antioxidačný štít',
          productName: 'C E Ferulic Sérum 15%',
          brand: 'SkinCeuticals',
          activeIngredients: '15% L-kyselina askorbová, 1% Alfa-tokoferol, 0.5% Kyselina ferulová',
          usage: '4-5 kvapiek rozotrieť na suchú tvár a krk. Vyhnúť sa priamej aplikácii do vnútra oka.',
          purpose: 'Neutralizácia voľných radikálov, zosvetlenie UV škvŕn a podpora kolagénu.',
          price: 165,
          meicetJustification: 'Kompenzácia zisteného skrytého fotopoškodenia v UV spektre Meicet (skóre 48/100).'
        },
        {
          step: 3,
          category: 'Hydratačné a upokojujúce sérum',
          productName: 'Phyto Corrective Gel + HA Booster',
          brand: 'SkinCeuticals / Institut Esthederm',
          activeIngredients: 'Kyselina hyalurónová v rôznych molekulových hmotnostiach, extrakt z uhorky a tymiánu',
          usage: '3 kvapky vklepať do pleti pred nanesením krému.',
          purpose: 'Hĺbková hydratácia dermis a upokojenie erytému na lícach a viečkach.',
          price: 78,
          meicetJustification: 'Riešenie kritickej dehydratácie (skóre 44%) a reaktívneho cievneho začervenania.'
        },
        {
          step: 4,
          category: 'Bariérový ochranný krém',
          productName: 'Triple Lipid Restore 2:4:2',
          brand: 'SkinCeuticals / La Roche-Posay Toleriane Dermallergo',
          activeIngredients: '2% čisté ceramidy, 4% prírodný cholesterol, 2% mastné kyseliny',
          usage: 'Veľkosť hrášku jemne vtlačiť do pokožky tváre a dekoltu.',
          purpose: 'Obnova ochrannej bariéry, elasticita, zníženie citlivosti.',
          price: 135,
          meicetJustification: 'Uzatvorenie vlhkosti v pokožke a redukcia transepidermálnej straty vody.'
        },
        {
          step: 5,
          category: 'Širokospektrálny fotoprotektívny filter SPF 50+',
          productName: 'Mineral Radiance UV Defense SPF 50',
          brand: 'SkinCeuticals / Heliocare 360° Mineral Tolerance',
          activeIngredients: '100% minerálne filtre (Oxid titaničitý, Oxid zinočnatý), Fernblock, antioxidanty',
          usage: 'Aplikovať 15 minút pred odchodom z domu. Dôkladne prekryť aj oblasť jaziev viečok!',
          purpose: 'Absolútna ochrana pred UVA, UVB, infračerveným a HEV modrým svetlom.',
          price: 49,
          meicetJustification: 'Kritická ochrana pooperačnej jazvy pred stmavnutím a prevencia solárnych lentíg.'
        }
      ],
      evening: [
        {
          step: 1,
          category: 'Dvojité čistenie (1. krok)',
          productName: 'Micellar Oil Cleanser / Balzam',
          brand: 'Bioderma Sensibio Micellar Cleansing Oil',
          activeIngredients: 'Omega 3 a 6 mastné kyseliny, micely, vitamín E',
          usage: 'Naniesť na suchú pleť krúživými pohybmi na rozpustenie minerálneho SPF a make-upu, zmyť vodou.',
          purpose: 'Rozpustenie vodeodolných UV filtrov bez dráždenia jaziev.',
          price: 24,
          meicetJustification: 'Efektívne uvoľnenie pórov v T-zóne bez narušenia kožného filmu.'
        },
        {
          step: 2,
          category: 'Dvojité čistenie (2. krok)',
          productName: 'Soothing Cleanser Foam',
          brand: 'SkinCeuticals',
          activeIngredients: 'Orchideový a uhorkový extrakt, jemné tenzidy bez mydla',
          usage: 'Dôkladne dočistiť tvár, jemne osušiť čistým bavlneným uterákom len prikladaním.',
          purpose: 'Dokonale čistá pleť pripravená na absorpciu nočných aktívnych látok.',
          price: 42,
          meicetJustification: 'Zabezpečuje vysokú penetráciu nočnej regenerácie.'
        },
        {
          step: 3,
          category: 'Liečebné regeneračné sérum / Retinoid',
          productName: 'Retinal 0.05% Encapsulated / Azelaic Acid 10% Emulsion',
          brand: 'Medik8 Crystal Retinal 3 / Skinoren',
          activeIngredients: 'Stabilizovaný retinaldehyd 0.05%, Kyselina azelaová, Kyselina hyalurónová',
          usage: 'Aplikovať večer 3x týždenne (postupná tolerancia). Neaplikovať priamo na jazvy horných viečok!',
          purpose: 'Kolagénová novotvorba, zmenšenie priemeru pórov, normalizácia deskvamácie a cievneho tonusu.',
          price: 68,
          meicetJustification: 'Zamerané na omladenie zisteného biologického veku pleti z 41 r. a zjemnenie pórov.'
        },
        {
          step: 4,
          category: 'Intenzívny nočný regeneračný krém',
          productName: 'Cicaplast Baume B5+ / Epidermal Repair',
          brand: 'La Roche-Posay / SkinCeuticals',
          activeIngredients: 'Madecassoside, 5% Panthenol, Meď, Zinok, Mangán',
          usage: 'Rovnomerne naniesť na celú tvár a krk. Výdatnejšia vrstva na suché zóny líc.',
          purpose: 'Nočná akcelerácia obnovy buniek a protizápalový efekt.',
          price: 18,
          meicetJustification: 'Podpora epitelizácie a upokojenie citlivých cievnych zón zaznamenaných v spektre polarizácie.'
        }
      ],
      weeklyCare: [
        '1x týždenne: Enzýmový peeling bez abrazívnych zrniečok (napr. Papain & Bromelain) na uvoľnenie pórov v T-zóne.',
        '1x týždenne: Hydratačná gélová maska s bio-celulózou a kyselinou hyalurónovou vychladená v chladničke na úľavu od erytému.',
        'Každý víkend: Skontrolovať jemnosť jazvy po blefaroplastike – nesmie byť tvrdá ani vyvýšená.'
      ],
      seasonalTips: 'V období od mája do septembra vymeniť nočný retinal za sérum s kyselinou azelaovou a peptidmi. V zime pridať nočný skvalánový olej.'
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
          'Vaskulárny laser (Excel V / Nd:YAG 532nm / KTP): 1-2 sedenia na zrušenie ružového zafarbenia a kapilár.',
          'Frakčný CO2 / Erbiový laser v nízkej energii (jeseň): zjemnenie okrajov a dokonalé splynutie jazvy s reliéfom viečka.'
        ],
        bestSeason: 'Jeseň a zima (Október – Február) pre frakčný laser, vaskulárny laser je možný aj na jar pri dôslednom krytí.',
        precautions: 'Pred laserom overiť absenciu opálenia a po zákroku minimálne 4 týždne zákaz priameho slnenia.'
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
        title: 'Post-letný fototoxický audit a plánovanie laserov',
        focusArea: 'Hlboké pigmentácie v UV spektre a pripravenosť na frakčný laser',
        targetMetrics: 'Stabilizované UV škvrny bez nových pigmentov, zmenšenie pórov o 20%, jazva viečka mäkká a normotrofická.',
        rescanChecklist: [
          'Meicet UV analýza podpovrchového melanínu',
          'Naplánovanie termínu frakčného resurfacingu v kalendári sál SAY CLINIC',
          'Nasadenie predlaserovej prípravy s depigmentačnými zložkami'
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
