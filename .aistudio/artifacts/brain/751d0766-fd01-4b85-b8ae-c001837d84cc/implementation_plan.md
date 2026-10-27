# Prispôsobenie Rýchlych Akcií na Prehľadovej Stránke (Per-User Quick Actions)

Komplexné riešenie umožňujúce každému prihlásenému pracovníkovi kliniky (lekár, sestra, manažér, recepcia, CEO) slobodne si zapínať, vypínať a usporiadať rýchle akcie na hlavnej nástenke podľa svojich denných priorít a oprávnení.

### Zhrnutie potvrdených rozhodnutí

- **Spôsob správy**: Tlačidlo nastavenia (ikona posuvníkov/ozubeného kolesa s popisom "Upraviť") priamo v hlavičke karty Rýchle akcie, ktoré otvorí čisté výberové modálne okno.
- **Možnosti prispôsobenia**: 
  - Zapínanie a vypínanie jednotlivých položiek.
  - Vlastné poradie položiek (šípky hore/dole a prehľadná zmena priority).
  - Rešpektovanie bezpečnostných rolí a oprávnení cez `PermissionsService`.
  - Tlačidlo pre obnovenie predvoleného stavu podľa roly používateľa.
- **Ukladanie preferencií**: Personalizované per-user ukladanie viazané na identitu používateľa (`currentUser.id`), zachované medzi prihláseniami.

---

### 1. Prehľad & Hlavný koncept

Karta **Rýchle Akcie** na hlavnej prehľadovej nástenke slúži ako okamžitá skratka k najčastejším pracovným tokom. Doteraz mala fixný zoznam položiek. Nové riešenie prinesie:
1. **Katalóg dostupných rýchlych akcií**:
   - *Kartotéka pacientov 360°* (`patients`)
   - *Zaevidovať nového pacienta* (`patients` + nová karta)
   - *Kalendár operačných sál* (`calendar`)
   - *Nový lekársky záznam / operačný protokol* (`generator`)
   - *Vystaviť recept Rp.* (`prescriptions`)
   - *Estetická mapa & aplikácia Botox/Výplne* (`aesthetics`)
   - *Pokladňa POS & pooperačná kozmetika* (`cosmetics`)
   - *Sklad materiálu & implantáty Motiva* (`inventory`)
   - *Finančný prehľad & fakturácia* (`finance`)
   - *Projekty & operatívne poverenia* (`projects`)
2. **Filtrovanie podľa oprávnení**: Zobrazujú sa len tie akcie, na ktoré má daná rola právo podľa matice kliniky.
3. **Personalizácia**: Každý používateľ (napr. MUDr. Mázik, sestra Anna, recepcia) vidí len to, čo skutočne potrebuje pre svoju prácu a v poradí, ktoré mu najviac vyhovuje.

---

### 2. Používateľský zážitok & Vizuálny dizajn (SAY CLINIC Luxury)

- **Hlavička karty Rýchle Akcie**:
  - Titulok "RÝCHLE AKCIE" doplnený o diskrétne tlačidlo "Prispôsobiť" s ikonou `SlidersHorizontal` / `Settings2` v zlatej farbe `#C5A059`.
  - Počet aktívnych akcií (napr. `5 aktívnych`).
- **Modálne okno "Prispôsobiť rýchle akcie"**:
  - Exkluzívny dizajn v štýle SAY CLINIC (biela/piesková `#FAF8F5`, zlaté akcenty `#C5A059`, antracitové písmo `#2C2A29`, jemné linky `#E8E2D9`).
  - Prehľadný zoznam s prepínačmi (Toggle switch) pre každú akciu.
  - Tlačidlá pre posun nahor a nadol na usporiadanie položiek podľa dôležitosti.
  - Vizuálne ikony ku každej akcii (`lucide-react`).
  - Pätka modálu s možnosťami: *Obnoviť predvolené pre moju rolu* a *Uložiť nastavenia*.
- **Prázdny stav (Empty state)**: Ak si používateľ vypne všetky akcie, karta zobrazí elegantnú výzvu s tlačidlom na zapnutie položiek.

---

### 3. Technická architektúra & Štruktúra údajov

```
┌─────────────────────────────────────────────────────────────┐
│                 src/app/page.tsx (Home)                    │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                 Karta Rýchle Akcie                  │   │
│   │  [ RÝCHLE AKCIE ] ──────── [ ⚙️ Prispôsobiť ]       │   │
│   │  ─────────────────────────────────────────────────  │   │
│   │  • Kartotéka pacientov 360°                         │   │
│   │  • Zaevidovať nového pacienta                       │   │
│   │  • Kalendár operačných sál                          │   │
│   │  • Nový recept Rp.                                  │   │
│   │  • ... (len povolené a aktivované položky)          │   │
│   └─────────────────────────────────────────────────────┘   │
│                              │                              │
│                              ▼ otvára                       │
│   ┌─────────────────────────────────────────────────────┐   │
│   │            QuickActionsCustomizeModal               │   │
│   │  - Zoznam dostupných akcií (overené cez canAccess)  │   │
│   │  - On/Off prepínače                                 │   │
│   │  - Šípky pre posun poradia                          │   │
│   │  - Uloženie do localStorage (per user ID)           │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Storage: `say_quick_actions_${currentUser.id}`              │
│ Array: [ { id: 'patients', enabled: true }, ... ]           │
└─────────────────────────────────────────────────────────────┘
```

#### Dátový model akcie:
```typescript
export interface QuickActionItem {
  id: string;
  tabId: TabId;
  label: string;
  sublabel?: string;
  iconName: string;
  badge?: string;
  actionType: 'tab' | 'new_patient';
  defaultEnabledRoles: RoleType[];
}
```

---

### 4. Plán realizácie krok za krokom

1. **Definícia katalógu rýchlych akcií** (`src/data/quickActionsCatalog.ts`):
   - Zoznam všetkých klinických a prevádzkových rýchlych akcií s priradením k tabom, ikonám a predvoleným rolám.
   - Pomocné funkcie pre načítanie a ukladanie preferencií používateľa (`getUserQuickActions`, `saveUserQuickActions`, `getDefaultQuickActionsForRole`).
2. **Vytvorenie komponentu modálneho okna** (`src/components/QuickActionsCustomizeModal.tsx`):
   - Štýlové modálne okno s prehľadnou správou poradia, prepínaním stavu, resetom na predvolené a ukladaním.
3. **Integrácia do prehľadovej nástenky** (`src/app/page.tsx`):
   - Náhrada statického zoznamu rýchlych akcií dynamickým vykresľovaním podľa personalizovaného zoznamu prihláseného používateľa.
   - Pridanie tlačidla na otvorenie modálu priamo do hlavičky karty Rýchle akcie.
   - Spracovanie preklikov na jednotlivé záložky a funkcie (vrátane priameho zaevidovania nového pacienta).
4. **Overenie & Testovanie**:
   - Otestovanie prepínania a ukladania pre rôznych používateľov.
   - Overenie filtrovania podľa rolí.
   - Kompilácia aplikácie cez `compile_applet`.
