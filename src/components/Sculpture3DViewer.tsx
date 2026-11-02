'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { 
  Compass, 
  RotateCw, 
  Maximize2, 
  Activity, 
  Layers, 
  Search, 
  Plus, 
  Check, 
  Info, 
  Sparkles,
  ShieldAlert,
  Eye,
  Sliders,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import facialFatPadsClean from '../assets/images/facial_fat_pads_clean.png';

export type DrawingToolType = 'threads' | 'fanning' | 'point' | 'freehand' | 'rotate';

export interface VectorItem {
  id: string;
  type: 'vector' | 'threads' | 'fanning' | 'point' | 'freehand';
  color: string;
  start3D?: any;
  end3D?: any;
  points3D?: any[];
  fanningLines3D?: any[];
  startPoint?: { x: number; y: number };
  endPoint?: { x: number; y: number };
  points?: Array<{ x: number; y: number }>;
  fanningRays?: Array<{ x: number; y: number }>;
  view?: any;
  x?: number;
  y?: number;
  endX?: number;
  endY?: number;
  zoneName: string;
  productName: string;
  lotNumber?: string;
  details: string;
  units?: number;
  unitsUnit?: string;
  price?: number;
  rotationY?: number;
  createdAt?: string;
}

// =========================================================================
// 1. DATA: ANATOMICKÉ SVALY TVÁRE (ANATOMYNEXT 1 AŽ 23)
// =========================================================================
export interface AnatomicalMuscleChartItem {
  number: number;
  latinName: string;
  slovakName: string;
  color: string;
  category: 'upper' | 'mid' | 'lower' | 'chewing_neck';
  categoryLabel: string;
  functionDesc: string;
  clinicalApplication: string;
  recommendedMaterial: string;
  defaultDose: string;
}

export const ANATOMY_NEXT_MUSCLES: AnatomicalMuscleChartItem[] = [
  {
    number: 1,
    latinName: 'm. frontalis (venter frontalis)',
    slovakName: 'Čelový sval',
    color: '#4F46E5',
    category: 'upper',
    categoryLabel: 'Horná tretina (Čelo & Oči)',
    functionDesc: 'Zdvihnutie obočia, tvorba horizontálnych vrások čela',
    clinicalApplication: 'Aplikácia botulotoxínu (Dysport 30-50 Speywood U / Botox 10-20 IU). Dôležité zachovať bezpečnostný odstup 1.5 cm nad nadočnicovým oblúkom na prevenciu ptózy obočia.',
    recommendedMaterial: 'Dysport 300IU / Alluzience',
    defaultDose: '30-50 Speywood U'
  },
  {
    number: 2,
    latinName: 'm. temporalis & m. temporoparietalis',
    slovakName: 'Spánkový sval',
    color: '#10B981',
    category: 'chewing_neck',
    categoryLabel: 'Spánky & Žuvacie svaly',
    functionDesc: 'Elevácia a retrakcia mandibuly pri žuvaní',
    clinicalApplication: 'Výplň spánkovej atrofie (Sunken temples) kyselinou hyalurónovou alebo Radiesse na periost pomocou bolusovej techniky alebo kanyly 25G. Temporálny vektorový lifting.',
    recommendedMaterial: 'Radiesse (+) 1.5ml / Stylage XL',
    defaultDose: '0.5 - 1.0 ml na stranu'
  },
  {
    number: 3,
    latinName: 'm. procerus',
    slovakName: 'Pyramídový sval nosa',
    color: '#8B5CF6',
    category: 'upper',
    categoryLabel: 'Horná tretina (Čelo & Oči)',
    functionDesc: 'Ťahá mediálny pól obočia nadol, tvorí horizontálne vrásky koreňa nosa',
    clinicalApplication: 'Súčasť ošetrenia glately (vráska hnevu). Aplikuje sa 1 centrálny hlboký vpich do strednej čiary koreňa nosa.',
    recommendedMaterial: 'Dysport 300IU / Botox',
    defaultDose: '10-15 Speywood U'
  },
  {
    number: 4,
    latinName: 'm. corrugator supercilii',
    slovakName: 'Zvrašťovač obočia',
    color: '#7C3AED',
    category: 'upper',
    categoryLabel: 'Horná tretina (Čelo & Oči)',
    functionDesc: 'Ťahá obočie mediálne a kaudálne, vytvára vertikálne glabelárne ryhy',
    clinicalApplication: 'Kľúčový cieľ pri glabelárnych vráskach. Intramuskulárny hlboký vpich na mediálny pól, povrchový na laterálny chvost pre ochranu n. supraorbitalis.',
    recommendedMaterial: 'Dysport 300IU',
    defaultDose: '20-30 Speywood U'
  },
  {
    number: 5,
    latinName: 'm. orbicularis oculi',
    slovakName: 'Kruhový očný sval',
    color: '#84CC16',
    category: 'upper',
    categoryLabel: 'Horná tretina (Čelo & Oči)',
    functionDesc: 'Zovretie očných viečok (sfinkter očnice)',
    clinicalApplication: 'Periorbitálne vrásky (vejáriky - Crow’s feet), chemický brow-lift laterálneho konca obočia. Veľmi povrchové subkutánne papuly s odstupom 1 cm od kostnej orbity.',
    recommendedMaterial: 'Dysport 300IU / Botox',
    defaultDose: '20-30 Speywood U na stranu'
  },
  {
    number: 6,
    latinName: 'm. nasalis (pars transversa & alaris)',
    slovakName: 'Nosový sval',
    color: '#06B6D4',
    category: 'mid',
    categoryLabel: 'Stredná tretina (Nos & Líca)',
    functionDesc: 'Kompresia a dilatácia nosových krídel, tvorba Bunny lines',
    clinicalApplication: 'Ošetrenie zajačích vrások (Bunny lines) na chrbte nosa botulotoxínom. 1-2 U na každú stranu nosového chrbta.',
    recommendedMaterial: 'Botox / Dysport',
    defaultDose: '5-10 Speywood U'
  },
  {
    number: 7,
    latinName: 'm. levator labii superioris alaeque nasi (LLSAN)',
    slovakName: 'Zdvíhač hornej pery a krídla nosa',
    color: '#EF4444',
    category: 'mid',
    categoryLabel: 'Stredná tretina (Nos & Líca)',
    functionDesc: 'Zdvihnutie hornej pery a dilatácia nozdry',
    clinicalApplication: 'Korekcia ďasnového úsmevu (Gummy Smile) – presný mikrovpich 1-2 mm laterálne od alárneho záhybu (tzv. Yonsei bod). Dávka 2-3 Speywood U.',
    recommendedMaterial: 'Dysport / Botox',
    defaultDose: '2-4 U na stranu'
  },
  {
    number: 8,
    latinName: 'm. zygomaticus major',
    slovakName: 'Veľký jarmový sval',
    color: '#8B5CF6',
    category: 'mid',
    categoryLabel: 'Stredná tretina (Nos & Líca)',
    functionDesc: 'Ťahá kútik úst nahor a laterálne pri úsmeve',
    clinicalApplication: 'Anatomická báza lícneho objemu a vektorového liftingu. Kyselina hyalurónová / Radiesse sa aplikuje kanylou subkutánne alebo ihlou supraperiostálne pozdĺž svalového traktu.',
    recommendedMaterial: 'Radiesse (+) 1.5ml / Voluma',
    defaultDose: '0.5 - 1.0 ml na stranu'
  },
  {
    number: 9,
    latinName: 'm. risorius',
    slovakName: 'Smiechový sval',
    color: '#EC4899',
    category: 'mid',
    categoryLabel: 'Stredná tretina (Nos & Líca)',
    functionDesc: 'Laterálny ťah kútika úst',
    clinicalApplication: 'Pozor na neželanú parézu pri aplikácii do m. masseter – injekcia do masseteru musí byť striktne dorzálne od spojnice tragus-ústny kútik.',
    recommendedMaterial: 'Bezpečnostná anatomická zóna',
    defaultDose: 'Ochranná zóna'
  },
  {
    number: 10,
    latinName: 'm. levator labii superioris',
    slovakName: 'Zdvíhač hornej pery',
    color: '#F43F5E',
    category: 'mid',
    categoryLabel: 'Stredná tretina (Nos & Líca)',
    functionDesc: 'Zdvihnutie a everzia hornej pery',
    clinicalApplication: 'Podieľa sa na hĺbke nasolabiálnej ryhy; výplne sa umiestňujú prekraniálne alebo subkutánne kanylou bez priamej intramuskulárnej blokády.',
    recommendedMaterial: 'Kyselina hyalurónová (Belotero / Stylage)',
    defaultDose: '0.2 - 0.5 ml'
  },
  {
    number: 11,
    latinName: 'm. orbicularis oris',
    slovakName: 'Kruhový ústny sval',
    color: '#D97706',
    category: 'lower',
    categoryLabel: 'Dolná tretina & Pery',
    functionDesc: 'Zovretie a našpúlenie pier, sfinkter ústnej štrbiny',
    clinicalApplication: 'Lip Flip (neurotoxín 2-4 IU pozdĺž vermilionu), periorálne "fajčiarske" vrásky (kombinácia mikrodávky Botoxu a mäkkej výplne Kysse).',
    recommendedMaterial: 'Restylane Kysse / Dysport',
    defaultDose: '0.5 - 1.0 ml / 4 IU'
  },
  {
    number: 12,
    latinName: 'm. buccinator',
    slovakName: 'Trubačský sval',
    color: '#14B8A6',
    category: 'mid',
    categoryLabel: 'Stredná tretina (Nos & Líca)',
    functionDesc: 'Tlačí líce k zubom pri žuvaní a fúkaní',
    clinicalApplication: 'Hlboká svalová vrstva pod bukálnym tukovým vankúšom (Bichat). Dôležitá orientácia pri kanylovej aplikácii mezoterapie a biostimulácie.',
    recommendedMaterial: 'Profhilo H+L / Sculptra',
    defaultDose: 'Kanylový vejár'
  },
  {
    number: 13,
    latinName: 'm. depressor labii inferioris',
    slovakName: 'Sťahovač dolnej pery',
    color: '#F59E0B',
    category: 'lower',
    categoryLabel: 'Dolná tretina & Pery',
    functionDesc: 'Ťahá dolnú peru smerom nadol a mierne laterálne',
    clinicalApplication: 'Korekcia asymetrie úsmevu a dolnej pery po obojstrannej či jednostrannej paréze lícneho nervu.',
    recommendedMaterial: 'Botulotoxín',
    defaultDose: '2-4 U'
  },
  {
    number: 14,
    latinName: 'm. masseter',
    slovakName: 'Žuvací sval',
    color: '#B91C1C',
    category: 'chewing_neck',
    categoryLabel: 'Spánky & Žuvacie svaly',
    functionDesc: 'Silné privretie sánky (hlavný žuvací sval pozdĺž ramusu sánky)',
    clinicalApplication: 'Liečba bruxizmu (zatínanie a škrípanie zubov) a estetické zoštíhlenie sánky (V-Line Jawline Slimming). 25-50 IU na stranu do 3-4 hlbokých intramuskulárnych bodov pri sánkovom uhle.',
    recommendedMaterial: 'Dysport 300IU / Botox',
    defaultDose: '60-100 Speywood U na stranu'
  },
  {
    number: 15,
    latinName: 'm. mentalis',
    slovakName: 'Bradový sval',
    color: '#9333EA',
    category: 'lower',
    categoryLabel: 'Dolná tretina & Pery',
    functionDesc: 'Zdvihnutie a nariasenie kože brady (pomerančová brada)',
    clinicalApplication: 'Vyhladenie nerovností brady („golfová loptička“), mierna elevácia brady. 1-2 hlboké bolusy priamo do středu brady na periost.',
    recommendedMaterial: 'Dysport 300IU / Výplň brady',
    defaultDose: '10-15 Speywood U'
  },
  {
    number: 16,
    latinName: 'm. depressor anguli oris (DAO)',
    slovakName: 'Sťahovač kútika úst',
    color: '#65A30D',
    category: 'lower',
    categoryLabel: 'Dolná tretina & Pery',
    functionDesc: 'Ťahá kútik úst nadol (smútok, pokles kútikov)',
    clinicalApplication: 'Zdvihnutie poklesnutých ústnych kútikov a marionetových rýh. Povrchový vpich 1 cm laterálne a 1 cm kaudálne od kútika (2-3 U).',
    recommendedMaterial: 'Dysport 300IU / Botox',
    defaultDose: '2-4 U na stranu'
  },
  {
    number: 17,
    latinName: 'Platysma',
    slovakName: 'Podkožný krčný sval',
    color: '#475569',
    category: 'chewing_neck',
    categoryLabel: 'Spánky & Žuvacie svaly',
    functionDesc: 'Napína kožu krku, ťahá sánku a kútik nadol',
    clinicalApplication: 'Nefertiti lift – definícia mandibulárnej línie a vyhladenie vertikálnych platysmálnych pruhov (Platysmal bands) intradermálnymi mikroinjekciami.',
    recommendedMaterial: 'Dysport 300IU / Botox',
    defaultDose: '30-60 Speywood U'
  },
  {
    number: 18,
    latinName: 'm. depressor septi nasi',
    slovakName: 'Sťahovač nosovej priehradky',
    color: '#E11D48',
    category: 'mid',
    categoryLabel: 'Stredná tretina (Nos & Líca)',
    functionDesc: 'Ťahá hrot nosa nadol pri rozprávaní a úsmeve',
    clinicalApplication: 'Zdvihnutie padajúceho hrotu nosa (Drooping nasal tip) – aplikácia 2-4 IU priamo do kolumely/spina nasalis anterior.',
    recommendedMaterial: 'Botox / Dysport',
    defaultDose: '2-4 IU'
  },
  {
    number: 19,
    latinName: 'm. zygomaticus minor',
    slovakName: 'Malý jarmový sval',
    color: '#A855F7',
    category: 'mid',
    categoryLabel: 'Stredná tretina (Nos & Líca)',
    functionDesc: 'Zdvihnutie hornej pery, prehlbuje nasolabiálnu ryhu',
    clinicalApplication: 'Oblasť malárneho vankúšika (malar fat pad); podpora strednej tretiny tváre kyselinou hyalurónovou.',
    recommendedMaterial: 'Kyselina hyalurónová',
    defaultDose: '0.2 - 0.5 ml'
  },
  {
    number: 20,
    latinName: 'm. levator anguli oris',
    slovakName: 'Zdvíhač kútika úst',
    color: '#EAB308',
    category: 'mid',
    categoryLabel: 'Stredná tretina (Nos & Líca)',
    functionDesc: 'Zdvihnutie kútika úst',
    clinicalApplication: 'Hlboko pod levator labii superioris; modiolárny kotevný bod.',
    recommendedMaterial: 'Anatomický orientačný bod',
    defaultDose: 'Kotevná zóna'
  },
  {
    number: 21,
    latinName: 'Modiolus',
    slovakName: 'Uzol ústneho kútika',
    color: '#94A3B8',
    category: 'lower',
    categoryLabel: 'Dolná tretina & Pery',
    functionDesc: 'Fibromuskulárne prekríženie 6 mimických svalov',
    clinicalApplication: 'Kľúčový dynamický uzol tváre. Pozor na nadmernú rigiditu pri aplikácii výplní.',
    recommendedMaterial: 'Kľúčový dynamický uzol',
    defaultDose: 'Vyhnúť sa preplneniu'
  },
  {
    number: 22,
    latinName: 'Ductus parotideus & Corpus adiposum buccae',
    slovakName: 'Vývod príušnej žľazy & Bukálny tuk',
    color: '#FBBF24',
    category: 'mid',
    categoryLabel: 'Stredná tretina (Nos & Líca)',
    functionDesc: 'Žľazový a tukový priestor tváre',
    clinicalApplication: 'Bezpečnostná zóna pre kanylu; vyvarovať sa poškodeniu Stenonovho vývodu.',
    recommendedMaterial: 'Bezpečnostná zóna',
    defaultDose: 'Bezpečnostná orientácia'
  },
  {
    number: 23,
    latinName: 'Galea aponeurotica & Fascia temporalis',
    slovakName: 'Šľachovitá prilbica & Spánková fascia',
    color: '#4D7C0F',
    category: 'upper',
    categoryLabel: 'Horná tretina (Čelo & Oči)',
    functionDesc: 'Spája venter frontalis a occipitalis, ukotvenie mäkkých tkanív',
    clinicalApplication: 'Kotevná rovina pre nitový lifting (Aptos) a hlboké temporálne injekcie na periost.',
    recommendedMaterial: 'Aptos nite / Kotevný bod',
    defaultDose: 'Liftingové vektory'
  }
];

// =========================================================================
// 2. DATA: HLBOKÉ TUKOVÉ KOMPARTMENTY TVÁRE (DEEP FACIAL FAT PADS a - ii, T)
// =========================================================================
export interface FacialFatPadItem {
  number: number;
  code: string; // 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'ii', 'T'
  latinName: string;
  slovakName: string;
  englishName: string;
  layer: 'deep' | 'superficial';
  layerLabel: string;
  pinPosition: { x: number; y: number }; // Percentage position on the visualizer
  color: string;
  agingImpact: string;
  aestheticSolution: string;
  recommendedTechnique: string;
  recommendedMaterial: string;
  defaultDose: string;
}

export const FACIAL_FAT_PADS: FacialFatPadItem[] = [
  {
    number: 1,
    code: 'a',
    latinName: 'Corpus adiposum supraorbitale profundum (ROOF)',
    slovakName: 'a: Nadočnicový hlboký tuk (ROOF)',
    englishName: 'Retro-orbicularis oculi fat (ROOF)',
    layer: 'deep',
    layerLabel: 'Hlboký kompartment (Deep / Layer 4)',
    pinPosition: { x: 64.5, y: 36.6 },
    color: '#F59E0B',
    agingImpact: 'Leží na supraorbitálnom okraji čelovej kosti pod m. orbicularis oculi. Úbytok spôsobuje skeletonizáciu očnice, prepadnutie obočia a pseudoptózu horného viečka.',
    aestheticSolution: 'Mikro-bolusy jemnej kyseliny hyalurónovej kanylou 27G priamo na nadočnicový periost + chemický brow-lift botulotoxínom.',
    recommendedTechnique: 'Kanyla 27G na periost / Supraperiostálny mikrobolus',
    recommendedMaterial: 'Belotero Balance / Stylage S',
    defaultDose: '0.1 - 0.2 ml na stranu'
  },
  {
    number: 2,
    code: 'b',
    latinName: 'Processus temporalis corporis adiposi buccae',
    slovakName: 'b: Spánkový výbežok Bichatovho tuku',
    englishName: 'Temporal extension of buccal fat pad',
    layer: 'deep',
    layerLabel: 'Hlboký kompartment (Deep / Layer 4)',
    pinPosition: { x: 45.5, y: 61.0 },
    color: '#D97706',
    agingImpact: 'Výbežok zasahuje retrozygoticky popri m. masseter a šľache m. temporalis. Zmeny ovplyvňujú prechod strednej tretiny a spánkovej jamy.',
    aestheticSolution: 'Pri atrofii hlboká volumizácia na periost; pri hypertrofii a ochabnutí lifting líca a SMAS biostimulácia.',
    recommendedTechnique: 'Kanyla 25G hlboko retrozygoticky na kosť',
    recommendedMaterial: 'Radiesse (+) 1.5ml / Stylage XL',
    defaultDose: '0.3 - 0.5 ml na stranu'
  },
  {
    number: 3,
    code: 'c',
    latinName: 'SOOF laterale (Sub-orbicularis oculi fat - lateral)',
    slovakName: 'c: Laterálny podorbitálny tuk (SOOF)',
    englishName: 'Lateral sub-orbicularis oculi fat (Lateral SOOF)',
    layer: 'deep',
    layerLabel: 'Hlboký kompartment (Deep / Layer 4)',
    pinPosition: { x: 56.8, y: 54.5 },
    color: '#EA580C',
    agingImpact: 'Kryje laterálny infraorbitálny okraj a os zygomaticum. Atrofia odhaľuje kostný okraj očnice a prehlbuje laterálnu očnicovo-líčnu ryhu.',
    aestheticSolution: 'Hlboká supraperiostálna aplikácia kanylou 27G na kosť. Obnovuje plynulý prechod viečka a líca (lid-cheek junction).',
    recommendedTechnique: 'Kanyla 27G supraperiostálne na os zygomaticum',
    recommendedMaterial: 'Teosyal Redensity II / Restylane Lyft',
    defaultDose: '0.2 - 0.4 ml na stranu'
  },
  {
    number: 4,
    code: 'd',
    latinName: 'SOOF mediale (Sub-orbicularis oculi fat - medial)',
    slovakName: 'd: Mediálny podorbitálny tuk (SOOF)',
    englishName: 'Medial sub-orbicularis oculi fat (Medial SOOF)',
    layer: 'deep',
    layerLabel: 'Hlboký kompartment (Deep / Layer 4)',
    pinPosition: { x: 66.2, y: 57.1 },
    color: '#C2410C',
    agingImpact: 'Zodpovedá za oporu dolného viečka a slznej ryhy (Tear Trough). Atrofia tvorí tmavé kruhy, hlboké prepadliny a permanentne unavený výraz.',
    aestheticSolution: 'Zlatý štandard estetickej medicíny: presný pre-periosteálny mikrodepozit mäkkej kohezívnej kyseliny hyalurónovej kanylou 27G priamo na kosť pod n. infraorbitalis.',
    recommendedTechnique: 'Kanyla 27G supraperiostálne priamo na maxilu',
    recommendedMaterial: 'Teosyal Redensity II / Belotero Soft',
    defaultDose: '0.2 - 0.3 ml na stranu'
  },
  {
    number: 5,
    code: 'e',
    latinName: 'Corpus adiposum buccae (Bichat - hlavné telo)',
    slovakName: 'e: Bichatov tuk (Hlavné telo)',
    englishName: 'Buccal fat pad body (Bichat)',
    layer: 'deep',
    layerLabel: 'Hlboký kompartment (Deep / Layer 4)',
    pinPosition: { x: 52.9, y: 66.5 },
    color: '#B45309',
    agingImpact: 'Veľké zapuzdrené hlboké tukové teleso medzi m. masseter a m. buccinator. Pri starnutí klesá a prispieva k ťažkosti dolnej tretiny; u mladších tvorí širokú tvár.',
    aestheticSolution: 'Bichektómia (parciálna chirurgická resekcia pre "V-shape" modeláciu), alebo cielené RF spevnenie okolitých štruktúr.',
    recommendedTechnique: 'Chirurgická extrakcia / RF spevnenie fascie',
    recommendedMaterial: 'Chirurgická bichektómia / Morpheus8',
    defaultDose: 'Individuálna indikácia'
  },
  {
    number: 6,
    code: 'f',
    latinName: 'Corpus adiposum genae mediale profundum (DMCF)',
    slovakName: 'f: Hlboký mediálny lícny tuk (DMCF)',
    englishName: 'Deep medial cheek fat pad (DMCF)',
    layer: 'deep',
    layerLabel: 'Hlboký kompartment (Deep / Layer 4)',
    pinPosition: { x: 63.9, y: 65.8 },
    color: '#92400E',
    agingImpact: 'Hlavný pilier mladistvej prednej projekcie líc (anterior malar projection). Úbytok DMCF je primárnou príčinou prepadnutia tváre a sekundárneho vzniku nosoústnej ryhy.',
    aestheticSolution: 'Základný bod tekutého faceliftu (MD Codes / Dr. Cotofana protocol). Hlboké bolusy vysoko-G-prime výplne (Voluma / Radiesse) priamo na maxilárny periost.',
    recommendedTechnique: 'Ihla 27G kolmo na periost / Kanyla 25G',
    recommendedMaterial: 'Juvéderm Voluma / Radiesse (+) 1.5ml',
    defaultDose: '0.5 - 1.0 ml na stranu'
  },
  {
    number: 7,
    code: 'g',
    latinName: 'Spatium pyriforme profundum (Deep Pyriform Fat)',
    slovakName: 'g: Hlboký pyriformný tukový priestor',
    englishName: 'Deep pyriform space fat pad',
    layer: 'deep',
    layerLabel: 'Hlboký kompartment (Deep / Layer 4)',
    pinPosition: { x: 73.6, y: 61.4 },
    color: '#D97706',
    agingImpact: 'Leží na maxile priamo pri okraji pyriformnej apertúry nosa pod a. angularis. Resorpcia kosti a úbytok tohto tuku vťahuje nosné krídlo a spôsobuje hlboký koreň nosoústnej ryhy.',
    aestheticSolution: 'Injekcia do hlbokého pyriformného priestoru (Fossa pyriformis) na kosť. Poskytuje prednú oporu bázy nosa, mierny zdvih špičky a zjemnenie začiatku nosoústnej ryhy.',
    recommendedTechnique: 'Ihla 27G na kosť s prísnou aspiráciou (a. facialis/angularis)',
    recommendedMaterial: 'Restylane Lyft / Saypha Volume',
    defaultDose: '0.2 - 0.4 ml na stranu'
  },
  {
    number: 8,
    code: 'h',
    latinName: 'Corpus adiposum labiale superius profundum / Fossa canina',
    slovakName: 'h: Hlboký tuk psej jamy & periorálu',
    englishName: 'Deep superior labial / Canine fossa fat pad',
    layer: 'deep',
    layerLabel: 'Hlboký kompartment (Deep / Layer 4)',
    pinPosition: { x: 71.7, y: 67.1 },
    color: '#B45309',
    agingImpact: 'Vypĺňa jamu fossa canina a oporu pod hornou perou. Atrofia spôsobuje prepad horného periorálneho priestoru a strmý sklon hornej pery.',
    aestheticSolution: 'Jemná periostálna volumizácia canine fossa a podopretie bázy nosa a filtra.',
    recommendedTechnique: 'Kanyla 27G supraperiostálne',
    recommendedMaterial: 'Belotero Balance / Stylage M',
    defaultDose: '0.2 - 0.3 ml'
  },
  {
    number: 9,
    code: 'i',
    latinName: 'Corpus adiposum mentale profundum',
    slovakName: 'i: Hlboký bradový tukový kompartment',
    englishName: 'Deep mental fat pad',
    layer: 'deep',
    layerLabel: 'Hlboký kompartment (Deep / Layer 4)',
    pinPosition: { x: 79.3, y: 85.8 },
    color: '#7C3AED',
    agingImpact: 'Leží priamo na symfýze mandibuly pod m. mentalis. Resorpcia spôsobuje retrúziu brady, skrátenie dolnej tretiny a hyperaktivitu bradového svalu (pomarančová brada).',
    aestheticSolution: 'Augmentácia a predĺženie brady bolusom na kosť (Pogonion & Gnathion) pre obnovu pomerov profilu a ideálneho E-line.',
    recommendedTechnique: 'Ihla 27G kolmo na periost s aspiráciou',
    recommendedMaterial: 'Radiesse (+) 1.5ml / Juvéderm Volux',
    defaultDose: '0.5 - 1.0 ml'
  },
  {
    number: 10,
    code: 'ii',
    latinName: 'Corpus adiposum mentale laterale / Pre-jowl sulcus profundum',
    slovakName: 'ii: Hlboký pred-syslíkový tuk (Pre-jowl sulcus)',
    englishName: 'Deep lateral mental / Pre-jowl sulcus fat pad',
    layer: 'deep',
    layerLabel: 'Hlboký kompartment (Deep / Layer 4)',
    pinPosition: { x: 67.8, y: 85.0 },
    color: '#9333EA',
    agingImpact: 'Depresia pred sánkovým uhlom. V kombinácii s ptózou povrchového jowl tuku vytvára výrazné prerušenie mandibulárnej línie.',
    aestheticSolution: 'Hlboká výplň sulcus praejowalis na periost mandibuly – vyrovná líniu sánky bez optického zväčšenia tváre.',
    recommendedTechnique: 'Kanyla 25G / Ihla na periost mandibuly',
    recommendedMaterial: 'Radiesse (+) / Juvéderm Volux',
    defaultDose: '0.3 - 0.5 ml na stranu'
  },
  {
    number: 11,
    code: 'T',
    latinName: 'Corpus adiposum temporale profundum',
    slovakName: 'T: Hlboký spánkový tuk (Temporal Deep)',
    englishName: 'Deep temporal fat pad',
    layer: 'deep',
    layerLabel: 'Hlboký kompartment (Deep / Layer 4)',
    pinPosition: { x: 44.8, y: 47.5 },
    color: '#CA8A04',
    agingImpact: 'Leží pod hlbokou temporálnou fasciou priamo na čelovo-spánkovej kosti. Atrofia spôsobuje typickú temporálnu konkavitu (kostnatý výraz spánkov).',
    aestheticSolution: 'Hlboká supraperiostálna aplikácia do spánkovej jamy (Gunshot technika alebo kanyla), čím sa dosiahne aj nepriamy brow-lift.',
    recommendedTechnique: 'Ihla 27G kolmo na kosť 1 cm nad lícny oblúk',
    recommendedMaterial: 'Radiesse (+) 1.5ml / Stylage XL / Sculptra',
    defaultDose: '0.5 - 1.0 ml na stranu'
  }
];

export interface Sculpture3DViewerProps {
  vectors?: VectorItem[] | any[];
  onVectorsChange?: (vectors: any[]) => void;
  activeTool?: DrawingToolType | string;
  onSelectTool?: (tool: any) => void;
  activeColor?: string;
  onSelectColor?: (color: string) => void;
  currentProduct?: { name: string; lot?: string; type: string; unit?: string };
  selectedVectorId?: string | null;
  onSelectVector?: (id: string | null) => void;
  onSnapshot?: (dataUrl: string) => void;
  onAddMuscleProcedure?: (muscle: AnatomicalMuscleChartItem) => void;
  onAddFatPadProcedure?: (fatPad: FacialFatPadItem) => void;
  readOnly?: boolean;
}

export function Sculpture3DViewer({
  onAddMuscleProcedure,
  onAddFatPadProcedure,
  readOnly = false
}: Sculpture3DViewerProps) {
  // ANATOMICAL LAYER TOGGLE: 'muscles' (AnatomyNext) vs 'fat_pads' (Facial Fat Compartments)
  const [anatomyLayer, setAnatomyLayer] = useState<'muscles' | 'fat_pads'>('fat_pads');

  // MUSCLES STATE
  const [selectedMuscleNumber, setSelectedMuscleNumber] = useState<number>(14); // Default to m. masseter
  const [muscleSearchQuery, setMuscleSearchQuery] = useState('');
  const [selectedMuscleCategory, setSelectedMuscleCategory] = useState<'all' | 'upper' | 'mid' | 'lower' | 'chewing_neck'>('all');

  // FAT PADS STATE
  const [selectedFatPadNumber, setSelectedFatPadNumber] = useState<number>(6); // Default to f (Deep Medial Cheek)
  const [fatPadSearchQuery, setFatPadSearchQuery] = useState('');
  const [selectedFatLayer, setSelectedFatLayer] = useState<'all' | 'deep' | 'superficial'>('all');

  // 3D TILT & PARALLAX STATE
  const [is3DParallax, setIs3DParallax] = useState(true);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const imageViewportRef = useRef<HTMLDivElement>(null);

  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!is3DParallax || !imageViewportRef.current) return;
    setIsHoveringImage(true);
    const rect = imageViewportRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      x: -y * 22, // Tilt X
      y: x * 26   // Tilt Y
    });
  };

  const handleImageMouseLeave = () => {
    setIsHoveringImage(false);
    setTilt({ x: 0, y: 0 });
  };

  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedMuscle = ANATOMY_NEXT_MUSCLES.find(m => m.number === selectedMuscleNumber) || ANATOMY_NEXT_MUSCLES[0];
  const selectedFatPad = FACIAL_FAT_PADS.find(f => f.number === selectedFatPadNumber) || FACIAL_FAT_PADS[0];

  const filteredMuscles = ANATOMY_NEXT_MUSCLES.filter(m => {
    const matchesCat = selectedMuscleCategory === 'all' || m.category === selectedMuscleCategory;
    const matchesSearch = 
      m.latinName.toLowerCase().includes(muscleSearchQuery.toLowerCase()) ||
      m.slovakName.toLowerCase().includes(muscleSearchQuery.toLowerCase()) ||
      m.clinicalApplication.toLowerCase().includes(muscleSearchQuery.toLowerCase()) ||
      m.number.toString().includes(muscleSearchQuery);
    return matchesCat && matchesSearch;
  });

  const filteredFatPads = FACIAL_FAT_PADS.filter(f => {
    const matchesLayer = selectedFatLayer === 'all' || f.layer === selectedFatLayer;
    const matchesSearch = 
      f.latinName.toLowerCase().includes(fatPadSearchQuery.toLowerCase()) ||
      f.slovakName.toLowerCase().includes(fatPadSearchQuery.toLowerCase()) ||
      f.englishName.toLowerCase().includes(fatPadSearchQuery.toLowerCase()) ||
      f.code.toLowerCase().includes(fatPadSearchQuery.toLowerCase()) ||
      f.aestheticSolution.toLowerCase().includes(fatPadSearchQuery.toLowerCase()) ||
      f.number.toString().includes(fatPadSearchQuery);
    return matchesLayer && matchesSearch;
  });

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col items-center w-full space-y-4">
      
      {/* 1. PRIMARY ANATOMICAL LAYER SWITCHER: SVALY (MUSCLES) vs TUKOVÉ VANKÚŠIKY (FAT PADS) */}
      <div className="flex items-center p-1 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] shadow-2xs">
        <button
          type="button"
          onClick={() => setAnatomyLayer('fat_pads')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            anatomyLayer === 'fat_pads'
              ? 'bg-[#D97706] text-white shadow-xs'
              : 'text-[#8C857B] hover:text-[#2C2A29]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Hlboké tukové kompartmenty (Fat Pads a–ii)</span>
        </button>

        <button
          type="button"
          onClick={() => setAnatomyLayer('muscles')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            anatomyLayer === 'muscles'
              ? 'bg-[#BE123C] text-white shadow-xs'
              : 'text-[#8C857B] hover:text-[#2C2A29]'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Svaly tváre (AnatomyNext 3D)</span>
        </button>
      </div>

      {/* 2. MAIN 3D / ANATOMICAL VIEWPORT */}
      <div className="relative w-full max-w-[560px] aspect-[4/5] rounded-3xl overflow-hidden border border-[#E8E2D9] shadow-2xl bg-gradient-to-b from-[#FAF8F5] via-[#F4EEE6] to-[#E9E1D5] select-none group">
        
        {/* VIEW A: TUKOVÉ KOMPARTMENTY (FAT PADS S 3D TILT PARALLAXOM) */}
        {anatomyLayer === 'fat_pads' && (
          <div 
            ref={imageViewportRef}
            onMouseMove={handleImageMouseMove}
            onMouseLeave={handleImageMouseLeave}
            className="relative w-full h-full flex items-center justify-center bg-[#FAF8F5] overflow-hidden [perspective:1000px]"
          >
            <div 
              className="relative w-full h-full flex items-center justify-center"
              style={{
                transform: is3DParallax 
                  ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(${isHoveringImage ? 1.03 : 1}, ${isHoveringImage ? 1.03 : 1}, 1)` 
                  : 'none',
                transformStyle: 'preserve-3d',
                transition: isHoveringImage ? 'transform 0.08s ease-out' : 'transform 0.5s ease-out',
              }}
            >
              <Image
                src={facialFatPadsClean}
                alt="Facial Fat Pads Anatomy 3D Render"
                className="w-full h-full object-contain pointer-events-none select-none drop-shadow-md"
                priority
              />

              {/* DYNAMIC SPECULAR LIGHTING SHEEN WHEN 3D TILT IS ACTIVE */}
              {is3DParallax && isHoveringImage && (
                <div 
                  className="absolute inset-0 pointer-events-none mix-blend-overlay transition-opacity duration-200"
                  style={{
                    background: `radial-gradient(circle at ${50 + (tilt.y / 26) * 35}% ${50 - (tilt.x / 24) * 35}%, rgba(255,255,255,0.45) 0%, transparent 65%)`
                  }}
                />
              )}

              {/* INTERACTIVE GLOWING PINS a TO ii + T */}
              {FACIAL_FAT_PADS.map((pad) => {
                const isSelected = selectedFatPadNumber === pad.number;
                return (
                  <button
                    key={pad.code}
                    type="button"
                    onClick={() => setSelectedFatPadNumber(pad.number)}
                    style={{
                      left: `${pad.pinPosition.x}%`,
                      top: `${pad.pinPosition.y}%`,
                      transform: is3DParallax 
                        ? 'translate(-50%, -50%) translateZ(32px)' 
                        : 'translate(-50%, -50%)',
                      transformStyle: 'preserve-3d',
                    }}
                    className={`absolute z-20 flex items-center justify-center rounded-full transition-all cursor-pointer group/pin ${
                      isSelected
                        ? 'w-7 h-7 bg-[#D97706] text-white ring-4 ring-[#FDE68A] shadow-xl scale-110'
                        : 'w-6 h-6 bg-white/95 text-[#2C2A29] hover:bg-[#D97706] hover:text-white border border-[#D97706]/70 shadow-md hover:scale-115'
                    }`}
                    title={`${pad.code}: ${pad.slovakName} (${pad.layerLabel})`}
                  >
                    <span className="text-[11px] font-black uppercase tracking-tight">{pad.code}</span>

                    {/* MINI HOVER BADGE */}
                    <div className="absolute left-1/2 -top-8 -translate-x-1/2 opacity-0 group-hover/pin:opacity-100 pointer-events-none transition-opacity px-2 py-0.5 rounded-lg bg-[#2C2A29] text-white text-[10px] font-bold whitespace-nowrap shadow-md z-30">
                      {pad.code}: {pad.slovakName.replace(/^[a-zT]+:\s*/i, '')}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* TOP BADGE */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/95 backdrop-blur-md border border-white/80 shadow-sm text-[11px] font-bold text-[#2C2A29] pointer-events-none">
              <Layers className="w-3.5 h-3.5 text-[#D97706]" />
              <span>Hlboké tukové kompartmenty (a – ii)</span>
            </div>

            {/* 3D TILT TOGGLE BADGE */}
            <div className="absolute top-4 right-14 z-20 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIs3DParallax(!is3DParallax)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-2xl backdrop-blur-md border text-[10px] font-bold transition-all shadow-sm cursor-pointer ${
                  is3DParallax
                    ? 'bg-[#D97706] text-white border-[#D97706]'
                    : 'bg-white/95 text-[#6B7280] border-white/80 hover:text-[#2C2A29]'
                }`}
                title="Zapnúť / vypnúť priestorový 3D parallax a náklon"
              >
                <Sparkles className="w-3 h-3" />
                <span>{is3DParallax ? '3D Parallax: ZAP' : '3D Parallax: VYP'}</span>
              </button>
            </div>

            {/* BOTTOM INSTRUCTION */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#2C2A29]/85 backdrop-blur-md text-white/90 text-[11px] pointer-events-none shadow-md border border-white/15 whitespace-nowrap">
              <Sparkles className="w-3.5 h-3.5 text-[#FBBF24]" />
              <span>Pohybujte myšou pre 3D náklon • Kliknite na body a až ii</span>
            </div>
          </div>
        )}

        {/* VIEW B: SVALY TVÁRE (ANATOMYNEXT 3D) */}
        {anatomyLayer === 'muscles' && (
          <div className="relative w-full h-full">
            <iframe
              title="Colourcoded head muscle chart - AnatomyNext"
              src="https://sketchfab.com/models/8c1bcc3685cd40b3bd6b42e0445522a5/embed?autostart=1&internal=1&ui_controls=1&ui_infos=0&ui_inspector=0&ui_stop=0&ui_watermark=0&ui_hint=0"
              className="absolute inset-0 w-full h-full border-0 rounded-3xl"
              allow="autoplay; fullscreen; xr-spatial-tracking; execution-while-out-of-viewport; execution-while-not-rendered; web-share"
              allowFullScreen
            />

            {/* TOP OVERLAYS */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/95 backdrop-blur-md border border-white/80 shadow-sm text-[11px] font-bold text-[#2C2A29] pointer-events-none">
              <Activity className="w-3.5 h-3.5 text-[#BE123C]" />
              <span>3D Anatomický Atlas Svalov (AnatomyNext)</span>
            </div>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#2C2A29]/85 backdrop-blur-md text-white/90 text-[11px] pointer-events-none shadow-md border border-white/15">
              <Compass className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Otáčajte model myšou v 360° • Čísla 1–23 približujú svaly</span>
            </div>
          </div>
        )}

        {/* FULLSCREEN TOGGLE (COMMON) */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-2xl bg-white/95 backdrop-blur-md border border-white/80 text-[#2C2A29] hover:bg-white shadow-sm transition-all cursor-pointer"
            title="Otvoriť na celú obrazovku"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. DEDICATED CLINICAL GUIDE (FAT PADS OR MUSCLES ACCORDING TO ACTIVE LAYER) */}
      
      {/* ===================================================================== */}
      {/* GUIDE A: TUKOVÉ KOMPARTMENTY (FAT PADS)                             */}
      {/* ===================================================================== */}
      {anatomyLayer === 'fat_pads' && (
        <div className="w-full max-w-[560px] flex flex-col gap-3 p-4 rounded-3xl bg-white/95 backdrop-blur-2xl border border-[#E8E2D9] shadow-sm animate-in fade-in">
          
          {/* HEADER & SEARCH */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
              <h4 className="text-xs font-bold text-[#2C2A29] uppercase tracking-wider">
                Sprievodca hlbokými tukovými kompartmentmi tváre (a – ii)
              </h4>
            </div>

            <div className="relative flex-1 min-w-[160px] max-w-[220px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8C857B]" />
              <input
                type="text"
                placeholder="Hľadať (napr. SOOF, DMCF, Bichat, a, f)..."
                value={fatPadSearchQuery}
                onChange={(e) => setFatPadSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1 text-xs rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] focus:outline-none focus:border-[#C5A059] text-[#2C2A29]"
              />
            </div>
          </div>

          {/* LAYER FILTER TABS */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
            {[
              { id: 'all', label: 'Všetky kompartmenty (11)' },
              { id: 'deep', label: 'Hlboký kompartment (Layer 4 - Periostálne)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedFatLayer(tab.id as any)}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedFatLayer === tab.id
                    ? 'bg-[#D97706] text-white shadow-xs'
                    : 'bg-[#FAF8F5] text-[#8C857B] hover:text-[#2C2A29] border border-[#E8E2D9]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* LETTER BADGES a TO ii + T */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-[#E8E2D9]/60">
            {FACIAL_FAT_PADS.map((pad) => (
              <button
                key={pad.code}
                type="button"
                onClick={() => setSelectedFatPadNumber(pad.number)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
                  selectedFatPadNumber === pad.number
                    ? 'bg-[#D97706] text-white border-[#D97706] shadow-xs ring-2 ring-[#FDE68A]'
                    : 'bg-[#FAF8F5] text-[#6B7280] hover:text-[#2C2A29] border-[#E8E2D9]'
                }`}
                title={`${pad.code}: ${pad.slovakName} (${pad.layerLabel})`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                <span className="uppercase font-black">{pad.code}</span>
                <span className="text-[10px] opacity-80 font-normal">({pad.slovakName.replace(/^[a-zT]+:\s*/i, '').split(' ')[0]})</span>
              </button>
            ))}
          </div>

          {/* SELECTED FAT PAD CLINICAL DETAIL CARD */}
          {selectedFatPad && (
            <div className="mt-1 p-3.5 rounded-2xl bg-gradient-to-br from-[#FFFDF9] to-[#FEF3C7]/20 border border-[#FDE68A] space-y-2.5 animate-in fade-in">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#D97706] text-white font-black text-sm shadow-xs uppercase">
                    {selectedFatPad.code}
                  </span>
                  <div>
                    <h5 className="font-bold text-[#2C2A29] text-xs leading-snug flex items-center gap-2">
                      <span>{selectedFatPad.slovakName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-[#E8E2D9] text-[#B45309] font-semibold">
                        {selectedFatPad.layerLabel}
                      </span>
                    </h5>
                    <span className="text-[11px] text-[#8C857B] italic">
                      {selectedFatPad.latinName} ({selectedFatPad.englishName})
                    </span>
                  </div>
                </div>

                {onAddFatPadProcedure && !readOnly && (
                  <button
                    type="button"
                    onClick={() => onAddFatPadProcedure(selectedFatPad)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#2C2A29] hover:bg-[#1E1C1B] text-white text-[11px] font-bold transition-all cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Pridať do plánu</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-[#E8E2D9]/60">
                <div className="p-2.5 rounded-xl bg-white border border-[#E8E2D9]">
                  <span className="text-[10px] text-[#B45309] font-bold uppercase block mb-0.5">
                    Starnutie & Fyziologický dopad:
                  </span>
                  <p className="text-[#2C2A29] leading-relaxed">
                    {selectedFatPad.agingImpact}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-[#E8E2D9]">
                  <span className="text-[10px] text-[#C5A059] font-bold uppercase block mb-0.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#C5A059]" />
                    Klinické estetické riešenie:
                  </span>
                  <p className="text-[#2C2A29] leading-relaxed">
                    {selectedFatPad.aestheticSolution}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#8C857B] pt-1 flex-wrap gap-2 border-t border-[#E8E2D9]/40">
                <span>Odporúčaná technika: <strong className="text-[#2C2A29]">{selectedFatPad.recommendedTechnique}</strong></span>
                <span>Preparát a dávka: <strong className="text-[#D97706]">{selectedFatPad.recommendedMaterial} ({selectedFatPad.defaultDose})</strong></span>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ===================================================================== */}
      {/* GUIDE B: SVALY TVÁRE (ANATOMYNEXT MUSCLES 1 AŽ 23)                   */}
      {/* ===================================================================== */}
      {anatomyLayer === 'muscles' && (
        <div className="w-full max-w-[560px] flex flex-col gap-3 p-4 rounded-3xl bg-white/95 backdrop-blur-2xl border border-[#E8E2D9] shadow-sm animate-in fade-in">
          
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#BE123C]" />
              <h4 className="text-xs font-bold text-[#2C2A29] uppercase tracking-wider">
                Anatomický sprievodca svalmi tváre (1 – 23)
              </h4>
            </div>

            <div className="relative flex-1 min-w-[160px] max-w-[220px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8C857B]" />
              <input
                type="text"
                placeholder="Hľadať sval (napr. masseter)..."
                value={muscleSearchQuery}
                onChange={(e) => setMuscleSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1 text-xs rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] focus:outline-none focus:border-[#C5A059] text-[#2C2A29]"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
            {[
              { id: 'all', label: 'Všetky (23)' },
              { id: 'upper', label: 'Čelo & Oči' },
              { id: 'mid', label: 'Líca & Nos' },
              { id: 'lower', label: 'Pery & Brada' },
              { id: 'chewing_neck', label: 'Žuvače & Krk' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedMuscleCategory(cat.id as any)}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedMuscleCategory === cat.id
                    ? 'bg-[#2C2A29] text-white shadow-xs'
                    : 'bg-[#FAF8F5] text-[#8C857B] hover:text-[#2C2A29] border border-[#E8E2D9]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-[#E8E2D9]/60">
            {ANATOMY_NEXT_MUSCLES.map((muscle) => (
              <button
                key={muscle.number}
                type="button"
                onClick={() => setSelectedMuscleNumber(muscle.number)}
                style={{
                  borderColor: selectedMuscleNumber === muscle.number ? muscle.color : undefined,
                  backgroundColor: selectedMuscleNumber === muscle.number ? `${muscle.color}15` : undefined
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
                  selectedMuscleNumber === muscle.number
                    ? 'ring-2 ring-offset-1 text-[#2C2A29] shadow-xs'
                    : 'bg-[#FAF8F5] text-[#6B7280] hover:text-[#2C2A29] border-[#E8E2D9]'
                }`}
                title={`${muscle.number}. ${muscle.latinName} (${muscle.slovakName})`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: muscle.color }}
                />
                <span>{muscle.number}</span>
              </button>
            ))}
          </div>

          {selectedMuscle && (
            <div className="mt-1 p-3.5 rounded-2xl bg-gradient-to-br from-[#FFFDF9] to-[#FAF8F5] border border-[#E8E2D9] space-y-2.5 animate-in fade-in">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span 
                    className="flex items-center justify-center w-7 h-7 rounded-xl text-white font-bold text-xs shadow-xs"
                    style={{ backgroundColor: selectedMuscle.color }}
                  >
                    {selectedMuscle.number}
                  </span>
                  <div>
                    <h5 className="font-bold text-[#2C2A29] text-xs leading-snug">
                      {selectedMuscle.latinName}
                    </h5>
                    <span className="text-[11px] text-[#8C857B]">
                      {selectedMuscle.slovakName} • {selectedMuscle.categoryLabel}
                    </span>
                  </div>
                </div>

                {onAddMuscleProcedure && !readOnly && (
                  <button
                    type="button"
                    onClick={() => onAddMuscleProcedure(selectedMuscle)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#2C2A29] hover:bg-[#1E1C1B] text-white text-[11px] font-bold transition-all cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Pridať do plánu</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-[#E8E2D9]/60">
                <div className="p-2.5 rounded-xl bg-white border border-[#E8E2D9]">
                  <span className="text-[10px] text-[#8C857B] font-bold uppercase block mb-0.5">
                    Funkcia a mimika:
                  </span>
                  <p className="text-[#2C2A29] leading-relaxed">
                    {selectedMuscle.functionDesc}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-[#E8E2D9]">
                  <span className="text-[10px] text-[#C5A059] font-bold uppercase block mb-0.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#C5A059]" />
                    Klinická estetická aplikácia:
                  </span>
                  <p className="text-[#2C2A29] leading-relaxed">
                    {selectedMuscle.clinicalApplication}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#8C857B] pt-1">
                <span>Odporúčaný preparát: <strong className="text-[#2C2A29]">{selectedMuscle.recommendedMaterial}</strong></span>
                <span>Štandardná dávka: <strong className="text-[#C5A059]">{selectedMuscle.defaultDose}</strong></span>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
