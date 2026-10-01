# Zdravotnícky štandard 2FA: Klinický PIN viazaný na autorizovaný počítač + Audit Log

Bezpečnostný koncept dvojfaktorového overenia (2FA) navrhnutý v súlade s medicínskymi štandardmi ochrany osobných a zdravotných údajov pacientov (GDPR a zákon o zdravotnej starostlivosti). Spája vysokú bezpečnosť s plynulou prácou lekára v ambulancii bez nutnosti vyťahovať telefón či prepisovať 6-ciferné kódy.

## Používateľské rozhodnutia a potvrdené voľby

> [!IMPORTANT]
> **Splnenie zdravotníckeho štandardu 2FA (Znalosť + Držba autorizovaného hardvéru):**
> 1. **Faktor znalosti (Something you know)**: Silné prístupové heslo + osobný 4-miestny klinický PIN.
> 2. **Faktor držby (Something you have)**: Fyzicky overený a autorizovaný počítač ambulancie kliniky (viazaný kryptografickým tokenom zariadenia).

- **Potvrdená forma overenia**: Rýchly 4-miestny osobný PIN viazaný výhradne na autorizovaný počítač ambulancie.
- **Autorizácia nového počítača**: Nové zariadenie vyžaduje zadanie hesla + PINu na autorizáciu pracoviska; po autorizácii zostáva stanica overená na 30 dní.
- **Striktný klinický audit log**: Každá autorizácia nového počítača, úspešné prihlásenie, zlyhanie a pokus o zadanie PINu sú nezmazateľne zaznamenané s identifikáciou stanice a používateľa.

---

## 1. Analýza bezpečnosti pre zdravotnícky systém

| Bezpečnostný aspekt | Bežné riešenia (SMS / Mobil) | Riešenie SAY CLINIC (Viazaný PIN + Hardvér stanice) | Zdravotnícky štandard |
| :--- | :--- | :--- | :--- |
| **Rýchlosť pri pacientovi** | Pomalé (lekár hľadá mobil, čaká na SMS/kód) | **Okamžité (2 sekundy)** na klávesnici | Spĺňa komfort ostrej prevádzky |
| **Ochrana pred vzdialeným útokom** | Útočník potrebuje získať mobil | **Útočník sa nedostane bez fyzického prístupu k autorizovanému PC kliniky** | Maximálna ochrana pred online útokom |
| **Auditovateľnosť (Kto a kde)** | Často bez identifikácie stanice | **Záznam konkrétneho počítača a ambulancie v AuditLogu** | 100% súlad s GDPR a auditom |
| **Ochrana pred odpozorovaním** | Žiadna | **Maska bodkami + lockout po 5 pokusoch na 5 minút** | Zamedzenie shoulder-surfingu |

---

## 2. Používateľský workflow lekára a sestry

1. **Bežná práca na autorizovanom počítači v ambulancii**:
   - Lekár klikne na svoj profil, zadá heslo a okamžite pracuje. Zariadenie je overené ako dôveryhodné pracovisko SAY CLINIC.
2. **Prvé prihlásenie na novom počítači / notebooku**:
   - Lekár zadá heslo. Systém identifikuje neznáme zariadenie a vyzve na autorizáciu stanice osobným 4-miestnym PINom.
   - Po zadaní PINu sa do pamäte stanice zapíše kryptografický kľúč autorizovaného pracoviska kliniky s platnosťou 30 dní.
   - Do klinického audit logu sa zapíše udalosť: *„MUDr. Ján Mráz autorizoval nové pracovisko (Názov stanice) pomocou klinického PINu.“*
3. **Možnosť okamžitého odvolania autorizácie**:
   - Ak personál stratí notebook alebo končí zmena na dočasnom počítači, v profile jedným klikom zruší autorizáciu daného zariadenia.

---

## 3. Technická architektúra a synchronizácia

```
┌────────────────────────────────────────────────────────────────────────┐
│                          LoginForm (Klient)                            │
│                                                                        │
│  1. Zadanie hesla                                                      │
│       │                                                                │
│       ▼                                                                │
│  Má prehliadač platný autorizačný token stanice kliniky?               │
│  ├── ÁNO (autorizovaný PC ambulancie) ──> Okamžitý vstup do systému    │
│  └── NIE (neznámy počítač) ────────────> 2. Zadanie 4-miestneho PINu   │
│                                                   │                    │
│                                                   ▼                    │
│                                   Overenie PIN voči serveru            │
│                                   + Vygenerovanie viazaného tokenu PC  │
│                                   + Zápis do klinického AuditLogu      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│             Centrálny server (/api/auth/credentials)                   │
│                                                                        │
│  - Perzistentné ukladanie hesiel a osobných PINov v hashovanej podobe  │
│  - Zoznam autorizovaných zariadení a ich platnosti                    │
│  - Okamžitá synchronizácia naprieč všetkými počítačmi kliniky          │
└────────────────────────────────────────────────────────────────────────┘
```

- **Hashovanie PINu**: PIN sa neukladá ako čistý text, ale v hashovanej podobe.
- **Bezpečný identifikátor stanice**: Unikátny 128-bitový token viazaný na konkrétny prehliadač s expiráciou a kontrolou integrity.
- **Ochrana proti hádaniu**: Po 5 neúspešných pokusoch o zadanie hesla alebo PINu systém zablokuje vstup na 5 minút a zaloguje bezpečnostný incident.

---

## 4. Konkrétne kroky realizácie

1. **Rozšírenie serverového úložiska (`/api/auth/credentials`)**:
   - Podpora pre ukladanie `pinHash` a správu autorizovaných staníc.
2. **Rozšírenie `authService.ts` a `auditLogService.ts`**:
   - Metódy na overenie PINu, generovanie a validáciu tokenu stanice kliniky a striktné logovanie autorizácie.
3. **Rozhranie zadania PINu v `LoginForm.tsx`**:
   - 4-miestny diskrétny PIN komponent s automatickým posunom kurzora, možnosťou pomenovať stanicu (napr. *Ambulancia 1*) a prepínačom zapamätania na 30 dní.
4. **Správa autorizovaných zariadení a zmena PINu v profile (`page.tsx`)**:
   - Možnosť kedykoľvek zmeniť svoj 4-miestny PIN a zobraziť zoznam autorizovaných staníc s možnosťou ich odhlásenia.
5. **Overenie buildu**:
   - Spustenie `compile_applet` pre overenie bezchybnej kompilácie.
