'use client';

import React from 'react';
import { MeicetAnalysisResult } from '@/types/meicet';
import { MeicetClinicalEducationService } from '@/services/meicetClinicalEducationService';

interface MeicetReportPdfDocumentProps {
  report: MeicetAnalysisResult;
  selectedTier?: 'high_end' | 'mid_end';
}

export function MeicetReportPdfDocument({ report, selectedTier }: MeicetReportPdfDocumentProps) {
  const { metrics, anamnesis, clinicalSynthesis, annualSchedule, skincareRoutine, scarProtocol, milestones } = report;

  const clinicalEdu = MeicetClinicalEducationService.getClinicalEducation(report);

  const activeTier = selectedTier || skincareRoutine.selectedTier || 'high_end';
  const routineData = activeTier === 'mid_end' && skincareRoutine.midEnd
    ? skincareRoutine.midEnd
    : (skincareRoutine.highEnd || skincareRoutine);
  const morningProducts = routineData.morning || skincareRoutine.morning;
  const eveningProducts = routineData.evening || skincareRoutine.evening;
  const tierTitle = activeTier === 'mid_end'
    ? 'Mid-End (La Roche-Posay, CeraVe, Vichy)'
    : 'High-End (SkinCeuticals)';

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return new Date().toLocaleDateString('sk-SK');
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('sk-SK');
    } catch {
      return isoStr;
    }
  };

  return (
    <div id="printable-meicet-report" className="w-full bg-white text-[#2C2A29] p-8 max-w-[210mm] mx-auto text-xs font-sans print:p-6 print:m-0 print:w-full print:max-w-none">
      
      {/* HLAVIČKA KLINIKY SAY CLINIC */}
      <div className="border-b-2 border-[#C5A059] pb-4 mb-6 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-widest text-[#2C2A29] font-serif uppercase">SAY CLINIC</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#C5A059] text-[#C5A059] font-bold uppercase tracking-wider">
              Skin Diagnostic & AI Treatment Plan
            </span>
          </div>
          <p className="text-[10px] text-[#8C857B] uppercase tracking-wider mt-0.5">
            Klinika plastickej chirurgie & estetickej dermatológie | Vedúci lekár: MUDr. Ján Mráz
          </p>
          <p className="text-[9px] text-[#8C857B]">
            Lazovná 43, 974 01 Banská Bystrica | +421 905 555 111 | www.sayclinic.sk
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm font-bold text-[#2C2A29] font-serif">MEICET PRO-A 3D ANALÝZA</p>
          <p className="text-[10px] text-[#8C857B]">Dátum skenu: <strong>{formatDate(report.scanDate)}</strong></p>
          <p className="text-[9px] text-[#C5A059] font-semibold">{report.deviceModel}</p>
        </div>
      </div>

      {/* IDENTIFIKÁCIA PACIENTA & ANAMNÉZA */}
      <div className="grid grid-cols-2 gap-4 mb-5 p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9]">
        <div>
          <p className="text-[10px] font-bold uppercase text-[#8C857B]">Pacient</p>
          <p className="text-sm font-bold text-[#2C2A29]">{report.patientName}</p>
          {report.patientBirthNumber && (
            <p className="text-[10px] text-[#8C857B]">Rodné číslo: <strong>{report.patientBirthNumber}</strong></p>
          )}
          <p className="text-[10px] text-[#8C857B]">
            Chronologický vek: <strong>{metrics.actualAge} rokov</strong> | Fototyp: <strong>Fitzpatrick {metrics.fitzpatrickPhototype}</strong>
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-[#8C857B]">Hlavné zameranie pleti</p>
          <p className="text-[10px] text-[#2C2A29]">
            <strong>Hlavné ciele:</strong> {anamnesis.clientConcerns && anamnesis.clientConcerns.length > 0 ? anamnesis.clientConcerns.join(', ') : 'Obnova bariéry, hydratácia a anti-aging'}
          </p>
          <p className="text-[10px] text-[#2C2A29]">
            <strong>Alergie:</strong> {anamnesis.allergies.length > 0 ? anamnesis.allergies.join(', ') : 'Neguje'}
          </p>
        </div>
      </div>

      {/* METRIKY MEICET PRO-A (RADAROVÉ UKAZOVATELE) */}
      <div className="mb-6">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#C5A059] border-b border-[#E8E2D9] pb-1 mb-3 flex items-center justify-between">
          <span>1. Objektívne výsledky 3D spektrálnej analýzy pleti Meicet Pro-A</span>
          <span className="text-[10px] font-normal text-[#8C857B]">
            Skin Score: <strong className="text-emerald-700">{metrics.skinScoreOverall}/100</strong> | Meicet vek pleti: <strong className={metrics.skinAge > metrics.actualAge ? 'text-amber-600' : 'text-emerald-700'}>{metrics.skinAge} r.</strong>
          </span>
        </h4>

        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className="p-2.5 rounded-lg border border-[#E8E2D9] bg-white text-center">
            <span className="text-[9px] uppercase font-bold text-[#8C857B] block">Vek pleti Meicet</span>
            <span className="text-base font-bold text-[#2C2A29]">{metrics.skinAge} rokov</span>
            <span className="text-[9px] text-[#8C857B] block">Skutočný: {metrics.actualAge} r.</span>
          </div>

          <div className="p-2.5 rounded-lg border border-[#E8E2D9] bg-white text-center">
            <span className="text-[9px] uppercase font-bold text-[#8C857B] block">Hydratácia (TEWL)</span>
            <span className="text-base font-bold text-sky-700">{metrics.hydration.score}%</span>
            <span className="text-[9px] text-[#8C857B] block">{metrics.hydration.status}</span>
          </div>

          <div className="p-2.5 rounded-lg border border-[#E8E2D9] bg-white text-center">
            <span className="text-[9px] uppercase font-bold text-[#8C857B] block">UV Fotopoškodenie</span>
            <span className="text-base font-bold text-purple-700">{metrics.uvDamage.score}%</span>
            <span className="text-[9px] text-[#8C857B] block">Riziko: {metrics.uvDamage.hiddenSpotsRisk}</span>
          </div>

          <div className="p-2.5 rounded-lg border border-[#E8E2D9] bg-white text-center">
            <span className="text-[9px] uppercase font-bold text-[#8C857B] block">Cievna reaktivita</span>
            <span className="text-base font-bold text-rose-700">{metrics.redAreas.score}%</span>
            <span className="text-[9px] text-[#8C857B] block">{metrics.redAreas.erythemaLevel}</span>
          </div>
        </div>

        {/* PODROBNÁ TABUĽKA PARAMETROV */}
        <table className="w-full text-left border-collapse border border-[#E8E2D9] text-[10px]">
          <thead>
            <tr className="bg-[#FAF8F5] text-[#8C857B] uppercase font-bold">
              <th className="p-1.5 border border-[#E8E2D9]">Parameter</th>
              <th className="p-1.5 border border-[#E8E2D9] text-center">Skóre</th>
              <th className="p-1.5 border border-[#E8E2D9]">Nález prístroja Meicet</th>
              <th className="p-1.5 border border-[#E8E2D9]">Klinický význam pre liečbu</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-1.5 border border-[#E8E2D9] font-bold text-[#2C2A29]">Hydratácia pleti</td>
              <td className="p-1.5 border border-[#E8E2D9] text-center font-bold text-sky-700">{metrics.hydration.score}%</td>
              <td className="p-1.5 border border-[#E8E2D9]">{metrics.hydration.description}</td>
              <td className="p-1.5 border border-[#E8E2D9]">{metrics.hydration.clinicalSignificance}</td>
            </tr>
            <tr>
              <td className="p-1.5 border border-[#E8E2D9] font-bold text-[#2C2A29]">Póry & Infundíbulá</td>
              <td className="p-1.5 border border-[#E8E2D9] text-center font-bold">{metrics.pores.score}%</td>
              <td className="p-1.5 border border-[#E8E2D9]">{metrics.pores.description}</td>
              <td className="p-1.5 border border-[#E8E2D9]">{metrics.pores.clinicalSignificance}</td>
            </tr>
            <tr>
              <td className="p-1.5 border border-[#E8E2D9] font-bold text-[#2C2A29]">Vrásky & Mimika</td>
              <td className="p-1.5 border border-[#E8E2D9] text-center font-bold">{metrics.wrinkles.score}%</td>
              <td className="p-1.5 border border-[#E8E2D9]">{metrics.wrinkles.description}</td>
              <td className="p-1.5 border border-[#E8E2D9]">{metrics.wrinkles.clinicalSignificance}</td>
            </tr>
            <tr>
              <td className="p-1.5 border border-[#E8E2D9] font-bold text-[#2C2A29]">UV Skryté pigmenty</td>
              <td className="p-1.5 border border-[#E8E2D9] text-center font-bold text-purple-700">{metrics.uvDamage.score}%</td>
              <td className="p-1.5 border border-[#E8E2D9]">{metrics.uvDamage.description}</td>
              <td className="p-1.5 border border-[#E8E2D9]">{metrics.uvDamage.clinicalSignificance}</td>
            </tr>
            <tr>
              <td className="p-1.5 border border-[#E8E2D9] font-bold text-[#2C2A29]">Cievny erytém / citlivosť</td>
              <td className="p-1.5 border border-[#E8E2D9] text-center font-bold text-rose-700">{metrics.redAreas.score}%</td>
              <td className="p-1.5 border border-[#E8E2D9]">{metrics.redAreas.description}</td>
              <td className="p-1.5 border border-[#E8E2D9]">{metrics.redAreas.clinicalSignificance}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* KLINICKÁ SYNTÉZA & ZHODNOTENIE */}
      <div className="mb-5 p-3 rounded-xl bg-[#FAF8F5] border border-[#C5A059]/40">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#C5A059] mb-1">
          Lekárske zhodnotenie stavu pleti (Meicet Pro-A AI Syntéza)
        </h4>
        <p className="text-[10px] text-[#2C2A29] leading-relaxed">
          {clinicalSynthesis.summary}
        </p>
      </div>

      {/* 🔬 KLINICKÁ DIAGNÓZA, CIELE A MECHANIZMUS ÚČINKU LIEČIVÝCH LÁTOK (EBM PROTOKOL) */}
      <div className="mb-5 p-3 rounded-xl bg-white border border-[#C5A059]/50 print-avoid-break">
        <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-1 mb-2">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059]">
            🔬 Klinická diagnóza, terapeutické ciele & mechanizmus účinku liečby
          </h4>
          <span className="text-[8px] font-mono text-[#8C857B] bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#E8E2D9]">
            EBM Protokol SAY CLINIC
          </span>
        </div>

        {/* 1. Nálezy */}
        <div className="mb-2">
          <span className="text-[9px] font-bold text-[#8C6D2D] uppercase block mb-1">
            1. Patofyziologický nález (Čo sa deje s vašou pleťou):
          </span>
          <div className="grid grid-cols-2 gap-2">
            {clinicalEdu.pathophysiology.issues.map(iss => (
              <div key={iss.id} className="p-1.5 rounded bg-[#FAF8F5] border border-[#E8E2D9] text-[8.5px]">
                <strong className="text-[#2C2A29] block font-serif">{iss.name}</strong>
                <p className="text-[#5A524C] mt-0.5">{iss.finding}</p>
                <p className="text-[8px] text-[#8C6D2D] italic mt-0.5">{iss.biologicalMechanism}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Terapeutické ciele */}
        <div className="mb-2">
          <span className="text-[9px] font-bold text-[#8C6D2D] uppercase block mb-1">
            2. Terapeutická stratégia (Postupnosť liečebných fáz):
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            {clinicalEdu.therapeuticStrategy.phases.map((ph, idx) => (
              <div key={idx} className="p-1.5 rounded bg-blue-50/50 border border-blue-200/50 text-[8px]">
                <span className="font-bold text-blue-950 block">{ph.phase}</span>
                <strong className="text-blue-900 block font-serif">{ph.title}</strong>
                <p className="text-blue-900/90 mt-0.5">{ph.objective}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Kľúčové molekuly */}
        <div>
          <span className="text-[9px] font-bold text-[#8C6D2D] uppercase block mb-1">
            3. Kľúčové účinné látky a ich bunkový mechanizmus:
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {clinicalEdu.activeIngredientsMatrix.slice(0, 4).map(item => (
              <div key={item.id} className="p-1.5 rounded bg-[#FAF8F5] border border-[#E8E2D9] text-[8px]">
                <div className="flex justify-between items-start font-bold">
                  <span className="text-[#2C2A29] font-serif">{item.ingredient}</span>
                  {item.concentration && <span className="text-[7.5px] font-mono text-[#8C6D2D] bg-white px-1 rounded border border-[#E8DFC9]">{item.concentration}</span>}
                </div>
                <p className="text-[#5A524C] mt-0.5"><span className="font-semibold text-[#8C6D2D]">Bunkový účinok:</span> {item.biologicalAction}</p>
                <p className="text-emerald-800 font-medium mt-0.5">✓ {item.clinicalBenefit}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DENNÁ SKINCARE RUTINA */}
      <div className="mb-6 print-avoid-break">
        <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-1 mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#C5A059]">
            2. Personalizovaná domáca dermokozmetická rutina — {tierTitle}
          </h4>
          <span className="text-[9px] font-bold text-[#8C857B] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#E8E2D9]">
            {(routineData as any)?.totalEstimatedPrice ? `Sada z cenníka: ${(routineData as any).totalEstimatedPrice} €` : 'Z nášho cenníka'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-[11px] font-bold text-amber-800 block mb-1.5 uppercase tracking-wide">☀️ Ranná rutina</span>
            <div className="space-y-2">
              {morningProducts.map(item => (
                <div key={item.step} className={`p-2 rounded border text-[10px] ${item.alreadyOwned ? 'bg-emerald-50/50 border-emerald-300' : 'bg-[#FAF8F5] border-[#E8E2D9]'}`}>
                  <div className="flex justify-between items-start font-bold">
                    <span className="text-[#2C2A29]">{item.step}. {item.category}</span>
                    <div className="text-right shrink-0 ml-1">
                      <span className="text-[#C5A059] text-[9px]">{item.brand}</span>
                      {item.alreadyOwned ? (
                        <span className="text-[8px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 ml-1">
                          🏠 Už má doma (0 €)
                        </span>
                      ) : (
                        item.price ? <span className="text-[9px] font-bold text-[#2C2A29] ml-1">({item.price} €)</span> : null
                      )}
                    </div>
                  </div>
                  <p className="text-[#2C2A29] font-bold mt-0.5">{item.productName}</p>
                  <p className="text-[9px] text-[#8C6D2D] font-medium mt-1">
                    🧪 <span className="font-bold">Účinná látka:</span> {item.keyActiveIngredient || item.activeIngredients}
                  </p>
                  {(item.whyItMatters || item.meicetJustification) && (
                    <p className="text-[8.5px] text-[#554a3a] mt-1 bg-amber-50/80 p-1 rounded border border-amber-200/60 leading-tight">
                      💡 <span className="font-bold text-amber-900">Prečo:</span> {item.whyItMatters || item.meicetJustification}
                    </p>
                  )}
                  <p className="text-[9px] text-[#2C2A29] mt-1">
                    ⏱️ <span className="font-bold text-slate-800">Aplikácia:</span> {item.frequencySchedule || item.usage}
                  </p>
                  {item.titrationNotes && (
                    <p className="text-[8.5px] text-indigo-950 mt-1 bg-indigo-50/80 p-1 rounded border border-indigo-200/60 leading-tight">
                      ⚠️ <span className="font-bold text-indigo-900">Titrácia:</span> {item.titrationNotes}
                    </p>
                  )}
                  {item.isExternal && (
                    <p className="text-[8px] italic text-stone-500 mt-1">
                      🌐 {item.externalProviderNote || (item.prescriptionOnly ? 'Liek viazaný na lekársky predpis (Rp.)' : 'Zakúpiť v lekárni / drogérii')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold text-indigo-900 block mb-1.5 uppercase tracking-wide">🌙 Večerná rutina</span>
            <div className="space-y-2">
              {eveningProducts.map(item => (
                <div key={item.step} className={`p-2 rounded border text-[10px] ${item.alreadyOwned ? 'bg-emerald-50/50 border-emerald-300' : 'bg-[#FAF8F5] border-[#E8E2D9]'}`}>
                  <div className="flex justify-between items-start font-bold">
                    <span className="text-[#2C2A29]">{item.step}. {item.category}</span>
                    <div className="text-right shrink-0 ml-1">
                      <span className="text-[#C5A059] text-[9px]">{item.brand}</span>
                      {item.alreadyOwned ? (
                        <span className="text-[8px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 ml-1">
                          🏠 Už má doma (0 €)
                        </span>
                      ) : (
                        item.price ? <span className="text-[9px] font-bold text-[#2C2A29] ml-1">({item.price} €)</span> : null
                      )}
                    </div>
                  </div>
                  <p className="text-[#2C2A29] font-bold mt-0.5">{item.productName}</p>
                  <p className="text-[9px] text-[#8C6D2D] font-medium mt-1">
                    🧪 <span className="font-bold">Účinná látka:</span> {item.keyActiveIngredient || item.activeIngredients}
                  </p>
                  {(item.whyItMatters || item.meicetJustification) && (
                    <p className="text-[8.5px] text-[#554a3a] mt-1 bg-amber-50/80 p-1 rounded border border-amber-200/60 leading-tight">
                      💡 <span className="font-bold text-amber-900">Prečo:</span> {item.whyItMatters || item.meicetJustification}
                    </p>
                  )}
                  <p className="text-[9px] text-[#2C2A29] mt-1">
                    ⏱️ <span className="font-bold text-slate-800">Aplikácia:</span> {item.frequencySchedule || item.usage}
                  </p>
                  {item.titrationNotes && (
                    <p className="text-[8.5px] text-indigo-950 mt-1 bg-indigo-50/80 p-1 rounded border border-indigo-200/60 leading-tight">
                      ⚠️ <span className="font-bold text-indigo-900">Titrácia:</span> {item.titrationNotes}
                    </p>
                  )}
                  {item.isExternal && (
                    <p className="text-[8px] italic text-stone-500 mt-1">
                      🌐 {item.externalProviderNote || (item.prescriptionOnly ? 'Liek viazaný na lekársky predpis (Rp.)' : 'Zakúpiť v lekárni / drogérii')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-[9px] text-[#8C857B] italic mt-2 border-t border-gray-100 pt-1">
          * V cenníku kliniky SAY CLINIC sú k dispozícii obe línie: Basic (La Roche-Posay, CeraVe, Vichy) aj Premium (SkinCeuticals).
        </p>
      </div>

      {/* ROČNÝ PLÁN OŠETRENÍ NA 12 MESIACOV */}
      <div className="mb-6 print-avoid-break">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#C5A059] border-b border-[#E8E2D9] pb-1 mb-3">
          3. Ročný plán pleťových procedúr SAY CLINIC (Sezónny 12-mesačný harmonogram)
        </h4>

        <div className="space-y-3">
          {annualSchedule.map((season, idx) => (
            <div key={idx} className="border border-[#E8E2D9] rounded-lg p-2.5 bg-white">
              <div className="flex justify-between items-center mb-1 border-b border-gray-100 pb-1">
                <span className="font-bold text-[#2C2A29] text-[11px]">{season.quarter}: {season.title}</span>
                <span className="text-[9px] uppercase font-bold text-[#C5A059]">{season.season}</span>
              </div>
              <p className="text-[9px] text-[#8C857B] italic mb-2">
                Poznámka: {season.seasonalConsideration}
              </p>
              <div className="space-y-1">
                {season.treatments.map((t, tIdx) => (
                  <div key={tIdx} className="flex justify-between items-center text-[10px] py-1 px-1.5 rounded bg-[#FAF8F5]">
                    <div>
                      <strong className="text-[#2C2A29]">{t.name}</strong> ({t.seasonOrMonth}) - <span className="text-[#8C857B]">{t.targetArea}</span>
                      <p className="text-[9px] text-[#8C857B]">{t.reasoning}</p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-white border border-[#E8E2D9]">
                        {t.priority}
                      </span>
                      {t.estimatedPrice ? (
                        <span className="text-[10px] font-bold block text-[#2C2A29]">{t.estimatedPrice} €</span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LEKÁRSKA DOLOŽKA & PEČIATKA */}
      <div className="mt-8 pt-4 border-t-2 border-[#E8E2D9] flex justify-between items-end print-avoid-break">
        <div className="text-[9px] text-[#8C857B] max-w-sm">
          <p>Tento plán bol vytvorený certifikovaným diagnostickým systémom Meicet Pro-A a validovaný lekárom SAY CLINIC.</p>
          <p className="mt-0.5">Vytvorené v informačnom systéme SAY CLINIC OS dňa {formatDate(report.createdAt)}.</p>
        </div>

        <div className="text-right">
          <div className="w-48 border-b border-[#2C2A29] pb-8 text-center text-[10px] text-[#8C857B]">
            Pečiatka a podpis lekára
          </div>
          <p className="text-xs font-bold text-[#2C2A29] mt-1 font-serif">{report.doctorName}</p>
          <p className="text-[9px] text-[#8C857B]">Vedúci lekár SAY CLINIC</p>
        </div>
      </div>

    </div>
  );
}
