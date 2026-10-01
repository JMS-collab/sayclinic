# Implementačný plán: Správa oprávnení & Profilov tímu (CEO + Manažment) a Genmoji avatary

Tento plán špecifikuje rozšírenie správy oprávnení a rolí pre **CEO a Manažment**, integrované pridávanie a úpravu profilov personálu priamo v okne oprávnení, zavedenie samostatnej roly **Recepčná** pre Viktóriu s prístupom do kartotéky a kalendára, a aktualizáciu štýlových Genmoji avatarov pre Viktóriu, Emu a anesteziológa.

---

## Používateľské rozhodnutia & Potvrdené preferencie

> [!IMPORTANT]
> Na základe Vašich priamych odpovedí boli schválené tieto kľúčové riešenia:

1. **Prístup k oprávneniam a správe profilov výhradne pre CEO a Manažment**:
   - Tlačidlo a správa oprávnení v hornej lište je prístupná pre roly `ceo` a `manager`.
   - CEO a manažment môžu meniť maticu oprávnení, simulovať pohľady a priamo spravovať personál.
2. **Zlúčenie správy profilov do existujúceho okna Pravomoci a role**:
   - V okne oprávnení pribudne plnohodnotná záložka pre **Správu personálu a profilov**.
   - Možnosť pridávať nových zamestnancov, upravovať mená, funkcie, emaily, role a avatary.
3. **Nová samostatná rola „Recepčná“**:
   - Vytvorenie roly `receptionist` v systéme oprávnení.
   - Predvolený prístup: `home` (Prehľad), `patients` (Kartotéka) a `calendar` (Kalendár). Bez prístupu k P&L, financiám a správe systému.
   - Viktória Foltániová bude priradená ako Recepčná.
4. **Vizuálny štýl avatarov – Genmoji**:
   - Zachovanie existujúceho 3D Genmoji/Memoji štýlu:
     - **Viktória (Recepčná)**: 3D Genmoji tvár s dlhými čiernymi vlasmi a modernými okuliarmi.
     - **Ema (Zdravotná sestra)**: 3D Genmoji tvár s čiernymi vlasmi a v zdravotníckom odeve.
     - **Anesteziológ**: 3D Genmoji tvár bieleho Európana s krátkymi vlasmi v anesteziologickom odeve.

---

## 1. Prehľad & Hlavný koncept

- **Cieľ**: Dať vedeniu kliniky (CEO MUDr. Ján Mráz a Manažment Ing. Barbara Mecerodová) plnú autonómiu pri správe prístupových práv, tvorbe tímových účtov a úprave osobných údajov personálu bez nutnosti zásahu programátora.
- **Rola Recepčná**: Recepcia potrebuje okamžitý prehľad o prichádzajúcich klientoch (Kartotéka) a objednávaní termínov na konzultácie a operácie (Kalendár), pričom medicínske protokoly či interné financie zostávajú chránené.

---

## 2. Používateľská skúsenosť & Vizuálny dizajn (Frontend Design)

### Používateľský tok pre CEO a Manažéra
1. **Otvorenie správy z hlavičky**:
   - Pri prihlásenom CEO alebo manažérovi svieti v hlavičke ikona `🛡️ Oprávnenia & Tím`.
2. **Okno „Oprávnenia & Personál SAY CLINIC“**:
   - Záložka 1: **Matica oprávnení** (nastavenie záložiek pre CEO, Lekár, Manažér, Sestra, Recepčná).
   - Záložka 2: **Členovia tímu & Profily** (karty zamestnancov s ich Genmoji avatarom, rolou, emailom a tlačidlami *Upraviť* a *Pridať člena tímu*).
   - Záložka 3: **Testovanie rolí (Simulácia)** (okamžitý náhľad, ako systém vidí lekár, sestra či recepčná).
3. **Formulár úpravy profilu**:
   - Editácia celého mena a titulu.
   - Zmena roly (CEO, Lekár, Manažment, Sestra, Recepčná).
   - Výber / zmena Genmoji avatara alebo nahratie vlastnej fotografie.
   - Nastavenie prihlasovacieho emailu.

---

## 3. Produktové a technické rozhodnutia

- **Rozšírenie `RoleType`**:
  - `export type RoleType = 'ceo' | 'doctor' | 'manager' | 'nurse' | 'receptionist';`
  - V `permissionsService.ts` definovaná predvolená konfigurácia pre `receptionist`:
    - `allowedTabs: ['home', 'patients', 'calendar']`
    - `specialPermissions`: všetky na `false`.
- **Perzistencia profilov**:
  - Tímové profily sa ukladajú v `say_clinic_custom_users_v1` a inicializujú zo `SAY_CLINIC_USERS`.
  - Zmeny v profile (meno, rola, avatar) sa okamžite prejavia v celom systéme (hlavička, autor zápisov, prihlasovanie).
- **Vizuálne Genmoji aktíva**:
  - Vygenerovanie a nastavenie precíznych 3D Genmoji portrétov:
    - `/public/avatars/foltaniova.jpg` – Viktória: čierne dlhé vlasy, štýlové okuliare, úsmev, recepcia.
    - `/public/avatars/foltani.jpg` – Ema: čierne vlasy, zdravotnícka halena.
    - `/public/avatars/anesteziolog.jpg` – Anesteziológ: biely európan, krátke vlasy, OAIM úbor.

---

## 4. Technická architektúra & Dátová stratégia

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Hlavička Aplikácie (Header)                     │
│    (Viditeľné pre currentUser.role === 'ceo' || 'manager')             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Otvorenie modalu
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    RolePermissionsModal.tsx                            │
│  ┌───────────────────────┬──────────────────────┬───────────────────┐  │
│  │ 1. Matica oprávnení   │ 2. Profily tímu (NEW)│ 3. Simulácia rolí │  │
│  │  (CEO/Dr/Mgr/Sestra/  │  - Pridať člena      │  (Testovanie      │  │
│  │   Recepčná)           │  - Upraviť profil    │   pohľadov)       │  │
│  │                       │  - Zmena Genmoji     │                   │  │
│  └───────────────────────┴──────────────────────┴───────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Ukladanie zmien
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  - PermissionsService (say_clinic_role_permissions_v1)                 │
│  - AuthService & UserService (say_clinic_custom_users_v1)             │
│  - LiquidAvatar (MEMOJI_MAP s novými Genmoji portrétmi)                │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Kroky realizácie po schválení

1. **Doplnenie Genmoji obrázkov**:
   - Vytvorenie a umiestnenie 3D Genmoji avatarov pre Viktóriu (čierne dlhé vlasy a okuliare), Emu (čierne vlasy) a Anesteziológa (biely európan, krátke vlasy) do `/public/avatars/`.
2. **Aktualizácia `permissionsService.ts`**:
   - Pridanie roly `receptionist` do typov a matice predvolených oprávnení (`['home', 'patients', 'calendar']`).
3. **Rozšírenie `RolePermissionsModal.tsx`**:
   - Prístupnosť pre `isRealCeo || currentUser.role === 'manager'`.
   - Implementácia interaktívnej záložky **Profily tímu** s možnosťou úpravy mena, titulu, roly, emailu a pridania nového člena.
4. **Prepojenie v `page.tsx` a `LoginForm.tsx`**:
   - Zobrazenie tlačidla Oprávnenia aj pre manažéra.
   - Aktualizácia predvoleného profilu Viktórie na rolu Recepčná.
5. **Verifikácia a testovanie**:
   - Preverenie prepínania rolí, ukladania profilov a zobrazenia avatarov bez chýb kompilácie.
