'use client';

import React, { useEffect, useRef } from 'react';
import { 
  Type, 
  X, 
  RotateCcw, 
  Move, 
  Check, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';

export interface ElementFontStyle {
  fontFamily: 'monospace' | 'sans-serif' | 'serif' | 'fira-code' | 'georgia';
  fontSize: number; // in pt
  fontWeight: '400' | '500' | '600' | '700' | '800';
  fontStyle: 'normal' | 'italic';
  textTransform: 'none' | 'uppercase';
  letterSpacing: number; // in mm
  lineHeight: number; // multiplier
  color: string;
  textAlign?: 'left' | 'center' | 'right';
}

export interface ElementOffset {
  x: number; // in mm
  y: number; // in mm
}

interface PrescriptionFontContextMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  elementKey: string;
  elementLabel: string;
  fontStyle: ElementFontStyle;
  offset: ElementOffset;
  onUpdateFont: (elementKey: string, updates: Partial<ElementFontStyle>) => void;
  onUpdateOffset: (elementKey: string, offset: ElementOffset) => void;
  onResetFont: (elementKey: string) => void;
  onResetOffset: (elementKey: string) => void;
  onApplyFontToAll?: (style: ElementFontStyle) => void;
  onClose: () => void;
}

export const FONT_FAMILY_MAP: Record<string, string> = {
  'monospace': "'Courier New', Courier, 'Lucida Console', Monaco, monospace",
  'sans-serif': "Arial, Helvetica, -apple-system, BlinkMacSystemFont, sans-serif",
  'serif': "'Times New Roman', Times, Baskerville, Georgia, serif",
  'fira-code': "'Fira Code', Menlo, Consolas, monospace",
  'georgia': "Georgia, Cambria, serif"
};

export default function PrescriptionFontContextMenu({
  isOpen,
  x,
  y,
  elementKey,
  elementLabel,
  fontStyle,
  offset,
  onUpdateFont,
  onUpdateOffset,
  onResetFont,
  onResetOffset,
  onApplyFontToAll,
  onClose
}: PrescriptionFontContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('mousedown', handleClickOutside, true);
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside, true);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Calculate position to prevent overflowing screen
  const menuWidth = 330;
  const menuHeight = 520;
  const safeX = typeof window !== 'undefined' ? Math.min(x, window.innerWidth - menuWidth - 16) : x;
  const safeY = typeof window !== 'undefined' ? Math.min(y, window.innerHeight - menuHeight - 16) : y;
  const finalX = Math.max(12, safeX);
  const finalY = Math.max(12, safeY);

  const handleNudge = (dx: number, dy: number) => {
    onUpdateOffset(elementKey, {
      x: Math.round((offset.x + dx) * 10) / 10,
      y: Math.round((offset.y + dy) * 10) / 10
    });
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-[330px] bg-white rounded-2xl shadow-2xl border border-[#C5A059]/40 p-4 space-y-3.5 text-[#2C2A29] select-none animate-in fade-in zoom-in-95 duration-150"
      style={{
        left: `${finalX}px`,
        top: `${finalY}px`,
        maxHeight: '90vh',
        overflowY: 'auto'
      }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-2.5">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-[#C5A059]/15 text-[#C5A059] rounded-lg">
            <Type className="w-4 h-4" />
          </span>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#8C857B]">
              Nastavenie písma časti
            </div>
            <div className="text-xs font-bold text-[#2C2A29] truncate max-w-[200px]" title={elementLabel}>
              {elementLabel}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-[#F3EFEA] text-[#8C857B] hover:text-[#2C2A29] transition-colors cursor-pointer"
          title="Zavrieť (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 1. TYP PÍSMA (RODINA) */}
      <div>
        <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1.5">
          Typ písma (Font)
        </label>
        <div className="grid grid-cols-3 gap-1.5 text-[11px]">
          <button
            type="button"
            onClick={() => onUpdateFont(elementKey, { fontFamily: 'monospace' })}
            className={`py-1.5 px-2 rounded-lg font-mono font-bold border transition-all text-center cursor-pointer ${
              fontStyle.fontFamily === 'monospace'
                ? 'bg-[#2C2A29] text-white border-[#2C2A29] shadow-xs'
                : 'bg-[#FBF9F6] border-[#E8E2D9] text-[#2C2A29] hover:bg-[#E8E2D9]'
            }`}
          >
            Strojopis
          </button>
          <button
            type="button"
            onClick={() => onUpdateFont(elementKey, { fontFamily: 'sans-serif' })}
            className={`py-1.5 px-2 rounded-lg font-sans font-bold border transition-all text-center cursor-pointer ${
              fontStyle.fontFamily === 'sans-serif'
                ? 'bg-[#2C2A29] text-white border-[#2C2A29] shadow-xs'
                : 'bg-[#FBF9F6] border-[#E8E2D9] text-[#2C2A29] hover:bg-[#E8E2D9]'
            }`}
          >
            Arial
          </button>
          <button
            type="button"
            onClick={() => onUpdateFont(elementKey, { fontFamily: 'serif' })}
            className={`py-1.5 px-2 rounded-lg font-serif font-bold border transition-all text-center cursor-pointer ${
              fontStyle.fontFamily === 'serif'
                ? 'bg-[#2C2A29] text-white border-[#2C2A29] shadow-xs'
                : 'bg-[#FBF9F6] border-[#E8E2D9] text-[#2C2A29] hover:bg-[#E8E2D9]'
            }`}
          >
            Times
          </button>
        </div>
      </div>

      {/* 2. VEĽKOSŤ PÍSMA (pt) */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] uppercase font-bold text-[#8C857B]">
            Veľkosť písma
          </label>
          <span className="font-mono text-xs font-bold text-[#047857]">
            {fontStyle.fontSize.toFixed(1)} pt
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onUpdateFont(elementKey, { fontSize: Math.max(6, Math.round((fontStyle.fontSize - 0.5) * 10) / 10) })}
            className="px-2.5 py-1 bg-[#FBF9F6] hover:bg-[#E8E2D9] border border-[#E8E2D9] rounded-lg font-bold text-xs cursor-pointer"
            title="Zmenšiť písmo"
          >
            A-
          </button>
          <input
            type="range"
            min="6"
            max="18"
            step="0.5"
            value={fontStyle.fontSize}
            onChange={(e) => onUpdateFont(elementKey, { fontSize: parseFloat(e.target.value) })}
            className="flex-1 accent-[#C5A059] cursor-pointer"
          />
          <button
            type="button"
            onClick={() => onUpdateFont(elementKey, { fontSize: Math.min(22, Math.round((fontStyle.fontSize + 0.5) * 10) / 10) })}
            className="px-2.5 py-1 bg-[#FBF9F6] hover:bg-[#E8E2D9] border border-[#E8E2D9] rounded-lg font-bold text-xs cursor-pointer"
            title="Zväčšiť písmo"
          >
            A+
          </button>
        </div>
      </div>

      {/* 3. HRÚBKA PÍSMA (WEIGHT) */}
      <div>
        <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1.5">
          Hrúbka písma
        </label>
        <div className="grid grid-cols-4 gap-1 text-[10px]">
          {[
            { id: '400', label: 'Tenké', weight: 'normal' },
            { id: '500', label: 'Stredné', weight: '500' },
            { id: '600', label: 'Polotučné', weight: '600' },
            { id: '700', label: 'Tučné', weight: 'bold' }
          ].map(w => (
            <button
              key={w.id}
              type="button"
              onClick={() => onUpdateFont(elementKey, { fontWeight: w.id as any })}
              className={`py-1 rounded-lg border font-semibold text-center transition-all cursor-pointer ${
                fontStyle.fontWeight === w.id
                  ? 'bg-[#2C2A29] text-white border-[#2C2A29]'
                  : 'bg-[#FBF9F6] border-[#E8E2D9] text-[#2C2A29] hover:bg-[#E8E2D9]'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. ŠTÝL, TRANSFORMÁCIA A ZAROVNANIE */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">
            Štýl textu
          </label>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onUpdateFont(elementKey, { 
                fontStyle: fontStyle.fontStyle === 'italic' ? 'normal' : 'italic' 
              })}
              className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-serif font-bold italic flex items-center justify-center gap-1 cursor-pointer ${
                fontStyle.fontStyle === 'italic'
                  ? 'bg-[#C5A059] text-white border-[#B38F46]'
                  : 'bg-[#FBF9F6] border-[#E8E2D9] text-[#2C2A29] hover:bg-[#E8E2D9]'
              }`}
              title="Kurzíva"
            >
              <Italic className="w-3.5 h-3.5" />
              <span>Kurzíva</span>
            </button>
            <button
              type="button"
              onClick={() => onUpdateFont(elementKey, { 
                textTransform: fontStyle.textTransform === 'uppercase' ? 'none' : 'uppercase' 
              })}
              className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-bold uppercase flex items-center justify-center gap-1 cursor-pointer ${
                fontStyle.textTransform === 'uppercase'
                  ? 'bg-[#C5A059] text-white border-[#B38F46]'
                  : 'bg-[#FBF9F6] border-[#E8E2D9] text-[#2C2A29] hover:bg-[#E8E2D9]'
              }`}
              title="Veľké písmená"
            >
              <span>ABC</span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">
            Zarovnanie
          </label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onUpdateFont(elementKey, { textAlign: 'left' })}
              className={`flex-1 p-1.5 rounded-lg border flex justify-center items-center cursor-pointer ${
                (fontStyle.textAlign || 'left') === 'left'
                  ? 'bg-[#2C2A29] text-white border-[#2C2A29]'
                  : 'bg-[#FBF9F6] border-[#E8E2D9] text-[#2C2A29] hover:bg-[#E8E2D9]'
              }`}
              title="Vľavo"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onUpdateFont(elementKey, { textAlign: 'center' })}
              className={`flex-1 p-1.5 rounded-lg border flex justify-center items-center cursor-pointer ${
                fontStyle.textAlign === 'center'
                  ? 'bg-[#2C2A29] text-white border-[#2C2A29]'
                  : 'bg-[#FBF9F6] border-[#E8E2D9] text-[#2C2A29] hover:bg-[#E8E2D9]'
              }`}
              title="Na stred"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onUpdateFont(elementKey, { textAlign: 'right' })}
              className={`flex-1 p-1.5 rounded-lg border flex justify-center items-center cursor-pointer ${
                fontStyle.textAlign === 'right'
                  ? 'bg-[#2C2A29] text-white border-[#2C2A29]'
                  : 'bg-[#FBF9F6] border-[#E8E2D9] text-[#2C2A29] hover:bg-[#E8E2D9]'
              }`}
              title="Vpravo"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. MEDZERY A RIADKOVANIE */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] uppercase font-bold text-[#8C857B]">Rozostup písmen</span>
            <span className="font-mono text-[10px] text-[#047857]">{fontStyle.letterSpacing.toFixed(2)} mm</span>
          </div>
          <input
            type="range"
            min="-1.5"
            max="3.0"
            step="0.05"
            value={fontStyle.letterSpacing}
            onChange={(e) => onUpdateFont(elementKey, { letterSpacing: Math.round(parseFloat(e.target.value) * 100) / 100 })}
            className="w-full accent-[#C5A059] cursor-pointer"
          />
          <div className="flex items-center justify-between gap-1 mt-1 text-[9px]">
            <button
              type="button"
              onClick={() => onUpdateFont(elementKey, { letterSpacing: -0.5 })}
              className={`px-1 py-0.5 rounded border transition-colors cursor-pointer ${
                fontStyle.letterSpacing === -0.5
                  ? 'bg-[#2C2A29] text-white border-[#2C2A29]'
                  : 'bg-[#FBF9F6] border-[#E8E2D9] text-[#2C2A29] hover:bg-[#E8E2D9]'
              }`}
              title="Veľmi tesné medzery"
            >
              -0.5mm
            </button>
            <button
              type="button"
              onClick={() => onUpdateFont(elementKey, { letterSpacing: -0.2 })}
              className={`px-1 py-0.5 rounded border transition-colors cursor-pointer ${
                fontStyle.letterSpacing === -0.2
                  ? 'bg-[#2C2A29] text-white border-[#2C2A29]'
                  : 'bg-[#FBF9F6] border-[#E8E2D9] text-[#2C2A29] hover:bg-[#E8E2D9]'
              }`}
              title="Kompaktné tesné medzery"
            >
              -0.2mm
            </button>
            <button
              type="button"
              onClick={() => onUpdateFont(elementKey, { letterSpacing: 0 })}
              className={`px-1 py-0.5 rounded border transition-colors cursor-pointer ${
                fontStyle.letterSpacing === 0
                  ? 'bg-[#2C2A29] text-white border-[#2C2A29]'
                  : 'bg-[#FBF9F6] border-[#E8E2D9] text-[#2C2A29] hover:bg-[#E8E2D9]'
              }`}
              title="Štandardné medzery"
            >
              0mm
            </button>
            <button
              type="button"
              onClick={() => onUpdateFont(elementKey, { letterSpacing: 0.3 })}
              className={`px-1 py-0.5 rounded border transition-colors cursor-pointer ${
                fontStyle.letterSpacing === 0.3
                  ? 'bg-[#2C2A29] text-white border-[#2C2A29]'
                  : 'bg-[#FBF9F6] border-[#E8E2D9] text-[#2C2A29] hover:bg-[#E8E2D9]'
              }`}
              title="Voľnejšie medzery"
            >
              +0.3mm
            </button>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] uppercase font-bold text-[#8C857B]">Riadkovanie</span>
            <span className="font-mono text-[10px] text-[#047857]">{fontStyle.lineHeight}×</span>
          </div>
          <input
            type="range"
            min="0.9"
            max="1.8"
            step="0.05"
            value={fontStyle.lineHeight}
            onChange={(e) => onUpdateFont(elementKey, { lineHeight: parseFloat(e.target.value) })}
            className="w-full accent-[#C5A059] cursor-pointer"
          />
        </div>
      </div>

      {/* 6. FARBA TLAČE */}
      <div>
        <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1.5">
          Farba textu
        </label>
        <div className="flex items-center gap-2">
          {[
            { color: '#000000', label: 'Čierna (Odporúčaná)' },
            { color: '#2C2A29', label: 'Uhlíková' },
            { color: '#1E3A8A', label: 'Modrá' },
            { color: '#4B5563', label: 'Sivá' }
          ].map(c => (
            <button
              key={c.color}
              type="button"
              onClick={() => onUpdateFont(elementKey, { color: c.color })}
              className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer ${
                fontStyle.color === c.color ? 'border-[#C5A059] ring-2 ring-[#C5A059]/30 scale-110' : 'border-white'
              }`}
              style={{ backgroundColor: c.color }}
              title={c.label}
            >
              {fontStyle.color === c.color && (
                <Check className="w-3.5 h-3.5 text-white" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 7. MANUÁLNY POSUN TEJTO ČASTI (NUDGE ŠÍPKY) */}
      <div className="pt-2 border-t border-[#E8E2D9]">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Move className="w-3.5 h-3.5 text-[#C5A059]" />
            <span className="text-[10px] uppercase font-bold text-[#8C857B]">
              Manuálny posun časti
            </span>
          </div>
          <span className="font-mono text-[10px] px-1.5 py-0.5 bg-[#FAF8F5] rounded border border-[#E8E2D9] text-[#2C2A29] font-bold">
            X:{offset.x > 0 ? `+${offset.x}` : offset.x} Y:{offset.y > 0 ? `+${offset.y}` : offset.y} mm
          </span>
        </div>

        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleNudge(-0.5, 0)}
              className="p-1.5 bg-[#FBF9F6] hover:bg-[#E8E2D9] border border-[#E8E2D9] rounded-lg cursor-pointer"
              title="Posunúť vľavo o 0.5 mm"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#2C2A29]" />
            </button>
            <button
              type="button"
              onClick={() => handleNudge(0, -0.5)}
              className="p-1.5 bg-[#FBF9F6] hover:bg-[#E8E2D9] border border-[#E8E2D9] rounded-lg cursor-pointer"
              title="Posunúť nahor o 0.5 mm"
            >
              <ArrowUp className="w-3.5 h-3.5 text-[#2C2A29]" />
            </button>
            <button
              type="button"
              onClick={() => handleNudge(0, 0.5)}
              className="p-1.5 bg-[#FBF9F6] hover:bg-[#E8E2D9] border border-[#E8E2D9] rounded-lg cursor-pointer"
              title="Posunúť nadol o 0.5 mm"
            >
              <ArrowDown className="w-3.5 h-3.5 text-[#2C2A29]" />
            </button>
            <button
              type="button"
              onClick={() => handleNudge(0.5, 0)}
              className="p-1.5 bg-[#FBF9F6] hover:bg-[#E8E2D9] border border-[#E8E2D9] rounded-lg cursor-pointer"
              title="Posunúť vpravo o 0.5 mm"
            >
              <ArrowRight className="w-3.5 h-3.5 text-[#2C2A29]" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onResetOffset(elementKey)}
            className="px-2 py-1 text-[10px] text-[#8C857B] hover:text-[#DC2626] font-semibold transition-colors cursor-pointer"
            title="Resetovať posun tohto textu"
          >
            Reset pozície
          </button>
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="pt-2 border-t border-[#E8E2D9] flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => onResetFont(elementKey)}
          className="text-[10px] text-[#8C857B] hover:text-[#DC2626] font-semibold flex items-center gap-1 cursor-pointer"
          title="Vrátiť predvolené písmo pre túto časť"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset písma</span>
        </button>

        <div className="flex items-center gap-2">
          {onApplyFontToAll && (
            <button
              type="button"
              onClick={() => onApplyFontToAll(fontStyle)}
              className="text-[10px] text-[#C5A059] hover:underline font-bold cursor-pointer"
              title="Aplikovať tento font na všetky texty receptu"
            >
              Pre všetky
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-[#2C2A29] hover:bg-black text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
          >
            Hotovo
          </button>
        </div>
      </div>
    </div>
  );
}
