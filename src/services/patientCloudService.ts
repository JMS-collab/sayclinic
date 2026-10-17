import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot,
  getDocFromServer
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { RealtimeSyncService } from './realtimeSyncService';
import { DriveClientService } from './driveClientService';

export interface Patient {
  id: string;
  name: string;
  birthNumber: string;
  phone: string;
  email: string;
  address: string;
  dob: string;
  insurance: string;
  driveFolderLink?: string;
  allergies?: string[];
  notes?: string;
  updatedAt?: string;
}

const STORAGE_KEY = 'say_clinic_patients';

export class PatientCloudService {
  /**
   * Overenie pripojenia k Firestore pre pacientov
   */
  public static async testConnection(): Promise<boolean> {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Načítanie pacientov z lokálnej cache (okamžité predvyplnenie bez čakania na sieť)
   */
  public static getCachedPatients(): Patient[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Chyba pri čítaní pacientov z lokálnej pamäte:', e);
    }
    return [];
  }

  /**
   * Real-time odpočúvanie zmien pacientov z Firestore cloudu
   */
  public static subscribePatients(
    onUpdate: (patients: Patient[]) => void,
    onError?: (err: any) => void
  ): () => void {
    try {
      const colRef = collection(db, 'patients');
      const unsubscribe = onSnapshot(
        colRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Patient[] = [];
            snapshot.forEach((d) => {
              const data = d.data() as any;
              list.push({
                id: d.id,
                name: data.name || '',
                birthNumber: data.birthNumber || '',
                phone: data.phone || '',
                email: data.email || '',
                address: data.address || '',
                dob: data.dob || '',
                insurance: data.insurance || 'Samoplatca',
                driveFolderLink: data.driveFolderLink || undefined,
                allergies: data.allergies || [],
                notes: data.notes || '',
                updatedAt: data.updatedAt || undefined,
              });
            });

            // Zoradenie: najnovšie aktualizovaní alebo stabilne podľa mena
            list.sort((a, b) => {
              if (a.updatedAt && b.updatedAt) {
                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
              }
              return a.name.localeCompare(b.name, 'sk');
            });

            // Uložíme do lokálnej pamäte pre offline prístup
            if (typeof window !== 'undefined') {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
            }
            onUpdate(list);
          } else {
            // Ak je Firestore zatiaľ prázdny, vrátime prázdne pole
            onUpdate([]);
          }
        },
        (error) => {
          console.warn('Firestore onSnapshot error pre pacientov (možno offline):', error);
          if (onError) onError(error);
          // Fallback na lokálnu pamäť
          const cached = this.getCachedPatients();
          if (cached.length > 0) onUpdate(cached);
        }
      );
      return unsubscribe;
    } catch (err) {
      console.error('Chyba pri inicializácii listenera pacientov:', err);
      const cached = this.getCachedPatients();
      if (cached.length > 0) onUpdate(cached);
      return () => {};
    }
  }

  /**
   * Uloženie pacienta do Firestore Cloudu aj synchronizácia na Google Drive
   */
  public static async savePatient(
    patient: Patient,
    authToken?: string
  ): Promise<{ success: boolean; patient: Patient; error?: string }> {
    try {
      const patientId = patient.id || `P-${Date.now()}`;
      const now = new Date().toISOString();
      const updatedPatient: Patient = {
        ...patient,
        id: patientId,
        updatedAt: now,
      };

      // 1. Uloženie do Firebase Firestore
      const docData: Record<string, any> = {
        name: updatedPatient.name || '',
        birthNumber: updatedPatient.birthNumber || '',
        phone: updatedPatient.phone || '',
        email: updatedPatient.email || '',
        address: updatedPatient.address || '',
        dob: updatedPatient.dob || '',
        insurance: updatedPatient.insurance || 'Samoplatca',
        updatedAt: now,
      };

      if (updatedPatient.driveFolderLink) {
        docData.driveFolderLink = updatedPatient.driveFolderLink;
      }
      if (Array.isArray(updatedPatient.allergies)) {
        docData.allergies = updatedPatient.allergies;
      }
      if (updatedPatient.notes) {
        docData.notes = updatedPatient.notes;
      }

      await setDoc(doc(db, 'patients', patientId), docData, { merge: true });

      // 2. Synchronizácia na Google Drive (ak je token k dispozícii)
      if (authToken) {
        try {
          // Najprv skúsime bleskový klientsky zápis priamo z prehliadača (bez timeoutov servera)
          let syncSuccess = false;
          let driveLink = updatedPatient.driveFolderLink;

          if (typeof window !== 'undefined') {
            const clientRes = await DriveClientService.syncPatientProfile(authToken, updatedPatient);
            if (clientRes.success && clientRes.driveFolderLink) {
              syncSuccess = true;
              driveLink = clientRes.driveFolderLink;
            }
          }

          // Ak klientsky zápis nebol úspešný, skúsime serverový proxy route s bezpečným timeoutom
          if (!syncSuccess) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000);
            try {
              const driveRes = await fetch('/api/drive/sync-patient', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify(updatedPatient),
                signal: controller.signal,
              });
              clearTimeout(timeoutId);
              if (driveRes.ok) {
                const driveData = await driveRes.json();
                if (driveData.driveFolderLink) {
                  driveLink = driveData.driveFolderLink;
                }
              }
            } catch {
              // tichý fallback
            }
          }

          if (driveLink && driveLink !== updatedPatient.driveFolderLink) {
            updatedPatient.driveFolderLink = driveLink;
            await setDoc(doc(db, 'patients', patientId), { driveFolderLink: driveLink }, { merge: true });
          }
        } catch (driveErr) {
          console.warn('Google Drive synchronizácia pacienta zlyhala (lokálne dáta sú v bezpečí vo Firestore):', driveErr);
        }
      }

      // 3. Aktualizácia lokálnej pamäte a vysielanie zmeny
      if (typeof window !== 'undefined') {
        const cached = this.getCachedPatients();
        const existingIdx = cached.findIndex(p => p.id === patientId);
        let updatedList: Patient[];
        if (existingIdx >= 0) {
          updatedList = cached.map(p => p.id === patientId ? updatedPatient : p);
        } else {
          updatedList = [updatedPatient, ...cached];
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
        RealtimeSyncService.publish('patients', updatedList);
      }

      return { success: true, patient: updatedPatient };
    } catch (error: any) {
      console.error('Chyba pri ukladaní pacienta do Cloudu:', error);
      return { success: false, patient, error: error?.message || 'Chyba pri ukladaní do Cloudu' };
    }
  }

  /**
   * Zmazanie pacienta z Cloudu
   */
  public static async deletePatient(patientId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, 'patients', patientId));
      if (typeof window !== 'undefined') {
        const cached = this.getCachedPatients();
        const updated = cached.filter(p => p.id !== patientId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        RealtimeSyncService.publish('patients', updated);
      }
      return true;
    } catch (err) {
      console.error('Chyba pri mazaní pacienta z Firestore:', err);
      return false;
    }
  }

  /**
   * Inicializácia predvolených dát vo Firestore (iba ak je Firestore úplne prázdny)
   */
  public static async seedIfEmpty(defaults: Patient[]): Promise<Patient[]> {
    try {
      const snapshot = await getDocs(collection(db, 'patients'));
      if (!snapshot.empty) {
        // Už existujú reálne dáta vo Firestore - vrátime ich
        const list: Patient[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as any;
          list.push({
            id: d.id,
            name: data.name || '',
            birthNumber: data.birthNumber || '',
            phone: data.phone || '',
            email: data.email || '',
            address: data.address || '',
            dob: data.dob || '',
            insurance: data.insurance || 'Samoplatca',
            driveFolderLink: data.driveFolderLink || undefined,
            allergies: data.allergies || [],
            notes: data.notes || '',
            updatedAt: data.updatedAt || undefined,
          });
        });
        return list;
      }

      // Firestore je prázdny - seedujeme počiatočných pacientov
      for (const p of defaults) {
        await this.savePatient(p);
      }
      return defaults;
    } catch (e) {
      console.warn('Nepodarilo sa skontrolovať seedovanie pacientov vo Firestore:', e);
      return defaults;
    }
  }
}
