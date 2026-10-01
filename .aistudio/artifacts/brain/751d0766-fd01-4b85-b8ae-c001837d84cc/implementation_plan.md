# Implementačný plán: Vertikálna časová os (Timeline) & Klinický panel pacienta

Tento plán špecifikuje vizuálne a funkčné vylepšenie **Centra pacienta** v komponente `PatientDatabase` o inteligentný skladací bočný panel s vertikálnou časovou osou (timeline). Panel zabezpečuje lekárovi okamžitý prehľad o alergiách, rizikách, histórii zákrokov a umožňuje rýchle pridávanie klinických poznámok počas vyšetrenia.

---

## Používateľské rozhodnutia & Potvrdené preferencie

> [!IMPORTANT]
> Na základe Vašich odpovedí v úvodnom dialógu sú záväzne zapracované nasledujúce rozhodnutia:

- **Umiestnenie panelu**: Skladací bočný panel (Collapsible Sidebar) s plynulým prepínačom rozbalenia/skrytia, ktorý pri otvorení zaberá pravú časť obrazovky (`xl:col-span-4`) a pri zbalení uvoľní plnú šírku pre zložky a fotodokumentáciu.
- **Kľúčové kategórie na časovej osi**:
  1. *Alergie a rizikové varovania* fixne umiestnené v hornej časti osi s výraznou červeno-jantárovou indikáciou (Penicilín, keloidné jazvy, antikoagulanciá).
  2. *Chirurgické výkony a zákroky* (operačné protokoly, augmentácie, blefaroplastiky).
  3. *Aplikácie estetickej medicíny* (Botox, kyselina hyalurónová, mezoterapia z modulu estetiky).
  4. *Klinické poznámky a odporúčania ošetrujúceho lekára*.
- **Interaktivita & Efektivita**: Možnosť rýchleho filtrovania udalostí podľa typu (Všetko / Zákroky / Alergie & Riziká / Poznámky) a vstavaný formulár na pridanie novej klinickej poznámky na 1 klik priamo počas ambulantného vyšetrenia.

---

## 1. Prehľad & Hlavná pridaná hodnota

- **Cieľ**: Poskytnúť operatérovi alebo dermatológovi pri otvorení karty pacienta 360° chronologický kontext bez nutnosti zdĺhavého preklikávania jednotlivých záložiek dokumentácie.
- **Používateľská skupina**: Lekári (MUDr. Mráz, MUDr. Sroková), sestry a ambulantný personál SAY CLINIC.
- **Kľúčová hodnota**:
  - Bezpečnosť pacienta: Okamžite viditeľné alergie a kontraindikácie na očiach počas celej doby vyšetrenia.
  - Rýchlosť: Okamžité zapísanie poznámky (napr. *„Pacientka hlási mierny opuch vpravo, odporučený Wobenzym, kontrola o 5 dní“*) bez opustenia obrazovky.

---

## 2. Používateľská skúsenosť & Vizuálny dizajn (UX / UI)

### Priestorové rozvrhnutie (Layout Architecture)
Karta pacienta po otvorení získa flexibilný 2-stĺpcový grid:
- **Ľavá hlavná časť (`xl:col-span-8` alebo plná šírka pri zbalení)**: Záložky zložky pacienta (Dokumenty, AI Plán liečby, Fotodokumentácia, Predoperačné vyšetrenia, Minutý materiál, Termíny).
- **Pravý bočný panel (`xl:col-span-4`)**: Pripnutý vertikálny timeline panel (`sticky top-28`):
  - Hlavička s počítadlom záznamov a tlačidlom na skrytie panelu.
  - Sekcia *Kritické alergie a riziká* s možnosťou rýchleho pridania nového varovania.
  - Segmentový prepínač filtrov (Všetko · Zákroky · Poznámky).
  - Tlačidlo `+ Pridať poznámku` s rýchlym rozbaľovacím editorom.
  - Samotná vertikálna časová os s dizajnovou zlatou líniou, uzlovými bodmi a dátumovými pečiatkami.

### Vizuálny jazyk & Princípy Frontend Design
- **Paleta**:
  - Pozadie panelu: `#FAF8F5` s jemným okrajom `#E8E2D9`.
  - Alergie: Jemné červené pozadie `#FEF2F2`, text `#991B1B`, orámovanie `#FCA5A5`.
  - Zlaté akcenty kliniky: `#C5A059` na línii časovej osi a aktívnych stavoch.
  - Typografia: Čistá hierarchia bez rušivých candy odznakov; dátumy v tabuľkovom formáte `font-mono tabular-nums`.
- **Indikátor zbaleného stavu**:
  - Ak lekár panel skryje, na pravej hrane zložky zostane visieť diskrétna plávajúca záložka:
    `[⏱️ Časová os · ⚠️ 1 alergia · 4 výkony]`, ktorej kliknutím sa panel okamžite rozbalí.

---

## 3. Kľúčové produktové rozhodnutia & Komponenty

1. **Agregácia dát z viacerých modulov**:
   - Časová os dynamicky spája:
     - Lekárske záznamy pacienta (`patientRecords[selectedPatient.id]`).
     - Aplikácie botoxu a výplní z estetického modulu (`say_clinic_aesthetic_sessions`).
     - Rýchle klinické poznámky a špecifické alergie pacienta (`say_clinic_patient_clinical_timeline_v1`).
2. **Perzistencia a Realtime synchronizácia**:
   - Všetky novovytvorené klinické poznámky a pridané alergie sa okamžite ukladajú do lokálneho úložiska a publikujú cez `RealtimeSyncService`, aby boli viditeľné na všetkých staniciach kliniky.
3. **Plynulý prechod a responzivita**:
   - Na notebookoch a tabletoch je panel plne prispôsobivý, s možnosťou posunu (scroll) nezávisle od hlavnej zložky.

---

## 4. Technická architektúra & Dátový model

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PatientDatabase.tsx                             │
│                                                                        │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────┐  │
│  │     Hlavná zložka pacienta      │  │ Skladací bočný panel        │  │
│  │      (xl:col-span-8)            │  │ (xl:col-span-4 / sticky)    │  │
│  │                                 │  │                             │  │
│  │  • Dokumenty & Správy           │  │  ⚠️ Alergie & Riziká        │  │
│  │  • AI Roadmap (12M)             │  │  ─────────────────────────  │  │
│  │  • Plány & Starostlivosť        │  │  🔍 Filter kategórií        │  │
│  │  • Termíny & Kontroly           │  │  ➕ Rýchla poznámka (1-klik)│  │
│  │  • Fotodokumentácia             │  │  ─────────────────────────  │  │
│  │  • Spotrebovaný materiál        │  │  ● Vertikálna časová os:    │  │
│  │                                 │  │    │  2026-08-12 Augmentácia│  │
│  │                                 │  │    │  2026-07-25 Konzultácia│  │
│  │                                 │  │    │  2026-06-10 Botox čelo │  │
│  └─────────────────────────────────┘  └─────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Dátová štruktúra časovej osi:
```typescript
interface TimelineItem {
  id: string;
  patientId: string;
  category: 'allergy' | 'surgery' | 'aesthetic' | 'note' | 'prescription';
  title: string;
  description: string;
  date: string;
  author: string;
  severity?: 'critical' | 'warning' | 'info';
  tags?: string[];
}
```

---

## 5. Postup implementácie po schválení

1. **Rozšírenie dátových typov a východiskových hodnôt**:
   - Doplnenie štruktúry pre klinické alergie a rýchle poznámky pacienta.
   - Vytvorenie reálnych klinických východiskových dát pre demo pacientov.
2. **Implementácia komponentu `PatientTimelineSidebar`**:
   - Vytvorenie bočného panelu s podporou zbalenia/rozbalenia.
   - Horný box pre alergie s tlačidlom na rýchle pridanie.
   - Filtrovanie udalostí a interaktívny formulár novej poznámky.
   - Vykreslenie štýlovej vertikálnej osi s uzlami a časovými údajmi.
3. **Integrácia do `PatientDatabase.tsx`**:
   - Úprava rozloženia zložky pacienta na flexibilný dvojstĺpcový grid.
   - Prepojenie so stavom pacienta a odber zmien.
4. **Verifikácia a testovanie**:
   - Kontrola kompilácie cez `compile_applet`.
   - Overenie plynulosti zbaľovania a ukladania poznámok v prehliadači.
