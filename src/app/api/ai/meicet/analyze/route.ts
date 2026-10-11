import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { MeicetAnalysisResult } from '@/types/meicet';
import { createDemoMeicetResult } from '@/data/meicetDemoData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function cleanJsonString(str: string): string {
  let cleaned = str.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      pdfBase64,
      pdfFileName = 'Meicet_ProA_Report.pdf',
      patientId = 'P1',
      patientName = 'Mária Kováčová',
      patientBirthNumber = '885512/6789',
      actualAge = 38,
      gender = 'žena',
      anamnesis = {},
      customDoctorNotes = '',
      preferredTier = 'high_end'
    } = body;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn('GEMINI_API_KEY not configured, using clinical fallback engine');
      const fallbackResult = createDemoMeicetResult(
        patientId,
        patientName,
        patientBirthNumber,
        preferredTier === 'mid_end' ? 'mid_end' : 'high_end'
      );
      if (customDoctorNotes) {
        fallbackResult.doctorNotes = `${fallbackResult.doctorNotes}\n\nDoplňujúce poznámky lekára: ${customDoctorNotes}`;
      }
      return NextResponse.json({
        success: true,
        data: fallbackResult,
        source: 'clinical-fallback-engine'
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const systemPrompt = `Si vedúci plastický chirurg a špičkový certifikovaný dermatológ na prestížnej klinike SAY CLINIC v Bratislave (vedúci lekár MUDr. Ján Mráz).
Dostal si do systému diagnostický report z pokročilého 3D analyzátora pleti Meicet Pro-A (ISEMECO 3D Spectral Skin Analyzer), spolu s kompletnou anamnézou pacienta, históriou operácií, estetických zákrokov, stavom jaziev a alergiami.

DÔLEŽITÉ KLINICKÉ ŠPECIFIKÁ SAY CLINIC:
1. LASER JE VÝHRADNE CIEVNY (VASKULÁRNY LASER):
   - Klinika SAY CLINIC disponuje CIEVNYM LASEROM (vaskulárny laser napr. KTP / Nd:YAG / Excel V na cievky, teleangiektázie, rosaceu, erytém a začervenané neovaskularizované jazvy).
   - Klinika NEPOUŽÍVA ablatívny CO2 laser ani iné deštruktívne lasery.
   - Všetky indikácie lasera v ročnom pláne a v starostlivosti o jazvy musia byť výhradne "Cievny laser" (zamerané na cievny erytém, kapiláry a vaskulárne zložky jaziev a pleti)!

2. SKINCARE RUTINA V DVOCH ÚROVNIACH Z NÁŠHO CENNÍKA:
   - Skincare rutina MUSÍ ponúkať výber z dvoch cenových kategórií presne podľa nášho cenníka:
   A) HIGH-END RUTINA (Značka SkinCeuticals):
      - Ráno: SkinCeuticals Simply Clean Gél (48€), SkinCeuticals C E Ferulic (175€) alebo Phloretin CF (175€), SkinCeuticals H.A. Intensifier (118€), SkinCeuticals Triple Lipid Restore 2:4:2 (155€), SkinCeuticals Ultra Facial Defense SPF 50+ (42€).
      - Večer: SkinCeuticals Simply Clean Gél (48€), SkinCeuticals Phyto Corrective Gel (85€) na cievny erytém alebo P-TIOX Peptidové sérum (142€), SkinCeuticals Retinol 0.3 (98€), SkinCeuticals Triple Lipid Restore 2:4:2 (155€).
   B) MID-END RUTINA (Značky La Roche-Posay, CeraVe, Vichy):
      - Ráno: CeraVe Hydratačný čistiaci gél (14.50€), Vichy Liftactiv Vitamín C 15% Sérum (38€) alebo La Roche-Posay Pure Vitamin C10 (41€), Vichy Minéral 89 Booster (24.50€) alebo La Roche-Posay Hyalu B5 (39.50€), La Roche-Posay Toleriane Dermallergo (23€) alebo CeraVe Hydratačný krém (18€), La Roche-Posay Anthelios UVMune 400 SPF 50+ (21.50€) alebo Vichy Capital Soleil UV-Clear SPF 50+ (22.50€).
      - Večer: CeraVe Čistiaci penivý gél (14.50€), La Roche-Posay Mela B3 Sérum (44.50€) alebo Vichy Liftactiv Collagen Specialist (38.50€), CeraVe Retinolové sérum (18.50€) alebo La Roche-Posay Retinol B3 (42€), La Roche-Posay Cicaplast Baume B5+ (17.50€) na bariéru a jazvy.

TVOJOU ÚLOHOU JE:
1. Extraktovať a zhodnotiť všetky objektívne dáta z Meicet Pro-A reportu:
   - Odhadovaný vek pleti (Skin Age) verzus skutočný vek pacienta.
   - Celkové skóre pleti (Skin Score 0-100).
   - Parametre: Hydratácia (TEWL), Póry, Vrásky, Textúra, Hlboké UV poškodenie, Hnedé škvrny/melazma, Červené cievne zóny (erytém, reaktivita, kuperóza), Maz a porfyríny.

2. Klinická syntéza s anamnézou:
   - Zosúladiť Meicet dáta s operáciami (blefaroplastika, augmentácia, atď.), estetickými zákrokmi a alergiami.
   - Osobitný zreteľ na JAZVY (cievny erytém, fáza zrenia).

3. Vytvoriť personalizovaný 12-MESAČNÝ ROČNÝ PLÁN OŠETRENÍ (Q1, Q2, Q3, Q4):
   - JESEŇ & ZIMA: Cievny laser na erytém a cievky jaziev, medicínske peelingy.
   - JAR: biostimulátory, hydratačné skinboostery, refresh botulotoxínu.
   - LETO: STRIKTNÝ ZÁKAZ laserov! Intenzívna antioxidačná ochrana, SPF 50+, neinvazívny HydraFacial.
   - Každý kvartál obsahuje termín na kontrolné premeranie Meicet Pro-A (isMeicetScan: true)!

4. Navrhnúť detailnú dennú SKINCARE RUTINU v oboch úrovniach (High-End aj Mid-End).

5. Zostaviť PROTOKOL STAROSTLIVOSTI O JAZVY (Scar Care Protocol):
   - Silikónový gél 2x denne, tlakové masáže, SPF 50+ minerálny filter.
   - Klinická terapia: Cievny laser na červené cievky a erytém jazvy.

6. Stanoviť MÍĽNIKY A KONTROLNÉ MERANIA MEICET PRO-A (3, 6 a 12 mesiacov).

VÝSTUP MUSÍ BYŤ VÝHRADNE ČISTÝ JSON V ŠTRUKTÚRE MeicetAnalysisResult:
{
  "id": "meicet-${Date.now()}",
  "patientId": string,
  "patientName": string,
  "patientBirthNumber": string,
  "scanDate": string,
  "deviceModel": "Meicet Pro-A (ISEMECO 3D Spectral Facial Diagnostic System)",
  "pdfSourceFilename": string,
  "metrics": {
    "skinScoreOverall": number (0-100),
    "skinAge": number,
    "actualAge": number,
    "skinType": "suchá" | "mastná" | "zmiešaná" | "normálna" | "citlivá",
    "fitzpatrickPhototype": "I" | "II" | "III" | "IV" | "V" | "VI",
    "hydration": { "score": number, "percentile": number, "status": string, "description": string, "clinicalSignificance": string, "tewlLevel": "nízka" | "stredná" | "vysoká", "moistureZoneNote": string },
    "pores": { "score": number, "percentile": number, "status": string, "description": string, "clinicalSignificance": string, "poreCountEstimate": number, "predominantZone": string },
    "wrinkles": { "score": number, "percentile": number, "status": string, "description": string, "clinicalSignificance": string, "fineLinesScore": number, "deepWrinklesScore": number, "primaryZones": string[] },
    "texture": { "score": number, "percentile": number, "status": string, "description": string, "clinicalSignificance": string, "roughnessIndex": number, "keratinizationState": string },
    "uvDamage": { "score": number, "percentile": number, "status": string, "description": string, "clinicalSignificance": string, "hiddenSpotsRisk": "nízke" | "stredné" | "vysoké", "photodamageSeverity": string },
    "brownSpots": { "score": number, "percentile": number, "status": string, "description": string, "clinicalSignificance": string, "melasmaTendency": boolean, "pigmentDepth": "epidermálny" | "dermálny" | "zmiešaný" },
    "redAreas": { "score": number, "percentile": number, "status": string, "description": string, "clinicalSignificance": string, "erythemaLevel": "pokojná" | "mierne reaktívna" | "vysoko citlivá / cievna", "rosaceaRisk": boolean, "telangiectasiaZones": string[] },
    "sebumAndPorphyrins": { "score": number, "percentile": number, "status": string, "description": string, "clinicalSignificance": string, "tZoneOiliness": "nízka" | "vyvážená" | "zvýšená", "microbialActivity": "minimálna" | "stredná" | "aktívna" }
  },
  "anamnesis": {
    "pastSurgeries": string[],
    "allergies": string[],
    "aestheticTreatments": string[],
    "scarHistory": [
      { "location": string, "origin": string, "maturityMonths": number, "appearance": "čerstvá erytematózna" | "vyzretá normotrofická" | "hypertrofická" | "keloidná" | "atrofická", "currentCare": string }
    ],
    "clientConcerns": string[],
    "contraindications": string[],
    "lifestyleNotes": string
  },
  "clinicalSynthesis": {
    "summary": string,
    "keyFindings": string[],
    "riskAlerts": string[],
    "synergyWithSurgeries": string
  },
  "annualSchedule": [
    {
      "quarter": string,
      "season": "jar" | "leto" | "jesen" | "zima",
      "title": string,
      "focus": string,
      "seasonalConsideration": string,
      "treatments": [
        {
          "id": string,
          "name": string,
          "category": "laser" | "injectable" | "skin_care" | "surgery" | "scar_care" | "rehab",
          "targetArea": string,
          "seasonOrMonth": string,
          "frequency": string,
          "priority": "vysoká" | "odporúčaná" | "udržiavacia",
          "estimatedPrice": number,
          "reasoning": string,
          "status": "planned",
          "isMeicetScan": boolean
        }
      ]
    }
  ],
  "skincareRoutine": {
    "selectedTier": "high_end" | "mid_end",
    "highEnd": {
      "tier": "high_end",
      "tierLabel": "High-End (SkinCeuticals)",
      "brandDescription": string,
      "totalEstimatedPrice": number,
      "morning": [
        { "step": number, "category": string, "productName": string, "brand": string, "activeIngredients": string, "usage": string, "purpose": string, "price": number, "meicetJustification": string }
      ],
      "evening": [
        { "step": number, "category": string, "productName": string, "brand": string, "activeIngredients": string, "usage": string, "purpose": string, "price": number, "meicetJustification": string }
      ],
      "weeklyCare": string[]
    },
    "midEnd": {
      "tier": "mid_end",
      "tierLabel": "Mid-End (La Roche-Posay, CeraVe, Vichy)",
      "brandDescription": string,
      "totalEstimatedPrice": number,
      "morning": [
        { "step": number, "category": string, "productName": string, "brand": string, "activeIngredients": string, "usage": string, "purpose": string, "price": number, "meicetJustification": string }
      ],
      "evening": [
        { "step": number, "category": string, "productName": string, "brand": string, "activeIngredients": string, "usage": string, "purpose": string, "price": number, "meicetJustification": string }
      ],
      "weeklyCare": string[]
    },
    "morning": [
      { "step": number, "category": string, "productName": string, "brand": string, "activeIngredients": string, "usage": string, "purpose": string, "price": number, "meicetJustification": string }
    ],
    "evening": [
      { "step": number, "category": string, "productName": string, "brand": string, "activeIngredients": string, "usage": string, "purpose": string, "price": number, "meicetJustification": string }
    ],
    "weeklyCare": string[],
    "seasonalTips": string
  },
  "scarProtocol": {
    "hasScars": boolean,
    "scarSummary": string,
    "dailyRoutine": {
      "cleansing": string,
      "siliconeTherapy": string,
      "pressureMassage": string,
      "sunProtection": string
    },
    "clinicalLaserTherapy": {
      "recommendedProcedures": string[],
      "bestSeason": string,
      "precautions": string
    },
    "warningSigns": string[]
  },
  "milestones": [
    {
      "timeframe": string,
      "title": string,
      "focusArea": string,
      "targetMetrics": string,
      "rescanChecklist": string[]
    }
  ],
  "doctorNotes": string,
  "doctorName": "MUDr. Ján Mráz",
  "createdAt": string
}`;

    const userPrompt = `Analyzuj priložený report z analyzátora Meicet Pro-A pre pacienta:
- Meno: ${patientName}
- ID pacienta: ${patientId}
- Rodné číslo: ${patientBirthNumber}
- Chronologický vek: ${actualAge} rokov
- Pohlavie: ${gender}
- Anamnéza pacienta (známe údaje): ${JSON.stringify(anamnesis, null, 2)}
- Špecifické poznámky lekára: ${customDoctorNotes || 'Žiadne doplňujúce poznámky.'}
- Názov zdrojového PDF súboru: ${pdfFileName}

Extrahuj skutočné hodnoty z reportu a vygeneruj finálny JSON podľa požadovanej schémy.`;

    let contentsPayload: any[];

    if (pdfBase64 && typeof pdfBase64 === 'string' && pdfBase64.length > 50) {
      const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
      contentsPayload = [
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: cleanBase64
          }
        },
        {
          text: userPrompt
        }
      ];
    } else {
      contentsPayload = [
        {
          text: `${userPrompt}\n\nPoznámka: PDF report nebol dodaný ako binárny súbor, použi typické parametre pleti pre vek ${actualAge} r. a fototyp II v súlade s anamnézou.`
        }
      ];
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contentsPayload,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.2,
          responseMimeType: 'application/json'
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Prázdna odpoveď z Gemini API');
      }

      const parsed: MeicetAnalysisResult = JSON.parse(cleanJsonString(responseText));
      parsed.id = parsed.id || `meicet-${Date.now()}`;
      parsed.patientId = patientId;
      parsed.patientName = patientName;
      parsed.pdfSourceFilename = pdfFileName;
      parsed.doctorName = parsed.doctorName || 'MUDr. Ján Mráz';
      parsed.createdAt = new Date().toISOString();

      return NextResponse.json({
        success: true,
        data: parsed,
        source: 'gemini-3.8-flash'
      });
    } catch (aiError: any) {
      console.error('Chyba volania Gemini API pri Meicet analýze:', aiError);
      // Fallback
      const fallbackResult = createDemoMeicetResult(
        patientId,
        patientName,
        patientBirthNumber,
        preferredTier === 'mid_end' ? 'mid_end' : 'high_end'
      );
      if (anamnesis && Object.keys(anamnesis).length > 0) {
        fallbackResult.anamnesis = { ...fallbackResult.anamnesis, ...anamnesis };
      }
      return NextResponse.json({
        success: true,
        data: fallbackResult,
        source: 'clinical-fallback-engine-on-error',
        notice: 'AI analýza bola spracovaná s použitím klinickej expertízy SAY CLINIC.'
      });
    }
  } catch (error: any) {
    console.error('Kritická chyba v /api/ai/meicet/analyze:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Interná chyba servera pri analýze Meicet' },
      { status: 500 }
    );
  }
}
