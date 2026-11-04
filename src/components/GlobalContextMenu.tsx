'use client';

import React, { useState, useEffect, useCallback, ReactNode } from 'react';

interface MenuPosition {
  x: number;
  y: number;
}

interface GlobalContextMenuProps {
  children: ReactNode;
}

export default function GlobalContextMenu({ children }: GlobalContextMenuProps) {
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  const handleContextMenu = useCallback((e: MouseEvent) => {
    if (e.defaultPrevented) return;
    
    e.preventDefault();
    const x = Math.min(e.clientX, window.innerWidth - 220);
    const y = Math.min(e.clientY, window.innerHeight - 280);
    setPosition({ x: Math.max(8, x), y: Math.max(8, y) });
    setTargetElement(e.target as HTMLElement);
  }, []);

  const handleClick = useCallback(() => {
    if (position) setPosition(null);
  }, [position]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && position) setPosition(null);
  }, [position]);

  useEffect(() => {
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleContextMenu, handleClick, handleKeyDown]);

  const isCalendarEvent = targetElement?.closest('[data-event-id]');
  const eventId = isCalendarEvent?.getAttribute('data-event-id');

  const dispatchCalendarAction = (action: string) => {
    if (!eventId) return;
    window.dispatchEvent(
      new CustomEvent('say_calendar_context_action', {
        detail: { eventId, action },
      })
    );
    setPosition(null);
  };

  return (
    <>
      {children}

      {position && (
        <div
          className="fixed z-[100] bg-white border border-[#E8E2D9] rounded-xl shadow-2xl overflow-hidden text-xs text-[#2C2A29] flex flex-col w-56 animate-fadeIn"
          style={{ top: position.y, left: position.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {isCalendarEvent && eventId ? (
            <>
              <div className="px-3 py-2 border-b border-[#E8E2D9] bg-[#FBF9F6] font-bold text-[10px] text-[#8C857B] uppercase tracking-wider">
                Akcie s termínom
              </div>
              <button 
                type="button"
                className="px-3.5 py-2 hover:bg-[#FAF8F5] text-left transition-colors font-semibold flex items-center gap-2 cursor-pointer"
                onClick={() => dispatchCalendarAction('detail')}
              >
                <span>🔍</span> Otvoriť detail termínu
              </button>
              <button 
                type="button"
                className="px-3.5 py-2 hover:bg-[#FAF8F5] text-left transition-colors font-semibold flex items-center gap-2 cursor-pointer"
                onClick={() => dispatchCalendarAction('edit')}
              >
                <span>✏️</span> Upraviť termín
              </button>
              <button 
                type="button"
                className="px-3.5 py-2 hover:bg-[#FAF8F5] text-left transition-colors font-semibold flex items-center gap-2 cursor-pointer"
                onClick={() => dispatchCalendarAction('folder')}
              >
                <span>📁</span> Otvoriť kartu pacienta
              </button>
              <button 
                type="button"
                className="px-3.5 py-2 hover:bg-[#FAF8F5] text-left transition-colors font-semibold flex items-center gap-2 cursor-pointer"
                onClick={() => dispatchCalendarAction('deposit')}
              >
                <span>💳</span> Prepnúť úhradu zálohy
              </button>
              <button 
                type="button"
                className="px-3.5 py-2 hover:bg-[#FAF8F5] text-left transition-colors font-semibold flex items-center gap-2 cursor-pointer"
                onClick={() => dispatchCalendarAction('duplicate')}
              >
                <span>📋</span> Duplikovať termín
              </button>
              <div className="border-t border-[#E8E2D9]/80 my-0.5" />
              <button 
                type="button"
                className="px-3.5 py-2 hover:bg-amber-50 text-amber-800 text-left transition-colors font-semibold flex items-center gap-2 cursor-pointer"
                onClick={() => dispatchCalendarAction('cancel')}
              >
                <span>❌</span> Zrušiť termín (Storno)
              </button>
              <button 
                type="button"
                className="px-3.5 py-2 hover:bg-rose-50 text-rose-700 text-left transition-colors font-semibold flex items-center gap-2 cursor-pointer"
                onClick={() => dispatchCalendarAction('delete')}
              >
                <span>🗑️</span> Natrvalo zmazať
              </button>
            </>
          ) : (
            <>
              <div className="px-3 py-2 border-b border-[#E8E2D9] bg-[#FBF9F6] font-bold text-[10px] text-[#8C857B] uppercase tracking-wider">
                Rýchle akcie
              </div>
              <button 
                type="button"
                className="px-4 py-2.5 hover:bg-[#C5A059] hover:text-white text-left transition-colors font-semibold cursor-pointer"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('say_navigate_tab', { detail: 'home' }));
                  setPosition(null);
                }}
              >
                🏠 Domovská obrazovka
              </button>
              <button 
                type="button"
                className="px-4 py-2.5 hover:bg-[#C5A059] hover:text-white text-left transition-colors font-semibold cursor-pointer"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('say_navigate_tab', { detail: 'calendar' }));
                  setPosition(null);
                }}
              >
                📅 Otvoriť Kalendár
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
