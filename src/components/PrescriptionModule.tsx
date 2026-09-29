'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  PrescribedMedication, 
  MEDICATION_CATALOG, 
  CATEGORY_LABELS, 
  CLINIC_PRESCRIPTION_DEFAULTS 
} from '../data/prescriptionCatalog';
import {
  PrescriptionCalibration,
  DEFAULT_PRESCRIPTION_CALIBRATION,
  CALIBRATION_PRESETS,
  getFontFamilyCss
} from '../data/prescriptionCalibration';
import { exportElementToPdf, generatePdfFilename } from '../lib/pdfGenerator';
import { Plus, Trash2 } from './Icons';
import { 
  Sliders, 
  Type, 
  Move, 
  RotateCcw, 
  Save, 
  Printer, 
  Eye, 
  FileText, 
  Sparkles, 
  Check, 
  CheckCircle2, 
  Grid,
  Baseline,
  Maximize2,
  ZoomIn,
  ZoomOut,
  SlidersHorizontal,
  Edit3,
  Bookmark,
  Download,
  Upload,
  ListOrdered,
  FileEdit,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

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

  // Kalibrácia posunu a písma
  const [calibration, setCalibration] = useState<PrescriptionCalibration>(DEFAULT_PRESCRIPTION_CALIBRATION);
  const [showCalibration, setShowCalibration] = useState<boolean>(false);
  const [calibrationTab, setCalibrationTab] = useState<'font' | 'positions' | 'format' | 'presets'>('font');
  const [showGuidelines, setShowGuidelines] = useState<boolean>(false);
  const [calibrationToast, setCalibrationToast] = useState<string | null>(null);
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [customProfileName, setCustomProfileName] = useState<string>('');
  const [savedUserProfiles, setSavedUserProfiles] = useState<Array<{ id: string; name: string; date: string; config: PrescriptionCalibration }>>([]);

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

  // Načítanie kalibrácie a uložených profilov z localStorage
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('say_clinic_rx_calibration_config_v2');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        setCalibration(prev => ({ ...prev, ...parsed }));
      } else {
        const savedX = localStorage.getItem('say_clinic_rx_offset_x');
        const savedY = localStorage.getItem('say_clinic_rx_offset_y');
        if (savedX !== null || savedY !== null) {
          setCalibration(prev => ({
            ...prev,
            offsetX: savedX !== null ? (parseFloat(savedX) || 0) : prev.offsetX,
            offsetY: savedY !== null ? (parseFloat(savedY) || 0) : prev.offsetY,
          }));
        }
      }
      const savedMode = localStorage.getItem('say_clinic_rx_print_mode');
      if (savedMode === 'full' || savedMode === 'preprinted') setPrintMode(savedMode);

      const savedProfiles = localStorage.getItem('say_clinic_rx_custom_profiles_v2');
      if (savedProfiles) {
        setSavedUserProfiles(JSON.parse(savedProfiles));
      }
    } catch {
      // ignore
    }
  }, []);

  // Pomocná funkcia pre aktualizáciu kalibrácie a okamžité uloženie
  const updateCalibration = (updates: Partial<PrescriptionCalibration>) => {
    setCalibration(prev => {
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem('say_clinic_rx_calibration_config_v2', JSON.stringify(updated));
        localStorage.setItem('say_clinic_rx_offset_x', updated.offsetX.toString());
        localStorage.setItem('say_clinic_rx_offset_y', updated.offsetY.toString());
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Posun papiera po 0.5 mm (Nudge)
  const handleNudge = (axis: 'x' | 'y', amount: number) => {
    if (axis === 'x') {
      const newX = Math.round((calibration.offsetX + amount) * 10) / 10;
      updateCalibration({ offsetX: newX });
      setCalibrationToast(`Posun X: ${newX > 0 ? `+${newX}` : newX} mm`);
    } else {
      const newY = Math.round((calibration.offsetY + amount) * 10) / 10;
      updateCalibration({ offsetY: newY });
      setCalibrationToast(`Posun Y: ${newY > 0 ? `+${newY}` : newY} mm`);
    }
    setTimeout(() => setCalibrationToast(null), 1800);
  };

  // Zmena celkovej mierky písma
  const handleQuickFontScale = (delta: number) => {
    const newScale = Math.min(150, Math.max(65, calibration.fontScale + delta));
    updateCalibration({ fontScale: newScale });
    setCalibrationToast(`Veľkosť písma: ${newScale}%`);
    setTimeout(() => setCalibrationToast(null), 1800);
  };

  // Aplikovanie predvoľby (Preset)
  const handleApplyPreset = (presetId: string) => {
    const preset = CALIBRATION_PRESETS.find(p => p.id === presetId);
    if (preset) {
      updateCalibration(preset.config);
      setCalibrationToast(`Aplikovaný profil: ${preset.name}`);
      setTimeout(() => setCalibrationToast(null), 3000);
    }
  };

  // Resetovanie na výrobné nastavenia ŠEVT
  const handleResetCalibration = () => {
    updateCalibration(DEFAULT_PRESCRIPTION_CALIBRATION);
    setCalibrationToast('Kalibrácia bola resetovaná na predvolené rozmery ŠEVT');
    setTimeout(() => setCalibrationToast(null), 3000);
  };

  // Manuálne uloženie (pre potvrdenie v UI)
  const handleSaveCalibrationExplicit = () => {
    try {
      localStorage.setItem('say_clinic_rx_calibration_config_v2', JSON.stringify(calibration));
      localStorage.setItem('say_clinic_rx_offset_x', calibration.offsetX.toString());
      localStorage.setItem('say_clinic_rx_offset_y', calibration.offsetY.toString());
      setCalibrationToast('Kalibrácia bola úspešne uložená pre vašu tlačiareň');
      setTimeout(() => setCalibrationToast(null), 3000);
    } catch {
      // ignore
    }
  };

  // Uloženie nového vlastného profilu tlačiarne
  const handleSaveCustomProfile = () => {
    const name = customProfileName.trim() || `Profil tlačiarne ${new Date().toLocaleDateString('sk-SK')}`;
    const newProfile = {
      id: `profile-${Date.now()}`,
      name,
      date: new Date().toLocaleDateString('sk-SK'),
      config: { ...calibration }
    };
    const updated = [newProfile, ...savedUserProfiles];
    setSavedUserProfiles(updated);
    setCustomProfileName('');
    try {
      localStorage.setItem('say_clinic_rx_custom_profiles_v2', JSON.stringify(updated));
    } catch {
      // ignore
    }
    setCalibrationToast(`Vlastný profil "${name}" bol úspešne uložený`);
    setTimeout(() => setCalibrationToast(null), 3000);
  };

  // Zmazanie vlastného profilu
  const handleDeleteCustomProfile = (id: string, name: string) => {
    const updated = savedUserProfiles.filter(p => p.id !== id);
    setSavedUserProfiles(updated);
    try {
      localStorage.setItem('say_clinic_rx_custom_profiles_v2', JSON.stringify(updated));
    } catch {
      // ignore
    }
    setCalibrationToast(`Profil "${name}" bol odstránený`);
    setTimeout(() => setCalibrationToast(null), 2500);
  };

  // Aplikovanie vlastného profilu
  const handleApplyCustomProfile = (profile: { name: string; config: Partial<PrescriptionCalibration> }) => {
    updateCalibration(profile.config);
    setCalibrationToast(`Aplikovaný vlastný profil: ${profile.name}`);
    setTimeout(() => setCalibrationToast(null), 3000);
  };

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

  // Kalibračné prepočty typografie a štýlu
  const baseFontFamily = getFontFamilyCss(calibration.fontFamily);
  const fontMultiplier = calibration.fontScale / 100;
  const fontWeightVal = calibration.fontWeight === 'bold' ? '700' : calibration.fontWeight === 'semibold' ? '600' : '400';

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
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: 105mm 148mm portrait !important;
          margin: 0mm !important;
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            width: 105mm !important;
            height: 148mm !important;
          }
          body * {
            visibility: hidden !important;
          }
          #sevt-a6-prescription-document,
          #sevt-a6-prescription-document * {
            visibility: visible !important;
          }
          #sevt-a6-prescription-document {
            position: absolute !important;
            left: 0mm !important;
            top: 0mm !important;
            width: 105mm !important;
            height: 148mm !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
            font-family: ${baseFontFamily} !important;
          }
          .sevt-dynamic-container {
            position: absolute !important;
            left: ${calibration.offsetX}mm !important;
            top: ${calibration.offsetY}mm !important;
            width: 105mm !important;
            height: 148mm !important;
            margin: 0 !important;
            padding: 0 !important;
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
      ` }} />

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
              <FileText className="w-3.5 h-3.5" />
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
              <Printer className="w-3.5 h-3.5" />
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
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
              showCalibration 
                ? 'bg-[#C5A059] text-white border-[#B38F46] shadow-md ring-2 ring-[#C5A059]/30' 
                : 'bg-[#FBF9F6] hover:bg-[#E8E2D9] border-[#E8E2D9] text-[#2C2A29]'
            }`}
            title="Manuálna kalibrácia písma, rozmerov a pozícií tlače"
          >
            <Sliders className={`w-4 h-4 ${showCalibration ? 'text-white' : 'text-[#C5A059]'}`} />
            <span>Kalibrácia písma & rozmerov</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${showCalibration ? 'bg-black/20 text-white' : 'bg-[#E8E2D9] text-[#2C2A29]'}`}>
              {calibration.fontScale}%
            </span>
          </button>
        </div>
      </div>

      {/* NOTIFIKÁCIA O ULOŽENÍ KALIBRÁCIE */}
      {calibrationToast && (
        <div className="bg-[#047857] text-white px-4 py-2.5 rounded-xl flex items-center justify-between shadow-md animate-fade-in text-xs font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>{calibrationToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setCalibrationToast(null)}
            className="text-white/80 hover:text-white uppercase text-[10px] font-bold cursor-pointer"
          >
            OK
          </button>
        </div>
      )}

      {/* KALIBRAČNÝ PANEL (INTERAKTÍVNA KALIBRÁCIA PÍSMA A POZÍCIÍ) */}
      {showCalibration && (
        <div className="bg-[#FAF8F5] border-2 border-[#C5A059]/60 p-5 rounded-2xl shadow-lg print:hidden animate-fade-in space-y-4">
          
          {/* HLAVIČKA KALIBRAČNÉHO PANELU + TABY */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#E8E2D9] pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[#C5A059]/20 text-[#C5A059] rounded-lg">
                <Sliders className="w-4 h-4" />
              </span>
              <div>
                <h4 className="font-bold text-xs text-[#2C2A29] uppercase tracking-wider">
                  Manuálna kalibrácia písma a tlačovej šablóny
                </h4>
                <p className="text-[10px] text-[#8C857B]">
                  Zmeny sa okamžite premietajú v náhľade vpravo a ukladajú do pamäte prehliadača
                </p>
              </div>
            </div>

            {/* TABY */}
            <div className="flex flex-wrap items-center bg-white p-1 rounded-xl border border-[#E8E2D9] text-xs gap-1">
              <button
                type="button"
                onClick={() => setCalibrationTab('font')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  calibrationTab === 'font'
                    ? 'bg-[#2C2A29] text-white shadow-xs'
                    : 'text-[#8C857B] hover:text-[#2C2A29]'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                <span>🔤 Veľkosť písma & Typografia</span>
              </button>
              <button
                type="button"
                onClick={() => setCalibrationTab('positions')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  calibrationTab === 'positions'
                    ? 'bg-[#2C2A29] text-white shadow-xs'
                    : 'text-[#8C857B] hover:text-[#2C2A29]'
                }`}
              >
                <Move className="w-3.5 h-3.5" />
                <span>📐 Uloženie & Pozície (mm)</span>
              </button>
              <button
                type="button"
                onClick={() => setCalibrationTab('format')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  calibrationTab === 'format'
                    ? 'bg-[#2C2A29] text-white shadow-xs'
                    : 'text-[#8C857B] hover:text-[#2C2A29]'
                }`}
              >
                <FileEdit className="w-3.5 h-3.5" />
                <span>📝 Formát textu Rp.</span>
              </button>
              <button
                type="button"
                onClick={() => setCalibrationTab('presets')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  calibrationTab === 'presets'
                    ? 'bg-[#2C2A29] text-white shadow-xs'
                    : 'text-[#8C857B] hover:text-[#2C2A29]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>⚡ Profily tlačiarní</span>
              </button>
            </div>
          </div>

          {/* TAB 1: PÍSMO & FORMÁT */}
          {calibrationTab === 'font' && (
            <div className="space-y-4 animate-fade-in text-xs">
              
              {/* VÝBER FONTU & CELKOVÁ MIERKA */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-3.5 rounded-xl border border-[#E8E2D9]">
                <div>
                  <label className="block text-[11px] font-bold text-[#2C2A29] mb-1.5">
                    Typ písma (Rodina fontu):
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateCalibration({ fontFamily: 'monospace' })}
                      className={`py-2 px-2 rounded-lg font-mono text-[11px] font-bold border transition-all cursor-pointer text-center ${
                        calibration.fontFamily === 'monospace'
                          ? 'bg-[#2C2A29] text-white border-[#2C2A29] shadow-xs'
                          : 'bg-[#FBF9F6] text-[#2C2A29] border-[#E8E2D9] hover:bg-[#E8E2D9]'
                      }`}
                      title="Neproporcionálny font (Courier New, Consolas) - overená klasika pre ŠEVT"
                    >
                      Strojopis
                    </button>
                    <button
                      type="button"
                      onClick={() => updateCalibration({ fontFamily: 'sans-serif' })}
                      className={`py-2 px-2 rounded-lg font-sans text-[11px] font-bold border transition-all cursor-pointer text-center ${
                        calibration.fontFamily === 'sans-serif'
                          ? 'bg-[#2C2A29] text-white border-[#2C2A29] shadow-xs'
                          : 'bg-[#FBF9F6] text-[#2C2A29] border-[#E8E2D9] hover:bg-[#E8E2D9]'
                      }`}
                      title="Hladký bezpätkový font (Arial, Segoe UI) - čistý moderný vzhľad"
                    >
                      Arial / Sans
                    </button>
                    <button
                      type="button"
                      onClick={() => updateCalibration({ fontFamily: 'serif' })}
                      className={`py-2 px-2 rounded-lg font-serif text-[11px] font-bold border transition-all cursor-pointer text-center ${
                        calibration.fontFamily === 'serif'
                          ? 'bg-[#2C2A29] text-white border-[#2C2A29] shadow-xs'
                          : 'bg-[#FBF9F6] text-[#2C2A29] border-[#E8E2D9] hover:bg-[#E8E2D9]'
                      }`}
                      title="Tradičné pätkové písmo (Times New Roman, Georgia)"
                    >
                      Times / Serif
                    </button>
                  </div>
                </div>

                {/* CELKOVÁ MIERKA PÍSMA */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-bold text-[#2C2A29]">
                      Celková mierka písma:
                    </label>
                    <span className="font-mono font-bold text-[#047857] text-xs">
                      {calibration.fontScale}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateCalibration({ fontScale: Math.max(70, calibration.fontScale - 5) })}
                      className="px-2 py-1 bg-[#FBF9F6] hover:bg-[#E8E2D9] border border-[#E8E2D9] rounded font-bold text-xs"
                      title="Zmenšiť písmo o 5%"
                    >
                      -5%
                    </button>
                    <input
                      type="range"
                      min="70"
                      max="140"
                      step="1"
                      value={calibration.fontScale}
                      onChange={e => updateCalibration({ fontScale: parseInt(e.target.value) || 100 })}
                      className="flex-1 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => updateCalibration({ fontScale: Math.min(140, calibration.fontScale + 5) })}
                      className="px-2 py-1 bg-[#FBF9F6] hover:bg-[#E8E2D9] border border-[#E8E2D9] rounded font-bold text-xs"
                      title="Zväčšiť písmo o 5%"
                    >
                      +5%
                    </button>
                  </div>
                </div>

                {/* RIADKOVANIE LIEKU RP. */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-bold text-[#2C2A29]">
                      Riadkovanie lieku (Line Height):
                    </label>
                    <span className="font-mono font-bold text-[#047857] text-xs">
                      {calibration.lineHeight.toFixed(2)}×
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateCalibration({ lineHeight: Math.max(0.9, Math.round((calibration.lineHeight - 0.05) * 100) / 100) })}
                      className="px-2 py-1 bg-[#FBF9F6] hover:bg-[#E8E2D9] border border-[#E8E2D9] rounded font-bold text-xs"
                      title="Tesnejšie riadky"
                    >
                      -0.05
                    </button>
                    <input
                      type="range"
                      min="0.9"
                      max="2.0"
                      step="0.05"
                      value={calibration.lineHeight}
                      onChange={e => updateCalibration({ lineHeight: parseFloat(e.target.value) || 1.25 })}
                      className="flex-1 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => updateCalibration({ lineHeight: Math.min(2.0, Math.round((calibration.lineHeight + 0.05) * 100) / 100) })}
                      className="px-2 py-1 bg-[#FBF9F6] hover:bg-[#E8E2D9] border border-[#E8E2D9] rounded font-bold text-xs"
                      title="Širšie riadky"
                    >
                      +0.05
                    </button>
                  </div>
                </div>
              </div>

              {/* TUČNOSŤ, ROZOSTUP PÍSMA A VEĽKÉ PÍSMENÁ */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-3.5 rounded-xl border border-[#E8E2D9]">
                {/* TUČNOSŤ */}
                <div>
                  <label className="block text-[11px] font-bold text-[#2C2A29] mb-1.5">
                    Hrúbka písma:
                  </label>
                  <div className="flex gap-1.5">
                    {(['normal', 'semibold', 'bold'] as const).map(w => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => updateCalibration({ fontWeight: w })}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer text-center ${
                          calibration.fontWeight === w
                            ? 'bg-[#2C2A29] text-white border-[#2C2A29]'
                            : 'bg-[#FBF9F6] text-[#2C2A29] border-[#E8E2D9] hover:bg-[#E8E2D9]'
                        }`}
                      >
                        {w === 'normal' ? 'Normálne' : w === 'semibold' ? 'Polotučné' : 'Tučné (Bold)'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ROZOSTUP ZNAKOV (LETTER SPACING) */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-bold text-[#2C2A29]">
                      Rozostup znakov (Letter Spacing):
                    </label>
                    <span className="font-mono font-bold text-[#047857] text-xs">
                      {calibration.letterSpacing > 0 ? `+${calibration.letterSpacing}` : calibration.letterSpacing} mm
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="-0.5"
                      max="2.0"
                      step="0.1"
                      value={calibration.letterSpacing}
                      onChange={e => updateCalibration({ letterSpacing: parseFloat(e.target.value) || 0 })}
                      className="flex-1 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => updateCalibration({ letterSpacing: 0 })}
                      className="px-2 py-0.5 bg-[#FBF9F6] hover:bg-[#E8E2D9] border border-[#E8E2D9] rounded text-[10px]"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* PREPÍNAČE FORMÁTU TEXTU */}
                <div>
                  <label className="block text-[11px] font-bold text-[#2C2A29] mb-1.5">
                    Formátovanie textu:
                  </label>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={calibration.uppercasePatient}
                        onChange={e => updateCalibration({ uppercasePatient: e.target.checked })}
                        className="rounded border-[#E8E2D9] text-[#047857] focus:ring-[#047857]"
                      />
                      <span className="text-[11px] text-[#2C2A29]">Pacient VEĽKÝMI PÍSMENAMI</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={calibration.uppercaseMedication}
                        onChange={e => updateCalibration({ uppercaseMedication: e.target.checked })}
                        className="rounded border-[#E8E2D9] text-[#047857] focus:ring-[#047857]"
                      />
                      <span className="text-[11px] text-[#2C2A29]">Účinná látka VEĽKÝMI PÍSMENAMI</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* DETAILNÉ VEĽKOSTI PÍSMA PRE JEDNOTLIVÉ ZÓNY (V PT) */}
              <div className="bg-white p-3.5 rounded-xl border border-[#E8E2D9]">
                <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-wider block mb-2.5">
                  Jemné doladenie veľkosti písma pre konkrétne zóny receptu (pt):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  
                  {/* PACIENT */}
                  <div className="p-2 bg-[#FBF9F6] rounded-lg border border-[#E8E2D9]">
                    <div className="flex justify-between items-center text-[10px] text-[#8C857B] mb-1">
                      <span>Meno pacienta:</span>
                      <span className="font-mono font-bold text-[#2C2A29]">{calibration.patientFontSize} pt</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateCalibration({ patientFontSize: Math.max(7, Math.round((calibration.patientFontSize - 0.5) * 10) / 10) })}
                        className="flex-1 py-1 bg-white border border-[#E8E2D9] rounded font-bold text-xs hover:bg-[#E8E2D9]"
                      >
                        -0.5
                      </button>
                      <button
                        type="button"
                        onClick={() => updateCalibration({ patientFontSize: Math.min(15, Math.round((calibration.patientFontSize + 0.5) * 10) / 10) })}
                        className="flex-1 py-1 bg-white border border-[#E8E2D9] rounded font-bold text-xs hover:bg-[#E8E2D9]"
                      >
                        +0.5
                      </button>
                    </div>
                  </div>

                  {/* RODNÉ ČÍSLO */}
                  <div className="p-2 bg-[#FBF9F6] rounded-lg border border-[#E8E2D9]">
                    <div className="flex justify-between items-center text-[10px] text-[#8C857B] mb-1">
                      <span>Rodné číslo:</span>
                      <span className="font-mono font-bold text-[#2C2A29]">{calibration.birthNumberFontSize || 10.0} pt</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateCalibration({ birthNumberFontSize: Math.max(7, Math.round(((calibration.birthNumberFontSize || 10.0) - 0.5) * 10) / 10) })}
                        className="flex-1 py-1 bg-white border border-[#E8E2D9] rounded font-bold text-xs hover:bg-[#E8E2D9]"
                      >
                        -0.5
                      </button>
                      <button
                        type="button"
                        onClick={() => updateCalibration({ birthNumberFontSize: Math.min(15, Math.round(((calibration.birthNumberFontSize || 10.0) + 0.5) * 10) / 10) })}
                        className="flex-1 py-1 bg-white border border-[#E8E2D9] rounded font-bold text-xs hover:bg-[#E8E2D9]"
                      >
                        +0.5
                      </button>
                    </div>
                  </div>

                  {/* BYDLISKO */}
                  <div className="p-2 bg-[#FBF9F6] rounded-lg border border-[#E8E2D9]">
                    <div className="flex justify-between items-center text-[10px] text-[#8C857B] mb-1">
                      <span>Bydlisko:</span>
                      <span className="font-mono font-bold text-[#2C2A29]">{calibration.addressFontSize || 9.0} pt</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateCalibration({ addressFontSize: Math.max(6.5, Math.round(((calibration.addressFontSize || 9.0) - 0.5) * 10) / 10) })}
                        className="flex-1 py-1 bg-white border border-[#E8E2D9] rounded font-bold text-xs hover:bg-[#E8E2D9]"
                      >
                        -0.5
                      </button>
                      <button
                        type="button"
                        onClick={() => updateCalibration({ addressFontSize: Math.min(13, Math.round(((calibration.addressFontSize || 9.0) + 0.5) * 10) / 10) })}
                        className="flex-1 py-1 bg-white border border-[#E8E2D9] rounded font-bold text-xs hover:bg-[#E8E2D9]"
                      >
                        +0.5
                      </button>
                    </div>
                  </div>

                  {/* ÚČINNÁ LÁTKA */}
                  <div className="p-2 bg-[#FBF9F6] rounded-lg border border-[#E8E2D9]">
                    <div className="flex justify-between items-center text-[10px] text-[#8C857B] mb-1">
                      <span>Liek / Látka (Rp.):</span>
                      <span className="font-mono font-bold text-[#2C2A29]">{calibration.medicationFontSize} pt</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateCalibration({ medicationFontSize: Math.max(7, Math.round((calibration.medicationFontSize - 0.5) * 10) / 10) })}
                        className="flex-1 py-1 bg-white border border-[#E8E2D9] rounded font-bold text-xs hover:bg-[#E8E2D9]"
                      >
                        -0.5
                      </button>
                      <button
                        type="button"
                        onClick={() => updateCalibration({ medicationFontSize: Math.min(15, Math.round((calibration.medicationFontSize + 0.5) * 10) / 10) })}
                        className="flex-1 py-1 bg-white border border-[#E8E2D9] rounded font-bold text-xs hover:bg-[#E8E2D9]"
                      >
                        +0.5
                      </button>
                    </div>
                  </div>

                  {/* FORMA A SILA */}
                  <div className="p-2 bg-[#FBF9F6] rounded-lg border border-[#E8E2D9]">
                    <div className="flex justify-between items-center text-[10px] text-[#8C857B] mb-1">
                      <span>Forma a sila:</span>
                      <span className="font-mono font-bold text-[#2C2A29]">{calibration.formFontSize || 9.5} pt</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateCalibration({ formFontSize: Math.max(6.5, Math.round(((calibration.formFontSize || 9.5) - 0.5) * 10) / 10) })}
                        className="flex-1 py-1 bg-white border border-[#E8E2D9] rounded font-bold text-xs hover:bg-[#E8E2D9]"
                      >
                        -0.5
                      </button>
                      <button
                        type="button"
                        onClick={() => updateCalibration({ formFontSize: Math.min(13, Math.round(((calibration.formFontSize || 9.5) + 0.5) * 10) / 10) })}
                        className="flex-1 py-1 bg-white border border-[#E8E2D9] rounded font-bold text-xs hover:bg-[#E8E2D9]"
                      >
                        +0.5
                      </button>
                    </div>
                  </div>

                  {/* BALENIE */}
                  <div className="p-2 bg-[#FBF9F6] rounded-lg border border-[#E8E2D9]">
                    <div className="flex justify-between items-center text-[10px] text-[#8C857B] mb-1">
                      <span>Balenie (Exp. orig.):</span>
                      <span className="font-mono font-bold text-[#2C2A29]">{calibration.packagingFontSize || 9.5} pt</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateCalibration({ packagingFontSize: Math.max(6.5, Math.round(((calibration.packagingFontSize || 9.5) - 0.5) * 10) / 10) })}
                        className="flex-1 py-1 bg-white border border-[#E8E2D9] rounded font-bold text-xs hover:bg-[#E8E2D9]"
                      >
                        -0.5
                      </button>
                      <button
                        type="button"
                        onClick={() => updateCalibration({ packagingFontSize: Math.min(13, Math.round(((calibration.packagingFontSize || 9.5) + 0.5) * 10) / 10) })}
                        className="flex-1 py-1 bg-white border border-[#E8E2D9] rounded font-bold text-xs hover:bg-[#E8E2D9]"
                      >
                        +0.5
                      </button>
                    </div>
                  </div>

                  {/* DÁVKOVANIE */}
                  <div className="p-2 bg-[#FBF9F6] rounded-lg border border-[#E8E2D9]">
                    <div className="flex justify-between items-center text-[10px] text-[#8C857B] mb-1">
                      <span>Dávkovanie D.S.:</span>
                      <span className="font-mono font-bold text-[#2C2A29]">{calibration.dosageFontSize} pt</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateCalibration({ dosageFontSize: Math.max(6.5, Math.round((calibration.dosageFontSize - 0.5) * 10) / 10) })}
                        className="flex-1 py-1 bg-white border border-[#E8E2D9] rounded font-bold text-xs hover:bg-[#E8E2D9]"
                      >
                        -0.5
                      </button>
                      <button
                        type="button"
                        onClick={() => updateCalibration({ dosageFontSize: Math.min(13, Math.round((calibration.dosageFontSize + 0.5) * 10) / 10) })}
                        className="flex-1 py-1 bg-white border border-[#E8E2D9] rounded font-bold text-xs hover:bg-[#E8E2D9]"
                      >
                        +0.5
                      </button>
                    </div>
                  </div>

                  {/* OBCHODNÝ NÁZOV V ZÁTVORKE */}
                  <div className="p-2 bg-[#FBF9F6] rounded-lg border border-[#E8E2D9]">
                    <div className="flex justify-between items-center text-[10px] text-[#8C857B] mb-1">
                      <span>Obchodný názov:</span>
                      <span className="font-mono font-bold text-[#2C2A29]">{calibration.commercialNameFontSize || 9.0} pt</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateCalibration({ commercialNameFontSize: Math.max(6.5, Math.round(((calibration.commercialNameFontSize || 9.0) - 0.5) * 10) / 10) })}
                        className="flex-1 py-1 bg-white border border-[#E8E2D9] rounded font-bold text-xs hover:bg-[#E8E2D9]"
                      >
                        -0.5
                      </button>
                      <button
                        type="button"
                        onClick={() => updateCalibration({ commercialNameFontSize: Math.min(13, Math.round(((calibration.commercialNameFontSize || 9.0) + 0.5) * 10) / 10) })}
                        className="flex-1 py-1 bg-white border border-[#E8E2D9] rounded font-bold text-xs hover:bg-[#E8E2D9]"
                      >
                        +0.5
                      </button>
                    </div>
                  </div>

                  {/* KÓDY A DIAGNÓZA */}
                  <div className="p-2 bg-[#FBF9F6] rounded-lg border border-[#E8E2D9]">
                    <div className="flex justify-between items-center text-[10px] text-[#8C857B] mb-1">
                      <span>Kódy (Lekár, ZP, Dg):</span>
                      <span className="font-mono font-bold text-[#2C2A29]">{calibration.codesFontSize} pt</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateCalibration({ codesFontSize: Math.max(7, Math.round((calibration.codesFontSize - 0.5) * 10) / 10) })}
                        className="flex-1 py-1 bg-white border border-[#E8E2D9] rounded font-bold text-xs hover:bg-[#E8E2D9]"
                      >
                        -0.5
                      </button>
                      <button
                        type="button"
                        onClick={() => updateCalibration({ codesFontSize: Math.min(14, Math.round((calibration.codesFontSize + 0.5) * 10) / 10) })}
                        className="flex-1 py-1 bg-white border border-[#E8E2D9] rounded font-bold text-xs hover:bg-[#E8E2D9]"
                      >
                        +0.5
                      </button>
                    </div>
                  </div>

                  {/* DÁTUM VYSTAVENIA */}
                  <div className="p-2 bg-[#FBF9F6] rounded-lg border border-[#E8E2D9]">
                    <div className="flex justify-between items-center text-[10px] text-[#8C857B] mb-1">
                      <span>Dátum vystavenia:</span>
                      <span className="font-mono font-bold text-[#2C2A29]">{calibration.dateFontSize || 10.0} pt</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateCalibration({ dateFontSize: Math.max(7, Math.round(((calibration.dateFontSize || 10.0) - 0.5) * 10) / 10) })}
                        className="flex-1 py-1 bg-white border border-[#E8E2D9] rounded font-bold text-xs hover:bg-[#E8E2D9]"
                      >
                        -0.5
                      </button>
                      <button
                        type="button"
                        onClick={() => updateCalibration({ dateFontSize: Math.min(14, Math.round(((calibration.dateFontSize || 10.0) + 0.5) * 10) / 10) })}
                        className="flex-1 py-1 bg-white border border-[#E8E2D9] rounded font-bold text-xs hover:bg-[#E8E2D9]"
                      >
                        +0.5
                      </button>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* TAB 2: POZÍCIE A SÚRADNICE SEKCIÍ (V MM) */}
          {calibrationTab === 'positions' && (
            <div className="space-y-4 animate-fade-in text-xs">
              
              {/* GLOBÁLNY POSUN CELÉHO PAPIERA */}
              <div className="bg-white p-3.5 rounded-xl border border-[#E8E2D9]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] font-bold text-[#2C2A29]">
                    Globálny posun celého výtlačku na papieri (Offset tlačiarne):
                  </span>
                  <span className="text-[10px] text-[#8C857B]">
                    Posunie všetky prvky naraz
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* X POSUN */}
                  <div>
                    <div className="flex justify-between items-center mb-1 text-[11px]">
                      <span>Horizontálne X (Vľavo - / Vpravo +):</span>
                      <span className="font-mono font-bold text-[#047857]">
                        {calibration.offsetX > 0 ? `+${calibration.offsetX}` : calibration.offsetX} mm
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateCalibration({ offsetX: Math.round((calibration.offsetX - 0.5) * 10) / 10 })}
                        className="px-2 py-1 bg-[#FBF9F6] hover:bg-[#E8E2D9] border border-[#E8E2D9] rounded font-bold text-xs"
                      >
                        -0.5mm
                      </button>
                      <input
                        type="range"
                        min="-20"
                        max="20"
                        step="0.5"
                        value={calibration.offsetX}
                        onChange={e => updateCalibration({ offsetX: parseFloat(e.target.value) || 0 })}
                        className="flex-1 cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => updateCalibration({ offsetX: Math.round((calibration.offsetX + 0.5) * 10) / 10 })}
                        className="px-2 py-1 bg-[#FBF9F6] hover:bg-[#E8E2D9] border border-[#E8E2D9] rounded font-bold text-xs"
                      >
                        +0.5mm
                      </button>
                    </div>
                  </div>

                  {/* Y POSUN */}
                  <div>
                    <div className="flex justify-between items-center mb-1 text-[11px]">
                      <span>Vertikálne Y (Hore - / Dole +):</span>
                      <span className="font-mono font-bold text-[#047857]">
                        {calibration.offsetY > 0 ? `+${calibration.offsetY}` : calibration.offsetY} mm
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateCalibration({ offsetY: Math.round((calibration.offsetY - 0.5) * 10) / 10 })}
                        className="px-2 py-1 bg-[#FBF9F6] hover:bg-[#E8E2D9] border border-[#E8E2D9] rounded font-bold text-xs"
                      >
                        -0.5mm
                      </button>
                      <input
                        type="range"
                        min="-20"
                        max="20"
                        step="0.5"
                        value={calibration.offsetY}
                        onChange={e => updateCalibration({ offsetY: parseFloat(e.target.value) || 0 })}
                        className="flex-1 cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => updateCalibration({ offsetY: Math.round((calibration.offsetY + 0.5) * 10) / 10 })}
                        className="px-2 py-1 bg-[#FBF9F6] hover:bg-[#E8E2D9] border border-[#E8E2D9] rounded font-bold text-xs"
                      >
                        +0.5mm
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* JEMNÉ LADENIE JEDNOTLIVÝCH SEKCII */}
              <div className="bg-white p-3.5 rounded-xl border border-[#E8E2D9] space-y-3">
                <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-wider block">
                  Jemné ladenie súradníc konkrétnych polí (v milimetroch od okraja A6):
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* KÓD LEKÁRA */}
                  <div className="p-2.5 bg-[#FBF9F6] rounded-lg border border-[#E8E2D9] space-y-1.5">
                    <span className="font-bold text-[11px] text-[#2C2A29] block">🩺 Kód lekára (Hore vpravo)</span>
                    <div className="flex justify-between items-center text-[10px]">
                      <span>Zhora (Top): <strong className="font-mono">{calibration.doctorCodeTop} mm</strong></span>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => updateCalibration({ doctorCodeTop: Math.round((calibration.doctorCodeTop - 0.5) * 10) / 10 })} className="w-5 h-5 bg-white border rounded font-bold">-</button>
                        <button type="button" onClick={() => updateCalibration({ doctorCodeTop: Math.round((calibration.doctorCodeTop + 0.5) * 10) / 10 })} className="w-5 h-5 bg-white border rounded font-bold">+</button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span>Sprava (Right): <strong className="font-mono">{calibration.doctorCodeRight} mm</strong></span>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => updateCalibration({ doctorCodeRight: Math.round((calibration.doctorCodeRight - 0.5) * 10) / 10 })} className="w-5 h-5 bg-white border rounded font-bold">-</button>
                        <button type="button" onClick={() => updateCalibration({ doctorCodeRight: Math.round((calibration.doctorCodeRight + 0.5) * 10) / 10 })} className="w-5 h-5 bg-white border rounded font-bold">+</button>
                      </div>
                    </div>
                  </div>

                  {/* ZDRAVOTNÁ POISŤOVŇA */}
                  <div className="p-2.5 bg-[#FBF9F6] rounded-lg border border-[#E8E2D9] space-y-1.5">
                    <span className="font-bold text-[11px] text-[#2C2A29] block">🏥 Poisťovňa (4 okienka)</span>
                    <div className="flex justify-between items-center text-[10px]">
                      <span>Zhora (Top): <strong className="font-mono">{calibration.insuranceTop} mm</strong></span>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => updateCalibration({ insuranceTop: Math.round((calibration.insuranceTop - 0.5) * 10) / 10 })} className="w-5 h-5 bg-white border rounded font-bold">-</button>
                        <button type="button" onClick={() => updateCalibration({ insuranceTop: Math.round((calibration.insuranceTop + 0.5) * 10) / 10 })} className="w-5 h-5 bg-white border rounded font-bold">+</button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span>Rozostup okienok: <strong className="font-mono">{calibration.insuranceSpacing.toFixed(2)} rem</strong></span>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => updateCalibration({ insuranceSpacing: Math.round((calibration.insuranceSpacing - 0.05) * 100) / 100 })} className="w-5 h-5 bg-white border rounded font-bold">-</button>
                        <button type="button" onClick={() => updateCalibration({ insuranceSpacing: Math.round((calibration.insuranceSpacing + 0.05) * 100) / 100 })} className="w-5 h-5 bg-white border rounded font-bold">+</button>
                      </div>
                    </div>
                  </div>

                  {/* PACIENT A RODNÉ ČÍSLO */}
                  <div className="p-2.5 bg-[#FBF9F6] rounded-lg border border-[#E8E2D9] space-y-1.5">
                    <span className="font-bold text-[11px] text-[#2C2A29] block">👤 Meno pacienta & RČ</span>
                    <div className="flex justify-between items-center text-[10px]">
                      <span>Zhora (Top): <strong className="font-mono">{calibration.patientTop} mm</strong></span>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => updateCalibration({ patientTop: Math.round((calibration.patientTop - 0.5) * 10) / 10 })} className="w-5 h-5 bg-white border rounded font-bold">-</button>
                        <button type="button" onClick={() => updateCalibration({ patientTop: Math.round((calibration.patientTop + 0.5) * 10) / 10 })} className="w-5 h-5 bg-white border rounded font-bold">+</button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span>Zľava (Left): <strong className="font-mono">{calibration.patientLeft} mm</strong></span>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => updateCalibration({ patientLeft: Math.round((calibration.patientLeft - 0.5) * 10) / 10 })} className="w-5 h-5 bg-white border rounded font-bold">-</button>
                        <button type="button" onClick={() => updateCalibration({ patientLeft: Math.round((calibration.patientLeft + 0.5) * 10) / 10 })} className="w-5 h-5 bg-white border rounded font-bold">+</button>
                      </div>
                    </div>
                  </div>

                  {/* BYDLISKO */}
                  <div className="p-2.5 bg-[#FBF9F6] rounded-lg border border-[#E8E2D9] space-y-1.5">
                    <span className="font-bold text-[11px] text-[#2C2A29] block">🏠 Bydlisko poistenca</span>
                    <div className="flex justify-between items-center text-[10px]">
                      <span>Zhora (Top): <strong className="font-mono">{calibration.addressTop} mm</strong></span>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => updateCalibration({ addressTop: Math.round((calibration.addressTop - 0.5) * 10) / 10 })} className="w-5 h-5 bg-white border rounded font-bold">-</button>
                        <button type="button" onClick={() => updateCalibration({ addressTop: Math.round((calibration.addressTop + 0.5) * 10) / 10 })} className="w-5 h-5 bg-white border rounded font-bold">+</button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span>Zľava (Left): <strong className="font-mono">{calibration.addressLeft} mm</strong></span>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => updateCalibration({ addressLeft: Math.round((calibration.addressLeft - 0.5) * 10) / 10 })} className="w-5 h-5 bg-white border rounded font-bold">-</button>
                        <button type="button" onClick={() => updateCalibration({ addressLeft: Math.round((calibration.addressLeft + 0.5) * 10) / 10 })} className="w-5 h-5 bg-white border rounded font-bold">+</button>
                      </div>
                    </div>
                  </div>

                  {/* DIAGNÓZA 1 */}
                  <div className="p-2.5 bg-[#FBF9F6] rounded-lg border border-[#E8E2D9] space-y-1.5">
                    <span className="font-bold text-[11px] text-[#2C2A29] block">📋 Diagnóza (Dg. okienka)</span>
                    <div className="flex justify-between items-center text-[10px]">
                      <span>Zhora (Top): <strong className="font-mono">{calibration.diagnosisTop} mm</strong></span>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => updateCalibration({ diagnosisTop: Math.round((calibration.diagnosisTop - 0.5) * 10) / 10 })} className="w-5 h-5 bg-white border rounded font-bold">-</button>
                        <button type="button" onClick={() => updateCalibration({ diagnosisTop: Math.round((calibration.diagnosisTop + 0.5) * 10) / 10 })} className="w-5 h-5 bg-white border rounded font-bold">+</button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span>Rozostup okienok Dg.: <strong className="font-mono">{calibration.diagnosisSpacing.toFixed(2)} rem</strong></span>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => updateCalibration({ diagnosisSpacing: Math.round((calibration.diagnosisSpacing - 0.05) * 100) / 100 })} className="w-5 h-5 bg-white border rounded font-bold">-</button>
                        <button type="button" onClick={() => updateCalibration({ diagnosisSpacing: Math.round((calibration.diagnosisSpacing + 0.05) * 100) / 100 })} className="w-5 h-5 bg-white border rounded font-bold">+</button>
                      </div>
                    </div>
                  </div>

                  {/* LIEK RP. 1 */}
                  <div className="p-2.5 bg-[#FBF9F6] rounded-lg border border-[#E8E2D9] space-y-1.5">
                    <span className="font-bold text-[11px] text-[#2C2A29] block">💊 Liek Rp. 1</span>
                    <div className="flex justify-between items-center text-[10px]">
                      <span>Zhora (Top): <strong className="font-mono">{calibration.rp1Top} mm</strong></span>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => updateCalibration({ rp1Top: Math.round((calibration.rp1Top - 0.5) * 10) / 10 })} className="w-5 h-5 bg-white border rounded font-bold">-</button>
                        <button type="button" onClick={() => updateCalibration({ rp1Top: Math.round((calibration.rp1Top + 0.5) * 10) / 10 })} className="w-5 h-5 bg-white border rounded font-bold">+</button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span>Zľava (Left): <strong className="font-mono">{calibration.rp1Left} mm</strong></span>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => updateCalibration({ rp1Left: Math.round((calibration.rp1Left - 0.5) * 10) / 10 })} className="w-5 h-5 bg-white border rounded font-bold">-</button>
                        <button type="button" onClick={() => updateCalibration({ rp1Left: Math.round((calibration.rp1Left + 0.5) * 10) / 10 })} className="w-5 h-5 bg-white border rounded font-bold">+</button>
                      </div>
                    </div>
                  </div>

                  {/* LIEK RP. 2 */}
                  <div className="p-2.5 bg-[#FBF9F6] rounded-lg border border-[#E8E2D9] space-y-1.5">
                    <span className="font-bold text-[11px] text-[#2C2A29] block">💊 Liek Rp. 2</span>
                    <div className="flex justify-between items-center text-[10px]">
                      <span>Zhora (Top): <strong className="font-mono">{calibration.rp2Top} mm</strong></span>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => updateCalibration({ rp2Top: Math.round((calibration.rp2Top - 0.5) * 10) / 10 })} className="w-5 h-5 bg-white border rounded font-bold">-</button>
                        <button type="button" onClick={() => updateCalibration({ rp2Top: Math.round((calibration.rp2Top + 0.5) * 10) / 10 })} className="w-5 h-5 bg-white border rounded font-bold">+</button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span>Zľava (Left): <strong className="font-mono">{calibration.rp2Left} mm</strong></span>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => updateCalibration({ rp2Left: Math.round((calibration.rp2Left - 0.5) * 10) / 10 })} className="w-5 h-5 bg-white border rounded font-bold">-</button>
                        <button type="button" onClick={() => updateCalibration({ rp2Left: Math.round((calibration.rp2Left + 0.5) * 10) / 10 })} className="w-5 h-5 bg-white border rounded font-bold">+</button>
                      </div>
                    </div>
                  </div>

                  {/* DÁTUM VYSTAVENIA */}
                  <div className="p-2.5 bg-[#FBF9F6] rounded-lg border border-[#E8E2D9] space-y-1.5">
                    <span className="font-bold text-[11px] text-[#2C2A29] block">📅 Dátum vystavenia</span>
                    <div className="flex justify-between items-center text-[10px]">
                      <span>Zhora (Top): <strong className="font-mono">{calibration.dateTop} mm</strong></span>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => updateCalibration({ dateTop: Math.round((calibration.dateTop - 0.5) * 10) / 10 })} className="w-5 h-5 bg-white border rounded font-bold">-</button>
                        <button type="button" onClick={() => updateCalibration({ dateTop: Math.round((calibration.dateTop + 0.5) * 10) / 10 })} className="w-5 h-5 bg-white border rounded font-bold">+</button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span>Zľava (Left): <strong className="font-mono">{calibration.dateLeft} mm</strong></span>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => updateCalibration({ dateLeft: Math.round((calibration.dateLeft - 0.5) * 10) / 10 })} className="w-5 h-5 bg-white border rounded font-bold">-</button>
                        <button type="button" onClick={() => updateCalibration({ dateLeft: Math.round((calibration.dateLeft + 0.5) * 10) / 10 })} className="w-5 h-5 bg-white border rounded font-bold">+</button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* TAB 3: FORMÁTOVANIE TEXTU RP. */}
          {calibrationTab === 'format' && (
            <div className="space-y-4 animate-fade-in text-xs">
              <div className="bg-white p-4 rounded-xl border border-[#E8E2D9] space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-bold text-xs text-[#2C2A29]">
                      Štýl a štruktúra predpisu liekov (Rp. 1 a Rp. 2)
                    </h5>
                    <p className="text-[11px] text-[#8C857B]">
                      Vyberte, ako sa má skladať text účinnej látky, formy, sily, balenia a dávkovania na tlačive
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-[#FAF4E8] text-[#C5A059] border border-[#C5A059]/30">
                    Slovenský vzor ŠEVT
                  </span>
                </div>

                {/* VOĽBA ROZLOŽENIA */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => updateCalibration({ rpFormatStyle: 'classic', useCustomRpText: false })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      calibration.rpFormatStyle === 'classic' && !calibration.useCustomRpText
                        ? 'border-[#047857] bg-[#047857]/5 ring-1 ring-[#047857]'
                        : 'border-[#E8E2D9] bg-[#FBF9F6] hover:bg-[#E8E2D9]'
                    }`}
                  >
                    <span className="font-bold text-xs text-[#2C2A29] block">1. Klasický rozpis (Odporúčané)</span>
                    <span className="text-[10px] text-[#8C857B] block mt-1 leading-snug">
                      Každá položka na vlastnom riadku: Látka, Forma+Sila, Balenie Exp. orig., Dávkovanie D.S.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateCalibration({ rpFormatStyle: 'compact', useCustomRpText: false })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      calibration.rpFormatStyle === 'compact' && !calibration.useCustomRpText
                        ? 'border-[#047857] bg-[#047857]/5 ring-1 ring-[#047857]'
                        : 'border-[#E8E2D9] bg-[#FBF9F6] hover:bg-[#E8E2D9]'
                    }`}
                  >
                    <span className="font-bold text-xs text-[#2C2A29] block">2. Kompaktný lekársky</span>
                    <span className="text-[10px] text-[#8C857B] block mt-1 leading-snug">
                      Zlúčená látka so silou na 1. riadku, balenie a dávkovanie úsporne pre dlhé názvy liekov.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateCalibration({ useCustomRpText: true })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      calibration.useCustomRpText
                        ? 'border-[#C5A059] bg-[#FAF4E8] ring-1 ring-[#C5A059]'
                        : 'border-[#E8E2D9] bg-[#FBF9F6] hover:bg-[#E8E2D9]'
                    }`}
                  >
                    <span className="font-bold text-xs text-[#2C2A29] block">3. Vlastný text (Voľný editor)</span>
                    <span className="text-[10px] text-[#8C857B] block mt-1 leading-snug">
                      Umožňuje priamo napísať presné riadky a text tak, ako ich potrebujete na papieri.
                    </span>
                  </button>
                </div>

                {/* VOĽNÝ TEXTOVÝ EDITOR PRE RP. 1 A RP. 2 */}
                {calibration.useCustomRpText && (
                  <div className="mt-4 p-3.5 bg-[#FAF8F5] rounded-xl border border-[#C5A059]/40 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs text-[#2C2A29] flex items-center gap-1.5">
                        <Edit3 className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>Priamy editor riadkov liekov (Zalomenie riadkov Enterom sa prenesie do receptu):</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const rp1Default = items[0] 
                            ? `${items[0].substance || items[0].latinName}\n${items[0].formAndStrength || ''}\n${items[0].packaging || ''}\n${items[0].dosage || ''}${items[0].commercialName ? `\n(${items[0].commercialName})` : ''}`
                            : '';
                          const rp2Default = items[1] 
                            ? `${items[1].substance || items[1].latinName}\n${items[1].formAndStrength || ''}\n${items[1].packaging || ''}\n${items[1].dosage || ''}${items[1].commercialName ? `\n(${items[1].commercialName})` : ''}`
                            : '';
                          updateCalibration({ customRp1Text: rp1Default, customRp2Text: rp2Default });
                        }}
                        className="text-[10px] font-bold text-[#047857] hover:underline cursor-pointer"
                      >
                        🔄 Vygenerovať z aktuálnych liekov
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-[#2C2A29] mb-1">
                          Liek Rp. 1 (Text na papieri):
                        </label>
                        <textarea
                          rows={5}
                          value={calibration.customRp1Text || ''}
                          onChange={e => updateCalibration({ customRp1Text: e.target.value })}
                          placeholder={"Názov látky\nForma a sila\nExp. orig. No I\nD.S. 1 tbl denne"}
                          className="w-full p-2.5 bg-white border border-[#E8E2D9] rounded-lg font-mono text-xs focus:ring-1 focus:ring-[#C5A059] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#2C2A29] mb-1">
                          Liek Rp. 2 (Text na papieri - ak existuje):
                        </label>
                        <textarea
                          rows={5}
                          value={calibration.customRp2Text || ''}
                          onChange={e => updateCalibration({ customRp2Text: e.target.value })}
                          placeholder={"Názov 2. látky\nForma a sila\nExp. orig. No I\nD.S."}
                          className="w-full p-2.5 bg-white border border-[#E8E2D9] rounded-lg font-mono text-xs focus:ring-1 focus:ring-[#C5A059] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: PROFILY TLAČIARNÍ & ZÁLOHA */}
          {calibrationTab === 'presets' && (
            <div className="space-y-4 animate-fade-in text-xs">
              
              {/* ULOŽENIE VLASTNÉHO PROFILU */}
              <div className="bg-white p-3.5 rounded-xl border border-[#E8E2D9] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex-1 w-full sm:w-auto">
                  <label className="block font-bold text-xs text-[#2C2A29] mb-1">
                    💾 Uložiť aktuálne vyladené nastavenie ako vlastný profil:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customProfileName}
                      onChange={e => setCustomProfileName(e.target.value)}
                      placeholder="napr. HP LaserJet Ordinácia 1 alebo Brother podávač"
                      className="flex-1 p-2 bg-[#FBF9F6] border border-[#E8E2D9] rounded-lg text-xs outline-none focus:border-[#C5A059]"
                    />
                    <button
                      type="button"
                      onClick={handleSaveCustomProfile}
                      className="px-3 py-2 bg-[#047857] hover:bg-[#065f46] text-white rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1.5 transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Uložiť profil</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* VLASTNÉ ULOŽENÉ PROFILY */}
              {savedUserProfiles.length > 0 && (
                <div className="bg-white p-3.5 rounded-xl border border-[#E8E2D9] space-y-2">
                  <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-wider block">
                    Vaše uložené profily:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {savedUserProfiles.map(p => (
                      <div key={p.id} className="p-2.5 bg-[#FBF9F6] rounded-lg border border-[#E8E2D9] flex items-center justify-between">
                        <div className="truncate mr-2">
                          <span className="font-bold text-xs text-[#2C2A29] block truncate">{p.name}</span>
                          <span className="text-[9px] text-[#8C857B]">{p.date} • Písmo {p.config.fontScale || 100}%</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleApplyCustomProfile(p)}
                            className="px-2 py-1 bg-white hover:bg-[#2C2A29] text-[#2C2A29] hover:text-white border border-[#E8E2D9] rounded text-[10px] font-bold cursor-pointer"
                          >
                            Použiť
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomProfile(p.id, p.name)}
                            className="p-1 hover:bg-red-50 text-red-500 rounded text-[10px] cursor-pointer"
                            title="Zmazať profil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* VÝROBNÉ PRESETS */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-[#8C857B] uppercase tracking-wider block">
                  Predpripravené profily šablóny receptu:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {CALIBRATION_PRESETS.map(preset => (
                    <div
                      key={preset.id}
                      className="p-3.5 bg-white rounded-xl border border-[#E8E2D9] flex flex-col justify-between hover:border-[#C5A059] transition-all shadow-xs"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-1.5">
                          <span className="font-bold text-xs text-[#2C2A29]">{preset.name}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#FAF4E8] text-[#C5A059] border border-[#C5A059]/30">
                            {preset.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8C857B] leading-relaxed mb-3">
                          {preset.description}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleApplyPreset(preset.id)}
                        className="w-full py-1.5 bg-[#FBF9F6] hover:bg-[#2C2A29] text-[#2C2A29] hover:text-white rounded-lg font-bold text-xs transition-colors border border-[#E8E2D9] cursor-pointer"
                      >
                        Aplikovať tento profil
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* SPODNÁ AKČNÁ LIŠTA KALIBRAČNÉHO PANELU */}
          <div className="pt-3 border-t border-[#E8E2D9] flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveCalibrationExplicit}
                className="px-3.5 py-2 bg-[#047857] hover:bg-[#065f46] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Uložiť pre túto tlačiareň</span>
              </button>

              <button
                type="button"
                onClick={() => setShowGuidelines(!showGuidelines)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  showGuidelines
                    ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                    : 'bg-white hover:bg-[#E8E2D9] border-[#E8E2D9] text-[#2C2A29]'
                }`}
                title="Zobrazí jemnú 5 mm mriežku na náhľade pre presné vizuálne porovnanie s papierovým receptom"
              >
                <Grid className="w-3.5 h-3.5" />
                <span>{showGuidelines ? 'Skryť 5mm mriežku' : 'Zobraziť 5mm mriežku'}</span>
              </button>

              <button
                type="button"
                onClick={handleResetCalibration}
                className="px-3 py-2 bg-white hover:bg-red-50 text-[#DC2626] border border-[#E8E2D9] hover:border-red-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                title="Vrátiť všetky rozmery a fonty na pôvodný štandard ŠEVT"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset ŠEVT</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-2 bg-[#2C2A29] hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>🖨️ Skúšobná tlač A6</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCalibration(false)}
                className="px-3 py-2 text-[#8C857B] hover:text-[#2C2A29] text-xs font-semibold cursor-pointer"
              >
                Zavrieť panel
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
          
          {/* RÝCHLA KALIBRAČNÁ LIŠTA PRIAMO NAD NÁHĽADOM */}
          <div className="w-full bg-[#FAF8F5] border-2 border-[#C5A059]/40 rounded-2xl p-3 mb-3 shadow-xs print:hidden space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E2D9] pb-2">
              <div className="flex items-center gap-1.5">
                <span className="p-1 bg-[#C5A059]/20 text-[#C5A059] rounded">
                  <Sliders className="w-3.5 h-3.5" />
                </span>
                <span className="text-[11px] font-bold text-[#2C2A29] uppercase tracking-wider">
                  Náhľad & Rýchla kalibrácia šablóny
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowCalibration(!showCalibration)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                    showCalibration 
                      ? 'bg-[#C5A059] text-white border-[#B38F46] shadow-xs' 
                      : 'bg-[#2C2A29] hover:bg-black text-white border-[#2C2A29]'
                  }`}
                  title="Otvoriť podrobnú manuálnu kalibráciu písma a súradníc"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>{showCalibration ? 'Zavrieť panel' : 'Manuálna kalibrácia písma'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="bg-[#047857] hover:bg-[#065f46] text-white text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Tlačiť A6</span>
                </button>
              </div>
            </div>

            {/* OVLÁDAČE PÍSMA, POSUNU, FONTU A LUPY */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              
              {/* 1. VEĽKOSŤ PÍSMA */}
              <div className="flex items-center bg-white px-2 py-1 rounded-lg border border-[#E8E2D9] gap-1">
                <span className="text-[10px] font-bold text-[#8C857B] uppercase mr-0.5">Písmo:</span>
                <button
                  type="button"
                  onClick={() => handleQuickFontScale(-3)}
                  className="px-1.5 py-0.5 bg-[#FBF9F6] hover:bg-[#E8E2D9] border border-[#E8E2D9] rounded font-bold text-[10px] cursor-pointer"
                  title="Zmenšiť písmo (A-)"
                >
                  A-
                </button>
                <span className="font-mono text-xs font-bold text-[#047857] px-1 min-w-[38px] text-center">
                  {calibration.fontScale}%
                </span>
                <button
                  type="button"
                  onClick={() => handleQuickFontScale(3)}
                  className="px-1.5 py-0.5 bg-[#FBF9F6] hover:bg-[#E8E2D9] border border-[#E8E2D9] rounded font-bold text-[10px] cursor-pointer"
                  title="Zväčšiť písmo (A+)"
                >
                  A+
                </button>
              </div>

              {/* 2. NUDGE POSUN PAPIERA (X/Y mm) */}
              <div className="flex items-center bg-white px-2 py-1 rounded-lg border border-[#E8E2D9] gap-1">
                <span className="text-[10px] font-bold text-[#8C857B] uppercase mr-0.5">Posun:</span>
                <button
                  type="button"
                  onClick={() => handleNudge('x', -0.5)}
                  className="p-1 hover:bg-[#F3EFEA] rounded text-[11px] cursor-pointer"
                  title="Posunúť doľava o 0.5 mm"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-[#2C2A29]" />
                </button>
                <button
                  type="button"
                  onClick={() => handleNudge('y', -0.5)}
                  className="p-1 hover:bg-[#F3EFEA] rounded text-[11px] cursor-pointer"
                  title="Posunúť nahor o 0.5 mm"
                >
                  <ArrowUp className="w-3.5 h-3.5 text-[#2C2A29]" />
                </button>
                <button
                  type="button"
                  onClick={() => handleNudge('y', 0.5)}
                  className="p-1 hover:bg-[#F3EFEA] rounded text-[11px] cursor-pointer"
                  title="Posunúť nadol o 0.5 mm"
                >
                  <ArrowDown className="w-3.5 h-3.5 text-[#2C2A29]" />
                </button>
                <button
                  type="button"
                  onClick={() => handleNudge('x', 0.5)}
                  className="p-1 hover:bg-[#F3EFEA] rounded text-[11px] cursor-pointer"
                  title="Posunúť doprava o 0.5 mm"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-[#2C2A29]" />
                </button>
                <span className="font-mono text-[10px] text-[#2C2A29] px-1 bg-[#FBF9F6] rounded border border-[#E8E2D9]">
                  X:{calibration.offsetX} Y:{calibration.offsetY} mm
                </span>
              </div>

              {/* 3. RODINA FONTU */}
              <div className="flex items-center bg-white px-1.5 py-1 rounded-lg border border-[#E8E2D9] gap-1">
                {(['monospace', 'sans-serif', 'serif'] as const).map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => updateCalibration({ fontFamily: f })}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                      calibration.fontFamily === f
                        ? 'bg-[#2C2A29] text-white'
                        : 'text-[#8C857B] hover:text-[#2C2A29]'
                    }`}
                  >
                    {f === 'monospace' ? 'Strojopis' : f === 'sans-serif' ? 'Arial' : 'Times'}
                  </button>
                ))}
              </div>

              {/* 4. LUPA A MRIEŽKA */}
              <div className="flex items-center gap-1.5">
                <div className="flex items-center bg-white px-1.5 py-1 rounded-lg border border-[#E8E2D9] gap-1">
                  <span className="text-[10px] font-bold text-[#8C857B] uppercase">Lupa:</span>
                  {[80, 100, 120, 140].map(z => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => updateCalibration({ previewZoom: z })}
                      className={`px-1.5 py-0.5 text-[10px] font-bold rounded cursor-pointer ${
                        (calibration.previewZoom || 100) === z
                          ? 'bg-[#2C2A29] text-white'
                          : 'text-[#8C857B] hover:text-[#2C2A29]'
                      }`}
                    >
                      {z}%
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setShowGuidelines(!showGuidelines)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                    showGuidelines
                      ? 'bg-blue-600 text-white border-blue-700'
                      : 'bg-white border-[#E8E2D9] text-[#8C857B] hover:text-[#2C2A29]'
                  }`}
                  title="5 mm mriežka ŠEVT"
                >
                  <Grid className="w-3 h-3" />
                  <span>5mm</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewView(previewView === 'full_preview' ? 'text_only' : 'full_preview')}
                  className="px-2 py-1 bg-white border border-[#E8E2D9] hover:bg-[#F3EFEA] rounded-lg text-[10px] font-bold text-[#8C857B] hover:text-[#2C2A29] cursor-pointer"
                  title="Prepnúť náhľad"
                >
                  {previewView === 'full_preview' ? 'Iba text' : 'S mriežkou'}
                </button>
              </div>

            </div>
          </div>

          {/* ZOOM KONTAJNER PRE PREHĽADNÝ NÁHĽAD A6 TLAČIVA */}
          <div 
            className="transition-transform duration-150 origin-top flex justify-center"
            style={{
              transform: (calibration.previewZoom || 100) !== 100 ? `scale(${(calibration.previewZoom || 100) / 100})` : undefined,
              marginBottom: (calibration.previewZoom || 100) > 100 ? `${148 * (((calibration.previewZoom || 100) / 100) - 1)}mm` : undefined
            }}
          >
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
                fontFamily: baseFontFamily
              }}
            >
            {/* VIZUÁLNA 5MM KALIBRAČNÁ MRIEŽKA NA NÁHĽADE (PRINT:HIDDEN) */}
            {showGuidelines && (
              <div 
                className="absolute inset-0 pointer-events-none z-20 print:hidden opacity-35 bg-[linear-gradient(to_right,#0284c7_1px,transparent_1px),linear-gradient(to_bottom,#0284c7_1px,transparent_1px)] bg-[size:5mm_5mm]"
              >
                <div className="absolute top-1 left-1 bg-sky-700 text-white text-[8px] font-mono px-1 rounded shadow-xs">
                  5 mm kalibračná mriežka
                </div>
              </div>
            )}

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
            {/* DYNAMICKÝ TEXT TLAČENÝ PRESNE NA KALIBROVANÉ POZÍCIE A FORMÁT             */}
            {/* ========================================================================= */}
            <div 
              className="sevt-dynamic-container absolute inset-0 pointer-events-none"
              style={{
                transform: `translate(${calibration.offsetX}mm, ${calibration.offsetY}mm)`
              }}
            >
              
              {/* 1. KÓD LEKÁRA (Hore vpravo) */}
              <div 
                className={`absolute sevt-dynamic-value text-right pointer-events-auto cursor-pointer rounded transition-all ${
                  activeZone === 'doctor' ? 'ring-2 ring-[#C5A059] bg-[#C5A059]/10' : ''
                }`}
                onClick={() => { setActiveZone('doctor'); setCalibrationTab('positions'); }}
                title="Kód lekára (Kliknite pre kalibráciu)"
                style={{
                  top: `${calibration.doctorCodeTop}mm`,
                  right: `${calibration.doctorCodeRight}mm`,
                  width: '32mm',
                  fontSize: `${(calibration.codesFontSize * fontMultiplier).toFixed(1)}pt`,
                  fontWeight: fontWeightVal,
                  fontFamily: baseFontFamily,
                  letterSpacing: calibration.letterSpacing ? `${calibration.letterSpacing}mm` : 'normal'
                }}
              >
                {doctorCode}
              </div>

              {/* 2. ZDRAVOTNÁ POISŤOVŇA (4 okienka v strede hore: napr. "2 5 0 0") */}
              <div 
                className={`absolute sevt-dynamic-value flex justify-center items-center pointer-events-auto cursor-pointer rounded transition-all ${
                  activeZone === 'insurance' ? 'ring-2 ring-[#C5A059] bg-[#C5A059]/10' : ''
                }`}
                onClick={() => { setActiveZone('insurance'); setCalibrationTab('positions'); }}
                title="Kód poisťovne (Kliknite pre kalibráciu)"
                style={{
                  top: `${calibration.insuranceTop}mm`,
                  left: `${calibration.insuranceLeft}mm`,
                  width: '49mm',
                  fontSize: `${(calibration.codesFontSize * fontMultiplier).toFixed(1)}pt`,
                  fontWeight: fontWeightVal,
                  fontFamily: baseFontFamily,
                  letterSpacing: `${(calibration.insuranceSpacing * fontMultiplier).toFixed(2)}rem`
                }}
              >
                {insBoxes.join(' ')}
              </div>

              {/* 3. PACIENT A RODNÉ ČÍSLO (Riadok pod hlavičkou) */}
              <div 
                className={`absolute sevt-dynamic-value truncate pointer-events-auto cursor-pointer rounded transition-all ${
                  activeZone === 'patient' ? 'ring-2 ring-[#C5A059] bg-[#C5A059]/10' : ''
                }`}
                onClick={() => { setActiveZone('patient'); setCalibrationTab('font'); }}
                title="Meno pacienta (Kliknite pre kalibráciu písma)"
                style={{
                  top: `${calibration.patientTop}mm`,
                  left: `${calibration.patientLeft}mm`,
                  width: '62mm',
                  fontSize: `${(calibration.patientFontSize * fontMultiplier).toFixed(1)}pt`,
                  fontWeight: fontWeightVal,
                  fontFamily: baseFontFamily,
                  textTransform: calibration.uppercasePatient ? 'uppercase' : 'none',
                  letterSpacing: calibration.letterSpacing ? `${calibration.letterSpacing}mm` : 'normal'
                }}
              >
                {patientName}
              </div>

              <div 
                className={`absolute sevt-dynamic-value text-right pointer-events-auto cursor-pointer rounded transition-all ${
                  activeZone === 'patient' ? 'ring-2 ring-[#C5A059] bg-[#C5A059]/10' : ''
                }`}
                onClick={() => { setActiveZone('patient'); setCalibrationTab('font'); }}
                title="Rodné číslo (Kliknite pre kalibráciu písma)"
                style={{
                  top: `${calibration.patientTop}mm`,
                  right: `${calibration.birthNumberRight}mm`,
                  width: '32mm',
                  fontSize: `${((calibration.birthNumberFontSize || calibration.patientFontSize) * fontMultiplier).toFixed(1)}pt`,
                  fontWeight: fontWeightVal,
                  fontFamily: baseFontFamily,
                  letterSpacing: calibration.letterSpacing ? `${calibration.letterSpacing}mm` : 'normal'
                }}
              >
                {birthNumber}
              </div>

              {/* 4. BYDLISKO */}
              <div 
                className={`absolute sevt-dynamic-value truncate pointer-events-auto cursor-pointer rounded transition-all ${
                  activeZone === 'address' ? 'ring-2 ring-[#C5A059] bg-[#C5A059]/10' : ''
                }`}
                onClick={() => { setActiveZone('address'); setCalibrationTab('font'); }}
                title="Bydlisko pacienta (Kliknite pre kalibráciu písma)"
                style={{
                  top: `${calibration.addressTop}mm`,
                  left: `${calibration.addressLeft}mm`,
                  width: '93mm',
                  fontSize: `${((calibration.addressFontSize || 9.0) * fontMultiplier).toFixed(1)}pt`,
                  fontWeight: calibration.fontWeight === 'bold' ? '600' : '400',
                  fontFamily: baseFontFamily,
                  textTransform: calibration.uppercasePatient ? 'uppercase' : 'none',
                  letterSpacing: calibration.letterSpacing ? `${calibration.letterSpacing}mm` : 'normal'
                }}
              >
                {address}
              </div>

              {/* 5. DIAGNÓZA 1 (MKCH-10 v 4 okienkach: napr. "Z  4  1  1") */}
              <div 
                className={`absolute sevt-dynamic-value flex items-center pointer-events-auto cursor-pointer rounded transition-all ${
                  activeZone === 'diagnosis' ? 'ring-2 ring-[#C5A059] bg-[#C5A059]/10' : ''
                }`}
                onClick={() => { setActiveZone('diagnosis'); setCalibrationTab('positions'); }}
                title="Diagnóza MKCH (Kliknite pre kalibráciu)"
                style={{
                  top: `${calibration.diagnosisTop}mm`,
                  left: `${calibration.diagnosisLeft}mm`,
                  fontSize: `${(calibration.codesFontSize * fontMultiplier).toFixed(1)}pt`,
                  fontWeight: fontWeightVal,
                  fontFamily: baseFontFamily,
                  letterSpacing: `${(calibration.diagnosisSpacing * fontMultiplier).toFixed(2)}rem`
                }}
              >
                {dgBoxes1.join(' ')}
              </div>

              {/* 6. LIEK 1 - PRESNÉ RIADKY PODĽA PREDLOHY ALEBO VOĽNÉHO TEXTU */}
              <div 
                className={`absolute sevt-dynamic-value text-black pointer-events-auto cursor-pointer rounded p-0.5 transition-all ${
                  activeZone === 'rp1' ? 'ring-2 ring-[#C5A059] bg-[#C5A059]/10' : ''
                }`}
                onClick={() => { setActiveZone('rp1'); setCalibrationTab('format'); }}
                title="Liek Rp. 1 (Kliknite pre kalibráciu písma a formátu)"
                style={{
                  top: `${calibration.rp1Top}mm`,
                  left: `${calibration.rp1Left}mm`,
                  width: `${calibration.rp1Width}mm`,
                  lineHeight: calibration.lineHeight,
                  fontFamily: baseFontFamily,
                  letterSpacing: calibration.letterSpacing ? `${calibration.letterSpacing}mm` : 'normal'
                }}
              >
                {calibration.useCustomRpText && calibration.customRp1Text ? (
                  <div 
                    className="whitespace-pre-line"
                    style={{
                      fontSize: `${(calibration.medicationFontSize * fontMultiplier).toFixed(1)}pt`,
                      fontWeight: fontWeightVal
                    }}
                  >
                    {calibration.customRp1Text}
                  </div>
                ) : items[0] && (
                  <div className="space-y-[1px]">
                    {calibration.rpFormatStyle === 'compact' ? (
                      <>
                        <div 
                          style={{
                            fontSize: `${(calibration.medicationFontSize * fontMultiplier).toFixed(1)}pt`,
                            fontWeight: fontWeightVal,
                            textTransform: calibration.uppercaseMedication ? 'uppercase' : 'none'
                          }}
                        >
                          {items[0].substance || items[0].latinName} {items[0].formAndStrength}
                        </div>
                        <div style={{ fontSize: `${((calibration.packagingFontSize || 9.5) * fontMultiplier).toFixed(1)}pt`, fontWeight: '600' }}>
                          {items[0].packaging}
                        </div>
                        <div style={{ fontSize: `${(calibration.dosageFontSize * fontMultiplier).toFixed(1)}pt` }}>
                          {items[0].dosage} {items[0].commercialName ? `(${items[0].commercialName.replace(/^\(|\)$/g, '')})` : ''}
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Riadok 1: Účinná látka */}
                        <div 
                          style={{
                            fontSize: `${(calibration.medicationFontSize * fontMultiplier).toFixed(1)}pt`,
                            fontWeight: fontWeightVal,
                            textTransform: calibration.uppercaseMedication ? 'uppercase' : 'none'
                          }}
                        >
                          {items[0].substance || items[0].latinName}
                        </div>
                        {/* Riadok 2: Forma a sila */}
                        {items[0].formAndStrength && (
                          <div style={{ fontSize: `${((calibration.formFontSize || 9.5) * fontMultiplier).toFixed(1)}pt` }}>
                            {items[0].formAndStrength}
                          </div>
                        )}
                        {/* Riadok 3: Počet balení */}
                        <div 
                          style={{ 
                            fontSize: `${((calibration.packagingFontSize || 9.5) * fontMultiplier).toFixed(1)}pt`,
                            fontWeight: fontWeightVal
                          }}
                        >
                          {items[0].packaging}
                        </div>
                        {/* Riadok 4: Dávkovanie D.S. */}
                        <div style={{ fontSize: `${(calibration.dosageFontSize * fontMultiplier).toFixed(1)}pt` }}>
                          {items[0].dosage}
                        </div>
                        {/* Riadok 5: Obchodný názov v zátvorke */}
                        {items[0].commercialName && (
                          <div style={{ fontSize: `${((calibration.commercialNameFontSize || 9.0) * fontMultiplier).toFixed(1)}pt` }}>
                            ({items[0].commercialName.replace(/^\(|\)$/g, '')})
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* 7. LIEK 2 (AK JE PRÍTOMNÝ) */}
              {items[1] && (
                <>
                  {/* Dg 2 okienka */}
                  <div 
                    className="absolute sevt-dynamic-value flex items-center"
                    style={{
                      top: `${(calibration.rp2Top - 6.5)}mm`,
                      left: `${calibration.diagnosisLeft}mm`,
                      fontSize: `${(calibration.codesFontSize * fontMultiplier).toFixed(1)}pt`,
                      fontWeight: fontWeightVal,
                      fontFamily: baseFontFamily,
                      letterSpacing: `${(calibration.diagnosisSpacing * fontMultiplier).toFixed(2)}rem`
                    }}
                  >
                    {dgBoxes2.join(' ')}
                  </div>

                  <div 
                    className={`absolute sevt-dynamic-value text-black pointer-events-auto cursor-pointer rounded p-0.5 transition-all ${
                      activeZone === 'rp2' ? 'ring-2 ring-[#C5A059] bg-[#C5A059]/10' : ''
                    }`}
                    onClick={() => { setActiveZone('rp2'); setCalibrationTab('format'); }}
                    title="Liek Rp. 2 (Kliknite pre kalibráciu písma a formátu)"
                    style={{
                      top: `${calibration.rp2Top}mm`,
                      left: `${calibration.rp2Left}mm`,
                      width: `${calibration.rp2Width}mm`,
                      lineHeight: calibration.lineHeight,
                      fontFamily: baseFontFamily,
                      letterSpacing: calibration.letterSpacing ? `${calibration.letterSpacing}mm` : 'normal'
                    }}
                  >
                    {calibration.useCustomRpText && calibration.customRp2Text ? (
                      <div 
                        className="whitespace-pre-line"
                        style={{
                          fontSize: `${(calibration.medicationFontSize * fontMultiplier).toFixed(1)}pt`,
                          fontWeight: fontWeightVal
                        }}
                      >
                        {calibration.customRp2Text}
                      </div>
                    ) : (
                      <div className="space-y-[1px]">
                        {calibration.rpFormatStyle === 'compact' ? (
                          <>
                            <div 
                              style={{
                                fontSize: `${(calibration.medicationFontSize * fontMultiplier).toFixed(1)}pt`,
                                fontWeight: fontWeightVal,
                                textTransform: calibration.uppercaseMedication ? 'uppercase' : 'none'
                              }}
                            >
                              {items[1].substance || items[1].latinName} {items[1].formAndStrength}
                            </div>
                            <div style={{ fontSize: `${((calibration.packagingFontSize || 9.5) * fontMultiplier).toFixed(1)}pt`, fontWeight: '600' }}>
                              {items[1].packaging}
                            </div>
                            <div style={{ fontSize: `${(calibration.dosageFontSize * fontMultiplier).toFixed(1)}pt` }}>
                              {items[1].dosage} {items[1].commercialName ? `(${items[1].commercialName.replace(/^\(|\)$/g, '')})` : ''}
                            </div>
                          </>
                        ) : (
                          <>
                            <div 
                              style={{
                                fontSize: `${(calibration.medicationFontSize * fontMultiplier).toFixed(1)}pt`,
                                fontWeight: fontWeightVal,
                                textTransform: calibration.uppercaseMedication ? 'uppercase' : 'none'
                              }}
                            >
                              {items[1].substance || items[1].latinName}
                            </div>
                            {items[1].formAndStrength && (
                              <div style={{ fontSize: `${((calibration.formFontSize || 9.5) * fontMultiplier).toFixed(1)}pt` }}>
                                {items[1].formAndStrength}
                              </div>
                            )}
                            <div 
                              style={{ 
                                fontSize: `${((calibration.packagingFontSize || 9.5) * fontMultiplier).toFixed(1)}pt`,
                                fontWeight: fontWeightVal
                              }}
                            >
                              {items[1].packaging}
                            </div>
                            <div style={{ fontSize: `${(calibration.dosageFontSize * fontMultiplier).toFixed(1)}pt` }}>
                              {items[1].dosage}
                            </div>
                            {items[1].commercialName && (
                              <div style={{ fontSize: `${((calibration.commercialNameFontSize || 9.0) * fontMultiplier).toFixed(1)}pt` }}>
                                ({items[1].commercialName.replace(/^\(|\)$/g, '')})
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* 8. DÁTUM VYSTAVENIA (Dňa:) */}
              <div 
                className={`absolute sevt-dynamic-value pointer-events-auto cursor-pointer rounded transition-all ${
                  activeZone === 'date' ? 'ring-2 ring-[#C5A059] bg-[#C5A059]/10' : ''
                }`}
                onClick={() => { setActiveZone('date'); setCalibrationTab('positions'); }}
                title="Dátum vystavenia (Kliknite pre kalibráciu)"
                style={{
                  top: `${calibration.dateTop}mm`,
                  left: `${calibration.dateLeft}mm`,
                  fontSize: `${(calibration.dateFontSize * fontMultiplier).toFixed(1)}pt`,
                  fontWeight: fontWeightVal,
                  fontFamily: baseFontFamily,
                  letterSpacing: calibration.letterSpacing ? `${calibration.letterSpacing}mm` : 'normal'
                }}
              >
                {prescriptionDate}
              </div>

              {/* 9. PORADOVÉ ČÍSLO PREDPISU (vpravo dole) */}
              {prescriptionOrderNumber && (
                <div 
                  className="absolute sevt-dynamic-value text-center"
                  style={{
                    top: `${calibration.orderNumberTop}mm`,
                    right: `${calibration.orderNumberRight}mm`,
                    width: '27mm',
                    fontSize: `${(Math.max(7.5, calibration.dateFontSize - 1) * fontMultiplier).toFixed(1)}pt`,
                    fontWeight: fontWeightVal,
                    fontFamily: baseFontFamily
                  }}
                >
                  {prescriptionOrderNumber}
                </div>
              )}

            </div>

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
