import { MeicetAnalysisResult, MeicetSkinMetrics, MeicetAnamnesisContext } from '@/types/meicet';
import { getClinicPrice } from '@/data/clinicPriceList';

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
  preferredTier: 'high_end' | 'mid_end' = 'high_end',
  selectedConcernIds?: string[]
): MeicetAnalysisResult {
  const priceVascularFace = getClinicPrice('vascular_laser_face', 160);
  const priceCoolpeelFace = getClinicPrice('coolpeel_face', 220);
  const priceBotox2Areas = getClinicPrice('botox_2_areas', 216);
  const priceProfhilo = getClinicPrice('profhilo_2ml', 290);
  const priceRejuranHealer = getClinicPrice('rejuran_healer_2ml', 290);
  const priceRejuranEye = getClinicPrice('rejuran_i_eye_1ml', 190);
  const priceBioRePeel = getClinicPrice('biorepeel_prx_t33', 90);
  const priceTcaPeel = getClinicPrice('tca_peel_medical', 110);
  const priceDermapen = getClinicPrice('dermapen_microneedling', 140);
  const priceSculptra = getClinicPrice('sculptra', 450);

  // Ceny kozmetiky zo živého cenníka
  const priceScCleanser = getClinicPrice('sc_soothing_cleanser', 46);
  const priceScCeFerulic = getClinicPrice('sc_ce_ferulic', 175);
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
      : [
          'Pocit pnutia a dehydratovanej pleti',
          'Rozšírené cievky a začervenanie na lícach a nose',
          'Jemné vrásky okolo očí a na čele',
          'Rozšírené póry a strata jasu pleti'
        ],
    contraindications: [
      'Zákaz ablatívneho CO2 lasera a hlbokého TCA peelingu v letnom období (jún – august) kvôli riziku PIH'
    ],
    lifestyleNotes: 'Práca v klimatizovanej kancelárii, mestský environmentálny stres.'
  };

  const highEndMorning = [
    {
      step: 1,
      category: 'Šetrné ranné čistenie',
      productName: 'SkinCeuticals Soothing Cleanser (150 ml)',
      brand: 'SkinCeuticals',
      activeIngredients: 'Sorbitol, glycerín, extrakt z orchidey a uhorky',
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
      usage: 'Aplikovať každé ráno ako posledný krok pred odchodom z domu.',
      purpose: 'Ochrana pred UVA/UVB žiarením a blokáda tvorby pigmentových škvŕn.',
      price: priceScSpf,
      meicetJustification: 'Prevencia aktivácie podpovrchového melanínu zisteného v UV spektre.'
    }
  ];

  const highEndEvening = [
    {
      step: 1,
      category: 'Večerné odlíčenie a čistenie',
      productName: 'SkinCeuticals Soothing Cleanser (150 ml)',
      brand: 'SkinCeuticals',
      activeIngredients: 'Sorbitol, glycerín, botanické extrakty',
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
      usage: 'Aplikovať na začervenané zóny alebo prvých 5–7 dní po laseri / microneedlingu.',
      purpose: 'Okamžité upokojenie erytému a urýchlenie epitelizácie.',
      price: priceScEpidermal,
      meicetJustification: 'Cielené upokojenie reaktívnych cievnych zón (skóre 52/100).'
    }
  ];

  const midEndMorning = [
    {
      step: 1,
      category: 'Šetrné čistenie s ceramidmi',
      productName: 'CeraVe Hydratačná čistiaca emulzia (236 ml)',
      brand: 'CeraVe',
      activeIngredients: '3 esenciálne ceramidy, kyselina hyalurónová, MVE technológia',
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
      usage: 'Pretrepať a aplikovať každé ráno ako posledný krok.',
      purpose: 'Ochrana pred fotostarnutím a vznikom pigmentových škvŕn.',
      price: priceLrpSpf,
      meicetJustification: 'Nevyhnutná ochrana pri zistenom UV fotopoškodení (skóre 48/100).'
    }
  ];

  const midEndEvening = [
    {
      step: 1,
      category: 'Hypoalergénne večerné odlíčenie',
      productName: 'La Roche-Posay Toleriane Dermo-Cleanser (200 ml)',
      brand: 'La Roche-Posay',
      activeIngredients: 'Termálna voda La Roche-Posay, glycerín',
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
      usage: 'Aplikovať na citlivé/začervenané miesta a po každom estetickom zákroku.',
      purpose: 'Intenzívna regenerácia pokožky a upokojenie začervenania.',
      price: priceLrpCicaplast,
      meicetJustification: 'Ochranný balzam pre cievne reaktívne zóny a rýchle hojenie po ošetreniach.'
    }
  ];

  const highEndTotal = [
    priceScCleanser,
    priceScCeFerulic,
    priceScHaIntensifier,
    priceScSpf,
    priceScRetinol,
    priceScTripleLipid,
    priceScEpidermal
  ].reduce((a, b) => a + b, 0);

  const midEndTotal = [
    priceCeraveCleanser,
    priceVichyMineral89,
    priceLrpHyaluB5,
    priceLrpSpf,
    priceLrpCleanser,
    priceVichyCollagen,
    priceCeraveCream,
    priceLrpCicaplast
  ].reduce((a, b) => a + b, 0);

  return {
    id: `meicet-${Date.now()}`,
    patientId,
    patientName,
    patientBirthNumber: birthNumber,
    scanDate: new Date().toISOString().split('T')[0],
    deviceModel: 'Meicet Pro-A (ISEMECO 3D Spectral Facial Diagnostic System)',
    pdfSourceFilename: 'Meicet_ProA_Diagnostika_Pleti.pdf',
    metrics: SAMPLE_MEICET_METRICS,
    anamnesis,
    clinicalSynthesis: {
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
    annualSchedule: [
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
        morning: highEndMorning,
        evening: highEndEvening,
        weeklyCare: [
          '7 dní pred laserom (CoolPeel CO2 / Cievny laser) alebo TCA peelingom vysadiť večerný Retinol 0.3.',
          'Prvých 5 dní po laseri alebo microneedlingu aplikovať SkinCeuticals Epidermal Repair 2–3x denne.',
          'Každé ráno celoročne aplikovať SPF 50+ (aj počas zamračených dní).'
        ]
      },
      midEnd: {
        tier: 'mid_end',
        tierLabel: 'Basic (La Roche-Posay, CeraVe, Vichy)',
        brandDescription: 'Overená lekárenská dermokozmetika z cenníka SAY CLINIC – šetrné čistenie, ceramidy, vitamín B5 a UVMune 400 SPF 50+',
        totalEstimatedPrice: midEndTotal,
        morning: midEndMorning,
        evening: midEndEvening,
        weeklyCare: [
          'Po každom estetickom ošetrení (laser, peeling, Dermapen) aplikovať La Roche-Posay Cicaplast Baume B5+ niekoľkokrát denne.',
          'Každé ráno dôsledne chrániť pleť fluidom Anthelios UVMune 400 SPF 50+.'
        ]
      },
      morning: preferredTier === 'mid_end' ? midEndMorning : highEndMorning,
      evening: preferredTier === 'mid_end' ? midEndEvening : highEndEvening,
      weeklyCare: preferredTier === 'mid_end'
        ? [
            'Po každom estetickom ošetrení aplikovať La Roche-Posay Cicaplast Baume B5+ na rýchlu obnovu bariéry.',
            'Každé ráno aplikovať Anthelios UVMune 400 SPF 50+.'
          ]
        : [
            '7 dní pred laserom alebo peelingom vysadiť večerný Retinol 0.3.',
            'Po zákrokoch používať SkinCeuticals Epidermal Repair a Triple Lipid Restore 2:4:2.'
          ],
      seasonalTips: preferredTier === 'mid_end'
        ? 'V lete používajte ľahký Vichy Minéral 89 + La Roche-Posay Anthelios UVMune 400 SPF 50+. V zime pridajte výživný CeraVe Hydratačný krém a Cicaplast Baume B5+.'
        : 'V lete chráňte pleť kombináciou C E Ferulic + Advanced Brightening SPF 50+. Na jeseň a v zime zaraďte večerný Retinol 0.3 a Triple Lipid Restore 2:4:2.'
    },
    scarProtocol: {
      hasScars: false,
      scarSummary: 'Tento modul je zameraný na diagnostiku pleti a nechirurgickú estetiku. Protokol starostlivosti o pooperačné chirurgické jazvy sa nachádza v samostatnom Chirurgickom Pre-Op & Post-Op Pláne.',
      dailyRoutine: {
        cleansing: 'Šetrné čistenie pleti podľa zvolenej Basic alebo Premium rutiny.',
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
      'Plán pleti a domácej starostlivosti (Basic / Premium) je zostavený na mieru podľa 3D diagnostiky Meicet Pro-A a oficiálneho cenníka SAY CLINIC.',
    doctorName: 'MUDr. Ján Mráz',
    createdAt: new Date().toISOString()
  };
}
