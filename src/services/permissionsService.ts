import { UserAccount } from '../components/LoginForm';

export type RoleType = 'ceo' | 'doctor' | 'manager' | 'nurse';

export type TabId = 
  | 'home' 
  | 'generator' 
  | 'patients' 
  | 'aesthetics' 
  | 'cosmetics' 
  | 'calendar' 
  | 'inventory' 
  | 'finance' 
  | 'projects';

export type SpecialPermissionId =
  | 'view_financial_kpis'       // Zobrazenie finančných súm a obratu na nástenke
  | 'view_clinic_pnl'           // Zobrazenie celkového P&L, celkových nákladov a ziskovosti kliniky
  | 'manage_invoices'           // Vystavovanie faktúr, záloh a evidencia klientskych platieb
  | 'reset_financial_data'      // Vynulovanie cvičných/finančných dát (iba CEO)
  | 'manage_permissions';       // Úprava matice oprávnení (iba CEO)

export interface RolePermissionConfig {
  allowedTabs: TabId[];
  specialPermissions: Record<SpecialPermissionId, boolean>;
}

export interface TabMeta {
  id: TabId;
  label: string;
  icon: string;
  description: string;
  department: 'Všeobecné' | 'Klinika & Medicína' | 'Obchod & Logistika' | 'Riadenie & Financie';
}

export const TABS_REGISTRY: TabMeta[] = [
  { 
    id: 'home', 
    label: 'Prehľad (Home)', 
    icon: '🏠', 
    description: 'Hlavná nástenka, denný harmonogram pacientov, rýchle úlohy a časový prehľad',
    department: 'Všeobecné'
  },
  { 
    id: 'generator', 
    label: 'Generátor Dokumentov', 
    icon: '📄', 
    description: 'Operačné protokoly, prepúšťacie správy, informované súhlasy a lekárske nálezy',
    department: 'Klinika & Medicína'
  },
  { 
    id: 'patients', 
    label: 'Kartotéka Pacientov', 
    icon: '🗂️', 
    description: 'Databáza klientov, zdravotná karta, fotodokumentácia a história návštev',
    department: 'Klinika & Medicína'
  },
  { 
    id: 'aesthetics', 
    label: 'Botox & Výplne', 
    icon: '💉', 
    description: 'Aplikácia botulotoxínu a dermálnych výplní, interaktívna tvárová mapa, šarže a jednotky',
    department: 'Klinika & Medicína'
  },
  { 
    id: 'cosmetics', 
    label: 'Predaj & Kozmetika', 
    icon: '🛍️', 
    description: 'Pokladničný systém POS, predaj pooperačnej kozmetiky a krémov pacientkám',
    department: 'Obchod & Logistika'
  },
  { 
    id: 'calendar', 
    label: 'Kalendár & Plánovanie', 
    icon: '📅', 
    description: 'Harmonogram operačných sál SAY a Rudlová, dospávacie izby, kontroly a konzultácie',
    department: 'Klinika & Medicína'
  },
  { 
    id: 'inventory', 
    label: 'Sklad & Materiál', 
    icon: '📦', 
    description: 'Skladové zásoby implantátov Motiva, šitia, liečiv, šarže, expirácie a odpisovanie spotreby',
    department: 'Obchod & Logistika'
  },
  { 
    id: 'finance', 
    label: 'Financie & Výsledky', 
    icon: '📊', 
    description: 'Finančný manažment, zálohové a riadne faktúry, pohľadávky, P&L výkaz a rentabilita',
    department: 'Riadenie & Financie'
  },
  { 
    id: 'projects', 
    label: 'Projekty & Úlohy', 
    icon: '📑', 
    description: 'Klinické projekty, interné úlohy tímu, smernice a operatívne poverenia',
    department: 'Riadenie & Financie'
  },
];

export const SPECIAL_PERMISSIONS_REGISTRY: { id: SpecialPermissionId; label: string; description: string; sensitive: boolean }[] = [
  {
    id: 'view_financial_kpis',
    label: 'Finančné KPI na nástenke',
    description: 'Zobrazenie celkového predpokladaného obratu kliniky a tržieb na domovskej obrazovke',
    sensitive: true,
  },
  {
    id: 'view_clinic_pnl',
    label: 'Prehľad ziskovosti (P&L)',
    description: 'Prístup ku kompletnému mesačnému P&L výkazu, nákladom na mzdy/nájom a maržiam operácií',
    sensitive: true,
  },
  {
    id: 'manage_invoices',
    label: 'Fakturácia a klientske platby',
    description: 'Vystavovanie zálohových a konečných faktúr, príjem platieb a pripisovanie kreditov klientom',
    sensitive: false,
  },
  {
    id: 'reset_financial_data',
    label: 'Vynulovanie údajov na ostro',
    description: 'Globálne premazanie cvičných finančných údajov kliniky',
    sensitive: true,
  },
  {
    id: 'manage_permissions',
    label: 'Správa oprávnení profilov',
    description: 'Právo konfigurovať a meniť prístupové práva jednotlivých rolí v systéme',
    sensitive: true,
  },
];

// ODPORÚČANÉ ŠTANDARDNÉ NASTAVENIE PRE SAY CLINIC
export const RECOMMENDED_ROLE_PERMISSIONS: Record<RoleType, RolePermissionConfig> = {
  // 1. CEO & PRIMÁR (MUDr. Ján Mráz) - Kompletný neobmedzený prístup ku všetkým oblastiam
  ceo: {
    allowedTabs: ['home', 'generator', 'patients', 'aesthetics', 'cosmetics', 'calendar', 'inventory', 'finance', 'projects'],
    specialPermissions: {
      view_financial_kpis: true,
      view_clinic_pnl: true,
      manage_invoices: true,
      reset_financial_data: true,
      manage_permissions: true,
    }
  },

  // 2. LEKÁR / CHIRURG (MUDr. Sroková, MUDr. Tran, Anesteziológ)
  // Prístup k medicínskej dokumentácii, pacientom, zákrokom, kalendáru a skladu materiálu
  // ŽIADNE citlivé celoklinické financie ani celkový P&L obrat kliniky
  doctor: {
    allowedTabs: ['home', 'generator', 'patients', 'aesthetics', 'calendar', 'inventory', 'projects'],
    specialPermissions: {
      view_financial_kpis: false,
      view_clinic_pnl: false,
      manage_invoices: false,
      reset_financial_data: false,
      manage_permissions: false,
    }
  },

  // 3. KLINICKÝ MANAŽMENT & RECEPCIA (Ing. Mecerodová, Mgr. Solivajsová)
  // Prístup k organizácii kliniky, pacientom, kalendáru, pokladni POS a klientskej fakturácii (zálohy/faktúry)
  // Bez prístupu k mzdovým nákladom kliniky a bez možnosti mazať systém
  manager: {
    allowedTabs: ['home', 'generator', 'patients', 'cosmetics', 'calendar', 'inventory', 'finance', 'projects'],
    specialPermissions: {
      view_financial_kpis: true,
      view_clinic_pnl: false,
      manage_invoices: true,
      reset_financial_data: false,
      manage_permissions: false,
    }
  },

  // 4. ZDRAVOTNÁ SESTRA (Ema Foltáni, Sabina Lenhartová, Viktória Foltániová, anest. sestra)
  // Sálová a ambulantná asistencia, zdravotná karta, harmonogram operácií, odpisovanie spotreby zo skladu
  // Prísne skryté finančné a cenové moduly
  nurse: {
    allowedTabs: ['home', 'generator', 'patients', 'calendar', 'inventory', 'projects'],
    specialPermissions: {
      view_financial_kpis: false,
      view_clinic_pnl: false,
      manage_invoices: false,
      reset_financial_data: false,
      manage_permissions: false,
    }
  }
};

const STORAGE_KEY = 'say_clinic_role_permissions_v1';
const SIMULATED_ROLE_KEY = 'say_clinic_simulated_role';

export const PermissionsService = {
  // Načítanie aktuálnych oprávnení rolí z úložiska
  getAllPermissions(): Record<RoleType, RolePermissionConfig> {
    if (typeof window === 'undefined') {
      return RECOMMENDED_ROLE_PERMISSIONS;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Zabezpečíme prítomnosť všetkých kľúčov
        return {
          ceo: { ...RECOMMENDED_ROLE_PERMISSIONS.ceo, ...parsed.ceo },
          doctor: { ...RECOMMENDED_ROLE_PERMISSIONS.doctor, ...parsed.doctor },
          manager: { ...RECOMMENDED_ROLE_PERMISSIONS.manager, ...parsed.manager },
          nurse: { ...RECOMMENDED_ROLE_PERMISSIONS.nurse, ...parsed.nurse },
        };
      }
    } catch (e) {
      console.error('Chyba pri načítaní oprávnení:', e);
    }
    return RECOMMENDED_ROLE_PERMISSIONS;
  },

  // Uloženie upravených oprávnení
  savePermissions(newPermissions: Record<RoleType, RolePermissionConfig>): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPermissions));
      window.dispatchEvent(new CustomEvent('say_clinic_permissions_changed', { detail: newPermissions }));
    } catch (e) {
      console.error('Chyba pri ukladaní oprávnení:', e);
    }
  },

  // Obnovenie odporúčaných klinických oprávnení
  resetToDefaults(): Record<RoleType, RolePermissionConfig> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('say_clinic_permissions_changed', { detail: RECOMMENDED_ROLE_PERMISSIONS }));
    }
    return RECOMMENDED_ROLE_PERMISSIONS;
  },

  // Získanie efektívnej roly používateľa (s podporou dočasného náhľadu/simulácie pre CEO)
  getEffectiveRole(user: UserAccount | null): RoleType {
    if (!user) return 'nurse';
    // Ak je používateľ CEO a má aktívnu simuláciu inej roly
    const isCeo = user.role === 'ceo' || user.email === 'mraz@sayclinic.sk' || user.id === 'u1';
    if (isCeo && typeof window !== 'undefined') {
      const sim = localStorage.getItem(SIMULATED_ROLE_KEY) as RoleType | null;
      if (sim && (sim === 'ceo' || sim === 'doctor' || sim === 'manager' || sim === 'nurse')) {
        return sim;
      }
    }
    return user.role;
  },

  // Nastavenie náhľadu roly (pre CEO)
  setSimulatedRole(role: RoleType | null): void {
    if (typeof window === 'undefined') return;
    if (role === null) {
      localStorage.removeItem(SIMULATED_ROLE_KEY);
    } else {
      localStorage.setItem(SIMULATED_ROLE_KEY, role);
    }
    window.dispatchEvent(new CustomEvent('say_clinic_role_simulated', { detail: role }));
  },

  getSimulatedRole(): RoleType | null {
    if (typeof window === 'undefined') return null;
    return (localStorage.getItem(SIMULATED_ROLE_KEY) as RoleType | null) || null;
  },

  // Môže používateľ vidieť konkrétnu záložku?
  canUserAccessTab(user: UserAccount | null, tab: TabId): boolean {
    if (!user) return false;
    const effectiveRole = this.getEffectiveRole(user);
    // CEO v reálnom režime vidí vždy všetko
    if (user.role === 'ceo' && !this.getSimulatedRole()) return true;

    const all = this.getAllPermissions();
    const roleConfig = all[effectiveRole] || RECOMMENDED_ROLE_PERMISSIONS[effectiveRole];
    return roleConfig.allowedTabs.includes(tab);
  },

  // Má používateľ konkrétne špeciálne oprávnenie?
  canUserDo(user: UserAccount | null, permission: SpecialPermissionId): boolean {
    if (!user) return false;
    const effectiveRole = this.getEffectiveRole(user);
    // Skutočný CEO má vždy plné práva (ak práve nesimuluje inú rolu)
    if (user.role === 'ceo' && !this.getSimulatedRole()) return true;

    const all = this.getAllPermissions();
    const roleConfig = all[effectiveRole] || RECOMMENDED_ROLE_PERMISSIONS[effectiveRole];
    return !!roleConfig.specialPermissions[permission];
  },

  // Zoznam viditeľných tabov pre daného používateľa
  getVisibleTabs(user: UserAccount | null): TabId[] {
    if (!user) return [];
    return TABS_REGISTRY
      .filter(t => this.canUserAccessTab(user, t.id))
      .map(t => t.id);
  },

  // Ľudsky čitateľný názov roly
  getRoleTitle(role: RoleType): string {
    switch (role) {
      case 'ceo': return 'CEO & Primár';
      case 'doctor': return 'Lekár / Chirurg';
      case 'manager': return 'Klinický Manažment & Recepcia';
      case 'nurse': return 'Zdravotná sestra';
    }
  },

  // Farba odznaku roly
  getRoleBadgeClass(role: RoleType): string {
    switch (role) {
      case 'ceo': return 'bg-[#2C2A29] text-[#C5A059] border-[#C5A059]/40';
      case 'doctor': return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'manager': return 'bg-amber-50 text-amber-900 border-amber-200';
      case 'nurse': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
  }
};
