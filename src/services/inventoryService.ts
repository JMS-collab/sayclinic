// Správa skladu, spotreby materiálu a objednávok pre SAY CLINIC
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

export interface MaterialBundle {
  id: string;
  serviceName: string;
  description: string;
  items: { itemId: string; quantity: number }[];
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

// Predvolený katalóg klinických opiátov v trezore SAY CLINIC
export const INITIAL_OPIATES: OpiateItem[] = [
  {
    id: 'op-fentanyl',
    name: 'Fentanyl Kalceks 0.05 mg/ml (0.1 mg / 2 ml inj.)',
    activeSubstance: 'Fentanylum',
    form: 'injekčný roztok v ampulkách (5x2ml)',
    strength: '0.1 mg / 2 ml',
    packageUnit: 'ampulka',
    currentStock: 18,
    minStock: 8,
    lotNumber: 'LOT-FNT-992',
    expirationDate: '2027-11-30',
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
    currentStock: 12,
    minStock: 6,
    lotNumber: 'LOT-SUF-418',
    expirationDate: '2028-02-28',
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
    currentStock: 14,
    minStock: 5,
    lotNumber: 'LOT-DPD-770',
    expirationDate: '2027-09-15',
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
    currentStock: 10,
    minStock: 5,
    lotNumber: 'LOT-MPH-331',
    expirationDate: '2028-06-30',
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
    currentStock: 6,
    minStock: 3,
    lotNumber: 'LOT-KTM-552',
    expirationDate: '2028-04-30',
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
    currentStock: 22,
    minStock: 10,
    lotNumber: 'LOT-MDZ-889',
    expirationDate: '2027-12-15',
    safeLocation: 'Trezor OPL č. 1 - Zákroková miestnosť',
    responsiblePerson: 'MUDr. Ján Mráz',
    classification: 'psychotropna_latka_III',
    suklCode: '0115322',
    notes: 'Krátkodobo pôsobiaci benzodiazepín na premedikáciu a analgosedáciu'
  }
];

// Predvolený úradný register (Kniha OPL)
export const INITIAL_OPIATE_LOGS: OpiateLogEntry[] = [
  {
    id: 'opl-log-1',
    entryNumber: 1,
    timestamp: '2026-08-28T08:15:00.000Z',
    date: '2026-08-28',
    time: '08:15',
    opiateId: 'op-fentanyl',
    opiateName: 'Fentanyl Kalceks 0.05 mg/ml (0.1 mg / 2 ml inj.)',
    activeSubstance: 'Fentanylum',
    lotNumber: 'LOT-FNT-992',
    movementType: 'prijem',
    deliveryNoteNumber: 'Žiadanka OPL č. 2026/08-042',
    supplier: 'Lekáreň Nemocnice s poliklinikou Banská Bystrica',
    quantityIn: 20,
    quantityOut: 0,
    balanceAfter: 20,
    unit: 'ampulka',
    notes: 'Príjem do trezoru na základe úradnej žiadanky s modrým pruhom',
    recordedBy: 'MUDr. Ján Mráz'
  },
  {
    id: 'opl-log-2',
    entryNumber: 2,
    timestamp: '2026-08-28T08:20:00.000Z',
    date: '2026-08-28',
    time: '08:20',
    opiateId: 'op-dipidolor',
    opiateName: 'Dipidolor 15 mg / 2 ml injekčný roztok',
    activeSubstance: 'Piritramidum',
    lotNumber: 'LOT-DPD-770',
    movementType: 'prijem',
    deliveryNoteNumber: 'Žiadanka OPL č. 2026/08-042',
    supplier: 'Lekáreň Nemocnice s poliklinikou Banská Bystrica',
    quantityIn: 15,
    quantityOut: 0,
    balanceAfter: 15,
    unit: 'ampulka',
    notes: 'Príjem do trezoru na základe žiadanky OPL',
    recordedBy: 'MUDr. Ján Mráz'
  },
  {
    id: 'opl-log-3',
    entryNumber: 3,
    timestamp: '2026-09-02T10:15:00.000Z',
    date: '2026-09-02',
    time: '10:15',
    opiateId: 'op-fentanyl',
    opiateName: 'Fentanyl Kalceks 0.05 mg/ml (0.1 mg / 2 ml inj.)',
    activeSubstance: 'Fentanylum',
    lotNumber: 'LOT-FNT-992',
    movementType: 'podanie',
    patientId: 'P1',
    patientName: 'Mária Kováčová',
    patientBirthNumber: '885512/6789',
    procedureName: 'Augmentácia prsníkov silikónovými implantátmi v CA',
    prescribingDoctor: 'MUDr. Ján Mráz',
    administeringNurse: 'Bc. Simona Horváthová',
    witness: 'PhDr. Veronika Vargová',
    quantityIn: 0,
    quantityOut: 2,
    balanceAfter: 18,
    unit: 'ampulka',
    notes: 'Podané v úvode celkovej anestézie a počas intraoperatívnej fázy',
    recordedBy: 'Bc. Simona Horváthová'
  },
  {
    id: 'opl-log-4',
    entryNumber: 4,
    timestamp: '2026-09-02T13:30:00.000Z',
    date: '2026-09-02',
    time: '13:30',
    opiateId: 'op-dipidolor',
    opiateName: 'Dipidolor 15 mg / 2 ml injekčný roztok',
    activeSubstance: 'Piritramidum',
    lotNumber: 'LOT-DPD-770',
    movementType: 'podanie',
    patientId: 'P1',
    patientName: 'Mária Kováčová',
    patientBirthNumber: '885512/6789',
    procedureName: 'Pooperačná analgézia po augmentácii prsníkov',
    prescribingDoctor: 'MUDr. Ján Mráz',
    administeringNurse: 'Bc. Simona Horváthová',
    witness: 'MUDr. Ján Mráz',
    quantityIn: 0,
    quantityOut: 1,
    balanceAfter: 14,
    unit: 'ampulka',
    notes: 'Aplikované 15 mg i.m. na dospávacej izbe pri VAS 6/10',
    recordedBy: 'Bc. Simona Horváthová'
  },
  {
    id: 'opl-log-5',
    entryNumber: 5,
    timestamp: '2026-09-03T11:00:00.000Z',
    date: '2026-09-03',
    time: '11:00',
    opiateId: 'op-midazolam',
    opiateName: 'Midazolam Accord 5 mg / 1 ml (bal 10x1ml)',
    activeSubstance: 'Midazolamum',
    lotNumber: 'LOT-MDZ-889',
    movementType: 'podanie',
    patientId: 'P2',
    patientName: 'Ján Novák',
    patientBirthNumber: '750314/1234',
    procedureName: 'Blefaroplastika horných viečok v analgosedácii',
    prescribingDoctor: 'MUDr. Ján Mráz',
    administeringNurse: 'PhDr. Veronika Vargová',
    witness: 'MUDr. Ján Mráz',
    quantityIn: 0,
    quantityOut: 1,
    quantityWasted: 0.5,
    balanceAfter: 22,
    unit: 'ampulka',
    notes: 'Aplikované 2.5 mg i.v. do sedácie; nespotrebovaný zvyšok 2.5 mg (0.5 ml) znehodnotený do odpadu za prítomnosti lekára',
    recordedBy: 'PhDr. Veronika Vargová'
  },
  {
    id: 'opl-log-6',
    entryNumber: 6,
    timestamp: '2026-09-04T07:30:00.000Z',
    date: '2026-09-04',
    time: '07:30',
    opiateId: 'op-fentanyl',
    opiateName: 'Všetky OPL v trezore',
    activeSubstance: 'Komplexná kontrola',
    lotNumber: 'Všetky šarže',
    movementType: 'inventura',
    prescribingDoctor: 'MUDr. Ján Mráz',
    administeringNurse: 'Bc. Simona Horváthová',
    witness: 'PhDr. Veronika Vargová',
    quantityIn: 0,
    quantityOut: 0,
    balanceAfter: 18,
    unit: 'ampulka',
    notes: 'Riadna mesačná fyzická kontrola trezoru OPL k 01.09.2026. Fyzický stav ampuliek a šarží plne súhlasí so stavom v knihe.',
    recordedBy: 'MUDr. Ján Mráz'
  }
];

// Predvolené skladové zásoby SAY CLINIC
export const INITIAL_INVENTORY: InventoryItem[] = [
  // ESTETIKA & VÝPLNE
  { id: 'inv-dysport', name: 'Dysport 500U vialka', category: 'estetika', quantity: 4, unit: 'vialka', minQuantity: 5, optimalQuantity: 12, costPerUnit: 145, supplier: 'Galderma', lotNumber: 'DY-8821', expirationDate: '2027-08-15', location: 'Chladnička 1' },
  { id: 'inv-botox', name: 'Botox 100U vialka', category: 'estetika', quantity: 6, unit: 'vialka', minQuantity: 4, optimalQuantity: 10, costPerUnit: 138, supplier: 'Allergan / AbbVie', lotNumber: 'BTX-4491', expirationDate: '2027-06-20', location: 'Chladnička 1' },
  { id: 'inv-restylane-kysse', name: 'Restylane Kysse 1ml (pery)', category: 'estetika', quantity: 3, unit: 'ks', minQuantity: 5, optimalQuantity: 12, costPerUnit: 105, supplier: 'Galderma', lotNumber: 'RK-7712', expirationDate: '2027-10-10', location: 'Skriňa Estetika' },
  { id: 'inv-restylane-lyft', name: 'Restylane Lyft 1ml s lidokaínom', category: 'estetika', quantity: 5, unit: 'ks', minQuantity: 4, optimalQuantity: 10, costPerUnit: 108, supplier: 'Galderma', lotNumber: 'RL-5520', expirationDate: '2027-11-15', location: 'Skriňa Estetika' },
  { id: 'inv-juvederm-voluma', name: 'Juvederm Voluma 2x1ml', category: 'estetika', quantity: 2, unit: 'bal', minQuantity: 3, optimalQuantity: 8, costPerUnit: 215, supplier: 'Allergan / AbbVie', lotNumber: 'JV-9902', expirationDate: '2027-04-30', location: 'Skriňa Estetika' },
  { id: 'inv-profhilo', name: 'Profhilo Bioremodelácia 2ml', category: 'estetika', quantity: 7, unit: 'ks', minQuantity: 4, optimalQuantity: 12, costPerUnit: 118, supplier: 'IBSA Derma', lotNumber: 'PF-9011', expirationDate: '2027-09-01', location: 'Skriňa Estetika' },
  { id: 'inv-sculptra', name: 'Sculptra PLLA (balenie 2 vialky)', category: 'estetika', quantity: 1, unit: 'bal', minQuantity: 3, optimalQuantity: 6, costPerUnit: 340, supplier: 'Galderma', lotNumber: 'SC-1022', expirationDate: '2028-02-15', location: 'Skriňa Estetika' },
  { id: 'inv-radiesse', name: 'Radiesse (+) 1.5ml Lidocaine', category: 'estetika', quantity: 4, unit: 'ks', minQuantity: 3, optimalQuantity: 8, costPerUnit: 135, supplier: 'Merz Aesthetics', lotNumber: 'RAD-3041', expirationDate: '2027-12-05', location: 'Skriňa Estetika' },
  { id: 'inv-pdo-threads', name: 'Mezonite PDO Barbed 4D 21G/90mm (bal 10ks)', category: 'estetika', quantity: 2, unit: 'bal', minQuantity: 4, optimalQuantity: 8, costPerUnit: 95, supplier: 'Aptos / Medixa', lotNumber: 'PDO-4401', expirationDate: '2028-05-10', location: 'Skriňa Estetika' },
  { id: 'inv-cannula-tsk', name: 'Sterilné mikro-kanyly TSK 25G/50mm (bal 20ks)', category: 'estetika', quantity: 8, unit: 'bal', minQuantity: 5, optimalQuantity: 15, costPerUnit: 42, supplier: 'TSK Laboratory', lotNumber: 'TSK-901', expirationDate: '2029-01-20', location: 'Skriňa Estetika' },

  // CHIRURGICKÉ IMPLANTÁTY
  { id: 'inv-motiva-350-dx', name: 'Motiva Ergonomix Full 350cc Vpravo (Dx.)', category: 'implantaty', quantity: 1, unit: 'ks', minQuantity: 2, optimalQuantity: 4, costPerUnit: 690, supplier: 'Establishment Labs (Motiva)', lotNumber: 'LOT-MOT-26A', supplierCode: 'MOT-ERG-350F-DX', location: 'Operačný sklad' },
  { id: 'inv-motiva-350-sin', name: 'Motiva Ergonomix Full 350cc Vľavo (Sin.)', category: 'implantaty', quantity: 1, unit: 'ks', minQuantity: 2, optimalQuantity: 4, costPerUnit: 690, supplier: 'Establishment Labs (Motiva)', lotNumber: 'LOT-MOT-26B', supplierCode: 'MOT-ERG-350F-SIN', location: 'Operačný sklad' },
  { id: 'inv-motiva-320-bilat', name: 'Motiva Ergonomix Demi 320cc Pár (Bilat.)', category: 'implantaty', quantity: 2, unit: 'pár', minQuantity: 2, optimalQuantity: 4, costPerUnit: 1380, supplier: 'Establishment Labs (Motiva)', lotNumber: 'LOT-MOT-26D', supplierCode: 'MOT-ERG-320D-PAR', location: 'Operačný sklad' },
  { id: 'inv-supor-chin', name: 'Tvárový implantát bradový Su-por Large', category: 'implantaty', quantity: 2, unit: 'ks', minQuantity: 2, optimalQuantity: 3, costPerUnit: 380, supplier: 'Porex Surgical', lotNumber: 'SP-9912', location: 'Operačný sklad' },

  // KOMPRESÍVNE PRÁDLO & BANDÁŽE
  { id: 'inv-bra-ideal-black-m', name: 'Kompresívna podprsenka Lipoelastic PI Ideal čierna M', category: 'kompresivne_pradlo', quantity: 3, unit: 'ks', minQuantity: 6, optimalQuantity: 12, costPerUnit: 39, supplier: 'Lipoelastic', supplierCode: 'PI-IDEAL-BLK-M', location: 'Sklad prádla' },
  { id: 'inv-bra-ideal-nude-s', name: 'Kompresívna podprsenka Lipoelastic PI Ideal telová S', category: 'kompresivne_pradlo', quantity: 2, unit: 'ks', minQuantity: 5, optimalQuantity: 10, costPerUnit: 39, supplier: 'Lipoelastic', supplierCode: 'PI-IDEAL-NDE-S', location: 'Sklad prádla' },
  { id: 'inv-bra-special-l', name: 'Kompresívna podprsenka Lipoelastic PI Special biela L', category: 'kompresivne_pradlo', quantity: 4, unit: 'ks', minQuantity: 4, optimalQuantity: 8, costPerUnit: 38, supplier: 'Lipoelastic', supplierCode: 'PI-SPEC-WHT-L', location: 'Sklad prádla' },
  { id: 'inv-belt-sg', name: 'Stabilizačný prsníkový pás Lipoelastic SG biely', category: 'kompresivne_pradlo', quantity: 5, unit: 'ks', minQuantity: 6, optimalQuantity: 14, costPerUnit: 24, supplier: 'Lipoelastic', supplierCode: 'SG-BELT-WHT', location: 'Sklad prádla' },
  { id: 'inv-abdo-belt', name: 'Brušný kompresívny pás 3-panelový Lipoelastic (L/XL)', category: 'kompresivne_pradlo', quantity: 1, unit: 'ks', minQuantity: 4, optimalQuantity: 8, costPerUnit: 44, supplier: 'Lipoelastic', supplierCode: 'ABDO-3P-LXL', location: 'Sklad prádla' },
  { id: 'inv-face-mask', name: 'Tvárová kompresná bandáž Lipoelastic FM special', category: 'kompresivne_pradlo', quantity: 4, unit: 'ks', minQuantity: 3, optimalQuantity: 6, costPerUnit: 32, supplier: 'Lipoelastic', supplierCode: 'FM-SPEC', location: 'Sklad prádla' },
  { id: 'inv-nasal-splint', name: 'Termoplastická nosová dlaha fixačná po rhinoplastike', category: 'kompresivne_pradlo', quantity: 7, unit: 'ks', minQuantity: 5, optimalQuantity: 15, costPerUnit: 14, supplier: 'SurgiPlast', location: 'Operačný sklad' },

  // ŠIJACÍ MATERIÁL, HEMOSTATIKÁ & DRÉNY
  { id: 'inv-monocryl-40', name: 'Monocryl 4-0 ihla PS-2 (bal 36ks)', category: 'sijaci_material', quantity: 2, unit: 'bal', minQuantity: 3, optimalQuantity: 6, costPerUnit: 98, supplier: 'Ethicon / J&J', lotNumber: 'MNC-2026', location: 'Operačná sála' },
  { id: 'inv-pds-40', name: 'PDS II 4-0 ihla SH-1 (bal 36ks)', category: 'sijaci_material', quantity: 3, unit: 'bal', minQuantity: 2, optimalQuantity: 5, costPerUnit: 112, supplier: 'Ethicon / J&J', lotNumber: 'PDS-552', location: 'Operačná sála' },
  { id: 'inv-glycolon-40', name: 'Glycolon 4-0 intrakutánny intrakut. steh (bal 24ks)', category: 'sijaci_material', quantity: 4, unit: 'bal', minQuantity: 3, optimalQuantity: 6, costPerUnit: 84, supplier: 'Resorba', lotNumber: 'GLY-771', location: 'Operačná sála' },
  { id: 'inv-prolene-50', name: 'Prolene 5-0 ihla P-3 na blepharoplastiku (bal 36ks)', category: 'sijaci_material', quantity: 2, unit: 'bal', minQuantity: 3, optimalQuantity: 6, costPerUnit: 104, supplier: 'Ethicon / J&J', lotNumber: 'PRL-901', location: 'Operačná sála' },
  { id: 'inv-vicryl-30', name: 'Vicryl 3-0 ihla CT-1 (bal 36ks)', category: 'sijaci_material', quantity: 5, unit: 'bal', minQuantity: 3, optimalQuantity: 6, costPerUnit: 88, supplier: 'Ethicon / J&J', lotNumber: 'VCR-331', location: 'Operačná sála' },
  { id: 'inv-surgicel', name: 'Surgicel hemostatická gáza 5x7.5cm (bal 10ks)', category: 'sijaci_material', quantity: 3, unit: 'bal', minQuantity: 4, optimalQuantity: 8, costPerUnit: 78, supplier: 'Ethicon / J&J', lotNumber: 'SRG-881', location: 'Operačná sála' },
  { id: 'inv-floseal', name: 'Floseal hemostatická matrica 5ml', category: 'sijaci_material', quantity: 2, unit: 'ks', minQuantity: 2, optimalQuantity: 4, costPerUnit: 165, supplier: 'Baxter', lotNumber: 'FLS-4410', location: 'Operačná sála' },
  { id: 'inv-redon-ch10', name: 'Redonov podtlakový drén CH10 so zberačom', category: 'sijaci_material', quantity: 6, unit: 'ks', minQuantity: 10, optimalQuantity: 25, costPerUnit: 6.8, supplier: 'B.Braun', lotNumber: 'RDN-101', location: 'Operačný sklad' },

  // ANESTÉZIA & FARMAKÁ
  { id: 'inv-marcaine', name: 'Marcaine 0.5% (bupivakain) 20ml', category: 'anestezia', quantity: 14, unit: 'vialka', minQuantity: 10, optimalQuantity: 30, costPerUnit: 4.6, supplier: 'AstraZeneca', lotNumber: 'MAR-8821', expirationDate: '2028-03-10', location: 'Skriňa Anestézia' },
  { id: 'inv-citanest', name: 'Citanest 2% s octapresinom 50ml', category: 'anestezia', quantity: 8, unit: 'vialka', minQuantity: 6, optimalQuantity: 15, costPerUnit: 8.2, supplier: 'Dentsply Sirona', lotNumber: 'CIT-229', expirationDate: '2027-11-20', location: 'Skriňa Anestézia' },
  { id: 'inv-adrenaline', name: 'Adrenalín 1mg/1ml injekcie (bal 5ks)', category: 'anestezia', quantity: 9, unit: 'bal', minQuantity: 6, optimalQuantity: 15, costPerUnit: 7.5, supplier: 'Zentiva', lotNumber: 'ADR-904', expirationDate: '2028-06-01', location: 'Skriňa Anestézia' },
  { id: 'inv-ringer-tumescent', name: 'Ringer-laktát infúzny roztok 1000ml na tumescenciu', category: 'anestezia', quantity: 12, unit: 'ks', minQuantity: 15, optimalQuantity: 40, costPerUnit: 2.8, supplier: 'B.Braun', lotNumber: 'RNG-551', expirationDate: '2028-09-15', location: 'Operačný sklad' },
  { id: 'inv-augmentin', name: 'Augmentin 1.2g i.v. antibiotikum', category: 'anestezia', quantity: 7, unit: 'vialka', minQuantity: 10, optimalQuantity: 20, costPerUnit: 5.2, supplier: 'GSK', lotNumber: 'AUG-112', expirationDate: '2027-08-30', location: 'Skriňa Anestézia' },

  // AMBULANTNÝ & SPOTREBNÝ MATERIÁL
  { id: 'inv-mepore', name: 'Sterilné pooperačné krytie Mepore Pro 9x10cm (bal 50ks)', category: 'ambulantny_material', quantity: 3, unit: 'bal', minQuantity: 4, optimalQuantity: 8, costPerUnit: 28, supplier: 'Mölnlycke Health Care', lotNumber: 'MEP-331', location: 'Ambulancia' },
  { id: 'inv-steri-strip', name: 'Steri-Strip náplasťové stehy 6x75mm (bal 50ks)', category: 'ambulantny_material', quantity: 7, unit: 'bal', minQuantity: 5, optimalQuantity: 12, costPerUnit: 34, supplier: '3M Health Care', lotNumber: 'STS-881', location: 'Ambulancia' },
  { id: 'inv-dermacyn', name: 'Dermacyn Wound Care 500ml dezinfekčný roztok', category: 'ambulantny_material', quantity: 4, unit: 'ks', minQuantity: 3, optimalQuantity: 6, costPerUnit: 18.5, supplier: 'Oculus Innovative', lotNumber: 'DERM-550', location: 'Ambulancia' },
  { id: 'inv-gloves-biogel', name: 'Sterilné chirurgické rukavice Biogel 7.5 (bal 50ks)', category: 'spotrebny', quantity: 5, unit: 'bal', minQuantity: 4, optimalQuantity: 10, costPerUnit: 48, supplier: 'Mölnlycke Health Care', lotNumber: 'GLV-752', location: 'Operačný sklad' },
  { id: 'inv-prp-tubes', name: 'Odberové skúmavky s gélom na PRP plazmu (bal 50ks)', category: 'ambulantny_material', quantity: 1, unit: 'bal', minQuantity: 2, optimalQuantity: 5, costPerUnit: 180, supplier: 'RegenLab', lotNumber: 'PRP-2026', location: 'Ambulancia' },
];

// Počiatočné balíčky výkonov
export const INITIAL_BUNDLES: MaterialBundle[] = [
  {
    id: 'bundle-augmentacia',
    serviceName: 'Augmentácia prsníkov',
    description: 'Kompletný operačný set pre augmentáciu vrátane prádla a drénov',
    items: [
      { itemId: 'inv-marcaine', quantity: 2 },
      { itemId: 'inv-pds-40', quantity: 1 },
      { itemId: 'inv-monocryl-40', quantity: 1 },
      { itemId: 'inv-glycolon-40', quantity: 1 },
      { itemId: 'inv-surgicel', quantity: 1 },
      { itemId: 'inv-redon-ch10', quantity: 2 },
      { itemId: 'inv-bra-ideal-black-m', quantity: 1 },
      { itemId: 'inv-belt-sg', quantity: 1 },
    ]
  },
  {
    id: 'bundle-blefaroplastika',
    serviceName: 'Blefaroplastika (operácia očných viečok)',
    description: 'Lokálna anestézia, jemný šijací materiál a ošetrenie',
    items: [
      { itemId: 'inv-citanest', quantity: 1 },
      { itemId: 'inv-adrenaline', quantity: 1 },
      { itemId: 'inv-prolene-50', quantity: 1 },
      { itemId: 'inv-steri-strip', quantity: 1 },
    ]
  },
  {
    id: 'bundle-botox-full',
    serviceName: 'Aplikácia Dysportu / Botoxu (Full Face)',
    description: 'Kompletná neurotoxínová kúra čelo, glabela, periorbitálne',
    items: [
      { itemId: 'inv-dysport', quantity: 1 },
      { itemId: 'inv-cannula-tsk', quantity: 1 },
    ]
  },
  {
    id: 'bundle-facelift',
    serviceName: 'Face-lift & Neck-lift',
    description: 'Chirurgický lifting tváre, šitie, hemostáza a kompresná bandáž',
    items: [
      { itemId: 'inv-marcaine', quantity: 3 },
      { itemId: 'inv-pds-40', quantity: 2 },
      { itemId: 'inv-monocryl-40', quantity: 2 },
      { itemId: 'inv-floseal', quantity: 1 },
      { itemId: 'inv-redon-ch10', quantity: 2 },
      { itemId: 'inv-face-mask', quantity: 1 },
    ]
  },
  {
    id: 'bundle-prevaz',
    serviceName: 'Ambulantný pooperačný preväz a kontrola',
    description: 'Antiseptické ošetrenie, výmena pooperačného krytia a náplasťová fixácia',
    items: [
      { itemId: 'inv-dermacyn', quantity: 1 },
      { itemId: 'inv-mepore', quantity: 1 },
      { itemId: 'inv-steri-strip', quantity: 1 },
    ]
  }
];

// Počiatočný audit log minutého materiálu (demonštratívne záznamy)
export const INITIAL_USAGE_LOGS: MaterialUsageLog[] = [
  {
    id: 'log-init-1',
    timestamp: '2026-09-02T10:30:00.000Z',
    date: '2026-09-02',
    time: '10:30',
    patientId: 'P1',
    patientName: 'Mária Kováčová',
    patientBirthNumber: '885512/6789',
    sourceType: 'operacia',
    procedureName: 'Augmentácia prsníkov silikónovými implantátmi',
    itemId: 'inv-motiva-350-dx',
    itemName: 'Motiva Ergonomix Full 350cc Vpravo (Dx.)',
    category: 'implantaty',
    quantity: 1,
    unit: 'ks',
    lotNumber: 'LOT-MOT-26A',
    serialNumber: 'MOT-SN-882190',
    performerName: 'MUDr. Ján Mráz',
    costAtUsage: 690,
    notes: 'Subfasciálna insercia bez komplikácií'
  },
  {
    id: 'log-init-2',
    timestamp: '2026-09-02T10:30:00.000Z',
    date: '2026-09-02',
    time: '10:30',
    patientId: 'P1',
    patientName: 'Mária Kováčová',
    patientBirthNumber: '885512/6789',
    sourceType: 'operacia',
    procedureName: 'Augmentácia prsníkov silikónovými implantátmi',
    itemId: 'inv-motiva-350-sin',
    itemName: 'Motiva Ergonomix Full 350cc Vľavo (Sin.)',
    category: 'implantaty',
    quantity: 1,
    unit: 'ks',
    lotNumber: 'LOT-MOT-26B',
    serialNumber: 'MOT-SN-882191',
    performerName: 'MUDr. Ján Mráz',
    costAtUsage: 690,
    notes: 'Subfasciálna insercia bez komplikácií'
  },
  {
    id: 'log-init-3',
    timestamp: '2026-09-02T11:15:00.000Z',
    date: '2026-09-02',
    time: '11:15',
    patientId: 'P1',
    patientName: 'Mária Kováčová',
    patientBirthNumber: '885512/6789',
    sourceType: 'pradlo',
    procedureName: 'Výdaj pooperačnej bielizne na izbe',
    itemId: 'inv-bra-ideal-black-m',
    itemName: 'Kompresívna podprsenka Lipoelastic PI Ideal čierna M',
    category: 'kompresivne_pradlo',
    quantity: 1,
    unit: 'ks',
    lotNumber: 'PI-IDEAL-BLK-M',
    performerName: 'Sestra Bc. Zuzana Solivajsová',
    costAtUsage: 39,
    notes: 'Naložená ihneď po operácii na sále'
  },
  {
    id: 'log-init-4',
    timestamp: '2026-09-02T14:20:00.000Z',
    date: '2026-09-02',
    time: '14:20',
    patientId: 'P2',
    patientName: 'Ján Novák',
    patientBirthNumber: '750314/1234',
    sourceType: 'estetika',
    procedureName: 'Korekcia vrások glabela a čelo (Dysport)',
    itemId: 'inv-dysport',
    itemName: 'Dysport 500U vialka',
    category: 'estetika',
    quantity: 1,
    unit: 'vialka',
    lotNumber: 'DY-8821',
    performerName: 'MUDr. Ján Mráz',
    costAtUsage: 145,
    notes: 'Aplikované 120 s.u. do m. procerus a corrugator'
  },
  {
    id: 'log-init-5',
    timestamp: '2026-09-03T08:45:00.000Z',
    date: '2026-09-03',
    time: '08:45',
    patientId: 'P1',
    patientName: 'Mária Kováčová',
    patientBirthNumber: '885512/6789',
    sourceType: 'ambulancia',
    procedureName: '1. pooperačný preväz a kontrola drénov',
    itemId: 'inv-mepore',
    itemName: 'Sterilné pooperačné krytie Mepore Pro 9x10cm (bal 50ks)',
    category: 'ambulantny_material',
    quantity: 2,
    unit: 'ks',
    lotNumber: 'MEP-331',
    performerName: 'MUDr. Ján Mráz',
    costAtUsage: 1.12,
    notes: 'Rany pokojné, drény odvádzajú serózne'
  }
];

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
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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
