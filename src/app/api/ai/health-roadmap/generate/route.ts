import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { AIHealthRoadmap, RoadmapMonth, RoadmapIntervention, SkincareStep } from '@/data/healthRoadmapTypes';

const SLOVAK_MONTHS = [
  'Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún',
  'Júl', 'August', 'September', 'Október', 'November', 'December'
];

function getSeason(monthNumber: number): { season: 'jar' | 'leto' | 'jesen' | 'zima'; label: string } {
  // monthNumber is 1-12
  if (monthNumber >= 3 && monthNumber <= 5) return { season: 'jar', label: 'Jar' };
  if (monthNumber >= 6 && monthNumber <= 8) return { season: 'leto', label: 'Leto' };
  if (monthNumber >= 9 && monthNumber <= 11) return { season: 'jesen', label: 'Jeseň' };
  return { season: 'zima', label: 'Zima' };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      patientId,
      patientName,
      patientBirthNumber = '',
      patientAge,
      gender = 'žena',
      proceduresHistory = [], // string[] or object[] of past surgical / medical records
      aestheticsHistory = [], // previous botox, fillers, skinbooster sessions
      skinCondition = {
        skinType: 'zmiešaná',
        fitzpatrickPhototype: 'II',
        primaryConcerns: ['Jemné vrásky', 'Strata elasticity', 'Dehydratácia'],
        notes: ''
      },
      doctorName = 'MUDr. Ján Mráz'
    } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    const now = new Date();
    const currentMonthIdx = now.getMonth(); // 0-11
    const currentYear = now.getFullYear();

    // Ak máme kľúč, použijeme Gemini 3.8 Flash na personalizáciu
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        const systemInstruction = `Si špičkový plastický chirurg a certifikovaný dermatológ prestížnej kliniky SAY CLINIC v Bratislave (vedúci lekár MUDr. Ján Mráz).
Tvojou úlohou je vygenerovať kompletný, vysoko profesionálny 12-MESAČNÝ AI PLÁN LIEČBY (PERSONALIZOVANÝ PLÁN OŠETRENÍ A DOMÁCEJ STAROSTLIVOSTI) pre konkrétneho pacienta.

DÔKLADNE ANALYZUJ DODANÚ HISTÓRIU PACIENTA:
1. Zákroky & operácie: predchádzajúce chirurgické protokoly, výkony a diagnózy (napr. augmentácia, blefaroplastika, liposukcia atď.).
2. Lekárske poznámky & anamnéza: klinické záznamy, objektívny nález, pooperačné odporúčania a ciele.
3. Estetické mapy & Face Sculpture: aplikácie botulotoxínu (čelo, glabela, vejáriky), dermálnych výplní kyselinou hyalurónovou, biostimulátorov a mezoterapie s presnými zónami a dávkovaním.

PRAVIDLÁ KLINICKEJ PRAXE SAY CLINIC:
1. Plán musí pokrývať presne 12 po sebe idúcich mesiacov počnúc aktuálnym mesiacom (${SLOVAK_MONTHS[currentMonthIdx]} ${currentYear}).
2. Zohľadni sezónnosť:
   - JESEŇ & ZIMA (Október - Február): ideálne na fotoprotektívne rizikové zákroky (Ablatívny a frakčný CO2 laser, vaskulárny laser, hlboké chemické peelingy, intenzívny microneedling s retinoidmi).
   - JAR (Marec - Máj): prechodné obdobie, biostimulátory (polynukleotidy, Sculptra, Radiesse), hydratačné skinboostery, refresh botulotoxínu pred letom.
   - LETO (Jún - August): ZÁKAZ ablatívnych laserov a fotosenzibilizujúcich peelingov! Prioritou je intenzívna antioxidačná ochrana (Vitamín C, kyselina ferulová), SPF 50+, hĺbková hydratácia (nezosieťovaná kyselina hyalurónová) a jemná mezoterapia.
3. Injekčná estetika:
   - Botulotoxín (aplikácia typicky každých 4 až 6 mesiacov na glabelu, čelo a vejáriky).
   - Výplne kyselinou hyalurónovou (udržiavacia frekvencia 9 až 14 mesiacov).
4. Chirurgická starostlivosť:
   - Ak má pacient v histórii operácie (augmentácia, blefaroplastika, facelift, liposukcia), zohľadni kontrolu stavu jaziev, tlakové masáže, silikónové gély a sonografickú kontrolu implantátov.
5. Každý mesiac musí mať definovaný:
   - 'monthIndex' (1 až 12)
   - 'name' (napr. '1. Mesiac')
   - 'calendarMonthName' (napr. '${SLOVAK_MONTHS[currentMonthIdx]} ${currentYear}')
   - 'season' ('jar' | 'leto' | 'jesen' | 'zima')
   - 'seasonLabel' ('Jar' | 'Leto' | 'Jeseň' | 'Zima')
   - 'focusTheme' (hlavná téma mesiaca)
   - 'clinicalGoal' (medicínsky cieľ)
   - 'interventions' (zoznam konkrétnych zákrokov):
       * 'type': 'injectable' | 'laser_device' | 'dermatology_care' | 'skincare_routine' | 'surgical_followup'
       * 'title': názov zákroku
       * 'description': podrobný popis pre pacienta
       * 'targetArea': ošetrovaná oblasť
       * 'intensity': 'jemná' | 'stredná' | 'intenzívna' | 'udržiavacia'
       * 'priority': 'vysoká' | 'odporúčaná' | 'voliteľná'
       * 'status': 'planned'
       * 'homeCareProduct': odporúčaný kozmeceutický produkt SAY CLINIC
       * 'clinicalRationale': prečo v tomto mesiaci

6. Domáca skincare rutina (ráno a večer krok za krokom s aktívnymi látkami a frekvenciou) a sezónne odporúčania pre Jar, Leto, Jeseň, Zimu.

VÝSTUP MUSÍ BYŤ VÝHRADNE PLATNÝ JSON formátovaný podľa požadovanej štruktúry:
{
  "title": string,
  "patientAnalysis": {
    "analyzedProceduresCount": number,
    "analyzedAestheticSessionsCount": number,
    "skinConditionSummary": string,
    "identifiedConcerns": string[],
    "fitzpatrickPhototype": string,
    "clinicalAssessment": string,
    "pastSurgeriesSummary": string,
    "aestheticHistorySummary": string
  },
  "months": [ ...12 objektov RoadmapMonth... ],
  "dailySkincareRoutine": {
    "morning": [ { "step": 1, "category": string, "productName": string, "activeIngredients": string, "frequency": string, "usageNote": string } ],
    "evening": [ { "step": 1, "category": string, "productName": string, "activeIngredients": string, "frequency": string, "usageNote": string } ],
    "weeklyTreatments": string[]
  },
  "seasonalGuidelines": {
    "jar": string,
    "leto": string,
    "jesen": string,
    "zima": string
  },
  "doctorRecommendations": string,
  "safetyPrecautions": string[]
}`;

        const userPrompt = `Prosím vygeneruj 12-mesačný AI Health Roadmap pre pacienta:
Meno: ${patientName}
Vek/Pohlavie: ${patientAge ? `${patientAge} rokov` : 'dospelý'}, ${gender}
História zákrokov a operácií: ${JSON.stringify(proceduresHistory)}
História estetických ošetrení (botox, výplne, mezoterapia): ${JSON.stringify(aestheticsHistory)}
Stav pokožky:
- Typ pleti: ${skinCondition.skinType || 'zmiešaná'}
- Fitzpatrick fototyp: ${skinCondition.fitzpatrickPhototype || 'II'}
- Primárne problémy/ciele: ${(skinCondition.primaryConcerns || []).join(', ')}
- Poznámka dermatológa: ${skinCondition.notes || 'žiadna'}

Začni presne od mesiaca ${SLOVAK_MONTHS[currentMonthIdx]} ${currentYear} a vygeneruj detailných 12 mesiacov plánu.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: userPrompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            temperature: 0.3,
          },
        });

        const rawText = response.text || '';
        const parsed = JSON.parse(rawText);

        const fullRoadmap: AIHealthRoadmap = {
          id: `roadmap-${patientId}-${Date.now()}`,
          patientId,
          patientName,
          patientBirthNumber,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          doctorName,
          title: parsed.title || `AI Plán Liečby 12M • ${patientName}`,
          patientAnalysis: {
            analyzedProceduresCount: proceduresHistory.length,
            analyzedAestheticSessionsCount: aestheticsHistory.length,
            skinConditionSummary: parsed.patientAnalysis?.skinConditionSummary || 'Komplexná klinická analýza pokožky',
            identifiedConcerns: parsed.patientAnalysis?.identifiedConcerns || skinCondition.primaryConcerns || ['Revitalizácia', 'Fotoprotekcia'],
            fitzpatrickPhototype: parsed.patientAnalysis?.fitzpatrickPhototype || skinCondition.fitzpatrickPhototype || 'II',
            clinicalAssessment: parsed.patientAnalysis?.clinicalAssessment || 'Odporúčaný sekvenčný 12-mesačný protokol kombinujúci injekčnú a prístrojovú starostlivosť.',
            pastSurgeriesSummary: parsed.patientAnalysis?.pastSurgeriesSummary || '',
            aestheticHistorySummary: parsed.patientAnalysis?.aestheticHistorySummary || ''
          },
          months: (parsed.months || []).map((m: any, idx: number) => {
            const actualMonthIndex = (currentMonthIdx + idx) % 12;
            const actualYear = currentYear + Math.floor((currentMonthIdx + idx) / 12);
            const { season, label } = getSeason(actualMonthIndex + 1);

            return {
              monthIndex: idx + 1,
              name: m.name || `${idx + 1}. Mesiac`,
              calendarMonthName: `${SLOVAK_MONTHS[actualMonthIndex]} ${actualYear}`,
              season: m.season || season,
              seasonLabel: m.seasonLabel || label,
              focusTheme: m.focusTheme || 'Klinická starostlivosť a regenerácia',
              clinicalGoal: m.clinicalGoal || 'Udržiavanie optimálnej dermálnej bariéry a elasticity',
              interventions: (m.interventions || []).map((inv: any, iIdx: number) => ({
                id: inv.id || `inv-${idx + 1}-${iIdx + 1}`,
                month: idx + 1,
                monthLabel: `${idx + 1}. Mesiac (${SLOVAK_MONTHS[actualMonthIndex]})`,
                season: m.season || season,
                type: inv.type || 'dermatology_care',
                title: inv.title || 'Konzultácia a ošetrenie',
                description: inv.description || '',
                targetArea: inv.targetArea || 'Tvár a dekolt',
                intensity: inv.intensity || 'stredná',
                estimatedDuration: inv.estimatedDuration || '45 min',
                estimatedPrice: inv.estimatedPrice,
                priority: inv.priority || 'odporúčaná',
                status: 'planned',
                homeCareProduct: inv.homeCareProduct || 'SAY Clinic Derm Hydrating Serum',
                clinicalRationale: inv.clinicalRationale || 'Optimálny sezónny interval aplikácie',
                contraindicationsOrPrecautions: inv.contraindicationsOrPrecautions || ''
              }))
            };
          }),
          dailySkincareRoutine: {
            morning: parsed.dailySkincareRoutine?.morning || [],
            evening: parsed.dailySkincareRoutine?.evening || [],
            weeklyTreatments: parsed.dailySkincareRoutine?.weeklyTreatments || []
          },
          seasonalGuidelines: parsed.seasonalGuidelines || {
            jar: 'Hydratačné skinboostery a antioxidačná ochrana pred zvýšeným UV žiarením.',
            leto: 'Maximálna fotoprotekcia SPF 50+, nezosieťovaná kyselina hyalurónová, zákaz ablatívnych laserov.',
            jesen: 'Obnova po lete, chemické peelingy a začiatok laserovej sezóny.',
            zima: 'Frakčný CO2 laser, vaskulárne lasery a intenzívna bariérová regenerácia.'
          },
          doctorRecommendations: parsed.doctorRecommendations || 'Dodržiavajte odporúčaný časový harmonogram a dôslednú fotoprotekciu SPF 50+.',
          safetyPrecautions: parsed.safetyPrecautions || [
            'Minimálne 2 týždne po zákrokoch vynechať saunu a intenzívny šport',
            'Striktný zákaz opaľovania po laserových ošetreniach a chemických peelingoch',
            'V prípade nežiaducej reakcie kontaktujte recepciu SAY CLINIC'
          ]
        };

        return NextResponse.json({
          success: true,
          source: 'gemini-3.8-flash',
          roadmap: fullRoadmap
        });
      } catch (geminiError) {
        console.warn('Gemini API call failed, falling back to clinical rule-based engine:', geminiError);
      }
    }

    // FALLBACK / OFFLINE CLINICAL ENGINE
    // Vybudujeme plnohodnotný 12-mesačný plán podľa klinických pravidiel SAY CLINIC
    const fallbackRoadmap = generateClinicalRuleBasedRoadmap({
      patientId,
      patientName,
      patientBirthNumber,
      currentMonthIdx,
      currentYear,
      proceduresHistory,
      aestheticsHistory,
      skinCondition,
      doctorName
    });

    return NextResponse.json({
      success: true,
      source: 'clinical-rules-engine',
      roadmap: fallbackRoadmap
    });

  } catch (error: any) {
    console.error('Error generating AI Health Roadmap:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Chyba pri generovaní plánu' },
      { status: 500 }
    );
  }
}

function generateClinicalRuleBasedRoadmap(params: {
  patientId: string;
  patientName: string;
  patientBirthNumber: string;
  currentMonthIdx: number;
  currentYear: number;
  proceduresHistory: any[];
  aestheticsHistory: any[];
  skinCondition: any;
  doctorName: string;
}): AIHealthRoadmap {
  const {
    patientId,
    patientName,
    patientBirthNumber,
    currentMonthIdx,
    currentYear,
    proceduresHistory,
    aestheticsHistory,
    skinCondition,
    doctorName
  } = params;

  const hasSurgery = proceduresHistory.some((p: any) => {
    const text = typeof p === 'string' ? p : JSON.stringify(p);
    return text.toLowerCase().includes('augment') || text.toLowerCase().includes('blefaro') || text.toLowerCase().includes('lipo') || text.toLowerCase().includes('oper');
  });

  const hasBotox = aestheticsHistory.some((a: any) => {
    const text = typeof a === 'string' ? a : JSON.stringify(a);
    return text.toLowerCase().includes('botox') || text.toLowerCase().includes('toxin') || text.toLowerCase().includes('dysport');
  });

  const months: RoadmapMonth[] = [];

  for (let i = 0; i < 12; i++) {
    const actualMonthIndex = (currentMonthIdx + i) % 12;
    const actualYear = currentYear + Math.floor((currentMonthIdx + i) / 12);
    const { season, label } = getSeason(actualMonthIndex + 1);
    const monthNum = i + 1;

    let theme = 'Regenerácia a bunková obnova';
    let clinicalGoal = 'Podpora kolagénovej matrix a zdravia kožnej bariéry';
    const interventions: RoadmapIntervention[] = [];

    // Mesiac 1 (Úvodný reštart a nastavenie)
    if (monthNum === 1) {
      theme = 'Klinická diagnostika & Hĺbková hydratácia';
      clinicalGoal = 'Stabilizácia kožnej bariéry a presná analýza fototypu';

      interventions.push({
        id: `inv-1-1`,
        month: 1,
        monthLabel: `1. Mesiac (${SLOVAK_MONTHS[actualMonthIndex]})`,
        season,
        type: 'dermatology_care',
        title: 'Biorevitalizácia & Aminokyselinový Skinbooster',
        description: 'Hĺbkové dodanie nezosieťovanej kyseliny hyalurónovej s komplexom aminokyselín a peptidov.',
        targetArea: 'Tvár, krk a dekolt',
        intensity: 'stredná',
        estimatedDuration: '45 min',
        estimatedPrice: 220,
        priority: 'vysoká',
        status: 'planned',
        homeCareProduct: 'SAY Clinic Pure Hyaluronic Acid B5 Drops',
        clinicalRationale: 'Príprava dermis na ďalšie plánované procedúry a okamžitá obnova elasticity.'
      });

      if (!hasBotox || monthNum === 1) {
        interventions.push({
          id: `inv-1-2`,
          month: 1,
          monthLabel: `1. Mesiac (${SLOVAK_MONTHS[actualMonthIndex]})`,
          season,
          type: 'injectable',
          title: 'Aplikácia Botulotoxínu (Full Face harmonizácia)',
          description: 'Relaxácia hyperaktívnych mimických svalov čela, glabely a periorbitálnej zóny.',
          targetArea: 'Čelo, glabela, vejáriky okolo očí',
          intensity: 'jemná',
          estimatedDuration: '30 min',
          estimatedPrice: 260,
          priority: 'vysoká',
          status: 'planned',
          homeCareProduct: 'SAY Clinic Peptides & Argireline Smoothing Cream',
          clinicalRationale: 'Vyhladenie dynamických vrások a prevencia ich prehlbovania.'
        });
      }
    }

    // Mesiac 2
    else if (monthNum === 2) {
      theme = 'Korekcia textúry a stimulácia fibroblastov';
      clinicalGoal = 'Vyrovnanie tónu pleti a mikrocirkulácia';

      interventions.push({
        id: `inv-2-1`,
        month: 2,
        monthLabel: `2. Mesiac (${SLOVAK_MONTHS[actualMonthIndex]})`,
        season,
        type: season === 'leto' ? 'dermatology_care' : 'laser_device',
        title: season === 'leto' ? 'Polynukleotidová biostimulácia očného okolia' : 'Frakčný rádiofrekvenčný microneedling',
        description: season === 'leto'
          ? 'Cielené omladenie jemnej pokožky viečok a kruhov pod očami bez rizika fototoxicity.'
          : 'Termokoagulačné mikroihličkovanie stimulujúce neokolagenézu a sťahovanie pórov.',
        targetArea: season === 'leto' ? 'Periorbitálna oblasť' : 'Celá tvár a podbradok',
        intensity: 'stredná',
        estimatedDuration: '45 min',
        estimatedPrice: season === 'leto' ? 190 : 280,
        priority: 'odporúčaná',
        status: 'planned',
        homeCareProduct: 'SAY Clinic Cica Barrier Repair Balm',
        clinicalRationale: 'Zlepšenie denzity kože a redukcia jemnej textúry.'
      });
    }

    // Mesiac 3
    else if (monthNum === 3) {
      theme = 'Kontrola elasticity a jemná volumometria';
      clinicalGoal = 'Podpora lícnych kontúr a hydratácia pier';

      interventions.push({
        id: `inv-3-1`,
        month: 3,
        monthLabel: `3. Mesiac (${SLOVAK_MONTHS[actualMonthIndex]})`,
        season,
        type: 'injectable',
        title: 'Kyselina hyalurónová – Jemný kontúring & Hydratácia pier',
        description: 'Prémiový dermálny gél na obnovu strateného objemu a prirodzenú hydratáciu vermilionu.',
        targetArea: 'Pery alebo nazolabiálne ryhy',
        intensity: 'stredná',
        estimatedDuration: '40 min',
        estimatedPrice: 320,
        priority: 'odporúčaná',
        status: 'planned',
        homeCareProduct: 'SAY Clinic Lip Replenish Complex s peptidmi',
        clinicalRationale: 'Korekcia pomerov dolnej tretiny tváre v súlade s Face Mapping protokolom SAY CLINIC.'
      });
    }

    // Mesiac 4
    else if (monthNum === 4) {
      theme = 'Klinický peeling & Zjednotenie pigmentácií';
      clinicalGoal = 'Keratolytické vyhladenie a rozjasnenie matného tónu';

      interventions.push({
        id: `inv-4-1`,
        month: 4,
        monthLabel: `4. Mesiac (${SLOVAK_MONTHS[actualMonthIndex]})`,
        season,
        type: 'dermatology_care',
        title: season === 'leto' ? 'Enzymatická kúra & Kyslíková mezoterapia' : 'Kombinovaný medicínsky chemický peeling (TCA / Mandľová)',
        description: 'Odstránenie odumretých keratinocytov, zosvetlenie diskolorácií a stimulácia bunkovej výmeny.',
        targetArea: 'Tvár a horná časť dekoltu',
        intensity: 'stredná',
        estimatedDuration: '30 min',
        estimatedPrice: 130,
        priority: 'odporúčaná',
        status: 'planned',
        homeCareProduct: 'SAY Clinic Glow Shield C-Ferulic Serum',
        clinicalRationale: 'Prevencia upchávania pórov a rozjasnenie epidermy.'
      });
    }

    // Mesiac 5
    else if (monthNum === 5) {
      theme = 'Poliaci botox refresh & Mimická rovnováha';
      clinicalGoal = 'Udržanie vyhladeného reliéfu v druhom polroku';

      interventions.push({
        id: `inv-5-1`,
        month: 5,
        monthLabel: `5. Mesiac (${SLOVAK_MONTHS[actualMonthIndex]})`,
        season,
        type: 'injectable',
        title: 'Botulotoxín – Udržiavací refresh (5. mesiac)',
        description: 'Kontrola hybnosti mimiky po 4-5 mesiacoch a mikrodávky pre prevenciu hlbokých zárezov.',
        targetArea: 'Glabela a horizontálne vrásky čela',
        intensity: 'jemná',
        estimatedDuration: '25 min',
        estimatedPrice: 190,
        priority: 'vysoká',
        status: 'planned',
        homeCareProduct: 'SAY Clinic Advanced Mineral Fluid SPF 50+',
        clinicalRationale: 'Optimálne načasovanie pred odznením predchádzajúcej dávky.'
      });
    }

    // Mesiac 6 (Polročný audit a pooperačná kontrola)
    else if (monthNum === 6) {
      theme = 'Polročný klinický audit & Kontrola jaziev / tkanív';
      clinicalGoal = 'Hodnotenie dlhodobých výsledkov a sonografická / palpáčna kontrola';

      if (hasSurgery) {
        interventions.push({
          id: `inv-6-1`,
          month: 6,
          monthLabel: `6. Mesiac (${SLOVAK_MONTHS[actualMonthIndex]})`,
          season,
          type: 'surgical_followup',
          title: 'Polročná kontrola po chirurgickom výkone u MUDr. Jána Mráza',
          description: 'Kontrola jaziev, zmäknutia tkanív, sonografický screening stavu implantátov / operačného poľa.',
          targetArea: 'Operačné pole a jazvy',
          intensity: 'jemná',
          estimatedDuration: '30 min',
          estimatedPrice: 0,
          priority: 'vysoká',
          status: 'planned',
          homeCareProduct: 'SAY Clinic Silikónový gél Strataderm & UV náplasť',
          clinicalRationale: 'Kľúčový míľnik 6 mesiacov pre finálne vyzrievanie chirurgických jaziev.'
        });
      }

      interventions.push({
        id: `inv-6-2`,
        month: 6,
        monthLabel: `6. Mesiac (${SLOVAK_MONTHS[actualMonthIndex]})`,
        season,
        type: 'dermatology_care',
        title: 'Intenzívny hydratačný skinbooster s kyselinou jantárovou',
        description: 'Biorevitalizácia s antioxidačným a protizápalovým účinkom pre hĺbkovú bunkovú výživu.',
        targetArea: 'Tvár a krk',
        intensity: 'stredná',
        estimatedDuration: '40 min',
        estimatedPrice: 210,
        priority: 'odporúčaná',
        status: 'planned',
        homeCareProduct: 'SAY Clinic Cellular Repair Creme',
        clinicalRationale: 'Obnova hydro-lipidového filmu v strede 12-mesačného cyklu.'
      });
    }

    // Mesiac 7
    else if (monthNum === 7) {
      theme = 'Vaskulárna a antioxidačná kúra';
      clinicalGoal = 'Posilnenie stien kapilár a prevencia erytému';

      interventions.push({
        id: `inv-7-1`,
        month: 7,
        monthLabel: `7. Mesiac (${SLOVAK_MONTHS[actualMonthIndex]})`,
        season,
        type: season === 'zima' || season === 'jesen' ? 'laser_device' : 'dermatology_care',
        title: season === 'zima' || season === 'jesen' ? 'Vaskulárny laser (odstránenie cievok a teleangiektázií)' : 'Mezoterapia s vitamínmi & Koenzýmom Q10',
        description: 'Zlepšenie mikrocirkulácie a redukcia difúzneho začervenania v strednej tretine tváre.',
        targetArea: 'Líca, nos a krídla nosa',
        intensity: 'stredná',
        estimatedDuration: '35 min',
        estimatedPrice: 160,
        priority: 'odporúčaná',
        status: 'planned',
        homeCareProduct: 'SAY Clinic Redness Relief Calm Serum',
        clinicalRationale: 'Cielená stabilizácia kožných cievok a prevencia rozšírenia kapilár.'
      });
    }

    // Mesiac 8
    else if (monthNum === 8) {
      theme = 'Kolagénová indukcia & Spevnenie dermis';
      clinicalGoal = 'Zlepšenie turgoru a spevnenie spodných kontúr';

      interventions.push({
        id: `inv-8-1`,
        month: 8,
        monthLabel: `8. Mesiac (${SLOVAK_MONTHS[actualMonthIndex]})`,
        season,
        type: 'injectable',
        title: 'Polynukleotidy alebo Kolagénový bioremodeler (Karisma / Profhilo)',
        description: 'Biokompatibilné nukleotidy na regeneráciu poškodených bunkových štruktúr a stimuláciu elastínu.',
        targetArea: 'Tvár a kontúry sánky',
        intensity: 'stredná',
        estimatedDuration: '40 min',
        estimatedPrice: 280,
        priority: 'odporúčaná',
        status: 'planned',
        homeCareProduct: 'SAY Clinic Ceramide Lift Emulsion',
        clinicalRationale: 'Dlhodobé posilnenie dermálneho skeletu tváre.'
      });
    }

    // Mesiac 9
    else if (monthNum === 9) {
      theme = 'Druhý cyklus mimickej harmonizácie';
      clinicalGoal = 'Prevencia hlbokých mimických rýh a symetria pohľadu';

      interventions.push({
        id: `inv-9-1`,
        month: 9,
        monthLabel: `9. Mesiac (${SLOVAK_MONTHS[actualMonthIndex]})`,
        season,
        type: 'injectable',
        title: 'Aplikácia Botulotoxínu (3. cyklus)',
        description: 'Udržiavacie ošetrenie dynamických vrások v hornej tretine tváre pre stabilný relaxačný profil.',
        targetArea: 'Glabela, čelo, laterálne vejáriky',
        intensity: 'jemná',
        estimatedDuration: '30 min',
        estimatedPrice: 250,
        priority: 'vysoká',
        status: 'planned',
        homeCareProduct: 'SAY Clinic Peptides & Retinol Night Nectar',
        clinicalRationale: 'Pravidelný 4-5 mesačný cyklus zaručuje dlhodobú prevenciu fixácie vrások.'
      });
    }

    // Mesiac 10
    else if (monthNum === 10) {
      theme = season === 'jesen' || season === 'zima' ? 'Laserový resurfacing a vyhladenie jazvičiek' : 'Hĺbková revitalizácia a fotoprotekcia';
      clinicalGoal = 'Hĺbková remodelácia povrchových vrstiev epidermy';

      interventions.push({
        id: `inv-10-1`,
        month: 10,
        monthLabel: `10. Mesiac (${SLOVAK_MONTHS[actualMonthIndex]})`,
        season,
        type: season === 'jesen' || season === 'zima' ? 'laser_device' : 'dermatology_care',
        title: season === 'jesen' || season === 'zima' ? 'Frakčný CO2 laserový resurfacing (jemný peelingový režim)' : 'Hydro-infúzne ošetrenie & Biocelulózová maska',
        description: 'Odstránenie zrohovatených buniek a mikrostimulácia nového epidermálneho krytu.',
        targetArea: 'Tvár a zóny s textúrou',
        intensity: season === 'jesen' || season === 'zima' ? 'intenzívna' : 'jemná',
        estimatedDuration: '50 min',
        estimatedPrice: season === 'jesen' || season === 'zima' ? 340 : 140,
        priority: 'odporúčaná',
        status: 'planned',
        homeCareProduct: 'SAY Clinic Barrier Repair Cica Balm',
        clinicalRationale: 'Ideálne sezónne okno pre laserové ošetrenia bez rizika hyperpigmentácií.'
      });
    }

    // Mesiac 11
    else if (monthNum === 11) {
      theme = 'Korekcia jemných asymetrií & Hydratácia';
      clinicalGoal = 'Finálne doladenie kontúr pred ročným vyhodnotením';

      interventions.push({
        id: `inv-11-1`,
        month: 11,
        monthLabel: `11. Mesiac (${SLOVAK_MONTHS[actualMonthIndex]})`,
        season,
        type: 'injectable',
        title: 'Micro-droplet kyselina hyalurónová pre jemné ryhy',
        description: 'Presná výplň jemných vrások v periorálnej oblasti alebo zjemnenie unaveného výrazu.',
        targetArea: 'Periorálna oblasť / kútiky',
        intensity: 'jemná',
        estimatedDuration: '35 min',
        estimatedPrice: 220,
        priority: 'voliteľná',
        status: 'planned',
        homeCareProduct: 'SAY Clinic Plumping Hyaluron Elixir',
        clinicalRationale: 'Ladenie detailov v záverečnej fáze 12-mesačného cyklu.'
      });
    }

    // Mesiac 12 (Ročné klinické zhodnotenie)
    else {
      theme = 'Ročné zhodnotenie výsledkov & Nastavenie cyklu na ďalší rok';
      clinicalGoal = 'Porovnanie fotodokumentácie, posúdenie stavu pleti a plán udržiavania';

      interventions.push({
        id: `inv-12-1`,
        month: 12,
        monthLabel: `12. Mesiac (${SLOVAK_MONTHS[actualMonthIndex]})`,
        season,
        type: 'surgical_followup',
        title: 'Ročná kontrola u MUDr. Jána Mráza & Foto-porovnanie',
        description: 'Detailné posúdenie stability výsledkov, fotodokumentácia v štandardizovaných uhloch a tvorba plánu na ďalší rok.',
        targetArea: 'Celá tvár a telo',
        intensity: 'jemná',
        estimatedDuration: '30 min',
        estimatedPrice: 0,
        priority: 'vysoká',
        status: 'planned',
        homeCareProduct: 'SAY Clinic Complete Annual Maintenance Set',
        clinicalRationale: 'Vyhodnotenie dosiahnutého omladenia a udržanie štandardu SAY CLINIC.'
      });

      interventions.push({
        id: `inv-12-2`,
        month: 12,
        monthLabel: `12. Mesiac (${SLOVAK_MONTHS[actualMonthIndex]})`,
        season,
        type: 'dermatology_care',
        title: 'Záverečná diamantová hydro-dermabrázia & Omladzujúci koktejl',
        description: 'Hĺbkové očistenie a nasýtenie pokožky peptidovým elixírom pred začatím nového ročného cyklu.',
        targetArea: 'Tvár, krk, dekolt',
        intensity: 'jemná',
        estimatedDuration: '45 min',
        estimatedPrice: 120,
        priority: 'odporúčaná',
        status: 'planned',
        homeCareProduct: 'SAY Clinic Shield SPF 50+',
        clinicalRationale: 'Slávnostné finálne ošetrenie ročného plánu.'
      });
    }

    months.push({
      monthIndex: monthNum,
      name: `${monthNum}. Mesiac`,
      calendarMonthName: `${SLOVAK_MONTHS[actualMonthIndex]} ${actualYear}`,
      season,
      seasonLabel: label,
      focusTheme: theme,
      clinicalGoal,
      interventions
    });
  }

  const morningRoutine: SkincareStep[] = [
    {
      step: 1,
      category: 'Čistenie',
      productName: 'SAY Clinic Gentle Balancing Foaming Gel',
      activeIngredients: 'Aminokyseliny, extrakt z harmančeka, alantoín',
      frequency: 'Každé ráno',
      usageNote: 'Aplikujte na vlhkú pleť, jemne masírujte 60 sekúnd a opláchnite vlažnou vodou.'
    },
    {
      step: 2,
      category: 'Antioxidant & Rozjasnenie',
      productName: 'SAY Clinic C-Ferulic 15% Brightening Serum',
      activeIngredients: 'L-askorbová kyselina 15%, kyselina ferulová 0.5%, vitamín E',
      frequency: 'Každé ráno',
      usageNote: '4-5 kvapiek vtlačte dlaňami do pokožky tváre, krku a dekoltu. Chráni pred voľnými radikálmi.'
    },
    {
      step: 3,
      category: 'Hydratácia & Bariéra',
      productName: 'SAY Clinic Ceramide Recovery Day Fluid',
      activeIngredients: '3 esenciálne ceramidy, nízkomolekulárna HA, niacínamid 3%',
      frequency: 'Každé ráno',
      usageNote: 'Zabezpečuje dlhodobé uzamknutie vlhkosti v medzibunkovom priestore.'
    },
    {
      step: 4,
      category: 'Maximálna Fotoprotekcia',
      productName: 'SAY Clinic Invisible Mineral Fluid SPF 50+ UVA/UVB/HEV',
      activeIngredients: 'Mikronizovaný oxid zinočnatý, ectoín, filter proti modrému svetlu',
      frequency: 'Každé ráno 365 dní v roku',
      usageNote: 'Striktná zásada kliniky SAY CLINIC: chráni výsledky estetických a laserových zákrokov pred degradáciou kolagénu.'
    }
  ];

  const eveningRoutine: SkincareStep[] = [
    {
      step: 1,
      category: 'Dvojfázové čistenie',
      productName: 'SAY Clinic Lipid-Balancing Cleansing Oil & Milk',
      activeIngredients: 'Skvalán, bisabolol, jojobový olej',
      frequency: 'Každý večer',
      usageNote: 'Rozpustí SPF filtre, make-up a znečistenia z ovzdušia bez narušenia kožného mikrobiómu.'
    },
    {
      step: 2,
      category: 'Bunková obnova & Kolagenogenéza',
      productName: 'SAY Clinic Micro-Encapsulated Retinol 0.3% / Bakuchiol',
      activeIngredients: 'Enkapsulovaný čistý retinol, bakuchiol, centella asiatica',
      frequency: 'Večer (začínať 2x týždenne, postupne zvýšiť na 4-5x týždenne)',
      usageNote: 'Nanášajte na suchú pokožku 20 minút po vyčistení. Vynechajte 5 dní pred a po laserových zákrokoch!'
    },
    {
      step: 3,
      category: 'Hĺbková nočná regenerácia',
      productName: 'SAY Clinic Peptide Night Renewal Cream',
      activeIngredients: 'Palmitoyl tripeptid-1 & 7, bambucké maslo, panthenol 5%',
      frequency: 'Každý večer',
      usageNote: 'Uzatvára nočnú regeneráciu, upokojuje mikrozápaly a vyživuje zrelú aj namáhanú pleť.'
    }
  ];

  return {
    id: `roadmap-${patientId}-${Date.now()}`,
    patientId,
    patientName,
    patientBirthNumber,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    doctorName,
    title: `AI Plán Liečby 12M • ${patientName}`,
    patientAnalysis: {
      analyzedProceduresCount: proceduresHistory.length,
      analyzedAestheticSessionsCount: aestheticsHistory.length,
      skinConditionSummary: `Analýza pacienta preukázala typ pleti ${skinCondition.skinType || 'zmiešaná'} s fototypom Fitzpatrick ${skinCondition.fitzpatrickPhototype || 'II'}.`,
      identifiedConcerns: skinCondition.primaryConcerns || ['Jemné vrásky', 'Strata elasticity', 'Bariérová ochrana'],
      fitzpatrickPhototype: skinCondition.fitzpatrickPhototype || 'II',
      clinicalAssessment: 'Komplexný 12-mesačný liečebný a ošetrujúci plán zostavený na princípe sezónnej medicíny SAY CLINIC s vyváženým striedaním biostimulácie, fotoprotekcie a presnej botoxovej a výplňovej harmonizácie.',
      pastSurgeriesSummary: hasSurgery ? 'Zaznamenaná chirurgická anamnéza; do plánu boli zahrnuté pooperačné kontroly a manažment jaziev.' : 'Bez aktívnej invazívnej operácie; dôraz kladený na neinvazívny lifting.',
      aestheticHistorySummary: hasBotox ? 'Pacient má skúsenosť s botulotoxínom; aplikácie sú presne načasované v 4-5 mesačných cykloch.' : 'Úvodný cyklus začína plnou diagnostikou a jemnou harmonizáciou.'
    },
    months,
    dailySkincareRoutine: {
      morning: morningRoutine,
      evening: eveningRoutine,
      weeklyTreatments: [
        'Enzymatický peeling raz týždenne v nedeľu večer (vynechať pri podráždení)',
        'Upokojujúca biocelulózová maska s kyselinou hyalurónovou po každom estetickom zákroku',
        'Tlaková masáž pooperačných jaziev 2x denne s masážnym silikónovým gélom (ak je indikované)'
      ]
    },
    seasonalGuidelines: {
      jar: 'Obdobie prechodu a regenerácie. Ideálne na biostimuláciu polynukleotidmi a skinboostery, ktoré pripravia pokožku na letné slnko. Zvýšiť antioxidačnú starostlivosť.',
      leto: 'Kritické obdobie fotoprotekcie. STRIKTNÝ ZÁKAZ ablatívnych CO2 laserov a hlbokých peelingov. Dôraz na SPF 50+ každé 2-3 hodiny na priamom slnku a jemnú hydratačnú mezoterapiu.',
      jesen: 'Zlatá laserová sezóna SAY CLINIC. Obnova poškodení po letnom UV žiarení, chemické peelingy, začiatok liečby pigmentácií a vaskulárne lasery na cievky.',
      zima: 'Ideálny čas na intenzívne ošetrenia: frakčný CO2 laser, rádiofrekvencia a hĺbkové spevnenie pleti. Dôraz na bariérové krémy chrániace pred mrazom a suchým vzduchom.'
    },
    doctorRecommendations: 'Dodržiavajte odporúčané rozostupy medzi procedúrami. Pre maximálnu efektivitu kombinujte ordinačné ošetrenia s predpísanou dennou domácou dermokozmetikou SAY CLINIC. V prípade akýchkoľvek otázok je personál kliniky k dispozícii.',
    safetyPrecautions: [
      'Po injekčných zákrokoch 48 hodín nepredkláňať hlavu, nepiť alkohol a neabsolvovať ťažký tréning',
      'Minimálne 14 dní po laseroch a peelingoch striktne vynechať saunu, solárium a horúce kúpele',
      'Každodenná aplikácia minerálneho SPF 50+ je povinná podmienka zachovania záruky na ošetrenie',
      'V prípade začervenania alebo nezvyčajného opuchu okamžite kontaktujte recepciu SAY CLINIC'
    ]
  };
}
