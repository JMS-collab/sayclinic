# Implementačný plán: AI Klinický súhrn klienta (Časová os, Riziká & Odporúčania)

Tento plán špecifikuje implementáciu inteligentného AI klinického súhrnu pre **Centrum pacienta** a bočný panel `PatientTimelineSidebar`. Systém pomocou Gemini 3.8 Flash automaticky analyzuje kompletnú dostupnú históriu pacienta (anamnézu, lekárske správy, operácie, botox/výplne, termíny, recepty a súbory z Google Drive) a vytvorí vysoko štruktúrovaný, okamžite zrozumiteľný súhrn pre lekára počas vyšetrenia.

---

## Používateľské rozhodnutia & Potvrdené preferencie

> [!IMPORTANT]
> Na základe Vašich priamych odpovedí boli stanovené tieto kľúčové princípy:

1. **Vždy čerstvá aktualizácia**: AI súhrn sa automaticky generuje a udržiava čerstvý pri otvorení karty a pri každej zmene v dokumentácii (pridanie správy, poznámky, receptu, termínu), s možnosťou manuálneho okamžitého prepočtu (tlačidlo *Aktualizovať AI súhrn*).
2. **Kompletné dátové zdroje**: Do analýzy vstupujú všetky dostupné informácie o klientovi:
   - Základné klientske a anamnestické dáta (vek, pohlavie, poisťovňa, známe diagnózy)
   - Lekárske správy, nálezy, prepúšťacie správy a operačné protokoly
   - Záznamy z estetickej medicíny (aplikácie botulotoxínu a dermálnych výplní, jednotky, šarže, lokality)
   - Vystavené lekárske recepty a lieková história
   - História a plánované termíny operačných sál a kontrol
   - Zoznam a metadáta dokumentov z priečinka pacienta na Google Drive
   - Operatívne poznámky tímu a doterajšie alergie
3. **Štruktúrované zobrazenie v bočnom paneli**:
   - 🚨 **Kritické riziká & Alergie** (červený/jantárový varovný blok na vrchu: liekové alergie, kontraindikácie, riziká hojenia, predchádzajúce komplikácie)
   - ⏱️ **Inteligentná chronologická časová os** (zjednotený časový sled kľúčových míľnikov od najnovších po najstaršie)
   - 💡 **Klinické odporúčania & Ďalšie kroky** (konkrétne odporúčania pre ošetrujúceho lekára na základe celkovej histórie)

---

## 1. Prehľad & Hlavný koncept

- **Čo to robí**: Bočný panel pacienta sa mení zo statického zoznamu na živý **AI Clinical Intelligence Panel**. Lekár jedným pohľadom získa syntézu všetkých roztrúsených informácií bez nutnosti otvárať jednotlivé PDF súbory, zložky alebo externé disky.
- **Cieľová skupina**: Ošetrujúci lekári (plastický chirurg, dermatológ), zdravotné sestry a koordinátorky SAY CLINIC počas ambulantného vyšetrenia, predoperačnej konzultácie alebo kontroly.
- **Kľúčová hodnota**: Maximálna bezpečnosť pacienta (okamžité odhalenie kontraindikácií), úspora času (lekár nemusí čítať 10 rôznych správ) a kontinuita starostlivosti.

---

## 2. Používateľská skúsenosť & Vizuálny dizajn (Frontend Design)

### Kľúčové toky lekára
1. **Otvorenie karty pacienta**: V bočnom paneli sa zobrazí prémiový blok AI súhrnu. Ak už bol pre pacienta vygenerovaný a dáta sa nezmenili, načíta sa z lokálnej vyrovnávacej pamäte s časovou pečiatkou (napr. *Aktualizované dnes o 11:20*).
2. **Automatická detekcia zmien**: Ak lekár vystaví nový recept, pridá záznam alebo naplánuje operáciu, v paneli sa diskrétne zobrazí indikátor synchronizácie a AI súhrn sa čerstvo prepočíta na pozadí.
3. **Manuálne prepočítanie**: Tlačidlo *„Obnoviť AI súhrn“* s jemnou rotáciou ikony pre prípad, že pribudli externé súbory na Google Drive.

### Vizuálna hierarchia a dizajn (SAY CLINIC Elegance)
- **Zero-Pill & Anti-Slop Disciplína**: Vyhýbame sa krikľavým bublinám. Používame čisté typografické členenie, jemné farebné tóny a jasné ohraničenia:
  - **Varovný blok rizikových faktorov**: Tlmený krémovo-červenkastý podklad (`bg-rose-50/70 border border-rose-200/80`), jasné červené odrážky pre liekové alergie (Penicilín, Mesocain), jantárové pre interné riziká (keloidy, hypertenzia, antikoncepcia).
  - **Klinická časová os (Timeline)**: Vertikálna linka vo farbe `#E8E2D9` s decentnými uzlami podľa typu udalosti (operácia, kontrola, botox, recept, externý dokument).
  - **Odporúčania pre lekára**: Elegantný zlatistý blok (`border-l-2 border-[#C5A059] bg-[#FAF8F5] p-3 text-xs`) so zhrnutím ďalších potrebných krokov (napr. *„Vysadiť HAK 4 týždne pred plánovanou augmentáciou, skontrolovať koagulácie“*).
- **Stav načítavania (Skeleton State)**: Žiadne skákajúce rozhranie – pri generovaní sa zobrazuje decentný pulzujúci skelet s textom *„Gemini AI analyzuje dokumentáciu a Google Drive súbory...“*.

---

## 3. Produktové a technické rozhodnutia

- **Model**: `gemini-3.8-flash` cez `@google/genai` (rýchla odozva do 2 sekúnd, vysoká medicínska presnosť pri syntéze anamnézy a štruktúrovanom JSON výstupe).
- **Backend Proxy**: Bezpečný serverový route `/api/ai/patient-summary` chránený serverovým kľúčom `GEMINI_API_KEY` (kľúč nikdy neopustí server).
- **Cache & Zmeny**: Každý vygenerovaný súhrn sa ukladá lokálne s kontrolným hashom/dátumom posledných záznamov pacienta. Pri zmene záznamov alebo požiadavke sa okamžite vyvolá nová syntéza.
- **Fallback pri nedostupnosti**: Ak by API zlyhalo alebo nebolo online pripojenie, panel plynule prejde na lokálny deterministický súhrn (posledné záznamy a evidované alergie z lokálnej databázy).

---

## 4. Technická architektúra & Dátový tok

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Centrum Pacienta (UI)                           │
│   (PatientDatabase.tsx / PatientTimelineSidebar.tsx)                  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ 1. Zhromaždenie dát pacienta
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Aggregator dát klienta:                                                │
│  - Profil (vek, diagnózy, kontakt)                                    │
│  - Lekárske správy & operácie (patientRecords)                        │
│  - Botox & výplne (aestheticSessions)                                 │
│  - Recepty (prescriptions)                                            │
│  - Kalendár sál & kontroly (calendarEvents)                           │
│  - Google Drive zoznam súborov (Google Drive API / metadata)          │
│  - Existujúce klinické poznámky                                       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ 2. POST /api/ai/patient-summary
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Next.js Server Route: /api/ai/patient-summary                          │
│  - Validácia relácie a vstupných dát                                   │
│  - Príprava medicínskeho systémového promptu                          │
│  - Gemini 3.8 Flash (@google/genai SDK)                               │
│  - Štruktúrovaný výstup: { risks, timeline, recommendations }          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ 3. JSON odpoveď
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Zobrazenie v PatientTimelineSidebar:                                   │
│  - 🚨 Blok kritických alergií a klinických rizikových faktorov        │
│  - ⏱️ Syntetizovaná vertikálna časová os výkonov                      │
│  - 💡 Odporúčania pre ďalší postup a predoperačnú prípravu             │
│  - Možnosť 1-klik pridania novej klinickej poznámky do systému        │
└────────────────────────────────────────────────────────────────────────┘
```

### Dátová štruktúra výstupu AI:
```ts
export interface AIPatientSummary {
  patientId: string;
  generatedAt: string;
  criticalAlerts: {
    allergies: { substance: string; reaction: string; severity: 'critical' | 'warning' }[];
    contraindications: string[];
    surgicalRisks: string[];
  };
  timelineMilestones: {
    date: string;
    category: 'surgery' | 'aesthetic' | 'consultation' | 'prescription' | 'document' | 'external_drive';
    title: string;
    summary: string;
    doctorOrSource?: string;
  }[];
  clinicalRecommendations: string[];
  generalStatus: string;
}
```

---

## 5. Kroky implementácie po schválení

1. **Vytvorenie API Endpointu**: `/src/app/api/ai/patient-summary/route.ts` s volaním `gemini-3.8-flash`, detailným medicínskym promptom a typovaným JSON výstupom.
2. **Rozšírenie zberu dát**: V `PatientDatabase.tsx` a `PatientTimelineSidebar.tsx` agregovať dáta o pacientovi vrátane Drive metadát, záznamov, botoxu, receptov a kalendára.
3. **Redizajn `PatientTimelineSidebar.tsx`**:
   - Vytvorenie čistých štruktúrovaných sekcií pre kritické riziká, časovú os a odporúčania.
   - Stav načítavania, tlačidlo okamžitého obnovenia a indikátor poslednej aktualizácie.
   - Možnosť prepínania medzi AI súhrnom a podrobným manuálnym zoznamom poznámok.
4. **Kompilácia a verifikácia**: Testovanie odozvy, overenie spracovania reálnych klientskych dát a kontrola stavu bez chýb (`compile_applet`).
