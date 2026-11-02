'use client';

import React, { useState } from 'react';
import { SculptureViewType } from '../Sculpture2DViewer';

interface FacialMusclesOverlayProps {
  view: SculptureViewType;
  opacity?: number;
  showLabels?: boolean;
}

interface MuscleDef {
  id: string;
  latinName: string;
  slovakName: string;
  clinicalNote: string;
  path: string;
  striations?: string[];
  labelPos?: { x: number; y: number };
}

export function FacialMusclesOverlay({
  view,
  opacity = 0.55,
  showLabels = true
}: FacialMusclesOverlayProps) {
  const [hoveredMuscle, setHoveredMuscle] = useState<MuscleDef | null>(null);

  // =========================================================================
  // 1. ANATÓMIA SVALOV TVÁRE – ČELNÝ POHĽAD (FRONT VIEW) – 100% KALIBROVANÁ
  // =========================================================================
  const frontMuscles: MuscleDef[] = [
    // 1. M. frontalis – ľavé bruško
    {
      id: 'frontalis_left',
      latinName: 'm. frontalis (sin.)',
      slovakName: 'Čelový sval (ľavý)',
      clinicalNote: 'Aplikácia botulotoxínu pre horizontálne vrásky čela (Dysport / Alluzience).',
      path: 'M 210,152 C 240,146 275,146 294,150 L 294,252 C 265,255 235,254 210,248 Z',
      striations: [
        'M 224,154 L 224,248',
        'M 240,150 L 240,251',
        'M 256,148 L 256,253',
        'M 272,148 L 272,253',
        'M 286,150 L 286,252'
      ],
      labelPos: { x: 252, y: 198 }
    },
    // 2. M. frontalis – pravé bruško
    {
      id: 'frontalis_right',
      latinName: 'm. frontalis (dx.)',
      slovakName: 'Čelový sval (pravý)',
      clinicalNote: 'Aplikácia botulotoxínu pre horizontálne vrásky čela (Dysport / Alluzience).',
      path: 'M 390,152 C 360,146 325,146 306,150 L 306,252 C 335,255 365,254 390,248 Z',
      striations: [
        'M 376,154 L 376,248',
        'M 360,150 L 360,251',
        'M 344,148 L 344,253',
        'M 328,148 L 328,253',
        'M 314,150 L 314,252'
      ],
      labelPos: { x: 348, y: 198 }
    },
    // 3. M. temporalis (spánkový sval v temporálnej fosse) – ľavý
    {
      id: 'temporalis_left',
      latinName: 'm. temporalis (sin.)',
      slovakName: 'Spánkový sval (ľavý)',
      clinicalNote: 'Hlboká spánková jama; aplikácia kyseliny hyalurónovej / Radiesse na periost.',
      path: 'M 194,168 C 210,164 228,172 234,195 L 226,258 C 214,260 200,248 190,215 C 188,190 190,174 194,168 Z',
      striations: [
        'M 198,172 L 224,256',
        'M 212,170 L 227,256',
        'M 224,178 L 229,256'
      ],
      labelPos: { x: 210, y: 215 }
    },
    // 4. M. temporalis – pravý
    {
      id: 'temporalis_right',
      latinName: 'm. temporalis (dx.)',
      slovakName: 'Spánkový sval (pravý)',
      clinicalNote: 'Hlboká spánková jama; aplikácia kyseliny hyalurónovej / Radiesse na periost.',
      path: 'M 406,168 C 390,164 372,172 366,195 L 374,258 C 386,260 400,248 410,215 C 412,190 410,174 406,168 Z',
      striations: [
        'M 402,172 L 376,256',
        'M 388,170 L 373,256',
        'M 376,178 L 371,256'
      ],
      labelPos: { x: 390, y: 215 }
    },
    // 5. M. procerus (pyramídový sval na glabele)
    {
      id: 'procerus',
      latinName: 'm. procerus',
      slovakName: 'Pyramídový sval nosa',
      clinicalNote: 'Horizontálne vrásky koreňa nosa a glabela (Botulotoxín ~10-15 Speywood U).',
      path: 'M 288,248 L 312,248 L 318,288 L 282,288 Z',
      striations: [
        'M 295,250 L 293,286',
        'M 300,249 L 300,287',
        'M 305,250 L 307,286'
      ],
      labelPos: { x: 300, y: 268 }
    },
    // 6. M. corrugator supercilii – ľavý
    {
      id: 'corrugator_left',
      latinName: 'm. corrugator supercilii (sin.)',
      slovakName: 'Zvrasťovač obočia (ľavý)',
      clinicalNote: 'Vráska hnevu v glabele (Hlboký vpich botulotoxínu 10-15 Speywood U).',
      path: 'M 288,260 C 274,264 254,258 242,248 C 252,242 272,246 288,252 Z',
      striations: [
        'M 282,258 L 252,247',
        'M 276,260 L 256,251',
        'M 268,261 L 260,255'
      ],
      labelPos: { x: 262, y: 242 }
    },
    // 7. M. corrugator supercilii – pravý
    {
      id: 'corrugator_right',
      latinName: 'm. corrugator supercilii (dx.)',
      slovakName: 'Zvrasťovač obočia (pravý)',
      clinicalNote: 'Vráska hnevu v glabele (Hlboký vpich botulotoxínu 10-15 Speywood U).',
      path: 'M 312,260 C 326,264 346,258 358,248 C 348,242 328,246 312,252 Z',
      striations: [
        'M 318,258 L 348,247',
        'M 324,260 L 344,251',
        'M 332,261 L 340,255'
      ],
      labelPos: { x: 338, y: 242 }
    },
    // 8. M. orbicularis oculi (očný kruhový sval) – ľavý
    {
      id: 'orbicularis_oculi_left',
      latinName: 'm. orbicularis oculi (sin.)',
      slovakName: 'Očný kruhový sval (ľavý)',
      clinicalNote: 'Laterálne očné vejáriky / Crow\'s feet (Subkutánna aplikácia Botoxu ~6-10 U).',
      path: 'M 230,274 C 262,274 278,292 278,312 C 278,334 262,352 230,352 C 198,352 182,334 182,312 C 182,292 198,274 230,274 Z M 230,296 C 246,296 256,303 256,312 C 256,322 246,328 230,328 C 214,328 204,322 204,312 C 204,303 214,296 230,296 Z',
      striations: [
        'M 186,312 C 186,330 200,345 230,345',
        'M 190,300 C 196,286 212,280 230,280',
        'M 186,312 C 186,300 190,292 198,285'
      ],
      labelPos: { x: 230, y: 362 }
    },
    // 9. M. orbicularis oculi – pravý
    {
      id: 'orbicularis_oculi_right',
      latinName: 'm. orbicularis oculi (dx.)',
      slovakName: 'Očný kruhový sval (pravý)',
      clinicalNote: 'Laterálne očné vejáriky / Crow\'s feet (Subkutánna aplikácia Botoxu ~6-10 U).',
      path: 'M 370,274 C 402,274 418,292 418,312 C 418,334 402,352 370,352 C 338,352 322,334 322,312 C 322,292 338,274 370,274 Z M 370,296 C 386,296 396,303 396,312 C 396,322 386,328 370,328 C 354,328 344,322 344,312 C 344,303 354,296 370,296 Z',
      striations: [
        'M 414,312 C 414,330 400,345 370,345',
        'M 410,300 C 404,286 388,280 370,280',
        'M 414,312 C 414,300 410,292 402,285'
      ],
      labelPos: { x: 370, y: 362 }
    },
    // 10. M. nasalis (nosový sval – pars transversa)
    {
      id: 'nasalis',
      latinName: 'm. nasalis',
      slovakName: 'Nosový sval (Bunny lines)',
      clinicalNote: 'Bunny lines vrásky na chrbte nosa (Botox 2-4 Speywood U na stranu).',
      path: 'M 284,324 C 295,320 305,320 316,324 L 324,364 C 310,368 290,368 276,364 Z',
      striations: [
        'M 288,332 L 312,332',
        'M 282,344 L 318,344',
        'M 280,356 L 320,356'
      ],
      labelPos: { x: 300, y: 345 }
    },
    // 11. M. levator labii superioris alaeque nasi (LLSAN) – ľavý
    {
      id: 'llsan_left',
      latinName: 'm. levator labii sup. alaeque nasi',
      slovakName: 'Zdvíhač hornej pery a krídla nosa',
      clinicalNote: 'Liečba Gummy smile (ďasnový úsmev – cielený mikro-vpich botulotoxínu).',
      path: 'M 268,328 L 278,328 L 274,405 L 264,405 Z',
      striations: ['M 271,332 L 269,400', 'M 275,332 L 272,400'],
      labelPos: { x: 254, y: 385 }
    },
    // 12. M. levator labii superioris alaeque nasi – pravý
    {
      id: 'llsan_right',
      latinName: 'm. levator labii sup. alaeque nasi',
      slovakName: 'Zdvíhač hornej pery a krídla nosa',
      clinicalNote: 'Liečba Gummy smile (ďasnový úsmev – cielený mikro-vpich botulotoxínu).',
      path: 'M 332,328 L 322,328 L 326,405 L 336,405 Z',
      striations: ['M 329,332 L 331,400', 'M 325,332 L 328,400'],
      labelPos: { x: 346, y: 385 }
    },
    // 13. M. zygomaticus major (veľký jarmový sval) – ľavý
    {
      id: 'zygomaticus_maj_left',
      latinName: 'm. zygomaticus major (sin.)',
      slovakName: 'Veľký jarmový sval (ľavý)',
      clinicalNote: 'Zdvih kútika úst. Pozor pri aplikácii dermálnych výplní lícnej kosti (periost).',
      path: 'M 205,356 L 222,352 L 260,446 L 246,450 Z',
      striations: [
        'M 210,358 L 249,446',
        'M 216,356 L 255,446'
      ],
      labelPos: { x: 222, y: 410 }
    },
    // 14. M. zygomaticus major – pravý
    {
      id: 'zygomaticus_maj_right',
      latinName: 'm. zygomaticus major (dx.)',
      slovakName: 'Veľký jarmový sval (pravý)',
      clinicalNote: 'Zdvih kútika úst. Pozor pri aplikácii dermálnych výplní lícnej kosti (periost).',
      path: 'M 395,356 L 378,352 L 340,446 L 354,450 Z',
      striations: [
        'M 390,358 L 351,446',
        'M 384,356 L 345,446'
      ],
      labelPos: { x: 378, y: 410 }
    },
    // 15. M. orbicularis oris (ústny kruhový sval)
    {
      id: 'orbicularis_oris',
      latinName: 'm. orbicularis oris',
      slovakName: 'Ústny kruhový sval (pery)',
      clinicalNote: 'Periorálne fajčiarske vrásky (Lip Flip botox) a kontúrovanie pier kyselinou hyalurónovou.',
      path: 'M 248,452 C 265,432 335,432 352,452 C 335,476 265,476 248,452 Z M 262,452 C 275,445 325,445 338,452 C 325,462 275,462 262,452 Z',
      striations: [
        'M 252,448 C 275,436 325,436 348,448',
        'M 252,456 C 275,468 325,468 348,456'
      ],
      labelPos: { x: 300, y: 442 }
    },
    // 16. M. masseter (žuvací sval – 100% lícovanie na ramus & angulus mandibulae) – ľavý
    {
      id: 'masseter_left',
      latinName: 'm. masseter (sin.)',
      slovakName: 'Žuvací sval (ľavý)',
      clinicalNote: 'Liečba bruxizmu a zúženie kontúry tváre (Masseter reduction botox 40-60 Speywood U).',
      path: 'M 210,380 L 240,388 L 226,512 L 195,505 C 192,460 198,415 210,380 Z',
      striations: [
        'M 216,384 L 202,506',
        'M 224,386 L 210,508',
        'M 232,388 L 218,510'
      ],
      labelPos: { x: 215, y: 450 }
    },
    // 17. M. masseter – pravý
    {
      id: 'masseter_right',
      latinName: 'm. masseter (dx.)',
      slovakName: 'Žuvací sval (pravý)',
      clinicalNote: 'Liečba bruxizmu a zúženie kontúry tváre (Masseter reduction botox 40-60 Speywood U).',
      path: 'M 390,380 L 360,388 L 374,512 L 405,505 C 408,460 402,415 390,380 Z',
      striations: [
        'M 384,384 L 398,506',
        'M 376,386 L 390,508',
        'M 368,388 L 382,510'
      ],
      labelPos: { x: 385, y: 450 }
    },
    // 18. M. depressor anguli oris (DAO) – ľavý
    {
      id: 'dao_left',
      latinName: 'm. depressor anguli oris (sin.)',
      slovakName: 'Sťahovač kútika úst (ľavý)',
      clinicalNote: 'Zdvih poklesnutých kútikov a marionetové vrásky (Botox ~5-8 Speywood U).',
      path: 'M 252,458 L 266,458 L 260,518 L 240,515 Z',
      striations: [
        'M 254,462 L 244,515',
        'M 260,462 L 252,516',
        'M 264,462 L 258,517'
      ],
      labelPos: { x: 248, y: 490 }
    },
    // 19. M. depressor anguli oris (DAO) – pravý
    {
      id: 'dao_right',
      latinName: 'm. depressor anguli oris (dx.)',
      slovakName: 'Sťahovač kútika úst (pravý)',
      clinicalNote: 'Zdvih poklesnutých kútikov a marionetové vrásky (Botox ~5-8 Speywood U).',
      path: 'M 348,458 L 334,458 L 340,518 L 360,515 Z',
      striations: [
        'M 346,462 L 356,515',
        'M 340,462 L 348,516',
        'M 336,462 L 342,517'
      ],
      labelPos: { x: 352, y: 490 }
    },
    // 20. M. mentalis (bradový sval)
    {
      id: 'mentalis',
      latinName: 'm. mentalis (bilat.)',
      slovakName: 'Bradový sval (jamky na brade)',
      clinicalNote: 'Vyhladenie pomarančovej kože brady / golfový profil (Botox 10-15 Speywood U).',
      path: 'M 282,500 C 294,498 306,498 318,500 C 322,516 320,538 312,544 C 300,546 290,546 288,544 C 280,538 278,516 282,500 Z',
      striations: [
        'M 290,503 L 288,542',
        'M 296,501 L 295,544',
        'M 304,501 L 305,544',
        'M 310,503 L 312,542'
      ],
      labelPos: { x: 300, y: 522 }
    },
    // 21. Platysma (podkožný sval krku)
    {
      id: 'platysma',
      latinName: 'platysma',
      slovakName: 'Podkožný sval krku',
      clinicalNote: 'Nefertiti lift – vyhladenie vertikálnych platysmálnych pruhov a spevnenie kontúry sánky.',
      path: 'M 205,535 C 240,546 360,546 395,535 L 435,710 C 350,735 250,735 165,710 Z',
      striations: [
        'M 220,542 L 195,705',
        'M 245,545 L 235,718',
        'M 275,546 L 275,725',
        'M 300,546 L 300,727',
        'M 325,546 L 325,725',
        'M 355,545 L 365,718',
        'M 380,542 L 405,705'
      ],
      labelPos: { x: 300, y: 625 }
    }
  ];

  // =========================================================================
  // 2. ANATÓMIA SVALOV TVÁRE – BOČNÝ POHĽAD (PROFILE VIEW) – 100% KALIBROVANÁ
  // =========================================================================
  const profileMuscles: MuscleDef[] = [
    // 1. M. temporalis (vejárovitý spánkový sval – profil)
    {
      id: 'prof_temporalis',
      latinName: 'm. temporalis',
      slovakName: 'Spánkový sval',
      clinicalNote: 'Fossa temporalis; vlákna zbiehajúce sa pod jarmový oblúk k processus coronoideus.',
      path: 'M 235,210 C 255,165 315,160 355,190 C 375,220 370,270 345,305 C 320,335 295,365 285,375 C 275,355 260,330 245,295 C 235,260 230,230 235,210 Z',
      striations: [
        'M 265,175 L 285,370',
        'M 295,170 L 286,370',
        'M 325,180 L 288,370',
        'M 355,200 L 290,370',
        'M 360,245 L 292,370'
      ],
      labelPos: { x: 295, y: 235 }
    },
    // 2. M. frontalis (profilové bruško čela)
    {
      id: 'prof_frontalis',
      latinName: 'm. frontalis',
      slovakName: 'Čelový sval (profil)',
      clinicalNote: 'Profilová elevácia čela a obočia.',
      path: 'M 148,165 C 158,160 225,165 235,255 C 205,258 175,260 142,260 C 140,225 142,190 148,165 Z',
      striations: [
        'M 152,175 L 148,255',
        'M 175,170 L 175,255',
        'M 200,170 L 202,255'
      ],
      labelPos: { x: 180, y: 210 }
    },
    // 3. M. orbicularis oculi (periorbitálna zóna z profilu)
    {
      id: 'prof_orbicularis_oculi',
      latinName: 'm. orbicularis oculi',
      slovakName: 'Očný kruhový sval',
      clinicalNote: 'Vejáriky v laterálnom očnom kútiku (Botulotoxín).',
      path: 'M 165,310 C 165,290 180,282 205,282 C 228,282 238,295 238,312 C 238,332 225,340 200,340 C 175,340 165,330 165,310 Z M 178,310 C 178,300 188,296 202,296 C 215,296 222,304 222,312 C 222,320 214,326 200,326 C 186,326 178,318 178,310 Z',
      striations: [
        'M 235,310 C 235,325 220,336 202,336',
        'M 235,310 C 235,296 220,286 202,286'
      ],
      labelPos: { x: 212, y: 348 }
    },
    // 4. M. nasalis & procerus (chrbát a hrot nosa – profil)
    {
      id: 'prof_nasalis',
      latinName: 'm. nasalis & procerus',
      slovakName: 'Nosový a pyramídový sval',
      clinicalNote: 'Bunny lines a glabelárna oblasť z profilu.',
      path: 'M 142,275 C 135,290 124,312 114,332 L 126,358 C 142,360 160,355 168,348 L 158,290 Z',
      striations: [
        'M 134,295 L 158,305',
        'M 122,325 L 158,330',
        'M 118,342 L 158,345'
      ],
      labelPos: { x: 140, y: 320 }
    },
    // 5. M. zygomaticus major (jarmový sval – profil)
    {
      id: 'prof_zygomaticus',
      latinName: 'm. zygomaticus major',
      slovakName: 'Veľký jarmový sval',
      clinicalNote: 'Ťah kútika úst smerom k jarmovému oblúku.',
      path: 'M 235,362 L 255,358 L 195,444 L 180,446 Z',
      striations: [
        'M 240,364 L 184,444',
        'M 248,362 L 190,444'
      ],
      labelPos: { x: 215, y: 405 }
    },
    // 6. M. masseter (žuvací sval – 100% kalibrovaný na ramus sánky z profilu)
    {
      id: 'prof_masseter',
      latinName: 'm. masseter',
      slovakName: 'Žuvací sval (profil)',
      clinicalNote: 'Hlavný cieľ pri zoštíhlení kontúry dolnej tretiny tváre a liečbe bruxizmu.',
      path: 'M 235,375 L 320,378 L 368,495 C 362,510 330,515 285,508 L 255,440 Z',
      striations: [
        'M 250,380 L 272,490',
        'M 272,380 L 302,498',
        'M 292,380 L 332,504',
        'M 312,380 L 358,498'
      ],
      labelPos: { x: 305, y: 445 }
    },
    // 7. M. orbicularis oris (pery z profilu)
    {
      id: 'prof_orbicularis_oris',
      latinName: 'm. orbicularis oris',
      slovakName: 'Ústny kruhový sval',
      clinicalNote: 'Projekcia vermilionu pier (Restylane Kysse).',
      path: 'M 152,425 C 170,418 190,422 195,440 C 190,458 170,462 152,455 C 160,448 160,432 152,425 Z',
      striations: [
        'M 156,432 C 172,426 186,432 188,440',
        'M 156,448 C 172,454 186,448 188,442'
      ],
      labelPos: { x: 175, y: 442 }
    },
    // 8. M. depressor anguli oris (DAO z profilu)
    {
      id: 'prof_dao',
      latinName: 'm. depressor anguli oris',
      slovakName: 'Sťahovač kútika úst',
      clinicalNote: 'Marionetové vrásky a pokles kútikov z profilu.',
      path: 'M 182,448 L 198,446 L 228,498 L 205,496 Z',
      striations: ['M 188,452 L 210,496', 'M 194,450 L 220,497'],
      labelPos: { x: 202, y: 476 }
    },
    // 9. M. mentalis (brada z profilu)
    {
      id: 'prof_mentalis',
      latinName: 'm. mentalis',
      slovakName: 'Bradový sval',
      clinicalNote: 'Projekcia brady a vyrovnanie mentálnej ryhy.',
      path: 'M 175,470 C 195,465 240,470 250,495 C 245,510 215,515 190,505 C 178,495 174,480 175,470 Z',
      striations: ['M 184,476 L 195,502', 'M 200,472 L 215,508', 'M 220,472 L 235,502'],
      labelPos: { x: 210, y: 492 }
    },
    // 10. Platysma (profilový krk a sánka)
    {
      id: 'prof_platysma',
      latinName: 'platysma',
      slovakName: 'Podkožný sval krku (profil)',
      clinicalNote: 'Cervikomentálny uhol a mandibulárna hrana (Nefertiti lift).',
      path: 'M 220,505 C 280,505 340,510 375,515 L 435,710 C 370,725 310,725 255,710 Z',
      striations: [
        'M 245,515 L 275,705',
        'M 285,515 L 320,712',
        'M 325,515 L 365,715',
        'M 365,518 L 405,710'
      ],
      labelPos: { x: 320, y: 610 }
    }
  ];

  const currentMuscles = view === 'front' ? frontMuscles : profileMuscles;

  return (
    <g
      id="facial_muscles_anatomy_layer"
      style={{ opacity, transition: 'opacity 0.25s ease-in-out' }}
      className="select-none"
    >
      <defs>
        {/* Jemný anatomický gradient pre svalovú hmotu */}
        <linearGradient id="muscleRedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#BE123C" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#E11D48" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#9F1239" stopOpacity="0.9" />
        </linearGradient>

        <linearGradient id="muscleHighlightGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#BE123C" stopOpacity="0.95" />
        </linearGradient>

        {/* Jemný tieň pre štítky svalov */}
        <filter id="labelShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Vykreslenie všetkých svalov */}
      {currentMuscles.map((muscle) => {
        const isHovered = hoveredMuscle?.id === muscle.id;

        return (
          <g
            key={muscle.id}
            className="cursor-pointer transition-all duration-150"
            onMouseEnter={() => setHoveredMuscle(muscle)}
            onMouseLeave={() => setHoveredMuscle(null)}
          >
            {/* Svalové bruško (path) */}
            <path
              d={muscle.path}
              fill={isHovered ? 'url(#muscleHighlightGradient)' : 'url(#muscleRedGradient)'}
              stroke={isHovered ? '#FFFFFF' : '#881337'}
              strokeWidth={isHovered ? 1.5 : 0.8}
              strokeLinejoin="round"
              className="transition-all"
            />

            {/* Svalové snopce / vlákna (striations) */}
            {muscle.striations && muscle.striations.map((strPath, idx) => (
              <path
                key={idx}
                d={strPath}
                fill="none"
                stroke={isHovered ? '#FFFFFF' : '#FFE4E6'}
                strokeWidth={isHovered ? 1 : 0.7}
                strokeOpacity={isHovered ? 0.85 : 0.45}
                strokeDasharray="4 2"
                className="pointer-events-none"
              />
            ))}

            {/* Anatomický štítok svalov */}
            {showLabels && muscle.labelPos && (
              <g
                transform={`translate(${muscle.labelPos.x}, ${muscle.labelPos.y})`}
                className="pointer-events-none"
              >
                {/* Podkladový badge pre text */}
                <rect
                  x="-38"
                  y="-8"
                  width="76"
                  height="16"
                  rx="4"
                  fill={isHovered ? '#1F2937' : '#FFFFFF'}
                  fillOpacity={isHovered ? 0.95 : 0.82}
                  stroke={isHovered ? '#F43F5E' : '#E8E2D9'}
                  strokeWidth="0.8"
                  filter="url(#labelShadow)"
                />
                <text
                  x="0"
                  y="3"
                  textAnchor="middle"
                  fontSize="7.5"
                  fontWeight="bold"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fill={isHovered ? '#FFFFFF' : '#881337'}
                  letterSpacing="-0.2px"
                >
                  {muscle.latinName.split('(')[0].trim()}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Popover / Tooltip pri nabehnutí myšou na sval */}
      {hoveredMuscle && (
        <g
          transform="translate(300, 755)"
          className="pointer-events-none animate-in fade-in zoom-in-95 duration-150"
        >
          <rect
            x="-190"
            y="-22"
            width="380"
            height="38"
            rx="12"
            fill="#2C2A29"
            fillOpacity="0.96"
            stroke="#C5A059"
            strokeWidth="1.2"
            filter="url(#labelShadow)"
          />
          <text
            x="0"
            y="-5"
            textAnchor="middle"
            fontSize="10"
            fontWeight="bold"
            fill="#F5E4B8"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            {hoveredMuscle.latinName} · {hoveredMuscle.slovakName}
          </text>
          <text
            x="0"
            y="9"
            textAnchor="middle"
            fontSize="8"
            fill="#E5E7EB"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            {hoveredMuscle.clinicalNote}
          </text>
        </g>
      )}
    </g>
  );
}
