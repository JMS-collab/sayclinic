# Implementačný plán: Vynútené Face ID / Touch ID / PIN overenie pri každom otvorení

Tento plán rieši požiadavku, aby sa do aplikácie nedalo vstúpiť automaticky bez overenia, a aby systém vyžadoval biometriu (Face ID / Touch ID) alebo PIN pri každom otvorení aj v iFrame testovacom prostredí.

---

## 1. Analýza príčiny súčasného stavu
1. **Uložená relácia (Silent Session Restore):** Služba `AuthService.getSession()` v `src/app/page.tsx` pri štarte automaticky obnovovala reláciu z `localStorage` a nastavila `currentUser(storedUser)`, čím sa prihlasovací formulár vôbec nezobrazil a systém používateľa rovno vpustil dnu.
2. **iFrame obmedzenie WebAuthn:** Prehliadače v iFrame blokujú natívne volanie `navigator.credentials.get()` (chyba `NotAllowedError`), kvôli čomu fallback kód pri pokuse o biometriu vyhodnotil prostredie a v niektorých prípadoch povolil prístup bez manuálneho potvrdenia.

---

## 2. Navrhované riešenie

### A. Vynútený Biometrický Zámok (Session Lockscreen)
- **Koniec tichého auto-loginu:** Ak existuje uložená relácia v `localStorage`, aplikácia sa **neotvorí priamo do ambulantného systému**.
- Namiesto toho sa zobrazí elegantná celoobrazovková **Biometrická zamykacia obrazovka (Liquid Glass)**:
  - Zobrazí meno prihláseného lekára (napr. *MUDr. Vladimír Mráz*), jeho rolu a profilový avatar.
  - Vyzve k overeniu: *"Aplikácia je uzamknutá. Pre pokračovanie overte svoju identitu pomocou Face ID, Touch ID alebo PIN."*
  - Veľké interaktívne biometrické tlačidlo s pulzujúcim zlatým skenerom.
  - Možnosť prepnúť na rýchly 6-miestny PIN alebo heslo kliniky, ak používateľ nechce použiť biometriu.
  - Možnosť *"Odhlásiť a zmeniť profil"*.

### B. Ošetrenie iFrame vs. Samostatné okno (WebAuthn)
- **V samostatnom okne (Top-level browsing context):** Zavolá sa natívne Apple / Windows WebAuthn API s promptom Face ID / Touch ID.
- **V iFrame testovacom prostredí:**
  - Ak prehliadač zablokuje WebAuthn s chybou `NotAllowedError`, systém **nikdy nepustí používateľa automaticky**.
  - Zobrazí sa jasná výzva:
    1. **Otvoriť v samostatnom okne** (priamy odkaz na ostrú URL pre 100% natívne Apple Face ID / Touch ID okno bez iFrame obmedzení).
    2. **alebo zadať PIN / heslo** priamo v iFrame okne.

### C. Globálny mechanizmus uzamknutia pri nečinnosti
- Automatické uzamknutie obrazovky po 5 / 15 minútach nečinnosti alebo pri prepnutí karty/minimalizácii okna, vyžadujúce opätovné Face ID / Touch ID / PIN.

---

## 3. Dotknuté komponenty a súbory
1. `src/services/authService.ts`:
   - Pridanie príznaku `isLocked` do ukladanej relácie alebo vyžadovanie re-autentifikácie pri reštarte.
   - Správa PIN kódu pre rýchle odomknutie.
2. `src/components/LoginForm.tsx`:
   - Zákaz akéhokoľvek tichého prepustenia v `PasskeyService.authenticatePasskey()` a `triggerPasskeyVerification()`.
   - Zobrazenie presnej diagnostiky a tlačidla na otvorenie v samostatnom okne pri detekcii iFrame.
3. `src/app/page.tsx`:
   - Implementácia komponentu `BiometricLockOverlay`, ktorý prekryje aplikáciu, kým neprebehne Face ID / Touch ID / PIN overenie.

---

## 4. Overenie a testovanie
- Overenie v iFrame: Používateľ vidí zamykaciu obrazovku, nemôže sa dostať do dát bez interakcie, môže zadať PIN/heslo alebo otvoriť externé okno.
- Overenie v samostatnom okne: Test natívneho Face ID / Touch ID WebAuthn promptu.
- Verifikácia buildom (`compile_applet`).
