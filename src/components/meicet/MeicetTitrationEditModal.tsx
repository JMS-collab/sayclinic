import React, { useState } from 'react';
import { X, Clock, AlertTriangle, Check } from 'lucide-react';
import { MeicetSkincareProduct } from '@/types/meicet';

interface MeicetTitrationEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: MeicetSkincareProduct | null;
  onSave: (updatedFrequency: string, updatedTitration?: string) => void;
}

export const MeicetTitrationEditModal: React.FC<MeicetTitrationEditModalProps> = ({
  isOpen,
  onClose,
  product,
  onSave
}) => {
  const [frequency, setFrequency] = useState(product?.frequencySchedule || product?.usage || '1x denne');
  const [titration, setTitration] = useState(product?.titrationNotes || '');

  if (!isOpen || !product) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(frequency.trim(), titration.trim() ? titration.trim() : undefined);
    onClose();
  };

  const presetFrequencies = [
    'Každé ráno po čistení',
    'Každý večer pred krémom',
    '1x týždenne večer (prvé 2 týždne), potom 2x týždenne',
    'Každý druhý večer (obdeň)',
    '2x až 3x do týždňa ako SOS kúra',
    'Ráno aj večer na hydratáciu'
  ];

  return (
    <div className="fixed inset-0 z-[260] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl border border-[#E8E2D9] shadow-2xl max-w-lg w-full overflow-hidden text-[#2C2A29]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-[#E8E2D9] bg-[#FAF8F5] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#2C2A29]">
                Frekvencia aplikácie a titrácia
              </h3>
              <p className="text-[11px] text-[#6B635B] truncate max-w-xs">
                {product.brand} – {product.productName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-[#E8E2D9] text-[#6B635B] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B635B] mb-1.5">
              ⏱️ Frekvencia & Harmonogram aplikácie
            </label>
            <input
              type="text"
              required
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs focus:ring-2 focus:ring-[#C5A059]/40 mb-2"
              placeholder="napr. 1x týždenne večer"
            />

            <div className="flex flex-wrap gap-1.5">
              {presetFrequencies.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setFrequency(preset)}
                  className="text-[10px] bg-[#FAF7F2] hover:bg-[#E8E2D9] text-[#5A524C] px-2 py-0.5 rounded-lg border border-[#E8E2D9] transition-colors cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B635B] mb-1.5 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              Titračný protokol / Špeciálne upozornenia
            </label>
            <textarea
              rows={3}
              value={titration}
              onChange={(e) => setTitration(e.target.value)}
              placeholder="napr. Aplikovať výhradne na suchú pokožku; v rannom protokole je povinné SPF 50+; vynechať 5 dní pred laserovým zákrokom..."
              className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs focus:ring-2 focus:ring-[#C5A059]/40"
            />
          </div>

          <div className="pt-3 border-t border-[#E8E2D9] flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#E8E2D9] text-xs font-semibold hover:bg-[#FAF7F2] cursor-pointer"
            >
              Zrušiť
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#2C2A29] hover:bg-[#C5A059] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Uložiť nastavenie
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
