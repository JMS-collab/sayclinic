import { 
  MeicetAnalysisResult, 
  MeicetClinicalEducation, 
  MeicetPathophysiologyIssue, 
  MeicetTherapeuticPhase, 
  MeicetActiveIngredientEducation, 
  MeicetProcedureMechanismEducation,
  MeicetSkincareProduct,
  MeicetSkincareTierRoutine
} from '@/types/meicet';

export class MeicetClinicalEducationService {
  /**
   * Syntetizuje alebo vráti existujúcu klinickú edukáciu pre daný report.
   * Vytvára most medzi objektívnymi dátami zo skenera Meicet a konkrétnymi molekulami a prístrojmi.
   */
  public static getClinicalEducation(report: MeicetAnalysisResult): MeicetClinicalEducation {
    if (report.clinicalEducation && report.clinicalEducation.pathophysiology?.issues?.length > 0) {
      return report.clinicalEducation;
    }

    return this.synthesizeClinicalEducation(report);
  }

  /**
   * Zostaví optimálny expertný balík CLINICAL OPTIMUM (to najlepšie pre pleť bez ohľadu na značku a sklad)
   * na základe nameraných objektívnych Meicet hodnôt.
   */
  public static generateExpertOptimalRoutine(report: MeicetAnalysisResult): MeicetSkincareTierRoutine {
    const { metrics, anamnesis } = report;

    const morning: MeicetSkincareProduct[] = [];
    const evening: MeicetSkincareProduct[] = [];

    const isDehydrated = (metrics.hydration?.score || 50) < 55 || metrics.hydration?.tewlLevel === 'vysoká';
    const hasVascularIssue = (metrics.redAreas?.score || 0) > 40 || metrics.redAreas?.rosaceaRisk;
    const hasPhotoaging = (metrics.uvDamage?.score || 0) > 35 || (metrics.wrinkles?.score || 0) > 40;
    const hasSebum = (metrics.sebumAndPorphyrins?.score || 0) > 45;

    // AM KROK 1: Čistenie
    if (isDehydrated || hasVascularIssue) {
      morning.push({
        step: 1,
        category: 'Jemné čistenie & Bariéra',
        brand: 'CeraVe',
        productName: 'Hydrating Cleanser (Hydratačný čistiaci krém)',
        activeIngredients: '3 esenciálne ceramidy + Kyselina hyalurónová',
        keyActiveIngredient: 'Bio-identické ceramidy (1, 3, 6-II) + Glycerín',
        whyItMatters: 'Fyziologický nepenivý čistič bez sulfátov. Odstraňuje nočný kožný maz bez toho, aby rozpustil lipidovú bariéru.',
        frequencySchedule: 'Každé ráno',
        usage: 'Naneste na navlhčenú pokožku, premasírujte a opláchnite vlažnou vodou.',
        purpose: 'Šetrné ranné umytie bez podráždenia či narušenia TEWL.',
        price: 14,
        galenicForm: 'cream',
        meicetJustification: 'Indikované pri citlivej pleti so sklonom k dehydratácii a erytému.',
        isExternal: true,
        pharmacyBrand: true,
        externalProviderNote: 'Dostupné v každej lekárni'
      });
    } else {
      morning.push({
        step: 1,
        category: 'Emolienčné čistenie',
        brand: 'SkinCeuticals',
        productName: 'Gentle Cleanser',
        activeIngredients: 'Pomarančový olej + Alantoín + Emolienty',
        keyActiveIngredient: 'Upokojujúci alantoín a hydratačné zmäkčovadlá',
        whyItMatters: 'Jemne rozpúšťa nečistoty a zanecháva kožný film hebký a hydratovaný.',
        frequencySchedule: 'Každé ráno',
        usage: 'Vmasírujte do navlhčenej tváre a opláchnite.',
        purpose: 'Vyčistenie a zjemnenie povrchu pokožky.',
        price: 42,
        galenicForm: 'cream',
        meicetJustification: 'Overený klinický čistič pre maximálnu toleranciu.',
        isExternal: false
      });
    }

    // AM KROK 2: Špičkový antioxidant podľa pleti
    if (hasVascularIssue) {
      morning.push({
        step: 2,
        category: 'Lipidový nedráždivý antioxidant',
        brand: 'Medik8',
        productName: 'C-Tetra Luxe',
        activeIngredients: '14% Tetrahexyldecyl Ascorbate + Vitamín E + Skvalán',
        keyActiveIngredient: '14% Lipidový ester vitamínu C (nedráždivý pre kapiláry)',
        whyItMatters: 'Na rozdiel od kyslej L-askorbovej nepôsobí dráždivo na vazodilatované cievky, no preniká hlboko do lipidovej dvojvrstvy a rozjasňuje pleť.',
        frequencySchedule: 'Každé ráno 4-5 kvapiek',
        usage: 'Aplikujte ráno po čistení na suchú pokožku tváre a krku.',
        purpose: 'Fotoprotekcia, rozjasnenie a syntéza kolagénu bez začervenania.',
        price: 68,
        galenicForm: 'serum',
        meicetJustification: 'Optimálna antioxidačná forma pre vaskulárne reaktívnu pokožku.',
        isExternal: true,
        pharmacyBrand: true,
        externalProviderNote: 'Dostupné v špecializovaných salónoch a e-shope'
      });
    } else if (hasSebum) {
      morning.push({
        step: 2,
        category: 'Antioxidant & Zmatnenie',
        brand: 'SkinCeuticals',
        productName: 'Phloretin CF Gel',
        activeIngredients: '10% L-askorbová kyselina + 2% Floretín + 0.5% Kyselina ferulová',
        keyActiveIngredient: '10% Čistý vitamín C + Floretín v ľahkom géli',
        whyItMatters: 'Ideálna antioxidačná voľba pre zmiešanú pleť; chráni pred UV stresom a reguluje tvorbu mazu.',
        frequencySchedule: 'Každé ráno 2 dávky pumpy',
        usage: 'Aplikujte na vyčistenú suchú tvár.',
        purpose: 'Zjednotenie tónu a ochrana pred fotostarnutím.',
        price: 165,
        galenicForm: 'gel',
        meicetJustification: 'Indikované pri nerovnomernej pigmentácii a T-zóne.',
        isExternal: false
      });
    } else {
      morning.push({
        step: 2,
        category: 'Zlatý štandard antioxidantov',
        brand: 'SkinCeuticals',
        productName: 'C E Ferulic',
        activeIngredients: '15% L-askorbová kyselina + 1% alfa-tokoferol + 0.5% kyselina ferulová',
        keyActiveIngredient: 'Duke Formula: 15% Čistý Vitamín C + 0.5% Kyselina ferulová',
        whyItMatters: 'Najviac citovaný patentovaný antioxidant na svete. Zvyšuje prirodzenú obranyschopnosť pokožky 8-násobne.',
        frequencySchedule: 'Každé ráno 4-5 kvapiek',
        usage: 'Aplikujte ráno na vyčistenú tvár a krk.',
        purpose: '8-násobná neutralizácia voľných radikálov a syntéza prokolagénu.',
        price: 175,
        galenicForm: 'serum',
        meicetJustification: 'Kľúčové pri fotopoškodení a suboptimálnom UV indexe.',
        isExternal: false
      });
    }

    // AM KROK 3: Protizápalový cievny stabilizátor / Hydratácia
    if (hasVascularIssue) {
      morning.push({
        step: 3,
        category: 'Protizápalová & Vaskulárna stabilizácia',
        brand: 'Theramid',
        productName: 'AZID 15% Azelaic Acid Treatment',
        activeIngredients: '15% Kyselina azelaová + 1% Karnozín + 1% Koloidný ovos',
        keyActiveIngredient: '15% Kyselina azelaová (inhibícia kalikreínu-5 a katelicidínov)',
        whyItMatters: 'Dermatologický liek voľby bez predpisu na cievny erytém a rozaceu. Okamžite upokojuje reaktivitu ciev a zosvetľuje červené ložiská.',
        frequencySchedule: 'Každé ráno a/alebo večer',
        usage: 'Naneste malé množstvo na začervenané oblasti tváre pred krémom.',
        purpose: 'Redukcia teleangiektázií a difúzneho erytému.',
        price: 35,
        galenicForm: 'fluid',
        meicetJustification: 'Cielená liečba cievneho skóre Meicet.',
        isExternal: true,
        pharmacyBrand: true,
        externalProviderNote: 'Dostupné v lekárňach a dermokozmetických e-shopoch'
      });
    } else {
      morning.push({
        step: 3,
        category: 'Seboregulácia & Mikrocirkulácia',
        brand: 'Geek & Gorgeous',
        productName: 'B-Bomb 10% Niacinamide Serum',
        activeIngredients: '10% Niacínamid + Zinok PCA + Sarkozín',
        keyActiveIngredient: '10% Niacínamid (Vitamín B3)',
        whyItMatters: 'Zvyšuje syntézu ceramidov o 34%, zmenšuje rozšírené póry a posilňuje odolnosť cievneho riečišťa.',
        frequencySchedule: 'Každé ráno 3-4 kvapky',
        usage: 'Aplikujte pred krémom.',
        purpose: 'Zúženie pórov a vyváženie mazu.',
        price: 9,
        galenicForm: 'serum',
        meicetJustification: 'Indikované pri rozšírených póroch a zhoršenom kožnom reliéfe.',
        isExternal: true,
        pharmacyBrand: true,
        externalProviderNote: 'Dostupná dermokozmetika'
      });
    }

    // AM KROK 4: Bariérová hydratácia
    if (isDehydrated) {
      morning.push({
        step: 4,
        category: 'Bio-identická obnova bariéry',
        brand: 'SkinCeuticals',
        productName: 'Triple Lipid Restore 2:4:2',
        activeIngredients: '2% čisté ceramidy (1 & 3) + 4% cholesterol + 2% mastné kyseliny',
        keyActiveIngredient: 'Patentovaný pomer 2:4:2 (Ceramidy : Cholesterol : Mastné kyseliny)',
        whyItMatters: 'Kopíruje prirodzený medzibunkový tmel stratum corneum a hermeticky uzatvára transepidermálne odparovanie vody (TEWL).',
        frequencySchedule: 'Každé ráno pred SPF',
        usage: 'Zahrejte medzi prstami a jemne vmasírujte.',
        purpose: 'Okamžitá rekonštrukcia lipidovej bariéry.',
        price: 145,
        galenicForm: 'cream',
        meicetJustification: 'Kľúčové pri vysokom TEWL a narušenej kožnej bariére.',
        isExternal: false
      });
    } else {
      morning.push({
        step: 4,
        category: 'Upokojujúci ochranný fluid',
        brand: 'La Roche-Posay',
        productName: 'Toleriane Dermallergo Fluide',
        activeIngredients: 'Sphingobioma + Neurosensine + Termálna voda',
        keyActiveIngredient: 'Neurosensine (blokuje neurogénny zápal)',
        whyItMatters: 'Ultraľahká emulzia v sterilnom balení, ktorá nezaťažuje póry a prináša celodenný komfort.',
        frequencySchedule: 'Každé ráno pred SPF',
        usage: 'Aplikujte na tvár a krk.',
        purpose: 'Hydratácia a prevencia precitlivenosti.',
        price: 23,
        galenicForm: 'fluid',
        meicetJustification: 'Ideálna ľahká hydratácia pre normálnu až zmiešanú pleť.',
        isExternal: true,
        pharmacyBrand: true,
        externalProviderNote: 'Dostupné v lekárňach'
      });
    }

    // AM KROK 5: Širokospektrálne SPF 50+ s Mexorylom 400
    morning.push({
      step: 5,
      category: 'Špičková fotoprotekcia UV 400',
      brand: 'La Roche-Posay',
      productName: 'Anthelios UVMune 400 Invisible Fluid SPF 50+',
      activeIngredients: 'Patentovaný filter Mexoryl 400 + Netlock technológia',
      keyActiveIngredient: 'Mexoryl 400 (ochrana pred ultra-dlhým UVA žiarením 380–400 nm)',
      whyItMatters: 'Najmodernejší UV filter na svete, ktorý kryje najzákernejšie lúče poškodzujúce kolagén a bunkovú DNA.',
      frequencySchedule: 'Každé ráno ako finálny krok',
      usage: 'Aplikujte 2 dĺžky prstov na celú tvár a krk 20 min pred odchodom von.',
      purpose: 'Komplexná prevencia fotostarnutia a pigmentácií.',
      price: 22,
      galenicForm: 'fluid',
      meicetJustification: 'Nevyhnutná celoročná ochrana pred UV lúčmi.',
      isExternal: true,
      pharmacyBrand: true,
      externalProviderNote: 'Dostupné v každej lekárni'
    });

    // PM KROK 1: Večerné čistenie
    evening.push({
      step: 1,
      category: 'Micelárne šetrné čistenie',
      brand: 'Bioderma',
      productName: 'Sensibio H2O Micelárna voda',
      activeIngredients: 'Micely esterov mastných kyselín + D.A.F. patentovaný komplex',
      keyActiveIngredient: 'Fyziologické micely s pH 5.5',
      whyItMatters: 'Kultový dermatologický čistič, ktorý zachytáva mikročastice znečistenia a make-up bez trenia pokožky.',
      frequencySchedule: 'Každý večer',
      usage: 'Navlhčite bavlnený tampón a jemne očistite tvár a očné okolie.',
      purpose: 'Šetrné rozpustenie nečistôt a SPF filtra.',
      price: 15,
      galenicForm: 'fluid',
      meicetJustification: 'Nenarušuje cievny tonus a nezvyšuje reaktivitu.',
      isExternal: true,
      pharmacyBrand: true,
      externalProviderNote: 'Dostupné v lekárňach'
    });

    // PM KROK 2: Bunkový turnover (Retinaldehyd vs Soolantra Rx)
    if (anamnesis.clientConcerns?.some(c => c.toLowerCase().includes('rosacea')) && hasVascularIssue) {
      evening.push({
        step: 2,
        category: 'Dermatologická liečba rozacey (Rx)',
        brand: 'Galderma (Rx)',
        productName: 'Soolantra 10 mg/g krém',
        activeIngredients: 'Ivermektín 10 mg/g (1%)',
        keyActiveIngredient: 'Ivermektín 1% (eliminácia Demodexu & protizápalový efekt)',
        whyItMatters: 'Liek prvej voľby indikovaný lekárom. Zastavuje zápalové papuly a navracia pokožke pokojný cievny reliéf.',
        frequencySchedule: '1x večer po dobu 12 týždňov',
        titrationNotes: 'Liek je viazaný na lekársky predpis (Rp.) – predpisuje lekár kliniky.',
        usage: 'Aplikujte veľkosť hrášku na tvár.',
        purpose: 'Kauzálna liečba papulopustulóznej rozacey.',
        price: 18,
        galenicForm: 'rx',
        meicetJustification: 'Indikované lekárom pri podozrení na rozaceu na základe Meicet.',
        isExternal: true,
        prescriptionOnly: true,
        externalProviderNote: 'Liek viazaný na lekársky predpis (Rp.)'
      });
    } else {
      evening.push({
        step: 2,
        category: 'Retinaldehyd novej generácie',
        brand: 'Medik8',
        productName: 'Crystal Retinal 3 (0.03%)',
        activeIngredients: '0.03% Zapuzdrený retinaldehyd + Kyselina hyalurónová + Vitamín E',
        keyActiveIngredient: '0.03% Retinaldehyd (1 konverzia na kyselinu retinovú)',
        whyItMatters: 'Pôsobí 11-krát rýchlejšie ako klasický retinol, no bez podráždenia. Stimuluje novotvorbu kolagénu a má priamy antibakteriálny účinok.',
        frequencySchedule: '1. a 2. týždeň 2x do týždňa, 3. a 4. týždeň obdeň, potom denne',
        titrationNotes: 'Aplikujte výhradne večer na suchú pleť. V rannom protokole je povinné SPF 50+.',
        usage: 'Aplikujte 2 pumpy večer na suchú očistenú pleť pred krémom.',
        purpose: 'Bunková obnova, zjemnenie vrások a spevnenie dermis.',
        price: 62,
        galenicForm: 'serum',
        meicetJustification: 'Ideálne na korekciu vrások a fotopoškodenia z Meicet analýzy.',
        isExternal: true,
        pharmacyBrand: true,
        externalProviderNote: 'Dostupné v špecializovaných salónoch a e-shope'
      });
    }

    // PM KROK 3: Hĺbková bariérová regenerácia
    evening.push({
      step: 3,
      category: 'Intenzívny lipidový regenerátor',
      brand: isDehydrated ? 'SkinCeuticals' : 'La Roche-Posay',
      productName: isDehydrated ? 'Triple Lipid Restore 2:4:2' : 'Cicaplast Baume B5+',
      activeIngredients: isDehydrated ? '2% ceramidy + 4% cholesterol + 2% mastné kyseliny' : '5% Pantenol + Madecassoside + Zinok',
      keyActiveIngredient: isDehydrated ? 'Pomer bio-lipidov 2:4:2' : 'Pantenol (Vitamín B5) + Centella Asiatica',
      whyItMatters: 'Uzamyká nočnú bunkovú regeneráciu, predchádza vysušeniu z retinoidu a tlmí mikrozápaly.',
      frequencySchedule: 'Každý večer ako finálny krok',
      usage: 'Jemne vmasírujte na tvár a krk.',
      purpose: 'Hĺbková nočná oprava stratum corneum.',
      price: isDehydrated ? 145 : 14,
      galenicForm: isDehydrated ? 'cream' : 'balm',
      meicetJustification: 'Prevencia nežiaducej iritácie pri aktívnej nočnej terapii.',
      isExternal: !isDehydrated,
      pharmacyBrand: !isDehydrated
    });

    const allProds = [...morning, ...evening];
    const clinicProds = allProds.filter(p => !p.isExternal);
    const extProds = allProds.filter(p => p.isExternal);

    const totalEstimatedPrice = allProds.reduce((sum, p) => sum + (p.price || 0), 0);
    const clinicEstimatedPrice = clinicProds.reduce((sum, p) => sum + (p.price || 0), 0);
    const externalEstimatedPrice = extProds.reduce((sum, p) => sum + (p.price || 0), 0);

    return {
      tier: 'expert',
      tierLabel: 'Clinical Optimum (Expert EBM)',
      brandDescription: 'Nezávislý dermatologický výber najúčinnejších molekúl a textúr na trhu (Medik8, Theramid, SkinCeuticals, Rx) bez ohľadu na sklad',
      totalEstimatedPrice,
      clinicEstimatedPrice,
      externalEstimatedPrice,
      morning,
      evening,
      weeklyCare: [
        '1x týždenne regeneračná bio-celulózová maska alebo intenzívna hydratácia',
        'Pri zavádzaní retinoidu Medik8 prísne dodržiavať titračný harmonogram (začať 2x týždenne)',
        'V prípade pocitu pnutia aplikovať lokálne SOS balzam (Cicaplast Baume B5+)'
      ]
    };
  }

  /**
   * Zostaví hybridný balík ADVANCED:
   * Kľúčové patentované aktívne látky sú SkinCeuticals, doplnené o šetrný lekárenský základ (CeraVe, LRP, Vichy).
   * 100% položiek je na sklade kliniky SAY CLINIC (cena medzi Essential a Premium).
   */
  public static generateAdvancedRoutine(report: MeicetAnalysisResult): MeicetSkincareTierRoutine {
    const { metrics, anamnesis } = report;

    const morning: MeicetSkincareProduct[] = [];
    const evening: MeicetSkincareProduct[] = [];

    const isDehydrated = (metrics.hydration?.score || 50) < 55 || metrics.hydration?.tewlLevel === 'vysoká';
    const hasVascularIssue = (metrics.redAreas?.score || 0) > 40 || metrics.redAreas?.rosaceaRisk;
    const hasPhotoaging = (metrics.uvDamage?.score || 0) > 35 || (metrics.wrinkles?.score || 0) > 40;

    // AM 1: Šetrné čistenie (Essential báza - CeraVe)
    morning.push({
      step: 1,
      category: 'Jemné bariérové čistenie',
      brand: 'CeraVe',
      productName: 'Hydratačná čistiaca emulzia (236 ml)',
      activeIngredients: '3 esenciálne ceramidy + Kyselina hyalurónová + Glycerín',
      keyActiveIngredient: 'Bio-identické ceramidy (1, 3, 6-II) s fyziologickým pH',
      whyItMatters: 'Jemne očistí pleť od nočného kožného mazu bez narušenia lipidovej bariéry a bez pocitu pnutia.',
      frequencySchedule: 'Každé ráno',
      usage: '1–2 pumpičky vmasírovať do navlhčenej tváre a opláchnuť vlažnou vodou.',
      purpose: 'Šetrná očista pred nanesením aktívnych látok.',
      price: 14,
      galenicForm: 'cream',
      meicetJustification: 'Zachováva hydrolipidový plášť pri zistenom TEWL.',
      isExternal: false
    });

    // AM 2: KĽÚČOVÝ AKTÍVNY KROK (SkinCeuticals - Sklad kliniky)
    if (hasVascularIssue) {
      morning.push({
        step: 2,
        category: 'Kľúčové cievne & upokojujúce sérum',
        brand: 'SkinCeuticals',
        productName: 'Phyto Corrective Gel (30 ml)',
        activeIngredients: 'Botanické extrakty (uhorka, tymián), kyselina hyalurónová',
        keyActiveIngredient: 'Botanické glykozidy tymiánu a uhorky + Kyselina hyalurónová',
        whyItMatters: 'Patentovaný chladivý gél okamžite tlmí erytém, upokojuje rozšírené kapiláry a znižuje cievnu reaktivitu.',
        frequencySchedule: 'Každé ráno: 3–4 kvapky',
        titrationNotes: 'Aplikovať jemným vtlačením do tváre pred hydratačným sérom.',
        usage: '3–4 kvapky jemne vtlačiť do líc a citlivých zón.',
        purpose: 'Cievna stabilizácia a redukcia difúzneho začervenania.',
        price: 78,
        galenicForm: 'gel',
        meicetJustification: 'Cielené tlmenie cievneho erytému zisteného na Meicet (skóre ' + (metrics.redAreas?.score || 40) + '/100).',
        isExternal: false
      });
    } else {
      morning.push({
        step: 2,
        category: 'Kľúčové antioxidačné sérum (Zlatý štandard)',
        brand: 'SkinCeuticals',
        productName: 'C E Ferulic (30 ml)',
        activeIngredients: '15% L-askorbová kyselina + 1% alfa-tokoferol + 0.5% kyselina ferulová',
        keyActiveIngredient: 'Duke Formula: 15% Čistý Vitamín C + 0.5% Kyselina ferulová (pH 2.5–3.0)',
        whyItMatters: 'Svetový medicínsky etalón antioxidantov: poskytuje 8-násobnú ochranu pred UV a oxidačným stresom a rozjasňuje fotopoškodenie.',
        frequencySchedule: 'Každé ráno: 4–5 kvapiek',
        titrationNotes: 'Aplikovať priamo na vyčistenú suchú tvár a nechať 1 minútu vstrebať.',
        usage: '4–5 kvapiek ráno na tvár, krk a dekolt pred hydratáciou.',
        purpose: '8-násobná fotoprotekcia a stimulácia syntézy kolagénu.',
        price: 175,
        galenicForm: 'serum',
        meicetJustification: 'Kompenzácia UV fotopoškodenia a ochrana dermis.',
        isExternal: false
      });
    }

    // AM 3: Hydratačný booster (Essential báza - Vichy)
    morning.push({
      step: 3,
      category: 'Posilňujúci hydratačný booster',
      brand: 'Vichy',
      productName: 'Minéral 89 Hyaluron Booster (50 ml)',
      activeIngredients: '89% Termálna vulkanická voda Vichy + Kyselina hyalurónová',
      keyActiveIngredient: 'Vulkanická voda bohatá na 15 minerálov + Kyselina hyalurónová',
      whyItMatters: 'Vypĺňa dehydratačné linky, posilňuje dermálnu bariéru a uzatvára vlhkosť pred vonkajšími vplyvmi.',
      frequencySchedule: 'Každé ráno: 2 pumpy',
      usage: 'Aplikovať jemným vklepaním na celú tvár a očné okolie.',
      purpose: 'Bariérová hydratácia a pružnosť pokožky.',
      price: 26,
      galenicForm: 'fluid',
      meicetJustification: 'Hĺbková rehydratácia epidermy pri TEWL.',
      isExternal: false
    });

    // AM 4: Širokospektrálna fotoprotekcia (Essential báza - La Roche-Posay)
    morning.push({
      step: 4,
      category: 'Bunková fotoprotekcia SPF 50+',
      brand: 'La Roche-Posay',
      productName: 'Anthelios UVMune 400 SPF 50+ Invisible Fluid (50 ml)',
      activeIngredients: 'Patentovaný filter Mexoryl 400, glycerín, vitamín E',
      keyActiveIngredient: 'Mexoryl 400 (ochrana pred ultra-dlhým UVA žiarením 380–400 nm)',
      whyItMatters: 'Maximálna ochrana pred fotostarnutím a pigmentáciou v ultra-ľahkej textúre bez zaťaženia pleti.',
      frequencySchedule: 'Každé ráno ako finálny krok',
      titrationNotes: 'Pred použitím pretrepať. Naniesť 15 minút pred odchodom z domu.',
      usage: 'Naniesť rovnomerne na tvár, uši a krk.',
      purpose: 'Širokospektrálna ochrana pred UVB/UVA a prevencia fotostarnutia.',
      price: 22,
      galenicForm: 'fluid',
      meicetJustification: 'Prevencia aktivácie podpovrchového melanínu.',
      isExternal: false
    });

    // PM 1: Večerné šetrné čistenie (Essential báza - La Roche-Posay)
    evening.push({
      step: 1,
      category: 'Upokojujúce odličovacie mlieko',
      brand: 'La Roche-Posay',
      productName: 'Toleriane Dermo-Cleanser (200 ml)',
      activeIngredients: 'Termálna voda La Roche-Posay, glycerín',
      keyActiveIngredient: 'Fyziologický čistiaci základ bez parfumácie a mydla',
      whyItMatters: 'Spoľahlivo rozpustí minerálny SPF a nečistoty bez trenia a bez narušenia pH kože.',
      frequencySchedule: 'Každý večer',
      usage: 'Aplikovať končekmi prstov jemnými krúživými pohybmi, zotrieť vatovým tampónom.',
      purpose: 'Čistá a upokojená pleť pripravená na nočnú regeneráciu.',
      price: 18,
      galenicForm: 'cream',
      meicetJustification: 'Vhodné pre reaktívnu pokožku s cievnym erytémom.',
      isExternal: false
    });

    // PM 2: KĽÚČOVÝ AKTÍVNY KROK (SkinCeuticals - Sklad kliniky)
    if (isDehydrated && !hasPhotoaging) {
      evening.push({
        step: 2,
        category: 'Kľúčová lamelárna rekonštrukcia lipidov',
        brand: 'SkinCeuticals',
        productName: 'Triple Lipid Restore 2:4:2 (48 ml)',
        activeIngredients: '2% čisté ceramidy, 4% prírodný cholesterol, 2% mastné kyseliny',
        keyActiveIngredient: 'Fyziologický pomer 2:4:2 (Ceramidy : Cholesterol : Mastné kyseliny)',
        whyItMatters: 'Patentovaná obnova lipidovej matrice stratum corneum. Okamžite znižuje TEWL a eliminuje pocit suchosti.',
        frequencySchedule: 'Každý večer po čistení',
        titrationNotes: 'Zahriať malé množstvo medzi prstami a vmasírovať do tváre.',
        usage: 'Aplikovať večer na tvár a krk.',
        purpose: 'Hermetická obnova kožnej bariéry a redukcia pnutia.',
        price: 155,
        galenicForm: 'cream',
        meicetJustification: 'Kľúčové pri vysokom TEWL a oslabenej bariére.',
        isExternal: false
      });
    } else {
      evening.push({
        step: 2,
        category: 'Kľúčová nočná bunková obnova (Retinol)',
        brand: 'SkinCeuticals',
        productName: 'Retinol 0.3 (30 ml)',
        activeIngredients: '0.3% čistý enkapsulovaný retinol, bisabolol, boswellia',
        keyActiveIngredient: '0.3% Čistý enkapsulovaný retinol s bisabololom',
        whyItMatters: 'Klinický štandard novotvorby kolagénu a bunkového obratu. Zjemňuje textúru pórov a vyhladzuje jemné vrásky.',
        frequencySchedule: '2–3x týždenne večer (vynechať 5–7 dní pred laserom)',
        titrationNotes: 'Začať 1-2x týždenne sendvičovou metódou. Aplikovať výlučne na suchú pokožku.',
        usage: 'Veľkosť hrášku večer na suchú tvár.',
        purpose: 'Bunková obnova, zjemnenie reliéfu pleti a redukcia vrások.',
        price: 98,
        galenicForm: 'cream',
        meicetJustification: 'Stimulácia kolagénu a vyhladenie textúry podľa Meicet.',
        isExternal: false
      });
    }

    // PM 3: Bariérový hydratačný krém (Essential báza - CeraVe)
    evening.push({
      step: 3,
      category: 'Hĺbková ceramidová hydratácia',
      brand: 'CeraVe',
      productName: 'Hydratačný krém (177 ml)',
      activeIngredients: '3 esenciálne ceramidy (1, 3, 6-II), kyselina hyalurónová, MVE technológia',
      keyActiveIngredient: 'Ceramidy 1, 3, 6-II + MVE postupné uvoľňovanie hydratácie',
      whyItMatters: 'Zabezpečuje 24-hodinovú hydratáciu počas nočnej regenerácie a chráni pokožku pred vysúšaním.',
      frequencySchedule: 'Každý večer',
      usage: 'Vmasírovať na tvár a krk.',
      purpose: 'Uzamknutie vlhkosti v epiderme.',
      price: 17,
      galenicForm: 'cream',
      meicetJustification: 'Obnova lipidového filmu počas spánku.',
      isExternal: false
    });

    // PM 4: SOS regeneračný balzam (Essential báza - La Roche-Posay)
    evening.push({
      step: 4,
      category: 'Upokojujúci bariérový balzam',
      brand: 'La Roche-Posay',
      productName: 'Cicaplast Baume B5+ (100 ml)',
      activeIngredients: '5% pantenol, madecassoside, prebiotický komplex Tribioma, zinok',
      keyActiveIngredient: '5% Pantenol + Madecassoside + Zinok a mangán',
      whyItMatters: 'Okamžitý SOS obklad pri podráždení, začervenaní alebo po estetických zákrokoch.',
      frequencySchedule: 'Podľa potreby alebo lokálne na citlivé miesta',
      titrationNotes: 'Možno použiť ako nočnú regeneračnú masku 1–2x týždenne.',
      usage: 'Naniesť tenkú vrstvu na začervenané alebo podráždené zóny.',
      purpose: 'Urýchlenie regenerácie epidermy a upokojenie erytému.',
      price: 18,
      galenicForm: 'balm',
      meicetJustification: 'SOS ochrana citlivých a reaktívnych kapilár.',
      isExternal: false
    });

    const totalEstimatedPrice = [...morning, ...evening].reduce((sum, p) => sum + (p.price || 0), 0);

    return {
      tier: 'advanced',
      tierLabel: 'Advanced (SkinCeuticals & Essential)',
      brandDescription: 'Inteligentná hybridná starostlivosť – kľúčové patentované molekuly SkinCeuticals doplnené o šetrný lekárenský základ (100% sklad kliniky)',
      totalEstimatedPrice,
      clinicEstimatedPrice: totalEstimatedPrice,
      externalEstimatedPrice: 0,
      morning,
      evening,
      weeklyCare: [
        'V dňoch s aplikáciou aktívneho séra SkinCeuticals ráno dôsledne aplikovať Anthelios UVMune 400 SPF 50+.',
        'Pri začervenaní alebo po ošetrení aplikovať La Roche-Posay Cicaplast Baume B5+ ako nočnú regeneračnú masku.',
        'Pred plánovaným laserovým ošetrením (CoolPeel CO2 / Cievny laser) vysadiť večerný Retinol 0.3 na 5–7 dní.'
      ]
    };
  }

  public static synthesizeClinicalEducation(report: MeicetAnalysisResult): MeicetClinicalEducation {
    const { metrics, anamnesis } = report;
    const issues: MeicetPathophysiologyIssue[] = [];
    const phases: MeicetTherapeuticPhase[] = [];
    const activeIngredients: MeicetActiveIngredientEducation[] = [];
    const procedures: MeicetProcedureMechanismEducation[] = [];

    // 1. ANALÝZA BARIÉRY A HYDRATÁCIE (TEWL)
    const isDehydrated = (metrics.hydration?.score || 50) < 55 || metrics.hydration?.tewlLevel === 'vysoká';
    if (isDehydrated) {
      issues.push({
        id: 'barrier-tewl',
        name: 'Narušená epidermálna bariéra & Zrýchlený TEWL',
        finding: `Hydratácia ${metrics.hydration.score}/100, transepidermálna strata vody (TEWL) je zvýšená. ${metrics.hydration.description}`,
        biologicalMechanism: 'V dôsledku deficitu medzibunkových lipidov (ceramidov, voľných mastných kyselín a cholesterolu) dochádza k narušeniu stratum corneum. Voda z hlbších vrstiev nekontrolovateľne evaporuje a do kože prenikajú enviromentálne iritanty.',
        severity: (metrics.hydration?.score || 50) < 40 ? 'kritické' : 'výrazné'
      });

      activeIngredients.push({
        id: 'mol-lipids',
        ingredient: 'Ceramidy 1, 3, 6-II + Cholesterol + Voľné mastné kyseliny (pomer 2:4:2)',
        concentration: '2% Ceramidy, 4% Cholesterol, 2% Mastné kyseliny',
        category: 'Obnova bariéry',
        targetIssue: 'Narušený stratum corneum & zvýšený TEWL',
        biologicalAction: 'Priama integrácia do lipidových lamelárnych dvojvrstiev stratum corneum. Obnovuje fyziologický „maltový“ tmel medzi zrohovatenými korneocytmi a hermeticky uzatvára odparovanie vody.',
        clinicalBenefit: 'Okamžité vymiznutie pocitu pnutia, suchosti a pálenia; stabilizácia pleti a odolnosť voči vonkajším vplyvom.'
      });

      activeIngredients.push({
        id: 'mol-hyaluron',
        ingredient: 'Nízko- a vysokomolekulárna kyselina hyalurónová (HA) + Pantenol (Vitamín B5)',
        concentration: 'Multi-molekulárny komplex',
        category: 'Hydratačný rezervoár',
        targetIssue: 'Povrchová a hĺbková dehydratácia',
        biologicalAction: 'Vysokomolekulárna HA tvorí priedušný film na povrchu viažuci 1000-násobok svojej hmotnosti vo vode, kým mikromolekulárna HA preniká do hlbšej epidermis. Pantenol stimuluje proliferáciu fibroblastov.',
        clinicalBenefit: 'Vyplnenie jemných vrások spôsobených dehydratáciou, okamžitá pružnosť a šťavnatý vzhľad.'
      });
    }

    // 2. CIEVNY ERYTÉM, REAKTIVITA A ROSACEA
    const hasVascularIssue = (metrics.redAreas?.score || 0) > 40 || metrics.redAreas?.rosaceaRisk || metrics.redAreas?.erythemaLevel?.includes('cievna');
    if (hasVascularIssue) {
      issues.push({
        id: 'vascular-erythema',
        name: 'Vaskulárna reaktivita & Chronický mikrozápal (Erytém)',
        finding: `Cievny erytém ${metrics.redAreas.score}%, detegované reaktívne teleangiektázie. ${metrics.redAreas.description}`,
        biologicalMechanism: 'Povrchový subpapilárny cievny plexus vykazuje stratu vazomotorického tonusu. Kapiláry zostávajú trvalo dilatované, dochádza k diapedéze zápalových mediátorov (IL-1, IL-8, TNF-alfa), čo vyvoláva pocity tepla, pálenia a riziko prechodu do rozacey.',
        severity: (metrics.redAreas?.score || 0) > 60 ? 'kritické' : 'výrazné'
      });

      activeIngredients.push({
        id: 'mol-azelaic',
        ingredient: 'Kyselina azelaová (10% - 15% dermokozmetika / 20% Skinoren Rx)',
        concentration: '10% - 20%',
        category: 'Protizápalová & Vaskulárna stabilizácia',
        targetIssue: 'Teleangiektázie, erytém a zápalové prejavy rozacey',
        biologicalAction: 'Inhibuje enzým kalikreín-5 a tvorbu prozápalových antimikrobiálnych peptidov (katelicidín LL-37). Znižuje produkciu reaktívnych foriem kyslíka neutrofilmi a blokuje vazodilatáciu.',
        clinicalBenefit: 'Viditeľné zosvetlenie difúzneho začervenania, upokojenie reaktivity na zmeny teplôt a vyhladenie zapálených ložísk.'
      });

      procedures.push({
        id: 'proc-excel-v',
        procedureName: 'Vaskulárny laser Excel V+ (532 nm / 1064 nm Nd:YAG)',
        category: 'laser',
        targetLayer: 'Subpapilárna dermis (cievny plexus)',
        mechanismOfAction: 'Selektívna fototermolýza: laserový lúč 532 nm je selektívne absorbovaný oxyhemoglobínom v dilatovanej cievke. Tepelná energia koaguluje stenu kapiláry bez poškodenia okolitej kože, cievka skolabuje a organizmus ju fagocytózou bezpečne vstrebe.',
        whyIndicated: 'Konzervatívna kozmetika nedokáže odstrániť trvalo dilatované cievky (teleangiektázie); laser je jediná kauzálna metóda na ich trvalú elimináciu.'
      });
    }

    // 3. FOTOSTARNUTIE, STRATA KOLAGÉNU A VRÁSKY
    const hasAgingOrUv = (metrics.uvDamage?.score || 0) > 35 || (metrics.wrinkles?.score || 0) > 40;
    if (hasAgingOrUv) {
      issues.push({
        id: 'photoaging-matrix',
        name: 'Solárna elastóza & Degenerácia extracelulárnej matrice',
        finding: `UV skóre ${metrics.uvDamage.score}%, index vrások ${metrics.wrinkles.score}%. Meicet sken odhalil subklinické pigmentové lézie a poškodenie kolagénových vlákien.`,
        biologicalMechanism: 'Kumulatívne UV žiarenie aktivuje matrixové metaloproteinázy (MMP-1 kolagenáza), ktoré degradujú kolagén typu I a III. Zároveň fragmentujú elastínové vlákna, čo vedie k strate turgoru a tvorbe statických vrások.',
        severity: (metrics.uvDamage?.score || 0) > 55 ? 'kritické' : 'výrazné'
      });

      activeIngredients.push({
        id: 'mol-vit-c-ferulic',
        ingredient: 'Kyselina L-askorbová (15%) + Alfa-tokoferol (1%) + Kyselina ferulová (0.5%)',
        concentration: '15% čistý vitamín C (Duke Formula)',
        category: 'Antioxidačný štít & Neokolagenéza',
        targetIssue: 'Fotopoškodenie, subklinické škvrny a oxidačný stres',
        biologicalAction: 'Kyselina ferulová zdvojnásobuje fotoprotektívny účinok vitamínov C a E. Vitamín C funguje ako esenciálny kofaktor pre prolyl- a lyzyl-hydroxylázu, bez ktorých bunky nedokážu syntetizovať stabilnú trojzávitnicu kolagénu.',
        clinicalBenefit: '8-násobná neutralizácia voľných radikálov, zjednotenie nerovnomerného tónu a rozjasnenie pleti.'
      });

      activeIngredients.push({
        id: 'mol-retinoid',
        ingredient: 'Retinaldehyd (0.03% - 0.06%) / Čistý zapuzdrený retinol (0.3%)',
        concentration: '0.03% Retinal / 0.3% Retinol',
        category: 'Bunková obnova & Epidermálny turnover',
        targetIssue: 'Jemné aj hlbšie vrásky, atrofia pokožky, nerovnomerná textúra',
        biologicalAction: 'Aktivuje nukleárne receptory RAR a RXR v keratinocytoch, čím zrýchľuje bunkový cyklus zo 40 na fyziologických 28 dní. Zvyšuje syntézu prokolagénu I a tlmí aktivitu deštrukčných enzýmov MMP.',
        clinicalBenefit: 'Hustejšia, pevnejšia a hladšia pokožka s vyhladenými vráskami a zjemnenými pórmi.'
      });

      procedures.push({
        id: 'proc-rejuran-profhilo',
        procedureName: 'Biorevitalizácia Polynukleotidmi (Rejuran) / Bioremodelácia (Profhilo)',
        category: 'injectable',
        targetLayer: 'Hlboká retikulárna dermis & extracelulárna matrica',
        mechanismOfAction: 'Polynukleotidy (PDRN) aktivujú purinergné receptory A2A na povrchu fibroblastov, čím stimulujú syntézu endogénneho kolagénu a reťazcov DNA bez tvorby jazvovitého tkaniva. Hybridná HA (Profhilo) spúšťa hydro-lifting cez CD44 receptory.',
        whyIndicated: 'Priama injekčná biostimulácia obnovuje biologický vek buniek v hĺbke, kam lokálne séra nedosiahnu.'
      });
    }

    // 4. ROZŠÍRENÉ PÓRY, MAZOTOK A KOMEDÓNY
    const hasPoreIssue = (metrics.pores?.score || 0) > 45 || (metrics.sebumAndPorphyrins?.score || 0) > 45;
    if (hasPoreIssue) {
      issues.push({
        id: 'pores-sebum',
        name: 'Folikulárna hyperkeratóza & Zvýšená aktivita mazových žliaz',
        finding: `Póry ${metrics.pores.score}%, sebum a porfyríny ${metrics.sebumAndPorphyrins.score}%. Nález v ${metrics.pores.predominantZone || 'T-zóne'}.`,
        biologicalMechanism: 'Abnormálna retencia korneocytov v ústí pilosebaceóznej jednotky v kombinácii s oxidáciou skvalénu vedie k dilatácii pórov a kolonizácii anaeróbnymi baktériami produkujúcimi porfyríny.',
        severity: 'mierne'
      });

      activeIngredients.push({
        id: 'mol-niacinamide',
        ingredient: 'Niacínamid (Vitamín B3 2% - 5%)',
        concentration: '2% - 5%',
        category: 'Seboregulácia & Bariéra',
        targetIssue: 'Rozšírené póry, lesk a narušená mikrocirkulácia',
        biologicalAction: 'Moduluje produkciu mazu cez down-reguláciu lipogenézy v sebocytoch a zvyšuje endogénnu syntézu ceramidov o 34%.',
        clinicalBenefit: 'Zmatnenie pleti, zúženie ústia pórov a zosilnenie bariéry.'
      });

      procedures.push({
        id: 'proc-hydrafacial',
        procedureName: 'HydraFacial Syndeo Platinum (Hydro-peeling & Infúzia)',
        category: 'skin_care',
        targetLayer: 'Stratum corneum a folikulárne ústia',
        mechanismOfAction: 'Vortexová vákuová technológia bez mechanického traumatu uvoľňuje keratínové zátky, odstraňuje zoxidovaný maz a infunduje antioxidanty a peptidy priamo do vyčistených pórov.',
        whyIndicated: 'Šetrné hĺbkové čistenie bez rizika ruptúry cievok (na rozdiel od klasického mechanického stláčania).'
      });
    }

    // 5. STAV JAZIEV (AK SÚ PRÍTOMNÉ)
    if (anamnesis.scarHistory && anamnesis.scarHistory.length > 0) {
      const firstScar = anamnesis.scarHistory[0];
      issues.push({
        id: 'scar-tissue',
        name: `Pooperačná / Pozápalová jazva (${firstScar.location})`,
        finding: `${firstScar.origin}, štádium: ${firstScar.appearance}, vek: ${firstScar.maturityMonths} mesiacov.`,
        biologicalMechanism: 'V štádiu proliferácie a maturácie jazvy je kolagén ukladaný chaoticky a pretrváva vaskulárna neovaskularizácia. Bez tlakovej oklúzie hrozí hypertrofia alebo pozápalová hyperpigmentácia.',
        severity: firstScar.appearance.includes('erytematózna') ? 'výrazné' : 'mierne'
      });

      activeIngredients.push({
        id: 'mol-silicone',
        ingredient: 'Medicínsky silikónový gél (Polysiloxan) + Minerálny SPF 50+',
        concentration: '100% medicínsky silikón',
        category: 'Jazvová terapia',
        targetIssue: `Jazva ${firstScar.location}`,
        biologicalAction: 'Vytvára polopriepustnú membránu, ktorá hydratuje stratum corneum jazvy, tlmí aktivitu fibroblastov a normalizuje syntézu kolagénu typu I/III na fyziologickú úroveň.',
        clinicalBenefit: 'Zmäkčenie a sploštenie jazvy, prevencia keloidu a zamedzenie trvalého stmavnutia jazvy slnkom.'
      });
    }

    // ŠTRUKTÚROVANÉ FÁZY TERAPIE (3 FÁZOVÝ PLÁN)
    phases.push({
      phase: 'Fáza 1 (Týždne 1 – 6)',
      title: 'Akútna obnova bariéry & Upokojenie vaskulárneho zápalu',
      objective: 'Zastaviť odparovanie vody (TEWL), doplniť fyziologické lipidy 2:4:2 a eliminovať akútne pálenie a erytém.',
      rationale: 'Kým nie je kožná bariéra stabilná a uzavretá, agresívne anti-aging kyseliny či procedúry by spôsobili zápalovú kaskádu a zhoršenie stavu.'
    });

    phases.push({
      phase: 'Fáza 2 (Mesiace 2 – 5)',
      title: 'Cielená vaskulárna a bunková korekcia',
      objective: 'Absolvovať sériu cievnych ošetrení (Excel V+ / IPL), postupne titrovať retinoid na noc a neutralizovať voľné radikály antioxidantom C E Ferulic.',
      rationale: 'V pokojnej a hydratovanej pokožke majú cievne lasery maximálnu efektivitu a retinoid stimuluje fibroblasty bez dráždenia.'
    });

    phases.push({
      phase: 'Fáza 3 (Mesiace 6 – 12)',
      title: 'Hĺbková kolagénová bioremodelácia & Prevencia',
      objective: 'Injekčná biostimulácia (Profhilo / Rejuran), frakčný microneedling (Morpheus8) a celoročné udržiavanie dosiahnutých výsledkov.',
      rationale: 'Zahustenie retikulárnej dermis a obnova pružnosti s pravidelnou fotoprotekciou zabezpečuje dlhodobé spomalenie biologického starnutia.'
    });

    return {
      pathophysiology: {
        title: '🔬 Dermatologický patofyziologický nález — Čo sa deje s vašou pleťou',
        description: `Na základe 3D multispektrálneho skenu Meicet Pro-A a klinickej anamnézy sme identifikovali ${issues.length} primárne biologické mechanizmy, ktoré negatívne ovplyvňujú zdravie, komfort a vzhľad vašej pokožky:`,
        issues
      },
      therapeuticStrategy: {
        title: '🎯 Terapeutická stratégia SAY CLINIC — Aký cieľ sledujeme a prečo',
        goal: 'Naším cieľom nie je len povrchové prekrytie nedostatkov, ale kauzálna (príčinná) liečba na bunkovej úrovni: uzatvorenie kožnej bariéry, trvalá eliminácia reaktívnych ciev a reštart novotvorby vlastného kolagénu.',
        phases
      },
      activeIngredientsMatrix: activeIngredients,
      proceduresMechanisms: procedures
    };
  }
}
