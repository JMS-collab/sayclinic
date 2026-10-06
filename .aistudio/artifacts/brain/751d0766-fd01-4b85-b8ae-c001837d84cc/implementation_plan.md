# Komplexná optimalizácia tlače a PDF generovania (A4 & A6) — SAY CLINIC

Komplexný audit, oprava a zjednotenie tlačového a PDF subsystému klinického operačného systému SAY CLINIC. Zabezpečuje bezchybnú, vysoko reprezentatívnu tlač a export do PDF vo formátoch A4 (lekárske správy, operačné protokoly, informované súhlasy, faktúry, Meicet analýzy, plány starostlivosti) a A6 (oficiálne recepty ŠEVT 14 282 2s s prioritou pre originálne predtlačené tlačivá a dotlač textu).

---

### Používateľské rozhodnutia a potvrdené preferencie

> [!IMPORTANT]
> Na základe úvodnej konzultácie boli potvrdené nasledovné kľúčové požiadavky:
> - **Rozsah kontroly**: Všetky moduly bez výnimky (Recepty A6, Lekárske správy A4, Operačné protokoly a Zmluvy/Súhlasy A4, Faktúry A4, Meicet reporty A4, Plány pacienta A4, Opiátová kniha A4).
> - **Recepty A6 (Lekársky predpis ŠEVT 14 282 2s)**: Prioritne originálne predtlačené tlačivá ŠEVT (dotlač iba textov do kolóniek s milimetrovou presnosťou) s možnosťou prepnutia na tlač celého tlačiva vrátane mriežky na biely papier.
> - **Výstupné kanály**: Personál vyžaduje plnohodnotnú funkčnosť oboch kanálov — priamu systémovú tlač cez prehliadač (`window.print()`) aj okamžitý export do PDF so štandardizovaným názvom súboru (`SAY_[Typ]_[Pacient]_[Datum].pdf`).

---

## 1. Prehľad riešenia a zistené nedostatky

Po hĺbkovej analýze zdrojového kódu boli identifikované špecifické miesta vyžadujúce optimalizáciu:

1. **Recepty A6 (`PrescriptionModule.tsx` & `pdfGenerator.ts`)**:
   - **Nekonzistentný kľúč v localStorage**: Pri čítaní posunov sa používa `say_clinic_rx_element_offsets_v3`, avšak pri ukončení ťahania myšou (`handleMouseUp`) sa ukladalo do `say_clinic_rx_element_offsets_v2`. Posuny nastavené ťahaním sa po refreshi neobnovovali.
   - **PDF export pri dotlači do ŠEVT**: Pri generovaní PDF cez `exportElementToPdf` sa kontajner klonoval do offscreen sandboxu, kde neplatili pravidlá pre `body.print-mode-preprinted`. V PDF sa tak vždy exportovali čierne vodiace čiary a mriežky, čo znemožňovalo čistú dotlač do originálneho tlačiva cez stiahnuté PDF.
   - **Tlačové okraje a @page**: Nastavenie prísneho `@page { size: 105mm 148mm; margin: 0; }` pre dialóg tlače prehliadača.

2. **Faktúry a finančné doklady (`InvoiceDetailModal.tsx`)**:
   - Chýbalo tlačidlo **"Stiahnuť A4 PDF"** (existovalo len `window.print()`).
   - Pri priamej tlači `window.print()` chýbala izolácia — tlačil sa aj tmavý backdrop modálu a pozadie obrazovky.

3. **Meicet Pro-A 3D diagnostika (`MeicetViewer.tsx`)**:
   - V modále chýbal priamy export do PDF; bolo dostupné len tlačidlo pre systémovú tlač bez garancie čistého orezania.

4. **Plány liečby a starostlivosti (`PatientPlanViewer.tsx`)**:
   - Tlačidlo malo popisku "Tlačiť plán (PDF)", no volalo iba `window.print()` bez izolácie tlačového kontajnera a bez reálneho stiahnutia PDF.

5. **Informované súhlasy a rozsiahle viacstranové dokumenty (`MedicalRecordForm.tsx`)**:
   - Podpisové bloky (pacient, lekár) a tabuľky nemali triedu `.print-avoid-break`, čo pri zalomení stránky na A4 mohlo spôsobiť rozrezanie podpisovej čiary alebo odtrhnutie podpisu na samostatnú stranu.

6. **Úradná Opiátová kniha (`OpiateLogbook.tsx`)**:
   - Chýbal priamy export do A4 PDF a tlačová izolácia.

---

## 2. Používateľská skúsenosť & Vizuálny štandard tlačových výstupov

### Formát A4 (Lekárske správy, Súhlasy, Faktúry, Plány, Meicet)
- **Rozmery a okraje**: 210 × 297 mm, tlačové okraje 10mm hore/dole, 12mm vľavo/vpravo.
- **Hlavička kliniky**: Oficiálne vektorové logo `SAY BY MRAZ`, zlatá deliaca línia (`#C5A059`), plné identifikačné údaje poskytovateľa (IČO, DIČ, kód PZS, Lazovná 43, Banská Bystrica).
- **Zalamovanie strán**: Žiadne roztrhnuté odseky ani oddelené podpisy — podpisový blok vždy drží pokope s posledným odsekom poučenia.
- **Bežiaca hlavička a päta**: Pri viacstranových PDF dokumentoch (strana 2+) elegantná úzka hlavička s názvom dokumentu a menom pacienta; v päte číslovanie `Strana X z Y` a kontakt na kliniku.

### Formát A6 (Lekársky predpis ŠEVT 14 282 2s)
- **Rozmery**: Presne 105 × 148 mm (priama zhoda s oficiálnym tlačivom MZ SR).
- **Režim Dotlač (Preprinted)**:
  - Na obrazovke: Používateľ vidí predtlačené vodiace linky s jemným označením pre jednoduchú kontrolu.
  - Na tlačiarni / v PDF: Mriežky, rámčeky a texty "Lekársky predpis", "Kód lekára", "Rodné číslo" sú úplne neviditeľné. Tlačia sa len dynamické dáta (kód lekára, 4-miestny kód ZP, meno, RČ, bydlisko, 4-miestna Dg, predpis lieku Rp., dátum, poradové číslo) na presných milimetrových súradniciach.
- **Režim Kompletný recept (Full)**:
  - Kompletná tlač mriežky, rámčeka a textov vhodná na čistý biely papier A6 alebo pre archiváciu.
- **Prepínač režimu**: Jasne viditeľný prepínač priamo v hornej lište receptu aj v dialógu exportu do PDF.

---

## 3. Technická architektúra tlačového a PDF systému

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SAY CLINIC TLAČOVÝ SUBSYSTÉM                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
          ┌─────────────────────────┴─────────────────────────┐
          ▼                                                   ▼
┌───────────────────────────────────┐       ┌───────────────────────────────────┐
│     Priama systémová tlač         │       │     Vektorový export do PDF       │
│        (window.print)             │       │    (html2canvas-pro + jsPDF)      │
└─────────────────┬─────────────────┘       └─────────────────┬─────────────────┘
                  │                                           │
                  ▼                                           ▼
┌───────────────────────────────────┐       ┌───────────────────────────────────┐
│      globals.css (@media print)   │       │      pdfGenerator.ts              │
│  - Izolácia #printable-*          │       │  - A4 (794px) / A6 (397px)        │
│  - Skrytie nav, sidebar, modal    │       │  - findBestBreakRow (smart cut)   │
│  - body.print-prescription-a6     │       │  - Voľba: preprinted vs. full     │
│  - page-break-inside: avoid       │       │  - Standardizované názvy súborov  │
└─────────────────┬─────────────────┘       └─────────────────┬─────────────────┘
                  │                                           │
                  └─────────────────────┬─────────────────────┘
                                        │
     ┌──────────────────────────────────┼──────────────────────────────────┐
     ▼                                  ▼                                  ▼
┌─────────────────────────┐ ┌─────────────────────────┐ ┌─────────────────────────┐
│     Recepty A6 (ŠEVT)   │ │  Lekárske správy & A4   │ │   Faktúry, Meicet & OPL │
│ - Presné mm pozície     │ │ - Vstupné/kontroly/op   │ │ - InvoiceDetailModal    │
│ - Dotlač vs. Plná tlač  │ │ - Informované súhlasy   │ │ - MeicetViewer          │
│ - Trvalá perzistencia   │ │ - Dermatológia          │ │ - PatientPlanViewer     │
└─────────────────────────┘ └─────────────────────────┘ └─────────────────────────┘
```

---

## 4. Konkrétne kroky realizácie

### Krok 1: Oprava a vylepšenie A6 receptov (`PrescriptionModule.tsx` & `pdfGenerator.ts`)
- Opraviť perzistenciu posunov v `PrescriptionModule.tsx` — zjednotiť kľúče na `say_clinic_rx_element_offsets_v3`.
- V `pdfGenerator.ts` pridať podporu pre voľbu režimu tlače A6 (`options.prescriptionMode?: 'preprinted' | 'full'`):
  - Ak je režim `preprinted`, v offscreen sandboxe automaticky skryť `.sevt-guide-grid` a `.sevt-preprinted-text` a odstrániť vonkajšie orámovanie, aby výsledné A6 PDF obsahovalo iba čisté texty na presných milimetrových pozíciách.
- V `PrescriptionModule.tsx` pridať pri tlačidle PDF možnosť stiahnuť PDF pre dotlač do ŠEVT alebo kompletný recept.

### Krok 2: Ochrana podpisových sekcií a zalamovania v A4 dokumentoch (`MedicalRecordForm.tsx` & `DermatologyExamPrintView.tsx`)
- Pridať CSS triedy `print-avoid-break` a `sevt-signature-section` na všetky podpisové a dôležité sumarizačné bloky:
  - Informovaný súhlas pacienta (Časť VII — Záverečné vyhlásenia a podpisy)
  - Všeobecná lekárska správa, kontrolné vyšetrenie, vstupné vyšetrenie
  - Operačný protokol (zloženie operačného tímu a podpis operatera)
  - Prepúšťacia správa a cenníkové dohody
  - Bloky dermatologických lézií a dermatoskopická mapa

### Krok 3: Faktúry — doplnenie PDF exportu a tlačovej izolácie (`InvoiceDetailModal.tsx`)
- Pridať funkciu a tlačidlo **"Stiahnuť A4 PDF"** využívajúce `exportElementToPdf` s názvom súboru `SAY_Faktura_[Cislo]_[Klient]_[Datum].pdf`.
- Pridať triedu `printable-document` a unifikovať tlačový štýl, aby pri `window.print()` tlačiareň vytlačila čistý A4 daňový doklad bez tmavého pozadia modálu.

### Krok 4: Meicet Pro-A diagnostika — doplnenie PDF exportu (`MeicetViewer.tsx`)
- Pridať tlačidlo a funkciu na okamžité stiahnutie **reprezentatívneho A4 PDF reportu** Meicet s radarovými grafmi a ročným plánom ošetrení.
- Zabezpečiť tlačovú izoláciu pri systémovej tlači.

### Krok 5: Plány pacienta a Opiátová kniha (`PatientPlanViewer.tsx` & `OpiateLogbook.tsx`)
- V `PatientPlanViewer.tsx` doplniť skutočný export do A4 PDF a priradiť korektné ID a tlačovú triedu pre priamu tlač.
- V `OpiateLogbook.tsx` doplniť export úradnej knihy OPL do PDF pre archiváciu pre ŠÚKL/MZ SR a zabezpečiť čistú tlač bez okolitých prvkov.

### Krok 6: Zjednotenie a spevnenie globálnych printových štýlov (`globals.css`)
- Doplniť globálne pravidlá v `@media print`:
  - Izolácia akéhokoľvek otvoreného tlačového modálu.
  - Vynútenie ostrého čierneho písma, bez nechcených šedých prechodov a tieňov.
  - Zamedzenie orezania tabuliek a podpisov (`break-inside: avoid`).

### Krok 7: Kompilácia a verifikácia
- Spustiť `compile_applet` a overiť bezchybné zostavenie.
- Overiť funkčnosť vo všetkých dotknutých komponentoch.
