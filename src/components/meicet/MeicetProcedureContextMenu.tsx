import React, { useEffect, useRef } from 'react';
import { 
  ArrowLeftRight, 
  Calendar, 
  Trash2, 
  X, 
  Sparkles, 
  Flag, 
  Globe, 
  CheckCircle2, 
  ChevronRight 
} from 'lucide-react';
import { MeicetTreatmentPlanItem } from '@/types/meicet';

interface MeicetProcedureContextMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  treatment: MeicetTreatmentPlanItem | null;
  currentQuarterKey: 'q1_spring' | 'q2_summer' | 'q3_autumn' | 'q4_winter';
  onClose: () => void;
  onSwapProcedure: () => void;
  onEditProtocol?: () => void;
  onMoveQuarter: (targetQuarterKey: 'q1_spring' | 'q2_summer' | 'q3_autumn' | 'q4_winter') => void;
  onChangePriority: (priority: 'vysoká' | 'odporúčaná' | 'udržiavacia') => void;
  onToggleExternal: () => void;
  onRemoveProcedure: () => void;
}

export const MeicetProcedureContextMenu: React.FC<MeicetProcedureContextMenuProps> = ({
  isOpen,
  x,
  y,
  treatment,
  currentQuarterKey,
  onClose,
  onSwapProcedure,
  onEditProtocol,
  onMoveQuarter,
  onChangePriority,
  onToggleExternal,
  onRemoveProcedure
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showMoveSubmenu, setShowMoveSubmenu] = React.useState(false);
  const [showPrioritySubmenu, setShowPrioritySubmenu] = React.useState(false);

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

  if (!isOpen || !treatment) return null;

  const menuWidth = 280;
  const menuHeight = 340;
  const safeX = Math.max(12, Math.min(x, (typeof window !== 'undefined' ? window.innerWidth : 1200) - menuWidth - 16));
  const safeY = Math.max(12, Math.min(y, (typeof window !== 'undefined' ? window.innerHeight : 800) - menuHeight - 16));

  const quarterLabels: Record<'q1_spring' | 'q2_summer' | 'q3_autumn' | 'q4_winter', string> = {
    q1_spring: 'Q1 (Jan - Mar) • Jar',
    q2_summer: 'Q2 (Apr - Jún) • Leto',
    q3_autumn: 'Q3 (Júl - Sep) • Jeseň',
    q4_winter: 'Q4 (Okt - Dec) • Zima'
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-[200] w-[280px] bg-white/95 backdrop-blur-md border border-[#E8E2D9] rounded-2xl shadow-2xl overflow-visible text-xs text-[#2C2A29] flex flex-col animate-in fade-in zoom-in-95 duration-100 select-none"
      style={{ top: safeY, left: safeX }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* HLAVIČKA */}
      <div className="p-3 border-b border-[#E8E2D9] bg-gradient-to-r from-[#FAF8F5] via-white to-[#FAF8F5]">
        <div className="flex items-center justify-between gap-1.5 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#C5A059]/20 text-[#8C6D2D]">
            Procedúra ročného plánu
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8C837A] hover:text-[#2C2A29] p-0.5 rounded-lg hover:bg-black/5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <h4 className="font-serif font-bold text-xs text-[#2C2A29] truncate" title={treatment.name}>
          {treatment.name}
        </h4>
        <div className="text-[10px] text-[#8C837A] flex items-center justify-between mt-0.5">
          <span>{treatment.targetArea}</span>
          {treatment.estimatedPrice && (
            <span className="font-bold text-[#2C2A29]">{treatment.estimatedPrice} €</span>
          )}
        </div>
      </div>

      {/* POLOŽKY */}
      <div className="p-1.5 space-y-0.5">
        <button
          type="button"
          onClick={() => {
            onSwapProcedure();
            onClose();
          }}
          className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FAF7F2] hover:text-[#8C6D2D] transition-colors flex items-center gap-2.5 font-medium cursor-pointer group"
        >
          <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 group-hover:bg-[#C5A059] group-hover:text-white transition-colors">
            <ArrowLeftRight className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-bold text-[#2C2A29] group-hover:text-[#8C6D2D]">Zmeniť zákrok za alternatívu...</div>
            <div className="text-[10px] text-[#8C837A]">Výber z katalógu laserov a injekcií</div>
          </div>
        </button>

        {/* ÚPRAVA PROTOKOLU (KÚRA & UDRŽIAVANIE) */}
        {onEditProtocol && (
          <button
            type="button"
            onClick={() => {
              onEditProtocol();
              onClose();
            }}
            className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FAF7F2] hover:text-[#8C6D2D] transition-colors flex items-center gap-2.5 font-medium cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-bold text-[#2C2A29] group-hover:text-[#8C6D2D]">Upraviť protokol sedení...</div>
              <div className="text-[10px] text-[#8C837A] truncate max-w-[200px]">
                {treatment.protocol?.summaryDisplay || `Kúra: ${treatment.sessionsCount || 1}x ➔ Udržiavanie`}
              </div>
            </div>
          </button>
        )}

        {/* PRESUN DO KVARTÁLU */}
        <div className="relative">
          <button
            type="button"
            onMouseEnter={() => {
              setShowMoveSubmenu(true);
              setShowPrioritySubmenu(false);
            }}
            onClick={() => setShowMoveSubmenu(!showMoveSubmenu)}
            className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FAF7F2] transition-colors flex items-center justify-between font-medium cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-bold text-[#2C2A29]">Presunúť do sezóny...</div>
                <div className="text-[10px] text-[#8C837A] truncate">
                  Aktuálne: {quarterLabels[currentQuarterKey]}
                </div>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#8C837A]" />
          </button>

          {/* SUBMENU PRE SEZÓNY */}
          {showMoveSubmenu && (
            <div 
              className="absolute left-full top-0 ml-1 w-52 bg-white border border-[#E8E2D9] rounded-2xl shadow-xl p-1.5 z-[210] animate-in fade-in"
              onMouseLeave={() => setShowMoveSubmenu(false)}
            >
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#8C837A] px-2 py-1">
                Vyberte cieľový kvartál
              </div>
              {(['q1_spring', 'q2_summer', 'q3_autumn', 'q4_winter'] as const).map(qKey => (
                <button
                  key={qKey}
                  type="button"
                  disabled={qKey === currentQuarterKey}
                  onClick={() => {
                    onMoveQuarter(qKey);
                    onClose();
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                    qKey === currentQuarterKey 
                      ? 'bg-amber-50 text-amber-900 font-bold opacity-60 cursor-default' 
                      : 'hover:bg-[#FAF7F2] text-[#2C2A29]'
                  }`}
                >
                  <span>{quarterLabels[qKey]}</span>
                  {qKey === currentQuarterKey && <CheckCircle2 className="w-3 h-3 text-[#C5A059]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ZMENA PRIORITY */}
        <div className="relative">
          <button
            type="button"
            onMouseEnter={() => {
              setShowPrioritySubmenu(true);
              setShowMoveSubmenu(false);
            }}
            onClick={() => setShowPrioritySubmenu(!showPrioritySubmenu)}
            className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FAF7F2] transition-colors flex items-center justify-between font-medium cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Flag className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-bold text-[#2C2A29]">Zmeniť prioritu...</div>
                <div className="text-[10px] text-[#8C837A]">Aktuálne: {treatment.priority}</div>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#8C837A]" />
          </button>

          {/* SUBMENU PRE PRIORITU */}
          {showPrioritySubmenu && (
            <div 
              className="absolute left-full top-0 ml-1 w-44 bg-white border border-[#E8E2D9] rounded-2xl shadow-xl p-1.5 z-[210] animate-in fade-in"
              onMouseLeave={() => setShowPrioritySubmenu(false)}
            >
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#8C837A] px-2 py-1">
                Stupeň priority
              </div>
              {(['vysoká', 'odporúčaná', 'udržiavacia'] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    onChangePriority(p);
                    onClose();
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                    treatment.priority === p 
                      ? 'bg-purple-50 text-purple-900 font-bold' 
                      : 'hover:bg-[#FAF7F2] text-[#2C2A29]'
                  }`}
                >
                  <span className="capitalize">{p}</span>
                  {treatment.priority === p && <CheckCircle2 className="w-3 h-3 text-purple-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* EXTERNÝ ZÁKROK TOGGLE */}
        <button
          type="button"
          onClick={() => {
            onToggleExternal();
            onClose();
          }}
          className={`w-full text-left px-3 py-2 rounded-xl transition-colors flex items-center gap-2.5 font-medium cursor-pointer group ${
            treatment.isExternal 
              ? 'bg-stone-100 text-stone-900' 
              : 'hover:bg-[#FAF7F2] text-[#2C2A29]'
          }`}
        >
          <div className="w-6 h-6 rounded-lg bg-stone-200 text-stone-700 flex items-center justify-center shrink-0 group-hover:bg-stone-700 group-hover:text-white transition-colors">
            <Globe className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-bold">
              {treatment.isExternal ? '✓ Označené ako externý zákrok' : 'Označiť ako externý zákrok'}
            </div>
            <div className="text-[10px] text-[#8C837A]">
              Mimo ponuky kliniky SAY CLINIC
            </div>
          </div>
        </button>

        <div className="border-t border-[#E8E2D9] my-1" />

        {/* ODSTRÁNIŤ Z PLÁNU */}
        <button
          type="button"
          onClick={() => {
            onRemoveProcedure();
            onClose();
          }}
          className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-700 transition-colors flex items-center gap-2.5 font-medium cursor-pointer group"
        >
          <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 group-hover:bg-rose-600 group-hover:text-white transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-bold">Odstrániť z plánu</div>
            <div className="text-[10px] text-rose-600/80">Vymazať procedúru z tohto kvartálu</div>
          </div>
        </button>
      </div>
    </div>
  );
};
