import { MeicetAnalysisResult } from '@/types/meicet';
import { PatientPlan, ScheduledTreatment, CosmeticRoutineItem } from '@/data/patientPlanConfig';
import { RealtimeSyncService } from './realtimeSyncService';

const STORAGE_KEY = 'say_clinic_meicet_reports';

export class MeicetService {
  /**
   * Získa všetky uložené Meicet analýzy
   */
  static getAllReports(): Record<string, MeicetAnalysisResult[]> {
    if (typeof window === 'undefined') return {};
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (err) {
      console.error('Chyba pri čítaní Meicet reportov:', err);
      return {};
    }
  }

  /**
   * Získa Meicet analýzy pre konkrétneho pacienta
   */
  static getReportsForPatient(patientId: string): MeicetAnalysisResult[] {
    const all = this.getAllReports();
    return all[patientId] || [];
  }

  /**
   * Uloží novú Meicet analýzu
   */
  static saveReport(result: MeicetAnalysisResult): void {
    if (typeof window === 'undefined') return;
    const all = this.getAllReports();
    const patientReports = all[result.patientId] || [];
    const updated = [result, ...patientReports.filter(r => r.id !== result.id)];
    all[result.patientId] = updated;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    RealtimeSyncService.publish('meicet_reports', all);
  }

  /**
   * Zmaže Meicet analýzu
   */
  static deleteReport(patientId: string, reportId: string): void {
    if (typeof window === 'undefined') return;
    const all = this.getAllReports();
    if (!all[patientId]) return;

    all[patientId] = all[patientId].filter(r => r.id !== reportId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    RealtimeSyncService.publish('meicet_reports', all);
  }

  /**
   * Konvertuje MeicetAnalysisResult na štandardný PatientPlan (kompatibilný so SAY CLINIC ekosystémom)
   */
  static convertToPatientPlan(result: MeicetAnalysisResult): PatientPlan {
    const flatTreatments: ScheduledTreatment[] = [];

    result.annualSchedule.forEach(season => {
      season.treatments.forEach(t => {
        flatTreatments.push({
          id: t.id,
          name: t.name,
          category: t.category,
          seasonOrMonth: `${season.quarter} (${t.seasonOrMonth})`,
          targetArea: t.targetArea,
          frequencyOrSessions: t.frequency,
          estimatedPrice: t.estimatedPrice,
          priority: t.priority === 'vysoká' ? 'high' : t.priority === 'odporúčaná' ? 'medium' : 'recommended',
          status: t.status,
          notes: `${t.reasoning}${t.isMeicetScan ? ' [3D Kontrolné meranie Meicet Pro-A]' : ''}`
        });
      });
    });

    const morningRoutine: CosmeticRoutineItem[] = result.skincareRoutine.morning.map(item => ({
      step: item.step,
      category: item.category,
      productName: item.productName,
      brand: item.brand,
      usage: item.usage,
      purpose: `${item.purpose} (Odôvodnenie Meicet: ${item.meicetJustification})`,
      price: item.price
    }));

    const eveningRoutine: CosmeticRoutineItem[] = result.skincareRoutine.evening.map(item => ({
      step: item.step,
      category: item.category,
      productName: item.productName,
      brand: item.brand,
      usage: item.usage,
      purpose: `${item.purpose} (Odôvodnenie Meicet: ${item.meicetJustification})`,
      price: item.price
    }));

    return {
      id: `plan-meicet-${result.id}`,
      patientId: result.patientId,
      patientName: result.patientName,
      patientBirthNumber: result.patientBirthNumber,
      createdAt: result.createdAt,
      updatedAt: new Date().toISOString(),
      doctorName: result.doctorName,
      planType: 'annual_aesthetic',
      title: `Ročný estetický plán & starostlivosť (Meicet Pro-A AI)`,
      diagnosisOrGoal: result.clinicalSynthesis.summary,
      analysisSummary: {
        skinType: result.metrics.skinType,
        skinTonePhototype: `Fitzpatrick ${result.metrics.fitzpatrickPhototype}`,
        mainConcerns: result.clinicalSynthesis.keyFindings,
        vectorZones: result.metrics.wrinkles.primaryZones,
        facialAgeEstimated: result.metrics.skinAge
      },
      cosmeticsRoutine: {
        morning: morningRoutine,
        evening: eveningRoutine,
        specialWeeklyCare: result.skincareRoutine.weeklyCare
      },
      annualTreatments: flatTreatments,
      postOpCare: result.scarProtocol.hasScars ? {
        procedureName: result.anamnesis.pastSurgeries[0] || 'Chirurgický výkon & Korekcia jaziev',
        surgeryDate: undefined,
        phases: [
          {
            phaseId: 'phase-meicet-scar-1',
            period: 'Aktuálna fáza maturácie',
            title: 'Protokol starostlivosti o jazvy (SAY CLINIC Scar Protocol)',
            focus: result.scarProtocol.scarSummary,
            instructions: [
              `Čistenie: ${result.scarProtocol.dailyRoutine.cleansing}`,
              `Silikón: ${result.scarProtocol.dailyRoutine.siliconeTherapy}`,
              `Tlaková masáž: ${result.scarProtocol.dailyRoutine.pressureMassage}`,
              `Fotoprotekcia: ${result.scarProtocol.dailyRoutine.sunProtection}`
            ],
            scarCareGuidelines: [
              result.scarProtocol.dailyRoutine.siliconeTherapy,
              result.scarProtocol.dailyRoutine.pressureMassage,
              result.scarProtocol.dailyRoutine.sunProtection
            ],
            recommendedProcedures: result.scarProtocol.clinicalLaserTherapy.recommendedProcedures,
            warningSigns: result.scarProtocol.warningSigns
          }
        ],
        scarProtocol: {
          siliconeApplication: result.scarProtocol.dailyRoutine.siliconeTherapy,
          pressureMassage: result.scarProtocol.dailyRoutine.pressureMassage,
          sunProtection: result.scarProtocol.dailyRoutine.sunProtection,
          advancedScarTherapies: result.scarProtocol.clinicalLaserTherapy.recommendedProcedures
        }
      } : undefined,
      doctorNote: `${result.doctorNotes}\n\n[Zdroj dát: Diagnostický systém Meicet Pro-A, súbor: ${result.pdfSourceFilename || 'manuálny upload'}]`
    };
  }
}
