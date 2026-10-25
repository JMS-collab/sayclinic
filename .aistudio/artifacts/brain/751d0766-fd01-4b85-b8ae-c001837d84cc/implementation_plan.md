# Implementačný plán: Centralizácia personálu a chirurgického tímu do Firestore (Real-Time z celého systému)

Tento plán rieši požiadavku používateľa: **odstrániť akékoľvek ukladanie mien a personálu do `localStorage`** a zabezpečiť, aby každé pridané, upravené alebo zmazané meno v operačnom tíme (alebo personále kliniky) bolo **okamžite a trvalo synchronizované v celom systéme SAY CLINIC pre všetkých používateľov a všetky zariadenia** prostredníctvom centrálnej cloudovej databázy **Firebase Firestore**.

---

## 1. Používateľské rozhodnutia a potvrdenia (User Review)

- **Rozsah synchronizácie**: Chirurgický tím (operatér, asistent, anesteziológ, inštrumentárka, anestéziologická sestra) aj používateľské účty kliniky. *(Potvrdené používateľom)*
- **Spôsob synchronizácie**: Okamžitá živá synchronizácia cez Firestore poslucháč (`onSnapshot`). Akákoľvek zmena vykonaná lekárom alebo sestrou na jednom počítači sa behom zlomku sekundy premietne na všetkých ostatných otvorených počítačoch a tabletoch na klinike. *(Potvrdené používateľom)*
- **Vylúčenie localStorage**: Lokálne úložisko prehliadača sa pre personál prestane používať; primárnym a jediným zdrojom pravdy je cloudový Firestore dokument.

---

## 2. Navrhované zmeny (Proposed Changes)

### Krok 1: Vytvorenie centrálnej služby `src/services/staffService.ts`
Vytvorenie dedikovanej služby pre správu chirurgického tímu a personálu:
- Import `db` z `@/lib/firebase` (prepojenie na databázu `ai-studio-sayclinic-751d0766-fd01-4b85-b8ae-c001837d84cc`).
- Firestore dokument: `clinic_settings/surgical_team_presets`.
- Funkcia `subscribeSurgicalTeam(callback)`:
  - Využíva `onSnapshot(doc(db, 'clinic_settings', 'surgical_team_presets'), ...)`
  - Pri prvom načítaní, ak dokument ešte v cloude neexistuje, automaticky vykoná bezpečný seed s východzími menami kliniky (`DEFAULT_SURGICAL_TEAM_PRESETS`).
  - Pri akejkoľvek zmene odkiaľkoľvek zo siete okamžite upovedomí zaregistrované komponenty.
- Metódy na úpravu:
  - `saveSurgicalTeam(presets)`: Uloží do Firestore cez `setDoc(..., { merge: true })`.
  - `addMember(role, name)`: Pridá meno a synchronizuje do cloudu.
  - `editMember(role, index, newName)`: Premenuje existujúce meno priamo v cloude.
  - `deleteMember(role, index)`: Odstráni meno z cloudu.
  - `resetRoleToDefaults(role)`: Obnoví továrenský zoznam v cloude.
- Vytvorenie živého poslucháča aj pre `clinic_settings/users` pre prepojenie s používateľmi kliniky v `UserService`.

### Krok 2: Úprava `src/components/MedicalRecordForm.tsx`
- Odstránenie čítania a zápisu do `localStorage` (`say_clinic_surgical_team_presets_v1`).
- Napojenie na živý Firestore odber cez `StaffService.subscribeSurgicalTeam`:
  - Pri mountnutí sa komponent prihlási k odberu zmien.
  - Akonáhle ktokoľvek na klinike pridá alebo upraví meno operatéra, asistenta, anesteziológa, inštrumentárky alebo sestry, lokálny stav `teamPresets` sa automaticky zaktualizuje v reálnom čase.
- Tlačidlá `+ Pridať`, `Uložiť zmenu`, `Zmazať` a dialógové okno `Správa personálu` budú priamo volať asynchrónne metódy `StaffService`, ktoré zapisujú do Firestore.
- Zachovanie existujúcej štruktúry DOM prvkov pre tri CSS selektory Focus Mode.

### Krok 3: Úprava `src/services/userService.ts`
- Odstránenie závislosti na lokálnom úložisku prehliadača.
- Zabezpečenie, že používateľské účty a profily kliniky sú trvale čítané a zapisované do Firestore dokumentu `clinic_settings/users` a synchronizované v reálnom čase naprieč celou klinikou.

### Krok 4: Aktualizácia `firebase-blueprint.json` a `firestore.rules`
- Pridanie schémy pre `clinic_settings` do `firebase-blueprint.json`.
- Overenie, že pravidlá `firestore.rules` plne pokrývajú čítanie a zápis pre `clinic_settings/{settingId}`.

---

## 3. Plán overenia (Verification Plan)

### Automatizované testy:
1. Spustenie `compile_applet` na overenie bezchybnej kompilácie TypeScriptu a Next.js App Routera.
2. Spustenie `lint_applet` na kontrolu syntaxe a nepoužitých premenných.

### Manuálne overenie funkčnosti:
1. Otvoriť sekciu Lekárske správy / Operačný protokol (`MedicalRecordForm`).
2. Skontrolovať polia **Anesteziológ**, **Inštrumentárka** a **Anestéziologická sestra**.
3. Pridať nové meno personálu (napr. „MUDr. Juraj Kováč, PhD.“).
4. Skontrolovať, že požiadavka zapíše dáta do centrálneho Firestore.
5. Otvoriť aplikáciu v druhom okne / tabe alebo skontrolovať živý odber: novopridané meno sa musí okamžite objaviť v roletových menu bez obnovenia stránky a bez použitia `localStorage`.
6. Otestovať úpravu existujúceho mena: zmena sa musí okamžite prejaviť vo všetkých výberoch a v centrálnom Firestore.
