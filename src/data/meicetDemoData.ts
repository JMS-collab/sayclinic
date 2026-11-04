import { MeicetAnalysisResult, MeicetSkinMetrics, MeicetAnamnesisContext, MeicetSkincareProduct, SkincareTier } from '@/types/meicet';
import { getClinicPrice } from '@/data/clinicPriceList';
import { MeicetClinicalEducationService } from '@/services/meicetClinicalEducationService';

export interface QuickSkinConcernPreset {
  id: string;
  label: string;
  icon: string;
  description: string;
  metricAdjustments: Partial<Record<keyof MeicetSkinMetrics, number>>;
}

export const QUICK_SKIN_CONCERN_PRESETS: QuickSkinConcernPreset[] = [
  {
    id: 'dehydration_barrier',
    label: 'Dehydratácia & oslabená bariéra',
    icon: '💧',
    description: 'Zvýšená strata vody (TEWL), pnutie pleti, jemné dehydratačné linky',
    metricAdjustments: { hydration: 42 }
  },
  {
    id: 'redness_rosacea',
    label: 'Cievky, začervenanie & Rosacea',
    icon: '🩸',
    description: 'Rozšírené kapiláry na nose a lícach, difúzny erytém a reaktívna pleť',
    metricAdjustments: { redAreas: 45 }
  },
  {
    id: 'wrinkles_mimics',
    label: 'Mimické vrásky & strata elasticity',
    icon: '✨',
    description: 'Dynamické vrásky čela, glabely, očných vejárikov a pokles kontúr',
    metricAdjustments: { wrinkles: 48 }
  },
  {
    id: 'pores_texture',
    label: 'Rozšírené póry, textúra & jazvičky po akné',
    icon: '🔬',
    description: 'Nerovnomerný reliéf pleti, rozšírené póry v T-zóne a atrofické stopy',
    metricAdjustments: { pores: 50, texture: 52 }
  },
  {
    id: 'pigmentation_uv',
    label: 'Pigmentové škvrny, melazma & fotopoškodenie',
    icon: '☀️',
    description: 'Solárne lentigá, nerovnomerný tón a skryté UV poškodenie',
    metricAdjustments: { uvDamage: 46, brownSpots: 50 }
  },
  {
    id: 'collagen_laxity',
    label: 'Úbytok kolagénu & ochabnutie kontúr',
    icon: '💎',
    description: 'Strata hutnosti dermis, unavený vzhľad a oslabenie strednej tretiny tváre',
    metricAdjustments: { wrinkles: 50, texture: 55 }
  }
];

export const SAMPLE_MEICET_METRICS: MeicetSkinMetrics = {
  skinScoreOverall: 68,
  skinAge: 41,
  actualAge: 38,
  skinType: 'zmiešaná',
  fitzpatrickPhototype: 'II',
  hydration: {
    score: 44,
    percentile: 38,
    status: 'mierne zhoršený',
    description: 'Epidermálna dehydratácia v oblasti líc a čela so zvýšenou transepidermálnou stratou vody (TEWL).',
    clinicalSignificance: 'Narušená hydrolipidová bariéra zvyšuje prienik dráždivých látok a prehlbuje jemné vrásky.',
    tewlLevel: 'vysoká',
    moistureZoneNote: 'Kritický deficit v malárnej zóne líc, T-zóna má zachovanú sekréciu mazu.'
  },
  pores: {
    score: 61,
    percentile: 52,
    status: 'mierne zhoršený',
    description: 'Zväčšený priemer pórov a nahromadený zoxidovaný maz v centrálnom reliéfe.',
    clinicalSignificance: 'Vyžaduje cielené zjemnenie stratum corneum (BioRePeel / CoolPeel CO2) a reguláciu keratinizácie.',
    poreCountEstimate: 1420,
    predominantZone: 'Nos, mediálne líca a oblasť brady (T-zóna)'
  },
  wrinkles: {
    score: 54,
    percentile: 45,
    status: 'mierne zhoršený',
    description: 'Dynamické linky v glabelárnej a frontálnej zóne, počínajúce statické periorbitálne vejáriky.',
    clinicalSignificance: 'Kombinácia mimickej hyperaktivity s úbytkom dermálneho kolagénu.',
    fineLinesScore: 58,
    deepWrinklesScore: 49,
    primaryZones: ['Glabela', 'Čelo (frontálne ryhy)', 'Periorbitálne (vejáriky)', 'Počínajúce nazolabiálne záhyby']
  },
  texture: {
    score: 66,
    percentile: 60,
    status: 'dobrý',
    description: 'Mierne zhrubnutý kožný reliéf s mikrošupinkami v dehydratovaných zónach.',
    clinicalSignificance: 'Indikácia pre lekársky biorevitalizačný peeling (BioRePeel / PRX-T33), polynukleotidy a skinbooster.',
    roughnessIndex: 34,
    keratinizationState: 'Subklinická hyperkeratóza v zóne T'
  },
  uvDamage: {
    score: 48,
    percentile: 40,
    status: 'mierne zhoršený',
    description: 'Subepidermálne fotopoškodenie zistené v UV spektre (skryté melanínové zhluky pod povrchom).',
    clinicalSignificance: 'Vysoké riziko prepuknutia viditeľných solárnych lentíg po expozícii slnečnému žiareniu.',
    hiddenSpotsRisk: 'vysoké',
    photodamageSeverity: 'Mierna až stredná solárna elastóza z kumulatívneho UV'
  },
  brownSpots: {
    score: 72,
    percentile: 68,
    status: 'dobrý',
    description: 'Ohraničené povrchové pehy a mierne solárne lentigá v oblasti nosa a líc.',
    clinicalSignificance: 'Vyžaduje antioxidanty (15% vitamín C, kyselina tranexamová) a celoročné SPF 50+.',
    melasmaTendency: false,
    pigmentDepth: 'epidermálny'
  },
  redAreas: {
    score: 52,
    percentile: 46,
    status: 'mierne zhoršený',
    description: 'Difúzny erytém v krídlach nosa a na lícach s viditeľnou vaskularizáciou v krížovo-polarizovanom svetle.',
    clinicalSignificance: 'Reaktívna cievna stena, predispozícia na kuperózu / počínajúcu rosaceu – indikovaný Cievny laser.',
    erythemaLevel: 'mierne reaktívna',
    rosaceaRisk: true,
    telangiectasiaZones: ['Alar base nosa', 'Malárne líca obojstranne']
  },
  sebumAndPorphyrins: {
    score: 75,
    percentile: 72,
    status: 'dobrý',
    description: 'Fyziologická distribúcia porfyrínov v UV spektre, bez rozsiahlej mikrobiálnej kolonizácie C. acnes.',
    clinicalSignificance: 'Priaznivý mikrobióm bez rizika závažnej inflamácie akné.',
    tZoneOiliness: 'zvýšená',
    microbialActivity: 'stredná'
  }
};

export function createDemoMeicetResult(
  patientId: string = 'P1',
  patientName: string = 'Mária Kováčová',
  birthNumber: string = '885512/6789',
  preferredTier: SkincareTier = 'high_end',
  selectedConcernIds?: string[],
  requestedSkinType?: string
): MeicetAnalysisResult {
  const priceVascularFace = getClinicPrice('vascular_laser_face', 160);
  const priceVascularNose = getClinicPrice('vascular_laser_lesion', 70);
  const priceCoolpeelFace = getClinicPrice('coolpeel_face', 220);
  const priceBotox2Areas = getClinicPrice('botox_2_areas', 216);
  const priceProfhilo = getClinicPrice('profhilo_2ml', 290);
  const priceRejuranHealer = getClinicPrice('rejuran_healer_2ml', 290);
  const priceRejuranEye = getClinicPrice('rejuran_i_eye_1ml', 190);
  const priceBioRePeel = getClinicPrice('biorepeel_prx_t33', 90);
  const priceTcaPeel = getClinicPrice('tca_peel_medical', 110);
  const priceDermapen = getClinicPrice('dermapen_microneedling', 140);
  const priceSculptra = getClinicPrice('sculptra', 450);
  const priceExosomes = getClinicPrice('exosomes_asce', 320);

  // Ceny kozmetiky zo živého cenníka
  const priceScCleanser = getClinicPrice('sc_soothing_cleanser', 46);
  const priceScCeFerulic = getClinicPrice('sc_ce_ferulic', 175);
  const priceScPhyto = getClinicPrice('sc_phyto_corrective', 78);
  const priceScHaIntensifier = getClinicPrice('sc_ha_intensifier', 118);
  const priceScTripleLipid = getClinicPrice('sc_triple_lipid_restore', 155);
  const priceScSpf = getClinicPrice('sc_advanced_brightening_spf50', 46);
  const priceScEpidermal = getClinicPrice('sc_epidermal_repair', 85);
  const priceScRetinol = getClinicPrice('sc_retinol_03', 98);

  const priceCeraveCleanser = getClinicPrice('cerave_hydrating_cleanser', 14);
  const priceVichyMineral89 = getClinicPrice('vichy_mineral_89', 26);
  const priceLrpHyaluB5 = getClinicPrice('lrp_hyalu_b5_serum', 42);
  const priceCeraveCream = getClinicPrice('cerave_moisturising_cream', 17);
  const priceLrpSpf = getClinicPrice('lrp_anthelios_uvmune_spf50', 22);
  const priceLrpCleanser = getClinicPrice('lrp_toleriane_cleanser_200ml', 18);
  const priceVichyCollagen = getClinicPrice('vichy_liftactiv_collagen', 44);
  const priceLrpCicaplast = getClinicPrice('lrp_cicaplast_b5_100ml', 18);

  // Výpočet veku pacienta podľa rodného čísla
  let computedAge = 38;
  if (birthNumber) {
    const clean = birthNumber.replace('/', '').trim();
    if (clean.length >= 6) {
      const yy = parseInt(clean.substring(0, 2), 10);
      if (!isNaN(yy)) {
        const fullYear = yy > 26 ? 1900 + yy : 2000 + yy;
        computedAge = 2026 - fullYear;
      }
    }
  }

  const normalizedSkin = (requestedSkinType || '').toLowerCase().trim();
  const isSensitiveDry = 
    normalizedSkin === 'citliva_sucha' || 
    normalizedSkin === 'citlivá a suchá' || 
    normalizedSkin === 'citliva' || 
    normalizedSkin === 'citlivá' ||
    (!requestedSkinType && !selectedConcernIds) ||
    (!requestedSkinType && selectedConcernIds && (
      selectedConcernIds.includes('dehydration_barrier') || 
      selectedConcernIds.includes('redness_rosacea') ||
      selectedConcernIds.includes('redness_vascular') || 
      selectedConcernIds.includes('barrier_dehydration')
    )) ||
    (selectedConcernIds && (
      selectedConcernIds.includes('dehydration_barrier') || 
      selectedConcernIds.includes('redness_rosacea') ||
      selectedConcernIds.includes('redness_vascular') || 
      selectedConcernIds.includes('barrier_dehydration')
    ));

  const isOily = normalizedSkin === 'mastna_aknozna' || normalizedSkin === 'mastna' || normalizedSkin === 'mastná';
  const isPureDry = normalizedSkin === 'sucha' || normalizedSkin === 'suchá';

  let currentSkinType: 'suchá' | 'mastná' | 'zmiešaná' | 'normálna' | 'citlivá' | 'citlivá a suchá' = 'citlivá a suchá';
  if (isSensitiveDry) {
    currentSkinType = 'citlivá a suchá';
  } else if (isOily) {
    currentSkinType = 'mastná';
  } else if (isPureDry) {
    currentSkinType = 'suchá';
  } else if (normalizedSkin === 'normalna' || normalizedSkin === 'normálna') {
    currentSkinType = 'normálna';
  } else if (normalizedSkin === 'zmiesana' || normalizedSkin === 'zmiešaná') {
    currentSkinType = 'zmiešaná';
  }

  const anamnesis: MeicetAnamnesisContext = {
    pastSurgeries: [],
    allergies: [],
    aestheticTreatments: [
      'Aplikácia botulotoxínu do glabelly a čela (pred 5 mesiacmi – efekt doznieva)',
      'Biorevitalizácia pleti (pred rokom)'
    ],
    scarHistory: [],
    clientConcerns: selectedConcernIds && selectedConcernIds.length > 0
      ? QUICK_SKIN_CONCERN_PRESETS.filter(p => selectedConcernIds.includes(p.id)).map(p => p.label)
      : isSensitiveDry
      ? [
          'Citlivá a suchá pleť s oslabenou kožnou bariérou',
          'Pocit pnutia, dehydratácia a zvýšený TEWL',
          'Reaktívny difúzny erytém na lícach a krídlach nosa'
        ]
      : [
          'Pocit pnutia a dehydratovanej pleti',
          'Rozšírené cievky a začervenanie na lícach a nose',
          'Jemné vrásky okolo očí a na čele',
          'Rozšírené póry a strata jasu pleti'
        ],
    contraindications: [
      'Zákaz ablatívneho CO2 lasera a hlbokého TCA peelingu v letnom období (jún – august) kvôli riziku PIH',
      ...(isSensitiveDry ? ['Zákaz agresívnych abrazívnych peelingov a dráždivých koncentrácií kyselín do stabilizácie bariéry'] : [])
    ],
    lifestyleNotes: 'Práca v klimatizovanej kancelárii, mestský environmentálny stres.'
  };

  // Rutina pre citlivú a suchú pleť vs štandardná
  const highEndMorning: MeicetSkincareProduct[] = isSensitiveDry
    ? [
        {
          step: 1,
          category: 'Šetrné ranné čistenie',
          productName: 'SkinCeuticals Soothing Cleanser (150 ml)',
          brand: 'SkinCeuticals',
          activeIngredients: 'Sorbitol, glycerín, extrakt z orchidey a uhorky',
          keyActiveIngredient: 'Sorbitol, glycerín, botanické extrakty (fyziologické pH)',
          whyItMatters: 'Šetrne odstraňuje kožný maz a nečistoty bez poškodenia ochrannej hydrolipidovej bariéry a bez vysušenia (kritické pri TEWL 44/100).',
          frequencySchedule: 'Každé ráno: 1 pumpička peny',
          titrationNotes: 'Vmasírovať jemne do navlhčenej pleti vlažnou vodou, vyhnúť sa treniu uterákom.',
          usage: '1 pumpičku peny ráno jemne vmasírovať do vlhkej pleti, opláchnuť vlažnou vodou.',
          purpose: 'Šetrné odstránenie mazu bez narušenia kožnej bariéry a upokojenie citlivej pleti.',
          price: priceScCleanser,
          meicetJustification: 'Zvýšené TEWL vyžaduje šetrný čistič s fyziologickým pH bez sulfátov.'
        },
        {
          step: 2,
          category: 'Upokojujúce sérum proti erytému',
          productName: 'SkinCeuticals Phyto Corrective Gel (30 ml)',
          brand: 'SkinCeuticals',
          activeIngredients: 'Botanické extrakty (tymián, uhorka), kyselina hyalurónová, morušovník',
          keyActiveIngredient: 'Botanické extrakty (uhorka, tymián), kyselina hyalurónová, arbutín',
          whyItMatters: 'Priama reakcia na reaktívny cievny erytém zistený Meicet spektrom (skóre 36/100). Okamžite chladí a sťahuje reaktívne kapiláry.',
          frequencySchedule: 'Každé ráno: 3–4 kvapky',
          titrationNotes: 'Vklepať končekmi prstov prioritne do líc a krídel nosa pred hydratačným sérom.',
          usage: '3–4 kvapky ráno na vyčistenú tvár, prioritne na oblasť líc a nosa.',
          purpose: 'Okamžité zmiernenie začervenania, upokojenie reaktívnych kapilár a hydratácia bez zaťaženia.',
          price: priceScPhyto,
          meicetJustification: 'Priama reakcia na reaktívny cievny erytém zistený Meicet spektrom (skóre 36/100).'
        },
        {
          step: 3,
          category: 'Hĺbkové hyalurónové sérum',
          productName: 'SkinCeuticals H.A. Intensifier (30 ml)',
          brand: 'SkinCeuticals',
          activeIngredients: 'Kyselina hyalurónová, 10% Proxylane™, extrakt zo sladkého drievka',
          keyActiveIngredient: '1.3% kyselina hyalurónová + 10% Proxylane™ + 2% extrakt zo sladkého drievka',
          whyItMatters: 'Zvyšuje hladinu kyseliny hyalurónovej v koži o +30 %, viaže vodu a vypĺňa dehydratačné ryhy spôsobené vysokou stratou vody (TEWL 44/100).',
          frequencySchedule: 'Každé ráno: 4–6 kvapiek',
          titrationNotes: 'Nanášať na ešte mierne orosenú pleť po Phyto géli pre maximálnu väzbu vody.',
          usage: '4–6 kvapiek vklepať do líc, čela a očného okolia.',
          purpose: 'Zvýšenie vlastnej hladiny kyseliny hyalurónovej v pleti o +30 % a vyplnenie dehydratačných rýh.',
          price: priceScHaIntensifier,
          meicetJustification: 'Riešenie epidermálnej dehydratácie zistenej na Meicet (skóre 44%).'
        },
        {
          step: 4,
          category: 'Širokospektrálna fotoprotekcia SPF 50+',
          productName: 'SkinCeuticals Advanced Brightening UV Defense SPF 50+ (40 ml)',
          brand: 'SkinCeuticals',
          activeIngredients: 'Širokospektrálne UV filtre, 1% kyselina tranexamová, 2% niacínamid',
          keyActiveIngredient: 'Mexoryl SX/XL + 1% kyselina tranexamová + 2% niacínamid',
          whyItMatters: 'Chráni citlivé cievy pred dilatáciou spôsobenou UV žiarením a teplom a zabraňuje aktivácii podpovrchového melanínu.',
          frequencySchedule: 'Každé ráno celoročne ako finálny krok',
          titrationNotes: 'Naniesť v dostatočnom množstve (2 dĺžky prstov) 15 minút pred odchodom z domu.',
          usage: 'Aplikovať každé ráno ako posledný krok pred odchodom z domu.',
          purpose: 'Ochrana pred UVA/UVB žiarením a prevencia prehlbovania cievneho erytému a pigmentácií.',
          price: priceScSpf,
          meicetJustification: 'Ochrana fotosenzitívnych kapilár a prevencia podpovrchového melanínu.'
        }
      ]
    : [
        {
          step: 1,
          category: 'Šetrné ranné čistenie',
          productName: 'SkinCeuticals Soothing Cleanser (150 ml)',
          brand: 'SkinCeuticals',
          activeIngredients: 'Sorbitol, glycerín, extrakt z orchidey a uhorky',
          keyActiveIngredient: 'Sorbitol a glycerín (fyziologické pH)',
          whyItMatters: 'Šetrné odstránenie mazu bez narušenia kožnej bariéry a príprava na antioxidačné sérum.',
          frequencySchedule: 'Každé ráno: 1 pumpička peny',
          usage: '1 pumpičku peny ráno jemne vmasírovať do vlhkej pleti, opláchnuť vlažnou vodou.',
          purpose: 'Šetrné odstránenie mazu bez narušenia kožnej bariéry a príprava na antioxidant.',
          price: priceScCleanser,
          meicetJustification: 'Zvýšené TEWL vyžaduje šetrný čistič s fyziologickým pH bez sulfátov.'
        },
        {
          step: 2,
          category: 'Antioxidačné sérum (Vitamín C)',
          productName: 'SkinCeuticals C E Ferulic (30 ml)',
          brand: 'SkinCeuticals',
          activeIngredients: '15% čistá kyselina L-askorbová, 1% alfa-tokoferol, 0.5% kyselina ferulová',
          keyActiveIngredient: '15% čistá kyselina L-askorbová + 1% alfa-tokoferol + 0.5% kyselina ferulová',
          whyItMatters: 'Patentovaný antioxidačný zlatý štandard: 8-násobná ochrana pred voľnými radikálmi a zosvetlenie UV škvŕn (skóre 48/100).',
          frequencySchedule: 'Každé ráno: 4–5 kvapiek na suchú tvár a krk',
          titrationNotes: 'Nanášať ráno priamo na suchú pleť po vyčistení. Nechať vstrebať 2 minúty pred ďalším krokom.',
          usage: '4–5 kvapiek ráno na suchú tvár, krk a dekolt.',
          purpose: '8-násobná antioxidačná ochrana, zosvetlenie UV škvŕn a stimulácia syntézy kolagénu.',
          price: priceScCeFerulic,
          meicetJustification: 'Kompenzácia fotopoškodenia v UV spektre Meicet (skóre 48/100).'
        },
        {
          step: 3,
          category: 'Hĺbkové hyalurónové sérum',
          productName: 'SkinCeuticals H.A. Intensifier (30 ml)',
          brand: 'SkinCeuticals',
          activeIngredients: 'Kyselina hyalurónová, 10% Proxylane™, extrakt zo sladkého drievka',
          keyActiveIngredient: 'Kyselina hyalurónová + 10% Proxylane™',
          whyItMatters: 'Vyplňuje dehydratačné ryhy a zvyšuje pružnosť dermis.',
          frequencySchedule: 'Každé ráno: 4–6 kvapiek',
          usage: '4–6 kvapiek vklepať do líc, čela a očného okolia.',
          purpose: 'Zvýšenie vlastnej hladiny kyseliny hyalurónovej v pleti o +30 % a vyplnenie jemných vrások.',
          price: priceScHaIntensifier,
          meicetJustification: 'Riešenie epidermálnej dehydratácie zistenej na Meicet (skóre 44%).'
        },
        {
          step: 4,
          category: 'Širokospektrálna fotoprotekcia SPF 50+',
          productName: 'SkinCeuticals Advanced Brightening UV Defense SPF 50+ (40 ml)',
          brand: 'SkinCeuticals',
          activeIngredients: 'Širokospektrálne UV filtre, 1% kyselina tranexamová, 2% niacínamid',
          keyActiveIngredient: 'Mexoryl SX/XL + kyselina tranexamová',
          whyItMatters: 'Bariérový štít proti fotostarnutiu a prevencia nových pigmentových škvŕn.',
          frequencySchedule: 'Každé ráno ako finálny krok',
          usage: 'Aplikovať každé ráno ako posledný krok pred odchodom z domu.',
          purpose: 'Ochrana pred UVA/UVB žiarením a blokáda tvorby pigmentových škvŕn.',
          price: priceScSpf,
          meicetJustification: 'Prevencia aktivácie podpovrchového melanínu zisteného v UV spektre.'
        }
      ];

  const highEndEvening: MeicetSkincareProduct[] = isSensitiveDry
    ? [
        {
          step: 1,
          category: 'Večerné šetrné čistenie',
          productName: 'SkinCeuticals Soothing Cleanser (150 ml)',
          brand: 'SkinCeuticals',
          activeIngredients: 'Sorbitol, glycerín, botanické extrakty',
          keyActiveIngredient: 'Sorbitol, glycerín, extrakt z uhorky a orchidey',
          whyItMatters: 'Odstraňuje celodenný SPF filter a prach z mestského prostredia bez mechanického dráždenia reaktívnych kapilár.',
          frequencySchedule: 'Každý večer: 1–2 pumpičky peny',
          titrationNotes: 'Jemne rozotrieť vlažnou vodou, nešúchať tvár drsným uterákom.',
          usage: 'Večer zmyť SPF a nečistoty vlažnou vodou bez trenia.',
          purpose: 'Dokonale čistá pleť bez podráždenia, pripravená na nočnú obnovu bariéry.',
          price: priceScCleanser,
          meicetJustification: 'Fyziologické pH pre reaktívnu pokožku s cievnym erytémom.'
        },
        {
          step: 2,
          category: 'Nočné upokojenie a hydratácia',
          productName: 'SkinCeuticals Phyto Corrective Gel (30 ml)',
          brand: 'SkinCeuticals',
          activeIngredients: 'Botanické extrakty (uhorka, tymián), kyselina hyalurónová',
          keyActiveIngredient: 'Extrakt z tymiánu a uhorky, kyselina hyalurónová',
          whyItMatters: 'Chladivý účinok tlmí nočnú vazodilatáciu cievok na lícach a pripravuje pokožku na lipidovú rekonštrukciu.',
          frequencySchedule: 'Každý večer: 3–4 kvapky',
          titrationNotes: 'Aplikovať jemným vtlačením do líc a citlivých zón.',
          usage: '3–4 kvapky jemne vklepať do líc a citlivých miest pred krémom.',
          purpose: 'Zmiernenie nočného pnutia a sčervenania tváre.',
          price: priceScPhyto,
          meicetJustification: 'Chladivý účinok na začervenané malárne zóny (erytém 36/100).'
        },
        {
          step: 3,
          category: 'Bunková obnova (Titračný Retinol)',
          productName: 'SkinCeuticals Retinol 0.3 (30 ml)',
          brand: 'SkinCeuticals',
          activeIngredients: '0.3% čistý enkapsulovaný retinol, bisabolol, boswellia',
          keyActiveIngredient: '0.3% čistý enkapsulovaný retinol + bisabolol & boswellia',
          whyItMatters: 'Stimuluje fibroblasty k tvorbe kolagénu typu I a zahusťuje atrofickú dermis pri skóre vrások (54/100). Enkapsulácia minimalizuje podráždenie.',
          frequencySchedule: '1x týždenne večer (prvé 2 týždne), potom 2x týždenne; vynechať 5–7 dní pred laserom!',
          titrationNotes: 'Striktná retinizácia: nanášať veľkosť hrášku výhradne večer na suchú pleť sendvičovou metódou (medzi vrstvy krému). Vynechať očné okolie a pery. Nikdy neaplikovať 7 dní pred laserovým zákrokom!',
          usage: 'Veľkosť hrášku 1x týždenne večer (postupne zvýšiť na 2x týždenne) na dokonale suchú pleť.',
          purpose: 'Nočná bunková obnova a redukcia jemných mimických vrások bez poškodenia bariéry.',
          price: priceScRetinol,
          meicetJustification: 'Zamerané na spevnenie dermis a biologické omladenie bez narušenia citlivej bariéry.'
        },
        {
          step: 4,
          category: 'Rekonštrukcia lipidovej bariéry 2:4:2',
          productName: 'SkinCeuticals Triple Lipid Restore 2:4:2 (48 ml)',
          brand: 'SkinCeuticals',
          activeIngredients: '2% čisté ceramidy, 4% prírodný cholesterol, 2% mastné kyseliny',
          keyActiveIngredient: '2% čisté ceramidy (1 & 3), 4% cholesterol, 2% mastné kyseliny',
          whyItMatters: 'Zlatý štandard dermatológie: fyziologický pomer 2:4:2 znižuje TEWL o 40 %, rekonštruuje medzibunkový tmel a chráni pred stratou hydratácie (TEWL 44/100).',
          frequencySchedule: 'Každý večer: veľkosť hrášku',
          titrationNotes: 'Zahriať medzi bruškami prstov a jemne vtlačiť do pokožky celej tváre a krku.',
          usage: 'Každý večer jemne zahriať medzi bruškami prstov a vtlačiť do pleti.',
          purpose: 'Zlatý štandard dermatológie: obnova ochrannej bariéry, zníženie TEWL o 40 % a potlačenie suchosti.',
          price: priceScTripleLipid,
          meicetJustification: 'Priama terapia dehydratácie a oslabeného hydrolipidového plášťa (skóre 44/100).'
        },
        {
          step: 5,
          category: 'SOS regenerácia a cievna ochrana',
          productName: 'SkinCeuticals Epidermal Repair (40 ml)',
          brand: 'SkinCeuticals',
          activeIngredients: 'Beta-glukán, Centella Asiatica (Gotu Kola), pantenol',
          keyActiveIngredient: 'Beta-glukán + Centella Asiatica (Madecassoside) + pantenol',
          whyItMatters: 'Bariérový ochranný film na reaktívne cievne zóny líc a urýchlenie hojenia po cievnom laseri.',
          frequencySchedule: 'Podľa potreby lokálne na líca alebo 2x denne počas 5–7 dní po zákroku',
          titrationNotes: 'Nanášať lokálne na začervenané ložiská alebo ako ochranný balzam po laserovom ošetrení.',
          usage: 'Tenká vrstva na najviac podráždené miesta a po cievnom laseri.',
          purpose: 'Okamžité upokojenie cievneho erytému a urýchlenie epitelizácie.',
          price: priceScEpidermal,
          meicetJustification: 'Cielené upokojenie reaktívnych cievnych zón (skóre 36/100).'
        }
      ]
    : [
        {
          step: 1,
          category: 'Večerné odlíčenie a čistenie',
          productName: 'SkinCeuticals Soothing Cleanser (150 ml)',
          brand: 'SkinCeuticals',
          activeIngredients: 'Sorbitol, glycerín, botanické extrakty',
          keyActiveIngredient: 'Sorbitol, glycerín, rastlinné výťažky',
          whyItMatters: 'Čistí rozšírené póry v T-zóne bez narušenia kožnej bariéry.',
          frequencySchedule: 'Každý večer',
          usage: 'Večer zmyť SPF a nečistoty vlažnou vodou.',
          purpose: 'Dokonale čistá pleť pripravená na nočnú bunkovú obnovu.',
          price: priceScCleanser,
          meicetJustification: 'Čistí rozšírené póry v T-zóne bez vysušenia líc.'
        },
        {
          step: 2,
          category: 'Nočná bunková obnova (Retinol)',
          productName: 'SkinCeuticals Retinol 0.3 (30 ml)',
          brand: 'SkinCeuticals',
          activeIngredients: '0.3% čistý enkapsulovaný retinol, bisabolol, boswellia',
          keyActiveIngredient: '0.3% čistý enkapsulovaný retinol + bisabolol',
          whyItMatters: 'Stimulácia novotvorby kolagénu, redukcia pórov a vyhladenie textúry.',
          frequencySchedule: '2–3x týždenne večer; vynechať 7 dní pred laserom',
          titrationNotes: 'Začať 1-2x týždenne na suchú pokožku, postupne frekvenciu zvyšovať.',
          usage: 'Veľkosť hrášku 2–3x týždenne večer na suchú pleť (vysadiť 7 dní pred laserom).',
          purpose: 'Stimulácia novotvorby kolagénu, stiahnutie pórov a vyhladenie jemných vrások.',
          price: priceScRetinol,
          meicetJustification: 'Zamerané na zníženie biologického veku pleti a vyhladenie textúry.'
        },
        {
          step: 3,
          category: 'Rekonštrukcia kožnej bariéry 2:4:2',
          productName: 'SkinCeuticals Triple Lipid Restore 2:4:2 (48 ml)',
          brand: 'SkinCeuticals',
          activeIngredients: '2% čisté ceramidy, 4% prírodný cholesterol, 2% mastné kyseliny',
          keyActiveIngredient: '2% ceramidy, 4% cholesterol, 2% mastné kyseliny',
          whyItMatters: 'Zabraňuje nočnému TEWL a chráni pokožku pred podráždením z retinolu.',
          frequencySchedule: 'Každý večer',
          usage: 'Každý večer jemne zahriať medzi prstami a vmasírovať do tváre a krku.',
          purpose: 'Obnova lipidového plášťa, zníženie TEWL a upokojenie pleti po retinole a zákrokoch.',
          price: priceScTripleLipid,
          meicetJustification: 'Uzamknutie vlhkosti v derme a obnova ceramidovej bariéry.'
        },
        {
          step: 4,
          category: 'SOS regenerácia po ošetrení',
          productName: 'SkinCeuticals Epidermal Repair (40 ml)',
          brand: 'SkinCeuticals',
          activeIngredients: 'Beta-glukán, Centella Asiatica ( Gotu Kola ), pantenol',
          keyActiveIngredient: 'Beta-glukán + Centella Asiatica + pantenol',
          whyItMatters: 'Urýchľuje epitelizáciu a tlmí erytém po ošetreniach.',
          frequencySchedule: 'Prvých 5–7 dní po zákroku alebo podľa potreby',
          usage: 'Aplikovať na začervenané zóny alebo prvých 5–7 dní po laseri / microneedlingu.',
          purpose: 'Okamžité upokojenie erytému a urýchlenie epitelizácie.',
          price: priceScEpidermal,
          meicetJustification: 'Cielené upokojenie reaktívnych cievnych zón (skóre 52/100).'
        }
      ];

  const midEndMorning: MeicetSkincareProduct[] = [
    {
      step: 1,
      category: 'Šetrné čistenie s ceramidmi',
      productName: 'CeraVe Hydratačná čistiaca emulzia (236 ml)',
      brand: 'CeraVe',
      activeIngredients: '3 esenciálne ceramidy, kyselina hyalurónová, MVE technológia',
      keyActiveIngredient: '3 esenciálne ceramidy (1, 3, 6-II) + kyselina hyalurónová + technológia MVE',
      whyItMatters: 'Čistí a odstraňuje kožný maz bez penivých sulfátov a bez narušenia kožnej bariéry pri nízkej hydratácii (44/100).',
      frequencySchedule: 'Každé ráno: 1–2 dávky emulzie',
      titrationNotes: 'Vmasírovať do navlhčenej pokožky a jemne opláchnuť vlažnou vodou.',
      usage: 'Ráno vmasírovať do navlhčenej pleti a opláchnuť vlažnou vodou.',
      purpose: 'Čistí a hydratuje bez narušenia ochrannej kožnej bariéry.',
      price: priceCeraveCleanser,
      meicetJustification: 'Šetrné čistenie bez penidiel a sulfátov pri zníženej hydratácii (44%).'
    },
    {
      step: 2,
      category: 'Posilňujúci hyalurónový booster',
      productName: 'Vichy Minéral 89 Hyaluron Booster (50 ml)',
      brand: 'Vichy',
      activeIngredients: '89% vulkanická voda Vichy, prírodná kyselina hyalurónová',
      keyActiveIngredient: '89% vulkanická voda Vichy + čistá kyselina hyalurónová prírodného pôvodu',
      whyItMatters: 'Posilňuje obranyschopnosť citlivej pokožky, viaže vodu na povrchu epidermy a znižuje reaktivitu kapilár.',
      frequencySchedule: 'Každé ráno: 2 pumpičky',
      titrationNotes: 'Vklepať do čistej pleti tváre a jemne okolo očí.',
      usage: '2 pumpičky ráno vklepať do čistej pleti tváre a okolo očí.',
      purpose: 'Posilnenie obranyschopnosti kože a okamžitá hydratácia.',
      price: priceVichyMineral89,
      meicetJustification: 'Zvýšenie povrchovej hydratácie a zníženie reaktivity cievnych zón.'
    },
    {
      step: 3,
      category: 'Regeneračné sérum proti vráskam',
      productName: 'La Roche-Posay Hyalu B5 Sérum (30 ml)',
      brand: 'La Roche-Posay',
      activeIngredients: 'Duálna kyselina hyalurónová, 5% vitamín B5, madecassoside',
      keyActiveIngredient: 'Duálna kyselina hyalurónová + 5% vitamín B5 (pantenol) + madecassoside',
      whyItMatters: 'Pantenol a madecassoside okamžite regenerujú poškodenú bariéru, redukujú dehydratačné linky a urýchľujú epitelizáciu.',
      frequencySchedule: 'Každé ráno: 3–4 kvapky',
      titrationNotes: 'Rovnomerne naniesť na tvár a krk pred aplikáciou SPF.',
      usage: '3–4 kvapky ráno na tvár a krk.',
      purpose: 'Obnova pružnosti pleti, vyplnenie jemných liniek a podpora hojenia.',
      price: priceLrpHyaluB5,
      meicetJustification: 'Kompenzácia dehydratačných liniek a obnova kožnej bariéry.'
    },
    {
      step: 4,
      category: 'Maximálna UVA/UVB ochrana SPF 50+',
      productName: 'La Roche-Posay Anthelios UVMune 400 SPF 50+ (50 ml)',
      brand: 'La Roche-Posay',
      activeIngredients: 'Filter Mexoryl 400 (ochrana pred ultra-dlhým UVA 380–400 nm)',
      keyActiveIngredient: 'Filter Mexoryl 400 (ochrana pred ultra-dlhým UVA žiarením 380–400 nm)',
      whyItMatters: 'Kritická ochrana pred UV fotopoškodením (skóre 48/100) a dilatáciou cievok spôsobenou slnečným žiarením.',
      frequencySchedule: 'Každé ráno ako posledný krok rutiny',
      titrationNotes: 'Dôkladne pretrepať pred aplikáciou. Naniesť 15 minút pred odchodom z domu.',
      usage: 'Pretrepať a aplikovať každé ráno ako posledný krok.',
      purpose: 'Ochrana pred fotostarnutím a vznikom pigmentových škvŕn.',
      price: priceLrpSpf,
      meicetJustification: 'Nevyhnutná ochrana pri zistenom UV fotopoškodení (skóre 48/100).'
    }
  ];

  const midEndEvening: MeicetSkincareProduct[] = [
    {
      step: 1,
      category: 'Hypoalergénne večerné odlíčenie',
      productName: 'La Roche-Posay Toleriane Dermo-Cleanser (200 ml)',
      brand: 'La Roche-Posay',
      activeIngredients: 'Termálna voda La Roche-Posay, glycerín',
      keyActiveIngredient: 'Termálna voda La Roche-Posay + glycerín (bez parfumácie a bez mydla)',
      whyItMatters: 'Ultra-šetrné hypoalergénne čistenie minimalizuje mechanické dráždenie kapilár na lícach a zabraňuje sčervenaniu.',
      frequencySchedule: 'Každý večer',
      titrationNotes: 'Naniesť končekmi prstov krúživými pohybmi, zotrieť jemným navlhčeným tampónom alebo opláchnuť.',
      usage: 'Večer jemne odlíčiť a vyčistiť pleť od SPF filtrov.',
      purpose: 'Upokojujúce čistenie pre citlivú a cievne reaktívnu pleť.',
      price: priceLrpCleanser,
      meicetJustification: 'Minimalizuje mechanické dráždenie kapilár na lícach.'
    },
    {
      step: 2,
      category: 'Pro-kolagénová obnova pevnosti',
      productName: 'Vichy Liftactiv Collagen Specialist (50 ml)',
      brand: 'Vichy',
      activeIngredients: 'Pro-kolagénové peptidy, vitamín Cg, resveratrol',
      keyActiveIngredient: 'Pro-kolagénové peptidy ryže + vitamín Cg + resveratrol',
      whyItMatters: 'Stimuluje tvorbu kolagénu typu I a III, spevňuje kontúry tváre pri zistených jemných vráskach (skóre 54/100).',
      frequencySchedule: 'Každý večer: tenká vrstva na tvár a krk',
      titrationNotes: 'Aplikovať pred hydratačným krémom alebo Cicaplastom.',
      usage: 'Večer aplikovať na vyčistenú pleť tváre a krku.',
      purpose: 'Stimulácia tvorby kolagénu, spevnenie kontúr a zjednotenie tónu pleti.',
      price: priceVichyCollagen,
      meicetJustification: 'Korekcia začínajúcich vrások a úbytku kolagénu (skóre 54/100).'
    },
    {
      step: 3,
      category: 'Hĺbková ceramidová hydratácia',
      productName: 'CeraVe Hydratačný krém (177 ml)',
      brand: 'CeraVe',
      activeIngredients: '3 esenciálne ceramidy (1, 3, 6-II), kyselina hyalurónová',
      keyActiveIngredient: '3 identické ceramidy (1, 3, 6-II) + fytosfingozín + technológia MVE',
      whyItMatters: 'Postupné 24-hodinové uvoľňovanie ceramidov obnovuje medzibunkové lipidy a dramaticky znižuje nočné TEWL.',
      frequencySchedule: 'Každý večer na suchšie partie tváre a krku',
      titrationNotes: 'Vtlačiť dlaňami do pokožky pre hĺbkové uzamknutie vlhkosti.',
      usage: 'Naniesť večer na suchšie partie tváre a krku.',
      purpose: 'Postupné 24-hodinové uvoľňovanie hydratácie a obnova bariéry.',
      price: priceCeraveCream,
      meicetJustification: 'Zníženie transepidermálnej straty vody (TEWL) počas spánku.'
    },
    {
      step: 4,
      category: 'Upokojujúci bariérový balzam',
      productName: 'La Roche-Posay Cicaplast Baume B5+ (100 ml)',
      brand: 'La Roche-Posay',
      activeIngredients: '5% pantenol, madecassoside, Tribioma, zinok a mangán',
      keyActiveIngredient: '5% pantenol + madecassoside + prebiotický komplex Tribioma + zinok a mangán',
      whyItMatters: 'SOS bariérový balzam: okamžite upokojuje reaktívny erytém líc (36/100), regeneruje mikrobióm a chráni pokožku po estetických zákrokoch.',
      frequencySchedule: 'Každý večer lokálne na začervenané miesta; po laseri 2–3x denne',
      titrationNotes: 'Vhodné aplikovať ako nočnú ochrannú masku na malárnu cievnu zónu.',
      usage: 'Aplikovať na citlivé/začervenané miesta a po každom estetickom zákroku.',
      purpose: 'Intenzívna regenerácia pokožky a upokojenie začervenania.',
      price: priceLrpCicaplast,
      meicetJustification: 'Ochranný balzam pre cievne reaktívne zóny a rýchle hojenie po ošetreniach.'
    }
  ];

  const highEndTotal = [...highEndMorning, ...highEndEvening].reduce((acc, item) => acc + (item.price || 0), 0);
  const midEndTotal = [...midEndMorning, ...midEndEvening].reduce((acc, item) => acc + (item.price || 0), 0);

  const dynamicMetrics: MeicetSkinMetrics = isSensitiveDry
    ? {
        skinScoreOverall: 69,
        skinAge: 39,
        actualAge: computedAge,
        skinType: 'citlivá a suchá',
        fitzpatrickPhototype: 'II',
        hydration: {
          score: 44,
          percentile: 32,
          status: 'kritický',
          description: 'Epidermálna dehydratácia so zvýšenou transepidermálnou stratou vody (TEWL 44/100).',
          clinicalSignificance: 'Oslabená hydrolipidová bariéra spôsobuje pnutie, zvýšenú reaktivitu na vonkajšie vplyvy a prehlbuje jemné mimické linky.',
          tewlLevel: 'vysoká',
          moistureZoneNote: 'Kritická dehydratácia v malárnej oblasti líc a periorálne.'
        },
        pores: {
          score: 74,
          percentile: 68,
          status: 'dobrý',
          description: 'Jemný reliéf pórov bez masívneho mazu a bez porfyrínov.',
          clinicalSignificance: 'Nevyžaduje agresívne odmasťovanie, zachovať šetrné bariérové čistenie.',
          poreCountEstimate: 820,
          predominantZone: 'Centrálna časť nosa'
        },
        wrinkles: {
          score: 54,
          percentile: 45,
          status: 'mierne zhoršený',
          description: 'Jemné dehydratačné linky periorbitálne a frontálne ryhy.',
          clinicalSignificance: 'Kombinácia dehydratácie a mimickej aktivity. Indikovaný Rejuran Healer a botulotoxín.',
          fineLinesScore: 58,
          deepWrinklesScore: 49,
          primaryZones: ['Očné okolie', 'Čelo', 'Glabela']
        },
        texture: {
          score: 65,
          percentile: 58,
          status: 'mierne zhoršený',
          description: 'Mikrošupinky v dôsledku dehydratácie a oslabeného lipidového plášťa.',
          clinicalSignificance: 'Vyžaduje bariérovú rekonštrukciu, žiadne drsné mechanické peelingy.',
          roughnessIndex: 32,
          keratinizationState: 'Jemné epidermálne šupinky na lícach'
        },
        uvDamage: {
          score: 50,
          percentile: 46,
          status: 'mierne zhoršený',
          description: 'Podpovrchové UV fotopoškodenie.',
          clinicalSignificance: 'Dôsledná ranná fotoprotekcia SPF 50+ s ochranou cievok pred teplom a UV žiarením.',
          hiddenSpotsRisk: 'stredné',
          photodamageSeverity: 'Mierne difúzne fotostarnutie'
        },
        brownSpots: {
          score: 64,
          percentile: 58,
          status: 'dobrý',
          description: 'Bez ložiskovej melazmy.',
          clinicalSignificance: 'Prevencia pigmentácií.',
          melasmaTendency: false,
          pigmentDepth: 'epidermálny'
        },
        redAreas: {
          score: 36,
          percentile: 26,
          status: 'kritický',
          description: 'Výrazný reaktívny difúzny erytém na lícach a krídlach nosa v krížovo-polarizovanom spektre Meicet (skóre 36/100).',
          clinicalSignificance: 'Vysoká cievna reaktivita a riziko rozvoja rosacey. Zákaz horúcej vody, sáun a dráždivých peelingov. Primárna indikácia pre Cievny laser (160 €).',
          erythemaLevel: 'vysoko citlivá / cievna',
          rosaceaRisk: true,
          telangiectasiaZones: ['Líca (malárna oblasť)', 'Krídla nosa', 'Glabela']
        },
        sebumAndPorphyrins: {
          score: 42,
          percentile: 34,
          status: 'mierne zhoršený',
          description: 'Znížená sekrécia mazu, lipidový deficit.',
          clinicalSignificance: 'Nutná obnova ceramidov (Triple Lipid Restore 2:4:2 / CeraVe).',
          tZoneOiliness: 'nízka',
          microbialActivity: 'minimálna'
        }
      }
    : {
        ...SAMPLE_MEICET_METRICS,
        skinType: currentSkinType,
        actualAge: computedAge
      };

  const expertRoutine = MeicetClinicalEducationService.generateExpertOptimalRoutine({
    metrics: dynamicMetrics,
    anamnesis
  } as any);

  const advancedRoutine = MeicetClinicalEducationService.generateAdvancedRoutine({
    metrics: dynamicMetrics,
    anamnesis
  } as any);

  return {
    id: `meicet-${Date.now()}`,
    patientId,
    patientName,
    patientBirthNumber: birthNumber,
    scanDate: new Date().toISOString().split('T')[0],
    deviceModel: 'Meicet Pro-A (ISEMECO 3D Spectral Facial Diagnostic System)',
    pdfSourceFilename: 'Meicet_ProA_Diagnostika_Pleti.pdf',
    metrics: dynamicMetrics,
    anamnesis,
    clinicalSynthesis: isSensitiveDry
      ? {
          summary:
            '3D spektrálna analýza Meicet Pro-A poukazuje na citlivú a suchú pleť s epidermálnou dehydratáciou so zvýšeným TEWL (skóre 44/100), reaktívnym cievnym erytémom na lícach a krídlach nosa (skóre 36/100) a oslabenou kožnou bariérou. Celkový index zdravia pleti je 69/100. Navrhnutý plán kombinuje cielenú bariérovú a antioxidačnú starostlivosť (SkinCeuticals Phyto Corrective + Triple Lipid Restore 2:4:2 alebo Mid-End Cicaplast B5+) so sezónne načasovaným cievnym laserom na redukciu erytému a hĺbkovou biostimuláciou polynukleotidmi (Rejuran Healer / Profhilo).',
          keyFindings: [
            'Oslabená kožná bariéra a zvýšený TEWL (44/100) spôsobujú pnutie a citlivosť.',
            'Reaktívny cievny erytém (36/100) v strednej tretine tváre – primárna indikácia pre Cievny laser.',
            'Znížená lipidová ochrana vyžaduje rekonštrukciu ceramidmi (Triple Lipid 2:4:2 / Cicaplast B5+).',
            'Úbytok dermálnej pružnosti a mimické vrásky – indikovaný Rejuran Healer a botulotoxín.'
          ],
          riskAlerts: [
            'STRIKTNÝ ZÁKAZ BioRePeelCl3 (35% TCA), kyselinových peelingov a ablatívnych CO2 laserov pri reaktívnom erytéme a oslabenej bariére (TEWL 44/100)!',
            'STRIKTNÝ ZÁKAZ agresívnych kyselín, mechanických peelingov, horúcej vody a sáun do kompletnej obnovy kožnej bariéry.',
            'Nutná celoročná ranná fotoprotekcia SPF 50+ s filtrom proti cievnemu prehrievaniu.'
          ],
          synergyWithSurgeries:
            'Biostimulácia polynukleotidmi (Rejuran) a spevnenie cievnych stien laserom vytvára ideálny vitálny podklad pre dlhodobú kvalitu dermis.'
        }
      : {
          summary:
            '3D spektrálna analýza Meicet Pro-A poukazuje na epidermálnu dehydratáciu so zvýšeným TEWL (skóre 44/100), reaktívny cievny erytém na lícach a krídlach nosa (skóre 52/100) a podpovrchové UV fotopoškodenie (skóre 48/100). Navrhnutý plán kombinuje cielenú bariérovú a antioxidačnú domácu starostlivosť (Basic alebo Premium) so sezónne načasovanými klinickými výkonmi SAY CLINIC: Cievny laser a CoolPeel® CO2 laser v období nízkeho UV, nasledované polynukleotidmi (Rejuran), bioremodeláciou (Profhilo) a botulotoxínom.',
          keyFindings: [
            'Zvýšená transepidermálna strata vody (TEWL) oslabuje kožnú bariéru a zvýrazňuje jemné linky.',
            'Reaktívne kapiláry a difúzny erytém v strednej tretine tváre – indikovaný Cievny laser.',
            'Rozšírené póry v T-zóne a zhrubnutá textúra – indikovaný CoolPeel® CO2 laser alebo lekársky peeling BioRePeel / TCA.',
            'Úbytok dermálnej pružnosti a mimické vrásky – indikované polynukleotidy Rejuran Healer, Profhilo a botulotoxín.'
          ],
          riskAlerts: [
            'Počas letných mesiacov (jún – august) nevykonávať ablatívny CO2 laser ani hlboký TCA peeling kvôli riziku pigmentácií (PIH).',
            'Nutná celoročná ranná fotoprotekcia SPF 50+.'
          ],
          synergyWithSurgeries:
            'Pravidelná biostimulácia polynukleotidmi a udržiavanie zdravej kožnej bariéry výrazne zlepšuje kvalitu a elasticitu dermis.'
        },
    annualSchedule: isSensitiveDry
      ? [
          {
            quarter: 'Q1 (Zima / Jar)',
            season: 'jar',
            title: 'Cievna stabilizácia & Bunková oprava DNA',
            focus: 'Selektívna vaskulárna fototermolýza na kapiláry a biostimulácia dermis polynukleotidmi bez ablázie.',
            seasonalConsideration: 'Nízky UV index na začiatku jari je ideálny na laserové uzavretie cievok a posilnenie bariéry pred slnkom.',
            treatments: [
              {
                id: 'trt-q1-1',
                name: 'Cievny laser - celá tvár (rosacea / difúzny erytém)',
                category: 'laser',
                targetArea: 'Líca, krídla nosa a cievne zóny tváre',
                seasonOrMonth: 'Marec',
                frequency: '1 sedenie',
                priority: 'vysoká',
                estimatedPrice: priceVascularFace,
                reasoning: 'Uzavretie ektatických kapilár a potlačenie difúzneho erytému zisteného v krížovo-polarizovanom spektre Meicet (skóre 36/100).',
                status: 'planned'
              },
              {
                id: 'trt-q1-2',
                name: 'Rejuran Healer (Polynukleotidy PN 2 ml - celá tvár)',
                category: 'injectable',
                targetArea: 'Celá tvár',
                seasonOrMonth: 'Apríl',
                frequency: '1 sedenie',
                priority: 'vysoká',
                estimatedPrice: priceRejuranHealer,
                reasoning: 'Hĺbková oprava poškodenej dermálnej DNA, obnova hrúbky atrofickej dermis a posilnenie cievneho endotelu.',
                status: 'planned'
              },
              {
                id: 'trt-q1-3',
                name: 'Botox - 2 oblasti (–10 % kombinačná zľava)',
                category: 'injectable',
                targetArea: 'Glabela (vráska hnevu) + čelo / očné vejáriky',
                seasonOrMonth: 'Máj',
                frequency: '1 sedenie (kontrola do 14 dní v cene)',
                priority: 'vysoká',
                estimatedPrice: priceBotox2Areas,
                reasoning: 'Uvoľnenie mimickej hyperaktivity pred letným slnečným žiarením a prevencia fixácie rýh.',
                status: 'planned'
              }
            ]
          },
          {
            quarter: 'Q2 (Leto)',
            season: 'leto',
            title: 'Intenzívna hydratácia & Posilnenie dermálnej bariéry bez fotosenzitivity',
            focus: 'STRIKTNÝ ZÁKAZ BioRePeel, chemických peelingov a ablatívnych laserov! Čistá hydratácia a biostimulácia bez olupovania.',
            seasonalConsideration: 'Bezpečné letné protokoly bez narušenia epidermy a bez rizika pozápalovej hyperpigmentácie (PIH).',
            treatments: [
              {
                id: 'trt-q2-1',
                name: 'Rejuran Healer (Polynukleotidy PN 2 ml - celá tvár)',
                category: 'injectable',
                targetArea: 'Celá tvár',
                seasonOrMonth: 'Jún / Júl',
                frequency: '1 sedenie',
                priority: 'vysoká',
                estimatedPrice: priceRejuranHealer,
                reasoning: 'Bunková ochrana pred fotostarnutím, zníženie zápalovej kaskády a stimulácia fyziologickej regenerácie.',
                status: 'planned'
              },
              {
                id: 'trt-q2-2',
                name: 'Profhilo (bioremodelácia 2 ml - 5 BAP bodov)',
                category: 'injectable',
                targetArea: 'Stredná a dolná tretina tváre',
                seasonOrMonth: 'Júl',
                frequency: '1 sedenie',
                priority: 'vysoká',
                estimatedPrice: priceProfhilo,
                reasoning: 'Extrémne navýšenie hĺbkovej hydratácie (TEWL 44/100) a obnova pružnosti dermis bez záťaže epidermy.',
                status: 'planned'
              },
              {
                id: 'trt-q2-3',
                name: 'Rejuran I - Očné okolie (Polynukleotidy PN 1 ml)',
                category: 'injectable',
                targetArea: 'Očné viečka a vejárikovité vrásky',
                seasonOrMonth: 'August',
                frequency: '1 sedenie',
                priority: 'odporúčaná',
                estimatedPrice: priceRejuranEye,
                reasoning: 'Regenerácia jemnej periorbitálnej kože bez rizika opuchu a bez fotosenzitivity.',
                status: 'planned'
              }
            ]
          },
          {
            quarter: 'Q3 (Jeseň)',
            season: 'jesen',
            title: 'Cievna konsolidácia po lete & Dvojitá biostimulácia',
            focus: 'Korekcia cievnych dilatácií po letných horúčavách cievnym laserom a hĺbkové doplnenie kolagénu. Žiadne agresívne TCA peelingy ani CO2 lasery!',
            seasonalConsideration: 'Jesenné ochladenie upokojuje reaktívne cievy; ideálny čas na selektívnu cievnu koaguláciu.',
            treatments: [
              {
                id: 'trt-q3-1',
                name: 'Cievny laser - nos / líca (kontrolné cievne ošetrenie)',
                category: 'laser',
                targetArea: 'Líca a krídla nosa',
                seasonOrMonth: 'Október',
                frequency: '1 sedenie',
                priority: 'vysoká',
                estimatedPrice: priceVascularNose,
                reasoning: 'Zatavenie nových drobných kapilár po expozícii letnému teplu a slnku.',
                status: 'planned'
              },
              {
                id: 'trt-q3-2',
                name: 'Rejuran Healer (Polynukleotidy PN 2 ml - celá tvár)',
                category: 'injectable',
                targetArea: 'Celá tvár',
                seasonOrMonth: 'November',
                frequency: '1 sedenie',
                priority: 'vysoká',
                estimatedPrice: priceRejuranHealer,
                reasoning: 'Konsolidácia dermálnej matrix a urýchlenie bunkovej obnovy pred zimným chladom.',
                status: 'planned'
              },
              {
                id: 'trt-q3-3',
                name: 'Profhilo (bioremodelácia 2 ml - 5 BAP bodov)',
                category: 'injectable',
                targetArea: 'Stredná a dolná tretina tváre',
                seasonOrMonth: 'November',
                frequency: '1 sedenie',
                priority: 'odporúčaná',
                estimatedPrice: priceProfhilo,
                reasoning: 'Druhý biostimulačný cyklus kyseliny hyalurónovej pre dlhodobú hydratačnú ochranu.',
                status: 'planned'
              }
            ]
          },
          {
            quarter: 'Q4 (Zima)',
            season: 'zima',
            title: 'Regeneratívna bunková terapia exozómami & Cievna stabilizácia',
            focus: 'Prémiová regenerácia bariéry exozómami ASCE+ a ochrana kapilár pred teplotnými šokmi (mráz / kúrenie).',
            seasonalConsideration: 'Zimné nízke UV umožňuje bezpečný cievny zákrok a intenzívnu regeneratívnu kúru.',
            treatments: [
              {
                id: 'trt-q4-1',
                name: 'Cievny laser - celá tvár (rosacea / difúzny erytém)',
                category: 'laser',
                targetArea: 'Celá tvár (malárna zóna a nos)',
                seasonOrMonth: 'December',
                frequency: '1 sedenie',
                priority: 'vysoká',
                estimatedPrice: priceVascularFace,
                reasoning: 'Finálne zjednotenie tónu pleti a prevencia chronickej vazodilatácie v zime.',
                status: 'planned'
              },
              {
                id: 'trt-q4-2',
                name: 'Exozómy ASCE+ / ExoCoBio tvár (regeneratívna terapia)',
                category: 'injectable',
                targetArea: 'Celá tvár',
                seasonOrMonth: 'Január',
                frequency: '1 sedenie',
                priority: 'vysoká',
                estimatedPrice: priceExosomes,
                reasoning: 'Najmodernejšia bunková signalizácia: masívna produkcia kolagénu, protizápalový efekt a komplexná obnova kožnej bariéry.',
                status: 'planned'
              }
            ]
          }
        ]
      : [
          {
            quarter: 'Q1 (Zima / Jar)',
            season: 'jar',
            title: 'Cievne zjednotenie pleti, obnova textúry & relaxácia mimiky',
            focus: 'Cievny laser na začervenanie, lekársky peeling / microneedling a aplikácia botulotoxínu pred slnečnou sezónou.',
            seasonalConsideration: 'Nízky UV index na začiatku jari je ideálny na laserové zjednotenie cievok a textúry pleti.',
            treatments: [
              {
                id: 'trt-q1-1',
                name: 'Cievny laser - celá tvár (rosacea / difúzny erytém)',
                category: 'laser',
                targetArea: 'Líca, krídla nosa a cievne zóny tváre',
                seasonOrMonth: 'Marec',
                frequency: '1 sedenie',
                priority: 'vysoká',
                estimatedPrice: priceVascularFace,
                reasoning: 'Uzavretie rozšírených kapilár a redukcia difúzneho začervenania zisteného v krížovo-polarizovanom svetle Meicet.',
                status: 'planned'
              },
              {
                id: 'trt-q1-2',
                name: 'Botox - 2 oblasti (–10 % kombinačná zľava)',
                category: 'injectable',
                targetArea: 'Glabela (vráska hnevu) + čelo / očné vejáriky',
                seasonOrMonth: 'Apríl',
                frequency: '1 sedenie (kontrola do 14 dní v cene)',
                priority: 'vysoká',
                estimatedPrice: priceBotox2Areas,
                reasoning: 'Uvoľnenie mimickej hyperaktivity pred letným žmúrením na slnku.',
                status: 'planned'
              },
              {
                id: 'trt-q1-3',
                name: 'Profhilo (bioremodelácia 2 ml - 5 BAP bodov)',
                category: 'injectable',
                targetArea: 'Stredná a dolná tretina tváre',
                seasonOrMonth: 'Máj',
                frequency: '1 sedenie',
                priority: 'odporúčaná',
                estimatedPrice: priceProfhilo,
                reasoning: 'Okamžité navýšenie hĺbkovej hydratácie (z 44 % na >70 %) a stimulácia 4 typov kolagénu.',
                status: 'planned'
              }
            ]
          },
          {
            quarter: 'Q2 (Leto)',
            season: 'leto',
            title: 'Bunková fotoprotekcia, Polynukleotidy & Biorevitalizácia bez fotosenzitivity',
            focus: 'Zákaz ablatívnych laserov! Oprava DNA buniek polynukleotidmi Rejuran a šetrná biorevitalizácia.',
            seasonalConsideration: 'Bezpečné letné procedúry bez narušenia epidermy a bez rizika pigmentových škvŕn.',
            treatments: [
              {
                id: 'trt-q2-1',
                name: 'Rejuran Healer (Polynukleotidy PN 2 ml - celá tvár)',
                category: 'injectable',
                targetArea: 'Celá tvár',
                seasonOrMonth: 'Jún / Júl',
                frequency: '1 sedenie',
                priority: 'vysoká',
                estimatedPrice: priceRejuranHealer,
                reasoning: 'Bunková oprava DNA poškodenej UV žiarením, stiahnutie pórov a posilnenie dermálnej matrix.',
                status: 'planned'
              },
              {
                id: 'trt-q2-2',
                name: 'Rejuran I - Očné okolie (Polynukleotidy PN 1 ml)',
                category: 'injectable',
                targetArea: 'Očné viečka, kruhy pod očami a jemné vejáriky',
                seasonOrMonth: 'August',
                frequency: '1 sedenie',
                priority: 'odporúčaná',
                estimatedPrice: priceRejuranEye,
                reasoning: 'Spevnenie tenkej pokožky očného okolia bez rizika opuchu.',
                status: 'planned'
              },
              {
                id: 'trt-q2-3',
                name: 'Medicínsky peeling BioRePeel / PRX-T33',
                category: 'skin_care',
                targetArea: 'Celá tvár a T-zóna',
                seasonOrMonth: 'August',
                frequency: '1 sedenie',
                priority: 'udržiavacia',
                estimatedPrice: priceBioRePeel,
                reasoning: 'Celoročný biorevitalizačný peeling bez olupovania a bez fotosenzitivity na zjemnenie pórov.',
                status: 'planned'
              }
            ]
          },
          {
            quarter: 'Q3 (Jeseň)',
            season: 'jesen',
            title: 'Laserový resurfacing CoolPeel® CO2 & Depigmentácia po lete',
            focus: 'Hlavná laserová sezóna: stiahnutie pórov, zjednotenie textúry a odstránenie pigmentácií.',
            seasonalConsideration: 'Nízky jesenný UV index umožňuje bezpečné ošetrenie frakčným CO2 laserom a TCA peelingom.',
            treatments: [
              {
                id: 'trt-q3-1',
                name: 'CoolPeel® (DEKA Tetra CO2) - celá tvár',
                category: 'laser',
                targetArea: 'Celá tvár (póry, jemné vrásky a textúra)',
                seasonOrMonth: 'Október',
                frequency: '1 sedenie',
                priority: 'vysoká',
                estimatedPrice: priceCoolpeelFace,
                reasoning: 'Subablatívny CO2 laserový resurfacing na stiahnutie rozšírených pórov a obnovu kolagénu s minimálnou rekonvalescenciou.',
                status: 'planned'
              },
              {
                id: 'trt-q3-2',
                name: 'Lekársky chemický peeling TCA',
                category: 'skin_care',
                targetArea: 'Celá tvár (solárne pigmentácie a melazma)',
                seasonOrMonth: 'November',
                frequency: '1 sedenie',
                priority: 'odporúčaná',
                estimatedPrice: priceTcaPeel,
                reasoning: 'Cielená eliminácia podpovrchových UV pigmentácií zistených skenerom Meicet.',
                status: 'planned'
              }
            ]
          },
          {
            quarter: 'Q4 (Zima)',
            season: 'zima',
            title: 'Hĺbková kolagenéza, Dermapen & Zimná regenerácia',
            focus: 'Dlhodobá novotvorba kolagénu (Sculptra / Dermapen) a udržiavací refresh botulotoxínu.',
            seasonalConsideration: 'Zimné obdobie je ideálne na hĺbkovú prestavbu kolagénu a prípravu pleti na nový rok.',
            treatments: [
              {
                id: 'trt-q4-1',
                name: 'Dermapen 4 / Lekársky microneedling s mezo-sérom',
                category: 'injectable',
                targetArea: 'Celá tvár a krk',
                seasonOrMonth: 'December',
                frequency: '1 sedenie',
                priority: 'odporúčaná',
                estimatedPrice: priceDermapen,
                reasoning: 'Mikroihličková indukcia kolagénu na zjemnenie textúry a pórov.',
                status: 'planned'
              },
              {
                id: 'trt-q4-2',
                name: 'Sculptra (kyselina poly-L-mliečna PLLA)',
                category: 'injectable',
                targetArea: 'Vektorový lifting líc a dolnej tretiny tváre',
                seasonOrMonth: 'Január',
                frequency: '1 ampulka',
                priority: 'odporúčaná',
                estimatedPrice: priceSculptra,
                reasoning: 'Najsilnejšia biostimulácia vlastného kolagénu typu I a III s efektom na 24 mesiacov.',
                status: 'planned'
              }
            ]
          }
        ],
    skincareRoutine: {
      selectedTier: preferredTier,
      highEnd: {
        tier: 'high_end',
        tierLabel: 'Premium (SkinCeuticals)',
        brandDescription: 'Medical-Grade kozmeceutika z cenníka SAY CLINIC – patentované antioxidanty, retinoidy a fyziologické lipidy 2:4:2',
        totalEstimatedPrice: highEndTotal,
        clinicEstimatedPrice: highEndTotal,
        externalEstimatedPrice: 0,
        morning: highEndMorning,
        evening: highEndEvening,
        weeklyCare: [
          '7 dní pred laserom (CoolPeel CO2 / Cievny laser) alebo TCA peelingom vysadiť večerný Retinol 0.3.',
          'Prvých 5 dní po laseri alebo microneedlingu aplikovať SkinCeuticals Epidermal Repair 2–3x denne.',
          'Každé ráno celoročne aplikovať SPF 50+ (aj počas zamračených dní).'
        ]
      },
      advanced: advancedRoutine,
      midEnd: {
        tier: 'mid_end',
        tierLabel: 'Essential (La Roche-Posay, CeraVe, Vichy)',
        brandDescription: 'Overená lekárenská dermokozmetika z cenníka SAY CLINIC – šetrné čistenie, ceramidy, vitamín B5 a UVMune 400 SPF 50+',
        totalEstimatedPrice: midEndTotal,
        clinicEstimatedPrice: midEndTotal,
        externalEstimatedPrice: 0,
        morning: midEndMorning,
        evening: midEndEvening,
        weeklyCare: [
          'Po každom estetickom ošetrení (laser, peeling, Dermapen) aplikovať La Roche-Posay Cicaplast Baume B5+ niekoľkokrát denne.',
          'Každé ráno dôsledne chrániť pleť fluidom Anthelios UVMune 400 SPF 50+.'
        ]
      },
      expert: expertRoutine,
      morning: preferredTier === 'mid_end'
        ? midEndMorning
        : preferredTier === 'advanced'
        ? advancedRoutine.morning
        : preferredTier === 'expert'
        ? expertRoutine.morning
        : highEndMorning,
      evening: preferredTier === 'mid_end'
        ? midEndEvening
        : preferredTier === 'advanced'
        ? advancedRoutine.evening
        : preferredTier === 'expert'
        ? expertRoutine.evening
        : highEndEvening,
      weeklyCare: preferredTier === 'mid_end'
        ? [
            'Po každom estetickom ošetrení aplikovať La Roche-Posay Cicaplast Baume B5+ na rýchlu obnovu bariéry.',
            'Každé ráno aplikovať Anthelios UVMune 400 SPF 50+.'
          ]
        : preferredTier === 'advanced'
        ? advancedRoutine.weeklyCare
        : preferredTier === 'expert'
        ? expertRoutine.weeklyCare
        : [
            '7 dní pred laserom alebo peelingom vysadiť večerný Retinol 0.3.',
            'Po zákrokoch používať SkinCeuticals Epidermal Repair a Triple Lipid Restore 2:4:2.'
          ],
      seasonalTips: preferredTier === 'mid_end'
        ? 'V lete používajte ľahký Vichy Minéral 89 + La Roche-Posay Anthelios UVMune 400 SPF 50+. V zime pridajte výživný CeraVe Hydratačný krém a Cicaplast Baume B5+.'
        : preferredTier === 'advanced'
        ? 'V lete chráňte pleť kľúčovým antioxidantom SkinCeuticals a fluidom Anthelios UVMune 400. Na jeseň a v zime zaraďte večerný Retinol 0.3 a CeraVe / Cicaplast.'
        : preferredTier === 'expert'
        ? 'V lete chráňte pleť Duke antioxidačným vzorcom (C E Ferulic) a ľahkými textúrami. Na jeseň a v zime zaraďte večerný Medik8 Crystal Retinal a bariérové lipidy.'
        : 'V lete chráňte pleť kombináciou C E Ferulic + Advanced Brightening SPF 50+. Na jeseň a v zime zaraďte večerný Retinol 0.3 a Triple Lipid Restore 2:4:2.'
    },
    scarProtocol: {
      hasScars: false,
      scarSummary: 'Tento modul je zameraný na diagnostiku pleti a nechirurgickú estetiku. Protokol starostlivosti o pooperačné chirurgické jazvy sa nachádza v samostatnom Chirurgickom Pre-Op & Post-Op Pláne.',
      dailyRoutine: {
        cleansing: 'Šetrné čistenie pleti podľa zvolenej Essential, Advanced alebo Premium rutiny.',
        siliconeTherapy: 'Pri atrofických jazvičkách po akné je indikovaný Rejuran S (190 €) a Frakčný CO2 laser.',
        pressureMassage: '',
        sunProtection: 'Celoročná ochrana SPF 50+.'
      },
      clinicalLaserTherapy: {
        recommendedProcedures: [
          'Cievny laser (začervenanie, rosacea, cievky)',
          'CoolPeel® / Frakčný CO2 laser (textúra, póry, jazvičky po akné)'
        ],
        bestSeason: 'Jeseň, Zima a skorá Jar (obdobie nízkeho UV indexu)',
        precautions: '4 týždne pred a po laserovom ošetrení sa vyhýbať priamemu slneniu a soláriu.'
      },
      warningSigns: []
    },
    milestones: [
      {
        timeframe: 'Po 3 mesiacoch',
        title: 'Kontrola obnovy kožnej bariéry a hydratácie',
        focusArea: 'Hydratácia pleti (TEWL) a ústup začervenania',
        targetMetrics: 'Nárast hydratácie z 44 % na >65 %, zníženie reaktivity cievnych zón.',
        rescanChecklist: [
          'Kontrolný 3D sken Meicet Pro-A',
          'Vyhodnotenie znášanlivosti domácej Skincare rutiny'
        ]
      },
      {
        timeframe: 'Po 6 mesiacoch',
        title: 'Jesenný audit pleti pred laserovou sezónou',
        focusArea: 'UV pigmentácie a textúra pórov',
        targetMetrics: 'Zjemnenie pórov a zjednotenie farebného tónu pleti.',
        rescanChecklist: [
          'Meicet UV analýza podpovrchového melanínu',
          'Načasovanie ošetrenia CoolPeel® CO2 / Cievny laser'
        ]
      },
      {
        timeframe: 'Po 12 mesiacoch',
        title: 'Ročné vyhodnotenie omladenia pleti',
        focusArea: 'Komplexný 360° profil kvality a biologického veku pleti',
        targetMetrics: 'Zníženie veku pleti na Meicet Pro-A z 41 r. na ≤36 r., celkové skóre >85 bodov.',
        rescanChecklist: [
          'Porovnanie Before vs. After (12 mesiacov)',
          'Nastavenie udržiavacieho režimu na ďalší rok'
        ]
      }
    ],
    doctorNotes:
      'Plán pleti a domácej starostlivosti (Essential / Advanced / Premium / Clinical Optimum) je zostavený na mieru podľa 3D diagnostiky Meicet Pro-A a cenníka SAY CLINIC.',
    doctorName: 'MUDr. Ján Mráz',
    createdAt: new Date().toISOString()
  };
}
