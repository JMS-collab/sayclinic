// =========================================================================
// OFICIÁLNY CENNÍK SAY CLINIC (SAY OS)
// =========================================================================

export interface ClinicPriceItem {
  id: string;
  name: string;
  price: number;
  currency: string;
  category: 
    | 'consultation_stay'
    | 'hand_surgery'
    | 'breast_surgery'
    | 'body_contouring_liposuction'
    | 'face_surgery'
    | 'injectables_aesthetics'
    | 'dermatosurgery'
    | 'compression_garments'
    | 'diagnostics';
  categoryLabel: string;
  description?: string;
}

export const CLINIC_PRICE_LIST: ClinicPriceItem[] = [
  // -----------------------------------------------------------------------
  // 1. KONZULTÁCIE, HOSPITALIZÁCIA A ANESTÉZIA
  // -----------------------------------------------------------------------
  {
    id: 'consultation',
    name: 'Konzultácia',
    price: 50,
    currency: '€',
    category: 'consultation_stay',
    categoryLabel: 'Konzultácia & Pobyt'
  },
  {
    id: 'hospitalization_1_day',
    name: 'Hospitalizácia - 1 deň',
    price: 200,
    currency: '€',
    category: 'consultation_stay',
    categoryLabel: 'Konzultácia & Pobyt'
  },
  {
    id: 'hospitalization_half_day',
    name: 'Hospitalizácia - 1/2 dňa',
    price: 100,
    currency: '€',
    category: 'consultation_stay',
    categoryLabel: 'Konzultácia & Pobyt'
  },
  {
    id: 'premium_single_room',
    name: 'Nadštandardná samostatná lôžková izba',
    price: 30,
    currency: '€',
    category: 'consultation_stay',
    categoryLabel: 'Konzultácia & Pobyt'
  },
  {
    id: 'general_anesthesia_hour',
    name: 'Celková anestézia (každá začatá hodina)',
    price: 130,
    currency: '€',
    category: 'consultation_stay',
    categoryLabel: 'Konzultácia & Pobyt'
  },
  {
    id: 'preoperative_exam',
    name: 'Predoperačné vyšetrenia',
    price: 150,
    currency: '€',
    category: 'diagnostics',
    categoryLabel: 'Diagnostika & Vyšetrenia'
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
    categoryLabel: 'Chirurgia ruky'
  },
  {
    id: 'trigger_finger',
    name: 'Skákavý prst',
    price: 200,
    currency: '€',
    category: 'hand_surgery',
    categoryLabel: 'Chirurgia ruky'
  },
  {
    id: 'dupuytren_contracture',
    name: 'Dupuytrenova kontraktúra',
    price: 700,
    currency: '€',
    category: 'hand_surgery',
    categoryLabel: 'Chirurgia ruky'
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
    categoryLabel: 'Chirurgia prsníkov'
  },
  {
    id: 'b_lite_addon',
    name: 'B-lite implantáty (príplatok)',
    price: 1000,
    currency: '€',
    category: 'breast_surgery',
    categoryLabel: 'Chirurgia prsníkov'
  },
  {
    id: 'joy_addon',
    name: 'Joy implantáty (príplatok)',
    price: 700,
    currency: '€',
    category: 'breast_surgery',
    categoryLabel: 'Chirurgia prsníkov'
  },
  {
    id: 'preserve_addon',
    name: 'Preserve (príplatok)',
    price: 1500,
    currency: '€',
    category: 'breast_surgery',
    categoryLabel: 'Chirurgia prsníkov'
  },
  {
    id: 'nipple_correction',
    name: 'Korekcia bradaviek',
    price: 600,
    currency: '€',
    category: 'breast_surgery',
    categoryLabel: 'Chirurgia prsníkov'
  },
  {
    id: 'breast_augmentation_fat',
    name: 'Zväčšenie prsníkov tukom',
    price: 3100,
    currency: '€',
    category: 'breast_surgery',
    categoryLabel: 'Chirurgia prsníkov'
  },
  {
    id: 'breast_reduction',
    name: 'Zmenšenie prsníkov (redukcia)',
    price: 4100,
    currency: '€',
    category: 'breast_surgery',
    categoryLabel: 'Chirurgia prsníkov'
  },
  {
    id: 'mastopexy_lift',
    name: 'Lifting prsníkov (mastopexia)',
    price: 4100,
    currency: '€',
    category: 'breast_surgery',
    categoryLabel: 'Chirurgia prsníkov'
  },
  {
    id: 'augmentation_mastopexy',
    name: 'Lifting prsníkov s implantátmi (augmentačná mastopexia)',
    price: 5500,
    currency: '€',
    category: 'breast_surgery',
    categoryLabel: 'Chirurgia prsníkov'
  },
  {
    id: 'implant_removal',
    name: 'Odstránenie implantátov',
    price: 1500,
    currency: '€',
    category: 'breast_surgery',
    categoryLabel: 'Chirurgia prsníkov'
  },
  {
    id: 'gynecomastia',
    name: 'Gynekomastia s liposukciou',
    price: 200,
    currency: '€',
    category: 'breast_surgery',
    categoryLabel: 'Chirurgia prsníkov'
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
    categoryLabel: 'Kontúrovanie tela & Liposukcia'
  },
  {
    id: 'abdominoplasty_full',
    name: 'Abdominoplastika (redukcia kože brucha)',
    price: 4000,
    currency: '€',
    category: 'body_contouring_liposuction',
    categoryLabel: 'Kontúrovanie tela & Liposukcia'
  },
  {
    id: 'abdominoplasty_lipo_flanks',
    name: 'Abdominoplastika - liposukcia brucha a bokov',
    price: 600,
    currency: '€',
    category: 'body_contouring_liposuction',
    categoryLabel: 'Kontúrovanie tela & Liposukcia'
  },
  {
    id: 'abdominoplasty_diastasis',
    name: 'Abdominoplastika - korekcia diastázy',
    price: 300,
    currency: '€',
    category: 'body_contouring_liposuction',
    categoryLabel: 'Kontúrovanie tela & Liposukcia'
  },
  {
    id: 'labioplasty',
    name: 'Labioplastika (redukcia malých pyskov)',
    price: 1000,
    currency: '€',
    category: 'body_contouring_liposuction',
    categoryLabel: 'Kontúrovanie tela & Liposukcia'
  },
  {
    id: 'liposuction_abdomen_flanks',
    name: 'Liposukcia brucha a bokov',
    price: 2500,
    currency: '€',
    category: 'body_contouring_liposuction',
    categoryLabel: 'Kontúrovanie tela & Liposukcia'
  },
  {
    id: 'liposuction_360',
    name: '360° Liposukcia',
    price: 3500,
    currency: '€',
    category: 'body_contouring_liposuction',
    categoryLabel: 'Kontúrovanie tela & Liposukcia'
  },
  {
    id: 'liposuction_arms',
    name: 'Liposukcia paží',
    price: 1000,
    currency: '€',
    category: 'body_contouring_liposuction',
    categoryLabel: 'Kontúrovanie tela & Liposukcia'
  },
  {
    id: 'liposuction_neck',
    name: 'Liposukcia krku',
    price: 1000,
    currency: '€',
    category: 'body_contouring_liposuction',
    categoryLabel: 'Kontúrovanie tela & Liposukcia'
  },
  {
    id: 'liposuction_bra_lines',
    name: 'Liposukcia bra lines',
    price: 1000,
    currency: '€',
    category: 'body_contouring_liposuction',
    categoryLabel: 'Kontúrovanie tela & Liposukcia'
  },
  {
    id: 'liposuction_love_handles',
    name: 'Liposukcia love handles',
    price: 1000,
    currency: '€',
    category: 'body_contouring_liposuction',
    categoryLabel: 'Kontúrovanie tela & Liposukcia'
  },
  {
    id: 'liposuction_inner_thighs',
    name: 'Liposukcia vnútorných stehien',
    price: 1000,
    currency: '€',
    category: 'body_contouring_liposuction',
    categoryLabel: 'Kontúrovanie tela & Liposukcia'
  },
  {
    id: 'liposuction_outer_thighs',
    name: 'Liposukcia vonkajších stehien',
    price: 1000,
    currency: '€',
    category: 'body_contouring_liposuction',
    categoryLabel: 'Kontúrovanie tela & Liposukcia'
  },
  {
    id: 'liposuction_knees',
    name: 'Liposukcia kolien',
    price: 1000,
    currency: '€',
    category: 'body_contouring_liposuction',
    categoryLabel: 'Kontúrovanie tela & Liposukcia'
  },
  {
    id: 'liposuction_back',
    name: 'Liposukcia chrbta',
    price: 1000,
    currency: '€',
    category: 'body_contouring_liposuction',
    categoryLabel: 'Kontúrovanie tela & Liposukcia'
  },
  {
    id: 'liposuction_other',
    name: 'Liposukcia - iné',
    price: 1000,
    currency: '€',
    category: 'body_contouring_liposuction',
    categoryLabel: 'Kontúrovanie tela & Liposukcia'
  },
  {
    id: 'fat_transfer_under_200ml',
    name: 'Prenos tuku - Lipotransfer do 200ml',
    price: 700,
    currency: '€',
    category: 'body_contouring_liposuction',
    categoryLabel: 'Kontúrovanie tela & Liposukcia'
  },
  {
    id: 'fat_transfer_over_200ml',
    name: 'Prenos tuku - Lipotransfer nad 200ml',
    price: 1500,
    currency: '€',
    category: 'body_contouring_liposuction',
    categoryLabel: 'Kontúrovanie tela & Liposukcia'
  },
  {
    id: 'arm_lift',
    name: 'Lifting paží (arm lift)',
    price: 4500,
    currency: '€',
    category: 'body_contouring_liposuction',
    categoryLabel: 'Kontúrovanie tela & Liposukcia'
  },
  {
    id: 'thigh_lift',
    name: 'Lifting stehien (thigh lift)',
    price: 4500,
    currency: '€',
    category: 'body_contouring_liposuction',
    categoryLabel: 'Kontúrovanie tela & Liposukcia'
  },
  {
    id: 'buttock_lift',
    name: 'Lifting zadku (buttock lift)',
    price: 4500,
    currency: '€',
    category: 'body_contouring_liposuction',
    categoryLabel: 'Kontúrovanie tela & Liposukcia'
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
    categoryLabel: 'Chirurgia tváre & Krku'
  },
  {
    id: 'blepharoplasty_brow_pexy',
    name: 'Blefaroplastika - záves obočia',
    price: 200,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku'
  },
  {
    id: 'blepharoplasty_ptosis_unilateral',
    name: 'Blefaroplastika - korekcia ptózy viečka - jednostranne',
    price: 200,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku'
  },
  {
    id: 'blepharoplasty_lower',
    name: 'Blefaroplastika dolných viečok',
    price: 1100,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku'
  },
  {
    id: 'blepharoplasty_canthopexy',
    name: 'Blefaroplastika - záves viečka - kantopexia',
    price: 200,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku'
  },
  {
    id: 'otoplasty',
    name: 'Korekcia odstávajúcich ušníc',
    price: 1200,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku'
  },
  {
    id: 'earlobe_correction',
    name: 'Korekcia ušného lalôčika',
    price: 300,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku'
  },
  {
    id: 'septoplasty_turbinoplasty',
    name: 'Septoplastika s turbinoplastikou',
    price: 2500,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku'
  },
  {
    id: 'rhinoplasty_tip',
    name: 'Úprava špičky nosa',
    price: 2500,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku'
  },
  {
    id: 'rhinoplasty_tip_secondary',
    name: 'Úprava špičky nosa - sekundárna operácia',
    price: 1300,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku'
  },
  {
    id: 'rhinoplasty_tip_secondary_rib',
    name: 'Úprava špičky nosa - sekundárna operácia s nutnosťou chrupavky rebra',
    price: 2000,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku'
  },
  {
    id: 'rhinoplasty_complete',
    name: 'Kompletná rhinoplastika',
    price: 3800,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku'
  },
  {
    id: 'rhinoplasty_complete_secondary',
    name: 'Kompletná rhinoplastika - sekundárna operácia',
    price: 1500,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku'
  },
  {
    id: 'rhinoplasty_complete_rib_reconstruction',
    name: 'Kompletná rhinoplastika - sekundárna operácia - totálna rekonštrukcia z chrupavky rebra',
    price: 2500,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku'
  },
  {
    id: 'rhinoplasty_septoplasty_addon',
    name: 'Kompletná rhinoplastika - septoplastika alebo turbinoplastika',
    price: 500,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku'
  },
  {
    id: 'deep_plane_facelift',
    name: 'Deep plane facelift',
    price: 5500,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku'
  },
  {
    id: 'smas_macs_facelift',
    name: 'SMAS / MACS facelift',
    price: 3900,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku'
  },
  {
    id: 'facelift_necklift_addon',
    name: 'Facelift - lifting krku',
    price: 1000,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku'
  },
  {
    id: 'facelift_fat_transfer_addon',
    name: 'Facelift - transplantácia tuku',
    price: 800,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku'
  },
  {
    id: 'facelift_liplift_addon',
    name: 'Facelift - liplift',
    price: 600,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku'
  },
  {
    id: 'facelift_browlift_addon',
    name: 'Facelift - lifting obočia',
    price: 1000,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku'
  },
  {
    id: 'facelift_bleph_addon',
    name: 'Facelift - blefaroplastika',
    price: 600,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku'
  },
  {
    id: 'endoscopic_brow_midface_lift',
    name: 'Endoskopický lifting obočia a strednej časti tváre',
    price: 6000,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku'
  },
  {
    id: 'endoscopic_brow_lift',
    name: 'Endoskopický lifting obočia',
    price: 2500,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku'
  },
  {
    id: 'lip_lift',
    name: 'Lifting pier (lip lift)',
    price: 900,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku'
  },
  {
    id: 'necklift_standalone',
    name: 'Necklift - lifting krku',
    price: 2500,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku'
  },
  {
    id: 'buccal_fat_removal',
    name: 'Odstránenie tuku z líc (bukálna lipektómia)',
    price: 900,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku'
  },
  {
    id: 'facial_implants',
    name: 'Tvárové implantáty',
    price: 3700,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku'
  },
  {
    id: 'facial_lipofilling',
    name: 'Lipofilling tváre',
    price: 1300,
    currency: '€',
    category: 'face_surgery',
    categoryLabel: 'Chirurgia tváre & Krku'
  },

  // -----------------------------------------------------------------------
  // 6. INJEKČNÁ & ESTETICKÁ MEDICÍNA
  // -----------------------------------------------------------------------
  {
    id: 'ha_05ml',
    name: 'Aplikácia kyseliny hyalurónovej - 0,5ml',
    price: 180,
    currency: '€',
    category: 'injectables_aesthetics',
    categoryLabel: 'Injekčná estetická medicína'
  },
  {
    id: 'ha_1ml',
    name: 'Aplikácia kyseliny hyalurónovej - 1ml',
    price: 290,
    currency: '€',
    category: 'injectables_aesthetics',
    categoryLabel: 'Injekčná estetická medicína'
  },
  {
    id: 'material_addition_client_owned',
    name: 'Doplnenie už zakúpeného materiálu',
    price: 50,
    currency: '€',
    category: 'injectables_aesthetics',
    categoryLabel: 'Injekčná estetická medicína'
  },
  {
    id: 'botox_1_area',
    name: 'Botox - 1 oblasť',
    price: 120,
    currency: '€',
    category: 'injectables_aesthetics',
    categoryLabel: 'Injekčná estetická medicína'
  },
  {
    id: 'botox_hyperhidrosis_axilla',
    name: 'Botox - Odstránenie potenia v podpaží',
    price: 400,
    currency: '€',
    category: 'injectables_aesthetics',
    categoryLabel: 'Injekčná estetická medicína'
  },
  {
    id: 'botox_masseter_slimming',
    name: 'Botox - Zúženie tváre (Masseter)',
    price: 300,
    currency: '€',
    category: 'injectables_aesthetics',
    categoryLabel: 'Injekčná estetická medicína'
  },
  {
    id: 'hyaluronidase_150ui',
    name: 'Aplikácia hyaluronidázy 150UI',
    price: 80,
    currency: '€',
    category: 'injectables_aesthetics',
    categoryLabel: 'Injekčná estetická medicína'
  },
  {
    id: 'corticosteroids_application',
    name: 'Kortikosteroidy',
    price: 20,
    currency: '€',
    category: 'injectables_aesthetics',
    categoryLabel: 'Injekčná estetická medicína'
  },
  {
    id: 'chemical_peel',
    name: 'Chemický peeling',
    price: 50,
    currency: '€',
    category: 'injectables_aesthetics',
    categoryLabel: 'Injekčná estetická medicína'
  },
  {
    id: 'skinbooster_1ml',
    name: 'Skinbooster 1ml',
    price: 300,
    currency: '€',
    category: 'injectables_aesthetics',
    categoryLabel: 'Injekčná estetická medicína'
  },
  {
    id: 'sculptra',
    name: 'Sculptra',
    price: 450,
    currency: '€',
    category: 'injectables_aesthetics',
    categoryLabel: 'Injekčná estetická medicína'
  },

  // -----------------------------------------------------------------------
  // 7. DERMATOCHIRURGIA & HISTOLÓGIA
  // -----------------------------------------------------------------------
  {
    id: 'nevus_removal',
    name: 'Odstránenie znamienka',
    price: 90,
    currency: '€',
    category: 'dermatosurgery',
    categoryLabel: 'Dermatochirurgia'
  },
  {
    id: 'histology_exam',
    name: 'Histologické vyšetrenie',
    price: 30,
    currency: '€',
    category: 'dermatosurgery',
    categoryLabel: 'Dermatochirurgia'
  },
  {
    id: 'subcutaneous_tumor_removal',
    name: 'Odstránenie podkožného útvaru (lipóm, ganglion,...)',
    price: 130,
    currency: '€',
    category: 'dermatosurgery',
    categoryLabel: 'Dermatochirurgia'
  },
  {
    id: 'tumor_removal_flap_graft',
    name: 'Odstránenie útvaru s nutnosťou lalokovej plastiky alebo transplantátu',
    price: 400,
    currency: '€',
    category: 'dermatosurgery',
    categoryLabel: 'Dermatochirurgia'
  },

  // -----------------------------------------------------------------------
  // 8. KOMPRESNÁ BIELIZEŇ & POOPERAČNÁ STAROSTLIVOSŤ (LIPOELASTIC)
  // -----------------------------------------------------------------------
  {
    id: 'lipoelastic_pi_ideal',
    name: 'PI ideal',
    price: 60,
    currency: '€',
    category: 'compression_garments',
    categoryLabel: 'Kompresná bielizeň (Lipoelastic)'
  },
  {
    id: 'lipoelastic_pi_relax',
    name: 'PI relax',
    price: 75,
    currency: '€',
    category: 'compression_garments',
    categoryLabel: 'Kompresná bielizeň (Lipoelastic)'
  },
  {
    id: 'lipoelastic_pi_filling',
    name: 'PI filling',
    price: 70,
    currency: '€',
    category: 'compression_garments',
    categoryLabel: 'Kompresná bielizeň (Lipoelastic)'
  },
  {
    id: 'lipoelastic_pu_03',
    name: 'PU 03',
    price: 30,
    currency: '€',
    category: 'compression_garments',
    categoryLabel: 'Kompresná bielizeň (Lipoelastic)'
  },
  {
    id: 'lipoelastic_vh_special_comfort',
    name: 'VH special comfort',
    price: 75,
    currency: '€',
    category: 'compression_garments',
    categoryLabel: 'Kompresná bielizeň (Lipoelastic)'
  },
  {
    id: 'lipoelastic_vh_body_variant',
    name: 'VH body variant',
    price: 75,
    currency: '€',
    category: 'compression_garments',
    categoryLabel: 'Kompresná bielizeň (Lipoelastic)'
  },
  {
    id: 'lipoelastic_vd_comfort',
    name: 'VD comfort',
    price: 115,
    currency: '€',
    category: 'compression_garments',
    categoryLabel: 'Kompresná bielizeň (Lipoelastic)'
  },
  {
    id: 'lipoelastic_vf_body_comfort',
    name: 'VF body/body comfort',
    price: 90,
    currency: '€',
    category: 'compression_garments',
    categoryLabel: 'Kompresná bielizeň (Lipoelastic)'
  },
  {
    id: 'lipoelastic_mtms_comf',
    name: 'MTmS comf',
    price: 80,
    currency: '€',
    category: 'compression_garments',
    categoryLabel: 'Kompresná bielizeň (Lipoelastic)'
  },
  {
    id: 'lipoelastic_kplus',
    name: 'KPlus',
    price: 50,
    currency: '€',
    category: 'compression_garments',
    categoryLabel: 'Kompresná bielizeň (Lipoelastic)'
  },
  {
    id: 'lipoelastic_fm',
    name: 'FM',
    price: 50,
    currency: '€',
    category: 'compression_garments',
    categoryLabel: 'Kompresná bielizeň (Lipoelastic)'
  },
  {
    id: 'lipoelastic_ps_ideal',
    name: 'PS ideal',
    price: 75,
    currency: '€',
    category: 'compression_garments',
    categoryLabel: 'Kompresná bielizeň (Lipoelastic)'
  },
  {
    id: 'lipoelastic_gel',
    name: 'lipoelastic gel',
    price: 35,
    currency: '€',
    category: 'compression_garments',
    categoryLabel: 'Kompresná bielizeň (Lipoelastic)'
  }
];

/**
 * Nájde položku z cenníka podľa názvu alebo ID
 */
export function getClinicPriceItem(search: string): ClinicPriceItem | undefined {
  const normalized = search.toLowerCase().trim();
  return CLINIC_PRICE_LIST.find(
    item => item.id.toLowerCase() === normalized || item.name.toLowerCase().includes(normalized)
  );
}

/**
 * Získa cenu podľa názvu položky
 */
export function getClinicPrice(nameOrId: string, fallback: number = 0): number {
  const item = getClinicPriceItem(nameOrId);
  return item ? item.price : fallback;
}
