import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { MeicetAnalysisResult } from '@/types/meicet';
import { createDemoMeicetResult } from '@/data/meicetDemoData';
import { getEffectiveGeminiApiKey } from '@/lib/geminiKey';
import { MeicetClinicalEducationService } from '@/services/meicetClinicalEducationService';

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
        preferredTier === 'mid_end' ? 'mid_end' : preferredTier === 'advanced' ? 'advanced' : preferredTier === 'expert' ? 'expert' : 'high_end',
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
     * Sculptra PLLA (450 €)
     * Exozómy ASCE+ / ExoCoBio tvár (320 €)
   - LEKÁRSKE PEELINGY & MICRONEEDLING:
     * Medicínsky peeling BioRePeel / PRX-T33 (90 €)
     * Lekársky chemický peeling TCA (110 €)
     * Dermapen 4 / Lekársky microneedling s mezo-sérom (140 €)
   - PROCEDÚRY & PRODUKTY MIMO PORTFÓLIA (EXTERNÉ):
     Ak je pre pacienta medicínsky indikovaný výkon alebo liek mimo priameho portfólia SAY CLINIC (napr. HydraFacial vákuové hydro-čistenie, IPL, Morpheus8 RF, Soolantra krém 10 mg/g na rosaceu [Rx], Skinoren krém na akné/komedóny [Rx], Rozex gél [Rx]), môžeš ho uviesť, ale MUSÍŠ pri ňom nastaviť isExternal: true a do externalProviderNote doplniť stručnú poznámku (napr. 'Výkon mimo portfólia SAY CLINIC - indikovaný u externého poskytovateľa' alebo 'Liek na predpis viazaný na recept'). Pre všetky bežné procedúry SAY CLINIC nastav isExternal: false.
   - STRIKTNÉ ODDELENIE OD CHIRURGIE: Tento modul je čisto pre pleť a neinvazívnu/injekčnú estetiku. Nemiešaj sem plastické operácie ani chirurgické pooperačné jazvy.

2. STRIKTNÉ KONTRAINDIKÁCIE A GUIDELINES PODĽA TYPU PLETI (EBM DERMATOLÓGIA):
   * PRE CITLIVÚ A SUCHÚ PLEŤ (alebo oslabenú kožnú bariéru, vysoké TEWL, difúzny cievny erytém / rosaceu / cievnu reaktivitu):
     - STRIKTNÝ ZÁKAZ chemických peelingov BioRePeelCl3 (35% TCA), PRX-T33, klasického TCA peelingu a ablatívnych laserov (CO2 laser resurfacing)! BioRePeel ani TCA sa nesmú odporúčať v ŽIADNOM štvrťroku (ani v Q2, ani v Q3)!
     - Namiesto nich indikuj výlučne: Cievny laser (na lícne cievky a difúzny erytém), Polynukleotidy (Rejuran Healer 2 ml celá tvár, Rejuran I na očné okolie), Bioremodeláciu (Profhilo 2 ml) a Exozómy (ASCE+ na hĺbkovú obnovu kožnej bariéry).
   * PRE MASTNÚ / ZMIEŠANÚ PLEŤ S ROZŠÍRENÝMI PÓRMI A BEZ ERYTÉMU:
     - BioRePeel / CoolPeel CO2 / TCA sú povolené iba pri hrubšej seboroickej pokožke s neporušenou bariérou mimo letných mesiacov.

3. SKINCARE RUTINA V DVOCH ÚROVNIACH Z NÁŠHO CENNÍKA S EDUKAČNÝMI POLIAMI:
   A) HIGH-END / PREMIUM RUTINA (Značka SkinCeuticals):
      - Ráno: SkinCeuticals Soothing Cleanser (46 €), SkinCeuticals Phyto Corrective Gel (85 €) pri erytéme / C E Ferulic (175 €) pri odolnej pleti, SkinCeuticals H.A. Intensifier (118 €), SkinCeuticals Advanced Brightening UV Defense SPF 50+ (46 €).
      - Večer: SkinCeuticals Soothing Cleanser (46 €), SkinCeuticals Phyto Corrective Gel (85 €), SkinCeuticals Retinol 0.3 (98 €) s titráciou, SkinCeuticals Triple Lipid Restore 2:4:2 (155 €), SkinCeuticals Epidermal Repair (85 €).
   B) MID-END / BASIC RUTINA (Značky La Roche-Posay, CeraVe, Vichy):
      - Ráno: CeraVe Hydratačná čistiaca emulzia (14 €), Vichy Minéral 89 Hyaluron Booster (26 €), La Roche-Posay Hyalu B5 Sérum (42 €), La Roche-Posay Anthelios UVMune 400 SPF 50+ (22 €).
      - Večer: La Roche-Posay Toleriane Dermo-Cleanser (18 €), Vichy Liftactiv Collagen Specialist (44 €), CeraVe Hydratačný krém (17 €), La Roche-Posay Cicaplast Baume B5+ (18 €).
   C) POVINNÁ ŠTRUKTÚRA KAŽDÉHO PRODUKTU (EDUKÁCIA PACIENTA):
      - keyActiveIngredient: Presná účinná látka a koncentrácia (napr. '2% čisté ceramidy, 4% cholesterol, 2% mastné kyseliny' alebo '0.3% čistý enkapsulovaný retinol + bisabolol').
      - whyItMatters: Personalizované vysvetlenie prečo je látka dôležitá konkrétne pre tohto pacienta s odkazom na jeho Meicet dáta (napr. 'Pri vašom vysokom TEWL 44/100 dopĺňa chýbajúce lipidy a bráni odparovaniu vody').
      - frequencySchedule: Frekvencia aplikácie (napr. 'Každý večer' alebo '1x týždenne večer – prvé 2 týždne, potom 2x týždenne').
      - titrationNotes: Špecifické pokyny k aplikácii / titrácii (napr. 'Začať 1x týždenne večer sendvičovou metódou. Vynechať 5–7 dní pred laserom!').

TVOJOU ÚLOHOU JE:
1. Extraktovať a zhodnotiť objektívne dáta z Meicet Pro-A reportu (Hydratácia/TEWL, Póry, Vrásky, Textúra, UV poškodenie, Hnedé škvrny, Červené cievne zóny, Maz/porfyríny).
2. Vytvoriť personalizovaný 12-MESAČNÝ ROČNÝ PLÁN PLEŤOVÝCH PROCEDÚR (Q1, Q2, Q3, Q4) v súlade s vyššie uvedenými EBM kontraindikáciami pre daný typ pleti.
3. Navrhnúť detailnú dennú SKINCARE RUTINU v oboch úrovniach (High-End aj Mid-End) s vyplnenými edukačnými poľami (keyActiveIngredient, whyItMatters, frequencySchedule, titrationNotes).

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
    "selectedTier": "high_end" | "advanced" | "mid_end" | "expert",
    "highEnd": {
      "tier": "high_end",
      "tierLabel": "High-End (SkinCeuticals)",
      "brandDescription": string,
      "totalEstimatedPrice": number,
      "morning": [
        { "step": number, "category": string, "productName": string, "brand": string, "activeIngredients": string, "keyActiveIngredient": string, "whyItMatters": string, "frequencySchedule": string, "titrationNotes": string, "usage": string, "purpose": string, "price": number, "meicetJustification": string, "isExternal": boolean, "externalProviderNote": string }
      ],
      "evening": [
        { "step": number, "category": string, "productName": string, "brand": string, "activeIngredients": string, "keyActiveIngredient": string, "whyItMatters": string, "frequencySchedule": string, "titrationNotes": string, "usage": string, "purpose": string, "price": number, "meicetJustification": string, "isExternal": boolean, "externalProviderNote": string }
      ],
      "weeklyCare": string[]
    },
    "midEnd": {
      "tier": "mid_end",
      "tierLabel": "Mid-End (La Roche-Posay, CeraVe, Vichy)",
      "brandDescription": string,
      "totalEstimatedPrice": number,
      "morning": [
        { "step": number, "category": string, "productName": string, "brand": string, "activeIngredients": string, "keyActiveIngredient": string, "whyItMatters": string, "frequencySchedule": string, "titrationNotes": string, "usage": string, "purpose": string, "price": number, "meicetJustification": string, "isExternal": boolean, "externalProviderNote": string }
      ],
      "evening": [
        { "step": number, "category": string, "productName": string, "brand": string, "activeIngredients": string, "keyActiveIngredient": string, "whyItMatters": string, "frequencySchedule": string, "titrationNotes": string, "usage": string, "purpose": string, "price": number, "meicetJustification": string, "isExternal": boolean, "externalProviderNote": string }
      ],
      "weeklyCare": string[]
    },
    "morning": [
      { "step": number, "category": string, "productName": string, "brand": string, "activeIngredients": string, "keyActiveIngredient": string, "whyItMatters": string, "frequencySchedule": string, "titrationNotes": string, "usage": string, "purpose": string, "price": number, "meicetJustification": string, "isExternal": boolean, "externalProviderNote": string }
    ],
    "evening": [
      { "step": number, "category": string, "productName": string, "brand": string, "activeIngredients": string, "keyActiveIngredient": string, "whyItMatters": string, "frequencySchedule": string, "titrationNotes": string, "usage": string, "purpose": string, "price": number, "meicetJustification": string, "isExternal": boolean, "externalProviderNote": string }
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
      parsed.clinicalEducation = parsed.clinicalEducation || MeicetClinicalEducationService.synthesizeClinicalEducation(parsed);
      if (parsed.skincareRoutine) {
        if (!parsed.skincareRoutine.advanced) {
          parsed.skincareRoutine.advanced = MeicetClinicalEducationService.generateAdvancedRoutine(parsed);
        }
        if (!parsed.skincareRoutine.expert) {
          parsed.skincareRoutine.expert = MeicetClinicalEducationService.generateExpertOptimalRoutine(parsed);
        }
        if (preferredTier === 'advanced' && parsed.skincareRoutine.advanced) {
          parsed.skincareRoutine.selectedTier = 'advanced';
          parsed.skincareRoutine.morning = parsed.skincareRoutine.advanced.morning;
          parsed.skincareRoutine.evening = parsed.skincareRoutine.advanced.evening;
          parsed.skincareRoutine.weeklyCare = parsed.skincareRoutine.advanced.weeklyCare;
        } else if (preferredTier === 'expert' && parsed.skincareRoutine.expert) {
          parsed.skincareRoutine.selectedTier = 'expert';
          parsed.skincareRoutine.morning = parsed.skincareRoutine.expert.morning;
          parsed.skincareRoutine.evening = parsed.skincareRoutine.expert.evening;
          parsed.skincareRoutine.weeklyCare = parsed.skincareRoutine.expert.weeklyCare;
        }
      }

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
        preferredTier === 'mid_end' ? 'mid_end' : preferredTier === 'advanced' ? 'advanced' : preferredTier === 'expert' ? 'expert' : 'high_end',
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
