'use client';

import React, { useState, useEffect, useRef } from 'react';
import { HealthProService, HealthProResponse } from '../services/healthpro';
import { MKCHItem } from '../data/mkch';

export interface ServiceCategory {
  id: string;
  name: string;
  price: number;
}

// KOMPLETNÝ CENNÍK SAY CLINIC (94 POLOŽIEK)
const SERVICES_DATABASE = {
  operations: [
    { id: 'op1', name: 'Zväčšenie prsníkov silikónovými implantátmi (augmentácia)', price: 4100 },
    { id: 'op2', name: 'Zväčšenie prsníkov tukom', price: 3100 },
    { id: 'op3', name: 'Zmenšenie prsníkov (redukcia)', price: 4100 },
    { id: 'op4', name: 'Lifting prsníkov (mastopexia)', price: 4100 },
    { id: 'op5', name: 'Lifting prsníkov s implantátmi (augmentačná mastopexia)', price: 5500 },
    { id: 'op6', name: 'Odstránenie implantátov', price: 1500 },
    { id: 'op7', name: 'Gynekomastia s liposukciou', price: 2000 },
    { id: 'op8', name: 'Miniabdominoplastika', price: 3000 },
    { id: 'op9', name: 'Abdominoplastika (redukcia kože brucha)', price: 4000 },
    { id: 'op10', name: 'Labioplastika (redukcia malých pyskov)', price: 1000 },
    { id: 'op11', name: 'Liposukcia brucha a bokov', price: 2500 },
    { id: 'op12', name: '360° Liposukcia', price: 3500 },
    { id: 'op13', name: 'Liposukcia paží', price: 1000 },
    { id: 'op14', name: 'Liposukcia krku', price: 1000 },
    { id: 'op15', name: 'Liposukcia bra lines', price: 1000 },
    { id: 'op16', name: 'Liposukcia love handles', price: 1000 },
    { id: 'op17', name: 'Liposukcia vnútorných stehien', price: 1000 },
    { id: 'op18', name: 'Liposukcia vonkajších stehien', price: 1000 },
    { id: 'op19', name: 'Liposukcia kolien', price: 1000 },
    { id: 'op20', name: 'Liposukcia chrbta', price: 1000 },
    { id: 'op21', name: 'Liposukcia - iné', price: 1000 },
    { id: 'op22', name: 'Lifting paží (arm lift)', price: 4500 },
    { id: 'op23', name: 'Lifting stehien (thigh lift)', price: 4500 },
    { id: 'op24', name: 'Lifting zadku (buttock lift)', price: 4500 },
    { id: 'op25', name: 'Blefaroplastika horných viečok', price: 1000 },
    { id: 'op26', name: 'Blefaroplastika dolných viečok', price: 1100 },
    { id: 'op27', name: 'Korekcia odstávajúcich ušníc', price: 1200 },
    { id: 'op28', name: 'Septoplastika s turbinoplastikou', price: 2500 },
    { id: 'op29', name: 'Úprava špičky nosa', price: 2500 },
    { id: 'op30', name: 'Kompletná rhinoplastika', price: 3800 },
    { id: 'op31', name: 'Deep plane facelift', price: 5500 },
    { id: 'op32', name: 'SMAS / MACS facelift', price: 3900 },
    { id: 'op33', name: 'Endoskopický lifting obočia a strednej časti tváre', price: 6000 },
    { id: 'op34', name: 'Endoskopický lifting obočia', price: 2500 },
    { id: 'op35', name: 'Lifting pier (lip lift)', price: 900 },
    { id: 'op36', name: 'Necklift - lifting krku', price: 2500 },
    { id: 'op37', name: 'Odstránenie tuku z líc (bukálna lipektómia)', price: 900 },
    { id: 'op38', name: 'Tvárové implantáty', price: 3700 },
    { id: 'op39', name: 'Lipofilling tváre', price: 1300 },
    { id: 'op40', name: 'Syndróm karpálneho tunela', price: 300 },
    { id: 'op41', name: 'Skákavý prst', price: 200 },
    { id: 'op42', name: 'Dupuytrenova kontraktúra', price: 700 },
  ],
  operationExtras: [
    { id: 'ex1', name: 'Implantáty B-lite', price: 1000 },
    { id: 'ex2', name: 'Implantáty Joy', price: 700 },
    { id: 'ex3', name: 'Implantáty Preserve', price: 1500 },
    { id: 'ex4', name: 'Korekcia bradaviek', price: 600 },
    { id: 'ex5', name: 'Abdominoplastika - liposukcia brucha a bokov', price: 600 },
    { id: 'ex6', name: 'Abdominoplastika - korekcia diastázy', price: 300 },
    { id: 'ex7', name: 'Prenos tuku - Lipotransfer do 200ml', price: 700 },
    { id: 'ex8', name: 'Prenos tuku - Lipotransfer nad 200ml', price: 1500 },
    { id: 'ex9', name: 'Blefaroplastika - záves obočia', price: 200 },
    { id: 'ex10', name: 'Blefaroplastika - korekcia ptózy viečka - jednostranne', price: 200 },
    { id: 'ex11', name: 'Blefaroplastika - záves viečka - kantopexia', price: 200 },
    { id: 'ex12', name: 'Korekcia ušného lalôčika', price: 300 },
    { id: 'ex13', name: 'Úprava špičky nosa - sekundárna operácia', price: 1300 },
    { id: 'ex14', name: 'Úprava špičky nosa - sekundárna s chrupavkou rebra', price: 2000 },
    { id: 'ex15', name: 'Kompletná rhinoplastika - sekundárna operácia', price: 1500 },
    { id: 'ex16', name: 'Kompletná rhinoplastika - rekonštrukcia z chrupavky rebra', price: 2500 },
    { id: 'ex17', name: 'Kompletná rhinoplastika - septoplastika/turbinoplastika', price: 500 },
    { id: 'ex18', name: 'Facelift - lifting krku', price: 1000 },
    { id: 'ex19', name: 'Facelift - transplantácia tuku', price: 800 },
    { id: 'ex20', name: 'Facelift - liplift', price: 600 },
    { id: 'ex21', name: 'Facelift - lifting obočia', price: 1000 },
    { id: 'ex22', name: 'Facelift - blefaroplastika', price: 600 },
  ],
  applications: [
    { id: 'app1', name: 'Aplikácia kyseliny hyalurónovej - 0,5ml', price: 180 },
    { id: 'app2', name: 'Aplikácia kyseliny hyalurónovej - 1ml', price: 290 },
    { id: 'app3', name: 'Doplnenie už zakúpeného materiálu', price: 50 },
    { id: 'app4', name: 'Botox - 1 oblasť', price: 120 },
    { id: 'app5', name: 'Botox - Odstránenie potenia v podpaží', price: 400 },
    { id: 'app6', name: 'Botox - Zúženie tváre (Masseter)', price: 300 },
    { id: 'app7', name: 'Aplikácia hyaluronidázy 150UI', price: 80 },
    { id: 'app8', name: 'Kortikosteroidy', price: 20 },
    { id: 'app9', name: 'Skinbooster 1ml', price: 300 },
    { id: 'app10', name: 'Sculptra', price: 450 },
  ],
  cosmetics: [
    { id: 'koz1', name: 'Chemický peeling', price: 50 },
    { id: 'koz2', name: 'Odstránenie znamienka', price: 90 },
    { id: 'koz3', name: 'Odstránenie podkožného útvaru (lipóm, ganglion)', price: 130 },
    { id: 'koz4', name: 'Odstránenie útvaru s lalokovou plastikou/transplantátom', price: 400 },
    { id: 'pr1', name: 'PI ideal', price: 60 },
    { id: 'pr2', name: 'PI relax', price: 75 },
    { id: 'pr3', name: 'PI filling', price: 70 },
    { id: 'pr4', name: 'PU 03', price: 30 },
    { id: 'pr5', name: 'VH special comfort', price: 75 },
    { id: 'pr6', name: 'VH body variant', price: 75 },
    { id: 'pr7', name: 'VD comfort', price: 115 },
    { id: 'pr8', name: 'VF body/body comfort', price: 90 },
    { id: 'pr9', name: 'MTmS comf', price: 80 },
    { id: 'pr10', name: 'KPlus', price: 50 },
    { id: 'pr11', name: 'FM', price: 50 },
    { id: 'pr12', name: 'PS ideal', price: 75 },
    { id: 'pr13', name: 'lipoelastic gel', price: 35 },
  ],
  services: [
    { id: 'sl1', name: 'Konzultácia / Vstupné vyšetrenie', price: 50 },
    { id: 'sl2', name: 'Predoperačné vyšetrenia', price: 150 },
    { id: 'sl3', name: 'Histologické vyšetrenie', price: 30 },
    { id: 'sl4', name: 'Nadštandardná samostatná lôžková izba', price: 30 },
  ],
};

const CLINIC_MACROS: Record<string, string> = {
  viecka: "VIEČKA:\n• Objem znížený, v neadekvátnej distribúcii\n• Koža v prebytku\n• Orbitálny tuk prolabuje na horných aj dolných mihalniciach\n• laterálny kantálny uhol v norme\n• Scleral show\n• Snap test a distorzný test adekvátny subadekvátny neadekvátny\n• Midface s deficitom v tukových kompartmentoch\n• Výška obočia cca. 5mm pod ideálnou pozíciou",
  nos: "NOS:\n• Dorsum - vyššej projekcie, primeranej šírky, dorzálne línie primeranej šírky nasion, rhinion, keystone, ASA\n• Špička - v hyperprojekcii, bulbózna, poklesnutá, kolumela, koža adekvátna\n• Krídla primeranej šírky a výšky\n• Septum - bez známok deviácie, endonazálne zväčšené conch, inf. bilat.\n• Inspiračný test - , Funkčné problémy -, Operácie nosa neguje",
  tvar: "TVÁR:\n• Objem znížený, v neadekvátnej distribúcii\n• koža jemná, papyrusová, výrazné mimické vrásky\n• Podkožné tkanivá laxné - gravitačné vrásky a previsy tkanív\n• Operácie tváre a korektívne zákroky",
  prsniky: "PRSNÍKY:\n• BW -\n• SNN -\n• CN -\n• NIMF - /SNIMF - /\n• PT -\n• Ptóza:\n• Koža:\n• Symetria:\n• Sizer: ",
  brucho: "BRUCHO:\n• koža - v prebytku, nízkej elasticity, strie\n• podkožie - PT brucho , boky\n• brušná stena - pevná, diastáza na cm v maxime okolí umbilika, voľne reponibilná umbilikálna hernia s bránkou cm\n• jazvy - ",
  lipo: "LIPO:\n• koža - v prebytku, nízkej elasticity, strie\n• podkožie - PT brucho , boky\n• jazvy - ",
  labio: "LABIO:\n• labia minora v excesii /cca. 3-4cm/",
  ruka: "RUKA:\nKarpálny tunel:\n• Tinel -, Phalen +\n• senzitívny deficit neprítomný, paroxyzmálne tŕpnutie, nočné bolesti\n• motorický deficit - slabosť, hypotrofia thenarových svalov\n\nDupuytrenova kontraktúra:\n• dlaňovo - prstová forma\n• DIP v norme, PIP flekč. kontr v 50°, CMP fix. v 20-30°\n• Tubiana II -III"
};

// FUNKCIA NA VÝPOČET VEKU Z RODNÉHO ČÍSLA
const calculateAgeFromRC = (rc: string) => {
  if (!rc || rc.length < 9) return '';
  const cleanRc = rc.replace(/\D/g, '');
  if (cleanRc.length < 9) return '';
  
  let year = parseInt(cleanRc.substring(0, 2), 10);
  let month = parseInt(cleanRc.substring(2, 4), 10);
  let day = parseInt(cleanRc.substring(4, 6), 10);
  
  if (isNaN(year) || isNaN(month) || isNaN(day)) return '';
  
  if (month > 50) month -= 50;
  if (month > 20) month -= 20; // Pre niektoré špecifické formáty
  
  year += (year > 26) ? 1900 : 2000;
  
  const today = new Date();
  let age = today.getFullYear() - year;
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) {
    age--;
  }
  return age.toString();
};

type DocumentType = 
  | 'vstupne_vysetrenie'
  | 'kontrolne_vysetrenie'
  | 'cenova_ponuka'
  | 'dohoda_o_cene'
  | 'operacny_protokol'
  | 'prepustacia_sprava'
  | 'anesteziologicky_dotaznik';

const DOC_TITLES: Record<DocumentType, string> = {
  vstupne_vysetrenie: 'Vstupné vyšetrenie',
  kontrolne_vysetrenie: 'Kontrolné vyšetrenie',
  cenova_ponuka: 'Cenová ponuka',
  dohoda_o_cene: 'Dohoda o cene a podmienkach',
  operacny_protokol: 'Operačný protokol',
  prepustacia_sprava: 'Prepúšťacia správa',
  anesteziologicky_dotaznik: 'Anesteziologický dotazník a súhlas'
};

interface FormProps {
  onRecordCreated?: (sale: { date: string; patientName: string; doctorName: string; serviceType: string; amount: number; }) => void;
  initialPatient?: { name: string; birthNumber: string } | null;
}

export default function MedicalRecordForm({ onRecordCreated, initialPatient }: FormProps) {
  const [docType, setDocType] = useState<DocumentType>('vstupne_vysetrenie');
  
  // ZÁKLADNÉ ÚDAJE
  const [patientName, setPatientName] = useState(initialPatient?.name || '');
  const [birthNumber, setBirthNumber] = useState(initialPatient?.birthNumber || '');
  const [doctor, setDoctor] = useState('MUDr. Ján Mráz');
  const [diagnosis, setDiagnosis] = useState('Z41.1 - Estetická chirurgická úprava');
  const [manualProcedure, setManualProcedure] = useState('');
  const [notes, setNotes] = useState('');

  // DATABÁZY & API
  const [mkchDatabase, setMkchDatabase] = useState<MKCHItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HealthProResponse | null>(null);

  // ZDIEĽANÝ STAV PRE ANESTÉZIU A HOSPITALIZÁCIU (Pre VV aj Cenník)
  const [hasOperation, setHasOperation] = useState(false);
  const [anesthesiaHours, setAnesthesiaHours] = useState(1);
  const [hospitalizationType, setHospitalizationType] = useState<'none' | 'half' | 'full' | 'full_2'>('none');
  const [vvAnesthesiaType, setVvAnesthesiaType] = useState('Lokálna');

  // OPERAČNÉ ÚDAJE
  const [surgeryDetails, setSurgeryDetails] = useState({
    opStart: '09:00', opEnd: '10:30',
    anesStart: '08:45', anesEnd: '10:45',
    assistant: '', anesthesiologist: '', nurse: '', checkup: '1 týždeň'
  });

  // ANESTEZIOLOGICKÝ DOTAZNÍK
  const [anesthesiaAnswers, setAnesthesiaAnswers] = useState({
    diseases: 'Nie', pregnant: 'Nie', medications: 'Nie', allergies: 'Nie', complications: 'Nie'
  });

  // VSTUPNÉ VYŠETRENIE
  const [vvPlan, setVvPlan] = useState('');
  const [vvDate, setVvDate] = useState('');
  
  // Anamnéza
  const [vvVek, setVvVek] = useState('');
  const [vvVyska, setVvVyska] = useState('');
  const [vvVaha, setVvVaha] = useState('');
  const [vvAA, setVvAA] = useState('');
  const [vvOA, setVvOA] = useState('');
  const [vvLA, setVvLA] = useState('');
  const [vvGA, setVvGA] = useState('');
  
  // Klinika (Status Localis / SPL)
  const [vvCave, setVvCave] = useState('');
  const [vvSPL, setVvSPL] = useState('');
  
  // Vyšetrenia
  const [vvExams, setVvExams] = useState<string[]>([]);
  const [vvExamsOther, setVvExamsOther] = useState('');
  
  // Implantáty (Dynamické pole) a Materiál
  const [vvImplants, setVvImplants] = useState([{ vyrobca: '', kat: '', objem: '' }]);
  const [vvMaterial, setVvMaterial] = useState('');

  // Súhlasy / Kontraindikácie
  const [vvNoContra, setVvNoContra] = useState(true);
  const [vvContraReason, setVvContraReason] = useState('');

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/mkch.json')
      .then((res) => res.json())
      .then((data: MKCHItem[]) => setMkchDatabase(data))
      .catch((err) => console.error('Chyba pri načítaní diagnóz:', err));
  }, []);

  useEffect(() => {
    if (initialPatient) {
      setPatientName(initialPatient.name);
      setBirthNumber(initialPatient.birthNumber);
    }
  }, [initialPatient]);

  // Automatický výpočet veku pri zmene Rodného čísla
  useEffect(() => {
    const computedAge = calculateAgeFromRC(birthNumber);
    if (computedAge) {
      setVvVek(computedAge);
    }
  }, [birthNumber]);

  // Automatické zapnutie Anestézie pre Cenovú ponuku
  useEffect(() => {
    if (vvAnesthesiaType === 'Celková' || vvAnesthesiaType === 'Analgosedácia') {
      setHasOperation(true);
    } else {
      setHasOperation(false);
    }
  }, [vvAnesthesiaType]);

  const calcBMI = () => {
    const w = parseFloat(vvVaha);
    const h = parseFloat(vvVyska);
    if (w > 0 && h > 0) {
      const hMeters = h / 100;
      return (w / (hMeters * hMeters)).toFixed(1);
    }
    return '';
  };

  const handleExamToggle = (exam: string) => {
    setVvExams(prev => prev.includes(exam) ? prev.filter(e => e !== exam) : [...prev, exam]);
  };

  // Správa Implantátov
  const addImplant = () => setVvImplants([...vvImplants, { vyrobca: '', kat: '', objem: '' }]);
  const removeImplant = (index: number) => setVvImplants(vvImplants.filter((_, i) => i !== index));
  const updateImplant = (index: number, field: 'vyrobca' | 'kat' | 'objem', value: string) => {
    const newImplants = [...vvImplants];
    newImplants[index][field] = value;
    setVvImplants(newImplants);
  };

  const handleAddItemFromDropdown = (itemId: string, isOperation = false) => {
    if (!itemId) return;
    const allServices = [...SERVICES_DATABASE.operations, ...SERVICES_DATABASE.operationExtras, ...SERVICES_DATABASE.applications, ...SERVICES_DATABASE.cosmetics, ...SERVICES_DATABASE.services];
    const found = allServices.find((s) => s.id === itemId);
    if (found && !selectedItems.some((i) => i.id === found.id)) {
      setSelectedItems([...selectedItems, found]);
      if (isOperation) setHasOperation(true);
    }
  };

  const handleRemoveItem = (id: string) => {
    setSelectedItems(selectedItems.filter((i) => i.id !== id));
  };

  const basePrice = selectedItems.reduce((acc, curr) => acc + curr.price, 0);
  const anesthesiaPrice = hasOperation ? anesthesiaHours * 130 : 0;
  const hospitalizationPrice = hasOperation 
    ? hospitalizationType === 'half' ? 100 
    : hospitalizationType === 'full' ? 200 
    : hospitalizationType === 'full_2' ? 400 
    : 0 : 0;
  const totalPrice = basePrice + anesthesiaPrice + hospitalizationPrice;

  const handlePrint = () => window.print();

  const handleMacroInsert = (val: string, target: 'vv' | 'notes') => {
    if (!val || !CLINIC_MACROS[val]) return;
    if (target === 'vv') {
      setVvSPL(prev => prev ? prev + "\n\n" + CLINIC_MACROS[val] : CLINIC_MACROS[val]);
    } else {
      setNotes(prev => prev ? prev + "\n\n" + CLINIC_MACROS[val] : CLINIC_MACROS[val]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const serviceTitle = (docType === 'cenova_ponuka' || docType === 'dohoda_o_cene')
      ? selectedItems.map((i) => i.name).join(', ') || DOC_TITLES[docType]
      : manualProcedure || DOC_TITLES[docType];

    const response = await HealthProService.sendMedicalRecord({
      patientBirthNumber: birthNumber,
      diagnosisCode: diagnosis,
      notes: docType === 'vstupne_vysetrenie' ? vvPlan : notes,
      doctorLicenseCode: 'LEK-123456',
    });

    setResult(response);
    setLoading(false);

    if (response.success && onRecordCreated) {
      onRecordCreated({
        date: new Date().toISOString().split('T')[0],
        patientName: patientName || 'Neznámy pacient',
        doctorName: doctor,
        serviceType: `${DOC_TITLES[docType]}: ${serviceTitle}`,
        amount: (docType === 'cenova_ponuka' || docType === 'dohoda_o_cene') ? totalPrice : 0,
      });
    }
  };

  // Zobrazovacie podmienky
  const showPricing = docType === 'cenova_ponuka' || docType === 'dohoda_o_cene';
  const showSurgeryDetails = docType === 'operacny_protokol' || docType === 'prepustacia_sprava';
  const showAnesthesiaQ = docType === 'anesteziologicky_dotaznik';
  const showVV = docType === 'vstupne_vysetrenie';
  const showNotes = docType === 'kontrolne_vysetrenie' || docType === 'operacny_protokol' || docType === 'prepustacia_sprava';

  return (
    <>
      <style type="text/css" media="print">
        {`
          body * { visibility: hidden; }
          #printable-a4, #printable-a4 * { visibility: visible; }
          #printable-a4 {
            position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; box-shadow: none; border: none;
          }
        `}
      </style>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:block print:gap-0">
        
        {/* ======================================================= */}
        {/* ĽAVÁ ČASŤ - FORMULÁR LEKÁRA                             */}
        {/* ======================================================= */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-5 print:hidden">
          
          <div className="border-b border-[#E8E2D9] pb-4">
            <h2 className="font-brand text-xl font-light text-[#2C2A29] uppercase font-bold mb-3">Generátor Dokumentov</h2>
            
            <select 
              value={docType} 
              onChange={(e) => setDocType(e.target.value as DocumentType)}
              className="w-full bg-[#2C2A29] hover:bg-black text-white p-3 rounded-xl text-xs uppercase font-bold tracking-wider outline-none shadow-md cursor-pointer transition-colors"
            >
              {Object.entries(DOC_TITLES).map(([key, title]) => (
                <option key={key} value={key}>{title}</option>
              ))}
            </select>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ZÁKLADNÉ ÚDAJE */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1">Ošetrujúci lekár</label>
                <select value={doctor} onChange={(e) => setDoctor(e.target.value)} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]">
                  <option value="MUDr. Ján Mráz">MUDr. Ján Mráz</option>
                  <option value="MUDr. Zuzana Sroková, MPH">MUDr. Zuzana Sroková, MPH</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1">Meno a priezvisko</label>
                <input type="text" required value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="Mária Kováčová" className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1">Rodné číslo</label>
                <input type="text" required value={birthNumber} onChange={(e) => setBirthNumber(e.target.value)} placeholder="885512/6789" className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]" />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1">Diagnóza (MKCH-10)</label>
                <input type="text" list="mkch-suggestions" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Z41.1..." className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]" />
                <datalist id="mkch-suggestions">
                  {mkchDatabase.map((item) => <option key={item.code} value={item.name.includes(item.code) ? item.name : `${item.code} - ${item.name}`} />)}
                </datalist>
              </div>
            </div>

            {/* SEKCIA: VSTUPNÉ VYŠETRENIE */}
            {showVV && (
              <div className="space-y-4">
                
                {/* 1. Plán a termín */}
                <div className="border border-[#E8E2D9] rounded-xl p-4 bg-[#FBF9F6] space-y-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#C5A059] mb-1">Podrobný popis plánovaného výkonu</label>
                    <textarea rows={3} value={vvPlan} onChange={(e) => setVvPlan(e.target.value)} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase text-[#8C857B] mb-1">Termín zákroku</label>
                      <input type="date" value={vvDate} onChange={(e) => setVvDate(e.target.value)} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase text-[#8C857B] mb-1">Typ Anestézie</label>
                      <select value={vvAnesthesiaType} onChange={e => setVvAnesthesiaType(e.target.value)} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white">
                        <option value="Lokálna">Lokálna</option><option value="Celková">Celková</option><option value="Analgosedácia">Analgosedácia</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-[#8C857B] mb-1">Dĺžka zákroku</label>
                      <select value={anesthesiaHours} onChange={e => setAnesthesiaHours(parseFloat(e.target.value))} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white">
                        {[1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8].map(h => <option key={h} value={h}>{h} hod</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-[#8C857B] mb-1">Hospitalizácia</label>
                      <select value={hospitalizationType} onChange={e => setHospitalizationType(e.target.value as any)} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white">
                        <option value="none">Ambulantne</option><option value="half">1/2 dňa</option><option value="full">1 deň</option><option value="full_2">2 dni</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. Anamnéza */}
                <div className="border border-[#E8E2D9] rounded-xl p-4 bg-[#FBF9F6] space-y-3">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-[#C5A059]">Anamnéza</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div><label className="block text-[10px] text-[#8C857B] mb-1">Vek</label><input type="text" value={vvVek} onChange={e => setVvVek(e.target.value)} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white" /></div>
                    <div><label className="block text-[10px] text-[#8C857B] mb-1">Výška (cm)</label><input type="number" value={vvVyska} onChange={e => setVvVyska(e.target.value)} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white" /></div>
                    <div><label className="block text-[10px] text-[#8C857B] mb-1">Váha (kg)</label><input type="number" value={vvVaha} onChange={e => setVvVaha(e.target.value)} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white" /></div>
                    <div><label className="block text-[10px] text-[#8C857B] mb-1">BMI</label><input type="text" disabled value={calcBMI()} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-gray-100 font-bold" /></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div><label className="block text-[10px] text-[#8C857B] mb-1">AA (Alergická)</label><input type="text" value={vvAA} onChange={e => setVvAA(e.target.value)} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white" /></div>
                    <div><label className="block text-[10px] text-[#8C857B] mb-1">OA (Osobná)</label><input type="text" value={vvOA} onChange={e => setVvOA(e.target.value)} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white" /></div>
                    <div><label className="block text-[10px] text-[#8C857B] mb-1">LA (Lieková)</label><input type="text" value={vvLA} onChange={e => setVvLA(e.target.value)} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white" /></div>
                    <div><label className="block text-[10px] text-[#8C857B] mb-1">GA (Gynekologická)</label><input type="text" value={vvGA} onChange={e => setVvGA(e.target.value)} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white" /></div>
                  </div>
                  <div><label className="block text-[10px] font-bold text-rose-600 mb-1">CAVE (Riziká / Upozornenia)</label><textarea rows={2} value={vvCave} onChange={e => setVvCave(e.target.value)} className="w-full border border-rose-200 p-2 rounded-lg text-xs bg-rose-50 text-rose-800" /></div>
                </div>

                {/* 3. Status Localis / SPL */}
                <div className="border border-[#E8E2D9] rounded-xl p-4 bg-[#FBF9F6] space-y-3">
                  <div className="flex justify-between items-end mb-1">
                    <label className="block text-[10px] uppercase font-bold text-[#C5A059]">Status Localis (SPL)</label>
                    <select 
                      value="" 
                      onChange={(e) => handleMacroInsert(e.target.value, 'vv')}
                      className="border border-[#E8E2D9] p-1.5 rounded-lg text-[10px] bg-white text-[#2C2A29] uppercase font-bold shadow-sm"
                    >
                      <option value="" disabled>+ Vložiť makro...</option>
                      <option value="viecka">Viečka</option>
                      <option value="nos">Nos</option>
                      <option value="tvar">Tvár</option>
                      <option value="prsniky">Prsníky</option>
                      <option value="brucho">Brucho</option>
                      <option value="lipo">Lipo</option>
                      <option value="labio">Labio</option>
                      <option value="ruka">Ruka (Karpál / Dupuytren)</option>
                    </select>
                  </div>
                  <textarea rows={6} value={vvSPL} onChange={e => setVvSPL(e.target.value)} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white" placeholder="Nález..." />
                </div>

                {/* 4. Vyšetrenia, Implantáty, Materiál */}
                <div className="border border-[#E8E2D9] rounded-xl p-4 bg-[#FBF9F6] space-y-4">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-[#C5A059] mb-2">Predoperačné vyšetrenia</p>
                    <div className="flex flex-wrap gap-3">
                      {['Štandardné (KO, Bio, OHV)', 'Ultrazvuk prsníkov', 'CT hlavy / CBCT nosa', 'Iné'].map(exam => (
                        <label key={exam} className="flex items-center space-x-2 text-xs">
                          <input type="checkbox" checked={vvExams.includes(exam)} onChange={() => handleExamToggle(exam)} className="accent-[#C5A059]" />
                          <span>{exam}</span>
                        </label>
                      ))}
                    </div>
                    {vvExams.includes('Iné') && (
                      <input 
                        type="text" 
                        placeholder="Zadajte aké iné vyšetrenie..." 
                        value={vvExamsOther} 
                        onChange={e => setVvExamsOther(e.target.value)} 
                        className="w-full mt-3 border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white" 
                      />
                    )}
                  </div>
                  
                  <div className="border-t border-[#E8E2D9] pt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[#C5A059] mb-2">Implantáty</p>
                      {vvImplants.map((impl, idx) => (
                        <div key={idx} className="space-y-2 bg-white p-2 rounded-lg border border-[#E8E2D9] mb-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-bold text-[#8C857B] uppercase">Implantát {idx + 1}</span>
                            {vvImplants.length > 1 && (
                              <button type="button" onClick={() => removeImplant(idx)} className="text-[9px] font-bold text-rose-500 uppercase">Odstrániť</button>
                            )}
                          </div>
                          <input type="text" placeholder="Výrobca..." value={impl.vyrobca} onChange={e => updateImplant(idx, 'vyrobca', e.target.value)} className="w-full border border-[#E8E2D9] p-1.5 rounded text-xs bg-[#FBF9F6]" />
                          <div className="flex gap-2">
                            <input type="text" placeholder="Kat. č." value={impl.kat} onChange={e => updateImplant(idx, 'kat', e.target.value)} className="w-full border border-[#E8E2D9] p-1.5 rounded text-xs bg-[#FBF9F6]" />
                            <input type="text" placeholder="Objem" value={impl.objem} onChange={e => updateImplant(idx, 'objem', e.target.value)} className="w-full border border-[#E8E2D9] p-1.5 rounded text-xs bg-[#FBF9F6]" />
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={addImplant} className="text-[10px] uppercase font-bold text-[#C5A059] hover:text-[#2C2A29]">+ Pridať ďalší implantát</button>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[#C5A059] mb-2">Materiál (poop. prádlo, BTX...)</p>
                      <textarea rows={4} value={vvMaterial} onChange={e => setVvMaterial(e.target.value)} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white" />
                    </div>
                  </div>
                </div>

                {/* 5. Kontraindikácie */}
                <div className="border border-[#E8E2D9] rounded-xl p-4 bg-[#FBF9F6]">
                  <label className="flex items-center space-x-2 text-xs font-bold text-[#2C2A29] mb-2">
                    <input type="checkbox" checked={vvNoContra} onChange={e => setVvNoContra(e.target.checked)} className="accent-[#C5A059]" />
                    <span>Bez zjavnej kontraindikácie k výkonu (t.č.)</span>
                  </label>
                  {!vvNoContra && (
                    <div>
                      <label className="block text-[10px] text-rose-600 font-bold mb-1">Dôvod kontraindikácie zákroku:</label>
                      <input type="text" value={vvContraReason} onChange={e => setVvContraReason(e.target.value)} className="w-full border border-rose-200 p-2 rounded-lg text-xs bg-white" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {!showPricing && !showAnesthesiaQ && !showVV && (
              <div className="border border-[#E8E2D9] rounded-xl p-3 bg-[#FBF9F6]">
                <label className="block text-[10px] uppercase font-bold text-[#2C2A29] mb-1">Vykonaný úkon / Zákrok</label>
                <input type="text" value={manualProcedure} onChange={(e) => setManualProcedure(e.target.value)} placeholder="napr. Blefaroplastika horných viečok..." className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]" />
              </div>
            )}

            {/* SEKCIA: CENOTVORBA (Pre Cenovú ponuku a Dohodu o cene) */}
            {showPricing && (
              <div className="border border-[#E8E2D9] rounded-xl p-4 bg-[#FBF9F6] space-y-3">
                <p className="text-[10px] uppercase tracking-wider font-bold text-[#2C2A29]">Výber výkonov ({selectedItems.length})</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select onChange={(e) => { handleAddItemFromDropdown(e.target.value, true); e.target.value = ''; }} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs text-[#2C2A29]">
                    <option value="">-- Pridať Operáciu --</option>
                    {SERVICES_DATABASE.operations.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                  <select onChange={(e) => { handleAddItemFromDropdown(e.target.value); e.target.value = ''; }} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs text-[#2C2A29]">
                    <option value="">-- Pridať Príplatok --</option>
                    {SERVICES_DATABASE.operationExtras.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                  <select onChange={(e) => { handleAddItemFromDropdown(e.target.value); e.target.value = ''; }} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs text-[#2C2A29]">
                    <option value="">-- Pridať Aplikáciu --</option>
                    {SERVICES_DATABASE.applications.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                  <select onChange={(e) => { handleAddItemFromDropdown(e.target.value); e.target.value = ''; }} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs text-[#2C2A29]">
                    <option value="">-- Pridať Kozmetiku / Službu --</option>
                    {[...SERVICES_DATABASE.cosmetics, ...SERVICES_DATABASE.services].map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </div>

                {selectedItems.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {selectedItems.map((item) => (
                      <span key={item.id} className="bg-[#2C2A29] text-white text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
                        <span>{item.name} ({item.price} €)</span>
                        <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-[#C5A059] font-bold text-xs hover:text-white">✕</button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="border-t border-[#E8E2D9] pt-2 mt-2 space-y-2">
                  <label className="flex items-center space-x-2 text-xs font-bold text-[#2C2A29] cursor-pointer">
                    <input type="checkbox" checked={hasOperation} onChange={(e) => setHasOperation(e.target.checked)} className="accent-[#C5A059]" />
                    <span>Započítať Celkovú Anestéziu a Pobyt</span>
                  </label>
                  {hasOperation && (
                    <div className="flex gap-2 text-xs">
                      <select value={anesthesiaHours} onChange={(e) => setAnesthesiaHours(parseFloat(e.target.value))} className="border border-[#E8E2D9] p-1.5 rounded flex-1">
                        {[1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8].map(h => <option key={h} value={h}>Anestézia {h} hod. ({h * 130} €)</option>)}
                      </select>
                      <select value={hospitalizationType} onChange={(e) => setHospitalizationType(e.target.value as any)} className="border border-[#E8E2D9] p-1.5 rounded flex-1">
                        <option value="none">Bez pobytu (0 €)</option>
                        <option value="half">Pobyt 1/2 dňa (100 €)</option>
                        <option value="full">Pobyt 1 deň (200 €)</option>
                        <option value="full_2">Pobyt 2 dni (400 €)</option>
                      </select>
                    </div>
                  )}
                </div>
                <div className="bg-[#2C2A29] text-white p-3 rounded-xl flex justify-between items-center text-xs shadow-md">
                  <span>Celková cena:</span><span className="text-base font-bold text-[#C5A059]">{totalPrice.toFixed(2)} €</span>
                </div>
              </div>
            )}

            {/* SEKCIA: OPERAČNÉ ÚDAJE (Pre Protokol a Prepúšťaciu správu) */}
            {showSurgeryDetails && (
              <div className="border border-[#E8E2D9] rounded-xl p-4 bg-[#FBF9F6] space-y-3">
                <p className="text-[10px] uppercase tracking-wider font-bold text-[#2C2A29]">Personál & Časy zákroku</p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><label className="block text-[9px] text-[#8C857B] mb-1">Čas operácie (Od - Do)</label><div className="flex gap-1"><input type="time" value={surgeryDetails.opStart} onChange={e => setSurgeryDetails({...surgeryDetails, opStart: e.target.value})} className="border border-[#E8E2D9] p-1.5 rounded w-full" /><input type="time" value={surgeryDetails.opEnd} onChange={e => setSurgeryDetails({...surgeryDetails, opEnd: e.target.value})} className="border border-[#E8E2D9] p-1.5 rounded w-full" /></div></div>
                  <div><label className="block text-[9px] text-[#8C857B] mb-1">Čas anestézie (Od - Do)</label><div className="flex gap-1"><input type="time" value={surgeryDetails.anesStart} onChange={e => setSurgeryDetails({...surgeryDetails, anesStart: e.target.value})} className="border border-[#E8E2D9] p-1.5 rounded w-full" /><input type="time" value={surgeryDetails.anesEnd} onChange={e => setSurgeryDetails({...surgeryDetails, anesEnd: e.target.value})} className="border border-[#E8E2D9] p-1.5 rounded w-full" /></div></div>
                  <div><label className="block text-[9px] text-[#8C857B] mb-1">Asistent / Sestra</label><input type="text" value={surgeryDetails.assistant} onChange={e => setSurgeryDetails({...surgeryDetails, assistant: e.target.value})} className="border border-[#E8E2D9] p-1.5 rounded w-full" /></div>
                  <div><label className="block text-[9px] text-[#8C857B] mb-1">Anesteziológ</label><input type="text" value={surgeryDetails.anesthesiologist} onChange={e => setSurgeryDetails({...surgeryDetails, anesthesiologist: e.target.value})} className="border border-[#E8E2D9] p-1.5 rounded w-full" /></div>
                </div>
                {docType === 'prepustacia_sprava' && (
                  <div>
                    <label className="block text-[9px] text-[#8C857B] mb-1">Najbližšia kontrola</label>
                    <select value={surgeryDetails.checkup} onChange={e => setSurgeryDetails({...surgeryDetails, checkup: e.target.value})} className="border border-[#E8E2D9] p-1.5 rounded w-full text-xs">
                      <option value="1 deň">O 1 deň</option><option value="2 dni">O 2 dni</option><option value="1 týždeň">O 1 týždeň</option><option value="2 týždne">O 2 týždne</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* SEKCIA: ANESTEZIOLOGICKÝ DOTAZNÍK (Otázky pre pacienta) */}
            {showAnesthesiaQ && (
              <div className="border border-[#E8E2D9] rounded-xl p-4 bg-[#FBF9F6] space-y-3">
                <p className="text-[10px] uppercase tracking-wider font-bold text-[#2C2A29]">Zdravotný dotazník pacienta</p>
                {[
                  { key: 'diseases', label: 'Liečite sa v súčasnosti na nejaké ochorenie?' },
                  { key: 'pregnant', label: 'Ak ste žena, ste tehotná?' },
                  { key: 'medications', label: 'Užívate nejaké lieky (bolesť, tlak, spanie)?' },
                  { key: 'allergies', label: 'Máte nejaké alergie (lieky, potraviny, náplaste)?' },
                  { key: 'complications', label: 'Vyskytli sa komplikácie s anestéziou u Vás/príbuzných?' }
                ].map((q) => (
                  <div key={q.key} className="flex justify-between items-center border-b border-[#E8E2D9] pb-2 text-xs">
                    <span className="text-[#2C2A29] pr-4">{q.label}</span>
                    <select 
                      value={(anesthesiaAnswers as any)[q.key]} 
                      onChange={(e) => setAnesthesiaAnswers({...anesthesiaAnswers, [q.key]: e.target.value})}
                      className="border border-[#E8E2D9] p-1 rounded bg-white w-24 font-bold"
                    >
                      <option value="Nie">Nie</option><option value="Áno">Áno</option><option value="Neviem">Neviem</option>
                    </select>
                  </div>
                ))}
              </div>
            )}

            {/* SEKCIA: POZNÁMKY A TEXT (Pre bežné správy - okrem VV) */}
            {showNotes && (
              <div className="space-y-2">
                <div className="flex justify-between items-end mb-1">
                  <label className="block text-[10px] uppercase text-[#8C857B]">Lekársky nález / Protokol / Text správy</label>
                  <select 
                    value="" 
                    onChange={(e) => handleMacroInsert(e.target.value, 'notes')}
                    className="border border-[#E8E2D9] p-1.5 rounded-lg text-[10px] bg-[#FBF9F6] text-[#8C857B] font-bold shadow-sm"
                  >
                    <option value="" disabled>+ Vložiť makro predlohu...</option>
                    <option value="viecka">Viečka</option>
                    <option value="nos">Nos</option>
                    <option value="tvar">Tvár</option>
                    <option value="prsniky">Prsníky</option>
                    <option value="brucho">Brucho</option>
                    <option value="lipo">Lipo</option>
                    <option value="labio">Labio</option>
                    <option value="ruka">Ruka (Karpál / Dupuytren)</option>
                  </select>
                </div>
                <textarea rows={6} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Tu vpíšte text podľa typu dokumentu..." className="w-full border border-[#E8E2D9] p-3 rounded-xl text-xs bg-white text-[#2C2A29]" />
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-[#C5A059] hover:bg-[#b08d48] text-white font-medium py-3 px-6 rounded-xl transition-colors text-xs uppercase tracking-wider disabled:opacity-50 print:hidden">
              {loading ? 'Spracovávam...' : '💾 Uložiť záznam do systému'}
            </button>
          </form>

          {result && (
            <div className={`p-3 rounded-xl text-xs border print:hidden ${result.success ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
              <p className="font-semibold">{result.message}</p>
            </div>
          )}
        </div>

        {/* ======================================================= */}
        {/* PRAVÁ ČASŤ - NÁHĽAD (Tlačený dokument)                  */}
        {/* ======================================================= */}
        <div className="lg:col-span-6 bg-[#FBF9F6] p-8 rounded-2xl border border-[#E8E2D9] shadow-sm flex flex-col print:p-0 print:border-none print:shadow-none print:bg-white print:block">
          
          <div className="flex justify-between items-center mb-4 print:hidden">
             <h3 className="text-[10px] font-bold text-[#8C857B] uppercase tracking-widest">Náhľad dokumentu</h3>
             <button onClick={handlePrint} className="bg-[#2C2A29] hover:bg-black text-white text-[11px] font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition-colors shadow-sm">
               🖨️ Tlačiť {DOC_TITLES[docType]}
             </button>
          </div>

          {/* TLAČOVÝ A4 DOKUMENT */}
          <div id="printable-a4" ref={printRef} className="bg-white border border-[#E8E2D9] p-10 shadow-sm text-xs leading-relaxed w-full max-w-[595px] mx-auto print:border-none print:shadow-none print:p-0 print:max-w-none print:w-full" style={{ minHeight: '842px' }}>
            
            {/* Hlavička */}
            <div className="border-b border-[#E8E2D9] pb-6 mb-6 flex justify-between items-start">
              <div>
                <h2 className="font-brand text-2xl font-light tracking-widest uppercase text-[#2C2A29]">SAY CLINIC</h2>
                <p className="text-[9px] uppercase tracking-[0.2em] text-[#C5A059] font-bold mt-1">PLASTICKÁ CHIRURGIA & DERMATOLÓGIA</p>
                <p className="text-[10px] text-[#8C857B] mt-1">Lazovná 43, 974 01 Banská Bystrica</p>
              </div>
              <div className="text-right text-[10px] text-[#8C857B]">
                <span className="bg-[#2C2A29] text-white px-2 py-1 rounded text-[8px] uppercase tracking-wider font-bold">
                  {DOC_TITLES[docType]}
                </span>
                <p className="font-bold text-[#2C2A29] mt-2 text-sm">{doctor}</p>
                <p className="mt-1">Dátum: {new Date().toLocaleDateString('sk-SK')}</p>
              </div>
            </div>

            {/* Údaje pacienta */}
            <div className="bg-[#FBF9F6] p-4 rounded-xl mb-6 border border-[#E8E2D9] text-xs space-y-2">
              <p><strong className="text-[#8C857B] uppercase text-[9px] tracking-wider">Pacient / Klient:</strong> <span className="text-sm font-bold ml-2">{patientName || '---'}</span></p>
              <p><strong className="text-[#8C857B] uppercase text-[9px] tracking-wider">Rodné číslo:</strong> <span className="ml-2 font-mono">{birthNumber || '---'}</span></p>
              <p><strong className="text-[#8C857B] uppercase text-[9px] tracking-wider">Diagnóza:</strong> <span className="ml-2">{diagnosis}</span></p>
              {!showPricing && !showAnesthesiaQ && !showVV && manualProcedure && (
                <p><strong className="text-[#8C857B] uppercase text-[9px] tracking-wider">Zákrok:</strong> <span className="ml-2 font-bold">{manualProcedure}</span></p>
              )}
            </div>

            {/* DYNAMICKÝ OBSAH PODĽA TYPU */}
            
            {/* --- 0. Vstupné vyšetrenie --- */}
            {showVV && (
              <div className="space-y-6 mb-8">
                <div>
                  <p className="font-bold text-[10px] uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-1 mb-2">Podrobný popis plánovaného výkonu:</p>
                  <p className="text-sm font-semibold">{vvPlan || '---'}</p>
                  <p className="text-xs mt-2"><strong className="text-[#8C857B] uppercase text-[9px] tracking-wider mr-2">Termín zákroku:</strong> {vvDate ? new Date(vvDate).toLocaleDateString('sk-SK') : 'Neurčený'}</p>
                </div>

                <div className="grid grid-cols-3 gap-4 border border-[#E8E2D9] rounded-xl p-3 bg-[#FBF9F6] text-xs">
                  <div><span className="block text-[9px] text-[#8C857B] uppercase font-bold">Anestézia</span>{vvAnesthesiaType}</div>
                  <div><span className="block text-[9px] text-[#8C857B] uppercase font-bold">Dĺžka zákroku</span>{anesthesiaHours} hod</div>
                  <div>
                    <span className="block text-[9px] text-[#8C857B] uppercase font-bold">Hospitalizácia</span>
                    {hospitalizationType === 'none' ? 'ambulantne' : hospitalizationType === 'half' ? '1/2 dňa' : hospitalizationType === 'full' ? '1 deň' : '2 dni'}
                  </div>
                </div>

                <div>
                  <p className="font-bold text-[10px] uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-1 mb-2">Anamnéza:</p>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs">
                    <div><strong>Vek:</strong> {vvVek}</div><div><strong>AA:</strong> {vvAA || 'neudáva žiadne'}</div>
                    <div><strong>Výška:</strong> {vvVyska ? `${vvVyska} cm` : ''}</div><div><strong>OA:</strong> {vvOA || 'neudáva žiadne'}</div>
                    <div><strong>Váha:</strong> {vvVaha ? `${vvVaha} kg` : ''}</div><div><strong>LA:</strong> {vvLA || 'neudáva žiadne'}</div>
                    <div><strong>BMI:</strong> {calcBMI()}</div><div><strong>GA:</strong> {vvGA || 'neudáva žiadne'}</div>
                  </div>
                </div>

                {vvCave && (
                  <div>
                    <p className="font-bold text-[10px] uppercase text-rose-600 border-b border-rose-200 pb-1 mb-1">CAVE:</p>
                    <p className="text-rose-800 font-bold">{vvCave}</p>
                  </div>
                )}

                <div>
                  <p className="font-bold text-[10px] uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-1 mb-2">Status Localis (SPL):</p>
                  <p className="whitespace-pre-line">{vvSPL || '---'}</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="font-bold text-[10px] uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-1 mb-2">Predoperačné vyšetrenia:</p>
                    {vvExams.length > 0 ? (
                      <ul className="list-disc pl-4 text-xs space-y-1">
                        {vvExams.map(ex => (
                          <li key={ex}>{ex === 'Iné' ? `Iné: ${vvExamsOther}` : ex}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[#8C857B] italic">Žiadne</p>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="font-bold text-[10px] uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-1 mb-2">Implantáty:</p>
                      {vvImplants.some(impl => impl.vyrobca || impl.kat || impl.objem) ? (
                         vvImplants.map((impl, idx) => (
                          <div key={idx} className="mb-2">
                            <p className="text-xs"><strong>Výrobca:</strong> {impl.vyrobca || '---'}</p>
                            <p className="text-xs"><strong>Kat. č.:</strong> {impl.kat || '---'} | <strong>Objem:</strong> {impl.objem || '---'}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-[#8C857B]">Nevyžaduje sa</p>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-[10px] uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-1 mb-1">Materiál:</p>
                      <p className="text-xs">{vvMaterial || '---'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- 1. Cenová ponuka / Dohoda o cene --- */}
            {showPricing && (
              <div className="space-y-4 mb-8">
                <p className="font-bold text-[10px] uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-1">Rozpis výkonov a služieb:</p>
                <ul className="divide-y divide-[#E8E2D9]">
                  {selectedItems.map((item) => (
                    <li key={item.id} className="py-2 flex justify-between items-center text-xs">
                      <span className="font-medium">{item.name}</span><span className="font-bold">{item.price.toFixed(2)} €</span>
                    </li>
                  ))}
                  {hasOperation && (
                    <>
                      <li className="py-2 flex justify-between text-xs"><span className="font-medium">Celková anestézia ({anesthesiaHours} hod.)</span><span className="font-bold">{anesthesiaPrice.toFixed(2)} €</span></li>
                      {hospitalizationType !== 'none' && <li className="py-2 flex justify-between text-xs"><span className="font-medium">{hospitalizationType === 'half' ? 'Pobyt 1/2 dňa' : hospitalizationType === 'full' ? 'Pobyt 1 deň' : 'Pobyt 2 dni'}</span><span className="font-bold">{hospitalizationPrice.toFixed(2)} €</span></li>}
                    </>
                  )}
                </ul>
                <div className="flex justify-between items-center bg-[#FBF9F6] p-4 rounded-xl border border-[#C5A059] font-bold text-sm">
                  <span className="uppercase tracking-wider text-[10px] text-[#8C857B]">Celková suma:</span>
                  <span className="text-lg text-[#C5A059]">{totalPrice.toFixed(2)} €</span>
                </div>
                
                {docType === 'dohoda_o_cene' && (
                  <div className="text-[9px] text-[#8C857B] space-y-2 pt-4 text-justify leading-tight">
                    <p className="font-bold text-[#2C2A29]">Podmienky dohody:</p>
                    <p>Zálohová platba vo výške 30% z celkovej ceny výkonu je splatná vopred. Doplatok je hradený v hotovosti alebo na definitívnu faktúru po operácii. Klient berie na vedomie, že uvedená cena zahŕňa štandardný rozsah dohodnutých výkonov.</p>
                    <p>Porozumel/a som, že je nevyhnutné dochádzať na pravidelné kontroly, a to podľa pokynov ošetrujúceho lekára. Kontroly sú odporučené v intervaloch: 1 týždeň, 2 týždeň, 1 mesiac, 3 mesiace, 6 mesiacov a 1 rok od vykonania zákroku.</p>
                  </div>
                )}
              </div>
            )}

            {/* --- 2. Operačný protokol / Prepúšťacia správa --- */}
            {showSurgeryDetails && (
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4 bg-[#FBF9F6] p-4 rounded-xl border border-[#E8E2D9] text-[10px]">
                  <div><span className="text-[#8C857B] uppercase font-bold block mb-1">Čas operácie:</span> <span className="font-mono text-sm">{surgeryDetails.opStart} - {surgeryDetails.opEnd}</span></div>
                  <div><span className="text-[#8C857B] uppercase font-bold block mb-1">Čas anestézie:</span> <span className="font-mono text-sm">{surgeryDetails.anesStart} - {surgeryDetails.anesEnd}</span></div>
                  <div className="col-span-2 pt-2 border-t border-[#E8E2D9]">
                    <p className="mb-1"><strong>Operatér:</strong> {doctor}</p>
                    {surgeryDetails.assistant && <p className="mb-1"><strong>Asistent:</strong> {surgeryDetails.assistant}</p>}
                    {surgeryDetails.anesthesiologist && <p className="mb-1"><strong>Anesteziológ:</strong> {surgeryDetails.anesthesiologist}</p>}
                  </div>
                </div>
                
                {docType === 'prepustacia_sprava' && (
                  <div className="bg-rose-50 border border-rose-100 p-3 rounded-lg text-rose-800 text-xs font-bold flex justify-between">
                    <span>⚠️ Najbližšia pooperačná kontrola:</span>
                    <span className="uppercase">{surgeryDetails.checkup}</span>
                  </div>
                )}
              </div>
            )}

            {/* --- 3. Anesteziologický dotazník --- */}
            {showAnesthesiaQ && (
              <div className="space-y-4 mb-8">
                <p className="font-bold text-[10px] uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-1">Zdravotná anamnéza (Vyplnil pacient):</p>
                <table className="w-full text-xs text-left">
                  <tbody className="divide-y divide-[#E8E2D9]">
                    <tr><td className="py-2 pr-4 border-b border-[#E8E2D9]">Liečite sa v súčasnosti na nejaké ochorenie?</td><td className="font-bold border-b border-[#E8E2D9]">{anesthesiaAnswers.diseases}</td></tr>
                    <tr><td className="py-2 pr-4 border-b border-[#E8E2D9]">Ak ste žena, ste tehotná?</td><td className="font-bold border-b border-[#E8E2D9]">{anesthesiaAnswers.pregnant}</td></tr>
                    <tr><td className="py-2 pr-4 border-b border-[#E8E2D9]">Užívate nejaké lieky (proti bolesti, na spanie, tlak)?</td><td className="font-bold border-b border-[#E8E2D9]">{anesthesiaAnswers.medications}</td></tr>
                    <tr><td className="py-2 pr-4 border-b border-[#E8E2D9]">Máte alergie na lieky, potraviny alebo náplaste?</td><td className="font-bold border-b border-[#E8E2D9]">{anesthesiaAnswers.allergies}</td></tr>
                    <tr><td className="py-2 pr-4">Vyskytli sa komplikácie s anestéziou u Vás/príbuzných?</td><td className="font-bold">{anesthesiaAnswers.complications}</td></tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* --- Spoločný textový blok (Nález) --- */}
            {showNotes && (
              <div className="space-y-2 mb-8 flex-1">
                <p className="font-bold text-[10px] uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-1">
                  {docType === 'operacny_protokol' ? 'Popis operácie:' : 'Podrobný popis / Nález:'}
                </p>
                <div className="whitespace-pre-line text-sm text-[#2C2A29] leading-relaxed pt-2">
                  {notes || '...'}
                </div>
              </div>
            )}

            {/* Právna doložka a poučenia */}
            {(showVV || docType === 'kontrolne_vysetrenie' || docType === 'anesteziologicky_dotaznik') && (
              <div className="text-[8px] text-[#8C857B] space-y-2 border-t border-[#E8E2D9] pt-4 mt-6 leading-tight text-justify">
                {showVV && (
                  <>
                    <p>Po vyšetreniach a zhodnotení anamnézy, objektívneho nálezu a rizikových faktorov je možné očakávať priaznivý efekt výkonu.</p>
                    <p className="font-semibold text-[#2C2A29]">
                      {vvNoContra ? 'Bez zjavnej kontraindikácie k výkonu (t.č.).' : `Kontraindikácia: ${vvContraReason}`}
                    </p>
                  </>
                )}
                <p>Klient/ka súhlasí s vykonaním vyšetrení v stanovenom rozsahu. Klient/ka prehlasuje, že bol/a poučený/á o výkone, jeho priebehu a podstate, výsledných jazvách, rizikách a komplikáciách, pooperačnom režime a starostlivosti. Bol podrobne prerokovaný miestny nález vrátane asymetrie, kvality tkanív a bolo vysvetlené, čo operáciou možno dosiahnuť. Boli diskutované rizikové faktory a bolo upozornené na ich vplyv na hojenie alebo výskyt komplikácií. Klient/ka rozumie, nemá ďalšie otázky, preberá podrobné poučenie v písomnej forme.</p>
                <p>Prevádzkovateľ spracúva osobné údaje pacienta, vrátane údajov o zdraví a medicínskej fotodokumentácie, za účelom poskytovania zdravotnej starostlivosti podľa zákona č. 576/2004 Z. z. Medicínske fotografie sú súčasťou zdravotnej dokumentácie. Priestory kliniky sú z dôvodu bezpečnosti a ochrany majetku monitorované kamerovým systémom na základe oprávneného záujmu prevádzkovateľa. Záznamy sú uchovávané po dobu 14 dní. Podrobné informácie o ochrane údajov sú zverejnené v priestoroch recepcie.</p>
              </div>
            )}

            {/* Podpisy */}
            <div className="mt-10 pt-6 flex justify-between items-end text-[10px] text-[#8C857B]">
              <div className="text-center">
                <div className="w-40 border-b border-[#2C2A29] mb-2"></div>
                Podpis pacienta / klienta
              </div>
              <div className="text-center">
                <div className="w-40 border-b border-[#2C2A29] mb-2"></div>
                <span className="font-bold text-[#2C2A29]">{doctor}</span><br />
                Pečiatka a podpis lekára
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
