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

  // Funkcia na zachytenie pravého kliknutia
  const handleContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault(); // Zrušíme štandardné menu prehliadača
    setPosition({ x: e.pageX, y: e.pageY });
    setTargetElement(e.target as HTMLElement);
  }, []);

  // Funkcia na zatvorenie menu pri kliknutí inam alebo stlačení klávesy
  const handleClick = useCallback(() => {
    if (position) setPosition(null);
  }, [position]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && position) setPosition(null);
  }, [position]);

  // Pridáme globálne event listenery
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

  // Identifikácia kontextu podľa elementu
  // (Môžete pridať logiku pre zistenie, či používateľ klikol na udalosť v kalendári)
  const isCalendarEvent = targetElement?.closest('[data-event-id]');
  const eventId = isCalendarEvent?.getAttribute('data-event-id');

  return (
    <>
      {children}

      {position && (
        <div
          className="fixed z-[100] bg-white border border-[#E8E2D9] rounded-xl shadow-xl overflow-hidden text-xs text-[#2C2A29] flex flex-col w-48 animate-fadeIn"
          style={{ top: position.y, left: position.x }}
          onClick={(e) => e.stopPropagation()} // Zabráni zatvoreniu pri kliknutí na samotné menu
        >
          {isCalendarEvent ? (
            <>
              {/* Možnosti špecifické pre udalosť v Kalendári */}
              <div className="px-3 py-2 border-b border-[#E8E2D9] bg-[#FBF9F6] font-bold text-[10px] text-[#8C857B] uppercase">
                Možnosti udalosti
              </div>
              <button 
                className="px-4 py-2.5 hover:bg-[#C5A059] hover:text-white text-left transition-colors font-semibold"
                onClick={() => {
                  console.log('Zrušiť udalosť', eventId);
                  // Tu by ste zavolali príslušnú funkciu na zrušenie
                  setPosition(null);
                }}
              >
                ❌ Zrušiť termín
              </button>
              <button 
                className="px-4 py-2.5 hover:bg-[#C5A059] hover:text-white text-left transition-colors font-semibold"
                onClick={() => {
                  console.log('Zmeniť úhradu', eventId);
                  // Tu by ste zavolali funkciu na zmenu úhrady
                  setPosition(null);
                }}
              >
                💳 Prepnúť úhradu zálohy
              </button>
            </>
          ) : (
            <>
              {/* Globálne možnosti pre celú stránku */}
              <div className="px-3 py-2 border-b border-[#E8E2D9] bg-[#FBF9F6] font-bold text-[10px] text-[#8C857B] uppercase">
                Rýchle akcie
              </div>
              <button 
                className="px-4 py-2.5 hover:bg-[#C5A059] hover:text-white text-left transition-colors font-semibold"
                onClick={() => { window.location.hash = '#home'; setPosition(null); }}
              >
                🏠 Návrat na domovskú obrazovku
              </button>
              <button 
                className="px-4 py-2.5 hover:bg-[#C5A059] hover:text-white text-left transition-colors font-semibold"
                onClick={() => { window.location.hash = '#calendar'; setPosition(null); }}
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