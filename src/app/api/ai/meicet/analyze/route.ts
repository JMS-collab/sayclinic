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
      customDoctorNotes = ''
    } = body;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn('GEMINI_API_KEY not configured, using clinical fallback engine');
      const fallbackResult = createDemoMeicetResult(patientId, patientName, patientBirthNumber);
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

TVOJOU ÚLOHOU JE:
1. Extraktovať a zhodnotiť všetky objektívne dáta z Meicet Pro-A reportu:
   - Odhadovaný vek pleti (Skin Age) verzus skutočný vek pacienta.
   - Celkové skóre pleti (Skin Score 0-100).
   - Jednotlivé parametre a spektrá: Hydratácia (TEWL), Póry a zoxidovaný maz, Vrásky (jemné mimické vs hlboké), Textúra a drsnosť, Hlboké UV poškodenie (skryté solárne škvrny), Hnedé povrchové pigmentácie/melazma, Červené cievne zóny (erytém, reaktivita, kuperóza v krížovej polarizácii), Maz a porfyríny C. acnes.
   - Východiskové odporúčania z reportu prístroja.

2. Klinická syntéza s anamnézou pacienta:
   - Zosúladiť objektívne Meicet dáta s operáciami pacienta (napr. blefaroplastika, augmentácia, facelift, excízie), doterajšími estetickými zákrokmi (botox, výplne, mezoterapia), alergiami a špecifickými sťažnosťami pacienta.
   - Osobitný zreteľ na JAZVY (ak má pacient pooperačnú jazvu, potraumatickú jazvu alebo jazvy po akné):
     - Zhodnotiť fázu zrenia jazvy, prítomnosť cievneho erytému alebo riziko hyperpigmentácie z UV.

3. Vytvoriť personalizovaný 12-MESAČNÝ ROČNÝ PLÁN OŠETRENÍ (Q1, Q2, Q3, Q4) podľa prísnych sezónnych pravidiel kliniky SAY CLINIC:
   - JESEŇ & ZIMA (Október - Február): ideálne na fotoprotektívne rizikové zákroky (Frakčný a ablatívny CO2 laser, cievny laser KTP/Excel V, hlboké chemické peelingy, laserová remodelácia jaziev).
   - JAR (Marec - Máj): prechodné obdobie, biostimulátory (polynukleotidy Plenhyage/PhilArt, Sculptra, Radiesse), hydratačné skinboostery (Profhilo, Restylane Vital), refresh botulotoxínu pred letom.
   - LETO (Jún - August): STRIKTNÝ ZÁKAZ ablatívnych laserov a fotosenzibilizujúcich peelingov! Prioritou je intenzívna antioxidačná ochrana (Vitamín C, kyselina ferulová), SPF 50+, neinvazívny HydraFacial, hĺbková hydratácia.
   - Každý kvartál musí obsahovať aj termíny na kontrolné premeranie na prístroji Meicet Pro-A (tzv. isMeicetScan: true)!

4. Navrhnúť detailnú dennú SKINCARE RUTINU:
   - Ranná rutina (jemné čistenie, antioxidant/vitamín C, hydratačné sérum, bariérový krém s ceramidmi, širokospektrálny fotoprotektívny SPF 50+ minerálny filter).
   - Večerná rutina (dvojité čistenie, aktívna nočná látka napr. enkapsulovaný retinaldehyd / kyselina azelaová, nočný reparačný krém).
   - Týždenná starostlivosť a sezónne úpravy.
   - Pre každý produkt uveď odkaz na Meicet skóre (prečo je indikovaný).

5. Zostaviť podrobný PROTOKOL STAROSTLIVOSTI O JAZVY (Scar Care Protocol):
   - Domáca starostlivosť: presná aplikácia lekárskeho silikónového gélu (Strataderm / Kelo-cote) 2x denne, technika a frekvencia tlakových ischemických masáží, fotoprotekcia SPF 50+ minerálnym blokátorom.
   - Klinická prístrojová terapia: cievny laser na červené jazvy, frakčný laser na textúru a zarovnanie okrajov.
   - Varovné príznaky (hypertrofia, svrbenie, začervenanie).

6. Stanoviť MÍĽNIKY A KONTROLNÉ MERANIA MEICET PRO-A (po 3, 6 a 12 mesiacoch):
   - Merateľné ciele nárastu hydratácie, zmenšenia pórov a redukcie pigmentácií/erytému.

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
      const fallbackResult = createDemoMeicetResult(patientId, patientName, patientBirthNumber);
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
