# Implementačný plán: Bezpečné cloudové ukladanie vstupných vyšetrení a dokumentov (Cloud Firestore & Google Drive)

Úplná eliminácia závislosti na lokálnom úložisku prehliadača (`localStorage`). Všetky zdravotné záznamy, vstupné vyšetrenia, dekurzy a dokumenty pacientov sa budú bezpečne a natrvalo ukladať v **Cloude** (Cloud Firestore databáza) a ako dokumenty v **Google Drive** v zložke daného pacienta.

---

### Používateľské rozhodnutie (Zadanie používateľa)

> [!IMPORTANT]
> **Kritická požiadavka:** *„Nič by nemalo byť local storage. Všetko by malo byť bezpečne ukladané na cloude.“*
> 
> - **Žiadne citlivé zdravotné dáta v prehliadači**: `localStorage` nebude slúžiť ako primárne úložisko pre zdravotnú dokumentáciu.
> - **Dvojitá cloudová perzistencia**:
>   1. **Cloud Firestore Databáza**: Uloženie štruktúrovaných klinických dát (diagnózy, text dekurzu, lekár, dátum, väzba na pacienta).
>   2. **Google Drive Workspace**: Uloženie reálneho dokumentu / A4 PDF súboru priamo do priečinka pacienta v Google Drive (`Klienti SAY / [Meno pacienta] / Dokumentácia`).

---

### 1. Architektúra bezpečného cloudového ukladania

```
┌────────────────────────────────────────────────────────────────────────┐
│             GENERÁTOR SPRÁV (MedicalRecordForm.tsx)                    │
│                                                                        │
│  [Lekár vyplní Vstupné vyšetrenie / anamnézu / nález / plán]           │
│                                                                        │
│  Klik na [💾 Bezpečne uložiť do Cloudu]                                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 CENTRALIZOVANÁ CLOUDOVÁ SLUŽBA                         │
│                  (src/services/cloudRecordService.ts)                  │
├───────────────────────────────────┬────────────────────────────────────┤
│                                   │                                    │
│  [1. CLOUD FIRESTORE DATABÁZA]    │  [2. GOOGLE DRIVE SÚBORY]          │
│  • Kolekcia: medical_records      │  • Endpoint: /api/drive/upload     │
│  • ID pacienta (patientId)        │  • Zložka pacienta: "Dokumentácia" │
│  • Typ: Vstupné vyšetrenie        │  • Súbor: 2026-10-12_Vstupne.pdf   │
│  • Diagnóza MKCH & Lekár          │  • Uložený driveFileId & WebLink   │
│  • Kompletný klinický dekurz      │                                    │
│  • Časová pečiatka & Audit log    │                                    │
└───────────────────────────────────┴────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   KARTA PACIENTA (PatientDatabase.tsx)                 │
│                                                                        │
│  ✓ Vstupné vyšetrenie sa načítava priamo z Cloudu                      │
│  ✓ Okamžitý prístup k PDF na Google Drive aj z iných počítačov         │
│  ✓ Real-time synchronizácia naprieč všetkými stanicami kliniky        │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 2. Navrhované zmeny v jednotlivých moduloch

#### A. Centralizovaná služba pre cloudové záznamy (`src/services/cloudRecordService.ts`)
- Vytvorenie novej robustnej služby, ktorá prepojí Firestore a Google Drive:
  1. `saveRecordToCloud(patientId: string, recordData: NewRecordPayload, pdfBlob?: Blob)`:
     - Uloží štruktúrovaný záznam do Cloud Firestore (kolekcia `medical_records` a subkolekcia pacienta).
     - Ak je k dispozícii A4 PDF alebo text dokumentu, cez `/api/drive/upload` ho nahraje priamo do priečinka pacienta na Google Drive (priečinok *Dokumentácia*).
     - Spojí ID súboru z Google Drive (`driveFileId`, `webViewLink`) s klinickým záznamom.
     - Vytvorí bezpečnostný auditný záznam (GDPR Audit Log).
  2. `getPatientRecordsFromCloud(patientId: string)`:
     - Načíta všetky dekurzy a vyšetrenia pacienta z Cloudu.
  3. `migrateLocalStorageToCloud()`:
     - Automaticky skontroluje, či v prehliadači neostali nejaké staré lokálne záznamy, bezpečne ich prenesie do Cloud databázy a vyčistí z prehliadača.

#### B. Serverový endpoint pre nahrávanie do Google Drive (`src/app/api/drive/upload/route.ts`)
- Vytvorenie endpointu pre bezpečný upload vygenerovaných správ do Google Disku:
  - Prijíma súbor (PDF alebo text) a `patientFolderName` / `folderId`.
  - Vyhľadá alebo vytvorí priečinok *Dokumentácia* v zložke pacienta.
  - Uloží súbor pomocou Google Drive v3 API cez serverový token.
  - Vráti `fileId` a `webViewLink` pre okamžité zobrazenie v karte.

#### C. Úprava formulára vyšetrení (`src/components/MedicalRecordForm.tsx`)
- V metóde `handleSubmit`:
  - Nahradiť pôvodné volanie `HealthProService` a lokálne callbacky priamym volaním `CloudRecordService.saveRecordToCloud(...)`.
  - Vygenerovať PDF nález priamo pri uložení a nahrať ho do Google Drive.
  - Zobraziť lekárovi stav:
    - *„✓ Vstupné vyšetrenie bolo bezpečne uložené do Cloud databázy aj do Google Disku pacienta.“*
    - Tlačidlo `[📁 Otvoriť kartu pacienta a zobraziť vyšetrenie]` pre okamžitý prechod.

#### D. Úprava Kartotéky (`src/components/PatientDatabase.tsx`)
- Načítavať záznamy `patientRecords` primárne z Cloud Firestore pomocou `CloudRecordService.getPatientRecordsFromCloud(selectedPatient.id)`.
- Pri otvorení pacienta okamžite zobraziť cloudové vyšetrenia vrátane indikátora:
  - `☁️ Uložené v Cloude & Google Drive`
- Možnosť jedným klikom otvoriť originál na Google Disku alebo stiahnuť PDF.

---

### 3. Bezpečnosť dát a súlad s GDPR

- **End-to-End bezpečnosť**:
  - Zdravotná dokumentácia je uložená v zabezpečenom cloudovom projekte kliniky (`gen-lang-client-0531919271`) s riadeným prístupom na základe rolí (CEO, lekár, sestra).
  - Žiadne citlivé zdravotné karty nezostávajú natrvalo na disku lokálneho počítača ambulancie.
- **Auditovateľnosť**:
  - Každé vytvorenie, úprava alebo náhľad vyšetrenia zapíše záznam do `audit_logs` (kto, kedy a aké vyšetrenie vytvoril).

---

### 4. Overenie a testovací plán

1. **Uloženie vstupného vyšetrenia**:
   - Vytvoriť vstupné vyšetrenie pre pacienta.
   - Overiť odoslanie do Cloud Firestore a upload do priečinka na Google Drive.
2. **Nezávislosť od prehliadača**:
   - Otvoriť systém v anonymnom okne / inom prehliadači (bez prístupu k predchádzajúcemu `localStorage`).
   - Overiť, že vstupné vyšetrenie sa načíta v plnom rozsahu priamo z Cloudu.
3. **Google Drive overenie**:
   - Skontrolovať, že v zložke pacienta na Google Disku pribudol PDF súbor s vyšetrením.
4. **Kompilácia**:
   - Overiť `compile_applet` bez chýb.
