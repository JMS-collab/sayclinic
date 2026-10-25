import { db } from '../lib/firebase';
import { doc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { RealtimeSyncService } from './realtimeSyncService';
import { UserAccount, SAY_CLINIC_USERS } from '../components/LoginForm';

export interface SurgicalTeamPresets {
  operators: string[];
  assistants: string[];
  anesthesiologists: string[];
  instrumentalists: string[];
  anestNurses: string[];
}

export type SurgicalTeamRoleKey = keyof SurgicalTeamPresets;

export const DEFAULT_SURGICAL_TEAM_PRESETS: SurgicalTeamPresets = {
  operators: [
    'MUDr. Ján Mráz',
    'MUDr. Zuzana Sroková, MPH',
    'MUDr. Minh Tuong Tran'
  ],
  assistants: [
    'Bez asistencie',
    'MUDr. Zuzana Sroková, MPH',
    'MUDr. Minh Tuong Tran',
    'MUDr. Ján Mráz',
    'Sabina Lenhartová',
    'Ema Foltáni',
    'Viktória Foltániová',
    'Bc. Katarína Ondrušová'
  ],
  anesthesiologists: [
    'Anesteziológ',
    'MUDr. Peter Kováč',
    'MUDr. Ivan Bella',
    'MUDr. Martin Hraško',
    'MUDr. Elena Vargová',
    'Lokálna anestézia (bez anesteziológa)'
  ],
  instrumentalists: [
    'Sabina Lenhartová',
    'Ema Foltáni',
    'Viktória Foltániová',
    'Bc. Katarína Ondrušová',
    'Mgr. Elena Solivajsová'
  ],
  anestNurses: [
    'Anesteziologická sestra',
    'Ema Foltáni',
    'Viktória Foltániová',
    'Sabina Lenhartová',
    'Bc. Andrea Kmeťová',
    'Bez anest. sestry (Lokálna anestézia)'
  ]
};

export const STAFF_ROLE_CONFIG: Record<SurgicalTeamRoleKey, { label: string; icon: string; description: string; placeholder: string }> = {
  operators: {
    label: 'Operatér',
    icon: '🩺',
    description: 'Hlavný chirurg / lekár vykonávajúci zákrok',
    placeholder: 'napr. MUDr. Ján Mráz'
  },
  assistants: {
    label: 'Asistent',
    icon: '🤝',
    description: 'Asistujúci lekár alebo sestra pri operácii',
    placeholder: 'napr. MUDr. Zuzana Sroková, MPH'
  },
  anesthesiologists: {
    label: 'Anesteziológ',
    icon: '👨‍⚕️',
    description: 'Lekár anesteziológ zodpovedný za anestéziu',
    placeholder: 'napr. MUDr. Peter Kováč'
  },
  instrumentalists: {
    label: 'Inštrumentárka',
    icon: '✂️',
    description: 'Inštrumentujúca sestra na operačnej sále',
    placeholder: 'napr. Sabina Lenhartová'
  },
  anestNurses: {
    label: 'Anestéziologická sestra',
    icon: '💉',
    description: 'Sestra pri anestézii a pooperačnej starostlivosti',
    placeholder: 'napr. Ema Foltáni'
  }
};

const SURGICAL_DOC_REF = () => doc(db, 'clinic_settings', 'surgical_team_presets');
const USERS_DOC_REF = () => doc(db, 'clinic_settings', 'users');

// In-memory cache pre okamžité synchrónne čítanie pri prvotnom vykreslení
let cachedTeamPresets: SurgicalTeamPresets = { ...DEFAULT_SURGICAL_TEAM_PRESETS };
let cachedUsers: UserAccount[] = [...SAY_CLINIC_USERS];

export const StaffService = {
  // Získa aktuálnu pamäťovú kópiu bez nutnosti čakať na sieť
  getCachedPresets(): SurgicalTeamPresets {
    return cachedTeamPresets;
  },

  getCachedUsers(): UserAccount[] {
    return cachedUsers;
  },

  // Živý poslucháč Firestore pre chirurgický tím (reakcia v reálnom čase na všetkých zariadeniach)
  subscribeSurgicalTeam(callback: (presets: SurgicalTeamPresets) => void): Unsubscribe {
    if (typeof window === 'undefined') {
      callback(DEFAULT_SURGICAL_TEAM_PRESETS);
      return () => {};
    }

    // Okamžite vrátime aktuálnu hodnotu pre bleskové zobrazenie UI
    callback(cachedTeamPresets);

    try {
      const docRef = SURGICAL_DOC_REF();
      const unsubscribe = onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as Partial<SurgicalTeamPresets>;
          const merged: SurgicalTeamPresets = {
            operators: Array.isArray(data.operators) && data.operators.length > 0 ? data.operators : DEFAULT_SURGICAL_TEAM_PRESETS.operators,
            assistants: Array.isArray(data.assistants) && data.assistants.length > 0 ? data.assistants : DEFAULT_SURGICAL_TEAM_PRESETS.assistants,
            anesthesiologists: Array.isArray(data.anesthesiologists) && data.anesthesiologists.length > 0 ? data.anesthesiologists : DEFAULT_SURGICAL_TEAM_PRESETS.anesthesiologists,
            instrumentalists: Array.isArray(data.instrumentalists) && data.instrumentalists.length > 0 ? data.instrumentalists : DEFAULT_SURGICAL_TEAM_PRESETS.instrumentalists,
            anestNurses: Array.isArray(data.anestNurses) && data.anestNurses.length > 0 ? data.anestNurses : DEFAULT_SURGICAL_TEAM_PRESETS.anestNurses,
          };
          cachedTeamPresets = merged;
          callback(merged);
        } else {
          // Dokument v cloude ešte neexistuje -> automatický počiatočný seed
          this.saveSurgicalTeam(DEFAULT_SURGICAL_TEAM_PRESETS).catch(console.error);
        }
      }, (err) => {
        console.warn('Firestore onSnapshot (surgical_team_presets) chyba:', err);
      });

      return unsubscribe;
    } catch (e) {
      console.error('Chyba pri vytváraní poslucháča chirurgického tímu:', e);
      return () => {};
    }
  },

  // Uloženie kompletného zoznamu do Firestore
  async saveSurgicalTeam(presets: SurgicalTeamPresets): Promise<void> {
    cachedTeamPresets = presets;
    try {
      const docRef = SURGICAL_DOC_REF();
      await setDoc(docRef, {
        ...presets,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      console.error('Chyba pri ukladaní chirurgického tímu do Firestore:', err);
      throw err;
    }
  },

  // Pridanie nového mena pre konkrétnu rolu
  async addStaffMember(role: SurgicalTeamRoleKey, nameToAdd: string): Promise<SurgicalTeamPresets> {
    const trimmed = nameToAdd.trim();
    if (!trimmed) return cachedTeamPresets;

    const currentList = cachedTeamPresets[role] || [];
    if (currentList.includes(trimmed)) {
      return cachedTeamPresets;
    }

    const updated: SurgicalTeamPresets = {
      ...cachedTeamPresets,
      [role]: [...currentList, trimmed]
    };

    await this.saveSurgicalTeam(updated);
    return updated;
  },

  // Úprava (premenovanie) existujúceho mena
  async editStaffMember(role: SurgicalTeamRoleKey, index: number, newName: string): Promise<SurgicalTeamPresets> {
    const trimmed = newName.trim();
    if (!trimmed) return cachedTeamPresets;

    const currentList = [...(cachedTeamPresets[role] || [])];
    if (index < 0 || index >= currentList.length) return cachedTeamPresets;

    currentList[index] = trimmed;
    const updated: SurgicalTeamPresets = {
      ...cachedTeamPresets,
      [role]: currentList
    };

    await this.saveSurgicalTeam(updated);
    return updated;
  },

  // Vymazanie mena zo zoznamu
  async deleteStaffMember(role: SurgicalTeamRoleKey, index: number): Promise<SurgicalTeamPresets> {
    const currentList = cachedTeamPresets[role] || [];
    const updatedList = currentList.filter((_, i) => i !== index);

    const updated: SurgicalTeamPresets = {
      ...cachedTeamPresets,
      [role]: updatedList
    };

    await this.saveSurgicalTeam(updated);
    return updated;
  },

  // Obnovenie rolí na továrenské predvolené mená
  async resetRoleToDefaults(role: SurgicalTeamRoleKey): Promise<SurgicalTeamPresets> {
    const updated: SurgicalTeamPresets = {
      ...cachedTeamPresets,
      [role]: [...DEFAULT_SURGICAL_TEAM_PRESETS[role]]
    };

    await this.saveSurgicalTeam(updated);
    return updated;
  },

  // ==========================================
  // SPOLU-SYNCHRONIZÁCIA POUŽÍVATEĽOV KLINIKY
  // ==========================================

  // Živý poslucháč Firestore pre používateľské účty personálu
  subscribeUsers(callback: (users: UserAccount[]) => void): Unsubscribe {
    if (typeof window === 'undefined') {
      callback(SAY_CLINIC_USERS);
      return () => {};
    }

    callback(cachedUsers);

    try {
      const docRef = USERS_DOC_REF();
      const unsubscribe = onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (Array.isArray(data?.users) && data.users.length > 0) {
            cachedUsers = data.users;
            callback(data.users);
            return;
          }
        }
        // Inicializácia východzími používateľmi ak ešte nie sú v cloude
        this.saveAllUsers(SAY_CLINIC_USERS).catch(console.error);
      }, (err) => {
        console.warn('Firestore onSnapshot (users) chyba:', err);
      });

      return unsubscribe;
    } catch (e) {
      console.error('Chyba pri vytváraní poslucháča používateľov:', e);
      return () => {};
    }
  },

  async saveAllUsers(users: UserAccount[]): Promise<void> {
    cachedUsers = users;
    try {
      const docRef = USERS_DOC_REF();
      await setDoc(docRef, {
        users,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      RealtimeSyncService.publish('users_updated', users);
    } catch (err) {
      console.error('Chyba pri ukladaní používateľov do Firestore:', err);
      throw err;
    }
  },

  async saveUser(user: UserAccount): Promise<UserAccount[]> {
    const current = cachedUsers;
    const existingIndex = current.findIndex(u => u.id === user.id);
    let updated: UserAccount[];

    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = { ...updated[existingIndex], ...user };
    } else {
      updated = [...current, user];
    }

    await this.saveAllUsers(updated);
    return updated;
  },

  async deleteUser(id: string): Promise<UserAccount[]> {
    if (id === 'u1') return cachedUsers;
    const current = cachedUsers;
    const updated = current.filter(u => u.id !== id);
    await this.saveAllUsers(updated);
    return updated;
  },

  async resetUsersToDefaults(): Promise<UserAccount[]> {
    await this.saveAllUsers(SAY_CLINIC_USERS);
    return SAY_CLINIC_USERS;
  }
};
