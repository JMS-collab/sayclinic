# Implementačný plán: Trvalé ukladanie pacientov vo Firestore a Google Drive

Používateľ nahlásil, že pri úprave pacienta Ján Mráz na reálne údaje sa po aktualizácii systému hodnoty prepíšu späť na pôvodné fiktívne dáta. Dôvodom bolo ukladanie výlučne do `localStorage` s automatickým obnovovaním z hardkódovaného poľa `MOCK_PATIENTS`.

Tento plán rieši požiadavku používateľa:
1. **Trvalé ukladanie do Firebase Firestore** (databáza `ai-studio-sayclinic-751d0766-fd01-4b85-b8ae-c001837d84cc`)
2. **Synchronizácia s Google Drive** (zložky klientov a profilové metadáta)
3. **Aktualizácia a priorita reálnych údajov pre Jána Mráza**, aby sa už nikdy nevracali vymyslené hodnoty.

---

## 1. Architektúra ukladania a synchronizácie pacientov

### Nová služba `PatientCloudService` (`src/services/patientCloudService.ts`):
- **Firestore kolekcia `patients`:**
  - Každý pacient bude mať trvalý dokument `patients/{patientId}`.
  - Podpora pre funkcie: `subscribePatients(callback)`, `savePatient(patient, token?)`, `deletePatient(patientId)`, `syncAllWithDrive(patients, token)`.
  - Reálny čas: `onSnapshot` zabezpečí okamžitú obojstrannú synchronizáciu medzi lekárom, recepciou a mobilom.
- **Google Drive integrácia:**
  - Pri uložení alebo úprave pacienta sa overí/vytvorí klientsky priečinok na Google Drive v zložke `Klienti SAY`.
  - Do metadát priečinka alebo profilového súboru `profil_klienta.json` na Disku sa zaznamenajú aktuálne kontaktné a identifikačné údaje.

---

## 2. Odstránenie fiktívnych hodnôt a ochrana reálnych údajov

### Úprava `MOCK_PATIENTS` a inicializačnej logiky:
- V `src/components/PatientDatabase.tsx` a `src/app/page.tsx`:
  - Ak existuje záznam vo Firestore alebo v trvalom úložisku pre dané ID alebo meno, **nikdy ho neprepísať predvolenými mock dátami**.
  - Aktualizácia predvoleného profilu Jána Mráza na reálny stav lekára/riaditeľa kliniky (`MUDr. Ján Mráz`, `mraz@sayclinic.sk`), pričom akékoľvek reálne upravené údaje (telefón, adresa, rodné číslo) budú natrvalo uložené vo Firestore.
  - Odstránenie mechanizmu `missingDefaults`, ktorý pri akejkoľvek odchýlke mena opätovne vkladal pôvodného fiktívneho pacienta.

---

## 3. Prepojenie rozhrania Kartotéky (`PatientDatabase.tsx`)

- **Okamžité načítanie a realtime odpočúvanie:**
  - Pri otvorení Kartotéky sa okamžite pripojí `PatientCloudService.subscribePatients`.
  - Pri úprave cez formulár `handleSavePatientEdit` sa zmeny odošlú do Firestore aj do Google Drive na pozadí bez zdržania UI.
- **Vizuálny indikátor stavu synchronizácie:**
  - V hlavičke Kartotéky pridať diskrétny luxusný stav: `Firestore Cloud: Synchronizované` a stav spojenia s Google Drive.
  - Tlačidlo „Synchronizovať s Drive / Cloudom“ pre manuálne vynútenie prepisu a zálohy.

---

## 4. Overenie funkčnosti

1. Úprava pacienta Ján Mráz na reálne údaje v rozhraní Kartotéky.
2. Uloženie a overenie, že sa údaje zapísali do Firestore kolekcie `patients`.
3. Simulácia reštartu / obnovenia stránky a overenie, že sa načítajú nové reálne údaje a nevrátia sa vymyslené hodnoty.
4. Kompilácia aplikácie a kontrola nulových chýb v konzole.
