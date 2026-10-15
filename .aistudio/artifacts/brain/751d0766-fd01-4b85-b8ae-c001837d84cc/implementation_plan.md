# Implementačný plán: Obnova kompletného tímu používateľov SAY CLINIC (DOKONČENÉ)

## 1. Prehľad problému
V súbore `LoginForm.tsx` a v `UserService.ts` bol zoznam predvolených používateľov (`SAY_CLINIC_USERS`) zredukovaný iba na jediný účet `u1` (SAY CLINIC), a v metóde `UserService.getUsers()` bolo napevno nastavené filtrovanie, ktoré z pamäte vrátilo len tento jeden účet. Z prihlasovacieho okna aj zo správy personálu tak zmizli všetci ostatní lekári, sestry a manažment.

## 2. Vykonané zmeny

### Krok 1: Obnova definície 10-členného personálu v `LoginForm.tsx` (HOTOVO)
Do poľa `SAY_CLINIC_USERS` v `src/components/LoginForm.tsx` bol vrátený kompletný zoznam tímu:
1. **u1**: MUDr. Ján Mráz (`say@sayclinic.sk` / `mraz@sayclinic.sk`, CEO & Primár)
2. **u2**: MUDr. Zuzana Sroková (`srokova@sayclinic.sk`, Lekárka / Plastický chirurg)
3. **u3**: MUDr. Minh Tuong Tran (`tran@sayclinic.sk`, Lekár / Plastický chirurg)
4. **u4**: Ing. Barbara Mecerodová, MBA (`mecerodova@sayclinic.sk`, Klinický manažment)
5. **u5**: Mgr. Elena Solivajsová (`solivajsova@sayclinic.sk`, Klientsky servis & Recepcia)
6. **u6**: Ema Foltáni (`foltani@sayclinic.sk`, Zdravotná sestra / Inštrumentárka)
7. **u7**: Sabina Lenhartová (`lenhartova@sayclinic.sk`, Inštrumentárka / Sestra)
8. **u8**: Anesteziológ (OAIM) (`anesteziolog@sayclinic.sk` / `anestezia@sayclinic.sk`, Lekár)
9. **u9**: Anesteziologická sestra (`anest.sestra@sayclinic.sk`, Zdravotná sestra)
10. **u10**: Viktória Foltániová (`foltaniova@sayclinic.sk`, Recepčná & Koordinátorka)

Každému profilu boli nastavené korektné avatary z `/avatars/`, zodpovedajúce roly a prístupové kategórie.

### Krok 2: Oprava `src/services/userService.ts` (HOTOVO)
- Odstránené obmedzenie `if (sayUser) return [sayUser]`.
- `UserService.getUsers()` teraz vracia kompletný personál a automaticky zlúči chýbajúcich predvolených členov s uloženými lokálnymi úpravami.

### Krok 3: Prepojenie inicializácie v `LoginForm.tsx` (HOTOVO)
- Inicializácia `const [users, setUsers] = useState<UserAccount[]>(() => UserService.getUsers())` dynamicky načítava personál.
- Pridaný poslucháč udalosti `say_clinic_users_changed` pre okamžitú reaktivitu na zmeny profilov alebo fotografií.

### Krok 4: Overenie a kompilácia (HOTOVO)
- Typová kontrola (`tsc --noEmit`) prebehla s 0 chybami.
- Overenie kompilácie (`compile_applet`) úspešne dokončené: **Build succeeded - the applet is compiled**.
