export interface PrescriptionCalibration {
  // Globálne posuny tlače na papieri (mm)
  offsetX: number;
  offsetY: number;

  // Typografia a písmo
  fontFamily: 'monospace' | 'sans-serif' | 'serif';
  fontScale: number; // 70 až 140 % (default 100)
  lineHeight: number; // 0.90 až 2.00 (default 1.25)
  letterSpacing: number; // -0.5 až 2.0 mm (default 0)
  fontWeight: 'normal' | 'semibold' | 'bold';
  uppercasePatient: boolean;
  uppercaseMedication: boolean;
  uppercaseDosage?: boolean;

  // Veľkosti písma pre jednotlivé zóny (pt)
  patientFontSize: number; // default 10.5 pt
  birthNumberFontSize?: number; // default 10.0 pt
  addressFontSize: number; // default 9.0 pt
  medicationFontSize: number; // default 10.5 pt
  formFontSize?: number; // default 9.5 pt
  packagingFontSize: number; // default 9.5 pt
  dosageFontSize: number; // default 9.5 pt
  commercialNameFontSize?: number; // default 9.0 pt
  codesFontSize: number; // default 10.5 pt (lekár, ZP, Dg)
  dateFontSize: number; // default 10.0 pt

  // Spôsob formátovania Rp. textu
  rpFormatStyle?: 'classic' | 'standard' | 'compact' | 'custom';
  customRp1Text?: string;
  customRp2Text?: string;
  useCustomRpText?: boolean;

  // Vizuálne pomôcky v náhľade
  previewZoom?: number; // 80, 100, 120, 140 %
  showBoundingBoxes?: boolean;

  // Sekčné vertikálne a horizontálne pozície (mm)
  doctorCodeTop: number; // default 9.5 mm
  doctorCodeRight: number; // default 7.0 mm

  insuranceTop: number; // default 19.8 mm
  insuranceLeft: number; // default 28.0 mm
  insuranceSpacing: number; // default 0.45 rem

  patientTop: number; // default 29.5 mm
  patientLeft: number; // default 6.0 mm
  birthNumberRight: number; // default 7.0 mm

  addressTop: number; // default 38.5 mm
  addressLeft: number; // default 6.0 mm

  diagnosisTop: number; // default 44.8 mm
  diagnosisLeft: number; // default 11.5 mm
  diagnosisSpacing: number; // default 0.35 rem

  rp1Top: number; // default 55.0 mm
  rp1Left: number; // default 6.0 mm
  rp1Width: number; // default 65.0 mm

  rp2Top: number; // default 97.0 mm
  rp2Left: number; // default 6.0 mm
  rp2Width: number; // default 65.0 mm

  dateTop: number; // default 127.0 mm
  dateLeft: number; // default 6.0 mm

  orderNumberTop: number; // default 130.0 mm
  orderNumberRight: number; // default 6.0 mm
}

export const DEFAULT_PRESCRIPTION_CALIBRATION: PrescriptionCalibration = {
  offsetX: 0,
  offsetY: 0,
  fontFamily: 'monospace',
  fontScale: 100,
  lineHeight: 1.25,
  letterSpacing: 0,
  fontWeight: 'bold',
  uppercasePatient: true,
  uppercaseMedication: false,
  uppercaseDosage: false,

  patientFontSize: 10.5,
  birthNumberFontSize: 10.0,
  addressFontSize: 9.0,
  medicationFontSize: 10.5,
  formFontSize: 9.5,
  packagingFontSize: 9.5,
  dosageFontSize: 9.5,
  commercialNameFontSize: 9.0,
  codesFontSize: 10.5,
  dateFontSize: 10.0,

  rpFormatStyle: 'classic',
  customRp1Text: '',
  customRp2Text: '',
  useCustomRpText: false,

  previewZoom: 100,
  showBoundingBoxes: false,

  doctorCodeTop: 9.5,
  doctorCodeRight: 7.0,

  insuranceTop: 19.8,
  insuranceLeft: 28.0,
  insuranceSpacing: 0.45,

  patientTop: 29.5,
  patientLeft: 6.0,
  birthNumberRight: 7.0,

  addressTop: 38.5,
  addressLeft: 6.0,

  diagnosisTop: 44.8,
  diagnosisLeft: 11.5,
  diagnosisSpacing: 0.35,

  rp1Top: 55.0,
  rp1Left: 6.0,
  rp1Width: 65.0,

  rp2Top: 97.0,
  rp2Left: 6.0,
  rp2Width: 65.0,

  dateTop: 127.0,
  dateLeft: 6.0,

  orderNumberTop: 130.0,
  orderNumberRight: 6.0,
};

export interface CalibrationPreset {
  id: string;
  name: string;
  description: string;
  badge: string;
  config: Partial<PrescriptionCalibration>;
}

export const CALIBRATION_PRESETS: CalibrationPreset[] = [
  {
    id: 'default',
    name: 'ŠEVT 14 282 2s (Oficiálny vzor)',
    description: 'Pôvodné overené súradnice a strojopisný monospace font pre oficiálny slovenský recept ŠEVT.',
    badge: 'Odporúčané',
    config: DEFAULT_PRESCRIPTION_CALIBRATION
  },
  {
    id: 'sayclinic_clinic',
    name: 'SAY CLINIC Ambulancia (Optimalizované)',
    description: 'Zosúladené písmo s mierne zmenšeným dávkovaním (9.0 pt) pre elegantný a bezchybne čitateľný výtlačok.',
    badge: 'Klinická prax',
    config: {
      ...DEFAULT_PRESCRIPTION_CALIBRATION,
      fontFamily: 'monospace',
      fontScale: 98,
      lineHeight: 1.22,
      patientFontSize: 10.0,
      addressFontSize: 8.8,
      medicationFontSize: 10.2,
      dosageFontSize: 9.0,
      packagingFontSize: 9.2,
      rp1Top: 55.0,
      rp2Top: 97.0,
      uppercasePatient: true,
      uppercaseMedication: false
    }
  },
  {
    id: 'compact',
    name: 'Kompaktný (Dlhšie názvy a zložené lieky)',
    description: 'Menšie písmo (88%) a tesnejšie riadkovanie (1.15) pre dlhé zložené lieky a detailné dávkovanie.',
    badge: 'Viac textu',
    config: {
      ...DEFAULT_PRESCRIPTION_CALIBRATION,
      fontScale: 88,
      lineHeight: 1.15,
      patientFontSize: 9.5,
      addressFontSize: 8.5,
      medicationFontSize: 9.5,
      dosageFontSize: 8.5,
      packagingFontSize: 8.5,
      rp1Top: 54.0,
      rp2Top: 95.0
    }
  },
  {
    id: 'bold_sans',
    name: 'Výrazný Arial / Sans (Vysoká čitateľnosť)',
    description: 'Bezpätkové písmo s vysokou čitateľnosťou aj pri slabšom toneri v ambulancii.',
    badge: 'Moderný',
    config: {
      ...DEFAULT_PRESCRIPTION_CALIBRATION,
      fontFamily: 'sans-serif',
      fontWeight: 'bold',
      fontScale: 100,
      lineHeight: 1.25,
      patientFontSize: 10.5,
      addressFontSize: 9.0,
      medicationFontSize: 10.5,
      dosageFontSize: 9.5,
      packagingFontSize: 9.5
    }
  },
  {
    id: 'typewriter',
    name: 'Ihličková tlačiareň / Písací stroj (Courier)',
    description: 'Tradičný lekársky predpis s miernym rozostupom znakov pre ihličkové a mechanické tlačiarne.',
    badge: 'Retro strojopis',
    config: {
      ...DEFAULT_PRESCRIPTION_CALIBRATION,
      fontFamily: 'monospace',
      fontWeight: 'bold',
      fontScale: 100,
      lineHeight: 1.35,
      letterSpacing: 0.2
    }
  },
  {
    id: 'large',
    name: 'Zväčšené písmo (+15%)',
    description: 'Väčšie písmo (115%) pre staršie tlačiarne alebo pacientov so slabším zrakom.',
    badge: 'Veľké písmo',
    config: {
      ...DEFAULT_PRESCRIPTION_CALIBRATION,
      fontScale: 115,
      lineHeight: 1.28,
      patientFontSize: 11.5,
      addressFontSize: 10.0,
      medicationFontSize: 11.5,
      dosageFontSize: 10.0,
      packagingFontSize: 10.0,
      rp1Top: 53.5,
      rp2Top: 95.5
    }
  }
];

export function getFontFamilyCss(family: 'monospace' | 'sans-serif' | 'serif'): string {
  switch (family) {
    case 'sans-serif':
      return 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    case 'serif':
      return 'Georgia, Cambria, "Times New Roman", Times, serif';
    case 'monospace':
    default:
      return 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
  }
}
