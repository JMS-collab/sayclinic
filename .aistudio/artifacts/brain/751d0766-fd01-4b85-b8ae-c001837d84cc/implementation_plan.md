# 100% Serverový Real-Time Systém & Súbežná Spolupráca s Personalizovanými Avatarmi

Komplexný implementačný plán pre úplné odstránenie závislosti na lokálnej pamäti zariadenia (`localStorage`) v prospech autoritatívneho centrálneho servera s okamžitou obojsmernou synchronizáciou, inteligentným zlučovaním dát a live indikáciou súbežne pracujúcich kolegov prostredníctvom ich **reálnych 3D Genmoji avatarov**.

---

### Prehľad potvrdených rozhodnutí

> [!IMPORTANT]
> **Potvrdené používateľom:**
> 1. **Žiadna závislosť na `localStorage`**: Všetky klinické dáta, dekurzy, časová os, termíny a operačné protokoly sú autoritatívne uložené a zlučované na centrálnom serveri.
> 2. **Súbežná práca lekára a sestry**: Automatické inteligentné zlučovanie zmien bez straty dát (dekurz lekára aj záznam sestry sa v reálnom čase spoja na základe ID položiek a časovej pečiatky).
> 3. **Live indikátor s osobným avatarom (Namiesto obyčajnej bodky)**:
>    - Na karte pacienta sa zobrazí **okrúhly 3D Genmoji / profilový avatar konkrétneho človeka**, ktorý má pacienta v tom istom čase otvoreného (napr. 3D avatar MUDr. Jána Mráza, Bc. Viktórie Foltániovej, Ing. Barbary Mecerodovej atď.).
>    - Okolo avatara bude jemný pulzujúci svetelný prstenec s menovkou a rolou: *„Práve v karte pracuje: [Avatar] Bc. Viktória Foltániová (Sestra / Recepcia)“*.
>    - Ak je v karte viacero kolegov naraz, avatary sa zobrazia vedľa seba v elegantnom prekrývajúcom sa zoskupení (Facepile / Team presence).

---

## 1. Architektúra & Dátový tok

```
┌─────────────────────────────────────────┐       ┌─────────────────────────────────────────┐
│           POČÍTAČ LEKÁRA                │       │             TABLET SESTRY               │
│   (MUDr. Ján Mráz píše dekurz)          │       │    (Bc. Foltániová zadáva vitálne f.)   │
└────────────────────┬────────────────────┘       └────────────────────┬────────────────────┘
                     │                                                 │
                     │ 1. Heartbeat Presence                           │ 1. Heartbeat Presence
                     │    { userId: 'u1', patientId: 'P1',             │    { userId: 'u10', patientId: 'P1',
                     │      avatarUrl: '/avatars/mraz.png' }           │      avatarUrl: '/avatars/viktoria.png' }
                     ▼                                                 ▼
     ┌─────────────────────────────────────────────────────────────────────────┐
     │                       CENTRÁLNY SERVER SAY CLINIC                       │
     │                      (/api/sync + SSE /api/sync/events)                 │
     │                                                                         │
     │  - Autoritatívna klinická databáza (clinic_data.json / server)          │
     │  - Granulárne zlučovanie: ID záznamu + časová pečiatka                  │
     │  - Live Team Presence Hub: sledovanie prihlásených avatarov k pacientovi│
     │  - Okamžitý SSE broadcast do všetkých pripojených zariadení (<100ms)    │
     └─────────────────────────────────────────────────────────────────────────┘
                     │                                                 │
                     │ 2. SSE Presence & Dáta                          │ 2. SSE Presence & Dáta
                     ▼                                                 ▼
      Vidí avatar sestry v karte:                       Vidí avatar lekára v karte:
      [Avatar Bc. Foltániová] Práve upravuje            [Avatar MUDr. Mráz] Práve upravuje
      + zmeny sestry zapracované v reálnom čase!        + dekurz lekára zapracovaný v reálnom čase!
```

---

## 2. Plánované kroky implementácie

### Krok 1: Rozšírenie centrálneho serverového synchronizátora (`RealtimeSyncService` & `/api/sync`)
- Doplniť do `COLLECTION_MAP` a serverovej databázy chýbajúce kolekcie:
  - `patient_records`: Dekurzy, lekárske vyšetrenia, recepty a epikrity.
  - `clinical_timeline_profiles`: Klinické poznámky sestry a lekára, zistené riziká a alergie.
  - `patient_surgeries`: Operačné protokoly, anestéziologické záznamy a súhlasy.
  - `patient_presence`: Zoznam aktívnych používateľov pracujúcich na karte konkrétneho pacienta vrátane ich avatarov.
  - `custom_macros`: Klinické šablóny a makrá.
- Pri štarte aplikácie na akomkoľvek zariadení (tablet, mobil, PC) vykonať kompletnú autoritatívnu hydratáciu zo servera.

### Krok 2: Inteligentné zlučovanie zmien bez straty dát (Smart Conflict-Free Merging)
- Namiesto prepisovania celého poľa záznamov jedného používateľa druhým implementovať zlučovanie na úrovni jednotlivých položiek:
  - Ak lekár pridá dekurz s ID `rec-101` a sestra v tom istom čase pridá poznámku s ID `note-202`, server aj klientsky synchronizátor ich zjednotia na základe ID a časovej pečiatky (`updatedAt`).
  - Žiadna práca lekára ani sestry sa nikdy neprepíše ani nestratí.

### Krok 3: Live Presence Panel s reálnymi Avatarmi personálu
- Vytvoriť v `ActivePatientBar.tsx` a `PatientDatabase.tsx` vizuálny komponent prítomnosti tímu:
  - Pri otvorení karty pacienta sa odošle prítomnostný balíček:
    `{ patientId, userId, userName, userTitle, userRole, avatarUrl, lastSeen: Date.now() }`.
  - V hornej lište aktívneho pacienta sa zobrazí luxusný zlatisto lemovaný štítok s **reálnym 3D Genmoji avatarom** súbežne pracujúceho kolegu:
    - Napríklad pri otvorení karty sestričkou sa lekárovi zobrazí 3D avatar Viktórie (dlhé čierne vlasy + okuliare) s textom: *„Bc. Viktória Foltániová práve pracuje v tejto karte“*.
    - Pri kliknutí alebo prejdení kurzorom na avatar sa zobrazí detailný tooltip s časom poslednej aktivity a rolou.
  - Heartbeat sa obnovuje každých 15 sekúnd. Ak používateľ kartu zavrie alebo prejde inam, avatar sa po 30 sekundách automaticky odregistruje.

### Krok 4: Odstránenie izolovaných `localStorage` závislostí v moduloch
- Upraviť `PatientTimelineSidebar.tsx`: Všetky poznámky a riziká okamžite odosielať a prijímať cez `RealtimeSyncService`.
- Upraviť `MedicalRecordForm.tsx`: Odstrániť izolované ukladanie operačných záznamov a prepojiť ich na centrálnu synchronizáciu.
- Upraviť `AestheticModule.tsx` a `CosmeticsModule.tsx`: Zabezpečiť okamžité prepojenie na server.

---

## 3. Overenie a testovací plán

1. **Test zobrazenia avatarov v Live Presence**:
   - Simulácia otvorenia pacienta P1 lekárom (u1) a sestrou (u10).
   - Overenie, že lekár vidí 3D avatar sestry a sestra vidí 3D avatar lekára.
2. **Test súbežného zápisu bez straty dát**:
   - Zápis dekurzu lekárom a súčasné pridanie vitálnych funkcií sestrou – overenie zjednotenia v reálnom čase bez prepísania.
3. **Kompilácia a integrita**:
   - Overenie `compile_applet` a odozvy HTTP 200 OK na porte 3000.
