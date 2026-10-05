'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  PrescribedMedication, 
  MEDICATION_CATALOG, 
  CATEGORY_LABELS, 
  CLINIC_PRESCRIPTION_DEFAULTS 
} from '../data/prescriptionCatalog';
import { exportElementToPdf, generatePdfFilename } from '../lib/pdfGenerator';
import PrescriptionFontContextMenu, { 
  ElementFontStyle, 
  ElementOffset, 
  FONT_FAMILY_MAP 
} from './PrescriptionFontContextMenu';
import { 
  Move, 
  RotateCcw, 
  Printer, 
  FileText, 
  Check
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

// Presné základné pozície na oficiálnom tlačive ŠEVT 14 282 2s (A6: 105 × 148 mm)
// Všetky hodnoty sú v milimetroch od ľavého horného rohu
const BASE_ELEMENT_POSITIONS: Record<string, { top: number; left?: number; right?: number; width?: number; defaultAlign?: 'left' | 'center' | 'right' }> = {
  // 1. Kód lekára v pravom hornom okienku (okienko šírky 21mm na y=11.5mm)
  doctorCode: { top: 11.5, right: 6.5, width: 21.0, defaultAlign: 'center' },
  // 2. Zdravotná poisťovňa (4 okienka v strednom paneli na y=15.0mm, centrované)
  insurance: { top: 15.0, left: 41.2, width: 21.6, defaultAlign: 'center' },
  // 3. Meno a priezvisko poistenca (riadok 1 pod hlavičkou, čistý priestor pod popisom)
  patientName: { top: 28.5, left: 6.5, width: 58.0, defaultAlign: 'left' },
  // 4. Rodné číslo poistenca (vpravo na riadku 1 pod popisom)
  birthNumber: { top: 28.5, right: 6.5, width: 30.0, defaultAlign: 'right' },
  // 5. Bydlisko pacienta (riadok 2 pod popisom)
  address: { top: 37.0, left: 6.5, width: 92.0, defaultAlign: 'left' },
  // 6. Diagnóza MKCH (4 okienka v riadku 3)
  diagnosis: { top: 43.5, left: 13.0, width: 21.6, defaultAlign: 'left' },
  // 7. Predpísaný liek (1 liek na celý priestor Rp.)
  rp1: { top: 54.0, left: 18.0, width: 80.0, defaultAlign: 'left' },
  // 8. Dátum vystavenia (na rovnakej vertikálnej osi vedľa nápisu Dňa:)
  date: { top: 122.5, left: 15.0, width: 28.0, defaultAlign: 'left' },
  // 9. Poradové číslo predpisu
  orderNumber: { top: 131.0, left: 28.0, width: 20.0, defaultAlign: 'left' },
};

const ELEMENT_LABELS: Record<string, string> = {
  doctorCode: 'Kód lekára (Hore vpravo)',
  insurance: 'Zdravotná poisťovňa (4 okienka)',
  patientName: 'Meno pacienta',
  birthNumber: 'Rodné číslo',
  address: 'Bydlisko pacienta',
  diagnosis: 'Diagnóza MKCH (4 okienka)',
  rp1: 'Predpísaný liek Rp. (Účinná látka, forma, balenie, dávkovanie)',
  date: 'Dátum vystavenia receptu (Dňa:)',
  orderNumber: 'Poradové číslo predpisu'
};

const DEFAULT_ELEMENT_FONTS: Record<string, ElementFontStyle> = {
  doctorCode: {
    fontFamily: 'monospace',
    fontSize: 10.5,
    fontWeight: '700',
    fontStyle: 'normal',
    textTransform: 'none',
    letterSpacing: 0.5,
    lineHeight: 1.2,
    color: '#000000',
    textAlign: 'center'
  },
  insurance: {
    fontFamily: 'monospace',
    fontSize: 11.0,
    fontWeight: '700',
    fontStyle: 'normal',
    textTransform: 'none',
    letterSpacing: 0,
    lineHeight: 1.2,
    color: '#000000',
    textAlign: 'center'
  },
  patientName: {
    fontFamily: 'monospace',
    fontSize: 10.5,
    fontWeight: '700',
    fontStyle: 'normal',
    textTransform: 'uppercase',
    letterSpacing: 0,
    lineHeight: 1.2,
    color: '#000000',
    textAlign: 'left'
  },
  birthNumber: {
    fontFamily: 'monospace',
    fontSize: 10.0,
    fontWeight: '700',
    fontStyle: 'normal',
    textTransform: 'none',
    letterSpacing: 0,
    lineHeight: 1.2,
    color: '#000000',
    textAlign: 'right'
  },
  address: {
    fontFamily: 'monospace',
    fontSize: 9.0,
    fontWeight: '400',
    fontStyle: 'normal',
    textTransform: 'uppercase',
    letterSpacing: 0,
    lineHeight: 1.2,
    color: '#000000',
    textAlign: 'left'
  },
  diagnosis: {
    fontFamily: 'monospace',
    fontSize: 11.0,
    fontWeight: '700',
    fontStyle: 'normal',
    textTransform: 'none',
    letterSpacing: 0,
    lineHeight: 1.2,
    color: '#000000',
    textAlign: 'left'
  },
  rp1: {
    fontFamily: 'monospace',
    fontSize: 11.0,
    fontWeight: '700',
    fontStyle: 'normal',
    textTransform: 'none',
    letterSpacing: 0,
    lineHeight: 1.35,
    color: '#000000',
    textAlign: 'left'
  },
  date: {
    fontFamily: 'monospace',
    fontSize: 10.0,
    fontWeight: '700',
    fontStyle: 'normal',
    textTransform: 'none',
    letterSpacing: 0,
    lineHeight: 1.2,
    color: '#000000',
    textAlign: 'left'
  },
  orderNumber: {
    fontFamily: 'monospace',
    fontSize: 9.0,
    fontWeight: '700',
    fontStyle: 'normal',
    textTransform: 'none',
    letterSpacing: 0,
    lineHeight: 1.2,
    color: '#000000',
    textAlign: 'center'
  }
};

const DEFAULT_OFFSETS: Record<string, ElementOffset> = {
  doctorCode: { x: 0, y: 0 },
  insurance: { x: 0, y: 0 },
  patientName: { x: 0, y: 0 },
  birthNumber: { x: 0, y: 0 },
  address: { x: 0, y: 0 },
  diagnosis: { x: 0, y: 0 },
  rp1: { x: 0, y: 0 },
  date: { x: 0, y: 0 },
  orderNumber: { x: 0, y: 0 }
};

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
  const [previewZoom, setPreviewZoom] = useState<number>(100);

  // Posuny jednotlivých prvkov (X, Y v mm)
  const [elementOffsets, setElementOffsets] = useState<Record<string, ElementOffset>>(DEFAULT_OFFSETS);
  // Nastavenia písma jednotlivých prvkov
  const [elementFonts, setElementFonts] = useState<Record<string, ElementFontStyle>>(DEFAULT_ELEMENT_FONTS);

  // Presne JEDEN predpísaný liek na recept podľa pravidiel preskripcie
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

  // Stav pre priame ťahanie myšou (Drag and Drop)
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const dragStartRef = useRef<{
    elementKey: string;
    startX: number;
    startY: number;
    initialOffset: ElementOffset;
  } | null>(null);

  // Stav kontextového menu na pravé tlačidlo myši
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    elementKey: string;
    elementLabel: string;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    elementKey: 'patientName',
    elementLabel: 'Meno pacienta'
  });

  // Notifikácia o uložení
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Vyhľadávanie v katalógu a filter
  const [catalogFilter, setCatalogFilter] = useState<string>('all');
  const [catalogSearch, setCatalogSearch] = useState<string>('');

  const printRef = useRef<HTMLDivElement>(null);

  // Automatická synchronizácia údajov pacienta pri zmene v rozpracovanom pacientovi
  useEffect(() => {
    if (initialPatient) {
      if (initialPatient.name) setPatientName(initialPatient.name);
      if (initialPatient.birthNumber) setBirthNumber(initialPatient.birthNumber);
      if (initialPatient.address) setAddress(initialPatient.address);
      if (initialPatient.insurance) setInsuranceCode(initialPatient.insurance);
    }
  }, [initialPatient]);

  // Načítanie uložených posunov a písiem z localStorage
  useEffect(() => {
    try {
      const savedOffsets = localStorage.getItem('say_clinic_rx_element_offsets_v3');
      if (savedOffsets) {
        setElementOffsets(prev => ({ ...prev, ...JSON.parse(savedOffsets) }));
      }
      const savedFonts = localStorage.getItem('say_clinic_rx_element_fonts_v3');
      if (savedFonts) {
        setElementFonts(prev => ({ ...prev, ...JSON.parse(savedFonts) }));
      }
      const savedMode = localStorage.getItem('say_clinic_rx_print_mode');
      if (savedMode === 'full' || savedMode === 'preprinted') {
        setPrintMode(savedMode);
      }
    } catch {
      // ignore
    }
  }, []);

  // Aktualizácia posunov s automatickým uložením
  const updateElementOffset = useCallback((elementKey: string, newOffset: ElementOffset) => {
    setElementOffsets(prev => {
      const updated = { ...prev, [elementKey]: newOffset };
      try {
        localStorage.setItem('say_clinic_rx_element_offsets_v3', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  // Aktualizácia písma s automatickým uložením
  const updateElementFont = useCallback((elementKey: string, updates: Partial<ElementFontStyle>) => {
    setElementFonts(prev => {
      const current = prev[elementKey] || DEFAULT_ELEMENT_FONTS[elementKey] || DEFAULT_ELEMENT_FONTS.patientName;
      const updated = {
        ...prev,
        [elementKey]: { ...current, ...updates }
      };
      try {
        localStorage.setItem('say_clinic_rx_element_fonts_v3', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  // Reset písma jedného prvku
  const resetElementFont = useCallback((elementKey: string) => {
    const defaultFont = DEFAULT_ELEMENT_FONTS[elementKey] || DEFAULT_ELEMENT_FONTS.patientName;
    updateElementFont(elementKey, defaultFont);
  }, [updateElementFont]);

  // Reset pozície jedného prvku
  const resetElementOffset = useCallback((elementKey: string) => {
    updateElementOffset(elementKey, { x: 0, y: 0 });
  }, [updateElementOffset]);

  // Aplikovanie písma na všetky texty
  const applyFontToAllElements = useCallback((fontStyle: ElementFontStyle) => {
    setElementFonts(prev => {
      const updated: Record<string, ElementFontStyle> = {};
      Object.keys(DEFAULT_ELEMENT_FONTS).forEach(k => {
        const existing = prev[k] || DEFAULT_ELEMENT_FONTS[k];
        updated[k] = {
          ...existing,
          fontFamily: fontStyle.fontFamily,
          fontWeight: fontStyle.fontWeight,
          fontStyle: fontStyle.fontStyle,
          color: fontStyle.color
        };
      });
      try {
        localStorage.setItem('say_clinic_rx_element_fonts_v3', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  // Kompletný reset všetkých pozícií a písiem
  const handleResetAll = () => {
    if (window.confirm('Naozaj si želáte obnoviť pôvodné pozície a písma pre všetky texty receptu?')) {
      setElementOffsets(DEFAULT_OFFSETS);
      setElementFonts(DEFAULT_ELEMENT_FONTS);
      try {
        localStorage.removeItem('say_clinic_rx_element_offsets_v3');
        localStorage.removeItem('say_clinic_rx_element_fonts_v3');
      } catch {
        // ignore
      }
    }
  };

  // Obsluha začiatku ťahania prvku (ľavé tlačidlo myši)
  const handleElementMouseDown = (e: React.MouseEvent, elementKey: string) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const currentOffset = elementOffsets[elementKey] || { x: 0, y: 0 };
    dragStartRef.current = {
      elementKey,
      startX: e.clientX,
      startY: e.clientY,
      initialOffset: { ...currentOffset }
    };
    setDraggedElement(elementKey);
  };

  // Obsluha pohybu myši pri ťahaní
  useEffect(() => {
    if (!draggedElement) return;

    const handleMouseMove = (e: MouseEvent) => {
      const currentDrag = dragStartRef.current;
      if (!currentDrag || !printRef.current) return;
      const targetKey = currentDrag.elementKey;
      if (!targetKey) return;

      const rect = printRef.current.getBoundingClientRect();
      const pxPerMm = rect.width / 105;
      if (pxPerMm <= 0) return;

      const deltaXmm = (e.clientX - currentDrag.startX) / pxPerMm;
      const deltaYmm = (e.clientY - currentDrag.startY) / pxPerMm;

      const newX = Math.round((currentDrag.initialOffset.x + deltaXmm) * 5) / 5;
      const newY = Math.round((currentDrag.initialOffset.y + deltaYmm) * 5) / 5;

      setElementOffsets(prev => ({
        ...prev,
        [targetKey]: { x: newX, y: newY }
      }));
    };

    const handleMouseUp = () => {
      const currentDrag = dragStartRef.current;
      if (currentDrag) {
        try {
          setElementOffsets(latest => {
            localStorage.setItem('say_clinic_rx_element_offsets_v2', JSON.stringify(latest));
            return latest;
          });
        } catch {
          // ignore
        }
      }
      dragStartRef.current = null;
      setDraggedElement(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedElement]);

  // Otvorenie kontextového menu na pravé tlačidlo myši
  const handleContextMenu = (e: React.MouseEvent, elementKey: string, elementLabel: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      elementKey,
      elementLabel
    });
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

  // Výber lieku z katalógu (okamžite nastaví 1 liek na recepte)
  const handleSelectMedicationFromCatalog = (med: PrescribedMedication) => {
    const newItem: PrescribedMedication = {
      ...med,
      id: `item-1-${med.suklCode || 'rx'}`
    };
    setItems([newItem]);
  };

  // Úprava poľa predpísaného lieku
  const handleUpdateItemField = (field: keyof PrescribedMedication, value: string) => {
    setItems(prev => {
      const current = prev[0] || {
        id: 'item-1',
        substance: '',
        formAndStrength: '',
        packaging: 'Exp. orig. No I (unam)',
        dosage: 'D.S. ',
        commercialName: '',
        category: 'other',
        paymentType: 'Hradí pacient'
      };
      return [{ ...current, [field]: value }];
    });
  };

  // Vyčistenie lieku
  const handleClearMedication = () => {
    setItems([{
      id: `item-${Date.now()}`,
      substance: '',
      formAndStrength: '',
      packaging: 'Exp. orig. No I (unam)',
      dosage: 'D.S. ',
      commercialName: '',
      category: 'other',
      paymentType: 'Hradí pacient'
    }]);
  };

  // Vloženie vzorového príkladu (z predlohy: Novalgin)
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

  // Spustenie tlače s izolovaným A6 formátom (105mm x 148mm)
  const handlePrint = () => {
    if (onPrintRequested) {
      onPrintRequested();
      return;
    }

    // Pridanie tried pre cielenú tlač A6 bez ovplyvnenia A4 dokumentov
    document.body.classList.add('print-prescription-a6');
    if (printMode === 'preprinted') {
      document.body.classList.add('print-mode-preprinted');
    } else {
      document.body.classList.add('print-mode-full');
    }

    // Dočasný štýl pre @page A6 iba počas tlače receptu
    const tempStyle = document.createElement('style');
    tempStyle.id = 'say-prescription-a6-page-style';
    tempStyle.innerHTML = `
      @page {
        size: 105mm 148mm portrait !important;
        margin: 0mm !important;
      }
    `;
    document.head.appendChild(tempStyle);

    const cleanup = () => {
      document.body.classList.remove('print-prescription-a6', 'print-mode-preprinted', 'print-mode-full');
      const s = document.getElementById('say-prescription-a6-page-style');
      if (s) s.remove();
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup, { once: true });
    window.print();
    setTimeout(cleanup, 2500);
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

    const currentItem = items[0];
    const medTitle = currentItem?.substance || currentItem?.commercialName || currentItem?.latinName || 'Predpis lieku';

    const prescriptionRecord = {
      id: `rx-${Date.now()}`,
      type: 'Lekársky recept (A6)',
      typeColor: 'bg-[#047857]',
      title: `Recept: ${medTitle}`,
      doctor: doctorName,
      diagnosis: diagnosisCode,
      date: prescriptionDate,
      content: `LEKÁRSKY PREDPIS (ŠEVT 14 282 2s - A6) - SAY CLINIC\n\nPoskytovateľ: ${CLINIC_PRESCRIPTION_DEFAULTS.clinicName}\nPZS: ${pzsCode} | Lekár: ${doctorName} (${doctorCode})\nPoistenec: ${patientName} (RČ: ${birthNumber})\nBydlisko: ${address}\nPoisťovňa: ${insuranceCode}\nDiagnóza: ${diagnosisCode}\nDátum: ${prescriptionDate}\n\nPREDPÍSANÝ LIEK (Rp.):\n   ${currentItem?.substance || currentItem?.latinName || ''}\n   ${currentItem?.formAndStrength || ''}\n   ${currentItem?.packaging || ''}\n   ${currentItem?.dosage || ''}${currentItem?.commercialName ? `\n   (${currentItem.commercialName})` : ''}`
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

      setSaveSuccessMsg(`Recept (${medTitle}) bol úspešne uložený do karty pacienta ${patientName}`);
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
  const dgBoxes = getBoxChars(diagnosisCode, 4);

  // Štýly pre premiestniteľný prvok
  const getElementStyle = (key: string) => {
    const base = BASE_ELEMENT_POSITIONS[key] || { top: 0, left: 0 };
    const offset = elementOffsets[key] || { x: 0, y: 0 };
    const font = elementFonts[key] || DEFAULT_ELEMENT_FONTS[key] || DEFAULT_ELEMENT_FONTS.patientName;

    return {
      top: `${base.top}mm`,
      ...(base.left !== undefined ? { left: `${base.left}mm` } : {}),
      ...(base.right !== undefined ? { right: `${base.right}mm` } : {}),
      ...(base.width !== undefined ? { width: `${base.width}mm` } : {}),
      transform: `translate(${offset.x}mm, ${offset.y}mm)`,
      fontFamily: FONT_FAMILY_MAP[font.fontFamily] || font.fontFamily,
      fontSize: `${font.fontSize}pt`,
      fontWeight: font.fontWeight,
      fontStyle: font.fontStyle,
      textTransform: font.textTransform,
      letterSpacing: font.letterSpacing ? `${font.letterSpacing}mm` : 'normal',
      lineHeight: font.lineHeight,
      color: font.color || '#000000',
      textAlign: font.textAlign || base.defaultAlign || 'left'
    };
  };

  // Renderér pre premiestniteľný textový prvok s podporou ťahania myšou a pravého tlačidla
  const renderDraggableItem = (
    key: string,
    content: React.ReactNode,
    extraClasses = ''
  ) => {
    const isDragging = draggedElement === key;
    const offset = elementOffsets[key] || { x: 0, y: 0 };
    const hasCustomOffset = offset.x !== 0 || offset.y !== 0;
    const label = ELEMENT_LABELS[key] || key;

    return (
      <div
        className={`absolute sevt-dynamic-value select-none pointer-events-auto cursor-grab active:cursor-grabbing transition-shadow group ${
          isDragging 
            ? 'ring-2 ring-[#047857] bg-[#047857]/10 z-30' 
            : 'hover:ring-1 hover:ring-[#C5A059]/70 hover:bg-[#C5A059]/5'
        } ${hasCustomOffset ? 'rounded' : ''} ${extraClasses}`}
        style={getElementStyle(key)}
        onMouseDown={(e) => handleElementMouseDown(e, key)}
        onContextMenu={(e) => handleContextMenu(e, key, label)}
        title={`${label} (Potiahnutím posuniete | Pravé tlačidlo: Nastavenie písma)`}
      >
        {content}

        {isDragging && (
          <span className="absolute -top-5 left-0 bg-[#047857] text-white text-[9px] font-mono px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap pointer-events-none z-40">
            X:{offset.x > 0 ? `+${offset.x}` : offset.x} Y:{offset.y > 0 ? `+${offset.y}` : offset.y} mm
          </span>
        )}
      </div>
    );
  };

  const activeMed = items[0];

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
            className="text-white/80 hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            Zavrieť
          </button>
        </div>
      )}

      {/* HORNÝ OVLÁDACÍ PANEL PRE VOĽBU REŽIMU TLAČE */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8E2D9] shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">💊</span>
            <h3 className="font-brand text-base font-bold text-[#2C2A29] uppercase">
              Lekársky recept ŠEVT 14 282 2s (A6)
            </h3>
            <span className="bg-[#047857]/10 text-[#047857] text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-[#047857]/20">
              1 liek na recept
            </span>
          </div>
          <p className="text-xs text-[#8C857B] mt-0.5">
            Presné rozloženie podľa oficiálneho slovenského tlačiva ŠEVT (105 × 148 mm). Možnosť manuálneho posunu textu myšou.
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
            title="Načítať vzorový recept (Novalgin / Metamizol, Michaela Krigovská, Z411)"
          >
            📋 Vzor
          </button>
        </div>
      </div>

      {/* HLAVNÁ ČASŤ - FORMULÁR VĽAVO, NÁHĽAD ŠEVT A6 VPRAVO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:block">
        
        {/* ======================================================= */}
        {/* ĽAVÁ ČASŤ - FORMULÁR PRE PREDPISOVANIE LIEČIVA          */}
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
                  className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white font-mono text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Poradové číslo (nepovinné)</label>
                <input
                  type="text"
                  value={prescriptionOrderNumber}
                  onChange={e => setPrescriptionOrderNumber(e.target.value)}
                  placeholder="napr. 001/2026"
                  className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white font-mono text-xs font-semibold"
                />
              </div>
            </div>
          </div>

          {/* 2. IDENTIFIKÁCIA PACIENTA */}
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4 shadow-xs space-y-3">
            <span className="text-[10px] uppercase font-bold text-[#C5A059] tracking-wider block border-b border-[#E8E2D9] pb-2">
              2. Údaje o pacientovi
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Meno a priezvisko</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={e => setPatientName(e.target.value)}
                  placeholder="napr. MICHAELA KRIGOVSKÁ"
                  className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white text-xs font-bold uppercase"
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
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Bydlisko (Ulica, Číslo, Mesto)</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="FRANCISCIHO 18, LEVOČA"
                  className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white text-xs uppercase"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">
                  Zdravotná poisťovňa poistenca (4 znaky)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={4}
                    value={insuranceCode}
                    onChange={e => setInsuranceCode(e.target.value)}
                    placeholder="2500"
                    className="w-28 border border-[#E8E2D9] p-2 rounded-lg bg-white font-mono text-xs font-bold tracking-widest text-center"
                  />
                  <div className="flex gap-1 text-[10px] text-[#8C857B]">
                    <button type="button" onClick={() => setInsuranceCode('2500')} className="hover:underline cursor-pointer">25 (VšZP)</button>
                    <span>•</span>
                    <button type="button" onClick={() => setInsuranceCode('2400')} className="hover:underline cursor-pointer">24 (Dôvera)</button>
                    <span>•</span>
                    <button type="button" onClick={() => setInsuranceCode('2700')} className="hover:underline cursor-pointer">27 (Union)</button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">
                  Diagnóza MKCH (4 znaky do okienok)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={4}
                    value={diagnosisCode}
                    onChange={e => setDiagnosisCode(e.target.value.toUpperCase())}
                    placeholder="Z411"
                    className="w-28 border border-[#E8E2D9] p-2 rounded-lg bg-white font-mono text-xs font-bold tracking-widest text-center uppercase"
                  />
                  <span className="text-[10px] text-[#8C857B]">
                    (napr. Z411, M545, K210, J069)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. PREDPÍSANÝ LIEK (EXAKTNÝCH 1 LIEK NA RECEPT) */}
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#C5A059] tracking-wider block">
                  3. Predpísaný liek (Rp.) — 1 liek na recept
                </span>
                <p className="text-[11px] text-[#8C857B]">
                  Lekársky recept ŠEVT pojme 1 predpísaný liek pre maximálnu bezpečnosť pacientov
                </p>
              </div>

              <button
                type="button"
                onClick={handleClearMedication}
                className="text-[#8C857B] hover:text-[#DC2626] text-xs font-semibold px-2 py-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
                title="Vyčistiť a zadať nový liek"
              >
                Vyčistiť liek
              </button>
            </div>

            {activeMed && (
              <div className="p-3.5 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-xs bg-[#2C2A29] text-white px-2.5 py-0.5 rounded">
                    Rp. (Recept)
                  </span>
                  {activeMed.suklCode && (
                    <span className="text-[10px] font-mono text-[#8C857B]">
                      ŠÚKL: {activeMed.suklCode}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] uppercase text-[#8C857B] mb-0.5 font-bold">
                      Účinná látka / Generický názov (Povinné)
                    </label>
                    <input
                      type="text"
                      value={activeMed.substance}
                      onChange={e => handleUpdateItemField('substance', e.target.value)}
                      placeholder="napr. metamizol, sodná soľ"
                      className="w-full border border-[#E8E2D9] p-1.5 rounded-lg bg-white text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-[#8C857B] mb-0.5 font-bold">
                      Lieková forma a sila
                    </label>
                    <input
                      type="text"
                      value={activeMed.formAndStrength}
                      onChange={e => handleUpdateItemField('formAndStrength', e.target.value)}
                      placeholder="tbl flm 20x500 mg"
                      className="w-full border border-[#E8E2D9] p-1.5 rounded-lg bg-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-[#8C857B] mb-0.5 font-bold">
                      Počet balení (Exp. orig. No)
                    </label>
                    <input
                      type="text"
                      value={activeMed.packaging}
                      onChange={e => handleUpdateItemField('packaging', e.target.value)}
                      placeholder="Exp. orig. No I (unam)"
                      className="w-full border border-[#E8E2D9] p-1.5 rounded-lg bg-white text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-[#8C857B] mb-0.5 font-bold">
                      Dávkovanie a spôsob užitia (D.S.)
                    </label>
                    <input
                      type="text"
                      value={activeMed.dosage}
                      onChange={e => handleUpdateItemField('dosage', e.target.value)}
                      placeholder="D.S. DOP pp."
                      className="w-full border border-[#E8E2D9] p-1.5 rounded-lg bg-white text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-[#8C857B] mb-0.5 font-bold">
                      Obchodný názov v zátvorke (napr. Novalgin)
                    </label>
                    <input
                      type="text"
                      value={activeMed.commercialName}
                      onChange={e => handleUpdateItemField('commercialName', e.target.value)}
                      placeholder="Novalgin 500 mg"
                      className="w-full border border-[#E8E2D9] p-1.5 rounded-lg bg-white text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. RÝCHLY VÝBER Z KATALÓGU LIEKOV SAY CLINIC */}
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4 shadow-xs space-y-3">
            <span className="text-[10px] uppercase font-bold text-[#C5A059] tracking-wider block border-b border-[#E8E2D9] pb-2">
              4. Katalóg často predpisovaných liečiv (Kliknutím nahradíte liek)
            </span>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Hľadať v liekoch (napr. Novalgin, Clexane, Augmentin)..."
                value={catalogSearch}
                onChange={e => setCatalogSearch(e.target.value)}
                className="flex-1 border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white"
              />
              <select
                value={catalogFilter}
                onChange={e => setCatalogFilter(e.target.value)}
                className="border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29] font-medium"
              >
                <option value="all">Všetky kategórie</option>
                {Object.entries(CATEGORY_LABELS).map(([catKey, catVal]) => (
                  <option key={catKey} value={catKey}>
                    {catVal.icon} {catVal.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
              {filteredCatalog.slice(0, 10).map((med, idx) => (
                <div
                  key={idx}
                  className="p-2 border border-[#E8E2D9] rounded-xl hover:border-[#C5A059] hover:bg-[#FAF8F5] transition-all flex items-center justify-between text-xs gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-[#2C2A29] truncate">
                      {med.commercialName} <span className="font-normal text-[#8C857B]">({med.substance})</span>
                    </div>
                    <div className="text-[10px] text-[#8C857B] truncate">
                      {med.formAndStrength} • {med.packaging} • {med.dosage}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectMedicationFromCatalog(med)}
                    className="px-2.5 py-1 bg-[#047857] hover:bg-[#065f46] text-white rounded-lg text-[11px] font-bold shrink-0 transition-colors cursor-pointer"
                  >
                    + Vložiť
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* AKČNÉ TLAČIDLÁ PRE ULOŽENIE A PDF */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={handleSaveToPatientFolder}
              className="bg-[#047857] hover:bg-[#065f46] text-white font-bold text-xs uppercase tracking-wider py-3 px-4 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
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
          
          {/* LIŠTA S NÁPOVEDOU A PREPÍNAČMI */}
          <div className="w-full bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl p-3 mb-3 shadow-xs print:hidden flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-[#C5A059]/20 text-[#C5A059] rounded">
                <Move className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs text-[#2C2A29]">
                <strong className="font-bold">Posun:</strong> potiahnite myšou &nbsp;|&nbsp; <strong className="font-bold">Písmo:</strong> pravé tlačidlo
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              {/* Prepínač náhľadu */}
              <button
                type="button"
                onClick={() => setPreviewView(previewView === 'full_preview' ? 'text_only' : 'full_preview')}
                className="px-2.5 py-1.5 bg-white border border-[#E8E2D9] hover:bg-[#F3EFEA] rounded-lg font-bold text-[#8C857B] hover:text-[#2C2A29] transition-colors cursor-pointer"
                title="Prepnúť náhľad"
              >
                {previewView === 'full_preview' ? 'Iba čistý text' : 'Náhľad s mriežkou'}
              </button>

              {/* Zoom lupa */}
              <div className="flex items-center bg-white px-1.5 py-1 rounded-lg border border-[#E8E2D9] gap-1">
                <span className="text-[10px] font-bold text-[#8C857B] uppercase">Lupa:</span>
                {[90, 100, 115].map(z => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => setPreviewZoom(z)}
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded cursor-pointer ${
                      previewZoom === z
                        ? 'bg-[#2C2A29] text-white'
                        : 'text-[#8C857B] hover:text-[#2C2A29]'
                    }`}
                  >
                    {z}%
                  </button>
                ))}
              </div>

              {/* Reset všetkých pozícií a písiem */}
              <button
                type="button"
                onClick={handleResetAll}
                className="px-2 py-1.5 bg-white border border-[#E8E2D9] hover:bg-red-50 text-[#8C857B] hover:text-[#DC2626] rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                title="Vrátiť všetky pozície a písma na pôvodné výrobné nastavenia ŠEVT"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>

              {/* Tlačidlo tlače */}
              <button
                type="button"
                onClick={handlePrint}
                className="bg-[#047857] hover:bg-[#065f46] text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Tlačiť A6</span>
              </button>
            </div>
          </div>

          {/* ZOOM KONTAJNER PRE PREHĽADNÝ NÁHĽAD A6 TLAČIVA */}
          <div 
            className="transition-transform duration-150 origin-top flex justify-center"
            style={{
              transform: previewZoom !== 100 ? `scale(${previewZoom / 100})` : undefined,
              marginBottom: previewZoom > 100 ? `${148 * ((previewZoom / 100) - 1)}mm` : undefined
            }}
          >
            {/* DOKUMENT: OFICIÁLNE LEKÁRSKE TLAČIVO ŠEVT 14 282 2s (A6: 105mm x 148mm) */}
            <div 
              id="sevt-a6-prescription-document"
              ref={printRef}
              className={`bg-[#FFFFFF] text-[#000000] relative select-none transition-all ${
                previewView === 'text_only' ? 'border border-dashed border-[#C5A059]' : 'border-2 border-[#000000] shadow-md'
              }`}
              style={{
                width: '105mm',
                height: '148mm',
                boxSizing: 'border-box',
                overflow: 'hidden'
              }}
            >

              {/* VODIDLÁ / OFICIÁLNE TLAČIVO ŠEVT 14 282 2s (Zobrazuje sa pri previewView === 'full_preview' a tlači s mriežkou) */}
              <div className={`sevt-guide-grid absolute inset-0 pointer-events-none ${previewView === 'text_only' ? 'hidden' : 'block'}`}>
                
                {/* VONKAJŠÍ RÁMČEK TLAČIVA (5mm okraje po celom obvode: 95mm x 138mm) */}
                <div className="absolute top-[5mm] left-[5mm] right-[5mm] h-[138mm] border-2 border-black flex flex-col justify-between">
                  
                  {/* 1. HORNÝ BLOK: HLAVIČKA (výška 20mm) */}
                  <div className="h-[20mm] border-b-2 border-black flex">
                    
                    {/* Ľavé okienko: Miesto pre nalepovacie štítky / čiarový kód (šírka 23mm) */}
                    <div className="w-[23mm] border-r-2 border-black flex flex-col justify-center items-center text-center p-1">
                      <span className="text-[7px] font-sans leading-tight sevt-preprinted-text text-black/80">
                        Miesto na nalepenie<br />identifikačného<br />štítku poistenca
                      </span>
                    </div>

                    {/* Stredné okienko: Lekársky predpis + Zdravotná poisťovňa (šírka 48mm) */}
                    <div className="w-[48mm] border-r-2 border-black flex flex-col justify-between items-center text-center py-1 px-1">
                      <div className="font-sans font-bold text-[10.5px] tracking-widest uppercase sevt-preprinted-text">
                        Lekársky predpis
                      </div>
                      <div className="w-full">
                        <span className="text-[6.5px] block font-sans sevt-preprinted-text text-black/80 mb-0.5">
                          Kód zdravotnej poisťovne poistenca
                        </span>
                        <div className="flex justify-center items-center gap-[1.2mm]">
                          {[0, 1, 2, 3].map(i => (
                            <div key={i} className="w-[4.5mm] h-[5.5mm] border border-black bg-white"></div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Pravé okienko: Kód lekára (šírka 24mm) */}
                    <div className="w-[24mm] py-1 px-1 flex flex-col justify-between items-center text-center relative">
                      <span className="text-[6.5px] font-sans block sevt-preprinted-text text-black/80">
                        Kód lekára
                      </span>
                      <div className="w-[21mm] h-[5.5mm] border border-black bg-white flex items-center justify-center"></div>
                      <span className="text-[6.5px] font-sans font-bold sevt-preprinted-text self-end pr-1">
                        AA
                      </span>
                    </div>
                  </div>

                  {/* 2. RIADOK: MENO A PRIEZVISKO + RODNÉ ČÍSLO (výška 8.5mm) */}
                  <div className="h-[8.5mm] border-b border-black relative px-1.5">
                    <span className="absolute top-[0.6mm] left-[1.5mm] text-[6.5px] font-sans text-black/75 uppercase sevt-preprinted-text">
                      Meno a priezvisko poistenca:
                    </span>
                    <span className="absolute top-[0.6mm] right-[1.5mm] text-[6.5px] font-sans text-black/75 uppercase sevt-preprinted-text">
                      Rodné číslo:
                    </span>
                  </div>

                  {/* 3. RIADOK: BYDLISKO (výška 8.5mm) */}
                  <div className="h-[8.5mm] border-b border-black relative px-1.5">
                    <span className="absolute top-[0.6mm] left-[1.5mm] text-[6.5px] font-sans text-black/75 uppercase sevt-preprinted-text">
                      Bydlisko poistenca (obec, ulica, číslo):
                    </span>
                  </div>

                  {/* 4. RIADOK: DIAGNÓZA S OKIENKAMI & ÚHRADA (výška 8.5mm) */}
                  <div className="h-[8.5mm] border-b border-black flex items-center justify-between px-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[7.5px] font-sans font-bold sevt-preprinted-text">
                        Dg.
                      </span>
                      <div className="flex gap-[1.2mm]">
                        {[0, 1, 2, 3].map(i => (
                          <div key={i} className="w-[4.5mm] h-[5.5mm] border border-black bg-white"></div>
                        ))}
                      </div>
                    </div>
                    <div className="text-[6.5px] font-sans text-black/75 sevt-preprinted-text flex items-center gap-2">
                      <span>Úhrada:</span>
                      <span className="flex items-center gap-1">poistenec <span className="inline-block w-2.5 h-2.5 border border-black bg-white"></span></span>
                      <span className="flex items-center gap-1">poisťovňa <span className="inline-block w-2.5 h-2.5 border border-black bg-white"></span></span>
                    </div>
                  </div>

                  {/* 5. LIEČIVÁ RP. — DÔSTOJNÝ PRIESTOR PRE EXAKTNÝCH 1 LIEK (výška 69.5mm) */}
                  <div className="h-[69.5mm] relative px-1.5 pt-1">
                    <div className="text-[19px] font-serif font-bold italic sevt-preprinted-text select-none">
                      Rp.
                    </div>

                    {/* Ochranná čiara a označenie: 1 predpísaný liek (zamedzuje dodatočnému dopisovaniu) */}
                    <div className="absolute top-[43.5mm] left-[13mm] right-[2mm] flex items-center gap-2 text-black/35 font-mono text-[6.5px] tracking-wider uppercase select-none sevt-preprinted-text">
                      <div className="flex-1 border-b border-dashed border-black/30"></div>
                      <span>1 liek na predpis • vacat</span>
                      <div className="flex-1 border-b border-dashed border-black/30"></div>
                    </div>
                  </div>

                  {/* 6. SPODNÁ SEKCIA: DŇA + PEČIATKA A PODPIS LEKÁRA (výška 22mm) */}
                  <div className="h-[22mm] border-t-2 border-black flex">
                    {/* Vľavo: Dátum a poradové číslo */}
                    <div className="w-[45mm] p-1.5 flex flex-col justify-between border-r-2 border-black">
                      <div className="pt-0.5">
                        <span className="text-[7.5px] font-sans font-bold sevt-preprinted-text">
                          Dňa:
                        </span>
                        <span className="inline-block w-[28mm] border-b border-black/50 ml-1"></span>
                      </div>
                      <div className="pb-0.5">
                        <span className="text-[6.5px] font-sans text-black/70 sevt-preprinted-text">
                          Evid. číslo:
                        </span>
                      </div>
                    </div>

                    {/* Vpravo: Pečiatka a podpis lekára */}
                    <div className="flex-1 p-1">
                      <div className="w-full h-full border border-dashed border-black/50 flex flex-col justify-between items-center py-1 text-center bg-white/50">
                        <span className="text-[6.5px] font-sans text-black/75 uppercase tracking-tight sevt-preprinted-text">
                          Odtlačok pečiatky a podpis lekára
                        </span>
                        <span className="text-[6px] text-[#8C857B] italic">
                          SAY CLINIC Banská Bystrica
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* 7. PÄTA ŠEVT (pod vonkajším rámčekom na 143mm) */}
                <div className="absolute top-[143.5mm] left-[5mm] right-[5mm] flex justify-between text-[5.5px] font-sans text-black/60 sevt-preprinted-text px-0.5">
                  <span>ŠEVT 14 282 2s • Tlačivo lekárskeho predpisu MZ SR</span>
                  <span>SAY CLINIC s.r.o.</span>
                </div>

              </div>

              {/* ========================================================================= */}
              {/* DYNAMICKÝ TEXT TLAČENÝ PRESNE NA PREPOČÍTANÉ POZÍCIE ŠEVT                  */}
              {/* ========================================================================= */}
              <div className="sevt-dynamic-container absolute inset-0 pointer-events-none">
                
                {/* 1. KÓD LEKÁRA (V pravom hornom okienku) */}
                {renderDraggableItem('doctorCode', (
                  <div className="w-[21.0mm] h-[5.5mm] flex items-center justify-center font-bold tracking-wider leading-none text-center">
                    {doctorCode}
                  </div>
                ))}

                {/* 2. ZDRAVOTNÁ POISŤOVŇA (4 okienka v strede hore) */}
                {renderDraggableItem('insurance', (
                  <div className="flex items-center gap-[1.2mm]">
                    {insBoxes.map((digit, i) => (
                      <div key={i} className="w-[4.5mm] h-[5.5mm] flex items-center justify-center font-bold text-center leading-none">
                        {digit}
                      </div>
                    ))}
                  </div>
                ))}

                {/* 3. PACIENT A RODNÉ ČÍSLO */}
                {renderDraggableItem('patientName', patientName)}
                {renderDraggableItem('birthNumber', birthNumber)}

                {/* 4. BYDLISKO */}
                {renderDraggableItem('address', address)}

                {/* 5. DIAGNÓZA 1 (MKCH-10 v 4 okienkach vedľa Dg.) */}
                {renderDraggableItem('diagnosis', (
                  <div className="flex items-center gap-[1.2mm]">
                    {dgBoxes.map((char, i) => (
                      <div key={i} className="w-[4.5mm] h-[5.5mm] flex items-center justify-center font-bold text-center leading-none">
                        {char}
                      </div>
                    ))}
                  </div>
                ))}

                {/* 6. PREDPÍSANÝ LIEK (1 LIEK NA CELÝ PRIESTOR RP.) */}
                {activeMed && renderDraggableItem('rp1', (
                  <div className="space-y-1">
                    {/* Riadok 1: Účinná látka / Generický názov */}
                    <div 
                      className="text-[1.12em] font-bold tracking-wide" 
                      style={{ textTransform: elementFonts.rp1?.textTransform || 'none' }}
                    >
                      {activeMed.substance || activeMed.latinName}
                    </div>

                    {/* Riadok 2: Lieková forma a sila */}
                    {activeMed.formAndStrength && (
                      <div className="text-[0.95em] font-medium text-black">
                        {activeMed.formAndStrength}
                      </div>
                    )}

                    {/* Riadok 3: Počet balení */}
                    <div className="text-[0.98em] font-semibold text-black">
                      {activeMed.packaging}
                    </div>

                    {/* Riadok 4: Dávkovanie */}
                    <div className="text-[0.95em] font-medium text-black">
                      {activeMed.dosage}
                    </div>

                    {/* Riadok 5: Komerčný názov v zátvorke */}
                    {activeMed.commercialName && (
                      <div className="text-[0.9em] italic text-black/90">
                        ({activeMed.commercialName.replace(/^\(|\)$/g, '')})
                      </div>
                    )}
                  </div>
                ))}

                {/* 7. DÁTUM VYSTAVENIA (Vedľa Dňa:) */}
                {renderDraggableItem('date', prescriptionDate)}

                {/* 8. PORADOVÉ ČÍSLO PREDPISU (Vľavo dole) */}
                {prescriptionOrderNumber && renderDraggableItem('orderNumber', prescriptionOrderNumber)}

              </div>

            </div>

          </div>

          <div className="mt-3 text-center text-xs text-[#8C857B] print:hidden max-w-sm space-y-1">
            <p>
              💡 <strong>Tip:</strong> Text môžete potiahnuť ľavým tlačidlom myši a pravým tlačidlom myši otvoriť všetky nastavenia písma.
            </p>
          </div>

        </div>

      </div>

      {/* KONTEXTOVÉ MENU PRE NASTAVENIE PÍSMA A MANUÁLNY POSUN KONKRÉTNEHO TEXTU */}
      {contextMenu && (
        <PrescriptionFontContextMenu
          isOpen={Boolean(contextMenu.isOpen)}
          x={contextMenu.x || 0}
          y={contextMenu.y || 0}
          elementKey={contextMenu.elementKey || 'patientName'}
          elementLabel={contextMenu.elementLabel || 'Text'}
          fontStyle={(contextMenu.elementKey && elementFonts[contextMenu.elementKey]) || DEFAULT_ELEMENT_FONTS[contextMenu.elementKey] || DEFAULT_ELEMENT_FONTS.patientName}
          offset={(contextMenu.elementKey && elementOffsets[contextMenu.elementKey]) || { x: 0, y: 0 }}
          onUpdateFont={updateElementFont}
          onUpdateOffset={updateElementOffset}
          onResetFont={resetElementFont}
          onResetOffset={resetElementOffset}
          onApplyFontToAll={applyFontToAllElements}
          onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
        />
      )}

    </div>
  );
}
