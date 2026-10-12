# Prehľadná a moderná karta pacienta (SAY CLINIC)

Komplexná reorganizácia a zjednodušenie detailu pacienta v kartotéke: eliminácia vizuálneho chaosu, zlúčenie 8 roztrieštených záložiek do 4 logických modulov, transformácia 7 veľkých farebných dlaždíc do štíhlej akčnej lišty a sprehľadnenie časovej osi s okamžitým prístupom k alergiám a anamnéze.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Na základe Vašich odpovedí v interaktívnom dotazníku sme definovali tieto kľúčové princípy pre novú podobu karty:

- **Zlúčenie záložiek (Potvrdené)**: Zredukujeme 8 pôvodných záložiek (`dokumenty`, `roadmap`, `meicet`, `plany`, `terminy`, `fotodokumentacia`, `predoperacne`, `materialy`) do **4 hlavných sekcií**:
  1. **📄 Záznamy & Dokumentácia** (Dekurzy, správy, predoperačné vyšetrenia, Google Drive a spotrebovaný materiál).
  2. **✨ Plány & Starostlivosť** (Zjednotený 12-mesačný AI liečebný plán a personalizované ročné/operačné protokoly).
  3. **🔬 Diagnostika & Fotodokumentácia** (3D spektrálna analýza Meicet Pro-A + fotodokumentácia podľa etáp).
  4. **📅 Termíny & Kontroly** (Harmonogram operácií, kontrol a rezervácie na sálu).
- **Zjednodušenie rýchlych akcií (Potvrdené)**: Odstránime 7 nesúrodých farebných dlaždíc "1-Click Hub", ktoré zaberali tretinu obrazovky. Nahradí ich elegantná, tenká lišta s 3 najčastejšími akciami (*Nová správa*, *Vystaviť recept*, *Aplikovať výplne*) a jedným prehľadným rozbaľovacím tlačidlom *„Ďalšie klinické akcie“*.
- **Štíhly bočný panel časovej osi (Potvrdené)**: Panel časovej osi a alergií zúžime na ergonomický postranný pás s výrazným varovaním pred liekovými alergiami na vrchu a možnosťou 1-kliknutím panel zbaliť alebo rozbaliť.

---

### 1. Overview & Core Concept

- **Čo riešenie prináša**: Transformuje preťaženú, vizuálne roztrieštenú kartu pacienta na čisté, pokojné medicínske pracovisko s vysokou informačnou hustotou, kde lekár alebo sestra nájdu potrebný údaj do 2 sekúnd bez posúvania a hľadania medzi 8 záložkami.
- **Cieľová skupina**: Ošetrujúci lekári (MUDr. Ján Mráz a chirurgický tím), sestry na ambulancii a recepcia SAY CLINIC.
- **Kľúčová hodnota**: Odstránenie duplicitných sekcií (doteraz existovali dve samostatné záložky pre plány liečby), čistá typografická hierarchia a zachovanie všetkých existujúcich klinických funkcií, dát a integrácií.

---

### 2. User Experience & Visual Design

#### A. Štruktúra novej obrazovky pacienta
1. **Kompaktná hlavička pacienta**:
   - Vľavo: Tlačidlo návratu na zoznam, meno pacienta v elegantnej typografii, vek, rodné číslo a indikátor aktívneho pacienta v celom systéme.
   - Vpravo: Dvojriadkový prehľadný štítok kontaktov (telefón, poisťovňa, email, bydlisko) a tlačidlo úpravy profilu.
   - Súbežná práca tímu (Live Presence) je diskrétne integrovaná priamo pri mene pacienta.
2. **Klinická akčná lišta (Quick Action Bar)**:
   - Jednoriadková lišta umiestnená priamo pod hlavičkou.
   - 3 priame akcie:
     - `[+ Nová správa / Nález]` (primárne tmavé tlačidlo SAY)
     - `[💊 Vystaviť recept ŠEVT]` (jemný klinický akcent)
     - `[💉 Výplne & Botox]` (zlatý akcent)
   - Tlačidlo `[••• Viac akcií ▾]`: Dropdown pre Meicet Pro-A, Naplánovanie termínu, Vytvorenie plánu a Predaj kozmetiky v POS.
3. **Hlavný 4-sekciový navigačný segment**:
   - Čistý segmentový prepínač s jemným podčiarknutím a počítadlami:
     - **Záznamy & Dokumenty** (počet dekurzov + vyšetrení)
     - **Plány & Starostlivosť** (12M AI plán + protokoly)
     - **Diagnostika & Foto** (Meicet 3D + fotky)
     - **Termíny & Kontroly** (počet nadchádzajúcich termínov)
4. **Vnútorný obsah vybranej sekcie**:
   - Čisté biele plochy s tenkými linkami (`#E8E2D9`), nulový vizuálny šum, žiadne zbytočné farebné odznaky ani "karty v kartách".
5. **Štíhly bočný panel časovej osi (pravá strana)**:
   - Na vrchu: **Kritické klinické upozornenia** (napr. *Alergia: Penicilín* v jasnom, neprehliadnuteľnom varovnom rámčeku).
   - V strede: Vertikálna časová os výkonov s dátumami a operatérova poznámka.
   - Prepínač zbalenia: Ikona šípky / hodín, ktorá panel plynulo minimalizuje na tenký zvislý pásik.

#### B. Vizuálna identita & Dizajnový systém SAY CLINIC
- **Paleta farieb**:
  - *Dominantné plátno (60%)*: Čistá biela (`#FFFFFF`) a teplé podkladové tóny kliniky (`#FAF8F5`).
  - *Štrukturálne plochy (30%)*: Jemné linky (`#E8E2D9`), antracitová (`#2C2A29`) pre primárne stavy.
  - *Akcenty (10%)*: Šampanské zlato (`#C5A059`) výhradne pre aktívne záložky a kľúčové tlačidlá.
- **Typografia**:
  - Montserrat / Plus Jakarta Sans pre záhlavia a štítky.
  - Všetky čísla, dátumy, rodné čísla a ceny v `tabular-nums` / `font-mono`.
- **Anti-Slop disciplína**:
  - Žiadne preplácané farebné pilulky ani "cukríkové" odznaky.
  - Žiadne pulzujúce dekoračné bodky.
  - Žiadne hrubé ľavé farebné pruhy.

---

### 3. Key Product Decisions & Trade-Offs

- **Zjednotenie AI plánu a špecifických plánov pacienta**:
  - *Zvolený prístup*: V záložke **Plány & Starostlivosť** bude na vrchu elegantný podprepínač: `[12-Mesačný AI Plán]` a `[Protokoly starostlivosti]`.
  - *Dôvod*: Doteraz boli v dvoch úplne oddelených záložkách (`roadmap` a `plany`), čo používateľov miatlo a nútilo ich prepínať tam a späť.
- **Kompaktná akčná lišta namiesto 7 dlaždíc**:
  - *Zvolený prístup*: 3 najfrekventovanejšie tlačidlá zostávajú okamžite viditeľné; ostatné 4 sú dostupné cez 1 kliknutie v dropdown menu.
  - *Dôvod*: 7 veľkých farebných kariet vytváralo chaos a odtláčalo samotnú zdravotnú dokumentáciu pod úroveň prvého pohľadu.
- **Google Drive integrácia**:
  - *Zvolený prístup*: Umiestnenie do sekcie **Záznamy & Dokumentácia** ako elegantný prelink a synchronizačný modul, nie ako obrovský masívny banner nad všetkými záložkami.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        KARTA PACIENTA (HLAVIČKA)                       │
│  Meno, Vek, RČ, Poisťovňa, Tel, Email | Live Presence | Upraviť Profil │
├────────────────────────────────────────────────────────────────────────┤
│                       KLINICKÁ AKČNÁ LIŠTA                             │
│  [+ Nová správa]  [💊 Recept ŠEVT]  [💉 Výplne/Botox]  [••• Viac ▾]    │
├───────────────────────────────────────────────────────┬────────────────┤
│       4 HLAVNÉ ZÁLOŽKY (SEGMENTOVÝ PREPÍNAČ)          │ ŠTÍHLY BOČNÝ   │
│ ┌────────────┬─────────────┬─────────────┬──────────┐ │ PANEL          │
│ │ 1.ZÁZNAMY  │  2.PLÁNY    │3.DIAGNOSTIKA│4.TERMÍNY │ │ ⚠️ Alergie     │
│ └────────────┴─────────────┴─────────────┴──────────┘ │ ⏱️ Časová os   │
│                                                       │ 📅 Posledné    │
│  [Aktívny obsah vybranej sekcie bez zbytočných kariet]│    výkony      │
│  • Záznamy: Správy, vyšetrenia, materiál, Drive link  │                │
│  • Plány: 12M AI Plán + Ročné/pooperačné protokoly    │ [◀ Zbaliť]     │
│  • Diagnostika: Meicet Pro-A 3D + Fotogaléria etáp    │                │
│  • Termíny: Operačné sály, kontroly, objednanie       │                │
└───────────────────────────────────────────────────────┴────────────────┘
```

#### Komponenty a stav
- **`PatientDatabase.tsx`**:
  - `activeFolder`: Prechod z 8 stavov na 4 hlavné kategórie: `'zaznamy' | 'plany' | 'diagnostika' | 'terminy'`.
  - `subTab`: Podstavy pre detailné prepínanie v rámci sekcie (napr. v plánoch prepínač medzi AI plánom a protokolmi; v diagnostike medzi Meicet a fotodokumentáciou).
  - `isActionsDropdownOpen`: Stav pre rozbaľovacie menu dodatočných klinických akcií.
  - `isTimelineOpen`: Zachované ukladanie do `localStorage` (`say_clinic_timeline_open_state`).
- **Zachovanie všetkých integrácií**:
  - `AIHealthRoadmapView` a `PatientPlanViewer` (vrátane novo vygenerovaného A4 PDF exportu).
  - `MeicetModule` a `PatientDriveFiles`.
  - Recepty, POS predaj, generátor dekurzov a kalendár sál.
