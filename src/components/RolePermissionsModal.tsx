'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  X, 
  Check, 
  AlertTriangle, 
  RotateCcw, 
  Eye, 
  Lock, 
  Users, 
  Sliders, 
  CheckCircle2, 
  Sparkles,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { 
  PermissionsService, 
  RoleType, 
  TabId, 
  SpecialPermissionId, 
  RolePermissionConfig,
  TABS_REGISTRY,
  SPECIAL_PERMISSIONS_REGISTRY
} from '../services/permissionsService';
import { SAY_CLINIC_USERS, UserAccount } from './LoginForm';

interface RolePermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
}

export default function RolePermissionsModal({
  isOpen,
  onClose,
  currentUser,
}: RolePermissionsModalProps) {
  const [permissions, setPermissions] = useState<Record<RoleType, RolePermissionConfig>>(() => 
    PermissionsService.getAllPermissions()
  );
  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'users' | 'simulation'>('matrix');
  const [simulatedRole, setSimulatedRole] = useState<RoleType | null>(() => 
    PermissionsService.getSimulatedRole()
  );
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const isRealCeo = currentUser.role === 'ceo' || currentUser.email === 'mraz@sayclinic.sk' || currentUser.id === 'u1';

  useEffect(() => {
    if (isOpen) {
      setPermissions(PermissionsService.getAllPermissions());
      setSimulatedRole(PermissionsService.getSimulatedRole());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Prepnutie povolenia záložky pre danú rolu
  const handleToggleTab = (role: RoleType, tabId: TabId) => {
    if (!isRealCeo) return;
    if (role === 'ceo' && tabId === 'home') return; // CEO musí mať aspoň home

    setPermissions(prev => {
      const roleConfig = prev[role];
      const hasTab = roleConfig.allowedTabs.includes(tabId);
      const newTabs = hasTab 
        ? roleConfig.allowedTabs.filter(t => t !== tabId)
        : [...roleConfig.allowedTabs, tabId];

      const updated = {
        ...prev,
        [role]: {
          ...roleConfig,
          allowedTabs: newTabs
        }
      };
      PermissionsService.savePermissions(updated);
      return updated;
    });

    setSaveStatus('Zmena oprávnenia bola automaticky uložená.');
    setTimeout(() => setSaveStatus(null), 2500);
  };

  // Prepnutie špeciálneho oprávnenia pre danú rolu
  const handleToggleSpecial = (role: RoleType, permId: SpecialPermissionId) => {
    if (!isRealCeo) return;
    if (role === 'ceo' && (permId === 'manage_permissions' || permId === 'reset_financial_data')) {
      // CEO by si nemal odobrať základnú správu
      return;
    }

    setPermissions(prev => {
      const roleConfig = prev[role];
      const currentVal = !!roleConfig.specialPermissions[permId];
      const updated = {
        ...prev,
        [role]: {
          ...roleConfig,
          specialPermissions: {
            ...roleConfig.specialPermissions,
            [permId]: !currentVal
          }
        }
      };
      PermissionsService.savePermissions(updated);
      return updated;
    });

    setSaveStatus('Zmena oprávnenia bola automaticky uložená.');
    setTimeout(() => setSaveStatus(null), 2500);
  };

  // Obnovenie odporúčaných nastavení
  const handleResetDefaults = () => {
    if (!confirm('Naozaj chcete obnoviť odporúčané klinické nastavenia prístupov pre všetky roly?')) return;
    const defaults = PermissionsService.resetToDefaults();
    setPermissions(defaults);
    setSaveStatus('Oprávnenia boli obnovené na odporúčané klinické štandardy SAY CLINIC.');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  // Zmena simulácie roly (náhľad)
  const handleSelectSimulatedRole = (role: RoleType | null) => {
    PermissionsService.setSimulatedRole(role);
    setSimulatedRole(role);
    setSaveStatus(
      role 
        ? `Aktivovaný náhľad rozhrania: ${PermissionsService.getRoleTitle(role)}. Navigácia a zobrazenie sa prispôsobili.` 
        : 'Náhľad bol ukončený. Ste späť vo svojom plnom profile CEO.'
    );
    setTimeout(() => setSaveStatus(null), 3500);
  };

  const ROLES_ORDER: { key: RoleType; title: string; subtitle: string; icon: string }[] = [
    { key: 'ceo', title: 'CEO & Primár', subtitle: 'MUDr. Ján Mráz', icon: '👑' },
    { key: 'doctor', title: 'Lekár / Chirurg', subtitle: 'Lekári a anesteziológ', icon: '🩺' },
    { key: 'manager', title: 'Klinický Manažment', subtitle: 'Recepcia & Manažment', icon: '💼' },
    { key: 'nurse', title: 'Zdravotná sestra', subtitle: 'Sálové a ambulantné sestry', icon: '🩺' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full border border-[#E8E2D9] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* HEADER */}
        <div className="p-5 sm:p-6 border-b border-[#E8E2D9] bg-gradient-to-r from-white via-white to-[#FBF9F6] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#2C2A29] text-[#C5A059] flex items-center justify-center border border-[#C5A059]/40 shadow-sm shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-brand font-bold text-[#2C2A29] uppercase tracking-wide">
                  Oprávnenia & Viditeľnosť profilov
                </h3>
                <span className="text-[10px] font-mono uppercase bg-[#C5A059]/15 text-[#8C6D2B] px-2 py-0.5 rounded-full font-bold border border-[#C5A059]/30">
                  RBAC Ochrana
                </span>
              </div>
              <p className="text-xs text-[#8C857B]">
                Presné riadenie prístupu: Ktorý profil má vidieť aké moduly, finančné údaje a citlivé operácie kliniky
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#FBF9F6] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STATUS OZNÁMENIE */}
        {saveStatus && (
          <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-900 animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{saveStatus}</span>
            </div>
          </div>
        )}

        {/* LIŠTA S AKTÍVNOU SIMULÁCIOU */}
        {simulatedRole && (
          <div className="bg-amber-500 text-white px-6 py-2 flex items-center justify-between text-xs font-semibold shadow-xs">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 animate-pulse" />
              <span>
                Práve simulujete zobrazenie pre profil: <strong>{PermissionsService.getRoleTitle(simulatedRole)}</strong>. Všetky záložky a obmedzenia sú aktívne.
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleSelectSimulatedRole(null)}
              className="px-2.5 py-0.5 bg-white/20 hover:bg-white/30 rounded-lg text-[11px] font-bold underline cursor-pointer transition-colors"
            >
              Ukončiť náhľad
            </button>
          </div>
        )}

        {/* SUB-TABS */}
        <div className="px-6 pt-3 border-b border-[#E8E2D9] bg-[#FAF8F5] flex items-center justify-between flex-wrap gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveSubTab('matrix')}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-xl transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'matrix'
                  ? 'border-[#C5A059] text-[#2C2A29] bg-white font-bold shadow-2xs'
                  : 'border-transparent text-[#8C857B] hover:text-[#2C2A29]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Matica oprávnení</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('users')}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-xl transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'users'
                  ? 'border-[#C5A059] text-[#2C2A29] bg-white font-bold shadow-2xs'
                  : 'border-transparent text-[#8C857B] hover:text-[#2C2A29]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Profily personálu ({SAY_CLINIC_USERS.length})</span>
            </button>

            {isRealCeo && (
              <button
                type="button"
                onClick={() => setActiveSubTab('simulation')}
                className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-xl transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                  activeSubTab === 'simulation'
                    ? 'border-[#C5A059] text-[#2C2A29] bg-white font-bold shadow-2xs'
                    : 'border-transparent text-[#8C857B] hover:text-[#2C2A29]'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Náhľad roly (Simulácia)</span>
              </button>
            )}
          </div>

          {isRealCeo && activeSubTab === 'matrix' && (
            <button
              type="button"
              onClick={handleResetDefaults}
              title="Vrátiť na predvolené klinické odporúčania"
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#8C857B] hover:text-[#2C2A29] pb-2 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Obnoviť odporúčané</span>
            </button>
          )}
        </div>

        {/* BODY */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* 1. MATICA OPRÁVNENÍ */}
          {activeSubTab === 'matrix' && (
            <div className="space-y-6">
              
              {/* Odporúčané vysvetlenie */}
              <div className="bg-[#FBF9F6] border border-[#E8E2D9] rounded-2xl p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#C5A059] shrink-0 mt-0.5" />
                <div className="text-xs text-[#6B655E] space-y-1">
                  <p className="font-bold text-[#2C2A29]">
                    Ako funguje viditeľnosť na klinike SAY CLINIC:
                  </p>
                  <p>
                    • <strong>Lekári & chirurgovia</strong> vidia pacientov, operačné dokumenty, kalendár sál, tvárovú mapu a sklad, no nemajú prístup k celkovým tržbám, P&L kliniky a výdavkom.
                  </p>
                  <p>
                    • <strong>Zdravotné sestry</strong> majú zameraný pohľad na sálu, ošetrovanie a odpisovanie spotrebovaného materiálu/šitia v sklade. Finančné moduly a ceny sú prísne skryté.
                  </p>
                  <p>
                    • <strong>Klinický manažment</strong> vystavuje faktúry a zálohy pacientom, spravuje pokladňu kozmetiky, no nemá prístup k citlivému P&L a nulovaniu dát.
                  </p>
                  <p>
                    • <strong>CEO (MUDr. Ján Mráz)</strong> má neobmedzený plný prístup ku všetkým analytikám a nástrojom.
                  </p>
                </div>
              </div>

              {/* TABUĽKA: MODULY / ZÁLOŽKY SYSTÉMU */}
              <div className="border border-[#E8E2D9] rounded-2xl overflow-hidden shadow-2xs">
                <div className="bg-[#FAF8F5] px-4 py-3 border-b border-[#E8E2D9]">
                  <h4 className="text-xs font-bold text-[#2C2A29] uppercase tracking-wider">
                    1. Viditeľnosť hlavných záložiek v navigácii
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#E8E2D9] bg-white text-left font-semibold text-[#8C857B]">
                        <th className="py-3 px-4 w-2/5">Modul / Záložka</th>
                        {ROLES_ORDER.map(r => (
                          <th key={r.key} className="py-3 px-3 text-center w-[15%]">
                            <div className="font-bold text-[#2C2A29]">{r.icon} {r.title}</div>
                            <div className="text-[10px] font-normal text-[#8C857B]">{r.subtitle}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E2D9] bg-white">
                      {TABS_REGISTRY.map((tab) => (
                        <tr key={tab.id} className="hover:bg-[#FAF8F5] transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2 font-bold text-[#2C2A29]">
                              <span className="text-base">{tab.icon}</span>
                              <span>{tab.label}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#FAF8F5] text-[#8C857B] border border-[#E8E2D9] font-normal">
                                {tab.department}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#8C857B] mt-0.5 pl-6">
                              {tab.description}
                            </div>
                          </td>

                          {ROLES_ORDER.map(r => {
                            const isAllowed = permissions[r.key]?.allowedTabs.includes(tab.id);
                            const isLocked = !isRealCeo || (r.key === 'ceo' && tab.id === 'home');
                            return (
                              <td key={r.key} className="py-3 px-3 text-center align-middle">
                                <button
                                  type="button"
                                  disabled={isLocked}
                                  onClick={() => handleToggleTab(r.key, tab.id)}
                                  className={`inline-flex items-center justify-center w-7 h-7 rounded-xl border transition-all ${
                                    isAllowed
                                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-2xs font-bold hover:scale-105'
                                      : 'bg-gray-50 border-gray-200 text-gray-300 hover:text-gray-500'
                                  } ${isLocked ? 'opacity-80 cursor-default' : 'cursor-pointer hover:border-[#C5A059]'}`}
                                  title={isAllowed ? 'Povolené (kliknite pre zmenu)' : 'Skryté (kliknite pre povolenie)'}
                                >
                                  {isAllowed ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-3.5 h-3.5" />}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TABUĽKA: ŠPECIÁLNE A CITLIVÉ OPRÁVNENIA */}
              <div className="border border-[#E8E2D9] rounded-2xl overflow-hidden shadow-2xs">
                <div className="bg-[#FAF8F5] px-4 py-3 border-b border-[#E8E2D9] flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#2C2A29] uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>2. Citlivé oprávnenia, financie & správa</span>
                  </h4>
                  <span className="text-[10px] text-[#8C857B]">
                    Zabezpečené proti neoprávnenému nahliadnutiu
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#E8E2D9] bg-white text-left font-semibold text-[#8C857B]">
                        <th className="py-3 px-4 w-2/5">Oprávnenie</th>
                        {ROLES_ORDER.map(r => (
                          <th key={r.key} className="py-3 px-3 text-center w-[15%]">
                            <div className="font-bold text-[#2C2A29]">{r.icon} {r.title}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E2D9] bg-white">
                      {SPECIAL_PERMISSIONS_REGISTRY.map((perm) => (
                        <tr key={perm.id} className="hover:bg-[#FAF8F5] transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2 font-bold text-[#2C2A29]">
                              <span>{perm.label}</span>
                              {perm.sensitive && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                                  Dôverné
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#8C857B] mt-0.5">
                              {perm.description}
                            </div>
                          </td>

                          {ROLES_ORDER.map(r => {
                            const isAllowed = !!permissions[r.key]?.specialPermissions[perm.id];
                            const isLocked = !isRealCeo || (r.key === 'ceo' && (perm.id === 'manage_permissions' || perm.id === 'reset_financial_data'));
                            return (
                              <td key={r.key} className="py-3 px-3 text-center align-middle">
                                <button
                                  type="button"
                                  disabled={isLocked}
                                  onClick={() => handleToggleSpecial(r.key, perm.id)}
                                  className={`inline-flex items-center justify-center w-7 h-7 rounded-xl border transition-all ${
                                    isAllowed
                                      ? 'bg-[#FAF6EF] border-[#E6D4B2] text-[#8C6D2B] shadow-2xs font-bold hover:scale-105'
                                      : 'bg-gray-50 border-gray-200 text-gray-300 hover:text-gray-500'
                                  } ${isLocked ? 'opacity-80 cursor-default' : 'cursor-pointer hover:border-[#C5A059]'}`}
                                  title={isAllowed ? 'Povolené' : 'Zakázané'}
                                >
                                  {isAllowed ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-3.5 h-3.5" />}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* 2. PROFILY PERSONÁLU (10 POUŽÍVATEĽOV) */}
          {activeSubTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[#8C857B]">
                <span>Zoznam personálu SAY CLINIC a priradená viditeľnosť podľa roly:</span>
                <span className="font-mono font-bold text-[#2C2A29]">{SAY_CLINIC_USERS.length} používateľov</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SAY_CLINIC_USERS.map(user => {
                  const roleConfig = permissions[user.role] || PermissionsService.getAllPermissions()[user.role];
                  const allowedTabsCount = roleConfig?.allowedTabs?.length || 0;
                  const canSeeFinances = roleConfig?.allowedTabs?.includes('finance');

                  return (
                    <div 
                      key={user.id} 
                      className="p-4 rounded-2xl border border-[#E8E2D9] bg-white hover:border-[#C5A059] transition-all space-y-3 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full border border-[#C5A059] overflow-hidden flex items-center justify-center bg-[#FAF8F5] text-xs font-bold text-[#2C2A29] shrink-0">
                            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-[#2C2A29]">{user.name}</div>
                            <div className="text-[11px] text-[#8C857B]">{user.email}</div>
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${PermissionsService.getRoleBadgeClass(user.role)}`}>
                          {PermissionsService.getRoleTitle(user.role)}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-[#E8E2D9] space-y-1.5 text-[11px]">
                        <div className="flex justify-between items-center text-[#6B655E]">
                          <span>Prístup k modulom:</span>
                          <span className="font-mono font-bold text-[#2C2A29]">
                            {allowedTabsCount} z {TABS_REGISTRY.length} záložiek
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1 pt-1">
                          {roleConfig?.allowedTabs?.map(tabId => {
                            const tabMeta = TABS_REGISTRY.find(t => t.id === tabId);
                            if (!tabMeta) return null;
                            return (
                              <span 
                                key={tabId}
                                className="px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E8E2D9] text-[10px] text-[#2C2A29]"
                              >
                                {tabMeta.icon} {tabMeta.label}
                              </span>
                            );
                          })}
                        </div>

                        <div className="pt-1 flex items-center gap-2 text-[10px]">
                          <span className={canSeeFinances ? 'text-amber-800 font-bold' : 'text-emerald-700'}>
                            {canSeeFinances ? '⚠️ Vidí finančné záložky' : '🔒 Bez prístupu k financiám'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. SIMULÁCIA ROLY (NÁHĽAD ROZHRANIA) */}
          {activeSubTab === 'simulation' && isRealCeo && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-[#FAF8F5] to-white border border-[#E8E2D9] space-y-2">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-[#C5A059]" />
                  <h4 className="font-bold text-sm text-[#2C2A29]">
                    Klinická simulácia zobrazenia
                  </h4>
                </div>
                <p className="text-xs text-[#6B655E]">
                  Ako CEO kliniky si môžete okamžite vyskúšať, ako vyzerá používateľské rozhranie pre zdravotnú sestru, chirurga či manažment. Simulácia dočasne skryje záložky a funkcie presne tak, ako ich vidí daná rola.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                
                {/* 1. SESTRA */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  simulatedRole === 'nurse' 
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/20' 
                    : 'border-[#E8E2D9] bg-white hover:border-[#C5A059]'
                }`}>
                  <div className="text-2xl mb-2">🩺</div>
                  <h5 className="font-bold text-xs text-[#2C2A29]">Zdravotná sestra</h5>
                  <p className="text-[11px] text-[#8C857B] mt-1 mb-3">
                    Vidí len sálu, kartotéku, kalendár a sklad materiálu. Žiadne financie ani obrat.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleSelectSimulatedRole(simulatedRole === 'nurse' ? null : 'nurse')}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      simulatedRole === 'nurse'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-[#FAF8F5] hover:bg-[#2C2A29] hover:text-white text-[#2C2A29] border border-[#E8E2D9]'
                    }`}
                  >
                    {simulatedRole === 'nurse' ? '✓ Aktívny náhľad' : 'Vyskúšať ako Sestra'}
                  </button>
                </div>

                {/* 2. LEKÁR */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  simulatedRole === 'doctor' 
                    ? 'border-sky-500 bg-sky-50/50 shadow-md ring-2 ring-sky-500/20' 
                    : 'border-[#E8E2D9] bg-white hover:border-[#C5A059]'
                }`}>
                  <div className="text-2xl mb-2">👨‍⚕️</div>
                  <h5 className="font-bold text-xs text-[#2C2A29]">Lekár / Chirurg</h5>
                  <p className="text-[11px] text-[#8C857B] mt-1 mb-3">
                    Vidí pacientov, lekárske správy, Botox/výplne, kalendár, bez firemných financií.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleSelectSimulatedRole(simulatedRole === 'doctor' ? null : 'doctor')}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      simulatedRole === 'doctor'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-[#FAF8F5] hover:bg-[#2C2A29] hover:text-white text-[#2C2A29] border border-[#E8E2D9]'
                    }`}
                  >
                    {simulatedRole === 'doctor' ? '✓ Aktívny náhľad' : 'Vyskúšať ako Lekár'}
                  </button>
                </div>

                {/* 3. MANAŽMENT */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  simulatedRole === 'manager' 
                    ? 'border-amber-500 bg-amber-50/50 shadow-md ring-2 ring-amber-500/20' 
                    : 'border-[#E8E2D9] bg-white hover:border-[#C5A059]'
                }`}>
                  <div className="text-2xl mb-2">💼</div>
                  <h5 className="font-bold text-xs text-[#2C2A29]">Klinický Manažment</h5>
                  <p className="text-[11px] text-[#8C857B] mt-1 mb-3">
                    Vidí faktúry klientov a pokladňu, ale bez mzdových nákladov a nulovania.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleSelectSimulatedRole(simulatedRole === 'manager' ? null : 'manager')}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      simulatedRole === 'manager'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-[#FAF8F5] hover:bg-[#2C2A29] hover:text-white text-[#2C2A29] border border-[#E8E2D9]'
                    }`}
                  >
                    {simulatedRole === 'manager' ? '✓ Aktívny náhľad' : 'Vyskúšať ako Manažér'}
                  </button>
                </div>

                {/* 4. CEO */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  simulatedRole === null 
                    ? 'border-[#C5A059] bg-[#FAF6EF] shadow-md ring-2 ring-[#C5A059]/20' 
                    : 'border-[#E8E2D9] bg-white hover:border-[#C5A059]'
                }`}>
                  <div className="text-2xl mb-2">👑</div>
                  <h5 className="font-bold text-xs text-[#2C2A29]">CEO & Primár (Plný)</h5>
                  <p className="text-[11px] text-[#8C857B] mt-1 mb-3">
                    Váš štandardný účet: Neobmedzený plný prístup ku všetkým analytikám a nástrojom.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleSelectSimulatedRole(null)}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      simulatedRole === null
                        ? 'bg-[#2C2A29] text-[#C5A059] shadow-xs'
                        : 'bg-[#FAF8F5] hover:bg-[#2C2A29] hover:text-white text-[#2C2A29] border border-[#E8E2D9]'
                    }`}
                  >
                    {simulatedRole === null ? '✓ Aktuálny stav (CEO)' : 'Späť na CEO profil'}
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="p-4 sm:p-5 border-t border-[#E8E2D9] bg-[#FAF8F5] flex items-center justify-between">
          <div className="text-xs text-[#8C857B]">
            Aktuálny používateľ: <strong className="text-[#2C2A29]">{currentUser.name}</strong> ({currentUser.title})
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-[#2C2A29] hover:bg-[#C5A059] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            Zatvoriť správu oprávnení
          </button>
        </div>

      </div>
    </div>
  );
}
