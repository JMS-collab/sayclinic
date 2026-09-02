'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  PrescribedMedication, 
  MEDICATION_CATALOG, 
  CATEGORY_LABELS, 
  CLINIC_PRESCRIPTION_DEFAULTS 
} from '../data/prescriptionCatalog';
import { exportElementToPdf, generatePdfFilename } from '../lib/pdfGenerator';
import { Plus, Trash2, RotateCcw, Check, FileText } from './Icons';

interface PrescriptionModuleProps {
  initialPatient?: {
    name?: string;
    birthNumber?: string;
    address?: string;
    phone?: string;
    email?: string;
    insurance?: string;
  } | null;
  onPrescriptionSaved?: (prescription: any) => void;
  onPrintRequested?: () => void;
}

export default function PrescriptionModule({
  initialPatient,
  onPrescriptionSaved,
  onPrintRequested
}: PrescriptionModuleProps) {
  // Poskytovateľ a lekár
  const [doctorName, setDoctorName] = useState(CLINIC_PRESCRIPTION_DEFAULTS.doctorName);
  const [doctorCode, setDoctorCode] = useState(CLINIC_PRESCRIPTION_DEFAULTS.doctorCode);
  const [pzsCode, setPzsCode] = useState(CLINIC_PRESCRIPTION_DEFAULTS.clinicPzsCode);
  const [departmentCode, setDepartmentCode] = useState(CLINIC_PRESCRIPTION_DEFAULTS.departmentCode);
  
  // Pacient
  const [patientName, setPatientName] = useState(initialPatient?.name || '');
  const [birthNumber, setBirthNumber] = useState(initialPatient?.birthNumber || '');
  const [address, setAddress] = useState(initialPatient?.address || 'Banská Bystrica');
  const [insuranceCode, setInsuranceCode] = useState(initialPatient?.insurance || '24 (Dôvera)');
  const [diagnosis, setDiagnosis] = useState('Z41.1 - Estetická chirurgická úprava');

  // Parametre receptu
  const [prescriptionDate, setPrescriptionDate] = useState(new Date().toISOString().split('T')[0]);
  const [validityDays, setValidityDays] = useState<number>(7);
  const [paymentCategory, setPaymentCategory] = useState<'Hradí pacient' | 'Hradí ZP' | 'Čiastočne ZP'>('Hradí pacient');
  const [repeatable, setRepeatable] = useState<'Ne repetatur' | 'Repetatur 1x' | 'Repetatur 2x'>('Ne repetatur');
  const [barcodeNumber, setBarcodeNumber] = useState(() => {
    // Generovanie unikátneho formátu e-receptu
    const num1 = Math.floor(1000 + Math.random() * 9000);
    const num2 = Math.floor(1000 + Math.random() * 9000);
    const num3 = Math.floor(1000 + Math.random() * 9000);
    const num4 = Math.floor(1000 + Math.random() * 9000);
    return `${num1} ${num2} ${num3} ${num4}`;
  });

  // Lieky na recepte (1 až 2 lieky na jeden A6 list)
  const [items, setItems] = useState<PrescribedMedication[]>([
    {
      id: 'item-1',
      name: 'Augmentin 1 g tbl flm 14x1g',
      activeSubstance: 'Amoxicillinum / Acidum clavulanicum',
      packaging: 'Exp. orig. No. I (unam)',
      dosage: 'D.S. 1 tableta každých 12 hodín po jedle (7 dní)',
      category: 'atb',
      paymentType: 'Hradí pacient',
      notes: 'Užívať s jedlom, zapiť vodou'
    },
    {
      id: 'item-2',
      name: 'Aulin 100 mg por gra sus 30 vreciek',
      activeSubstance: 'Nimesulidum',
      packaging: 'Exp. orig. No. I (unam)',
      dosage: 'D.S. 1 vrecko 2x denne po jedle pri bolesti',
      category: 'analgetik',
      paymentType: 'Hradí pacient',
      notes: 'Rozpustiť v pol pohári vlažnej vody'
    }
  ]);

  // Vyhľadávanie v katalógu a filter
  const [catalogFilter, setCatalogFilter] = useState<string>('all');
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  // Aktualizácia údajov pri zmene initialPatient
  useEffect(() => {
    if (initialPatient) {
      if (initialPatient.name) setPatientName(initialPatient.name);
      if (initialPatient.birthNumber) setBirthNumber(initialPatient.birthNumber);
      if (initialPatient.address) setAddress(initialPatient.address);
      if (initialPatient.insurance) setInsuranceCode(initialPatient.insurance);
    }
  }, [initialPatient]);

  // Prepnutie lekára automaticky aktualizuje lekársky kód
  const handleDoctorChange = (name: string) => {
    setDoctorName(name);
    if (name.includes('Sroková')) {
      setDoctorCode(CLINIC_PRESCRIPTION_DEFAULTS.doctor2Code);
    } else if (name.includes('Mráz')) {
      setDoctorCode(CLINIC_PRESCRIPTION_DEFAULTS.doctorCode);
    }
  };

  // Pridanie lieku z katalógu
  const handleAddFromCatalog = (med: PrescribedMedication) => {
    if (items.length >= 2) {
      alert('Štandardné tlačivo receptu A6 pojme maximálne 2 lieky. Odstráňte jeden liek alebo nahraďte existujúci.');
      return;
    }
    const newItem: PrescribedMedication = {
      ...med,
      id: `item-${items.length + 1}-${med.code || 'rx'}`
    };
    setItems([...items, newItem]);
  };

  // Úprava vlastností položky
  const handleUpdateItemField = (index: number, field: keyof PrescribedMedication, value: string) => {
    const updated = [...items];
    if (updated[index]) {
      updated[index] = { ...updated[index], [field]: value };
      setItems(updated);
    }
  };

  // Odstránenie položky
  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Pridanie prázdnej položky
  const handleAddEmptyItem = () => {
    if (items.length >= 2) {
      alert('Štandardný recept A6 obsahuje maximálne 2 lieky.');
      return;
    }
    setItems([
      ...items,
      {
        id: `item-${Date.now()}`,
        name: '',
        packaging: 'Exp. orig. No. I (unam)',
        dosage: 'D.S. ',
        category: 'other',
        paymentType: paymentCategory
      }
    ]);
  };

  // Formátovanie dátumu na slovenský formát
  const formatSlovakDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}. ${parts[1]}. ${parts[0]}`;
    }
    return dateStr;
  };

  // Export do PDF vo formáte A6
  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    setGeneratingPdf(true);
    try {
      const filename = generatePdfFilename('Lekarsky_Recept_A6', patientName, prescriptionDate);
      await exportElementToPdf(printRef.current, filename, 'a6');
    } catch (err) {
      console.error('Chyba exportu receptu do PDF:', err);
      alert('Nastala chyba pri generovaní A6 PDF receptu.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Priama tlač A6
  const handlePrint = () => {
    if (onPrintRequested) {
      onPrintRequested();
    } else {
      window.print();
    }
  };

  // Uloženie do kartotéky pacienta
  const handleSaveToPatientFolder = () => {
    if (!patientName.trim()) {
      alert('Prosím, zadajte meno pacienta.');
      return;
    }

    const prescriptionRecord = {
      id: `rx-${Date.now()}`,
      type: 'Lekársky recept (A6)',
      typeColor: 'bg-[#047857]',
      title: `Recept: ${items.map(i => i.name).filter(Boolean).join(', ') || 'Predpis liekov'}`,
      doctor: doctorName,
      diagnosis: diagnosis,
      date: prescriptionDate,
      content: `LEKÁRSKY RECEPT (A6) - SAY CLINIC\n\nPoskytovateľ: ${CLINIC_PRESCRIPTION_DEFAULTS.clinicName}\nPZS Kód: ${pzsCode} | Lekársky kód: ${doctorCode}\nPacient: ${patientName} (RČ: ${birthNumber})\nAdresa: ${address}\nPoisťovňa: ${insuranceCode}\nDiagnóza: ${diagnosis}\nÚhrada: ${paymentCategory}\nPlatnosť: ${validityDays} dní\n\nPREDPÍSANÉ LIEKY (Rp.):\n${items.map((it, idx) => `${idx + 1}. ${it.name}\n   ${it.packaging}\n   ${it.dosage}${it.notes ? `\n   Poznámka: ${it.notes}` : ''}`).join('\n\n')}\n\nČiarový kód e-receptu: ${barcodeNumber}`
    };

    // Uloženie do localStorage
    try {
      const stored = localStorage.getItem('say_clinic_patient_records');
      const recordsMap = stored ? JSON.parse(stored) : {};
      
      // Pokúsime sa nájsť pacienta podľa rodného čísla alebo mena
      const patientKey = birthNumber.trim() || patientName.trim();
      const existing = recordsMap[patientKey] || [];
      recordsMap[patientKey] = [prescriptionRecord, ...existing];
      localStorage.setItem('say_clinic_patient_records', JSON.stringify(recordsMap));

      // Tiež uložíme do zoznamu vystavených receptov
      const allPrescriptionsStr = localStorage.getItem('say_clinic_prescriptions');
      const allPrescriptions = allPrescriptionsStr ? JSON.parse(allPrescriptionsStr) : [];
      allPrescriptions.unshift({
        ...prescriptionRecord,
        patientName,
        birthNumber,
        items
      });
      localStorage.setItem('say_clinic_prescriptions', JSON.stringify(allPrescriptions));

      if (onPrescriptionSaved) {
        onPrescriptionSaved(prescriptionRecord);
      }

      setSaveSuccessMsg(`Recept úspešne uložený do karty pacienta ${patientName}`);
      setTimeout(() => setSaveSuccessMsg(null), 3500);
    } catch (e) {
      console.error('Chyba pri ukladaní receptu:', e);
      alert('Nepodarilo sa uložiť recept do karty pacienta.');
    }
  };

  // Filtrované lieky z katalógu
  const filteredCatalog = MEDICATION_CATALOG.filter(med => {
    const matchesCategory = catalogFilter === 'all' || med.category === catalogFilter;
    const matchesSearch = !catalogSearch || 
      med.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      (med.activeSubstance && med.activeSubstance.toLowerCase().includes(catalogSearch.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <style type="text/css" media="print">
        {`
          @page {
            size: 105mm 148mm;
            margin: 0;
          }
          body * {
            visibility: hidden;
          }
          #printable-a6-prescription, #printable-a6-prescription * {
            visibility: visible;
          }
          #printable-a6-prescription {
            position: fixed;
            left: 0;
            top: 0;
            width: 105mm !important;
            height: 148mm !important;
            max-width: 105mm !important;
            max-height: 148mm !important;
            margin: 0 !important;
            padding: 5mm !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        `}
      </style>

      {/* HLAVNÁ INFORMAČNÁ LIŠTA */}
      <div className="bg-white border border-[#E8E2D9] rounded-2xl p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#047857]/10 text-[#047857] text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md border border-[#047857]/20">
              Preskripčný modul MZ SR
            </span>
            <span className="bg-[#C5A059]/10 text-[#C5A059] text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md">
              Formát A6 (105 × 148 mm)
            </span>
          </div>
          <h2 className="font-brand text-xl font-bold uppercase text-[#2C2A29] mt-1.5">
            Lekársky Recept & Preskripcia Liekov
          </h2>
          <p className="text-xs text-[#8C857B]">
            Generovanie a tlač oficiálneho lekárskeho receptu s kódmi lekára, PZS, diagnózou a e-recept čiarovým kódom.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={handleSaveToPatientFolder}
            className="flex-1 md:flex-initial bg-[#2C2A29] hover:bg-black text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Uložiť do karty</span>
          </button>
          
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={generatingPdf}
            className="flex-1 md:flex-initial bg-[#C5A059] hover:bg-[#b08d48] text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {generatingPdf ? 'Generujem A6...' : '📄 Stiahnuť PDF (A6)'}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 md:flex-initial bg-[#047857] hover:bg-[#065f46] text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            🖨️ Tlačiť A6
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* DVOJSTĹPCOVÝ LAYOUT: FORMULÁR VĽAVO, ŽIVÝ NÁHĽAD A6 VPRAVO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ======================================================= */}
        {/* ĽAVÁ ČASŤ - FORMULÁR A VÝBER LIEKOV                     */}
        {/* ======================================================= */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* 1. POSKYTOVATEĽ & LEKÁR */}
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-2">
              <span className="text-[10px] uppercase font-bold text-[#C5A059] tracking-wider">
                1. Poskytovateľ & Predpisujúci lekár
              </span>
              <span className="text-[9px] text-[#8C857B] font-mono">PZS: {pzsCode}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Ošetrujúci lekár</label>
                <select
                  value={doctorName}
                  onChange={e => handleDoctorChange(e.target.value)}
                  className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6] text-[#2C2A29] font-medium"
                >
                  <option value={CLINIC_PRESCRIPTION_DEFAULTS.doctorName}>MUDr. Ján Mráz (Plastická chirurgia)</option>
                  <option value={CLINIC_PRESCRIPTION_DEFAULTS.doctor2Name}>MUDr. Zuzana Sroková, MPH (Dermatovenerológia)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Lekársky kód (ÚDZS)</label>
                <input
                  type="text"
                  value={doctorCode}
                  onChange={e => setDoctorCode(e.target.value)}
                  placeholder="A86342871"
                  className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white font-mono text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Kód PZS pracoviska</label>
                <input
                  type="text"
                  value={pzsCode}
                  onChange={e => setPzsCode(e.target.value)}
                  placeholder="P70234011201"
                  className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Odbornosť (Útvar)</label>
                <select
                  value={departmentCode}
                  onChange={e => setDepartmentCode(e.target.value)}
                  className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white text-xs"
                >
                  <option value="063 - Plastická chirurgia">063 - Plastická chirurgia</option>
                  <option value="008 - Dermatovenerológia">008 - Dermatovenerológia</option>
                  <option value="064 - Estetická medicína">064 - Estetická medicína</option>
                  <option value="001 - Všeobecné lekárstvo">001 - Všeobecné lekárstvo</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. PACIENT, POISŤOVŇA A DIAGNÓZA */}
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4 shadow-xs space-y-3">
            <span className="text-[10px] uppercase font-bold text-[#C5A059] tracking-wider block border-b border-[#E8E2D9] pb-2">
              2. Údaje pacienta & Zdravotná poisťovňa
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Meno a priezvisko poistenca / klienta</label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={e => setPatientName(e.target.value)}
                  placeholder="napr. Mária Kováčová"
                  className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white font-bold text-sm text-[#2C2A29]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Rodné číslo / Dátum narodenia</label>
                <input
                  type="text"
                  value={birthNumber}
                  onChange={e => setBirthNumber(e.target.value)}
                  placeholder="885512/6789"
                  className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white font-mono text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Zdravotná poisťovňa (Kód ZP)</label>
                <select
                  value={insuranceCode}
                  onChange={e => setInsuranceCode(e.target.value)}
                  className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white text-xs font-semibold text-[#2C2A29]"
                >
                  <option value="24 (Dôvera)">24 - Dôvera zdravotná poisťovňa</option>
                  <option value="25 (VšZP)">25 - Všeobecná zdravotná poisťovňa (VšZP)</option>
                  <option value="27 (Union)">27 - Union zdravotná poisťovňa</option>
                  <option value="Samoplatca">Samoplatca / Cudzinec (Bez ZP v SR)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Trvalé bydlisko (Ulica, PSČ, Mesto)</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Muškátová 12, 974 01 Banská Bystrica"
                  className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Diagnóza (MKCH-10 kód)</label>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={diagnosis}
                    onChange={e => setDiagnosis(e.target.value)}
                    placeholder="Z41.1 - Estetická chirurgická úprava"
                    className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white text-xs font-semibold"
                  />
                  {/* Rýchle diagnózy */}
                  <div className="flex flex-wrap gap-1 text-[9px]">
                    {[
                      { code: 'Z41.1', label: 'Z41.1 Estetika' },
                      { code: 'T81.4', label: 'T81.4 Infekcia po výkone' },
                      { code: 'M65.3', label: 'M65.3 Skákavý prst' },
                      { code: 'G56.0', label: 'G56.0 Karpálny tunel' },
                      { code: 'M72.0', label: 'M72.0 Dupuytren' },
                      { code: 'L70.0', label: 'L70.0 Akné' },
                      { code: 'L91.0', label: 'L91.0 Hypertrofická jazva' }
                    ].map(diag => (
                      <button
                        key={diag.code}
                        type="button"
                        onClick={() => setDiagnosis(`${diag.code} - ${diag.label.replace(diag.code, '').trim()}`)}
                        className="bg-[#FBF9F6] hover:bg-[#E8E2D9] border border-[#E8E2D9] px-2 py-0.5 rounded text-[#2C2A29] transition-colors cursor-pointer"
                      >
                        {diag.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. PARAMETRE RECEPTU & ÚHRADA */}
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4 shadow-xs space-y-3">
            <span className="text-[10px] uppercase font-bold text-[#C5A059] tracking-wider block border-b border-[#E8E2D9] pb-2">
              3. Platnosť, Spôsob úhrady & Opakovateľnosť
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Dátum vystavenia</label>
                <input
                  type="date"
                  value={prescriptionDate}
                  onChange={e => setPrescriptionDate(e.target.value)}
                  className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Platnosť receptu</label>
                <select
                  value={validityDays}
                  onChange={e => setValidityDays(parseInt(e.target.value))}
                  className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white text-xs font-medium"
                >
                  <option value={7}>7 dní (Štandardný recept)</option>
                  <option value={3}>3 dni (Antibiotiká - ATB)</option>
                  <option value={5}>5 dní (Pohotovosť / APS)</option>
                  <option value={14}>14 dní (Omamné / Psychotropné)</option>
                  <option value={30}>30 dní (1 mesiac)</option>
                  <option value={90}>90 dní (3 mesiace)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Spôsob úhrady</label>
                <select
                  value={paymentCategory}
                  onChange={e => setPaymentCategory(e.target.value as any)}
                  className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white text-xs font-bold text-[#2C2A29]"
                >
                  <option value="Hradí pacient">Hradí pacient (Samoplatca)</option>
                  <option value="Hradí ZP">Hradí zdravotná poisťovňa</option>
                  <option value="Čiastočne ZP">Čiastočná úhrada ZP</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Opakovateľný recept (Repetatur)</label>
                <div className="flex gap-2">
                  {(['Ne repetatur', 'Repetatur 1x', 'Repetatur 2x'] as const).map(rep => (
                    <button
                      key={rep}
                      type="button"
                      onClick={() => setRepeatable(rep)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        repeatable === rep 
                          ? 'bg-[#2C2A29] text-white border-[#2C2A29]' 
                          : 'bg-[#FBF9F6] text-[#8C857B] border-[#E8E2D9] hover:text-[#2C2A29]'
                      }`}
                    >
                      {rep}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">E-Recept kód</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={barcodeNumber}
                    onChange={e => setBarcodeNumber(e.target.value)}
                    className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white font-mono text-[11px] font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const num1 = Math.floor(1000 + Math.random() * 9000);
                      const num2 = Math.floor(1000 + Math.random() * 9000);
                      const num3 = Math.floor(1000 + Math.random() * 9000);
                      const num4 = Math.floor(1000 + Math.random() * 9000);
                      setBarcodeNumber(`${num1} ${num2} ${num3} ${num4}`);
                    }}
                    title="Vygenerovať nový kód"
                    className="p-2 border border-[#E8E2D9] rounded-lg bg-[#FBF9F6] hover:bg-[#E8E2D9] text-xs cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#8C857B]" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 4. ZOZNAM PREDPÍSANÝCH LIEKOV NA RECEPTE */}
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#C5A059] tracking-wider">
                  4. Predpísané lieky (Rp. položky na recepte)
                </span>
                <span className="text-[9px] text-[#8C857B] block">Max. 2 lieky na 1 tlačivo A6</span>
              </div>

              {items.length < 2 && (
                <button
                  type="button"
                  onClick={handleAddEmptyItem}
                  className="inline-flex items-center gap-1 bg-[#C5A059]/10 text-[#C5A059] hover:bg-[#C5A059]/20 border border-[#C5A059]/30 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Pridať Rp. 2</span>
                </button>
              )}
            </div>

            {/* Položky receptu */}
            {items.map((item, index) => (
              <div key={item.id || index} className="border-2 border-[#E8E2D9] rounded-xl p-3.5 bg-[#FBF9F6] space-y-3 relative">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#2C2A29] text-white flex items-center justify-center text-xs font-bold font-serif">
                      Rp.{index + 1}
                    </span>
                    <span className="text-xs font-bold text-[#2C2A29]">
                      Liek č. {index + 1}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Odstrániť tento liek"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-0.5">
                      Názov lieku, lieková forma, sila a veľkosť balenia
                    </label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={e => handleUpdateItemField(index, 'name', e.target.value)}
                      placeholder="napr. Augmentin 1 g tbl flm 14x1g"
                      className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white font-bold text-xs text-[#2C2A29]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-0.5">
                        Počet balení (Exp. orig. No.)
                      </label>
                      <input
                        type="text"
                        value={item.packaging}
                        onChange={e => handleUpdateItemField(index, 'packaging', e.target.value)}
                        placeholder="Exp. orig. No. I (unam)"
                        className="w-full border border-[#E8E2D9] p-1.5 rounded-lg bg-white text-xs font-serif"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-0.5">
                        Úhrada lieku
                      </label>
                      <select
                        value={item.paymentType || paymentCategory}
                        onChange={e => handleUpdateItemField(index, 'paymentType', e.target.value)}
                        className="w-full border border-[#E8E2D9] p-1.5 rounded-lg bg-white text-xs"
                      >
                        <option value="Hradí pacient">Hradí pacient</option>
                        <option value="Hradí ZP">Hradí ZP</option>
                        <option value="Čiastočne ZP">Čiastočne ZP</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-0.5">
                      Dávkovanie a spôsob užívania (D.S. - Da Signa)
                    </label>
                    <input
                      type="text"
                      value={item.dosage}
                      onChange={e => handleUpdateItemField(index, 'dosage', e.target.value)}
                      placeholder="D.S. 1 tableta každých 12 hodín po jedle"
                      className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white text-xs font-medium text-[#2C2A29]"
                    />
                  </div>
                </div>
              </div>
            ))}

            {items.length === 0 && (
              <div className="text-center py-6 border-2 border-dashed border-[#E8E2D9] rounded-xl text-xs text-[#8C857B]">
                <p>Zatiaľ nie je pridaný žiadny liek.</p>
                <button
                  type="button"
                  onClick={handleAddEmptyItem}
                  className="mt-2 text-[#C5A059] font-bold hover:underline cursor-pointer"
                >
                  + Pridať prvý liek (Rp. 1)
                </button>
              </div>
            )}
          </div>

          {/* 5. RÝCHLY KATALÓG LIEKOV (1-CLICK INSERT) */}
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-2">
              <span className="text-[10px] uppercase font-bold text-[#C5A059] tracking-wider">
                5. Rýchly výber liekov z databázy kliniky
              </span>
              <span className="text-[9px] text-[#8C857B]">Kliknutím pridáte do receptu</span>
            </div>

            {/* Kategórie */}
            <div className="flex flex-wrap gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setCatalogFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                  catalogFilter === 'all'
                    ? 'bg-[#2C2A29] text-white'
                    : 'bg-[#FBF9F6] text-[#8C857B] hover:text-[#2C2A29]'
                }`}
              >
                Všetky ({MEDICATION_CATALOG.length})
              </button>
              {Object.entries(CATEGORY_LABELS).map(([catKey, cat]) => (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => setCatalogFilter(catKey)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    catalogFilter === catKey
                      ? 'bg-[#C5A059] text-white'
                      : 'bg-[#FBF9F6] text-[#8C857B] hover:text-[#2C2A29]'
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>

            {/* Vyhľadávacie pole */}
            <input
              type="text"
              value={catalogSearch}
              onChange={e => setCatalogSearch(e.target.value)}
              placeholder="Hľadať liek podľa názvu alebo účinnej látky (Augmentin, Aulin, Clexane...)..."
              className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-[#FBF9F6] outline-none focus:border-[#C5A059]"
            />

            {/* Zoznam liekov */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
              {filteredCatalog.map(med => (
                <div
                  key={med.id}
                  className="border border-[#E8E2D9] hover:border-[#C5A059] p-2.5 rounded-xl bg-[#FBF9F6] hover:bg-white transition-all flex flex-col justify-between text-xs group"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-[#2C2A29] text-[11px] group-hover:text-[#C5A059] transition-colors">
                        {med.name}
                      </p>
                      <span className="text-[9px] font-mono text-[#8C857B] bg-white px-1.5 py-0.5 rounded border border-[#E8E2D9]">
                        {med.packaging}
                      </span>
                    </div>
                    {med.activeSubstance && (
                      <p className="text-[9px] text-[#8C857B] italic mt-0.5">{med.activeSubstance}</p>
                    )}
                    <p className="text-[10px] text-[#2C2A29] mt-1 font-serif line-clamp-1">{med.dosage}</p>
                  </div>

                  <div className="mt-2 pt-2 border-t border-[#E8E2D9]/60 flex items-center justify-between">
                    <span className="text-[9px] text-[#047857] font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                      {med.paymentType || 'Hradí pacient'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddFromCatalog(med)}
                      className="bg-[#2C2A29] hover:bg-[#C5A059] text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded transition-colors cursor-pointer"
                    >
                      + Pridať Rp.
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ======================================================= */}
        {/* PRAVÁ ČASŤ - ŽIVÝ AUTENTICKÝ NÁHĽAD A6 RECEPTU (105x148)  */}
        {/* ======================================================= */}
        <div className="lg:col-span-6 flex flex-col items-center">
          
          <div className="w-full flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#8C857B] uppercase tracking-widest">
                Tlačový náhľad receptu (DIN A6)
              </span>
              <span className="text-[9px] bg-[#047857]/10 text-[#047857] font-bold px-2 py-0.5 rounded">
                Vzor MZ SR
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={generatingPdf}
                className="bg-[#C5A059] hover:bg-[#b08d48] text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
              >
                <span>📄</span> PDF
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="bg-[#2C2A29] hover:bg-black text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
              >
                <span>🖨️</span> Tlačiť A6
              </button>
            </div>
          </div>

          {/* DOKUMENT: OFICIÁLNY LEKÁRSKY RECEPT A6 (105mm x 148mm) */}
          <div 
            id="printable-a6-prescription"
            ref={printRef}
            className="bg-[#FFFFFF] border-2 border-[#2C2A29] rounded-lg shadow-lg text-[#2C2A29] p-4 flex flex-col justify-between relative select-text"
            style={{
              width: '100%',
              maxWidth: '410px',
              minHeight: '580px',
              fontFamily: '"Times New Roman", Times, serif',
              boxSizing: 'border-box'
            }}
          >
            
            {/* HORNÝ RÁMČEK: POSKYTOVATEĽ, PZS, LEKÁR, KÓDY */}
            <div className="border-b-2 border-[#2C2A29] pb-2">
              <div className="flex justify-between items-start gap-2">
                
                {/* ĽAVÁ HLAVIČKA: KLINIKA */}
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <img 
                      src="/logo.png" 
                      alt="SAY" 
                      className="h-7 w-auto object-contain" 
                    />
                    <div>
                      <p className="font-sans font-bold text-[10px] tracking-wider text-[#2C2A29] uppercase leading-none">
                        SAY CLINIC s.r.o.
                      </p>
                      <p className="font-sans text-[8px] text-[#8C857B] leading-tight mt-0.5">
                        Lazovná 43, 974 01 Banská Bystrica
                      </p>
                    </div>
                  </div>
                  <p className="font-sans text-[8px] text-[#2C2A29] mt-1 font-semibold">
                    Plastická chirurgia & Estetická medicína
                  </p>
                </div>

                {/* PRAVÁ TABUĽKA: KÓDY LEKÁRA A PZS */}
                <div className="border border-[#2C2A29] text-[8px] font-sans">
                  <div className="bg-[#F4EFEA] px-1.5 py-0.5 border-b border-[#2C2A29] font-bold text-center uppercase tracking-wider text-[7.5px]">
                    Kód lekára / PZS
                  </div>
                  <div className="px-1.5 py-0.5 font-mono text-center font-bold text-[8.5px]">
                    {doctorCode}
                  </div>
                  <div className="px-1.5 py-0.5 border-t border-[#2C2A29] font-mono text-center text-[7.5px]">
                    PZS: {pzsCode}
                  </div>
                </div>

              </div>

              {/* DÁTUM A ODBORNOSŤ */}
              <div className="flex justify-between items-center mt-1.5 pt-1 border-t border-dashed border-[#8C857B]/50 font-sans text-[8px]">
                <div>
                  <span className="text-[#8C857B]">Odbornosť:</span> <strong className="text-[#2C2A29]">{departmentCode.split('-')[0].trim()}</strong>
                </div>
                <div>
                  <span className="text-[#8C857B]">Dátum:</span> <strong className="text-[#2C2A29]">{formatSlovakDate(prescriptionDate)}</strong>
                </div>
              </div>
            </div>

            {/* SEKCIA: IDENTIFIKÁCIA POISTENCA / PACIENTA */}
            <div className="border-b border-[#2C2A29] py-2 font-sans space-y-1">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <span className="text-[7.5px] uppercase font-bold text-[#8C857B]">Meno a priezvisko poistenca:</span>
                  <p className="font-bold text-[12px] text-[#2C2A29] uppercase tracking-wide">
                    {patientName || '---'}
                  </p>
                </div>

                {/* ZP KÓD BOX */}
                <div className="border border-[#2C2A29] px-2 py-0.5 text-center bg-[#FAF8F5] min-w-[50px]">
                  <span className="block text-[6.5px] uppercase font-bold text-[#8C857B]">Kód ZP</span>
                  <span className="font-mono font-bold text-[10px] text-[#2C2A29]">
                    {insuranceCode.includes('24') ? '24' : insuranceCode.includes('25') ? '25' : insuranceCode.includes('27') ? '27' : 'SAMO'}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center text-[8.5px] gap-2 pt-0.5">
                <div>
                  <span className="text-[#8C857B]">Rodné číslo:</span> <strong className="font-mono text-[9px]">{birthNumber || '---'}</strong>
                </div>
                <div className="text-right">
                  <span className="text-[#8C857B]">Diagnóza:</span> <strong className="font-mono text-[9.5px] bg-[#2C2A29] text-white px-1 py-0.2 rounded">{diagnosis.split('-')[0].trim()}</strong>
                </div>
              </div>

              <div className="text-[8px] text-[#2C2A29]">
                <span className="text-[#8C857B]">Bydlisko:</span> {address || '---'}
              </div>
            </div>

            {/* STREDNÁ HLAVNÁ SEKCIA: PRESKRIPCIA (Rp. - RECIPE) */}
            <div className="flex-1 py-2 space-y-3 min-h-[220px]">
              
              {items.map((item, idx) => (
                <div key={item.id || idx} className="space-y-0.5 font-serif">
                  
                  {/* Rp. RIADOK */}
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-bold font-serif italic text-[#2C2A29]">
                      Rp.
                    </span>
                    <span className="text-[12px] font-bold text-[#2C2A29] leading-tight">
                      {item.name || '---'}
                    </span>
                  </div>

                  {/* Exp. orig. No. */}
                  <div className="pl-6 text-[10px] font-serif font-bold text-[#2C2A29]">
                    {item.packaging || 'Exp. orig. No. I (unam)'}
                  </div>

                  {/* D.S. Signatúra */}
                  <div className="pl-6 text-[10px] font-sans text-[#2C2A29] italic leading-tight">
                    {item.dosage || 'D.S. Podľa ordinácie lekára'}
                  </div>

                  {/* Poznámka (ak je) */}
                  {item.notes && (
                    <div className="pl-6 text-[8px] font-sans text-[#8C857B]">
                      Pozn.: {item.notes}
                    </div>
                  )}

                  {idx === 0 && items.length > 1 && (
                    <div className="border-b border-dashed border-[#8C857B]/40 my-2"></div>
                  )}
                </div>
              ))}

              {items.length === 0 && (
                <div className="text-center py-10 text-xs text-[#8C857B] italic font-sans">
                  Nevyplnené žiadne lieky na recepte
                </div>
              )}

            </div>

            {/* SPODNÁ ČASŤ: PEČIATKA HRADÍ PACIENT, PLATNOSŤ, E-RECEPT A PODPIS */}
            <div className="border-t-2 border-[#2C2A29] pt-2 space-y-2">
              
              <div className="flex justify-between items-center font-sans text-[8px]">
                
                {/* ĽAVÁ DOLOŽKA O ÚHRADE A PLATNOSTI */}
                <div className="space-y-1">
                  {/* Pečiatka HRADÍ PACIENT */}
                  {paymentCategory === 'Hradí pacient' ? (
                    <div className="inline-block border-2 border-[#991B1B] text-[#991B1B] font-bold text-[8.5px] uppercase tracking-wider px-2 py-0.5 rounded rotate-[-2deg]">
                      HRADÍ PACIENT
                    </div>
                  ) : paymentCategory === 'Hradí ZP' ? (
                    <div className="inline-block border border-[#047857] text-[#047857] font-bold text-[8.5px] uppercase tracking-wider px-2 py-0.5 rounded">
                      HRADÍ ZP
                    </div>
                  ) : (
                    <div className="inline-block border border-[#C5A059] text-[#C5A059] font-bold text-[8.5px] uppercase tracking-wider px-2 py-0.5 rounded">
                      ČIASTOČNE ZP
                    </div>
                  )}

                  <div className="text-[7.5px] text-[#8C857B] pt-0.5">
                    <p>Platnosť: <strong>{validityDays} dní</strong></p>
                    <p>Režim: <strong>{repeatable}</strong></p>
                  </div>
                </div>

                {/* PRAVÝ BOX: PEČIATKA A PODPIS LEKÁRA */}
                <div className="border border-[#2C2A29] p-2 text-center rounded min-w-[130px] bg-[#FAF8F5]">
                  <div className="h-8 flex flex-col justify-center items-center">
                    <span className="text-[9px] font-bold text-[#2C2A29]">{doctorName}</span>
                    <span className="text-[7px] text-[#8C857B] font-mono">{doctorCode}</span>
                  </div>
                  <div className="border-t border-dashed border-[#2C2A29] pt-0.5 text-[6.5px] uppercase font-bold text-[#8C857B]">
                    Odtlačok pečiatky a podpis lekára
                  </div>
                </div>

              </div>

              {/* ČIAROVÝ KÓD E-RECEPTU */}
              <div className="border-t border-[#E8E2D9] pt-1.5 flex flex-col items-center">
                {/* Simulácia čiarového kódu */}
                <div className="flex items-center justify-center gap-[1.5px] h-6 w-full max-w-[220px]">
                  {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 4, 2, 3, 1, 2, 4, 1, 3].map((w, i) => (
                    <div
                      key={i}
                      className="bg-[#2C2A29] h-full"
                      style={{ width: `${w}px` }}
                    />
                  ))}
                </div>
                <div className="text-[7px] font-mono font-bold tracking-widest text-[#2C2A29] mt-0.5">
                  e-Recept: {barcodeNumber}
                </div>
              </div>

              {/* Päta mikrotext */}
              <div className="text-center text-[6px] text-[#8C857B] font-sans">
                SAY CLINIC Banská Bystrica • Tlačivo receptu podľa vyhlášky MZ SR • www.sayclinic.sk
              </div>

            </div>

          </div>

          <div className="mt-3 text-center text-xs text-[#8C857B]">
            <p>💡 <em>Tip: Pri tlači zvoľte formát papiera <strong>A6</strong> v nastaveniach tlačiarne pre presný rozmer 105 × 148 mm.</em></p>
          </div>

        </div>

      </div>

    </div>
  );
}
