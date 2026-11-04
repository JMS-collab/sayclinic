import React, { useState } from 'react';
import { 
  X, 
  ArrowLeftRight, 
  Search, 
  Check, 
  Plus, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Calendar 
} from 'lucide-react';
import { MeicetTreatmentPlanItem } from '@/types/meicet';
import { PROCEDURE_ALTERNATIVES_CATALOG } from '@/data/meicetAlternativesCatalog';

interface MeicetProcedureSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTreatment: MeicetTreatmentPlanItem | null;
  quarterLabel: string;
  onSelectAlternative: (newTreatment: MeicetTreatmentPlanItem) => void;
}

export const MeicetProcedureSwapModal: React.FC<MeicetProcedureSwapModalProps> = ({
  isOpen,
  onClose,
  currentTreatment,
  quarterLabel,
  onSelectAlternative
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Vlastný zákrok
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<'laser' | 'injectable' | 'skin_care' | 'surgery' | 'scar_care'>('laser');
  const [customTargetArea, setCustomTargetArea] = useState(currentTreatment?.targetArea || 'Celá tvár');
  const [customFrequency, setCustomFrequency] = useState('1 sedenie');
  const [customPriority, setCustomPriority] = useState<'vysoká' | 'odporúčaná' | 'udržiavacia'>('odporúčaná');
  const [customPrice, setCustomPrice] = useState<string>('200');
  const [customReasoning, setCustomReasoning] = useState('');
  const [customIsExternal, setCustomIsExternal] = useState(false);

  if (!isOpen || !currentTreatment) return null;

  // Zozbierať všetky zákroky
  const allProcedures = PROCEDURE_ALTERNATIVES_CATALOG.flatMap(cat => 
    cat.procedures.map(p => ({ ...p, catalogCategory: cat.label }))
  );

  // Filtrovanie
  const filteredProcedures = allProcedures.filter(p => {
    if (selectedCategoryFilter !== 'all' && p.category !== selectedCategoryFilter) return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.targetArea.toLowerCase().includes(term) ||
      p.reasoning.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term)
    );
  });

  const handleSelectProcedure = (proc: typeof allProcedures[0]) => {
    const updatedTreatment: MeicetTreatmentPlanItem = {
      ...proc,
      id: currentTreatment.id, // zachovať pôvodné ID kvôli React kľúčom
      seasonOrMonth: currentTreatment.seasonOrMonth,
      status: currentTreatment.status || 'planned'
    };

    onSelectAlternative(updatedTreatment);
    onClose();
  };

  const handleCreateCustomProcedure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newTreatment: MeicetTreatmentPlanItem = {
      id: currentTreatment.id,
      name: customName.trim(),
      category: customCategory,
      targetArea: customTargetArea.trim() || 'Tvár',
      seasonOrMonth: currentTreatment.seasonOrMonth,
      frequency: customFrequency.trim() || '1 ošetrenie',
      priority: customPriority,
      estimatedPrice: customPrice ? parseFloat(customPrice) : undefined,
      reasoning: customReasoning.trim() || 'Individuálna indikácia na základe konzultácie.',
      status: 'planned',
      isExternal: customIsExternal
    };

    onSelectAlternative(newTreatment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl border border-[#E8E2D9] shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden text-[#2C2A29]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HLAVIČKA */}
        <div className="p-6 border-b border-[#E8E2D9] bg-gradient-to-r from-[#FAF8F5] via-white to-[#FAF8F5] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md bg-[#C5A059]/20 text-[#8C6D2D] font-bold text-[10px] uppercase tracking-wider">
                Smart Procedure Swap
              </span>
              <span className="text-xs text-[#8C837A]">
                {quarterLabel}
              </span>
            </div>
            <h3 className="font-serif font-bold text-xl text-[#2C2A29]">
              Zmeniť klinickú procedúru v ročnom pláne
            </h3>
            <p className="text-xs text-[#6B635B] mt-0.5">
              Aktuálne zvolené: <strong className="text-[#2C2A29]">{currentTreatment.name}</strong> ({currentTreatment.estimatedPrice ? `${currentTreatment.estimatedPrice} €` : 'cena dohodou'})
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#FAF7F2] hover:bg-[#E8E2D9] text-[#6B635B] hover:text-[#2C2A29] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* LIŠTA S REŽIMOM A VYHĽADÁVANÍM */}
        <div className="p-4 bg-[#FAF8F5] border-b border-[#E8E2D9] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-[#E8E2D9]">
            <button
              type="button"
              onClick={() => setIsCustomMode(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !isCustomMode 
                  ? 'bg-[#2C2A29] text-white shadow-xs' 
                  : 'text-[#6B635B] hover:text-[#2C2A29]'
              }`}
            >
              Katalóg procedúr ({filteredProcedures.length})
            </button>
            <button
              type="button"
              onClick={() => setIsCustomMode(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isCustomMode 
                  ? 'bg-[#C5A059] text-white shadow-xs' 
                  : 'text-[#6B635B] hover:text-[#2C2A29]'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Zadať vlastný zákrok
            </button>
          </div>

          {!isCustomMode && (
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C837A]" />
                <input
                  type="text"
                  placeholder="Hľadať laser, injekciu, prístroj..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E8E2D9] bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40"
                />
              </div>
            </div>
          )}
        </div>

        {/* KATEGÓRIOVÝ FILTER */}
        {!isCustomMode && (
          <div className="px-6 py-2.5 bg-white border-b border-[#E8E2D9] flex items-center gap-2 overflow-x-auto text-[11px]">
            <span className="text-[#8C837A] font-bold text-[10px] uppercase shrink-0">Kategória:</span>
            {[
              { id: 'all', label: 'Všetky zákroky' },
              { id: 'laser', label: '⚡ Lasery & Prístroje' },
              { id: 'injectable', label: '💉 Injekčná biostimulácia' },
              { id: 'skin_care', label: '💆 Peelingy & Hydro-care' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategoryFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 cursor-pointer ${
                  selectedCategoryFilter === tab.id
                    ? 'bg-[#C5A059] text-white font-bold'
                    : 'bg-[#FAF7F2] text-[#6B635B] hover:text-[#2C2A29] hover:bg-[#E8E2D9]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* OBSAH */}
        <div className="flex-1 overflow-y-auto p-6">
          {isCustomMode ? (
            /* VLASTNÝ FORMULÁR */
            <form onSubmit={handleCreateCustomProcedure} className="max-w-2xl mx-auto space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B635B] mb-1">
                  Názov zákroku / prístroja *
                </label>
                <input
                  type="text"
                  required
                  placeholder="napr. Frakčný CO2 laser, Profhilo 2ml, Plazmaterapia PRP"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs focus:ring-2 focus:ring-[#C5A059]/50"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B635B] mb-1">
                    Typ zákroku
                  </label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs bg-white"
                  >
                    <option value="laser">Laser / Prístroj</option>
                    <option value="injectable">Injekčné ošetrenie</option>
                    <option value="skin_care">Peeling / Kozmetika</option>
                    <option value="surgery">Chirurgický zákrok</option>
                    <option value="scar_care">Jazvová terapia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B635B] mb-1">
                    Cieľová oblasť
                  </label>
                  <input
                    type="text"
                    value={customTargetArea}
                    onChange={(e) => setCustomTargetArea(e.target.value)}
                    placeholder="Celá tvár / Očné okolie"
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B635B] mb-1">
                    Odhadovaná cena (€)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder="250"
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B635B] mb-1">
                    Frekvencia / Počet sedení
                  </label>
                  <input
                    type="text"
                    value={customFrequency}
                    onChange={(e) => setCustomFrequency(e.target.value)}
                    placeholder="napr. Séria 3 sedení po 4 týždňoch"
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B635B] mb-1">
                    Priorita
                  </label>
                  <select
                    value={customPriority}
                    onChange={(e) => setCustomPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs bg-white"
                  >
                    <option value="vysoká">Vysoká (Kritická)</option>
                    <option value="odporúčaná">Odporúčaná</option>
                    <option value="udržiavacia">Udržiavacia</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B635B] mb-1">
                  Klinické odôvodnenie (Prečo a mechanizmus účinku)
                </label>
                <textarea
                  rows={3}
                  value={customReasoning}
                  onChange={(e) => setCustomReasoning(e.target.value)}
                  placeholder="Vysvetlite mechanizmus procedúry (napr. hĺbková remodelácia kolagénu teplom bez porušenia pokožky)..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={customIsExternal}
                    onChange={(e) => setCustomIsExternal(e.target.checked)}
                    className="rounded text-[#C5A059]"
                  />
                  <span>Procedúra mimo portfólia kliniky (externé pracovisko)</span>
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[#E8E2D9]">
                <button
                  type="button"
                  onClick={() => setIsCustomMode(false)}
                  className="px-4 py-2 rounded-xl border border-[#E8E2D9] text-xs font-semibold hover:bg-[#FAF7F2]"
                >
                  Späť do katalógu
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#C5A059] hover:bg-[#B38F48] text-white text-xs font-bold shadow-sm"
                >
                  Použiť a nahradiť zákrok
                </button>
              </div>
            </form>
          ) : (
            /* ZOZNAM PROCEDÚR Z KATALÓGU */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProcedures.map((proc) => {
                const isSelected = proc.name.toLowerCase() === currentTreatment.name.toLowerCase();

                return (
                  <div
                    key={proc.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      isSelected 
                        ? 'border-[#C5A059] bg-[#FAF8F5] ring-2 ring-[#C5A059]/30' 
                        : 'border-[#E8E2D9] hover:border-[#C5A059]/60 hover:shadow-md bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#FAF7F2] text-[#8C6D2D] border border-[#E8E2D9]">
                          {proc.category === 'laser' ? '⚡ Laser' : proc.category === 'injectable' ? '💉 Injekčné' : '💆 Peeling / Starostlivosť'}
                        </span>
                        {proc.estimatedPrice && (
                          <span className="text-sm font-serif font-bold text-[#2C2A29]">
                            {proc.estimatedPrice} €
                          </span>
                        )}
                      </div>

                      <h4 className="font-serif font-bold text-base text-[#2C2A29]">
                        {proc.name}
                      </h4>
                      <p className="text-[11px] text-[#6B635B] mt-0.5">
                        Oblasť: <strong>{proc.targetArea}</strong> • {proc.frequency}
                      </p>

                      <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-[11px] text-[#5A4315] leading-relaxed">
                        <span className="font-bold text-amber-900 block mb-0.5">
                          💡 Mechanizmus pôsobenia & Odôvodnenie:
                        </span>
                        {proc.reasoning}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#E8E2D9] flex items-center justify-between">
                      <span className="text-[10px] text-[#8C837A]">
                        Priorita: <strong className="capitalize">{proc.priority}</strong>
                      </span>

                      <button
                        type="button"
                        onClick={() => handleSelectProcedure(proc)}
                        disabled={isSelected}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white cursor-default'
                            : 'bg-[#2C2A29] hover:bg-[#C5A059] text-white shadow-xs'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Aktuálne zvolený
                          </>
                        ) : (
                          <>
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                            Zvoliť tento zákrok
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
