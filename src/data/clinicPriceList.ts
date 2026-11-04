// =========================================================================
// OFICIÁLNY CENNÍK SAY CLINIC (SAY OS) - Banská Bystrica
// =========================================================================

export type ClinicPriceCategory =
  | 'consultation_stay'
  | 'face_surgery'
  | 'breast_surgery'
  | 'body_contouring_liposuction'
  | 'laser_devices'
  | 'injectables_aesthetics'
  | 'physio_lymph_massage'
  | 'skincare_cosmetics'
  | 'hand_surgery'
  | 'dermatosurgery'
  | 'compression_garments'
  | 'diagnostics';

export interface ClinicPriceItem {
  id: string;
  name: string;
  price: number;
  currency: string;
  category: ClinicPriceCategory;
  categoryLabel: string;
  description?: string;
  isSurgery?: boolean;
}

export interface ClinicPackageItem {
  id: string;
  name: string;
  tier: 'basic' | 'premium';
  category: 'skincare' | 'periorbital' | 'injectables' | 'laser_skin' | 'surgery' | 'postop_care';
  categoryLabel: string;
  price: number;
  regularPrice: number;
  savings: number;
  includedItems: string[];
  description: string;
  badge?: string;
  isSurgery?: boolean;
}

export const CLINIC_PRICE_LIST: ClinicPriceItem[] = [
  // -----------------------------------------------------------------------
  // 1. KONZULTÁCIE, HOSPITALIZÁCIA A SÁLOVÁ RÉŽIA
  // -----------------------------------------------------------------------
  {
    id: 'consultation',
    name: 'Odborná konzultácia (30–45 min)',
    price: 70,
    currency: '€',
    category: 'consultation_stay',
    categoryLabel: 'Konzultácia & Pobyt',
    description: 'Konzultácia s plastickým chirurgom / špecialistom estetickej medicíny, fotodokumentácia a plánovanie'
  },
  {
    id: 'hospitalization_1_day',
    name: 'Hospitalizácia - 1 deň',
    price: 200,
    currency: '€',
    category: 'consultation_stay',
    categoryLabel: 'Konzultácia & Pobyt',
    description: 'Pobyt na lôžku s 24-hodinovou sesterskou starostlivosťou a stravou'
  },
  {
    id: 'hospitalization_half_day',
    name: 'Hospitalizácia - 1/2 dňa',
    price: 100,
    currency: '€',
    category: 'consultation_stay',
    categoryLabel: 'Konzultácia & Pobyt',
    description: 'Ambulantné sledovanie na lôžku po menších výkonoch'
  },
  {
    id: 'premium_single_room',
    name: 'Nadštandardná samostatná lôžková izba',
    price: 30,
    currency: '€',
    category: 'consultation_stay',
    categoryLabel: 'Konzultácia & Pobyt',
    description: 'Príplatok za maximálne súkromie a samostatnú izbu'
  },
  {
    id: 'general_anesthesia_hour',
    name: 'Celková anestézia (každá začatá hodina)',
    price: 130,
    currency: '€',
    category: 'consultation_stay',
    categoryLabel: 'Konzultácia & Pobyt',
    description: 'Prítomnosť anesteziológa, anestéziologickej sestry a inhalačné anestetiká'
  },
  {
    id: 'surgical_reoperation_hour',
    name: 'Sálová korekcia / reoperácia do 12 mes. (1 hodina)',
    price: 350,
    currency: '€',
    category: 'consultation_stay',
    categoryLabel: 'Konzultácia & Pobyt',
    description: 'Korekcia vlastného výkonu: honorár lekára bezplatný, pacient hradí réžiu sály a anestéziu 350 €/hod'
  },
  {
    id: 'preoperative_exam',
    name: 'Predoperačné vyšetrenie na kľúč na klinike',
    price: 150,
    currency: '€',
    category: 'diagnostics',
    categoryLabel: 'Diagnostika & Vyšetrenia',
    description: 'Kompletné odbery krvi, biochémia, koagulácia, EKG a interné posúdenie pod jednou strechou'
  },

  // -----------------------------------------------------------------------
  // 2. CHIRURGIA RUKY
  // -----------------------------------------------------------------------
  {
    id: 'carpal_tunnel',
    name: 'Syndróm karpálneho tunela',
    price: 300,
    currency: '€',
    category: 'hand_surgery',
    categoryLabel: 'Chirurgia ruky',
    isSurgery: true,
    description: 'Ambulantná dekompresia n. medianus v lokálnej anestézii'
  },
  {
    id: 'trigger_finger',
    name: 'Skákavý prst',
    price: 200,
    currency: '€',
    category: 'hand_surgery',
    categoryLabel: 'Chirurgia ruky',
    isSurgery: true,
    description: 'Uvoľnenie šľachového pútka A1 v lokálnej anestézii'
  },
  {
    id: 'dupuytren_contracture',
    name: 'Dupuytrenova kontraktúra',
    price: 700,
    currency: '€',
    category: 'hand_surgery',
    categoryLabel: 'Chirurgia ruky',
    isSurgery: true,
    description: 'Selektívna fasciektómia palmárnej aponeurózy'
  },

  // -----------------------------------------------------------------------
  // 3. CHIRURGIA PRSNÍKOV (MAMMAPLASTIKA)
  // -----------------------------------------------------------------------
  {
    id: 'breast_augmentation_implants',
    name: 'Zväčšenie prsníkov silikónovými implantátmi (augmentácia)',
    price: 4100,
    currency: '€',
    category: 'breast_surgery',
    categoryLabel: 'Chirurgia prsníkov',
    isSurgery: true,
    description: 'Základná augmentácia vrátane štandardných implantátov a 1. kompresnej podprsenky Lipoelastic'
  },
  {
    id: 'b_lite_addon',
    name: 'B-lite implantáty (príplatok)',
    price: 1000,
    currency: '€',
    category: 'breast_surgery',
    categoryLabel: 'Chirurgia prsníkov',
    isSurgery: true,
    description: 'Odľahčené prémiové implantáty B-Lite znižujúce gravitáciu o 30 %'
  },
  {
    id: 'joy_addon',
    name: 'Joy implantáty Motiva Ergonomix 2 (príplatok)',
    price: 700,
    currency: '€',
    category: 'breast_surgery',
    categoryLabel: 'Chirurgia prsníkov',
    isSurgery: true,
    description: 'Najnovšia generácia implantátov Motiva s RFID čipom a prirodzenou adaptabilitou'
  },
  {
    id: 'preserve_addon',
    name: 'Preserve technika (príplatok)',
    price: 1500,
    currency: '€',
    category: 'breast_surgery',
    categoryLabel: 'Chirurgia prsníkov',
    isSurgery: true,
    description: 'Minimálne invazívna no-touch endoskopická technika bez drenáže a s rýchlym návratom'
  },
  {
    id: 'nipple_correction',
    name: 'Korekcia bradaviek',
    price: 600,
    currency: '€',
    category: 'breast_surgery',
    categoryLabel: 'Chirurgia prsníkov',
    isSurgery: true,
    description: 'Korekcia vpáčených alebo zväčšených bradaviek'
  },
  {
    id: 'breast_augmentation_fat',
    name: 'Zväčšenie prsníkov tukom (autoaugmentácia)',
    price: 3100,
    currency: '€',
    category: 'breast_surgery',
    categoryLabel: 'Chirurgia prsníkov',
    isSurgery: true,
    description: 'Liposukcia darcovskej oblasti a purifikovaný lipotransfer do prsníkov'
  },
  {
    id: 'breast_reduction',
    name: 'Zmenšenie prsníkov (redukcia)',
    price: 4100,
    currency: '€',
    category: 'breast_surgery',
    categoryLabel: 'Chirurgia prsníkov',
    isSurgery: true,
    description: 'Redukčná mammaplastika pri hypertrofii a bolestiach chrbta'
  },
  {
    id: 'mastopexy_lift',
    name: 'Lifting prsníkov (mastopexia)',
    price: 4100,
    currency: '€',
    category: 'breast_surgery',
    categoryLabel: 'Chirurgia prsníkov',
    isSurgery: true,
    description: 'Modelácia poklesnutého prsného tkaniva a úprava dvorcov'
  },
  {
    id: 'augmentation_mastopexy',
    name: 'Lifting prsníkov s implantátmi (augmentačná mastopexia)',
    price: 5500,
    currency: '€',
    category: 'breast_surgery',
    categoryLabel: 'Chirurgia prsníkov',
    isSurgery: true,
    description: 'Kombinovaný zákrok: modelácia tkaniva + zväčšenie silikónovým implantátom v jednej dobe'
  },
  {
    id: 'implant_removal',
    name: 'Odstránenie implantátov (samostatná explantácia)',
    price: 1500,
    currency: '€',
    category: 'breast_surgery',
    categoryLabel: 'Chirurgia prsníkov',
    isSurgery: true,
    description: 'Chirurgické vybratie implantátov'
  },
  {
    id: 'implant_removal_with_mastopexy',
    name: 'Odstránenie implantátov s modeláciou / kapsulektómiou',
    price: 3100,
    currency: '€',
    category: 'breast_surgery',
    categoryLabel: 'Chirurgia prsníkov',
    isSurgery: true,
    description: 'En-bloc alebo parciálna kapsulektómia spojená s novou modeláciou prsníkov'
  },
  {
    id: 'gynecomastia',
    name: 'Gynekomastia s liposukciou a žľazou',
    price: 2000,
    currency: '€',
    category: 'breast_surgery',
    categoryLabel: 'Chirurgia prsníkov',
    isSurgery: true,
    description: 'Chirurgické vybratie hypertrofickej prsnej žľazy v kombinácii s liposukciou okolia'
  },

  // -----------------------------------------------------------------------
  // 4. KONTÚROVANIE TELA, ABDOMINOPLASTIKA & LIPOSUKCIA
  // -----------------------------------------------------------------------
  {
    id: 'miniabdominoplasty',
    name: 'Miniabdominoplastika',
    price: 3000,
    currency: '€',
    category: 'body_contouring_liposuction',
    categoryLabel: 'Kontúrovanie tela & Liposukcia',
    isSurgery: true,
    description: 'Redukcia kožného previsu v podbrušku bez premiestnenia pupka'
  },
  {
    id: 'abdominoplasty_full',
    name: 'Abdominoplastika (kompletná redukcia kože brucha)',
    price: 4000,
    currency: '€',
    category: 'body_contouring_liposuction',
    categoryLabel: 'Kontúrovanie tela & Liposukcia',
    isSurgery: true,
    description: 'Kompletná plastika brucha s transpozíciou pupka a vypnutím brušnej steny'
  },
  {
    id: 'abdominoplasty_lipo_flanks',
    name: 'Abdominoplastika - liposukcia brucha a bokov (zvýhodnený add-on)',
    price: 600,
    currency: '€',
    category: 'body_contouring_liposuction',
    categoryLabel: 'Kontúrovanie tela & Liposukcia',
    isSurgery: true,
    description: 'Zvýhodnená balíková cena liposukcie bokov a pása pri realizácii abdominoplastiky'
  },
  {
    id: 'abdominoplasty_diastasis',
    name: 'Abdominoplastika - korekcia diastázy (príplatok)',
    price: 300,
    currency: '€',
    category: 'body_contouring_liposuction',
    categoryLabel: 'Kontúrovanie tela & Liposukcia',
    isSurgery: true,
    description: 'Aplikácia pevných stehov na priame brušné svaly pri ich rozostúpení'
  },
  {
    id: 'labioplasty',
    name: 'Labioplastika (redukcia malých pyskov ohanbia)',
    price: 1000,
    currency: '€',
    category: 'body_contouring_liposuction',
    categoryLabel: 'Kontúrovanie tela & Liposukcia',
    isSurgery: true,
    description: 'Estetická a funkčná úprava malých pyskov v lokálnej anestézii'
  },
  {
    id: 'liposuction_abdomen_flanks',
    name: 'Liposukcia brucha a bokov (samostatná)',
    price: 2500,
    currency: '€',
    category: 'body_contouring_liposuction',
    categoryLabel: 'Kontúrovanie tela & Liposukcia',
    isSurgery: true,
    description: 'Tumescentná liposukcia prednej brušnej steny a pásových valov'
  },
  {
    id: 'liposuction_360',
    name: '360° Liposukcia trupu (brucho, boky, driek, chrbát)',
    price: 3500,
    currency: '€',
    category: 'body_contouring_liposuction',
    categoryLabel: 'Kontúrovanie tela & Liposukcia',
    isSurgery: true,
    description: 'Kompletné cirkumferenčné kontúrovanie celého trupu pre úzky pás'
  },
  {
    id: 'liposuction_arms',
    name: 'Liposukcia paží',
    price: 1000,
    currency: '€',
    category: 'body_contouring_liposuction',
    categoryLabel: 'Kontúrovanie tela & Liposukcia',
    isSurgery: true
  },
  {
    id: 'liposuction_neck',
    name: 'Liposukcia podbradku a krku',
    price: 1000,
    currency: '€',
    category: 'body_contouring_liposuction',
    categoryLabel: 'Kontúrovanie tela & Liposukcia',
    isSurgery: true
  },
  {
    id: 'liposuction_bra_lines',
    name: 'Liposukcia bra lines (podprsenkových záhybov)',
    price: 1000,
    currency: '€',
    category: 'body_contouring_liposuction',
    categoryLabel: 'Kontúrovanie tela & Liposukcia',
    isSurgery: true
  },
  {
    id: 'liposuction_love_handles',
    name: 'Liposukcia love handles',
    price: 1000,
    currency: '€',
    category: 'body_contouring_liposuction',
    categoryLabel: 'Kontúrovanie tela & Liposukcia',
    isSurgery: true
  },
  {
    id: 'liposuction_inner_thighs',
    name: 'Liposukcia vnútorných stehien',
    price: 1000,
    currency: '€',
    category: 'body_contouring_liposuction',
    categoryLabel: 'Kontúrovanie tela & Liposukcia',
    isSurgery: true
  },
  {
    id: 'liposuction_outer_thighs',
    name: 'Liposukcia vonkajších stehien (rajtky)',
    price: 1000,
    currency: '€',
    category: 'body_contouring_liposuction',
    categoryLabel: 'Kontúrovanie tela & Liposukcia',
    isSurgery: true
  },
  {
    id: 'liposuction_knees',
    name: 'Liposukcia kolien',
    price: 1000,
    currency: '€',
    category: 'body_contouring_liposuction',
    categoryLabel: 'Kontúrovanie tela & Liposukcia',
    isSurgery: true
  },
  {
    id: 'liposuction_back',
    name: 'Liposukcia chrbta',
    price: 1000,
    currency: '€',
    category: 'body_contouring_liposuction',
    categoryLabel: 'Kontúrovanie tela & Liposukcia',
    isSurgery: true
  },
  {
    id: 'liposuction_other',
    name: 'Liposukcia - iná definovaná oblasť',
    price: 1000,
    currency: '€',
    category: 'body_contouring_liposuction',
    categoryLabel: 'Kontúrovanie tela & Liposukcia',
    isSurgery: true
  },
  {
    id: 'fat_transfer_under_200ml',
    name: 'Prenos tuku - Lipotransfer do 200 ml',
    price: 700,
    currency: '€',
    category: 'body_contouring_liposuction',
    categoryLabel: 'Kontúrovanie tela & Liposukcia',
    isSurgery: true
  },
  {
    id: 'fat_transfer_over_200ml',
    name: 'Prenos tuku - Lipotransfer nad 200 ml',
    price: 1500,
    currency: '€',
    category: 'body_contouring_liposuction',
    categoryLabel: 'Kontúrovanie tela & Liposukcia',
    isSurgery: true
  },
  {
    id: 'arm_lift',
    name: 'Lifting paží (brachioplastika)',
    price: 4500,
    currency: '€',
    category: 'body_contouring_liposuction',
    categoryLabel: 'Kontúrovanie tela & Liposukcia',
    isSurgery: true
  },
  {
    id: 'thigh_lift',
    name: 'Lifting stehien (kruroplastika)',
    price: 4500,
    currency: '€',
    category: 'body_contouring_liposuction',
    categoryLabel: 'Kontúrovanie tela & Liposukcia',
    isSurgery: true
  },
  {
    id: 'buttock_lift',
    name: 'Lifting zadku (gluteoplastika)',
    price: 4500,
    currency: '€',
    category: 'body_contouring_liposuction',
    categoryLabel: 'Kontúrovanie tela & Liposukcia',
    isSurgery: true
  },

  // -----------------------------------------------------------------------
  // 5. CHIRURGIA TVÁRE, VIEČOK, NOSA & UŠÍ
  // -----------------------------------------------------------------------
  {
    id: 'blepharoplasty_upper',
    name: 'Blefaroplastika horných viečok',
    price: 1000,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku',
    isSurgery: true,
    description: 'Chirurgická redukcia previsnutej kože a tuku horných viečok v lokálnej anestézii'
  },
  {
    id: 'blepharoplasty_brow_pexy',
    name: 'Blefaroplastika - záves obočia (brow-pexy)',
    price: 200,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku',
    isSurgery: true,
    description: 'Fixácia a nadvihnutie vonkajšej tretiny obočia cez incíziu horného viečka'
  },
  {
    id: 'blepharoplasty_ptosis_unilateral',
    name: 'Blefaroplastika - korekcia ptózy viečka (jednostranne)',
    price: 200,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku',
    isSurgery: true,
    description: 'Skrátenie levátora viečka pri poklese'
  },
  {
    id: 'blepharoplasty_lower',
    name: 'Blefaroplastika dolných viečok',
    price: 1100,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku',
    isSurgery: true,
    description: 'Odstránenie a redistribúcia tukových vačkov a prebytočnej kože dolných viečok'
  },
  {
    id: 'blepharoplasty_canthopexy',
    name: 'Blefaroplastika - záves viečka (kantopexia)',
    price: 200,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku',
    isSurgery: true,
    description: 'Spevnenie laterálneho očného väzu proti ektropiu'
  },
  {
    id: 'facelift_bleph_addon',
    name: 'Facelift - blefaroplastika (zvýhodnený add-on)',
    price: 600,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku',
    isSurgery: true,
    description: 'Zvýhodnená balíková cena blefaroplastiky viečok k faceliftu'
  },
  {
    id: 'deep_plane_facelift',
    name: 'Deep plane facelift',
    price: 5500,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku',
    isSurgery: true,
    description: 'Anatomická repozícia hlbokej vrstvy SMAS a uvoľnenie ligamentov bez ťahu na kožu'
  },
  {
    id: 'smas_macs_facelift',
    name: 'SMAS / MACS facelift',
    price: 3900,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku',
    isSurgery: true,
    description: 'Klasický lifting tváre s duplikáciou alebo plikáciou SMAS fascie'
  },
  {
    id: 'facelift_necklift_addon',
    name: 'Facelift - lifting krku (zvýhodnený add-on)',
    price: 1000,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku',
    isSurgery: true,
    description: 'Zvýhodnená cena platysmaplastiky a liftingu krku v kombinácii s faceliftom'
  },
  {
    id: 'facelift_fat_transfer_addon',
    name: 'Facelift - transplantácia tuku (zvýhodnený add-on)',
    price: 800,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku',
    isSurgery: true,
    description: 'Lipotransfer objemu do líc a kruhov pod očami v kombinácii s faceliftom'
  },
  {
    id: 'facelift_liplift_addon',
    name: 'Facelift - liplift (zvýhodnený add-on)',
    price: 600,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku',
    isSurgery: true
  },
  {
    id: 'facelift_browlift_addon',
    name: 'Facelift - lifting obočia (zvýhodnený add-on)',
    price: 1000,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku',
    isSurgery: true
  },
  {
    id: 'endoscopic_brow_midface_lift',
    name: 'Endoskopický lifting obočia a strednej časti tváre',
    price: 6000,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku',
    isSurgery: true
  },
  {
    id: 'endoscopic_brow_lift',
    name: 'Endoskopický lifting obočia',
    price: 2500,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku',
    isSurgery: true
  },
  {
    id: 'lip_lift',
    name: 'Lifting pier (lip lift bullhorn)',
    price: 900,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku',
    isSurgery: true,
    description: 'Skrátenie vzdialenosti medzi nosom a hornou perou'
  },
  {
    id: 'necklift_standalone',
    name: 'Necklift - lifting krku (samostatný)',
    price: 2500,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku',
    isSurgery: true
  },
  {
    id: 'buccal_fat_removal',
    name: 'Odstránenie tuku z líc (bukálna lipektómia / Bichat)',
    price: 900,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku',
    isSurgery: true
  },
  {
    id: 'facial_implants',
    name: 'Tvárové implantáty (brada, lícne kosti)',
    price: 3700,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku',
    isSurgery: true
  },
  {
    id: 'facial_lipofilling',
    name: 'Lipofilling tváre (samostatný)',
    price: 1300,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku',
    isSurgery: true
  },
  {
    id: 'otoplasty',
    name: 'Korekcia odstávajúcich ušníc (otoplastika obojstranne)',
    price: 1200,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku',
    isSurgery: true
  },
  {
    id: 'earlobe_correction',
    name: 'Korekcia ušného lalôčika',
    price: 300,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku',
    isSurgery: true
  },
  {
    id: 'septoplasty_turbinoplasty',
    name: 'Septoplastika s turbinoplastikou (samostatná)',
    price: 2500,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku',
    isSurgery: true
  },
  {
    id: 'rhinoplasty_tip',
    name: 'Úprava špičky nosa',
    price: 2500,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku',
    isSurgery: true
  },
  {
    id: 'rhinoplasty_tip_secondary',
    name: 'Úprava špičky nosa - sekundárna operácia',
    price: 1300,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku',
    isSurgery: true
  },
  {
    id: 'rhinoplasty_tip_secondary_rib',
    name: 'Úprava špičky nosa - sekundárna s chrupavkou rebra',
    price: 2000,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku',
    isSurgery: true
  },
  {
    id: 'rhinoplasty_complete',
    name: 'Kompletná rhinoplastika',
    price: 3800,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku',
    isSurgery: true,
    description: 'Kompletná estetická remodelácia nosa (kosť aj chrupavky)'
  },
  {
    id: 'rhinoplasty_complete_secondary',
    name: 'Kompletná rhinoplastika - sekundárna operácia (príplatok)',
    price: 1500,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku',
    isSurgery: true
  },
  {
    id: 'rhinoplasty_complete_rib_reconstruction',
    name: 'Kompletná rhinoplastika - rekonštrukcia z chrupavky rebra',
    price: 2500,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku',
    isSurgery: true
  },
  {
    id: 'rhinoplasty_septoplasty_addon',
    name: 'Kompletná rhinoplastika - septoplastika alebo turbinoplastika (add-on)',
    price: 500,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku',
    isSurgery: true,
    description: 'Funkčná korekcia priehradky v kombinácii s rhinoplastikou'
  },

  // -----------------------------------------------------------------------
  // 6. LASERY & PRÍSTROJOVÉ OŠETRENIA (DEKA Tetra CO2, IgniteRF, Cievny laser)
  // -----------------------------------------------------------------------
  {
    id: 'coolpeel_face',
    name: 'CoolPeel® (DEKA Tetra CO2) - celá tvár',
    price: 220,
    currency: '€',
    category: 'laser_devices',
    categoryLabel: 'Lasery & Prístroje ⚡',
    description: 'Subablatívny CO2 laser s ultra-krátkym pulzom, bez popálenia, nulový downtime a žiarivá pleť'
  },
  {
    id: 'coolpeel_package_3x',
    name: 'CoolPeel® (DEKA Tetra CO2) - kúra 3 ošetrenia',
    price: 590,
    currency: '€',
    category: 'laser_devices',
    categoryLabel: 'Lasery & Prístroje ⚡',
    description: 'Zvýhodnená kúra 3 ošetrení s odstupom 4 týždňov pre redukciu pórov a jemných liniek (platnosť 12 mes.)'
  },
  {
    id: 'coolpeel_face_neck_decollete',
    name: 'CoolPeel® (DEKA Tetra CO2) - tvár + krk + dekolt',
    price: 360,
    currency: '€',
    category: 'laser_devices',
    categoryLabel: 'Lasery & Prístroje ⚡',
    description: 'Komplexná rejuvenizácia celého dekoltu a tváre bez rekonvalescencie'
  },
  {
    id: 'co2_laser_face',
    name: 'Frakčný CO2 laser resurfacing (DEKA Tetra) - celá tvár',
    price: 380,
    currency: '€',
    category: 'laser_devices',
    categoryLabel: 'Lasery & Prístroje ⚡',
    description: 'Hĺbkový ablatívny frakčný resurfacing na jazvy po akné a hlbšie vrásky'
  },
  {
    id: 'co2_laser_face_neck_decollete',
    name: 'Frakčný CO2 laser resurfacing (DEKA Tetra) - tvár + krk + dekolt',
    price: 550,
    currency: '€',
    category: 'laser_devices',
    categoryLabel: 'Lasery & Prístroje ⚡',
    description: 'Radikálna obnova kolagénovej matrix a zjednotenie textúry'
  },
  {
    id: 'co2_laser_periorbital',
    name: 'Frakčný CO2 laser (DEKA Tetra) - očné okolie / viečka',
    price: 200,
    currency: '€',
    category: 'laser_devices',
    categoryLabel: 'Lasery & Prístroje ⚡',
    description: 'Neinvazívny laserový lifting pokožky očných viečok (Madonna lift)'
  },
  {
    id: 'co2_laser_scars_local',
    name: 'Frakčný CO2 laser (DEKA Tetra) - jazvy / strie lokálne',
    price: 120,
    currency: '€',
    category: 'laser_devices',
    categoryLabel: 'Lasery & Prístroje ⚡',
    description: 'Cielená laserová remodelácia chirurgických jaziev a strií'
  },
  {
    id: 'igniterf_face',
    name: 'IgniteRF rádiofrekvenčný microneedling - celá tvár',
    price: 420,
    currency: '€',
    category: 'laser_devices',
    categoryLabel: 'Lasery & Prístroje ⚡',
    description: 'Subkutánna rádiofrekvenčná stimulácia kolagénu s izolovanými mikroihlami'
  },
  {
    id: 'igniterf_face_neck',
    name: 'IgniteRF rádiofrekvenčný microneedling - tvár + krk + podbradok',
    price: 550,
    currency: '€',
    category: 'laser_devices',
    categoryLabel: 'Lasery & Prístroje ⚡',
    description: 'Vypnutie kontúr dolnej čeľuste, podbradku a krku'
  },
  {
    id: 'igniterf_package_3x',
    name: 'IgniteRF rádiofrekvenčný microneedling - balík 3 ošetrení',
    price: 1100,
    currency: '€',
    category: 'laser_devices',
    categoryLabel: 'Lasery & Prístroje ⚡',
    description: 'Plný cyklus 3 sedení pre maximálnu neogenézu elastínu a kolagénu (platnosť 12 mes.)'
  },
  {
    id: 'vascular_laser_nose',
    name: 'Cievny laser - nos / pavúčikovité cievky (lokálne)',
    price: 70,
    currency: '€',
    category: 'laser_devices',
    categoryLabel: 'Lasery & Prístroje ⚡',
    description: 'Odstránenie teleangiektázií na krídlach nosa a lícach'
  },
  {
    id: 'vascular_laser_face',
    name: 'Cievny laser - celá tvár (rosacea / difúzny erytém)',
    price: 160,
    currency: '€',
    category: 'laser_devices',
    categoryLabel: 'Lasery & Prístroje ⚡',
    description: 'Cievne zjednotenie tónu pleti a liečba začervenania'
  },
  {
    id: 'vascular_laser_scar',
    name: 'Cievny laser - včasné ošetrenie jazvy po operácii',
    price: 80,
    currency: '€',
    category: 'laser_devices',
    categoryLabel: 'Lasery & Prístroje ⚡',
    description: 'Zosvetlenie začervenanej jazvy v 4. – 8. týždni po operácii'
  },

  // -----------------------------------------------------------------------
  // 7. INJEKČNÁ & REGENERATÍVNA ESTETICKÁ MEDICÍNA
  // -----------------------------------------------------------------------
  {
    id: 'ha_05ml',
    name: 'Aplikácia kyseliny hyalurónovej - 0,5 ml',
    price: 180,
    currency: '€',
    category: 'injectables_aesthetics',
    categoryLabel: 'Injekčná estetika 💉',
    description: 'Jemná hydratácia pier alebo povrchových vrások'
  },
  {
    id: 'ha_1ml',
    name: 'Aplikácia kyseliny hyalurónovej - 1 ml',
    price: 290,
    currency: '€',
    category: 'injectables_aesthetics',
    categoryLabel: 'Injekčná estetika 💉',
    description: 'Prémiová sieťovaná HA (pery, nasolabiálne ryhy, lícne kosti)'
  },
  {
    id: 'ha_additional_ml',
    name: 'Aplikácia HA - 2. ml v rovnakom sedení (–10 % kombinačná zľava)',
    price: 261,
    currency: '€',
    category: 'injectables_aesthetics',
    categoryLabel: 'Injekčná estetika 💉',
    description: 'Zvýhodnená cena pre každý ďalší ml výplne v jednom sedení'
  },
  {
    id: 'material_addition_client_owned',
    name: 'Doplnenie už zakúpeného materiálu (aplikácia)',
    price: 50,
    currency: '€',
    category: 'injectables_aesthetics',
    categoryLabel: 'Injekčná estetika 💉',
    description: 'Aplikácia vopred odloženého materiálu do 4 týždňov'
  },
  {
    id: 'botox_1_area',
    name: 'Botox - 1 oblasť (kontrola a mikrodokorekcia do 14 dní v cene)',
    price: 120,
    currency: '€',
    category: 'injectables_aesthetics',
    categoryLabel: 'Injekčná estetika 💉',
    description: 'Glabela (vráska hnevu), čelo alebo očné vejáriky s bezplatnou kontrolou'
  },
  {
    id: 'botox_2_areas',
    name: 'Botox - 2 oblasti (–10 % kombinačná zľava)',
    price: 216,
    currency: '€',
    category: 'injectables_aesthetics',
    categoryLabel: 'Injekčná estetika 💉',
    description: 'Napr. čelo + glabela alebo glabela + očné vejáriky'
  },
  {
    id: 'botox_3_areas_full_upper',
    name: 'Botox - 3 oblasti / celá horná tretina (–10 % zľava)',
    price: 324,
    currency: '€',
    category: 'injectables_aesthetics',
    categoryLabel: 'Injekčná estetika 💉',
    description: 'Kompletná horná tretina: čelo, glabela a očné vejáriky'
  },
  {
    id: 'botox_hyperhidrosis_axilla',
    name: 'Botox - Odstránenie potenia v podpaží (hyperhidróza)',
    price: 400,
    currency: '€',
    category: 'injectables_aesthetics',
    categoryLabel: 'Injekčná estetika 💉',
    description: 'Blokáda potných žliaz na 6 až 9 mesiacov'
  },
  {
    id: 'botox_masseter_slimming',
    name: 'Botox - Zúženie tváre (Masseter bruxizmus)',
    price: 300,
    currency: '€',
    category: 'injectables_aesthetics',
    categoryLabel: 'Injekčná estetika 💉',
    description: 'Uvoľnenie žuvacieho svalu pri škrípaní zubov a zoštíhlenie sánky'
  },
  {
    id: 'rejuran_healer_2ml',
    name: 'Rejuran Healer (Polynukleotidy PN 2 ml - celá tvár)',
    price: 290,
    currency: '€',
    category: 'injectables_aesthetics',
    categoryLabel: 'Injekčná estetika 💉',
    description: 'Kórejský zlatý štandard biorevitalizácie: bunková oprava DNA, pružnosť a dermálna matrix'
  },
  {
    id: 'rejuran_i_eye_1ml',
    name: 'Rejuran I - Očné okolie (Polynukleotidy PN 1 ml)',
    price: 190,
    currency: '€',
    category: 'injectables_aesthetics',
    categoryLabel: 'Injekčná estetika 💉',
    description: 'Jemný PN špeciálne pre tenkú pokožku očných viečok, kruhy a jemné vejáriky'
  },
  {
    id: 'rejuran_s_scar_1ml',
    name: 'Rejuran S - Atrofické jazvy (Polynukleotidy PN 1 ml)',
    price: 190,
    currency: '€',
    category: 'injectables_aesthetics',
    categoryLabel: 'Injekčná estetika 💉',
    description: 'Hustý gél s vysokou viskozitou pre cielenú výplň vpadnutých jaziev po akné a operáciách'
  },
  {
    id: 'crystal_hydro_pdrn',
    name: 'Crystal Hydro PDRN (HA + PDRN 2 ml)',
    price: 210,
    currency: '€',
    category: 'injectables_aesthetics',
    categoryLabel: 'Injekčná estetika 💉',
    description: 'Hĺbková hydratácia nezosieťovanou HA kombinovaná s lososími nukleotidmi pre "glass skin"'
  },
  {
    id: 'exosomes_asce_face',
    name: 'Exozómy ASCE+ / ExoCoBio (tvár - infúzia po laseri / mikroneedling)',
    price: 320,
    currency: '€',
    category: 'injectables_aesthetics',
    categoryLabel: 'Injekčná estetika 💉',
    description: 'Lyofilizované kmeňové exozómy na bunkovú komunikáciu, protizápalové hojenie a tvorbu kolagénu'
  },
  {
    id: 'profhilo_2ml',
    name: 'Profhilo (bioremodelácia 2 ml - 5 BAP bodov)',
    price: 290,
    currency: '€',
    category: 'injectables_aesthetics',
    categoryLabel: 'Injekčná estetika 💉',
    description: 'Čistá termicky hybridná HA stimulujúca 4 typy kolagénu bez zmeny čŕt tváre'
  },
  {
    id: 'radiesse_1_5ml',
    name: 'Radiesse (hydroxyapatit vápenatý CaHA 1,5 ml)',
    price: 390,
    currency: '€',
    category: 'injectables_aesthetics',
    categoryLabel: 'Injekčná estetika 💉',
    description: 'Vektorový biostimulačný lifting kontúr sánky s dlhodobou tvorbou kolagénu I a III'
  },
  {
    id: 'philart_nucleofill',
    name: 'PhilArt / Nucleofill (Polynukleotidy 2 ml)',
    price: 300,
    currency: '€',
    category: 'injectables_aesthetics',
    categoryLabel: 'Injekčná estetika 💉',
    description: 'Hĺbkový bunkový biostimulátor na spevnenie strednej vrstvy kože'
  },
  {
    id: 'sculptra',
    name: 'Sculptra (kyselina poly-L-mliečna PLLA)',
    price: 450,
    currency: '€',
    category: 'injectables_aesthetics',
    categoryLabel: 'Injekčná estetika 💉',
    description: 'Globálna objemová kolagenéza s preukázaným účinkom až na 24 mesiacov'
  },
  {
    id: 'biorepeel_prx_t33',
    name: 'Medicínsky peeling BioRePeel / PRX-T33',
    price: 90,
    currency: '€',
    category: 'injectables_aesthetics',
    categoryLabel: 'Injekčná estetika 💉',
    description: 'Bipolárny biorevitalizačný peeling bez poškodenia epitelu a bez olupovania'
  },
  {
    id: 'tca_peel_medical',
    name: 'Lekársky chemický peeling TCA',
    price: 110,
    currency: '€',
    category: 'injectables_aesthetics',
    categoryLabel: 'Injekčná estetika 💉',
    description: 'Stredne hlboký peeling na melazmu, pigmentácie a fotostarnutie'
  },
  {
    id: 'dermapen_microneedling',
    name: 'Dermapen 4 / Lekársky microneedling s mezo-sérom',
    price: 140,
    currency: '€',
    category: 'injectables_aesthetics',
    categoryLabel: 'Injekčná estetika 💉',
    description: 'Mikroihličková mezoterapia s personalizovaným vitamínovým kokteilom'
  },
  {
    id: 'skinbooster_1ml',
    name: 'Skinbooster 1 ml (Restylane / Teosyal)',
    price: 300,
    currency: '€',
    category: 'injectables_aesthetics',
    categoryLabel: 'Injekčná estetika 💉',
    description: 'Hĺbková mikroskopická hydratácia dermis'
  },
  {
    id: 'hyaluronidase_150ui',
    name: 'Aplikácia hyaluronidázy 150 UI',
    price: 80,
    currency: '€',
    category: 'injectables_aesthetics',
    categoryLabel: 'Injekčná estetika 💉',
    description: 'Enzymatické rozpustenie nesprávne aplikovanej kyseliny hyalurónovej'
  },
  {
    id: 'corticosteroids_application',
    name: 'Kortikosteroidy (jazvy / keloidy)',
    price: 20,
    currency: '€',
    category: 'injectables_aesthetics',
    categoryLabel: 'Injekčná estetika 💉',
    description: 'Intraléziová aplikácia triamcinolónu na sploštenie hypertrofickej jazvy'
  },
  {
    id: 'say_preop_prep_kit',
    name: 'SAY Pre-Op Skin Barrier Prep Kit',
    price: 85,
    currency: '€',
    category: 'injectables_aesthetics',
    categoryLabel: 'Injekčná estetika 💉',
    description: 'Predoperačná príprava bariéry pleti (čistenie, antioxidanty a hydratácia)'
  },
  {
    id: 'say_postop_recovery_kit',
    name: 'SAY Post-Op Recovery Kit (masky, arnika, Lipoelastic scar gel, SPF 50+)',
    price: 95,
    currency: '€',
    category: 'injectables_aesthetics',
    categoryLabel: 'Injekčná estetika 💉',
    description: 'Kompletný domáci regeneračný set po estetických a chirurgických výkonoch'
  },

  // -----------------------------------------------------------------------
  // 8. POOPERAČNÉ MASÁŽE & LYMFODRENÁŽE PO LIPOSUKCIÁCH
  // -----------------------------------------------------------------------
  {
    id: 'manual_lymph_drainage_body_45m',
    name: 'Manuálna pooperačná lymfodrenáž tela (45 min)',
    price: 50,
    currency: '€',
    category: 'physio_lymph_massage',
    categoryLabel: 'Lymfodrenáže & Masáže 💆‍♀️',
    description: 'Cielená pooperačná manuálna lymfodrenáž po liposukcii brucha, bokov alebo stehien'
  },
  {
    id: 'manual_lymph_drainage_body_5x',
    name: 'Manuálna lymfodrenáž po liposukcii - kúra 5 sedení',
    price: 225,
    currency: '€',
    category: 'physio_lymph_massage',
    categoryLabel: 'Lymfodrenáže & Masáže 💆‍♀️',
    description: 'Zvýhodnená kúra 5 sedení pre rýchly ústup opuchov a podliatin (platnosť 12 mes.)'
  },
  {
    id: 'manual_lymph_drainage_body_10x',
    name: 'Manuálna lymfodrenáž po liposukcii - kúra 10 sedení',
    price: 420,
    currency: '€',
    category: 'physio_lymph_massage',
    categoryLabel: 'Lymfodrenáže & Masáže 💆‍♀️',
    description: 'Odporúčaný plný protokol pre hladké podkožie a prevenciu nerovností po liposukcii'
  },
  {
    id: 'pressotherapy_lymphoven_45m',
    name: 'Prístrojová presoterapia / Lymfoven (45 min)',
    price: 35,
    currency: '€',
    category: 'physio_lymph_massage',
    categoryLabel: 'Lymfodrenáže & Masáže 💆‍♀️',
    description: 'Prístrojová tlaková lymfodrenáž dolných končatín a brucha'
  },
  {
    id: 'pressotherapy_lymphoven_10x',
    name: 'Prístrojová presoterapia / Lymfoven - kúra 10 sedení',
    price: 290,
    currency: '€',
    category: 'physio_lymph_massage',
    categoryLabel: 'Lymfodrenáže & Masáže 💆‍♀️',
    description: 'Zvýhodnený balík 10 prístrojových sedení na ťažké nohy a opuchy'
  },
  {
    id: 'facial_postop_lymph_drainage_30m',
    name: 'Tvárová pooperačná lymfodrenáž (30 min)',
    price: 35,
    currency: '€',
    category: 'physio_lymph_massage',
    categoryLabel: 'Lymfodrenáže & Masáže 💆‍♀️',
    description: 'Šetrná manuálna drenáž po facelifte, blefaroplastike a rhinoplastike'
  },
  {
    id: 'facial_postop_lymph_drainage_5x',
    name: 'Tvárová pooperačná lymfodrenáž - kúra 5 sedení',
    price: 150,
    currency: '€',
    category: 'physio_lymph_massage',
    categoryLabel: 'Lymfodrenáže & Masáže 💆‍♀️',
    description: 'Kúra znižujúca pooperačný opuch tváre o 50 % rýchlejšie'
  },
  {
    id: 'scar_tissue_remodeling_massage_30m',
    name: 'Tlaková masáž a remodelácia jaziev (30 min)',
    price: 35,
    currency: '€',
    category: 'physio_lymph_massage',
    categoryLabel: 'Lymfodrenáže & Masáže 💆‍♀️',
    description: 'Odborná mäkká technika a tlaková masáž zamedzujúca zrastom a tuhnutiu jaziev'
  },

  // -----------------------------------------------------------------------
  // 9. SKINCARE & DERMOKOZMETIKA (SkinCeuticals, La Roche-Posay, CeraVe, Vichy)
  // -----------------------------------------------------------------------
  {
    id: 'sc_ce_ferulic',
    name: 'SkinCeuticals C E Ferulic (30 ml)',
    price: 175,
    currency: '€',
    category: 'skincare_cosmetics',
    categoryLabel: 'Skincare & Kozmetika 🧴',
    description: 'Patentované antioxidačné sérum s 15% čistým vitamínom C, vit. E a kyselinou ferulovou'
  },
  {
    id: 'sc_phloretin_cf',
    name: 'SkinCeuticals Phloretin CF (30 ml)',
    price: 175,
    currency: '€',
    category: 'skincare_cosmetics',
    categoryLabel: 'Skincare & Kozmetika 🧴',
    description: 'Antioxidačné sérum pre normálnu až mastnú pleť s pigmentovými nerovnosťami'
  },
  {
    id: 'sc_ha_intensifier',
    name: 'SkinCeuticals H.A. Intensifier (30 ml)',
    price: 118,
    currency: '€',
    category: 'skincare_cosmetics',
    categoryLabel: 'Skincare & Kozmetika 🧴',
    description: 'Viacúčelové sérum s obsahom Proxylane, ktoré zvyšuje hladinu HA v pleti o 30 %'
  },
  {
    id: 'sc_triple_lipid_restore',
    name: 'SkinCeuticals Triple Lipid Restore 2:4:2 (48 ml)',
    price: 155,
    currency: '€',
    category: 'skincare_cosmetics',
    categoryLabel: 'Skincare & Kozmetika 🧴',
    description: 'Bariérový rekonštrukčný krém s patentovaným pomerom ceramidov, cholesterolu a mastných kyselín'
  },
  {
    id: 'sc_epidermal_repair',
    name: 'SkinCeuticals Epidermal Repair (40 ml)',
    price: 85,
    currency: '€',
    category: 'skincare_cosmetics',
    categoryLabel: 'Skincare & Kozmetika 🧴',
    description: 'SOS regeneračný krém špeciálne po frakčných laseroch, operáciách a chemických peelingoch'
  },
  {
    id: 'sc_soothing_cleanser',
    name: 'SkinCeuticals Soothing Cleanser (150 ml)',
    price: 46,
    currency: '€',
    category: 'skincare_cosmetics',
    categoryLabel: 'Skincare & Kozmetika 🧴',
    description: 'Upokojujúca čistiaca pena s orchideou a uhorkou pre reaktívnu pleť'
  },
  {
    id: 'sc_advanced_brightening_spf50',
    name: 'SkinCeuticals Advanced Brightening UV Defense SPF 50+ (40 ml)',
    price: 46,
    currency: '€',
    category: 'skincare_cosmetics',
    categoryLabel: 'Skincare & Kozmetika 🧴',
    description: 'Medicínsky fluid s kyselinou tranexamovou zabraňujúci pozápalovým hyperpigmentáciám'
  },
  {
    id: 'sc_retinol_03',
    name: 'SkinCeuticals Retinol 0.3 (30 ml)',
    price: 98,
    currency: '€',
    category: 'skincare_cosmetics',
    categoryLabel: 'Skincare & Kozmetika 🧴',
    description: 'Enkapsulovaný čistý retinol na stimuláciu obnovy buniek a vyhladenie textúry'
  },
  {
    id: 'sc_phyto_corrective',
    name: 'SkinCeuticals Phyto Corrective Gel (30 ml)',
    price: 78,
    currency: '€',
    category: 'skincare_cosmetics',
    categoryLabel: 'Skincare & Kozmetika 🧴',
    description: 'Upokojujúce hydratačné gélové sérum s botanickými extraktmi na redukciu začervenania, cievneho erytému a upokojenie reaktívnej pleti'
  },
  {
    id: 'lrp_cicaplast_b5_100ml',
    name: 'La Roche-Posay Cicaplast Baume B5+ (100 ml)',
    price: 18,
    currency: '€',
    category: 'skincare_cosmetics',
    categoryLabel: 'Skincare & Kozmetika 🧴',
    description: 'Upokojujúci bariérový balzam s madecassoside a pantenolom na jazvičky a rany'
  },
  {
    id: 'lrp_toleriane_cleanser_200ml',
    name: 'La Roche-Posay Toleriane Dermo-Cleanser (200 ml)',
    price: 18,
    currency: '€',
    category: 'skincare_cosmetics',
    categoryLabel: 'Skincare & Kozmetika 🧴',
    description: 'Hypoalergénna fyziologická čistiaca emulzia pre citlivú pleť pred aj po zákrokoch'
  },
  {
    id: 'lrp_anthelios_uvmune_spf50',
    name: 'La Roche-Posay Anthelios UVMune 400 SPF 50+ (50 ml)',
    price: 22,
    currency: '€',
    category: 'skincare_cosmetics',
    categoryLabel: 'Skincare & Kozmetika 🧴',
    description: 'Maximálna ultra-širokospektrálna ochrana pred UVA lúčmi chrániaca hojace sa tkanivá'
  },
  {
    id: 'lrp_hyalu_b5_serum',
    name: 'La Roche-Posay Hyalu B5 Sérum (30 ml)',
    price: 42,
    currency: '€',
    category: 'skincare_cosmetics',
    categoryLabel: 'Skincare & Kozmetika 🧴',
    description: 'Intenzívne regeneračné sérum s dvoma typmi čistej kyseliny hyalurónovej'
  },
  {
    id: 'cerave_hydrating_cleanser',
    name: 'CeraVe Hydratačná čistiaca emulzia (236 ml)',
    price: 14,
    currency: '€',
    category: 'skincare_cosmetics',
    categoryLabel: 'Skincare & Kozmetika 🧴',
    description: 'Šetrné čistenie s 3 esenciálnymi ceramidmi bez narušenia kožnej bariéry'
  },
  {
    id: 'cerave_moisturising_cream',
    name: 'CeraVe Hydratačný krém (177 ml)',
    price: 17,
    currency: '€',
    category: 'skincare_cosmetics',
    categoryLabel: 'Skincare & Kozmetika 🧴',
    description: 'Bohatý krém s postupným uvoľňovaním hydratácie MVE pre suché partie'
  },
  {
    id: 'vichy_mineral_89',
    name: 'Vichy Minéral 89 Hyaluron Booster (50 ml)',
    price: 26,
    currency: '€',
    category: 'skincare_cosmetics',
    categoryLabel: 'Skincare & Kozmetika 🧴',
    description: '89% vulkanická voda Vichy s prírodnou HA na posilnenie obranyschopnosti kože'
  },
  {
    id: 'vichy_liftactiv_collagen',
    name: 'Vichy Liftactiv Collagen Specialist (50 ml)',
    price: 44,
    currency: '€',
    category: 'skincare_cosmetics',
    categoryLabel: 'Skincare & Kozmetika 🧴',
    description: 'Anti-aging denný krém s pro-kolagénovými peptidmi na spevnenie pleti'
  },

  // -----------------------------------------------------------------------
  // 10. DERMATOCHIRURGIA & HISTOLÓGIA
  // -----------------------------------------------------------------------
  {
    id: 'nevus_removal',
    name: 'Odstránenie znamienka (chirurgická excízia so šitím)',
    price: 90,
    currency: '€',
    category: 'dermatosurgery',
    categoryLabel: 'Dermatochirurgia 🔬',
    description: 'Chirurgické vybratie podozrivého alebo esteticky rušivého kožného névu'
  },
  {
    id: 'histology_exam',
    name: 'Histologické vyšetrenie',
    price: 30,
    currency: '€',
    category: 'dermatosurgery',
    categoryLabel: 'Dermatochirurgia 🔬',
    description: 'Histopatologické posúdenie odobratej vzorky v akreditovanom laboratóriu'
  },
  {
    id: 'subcutaneous_tumor_removal',
    name: 'Odstránenie podkožného útvaru (lipóm, ateróm, ganglión)',
    price: 130,
    currency: '€',
    category: 'dermatosurgery',
    categoryLabel: 'Dermatochirurgia 🔬',
    description: 'Kompletná exstirpácia benígneho podkožného nádorčeka s puzdrom'
  },
  {
    id: 'tumor_removal_flap_graft',
    name: 'Odstránenie útvaru s nutnosťou lalokovej plastiky alebo transplantátu',
    price: 400,
    currency: '€',
    category: 'dermatosurgery',
    categoryLabel: 'Dermatochirurgia 🔬',
    description: 'Zložitá rekonštrukcia kožného defektu miestnym lalokovým posunom'
  },

  // -----------------------------------------------------------------------
  // 11. KOMPRESNÁ BIELIZEŇ & POOPERAČNÁ STAROSTLIVOSŤ (LIPOELASTIC)
  // -----------------------------------------------------------------------
  {
    id: 'lipoelastic_pi_ideal',
    name: 'PI ideal - kompresná podprsenka',
    price: 60,
    currency: '€',
    category: 'compression_garments',
    categoryLabel: 'Kompresná bielizeň (Lipoelastic) 👗'
  },
  {
    id: 'lipoelastic_pi_relax',
    name: 'PI relax - kompresná podprsenka',
    price: 75,
    currency: '€',
    category: 'compression_garments',
    categoryLabel: 'Kompresná bielizeň (Lipoelastic) 👗'
  },
  {
    id: 'lipoelastic_pi_filling',
    name: 'PI filling - podprsenka po lipotransfere',
    price: 70,
    currency: '€',
    category: 'compression_garments',
    categoryLabel: 'Kompresná bielizeň (Lipoelastic) 👗'
  },
  {
    id: 'lipoelastic_pu_03',
    name: 'PU 03 - stabilizačný prsný pás',
    price: 30,
    currency: '€',
    category: 'compression_garments',
    categoryLabel: 'Kompresná bielizeň (Lipoelastic) 👗'
  },
  {
    id: 'lipoelastic_vh_special_comfort',
    name: 'VH special comfort - brušná bandáž',
    price: 75,
    currency: '€',
    category: 'compression_garments',
    categoryLabel: 'Kompresná bielizeň (Lipoelastic) 👗'
  },
  {
    id: 'lipoelastic_vh_body_variant',
    name: 'VH body variant',
    price: 75,
    currency: '€',
    category: 'compression_garments',
    categoryLabel: 'Kompresná bielizeň (Lipoelastic) 👗'
  },
  {
    id: 'lipoelastic_vd_comfort',
    name: 'VD comfort - celotelová bandáž',
    price: 115,
    currency: '€',
    category: 'compression_garments',
    categoryLabel: 'Kompresná bielizeň (Lipoelastic) 👗'
  },
  {
    id: 'lipoelastic_vf_body_comfort',
    name: 'VF body / body comfort',
    price: 90,
    currency: '€',
    category: 'compression_garments',
    categoryLabel: 'Kompresná bielizeň (Lipoelastic) 👗'
  },
  {
    id: 'lipoelastic_mtms_comf',
    name: 'MTmS comf - pánska hrudná vesta',
    price: 80,
    currency: '€',
    category: 'compression_garments',
    categoryLabel: 'Kompresná bielizeň (Lipoelastic) 👗'
  },
  {
    id: 'lipoelastic_kplus',
    name: 'KPlus - elastický spevňujúci pás po abdominoplastike',
    price: 50,
    currency: '€',
    category: 'compression_garments',
    categoryLabel: 'Kompresná bielizeň (Lipoelastic) 👗'
  },
  {
    id: 'lipoelastic_fm',
    name: 'FM - tvárová elastická bandáž po facelifte',
    price: 50,
    currency: '€',
    category: 'compression_garments',
    categoryLabel: 'Kompresná bielizeň (Lipoelastic) 👗'
  },
  {
    id: 'lipoelastic_ps_ideal',
    name: 'PS ideal',
    price: 75,
    currency: '€',
    category: 'compression_garments',
    categoryLabel: 'Kompresná bielizeň (Lipoelastic) 👗'
  },
  {
    id: 'lipoelastic_gel',
    name: 'Lipoelastic silikónový gél na jazvy (100% medicínsky silikón)',
    price: 35,
    currency: '€',
    category: 'compression_garments',
    categoryLabel: 'Kompresná bielizeň (Lipoelastic) 👗'
  }
];

// =========================================================================
// OFICIÁLNE BALÍKY SAY CLINIC (Basic vs. Premium)
// =========================================================================

export const CLINIC_PACKAGES: ClinicPackageItem[] = [
  // 1. POOPERAČNÁ PÉČA & NPWT
  {
    id: 'say_advanced_postop_npwt',
    name: 'SAY Advanced Post-Op Surgery & NPWT Package',
    tier: 'premium',
    category: 'postop_care',
    categoryLabel: 'Pooperačná starostlivosť & NPWT',
    price: 890,
    regularPrice: 1150,
    savings: 260,
    includedItems: [
      'PICO / NPWT jednorazový podtlakový systém na incíziu (prevencia dehiscencie a hematómu)',
      'Lipoelastic kompresná bielizeň + prídavný spevňujúci pás KPlus',
      'Lipoelastic 100% medicínsky silikónový gél na jazvy',
      '2x pooperačné ošetrenie jazvy cievnym laserom (v 4. a 8. týždni)',
      'Prednostné bezplatné pooperačné preväzy a kontrolné konzultácie'
    ],
    description: 'Špičková nemocničná pooperačná starostlivosť pre veľkú chirurgiu tela (abdominoplastika, redukcia prsníkov, body lift). Priamy náklad kliniky ~600 €.',
    badge: 'Univerzitný štandard hojenia',
    isSurgery: true
  },
  {
    id: 'say_postop_recovery_care',
    name: 'SAY Post-Op Recovery Care (Tvár & Viečka)',
    tier: 'basic',
    category: 'postop_care',
    categoryLabel: 'Pooperačná starostlivosť & NPWT',
    price: 160,
    regularPrice: 260,
    savings: 100,
    includedItems: [
      'Náhradná Lipoelastic tvárová bandáž FM / ohlávka',
      'Lipoelastic silikónový gél na jazvy',
      'Sterilné chladivé masky a gélové kompresy na viečka',
      '2x cievny laser na urýchlenie vyblednutia rezu v okolí očí/ušníc'
    ],
    description: 'Pooperačný balíček pre pacientov po facelifte, operácii viečok alebo nosa.'
  },
  {
    id: 'lipo_recovery_care_basic',
    name: 'Lipo Recovery Care (5x Lymfodrenáž po liposukcii)',
    tier: 'basic',
    category: 'postop_care',
    categoryLabel: 'Pooperačná starostlivosť & NPWT',
    price: 240,
    regularPrice: 285,
    savings: 45,
    includedItems: [
      '5x cielená manuálna pooperačná lymfodrenáž tela (45 min)',
      'Lipoelastic silikónový gél na drobné jazvičky po kanylách'
    ],
    description: 'Základná pooperačná kúra pre rýchly ústup opuchov po liposukcii brucha, bokov alebo stehien.'
  },
  {
    id: 'lipo_recovery_total_premium',
    name: 'Lipo Recovery Total (10x Lymfodrenáž + Presoterapia)',
    tier: 'premium',
    category: 'postop_care',
    categoryLabel: 'Pooperačná starostlivosť & NPWT',
    price: 440,
    regularPrice: 570,
    savings: 130,
    includedItems: [
      '10x manuálna pooperačná lymfodrenáž tela (45 min)',
      '2x prístrojový Lymfoven na nohy a pás',
      'Lipoelastic silikónový gél na jazvy'
    ],
    description: 'Kompletný 5-týždňový pooperačný protokol garantujúci dokonale hladké podkožie a prevenciu fibrózy.',
    badge: 'Odporúčané po liposukcii'
  },

  // 2. SKINCARE
  {
    id: 'skincare_basic_set',
    name: 'Basic Skincare Barrier Set (La Roche-Posay / CeraVe)',
    tier: 'basic',
    category: 'skincare',
    categoryLabel: 'Skincare & Príprava',
    price: 50,
    regularPrice: 58,
    savings: 8,
    includedItems: [
      'La Roche-Posay Toleriane Dermo-Cleanser (čistiaca emulzia)',
      'La Roche-Posay Cicaplast Baume B5+ (upokojujúci balzam)',
      'La Roche-Posay Anthelios UVMune 400 SPF 50+ (ochrana pred UV)'
    ],
    description: 'Základná jemná fyziologická bariérová rutina pred a po zákrokoch bez dráždenia.'
  },
  {
    id: 'skincare_premium_medical',
    name: 'Premium Medical Skincare Protocol (SkinCeuticals)',
    tier: 'premium',
    category: 'skincare',
    categoryLabel: 'Skincare & Príprava',
    price: 260,
    regularPrice: 320,
    savings: 60,
    includedItems: [
      'SkinCeuticals Soothing Cleanser čistiaca pena',
      'SkinCeuticals C E Ferulic (patentovaný 15% vitamín C)',
      'SkinCeuticals Triple Lipid Restore 2:4:2 bariérový krém',
      'SkinCeuticals Advanced Brightening UV Defense SPF 50+'
    ],
    description: 'Zlatý štandard dermatológie: silná antioxidačná ochrana buniek a trojitá obnova lipidov pre rýchlejšie hojenie.',
    badge: 'Medical-Grade špička'
  },

  // 3. OČNÉ OKOLIE & VIEČKA
  {
    id: 'total_periorbital_lift',
    name: 'Premium Total Periorbital Lift (Surgical)',
    tier: 'premium',
    category: 'periorbital',
    categoryLabel: 'Očné okolie & Viečka',
    price: 1950,
    regularPrice: 2500,
    savings: 550,
    includedItems: [
      'Blefaroplastika dolných viečok (1 100 €)',
      'Kantopexia - spevnenie väzu kútika proti ektropiu (200 €)',
      'Mikro-lipofilling kruhov pod očami (800 €)',
      'Včasné ošetrenie jaziev cievnym/frakčným laserom (80 €)',
      'SAY Post-Op Recovery Kit s chladivými maskami'
    ],
    description: 'Komplexná periorbitálna transformácia: odstránenie vačkov, fixácia kútika a obnovenie strateného objemu slzného žliabku.',
    badge: 'Najobľúbenejší balík očí',
    isSurgery: true
  },
  {
    id: 'nonsurgical_eye_glow',
    name: 'Non-Surgical Eye Glow (Neinvazívne viečka)',
    tier: 'premium',
    category: 'periorbital',
    categoryLabel: 'Očné okolie & Viečka',
    price: 450,
    regularPrice: 530,
    savings: 80,
    includedItems: [
      'Rejuran I - očné polynukleotidy 1 ml na tmavé kruhy a zosvetlenie',
      'CoolPeel® DEKA Tetra laserové spevnenie viečok bez rezania',
      'Mezobotox očných vejárikov (1 oblasť) s kontrolou do 14 dní'
    ],
    description: 'Neinvazívny refresh očného okolia pre klientov, ktorí ešte nepotrebujú chirurgický rez.'
  },

  // 4. INJEKCIE & BIOSTIMULÁCIA
  {
    id: 'rejuran_cure_restart',
    name: 'Rejuran Bunkový Reštart (Kúra 2 sedenia)',
    tier: 'premium',
    category: 'injectables',
    categoryLabel: 'Injekčná estetika & Biostimulácia',
    price: 520,
    regularPrice: 580,
    savings: 60,
    includedItems: [
      '1. sedenie: Rejuran Healer (polynukleotidy PN 2 ml)',
      '2. sedenie: Rejuran Healer (polynukleotidy PN 2 ml) s odstupom 3-4 týždňov',
      'Upokojujúca regeneračná maska po každej aplikácii'
    ],
    description: 'Kompletná bunková kúra polynukleotidov stimulujúca fibroblasty a syntézu vlastného kolagénu.'
  },
  {
    id: 'sculptra_collagen_duo',
    name: 'Sculptra Collagen Neogenesis Duo (2 ampulky)',
    tier: 'premium',
    category: 'injectables',
    categoryLabel: 'Injekčná estetika & Biostimulácia',
    price: 820,
    regularPrice: 950,
    savings: 130,
    includedItems: [
      '2 ampulky kyseliny poly-L-mliečnej Sculptra PLLA',
      'Personalizované vektorové vejárové podanie kanylou',
      'Inštruktáž masážneho pravidla 5-5-5 a domáci masážny gél'
    ],
    description: 'Najsilnejšia kolagenéza: masívna tvorba vlastného kolagénu s trvaním až 24 mesiacov.'
  },
  {
    id: 'cellular_matrix_booster',
    name: 'Cellular Matrix Booster (Profhilo + Crystal Hydro)',
    tier: 'premium',
    category: 'injectables',
    categoryLabel: 'Injekčná estetika & Biostimulácia',
    price: 440,
    regularPrice: 500,
    savings: 60,
    includedItems: [
      'Profhilo hybridná bioremodelácia 2 ml (5 BAP bodov)',
      'Crystal Hydro PDRN 2 ml s lososími nukleotidmi a nezosieťovanou HA'
    ],
    description: 'Dvojitý účinok: okamžitý lifting kontúr Profhilo + hlboká bunková hydratácia Crystal Hydro.'
  },

  // 5. LASERY & PLEŤ
  {
    id: 'laser_stem_cell_renewal',
    name: 'Stem-Cell Laser Renewal (CoolPeel® + Exozómy ASCE+)',
    tier: 'premium',
    category: 'laser_skin',
    categoryLabel: 'Lasery & Pleťové omladenie',
    price: 490,
    regularPrice: 640,
    savings: 150,
    includedItems: [
      'CoolPeel® DEKA Tetra CO2 laser celá tvár',
      'Okamžitá infúzia kmeňových Exozómov ASCE+ do otvorených mikrokanálov',
      'Post-laserová sterilná chladivá maska'
    ],
    description: 'Kombinácia lasera a exozómov skracuje dobu začervenania zo 7 dní na 48 hodín a násobí novotvorbu elastínu.',
    badge: 'Globálny hit 2026'
  },

  // 6. CHIRURGICKÉ SÁLOVÉ BALÍKY (Add-on zľavy)
  {
    id: 'deep_face_neck_mastery',
    name: 'Deep Face & Neck Mastery (Chirurgický sálový balík)',
    tier: 'premium',
    category: 'surgery',
    categoryLabel: 'Chirurgické operácie na sále',
    price: 7900,
    regularPrice: 10400,
    savings: 2500,
    includedItems: [
      'Deep Plane Facelift (5 500 €)',
      'Lifting krku / Necklift s platysmaplastikou (1 000 € namiesto 2 500 €)',
      'Blefaroplastika viečok v kombinácii (600 € namiesto 1 000 €)',
      'Lipotransfer tváre a líc v kombinácii (800 € namiesto 1 300 €)',
      '1. kompresná ohlávka Lipoelastic FM v cene'
    ],
    description: 'Definitívne omladenie celej tváre a krku v jednej anestézii s maximálnou úsporou 2 500 €.',
    badge: 'Signature zákrok kliniky',
    isSurgery: true
  },
  {
    id: 'smas_face_refresh',
    name: 'SMAS Face Refresh (Chirurgický sálový balík)',
    tier: 'basic',
    category: 'surgery',
    categoryLabel: 'Chirurgické operácie na sále',
    price: 5500,
    regularPrice: 7500,
    savings: 2000,
    includedItems: [
      'SMAS / MACS Facelift (3 900 €)',
      'Lifting krku v kombinácii (1 000 € namiesto 2 500 €)',
      'Blefaroplastika viečok v kombinácii (600 € namiesto 1 000 €)',
      '1. kompresná ohlávka Lipoelastic FM v cene'
    ],
    description: 'Klasický sálový refresh strednej a dolnej tretiny tváre a viečok.',
    isSurgery: true
  },
  {
    id: 'abdomen_360_sculpt',
    name: 'Abdomen 360 Sculpt (Chirurgický sálový balík)',
    tier: 'premium',
    category: 'surgery',
    categoryLabel: 'Chirurgické operácie na sále',
    price: 4900,
    regularPrice: 6800,
    savings: 1900,
    includedItems: [
      'Abdominoplastika kompletná s transpozíciou pupka (4 000 €)',
      'Liposukcia brucha a bokov v kombinácii (600 € namiesto 2 500 €)',
      'Korekcia diastázy priamych svalov (300 €)',
      '1. pooperačný brušný pás Lipoelastic v cene'
    ],
    description: 'Kompletná plastika brucha s vyrysovaním pásu v jednej operácii.',
    badge: 'Top pre mamičky po pôrode',
    isSurgery: true
  },
  {
    id: 'rhinoseptoplasty_total',
    name: 'Rhinoseptoplasty Total (Estetika & Dýchanie)',
    tier: 'premium',
    category: 'surgery',
    categoryLabel: 'Chirurgické operácie na sále',
    price: 4300,
    regularPrice: 6300,
    savings: 2000,
    includedItems: [
      'Kompletná rhinoplastika nosa (3 800 €)',
      'Septoplastika / turbinoplastika nosovej priehradky (500 € namiesto 2 500 €)'
    ],
    description: 'Kombinované riešenie: dokonalý tvar nosa z vonku a voľné dýchanie z vnútra.',
    isSurgery: true
  },
  {
    id: 'mommy_makeover_classic',
    name: 'Mommy Makeover Classic (Prsníky + Brucho)',
    tier: 'basic',
    category: 'surgery',
    categoryLabel: 'Chirurgické operácie na sále',
    price: 7300,
    regularPrice: 8300,
    savings: 1000,
    includedItems: [
      'Zväčšenie prsníkov implantátmi (4 100 €)',
      'Abdominoplastika kompletná v kombinácii (3 200 € namiesto 4 000 €)',
      'Pooperačná bielizeň Lipoelastic v cene'
    ],
    description: 'Základná obnova postavy po pôrodoch: plný dekolt a pevné ploché bruško.',
    isSurgery: true
  },
  {
    id: 'mommy_makeover_signature',
    name: 'Mommy Makeover Signature (Premium)',
    tier: 'premium',
    category: 'surgery',
    categoryLabel: 'Chirurgické operácie na sále',
    price: 10100,
    regularPrice: 12300,
    savings: 2200,
    includedItems: [
      'Augmentačná mastopexia - modelácia s implantátmi (5 500 €)',
      'B-Lite odľahčené implantáty (+1 000 €)',
      'Abdominoplastika s diastázou a liposukciou bokov (3 600 € namiesto 4 900 €)',
      'Kompletný kompresný set Lipoelastic (podprsenka + pás)'
    ],
    description: 'Najvyšší prémiový štandard: modelácia poprsia odľahčenými implantátmi B-Lite spojená s kompletnou abdominoplastikou a liposukciou bokov.',
    badge: 'Kráľovský balík',
    isSurgery: true
  }
];

// =========================================================================
// POMOCNÉ FUNKCIE PRE PRÁCU S CENNÍKOM & VERNOSTNÝM SYSTÉMOM
// =========================================================================

/**
 * Zistí, či kategória spadá pod operácie na sále (kde neplatia vernostné zľavy)
 */
export function isSurgeryCategory(category: string): boolean {
  return [
    'face_surgery',
    'breast_surgery',
    'body_contouring_liposuction',
    'hand_surgery'
  ].includes(category);
}

/**
 * Vypočíta cenu podľa vernostnej kategórie (Basic 0%, Premium -5%, VIP -10%)
 * Pravidlo: Zľavy neplatia na chirurgické operácie na sále ani na hospitalizáciu/anestéziu.
 * Zľavy platia na estetiku, lasery, biostimulátory, dermatochirurgiu, konzultáciu, masáže a skincare.
 * Všetky sumy sa zaokrúhľujú na celé eurá.
 */
export function calculateLoyaltyPrice(
  basePrice: number,
  category: string,
  tier: 'basic' | 'premium' | 'vip'
): number {
  if (tier === 'basic' || isSurgeryCategory(category)) {
    return basePrice;
  }

  // Pre anestéziu a hospitalizáciu zľava neplatí (fixné náklady)
  if (category === 'consultation_stay' && basePrice !== 70) {
    return basePrice;
  }

  if (category === 'diagnostics') {
    return basePrice;
  }

  if (tier === 'premium') {
    return Math.round(basePrice * 0.95);
  }

  if (tier === 'vip') {
    return Math.round(basePrice * 0.90);
  }

  return basePrice;
}

/**
 * Vráti živý cenník (zohľadňuje úpravy uložené v Manažmente cenníka v localStorage)
 */
export function getLiveClinicPriceList(): ClinicPriceItem[] {
  if (typeof window !== 'undefined') {
    try {
      const saved = window.localStorage.getItem('say_clinic_pricelist_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(
            (item: ClinicPriceItem) =>
              item.id !== 'chemical_peel_basic' &&
              !item.id.startsWith('ipl_') &&
              !item.name.toLowerCase().includes('hydrafacial')
          );
        }
      }
    } catch {
      // Fallback na statický cenník
    }
  }
  return CLINIC_PRICE_LIST;
}

/**
 * Nájde položku z cenníka podľa názvu alebo ID (zo živého cenníka)
 */
export function getClinicPriceItem(search: string): ClinicPriceItem | undefined {
  const normalized = search.toLowerCase().trim();
  const list = getLiveClinicPriceList();
  return (
    list.find(item => item.id.toLowerCase() === normalized) ||
    list.find(item => item.name.toLowerCase().includes(normalized)) ||
    CLINIC_PRICE_LIST.find(
      item => item.id.toLowerCase() === normalized || item.name.toLowerCase().includes(normalized)
    )
  );
}

/**
 * Získa cenu podľa názvu alebo ID položky (zo živého cenníka)
 */
export function getClinicPrice(nameOrId: string, fallback: number = 0): number {
  const item = getClinicPriceItem(nameOrId);
  return item ? item.price : fallback;
}

/**
 * Pravidlá pre kombinované chirurgické operácie v jednej anestézii (Add-on zľavy)
 */
export interface SurgicalAddonRule {
  primaryIds: string[];
  secondaryIds: string[];
  addonPriceId: string;
  addonFallbackPrice: number;
  standaloneFallbackPrice: number;
  addonLabel: string;
}

export const SURGICAL_ADDON_RULES: SurgicalAddonRule[] = [
  {
    primaryIds: ['deep_plane_facelift', 'smas_macs_facelift', 'endoscopic_brow_midface_lift'],
    secondaryIds: ['necklift', 'necklift_standalone', 'facelift_necklift_addon'],
    addonPriceId: 'facelift_necklift_addon',
    addonFallbackPrice: 1000,
    standaloneFallbackPrice: 2500,
    addonLabel: 'Facelift – lifting krku (v kombinácii v jednej anestézii)'
  },
  {
    primaryIds: ['deep_plane_facelift', 'smas_macs_facelift', 'endoscopic_brow_midface_lift', 'necklift', 'necklift_standalone'],
    secondaryIds: ['blepharoplasty_upper', 'blepharoplasty_lower', 'blepharoplasty_combined', 'facelift_bleph_addon'],
    addonPriceId: 'facelift_bleph_addon',
    addonFallbackPrice: 600,
    standaloneFallbackPrice: 1000,
    addonLabel: 'Facelift – blefaroplastika viečok (v kombinácii v jednej anestézii)'
  },
  {
    primaryIds: ['deep_plane_facelift', 'smas_macs_facelift', 'endoscopic_brow_midface_lift'],
    secondaryIds: ['facial_lipofilling', 'fat_transfer_face', 'facelift_fat_transfer_addon'],
    addonPriceId: 'facelift_fat_transfer_addon',
    addonFallbackPrice: 800,
    standaloneFallbackPrice: 1300,
    addonLabel: 'Facelift – transplantácia tuku do tváre (v kombinácii)'
  },
  {
    primaryIds: ['deep_plane_facelift', 'smas_macs_facelift', 'endoscopic_brow_midface_lift'],
    secondaryIds: ['lip_lift', 'facelift_liplift_addon'],
    addonPriceId: 'facelift_liplift_addon',
    addonFallbackPrice: 600,
    standaloneFallbackPrice: 900,
    addonLabel: 'Facelift – Lip Lift (v kombinácii)'
  },
  {
    primaryIds: ['deep_plane_facelift', 'smas_macs_facelift'],
    secondaryIds: ['endoscopic_brow_lift', 'facelift_browlift_addon'],
    addonPriceId: 'facelift_browlift_addon',
    addonFallbackPrice: 1000,
    standaloneFallbackPrice: 2500,
    addonLabel: 'Facelift – lifting obočia (v kombinácii)'
  },
  {
    primaryIds: ['rhinoplasty_complete', 'rhinoplasty'],
    secondaryIds: ['septoplasty_turbinoplasty', 'rhinoplasty_septoplasty_addon'],
    addonPriceId: 'rhinoplasty_septoplasty_addon',
    addonFallbackPrice: 500,
    standaloneFallbackPrice: 2500,
    addonLabel: 'Rhinoplastika – septoplastika / turbinoplastika (v kombinácii)'
  },
  {
    primaryIds: ['abdominoplasty_full', 'abdominoplasty', 'miniabdominoplasty'],
    secondaryIds: ['liposuction_abdomen_flanks', 'liposuction_360', 'abdominoplasty_lipo_flanks'],
    addonPriceId: 'abdominoplasty_lipo_flanks',
    addonFallbackPrice: 600,
    standaloneFallbackPrice: 2500,
    addonLabel: 'Abdominoplastika – liposukcia brucha a bokov (v kombinácii)'
  }
];

/**
 * Nájde balík podľa ID
 */
export function getClinicPackage(id: string): ClinicPackageItem | undefined {
  return CLINIC_PACKAGES.find(pkg => pkg.id === id);
}

/**
 * Vráti balíky podľa kategórie
 */
export function getClinicPackages(category?: string): ClinicPackageItem[] {
  if (!category || category === 'all') return CLINIC_PACKAGES;
  return CLINIC_PACKAGES.filter(pkg => pkg.category === category);
}
