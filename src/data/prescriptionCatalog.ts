export interface PrescribedMedication {
  id: string;
  name: string; // napr. Augmentin 1 g tbl flm
  activeSubstance?: string; // amoxicilín / kyselina klavulánová
  packaging: string; // Exp. orig. No. I (unam)
  dosage: string; // D.S. 1 tableta každých 12 hodín s jedlom počas 7 dní
  category: 'atb' | 'analgetik' | 'lmwh' | 'edema' | 'local' | 'sedative' | 'other';
  paymentType?: 'Hradí pacient' | 'Hradí ZP' | 'Čiastočne ZP';
  notes?: string;
}

export interface PrescriptionData {
  doctorName: string;
  doctorCode: string; // ÚDZS kód lekára (napr. A86342871)
  pzsCode: string; // Kód poskytovateľa PZS (napr. P70234011201)
  departmentCode: string; // Odbornosť (napr. 063 - Plastická chirurgia)
  patientName: string;
  birthNumber: string;
  address: string;
  insuranceCode: string; // napr. 24 (Dôvera), 25 (VšZP), 27 (Union), Samoplatca
  diagnosis: string; // MKCH-10 kód (napr. Z41.1, T81.4)
  prescriptionDate: string; // Dátum vystavenia
  validityDays: number; // Platnosť receptu v dňoch (štandard 7 dní, ATB 3 dni, atď.)
  paymentCategory: 'Hradí pacient (Samoplatca)' | 'Hradí zdravotná poisťovňa' | 'Čiastočná úhrada ZP';
  isRepeatable: 'Ne repetatur' | 'Repetatur 1x' | 'Repetatur 2x' | 'Repetatur 3x';
  barcode: string; // E-recept identifikátor
  items: PrescribedMedication[];
}

export const MEDICATION_CATALOG: PrescribedMedication[] = [
  // 1. ANTIBIOTIKÁ (ATB)
  {
    id: 'med_augmentin_1g',
    name: 'Augmentin 1 g tbl flm 14x1g',
    activeSubstance: 'Amoxicillinum / Acidum clavulanicum',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 1 tableta každých 12 hodín po jedle (7 dní)',
    category: 'atb',
    paymentType: 'Hradí pacient',
    notes: 'Užívať s jedlom, pri alergii na penicilín nekontaktovať'
  },
  {
    id: 'med_dalacin_300',
    name: 'Dalacin C 300 mg cps dur 16x300mg',
    activeSubstance: 'Clindamycinum',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 1 kapsula každých 8 hodín (pri alergii na PNC)',
    category: 'atb',
    paymentType: 'Hradí pacient',
    notes: 'Zapíjať plným pohárom vody v stoji'
  },
  {
    id: 'med_ciprinol_500',
    name: 'Ciprinol 500 mg tbl flm 10x500mg',
    activeSubstance: 'Ciprofloxacinum',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 1 tableta každých 12 hodín (5-7 dní)',
    category: 'atb',
    paymentType: 'Hradí pacient',
    notes: 'Neužívať s mliečnymi výrobkami a minerálmi'
  },
  {
    id: 'med_klacid_500',
    name: 'Klacid 500 mg tbl flm 14x500mg',
    activeSubstance: 'Clarithromycinum',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 1 tableta každých 12 hodín po jedle (7 dní)',
    category: 'atb',
    paymentType: 'Hradí pacient',
    notes: 'Makrolidové antibiotikum'
  },
  {
    id: 'med_cefzil_500',
    name: 'Cefzil 500 mg tbl flm 10x500mg',
    activeSubstance: 'Cefprozilum monohydricum',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 1 tableta každých 12 hodín (5 dní)',
    category: 'atb',
    paymentType: 'Hradí pacient',
    notes: 'Cefalosporínové ATB 2. generácie'
  },

  // 2. ANALGETIKÁ & ANTIFLOGISTIKÁ
  {
    id: 'med_aulin_100',
    name: 'Aulin 100 mg por gra sus 30 vreciek',
    activeSubstance: 'Nimesulidum',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 1 vrecko rozpustiť vo vode 2x denne po jedle pri bolesti',
    category: 'analgetik',
    paymentType: 'Hradí pacient',
    notes: 'Maximálne 15 dní nepretržite'
  },
  {
    id: 'med_flector_50',
    name: 'Flector EP Rapid 50 mg por gra sol 20 vreciek',
    activeSubstance: 'Diclofenacum epolaminum',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 1 vrecko 2-3x denne po jedle pri bolesti',
    category: 'analgetik',
    paymentType: 'Hradí pacient',
    notes: 'Rýchly nástup analgetického účinku'
  },
  {
    id: 'med_novalgin_500',
    name: 'Novalgin 500 mg tbl flm 20x500mg',
    activeSubstance: 'Metamizolum natricum monohydricum',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 1-2 tablety pri silnejšej bolesti (max. 4x denne)',
    category: 'analgetik',
    paymentType: 'Hradí pacient',
    notes: 'Nenávykové silné analgetikum'
  },
  {
    id: 'med_doreta_375',
    name: 'Doreta 37,5 mg/325 mg tbl flm 30 tbl',
    activeSubstance: 'Tramadoli hydrochloridum / Paracetamolum',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 1-2 tablety pri intenzívnej pooperačnej bolesti (max 4x denne)',
    category: 'analgetik',
    paymentType: 'Hradí pacient',
    notes: 'Neriadiť motorové vozidlá'
  },
  {
    id: 'med_nalgesin_s',
    name: 'Nalgesin S 275 mg tbl flm 20x275mg',
    activeSubstance: 'Naproxenum natricum',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 1 tableta každých 8-12 hodín po jedle',
    category: 'analgetik',
    paymentType: 'Hradí pacient',
    notes: 'Protizápalový a analgetický účinok'
  },

  // 3. TROMBOPROFYLAXIA (LMWH)
  {
    id: 'med_clexane_40',
    name: 'Clexane 4000 IU (40 mg) / 0,4 ml inj sol 10x0,4ml',
    activeSubstance: 'Enoxaparinum natricum',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 1 injekcia s.c. 1x denne večer do podkožia brucha (10 dní)',
    category: 'lmwh',
    paymentType: 'Hradí pacient',
    notes: 'Aplikovať striedavo vpravo a vľavo od pupka'
  },
  {
    id: 'med_clexane_20',
    name: 'Clexane 2000 IU (20 mg) / 0,2 ml inj sol 10x0,2ml',
    activeSubstance: 'Enoxaparinum natricum',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 1 injekcia s.c. 1x denne večer do podkožia',
    category: 'lmwh',
    paymentType: 'Hradí pacient',
    notes: 'Znížená profylaktická dávka'
  },
  {
    id: 'med_fraxiparine_04',
    name: 'Fraxiparine 0,4 ml (3 800 IU anti-Xa) inj sol 10x0,4ml',
    activeSubstance: 'Nadroparinum calcicum',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 1 injekcia s.c. 1x denne večer',
    category: 'lmwh',
    paymentType: 'Hradí pacient',
    notes: 'Profylaxia tromboembolickej choroby'
  },

  // 4. PROTIOPUCHOVÁ & REGENERAČNÁ LIEČBA
  {
    id: 'med_aescin_teva',
    name: 'Aescin-Teva 30 mg tbl obd 90x30mg',
    activeSubstance: 'Aescinum',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 2 tablety 3x denne po jedle, po 14 dňoch 1 tbl 3x denne',
    category: 'edema',
    paymentType: 'Hradí pacient',
    notes: 'Redukcia pooperačného opuchu a hematómov'
  },
  {
    id: 'med_wobenzym',
    name: 'Wobenzym gastrorezistentné tablety 200 tbl',
    activeSubstance: 'Enzymatica / Rutosidum',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 5-7 tabliet 3x denne nalačno (30 minút pred jedlom)',
    category: 'edema',
    paymentType: 'Hradí pacient',
    notes: 'Systémová enzymoterapia urýchľujúca vstrebávanie edémov'
  },

  // 5. LOKÁLNE PRÍPRAVKY & DERMATOLOGIKÁ
  {
    id: 'med_framykoin_ung',
    name: 'Framykoin dermálna masť 10 g',
    activeSubstance: 'Bacitracinum zincicum / Neomycini sulfas',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 2x denne tenká vrstva na okolie stehov / rany',
    category: 'local',
    paymentType: 'Hradí pacient',
    notes: 'Lokálne antibiotikum na pooperačné ranky'
  },
  {
    id: 'med_bactroban_ung',
    name: 'Bactroban 20 mg/g dermálna masť 15 g',
    activeSubstance: 'Mupirocinum',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 2-3x denne nanášať na postihnuté miesta',
    category: 'local',
    paymentType: 'Hradí pacient',
    notes: 'Vysoko účinné lokálne antibiotikum'
  },
  {
    id: 'med_fucidin_crm',
    name: 'Fucidin 20 mg/g dermálny krém 15 g',
    activeSubstance: 'Acidum fusidicum',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 2-3x denne jemná vrstva na ranu',
    category: 'local',
    paymentType: 'Hradí pacient',
    notes: 'Vhodné aj na tvárovú oblasť'
  },
  {
    id: 'med_strataderm_gel',
    name: 'Strataderm silikónový gél na jazvy 20 g',
    activeSubstance: 'Polysiloxanes / Siloxanes',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 2x denne naniesť tenký film na zhojenú jazvu bez chrást',
    category: 'local',
    paymentType: 'Hradí pacient',
    notes: 'Aplikovať len na suchú kožu po vybratí stehov'
  },

  // 6. PREMEDIKÁCIA & SEDATÍVA
  {
    id: 'med_dormicum_75',
    name: 'Dormicum 7,5 mg tbl flm 10x7,5mg',
    activeSubstance: 'Midazolamum',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 1 tableta večer pred plánovanou operáciou / na noc',
    category: 'sedative',
    paymentType: 'Hradí pacient',
    notes: 'Krátkodobo pôsobiace hypnotikum'
  },
  {
    id: 'med_dithiaden_2mg',
    name: 'Dithiaden 2 mg tbl 20x2mg',
    activeSubstance: 'Bisulepini hydrochloridum',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 1 tableta večer pri svrbení kože či alergickom prejave',
    category: 'sedative',
    paymentType: 'Hradí pacient',
    notes: 'Antihistaminikum so sedatívnym účinkom'
  },
  {
    id: 'med_aerius_5mg',
    name: 'Aerius 5 mg tbl flm 30x5mg',
    activeSubstance: 'Desloratadinum',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 1 tableta 1x denne ráno nalačno',
    category: 'sedative',
    paymentType: 'Hradí pacient',
    notes: 'Nesedatívne antihistaminikum'
  }
];

export const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  atb: { label: 'Antibiotiká', icon: '🛡️' },
  analgetik: { label: 'Analgetiká & Bolesť', icon: '💊' },
  lmwh: { label: 'Tromboprofylaxia (LMWH)', icon: '💉' },
  edema: { label: 'Protiopuchové & Enzýmy', icon: '🌸' },
  local: { label: 'Lokálne maste & Hojenie', icon: '🧴' },
  sedative: { label: 'Sedatíva & Alergie', icon: '🌙' },
  other: { label: 'Ostatné lieky', icon: '📋' }
};

export const CLINIC_PRESCRIPTION_DEFAULTS = {
  clinicName: 'SAY CLINIC s.r.o. - Plastická chirurgia',
  clinicAddress: 'Lazovná 43, 974 01 Banská Bystrica',
  clinicPzsCode: 'P70234011201',
  departmentCode: '063 - Plastická chirurgia',
  doctorName: 'MUDr. Ján Mráz',
  doctorCode: 'A86342871',
  doctor2Name: 'MUDr. Zuzana Sroková, MPH',
  doctor2Code: 'A94238120'
};
