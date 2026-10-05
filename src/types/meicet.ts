export interface MeicetMetricDetail {
  score: number; // 0 - 100
  percentile?: number; // percentile compared to age group (e.g. 78% better than peers)
  status: 'výborný' | 'dobrý' | 'mierne zhoršený' | 'kritický';
  description: string;
  clinicalSignificance: string;
}

export interface MeicetSkinMetrics {
  skinScoreOverall: number; // 0 - 100
  skinAge: number; // estimated skin age from Meicet AI
  actualAge: number; // chronological age
  skinType: 'suchá' | 'mastná' | 'zmiešaná' | 'normálna' | 'citlivá';
  fitzpatrickPhototype: 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';
  
  // Specific multispectral metrics
  hydration: MeicetMetricDetail & {
    tewlLevel: 'nízka' | 'stredná' | 'vysoká'; // transepidermal water loss
    moistureZoneNote: string;
  };
  pores: MeicetMetricDetail & {
    poreCountEstimate?: number;
    predominantZone: string; // napr. 'T-zóna, nos a líca'
  };
  wrinkles: MeicetMetricDetail & {
    fineLinesScore: number;
    deepWrinklesScore: number;
    primaryZones: string[]; // napr. ['Periorbitálne', 'Glabela', 'Nazolabiálne ryhy']
  };
  texture: MeicetMetricDetail & {
    roughnessIndex: number;
    keratinizationState: string;
  };
  uvDamage: MeicetMetricDetail & {
    hiddenSpotsRisk: 'nízke' | 'stredné' | 'vysoké';
    photodamageSeverity: string;
  };
  brownSpots: MeicetMetricDetail & {
    melasmaTendency: boolean;
    pigmentDepth: 'epidermálny' | 'dermálny' | 'zmiešaný';
  };
  redAreas: MeicetMetricDetail & {
    erythemaLevel: 'pokojná' | 'mierne reaktívna' | 'vysoko citlivá / cievna';
    rosaceaRisk: boolean;
    telangiectasiaZones: string[];
  };
  sebumAndPorphyrins: MeicetMetricDetail & {
    tZoneOiliness: 'nízka' | 'vyvážená' | 'zvýšená';
    microbialActivity: 'minimálna' | 'stredná' | 'aktívna';
  };
}

export interface MeicetAnamnesisContext {
  pastSurgeries: string[]; // e.g. ["Blefaroplastika horných viečok (05/2026)", "Augmentácia prsníkov"]
  allergies: string[]; // e.g. ["Penicilín", "Nikel"]
  aestheticTreatments: string[]; // e.g. ["Botox glabela (01/2026)", "Skinbooster 1ml"]
  scarHistory: {
    location: string;
    origin: string; // napr. "Po blefaroplastike", "Pooperačná jazva", "Po akné"
    maturityMonths: number;
    appearance: 'čerstvá erytematózna' | 'vyzretá normotrofická' | 'hypertrofická' | 'keloidná' | 'atrofická';
    currentCare: string;
  }[];
  clientConcerns: string[];
  contraindications: string[];
  lifestyleNotes?: string;
}

export interface MeicetTreatmentPlanItem {
  id: string;
  name: string;
  category: 'laser' | 'injectable' | 'skin_care' | 'surgery' | 'scar_care' | 'rehab';
  targetArea: string;
  seasonOrMonth: string; // napr. 'Október' alebo 'Q4 (Jeseň)'
  frequency: string; // napr. '1 sedenie', 'Séria 3 sedení po 4 týždňoch'
  priority: 'vysoká' | 'odporúčaná' | 'udržiavacia';
  estimatedPrice?: number;
  reasoning: string; // prečo je indikovaný na základe Meicet + anamnézy
  status: 'planned' | 'booked' | 'completed';
  calendarEventId?: string;
  isMeicetScan?: boolean;
}

export interface MeicetSeasonalSchedule {
  quarter: string; // 'Q1 (Jan - Mar)' | 'Q2 (Apr - Jún)' | 'Q3 (Júl - Sep)' | 'Q4 (Okt - Dec)'
  season: 'jar' | 'leto' | 'jesen' | 'zima';
  title: string;
  focus: string;
  seasonalConsideration: string; // napr. "V lete striktný zákaz CO2 lasera, prioritou je SPF a hydratácia"
  treatments: MeicetTreatmentPlanItem[];
}

export interface MeicetSkincareProduct {
  step: number;
  category: string;
  productName: string;
  brand: string;
  activeIngredients: string;
  usage: string;
  purpose: string;
  price?: number;
  meicetJustification: string; // odkaz na Meicet skóre (napr. na zníženie TEWL a pórov)
}

export interface MeicetScarCareProtocol {
  hasScars: boolean;
  scarSummary: string;
  dailyRoutine: {
    cleansing: string;
    siliconeTherapy: string; // presná aplikácia silikónového gélu alebo plátkov
    pressureMassage: string; // technika a frekvencia tlakovej masáže
    sunProtection: string; // minerálny filter SPF 50+ na zamedzenie pigmentácie jazvy
  };
  clinicalLaserTherapy: {
    recommendedProcedures: string[];
    bestSeason: string;
    precautions: string;
  };
  warningSigns: string[];
}

export interface MeicetMilestone {
  timeframe: string; // 'Po 3 mesiacoch', 'Po 6 mesiacoch', 'Po 12 mesiacoch'
  title: string;
  focusArea: string;
  targetMetrics: string; // napr. 'Zvýšenie hydratácie z 45% na >70%, zníženie cievneho erytému o 30%'
  rescanChecklist: string[];
}

export interface MeicetAnalysisResult {
  id: string;
  patientId: string;
  patientName: string;
  patientBirthNumber?: string;
  scanDate: string;
  deviceModel: string; // 'Meicet Pro-A (ISEMECO 3D Spectral)'
  pdfSourceFilename?: string;
  
  // Extrahované metriky z Meicet
  metrics: MeicetSkinMetrics;
  
  // Anamnestický kontext použitý na syntézu
  anamnesis: MeicetAnamnesisContext;
  
  // Komplexné lekárske zhodnotenie (Synergia Meicet dát + Anamnézy)
  clinicalSynthesis: {
    summary: string;
    keyFindings: string[];
    riskAlerts: string[];
    synergyWithSurgeries: string;
  };
  
  // 12-mesačný ročný plán ošetrení
  annualSchedule: MeicetSeasonalSchedule[];
  
  // Ranná a večerná skincare rutina
  skincareRoutine: {
    morning: MeicetSkincareProduct[];
    evening: MeicetSkincareProduct[];
    weeklyCare: string[];
    seasonalTips: string;
  };
  
  // Špecifický protokol starostlivosti o jazvy
  scarProtocol: MeicetScarCareProtocol;
  
  // Kontrolné míľniky a pretestovanie na Meicet
  milestones: MeicetMilestone[];
  
  // Lekárske odporúčanie a podpis
  doctorNotes: string;
  doctorName: string;
  createdAt: string;
}
