export interface PrescribedMedication {
  id: string;
  substance: string; // Účinná látka, napr. "metamizol, sodná soľ" alebo "amoxicilín / kyselina klavulánová"
  formAndStrength: string; // Lieková forma a sila, napr. "tbl flm 20x500 mg (blis.Al/PVC)"
  packaging: string; // Balenie, napr. "Exp. orig. No I (unam)"
  dosage: string; // Dávkovanie, napr. "D.S. DOP pp." alebo "D.S. 1 tbl každých 12 hod."
  commercialName: string; // Komerčný názov v zátvorke, napr. "Novalgin 500 mg"
  latinName?: string; // Latinský ekvivalent (pre kompatibilitu)
  activeSubstance?: string;
  suklCode?: string; // ŠÚKL kód lieku (napr. 007981)
  category: 'atb' | 'analgetik' | 'lmwh' | 'edema' | 'local' | 'sedative' | 'dermatology' | 'other' | string;
  paymentType?: 'Hradí pacient' | 'Hradí ZP' | 'Čiastočne ZP';
  notes?: string;
  isCustom?: boolean;
  isModified?: boolean;
}

export interface PrescriptionData {
  doctorName: string;
  doctorCode: string; // Úradný kód lekára (napr. A57687038)
  pzsCode: string; // Kód PZS (napr. P70234011201)
  departmentCode: string; // Odbornosť (napr. 063)
  patientName: string;
  birthNumber: string;
  address: string;
  insuranceCode: string; // Kód ZP (24, 25, 27)
  diagnosis: string; // MKCH-10 kód (napr. Z411)
  prescriptionDate: string;
  items: PrescribedMedication[];
}

export const MEDICATION_CATALOG: PrescribedMedication[] = [
  // 1. ANALGETIKÁ & ANTIFLOGISTIKÁ
  {
    id: 'med_novalgin_500',
    substance: 'metamizol, sodná soľ',
    formAndStrength: 'tbl flm 20x500 mg (blis.Al/PVC)',
    packaging: 'Exp. orig. No I (unam)',
    dosage: 'D.S. DOP pp.',
    commercialName: 'Novalgin 500 mg',
    latinName: 'Metamizolum natricum monohydricum tbl flm 500 mg',
    activeSubstance: 'Metamizol',
    suklCode: '007981',
    category: 'analgetik',
    paymentType: 'Hradí pacient',
    notes: 'Nenávykové silné analgetikum a spazmolytikum'
  },
  {
    id: 'med_aulin_100',
    substance: 'nimesulid',
    formAndStrength: 'por gra sus 30x100 mg',
    packaging: 'Exp. orig. No I (unam)',
    dosage: 'D.S. 1 vrecko 2x denne po jedle pri bolesti',
    commercialName: 'Aulin 100 mg',
    latinName: 'Nimesulidum por gra sus 100 mg',
    activeSubstance: 'Nimesulid',
    suklCode: '016947',
    category: 'analgetik',
    paymentType: 'Hradí pacient',
    notes: 'Maximálne 15 dní nepretržite, chrániť žalúdok'
  },
  {
    id: 'med_flector_50',
    substance: 'diklofenak epolamín',
    formAndStrength: 'por gra sol 20x50 mg',
    packaging: 'Exp. orig. No I (unam)',
    dosage: 'D.S. 1 vrecko 2-3x denne po jedle pri bolesti',
    commercialName: 'Flector EP Rapid 50 mg',
    latinName: 'Diclofenacum epolaminum por gra sol 50 mg',
    activeSubstance: 'Diklofenak epolamín',
    suklCode: '092414',
    category: 'analgetik',
    paymentType: 'Hradí pacient',
    notes: 'Rýchly nástup analgetického a protizápalového účinku'
  },
  {
    id: 'med_doreta_375',
    substance: 'tramadoliumchlorid / paracetamol',
    formAndStrength: 'tbl flm 30x(37,5 mg/325 mg)',
    packaging: 'Exp. orig. No I (unam)',
    dosage: 'D.S. 1-2 tablety pri intenzívnej bolesti (max 4x denne)',
    commercialName: 'Doreta 37,5 mg/325 mg',
    latinName: 'Tramadoli hydrochloridum et paracetamolum tbl flm 37,5 mg/325 mg',
    activeSubstance: 'Tramadol + Paracetamol',
    suklCode: '028129',
    category: 'analgetik',
    paymentType: 'Hradí pacient',
    notes: 'Neriadiť motorové vozidlá'
  },
  {
    id: 'med_nalgesin_s',
    substance: 'naproxén, sodná soľ',
    formAndStrength: 'tbl flm 20x275 mg',
    packaging: 'Exp. orig. No I (unam)',
    dosage: 'D.S. 1 tableta každých 8-12 hodín po jedle',
    commercialName: 'Nalgesin S 275 mg',
    latinName: 'Naproxenum natricum tbl flm 275 mg',
    activeSubstance: 'Naproxén sodný',
    suklCode: '001923',
    category: 'analgetik',
    paymentType: 'Hradí pacient',
    notes: 'Protizápalový a analgetický účinok'
  },

  // 2. ANTIBIOTIKÁ (ATB)
  {
    id: 'med_augmentin_1g',
    substance: 'amoxicilín / kyselina klavulánová',
    formAndStrength: 'tbl flm 14x1 g (blis.Al/Al)',
    packaging: 'Exp. orig. No I (unam)',
    dosage: 'D.S. 1 tableta každých 12 hodín po jedle (7 dní)',
    commercialName: 'Augmentin 1 g',
    latinName: 'Amoxicillinum et acidum clavulanicum tbl flm 1 g',
    activeSubstance: 'Amoxicilín + Kyselina klavulánová',
    suklCode: '096431',
    category: 'atb',
    paymentType: 'Hradí pacient',
    notes: 'Užívať s jedlom, zapiť vodou'
  },
  {
    id: 'med_dalacin_300',
    substance: 'klindamycín, hydrochlorid',
    formAndStrength: 'cps dur 16x300 mg',
    packaging: 'Exp. orig. No I (unam)',
    dosage: 'D.S. 1 kapsula každých 8 hodín (pri alergii na PNC)',
    commercialName: 'Dalacin C 300 mg',
    latinName: 'Clindamycinum cps dur 300 mg',
    activeSubstance: 'Klindamycín',
    suklCode: '010188',
    category: 'atb',
    paymentType: 'Hradí pacient',
    notes: 'Zapíjať plným pohárom vody v stoji'
  },
  {
    id: 'med_ciprinol_500',
    substance: 'ciprofloxacín, hydrochlorid',
    formAndStrength: 'tbl flm 10x500 mg',
    packaging: 'Exp. orig. No I (unam)',
    dosage: 'D.S. 1 tableta každých 12 hodín (5-7 dní)',
    commercialName: 'Ciprinol 500 mg',
    latinName: 'Ciprofloxacinum tbl flm 500 mg',
    activeSubstance: 'Ciprofloxacín',
    suklCode: '091587',
    category: 'atb',
    paymentType: 'Hradí pacient',
    notes: 'Neužívať súčasne s mliečnymi výrobkami a minerálmi'
  },
  {
    id: 'med_klacid_500',
    substance: 'klaritromycín',
    formAndStrength: 'tbl flm 14x500 mg',
    packaging: 'Exp. orig. No I (unam)',
    dosage: 'D.S. 1 tableta každých 12 hodín po jedle (7 dní)',
    commercialName: 'Klacid 500 mg',
    latinName: 'Clarithromycinum tbl flm 500 mg',
    activeSubstance: 'Klaritromycín',
    suklCode: '002133',
    category: 'atb',
    paymentType: 'Hradí pacient',
    notes: 'Makrolidové antibiotikum'
  },
  {
    id: 'med_cefzil_500',
    substance: 'cefprozil, monohydrát',
    formAndStrength: 'tbl flm 10x500 mg',
    packaging: 'Exp. orig. No I (unam)',
    dosage: 'D.S. 1 tableta každých 12 hodín (5 dní)',
    commercialName: 'Cefzil 500 mg',
    latinName: 'Cefprozilum monohydricum tbl flm 500 mg',
    activeSubstance: 'Cefprozil',
    suklCode: '020295',
    category: 'atb',
    paymentType: 'Hradí pacient',
    notes: 'Cefalosporínové ATB 2. generácie'
  },
  {
    id: 'med_doxyhexal_100',
    substance: 'doxycyklín, monohydrát',
    formAndStrength: 'tbl 10x100 mg',
    packaging: 'Exp. orig. No I (unam)',
    dosage: 'D.S. 1. deň 2x1 tbl, potom 1x1 tbl denne po jedle',
    commercialName: 'Doxyhexal 100 mg',
    latinName: 'Doxycyclinum monohydricum tbl 100 mg',
    activeSubstance: 'Doxycyklín',
    suklCode: '004013',
    category: 'atb',
    paymentType: 'Hradí pacient',
    notes: 'Fotosenzitivita - vyhýbať sa priamemu slnku'
  },

  // 3. TROMBOPROFYLAXIA (LMWH)
  {
    id: 'med_enoxaparinum_40',
    substance: 'enoxaparín, sodná soľ',
    formAndStrength: 'inj sol 10x0,4 ml / 40 mg (4000 IU)',
    packaging: 'Exp. orig. No I (unam)',
    dosage: 'D.S. 1 injekcia s.c. 1x denne večer do podkožia brucha (10 dní)',
    commercialName: 'Clexane 40 mg / 4000 IU',
    latinName: 'Enoxaparinum natricum inj sol 4000 IU (40 mg)/0,4 ml',
    activeSubstance: 'Enoxaparín sodný',
    suklCode: '002978',
    category: 'lmwh',
    paymentType: 'Hradí pacient',
    notes: 'Aplikovať striedavo vpravo a vľavo od pupka'
  },
  {
    id: 'med_enoxaparinum_20',
    substance: 'enoxaparín, sodná soľ',
    formAndStrength: 'inj sol 10x0,2 ml / 20 mg (2000 IU)',
    packaging: 'Exp. orig. No I (unam)',
    dosage: 'D.S. 1 injekcia s.c. 1x denne večer do podkožia',
    commercialName: 'Clexane 20 mg / 2000 IU',
    latinName: 'Enoxaparinum natricum inj sol 2000 IU (20 mg)/0,2 ml',
    activeSubstance: 'Enoxaparín sodný',
    suklCode: '002977',
    category: 'lmwh',
    paymentType: 'Hradí pacient',
    notes: 'Znížená profylaktická dávka'
  },
  {
    id: 'med_nadroparinum_04',
    substance: 'nadroparín, vápenatá soľ',
    formAndStrength: 'inj sol 10x0,4 ml (3800 IU anti-Xa)',
    packaging: 'Exp. orig. No I (unam)',
    dosage: 'D.S. 1 injekcia s.c. 1x denne večer',
    commercialName: 'Fraxiparine 0,4 ml',
    latinName: 'Nadroparinum calcicum inj sol 3800 IU anti-Xa/0,4 ml',
    activeSubstance: 'Nadroparín vápenatý',
    suklCode: '002967',
    category: 'lmwh',
    paymentType: 'Hradí pacient',
    notes: 'Profylaxia tromboembolickej choroby'
  },

  // 4. PROTIOPUCHOVÁ & REGENERAČNÁ LIEČBA
  {
    id: 'med_aescinum_30',
    substance: 'aescín',
    formAndStrength: 'tbl obd 90x30 mg',
    packaging: 'Exp. orig. No I (unam)',
    dosage: 'D.S. 2 tablety 3x denne po jedle',
    commercialName: 'Aescin-Teva 30 mg',
    latinName: 'Aescinum tbl obd 30 mg',
    activeSubstance: 'Aescín',
    suklCode: '048578',
    category: 'edema',
    paymentType: 'Hradí pacient',
    notes: 'Redukcia pooperačného opuchu a hematómov'
  },
  {
    id: 'med_enzymatica',
    substance: 'pankreatín / papaín / bromelaín / rutozid',
    formAndStrength: 'tbl ent 200',
    packaging: 'Exp. orig. No I (unam)',
    dosage: 'D.S. 5-7 tabliet 3x denne nalačno (30 minút pred jedlom)',
    commercialName: 'Wobenzym',
    latinName: 'Enzymatica et rutosidum tbl ent',
    activeSubstance: 'Enzýmy + Rutozid',
    suklCode: '094247',
    category: 'edema',
    paymentType: 'Hradí pacient',
    notes: 'Systémová enzymoterapia urýchľujúca vstrebávanie edémov'
  },
  {
    id: 'med_dexamethasone_4',
    substance: 'dexametazón',
    formAndStrength: 'tbl 20x4 mg',
    packaging: 'Exp. orig. No I (unam)',
    dosage: 'D.S. 1. deň 16 mg, každý ďalší znižovať o 4 mg',
    commercialName: 'Dexamethason 4 mg',
    latinName: 'Dexamethasonum tbl 4 mg',
    activeSubstance: 'Dexametazón',
    suklCode: '014022',
    category: 'edema',
    paymentType: 'Hradí pacient',
    notes: 'Kortikosteroid na pooperačný edém. Zostupná schéma: 1. deň 16 mg (4 tbl), 2. deň 12 mg (3 tbl), 3. deň 8 mg (2 tbl), 4. deň 4 mg (1 tbl), potom ukončiť.'
  },

  // 5. LOKÁLNE PRÍPRAVKY & DERMATOLOGIKÁ
  {
    id: 'med_bacitracin_neomycin',
    substance: 'bacitracín, zinočnatý komplex / neomycín, sulfát',
    formAndStrength: 'ung der 1x10 g',
    packaging: 'Exp. orig. No I (unam)',
    dosage: 'D.S. 2x denne tenká vrstva na okolie stehov / rany',
    commercialName: 'Framykoin dermálna masť 10 g',
    latinName: 'Bacitracinum zincicum et neomycini sulfas ung 10 g',
    activeSubstance: 'Bacitracín + Neomycín',
    suklCode: '001066',
    category: 'local',
    paymentType: 'Hradí pacient',
    notes: 'Lokálne antibiotikum na pooperačné ranky'
  },
  {
    id: 'med_mupirocinum',
    substance: 'mupirocín',
    formAndStrength: 'ung der 1x15 g (20 mg/g)',
    packaging: 'Exp. orig. No I (unam)',
    dosage: 'D.S. 2-3x denne nanášať na postihnuté miesta',
    commercialName: 'Bactroban dermálna masť 15 g',
    latinName: 'Mupirocinum ung 20 mg/g 15 g',
    activeSubstance: 'Mupirocín',
    suklCode: '085816',
    category: 'local',
    paymentType: 'Hradí pacient',
    notes: 'Vysoko účinné lokálne antibiotikum'
  },
  {
    id: 'med_acidum_fusidicum',
    substance: 'kyselina fusidová',
    formAndStrength: 'crm der 1x15 g (20 mg/g)',
    packaging: 'Exp. orig. No I (unam)',
    dosage: 'D.S. 2-3x denne jemná vrstva na ranu',
    commercialName: 'Fucidin krém 15 g',
    latinName: 'Acidum fusidicum crm 20 mg/g 15 g',
    activeSubstance: 'Kyselina fusidová',
    suklCode: '024846',
    category: 'local',
    paymentType: 'Hradí pacient',
    notes: 'Vhodné aj na tvárovú oblasť'
  },
  {
    id: 'med_polysiloxanes',
    substance: 'polysiloxány / siloxány',
    formAndStrength: 'gel der 1x20 g',
    packaging: 'Exp. orig. No I (unam)',
    dosage: 'D.S. 2x denne naniesť tenký film na zhojenú jazvu',
    commercialName: 'Strataderm silikónový gél 20 g',
    latinName: 'Polysiloxanes et siloxanes gel 20 g',
    activeSubstance: 'Silikónové polyméry',
    suklCode: '099012',
    category: 'local',
    paymentType: 'Hradí pacient',
    notes: 'Aplikovať len na suchú kožu po vybratí stehov'
  },

  // 6. PREMEDIKÁCIA & SEDATÍVA
  {
    id: 'med_midazolamum_75',
    substance: 'midazolam',
    formAndStrength: 'tbl flm 10x7,5 mg',
    packaging: 'Exp. orig. No I (unam)',
    dosage: 'D.S. 1 tableta večer pred plánovanou operáciou / na noc',
    commercialName: 'Dormicum 7,5 mg',
    latinName: 'Midazolamum tbl flm 7,5 mg',
    activeSubstance: 'Midazolam',
    suklCode: '011003',
    category: 'sedative',
    paymentType: 'Hradí pacient',
    notes: 'Krátkodobo pôsobiace hypnotikum'
  },
  {
    id: 'med_bisulepini_2',
    substance: 'bisulepín, hydrochlorid',
    formAndStrength: 'tbl 20x2 mg',
    packaging: 'Exp. orig. No I (unam)',
    dosage: 'D.S. 1 tableta večer pri svrbení kože či alergickom prejave',
    commercialName: 'Dithiaden 2 mg',
    latinName: 'Bisulepini hydrochloridum tbl 2 mg',
    activeSubstance: 'Bisulepín',
    suklCode: '002479',
    category: 'sedative',
    paymentType: 'Hradí pacient',
    notes: 'Antihistaminikum so sedatívnym účinkom'
  },
  {
    id: 'med_desloratadinum_5',
    substance: 'desloratadín',
    formAndStrength: 'tbl flm 30x5 mg',
    packaging: 'Exp. orig. No I (unam)',
    dosage: 'D.S. 1 tableta 1x denne ráno nalačno',
    commercialName: 'Aerius 5 mg',
    latinName: 'Desloratadinum tbl flm 5 mg',
    activeSubstance: 'Desloratadín',
    suklCode: '028161',
    category: 'sedative',
    paymentType: 'Hradí pacient',
    notes: 'Nesedatívne antihistaminikum'
  },

  // 7. DERMATOLOGIKÁ & RETINOIDY (AKNÉ)
  {
    id: 'med_isotretinoin_10',
    substance: 'izotretinoín',
    formAndStrength: 'cps mol 30x10 mg',
    packaging: 'Exp. orig. No I (unam)',
    dosage: 'D.S. 1-0-0',
    commercialName: 'Isotretinoin 10 mg (Roaccutane)',
    latinName: 'Isotretinoinum cps mol 10 mg',
    activeSubstance: 'Izotretinoín',
    suklCode: '049195',
    category: 'dermatology',
    paymentType: 'Hradí pacient',
    notes: 'Systémový retinoid (1-0-0 ráno po jedle). Prísne teratogénne, nutná antikoncepcia a kontrola pečeňových testov a lipidov.'
  },
  {
    id: 'med_isotretinoin_20',
    substance: 'izotretinoín',
    formAndStrength: 'cps mol 30x20 mg',
    packaging: 'Exp. orig. No I (unam)',
    dosage: 'D.S. 1-0-0',
    commercialName: 'Isotretinoin 20 mg (Roaccutane)',
    latinName: 'Isotretinoinum cps mol 20 mg',
    activeSubstance: 'Izotretinoín',
    suklCode: '049196',
    category: 'dermatology',
    paymentType: 'Hradí pacient',
    notes: 'Systémový retinoid (1-0-0 ráno po jedle). Prísne teratogénne, nutná antikoncepcia a kontrola pečeňových testov a lipidov.'
  }
];

export const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  analgetik: { label: 'Analgetiká & Bolesť', icon: '💊' },
  atb: { label: 'Antibiotiká (ATB)', icon: '🛡️' },
  lmwh: { label: 'Tromboprofylaxia (LMWH)', icon: '💉' },
  edema: { label: 'Protiopuchové & Kortikoidy', icon: '🌸' },
  local: { label: 'Lokálne maste & Hojenie', icon: '🧴' },
  sedative: { label: 'Sedatíva & Alergie', icon: '🌙' },
  dermatology: { label: 'Dermatologiká & Retinoidy', icon: '✨' },
  other: { label: 'Vlastné / Ostatné liečivá', icon: '📋' }
};

export const CLINIC_PRESCRIPTION_DEFAULTS = {
  clinicName: 'SAY CLINIC s.r.o. - Plastická chirurgia',
  clinicAddress: 'Lazovná 43, 974 01 Banská Bystrica',
  clinicPzsCode: 'P70234011201',
  departmentCode: '063',
  doctorName: 'MUDr. Ján Mráz',
  doctorCode: 'A57687038',
  doctor2Name: 'MUDr. Zuzana Sroková, MPH',
  doctor2Code: 'A94238120'
};

export const STORAGE_KEY_CUSTOM_MEDS = 'say_clinic_custom_medications_v2';
export const STORAGE_KEY_MODIFIED_MEDS = 'say_clinic_modified_medications_v2';

export function getFullMedicationCatalog(): PrescribedMedication[] {
  if (typeof window === 'undefined') return [...MEDICATION_CATALOG];
  try {
    const customStr = localStorage.getItem(STORAGE_KEY_CUSTOM_MEDS);
    const modifiedStr = localStorage.getItem(STORAGE_KEY_MODIFIED_MEDS);
    const customList: PrescribedMedication[] = customStr ? JSON.parse(customStr) : [];
    const modifiedMap: Record<string, Partial<PrescribedMedication>> = modifiedStr ? JSON.parse(modifiedStr) : {};

    // Apply modifications to default catalog
    const baseList = MEDICATION_CATALOG.map(med => {
      if (modifiedMap[med.id]) {
        return {
          ...med,
          ...modifiedMap[med.id],
          isModified: true
        };
      }
      return med;
    });

    // Custom medications are prepended or combined
    const markedCustom = customList.map(item => ({ ...item, isCustom: true }));
    return [...markedCustom, ...baseList];
  } catch (e) {
    console.error('Chyba pri načítaní katalógu šablón liekov:', e);
    return [...MEDICATION_CATALOG];
  }
}

export function saveMedicationTemplate(med: PrescribedMedication): PrescribedMedication[] {
  if (typeof window === 'undefined') return [];
  try {
    const isExistingDefault = MEDICATION_CATALOG.some(d => d.id === med.id);
    if (isExistingDefault) {
      // It's a modified default template
      const modifiedStr = localStorage.getItem(STORAGE_KEY_MODIFIED_MEDS);
      const modifiedMap: Record<string, Partial<PrescribedMedication>> = modifiedStr ? JSON.parse(modifiedStr) : {};
      modifiedMap[med.id] = { ...med, isModified: true };
      localStorage.setItem(STORAGE_KEY_MODIFIED_MEDS, JSON.stringify(modifiedMap));
    } else {
      // It's a custom template
      const customStr = localStorage.getItem(STORAGE_KEY_CUSTOM_MEDS);
      const customList: PrescribedMedication[] = customStr ? JSON.parse(customStr) : [];
      const existingIdx = customList.findIndex(c => c.id === med.id);
      if (existingIdx >= 0) {
        customList[existingIdx] = { ...med, isCustom: true };
      } else {
        customList.unshift({ ...med, isCustom: true });
      }
      localStorage.setItem(STORAGE_KEY_CUSTOM_MEDS, JSON.stringify(customList));
    }
    return getFullMedicationCatalog();
  } catch (e) {
    console.error('Chyba pri ukladaní šablóny lieku:', e);
    return getFullMedicationCatalog();
  }
}

export function deleteMedicationTemplate(id: string): PrescribedMedication[] {
  if (typeof window === 'undefined') return [];
  try {
    const isExistingDefault = MEDICATION_CATALOG.some(d => d.id === id);
    if (isExistingDefault) {
      // Revert modification to default
      const modifiedStr = localStorage.getItem(STORAGE_KEY_MODIFIED_MEDS);
      if (modifiedStr) {
        const modifiedMap: Record<string, Partial<PrescribedMedication>> = JSON.parse(modifiedStr);
        delete modifiedMap[id];
        localStorage.setItem(STORAGE_KEY_MODIFIED_MEDS, JSON.stringify(modifiedMap));
      }
    } else {
      // Remove from custom list
      const customStr = localStorage.getItem(STORAGE_KEY_CUSTOM_MEDS);
      if (customStr) {
        let customList: PrescribedMedication[] = JSON.parse(customStr);
        customList = customList.filter(c => c.id !== id);
        localStorage.setItem(STORAGE_KEY_CUSTOM_MEDS, JSON.stringify(customList));
      }
    }
    return getFullMedicationCatalog();
  } catch (e) {
    console.error('Chyba pri mazaní šablóny lieku:', e);
    return getFullMedicationCatalog();
  }
}

export function resetAllMedicationTemplates(): PrescribedMedication[] {
  if (typeof window === 'undefined') return [...MEDICATION_CATALOG];
  try {
    localStorage.removeItem(STORAGE_KEY_CUSTOM_MEDS);
    localStorage.removeItem(STORAGE_KEY_MODIFIED_MEDS);
    return [...MEDICATION_CATALOG];
  } catch (e) {
    console.error('Chyba pri resete šablón liekov:', e);
    return [...MEDICATION_CATALOG];
  }
}

