import { MeicetSkincareProduct, MeicetTreatmentPlanItem } from '@/types/meicet';

export interface SkincareAlternativeCategory {
  id: string;
  label: string;
  icon?: string;
  description: string;
  products: (Omit<MeicetSkincareProduct, 'step'> & { id: string })[];
}

export interface ProcedureAlternativeCategory {
  id: string;
  label: string;
  description: string;
  procedures: MeicetTreatmentPlanItem[];
}

export const SKINCARE_ALTERNATIVES_CATALOG: SkincareAlternativeCategory[] = [
  {
    id: 'antioxidant',
    label: 'Antioxidanty & Denné séra',
    description: 'Ochrana pred voľnými radikálmi, neutralizácia UV stresu a podpora jasu pleti',
    products: [
      {
        id: 'skinc-ce-ferulic',
        category: 'Antioxidant & Ochrana',
        brand: 'SkinCeuticals',
        productName: 'C E Ferulic',
        activeIngredients: '15% L-askorbová kyselina + 1% alfa-tokoferol + 0.5% kyselina ferulová',
        keyActiveIngredient: '15% Čistý vitamín C (L-askorbová kyselina) + Kyselina ferulová',
        whyItMatters: 'Zlatý štandard antioxidantov. Zvyšuje prirodzenú ochranu pleti pred fotopoškodením 8-násobne a stimuluje syntézu kolagénu v dermis.',
        frequencySchedule: 'Každé ráno 4-5 kvapiek na vyčistenú suchú tvár a krk.',
        usage: 'Aplikujte 4-5 kvapiek ráno pred hydratačným krémom a SPF.',
        purpose: '8-násobná neutralizácia voľných radikálov a fotoprotekcia.',
        price: 175,
        galenicForm: 'serum',
        meicetJustification: 'Indikované pri fotopoškodení a suboptimálnom UV skóre.',
        isExternal: false
      },
      {
        id: 'skinc-phloretin-gel',
        category: 'Antioxidant & Zmatnenie',
        brand: 'SkinCeuticals',
        productName: 'Phloretin CF Gel',
        activeIngredients: '10% L-askorbová kyselina + 2% Phloretin + 0.5% kyselina ferulová',
        keyActiveIngredient: 'Phloretin + 10% Vitamín C v ľahkom géli',
        whyItMatters: 'Ideálna antioxidačná alternatíva pre zmiešanú, mastnejšiu alebo citlivú pleť, ktorej nevyhovuje kyslé tekuté sérum.',
        frequencySchedule: 'Každé ráno 2 dávky pumpy.',
        usage: 'Aplikujte ráno na vyčistenú pleť pred SPF.',
        purpose: 'Zjednotenie tónu pleti, redukcia pigmentov a ľahký matný finiš.',
        price: 165,
        galenicForm: 'gel',
        meicetJustification: 'Vhodné pri zvýšenom maze v T-zóne a diskoloráciách.',
        isExternal: false
      },
      {
        id: 'medik8-c-tetra-luxe',
        category: 'Lipidový antioxidant',
        brand: 'Medik8',
        productName: 'C-Tetra Luxe',
        activeIngredients: '14% Tetrahexyldecyl Ascorbate (lipidový vitamín C) + Vitamín E + Skvalán',
        keyActiveIngredient: 'Tetrahexyldecyl Ascorbate 14% (nedráždivý stabilný lipidový ester vit C)',
        whyItMatters: 'Preniká hlbšie cez lipidovú dvojvrstvu bez dráždenia či začervenania. Vhodný pre reaktívnu a suchšiu pleť.',
        frequencySchedule: 'Každé ráno 4 kvapky na tvár a krk.',
        usage: 'Aplikujte 4 kvapky ráno po čistení.',
        purpose: 'Rozjasnenie, hĺbková antioxidačná ochrana bez nízkeho pH.',
        price: 68,
        galenicForm: 'serum',
        meicetJustification: 'Jemný antioxidant vhodný pri citlivej pleti s cievnym erytémom.',
        isExternal: true,
        pharmacyBrand: true,
        externalProviderNote: 'Dostupné v partnerských lekárňach alebo e-shope'
      },
      {
        id: 'geek-c-glow',
        category: 'Ľahké antioxidačné sérum',
        brand: 'Geek & Gorgeous',
        productName: 'C-Glow 15% Vitamin C',
        activeIngredients: '15% Kyselina L-askorbová + Kyselina ferulová + Tokoferol',
        keyActiveIngredient: 'Čistý vitamín C 15% vo vodovej textúre',
        whyItMatters: 'Ultraľahká tekutá vodová konzistencia, ktorá neupcháva póry a rýchlo sa vstrebáva.',
        frequencySchedule: 'Každé ráno 3-4 kvapky.',
        usage: 'Aplikujte ráno ako prvý krok po tonizácii / čistení.',
        purpose: 'Cenovo dostupný vysoko účinný antioxidant s čerstvou formuláciou.',
        price: 13,
        galenicForm: 'fluid',
        meicetJustification: 'Efektívna antioxidačná ochrana za dostupnú cenu.',
        isExternal: true,
        pharmacyBrand: true,
        externalProviderNote: 'Voľnopredajná dermokozmetika'
      },
      {
        id: 'skinc-phyto-corrective',
        category: 'Upokojujúce sérum proti erytému',
        brand: 'SkinCeuticals',
        productName: 'Phyto Corrective',
        activeIngredients: 'Botanické extrakty (uhorka, tymián, olivové listy) + Kyselina hyalurónová',
        keyActiveIngredient: 'Fytobotanický komplex na vazokonstrikciu a upokojenie erytému',
        whyItMatters: 'Okamžite tlmí cievnu reaktivitu, ochladzuje zapálenú pokožku a redukuje začervenanie.',
        frequencySchedule: 'Ráno aj večer 3-4 kvapky.',
        usage: 'Aplikujte 3-5 kvapiek na začervenané zóny pred krémom.',
        purpose: 'Protizápalový efekt a úľava pri reaktívnej cievnej pleti.',
        price: 78,
        galenicForm: 'gel',
        meicetJustification: 'Kľúčové pri vysokom skóre cievneho erytému a teleangiektáziách.',
        isExternal: false
      }
    ]
  },
  {
    id: 'barrier_moisturizer',
    label: 'Bariérové krémy & Hydratácia',
    description: 'Obnova stratum corneum, uzamknutie hydratácie (TEWL) a ceramidová výživa',
    products: [
      {
        id: 'skinc-triple-lipid',
        category: 'Bariérový lipidový krém',
        brand: 'SkinCeuticals',
        productName: 'Triple Lipid Restore 2:4:2',
        activeIngredients: '2% čisté ceramidy (1 & 3) + 4% cholesterol + 2% mastné kyseliny',
        keyActiveIngredient: 'Patentovaný pomer bio-identických lipidov 2:4:2 (Ceramidy : Cholesterol : Mastné kyseliny)',
        whyItMatters: 'Presne kopíruje fyziologické zloženie medzibunkového tmelu kože. Zlepšuje elasticitu o 66% a redukuje TEWL.',
        frequencySchedule: 'Ráno aj večer tenká vrstva po sére.',
        usage: 'Zahrejte malé množstvo medzi prstami a jemne vmasírujte.',
        purpose: 'Kompletná obnova lipidovej bariéry a prevencia vysúšania.',
        price: 145,
        galenicForm: 'cream',
        meicetJustification: 'Zásadný pri narušenej kožnej bariére a zrýchlenom odparovaní vody.',
        isExternal: false
      },
      {
        id: 'cerave-facial-lotion',
        category: 'Ľahká hydratačná emulzia',
        brand: 'CeraVe',
        productName: 'Facial Moisturising Lotion (PM)',
        activeIngredients: '3 esenciálne ceramidy (1, 3, 6-II) + Niacínamid + Kyselina hyalurónová',
        keyActiveIngredient: '3 esenciálne ceramidy v MVE technológii postupného uvoľňovania',
        whyItMatters: 'Nekomedogénna, ľahučká emulzia, ktorá nezaťažuje póry a zároveň dlhodobo obnovuje bariéru.',
        frequencySchedule: 'Každé ráno a/alebo večer podľa potreby.',
        usage: 'Aplikujte na tvár a krk.',
        purpose: 'Ľahká celodenná hydratácia bez mastného filmu.',
        price: 16,
        galenicForm: 'emulsion',
        meicetJustification: 'Šetrná neupchávajúca bariérová starostlivosť.',
        isExternal: true,
        pharmacyBrand: true,
        externalProviderNote: 'Dostupné v lekárňach'
      },
      {
        id: 'lrp-cicaplast-baume',
        category: 'Intenzívny regeneračný balzam',
        brand: 'La Roche-Posay',
        productName: 'Cicaplast Baume B5+',
        activeIngredients: 'Madecassoside + 5% Pantenol + Tribioma (prebiotický komplex) + Zinok & Meď',
        keyActiveIngredient: '5% Pantenol (Vitamín B5) + Madecassoside z Centella Asiatica',
        whyItMatters: 'Okamžitá prvá pomoc na podráždenú, zapálenú alebo poškodenú kožu po zákrokoch. Zmierňuje pálenie a svrbenie.',
        frequencySchedule: 'Podľa potreby 2-krát denne alebo na noc ako SOS kúra.',
        usage: 'Naneste hrubšiu vrstvu na postihnuté alebo začervenané miesta.',
        purpose: 'Rýchla epitelizácia, antibakteriálna ochrana a upokojenie.',
        price: 14,
        galenicForm: 'balm',
        meicetJustification: 'Indikované po laserových procedúrach a pri akútnom podráždení.',
        isExternal: true,
        pharmacyBrand: true,
        externalProviderNote: 'Dostupné v každej lekárni'
      },
      {
        id: 'lrp-toleriane-fluide',
        category: 'Upokojujúci fluid pre precitlivenú pleť',
        brand: 'La Roche-Posay',
        productName: 'Toleriane Dermallergo Fluide',
        activeIngredients: 'Sphingobioma + Neurosensine + Termálna voda',
        keyActiveIngredient: 'Neurosensine (blokuje prejavy neurogénneho zápalu a pálenia)',
        whyItMatters: 'Ultra minimalistické zloženie v sterilnom balení bez parfumov a alkoholu pre extrémnu reaktivitu.',
        frequencySchedule: 'Ráno aj večer na vyčistenú pleť.',
        usage: 'Jemne vklepte do pokožky.',
        purpose: 'Okamžitá redukcia citlivosti, pnutia a reaktivity.',
        price: 23,
        galenicForm: 'fluid',
        meicetJustification: 'Vhodné pre pacientov so sklonom k alergickým reakciám a ekzémom.',
        isExternal: true,
        pharmacyBrand: true,
        externalProviderNote: 'Dostupné v lekárňach'
      },
      {
        id: 'bioderma-sensibio-defensive-rich',
        category: 'Bohatý výživný upokojujúci krém',
        brand: 'Bioderma',
        productName: 'Sensibio Defensive Rich',
        activeIngredients: 'Defensive Technology (karnozín, vitamín E, tetrapedtid-10, červená šalvia)',
        keyActiveIngredient: 'Karnozín + Tetrapeptid-10 (posilňujú prirodzenú obranyschopnosť kože)',
        whyItMatters: 'Výživná hutnejšia textúra pre suchú a dehydrovanú pleť vystavenú chladu a vetru.',
        frequencySchedule: 'Každé ráno a/alebo večer.',
        usage: 'Naneste na suchú pleť tváre a dekoltu.',
        purpose: 'Hĺbková výživa a ochrana pred vonkajšími vplyvmi.',
        price: 19,
        galenicForm: 'cream',
        meicetJustification: 'Zlepšuje komfort suchej pleti s nízkym indexom hydratácie.',
        isExternal: true,
        pharmacyBrand: true,
        externalProviderNote: 'Dostupné v lekárňach'
      }
    ]
  },
  {
    id: 'retinoids_night',
    label: 'Nočné aktívne látky (Retinoidy & Kyseliny)',
    description: 'Bunková obnova, stimulácia tvorby kolagénu, zjemnenie textúry a redukcia pórov',
    products: [
      {
        id: 'medik8-crystal-retinal-3',
        category: 'Retinaldehyd (Šetrný & Rýchly)',
        brand: 'Medik8',
        productName: 'Crystal Retinal 3 (0.03%)',
        activeIngredients: '0.03% Zapuzdrený retinaldehyd + Kyselina hyalurónová + Vitamín E',
        keyActiveIngredient: '0.03% Retinaldehyd (vyžaduje len 1 konverziu na kyselinu retinovú)',
        whyItMatters: 'Pôsobí 11-krát rýchlejšie ako klasický retinol, no s minimálnym rizikom podráždenia. Navyše má priamy antibakteriálny účinok proti Cutibacterium acnes.',
        frequencySchedule: 'Titrácia: 1. a 2. týždeň 2x do týždňa, 3. a 4. týždeň obdeň, potom každý večer.',
        titrationNotes: 'Aplikujte výhradne večer na suchú pleť. V rannom protokole je povinné SPF 50+.',
        usage: 'Aplikujte 2 pumpy večer na suchú očistenú pleť pred krémom.',
        purpose: 'Vyhladenie jemných vrások, spevnenie pleti a stiahnutie pórov.',
        price: 62,
        galenicForm: 'serum',
        meicetJustification: 'Ideálne pri počiatočných známkach starnutia a zhoršenej textúre.',
        isExternal: true,
        pharmacyBrand: true,
        externalProviderNote: 'Dostupné v špecializovaných salónoch a e-shope'
      },
      {
        id: 'medik8-crystal-retinal-6',
        category: 'Vyššia koncentrácia retinalu',
        brand: 'Medik8',
        productName: 'Crystal Retinal 6 (0.06%)',
        activeIngredients: '0.06% Zapuzdrený retinaldehyd + Kyselina hyalurónová + Glycerín',
        keyActiveIngredient: '0.06% Retinaldehyd',
        whyItMatters: 'Pre pokožku už navyknutú na slabší retinoid. Výrazne zvyšuje hustotu kolagénu a redukuje hlbšie mimické vrásky.',
        frequencySchedule: 'Každý druhý večer alebo denne podľa tolerancie.',
        titrationNotes: 'Prechod z Retinalu 3 až po minimálne 6 týždňoch plnej tolerancie.',
        usage: 'Aplikujte večer pred hydratačným krémom.',
        purpose: 'Intenzívny anti-aging a remodelácia dermis.',
        price: 75,
        galenicForm: 'serum',
        meicetJustification: 'Indikované pri výraznejšom fotostarnutí a vráskach.',
        isExternal: true,
        pharmacyBrand: true,
        externalProviderNote: 'Dostupné v špecializovaných salónoch'
      },
      {
        id: 'skinc-retinol-03',
        category: 'Klinický čistý retinol',
        brand: 'SkinCeuticals',
        productName: 'Retinol 0.3%',
        activeIngredients: '0.3% čistý retinol v zapuzdrenej technológii + Bisabolol + Boswellia Serrata',
        keyActiveIngredient: '0.3% Čistý stabilizovaný retinol v lipidovom nosiči',
        whyItMatters: 'Klinická čistota retinolu zaručuje maximálnu stimuláciu fibroblastov. Upokojujúci bisabolol znižuje riziko retinoidnej dermatitídy.',
        frequencySchedule: '1x týždenne večer počas 2 týždňov, potom 2x týždenne.',
        titrationNotes: 'Vynechať 5 dní pred laserovým zákrokom alebo chemickým peelingom.',
        usage: 'Večer veľkosť hrášku na suchú pleť.',
        purpose: 'Redukcia hĺbky vrások, pigmentácií a stimulácia syntézy prokolagénu.',
        price: 85,
        galenicForm: 'cream',
        meicetJustification: 'Indikované pri fotostarnutí a strate elasticity.',
        isExternal: false
      },
      {
        id: 'theramid-azid',
        category: 'Vysokokoncentrovaná kyselina azelaová',
        brand: 'Theramid',
        productName: 'AZID 15% Azelaic Acid Treatment',
        activeIngredients: '15% Kyselina azelaová + 1% Karnozín + 1% Koloidný ovos',
        keyActiveIngredient: '15% Kyselina azelaová (protizápalová, cievna a depigmentačná molekula)',
        whyItMatters: 'Zlatý štandard pri rosacei a citlivej pleti s akné. Inhibuje kalikreín-5 a katelicidíny, čím eliminuje začervenanie a papuly.',
        frequencySchedule: 'Každý večer po očistení pleti.',
        titrationNotes: 'Možné jemné brnenie prvé 3 dni, ktoré rýchlo ustúpi.',
        usage: 'Naneste rovnomerne na tvár večer.',
        purpose: 'Redukcia erytému, rosacey, pozápalových škvŕn a rozšírených ciev.',
        price: 35,
        galenicForm: 'fluid',
        meicetJustification: 'Kľúčové pri vysokom cievnom skóre a riziku rosacey.',
        isExternal: true,
        pharmacyBrand: true,
        externalProviderNote: 'Dostupné online alebo v lekárňach'
      }
    ]
  },
  {
    id: 'rx_dermatology',
    label: '💊 Lokálne liečivá viazané na lekársky predpis (Rx)',
    description: 'Cielená liečba dermatologických ochorení indikovaná lekárom (rosacea, periorálna dermatitída, akné)',
    products: [
      {
        id: 'rx-soolantra',
        category: 'Antiparazitárne & Protizápalové Rx',
        brand: 'Galderma (Rx)',
        productName: 'Soolantra 10 mg/g krém',
        activeIngredients: 'Ivermektín 10 mg/g (1%)',
        keyActiveIngredient: 'Ivermektín 1% (selektívna eliminácia roztočov Demodex folliculorum)',
        whyItMatters: 'Liečivo prvej voľby pri papulopustulóznej rozacei. Ničí premnoženého kožného roztoča Demodex a zásadne potláča zápalové cytokíny.',
        frequencySchedule: '1x denne večer tenká vrstva na celú tvár po dobu 12 týždňov.',
        titrationNotes: 'Liek je viazaný na lekársky predpis (Rp.). Medzi 2. a 3. týždňom môže nastať dočasné mierne zhoršenie z rozpadu roztočov.',
        usage: 'Aplikujte veľkosť hrášku na 5 oblastí tváre (čelo, nos, brada, obe líca).',
        purpose: 'Vyliečenie zápalových prejavov rosacey a dlhodobá remisia.',
        price: 18,
        galenicForm: 'rx',
        meicetJustification: 'Indikované pri podozrení na rozaceu a mikrobiálnu dysbiózu na Meicet.',
        isExternal: true,
        prescriptionOnly: true,
        externalProviderNote: 'Liek viazaný na lekársky predpis (Rp.) – predpisuje lekár kliniky'
      },
      {
        id: 'rx-skinoren',
        category: 'Dermatologický krém s kyselinou azelaovou Rx',
        brand: 'Leo Pharma (Rx)',
        productName: 'Skinoren 20% krém',
        activeIngredients: 'Kyselina azelaová 200 mg/g (20%)',
        keyActiveIngredient: '20% Kyselina azelaová mikronizovaná',
        whyItMatters: 'Vysoká medicínska koncentrácia normalizuje proces rohovatenia (keratinizácie) v ústí folikulov a zosvetľuje pozápalové pigmentácie.',
        frequencySchedule: '1x až 2x denne podľa znášanlivosti.',
        titrationNotes: 'Pri citlivej pleti začať 1x denne večer. Vyhnúť sa očnému okoliu.',
        usage: 'Naneste tenkú vrstvu na čistú suchú pokožku.',
        purpose: 'Liečba akné vulgaris a papulóznej rosacey, redukcia komedónov.',
        price: 16,
        galenicForm: 'rx',
        meicetJustification: 'Indikované pri komedónoch, hyperkeratóze a pigmentových škvrnách.',
        isExternal: true,
        prescriptionOnly: true,
        externalProviderNote: 'Liek viazaný na lekársky predpis (Rp.)'
      },
      {
        id: 'rx-rozex',
        category: 'Antibakteriálny & Protizápalový gél Rx',
        brand: 'Galderma (Rx)',
        productName: 'Rozex 0.75% gél / krém',
        activeIngredients: 'Metronidazol 7.5 mg/g (0.75%)',
        keyActiveIngredient: 'Metronidazol 0.75%',
        whyItMatters: 'Klasické antibiotické a antioxidačné lokálne liečivo, ktoré znižuje reaktívne formy kyslíka produkované neutrofilmi pri rosacei.',
        frequencySchedule: '2x denne ráno a večer.',
        titrationNotes: 'Používať po dobu 2 až 3 mesiacov podľa pokynov lekára.',
        usage: 'Tenká vrstva na postihnuté zóny tváre.',
        purpose: 'Rýchle potlačenie zápalových červených ložísk a pustúl.',
        price: 12,
        galenicForm: 'rx',
        meicetJustification: 'Indikované pri akútnom cievnom a zápalovom náleze.',
        isExternal: true,
        prescriptionOnly: true,
        externalProviderNote: 'Liek viazaný na lekársky predpis (Rp.)'
      },
      {
        id: 'rx-differin',
        category: 'Retinoid 3. generácie Rx',
        brand: 'Galderma (Rx)',
        productName: 'Differin 0.1% gél',
        activeIngredients: 'Adapalén 1 mg/g (0.1%)',
        keyActiveIngredient: 'Adapalén 0.1% (selektívny modulátor RAR-beta a RAR-gama receptorov)',
        whyItMatters: 'Chemicky stabilný retinoid so silným protizápalovým profilom. Moduluje bunkovú diferenciáciu a keratinizáciu bez oxidácie svetlom.',
        frequencySchedule: '1x denne na noc na suchú pokožku.',
        titrationNotes: 'Vynechať pred pobytom na intenzívnom slnku. Striktná fotoprotekcia cez deň.',
        usage: 'Večer tenká vrstva po umytí a dôkladnom vysušení.',
        purpose: 'Odstránenie mikrokomedónov, prevencia akné a zjemnenie pórov.',
        price: 15,
        galenicForm: 'rx',
        meicetJustification: 'Indikované pri výrazných póroch, mazotoku a komedonickom akné.',
        isExternal: true,
        prescriptionOnly: true,
        externalProviderNote: 'Liek viazaný na lekársky predpis (Rp.)'
      }
    ]
  },
  {
    id: 'spf_protection',
    label: 'Fotoprotekcia SPF 50+',
    description: 'Širokospektrálna ochrana pred UVA, UVB, HEV modrým svetlom a infračerveným žiarením',
    products: [
      {
        id: 'skinc-mineral-radiance',
        category: '100% Minerálne SPF s tónovaním',
        brand: 'SkinCeuticals',
        productName: 'Mineral Radiance UV Defense SPF 50',
        activeIngredients: '100% minerálne filtre (Titanium Dioxide) + Artémia salina',
        keyActiveIngredient: 'Mikronizovaný oxid titaničitý + planktónový extrakt Artemia Salina',
        whyItMatters: 'Čisto minerálny štít bez chemických filtrov. Nedráždi oči, neštípe reaktívne cievky a tónovanie maskuje erytém.',
        frequencySchedule: 'Každé ráno ako posledný krok rutiny pred líčením.',
        usage: 'Pretrepať a aplikovať 2 dĺžky prstov na tvár a krk.',
        purpose: 'Maximálna fyzikálna ochrana po zákrokoch a pri cievnej pleti.',
        price: 48,
        galenicForm: 'fluid',
        meicetJustification: 'Nevyhnutná ochrana pri skóre UV poškodenia a sklone k cievkam.',
        isExternal: false
      },
      {
        id: 'lrp-anthelios-uvmune',
        category: 'Ultraľahký neviditeľný fluid',
        brand: 'La Roche-Posay',
        productName: 'Anthelios UVMune 400 Invisible Fluid SPF 50+',
        activeIngredients: 'Patentovaný filter Mexoryl 400 + Netlock technológia',
        keyActiveIngredient: 'Mexoryl 400 (chráni pred ultra-dlhými UVA lúčmi v spektre 380–400 nm)',
        whyItMatters: 'Kryje najzákernejšiu časť UV spektra, ktorá preniká do hlbokej dermis a poškodzuje DNA buniek.',
        frequencySchedule: 'Každé ráno. Re-aplikácia pri pobyte na priamom slnku každé 2-3 hodiny.',
        usage: 'Naneste na tvár, krk aj očné okolie.',
        purpose: 'Najmodernejšia hĺbková ochrana pred fotostarnutím a pigmentáciami.',
        price: 22,
        galenicForm: 'fluid',
        meicetJustification: 'Zamedzenie prehĺbeniu skrytých pigmentácií a UV škvŕn.',
        isExternal: true,
        pharmacyBrand: true,
        externalProviderNote: 'Dostupné v každej lekárni'
      },
      {
        id: 'isdin-fusion-water',
        category: 'Vodový ultraľahký fluid',
        brand: 'ISDIN',
        productName: 'Fusion Water Magic SPF 50',
        activeIngredients: 'Kyselina hyalurónová + Extrakt zo stredomorskej riasy + Bezolejové zloženie',
        keyActiveIngredient: 'Water-phase technológia okamžitého vstrebania',
        whyItMatters: 'Nezanecháva žiadny mastný film, neštípe v očiach a je ideálny pod make-up aj pre športovcov.',
        frequencySchedule: 'Každé ráno na suchú alebo vlhkú pokožku.',
        usage: 'Aplikujte 30 minút pred vystavením sa slnku.',
        purpose: 'Ľahká hodvábna ochrana s okamžitým vstrebávaním.',
        price: 24,
        galenicForm: 'fluid',
        meicetJustification: 'Vhodné pri vyššej produkcii mazu a intolerancii mastných krémov.',
        isExternal: true,
        pharmacyBrand: true,
        externalProviderNote: 'Dostupné v lekárňach'
      }
    ]
  }
];

export const PROCEDURE_ALTERNATIVES_CATALOG: ProcedureAlternativeCategory[] = [
  {
    id: 'vascular_erythema',
    label: 'Cievne zmeny, erytém & rosacea',
    description: 'Koagulácia teleangiektázií a redukcia difúzneho začervenania',
    procedures: [
      {
        id: 'alt-laser-excel-v',
        name: 'Vaskulárny laser Excel V+ (532 nm / 1064 nm Nd:YAG)',
        category: 'laser',
        targetArea: 'Celá tvár, líca, nos a brada',
        seasonOrMonth: 'Q1 (Jan - Mar) alebo Q4 (Okt - Dec)',
        frequency: 'Séria 2-3 ošetrení s odstupom 4-6 týždňov',
        priority: 'vysoká',
        estimatedPrice: 220,
        reasoning: 'Zlatý štandard cievnej dermatológie. Vlnová dĺžka 532 nm sa selektívne viaže na oxyhemoglobín v rozšírených kapilárach, teplom ich zataví a telo ich prirodzene vstrebe bez jaziev.',
        status: 'planned'
      },
      {
        id: 'alt-ipl-lumecca',
        name: 'IPL Lumecca (InMode)',
        category: 'laser',
        targetArea: 'Tvár a dekolt',
        seasonOrMonth: 'Q1 alebo Q4',
        frequency: 'Séria 2-3 sedení',
        priority: 'odporúčaná',
        estimatedPrice: 180,
        reasoning: 'Špičkové pulzné svetlo s vysokým špičkovým výkonom v pásme 500–600 nm. Rieši súčasne difúzne cievne začervenanie aj povrchové hnedé slnečné pigmentácie.',
        status: 'planned'
      },
      {
        id: 'alt-laser-genesis',
        name: 'Laser Genesis (Nd:YAG 1064 nm mikro-pulzný)',
        category: 'laser',
        targetArea: 'Celá tvár',
        seasonOrMonth: 'Celoročne (aj v lete)',
        frequency: 'Séria 4-5 sedení každé 2-3 týždne',
        priority: 'odporúčaná',
        estimatedPrice: 140,
        reasoning: 'Bezbolestné fototermické ošetrenie bez rekonvalescencie. Jemné prehrievanie papilárnej dermis znižuje reaktivitu ciev a sťahuje póry.',
        status: 'planned'
      }
    ]
  },
  {
    id: 'biorevitalisation_collagen',
    label: 'Biorevitalizácia, hydratácia & DNA regenerácia',
    description: 'Hĺbkové zahustenie dermis, biostimulácia fibroblastov a obnova extracelulárnej matrice',
    procedures: [
      {
        id: 'alt-rejuran-healer',
        name: 'Rejuran Healer (Polynukleotidy PDRN)',
        category: 'injectable',
        targetArea: 'Tvár, očné okolie a krk',
        seasonOrMonth: 'Q1 alebo Q3',
        frequency: 'Protokol 3 sedení po 3 týždňoch',
        priority: 'vysoká',
        estimatedPrice: 320,
        reasoning: 'Vysoko purifikované fragmenty DNA lososa aktivujú adenozínové A2A receptory, čím urýchľujú fyziologickú regeneráciu tkaniva, zahusťujú atrofovanú dermis a potláčajú zápaly.',
        status: 'planned'
      },
      {
        id: 'alt-profhilo',
        name: 'Profhilo (2ml hybridná stabilizovaná HA)',
        category: 'injectable',
        targetArea: 'BAP technika 5 bodov na každej strane tváre',
        seasonOrMonth: 'Q2 (Jar/Pred letom) alebo Q4',
        frequency: '2 sedenia s odstupom 4 týždňov',
        priority: 'vysoká',
        estimatedPrice: 290,
        reasoning: 'Unikátna zmes vysoko a nízkomolekulárnej kyseliny hyalurónovej bez BDDE sieťovadla. Pôsobí bio-remodelačne na keratinocyty a fibroblasty, poskytuje hydro-lifting.',
        status: 'planned'
      },
      {
        id: 'alt-jalupro-super-hydro',
        name: 'Jalupro Super Hydro (Aminokyseliny + Peptidy + HA)',
        category: 'injectable',
        targetArea: 'Väzivový aparát tváre a dekoltu',
        seasonOrMonth: 'Q2 alebo Q4',
        frequency: '2 sedenia',
        priority: 'odporúčaná',
        estimatedPrice: 280,
        reasoning: 'Dodáva presné stavebné kamene (glycín, prolín, lyzín) pre novotvorbu kolagénu typu I a III a spevnenie faciálnych ligamentov.',
        status: 'planned'
      },
      {
        id: 'alt-restylane-skinboosters',
        name: 'Restylane Skinboosters Vital Light (1ml)',
        category: 'injectable',
        targetArea: 'Líca, jemné linky okolo úst a očí',
        seasonOrMonth: 'Q3 alebo Q4',
        frequency: 'Séria 2 sedení',
        priority: 'odporúčaná',
        estimatedPrice: 250,
        reasoning: 'Mikrokvapky stabilizovanej kyseliny hyalurónovej vytvárajú vodný rezervoár v hlbšej koži na 9-12 mesiacov.',
        status: 'planned'
      }
    ]
  },
  {
    id: 'texture_pores_rf',
    label: 'Textúra, póry, jazvy & rádiofrekvencia',
    description: 'Frakčná obnova kožného reliéfu, sťahovanie rozšírených pórov a liečba jaziev',
    procedures: [
      {
        id: 'alt-morpheus8',
        name: 'Morpheus8 Frakčný rádiofrekvenčný microneedling',
        category: 'laser',
        targetArea: 'Tvár, podbradok a krk',
        seasonOrMonth: 'Q4 (Jeseň / Zima)',
        frequency: '2-3 sedenia po 6 týždňoch',
        priority: 'odporúčaná',
        estimatedPrice: 450,
        reasoning: 'Zlatý štandard nechirurgického spevnenia. Izolované mikroihličky prenikajú až do hĺbky 4 mm a dodávajú tepelnú energiu priamo do kolagénových vlákien bez popálenia povrchu.',
        status: 'planned'
      },
      {
        id: 'alt-secret-rf',
        name: 'Secret RF Microneedling',
        category: 'laser',
        targetArea: 'Tvár a jazvy',
        seasonOrMonth: 'Q1 alebo Q4',
        frequency: '3 sedenia',
        priority: 'odporúčaná',
        estimatedPrice: 350,
        reasoning: 'Šetrnejší frakčný mikroneedling s minimálnym prestojom, cielený na póry a nerovnomerný reliéf pleti.',
        status: 'planned'
      },
      {
        id: 'alt-hydrafacial',
        name: 'HydraFacial Syndeo Platinum (Drenáž + Peeling + Infúzia)',
        category: 'skin_care',
        targetArea: 'Celá tvár a krk',
        seasonOrMonth: 'Každý kvartál (udržiavacie)',
        frequency: '1x mesačne alebo každé 3 mesiace',
        priority: 'odporúčaná',
        estimatedPrice: 150,
        reasoning: 'Vortexová technológia bezbolestne extrahuje komedóny, odstraňuje zrohovatené bunky a pod tlakom infunduje antioxidanty a peptidy.',
        status: 'planned'
      },
      {
        id: 'alt-biorepeel',
        name: 'BioRePeelCl3 / PRX-T33 Biorevitalizačný peeling',
        category: 'skin_care',
        targetArea: 'Tvár a krk',
        seasonOrMonth: 'Q1, Q3 alebo Q4',
        frequency: 'Séria 4 sedení po 10 dňoch',
        priority: 'odporúčaná',
        estimatedPrice: 110,
        reasoning: 'Dvojfázový patentovaný peeling s 35% TCA, ktorý nestrhuje pokožku, ale stimuluje fibroblasty a zjednocuje tón bez olupovania.',
        status: 'planned'
      }
    ]
  }
];
