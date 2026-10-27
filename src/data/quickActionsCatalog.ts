import { TabId, RoleType } from '../services/permissionsService';

export interface QuickActionItem {
  id: string;
  tabId: TabId;
  label: string;
  description: string;
  iconName: 'FolderOpen' | 'UserPlus' | 'Calendar' | 'FileText' | 'Pill' | 'Sparkles' | 'ShoppingBag' | 'Boxes' | 'BarChart3' | 'Briefcase';
  badge?: string;
  actionType: 'tab' | 'new_patient';
  defaultEnabledRoles: RoleType[];
}

export interface UserQuickActionPreference {
  id: string;
  enabled: boolean;
}

export const QUICK_ACTIONS_CATALOG: QuickActionItem[] = [
  {
    id: 'patients',
    tabId: 'patients',
    label: 'Kartotéka pacientov 360°',
    description: 'Komplexný prehľad pacientov, zdravotná dokumentácia a história vyšetrení',
    iconName: 'FolderOpen',
    actionType: 'tab',
    defaultEnabledRoles: ['ceo', 'doctor', 'manager', 'nurse', 'receptionist']
  },
  {
    id: 'new_patient',
    tabId: 'patients',
    label: 'Zaevidovať nového pacienta',
    description: 'Bleskové založenie novej zdravotnej karty a automatickej zložky na Drive',
    iconName: 'UserPlus',
    actionType: 'new_patient',
    defaultEnabledRoles: ['ceo', 'doctor', 'manager', 'nurse', 'receptionist']
  },
  {
    id: 'calendar',
    tabId: 'calendar',
    label: 'Kalendár operačných sál',
    description: 'Harmonogram sál SAY, Rudlová, kontroly a dospávacie izby',
    iconName: 'Calendar',
    actionType: 'tab',
    defaultEnabledRoles: ['ceo', 'doctor', 'manager', 'nurse', 'receptionist']
  },
  {
    id: 'generator',
    tabId: 'generator',
    label: 'Nový lekársky záznam & protokol',
    description: 'Operačné protokoly, prepúšťacie správy, nálezy a informované súhlasy',
    iconName: 'FileText',
    actionType: 'tab',
    defaultEnabledRoles: ['ceo', 'doctor', 'manager', 'nurse']
  },
  {
    id: 'prescriptions',
    tabId: 'prescriptions',
    label: 'Vystaviť lekársky recept (Rp.)',
    description: 'Predpisovanie a tlač receptov ŠEVT 14 282 2s s katalógom liekov',
    iconName: 'Pill',
    actionType: 'tab',
    defaultEnabledRoles: ['ceo', 'doctor']
  },
  {
    id: 'aesthetics',
    tabId: 'aesthetics',
    label: 'Estetická mapa & aplikácia',
    description: 'Interaktívna tvárová mapa, Botox, kyselina hyalurónová a šarže',
    iconName: 'Sparkles',
    actionType: 'tab',
    defaultEnabledRoles: ['ceo', 'doctor', 'nurse']
  },
  {
    id: 'inventory',
    tabId: 'inventory',
    label: 'Sklad materiálu & Implantáty',
    description: 'Skladové zásoby, šarže implantátov Motiva, expirácie a odpis',
    iconName: 'Boxes',
    actionType: 'tab',
    defaultEnabledRoles: ['ceo', 'manager', 'nurse', 'doctor']
  },
  {
    id: 'cosmetics',
    tabId: 'cosmetics',
    label: 'Pokladňa POS & Kozmetika',
    description: 'Predaj pooperačnej dermokozmetiky, krémov a doplnkov klientkám',
    iconName: 'ShoppingBag',
    actionType: 'tab',
    defaultEnabledRoles: ['ceo', 'manager', 'receptionist']
  },
  {
    id: 'finance',
    tabId: 'finance',
    label: 'Financie & Fakturácia',
    description: 'Evidencia záloh, vyúčtovanie operácií a ekonomický prehľad',
    iconName: 'BarChart3',
    actionType: 'tab',
    defaultEnabledRoles: ['ceo', 'manager']
  },
  {
    id: 'projects',
    tabId: 'projects',
    label: 'Projekty & Smernice kliniky',
    description: 'Operatívne úlohy vedenia, projekty a štandardné postupy tímu',
    iconName: 'Briefcase',
    actionType: 'tab',
    defaultEnabledRoles: ['ceo', 'manager']
  }
];

const STORAGE_PREFIX = 'say_user_quick_actions_';

export function getDefaultPreferencesForRole(role: RoleType): UserQuickActionPreference[] {
  return QUICK_ACTIONS_CATALOG.map(action => ({
    id: action.id,
    enabled: action.defaultEnabledRoles.includes(role)
  }));
}

export function getUserQuickActionPreferences(userId: string, role: RoleType): UserQuickActionPreference[] {
  if (typeof window === 'undefined') {
    return getDefaultPreferencesForRole(role);
  }

  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (raw) {
      const parsed: UserQuickActionPreference[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const existingIds = new Set(parsed.map(p => p.id));
        const missingDefaults = QUICK_ACTIONS_CATALOG
          .filter(item => !existingIds.has(item.id))
          .map(item => ({
            id: item.id,
            enabled: item.defaultEnabledRoles.includes(role),
          }));
        return [...parsed, ...missingDefaults];
      }
    }
  } catch (e) {
    console.error('Chyba pri načítaní preferencií rýchlych akcií:', e);
  }

  return getDefaultPreferencesForRole(role);
}

export function saveUserQuickActionPreferences(userId: string, preferences: UserQuickActionPreference[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(preferences));
  } catch (e) {
    console.error('Chyba pri ukladaní preferencií rýchlych akcií:', e);
  }
}
