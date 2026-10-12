import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  getDocFromServer,
  onSnapshot,
  orderBy 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { RealtimeSyncService } from './realtimeSyncService';
import { AuditLogService } from './auditLogService';

export interface CloudMedicalRecord {
  id: string;
  patientId: string;
  patientName: string;
  patientBirthNumber?: string;
  type: string;
  typeColor: string;
  title: string;
  doctor: string;
  diagnosis: string;
  date: string;
  content: string;
  driveFileId?: string;
  driveWebViewLink?: string;
  createdAt: string;
  updatedAt?: string;
}

export class CloudRecordService {
  private static cachedRecordsByPatient: Record<string, CloudMedicalRecord[]> = {};

  /**
   * Overenie spojenia s Firebase Firestore
   */
  public static async testConnection(): Promise<boolean> {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
      return true;
    } catch (error: any) {
      if (error?.message?.includes('the client is offline')) {
        console.warn('Firestore klient je offline alebo sa pripravuje.');
      }
      return false;
    }
  }

  /**
   * Bezpečné uloženie lekárskeho záznamu (Vstupné vyšetrenie, dekurz, protokol)
   * Uloží sa priamo do Firestore databázy a ak je dostupný Google Drive, aj do zložky pacienta na Disku.
   */
  public static async saveRecordToCloud(
    patient: { id?: string; name: string; birthNumber?: string },
    recordData: {
      id?: string;
      type: string;
      typeColor?: string;
      title: string;
      doctor: string;
      diagnosis: string;
      date?: string;
      content: string;
    },
    pdfBase64?: string,
    authToken?: string
  ): Promise<{ success: boolean; record: CloudMedicalRecord; driveFile?: any; error?: string }> {
    try {
      const recordId = recordData.id || `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const targetPatientId = patient.id || (patient.birthNumber ? `p-${patient.birthNumber.replace(/[^a-zA-Z0-9]/g, '')}` : `p-${Date.now()}`);
      const nowIso = new Date().toISOString();
      const dateStr = recordData.date || nowIso.split('T')[0];

      let driveFileId = '';
      let driveWebViewLink = '';

      // 1. Uloženie na Google Drive (ak je k dispozícii token alebo prihlásenie a pdfBase64 / text)
      if (patient.name) {
        try {
          const fileName = `${dateStr}_${recordData.type.replace(/\s+/g, '_')}_${patient.name.replace(/\s+/g, '_')}.pdf`;
          const uploadHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
          if (authToken) {
            uploadHeaders['Authorization'] = `Bearer ${authToken}`;
          }

          const uploadRes = await fetch('/api/drive/upload', {
            method: 'POST',
            headers: uploadHeaders,
            body: JSON.stringify({
              patientName: patient.name,
              fileName,
              contentBase64: pdfBase64 || '',
              contentText: recordData.content,
              mimeType: pdfBase64 ? 'application/pdf' : 'text/plain',
              subfolderName: 'Dokumentácia'
            })
          });

          if (uploadRes.ok) {
            const uploadJson = await uploadRes.json();
            if (uploadJson.success && uploadJson.file) {
              driveFileId = uploadJson.file.id || '';
              driveWebViewLink = uploadJson.file.webViewLink || '';
            }
          }
        } catch (driveErr) {
          console.warn('Google Drive automatický upload sa nepodaril (pokračujem v uložení do Firestore):', driveErr);
        }
      }

      // 2. Bezpečný zápis do Cloud Firestore databázy
      const cloudRecord: CloudMedicalRecord = {
        id: recordId,
        patientId: targetPatientId,
        patientName: patient.name,
        patientBirthNumber: patient.birthNumber || '',
        type: recordData.type,
        typeColor: recordData.typeColor || (recordData.type.includes('Vstupné') ? 'bg-[#C5A059]' : 'bg-[#2C2A29]'),
        title: recordData.title,
        doctor: recordData.doctor,
        diagnosis: recordData.diagnosis,
        date: dateStr,
        content: recordData.content,
        driveFileId,
        driveWebViewLink,
        createdAt: nowIso,
        updatedAt: nowIso
      };

      const docRef = doc(db, 'medical_records', recordId);
      await setDoc(docRef, cloudRecord, { merge: true });

      // Aktualizácia lokálnej vyrovnávacej pamäte
      const currentList = this.cachedRecordsByPatient[targetPatientId] || [];
      const updatedList = [cloudRecord, ...currentList.filter(r => r.id !== recordId)];
      this.cachedRecordsByPatient[targetPatientId] = updatedList;

      // 3. GDPR Audit Log
      try {
        AuditLogService.logAction({
          userId: 'u1',
          userName: recordData.doctor,
          userRole: 'doctor',
          action: 'CREATE_MEDICAL_RECORD',
          category: 'clinical',
          patientId: targetPatientId,
          patientName: patient.name,
          details: `Vytvorené ${recordData.type}: "${recordData.title}" (Diagnóza: ${recordData.diagnosis}). Bezpečne uložené v Cloude${driveFileId ? ' a na Google Drive' : ''}.`
        });
      } catch (logErr) {
        // ignore
      }

      // 4. Real-time notifikácia staniciam kliniky
      try {
        RealtimeSyncService.publish('patient_records', { [targetPatientId]: updatedList });
      } catch {
        // ignore
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('say_clinic_record_saved', { detail: cloudRecord }));
      }

      return {
        success: true,
        record: cloudRecord,
        driveFile: driveFileId ? { id: driveFileId, webViewLink: driveWebViewLink } : null
      };
    } catch (error: any) {
      console.error('Chyba pri ukladaní do Cloud Firestore:', error);
      return {
        success: false,
        record: null as any,
        error: error.message || 'Nepodarilo sa uložiť do Cloud databázy.'
      };
    }
  }

  /**
   * Načítanie všetkých záznamov pacienta z Cloud Firestore
   */
  public static async getPatientRecordsFromCloud(patientId: string, patientBirthNumber?: string): Promise<CloudMedicalRecord[]> {
    if (!patientId && !patientBirthNumber) return [];

    try {
      const records: CloudMedicalRecord[] = [];
      const seenIds = new Set<string>();

      if (patientId) {
        const q = query(
          collection(db, 'medical_records'),
          where('patientId', '==', patientId)
        );
        const snapshot = await getDocs(q);
        snapshot.forEach((d) => {
          const item = d.data() as CloudMedicalRecord;
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            records.push(item);
          }
        });
      }

      if (patientBirthNumber) {
        const cleanBn = patientBirthNumber.trim();
        const qBn = query(
          collection(db, 'medical_records'),
          where('patientBirthNumber', '==', cleanBn)
        );
        const snapBn = await getDocs(qBn);
        snapBn.forEach((d) => {
          const item = d.data() as CloudMedicalRecord;
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            records.push(item);
          }
        });
      }

      // Zoradenie od najnovšieho
      records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      if (patientId) {
        this.cachedRecordsByPatient[patientId] = records;
      }
      return records;
    } catch (error: any) {
      console.warn('Upozornenie pri načítaní záznamov z Cloudu:', error);
      return (patientId && this.cachedRecordsByPatient[patientId]) || [];
    }
  }

  /**
   * Odstránenie záznamu z Cloud Firestore
   */
  public static async deleteRecordFromCloud(recordId: string, patientId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, 'medical_records', recordId));
      if (this.cachedRecordsByPatient[patientId]) {
        this.cachedRecordsByPatient[patientId] = this.cachedRecordsByPatient[patientId].filter(r => r.id !== recordId);
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('say_clinic_record_deleted', { detail: { recordId, patientId } }));
      }
      return true;
    } catch (error) {
      console.error('Chyba pri mazaní záznamu z Cloudu:', error);
      return false;
    }
  }

  /**
   * Úprava existujúceho záznamu v Cloud Firestore
   */
  public static async updateRecordInCloud(record: CloudMedicalRecord): Promise<boolean> {
    try {
      record.updatedAt = new Date().toISOString();
      await setDoc(doc(db, 'medical_records', record.id), record, { merge: true });
      if (this.cachedRecordsByPatient[record.patientId]) {
        this.cachedRecordsByPatient[record.patientId] = this.cachedRecordsByPatient[record.patientId].map(
          r => r.id === record.id ? record : r
        );
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('say_clinic_record_saved', { detail: record }));
      }
      return true;
    } catch (error) {
      console.error('Chyba pri aktualizácii záznamu v Cloude:', error);
      return false;
    }
  }

  /**
   * Odber zmien záznamov pacienta v reálnom čase (Real-time listener)
   */
  public static subscribePatientRecords(
    patientId: string, 
    callback: (records: CloudMedicalRecord[]) => void
  ): () => void {
    if (!patientId) return () => {};

    try {
      const q = query(
        collection(db, 'medical_records'),
        where('patientId', '==', patientId)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const records: CloudMedicalRecord[] = [];
        snapshot.forEach((d) => {
          records.push(d.data() as CloudMedicalRecord);
        });
        records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        this.cachedRecordsByPatient[patientId] = records;
        callback(records);
      }, (err) => {
        console.warn('Realtime listener varovanie:', err);
      });

      return unsubscribe;
    } catch {
      return () => {};
    }
  }

  /**
   * Počiatočná synchronizácia vzorových alebo starých záznamov do Cloudu
   */
  public static async seedInitialRecordsToCloud(initialMap: Record<string, any[]>): Promise<void> {
    try {
      const testSnap = await getDocs(query(collection(db, 'medical_records')));
      if (!testSnap.empty) {
        return; // Záznamy už v cloude existujú
      }

      for (const [patientId, recList] of Object.entries(initialMap)) {
        for (const rec of recList) {
          const docId = rec.id || `rec-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
          await setDoc(doc(db, 'medical_records', docId), {
            ...rec,
            id: docId,
            patientId,
            createdAt: new Date().toISOString()
          }, { merge: true });
        }
      }
    } catch (err) {
      console.warn('Seeding do Cloudu:', err);
    }
  }

  /**
   * Jednorazová migrácia starých dát z localStorage do Cloud Firestore a vyčistenie
   */
  public static async migrateLocalStorageToCloud(patientsList: any[] = []): Promise<number> {
    if (typeof window === 'undefined') return 0;
    try {
      const raw = localStorage.getItem('say_clinic_patient_records');
      if (!raw) return 0;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return 0;

      let migratedCount = 0;
      for (const [pId, recList] of Object.entries(parsed)) {
        if (!Array.isArray(recList)) continue;
        const matchingPatient = patientsList.find(p => p.id === pId);
        for (const rec of recList) {
          const recId = rec.id || `migrated-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
          const docRef = doc(db, 'medical_records', recId);
          await setDoc(docRef, {
            ...rec,
            id: recId,
            patientId: pId,
            patientName: rec.patientName || matchingPatient?.name || 'Pacient',
            patientBirthNumber: rec.patientBirthNumber || matchingPatient?.birthNumber || '',
            createdAt: rec.date || new Date().toISOString(),
            migratedFromLocalStorage: true
          }, { merge: true });
          migratedCount++;
        }
      }

      // Po úspešnej migrácii vyčistíme záznamy z localStorage
      localStorage.removeItem('say_clinic_patient_records');
      console.log(`☁️ Úspešne zmigrovaných ${migratedCount} záznamov z localStorage do Cloud Firestore.`);
      return migratedCount;
    } catch (e) {
      console.warn('Chyba migrácie z localStorage:', e);
      return 0;
    }
  }
}

