import { UserAccount, SAY_CLINIC_USERS } from '../components/LoginForm';
import { StaffService } from './staffService';
import { RealtimeSyncService } from './realtimeSyncService';

export const UserService = {
  // Získa zoznam všetkých používateľov z centrálnej cache (synchronizovanej z Firestore)
  getUsers(): UserAccount[] {
    if (typeof window === 'undefined') return SAY_CLINIC_USERS;
    const cached = StaffService.getCachedUsers();
    return (cached && cached.length > 0) ? cached : SAY_CLINIC_USERS;
  },

  // Uloží alebo aktualizuje profil používateľa do centrálneho Firestore
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
      window.dispatchEvent(new CustomEvent('say_clinic_users_changed', { detail: updated }));
      RealtimeSyncService.publish('users_updated', updated);
      StaffService.saveUser(user).catch(err => {
        console.error('Chyba pri ukladaní používateľa do Firestore:', err);
      });
    }
    return updated;
  },

  // Odstráni používateľa (CEO u1 nie je možné vymazať)
  deleteUser(id: string): UserAccount[] {
    if (id === 'u1') return this.getUsers();
    const current = this.getUsers();
    const updated = current.filter(u => u.id !== id);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('say_clinic_users_changed', { detail: updated }));
      RealtimeSyncService.publish('users_updated', updated);
      StaffService.deleteUser(id).catch(err => {
        console.error('Chyba pri mazaní používateľa z Firestore:', err);
      });
    }
    return updated;
  },

  // Obnoví používateľov na predvolené továrenské nastavenia v cloudovom Firestore
  resetToDefaults(): UserAccount[] {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('say_clinic_users_changed', { detail: SAY_CLINIC_USERS }));
      StaffService.resetUsersToDefaults().catch(err => {
        console.error('Chyba pri resetovaní používateľov:', err);
      });
    }
    return SAY_CLINIC_USERS;
  }
};
