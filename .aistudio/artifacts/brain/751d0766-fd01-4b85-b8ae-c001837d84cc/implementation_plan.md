# Plán implementácie: Odpis spotreby materiálu v sekcii Prevádzka a v karte pacienta

Tento plán rieši presun a rozšírenie evidencie spotrebovaného materiálu presne podľa klinickej logiky SAY CLINIC:
1. **V hlavnom menu Prevádzka (Sklad):** Pridanie špecializovanej záložky **„Odpis na pacienta“**, kde sestra vidí otvoreného pacienta (alebo si vyberie pacienta), zoznam jeho jednotlivých operácií a vyšetrení so stavom (**Čaká na odpis** / **Odpísané**), a po rozkliknutí výkonu pohodlne vykliká spotrebovaný materiál alebo predpísaný balík.
2. **V karte pacienta (Kartotéka):** Pridanie novej 5. hlavnej zložky **„Prevádzka & Odpis“** priamo vedľa zložiek *Záznamy*, *Plány*, *Diagnostika*, *Termíny*, s rovnakým priamym rozkliknutím operácií a rýchlym odpisom.

---

## 1. Architektúra a Tok Dát

### Prepojenie výkonov a spotreby:
- Každý záznam pacienta (`docType === 'operacny_protokol'`, `kontrolne_vysetrenie`, `vstupne_vysetrenie`, `esteticky_zakrok`) a každá udalosť z operačného kalendára (`type === 'operacia'`, `kontrola`) predstavujú samostatný klinický výkon pacienta.
- Pre každý výkon systém automaticky vyhodnocuje stav odpisu:
  - **Odpísané (Zelené):** Ak v `MaterialUsageLog` existujú položky priradené k tomuto výkonu alebo dňu.
  - **Čaká na odpis (Jantárové):** Ak výkon prebehol alebo je naplánovaný, ale materiál ešte nebol zaevidovaný.
- Po rozkliknutí výkonu (napr. *Augmentácia prsníkov*, *Blefaroplastika*, *Karpálny tunel*, *SMAS Facelift*):
  1. **Najčastejšie používané položky pre tento výkon:** Okamžite klikateľné položky s indikáciou stavu skladu (napr. *PDS 4-0*, *Monocryl 4-0*, *Marcaine 0.5%*, *Redon CH10*, *Surgicel*, *Kompresívna podprsenka*).
  2. **Predpísaný balík výkonu:** Tlačidlo na 1-klikové zaevidovanie a odpis celého štandardného balíčka.
  3. **História už odpísaných položiek k tomuto výkonu:** S menom sestry, časom a možnosťou pridania ďalších materiálov.

---

## 2. Navrhované Zmeny v Kóde

### A. Služba skladu a najčastejších položiek (`src/services/inventoryService.ts`)
- Doplnenie mapy najčastejších položiek pre jednotlivé typy operácií a vyšetrení:
  - `FREQUENT_ITEMS_BY_PROCEDURE`:
    - *Augmentácia prsníkov:* PDS 4-0, Monocryl 4-0, Glycolon, Marcaine, Redon CH10, Surgicel, Lipoelastic podprsenka, SG pás.
    - *Blefaroplastika:* Citanest + Adrenalín, Prolene 5-0, Steri-Strip, Mepore krytie.
    - *Karpálny tunel:* Marcaine 0.5%, Monocryl 4-0, Steri-Strip, Elastická bandáž.
    - *Abdominoplastika:* PDS 2-0 slučka, Monocryl 3-0/4-0, Marcaine, Redon CH14, Floseal, Brušný pás.
    - *Face-lift:* Marcaine, PDS 3-0, Monocryl 4-0, Prolene 5-0, Floseal, Redon, Tvárová bandáž.
    - *Ambulancia & Preväz:* Dermacyn, Betadine, Mepore, Steri-Strip, set na extrakciu stehov.
- Metóda `InventoryService.getUsageStatusForProcedures(patientId, procedures)`: vypočíta stav odpisu pre jednotlivé výkony pacienta.

### B. Nová záložka v hlavnom menu Prevádzka (`src/components/InventoryCRM.tsx`)
- Do horného prepínača záložiek v `InventoryCRM` (`Skladové zásoby`, `Kniha spotreby`, `Objednávky`, `Balíčky výkonov`, `Kniha OPL`) pridáme:
  - **`Odpis na pacienta`** (s ikonou `UserCheck` / `PackageCheck`).
- V tejto záložke:
  - Hore: Výber aktívneho pacienta (s vyhľadávaním a okamžitým predvybratím pacienta z kontextu).
  - V tele: **Prehľadný zoznam výkonov pacienta** (operácie, kontroly, ošetrenia) so stavom:
    - ⏳ *Čaká na odpis* (zvýraznené jantárovou farbou)
    - ✓ *Odpísané (X položiek)* (zelená farba s časom a personálom)
  - Rozkliknutie výkonu rozbalí integrovaný odpisový panel:
    - **1-klikové čipy najčastejších položiek** (s rýchlym `+1`, `+2` pridaním).
    - **Tlačidlo „Aplikovať kompletný balík výkonu“**.
    - **Možnosť manuálneho vyhľadania a pridania ďalšej skladovej položky**.

### C. Nová 5. záložka v detaile pacienta (`src/components/PatientDatabase.tsx`)
- Rozšírenie typu `MainPatientFolder`:
  `export type MainPatientFolder = 'zaznamy' | 'plany' | 'diagnostika' | 'terminy' | 'prevadzka';`
- Pridanie záložky do navigácie karty pacienta:
  - `Prevádzka & Odpis` (s ikonou `Boxes` / `Package` a počítadlom výkonov čakajúcich na odpis).
- V tomto zobrazení má sestra presne ten istý intuitívny zoznam výkonov otvoreného pacienta s okamžitým rozkliknutím a odpisom materiálov priamo na mieste.

### D. Synchronizácia a Firestore (`src/services/realtimeSyncService.ts` & `src/lib/firebase.ts`)
- Všetky odpisy generujú štandardný `MaterialUsageLog`, ktorý sa ukladá a okamžite synchronizuje na všetky ostatné počítače personálu.
- Okamžitá aktualizácia stavu skladu a počtov kusov.

---

## 3. Plán Overenia a Testovania

1. **Manuálne overenie toku:**
   - Otvorenie karty pacienta -> Prechod na záložku **Prevádzka & Odpis** -> Zobrazenie zoznamu operácií a vyšetrení pacienta.
   - Rozkliknutie operácie (napr. *Augmentácia prsníkov*) -> Kliknutie na čip najčastejšej položky (napr. *PDS 4-0*) -> Overenie odpisu.
   - Kliknutie na *Aplikovať kompletný balík* -> Overenie hromadného odpisu a zmeny stavu na *Odpísané*.
   - Prechod do hlavného menu **Prevádzka & Logistika -> Sklad -> Odpis na pacienta** -> Overenie rovnakého funkčného rozhrania s možnosťou prepínania pacientov.
2. **Kompilácia a kontrola chýb:**
   - Spustenie `compile_applet` a `lint_applet` s overením 0 chýb.
