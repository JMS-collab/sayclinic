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
  ChevronRight,
  ScanFace,
  ShieldCheck,
  Phone,
  Clock
} from 'lucide-react';
import { LiquidAvatar } from './LiquidAvatar';
import { RealtimeSyncService } from '../services/realtimeSyncService';

interface ActivePatientBarProps {
  activePatient: Patient | null;
  allPatients: Patient[];
  currentTab: string;
  currentUser?: any;
  containerClassName?: string;
  onNavigateToTab: (tab: any, extra?: any) => void;
  onSelectPatient: (patient: Patient) => void;
  onClearActivePatient: () => void;
}

export default function ActivePatientBar({
  activePatient,
  allPatients,
  currentTab,
  currentUser,
  containerClassName,
  onNavigateToTab,
  onSelectPatient,
  onClearActivePatient
}: ActivePatientBarProps) {
  const [showSwitchDropdown, setShowSwitchDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [concurrentUsers, setConcurrentUsers] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Live Presence: automatické hlásenie prítomnosti a sledovanie kolegov súbežne pracujúcich na pacientovi
  useEffect(() => {
    if (!activePatient) {
      setConcurrentUsers([]);
      return;
    }

    const effectiveUser = currentUser || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('say_clinic_user') || 'null')?.user : null);

    const updateConcurrent = () => {
      const active = RealtimeSyncService.getConcurrentUsersForPatient(activePatient.id, effectiveUser?.id);
      setConcurrentUsers(prev => {
        if (JSON.stringify(prev) === JSON.stringify(active)) return prev;
        return active;
      });
    };

    updateConcurrent();

    if (effectiveUser?.id) {
      RealtimeSyncService.reportPresence(activePatient.id, effectiveUser);
      const interval = setInterval(() => {
        RealtimeSyncService.reportPresence(activePatient.id, effectiveUser);
        updateConcurrent();
      }, 12000);

      const unsub = RealtimeSyncService.subscribe('patient_presence', () => {
        updateConcurrent();
      });

      return () => {
        clearInterval(interval);
        unsub();
        RealtimeSyncService.leavePresence(activePatient.id, effectiveUser.id);
      };
    }
  }, [activePatient?.id, currentUser?.id]);

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
    <div className="bg-[#1C1A19]/95 backdrop-blur-md border-b border-[#383431] shadow-[0_4px_20px_rgba(0,0,0,0.25)] z-30 sticky top-[73px] print:hidden animate-in fade-in duration-200">
      <div className={`${containerClassName || 'w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12'} py-2 flex flex-wrap items-center justify-between gap-3`}>
        
        {/* VĽAVO: IDENTIFIKÁCIA ROZPRACOVANÉHO PACIENTA */}
        <div className="flex items-center gap-3 min-w-0">
          
          {/* JEMNÝ EDITORIÁLOVÝ INDIKÁTOR AKTÍVNEHO PACIENTA */}
          <div className="hidden sm:flex items-center gap-1.5 pr-2.5 border-r border-[#383431] text-[#C5A059] text-[10px] font-bold uppercase tracking-[0.14em] shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-pulse shadow-[0_0_8px_rgba(197,160,89,0.8)]"></span>
            <span>Aktívny pacient</span>
          </div>

          {/* AVATAR / INICIÁLY */}
          <div 
            onClick={() => onNavigateToTab('patients')}
            className="w-8 h-8 rounded-full bg-[#C5A059] text-[#1C1A19] border border-[#D4AF37] flex items-center justify-center font-brand font-bold text-xs shrink-0 cursor-pointer hover:scale-105 transition-transform shadow-xs"
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
                className="font-brand font-bold text-base text-white hover:text-[#C5A059] transition-colors truncate text-left cursor-pointer flex items-center gap-1"
                title="Otvoriť zdravotnú kartu pacienta"
              >
                <span>{activePatient.name}</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#C5A059]" />
              </button>
              
              {patientAge && (
                <span className="text-[10px] bg-[#2C2A29] text-[#C5A059] border border-[#C5A059]/30 px-1.5 py-0.5 rounded font-medium">
                  {patientAge}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-[#A8A29E]">
              <span className="font-mono font-medium text-white">
                RČ: {activePatient.birthNumber}
              </span>
              <span className="text-[#57534E]">•</span>
              <span className="truncate max-w-[120px] text-[#D6D3D1]">
                {activePatient.insurance || 'Dôvera'}
              </span>
              {activePatient.phone && (
                <>
                  <span className="text-[#57534E]">•</span>
                  <span className="flex items-center gap-0.5 font-mono text-[10px] text-[#E8E2D9]">
                    <Phone className="w-2.5 h-2.5 text-[#C5A059]" />
                    {activePatient.phone}
                  </span>
                </>
              )}
            </div>
          </div>

        </div>

        {/* SÚBEŽNÍ SPOLUPRACOVNÍCI NA KARTE PACIENTA (S 3D GENMOJI AVATARMI) */}
        {concurrentUsers.length > 0 && (
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-[#262321] border border-[#C5A059]/40 shadow-xs shrink-0 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex -space-x-2 overflow-hidden shrink-0">
              {concurrentUsers.map(u => (
                <div 
                  key={u.userId} 
                  className="relative inline-block w-7 h-7 rounded-full ring-2 ring-[#1C1A19] shadow-xs overflow-hidden" 
                  title={`${u.userName} (${u.userTitle || u.userRole}) práve pracuje na tejto karte`}
                >
                  <LiquidAvatar id={u.userId} name={u.userName} role={u.userRole as any} avatarUrl={u.avatarUrl} className="w-full h-full" />
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-[#1C1A19] animate-pulse" />
                </div>
              ))}
            </div>
            <div className="flex flex-col text-left pr-1">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[9px] uppercase tracking-wider text-[#A8A29E] font-bold">Súbežne v karte:</span>
              </div>
              <span className="text-[11px] font-bold text-white truncate max-w-[200px]">
                {concurrentUsers.map(u => `${u.userName} (${u.userRole === 'nurse' || u.userRole === 'receptionist' ? 'Sestra' : 'Lekár'})`).join(', ')}
              </span>
            </div>
          </div>
        )}

        {/* V STREDE: RÝCHLE AKCIE S TÝMTO ROZPRACOVANÝM PACIENTOM */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          
          {/* 1. KARTA PACIENTA (KARTOTÉKA) */}
          <button
            type="button"
            onClick={() => onNavigateToTab('patients')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              currentTab === 'patients'
                ? 'bg-[#C5A059] text-[#1C1A19] border-[#C5A059] shadow-[0_0_12px_rgba(197,160,89,0.35)] font-bold'
                : 'bg-[#282523]/80 hover:bg-[#34302D] text-[#E8E2D9] hover:text-white border-[#3F3A36] hover:border-[#C5A059]/60'
            }`}
            title="Prejsť na kompletnú zdravotnú kartu a dokumentáciu"
          >
            <FolderOpen className={`w-3.5 h-3.5 ${currentTab === 'patients' ? 'text-[#1C1A19]' : 'text-[#C5A059]'}`} />
            <span>Karta 360°</span>
          </button>

          {/* 2. LEKÁRSKA SPRÁVA / DEKURZ */}
          <button
            type="button"
            onClick={() => onNavigateToTab('generator')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              currentTab === 'generator'
                ? 'bg-[#C5A059] text-[#1C1A19] border-[#C5A059] shadow-[0_0_12px_rgba(197,160,89,0.35)] font-bold'
                : 'bg-[#282523]/80 hover:bg-[#34302D] text-[#E8E2D9] hover:text-white border-[#3F3A36] hover:border-[#C5A059]/60'
            }`}
            title="Otvoriť generátor lekárskeho nálezu pre tohto pacienta"
          >
            <FileText className={`w-3.5 h-3.5 ${currentTab === 'generator' ? 'text-[#1C1A19]' : 'text-[#C5A059]'}`} />
            <span>Nález / Dekurz</span>
          </button>

          {/* 3. ESTETIKA & FOTO */}
          <button
            type="button"
            onClick={() => onNavigateToTab('aesthetics')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              currentTab === 'aesthetics'
                ? 'bg-[#C5A059] text-[#1C1A19] border-[#C5A059] shadow-[0_0_12px_rgba(197,160,89,0.35)] font-bold'
                : 'bg-[#282523]/80 hover:bg-[#34302D] text-[#E8E2D9] hover:text-white border-[#3F3A36] hover:border-[#C5A059]/60'
            }`}
            title="Aplikácia botoxu, výplní a fotodokumentácia"
          >
            <Sparkles className={`w-3.5 h-3.5 ${currentTab === 'aesthetics' ? 'text-[#1C1A19]' : 'text-[#C5A059]'}`} />
            <span className="hidden sm:inline">Estetika</span>
          </button>

          {/* 4. RECEPT (ŠEVT) */}
          <button
            type="button"
            onClick={() => onNavigateToTab('prescriptions')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              currentTab === 'prescriptions'
                ? 'bg-[#C5A059] text-[#1C1A19] border-[#C5A059] shadow-[0_0_12px_rgba(197,160,89,0.35)] font-bold'
                : 'bg-[#282523]/80 hover:bg-[#34302D] text-[#E8E2D9] hover:text-white border-[#3F3A36] hover:border-[#C5A059]/60'
            }`}
            title="Vystaviť lekársky recept ŠEVT 14 282 2s pre tohto pacienta"
          >
            <Pill className={`w-3.5 h-3.5 ${currentTab === 'prescriptions' ? 'text-[#1C1A19]' : 'text-[#C5A059]'}`} />
            <span>Recept Rp.</span>
          </button>

          {/* PLÁN STAROSTLIVOSTI 3-V-1 (SAY SKINCARE / ROČNÝ PLÁN / SAY CARE) */}
          <button
            type="button"
            onClick={() => onNavigateToTab('patients', { folder: 'plany' })}
            className="px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer border bg-[#282523]/80 hover:bg-[#34302D] text-[#E8E2D9] hover:text-white border-[#3F3A36] hover:border-[#C5A059]/60"
            title="1. SAY Skincare (Meicet 3D + rutina) • 2. Ročný Plán • 3. SAY Care"
          >
            <ScanFace className="w-3.5 h-3.5 text-[#C5A059]" />
            <span className="hidden lg:inline">Plán & Meicet 3D</span>
          </button>

          {/* 5. PREDAJ KOZMETIKY (POS) */}
          <button
            type="button"
            onClick={() => onNavigateToTab('cosmetics')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              currentTab === 'cosmetics'
                ? 'bg-[#C5A059] text-[#1C1A19] border-[#C5A059] shadow-[0_0_12px_rgba(197,160,89,0.35)] font-bold'
                : 'bg-[#282523]/80 hover:bg-[#34302D] text-[#E8E2D9] hover:text-white border-[#3F3A36] hover:border-[#C5A059]/60'
            }`}
            title="Pultový predaj a pokladňa POS"
          >
            <ShoppingBag className={`w-3.5 h-3.5 ${currentTab === 'cosmetics' ? 'text-[#1C1A19]' : 'text-[#C5A059]'}`} />
            <span className="hidden md:inline">Pokladňa POS</span>
          </button>

        </div>

        {/* VPRAVO: ZMENA PACIENTA / VYČISTENIE */}
        <div className="flex items-center gap-1.5 relative" ref={dropdownRef}>
          
          {/* TLAČIDLO ZMENIŤ PACIENTA */}
          <button
            type="button"
            onClick={() => setShowSwitchDropdown(!showSwitchDropdown)}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-[#C5A059] hover:text-white hover:bg-[#282523] border border-[#3F3A36] hover:border-[#C5A059] flex items-center gap-1 transition-all cursor-pointer"
            title="Zmeniť rozpracovaného pacienta"
          >
            <RefreshCw className={`w-3.5 h-3.5 transition-transform ${showSwitchDropdown ? 'rotate-180 text-white' : ''}`} />
            <span className="hidden sm:inline">Zmeniť pacienta</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {/* UKONČIŤ PRÁCU S PACIENTOM */}
          <button
            type="button"
            onClick={onClearActivePatient}
            className="p-1.5 rounded-xl text-[#A8A29E] hover:text-rose-400 hover:bg-rose-950/30 border border-[#3F3A36] hover:border-rose-900/60 transition-colors cursor-pointer"
            title="Ukončiť rozpracovanie tohto pacienta"
          >
            <X className="w-4 h-4" />
          </button>

          {/* DROPDOWN PRE RÝCHLY VÝBER INÉHO PACIENTA */}
          {showSwitchDropdown && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-[#1F1D1B] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-[#383431] p-3 z-50 space-y-2 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#383431]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059]">
                  Vybrať iného pacienta
                </span>
                <button
                  type="button"
                  onClick={() => setShowSwitchDropdown(false)}
                  className="text-[#A8A29E] hover:text-white text-xs cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* HĽADANIE PACIENTA */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#A8A29E]" />
                <input
                  type="text"
                  placeholder="Hľadať meno, RČ, telefón..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-8 pr-3 py-1.5 bg-[#282523] border border-[#3F3A36] rounded-xl text-xs text-white placeholder-[#78716C] outline-none focus:border-[#C5A059]"
                />
              </div>

              {/* ZOZNAM FILTROVANÝCH PACIENTOV */}
              <div className="max-h-56 overflow-y-auto space-y-1">
                {filteredPatients.length === 0 ? (
                  <p className="text-[11px] text-[#A8A29E] text-center py-3">
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
                            ? 'bg-[#2C2926] border border-[#C5A059]/60 font-bold text-white'
                            : 'hover:bg-[#282523] text-[#D6D3D1] hover:text-white'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold truncate">{p.name}</span>
                            {isCurrent && (
                              <span className="text-[9px] px-1 py-0.2 bg-emerald-600 text-white rounded font-mono">
                                Aktívny
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#A8A29E] font-mono">
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
              <div className="pt-2 border-t border-[#383431]">
                <button
                  type="button"
                  onClick={() => {
                    setShowSwitchDropdown(false);
                    onNavigateToTab('patients');
                  }}
                  className="w-full py-1.5 bg-[#282523] hover:bg-[#34302D] text-[#C5A059] hover:text-white rounded-xl text-xs font-bold transition-colors text-center cursor-pointer border border-[#3F3A36]"
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
