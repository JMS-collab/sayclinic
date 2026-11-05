import React, { useState } from 'react';
import { 
  X, 
  ArrowLeftRight, 
  Search, 
  FlaskConical, 
  Lightbulb, 
  Clock, 
  Check, 
  Plus, 
  Sparkles, 
  Building2, 
  Pill,
  PackagePlus
} from 'lucide-react';
import { MeicetSkincareProduct } from '@/types/meicet';
import { SKINCARE_ALTERNATIVES_CATALOG } from '@/data/meicetAlternativesCatalog';

interface MeicetProductSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProduct: MeicetSkincareProduct | null;
  routineType: 'morning' | 'evening';
  mode?: 'swap' | 'add';
  targetStepNumber?: number;
  onSelectAlternative: (newProduct: MeicetSkincareProduct) => void;
  onStockProduct?: (product: MeicetSkincareProduct) => void;
}

export const MeicetProductSwapModal: React.FC<MeicetProductSwapModalProps> = ({
  isOpen,
  onClose,
  currentProduct,
  routineType,
  mode = 'swap',
  targetStepNumber,
  onSelectAlternative,
  onStockProduct
}) => {
  const isAddMode = mode === 'add';
  const effectiveStep = isAddMode ? (targetStepNumber || 1) : (currentProduct?.step || 1);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTextureFilter, setSelectedTextureFilter] = useState<string>('all');
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Formulár pre vlastný produkt
  const [customBrand, setCustomBrand] = useState('');
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState(currentProduct?.category || 'Sérum / Krém');
  const [customPrice, setCustomPrice] = useState<string>('45');
  const [customActiveIngredient, setCustomActiveIngredient] = useState('');
  const [customWhyItMatters, setCustomWhyItMatters] = useState('');
  const [customFrequency, setCustomFrequency] = useState('1x denne');
  const [customTitration, setCustomTitration] = useState('');
  const [customIsExternal, setCustomIsExternal] = useState(true);
  const [customIsRx, setCustomIsRx] = useState(false);
  const [customAlsoStock, setCustomAlsoStock] = useState(false);

  if (!isOpen || (!currentProduct && !isAddMode)) return null;

  // Zozbierať všetky alternatívy z katalógu
  const allAlternatives = SKINCARE_ALTERNATIVES_CATALOG.flatMap(cat => 
    cat.products.map(p => ({ ...p, catalogCategory: cat.label }))
  );

  // Filtrovanie
  const filteredAlternatives = allAlternatives.filter(item => {
    // Textúrový filter
    if (selectedTextureFilter !== 'all') {
      if (selectedTextureFilter === 'rx' && !item.prescriptionOnly && item.galenicForm !== 'rx') return false;
      if (selectedTextureFilter !== 'rx' && item.galenicForm !== selectedTextureFilter) return false;
    }

    // Vyhľadávací text
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.productName.toLowerCase().includes(term) ||
      item.brand.toLowerCase().includes(term) ||
      item.activeIngredients.toLowerCase().includes(term) ||
      (item.keyActiveIngredient && item.keyActiveIngredient.toLowerCase().includes(term)) ||
      item.category.toLowerCase().includes(term)
    );
  });

  const handleSelectProduct = (alt: typeof allAlternatives[0]) => {
    const updatedProduct: MeicetSkincareProduct = {
      step: effectiveStep,
      category: alt.category,
      productName: alt.productName,
      brand: alt.brand,
      activeIngredients: alt.activeIngredients,
      keyActiveIngredient: alt.keyActiveIngredient,
      whyItMatters: alt.whyItMatters,
      frequencySchedule: alt.frequencySchedule,
      titrationNotes: alt.titrationNotes,
      usage: alt.usage,
      purpose: alt.purpose,
      price: alt.price,
      meicetJustification: alt.meicetJustification || currentProduct?.meicetJustification || 'Indikované na základe spektrálnej analýzy pleti.',
      isExternal: alt.isExternal,
      prescriptionOnly: alt.prescriptionOnly,
      pharmacyBrand: alt.pharmacyBrand,
      externalProviderNote: alt.externalProviderNote,
      galenicForm: alt.galenicForm as any,
      alreadyOwned: false
    };

    onSelectAlternative(updatedProduct);
    onClose();
  };

  const handleCreateCustomProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customBrand.trim()) return;

    const newProduct: MeicetSkincareProduct = {
      step: effectiveStep,
      category: customCategory || currentProduct?.category || 'Sérum / Krém',
      productName: customName.trim(),
      brand: customBrand.trim(),
      activeIngredients: customActiveIngredient.trim() || 'Dermatologický komplex',
      keyActiveIngredient: customActiveIngredient.trim() || 'Kľúčová aktívna zložka',
      whyItMatters: customWhyItMatters.trim() || 'Podpora stability pleti a synergie starostlivosti.',
      frequencySchedule: customFrequency.trim() || '1x denne',
      titrationNotes: customTitration.trim() || undefined,
      usage: `Aplikujte ${customFrequency.trim() || '1x denne'} na vyčistenú pleť.`,
      purpose: 'Personalizovaná dermokozmetická starostlivosť.',
      price: customPrice ? parseFloat(customPrice) : undefined,
      meicetJustification: 'Indikované na základe individuálnej konzultácie s lekárom.',
      isExternal: customAlsoStock ? false : customIsExternal,
      prescriptionOnly: customIsRx,
      pharmacyBrand: customIsExternal && !customIsRx && !customAlsoStock,
      alreadyOwned: false
    };

    if (customAlsoStock && onStockProduct) {
      onStockProduct(newProduct);
    }

    onSelectAlternative(newProduct);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl border border-[#E8E2D9] shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden text-[#2C2A29]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HLAVIČKA MODÁLU */}
        <div className="p-6 border-b border-[#E8E2D9] bg-gradient-to-r from-[#FAF8F5] via-white to-[#FAF8F5] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md bg-[#C5A059]/20 text-[#8C6D2D] font-bold text-[10px] uppercase tracking-wider">
                {isAddMode ? 'Pridanie nového kroku' : 'Smart Product Swap'}
              </span>
              <span className="text-xs text-[#8C837A]">
                {routineType === 'morning' ? '☀️ Ranná rutina' : '🌙 Večerná rutina'} • Krok {effectiveStep}
              </span>
            </div>
            <h3 className="font-serif font-bold text-xl text-[#2C2A29]">
              {isAddMode ? 'Pridať nový produkt do rutiny' : 'Zmeniť produkt za dermatologickú alternatívu'}
            </h3>
            <p className="text-xs text-[#6B635B] mt-0.5">
              {isAddMode ? (
                'Vyberte produkt z lekárskeho katalógu (SkinCeuticals, ZO Skin Health, iS Clinical, Skinbetter, Medik8...) alebo zadajte vlastný.'
              ) : currentProduct ? (
                <>Aktuálne zvolené: <strong className="text-[#2C2A29]">{currentProduct.brand} – {currentProduct.productName}</strong> ({currentProduct.price ? `${currentProduct.price} €` : 'neuvedená cena'})</>
              ) : null}
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

        {/* LIŠTA S FILTRAMI A PREPÍNAČOM VLASTNÉHO PRODUKTU */}
        <div className="p-4 bg-[#FAF8F5] border-b border-[#E8E2D9] flex flex-wrap items-center justify-between gap-3">
          {/* Prepínač: Katalóg vs Vlastný produkt */}
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
              Katalóg alternatív ({filteredAlternatives.length})
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
              Zadať vlastný produkt
            </button>
          </div>

          {!isCustomMode && (
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C837A]" />
                <input
                  type="text"
                  placeholder="Hľadať značku, účinnú látku, produkt..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E8E2D9] bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40"
                />
              </div>
            </div>
          )}
        </div>

        {/* TEXTÚROVÉ FILTRE (IBA V REŽIME KATALÓGU) */}
        {!isCustomMode && (
          <div className="px-6 py-2.5 bg-white border-b border-[#E8E2D9] flex items-center gap-2 overflow-x-auto text-[11px]">
            <span className="text-[#8C837A] font-bold text-[10px] uppercase shrink-0">Textúra / Typ:</span>
            {[
              { id: 'all', label: 'Všetky formy' },
              { id: 'serum', label: '🧪 Séra' },
              { id: 'fluid', label: '💧 Ľahký fluid / gél' },
              { id: 'emulsion', label: '🧴 Emulzia' },
              { id: 'cream', label: '🧈 Výživný krém' },
              { id: 'balm', label: '🛡️ SOS Balzam' },
              { id: 'rx', label: '💊 Rx Lekárenské' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedTextureFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 cursor-pointer ${
                  selectedTextureFilter === tab.id
                    ? 'bg-[#C5A059] text-white font-bold'
                    : 'bg-[#FAF7F2] text-[#6B635B] hover:text-[#2C2A29] hover:bg-[#E8E2D9]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* TELO MODÁLU */}
        <div className="flex-1 overflow-y-auto p-6">
          {isCustomMode ? (
            /* FORMULÁR PRE VLASTNÝ PRODUKT */
            <form onSubmit={handleCreateCustomProduct} className="max-w-2xl mx-auto space-y-4">
              <div className="bg-amber-50/80 border border-amber-200/80 p-4 rounded-2xl text-xs text-amber-900 leading-relaxed mb-4">
                <strong>💡 Tip od lekára:</strong> Zadať môžete akýkoľvek produkt, ktorý pacient už používa, preferuje, alebo mu ho chcete individuálne predpísať (vrátane magistraliter prípravkov z lekárne).
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B635B] mb-1">
                    Značka (Výrobca) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="napr. Medik8, Geek & Gorgeous, Magistraliter"
                    value={customBrand}
                    onChange={(e) => setCustomBrand(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs focus:ring-2 focus:ring-[#C5A059]/50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B635B] mb-1">
                    Názov produktu *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="napr. Crystal Retinal 6, Hydr8 B5, Soolantra"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs focus:ring-2 focus:ring-[#C5A059]/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B635B] mb-1">
                    Kategória kroku
                  </label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="napr. Nočný retinoid, Hydratačný krém"
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs focus:ring-2 focus:ring-[#C5A059]/50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B635B] mb-1">
                    Odhadovaná cena (€)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder="35"
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs focus:ring-2 focus:ring-[#C5A059]/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B635B] mb-1">
                  🧪 Kľúčová účinná látka & koncentrácia *
                </label>
                <input
                  type="text"
                  required
                  placeholder="napr. 0.06% Retinaldehyd, 15% Kyselina azelaová, 2% Ceramidy"
                  value={customActiveIngredient}
                  onChange={(e) => setCustomActiveIngredient(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs focus:ring-2 focus:ring-[#C5A059]/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B635B] mb-1">
                  💡 Prečo je dôležitá pre pleť klienta
                </label>
                <textarea
                  rows={2}
                  placeholder="Vysvetlite mechanizmus účinku a prečo práve tento produkt pomôže..."
                  value={customWhyItMatters}
                  onChange={(e) => setCustomWhyItMatters(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs focus:ring-2 focus:ring-[#C5A059]/50"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B635B] mb-1">
                    ⏱️ Frekvencia aplikácie
                  </label>
                  <input
                    type="text"
                    placeholder="napr. 1x večer, 2x týždenne, každé ráno"
                    value={customFrequency}
                    onChange={(e) => setCustomFrequency(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs focus:ring-2 focus:ring-[#C5A059]/50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B635B] mb-1">
                    ⚠️ Titrácia / Špeciálne pokyny
                  </label>
                  <input
                    type="text"
                    placeholder="napr. Postupne zvyšovať, vynechať pred laserom"
                    value={customTitration}
                    onChange={(e) => setCustomTitration(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs focus:ring-2 focus:ring-[#C5A059]/50"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={customIsExternal}
                      onChange={(e) => setCustomIsExternal(e.target.checked)}
                      className="rounded text-[#C5A059]"
                    />
                    <span>Produkt mimo kliniky (lekáreň / e-shop)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={customIsRx}
                      onChange={(e) => {
                        setCustomIsRx(e.target.checked);
                        if (e.target.checked) setCustomIsExternal(true);
                      }}
                      className="rounded text-rose-600"
                    />
                    <span className="text-rose-800 font-bold">Liek na lekársky predpis (Rp.)</span>
                  </label>
                </div>

                {onStockProduct && (
                  <label className="flex items-center gap-2 cursor-pointer text-xs p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 mt-1">
                    <input
                      type="checkbox"
                      checked={customAlsoStock}
                      onChange={(e) => {
                        setCustomAlsoStock(e.target.checked);
                        if (e.target.checked) setCustomIsExternal(false);
                      }}
                      className="rounded text-[#C5A059]"
                    />
                    <div className="flex items-center gap-1.5 text-[#8C6D2D] font-bold">
                      <PackagePlus className="w-3.5 h-3.5" />
                      <span>📦 Zároveň vytvoriť položku v sklade SAY CLINIC (5 ks na sklad) a v cenníku</span>
                    </div>
                  </label>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[#E8E2D9]">
                <button
                  type="button"
                  onClick={() => setIsCustomMode(false)}
                  className="px-4 py-2 rounded-xl border border-[#E8E2D9] text-xs font-semibold hover:bg-[#FAF7F2] cursor-pointer"
                >
                  Späť do katalógu
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#C5A059] hover:bg-[#B38F48] text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  {isAddMode ? `Pridať ako krok ${effectiveStep}` : `Použiť a nahradiť krok ${effectiveStep}`}
                </button>
              </div>
            </form>
          ) : (
            /* ZOZNAM ALTERNATÍV Z KATALÓGU */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAlternatives.map((alt) => {
                const isSelected = 
                  Boolean(currentProduct) &&
                  alt.brand.toLowerCase() === currentProduct!.brand.toLowerCase() && 
                  alt.productName.toLowerCase() === currentProduct!.productName.toLowerCase();

                return (
                  <div
                    key={alt.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      isSelected 
                        ? 'border-[#C5A059] bg-[#FAF8F5] ring-2 ring-[#C5A059]/30' 
                        : 'border-[#E8E2D9] hover:border-[#C5A059]/60 hover:shadow-md bg-white'
                    }`}
                  >
                    <div>
                      {/* ŠTÍTKY A CENA */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#FAF7F2] text-[#8C6D2D] border border-[#E8E2D9]">
                            {alt.category}
                          </span>
                          {alt.prescriptionOnly && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-300 flex items-center gap-1">
                              <Pill className="w-3 h-3" />
                              Rp. Liek
                            </span>
                          )}
                          {alt.isExternal && !alt.prescriptionOnly && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-300">
                              Lekáreň
                            </span>
                          )}
                        </div>

                        {alt.price && (
                          <span className="text-sm font-serif font-bold text-[#2C2A29]">
                            {alt.isExternal ? `~${alt.price} €` : `${alt.price} €`}
                          </span>
                        )}
                      </div>

                      {/* NÁZOV PRODUKTU */}
                      <h4 className="font-serif font-bold text-base text-[#2C2A29]">
                        {alt.brand} – {alt.productName}
                      </h4>

                      {/* ÚČINNÁ LÁTKA */}
                      <div className="mt-2">
                        <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#8C6D2D] bg-[#F5EFE6] px-2.5 py-1 rounded-lg border border-[#E8DFC9] flex-wrap">
                          <FlaskConical className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                          <span className="font-bold text-[#634812]">Účinná látka:</span>
                          <span className="text-[#3E3833]">{alt.keyActiveIngredient || alt.activeIngredients}</span>
                        </div>
                      </div>

                      {/* PREČO JE DÔLEŽITÁ */}
                      {alt.whyItMatters && (
                        <div className="mt-2 text-[11px] bg-amber-50/70 border border-amber-200/60 rounded-lg p-2.5 text-[#5A4315] leading-relaxed">
                          <div className="font-bold text-amber-900 flex items-center gap-1 mb-0.5">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            Prečo pomôže vašej pleti:
                          </div>
                          <p className="text-[#4E3A10]">{alt.whyItMatters}</p>
                        </div>
                      )}

                      {/* FREKVENCIA */}
                      {alt.frequencySchedule && (
                        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-700 bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200">
                          <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="font-bold text-slate-800">Aplikácia:</span>
                          <span className="truncate">{alt.frequencySchedule}</span>
                        </div>
                      )}
                    </div>

                    {/* TLAČIDLO VÝBERU A NASKLADNENIA */}
                    <div className="mt-4 pt-3 border-t border-[#E8E2D9] flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#8C837A]">
                          {alt.isExternal ? 'Externý nákup / lekáreň' : 'Klinické portfólio SAY CLINIC'}
                        </span>

                        {alt.isExternal && onStockProduct && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const prodToStock: MeicetSkincareProduct = {
                                step: effectiveStep,
                                category: alt.category,
                                productName: alt.productName,
                                brand: alt.brand,
                                activeIngredients: alt.activeIngredients,
                                keyActiveIngredient: alt.keyActiveIngredient,
                                whyItMatters: alt.whyItMatters,
                                frequencySchedule: alt.frequencySchedule,
                                usage: alt.usage,
                                purpose: alt.purpose,
                                price: alt.price,
                                isExternal: false,
                                meicetJustification: alt.meicetJustification || 'Dermatologická indikácia z Meicet diagnostiky.',
                                galenicForm: alt.galenicForm as any
                              };
                              onStockProduct(prodToStock);
                            }}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#FAF7F2] hover:bg-[#C5A059]/20 text-[#8C6D2D] border border-[#E8DFC9] flex items-center gap-1 transition-colors cursor-pointer"
                            title="Zaradiť tento produkt do skladu a cenníka SAY CLINIC (5 ks na sklad)"
                          >
                            <PackagePlus className="w-3 h-3" />
                            <span>Zaradiť na sklad</span>
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectProduct(alt)}
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
                        ) : isAddMode ? (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            Pridať do rutiny (krok {effectiveStep})
                          </>
                        ) : (
                          <>
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                            Zvoliť tento produkt
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredAlternatives.length === 0 && (
                <div className="col-span-2 text-center py-12 text-[#8C837A]">
                  <p className="text-sm">Pre zadaný filter alebo vyhľadávanie sa nenašli žiadne alternatívy.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedTextureFilter('all');
                    }}
                    className="mt-3 text-xs font-bold text-[#C5A059] hover:underline"
                  >
                    Zrušiť filtre
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
