# Implementačný plán: Nastavenie jediného účtu say@sayclinic.sk

Používateľ požaduje nastaviť **say@sayclinic.sk** ako jediný účet na prihlásenie pre klinický systém, Google Drive a Google Kalendár (nahradením doterajšieho `mraz@sayclinic.sk`).

---

## 1. Analýza doterajšieho stavu
* V systéme vystupoval ako hlavný účet `mraz@sayclinic.sk` (MUDr. Ján Mráz / CEO).
* Google Drive a Kalendár boli viazané na individuálny účet `mraz@sayclinic.sk`.
* V prihlasovacom formulári (`LoginForm`) a zozname personálu bolo zobrazených viacero profilov alebo referencie na `mraz@sayclinic.sk`.
* Oprávnenia CEO a administrácie (`PermissionsService`, `page.tsx`, `ProjectManagement.tsx`) kontrolovali e-mail `mraz@sayclinic.sk`.

---

## 2. Navrhované zmeny

### Krok 1: Úprava prihlasovacieho profilu (`src/components/LoginForm.tsx`)
* Nastaviť **say@sayclinic.sk** ako jediný / hlavný profil pre ambulantný systém SAY CLINIC:
  * Názov: **SAY CLINIC** (alebo MUDr. Ján Mráz / SAY CLINIC tím)
  * E-mail: `say@sayclinic.sk`
  * Rola: `ceo` (plné oprávnenia na celú kliniku – operácie, dekurzy, kartotéka, financie, kalendár, sklady)
* V zozname používateľov ponechať ako primárny a predvolený účet `say@sayclinic.sk`.
* Zjednodušiť prihlasovaciu obrazovku na bleskový 1-klik / heslo / PIN pre `say@sayclinic.sk`.

### Krok 2: Prepojenie Google Workspace, Google Drive a Kalendára
* Nastaviť `say@sayclinic.sk` ako autorizovaný a primárny Google účet pre Google Drive a Google Kalendár.
* Aktualizovať predvolený Google login v `src/lib/workspaceAuth.ts` a `src/lib/auth.ts`, aby preferoval a prihlasoval `say@sayclinic.sk` (napr. `login_hint: 'say@sayclinic.sk'`).
* V hlavičke a na domovskej obrazovke zobrazovať prepojenie priamo na `say@sayclinic.sk`.

### Krok 3: Aktualizácia overovania oprávnení a hesiel
* V `src/services/permissionsService.ts`, `src/services/passkeyService.ts`, `src/services/authService.ts` a `src/app/page.tsx`:
  * Nahradiť kontrolu `mraz@sayclinic.sk` za `say@sayclinic.sk` (so zachovaním spätnej kompatibility).
  * V počiatočných heslách a povereniach inicializovať profil pre `say@sayclinic.sk` s predvoleným heslom kliniky (`SayClinic2026!`).

### Krok 4: Aktualizácia zobrazenia v kalendári a kartotéke
* Nastaviť `say@sayclinic.sk` ako predvolený kalendár pre synchronizáciu operačných sál a vyšetrení.
* Synchronizácia Google Drive zložky "Klienti SAY" pod účtom `say@sayclinic.sk`.

---

## 3. Overenie a testovanie
* Overiť, že prihlasovacia obrazovka ponúka `say@sayclinic.sk` a umožňuje okamžité prihlásenie.
* Overiť, že po prihlásení má používateľ plné práva CEO na všetky moduly kliniky.
* Overiť, že Google Drive a Kalendár smerujú na účet `say@sayclinic.sk`.
* Spustiť `compile_applet` a skontrolovať bezchybnosť kompilácie.
