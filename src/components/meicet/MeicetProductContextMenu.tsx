import React, { useEffect, useRef } from 'react';
import { 
  ArrowLeftRight, 
  Clock, 
  Home, 
  Trash2, 
  X, 
  Sun, 
  Moon, 
  FlaskConical, 
  CheckCircle2 
} from 'lucide-react';
import { MeicetSkincareProduct } from '@/types/meicet';

interface MeicetProductContextMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  product: MeicetSkincareProduct | null;
  routineType: 'morning' | 'evening';
  onClose: () => void;
  onSwapProduct: () => void;
  onEditTitration: () => void;
  onToggleAlreadyOwned: () => void;
  onRemoveProduct: () => void;
}

export const MeicetProductContextMenu: React.FC<MeicetProductContextMenuProps> = ({
  isOpen,
  x,
  y,
  product,
  routineType,
  onClose,
  onSwapProduct,
  onEditTitration,
  onToggleAlreadyOwned,
  onRemoveProduct
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  // Pozicionovanie v rámci okna aby menu nepretieklo cez okraj
  const menuWidth = 270;
  const menuHeight = 280;
  const safeX = Math.max(12, Math.min(x, (typeof window !== 'undefined' ? window.innerWidth : 1200) - menuWidth - 16));
  const safeY = Math.max(12, Math.min(y, (typeof window !== 'undefined' ? window.innerHeight : 800) - menuHeight - 16));

  const isMorning = routineType === 'morning';
  const isOwned = Boolean(product.alreadyOwned);

  return (
    <div
      ref={menuRef}
      className="fixed z-[200] w-[270px] bg-white/95 backdrop-blur-md border border-[#E8E2D9] rounded-2xl shadow-2xl overflow-hidden text-xs text-[#2C2A29] flex flex-col animate-in fade-in zoom-in-95 duration-100 select-none"
      style={{ top: safeY, left: safeX }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* HLAVIČKA KONTEXTOVÉHO MENU */}
      <div className={`p-3 border-b border-[#E8E2D9] ${
        isMorning 
          ? 'bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5' 
          : 'bg-gradient-to-r from-indigo-900/15 via-purple-900/10 to-slate-900/5'
      }`}>
        <div className="flex items-center justify-between gap-1.5 mb-1">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1 ${
            isMorning ? 'bg-amber-100 text-amber-900' : 'bg-indigo-100 text-indigo-950'
          }`}>
            {isMorning ? <Sun className="w-3 h-3 text-amber-600" /> : <Moon className="w-3 h-3 text-indigo-600" />}
            {isMorning ? 'Ranná rutina' : 'Večerná rutina'} • Krok {product.step}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8C837A] hover:text-[#2C2A29] p-0.5 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <h4 className="font-serif font-bold text-xs text-[#2C2A29] truncate leading-tight" title={product.productName}>
          {product.brand} – {product.productName}
        </h4>
        <div className="text-[10px] text-[#6B635B] truncate mt-0.5 flex items-center gap-1">
          <FlaskConical className="w-3 h-3 text-[#C5A059] shrink-0" />
          <span className="truncate">{product.keyActiveIngredient || product.activeIngredients}</span>
        </div>
      </div>

      {/* POLOŽKY MENU */}
      <div className="p-1.5 space-y-0.5">
        <button
          type="button"
          onClick={() => {
            onSwapProduct();
            onClose();
          }}
          className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FAF7F2] hover:text-[#8C6D2D] transition-colors flex items-center gap-2.5 font-medium cursor-pointer group"
        >
          <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 group-hover:bg-[#C5A059] group-hover:text-white transition-colors">
            <ArrowLeftRight className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-bold text-[#2C2A29] group-hover:text-[#8C6D2D]">Zmeniť za alternatívu...</div>
            <div className="text-[10px] text-[#8C837A]">Iná textúra, značka, lekáreň, Rx</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            onEditTitration();
            onClose();
          }}
          className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FAF7F2] hover:text-slate-800 transition-colors flex items-center gap-2.5 font-medium cursor-pointer group"
        >
          <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:bg-slate-700 group-hover:text-white transition-colors">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-bold text-[#2C2A29]">Frekvencia & Titrácia...</div>
            <div className="text-[10px] text-[#8C837A]">Upraviť rozpis aplikácie a upozornenia</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            onToggleAlreadyOwned();
            onClose();
          }}
          className={`w-full text-left px-3 py-2 rounded-xl transition-colors flex items-center gap-2.5 font-medium cursor-pointer group ${
            isOwned 
              ? 'bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-900' 
              : 'hover:bg-[#FAF7F2] text-[#2C2A29]'
          }`}
        >
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
            isOwned 
              ? 'bg-emerald-600 text-white' 
              : 'bg-stone-100 text-stone-700 group-hover:bg-emerald-600 group-hover:text-white'
          }`}>
            {isOwned ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Home className="w-3.5 h-3.5" />}
          </div>
          <div>
            <div className="font-bold">
              {isOwned ? '✓ Klient už vlastní doma' : 'Označiť: "Klient už má doma"'}
            </div>
            <div className="text-[10px] text-[#8C837A]">
              {isOwned ? 'Kliknutím zrušíte označenie' : 'Nezapočíta sa do nákupnej sumy'}
            </div>
          </div>
        </button>

        <div className="border-t border-[#E8E2D9] my-1" />

        <button
          type="button"
          onClick={() => {
            onRemoveProduct();
            onClose();
          }}
          className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-700 transition-colors flex items-center gap-2.5 font-medium cursor-pointer group"
        >
          <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 group-hover:bg-rose-600 group-hover:text-white transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-bold">Odstrániť krok z rutiny</div>
            <div className="text-[10px] text-rose-600/80">Vymazať tento produkt z protokolu</div>
          </div>
        </button>
      </div>
    </div>
  );
};
