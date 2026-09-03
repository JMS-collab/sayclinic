export interface SurgeryConsentProfile {
  id: string;
  keywords: string[];
  procedureName: string;
  anatomicalArea: string;
  purposeAndNature: string;
  technique: string;
  anesthesiaType: string;
  alternatives: string;
  refusalConsequences: string;
  specificRisks: string;
  postopCare: {
    restAndPositioning: string;
    compressionGarment: string;
    physicalRestrictions: string;
    woundCare: string;
    environmentalRestrictions: string;
    medication: string;
    checkupSchedule: string;
  };
}

export const SURGERY_CONSENT_DATABASE: Record<string, SurgeryConsentProfile> = {
  // 1. AUGMENTÁCIA PRSNÍKOV IMPLANTÁTMI
  op_aug_impl: {
    id: 'op_aug_impl',
    keywords: ['aug_impl', 'augmentacia', 'zvacsenie prsnikov', 'implantat', 'implantaty', 'silikonove', 'prsniky'],
    procedureName: 'Zväčšenie prsníkov silikónovými implantátmi (augmentácia prsníkov)',
    anatomicalArea: 'Bilaterálne, oblasť prsníkov a prednej steny hrudníka (retroglandulárne, subfasciálne alebo v rovine Dual Plane I–III)',
    purposeAndNature: 'Účelom výkonu je zväčšenie objemu, modelácia a harmonizácia tvaru a symetrie prsníkov za použitia certifikovaných silikónových gélových implantátov. Povaha výkonu: Invazívny chirurgický estetický zákrok v celkovej anestézii spojený s vytvorením implantačnej kavity a vložením cudzorodého telieska (biokompatibilného medicínskeho implantátu).',
    technique: 'Predoperačné meranie a zakreslenie podľa Adams/Tebbets plánu. Incízia v inframamárnej ryhe (prípadne periareolárne). Preparácia implantačnej kapsy pod m. pectoralis major v rovine Dual Plane alebo subfasciálne. Dôsledná hemostáza a výplach kavity antiseptickým roztokom. Výmena sterilného inštrumentária a zavedenie implantátov no-touch technikou s Kellerovým lievikom. Fixácia povrchového fasciálneho systému (SFS). Sutura operačných rán vo vrstvách vstrebateľnými stehmi, intradermálny steh, sterilné lepenie (Steri-strip) a aplikácia špeciálnej kompresívnej podprsenky.',
    anesthesiaType: 'Celková anestézia (vyžaduje kompletné interné a anesteziologické predoperačné vyšetrenie)',
    alternatives: 'Autológny prenos vlastného tuku (lipofilling / lipotransfer do prsníkov), použitie vonkajších epitéz a tvarovacej bielizne, upustenie od zákroku a ponechanie súčasného stavu.',
    refusalConsequences: 'Zotrvanie východiskového anatomického stavu (hypoplázia, hypotrofia, asymetria alebo popôrodná involúcia prsníkov). Neuskutočnenie nepredstavuje žiadne bezprostredné zdravotné riziká.',
    specificRisks: 'Kapsulárna kontraktúra (tvorba tuhej väzivovej kapsuly okolo implantátu Baker I–IV s rizikom bolesti, deformácie a potreby reoperácie či kapsulektómie); dislokácia, rotácia alebo malpozícia implantátu (posun laterálne, mediálne - symmastia, alebo spodný pokles - bottoming-out); viditeľné alebo hmatateľné zvlnenie (rippling) pri tenkom podkožnom krytí; prechodné alebo trvalé zmeny citlivosti bradavky a dvorca (hypestézia, hyperestézia, necitlivosť); ruptúra alebo trhlina plášťa implantátu s presakovaním silikónu; tvorba periprotetického serómu (skorého alebo neskorého) vyžadujúceho punkciu; hematóm vyžadujúci chirurgickú revíziu a evakuáciu; asymetria prsníkov a polohy inframamárnych rýh; extrúzia implantátu; zriedkavé riziko BIA-ALCL (veľkobunkový anaplastický lymfóm spojený s implantátmi) a BIA-SCC; možné čiastočné obmedzenie laktácie a potreba špecifického skríningu pri mamografii/USG.',
    postopCare: {
      restAndPositioning: 'Prísny kľudový režim na lôžku prvé dni. Spánok výlučne na chrbte so zvýšenou hornou polohou trupu o 30° po dobu 6 týždňov; zákaz spania na bruchu a na bokoch.',
      compressionGarment: 'Nosenie špeciálnej elastickej pooperačnej podprsenky (a horného stabilizačného pásu podľa ordinácie lekára) nepretržite 24/7 po dobu 6 až 8 týždňov (odopnúť len na nevyhnutnú hygienu).',
      physicalRestrictions: 'Striktný zákaz zdvíhania horných končatín nad úroveň ramien prvé 2 týždne; zákaz nosenia a zdvíhania bremien nad 3 kg; zákaz šoférovania 10–14 dní; zákaz športu, behu, skákania a posilňovania hornej polovice tela na 8 týždňov.',
      woundCare: 'Ponechať sterilné krytie a náplasti do prvej kontroly; rany udržiavať v čistote a suchu; sprchovanie tela od pása nadol; po vybratí stehov toaleta rán (Octenisept), následne aplikácia silikónového gélu a tlakové masáže podľa inštruktáže.',
      environmentalRestrictions: 'Zákaz sauny, pary, wellness, kúpeľov vo vani a plávania v bazénoch po dobu 6–8 týždňov; zákaz solária a priameho slnečného žiarenia, fotoprotekcia jaziev SPF 50+ minimálne 12 mesiacov.',
      medication: 'Analgetická liečba podľa ordinácie (Paracetamol, Dexketoprofen, Novalgin), profylaktické antibiotiká, lieky proti opuchom (Aescin), prevencia TEN u rizikových pacientov.',
      checkupSchedule: '1. kontrola a preväz o 7–10 dní; extrakcia stehov (ak nie sú vstrebateľné); kontrola po 1 mesiaci, 3 mesiacoch, 6 mesiacoch a 1 roku od operácie (s odporúčaním pravidelnej ročnej USG kontroly prsníkov).'
    }
  },

  // 2. BLEFAROPLASTIKA HORNÝCH VIEČOK
  op_blepharo_horne: {
    id: 'op_blepharo_horne',
    keywords: ['blepharo_horne', 'horne viecka', 'hornych viecok', 'blefaroplastika hornych', 'ocne viecka'],
    procedureName: 'Blefaroplastika horných viečok (chirurgická korekcia previsov horných mihalníc)',
    anatomicalArea: 'Bilaterálne, oblasť horných mihalníc a supraorbitálnych záhybov',
    purposeAndNature: 'Účelom výkonu je redukcia a odstránenie kožných nadbytkov (dermatochaláza), redukcia mediálnych a centrálnych prolapsujúcich tukových vačkov, obnova prirodzeného záhybu viečka a zlepšenie periférneho zorného poľa. Povaha výkonu: Invazívny ambulantný chirurgický výkon v lokálnej anestézii s precíznou preparáciou kožno-svalových štruktúr viečka.',
    technique: 'Precízne predoperačné zakreslenie incíznej línie v anatomickom supratarzálnom záhybe pri otvorenom aj zatvorenom oku. Aplikácia lokálneho anestetika (Mesocain/Marcain s adrenalínom 1:200 000). Excízia prebytočného kožného laloka a tenkého prúžku m. orbicularis oculi. Dôsledná bipolárna hemostáza. Selektívna deliberácia a resekcia retroseptálnych tukových prolapsov (mediálne a centrálne). Precízna intradermálna sutura monofilným nevstrebateľným stehom (Prolene/Glycolon 6/0), fixácia Steri-strip náplasťami a sterilné chladivé krytie.',
    anesthesiaType: 'Lokálna anestézia s vazokonstrikčnou prímesou (prípadne v kombinácii s analgosedáciou na prianie pacienta)',
    alternatives: 'Neinvazívne metódy (frakčný CO2 laserový resurfacing, plazmový generátor Plexr), aplikácia botulotoxínu na eleváciu laterálnej časti obočia, ponechanie pôvodného stavu.',
    refusalConsequences: 'Zotrvanie kožných previsov, pocit únavy a ťažkých viečok, vizuálne zúženie zorného poľa a pokračovanie prejavov starnutia očného okolia.',
    specificRisks: 'Pooperačný edém a rozsiahle hematómy očného okolia („monokle“); prechodný lagoftalmus (nedovieranie očných štrbín pri spánku s rizikom vysychania rohovky); ektropium alebo asymetria výšky supratarzálneho záhybu; syndróm suchého oka (pocit cudzieho telesa, pálenie, rezanie, slzenie); chemóza (opuch spojovky); tvorba drobných epidermoidných cýst pozdĺž stehu (miliá); hypertrofické alebo pigmentované jazvy v laterálnom uhle; extrémne zriedkavé riziko retrobulbárneho krvácania s kompresiou optického nervu.',
    postopCare: {
      restAndPositioning: 'Kľud na lôžku s vyvýšenou hlavou (2 vankúše). Pravidelné prikladanie suchých chladivých gélových obkladov cez sterilnú gázu prvých 48 hodín.',
      compressionGarment: 'Ponechanie fixačných Steri-strip náplastí; netrieť si oči, nesiahať do operačného poľa.',
      physicalRestrictions: 'Zákaz predkláňania, prudkých pohybov hlavou, zdvíhania bremien a namáhavých činností prvé 2 týždne; obmedziť sledovanie obrazoviek a čítanie prvé 3 dni; zákaz kontaktných šošoviek 2 týždne; nosenie slnečných okuliarov pri pobyte vonku.',
      woundCare: 'Rany nenamáčať do vybratia stehov; aplikácia očných kvapiek / umelých sĺz (Hylo-Dual, Ophthalmo-Septonex); po vybratí stehov jemné premasírovanie a ochrana silikónovým gélom.',
      environmentalRestrictions: 'Vyhýbať sa prašnému a zafajčenému prostrediu, vetru a priamemu slnku; zákaz sauny, bazéna a líčenia očí po dobu 3–4 týždňov.',
      medication: 'Voľnopredajné analgetiká (Paracetamol/Ibalgin pri bolesti), umelé slzy/očné maste, lokálne heparínové gély na hematómy mimo rany.',
      checkupSchedule: 'Extrakcia intradermálneho stehu na 5.–7. pooperačný deň; kontrola po 1 mesiaci a 3 mesiacoch.'
    }
  },

  // 3. BLEFAROPLASTIKA DOLNÝCH VIEČOK
  op_blepharo_dolne: {
    id: 'op_blepharo_dolne',
    keywords: ['blepharo_dolne', 'dolne viecka', 'dolnych viecok', 'blefaroplastika dolnych'],
    procedureName: 'Blefaroplastika dolných viečok (chirurgická korekcia vačkov a previsov dolných viečok)',
    anatomicalArea: 'Bilaterálne, oblasť dolných mihalníc a infraorbitálneho okraja (periorbitálna oblasť)',
    purposeAndNature: 'Účelom výkonu je odstránenie vačkov pod očami, redukcia alebo transpozícia herniovaného infraorbitálneho tuku, odstránenie prebytočnej kože dolného viečka, spevnenie m. orbicularis oculi a kantopexia/kantoplastika na obnovu pevného tonusu viečka.',
    technique: 'Subciliárny prístup (rez 1–2 mm pod riasami) alebo transkonjuktiválny prístup. Šetrná preparácia kožno-svalového laloka. Expozícia a redukcia alebo premostenie 3 tukových kompartmentov (mediálny, centrálny, laterálny). Uvoľnenie retaining ligamentu (ORL). Záves svalu a kantopexia k laterálnemu periostu orbity. Veľmi šetrná konzervatívna resekcia prebytočnej kože bez ťahu. Intradermálna sutura 6/0, náplasťová fixácia a krytie.',
    anesthesiaType: 'Lokálna anestézia s vazokonstrikciou alebo analgosedácia / celková anestézia',
    alternatives: 'Aplikácia výplne (kyselina hyalurónová do slzných rýh), frakčný laser, chemický peeling, konzervatívny postup.',
    refusalConsequences: 'Pretrvávanie vačkov a kruhov pod očami, unavený vzhľad tváre, starnutie infraorbitálnej oblasti.',
    specificRisks: 'Hematómy a opuchy; ektropium (pokles a odvrátenie dolného viečka) alebo sklerálne odhalenie (scleral show); lagoftalmus; chemóza spojovky; syndróm suchého oka; asymetria viečok; hypertrofické jazvičky; zriedkavo retrobulbárny hematóm.',
    postopCare: {
      restAndPositioning: 'Poloha v polosede, spánok na chrbte so zvýšenou hlavou. Chladenie očného okolia prvých 48 hodín.',
      compressionGarment: 'Fixačné Steri-strippy na podporu tonusu viečka neodstraňovať.',
      physicalRestrictions: 'Zákaz predklonu, tlaku na oči, zdvíhania bremien 2–3 týždne; zákaz kontaktných šošoviek 3 týždne.',
      woundCare: 'Očné kvapky, masť do očí na noc, udržiavať v suchu do extrakcie stehov; po zhojení špecifické masáže viečka smerom nahor a von.',
      environmentalRestrictions: 'Zákaz líčenia očí, sauny, bazéna 4 týždne; nosenie slnečných okuliarov s UV filtrom.',
      medication: 'Analgetiká, očné kvapky s antiseptickou zložkou a umelé slzy.',
      checkupSchedule: 'Vybratie stehov na 5.–7. pooperačný deň; kontrola po 1 mesiaci a 3 mesiacoch.'
    }
  },

  // 4. ABDOMINOPLASTIKA
  op_abdominoplastika: {
    id: 'op_abdominoplastika',
    keywords: ['abdominoplastika', 'abdo', 'plastika brucha', 'koza brucha', 'diastaza', 'umbilikoplastika'],
    procedureName: 'Abdominoplastika (plastika brušnej steny s raphiou diastázy priamych brušných svalov)',
    anatomicalArea: 'Predná brušná stena od symfýzy po xiphoid a rebrové oblúky, boky a oblasť pupka (umbilicus)',
    purposeAndNature: 'Účelom výkonu je odstránenie rozsiahleho kožno-tukového nadbytku a previsu brucha (panniculus), chirurgické zošitie a spevnenie diastázy mm. recti abdominis (raphia diastázy), nová transpozícia pupka a rekonštrukcia pevných kontúr drieku.',
    technique: 'Nízky suprapubický priečny rez v línii spodnej bielizne. Uvoľnenie pupka cirkulárnym rezom. Preparácia kožno-tukového laloka od svalovej fascie až po rebrové oblúky a xiphoid. Dvojvrstvová raphia diastázy nevstrebateľným pokračujúcim stehom (Stratafix). Progresívne tenzné stehy (PTS) na zníženie mŕtveho priestoru. Resekcia prebytočného laloka. Vytvorenie nového otvoru pre pupok a neoumbilikoplastika. Zavedenie Redonových drénov, sutura vo vrstvách a priloženie kompresívneho pásu.',
    anesthesiaType: 'Celková anestézia (vyžaduje kompletné predoperačné interné vyšetrenie)',
    alternatives: 'Samostatná liposukcia brucha a bokov (ak nie je laxita kože a diastáza), miniabdominoplastika, cvičenie a fyzioterapia, upustenie od operácie.',
    refusalConsequences: 'Pretrvávanie kožného previsu, intertrigo v podbrušku, oslabenie brušného lisu a neestetická kontúra brucha.',
    specificRisks: 'Tvorba serómu (hromadenie tkanivového moku vyžadujúce punkcie); hematóm; nekróza okrajov laloka alebo pupka (zvýšené riziko u fajčiarov); dehiscencia rany v centrálnom T-spoji; trvalé zníženie alebo strata citlivosti v podbrušku; asymetria línie jazvy alebo laterálne „psie uši“ (dog ears); hypertrofická jazva; hlboká žilová trombóza a pľúcna embólia.',
    postopCare: {
      restAndPositioning: 'Chôdza a spánok v miernom predklone (Fowlerova poloha – podložený chrbát a pokrčené kolená) prvé 2 týždne na zníženie ťahu na jazvu.',
      compressionGarment: 'Nosenie elastického pooperačného brušného pásu / nohavičiek 24/7 po dobu 6–8 týždňov.',
      physicalRestrictions: 'Zákaz zdvíhania bremien (>3 kg), zákaz napínania brušného lisu, posilňovania a športu po dobu 8–12 týždňov.',
      woundCare: 'Ošetrovanie drénov do ich extrakcie (1.–3. deň); rany udržiavať čisté; po zhojení tlakové masáže a aplikácia silikónových plátov.',
      environmentalRestrictions: 'Zákaz kúpania vo vani, sáun a bazénov 8 týždňov; fotoprotekcia jazvy SPF 50+ minimálne 1 rok.',
      medication: 'LMWH (nízkomolekulárny heparín) na prevenciu trombózy 10–14 dní, analgetiká, antibiotiká podľa protokolu.',
      checkupSchedule: 'Extrakcia drénov 1.–3. deň; kontrola a preväz 7.–10. deň; kontrola po 1, 3 a 6 mesiacoch.'
    }
  },

  // 5. MINIABDOMINOPLASTIKA
  op_miniabdo: {
    id: 'op_miniabdo',
    keywords: ['miniabdo', 'miniabdominoplastika', 'mini plastika brucha'],
    procedureName: 'Miniabdominoplastika (čiastočná plastika podbruška)',
    anatomicalArea: 'Hypogastrium – dolná časť brušnej steny pod pupkom',
    purposeAndNature: 'Redukcia mierneho kožno-tukového nadbytku v oblasti podbruška bez nutnosti premiestnenia pupka, prípadne s ošetrením infraumbilikálnej diastázy.',
    technique: 'Nízky suprapubický rez, preparácia laloka po úroveň pupka, selektívna raphia infraumbilikálnej diastázy, resekcia prebytočnej kože, sutura vo vrstvách.',
    anesthesiaType: 'Celková anestézia alebo analgosedácia',
    alternatives: 'Liposukcia, klasická abdominoplastika, konzervatívny postup.',
    refusalConsequences: 'Pretrvávanie ochabnutého podbruška.',
    specificRisks: 'Hematóm, seróm, znížená citlivosť podbruška, hypertrofické jazvenie, asymetria.',
    postopCare: {
      restAndPositioning: 'Kľudový režim, mierne ohnutie v drieku pri chôdzi prvé dni.',
      compressionGarment: 'Nosenie elastického pásu 4–6 týždňov 24/7.',
      physicalRestrictions: 'Zákaz zdvíhania ťažkých bremien a cvičenia brucha 6 týždňov.',
      woundCare: 'Toaleta rany, dezinfekcia, po zhojení silikónové gély.',
      environmentalRestrictions: 'Zákaz sauny, kúpania a bazénov 6 týždňov.',
      medication: 'Analgetiká, prevencia TEN.',
      checkupSchedule: 'Preväz a kontrola o 7–10 dní, následne po 1 a 3 mesiacoch.'
    }
  },

  // 6. LIPOSUKCIA (360° / BRUCHO, BOKY, STEHNÁ, CHRBÁT, PAŽE)
  op_lipo_360: {
    id: 'op_lipo_360',
    keywords: ['lipo_360', 'lipo_brucho_boky', 'liposukcia', 'lipo', 'odsatie tuku', 'pal liposukcia', 'tumescencna'],
    procedureName: 'Liposukcia (tumescenčná / PAL vibračná liposukcia podkožného tuku)',
    anatomicalArea: 'Zvolené anatomické lokality (brucho, boky, pás, chrbát, stehná, paže, podbradok)',
    purposeAndNature: 'Trvalé odstránenie lokalizovaných tukových zásob odolných voči redukcii hmotnosti, remodelácia a kontúrovanie telesných proporcií (liposculpting).',
    technique: 'Aplikácia tumescentného vazokonstrikčného roztoku cez drobné 3–4 mm kožné incízie. Následná vibračná liposukcia (Power-Assisted Liposuction - PAL) v hlbokej a strednej vrstve podkožia. Kontrola symetrie a rovnomernosti kožného laloka, sutura incízií monofilom a okamžitá aplikácia kompresívneho odevu.',
    anesthesiaType: 'Celková anestézia alebo analgosedácia / lokálna tumescenčná anestézia',
    alternatives: 'Neinvazívna kryolipolýza, injekčná lipolýza, diétny režim a cvičenie, upustenie od výkonu.',
    refusalConsequences: 'Zotrvanie lokalizovaných tukových depozitov a disproporcií postavy.',
    specificRisks: 'Difúzny pooperačný edém a rozsiahle hematómy; nerovnosti, preliačiny a kontúrové asymetrie; laxita a zvlnenie kože; prechodné parestézie a necitlivosť kože; hyperpigmentácia vpichov; seróm; extrémne zriedkavá tuková embólia.',
    postopCare: {
      restAndPositioning: 'Šetrenie prvé dni, avšak skorá mobilizácia a chôdza ako prevencia TEN.',
      compressionGarment: 'Striktné celodenné nosenie kompresívnej bielizne 24/7 po dobu 4–6 týždňov.',
      physicalRestrictions: 'Zákaz ťažkého športu a posilňovania 4–6 týždňov.',
      woundCare: 'Ošetrovanie vpichov, po 2–3 týždňoch zahájenie lymfodrenáží a masáží odsávaných lokalít.',
      environmentalRestrictions: 'Zákaz kúpania, sáun a solária 6 týždňov; ochrana jazvičiek SPF 50+.',
      medication: 'Analgetiká, LMWH pri rozsiahlej liposukcii, dostatočná hydratácia.',
      checkupSchedule: 'Preväz o 2–3 dni, vybratie stehov o 7–10 dní, kontrola po 1 a 3 mesiacoch.'
    }
  },

  // 7. LABIOPLASTIKA
  op_labioplastika: {
    id: 'op_labioplastika',
    keywords: ['labioplastika', 'male pysky', 'labia minora', 'intimna plastika', 'redukcia pyskov'],
    procedureName: 'Labioplastika (chirurgická redukcia a modelácia malých pyskov ohanbia)',
    anatomicalArea: 'Vulvovaginálna oblasť, labia minora pudendi (prípadne klitoridálna kapucňa)',
    purposeAndNature: 'Redukcia hypertrofických, asymetrických alebo deformovaných malých pyskov ohanbia s cieľom eliminácie funkčného diskomfortu (pri športe, hygiene, intímnom živote) a zlepšenia estetického vzhľadu.',
    technique: 'Precízne zakreslenie resekčnej línie v gynekologickej polohe. Aplikácia lokálneho anestetika s adrenalínom. Vykonanie resekcie (lineárna alebo klinovitá technika) s bipolárnou hemostázou. Presná viacvrstvová sutura jemným vstrebateľným materiálom (Glycolon/Vicryl rapid 4/0-5/0) a sterilné antiseptické krytie.',
    anesthesiaType: 'Lokálna anestézia alebo analgosedácia / celková anestézia',
    alternatives: 'Neinvazívne rádiofrekvenčné ošetrenie, konzervatívny postup.',
    refusalConsequences: 'Zotrvanie mechanického dráždenia, zápalov, bolesti a estetického diskomfortu.',
    specificRisks: 'Výrazný pooperačný edém a hematómy; dehiscencia (rozostúpenie) stehov v dôsledku vlhkého prostredia a pohybu; asymetria pyskov; prechodná hypersenzitivita alebo znížená citlivosť; dyspareunia (bolestivý styk počas hojenia); zúbkovitý okraj (scallop deformity).',
    postopCare: {
      restAndPositioning: 'Kľudový režim na lôžku prvé 3–5 dní s chladením intímnej oblasti (ľad cez tkaninu); nosenie voľnej bavlnenej bielizne.',
      compressionGarment: 'Nosiť voľnú bielizeň a intímnu vložku (zákaz tampónov!).',
      physicalRestrictions: 'Striktný zákaz pohlavného styku 4–6 týždňov; zákaz športu, behu, jazdy na bicykli a koni na 4–6 týždňov; vyhýbať sa dlhému sedeniu.',
      woundCare: 'Sprchovanie čistou vlažnou vodou po každom močení a toalete, dezinfekcia (Dermo-chlorhexidín/Rosalgin), jemné osušenie prikladaním, aplikácia hojivej masti (Cicaplast/Bepanthen).',
      environmentalRestrictions: 'Zákaz kúpania vo vani, bazénov, termálnych vôd a sáun 6 týždňov.',
      medication: 'Analgetiká, lokálne antiseptiká.',
      checkupSchedule: 'Kontrola o 7–14 dní (stehy sú samovstrebateľné), kontrola po 6 týždňoch.'
    }
  },

  // 8. KOMPLETNÁ RHINOPLASTIKA
  op_rhino_komplet: {
    id: 'op_rhino_komplet',
    keywords: ['rhino_komplet', 'rhinoplastika', 'plastika nosa', 'kompletna rhinoplastika', 'nos', 'septorhinoplastika'],
    procedureName: 'Kompletná rhinoplastika (chirurgická korekcia kostného a chrupavkového skeletu nosa so septoplastikou)',
    anatomicalArea: 'Vonkajší a vnútorný nos (kostná pyramída, nosová priehradka, alárne a triangulárne chrupavky, špička a kolumela)',
    purposeAndNature: 'Úprava tvaru, veľkosti, dorzálneho profilu (odstránenie hrboľa), zúženie a definícia špičky, symetrizácia a narovnanie nosového septa na zlepšenie dýchania a celkovej estetickej harmónie tváre.',
    technique: 'Otvorený transkolumelárny alebo zatvorený endonazálny prístup. Preparácia mäkkých tkanív. Septoplastika a odber chrupavkových štepov. Piezotomické alebo klasické osteotómie kostnej pyramídy (push-down / let-down / resekcia hrboľa). Štrukturálna modelácia špičky (columellar strut, tip graft, domálne sutury). Doyleove dlahy / silikónové splinty do nosových prieduchov, sutura sliznice a kože, náplasťová fixácia (taping) a termoplastová vonkajšia dlaha.',
    anesthesiaType: 'Celková anestézia (vyžaduje kompletné interné predoperačné vyšetrenie)',
    alternatives: 'Tekutá rhinoplastika kyselinou hyalurónovou (neodstráni hrboľ ani nezmenší nos), konzervatívny postup.',
    refusalConsequences: 'Zotrvanie tvarovej deformity nosa, asymetrie, hrboľa alebo sťaženého nosového dýchania.',
    specificRisks: 'Epistaxa (krvácanie z nosa); dlhotrvajúci pooperačný edém (špička nosa až 12–18 mesiacov); asymetria nosových krídel alebo špičky; palpovateľné kostné nerovnosti (kalus); perforácia septa; porucha nosovej priechodnosti; zníženie čuchu (hyposmia - prechodná); potreba sekundárnej korekčnej operácie (reoperácie).',
    postopCare: {
      restAndPositioning: 'Spánok výlučne na chrbte s vyvýšenou hlavou. Zákaz smrkania nosa 3 týždne (len jemné odsávanie a preplachy), kýchanie len s otvorenými ústami.',
      compressionGarment: 'Nosenie termoplastovej dlahy na nose 10–14 dní, následne nočný taping ďalšie 2–4 týždne.',
      physicalRestrictions: 'Striktný zákaz nosenia dioptrických aj slnečných okuliarov priamo na koreni nosa po dobu 6–8 týždňov; zákaz kontaktných športov 3 mesiace; vyhnúť sa predkláňaniu.',
      woundCare: 'Preplachy nosa morskou vodou (Sterimar/Vincentka) a mastičky (Nisita) do nosových vchodov na zmäkčenie krúst; toaleta kolumelárneho rezu.',
      environmentalRestrictions: 'Zákaz horúcich jedál a nápojov prvé dni, zákaz sauny, horúceho kúpeľa a solária 8 týždňov; fotoprotekcia nosa SPF 50+.',
      medication: 'Analgetiká, lokálne kvapky do nosa (len krátkodobo), hemostatika.',
      checkupSchedule: 'Extrakcia silikónových dláh/splintov na 3.–5. deň; odstránenie vonkajšej dlahy a stehov na 10.–14. deň; kontrola po 1, 3, 6 mesiacoch a 1 roku.'
    }
  },

  // 9. ÚPRAVA ŠPIČKY NOSA
  op_rhino_spicka: {
    id: 'op_rhino_spicka',
    keywords: ['rhino_spicka', 'spicka nosa', 'uprava spicky', 'tip rhinoplastika'],
    procedureName: 'Úprava špičky nosa (Tip-rhinoplastika / chrupavková modelácia)',
    anatomicalArea: 'Dolná tretina nosa – alárne chrupavky, špička, kolumela a nosové dierky',
    purposeAndNature: 'Zmenšenie, nadvihnutie, zúženie alebo symetrizácia špičky nosa bez nutnosti zásahu do kostného skeletu.',
    technique: 'Zatvorený alebo otvorený prístup, remodelácia alárnych chrupaviek, aplikácia modelačných stehov a chrupavkových štepov, sutura, taping a ľahká dlaha.',
    anesthesiaType: 'Lokálna anestézia s analgosedáciou alebo celková anestézia',
    alternatives: 'Aplikácia dermálnej výplne, konzervatívny postup.',
    refusalConsequences: 'Zotrvanie bulbóznej, poklesnutej alebo asymetrickej špičky.',
    specificRisks: 'Edém špičky nosa, asymetria domov, viditeľné kontúry štepov, hypertrofická jazva kolumely.',
    postopCare: {
      restAndPositioning: 'Spánok na chrbte so zvýšenou hlavou, vyhýbať sa tlaku na nos.',
      compressionGarment: 'Nosenie náplastí a dlahy 7–10 dní.',
      physicalRestrictions: 'Zákaz športu a predkláňania 3–4 týždne.',
      woundCare: 'Čistenie nosových vchodov, preplachy morskou vodou.',
      environmentalRestrictions: 'Zákaz sauny a solária 6 týždňov.',
      medication: 'Analgetiká.',
      checkupSchedule: 'Odstránenie dlahy a stehov o 7–10 dní, kontrola po 1 a 3 mesiacoch.'
    }
  },

  // 10. DEEP PLANE FACELIFT / SMAS FACELIFT
  op_deep_plane_facelift: {
    id: 'op_deep_plane_facelift',
    keywords: ['deep_plane', 'facelift', 'smas_facelift', 'lifting tvare', 'omladenie tvare', 'deep plane'],
    procedureName: 'Deep Plane Facelift / SMAS Facelift (hlboký lifting tváre a podkožných štruktúr)',
    anatomicalArea: 'Dolné dve tretiny tváre, oblasť líc, uhlov sánky (jawline), spánkov a podbradku',
    purposeAndNature: 'Obnova mladistvých kontúr tváre, repozícia poklesnutých hlbokých tkanív tváre (SMAS a tukových kompartmentov) a vyhladenie kožných záhybov bez umelého ťahu kože.',
    technique: 'Rezy vo vlasoch spánkovej oblasti, preaurikulárne v prirodzenom záhybe pred uchom a za ušnicou do kapilícia. Disekcia v hlbokej rovine pod SMAS so šetrením vetiev n. facialis. Prerušenie retaining ligamentov. Superolaterálna vektorová fixácia SMAS. Šetrná excízia nadbytočnej kože bez napätia. Zavedenie hemostatickej siete / drénov, viacvrstvová sutura a elastická ohlávka.',
    anesthesiaType: 'Celková anestézia (vyžaduje kompletné interné vyšetrenie)',
    alternatives: 'Niťový lifting (Aptos), rádiofrekvenčný alebo ultrazvukový lifting (Ulthera), tekutý facelift výplňami, konzervatívny postup.',
    refusalConsequences: 'Pretrvávanie ochabnutia a poklesu tkanív tváre a prejavov starnutia.',
    specificRisks: 'Hematóm vyžadujúci revíziu; prechodná alebo zriedkavo trvalá paréza vetiev n. facialis (ochrnutie kútika úst, porucha dovretia oka); nekróza kožných lalokov (zvýšené u fajčiarov); strata citlivosti ušnice (n. auricularis magnus); alopécia pozdĺž rezov vo vlasoch; asymetria; deformita ušného lalôčika (pixie ear).',
    postopCare: {
      restAndPositioning: 'Spánok na chrbte s vyvýšenou hlavou (30–45°), vyhnúť sa prudkému otáčaniu a predkláňaniu hlavy.',
      compressionGarment: 'Striktné celodenné nosenie kompresívnej elastickej ohlávky 24/7 po dobu 2–3 týždňov.',
      physicalRestrictions: 'Zákaz fyzickej námahy, predklonov a športu 6 týždňov; mäkká strava prvé dni, obmedziť širokú mimiku.',
      woundCare: 'Ošetrovanie drénov/siete; toaleta rezov vo vlasoch a za ušami; po vybratí stehov silikónové gély na jazvy.',
      environmentalRestrictions: 'Zákaz sauny, solária a horúcich procedúr 8 týždňov; UV fotoprotekcia SPF 50+ 1 rok.',
      medication: 'Analgetiká, prevencia TEN, lieky proti edémom (Aescin).',
      checkupSchedule: 'Extrakcia drénov 1.–2. deň; odstránenie hemostatickej siete a stehov 7.–12. deň; kontrola po 1, 3 a 6 mesiacoch.'
    }
  },

  // 11. NECKLIFT
  op_necklift: {
    id: 'op_necklift',
    keywords: ['necklift', 'platysmaplastika', 'lifting krku', 'podbradok', 'krk'],
    procedureName: 'Necklift (platysmaplastika a lifting mäkkých tkanív krku)',
    anatomicalArea: 'Submentálna oblasť, podbradok a predná plocha krku (m. platysma)',
    purposeAndNature: 'Odstránenie dvojitej brady, napnutie a centrálne zošitie rozostúpených pruhov m. platysma (korzetová platysmaplastika) a obnova ostrého cerviko-mentálneho uhla.',
    technique: 'Submentálny prístup (krátky rez pod bradou) a retroaurikulárne rezy. Liposukcia subkutánneho tuku krku, preparácia platysmy, resekcia subplatysmálneho tuku, sutura okrajov platysmy (korset platysmaplasty), fixácia k fascii a sutura kože.',
    anesthesiaType: 'Celková anestézia alebo analgosedácia',
    alternatives: 'Samostatná liposukcia podbradku, injekčná lipolýza, neinvazívne metódy, konzervatívny postup.',
    refusalConsequences: 'Pretrvávanie ovisnutej kože krku a vertikálnych platysmálnych pruhov („morčací krk“).',
    specificRisks: 'Hematóm, seróm, prechodná stuhnutosť krku, znížená citlivosť podbradku, asymetria, hypertrofická jazva.',
    postopCare: {
      restAndPositioning: 'Vyvýšená poloha hlavy, minimalizovať rotácie a záklony krku.',
      compressionGarment: 'Nosenie elastickej krčnej bandáže/ohlávky 2–3 týždne.',
      physicalRestrictions: 'Zákaz predklonov, ťažkej práce a športu 4–6 týždňov.',
      woundCare: 'Dezinfekcia submentálneho rezu, toaleta rany, silikónové náplasti.',
      environmentalRestrictions: 'Zákaz sauny, kúpania a solária 6 týždňov.',
      medication: 'Analgetiká, lieky proti opuchom.',
      checkupSchedule: 'Preväz o 2 dni, vybratie stehov o 7–10 dní, kontrola po 1 a 3 mesiacoch.'
    }
  },

  // 12. MODELÁCIA / LIFTING PRSNÍKOV (MASTOPEXIA)
  op_mastopexia: {
    id: 'op_mastopexia',
    keywords: ['mastopexia', 'lifting prsnikov', 'modelacia prsnikov', 'ptoticke prsniky', 'ptosis'],
    procedureName: 'Lifting prsníkov (mastopexia / modelácia ptotických prsníkov)',
    anatomicalArea: 'Bilaterálne, oblasť prsníkov, dvorcov a inframamárnych rýh',
    purposeAndNature: 'Pozdvihnutie poklesnutého prsného tkaniva, redukcia nadbytočnej kože, transpozícia komplexu dvorec-bradavka do vyššej estetickej polohy a remodelácia žľazového kužeľa.',
    technique: 'Prekreslenie podľa Wise pattern (kotva) alebo vertikálny rez (Lejour). Excízia prebytočnej kože. Presun dvorca na vaskularizovanej stopke. Remodelácia žľazy lalokovou technikou, sutura pilonov, sutura vo vrstvách a aplikácia elastickej podprsenky.',
    anesthesiaType: 'Celková anestézia',
    alternatives: 'Augmentačná mastopexia (s implantátmi), použitie push-up bielizne, upustenie od operácie.',
    refusalConsequences: 'Pretrvávanie ptózy (poklesu) prsníkov a asymetrie.',
    specificRisks: 'Hematóm, seróm, čiastočná nekróza dvorca/bradavky pri poruche prekrvenia stopky, strata citlivosti dvorcov, dehiscencia v T-spoji, asymetria tvaru a výšky dvorcov, rozsiahlejšie jazvy.',
    postopCare: {
      restAndPositioning: 'Spánok výlučne na chrbte so zvýšenou hornou časťou tela 6 týždňov.',
      compressionGarment: 'Nosenie špeciálnej kompresívnej podprsenky 24/7 po dobu 6 týždňov.',
      physicalRestrictions: 'Zákaz zdvíhania rúk nad hlavu, zákaz nosenia bremien a športu 6–8 týždňov.',
      woundCare: 'Ponechať sterilné krytie, dezinfekcia rán, po zhojení tlakové masáže a silikónové gély.',
      environmentalRestrictions: 'Zákaz sauny, kúpania a solária 8 týždňov; ochrana jaziev SPF 50+ 1 rok.',
      medication: 'Analgetiká, prevencia TEN.',
      checkupSchedule: 'Preväz o 7–10 dní, vybratie stehov, kontrola po 1, 3 a 6 mesiacoch.'
    }
  },

  // 13. AUGMENTAČNÁ MASTOPEXIA
  op_aug_mastopexia: {
    id: 'op_aug_mastopexia',
    keywords: ['aug_mastopexia', 'augmentacna mastopexia', 'modelacia s implantatmi', 'lifting s implantatmi'],
    procedureName: 'Lifting prsníkov s implantátmi (augmentačná mastopexia)',
    anatomicalArea: 'Bilaterálne, oblasť prsníkov, pektorálnych svalov a dvorcov',
    purposeAndNature: 'Kombinovaný zákrok: zväčšenie objemu pomocou silikónových implantátov a súčasné pozdvihnutie a modelácia poklesnutého prsného tkaniva s redukciou prebytočnej kože.',
    technique: 'Vloženie implantátu do subpektorálnej / Dual Plane kapsy cez inframamárny prístup a následná modelácia žľazy a kožného plášťa s presunom dvorca (vertikálna alebo kotvová mastopexia).',
    anesthesiaType: 'Celková anestézia',
    alternatives: 'Dvojdobý výkon (najprv implantáty a neskôr modelácia alebo naopak), samostatná mastopexia, samostatná augmentácia.',
    refusalConsequences: 'Pretrvávanie straty objemu aj poklesu prsníkov.',
    specificRisks: 'Riziká implantátov (kapsulárna kontraktúra, dislokácia) kombinované s rizikami mastopexie (dehiscencia v T-spoji, porucha prekrvenia dvorca, asymetria, zmeny citlivosti).',
    postopCare: {
      restAndPositioning: 'Spánok na chrbte 6 týždňov s vyvýšeným trupom.',
      compressionGarment: 'Nosenie kompresívnej podprsenky 24/7 po dobu 6–8 týždňov.',
      physicalRestrictions: 'Zákaz zdvíhania rúk a nosenia bremien 8 týždňov.',
      woundCare: 'Toaleta rán, silikónové krytie po zhojení.',
      environmentalRestrictions: 'Zákaz sauny a bazénov 8 týždňov; fotoprotekcia SPF 50+.',
      medication: 'Analgetiká, profylaxia ATB.',
      checkupSchedule: 'Preväz o 7–10 dní, kontrola po 1, 3, 6 mesiacoch a 1 roku.'
    }
  },

  // 14. ZMENŠENIE PRSNÍKOV (REDUKCIA)
  op_redukcia_prsnikov: {
    id: 'op_redukcia_prsnikov',
    keywords: ['redukcia_prsnikov', 'zmensenie prsnikov', 'redukcna mammaplastika', 'gigantomastia', 'hypertrofia prsnikov'],
    procedureName: 'Zmenšenie prsníkov (redukčná mammaplastika)',
    anatomicalArea: 'Bilaterálne, oblasť prsníkov, žľazového tkaniva a dvorcov',
    purposeAndNature: 'Odstránenie nadmerného objemu žľazového a tukového tkaniva prsníkov (hypertrofia/gigantomastia), úľava od bolestí chrbtice a šije, pozdvihnutie a zmenšenie dvorcov.',
    technique: 'Wise pattern incízia, resekcia prebytočného tkaniva prsníka, presun dvorca na hornej/dolnej stopke, modelácia žľazy, Redonove drény, viacvrstvová sutura.',
    anesthesiaType: 'Celková anestézia',
    alternatives: 'Nosenie špeciálnej redukčnej bielizne, redukcia hmotnosti, upustenie od operácie.',
    refusalConsequences: 'Pretrvávanie chronických bolestí chrbtice, zárezov od podprsenky a kožných infekcií v ryhách.',
    specificRisks: 'Hematóm, seróm, čiastočná/úplná nekróza dvorca, obmedzenie alebo strata schopnosti dojčenia (laktácie), znížená citlivosť, asymetria, hojenie per secundam.',
    postopCare: {
      restAndPositioning: 'Kľudový režim, spánok na chrbte 6 týždňov.',
      compressionGarment: 'Nosenie pooperačnej podprsenky 6–8 týždňov 24/7.',
      physicalRestrictions: 'Zákaz zdvíhania ťažkých bremien a športu 8 týždňov.',
      woundCare: 'Ošetrovanie drénov a rán, po zhojení silikónové prípravky.',
      environmentalRestrictions: 'Zákaz kúpania a sáun 8 týždňov.',
      medication: 'Analgetiká, prevencia TEN.',
      checkupSchedule: 'Extrakcia drénov 1.–2. deň, kontrola o 7–10 dní, kontroly po 1, 3 a 6 mesiacoch.'
    }
  },

  // 15. GYNEKOMASTIA
  op_gynekomastia: {
    id: 'op_gynekomastia',
    keywords: ['gynekomastia', 'muzs餘 prsia', 'zmensenie muzskych prsnikov', 'exstirpacia zlazy'],
    procedureName: 'Gynekomastia s liposukciou (chirurgická redukcia mužskej prsnej žľazy a tuku)',
    anatomicalArea: 'Bilaterálne, oblasť mužských prsníkov a hrudníka',
    purposeAndNature: 'Odstránenie zväčšeného fibroglandulárneho a tukového tkaniva u mužov na obnovenie mužského plochého hrudníka.',
    technique: 'Tumescencia, PAL liposukcia okolitého tuku, periareolárny semilunárny rez, exstirpácia prsnej žľazy (materiál odoslaný na histológiu), hemostáza, sutura a kompresívna vesta.',
    anesthesiaType: 'Celková anestézia alebo analgosedácia',
    alternatives: 'Endokrinologická liečba, redukcia telesného tuku cvičením, konzervatívny postup.',
    refusalConsequences: 'Pretrvávanie zväčšenia prsníkov a psychického diskomfortu.',
    specificRisks: 'Hematóm, seróm, vklesnutie dvorca (saucer deformity), asymetria, prechodná strata citlivosti dvorca, hypertrofická jazva.',
    postopCare: {
      restAndPositioning: 'Relatívny kľud, vyhýbať sa zaťažovaniu prsných svalov.',
      compressionGarment: 'Nosenie kompresívnej vesty 24/7 po dobu 4–6 týždňov.',
      physicalRestrictions: 'Zákaz posilňovania hrudníka a zdvíhania bremien 6 týždňov.',
      woundCare: 'Dezinfekcia periareolárneho rezu, masáže dvorca po zhojení.',
      environmentalRestrictions: 'Zákaz sauny, solária a bazénov 6 týždňov.',
      medication: 'Analgetiká.',
      checkupSchedule: 'Preväz o 7–10 dní, kontrola po 1 a 3 mesiacoch.'
    }
  },

  // 16. OTOPLASTIKA
  op_odstavajuce_usnice: {
    id: 'op_odstavajuce_usnice',
    keywords: ['odstavajuce_usnice', 'otoplastika', 'usi', 'korekcia usi', 'odstavajuce usi'],
    procedureName: 'Otoplastika (korekcia odstávajúcich ušníc)',
    anatomicalArea: 'Bilaterálne, ušnice a retroaurikulárna oblasť',
    purposeAndNature: 'Priblíženie ušníc k hlave, vytvarovanie reliéfu antihelixu a zmenšenie uhla odstávania.',
    technique: 'Retroaurikulárny rez za uchom, uvoľnenie a oslabenie chrupavky, modelačné matracové stehy na vytvorenie antihelixu, redukcia konchy, sutura kože a elastická fixačná bandáž.',
    anesthesiaType: 'Lokálna anestézia (u dospelých) alebo celková anestézia (u detí)',
    alternatives: 'Ponechanie pôvodného stavu.',
    refusalConsequences: 'Zotrvanie odstávania ušníc.',
    specificRisks: 'Hematóm ušnice (riziko nekrózy chrupavky), chondritída (zápal chrupavky), prerezanie stehov a relaps odstávania, asymetria, preležanina z obväzu, hypertrofická retroaurikulárna jazva.',
    postopCare: {
      restAndPositioning: 'Spánok na chrbte, nespať na bokoch, netlačiť na uši.',
      compressionGarment: 'Nosenie elastickej fixačnej čelenky 24/7 prvé 2 týždne, následne na noc ďalšie 4 týždne.',
      physicalRestrictions: 'Zákaz kontaktných a loptových športov 6–8 týždňov; opatrnosť pri obliekaní.',
      woundCare: 'Bandáž udržať suchú, uši nenamáčať do vybratia stehov.',
      environmentalRestrictions: 'Zákaz bazénov a sáun 4–6 týždňov.',
      medication: 'Analgetiká (prvé dni býva bolesť výraznejšia).',
      checkupSchedule: 'Preväz o 2–3 dni, vybratie stehov o 10–14 dní, kontrola po 1 a 3 mesiacoch.'
    }
  },

  // 17. LIP LIFT (BULLHORN)
  op_liplift: {
    id: 'op_liplift',
    keywords: ['liplift', 'lip lift', 'bullhorn', 'lifting pier', 'pery'],
    procedureName: 'Lifting hornej pery (Bullhorn Subnasal Lip Lift)',
    anatomicalArea: 'Subnazálna oblasť – priestor medzi spodkom nosa a červenou perou',
    purposeAndNature: 'Skrátenie predĺženého kožného segmentu hornej pery, zväčšenie expozície červene a horných zubov pri úsmeve, omladenie periorálnej oblasti.',
    technique: 'Incízia v tvare býčích rohov (bullhorn) presne pod nosovými dierkami a kolumelou. Excízia prebytku kože, fixácia hlbokých vrstiev SMAS k periostu nosového tŕňa (ANS), intradermálna sutura kože bez ťahu.',
    anesthesiaType: 'Lokálna anestézia',
    alternatives: 'Aplikácia kyseliny hyalurónovej do pery, botulotoxín (lip flip), konzervatívny postup.',
    refusalConsequences: 'Pretrvávanie dlhej a starnúcej hornej pery.',
    specificRisks: 'Viditeľná alebo hypertrofická jazva pod nosom, asymetria línie pery, ťah na nosové dierky, prechodná znížená citlivosť pery.',
    postopCare: {
      restAndPositioning: 'Spánok na chrbte so zvýšenou hlavou.',
      compressionGarment: 'Ponechanie náplastí prvé dni.',
      physicalRestrictions: 'Obmedziť mimiku a široký úsmev prvé 2 týždne, mäkká strava.',
      woundCare: 'Čistenie rany pod nosom, aplikácia antibiotickej masti/Octeniseptu, po zhojení silikónový gél.',
      environmentalRestrictions: 'Zákaz sauny, solária a horúcich nápojov 4 týždne; UV ochrana SPF 50+.',
      medication: 'Analgetiká.',
      checkupSchedule: 'Vybratie stehov na 5.–7. deň, kontrola po 1 a 3 mesiacoch.'
    }
  },

  // 18. LIFTING PAŽÍ (BRACHIOPLASTIKA)
  op_armlift: {
    id: 'op_armlift',
    keywords: ['armlift', 'brachioplastika', 'lifting pazi', 'paze', 'ramena'],
    procedureName: 'Brachioplastika (lifting a redukcia kože paží)',
    anatomicalArea: 'Bilaterálne, vnútorná plocha paží od axily po lakeť',
    purposeAndNature: 'Odstránenie ovisnutej kože a tuku na vnútornej strane paží po výraznej redukcii hmotnosti.',
    technique: 'Pozdĺžna incízia na vnútornej strane paže (prípadne v kombinácii s liposukciou), excízia kožno-tukového nadbytku so šetrením ciev a nervov, viacvrstvová sutura a kompresívne návleky.',
    anesthesiaType: 'Celková anestézia',
    alternatives: 'Samostatná liposukcia paží, rádiofrekvencia, konzervatívny postup.',
    refusalConsequences: 'Pretrvávanie ochabnutej kože paží („netopierie krídla“).',
    specificRisks: 'Dlhá viditeľná jazva na vnútornej strane paže, hypertrofické jazvenie, lymfedém paže/predlaktia, seróm, znížená citlivosť.',
    postopCare: {
      restAndPositioning: 'Polohovanie horných končatín na vankúšoch vo vyvýšenej polohe.',
      compressionGarment: 'Nosenie kompresívnych elastických rukávov 24/7 po dobu 6 týždňov.',
      physicalRestrictions: 'Zákaz zdvíhania ťažkých bremien a cvičenia paží 6–8 týždňov.',
      woundCare: 'Toaleta jaziev, po zhojení silikónové náplasti a tlakové masáže.',
      environmentalRestrictions: 'Zákaz sauny a kúpania 6 týždňov; ochrana pred slnkom SPF 50+.',
      medication: 'Analgetiká, prevencia TEN.',
      checkupSchedule: 'Preväz o 7–10 dní, kontrola po 1 a 3 mesiacoch.'
    }
  },

  // 19. KARPÁLNY TUNEL
  op_karpal: {
    id: 'op_karpal',
    keywords: ['karpal', 'karpalny tunel', 'dekompresia', 'n. medianus'],
    procedureName: 'Dekompresia karpálneho tunela (discízia retinaculum flexorum)',
    anatomicalArea: 'Dlaňová strana zápästia a ruky (karpálny kanál)',
    purposeAndNature: 'Uvoľnenie útlaku stredového nervu (nervus medianus) v karpálnom tuneli na odstránenie tŕpnutia, nočných bolestí a obnovu svalovej sily ruky.',
    technique: 'Krátky pozdĺžny rez v dlani medzi thenarom a hypothenarom v lokálnom zvodovom bloku. Preťatie ligamentum carpi transversum, deliberácia n. medianus, hemostáza, sutura kože a elastická bandáž.',
    anesthesiaType: 'Lokálna / zvodová anestézia (karpálny blok)',
    alternatives: 'Konzervatívna liečba: ortéza na noc, lokálna aplikácia kortikoidov, rehabilitácia.',
    refusalConsequences: 'Progresia útlaku n. medianus s trvalou atrofiou svalov thenaru a nezvratnou stratou citlivosti prstov.',
    specificRisks: 'Pretrvávajúca bolesť v mieste jazvy (pillar pain), hematóm, infekcia, poškodenie senzitívnej vetvy nervu, recidíva útlaku.',
    postopCare: {
      restAndPositioning: 'Polohovanie končatiny vo zvýšenej polohe, cvičenie prstov od 1. pooperačného dňa.',
      compressionGarment: 'Fixačný obväz prvé dni.',
      physicalRestrictions: 'Zákaz ťažkého úchopu a manuálnej záťaže ruky 4–6 týždňov.',
      woundCare: 'Ranu udržať suchú do vybratia stehov (12.–14. deň).',
      environmentalRestrictions: 'Nenamáčať ruku do vody.',
      medication: 'Analgetiká, vitamíny skupiny B (Milgamma).',
      checkupSchedule: 'Vybratie stehov o 12–14 dní, kontrola funkcie ruky o 1 mesiac.'
    }
  }
};

const STORAGE_KEY = 'sayclinic_surgery_consent_templates';
const DELETED_STORAGE_KEY = 'sayclinic_surgery_consent_deleted_ids';

// Zoznam ID zmazaných šablón (vrátane predvolených)
export function getDeletedSurgeryConsentIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(DELETED_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error('Chyba pri načítaní zoznamu zmazaných šablón:', e);
    return [];
  }
}

// Získanie aktívnej databázy šablón (predvolené + používateľské úpravy z localStorage - zmazané)
export function getSurgeryConsentDatabase(): Record<string, SurgeryConsentProfile> {
  if (typeof window === 'undefined') {
    return SURGERY_CONSENT_DATABASE;
  }
  try {
    const deletedIds = new Set(getDeletedSurgeryConsentIds());
    const saved = localStorage.getItem(STORAGE_KEY);
    const custom: Record<string, SurgeryConsentProfile> = saved ? JSON.parse(saved) : {};

    const activeDb: Record<string, SurgeryConsentProfile> = {};

    // 1. Pridať všetky predvolené šablóny, ktoré neboli zmazané
    for (const [k, v] of Object.entries(SURGERY_CONSENT_DATABASE)) {
      if (!deletedIds.has(k)) {
        activeDb[k] = v;
      }
    }

    // 2. Prepísať upravenými alebo pridať nové vlastné šablóny, pokiaľ neboli zmazané
    for (const [k, v] of Object.entries(custom)) {
      if (!deletedIds.has(k)) {
        activeDb[k] = v;
      }
    }

    return activeDb;
  } catch (e) {
    console.error('Chyba pri načítaní šablón z localStorage:', e);
  }
  return SURGERY_CONSENT_DATABASE;
}

// Uloženie konkrétnej šablóny (úprava existujúcej/predvolenej alebo vytvorenie novej)
export function saveSurgeryConsentProfile(profile: SurgeryConsentProfile): void {
  if (typeof window === 'undefined') return;
  try {
    const currentCustom = getCustomSurgeryConsentDatabase();
    currentCustom[profile.id] = profile;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentCustom));

    // Ak bola šablóna predtým v zozname zmazaných, vymažeme ju zo zmazaných
    const deletedIds = getDeletedSurgeryConsentIds().filter(id => id !== profile.id);
    localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(deletedIds));
  } catch (e) {
    console.error('Chyba pri ukladaní šablóny do localStorage:', e);
  }
}

// Vymazanie akejkoľvek šablóny (aj predvolenej, aj vlastnej)
export function deleteSurgeryConsentProfile(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    // 1. Vymazať z custom databázy
    const currentCustom = getCustomSurgeryConsentDatabase();
    if (currentCustom[id]) {
      delete currentCustom[id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentCustom));
    }

    // 2. Pridať do zoznamu zmazaných ID, aby sa nezobrazovala ani predvolená výrobná šablóna
    const deletedIds = getDeletedSurgeryConsentIds();
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(deletedIds));
    }
  } catch (e) {
    console.error('Chyba pri mazaní šablóny:', e);
  }
}

// Uloženie celej databázy šablón
export function saveAllSurgeryConsentProfiles(database: Record<string, SurgeryConsentProfile>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
    // Vyčistiť zoznam zmazaných, lebo celá databáza sa nanovo ukladá
    localStorage.removeItem(DELETED_STORAGE_KEY);
  } catch (e) {
    console.error('Chyba pri ukladaní šablón do localStorage:', e);
  }
}

// Získanie iba používateľsky upravených alebo pridaných šablón
export function getCustomSurgeryConsentDatabase(): Record<string, SurgeryConsentProfile> {
  if (typeof window === 'undefined') return {};
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Chyba pri načítaní custom šablón:', e);
  }
  return {};
}

// Obnovenie konkrétnej šablóny na pôvodnú predvolenú hodnotu
export function resetSurgeryConsentProfile(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const currentCustom = getCustomSurgeryConsentDatabase();
    if (currentCustom[id]) {
      delete currentCustom[id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentCustom));
    }
    const deletedIds = getDeletedSurgeryConsentIds().filter(dId => dId !== id);
    localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(deletedIds));
  } catch (e) {
    console.error('Chyba pri resetovaní šablóny:', e);
  }
}

// Obnovenie všetkých šablón na výrobné/predvolené nastavenie
export function resetAllSurgeryConsentProfiles(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DELETED_STORAGE_KEY);
  } catch (e) {
    console.error('Chyba pri resete všetkých šablón:', e);
  }
}

// Export šablón do JSON reťazca
export function exportSurgeryConsentProfilesJson(): string {
  const db = getSurgeryConsentDatabase();
  return JSON.stringify(db, null, 2);
}

// Import šablón z JSON reťazca
export function importSurgeryConsentProfilesJson(jsonStr: string): boolean {
  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed && typeof parsed === 'object') {
      saveAllSurgeryConsentProfiles(parsed);
      return true;
    }
  } catch (e) {
    console.error('Neplatný JSON pre šablóny informovaného súhlasu:', e);
  }
  return false;
}

// Pomocná funkcia na inteligentné vyhľadanie profilu operácie
export function findSurgeryConsentProfile(query: string, defaultAnesthesia = 'Celková anestézia'): SurgeryConsentProfile {
  if (!query || query.trim() === '') {
    return getDefaultSurgeryConsentProfile('Plánovaný estetický chirurgický výkon', defaultAnesthesia);
  }

  const db = getSurgeryConsentDatabase();

  const normalized = query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  // 1. Priame ID párovanie
  if (db[query]) {
    return db[query];
  }

  // 2. Kľúčové slová a zhoda názvu
  for (const profile of Object.values(db)) {
    const normName强 = profile.procedureName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    
    if (normName强.includes(normalized) || normalized.includes(normName强)) {
      return profile;
    }

    for (const kw of profile.keywords || []) {
      const normKw = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (normalized.includes(normKw)) {
        return profile;
      }
    }
  }

  // 3. Fallback na zmysluplný default
  return getDefaultSurgeryConsentProfile(query, defaultAnesthesia);
}

export function getDefaultSurgeryConsentProfile(procedureName: string, anesthesiaType = 'Celková anestézia'): SurgeryConsentProfile {
  return {
    id: 'custom_procedure',
    keywords: [],
    procedureName: procedureName || 'Plánovaný estetický chirurgický výkon',
    anatomicalArea: 'Operovaná anatomická oblasť v zmysle plánu výkonu a lokálneho nálezu',
    purposeAndNature: `Účelom výkonu je estetická úprava, korekcia a harmonizácia tvaru v operovanej oblasti. Povaha výkonu: Invazívny chirurgický zákrok v plastickej a estetickej chirurgii vyžadujúci prerušenie celistvosti kože a podkožných štruktúr.`,
    technique: 'Vyplánovanie a predoperačné zakreslenie operačného poľa. Príprava operačného poľa a aplikácia anestézie. Vykonanie plánovaných incízií, preparácia tkanív s dôrazom na šetrenie cievnych a nervových štruktúr, hemostáza, viacvrstvová adaptácia a sutura operačných rán, aplikácia sterilného kompresívneho krytia.',
    anesthesiaType: anesthesiaType || 'Celková anestézia / Analgosedácia / Lokálna anestézia',
    alternatives: 'Konzervatívny postup, miniinvazívne estetické ošetrenia (výplne, botulotoxín, laser), upustenie od operačného zákroku.',
    refusalConsequences: 'Zotrvanie východiskového anatomického a vizuálneho stavu bez ohrozenia celkového zdravia.',
    specificRisks: 'Pooperačná bolesť, edém, tvorba hematómu alebo serómu, infekcia v operačnej rane, porucha hojenia rán (dehiscencia), asymetria, prechodné alebo trvalé zmeny citlivosti operovaných tkanív, nápadné hypertrofické alebo keloidné jazvy, možná potreba dodatočnej korekcie.',
    postopCare: {
      restAndPositioning: 'Kľudový režim na lôžku, polohovanie operovanej oblasti podľa pokynov operatéra, vyhnúť sa tlaku a ťahu na rany.',
      compressionGarment: 'Nosenie predpísanej kompresívnej alebo fixačnej bielizne / obväzov podľa pokynov lekára.',
      physicalRestrictions: 'Striktný zákaz ťažkej fyzickej práce, zdvíhania bremien a športových aktivít minimálne 4–6 týždňov.',
      woundCare: 'Rany udržiavať v suchu a čistote do vybratia stehov, dezinfekcia (Octenisept), po zhojení aplikácia silikónových gélov a tlakové masáže.',
      environmentalRestrictions: 'Zákaz sauny, bazénov, horúcich kúpeľov a solária 6 týždňov; striktná fotoprotekcia jaziev SPF 50+ minimálne 6–12 mesiacov.',
      medication: 'Analgetiká podľa bolesti, profylaktické antibiotiká a lieky proti opuchom podľa ordinácie.',
      checkupSchedule: 'Pravidelné kontroly podľa harmonogramu kliniky (preväz o 7–10 dní, kontrola po 1, 3 a 6 mesiacoch).'
    }
  };
}
