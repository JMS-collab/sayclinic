import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export interface AIPatientSummary {
  patientId: string;
  generatedAt: string;
  patientName: string;
  generalStatus: string;
  criticalAlerts: {
    allergies: { substance: string; reaction: string; severity: 'critical' | 'warning' }[];
    contraindications: string[];
    surgicalRisks: string[];
  };
  timelineMilestones: {
    id: string;
    date: string;
    category: 'surgery' | 'aesthetic' | 'consultation' | 'prescription' | 'document' | 'external_drive';
    title: string;
    summary: string;
    doctorOrSource?: string;
    urgency?: 'high' | 'normal' | 'low';
  }[];
  clinicalRecommendations: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      patient,
      records = [],
      aestheticSessions = [],
      prescriptions = [],
      calendarEvents = [],
      driveFiles = [],
      existingClinicalProfile = null
    } = body;

    if (!patient || !patient.id) {
      return NextResponse.json({ error: 'Chýbajúce údaje o pacientovi' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        const prompt = `Si špičkový plastický chirurg a hlavný atestovaný lekár SAY CLINIC v Bratislave (vedúci lekár MUDr. Ján Mráz).
Tvojou úlohou je vykonať hĺbkovú, maximálne presnú syntézu celej dostupnej zdravotnej dokumentácie pacienta a pripraviť štruktúrovaný "AI Klinický súhrn klienta" (časovú os, riziká a odporúčania) pre ošetrujúceho lekára počas vyšetrenia.

ÚDAJE PACIENTA:
Meno: ${patient.name}
Rodné číslo: ${patient.birthNumber || 'Neuvedené'}
Dátum narodenia: ${patient.dob || 'Neuvedené'}
Poisťovňa: ${patient.insurance || 'Neuvedené'}
Štítky/Anamnéza: ${patient.tags ? patient.tags.join(', ') : 'Žiadne'}

LEKÁRSKE ZÁZNAMY & OPERÁCIE (${records.length} záznamov):
${records.map((r: any) => `- [${r.date}] ${r.type}: "${r.title}" (Lekár: ${r.doctor}, Diagnóza: ${r.diagnosis || 'Neuvedená'}). Obsah/Priebeh: ${r.content?.slice(0, 300) || 'Bez popisu'}`).join('\n')}

ESTETICKÁ MEDICÍNA (BOTOX & VÝPLNE - ${aestheticSessions.length} sedení):
${aestheticSessions.map((s: any) => `- [${s.date}] Lekár: ${s.doctor || 'MUDr. Ján Mráz'}. Procedúry: ${s.treatments ? s.treatments.map((t: any) => `${t.productName || t.type} (${t.units || t.volume || ''})`).join(', ') : 'Neuvedené'}. Poznámka: ${s.notes || 'Bez poznámky'}`).join('\n')}

VYSTAVENÉ LEKÁRSKE RECEPTY (${prescriptions.length} receptov):
${prescriptions.map((p: any) => `- [${p.date || p.issuedAt}] Liečivo: ${p.medicationName || p.drugName} (Dávkovanie: ${p.dosage || 'neuvedené'}, Balenie: ${p.packageCount || 1}) - Lekár: ${p.doctorName || 'MUDr. Ján Mráz'}`).join('\n')}

KALENDÁR TERMÍNOV & OPERÁCIÍ (${calendarEvents.length} udalostí):
${calendarEvents.map((c: any) => `- [${c.date || c.startTime}] ${c.title} (${c.type || 'Zákrok'}, Miestnosť: ${c.room || 'SAY'}, Lekár: ${c.doctorName || 'MUDr. Ján Mráz'})`).join('\n')}

EXTERNÉ DOKUMENTY Z GOOGLE DRIVE (${driveFiles.length} súborov):
${driveFiles.map((f: any) => `- Súbor: "${f.name}" (Typ: ${f.mimeType || 'dokument'})`).join('\n')}

EXISTUJÚCE POZNÁMKY, ALERGIE A RIZIKÁ V SYSTÉME:
Alergie: ${existingClinicalProfile?.allergies?.map((a: any) => `${a.name} (${a.reaction || 'bez popisu'})`).join(', ') || 'Žiadne evidované'}
Riziká: ${existingClinicalProfile?.risks?.map((r: any) => `${r.name} [${r.category || 'Všeobecné'}]`).join(', ') || 'Žiadne evidované'}
Poznámky: ${existingClinicalProfile?.notes?.map((n: any) => `[${n.date} - ${n.author}]: ${n.content}`).join(' | ') || 'Žiadne'}

POŽIADAVKY NA VÝSTUP:
Analyzuj všetky tieto informácie a vytvor ucelený, vysoko profesionálny medicínsky výstup v čistom formáte JSON (žiadny markdown kód okolo, iba JSON).
Formát JSON:
{
  "generalStatus": "Stručné 1-vetové zhrnutie celkového zdravotného stavu a fázy starostlivosti pacienta",
  "criticalAlerts": {
    "allergies": [
      { "substance": "Názov alergénu / lieku", "reaction": "Popis reakcie", "severity": "critical" alebo "warning" }
    ],
    "contraindications": [
      "Kontraindikácie pre anestéziu, chirurgické výkony alebo výplne (napr. antikoagulanciá, gravidita, keloidy)"
    ],
    "surgicalRisks": [
      "Chirurgické a anestéziologické riziká (napr. sklon k hyperpigmentáciám, asymetrie, fajčenie, lieky)"
    ]
  },
  "timelineMilestones": [
    {
      "id": "m1",
      "date": "YYYY-MM-DD",
      "category": "surgery" | "aesthetic" | "consultation" | "prescription" | "document" | "external_drive",
      "title": "Názov výkonu / udalosti",
      "summary": "Stručný medicínsky opis výsledku, implantátov alebo priebehu (1-2 vety)",
      "doctorOrSource": "Meno lekára alebo zdroj (napr. Google Drive)",
      "urgency": "high" | "normal" | "low"
    }
  ],
  "clinicalRecommendations": [
    "Konkrétne medicínske a estetické odporúčanie pre lekára pri nasledujúcej návšteve / výkone"
  ]
}

Časová os (timelineMilestones) musí byť zoradená chronologicky od najnovších udalostí po najstaršie. Ak pacient nemá žiadne záznamy, vytvor primeraný bezpečný profil bez halucinácií.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2
          }
        });

        const rawText = response.text || '';
        const parsed = JSON.parse(rawText);

        const fullSummary: AIPatientSummary = {
          patientId: patient.id,
          patientName: patient.name,
          generatedAt: new Date().toISOString(),
          generalStatus: parsed.generalStatus || 'Pacient v ambulantnej a estetickej starostlivosti SAY CLINIC.',
          criticalAlerts: {
            allergies: Array.isArray(parsed.criticalAlerts?.allergies) ? parsed.criticalAlerts.allergies : [],
            contraindications: Array.isArray(parsed.criticalAlerts?.contraindications) ? parsed.criticalAlerts.contraindications : [],
            surgicalRisks: Array.isArray(parsed.criticalAlerts?.surgicalRisks) ? parsed.criticalAlerts.surgicalRisks : []
          },
          timelineMilestones: Array.isArray(parsed.timelineMilestones) ? parsed.timelineMilestones : [],
          clinicalRecommendations: Array.isArray(parsed.clinicalRecommendations) ? parsed.clinicalRecommendations : []
        };

        return NextResponse.json(fullSummary);
      } catch (geminiError) {
        console.error('Gemini API call failed, generating deterministic fallback:', geminiError);
        // Fallback to intelligent deterministic summary below
      }
    }

    // Inteligentný lokálny fallback pri absencii API kľúča alebo výpadku siete
    const deterministicSummary = buildDeterministicSummary(
      patient, 
      records, 
      aestheticSessions, 
      prescriptions, 
      calendarEvents, 
      driveFiles,
      existingClinicalProfile
    );

    return NextResponse.json(deterministicSummary);

  } catch (error: any) {
    console.error('Error generating AI patient summary:', error);
    return NextResponse.json({ error: error.message || 'Chyba servera pri generovaní AI súhrnu' }, { status: 500 });
  }
}

// Pomocná funkcia pre deterministickú syntézu v prípade absencie Gemini API kľúča
function buildDeterministicSummary(
  patient: any,
  records: any[],
  aestheticSessions: any[],
  prescriptions: any[],
  calendarEvents: any[],
  driveFiles: any[],
  existingProfile: any
): AIPatientSummary {
  const allergies: { substance: string; reaction: string; severity: 'critical' | 'warning' }[] = [];
  const contraindications: string[] = [];
  const surgicalRisks: string[] = [];
  const milestones: any[] = [];
  const recommendations: string[] = [];

  // Alergie z existujúceho profilu
  if (existingProfile?.allergies?.length) {
    existingProfile.allergies.forEach((a: any) => {
      allergies.push({
        substance: a.name,
        reaction: a.reaction || 'Riziko precitlivenosti',
        severity: a.severity === 'critical' ? 'critical' : 'warning'
      });
    });
  }

  // Riziká z existujúceho profilu
  if (existingProfile?.risks?.length) {
    existingProfile.risks.forEach((r: any) => {
      surgicalRisks.push(`${r.name} (${r.category || 'Anamnéza'})`);
    });
  }

  // Extrakcia míľnikov zo záznamov
  records.forEach((rec, idx) => {
    milestones.push({
      id: `rec-${rec.id || idx}`,
      date: rec.date || new Date().toISOString().split('T')[0],
      category: rec.type?.toLowerCase().includes('opera') ? 'surgery' : 'document',
      title: rec.title || 'Lekársky záznam',
      summary: rec.diagnosis ? `Diagnóza: ${rec.diagnosis}. ${rec.content ? rec.content.slice(0, 120) + '...' : ''}` : (rec.content ? rec.content.slice(0, 120) + '...' : 'Lekárska správa zaevidovaná v kartotéke.'),
      doctorOrSource: rec.doctor || 'MUDr. Ján Mráz',
      urgency: 'normal'
    });
  });

  // Extrakcia estetiky
  aestheticSessions.forEach((ses, idx) => {
    milestones.push({
      id: `aest-${ses.id || idx}`,
      date: ses.date || new Date().toISOString().split('T')[0],
      category: 'aesthetic',
      title: 'Aplikácia Botox / Výplne',
      summary: ses.notes || (ses.treatments ? `Aplikované: ${ses.treatments.map((t: any) => t.productName || t.type).join(', ')}` : 'Estetické ošetrenie tváre.'),
      doctorOrSource: ses.doctor || 'MUDr. Ján Mráz',
      urgency: 'normal'
    });
  });

  // Recepty
  prescriptions.forEach((rx, idx) => {
    milestones.push({
      id: `rx-${rx.id || idx}`,
      date: rx.date || rx.issuedAt || new Date().toISOString().split('T')[0],
      category: 'prescription',
      title: `Recept: ${rx.medicationName || rx.drugName || 'Liek'}`,
      summary: `Vystavený lekársky recept ŠEVT 14 282 2s. Dávkovanie: ${rx.dosage || '1x denne'}.`,
      doctorOrSource: rx.doctorName || 'MUDr. Ján Mráz',
      urgency: 'normal'
    });
  });

  // Kalendár
  calendarEvents.forEach((evt, idx) => {
    milestones.push({
      id: `evt-${evt.id || idx}`,
      date: evt.date || evt.startTime?.split('T')[0] || new Date().toISOString().split('T')[0],
      category: 'consultation',
      title: evt.title || 'Termín / Kontrola',
      summary: `Harmonogram: ${evt.type || 'Vyšetrenie'}. Sála/Miestnosť: ${evt.room || 'SAY'}.`,
      doctorOrSource: evt.doctorName || 'MUDr. Ján Mráz',
      urgency: 'normal'
    });
  });

  // Google Drive súbory
  driveFiles.slice(0, 5).forEach((df, idx) => {
    milestones.push({
      id: `gdrive-${df.id || idx}`,
      date: new Date().toISOString().split('T')[0],
      category: 'external_drive',
      title: `Google Drive: ${df.name}`,
      summary: `Externý dokument uložený v zložke pacienta na Google Drive (${df.mimeType || 'dokument'}).`,
      doctorOrSource: 'Google Drive',
      urgency: 'low'
    });
  });

  // Zoradenie od najnovších po najstaršie
  milestones.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Odporúčania
  if (allergies.length > 0) {
    recommendations.push(`Pozor na evidované alergie (${allergies.map(a => a.substance).join(', ')}). Overiť pred podaním liečiv.`);
  }
  if (milestones.some(m => m.category === 'surgery')) {
    recommendations.push('Skontrolovať stav jaziev, dodržiavanie tlakových masáží a fotoprotekcie SPF50.');
  }
  if (aestheticSessions.length > 0) {
    recommendations.push('Plánovať kontrolu a dopichnutie botulotoxínu / výplne s odstupom 14 dní.');
  }
  if (recommendations.length === 0) {
    recommendations.push('Kompletná dokumentácia je v poriadku. Pokračovať v štandardnom ambulantnom režime.');
  }

  return {
    patientId: patient.id,
    patientName: patient.name,
    generatedAt: new Date().toISOString(),
    generalStatus: `Pacient ${patient.name} má v kartotéke ${milestones.length} zaznamenaných udalostí a ${allergies.length} evidovaných alergií.`,
    criticalAlerts: {
      allergies,
      contraindications,
      surgicalRisks
    },
    timelineMilestones: milestones,
    clinicalRecommendations: recommendations
  };
}
