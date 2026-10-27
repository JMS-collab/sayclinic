'use client';

import React, { useState } from 'react';
import { 
  X, 
  SlidersHorizontal, 
  ChevronUp, 
  ChevronDown, 
  Check, 
  RotateCcw, 
  FolderOpen, 
  UserPlus, 
  Calendar as CalendarIcon, 
  FileText, 
  Pill, 
  Sparkles, 
  ShoppingBag, 
  Boxes, 
  BarChart3, 
  Briefcase 
} from 'lucide-react';
import { UserAccount } from './LoginForm';
import { 
  QUICK_ACTIONS_CATALOG, 
  QuickActionItem, 
  UserQuickActionPreference, 
  getDefaultPreferencesForRole,
  saveUserQuickActionPreferences
} from '../data/quickActionsCatalog';
import { PermissionsService } from '../services/permissionsService';

interface QuickActionsCustomizeModalProps {
  currentUser: UserAccount;
  currentPreferences: UserQuickActionPreference[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (newPreferences: UserQuickActionPreference[]) => void;
}

export default function QuickActionsCustomizeModal({
  currentUser,
  currentPreferences,
  isOpen,
  onClose,
  onSave
}: QuickActionsCustomizeModalProps) {
  // Pracovný zoznam preferencií v modále
  const [workingList, setWorkingList] = useState<UserQuickActionPreference[]>(() => {
    // Overíme, že v zozname sú všetky prvky katalógu
    const existingMap = new Map(currentPreferences.map(p => [p.id, p.enabled]));
    const list: UserQuickActionPreference[] = [];
    
    // Pridáme najskôr existujúce v ich poradí
    currentPreferences.forEach(p => {
      list.push({ id: p.id, enabled: p.enabled });
    });
    
    // A doťaháme prípadne chýbajúce
    QUICK_ACTIONS_CATALOG.forEach(cat => {
      if (!existingMap.has(cat.id)) {
        list.push({
          id: cat.id,
          enabled: cat.defaultEnabledRoles.includes(currentUser.role)
        });
      }
    });

    return list;
  });

  const [notification, setNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filtrujeme akcie podľa oprávnení používateľa
  const accessibleCatalogMap = new Map<string, QuickActionItem>();
  QUICK_ACTIONS_CATALOG.forEach(item => {
    if (PermissionsService.canUserAccessTab(currentUser, item.tabId)) {
      accessibleCatalogMap.set(item.id, item);
    }
  });

  // Iba položky, ktoré používateľ smie vidieť
  const visibleItems = workingList.filter(item => accessibleCatalogMap.has(item.id));

  const toggleAction = (id: string) => {
    setWorkingList(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, enabled: !item.enabled };
      }
      return item;
    }));
  };

  const moveItem = (visibleIndex: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? visibleIndex - 1 : visibleIndex + 1;
    if (targetIndex < 0 || targetIndex >= visibleItems.length) return;

    const currentItem = visibleItems[visibleIndex];
    const targetItem = visibleItems[targetIndex];

    // Nájdeme skutočné indexy vo full workingList
    const fullCurrentIdx = workingList.findIndex(x => x.id === currentItem.id);
    const fullTargetIdx = workingList.findIndex(x => x.id === targetItem.id);

    if (fullCurrentIdx === -1 || fullTargetIdx === -1) return;

    const next = [...workingList];
    const temp = next[fullCurrentIdx];
    next[fullCurrentIdx] = next[fullTargetIdx];
    next[fullTargetIdx] = temp;

    setWorkingList(next);
  };

  const handleResetToRoleDefaults = () => {
    const defaults = getDefaultPreferencesForRole(currentUser.role);
    setWorkingList(defaults);
    setNotification('Nastavenia boli obnovené na odporúčané hodnoty pre vašu rolu.');
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSaveAndApply = () => {
    saveUserQuickActionPreferences(currentUser.id, workingList);
    onSave(workingList);
    onClose();
  };

  const renderIcon = (iconName: string) => {
    const iconClass = "w-4 h-4 text-[#C5A059]";
    switch (iconName) {
      case 'FolderOpen': return <FolderOpen className={iconClass} />;
      case 'UserPlus': return <UserPlus className={iconClass} />;
      case 'Calendar': return <CalendarIcon className={iconClass} />;
      case 'FileText': return <FileText className={iconClass} />;
      case 'Pill': return <Pill className={iconClass} />;
      case 'Sparkles': return <Sparkles className={iconClass} />;
      case 'ShoppingBag': return <ShoppingBag className={iconClass} />;
      case 'Boxes': return <Boxes className={iconClass} />;
      case 'BarChart3': return <BarChart3 className={iconClass} />;
      case 'Briefcase': return <Briefcase className={iconClass} />;
      default: return <Sparkles className={iconClass} />;
    }
  };

  const enabledCount = visibleItems.filter(i => i.enabled).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C2A29]/40 backdrop-blur-md animate-in fade-in duration-200 print:hidden">
      <div className="bg-white border border-[#E8E2D9] w-full max-w-xl rounded-3xl shadow-[0_25px_70px_rgba(44,42,41,0.22)] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* HLAVIČKA */}
        <div className="px-6 py-5 border-b border-[#E8E2D9] flex items-center justify-between bg-[#FAF8F5]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white border border-[#E8E2D9] text-[#C5A059] shadow-2xs">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-brand text-lg font-bold text-[#2C2A29] uppercase tracking-wider">
                Prispôsobiť Rýchle Akcie
              </h3>
              <p className="text-xs text-[#8C857B]">
                Osobná nástenka: <strong className="text-[#2C2A29]">{currentUser.name}</strong> ({currentUser.title || currentUser.role})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#8C857B] hover:text-[#2C2A29] rounded-xl hover:bg-white border border-transparent hover:border-[#E8E2D9] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NOTIFIKÁCIA / OZNÁMENIE */}
        {notification && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* POPIS A POČÍTADLO */}
        <div className="px-6 pt-4 pb-2 flex items-center justify-between text-xs text-[#8C857B]">
          <p>
            Zaškrtnutím zapnite akcie, ktoré chcete mať na nástenke, a šípkami zvoľte ich poradie.
          </p>
          <span className="shrink-0 ml-3 px-2.5 py-1 rounded-full font-bold bg-[#FAF8F5] border border-[#E8E2D9] text-[#2C2A29]">
            {enabledCount} z {visibleItems.length} aktívnych
          </span>
        </div>

        {/* ZOZNAM AKCIÍ */}
        <div className="px-6 py-2 overflow-y-auto space-y-2 flex-1 divide-y divide-[#E8E2D9]/40">
          {visibleItems.map((item, index) => {
            const meta = accessibleCatalogMap.get(item.id);
            if (!meta) return null;

            return (
              <div 
                key={item.id}
                className={`pt-2.5 pb-2.5 flex items-center justify-between gap-3 transition-colors rounded-xl px-2.5 ${
                  item.enabled ? 'bg-white hover:bg-[#FAF8F5]/70' : 'bg-[#FAF8F5]/40 opacity-60 hover:opacity-90'
                }`}
              >
                {/* PREPÍNAČ A INFORMÁCIE */}
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  {/* ON/OFF TOGGLE SWITCH */}
                  <button
                    type="button"
                    onClick={() => toggleAction(item.id)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      item.enabled ? 'bg-[#2C2A29]' : 'bg-[#D1C9BE]'
                    }`}
                    role="switch"
                    aria-checked={item.enabled}
                    title={item.enabled ? 'Vypnúť akciu' : 'Zapnúť akciu'}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        item.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>

                  <div className="p-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] shrink-0">
                    {renderIcon(meta.iconName)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-bold truncate ${item.enabled ? 'text-[#2C2A29]' : 'text-[#8C857B]'}`}>
                      {meta.label}
                    </p>
                    <p className="text-[11px] text-[#8C857B] truncate">
                      {meta.description}
                    </p>
                  </div>
                </div>

                {/* TLAČIDLÁ PRE POSUN PORADIA */}
                <div className="flex items-center gap-1 shrink-0 pl-2">
                  <button
                    type="button"
                    onClick={() => moveItem(index, 'up')}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg border border-[#E8E2D9] text-[#6B6357] hover:text-[#2C2A29] hover:bg-[#FAF8F5] disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer"
                    title="Posunúť vyššie"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(index, 'down')}
                    disabled={index === visibleItems.length - 1}
                    className="p-1.5 rounded-lg border border-[#E8E2D9] text-[#6B6357] hover:text-[#2C2A29] hover:bg-[#FAF8F5] disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer"
                    title="Posunúť nižšie"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* PÄTKA MODÁLU */}
        <div className="px-6 py-4 border-t border-[#E8E2D9] bg-[#FAF8F5] flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetToRoleDefaults}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#E8E2D9] hover:border-[#C5A059] text-xs font-bold text-[#6B6357] hover:text-[#2C2A29] bg-white transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Predvolené pre rolu</span>
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-[#E8E2D9] text-xs font-semibold text-[#8C857B] hover:text-[#2C2A29] hover:bg-white transition-all cursor-pointer"
            >
              Zrušiť
            </button>
            <button
              type="button"
              onClick={handleSaveAndApply}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#2C2A29] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Uložiť zmeny</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
