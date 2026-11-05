import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getEffectiveGeminiApiKey } from '@/lib/geminiKey';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, currentData } = body;

    if (!prompt && !currentData) {
      return NextResponse.json({ error: 'Chýba zadanie alebo existujúce dáta vyšetrenia.' }, { status: 400 });
    }

    const apiKey = await getEffectiveGeminiApiKey();
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'Gemini API kľúč nie je nakonfigurovaný. Použite vstavanú lokálnu Smart syntézu.' 
      }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `Si špičkový atestovaný dermatológ a dermato-onkológ na klinike SAY CLINIC.
Tvojou úlohou je analyzovať diktát alebo zhrnutie kožného vyšetrenia a vrátiť štruktúrovaný medicínsky záver v slovenčine s latinskou terminológiou.
Odpovedaj výhradne v platnom JSON formáte s nasledujúcou štruktúrou:
{
  "morphologyDescription": "Detailný status dermatologicus localis (kožný kryt, eflorescencie, turgor, hydratácia)...",
  "dermoscopySummary": "Dermatoskopický súhrn celého tela a nájdených névov...",
  "primaryDiagnosis": { "code": "MKCH kód napr. Z01.8 alebo D22.5", "name": "Názov diagnózy" },
  "secondaryDiagnoses": [ { "code": "...", "name": "..." } ],
  "localTherapy": "Ordinovaná lokálna farmakoterapia...",
  "systemicTherapy": "Systémová liečba...",
  "dermocosmetics": "Odporúčaná dermokozmetika a SPF...",
  "regimeRecommendations": "Režimové opatrenia, poučenie o UV a ABCDE...",
  "nextCheckup": "Plánovaná kontrola...",
  "aiNotes": "Klinické odporúčanie pre lekára..."
}`;

    const userContent = `Diktát/požiadavka lekára:
${prompt || 'Vygeneruj odbornú syntézu z priložených údajov o pacientovi.'}

Aktuálne zadané dáta vyšetrenia:
${JSON.stringify(currentData || {}, null, 2)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: `${systemInstruction}\n\n${userContent}` }] }
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    });

    const responseText = response.text || '{}';
    let parsedData = {};
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      // Fallback ak by JSON obsahoval markdown obal
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleanJson);
    }

    return NextResponse.json({ success: true, result: parsedData });
  } catch (error: any) {
    console.error('Chyba AI dermatologického asistenta:', error);
    return NextResponse.json({ 
      error: error.message || 'Zlyhala komunikácia s AI asistentom' 
    }, { status: 500 });
  }
}
