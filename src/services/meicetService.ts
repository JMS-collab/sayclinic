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
   * Konvertuje MeicetAnalysisResult na štandardný PatientPlan (kompatibilný so SAY CLINIC ekosystémom 3 pilierov)
   */
  static convertToPatientPlan(result: MeicetAnalysisResult): PatientPlan {
    const flatTreatments: ScheduledTreatment[] = [];

    result.annualSchedule.forEach(season => {
      season.treatments.forEach((t, idx) => {
        flatTreatments.push({
          id: t.id || `meicet-trt-${idx}`,
          name: t.name,
          category: t.category,
          seasonOrMonth: `${season.quarter} (${t.seasonOrMonth})`,
          targetArea: t.targetArea,
          frequencyOrSessions: t.frequency,
          estimatedPrice: t.estimatedPrice,
          priority: t.priority === 'vysoká' ? 'high' : t.priority === 'odporúčaná' ? 'medium' : 'recommended',
          status: t.status,
          isSkinTreatment: t.category === 'skin_care' || t.category === 'injectable' || !!t.isMeicetScan,
          notes: `${t.reasoning}${t.isMeicetScan ? ' [3D Kontrolné meranie Meicet Pro-A]' : ''}`
        });
      });
    });

    const midMorning = result.skincareRoutine?.midEnd?.morning || [];
    const highMorning = result.skincareRoutine?.highEnd?.morning || result.skincareRoutine?.morning || [];
    const midEvening = result.skincareRoutine?.midEnd?.evening || [];
    const highEvening = result.skincareRoutine?.highEnd?.evening || result.skincareRoutine?.evening || [];
    const weeklySource = result.skincareRoutine?.highEnd?.weeklyCare || result.skincareRoutine?.weeklyCare || [];

    const maxMorning = Math.max(midMorning.length, highMorning.length);
    const morningRoutine: CosmeticRoutineItem[] = [];
    for (let i = 0; i < maxMorning; i++) {
      const std = midMorning[i] || highMorning[i];
      const prem = highMorning[i] || midMorning[i];
      const stdName = std.productName.toLowerCase().startsWith(std.brand.toLowerCase())
        ? std.productName
        : `${std.brand} ${std.productName}`;
      const premName = prem.productName.toLowerCase().startsWith(prem.brand.toLowerCase())
        ? prem.productName
        : `${prem.brand} ${prem.productName}`;

      morningRoutine.push({
        step: i + 1,
        category: std.category || prem.category,
        productName: `${stdName} / ${premName}`,
        brand: `${std.brand} / ${prem.brand}`,
        usage: std.usage || prem.usage,
        purpose: `${std.purpose} (Meicet 3D: ${std.meicetJustification})`,
        price: std.price || 0,
        standardOption: {
          tier: 'standard',
          tierName: 'Základná starostlivosť',
          productName: stdName,
          brand: std.brand,
          price: std.price || 0,
          usage: std.usage,
          purpose: `${std.purpose} • Meicet: ${std.meicetJustification}`
        },
        premiumOption: {
          tier: 'premium',
          tierName: 'Prémiová starostlivosť',
          productName: premName,
          brand: prem.brand,
          price: prem.price || 0,
          usage: prem.usage,
          purpose: `${prem.purpose} • Meicet: ${prem.meicetJustification}`
        }
      });
    }

    const maxEvening = Math.max(midEvening.length, highEvening.length);
    const eveningRoutine: CosmeticRoutineItem[] = [];
    for (let i = 0; i < maxEvening; i++) {
      const std = midEvening[i] || highEvening[i];
      const prem = highEvening[i] || midEvening[i];
      const stdName = std.productName.toLowerCase().startsWith(std.brand.toLowerCase())
        ? std.productName
        : `${std.brand} ${std.productName}`;
      const premName = prem.productName.toLowerCase().startsWith(prem.brand.toLowerCase())
        ? prem.productName
        : `${prem.brand} ${prem.productName}`;

      eveningRoutine.push({
        step: i + 1,
        category: std.category || prem.category,
        productName: `${stdName} / ${premName}`,
        brand: `${std.brand} / ${prem.brand}`,
        usage: std.usage || prem.usage,
        purpose: `${std.purpose} (Meicet 3D: ${std.meicetJustification})`,
        price: std.price || 0,
        standardOption: {
          tier: 'standard',
          tierName: 'Základná starostlivosť',
          productName: stdName,
          brand: std.brand,
          price: std.price || 0,
          usage: std.usage,
          purpose: `${std.purpose} • Meicet: ${std.meicetJustification}`
        },
        premiumOption: {
          tier: 'premium',
          tierName: 'Prémiová starostlivosť',
          productName: premName,
          brand: prem.brand,
          price: prem.price || 0,
          usage: prem.usage,
          purpose: `${prem.purpose} • Meicet: ${prem.meicetJustification}`
        }
      });
    }

    return {
      id: `plan-meicet-${result.id}`,
      patientId: result.patientId,
      patientName: result.patientName,
      patientBirthNumber: result.patientBirthNumber,
      createdAt: result.createdAt,
      updatedAt: new Date().toISOString(),
      doctorName: result.doctorName,
      planType: 'combined',
      title: `Komplexný SAY Skincare & Ročný plán (Meicet Pro-A 3D)`,
      diagnosisOrGoal: result.clinicalSynthesis.summary,
      meicetMetrics: result.metrics,
      meicetScanDate: result.scanDate,
      meicetPdfFilename: result.pdfSourceFilename,
      meicetMilestones: result.milestones,
      analysisSummary: {
        skinType: result.metrics.skinType,
        skinTonePhototype: `Fitzpatrick ${result.metrics.fitzpatrickPhototype}`,
        mainConcerns: result.clinicalSynthesis.keyFindings,
        vectorZones: result.metrics.wrinkles.primaryZones,
        facialAgeEstimated: result.metrics.skinAge
      },
      cosmeticsRoutine: {
        activeTier: 'both',
        morning: morningRoutine,
        evening: eveningRoutine,
        specialWeeklyCare: weeklySource
      },
      annualTreatments: flatTreatments,
      preOpCare: {
        procedureName: result.anamnesis.pastSurgeries[0] || 'Príprava tkanív & Prehabilitácia (SAY Care)',
        prehabilitation: {
          medicalPrehab: [
            'Interné vyšetrenie a kontrola kontraindikácií pred invazívnymi zákrokmi.',
            'Vysadenie kyseliny acetylsalicylovej (ASA), Ibuprofénu a antikoagulancií 10–14 dní pred zákrokom.',
            'Striktný zákaz fajčenia a nikotínu pre zachovanie mikrocirkulácie pleti.'
          ],
          psychologicalPrep: [
            'Konzultácia očakávaní podľa 3D spektrálnej analýzy Meicet Pro-A.',
            'Optimalizácia spánkového režimu a redukcia stresu pred zákrokom.'
          ],
          nutritionalPrep: [
            'Dostatočný príjem bielkovín, kolagénových peptidov, Vitamínu C (1000 mg) a Zinku (25 mg).',
            'Intenzívny pitný režim (min. 2,5 l vody denne) na zlepšenie Meicet skóre hydratácie.'
          ],
          physicalPrep: [
            'Aktivácia krčnej a tvárovej lymfy, uvoľnenie trapézov.',
            'Bariérová príprava pleti ceramidmi pred laserovými a chirurgickými výkonmi.'
          ]
        },
        instructions: [
          {
            id: 'meicet-pre-1',
            timeframe: '2 týždne pred zákrokom',
            title: 'Vysadenie liekov riediacich krv & Stop nikotínu',
            description: 'Vysadiť Acylpyrín, Ibuprofen a Ginkgo biloba. Nefajčiť.',
            mandatory: true
          },
          {
            id: 'meicet-pre-2',
            timeframe: '5 dní pred zákrokom',
            title: 'Vysadenie lokálneho retinolu a kyselín',
            description: 'Prejsť na čisto hydratačnú a bariérovú starostlivosť.',
            mandatory: true
          }
        ]
      },
      postOpCare: {
        procedureName: result.anamnesis.pastSurgeries[0] || 'Pooperačná & Polaserová regenerácia (SAY Care)',
        surgeryDate: undefined,
        phases: [
          {
            phaseId: 'phase-meicet-scar-1',
            period: 'Aktuálna fáza regenerácie & maturácie',
            title: 'Protokol starostlivosti o jazvy, lymfu a bariéru (SAY Care)',
            focus: result.scarProtocol.scarSummary,
            instructions: [
              `Čistenie: ${result.scarProtocol.dailyRoutine.cleansing}`,
              `Silikónová terapia: ${result.scarProtocol.dailyRoutine.siliconeTherapy}`,
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
          lymphaticDrainage: 'Manuálna a prístrojová lymfodrenáž ošetrovanej oblasti na urýchlenie vstrebania edému a zlepšenie trofiky tkaniva.',
          laserTherapy: `${result.scarProtocol.clinicalLaserTherapy.bestSeason}: ${result.scarProtocol.clinicalLaserTherapy.recommendedProcedures.join(', ')}`,
          advancedScarTherapies: result.scarProtocol.clinicalLaserTherapy.recommendedProcedures
        }
      },
      doctorNote: `${result.doctorNotes}\n\n[Zdroj dát: Diagnostický systém Meicet Pro-A, súbor: ${result.pdfSourceFilename || 'manuálny upload'}]`
    };
  }

  /**
   * Zlúči Meicet 3D analýzu do existujúceho plánu pacienta (aktualizuje SAY Skincare bez straty vlastného Ročného plánu a SAY Care)
   */
  static mergeMeicetIntoPlan(existingPlan: PatientPlan, result: MeicetAnalysisResult): PatientPlan {
    const converted = MeicetService.convertToPatientPlan(result);
    return {
      ...existingPlan,
      updatedAt: new Date().toISOString(),
      meicetMetrics: result.metrics,
      meicetScanDate: result.scanDate,
      meicetPdfFilename: result.pdfSourceFilename,
      meicetMilestones: result.milestones,
      analysisSummary: converted.analysisSummary,
      cosmeticsRoutine: converted.cosmeticsRoutine,
      preOpCare: existingPlan.preOpCare || converted.preOpCare,
      postOpCare: existingPlan.postOpCare || converted.postOpCare,
      doctorNote: `${existingPlan.doctorNote ? existingPlan.doctorNote + '\n\n' : ''}[Doplnená 3D spektrálna analýza Meicet Pro-A (${result.scanDate}): Skóre pleti ${result.metrics.skinScoreOverall}/100, Biologický vek pleti ${result.metrics.skinAge} r.]`
    };
  }
}
