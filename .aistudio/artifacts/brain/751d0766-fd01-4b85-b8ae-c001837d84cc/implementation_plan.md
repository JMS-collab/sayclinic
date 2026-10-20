# Komplexné vyčistenie vzorových a mock údajov SAY CLINIC OS

Kompletné odstránenie všetkých fiktívnych a vzorových dát zo systému SAY CLINIC — vrátane testovacích pacientov, dekurzov, operačných protokolov, Meicet analýz, kalendárových termínov a skladových zásob, pri striktnom zachovaní autentifikovaných účtov tímu SAY CLINIC a odborných lekárskych šablón.

---

## Prehľad overených rozhodnutí (User Decisions)

> [!IMPORTANT]
> Na základe Vašich predchádzajúcich odpovedí v dotazníku boli schválené nasledujúce parametre vyčistenia:
> - **Vymazať:** Všetkých vzorových pacientov (Mária Kováčová P1, Ján Novák P2, Ján Mráz P3 ako pacient) a ich fiktívne záznamy (dekurzy, vstupné vyšetrenia, operačné protokoly, fotodokumentáciu, finančné profily a pooperačné plány).
> - **Vymazať:** Všetky vzorové termíny a udalosti v kalendári (vrátane starých seed udalostí).
> - **Vymazať:** Všetky vzorové Meicet analýzy, dermatologické vyšetrenia a generované demo skeny.
> - **Vymazať:** Fiktívne skladové zásoby, demo logy opiátovej knihy a vzorovú spotrebu materiálu.
> - **Ponechať:** Členov tímu SAY CLINIC (prihlasovacie kontá, roly, PINy, šifrované heslá v systéme) a lekárske šablóny (informované súhlasy, databázu MKCH, katalóg liekov na receptoch, typy výkonov a miestnosti).

---

## 1. Prehľad & Hlavný cieľ

Cieľom úpravy je uviesť operačný systém SAY CLINIC do **100% stavu pripravenosti na ostrú klinickú prevádzku (Clean Production State)**. Po vyčistení bude systém:
1. Otvárať čistú kartotéku s profesionálnym uvítacím stavom („Žiadni pacienti v kartotéke – kliknite na Pridať pacienta“).
2. Zobrazovať prázdny kalendár pripravený na reálne synchronizované termíny z Google Kalendára alebo manuálne plánovanie.
3. Poskytovať prázdny sklad a opiátovú knihu s nulovou spotrebou, pripravené na naskladnenie reálnych šarží a expirácií.
4. Zachovávať plnú funkcionalitu všetkých lekárskych šablón, kalkulácií, MKCH kódovníka a tímového prístupu lekárov, sestier a manažmentu.

---

## 2. Používateľská skúsenosť & Vizuálny dizajn prázdnych stavov (Empty States)

Po vyčistení dát sa v žiadnej sekcii nezobrazia chybové hlášky ani „rozbité“ tabuľky, ale elegantné klinické prázdne stavy v korporátnej identite SAY CLINIC (tmavá antracitová `#2C2A29`, zlatá `#C5A059`, teplé béžové pozadie `#FAF8F5`):

- **Kartotéka pacientov**:
  - Elegantný prázdny stav s ikonou zložky a tlačidlom `+ Nový pacient`.
  - Po kliknutí sa otvorí formulár na zadanie mena, rodného čísla, poisťovne a Google Drive priečinka.
- **Dnešný harmonogram a Kalendár**:
  - Hlásenie: *„Na dnes nie sú naplánované žiadne objednané výkony ani vyšetrenia.“*
  - Tlačidlo pre rýchle naplánovanie nového termínu alebo synchronizáciu s Google Workspace.
- **Sklad & Opiátová kniha**:
  - Kniha omamných a psychotropných látok (OPL) začína s čistým evidenčným stavom v zmysle zákona NR SR č. 139/1998 Z. z. bez fiktívnych zápisov.
  - Možnosť zaevidovať prvý riadny príjem z nemocničnej lekárne so šaržou, expiráciou a podpisom lekára.
- **Meicet Pro-A & Dermatológia**:
  - Odstránenie automaticky predvyplnených fiktívnych grafov a percentilov.
  - Zobrazenie prehľadnej zóny na nahratie reálneho PDF reportu z prístroja Meicet.

---

## 3. Kľúčové produktové a technické rozhodnutia

### Rozhodnutie 1: Centrálne vyčistenie synchronizačného súboru `clinic_data.json`
- **Prístup**: Odstránenie 100 000+ riadkov fiktívnych záznamov, starých seed finančných profilov a testovacích dekurzov priamo na serveri v `src/data/clinic_data.json`.
- **Dôvod**: Ak by sa vyčistil iba frontendový kód, serverový synchronizátor `/api/sync` a SSE by pri každom načítaní znovu „nanútili“ staré mock profily a pacientov do prehliadača.

### Rozhodnutie 2: Bezpečný reset lokálnej pamäte (localStorage Migration Guard)
- **Prístup**: Pridanie automatického čistiaceho mechanizmu pri prvom štarte verzie, ktorý vyčistí kľúče `say_clinic_patients`, `say_clinic_patient_records`, `say_clinic_client_financial_profiles_v1`, `say_clinic_material_usage_logs_v2`, `say_clinic_calendar_events` od záznamov obsahujúcich ID `P1`, `P2`, `P3`, `rec-1`, `seed-`, `demo-`.
- **Dôvod**: Prehliadače používateľov majú mock dáta uložené v cache. Bez tohto kroku by používateľ aj po nasadení nového kódu videl starých pacientov.

### Rozhodnutie 3: Ponechanie personálu a lekárskych šablón
- **Prístup**: `credentials.json` a `userService.ts` zostávajú kompletne neporušené so všetkými zamestnancami (MUDr. Ján Mráz, Ing. Barbara Mecerodová, Sabina Lenhartová, atď.).
- **Dôvod**: Tím sa musí vedieť okamžite prihlásiť heslom, PINom alebo cez Google Workspace bez nutnosti opätovného vytvárania účtov.

---

## 4. Architektúra a tok dát po vyčistení

```
┌─────────────────────────────────────────────────────────────┐
│                    SAY CLINIC OS ECOSYSTEM                  │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌──────────────────────────────┐    ┌──────────────────────────────┐
│      ZACHOVANÉ AKTÍVA        │    │      VYČISTENÉ OBLASTI       │
│  (Persisted Templates & Auth)│    │   (Cleaned Production Data)  │
├──────────────────────────────┤    ├──────────────────────────────┤
│ • Autentifikácia tímu        │    │ • Zoznam pacientov: []       │
│   (credentials.json)         │    │ • Dekurzy a protokoly: {}    │
│ • Šablóny súhlasov (chirurgia│    │ • Plány pacientov: {}        │
│ • Katalóg liekov a receptov  │    │ • Meicet reporty: {}         │
│ • Kódovník MKCH-10           │    │ • Udalosti kalendára: []     │
│ • Nastavenia miestností klin.│    │ • Opiátové zápisy: []        │
│ • Balíčky výkonov (definície)│    │ • Skladové zásoby: []        │
└──────────────────────────────┘    └──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   ČISTÝ SERVEROVÝ STAV                      │
│      clinic_data.json (resetovaný bez fiktívnych záznamov)  │
│      Firestore DB (vyčistené testovacie kolekcie)           │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Plán realizácie krok za krokom

1. **Vyčistenie dátových súborov a predvolených hodnôt**:
   - `src/components/PatientDatabase.tsx`: Nastavenie `MOCK_PATIENTS = []`, `INITIAL_DEMO_PLANS = {}`, predvolených `patientRecords = {}`, a `patientPhotos = {}`.
   - `src/app/page.tsx`: Nastavenie počiatočného stavu pacientov na prázdne pole `[]`.
   - `src/services/inventoryService.ts`: Reset `INITIAL_INVENTORY = []`, vyčistenie `INITIAL_OPIATE_LOGS = []`, vyčistenie `INITIAL_USAGE_LOGS = []`.
   - `src/data/cosmeticsCatalog.ts`: Vynulovanie skladových zásob fiktívnych produktov.
   - `src/data/clinic_data.json`: Vyčistenie kľúčov `patient_records`, `client_financial_profiles`, `patient_presence`, `patients` od mock dát.
2. **Čistenie klientskej pamäte (Client Cache Sanitizer)**:
   - Zavedenie jednorazového prečistenia kľúčov `localStorage` pri štarte, aby sa odstránili lokálne nacachované záznamy P1/P2/P3 a staré mock záznamy.
3. **Overenie funkčnosti a kompilácia**:
   - Overenie správneho zobrazenia všetkých modulov (Prehľad, Kartotéka, Kalendár, Sklad, Opiáty, POS, Financie) v prázdnom stave.
   - Spustenie `compile_applet` pre garanciu bezchybného buildu.
