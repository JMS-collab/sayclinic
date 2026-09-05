export type InterventionType =
  | 'injectable'        // Injekčná estetika: Botox, Kyselina hyalurónová, Biostimulátory, Polynukleotidy
  | 'laser_device'      // Lasery a prístroje: Frakčný CO2 laser, Vaskulárny laser, RF microneedling
  | 'dermatology_care'  // Dermatologická starostlivosť: Chemické peelingy, Mezoterapia, Skinbooster, Hĺbková hydratácia
  | 'skincare_routine'  // Domáca starostlivosť: Špeciálna dermokozmetika SAY CLINIC, retinoidy, SPF, antioxidanty
  | 'surgical_followup'; // Chirurgická pooperačná starostlivosť, kontroly MUDr. Ján Mráz, starostlivosť o jazvy

export interface RoadmapIntervention {
  id: string;
  month: number; // 1 to 12
  monthLabel: string; // napr. "1. Mesiac (Október)"
  season: 'jar' | 'leto' | 'jesen' | 'zima';
  type: InterventionType;
  title: string;
  description: string;
  targetArea: string; // napr. "Čelo a glabela", "Líca a nazolabiálne ryhy", "Pery", "Krk a dekolt", "Pooperačné jazvy"
  intensity: 'jemná' | 'stredná' | 'intenzívna' | 'udržiavacia';
  estimatedDuration?: string; // napr. "30 min", "45 min", "Denná rutina"
  estimatedPrice?: number;
  priority: 'vysoká' | 'odporúčaná' | 'voliteľná';
  status: 'planned' | 'scheduled' | 'completed' | 'skipped';
  homeCareProduct?: string; // napr. "SAY Clinic Skin Shield SPF 50+"
  clinicalRationale?: string; // Medicínske odôvodnenie časovania
  contraindicationsOrPrecautions?: string;
  calendarEventId?: string;
}

export interface RoadmapMonth {
  monthIndex: number; // 1..12
  name: string; // napr. "1. Mesiac"
  calendarMonthName: string; // napr. "Október 2026"
  season: 'jar' | 'leto' | 'jesen' | 'zima';
  seasonLabel: string;
  focusTheme: string; // Hlavné zameranie mesiaca
  clinicalGoal: string;
  interventions: RoadmapIntervention[];
}

export interface SkincareStep {
  step: number;
  category: string; // napr. "Čistenie", "Aktívne sérum", "Hydratácia & Bariéra", "SPF Ochrana", "Retinoid"
  productName: string;
  activeIngredients: string;
  frequency: string; // napr. "Každé ráno", "Večer 3x týždenne", "Každý večer"
  usageNote: string;
}

export interface AIHealthRoadmap {
  id: string;
  patientId: string;
  patientName: string;
  patientBirthNumber?: string;
  createdAt: string;
  updatedAt: string;
  doctorName: string;
  title: string;
  
  // Analytický prehľad pacienta
  patientAnalysis: {
    analyzedProceduresCount: number;
    analyzedAestheticSessionsCount: number;
    skinConditionSummary: string;
    identifiedConcerns: string[];
    fitzpatrickPhototype: string;
    clinicalAssessment: string;
    pastSurgeriesSummary?: string;
    aestheticHistorySummary?: string;
  };

  // 12-Mesačný plán rozdelený po mesiacoch
  months: RoadmapMonth[];

  // Celoročná domáca starostlivosť a kozmetická rutina
  dailySkincareRoutine: {
    morning: SkincareStep[];
    evening: SkincareStep[];
    weeklyTreatments: string[];
  };

  // Sezónne pravidlá a fotoprotekcia
  seasonalGuidelines: {
    jar: string;
    leto: string;
    jesen: string;
    zima: string;
  };

  // Upozornenia a medicínske poznámky
  doctorRecommendations: string;
  safetyPrecautions: string[];
}

export const INTERVENTION_META: Record<InterventionType, {
  label: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  icon: string;
}> = {
  injectable: {
    label: 'Injekčná estetika',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-800',
    borderColor: 'border-purple-200',
    icon: '💉',
  },
  laser_device: {
    label: 'Laser & Prístroje',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-800',
    borderColor: 'border-rose-200',
    icon: '⚡',
  },
  dermatology_care: {
    label: 'Dermatológia & Peelingy',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    borderColor: 'border-emerald-200',
    icon: '💆',
  },
  skincare_routine: {
    label: 'Domáca Skincare Rutina',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    borderColor: 'border-amber-200',
    icon: '🧴',
  },
  surgical_followup: {
    label: 'Chirurgia & Kontroly',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-800',
    borderColor: 'border-sky-200',
    icon: '🏥',
  },
};
