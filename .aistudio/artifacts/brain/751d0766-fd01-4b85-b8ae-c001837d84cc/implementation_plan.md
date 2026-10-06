# Radikálne zjednodušenie modulu Estetika (SAY CLINIC)

Kompletná transformácia modulu estetickej dermatológie a chirurgie na čisté, vysoko intuitívne a používateľsky prívetivé prostredie so zameraním na 2D sochu tváre, priame nanášanie bodov, vizuálny archív predchádzajúcich sedení a elegantný, minimalistický A4 klientsky report.

---

### Potvrdené rozhodnutia používateľa

> [!IMPORTANT]
> Na základe úvodnej konzultácie boli záväzne potvrdené nasledovné kľúčové zásady:
> 1. **Hlavná obrazovka estetiky**: Odstrániť všetky prebytočné bočné lišty, telové formuláre a technické filtre. V centre pozornosti je **čistá socha tváre v strede** s rýchlym, ergonomickým výberom materiálov (horná/spodná lišta rýchlej voľby).
> 2. **Uložené predchádzajúce ošetrenia**: V histórii sa nezobrazujú zložité textové tabuľky, ale **vizuálna karta sochy s presne označenými bodmi aplikácie** a plynulým dátumovým prepínačom medzi jednotlivými sedeniami.
> 3. **A4 klientsky report**: Zredukovaný na čistý jednostránkový reprezentatívny sumár:
>    - **Aplikované látky a množstvá** (preparát, šarža, oblasť, dávka)
>    - **Lekárske odporúčania** (starostlivosť po zákroku, obmedzenia)
>    - **Finančné vyčíslenie / Cena** (prehľad nákladov za výkon)
>    - **Ďalší postup a termín** (odporúčaná kontrola alebo nadväzujúce ošetrenie)

---

## 1. Prehľad konceptu a cieľ riešenia

Aktuálny modul estetiky trpel vizuálnym preťažením: obsahoval zložité bočné stĺpce, zoznamy telových procedúr, prepínače šablón, technické kódy a neprehľadný A4 protokol plný tabuľkového balastu.

Nové riešenie prináša:
- **Maximálne odľahčenie pracovnej plochy**: Lekár má pred sebou priamo tvár sochy a rýchly panel najčastejších preparátov (Dysport, Restylane, Profhilo, Radiesse, Sculptra). Jedným klikom zvolí preparát a priamo na tvári značí body vpichov.
- **Okamžitý vizuálny archív predchádzajúcich ošetrení**: Po kliknutí na dátum predchádzajúceho sedenia sa okamžite zobrazí socha pacienta s vyznačenými bodmi z daného dňa bez nutnosti čítať dlhé technické protokoly.
- **Prehľadný klientsky A4 report**: Elegantný jednostránkový dokument vhodný na tlač aj odoslanie pacientovi, kde nájde presne to, čo potrebuje vedieť: čo mu bolo aplikované, ako sa má správať nasledujúce dni, koľko zákrok stál a kedy má prísť na ďalšie ošetrenie.

---

## 2. Používateľská skúsenosť & Vizuálny dizajn

### Hlavné používateľské toky (User Flows)
1. **Rýchla aplikácia bodov (Editor)**:
   - Lekár otvorí modul estetiky pre aktívneho pacienta.
   - V hornej rýchlej lište si vyberie preparát (napr. *Dysport 300IU* alebo *Restylane Kysse*).
   - Kliknutím na tvár sochy umiestňuje presné aplikačné body (čelo, glabela, pery, nasolabiál).
   - Môže rýchlo prepínať pohľady: **Čelný (En face)**, **Profil Ľavý**, **Profil Pravý**.
   - Zadanie ceny ošetrenia priamo v rýchlej päte alebo paneli.
   - Jedným klikom na *"Uložiť ošetrenie"* sa výkon zapíše do karty pacienta.

2. **Prehliadanie predchádzajúcich ošetrení (História)**:
   - Prepínač sedení priamo nad sochou (alebo dedikovaný pohľad *"Predošlé ošetrenia"*).
   - Kliknutím na konkrétny dátum (napr. *15. Január 2026*) sa na soche vykreslia presné body danej aplikácie.
   - Žiadne zbytočné tabuľky — len socha s bodmi a kompaktná karta s aplikovaným materiálom a dátumom.

3. **A4 Klientsky report**:
   - Tlačidlo *"A4 Report pre klienta"* okamžite prepne zobrazenie na čistý, reprezentatívny formát SAY CLINIC.
   - Obsahuje:
     - Hlavička kliniky SAY CLINIC a identifikácia pacienta.
     - **Prehľad aplikácie**: zoznam preparátov, šarže (LOT), aplikované množstvá a vizuálna miniatúra sochy s bodmi.
     - **Odporúčania po zákroku**: editovateľné/predvolené inštrukcie (neľahať si 4 hodiny, vynechať saunu a šport 48h, chladiť suchým chladom).
     - **Cena výkonu**: prehľadne vyčíslená celková suma (napr. 340 €).
     - **Ďalší postup & Kontrola**: plánovaný termín (napr. o 14 dní kontrola botulotoxínu, o 6 mesiacov aplikácia biostimulátora).
     - Podpis lekára a dátum.
   - Možnosť priamej tlače (`window.print()`) aj uloženia do PDF.

### Vizuálna identita a štýl
- **Farebná paleta**: Čistý podklad `#FAF8F5`, zlaté akcenty SAY CLINIC `#C5A059`, tmavá antracitová `#2C2A29` pre prémiovú čitateľnosť, farebné kódovanie bodov podľa materiálu (modrá pre botox, ružová pre výplne, zelená pre Profhilo, jantárová pre biostimulátory).
- **Typografia**: Serifové prvky pre záhlavie SAY CLINIC, čistý čitateľný sans pre inštrukcie a tabuľky, tabular-nums pre dávky a ceny.
- **Ergonómia**: Žiadny vizuálny šum, žiadne skryté položky v preplnených zoznamoch.

---

## 3. Kľúčové produktové a technické rozhodnutia

- **Rozhodnutie 1: Eliminácia nadbytočných modulov v estetike**:
  - *Zvolený prístup*: Odstránenie sekcie *"Ošetrenie tela"* a zložitého stĺpca šablón z hlavného pracovného toku estetiky. Socha tváre dostáva 100% priestoru.
  - *Dôvod*: Estetické ošetrenia tváre tvoria 95% dennej praxe a prítomnosť telových formulárov a zložitých zoznamov spôsobovala neprehľadnosť a spomaľovala prácu.

- **Rozhodnutie 2: Vizuálna orientácia predchádzajúcich sedení**:
  - *Zvolený prístup*: V histórii sa namiesto textového protokolu zobrazuje priamo socha s bodmi v režime náhľadu (read-only) s rýchlym prepínaním dátumov.
  - *Dôvod*: Lekár potrebuje za 2 sekundy vidieť, kam presne minule pichal botox alebo výplň.

- **Rozhodnutie 3: Zameranie A4 reportu na pacienta**:
  - *Zvolený prístup*: Transformácia doterajšieho interného "lekárskeho protokolu" na moderný klientsky A4 sumár s cenou, odporúčaniami a ďalším postupom.
  - *Dôvod*: Klient potrebuje jasný doklad s poučením a vyčíslením, nie interné administratívne kódy.

---

## 4. Technická architektúra a tok dát

```
┌────────────────────────────────────────────────────────────────────────┐
│                   AESTHETICS MODULE REDESIGN                           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│  REŽIM 1: EDITOR     │ │  REŽIM 2: HISTÓRIA   │ │  REŽIM 3: A4 REPORT  │
│  - Rýchly výber      │ │  - Prepínač dátumov  │ │  - Aplikované látky  │
│    materiálu         │ │  - Socha s bodmi     │ │  - Odporúčania       │
│  - 2D socha v strede │ │    z daného dňa      │ │  - Cena ošetrenia    │
│  - Priame klikanie   │ │  - Rýchly súhrn      │ │  - Dalsí termín      │
│  - Voľba pohľadu     │ │    (materiál + cena) │ │  - Tlač / PDF export │
└──────────────────────┘ └──────────────────────┘ └──────────────────────┘
```

### Dátové štruktúry a perzistencia
- Rozšírenie `AestheticSession` o:
  - `price?: number` (celková cena ošetrenia v €)
  - `recommendations?: string` (odporúčania pre domáci režim)
  - `nextStep?: string` (ďalší postup a plánovaný termín kontroly)
- Automatické ukladanie do histórie sedení pacienta a integrácia s `medicalRecords`.

---

## 5. Plán realizácie krok za krokom

1. **Refaktoring `AestheticsModule.tsx`**:
   - Odstránenie ťažkopádnych bočných stĺpcov, zoznamov telových procedúr a nadbytočného šablónového balastu.
   - Vytvorenie čistého horného / kompaktného selektora materiálov s priamym nastavením ceny.
   - Maximalizácia priestoru pre 2D sochu v strede obrazovky.
2. **Implementácia vizuálneho prehľadu histórie**:
   - Dátumová lišta s rýchlym prepínaním predchádzajúcich sedení.
   - Zobrazenie sochy s bodmi príslušného ošetrenia.
3. **Nový zjednodušený A4 klientsky report**:
   - Redizajn `viewMode === 'protocol'` na čistý klientsky A4 sumár SAY CLINIC (aplikované látky, odporúčania, cena, ďalší postup).
   - Zachovanie precízneho `window.print()` a PDF exportu.
4. **Verifikácia a testovanie**:
   - Test prepínania pohľadov, kreslenia bodov, ukladania do histórie a generovania A4 reportu.
