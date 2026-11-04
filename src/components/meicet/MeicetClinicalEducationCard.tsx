import React, { useState } from 'react';
import { 
  FlaskConical, 
  Target, 
  ShieldAlert, 
  Zap, 
  Dna, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  CheckCircle2, 
  Info, 
  Layers, 
  HeartHandshake 
} from 'lucide-react';
import { MeicetClinicalEducation } from '@/types/meicet';

interface MeicetClinicalEducationCardProps {
  education: MeicetClinicalEducation;
  patientName?: string;
}

export const MeicetClinicalEducationCard: React.FC<MeicetClinicalEducationCardProps> = ({
  education,
  patientName
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeSection, setActiveSection] = useState<'all' | 'pathophysiology' | 'strategy' | 'molecules' | 'procedures'>('all');

  const { pathophysiology, therapeuticStrategy, activeIngredientsMatrix, proceduresMechanisms } = education;

  const severityBadges: Record<'mierne' | 'výrazné' | 'kritické', { bg: string; text: string; border: string; label: string }> = {
    kritické: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-300', label: '🚨 Prioritný nález' },
    výrazné: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300', label: '⚠️ Výrazný nález' },
    mierne: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300', label: 'ℹ️ Mierny nález' }
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-[#C5A059]/40 shadow-sm overflow-hidden mb-6 text-[#2C2A29] transition-all">
      {/* HLAVIČKA SEKČNÉHO BLOKU */}
      <div className="bg-gradient-to-r from-[#2C2A29] via-[#3E3A37] to-[#2C2A29] text-white p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-[#C5A059] text-[#2C2A29] font-bold text-[10px] uppercase tracking-wider shadow-2xs">
              EBM Dermatologická edukácia & Terapia
            </span>
            <span className="text-xs text-[#E8DFC9] flex items-center gap-1 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
              Meicet Pro-A 3D Spectral Synthesis
            </span>
          </div>

          <h3 className="font-serif font-bold text-lg md:text-xl text-white tracking-wide">
            Klinická diagnóza, ciele liečby & mechanizmus účinku aktívnych látok
          </h3>
          <p className="text-xs text-[#E8DFC9]/80 mt-1 max-w-2xl leading-relaxed">
            Podrobný rozbor: čo presne je oslabené na vašej pleti, akú stratégiu volíme, prečo indikujeme konkrétne molekuly a ako pôsobia klinické zákroky na bunkovej úrovni.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#E8DFC9] hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all border border-white/10 cursor-pointer"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span>Zbaliť podrobnosti</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                <span>Zobraziť celú analýzu</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-5 md:p-6 space-y-6 animate-in fade-in duration-200 bg-[#FCFAF7]">
          {/* NAVIGAČNÉ PREPÍNAČE POHĽADU */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'all', label: 'Kompletný prehľad (Všetko)' },
              { id: 'pathophysiology', label: '1. Čo je s pleťou (Nálezy)' },
              { id: 'strategy', label: '2. Terapeutická stratégia' },
              { id: 'molecules', label: '3. Účinné látky (Molekuly)' },
              { id: 'procedures', label: '4. Procedúry a lasery' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSection(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeSection === tab.id
                    ? 'bg-[#C5A059] text-white shadow-xs'
                    : 'bg-white text-[#6B635B] hover:text-[#2C2A29] border border-[#E8E2D9]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* PILIER 1: ČO JE S VAŠOU PLEŤOU (PATOFYZIOLÓGIA) */}
          {(activeSection === 'all' || activeSection === 'pathophysiology') && (
            <div className="bg-white rounded-2xl border border-[#E8E2D9] p-5 shadow-2xs">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-base text-[#2C2A29]">
                    1. Patofyziologický nález: Čo sa deje s vašou pleťou?
                  </h4>
                  <p className="text-xs text-[#6B635B]">
                    {pathophysiology.description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {pathophysiology.issues.map(issue => {
                  const badge = severityBadges[issue.severity] || severityBadges.mierne;
                  return (
                    <div 
                      key={issue.id} 
                      className="p-4 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${badge.bg} ${badge.text} ${badge.border}`}>
                            {badge.label}
                          </span>
                        </div>
                        <h5 className="font-serif font-bold text-sm text-[#2C2A29]">
                          {issue.name}
                        </h5>
                        <p className="text-xs text-[#5A524C] mt-1 font-medium">
                          <strong>Objektívny nález Meicet:</strong> {issue.finding}
                        </p>
                      </div>

                      <div className="mt-3 p-2.5 rounded-lg bg-white border border-[#E8E2D9] text-[11px] text-[#4A433D] leading-relaxed">
                        <span className="font-bold text-[#8C6D2D] block mb-0.5">
                          🧬 Bunkový mechanizmus poškodenia:
                        </span>
                        {issue.biologicalMechanism}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PILIER 2: TERAPEUTICKÁ STRATÉGIA A CIELE LIEČBY */}
          {(activeSection === 'all' || activeSection === 'strategy') && (
            <div className="bg-white rounded-2xl border border-[#E8E2D9] p-5 shadow-2xs">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-base text-[#2C2A29]">
                    2. Terapeutická stratégia: Aký cieľ sledujeme a prečo?
                  </h4>
                  <p className="text-xs text-[#6B635B]">
                    {therapeuticStrategy.goal}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {therapeuticStrategy.phases.map((ph, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 bg-blue-100/80 px-2 py-0.5 rounded-md">
                        {ph.phase}
                      </span>
                      <h5 className="font-serif font-bold text-sm text-blue-950 mt-1.5">
                        {ph.title}
                      </h5>
                      <p className="text-xs text-blue-900/90 mt-1 leading-relaxed">
                        <strong>Cieľ:</strong> {ph.objective}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-blue-200/60 text-[11px] text-blue-900/80 italic leading-snug">
                      <strong>💡 Prečo práve teraz:</strong> {ph.rationale}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PILIER 3: KĽÚČOVÉ ÚČINNÉ LÁTKY A MOLEKULÁRNY MECHANIZMUS */}
          {(activeSection === 'all' || activeSection === 'molecules') && (
            <div className="bg-white rounded-2xl border border-[#E8E2D9] p-5 shadow-2xs">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-base text-[#2C2A29]">
                    3. Molekulárna matica: Aké účinné látky vám pomôžu a prečo?
                  </h4>
                  <p className="text-xs text-[#6B635B]">
                    Vedecky podložený mechanizmus účinku jednotlivých molekúl predpísaných v domácej starostlivosti.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                {activeIngredientsMatrix.map(item => (
                  <div key={item.id} className="p-4 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#F5EFE6] text-[#8C6D2D] border border-[#E8DFC9]">
                          {item.category}
                        </span>
                        {item.concentration && (
                          <span className="text-[10px] font-mono font-bold text-[#6B635B] bg-white px-1.5 py-0.5 rounded border border-[#E8E2D9]">
                            {item.concentration}
                          </span>
                        )}
                      </div>

                      <h5 className="font-serif font-bold text-sm text-[#2C2A29] flex items-center gap-1.5">
                        <FlaskConical className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                        {item.ingredient}
                      </h5>
                      <p className="text-[11px] text-[#6B635B] mt-0.5">
                        Indikované pre: <strong>{item.targetIssue}</strong>
                      </p>

                      <div className="mt-2.5 p-2.5 rounded-lg bg-white border border-[#E8E2D9] text-[11px] text-[#4A433D] leading-relaxed">
                        <span className="font-bold text-[#8C6D2D] block mb-0.5">
                          🔬 Bunkový mechanizmus pôsobenia:
                        </span>
                        {item.biologicalAction}
                      </div>
                    </div>

                    <div className="mt-2.5 p-2 rounded-lg bg-emerald-50/70 border border-emerald-200/70 text-[11px] text-emerald-900 leading-snug">
                      <span className="font-bold text-emerald-950 flex items-center gap-1 mb-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        Čo reálne uvidíte na svojej pleti:
                      </span>
                      {item.clinicalBenefit}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PILIER 4: PROCEDÚRY, LASERY A PRÍSTROJOVÝ MECHANIZMUS */}
          {(activeSection === 'all' || activeSection === 'procedures') && (
            <div className="bg-white rounded-2xl border border-[#E8E2D9] p-5 shadow-2xs">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-base text-[#2C2A29]">
                    4. Prístrojové a injekčné procedúry: Prečo, čím a ako liečime?
                  </h4>
                  <p className="text-xs text-[#6B635B]">
                    Kauzálne ošetrenia v klinike SAY CLINIC, ktoré dopĺňajú domácu starostlivosť a pôsobia v hĺbke dermis.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {proceduresMechanisms.map(proc => (
                  <div key={proc.id} className="p-4 rounded-xl border border-purple-100 bg-purple-50/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-100 text-purple-900">
                          {proc.category === 'laser' ? '⚡ Laserová terapia' : proc.category === 'injectable' ? '💉 Injekčná biostimulácia' : '💆 Hĺbková starostlivosť'}
                        </span>
                        <span className="text-[10px] text-purple-800 font-medium bg-white px-2 py-0.5 rounded border border-purple-200">
                          Cieľ: {proc.targetLayer}
                        </span>
                      </div>

                      <h5 className="font-serif font-bold text-sm text-[#2C2A29]">
                        {proc.procedureName}
                      </h5>

                      <div className="mt-2.5 p-2.5 rounded-lg bg-white border border-purple-200/60 text-[11px] text-[#4A433D] leading-relaxed">
                        <span className="font-bold text-purple-900 block mb-0.5">
                          ⚡ Prístrojový / Injekčný mechanizmus:
                        </span>
                        {proc.mechanismOfAction}
                      </div>
                    </div>

                    <div className="mt-2.5 p-2 rounded-lg bg-amber-50/70 border border-amber-200/70 text-[11px] text-[#5A4315] leading-snug">
                      <span className="font-bold text-amber-900 block mb-0.5">
                        💡 Prečo je indikovaný u vás:
                      </span>
                      {proc.whyIndicated}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* INFORMAČNÁ PÄTIČKA */}
          <div className="p-3.5 rounded-xl bg-white border border-[#E8E2D9] text-xs text-[#6B635B] flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-[#C5A059] shrink-0" />
              <span>
                <strong>Tip pre lekára aj klienta:</strong> Kliknutím <strong>pravým tlačidlom myši</strong> na ľubovoľný produkt alebo procedúru v pláne nižšie môžete vymeniť položku za alternatívu, upraviť frekvenciu alebo označiť produkty, ktoré už klient vlastní doma.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
