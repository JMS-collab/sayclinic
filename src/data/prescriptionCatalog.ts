export interface PrescribedMedication {
  id: string;
  latinName: string; // Názov účinnej látky v latinčine (INN) + lieková forma + sila podľa legislatívy SR, napr. "Amoxicillinum et acidum clavulanicum tbl flm 1 g"
  commercialName: string; // Obchodný názov pre orientáciu lekára, napr. "Augmentin 1 g"
  activeSubstance?: string; // Popis liečiva
  suklCode?: string; // ŠÚKL kód lieku (napr. 096431)
  packaging: string; // Exp. orig. No. I (unam)
  dosage: string; // D.S. 1 tableta každých 12 hodín po jedle (7 dní)
  category: 'atb' | 'analgetik' | 'lmwh' | 'edema' | 'local' | 'sedative' | 'other';
  paymentType?: 'Hradí pacient' | 'Hradí ZP' | 'Čiastočne ZP';
  notes?: string;
}

export interface PrescriptionData {
  doctorName: string;
  doctorCode: string; // Úradný kód lekára (napr. A86342871)
  pzsCode: string; // Kód PZS (napr. P70234011201)
  departmentCode: string; // Odbornosť (napr. 063)
  patientName: string;
  birthNumber: string;
  address: string;
  insuranceCode: string; // Kód ZP (24, 25, 27)
  diagnosis: string; // MKCH-10 kód (napr. Z41.1, T81.4)
  prescriptionDate: string;
  items: PrescribedMedication[];
}

export const MEDICATION_CATALOG: PrescribedMedication[] = [
  // 1. ANTIBIOTIKÁ (ATB) - Generická preskripcia v latinčine
  {
    id: 'med_augmentin_1g',
    latinName: 'Amoxicillinum et acidum clavulanicum tbl flm 1 g',
    commercialName: 'Augmentin 1 g (14 tbl)',
    activeSubstance: 'Amoxicilín + Kyselina klavulánová',
    suklCode: '096431',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 1 tableta každých 12 hodín po jedle (7 dní)',
    category: 'atb',
    paymentType: 'Hradí pacient',
    notes: 'Užívať s jedlom, zapiť vodou'
  },
  {
    id: 'med_dalacin_300',
    latinName: 'Clindamycinum cps dur 300 mg',
    commercialName: 'Dalacin C 300 mg (16 cps)',
    activeSubstance: 'Klindamycín',
    suklCode: '010188',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 1 kapsula každých 8 hodín (pri alergii na PNC)',
    category: 'atb',
    paymentType: 'Hradí pacient',
    notes: 'Zapíjať plným pohárom vody v stoji'
  },
  {
    id: 'med_ciprinol_500',
    latinName: 'Ciprofloxacinum tbl flm 500 mg',
    commercialName: 'Ciprinol 500 mg / Ciphin 500 (10 tbl)',
    activeSubstance: 'Ciprofloxacín',
    suklCode: '091587',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 1 tableta každých 12 hodín (5-7 dní)',
    category: 'atb',
    paymentType: 'Hradí pacient',
    notes: 'Neužívať súčasne s mliečnymi výrobkami a minerálmi'
  },
  {
    id: 'med_klacid_500',
    latinName: 'Clarithromycinum tbl flm 500 mg',
    commercialName: 'Klacid 500 mg / Fromilid 500 (14 tbl)',
    activeSubstance: 'Klaritromycín',
    suklCode: '002133',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 1 tableta každých 12 hodín po jedle (7 dní)',
    category: 'atb',
    paymentType: 'Hradí pacient',
    notes: 'Makrolidové antibiotikum'
  },
  {
    id: 'med_cefzil_500',
    latinName: 'Cefprozilum monohydricum tbl flm 500 mg',
    commercialName: 'Cefzil 500 mg (10 tbl)',
    activeSubstance: 'Cefprozil',
    suklCode: '020295',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 1 tableta každých 12 hodín (5 dní)',
    category: 'atb',
    paymentType: 'Hradí pacient',
    notes: 'Cefalosporínové ATB 2. generácie'
  },
  {
    id: 'med_doxyhexal_100',
    latinName: 'Doxycyclinum monohydricum tbl 100 mg',
    commercialName: 'Doxyhexal 100 mg / Deoxymykoin (10 tbl)',
    activeSubstance: 'Doxycyklín',
    suklCode: '004013',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 1. deň 2x1 tbl, potom 1x1 tbl denne po jedle',
    category: 'atb',
    paymentType: 'Hradí pacient',
    notes: 'Fotosenzitivita - vyhýbať sa priamemu slnku'
  },

  // 2. ANALGETIKÁ & ANTIFLOGISTIKÁ
  {
    id: 'med_nimesulidum_100',
    latinName: 'Nimesulidum por gra sus 100 mg',
    commercialName: 'Aulin 100 mg / Coxtral (30 vreciek)',
    activeSubstance: 'Nimesulid',
    suklCode: '016947',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 1 vrecko rozpustiť vo vode 2x denne po jedle pri bolesti',
    category: 'analgetik',
    paymentType: 'Hradí pacient',
    notes: 'Maximálne 15 dní nepretržite, chrániť žalúdok'
  },
  {
    id: 'med_diclofenacum_50',
    latinName: 'Diclofenacum epolaminum por gra sol 50 mg',
    commercialName: 'Flector EP Rapid 50 mg (20 vreciek)',
    activeSubstance: 'Diklofenak epolamín',
    suklCode: '092414',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 1 vrecko 2-3x denne po jedle pri bolesti',
    category: 'analgetik',
    paymentType: 'Hradí pacient',
    notes: 'Rýchly nástup analgetického a protizápalového účinku'
  },
  {
    id: 'med_metamizolum_500',
    latinName: 'Metamizolum natricum monohydricum tbl flm 500 mg',
    commercialName: 'Novalgin 500 mg (20 tbl)',
    activeSubstance: 'Metamizol',
    suklCode: '007981',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 1-2 tablety pri silnejšej bolesti (max. 4x denne)',
    category: 'analgetik',
    paymentType: 'Hradí pacient',
    notes: 'Nesteroidné analgetikum a spazmolytikum'
  },
  {
    id: 'med_tramadol_paracetamol',
    latinName: 'Tramadoli hydrochloridum et paracetamolum tbl flm 37,5 mg/325 mg',
    commercialName: 'Doreta 37,5 mg/325 mg / Zaldiar (30 tbl)',
    activeSubstance: 'Tramadol + Paracetamol',
    suklCode: '028129',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 1-2 tablety pri intenzívnej pooperačnej bolesti (max 4x denne)',
    category: 'analgetik',
    paymentType: 'Hradí pacient',
    notes: 'Neriadiť motorové vozidlá'
  },
  {
    id: 'med_naproxenum_275',
    latinName: 'Naproxenum natricum tbl flm 275 mg',
    commercialName: 'Nalgesin S 275 mg (20 tbl)',
    activeSubstance: 'Naproxén sodný',
    suklCode: '001923',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 1 tableta každých 8-12 hodín po jedle',
    category: 'analgetik',
    paymentType: 'Hradí pacient',
    notes: 'Protizápalový a analgetický účinok'
  },

  // 3. TROMBOPROFYLAXIA (LMWH)
  {
    id: 'med_enoxaparinum_40',
    latinName: 'Enoxaparinum natricum inj sol 4000 IU (40 mg)/0,4 ml',
    commercialName: 'Clexane 4000 IU / 40 mg (10x0,4 ml)',
    activeSubstance: 'Enoxaparín sodný',
    suklCode: '002978',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 1 injekcia s.c. 1x denne večer do podkožia brucha (10 dní)',
    category: 'lmwh',
    paymentType: 'Hradí pacient',
    notes: 'Aplikovať striedavo vpravo a vľavo od pupka'
  },
  {
    id: 'med_enoxaparinum_20',
    latinName: 'Enoxaparinum natricum inj sol 2000 IU (20 mg)/0,2 ml',
    commercialName: 'Clexane 2000 IU / 20 mg (10x0,2 ml)',
    activeSubstance: 'Enoxaparín sodný',
    suklCode: '002977',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 1 injekcia s.c. 1x denne večer do podkožia',
    category: 'lmwh',
    paymentType: 'Hradí pacient',
    notes: 'Znížená profylaktická dávka'
  },
  {
    id: 'med_nadroparinum_04',
    latinName: 'Nadroparinum calcicum inj sol 3800 IU anti-Xa/0,4 ml',
    commercialName: 'Fraxiparine 0,4 ml (10x0,4 ml)',
    activeSubstance: 'Nadroparín vápenatý',
    suklCode: '002967',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 1 injekcia s.c. 1x denne večer',
    category: 'lmwh',
    paymentType: 'Hradí pacient',
    notes: 'Profylaxia tromboembolickej choroby'
  },

  // 4. PROTIOPUCHOVÁ & REGENERAČNÁ LIEČBA
  {
    id: 'med_aescinum_30',
    latinName: 'Aescinum tbl obd 30 mg',
    commercialName: 'Aescin-Teva / Aescin-Polfa (90 tbl)',
    activeSubstance: 'Aescín',
    suklCode: '048578',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 2 tablety 3x denne po jedle, po 14 dňoch 1 tbl 3x denne',
    category: 'edema',
    paymentType: 'Hradí pacient',
    notes: 'Redukcia pooperačného opuchu a hematómov'
  },
  {
    id: 'med_enzymatica',
    latinName: 'Enzymatica et rutosidum tbl ent',
    commercialName: 'Wobenzym (200 gastrorezistentných tbl)',
    activeSubstance: 'Enzýmy + Rutozid',
    suklCode: '094247',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 5-7 tabliet 3x denne nalačno (30 minút pred jedlom)',
    category: 'edema',
    paymentType: 'Hradí pacient',
    notes: 'Systémová enzymoterapia urýchľujúca vstrebávanie edémov'
  },

  // 5. LOKÁLNE PRÍPRAVKY & DERMATOLOGIKÁ
  {
    id: 'med_bacitracin_neomycin',
    latinName: 'Bacitracinum zincicum et neomycini sulfas ung 10 g',
    commercialName: 'Framykoin dermálna masť 10 g',
    activeSubstance: 'Bacitracín + Neomycín',
    suklCode: '001066',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 2x denne tenká vrstva na okolie stehov / rany',
    category: 'local',
    paymentType: 'Hradí pacient',
    notes: 'Lokálne antibiotikum na pooperačné ranky'
  },
  {
    id: 'med_mupirocinum',
    latinName: 'Mupirocinum ung 20 mg/g 15 g',
    commercialName: 'Bactroban dermálna masť 15 g',
    activeSubstance: 'Mupirocín',
    suklCode: '085816',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 2-3x denne nanášať na postihnuté miesta',
    category: 'local',
    paymentType: 'Hradí pacient',
    notes: 'Vysoko účinné lokálne antibiotikum'
  },
  {
    id: 'med_acidum_fusidicum',
    latinName: 'Acidum fusidicum crm 20 mg/g 15 g',
    commercialName: 'Fucidin krém 15 g',
    activeSubstance: 'Kyselina fusidová',
    suklCode: '024846',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 2-3x denne jemná vrstva na ranu',
    category: 'local',
    paymentType: 'Hradí pacient',
    notes: 'Vhodné aj na tvárovú oblasť'
  },
  {
    id: 'med_polysiloxanes',
    latinName: 'Polysiloxanes et siloxanes gel 20 g',
    commercialName: 'Strataderm silikónový gél na jazvy 20 g',
    activeSubstance: 'Silikónové polyméry',
    suklCode: '099012',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 2x denne naniesť tenký film na zhojenú jazvu bez chrást',
    category: 'local',
    paymentType: 'Hradí pacient',
    notes: 'Aplikovať len na suchú kožu po vybratí stehov'
  },

  // 6. PREMEDIKÁCIA & SEDATÍVA
  {
    id: 'med_midazolamum_75',
    latinName: 'Midazolamum tbl flm 7,5 mg',
    commercialName: 'Dormicum 7,5 mg (10 tbl)',
    activeSubstance: 'Midazolam',
    suklCode: '011003',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 1 tableta večer pred plánovanou operáciou / na noc',
    category: 'sedative',
    paymentType: 'Hradí pacient',
    notes: 'Krátkodobo pôsobiace hypnotikum'
  },
  {
    id: 'med_bisulepini_2',
    latinName: 'Bisulepini hydrochloridum tbl 2 mg',
    commercialName: 'Dithiaden 2 mg (20 tbl)',
    activeSubstance: 'Bisulepín',
    suklCode: '002479',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 1 tableta večer pri svrbení kože či alergickom prejave',
    category: 'sedative',
    paymentType: 'Hradí pacient',
    notes: 'Antihistaminikum so sedatívnym účinkom'
  },
  {
    id: 'med_desloratadinum_5',
    latinName: 'Desloratadinum tbl flm 5 mg',
    commercialName: 'Aerius 5 mg / Dasitva (30 tbl)',
    activeSubstance: 'Desloratadín',
    suklCode: '028161',
    packaging: 'Exp. orig. No. I (unam)',
    dosage: 'D.S. 1 tableta 1x denne ráno nalačno',
    category: 'sedative',
    paymentType: 'Hradí pacient',
    notes: 'Nesedatívne antihistaminikum'
  }
];

export const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  atb: { label: 'Antibiotiká (Latinské INN)', icon: '🛡️' },
  analgetik: { label: 'Analgetiká & Bolesť', icon: '💊' },
  lmwh: { label: 'Tromboprofylaxia (LMWH)', icon: '💉' },
  edema: { label: 'Protiopuchové & Enzýmy', icon: '🌸' },
  local: { label: 'Lokálne maste & Hojenie', icon: '🧴' },
  sedative: { label: 'Sedatíva & Alergie', icon: '🌙' },
  other: { label: 'Vlastné / Ostatné liečivá', icon: '📋' }
};

export const CLINIC_PRESCRIPTION_DEFAULTS = {
  clinicName: 'SAY CLINIC s.r.o. - Plastická chirurgia',
  clinicAddress: 'Lazovná 43, 974 01 Banská Bystrica',
  clinicPzsCode: 'P70234011201',
  departmentCode: '063',
  doctorName: 'MUDr. Ján Mráz',
  doctorCode: 'A86342871',
  doctor2Name: 'MUDr. Zuzana Sroková, MPH',
  doctor2Code: 'A94238120'
};

