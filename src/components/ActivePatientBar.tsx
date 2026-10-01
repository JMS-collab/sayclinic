'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Patient } from './PatientDatabase';
import { 
  User, 
  FolderOpen, 
  FileText, 
  Pill, 
  Sparkles, 
  ShoppingBag, 
  RefreshCw, 
  X, 
  Search, 
  Calendar as CalendarIcon,
  ChevronDown,
  ShieldCheck,
  Phone,
  Clock
} from 'lucide-react';

interface ActivePatientBarProps {
  activePatient: Patient | null;
  allPatients: Patient[];
  currentTab: string;
  onNavigateToTab: (tab: any, extra?: any) => void;
  onSelectPatient: (patient: Patient) => void;
  onClearActivePatient: () => void;
}

export default function ActivePatientBar({
  activePatient,
  allPatients,
  currentTab,
  onNavigateToTab,
  onSelectPatient,
  onClearActivePatient
}: ActivePatientBarProps) {
  const [showSwitchDropdown, setShowSwitchDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    if (!showSwitchDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSwitchDropdown(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [showSwitchDropdown]);

  if (!activePatient) return null;

  // Filter patients for quick switch
  const filteredPatients = allPatients.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.birthNumber.toLowerCase().includes(q) ||
      (p.phone && p.phone.toLowerCase().includes(q))
    );
  }).slice(0, 6);

  // Calculate approximate age from birthNumber if available
  const getAge = (rc?: string) => {
    if (!rc || rc.length < 2) return '';
    try {
      const yearPrefix = parseInt(rc.substring(0, 2), 10);
      const fullYear = yearPrefix > 30 ? 1900 + yearPrefix : 2000 + yearPrefix;
      const age = new Date().getFullYear() - fullYear;
      return `${age} r.`;
    } catch {
      return '';
    }
  };

  const patientAge = getAge(activePatient.birthNumber);

  return (
    <div className="bg-gradient-to-r from-[#FAF8F5] via-white to-[#FAF8F5] border-b-2 border-[#C5A059]/40 shadow-xs z-30 sticky top-[73px] print:hidden animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        
        {/* VĽAVO: IDENTIFIKÁCIA ROZPRACOVANÉHO PACIENTA */}
        <div className="flex items-center gap-3 min-w-0">
          
          {/* ŽIVÝ PULZUJÚCI INDIKÁTOR */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold uppercase tracking-wider shrink-0 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Rozpracovaný pacient</span>
          </div>

          {/* AVATAR / INICIÁLY */}
          <div 
            onClick={() => onNavigateToTab('patients')}
            className="w-8 h-8 rounded-full bg-[#2C2A29] text-[#C5A059] border border-[#C5A059] flex items-center justify-center font-bold text-xs shrink-0 cursor-pointer shadow-xs hover:scale-105 transition-transform"
            title="Kliknutím otvoríte kartu pacienta"
          >
            {activePatient.name ? activePatient.name.split(' ').map(n => n[0]).slice(0, 2).join('') : 'P'}
          </div>

          {/* MENO A KĽÚČOVÉ ÚDAJE */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigateToTab('patients')}
                className="font-brand font-bold text-sm text-[#2C2A29] hover:text-[#C5A059] transition-colors truncate text-left cursor-pointer flex items-center gap-1"
                title="Otvoriť zdravotnú kartu pacienta"
              >
                <span>{activePatient.name}</span>
                <span className="text-[10px] text-[#8C857B] font-normal hover:underline">➔</span>
              </button>
              
              {patientAge && (
                <span className="text-[10px] bg-[#F3EFEA] text-[#2C2A29] px-1.5 py-0.5 rounded font-medium">
                  {patientAge}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-[#8C857B]">
              <span className="font-mono font-medium text-[#2C2A29]">
                RČ: {activePatient.birthNumber}
              </span>
              <span>•</span>
              <span className="truncate max-w-[120px]">
                {activePatient.insurance || 'Dôvera'}
              </span>
              {activePatient.phone && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-0.5 font-mono text-[10px]">
                    <Phone className="w-2.5 h-2.5 text-[#C5A059]" />
                    {activePatient.phone}
                  </span>
                </>
              )}
            </div>
          </div>

        </div>

        {/* V STREDE: RÝCHLE AKCIE S TÝMTO ROZPRACOVANÝM PACIENTOM */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          
          {/* 1. KARTA PACIENTA (KARTOTÉKA) */}
          <button
            type="button"
            onClick={() => onNavigateToTab('patients')}
            className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer border shadow-xs ${
              currentTab === 'patients'
                ? 'bg-[#2C2A29] text-white border-[#2C2A29]'
                : 'bg-white hover:bg-[#FAF8F5] text-[#2C2A29] border-[#E8E2D9] hover:border-[#C5A059]'
            }`}
            title="Prejsť na kompletnú zdravotnú kartu a dokumentáciu"
          >
            <FolderOpen className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Karta pacienta</span>
          </button>

          {/* 2. LEKÁRSKA SPRÁVA / DEKURZ */}
          <button
            type="button"
            onClick={() => onNavigateToTab('generator')}
            className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer border shadow-xs ${
              currentTab === 'generator'
                ? 'bg-[#2C2A29] text-white border-[#2C2A29]'
                : 'bg-white hover:bg-[#FAF8F5] text-[#2C2A29] border-[#E8E2D9] hover:border-[#C5A059]'
            }`}
            title="Otvoriť generátor lekárskeho nálezu pre tohto pacienta"
          >
            <FileText className="w-3.5 h-3.5 text-[#047857]" />
            <span>Nález / Dekurz</span>
          </button>

          {/* 3. RECEPT (ŠEVT) */}
          <button
            type="button"
            onClick={() => onNavigateToTab('prescriptions')}
            className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer border shadow-xs ${
              currentTab === 'prescriptions'
                ? 'bg-[#2C2A29] text-white border-[#2C2A29]'
                : 'bg-white hover:bg-[#FAF8F5] text-[#2C2A29] border-[#E8E2D9] hover:border-[#C5A059]'
            }`}
            title="Vystaviť lekársky recept ŠEVT 14 282 2s pre tohto pacienta"
          >
            <Pill className="w-3.5 h-3.5 text-emerald-600" />
            <span>Recept Rp.</span>
          </button>

          {/* 4. ESTETIKA & FOTO */}
          <button
            type="button"
            onClick={() => onNavigateToTab('aesthetics')}
            className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer border shadow-xs ${
              currentTab === 'aesthetics'
                ? 'bg-[#2C2A29] text-white border-[#2C2A29]'
                : 'bg-white hover:bg-[#FAF8F5] text-[#2C2A29] border-[#E8E2D9] hover:border-[#C5A059]'
            }`}
            title="Aplikácia botoxu, výplní a fotodokumentácia"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Estetika</span>
          </button>

          {/* 5. PREDAJ KOZMETIKY (POS) */}
          <button
            type="button"
            onClick={() => onNavigateToTab('cosmetics')}
            className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer border shadow-xs ${
              currentTab === 'cosmetics'
                ? 'bg-[#2C2A29] text-white border-[#2C2A29]'
                : 'bg-white hover:bg-[#FAF8F5] text-[#2C2A29] border-[#E8E2D9] hover:border-[#C5A059]'
            }`}
            title="Pultový predaj a vydanie dermokozmetiky"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden md:inline">POS Predaj</span>
          </button>

        </div>

        {/* VPRAVO: ZMENA PACIENTA / VYČISTENIE */}
        <div className="flex items-center gap-1.5 relative" ref={dropdownRef}>
          
          {/* TLAČIDLO ZMENIŤ PACIENTA */}
          <button
            type="button"
            onClick={() => setShowSwitchDropdown(!showSwitchDropdown)}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-[#8C857B] hover:text-[#2C2A29] hover:bg-white border border-transparent hover:border-[#E8E2D9] flex items-center gap-1 transition-all cursor-pointer"
            title="Zmeniť rozpracovaného pacienta"
          >
            <RefreshCw className={`w-3.5 h-3.5 transition-transform ${showSwitchDropdown ? 'rotate-180 text-[#C5A059]' : ''}`} />
            <span className="hidden sm:inline">Zmeniť pacienta</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {/* UKONČIŤ PRÁCU S PACIENTOM */}
          <button
            type="button"
            onClick={onClearActivePatient}
            className="p-1.5 rounded-xl text-[#8C857B] hover:text-[#DC2626] hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
            title="Ukončiť rozpracovanie tohto pacienta"
          >
            <X className="w-4 h-4" />
          </button>

          {/* DROPDOWN PRE RÝCHLY VÝBER INÉHO PACIENTA */}
          {showSwitchDropdown && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#E8E2D9] p-3 z-50 space-y-2 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#E8E2D9]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C857B]">
                  Vybrať iného pacienta
                </span>
                <button
                  type="button"
                  onClick={() => setShowSwitchDropdown(false)}
                  className="text-[#8C857B] hover:text-[#2C2A29] text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* HĽADANIE PACIENTA */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#8C857B]" />
                <input
                  type="text"
                  placeholder="Hľadať meno, RČ, telefón..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-8 pr-3 py-1.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-xs outline-none focus:border-[#C5A059]"
                />
              </div>

              {/* ZOZNAM FILTROVANÝCH PACIENTOV */}
              <div className="max-h-56 overflow-y-auto space-y-1">
                {filteredPatients.length === 0 ? (
                  <p className="text-[11px] text-[#8C857B] text-center py-3">
                    Žiadny pacient sa nenašiel
                  </p>
                ) : (
                  filteredPatients.map((p) => {
                    const isCurrent = p.id === activePatient.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          onSelectPatient(p);
                          setShowSwitchDropdown(false);
                          setSearchQuery('');
                        }}
                        className={`p-2 rounded-xl flex items-center justify-between text-xs cursor-pointer transition-colors ${
                          isCurrent 
                            ? 'bg-[#FAF8F5] border border-[#C5A059]/40 font-bold text-[#2C2A29]'
                            : 'hover:bg-[#FAF8F5] text-[#2C2A29]'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold truncate">{p.name}</span>
                            {isCurrent && (
                              <span className="text-[9px] px-1 py-0.2 bg-[#047857] text-white rounded font-mono">
                                Aktívny
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#8C857B] font-mono">
                            {p.birthNumber} • {p.phone || p.insurance}
                          </div>
                        </div>
                        <span className="text-[#C5A059] text-[11px] font-bold">Vybrať</span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* ODKAZ DO CELEJ KARTOTÉKY */}
              <div className="pt-2 border-t border-[#E8E2D9]">
                <button
                  type="button"
                  onClick={() => {
                    setShowSwitchDropdown(false);
                    onNavigateToTab('patients');
                  }}
                  className="w-full py-1.5 bg-[#FAF8F5] hover:bg-[#E8E2D9] text-[#2C2A29] rounded-xl text-xs font-bold transition-colors text-center"
                >
                  Otvoriť celú kartotéku pacientov →
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
