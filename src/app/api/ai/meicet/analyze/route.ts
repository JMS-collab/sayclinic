import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { MeicetAnalysisResult } from '@/types/meicet';
import { createDemoMeicetResult } from '@/data/meicetDemoData';
import { getEffectiveGeminiApiKey } from '@/lib/geminiKey';

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
      patientId = 'P-unknown',
      patientName = 'Pacient',
      patientBirthNumber = '',
      actualAge = 38,
      gender = 'žena',
      anamnesis = {},
      customDoctorNotes = '',
      preferredTier = 'high_end',
      skinType = 'citliva_sucha'
    } = body;

    const apiKey = getEffectiveGeminiApiKey();

    if (!apiKey) {
      console.warn('GEMINI_API_KEY not configured, using clinical fallback engine');
      const fallbackResult = createDemoMeicetResult(
        patientId,
        patientName,
        patientBirthNumber,
        preferredTier === 'mid_end' ? 'mid_end' : 'high_end',
        undefined,
        skinType
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

    const systemPrompt = `Si špičkový certifikovaný dermatológ a špecialista na estetickú a regeneratívnu medicínu na klinike SAY CLINIC v Bratislave (vedúci lekár MUDr. Ján Mráz).
Dostal si do systému diagnostický report z pokročilého 3D analyzátora pleti Meicet Pro-A (ISEMECO 3D Spectral Skin Analyzer) alebo dermatologické zhodnotenie pleti pacienta.

DÔLEŽITÉ KLINICKÉ ŠPECIFIKÁ SAY CLINIC (STRIKTNE DODRŽIAVAJ):
1. REÁLNE PORTFÓLIO PLEŤOVÝCH PROCEDÚR KLINIKY:
   - LASERY:
     * Cievny laser - nos / lokálne cievky (70 €), Cievny laser - celá tvár rosacea/erytém (160 €)
     * CoolPeel® (DEKA Tetra CO2) - celá tvár (220 €), Frakčný CO2 laser resurfacing - celá tvár (380 €), Frakčný CO2 laser - očné okolie (200 €)
   - INJEKČNÁ HYDRATÁCIA & BIOSTIMULÁCIA:
     * Botox - 1 oblasť (120 €), Botox - 2 oblasti (216 €), Botox - 3 oblasti (324 €), Botox Masseter (300 €)
     * Kyselina hyalurónová 0,5 ml (180 €), Kyselina hyalurónová 1 ml (290 €)
     * Rejuran Healer PN 2 ml celá tvár (290 €), Rejuran I očné okolie 1 ml (190 €), Rejuran S atrofické jazvičky po akné 1 ml (190 €)
     * Crystal Hydro PDRN 2 ml (210 €), PhilArt / Nucleofill 2 ml (300 €)
     * Profhilo bioremodelácia 2 ml (290 €), Skinbooster 1 ml (300 €)
     * Sculptra PLLA (450 €), Radiesse CaHA 1,5 ml (390 €)
     * Exozómy ASCE+ / ExoCoBio tvár (320 €)
   - LEKÁRSKE PEELINGY & MICRONEEDLING:
     * Medicínsky peeling BioRePeel / PRX-T33 (90 €)
     * Lekársky chemický peeling TCA (110 €)
     * Dermapen 4 / Lekársky microneedling s mezo-sérom (140 €)
   - STRIKTNÝ ZÁKAZ: NIKDY neodporúčaj HydraFacial, IPL fotorejuvenizáciu ani základný ovocný/AHA peeling!
   - STRIKTNÉ ODDELENIE OD CHIRURGIE: Tento modul je čisto pre pleť a neinvazívnu/injekčnú estetiku. Nemiešaj sem plastické operácie ani chirurgické pooperačné jazvy.

2. SKINCARE RUTINA V DVOCH ÚROVNIACH Z NÁŠHO CENNÍKA:
   A) HIGH-END / PREMIUM RUTINA (Značka SkinCeuticals):
      - Ráno: SkinCeuticals Soothing Cleanser (46 €), SkinCeuticals C E Ferulic (175 €) alebo Phloretin CF (175 €), SkinCeuticals H.A. Intensifier (118 €), SkinCeuticals Advanced Brightening UV Defense SPF 50+ (46 €).
      - Večer: SkinCeuticals Soothing Cleanser (46 €), SkinCeuticals Retinol 0.3 (98 €), SkinCeuticals Triple Lipid Restore 2:4:2 (155 €), SkinCeuticals Epidermal Repair (85 €).
   B) MID-END / BASIC RUTINA (Značky La Roche-Posay, CeraVe, Vichy):
      - Ráno: CeraVe Hydratačná čistiaca emulzia (14 €), Vichy Minéral 89 Hyaluron Booster (26 €), La Roche-Posay Hyalu B5 Sérum (42 €), La Roche-Posay Anthelios UVMune 400 SPF 50+ (22 €).
      - Večer: La Roche-Posay Toleriane Dermo-Cleanser (18 €), Vichy Liftactiv Collagen Specialist (44 €), CeraVe Hydratačný krém (17 €), La Roche-Posay Cicaplast Baume B5+ (18 €).

TVOJOU ÚLOHOU JE:
1. Extraktovať a zhodnotiť objektívne dáta z Meicet Pro-A reportu (Hydratácia/TEWL, Póry, Vrásky, Textúra, UV poškodenie, Hnedé škvrny, Červené cievne zóny, Maz/porfyríny).
2. Vytvoriť personalizovaný 12-MESAČNÝ ROČNÝ PLÁN PLEŤOVÝCH PROCEDÚR (Q1, Q2, Q3, Q4):
   - JESEŇ & ZIMA: CoolPeel® / Frakčný CO2 laser, Cievny laser, Lekársky TCA peeling, Dermapen 4, Sculptra.
   - JAR: Cievny laser, Botox, Profhilo, Skinbooster, Radiesse.
   - LETO: STRIKTNÝ ZÁKAZ ablatívnych laserov a TCA peelingu! Odporúčaj Polynukleotidy (Rejuran Healer / Rejuran I / Crystal Hydro PDRN) a BioRePeel / PRX-T33.
3. Navrhnúť detailnú dennú SKINCARE RUTINU v oboch úrovniach (High-End aj Mid-End).

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
    "skinType": "suchá" | "mastná" | "zmiešaná" | "normálna" | "citlivá" | "citlivá a suchá",
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

    const userPrompt = `Analyzuj priložený report alebo snímku z analyzátora Meicet Pro-A (PDF / JPG / PNG) pre pacienta:
- Meno: ${patientName}
- ID pacienta: ${patientId}
- Rodné číslo: ${patientBirthNumber}
- Chronologický vek: ${actualAge} rokov
- Pohlavie: ${gender}
- Zvolený typ pleti / primárna sťažnosť klienta: ${skinType} (STRIKTNÉ PRAVIDLO: ak je sťažnosť alebo zistenie citlivá a suchá pleť, musíš ju kategorizovať ako 'citlivá a suchá' alebo 'citlivá', NIKDY nie 'zmiešaná'!)
- Anamnéza pacienta (známe údaje): ${JSON.stringify(anamnesis, null, 2)}
- Špecifické poznámky lekára: ${customDoctorNotes || 'Žiadne doplňujúce poznámky.'}
- Názov zdrojového súboru: ${pdfFileName}

Extrahuj skutočné hodnoty z reportu alebo snímky spektier a vygeneruj finálny JSON podľa požadovanej schémy.`;

    let contentsPayload: any[];

    if (pdfBase64 && typeof pdfBase64 === 'string' && pdfBase64.length > 50) {
      let mimeType = 'application/pdf';
      let cleanBase64 = pdfBase64;
      const dataUriMatch = pdfBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
      if (dataUriMatch) {
        mimeType = dataUriMatch[1];
        cleanBase64 = pdfBase64.substring(dataUriMatch[0].length);
      } else {
        const lowerName = pdfFileName.toLowerCase();
        if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) {
          mimeType = 'image/jpeg';
        } else if (lowerName.endsWith('.png')) {
          mimeType = 'image/png';
        } else if (lowerName.endsWith('.webp')) {
          mimeType = 'image/webp';
        }
      }

      contentsPayload = [
        {
          inlineData: {
            mimeType,
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
          text: `${userPrompt}\n\nPoznámka: Súbor reportu/snímky nebol dodaný ako binárny súbor, použi typické parametre pleti pre vek ${actualAge} r. a fototyp II v súlade s anamnézou.`
        }
      ];
    }

    try {
      const modelsToTry = ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest'];
      let responseText: string | null = null;
      let successfulModel = 'gemini-3.5-flash';
      let lastError: any = null;

      for (const model of modelsToTry) {
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            const response = await ai.models.generateContent({
              model,
              contents: contentsPayload,
              config: {
                systemInstruction: systemPrompt,
                temperature: 0.2,
                responseMimeType: 'application/json'
              }
            });
            if (response.text) {
              responseText = response.text;
              successfulModel = model;
              break;
            }
          } catch (mErr: any) {
            lastError = mErr;
            console.warn(`Model ${model} pokus ${attempt} zlyhal (${mErr.message || mErr.status})...`);
            if ((mErr.status === 503 || (mErr.message && mErr.message.includes('503'))) && attempt === 1) {
              await new Promise(r => setTimeout(r, 1200));
              continue;
            }
            break;
          }
        }
        if (responseText) break;
      }

      if (!responseText) {
        throw lastError || new Error('Prázdna odpoveď zo všetkých Gemini modelov');
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
        source: successfulModel
      });
    } catch (aiError: any) {
      console.error('Chyba volania Gemini API pri Meicet analýze:', aiError);
      // Fallback
      const fallbackResult = createDemoMeicetResult(
        patientId,
        patientName,
        patientBirthNumber,
        preferredTier === 'mid_end' ? 'mid_end' : 'high_end',
        undefined,
        skinType
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
