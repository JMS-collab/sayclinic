import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { PRESET_PATIENT_PLANS, PatientPlan } from '@/data/patientPlanConfig';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      patientName, 
      patientId, 
      planType = 'annual_aesthetic', // 'annual_aesthetic' | 'pre_post_op' | 'combined'
      diagnosisOrGoal = '',
      procedureName = '',
      skinType = '',
      mainConcerns = [],
      vectorZones = [],
      doctorName = 'MUDr. Ján Mráz'
    } = body;

    const apiKey = process.env.GEMINI_API_KEY;

    // Ak máme kľúč, môžeme použiť Gemini 3.8 Flash na detailnú personalizáciu
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        
        const systemPrompt = `Si špičkový plastický chirurg a certifikovaný dermatológ na prestížnej klinike SAY CLINIC v Bratislave (vedúci lekár MUDr. Ján Mráz).
Tvojou úlohou je vygenerovať kompletný, vysoko profesionálny medicínsky a estetický PLÁN PACIENTA (Patient Treatment & Care Plan) v slovenskom jazyku.

Tento plán môže byť:
1. "annual_aesthetic" (Ročný estetický plán na 12 mesiacov: domáca kozmetika ráno/večer, sezónny rozpis procedúr laser, botox, výplne, mezoterapia, skinbooster, príp. operácie).
2. "pre_post_op" (Predoperačná príprava a pooperačný plán: čo robiť 4 týždne, 2 týždne, 1 týždeň pred operáciou, laboratórne testy, zákaz fajčenia, vysadenie liekov na krvácanie; a následne pooperačná starostlivosť: 1.-7. deň, vybratie stehov, starostlivosť o jazvy - silikón, tlakové masáže, SPF50 ochrana, a následné procedúry do budúcna: vaskulárny laser, frakčný CO2 laser, microneedling, lymfodrenáž).
3. "combined" (Kombinácia oboch).

VÝSTUP MUSÍ BYŤ ČISTÝ JSON zodpovedajúci rozhraniu:
{
  "title": string,
  "diagnosisOrGoal": string,
  "analysisSummary": {
    "skinType": string,
    "skinTonePhototype": string,
    "mainConcerns": string[],
    "vectorZones": string[]
  },
  "cosmeticsRoutine": {
    "morning": [
      { "step": 1, "category": string, "productName": string, "brand": string, "usage": string, "purpose": string, "price": number }
    ],
    "evening": [
      { "step": 1, "category": string, "productName": string, "brand": string, "usage": string, "purpose": string, "price": number }
    ],
    "specialWeeklyCare": string[]
  },
  "annualTreatments": [
    {
      "id": string,
      "name": string,
      "category": "laser" | "injectable" | "skin_care" | "surgery" | "rehab" | "scar_care",
      "seasonOrMonth": string,
      "targetArea": string,
      "frequencyOrSessions": string,
      "estimatedPrice": number,
      "priority": "high" | "medium" | "recommended",
      "status": "planned",
      "notes": string
    }
  ],
  "preOpCare": {
    "procedureName": string,
    "instructions": [
      { "id": string, "timeframe": string, "title": string, "description": string, "mandatory": boolean }
    ]
  },
  "postOpCare": {
    "procedureName": string,
    "phases": [
      {
        "phaseId": string,
        "period": string,
        "title": string,
        "focus": string,
        "instructions": string[],
        "scarCareGuidelines": string[],
        "recommendedProcedures": string[],
        "warningSigns": string[]
      }
    ],
    "scarProtocol": {
      "siliconeApplication": string,
      "pressureMassage": string,
      "sunProtection": string,
      "advancedScarTherapies": string[]
    }
  },
  "doctorNote": string
}

Uveď konkrétne klinické produkty (napr. SAY Clinic Derm Gentle Cleanser, SAY CE Ferulic, SAY Cellular Renewal Retinol, Advanced Mineral Invisible Fluid SPF50+, Strataderm silikónový gél, Cicatrix Recovery Balm, Lipoelastic kompresívne prádlo).
Buď medicínsky presný, dôrazný na bezpečnosť, zákaz fajčenia, vysadenie ASA, tlakové masáže jaziev a striktný zákaz UV žiarenia na jazvy 12 mesiacov.`;

        const userPrompt = `Vygeneruj plán pacienta pre:
Meno pacienta: ${patientName || 'Neuvedené'}
Typ plánu: ${planType}
Zvolený zákrok alebo diagnóza: ${procedureName || diagnosisOrGoal || 'Celková rejuvenácia tváre a pleti'}
Typ pleti: ${skinType || 'Zmiešaná / normálna'}
Hlavné sťažnosti: ${Array.isArray(mainConcerns) ? mainConcerns.join(', ') : mainConcerns}
Vektorové zóny z analýzy: ${Array.isArray(vectorZones) ? vectorZones.join(', ') : vectorZones}
Ošetrujúci lekár: ${doctorName}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
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
          const parsed = JSON.parse(text);
          const fullPlan: PatientPlan = {
            id: `plan-${Date.now()}`,
            patientId: patientId || 'P1',
            patientName: patientName || 'Pacient SAY CLINIC',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            doctorName: doctorName,
            planType: planType as any,
            title: parsed.title || 'Individuálny plán starostlivosti SAY CLINIC',
            diagnosisOrGoal: parsed.diagnosisOrGoal || diagnosisOrGoal,
            analysisSummary: parsed.analysisSummary || {
              skinType: skinType || 'Zmiešaná',
              skinTonePhototype: 'Fitzpatrick II-III',
              mainConcerns: mainConcerns.length > 0 ? mainConcerns : ['Rejuvenácia'],
              vectorZones: vectorZones.length > 0 ? vectorZones : ['Tvár']
            },
            cosmeticsRoutine: parsed.cosmeticsRoutine || PRESET_PATIENT_PLANS.face_annual_rejuvenation.cosmeticsRoutine!,
            annualTreatments: (parsed.annualTreatments || []).map((t: any, idx: number) => ({
              ...t,
              id: t.id || `trt-${Date.now()}-${idx}`,
              status: 'planned'
            })),
            preOpCare: parsed.preOpCare,
            postOpCare: parsed.postOpCare,
            doctorNote: parsed.doctorNote || 'Vygenerované na základe dermatologickej analýzy SAY CLINIC.'
          };

          return NextResponse.json({ success: true, plan: fullPlan, source: 'gemini-3.8-flash' });
        }
      } catch (geminiError) {
        console.warn('Gemini generation failed, falling back to clinical expert presets:', geminiError);
      }
    }

    // EXPERTNÝ KLINICKÝ FALLBACK (okamžitá blesková odpoveď s lekárskou presnosťou)
    let basePreset = PRESET_PATIENT_PLANS.face_annual_rejuvenation;
    const lowerProc = (procedureName + ' ' + diagnosisOrGoal).toLowerCase();

    if (lowerProc.includes('prs') || lowerProc.includes('augment') || lowerProc.includes('mamm') || planType === 'pre_post_op' && lowerProc.includes('implant')) {
      basePreset = PRESET_PATIENT_PLANS.breast_surgery_care;
    } else if (lowerProc.includes('viek') || lowerProc.includes('blefar') || lowerProc.includes('oko') || lowerProc.includes('očí')) {
      basePreset = PRESET_PATIENT_PLANS.blepharoplasty_care;
    } else if (planType === 'pre_post_op') {
      basePreset = PRESET_PATIENT_PLANS.breast_surgery_care;
    }

    const synthesizedPlan: PatientPlan = {
      id: `plan-${Date.now()}`,
      patientId: patientId || 'P1',
      patientName: patientName || 'Pacient SAY CLINIC',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      doctorName: doctorName,
      planType: planType as any,
      title: basePreset.title || 'Komplexný liečebný a estetický plán pacienta',
      diagnosisOrGoal: diagnosisOrGoal || basePreset.diagnosisOrGoal || 'Komplexná starostlivosť a rejuvenácia',
      analysisSummary: {
        skinType: skinType || basePreset.analysisSummary?.skinType || 'Zmiešaná / Normálna',
        skinTonePhototype: basePreset.analysisSummary?.skinTonePhototype || 'Fitzpatrick II-III',
        mainConcerns: mainConcerns.length > 0 ? mainConcerns : (basePreset.analysisSummary?.mainConcerns || ['Optimalizácia stavu pleti']),
        vectorZones: vectorZones.length > 0 ? vectorZones : (basePreset.analysisSummary?.vectorZones || ['Celá tvár & dekolt'])
      },
      cosmeticsRoutine: basePreset.cosmeticsRoutine || PRESET_PATIENT_PLANS.face_annual_rejuvenation.cosmeticsRoutine!,
      annualTreatments: (basePreset.annualTreatments || []).map((t, idx) => ({
        ...t,
        id: `trt-${Date.now()}-${idx}`,
        status: 'planned'
      })),
      preOpCare: basePreset.preOpCare ? {
        ...basePreset.preOpCare,
        procedureName: procedureName || basePreset.preOpCare.procedureName
      } : undefined,
      postOpCare: basePreset.postOpCare ? {
        ...basePreset.postOpCare,
        procedureName: procedureName || basePreset.postOpCare.procedureName
      } : undefined,
      doctorNote: basePreset.doctorNote || 'Personalizovaný plán pripravený v spolupráci s lekárskym tímom SAY CLINIC.'
    };

    return NextResponse.json({ success: true, plan: synthesizedPlan, source: 'clinical-expert-engine' });
  } catch (error: any) {
    console.error('Error generating patient plan:', error);
    return NextResponse.json({ success: false, error: error.message || 'Chyba pri generovaní plánu pacienta' }, { status: 500 });
  }
}
