export type FitzpatrickType = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';

export interface FitzpatrickInfo {
  type: FitzpatrickType;
  label: string;
  name: string;
  description: string;
  sunReaction: string;
  colorSwatch: string;
  cancerRisk: string;
}

export const FITZPATRICK_DATA: Record<FitzpatrickType, FitzpatrickInfo> = {
  'I': {
    type: 'I',
    label: 'Fototyp I',
    name: 'Keltský typ',
    description: 'Veľmi svetlá alabastrová pokožka, pehy, svetlé až ryšavé vlasy, svetlomodré/zelené oči.',
    sunReaction: 'Vždy sa spáli, nikdy sa neopáli. Extrémna fotosenzitivita.',
    colorSwatch: '#FDF2E9',
    cancerRisk: 'Veľmi vysoké riziko'
  },
  'II': {
    type: 'II',
    label: 'Fototyp II',
    name: 'Svetlý európsky typ',
    description: 'Svetlá pokožka, blond až svetlohnedé vlasy, modré, sivé alebo zelené oči.',
    sunReaction: 'Ľahko sa spáli, opáli sa minimálne / len sčervená.',
    colorSwatch: '#FDEBD0',
    cancerRisk: 'Vysoké riziko'
  },
  'III': {
    type: 'III',
    label: 'Fototyp III',
    name: 'Stredoeurópsky typ',
    description: 'Svetlohnedá až mierne snedá pokožka, tmavoplavé až hnedé vlasy, hnedé/sivé oči.',
    sunReaction: 'Občas sa spáli, postupne sa opáli do pekného hnedého odtieňa.',
    colorSwatch: '#FAD7A0',
    cancerRisk: 'Stredné riziko'
  },
  'IV': {
    type: 'IV',
    label: 'Fototyp IV',
    name: 'Stredomorský typ',
    description: 'Snedá olivová pokožka, tmavohnedé až čierne vlasy, tmavé oči.',
    sunReaction: 'Zriedka sa spáli, rýchlo a sýto sa opáli.',
    colorSwatch: '#EDBB99',
    cancerRisk: 'Mierne riziko'
  },
  'V': {
    type: 'V',
    label: 'Fototyp V',
    name: 'Tmavý typ',
    description: 'Tmavohnedá pokožka, tmavé oči aj vlasy (Blízky východ, India, Hispánsky pôvod).',
    sunReaction: 'Takmer nikdy sa nespáli, okamžitá a trvalá pigmentácia.',
    colorSwatch: '#D98880',
    cancerRisk: 'Nízke riziko'
  },
  'VI': {
    type: 'VI',
    label: 'Fototyp VI',
    name: 'Veľmi tmavý typ',
    description: 'Hlboko pigmentovaná tmavohnedá až čierna pokožka.',
    sunReaction: 'Nikdy sa nespáli, maximálna prirodzená fotoprotekcia melanínom.',
    colorSwatch: '#A04000',
    cancerRisk: 'Nízke riziko (pozor na akrálne lézie)'
  }
};

export interface DermLesion {
  id: string;
  location: string;
  sizeMm: string;
  asymmetry: 'Symetrická' | 'Asymetria v 1 osi' | 'Asymetria v 2 osiach';
  borders: 'Ostré a pravidelné' | 'Mierne nepravidelné' | 'Zúbkované / neostré / rozpité';
  color: 'Homogénna svetlohnedá' | 'Tmavohnedá' | 'Polychrómna (hnedá, čierna, ružová)' | 'Čierna' | 'Depigmentovaná' | 'Ružovo-červená / vaskulárna';
  diameterMm: string;
  evolution: 'Stabilný bez zmeny' | 'Novo vzniknutý prejav' | 'Rast / zväčšenie' | 'Zmena farby / okrajov' | 'Svrbenie / krvácanie / ulcerácia';
  dermoscopyFeatures: string[];
  conclusion: 'Benígny melanocytový névus' | 'Atypický (dysplastický) névus' | 'Suspektný malígny melanóm' | 'Suspektný bazocelulárny karcinóm (BCC)' | 'Suspektný spinocelulárny karcinóm (SCC)' | 'Seboroická keratóza' | 'Vaskulárna lézia (hemangióm)' | 'Dermatofibróm' | 'Iný benígny nález';
  recommendation: 'Pravidelné sledovanie (digitálna kontrola o 12 mes.)' | 'Kontrola o 3-6 mesiacov (krátkodobé digitálne sledovanie)' | 'Preventívna chirurgická excízia s bioptickým overením (histológia)' | 'Laserová ablácia / vaporizácia' | 'Kryodeštrukcia tekutým dusíkom' | 'Exstirpácia / kyretáž' | 'Bez nutnosti intervencie';
}

export interface DermDiagnosisItem {
  id: string;
  code: string;
  name: string;
}

export interface DermatologyExamData {
  // Anamnéza
  dermatologicOA: string;
  familyMelanoma: string;
  sunExposure: string;
  sunProtection: string;
  generalOA: string;
  allergies: string;
  medication: string;
  cave: string;

  // Fitzpatrick Fototyp
  fitzpatrick: FitzpatrickType;

  // Status dermatologicus localis & generalis
  skinHydration: string;
  skinTurgor: string;
  skinPhotodamage: string;
  skinDistribution: string;
  morphologyDescription: string;
  hairScalp: string;
  nails: string;
  mucosae: string;

  // Dermatoskopické vyšetrenie
  dermoscopySummary: string;
  neviCountCategory: string;
  examinedLesions: DermLesion[];

  // Diagnózy MKCH-10
  primaryDiagnosis: { code: string; name: string };
  secondaryDiagnoses: DermDiagnosisItem[];

  // Terapeutický plán, odporúčania a ordinácia
  localTherapy: string;
  systemicTherapy: string;
  dermocosmetics: string;
  regimeRecommendations: string;
  nextCheckup: string;
  performedProcedures: string;
}

export const COMMON_DERM_DIAGNOSES = [
  { code: 'Z01.8', name: 'Z01.8 - Preventívny celotelový dermatoskopický skríning névov' },
  { code: 'D22.9', name: 'D22.9 - Melanocytový névus, nešpecifikovaný' },
  { code: 'D22.5', name: 'D22.5 - Melanocytový névus trupu' },
  { code: 'D22.3', name: 'D22.3 - Melanocytový névus iných a nešpecifikovaných častí tváre' },
  { code: 'D22.4', name: 'D22.4 - Melanocytový névus vlasatej časti hlavy a krku' },
  { code: 'D22.6', name: 'D22.6 - Melanocytový névus horných končatín vrátane pleca' },
  { code: 'D22.7', name: 'D22.7 - Melanocytový névus dolných končatín vrátane bedra' },
  { code: 'L82', name: 'L82 - Seboroická keratóza (Seboroická veruka)' },
  { code: 'L57.0', name: 'L57.0 - Aktinická (solárna) keratóza' },
  { code: 'C43.9', name: 'C43.9 - Malígny melanóm kože, nešpecifikovaný' },
  { code: 'C44.9', name: 'C44.9 - Iný zhubný nádor kože (Bazocelulárny / spinocelulárny karcinóm)' },
  { code: 'D23.9', name: 'D23.9 - Iný nezhubný nádor kože' },
  { code: 'L70.0', name: 'L70.0 - Acne vulgaris (Akné)' },
  { code: 'L71.9', name: 'L71.9 - Rosacea (Ružovka), nešpecifikovaná' },
  { code: 'L40.0', name: 'L40.0 - Psoriasis vulgaris (Lupienka)' },
  { code: 'L20.9', name: 'L20.9 - Atopická dermatitída, nešpecifikovaná' },
  { code: 'L23.9', name: 'L23.9 - Kontaktná alergická dermatitída' },
  { code: 'L30.9', name: 'L30.9 - Dermatitída, nešpecifikovaná (Ekzém)' },
  { code: 'L21.9', name: 'L21.9 - Seboroická dermatitída' },
  { code: 'L63.9', name: 'L63.9 - Alopecia areata, nešpecifikovaná' },
  { code: 'L65.9', name: 'L65.9 - Nešpecifikované vypadávanie vlasov (Telogénne eflúvium)' },
  { code: 'B35.9', name: 'B35.9 - Dermatofytóza (Mykóza kože)' },
  { code: 'B07', name: 'B07 - Vírusové bradavice (Verrucae vulgares)' },
  { code: 'D18.0', name: 'D18.0 - Hemangióm kože a podkožia' },
  { code: 'I78.1', name: 'I78.1 - Pavúčikovitý névus / teleangiektázie' },
  { code: 'L81.4', name: 'L81.4 - Iná melanínová hyperpigmentácia (Chloasma / Melazma)' },
  { code: 'L90.5', name: 'L90.5 - Jazvovité stavy a fibróza kože (Hypertrofická jazva / keloid)' },
  { code: 'L91.0', name: 'L91.0 - Keloidná jazva' },
];

export const DERMOSCOPY_FEATURE_OPTIONS = [
  'Typická pravidelná pigmentová sieť',
  'Atypická nepravidelná sieť',
  'Homogénna hnedá pigmentácia',
  'Periférne pigmentové globuly a bodky',
  'Centrálne zhluky globúl',
  'Radiálne pruhy / pseudopódy',
  'Modrobiely závoj (blue-white veil)',
  'Regresné štruktúry / depigmentácia',
  'Bezštruktúrne ružové areály',
  'Bodkovité / glomerulárne cievy',
  'Arborizujúce (stromčekovité) cievne vetvenie',
  'Komedónom podobné otvory (kryptové ústia)',
  'Cerebriformný / gyroidný povrch',
  'Jadrové lakúny (červené / modročierne lagúny)',
  'Chrysalis / lesklé biele pruhy v polarizovanom svetle',
];

export const INITIAL_DERMATOLOGY_DATA: DermatologyExamData = {
  dermatologicOA: 'Neguje vážnejšie chronické kožné ochorenia v minulosti. Doteraz bez chirurgických excízií kožných lézií.',
  familyMelanoma: 'Negatívna. V rodine sa nevyskytol malígny melanóm ani iné kožné malignity.',
  sunExposure: 'Bežná rekreačná expozícia počas leta. V detstve bez výskytu závažného spálenia s pľuzgiermi. Soláriá nenavštevuje.',
  sunProtection: 'Uvádza nepravidelné používanie SPF krému (prevažne iba pri mori a v horách).',
  generalOA: 'Bez závažných interných ochorení.',
  allergies: 'Liekové a kontaktné alergie neguje.',
  medication: 'Bez trvalej medikácie.',
  cave: '',

  fitzpatrick: 'II',

  skinHydration: 'Normálna s miernou xerózou na predkoleniach',
  skinTurgor: 'Zachovaný, primeraná elasticita',
  skinPhotodamage: 'Glogau II (Mierne fotostarnutie, ojedinelé solárne lentigá ramien)',
  skinDistribution: 'Celotelový skríning znamienok (head-to-toe)',
  morphologyDescription: 'Koža intaktná, bledá, bez akútneho zápalového exantému. Prítomné diseminované benígne melanocytové névy prevažne trupu a končatín, veľkosti 2-5 mm, svetlohnedej až strednehonedej farby, bez známok ulcerácie či krvácania.',
  hairScalp: 'Kapilícium b.n.o., bez ložiskovej alopécie, bez erytému či deskvamácie.',
  nails: 'Nechtové platničky hladké, ružové, bez pozdĺžnych pigmentových pruhov a bez mykotických zmien.',
  mucosae: 'Viditeľné sliznice ružové, vlhké, intaktné, bez patologických lézií.',

  dermoscopySummary: 'Pri digitálnom dermatoskopickom vyšetrení celého tela (trup, končatiny, tvár, kapilícium) prevládajú benígne melanocytové névy s typickou homogénnou retikulárnou alebo globulárnou architektúrou. Všetky vyšetrené pigmentové lézie vykazujú benígny biologický charakter bez dermatoskopických kritérií malignity.',
  neviCountCategory: '20 – 50 névov',
  examinedLesions: [
    {
      id: 'lesion-1',
      location: 'Chrbát paravertebrálne vpravo (Th6)',
      sizeMm: '4 x 4 mm',
      asymmetry: 'Symetrická',
      borders: 'Ostré a pravidelné',
      color: 'Homogénna svetlohnedá',
      diameterMm: '4 mm',
      evolution: 'Stabilný bez zmeny',
      dermoscopyFeatures: ['Typická pravidelná pigmentová sieť', 'Centrálne zhluky globúl'],
      conclusion: 'Benígny melanocytový névus',
      recommendation: 'Pravidelné sledovanie (digitálna kontrola o 12 mes.)'
    },
    {
      id: 'lesion-2',
      location: 'Hrudník pod ľavou kľúčnou kosťou',
      sizeMm: '3 x 3 mm',
      asymmetry: 'Symetrická',
      borders: 'Ostré a pravidelné',
      color: 'Tmavohnedá',
      diameterMm: '3 mm',
      evolution: 'Stabilný bez zmeny',
      dermoscopyFeatures: ['Typická pravidelná pigmentová sieť'],
      conclusion: 'Benígny melanocytový névus',
      recommendation: 'Pravidelné sledovanie (digitálna kontrola o 12 mes.)'
    }
  ],

  primaryDiagnosis: {
    code: 'Z01.8',
    name: 'Z01.8 - Preventívny celotelový dermatoskopický skríning névov'
  },
  secondaryDiagnoses: [
    {
      id: 'sec-1',
      code: 'D22.5',
      name: 'D22.5 - Melanocytový névus trupu'
    }
  ],

  localTherapy: 'Lokálna terapia t.č. nie je indikovaná. Odporučená celotelová hydratácia po kúpeli.',
  systemicTherapy: 'Bez indikácie systémovej farmakoterapie.',
  dermocosmetics: 'Fotoprotektívna emulzia SPF 50+ širokospektrálna (UVA + UVB + HEV) denne na exponované partie (tvár, krk, dekolt, ruky). Bariérový hydratačný krém na telo s ceramidmi a kyselinou hyalurónovou.',
  regimeRecommendations: 'Striktná fotoprotekcia: minimalizovať pobyt na priamom poludňajšom slnku (11:00 - 15:00 hod.), fotoprotekcia SPF 50+, pokrývka hlavy, slnečné okuliare s UV400 filtrom. Úplný zákaz solárií. Pravidelné domáce samovyšetrovanie kože pacientom raz mesačne podľa pravidla ABCDE. V prípade vzniku nového prejavu, rýchleho rastu, zmeny farby, nepravidelnosti okrajov, svrbenia či spontánneho krvácania ihneď navštíviť dermatológa.',
  nextCheckup: 'Preventívna kontrola digitálnou dermatoskopiou o 12 mesiacov (alebo skôr v prípade akejkoľvek zmeny na koži).',
  performedProcedures: 'Dermatologické vyšetrenie celého tela, digitálna dermatoskopia pigmentových névov a kožných lézií, poučenie pacienta o fotoprotekcii a samovyšetrovaní.'
};

export interface DermPreset {
  id: string;
  title: string;
  subtitle: string;
  data: Partial<DermatologyExamData>;
}

export const DERMATOLOGY_PRESETS: DermPreset[] = [
  {
    id: 'preventive_screening',
    title: 'Preventívny skríning névov (Norma)',
    subtitle: 'Celotelová digitálna dermatoskopia, fototyp II/III, benígne pigmentové lézie',
    data: {
      fitzpatrick: 'II',
      primaryDiagnosis: { code: 'Z01.8', name: 'Z01.8 - Preventívny celotelový dermatoskopický skríning névov' },
      secondaryDiagnoses: [
        { id: 'p1-1', code: 'D22.5', name: 'D22.5 - Melanocytový névus trupu' },
        { id: 'p1-2', code: 'D22.9', name: 'D22.9 - Melanocytový névus, nešpecifikovaný' }
      ],
      dermoscopySummary: 'Celotelový dermatoskopický skríning pigmentových prejavov. Všetky vyšetrené névy majú typický benígny pigmentový vzorec s pravidelnou pigmentovou sieťou, bez známok malignity či atypie.',
      localTherapy: 'Lokálna liečba nie je potrebná.',
      regimeRecommendations: 'Dôsledná fotoprotekcia SPF 50+, vyhýbať sa poludňajšiemu slnku, zákaz návštev solárií. Samokontrola kože podľa pravidla ABCDE.',
      nextCheckup: 'Kontrola o 12 mesiacov - preventívna digitálna dermatoskopia celého tela.'
    }
  },
  {
    id: 'dysplastic_excision',
    title: 'Atypický névus / Indikácia na excíziu',
    subtitle: 'Suspektný dysplastický névus trupu s indikáciou na chirurgickú excíziu a histológiu',
    data: {
      fitzpatrick: 'I',
      primaryDiagnosis: { code: 'D22.5', name: 'D22.5 - Melanocytový névus trupu' },
      secondaryDiagnoses: [
        { id: 'p2-1', code: 'Z01.8', name: 'Z01.8 - Preventívny celotelový dermatoskopický skríning névov' },
        { id: 'p2-2', code: 'D22.9', name: 'D22.9 - Melanocytový névus, nešpecifikovaný' }
      ],
      dermoscopySummary: 'Pri dermatoskopii zistená jedna asymetrická pigmentová lézia na chrbte s nepravidelnou pigmentovou sieťou a ložiskovou hyperpigmentáciou (asymetria v 1 osi, zúbkované okraje, veľkosť 6 mm). Ostatné névy benígneho rázu.',
      examinedLesions: [
        {
          id: 'lesion-dysplastic-1',
          location: 'Chrbát paravertebrálne vľavo pod lopatkou',
          sizeMm: '6 x 5 mm',
          asymmetry: 'Asymetria v 1 osi',
          borders: 'Zúbkované / neostré / rozpité',
          color: 'Polychrómna (hnedá, čierna, ružová)',
          diameterMm: '6 mm',
          evolution: 'Rast / zväčšenie',
          dermoscopyFeatures: ['Atypická nepravidelná sieť', 'Periférne pigmentové globuly a bodky', 'Bezštruktúrne ružové areály'],
          conclusion: 'Atypický (dysplastický) névus',
          recommendation: 'Preventívna chirurgická excízia s bioptickým overením (histológia)'
        }
      ],
      localTherapy: 'Léziu mechanicky nedráždiť, nevystavovať UV žiareniu, neškrabať.',
      regimeRecommendations: 'Indikovaná profylaktická totálna chirurgická excízia in toto s bezpečnostným lemom zdravého tkaniva a odoslaním na histopatologické vyšetrenie (biopsia). Termín zákroku dohodnutý na plastickej chirurgii SAY CLINIC.',
      nextCheckup: 'Chirurgická excízia a následná kontrola po doručení výsledku definitívnej bioptickej histológie.'
    }
  },
  {
    id: 'acne_vulgaris',
    title: 'Acne vulgaris (Stredne ťažká forma)',
    subtitle: 'Zmiešaná komedonálna a papulopustulózna forma, fototyp II/III',
    data: {
      fitzpatrick: 'III',
      primaryDiagnosis: { code: 'L70.0', name: 'L70.0 - Acne vulgaris (Obyčajné akné)' },
      secondaryDiagnoses: [
        { id: 'p3-1', code: 'L21.9', name: 'L21.9 - Seboroická dermatitída' }
      ],
      skinHydration: 'Seborea (mastná)',
      morphologyDescription: 'Na tvári (čelo, nos, brada, líca) početné otvorené a uzavreté komedóny, zápalové erytematózne papuly a menšie pustuly. Ojedinelé postinflamatórne erytémy.',
      dermoscopySummary: 'Vyšetrené mazové žľazy, folikulárne hyperkeratózy, absencia podozrivých pigmentových lézií.',
      examinedLesions: [],
      localTherapy: 'Ráno: Lokálny gél s kyselinou azelaovou 15% / niacinamidom na celú tvár po očistení. Večer: Retinoidový krém (Adapalen 0.1%) v tenkej vrstve. Na zápalové pustuly lokálne klindamycín emulzia.',
      dermocosmetics: 'SAY Clinic čistiaci penivý gél s kyselinou salicylovou, nemastný nekomedogénny zmatňujúci fluid s SPF 50+ na deň.',
      regimeRecommendations: 'Nemanipulovať mechanicky so zápalovými léziami (vytláčanie vedie k jazvám a hyperpigmentáciám). Šetrná hygiena, bavlnené uteráky.',
      nextCheckup: 'Kontrola stavu o 6 týždňov na zhodnotenie tolerancie a účinku lokálnej terapie.'
    }
  },
  {
    id: 'rosacea',
    title: 'Rosacea erythematoteleangiectatica',
    subtitle: 'Cievna forma ružovky, teleangiektázie, fototyp I/II, hypersenzitívna pleť',
    data: {
      fitzpatrick: 'I',
      primaryDiagnosis: { code: 'L71.9', name: 'L71.9 - Rosacea (Ružovka), nešpecifikovaná' },
      secondaryDiagnoses: [
        { id: 'p4-1', code: 'I78.1', name: 'I78.1 - Pavúčikovitý névus / teleangiektázie' }
      ],
      skinHydration: 'Atopická / citlivá, sklon k flushing reakciám',
      morphologyDescription: 'Centrofaciálne (líca, nos) difúzny erytém s prítomnosťou vetvených teleangiektázií. Pokožka reaktívna, pocit pálenia pri zmene teplôt.',
      dermoscopySummary: 'Dermatoskopia tváre: výrazná dilatácia povrchových cievnych pletení, polygonálne cievne siete, bez folikulárnych zátok demodekózy.',
      examinedLesions: [],
      localTherapy: 'Ivermektín 10 mg/g krém 1x denne večer v tenkej vrstve. Lokálne metronidazol 0.75% gél ráno.',
      dermocosmetics: 'Upokojujúci antirougeurs fluid s minerálnym filtrom SPF 50+, termálna voda v spreji na zmiernenie flushingu. Vynechať agresívne peelingy a alkoholové toniká.',
      regimeRecommendations: 'Vylúčiť spúšťače: horúce jedlá, kofeín, alkohol, sauna, prudké zmeny teplôt. Striktná minerálna fotoprotekcia.',
      nextCheckup: 'Kontrolné dermatologické vyšetrenie o 2 mesiace (zváženie cievneho lasera / IPL v jesennom období).'
    }
  },
  {
    id: 'atopic_eczema',
    title: 'Atopická dermatitída (Exacerbácia)',
    subtitle: 'Xeróza, lichenifikácia, flexurálne ekzémové ložiská',
    data: {
      fitzpatrick: 'II',
      primaryDiagnosis: { code: 'L20.9', name: 'L20.9 - Atopická dermatitída, nešpecifikovaná' },
      secondaryDiagnoses: [
        { id: 'p5-1', code: 'L30.9', name: 'L30.9 - Dermatitída, nešpecifikovaná (Ekzém)' }
      ],
      skinHydration: 'Výrazná xeróza (extrémne suchá pokožka)',
      skinTurgor: 'Znížený, prítomné exkoriácie zo škriabania',
      morphologyDescription: 'V kubitálnych a podkolenných jamkách, na krku a zápästiach erytematózne ložiská s lichenifikáciou, deskvamáciou a stopami po škriabaní.',
      dermoscopySummary: 'Dermatoskopia ložísk: bodkovité cievky v difúznom červenom pozadí, biele jemné šupiny, absencia parazitárnych štruktúr.',
      examinedLesions: [],
      localTherapy: 'Akútna fáza (5-7 dní): Mometazon furoát krém 1x denne večer v tenkej vrstve na najaktívnejšie ložiská. Následne prechod na nesteroidný imunomodulátor (takrolimus 0.1% masť). Emolienciá nanášať do 3 minút po sprchovaní.',
      systemicTherapy: 'Antihistaminiká 2. generácie (napr. Levocetirizín 5 mg) večer pri výraznom nočnom prurite.',
      dermocosmetics: 'Relipidačný čistiaci olej bez mydla (Lipikar Syndet / CeraVe), balzam s obsahom ceramidov a niacínamidu 2-3x denne celotelovo.',
      regimeRecommendations: 'Krátka vlažná sprcha (nie horúci kúpeľ), bavlnený voľný odev, nestrihať nechty do špičky. Eliminácia prachových roztočov v spálni.',
      nextCheckup: 'Kontrolné vyšetrenie o 3 týždne na prehodnotenie ústupu akútneho zápalu.'
    }
  }
];
