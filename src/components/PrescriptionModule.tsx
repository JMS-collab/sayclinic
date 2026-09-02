'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  PrescribedMedication, 
  MEDICATION_CATALOG, 
  CATEGORY_LABELS, 
  CLINIC_PRESCRIPTION_DEFAULTS 
} from '../data/prescriptionCatalog';
import { exportElementToPdf, generatePdfFilename } from '../lib/pdfGenerator';
import { Plus, Trash2, Check } from './Icons';

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

  
  // Pacient
  const [patientName, setPatientName] = useState(initialPatient?.name || '');
  const [birthNumber, setBirthNumber] = useState(initialPatient?.birthNumber || '');
  const [address, setAddress] = useState(initialPatient?.address || 'Lazovná 43, 974 01 Banská Bystrica');
  const [insuranceCode, setInsuranceCode] = useState(initialPatient?.insurance || '24');
  const [diagnosisCode, setDiagnosisCode] = useState('Z411'); // 4-znakové MKCH bez bodky pre okienka

  // Parametre receptu
  const [prescriptionDate, setPrescriptionDate] = useState(() => {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    return `${d}.${m}.${y}`;
  });
  const [prescriptionOrderNumber, setPrescriptionOrderNumber] = useState('');

  // Režim tlače: 'preprinted' (tlač IBA textov do zakúpeného tlačiva ŠEVT) alebo 'full' (tlač celého tlačiva vrátane mriežok)
  const [printMode, setPrintMode] = useState<'preprinted' | 'full'>('preprinted');
  // Náhľad na obrazovke: 'full_preview' (vidieť mriežku aj texty) alebo 'text_only' (iba čistý text)
  const [previewView, setPreviewView] = useState<'full_preview' | 'text_only'>('full_preview');

  // Kalibrácia posunu tlače (v milimetroch)
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);
  const [showCalibration, setShowCalibration] = useState<boolean>(false);

  // Lieky na recepte (1 až 2 lieky na jedno A6 tlačivo ŠEVT 14 282 2s)
  const [items, setItems] = useState<PrescribedMedication[]>([
    {
      id: 'item-1',
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
      id: 'item-2',
      latinName: 'Nimesulidum por gra sus 100 mg',
      commercialName: 'Aulin 100 mg (30 vreciek)',
      activeSubstance: 'Nimesulid',
      suklCode: '016947',
      packaging: 'Exp. orig. No. I (unam)',
      dosage: 'D.S. 1 vrecko 2x denne po jedle pri bolesti',
      category: 'analgetik',
      paymentType: 'Hradí pacient',
      notes: 'Rozpustiť v pol pohári vody'
    }
  ]);

  // Vyhľadávanie v katalógu a filter
  const [catalogFilter, setCatalogFilter] = useState<string>('all');
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  // Načítanie kalibrácie z localStorage
  useEffect(() => {
    try {
      const savedX = localStorage.getItem('say_clinic_rx_offset_x');
      const savedY = localStorage.getItem('say_clinic_rx_offset_y');
      const savedMode = localStorage.getItem('say_clinic_rx_print_mode');
      if (savedX !== null) setOffsetX(parseFloat(savedX) || 0);
      if (savedY !== null) setOffsetY(parseFloat(savedY) || 0);
      if (savedMode === 'full' || savedMode === 'preprinted') setPrintMode(savedMode);
    } catch {
      // ignore
    }
  }, []);

  // Aktualizácia údajov pri zmene initialPatient
  useEffect(() => {
    if (initialPatient) {
      if (initialPatient.name) setPatientName(initialPatient.name);
      if (initialPatient.birthNumber) setBirthNumber(initialPatient.birthNumber);
      if (initialPatient.address) setAddress(initialPatient.address);
      if (initialPatient.insurance) {
        const cleanIns = initialPatient.insurance.replace(/\D/g, '').slice(0, 2);
        setInsuranceCode(cleanIns || '24');
      }
    }
  }, [initialPatient]);

  // Prepnutie lekára
  const handleDoctorChange = (name: string) => {
    setDoctorName(name);
    if (name.includes('Sroková')) {
      setDoctorCode(CLINIC_PRESCRIPTION_DEFAULTS.doctor2Code);
    } else if (name.includes('Mráz')) {
      setDoctorCode(CLINIC_PRESCRIPTION_DEFAULTS.doctorCode);
    }
  };

  // Uloženie offsetu
  const handleSaveOffset = (x: number, y: number) => {
    setOffsetX(x);
    setOffsetY(y);
    try {
      localStorage.setItem('say_clinic_rx_offset_x', x.toString());
      localStorage.setItem('say_clinic_rx_offset_y', y.toString());
    } catch {
      // ignore
    }
  };

  const handlePrintModeChange = (mode: 'preprinted' | 'full') => {
    setPrintMode(mode);
    try {
      localStorage.setItem('say_clinic_rx_print_mode', mode);
    } catch {
      // ignore
    }
  };

  // Pridanie lieku z katalógu - automaticky nastaví latinský názov (INN)
  const handleAddFromCatalog = (med: PrescribedMedication) => {
    if (items.length >= 2) {
      alert('Tlačivo lekárskeho receptu ŠEVT 14 282 2s (A6) pojme maximálne 2 lieky. Odstráňte jeden liek alebo ho nahraďte.');
      return;
    }
    const newItem: PrescribedMedication = {
      ...med,
      id: `item-${items.length + 1}-${med.suklCode || 'rx'}`
    };
    setItems([...items, newItem]);
  };

  // Úprava poľa položky
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

  // Pridanie vlastného prázdneho lieku
  const handleAddEmptyItem = () => {
    if (items.length >= 2) {
      alert('Tlačivo receptu A6 obsahuje maximálne 2 lieky.');
      return;
    }
    setItems([
      ...items,
      {
        id: `item-${Date.now()}`,
        latinName: '',
        commercialName: 'Vlastný liek / Magistraliter',
        suklCode: '',
        packaging: 'Exp. orig. No. I (unam)',
        dosage: 'D.S. ',
        category: 'other',
        paymentType: 'Hradí pacient'
      }
    ]);
  };

  // Helper pre rozbitie kódu na jednotlivé znaky do okienok
  const getBoxChars = (val: string, boxCount: number) => {
    const clean = (val || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const result: string[] = [];
    for (let i = 0; i < boxCount; i++) {
      result.push(clean[i] || '');
    }
    return result;
  };

  // Spustenie tlače
  const handlePrint = () => {
    if (onPrintRequested) {
      onPrintRequested();
    } else {
      window.print();
    }
  };

  // Export do PDF
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

  // Uloženie receptu do karty pacienta
  const handleSaveToPatientFolder = () => {
    if (!patientName.trim()) {
      alert('Prosím, zadajte meno pacienta.');
      return;
    }

    const prescriptionRecord = {
      id: `rx-${Date.now()}`,
      type: 'Lekársky recept (A6)',
      typeColor: 'bg-[#047857]',
      title: `Recept: ${items.map(i => i.latinName || i.commercialName).filter(Boolean).join(', ') || 'Predpis liekov'}`,
      doctor: doctorName,
      diagnosis: diagnosisCode,
      date: prescriptionDate,
      content: `LEKÁRSKY PREDPIS (ŠEVT 14 282 2s - A6) - SAY CLINIC\n\nPoskytovateľ: ${CLINIC_PRESCRIPTION_DEFAULTS.clinicName}\nPZS: ${pzsCode} | Lekár: ${doctorName} (${doctorCode})\nPoistenec: ${patientName} (RČ: ${birthNumber})\nBydlisko: ${address}\nPoisťovňa: ${insuranceCode}\nDiagnóza: ${diagnosisCode}\nDátum: ${prescriptionDate}\n\nPREDPÍSANÉ LIEČIVÁ (Rp. - LATINSKÁ ÚČINNÁ LÁTKA):\n${items.map((it, idx) => `Rp. ${idx + 1}:\n   ${it.latinName}\n   ${it.packaging}\n   ${it.dosage}${it.commercialName ? `\n   (Orientačne: ${it.commercialName})` : ''}${it.suklCode ? `\n   Kód ŠÚKL: ${it.suklCode}` : ''}`).join('\n\n')}`
    };

    try {
      const stored = localStorage.getItem('say_clinic_patient_records');
      const recordsMap = stored ? JSON.parse(stored) : {};
      const patientKey = birthNumber.trim() || patientName.trim();
      const existing = recordsMap[patientKey] || [];
      recordsMap[patientKey] = [prescriptionRecord, ...existing];
      localStorage.setItem('say_clinic_patient_records', JSON.stringify(recordsMap));

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
      med.latinName.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      med.commercialName.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      (med.activeSubstance && med.activeSubstance.toLowerCase().includes(catalogSearch.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Rozbité znaky pre okienka
  const insBoxes = getBoxChars(insuranceCode, 4);
  const dgBoxes1 = getBoxChars(diagnosisCode, 4);
  const suklBoxes1 = getBoxChars(items[0]?.suklCode || '', 8);
  const dgBoxes2 = getBoxChars(diagnosisCode, 4);
  const suklBoxes2 = getBoxChars(items[1]?.suklCode || '', 8);

  return (
    <div className="space-y-6">
      
      {/* OZNÁMENIE O ÚSPEŠNOM ULOŽENÍ */}
      {saveSuccessMsg && (
        <div className="bg-[#047857] text-white px-4 py-3 rounded-xl flex items-center justify-between shadow-md animate-fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-white" />
            <span className="text-sm font-semibold">{saveSuccessMsg}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setSaveSuccessMsg(null)}
            className="text-white/80 hover:text-white text-xs font-bold uppercase tracking-wider"
          >
            Zavrieť
          </button>
        </div>
      )}

      {/* TLAČOVÝ ŠTÝL PRE A6 FORMÁT (105mm x 148mm) S MOŽNOSŤOU PREPRINTED (IBA TEXT) */}
      <style jsx global>{`
        @page {
          size: 105mm 148mm;
          margin: 0mm;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          #sevt-a6-prescription-document,
          #sevt-a6-prescription-document * {
            visibility: visible;
          }
          #sevt-a6-prescription-document {
            position: absolute !important;
            left: ${offsetX}mm !important;
            top: ${offsetY}mm !important;
            width: 105mm !important;
            height: 148mm !important;
            margin: 0 !important;
            padding: 4mm 5mm 3mm 5mm !important;
            box-shadow: none !important;
            border: none !important;
            background: transparent !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          /* V REŽIME TLAČE DO ZAKÚPENÉHO TLAČIVA SKRYJEME RÁMČEKY A PREDRYTÉ NÁPISY */
          ${printMode === 'preprinted' ? `
            .sevt-border {
              border-color: transparent !important;
            }
            .sevt-preprinted-text {
              color: transparent !important;
              opacity: 0 !important;
              visibility: hidden !important;
            }
            .sevt-bg {
              background-color: transparent !important;
            }
            .sevt-dynamic-value {
              color: #000000 !important;
              visibility: visible !important;
              font-weight: bold !important;
            }
          ` : `
            .sevt-border {
              border-color: #000000 !important;
            }
            .sevt-preprinted-text {
              color: #000000 !important;
            }
            .sevt-dynamic-value {
              color: #000000 !important;
            }
          `}
        }
      `}</style>

      {/* HORNÝ OVLÁDACÍ PANEL PRE VOĽBU REŽIMU TLAČE A KALIBRÁCIU */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8E2D9] shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">💊</span>
            <h3 className="font-brand text-base font-bold text-[#2C2A29] uppercase">
              Lekársky recept ŠEVT 14 282 2s (A6)
            </h3>
            <span className="bg-[#047857]/10 text-[#047857] text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-[#047857]/20">
              Generická preskripcia v latinčine
            </span>
          </div>
          <p className="text-xs text-[#8C857B] mt-0.5">
            Podľa § 119 zákona č. 362/2011 Z. z. o liekoch (latinský názov liečiva INN, lieková forma a sila)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Prepínač režimu tlače */}
          <div className="bg-[#FBF9F6] p-1 rounded-xl border border-[#E8E2D9] flex items-center text-xs">
            <button
              type="button"
              onClick={() => handlePrintModeChange('preprinted')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                printMode === 'preprinted'
                  ? 'bg-[#047857] text-white shadow-xs'
                  : 'text-[#8C857B] hover:text-[#2C2A29]'
              }`}
              title="Tlačí LEN text do okienok zakúpeného predtlačeného tlačiva ŠEVT (bez duplicitných čiar)"
            >
              <span>📄</span>
              <span>Tlač do zakúpeného tlačiva (iba text)</span>
            </button>
            <button
              type="button"
              onClick={() => handlePrintModeChange('full')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                printMode === 'full'
                  ? 'bg-[#2C2A29] text-white shadow-xs'
                  : 'text-[#8C857B] hover:text-[#2C2A29]'
              }`}
              title="Tlačí kompletné tlačivo vrátane všetkých mriežok a textov ŠEVT (na čistý biely papier)"
            >
              <span>🖨️</span>
              <span>Tlač celého tlačiva (vrátane mriežky)</span>
            </button>
          </div>

          {/* Tlačidlo kalibrácie */}
          <button
            type="button"
            onClick={() => setShowCalibration(!showCalibration)}
            className="px-3 py-2 bg-[#FBF9F6] hover:bg-[#E8E2D9] border border-[#E8E2D9] rounded-xl text-xs font-semibold text-[#2C2A29] transition-colors cursor-pointer flex items-center gap-1.5"
            title="Nastavenie posunu tlače v mm pre presné trafenie do okienok vašej tlačiarne"
          >
            <span>🎯</span>
            <span>Kalibrácia tlače {offsetX !== 0 || offsetY !== 0 ? `(${offsetX > 0 ? '+' : ''}${offsetX}mm, ${offsetY > 0 ? '+' : ''}${offsetY}mm)` : ''}</span>
          </button>
        </div>
      </div>

      {/* KALIBRAČNÝ PANEL (AK JE OTVORENÝ) */}
      {showCalibration && (
        <div className="bg-[#FAF8F5] border border-[#C5A059]/40 p-4 rounded-2xl shadow-xs print:hidden animate-fade-in space-y-3">
          <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-2">
            <div className="flex items-center gap-2">
              <span className="text-base">🎯</span>
              <h4 className="text-xs font-bold text-[#2C2A29] uppercase tracking-wider">
                Jemné doladenie pozície tlače pre zakúpené tlačivá ŠEVT (v mm)
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setShowCalibration(false)}
              className="text-xs font-bold text-[#8C857B] hover:text-[#2C2A29]"
            >
              ✕ Zavrieť
            </button>
          </div>

          <p className="text-xs text-[#8C857B]">
            Každá tlačiareň podáva papier A6 s miernou odchýlkou. Ak vám text nesedí presne do okienok ŠEVT tlačiva, upravte posun tu. Nastavenie sa automaticky uloží.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            <div>
              <label className="block text-[11px] font-bold text-[#2C2A29] mb-1">
                Horizontálny posun X (Doľava - / Doprava +): <span className="font-mono text-[#047857]">{offsetX > 0 ? `+${offsetX}` : offsetX} mm</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveOffset(Math.round((offsetX - 0.5) * 10) / 10, offsetY)}
                  className="px-2.5 py-1 bg-white border border-[#E8E2D9] hover:bg-[#E8E2D9] rounded font-bold text-xs"
                >
                  - 0.5mm
                </button>
                <input
                  type="range"
                  min="-15"
                  max="15"
                  step="0.5"
                  value={offsetX}
                  onChange={e => handleSaveOffset(parseFloat(e.target.value), offsetY)}
                  className="flex-1 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => handleSaveOffset(Math.round((offsetX + 0.5) * 10) / 10, offsetY)}
                  className="px-2.5 py-1 bg-white border border-[#E8E2D9] hover:bg-[#E8E2D9] rounded font-bold text-xs"
                >
                  + 0.5mm
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#2C2A29] mb-1">
                Vertikálny posun Y (Hore - / Dole +): <span className="font-mono text-[#047857]">{offsetY > 0 ? `+${offsetY}` : offsetY} mm</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveOffset(offsetX, Math.round((offsetY - 0.5) * 10) / 10)}
                  className="px-2.5 py-1 bg-white border border-[#E8E2D9] hover:bg-[#E8E2D9] rounded font-bold text-xs"
                >
                  - 0.5mm
                </button>
                <input
                  type="range"
                  min="-15"
                  max="15"
                  step="0.5"
                  value={offsetY}
                  onChange={e => handleSaveOffset(offsetX, parseFloat(e.target.value))}
                  className="flex-1 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => handleSaveOffset(offsetX, Math.round((offsetY + 0.5) * 10) / 10)}
                  className="px-2.5 py-1 bg-white border border-[#E8E2D9] hover:bg-[#E8E2D9] rounded font-bold text-xs"
                >
                  + 0.5mm
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSaveOffset(0, 0)}
                className="px-3 py-2 bg-white border border-[#E8E2D9] hover:bg-[#E8E2D9] rounded-xl text-xs font-semibold text-[#8C857B] cursor-pointer"
              >
                Reset na 0 mm
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-2 bg-[#047857] hover:bg-[#065f46] text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                🖨️ Skúšobná tlač
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HLAVNÁ ČASŤ - FORMULÁR VĽAVO, NÁHĽAD ŠEVT A6 VPRAVO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:block">
        
        {/* ======================================================= */}
        {/* ĽAVÁ ČASŤ - FORMULÁR PRE PREDPISOVANIE LIEČIV           */}
        {/* ======================================================= */}
        <div className="lg:col-span-6 space-y-4 print:hidden">
          
          {/* 1. IDENTIFIKÁCIA LEKÁRA A DÁTUM */}
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4 shadow-xs space-y-3">
            <span className="text-[10px] uppercase font-bold text-[#C5A059] tracking-wider block border-b border-[#E8E2D9] pb-2">
              1. Predpisujúci lekár & Dátum
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Lekár</label>
                <select
                  value={doctorName}
                  onChange={e => handleDoctorChange(e.target.value)}
                  className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white text-xs font-bold text-[#2C2A29]"
                >
                  <option value={CLINIC_PRESCRIPTION_DEFAULTS.doctorName}>
                    {CLINIC_PRESCRIPTION_DEFAULTS.doctorName} (Kód: {CLINIC_PRESCRIPTION_DEFAULTS.doctorCode})
                  </option>
                  <option value={CLINIC_PRESCRIPTION_DEFAULTS.doctor2Name}>
                    {CLINIC_PRESCRIPTION_DEFAULTS.doctor2Name} (Kód: {CLINIC_PRESCRIPTION_DEFAULTS.doctor2Code})
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Dátum vystavenia</label>
                <input
                  type="text"
                  value={prescriptionDate}
                  onChange={e => setPrescriptionDate(e.target.value)}
                  placeholder="DD.MM.RRRR"
                  className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white font-mono text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Kód lekára (8-9 znakov)</label>
                <input
                  type="text"
                  value={doctorCode}
                  onChange={e => setDoctorCode(e.target.value)}
                  className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white font-mono text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Kód PZS</label>
                <input
                  type="text"
                  value={pzsCode}
                  onChange={e => setPzsCode(e.target.value)}
                  className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Por. číslo predpisu</label>
                <input
                  type="text"
                  value={prescriptionOrderNumber}
                  onChange={e => setPrescriptionOrderNumber(e.target.value)}
                  placeholder="voliteľné"
                  className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* 2. IDENTIFIKÁCIA PACIENTA, POISŤOVŇA A DIAGNÓZA */}
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4 shadow-xs space-y-3">
            <span className="text-[10px] uppercase font-bold text-[#C5A059] tracking-wider block border-b border-[#E8E2D9] pb-2">
              2. Údaje poistenca / pacienta (Do kolónok ŠEVT)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Priezvisko a meno</label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={e => setPatientName(e.target.value)}
                  placeholder="napr. NOVÁKOVÁ MÁRIA"
                  className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white font-bold text-sm text-[#2C2A29] uppercase"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Rodné číslo</label>
                <input
                  type="text"
                  value={birthNumber}
                  onChange={e => setBirthNumber(e.target.value)}
                  placeholder="885512/6789"
                  className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white font-mono text-xs font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Bydlisko poistenca (Ulica, PSČ, Mesto)</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Lazovná 43, 974 01 Banská Bystrica"
                  className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Zdravotná poisťovňa (Kód)</label>
                <select
                  value={insuranceCode}
                  onChange={e => setInsuranceCode(e.target.value)}
                  className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white text-xs font-bold text-[#2C2A29]"
                >
                  <option value="24">24 - Dôvera ZP</option>
                  <option value="25">25 - VšZP</option>
                  <option value="27">27 - Union ZP</option>
                  <option value="99">99 - Samoplatca / Cudzinec</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">
                  Diagnóza Dg. (4-miestny MKCH kód do okienok formulára)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={5}
                    value={diagnosisCode}
                    onChange={e => setDiagnosisCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
                    placeholder="Z411"
                    className="w-24 border border-[#E8E2D9] p-2 rounded-lg bg-white font-mono text-center text-sm font-bold tracking-widest uppercase"
                  />
                  <div className="flex flex-wrap gap-1 text-[9px] flex-1">
                    {[
                      { code: 'Z411', label: 'Z41.1 Estetická úprava' },
                      { code: 'T814', label: 'T81.4 Infekcia rany' },
                      { code: 'M653', label: 'M65.3 Skákavý prst' },
                      { code: 'G560', label: 'G56.0 Karpálny tunel' },
                      { code: 'L700', label: 'L70.0 Akné vulgaris' },
                      { code: 'L910', label: 'L91.0 Hypertrofická jazva' },
                      { code: 'R520', label: 'R52.0 Akútna bolesť' }
                    ].map(diag => (
                      <button
                        key={diag.code}
                        type="button"
                        onClick={() => setDiagnosisCode(diag.code)}
                        className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                          diagnosisCode === diag.code
                            ? 'bg-[#2C2A29] text-white border-[#2C2A29] font-bold'
                            : 'bg-[#FBF9F6] border-[#E8E2D9] text-[#2C2A29] hover:bg-[#E8E2D9]'
                        }`}
                      >
                        {diag.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. PREDPÍSANÉ LIEKY V LATINČINE (Rp.) */}
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#C5A059] tracking-wider">
                  3. Predpisované liečivá (Latinská účinná látka - INN)
                </span>
                <span className="text-[9px] text-[#8C857B] block">Max. 2 lieky na 1 tlačivo ŠEVT A6</span>
              </div>
              {items.length < 2 && (
                <button
                  type="button"
                  onClick={handleAddEmptyItem}
                  className="bg-[#2C2A29] hover:bg-black text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Pridať Rp. 2</span>
                </button>
              )}
            </div>

            {items.map((item, index) => (
              <div 
                key={item.id || index}
                className="border-2 border-[#E8E2D9] rounded-xl p-3.5 bg-[#FAF8F5] space-y-3 relative"
              >
                <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#2C2A29] text-white font-serif font-bold text-xs px-2 py-0.5 rounded">
                      Rp. {index + 1}
                    </span>
                    <span className="text-[11px] font-semibold text-[#8C857B]">
                      {item.commercialName ? `(Vzor: ${item.commercialName})` : 'Vlastný predpis'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="text-[#DC2626] hover:text-[#991B1B] p-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
                    title="Odstrániť liek z receptu"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  {/* LATINSKÝ NÁZOV ÚČINNEJ LÁTKY - ZÁKONNÁ POŽIADAVKA */}
                  <div>
                    <label className="block text-[10px] uppercase text-[#047857] mb-1 font-bold">
                      ⚖️ Názov účinnej látky v latinčine (INN) + lieková forma + sila na recept:
                    </label>
                    <input
                      type="text"
                      required
                      value={item.latinName}
                      onChange={e => handleUpdateItemField(index, 'latinName', e.target.value)}
                      placeholder="napr. Amoxicillinum et acidum clavulanicum tbl flm 1 g"
                      className="w-full border-2 border-[#047857]/40 focus:border-[#047857] p-2 rounded-lg bg-white font-serif font-bold text-sm text-[#2C2A29]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">
                        Veľkosť a počet balení (Exp. orig. No.)
                      </label>
                      <input
                        type="text"
                        value={item.packaging}
                        onChange={e => handleUpdateItemField(index, 'packaging', e.target.value)}
                        placeholder="Exp. orig. No. I (unam)"
                        className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white font-serif font-bold text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">
                        Kód ŠÚKL liečiva (do okienok Kód)
                      </label>
                      <input
                        type="text"
                        maxLength={8}
                        value={item.suklCode || ''}
                        onChange={e => handleUpdateItemField(index, 'suklCode', e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="096431"
                        className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white font-mono text-xs font-bold"
                      />
                    </div>
                  </div>

                  {/* DÁVKOVANIE (D.S.) */}
                  <div>
                    <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">
                      Návod na použitie / Signatúra (D.S.)
                    </label>
                    <input
                      type="text"
                      value={item.dosage}
                      onChange={e => handleUpdateItemField(index, 'dosage', e.target.value)}
                      placeholder="D.S. 1 tableta každých 12 hodín po jedle (7 dní)"
                      className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white text-xs font-serif italic text-[#2C2A29]"
                    />
                  </div>
                </div>
              </div>
            ))}

            {items.length === 0 && (
              <div className="border-2 border-dashed border-[#E8E2D9] rounded-xl p-6 text-center text-xs text-[#8C857B]">
                <p>Na recepte zatiaľ nie je zadaný žiadny liek.</p>
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

          {/* 4. RÝCHLY KATALÓG S LATINSKÝMI ÚČINNÝMI LÁTKAMI (1-CLICK INSERT) */}
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-2">
              <span className="text-[10px] uppercase font-bold text-[#C5A059] tracking-wider">
                4. Rýchly výber liekov s latinskými účinnými látkami
              </span>
              <span className="text-[9px] text-[#8C857B]">1-klikom vložíte do receptu</span>
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
              placeholder="Hľadať podľa účinnej látky alebo značky (Amoxicillinum, Augmentin, Aulin, Clexane...)..."
              className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-[#FBF9F6] outline-none focus:border-[#C5A059]"
            />

            {/* Zoznam liekov */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
              {filteredCatalog.map(med => (
                <div
                  key={med.id}
                  className="border border-[#E8E2D9] hover:border-[#047857] p-2.5 rounded-xl bg-[#FBF9F6] hover:bg-white transition-all flex flex-col justify-between text-xs group"
                >
                  <div>
                    <div className="flex justify-between items-start gap-1">
                      <p className="font-serif font-bold text-[#047857] text-[11px] group-hover:text-[#065f46] leading-tight">
                        {med.latinName}
                      </p>
                    </div>
                    <p className="text-[10px] text-[#8C857B] font-semibold mt-0.5">
                      {med.commercialName} • ŠÚKL: {med.suklCode}
                    </p>
                    <p className="text-[10px] text-[#2C2A29] mt-1 font-serif italic line-clamp-1">{med.dosage}</p>
                  </div>

                  <div className="mt-2 pt-2 border-t border-[#E8E2D9]/60 flex items-center justify-between">
                    <span className="text-[9px] font-mono text-[#8C857B] bg-white px-1.5 py-0.5 rounded border border-[#E8E2D9]">
                      {med.packaging}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddFromCatalog(med)}
                      className="bg-[#047857] hover:bg-[#065f46] text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>+</span>
                      <span>Vložiť Rp.</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AKČNÉ TLAČIDLÁ SPODOK VĽAVO */}
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={handleSaveToPatientFolder}
              className="flex-1 bg-[#C5A059] hover:bg-[#b08d48] text-white font-bold text-xs uppercase tracking-wider py-3 px-4 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>💾</span>
              <span>Uložiť do karty pacienta</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              className="bg-[#2C2A29] hover:bg-black text-white font-bold text-xs uppercase tracking-wider py-3 px-4 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>📄</span>
              <span>{generatingPdf ? 'Generujem PDF...' : 'Stiahnuť PDF (A6)'}</span>
            </button>
          </div>

        </div>

        {/* ======================================================= */}
        {/* PRAVÁ ČASŤ - VERNÁ PREDLOHA TLAČIVA ŠEVT 14 282 2s (A6)  */}
        {/* ======================================================= */}
        <div className="lg:col-span-6 flex flex-col items-center">
          
          <div className="w-full flex justify-between items-center mb-3 print:hidden">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#2C2A29] uppercase tracking-wider">
                Náhľad: ŠEVT 14 282 2s (A6 - 105 × 148 mm)
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Prepínač zobrazenia náhľadu na obrazovke */}
              <button
                type="button"
                onClick={() => setPreviewView(previewView === 'full_preview' ? 'text_only' : 'full_preview')}
                className="text-[10px] font-bold text-[#8C857B] hover:text-[#2C2A29] px-2 py-1 bg-white border border-[#E8E2D9] rounded-lg transition-colors cursor-pointer"
              >
                {previewView === 'full_preview' ? '👁️ Zobraziť iba tlačený text' : '👁️ Zobraziť mriežku ŠEVT'}
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="bg-[#047857] hover:bg-[#065f46] text-white text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>🖨️</span>
                <span>Tlačiť A6</span>
              </button>
            </div>
          </div>

          {/* DOKUMENT: OFICIÁLNE LEKÁRSKE TLAČIVO ŠEVT 14 282 2s */}
          <div 
            id="sevt-a6-prescription-document"
            ref={printRef}
            className={`bg-[#FFFFFF] text-[#000000] p-2 relative select-text transition-all ${
              previewView === 'text_only' ? 'border border-dashed border-[#C5A059]' : 'border-2 border-[#000000] shadow-md'
            }`}
            style={{
              width: '100%',
              maxWidth: '397px', // zodpovedá 105mm pri štandardnom zobrazení
              minHeight: '560px', // zodpovedá 148mm
              fontFamily: '"Times New Roman", Times, "Liberation Serif", serif',
              boxSizing: 'border-box'
            }}
          >
            
            {/* 1. HORNÝ BLOK (Miesto pre nalep. čísla | Lekársky predpis + Poisťovňa | Kód lekára AA) */}
            <div className={`grid grid-cols-12 border-b-2 sevt-border ${previewView === 'text_only' ? 'border-transparent' : 'border-[#000000]'}`}>
              
              {/* VĽAVO: Miesto pre nalep. čísla */}
              <div className={`col-span-3 border-r-2 sevt-border p-1 flex flex-col justify-center items-center text-center ${previewView === 'text_only' ? 'border-transparent' : 'border-[#000000]'}`}>
                <span className="text-[7.5px] leading-tight sevt-preprinted-text font-sans">
                  Miesto<br />pre<br />nalep.<br />čísla
                </span>
              </div>

              {/* V STREDE: Lekársky predpis + Zdravotná poisťovňa poistenca + 4 OKIENKA */}
              <div className={`col-span-6 border-r-2 sevt-border p-1 flex flex-col justify-between items-center text-center ${previewView === 'text_only' ? 'border-transparent' : 'border-[#000000]'}`}>
                <div className="font-sans font-bold text-[12px] tracking-wide uppercase sevt-preprinted-text">
                  Lekársky predpis
                </div>

                <div className="w-full pt-1">
                  <span className="text-[7px] block font-sans sevt-preprinted-text">
                    Zdravotná poisťovňa poistenca
                  </span>
                  {/* 4 štvorcové okienka na kód ZP */}
                  <div className="flex justify-center items-center gap-[2px] mt-0.5">
                    {insBoxes.map((char, i) => (
                      <div 
                        key={i} 
                        className={`w-3.5 h-4 border sevt-border flex items-center justify-center font-mono font-bold text-[10px] sevt-dynamic-value ${
                          previewView === 'text_only' ? 'border-transparent' : 'border-[#000000] bg-white'
                        }`}
                      >
                        {char}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* VPRAVO: Kód lekára + AA */}
              <div className="col-span-3 p-1 flex flex-col justify-between">
                <div>
                  <span className="text-[7px] font-sans block sevt-preprinted-text">Kód lekára</span>
                  <span className="font-mono font-bold text-[9px] sevt-dynamic-value block">
                    {doctorCode}
                  </span>
                </div>
                <div className="text-right font-sans font-bold text-sm leading-none sevt-preprinted-text">
                  AA
                </div>
              </div>

            </div>

            {/* 2. RIADOK: Priezvisko a meno (vľavo) | Rodné číslo (vpravo) */}
            <div className={`grid grid-cols-12 border-b sevt-border min-h-[30px] ${previewView === 'text_only' ? 'border-transparent' : 'border-[#000000]'}`}>
              <div className={`col-span-8 border-r sevt-border p-1 ${previewView === 'text_only' ? 'border-transparent' : 'border-[#000000]'}`}>
                <span className="text-[7px] font-sans block leading-none sevt-preprinted-text">Priezvisko a meno</span>
                <span className="font-sans font-bold text-[11px] uppercase tracking-wide sevt-dynamic-value block mt-0.5">
                  {patientName || ' '}
                </span>
              </div>
              <div className="col-span-4 p-1">
                <span className="text-[7px] font-sans block leading-none sevt-preprinted-text">Rodné číslo</span>
                <span className="font-mono font-bold text-[10px] sevt-dynamic-value block mt-0.5">
                  {birthNumber || ' '}
                </span>
              </div>
            </div>

            {/* 3. RIADOK: Bydlisko */}
            <div className={`border-b-2 sevt-border p-1 min-h-[26px] ${previewView === 'text_only' ? 'border-transparent' : 'border-[#000000]'}`}>
              <span className="text-[7px] font-sans block leading-none sevt-preprinted-text">Bydlisko</span>
              <span className="font-sans text-[9px] sevt-dynamic-value block mt-0.5">
                {address || ' '}
              </span>
            </div>

            {/* 4. HLAVNÁ SEKCIA: ĽAVÁ ČASŤ (Rp. 1 a Rp. 2) | PRAVÁ ČASŤ (Uhradí poisťovňa/pacient tabuľka) */}
            <div className="grid grid-cols-12 min-h-[360px]">
              
              {/* ĽAVÝ STĹPEC (cca 68% šírky) - PREDPIS LIEKOV Rp. */}
              <div className={`col-span-8 border-r-2 sevt-border flex flex-col justify-between p-1.5 ${previewView === 'text_only' ? 'border-transparent' : 'border-[#000000]'}`}>
                
                {/* LIEK 1 */}
                <div className="space-y-1">
                  
                  {/* Riadok: Dg. [ ][ ][ ][ ] | Kód [ ][ ][ ][ ][ ][ ][ ][ ] */}
                  <div className="flex items-center justify-between text-[7px] font-sans pt-0.5">
                    <div className="flex items-center gap-1">
                      <span className="sevt-preprinted-text font-bold">Dg.</span>
                      <div className="flex gap-[1px]">
                        {dgBoxes1.map((c, i) => (
                          <div 
                            key={i} 
                            className={`w-3 h-3.5 border sevt-border flex items-center justify-center font-mono font-bold text-[8.5px] sevt-dynamic-value ${
                              previewView === 'text_only' ? 'border-transparent' : 'border-[#000000] bg-white'
                            }`}
                          >
                            {c}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="sevt-preprinted-text font-bold">Kód</span>
                      <div className="flex gap-[1px]">
                        {suklBoxes1.map((c, i) => (
                          <div 
                            key={i} 
                            className={`w-2.5 h-3.5 border sevt-border flex items-center justify-center font-mono font-bold text-[8px] sevt-dynamic-value ${
                              previewView === 'text_only' ? 'border-transparent' : 'border-[#000000] bg-white'
                            }`}
                          >
                            {c}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Nápis Rp. a LATINSKÉ LIEČIVO 1 */}
                  <div className="pt-0.5">
                    <div className="font-serif font-bold text-base leading-none sevt-preprinted-text float-left mr-1.5">
                      Rp.
                    </div>
                    {items[0] && (
                      <div className="space-y-0.5">
                        {/* ZÁKONNÁ LATINSKÁ ÚČINNÁ LÁTKA INN */}
                        <div className="font-serif font-bold text-[11px] leading-tight text-[#000000] sevt-dynamic-value">
                          {items[0].latinName}
                        </div>
                        {/* BALENIE */}
                        <div className="font-serif font-bold text-[9.5px] text-[#000000] sevt-dynamic-value pl-2">
                          {items[0].packaging}
                        </div>
                        {/* SIGNATÚRA D.S. */}
                        <div className="font-serif italic text-[9.5px] text-[#000000] sevt-dynamic-value pl-2 leading-tight">
                          {items[0].dosage}
                        </div>
                      </div>
                    )}
                  </div>

                </div>

                {/* LIEK 2 (V DOLNEJ POLOVICI) */}
                <div className="space-y-1 pt-2">
                  
                  {/* Riadok 2: Dg. [ ][ ][ ][ ] | Kód [ ][ ][ ][ ][ ][ ][ ][ ] */}
                  <div className="flex items-center justify-between text-[7px] font-sans border-t border-dashed sevt-border pt-1.5">
                    <div className="flex items-center gap-1">
                      <span className="sevt-preprinted-text font-bold">Dg.</span>
                      <div className="flex gap-[1px]">
                        {dgBoxes2.map((c, i) => (
                          <div 
                            key={i} 
                            className={`w-3 h-3.5 border sevt-border flex items-center justify-center font-mono font-bold text-[8.5px] sevt-dynamic-value ${
                              previewView === 'text_only' ? 'border-transparent' : 'border-[#000000] bg-white'
                            }`}
                          >
                            {items[1] ? c : ''}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="sevt-preprinted-text font-bold">Kód</span>
                      <div className="flex gap-[1px]">
                        {suklBoxes2.map((c, i) => (
                          <div 
                            key={i} 
                            className={`w-2.5 h-3.5 border sevt-border flex items-center justify-center font-mono font-bold text-[8px] sevt-dynamic-value ${
                              previewView === 'text_only' ? 'border-transparent' : 'border-[#000000] bg-white'
                            }`}
                          >
                            {c}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Nápis Rp. a LATINSKÉ LIEČIVO 2 */}
                  <div className="pt-0.5 min-h-[60px]">
                    {items[1] && (
                      <div>
                        <div className="font-serif font-bold text-base leading-none sevt-preprinted-text float-left mr-1.5">
                          Rp.
                        </div>
                        <div className="space-y-0.5">
                          <div className="font-serif font-bold text-[11px] leading-tight text-[#000000] sevt-dynamic-value">
                            {items[1].latinName}
                          </div>
                          <div className="font-serif font-bold text-[9.5px] text-[#000000] sevt-dynamic-value pl-2">
                            {items[1].packaging}
                          </div>
                          <div className="font-serif italic text-[9.5px] text-[#000000] sevt-dynamic-value pl-2 leading-tight">
                            {items[1].dosage}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* DŇA A PEČIATKA LEKÁRA */}
                  <div className="pt-1">
                    <div className="flex justify-between items-baseline text-[7.5px] font-sans">
                      <div>
                        <span className="sevt-preprinted-text">Dňa: </span>
                        <strong className="sevt-dynamic-value font-mono text-[8.5px]">{prescriptionDate}</strong>
                      </div>
                      <div className="sevt-preprinted-text">
                        Spolu
                      </div>
                    </div>

                    {/* PEČIATKA A PODPIS */}
                    <div className="mt-1 text-center">
                      <div className="text-[6.5px] text-[#000000] sevt-preprinted-text leading-none">
                        ...........................................................................
                      </div>
                      <div className="text-[6.5px] font-sans uppercase sevt-preprinted-text mt-0.5">
                        odtlačok pečiatky a podpis lekára
                      </div>
                      {/* Vizuálna pečiatka kliniky pri plnej tlači */}
                      <div className="mt-0.5 font-sans text-[6.5px] leading-tight text-[#000000] sevt-dynamic-value">
                        <strong>SAY CLINIC s.r.o.</strong> • Lazovná 43, BB<br />
                        PZS: {pzsCode} • {doctorName} ({doctorCode})
                      </div>
                    </div>
                  </div>

                </div>

              </div>

              {/* PRAVÝ STĹPEC (cca 32% šírky) - TABUĽKA "U h r a d í" */}
              <div className="col-span-4 flex flex-col justify-between">
                
                <div>
                  {/* Hlavička: U h r a d í */}
                  <div className={`border-b sevt-border text-center font-sans font-bold text-[8.5px] py-0.5 tracking-[3px] sevt-preprinted-text ${
                    previewView === 'text_only' ? 'border-transparent' : 'border-[#000000]'
                  }`}>
                    U h r a d í
                  </div>

                  {/* Podhlavička: poisťovňa (euro | cent) | pacient (euro | cent) */}
                  <div className={`grid grid-cols-2 border-b sevt-border text-center text-[6.5px] font-sans sevt-preprinted-text ${
                    previewView === 'text_only' ? 'border-transparent' : 'border-[#000000]'
                  }`}>
                    <div className={`border-r sevt-border p-0.5 ${previewView === 'text_only' ? 'border-transparent' : 'border-[#000000]'}`}>
                      <div>poisťovňa</div>
                      <div className={`grid grid-cols-2 border-t sevt-border text-[5.5px] pt-0.5 ${previewView === 'text_only' ? 'border-transparent' : 'border-[#000000]'}`}>
                        <span className={`border-r sevt-border ${previewView === 'text_only' ? 'border-transparent' : 'border-[#000000]'}`}>euro</span>
                        <span>cent</span>
                      </div>
                    </div>
                    <div className="p-0.5">
                      <div>pacient</div>
                      <div className={`grid grid-cols-2 border-t sevt-border text-[5.5px] pt-0.5 ${previewView === 'text_only' ? 'border-transparent' : 'border-[#000000]'}`}>
                        <span className={`border-r sevt-border ${previewView === 'text_only' ? 'border-transparent' : 'border-[#000000]'}`}>euro</span>
                        <span>cent</span>
                      </div>
                    </div>
                  </div>

                  {/* Prázdne riadky mriežky pre lekáreň */}
                  <div className={`h-44 grid grid-cols-4 sevt-border ${previewView === 'text_only' ? 'border-transparent' : ''}`}>
                    <div className={`border-r sevt-border ${previewView === 'text_only' ? 'border-transparent' : 'border-[#000000]'}`}></div>
                    <div className={`border-r-2 sevt-border ${previewView === 'text_only' ? 'border-transparent' : 'border-[#000000]'}`}></div>
                    <div className={`border-r sevt-border ${previewView === 'text_only' ? 'border-transparent' : 'border-[#000000]'}`}></div>
                    <div></div>
                  </div>
                </div>

                {/* Por. číslo predpisu */}
                <div className={`border-t sevt-border p-1 ${previewView === 'text_only' ? 'border-transparent' : 'border-[#000000]'}`}>
                  <span className="text-[6.5px] font-sans block leading-none sevt-preprinted-text">
                    Por. číslo predpisu
                  </span>
                  <span className="font-mono text-[8px] font-bold sevt-dynamic-value block mt-0.5">
                    {prescriptionOrderNumber || ' '}
                  </span>
                </div>

              </div>

            </div>

            {/* 5. DOLNÁ PÄTIČKA (Tabuľka 5 buniek pre lekáreň: Prijal | Pripravil | Spolupracoval | Expedoval | Dátum) */}
            <div className={`border-t-2 sevt-border grid grid-cols-5 text-center text-[6.5px] font-sans min-h-[22px] sevt-preprinted-text ${
              previewView === 'text_only' ? 'border-transparent' : 'border-[#000000]'
            }`}>
              <div className={`border-r sevt-border p-0.5 flex items-center justify-center ${previewView === 'text_only' ? 'border-transparent' : 'border-[#000000]'}`}>
                Prijal
              </div>
              <div className={`border-r sevt-border p-0.5 flex items-center justify-center ${previewView === 'text_only' ? 'border-transparent' : 'border-[#000000]'}`}>
                Pripravil
              </div>
              <div className={`border-r sevt-border p-0.5 flex items-center justify-center ${previewView === 'text_only' ? 'border-transparent' : 'border-[#000000]'}`}>
                Spolupracoval
              </div>
              <div className={`border-r sevt-border p-0.5 flex items-center justify-center ${previewView === 'text_only' ? 'border-transparent' : 'border-[#000000]'}`}>
                Expedoval
              </div>
              <div className="p-0.5 flex items-center justify-center">
                Dátum
              </div>
            </div>

            {/* Mikrotext ŠEVT na spodku */}
            <div className="text-[5.5px] text-[#000000] font-sans pt-0.5 flex justify-between items-center sevt-preprinted-text">
              <span>14 282 2s Design © <strong>Ševt</strong> www.sevt.sk</span>
              <span>SAY CLINIC BB</span>
            </div>

          </div>

          <div className="mt-3 text-center text-xs text-[#8C857B] print:hidden max-w-sm space-y-1">
            <p>
              💡 <strong>Tlač do predtlačeného bloku:</strong> Zvoľte formát <strong>A6</strong> v dialógu tlače (105 × 148 mm). Do tlačiarne vložte originálny recept ŠEVT.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
