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
