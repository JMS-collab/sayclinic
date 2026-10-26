# Revidovaný implementačný plán: Inteligentný odpis spotreby sestrou v karte pacienta

Na základe Vašich odpovedí tento plán definuje najlogickejší a najefektívnejší klinický workflow pre SAY CLINIC:
1. **Lekár v operačnom protokole** sa sústredí výlučne na medicínsky výkon, postup a nález. Zdĺhavá evidencia šijacieho materiálu a skladový odpis sa z protokolu odstráni.
2. **Sestra má priamy prístup k odpisu** priamo v hlavičke otvoreného pacienta cez tlačidlo **`📦 Odpis spotreby (Sestra)`**.
3. **Systém automaticky predvyberie balíček spotreby** podľa operácie, ktorú pacient podstúpil (napr. *Augmentácia*, *Blefaroplastika*, *Karpálny tunel*, *Abdominoplastika*, *Facelift*, *Liposukcia*). Sestra nemusí nič hľadať – balíček je pripravený na 1 kliknutie, s možnosťou úpravy alebo manuálneho doplnenia kedykoľvek.

---

## 1. Používateľské rozhodnutia (User Review)

- **Umiestnenie akcie**: Priamo v karte otvoreného pacienta v rýchlej akčnej lište cez dedikované tlačidlo **`📦 Odpis spotreby (Sestra)`**. *(Potvrdené používateľom)*
- **Inteligentný výber balíčka**: Systém automaticky načíta plánovanú alebo realizovanú operáciu pacienta a **automaticky predvolí správny balíček spotreby**. *(Potvrdené používateľom)*
- **Časovanie**: Sestra môže balíček alebo manuálne položky nahodiť kedykoľvek (pred, počas aj dodatočne po výkone). *(Potvrdené používateľom)*
- **Odľahčenie operačného protokolu lekára**: Z formulára protokolu sa odstráni manuálny textový rozpis stehov a skladový dropdown; nahradí sa elegantnou informačnou lištou s priamym preklikom na odpis pre sestru.

---

## 2. Navrhované zmeny (Proposed Changes)

### Krok 1: Rozšírenie balíčkov spotreby a inteligentného priradenia v `src/services/inventoryService.ts`
- Zadefinovanie komplexných balíčkov pre kľúčové výkony kliniky:
  - **Augmentácia prsníkov**: Marcaine, PDS 4-0, Monocryl 4-0, Glycolon 4-0, Surgicel, Redon CH10 2x, Kompresívna podprsenka PI ideal, Stabilizačný pás
  - **Blefaroplastika (viečka)**: Citanest, Adrenalín, Prolene 5-0, Steri-strip, Chladivé gélové krytie
  - **Syndróm karpálneho tunela**: Lokálne anestetikum, Monocryl 4-0 / Prolene 5-0, Sterilné krytie, Elastický obväz
  - **Abdominoplastika**: Marcaine, PDS 4-0, Monocryl 4-0, Redon drény CH10 2x, Kompresívny brušný pás VH special, Krytie
  - **SMAS Facelift & Neck-lift**: Marcaine, PDS 4-0, Monocryl 4-0, Floseal hemostatikum, Redon drény 2x, Kompresná tvárová maska FM
  - **Liposukcia**: Tumescenčný roztok, Kanyla, Kompresívna bielizeň (nohavice/pás), Absorpčné krytie
  - **Ambulantný zákrok & Preväz**: Dermacyn roztok, Mepore náplasť, Steri-strip
- Pomocná funkcia `InventoryService.suggestBundleForProcedure(procedureName: string): MaterialBundle | null`:
  - Automaticky spáruje názov operácie pacienta s príslušným balíčkom spotreby (rozpozná kľúčové slová napr. *augment*, *implant*, *blef*, *viečk*, *karpál*, *abdo*, *brucho*, *facelift*, *lipo*).
- Metóda `InventoryService.applyBundle(...)`:
  - Hromadný odpis položiek balíčka s overením skladových zásob a zápisom do histórie pacienta (`MaterialUsageLog`).

### Krok 2: Odstránenie materiálovej sekcie z operačného protokolu lekára v `src/components/MedicalRecordForm.tsx`
- V sekcii `div:nth-of-type(4) > div:nth-of-type(3)` (Použitý šijací materiál, hemostatiká, drény a krytie + skladový odpis):
  - Odstrániť ručné zadávanie stehov a manuálny skladový dropdown, ktoré zbytočne zaťažovali lekára.
  - Vložiť čistú, profesionálnu klinickú kartu:
    - **„📦 Spotreba materiálu & odpis zo skladu (Evidencia sestry)“**
    - Text: *„Materiál, šitie a pooperačné prádlo eviduje a odpisuje sestra v karte pacienta cez balíčky spotreby.“*
    - Tlačidlo: **„📦 Otvoriť odpis spotreby pre tohto pacienta“** (priamy mostík pre personál na sále).
  - V tlačenom PDF protokole zostáva v prípade potreby súhrn materiálov buď z odpísaného balíčka sestry, alebo stručný štandard.

### Krok 3: Implementácia tlačidla a inteligentného dialógu v `src/components/PatientDatabase.tsx`
- **Rýchla akčná lišta (Quick Action Bar)** v hlavičke otvoreného pacienta:
  - Pridanie primárneho tlačidla **`📦 Odpis spotreby (Sestra)`** s výrazným vizuálnym štýlom SAY CLINIC (amber/gold podtón).
- **Modálne okno odpisu spotreby**:
  - **Režim 1: 📦 Balíček spotreby podľa operácie**:
    - Systém automaticky skontroluje operáciu pacienta (z `patient_surgeries` alebo lekárskej správy) a **okamžite predvyberie príslušný balíček**.
    - Prehľadný zoznam všetkých položiek balíčka s ich kategóriami, jednotkami a predvolenými množstvami.
    - Možnosť jednoducho odškrtnúť položku (ak sa nepoužila) alebo zmeniť počet kusov.
    - Tlačidlo **„Zaevidovať & Odpísať balíček zo skladu ({počet} položiek)“**.
  - **Režim 2: ✏️ Manuálny odpis materiálu**:
    - Možnosť vyhľadať a odpísať akúkoľvek jednotlivú položku zo skladu (napr. dodatočný steh, liek, špeciálne prádlo).
- Okamžitá aktualizácia zoznamu *Spotrebovaný materiál* v zložke pacienta a skladu s presným označením balíčka, dátumu a personálu.

---

## 3. Plán overenia (Verification Plan)

### Automatizované kontroly:
1. `compile_applet` – overenie bezchybnej kompilácie TypeScriptu a Next.js.
2. `lint_applet` – kontrola syntaxe a čistoty kódu.

### Manuálne overenie:
1. Otvorenie Operačného protokolu v `MedicalRecordForm`: potvrdiť, že lekár má formulár zbavený zadávania skladových materiálov a vidí prehľadnú väzbu na sestru.
2. Otvorenie karty pacienta (napr. pacientka s naplánovanou alebo prebehnutou augmentáciou):
   - Kliknúť na tlačidlo **`📦 Odpis spotreby (Sestra)`** v rýchlej akčnej lište.
   - Overiť, že systém automaticky predvybral balíček *Augmentácia prsníkov*.
   - Skontrolovať rozpis položiek (Monocryl, PDS, Glycolon, drény, podprsenka, pás).
   - Kliknúť na *Zaevidovať & Odpísať balíček* a overiť okamžité zaevidovanie v karte pacienta a odpis zo skladu.
   - Vyskúšať manuálny odpis ďalšej položky.
