'use client';

import React, { useState, useEffect, useRef } from 'react';
import { HealthProService, HealthProResponse } from '../services/healthpro';
import { MKCHItem } from '../data/mkch';
import { generatePdfFilename, exportElementToPdf } from '../lib/pdfGenerator';
import { 
  findSurgeryConsentProfile, 
  saveSurgeryConsentProfile, 
  SurgeryConsentProfile 
} from '../data/surgeryConsentCatalog';
import { SurgeryConsentTemplateManager } from './SurgeryConsentTemplateManager';
import PrescriptionModule from './PrescriptionModule';
import { Sliders, Save, RotateCcw, Check } from './Icons';

export interface ServiceCategory {
  id: string;
  name: string;
  price: number;
  category?: string;
}

// ŠTRUKTÚROVANÝ CENNÍK SAY CLINIC ROZDELENÝ DO 5 PREHĽADNÝCH KATEGÓRIÍ
export const SERVICES_DATABASE = {
  // 1. Operácie
  operations: [
    { id: 'op_karpal', name: 'Syndróm karpálneho tunela', price: 300 },
    { id: 'op_skakavy_prst', name: 'Skákavý prst', price: 200 },
    { id: 'op_dupuytren', name: 'Dupuytrenova kontraktúra', price: 700 },
    { id: 'op_aug_impl', name: 'Zväčšenie prsníkov silikónovými implantátmi (augmentácia)', price: 4100 },
    { id: 'op_aug_tuk', name: 'Zväčšenie prsníkov tukom', price: 3100 },
    { id: 'op_redukcia_prsnikov', name: 'Zmenšenie prsníkov (redukcia)', price: 4100 },
    { id: 'op_mastopexia', name: 'Lifting prsníkov (mastopexia)', price: 4100 },
    { id: 'op_aug_mastopexia', name: 'Lifting prsníkov s implantátmi (augmentačná mastopexia)', price: 5500 },
    { id: 'op_odstranenie_impl', name: 'Odstránenie implantátov', price: 1500 },
    { id: 'op_gynekomastia', name: 'Gynekomastia s liposukciou', price: 2000 },
    { id: 'op_miniabdo', name: 'Miniabdominoplastika', price: 3000 },
    { id: 'op_abdominoplastika', name: 'Abdominoplastika (redukcia kože brucha)', price: 4000 },
    { id: 'op_labioplastika', name: 'Labioplastika (redukcia malých pyskov)', price: 1000 },
    { id: 'op_lipo_brucho_boky', name: 'Liposukcia brucha a bokov', price: 2500 },
    { id: 'op_lipo_360', name: '360° Liposukcia', price: 3500 },
    { id: 'op_lipo_paze', name: 'Liposukcia paží', price: 1000 },
    { id: 'op_lipo_krk', name: 'Liposukcia krku', price: 1000 },
    { id: 'op_lipo_bra_lines', name: 'Liposukcia bra lines', price: 1000 },
    { id: 'op_lipo_love_handles', name: 'Liposukcia love handles', price: 1000 },
    { id: 'op_lipo_vnutorne_stehna', name: 'Liposukcia vnútorných stehien', price: 1000 },
    { id: 'op_lipo_vonkajsie_stehna', name: 'Liposukcia vonkajších stehien', price: 1000 },
    { id: 'op_lipo_kolena', name: 'Liposukcia kolien', price: 1000 },
    { id: 'op_lipo_chrbat', name: 'Liposukcia chrbta', price: 1000 },
    { id: 'op_lipo_ine', name: 'Liposukcia - iné', price: 1000 },
    { id: 'op_armlift', name: 'Lifting paží (arm lift)', price: 4500 },
    { id: 'op_thighlift', name: 'Lifting stehien (thigh lift)', price: 4500 },
    { id: 'op_buttlift', name: 'Lifting zadku (buttock lift)', price: 4500 },
    { id: 'op_blepharo_horne', name: 'Blefaroplastika horných viečok', price: 1000 },
    { id: 'op_blepharo_dolne', name: 'Blefaroplastika dolných viečok', price: 1100 },
    { id: 'op_odstavajuce_usnice', name: 'Korekcia odstávajúcich ušníc', price: 1200 },
    { id: 'op_septoplastika', name: 'Septoplastika s turbinoplastikou', price: 2500 },
    { id: 'op_rhino_spicka', name: 'Úprava špičky nosa', price: 2500 },
    { id: 'op_rhino_komplet', name: 'Kompletná rhinoplastika', price: 3800 },
    { id: 'op_deep_plane_facelift', name: 'Deep plane facelift', price: 5500 },
    { id: 'op_smas_facelift', name: 'SMAS / MACS facelift', price: 3900 },
    { id: 'op_endo_brow_midface', name: 'Endoskopický lifting obočia a strednej časti tváre', price: 6000 },
    { id: 'op_endo_brow', name: 'Endoskopický lifting obočia', price: 2500 },
    { id: 'op_liplift', name: 'Lifting pier (lip lift)', price: 900 },
    { id: 'op_necklift', name: 'Necklift - lifting krku', price: 2500 },
    { id: 'op_bukalna_lipektomia', name: 'Odstránenie tuku z líc (bukálna lipektómia)', price: 900 },
    { id: 'op_tvarove_implantaty', name: 'Tvárové implantáty', price: 3700 },
    { id: 'op_lipofilling_tvar', name: 'Lipofilling tváre', price: 1300 },
  ],

  // 2. Príplatky k operáciám
  operationExtras: [
    { id: 'ex_blite', name: 'B-lite', price: 1000 },
    { id: 'ex_joy', name: 'Joy', price: 700 },
    { id: 'ex_preserve', name: 'Preserve', price: 1500 },
    { id: 'ex_korekcia_bradaviek', name: 'korekcia bradaviek', price: 600 },
    { id: 'ex_abdo_lipo', name: 'Abdominoplastika - liposukcia brucha a bokov', price: 600 },
    { id: 'ex_abdo_diastaza', name: 'Abdominoplastika - korekcia diastázy', price: 300 },
    { id: 'ex_lipotransfer_200', name: 'Prenos tuku - Lipotransfer do 200ml', price: 700 },
    { id: 'ex_lipotransfer_nad200', name: 'Prenos tuku - Lipotransfer nad 200ml', price: 1500 },
    { id: 'ex_blepharo_obocie', name: 'Blefaroplastika - záves obočia', price: 200 },
    { id: 'ex_blepharo_ptoza', name: 'Blefaroplastika - korekcia ptózy viečka - jednostranne', price: 200 },
    { id: 'ex_blepharo_kantopexia', name: 'Blefaroplastika - záves viečka - kantopexia', price: 200 },
    { id: 'ex_usny_lalocik', name: 'Korekcia ušného lalôčika', price: 300 },
    { id: 'ex_rhino_spicka_sek', name: 'Úprava špičky nosa - sekundárna operácia', price: 1300 },
    { id: 'ex_rhino_spicka_rebro', name: 'Úprava špičky nosa - sekundárna operácia s nutnosťou chrupavky rebra', price: 2000 },
    { id: 'ex_rhino_komplet_sek', name: 'Kompletná rhinoplastika - sekundárna operácia', price: 1500 },
    { id: 'ex_rhino_komplet_rebro', name: 'Kompletná rhinoplastika - sekundárna operácia - totálna rekonštrukcia z chrupavky rebra', price: 2500 },
    { id: 'ex_rhino_komplet_septo', name: 'Kompletná rhinoplastika - septoplastika alebo turbinoplastika', price: 500 },
    { id: 'ex_facelift_krk', name: 'Facelift - lifting krku', price: 1000 },
    { id: 'ex_facelift_tuk', name: 'Facelift - transplantácia tuku', price: 800 },
    { id: 'ex_facelift_liplift', name: 'Facelift - liplift', price: 600 },
    { id: 'ex_facelift_obocie', name: 'Facelift - lifting obočia', price: 1000 },
    { id: 'ex_facelift_blepharo', name: 'Facelift - blefaroplastika', price: 600 },
  ],

  // 3. Korektívne výkony
  correctiveProcedures: [
    { id: 'cor_ha_05', name: 'Aplikácia kyseliny hyalurónovej - 0,5ml', price: 180 },
    { id: 'cor_ha_1', name: 'Aplikácia kyseliny hyalurónovej - 1ml', price: 290 },
    { id: 'cor_doplnenie', name: 'Doplnenie už zakúpeného materiálu', price: 50 },
    { id: 'cor_botox_1', name: 'Botox - 1 oblasť', price: 120 },
    { id: 'cor_botox_potenie', name: 'Botox - Odstránenie potenia v podpaží', price: 400 },
    { id: 'cor_botox_masseter', name: 'Botox - Zúženie tváre (Masseter)', price: 300 },
    { id: 'cor_hyaluronidaza', name: 'Aplikácia hyaluronidázy 150UI', price: 80 },
    { id: 'cor_kortikoidy', name: 'Kortikosteroidy', price: 20 },
    { id: 'cor_peeling', name: 'Chemický peeling', price: 50 },
    { id: 'cor_skinbooster', name: 'Skinbooster 1ml', price: 300 },
    { id: 'cor_sculptra', name: 'Sculptra', price: 450 },
    { id: 'cor_znamienko', name: 'Odstránenie znamienka', price: 90 },
    { id: 'cor_podkoznoutvar', name: 'Odstránenie podkožného útvaru (lipóm, ganglion,...)', price: 130 },
    { id: 'cor_utvar_lalok', name: 'Odstránenie útvaru s nutnosťou lalokovej plastiky alebo transplantátu', price: 400 },
  ],

  // 4. Služby
  services: [
    { id: 'srv_konzultacia', name: 'Konzultácia', price: 50 },
    { id: 'srv_predoperacne', name: 'Predoperačné vyšetrenia', price: 150 },
    { id: 'srv_histologia', name: 'Histologické vyšetrenie', price: 30 },
    { id: 'srv_nadstandard_izba', name: 'Nadštandardná samostatná lôžková izba', price: 30 },
  ],

  // 5. Pooperačná starostlivosť & Kompresívne prádlo
  aftercareAndGarments: [
    { id: 'gar_pi_ideal', name: 'PI ideal', price: 60 },
    { id: 'gar_pi_relax', name: 'PI relax', price: 75 },
    { id: 'gar_pi_filling', name: 'PI filling', price: 70 },
    { id: 'gar_pu_03', name: 'PU 03', price: 30 },
    { id: 'gar_vh_special', name: 'VH special comfort', price: 75 },
    { id: 'gar_vh_body', name: 'VH body variant', price: 75 },
    { id: 'gar_vd_comfort', name: 'VD comfort', price: 115 },
    { id: 'gar_vf_body', name: 'VF body/body comfort', price: 90 },
    { id: 'gar_mtms', name: 'MTmS comf', price: 80 },
    { id: 'gar_kplus', name: 'KPlus', price: 50 },
    { id: 'gar_fm', name: 'FM', price: 50 },
    { id: 'gar_ps_ideal', name: 'PS ideal', price: 75 },
    { id: 'gar_lipoelastic_gel', name: 'lipoelastic gel', price: 35 },
  ],
};

const DEFAULT_CLINIC_MACROS: Record<string, string> = {
  viecka: "VIEČKA:\n• Objem znížený, v neadekvátnej distribúcii\n• Koža v prebytku\n• Orbitálny tuk prolabuje na horných aj dolných mihalniciach\n• laterálny kantálny uhol v norme\n• Scleral show\n• Snap test a distorzný test adekvátny subadekvátny neadekvátny\n• Midface s deficitom v tukových kompartmentoch\n• Výška obočia cca. 5mm pod ideálnou pozíciou",
  nos: "NOS:\n• Dorsum - vyššej projekcie, primeranej šírky, dorzálne línie primeranej šírky nasion, rhinion, keystone, ASA\n• Špička - v hyperprojekcii, bulbózna, poklesnutá, kolumela, koža adekvátna\n• Krídla primeranej šírky a výšky\n• Septum - bez známok deviácie, endonazálne zväčšené conch, inf. bilat.\n• Inspiračný test - , Funkčné problémy -, Operácie nosa neguje",
  tvar: "TVÁR:\n• Objem znížený, v neadekvátnej distribúcii\n• koža jemná, papyrusová, výrazné mimické vrásky\n• Podkožné tkanivá laxné - gravitačné vrásky a previsy tkanív\n• Operácie tváre a korektívne zákroky",
  prsniky: "PRSNÍKY:\n• BW -\n• SNN -\n• CN -\n• NIMF - /SNIMF - /\n• PT -\n• Ptóza:\n• Koža:\n• Symetria:\n• Sizer: ",
  brucho: "BRUCHO:\n• koža - v prebytku, nízkej elasticity, strie\n• podkožie - PT brucho , boky\n• brušná stena - pevná, diastáza na cm v maxime okolí umbilika, voľne reponibilná umbilikálna hernia s bránkou cm\n• jazvy - ",
  lipo: "LIPO:\n• koža - v prebytku, nízkej elasticity, strie\n• podkožie - PT brucho , boky\n• jazvy - ",
  labio: "LABIO:\n• labia minora v excesii /cca. 3-4cm/",
  ruka: "RUKA:\nKarpálny tunel:\n• Tinel -, Phalen +\n• senzitívny deficit neprítomný, paroxyzmálne tŕpnutie, nočné bolesti\n• motorický deficit - slabosť, hypotrofia thenarových svalov\n\nDupuytrenova kontraktúra:\n• dlaňovo - prstová forma\n• DIP v norme, PIP flekč. kontr v 50°, CMP fix. v 20-30°\n• Tubiana II -III"
};

const DEFAULT_OP_MACROS: Record<string, string> = {
  op_facelift_macs: "V CA po príprave operačného poľa vykonávame tumescenciu plánovaného operačného poľa /adrenali 1:200000, levobupivacain, exacyl/ 60ml/strana. Následne vykonávame plánované rezy so zachovaním vlasov. folikulov vo vlasovej línii, retrotragálne a retroaurikulárne. Preparácia kožného laloka. Hemostáza. 3x loop slučka /vertikálna pretragálne, šikmá v oblasti líca - fixácia k preaurikulárnej fascii PDS 1.0, loop malárnej oblasti s fixáciou k periostu orbity - vicryl 2.0/. Hemostáza. Excízia prebytočnej kože s vertikálnym vektorom bez ťahu. Sutura, glykolon 4.0. Haemostatic net. Rezom v kapilíciu uvoľnujeme temporo-frontálne ligamentum a orbitálne ligamentá. Po uvolnení elevácia obočia s eleváciou viac vľavo na symetrizáciu /L2mm, P 3mm/, elevácia obmedzená predošlou blefaroplastikou. Fixácia o periost PDS 1.0. Suturam. frontalis a kože glykolon 4.0. Ohlávka.",
  op_deep_plane: "V CA po zavedení PMK, po príprave operačného poľa vykonávame tumescenciu plánovaného operačného poľa /adrenali 1:200000, levobupivacain, exacyl/ 60ml/strana + krk. Následne vykonávame plánované rezy so zachovaním vlasov. folikulov vo vlasovej línii, retrotragálne a retroaurikulárne. Preparácia kožného laloka. Hemostáza. V plánovanej línii preparujeme deep plane pod SMAS od latr. očného kútika až na krk pod m. platysma. za dôrazného šetrenia nervov a ciev. Prerušenie retaining ligament. Kontrola uvoľnenia tkanív. Sutura SMAS k temp. a parotid. fascii - superolaterálny vektor PDS 4.0. Priečne prerušenie m. platysma 1cm pod mandibolou a fixácia k fascii proc. mastoideu - hammock. Excízia prebytočnej kože. Sutura vo vrstvách. Obdobný postup na kontralat. strane. Haemostatic net. Suturam. frontalis a kože. Ohlávka.",
  op_necklift: "V CA po príprave operačného poľa vykonávame tumescenciu plánovaného operačného poľa /adrenali 1:200000, levobupivacain, exacyl/ 60ml/strana. Submentálnym prístupom preparujeme subkutánny priestor celej oblasti krku. Preparujeme okraje m. platysma a exstirpujeme submandibulány tuk. preparujeme a excidujeme ptotickú časť mm. digastrici a gl. submandibul. bilat. Dôsledná hemostáza. Fixácia platysma k fascii perihyoidálne. Centrálne raphia platysmy s priečnym nárezom infrahyoidálne",
  op_lipotransfer: "V CA po príprave operačného poľa v tumescencii vykonávame odber tuku na lat. stranách stehien. Odber celkovo 30ml tukového tkaniva. Sutura vstupov monocryl. Následne spracovámvame tuk na mikro a nano-tuk, ktorý po spracovaní aplikujeme do tváre plošne /mal. oblasť, obočie, čelo, periorálna oblasť, spánky/ - nanotuk /dolné viečka, plošne microneedling kože s nanotukom/.",
  op_liposukcia_podbradku: "V analgosedácii po príprave operačného poľa v tumescencii vykonávame PAL liposukciu podbradku plánovanom rozsahu. Sutura vstupov monocryl. Poop. prádlo.",
  op_tvarove_implantaty: "V CA po príprave operačného poľa vykonávame tumescenciu plánovaného operačného poľa /adrenali 1:200000, levobupivacain, exacyl/. Následne zo submentálneho prístupu preparujeme subperiostálnu kapsu. Po namočení v betadine aplikujeme bradový implantát su-por. Spájame implantát stehmi centrálne. Fixujeme samoreznými skrutkami 2x. Kontrola mentálnych nervov. Hemostáza. Zahladenie okrajov voskom. Sutura muskulárnej kapsy, podkožia a kože. Zo slizničného prísupu úst vykonávame subperiostálnu kapsu okraja mandibuly. Po namočení v betadine aplikujeme implantát okraja mandibuly su-por podľa strany. Fixujeme samoreznými skrutkami 2x/strana. hemstáza, Mierne orezenie okraja implantátu v mentálnj časti na zahladenie okrajov aplikueme vosk. Obdobný postup na kontralat. strane.",
  op_horna_blepharo: "Fotodokumentácia, vyplánovanie a zakreslenie pre výkonom. Po príprave operačného poľa a vyplánovaní , aplikujeme lokálne anestetikum, 1% mesocain s adrenalínom. Na hornej mihalnici bilat. odstraňujeme nadbytočné rias po haemostáze redukujeme retrobulb. tuk med. a centrálne. Sutura kože ID monofil 6/0 Steri stripp, krytie. Rovnaký postup na kontralater. strane.",
  op_dolna_blepharo: "Po príprave operačného poľa a vyplánovaní , aplikujeme lokálne anestetikum, 1% mesocain s adrenalínom. V subciliárnej incízii resekujeme prebytočnú kožu, následne resekujeme malé porcie lat. mediálneho a centrálneho retrosept. tuku s tenkým pásom prebytočného orbik. svalu. Uvoľnenie retaining ligamenta a zdvih o periost orbity 4.0. Záves m. orbicularis. Sutura kože ID monofil 6/0 Steri stripp, krytie. Rovnaký postup na kontralater. strane.",
  op_transpalpebral: "Transpalpebrálnym prístupom v submuskulárnej vrstve uvoľnujeme priestor na eleváciu ROOF. Fixácia o periost 2.0 vicryl symetricky na oboch stranách.",
  op_gliding_brow: "V CA po príprave operačného poľa v tumescencii /adrenali 1:200000, levobupivacain, exacyl/ 40ml/strana, vykonávame z frontálneho prístupu preparáciu kože od podkožných štruktúr. Po kompletnom uvoľnení fixujeme kože pomocou hemostatickej siete do požadovanej pozície. Z temporálneho prístupu fixujeme vicryl 2.0 malárny priestor o temporálnu fasciu. Krytie. Poop. prádlo.",
  op_endo_brow: "V CA po príprave operačného poľa v tumescencii /adrenali 1:200000, levobupivacain, exacyl/ 40ml/strana, vykonávame z malých incízií v kapilíciu endoskopickú preparáciu subperiosteálnej kapsy na čele, nad hlbokou temporálnu fasciou v oblasti spánkov a v malárnom tukovom kompartmente. Izolujeme a šetríme nervy a cievy. Po kompletnom uvoľnení progresívne fixujeme uvoľnené tkanivá PDS 3.0 o tempor. fasciu a transparietálne. Sutura vo vrstvách. Krytie. Poop. prádlo.",
  op_rhino_komplet: "V CA aplikujeme vazokonstrikčný roztok /adrenalin, levobupivacain, exacyl, FR/. Kilian. prístupom preparujeme septum od sliznice a odoberáme septálny chrup. štep - low strip 10mm a vertical strip 7mm. Vykonávame septoplastiku QC flap s kompletnou deliberáciou. Subdorzálne osteotómia s excíziou 2mm trojuholník kosti. Zatvorený prítupom si prístupňujeme alárne chrupavky. Rim flap 1mm. Subperichondrálna preparácia alar. chrupaviek a ULC, subperiosteálna preparácia laterálne, bez preparácie dorza. Piezotomické osteotómie s banana nízkou resekciou 1mm. Proximálne osteotómie in-out. Let down. Fixácia septa k ANS PDS 4.0 + kite flap. Modelácia špičky. Zúženie alárnych chrupaviek na 6mm, Osman flap + fix PDS 6.0. Lateral crural steal 3mm, medial crural overlap 2mm, modelácia nových domov. Sturt, subdomal graft, polygon tip, fixácia PDS 6.0. Rekonštrukcia scroll ligamenta. Sutura sliznice a kože PDS 6.0. peDCG nad nasion, WASA, infratip a nad ANS. Alárna redukcia V-rapid 5.0. Doyle splint bilat. Transseptálna sutura vicryl rapid 5.0. Krytie. Taping. Termoplastová dlaha.",
  op_rhino_spicka: "V LA aplikujeme vazokonstrikčný roztok /adrenalin, marcain, exacyl, FR/. Zatvoreným prístupom si sprístupňujeme alárne chrupavky. Rim flap /2x6mm/ a zúženie chrupaviek na 6mm. Osman flap. Rasping nazálnych kostí. Modelácia špičky - lateral crural steal 1mm, modelácia nových domov - Gruber, TD a ID sutury - skrátenie med. crura o 1mm. Sutura sliznice a kože. Krytie. Taping.",
  op_usi: "V CA aplikujeme vazokonstrikčný roztok /adrenalin, levobupivacain, TXA, FR/. z dorzálneho prístupu preparujeme chrupavku od perichondria v celom plánovanom rozsahu. Perkutánne uvoľˇujeme kožu ponad plánovanú oblasť. Aplikujeme modelačné stehy PDS 3.0 a tvarujeme antihelix . Kontrola symtrie. Hemostáza. Sutura kože. Krytie. Taping. Poop. prádlo.",
  op_lip_lift: "V LA po vyplánovaní a kontrole meraní vykonávame bullhorn lip lift s excíziou cca. 5mm kože. Podmínovanie kože a uvoľnenie SMAS. Fixácia SMAS /PDS 5.0/ a sutura kože/Prolene 6.0/. Steristripy.",
  op_aug_dual: "V CA po príprave oper. podľa Adamsovo plánu, vyplánovaní aplikujeme lok. anestetikum do jaziev. V inframamárnej ryhe vykonávame incíziu a preparujeme dual plane I. Výplach, hemostáza, výmena inštrumentária.Po oplachu implantátov ATB roztokom inzerujeme implantáty /Polytech, B-lite, ROund-Meme, Mesmo/. SFS fixujeme v celom dolnom a laterálnom póle kavity bilat. Sutura vo vrstvách. Steristrip. Krytie. Poop. podprsenka.",
  op_aug_sub: "V CA po príprave oper. podľa Adamsovo plánu, vyplánovaní aplikujeme lok. anestetikum do jaziev. V inframamárnej ryhe vykonávame incíziu a preparujeme subfascialnu kapsu. Výplach, hemostáza, výmena inštrumentária.Po oplachu implantátov ATB roztokom inzerujeme implantáty /Motiva E2SM 220cc/. SFS fixujeme v celom dolnom póle kavity bilat. Sutura vo vrstvách. Steristrip. Krytie. Preventívna NPWT na jazvy. Poop. podprsenka.",
  op_aug_mastopexia: "V CA po príprave oper. podľa Adamsovo plánu, vyplánovaní aplikujeme lok. anestetikum do jaziev. V inframamárnej ryhe vykonávame incíziu a preparujeme dual plane I. Výplach, hemostáza, výmena inštrumentária.Po oplachu implantátov ATB roztokom inzerujeme implantáty /Mentor, anatom., CPG , 395cc/. SFS fixujeme v celom dolnom a laterálnom póle kavity bilat. Sutura vo vrstvách. Následne vykonávame excíziu prebytočného tkaniva kože a dolnej časti žľazy. Žľazu modelujeme a NAC presúvame na hornej stopke do neopozície. Sutura pilonov vicryl 2.0. Kontrola symetrie. Sutura vo vrstvách. Sutura kože glykolon ID. Krytie rany. Poop. prádlo",
  op_mastopexia: "V CA po príprave oper. poľa, vyplánovaní vykonávame excíziu prebytočného tkaniva kože. Lalok kože na dolnej stopke podľa Ribeira fixujeme o m. pectoralis 2.0. Žľazu modelujeme a NAC presúvame na hornej stopke do neopozície. Sutura pilonov vicryl 2.0. Kontrola symetrie. Sutura vo vrstvách. Sutura kože glykolon ID. Aplikujeme lok. anestetikum do jaziev Krytie rany. Poop. prádlo.",
  op_redukcia: "V CA po príprave oper. poľa, vyplánovaní - Wise pattern - vykonávame excíziu prebytočného tkaniva kože. Resekujeme prebytočné tkanivo - vľavo - vpravo. Modelujeme žľazu a NAC presúvame na hornej stopke do neopozície. Sutura pilonov vicryl 2.0. Kontrola symetrie. Sutura vo vrstvách. Sutura kože glykolon ID. Aplikujeme lok. anestetikum do jaziev Krytie rany. Poop. prádlo.",
  op_vymena: "V CA po príprave oper. podľa Adamsovo plánu, vyplánovaní aplikujeme lok. anestetikum do jaziev. V inframamárnej ryhe vykonávame incíziu a preparujeme kapsu vpravo. Kapsa silne fibroticky zmenená - cca. 3mm. Etrahujeme implantát // a excidujeme kapsu subtotálne - ponechávame dolný laterálny pól, ktorý fixujeme K fascii PDS 2.0 ako “internal bra”. Výplach, hemostáza, výmena inštrumentária. Obdobný postup na kontralaterálnej strane. Po oplachu implantátov ATB roztokom Kellerovym tunelom inzerujeme implantáty //. SFS fixujeme v celom dolnom a laterálnom póle kavity bilat. Sutura vo vrstvách. Steristrip. Krytie. Poop. podprsenka.",
  op_gynekomastia: "V CA po príprave operačného poľa splikujeme tumescenciu /Bikarbonát, FR, adrenalin, mesocain, levobupivacain/. Vykonávame PAL liposukciu označeného okolia a následne exstirpujeme žľazu bilat /2x2cm/ - mat. ad histologiam. Hemostáza. Kontrola symetrie. Sutura vo vrtvách /vycril 4.0 , glycolon 4.0 ID/. Poop. prádlo.",
  op_lipografting: "V CA po príprave operačného poľa v tumescencii vykonávame PAL liposukvćiu hlbokej a strednej vrstvy tuku trupu. Mierna HD modelácia povrchového tuku. Odber celkovo 1l tukového tkaniva cez lipocollector. Odobratý tuk spracovávame ako makrograft a aplikujeme do prsníkov, 300cc strana. Sutura vstupov monocryl. Pooperačné prádlo.",
  op_abdominoplastika: "V CA po príprave oper. poľa, vyplánovaní aplikujeme lok. anestetikum do plánovaného oper. poľa. Rezom v podbrušku si preparujeme svalovú fasciu brušnej steny v rozsahu priamych brušných svalov až ku xiphoidu a v rozsahu plánovanej horizontálnej kožnej resekcie. Odpojenie umbilika od kože. Dôsledna hemostáza perforátorov. Diastázu rozsahu šírky 6cm v maxime supraumbilikálne ošetrujeme raphiou v dvoch vrtvách /Stratafix 1.0 a 2.0/ SFS fixujeme progressive tension suturami /vycril 2.0/. Resekcia cca. 10x20cm kože bez ťahu. Sutura vo vrstvách. R-drenáž krytie. Steristrip. Krytie. Poop. podprsenka.",
  op_abdo_kratky_rez: "V CA po príprave oper. poľa, vyplánovaní aplikujeme lok. anestetikum do plánovaného oper. poľa. Rezom v podbrušku si preparujeme úzkym tunelom svalovú fasciu brušnej steny v rozsahu priamych brušných svalov až ku xiphoidu a v rozsahu plánovanej kožnej resekcie. Odpojenie umbilika pri báze. Dôsledna hemostáza perforátorov. Nález umbilikálnej hernie s bránkou veľkosti 1,5cm ošetrujeme resekciou vaku a suturami sec. Mayo. Diastázu rozsahu v oblasti šírky 6cm v maxime supraumbilikálne ošetrujeme raphiou v dvoch vrtvách /Stratafix 1.0 a 2.0/ SFS fixujeme progressive tension suturami /vycril 2.0/. Resekcia cca. 10x20cm kože bez ťahu. Sutura vo vrstvách. R-drenáž krytie. Steristrip. Krytie. Poop. podprsenka.",
  op_mini_abdo: "V CA po príprave oper. poľa, vyplánovaní aplikujeme lok. anestetikum do plánovaného oper. poľa. Rezom v podbrušku si preparujeme svalovú fasciu brušnej steny v rozsahu plánovanej kožnej resekcie. Dôsledna hemostáza perforátorov. SFS fixujeme progressive tension suturami /vycril 2.0/. Resekcia cca. 10x20cm kože bez ťahu. Sutura vo vrstvách. Steristrip. Krytie. Poop. podprsenka.",
  op_lipo_360: "V CA po príprave operačného poľa v tumescencii vykonávame PAL liposukvćiu hlbokej a strednej vrstvy tuku trupu. Mierna HD modelácia povrchového tuku. Odber celkovo 2l tukového tkaniva. Sutura vstupov monocryl. Pooperačné prádlo.",
  op_armlift: "V CA po príprave operačného poľa a kontrole plánovania v tumescencii vykonávame PAL liposukciu hlbokej a strednej vrstvy tuku rúk. Odber celkovo ml tukového tkaniva. Sutura vstupov monocryl. Následne vykonávame excízie vyplánovananých častí kože a podkožia s prísnym šetrením ciev a nervov. Sura vo vrstvách bez ťahu. Pooperačné prádlo.",
  op_labioplastika: "V LA/ analgosedácií po príprave operačného poľa v gynekologickej polohe po dôslednom vyplánovaní. zakreslení a kontrole symetrie vykonávame excíziu excesívnych častí labia minora. Hemostáza. sutura vo vrstvách Glykolon 4.0. Krytie.",
  op_karpal: "V karpálnom bloku /levobupivacain + adrenalin/ - v prídavnej tumescencii LA /mesocain + adrenalin/ po príprave operačného poľa, v bezkrvnom prostredí za použitia končatinového turniketu krátnym pozdĺžnym rezom medzi thenarom a hypothenarom vykonávame discíziu karp. ligamenta a uvoľňujeme tak n. medianus. Kontrola deliberácie. Dôsledná hemostáza. Sutura. Krytie. Bandáž.",
  op_dupuytren: "V karpálnom bloku /levobupivacain + adrenalin/ - v prídavnej tumescencii LA /mesocain + adrenalin/ po príprave operačného poľa vykonávame v bezkrvnom prostredí za použitia končatinového turniketu plánujeme rezy Z-plastík. Odklápame kožné laloky nad kontraktúrami a s dôsledným šetrením okolitých tkanív preparujeme pruh od med. článku IV. prsta až k stredovej časti dlane. Resekujeme pruh a okolité časti palm. aponeurózy. Dôsledná hemostáza. Sutura kože a R-drenáž. Krytie. Bandáž.",
  op_excizie: "V ……….. bloku /levobupivacain + adrenalin/ - v prídavnej tumescencii LA /mesocain + adrenalin/ po príprave operačného poľa vykonávame exstirpáciu …………… bez porušenia obalu s dôsledným šetrením okolitých tkanív. Mat. ad. histologiam. Sutura kože."
};

// PREDVOLENÉ ČASOVÉ ŠABLÓNY PRE KONTROLNÉ VYŠETRENIA
export const DEFAULT_CHECKUP_MACROS: Record<string, {
  label: string;
  timeframe: string;
  subjective: string;
  objective: string;
  recommendations: string[];
  nextCheckup: string;
}> = {
  checkup_1w: {
    label: "Kontrola po 1 týždni (7-10 dní)",
    timeframe: "1 týždeň po operácii",
    subjective: "Pacient/ka udáva primeraný pooperačný priebeh vzhľadom na dobu od výkonu. Bolesť minimálna až mierna, dobre kontrolovaná bežnou analgetickou liečbou (užíva len sporadicky). Pocit mierneho napätia a tlaku v operovanej oblasti. Bez febrilít, bez triašky, bez dýchavičnosti.",
    objective: "Lokálny nález: Operačné rany pokojné, okraje rany presne adaptované, zhojené per primam intentionem (p.p.i.). Bez známok dehiscencie, bez prítomnosti hematómu či fluktuácie (serómu). Bez lokálnych zápalových prejavov (bez erytému, bez sekrécie). Mierny pooperačný edém v očakávanom rozsahu. Steri-strippy / stehy odstránené podľa plánu, toaleta rany, dezinfekcia.",
    recommendations: [
      "Ranu a operačné pole udržiavať v suchu a čistote, lokálna dezinfekcia (Octenisept / Betadine).",
      "Sprchovanie čistou vlažnou vodou bez dráždivých mydiel povolené po 48h od vybratia stehov, rany jemne osušiť čistým uterákom (netrieť).",
      "Striktné nosenie predpísanej kompresívnej pooperačnej bielizne / bandáže 24/7 (zložiť len na hygienu).",
      "Fyzické šetrenie, vyhnúť sa predkláňaniu, prudkým pohybom a zdvíhaniu bremien nad 3-5 kg.",
      "Aplikácia silikónového gélu / silikónových náplastí (Strataderm/Dermatix/Lipoelastic) až po úplnom odpadnutí všetkých chrást.",
      "Možnosť zahájenia doplnkovej regeneračnej terapie: aplikácia polynukleotidov (Rejuran S) a frakčný / cievny laser po 10-14 dňoch od operácie na optimalizáciu a urýchlenie hojenia.",
      "V prípade akútnej bolesti, asymetrického náhleho opuchu alebo teploty nad 37.8°C kontaktovať kliniku ihneď."
    ],
    nextCheckup: "O 3-4 týždne (po 1 mesiaci od operácie)"
  },
  checkup_1m: {
    label: "Kontrola po 1 mesiaci (4 týždne)",
    timeframe: "1 mesiac po operácii",
    subjective: "Pacient/ka udáva výrazné zlepšenie celkového stavu, bez spontánnych bolestí, plný návrat k ľahkým bežným denným činnostiam. Pocit postupného uvoľňovania operovaných tkanív, s doterajším vývojom spokojný/á.",
    objective: "Lokálny nález: Rany kompletne epitelizované, bez chrást a bez sekrécie. Jazvy pokojné, lineárne, v štádiu fyziologickej pooperačnej prestavby (ružovkasté, mäkké). Bez sklonu k hypertrofii. Pooperačný edém výrazne ustúpil, symetria a kontúry primerané štádiu hojenia.",
    recommendations: [
      "Začať cielenú starostlivosť o jazvy: aplikácia silikónového gélu (Strataderm / Dermatix / Lipoelastic gel) alebo silikónových náplastí 2x denne na čisté a suché jazvy (keď je rana úplne bez chrást).",
      "Vykonávať pravidelné tlakové masáže jaziev (krúživý tlak prstami / valčekom 3-5x denne po 5 minút) na zmäkčenie a sploštenie tkaniva.",
      "Doporučená aplikácia polynukleotidov (Rejuran S) a frakčného / cievneho lasera na vyhladenie a minimalizáciu jaziev.",
      "Kompresívnu bielizeň nosiť podľa odporúčania operatéra (pri augmentácii/abdominoplastike pokračovať do 6. týždňa).",
      "Striktná ochrana jaziev pred priamym slnečným a UV žiarením (SPF 50+) minimálne počas 6 mesiacov.",
      "Vyhnúť sa ťažkému posilňovaniu, saune, bazénom a soláriu ďalšie 4 týždne."
    ],
    nextCheckup: "O 2 mesiace (po 3 mesiacoch od operácie)"
  },
  checkup_3m: {
    label: "Kontrola po 3 mesiacoch",
    timeframe: "3 mesiace po operácii",
    subjective: "Subjektívne bez akýchkoľvek ťažkostí, plná adaptácia. Pacient/ka vyjadruje vysokú spokojnosť s tvarom, symetriou a priebežným estetickým výsledkom.",
    objective: "Lokálny nález: Jazvy v pokročilom štádiu maturácie, blednúce, pružné, ploché, bez hypertrofie a bez keloidných formácií. Edém takmer kompletne vymiznutý, tkanivá mäkké a prirodzene pohyblivé. Anatomické pomery stabilné a harmonické.",
    recommendations: [
      "Pokračovať v aplikácii silikónových prípravkov a v tlakových masážach jaziev ešte aspoň 1-2 mesiace.",
      "Možnosť zopakovania ošetrenia Rejuran S / laserovej korekcie pre maximalizáciu estetického efektu jaziev.",
      "Postupný návrat k plnej športovej a fyzickej záťaži vrátane cvičenia a posilňovania.",
      "Pokračovať v striktnej fotoprotekcii jaziev (SPF 50+) pri expozícii slnku."
    ],
    nextCheckup: "O 3 mesiace (pol roka od operácie)"
  },
  checkup_6m: {
    label: "Kontrola po 6 mesiacoch (pol roka)",
    timeframe: "6 mesiacov po operácii",
    subjective: "Subjektívny stav výborný, bez obmedzení v bežnom aj športovom živote. Plná spokojnosť s výsledkom operácie.",
    objective: "Lokálny nález: Jazvy bledé, jemné, ploché v úrovni okolitej kože, normotrofické. Tkanivá mäkké, prirodzené na pohmat. Implantáty / operované štruktúry v ideálnej anatomickej pozícii. Estetický výsledok stabilný a vysoko harmonický.",
    recommendations: [
      "Bežná starostlivosť o pokožku (hydratačné krémy, telové mlieka).",
      "Ochrana pred UV žiarením pri opaľovaní (SPF 50+) do 1 roka od operácie.",
      "Bez obmedzení v akejkoľvek fyzickej, športovej alebo pracovnej aktivite."
    ],
    nextCheckup: "O 6 mesiacov (ročná definitívna kontrola)"
  },
  checkup_1y: {
    label: "Definitívna kontrola po 1 roku",
    timeframe: "1 rok po operácii",
    subjective: "Definitívny pooperačný stav, pacient/ka bez akýchkoľvek ťažkostí, maximálna spokojnosť s estetickým aj funkčným výsledkom.",
    objective: "Lokálny nález: Jazvy plne maturované, biele, tenké, nenápadné. Tkanivá vo výbornej kondícii, stabilný definitívny tvar a symetria.",
    recommendations: [
      "Pooperačná ambulantná starostlivosť k danému výkonu ukončená ako úspešná.",
      "V prípade prsných implantátov odporučená pravidelná preventívna USG / sonografia prsníkov 1x ročne.",
      "Ďalšia kontrola podľa potreby alebo na prianie pacientky."
    ],
    nextCheckup: "Podľa potreby / na vyžiadanie"
  }
};

// PREDDEFINOVANÝ PERSONÁL PRE OPERAČNÝ TÍM
export const SURGICAL_TEAM_PRESETS = {
  operators: [
    'MUDr. Ján Mráz',
    'MUDr. Zuzana Sroková, MPH',
    'MUDr. Minh Tuong Tran'
  ],
  assistants: [
    'Bez asistencie',
    'MUDr. Zuzana Sroková, MPH',
    'MUDr. Minh Tuong Tran',
    'MUDr. Ján Mráz',
    'Sabina Lenhartová',
    'Ema Foltáni',
    'Bc. Katarína Ondrušová'
  ],
  anesthesiologists: [
    'MUDr. Peter Kováč',
    'MUDr. Ivan Bella',
    'MUDr. Martin Hraško',
    'MUDr. Elena Vargová',
    'Lokálna anestézia (bez anesteziológa)'
  ],
  instrumentalists: [
    'Sabina Lenhartová',
    'Ema Foltáni',
    'Bc. Katarína Ondrušová',
    'Mgr. Elena Solivajsová'
  ],
  anestNurses: [
    'Ema Foltáni',
    'Sabina Lenhartová',
    'Bc. Andrea Kmeťová',
    'Bez anest. sestry (Lokálna anestézia)'
  ]
};

export interface SurgeryImplantItem {
  id: string;
  vyrobca: string;
  model: string;
  kat: string;
  objem: string;
  strana: string;
  lot: string;
  sn: string;
}

// AUTOMATICKÉ ODPORÚČANIA PO OPERÁCII PRE OŠETRUJÚCI PERSONÁL PODĽA TYPU OPERÁCIE
export const DEFAULT_POSTOP_STAFF_RECOMMENDATIONS: Record<string, string[]> = {
  breast: [
    "Polohovanie pacienta: Fowlerova poloha (elevácia trupu 30° – 45°), nezaťažovať horné končatiny.",
    "Monitorovanie vitálnych funkcií (TK, P, SpO2, vedomie) každých 30 min. prvé 2 hodiny, následne á 1 hod.",
    "Kontrola kompresívnej podprsenky a stabilizačného pásu – prádlo nesmie tlačiť v axilách a nesmie sa uvoľňovať.",
    "Lokálne chladenie: Suchý chlad (gélové vankúšiky cez sterilné krytie na horný pól dekoltu) á 20 min.",
    "Sledovanie symetrie prsníkov, tenzie tkanív a prípadného krvácania/hematómu (náhly asymetrický opuch ihneď hlásiť lekárovi).",
    "Kontrola a zaznamenávanie odpadu z Redonových drénov (množstvo v ml, farba, podtlak).",
    "Analgézia: Aplikácia ordinovaných analgetík (i.v. / p.o.) pri VAS > 3, zákaz podávania kyseliny acetylsalicylovej.",
    "Mobilizácia: Prvá vertikalizácia výhradne za asistencie sestry s kontrolou tlaku krvi, zákaz dvíhania rúk nad úroveň ramien."
  ],
  abdomen: [
    "Polohovanie: Fowlerova poloha s podloženými/ohnutými kolenami (zníženie tenzie na sutúru brušnej steny).",
    "Monitorovanie vitálnych funkcií a diurézy, sledovanie celkového pooperačného stavu.",
    "Kontrola a správne nastavenie kompresívneho brušného pásu / body (rovnomerný tlak bez záhybov).",
    "Kontrola funkčnosti a odpadu z Redonových drénov (záznam množstva sekrétu v ml a charakteru).",
    "Prevencia tromboembolizmu (TEN): Bandáž / kompresívne pančuchy DK, aplikácia nízkomolekulárneho heparínu (LMWH) podľa ordinácie, precvičovanie distálnych končatín na lôžku.",
    "Mobilizácia: Vstávanie výhradne s doprovodom sestry v miernom predklone trupu (šetriaci režim sutúry).",
    "Analgézia a antiemetická terapia podľa lekárskej preskripcie."
  ],
  liposuction: [
    "Kontrola kompresívneho prádla (presné priliehanie, nesmie vytvárať zárezy a kompresiu ciev).",
    "Sledovanie a pravidelná výmena absorpčných sterilných podložiek pri presakovaní tumescentného roztoku.",
    "Hydratácia: Postupný príjem tekutín po vymiznutí poanestetickej nauzey, parenterálna hydratácia podľa ordinácie.",
    "Monitorovanie TK a pulzu – pozor na ortostatickú hypotenziu pri prvej vertikalizácii.",
    "Prvá mobilizácia s asistenciou personálu po stabilizácii vitálnych parametrov.",
    "Analgézia podľa ordinácie operatéra."
  ],
  face: [
    "Polohovanie: Zvýšená poloha hlavy a trupu (30° – 45°), zákaz predkláňania a prudkých rotácií hlavy.",
    "Lokálne chladenie: Suché chladivé gélové obklady cez gázu na líca a submandibulárnu oblasť.",
    "Sledovanie prekrvenia kožných lalokov (kapilárny návrat, farba, teplota, vylúčenie cyanózy alebo hematómu).",
    "Kontrola fixačnej ohlávky / kompresívneho obväzu (tlak nesmie spôsobovať ischémiu ušníc).",
    "Kontrola hemostatic netu a drenáže (sledovanie sekrécie a presakovania).",
    "Prísny kľudový režim, zákaz mimického prepínania a žuvania tuhej stravy (tekutá/kašovitá strava)."
  ],
  eyelids: [
    "Polohovanie vo zvýšenej polohe (Fowler 30°), zákaz predkláňania a tlaku na oči.",
    "Aplikácia suchých chladivých gélových obkladov na viečka (á 15-20 minút) na prevenciu edému a sufúzií.",
    "Kontrola krytia a prípadného presakovania krvi z operačných rán na viečkach.",
    "Sledovanie zrakových funkcií, reakcie zreníc a bulbomotoriky (prípadnú bolesť za okom alebo poruchu zraku ihneď hlásiť!).",
    "Aplikácia očných kvapiek / masti podľa ordinácie lekára."
  ],
  nose: [
    "Polohovanie hlavy v elevácii (30° – 45°), dýchanie ústami.",
    "Kontrola a pravidelná výmena sterilného praku (absorpčnej gázy) pod nosom, kontrola tamponády/dlahy.",
    "Lokálne chladenie periorbitálnej oblasti (ľadové obklady na oči a líca, NIE priamo na nos).",
    "Zákaz smrkania, vyfukovania nosa a predkláňania, kýchanie len s otvorenými ústami.",
    "Starostlivosť o pery a ústnu dutinu (zvlhčovanie z dôvodu dýchania ústami)."
  ],
  labia: [
    "Kľudový režim na lôžku v horizontálnej polohe s mierne podloženými dolnými končatinami.",
    "Pravidelné lokálne chladenie cez sterilné krytie (suchý chlad).",
    "Sledovanie operačnej rany: kontrola krvácania, opuchu a hematómu.",
    "Intímna hygiena: po každej mikcii oplach vlažnou vodou / dezinfekčným roztokom, jemné sušenie bez trenia.",
    "Použitie priedušnej bavlnenej bielizne a sterilných vložiek bez parfumácie."
  ],
  extremity: [
    "Polohovanie operovanej končatiny v elevácii (šatka / podloženie vankúšom) na zníženie edému a pulzácie.",
    "Pravidelná kontrola prekrvenia, citlivosti a teploty prstov (kapilárny návrat < 2s).",
    "Kontrola sterilného obväzu, nesmie škrtiť ani byť presiaknutý krvou.",
    "Šetrné pasívne/aktívne precvičovanie voľných prstov.",
    "Analgézia per os pri nástupe bolesti po odznení lokálneho anestetika."
  ],
  default: [
    "Polohovanie pacienta vo Fowlerovej polohe s eleváciou trupu 30°.",
    "Monitorovanie vitálnych funkcií (TK, P, SpO2, vedomie) v pravidelných intervaloch.",
    "Pravidelná kontrola operačnej rany a sterilného krytia na známky krvácania.",
    "Aplikácia ordinovanej analgetickej a antiemetickej terapie.",
    "Dohľad nad hydratáciou a postupným príjmom tekutín.",
    "Mobilizácia pacienta výhradne za asistencie ošetrujúceho personálu."
  ]
};

export const getStaffRecommendationsForProcedure = (procedureName: string): string => {
  const norm = (procedureName || '').toLowerCase();
  let list: string[] = DEFAULT_POSTOP_STAFF_RECOMMENDATIONS.default;

  if (norm.includes('prs') || norm.includes('augmen') || norm.includes('mastopex') || norm.includes('redukc') || norm.includes('implantát')) {
    list = DEFAULT_POSTOP_STAFF_RECOMMENDATIONS.breast;
  } else if (norm.includes('abdomin') || norm.includes('brucho') || norm.includes('diastáz') || norm.includes('miniabdo') || norm.includes('bodylift')) {
    list = DEFAULT_POSTOP_STAFF_RECOMMENDATIONS.abdomen;
  } else if (norm.includes('lipo')) {
    list = DEFAULT_POSTOP_STAFF_RECOMMENDATIONS.liposuction;
  } else if (norm.includes('face') || norm.includes('smas') || norm.includes('neck') || norm.includes('krk') || norm.includes('deep plane') || norm.includes('lift')) {
    list = DEFAULT_POSTOP_STAFF_RECOMMENDATIONS.face;
  } else if (norm.includes('blefaro') || norm.includes('vieč') || norm.includes('brow')) {
    list = DEFAULT_POSTOP_STAFF_RECOMMENDATIONS.eyelids;
  } else if (norm.includes('rhino') || norm.includes('nos') || norm.includes('septo')) {
    list = DEFAULT_POSTOP_STAFF_RECOMMENDATIONS.nose;
  } else if (norm.includes('labio') || norm.includes('intím')) {
    list = DEFAULT_POSTOP_STAFF_RECOMMENDATIONS.labia;
  } else if (norm.includes('karpál') || norm.includes('prst') || norm.includes('dupuytren') || norm.includes('ruka') || norm.includes('znamien')) {
    list = DEFAULT_POSTOP_STAFF_RECOMMENDATIONS.extremity;
  }

  return list.map(item => `• ${item}`).join('\n');
};

const calculateAgeFromRC = (rc: string) => {
  if (!rc || rc.length < 9) return '';
  const cleanRc = rc.replace(/\D/g, '');
  if (cleanRc.length < 9) return '';
  
  let year = parseInt(cleanRc.substring(0, 2), 10);
  let month = parseInt(cleanRc.substring(2, 4), 10);
  const day = parseInt(cleanRc.substring(4, 6), 10);
  
  if (isNaN(year) || isNaN(month) || isNaN(day)) return '';
  
  if (month > 50) month -= 50;
  if (month > 20) month -= 20;
  
  year += (year > 26) ? 1900 : 2000;
  
  const today = new Date();
  let age = today.getFullYear() - year;
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) {
    age--;
  }
  return age.toString();
};

export const calculateBirthDateFromRC = (rc: string): string => {
  if (!rc || rc.length < 6) return '';
  const cleanRc = rc.replace(/\D/g, '');
  if (cleanRc.length < 6) return '';

  let year = parseInt(cleanRc.substring(0, 2), 10);
  let month = parseInt(cleanRc.substring(2, 4), 10);
  const day = parseInt(cleanRc.substring(4, 6), 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return '';

  if (month > 50) month -= 50;
  if (month > 20) month -= 20;

  year += (year > 26) ? 1900 : 2000;

  const pad = (n: number) => n < 10 ? `0${n}` : `${n}`;
  return `${pad(day)}. ${pad(month)}. ${year}`;
};

export const formatSlovakDateLong = (dateStr: string): string => {
  if (!dateStr) return new Date().toLocaleDateString('sk-SK');
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  const monthsGenitive = [
    'januára', 'februára', 'marca', 'apríla', 'mája', 'júna',
    'júla', 'augusta', 'septembra', 'októbra', 'novembra', 'decembra'
  ];
  return `${d.getDate()}. ${monthsGenitive[d.getMonth()]} ${d.getFullYear()}`;
};

export const numberToSlovakWords = (num: number): string => {
  if (isNaN(num)) return '';
  num = Math.round(Math.abs(num));
  if (num === 0) return 'nula';

  const units = ['', 'jeden', 'dva', 'tri', 'štyri', 'päť', 'šesť', 'sedem', 'osem', 'deväť'];
  const teens = ['desať', 'jedenásť', 'dvanásť', 'trinásť', 'štrnásť', 'pätnásť', 'šestnásť', 'sedemnásť', 'osemnásť', 'devätnásť'];
  const tens = ['', 'desať', 'dvadsať', 'tridsať', 'štyridsať', 'päťdesiat', 'šesťdesiat', 'sedemdesiat', 'osemdesiat', 'deväťdesiat'];
  const hundreds = ['', 'sto', 'dvesto', 'tristo', 'štyristo', 'päťsto', 'šesťsto', 'sedemsto', 'osemsto', 'deväťsto'];

  const convertHundreds = (n: number): string => {
    let res = '';
    const h = Math.floor(n / 100);
    const remainder = n % 100;
    if (h > 0) res += hundreds[h];
    if (remainder >= 10 && remainder <= 19) {
      res += teens[remainder - 10];
    } else {
      const t = Math.floor(remainder / 10);
      const u = remainder % 10;
      if (t > 0) res += tens[t];
      if (u > 0) res += units[u];
    }
    return res;
  };

  let result = '';
  const thousands = Math.floor(num / 1000);
  const remainder = num % 1000;

  if (thousands > 0) {
    if (thousands === 1) {
      result += 'tisíc';
    } else {
      result += convertHundreds(thousands) + 'tisíc';
    }
  }

  if (remainder > 0) {
    result += convertHundreds(remainder);
  }

  return result;
};

export type DocumentType = 
  | 'vstupne_vysetrenie'
  | 'kontrolne_vysetrenie'
  | 'cenova_ponuka'
  | 'dohoda_o_cene'
  | 'operacny_protokol'
  | 'prepustacia_sprava'
  | 'anesteziologicky_dotaznik'
  | 'suhlas_operacia'
  | 'suhlas_aplikacia'
  | 'ziadanka_predoperacne'
  | 'lekarske_potvrdenie'
  | 'lekarsky_recept';

export const DOC_TITLES: Record<DocumentType, string> = {
  vstupne_vysetrenie: 'Vstupné vyšetrenie',
  kontrolne_vysetrenie: 'Kontrolné vyšetrenie',
  cenova_ponuka: 'Cenová ponuka',
  dohoda_o_cene: 'Dohoda o cene a podmienkach',
  operacny_protokol: 'Operačný protokol',
  prepustacia_sprava: 'Prepúšťacia správa',
  anesteziologicky_dotaznik: 'Anesteziologický dotazník a súhlas',
  suhlas_operacia: 'Informovaný súhlas s operáciou',
  suhlas_aplikacia: 'Informovaný súhlas s aplikáciou výplní & botoxu',
  ziadanka_predoperacne: 'Žiadanka na predoperačné vyšetrenia',
  lekarske_potvrdenie: 'Lekárske potvrdenie / Posudok o spôsobilosti',
  lekarsky_recept: '💊 Lekársky recept (A6) / Predpis liekov'
};

interface FormProps {
  onRecordCreated?: (sale: { date: string; patientName: string; doctorName: string; serviceType: string; amount: number; }) => void;
  initialPatient?: { 
    name: string; 
    birthNumber: string; 
    phone?: string; 
    email?: string; 
    address?: string; 
    lastSurgery?: string; 
    lastSurgeryDate?: string;
    initialDocType?: DocumentType;
    insurance?: string;
  } | null;
}

export default function MedicalRecordForm({ onRecordCreated, initialPatient }: FormProps) {
  const [docType, setDocType] = useState<DocumentType>(initialPatient?.initialDocType || 'vstupne_vysetrenie');
  
  // ZÁKLADNÉ ÚDAJE
  const [patientName, setPatientName] = useState(initialPatient?.name || '');
  const [patientMaidenName, setPatientMaidenName] = useState('');
  const [birthNumber, setBirthNumber] = useState(initialPatient?.birthNumber || '');
  const [patientPhone, setPatientPhone] = useState(initialPatient?.phone || '');
  const [patientEmail, setPatientEmail] = useState(initialPatient?.email || '');
  const [patientAddress, setPatientAddress] = useState(initialPatient?.address || '');
  const [patientInsurance, setPatientInsurance] = useState('Dôvera');
  const [patientRelative, setPatientRelative] = useState('');

  // ZÁKONNÝ ZÁSTUPCA / OPATROVNÍK (ak je maloletý alebo obmedzená spôsobilosť)
  const [legalRep, setLegalRep] = useState({
    name: '',
    birthDate: '',
    address: '',
    title: 'Rodič / Zákonný zástupca'
  });

  const [doctor, setDoctor] = useState('MUDr. Ján Mráz');
  const [doctorCode, setDoctorCode] = useState('A86342871');
  const [diagnosis, setDiagnosis] = useState('Z41.1 - Estetická chirurgická úprava');
  const [manualProcedure, setManualProcedure] = useState('');
  const [notes, setNotes] = useState('');

  // DATABÁZY & API
  const [mkchDatabase, setMkchDatabase] = useState<MKCHItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HealthProResponse | null>(null);

  // PDF Export stav
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Synchronizácia údajov pri zmene initialPatient
  useEffect(() => {
    if (initialPatient) {
      if (initialPatient.name) setPatientName(initialPatient.name);
      if (initialPatient.birthNumber) setBirthNumber(initialPatient.birthNumber);
      if (initialPatient.phone) setPatientPhone(initialPatient.phone);
      if (initialPatient.email) setPatientEmail(initialPatient.email);
      if (initialPatient.address) setPatientAddress(initialPatient.address);
      if (initialPatient.insurance) setPatientInsurance(initialPatient.insurance);
      if (initialPatient.initialDocType) setDocType(initialPatient.initialDocType);
    }
  }, [initialPatient]);

  // SPRÁVA ŠABLÓN INFORMOVANÉHO SÚHLASU
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
  const [templateSaveFeedback, setTemplateSaveFeedback] = useState<string | null>(null);

  // ZDIEĽANÝ STAV PRE ANESTÉZIU A HOSPITALIZÁCIU (130€ / hod, 100€ dospanie v ten istý deň, 200€ do ďalšieho dňa)
  const [anesthesiaType, setAnesthesiaType] = useState<'Lokálna' | 'Celková' | 'Analgosedácia'>('Celková');
  const [anesthesiaHours, setAnesthesiaHours] = useState(1);
  const [hospitalizationType, setHospitalizationType] = useState<'none' | 'half' | 'full'>('none');

  // PLATBY
  const [depositPaid, setDepositPaid] = useState<number>(0);

  // DOHODA O CENE - ROZŠÍRENÉ ŠPECIFICKÉ ÚDAJE
  const [patientCitizenship, setPatientCitizenship] = useState('Slovenská republika');
  const [patientBirthDate, setPatientBirthDate] = useState('');
  const [bankName, setBankName] = useState('Tatra banka, a.s.');
  const [bankIban, setBankIban] = useState('SK12 1100 0000 0029 4812 3456');
  const [agreementSurgeryDate, setAgreementSurgeryDate] = useState(new Date().toISOString().split('T')[0]);
  const [agreementSurgeryTime, setAgreementSurgeryTime] = useState('08:30');
  const [depositDueDays, setDepositDueDays] = useState(3);
  const [customVariableSymbol, setCustomVariableSymbol] = useState('');
  const [agreementDate, setAgreementDate] = useState(new Date().toISOString().split('T')[0]);

  // OPERAČNÉ ÚDAJE
  const [surgeryDetails, setSurgeryDetails] = useState({
    opDate: new Date().toISOString().split('T')[0],
    opStart: '09:00', 
    opEnd: '10:30',
    anesStart: '08:45', 
    anesEnd: '10:45',
    operator: 'MUDr. Ján Mráz',
    assistant: 'Bez asistencie', 
    anesthesiologist: 'MUDr. Peter Kováč', 
    anestNurse: 'Ema Foltáni', 
    instrumentalist: 'Sabina Lenhartová', 
    checkup: '1 týždeň'
  });

  // OPERAČNÉ IMPLANTÁTY A ŠPECIÁLNY MATERIÁL
  const [surgeryImplants, setSurgeryImplants] = useState<SurgeryImplantItem[]>([
    { id: '1', vyrobca: 'Motiva', model: 'Ergonomix Full', kat: 'MOT-350-F', objem: '350 cc', strana: 'Obojstranne (Bilat.)', lot: 'LOT-2026-08', sn: 'SN-998412' }
  ]);
  const [surgeryMaterials, setSurgeryMaterials] = useState(
    'Šijací materiál: PDS 4-0 (vnútorná sutúra), Monocryl 4-0 (podkožie), Glycolon 4-0 (intrakutánny steh), Steri-stripp\nHemostatiká & Roztok: Tumescenčný roztok (adrenalín 1:200 000 + levobupivacain), Surgicel\nDrenáž: 2x Redonov podtlakový drén CH10\nKrytie: Sterilné krytie, kompresívna pooperačná bielizeň'
  );

  // AUTOMATICKÉ ODPORÚČANIA PO OPERÁCII PRE OŠETRUJÚCI PERSONÁL
  const [postopStaffCare, setPostopStaffCare] = useState(getStaffRecommendationsForProcedure('Augmentácia'));

  // LIEKY PRE PREPÚŠŤACIU SPRÁVU
  const [rxAntibiotics, setRxAntibiotics] = useState('');
  const [rxAnalgesics, setRxAnalgesics] = useState('');
  const [rxCorticoids, setRxCorticoids] = useState('');
  const [rxAnticoagulants, setRxAnticoagulants] = useState('');

  // ANESTEZIOLOGICKÝ DOTAZNÍK
  const [anesthesiaAnswers, setAnesthesiaAnswers] = useState({
    diseases: 'Nie', pregnant: 'Nie', medications: 'Nie', allergies: 'Nie', complications: 'Nie'
  });

  // VSTUPNÉ VYŠETRENIE
  const [vvPlan, setVvPlan] = useState('');
  const [vvDate, setVvDate] = useState('');
  
  // Anamnéza
  const [vvVek, setVvVek] = useState('');
  const [vvVyska, setVvVyska] = useState('');
  const [vvVaha, setVvVaha] = useState('');
  const [vvAA, setVvAA] = useState('');
  const [vvOA, setVvOA] = useState('');
  const [vvLA, setVvLA] = useState('');
  const [vvGA, setVvGA] = useState('');
  
  // Klinika (Status Localis / SPL)
  const [vvCave, setVvCave] = useState('');
  const [vvSPL, setVvSPL] = useState('');
  
  // Vyšetrenia
  const [vvExams, setVvExams] = useState<string[]>([]);
  const [vvExamsOther, setVvExamsOther] = useState('');
  
  // Implantáty a Materiál
  const [vvImplants, setVvImplants] = useState([{ vyrobca: '', kat: '', objem: '' }]);
  const [vvMaterial, setVvMaterial] = useState('');

  // Súhlasy / Kontraindikácie
  const [vvNoContra, setVvNoContra] = useState(true);
  const [vvContraReason, setVvContraReason] = useState('');

  // --- SPRÁVA ŠABLÓN (CUSTOMIZABLE TEMPLATES STATE) ---
  const [checkupMacros, setCheckupMacros] = useState(DEFAULT_CHECKUP_MACROS);
  const [opMacros, setOpMacros] = useState(DEFAULT_OP_MACROS);
  const [clinicMacros, setClinicMacros] = useState(DEFAULT_CLINIC_MACROS);
  const [isTemplateEditorOpen, setIsTemplateEditorOpen] = useState(false);
  const [templateEditorCategory, setTemplateEditorCategory] = useState<'checkup' | 'op' | 'clinic'>('checkup');
  const [editingTemplateKey, setEditingTemplateKey] = useState<string>('checkup_1w');

  // Načítanie upravených šablón z localStorage
  useEffect(() => {
    try {
      const savedCheckup = localStorage.getItem('say_clinic_custom_checkup_macros');
      if (savedCheckup) setCheckupMacros(JSON.parse(savedCheckup));

      const savedOp = localStorage.getItem('say_clinic_custom_op_macros');
      if (savedOp) setOpMacros(JSON.parse(savedOp));

      const savedClinic = localStorage.getItem('say_clinic_custom_clinic_macros');
      if (savedClinic) setClinicMacros(JSON.parse(savedClinic));
    } catch (e) {
      console.error('Chyba načítania vlastných šablón:', e);
    }
  }, []);

  // --- KONTROLNÉ VYŠETRENIE (S AUTOMATICKOU VÄZBOU NA OPERÁCIU A DÁTUM) ---
  const [selectedCheckupKey, setSelectedCheckupKey] = useState<string>('checkup_1w');
  const [checkupData, setCheckupData] = useState({
    operationName: initialPatient?.lastSurgery || 'Augmentácia prsníkov silikónovými implantátmi',
    operationDate: initialPatient?.lastSurgeryDate || new Date().toISOString().split('T')[0],
    timeframe: DEFAULT_CHECKUP_MACROS.checkup_1w.timeframe,
    subjective: DEFAULT_CHECKUP_MACROS.checkup_1w.subjective,
    objective: DEFAULT_CHECKUP_MACROS.checkup_1w.objective,
    recommendations: DEFAULT_CHECKUP_MACROS.checkup_1w.recommendations.join('\n• '),
    nextCheckup: DEFAULT_CHECKUP_MACROS.checkup_1w.nextCheckup
  });

  // Pomocná funkcia na výpočet odstupu od operácie
  const calculateElapsedString = (opDateStr: string) => {
    if (!opDateStr) return '';
    try {
      const opDate = new Date(opDateStr);
      const today = new Date();
      const diffTime = today.getTime() - opDate.getTime();
      const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
      
      if (diffDays === 0) return 'Dnes vykonaná operácia';
      if (diffDays < 7) return `${diffDays} dní po operácii`;
      const weeks = Math.floor(diffDays / 7);
      if (diffDays < 30) return `${diffDays} dní (${weeks}. týždeň po operácii)`;
      const months = Math.floor(diffDays / 30.4);
      return `${diffDays} dní (cca ${months} ${months === 1 ? 'mesiac' : months < 5 ? 'mesiace' : 'mesiacov'} po operácii)`;
    } catch {
      return '';
    }
  };

  // Automatické hľadanie operácie v pamäti kliniky pre pacienta
  useEffect(() => {
    if (birthNumber) {
      const cleanRC = birthNumber.trim();
      try {
        const storedOperations = localStorage.getItem('say_clinic_patient_surgeries');
        if (storedOperations) {
          const opsMap = JSON.parse(storedOperations);
          if (opsMap[cleanRC]) {
            const lastOp = opsMap[cleanRC];
            setCheckupData(prev => ({
              ...prev,
              operationName: lastOp.name || prev.operationName,
              operationDate: lastOp.date || prev.operationDate
            }));
          }
        }
      } catch (e) {
        console.error('Chyba pri hľadaní operácie pacienta:', e);
      }
    }
  }, [birthNumber]);

  const handleSelectCheckupPreset = (key: string) => {
    setSelectedCheckupKey(key);
    const macro = (checkupMacros as any)[key] || DEFAULT_CHECKUP_MACROS[key];
    if (macro) {
      setCheckupData(prev => ({
        ...prev,
        timeframe: macro.timeframe,
        subjective: macro.subjective,
        objective: macro.objective,
        recommendations: Array.isArray(macro.recommendations) ? macro.recommendations.join('\n• ') : macro.recommendations,
        nextCheckup: macro.nextCheckup
      }));
    }
  };

  // --- OSTATNÉ ŠABLÓNY ---

  // 1. INFORMOVANÝ SÚHLAS S OPERÁCIOU PODĽA § 6 ZÁKONA Č. 576/2004 Z. Z.
  const initialProfile = findSurgeryConsentProfile(
    manualProcedure || vvPlan || initialPatient?.lastSurgery || 'Zväčšenie prsníkov silikónovými implantátmi (augmentácia)',
    anesthesiaType
  );

  const [surgeryConsent, setSurgeryConsent] = useState({
    procedureName: initialProfile.procedureName,
    anatomicalArea: initialProfile.anatomicalArea,
    purposeAndNature: initialProfile.purposeAndNature,
    technique: initialProfile.technique,
    anesthesiaType: initialProfile.anesthesiaType,
    alternatives: initialProfile.alternatives,
    refusalConsequences: initialProfile.refusalConsequences,
    specificRisks: initialProfile.specificRisks,
    // VI. Individuálne rizikové faktory a anamnestické údaje
    allergies: 'Negatívne (bez známych alergií na lieky, dezinfekciu, náplasti, latex)',
    chronicDiseases: 'Negatívne (bez evidovaných chronických ochorení)',
    bleedingDisorders: 'Negatívne (bez porúch zrážanlivosti, neužíva antikoagulanciá)',
    chronicMedication: 'Negatívne (neužíva trvalú medikáciu)',
    keloidTendency: 'Nie',
    smokingAlcohol: 'Nefajčiar / Príležitostne',
    previousSurgeries: 'Bez predchádzajúcich operácií v operovanej anatomickej oblasti',
    otherAnamnesis: 'Negatívne (tehotenstvo a dojčenie vylúčené)',
    // VIII. Pooperačný režim a pokyny
    recoveryWeeks: '4 – 6',
    postopRest: initialProfile.postopCare.restAndPositioning,
    postopGarment: initialProfile.postopCare.compressionGarment,
    postopPhysical: initialProfile.postopCare.physicalRestrictions,
    postopWound: initialProfile.postopCare.woundCare,
    postopEnvironment: initialProfile.postopCare.environmentalRestrictions,
    postopMedication: initialProfile.postopCare.medication,
    postopCheckup: initialProfile.postopCare.checkupSchedule,
    // IX. Doplňujúce otázky pacienta a odpovede lekára
    patientQuestion1: 'Bez ďalších doplňujúcich otázok',
    doctorAnswer1: 'Všetky otázky k priebehu operácie a pooperačnému zotaveniu boli podrobne a vyčerpávajúco zodpovedané.',
    patientQuestion2: '',
    doctorAnswer2: '',
    specialAgreements: 'Všetky náležitosti a voľba operačného postupu boli dohodnuté v súlade s predoperačnou konzultáciou.',
    // XI. & XII. Čas, miesto a odovzdanie
    instructionDateTime: `${new Date().toLocaleDateString('sk-SK')} o 08:30 hod.`,
    consentDateTime: `${new Date().toLocaleDateString('sk-SK')} o 09:00 hod.`,
    consentTime: '09:30',
    signaturePlace: 'Banská Bystrica',
    copyReceived: true
  });

  const updateConsentFromProcedure = (procedureText: string, customAnesthesia?: string) => {
    if (!procedureText || !procedureText.trim()) return;
    const profile = findSurgeryConsentProfile(procedureText, customAnesthesia || anesthesiaType);
    setSurgeryConsent(prev => ({
      ...prev,
      procedureName: profile.procedureName,
      anatomicalArea: profile.anatomicalArea,
      purposeAndNature: profile.purposeAndNature,
      technique: profile.technique,
      anesthesiaType: profile.anesthesiaType,
      alternatives: profile.alternatives,
      refusalConsequences: profile.refusalConsequences,
      specificRisks: profile.specificRisks,
      postopRest: profile.postopCare.restAndPositioning,
      postopGarment: profile.postopCare.compressionGarment,
      postopPhysical: profile.postopCare.physicalRestrictions,
      postopWound: profile.postopCare.woundCare,
      postopEnvironment: profile.postopCare.environmentalRestrictions,
      postopMedication: profile.postopCare.medication,
      postopCheckup: profile.postopCare.checkupSchedule
    }));
  };

  const handleApplyProfileFromManager = (profile: SurgeryConsentProfile) => {
    setManualProcedure(profile.procedureName);
    setSurgeryConsent(prev => ({
      ...prev,
      procedureName: profile.procedureName,
      anatomicalArea: profile.anatomicalArea,
      purposeAndNature: profile.purposeAndNature,
      technique: profile.technique,
      anesthesiaType: profile.anesthesiaType,
      alternatives: profile.alternatives,
      refusalConsequences: profile.refusalConsequences,
      specificRisks: profile.specificRisks,
      postopRest: profile.postopCare.restAndPositioning,
      postopGarment: profile.postopCare.compressionGarment,
      postopPhysical: profile.postopCare.physicalRestrictions,
      postopWound: profile.postopCare.woundCare,
      postopEnvironment: profile.postopCare.environmentalRestrictions,
      postopMedication: profile.postopCare.medication,
      postopCheckup: profile.postopCare.checkupSchedule
    }));
  };

  const handleSaveCurrentAsDefaultTemplate = () => {
    if (!surgeryConsent.procedureName.trim()) {
      setTemplateSaveFeedback('Chyba: Zákrok nemá zadaný názov.');
      setTimeout(() => setTemplateSaveFeedback(null), 3000);
      return;
    }

    const matchedExisting = findSurgeryConsentProfile(surgeryConsent.procedureName);
    const profileId = matchedExisting.id !== 'custom_procedure' 
      ? matchedExisting.id 
      : `custom_op_${Date.now()}`;

    const updatedProfile: SurgeryConsentProfile = {
      id: profileId,
      keywords: matchedExisting.keywords && matchedExisting.keywords.length > 0 
        ? matchedExisting.keywords 
        : [surgeryConsent.procedureName.toLowerCase()],
      procedureName: surgeryConsent.procedureName,
      anatomicalArea: surgeryConsent.anatomicalArea,
      purposeAndNature: surgeryConsent.purposeAndNature,
      technique: surgeryConsent.technique,
      anesthesiaType: surgeryConsent.anesthesiaType,
      alternatives: surgeryConsent.alternatives,
      refusalConsequences: surgeryConsent.refusalConsequences,
      specificRisks: surgeryConsent.specificRisks,
      postopCare: {
        restAndPositioning: surgeryConsent.postopRest,
        compressionGarment: surgeryConsent.postopGarment,
        physicalRestrictions: surgeryConsent.postopPhysical,
        woundCare: surgeryConsent.postopWound,
        environmentalRestrictions: surgeryConsent.postopEnvironment,
        medication: surgeryConsent.postopMedication,
        checkupSchedule: surgeryConsent.postopCheckup
      }
    };

    saveSurgeryConsentProfile(updatedProfile);
    setTemplateSaveFeedback(`Šablóna pre „${surgeryConsent.procedureName}“ bola úspešne uložená ako predvolená!`);
    setTimeout(() => setTemplateSaveFeedback(null), 4000);
  };

  // 2. INFORMOVANÝ SÚHLAS S APLIKÁCIOU VÝPLNÍ / BOTOXU
  const [aestheticConsent, setAestheticConsent] = useState({
    treatmentType: 'Aplikácia kyseliny hyalurónovej',
    productName: 'Juvéderm Voluma / Ultra',
    applicationSites: 'Pery, nazolabiálne ryhy, lícne kosti',
    volumeOrUnits: '1.0 ml',
    batchNumber: 'LOT-2026-9812',
    contraindicationsNegated: true,
    aftercareInstructed: true,
    customSideEffects: 'Erytém, prechodný edém, modriny (hematómy), asymetria, hrčky/granulómy, ojedinele vaskulárna oklúzia.'
  });

  // 3. ŽIADANKA NA PREDOPERAČNÉ VYŠETRENIA
  const [preopRequest, setPreopRequest] = useState({
    targetSurgery: 'Plánovaný plasticko-chirurgický výkon v celkovej anestézii',
    surgeryDate: new Date().toISOString().split('T')[0],
    gpDoctorName: 'Všeobecný lekár pre dospelých / Internista',
    requiredTests: [
      'Krvný obraz + diferenciálny rozpočet + trombocyty',
      'Koagulačné vyšetrenie (Quick / INR, APTT, Fibrinogén)',
      'Biochémia (Glykémia, Urea, Kreatinín, Kyselina močová, AST, ALT, GMT, Bilirubín celkový)',
      'Ióny (Na, K, Cl)',
      'Sedimentácia erytrocytov (FW) / CRP',
      'Moč chemicky + močový sediment',
      'Krvná skupina a Rh faktor',
      '12-zvodové EKG s písomným popisom a interpretáciou internistu',
      'Interné predoperačné vyšetrenie so záverom: Schopný/á výkonu v celkovej anestézii'
    ],
    specialNote: 'Kompletné výsledky nesmú byť staršie ako 14 dní pred termínom zákroku.'
  });

  // 4. LEKÁRSKE POTVRDENIE / POSUDOK
  const [medicalCertificate, setMedicalCertificate] = useState({
    purpose: 'Potvrdenie o zdravotnom stave a odporúčanom kľudovom režime',
    statement: 'Pacient/ka bola vyšetrená na našej klinike. Je po zdravotnej stránke schopná podstúpiť plánovaný zákrok. Odporúčame pooperačný kľudový režim a dočasné vyradenie z fyzickej záťaže po dobu 14 dní.',
    validUntil: '14 dní od vystavenia',
    issuedFor: 'Pre potreby zamestnávateľa / inštitúcie'
  });

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/mkch.json')
      .then((res) => res.json())
      .then((data: MKCHItem[]) => setMkchDatabase(data))
      .catch((err) => console.error('Chyba pri načítaní diagnóz:', err));
  }, []);

  useEffect(() => {
    if (initialPatient) {
      setPatientName(initialPatient.name);
      setBirthNumber(initialPatient.birthNumber);
      if(initialPatient.phone) setPatientPhone(initialPatient.phone);
      if(initialPatient.email) setPatientEmail(initialPatient.email);
      if(initialPatient.address) setPatientAddress(initialPatient.address);
      if(initialPatient.lastSurgery) {
        setCheckupData(prev => ({
          ...prev,
          operationName: initialPatient.lastSurgery || prev.operationName,
          operationDate: initialPatient.lastSurgeryDate || prev.operationDate
        }));
      }
    }
  }, [initialPatient]);

  useEffect(() => {
    const computedAge = calculateAgeFromRC(birthNumber);
    if (computedAge) {
      setVvVek(computedAge);
    }
    const computedBirthDate = calculateBirthDateFromRC(birthNumber);
    if (computedBirthDate && !patientBirthDate) {
      setPatientBirthDate(computedBirthDate);
    }
  }, [birthNumber, patientBirthDate]);

  // Automatická synchronizácia informovaného súhlasu podľa zvoleného výkonu a anestézie
  useEffect(() => {
    if (vvPlan && vvPlan.trim()) {
      updateConsentFromProcedure(vvPlan);
    }
  }, [vvPlan, anesthesiaType]);

  // Automatická synchronizácia anamnestických údajov do informovaného súhlasu
  useEffect(() => {
    setSurgeryConsent(prev => ({
      ...prev,
      allergies: vvAA ? vvAA : (anesthesiaAnswers.allergies !== 'Nie' ? 'Pozitívne alergie' : prev.allergies),
      chronicDiseases: vvOA ? vvOA : (anesthesiaAnswers.diseases !== 'Nie' ? 'Pozitívne chronické ochorenia' : prev.chronicDiseases),
      bleedingDisorders: rxAnticoagulants ? `Užívanie: ${rxAnticoagulants}` : prev.bleedingDisorders,
      chronicMedication: vvLA ? vvLA : (anesthesiaAnswers.medications !== 'Nie' ? 'Užíva lieky' : prev.chronicMedication),
      smokingAlcohol: vvCave ? vvCave : prev.smokingAlcohol,
      otherAnamnesis: vvGA ? vvGA : (anesthesiaAnswers.pregnant !== 'Nie' ? `Tehotenstvo: ${anesthesiaAnswers.pregnant}` : prev.otherAnamnesis)
    }));
  }, [vvAA, vvOA, vvLA, vvCave, vvGA, rxAnticoagulants, anesthesiaAnswers]);

  const calcBMI = () => {
    const w = parseFloat(vvVaha);
    const h = parseFloat(vvVyska);
    if (w > 0 && h > 0) {
      const hMeters = h / 100;
      return (w / (hMeters * hMeters)).toFixed(1);
    }
    return '';
  };

  const handleExamToggle = (exam: string) => {
    setVvExams(prev => prev.includes(exam) ? prev.filter(e => e !== exam) : [...prev, exam]);
  };

  const handlePreopTestToggle = (test: string) => {
    setPreopRequest(prev => ({
      ...prev,
      requiredTests: prev.requiredTests.includes(test)
        ? prev.requiredTests.filter(t => t !== test)
        : [...prev.requiredTests, test]
    }));
  };

  const addImplant = () => setVvImplants([...vvImplants, { vyrobca: '', kat: '', objem: '' }]);
  const removeImplant = (index: number) => setVvImplants(vvImplants.filter((_, i) => i !== index));
  const updateImplant = (index: number, field: 'vyrobca' | 'kat' | 'objem', value: string) => {
    const newImplants = [...vvImplants];
    newImplants[index][field] = value;
    setVvImplants(newImplants);
  };

  const handleAddItemFromDropdown = (itemId: string, isOperation = false) => {
    if (!itemId) return;
    const allServices = [
      ...SERVICES_DATABASE.operations,
      ...SERVICES_DATABASE.operationExtras,
      ...SERVICES_DATABASE.correctiveProcedures,
      ...SERVICES_DATABASE.services,
      ...SERVICES_DATABASE.aftercareAndGarments
    ];
    const found = allServices.find((s) => s.id === itemId);
    if (found && !selectedItems.some((i) => i.id === found.id)) {
      setSelectedItems([...selectedItems, found]);
      if (isOperation) {
        setManualProcedure(found.name);
        setCheckupData(prev => ({ ...prev, operationName: found.name }));
        updateConsentFromProcedure(found.name);
        setPreopRequest(prev => ({ ...prev, targetSurgery: found.name }));
      }
    }
  };

  const handleRemoveItem = (id: string) => {
    setSelectedItems(selectedItems.filter((i) => i.id !== id));
  };

  // VÝPOČET CIEN
  const basePrice = selectedItems.reduce((acc, curr) => acc + curr.price, 0);
  // Anestézia: ak je Celková alebo Analgosedácia -> účtujeme 130 € za každú začatú hodinu
  const isPaidAnesthesia = anesthesiaType === 'Celková' || anesthesiaType === 'Analgosedácia';
  const anesthesiaPrice = isPaidAnesthesia ? Math.max(1, Math.ceil(anesthesiaHours)) * 130 : 0;
  // Hospitalizácia: dospanie v ten istý deň (1/2 dňa) = 100 €, hospitalizácia do ďalšieho dňa (1 deň) = 200 €
  const hospitalizationPrice = hospitalizationType === 'half' ? 100 : hospitalizationType === 'full' ? 200 : 0;
  const totalPrice = basePrice + anesthesiaPrice + hospitalizationPrice;
  const remainingPrice = totalPrice - depositPaid;

  const handlePrint = () => window.print();

  // EXPORT DO PDF S AUTOMATICKÝM NÁZVOM A DÁTUMOM
  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    setGeneratingPdf(true);
    try {
      const todayIso = new Date().toISOString().split('T')[0];
      const filename = generatePdfFilename(DOC_TITLES[docType], patientName, todayIso);
      await exportElementToPdf(printRef.current, filename);
    } catch (err) {
      console.error('Chyba pri generovaní PDF:', err);
      alert('Nastala chyba pri generovaní PDF dokumentu.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleMacroInsert = (val: string, target: 'vv' | 'notes') => {
    if (!val) return;
    if (target === 'vv' && (clinicMacros[val] || DEFAULT_CLINIC_MACROS[val])) {
      const macroText = clinicMacros[val] || DEFAULT_CLINIC_MACROS[val];
      setVvSPL(prev => prev ? prev + "\n\n" + macroText : macroText);
    } else if (target === 'notes') {
      const selectedMacro = clinicMacros[val] || DEFAULT_CLINIC_MACROS[val] || opMacros[val] || DEFAULT_OP_MACROS[val];
      if(selectedMacro) {
        setNotes(prev => prev ? prev + "\n\n" + selectedMacro : selectedMacro);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const serviceTitle = (docType === 'cenova_ponuka' || docType === 'dohoda_o_cene')
      ? selectedItems.map((i) => i.name).join(', ') || DOC_TITLES[docType]
      : docType === 'kontrolne_vysetrenie'
      ? `Kontrola po: ${checkupData.operationName}`
      : manualProcedure || DOC_TITLES[docType];

    const recordNote = docType === 'vstupne_vysetrenie' 
      ? vvPlan 
      : docType === 'kontrolne_vysetrenie' 
      ? `Operácia: ${checkupData.operationName} (${checkupData.operationDate})\nSubjektívne: ${checkupData.subjective}\nObjektívne: ${checkupData.objective}\nOdporúčania:\n${checkupData.recommendations}` 
      : notes;

    // Uloženie operácie pre budúce kontroly tohto pacienta
    if (docType === 'operacny_protokol' && birthNumber) {
      try {
        const storedOps = localStorage.getItem('say_clinic_patient_surgeries');
        const opsMap = storedOps ? JSON.parse(storedOps) : {};
        opsMap[birthNumber.trim()] = {
          name: manualProcedure || selectedItems[0]?.name || 'Chirurgický zákrok',
          date: surgeryDetails.opDate || new Date().toISOString().split('T')[0]
        };
        localStorage.setItem('say_clinic_patient_surgeries', JSON.stringify(opsMap));
      } catch (err) {
        console.error('Chyba ukladania operácie:', err);
      }
    }

    const response = await HealthProService.sendMedicalRecord({
      patientBirthNumber: birthNumber,
      diagnosisCode: diagnosis,
      notes: recordNote,
      doctorLicenseCode: 'LEK-123456',
    });

    setResult(response);
    setLoading(false);

    if (response.success && onRecordCreated) {
      onRecordCreated({
        date: new Date().toISOString().split('T')[0],
        patientName: patientName || 'Neznámy pacient',
        doctorName: doctor,
        serviceType: `${DOC_TITLES[docType]}: ${serviceTitle}`,
        amount: (docType === 'cenova_ponuka' || docType === 'dohoda_o_cene') ? totalPrice : 0,
      });
    }
  };

  // Uloženie upravených šablón v modal okne
  const handleSaveCustomTemplate = (updatedData: any) => {
    if (templateEditorCategory === 'checkup') {
      const updated = { ...checkupMacros, [editingTemplateKey]: updatedData };
      setCheckupMacros(updated);
      localStorage.setItem('say_clinic_custom_checkup_macros', JSON.stringify(updated));
    }
    alert('Šablóna bola úspešne uložená a bude použitá pri každom generovaní!');
    setIsTemplateEditorOpen(false);
  };

  const handleResetTemplates = () => {
    if (confirm('Naozaj si želáte obnoviť všetky šablóny na pôvodné výrobné nastavenia?')) {
      setCheckupMacros(DEFAULT_CHECKUP_MACROS);
      setOpMacros(DEFAULT_OP_MACROS);
      setClinicMacros(DEFAULT_CLINIC_MACROS);
      localStorage.removeItem('say_clinic_custom_checkup_macros');
      localStorage.removeItem('say_clinic_custom_op_macros');
      localStorage.removeItem('say_clinic_custom_clinic_macros');
      alert('Všetky šablóny boli obnovené na predvolené.');
      setIsTemplateEditorOpen(false);
    }
  };

  const showPricing = docType === 'cenova_ponuka' || docType === 'dohoda_o_cene';
  const showSurgeryDetails = docType === 'operacny_protokol' || docType === 'prepustacia_sprava';
  const showAnesthesiaQ = docType === 'anesteziologicky_dotaznik';
  const showVV = docType === 'vstupne_vysetrenie';
  const showCheckup = docType === 'kontrolne_vysetrenie';
  const showNotes = docType === 'operacny_protokol' || docType === 'prepustacia_sprava';
  const showSurgeryConsent = docType === 'suhlas_operacia';
  const showAestheticConsent = docType === 'suhlas_aplikacia';
  const showPreopRequest = docType === 'ziadanka_predoperacne';
  const showCertificate = docType === 'lekarske_potvrdenie';

  return (
    <>
      <style type="text/css" media="print">
        {`
          body * { visibility: hidden; }
          #printable-a4, #printable-a4 * { visibility: visible; }
          #printable-a4 {
            position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; box-shadow: none; border: none;
          }
        `}
      </style>

      {/* ======================================================= */}
      {/* MODAL PRE SPRÁVU A ÚPRAVU ŠABLÓN                        */}
      {/* ======================================================= */}
      {isTemplateEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E8E2D9] max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-3">
              <div>
                <h3 className="font-brand text-lg font-bold uppercase text-[#2C2A29]">Správa & Úprava Šablón</h3>
                <p className="text-[10px] text-[#8C857B] uppercase tracking-wider">Prispôsobte si texty, odporúčania a makrá podľa Vašich preferencií</p>
              </div>
              <button onClick={() => setIsTemplateEditorOpen(false)} className="text-gray-400 hover:text-gray-700 text-lg font-bold cursor-pointer">✕</button>
            </div>

            {/* Prepínanie kategórie */}
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => { setTemplateEditorCategory('checkup'); setEditingTemplateKey('checkup_1w'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${templateEditorCategory === 'checkup' ? 'bg-[#2C2A29] text-white' : 'bg-[#FBF9F6] text-[#8C857B] hover:text-[#2C2A29]'}`}
              >
                🩺 Kontrolné vyšetrenia
              </button>
              <button 
                onClick={() => {
                  setIsTemplateEditorOpen(false);
                  setIsTemplateManagerOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer bg-[#C5A059]/15 text-[#C5A059] hover:bg-[#C5A059]/25 flex items-center gap-1.5 border border-[#C5A059]/30"
              >
                <Sliders className="w-3.5 h-3.5" />
                📋 Informovaný súhlas s operáciou (Katalóg výkonov)
              </button>
            </div>

            {/* Editácia vybranej šablóny kontroly */}
            {templateEditorCategory === 'checkup' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-[#8C857B]">Vyberte interval:</label>
                  <select 
                    value={editingTemplateKey} 
                    onChange={e => setEditingTemplateKey(e.target.value)}
                    className="border border-[#E8E2D9] p-1.5 rounded-lg text-xs font-bold bg-[#FBF9F6]"
                  >
                    {Object.entries(checkupMacros).map(([k, v]: any) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Názov časového obdobia</label>
                  <input 
                    type="text" 
                    value={(checkupMacros as any)[editingTemplateKey]?.timeframe || ''} 
                    onChange={e => {
                      const updated = { ...checkupMacros, [editingTemplateKey]: { ...(checkupMacros as any)[editingTemplateKey], timeframe: e.target.value } };
                      setCheckupMacros(updated);
                    }}
                    className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Predvolený subjektívny stav</label>
                  <textarea 
                    rows={3} 
                    value={(checkupMacros as any)[editingTemplateKey]?.subjective || ''} 
                    onChange={e => {
                      const updated = { ...checkupMacros, [editingTemplateKey]: { ...(checkupMacros as any)[editingTemplateKey], subjective: e.target.value } };
                      setCheckupMacros(updated);
                    }}
                    className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Predvolený objektívny nález (Hojenie p.p.i., jazvy)</label>
                  <textarea 
                    rows={3} 
                    value={(checkupMacros as any)[editingTemplateKey]?.objective || ''} 
                    onChange={e => {
                      const updated = { ...checkupMacros, [editingTemplateKey]: { ...(checkupMacros as any)[editingTemplateKey], objective: e.target.value } };
                      setCheckupMacros(updated);
                    }}
                    className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#C5A059] mb-1">Predvolené odporúčania (Každý riadok = 1 bod)</label>
                  <textarea 
                    rows={5} 
                    value={Array.isArray((checkupMacros as any)[editingTemplateKey]?.recommendations) ? (checkupMacros as any)[editingTemplateKey].recommendations.join('\n') : (checkupMacros as any)[editingTemplateKey]?.recommendations || ''} 
                    onChange={e => {
                      const lines = e.target.value.split('\n').filter(l => l.trim() !== '');
                      const updated = { ...checkupMacros, [editingTemplateKey]: { ...(checkupMacros as any)[editingTemplateKey], recommendations: lines } };
                      setCheckupMacros(updated);
                    }}
                    className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Predvolená ďalšia kontrola</label>
                  <input 
                    type="text" 
                    value={(checkupMacros as any)[editingTemplateKey]?.nextCheckup || ''} 
                    onChange={e => {
                      const updated = { ...checkupMacros, [editingTemplateKey]: { ...(checkupMacros as any)[editingTemplateKey], nextCheckup: e.target.value } };
                      setCheckupMacros(updated);
                    }}
                    className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-[#E8E2D9]">
              <button 
                type="button" 
                onClick={handleResetTemplates}
                className="text-xs text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer"
              >
                🔄 Resetovať na predvolené šablóny
              </button>
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsTemplateEditorOpen(false)}
                  className="px-4 py-2 border border-[#E8E2D9] rounded-xl text-xs font-bold text-[#8C857B] hover:text-[#2C2A29] cursor-pointer"
                >
                  Zrušiť
                </button>
                <button 
                  type="button" 
                  onClick={() => handleSaveCustomTemplate((checkupMacros as any)[editingTemplateKey])}
                  className="px-5 py-2 bg-[#C5A059] hover:bg-[#b08d48] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer"
                >
                  💾 Uložiť zmeny
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HORNÝ PREPÍNAČ DOKUMENTOV */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8E2D9] shadow-xs mb-6 print:hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <h2 className="font-brand text-lg font-bold text-[#2C2A29] uppercase">
              Generátor Zdravotníckych Dokumentov
            </h2>
            {docType === 'lekarsky_recept' && (
              <span className="bg-[#047857]/10 text-[#047857] text-[10px] uppercase font-bold px-2.5 py-1 rounded-md border border-[#047857]/20">
                A6 Lekársky Recept
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsTemplateManagerOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#C5A059]/10 hover:bg-[#C5A059]/20 border border-[#C5A059]/30 rounded-xl text-[10px] font-bold text-[#C5A059] transition-all cursor-pointer shadow-2xs"
              title="Otvoriť správcu šablón informovaných súhlasov pre všetky operácie"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Šablóny súhlasov</span>
            </button>
            <button
              type="button"
              onClick={() => setIsTemplateEditorOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#FBF9F6] hover:bg-[#F4EFEA] border border-[#E8E2D9] hover:border-[#C5A059] rounded-xl text-[10px] font-bold text-[#2C2A29] transition-all cursor-pointer shadow-2xs"
              title="Upraviť makrá kontrolných vyšetrení"
            >
              <span>Šablóny kontrol</span>
            </button>
          </div>
        </div>

        <div className="mt-3">
          <select 
            value={docType} 
            onChange={(e) => setDocType(e.target.value as DocumentType)}
            className="w-full bg-[#2C2A29] hover:bg-black text-white p-3 rounded-xl text-xs uppercase font-bold tracking-wider outline-none shadow-md cursor-pointer transition-colors"
          >
            {Object.entries(DOC_TITLES).map(([key, title]) => (
              <option key={key} value={key}>{title}</option>
            ))}
          </select>
        </div>
      </div>

      {docType === 'lekarsky_recept' ? (
        <PrescriptionModule
          initialPatient={{
            name: patientName,
            birthNumber: birthNumber,
            address: patientAddress,
            insurance: patientInsurance,
            phone: patientPhone,
            email: patientEmail
          }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:block print:gap-0">
          
          {/* ======================================================= */}
          {/* ĽAVÁ ČASŤ - FORMULÁR LEKÁRA                             */}
          {/* ======================================================= */}
          <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-5 print:hidden">
            
            <form onSubmit={handleSubmit} className="space-y-4">
            {/* ZÁKLADNÉ ÚDAJE */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1">Ošetrujúci lekár</label>
                <select value={doctor} onChange={(e) => setDoctor(e.target.value)} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]">
                  <option value="MUDr. Ján Mráz">MUDr. Ján Mráz</option>
                  <option value="MUDr. Zuzana Sroková, MPH">MUDr. Zuzana Sroková, MPH</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1">Meno a priezvisko</label>
                <input type="text" required value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="Mária Kováčová" className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1">Rodné číslo</label>
                <input type="text" required value={birthNumber} onChange={(e) => setBirthNumber(e.target.value)} placeholder="885512/6789" className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]" />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1">Diagnóza (MKCH-10)</label>
                <input type="text" list="mkch-suggestions" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Z41.1..." className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]" />
                <datalist id="mkch-suggestions">
                  {mkchDatabase.map((item) => <option key={item.code} value={item.name.includes(item.code) ? item.name : `${item.code} - ${item.name}`} />)}
                </datalist>
              </div>
            </div>

            {/* SPOLOČNÉ NASTAVENIE ANESTÉZIE A HOSPITALIZÁCIE (PRE VSTUPNÉ VYŠETRENIE, CENOVÚ PONUKU, DOHODU O CENE) */}
            {(showVV || showPricing) && (
              <div className="border border-[#C5A059]/40 rounded-xl p-4 bg-[#FBF9F6] space-y-3">
                <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-2">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-[#C5A059]">Anestézia & Hospitalizácia</p>
                  <span className="text-[9px] text-[#8C857B] font-mono">130 €/hod anestézia | 100 €/200 € pobyt</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Druh anestézie</label>
                    <select 
                      value={anesthesiaType} 
                      onChange={e => setAnesthesiaType(e.target.value as any)} 
                      className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29] font-medium"
                    >
                      <option value="Lokálna">Lokálna (0 €)</option>
                      <option value="Celková">Celková (130 € / hod)</option>
                      <option value="Analgosedácia">Analgosedácia (130 € / hod)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Čas / Dĺžka anestézie</label>
                    <select 
                      value={anesthesiaHours} 
                      disabled={anesthesiaType === 'Lokálna'}
                      onChange={e => setAnesthesiaHours(parseFloat(e.target.value))} 
                      className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29] font-medium disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      {[1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8].map(h => (
                        <option key={h} value={h}>{h} {h === 1 ? 'hodina' : h < 5 ? 'hodiny' : 'hodín'} ({Math.ceil(h) * 130} €)</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Hospitalizácia / Pobyt</label>
                    <select 
                      value={hospitalizationType} 
                      onChange={e => setHospitalizationType(e.target.value as any)} 
                      className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29] font-medium"
                    >
                      <option value="none">Ambulantne (0 €)</option>
                      <option value="half">Dospanie v ten istý deň - 1/2 dňa (100 €)</option>
                      <option value="full">Hospitalizácia do ďalšieho dňa - 1 deň (200 €)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ROZŠÍRENÉ KONTAKTY PRE DOHODU O CENE A SÚHLASY */}
            {(docType === 'dohoda_o_cene' || docType === 'suhlas_operacia' || docType === 'suhlas_aplikacia') && (
              <div className="border border-[#E8E2D9] rounded-xl p-4 bg-[#FBF9F6] space-y-3">
                <p className="text-[10px] uppercase tracking-wider font-bold text-[#C5A059]">Kontaktné a identifikačné údaje pacienta</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-[10px] text-[#8C857B] mb-1">Telefón</label><input type="text" value={patientPhone} onChange={e => setPatientPhone(e.target.value)} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white" /></div>
                  <div><label className="block text-[10px] text-[#8C857B] mb-1">Email</label><input type="text" value={patientEmail} onChange={e => setPatientEmail(e.target.value)} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white" /></div>
                </div>
                <div><label className="block text-[10px] text-[#8C857B] mb-1">Trvalý pobyt (Bydlisko)</label><input type="text" value={patientAddress} onChange={e => setPatientAddress(e.target.value)} placeholder="Muškátová 12, 974 01 Banská Bystrica" className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white" /></div>
                {docType === 'dohoda_o_cene' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-[#8C857B] mb-1">Dátum narodenia</label>
                      <input type="text" value={patientBirthDate || calculateBirthDateFromRC(birthNumber)} onChange={e => setPatientBirthDate(e.target.value)} placeholder="12. 05. 1988" className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#8C857B] mb-1">Štátne občianstvo</label>
                      <input type="text" value={patientCitizenship} onChange={e => setPatientCitizenship(e.target.value)} placeholder="Slovenská republika" className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SEKCIA: VSTUPNÉ VYŠETRENIE */}
            {showVV && (
              <div className="space-y-4">
                {/* Plán a termín */}
                <div className="border border-[#E8E2D9] rounded-xl p-4 bg-[#FBF9F6] space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] uppercase font-bold text-[#C5A059]">Plánovaný operačný výkon / Zákrok</label>
                    <select 
                      onChange={e => {
                        handleAddItemFromDropdown(e.target.value, true);
                        const item = SERVICES_DATABASE.operations.find(op => op.id === e.target.value);
                        if (item) setVvPlan(item.name);
                      }} 
                      value="" 
                      className="border border-[#E8E2D9] p-1 rounded-lg text-[10px] bg-white font-bold text-[#2C2A29]"
                    >
                      <option value="" disabled>+ Vybrať z cenníka operácií...</option>
                      {SERVICES_DATABASE.operations.map(op => (
                        <option key={op.id} value={op.id}>{op.name} ({op.price} €)</option>
                      ))}
                    </select>
                  </div>
                  <textarea rows={3} value={vvPlan} onChange={(e) => setVvPlan(e.target.value)} placeholder="Popis plánovaného výkonu..." className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]" />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase text-[#8C857B] mb-1">Termín zákroku</label>
                      <input type="date" value={vvDate} onChange={(e) => setVvDate(e.target.value)} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]" />
                    </div>
                  </div>
                </div>

                {/* Anamnéza */}
                <div className="border border-[#E8E2D9] rounded-xl p-4 bg-[#FBF9F6] space-y-3">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-[#C5A059]">Anamnéza</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div><label className="block text-[10px] text-[#8C857B] mb-1">Vek</label><input type="text" value={vvVek} onChange={e => setVvVek(e.target.value)} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white" /></div>
                    <div><label className="block text-[10px] text-[#8C857B] mb-1">Výška (cm)</label><input type="number" value={vvVyska} onChange={e => setVvVyska(e.target.value)} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white" /></div>
                    <div><label className="block text-[10px] text-[#8C857B] mb-1">Váha (kg)</label><input type="number" value={vvVaha} onChange={e => setVvVaha(e.target.value)} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white" /></div>
                    <div><label className="block text-[10px] text-[#8C857B] mb-1">BMI</label><input type="text" disabled value={calcBMI()} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-gray-100 font-bold" /></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div><label className="block text-[10px] text-[#8C857B] mb-1">AA (Alergická)</label><input type="text" value={vvAA} onChange={e => setVvAA(e.target.value)} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white" /></div>
                    <div><label className="block text-[10px] text-[#8C857B] mb-1">OA (Osobná)</label><input type="text" value={vvOA} onChange={e => setVvOA(e.target.value)} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white" /></div>
                    <div><label className="block text-[10px] text-[#8C857B] mb-1">LA (Lieková)</label><input type="text" value={vvLA} onChange={e => setVvLA(e.target.value)} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white" /></div>
                    <div><label className="block text-[10px] text-[#8C857B] mb-1">GA (Gynekologická)</label><input type="text" value={vvGA} onChange={e => setVvGA(e.target.value)} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white" /></div>
                  </div>
                  <div><label className="block text-[10px] font-bold text-rose-600 mb-1">CAVE (Riziká / Upozornenia)</label><textarea rows={2} value={vvCave} onChange={e => setVvCave(e.target.value)} className="w-full border border-rose-200 p-2 rounded-lg text-xs bg-rose-50 text-rose-800" /></div>
                </div>

                {/* Status Localis */}
                <div className="border border-[#E8E2D9] rounded-xl p-4 bg-[#FBF9F6] space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-[#C5A059]">Status Localis (SPL)</p>
                    <select value="" onChange={e => handleMacroInsert(e.target.value, 'vv')} className="border border-[#E8E2D9] p-1.5 rounded-lg text-[10px] bg-white font-bold">
                      <option value="" disabled>+ Makrá nálezu...</option>
                      <option value="viecka">Viečka</option>
                      <option value="nos">Nos</option>
                      <option value="tvar">Tvár</option>
                      <option value="prsniky">Prsníky</option>
                      <option value="brucho">Brucho</option>
                      <option value="lipo">Lipo</option>
                      <option value="labio">Labio</option>
                      <option value="ruka">Ruka</option>
                    </select>
                  </div>
                  <textarea rows={5} value={vvSPL} onChange={e => setVvSPL(e.target.value)} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white" />
                </div>
              </div>
            )}

            {/* SEKCIA: KONTROLNÉ VYŠETRENIE (S AUTOMATICKOU VÄZBOU NA OPERÁCIU A DÁTUM) */}
            {showCheckup && (
              <div className="border border-[#E8E2D9] rounded-xl p-4 bg-[#FBF9F6] space-y-4">
                
                {/* 1. Údaje o podstúpenej operácii */}
                <div className="bg-white p-3.5 rounded-xl border border-[#C5A059]/40 space-y-3 shadow-xs">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-[#C5A059]">Operácia & Dátum (Zdroj: Operačný protokol)</p>
                    <span className="text-[9px] text-[#8C857B] font-mono font-bold bg-[#FBF9F6] px-2 py-0.5 rounded border border-[#E8E2D9]">
                      {calculateElapsedString(checkupData.operationDate)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[9px] text-[#8C857B] uppercase font-bold mb-1">Názov vykonanej operácie</label>
                      <input 
                        type="text" 
                        list="operations-list"
                        value={checkupData.operationName} 
                        onChange={e => setCheckupData({...checkupData, operationName: e.target.value})} 
                        placeholder="napr. Zväčšenie prsníkov silikónovými implantátmi..."
                        className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-[#FBF9F6] font-bold text-[#2C2A29]" 
                      />
                      <datalist id="operations-list">
                        {SERVICES_DATABASE.operations.map(op => <option key={op.id} value={op.name} />)}
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-[9px] text-[#8C857B] uppercase font-bold mb-1">Dátum operácie</label>
                      <input 
                        type="date" 
                        value={checkupData.operationDate} 
                        onChange={e => setCheckupData({...checkupData, operationDate: e.target.value})} 
                        className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-[#FBF9F6] font-bold text-[#2C2A29]" 
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Výber časového intervalu */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-[#8C857B]">Interval kontroly</p>
                    <button 
                      type="button" 
                      onClick={() => setIsTemplateEditorOpen(true)}
                      className="text-[9px] text-[#C5A059] hover:underline font-bold cursor-pointer"
                    >
                      ✏️ Upraviť texty šablón
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {Object.entries(checkupMacros).map(([key, macro]: any) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleSelectCheckupPreset(key)}
                        className={`p-2 rounded-lg text-xs font-semibold border transition-all text-left cursor-pointer ${
                          selectedCheckupKey === key 
                            ? 'bg-[#2C2A29] text-white border-[#2C2A29] shadow-sm' 
                            : 'bg-white text-[#2C2A29] border-[#E8E2D9] hover:border-[#C5A059]'
                        }`}
                      >
                        {macro.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-[#8C857B] uppercase font-bold mb-1">Doba od operácie (V dokumente)</label>
                  <input 
                    type="text" 
                    value={checkupData.timeframe} 
                    onChange={e => setCheckupData({...checkupData, timeframe: e.target.value})} 
                    className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white font-bold" 
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#8C857B] uppercase font-bold mb-1">Subjektívny stav pacienta</label>
                  <textarea 
                    rows={3} 
                    value={checkupData.subjective} 
                    onChange={e => setCheckupData({...checkupData, subjective: e.target.value})} 
                    className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white" 
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#8C857B] uppercase font-bold mb-1">Objektívny nález (Hojenie rán p.p.i., jazvy, stehy)</label>
                  <textarea 
                    rows={4} 
                    value={checkupData.objective} 
                    onChange={e => setCheckupData({...checkupData, objective: e.target.value})} 
                    className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white" 
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#C5A059] uppercase font-bold mb-1">Odporúčania a pooperačná starostlivosť (Silikón, Rejuran S, laser, SPF)</label>
                  <textarea 
                    rows={6} 
                    value={checkupData.recommendations} 
                    onChange={e => setCheckupData({...checkupData, recommendations: e.target.value})} 
                    className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white font-medium" 
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#8C857B] uppercase font-bold mb-1">Plánovaný termín ďalšej kontroly</label>
                  <input 
                    type="text" 
                    value={checkupData.nextCheckup} 
                    onChange={e => setCheckupData({...checkupData, nextCheckup: e.target.value})} 
                    placeholder="napr. O 3-4 týždne / O 2 mesiace..." 
                    className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white" 
                  />
                </div>
              </div>
            )}

            {/* SEKCIA: CENOVÁ PONUKA / DOHODA O CENE - ROZDELENÝ VÝBER PODĽA 5 KATEGÓRIÍ */}
            {showPricing && (
              <div className="space-y-4">
                <div className="border border-[#E8E2D9] rounded-xl p-4 bg-[#FBF9F6] space-y-3">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-[#C5A059]">Výber položiek z cenníka (5 Kategórií)</p>
                  
                  {/* 1. Operácie */}
                  <div>
                    <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-1">1. Operácie</label>
                    <select onChange={e => handleAddItemFromDropdown(e.target.value, true)} value="" className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white">
                      <option value="" disabled>+ Pridať operáciu...</option>
                      {SERVICES_DATABASE.operations.map(op => <option key={op.id} value={op.id}>{op.name} ({op.price} €)</option>)}
                    </select>
                  </div>

                  {/* 2. Príplatky k operáciám */}
                  <div>
                    <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-1">2. Príplatky k operáciám</label>
                    <select onChange={e => handleAddItemFromDropdown(e.target.value)} value="" className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white">
                      <option value="" disabled>+ Pridať príplatok k operácii...</option>
                      {SERVICES_DATABASE.operationExtras.map(ex => <option key={ex.id} value={ex.id}>{ex.name} ({ex.price} €)</option>)}
                    </select>
                  </div>

                  {/* 3. Korektívne výkony */}
                  <div>
                    <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-1">3. Korektívne výkony</label>
                    <select onChange={e => handleAddItemFromDropdown(e.target.value)} value="" className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white">
                      <option value="" disabled>+ Pridať korektívny výkon (výplne, botox, znamienka)...</option>
                      {SERVICES_DATABASE.correctiveProcedures.map(cp => <option key={cp.id} value={cp.id}>{cp.name} ({cp.price} €)</option>)}
                    </select>
                  </div>

                  {/* 4. Služby */}
                  <div>
                    <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-1">4. Služby</label>
                    <select onChange={e => handleAddItemFromDropdown(e.target.value)} value="" className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white">
                      <option value="" disabled>+ Pridať službu (konzultácia, predoperačné, izba)...</option>
                      {SERVICES_DATABASE.services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.price} €)</option>)}
                    </select>
                  </div>

                  {/* 5. Pooperačné prádlo & Skin care */}
                  <div>
                    <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-1">5. Pooperačné prádlo & Skin care</label>
                    <select onChange={e => handleAddItemFromDropdown(e.target.value)} value="" className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white">
                      <option value="" disabled>+ Pridať pooperačné prádlo / gél (PI, VH, VD, Lipoelastic)...</option>
                      {SERVICES_DATABASE.aftercareAndGarments.map(g => <option key={g.id} value={g.id}>{g.name} ({g.price} €)</option>)}
                    </select>
                  </div>

                  {/* Zvolené položky */}
                  <div className="space-y-1 mt-3">
                    <p className="text-[10px] uppercase font-bold text-[#8C857B]">Zvolené položky ({selectedItems.length}):</p>
                    {selectedItems.map(item => (
                      <div key={item.id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-[#E8E2D9] text-xs">
                        <span>{item.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{item.price} €</span>
                          <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-rose-600 font-bold px-1 cursor-pointer">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Doplatok, záloha a zmluvné parametre */}
                  {docType === 'dohoda_o_cene' && (
                    <div className="space-y-3 pt-3 border-t border-[#E8E2D9]">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] text-[#8C857B] mb-1 font-bold">Plánovaný termín zákroku</label>
                          <input type="date" value={agreementSurgeryDate} onChange={e => setAgreementSurgeryDate(e.target.value)} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white font-medium" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-[#8C857B] mb-1 font-bold">Čas zákroku</label>
                          <input type="time" value={agreementSurgeryTime} onChange={e => setAgreementSurgeryTime(e.target.value)} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white font-medium" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] text-[#8C857B] mb-1">Dátum podpisu dohody</label>
                          <input type="date" value={agreementDate} onChange={e => setAgreementDate(e.target.value)} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-[#8C857B] mb-1">Splatnosť zálohy (pracovné dni)</label>
                          <input type="number" min="1" max="30" value={depositDueDays} onChange={e => setDepositDueDays(parseInt(e.target.value, 10) || 3)} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] text-[#8C857B] mb-1">Banka poskytovateľa</label>
                          <input type="text" value={bankName} onChange={e => setBankName(e.target.value)} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-[#8C857B] mb-1">IBAN poskytovateľa</label>
                          <input type="text" value={bankIban} onChange={e => setBankIban(e.target.value)} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white font-mono" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-[#8C857B] mb-1">Variabilný symbol (predvolené z RČ)</label>
                        <input type="text" value={customVariableSymbol} onChange={e => setCustomVariableSymbol(e.target.value)} placeholder={birthNumber ? birthNumber.replace(/\D/g, '') : '8855126789'} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white font-mono" />
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E8E2D9]">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-[10px] text-[#8C857B]">Záloha (€)</label>
                            <div className="flex gap-1">
                              <button type="button" onClick={() => setDepositPaid(Math.round(totalPrice * 0.2))} className="text-[9px] bg-white border border-[#E8E2D9] px-1.5 py-0.5 rounded text-[#8C857B] hover:text-[#2C2A29]">20%</button>
                              <button type="button" onClick={() => setDepositPaid(Math.round(totalPrice * 0.3))} className="text-[9px] bg-white border border-[#E8E2D9] px-1.5 py-0.5 rounded text-[#8C857B] hover:text-[#2C2A29]">30%</button>
                              <button type="button" onClick={() => setDepositPaid(500)} className="text-[9px] bg-white border border-[#E8E2D9] px-1.5 py-0.5 rounded text-[#8C857B] hover:text-[#2C2A29]">500€</button>
                            </div>
                          </div>
                          <input type="number" value={depositPaid} onChange={e => setDepositPaid(parseFloat(e.target.value) || 0)} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white font-bold" />
                        </div>
                        <div className="flex flex-col justify-end">
                          <p className="text-[10px] text-[#8C857B]">Doplatok najneskôr v deň zákroku:</p>
                          <p className="text-base font-bold text-[#C5A059]">{remainingPrice.toFixed(2)} €</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SEKCIA: INFORMOVANÝ SÚHLAS S OPERÁCIOU (PODĽA § 6 ZÁKONA Č. 576/2004 Z. Z.) */}
            {showSurgeryConsent && (
              <div className="border border-[#E8E2D9] rounded-xl p-4 bg-[#FBF9F6] space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#E8E2D9] pb-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-[#C5A059]">Konfigurácia informovaného súhlasu</p>
                    <p className="text-[9px] text-[#8C857B]">§ 6 zákona č. 576/2004 Z. z. • SAY CLINIC</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsTemplateManagerOpen(true)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#C5A059]/15 text-[#C5A059] hover:bg-[#C5A059]/25 text-[10px] font-bold flex items-center gap-1.5 border border-[#C5A059]/30 transition-colors shadow-2xs cursor-pointer"
                    title="Otvoriť správcu preddefinovaných textov pre všetky operácie"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Upraviť preddefinované texty & šablóny</span>
                  </button>
                </div>

                {/* 1. VÝBER OPERÁCIE Z DATABÁZY & ŠABLÓNY */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-bold text-[#8C857B] uppercase">Výber operácie z katalógu (automatické vyplnenie)</label>
                    <span className="text-[9px] text-[#C5A059] font-medium">Auto-doplnenie všetkých polí</span>
                  </div>
                  <select 
                    onChange={e => {
                      const op = SERVICES_DATABASE.operations.find(o => o.id === e.target.value);
                      if (op) {
                        setManualProcedure(op.name);
                        setCheckupData(prev => ({ ...prev, operationName: op.name }));
                        updateConsentFromProcedure(op.name);
                      }
                    }} 
                    value="" 
                    className="w-full border border-[#C5A059] p-2 rounded-lg text-xs bg-white font-bold text-[#2C2A29] mb-2 shadow-xs cursor-pointer"
                  >
                    <option value="" disabled>+ Vybrať operáciu zo zoznamu...</option>
                    {SERVICES_DATABASE.operations.map(op => <option key={op.id} value={op.id}>{op.name} ({op.price} €)</option>)}
                  </select>

                  <div>
                    <label className="block text-[9px] text-[#8C857B] uppercase mb-1">Názov operačného výkonu</label>
                    <input 
                      type="text" 
                      value={surgeryConsent.procedureName} 
                      onChange={e => {
                        const val = e.target.value;
                        setSurgeryConsent(prev => ({ ...prev, procedureName: val }));
                        setManualProcedure(val);
                      }} 
                      className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white font-bold text-[#2C2A29]" 
                    />
                  </div>

                  {/* LIŠTA RÝCHLYCH AKCIÍ SO ŠABLÓNOU */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => updateConsentFromProcedure(surgeryConsent.procedureName || manualProcedure || 'Augmentácia')}
                      className="px-2.5 py-1 rounded-lg border border-[#E8E2D9] bg-white text-[10px] font-semibold text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#FBF9F6] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      title="Znova načítať predvolené texty zo šablóny"
                    >
                      <RotateCcw className="w-3 h-3 text-[#C5A059]" />
                      <span>Znova načítať zo šablóny</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveCurrentAsDefaultTemplate}
                      className="px-2.5 py-1 rounded-lg border border-[#C5A059]/40 bg-[#C5A059]/10 text-[10px] font-bold text-[#C5A059] hover:bg-[#C5A059]/20 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      title="Uložiť aktuálne vyplnené texty do šablóny pre túto operáciu"
                    >
                      <Save className="w-3 h-3" />
                      <span>Uložiť tieto texty ako predvolenú šablónu</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsTemplateManagerOpen(true)}
                      className="px-2.5 py-1 rounded-lg border border-[#E8E2D9] bg-white text-[10px] font-semibold text-[#2C2A29] hover:bg-[#FBF9F6] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs ml-auto"
                      title="Otvoriť kompletný editor všetkých šablón"
                    >
                      <Sliders className="w-3 h-3 text-[#C5A059]" />
                      <span>Katalóg šablón</span>
                    </button>
                  </div>

                  {templateSaveFeedback && (
                    <div className="mt-2 p-2 rounded-lg bg-[#10B981]/15 border border-[#10B981]/30 text-[#047857] text-[10px] font-bold flex items-center gap-1.5 animate-in fade-in">
                      <Check className="w-3.5 h-3.5" />
                      <span>{templateSaveFeedback}</span>
                    </div>
                  )}
                </div>

                {/* 2. IDENTIFIKÁCIA PACIENTA A POISŤOVŇA */}
                <div className="border-t border-[#E8E2D9] pt-3 space-y-2">
                  <p className="text-[10px] font-bold text-[#2C2A29] uppercase">Doplnková identifikácia pacienta</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-[#8C857B] mb-1">Rodné priezvisko</label>
                      <input 
                        type="text" 
                        value={patientMaidenName} 
                        onChange={e => setPatientMaidenName(e.target.value)} 
                        placeholder="napr. Nováková" 
                        className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-[#8C857B] mb-1">Zdravotná poisťovňa</label>
                      <select 
                        value={patientInsurance} 
                        onChange={e => setPatientInsurance(e.target.value)} 
                        className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white font-medium"
                      >
                        <option value="Všeobecná zdravotná poisťovňa (VšZP)">VšZP (25)</option>
                        <option value="Dôvera zdravotná poisťovňa">Dôvera (24)</option>
                        <option value="Union zdravotná poisťovňa">Union (27)</option>
                        <option value="Samoplatca (bez poistenia v SR)">Samoplatca</option>
                      </select>
                    </div>
                  </div>

                  <details className="text-[10px] text-[#8C857B] cursor-pointer pt-1">
                    <summary className="font-semibold text-[#C5A059] hover:underline">Zákonný zástupca / Opatrovník (voliteľné)</summary>
                    <div className="mt-2 space-y-2 bg-white p-2.5 rounded-lg border border-[#E8E2D9]">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] text-[#8C857B]">Meno a priezvisko zástupcu</label>
                          <input type="text" value={legalRep.name} onChange={e => setLegalRep({...legalRep, name: e.target.value})} className="w-full border border-[#E8E2D9] p-1 rounded text-xs" />
                        </div>
                        <div>
                          <label className="block text-[9px] text-[#8C857B]">Dátum narodenia zástupcu</label>
                          <input type="text" value={legalRep.birthDate} onChange={e => setLegalRep({...legalRep, birthDate: e.target.value})} placeholder="DD. MM. RRRR" className="w-full border border-[#E8E2D9] p-1 rounded text-xs" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] text-[#8C857B]">Trvalý pobyt zástupcu</label>
                          <input type="text" value={legalRep.address} onChange={e => setLegalRep({...legalRep, address: e.target.value})} className="w-full border border-[#E8E2D9] p-1 rounded text-xs" />
                        </div>
                        <div>
                          <label className="block text-[9px] text-[#8C857B]">Právny titul</label>
                          <input type="text" value={legalRep.title} onChange={e => setLegalRep({...legalRep, title: e.target.value})} placeholder="Rodič / Opatrovník" className="w-full border border-[#E8E2D9] p-1 rounded text-xs" />
                        </div>
                      </div>
                    </div>
                  </details>
                </div>

                {/* 3. ŠPECIFIKÁCIA OPERÁCIE */}
                <div className="border-t border-[#E8E2D9] pt-3 space-y-2">
                  <p className="text-[10px] font-bold text-[#2C2A29] uppercase">Špecifikácia operačného výkonu</p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-[#8C857B] mb-1">Anatomická oblasť a lokalizácia</label>
                      <input 
                        type="text" 
                        value={surgeryConsent.anatomicalArea} 
                        onChange={e => setSurgeryConsent({...surgeryConsent, anatomicalArea: e.target.value})} 
                        className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white font-medium" 
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-[#8C857B] mb-1">Druh plánovanej anestézie</label>
                      <select 
                        value={surgeryConsent.anesthesiaType} 
                        onChange={e => setSurgeryConsent({...surgeryConsent, anesthesiaType: e.target.value})} 
                        className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white font-medium"
                      >
                        <option value="Celková anestézia">Celková anestézia</option>
                        <option value="Analgosedácia">Analgosedácia</option>
                        <option value="Lokálna anestézia">Lokálna anestézia</option>
                        <option value="Zvodová (regionálna) anestézia">Zvodová anestézia</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] text-[#8C857B] mb-1">Účel a povaha operačného výkonu</label>
                    <textarea 
                      rows={2} 
                      value={surgeryConsent.purposeAndNature} 
                      onChange={e => setSurgeryConsent({...surgeryConsent, purposeAndNature: e.target.value})} 
                      className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white" 
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] text-[#8C857B] mb-1">Predpokladaný postup a operačná technika</label>
                    <textarea 
                      rows={3} 
                      value={surgeryConsent.technique} 
                      onChange={e => setSurgeryConsent({...surgeryConsent, technique: e.target.value})} 
                      className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-[#8C857B] mb-1">Možné alternatívy výkonu</label>
                      <textarea 
                        rows={2} 
                        value={surgeryConsent.alternatives} 
                        onChange={e => setSurgeryConsent({...surgeryConsent, alternatives: e.target.value})} 
                        className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-[#8C857B] mb-1">Dôsledky odmietnutia výkonu</label>
                      <textarea 
                        rows={2} 
                        value={surgeryConsent.refusalConsequences} 
                        onChange={e => setSurgeryConsent({...surgeryConsent, refusalConsequences: e.target.value})} 
                        className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white" 
                      />
                    </div>
                  </div>
                </div>

                {/* 4. ŠPECIFICKÉ RIZIKÁ A KOMPLIKÁCIE */}
                <div className="border-t border-[#E8E2D9] pt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-bold text-[#2C2A29] uppercase">Špecifické riziká & komplikácie viazané na výkon</p>
                    <button 
                      type="button" 
                      onClick={() => updateConsentFromProcedure(surgeryConsent.procedureName)} 
                      className="text-[9px] text-[#C5A059] hover:underline"
                    >
                      ↺ Obnoviť z katalógu
                    </button>
                  </div>
                  <textarea 
                    rows={4} 
                    value={surgeryConsent.specificRisks} 
                    onChange={e => setSurgeryConsent({...surgeryConsent, specificRisks: e.target.value})} 
                    className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white font-medium text-[#2C2A29]" 
                  />
                </div>

                {/* 5. INDIVIDUÁLNA ANAMNÉZA PACIENTA */}
                <div className="border-t border-[#E8E2D9] pt-3 space-y-2">
                  <p className="text-[10px] font-bold text-[#2C2A29] uppercase">Individuálne rizikové faktory a anamnéza</p>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[9px] text-[#8C857B] mb-1">Alergie</label>
                      <input 
                        type="text" 
                        value={surgeryConsent.allergies} 
                        onChange={e => setSurgeryConsent({...surgeryConsent, allergies: e.target.value})} 
                        className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-[#8C857B] mb-1">Chronické ochorenia</label>
                      <input 
                        type="text" 
                        value={surgeryConsent.chronicDiseases} 
                        onChange={e => setSurgeryConsent({...surgeryConsent, chronicDiseases: e.target.value})} 
                        className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-[#8C857B] mb-1">Poruchy zrážanlivosti / Lieky</label>
                      <input 
                        type="text" 
                        value={surgeryConsent.bleedingDisorders} 
                        onChange={e => setSurgeryConsent({...surgeryConsent, bleedingDisorders: e.target.value})} 
                        className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-[#8C857B] mb-1">Užívaná trvalá medikácia</label>
                      <input 
                        type="text" 
                        value={surgeryConsent.chronicMedication} 
                        onChange={e => setSurgeryConsent({...surgeryConsent, chronicMedication: e.target.value})} 
                        className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-[#8C857B] mb-1">Sklon k tvorbe keloidných jaziev</label>
                      <select 
                        value={surgeryConsent.keloidTendency} 
                        onChange={e => setSurgeryConsent({...surgeryConsent, keloidTendency: e.target.value})} 
                        className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white font-medium"
                      >
                        <option value="Nie">Nie</option>
                        <option value="Áno (pozitívna sklonnosť)">Áno</option>
                        <option value="Nevie / Nebolo zistené">Nevie</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] text-[#8C857B] mb-1">Fajčenie / Nikotín / Alkohol</label>
                      <input 
                        type="text" 
                        value={surgeryConsent.smokingAlcohol} 
                        onChange={e => setSurgeryConsent({...surgeryConsent, smokingAlcohol: e.target.value})} 
                        className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white" 
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[9px] text-[#8C857B] mb-1">Predchádzajúce operácie a estetické zákroky v lokalite</label>
                      <input 
                        type="text" 
                        value={surgeryConsent.previousSurgeries} 
                        onChange={e => setSurgeryConsent({...surgeryConsent, previousSurgeries: e.target.value})} 
                        className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white" 
                      />
                    </div>
                  </div>
                </div>

                {/* 6. POOPERAČNÝ REŽIM A POKYNY */}
                <div className="border-t border-[#E8E2D9] pt-3 space-y-2">
                  <p className="text-[10px] font-bold text-[#2C2A29] uppercase">Pooperačný režim, obmedzenia a pokyny</p>
                  
                  <div className="space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] text-[#8C857B] mb-0.5">Dĺžka kľudového režimu (týždne)</label>
                        <input type="text" value={surgeryConsent.recoveryWeeks} onChange={e => setSurgeryConsent({...surgeryConsent, recoveryWeeks: e.target.value})} placeholder="napr. 4 - 6" className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white font-medium" />
                      </div>
                      <div>
                        <label className="block text-[9px] text-[#8C857B] mb-0.5">Kód operujúceho lekára</label>
                        <input type="text" value={doctorCode} onChange={e => setDoctorCode(e.target.value)} placeholder="A86342871" className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white font-medium" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] text-[#8C857B] mb-0.5">Kľudový režim a polohovanie</label>
                      <textarea rows={2} value={surgeryConsent.postopRest} onChange={e => setSurgeryConsent({...surgeryConsent, postopRest: e.target.value})} className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white" />
                    </div>
                    <div>
                      <label className="block text-[9px] text-[#8C857B] mb-0.5">Kompresívna / fixačná bielizeň a obväzy</label>
                      <textarea rows={2} value={surgeryConsent.postopGarment} onChange={e => setSurgeryConsent({...surgeryConsent, postopGarment: e.target.value})} className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white" />
                    </div>
                    <div>
                      <label className="block text-[9px] text-[#8C857B] mb-0.5">Fyzické obmedzenia a šport</label>
                      <textarea rows={2} value={surgeryConsent.postopPhysical} onChange={e => setSurgeryConsent({...surgeryConsent, postopPhysical: e.target.value})} className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white" />
                    </div>
                    <div>
                      <label className="block text-[9px] text-[#8C857B] mb-0.5">Starostlivosť o rany, stehy a jazvy</label>
                      <textarea rows={2} value={surgeryConsent.postopWound} onChange={e => setSurgeryConsent({...surgeryConsent, postopWound: e.target.value})} className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white" />
                    </div>
                    <div>
                      <label className="block text-[9px] text-[#8C857B] mb-0.5">Environmentálne obmedzenia (voda, sauna, slnko)</label>
                      <textarea rows={2} value={surgeryConsent.postopEnvironment} onChange={e => setSurgeryConsent({...surgeryConsent, postopEnvironment: e.target.value})} className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] text-[#8C857B] mb-0.5">Medikamentózna liečba</label>
                        <input type="text" value={surgeryConsent.postopMedication} onChange={e => setSurgeryConsent({...surgeryConsent, postopMedication: e.target.value})} className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white" />
                      </div>
                      <div>
                        <label className="block text-[9px] text-[#8C857B] mb-0.5">Harmonogram kontrol</label>
                        <input type="text" value={surgeryConsent.postopCheckup} onChange={e => setSurgeryConsent({...surgeryConsent, postopCheckup: e.target.value})} className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 7. OTÁZKY PACIENTA A ODPOVEDE LEKÁRA */}
                <div className="border-t border-[#E8E2D9] pt-3 space-y-2">
                  <p className="text-[10px] font-bold text-[#2C2A29] uppercase">Doplňujúce otázky pacienta a odpovede lekára</p>
                  <div className="space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] text-[#8C857B] mb-0.5">Otázka pacienta č. 1</label>
                        <input type="text" value={surgeryConsent.patientQuestion1} onChange={e => setSurgeryConsent({...surgeryConsent, patientQuestion1: e.target.value})} className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white" />
                      </div>
                      <div>
                        <label className="block text-[9px] text-[#8C857B] mb-0.5">Odpoveď lekára č. 1</label>
                        <input type="text" value={surgeryConsent.doctorAnswer1} onChange={e => setSurgeryConsent({...surgeryConsent, doctorAnswer1: e.target.value})} className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] text-[#8C857B] mb-0.5">Otázka pacienta č. 2 (voliteľná)</label>
                        <input type="text" value={surgeryConsent.patientQuestion2} onChange={e => setSurgeryConsent({...surgeryConsent, patientQuestion2: e.target.value})} placeholder="napr. Použitie silikónových náplastí..." className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white" />
                      </div>
                      <div>
                        <label className="block text-[9px] text-[#8C857B] mb-0.5">Odpoveď lekára č. 2</label>
                        <input type="text" value={surgeryConsent.doctorAnswer2} onChange={e => setSurgeryConsent({...surgeryConsent, doctorAnswer2: e.target.value})} placeholder="napr. Aplikovať po zahojení jazvy..." className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] text-[#8C857B] mb-0.5">Osobitné individuálne dojednania</label>
                      <input type="text" value={surgeryConsent.specialAgreements} onChange={e => setSurgeryConsent({...surgeryConsent, specialAgreements: e.target.value})} className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white" />
                    </div>
                  </div>
                </div>

                {/* 8. ČASOVÉ ÚDAJE A MIESTO */}
                <div className="border-t border-[#E8E2D9] pt-3 space-y-2">
                  <p className="text-[10px] font-bold text-[#2C2A29] uppercase">Časové údaje a podpisy</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <label className="block text-[9px] text-[#8C857B] mb-1">Dátum a čas poučenia</label>
                      <input type="text" value={surgeryConsent.instructionDateTime} onChange={e => setSurgeryConsent({...surgeryConsent, instructionDateTime: e.target.value})} className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white" />
                    </div>
                    <div>
                      <label className="block text-[9px] text-[#8C857B] mb-1">Dátum a čas súhlasu</label>
                      <input type="text" value={surgeryConsent.consentDateTime} onChange={e => setSurgeryConsent({...surgeryConsent, consentDateTime: e.target.value})} className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white" />
                    </div>
                    <div>
                      <label className="block text-[9px] text-[#8C857B] mb-1">Presný čas súhlasu (hh:mm)</label>
                      <input type="text" value={surgeryConsent.consentTime} onChange={e => setSurgeryConsent({...surgeryConsent, consentTime: e.target.value})} placeholder="09:30" className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white font-medium" />
                    </div>
                    <div>
                      <label className="block text-[9px] text-[#8C857B] mb-1">Miesto podpisu</label>
                      <input type="text" value={surgeryConsent.signaturePlace} onChange={e => setSurgeryConsent({...surgeryConsent, signaturePlace: e.target.value})} className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SEKCIA: INFORMOVANÝ SÚHLAS S APLIKÁCIOU VÝPLNÍ / BOTOXU */}
            {showAestheticConsent && (
              <div className="border border-[#E8E2D9] rounded-xl p-4 bg-[#FBF9F6] space-y-3">
                <p className="text-[10px] uppercase tracking-wider font-bold text-[#C5A059]">Údaje k estetickému zákroku</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-[#8C857B] mb-1">Typ ošetrenia</label>
                    <select value={aestheticConsent.treatmentType} onChange={e => setAestheticConsent({...aestheticConsent, treatmentType: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white">
                      <option value="Aplikácia kyseliny hyalurónovej">Aplikácia kyseliny hyalurónovej</option>
                      <option value="Aplikácia botulotoxínu">Aplikácia botulotoxínu</option>
                      <option value="Skinbooster / Biorevitalizácia">Skinbooster / Biorevitalizácia</option>
                      <option value="Aplikácia hyaluronidázy">Aplikácia hyaluronidázy (rozpustenie)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#8C857B] mb-1">Názov produktu</label>
                    <input type="text" value={aestheticConsent.productName} onChange={e => setAestheticConsent({...aestheticConsent, productName: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white font-bold" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[10px] text-[#8C857B] mb-1">Miesto aplikácie</label>
                    <input type="text" value={aestheticConsent.applicationSites} onChange={e => setAestheticConsent({...aestheticConsent, applicationSites: e.target.value})} placeholder="Pery, nosoústne ryhy..." className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#8C857B] mb-1">Množstvo / Dávka</label>
                    <input type="text" value={aestheticConsent.volumeOrUnits} onChange={e => setAestheticConsent({...aestheticConsent, volumeOrUnits: e.target.value})} placeholder="1.0 ml / 50 IU" className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-[#8C857B] mb-1">Číslo šarže (LOT)</label>
                  <input type="text" value={aestheticConsent.batchNumber} onChange={e => setAestheticConsent({...aestheticConsent, batchNumber: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white" />
                </div>
              </div>
            )}

            {/* SEKCIA: ŽIADANKA NA PREDOPERAČNÉ VYŠETRENIA */}
            {showPreopRequest && (
              <div className="border border-[#E8E2D9] rounded-xl p-4 bg-[#FBF9F6] space-y-3">
                <p className="text-[10px] uppercase tracking-wider font-bold text-[#C5A059]">Konfigurácia žiadanky</p>
                <div>
                  <label className="block text-[10px] text-[#8C857B] mb-1">Plánovaný operačný výkon</label>
                  <input type="text" value={preopRequest.targetSurgery} onChange={e => setPreopRequest({...preopRequest, targetSurgery: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-[#8C857B] mb-1">Termín operácie</label>
                    <input type="date" value={preopRequest.surgeryDate} onChange={e => setPreopRequest({...preopRequest, surgeryDate: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#8C857B] mb-1">Adresát (Lekár)</label>
                    <input type="text" value={preopRequest.gpDoctorName} onChange={e => setPreopRequest({...preopRequest, gpDoctorName: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white" />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#8C857B] mb-1">Požadované laboratórne a interné testy:</p>
                  <div className="space-y-1.5 text-xs">
                    {[
                      'Krvný obraz + diferenciálny rozpočet + trombocyty',
                      'Koagulačné vyšetrenie (Quick / INR, APTT, Fibrinogén)',
                      'Biochémia (Glykémia, Urea, Kreatinín, Kyselina močová, AST, ALT, GMT, Bilirubín celkový)',
                      'Ióny (Na, K, Cl)',
                      'Sedimentácia erytrocytov (FW) / CRP',
                      'Moč chemicky + močový sediment',
                      'Krvná skupina a Rh faktor',
                      '12-zvodové EKG s písomným popisom a interpretáciou internistu',
                      'RTG hrudníka (u fajčiarov/nad 45 rokov)',
                      'Interné predoperačné vyšetrenie so záverom: Schopný/á výkonu v celkovej anestézii'
                    ].map(test => (
                      <label key={test} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={preopRequest.requiredTests.includes(test)} onChange={() => handlePreopTestToggle(test)} className="rounded text-[#C5A059]" />
                        <span>{test}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SEKCIA: LEKÁRSKE POTVRDENIE */}
            {showCertificate && (
              <div className="border border-[#E8E2D9] rounded-xl p-4 bg-[#FBF9F6] space-y-3">
                <p className="text-[10px] uppercase tracking-wider font-bold text-[#C5A059]">Údaje potvrdenia</p>
                <div>
                  <label className="block text-[10px] text-[#8C857B] mb-1">Účel posudku / potvrdenia</label>
                  <input type="text" value={medicalCertificate.purpose} onChange={e => setMedicalCertificate({...medicalCertificate, purpose: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] text-[#8C857B] mb-1">Text lekárskeho posudku</label>
                  <textarea rows={4} value={medicalCertificate.statement} onChange={e => setMedicalCertificate({...medicalCertificate, statement: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-[#8C857B] mb-1">Doba platnosti / Kľudový režim</label>
                    <input type="text" value={medicalCertificate.validUntil} onChange={e => setMedicalCertificate({...medicalCertificate, validUntil: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#8C857B] mb-1">Vydané pre</label>
                    <input type="text" value={medicalCertificate.issuedFor} onChange={e => setMedicalCertificate({...medicalCertificate, issuedFor: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white" />
                  </div>
                </div>
              </div>
            )}

            {/* OPERAČNÉ ÚDAJE (PRE PROTOKOL A PREPÚŠŤACIU SPRÁVU) */}
            {showSurgeryDetails && (
              <div className="border border-[#E8E2D9] rounded-xl p-4 bg-[#FBF9F6] space-y-4">
                <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-2">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-[#C5A059]">Operačné údaje & Voľba výkonu</p>
                  <span className="text-[9px] text-[#8C857B] font-mono">42+ chirurgických výkonov</span>
                </div>

                {/* VOĽBA OPERÁCIE PRIAMO V OPERAČNOM PROTOKOLE */}
                {docType === 'operacny_protokol' && (
                  <div className="space-y-2">
                    <label className="block text-[9px] text-[#8C857B] uppercase font-bold">Vyberte operáciu / zákrok z cenníka kliniky:</label>
                    <select 
                      onChange={e => {
                        const found = SERVICES_DATABASE.operations.find(o => o.id === e.target.value);
                        if (found) {
                          setManualProcedure(found.name);
                          setCheckupData(prev => ({ ...prev, operationName: found.name }));
                          handleAddItemFromDropdown(found.id, true);
                          // Automatické nastavenie odporúčaní pre personál
                          setPostopStaffCare(getStaffRecommendationsForProcedure(found.name));
                        }
                      }} 
                      value="" 
                      className="w-full border border-[#C5A059] p-2 rounded-lg text-xs bg-white text-[#2C2A29] font-bold"
                    >
                      <option value="" disabled>+ Vybrať operáciu z cenníka...</option>
                      {SERVICES_DATABASE.operations.map(op => (
                        <option key={op.id} value={op.id}>{op.name} ({op.price} €)</option>
                      ))}
                    </select>

                    <div>
                      <label className="block text-[9px] text-[#8C857B] uppercase font-bold mb-1">Názov zákroku (zobrazený v protokole)</label>
                      <input 
                        type="text" 
                        value={manualProcedure} 
                        onChange={e => {
                          setManualProcedure(e.target.value);
                          setPostopStaffCare(getStaffRecommendationsForProcedure(e.target.value));
                        }} 
                        placeholder="napr. Zväčšenie prsníkov silikónovými implantátmi..." 
                        className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white font-bold" 
                      />
                    </div>
                  </div>
                )}

                {/* TERMÍNY A ČASY */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  {docType === 'operacny_protokol' && (
                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-[9px] text-[#8C857B] uppercase font-bold mb-1">Termín zákroku</label>
                      <input 
                        type="date" 
                        value={surgeryDetails.opDate} 
                        onChange={e => setSurgeryDetails({...surgeryDetails, opDate: e.target.value})} 
                        className="border border-[#E8E2D9] p-2 rounded-lg w-full bg-white text-xs font-medium" 
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-[9px] text-[#8C857B] uppercase font-bold mb-1">Čas operácie (Od - Do)</label>
                    <div className="flex gap-2">
                      <input type="time" value={surgeryDetails.opStart} onChange={e => setSurgeryDetails({...surgeryDetails, opStart: e.target.value})} className="border border-[#E8E2D9] p-1.5 rounded-lg w-full bg-white text-xs" />
                      <input type="time" value={surgeryDetails.opEnd} onChange={e => setSurgeryDetails({...surgeryDetails, opEnd: e.target.value})} className="border border-[#E8E2D9] p-1.5 rounded-lg w-full bg-white text-xs" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] text-[#8C857B] uppercase font-bold mb-1">Čas anestézie (Od - Do)</label>
                    <div className="flex gap-2">
                      <input type="time" value={surgeryDetails.anesStart} onChange={e => setSurgeryDetails({...surgeryDetails, anesStart: e.target.value})} className="border border-[#E8E2D9] p-1.5 rounded-lg w-full bg-white text-xs" />
                      <input type="time" value={surgeryDetails.anesEnd} onChange={e => setSurgeryDetails({...surgeryDetails, anesEnd: e.target.value})} className="border border-[#E8E2D9] p-1.5 rounded-lg w-full bg-white text-xs" />
                    </div>
                  </div>
                </div>

                {/* VÝBER OPERAČNÉHO TÍMU S PREHĽADNÝMI DROPDOWNS */}
                <div className="border-t border-[#E8E2D9] pt-3 space-y-3">
                  <p className="text-[9px] text-[#C5A059] uppercase font-bold tracking-wider">Operačný tím (Výber personálu)</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Operatér */}
                    <div>
                      <label className="block text-[9px] text-[#8C857B] font-bold uppercase mb-1">Operatér</label>
                      <div className="space-y-1">
                        <select
                          value={SURGICAL_TEAM_PRESETS.operators.includes(doctor) ? doctor : '__custom__'}
                          onChange={e => {
                            if (e.target.value !== '__custom__') {
                              setDoctor(e.target.value);
                              setSurgeryDetails({ ...surgeryDetails, operator: e.target.value });
                            }
                          }}
                          className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white text-xs font-semibold"
                        >
                          {SURGICAL_TEAM_PRESETS.operators.map(name => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                          <option value="__custom__">Iné / Vlastné meno...</option>
                        </select>
                        {(!SURGICAL_TEAM_PRESETS.operators.includes(doctor) || doctor === '') && (
                          <input
                            type="text"
                            value={doctor}
                            onChange={e => {
                              setDoctor(e.target.value);
                              setSurgeryDetails({ ...surgeryDetails, operator: e.target.value });
                            }}
                            placeholder="Zadajte meno operatéra..."
                            className="w-full border border-[#E8E2D9] p-1.5 rounded-lg bg-white text-xs"
                          />
                        )}
                      </div>
                    </div>

                    {/* Asistent */}
                    <div>
                      <label className="block text-[9px] text-[#8C857B] font-bold uppercase mb-1">Asistent</label>
                      <div className="space-y-1">
                        <select
                          value={SURGICAL_TEAM_PRESETS.assistants.includes(surgeryDetails.assistant) ? surgeryDetails.assistant : '__custom__'}
                          onChange={e => {
                            if (e.target.value !== '__custom__') {
                              setSurgeryDetails({ ...surgeryDetails, assistant: e.target.value });
                            }
                          }}
                          className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white text-xs"
                        >
                          {SURGICAL_TEAM_PRESETS.assistants.map(name => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                          <option value="__custom__">Iné / Vlastné meno...</option>
                        </select>
                        {!SURGICAL_TEAM_PRESETS.assistants.includes(surgeryDetails.assistant) && (
                          <input
                            type="text"
                            value={surgeryDetails.assistant}
                            onChange={e => setSurgeryDetails({ ...surgeryDetails, assistant: e.target.value })}
                            placeholder="Zadajte meno asistenta..."
                            className="w-full border border-[#E8E2D9] p-1.5 rounded-lg bg-white text-xs"
                          />
                        )}
                      </div>
                    </div>

                    {/* Anesteziológ */}
                    <div>
                      <label className="block text-[9px] text-[#8C857B] font-bold uppercase mb-1">Anesteziológ</label>
                      <div className="space-y-1">
                        <select
                          value={SURGICAL_TEAM_PRESETS.anesthesiologists.includes(surgeryDetails.anesthesiologist) ? surgeryDetails.anesthesiologist : '__custom__'}
                          onChange={e => {
                            if (e.target.value !== '__custom__') {
                              setSurgeryDetails({ ...surgeryDetails, anesthesiologist: e.target.value });
                            }
                          }}
                          className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white text-xs"
                        >
                          {SURGICAL_TEAM_PRESETS.anesthesiologists.map(name => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                          <option value="__custom__">Iné / Vlastné meno...</option>
                        </select>
                        {!SURGICAL_TEAM_PRESETS.anesthesiologists.includes(surgeryDetails.anesthesiologist) && (
                          <input
                            type="text"
                            value={surgeryDetails.anesthesiologist}
                            onChange={e => setSurgeryDetails({ ...surgeryDetails, anesthesiologist: e.target.value })}
                            placeholder="Zadajte meno anesteziológa..."
                            className="w-full border border-[#E8E2D9] p-1.5 rounded-lg bg-white text-xs"
                          />
                        )}
                      </div>
                    </div>

                    {docType === 'operacny_protokol' && (
                      <>
                        {/* Inštrumentárka */}
                        <div>
                          <label className="block text-[9px] text-[#8C857B] font-bold uppercase mb-1">Inštrumentárka</label>
                          <div className="space-y-1">
                            <select
                              value={SURGICAL_TEAM_PRESETS.instrumentalists.includes(surgeryDetails.instrumentalist) ? surgeryDetails.instrumentalist : '__custom__'}
                              onChange={e => {
                                if (e.target.value !== '__custom__') {
                                  setSurgeryDetails({ ...surgeryDetails, instrumentalist: e.target.value });
                                }
                              }}
                              className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white text-xs"
                            >
                              {SURGICAL_TEAM_PRESETS.instrumentalists.map(name => (
                                <option key={name} value={name}>{name}</option>
                              ))}
                              <option value="__custom__">Iné / Vlastné meno...</option>
                            </select>
                            {!SURGICAL_TEAM_PRESETS.instrumentalists.includes(surgeryDetails.instrumentalist) && (
                              <input
                                type="text"
                                value={surgeryDetails.instrumentalist}
                                onChange={e => setSurgeryDetails({ ...surgeryDetails, instrumentalist: e.target.value })}
                                placeholder="Zadajte meno inštrumentárky..."
                                className="w-full border border-[#E8E2D9] p-1.5 rounded-lg bg-white text-xs"
                              />
                            )}
                          </div>
                        </div>

                        {/* Anesteziologická sestra */}
                        <div className="col-span-1 sm:col-span-2">
                          <label className="block text-[9px] text-[#8C857B] font-bold uppercase mb-1">Anestéziologická sestra</label>
                          <div className="space-y-1">
                            <select
                              value={SURGICAL_TEAM_PRESETS.anestNurses.includes(surgeryDetails.anestNurse) ? surgeryDetails.anestNurse : '__custom__'}
                              onChange={e => {
                                if (e.target.value !== '__custom__') {
                                  setSurgeryDetails({ ...surgeryDetails, anestNurse: e.target.value });
                                }
                              }}
                              className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white text-xs"
                            >
                              {SURGICAL_TEAM_PRESETS.anestNurses.map(name => (
                                <option key={name} value={name}>{name}</option>
                              ))}
                              <option value="__custom__">Iné / Vlastné meno...</option>
                            </select>
                            {!SURGICAL_TEAM_PRESETS.anestNurses.includes(surgeryDetails.anestNurse) && (
                              <input
                                type="text"
                                value={surgeryDetails.anestNurse}
                                onChange={e => setSurgeryDetails({ ...surgeryDetails, anestNurse: e.target.value })}
                                placeholder="Zadajte meno anestéziologickej sestry..."
                                className="w-full border border-[#E8E2D9] p-1.5 rounded-lg bg-white text-xs"
                              />
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {docType === 'prepustacia_sprava' && (
                  <div>
                    <label className="block text-[9px] text-[#8C857B] mb-1 font-bold uppercase">Najbližšia kontrola</label>
                    <select value={surgeryDetails.checkup} onChange={e => setSurgeryDetails({...surgeryDetails, checkup: e.target.value})} className="border border-[#E8E2D9] p-2 rounded-lg w-full text-xs bg-white">
                      <option value="1 deň">O 1 deň</option><option value="2 dni">O 2 dni</option><option value="1 týždeň">O 1 týždeň</option><option value="2 týždne">O 2 týždne</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* SEKCIA: POUŽITÉ IMPLANTÁTY A OPERAČNÝ MATERIÁL (PRE OPERAČNÝ PROTOKOL) */}
            {docType === 'operacny_protokol' && (
              <div className="border border-[#E8E2D9] rounded-xl p-4 bg-[#FBF9F6] space-y-4">
                <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-2">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-[#C5A059]">
                    Použité implantáty & Operačný materiál
                  </p>
                  <span className="text-[9px] text-[#8C857B]">Implantáty, stehy, hemostatiká</span>
                </div>

                {/* Súpis implantátov */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-[9px] text-[#8C857B] uppercase font-bold">Použité implantáty:</label>
                    <button
                      type="button"
                      onClick={() => setSurgeryImplants([
                        ...surgeryImplants,
                        { id: Date.now().toString(), vyrobca: 'Motiva', model: 'Ergonomix', kat: '', objem: '350 cc', strana: 'Vpravo (Dx.)', lot: '', sn: '' }
                      ])}
                      className="text-[10px] font-bold text-[#C5A059] hover:text-[#9c7d3d] bg-white border border-[#C5A059]/40 px-2.5 py-1 rounded-md shadow-xs transition-colors cursor-pointer"
                    >
                      + Pridať implantát
                    </button>
                  </div>

                  {surgeryImplants.length === 0 ? (
                    <div className="bg-white border border-dashed border-[#E8E2D9] p-3 rounded-lg text-center text-xs text-[#8C857B]">
                      Bez použitia trvalých implantátov pri tomto výkone.
                      <button
                        type="button"
                        onClick={() => setSurgeryImplants([
                          { id: Date.now().toString(), vyrobca: 'Motiva', model: 'Ergonomix Full', kat: '', objem: '350 cc', strana: 'Obojstranne (Bilat.)', lot: '', sn: '' }
                        ])}
                        className="block mx-auto mt-1 text-[10px] font-bold text-[#C5A059] underline cursor-pointer"
                      >
                        Pridať implantát
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {surgeryImplants.map((impl, idx) => (
                        <div key={impl.id || idx} className="bg-white border border-[#E8E2D9] rounded-xl p-3 shadow-xs space-y-2">
                          <div className="flex justify-between items-center border-b border-[#E8E2D9]/60 pb-1.5">
                            <span className="text-[10px] font-bold uppercase text-[#2C2A29]">
                              Implantát #{idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSurgeryImplants(surgeryImplants.filter((_, i) => i !== idx))}
                              className="text-[9px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 px-2 py-0.5 rounded cursor-pointer"
                            >
                              Odstrániť
                            </button>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                            <div>
                              <label className="block text-[8px] text-[#8C857B] uppercase font-bold mb-0.5">Výrobca / Značka</label>
                              <input
                                type="text"
                                value={impl.vyrobca}
                                onChange={e => {
                                  const updated = [...surgeryImplants];
                                  updated[idx].vyrobca = e.target.value;
                                  setSurgeryImplants(updated);
                                }}
                                placeholder="Motiva, Mentor, Polytech, Su-por..."
                                className="w-full border border-[#E8E2D9] p-1.5 rounded text-xs bg-[#FAF8F5] font-semibold"
                              />
                            </div>

                            <div>
                              <label className="block text-[8px] text-[#8C857B] uppercase font-bold mb-0.5">Model / Profil</label>
                              <input
                                type="text"
                                value={impl.model}
                                onChange={e => {
                                  const updated = [...surgeryImplants];
                                  updated[idx].model = e.target.value;
                                  setSurgeryImplants(updated);
                                }}
                                placeholder="Ergonomix Full, Round SilkSurface..."
                                className="w-full border border-[#E8E2D9] p-1.5 rounded text-xs bg-[#FAF8F5]"
                              />
                            </div>

                            <div>
                              <label className="block text-[8px] text-[#8C857B] uppercase font-bold mb-0.5">Objem / Veľkosť</label>
                              <input
                                type="text"
                                value={impl.objem}
                                onChange={e => {
                                  const updated = [...surgeryImplants];
                                  updated[idx].objem = e.target.value;
                                  setSurgeryImplants(updated);
                                }}
                                placeholder="350 cc, 400 cc, 4.5 mm..."
                                className="w-full border border-[#E8E2D9] p-1.5 rounded text-xs bg-[#FAF8F5] font-semibold text-[#C5A059]"
                              />
                            </div>

                            <div>
                              <label className="block text-[8px] text-[#8C857B] uppercase font-bold mb-0.5">Lokalizácia / Strana</label>
                              <select
                                value={impl.strana}
                                onChange={e => {
                                  const updated = [...surgeryImplants];
                                  updated[idx].strana = e.target.value;
                                  setSurgeryImplants(updated);
                                }}
                                className="w-full border border-[#E8E2D9] p-1.5 rounded text-xs bg-[#FAF8F5]"
                              >
                                <option value="Obojstranne (Bilat.)">Obojstranne (Bilat.)</option>
                                <option value="Vľavo (Sin.)">Vľavo (Sin.)</option>
                                <option value="Vpravo (Dx.)">Vpravo (Dx.)</option>
                                <option value="Bradový (Mani.)">Bradový (Mani.)</option>
                                <option value="Iná pozícia">Iná pozícia</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[8px] text-[#8C857B] uppercase font-bold mb-0.5">Katalógové číslo / LOT</label>
                              <input
                                type="text"
                                value={impl.lot}
                                onChange={e => {
                                  const updated = [...surgeryImplants];
                                  updated[idx].lot = e.target.value;
                                  setSurgeryImplants(updated);
                                }}
                                placeholder="LOT-2026-X..."
                                className="w-full border border-[#E8E2D9] p-1.5 rounded text-xs bg-[#FAF8F5] font-mono text-[11px]"
                              />
                            </div>

                            <div>
                              <label className="block text-[8px] text-[#8C857B] uppercase font-bold mb-0.5">Sériové číslo (SN)</label>
                              <input
                                type="text"
                                value={impl.sn}
                                onChange={e => {
                                  const updated = [...surgeryImplants];
                                  updated[idx].sn = e.target.value;
                                  setSurgeryImplants(updated);
                                }}
                                placeholder="SN-XXXXXX..."
                                className="w-full border border-[#E8E2D9] p-1.5 rounded text-xs bg-[#FAF8F5] font-mono text-[11px]"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Rozpis použitého materiálu */}
                <div className="space-y-2 pt-2 border-t border-[#E8E2D9]">
                  <div className="flex justify-between items-center">
                    <label className="block text-[9px] text-[#8C857B] uppercase font-bold">
                      Použitý šijací materiál, hemostatiká, drény a krytie:
                    </label>
                  </div>

                  {/* Rýchle čipy materiálov */}
                  <div className="flex flex-wrap gap-1.5 text-[9px]">
                    {[
                      'PDS 4-0',
                      'Monocryl 4-0',
                      'Glycolon 4-0',
                      'Prolene 5-0',
                      'Vicryl 3-0',
                      'Surgicel',
                      'Floseal',
                      'TachoSil',
                      'Redon CH10 2x',
                      'Kompresívna podprsenka',
                      'Brušný pás',
                      'Fixačná dlaha'
                    ].map(mat => (
                      <button
                        key={mat}
                        type="button"
                        onClick={() => {
                          setSurgeryMaterials(prev => prev ? `${prev}, ${mat}` : mat);
                        }}
                        className="bg-white hover:bg-[#FAF8F5] border border-[#E8E2D9] text-[#2C2A29] px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                      >
                        + {mat}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={3}
                    value={surgeryMaterials}
                    onChange={e => setSurgeryMaterials(e.target.value)}
                    placeholder="Zadajte použitý šijací materiál, drenáž, bandáže..."
                    className="w-full border border-[#E8E2D9] p-2.5 rounded-xl text-xs bg-white leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* SEKCIA: AUTOMATICKÉ ODPORÚČANIA PO OPERÁCII PRE OŠETRUJÚCI PERSONÁL */}
            {docType === 'operacny_protokol' && (
              <div className="border border-[#C5A059]/40 rounded-xl p-4 bg-[#FAF7F2] space-y-3">
                <div className="flex flex-wrap justify-between items-center gap-2 border-b border-[#C5A059]/20 pb-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-[#C5A059]">
                      Automatické odporúčania po operácii pre ošetrujúci personál
                    </p>
                    <p className="text-[9px] text-[#8C857B]">
                      Generované automaticky podľa zvoleného typu operácie (Nursing Care Protocol)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPostopStaffCare(getStaffRecommendationsForProcedure(manualProcedure));
                    }}
                    className="text-[9px] font-bold bg-[#C5A059] text-white px-2.5 py-1 rounded-md shadow-xs hover:bg-[#9c7d3d] transition-colors cursor-pointer"
                  >
                    🔄 Obnoviť podľa operácie
                  </button>
                </div>

                {/* Kategórie odporúčaní pre personál */}
                <div className="flex flex-wrap gap-1.5 text-[9px]">
                  {[
                    { label: '🌸 Prsníky', key: 'breast' },
                    { label: '✨ Brucho / Telo', key: 'abdomen' },
                    { label: '⚡ Liposukcia', key: 'liposuction' },
                    { label: '🧏‍♀️ Tvár & Krk', key: 'face' },
                    { label: '👁️ Viečka', key: 'eyelids' },
                    { label: '👃 Nos', key: 'nose' },
                    { label: '🩺 Intímna chirurgia', key: 'labia' },
                    { label: '✋ Ruka & Končatiny', key: 'extremity' }
                  ].map(cat => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => {
                        const items = DEFAULT_POSTOP_STAFF_RECOMMENDATIONS[cat.key] || DEFAULT_POSTOP_STAFF_RECOMMENDATIONS.default;
                        setPostopStaffCare(items.map(i => `• ${i}`).join('\n'));
                      }}
                      className="bg-white hover:bg-[#FAF8F5] border border-[#C5A059]/30 text-[#2C2A29] px-2 py-1 rounded-md font-medium transition-colors cursor-pointer shadow-2xs"
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={5}
                  value={postopStaffCare}
                  onChange={e => setPostopStaffCare(e.target.value)}
                  placeholder="Inštrukcie a odporúčania pre ošetrujúci personál na pooperačnej izbe..."
                  className="w-full border border-[#C5A059]/30 p-2.5 rounded-xl text-xs bg-white leading-relaxed text-[#2C2A29]"
                />
              </div>
            )}

            {/* SEKCIA: PREDPOKLADANÉ LIEKY PRE PREPÚŠŤACIU SPRÁVU */}
            {docType === 'prepustacia_sprava' && (
              <div className="border border-[#E8E2D9] rounded-xl p-4 bg-[#FBF9F6] space-y-3">
                <p className="text-[10px] uppercase tracking-wider font-bold text-[#C5A059]">Predpísané lieky a dávkovanie</p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><label className="block text-[9px] text-[#8C857B] mb-1">Antibiotiká</label><input type="text" value={rxAntibiotics} onChange={e => setRxAntibiotics(e.target.value)} placeholder="napr. Augmentin 1g každých 12h..." className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white" /></div>
                  <div><label className="block text-[9px] text-[#8C857B] mb-1">Analgetiká</label><input type="text" value={rxAnalgesics} onChange={e => setRxAnalgesics(e.target.value)} placeholder="napr. Flector 50mg pri bolesti..." className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white" /></div>
                  <div><label className="block text-[9px] text-[#8C857B] mb-1">Kortikoidy</label><input type="text" value={rxCorticoids} onChange={e => setRxCorticoids(e.target.value)} placeholder="napr. Medrol..." className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white" /></div>
                  <div><label className="block text-[9px] text-[#8C857B] mb-1">Antikoagulanciá</label><input type="text" value={rxAnticoagulants} onChange={e => setRxAnticoagulants(e.target.value)} placeholder="napr. Clexane 0.4ml s.c...." className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-white" /></div>
                </div>
              </div>
            )}

            {/* SEKCIA: ANESTEZIOLOGICKÝ DOTAZNÍK */}
            {showAnesthesiaQ && (
              <div className="border border-[#E8E2D9] rounded-xl p-4 bg-[#FBF9F6] space-y-3">
                <p className="text-[10px] uppercase tracking-wider font-bold text-[#2C2A29]">Zdravotný dotazník pacienta</p>
                {[
                  { key: 'diseases', label: 'Liečite sa v súčasnosti na nejaké ochorenie?' },
                  { key: 'pregnant', label: 'Ak ste žena, ste tehotná?' },
                  { key: 'medications', label: 'Užívate nejaké lieky (bolesť, tlak, spanie)?' },
                  { key: 'allergies', label: 'Máte nejaké alergie (lieky, potraviny, náplaste)?' },
                  { key: 'complications', label: 'Vyskytli sa komplikácie s anestéziou u Vás/príbuzných?' }
                ].map((q) => (
                  <div key={q.key} className="flex justify-between items-center border-b border-[#E8E2D9] pb-2 text-xs">
                    <span className="text-[#2C2A29] pr-4">{q.label}</span>
                    <select 
                      value={(anesthesiaAnswers as any)[q.key]} 
                      onChange={(e) => setAnesthesiaAnswers({...anesthesiaAnswers, [q.key]: e.target.value})}
                      className="border border-[#E8E2D9] p-1 rounded bg-white w-24 font-bold"
                    >
                      <option value="Nie">Nie</option><option value="Áno">Áno</option><option value="Neviem">Neviem</option>
                    </select>
                  </div>
                ))}
              </div>
            )}

            {/* SEKCIA: PODROBNÝ POPIS OPERÁCIE A NÁLEZ */}
            {showNotes && (
              <div className="space-y-3 border border-[#E8E2D9] rounded-xl p-4 bg-[#FBF9F6]">
                <div className="flex flex-wrap justify-between items-end gap-2 border-b border-[#E8E2D9] pb-2">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-[#C5A059]">
                      {docType === 'operacny_protokol' ? 'Podrobný popis operácie' : 'Lekársky nález / Správa'}
                    </label>
                    <span className="text-[9px] text-[#8C857B]">
                      {docType === 'operacny_protokol' ? 'Chirurgický postup, nález a priebeh výkonu' : 'Text lekárskej správy'}
                    </span>
                  </div>

                  <select 
                    value="" 
                    onChange={(e) => handleMacroInsert(e.target.value, 'notes')}
                    className="border border-[#C5A059] p-1.5 rounded-lg text-[10px] bg-white text-[#2C2A29] font-bold shadow-xs cursor-pointer"
                  >
                    <option value="" disabled>+ Vložiť operačné makro...</option>
                    <optgroup label="Tvár">
                      <option value="op_facelift_macs">Facelift MACS</option>
                      <option value="op_deep_plane">Deep plane Facelift</option>
                      <option value="op_necklift">Necklift</option>
                      <option value="op_lipotransfer">Lipotransfer tváre</option>
                      <option value="op_liposukcia_podbradku">Liposukcia podbradku</option>
                      <option value="op_tvarove_implantaty">Tvárové implantáty (Su-por)</option>
                    </optgroup>
                    <optgroup label="Periorbitálna oblasť">
                      <option value="op_horna_blepharo">Horná blepharoplastika</option>
                      <option value="op_dolna_blepharo">Dolná blefaroplastika</option>
                      <option value="op_transpalpebral">Transpalpebrálny browlift</option>
                      <option value="op_gliding_brow">Gliding browlift</option>
                      <option value="op_endo_brow">Endoskopický browlift + midfacelift</option>
                    </optgroup>
                    <optgroup label="Nos a Uši">
                      <option value="op_rhino_komplet">Rhinoplastika kompletná - prezervačná</option>
                      <option value="op_rhino_spicka">Rhinoplatika - špička</option>
                      <option value="op_usi">Uši</option>
                    </optgroup>
                    <optgroup label="Pery">
                      <option value="op_lip_lift">Lip lift</option>
                    </optgroup>
                    <optgroup label="Prsníky">
                      <option value="op_aug_dual">Augmentácia - Dual plane</option>
                      <option value="op_aug_sub">Augmentácia - Subfascial</option>
                      <option value="op_aug_mastopexia">Augmentačná mastopexia</option>
                      <option value="op_mastopexia">Mastopexia</option>
                      <option value="op_redukcia">Redukcia</option>
                      <option value="op_vymena">Výmena implantátov</option>
                      <option value="op_gynekomastia">Gynekomastia</option>
                      <option value="op_lipografting">Lipografting prsníkov</option>
                    </optgroup>
                    <optgroup label="Brucho a Telo">
                      <option value="op_abdominoplastika">Abdominoplastika</option>
                      <option value="op_abdo_kratky_rez">Abdominoplastika - krátky rez</option>
                      <option value="op_mini_abdo">Miniabdominoplastika</option>
                      <option value="op_lipo_360">Lipo 360</option>
                      <option value="op_armlift">Arm lift</option>
                    </optgroup>
                    <optgroup label="Genitál, Ruka, Excízie">
                      <option value="op_labioplastika">Labioplastika</option>
                      <option value="op_karpal">Karpálny tunel</option>
                      <option value="op_dupuytren">Dupuytrenova kontraktúra</option>
                      <option value="op_excizie">Excízie</option>
                    </optgroup>
                  </select>
                </div>

                {/* Rýchle kroky pre podrobný operačný protokol */}
                {docType === 'operacny_protokol' && (
                  <div className="flex flex-wrap gap-1 text-[9px] pb-1">
                    {[
                      { label: '+ Tumescencia & Príprava', text: 'V celkovej/lokálnej anestézii vykonaná dezinfekcia operačného poľa a sterilné zarúškovanie. Vykonaná tumescenčná infiltrácia roztokom Kleinovho typu s adrenalínom.' },
                      { label: '+ Incízia & Disekcia', text: 'Vedená cielená incízia v predkreslených líniách. Disekcia tkanív ostrým a tupým spôsobom s dôslednou ochranou neurovaskulárnych štruktúr.' },
                      { label: '+ Insercia implantátu', text: 'Vytvorené presné anatomické lôžko. Po laváži antibiotickým roztokom vykonaná aseptická insercia vybraného implantátu.' },
                      { label: '+ Dôsledná hemostáza', text: 'Prevedená dôkladná elektrokoagulačná a tlaková hemostáza, kontrola suchosti lôžka.' },
                      { label: '+ Sutúra vo vrstvách', text: 'Rekonštrukcia a adaptácia tkanív vo vrstvách vstrebateľným materiálom (PDS/Monocryl), intrakutánny steh kože (Glycolon).' },
                      { label: '+ Drenáž & Bandáž', text: 'Zavedená podtlaková Redonova drenáž, priložené sterilné absorpčné krytie a kompresívna elastická bandáž.' }
                    ].map(step => (
                      <button
                        key={step.label}
                        type="button"
                        onClick={() => {
                          setNotes(prev => prev ? `${prev}\n\n${step.text}` : step.text);
                        }}
                        className="bg-white hover:bg-[#FAF8F5] border border-[#E8E2D9] text-[#2C2A29] px-2 py-0.5 rounded text-[9px] transition-colors cursor-pointer"
                      >
                        {step.label}
                      </button>
                    ))}
                  </div>
                )}

                <textarea 
                  rows={12} 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  placeholder="Podrobný popis operačného postupu, anatomických pomerov, preparácie, implantácie, hemostázy a sutúry..." 
                  className="w-full border border-[#E8E2D9] p-3 rounded-xl text-xs bg-white text-[#2C2A29] leading-relaxed font-normal" 
                />
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-[#C5A059] hover:bg-[#b08d48] text-white font-medium py-3 px-6 rounded-xl transition-colors text-xs uppercase tracking-wider disabled:opacity-50 print:hidden cursor-pointer shadow-sm">
              {loading ? 'Spracovávam...' : '💾 Uložiť záznam do systému'}
            </button>
          </form>

          {result && (
            <div className={`p-3 rounded-xl text-xs border print:hidden ${result.success ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
              <p className="font-semibold">{result.message}</p>
            </div>
          )}
        </div>

        {/* ======================================================= */}
        {/* PRAVÁ ČASŤ - NÁHĽAD (Tlačený dokument)                  */}
        {/* ======================================================= */}
        <div className="lg:col-span-6 bg-[#FBF9F6] p-8 rounded-2xl border border-[#E8E2D9] shadow-sm flex flex-col print:p-0 print:border-none print:shadow-none print:bg-white print:block">
          
          <div className="flex justify-between items-center mb-4 print:hidden gap-3">
             <h3 className="text-[10px] font-bold text-[#8C857B] uppercase tracking-widest">Náhľad dokumentu</h3>
             <div className="flex items-center gap-2">
               <button 
                 type="button"
                 onClick={handleDownloadPdf} 
                 disabled={generatingPdf}
                 className="bg-[#C5A059] hover:bg-[#b08d48] text-white text-[11px] font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
               >
                 {generatingPdf ? (
                   <>
                     <span className="inline-block animate-spin">⏳</span> Generujem...
                   </>
                 ) : (
                   <>
                     <span>📄</span> Stiahnuť PDF
                   </>
                 )}
               </button>
               <button 
                 type="button"
                 onClick={handlePrint} 
                 className="bg-[#2C2A29] hover:bg-black text-white text-[11px] font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition-colors shadow-sm cursor-pointer"
               >
                 🖨️ Tlačiť
               </button>
             </div>
          </div>

          {/* TLAČOVÝ A4 DOKUMENT */}
          <div id="printable-a4" ref={printRef} className="bg-white border border-[#E8E2D9] p-10 shadow-sm text-xs leading-relaxed w-full max-w-[595px] mx-auto print:border-none print:shadow-none print:p-0 print:max-w-none print:w-full" style={{ minHeight: '842px' }}>
            
            {/* --- Hlavička všeobecná s logom SAY BY MRAZ (Skrytá pri Dohode o cene a Informovanom súhlase s operáciou) --- */}
            {docType !== 'dohoda_o_cene' && docType !== 'suhlas_operacia' && (
              <>
                <div className="border-b-2 border-[#C5A059] pb-5 mb-6 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <img 
                      src="/logo.png" 
                      alt="SAY BY MRAZ" 
                      className="h-20 w-auto object-contain" 
                    />
                    <div className="border-l border-[#E8E2D9] pl-3.5 text-[9px] text-[#8C857B] leading-tight">
                      <p className="uppercase tracking-[0.15em] text-[#C5A059] font-bold">PLASTICKÁ CHIRURGIA & DERMATOLÓGIA</p>
                      <p className="mt-1">Lazovná 43, 974 01 Banská Bystrica</p>
                      <p className="mt-0.5 font-medium text-[#2C2A29]">www.sayclinic.sk</p>
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-[#8C857B]">
                    <span className="bg-[#2C2A29] text-white px-3 py-1.5 rounded text-[9px] uppercase tracking-wider font-bold shadow-sm inline-block">
                      {DOC_TITLES[docType]}
                    </span>
                    <p className="font-bold text-[#2C2A29] mt-2.5 text-xs">{doctor}</p>
                    <p className="mt-0.5">Dátum: {new Date().toLocaleDateString('sk-SK')}</p>
                  </div>
                </div>

                <div className="bg-[#FBF9F6] p-4 rounded-xl mb-6 border border-[#E8E2D9] text-xs space-y-2">
                  <p><strong className="text-[#8C857B] uppercase text-[9px] tracking-wider">Pacient / Klient:</strong> <span className="text-sm font-bold ml-2">{patientName || '---'}</span></p>
                  <p><strong className="text-[#8C857B] uppercase text-[9px] tracking-wider">Rodné číslo:</strong> <span className="ml-2 font-mono">{birthNumber || '---'}</span></p>
                  <p><strong className="text-[#8C857B] uppercase text-[9px] tracking-wider">Diagnóza:</strong> <span className="ml-2">{diagnosis}</span></p>
                  {!showPricing && !showAnesthesiaQ && !showVV && !showCheckup && manualProcedure && (
                    <p><strong className="text-[#8C857B] uppercase text-[9px] tracking-wider">Zákrok:</strong> <span className="ml-2 font-bold">{manualProcedure}</span></p>
                  )}
                </div>
              </>
            )}

            {/* DYNAMICKÝ OBSAH PODĽA TYPU */}
            
            {/* --- 0. Vstupné vyšetrenie --- */}
            {showVV && (
              <div className="space-y-6 mb-8">
                <div>
                  <p className="font-bold text-[10px] uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-1 mb-2">Podrobný popis plánovaného výkonu:</p>
                  <p className="text-sm font-semibold">{vvPlan || '---'}</p>
                  <p className="text-xs mt-2"><strong className="text-[#8C857B] uppercase text-[9px] tracking-wider mr-2">Termín zákroku:</strong> {vvDate ? new Date(vvDate).toLocaleDateString('sk-SK') : 'Neurčený'}</p>
                </div>

                <div className="grid grid-cols-3 gap-4 border border-[#E8E2D9] rounded-xl p-3 bg-[#FBF9F6] text-xs">
                  <div><span className="block text-[9px] text-[#8C857B] uppercase font-bold">Druh anestézie</span>{anesthesiaType}</div>
                  <div><span className="block text-[9px] text-[#8C857B] uppercase font-bold">Dĺžka anestézie</span>{anesthesiaType === 'Lokálna' ? '---' : `${anesthesiaHours} hod`}</div>
                  <div>
                    <span className="block text-[9px] text-[#8C857B] uppercase font-bold">Hospitalizácia</span>
                    {hospitalizationType === 'none' ? 'Ambulantne' : hospitalizationType === 'half' ? '1/2 dňa (dospanie)' : '1 deň (do ďalšieho dňa)'}
                  </div>
                </div>

                <div>
                  <p className="font-bold text-[10px] uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-1 mb-2">Anamnéza:</p>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs">
                    <div><strong>Vek:</strong> {vvVek}</div><div><strong>AA:</strong> {vvAA || 'neudáva žiadne'}</div>
                    <div><strong>Výška:</strong> {vvVyska ? `${vvVyska} cm` : ''}</div><div><strong>OA:</strong> {vvOA || 'neudáva žiadne'}</div>
                    <div><strong>Váha:</strong> {vvVaha ? `${vvVaha} kg` : ''}</div><div><strong>LA:</strong> {vvLA || 'neudáva žiadne'}</div>
                    <div><strong>BMI:</strong> {calcBMI()}</div><div><strong>GA:</strong> {vvGA || 'neudáva žiadne'}</div>
                  </div>
                </div>

                {vvCave && (
                  <div>
                    <p className="font-bold text-[10px] uppercase text-rose-600 border-b border-rose-200 pb-1 mb-1">CAVE:</p>
                    <p className="text-rose-800 font-bold">{vvCave}</p>
                  </div>
                )}

                <div>
                  <p className="font-bold text-[10px] uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-1 mb-2">Status Localis (SPL):</p>
                  <p className="whitespace-pre-line">{vvSPL || '---'}</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="font-bold text-[10px] uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-1 mb-2">Predoperačné vyšetrenia:</p>
                    {vvExams.length > 0 ? (
                      <ul className="list-disc pl-4 text-xs space-y-1">
                        {vvExams.map(ex => (
                          <li key={ex}>{ex === 'Iné' ? `Iné: ${vvExamsOther}` : ex}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[#8C857B] italic">Žiadne</p>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="font-bold text-[10px] uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-1 mb-2">Implantáty:</p>
                      {vvImplants.some(impl => impl.vyrobca || impl.kat || impl.objem) ? (
                         vvImplants.map((impl, idx) => (
                          <div key={idx} className="mb-2">
                            <p className="text-xs"><strong>Výrobca:</strong> {impl.vyrobca || '---'}</p>
                            <p className="text-xs"><strong>Kat. č.:</strong> {impl.kat || '---'} | <strong>Objem:</strong> {impl.objem || '---'}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-[#8C857B]">Nevyžaduje sa</p>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-[10px] uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-1 mb-1">Materiál:</p>
                      <p className="text-xs">{vvMaterial || '---'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- 1. KONTROLNÉ VYŠETRENIE (S DETAILOM O OPERÁCII A DÁTUME) --- */}
            {showCheckup && (
              <div className="space-y-5 mb-8 text-justify leading-relaxed">
                
                {/* Dvojfarebný luxusný banner o operácii a dobe po výkone */}
                <div className="bg-[#FBF9F6] border-2 border-[#C5A059]/40 rounded-xl p-4 space-y-2 shadow-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-[#8C857B] block tracking-wider">Podstúpená operácia:</span>
                      <span className="text-sm font-bold text-[#2C2A29]">{checkupData.operationName || 'Chirurgický zákrok'}</span>
                    </div>
                    <span className="text-[9px] font-bold bg-[#2C2A29] text-white px-2.5 py-1 rounded tracking-wider uppercase">
                      Hojenie p.p.i.
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E8E2D9] text-xs">
                    <div>
                      <span className="text-[9px] text-[#8C857B] uppercase font-bold mr-1">Dátum operácie:</span>
                      <span className="font-mono font-bold text-[#2C2A29]">{checkupData.operationDate ? new Date(checkupData.operationDate).toLocaleDateString('sk-SK') : '---'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-[#8C857B] uppercase font-bold mr-1">Fáza kontroly:</span>
                      <span className="font-bold text-[#C5A059]">{checkupData.timeframe}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="font-bold text-[10px] uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-1 mb-2">I. Subjektívny stav pacienta (Anamnéza)</p>
                  <p className="text-xs bg-white p-3 rounded-lg border border-[#E8E2D9]/70 leading-relaxed text-[#2C2A29]">
                    {checkupData.subjective}
                  </p>
                </div>

                <div>
                  <p className="font-bold text-[10px] uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-1 mb-2">II. Objektívny nález (Status Localis post operationem)</p>
                  <p className="text-xs bg-white p-3 rounded-lg border border-[#E8E2D9]/70 leading-relaxed text-[#2C2A29]">
                    {checkupData.objective}
                  </p>
                </div>

                <div>
                  <p className="font-bold text-[10px] uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-1 mb-2">III. Odporúčania a pooperačná starostlivosť</p>
                  <div className="bg-[#FBF9F6] p-4 rounded-xl border border-[#E8E2D9] space-y-1.5 text-xs text-[#2C2A29]">
                    <div className="whitespace-pre-line font-medium leading-relaxed">
                      • {checkupData.recommendations}
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-xl text-xs text-amber-950 flex justify-between items-center">
                  <div>
                    <span className="font-bold block text-[10px] uppercase tracking-wider text-amber-800">Plánovaná ďalšia kontrola:</span>
                    <span className="font-bold text-sm text-[#2C2A29]">{checkupData.nextCheckup}</span>
                  </div>
                  <span className="text-[10px] text-amber-800 italic">Termín na www.sayclinic.sk</span>
                </div>
              </div>
            )}

            {/* --- 2. Cenová ponuka --- */}
            {docType === 'cenova_ponuka' && (
              <div className="space-y-4 mb-8">
                <p className="font-bold text-[10px] uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-1">Rozpis výkonov a služieb:</p>
                <ul className="divide-y divide-[#E8E2D9]">
                  {selectedItems.map((item) => (
                    <li key={item.id} className="py-2 flex justify-between items-center text-xs">
                      <span className="font-medium">{item.name}</span><span className="font-bold">{item.price.toFixed(2)} €</span>
                    </li>
                  ))}
                  {isPaidAnesthesia && (
                    <li className="py-2 flex justify-between text-xs">
                      <span className="font-medium">{anesthesiaType} anestézia ({anesthesiaHours} hod. × 130 €)</span>
                      <span className="font-bold">{anesthesiaPrice.toFixed(2)} €</span>
                    </li>
                  )}
                  {hospitalizationType !== 'none' && (
                    <li className="py-2 flex justify-between text-xs">
                      <span className="font-medium">
                        {hospitalizationType === 'half' ? 'Hospitalizácia - dospanie v ten istý deň (1/2 dňa)' : 'Hospitalizácia do ďalšieho dňa (1 deň)'}
                      </span>
                      <span className="font-bold">{hospitalizationPrice.toFixed(2)} €</span>
                    </li>
                  )}
                </ul>
                <div className="flex justify-between items-center bg-[#FBF9F6] p-4 rounded-xl border border-[#C5A059] font-bold text-sm">
                  <span className="uppercase tracking-wider text-[10px] text-[#8C857B]">Celková suma:</span>
                  <span className="text-lg text-[#C5A059]">{totalPrice.toFixed(2)} €</span>
                </div>

                {/* DODATOK PRE CENOVÚ PONUKU */}
                <div className="pt-4 space-y-4">
                  <table className="w-full text-xs text-right border-t border-[#E8E2D9] pt-4">
                    <tbody>
                      <tr>
                        <td className="text-left py-1 text-[#8C857B]">Zálohová faktúra: (30% celkovej ceny výkonu)</td>
                        <td className="font-bold text-[#2C2A29] w-1/4">{(totalPrice * 0.3).toFixed(2)} €</td>
                      </tr>
                      <tr>
                        <td className="text-left py-1 text-[#8C857B]">Doplatok: (po operácii v hotovosti alebo na definitívnu faktúru)</td>
                        <td className="font-bold text-[#C5A059] w-1/4">{(totalPrice * 0.7).toFixed(2)} €</td>
                      </tr>
                    </tbody>
                  </table>
                  
                  <div className="text-[9px] text-[#8C857B] space-y-2 text-justify leading-tight">
                    <p>Záloha je splatná do 7 dní od prijatia faktúry. V prípade neuhradenia faktúry bude rezervovaný termín zrušený.</p>
                    <p>Trvanie zákroku je len časový predpoklad. Celková cena zákroku môže byť navýšená o 130€ za každú začatú hodinu anestézie navyše, prípadne o 200€ za noc na klinike navyše. Ak by z technických alebo bezpečnostných príčin nebolo možné niektorú z položiek vykonať, bude cena o danú položku ponížená a rozdiel vrátený.</p>
                  </div>
                </div>
              </div>
            )}

            {/* --- 3. Dohoda o cene a platobných podmienkach pre plánovanú estetickú zdravotnú starostlivosť --- */}
            {docType === 'dohoda_o_cene' && (
              <div className="text-[10px] leading-relaxed space-y-4 text-[#2C2A29]">
                {/* Hlavička s Logom */}
                <div className="flex items-center justify-between border-b-2 border-[#C5A059] pb-3 mb-3">
                  <div className="flex items-center gap-4">
                    <img src="/logo.png" alt="SAY BY MRAZ" className="h-14 w-auto object-contain" />
                    <div className="border-l border-[#E8E2D9] pl-3 text-[9px] text-[#8C857B] leading-tight">
                      <p className="text-[#C5A059] font-bold tracking-widest uppercase">PLASTICKÁ CHIRURGIA & DERMATOLÓGIA</p>
                      <p className="mt-0.5">Muškátová 15652/37, 974 01 Banská Bystrica | Lazovná 43</p>
                      <p className="mt-0.5 font-medium text-[#2C2A29]">www.sayclinic.sk</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] bg-[#2C2A29] text-white px-2.5 py-1 rounded font-bold uppercase tracking-wider block mb-1">
                      Zmluvný dokument
                    </span>
                    <span className="text-[9px] text-[#8C857B] font-mono">
                      Dátum: {formatSlovakDateLong(agreementDate)}
                    </span>
                  </div>
                </div>

                {/* Názov zmluvy */}
                <div className="text-center space-y-1 mb-4">
                  <h1 className="text-sm sm:text-base font-bold uppercase tracking-wider text-[#2C2A29]">
                    DOHODA O CENE A PLATOBNÝCH PODMIENKACH PRE PLÁNOVANÚ ESTETICKÚ ZDRAVOTNÚ STAROSTLIVOSŤ
                  </h1>
                  <p className="text-[8.5px] text-[#8C857B] text-justify leading-tight max-w-[95%] mx-auto">
                    uzatvorená podľa ustanovení § 51 a § 588 a nasl. zákona č. 40/1964 Zb. Občiansky zákonník v platnom znení, zákona č. 18/1996 Z. z. o cenách v platnom znení, zákona č. 576/2004 Z. z. o zdravotnej starostlivosti, službách súvisiacich s poskytovaním zdravotnej starostlivosti a o zmene a doplnení niektorých zákonov v platnom znení a zákona č. 108/2024 Z. z. o ochrane spotrebiteľa a o zmene a doplnení niektorých zákonov (ďalej len „Dohoda“)
                  </p>
                </div>

                {/* ČLÁNOK I: ZMLUVNÉ STRANY */}
                <div className="space-y-2">
                  <h3 className="font-bold text-xs uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-0.5">
                    Článok I<br /><span className="text-[10px] text-[#2C2A29]">Zmluvné strany</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-3 bg-[#FBF9F6] p-3 rounded-xl border border-[#E8E2D9] text-[9.5px]">
                    <div className="space-y-1">
                      <p className="font-bold uppercase tracking-wider text-[#C5A059] border-b border-[#E8E2D9] pb-0.5 mb-1 text-[9px]">
                        Poskytovateľ zdravotnej starostlivosti:
                      </p>
                      <p><strong>Obchodné meno:</strong> DOKTOR MRÁZ s.r.o.</p>
                      <p><strong>Sídlo:</strong> Muškátová 15652/37, 974 01 Banská Bystrica</p>
                      <p><strong>IČO:</strong> 54 918 375 | <strong>DIČ:</strong> 2121822901</p>
                      <p><strong>Zápis v registri:</strong> Obchodný register Okresného súdu Banská Bystrica, oddiel: Sro, vložka č. 44785/S</p>
                      <p><strong>Štatutárny orgán:</strong> MUDr. Ján Mráz, konateľ</p>
                      <p><strong>E-mail:</strong> say@sayclinic.sk</p>
                      <p><strong>E-mail pre koordináciu:</strong> koordinator@sayclinic.sk</p>
                      <p><strong>Bankové spojenie:</strong> {bankName}</p>
                      <p className="font-mono text-[9px]"><strong>IBAN:</strong> {bankIban}</p>
                      <p className="italic text-[#8C857B] text-[8.5px] pt-0.5">(ďalej len „Poskytovateľ“)</p>
                    </div>

                    <div className="space-y-1 border-l border-[#E8E2D9] pl-3">
                      <p className="font-bold uppercase tracking-wider text-[#C5A059] border-b border-[#E8E2D9] pb-0.5 mb-1 text-[9px]">
                        Pacient:
                      </p>
                      <p><strong>Meno a priezvisko:</strong> <span className="font-bold text-[#2C2A29]">{patientName || '---'}</span></p>
                      <p><strong>Dátum narodenia:</strong> {patientBirthDate || calculateBirthDateFromRC(birthNumber) || '---'}</p>
                      <p><strong>Rodné číslo:</strong> <span className="font-mono font-bold">{birthNumber || '---'}</span></p>
                      <p><strong>Trvalý pobyt:</strong> {patientAddress || '---'}</p>
                      <p><strong>Štátne občianstvo:</strong> {patientCitizenship || 'Slovenská republika'}</p>
                      <p><strong>Telefónny kontakt:</strong> {patientPhone || '---'}</p>
                      <p><strong>E-mail:</strong> {patientEmail || '---'}</p>
                      <p className="italic text-[#8C857B] text-[8.5px] pt-0.5">(ďalej len „Pacient“)</p>
                    </div>
                  </div>

                  <p className="text-center italic text-[8.5px] text-[#8C857B]">
                    (Poskytovateľ a Pacient ďalej spolu len „Zmluvné strany“ alebo jednotlivo „Zmluvná strana“)
                  </p>
                </div>

                {/* ČLÁNOK II: PREDMET DOHODY A ŠPECIFIKÁCIA ZDRAVOTNEJ STAROSTLIVOSTI */}
                <div className="space-y-2">
                  <h3 className="font-bold text-xs uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-0.5">
                    Článok II<br /><span className="text-[10px] text-[#2C2A29]">Predmet Dohody a špecifikácia zdravotnej starostlivosti</span>
                  </h3>

                  <p className="text-justify">
                    <strong>1.</strong> Predmetom tejto Dohody je záväzné dojednanie celkovej ceny, platobných podmienok, storno podmienok a súvisiacich organizačných pravidiel pri poskytnutí priamo hradenej plánovanej estetickej zdravotnej starostlivosti (zdravotných výkonov nehradených z verejného zdravotného poistenia) Poskytovateľom pre Pacienta. Zmluvné strany výslovne potvrdzujú, že plánovaný zdravotný výkon špecifikovaný v odseku 2 tohto článku nepatrí do rozsahu zdravotnej starostlivosti hradenej z verejného zdravotného poistenia a je poskytovaný ako priamo hradená služba na základe dohody Zmluvných strán v zmysle zákona č. 576/2004 Z. z. o zdravotnej starostlivosti v platnom znení.
                  </p>

                  <div className="bg-[#FBF9F6] p-3 rounded-xl border border-[#E8E2D9] space-y-1.5 text-[9.5px]">
                    <p className="font-bold text-[9px] uppercase tracking-wider text-[#C5A059] border-b border-[#E8E2D9] pb-0.5">
                      2. Špecifikácia plánovanej zdravotnej starostlivosti:
                    </p>
                    <p>
                      <strong>a) Názov plánovaného zdravotného výkonu / zákroku:</strong>{' '}
                      <span className="font-bold text-[#2C2A29]">
                        {selectedItems.length > 0 ? selectedItems.map(i => i.name).join(' + ') : manualProcedure || vvPlan || 'Estetický chirurgický zákrok'}
                      </span>
                    </p>
                    <p>
                      <strong>b) Plánovaný termín vykonania zákroku:</strong>{' '}
                      <span className="font-bold text-[#2C2A29]">{formatSlovakDateLong(agreementSurgeryDate)}</span> o <span className="font-bold">{agreementSurgeryTime}</span> hod.
                    </p>
                    <p>
                      <strong>c) Forma anestézie a rozsah pobytu / hospitalizácie:</strong>{' '}
                      <span className="font-medium text-[#2C2A29]">
                        {anesthesiaType === 'Lokálna' ? 'Lokálna anestézia' : `${anesthesiaType} anestézia (${anesthesiaHours} hod.)`}
                      </span>{' '}
                      a{' '}
                      <span className="font-medium text-[#2C2A29]">
                        {hospitalizationType === 'none' ? 'Ambulantný zákrok' : hospitalizationType === 'half' ? 'Jednodňová zdravotná starostlivosť s dospaním v ten istý deň (1/2 dňa)' : 'Jednodňová zdravotná starostlivosť s pobytom na 1 noc'}
                      </span>
                    </p>
                  </div>

                  <p className="text-justify">
                    <strong>3.</strong> Zmluvné strany berú na vedomie, že táto Dohoda upravuje výlučne finančné, platobné a organizačné podmienky poskytnutia zdravotnej starostlivosti. Informovaný súhlas, podrobné medicínske poučenie, spracúvanie osobných údajov a prípadný súhlas s vyhotovením fotodokumentácie sú predmetom samostatných právnych dokumentov a administratívnych úkonov.
                  </p>

                  <p className="text-justify">
                    <strong>4.</strong> Poskytovateľ potvrdzuje a Pacient svojím podpisom potvrdzuje, že Pacient mal pred podpisom tejto Dohody plnú príležitosť oboznámiť sa s aktuálnym cenníkom Poskytovateľa a že dohodnutá cena je v súlade s platným cenníkom Poskytovateľa.
                  </p>
                </div>

                {/* ČLÁNOK III: CENA A PLATOBNÉ PODMIENKY */}
                <div className="space-y-2">
                  <h3 className="font-bold text-xs uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-0.5">
                    Článok III<br /><span className="text-[10px] text-[#2C2A29]">Cena a platobné podmienky</span>
                  </h3>

                  <p className="text-justify">
                    <strong>1.</strong> Celková dohodnutá cena za plánovanú estetickú zdravotnú starostlivosť špecifikovanú v Článku II ods. 2 tejto Dohody je stanovená dohodou Zmluvných strán v súlade so zákonom č. 18/1996 Z. z. o cenách vo výške:
                  </p>

                  <div className="bg-[#FBF9F6] p-3.5 rounded-xl border border-[#E8E2D9] space-y-2">
                    <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-[#C5A059]">
                      <div>
                        <span className="text-[9px] uppercase text-[#8C857B] font-bold block">Celková dohodnutá cena:</span>
                        <span className="text-base font-bold text-[#C5A059]">{totalPrice.toFixed(2)} EUR</span>
                      </div>
                      <div className="text-right text-[10px] text-[#2C2A29]">
                        <span className="italic">(slovom: <strong>{numberToSlovakWords(Math.round(totalPrice))} eur</strong>)</span>
                      </div>
                    </div>

                    {/* Prehľadný rozpis položiek */}
                    <div className="space-y-1 pt-1">
                      <p className="font-bold text-[9px] uppercase tracking-wider text-[#8C857B]">Rozpis kalkulácie ceny:</p>
                      <ul className="divide-y divide-[#E8E2D9]/70 text-[9.5px]">
                        {selectedItems.map((item) => (
                          <li key={item.id} className="py-1 flex justify-between items-center">
                            <span>{item.name}</span>
                            <span className="font-bold">{item.price.toFixed(2)} €</span>
                          </li>
                        ))}
                        {isPaidAnesthesia && (
                          <li className="py-1 flex justify-between items-center">
                            <span>{anesthesiaType} anestézia ({anesthesiaHours} hod. × 130 €)</span>
                            <span className="font-bold">{anesthesiaPrice.toFixed(2)} €</span>
                          </li>
                        )}
                        {hospitalizationType !== 'none' && (
                          <li className="py-1 flex justify-between items-center">
                            <span>
                              {hospitalizationType === 'half' ? 'Hospitalizácia - dospanie v ten istý deň (1/2 dňa)' : 'Hospitalizácia do ďalšieho dňa (1 deň)'}
                            </span>
                            <span className="font-bold">{hospitalizationPrice.toFixed(2)} €</span>
                          </li>
                        )}
                      </ul>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E8E2D9] text-center text-[9px]">
                      <div className="bg-white p-2 rounded-lg border border-[#E8E2D9]">
                        <span className="block text-[8px] uppercase text-[#8C857B] font-bold">Dohodnutá záloha</span>
                        <span className="text-xs font-bold text-[#2C2A29]">{depositPaid.toFixed(2)} EUR</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-[#E8E2D9]">
                        <span className="block text-[8px] uppercase text-[#8C857B] font-bold">Doplatok ceny</span>
                        <span className="text-xs font-bold text-[#C5A059]">{remainingPrice.toFixed(2)} EUR</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-justify">
                    <p><strong>2. Štruktúra a splatnosť dohodnutej ceny:</strong></p>
                    <p className="pl-2">
                      <strong>a) Záloha:</strong> Pacient sa zaväzuje zaplatiť Poskytovateľovi zálohu na rezerváciu operačného termínu, personálnych a materiálno-technických kapacít vo výške <strong>{depositPaid.toFixed(2)} EUR</strong> (slovom: {numberToSlovakWords(Math.round(depositPaid))} eur). Záloha je splatná do <strong>{depositDueDays} pracovných dní</strong> odo dňa podpisu tejto Dohody, a to bezhotovostným prevodom na bankový účet Poskytovateľa uvedený v Článku I ods. 1 tejto Dohody alebo v hotovosti / platobnou kartou na recepcii Poskytovateľa. Pacient je povinný pri bezhotovostnej úhrade zálohy uviesť variabilný symbol: <strong>{customVariableSymbol || (birthNumber ? birthNumber.replace(/\D/g, '') : '---')}</strong>. Zmluvné strany berú na vedomie, že bez uvedenia správneho variabilného symbolu nemusí byť záloha správne a včas priradená k pacientovmu spisu a záväzná rezervácia termínu zákroku vzniká až riadnym pripísaním celej sumy zálohy na účet Poskytovateľa.
                    </p>
                    <p className="pl-2">
                      <strong>b) Doplatok ceny:</strong> Zostávajúcu časť celkovej ceny vo výške <strong>{remainingPrice.toFixed(2)} EUR</strong> (slovom: {numberToSlovakWords(Math.round(remainingPrice))} eur) sa Pacient zaväzuje uhradiť najneskôr v deň plánovaného zákroku pred jeho samotným vykonaním (v hotovosti alebo platobnou kartou na recepcii Poskytovateľa), alebo na základe vopred vystavenej zálohovej faktúry / faktúry Poskytovateľa tak, aby bol doplatok pripísaný na bankový účet Poskytovateľa najneskôr v deň konania zákroku.
                    </p>
                  </div>

                  <div className="space-y-1 text-justify">
                    <p><strong>3. Príplatky za nepredvídané a dodatočné zdravotné služby:</strong></p>
                    <p className="text-[9px] text-[#8C857B]">
                      Zmluvné strany sa výslovne dohodli na nasledujúcich sadzbách príplatkov pre prípad, že si priebeh výkonu alebo pooperačný stav Pacienta vyžiada dodatočné medicínske alebo ošetrovateľské kapacity nad rámec pôvodného plánu:
                    </p>
                    <div className="bg-[#FBF9F6] p-2.5 rounded-lg border border-[#E8E2D9] space-y-1 text-[9px]">
                      <p>
                        <strong>a) Príplatok za anestéziu nad plánovaný rozsah:</strong> Ak si zdravotný stav Pacienta alebo priebeh výkonu vyžiada predĺženie podávania anestézie nad pôvodne plánovaný a v cene zahrnutý časový rozsah, Pacient sa zaväzuje uhradiť príplatok vo výške <strong>130,00 EUR</strong> (slovom: jednostotridsať eur) za každú aj začatú hodinu anestézie nad pôvodný plán.
                      </p>
                      <p>
                        <strong>b) Príplatok za dodatočnú hospitalizáciu:</strong> Ak si pooperačný stav, zdravotná indikácia alebo požiadavka Pacienta vyžiada predĺženie pobytu v zdravotníckom zariadení Poskytovateľa, Pacient sa zaväzuje uhradiť príplatok vo výške <strong>200,00 EUR</strong> (slovom: dvesto eur) za každú dodatočnú noc hospitalizácie / pobytu na lôžku.
                      </p>
                      <p>
                        <strong>c)</strong> Príplatky podľa písm. a) a b) tohto odseku vyúčtuje Poskytovateľ Pacientovi pri prepustení zo zdravotníckeho zariadenia konečnou faktúrou / vyúčtovaním, pričom Pacient je povinný tieto príplatky uhradiť pri prepustení, ak sa Zmluvné strany písomne nedohodnú inak.
                      </p>
                    </div>
                  </div>
                </div>

                {/* ČLÁNOK IV: PREDOPERAČNÉ VYŠETRENIA */}
                <div className="space-y-1.5 text-justify">
                  <h3 className="font-bold text-xs uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-0.5">
                    Článok IV<br /><span className="text-[10px] text-[#2C2A29]">Predoperačné vyšetrenia</span>
                  </h3>
                  <p>
                    <strong>1.</strong> Pacient je povinný na vlastné náklady zabezpečiť kompletné predoperačné vyšetrenia v rozsahu určenom Poskytovateľom s ohľadom na zvolený typ anestézie a rozsah zákroku.
                  </p>
                  <p>
                    <strong>2.</strong> Pacient sa zaväzuje doručiť všetky výsledky predoperačných vyšetrení v elektronickej podobe na e-mailovú adresu koordinátora Poskytovateľa: <strong>koordinator@sayclinic.sk</strong>, a to najneskôr <strong>1 týždeň (7 kalendárnych dní)</strong> pred plánovaným termínom zákroku. Originály alebo overené kópie výsledkov predoperačných vyšetrení je Pacient povinný odovzdať Poskytovateľovi pri nástupe na zákrok v deň jeho konania.
                  </p>
                  <p>
                    <strong>3.</strong> Poskytovateľ si vyhradzuje právo zákrok v plánovanom termíne neuskutočniť, ak Pacient nedoručí výsledky predoperačných vyšetrení v stanovenej lehote, alebo ak predložené predoperačné vyšetrenia nebudú spĺňať medicínske štandardy potrebné na bezpečné vykonanie anestézie či výkonu. V takomto prípade sa neuskutočnenie zákroku považuje za zrušenie termínu z dôvodu na strane Pacienta a uplatňujú sa storno podmienky podľa Článku V tejto Dohody.
                  </p>
                </div>

                {/* ČLÁNOK V: ZMENA TERMÍNU, STORNO PODMIENKY A ODSTÚPENIE OD DOHODY */}
                <div className="space-y-2 text-justify">
                  <h3 className="font-bold text-xs uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-0.5">
                    Článok V<br /><span className="text-[10px] text-[#2C2A29]">Zmena termínu, storno podmienky a odstúpenie od Dohody</span>
                  </h3>

                  <p>
                    <strong>1.</strong> V záujme transparentnosti, primeranosti a vyváženosti zmluvného vzťahu sa Zmluvné strany dohodli na nasledujúcich storno pravidlách pri zrušení alebo zmene termínu plánovaného zákroku zo strany Pacienta:
                  </p>
                  <div className="bg-[#FBF9F6] p-3 rounded-xl border border-[#E8E2D9] space-y-1.5 text-[9px]">
                    <p>
                      <strong>a) Zrušenie viac ako 21 kalendárnych dní pred plánovaným termínom:</strong> Pacient má právo zrušiť termín zákroku bez uvedenia dôvodu. Poskytovateľ vráti Pacientovi uhradenú zálohu v plnej výške zníženú iba o paušálny administratívny poplatok vo výške <strong>50,00 EUR</strong> na pokrytie preukázateľných administratívnych nákladov spojených s otvorením spisu a rezerváciou.
                    </p>
                    <p>
                      <strong>b) Zrušenie v lehote od 20 do 8 kalendárnych dní pred plánovaným termínom:</strong> Poskytovateľ vráti Pacientovi <strong>50 %</strong> z uhradenej zálohy; zvyšných 50 % zálohy slúži na paušálnu úhradu nákladov vzniknutých s blokovaním operačnej sály a personálu.
                    </p>
                    <p>
                      <strong>c) Zrušenie v lehote 7 kalendárnych dní a menej pred plánovaným termínom, alebo nedostavenie sa na zákrok:</strong> Poskytovateľovi vzniká nárok na storno poplatok vo výške <strong>100 %</strong> uhradenej zálohy na úhradu márne vynaložených personálnych, materiálových a prevádzkových nákladov a fixnej blokácie operačného tímu.
                    </p>
                    <p className="italic text-[#8C857B] text-[8.5px] pt-1">
                      Zmluvné strany potvrdzujú, že vyššie uvedené storno poplatky reprezentujú primerané náhrady za preukázateľnú ujmu a stratu vzniknutú Poskytovateľovi. Pacient si je vedomý práva na súdnu moderáciu pokút a náhrad podľa príslušných ustanovení Občianskeho zákonníka, ak by dohodnutá suma výrazne prevyšovala skutočne vzniknutú ujmu.
                    </p>
                  </div>

                  <p>
                    <strong>2. Osobitné ustanovenie o medicínskych kontraindikáciách:</strong> Ak dôjde k zrušeniu alebo odkladu plánovaného zákroku z dôvodu náhleho vzniku objektívne preukázaných medicínskych kontraindikácií na strane Pacienta (najmä akútne respiračné ochorenie, horúčkový stav, náhle zhoršenie celkového zdravotného stavu alebo nepriaznivé výsledky predoperačných vyšetrení vylučujúce bezpečné vykonanie zákroku či anestézie), storno poplatky podľa odseku 1 tohto článku sa neuplatnia a Poskytovateľ vráti Pacientovi uhradenú zálohu v plnej výške (100 %), prípadne sa Zmluvné strany dohodnú na bezplatnom presune termínu zákroku na iný vhodný termín po pominutí kontraindikácie. Ako medicínska kontraindikácia sa uznávajú výlučne skutočnosti bezodkladne potvrdené písomným lekárskym nálezom všeobecného alebo špecializovaného lekára a následne overené lekárom Poskytovateľa. Náklady na prípadné verifikačné vyšetrenie znáša Pacient, pokiaľ sa Zmluvné strany písomne nedohodnú inak.
                  </p>

                  <p>
                    <strong>3.</strong> Vrátenie finančných prostriedkov podľa tohto článku uskutoční Poskytovateľ bezhotovostným prevodom na bankový účet, z ktorého bola platba prijatá (alebo na účet písomne oznámený Pacientom), a to najneskôr do 14 kalendárnych dní odo dňa doručenia oznámenia o odstúpení a predloženia potrebných lekárskych potvrdení.
                  </p>

                  <p>
                    <strong>4.</strong> Pacient si je vedomý, že v prípade uzatvorenia zmluvy na diaľku alebo mimo prevádzkových priestorov Poskytovateľa má podľa zákona č. 108/2024 Z. z. o ochrane spotrebiteľa právo odstúpiť od Dohody v lehote 14 dní bez uvedenia dôvodu, pokiaľ poskytovanie zdravotnej starostlivosti nebolo s jeho výslovným súhlasom začaté pred uplynutím tejto lehoty.
                  </p>
                </div>

                {/* ČLÁNOK VI: POSUDZOVANIE KOMPLIKÁCIÍ, ESTETICKÉHO VÝSLEDKU A KONTROLNÉ VYŠETRENIA */}
                <div className="space-y-1.5 text-justify">
                  <h3 className="font-bold text-xs uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-0.5">
                    Článok VI<br /><span className="text-[10px] text-[#2C2A29]">Posudzovanie komplikácií, estetického výsledku a kontrolné vyšetrenia</span>
                  </h3>
                  <p>
                    <strong>1.</strong> Zmluvné strany berú na vedomie, že poskytovanie estetickej zdravotnej starostlivosti predstavuje poskytovanie služieb s biologickou povahou tkanív, kde konečný estetický výsledok a proces hojenia závisia od individuálnych anatomických, fyziologických a genetických vlastností organizmu Pacienta, ako aj od striktného dodržiavania pooperačného režimu Pacientom. Poskytovateľ nezodpovedá za subjektívne estetické predstavy Pacienta, ktoré nezodpovedajú reálnym anatomickým možnostiam alebo vopred dohodnutému medicínskemu plánu.
                  </p>
                  <p>
                    <strong>2.</strong> Výskyt prípadných pooperačných komplikácií a dosiahnutý estetický výsledok sa posudzujú výlučne na základe vedenej zdravotnej dokumentácie, objektívneho klinického nálezu a v súlade so štandardnými medicínskymi postupmi <em>lege artis</em> podľa zákona č. 576/2004 Z. z. o zdravotnej starostlivosti.
                  </p>
                  <p>
                    <strong>3.</strong> Pacientovi sa dôrazne odporúča pri akomkoľvek podozrení na neštandardný priebeh hojenia, vznik pooperačných komplikácií, bolesti alebo pri pochybnostiach o dosahovanom výsledku bezodkladne kontaktovať Poskytovateľa (telefonicky na kontaktných číslach kliniky alebo e-mailom na <strong>koordinator@sayclinic.sk</strong>) a bez zbytočného odkladu sa osobne dostaviť na kontrolné vyšetrenie u ošetrujúceho lekára. Včasná osobná kontrola je kľúčovým predpokladom úspešného manažmentu akýchkoľvek hojacich procesov a prevencie trvalých nežiaducich následkov.
                  </p>
                </div>

                {/* ČLÁNOK VII: PRÁVA PACIENTA, OCHRANA DOBREJ POVESTI A ZODPOVEDNOSŤ ZA TVRDENIA */}
                <div className="space-y-1.5 text-justify">
                  <h3 className="font-bold text-xs uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-0.5">
                    Článok VII<br /><span className="text-[10px] text-[#2C2A29]">Práva Pacienta, ochrana dobrej povesti a zodpovednosť za tvrdenia</span>
                  </h3>
                  <p>
                    <strong>1.</strong> Táto Dohoda žiadnym spôsobom neobmedzuje ani nevylučuje zákonné práva Pacienta na ochranu zdravia, riadne prešetrenie poskytnutej zdravotnej starostlivosti a právnu ochranu. Pacient má plné a nespochybniteľné právo:
                  </p>
                  <div className="pl-4 space-y-0.5 text-[9px]">
                    <p><strong>a)</strong> podať podnet na prešetrenie správnosti poskytnutej zdravotnej starostlivosti Úradu pre dohľad nad zdravotnou starostlivosťou (ÚDZS) podľa zákona č. 581/2004 Z. z. o zdravotných poisťovniach, dohľade nad zdravotnou starostlivosťou v platnom znení,</p>
                    <p><strong>b)</strong> uplatniť svoje nároky a domáhať sa ochrany svojich práv na vecne a miestne príslušnom všeobecnom súde Slovenskej republiky,</p>
                    <p><strong>c)</strong> verejne a slobodne opísať svoju vlastnú autentickú a pravdivú skúsenosť s poskytnutou starostlivosťou a službami Poskytovateľa.</p>
                  </div>
                  <p>
                    <strong>2.</strong> Zmluvné strany sa navzájom zaväzujú vystupovať vo vzájomných vzťahoch a na verejnosti korektne. Zmluvné strany výslovne potvrdzujú, že každá Zmluvná strana nesie plnú právnu zodpovednosť za akékoľvek vedome nepravdivé, skresľujúce, difamačné alebo neoprávnene poškodzujúce skutkové tvrdenia, ktoré by neoprávnene zasiahli do dobrej povesti právnickej osoby Poskytovateľa podľa § 19b Občianskeho zákonníka alebo do osobnostných práv a cti zdravotníckych pracovníkov či Pacienta podľa § 11 a nasl. Občianskeho zákonníka, vrátane zodpovednosti za vzniknutú majetkovú a nemajetkovú ujmu. Za porušenie tejto doložky sa nepovažujú pravdivé opisy vlastnej autentickej skúsenosti Pacienta, ani vecná a korektná kritika poskytnutej starostlivosti. Povinnosťou Zmluvných strán je zdržiavať sa nepravdivých tvrdení, ktoré sú fakticky overiteľné a ktorých cieľom je úmyselne poškodiť reputáciu druhej strany.
                  </p>
                </div>

                {/* ČLÁNOK VIII: ZÁVEREČNÉ USTANOVENIA */}
                <div className="space-y-1.5 text-justify">
                  <h3 className="font-bold text-xs uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-0.5">
                    Článok VIII<br /><span className="text-[10px] text-[#2C2A29]">Záverečné ustanovenia</span>
                  </h3>
                  <p><strong>1.</strong> Táto Dohoda nadobúda platnosť a účinnosť dňom jej podpisu oboma Zmluvnými stranami.</p>
                  <p><strong>2.</strong> Právne vzťahy touto Dohodou výslovne neupravené sa spravujú príslušnými ustanoveniami Občianskeho zákonníka, zákona č. 18/1996 Z. z. o cenách, zákona č. 576/2004 Z. z. o zdravotnej starostlivosti, zákona č. 108/2024 Z. z. o ochrane spotrebiteľa a ďalšími všeobecne záväznými právnymi predpismi Slovenskej republiky.</p>
                  <p><strong>3.</strong> Akékoľvek zmeny alebo doplnenia tejto Dohody je možné vykonať výlučne vo forme písomných, vzostupne číslovaných dodatkov podpísaných oboma Zmluvnými stranami.</p>
                  <p><strong>4.</strong> Zmluvné strany vyhlasujú, že si text tejto Dohody pred jej podpisom riadne prečítali, jej obsahu v celom rozsahu porozumeli, text vyjadruje ich slobodnú, vážnu, určitú a zrozumiteľnú vôľu a Dohodu neuzatvárajú v tiesni ani za nápadne nevýhodných podmienok, na dôkaz čoho pripájajú svoje vlastnoručné podpisy.</p>
                  <p><strong>5.</strong> Táto Dohoda je vyhotovená v dvoch (2) rovnopisoch s platnosťou originálu, z ktorých každá Zmluvná strana obdrží po jednom (1) vyhotovení.</p>
                </div>

                {/* PODPISOVÁ DOLOŽKA */}
                <div className="border-t-2 border-[#C5A059] pt-4 mt-6 space-y-4">
                  <p className="text-[10px]">
                    V Banskej Bystrici, dňa: <span className="font-bold font-mono">{formatSlovakDateLong(agreementDate)}</span>
                  </p>

                  <div className="grid grid-cols-2 gap-8 pt-4">
                    <div className="text-center space-y-1">
                      <div className="w-48 mx-auto border-b border-[#2C2A29] mb-2"></div>
                      <p className="font-bold text-[10px] uppercase text-[#2C2A29]">Poskytovateľ:</p>
                      <p className="font-semibold text-[9.5px]">DOKTOR MRÁZ s.r.o.</p>
                      <p className="text-[8.5px] text-[#8C857B]">MUDr. Ján Mráz, konateľ</p>
                    </div>

                    <div className="text-center space-y-1">
                      <div className="w-48 mx-auto border-b border-[#2C2A29] mb-2"></div>
                      <p className="font-bold text-[10px] uppercase text-[#2C2A29]">Pacient:</p>
                      <p className="font-semibold text-[9.5px] text-[#2C2A29]">{patientName || '---'}</p>
                      <p className="text-[8.5px] text-[#8C857B]">podpis pacienta</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- 4. Operačný protokol --- */}
            {docType === 'operacny_protokol' && (
              <div className="space-y-4 mb-6">
                <div className="border border-[#E8E2D9] rounded-xl p-4 bg-[#FBF9F6] text-xs">
                  <div className="border-b border-[#E8E2D9] pb-2 mb-3">
                    <p className="text-[10px] uppercase font-bold text-[#C5A059] tracking-wider">Operačný výkon & Tím</p>
                    <p className="text-sm font-bold text-[#2C2A29] pt-1">
                      {manualProcedure || selectedItems.map(i => i.name).join(' + ') || 'Operačný zákrok'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    <div><strong className="text-[#8C857B] uppercase text-[9px] mr-2">Termín zákroku:</strong> {surgeryDetails.opDate ? new Date(surgeryDetails.opDate).toLocaleDateString('sk-SK') : '---'}</div>
                    <div><strong className="text-[#8C857B] uppercase text-[9px] mr-2">Operatér:</strong> <span className="font-bold text-[#2C2A29]">{doctor || surgeryDetails.operator || '---'}</span></div>
                    
                    <div><strong className="text-[#8C857B] uppercase text-[9px] mr-2">Čas operácie:</strong> {surgeryDetails.opStart ? `${surgeryDetails.opStart} - ${surgeryDetails.opEnd}` : '---'}</div>
                    <div><strong className="text-[#8C857B] uppercase text-[9px] mr-2">Asistent:</strong> {surgeryDetails.assistant || '---'}</div>

                    <div><strong className="text-[#8C857B] uppercase text-[9px] mr-2">Čas anestézie:</strong> {surgeryDetails.anesStart ? `${surgeryDetails.anesStart} - ${surgeryDetails.anesEnd}` : '---'}</div>
                    <div><strong className="text-[#8C857B] uppercase text-[9px] mr-2">Anesteziológ:</strong> {surgeryDetails.anesthesiologist || '---'}</div>
                    
                    <div><strong className="text-[#8C857B] uppercase text-[9px] mr-2">Inštrumentárka:</strong> {surgeryDetails.instrumentalist || '---'}</div>
                    <div><strong className="text-[#8C857B] uppercase text-[9px] mr-2">Anest. sestra:</strong> {surgeryDetails.anestNurse || '---'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* --- 5. Prepúšťacia správa s detailmi --- */}
            {docType === 'prepustacia_sprava' && (
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4 bg-[#FBF9F6] p-4 rounded-xl border border-[#E8E2D9] text-[10px]">
                  <div><span className="text-[#8C857B] uppercase font-bold block mb-1">Čas operácie:</span> <span className="font-mono text-sm">{surgeryDetails.opStart} - {surgeryDetails.opEnd}</span></div>
                  <div><span className="text-[#8C857B] uppercase font-bold block mb-1">Čas anestézie:</span> <span className="font-mono text-sm">{surgeryDetails.anesStart} - {surgeryDetails.anesEnd}</span></div>
                  <div className="col-span-2 pt-2 border-t border-[#E8E2D9]">
                    <p className="mb-1"><strong>Operatér:</strong> {doctor}</p>
                    {surgeryDetails.assistant && <p className="mb-1"><strong>Asistent:</strong> {surgeryDetails.assistant}</p>}
                    {surgeryDetails.anesthesiologist && <p className="mb-1"><strong>Anesteziológ:</strong> {surgeryDetails.anesthesiologist}</p>}
                  </div>
                </div>

                {/* Termín kontroly */}
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-lg text-rose-800 text-xs">
                  <p className="font-bold flex justify-between mb-2 pb-1 border-b border-rose-200">
                    <span>⚠️ Najbližšia pooperačná kontrola:</span>
                    <span className="uppercase">{surgeryDetails.checkup}</span>
                  </p>
                  <p className="text-justify leading-relaxed">Presný termín si rezervujte cez rezervačný systém na <strong>www.sayclinic.sk</strong>. V prípade, že uvedené termíny nevyhovujú kontaktujte priamo doleuvedené číslo.</p>
                </div>

                {/* Lieky (ak sú vyplnené) */}
                {(rxAntibiotics || rxAnalgesics || rxCorticoids || rxAnticoagulants) && (
                  <div className="mt-4 border border-[#E8E2D9] rounded-xl p-4">
                    <p className="font-bold text-[10px] uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-1 mb-2">Predpísané lieky a dávkovanie:</p>
                    <ul className="list-none text-xs space-y-1.5">
                      {rxAntibiotics && <li><strong className="w-24 inline-block text-[#8C857B]">Antibiotiká:</strong> <span className="font-bold">{rxAntibiotics}</span></li>}
                      {rxAnalgesics && <li><strong className="w-24 inline-block text-[#8C857B]">Analgetiká:</strong> <span className="font-bold">{rxAnalgesics}</span></li>}
                      {rxCorticoids && <li><strong className="w-24 inline-block text-[#8C857B]">Kortikoidy:</strong> <span className="font-bold">{rxCorticoids}</span></li>}
                      {rxAnticoagulants && <li><strong className="w-24 inline-block text-[#8C857B]">Antikoagulanciá:</strong> <span className="font-bold">{rxAnticoagulants}</span></li>}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* --- 6. Anesteziologický dotazník --- */}
            {showAnesthesiaQ && (
              <div className="space-y-4 mb-8">
                <p className="font-bold text-[10px] uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-1">Zdravotná anamnéza (Vyplnil pacient):</p>
                <table className="w-full text-xs text-left">
                  <tbody className="divide-y divide-[#E8E2D9]">
                    <tr><td className="py-2 pr-4 border-b border-[#E8E2D9]">Liečite sa v súčasnosti na nejaké ochorenie?</td><td className="font-bold border-b border-[#E8E2D9]">{anesthesiaAnswers.diseases}</td></tr>
                    <tr><td className="py-2 pr-4 border-b border-[#E8E2D9]">Ak ste žena, ste tehotná?</td><td className="font-bold border-b border-[#E8E2D9]">{anesthesiaAnswers.pregnant}</td></tr>
                    <tr><td className="py-2 pr-4 border-b border-[#E8E2D9]">Užívate nejaké lieky (proti bolesti, na spanie, tlak)?</td><td className="font-bold border-b border-[#E8E2D9]">{anesthesiaAnswers.medications}</td></tr>
                    <tr><td className="py-2 pr-4 border-b border-[#E8E2D9]">Máte alergie na lieky, potraviny alebo náplaste?</td><td className="font-bold border-b border-[#E8E2D9]">{anesthesiaAnswers.allergies}</td></tr>
                    <tr><td className="py-2 pr-4">Vyskytli sa komplikácie s anestéziou u Vás/príbuzných?</td><td className="font-bold">{anesthesiaAnswers.complications}</td></tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* --- 7. INFORMOVANÝ SÚHLAS K OPERAČNÉMU VÝKONU V ODBORE ESTETICKÁ CHIRURGIA PODĽA § 6 ZÁKONA Č. 576/2004 Z. Z. --- */}
            {showSurgeryConsent && (
              <div className="space-y-6 text-[#2C2A29] leading-relaxed">
                {/* HLAVIČKA DOKUMENTU S LOGOM A IDENTIFIKÁCIOU KLINIKY */}
                <div className="border-b-2 border-[#C5A059] pb-4 mb-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <img 
                      src="/logo.png" 
                      alt="SAY BY MRAZ" 
                      className="h-16 w-auto object-contain" 
                    />
                    <div className="border-l border-[#E8E2D9] pl-3 text-[9px] text-[#8C857B] leading-tight">
                      <p className="uppercase tracking-[0.15em] text-[#C5A059] font-bold">PLASTICKÁ CHIRURGIA & ESTETICKÁ MEDICÍNA</p>
                      <p className="mt-0.5 font-semibold text-[#2C2A29]">DOKTOR MRÁZ s.r.o. | SAY CLINIC</p>
                      <p>Klinika Rudlová, Rudlovská cesta 5978/83, 974 11 Banská Bystrica</p>
                      <p className="mt-0.5 text-[#C5A059] font-medium">say@sayclinic.sk | www.sayclinic.sk</p>
                    </div>
                  </div>
                  <div className="text-right text-[9px] text-[#8C857B]">
                    <span className="bg-[#2C2A29] text-white px-2.5 py-1 rounded text-[8px] uppercase tracking-wider font-bold shadow-xs inline-block">
                      ZDRAVOTNÁ DOKUMENTÁCIA
                    </span>
                    <p className="font-bold text-[#2C2A29] mt-1.5 text-xs">Informovaný súhlas</p>
                    <p className="text-[9px]">§ 6 zákona č. 576/2004 Z. z.</p>
                  </div>
                </div>

                {/* HLAVNÝ NÁZOV DOKUMENTU */}
                <div className="text-center space-y-1 mb-5">
                  <h1 className="text-sm font-bold uppercase tracking-wider text-[#2C2A29]">
                    INFORMOVANÝ SÚHLAS PACIENTA S POSKYTNUTÍM ZDRAVOTNEJ STAROSTLIVOSTI – ESTETICKÝ OPERAČNÝ ZÁKROK
                  </h1>
                  <p className="text-[9.5px] text-[#8C857B] max-w-2xl mx-auto italic leading-tight">
                    uzatvorený a udelený v súlade s ustanoveniami § 6 a nasl. zákona č. 576/2004 Z. z. o zdravotnej starostlivosti, službách súvisiacich s poskytovaním zdravotnej starostlivosti a o zmene a doplnení niektorých zákonov v platnom znení a zákona č. 40/1964 Zb. Občiansky zákonník v platnom znení.
                  </p>
                </div>

                {/* ČASŤ I. IDENTIFIKÁCIA ZMLUVNÝCH STRÁN A ÚČASTNÍKOV */}
                <div className="space-y-2">
                  <p className="font-bold text-[10px] uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-0.5">
                    ČASŤ I. IDENTIFIKÁCIA ZMLUVNÝCH STRÁN A ÚČASTNÍKOV
                  </p>
                  
                  <div className="space-y-2 text-[10px]">
                    <div>
                      <p className="font-bold text-[#2C2A29] mb-1">1. Poskytovateľ zdravotnej starostlivosti:</p>
                      <div className="bg-[#FBF9F6] p-3 rounded-lg border border-[#E8E2D9] grid grid-cols-2 gap-x-4 gap-y-1">
                        <p><strong className="text-[#8C857B]">Obchodné meno:</strong> <span className="font-bold text-[#2C2A29]">DOKTOR MRÁZ s.r.o.</span></p>
                        <p><strong className="text-[#8C857B]">Sídlo:</strong> Muškátová 15652/37, 974 01 Banská Bystrica</p>
                        <p><strong className="text-[#8C857B]">IČO:</strong> 54 918 375</p>
                        <p><strong className="text-[#8C857B]">DIČ:</strong> 2121822901</p>
                        <p className="col-span-2"><strong className="text-[#8C857B]">Zápis v registri:</strong> Obchodný register Okresného súdu Banská Bystrica, oddiel: Sro, vložka č.: 44785/S</p>
                        <p><strong className="text-[#8C857B]">Štatutárny orgán:</strong> MUDr. Ján Mráz, konateľ</p>
                        <p><strong className="text-[#8C857B]">Miesto prevádzky / ZZ:</strong> Klinika Rudlová, Rudlovská cesta 5978/83, 974 11 Banská Bystrica</p>
                        <p className="col-span-2 text-[9px] text-[#8C857B] italic pt-0.5">(ďalej len „Poskytovateľ“ alebo „Klinika“)</p>
                      </div>
                    </div>

                    <div className="text-center font-bold text-xs text-[#8C857B] my-0.5">a</div>

                    <div>
                      <p className="font-bold text-[#2C2A29] mb-1">1. Pacient / Osoba, ktorej sa má zdravotná starostlivosť poskytnúť:</p>
                      <div className="bg-[#FBF9F6] p-3 rounded-lg border border-[#E8E2D9] grid grid-cols-2 gap-x-4 gap-y-1">
                        <p><strong className="text-[#8C857B]">Meno a priezvisko:</strong> <span className="font-bold text-xs text-[#2C2A29]">{patientName || '---'}</span></p>
                        <p><strong className="text-[#8C857B]">Rodné priezvisko:</strong> {patientMaidenName || '---'}</p>
                        <p><strong className="text-[#8C857B]">Dátum narodenia:</strong> {patientBirthDate || calculateBirthDateFromRC(birthNumber) || '---'}</p>
                        <p><strong className="text-[#8C857B]">Rodné číslo:</strong> <span className="font-mono font-semibold">{birthNumber || '---'}</span></p>
                        <p className="col-span-2"><strong className="text-[#8C857B]">Adresa trvalého pobytu:</strong> {patientAddress || '---'}</p>
                        <p><strong className="text-[#8C857B]">Telefónny kontakt:</strong> {patientPhone || '---'}</p>
                        <p><strong className="text-[#8C857B]">E-mailová adresa:</strong> {patientEmail || '---'}</p>
                        <p><strong className="text-[#8C857B]">Zdravotná poisťovňa:</strong> {patientInsurance || 'Dôvera'}</p>
                        <p><strong className="text-[#8C857B]">Štátna príslušnosť:</strong> {patientCitizenship || 'Slovenská republika'}</p>
                        <p className="col-span-2 text-[9px] text-[#8C857B] italic pt-0.5">(ďalej len „Pacient“)</p>

                        {legalRep.name && (
                          <div className="col-span-2 mt-2 pt-2 border-t border-[#E8E2D9] text-[9px] bg-white p-2 rounded">
                            <p className="font-bold text-[#C5A059] uppercase mb-0.5">Zákonný zástupca / opatrovník pacienta:</p>
                            <p><strong className="text-[#8C857B]">Meno, priezvisko a titul:</strong> {legalRep.name} ({legalRep.title})</p>
                            <p><strong className="text-[#8C857B]">Dátum narodenia a trvalý pobyt:</strong> {legalRep.birthDate || '---'}, {legalRep.address || '---'}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-1">
                      <p className="font-bold text-[#2C2A29] mb-1">2. Informácia o spracúvaní osobných údajov a vedení zdravotnej dokumentácie:</p>
                      <div className="bg-[#FBF9F6] p-2.5 rounded-lg border border-[#E8E2D9] text-[9.5px] text-justify text-[#4A4643] leading-relaxed">
                        Pacient je informovaný, že jeho osobné údaje a údaje o zdravotnom stave (vrátane osobitnej kategórie osobných údajov) sú Poskytovateľom získavané a spracúvané v súlade s Nariadením Európskeho parlamentu a Rady (EÚ) 2016/679 (GDPR), zákonom č. 18/2018 Z. z. o ochrane osobných údajov a zákonom č. 576/2004 Z. z. o zdravotnej starostlivosti (najmä § 19 ods. 2 a nasl.). Právnym základom spracúvania je plnenie zákonných povinností poskytovateľa zdravotnej starostlivosti pri vedení zdravotnej dokumentácie a poskytovaní zdravotnej starostlivosti. Údaje sú bezpečne uchovávané v zdravotnej dokumentácii Poskytovateľa po dobu zákonom stanoveného retenčného obdobia (najmenej 20 rokov od posledného poskytnutia zdravotnej starostlivosti). Pacient má právo na prístup k svojim osobným údajom, právo na ich opravu, obmedzenie spracúvania a ďalšie práva garantované GDPR v rozsahu zlučiteľnom s osobitnými predpismi upravujúcimi vedenie zdravotnej dokumentácie. Podrobné zásady ochrany osobných údajov sú zverejnené v priestoroch zdravotníckeho zariadenia Poskytovateľa a na jeho webovom sídle.
                      </div>
                    </div>
                  </div>
                </div>

                {/* ČASŤ II. ŠPECIFIKÁCIA PLÁNOVANÉHO OPERAČNÉHO VÝKONU */}
                <div className="space-y-2">
                  <p className="font-bold text-[10px] uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-0.5">
                    ČASŤ II. ŠPECIFIKÁCIA PLÁNOVANÉHO OPERAČNÉHO VÝKONU
                  </p>
                  
                  <div className="space-y-2 text-[10px] text-justify">
                    <div className="bg-[#FBF9F6] p-2.5 rounded-lg border border-[#E8E2D9]">
                      <p className="font-bold text-xs text-[#2C2A29]">1. Názov plánovaného operačného výkonu:</p>
                      <p className="font-semibold text-xs text-[#C5A059] mt-0.5">{surgeryConsent.procedureName || '---'}</p>
                    </div>

                    <div>
                      <p className="font-bold text-[#2C2A29]">2. Anatomická oblasť a lokalizácia výkonu:</p>
                      <p className="text-[#4A4643]">{surgeryConsent.anatomicalArea || '---'}</p>
                    </div>

                    <div>
                      <p className="font-bold text-[#2C2A29]">3. Plánovaný medicínsky a operačný postup:</p>
                      <p className="text-[#4A4643] whitespace-pre-line">
                        Operačný výkon spočíva v nasledovnom postupe: {surgeryConsent.technique || surgeryConsent.purposeAndNature || '---'}.
                      </p>
                    </div>

                    <div>
                      <p className="font-bold text-[#2C2A29]">4. Forma anestézie:</p>
                      <p className="text-[#4A4643]">
                        Operačný výkon sa uskutoční v: <strong className="text-[#2C2A29]">{surgeryConsent.anesthesiaType || 'Celková anestézia'}</strong>.
                        O rizikách spojených s formou anestézie bol Pacient osobitne poučený anestéziológom. Anestéziologický informovaný súhlas je vyhotovený ako samostatný dokument, ktorý tvorí vecnú súčasť predoperačnej dokumentácie a musí byť podpísaný pred samotným začatím operačného zákroku.
                      </p>
                    </div>

                    <div>
                      <p className="font-bold text-[#2C2A29]">5. Alternatívy k navrhovanému výkonu:</p>
                      <p className="text-[#4A4643]">
                        Pacient bol informovaný o možných alternatívnych liečebných, korektívnych a neinvazívnych postupoch: {surgeryConsent.alternatives || 'Aplikácia kyseliny hyalurónovej, laserové ošetrenie, dermálne výplne, prípadne konzervatívny postup'}, ako aj o možnosti nepodstúpiť žiaden výkon a ponechať stav bez zmeny.
                      </p>
                    </div>
                  </div>
                </div>

                {/* ČASŤ III. POUČENIE, DOBROVOĽNOSŤ VOĽBY A DIGITÁLNA VIZUALIZÁCIA */}
                <div className="space-y-2">
                  <p className="font-bold text-[10px] uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-0.5">
                    ČASŤ III. POUČENIE, DOBROVOĽNOSŤ VOĽBY A DIGITÁLNA VIZUALIZÁCIA
                  </p>
                  
                  <div className="space-y-2 text-[9.5px] text-justify text-[#4A4643] leading-relaxed">
                    <div>
                      <p className="font-bold text-[#2C2A29] text-[10px]">1. Poučenie a dobrovoľné rozhodnutie:</p>
                      <p>
                        Pacient vyhlasuje, že ošetrujúci lekár mu zrozumiteľne, ohľaduplne, bez nátlaku a s poskytnutím dostatočného času na rozmyslenie vysvetlil účel, povahu, predpokladaný prínos, techniku výkonu, jeho následky a riziká. Pacient mal možnosť klásť doplňujúce otázky, ktoré mu boli uspokojivo a podrobne zodpovedané. Pacient potvrdzuje, že podstúpenie tohto estetického zákroku je jeho slobodnou, plne dobrovoľnou voľbou a nie je výsledkom tiesne ani nátlaku tretej osoby.
                      </p>
                    </div>

                    <div className="bg-[#FBF9F6] p-3 rounded-lg border border-[#E8E2D9] space-y-1">
                      <p className="font-bold text-[#2C2A29] text-[10px]">2. Právny a medicínsky status predoperačnej vizualizácie (simulácie):</p>
                      <p>
                        Pokiaľ bola v rámci predoperačných konzultácií spracovaná 2D/3D počítačová simulácia, digitálna vizualizácia, nákres alebo fotodokumentácia s grafickou úpravou, táto slúži výlučne ako orientačná komunikačná a edukačná pomôcka na ujasnenie a vzájomné zosúladenie subjektívnych estetických predstáv Pacienta a medicínskych možností operatera.
                      </p>
                      <p className="font-semibold text-[#2C2A29]">
                        Tieto vizualizácie v žiadnom prípade nepredstavujú exaktnú medicínsku predikciu, záväzný prísľub, opis zaručených vlastností diela ani právnu záruku konečného anatomického či estetického výsledku.
                      </p>
                      <p>
                        Výsledný tvar a vzhľad operovaných oblastí (najmä nosa, prsníkov, tváre, brušnej steny a iných partií) je možné zo strany lekára len kvalifikovane medicínsky predpokladať, nakoľko je determinovaný individuálnou anatómiou Pacienta, asymetriou kostry a svalstva, elasticitou kože, mikrocirkuláciou, hojivými procesmi, jazvením a nepredvídateľnou biologickou reakciou organizmu.
                      </p>
                      <p className="italic text-[#8C857B] pt-0.5">
                        Zmluvné strany sa výslovne dohodli, že digitálna vizualizácia netvorí dôkazný štandard pre posudzovanie správnosti poskytnutej zdravotnej starostlivosti ani základ pre nároky z vadného plnenia či náhrady škody.
                      </p>
                    </div>
                  </div>
                </div>

                {/* ČASŤ IV. RIZIKÁ, KOMPLIKÁCIE A MEDICÍNSKY ŠTANDARD LEGE ARTIS */}
                <div className="space-y-2">
                  <p className="font-bold text-[10px] uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-0.5">
                    ČASŤ IV. RIZIKÁ, KOMPLIKÁCIE A MEDICÍNSKY ŠTANDARD LEGE ARTIS
                  </p>
                  
                  <div className="space-y-2 text-[9.5px] text-justify text-[#4A4643] leading-relaxed">
                    <div>
                      <p className="font-bold text-[#2C2A29] text-[10px] mb-1">1. Všeobecné a špecifické riziká výkonu:</p>
                      <p className="mb-1">Pacient bol oboznámený s rizikami a možnými komplikáciami, ktoré zahŕňajú najmä:</p>
                      <div className="space-y-1.5 pl-2">
                        <p>
                          <strong className="text-[#2C2A29]">a) včasné pooperačné komplikácie:</strong> krvácanie, vznik hematómu vyžadujúceho chirurgickú evakuáciu, seróm (nahromadenie tkanivového moku), pooperačnú infekciu, zápal, rozpad (dehiscenciu) operačnej rany, nekrózu kože, podkožia alebo dvorca/bradavky pri redukčných výkonoch, tromboembolickú chorobu;
                        </p>
                        <p>
                          <strong className="text-[#2C2A29]">b) neskoré a estetické komplikácie:</strong> pretrvávajúcu alebo novovzniknutú asymetriu, nepravidelnosti kontúr, hypertrofické, atrofické či keloidné jazvenie, pigmentové zmeny v oblasti jaziev, dočasnú alebo trvalú zmenu či stratu citlivosti (hypestéziu, parestéziu, hyperestéziu) operovanej oblasti, hmatateľnosť či posun implantátu, kapsulárnu kontraktúru (pri prsníkových implantátoch), pretrvávanie opuchov a zatvrdlín;
                        </p>
                        <div>
                          <p><strong className="text-[#2C2A29]">c) individuálne špecifické riziká pre plánovaný výkon:</strong></p>
                          <div className="bg-[#FBF9F6] p-2.5 rounded-lg border border-[#E8E2D9] font-medium text-[#2C2A29] mt-0.5">
                            {surgeryConsent.specificRisks || 'Riziká zodpovedajú štandardnému priebehu v zmysle predoperačnej konzultácie.'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#FBF9F6] p-3 rounded-lg border border-[#E8E2D9] space-y-1">
                      <p className="font-bold text-[#2C2A29] text-[10px]">2. Vymedzenie komplikácie vs. odborné pochybenie (lege artis):</p>
                      <p>
                        Poskytovateľ je v zmysle § 4 ods. 3 zákona č. 576/2004 Z. z. povinný poskytnúť zdravotnú starostlivosť správne – lege artis, t. j. v súlade so súčasnými poznatkami lekárskej vedy a štandardnými medicínskymi postupmi.
                      </p>
                      <p>
                        Výskyt vyššie uvedených komplikácií (vrátane hematómu, infekcie, asymetrie, porúch hojenia, nepriaznivého jazvenia či zmien citlivosti) predstavuje známe, medicínsky popísané inherentné biologické riziko chirurgického výkonu. Tieto komplikácie môžu nastať aj pri plne správnom, bezchybnom a prísne lege artis postupe operatera. Samotný vznik komplikácie alebo odchýlka od subjektívnej predstavy Pacienta o estetickom výsledku samy osebe nepreukazujú a nezakladajú odborné pochybenie, porušenie právnych povinností ani zavinenie Poskytovateľa či operatera.
                      </p>
                    </div>
                  </div>
                </div>

                {/* ČASŤ V. ANAMNÉZA, INDIVIDUÁLNE FAKTORY A POOPERAČNÝ REŽIM */}
                <div className="space-y-2">
                  <p className="font-bold text-[10px] uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-0.5">
                    ČASŤ V. ANAMNÉZA, INDIVIDUÁLNE FAKTORY A POOPERAČNÝ REŽIM
                  </p>
                  
                  <div className="space-y-2 text-[9.5px] text-justify text-[#4A4643] leading-relaxed">
                    <div>
                      <p className="font-bold text-[#2C2A29] text-[10px] mb-1">1. Pravdivosť anamnestických údajov:</p>
                      <p>
                        Pacient čestne vyhlasuje, že nezamlčal žiadne skutočnosti o svojom aktuálnom ani minulom zdravotnom stave, prekonaných ochoreniach, operáciách, alergiách, užívaných liekoch (najmä liekoch ovplyvňujúcich zrážanlivosť krvi, nesteroidných antiflogistikách, hormonálnej antikoncepcii), užívaní výživových doplnkov, návykových látok, konzumácii alkoholu a fajčení. Pacient berie na vedomie, že zamlčanie týchto údajov dramaticky zvyšuje riziko závažných komplikácií.
                      </p>
                      <div className="bg-[#FBF9F6] p-2.5 rounded-lg border border-[#E8E2D9] text-[9px] mt-1 space-y-1">
                        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                          <p><strong className="text-[#8C857B]">Alergie:</strong> {surgeryConsent.allergies}</p>
                          <p><strong className="text-[#8C857B]">Chronické ochorenia:</strong> {surgeryConsent.chronicDiseases}</p>
                          <p><strong className="text-[#8C857B]">Poruchy zrážanlivosti / lieky:</strong> {surgeryConsent.bleedingDisorders}</p>
                          <p><strong className="text-[#8C857B]">Trvalá medikácia:</strong> {surgeryConsent.chronicMedication}</p>
                          <p><strong className="text-[#8C857B]">Sklon k tvorbe keloidných jaziev:</strong> {surgeryConsent.keloidTendency}</p>
                          <p><strong className="text-[#8C857B]">Fajčenie / alkohol / návykové látky:</strong> {surgeryConsent.smokingAlcohol}</p>
                          <p className="col-span-2"><strong className="text-[#8C857B]">Predchádzajúce operácie v lokalite:</strong> {surgeryConsent.previousSurgeries}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="font-bold text-[#2C2A29] text-[10px] mb-1">2. Záväzok dodržiavania liečebného a pooperačného režimu:</p>
                      <p className="mb-1">Pacient sa zaväzuje striktne dodržiavať všetky písomné a ústne pokyny lekára, najmä:</p>
                      <div className="bg-[#FBF9F6] p-2.5 rounded-lg border border-[#E8E2D9] space-y-1.5 pl-3">
                        <p>
                          <strong className="text-[#2C2A29]">a)</strong> dodržiavať nariadený kľudový režim a vyhýbať sa fyzickej námahe a športu po dobu určenú lekárom (minimálne <span className="font-bold text-[#2C2A29]">{surgeryConsent.recoveryWeeks || '4 – 6'}</span> týždňov) – {surgeryConsent.postopRest};
                        </p>
                        <p>
                          <strong className="text-[#2C2A29]">b)</strong> nepretržite nosiť predpísanú kompresívnu bielizeň / elastické bandáže / fixačné dlahy po dobu stanovenú lekárom – {surgeryConsent.postopGarment};
                        </p>
                        <p>
                          <strong className="text-[#2C2A29]">c)</strong> zdržať sa fajčenia, expozície UV žiareniu (slnko, solárium), návštevy sauny a bazénov po dobu rekonvalescencie – {surgeryConsent.postopEnvironment};
                        </p>
                        <p>
                          <strong className="text-[#2C2A29]">d)</strong> aplikovať predpísanú medikáciu a lokálnu starostlivosť o rany a jazvy presne podľa ordinácie – {surgeryConsent.postopMedication}, {surgeryConsent.postopWound}.
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="font-bold text-[#2C2A29] text-[10px] mb-1">3. Kontroly a oznamovanie komplikácií:</p>
                      <p>
                        Pacient je povinný dostaviť sa na všetky stanovené pooperačné kontrolné vyšetrenia a preväzy v termínoch určených lekárom ({surgeryConsent.postopCheckup}). V prípade vzniku akýchkoľvek varovných príznakov alebo podozrenia na komplikácie (najmä náhly jednostranný opuch, stupňujúca sa bolesť, krvácanie z rany, horúčka nad 38 °C, začervenanie a sekrécia z rany, dýchavičnosť) je Pacient povinný bezodkladne telefonicky a e-mailom kontaktovať Poskytovateľa a dostaviť sa na mimoriadnu kontrolu, prípadne v stave bezprostredného ohrozenia života vyhľadať urgentný príjem ústavného zdravotníckeho zariadenia.
                      </p>
                    </div>
                  </div>
                </div>

                {/* ČASŤ VI. POSUDZOVANIE VÝHRAD, KOREKČNÉ OPERÁCIE A FINANČNÉ PODMIENKY */}
                <div className="space-y-2">
                  <p className="font-bold text-[10px] uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-0.5">
                    ČASŤ VI. POSUDZOVANIE VÝHRAD, KOREKČNÉ OPERÁCIE A FINANČNÉ PODMIENKY
                  </p>
                  
                  <div className="space-y-2 text-[9.5px] text-justify text-[#4A4643] leading-relaxed">
                    <div>
                      <p className="font-bold text-[#2C2A29] text-[10px]">1. Odborné posúdenie výsledku a výhrad:</p>
                      <p>
                        V prípade výhrad Pacienta k estetickému alebo funkčnému výsledku operácie vykoná operatér Poskytovateľa komplexné odborné klinické zhodnotenie stavu. Konečný výsledok estetického výkonu možno definitívne hodnotiť až po úplnom dozretí tkanív a jaziev, spravidla po uplynutí 6 až 12 mesiacov od operácie. Odborné posúdenie operatérom nie je výlučne a neodvolateľne záväzné pre uplatnenie zákonných práv Pacienta; Pacientovi v plnom rozsahu zostáva zachované právo obrátiť sa na Úrad pre dohľad nad zdravotnou starostlivosťou (ÚDZS) so žiadosťou o prešetrenie správnosti poskytnutej zdravotnej starostlivosti, ako aj právo na súdnu ochranu pred príslušnými súdmi Slovenskej republiky. Pacient má tiež právo obrátiť sa na Verejného ochrancu práv Slovenskej republiky so sťažnosťou alebo podnetom vo veci ochrany základných práv a slobôd pri postupe poskytovateľa zdravotnej starostlivosti.
                      </p>
                    </div>

                    <div>
                      <p className="font-bold text-[#2C2A29] text-[10px] mb-1">2. Finančné a vecné podmienky korekčných výkonov (reoperácií):</p>
                      <p className="mb-1">Zmluvné strany dojednávajú nasledovné pravidlá pre prípadné korekčné chirurgické výkony:</p>
                      <div className="bg-[#FBF9F6] p-2.5 rounded-lg border border-[#E8E2D9] space-y-1.5 pl-3">
                        <p>
                          <strong className="text-[#2C2A29]">a) Preukázané pochybenie Poskytovateľa (postup non lege artis):</strong> Ak je preukázané (posúdením Poskytovateľa, záverom ÚDZS alebo právoplatným rozhodnutím súdu), že nežiaduci výsledok alebo komplikácia vznikli v dôsledku odborného pochybenia Poskytovateľa, korekčný výkon a súvisiaca zdravotná starostlivosť budú vykonané na náklady Poskytovateľa v plnom rozsahu.
                        </p>
                        <p>
                          <strong className="text-[#2C2A29]">b) Nastúpenie známeho inherentného biologického/anatomického rizika bez pochybenia lekára:</strong> Ak si stav vyžaduje korekciu v dôsledku individuálnej biologickej reakcie organizmu, nepriaznivého hojenia či anatomických limitov pri plnom dodržaní postupu lege artis a liečebného režimu Pacientom, Poskytovateľ poskytne prácu chirurga bezplatne a Pacient hradí výlučne priame preukázateľné materiálne a režijné náklady (najmä anestéziologický tím a liečivá, spotrebný chirurgický materiál, sterilizáciu, prípadne novú sadu implantátov).
                        </p>
                        <p>
                          <strong className="text-[#2C2A29]">c) Neindikovaná subjektívna zmena preferencie alebo porušenie režimu:</strong> Ak Pacient požaduje zmenu výsledku z dôvodu zmeny svojho subjektívneho estetického želania (pri dosiahnutí medicínsky a esteticky štandardného výsledku), alebo ak komplikácia vznikla v dôsledku preukázaného porušenia liečebného a pooperačného režimu zo strany Pacienta, korekčný výkon sa realizuje ako nový platený výkon za plnú cenu podľa platného cenníka Poskytovateľa.
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="font-bold text-[#2C2A29] text-[10px]">3. Miestna viazanosť zliav a reoperácií:</p>
                      <p>
                        Zvýhodnené cenové podmienky, bezplatné poskytnutie práce chirurga a kompenzačné zľavy sa vzťahujú výlučne na korekčné výkony vykonané v zdravotníckom zariadení Poskytovateľa. V prípade, že sa Pacient jednostranne rozhodne podstúpiť reoperáciu alebo korekciu v inom (externom) zdravotníckom zariadení bez predchádzajúceho písomného súhlasu Poskytovateľa alebo bez právoplatného právneho titulu, nevzniká mu automaticky nárok na refundáciu nákladov ani na finančné vyrovnanie voči Poskytovateľovi.
                      </p>
                    </div>
                  </div>
                </div>

                {/* ČASŤ VII. ZÁVEREČNÉ VYHLÁSENIA A PODPISY */}
                <div className="space-y-3">
                  <p className="font-bold text-[10px] uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-0.5">
                    ČASŤ VII. ZÁVEREČNÉ VYHLÁSENIA A PODPISY
                  </p>
                  
                  <div className="space-y-2 text-[9.5px] text-justify text-[#4A4643] leading-relaxed">
                    <p className="font-bold text-[#2C2A29] text-[10px]">1. Pacient svojím podpisom potvrdzuje, že:</p>
                    <ol className="list-none space-y-1 pl-2">
                      <li><strong className="text-[#2C2A29]">a)</strong> textu tohto informovaného súhlasu a všetkým jeho ustanoveniam porozumel v celom rozsahu;</li>
                      <li><strong className="text-[#2C2A29]">b)</strong> mu boli vysvetlené všetky medicínske aspekty, priebeh zákroku, riziká a režimové obmedzenia;</li>
                      <li><strong className="text-[#2C2A29]">c)</strong> mal dostatočný časový priestor na zváženie svojho rozhodnutia a netrpí žiadnou duševnou poruchou ani prekážkou znižujúcou jeho spôsobilosť na právne úkony;</li>
                      <li><strong className="text-[#2C2A29]">d)</strong> bol poučený o svojom zákonnom práve v zmysle § 6 ods. 8 zákona č. 576/2004 Z. z. kedykoľvek tento informovaný súhlas slobodne odvolať až do okamihu zahájenia samotného operačného výkonu;</li>
                      <li><strong className="text-[#2C2A29]">e)</strong> slobodne a dobrovoľne udeľuje informovaný súhlas s vykonaním vyššie špecifikovaného estetického operačného výkonu vrátane potrebných súvisiacich diagnostických, terapeutických a anestéziologických úkonov.</li>
                    </ol>

                    <div className="bg-[#FBF9F6] p-2.5 rounded-lg border border-[#E8E2D9] text-[9.5px]">
                      <p className="font-bold text-[#2C2A29]">2. Vyhlásenie lekára:</p>
                      <p>
                        Ošetrujúci a operujúci lekár potvrdzuje, že Pacientovi osobne a riadne poskytol poučenie v celom zákonnom rozsahu, zodpovedal všetky otázky a overil si, že Pacient poučeniu porozumel.
                      </p>
                    </div>
                  </div>

                  {/* MIESTO, DÁTUM, ČAS */}
                  <div className="grid grid-cols-3 gap-3 text-[9.5px] bg-[#FBF9F6] p-3 rounded-lg border border-[#E8E2D9]">
                    <p><strong className="text-[#8C857B]">Miesto podpisu:</strong> <span className="font-semibold">{surgeryConsent.signaturePlace || 'Banská Bystrica'}</span></p>
                    <p><strong className="text-[#8C857B]">Dátum:</strong> <span className="font-semibold">{formatSlovakDateLong(agreementDate) || new Date().toLocaleDateString('sk-SK')}</span></p>
                    <p><strong className="text-[#8C857B]">Čas udelenia súhlasu:</strong> <span className="font-semibold">{surgeryConsent.consentTime || '09:30'} hod.</span></p>
                  </div>

                  {/* PODPISOVÉ BLOKY */}
                  <div className="grid grid-cols-2 gap-8 pt-6 pb-3">
                    <div className="text-center space-y-1">
                      <div className="w-full border-b border-[#2C2A29] mb-2 min-h-[40px]"></div>
                      <p className="font-bold text-[10px] text-[#2C2A29]">Podpis Pacienta</p>
                      <p className="text-[9px] text-[#2C2A29] font-medium">{patientName || '[MENO A PRIEZVISKO PACIENTA]'}</p>
                      <p className="text-[8px] text-[#8C857B]">(resp. zákonného zástupcu / opatrovníka)</p>
                    </div>
                    <div className="text-center space-y-1">
                      <div className="w-full border-b border-[#2C2A29] mb-2 min-h-[40px]"></div>
                      <p className="font-bold text-[10px] text-[#2C2A29]">Podpis a odtlačok pečiatky operujúceho lekára</p>
                      <p className="text-[9px] text-[#2C2A29] font-semibold">{doctor || 'MUDr. Ján Mráz'}</p>
                      <p className="text-[8px] text-[#8C857B]">Kód lekára: {doctorCode || 'A86342871'} • za DOKTOR MRÁZ s.r.o.</p>
                    </div>
                  </div>

                  {/* PRIPÁJACIE A ZÁVEREČNÉ UPOZORNENIE */}
                  <div className="space-y-1.5 pt-2 border-t border-[#E8E2D9]">
                    <p className="font-bold text-[9px] uppercase tracking-wider text-[#C5A059]">
                      Pripájacie a záverečné upozornenie:
                    </p>
                    <p className="text-[8px] text-[#8C857B] leading-relaxed text-justify">
                      Tento dokument predstavuje právne a medicínsky záväzný individualizovaný informovaný súhlas k estetickému operačnému výkonu vypracovaný v súlade so zákonom č. 576/2004 Z. z. o zdravotnej starostlivosti, nariadením GDPR a Občianskym zákonníkom Slovenskej republiky. K dokumentu sa pripája samostatne podpísaný informovaný súhlas k anestézii. Dokument sa vyhotovuje v dvoch rovnopisoch, z ktorých jeden je neoddeliteľnou súčasťou zdravotnej dokumentácie vedenej poskytovateľom a druhý sa odovzdáva pacientovi.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* --- 8. INFORMOVANÝ SÚHLAS S APLIKÁCIOU VÝPLNÍ / BOTOXU --- */}
            {showAestheticConsent && (
              <div className="space-y-5 mb-8 text-justify leading-relaxed">
                <div className="bg-[#FBF9F6] p-4 rounded-xl border border-[#E8E2D9] space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <p><strong className="text-[#8C857B] uppercase text-[9px]">Druh ošetrenia:</strong> <span className="font-bold block text-sm text-[#2C2A29]">{aestheticConsent.treatmentType}</span></p>
                    <p><strong className="text-[#8C857B] uppercase text-[9px]">Aplikovaný produkt:</strong> <span className="font-bold block text-sm text-[#C5A059]">{aestheticConsent.productName}</span></p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E8E2D9]">
                    <p><strong className="text-[#8C857B] uppercase text-[9px]">Lokalita aplikácie:</strong> <span className="block font-semibold text-xs">{aestheticConsent.applicationSites}</span></p>
                    <p><strong className="text-[#8C857B] uppercase text-[9px]">Dávka / Šarža:</strong> <span className="block font-semibold text-xs">{aestheticConsent.volumeOrUnits} | {aestheticConsent.batchNumber}</span></p>
                  </div>
                </div>

                <div>
                  <p className="font-bold text-[10px] uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-1 mb-2">I. Poučenie o účinku a trvaní ošetrenia</p>
                  <p className="text-xs mb-2">Aplikácia dermálnych výplní alebo botulotoxínu je miniinvazívny zákrok určený na redukciu vrások, obnovu objemu a kontúrovanie tváre. Účinok kyseliny hyalurónovej je viditeľný ihneď, účinok botulotoxínu nastupuje po 3 - 7 dňoch. Trvanie efektu je individuálne (obvykle 4 - 12 mesiacov v závislosti od metabolizmu a životného štýlu).</p>
                </div>

                <div>
                  <p className="font-bold text-[10px] uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-1 mb-2">II. Možné vedľajšie účinky a riziká</p>
                  <div className="bg-[#FBF9F6] p-3 rounded-lg border border-[#E8E2D9] text-xs font-semibold text-[#2C2A29]">
                    {aestheticConsent.customSideEffects}
                  </div>
                </div>

                <div>
                  <p className="font-bold text-[10px] uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-1 mb-2">III. Poaplikačné odporúčania a prehlásenie</p>
                  <ul className="list-disc pl-4 space-y-1 text-xs">
                    <li>24 hodín po aplikácii nenanášať make-up, vyhnúť sa zvýšenej fyzickej námahe a dotyku ošetrených miest.</li>
                    <li>48 hodín nevystavovať ošetrenú oblasť intenzívnemu teplu (sauna, parný kúpeľ, solárium) ani priamemu slnku.</li>
                    <li>Pri aplikácii botulotoxínu: minimálne 4 hodiny po aplikácii sa nepredkláňať a neľahať si do vodorovnej polohy.</li>
                  </ul>
                  <p className="text-xs mt-3">Klient/ka potvrdzuje, že netrpí žiadnymi kontraindikáciami (akútny infekt, tehotenstvo, dojčenie, myasténia gravis, poruchy koagulácie) a s aplikáciou plne súhlasí.</p>
                </div>
              </div>
            )}

            {/* --- 9. ŽIADANKA NA PREDOPERAČNÉ VYŠETRENIA --- */}
            {showPreopRequest && (
              <div className="space-y-5 mb-8 leading-relaxed">
                <div className="bg-[#FBF9F6] p-4 rounded-xl border border-[#E8E2D9] space-y-2">
                  <p className="text-xs"><strong className="text-[#8C857B] uppercase text-[9px] mr-2">Vážený pán / Vážená pani doktorka:</strong> <span className="font-bold text-[#2C2A29]">{preopRequest.gpDoctorName}</span></p>
                  <p className="text-xs"><strong className="text-[#8C857B] uppercase text-[9px] mr-2">Plánovaný operačný výkon:</strong> <span className="font-bold text-[#C5A059]">{preopRequest.targetSurgery}</span></p>
                  <p className="text-xs"><strong className="text-[#8C857B] uppercase text-[9px] mr-2">Predpokladaný termín zákroku:</strong> <span className="font-semibold">{preopRequest.surgeryDate ? new Date(preopRequest.surgeryDate).toLocaleDateString('sk-SK') : '---'}</span></p>
                </div>

                <div>
                  <p className="font-bold text-[10px] uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-1 mb-2">Požadované predoperačné vyšetrenia a odbery:</p>
                  <p className="text-xs mb-3 text-[#8C857B]">Prosíme o realizáciu nasledujúcich laboratórnych vyšetrení a interného zhodnotenia spôsobilosti:</p>
                  
                  <div className="space-y-1.5 border border-[#E8E2D9] rounded-xl p-4 bg-white">
                    {preopRequest.requiredTests.map((test, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs py-1 border-b border-[#E8E2D9]/50 last:border-none">
                        <span className="font-bold text-[#C5A059] min-w-[20px]">{idx + 1}.</span>
                        <span className="text-[#2C2A29] font-medium">{test}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-amber-900 text-xs">
                  <p className="font-bold mb-1">⚠️ Dôležité inštrukcie pre pacienta:</p>
                  <p>{preopRequest.specialNote}</p>
                  <p className="mt-1">Výsledky vyšetrení je potrebné zaslať najneskôr 7 dní pred plánovaným výkonom na <strong>info@sayclinic.sk</strong> alebo priniesť v origináli na príjem.</p>
                </div>
              </div>
            )}

            {/* --- 10. LEKÁRSKE POTVRDENIE / POSUDOK --- */}
            {showCertificate && (
              <div className="space-y-6 mb-8 text-justify leading-relaxed">
                <div className="bg-[#FBF9F6] p-4 rounded-xl border border-[#E8E2D9] space-y-2">
                  <p><strong className="text-[#8C857B] uppercase text-[9px]">Druh potvrdenia:</strong> <span className="font-bold text-sm text-[#2C2A29] ml-2">{medicalCertificate.purpose}</span></p>
                  <p><strong className="text-[#8C857B] uppercase text-[9px]">Vydané pre inštitúciu:</strong> <span className="font-semibold text-xs ml-2">{medicalCertificate.issuedFor}</span></p>
                  <p><strong className="text-[#8C857B] uppercase text-[9px]">Platnosť / Doba kľudu:</strong> <span className="font-semibold text-xs text-[#C5A059] ml-2">{medicalCertificate.validUntil}</span></p>
                </div>

                <div>
                  <p className="font-bold text-[10px] uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-1 mb-3">Lekársky posudok a potvrdenie o zdravotnom stave:</p>
                  <div className="border border-[#E8E2D9] rounded-xl p-5 bg-white text-sm text-[#2C2A29] leading-relaxed shadow-sm">
                    {medicalCertificate.statement}
                  </div>
                </div>

                <div className="text-xs text-[#8C857B] italic">
                  Toto potvrdenie sa vydáva na žiadosť menovaného/menovanej pre vyššie uvedené účely a slúži ako doklad o zdravotnom stave a odporúčanom liečebnom režime.
                </div>
              </div>
            )}

            {/* --- Spoločný textový blok pre Operačný protokol --- */}
            {showNotes && (
              <div className="space-y-2 mb-8 flex-1">
                <p className="font-bold text-[10px] uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-1">
                  Popis operácie:
                </p>
                <div className="whitespace-pre-line text-sm text-[#2C2A29] leading-relaxed pt-2">
                  {notes || '...'}
                </div>
              </div>
            )}

            {/* --- Použitý materiál a implantáty tlačené v Operačnom protokole --- */}
            {docType === 'operacny_protokol' && (
              <div className="space-y-4 mb-6">
                {/* Implantáty a materiál */}
                {((surgeryImplants && surgeryImplants.length > 0) || vvImplants.some(impl => impl.vyrobca || impl.kat || impl.objem) || surgeryMaterials || vvMaterial) && (
                  <div className="border border-[#E8E2D9] rounded-xl p-3.5 bg-[#FBF9F6] space-y-2">
                    <p className="font-bold text-[10px] uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-1">
                      Použitý materiál a implantáty:
                    </p>
                    
                    {/* Implantáty */}
                    {(surgeryImplants.length > 0 || vvImplants.some(impl => impl.vyrobca || impl.kat || impl.objem)) && (
                      <div className="space-y-1.5 pt-1">
                        <p className="text-[9px] uppercase font-bold text-[#8C857B]">Implantáty:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(surgeryImplants.length > 0 ? surgeryImplants : vvImplants).map((impl: any, idx) => (
                            <div key={idx} className="bg-white border border-[#E8E2D9] p-2 rounded-lg text-xs">
                              <p className="font-bold text-[#2C2A29]">
                                {impl.vyrobca || 'Implantát'} {impl.model ? `- ${impl.model}` : ''}
                              </p>
                              <div className="text-[10px] text-[#8C857B] mt-0.5 space-y-0.5">
                                {impl.objem && <p>Objem / Veľkosť: <strong className="text-[#2C2A29]">{impl.objem}</strong></p>}
                                {impl.strana && <p>Lokalizácia: <strong>{impl.strana}</strong></p>}
                                {(impl.lot || impl.kat) && <p className="font-mono text-[9px]">LOT / Kat: {impl.lot || impl.kat}</p>}
                                {impl.sn && <p className="font-mono text-[9px]">SN: {impl.sn}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Šijací materiál a pomôcky */}
                    {(surgeryMaterials || vvMaterial) && (
                      <div className="pt-2 border-t border-[#E8E2D9]/60 text-xs">
                        <p className="text-[9px] uppercase font-bold text-[#8C857B] mb-0.5">Šijací materiál, drenáž a bandáže:</p>
                        <p className="whitespace-pre-line text-[#2C2A29]">{surgeryMaterials || vvMaterial}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Automatické odporúčania pre ošetrujúci personál na pooperačnej izbe */}
                {postopStaffCare && (
                  <div className="border border-[#C5A059]/40 rounded-xl p-3.5 bg-[#FAF7F2] space-y-1.5">
                    <p className="font-bold text-[10px] uppercase text-[#C5A059] border-b border-[#C5A059]/30 pb-1">
                      Pooperačné odporúčania pre ošetrujúci personál:
                    </p>
                    <div className="whitespace-pre-line text-xs text-[#2C2A29] leading-relaxed pt-1">
                      {postopStaffCare}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Odporúčania špecifické pre Prepúšťaciu správu */}
            {docType === 'prepustacia_sprava' && (
               <div className="text-[10px] text-[#2C2A29] space-y-2 mt-4 text-justify leading-relaxed">
                 <p className="font-bold uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-1 mb-2">Odporúčania:</p>
                 <ol className="list-decimal pl-4 space-y-1 font-semibold">
                   <li>Odovzdaná preskripcia - pacient/ka poučená/ý o dávkovaní</li>
                   <li>Užívať svoju chronickú medikáciu</li>
                   <li>Dodržiavať pooperačný režim (viď poučenie k výkonu)</li>
                 </ol>
                 <p className="pt-2">V prípade potreby či komplikácie je nutné kontaktovať kliniku na doleuvedenom tel. čísle alebo vo vážnych situáciách ošetrujúceho lekára. V prípade život ohrozujúcich situácii nutné kontaktovať linku záchrannej služby 155 (112).</p>
                 <p className="font-bold mt-4">Klient/ka svojím podpisom prehlasuje, že prepúšťacej správe porozumela v plnom rozsahu a nemá žiadne nejasnosti.</p>
               </div>
            )}

            {/* Právna doložka a poučenia (Pre VV, Kontrolu, Anest. dotazník) */}
            {docType !== 'dohoda_o_cene' && docType !== 'prepustacia_sprava' && docType !== 'ziadanka_predoperacne' && docType !== 'lekarske_potvrdenie' && (showVV || docType === 'kontrolne_vysetrenie' || docType === 'anesteziologicky_dotaznik') && (
              <div className="text-[8px] text-[#8C857B] space-y-2 border-t border-[#E8E2D9] pt-4 mt-6 leading-tight text-justify">
                {showVV && (
                  <>
                    <p>Po vyšetreniach a zhodnotení anamnézy, objektívneho nálezu a rizikových faktorov je možné očakávať priaznivý efekt výkonu.</p>
                    <p className="font-semibold text-[#2C2A29]">
                      {vvNoContra ? 'Bez zjavnej kontraindikácie k výkonu (t.č.).' : `Kontraindikácia: ${vvContraReason}`}
                    </p>
                  </>
                )}
                <p>Klient/ka súhlasí s vykonaním vyšetrení v stanovenom rozsahu. Klient/ka prehlasuje, že bol/a poučený/á o výkone, jeho priebehu a podstate, výsledných jazvách, rizikách a komplikáciách, pooperačnom režime a starostlivosti. Prevádzkovateľ spracúva osobné údaje pacienta podľa zákona č. 576/2004 Z. z.</p>
              </div>
            )}

            {/* Podpisy bežné (Okrem Dohody a Informovaného súhlasu) */}
            {docType !== 'dohoda_o_cene' && docType !== 'suhlas_operacia' && (
              <div className="mt-10 pt-6 flex justify-between items-end text-[10px] text-[#8C857B]">
                <div className="text-center">
                  <div className="w-40 border-b border-[#2C2A29] mb-2"></div>
                  {docType === 'ziadanka_predoperacne' ? 'Podpis pacienta' : docType === 'lekarske_potvrdenie' ? 'Prevzal pacient / zástupca' : 'Podpis pacienta / klienta'}
                </div>
                <div className="text-center">
                  <div className="w-40 border-b border-[#2C2A29] mb-2"></div>
                  <span className="font-bold text-[#2C2A29]">{doctor}</span><br />
                  Pečiatka a podpis lekára
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
      )}

      {/* MODÁLNE OKNO SPRÁVY ŠABLÓN INFORMOVANÝCH SÚHLASOV */}
      <SurgeryConsentTemplateManager
        isOpen={isTemplateManagerOpen}
        onClose={() => setIsTemplateManagerOpen(false)}
        onSelectAndApply={(profile) => {
          handleApplyProfileFromManager(profile);
          setIsTemplateManagerOpen(false);
          setTemplateSaveFeedback(`Použitá šablóna pre „${profile.procedureName}“`);
          setTimeout(() => setTemplateSaveFeedback(null), 3000);
        }}
      />
    </>
  );
}