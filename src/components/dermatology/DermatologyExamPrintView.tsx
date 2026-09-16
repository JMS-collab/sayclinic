'use client';

import React from 'react';
import { DermatologyExamData, FITZPATRICK_DATA } from './dermatologyTypes';

interface DermatologyExamPrintViewProps {
  data: DermatologyExamData;
}

export default function DermatologyExamPrintView({
  data
}: DermatologyExamPrintViewProps) {
  const fitzInfo = FITZPATRICK_DATA[data.fitzpatrick];

  return (
    <div className="space-y-6 text-[#2C2A29]">
      {/* 1. DIAGNOSTICKÝ BLOK MKCH-10 S PODPOROU PRE VIACERÉ DIAGNÓZY */}
      <div className="border border-[#E8E2D9] rounded-xl p-3.5 bg-[#FBF9F6]">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[9px] uppercase font-bold text-[#C5A059] tracking-wider">
            Diagnostický záver (Klasifikácia MKCH-10)
          </span>
          <span className="text-[8px] text-[#8C857B] font-mono">
            {1 + data.secondaryDiagnoses.length} {1 + data.secondaryDiagnoses.length === 1 ? 'diagnóza' : 'diagnózy'}
          </span>
        </div>

        {/* HLAVNÁ DIAGNÓZA */}
        <div className="flex items-start gap-2.5 pb-2 border-b border-[#E8E2D9]/70">
          <span className="bg-[#2C2A29] text-[#C5A059] font-mono font-bold px-2 py-0.5 rounded text-[10px] shrink-0 mt-0.5">
            {data.primaryDiagnosis.code || 'Z01.8'}
          </span>
          <div>
            <span className="text-[9px] text-[#8C857B] uppercase font-bold mr-1.5">Hlavná diagnóza:</span>
            <span className="text-xs font-bold text-[#2C2A29]">
              {data.primaryDiagnosis.name || 'Preventívne dermatoskopické vyšetrenie'}
            </span>
          </div>
        </div>

        {/* VEDĽAJŠIE DIAGNÓZY */}
        {data.secondaryDiagnoses.length > 0 && (
          <div className="pt-2">
            <span className="text-[8px] text-[#8C857B] uppercase font-bold block mb-1.5">
              Vedľajšie a sprievodné diagnózy:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {data.secondaryDiagnoses.map((sec, idx) => (
                <div key={sec.id || idx} className="flex items-center gap-2 bg-white px-2 py-1 rounded border border-[#E8E2D9] text-[10px]">
                  <span className="font-mono font-bold text-[#C5A059] shrink-0">
                    {sec.code}
                  </span>
                  <span className="text-[#2C2A29] truncate" title={sec.name}>
                    {sec.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. FITZPATRICK FOTOTYP & ANAMNÉZA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* FITZPATRICK BOX */}
        <div className="border border-[#C5A059]/40 rounded-xl p-3 bg-[#FBF9F6] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase font-bold text-[#C5A059] tracking-wider">
              Fototyp (Fitzpatrick)
            </span>
            <div 
              className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-2xs" 
              style={{ backgroundColor: fitzInfo.colorSwatch }}
            />
          </div>
          <p className="text-xs font-bold text-[#2C2A29]">
            {fitzInfo.label} – {fitzInfo.name}
          </p>
          <p className="text-[9px] text-[#8C857B] leading-tight">
            {fitzInfo.sunReaction}
          </p>
          <div className="pt-1 border-t border-[#E8E2D9] text-[9px]">
            <span className="text-[#8C857B]">Rizikový profil: </span>
            <span className="font-bold text-rose-700">{fitzInfo.cancerRisk}</span>
          </div>
        </div>

        {/* DERMATOLOGICKÁ & SOLÁRNA ANAMNÉZA */}
        <div className="md:col-span-2 border border-[#E8E2D9] rounded-xl p-3 bg-[#FBF9F6] text-[10px] space-y-1.5">
          <p className="text-[9px] uppercase font-bold text-[#C5A059] tracking-wider border-b border-[#E8E2D9] pb-1">
            Anamnestické údaje
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
            <div>
              <strong className="text-[#8C857B] uppercase text-[8px] block">OA dermatologická:</strong>
              <span className="text-[#2C2A29]">{data.dermatologicOA || 'Bez údajov'}</span>
            </div>
            <div>
              <strong className="text-[#8C857B] uppercase text-[8px] block">Rodinná anamnéza (melanóm):</strong>
              <span className="text-[#2C2A29]">{data.familyMelanoma || 'Negatívna'}</span>
            </div>
            <div>
              <strong className="text-[#8C857B] uppercase text-[8px] block">Slnečná expozícia & soláriá:</strong>
              <span className="text-[#2C2A29]">{data.sunExposure || 'Bežná expozícia'}</span>
            </div>
            <div>
              <strong className="text-[#8C857B] uppercase text-[8px] block">Fotoprotekcia (SPF):</strong>
              <span className="text-[#2C2A29]">{data.sunProtection || 'Neuvedená'}</span>
            </div>
          </div>

          {(data.allergies || data.medication || data.cave) && (
            <div className="pt-1 border-t border-[#E8E2D9] grid grid-cols-2 gap-2 text-[9px]">
              <div><strong className="text-[#8C857B]">AA:</strong> {data.allergies || 'neudáva'}</div>
              <div><strong className="text-[#8C857B]">FA:</strong> {data.medication || 'bez trvalej liečby'}</div>
            </div>
          )}

          {data.cave && (
            <div className="p-1.5 bg-rose-50 border border-rose-200 rounded text-rose-800 text-[9px] font-bold">
              CAVE: {data.cave}
            </div>
          )}
        </div>
      </div>

      {/* 3. STATUS DERMATOLOGICUS (CELKOVÝ STAV KOŽE A ADNEX) */}
      <div className="border border-[#E8E2D9] rounded-xl p-3.5 bg-white space-y-2.5">
        <p className="text-[9px] uppercase font-bold text-[#C5A059] tracking-wider border-b border-[#E8E2D9] pb-1">
          Status Dermatologicus Localis & Generalis
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] bg-[#FBF9F6] p-2 rounded-lg border border-[#E8E2D9]/70">
          <div>
            <span className="block text-[8px] text-[#8C857B] uppercase font-bold">Hydratácia</span>
            <span className="font-medium text-[#2C2A29]">{data.skinHydration}</span>
          </div>
          <div>
            <span className="block text-[8px] text-[#8C857B] uppercase font-bold">Turgor</span>
            <span className="font-medium text-[#2C2A29]">{data.skinTurgor}</span>
          </div>
          <div>
            <span className="block text-[8px] text-[#8C857B] uppercase font-bold">Fotostarnutie</span>
            <span className="font-medium text-[#2C2A29]">{data.skinPhotodamage}</span>
          </div>
          <div>
            <span className="block text-[8px] text-[#8C857B] uppercase font-bold">Rozsah vyšetrenia</span>
            <span className="font-medium text-[#2C2A29]">{data.skinDistribution}</span>
          </div>
        </div>

        <div>
          <strong className="text-[#8C857B] uppercase text-[8px] block mb-0.5">Morfologický popis eflorescencií:</strong>
          <p className="text-xs leading-relaxed text-[#2C2A29] whitespace-pre-line bg-[#FBF9F6] p-2.5 rounded-lg border border-[#E8E2D9]/50">
            {data.morphologyDescription || 'Kožný kryt intaktný, primeraného sfarbenia a turgoru, bez akútneho zápalového exantému.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[10px]">
          <div><strong className="text-[#8C857B] uppercase text-[8px]">Kapilícium / Vlasy:</strong> <p className="text-[#2C2A29]">{data.hairScalp || 'b.n.o.'}</p></div>
          <div><strong className="text-[#8C857B] uppercase text-[8px]">Nechty & Lôžka:</strong> <p className="text-[#2C2A29]">{data.nails || 'b.n.o.'}</p></div>
          <div><strong className="text-[#8C857B] uppercase text-[8px]">Sliznice viditeľné:</strong> <p className="text-[#2C2A29]">{data.mucosae || 'b.n.o.'}</p></div>
        </div>
      </div>

      {/* 4. DERMATOSKOPICKÉ VYŠETRENIE & ABCDE TABUĽKA LÉZIÍ */}
      <div className="border border-[#E8E2D9] rounded-xl p-3.5 bg-white space-y-3">
        <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-1.5">
          <p className="text-[9px] uppercase font-bold text-[#C5A059] tracking-wider">
            Dermatoskopický nález & Digitálna fotodermatoskopia
          </p>
          <span className="text-[9px] font-bold text-[#2C2A29] bg-[#FBF9F6] px-2 py-0.5 rounded border border-[#E8E2D9]">
            Celkový počet névov: {data.neviCountCategory}
          </span>
        </div>

        <p className="text-xs leading-relaxed text-[#2C2A29] whitespace-pre-line">
          {data.dermoscopySummary || 'Pri dermatoskopickom vyšetrení zistené benígne melanocytové névy s typickou retikulárnou alebo globulárnou sieťou.'}
        </p>

        {/* TABUĽKA SAMOSTATNE SLEDOVANÝCH LÉZIÍ */}
        {data.examinedLesions.length > 0 && (
          <div className="pt-2">
            <span className="text-[8px] text-[#8C857B] uppercase font-bold block mb-1.5">
              Protokol podrobne vyšetrených lézií (Kritériá ABCDE):
            </span>
            <div className="border border-[#E8E2D9] rounded-xl overflow-hidden text-[10px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#2C2A29] text-white text-[9px] uppercase tracking-wider">
                    <th className="p-2 font-bold w-6 text-center">#</th>
                    <th className="p-2 font-bold">Lokalizácia</th>
                    <th className="p-2 font-bold">Rozmer</th>
                    <th className="p-2 font-bold">ABCDE kritériá</th>
                    <th className="p-2 font-bold">Dermatoskopický záver</th>
                    <th className="p-2 font-bold">Manažment / Odporúčanie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D9]">
                  {data.examinedLesions.map((lesion, i) => (
                    <tr key={lesion.id || i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FBF9F6]'}>
                      <td className="p-2 text-center font-bold text-[#C5A059]">{i + 1}</td>
                      <td className="p-2 font-bold text-[#2C2A29]">{lesion.location}</td>
                      <td className="p-2 font-mono whitespace-nowrap">{lesion.sizeMm || '---'}</td>
                      <td className="p-2 text-[9px] leading-tight">
                        <div><strong className="text-[#8C857B]">A:</strong> {lesion.asymmetry}</div>
                        <div><strong className="text-[#8C857B]">B:</strong> {lesion.borders}</div>
                        <div><strong className="text-[#8C857B]">C:</strong> {lesion.color}</div>
                        <div><strong className="text-[#8C857B]">E:</strong> {lesion.evolution}</div>
                        {lesion.dermoscopyFeatures.length > 0 && (
                          <div className="mt-1 text-[#C5A059] font-medium">
                            {lesion.dermoscopyFeatures.join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="p-2 font-bold text-[#2C2A29] text-[10px]">
                        {lesion.conclusion}
                      </td>
                      <td className="p-2 text-[10px]">
                        <span className={`inline-block px-1.5 py-0.5 rounded font-medium ${
                          lesion.recommendation.includes('excízia') 
                            ? 'bg-rose-100 text-rose-800 font-bold border border-rose-200' 
                            : 'bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20'
                        }`}>
                          {lesion.recommendation}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 5. TERAPEUTICKÝ PLÁN, ODPORÚČANIA A ORDINÁCIA */}
      <div className="border border-[#E8E2D9] rounded-xl p-3.5 bg-[#FBF9F6] space-y-3">
        <p className="text-[9px] uppercase font-bold text-[#C5A059] tracking-wider border-b border-[#E8E2D9] pb-1">
          Terapeutický plán, Ordinácie & Domáca starostlivosť
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs leading-relaxed">
          <div>
            <strong className="text-[#8C857B] uppercase text-[8px] block mb-1">
              1. Lokálna dermatologická terapia:
            </strong>
            <p className="bg-white p-2.5 rounded-lg border border-[#E8E2D9] text-[#2C2A29]">
              {data.localTherapy || 'Lokálna terapia nie je t.č. indikovaná.'}
            </p>
          </div>

          <div>
            <strong className="text-[#8C857B] uppercase text-[8px] block mb-1">
              2. Systémová farmakoterapia:
            </strong>
            <p className="bg-white p-2.5 rounded-lg border border-[#E8E2D9] text-[#2C2A29]">
              {data.systemicTherapy || 'Bez indikácie systémovej farmakoterapie.'}
            </p>
          </div>

          <div>
            <strong className="text-[#8C857B] uppercase text-[8px] block mb-1">
              3. Domáca dermokozmetická starostlivosť:
            </strong>
            <p className="bg-white p-2.5 rounded-lg border border-[#E8E2D9] text-[#2C2A29]">
              {data.dermocosmetics || 'Širokospektrálny fotoprotektívny krém SPF 50+, bariérová regenerácia.'}
            </p>
          </div>

          <div>
            <strong className="text-[#8C857B] uppercase text-[8px] block mb-1">
              4. Režimové opatrenia & Poučenie o UV a ABCDE:
            </strong>
            <p className="bg-white p-2.5 rounded-lg border border-[#E8E2D9] text-[#2C2A29]">
              {data.regimeRecommendations || 'Striktná fotoprotekcia, zákaz solária, samovyšetrovanie pravidlom ABCDE.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E8E2D9] text-xs">
          <div>
            <strong className="text-[#8C857B] uppercase text-[8px] block">Vykonané ambulantné výkony:</strong>
            <p className="font-semibold text-[#2C2A29] mt-0.5">{data.performedProcedures || 'Dermatoskopia celého tela'}</p>
          </div>
          <div>
            <strong className="text-[#C5A059] uppercase text-[8px] font-bold block">Plánovaná kontrola:</strong>
            <p className="font-bold text-[#2C2A29] mt-0.5">{data.nextCheckup || 'O 12 mesiacov'}</p>
          </div>
        </div>
      </div>

      {/* 6. POUČENIE PACIENTA */}
      <div className="text-[8px] text-[#8C857B] space-y-1.5 border-t border-[#E8E2D9] pt-3 leading-tight text-justify">
        <p>
          <strong>Poučenie pacienta:</strong> Pacient/ka bol/a podrobne informovaný/á o náleze na koži, povahe vyšetrených pigmentových a kožných prejavov, dôležitosti celoročnej fotoprotekcie (SPF 50+) a zásadách bezpečného pobytu na slnku. Bol/a poučený/á o domácom samovyšetrovaní kože podľa medzinárodného pravidla ABCDE. V prípade vzniku nového pigmentového prejavu, jeho zväčšovania, zmeny farby, krvácania, svrbenia či asymetrie je pacient povinný bezodkladne vyhľadať odborné dermatologické vyšetrenie aj pred plánovaným termínom kontroly.
        </p>
        <p>
          Zdravotná dokumentácia je vedená v zmysle zákona č. 576/2004 Z. z. o zdravotnej starostlivosti.
        </p>
      </div>
    </div>
  );
}
