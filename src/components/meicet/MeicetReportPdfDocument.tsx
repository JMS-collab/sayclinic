'use client';

import React from 'react';
import { MeicetAnalysisResult } from '@/types/meicet';

interface MeicetReportPdfDocumentProps {
  report: MeicetAnalysisResult;
}

export function MeicetReportPdfDocument({ report }: MeicetReportPdfDocumentProps) {
  const { metrics, anamnesis, clinicalSynthesis, annualSchedule, skincareRoutine, scarProtocol, milestones } = report;

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
          <p className="text-[10px] font-bold uppercase text-[#8C857B]">Anamnestické zhrnutie</p>
          <p className="text-[10px] text-[#2C2A29]">
            <strong>Operácie:</strong> {anamnesis.pastSurgeries.length > 0 ? anamnesis.pastSurgeries.join(', ') : 'Bez predchádzajúcich operácií'}
          </p>
          <p className="text-[10px] text-[#2C2A29]">
            <strong>Alergie:</strong> {anamnesis.allergies.length > 0 ? anamnesis.allergies.join(', ') : 'Neguje'}
          </p>
          {anamnesis.scarHistory.length > 0 && (
            <p className="text-[10px] text-[#DC2626] font-semibold">
              <strong>Jazva:</strong> {anamnesis.scarHistory.map(s => `${s.location} (${s.appearance})`).join('; ')}
            </p>
          )}
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
          2. Lekárske posúdenie synergie Meicet nálezu a anamnézy pacienta
        </h4>
        <p className="text-[10px] text-[#2C2A29] leading-relaxed mb-2">
          {clinicalSynthesis.summary}
        </p>
        {clinicalSynthesis.synergyWithSurgeries && (
          <p className="text-[10px] text-amber-900 bg-amber-50 p-2 rounded border border-amber-200">
            <strong>Chirurgický kontext:</strong> {clinicalSynthesis.synergyWithSurgeries}
          </p>
        )}
      </div>

      {/* ROČNÝ PLÁN OŠETRENÍ NA 12 MESIACOV */}
      <div className="mb-6 print-avoid-break">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#C5A059] border-b border-[#E8E2D9] pb-1 mb-3">
          3. Ročný plán ošetrení SAY CLINIC (Sezónny 12-mesačný harmonogram)
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

      {/* PROTOKOL STAROSTLIVOSTI O JAZVY */}
      {scarProtocol.hasScars && (
        <div className="mb-6 p-3.5 rounded-xl border border-red-200 bg-red-50/30 print-avoid-break">
          <h4 className="text-xs font-bold uppercase tracking-wider text-red-800 mb-1 flex items-center justify-between">
            <span>4. Protokol starostlivosti o jazvy (SAY CLINIC Scar Care Protocol)</span>
            <span className="text-[9px] bg-red-100 text-red-800 px-2 py-0.5 rounded font-bold uppercase">Prioritná starostlivosť</span>
          </h4>
          <p className="text-[10px] text-[#2C2A29] mb-2">{scarProtocol.scarSummary}</p>

          <div className="grid grid-cols-3 gap-2 text-[10px] mb-2">
            <div className="p-2 bg-white rounded border border-red-100">
              <strong className="block text-red-900 mb-0.5">1. Silikónová liečba</strong>
              <p className="text-[9px] text-[#2C2A29]">{scarProtocol.dailyRoutine.siliconeTherapy}</p>
            </div>
            <div className="p-2 bg-white rounded border border-red-100">
              <strong className="block text-red-900 mb-0.5">2. Tlaková masáž</strong>
              <p className="text-[9px] text-[#2C2A29]">{scarProtocol.dailyRoutine.pressureMassage}</p>
            </div>
            <div className="p-2 bg-white rounded border border-red-100">
              <strong className="block text-red-900 mb-0.5">3. UV Fotoprotekcia</strong>
              <p className="text-[9px] text-[#2C2A29]">{scarProtocol.dailyRoutine.sunProtection}</p>
            </div>
          </div>

          <div className="text-[9px] text-[#8C857B]">
            <strong>Klinická terapia na SAY CLINIC:</strong> {scarProtocol.clinicalLaserTherapy.recommendedProcedures.join(' | ')}
          </div>
        </div>
      )}

      {/* DENNÁ SKINCARE RUTINA */}
      <div className="mb-6 print-avoid-break">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#C5A059] border-b border-[#E8E2D9] pb-1 mb-3">
          5. Personalizovaná domáca dermokozmetická rutina (Ráno & Večer)
        </h4>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-[11px] font-bold text-amber-800 block mb-1.5 uppercase tracking-wide">☀️ Ranná rutina</span>
            <div className="space-y-1.5">
              {skincareRoutine.morning.map(item => (
                <div key={item.step} className="p-2 rounded border border-[#E8E2D9] bg-[#FAF8F5] text-[10px]">
                  <div className="flex justify-between items-start font-bold">
                    <span>{item.step}. {item.category}</span>
                    <span className="text-[#C5A059] text-[9px]">{item.brand}</span>
                  </div>
                  <p className="text-[#2C2A29] font-medium">{item.productName}</p>
                  <p className="text-[9px] text-[#8C857B] italic">{item.activeIngredients}</p>
                  <p className="text-[9px] text-[#2C2A29] mt-0.5">{item.usage}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold text-indigo-900 block mb-1.5 uppercase tracking-wide">🌙 Večerná rutina</span>
            <div className="space-y-1.5">
              {skincareRoutine.evening.map(item => (
                <div key={item.step} className="p-2 rounded border border-[#E8E2D9] bg-[#FAF8F5] text-[10px]">
                  <div className="flex justify-between items-start font-bold">
                    <span>{item.step}. {item.category}</span>
                    <span className="text-[#C5A059] text-[9px]">{item.brand}</span>
                  </div>
                  <p className="text-[#2C2A29] font-medium">{item.productName}</p>
                  <p className="text-[9px] text-[#8C857B] italic">{item.activeIngredients}</p>
                  <p className="text-[9px] text-[#2C2A29] mt-0.5">{item.usage}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* KONTROLNÉ MÍĽNIKY MEICET */}
      <div className="mb-6 p-3 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] print-avoid-break">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#2C2A29] mb-2">
          6. Kontrolné míľniky a pretestovanie na Meicet Pro-A
        </h4>
        <div className="grid grid-cols-3 gap-2 text-[10px]">
          {milestones.map((m, idx) => (
            <div key={idx} className="p-2 rounded bg-white border border-[#E8E2D9]">
              <strong className="text-[#C5A059] block">{m.timeframe}</strong>
              <span className="font-bold text-[#2C2A29] block mb-1">{m.title}</span>
              <p className="text-[9px] text-[#8C857B]">{m.targetMetrics}</p>
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
