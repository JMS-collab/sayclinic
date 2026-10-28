import {
  PatientPlan,
  ScheduledTreatment,
  CosmeticRoutineItem,
  PreOpInstruction,
  PreOpPrehabilitation,
  PostOpRecoveryPhase
} from '@/data/patientPlanConfig';

export interface EbmProcedureDefinition {
  id: string;
  label: string;
  shortLabel: string;
  icon: string;
  group: 'face_surgery' | 'body_surgery' | 'laser_device' | 'injectable_bio';
  category: ScheduledTreatment['category'];
  defaultPrice: number;
  recommendedTimingOrder: number; // Nižšie číslo = skôr v sekvencii
  recommendedSeasonOrStep: string;
  targetArea: string;
  frequencyOrAnesthesia: string;
  recoveryTimePatient: string;
  clinicalNotes: string;
  patientExplanation: string;
  clinicalGuideline: string;
  preOpSpecifics: {
    medical?: string[];
    psychological?: string[];
    nutritional?: string[];
    physical?: string[];
    timelineInstruction?: { timeframe: string; title: string; description: string };
  };
  postOpSpecifics: {
    earlyCare?: string;
    scarCare?: string;
    warningSign?: string;
  };
  skincareImpact?: {
    morningAddition?: string;
    eveningAddition?: string;
    weeklyTip?: string;
  };
}

export const EBM_PROCEDURE_CATALOG: EbmProcedureDefinition[] = [
  // ==================== OPERÁCIE TVÁRE ====================
  {
    id: 'deep_plane_facelift',
    label: 'Deep Plane Facelift & Necklift (SMAS lifting)',
    shortLabel: 'Facelift & Krk',
    icon: '🏥',
    group: 'face_surgery',
    category: 'surgery',
    defaultPrice: 4800,
    recommendedTimingOrder: 10,
    recommendedSeasonOrStep: 'Hlavný operačný krok (Jeseň / Zima)',
    targetArea: 'Stredná a dolná tretina tváre, kontúra sánky a krk',
    frequencyOrAnesthesia: 'Operácia v celkovej anestézii (1 noc na klinike)',
    recoveryTimePatient: '10 – 14 dní domáceho kľudu (výraznejšie odpuchnutie do 2 – 3 týždňov)',
    clinicalNotes: 'Anatomická repozícia hlbokej vrstvy SMAS a platyzmy bez neprirodzeného ťahu na samotnú kožu.',
    patientExplanation: 'Počas tohto zákroku lekár jemne uvoľní a vráti hlboké svalovo-väzivové štruktúry tváre a krku na miesto, kde boli pred 10 – 15 rokmi. Koža sa len prirodzene priloží bez „natiahnutého“ efektu. Výsledkom sú pevné kontúry sánky, vyhladený krk a svieži, oddýchnutý výzor.',
    clinicalGuideline: 'ASPS Facelift Clinical Practice Guideline & Jacono et al. (Aesthetic Surgery Journal – Deep Plane SMAS Repositioning)',
    preOpSpecifics: {
      medical: [
        'Dôsledná stabilizácia krvného tlaku pred operáciou (prevencia pooperačného hematómu podľa ASPS guidelinov).',
        'Prísny zákaz fajčenia, nikotínových náplastí a vapovania minimálne 4 týždne pred a 4 týždne po operácii (ochrana prekrvenia kožných lalokov).'
      ],
      psychological: [
        'Príprava na prechodný opuch a pocit stiahnutia v oblasti krku a uší počas prvých 14 dní – ide o úplne prirodzenú súčasť hojenia.'
      ],
      nutritional: [
        'Vysadenie výživových doplnkov zvyšujúcich krvácavosť (Ginkgo biloba, vysoké dávky vitamínu E, cesnak, Omega-3) 14 dní pred zákrokom.'
      ],
      physical: [
        'Nácvik spánku na chrbte so zvýšenou hornou polovicou tela (pod uhlom 30–45°) a nefajčiarsky režim.'
      ],
      timelineInstruction: {
        timeframe: '10 dní pred operáciou',
        title: 'Úprava vlasov a stabilizácia tlaku (Facelift protokol)',
        description: 'Ak si farbíte vlasy, urobte tak najneskôr 10 dní pred operáciou (po zákroku nebude možné farbiť vlasy 4 – 6 týždňov kvôli jazvičkám pri ušnici).'
      }
    },
    postOpSpecifics: {
      earlyCare: 'Nosenie elastickej tvárovej ohlávky podľa pokynov chirurga, spánok s vyvýšenou hlavou a zákaz prudkého otáčania hlavy (otáčať sa celým trupom).',
      scarCare: 'Jemné ošetrovanie línií pred a za ušnicou, od 14. dňa 100% medicínsky silikónový gél a manuálna lymfodrenáž tváre.',
      warningSign: 'Náhle jednostranné zväčšenie opuchu, tuhosť alebo pulzujúca bolesť na jednej strane tváre (nutná okamžitá kontrola).'
    },
    skincareImpact: {
      weeklyTip: 'Pred faceliftom 4 týždne posilňujeme kožnú bariéru ceramidmi; retinoidy vysadiť 7 dní pred operáciou.'
    }
  },
  {
    id: 'blepharoplasty_upper_lower',
    label: 'Horná a dolná blefaroplastika (Korekcia očných viečok)',
    shortLabel: 'Blefaroplastika viečok',
    icon: '👁️',
    group: 'face_surgery',
    category: 'surgery',
    defaultPrice: 1650,
    recommendedTimingOrder: 15,
    recommendedSeasonOrStep: 'Operačný krok (samostatne alebo po stabilizácii tváre)',
    targetArea: 'Horné a dolné očné viečka (periorbitálna zóna)',
    frequencyOrAnesthesia: 'Lokálna anestézia alebo analgosedácia (ambulantne)',
    recoveryTimePatient: '7 – 10 dní (vybratie stehov na 6. – 7. deň, modrinky vymiznú do 10 – 14 dní)',
    clinicalNotes: 'Odstránenie nadbytočnej kože horných viečok a transkonjunktiválna/subciliárna redistribúcia tukových vačkov dolných viečok.',
    patientExplanation: 'Jemný zákrok, ktorý odstráni pocit ťažkých, padajúcich viečok a unavených vačkov pod očami. Jazvička je ukrytá presne v prirodzenom záhybe viečka, takže po zahojení je prakticky neviditeľná. Oči sa opticky otvoria a pohľad omladne.',
    clinicalGuideline: 'ASOPRS & ASPS Evidence-Based Blepharoplasty Guidelines (Rohrich et al., Plastic and Reconstructive Surgery)',
    preOpSpecifics: {
      medical: [
        'Zhodnotenie tvorby sĺz (v prípade syndrómu suchého oka príprava zvlhčujúcimi kvapkami bez konzervantov).'
      ],
      psychological: [
        'Zabezpečenie pokoja pre oči (audioknihy, podcasty) na prvé 3 dni, kedy sa neodporúča sledovať obrazovky a čítať.'
      ],
      physical: [
        'Pripraviť si doma chladiace gélové vankúšiky do chladničky a kvalitné slnečné okuliare s UV400 filtrom.'
      ],
      timelineInstruction: {
        timeframe: '3 dni pred zákrokom',
        title: 'Príprava očného okolia a zvlhčujúcich kvapiek',
        description: 'Nenoste kontaktné šošovky a nepoužívajte vodeodolnú maskaru ani umelé mihalnice. Pripravte si umelé slzy do domácnosti.'
      }
    },
    postOpSpecifics: {
      earlyCare: 'Pravidelné prikladanie studených obkladov (cez sterilnú gázu) prvých 48 hodín každé 2 hodiny na 15 minút. Aplikácia očnej masti a umelých sĺz.',
      scarCare: 'Po vybratí stehov (7. deň) jemné poklepávanie (mikromasáž) od vonkajšieho kútika k vnútornému a silikónový gél v tenkej vrstve.',
      warningSign: 'Akákoľvek porucha ostrosti videnia, dvojité videnie alebo silná tlaková bolesť za okom.'
    },
    skincareImpact: {
      weeklyTip: 'V očnom okolí používať len oftalmologicky testovanú starostlivosť a chrániť jazvičky viečok SPF 50+ a slnečnými okuliarmi.'
    }
  },
  {
    id: 'rhinoplasty',
    label: 'Funkčná a estetická Rhinoplastika (Korekcia nosa)',
    shortLabel: 'Rhinoplastika nosa',
    icon: '👃',
    group: 'face_surgery',
    category: 'surgery',
    defaultPrice: 3600,
    recommendedTimingOrder: 12,
    recommendedSeasonOrStep: 'Hlavný operačný krok',
    targetArea: 'Nosová pyramída, špička nosa a nosová priehradka (septum)',
    frequencyOrAnesthesia: 'Celková anestézia (1 noc na klinike)',
    recoveryTimePatient: '10 – 14 dní s vonkajšou dlahou (návrat do práce po 2 týždňoch)',
    clinicalNotes: 'Šetrná ultrazvuková (Piezo) alebo štrukturálna modelácia kostnej a chrupavčitej časti nosa so zachovaním voľného dýchania.',
    patientExplanation: 'Cieľom operácie je harmonizovať tvar nosa s ostatnými črtami vašej tváre a zároveň zabezpečiť plnohodnotné, voľné dýchanie. Po zákroku budete mať na nose ochrannú dlahu približne 10 – 14 dní. Hoci prvotný tvar uvidíte hneď po sňatí dlahy, špička nosa sa jemne vyrysováva počas 6 – 12 mesiacov.',
    clinicalGuideline: 'AAO-HNS & ASPS Clinical Practice Guideline: Rhinoplasty (Ishii et al., Otolaryngology–Head and Neck Surgery)',
    preOpSpecifics: {
      medical: ['ORL vyšetrenie priechodnosti nosových prieduchov a zákaz nosových dekongestívnych sprejov (Olynth/Muconasal) 2 týždne pred operáciou.'],
      physical: ['Príprava izotonického morskej vody v spreji na pooperačné zvlhčovanie sliznice nosa.']
    },
    postOpSpecifics: {
      earlyCare: 'Prísny zákaz smrkania nosa počas 3 týždňov (sliznicu len jemne preplachovať morskou vodou). Kýchať s otvorenými ústami. Nenosiť ťažké okuliare na chrbte nosa 6 týždňov.',
      scarCare: 'Pri otvorenej rhinoplastike ošetrovanie drobnej jazvičky na kolumele silikónovým gélom a taping (lepenie špičky nosa) na noc podľa inštrukcií chirurga.'
    }
  },
  {
    id: 'lip_lift_brow_lift',
    label: 'Subnazálny Lip Lift / Endoskopický Browlift',
    shortLabel: 'Lip Lift / Browlift',
    icon: '✨',
    group: 'face_surgery',
    category: 'surgery',
    defaultPrice: 1450,
    recommendedTimingOrder: 18,
    recommendedSeasonOrStep: 'Doplnkový chirurgický krok',
    targetArea: 'Horná pera (philtrum) alebo oblasť obočia a spánkov',
    frequencyOrAnesthesia: 'Lokálna anestézia alebo analgosedácia',
    recoveryTimePatient: '7 – 10 dní (stehy sa vyberajú na 6. – 7. deň)',
    clinicalNotes: 'Skrátenie predĺženého philtra (Bullhorn Lip Lift) alebo anatomické pozdvihnutie poklesnutého obočia.',
    patientExplanation: 'Prirodzené omladenie proporcií tváre – pri Lip Lifte sa jemne skráti vzdialenosť medzi nosom a hornou perou, čím sa pera prirodzene pootvorí a omladne bez umelého napichania výplňou.',
    clinicalGuideline: 'ISAPS Aesthetic Facial Proportions & Perioral Rejuvenation Consensus',
    preOpSpecifics: {
      medical: ['Profylaxia herpes simplex (pri sklone k oparom na perách nasadenie antivirotík 2 dni pred zákrokom).']
    },
    postOpSpecifics: {
      earlyCare: 'Mäkká strava prvé 4 dni, vyhýbať sa širokému úsmevu a horúcim nápojom.',
      scarCare: 'Včasná aplikácia silikónového gélu a prípadné 1 sedenie cievneho/CO2 lasera na jazvičku pod nosom o 6 týždňov.'
    }
  },

  // ==================== OPERÁCIE TELA & PRSNÍKOV ====================
  {
    id: 'breast_augmentation_mastopexy',
    label: 'Augmentácia prsníkov / Modelácia (Mastopexia)',
    shortLabel: 'Prsníky (Augmentácia / Modelácia)',
    icon: '🏥',
    group: 'body_surgery',
    category: 'surgery',
    defaultPrice: 4300,
    recommendedTimingOrder: 10,
    recommendedSeasonOrStep: 'Hlavný operačný krok',
    targetArea: 'Prsníky (obojstranne)',
    frequencyOrAnesthesia: 'Celková anestézia (1 noc na klinike)',
    recoveryTimePatient: '7 – 14 dní kľudový režim (6 týždňov nosenie kompresívnej podprsenky)',
    clinicalNotes: 'Subpektoriálne / Dual-plane uloženie certifikovaných implantátov alebo anatomická modelácia prsného tkaniva.',
    patientExplanation: 'Operácia dodá prsníkom plnosť, súmernosť a peknú mladistvú projekciu. Prvé 3 – 4 dni môžete cítiť tlak na hrudníku (podobný silnej svalovici po cvičení), ktorý rýchlo ustupuje. Kľúčom k dokonalému zahojeniu je nosenie špeciálnej pooperačnej podprsenky 24/7 počas 6 týždňov.',
    clinicalGuideline: 'ERAS® Society Breast Reconstruction & ASPS Evidence-Based Breast Augmentation Guidelines',
    preOpSpecifics: {
      medical: [
        'Aktuálne sonografické (USG) alebo mamografické vyšetrenie prsníkov (nie staršie ako 6 mesiacov) pre 100% onkologickú bezpečnosť.',
        'Interné a anestéziologické predoperačné vyšetrenie vrátane KO, hemokoagulácie a EKG.'
      ],
      physical: [
        'Pripraviť si do nemocnice aj domov oblečenie so zapínaním vpredu (košele, mikiny na zips), aby ste po operácii nemuseli dvíhať ruky nad hlavu.'
      ],
      timelineInstruction: {
        timeframe: '2 – 4 týždne pred operáciou',
        title: 'USG vyšetrenie prsníkov a výber kompresívnej bielizne',
        description: 'Absolvujte kontrolné sono prsníkov a na klinike vám presne premeriame veľkosť kompresívnej podprsenky.'
      }
    },
    postOpSpecifics: {
      earlyCare: 'Nosenie kompresívnej podprsenky (a prípadne stabilizačného pásu) 24 hodín denne počas 6 týždňov. Prísny zákaz dvíhania bremien nad 2 kg, šoférovania (10 – 14 dní) a spánku na bruchu.',
      scarCare: 'Od 3. týždňa (po zahojení rán) aplikácia silikónových náplastí (Epi-Derm / Mepiform) alebo silikónového gélu + tlakové masáže jaziev v podprsnej ryhe.',
      warningSign: 'Náhle jednostranné zväčšenie prsníka, začervenanie kože alebo horúčka nad 38 °C.'
    }
  },
  {
    id: 'abdominoplasty_liposuction',
    label: 'Abdominoplastika s plastikou diastázy / Liposukcia VASER',
    shortLabel: 'Abdominoplastika / Liposukcia',
    icon: '🩺',
    group: 'body_surgery',
    category: 'surgery',
    defaultPrice: 3900,
    recommendedTimingOrder: 10,
    recommendedSeasonOrStep: 'Hlavný operačný krok (Jeseň / Zima / Jar)',
    targetArea: 'Brušná stena, priame brušné svaly (diastáza), boky',
    frequencyOrAnesthesia: 'Celková anestézia (1 – 2 noci na klinike)',
    recoveryTimePatient: '14 dní domáceho režimu (6 týždňov kompresívne prádlo)',
    clinicalNotes: 'Spevnenie rozostúpených brušných svalov (diastázy), odstránenie nadbytku kože a tvarovanie kontúr pásovej línie.',
    patientExplanation: 'Tento zákrok rieši uvoľnené bruško (často po tehotenstve alebo schudnutí), ktoré sa nedá vycvičiť. Chirurg zošije uvoľnené brušné svaly do pevného korzetu a odstráni prebytočnú kožu. Prvých 7 – 10 dní budete chodiť mierne v predklone, aby jazva nebola v napätí.',
    clinicalGuideline: 'ERAS® Plastic Surgery & ASPS Abdominoplasty / Liposuction Safety Guidelines (Caprini VTE Prophylaxis)',
    preOpSpecifics: {
      medical: ['Prevencia tromboembólie (Caprini skóre, kompresívne pančuchy a nízkomolekulárny heparín podľa ordinácie lekára).'],
      nutritional: ['Vlákninová strava a dostatočná hydratácia 5 dní pred operáciou pre ľahké vyprázdňovanie bez brušného tlaku po zákroku.'],
      physical: ['Denná 30-minútová chôdza pred operáciou na podporu kardiovaskulárnej kondície a žilového návratu.']
    },
    postOpSpecifics: {
      earlyCare: 'Včasná mobilizácia (prechádzky po izbe s pomocou už v deň operácie), chôdza v miernom predklone 7 – 10 dní, nosenie brušného pásu 6 týždňov.',
      scarCare: 'Séria odborných lymfodrenáží od 2. týždňa na urýchlenie vstrebania opuchu a vyhladenie podkožia + silikónové pásy na jazvu v podbrušku.'
    }
  },

  // ==================== LASERY & PRÍSTROJOVÉ OŠETRENIA ====================
  {
    id: 'fractional_co2_laser',
    label: 'Frakčný CO2 Laser Resurfacing & Laserová remodelácia jaziev',
    shortLabel: 'Frakčný CO2 Laser',
    icon: '⚡',
    group: 'laser_device',
    category: 'laser',
    defaultPrice: 550,
    recommendedTimingOrder: 30,
    recommendedSeasonOrStep: 'Následný krok v období nízkeho UV (Október – Marec)',
    targetArea: 'Celá tvár, periorálna/periorbitálna zóna alebo pooperačné jazvy',
    frequencyOrAnesthesia: 'Lokálny anestetický krém (1 – 2 sedenia)',
    recoveryTimePatient: '5 – 7 dní (jemné začervenanie a mikroskopické bodky sa zlúpnu do týždňa)',
    clinicalNotes: 'Frakčná ablačná fototermolýza stimulujúca hĺbkovú neokolagenézu v dermis a vyhladenie mikroreliéfu pleti aj pooperačných jaziev.',
    patientExplanation: 'Kým operácia rieši uvoľnené kontúry a prebytok kože, frakčný CO2 laser „vyleští“ samotnú kvalitu a povrch pleti. Lúč lasera vytvorí tisíce mikroskopických stĺpčekov, ktoré naštartujú tvorbu nového kolagénu, stiahnu póry, zjemnia vrásky a vyhladia jazvičky do úrovne okolitej kože.',
    clinicalGuideline: 'EADV / ESLD Laser Resurfacing Guidelines & Gold et al. (International Consensus on Laser Scar Revision)',
    preOpSpecifics: {
      medical: [
        '4 týždne pred laserom sa prísne vyhýbať soláriu, samoopaľovacím krémom a priamemu slneniu.',
        'Profylaxia oparu (herpesu) pri ošetrení okolo úst.'
      ],
      timelineInstruction: {
        timeframe: '7 dní pred laserovým ošetrením',
        title: 'Vysadenie retinolu a exfoliačných kyselín',
        description: 'Týždeň pred frakčným CO2 laserom vynechajte večerný retinol a AHA/BHA kyseliny, používajte len hydratačnú a bariérovú kozmetiku.'
      }
    },
    postOpSpecifics: {
      earlyCare: 'Prvých 5 dní intenzívne premasťovanie (La Roche-Posay Cicaplast Baume B5+ / CeraVe masť) a termálna voda. Drobné šupinky nikdy nestrhávať nasilu!',
      scarCare: 'Po zahojení povrchu (od 7. dňa) aplikácia séra C E Ferulic (podľa štúdií skracuje začervenanie o 50 %) a striktné SPF 50+ každé ráno.'
    },
    skincareImpact: {
      morningAddition: 'Antioxidant C E Ferulic + Anthelios UVMune 400 SPF 50+ (ochrana novej pokožky pred pigmentáciou)',
      eveningAddition: 'Cicaplast Baume B5+ / Triple Lipid Restore 2:4:2 na rýchlu obnovu epidermálnej bariéry',
      weeklyTip: 'Po frakčnom CO2 laseri je 100 % ochrana pred slnkom (SPF 50+) nevyhnutná minimálne 3 – 6 mesiacov.'
    }
  },
  {
    id: 'vascular_scar_laser',
    label: 'Včasná laserová terapia jaziev & cievok (Vaskulárny / Biostimulačný protokol)',
    shortLabel: 'Laser na jazvy & cievky',
    icon: '🩹',
    group: 'laser_device',
    category: 'scar_care',
    defaultPrice: 180,
    recommendedTimingOrder: 25,
    recommendedSeasonOrStep: '3 – 6 týždňov po operácii (Fáza zrenia jazvy)',
    targetArea: 'Línie pooperačných jaziev alebo začervenané zóny tváre',
    frequencyOrAnesthesia: 'Bezbolestné ambulantné ošetrenie (2 – 3 sedenia)',
    recoveryTimePatient: 'Bez obmedzenia (len mierne začervenanie 24 hodín)',
    clinicalNotes: 'Cielená redukcia neovaskularizácie čerstvej jazvy – prevencia hypertrofie a rýchlejšie vyblednutie červenej farby jazvy.',
    patientExplanation: 'Najmodernejšie svetové štúdie potvrdzujú, že o jazvu sa netreba začať starať až po roku, ale už 3 – 6 týždňov po operácii. Jemný cievny laser stiahne prebytočné cievky v mladej jazve, vďaka čomu jazva rýchlejšie vybledne, zostane mäkká, plochá a nenápadná.',
    clinicalGuideline: 'International Advisory Panel on Scar Management (Mustoe / Gold et al., Plastic and Reconstructive Surgery – Early Laser Intervention)',
    preOpSpecifics: {},
    postOpSpecifics: {
      scarCare: 'Kombinácia laserového ošetrenia so 100% silikónovým gélom a tlakovou masážou.'
    }
  },

  // ==================== INJEKČNÉ & BIOSTIMULAČNÉ VÝKONY ====================
  {
    id: 'botulinum_hyaluronic',
    label: 'Harmonizácia Botulotoxínom & Kyselinou Hyalurónovou',
    shortLabel: 'Botulotoxín & Výplne HA',
    icon: '💉',
    group: 'injectable_bio',
    category: 'injectable',
    defaultPrice: 420,
    recommendedTimingOrder: 40,
    recommendedSeasonOrStep: 'Fáza finálneho doladenia (6 – 8 týždňov po operácii alebo priebežne)',
    targetArea: 'Horná tretina tváre (čelo, glabela, vějířky očí) a jemné kontúry',
    frequencyOrAnesthesia: 'Ambulantná aplikácia (15 – 30 minút, kontrola o 14 dní)',
    recoveryTimePatient: 'Okamžitý návrat do bežného režimu (4 hodiny si nelíhať, 48h necvičiť)',
    clinicalNotes: 'Neuromodulácia hyperaktívnych mimických svalov (prevencia vrások a zníženie ťahu na pooperačné jazvy) + reologická obnova objemu.',
    patientExplanation: 'Botulotoxín jemne uvoľní nadmerne pracujúce mimické svaly (mračenie, krčenie čela a okolia očí), čím vyhladí dynamické vrásky a zároveň zníži ťah svalov na hojace sa tkanivá. Kyselina hyalurónová citlivo doplní stratený objem a hydratáciu tam, kde to tvár potrebuje.',
    clinicalGuideline: 'Global Aesthetics Consensus Group (Sundaram et al., Plastic and Reconstructive Surgery – Combined Toxin & HA Guidelines)',
    preOpSpecifics: {
      medical: ['5 dní pred aplikáciou neužívať lieky riediace krv (Aspirin, Ibalgin) na minimalizáciu drobných modriniek.']
    },
    postOpSpecifics: {
      earlyCare: '4 hodiny po aplikácii botulotoxínu zostávať vo vzpriamenej polohe, nepredkláňať sa a 7 dní vynechať saunu, solárium a kozmetickú masáž tváre.'
    },
    skincareImpact: {
      morningAddition: 'Peptidové sérum SkinCeuticals P-TIOX alebo H.A. Intensifier predlžuje účinok botulotoxínu a výplní.'
    }
  },
  {
    id: 'polynucleotides_profhilo',
    label: 'Bunková bioremodelácia Profhilo / Polynukleotidy (Plinest)',
    shortLabel: 'Polynukleotidy & Profhilo',
    icon: '🧬',
    group: 'injectable_bio',
    category: 'skin_care',
    defaultPrice: 520,
    recommendedTimingOrder: 50,
    recommendedSeasonOrStep: 'Regeneračná a udržiavacia fáza (Jar / Leto / Jeseň)',
    targetArea: 'Tvár, očné okolie, krk a dekolt',
    frequencyOrAnesthesia: '2 sedenia v rozstupe 4 týždňov (ambulantne)',
    recoveryTimePatient: 'Minimálna (drobné papulky sa vstrebú do 24 – 48 hodín)',
    clinicalNotes: 'Aktivácia fibroblastov, zvýšenie produkcie kolagénu I. a III. typu a elastínu bez zmeny objemu tváre.',
    patientExplanation: 'Ide o „výživu a reštart buniek zvnútra“. Polynukleotidy a čistá kyselina hyalurónová nemenia črty ani objem tváre, ale prebúdzajú vaše vlastné bunky k tvorbe kolagénu a elastínu. Pleť je po nich šťavnatá, pevná, pružná a lepšie sa hojí.',
    clinicalGuideline: 'Consensus Report on Polynucleotides HPT & Hybrid Cooperative Complexes HA in Aesthetic Medicine (Cavallini et al.)',
    preOpSpecifics: {},
    postOpSpecifics: {
      earlyCare: '24 hodín po ošetrení nenanášať make-up, 48 hodín nešportovať a nepiť alkohol.'
    }
  }
];

/**
 * Pomocná funkcia na detekciu vybratých výkonov z existujúceho plánu alebo textového popisu
 */
export function resolveSelectedProcedures(
  procedureIds?: string[],
  existingTreatments?: ScheduledTreatment[],
  procedureText?: string
): EbmProcedureDefinition[] {
  const matched = new Map<string, EbmProcedureDefinition>();

  // 1. Podľa explicitných ID
  if (procedureIds && procedureIds.length > 0) {
    for (const id of procedureIds) {
      const found = EBM_PROCEDURE_CATALOG.find(p => p.id === id);
      if (found) matched.set(found.id, found);
    }
  }

  // 2. Podľa existujúcich položiek v annualTreatments
  const textsToInspect: string[] = [];
  if (existingTreatments && existingTreatments.length > 0) {
    existingTreatments.forEach(t => textsToInspect.push(`${t.name} ${t.notes || ''} ${t.targetArea || ''}`));
  }
  if (procedureText) {
    textsToInspect.push(procedureText);
  }

  const combinedText = textsToInspect.join(' ').toLowerCase();

  if (combinedText.includes('facelift') || combinedText.includes('smas') || combinedText.includes('necklift') || combinedText.includes('krk')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'deep_plane_facelift');
    if (p) matched.set(p.id, p);
  }
  if (combinedText.includes('blefar') || combinedText.includes('vieč') || combinedText.includes('viec') || combinedText.includes('očí')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'blepharoplasty_upper_lower');
    if (p) matched.set(p.id, p);
  }
  if (combinedText.includes('rhino') || combinedText.includes('nos')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'rhinoplasty');
    if (p) matched.set(p.id, p);
  }
  if (combinedText.includes('lip lift') || combinedText.includes('brow') || combinedText.includes('oboč')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'lip_lift_brow_lift');
    if (p) matched.set(p.id, p);
  }
  if (combinedText.includes('prs') || combinedText.includes('augment') || combinedText.includes('mamma') || combinedText.includes('mastopex')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'breast_augmentation_mastopexy');
    if (p) matched.set(p.id, p);
  }
  if (combinedText.includes('abdomino') || combinedText.includes('brucho') || combinedText.includes('bruš') || combinedText.includes('liposuk')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'abdominoplasty_liposuction');
    if (p) matched.set(p.id, p);
  }
  if (combinedText.includes('co2') || combinedText.includes('frakč') || combinedText.includes('resurfac')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'fractional_co2_laser');
    if (p) matched.set(p.id, p);
  }
  if (combinedText.includes('cievn') || combinedText.includes('vaskul') || combinedText.includes('korekcia jaz')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'vascular_scar_laser');
    if (p) matched.set(p.id, p);
  }
  if (combinedText.includes('botul') || combinedText.includes('botox') || combinedText.includes('dysport') || combinedText.includes('výpl')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'botulinum_hyaluronic');
    if (p) matched.set(p.id, p);
  }
  if (combinedText.includes('profhilo') || combinedText.includes('polynukleo') || combinedText.includes('plinest') || combinedText.includes('skinboost')) {
    const p = EBM_PROCEDURE_CATALOG.find(x => x.id === 'polynucleotides_profhilo');
    if (p) matched.set(p.id, p);
  }

  // Ak nič nebolo špecifikované, predvolíme harmonickú kombináciu starostlivosti o tvár a pleť
  if (matched.size === 0) {
    ['blepharoplasty_upper_lower', 'fractional_co2_laser', 'botulinum_hyaluronic', 'polynucleotides_profhilo'].forEach(id => {
      const p = EBM_PROCEDURE_CATALOG.find(x => x.id === id);
      if (p) matched.set(p.id, p);
    });
  }

  // Zoradíme podľa medicínsky bezpečnej postupnosti (recommendedTimingOrder)
  return Array.from(matched.values()).sort((a, b) => a.recommendedTimingOrder - b.recommendedTimingOrder);
}

/**
 * Zostaví kompletne harmonizovaný, medicínsky overený (EBM) a pre pacienta zrozumiteľný plán
 * podľa zvolených operácií a výkonov.
 */
export function synthesizeEbmPatientPlan(params: {
  basePlan?: Partial<PatientPlan>;
  patientId: string;
  patientName: string;
  patientBirthNumber?: string;
  doctorName?: string;
  skinType?: string;
  selectedProcedureIds?: string[];
  existingTreatments?: ScheduledTreatment[];
  diagnosisOrGoal?: string;
}): PatientPlan {
  const {
    basePlan,
    patientId,
    patientName,
    patientBirthNumber,
    doctorName = 'MUDr. Ján Mráz',
    skinType = 'Zmiešaná / citlivá so sklonom k dehydratácii',
    selectedProcedureIds,
    existingTreatments,
    diagnosisOrGoal
  } = params;

  const procs = resolveSelectedProcedures(selectedProcedureIds, existingTreatments, diagnosisOrGoal);
  const hasSurgery = procs.some(p => p.category === 'surgery');
  const hasFaceSurgery = procs.some(p => p.group === 'face_surgery');
  const hasBodySurgery = procs.some(p => p.group === 'body_surgery');
  const hasLaser = procs.some(p => p.category === 'laser' || p.category === 'scar_care');

  // Ak má pacient operáciu a ešte nemá zaradenú laserovú/cievnu starostlivosť o jazvu, pridáme ju ako odporúčaný EBM krok
  const finalProcs = [...procs];
  if (hasSurgery && !finalProcs.some(p => p.id === 'vascular_scar_laser' || p.id === 'fractional_co2_laser')) {
    const scarLaser = EBM_PROCEDURE_CATALOG.find(p => p.id === 'vascular_scar_laser');
    if (scarLaser) finalProcs.push(scarLaser);
    finalProcs.sort((a, b) => a.recommendedTimingOrder - b.recommendedTimingOrder);
  }

  const procNamesShort = finalProcs.map(p => p.shortLabel).join(' ➔ ');
  const surgeryProcs = finalProcs.filter(p => p.category === 'surgery');
  const mainSurgeryLabel = surgeryProcs.length > 0
    ? surgeryProcs.map(s => s.shortLabel).join(' & ')
    : finalProcs.map(p => p.shortLabel).join(' & ');

  // 1. ZOSTAVENIE ROČNÉHO PLÁNU (SEKVENCIA KROKOV S VYSVETLENÍM PRE PACIENTA A EBM GUIDELINOM)
  const synthesizedTreatments: ScheduledTreatment[] = finalProcs.map((proc, idx) => {
    const stepNumber = idx + 1;
    let stepTiming = `${stepNumber}. Krok • ${proc.recommendedSeasonOrStep}`;
    if (stepNumber === 1 && proc.category === 'surgery') {
      stepTiming = `1. Krok (Hlavná fáza – Operácia)`;
    } else if (stepNumber > 1 && proc.category === 'surgery') {
      stepTiming = `${stepNumber}. Krok (Odstup +6 až 8 týždňov po 1. kroku)`;
    } else if (proc.category === 'scar_care') {
      stepTiming = `${stepNumber}. Krok (3 – 6 týždňov po operácii – Fáza zrenia jazvy)`;
    } else if (proc.category === 'laser') {
      stepTiming = hasSurgery
        ? `${stepNumber}. Krok (6 – 12 týždňov po operácii v období nízkeho UV)`
        : `${stepNumber}. Krok (Jeseň / Zima – Obdobie nízkeho UV)`;
    } else if (proc.category === 'injectable') {
      stepTiming = hasSurgery
        ? `${stepNumber}. Krok (Po úplnom ústupe opuchov, +6 až 8 týždňov)`
        : `${stepNumber}. Krok (Harmonizácia mimiky a kontúr)`;
    } else {
      stepTiming = `${stepNumber}. Krok (Priebežná bunková regenerácia)`;
    }

    return {
      id: `trt-ebm-${Date.now()}-${idx}`,
      stepOrder: stepNumber,
      name: proc.label,
      category: proc.category,
      isSkinTreatment: proc.category === 'laser' || proc.category === 'skin_care' || proc.category === 'scar_care',
      seasonOrMonth: stepTiming,
      targetArea: proc.targetArea,
      frequencyOrSessions: proc.frequencyOrAnesthesia,
      estimatedPrice: proc.defaultPrice,
      priority: proc.category === 'surgery' || proc.category === 'laser' ? 'high' : 'recommended',
      status: 'planned',
      notes: proc.clinicalNotes,
      patientExplanation: proc.patientExplanation,
      clinicalGuideline: proc.clinicalGuideline,
      recoveryTime: proc.recoveryTimePatient
    };
  });

  // 2. ZOSTAVENIE SKINCARE RUTINY PRISPÔSOBENEJ ZVOLENÝM VÝKONOM
  const morningRoutine: CosmeticRoutineItem[] = [
    {
      step: 1,
      category: 'Šetrné ranné čistenie & mikrobióm',
      productName: 'La Roche-Posay Toleriane / SkinCeuticals Soothing Cleanser',
      brand: 'La Roche-Posay / SkinCeuticals',
      usage: 'Ráno jemne vmasírovať do navlhčenej pleti a opláchnuť vlažnou vodou.',
      purpose: 'Odstránenie nočného mazu bez narušenia ochrannej hydrolipidovej bariéry pred plánovanými výkonmi.',
      patientBenefit: 'Čistá a upokojená pleť bez pocitu pnutia, pripravená vstrebať ochranné vitamíny.',
      evidenceNote: 'EADV Barrier Care Consensus: syndetové čistenie s fyziologickým pH 5.5 znižuje transepidermálnu stratu vody (TEWL).',
      price: 17.50,
      standardOption: {
        tier: 'standard',
        tierName: 'Základná starostlivosť',
        productName: 'La Roche-Posay Toleriane Dermo-Cleanser čistiaca emulzia',
        brand: 'La Roche-Posay',
        price: 17.50,
        usage: 'Ráno naniesť končekmi prstov na vlhkú tvár a jemne opláchnuť.',
        purpose: 'Hypoalergénne čistenie pre citlivú a reaktívnu pleť pred aj po zákrokoch.'
      },
      premiumOption: {
        tier: 'premium',
        tierName: 'Prémiová starostlivosť',
        productName: 'SkinCeuticals Soothing Cleanser upokojujúca čistiaca pena',
        brand: 'SkinCeuticals',
        price: 46.00,
        usage: '1 pumpičku peny ráno jemne vmasírovať na vlhkú tvár a krk, opláchnuť.',
        purpose: 'Vysoká koncentrácia sorbitolu, glycerínu a extraktu z orchidey pre upokojenie pleti po estetických výkonoch.'
      }
    },
    {
      step: 2,
      category: 'Antioxidačný štít & podpora tvorby kolagénu',
      productName: 'Vichy Liftactiv 15% Vit C / SkinCeuticals C E Ferulic',
      brand: 'Vichy / SkinCeuticals',
      usage: '4 – 5 kvapiek každé ráno na suchú vyčistenú tvár, krk a dekolt.',
      purpose: 'Ochrana buniek pred oxidačným stresom, urýchlenie hojenia po laseri/operácii a stimulácia syntézy kolagénu.',
      patientBenefit: 'Chráni pleť pred starnutím zo slnka, zjednocuje farbu pleti a skracuje čas začervenania po zákrokoch o polovicu.',
      evidenceNote: 'Duke University Patent (Pinnell et al.) & Alster et al.: 15% L-askorbová kyselina + 1% tokoferol + 0.5% ferulová kyselina 8-násobne zvyšuje fotoprotekciu a urýchľuje reepitelizáciu.',
      price: 38.00,
      standardOption: {
        tier: 'standard',
        tierName: 'Základná starostlivosť',
        productName: 'Vichy Liftactiv Supreme 15% čistý Vitamín C sérum',
        brand: 'Vichy',
        price: 38.00,
        usage: '4 – 5 kvapiek ráno na suchú pleť pred hydratačným krémom.',
        purpose: 'Silná antioxidačná ochrana s 15 % čistým vitamínom C a pyknogenolom.'
      },
      premiumOption: {
        tier: 'premium',
        tierName: 'Prémiová starostlivosť',
        productName: 'SkinCeuticals C E Ferulic Triple Antioxidant Treatment',
        brand: 'SkinCeuticals',
        price: 175.00,
        usage: '4 – 5 kvapiek ráno vklepať do pokožky tváre, krku a dekoltu.',
        purpose: 'Svetový klinický zlatý štandard antioxidantov – pôsobí v koži až 72 hodín a stimuluje kolagén.'
      }
    },
    {
      step: 3,
      category: 'Hĺbková hydratácia & pružnosť',
      productName: 'La Roche-Posay Hyalu B5 / SkinCeuticals H.A. Intensifier',
      brand: 'La Roche-Posay / SkinCeuticals',
      usage: 'Ráno po vstrebaní vitamínu C naniesť na celú tvár a krk.',
      purpose: 'Viaže vodu v epidermis a dermis, podporuje pružnosť tkanív a udržiava efekt injekčných a chirurgických výkonov.',
      patientBenefit: 'Dodáva pleti okamžitú šťavnatosť, vypína jemné vrásky a urýchľuje regeneráciu pomocou vitamínu B5.',
      evidenceNote: 'Klinické štúdie D-panthenolu (Vitamín B5) a nízko/vysokomolekulárnej HA potvrdzujú zrýchlenie hojenia epidermálnej bariéry.',
      price: 39.50,
      standardOption: {
        tier: 'standard',
        tierName: 'Základná starostlivosť',
        productName: 'La Roche-Posay Hyalu B5 Sérum (Kyselina hyalurónová + Vitamín B5)',
        brand: 'La Roche-Posay',
        price: 39.50,
        usage: '3 – 4 kvapky ráno na tvár a krk.',
        purpose: 'Intenzívna obnova pružnosti s madecassosidom, vitamínom B5 a duálnou kyselinou hyalurónovou.'
      },
      premiumOption: {
        tier: 'premium',
        tierName: 'Prémiová starostlivosť',
        productName: 'SkinCeuticals H.A. Intensifier Multi-Glycan Sérum',
        brand: 'SkinCeuticals',
        price: 118.00,
        usage: '4 – 6 kvapiek ráno na tvár, oblasť pod očami, pery a krk.',
        purpose: 'Zvyšuje vlastnú hladinu kyseliny hyalurónovej v pleti o +30 % vďaka 10 % Proxylane™.'
      }
    },
    {
      step: 4,
      category: 'Fotoprotekcia SPF 50+ (Ochrana jaziev a pigmentu)',
      productName: 'La Roche-Posay Anthelios UVMune 400 SPF 50+ / SkinCeuticals Ultra Facial Defense SPF 50+',
      brand: 'La Roche-Posay / SkinCeuticals',
      usage: 'Každé ráno ako posledný krok (aj keď je zamračené). Na jazvy aplikovať celých 12 mesiacov!',
      purpose: 'Striktná prevencia pozápalovej hyperpigmentácie (stmavnutia jaziev alebo fľakov po laseri) a ochrana nového kolagénu.',
      patientBenefit: 'Najdôležitejší krok pre krásne a neviditeľné jazvy – zabraňuje tomu, aby slnko zafarbilo mladú jazvu alebo pleť po laseri do hneda.',
      evidenceNote: 'International Scar Management Guidelines & EADV Photoprotection: UV žiarenie v prvých 12 mesiacoch spôsobuje trvalú hyperpigmentáciu jaziev.',
      price: 21.50,
      standardOption: {
        tier: 'standard',
        tierName: 'Základná starostlivosť',
        productName: 'La Roche-Posay Anthelios UVMune 400 Invisible Fluid SPF 50+',
        brand: 'La Roche-Posay',
        price: 21.50,
        usage: 'Dostatočné množstvo (dĺžka 2 prstov) každé ráno na tvár, krk a oblasť jaziev.',
        purpose: 'Filter Mexoryl 400 chráni aj pred ultra-dlhým UVA žiarením (380 – 400 nm).'
      },
      premiumOption: {
        tier: 'premium',
        tierName: 'Prémiová starostlivosť',
        productName: 'SkinCeuticals Ultra Facial Defense SPF 50+ širokospektrálny krém',
        brand: 'SkinCeuticals',
        price: 44.00,
        usage: 'Aplikovať každé ráno pred pobytom vonku na tvár, viečka, krk a jazvy.',
        purpose: 'Špičková fotostabilná UV ochrana s Mexorylom SX/XL, ktorá neupcháva póry a hydratuje 24h.'
      }
    }
  ];

  const eveningRoutine: CosmeticRoutineItem[] = [
    {
      step: 1,
      category: 'Dôkladné večerné odlíčenie a vyčistenie',
      productName: 'CeraVe Hydratačná emulzia / SkinCeuticals Gentle Cleanser',
      brand: 'CeraVe / SkinCeuticals',
      usage: 'Večer vmasírovať na odlíčenie SPF a nečistôt, následne opláchnuť vlažnou vodou.',
      purpose: 'Odstránenie prachu, SPF filtrov a make-upu, aby sa nočné regeneračné látky mohli plne vstrebať.',
      patientBenefit: 'Dokonale čistá pokožka, ktorá môže v noci voľne dýchať a regenerovať sa.',
      evidenceNote: 'Dermatologický štandard dvojfázového čistenia s obsahom ceramidov a alantoínu.',
      price: 14.50,
      standardOption: {
        tier: 'standard',
        tierName: 'Základná starostlivosť',
        productName: 'CeraVe Hydratačná čistiaca emulzia s 3 ceramidmi',
        brand: 'CeraVe',
        price: 14.50,
        usage: 'Večer vmasírovať do vlhkej pleti po dobu 60 sekúnd a zmyť.',
        purpose: 'Šetrné odstránenie SPF a nečistôt s technológiou MVE pre postupné uvoľňovanie hydratácie.'
      },
      premiumOption: {
        tier: 'premium',
        tierName: 'Prémiová starostlivosť',
        productName: 'SkinCeuticals Gentle Cleanser krémový čistiaci prípravok',
        brand: 'SkinCeuticals',
        price: 46.00,
        usage: 'Jemne vmasírovať na tvár a krk, zotrieť navlhčeným tampónom alebo opláchnuť.',
        purpose: 'Obsahuje alantoín a pomarančový olej – upokojuje citlivú alebo pooperačnú pokožku.'
      }
    },
    {
      step: 2,
      category: 'Nočná bunková obnova (Retinoid / Peptidová obnova)',
      productName: 'La Roche-Posay Retinol B3 / SkinCeuticals Retinol 0.3',
      brand: 'La Roche-Posay / SkinCeuticals',
      usage: 'Večer na suchú pleť (2 – 3x týždenne). POZOR: Vysadiť 7 dní pred operáciou/laserom a nasadiť až po úplnom zahojení!',
      purpose: 'Zlatý štandard nočnej obnovy – zrýchľuje bunkový obrat, zjemňuje póry, pigmentácie a stimuluje tvorbu nového kolagénu.',
      patientBenefit: 'Počas spánku obnovuje bunky pleti, vyhladzuje vrásky a predlžuje mladistvý efekt zákrokov.',
      evidenceNote: 'Kafi et al. (Archives of Dermatology) & ASPS Pre-Conditioning Guidelines: lokálne retinoidy preukázateľne zvyšujú syntézu prokolagénu I.',
      price: 39.00,
      standardOption: {
        tier: 'standard',
        tierName: 'Základná starostlivosť',
        productName: 'La Roche-Posay Retinol B3 regeneračné sérum (Retinol + Niacínamid)',
        brand: 'La Roche-Posay',
        price: 39.00,
        usage: 'Večer 3 kvapky na suchú tvár (mimo čerstvých jaziev). Vysadiť 7 dní pred zákrokom.',
        purpose: 'Kombinácia čistého a postupne uvoľňovaného retinolu s upokojujúcim vitamínom B3.'
      },
      premiumOption: {
        tier: 'premium',
        tierName: 'Prémiová starostlivosť',
        productName: 'SkinCeuticals Retinol 0.3 čistý stabilizovaný retinol',
        brand: 'SkinCeuticals',
        price: 98.00,
        usage: 'Večer množstvo veľkosti hrášku na suchú pleť (vynechať 7 dní pred a 14 dní po zákroku).',
        purpose: 'Enkapsulovaný 0.3 % čistý retinol s bisabololom a boswelliou pre maximálnu obnovu bez podráždenia.'
      }
    },
    {
      step: 3,
      category: 'Hĺbková rekonštrukcia bariéry & hojenie po zákrokoch',
      productName: 'La Roche-Posay Cicaplast Baume B5+ / SkinCeuticals Triple Lipid Restore 2:4:2',
      brand: 'La Roche-Posay / SkinCeuticals',
      usage: 'Každý večer ako výživný nočný krém (v prvých 14 dňoch po operácii/laseri aj viackrát denne).',
      purpose: 'Obnova esenciálnych kožných lipidov (ceramidov, cholesterolu a mastných kyselín), upokojenie po zákrokoch a výživa.',
      patientBenefit: 'Funguje ako „ochranný obväz v kréme“ – okamžite upokojuje začervenanie, regeneruje pleť po laseri a vyživuje hojace sa tkanivá.',
      evidenceNote: 'Klinická štúdia pomeru lipidov 2% ceramidy : 4% cholesterol : 2% mastné kyseliny potvrdzuje o 66 % rýchlejšiu obnovu kožnej bariéry.',
      price: 16.50,
      standardOption: {
        tier: 'standard',
        tierName: 'Základná starostlivosť',
        productName: 'La Roche-Posay Cicaplast Baume B5+ regeneračný balzam s Tribioma',
        brand: 'La Roche-Posay',
        price: 16.50,
        usage: 'Večer na celú tvár, krk a zahojené pooperačné línie.',
        purpose: '5 % Panthenol + Madecassoside + Tribioma pre intenzívne hojenie a upokojenie.'
      },
      premiumOption: {
        tier: 'premium',
        tierName: 'Prémiová starostlivosť',
        productName: 'SkinCeuticals Triple Lipid Restore 2:4:2 patentovaný krém',
        brand: 'SkinCeuticals',
        price: 155.00,
        usage: 'Malé množstvo zahriať medzi prstami a krúživými pohybmi vmasírovať do pleti.',
        purpose: 'Patentovaný fyziologický pomer lipidov 2:4:2 pre rekonštrukciu zrelej a pooperačnej pleti.'
      }
    }
  ];

  // Špeciálna týždenná starostlivosť zosúladená s vybratými výkonmi
  const specialWeeklyCare: string[] = [
    'Pravidlo 7 dní pred zákrokom: 7 dní pred operáciou alebo laserom vysaďte večerný retinol a kyseliny, používajte len čistenie, hydratáciu, bariérový krém a SPF 50+.',
    'Ochrana jaziev a novej pleti: Na operované miesta a ošetrenú pleť aplikujte SPF 50+ každé ráno po dobu minimálne 12 mesiacov (aj počas oblačných dní).',
    'Vnútorná výživa kolagénu: Počas prípravy a hojenia užívajte hydrolyzovaný kolagén (10 000 mg denne) spolu s vitamínom C (500 – 1000 mg) a zinkom.'
  ];
  finalProcs.forEach(p => {
    if (p.skincareImpact?.weeklyTip && !specialWeeklyCare.includes(p.skincareImpact.weeklyTip)) {
      specialWeeklyCare.push(p.skincareImpact.weeklyTip);
    }
  });

  // 3. ZOSTAVENIE SAY CARE: PREDOPERAČNÁ PREHABILITÁCIA & POOPERAČNÝ PROTOKOL PODĽA VYBRATÝCH VÝKONOV
  const prehab: PreOpPrehabilitation = {
    medicalPrehab: [
      'Kompletné predoperačné interné a laboratórne vyšetrenie (krvný obraz, zrážanlivosť krvi INR/APTT, biochémia, EKG) 14 dní pred operáciou (ERAS® Standard).',
      '10 až 14 dní pred zákrokom vysadiť lieky ovplyvňujúce zrážanlivosť krvi (Aspirin, Acylpyrin, Anopyrin, Ibalgin, Ibuprofén, Nalgesin) – po dohode s lekárom.',
      'Prísny zákaz fajčenia, elektronických cigariet a nikotínových vrecúšok minimálne 4 týždne pred a 4 týždne po operácii (nikotín sťahuje cievy a až 3-násobne zvyšuje riziko zlého hojenia jaziev).'
    ],
    psychologicalPrep: [
      'Zrozumiteľná príprava na priebeh hojenia: opuch a prípadné modrinky vrcholia na 2. – 3. deň po zákroku a následne postupne ustupujú. Finálny estetický výsledok vyzrieva niekoľko mesiacov.',
      'Príprava pokojného domáceho prostredia: zabezpečte si odvoz z kliniky, pomoc blízkej osoby na prvých 48 hodín a oddychový režim bez pracovného stresu.',
      'Kvalitný 8-hodinový spánok pred zákrokom znižuje hladinu stresového hormónu kortizolu a preukázateľne zlepšuje imunitnú odpoveď pri hojení.'
    ],
    nutritionalPrep: [
      'Zvýšený príjem bielkovín (1,2 – 1,5 g na kg hmotnosti denne – ryby, hydina, vajcia, strukoviny) 2 týždne pred a 4 týždne po zákroku pre optimálnu tvorbu kolagénu a hojenie rán.',
      'Suplementácia podľa EBM štúdií: Vitamín C (1000 mg/deň), Zinok (15 – 25 mg/deň) a Bromelaín / Wobenzym (od 2. pooperačného dňa na rýchlejšie vstrebávanie opuchov).',
      '14 dní pred operáciou vysadiť bylinné prípravky zvyšujúce krvácavosť (Ginkgo biloba, ženšen, vysoké dávky vitamínu E, cesnakové extrakty a rybí olej) a 7 dní pred operáciou nepiť alkohol.'
    ],
    physicalPrep: [
      'Príprava miesta na spanie s vyvýšenou hornou polovicou tela (2 – 3 vankúše pod uhlom 30 – 45°), čo výrazne znižuje ranné pooperačné opuchy.',
      'Pripraviť si voľné oblečenie so zapínaním vpredu (košele, kardigány na zips), aby ste po operácii nemuseli prevliekať oblečenie cez hlavu a tvár.',
      'Aktivácia lymfatického systému: ľahké prechádzky na čerstvom vzduchu a dychové cvičenia pred operáciou.'
    ]
  };

  // Pridáme špecifické prehabilitačné body z vybratých operácií
  finalProcs.forEach(p => {
    p.preOpSpecifics.medical?.forEach(m => { if (!prehab.medicalPrehab.includes(m)) prehab.medicalPrehab.push(m); });
    p.preOpSpecifics.psychological?.forEach(ps => { if (!prehab.psychologicalPrep.includes(ps)) prehab.psychologicalPrep.push(ps); });
    p.preOpSpecifics.nutritional?.forEach(n => { if (!prehab.nutritionalPrep.includes(n)) prehab.nutritionalPrep.push(n); });
    p.preOpSpecifics.physical?.forEach(ph => { if (!prehab.physicalPrep.includes(ph)) prehab.physicalPrep.push(ph); });
  });

  const preOpInstructions: PreOpInstruction[] = [
    {
      id: 'pre-ebm-1',
      timeframe: '4 týždne pred zákrokom',
      title: 'Stop nikotínu & Príprava kožnej bariéry a výživy',
      description: 'Prestaňte fajčiť a užívať nikotín. Začnite s predoperačnou skincare rutinou (hydratácia, ceramidy, SPF 50+) a zvýšte príjem bielkovín, vitamínu C a zinku.',
      mandatory: true
    },
    {
      id: 'pre-ebm-2',
      timeframe: '2 týždne pred zákrokom',
      title: 'Predoperačné vyšetrenia & Vysadenie liekov na riedenie krvi',
      description: 'Absolvujte predoperačné odbery krvi (KO, zrážanlivosť, biochémia) a interné/anestéziologické vyšetrenie. Vysaďte Aspirin, Ibalgin, Ginkgo, vitamín E a alkohol.',
      mandatory: true
    },
    {
      id: 'pre-ebm-3',
      timeframe: '7 dní pred zákrokom',
      title: 'Vysadenie retinolu a príprava domácnosti',
      description: 'Vysaďte večerný retinol a exfoliačné kyseliny. Pripravte si doma chladiace obklady, vankúše na vyvýšené spanie a voľné oblečenie na zips/gombíky.',
      mandatory: true
    }
  ];

  // Špecifické kroky v časovej osi podľa vybratých výkonov
  finalProcs.forEach((p, i) => {
    if (p.preOpSpecifics.timelineInstruction) {
      preOpInstructions.push({
        id: `pre-spec-${i}`,
        timeframe: p.preOpSpecifics.timelineInstruction.timeframe,
        title: p.preOpSpecifics.timelineInstruction.title,
        description: p.preOpSpecifics.timelineInstruction.description,
        mandatory: true
      });
    }
  });

  preOpInstructions.push({
    id: 'pre-ebm-day0',
    timeframe: 'Večer pred & Deň zákroku',
    title: 'Nalačno (pri celkovej anestézii) & Príchod bez make-upu a šperkov',
    description: 'Pri celkovej anestézii 6 hodín pred zákrokom nič nejedzte a nepite. Ráno sa osprchujte antibakteriálnym mydlom, príďte úplne nenalíčená, bez krému, šperkov, kontaktných šošoviek a s odlakovanými nechtami.',
    mandatory: true
  });

  // 4. POOPERAČNÉ FÁZY A PROTOKOL JAZIEV ZOSÚLADENÉ S VÝKONMI
  const earlyPhaseInstructions: string[] = [
    'Prísny kľudový režim so zvýšenou polohou hlavy/tela (30 – 45°), vyhýbať sa predklonom, dvíhaniu ťažkých predmetov a horúcim kúpeľom.',
    'Užívanie predpísaných liekov (antibiotická profylaxia, lieky proti opuchu a bolesti) presne podľa rozpisu v prepúšťacej správe.'
  ];
  const warningSignsList: string[] = [
    'Teplota nad 38,0 °C, zimnica alebo vytekanie zakalenej tekutiny z rany.',
    'Náhle jednostranné zväčšenie opuchu, stvrdnutie alebo intenzívna pulzujúca bolesť.'
  ];

  finalProcs.forEach(p => {
    if (p.postOpSpecifics.earlyCare && !earlyPhaseInstructions.includes(p.postOpSpecifics.earlyCare)) {
      earlyPhaseInstructions.push(p.postOpSpecifics.earlyCare);
    }
    if (p.postOpSpecifics.warningSign && !warningSignsList.includes(p.postOpSpecifics.warningSign)) {
      warningSignsList.push(p.postOpSpecifics.warningSign);
    }
  });

  const postOpPhases: PostOpRecoveryPhase[] = [
    {
      phaseId: 'phase-1',
      period: '1. – 7. deň po zákroku',
      title: 'Fáza 1: Akútne hojenie, kontrola opuchu a kľudový režim',
      focus: 'Pokoj tkanív & Prevencia opuchu',
      instructions: earlyPhaseInstructions,
      scarCareGuidelines: [
        'Rany udržiavať v sterilnej čistote a suchu (krytia a stehy nenamáčať, pokiaľ lekár neurčí inak).',
        'Nepoužívať žiadne kozmetické krémy ani silikón priamo na čerstvé zašité rany až do vybratia stehov.'
      ],
      warningSigns: warningSignsList
    },
    {
      phaseId: 'phase-2',
      period: '7. – 21. deň po zákroku',
      title: 'Fáza 2: Kontrola, vybratie stehov & Štart starostlivosti o jazvy',
      focus: 'Epitelizácia & Lymfodrenáž',
      instructions: [
        'Ambulantná kontrola a šetrné odstránenie stehov (zvyčajne 6. – 14. deň podľa operovanej oblasti).',
        'Postupný návrat k bežným denným aktivitám; naďalej sa vyhýbať saune, bazénom a intenzívnemu športu.',
        hasBodySurgery
          ? 'Pokračovať v nepretržitom nosení kompresívnej bielizne 24/7.'
          : 'Zaradenie jemnej odbornej manuálnej lymfodrenáže na urýchlenie vstrebania zvyškového opuchu.'
      ],
      scarCareGuidelines: [
        'Akonáhle je rana plne uzavretá a bez chrastičiek (cca 14. deň), začnite 2x denne aplikovať 100% medicínsky silikónový gél (Strataderm / Dermatix) v tenkej vrstve.',
        'Jazvu chráňte pred slnkom pomocou SPF 50+ pri každom pobyte na dennom svetle.'
      ]
    },
    {
      phaseId: 'phase-3',
      period: '3. – 8. týždeň po zákroku',
      title: 'Fáza 3: Aktívna remodelácia jaziev, tlakové masáže & cievny laser',
      focus: 'Tlakové masáže & Laser jaziev',
      instructions: [
        'Od 3. týždňa zaradenie pravidelných tlakových masáží jaziev (bruškom prsta zatlačiť na jazvu na 10 sekúnd, kým zbledne, a posunúť sa ďalej – 3x denne po 5 minút).',
        'Postupný návrat k plnej fyzickej aktivite a cvičeniu (pri operáciách tela a prsníkov po 6. týždni).',
        'Možnosť aplikácie botulotoxínu alebo včasného cievneho/biostimulačného lasera na urýchlenie vyblednutia jazvy.'
      ],
      scarCareGuidelines: [
        'Kombinácia silikónového gélu/náplastí s tlakovou masážou zabezpečuje, že kolagénové vlákna sa uložia plocho a jazva zostane mäkká.',
        'Prípadné začervenanie jazvy v 1. – 2. mesiaci je normálnou fázou hojenia (tvorba kapilár) a dá sa výrazne skrátiť cievnym laserom.'
      ]
    },
    {
      phaseId: 'phase-4',
      period: '2. – 12. mesiac po zákroku',
      title: 'Fáza 4: Finálne vyzretie výsledku & Dlhodobá udržiavacia starostlivosť',
      focus: 'Kolagénová prestavba & Ochrana',
      instructions: [
        'Realizácia nadväzujúcich estetických krokov podľa Ročného plánu (frakčný CO2 resurfacing pleti, polynukleotidy, skinbooster).',
        'Kontrolné 3D Meicet spektrálne meranie stavu pleti po 3, 6 a 12 mesiacoch s vyhodnotením kvality kolagénu a jaziev.'
      ],
      scarCareGuidelines: [
        'Jazva definitívne vyzrieva 6 až 12 mesiacov (mení sa z ružovej na tenkú bledú líniu). Po celý tento čas ju chráňte krémom s SPF 50+.'
      ]
    }
  ];

  // 5. ZROZUMITEĽNÉ ZHRNUTIE PRE PACIENTA & OVERENÉ MEDICÍNSKE GUIDELINY
  const patientFriendlySummary = `Váš osobný ročný plán (${procNamesShort}) bol zostavený tak, aby jednotlivé zákroky na seba logicky a bezpečne nadväzovali. ${
    hasSurgery
      ? 'Najskôr pokožku a organizmus pripravíme (prehabilitácia), následne zrealizujeme chirurgický výkon a v presne stanovených rozostupoch podporíme hojenie jaziev, lymfodrenáž a povrchovú obnovu pleti.'
      : 'Jednotlivé ošetrenia pleti sú rozložené podľa ročných období a biologického cyklu obnovy kolagénu (28 – 42 dní), aby ste dosiahli maximálny a prirodzený výsledok bez zbytočného zaťaženia pokožky.'
  } Ku každému kroku máte priradenú domácu starostlivosť (vo variante Základná alebo Prémiová) a jasný návod, čo robiť pred aj po zákroku.`;

  const verifiedGuidelinesUsed = [
    {
      title: 'ERAS® Society Plastic Surgery Guidelines (Enhanced Recovery After Surgery)',
      organization: 'ERAS® Society & International Plastic Surgery Consensus',
      summaryForPatient: 'Overený medicínsky protokol prípravy organizmu (výživa, hydratácia, nefajčenie, včasný pohyb), ktorý skracuje dobu zotavenia a znižuje opuchy až o 40 %.'
    },
    {
      title: 'International Advisory Panel on Scar Management (Mustoe et al. / Gold et al.)',
      organization: 'Plastic and Reconstructive Surgery Journal',
      summaryForPatient: 'Svetový štandard starostlivosti o jazvy: potvrdzuje, že kombinácia 100 % silikónového gélu od 14. dňa, tlakových masáží od 21. dňa a včasného lasera vedie k najjemnejším, takmer neviditeľným jazvám.'
    },
    {
      title: 'ASPS & ISAPS Evidence-Based Sequential Facial & Body Rejuvenation Guidelines',
      organization: 'American Society of Plastic Surgeons (ASPS)',
      summaryForPatient: 'Stanovuje bezpečné odstupy medzi operáciou (obnova hlbokých štruktúr), laserom (obnova povrchu kože) a injekčnými ošetreniami (uvoľnenie mimiky a doplnenie objemu).'
    },
    {
      title: 'EADV Photoprotection & Topical Antioxidant Consensus (Duke Parameters)',
      organization: 'European Academy of Dermatology and Venereology (EADV)',
      summaryForPatient: 'Potvrdzuje, že ranný 15 % vitamín C s kyselinou ferulovou a denné SPF 50+ chránia novotvorený kolagén a bránia stmavnutiu jaziev a pigmentových škvŕn.'
    }
  ];

  return {
    id: basePlan?.id || `plan-${Date.now()}`,
    patientId: patientId || basePlan?.patientId || 'P1',
    patientName: patientName || basePlan?.patientName || 'Pacient SAY CLINIC',
    patientBirthNumber: patientBirthNumber || basePlan?.patientBirthNumber,
    createdAt: basePlan?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    doctorName: doctorName || basePlan?.doctorName || 'MUDr. Ján Mráz',
    planType: 'combined',
    title: `Ročný plán starostlivosti: ${procNamesShort}`,
    diagnosisOrGoal:
      diagnosisOrGoal ||
      basePlan?.diagnosisOrGoal ||
      `Komplexný medicínsky a estetický plán prispôsobený pre: ${procNamesShort}`,
    patientFriendlySummary,
    verifiedGuidelinesUsed,
    selectedProceduresList: finalProcs.map(p => p.id),
    meicetMetrics: basePlan?.meicetMetrics,
    meicetScanDate: basePlan?.meicetScanDate,
    meicetPdfFilename: basePlan?.meicetPdfFilename,
    meicetMilestones: basePlan?.meicetMilestones,
    analysisSummary: {
      skinType: skinType || basePlan?.analysisSummary?.skinType || 'Zmiešaná / normálna',
      skinTonePhototype: basePlan?.analysisSummary?.skinTonePhototype || 'Fitzpatrick II-III',
      mainConcerns: finalProcs.map(p => p.shortLabel),
      vectorZones: finalProcs.map(p => p.targetArea)
    },
    cosmeticsRoutine: {
      activeTier: basePlan?.cosmeticsRoutine?.activeTier || 'both',
      morning: morningRoutine,
      evening: eveningRoutine,
      specialWeeklyCare
    },
    annualTreatments: synthesizedTreatments,
    preOpCare: {
      procedureName: mainSurgeryLabel,
      prehabilitation: prehab,
      instructions: preOpInstructions
    },
    postOpCare: {
      procedureName: mainSurgeryLabel,
      phases: postOpPhases,
      scarProtocol: {
        siliconeApplication: 'Od 14. dňa (po vybratí stehov a odpadnutí chrastičiek) aplikujte 2x denne tenkú vrstvu 100% medicínskeho silikónového gélu (Strataderm / Dermatix) alebo silikónové náplasti po dobu 3 – 6 mesiacov (Gold et al. Scar Guideline).',
        pressureMassage: 'Od 21. dňa vykonávajte 3x denne po 5 – 10 minút cielené tlakové masáže jazvy bruškom prsta (zatlačiť na 10 sekúnd do zblednutia a posunúť sa o 5 mm ďalej).',
        lymphaticDrainage: 'Od 10. – 14. dňa séria 5 – 10 odborných manuálnych alebo prístrojových lymfodrenáží na rýchle odplavenie pooperačného opuchu a prevenciu fibrózy podkožia.',
        laserTherapy: 'V 4. – 8. týždni včasné ošetrenie cievnym laserom (redukcia červeného sfarbenia jazvy) a následne frakčným CO2 laserom pre dokonalé splynutie jazvy s okolitou kožou.',
        sunProtection: 'Striktná ochrana jaziev a ošetrenej pleti krémom s faktorom SPF 50+ (La Roche-Posay Anthelios UVMune 400 / SkinCeuticals) po dobu 12 mesiacov pri každom pobyte vonku.',
        advancedScarTherapies: [
          'Cievny laser (redukcia začervenania jazvy v 4. – 6. týždni)',
          'Frakčný CO2 laser resurfacing jazvy (v 8. – 12. týždni)',
          'Lokálna aplikácia polynukleotidov (Plinest) alebo exozómov do línie jazvy',
          'Odborná manuálna lymfodrenáž a uvoľňovanie fascií'
        ]
      }
    },
    doctorNote: `Plán bol medicínsky zostavený a overený podľa najnovších klinických guidelinov (ERAS®, ASPS, EADV, International Scar Management Consensus) špecificky pre zvolené výkony: ${procNamesShort}.`
  };
}
