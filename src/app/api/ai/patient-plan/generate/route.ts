import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { PatientPlan } from '@/data/patientPlanConfig';
import { synthesizeEbmPatientPlan, resolveSelectedProcedures } from '@/services/ebmPlanSynthesizer';

interface PlanCacheEntry {
  plan: PatientPlan;
  timestamp: number;
}

const planCache = new Map<string, PlanCacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minút cache

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      patientName,
      patientId,
      patientBirthNumber,
      planType = 'combined',
      diagnosisOrGoal = '',
      procedureName = '',
      skinType = '',
      mainConcerns = [],
      vectorZones = [],
      selectedProcedureIds = [],
      existingTreatments = [],
      basePlan,
      doctorName = 'MUDr. Ján Mráz',
      forceRefresh = false
    } = body;

    // 1. Zostavíme klinicky overený EBM základ podľa vybratých operácií a výkonov
    const ebmFoundationPlan = synthesizeEbmPatientPlan({
      basePlan,
      patientId: patientId || 'P1',
      patientName: patientName || 'Pacient SAY CLINIC',
      patientBirthNumber,
      doctorName,
      skinType: skinType || 'Zmiešaná / normálna',
      selectedProcedureIds,
      existingTreatments,
      diagnosisOrGoal: `${procedureName} ${diagnosisOrGoal}`.trim()
    });

    const resolvedProcs = resolveSelectedProcedures(
      selectedProcedureIds,
      existingTreatments,
      `${procedureName} ${diagnosisOrGoal}`
    );
    const cacheKey = `${patientId || 'unknown'}-${resolvedProcs.map(p => p.id).join('_')}-${diagnosisOrGoal}`;

    if (!forceRefresh) {
      const cached = planCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return NextResponse.json({ success: true, plan: cached.plan, source: 'server-cache' });
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // 2. Ak je dostupný GEMINI_API_KEY, obohatíme plán cez Gemini AI so striktným EBM a pacientsky zrozumiteľným protokolom
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build'
            }
          }
        });

        const selectedProceduresSummary = resolvedProcs
          .map((p, idx) => `${idx + 1}. ${p.label} (${p.targetArea}) - Guideline: ${p.clinicalGuideline}`)
          .join('\n');

        const systemPrompt = `Si vedúci plastický chirurg a certifikovaný dermatológ na klinike SAY CLINIC (MUDr. Ján Mráz).
Tvojou úlohou je upraviť a personalizovať kompletný ROČNÝ PLÁN STAROSTLIVOSTI (3-v-1: 1. SAY Skincare, 2. Ročný Plán výkonov, 3. SAY Care Predoperačný & Pooperačný protokol) presne podľa VYBRATÝCH OPERÁCIÍ A VÝKONOV pacienta.

HLAVNÉ PRAVIDLÁ:
1. OVERENÉ ŠTÚDIE A GUIDELINY (Evidence-Based Medicine):
   - Všetky odporúčania, odstupy medzi operáciami, lasermi a injekciami, predoperačná prehabilitácia a starostlivosť o jazvy MUSIA vychádzať z najnovších medzinárodných medicínskych guidelinov:
     • ERAS® Society Plastic Surgery Guidelines (predoperačná výživa, nefajčenie 4 týždne pred/po, vysadenie ASA/NSAID 10-14 dní pred, včasná mobilizácia).
     • International Advisory Panel on Scar Management (Mustoe et al. / Gold et al. – 100% silikónový gél od 14. dňa, tlakové masáže od 21. dňa, včasný cievny a frakčný CO2 laser, SPF 50+ počas 12 mesiacov).
     • ASPS & ISAPS Clinical Practice Guidelines (bezpečné odstupy medzi operáciou, laserovým resurfacingom a aplikáciou botulotoxínu/HA).
     • EADV & Duke University Antioxidant Parameters (15% L-askorbová kyselina + ferulová kyselina ráno, vysadenie retinoidov 7 dní pred zákrokom, ceramidová bariérová obnova 2:4:2).
2. ZROZUMITEĽNOSŤ PRE PACIENTA:
   - Každý krok, každá inštrukcia a každý zákrok musí byť vysvetlený ĽUDSKY, EMPATICKY, PREHĽADNE A ZROZUMITEĽNE pre bežného pacienta (bez nezrozumiteľného žargónu, resp. odborný pojem vždy hneď jednoducho vysvetliť: Čo to pre pacienta znamená, prečo sa to robí a čo môže očakávať).
3. DUÁLNA SKINCARE RUTINA:
   - Pre každý krok rannej a večernej rutiny vyplň standardOption ("Základná starostlivosť": La Roche-Posay, CeraVe, Vichy) a premiumOption ("Prémiová starostlivosť": SkinCeuticals, Dermaceutic).

Vráť ČISTÝ JSON s týmito kľúčmi:
{
  "title": string,
  "diagnosisOrGoal": string,
  "patientFriendlySummary": string,
  "annualTreatments": [
    {
      "name": string,
      "category": "surgery" | "laser" | "injectable" | "skin_care" | "scar_care",
      "seasonOrMonth": string,
      "targetArea": string,
      "frequencyOrSessions": string,
      "estimatedPrice": number,
      "priority": "high" | "medium" | "recommended",
      "notes": string,
      "patientExplanation": string,
      "clinicalGuideline": string,
      "recoveryTime": string
    }
  ],
  "doctorNote": string
}`;

        const userPrompt = `Pacient: ${patientName || 'Pacient SAY CLINIC'}
Typ pleti: ${skinType || 'Zmiešaná / citlivá'}
Cieľ / Indikácia: ${diagnosisOrGoal || procedureName || 'Komplexná chirurgická a estetická starostlivosť'}
Hlavné požiadavky: ${Array.isArray(mainConcerns) ? mainConcerns.join(', ') : mainConcerns}
Vybraté operácie a výkony, ktorým sa musí prispôsobiť celý ročný plán:
${selectedProceduresSummary}`;

        const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
        let parsed: any = null;
        let successfulModel = '';

        for (const modelName of modelsToTry) {
          try {
            const response = await ai.models.generateContent({
              model: modelName,
              contents: [
                { role: 'system', parts: [{ text: systemPrompt }] },
                { role: 'user', parts: [{ text: userPrompt }] }
              ],
              config: {
                responseMimeType: 'application/json'
              }
            });

            const text = response.text;
            if (text) {
              parsed = JSON.parse(text);
              successfulModel = modelName;
              break;
            }
          } catch (modelErr: any) {
            console.warn(`AI Patient Plan (${modelName}) fallback:`, modelErr?.message || modelErr);
          }
        }

        if (parsed) {
          const mergedPlan: PatientPlan = {
            ...ebmFoundationPlan,
            title: parsed.title || ebmFoundationPlan.title,
            diagnosisOrGoal: parsed.diagnosisOrGoal || ebmFoundationPlan.diagnosisOrGoal,
            patientFriendlySummary: parsed.patientFriendlySummary || ebmFoundationPlan.patientFriendlySummary,
            annualTreatments:
              Array.isArray(parsed.annualTreatments) && parsed.annualTreatments.length > 0
                ? parsed.annualTreatments.map((t: any, idx: number) => ({
                    id: `trt-ai-${Date.now()}-${idx}`,
                    stepOrder: idx + 1,
                    name: t.name || ebmFoundationPlan.annualTreatments[idx]?.name || 'Klinický výkon',
                    category: t.category || ebmFoundationPlan.annualTreatments[idx]?.category || 'surgery',
                    isSkinTreatment: t.category === 'laser' || t.category === 'skin_care' || t.category === 'scar_care',
                    seasonOrMonth: t.seasonOrMonth || `${idx + 1}. Krok`,
                    targetArea: t.targetArea || 'Tvár / Telo',
                    frequencyOrSessions: t.frequencyOrSessions || 'Podľa protokolu',
                    estimatedPrice: Number(t.estimatedPrice) || ebmFoundationPlan.annualTreatments[idx]?.estimatedPrice || 450,
                    priority: t.priority || 'high',
                    status: 'planned',
                    notes: t.notes || ebmFoundationPlan.annualTreatments[idx]?.notes,
                    patientExplanation:
                      t.patientExplanation ||
                      ebmFoundationPlan.annualTreatments[idx]?.patientExplanation ||
                      'Výkon zaradený v bezpečnom časovom odstupe pre optimálne hojenie a prirodzený výsledok.',
                    clinicalGuideline:
                      t.clinicalGuideline ||
                      ebmFoundationPlan.annualTreatments[idx]?.clinicalGuideline ||
                      'ASPS & ERAS® Evidence-Based Clinical Practice Guideline',
                    recoveryTime:
                      t.recoveryTime ||
                      ebmFoundationPlan.annualTreatments[idx]?.recoveryTime ||
                      '7 – 14 dní podľa individuálneho hojenia'
                  }))
                : ebmFoundationPlan.annualTreatments,
            doctorNote: parsed.doctorNote || ebmFoundationPlan.doctorNote
          };

          planCache.set(cacheKey, { plan: mergedPlan, timestamp: Date.now() });
          return NextResponse.json({ success: true, plan: mergedPlan, source: successfulModel });
        }
      } catch (geminiError) {
        console.warn('Gemini AI enrichment fallback to EBM clinical synthesizer:', geminiError);
      }
    }

    // 3. Vrátime kompletne zostavený, EBM overený a pre pacienta zrozumiteľný plán
    planCache.set(cacheKey, { plan: ebmFoundationPlan, timestamp: Date.now() });
    return NextResponse.json({
      success: true,
      plan: ebmFoundationPlan,
      source: 'ebm-clinical-guidelines-engine'
    });
  } catch (error: any) {
    console.error('Error generating EBM patient plan:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Chyba pri generovaní plánu pacienta' },
      { status: 500 }
    );
  }
}
