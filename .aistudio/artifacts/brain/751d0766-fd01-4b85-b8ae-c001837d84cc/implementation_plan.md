# Vyčistenie fiktívnych a vzorových dát (Production Data Sanitization)

Kompletná očista ambulantného systému SAY CLINIC od fiktívnych pacientov, demo vyšetrení, vzorových termínov v kalendári a vymyslených skladových záznamov do stavu ostrého štartu (Zero-State), pri striktnom zachovaní tímových účtov a medicínskych šablón.

## User Review & Critical Decisions

> [!IMPORTANT]
> Na základe Vašich odpovedí v úvodnom dialógu sú kľúčové mantinely vyčistenia určené nasledovne:

- **Potvrdené na vymazanie**:
  - **Vz釐oroví pacienti a fiktívne dekurzy**: Odstránenie mock pacientov (`Mária Kováčová`, `Ján Novák` atď.), ich zdravotných záznamov, liečebných plánov a fotodokumentácie.
  - **Termíny a kalendár**: Vymazanie akýchkoľvek predvyplnených demo termínov, operácií a kontrol.
  - **Meicet & Dermatológia**: Odstránenie demo skenov pleti a testovacích dermatologických nálezov.
  - **Sklad & Opiátová kniha**: Vyčistenie fiktívnych zápisov o spotrebe materiálu a demo výdajov omamných látok.
- **Potvrdené na zachovanie**:
  - **Tím kliniky SAY CLINIC**: Zachovanie všetkých autentifikačných profilov (MUDr. Ján Mráz, manažment, lekári a sestry) a ich oprávnení v systéme.
  - **Medicínske šablóny & Číselníky**: Zachovanie vzorov informovaných súhlasov, operačných postupov, receptového kalibrátora a materiálových balíčkov.
- **Rozsah prečistenia úložísk**:
  - Prečistenie predvolených dát v zdrojovom kóde aplikácie, lokálnej cache prehliadača (`localStorage`) a synchronizácia s databázou Firestore.

---

## 1. Overview & Core Concept

- **Čo táto zmena prinesie**: Ambulantný systém prejde z demonštračného režimu do čistého, bezpečného produkčného stavu. Databáza pacientov, harmonogram dňa, skladové knihy a diagnostika budú pripravené na zadávanie skutočných údajov reálnych klientov kliniky.
- **Cieľová skupina**: Primár a zakladateľ (MUDr. Ján Mráz), lekári, operačné sestry a manažment kliniky SAY CLINIC.
- **Kľúčová hodnota**: Odstránenie rizika zámeny testovacích dát so skutočnými zdravotnými záznamami a čistá evidencia v súlade s GDPR a požiadavkami na zdravotnícku dokumentáciu.

---

## 2. User Experience & Visual Design

### Key User Flows (Zero-State zážitok)
1. **Kartotéka 360°**:
   - Namiesto zoznamu testovacích mien sa zobrazí čistý, luxusný nulový stav: *"Kartotéka je pripravená na evidenciu prvého pacienta"* s prominentným tlačidlom pre zaevidovanie nového pacienta.
   - Vyhľadávací riadok a filtre zostávajú okamžite responzívne.
2. **Dnešný harmonogram a kalendár**:
   - V harmonograme na prehľade sa zobrazí kultivovaný prázdny stav pre vybrané miestnosti: *"Na dnešný deň nie sú naplánované žiadne zákroky"* s rýchlou akciou na pridanie termínu.
   - Časová os a prepínanie miestností (Ambulancia, Operačky SAY, Rudlová, Dospávanie) zostávajú 100% funkčné.
3. **Meicet diagnostika pleti**:
   - Čisté rozhranie pripravené na priame nahratie alebo import skutočného Meicet reportu z prístroja.
4. **Sklad & Kniha OPL (Opiáty)**:
   - Úradná kniha OPL bude pripravená na prvý oficiálny príjem liečiv z lekárne na žiadanku, bez fiktívnych záznamov o spotrebe.

### Vizuálna identita a štýl
- **Farebná paleta**: Jemné podkladové tóny slonovej kosti (`#FBF9F6`), čistá biela (`#FFFFFF`), teplé zlaté akcenty (`#C5A059`) a luxusná antracitová (`#2C2A29`).
- **Typografia**: Serifové titulky fontu kliniky, ostré bezserifové texty a tabular-nums pre všetky časové a číselné údaje.
- **Dizajnová disciplína**: Žiadne preplnené grafické prvky; precízne prázdne stavy s jasnou výzvou na akciu (Call to Action).

---

## 3. Key Product Decisions & Trade-Offs

- **Rozhodnutie 1: Zachovanie štruktúry dátových typov a rozhraní**
  - *Zvolený prístup*: Ponechať všetky TypeScript rozhrania, validačné pravidlá a štruktúry polí nedotknuté, len inicializovať polia na prázdne zoznamy `[]`.
  - *Dôvod*: Garantuje 100% stabilitu kódu, TypeScript kompiláciu a nulový výskyt chýb `undefined`.
- **Rozhodnutie 2: Vypnutie automatického opätovného seedovania**
  - *Zvolený prístup*: V `PatientCloudService.seedIfEmpty` a v kalendárových službách deaktivovať opätovné nahrávanie demo pacientov do Firestore.
  - *Dôvod*: Ak by sa prázdna databáza opakovane zaplnila demo dátami, vyčistenie by nebolo trvalé.
- **Rozhodnutie 3: Bezpečný prechod používateľských účtov a hesiel**
  - *Zvolený prístup*: Účty personálu v `credentials.json` a `clinic_data.json` zostávajú zachované, vrátane PIN staníc a prístupov.
  - *Dôvod*: Používateľ mraz@sayclinic.sk aj personál sa musia bez prerušenia vedieť prihlásiť a pracovať.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                   SAY CLINIC - ARCHITEKTÚRA PO VYČISTENÍ               │
└────────────────────────────────────────────────────────────────────────┘

  [ Užívateľské rozhranie ]
       │
       ├─► Kartotéka 360°      ──► Zoznam pacientov: [] (Čistý Zero-State)
       ├─► Kalendár & Prehľad  ──► Termíny: [] (Aktuálny časový indikátor aktívny)
       ├─► Diagnostika Meicet   ──► Reporty: [] (Pripravené na skutočné skeny)
       ├─► Kniha OPL & Sklad   ──► Pohyby: [] (Čistá úradná evidencia)
       └─► Tím & Autentifikácia ──► Reálny personál SAY CLINIC (Zachovaný)
       │
  [ Lokálna Cache & State ]
       │
       ├─► localStorage: 'say_clinic_patients' ──► []
       ├─► localStorage: 'say_clinic_calendar_events' ──► []
       ├─► localStorage: 'say_clinic_meicet_reports' ──► []
       └─► localStorage: 'say_clinic_opiate_logs' ──► []
       │
  [ Cloud Perzistencia ]
       │
       └─► Google Firestore DB: ai-studio-sayclinic-751d0766-fd01-4b85-b8ae-c001837d84cc
            ├─► Kolekcia 'patients': Vyčistená od mock ID (P1, P2, P3)
            ├─► Kolekcia 'calendar_events': Bez demo seedov
            └─► Kolekcia 'users': Aktívne účty personálu kliniky
```

### Plán implementačných krokov
1. **Vyčistenie dátových súborov a predvolených konštánt**:
   - `src/components/PatientDatabase.tsx`: `MOCK_PATIENTS = []`, `INITIAL_DEMO_PLANS = {}`.
   - `src/services/patientCloudService.ts`: Zamedzenie opätovnému nahratiu mock pacientov v `seedIfEmpty`.
   - `src/data/meicetDemoData.ts`: Vyprázdnenie `DEMO_MEICET_REPORTS = []`.
   - `src/services/inventoryService.ts`: Vyprázdnenie `INITIAL_USAGE_LOGS = []` a `INITIAL_OPIATE_LOGS = []`.
2. **Očista lokálnej vyrovnávacej pamäte a synchronizačného mechanizmu**:
   - Skript pre jednorazové bezpečné zmazanie kešovaných mock záznamov zo session a `localStorage` pri štarte, aby prehliadač nezobrazoval staré lokálne dáta.
3. **Kompilácia a overenie integrity**:
   - Overenie TypeScript typov a úspešná kompilácia cez `compile_applet`.
