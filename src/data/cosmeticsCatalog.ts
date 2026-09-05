export type CosmeticBrand = 
  | 'SkinCeuticals' 
  | 'La Roche-Posay' 
  | 'CeraVe' 
  | 'Vichy' 
  | 'SAY Clinic Lab' 
  | 'Dermaceutic';

export type CosmeticCategory = 
  | 'serums'        // Séra, antioxidanty & kyseliny
  | 'skincare'      // Krémy, balzamy & hydratácia
  | 'sun_care'      // Minerálna a fotostabilná SPF ochrana
  | 'post_op'       // Hojenie jaziev, pooperačná a polaserová starostlivosť
  | 'cleanser'      // Šetrné čistenie, peny & toniká
  | 'retinoids'     // Bunková obnova, peptidy & retinol
  | 'collagen_body'; // Doplnky výživy, telová & vlasová starostlivosť

export interface CosmeticProduct {
  id: string;
  brand: CosmeticBrand;
  name: string;
  category: CosmeticCategory;
  description: string;
  volume: string;
  price: number;
  stock: number;
  badge?: string;
  imageUrl?: string;
  imageColor: string;
  keyIngredients?: string[];
}

export const INITIAL_COSMETICS_CATALOG: CosmeticProduct[] = [
  // ==================== SKINCEUTICALS ====================
  {
    id: 'SC-01',
    brand: 'SkinCeuticals',
    name: 'C E Ferulic Triple Antioxidant Treatment',
    category: 'serums',
    description: 'Svetový zlatý štandard antioxidantov. Obsahuje 15% čistú kyselinu L-askorbovú, 1% alfa-tokoferol a 0.5% kyselinu ferulovú. 8x vyššia ochrana pred fotostarnutím a stimulácia tvorby kolagénu.',
    volume: '30 ml',
    price: 175,
    stock: 14,
    badge: 'Klinický etalón',
    imageColor: 'from-amber-100 via-amber-200 to-yellow-100',
    keyIngredients: ['15% Kyselina L-askorbová', '1% Alfa-tokoferol', '0.5% Kyselina ferulová']
  },
  {
    id: 'SC-02',
    brand: 'SkinCeuticals',
    name: 'Phloretin CF Širokospektrálny antioxidant',
    category: 'serums',
    description: 'Patentovaná synergia 10% čistého vitamínu C, 2% floretínu a 0.5% kyseliny ferulovej. Zlepšuje nerovnomerný tón pleti, zmierňuje diskolorácie a reguluje kožný maz.',
    volume: '30 ml',
    price: 175,
    stock: 9,
    badge: 'Diskolorácie',
    imageColor: 'from-amber-50 via-yellow-100 to-amber-200',
    keyIngredients: ['10% Vitamín C', '2% Floretín', '0.5% Kyselina ferulová']
  },
  {
    id: 'SC-03',
    brand: 'SkinCeuticals',
    name: 'Silymarin CF Olej-free antioxidačné sérum',
    category: 'serums',
    description: 'Prelomový antioxidant pre mastnú a aknóznu pleť. 0.5% silymarín, 15% kyselina L-askorbová, 0.5% kyselina ferulová a 0.5% kyselina salicylová zabraňujú oxidácii kožného mazu a vzniku vyrážok.',
    volume: '30 ml',
    price: 175,
    stock: 8,
    badge: 'Akné & Sebum',
    imageColor: 'from-teal-50 via-emerald-100 to-teal-100',
    keyIngredients: ['0.5% Silymarín', '15% Vitamín C', '0.5% Kyselina salicylová']
  },
  {
    id: 'SC-04',
    brand: 'SkinCeuticals',
    name: 'H.A. Intensifier Multi-Glycan Kyselina hyalurónová',
    category: 'serums',
    description: 'Najnovšia generácia séra zosilňujúceho vlastné zásoby kyseliny hyalurónovej v pokožke o +30%. Obohatené o Proxylane a extrakt z koreňa sladkého drievka a fialovej ryže pre okamžitý liftingový objem.',
    volume: '30 ml',
    price: 118,
    stock: 12,
    badge: 'Novinka',
    imageColor: 'from-purple-100 via-violet-200 to-indigo-100',
    keyIngredients: ['Kyselina hyalurónová', 'Proxylane', 'Extrakt zo sladkého drievka']
  },
  {
    id: 'SC-05',
    brand: 'SkinCeuticals',
    name: 'Discoloration Defense Intenzívne korekčné sérum',
    category: 'serums',
    description: 'Klinicky overená terapia odolných pigmentových škvŕn a melazmy. 1.8% kyselina tranexamová, 5% niacínamid a 5% HEPES viditeľne zosvetľujú pozápalovú hyperpigmentáciu.',
    volume: '30 ml',
    price: 112,
    stock: 10,
    badge: 'Melazma & Škvrny',
    imageColor: 'from-rose-50 via-amber-100 to-orange-100',
    keyIngredients: ['1.8% Kyselina tranexamová', '5% Niacínamid', '5% HEPES']
  },
  {
    id: 'SC-06',
    brand: 'SkinCeuticals',
    name: 'P-TIOX Pokročilé peptidové sérum proti mimickým vráskam',
    category: 'retinoids',
    description: 'Špičková inovácia inšpirovaná účinkom neurotoxínu (botulotoxínu). Komplex Argireline Amplified, dipeptidov a niacínamidu redukuje 9 typov kontrakčných vrások na čele a okolo očí.',
    volume: '30 ml',
    price: 142,
    stock: 7,
    badge: 'Novinka 2025/2026',
    imageColor: 'from-blue-50 via-slate-200 to-indigo-100',
    keyIngredients: ['Argireline Amplified', 'Peptidový komplex', 'Niacínamid', 'Kyselina polyglutámová']
  },
  {
    id: 'SC-07',
    brand: 'SkinCeuticals',
    name: 'Triple Lipid Restore 2:4:2 Patentovaný bariérový krém',
    category: 'skincare',
    description: 'Maximálna obnova medzibunkovej lipidovej matrice. Pomer 2% čistých ceramidov, 4% prírodného cholesterolu a 2% mastných kyselín dramaticky znižuje rekonvalescenciu po procedúrach a vyživuje zrelú pleť.',
    volume: '48 ml',
    price: 155,
    stock: 11,
    badge: 'Bestseller',
    imageColor: 'from-stone-100 via-amber-50 to-orange-50',
    keyIngredients: ['2% Ceramidy 1 & 3', '4% Cholesterol', '2% Mastné kyseliny']
  },
  {
    id: 'SC-08',
    brand: 'SkinCeuticals',
    name: 'A.G.E. Interrupter Advanced Protivráskový krém',
    category: 'skincare',
    description: 'Cielená ochrana pred glykáciou kolagénových vlákien. Obsahuje 18% koncentrovaný Proxylane, výťažok z lesného ovocia a kyselinu glycyrhetínovú pre obnovu hustoty a elasticity ochabnutej pleti.',
    volume: '48 ml',
    price: 185,
    stock: 6,
    badge: 'Anti-glykácia',
    imageColor: 'from-purple-50 via-pink-100 to-rose-100',
    keyIngredients: ['18% Proxylane', 'Extrakt z čučoriedok', 'Kyselina glycyrhetínová']
  },
  {
    id: 'SC-09',
    brand: 'SkinCeuticals',
    name: 'Phyto Corrective Gélové upokojujúce sérum',
    category: 'post_op',
    description: 'Botanické gélové sérum s uhorkou, tymiánom a kyselinou hyalurónovou. Okamžite tlmí erytém, pálenie a zápal po laseroch, chemickom peelingu či mikroihličkovaní.',
    volume: '30 ml',
    price: 85,
    stock: 15,
    badge: 'Po laseri',
    imageColor: 'from-emerald-100 via-teal-100 to-green-200',
    keyIngredients: ['Extrakt z uhorky', 'Tymián', 'Kyselina hyalurónová', 'Moruša']
  },
  {
    id: 'SC-10',
    brand: 'SkinCeuticals',
    name: 'Epidermal Repair Terapeutická obnova pokožky',
    category: 'post_op',
    description: 'Špeciálna medicínska formulácia určená na ošetrenie narušenej pokožky po ablačných procedúrach. Zrýchľuje epitelizáciu, zabraňuje vzniku jaziev a poskytuje ochranný biologický štít.',
    volume: '40 ml',
    price: 82,
    stock: 9,
    badge: 'Po operácii',
    imageColor: 'from-slate-100 via-teal-50 to-stone-200',
    keyIngredients: ['Beta-glukán', 'Centella Asiatica', 'Sodná soľ kyseliny hyalurónovej']
  },
  {
    id: 'SC-11',
    brand: 'SkinCeuticals',
    name: 'Retinol 0.3 Nočný obnovujúci krém',
    category: 'retinoids',
    description: 'Vysoko stabilný enkapsulovaný čistý retinol v koncentrácii 0.3% s bisabololom. Stimuluje bunkovú obnovu a syntézu kolagénu s minimálnym rizikom podráždenia.',
    volume: '30 ml',
    price: 98,
    stock: 10,
    badge: 'Retinol',
    imageColor: 'from-yellow-100 via-amber-100 to-orange-100',
    keyIngredients: ['0.3% Čistý enkapsulovaný retinol', 'Bisabolol']
  },
  {
    id: 'SC-12',
    brand: 'SkinCeuticals',
    name: 'Ultra Facial Defense SPF 50+ Širokospektrálna ochrana',
    category: 'sun_care',
    description: 'Špičková fotoprotekcia s Mexoryl SX/XL a Tinosorb filtrami. Chráni pred hyperpigmentáciou a degradáciou kolagénu UV lúčmi. Nezanecháva biely film.',
    volume: '30 ml',
    price: 42,
    stock: 22,
    badge: 'SPF 50+',
    imageColor: 'from-amber-100 via-orange-100 to-yellow-200',
    keyIngredients: ['Mexoryl SX & XL', 'Tinosorb S', 'Vitamín E']
  },
  {
    id: 'SC-13',
    brand: 'SkinCeuticals',
    name: 'Simply Clean Hĺbkovo čistiaci gél s aminokyselinami',
    category: 'cleanser',
    description: 'Jemný gél s kyselinami a rastlinnými extraktmi účinne čistí póry, odstraňuje make-up a zanecháva pleť hladkú a pripravenú na aplikáciu aktívnych sér.',
    volume: '200 ml',
    price: 45,
    stock: 16,
    imageColor: 'from-cyan-50 via-sky-100 to-blue-100',
    keyIngredients: ['Kyselina citrónová', 'Aminokyseliny', 'Extrakt z harmančeka']
  },

  // ==================== LA ROCHE-POSAY ====================
  {
    id: 'LRP-01',
    brand: 'La Roche-Posay',
    name: 'Anthelios UVMune 400 Invisible Fluid SPF 50+',
    category: 'sun_care',
    description: 'Najmodernejší UV filter Mexoryl 400 chrániaci pred najzákernejším ultra-dlhým UVA žiarením (380-400 nm). Ultra-ľahká nemastná textúra, rezistentná voči vode a potu.',
    volume: '50 ml',
    price: 21.50,
    stock: 40,
    badge: 'Bestseller SPF',
    imageColor: 'from-orange-100 via-amber-200 to-yellow-100',
    keyIngredients: ['Mexoryl 400', 'Netlock technológia', 'Termálna voda La Roche-Posay']
  },
  {
    id: 'LRP-02',
    brand: 'La Roche-Posay',
    name: 'Anthelios UVMune 400 Oil Control Zmatňujúci gél-krém SPF 50+',
    category: 'sun_care',
    description: 'Dlhodobý 12h matujúci efekt vďaka technológii Airlicium. Poskytuje najvyššiu UV ochranu s Mexoryl 400 pre zmiešanú, mastnú a k akné náchylnú pleť.',
    volume: '50 ml',
    price: 21.50,
    stock: 35,
    badge: 'Matujúci SPF',
    imageColor: 'from-emerald-50 via-teal-100 to-amber-100',
    keyIngredients: ['Airlicium', 'Mexoryl 400', 'Zinok']
  },
  {
    id: 'LRP-03',
    brand: 'La Roche-Posay',
    name: 'Cicaplast Baume B5+ Ultra-Regeneračný balzam',
    category: 'post_op',
    description: 'Nová vylepšená formula s exkluzívnym prebiotickým komplexom Tribioma, 5% pantenolom a madecassoside. Okamžite upokojuje a urýchľuje obnovu poškodenej a podráždenej pokožky.',
    volume: '100 ml',
    price: 17.50,
    stock: 45,
    badge: 'Po zákroku',
    imageColor: 'from-blue-100 via-sky-100 to-indigo-100',
    keyIngredients: ['5% Pantenol', 'Madecassoside', 'Tribioma prebiotikum', 'Zinok & Meď']
  },
  {
    id: 'LRP-04',
    brand: 'La Roche-Posay',
    name: 'Cicaplast B5 Sérum Ultra-Regeneračné',
    category: 'post_op',
    description: 'Koncentrované 10% pantenolové sérum, ktoré chráni narušenú kožnú bariéru pred vysušením a podráždením. Ideálne po estetických procedúrach a pri retinoidnej dermatitíde.',
    volume: '30 ml',
    price: 29.00,
    stock: 20,
    badge: 'Bariéra',
    imageColor: 'from-sky-50 via-indigo-100 to-blue-200',
    keyIngredients: ['10% Vitamín B5 (Pantenol)', 'HEPES', 'Termálna voda']
  },
  {
    id: 'LRP-05',
    brand: 'La Roche-Posay',
    name: 'Cicaplast Gel B5 Pro-Recovery Masážny gél na jazvy',
    category: 'post_op',
    description: 'Ochranný silikónový gél vyvinutý špeciálne pre masáž čerstvých pooperačných jaziev po vybratí stehov, po laseri a chemickom peelingu. Zmierňuje pnutie a podporuje neviditeľné zjazvenie.',
    volume: '40 ml',
    price: 13.50,
    stock: 28,
    badge: 'Starostlivosť o jazvy',
    imageColor: 'from-teal-50 via-cyan-100 to-blue-100',
    keyIngredients: ['Silikónová textúra', '5% Pantenol', 'Madecassoside', 'Kyselina hyalurónová']
  },
  {
    id: 'LRP-06',
    brand: 'La Roche-Posay',
    name: 'Hyalu B5 Protivráskové koncentrované sérum',
    category: 'serums',
    description: 'Dva typy čistej kyseliny hyalurónovej s vitamínom B5 a madecassoside. Okamžite vypĺňa jemné vrásky, obnovuje pružnosť a posilňuje odolnosť pleti.',
    volume: '30 ml',
    price: 39.50,
    stock: 24,
    badge: 'Bestseller',
    imageColor: 'from-blue-100 via-sky-200 to-indigo-100',
    keyIngredients: ['Vysoko a nízkomolekulárna kyselina hyalurónová', 'Vitamín B5', 'Madecassoside']
  },
  {
    id: 'LRP-07',
    brand: 'La Roche-Posay',
    name: 'Mela B3 Intenzívne sérum proti pigmentovým škvrnám',
    category: 'serums',
    description: 'Prelomová patentovaná molekula Melasyl a 10% niacínamid. Zastavuje nadprodukciu melanínu ešte pred jeho vznikom. Klinicky dokázaná redukcia aj tých najodolnejších škvŕn a melazmy.',
    volume: '30 ml',
    price: 44.50,
    stock: 18,
    badge: 'Novinka Melasyl',
    imageColor: 'from-rose-100 via-amber-100 to-purple-100',
    keyIngredients: ['Melasyl', '10% Niacínamid', 'LHA', 'Termálna voda']
  },
  {
    id: 'LRP-08',
    brand: 'La Roche-Posay',
    name: 'Pure Vitamin C10 Rozjasňujúce antioxidačné sérum',
    category: 'serums',
    description: '10% čistý vitamín C s kyselinou salicylovou a neurosenzínom pri fyziologickom pH. Zjednocuje štruktúru pleti, redukuje vrásky a rozjasňuje mdlý tón aj pri citlivej pleti.',
    volume: '30 ml',
    price: 41.00,
    stock: 15,
    badge: 'Rozjasnenie',
    imageColor: 'from-amber-100 via-orange-200 to-yellow-100',
    keyIngredients: ['10% Čistý vitamín C', 'Kyselina salicylová', 'Neurosenzín']
  },
  {
    id: 'LRP-09',
    brand: 'La Roche-Posay',
    name: 'Retinol B3 Koncentrované sérum proti hlbokým vráskam',
    category: 'retinoids',
    description: 'Postupne uvoľňovaný čistý retinol s vitamínom B3 (niacínamid). Koriguje hlboké vrásky, fotopoškodenie a nerovnomerný reliéf pleti s maximálnou toleranciou.',
    volume: '30 ml',
    price: 42.00,
    stock: 14,
    badge: 'Retinol',
    imageColor: 'from-yellow-50 via-amber-100 to-orange-100',
    keyIngredients: ['Čistý a postupne uvoľňovaný retinol', 'Vitamín B3', 'Glycerín']
  },
  {
    id: 'LRP-10',
    brand: 'La Roche-Posay',
    name: 'Effaclar Duo+M Trojitá korekčná starostlivosť',
    category: 'skincare',
    description: 'Najnovšia vedecká formula obohatená o Phylobioma aktívnu látku cieliacu na phylotyp IA1 baktérie C. acnes. Pôsobí proti zápalom, čiernym bodkám a červeným stopám po akné.',
    volume: '40 ml',
    price: 19.50,
    stock: 32,
    badge: 'Najnovšia formula',
    imageColor: 'from-teal-50 via-cyan-100 to-blue-100',
    keyIngredients: ['Phylobioma', 'Procerad', 'Niacínamid', 'Kyselina salicylová']
  },
  {
    id: 'LRP-11',
    brand: 'La Roche-Posay',
    name: 'Effaclar Čistiaci penivý gél pre mastnú pleť',
    category: 'cleanser',
    description: 'Šetrne čistí pleť od mazu a nečistôt bez vysušovania vďaka fyziologickému pH 5.5 a termálnej vode La Roche-Posay so zinkom PCA.',
    volume: '400 ml',
    price: 19.00,
    stock: 26,
    imageColor: 'from-sky-50 via-blue-100 to-teal-100',
    keyIngredients: ['Zinok PCA', 'Termálna voda La Roche-Posay']
  },
  {
    id: 'LRP-12',
    brand: 'La Roche-Posay',
    name: 'Toleriane Dermallergo Krém pre alergickú pleť',
    category: 'skincare',
    description: 'Každodenná hydratačná a upokojujúca starostlivosť so Sphingobioma a neurosenzínom. Okamžite znižuje začervenanie, pálenie a diskomfort extrémne reaktívnej pokožky.',
    volume: '40 ml',
    price: 23.00,
    stock: 20,
    badge: 'Citlivá pleť',
    imageColor: 'from-slate-50 via-blue-50 to-indigo-100',
    keyIngredients: ['Sphingobioma', 'Neurosenzín', 'Bambucké maslo']
  },
  {
    id: 'LRP-13',
    brand: 'La Roche-Posay',
    name: 'Lipikar Baume AP+M Trojitý relipidačný balzam',
    category: 'collagen_body',
    description: 'Trojitá účinnosť proti svrbeniu, obnova mikrobiómu pokožky a protizápalový efekt. Vhodný na suchú a atopickú pokožku celého tela po sprche aj procedúrach.',
    volume: '400 ml',
    price: 24.50,
    stock: 18,
    imageColor: 'from-blue-50 via-indigo-50 to-slate-100',
    keyIngredients: ['Aqua Posae Filiformis', 'Microresyl', '20% Bambucké maslo', 'Niacínamid']
  },

  // ==================== CERAVE ====================
  {
    id: 'CRV-01',
    brand: 'CeraVe',
    name: 'CeraVe Hydratačný čistiaci gél (Hydrating Cleanser)',
    category: 'cleanser',
    description: 'Ikonický jemný čistiaci gél s 3 esenciálnymi ceramidmi a kyselinou hyalurónovou. Efektívne odstraňuje make-up a nečistoty bez poškodenia prirodzenej kožnej bariéry.',
    volume: '473 ml',
    price: 14.50,
    stock: 50,
    badge: 'Bestseller',
    imageColor: 'from-emerald-50 via-green-100 to-teal-100',
    keyIngredients: ['3 esenciálne ceramidy (1, 3, 6-II)', 'Kyselina hyalurónová', 'MVE technológia']
  },
  {
    id: 'CRV-02',
    brand: 'CeraVe',
    name: 'CeraVe SA Zjemňujúci čistiaci gél (Smoothing Cleanser)',
    category: 'cleanser',
    description: 'Obsahuje kyselinu salicylovú a glukonolaktón pre jemnú chemickú exfoliáciu hrubej, textúrovanej pokožky a keratosis pilaris, doplnenú o ceramidy a niacínamid.',
    volume: '473 ml',
    price: 16.00,
    stock: 38,
    badge: 'Exfoliácia',
    imageColor: 'from-cyan-50 via-teal-100 to-sky-100',
    keyIngredients: ['Kyselina salicylová', 'Urea', 'Niacínamid', '3 esenciálne ceramidy']
  },
  {
    id: 'CRV-03',
    brand: 'CeraVe',
    name: 'CeraVe Čistiaci penivý gél (Foaming Cleanser)',
    category: 'cleanser',
    description: 'Pre normálnu až mastnú pleť. Jemná gélová pena čistí póry a odstraňuje nadbytočný maz s niacínamidom bez pocitu stiahnutej alebo suchej tváre.',
    volume: '473 ml',
    price: 14.50,
    stock: 42,
    imageColor: 'from-teal-50 via-sky-100 to-blue-100',
    keyIngredients: ['3 ceramidy', 'Niacínamid', 'Kyselina hyalurónová']
  },
  {
    id: 'CRV-04',
    brand: 'CeraVe',
    name: 'CeraVe Hydratačný krém (Moisturising Cream)',
    category: 'skincare',
    description: 'Bohatý, nemastný hydratačný krém s technológiou riadeného uvoľňovania MVE. Poskytuje nepretržitú 24-hodinovú hydratáciu a obnovu suchej a oslabenej kože.',
    volume: '454 g',
    price: 18.00,
    stock: 45,
    badge: 'Bestseller',
    imageColor: 'from-blue-50 via-indigo-100 to-sky-100',
    keyIngredients: ['3 ceramidy identické s kožou', 'Kyselina hyalurónová', 'MVE technológia']
  },
  {
    id: 'CRV-05',
    brand: 'CeraVe',
    name: 'CeraVe Denný hydratačný krém na tvár SPF 50',
    category: 'sun_care',
    description: 'Ľahký denný fluid s vysokým ochranným faktorom SPF 50 a 3 esenciálnymi ceramidmi. Chráni pred UVA/UVB lúčmi a posilňuje ochrannú bariéru pleti.',
    volume: '52 ml',
    price: 15.50,
    stock: 35,
    badge: 'Denný krém + SPF',
    imageColor: 'from-amber-50 via-yellow-100 to-blue-100',
    keyIngredients: ['Širokospektrálne UV filtre SPF 50', 'Ceramidy', 'Vitamín E']
  },
  {
    id: 'CRV-06',
    brand: 'CeraVe',
    name: 'CeraVe Nočný hydratačný krém na tvár (PM Lotion)',
    category: 'skincare',
    description: 'Ultra-ľahké nočné mlieko s niacínamidom, kyselinou hyalurónovou a ceramidmi. Upokojuje pokožku počas spánku a obnovuje hydratáciu.',
    volume: '52 ml',
    price: 14.00,
    stock: 30,
    imageColor: 'from-indigo-50 via-slate-100 to-blue-100',
    keyIngredients: ['Niacínamid', '3 esenciálne ceramidy', 'Kyselina hyalurónová']
  },
  {
    id: 'CRV-07',
    brand: 'CeraVe',
    name: 'CeraVe Retinolové obnovujúce sérum (Resurfacing Retinol)',
    category: 'retinoids',
    description: 'Vyvinuté s dermatológmi na redukciu stopových jaziev po akné a stiahnutie rozšírených pórov. Obsahuje enkapsulovaný retinol, extrakt z koreňa sladkého drievka a niacínamid.',
    volume: '30 ml',
    price: 18.50,
    stock: 25,
    badge: 'Jazvy po akné',
    imageColor: 'from-teal-100 via-emerald-100 to-sky-100',
    keyIngredients: ['Enkapsulovaný retinol', 'Sladké drievko', 'Niacínamid', 'Ceramidy']
  },
  {
    id: 'CRV-08',
    brand: 'CeraVe',
    name: 'CeraVe Pokročilá regeneračná masť (Advanced Repair Ointment)',
    category: 'post_op',
    description: 'Intenzívna okluzívna masť s petrolátom, ceramidmi a kyselinou hyalurónovou. Okamžite chráni praskliny, popáleniny a extrémne suché zóny po chirurgických zákrokoch.',
    volume: '88 ml',
    price: 13.00,
    stock: 22,
    badge: 'Novinka',
    imageColor: 'from-sky-50 via-blue-100 to-indigo-100',
    keyIngredients: ['Vazelína farmaceutickej čistoty', 'Kyselina hyalurónová', '3 ceramidy']
  },
  {
    id: 'CRV-09',
    brand: 'CeraVe',
    name: 'CeraVe Obnovujúci očný krém (Eye Repair Cream)',
    category: 'skincare',
    description: 'Redukuje tmavé kruhy pod očami a opuchy s morským komplexom rias a 3 esenciálnymi ceramidmi. Oftalmologicky testovaný.',
    volume: '14 ml',
    price: 13.00,
    stock: 20,
    imageColor: 'from-blue-50 via-teal-50 to-slate-100',
    keyIngredients: ['Morský a botanický komplex', '3 ceramidy', 'Kyselina hyalurónová']
  },
  {
    id: 'CRV-10',
    brand: 'CeraVe',
    name: 'CeraVe Čistiaci gél proti nedokonalostiam (Blemish Control)',
    category: 'cleanser',
    description: 'Gél s 2% kyselinou salicylovou a hektoritovým ílom, ktorý absorbuje prebytočný kožný maz a prečisťuje upchaté póry.',
    volume: '236 ml',
    price: 13.50,
    stock: 28,
    imageColor: 'from-teal-50 via-emerald-100 to-blue-100',
    keyIngredients: ['2% Kyselina salicylová', 'Hektoritový čistiaci íl', 'Niacínamid']
  },

  // ==================== VICHY ====================
  {
    id: 'VIC-01',
    brand: 'Vichy',
    name: 'Minéral 89 Posilňujúci a vyplňujúci denný booster',
    category: 'serums',
    description: 'Kombinácia 89% vulkanickej vody Vichy a čistej kyseliny hyalurónovej. Posilňuje kožnú bariéru proti znečisteniu, stresu a únave. Zanecháva pleť hydratovanú a tonizovanú.',
    volume: '50 ml',
    price: 24.50,
    stock: 35,
    badge: 'Bestseller',
    imageColor: 'from-sky-100 via-blue-200 to-cyan-100',
    keyIngredients: ['89% Vulkanická voda Vichy s 15 minerálmi', 'Kyselina hyalurónová prírodného pôvodu']
  },
  {
    id: 'VIC-02',
    brand: 'Vichy',
    name: 'Minéral 89 72h Intenzívny hydratačný krém',
    category: 'skincare',
    description: 'Hĺbková 72-hodinová hydratácia obohatená o čistý skvalán, vitamín B3 (niacínamid) a vitamín E bez minerálnych olejov.',
    volume: '50 ml',
    price: 23.00,
    stock: 24,
    badge: 'Hydratácia',
    imageColor: 'from-cyan-50 via-sky-100 to-blue-100',
    keyIngredients: ['Skvalán', 'Kyselina hyalurónová', 'Vitamín B3', 'Minerály']
  },
  {
    id: 'VIC-03',
    brand: 'Vichy',
    name: 'Liftactiv Supreme Vitamín C Sérum 15%',
    category: 'serums',
    description: 'Vysoká 15% koncentrácia čistého vitamínu C s pycnogenolom (antioxidant z borovice prímorskej) a vitamínom E. Viditeľné rozjasnenie a spevnenie za 10 dní.',
    volume: '20 ml',
    price: 38.00,
    stock: 16,
    badge: '15% Vit C',
    imageColor: 'from-amber-100 via-orange-200 to-yellow-100',
    keyIngredients: ['15% Čistý vitamín C', 'Pycnogenol', 'Vitamín E']
  },
  {
    id: 'VIC-04',
    brand: 'Vichy',
    name: 'Liftactiv Retinol Specialist Hĺbkové nočné sérum',
    category: 'retinoids',
    description: 'Pokročilé nočné sérum s 0.2% čistým retinolom a frakciami probiotík. Vyhladzuje aj hlboké a statické vrásky a zrýchľuje bunkovú regeneráciu.',
    volume: '30 ml',
    price: 42.00,
    stock: 14,
    badge: 'Retinol Specialist',
    imageColor: 'from-yellow-100 via-amber-200 to-orange-100',
    keyIngredients: ['0.2% Čistý retinol', 'Probiotické frakcie', 'Vulkanická voda']
  },
  {
    id: 'VIC-05',
    brand: 'Vichy',
    name: 'Liftactiv Collagen Specialist Denný protivráskový krém',
    category: 'skincare',
    description: 'Trojnásobná dávka pro-kolagénových peptidov v kombinácii s vitamínom Cg. Kompenzuje stratu kolagénu v pleti, spevňuje ovál tváre a vypína kontúry.',
    volume: '50 ml',
    price: 38.50,
    stock: 22,
    badge: 'Kolagén Peptidy',
    imageColor: 'from-rose-100 via-red-100 to-amber-100',
    keyIngredients: ['Ryžové peptidy', 'Peptidy matrice', 'Vitamín Cg']
  },
  {
    id: 'VIC-06',
    brand: 'Vichy',
    name: 'Liftactiv B3 Sérum proti tmavým škvrnám a vráskam',
    category: 'serums',
    description: 'Vysokokoncentrované 13% zloženie s niacínamidom, kyselinou glykolovou a vitamínom Cg. Pôsobí v rôznych vrstvách epidermy na odstránenie pigmentácií.',
    volume: '30 ml',
    price: 39.50,
    stock: 15,
    badge: 'B3 Pigmentácie',
    imageColor: 'from-red-50 via-rose-100 to-amber-100',
    keyIngredients: ['Niacínamid (B3)', 'Kyselina glykolová', 'Peptidy']
  },
  {
    id: 'VIC-07',
    brand: 'Vichy',
    name: 'Capital Soleil UV-Clear Zmatňujúci fluid SPF 50+',
    category: 'sun_care',
    description: 'Najnovší ultra-ľahký fluid SPF 50+ s Netlock technológiou špeciálne formulovaný s kyselinou salicylovou a niacínamidom pre pleť so sklonom k akné.',
    volume: '40 ml',
    price: 22.50,
    stock: 28,
    badge: 'Novinka',
    imageColor: 'from-orange-100 via-amber-100 to-emerald-100',
    keyIngredients: ['Netlock SPF 50+', 'Kyselina salicylová', 'Niacínamid']
  },
  {
    id: 'VIC-08',
    brand: 'Vichy',
    name: 'Capital Soleil UV-Age Daily Tónovaný fluid SPF 50+',
    category: 'sun_care',
    description: 'Fotoprotekčný fluid proti fotostarnutiu a vráskam s minerálnymi pigmentmi pre zjednotenie tónu pleti a zdravý žiarivý vzhľad bez mastného pocitu.',
    volume: '40 ml',
    price: 23.50,
    stock: 25,
    badge: 'Tónovaný SPF',
    imageColor: 'from-amber-100 via-stone-200 to-orange-100',
    keyIngredients: ['Peptidy', 'Niacínamid', 'Minerálne pigmenty', 'Mexoryl XL']
  },
  {
    id: 'VIC-09',
    brand: 'Vichy',
    name: 'Neovadiol Peri-Menopause Spevňujúci denný krém',
    category: 'skincare',
    description: 'Reaktivuje mechanizmy pleti v období menopauzy: hustotu, pevnosť a obnovu lipidov. Obsahuje Proxylane a extrakt z kasie.',
    volume: '50 ml',
    price: 36.00,
    stock: 18,
    badge: 'Menopauza',
    imageColor: 'from-amber-50 via-yellow-100 to-orange-100',
    keyIngredients: ['Proxylane', 'Extrakt z kasie', 'Kyselina hyalurónová']
  },
  {
    id: 'VIC-10',
    brand: 'Vichy',
    name: 'Dercos Anti-Dandruff Šampón proti lupinám DS',
    category: 'collagen_body',
    description: 'Klinicky overený šampón s disulfidom selénu a kyselinou salicylovou. Odstraňuje 100% viditeľných lupín a zabraňuje ich návratu po dobu 6 týždňov.',
    volume: '390 ml',
    price: 18.50,
    stock: 30,
    badge: 'Bestseller',
    imageColor: 'from-amber-100 via-orange-100 to-yellow-200',
    keyIngredients: ['Disulfid selénu', 'Kyselina salicylová', 'Cohesyl']
  },
  {
    id: 'VIC-11',
    brand: 'Vichy',
    name: 'Dercos Aminexil Clinical 5 Kúra proti vypadávaniu vlasov',
    category: 'collagen_body',
    description: 'Komplexná kúra s 5 cielenými účinkami: upevnenie korienka, mikrocirkulácia, odolnosť vlasového vlákna a rovnováha pokožky hlavy. Balenie 21 ampuliek.',
    volume: '21 ampuliek',
    price: 65.00,
    stock: 12,
    badge: 'Vlasová kúra',
    imageColor: 'from-slate-100 via-zinc-200 to-amber-100',
    keyIngredients: ['Aminexil', 'Arginín', 'SP94', 'Octeine', 'Minerálna voda']
  },

  // ==================== SAY CLINIC LAB & DERMACEUTIC ====================
  {
    id: 'SAY-01',
    brand: 'SAY Clinic Lab',
    name: 'SAY Clinic Cellular Renewal Elixir',
    category: 'serums',
    description: 'Vysokokoncentrované omladzujúce sérum s rekombinantnými EGF faktormi, kyselinou hyalurónovou a enkapsulovaným retinolom vyvinuté pre SAY Clinic.',
    volume: '30 ml',
    price: 89.00,
    stock: 24,
    badge: 'Bestseller',
    imageColor: 'from-amber-100 to-amber-200',
    keyIngredients: ['EGF Rastové faktory', 'Kyselina hyalurónová', '0.5% Enkapsulovaný retinol']
  },
  {
    id: 'SAY-02',
    brand: 'SAY Clinic Lab',
    name: 'Advanced Mineral Invisible Fluid SPF 50+',
    category: 'sun_care',
    description: '100% minerálny fotoprotekčný fluid s oxidom zinočnatým a titaničitým pre pleť po operáciách, blefaroplastike, liftingu a laserovom ošetrení.',
    volume: '50 ml',
    price: 42.00,
    stock: 38,
    badge: 'Po zákroku',
    imageColor: 'from-orange-100 to-amber-100',
    keyIngredients: ['Oxid zinočnatý', 'Oxid titaničitý', 'Vitamín E', 'Bisabolol']
  },
  {
    id: 'SAY-03',
    brand: 'SAY Clinic Lab',
    name: 'Cicatrix Recovery Balm & Arnica Montana',
    category: 'post_op',
    description: 'Intenzívny medicínsky hojivý balzam na rýchlu redukciu hematómov, pooperačných opuchov a bezpečné zjemnenie jaziev po chirurgických zákrokoch.',
    volume: '50 ml',
    price: 38.00,
    stock: 19,
    badge: 'Hojenie jaziev',
    imageColor: 'from-emerald-100 to-teal-100',
    keyIngredients: ['Arnica Montana extrakt', 'Madecassoside', 'Zinok', 'Kyselina hyalurónová']
  },
  {
    id: 'SAY-04',
    brand: 'SAY Clinic Lab',
    name: 'Hydra-Barrier Ceramide Cream',
    category: 'skincare',
    description: 'Hĺbkovo regeneračný krém s 5 typmi esenciálnych bio-ceramidov a peptidov pre obnovu lipidovej bariéry a okamžitý komfort pleti.',
    volume: '50 ml',
    price: 59.00,
    stock: 15,
    imageColor: 'from-blue-100 to-indigo-100',
    keyIngredients: ['5 typov ceramidov', 'Bambucké maslo', 'Peptidy']
  },
  {
    id: 'SAY-05',
    brand: 'SAY Clinic Lab',
    name: 'Marine Pure Collagen Peptides 10,000mg',
    category: 'collagen_body',
    description: 'Prémiový rybí bioaktívny kolagén s vitamínom C, zinkom a biotínom na 30 dní. Podpora elasticity kože a rýchleho hojenia tkanív po operáciách.',
    volume: '30 sáčkov',
    price: 65.00,
    stock: 42,
    badge: 'Výživa',
    imageColor: 'from-pink-100 to-rose-100',
    keyIngredients: ['10 000 mg Peptidy morského kolagénu', 'Vitamín C', 'Zinok', 'Biotín']
  },
  {
    id: 'SAY-06',
    brand: 'Dermaceutic',
    name: 'K-Ceutic Post-Treatment Recovery Cream',
    category: 'post_op',
    description: 'Referenčný regeneračný krém s komplexom vitamínu K, glykoproteínmi a SPF 50 pre okamžité upokojenie začervenania po laseri a mikrodermabrázii.',
    volume: '30 ml',
    price: 49.00,
    stock: 11,
    badge: 'Po laseri',
    imageColor: 'from-stone-100 to-amber-100',
    keyIngredients: ['K-Komplex (Vitamín K)', 'Glykoproteín', 'Vitamíny C & E', 'SPF 50']
  },
  {
    id: 'SAY-07',
    brand: 'SAY Clinic Lab',
    name: 'Gentle Foaming Cleanser pH 5.5',
    category: 'cleanser',
    description: 'Hodvábna fyziologická čistiaca pena bez sulfátov s harmančekom, uhorkou a pantenolom pre dokonalé vyčistenie citlivej pleti.',
    volume: '150 ml',
    price: 28.00,
    stock: 31,
    imageColor: 'from-teal-50 to-blue-50',
    keyIngredients: ['Harmanček', 'Pantenol', 'Glycerín']
  }
];

const STORAGE_KEY = 'say_clinic_cosmetics_catalog_v2';

export function getCosmeticsCatalog(): CosmeticProduct[] {
  if (typeof window === 'undefined') return INITIAL_COSMETICS_CATALOG;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Chyba načítania katalógu kozmetiky z localStorage:', err);
  }
  return INITIAL_COSMETICS_CATALOG;
}

export function saveCosmeticsCatalog(catalog: CosmeticProduct[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(catalog));
  } catch (err) {
    console.error('Chyba ukladania katalógu kozmetiky:', err);
  }
}

export function resetCosmeticsCatalog(): CosmeticProduct[] {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  }
  return INITIAL_COSMETICS_CATALOG;
}
