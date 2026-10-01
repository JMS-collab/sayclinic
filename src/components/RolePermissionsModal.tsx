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
  ArrowRight,
  UserPlus,
  Edit2,
  Trash2,
  Save,
  Search,
  CheckCircle
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
import { UserAccount } from './LoginForm';
import { UserService } from '../services/userService';
import { LiquidAvatar } from './LiquidAvatar';

interface RolePermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
}

const PRESET_GENMOJIS = [
  { id: 'u10', label: 'Viktória (Recepčná - čierne vlasy & okuliare)', url: '/avatars/foltaniova.jpg?v=3' },
  { id: 'u6', label: 'Ema (Sestra - čierne vlasy)', url: '/avatars/foltani.jpg?v=3' },
  { id: 'u8', label: 'Anesteziológ (Biely Európan - krátke vlasy)', url: '/avatars/anesteziolog.jpg?v=3' },
  { id: 'u1', label: 'MUDr. Ján Mráz (CEO)', url: '/avatars/mraz.jpg?v=4' },
  { id: 'u2', label: 'MUDr. Zuzana Sroková', url: '/avatars/srokova.jpg?v=2' },
  { id: 'u3', label: 'MUDr. Minh Tuong Tran', url: '/avatars/tran.jpg?v=2' },
  { id: 'u4', label: 'Ing. Barbara Mecerodová', url: '/avatars/mecerodova.jpg?v=2' },
  { id: 'u5', label: 'Mgr. Elena Solivajsová', url: '/avatars/solivajsova.jpg?v=2' },
  { id: 'u7', label: 'Sabina Lenhartová', url: '/avatars/lenhartova.jpg?v=2' },
  { id: 'u9', label: 'Anesteziologická sestra', url: '/avatars/anest_sestra.jpg?v=1' },
];

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

  // Zoznam používateľov zo servisu
  const [usersList, setUsersList] = useState<UserAccount[]>(() => UserService.getUsers());
  const [searchUserQuery, setSearchUserQuery] = useState('');

  // Formulár pre editáciu / vytvorenie používateľa
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [isCreatingNewUser, setIsCreatingNewUser] = useState(false);

  // CEO a Manažment majú právo spravovať systém
  const canManage = PermissionsService.canUserManageSystem(currentUser);

  useEffect(() => {
    if (isOpen) {
      setPermissions(PermissionsService.getAllPermissions());
      setSimulatedRole(PermissionsService.getSimulatedRole());
      setUsersList(UserService.getUsers());
    }
  }, [isOpen]);

  // Počúvanie na zmeny personálu
  useEffect(() => {
    const handleUsersChanged = (e: any) => {
      if (e.detail) setUsersList(e.detail);
    };
    window.addEventListener('say_clinic_users_changed', handleUsersChanged);
    return () => window.removeEventListener('say_clinic_users_changed', handleUsersChanged);
  }, []);

  if (!isOpen) return null;

  // Prepnutie povolenia záložky pre danú rolu
  const handleToggleTab = (role: RoleType, tabId: TabId) => {
    if (!canManage) return;
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
    if (!canManage) return;
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

  // Obnovenie odporúčaných nastavení oprávnení
  const handleResetDefaults = () => {
    if (!confirm('Naozaj chcete obnoviť odporúčané klinické nastavenia prístupov pre všetky roly?')) return;
    const defaults = PermissionsService.resetToDefaults();
    setPermissions(defaults);
    setSaveStatus('Oprávnenia boli obnovené na odporúčané nastavenia SAY CLINIC.');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  // Zmena simulovanej roly
  const handleSelectSimulatedRole = (role: RoleType | null) => {
    PermissionsService.setSimulatedRole(role);
    setSimulatedRole(role);
    setSaveStatus(
      role 
        ? `Aktivovaný náhľad rozhrania: ${PermissionsService.getRoleTitle(role)}. Navigácia sa prispôsobila.` 
        : 'Náhľad bol ukončený. Ste späť vo svojom plnom profile.'
    );
    setTimeout(() => setSaveStatus(null), 3500);
  };

  // Uloženie upraveného alebo nového používateľa
  const handleSaveUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editingUser.name.trim() || !editingUser.email.trim()) {
      alert('Vyplňte prosím celé meno a prihlasovací email.');
      return;
    }

    const updated = UserService.saveUser(editingUser);
    setUsersList(updated);
    setEditingUser(null);
    setIsCreatingNewUser(false);
    setSaveStatus(`Profil používateľa ${editingUser.name} bol úspešne uložený.`);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  // Zmazanie používateľa
  const handleDeleteUser = (userId: string, userName: string) => {
    if (userId === 'u1') {
      alert('Hlavný profil CEO nie je možné odstrániť.');
      return;
    }
    if (!confirm(`Naozaj si prajete odstrániť člena tímu ${userName}?`)) return;

    const updated = UserService.deleteUser(userId);
    setUsersList(updated);
    setSaveStatus(`Člen tímu ${userName} bol odstránený.`);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  // Zahájenie tvorby nového používateľa
  const handleStartCreateUser = () => {
    const newId = `u${Date.now().toString().slice(-4)}`;
    setEditingUser({
      id: newId,
      name: '',
      email: '',
      role: 'nurse',
      title: 'Zdravotná sestra',
      avatarBg: 'bg-[#2A4736]',
      avatarUrl: '/avatars/foltani.jpg?v=3'
    });
    setIsCreatingNewUser(true);
  };

  const ROLES_ORDER: { key: RoleType; title: string; subtitle: string; icon: string }[] = [
    { key: 'ceo', title: 'CEO & Primár', subtitle: 'MUDr. Ján Mráz', icon: '👑' },
    { key: 'doctor', title: 'Lekár / Chirurg', subtitle: 'Lekári a anesteziológ', icon: '🩺' },
    { key: 'manager', title: 'Klinický Manažment', subtitle: 'Ing. Mecerodová, Mgr. Solivajsová', icon: '💼' },
    { key: 'nurse', title: 'Zdravotná sestra', subtitle: 'Ema Foltáni, sestry', icon: '🩺' },
    { key: 'receptionist', title: 'Recepčná', subtitle: 'Viktória Foltániová', icon: '🛎️' },
  ];

  const filteredUsers = usersList.filter(u => 
    u.name.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
    (u.title && u.title.toLowerCase().includes(searchUserQuery.toLowerCase()))
  );

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
                  Správa oprávnení & Profilov personálu
                </h3>
                <span className="text-[10px] font-mono uppercase bg-[#C5A059]/15 text-[#8C6D2B] px-2 py-0.5 rounded-full font-bold border border-[#C5A059]/30">
                  CEO & Manažment
                </span>
              </div>
              <p className="text-xs text-[#8C857B]">
                Prístupové práva k modulom, správa profilov tímu, role a Genmoji avatary
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
          <div className="bg-[#FAF6EF] border-b border-[#E6D4B2] px-6 py-2.5 text-xs text-[#8C6D2B] flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-[#C5A059]" />
              <span>{saveStatus}</span>
            </div>
          </div>
        )}

        {/* PODZÁLOŽKY (MATRIX vs. PROFILY TÍMU vs. SIMULÁCIA) */}
        <div className="px-6 pt-3 border-b border-[#E8E2D9] flex items-center justify-between gap-4 bg-[#FAF8F5]/60 flex-wrap">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setActiveSubTab('matrix'); setEditingUser(null); }}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'matrix'
                  ? 'border-[#C5A059] text-[#2C2A29]'
                  : 'border-transparent text-[#8C857B] hover:text-[#2C2A29]'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Matica oprávnení</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveSubTab('users'); setEditingUser(null); }}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'users'
                  ? 'border-[#C5A059] text-[#2C2A29]'
                  : 'border-transparent text-[#8C857B] hover:text-[#2C2A29]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Profily tímu & Personál</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#E8E2D9] font-mono">
                {usersList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveSubTab('simulation'); setEditingUser(null); }}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'simulation'
                  ? 'border-[#C5A059] text-[#2C2A29]'
                  : 'border-transparent text-[#8C857B] hover:text-[#2C2A29]'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>Simulácia rolí</span>
              {simulatedRole && (
                <span className="w-2 h-2 rounded-full bg-[#C5A059] animate-pulse"></span>
              )}
            </button>
          </div>

          {activeSubTab === 'matrix' && canManage && (
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-xs text-[#8C857B] hover:text-rose-600 transition-colors flex items-center gap-1.5 pb-2 cursor-pointer"
              title="Vrátiť na predvolené klinické oprávnenia"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Obnoviť odporúčané</span>
            </button>
          )}

          {activeSubTab === 'users' && canManage && (
            <button
              type="button"
              onClick={handleStartCreateUser}
              className="px-3 py-1.5 mb-2 bg-[#2C2A29] hover:bg-[#C5A059] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Pridať člena personálu</span>
            </button>
          )}
        </div>

        {/* OBSAH MODALU */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* 1. MATICA OPRÁVNENÍ (5 ROLÍ) */}
          {activeSubTab === 'matrix' && (
            <div className="space-y-6">
              
              {/* TABUĽKA PRÍSTUPOV K ZÁLOŽKÁM */}
              <div className="border border-[#E8E2D9] rounded-2xl overflow-hidden shadow-2xs">
                <div className="bg-[#FAF8F5] p-3 border-b border-[#E8E2D9]">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#2C2A29]">
                    1. Prístup k hlavným modulom a záložkám
                  </h4>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#E8E2D9] bg-white text-[#8C857B]">
                        <th className="py-3 px-4 font-bold uppercase text-[10px] min-w-[200px]">Modul / Funkcia</th>
                        {ROLES_ORDER.map(r => (
                          <th key={r.key} className="py-3 px-3 font-bold text-center min-w-[110px]">
                            <div className="text-base">{r.icon}</div>
                            <div className="text-[11px] text-[#2C2A29] font-bold">{r.title}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E2D9] bg-white">
                      {TABS_REGISTRY.map((tab) => (
                        <tr key={tab.id} className="hover:bg-[#FAF8F5] transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2 font-bold text-[#2C2A29]">
                              <span className="text-sm">{tab.icon}</span>
                              <span>{tab.label}</span>
                            </div>
                            <div className="text-[11px] text-[#8C857B] mt-0.5 line-clamp-1">
                              {tab.description}
                            </div>
                          </td>

                          {ROLES_ORDER.map(r => {
                            const isAllowed = permissions[r.key]?.allowedTabs.includes(tab.id);
                            const isLocked = !canManage || (r.key === 'ceo' && tab.id === 'home');
                            return (
                              <td key={r.key} className="py-3 px-3 text-center align-middle">
                                <button
                                  type="button"
                                  disabled={isLocked}
                                  onClick={() => handleToggleTab(r.key, tab.id)}
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

              {/* ŠPECIÁLNE OPRÁVNENIA */}
              <div className="border border-[#E8E2D9] rounded-2xl overflow-hidden shadow-2xs">
                <div className="bg-[#FAF8F5] p-3 border-b border-[#E8E2D9]">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#2C2A29]">
                    2. Špeciálne a finančné oprávnenia
                  </h4>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#E8E2D9] bg-white text-[#8C857B]">
                        <th className="py-3 px-4 font-bold uppercase text-[10px] min-w-[200px]">Oprávnenie</th>
                        {ROLES_ORDER.map(r => (
                          <th key={r.key} className="py-3 px-3 font-bold text-center min-w-[110px]">
                            <div className="text-[11px] text-[#2C2A29] font-bold">{r.title}</div>
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
                            const isLocked = !canManage || (r.key === 'ceo' && (perm.id === 'manage_permissions' || perm.id === 'reset_financial_data'));
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

          {/* 2. PROFILY PERSONÁLU & TÍM (SPRÁVA, ÚPRAVA, GENMOJI) */}
          {activeSubTab === 'users' && (
            <div className="space-y-4">
              
              {/* VYHĽADÁVANIE PERSONÁLU */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-[#8C857B]" />
                  <input
                    type="text"
                    placeholder="Hľadať v personále..."
                    value={searchUserQuery}
                    onChange={e => setSearchUserQuery(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-[#E8E2D9] focus:border-[#C5A059] outline-none bg-white"
                  />
                </div>
                <div className="text-xs text-[#8C857B]">
                  Zobrazených <strong className="text-[#2C2A29]">{filteredUsers.length}</strong> z {usersList.length} členov tímu
                </div>
              </div>

              {/* FORMULÁR PRE ÚPRAVU / PRIDANIE ČLENA */}
              {editingUser && (
                <form onSubmit={handleSaveUserSubmit} className="p-5 bg-gradient-to-r from-[#FAF8F5] to-white border-2 border-[#C5A059] rounded-2xl space-y-4 shadow-sm animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#C5A059]" />
                      <h4 className="font-bold text-sm text-[#2C2A29]">
                        {isCreatingNewUser ? 'Pridať nového člena personálu' : `Upraviť profil: ${editingUser.name}`}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingUser(null)}
                      className="text-xs text-[#8C857B] hover:text-[#2C2A29]"
                    >
                      Zrušiť
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-[#2C2A29] mb-1">Celé meno</label>
                      <input
                        type="text"
                        required
                        placeholder="Napr. MUDr. Ján Novák / Viktória Foltániová"
                        value={editingUser.name}
                        onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-[#E8E2D9] bg-white focus:border-[#C5A059] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#2C2A29] mb-1">Pracovná pozícia / Titul</label>
                      <input
                        type="text"
                        placeholder="Napr. Recepčná & Koordinátorka, Anesteziológ (OAIM)..."
                        value={editingUser.title}
                        onChange={e => setEditingUser({ ...editingUser, title: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-[#E8E2D9] bg-white focus:border-[#C5A059] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#2C2A29] mb-1">Prihlasovací email</label>
                      <input
                        type="email"
                        required
                        placeholder="meno@sayclinic.sk"
                        value={editingUser.email}
                        onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-[#E8E2D9] bg-white focus:border-[#C5A059] outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#2C2A29] mb-1">Systémová rola (Oprávnenia)</label>
                      <select
                        value={editingUser.role}
                        onChange={e => setEditingUser({ ...editingUser, role: e.target.value as RoleType })}
                        className="w-full p-2.5 rounded-xl border border-[#E8E2D9] bg-white focus:border-[#C5A059] outline-none"
                      >
                        <option value="ceo">CEO & Primár (plné práva)</option>
                        <option value="doctor">Lekár / Chirurg (medicínske moduly, operácie)</option>
                        <option value="manager">Klinický Manažment (správa personálu, pokladňa, projekty)</option>
                        <option value="nurse">Zdravotná sestra (kartotéka, recepty, sklad)</option>
                        <option value="receptionist">Recepčná (kartotéka a kalendár)</option>
                      </select>
                    </div>
                  </div>

                  {/* VÝBER GENMOJI AVATARA */}
                  <div>
                    <label className="block font-bold text-[#2C2A29] mb-2 text-xs">
                      Výber 3D Genmoji avatara:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {PRESET_GENMOJIS.map(g => {
                        const isSelected = editingUser.avatarUrl === g.url || (!editingUser.avatarUrl && editingUser.id === g.id);
                        return (
                          <div
                            key={g.id}
                            onClick={() => setEditingUser({ ...editingUser, avatarUrl: g.url })}
                            className={`p-2 rounded-xl border text-center cursor-pointer transition-all flex flex-col items-center gap-1.5 ${
                              isSelected
                                ? 'border-[#C5A059] bg-[#FAF8F5] shadow-xs'
                                : 'border-[#E8E2D9] bg-white hover:border-[#C5A059]'
                            }`}
                          >
                            <div className="w-12 h-12 rounded-full overflow-hidden border border-[#E8E2D9] bg-white flex items-center justify-center">
                              <img src={g.url} alt={g.label} className="w-full h-full object-cover" />
                            </div>
                            <span className="text-[10px] text-[#2C2A29] font-medium truncate w-full">
                              {g.label.split('(')[0]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E2D9]">
                    <button
                      type="button"
                      onClick={() => setEditingUser(null)}
                      className="px-4 py-2 border border-[#E8E2D9] text-[#8C857B] hover:text-[#2C2A29] rounded-xl text-xs font-semibold"
                    >
                      Zrušiť
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#2C2A29] hover:bg-[#C5A059] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Uložiť profil personálu</span>
                    </button>
                  </div>
                </form>
              )}

              {/* ZOZNAM KARIET POUŽÍVATEĽOV */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredUsers.map(user => {
                  const roleConfig = permissions[user.role] || PermissionsService.getAllPermissions()[user.role];
                  const allowedTabsCount = roleConfig?.allowedTabs?.length || 0;

                  return (
                    <div 
                      key={user.id} 
                      className="p-4 rounded-2xl border border-[#E8E2D9] bg-white hover:border-[#C5A059] transition-all space-y-3 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-xl border border-[#C5A059] overflow-hidden flex items-center justify-center bg-white shrink-0 shadow-2xs">
                            <LiquidAvatar 
                              id={user.id} 
                              name={user.name} 
                              role={user.role} 
                              avatarUrl={user.avatarUrl}
                              className="w-full h-full" 
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-[#2C2A29] truncate">{user.name}</div>
                            <div className="text-[11px] text-[#C5A059] font-medium truncate">{user.title || PermissionsService.getRoleTitle(user.role)}</div>
                            <div className="text-[10px] text-[#8C857B] font-mono truncate">{user.email}</div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${PermissionsService.getRoleBadgeClass(user.role)}`}>
                            {PermissionsService.getRoleTitle(user.role)}
                          </span>

                          {canManage && (
                            <div className="flex items-center gap-1 pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingUser(user);
                                  setIsCreatingNewUser(false);
                                }}
                                className="p-1.5 rounded-lg border border-[#E8E2D9] hover:border-[#C5A059] hover:bg-[#FAF8F5] text-[#2C2A29] text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                title="Upraviť údaje a Genmoji profil"
                              >
                                <Edit2 className="w-3 h-3 text-[#C5A059]" />
                                <span>Upraviť</span>
                              </button>

                              {user.id !== 'u1' && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(user.id, user.name)}
                                  className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                                  title="Odstrániť člena"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#E8E2D9] space-y-1.5 text-[11px]">
                        <div className="flex justify-between items-center text-[#6B655E]">
                          <span>Prístup k modulom:</span>
                          <span className="font-mono font-bold text-[#2C2A29]">
                            {allowedTabsCount} z {TABS_REGISTRY.length} záložiek
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1 pt-0.5">
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
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. SIMULÁCIA ROLÍ (5 ROLÍ) */}
          {activeSubTab === 'simulation' && canManage && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-[#FAF8F5] to-white border border-[#E8E2D9] space-y-2">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-[#C5A059]" />
                  <h4 className="font-bold text-sm text-[#2C2A29]">
                    Klinická simulácia zobrazenia (Test rolí)
                  </h4>
                </div>
                <p className="text-xs text-[#6B655E]">
                  Ako CEO alebo Manažér kliniky si môžete okamžite vyskúšať, ako vyzerá systém pre recepčnú, zdravotnú sestru či chirurga. Simulácia dočasne skryje záložky a funkcie presne tak, ako ich vidí daná rola.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                
                {/* 1. SESTRA */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  simulatedRole === 'nurse' 
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/20' 
                    : 'border-[#E8E2D9] bg-white hover:border-[#C5A059]'
                }`}>
                  <div className="text-2xl mb-2">🩺</div>
                  <h5 className="font-bold text-xs text-[#2C2A29]">Zdravotná sestra</h5>
                  <p className="text-[10px] text-[#8C857B] mt-1">Kartotéka, recepty, kalendár a sklad.</p>
                  <button
                    type="button"
                    onClick={() => handleSelectSimulatedRole(simulatedRole === 'nurse' ? null : 'nurse')}
                    className={`mt-4 w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      simulatedRole === 'nurse'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-[#FAF8F5] text-[#2C2A29] hover:bg-[#2C2A29] hover:text-white'
                    }`}
                  >
                    {simulatedRole === 'nurse' ? 'Aktivované ✓' : 'Vyskúšať'}
                  </button>
                </div>

                {/* 2. RECEPČNÁ */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  simulatedRole === 'receptionist' 
                    ? 'border-purple-500 bg-purple-50/50 shadow-md ring-2 ring-purple-500/20' 
                    : 'border-[#E8E2D9] bg-white hover:border-[#C5A059]'
                }`}>
                  <div className="text-2xl mb-2">🛎️</div>
                  <h5 className="font-bold text-xs text-[#2C2A29]">Recepčná</h5>
                  <p className="text-[10px] text-[#8C857B] mt-1">Iba Prehľad, Kartotéka a Kalendár.</p>
                  <button
                    type="button"
                    onClick={() => handleSelectSimulatedRole(simulatedRole === 'receptionist' ? null : 'receptionist')}
                    className={`mt-4 w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      simulatedRole === 'receptionist'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-[#FAF8F5] text-[#2C2A29] hover:bg-[#2C2A29] hover:text-white'
                    }`}
                  >
                    {simulatedRole === 'receptionist' ? 'Aktivované ✓' : 'Vyskúšať'}
                  </button>
                </div>

                {/* 3. LEKÁR */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  simulatedRole === 'doctor' 
                    ? 'border-sky-500 bg-sky-50/50 shadow-md ring-2 ring-sky-500/20' 
                    : 'border-[#E8E2D9] bg-white hover:border-[#C5A059]'
                }`}>
                  <div className="text-2xl mb-2">👨‍⚕️</div>
                  <h5 className="font-bold text-xs text-[#2C2A29]">Lekár / Chirurg</h5>
                  <p className="text-[10px] text-[#8C857B] mt-1">Medicína, protokoly, botox a sály.</p>
                  <button
                    type="button"
                    onClick={() => handleSelectSimulatedRole(simulatedRole === 'doctor' ? null : 'doctor')}
                    className={`mt-4 w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      simulatedRole === 'doctor'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-[#FAF8F5] text-[#2C2A29] hover:bg-[#2C2A29] hover:text-white'
                    }`}
                  >
                    {simulatedRole === 'doctor' ? 'Aktivované ✓' : 'Vyskúšať'}
                  </button>
                </div>

                {/* 4. MANAŽMENT */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  simulatedRole === 'manager' 
                    ? 'border-amber-500 bg-amber-50/50 shadow-md ring-2 ring-amber-500/20' 
                    : 'border-[#E8E2D9] bg-white hover:border-[#C5A059]'
                }`}>
                  <div className="text-2xl mb-2">💼</div>
                  <h5 className="font-bold text-xs text-[#2C2A29]">Manažment</h5>
                  <p className="text-[10px] text-[#8C857B] mt-1">Pokladňa POS, faktúry a projekty.</p>
                  <button
                    type="button"
                    onClick={() => handleSelectSimulatedRole(simulatedRole === 'manager' ? null : 'manager')}
                    className={`mt-4 w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      simulatedRole === 'manager'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-[#FAF8F5] text-[#2C2A29] hover:bg-[#2C2A29] hover:text-white'
                    }`}
                  >
                    {simulatedRole === 'manager' ? 'Aktivované ✓' : 'Vyskúšať'}
                  </button>
                </div>

                {/* 5. CEO REŽIM */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  simulatedRole === null 
                    ? 'border-[#2C2A29] bg-[#FAF8F5] shadow-md ring-2 ring-[#C5A059]' 
                    : 'border-[#E8E2D9] bg-white hover:border-[#C5A059]'
                }`}>
                  <div className="text-2xl mb-2">👑</div>
                  <h5 className="font-bold text-xs text-[#2C2A29]">Plný režim</h5>
                  <p className="text-[10px] text-[#8C857B] mt-1">Kompletný prístup ku všetkým modulom.</p>
                  <button
                    type="button"
                    onClick={() => handleSelectSimulatedRole(null)}
                    className={`mt-4 w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      simulatedRole === null
                        ? 'bg-[#2C2A29] text-[#C5A059] shadow-xs'
                        : 'bg-[#FAF8F5] text-[#2C2A29] hover:bg-[#2C2A29] hover:text-white'
                    }`}
                  >
                    {simulatedRole === null ? 'Aktívne (Všetko) ✓' : 'Zresetovať'}
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* PÄTIČKA */}
        <div className="p-4 sm:p-5 border-t border-[#E8E2D9] bg-[#FAF8F5] flex items-center justify-between">
          <div className="text-[11px] text-[#8C857B] flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Zmeny oprávnení a profilov sa okamžite ukladajú a synchronizujú v reálnom čase</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#2C2A29] hover:bg-[#C5A059] text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
          >
            Zatvoriť
          </button>
        </div>

      </div>
    </div>
  );
}
