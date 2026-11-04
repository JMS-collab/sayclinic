import { 
  MeicetAnalysisResult, 
  MeicetClinicalEducation, 
  MeicetPathophysiologyIssue, 
  MeicetTherapeuticPhase, 
  MeicetActiveIngredientEducation, 
  MeicetProcedureMechanismEducation 
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
