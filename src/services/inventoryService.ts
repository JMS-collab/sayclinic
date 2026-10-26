// Správa skladu, spotreby materiálu a objednávok pre SAY CLINIC
import { RealtimeSyncService } from './realtimeSyncService';

export type InventoryCategory = 
  | 'estetika' 
  | 'implantaty' 
  | 'kompresivne_pradlo' 
  | 'sijaci_material' 
  | 'anestezia' 
  | 'ambulantny_material' 
  | 'spotrebny';

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  unit: 'ks' | 'ml' | 'bal' | 'vialka' | 'pár' | 'set';
  minQuantity: number;
  optimalQuantity: number;
  costPerUnit: number; // Nákupná cena bez DPH (€)
  supplier: string; // napr. 'Galderma', 'Lipoelastic', 'Establishment Labs', 'Ethicon', 'B.Braun'
  supplierCode?: string;
  lotNumber?: string;
  expirationDate?: string;
  location?: string; // napr. 'Chladnička 1', 'Operačná sála', 'Sklad prádla'
}

export type MaterialUsageSourceType = 
  | 'operacia' 
  | 'estetika' 
  | 'ambulancia' 
  | 'pradlo' 
  | 'manualny_odpis';

export interface MaterialUsageLog {
  id: string;
  timestamp: string;
  date: string;
  time: string;
  patientId?: string;
  patientName: string;
  patientBirthNumber?: string;
  sourceType: MaterialUsageSourceType;
  procedureName: string; // napr. "Augmentácia prsníkov", "Aplikácia Dysport čelo", "Vydaná kompresná bielizeň"
  itemId?: string;
  itemName: string;
  category: InventoryCategory | string;
  quantity: number;
  unit: string;
  lotNumber?: string;
  serialNumber?: string;
  performerName: string; // Lekár / sestra
  costAtUsage: number;
  notes?: string;
}

export interface MaterialBundleItem {
  itemId: string;
  name?: string;
  quantity: number;
  unit?: string;
  category?: InventoryCategory | string;
}

export interface MaterialBundle {
  id: string;
  serviceName: string;
  description: string;
  category?: string;
  keywords?: string[];
  items: MaterialBundleItem[];
}

export interface OrderItem {
  id: string;
  itemId: string;
  name: string;
  supplier: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  status: 'navrh' | 'objednane' | 'dorucene';
  orderedAt?: string;
  notes?: string;
}

export interface FrequentItemRecommendation {
  itemId: string;
  name: string;
  category: string;
  defaultQty: number;
  unit: string;
  reason?: string;
}

export const FREQUENT_ITEMS_BY_PROCEDURE: Record<string, FrequentItemRecommendation[]> = {
  breast: [
    { itemId: 'inv-marcaine', name: 'Marcaine 0.5% inj. (bupivakain)', category: 'anestezia', defaultQty: 2, unit: 'vialka', reason: 'Lokálna anestézia' },
    { itemId: 'inv-pds-40', name: 'PDS II 4-0 ihla SH-1 (bal 36ks)', category: 'sijaci_material', defaultQty: 1, unit: 'bal', reason: 'Hlboká podkožná sutúra' },
    { itemId: 'inv-monocryl-40', name: 'Monocryl 4-0 ihla PS-2 (bal 36ks)', category: 'sijaci_material', defaultQty: 1, unit: 'bal', reason: 'Subkutikulárny steh' },
    { itemId: 'inv-glycolon-40', name: 'Glycolon 4-0 intrakutánny steh', category: 'sijaci_material', defaultQty: 1, unit: 'bal', reason: 'Intrakutánny uzáver' },
    { itemId: 'inv-surgicel', name: 'Surgicel hemostatická gáza 5x7.5cm', category: 'sijaci_material', defaultQty: 1, unit: 'bal', reason: 'Lokálna hemostáza' },
    { itemId: 'inv-redon-ch10', name: 'Redonov podtlakový drén CH10', category: 'sijaci_material', defaultQty: 2, unit: 'ks', reason: 'Podtlaková drenáž' },
    { itemId: 'inv-bra-ideal-black-m', name: 'Kompresívna podprsenka Lipoelastic', category: 'kompresivne_pradlo', defaultQty: 1, unit: 'ks', reason: 'Fixácia implantátov' },
    { itemId: 'inv-belt-sg', name: 'Prsný kompresívny pás SG', category: 'kompresivne_pradlo', defaultQty: 1, unit: 'ks', reason: 'Horná stabilizácia' },
  ],
  eyelids: [
    { itemId: 'inv-citanest', name: 'Citanest 1% s Adrenalínom', category: 'anestezia', defaultQty: 1, unit: 'vialka', reason: 'Infiltrácia viečok' },
    { itemId: 'inv-prolene-50', name: 'Prolene 5-0 ihla P-3', category: 'sijaci_material', defaultQty: 1, unit: 'bal', reason: 'Nevstrebateľný kožný steh' },
    { itemId: 'inv-steri-strip', name: 'Steri-Strip sterilné náplasti 6x75mm', category: 'ambulantny_material', defaultQty: 1, unit: 'bal', reason: 'Fixácia po extrakcii / šití' },
    { itemId: 'inv-mepore', name: 'Mepore sterilné krytie', category: 'ambulantny_material', defaultQty: 1, unit: 'bal', reason: 'Absorpčné krytie' },
  ],
  carpal: [
    { itemId: 'inv-marcaine', name: 'Marcaine 0.5% / Supracain', category: 'anestezia', defaultQty: 1, unit: 'vialka', reason: 'Zvodová anestézia zápästia' },
    { itemId: 'inv-monocryl-40', name: 'Monocryl 4-0 ihla PS-2', category: 'sijaci_material', defaultQty: 1, unit: 'bal', reason: 'Kožná sutúra dlane' },
    { itemId: 'inv-steri-strip', name: 'Steri-Strip sterilné náplasti', category: 'ambulantny_material', defaultQty: 1, unit: 'bal', reason: 'Primárna fixácia' },
    { itemId: 'inv-mepore', name: 'Mepore krytie & elastická bandáž', category: 'ambulantny_material', defaultQty: 1, unit: 'ks', reason: 'Kompresný zábal ruky' },
  ],
  abdomen: [
    { itemId: 'inv-marcaine', name: 'Marcaine 0.5% inj.', category: 'anestezia', defaultQty: 4, unit: 'vialka', reason: 'Infiltrácia brušnej steny' },
    { itemId: 'inv-pds-40', name: 'PDS II 2-0 / 0 slučka na diastázu', category: 'sijaci_material', defaultQty: 2, unit: 'bal', reason: 'Plikácia priamych svalov' },
    { itemId: 'inv-monocryl-40', name: 'Monocryl 3-0 / 4-0', category: 'sijaci_material', defaultQty: 2, unit: 'bal', reason: 'Dvojvrstvové šitie podkožia' },
    { itemId: 'inv-surgicel', name: 'Surgicel hemostatická gáza', category: 'sijaci_material', defaultQty: 1, unit: 'bal', reason: 'Hemostáza plochy' },
    { itemId: 'inv-redon-ch10', name: 'Redonov drén CH14 so zberačom', category: 'sijaci_material', defaultQty: 2, unit: 'ks', reason: 'Odsávanie serómu' },
    { itemId: 'inv-belt-sg', name: 'Brušný kompresívny pás 3-panelový', category: 'kompresivne_pradlo', defaultQty: 1, unit: 'ks', reason: 'Fixácia brucha' },
  ],
  facelift: [
    { itemId: 'inv-marcaine', name: 'Marcaine 0.5% inj.', category: 'anestezia', defaultQty: 3, unit: 'vialka', reason: 'Infiltrácia tváre a krku' },
    { itemId: 'inv-pds-40', name: 'PDS II 3-0 / 4-0', category: 'sijaci_material', defaultQty: 2, unit: 'bal', reason: 'SMAS fixácia a plikácia' },
    { itemId: 'inv-monocryl-40', name: 'Monocryl 4-0', category: 'sijaci_material', defaultQty: 2, unit: 'bal', reason: 'Preaurikulárny uzáver' },
    { itemId: 'inv-prolene-50', name: 'Prolene 5-0', category: 'sijaci_material', defaultQty: 1, unit: 'bal', reason: 'Jemný retroaurikulárny steh' },
    { itemId: 'inv-floseal', name: 'Floseal hemostatická matrica 5ml', category: 'sijaci_material', defaultQty: 1, unit: 'ks', reason: 'Prevencia hematómu' },
    { itemId: 'inv-redon-ch10', name: 'Redonov mini-drén CH10', category: 'sijaci_material', defaultQty: 2, unit: 'ks', reason: 'Drén tváre' },
    { itemId: 'inv-face-mask', name: 'Tvárová kompresívna maska', category: 'kompresivne_pradlo', defaultQty: 1, unit: 'ks', reason: 'Pooperačná bandáž' },
  ],
  checkup: [
    { itemId: 'inv-dermacyn', name: 'Dermacyn / Betadine antiseptický roztok', category: 'ambulantny_material', defaultQty: 1, unit: 'ks', reason: 'Toaleta rany a jaziev' },
    { itemId: 'inv-mepore', name: 'Mepore sterilné náplasťové krytie', category: 'ambulantny_material', defaultQty: 1, unit: 'ks', reason: 'Výmena krytia' },
    { itemId: 'inv-steri-strip', name: 'Steri-Strip sterilné pásiky', category: 'ambulantny_material', defaultQty: 1, unit: 'bal', reason: 'Náplasťová dlaha po stehoch' },
  ],
  default: [
    { itemId: 'inv-dermacyn', name: 'Dermacyn antiseptický roztok', category: 'ambulantny_material', defaultQty: 1, unit: 'ks', reason: 'Antisepsa' },
    { itemId: 'inv-mepore', name: 'Mepore sterilné krytie', category: 'ambulantny_material', defaultQty: 1, unit: 'ks', reason: 'Sterilné krytie' },
    { itemId: 'inv-steri-strip', name: 'Steri-Strip pásiky', category: 'ambulantny_material', defaultQty: 1, unit: 'bal', reason: 'Fixácia' },
    { itemId: 'inv-monocryl-40', name: 'Monocryl 4-0 ihla PS-2', category: 'sijaci_material', defaultQty: 1, unit: 'bal', reason: 'Sutúra' },
  ]
};

// =========================================================================
// OPIÁTOVÁ KNIHA & EVIDENCIA OPL (ZÁKON NR SR Č. 139/1998 Z. z.)
// ==========================================
export type OpiateClassification = 
  | 'omamna_latka_II'      // Omamné látky II. skupiny (Fentanyl, Sufentanil, Morfín, Piritramid)
  | 'psychotropna_latka_II' // Psychotropné látky II. skupiny (Ketamín)
  | 'psychotropna_latka_III'; // Psychotropné látky III. skupiny (Midazolam, Diazepam)

export interface OpiateItem {
  id: string;
  name: string; // napr. "Fentanyl Kalceks 0.05 mg/ml (0.1 mg / 2 ml inj.)"
  activeSubstance: string; // "Fentanylum"
  form: string; // "injekčný roztok v ampulkách"
  strength: string; // "0.1 mg / 2 ml"
  packageUnit: 'ampulka' | 'vialka' | 'balenie';
  currentStock: number; // Aktuálny fyzický počet ampuliek v trezore
  minStock: number;
  lotNumber: string;
  expirationDate: string; // YYYY-MM-DD
  safeLocation: string; // "Trezor OPL č. 1 - Operačná sála (dvojitý zámok)"
  responsiblePerson: string; // "MUDr. Ján Mráz"
  classification: OpiateClassification;
  suklCode?: string;
  notes?: string;
}

export type OpiateMovementType = 
  | 'prijem'        // Príjem do trezoru z lekárne na úradnú žiadanku OPL
  | 'podanie'       // Podanie pacientovi pri anestézii / analgézii
  | 'znehodnotenie' // Znehodnotenie nespotrebovaného zostatku / poškodenej ampulky svedkom
  | 'inventura';    // Riadna mesačná fyzická kontrola trezoru

export interface OpiateLogEntry {
  id: string;
  entryNumber: number; // Prírastkové úradné poradové číslo zápisu v knihe
  timestamp: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  opiateId: string;
  opiateName: string;
  activeSubstance: string;
  lotNumber: string;
  movementType: OpiateMovementType;
  
  // Príjem
  deliveryNoteNumber?: string; // Číslo úradnej žiadanky na OPL s modrým pruhom / dodací list
  supplier?: string; // Nemocničná lekáreň / distribútor
  
  // Výdaj / Podanie pacientovi
  patientId?: string;
  patientName?: string;
  patientBirthNumber?: string;
  procedureName?: string; // Operačný výkon / indikácia (napr. "Augmentácia prsníkov v CA")
  prescribingDoctor?: string; // Ordinujúci lekár / anesteziológ
  administeringNurse?: string; // Podávajúca sestra
  witness?: string; // Svedok (druhý zdravotnícky pracovník)
  
  // Množstvá
  quantityIn: number; // Príjem (ampulky)
  quantityOut: number; // Výdaj (ampulky)
  quantityWasted?: number; // Nespotrebovaný znehodnotený zostatok z ampulky (napr. 0.5 ml)
  balanceAfter: number; // Zostatok po tomto zápise
  unit: string; // 'ampulka' | 'vialka' | 'ml'
  
  notes?: string;
  recordedBy: string; // Meno zapisujúceho pracovníka
}

// Katalóg klinických opiátov v trezore SAY CLINIC (čistý počiatočný stav pripravený na reálny príjem)
export const INITIAL_OPIATES: OpiateItem[] = [
  {
    id: 'op-fentanyl',
    name: 'Fentanyl Kalceks 0.05 mg/ml (0.1 mg / 2 ml inj.)',
    activeSubstance: 'Fentanylum',
    form: 'injekčný roztok v ampulkách (5x2ml)',
    strength: '0.1 mg / 2 ml',
    packageUnit: 'ampulka',
    currentStock: 0,
    minStock: 8,
    lotNumber: '',
    expirationDate: '',
    safeLocation: 'Trezor OPL č. 1 - Operačná sála (dvojitý zámok)',
    responsiblePerson: 'MUDr. Ján Mráz',
    classification: 'omamna_latka_II',
    suklCode: '0235813',
    notes: 'Syntetické opioidné analgetikum pre úvod a vedenie celkovej anestézie'
  },
  {
    id: 'op-sufentanil',
    name: 'Sufentanil Torrex 5 mcg/ml (2 ml inj.)',
    activeSubstance: 'Sufentanilum',
    form: 'injekčný roztok v ampulkách (5x2ml)',
    strength: '10 mcg / 2 ml',
    packageUnit: 'ampulka',
    currentStock: 0,
    minStock: 6,
    lotNumber: '',
    expirationDate: '',
    safeLocation: 'Trezor OPL č. 1 - Operačná sála (dvojitý zámok)',
    responsiblePerson: 'MUDr. Ján Mráz',
    classification: 'omamna_latka_II',
    suklCode: '0044315',
    notes: 'Vysoko účinný opioid pre dlhšie výkony a kardiovaskulárnu stabilitu'
  },
  {
    id: 'op-dipidolor',
    name: 'Dipidolor 15 mg / 2 ml injekčný roztok',
    activeSubstance: 'Piritramidum',
    form: 'injekčný roztok v ampulkách (5x2ml)',
    strength: '15 mg / 2 ml',
    packageUnit: 'ampulka',
    currentStock: 0,
    minStock: 5,
    lotNumber: '',
    expirationDate: '',
    safeLocation: 'Trezor OPL č. 1 - Dospávacia izba (dvojitý zámok)',
    responsiblePerson: 'MUDr. Ján Mráz',
    classification: 'omamna_latka_II',
    suklCode: '0002477',
    notes: 'Opioid pre stredne silnú až silnú pooperačnú bolesť na dospávaní'
  },
  {
    id: 'op-morphin',
    name: 'Morphin Biotika 1% (10 mg / 1 ml inj.)',
    activeSubstance: 'Morphini hydrochloridum',
    form: 'injekčný roztok v ampulkách (10x1ml)',
    strength: '10 mg / 1 ml',
    packageUnit: 'ampulka',
    currentStock: 0,
    minStock: 5,
    lotNumber: '',
    expirationDate: '',
    safeLocation: 'Trezor OPL č. 1 - Operačná sála (dvojitý zámok)',
    responsiblePerson: 'MUDr. Ján Mráz',
    classification: 'omamna_latka_II',
    suklCode: '0000087',
    notes: 'Klasické opioidné analgetikum pre silnú pooperačnú bolesť'
  },
  {
    id: 'op-ketamin',
    name: 'Calypsol (Ketamín) 50 mg / ml (10 ml vialka)',
    activeSubstance: 'Ketaminum',
    form: 'injekčný roztok vo vialke (10ml)',
    strength: '500 mg / 10 ml',
    packageUnit: 'vialka',
    currentStock: 0,
    minStock: 3,
    lotNumber: '',
    expirationDate: '',
    safeLocation: 'Trezor OPL č. 1 - Operačná sála',
    responsiblePerson: 'MUDr. Ján Mráz',
    classification: 'psychotropna_latka_II',
    suklCode: '0087814',
    notes: 'Disociatívne anestetikum na analgosedáciu a analgéziu'
  },
  {
    id: 'op-midazolam',
    name: 'Midazolam Accord 5 mg / 1 ml (bal 10x1ml)',
    activeSubstance: 'Midazolamum',
    form: 'injekčný roztok v ampulkách (10x1ml)',
    strength: '5 mg / 1 ml',
    packageUnit: 'ampulka',
    currentStock: 0,
    minStock: 10,
    lotNumber: '',
    expirationDate: '',
    safeLocation: 'Trezor OPL č. 1 - Zákroková miestnosť',
    responsiblePerson: 'MUDr. Ján Mráz',
    classification: 'psychotropna_latka_III',
    suklCode: '0115322',
    notes: 'Krátkodobo pôsobiaci benzodiazepín na premedikáciu a analgosedáciu'
  }
];

// Úradný register (Kniha OPL) - čistý počiatočný stav
export const INITIAL_OPIATE_LOGS: OpiateLogEntry[] = [];

// Skladové zásoby SAY CLINIC - čistý počiatočný stav
export const INITIAL_INVENTORY: InventoryItem[] = [];

// Počiatočné balíčky výkonov
export const INITIAL_BUNDLES: MaterialBundle[] = [
  {
    id: 'bundle-augmentacia',
    serviceName: 'Augmentácia prsníkov',
    description: 'Kompletný operačný set pre augmentáciu vrátane prádla, šitia, hemostatík a drénov',
    category: 'operacia',
    keywords: ['augment', 'prsník', 'prsnik', 'mamma', 'implantat', 'implantát', 'vloženie implantátov'],
    items: [
      { itemId: 'inv-marcaine', name: 'Marcaine 0.5% inj. (bupivakain)', quantity: 2, unit: 'vialka', category: 'anestezia' },
      { itemId: 'inv-pds-40', name: 'PDS II 4-0 ihla SH-1 (bal 36ks)', quantity: 1, unit: 'bal', category: 'sijaci_material' },
      { itemId: 'inv-monocryl-40', name: 'Monocryl 4-0 ihla PS-2 (bal 36ks)', quantity: 1, unit: 'bal', category: 'sijaci_material' },
      { itemId: 'inv-glycolon-40', name: 'Glycolon 4-0 intrakutánny steh', quantity: 1, unit: 'bal', category: 'sijaci_material' },
      { itemId: 'inv-surgicel', name: 'Surgicel hemostatická gáza 5x7.5cm', quantity: 1, unit: 'bal', category: 'sijaci_material' },
      { itemId: 'inv-redon-ch10', name: 'Redonov podtlakový drén CH10 so zberačom', quantity: 2, unit: 'ks', category: 'sijaci_material' },
      { itemId: 'inv-bra-ideal-black-m', name: 'Kompresívna podprsenka Lipoelastic PI Ideal', quantity: 1, unit: 'ks', category: 'kompresivne_pradlo' },
      { itemId: 'inv-belt-sg', name: 'Prsný kompresívny fixačný pás SG Lipoelastic', quantity: 1, unit: 'ks', category: 'kompresivne_pradlo' },
    ]
  },
  {
    id: 'bundle-blefaroplastika',
    serviceName: 'Blefaroplastika (operácia očných viečok)',
    description: 'Lokálna anestézia, mikro-šijací materiál, krytie a chladivé kompresy',
    category: 'operacia',
    keywords: ['blefaro', 'vieč', 'viec', 'očn', 'ocn', 'očných', 'ocnych'],
    items: [
      { itemId: 'inv-citanest', name: 'Citanest 1% s Adrenalínom 1:200 000', quantity: 1, unit: 'vialka', category: 'anestezia' },
      { itemId: 'inv-prolene-50', name: 'Prolene 5-0 ihla P-3 (bal 36ks)', quantity: 1, unit: 'bal', category: 'sijaci_material' },
      { itemId: 'inv-steri-strip', name: 'Steri-Strip sterilné náplasťové stehy 6x75mm', quantity: 1, unit: 'bal', category: 'ambulantny_material' },
      { itemId: 'inv-mepore', name: 'Mepore sterilné pooperačné krytie', quantity: 1, unit: 'bal', category: 'ambulantny_material' },
    ]
  },
  {
    id: 'bundle-karpal',
    serviceName: 'Dekompresia karpálneho tunela',
    description: 'Lokálne anestetikum, jemná sutúra, sterilné kompresné krytie ruky',
    category: 'operacia',
    keywords: ['karpál', 'karpal', 'kanál', 'kanal', 'nervus medianus', 'tunel'],
    items: [
      { itemId: 'inv-marcaine', name: 'Marcaine 0.5% inj. (bupivakain)', quantity: 1, unit: 'vialka', category: 'anestezia' },
      { itemId: 'inv-monocryl-40', name: 'Monocryl 4-0 ihla PS-2 (bal 36ks)', quantity: 1, unit: 'bal', category: 'sijaci_material' },
      { itemId: 'inv-steri-strip', name: 'Steri-Strip sterilné náplasťové stehy', quantity: 1, unit: 'bal', category: 'ambulantny_material' },
      { itemId: 'inv-mepore', name: 'Mepore sterilné krytie + elastická bandáž', quantity: 1, unit: 'ks', category: 'ambulantny_material' },
    ]
  },
  {
    id: 'bundle-abdominoplastika',
    serviceName: 'Abdominoplastika (plastika brucha)',
    description: 'Kompletný set na resekciu, plikáciu priameho brušného svalu, drény a kompresný pás',
    category: 'operacia',
    keywords: ['abdomino', 'brucho', 'bruch', 'diastáza', 'diastaza', 'dermolipectomia'],
    items: [
      { itemId: 'inv-marcaine', name: 'Marcaine 0.5% inj. (bupivakain)', quantity: 4, unit: 'vialka', category: 'anestezia' },
      { itemId: 'inv-pds-40', name: 'PDS II 2-0 / 0 slučka na plikáciu diastázy', quantity: 2, unit: 'bal', category: 'sijaci_material' },
      { itemId: 'inv-monocryl-40', name: 'Monocryl 3-0 / 4-0 na podkožie', quantity: 2, unit: 'bal', category: 'sijaci_material' },
      { itemId: 'inv-glycolon-40', name: 'Glycolon 4-0 intrakutánny steh', quantity: 1, unit: 'bal', category: 'sijaci_material' },
      { itemId: 'inv-surgicel', name: 'Surgicel hemostatická gáza 5x7.5cm', quantity: 1, unit: 'bal', category: 'sijaci_material' },
      { itemId: 'inv-redon-ch10', name: 'Redonov podtlakový drén CH14 so zberačom', quantity: 2, unit: 'ks', category: 'sijaci_material' },
      { itemId: 'inv-belt-sg', name: 'Brušný kompresívny pás 3-panelový Lipoelastic', quantity: 1, unit: 'ks', category: 'kompresivne_pradlo' },
    ]
  },
  {
    id: 'bundle-facelift',
    serviceName: 'SMAS Face-lift & Neck-lift',
    description: 'Chirurgický lifting tváre, SMAS plikácia, šitie, hemostáza a kompresná bandáž',
    category: 'operacia',
    keywords: ['facelift', 'face-lift', 'necklift', 'smas', 'lifting tváre', 'lifting krku'],
    items: [
      { itemId: 'inv-marcaine', name: 'Marcaine 0.5% inj. (bupivakain)', quantity: 3, unit: 'vialka', category: 'anestezia' },
      { itemId: 'inv-pds-40', name: 'PDS II 3-0 / 4-0 na SMAS fixáciu', quantity: 2, unit: 'bal', category: 'sijaci_material' },
      { itemId: 'inv-monocryl-40', name: 'Monocryl 4-0 ihla PS-2 (bal 36ks)', quantity: 2, unit: 'bal', category: 'sijaci_material' },
      { itemId: 'inv-prolene-50', name: 'Prolene 5-0 ihla P-3 na kožu', quantity: 1, unit: 'bal', category: 'sijaci_material' },
      { itemId: 'inv-floseal', name: 'Floseal hemostatická matrica 5ml', quantity: 1, unit: 'ks', category: 'sijaci_material' },
      { itemId: 'inv-redon-ch10', name: 'Redonov mini-drén CH10 so zberačom', quantity: 2, unit: 'ks', category: 'sijaci_material' },
      { itemId: 'inv-face-mask', name: 'Kompresívna tvárová a krčná bandáž Lipoelastic', quantity: 1, unit: 'ks', category: 'kompresivne_pradlo' },
    ]
  },
  {
    id: 'bundle-liposukcia',
    serviceName: 'Tumescentná liposukcia',
    description: 'Tumescenčný roztok, kanyly, kožný uzáver, savé krytie a kompresné prádlo',
    category: 'operacia',
    keywords: ['liposukc', 'tuku', 'odsatie', 'tumescent'],
    items: [
      { itemId: 'inv-marcaine', name: 'Tumescentný infiltračný set s Kleinovým roztokom', quantity: 1, unit: 'set', category: 'anestezia' },
      { itemId: 'inv-monocryl-40', name: 'Monocryl 4-0 ihla PS-2 (uzáver vstupov)', quantity: 1, unit: 'bal', category: 'sijaci_material' },
      { itemId: 'inv-mepore', name: 'Mepore absorpčné krytie na vytekanie', quantity: 4, unit: 'ks', category: 'ambulantny_material' },
      { itemId: 'inv-belt-sg', name: 'Kompresná pooperačná bielizeň Lipoelastic', quantity: 1, unit: 'ks', category: 'kompresivne_pradlo' },
    ]
  },
  {
    id: 'bundle-labioplastika',
    serviceName: 'Labioplastika (úprava labií)',
    description: 'Lokálna anestézia, jemný rýchlovstrebateľný steh a hojivé krytie',
    category: 'operacia',
    keywords: ['labio', 'pysk', 'intímna', 'intimna'],
    items: [
      { itemId: 'inv-citanest', name: 'Citanest 1% s Adrenalínom', quantity: 1, unit: 'vialka', category: 'anestezia' },
      { itemId: 'inv-glycolon-40', name: 'Vicryl Rapide / Glycolon 5-0 vstrebateľný steh', quantity: 2, unit: 'bal', category: 'sijaci_material' },
      { itemId: 'inv-dermacyn', name: 'Dermacyn antiseptický gél na rany', quantity: 1, unit: 'ks', category: 'ambulantny_material' },
    ]
  },
  {
    id: 'bundle-prevaz',
    serviceName: 'Ambulantný pooperačný preväz a kontrola',
    description: 'Antiseptické ošetrenie, výmena pooperačného krytia a náplasťová fixácia',
    category: 'ambulancia',
    keywords: ['preväz', 'prevaz', 'kontrola', 'extrakcia', 'stehy', 'ošetrenie'],
    items: [
      { itemId: 'inv-dermacyn', name: 'Dermacyn / Betadine antiseptický roztok', quantity: 1, unit: 'ks', category: 'ambulantny_material' },
      { itemId: 'inv-mepore', name: 'Mepore sterilné náplasťové krytie', quantity: 1, unit: 'ks', category: 'ambulantny_material' },
      { itemId: 'inv-steri-strip', name: 'Steri-Strip sterilné elastické pásiky', quantity: 1, unit: 'bal', category: 'ambulantny_material' },
    ]
  },
  {
    id: 'bundle-botox-full',
    serviceName: 'Aplikácia Dysportu / Botoxu (Full Face)',
    description: 'Kompletná neurotoxínová kúra čelo, glabela, periorbitálne',
    category: 'estetika',
    keywords: ['botox', 'dysport', 'vrásk', 'vrask', 'neurotoxin'],
    items: [
      { itemId: 'inv-dysport', name: 'Dysport 500U / Botox 100U', quantity: 1, unit: 'vialka', category: 'estetika' },
      { itemId: 'inv-cannula-tsk', name: 'TSK ihly 30G/32G mikroneedle set', quantity: 1, unit: 'bal', category: 'spotrebny' },
    ]
  }
];

// Audit log minutého materiálu - čistý počiatočný stav
export const INITIAL_USAGE_LOGS: MaterialUsageLog[] = [];

// Service API pre prácu so skladom a spotrebou
export class InventoryService {
  private static STORAGE_KEY_INVENTORY = 'say_clinic_inventory_v2';
  private static STORAGE_KEY_LOGS = 'say_clinic_material_usage_logs_v2';
  private static STORAGE_KEY_BUNDLES = 'say_clinic_bundles_v2';

  // Načítanie zásob
  public static getInventory(): InventoryItem[] {
    if (typeof window === 'undefined') return INITIAL_INVENTORY;
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY_INVENTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      // Inicializácia pri prvom spustení
      localStorage.setItem(this.STORAGE_KEY_INVENTORY, JSON.stringify(INITIAL_INVENTORY));
      return INITIAL_INVENTORY;
    } catch (e) {
      console.error('Chyba načítania skladu:', e);
      return INITIAL_INVENTORY;
    }
  }

  // Uloženie zásob
  public static saveInventory(items: InventoryItem[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.STORAGE_KEY_INVENTORY, JSON.stringify(items));
      window.dispatchEvent(new CustomEvent('say_clinic_inventory_changed', { detail: items }));
      RealtimeSyncService.publish('inventory', items);
    } catch (e) {
      console.error('Chyba ukladania skladu:', e);
    }
  }

  // Načítanie knihy spotreby (audit logu)
  public static getUsageLogs(): MaterialUsageLog[] {
    if (typeof window === 'undefined') return INITIAL_USAGE_LOGS;
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY_LOGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      localStorage.setItem(this.STORAGE_KEY_LOGS, JSON.stringify(INITIAL_USAGE_LOGS));
      return INITIAL_USAGE_LOGS;
    } catch (e) {
      console.error('Chyba načítania logov spotreby:', e);
      return INITIAL_USAGE_LOGS;
    }
  }

  // Uloženie knihy spotreby
  public static saveUsageLogs(logs: MaterialUsageLog[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.STORAGE_KEY_LOGS, JSON.stringify(logs));
      window.dispatchEvent(new CustomEvent('say_clinic_material_usage_logged', { detail: logs }));
      RealtimeSyncService.publish('inventory_logs', logs);
    } catch (e) {
      console.error('Chyba ukladania logov spotreby:', e);
    }
  }

  // ZALOGOVANIE MINUTÉHO MATERIÁLU + AUTOMATICKÝ ODPIS ZO SKLADU
  public static logMaterialUsage(entry: {
    patientId?: string;
    patientName: string;
    patientBirthNumber?: string;
    sourceType: MaterialUsageSourceType;
    procedureName: string;
    itemId?: string;
    itemName: string;
    category?: InventoryCategory | string;
    quantity: number;
    unit?: string;
    lotNumber?: string;
    serialNumber?: string;
    performerName?: string;
    notes?: string;
    costPerUnit?: number;
  }): MaterialUsageLog {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });

    const currentInventory = this.getInventory();
    const matchedItem = entry.itemId 
      ? currentInventory.find(i => i.id === entry.itemId) 
      : currentInventory.find(i => i.name.toLowerCase().includes(entry.itemName.toLowerCase()) || entry.itemName.toLowerCase().includes(i.name.toLowerCase()));

    const costAtUsage = entry.costPerUnit 
      ? entry.costPerUnit * entry.quantity
      : (matchedItem ? matchedItem.costPerUnit * entry.quantity : 0);

    const log: MaterialUsageLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: now.toISOString(),
      date,
      time,
      patientId: entry.patientId,
      patientName: entry.patientName || 'Neznámy pacient',
      patientBirthNumber: entry.patientBirthNumber,
      sourceType: entry.sourceType,
      procedureName: entry.procedureName,
      itemId: matchedItem ? matchedItem.id : entry.itemId,
      itemName: entry.itemName,
      category: (matchedItem?.category || entry.category || 'spotrebny') as any,
      quantity: Number(entry.quantity) || 1,
      unit: entry.unit || matchedItem?.unit || 'ks',
      lotNumber: entry.lotNumber || matchedItem?.lotNumber,
      serialNumber: entry.serialNumber,
      performerName: entry.performerName || 'MUDr. Ján Mráz',
      costAtUsage,
      notes: entry.notes
    };

    // Odpočítanie zo skladu ak položka existuje
    if (matchedItem) {
      const updatedInventory = currentInventory.map(item => {
        if (item.id === matchedItem!.id) {
          const newQty = Math.max(0, item.quantity - (Number(entry.quantity) || 1));
          return {
            ...item,
            quantity: newQty,
            lotNumber: entry.lotNumber || item.lotNumber
          };
        }
        return item;
      });
      this.saveInventory(updatedInventory);
    }

    // Uloženie do audit logu
    const existingLogs = this.getUsageLogs();
    const updatedLogs = [log, ...existingLogs];
    this.saveUsageLogs(updatedLogs);

    return log;
  }

  // Zalogovanie viacerých položiek naraz (napr. z operačného protokolu alebo balíčka)
  public static logMultipleUsages(entries: Parameters<typeof InventoryService.logMaterialUsage>[0][]): MaterialUsageLog[] {
    const logs: MaterialUsageLog[] = [];
    for (const e of entries) {
      logs.push(this.logMaterialUsage(e));
    }
    return logs;
  }

  // Získanie spotreby pre konkrétneho pacienta
  public static getLogsForPatient(patientId?: string, birthNumber?: string, patientName?: string): MaterialUsageLog[] {
    const logs = this.getUsageLogs();
    return logs.filter(log => {
      if (patientId && log.patientId === patientId) return true;
      if (birthNumber && log.patientBirthNumber && log.patientBirthNumber.replace(/\D/g, '') === birthNumber.replace(/\D/g, '')) return true;
      if (patientName && log.patientName.toLowerCase().trim() === patientName.toLowerCase().trim()) return true;
      return false;
    });
  }

  // Získanie položiek na objednávanie (pod minimom alebo vypredané)
  public static getReorderItems(): OrderItem[] {
    const inventory = this.getInventory();
    const lowStockItems = inventory.filter(item => item.quantity <= item.minQuantity);

    return lowStockItems.map(item => {
      const needed = Math.max(1, (item.optimalQuantity || (item.minQuantity * 2)) - item.quantity);
      return {
        id: `ord-${item.id}`,
        itemId: item.id,
        name: item.name,
        supplier: item.supplier || 'Hlavný distribútor',
        quantity: needed,
        unit: item.unit,
        costPerUnit: item.costPerUnit,
        status: 'navrh'
      };
    });
  }

  // Príjem / naskladnenie tovaru
  public static restockItem(itemId: string, quantityToAdd: number, lotNumber?: string, expDate?: string): void {
    const inventory = this.getInventory();
    const updated = inventory.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity: item.quantity + quantityToAdd,
          lotNumber: lotNumber || item.lotNumber,
          expirationDate: expDate || item.expirationDate
        };
      }
      return item;
    });
    this.saveInventory(updated);
  }

  // Načítanie balíčkov
  public static getBundles(): MaterialBundle[] {
    if (typeof window === 'undefined') return INITIAL_BUNDLES;
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY_BUNDLES);
      if (saved) return JSON.parse(saved);
      localStorage.setItem(this.STORAGE_KEY_BUNDLES, JSON.stringify(INITIAL_BUNDLES));
      return INITIAL_BUNDLES;
    } catch {
      return INITIAL_BUNDLES;
    }
  }

  // Uloženie balíčkov
  public static saveBundles(bundles: MaterialBundle[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.STORAGE_KEY_BUNDLES, JSON.stringify(bundles));
      window.dispatchEvent(new CustomEvent('say_clinic_bundles_changed', { detail: bundles }));
    } catch (e) {
      console.error(e);
    }
  }

  // Pridanie novej položky
  public static addItem(item: InventoryItem): void {
    const inventory = this.getInventory();
    const updated = [item, ...inventory];
    this.saveInventory(updated);
  }

  // Úprava existujúcej položky skladu
  public static updateItem(updatedItem: InventoryItem): void {
    const inventory = this.getInventory();
    const updated = inventory.map(item => item.id === updatedItem.id ? updatedItem : item);
    this.saveInventory(updated);
  }

  // Zmazanie položky zo skladu
  public static deleteItem(itemId: string): void {
    const inventory = this.getInventory();
    const updated = inventory.filter(item => item.id !== itemId);
    this.saveInventory(updated);
  }

  // Pridanie nového balíčka
  public static addBundle(bundle: MaterialBundle): void {
    const bundles = this.getBundles();
    const updated = [bundle, ...bundles];
    this.saveBundles(updated);
  }

  // Úprava existujúceho balíčka pre výkon
  public static updateBundle(updatedBundle: MaterialBundle): void {
    const bundles = this.getBundles();
    const updated = bundles.map(b => b.id === updatedBundle.id ? updatedBundle : b);
    this.saveBundles(updated);
  }

  // Zmazanie balíčka pre výkon
  public static deleteBundle(bundleId: string): void {
    const bundles = this.getBundles();
    const updated = bundles.filter(b => b.id !== bundleId);
    this.saveBundles(updated);
  }

  // Automatické odporučenie balíčka spotreby podľa názvu operácie / výkonu pacienta
  public static suggestBundleForProcedure(procedureName?: string): MaterialBundle | null {
    const bundles = this.getBundles();
    if (!bundles || bundles.length === 0) return null;
    if (!procedureName || !procedureName.trim()) return bundles[0];

    const lower = procedureName.toLowerCase().trim();

    // 1. Priama zhoda s názvom balíčka
    const exactMatch = bundles.find(b => 
      b.serviceName.toLowerCase().includes(lower) || lower.includes(b.serviceName.toLowerCase())
    );
    if (exactMatch) return exactMatch;

    // 2. Zhoda s kľúčovými slovami zadefinovanými v balíčku
    for (const b of bundles) {
      if (b.keywords && b.keywords.some(kw => lower.includes(kw.toLowerCase()))) {
        return b;
      }
    }

    // 3. Fallback heuristika
    if (lower.includes('augment') || lower.includes('prsník') || lower.includes('prsnik') || lower.includes('mamma') || lower.includes('implanta')) {
      return bundles.find(b => b.id === 'bundle-augmentacia') || bundles[0];
    }
    if (lower.includes('blefaro') || lower.includes('vieč') || lower.includes('viec') || lower.includes('očn') || lower.includes('ocn')) {
      return bundles.find(b => b.id === 'bundle-blefaroplastika') || bundles[0];
    }
    if (lower.includes('karpál') || lower.includes('karpal') || lower.includes('kanál') || lower.includes('tunel')) {
      return bundles.find(b => b.id === 'bundle-karpal') || bundles[0];
    }
    if (lower.includes('abdomino') || lower.includes('brucho') || lower.includes('bruch') || lower.includes('diastáz')) {
      return bundles.find(b => b.id === 'bundle-abdominoplastika') || bundles[0];
    }
    if (lower.includes('facelift') || lower.includes('face-lift') || lower.includes('necklift') || lower.includes('smas') || lower.includes('lifting')) {
      return bundles.find(b => b.id === 'bundle-facelift') || bundles[0];
    }
    if (lower.includes('liposukc') || lower.includes('tuku') || lower.includes('odsatie')) {
      return bundles.find(b => b.id === 'bundle-liposukcia') || bundles[0];
    }
    if (lower.includes('labio') || lower.includes('pysk') || lower.includes('intím')) {
      return bundles.find(b => b.id === 'bundle-labioplastika') || bundles[0];
    }
    if (lower.includes('preväz') || lower.includes('prevaz') || lower.includes('kontrola') || lower.includes('stehy') || lower.includes('extrakcia')) {
      return bundles.find(b => b.id === 'bundle-prevaz') || bundles[0];
    }
    if (lower.includes('botox') || lower.includes('dysport') || lower.includes('vrásk')) {
      return bundles.find(b => b.id === 'bundle-botox-full') || bundles[0];
    }

    return bundles[0];
  }

  // 1-klikové zaevidovanie celého balíčka spotreby pre pacienta (sestra)
  public static applyBundle(params: {
    patientId?: string;
    patientName: string;
    patientBirthNumber?: string;
    bundleId: string;
    performerName?: string;
    notes?: string;
    customQuantities?: Record<string, number>;
    disabledItems?: string[];
  }): MaterialUsageLog[] {
    const bundles = this.getBundles();
    const bundle = bundles.find(b => b.id === params.bundleId);
    if (!bundle) return [];

    const inventory = this.getInventory();
    const entries: Parameters<typeof InventoryService.logMaterialUsage>[0][] = [];
    const disabledSet = new Set(params.disabledItems || []);

    for (const itemRef of bundle.items) {
      if (disabledSet.has(itemRef.itemId)) continue;

      const matchedInv = inventory.find(i => i.id === itemRef.itemId);
      const qty = params.customQuantities && params.customQuantities[itemRef.itemId] !== undefined
        ? Number(params.customQuantities[itemRef.itemId])
        : itemRef.quantity;

      if (qty > 0) {
        entries.push({
          patientId: params.patientId,
          patientName: params.patientName || 'Pacient SAY CLINIC',
          patientBirthNumber: params.patientBirthNumber,
          sourceType: 'operacia',
          procedureName: bundle.serviceName,
          itemId: matchedInv ? matchedInv.id : itemRef.itemId,
          itemName: matchedInv ? matchedInv.name : (itemRef.name || itemRef.itemId),
          category: matchedInv?.category || itemRef.category || 'spotrebny',
          quantity: qty,
          unit: matchedInv?.unit || itemRef.unit || 'ks',
          lotNumber: matchedInv?.lotNumber,
          performerName: params.performerName || 'Sestra SAY CLINIC',
          notes: params.notes ? `Balíček: ${bundle.serviceName} • ${params.notes}` : `Balíček: ${bundle.serviceName}`
        });
      }
    }

    return this.logMultipleUsages(entries);
  }

  // Získanie najčastejšie používaných skladových položiek pre konkrétny typ výkonu
  public static getFrequentItemsForProcedure(procedureTitle?: string): FrequentItemRecommendation[] {
    if (!procedureTitle) return FREQUENT_ITEMS_BY_PROCEDURE.default;
    const lower = procedureTitle.toLowerCase();
    if (lower.includes('augment') || lower.includes('prsník') || lower.includes('prsnik') || lower.includes('mamma') || lower.includes('implantat')) {
      return FREQUENT_ITEMS_BY_PROCEDURE.breast;
    }
    if (lower.includes('blefaro') || lower.includes('vieč') || lower.includes('viec') || lower.includes('očn') || lower.includes('ocn')) {
      return FREQUENT_ITEMS_BY_PROCEDURE.eyelids;
    }
    if (lower.includes('karpál') || lower.includes('karpal') || lower.includes('kanál') || lower.includes('tunel')) {
      return FREQUENT_ITEMS_BY_PROCEDURE.carpal;
    }
    if (lower.includes('abdomino') || lower.includes('brucho') || lower.includes('bruch') || lower.includes('diastáz')) {
      return FREQUENT_ITEMS_BY_PROCEDURE.abdomen;
    }
    if (lower.includes('facelift') || lower.includes('face-lift') || lower.includes('necklift') || lower.includes('smas') || lower.includes('lifting')) {
      return FREQUENT_ITEMS_BY_PROCEDURE.facelift;
    }
    if (lower.includes('preväz') || lower.includes('prevaz') || lower.includes('kontrola') || lower.includes('extrakcia') || lower.includes('steh')) {
      return FREQUENT_ITEMS_BY_PROCEDURE.checkup;
    }
    return FREQUENT_ITEMS_BY_PROCEDURE.default;
  }

  // ==========================================
  // OPIÁTOVÁ KNIHA & EVIDENCIA OPL (ZÁKON Č. 139/1998 Z. z.)
  // ==========================================
  private static STORAGE_KEY_OPIATES = 'say_clinic_opiates_catalog_v1';
  private static STORAGE_KEY_OPIATE_LOGS = 'say_clinic_opiate_book_logs_v1';

  public static getOpiates(): OpiateItem[] {
    if (typeof window === 'undefined') return INITIAL_OPIATES;
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY_OPIATES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      localStorage.setItem(this.STORAGE_KEY_OPIATES, JSON.stringify(INITIAL_OPIATES));
      return INITIAL_OPIATES;
    } catch (e) {
      console.error('Chyba načítania katalógu opiátov:', e);
      return INITIAL_OPIATES;
    }
  }

  public static saveOpiates(items: OpiateItem[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.STORAGE_KEY_OPIATES, JSON.stringify(items));
      window.dispatchEvent(new CustomEvent('say_clinic_opiates_changed', { detail: items }));
      RealtimeSyncService.publish('opiates', items);
    } catch (e) {
      console.error('Chyba ukladania katalógu opiátov:', e);
    }
  }

  public static getOpiateLogs(): OpiateLogEntry[] {
    if (typeof window === 'undefined') return INITIAL_OPIATE_LOGS;
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY_OPIATE_LOGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      localStorage.setItem(this.STORAGE_KEY_OPIATE_LOGS, JSON.stringify(INITIAL_OPIATE_LOGS));
      return INITIAL_OPIATE_LOGS;
    } catch (e) {
      console.error('Chyba načítania knihy opiátov:', e);
      return INITIAL_OPIATE_LOGS;
    }
  }

  public static saveOpiateLogs(logs: OpiateLogEntry[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.STORAGE_KEY_OPIATE_LOGS, JSON.stringify(logs));
      window.dispatchEvent(new CustomEvent('say_clinic_opiate_logs_changed', { detail: logs }));
      RealtimeSyncService.publish('opiate_logs', logs);
    } catch (e) {
      console.error('Chyba ukladania knihy opiátov:', e);
    }
  }

  // Zápis o podaní opiátu pacientovi s odpisom zo zásob
  public static recordOpiateUsage(entry: {
    opiateId: string;
    patientId?: string;
    patientName: string;
    patientBirthNumber?: string;
    procedureName: string;
    prescribingDoctor: string;
    administeringNurse: string;
    witness?: string;
    quantityOut: number;
    quantityWasted?: number;
    notes?: string;
    recordedBy: string;
    date?: string;
    time?: string;
  }): { success: boolean; error?: string; log?: OpiateLogEntry } {
    const opiates = this.getOpiates();
    const opiate = opiates.find(o => o.id === entry.opiateId);
    if (!opiate) {
      return { success: false, error: 'Opiát nebol nájdený v trezore.' };
    }

    if (opiate.currentStock < entry.quantityOut) {
      return { 
        success: false, 
        error: `Nedostatočná zásoba v trezore! K dispozícii je len ${opiate.currentStock} ${opiate.packageUnit}.` 
      };
    }

    const now = new Date();
    const date = entry.date || now.toISOString().split('T')[0];
    const time = entry.time || now.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });

    const newStock = Math.max(0, opiate.currentStock - entry.quantityOut);
    const logs = this.getOpiateLogs();
    const nextEntryNum = logs.reduce((max, l) => Math.max(max, l.entryNumber || 0), 0) + 1;

    const newLog: OpiateLogEntry = {
      id: `opl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      entryNumber: nextEntryNum,
      timestamp: now.toISOString(),
      date,
      time,
      opiateId: opiate.id,
      opiateName: opiate.name,
      activeSubstance: opiate.activeSubstance,
      lotNumber: opiate.lotNumber,
      movementType: 'podanie',
      patientId: entry.patientId,
      patientName: entry.patientName,
      patientBirthNumber: entry.patientBirthNumber,
      procedureName: entry.procedureName,
      prescribingDoctor: entry.prescribingDoctor,
      administeringNurse: entry.administeringNurse,
      witness: entry.witness,
      quantityIn: 0,
      quantityOut: entry.quantityOut,
      quantityWasted: entry.quantityWasted,
      balanceAfter: newStock,
      unit: opiate.packageUnit,
      notes: entry.notes,
      recordedBy: entry.recordedBy || entry.administeringNurse
    };

    // Aktualizácia stavu zásob opiátu
    const updatedOpiates = opiates.map(o => o.id === opiate.id ? { ...o, currentStock: newStock } : o);
    this.saveOpiates(updatedOpiates);

    // Uloženie do audit logu
    const updatedLogs = [newLog, ...logs];
    this.saveOpiateLogs(updatedLogs);

    return { success: true, log: newLog };
  }

  // Príjem novej dodávky opiátov do trezoru (z lekárne na žiadanku OPL)
  public static recordOpiateReceipt(entry: {
    opiateId: string;
    deliveryNoteNumber: string;
    supplier: string;
    quantityIn: number;
    lotNumber?: string;
    expirationDate?: string;
    notes?: string;
    recordedBy: string;
    date?: string;
    time?: string;
  }): { success: boolean; error?: string; log?: OpiateLogEntry } {
    const opiates = this.getOpiates();
    const opiate = opiates.find(o => o.id === entry.opiateId);
    if (!opiate) {
      return { success: false, error: 'Opiát nebol nájdený v trezore.' };
    }

    const now = new Date();
    const date = entry.date || now.toISOString().split('T')[0];
    const time = entry.time || now.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });

    const newStock = opiate.currentStock + entry.quantityIn;
    const logs = this.getOpiateLogs();
    const nextEntryNum = logs.reduce((max, l) => Math.max(max, l.entryNumber || 0), 0) + 1;

    const newLog: OpiateLogEntry = {
      id: `opl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      entryNumber: nextEntryNum,
      timestamp: now.toISOString(),
      date,
      time,
      opiateId: opiate.id,
      opiateName: opiate.name,
      activeSubstance: opiate.activeSubstance,
      lotNumber: entry.lotNumber || opiate.lotNumber,
      movementType: 'prijem',
      deliveryNoteNumber: entry.deliveryNoteNumber,
      supplier: entry.supplier,
      quantityIn: entry.quantityIn,
      quantityOut: 0,
      balanceAfter: newStock,
      unit: opiate.packageUnit,
      notes: entry.notes,
      recordedBy: entry.recordedBy
    };

    const updatedOpiates = opiates.map(o => o.id === opiate.id ? { 
      ...o, 
      currentStock: newStock,
      lotNumber: entry.lotNumber || o.lotNumber,
      expirationDate: entry.expirationDate || o.expirationDate
    } : o);
    this.saveOpiates(updatedOpiates);

    const updatedLogs = [newLog, ...logs];
    this.saveOpiateLogs(updatedLogs);

    return { success: true, log: newLog };
  }

  // Protokolárne znehodnotenie zostatku / poškodenej ampulky za prítomnosti svedka
  public static recordOpiateWaste(entry: {
    opiateId: string;
    quantityWastedUnits: number; // Celé ampulky
    wasteReason: string; // napr. "Rozbitá ampulka pri manipulácii", "Exspirované liečivo"
    prescribingDoctor: string;
    administeringNurse: string;
    witness: string; // Povinný druhý podpis
    notes?: string;
    recordedBy: string;
  }): { success: boolean; error?: string; log?: OpiateLogEntry } {
    const opiates = this.getOpiates();
    const opiate = opiates.find(o => o.id === entry.opiateId);
    if (!opiate) return { success: false, error: 'Opiát nebol nájdený.' };

    if (opiate.currentStock < entry.quantityWastedUnits) {
      return { success: false, error: 'Počet na znehodnotenie presahuje zásobu v trezore.' };
    }

    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });

    const newStock = Math.max(0, opiate.currentStock - entry.quantityWastedUnits);
    const logs = this.getOpiateLogs();
    const nextEntryNum = logs.reduce((max, l) => Math.max(max, l.entryNumber || 0), 0) + 1;

    const newLog: OpiateLogEntry = {
      id: `opl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      entryNumber: nextEntryNum,
      timestamp: now.toISOString(),
      date,
      time,
      opiateId: opiate.id,
      opiateName: opiate.name,
      activeSubstance: opiate.activeSubstance,
      lotNumber: opiate.lotNumber,
      movementType: 'znehodnotenie',
      procedureName: `Protokolárna likvidácia OPL: ${entry.wasteReason}`,
      prescribingDoctor: entry.prescribingDoctor,
      administeringNurse: entry.administeringNurse,
      witness: entry.witness,
      quantityIn: 0,
      quantityOut: entry.quantityWastedUnits,
      balanceAfter: newStock,
      unit: opiate.packageUnit,
      notes: `Znehodnotené a zlikvidované za prítomnosti svedka: ${entry.witness}. ${entry.notes || ''}`,
      recordedBy: entry.recordedBy
    };

    const updatedOpiates = opiates.map(o => o.id === opiate.id ? { ...o, currentStock: newStock } : o);
    this.saveOpiates(updatedOpiates);

    const updatedLogs = [newLog, ...logs];
    this.saveOpiateLogs(updatedLogs);

    return { success: true, log: newLog };
  }

  // Fyzická kontrola a inventúra trezoru OPL
  public static recordOpiateInventoryCheck(entry: {
    doctorName: string;
    nurseName: string;
    notes?: string;
  }): OpiateLogEntry {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });

    const logs = this.getOpiateLogs();
    const nextEntryNum = logs.reduce((max, l) => Math.max(max, l.entryNumber || 0), 0) + 1;

    const newLog: OpiateLogEntry = {
      id: `opl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      entryNumber: nextEntryNum,
      timestamp: now.toISOString(),
      date,
      time,
      opiateId: 'vsetky',
      opiateName: 'Fyzická inventúra trezoru OPL',
      activeSubstance: 'Všetky evidované OPL',
      lotNumber: 'Všetky šarže',
      movementType: 'inventura',
      prescribingDoctor: entry.doctorName,
      administeringNurse: entry.nurseName,
      witness: entry.nurseName,
      quantityIn: 0,
      quantityOut: 0,
      balanceAfter: 0,
      unit: 'trezor',
      notes: entry.notes || 'Riadna mesačná fyzická kontrola trezoru OPL. Fyzické počty ampuliek a šarže plne súhlasia so záznamami v knihe.',
      recordedBy: entry.doctorName
    };

    const updatedLogs = [newLog, ...logs];
    this.saveOpiateLogs(updatedLogs);
    return newLog;
  }

  // Správa katalógu OPL
  public static addOpiateItem(item: OpiateItem): void {
    const opiates = this.getOpiates();
    const updated = [item, ...opiates];
    this.saveOpiates(updated);
  }

  public static updateOpiateItem(item: OpiateItem): void {
    const opiates = this.getOpiates();
    const updated = opiates.map(o => o.id === item.id ? item : o);
    this.saveOpiates(updated);
  }

  public static deleteOpiateItem(id: string): void {
    const opiates = this.getOpiates();
    const updated = opiates.filter(o => o.id !== id);
    this.saveOpiates(updated);
  }

  public static deleteOpiateLog(logId: string): void {
    const logs = this.getOpiateLogs();
    const updated = logs.filter(l => l.id !== logId);
    this.saveOpiateLogs(updated);
  }
}
