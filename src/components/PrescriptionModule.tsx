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
  const [patientName, setPatientName] = useState(initialPatient?.name || 'MICHAELA KRIGOVSKÁ');
  const [birthNumber, setBirthNumber] = useState(initialPatient?.birthNumber || '935225/9664');
  const [address, setAddress] = useState(initialPatient?.address || 'FRANCISCIHO 18, LEVOČA');
  const [insuranceCode, setInsuranceCode] = useState(initialPatient?.insurance || '2500');
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
      substance: 'metamizol, sodná soľ',
      formAndStrength: 'tbl flm 20x500 mg (blis.Al/PVC)',
      packaging: 'Exp. orig. No I (unam)',
      dosage: 'D.S. DOP pp.',
      commercialName: 'Novalgin 500 mg',
      latinName: 'Metamizolum natricum monohydricum tbl flm 500 mg',
      suklCode: '007981',
      category: 'analgetik',
      paymentType: 'Hradí pacient'
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
        let cleanIns = initialPatient.insurance.replace(/\D/g, '');
        if (cleanIns.length === 2) cleanIns = `${cleanIns}00`;
        setInsuranceCode(cleanIns || '2500');
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

  // Pridanie lieku z katalógu
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

  // Pridanie prázdneho lieku
  const handleAddEmptyItem = () => {
    if (items.length >= 2) {
      alert('Tlačivo receptu A6 obsahuje maximálne 2 lieky.');
      return;
    }
    setItems([
      ...items,
      {
        id: `item-${Date.now()}`,
        substance: '',
        formAndStrength: '',
        packaging: 'Exp. orig. No I (unam)',
        dosage: 'D.S. ',
        commercialName: '',
        category: 'other',
        paymentType: 'Hradí pacient'
      }
    ]);
  };

  // Vloženie vzorového príkladu (z predlohy)
  const handleLoadSampleData = () => {
    setPatientName('MICHAELA KRIGOVSKÁ');
    setBirthNumber('935225/9664');
    setAddress('FRANCISCIHO 18, LEVOČA');
    setInsuranceCode('2500');
    setDiagnosisCode('Z411');
    setDoctorCode('A57687038');
    setItems([
      {
        id: 'item-sample-1',
        substance: 'metamizol, sodná soľ',
        formAndStrength: 'tbl flm 20x500 mg (blis.Al/PVC)',
        packaging: 'Exp. orig. No I (unam)',
        dosage: 'D.S. DOP pp.',
        commercialName: 'Novalgin 500 mg',
        suklCode: '007981',
        category: 'analgetik',
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
      title: `Recept: ${items.map(i => i.substance || i.commercialName || i.latinName).filter(Boolean).join(', ') || 'Predpis liekov'}`,
      doctor: doctorName,
      diagnosis: diagnosisCode,
      date: prescriptionDate,
      content: `LEKÁRSKY PREDPIS (ŠEVT 14 282 2s - A6) - SAY CLINIC\n\nPoskytovateľ: ${CLINIC_PRESCRIPTION_DEFAULTS.clinicName}\nPZS: ${pzsCode} | Lekár: ${doctorName} (${doctorCode})\nPoistenec: ${patientName} (RČ: ${birthNumber})\nBydlisko: ${address}\nPoisťovňa: ${insuranceCode}\nDiagnóza: ${diagnosisCode}\nDátum: ${prescriptionDate}\n\nPREDPÍSANÉ LIEČIVÁ (Rp.):\n${items.map((it, idx) => `Rp. ${idx + 1}:\n   ${it.substance || it.latinName}\n   ${it.formAndStrength || ''}\n   ${it.packaging}\n   ${it.dosage}${it.commercialName ? `\n   (${it.commercialName})` : ''}`).join('\n\n')}`
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
      (med.substance && med.substance.toLowerCase().includes(catalogSearch.toLowerCase())) ||
      med.commercialName.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      (med.latinName && med.latinName.toLowerCase().includes(catalogSearch.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Rozbité znaky pre okienka
  const insBoxes = getBoxChars(insuranceCode, 4);
  const dgBoxes1 = getBoxChars(diagnosisCode, 4);
  const dgBoxes2 = getBoxChars(diagnosisCode, 4);

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

      {/* TLAČOVÝ ŠTÝL PRE A6 FORMÁT (105mm x 148mm) */}
      <style jsx global>{`
        @page {
          size: 105mm 148mm portrait;
          margin: 0mm;
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
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
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: transparent !important;
          }

          /* V REŽIME TLAČE DO ZAKÚPENÉHO TLAČIVA SKRYJEME RÁMČEKY A PREDRYTÉ NÁPISY */
          ${printMode === 'preprinted' ? `
            .sevt-guide-grid {
              display: none !important;
            }
            .sevt-border {
              border-color: transparent !important;
            }
            .sevt-preprinted-text {
              display: none !important;
              visibility: hidden !important;
            }
            .sevt-bg {
              background: transparent !important;
            }
            .sevt-dynamic-value {
              color: #000000 !important;
              visibility: visible !important;
            }
          ` : `
            .sevt-guide-grid {
              display: block !important;
            }
            .sevt-border {
              border-color: #000000 !important;
            }
            .sevt-preprinted-text {
              display: block !important;
              visibility: visible !important;
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
              Generická preskripcia
            </span>
          </div>
          <p className="text-xs text-[#8C857B] mt-0.5">
            Presné rozloženie textu podľa predlohy pre tlač do predtlačeného tlačiva ŠEVT (105 × 148 mm)
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
              <span>Tlač celého tlačiva (s mriežkou)</span>
            </button>
          </div>

          {/* Vzorové dáta */}
          <button
            type="button"
            onClick={handleLoadSampleData}
            className="px-3 py-2 bg-[#FBF9F6] hover:bg-[#E8E2D9] border border-[#E8E2D9] rounded-xl text-xs font-semibold text-[#2C2A29] transition-colors cursor-pointer"
            title="Načítať ukážku z predlohy (Novalgin / Metamizol, Michaela Krigovská, Z411)"
          >
            📋 Vzor
          </button>

          {/* Tlačidlo kalibrácie */}
          <button
            type="button"
            onClick={() => setShowCalibration(!showCalibration)}
            className="px-3 py-2 bg-[#FBF9F6] hover:bg-[#E8E2D9] border border-[#E8E2D9] rounded-xl text-xs font-semibold text-[#2C2A29] transition-colors cursor-pointer flex items-center gap-1.5"
            title="Nastavenie posunu tlače v mm pre presné trafenie do okienok vašej tlačiarne"
          >
            <span>🎯</span>
            <span>Kalibrácia {offsetX !== 0 || offsetY !== 0 ? `(${offsetX > 0 ? '+' : ''}${offsetX}mm, ${offsetY > 0 ? '+' : ''}${offsetY}mm)` : ''}</span>
          </button>
        </div>
      </div>

      {/* KALIBRAČNÝ PANEL (AK JE OTVORENÝ) */}
      {showCalibration && (
        <div className="bg-[#FAF8F5] border border-[#C5A059]/40 p-4 rounded-2xl shadow-xs print:hidden animate-fade-in space-y-3">
          <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-2">
            <div className="flex items-center gap-2">
              <span className="text-base">🎯</span>
              <span className="font-bold text-xs text-[#2C2A29] uppercase tracking-wider">
                Jemné doladenie súradníc tlače (Offset X / Y v mm)
              </span>
            </div>
            <span className="text-[11px] text-[#8C857B]">Hodnoty sa automaticky ukladajú</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div>
              <label className="block text-[11px] font-bold text-[#2C2A29] mb-1">
                Horizontálny posun X (Vľavo - / Vpravo +): <span className="font-mono text-[#047857]">{offsetX > 0 ? `+${offsetX}` : offsetX} mm</span>
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
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Kód lekára</label>
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
                  placeholder="MICHAELA KRIGOVSKÁ"
                  className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white font-bold text-sm text-[#2C2A29] uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Rodné číslo</label>
                <input
                  type="text"
                  value={birthNumber}
                  onChange={e => setBirthNumber(e.target.value)}
                  placeholder="935225/9664"
                  className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white font-mono text-xs font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Bydlisko poistenca (Ulica, Mesto)</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="FRANCISCIHO 18, LEVOČA"
                  className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white text-xs font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Zdravotná poisťovňa (Kód)</label>
                <input
                  type="text"
                  value={insuranceCode}
                  onChange={e => setInsuranceCode(e.target.value)}
                  placeholder="2500"
                  className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white font-mono text-xs font-bold"
                />
                <div className="flex gap-1 mt-1 text-[10px]">
                  <button type="button" onClick={() => setInsuranceCode('2500')} className="text-[#8C857B] hover:text-[#047857] underline">2500 VšZP</button>
                  <span>•</span>
                  <button type="button" onClick={() => setInsuranceCode('2400')} className="text-[#8C857B] hover:text-[#047857] underline">2400 Dôvera</button>
                  <span>•</span>
                  <button type="button" onClick={() => setInsuranceCode('2700')} className="text-[#8C857B] hover:text-[#047857] underline">2700 Union</button>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">
                  Diagnóza (MKCH-10 kód do 4 okienok, napr. Z411, T814)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={5}
                    value={diagnosisCode}
                    onChange={e => setDiagnosisCode(e.target.value.toUpperCase())}
                    placeholder="Z411"
                    className="w-28 border-2 border-[#047857]/50 p-2 rounded-lg bg-white font-mono font-bold text-sm tracking-widest text-center"
                  />
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    {[
                      { code: 'Z411', label: 'Z41.1 Plastická chirurgia' },
                      { code: 'T814', label: 'T81.4 Infekcia po výkone' },
                      { code: 'M653', label: 'M65.3 Skákavý prst' },
                      { code: 'G560', label: 'G56.0 Karpálny tunel' },
                      { code: 'R520', label: 'R52.0 Bolesť' }
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

          {/* 3. PREDPÍSANÉ LIEKY (Rp.) */}
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#C5A059] tracking-wider">
                  3. Predpisované liečivá (Riadky predpisu)
                </span>
                <span className="text-[9px] text-[#8C857B] block">Formát: Účinná látka, Forma/Sila, Balenie, D.S., (Komerčný názov)</span>
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
                    <span className="bg-[#2C2A29] text-white font-mono font-bold text-xs px-2 py-0.5 rounded">
                      Rp. {index + 1}
                    </span>
                    <span className="text-[11px] font-semibold text-[#8C857B]">
                      {item.commercialName ? `(${item.commercialName})` : 'Vlastný predpis'}
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
                  {/* RIADOK 1: ÚČINNÁ LÁTKA */}
                  <div>
                    <label className="block text-[10px] uppercase text-[#047857] mb-1 font-bold">
                      1. riadok: Účinná látka (napr. metamizol, sodná soľ / amoxicilín / kyselina klavulánová):
                    </label>
                    <input
                      type="text"
                      required
                      value={item.substance || item.latinName || ''}
                      onChange={e => handleUpdateItemField(index, 'substance', e.target.value)}
                      placeholder="metamizol, sodná soľ"
                      className="w-full border-2 border-[#047857]/40 focus:border-[#047857] p-2 rounded-lg bg-white font-mono font-bold text-xs text-[#2C2A29]"
                    />
                  </div>

                  {/* RIADOK 2: FORMA A SILA */}
                  <div>
                    <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">
                      2. riadok: Lieková forma, sila a špecifikácia (napr. tbl flm 20x500 mg (blis.Al/PVC)):
                    </label>
                    <input
                      type="text"
                      value={item.formAndStrength || ''}
                      onChange={e => handleUpdateItemField(index, 'formAndStrength', e.target.value)}
                      placeholder="tbl flm 20x500 mg (blis.Al/PVC)"
                      className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white font-mono text-xs text-[#2C2A29]"
                    />
                  </div>

                  {/* RIADOK 3: BALENIE */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">
                        3. riadok: Počet balení (Exp. orig. No.)
                      </label>
                      <input
                        type="text"
                        value={item.packaging}
                        onChange={e => handleUpdateItemField(index, 'packaging', e.target.value)}
                        placeholder="Exp. orig. No I (unam)"
                        className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white font-mono font-bold text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">
                        5. riadok: Obchodný názov v zátvorke
                      </label>
                      <input
                        type="text"
                        value={item.commercialName}
                        onChange={e => handleUpdateItemField(index, 'commercialName', e.target.value)}
                        placeholder="Novalgin 500 mg"
                        className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white font-mono text-xs"
                      />
                    </div>
                  </div>

                  {/* RIADOK 4: DÁVKOVANIE (D.S.) */}
                  <div>
                    <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">
                      4. riadok: Dávkovanie / Signatúra (D.S.)
                    </label>
                    <input
                      type="text"
                      value={item.dosage}
                      onChange={e => handleUpdateItemField(index, 'dosage', e.target.value)}
                      placeholder="D.S. DOP pp."
                      className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white text-xs font-mono text-[#2C2A29]"
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

          {/* 4. RÝCHLY KATALÓG S ÚČINNÝMI LÁTKAMI (1-CLICK INSERT) */}
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-2">
              <span className="text-[10px] uppercase font-bold text-[#C5A059] tracking-wider">
                4. Rýchly výber liekov s účinnými látkami
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
              placeholder="Hľadať podľa účinnej látky alebo značky (Novalgin, Aulin, Clexane, Augmentin, Framykoin...)..."
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
                      <p className="font-mono font-bold text-[#047857] text-[11px] group-hover:text-[#065f46] leading-tight">
                        {med.substance || med.latinName}
                      </p>
                    </div>
                    <p className="text-[10px] text-[#8C857B] font-semibold mt-0.5">
                      {med.commercialName} • {med.formAndStrength || ''}
                    </p>
                    <p className="text-[10px] text-[#2C2A29] mt-1 font-mono italic line-clamp-1">{med.dosage}</p>
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

          {/* DOKUMENT: OFICIÁLNE LEKÁRSKE TLAČIVO ŠEVT 14 282 2s (A6: 105mm x 148mm) */}
          <div 
            id="sevt-a6-prescription-document"
            ref={printRef}
            className={`bg-[#FFFFFF] text-[#000000] relative select-text transition-all ${
              previewView === 'text_only' ? 'border border-dashed border-[#C5A059]' : 'border-2 border-[#000000] shadow-md'
            }`}
            style={{
              width: '105mm',
              height: '148mm',
              boxSizing: 'border-box',
              overflow: 'hidden',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
            }}
          >
            {/* VODIDLÁ / MRIEŽKA ŠEVT (Zobrazuje sa pri previewView === 'full_preview' a tlači s mriežkou) */}
            <div className={`sevt-guide-grid absolute inset-0 pointer-events-none ${previewView === 'text_only' ? 'hidden' : 'block'}`}>
              
              {/* Horný blok mriežky */}
              <div className="absolute top-[4mm] left-[4mm] right-[4mm] h-[22mm] border-2 border-black">
                {/* Ľavé okienko: Miesto pre nalep. čísla */}
                <div className="absolute top-0 left-0 bottom-0 w-[24mm] border-r-2 border-black flex flex-col justify-center items-center text-center">
                  <span className="text-[7.5px] font-sans leading-tight sevt-preprinted-text">
                    Miesto<br />pre<br />nalep.<br />čísla
                  </span>
                </div>
                {/* Stredné okienko: Lekársky predpis + Zdravotná poisťovňa */}
                <div className="absolute top-0 left-[24mm] bottom-0 right-[24mm] border-r-2 border-black flex flex-col justify-between items-center text-center p-1">
                  <div className="font-sans font-bold text-[11px] tracking-widest uppercase sevt-preprinted-text">
                    Lekársky predpis
                  </div>
                  <div className="w-full">
                    <span className="text-[7px] block font-sans sevt-preprinted-text">
                      Zdravotná poisťovňa poistenca
                    </span>
                    <div className="flex justify-center items-center gap-[2px] mt-0.5">
                      {[0, 1, 2, 3].map(i => (
                        <div key={i} className="w-[4mm] h-[4.5mm] border border-black bg-white"></div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Pravé okienko: Kód lekára + AA */}
                <div className="absolute top-0 right-0 bottom-0 w-[24mm] p-1 flex flex-col justify-between">
                  <span className="text-[7px] font-sans block sevt-preprinted-text">Kód lekára</span>
                  <div className="text-right font-sans font-bold text-sm leading-none sevt-preprinted-text">AA</div>
                </div>
              </div>

              {/* Riadok 2 mriežky: Priezvisko a meno | Rodné číslo */}
              <div className="absolute top-[26mm] left-[4mm] right-[4mm] h-[9mm] border-x-2 border-b border-black">
                <div className="absolute top-0 left-0 bottom-0 w-[65mm] border-r border-black p-0.5">
                  <span className="text-[6.5px] font-sans block leading-none sevt-preprinted-text">Priezvisko a meno</span>
                </div>
                <div className="absolute top-0 right-0 bottom-0 w-[32mm] p-0.5">
                  <span className="text-[6.5px] font-sans block leading-none sevt-preprinted-text">Rodné číslo</span>
                </div>
              </div>

              {/* Riadok 3 mriežky: Bydlisko */}
              <div className="absolute top-[35mm] left-[4mm] right-[4mm] h-[9mm] border-x-2 border-b-2 border-black p-0.5">
                <span className="text-[6.5px] font-sans block leading-none sevt-preprinted-text">Bydlisko</span>
              </div>

              {/* Hlavná časť: Rp. 1 a Rp. 2 (vľavo) | Tabuľka Uhradí (vpravo) */}
              <div className="absolute top-[44mm] left-[4mm] right-[4mm] h-[92mm] border-x-2 border-b-2 border-black">
                
                {/* Ľavá časť: Rp. predpis */}
                <div className="absolute top-0 left-0 bottom-0 right-[31mm] border-r-2 border-black p-1">
                  
                  {/* Dg 1 riadok mriežky */}
                  <div className="flex items-center justify-between text-[7px] font-sans">
                    <div className="flex items-center gap-1">
                      <span className="sevt-preprinted-text font-bold">Dg.</span>
                      <div className="flex gap-[1px]">
                        {[0, 1, 2, 3].map(i => (
                          <div key={i} className="w-[3.2mm] h-[3.8mm] border border-black bg-white"></div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="sevt-preprinted-text font-bold">Kód</span>
                      <div className="flex gap-[1px]">
                        {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
                          <div key={i} className="w-[2.2mm] h-[3.8mm] border border-black bg-white"></div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Rp. nápis 1 */}
                  <div className="font-serif font-bold text-base leading-none sevt-preprinted-text mt-1">
                    Rp.
                  </div>

                  {/* Dg 2 riadok mriežky */}
                  <div className="absolute top-[46mm] left-1 right-1 border-t border-dashed border-black pt-1 flex items-center justify-between text-[7px] font-sans">
                    <div className="flex items-center gap-1">
                      <span className="sevt-preprinted-text font-bold">Dg.</span>
                      <div className="flex gap-[1px]">
                        {[0, 1, 2, 3].map(i => (
                          <div key={i} className="w-[3.2mm] h-[3.8mm] border border-black bg-white"></div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="sevt-preprinted-text font-bold">Kód</span>
                      <div className="flex gap-[1px]">
                        {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
                          <div key={i} className="w-[2.2mm] h-[3.8mm] border border-black bg-white"></div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Rp. nápis 2 */}
                  <div className="absolute top-[53mm] left-1 font-serif font-bold text-base leading-none sevt-preprinted-text">
                    Rp.
                  </div>

                  {/* Spodok ľavej strany: Dňa & Pečiatka */}
                  <div className="absolute bottom-1 left-1 right-1">
                    <div className="flex justify-between items-baseline text-[7.5px] font-sans">
                      <span className="sevt-preprinted-text">Dňa:</span>
                      <span className="sevt-preprinted-text">Spolu</span>
                    </div>
                    <div className="mt-1 text-center">
                      <div className="text-[6.5px] font-sans uppercase sevt-preprinted-text">
                        ...........................................................................<br />
                        odtlačok pečiatky a podpis lekára
                      </div>
                    </div>
                  </div>

                </div>

                {/* Pravá časť: Tabuľka Uhradí */}
                <div className="absolute top-0 right-0 bottom-0 w-[31mm]">
                  <div className="border-b border-black text-center font-sans font-bold text-[8px] py-0.5 tracking-[2px] sevt-preprinted-text">
                    U h r a d í
                  </div>
                  <div className="grid grid-cols-2 border-b border-black text-center text-[6px] font-sans sevt-preprinted-text">
                    <div className="border-r border-black p-0.5">
                      <div>poisťovňa</div>
                      <div className="grid grid-cols-2 border-t border-black text-[5px] pt-0.5">
                        <span className="border-r border-black">euro</span>
                        <span>cent</span>
                      </div>
                    </div>
                    <div className="p-0.5">
                      <div>pacient</div>
                      <div className="grid grid-cols-2 border-t border-black text-[5px] pt-0.5">
                        <span className="border-r border-black">euro</span>
                        <span>cent</span>
                      </div>
                    </div>
                  </div>

                  {/* Riadky pre lekáreň */}
                  <div className="h-[46mm] grid grid-cols-4 border-b border-black">
                    <div className="border-r border-black"></div>
                    <div className="border-r-2 border-black"></div>
                    <div className="border-r border-black"></div>
                    <div></div>
                  </div>

                  {/* Por. číslo predpisu */}
                  <div className="p-1">
                    <span className="text-[6px] font-sans block leading-none sevt-preprinted-text">
                      Por. číslo predpisu
                    </span>
                  </div>
                </div>

              </div>

              {/* Dolná pätička (5 buniek pre lekáreň) */}
              <div className="absolute top-[136mm] left-[4mm] right-[4mm] h-[7mm] border-x-2 border-b-2 border-black grid grid-cols-5 text-center text-[6px] font-sans sevt-preprinted-text">
                <div className="border-r border-black flex items-center justify-center">Prijal</div>
                <div className="border-r border-black flex items-center justify-center">Pripravil</div>
                <div className="border-r border-black flex items-center justify-center">Spolupracoval</div>
                <div className="border-r border-black flex items-center justify-center">Expedoval</div>
                <div className="flex items-center justify-center">Dátum</div>
              </div>

              {/* Päta ŠEVT */}
              <div className="absolute top-[143.5mm] left-[4mm] right-[4mm] flex justify-between text-[5.5px] font-sans sevt-preprinted-text">
                <span>14 282 2s Design © Ševt</span>
                <span>SAY CLINIC BB</span>
              </div>

            </div>

            {/* ========================================================================= */}
            {/* DYNAMICKÝ TEXT TLAČENÝ PRESNE NA POZÍCIE FORMULÁRA (ZODPOVEDÁ PREDLOHE)  */}
            {/* ========================================================================= */}
            
            {/* 1. KÓD LEKÁRA (Hore vpravo) */}
            <div 
              className="absolute sevt-dynamic-value text-right font-mono font-bold text-[10.5px] tracking-wider"
              style={{
                top: '9.5mm',
                right: '7mm',
                width: '30mm'
              }}
            >
              {doctorCode}
            </div>

            {/* 2. ZDRAVOTNÁ POISŤOVŇA (4 okienka v strede hore: napr. "2 5 0 0") */}
            <div 
              className="absolute sevt-dynamic-value font-mono font-bold text-[10.5px] flex justify-center items-center"
              style={{
                top: '19.8mm',
                left: '28mm',
                width: '49mm',
                letterSpacing: '0.45rem'
              }}
            >
              {insBoxes.join(' ')}
            </div>

            {/* 3. PACIENT A RODNÉ ČÍSLO (Riadok pod hlavičkou) */}
            <div 
              className="absolute sevt-dynamic-value font-mono font-bold text-[10.5px] uppercase tracking-wide truncate"
              style={{
                top: '29.5mm',
                left: '6mm',
                width: '62mm'
              }}
            >
              {patientName}
            </div>

            <div 
              className="absolute sevt-dynamic-value font-mono font-bold text-[10.5px] tracking-wider text-right"
              style={{
                top: '29.5mm',
                right: '7mm',
                width: '30mm'
              }}
            >
              {birthNumber}
            </div>

            {/* 4. BYDLISKO */}
            <div 
              className="absolute sevt-dynamic-value font-mono font-normal text-[10px] uppercase tracking-wide truncate"
              style={{
                top: '38.5mm',
                left: '6mm',
                width: '93mm'
              }}
            >
              {address}
            </div>

            {/* 5. DIAGNÓZA 1 (MKCH-10 v 4 okienkach: napr. "Z  4  1  1") */}
            <div 
              className="absolute sevt-dynamic-value font-mono font-bold text-[10px] tracking-widest flex items-center"
              style={{
                top: '44.8mm',
                left: '11.5mm',
                letterSpacing: '0.35rem'
              }}
            >
              {dgBoxes1.join(' ')}
            </div>

            {/* 6. LIEK 1 - PRESNÉ RIADKY PODĽA PREDLOHY */}
            <div 
              className="absolute sevt-dynamic-value font-mono text-[10px] leading-[1.3] text-black"
              style={{
                top: '55mm',
                left: '6mm',
                width: '65mm'
              }}
            >
              {items[0] && (
                <div className="space-y-[1px]">
                  {/* Riadok 1: Účinná látka */}
                  <div className="font-bold text-[10.5px]">
                    {items[0].substance || items[0].latinName}
                  </div>
                  {/* Riadok 2: Forma a sila */}
                  {items[0].formAndStrength && (
                    <div className="text-[9.5px]">
                      {items[0].formAndStrength}
                    </div>
                  )}
                  {/* Riadok 3: Počet balení */}
                  <div className="font-bold text-[9.5px]">
                    {items[0].packaging}
                  </div>
                  {/* Riadok 4: Dávkovanie D.S. */}
                  <div className="text-[9.5px]">
                    {items[0].dosage}
                  </div>
                  {/* Riadok 5: Obchodný názov v zátvorke */}
                  {items[0].commercialName && (
                    <div className="text-[9.5px]">
                      ({items[0].commercialName.replace(/^\(|\)$/g, '')})
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 7. LIEK 2 (AK JE PRÍTOMNÝ) */}
            {items[1] && (
              <>
                {/* Dg 2 okienka */}
                <div 
                  className="absolute sevt-dynamic-value font-mono font-bold text-[10px] tracking-widest flex items-center"
                  style={{
                    top: '90.5mm',
                    left: '11.5mm',
                    letterSpacing: '0.35rem'
                  }}
                >
                  {dgBoxes2.join(' ')}
                </div>

                <div 
                  className="absolute sevt-dynamic-value font-mono text-[10px] leading-[1.3] text-black"
                  style={{
                    top: '97mm',
                    left: '6mm',
                    width: '65mm'
                  }}
                >
                  <div className="space-y-[1px]">
                    <div className="font-bold text-[10.5px]">
                      {items[1].substance || items[1].latinName}
                    </div>
                    {items[1].formAndStrength && (
                      <div className="text-[9.5px]">
                        {items[1].formAndStrength}
                      </div>
                    )}
                    <div className="font-bold text-[9.5px]">
                      {items[1].packaging}
                    </div>
                    <div className="text-[9.5px]">
                      {items[1].dosage}
                    </div>
                    {items[1].commercialName && (
                      <div className="text-[9.5px]">
                        ({items[1].commercialName.replace(/^\(|\)$/g, '')})
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* 8. DÁTUM VYSTAVENIA (Dňa:) */}
            <div 
              className="absolute sevt-dynamic-value font-mono font-bold text-[10px] tracking-wider"
              style={{
                top: '127mm',
                left: '6mm'
              }}
            >
              {prescriptionDate}
            </div>

            {/* 9. PORADOVÉ ČÍSLO PREDPISU (vpravo dole) */}
            {prescriptionOrderNumber && (
              <div 
                className="absolute sevt-dynamic-value font-mono font-bold text-[9px] text-center"
                style={{
                  top: '130mm',
                  right: '6mm',
                  width: '27mm'
                }}
              >
                {prescriptionOrderNumber}
              </div>
            )}

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
