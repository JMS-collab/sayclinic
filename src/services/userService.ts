import { UserAccount, SAY_CLINIC_USERS } from '../components/LoginForm';
import { RealtimeSyncService } from './realtimeSyncService';

const USERS_STORAGE_KEY = 'say_clinic_custom_users_v1';

export const UserService = {
  // Získa zoznam všetkých používateľov (z localStorage alebo predvolených)
  getUsers(): UserAccount[] {
    if (typeof window === 'undefined') return SAY_CLINIC_USERS;
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (stored) {
        const parsed: UserAccount[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Chyba pri načítaní používateľov:', e);
    }
    return SAY_CLINIC_USERS;
  },

  // Uloží alebo aktualizuje profil používateľa
  saveUser(user: UserAccount): UserAccount[] {
    const current = this.getUsers();
    const existingIndex = current.findIndex(u => u.id === user.id);
    let updated: UserAccount[];

    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = { ...updated[existingIndex], ...user };
    } else {
      updated = [...current, user];
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('say_clinic_users_changed', { detail: updated }));
        RealtimeSyncService.publish('users_updated', updated);
      } catch (e) {
        console.error('Chyba pri ukladaní používateľa:', e);
      }
    }
    return updated;
  },

  // Odstráni používateľa (CEO u1 nie je možné vymazať)
  deleteUser(id: string): UserAccount[] {
    if (id === 'u1') return this.getUsers();
    const current = this.getUsers();
    const updated = current.filter(u => u.id !== id);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('say_clinic_users_changed', { detail: updated }));
        RealtimeSyncService.publish('users_updated', updated);
      } catch (e) {
        console.error('Chyba pri odstraňovaní používateľa:', e);
      }
    }
    return updated;
  },

  // Obnoví používateľov na predvolené továrenské nastavenia
  resetToDefaults(): UserAccount[] {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USERS_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('say_clinic_users_changed', { detail: SAY_CLINIC_USERS }));
    }
    return SAY_CLINIC_USERS;
  }
};
