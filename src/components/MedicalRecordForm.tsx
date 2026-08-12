'use client';

import React, { useState, useEffect, useRef } from 'react';
import { HealthProService, HealthProResponse } from '../services/healthpro';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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

// DATABÁZA MKCH-10 DIAGNÓZ
const MKCH_DATABASE = [
  { code: 'Z41.1', name: 'Z41.1 - Estetická chirurgická úprava' },
  { code: 'Z41.8', name: 'Z41.8 - Iné výkony na estetické účely' },
  { code: 'N62', name: 'N62 - Hypertrofia prsníka (Gigantomastia / Macromastia)' },
  { code: 'N64.8', name: 'N64.8 - Iné špecifikované choroby prsníka (Ptóza / Asymetria)' },
  { code: 'G56.0', name: 'G56.0 - Syndróm karpálneho tunela' },
  { code: 'M65.3', name: 'M65.3 - Skákavý prst (Trigger finger)' },
  { code: 'M72.0', name: 'M72.0 - Palmárna fasciálna fibromatóza (Dupuytrenova kontraktúra)' },
  { code: 'D22.9', name: 'D22.9 - Melanocytový névus (Znamienko / Neuspecifikovaný)' },
  { code: 'D17.9', name: 'D17.9 - Benígny lipomatózny nádor (Lipóm)' },
  { code: 'L70.0', name: 'L70.0 - Acne vulgaris' },
  { code: 'L91.0', name: 'L91.0 - Keloidná jazva' },
  { code: 'L90.5', name: 'L90.5 - Jazvové stavy a atrofia kože' },
  { code: 'L81.4', name: 'L81.4 - Iné epidermové hyperpigmentácie' },
  { code: 'Z01.9', name: 'Z01.9 - Všeobecné vyšetrenie' },
];

const OBJ_MACROS: Record<string, string> = {
  viecka: "VIEČKA:\n• Objem znížený, v neadekvátnej distribúcii\n• Koža v prebytku\n• Orbitálny tuk prolabuje na horných aj dolných mihalniciach",
  nos: "NOS:\n• Dorsum: vyššej projekcie, primeranej šírky\n• Špička: v hyperprojekcii, bulbózna",
  prsniky: "PRSNÍKY:\n• BW:\n• SNN:\n• Ptóza: -\n• Symetria: Áno",
  brucho: "BRUCHO:\n• Koža: v prebytku, nízkej elasticity\n• Podkožie: PT brucho, boky"
};

interface FormProps {
  onRecordCreated?: (sale: { date: string; patientName: string; doctorName: string; serviceType: string; amount: number; }) => void;
  initialPatient?: { name: string; birthNumber: string } | null;
}

export default function MedicalRecordForm({ onRecordCreated, initialPatient }: FormProps) {
  const [docType, setDocType] = useState<'dekurzus' | 'cenova_ponuka'>('dekurzus');
  
  const [patientName, setPatientName] = useState(initialPatient?.name || '');
  const [birthNumber, setBirthNumber] = useState(initialPatient?.birthNumber || '');
  
  const [doctor, setDoctor] = useState('MUDr. Ján Mráz');
  const [diagnosis, setDiagnosis] = useState('Z41.1 - Estetická chirurgická úprava');
  const [manualProcedure, setManualProcedure] = useState(''); // Ručný zápis pre Dekurzus
  const [notes, setNotes] = useState('');

  // Vybrané položky cenníka (iba pre Cenovú ponuku)
  const [selectedItems, setSelectedItems] = useState<ServiceCategory[]>([]);

  // Operačné poplatky
  const [hasOperation, setHasOperation] = useState(false);
  const [anesthesiaHours, setAnesthesiaHours] = useState(1);
  const [hospitalizationType, setHospitalizationType] = useState<'none' | 'half' | 'full'>('none');
  
  const [loading, setLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [result, setResult] = useState<HealthProResponse | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  // Prepojenie z Kartotéky
  useEffect(() => {
    if (initialPatient) {
      setPatientName(initialPatient.name);
      setBirthNumber(initialPatient.birthNumber);
    }
  }, [initialPatient]);

  // PRIDANIE POLOŽKY Z DROPDOWNU
  const handleAddItemFromDropdown = (itemId: string, isOperation = false) => {
    if (!itemId) return;
    
    const allServices = [
      ...SERVICES_DATABASE.operations,
      ...SERVICES_DATABASE.operationExtras,
      ...SERVICES_DATABASE.applications,
      ...SERVICES_DATABASE.cosmetics,
      ...SERVICES_DATABASE.services,
    ];
    
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
    ? hospitalizationType === 'half' ? 100 : hospitalizationType === 'full' ? 200 : 0
    : 0;

  const totalPrice = basePrice + anesthesiaPrice + hospitalizationPrice;

  const insertMacro = (key: string) => {
    if (!key || !OBJ_MACROS[key]) return;
    setNotes((prev) => (prev ? prev + "\n\n" + OBJ_MACROS[key] : OBJ_MACROS[key]));
  };

  const downloadPDF = async () => {
    if (!printRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      const safeName = (patientName || 'Neznamy_Pacient').replace(/[^a-z0-9]/gi, '_');
      const docName = docType === 'cenova_ponuka' ? 'Cenova_Ponuka' : 'Dekurzus';
      pdf.save(`SAYCLINIC_${docName}_${safeName}.pdf`);
    } catch (error) {
      console.error('Chyba pri generovaní PDF:', error);
      alert('Nepodarilo sa vygenerovať PDF.');
    }
    setIsGeneratingPdf(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const serviceTitle = docType === 'cenova_ponuka'
      ? selectedItems.map((i) => i.name).join(', ') || 'Klinický úkon'
      : manualProcedure || 'Klinický úkon';

    const response = await HealthProService.sendMedicalRecord({
      patientBirthNumber: birthNumber,
      diagnosisCode: diagnosis,
      notes: notes,
      doctorLicenseCode: 'LEK-123456',
    });

    setResult(response);
    setLoading(false);

    if (response.success && onRecordCreated) {
      onRecordCreated({
        date: new Date().toISOString().split('T')[0],
        patientName: patientName || 'Neznámy pacient',
        doctorName: doctor,
        serviceType: docType === 'cenova_ponuka' ? `Cenová ponuka: ${serviceTitle}` : serviceTitle,
        amount: docType === 'cenova_ponuka' ? totalPrice : 0,
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* ĽAVÁ ČASŤ - FORMULÁR LEKÁRA */}
      <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-5">
        <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-3">
          <div>
            <h2 className="font-brand text-xl font-light text-[#2C2A29] uppercase font-bold">Generátor Dokumentov SAY CLINIC</h2>
            <p className="text-[9px] uppercase tracking-widest text-[#8C857B]">Ambulantný nález & Cenové ponuky</p>
          </div>
          <div className="flex gap-1 bg-[#FBF9F6] p-1 rounded-xl border border-[#E8E2D9]">
            <button type="button" onClick={() => setDocType('dekurzus')} className={`px-3 py-1 text-[10px] uppercase font-semibold rounded-lg transition-all ${ docType === 'dekurzus' ? 'bg-[#2C2A29] text-white' : 'text-[#8C857B]' }`}>Dekurzus / Vstupné</button>
            <button type="button" onClick={() => setDocType('cenova_ponuka')} className={`px-3 py-1 text-[10px] uppercase font-semibold rounded-lg transition-all ${ docType === 'cenova_ponuka' ? 'bg-[#C5A059] text-white' : 'text-[#8C857B]' }`}>Cenová ponuka</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              <input type="text" required value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="napr. Mária Kováčová" className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase text-[#8C857B] mb-1">Rodné číslo</label>
              <input type="text" required value={birthNumber} onChange={(e) => setBirthNumber(e.target.value)} placeholder="885512/6789" className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]" />
            </div>
            
            {/* VYHĽADÁVANIE MKCH-10 DIAGNÓZ */}
            <div>
              <label className="block text-[10px] uppercase text-[#8C857B] mb-1">Diagnóza (MKCH-10 kód / názov)</label>
              <input 
                type="text" 
                list="mkch-suggestions" 
                value={diagnosis} 
                onChange={(e) => setDiagnosis(e.target.value)} 
                placeholder="Začnite písať (napr. Z41, karpál...)"
                className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]" 
              />
              <datalist id="mkch-suggestions">
                {MKCH_DATABASE.map((item) => (
                  <option key={item.code} value={item.name} />
                ))}
              </datalist>
            </div>
          </div>

          {/* DYNAMICKÉ ZOBRAZENIE: CENNÍK PRE CENOVÚ PONUKU VS. RUČNÝ ZÁPIS PRE DEKURZUS */}
          {docType === 'cenova_ponuka' ? (
            <div className="border border-[#E8E2D9] rounded-xl p-4 bg-[#FBF9F6] space-y-3">
              <p className="text-[10px] uppercase tracking-wider font-bold text-[#2C2A29]">
                Výber výkonov z cenníka SAY CLINIC ({selectedItems.length} vybraných)
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* 1. Operácie */}
                <div>
                  <label className="block text-[9px] uppercase font-bold text-[#C5A059] mb-1">1. Operácie</label>
                  <select 
                    onChange={(e) => { handleAddItemFromDropdown(e.target.value, true); e.target.value = ''; }}
                    className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]"
                  >
                    <option value="">-- Pridať Operáciu --</option>
                    {SERVICES_DATABASE.operations.map((item) => (
                      <option key={item.id} value={item.id}>{item.name} ({item.price} €)</option>
                    ))}
                  </select>
                </div>

                {/* 2. Príplatky */}
                <div>
                  <label className="block text-[9px] uppercase font-bold text-[#C5A059] mb-1">2. Príplatky k operáciám</label>
                  <select 
                    onChange={(e) => { handleAddItemFromDropdown(e.target.value); e.target.value = ''; }}
                    className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]"
                  >
                    <option value="">-- Pridať Príplatok --</option>
                    {SERVICES_DATABASE.operationExtras.map((item) => (
                      <option key={item.id} value={item.id}>{item.name} (+{item.price} €)</option>
                    ))}
                  </select>
                </div>

                {/* 3. Aplikácie */}
                <div>
                  <label className="block text-[9px] uppercase font-bold text-[#C5A059] mb-1">3. Aplikácie (Botox / Výplne)</label>
                  <select 
                    onChange={(e) => { handleAddItemFromDropdown(e.target.value); e.target.value = ''; }}
                    className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]"
                  >
                    <option value="">-- Pridať Aplikáciu --</option>
                    {SERVICES_DATABASE.applications.map((item) => (
                      <option key={item.id} value={item.id}>{item.name} ({item.price} €)</option>
                    ))}
                  </select>
                </div>

                {/* 4. Kozmetika & Prádlo */}
                <div>
                  <label className="block text-[9px] uppercase font-bold text-[#C5A059] mb-1">4. Kozmetika & Lipoelastic prádlo</label>
                  <select 
                    onChange={(e) => { handleAddItemFromDropdown(e.target.value); e.target.value = ''; }}
                    className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]"
                  >
                    <option value="">-- Pridať Kozmetiku / Prádlo --</option>
                    {SERVICES_DATABASE.cosmetics.map((item) => (
                      <option key={item.id} value={item.id}>{item.name} ({item.price} €)</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 5. Služby */}
              <div>
                <label className="block text-[9px] uppercase font-bold text-[#C5A059] mb-1">5. Služby & Vyšetrenia</label>
                <select 
                  onChange={(e) => { handleAddItemFromDropdown(e.target.value); e.target.value = ''; }}
                  className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]"
                >
                  <option value="">-- Pridať Službu / Vyšetrenie --</option>
                  {SERVICES_DATABASE.services.map((item) => (
                    <option key={item.id} value={item.id}>{item.name} ({item.price} €)</option>
                  ))}
                </select>
              </div>

              {/* ZOBRAZENIE VYBRANÝCH ŠTÍTKOV */}
              {selectedItems.length > 0 && (
                <div className="pt-2 border-t border-[#E8E2D9]">
                  <p className="text-[9px] uppercase text-[#8C857B] font-bold mb-1.5">Zvolené položky:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedItems.map((item) => (
                      <span 
                        key={item.id} 
                        className="bg-[#2C2A29] text-white text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm"
                      >
                        <span>{item.name} ({item.price} €)</span>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-[#C5A059] hover:text-white font-bold text-xs"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* OPERAČNÉ POPLATKY */}
              <div className="border-t border-[#E8E2D9] pt-2 mt-2">
                <label className="flex items-center space-x-2 text-xs font-bold text-[#2C2A29] cursor-pointer">
                  <input type="checkbox" checked={hasOperation} onChange={(e) => setHasOperation(e.target.checked)} className="accent-[#C5A059]" />
                  <span>Započítať Celkovú Anestéziu a Pobyt</span>
                </label>

                {hasOperation && (
                  <div className="mt-2 bg-white p-2.5 rounded-lg border border-[#E8E2D9] space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span>Celková anestézia (130 € / hod):</span>
                      <select value={anesthesiaHours} onChange={(e) => setAnesthesiaHours(parseFloat(e.target.value))} className="border border-[#E8E2D9] p-1 rounded bg-[#FBF9F6]">
                        <option value={1}>1 hodina (130 €)</option>
                        <option value={1.5}>1.5 hodiny (195 €)</option>
                        <option value={2}>2 hodiny (260 €)</option>
                        <option value={2.5}>2.5 hodiny (325 €)</option>
                        <option value={3}>3 hodiny (390 €)</option>
                        <option value={3.5}>3.5 hodiny (455 €)</option>
                        <option value={4}>4 hodiny (520 €)</option>
                        <option value={5}>5 hodín (650 €)</option>
                        <option value={6}>6 hodín (780 €)</option>
                        <option value={7}>7 hodín (910 €)</option>
                        <option value={8}>8 hodín (1040 €)</option>
                      </select>
                    </div>

                    <div className="flex justify-between items-center">
                      <span>Hospitalizácia / Pobyt:</span>
                      <select value={hospitalizationType} onChange={(e) => setHospitalizationType(e.target.value as 'none' | 'half' | 'full')} className="border border-[#E8E2D9] p-1 rounded bg-[#FBF9F6]">
                        <option value="none">Bez hospitalizácie (0 €)</option>
                        <option value="half">Hospitalizácia - 1/2 dňa (100 €)</option>
                        <option value="full">Hospitalizácia - 1 deň (200 €)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-[#2C2A29] text-white p-3 rounded-xl flex justify-between items-center text-xs shadow-md">
                <span>Celková vypočítaná cena:</span>
                <span className="text-base font-bold text-[#C5A059]">{totalPrice.toFixed(2)} €</span>
              </div>
            </div>
          ) : (
            /* AK JE ZVOLENÝ DEKURZUS - ZOBRAZÍ SA IBA RUČNÁ KOLÓNKA */
            <div className="border border-[#E8E2D9] rounded-xl p-3 bg-[#FBF9F6]">
              <label className="block text-[10px] uppercase font-bold text-[#2C2A29] mb-1">
                Vykonaný úkon / Zákrok
              </label>
              <input 
                type="text" 
                value={manualProcedure} 
                onChange={(e) => setManualProcedure(e.target.value)} 
                placeholder="napr. Blefaroplastika horných viečok, Konzultácia..." 
                className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]" 
              />
            </div>
          )}

          <div>
            <label className="block font-light text-[#8C857B] uppercase text-[10px] tracking-wider mb-1">Vložiť makro (Plastická chirurgia):</label>
            <select onChange={(e) => insertMacro(e.target.value)} className="w-full border border-[#E8E2D9] p-2 rounded-xl text-xs bg-white text-[#2C2A29]">
              <option value="">-- Vyberte oblasť (makro) --</option>
              <option value="viecka">Viečka</option>
              <option value="nos">Nos</option>
              <option value="prsniky">Prsníky</option>
              <option value="brucho">Brucho</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase text-[#8C857B] mb-1">Lekársky nález / Poznámky k vyšetreniu</label>
            <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anamnéza, lokalizácia, nález alebo podmienky..." className="w-full border border-[#E8E2D9] p-3 rounded-xl text-xs bg-white text-[#2C2A29]" />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-[#2C2A29] hover:bg-[#C5A059] text-white font-medium py-3 px-6 rounded-xl transition-colors text-xs uppercase tracking-wider disabled:opacity-50">
            {loading ? 'Spracovávam...' : docType === 'cenova_ponuka' ? 'Vystaviť Cenovú Ponuku' : 'Odoslať do HealthPro & Zaevidovať Tržbu'}
          </button>
        </form>

        {result && (
          <div className={`p-3 rounded-xl text-xs border ${result.success ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
            <p className="font-semibold">{result.message}</p>
            {result.transactionId && <p className="text-[10px] mt-1 font-mono">ID Transakcie: {result.transactionId}</p>}
          </div>
        )}
      </div>

      {/* PRAVÁ ČASŤ - NÁHĽAD A PDF */}
      <div className="lg:col-span-6 bg-[#FBF9F6] p-8 rounded-2xl border border-[#E8E2D9] shadow-sm flex flex-col">
        
        <div className="flex justify-between items-center mb-4">
           <h3 className="text-[10px] font-bold text-[#8C857B] uppercase tracking-widest">
              Náhľad dokumentu — {docType === 'cenova_ponuka' ? 'CENOVÁ PONUKA' : 'AMBULANTNÝ NÁLEZ'}
           </h3>
           <button 
             onClick={downloadPDF}
             disabled={isGeneratingPdf}
             className="bg-[#C5A059] hover:bg-[#b08d48] text-white text-[11px] font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition-colors shadow-sm disabled:opacity-50"
           >
             {isGeneratingPdf ? 'Generujem PDF...' : '📥 Stiahnuť PDF'}
           </button>
        </div>

        {/* TLAČOVÝ A4 DOKUMENT */}
        <div ref={printRef} className="bg-white border border-[#E8E2D9] p-10 shadow-sm text-xs leading-relaxed w-full max-w-[595px] mx-auto" style={{ minHeight: '842px' }}>
          
          {/* Hlavička */}
          <div className="border-b border-[#E8E2D9] pb-6 mb-6 flex justify-between items-start">
            <div>
              <h2 className="font-brand text-2xl font-light tracking-widest uppercase text-[#2C2A29]">SAY CLINIC</h2>
              <p className="text-[9px] uppercase tracking-[0.2em] text-[#C5A059] font-bold mt-1">PLASTICKÁ CHIRURGIA & DERMATOLÓGIA</p>
              <p className="text-[10px] text-[#8C857B] mt-1">Rudlovská cesta 83, 974 11 Banská Bystrica</p>
            </div>
            <div className="text-right text-[10px] text-[#8C857B]">
              <span className="bg-[#2C2A29] text-white px-2 py-1 rounded text-[8px] uppercase tracking-wider font-bold">
                {docType === 'cenova_ponuka' ? 'CENOVÁ PONUKA' : 'AMBULANTNÝ NÁLEZ'}
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
          </div>

          {/* Zoznam úkonov */}
          <div className="space-y-3 mb-8">
            <p className="font-bold text-[10px] uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-1">
              {docType === 'cenova_ponuka' ? 'Rozpis zvolených výkonov a služieb:' : 'Vykonaný úkon / Zákrok:'}
            </p>
            
            {docType === 'cenova_ponuka' ? (
              <>
                {selectedItems.length === 0 ? (
                  <p className="text-xs text-[#8C857B] italic">Žiadne vybrané položky</p>
                ) : (
                  <ul className="divide-y divide-[#E8E2D9]">
                    {selectedItems.map((item) => (
                      <li key={item.id} className="py-2 flex justify-between items-center text-xs">
                        <span className="font-medium">{item.name}</span>
                        <span className="font-bold">{item.price.toFixed(2)} €</span>
                      </li>
                    ))}
                    {hasOperation && (
                      <>
                        <li className="py-2 flex justify-between items-center text-xs">
                          <span className="font-medium">Celková anestézia ({anesthesiaHours} hod.)</span>
                          <span className="font-bold">{anesthesiaPrice.toFixed(2)} €</span>
                        </li>
                        {hospitalizationType !== 'none' && (
                          <li className="py-2 flex justify-between items-center text-xs">
                            <span className="font-medium">{hospitalizationType === 'half' ? 'Hospitalizácia - 1/2 dňa' : 'Hospitalizácia - 1 deň'}</span>
                            <span className="font-bold">{hospitalizationPrice.toFixed(2)} €</span>
                          </li>
                        )}
                      </>
                    )}
                  </ul>
                )}

                <div className="flex justify-between items-center bg-[#FBF9F6] p-4 rounded-xl border border-[#C5A059] font-bold text-sm mt-4">
                  <span className="uppercase tracking-wider text-[10px] text-[#8C857B]">Celková suma:</span>
                  <span className="text-lg text-[#C5A059]">{totalPrice.toFixed(2)} €</span>
                </div>
              </>
            ) : (
              <p className="text-sm font-semibold text-[#2C2A29] py-1">
                {manualProcedure || 'Klinické vyšetrenie / dekurzus'}
              </p>
            )}
          </div>

          {/* Text nálezu */}
          <div className="space-y-2 mb-8 flex-1">
            <p className="font-bold text-[10px] uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-1">
              {docType === 'cenova_ponuka' ? 'Podmienky cenovej ponuky:' : 'Lekársky nález / Dekurzus:'}
            </p>
            <div className="whitespace-pre-line text-sm text-[#2C2A29] leading-relaxed pt-2">
              {notes || 'Text nálezu...'}
            </div>
          </div>

          {/* PRÁVNE A GDPR TEXTY */}
          <div className="text-[8px] text-[#8C857B] space-y-1.5 border-t border-[#E8E2D9] pt-4 mt-6 leading-tight text-justify">
            <p>Po vyšetreniach a zhodnotení anamnézy, objektívneho nálezu a rizikových faktorov je možné očakávať priaznivý efekt výkonu.</p>
            <p className="font-semibold text-[#2C2A29]">Bez zjavnej kontraindikácie k výkonu (t.č.).</p>
            <p>Klient/ka súhlasí s vykonaním vyšetrení v stanovenom rozsahu. Klient/ka prehlasuje, že bol/a poučený/á o výkone jeho priebehu a podstate, výsledných jazvách, rizikách a komplikáciách, pooperačnom režime a starostlivosti vrátane jeho trvania. Bol/a tiež poučený/á o možnosti pooperačnej asymetrie, možnosti následnej korekcie, o cene a jej zložkách. Bol podrobne prerokovaný miestny nález vrátane predoperačnej asymetrie, kvality tkanív a vysvetlené, čo operáciou možno dosiahnuť. Boli diskutované rizikové faktory a bolo upozornené na ich vplyv na priebeh výkonu, hojenie, alebo na výskyt komplikácií. Klient/ka rozumie, nemá ďalšie otázky, preberá podrobné poučenie v písomnej forme na ďalšie preštudovanie.</p>
            <p>Prevádzkovateľ spracúva osobné údaje pacienta, vrátane údajov o zdraví a medicínskej fotodokumentácie, za účelom poskytovania zdravotnej starostlivosti podľa zákona č. 576/2004 Z. z. Medicínske fotografie sú súčasťou zdravotnej dokumentácie. Priestory kliniky sú z dôvodu bezpečnosti a ochrany majetku monitorované kamerovým systémom (CCTV) na základe oprávneného záujmu prevádzkovateľa.</p>
            <p className="font-semibold text-[#2C2A29]">Rizikové faktory — Fajčenie: 3-násobne vyššie riziko komplikácií. Je vhodné prestať fajčiť minimálne 4 týždne pred operáciou a po operácii.</p>
          </div>

          {/* Podpisy */}
          <div className="mt-8 pt-6 flex justify-between items-end text-[10px] text-[#8C857B]">
            <div>
              <p className="font-bold text-[#C5A059] mb-1">www.sayclinic.sk</p>
              <p>Generované systémom SAY CLINIC Portal</p>
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
  );
}
