'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import PatientDriveFiles from './PatientDriveFiles';

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
}

export interface MedicalRecord {
  id: string;
  type: string;
  typeColor: string;
  title: string;
  doctor: string;
  diagnosis: string;
  date: string;
  content: string;
}

const MOCK_PATIENTS: Patient[] = [
  { id: 'P1', name: 'Mária Kováčová', birthNumber: '885512/6789', phone: '+421 905 123 456', email: 'maria.kovacova@email.sk', address: 'Slnečná 15, Banská Bystrica', dob: '12.05.1988', insurance: '24 (Dôvera)' },
  { id: 'P2', name: 'Ján Novák', birthNumber: '750314/1234', phone: '+421 948 987 654', email: 'novak.j@email.sk', address: 'Kvetná 8, Zvolen', dob: '14.03.1975', insurance: '25 (VšZP)' },
];

const PHOTO_CATEGORIES = ['Konzultácia', 'Predoperačné', 'Pooperačné', '1. mesiac', '6. mesiac', '1 rok'];

interface UploadedPhoto {
  name: string;
  url: string;
}

interface PatientDatabaseProps {
  onNavigateToGenerator?: (patient: Patient) => void;
  initialPatient?: Patient | null;
  onPatientsUpdated?: (patients: Patient[]) => void;
}

export default function PatientDatabase({ onNavigateToGenerator, initialPatient, onPatientsUpdated }: PatientDatabaseProps) {
  const { data: session } = useSession();
  const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(initialPatient || null);
  const [activeFolder, setActiveFolder] = useState<'dokumenty' | 'fotodokumentacia' | 'predoperacne' | 'drive'>('dokumenty');
  const [searchTerm, setSearchTerm] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Stav pre pridať pacienta
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [isCreatingDriveFolder, setIsCreatingDriveFolder] = useState(false);
  const [newPatientData, setNewPatientData] = useState<Omit<Patient, 'id'>>({
    name: '',
    birthNumber: '',
    phone: '',
    email: '',
    address: '',
    dob: '',
    insurance: '24 (Dôvera)',
  });

  // STAV PRE ÚPRAVU PACIENTA
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  const [patientRecords, setPatientRecords] = useState<Record<string, MedicalRecord[]>>({
    'P1': [
      { id: 'rec-1', type: 'Operačný protokol', typeColor: 'bg-[#2C2A29]', title: 'Augmentácia prsníkov', doctor: 'MUDr. Ján Mráz', diagnosis: 'Z41.1', date: '2026-08-12', content: 'Zákrok prebehol bez komplikácií v celkovej anestézii.\n\nBoli použité silikónové implantáty Motiva 320ml, vložené pod sval. Rany zašité vstrebateľným stehom.\n\nPacientka stabilizovaná, poučená o pooperačnom režime a nutnosti nosiť kompresné prádlo Lipoelastic PI ideal na 6 týždňov.' },
      { id: 'rec-2', type: 'Vstupné vyšetrenie', typeColor: 'bg-[#C5A059]', title: 'Konzultácia - Augmentácia', doctor: 'MUDr. Ján Mráz', diagnosis: 'Z41.1', date: '2026-07-25', content: 'Vstupné vyšetrenie k plánovanej augmentácii prsníkov.\nAnamnéza: negatívna, bez alergií.\n\nObjektívny nález: Prsníky asymetrické, mierna ptóza, koža elastická.\n\nNavrhnutý postup: Augmentácia silikónovými implantátmi, prístup z podprsníkovej ryhy. Pacientka súhlasí s navrhnutým postupom a bola oboznámená s rizikami.' }
    ]
  });

  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null);
  const [previewRecord, setPreviewRecord] = useState<MedicalRecord | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const [activePhotoCategory, setActivePhotoCategory] = useState<string | null>(null);
  const [patientPhotos, setPatientPhotos] = useState<Record<string, UploadedPhoto[]>>({
    'P1_Predoperačné': [
      { name: 'pred_zpredu.jpg', url: 'https://images.unsplash.com/photo-1512496015851-a90890f5c246?auto=format&fit=crop&w=300&q=80' },
      { name: 'pred_zboku.jpg', url: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=300&q=80' }
    ]
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialPatient) {
      setSelectedPatient(initialPatient);
    }
  }, [initialPatient]);

  // 1. Načítanie kešovaných pacientov z localStorage pri štarte
  useEffect(() => {
    const saved = localStorage.getItem('say_clinic_patients');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPatients(parsed);
          if (onPatientsUpdated) onPatientsUpdated(parsed);
        }
      } catch (e) {
        console.error('Chyba pri načítaní pacientov z localStorage:', e);
      }
    }
  }, []);

  // 2. AUTOMATICKÝ IMPORT NA POZADÍ pri prihlásení do Google účtu
  useEffect(() => {
    const userSession = session as any;
    if (userSession && userSession.accessToken) {
      setIsImporting(true);
      fetch('/api/drive/import', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.patients) {
            const importedList: Patient[] = data.patients.map((item: any, idx: number) => ({
              id: item.id || `P-drive-${idx}`,
              name: item.name,
              birthNumber: 'Importované z Drive',
              phone: '---',
              email: '---',
              address: '---',
              dob: '---',
              insurance: 'Drive Klient',
              driveFolderLink: item.driveFolderLink
            }));

            setPatients(prev => {
              const existingNames = new Set(prev.map(p => p.name.toLowerCase().trim()));
              const uniqueNew = importedList.filter(p => !existingNames.has(p.name.toLowerCase().trim()));
              const updatedAll = [...uniqueNew, ...prev];
              localStorage.setItem('say_clinic_patients', JSON.stringify(updatedAll));
              if (onPatientsUpdated) onPatientsUpdated(updatedAll);
              return updatedAll;
            });
          }
        })
        .catch(err => console.error('Automatický import z Google Drive zlyhal:', err))
        .finally(() => setIsImporting(false));
    }
  }, [session]);

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.birthNumber.includes(searchTerm) ||
    p.phone.includes(searchTerm)
  );

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setActiveFolder('dokumenty');
    setActivePhotoCategory(null);
  };

  // VYTVORENIE PACIENTA S AUTOMATICKÝM VYTVORENÍM ZLOŽKY NA GOOGLE DRIVE
  const handleAddPatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientData.name || !newPatientData.birthNumber) return;

    let driveLink = '';
    const userSession = session as any;

    if (userSession && userSession.accessToken) {
      setIsCreatingDriveFolder(true);
      try {
        const res = await fetch('/api/drive/create-patient', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patientName: newPatientData.name }),
        });
        const data = await res.json();
        if (data.success && data.webViewLink) {
          driveLink = data.webViewLink;
        }
      } catch (err) {
        console.error('Nepodarilo sa automaticky vytvoriť zložku na Google Drive:', err);
      } finally {
        setIsCreatingDriveFolder(false);
      }
    }

    const createdPatient: Patient = {
      ...newPatientData,
      id: `P-${Date.now()}`,
      driveFolderLink: driveLink
    };

    const updatedPatients = [createdPatient, ...patients];
    setPatients(updatedPatients);
    localStorage.setItem('say_clinic_patients', JSON.stringify(updatedPatients));
    if (onPatientsUpdated) onPatientsUpdated(updatedPatients);
    
    setIsAddingPatient(false);
    setNewPatientData({
      name: '',
      birthNumber: '',
      phone: '',
      email: '',
      address: '',
      dob: '',
      insurance: '24 (Dôvera)',
    });

    handlePatientSelect(createdPatient);
  };

  // ULOŽENIE ÚPRAVY PACIENTA
  const handleSavePatientEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;

    const updatedPatients = patients.map(p => p.id === editingPatient.id ? editingPatient : p);
    setPatients(updatedPatients);
    localStorage.setItem('say_clinic_patients', JSON.stringify(updatedPatients));
    if (onPatientsUpdated) onPatientsUpdated(updatedPatients);

    if (selectedPatient && selectedPatient.id === editingPatient.id) {
      setSelectedPatient(editingPatient);
    }

    setEditingPatient(null);
  };

  const handleRunDriveImport = async () => {
    if (!session) {
      alert('Pre import z Google Disku musíte byť prihlásený cez Google účet.');
      return;
    }

    setIsImporting(true);

    try {
      const res = await fetch('/api/drive/import', { method: 'POST' });
      const data = await res.json();

      if (res.ok && data.success && data.patients) {
        const importedList: Patient[] = data.patients.map((item: any, idx: number) => ({
          id: item.id || `P-drive-${idx}`,
          name: item.name,
          birthNumber: 'Importované z Drive',
          phone: '---',
          email: '---',
          address: '---',
          dob: '---',
          insurance: 'Drive Klient',
          driveFolderLink: item.driveFolderLink
        }));

        setPatients(prev => {
          const existingNames = new Set(prev.map(p => p.name.toLowerCase().trim()));
          const uniqueNew = importedList.filter(p => !existingNames.has(p.name.toLowerCase().trim()));
          const updatedAll = [...uniqueNew, ...prev];
          localStorage.setItem('say_clinic_patients', JSON.stringify(updatedAll));
          if (onPatientsUpdated) onPatientsUpdated(updatedAll);
          return updatedAll;
        });

        alert(`🎉 Úspešne sa načítalo a skontrolovalo ${data.totalImported} kariet klientov z Google Disku!`);
      } else {
        alert(`Chyba importu: ${data.error || 'Nepodarilo sa načítať zložku Klienti SAY'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Chyba pri komunikácii s Google Drive API.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleDeleteRecord = (recordId: string) => {
    if (!selectedPatient) return;
    if (confirm('Naozaj chcete natrvalo vymazať tento záznam?')) {
      setPatientRecords(prev => ({
        ...prev,
        [selectedPatient.id]: prev[selectedPatient.id].filter(r => r.id !== recordId)
      }));
    }
  };

  const handleSaveEdit = () => {
    if (!selectedPatient || !editingRecord) return;
    setPatientRecords(prev => ({
      ...prev,
      [selectedPatient.id]: prev[selectedPatient.id].map(r => r.id === editingRecord.id ? editingRecord : r)
    }));
    setEditingRecord(null);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !selectedPatient || !activePhotoCategory) return;
    const newFiles: UploadedPhoto[] = Array.from(e.target.files).map(f => ({
      name: f.name,
      url: URL.createObjectURL(f)
    }));
    const key = `${selectedPatient.id}_${activePhotoCategory}`;
    setPatientPhotos(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), ...newFiles]
    }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <style type="text/css" media="print">
        {`
          @page { size: A4; margin: 0; }
          body * { visibility: hidden !important; }
          #printable-a4, #printable-a4 * { visibility: visible !important; }
          #printable-a4 {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            margin: 0 !important;
            padding: 20mm !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
            z-index: 99999 !important;
          }
        `}
      </style>

      <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm min-h-[600px] relative print:border-none print:shadow-none print:p-0 print:static">
        
        {/* MODAL: PRIDANIE NOVÉHO PACIENTA */}
        {isAddingPatient && (
          <div className="fixed inset-0 bg-[#2C2A29]/60 flex items-center justify-center z-50 backdrop-blur-sm p-4 print:hidden">
            <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-xl border border-[#E8E2D9]">
              <div className="border-b border-[#E8E2D9] pb-3 mb-4 flex justify-between items-center">
                <div>
                  <h3 className="font-brand text-xl font-bold text-[#2C2A29] uppercase">Zaevidovať nového pacienta</h3>
                  <p className="text-[10px] text-[#8C857B] uppercase tracking-wider">
                    Vytvorenie karty & zložky v Klienti SAY na Google Disku
                  </p>
                </div>
                <button onClick={() => setIsAddingPatient(false)} className="text-xs text-[#8C857B] hover:text-[#2C2A29] font-bold">✕</button>
              </div>

              <form onSubmit={handleAddPatientSubmit} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Meno a priezvisko *</label>
                    <input type="text" required placeholder="napr. Mária Kováčová" value={newPatientData.name} onChange={e => setNewPatientData({...newPatientData, name: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Rodné číslo *</label>
                    <input type="text" required placeholder="885512/6789" value={newPatientData.birthNumber} onChange={e => setNewPatientData({...newPatientData, birthNumber: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Telefónne číslo</label>
                    <input type="text" placeholder="+421 905 123 456" value={newPatientData.phone} onChange={e => setNewPatientData({...newPatientData, phone: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Email</label>
                    <input type="email" placeholder="pacient@email.sk" value={newPatientData.email} onChange={e => setNewPatientData({...newPatientData, email: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Bydlisko</label>
                  <input type="text" placeholder="Ulica, Mesto, PSČ" value={newPatientData.address} onChange={e => setNewPatientData({...newPatientData, address: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Dátum narodenia</label>
                    <input type="text" placeholder="12.05.1988" value={newPatientData.dob} onChange={e => setNewPatientData({...newPatientData, dob: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Poisťovňa</label>
                    <select value={newPatientData.insurance} onChange={e => setNewPatientData({...newPatientData, insurance: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]">
                      <option value="24 (Dôvera)">24 (Dôvera)</option>
                      <option value="25 (VšZP)">25 (VšZP)</option>
                      <option value="27 (Union)">27 (Union)</option>
                      <option value="Samoplatca">Samoplatca</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-[#E8E2D9] mt-4">
                  <button type="button" onClick={() => setIsAddingPatient(false)} className="px-4 py-2 text-xs font-bold text-[#8C857B] hover:text-[#2C2A29]">ZRUŠIŤ</button>
                  <button type="submit" disabled={isCreatingDriveFolder} className="px-5 py-2 bg-[#2C2A29] hover:bg-[#C5A059] text-white text-xs font-bold rounded-xl uppercase tracking-wider transition-colors shadow-sm flex items-center gap-2">
                    {isCreatingDriveFolder ? '⏳ Vytváram zložky v Google Drive...' : '+ Uložiť & Vytvoriť zložky v Drive'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ÚPRAVA PACIENTA */}
        {editingPatient && (
          <div className="fixed inset-0 bg-[#2C2A29]/60 flex items-center justify-center z-50 backdrop-blur-sm p-4 print:hidden">
            <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-xl border border-[#E8E2D9]">
              <div className="border-b border-[#E8E2D9] pb-3 mb-4 flex justify-between items-center">
                <div>
                  <h3 className="font-brand text-xl font-bold text-[#2C2A29] uppercase">Upraviť kartu pacienta</h3>
                  <p className="text-[10px] text-[#8C857B] uppercase tracking-wider">Úprava osobných údajov</p>
                </div>
                <button onClick={() => setEditingPatient(null)} className="text-xs text-[#8C857B] hover:text-[#2C2A29] font-bold">✕</button>
              </div>

              <form onSubmit={handleSavePatientEdit} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Meno a priezvisko *</label>
                    <input type="text" required value={editingPatient.name} onChange={e => setEditingPatient({...editingPatient, name: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Rodné číslo *</label>
                    <input type="text" required value={editingPatient.birthNumber} onChange={e => setEditingPatient({...editingPatient, birthNumber: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Telefónne číslo</label>
                    <input type="text" value={editingPatient.phone} onChange={e => setEditingPatient({...editingPatient, phone: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Email</label>
                    <input type="email" value={editingPatient.email} onChange={e => setEditingPatient({...editingPatient, email: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Bydlisko</label>
                  <input type="text" value={editingPatient.address} onChange={e => setEditingPatient({...editingPatient, address: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Dátum narodenia</label>
                    <input type="text" value={editingPatient.dob} onChange={e => setEditingPatient({...editingPatient, dob: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-[#8C857B] mb-1 font-bold">Poisťovňa</label>
                    <select value={editingPatient.insurance} onChange={e => setEditingPatient({...editingPatient, insurance: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg bg-[#FBF9F6]">
                      <option value="24 (Dôvera)">24 (Dôvera)</option>
                      <option value="25 (VšZP)">25 (VšZP)</option>
                      <option value="27 (Union)">27 (Union)</option>
                      <option value="Samoplatca">Samoplatca</option>
                      <option value="Drive Klient">Drive Klient</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-[#E8E2D9] mt-4">
                  <button type="button" onClick={() => setEditingPatient(null)} className="px-4 py-2 text-xs font-bold text-[#8C857B] hover:text-[#2C2A29]">ZRUŠIŤ</button>
                  <button type="submit" className="px-5 py-2 bg-[#C5A059] hover:bg-[#b08d4b] text-white text-xs font-bold rounded-xl uppercase tracking-wider transition-colors shadow-sm">ULOŽIŤ ZMENY</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ÚPRAVA ZÁZNAMU */}
        {editingRecord && (
          <div className="fixed inset-0 bg-[#2C2A29]/60 flex items-center justify-center z-50 backdrop-blur-sm p-4 print:hidden">
            <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-xl border border-[#E8E2D9]">
              <h3 className="font-brand text-xl font-bold text-[#2C2A29] mb-4 uppercase">Upraviť záznam</h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] uppercase text-[#8C857B] mb-1">Typ dokumentu</label>
                  <input type="text" value={editingRecord.type} onChange={e => setEditingRecord({...editingRecord, type: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-[#8C857B] mb-1">Názov zákroku</label>
                  <input type="text" value={editingRecord.title} onChange={e => setEditingRecord({...editingRecord, title: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-[#8C857B] mb-1">Dátum</label>
                  <input type="date" value={editingRecord.date} onChange={e => setEditingRecord({...editingRecord, date: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-[#8C857B] mb-1">Text záznamu</label>
                  <textarea rows={4} value={editingRecord.content} onChange={e => setEditingRecord({...editingRecord, content: e.target.value})} className="w-full border border-[#E8E2D9] p-2 rounded-lg" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => setEditingRecord(null)} className="px-4 py-2 text-xs font-bold text-[#8C857B] hover:text-[#2C2A29]">ZRUŠIŤ</button>
                <button onClick={handleSaveEdit} className="px-4 py-2 bg-[#C5A059] text-white text-xs font-bold rounded-lg uppercase">ULOŽIŤ ZMENY</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: NÁHĽAD A TLAČ */}
        {previewRecord && selectedPatient && (
          <div className="fixed inset-0 bg-[#2C2A29]/80 flex items-start justify-center z-50 p-6 backdrop-blur-sm overflow-y-auto print:absolute print:inset-0 print:bg-white print:p-0 print:block print:overflow-visible">
            <div className="bg-[#FBF9F6] p-6 rounded-2xl w-full max-w-3xl shadow-xl flex flex-col relative my-8 print:p-0 print:border-none print:shadow-none print:m-0 print:block print:static">
              
              <div className="flex justify-between items-center mb-4 print:hidden">
                <h3 className="font-brand text-lg font-bold text-[#2C2A29] uppercase">Náhľad historického dokumentu</h3>
                <div className="flex gap-2">
                  <button onClick={() => setPreviewRecord(null)} className="px-4 py-2 bg-white border border-[#E8E2D9] rounded-xl text-xs font-bold text-[#8C857B] hover:text-[#2C2A29] shadow-sm">
                    Zavrieť
                  </button>
                  <button onClick={handlePrint} className="bg-[#C5A059] hover:bg-[#b08d48] text-white text-xs font-bold uppercase px-4 py-2 rounded-xl transition-colors shadow-sm">
                    🖨️ Tlačiť dokument
                  </button>
                </div>
              </div>
              
              <div id="printable-a4" ref={printRef} className="bg-white border border-[#E8E2D9] p-10 shadow-sm text-xs leading-relaxed mx-auto w-full max-w-[595px] print:border-none print:shadow-none print:p-0 print:max-w-none print:w-full">
                <div className="border-b border-[#E8E2D9] pb-6 mb-6 flex justify-between items-start">
                  <div>
                    <h2 className="font-brand text-2xl font-light tracking-widest uppercase text-[#2C2A29]">SAY CLINIC</h2>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-[#C5A059] font-bold mt-1">PLASTICKÁ CHIRURGIA & DERMATOLÓGIA</p>
                    <p className="text-[10px] text-[#8C857B] mt-1">Lazovná 43, 974 01 Banská Bystrica</p>
                  </div>
                  <div className="text-right text-[10px] text-[#8C857B]">
                    <span className={`text-white px-2 py-1 rounded text-[8px] uppercase tracking-wider font-bold ${previewRecord.typeColor}`}>
                      {previewRecord.type}
                    </span>
                    <p className="font-bold text-[#2C2A29] mt-2 text-sm">{previewRecord.doctor}</p>
                    <p className="mt-1">Dátum: {new Date(previewRecord.date).toLocaleDateString('sk-SK')}</p>
                  </div>
                </div>

                <div className="bg-[#FBF9F6] p-4 rounded-xl mb-6 border border-[#E8E2D9] text-xs space-y-2">
                  <p><strong className="text-[#8C857B] uppercase text-[9px] tracking-wider">Pacient:</strong> <span className="text-sm font-bold ml-2">{selectedPatient.name}</span></p>
                  <p><strong className="text-[#8C857B] uppercase text-[9px] tracking-wider">Rodné číslo:</strong> <span className="ml-2 font-mono">{selectedPatient.birthNumber}</span></p>
                  <p><strong className="text-[#8C857B] uppercase text-[9px] tracking-wider">Diagnóza:</strong> <span className="ml-2">{previewRecord.diagnosis || '---'}</span></p>
                </div>

                <div className="space-y-3 mb-8">
                  <p className="font-bold text-[10px] uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-1">Názov výkonu / Zákroku:</p>
                  <p className="text-sm font-bold text-[#2C2A29]">{previewRecord.title}</p>
                </div>

                <div className="space-y-2 mb-8 flex-1">
                  <p className="font-bold text-[10px] uppercase text-[#C5A059] border-b border-[#E8E2D9] pb-1">Lekársky nález / Dekurzus:</p>
                  <div className="whitespace-pre-line text-sm text-[#2C2A29] leading-relaxed pt-2">
                    {previewRecord.content}
                  </div>
                </div>

                <div className="mt-16 pt-8 border-t border-[#E8E2D9] flex justify-between items-end text-[10px] text-[#8C857B]">
                  <div>
                    <p className="font-bold text-[#C5A059] mb-1">www.sayclinic.sk</p>
                    <p>Výpis z historickej databázy SAY CLINIC</p>
                  </div>
                  <div className="text-center">
                    <div className="w-40 border-b border-[#2C2A29] mb-2"></div>
                    <span className="font-bold text-[#2C2A29]">{previewRecord.doctor}</span><br />
                    Pečiatka a podpis lekára
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* POHĽAD 1: ZOZNAM PACIENTOV */}
        {!selectedPatient ? (
          <div className="space-y-6 print:hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#E8E2D9] pb-4">
              <div>
                <h2 className="font-brand text-2xl font-bold text-[#2C2A29] uppercase">Kartotéka Pacientov</h2>
                <p className="text-[10px] uppercase tracking-widest text-[#8C857B]">
                  Zoznam klientov a ich zdravotná história ({patients.length})
                  {isImporting && <span className="ml-2 text-[#C5A059] font-bold animate-pulse">🔄 Synchronizujem s Google Drive...</span>}
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <button 
                  onClick={handleRunDriveImport}
                  disabled={isImporting}
                  className="bg-[#C5A059] hover:bg-[#b08d4b] text-white px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold shadow-sm transition-colors flex items-center gap-2"
                >
                  <span>{isImporting ? '⏳' : '⚡'}</span>
                  <span>{isImporting ? 'Synchronizujem...' : 'Obnoviť z Google Drive'}</span>
                </button>

                <button 
                  onClick={() => setIsAddingPatient(true)}
                  className="bg-[#2C2A29] hover:bg-[#C5A059] text-white px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold shadow-sm transition-colors"
                >
                  + Nový pacient
                </button>
              </div>
            </div>

            <input 
              type="text" 
              placeholder="Vyhľadať pacienta po mene, RČ alebo telefóne..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full border border-[#E8E2D9] p-3 rounded-xl bg-[#FBF9F6] text-xs focus:ring-2 focus:ring-[#C5A059] outline-none" 
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPatients.map(patient => (
                <div 
                  key={patient.id} 
                  className="border border-[#E8E2D9] p-4 rounded-xl hover:border-[#C5A059] hover:shadow-md transition-all bg-white group flex flex-col justify-between"
                >
                  <div onClick={() => handlePatientSelect(patient)} className="cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-[#2C2A29] group-hover:text-[#C5A059] transition-colors">{patient.name}</h3>
                      <span className="text-[9px] bg-[#FBF9F6] px-2 py-1 rounded text-[#8C857B] font-bold border border-[#E8E2D9]">{patient.insurance}</span>
                    </div>
                    <p className="text-xs text-[#8C857B]">RČ: {patient.birthNumber}</p>
                    <p className="text-xs text-[#8C857B]">Tel: {patient.phone}</p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#E8E2D9] flex justify-between items-center text-[10px]">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPatient(patient);
                      }}
                      className="text-[#8C857B] hover:text-[#C5A059] font-bold uppercase tracking-wider transition-colors flex items-center gap-1"
                    >
                      ✏️ Upraviť kartu
                    </button>

                    <button 
                      onClick={() => handlePatientSelect(patient)}
                      className="text-[#2C2A29] font-bold uppercase tracking-wider group-hover:text-[#C5A059]"
                    >
                      Otvoriť →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          
          /* POHĽAD 2: KARTA PACIENTA */
          <div className="space-y-6 print:hidden">
            <button onClick={() => setSelectedPatient(null)} className="text-[10px] uppercase font-bold text-[#8C857B] hover:text-[#2C2A29] flex items-center gap-1 transition-colors">
              ← Späť na zoznam pacientov
            </button>

            <div className="bg-[#FBF9F6] border border-[#E8E2D9] p-5 rounded-xl flex flex-col md:flex-row justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="font-brand text-2xl font-bold text-[#2C2A29] uppercase">{selectedPatient.name}</h2>
                  <button 
                    onClick={() => setEditingPatient(selectedPatient)}
                    className="text-xs bg-white border border-[#E8E2D9] px-2.5 py-1 rounded-lg text-[#8C857B] hover:text-[#C5A059] font-bold shadow-sm transition-colors"
                  >
                    ✏️ Upraviť
                  </button>
                </div>
                <p className="text-[10px] uppercase tracking-widest text-[#C5A059] font-bold mt-1">Karta pacienta</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-2 text-xs">
                <div><span className="text-[#8C857B] block text-[9px] uppercase">Rodné číslo:</span><span className="font-semibold">{selectedPatient.birthNumber}</span></div>
                <div><span className="text-[#8C857B] block text-[9px] uppercase">Dátum nar.:</span><span className="font-semibold">{selectedPatient.dob}</span></div>
                <div><span className="text-[#8C857B] block text-[9px] uppercase">Poisťovňa:</span><span className="font-semibold">{selectedPatient.insurance}</span></div>
                <div><span className="text-[#8C857B] block text-[9px] uppercase">Telefón:</span><span className="font-semibold">{selectedPatient.phone}</span></div>
                <div><span className="text-[#8C857B] block text-[9px] uppercase">Email:</span><span className="font-semibold">{selectedPatient.email}</span></div>
                <div><span className="text-[#8C857B] block text-[9px] uppercase">Bydlisko:</span><span className="font-semibold">{selectedPatient.address}</span></div>
              </div>
            </div>

            {/* PREPOJENIE SO ZLOŽKOU "KLIENTI SAY" NA GOOGLE DRIVE */}
            <PatientDriveFiles patientName={selectedPatient.name} />

            <div className="flex gap-2 border-b border-[#E8E2D9]">
              <button onClick={() => { setActiveFolder('dokumenty'); setActivePhotoCategory(null); }} className={`px-4 py-2 text-xs uppercase font-bold tracking-wider rounded-t-lg transition-colors ${ activeFolder === 'dokumenty' ? 'bg-[#2C2A29] text-white' : 'bg-[#FBF9F6] text-[#8C857B] hover:bg-[#E8E2D9]' }`}>📄 Dokumenty</button>
              <button onClick={() => setActiveFolder('fotodokumentacia')} className={`px-4 py-2 text-xs uppercase font-bold tracking-wider rounded-t-lg transition-colors ${ activeFolder === 'fotodokumentacia' ? 'bg-[#2C2A29] text-white' : 'bg-[#FBF9F6] text-[#8C857B] hover:bg-[#E8E2D9]' }`}>📸 Fotodokumentácia</button>
              <button onClick={() => { setActiveFolder('predoperacne'); setActivePhotoCategory(null); }} className={`px-4 py-2 text-xs uppercase font-bold tracking-wider rounded-t-lg transition-colors ${ activeFolder === 'predoperacne' ? 'bg-[#2C2A29] text-white' : 'bg-[#FBF9F6] text-[#8C857B] hover:bg-[#E8E2D9]' }`}>🩸 Výsledky & Vyšetrenia</button>
            </div>

            <div className="min-h-[350px] border border-[#E8E2D9] rounded-b-xl rounded-tr-xl p-5 bg-white">
              
              {/* ZÁLOŽKA DOKUMENTY */}
              {activeFolder === 'dokumenty' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-[10px] uppercase text-[#8C857B] font-bold">História zdravotných záznamov</p>
                    <button onClick={() => onNavigateToGenerator && onNavigateToGenerator(selectedPatient)} className="text-[11px] bg-[#C5A059] text-white px-3 py-1.5 rounded uppercase font-bold shadow-sm hover:bg-[#b38d45]">
                      + Vytvoriť nový záznam
                    </button>
                  </div>
                  
                  {patientRecords[selectedPatient.id] && patientRecords[selectedPatient.id].length > 0 ? (
                    patientRecords[selectedPatient.id].map(record => (
                      <div key={record.id} className="border border-[#E8E2D9] rounded-lg p-3 flex justify-between items-center hover:bg-[#FBF9F6] transition-colors">
                        <div>
                          <span className={`text-[9px] text-white px-2 py-0.5 rounded uppercase mr-2 font-bold ${record.typeColor}`}>{record.type}</span>
                          <span className="text-xs font-bold text-[#2C2A29]">{record.title}</span>
                          <p className="text-[10px] text-[#8C857B] mt-1">Lekár: {record.doctor} {record.diagnosis && `| Diagnóza: ${record.diagnosis}`}</p>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <p className="text-xs font-mono text-[#8C857B] font-bold">{new Date(record.date).toLocaleDateString('sk-SK')}</p>
                          <div className="flex gap-2">
                            <button onClick={() => setEditingRecord(record)} className="text-[10px] text-[#8C857B] hover:text-[#C5A059] uppercase font-bold transition-colors">✏️ Upraviť</button>
                            <button onClick={() => handleDeleteRecord(record.id)} className="text-[10px] text-[#8C857B] hover:text-rose-600 uppercase font-bold transition-colors">🗑️ Zmazať</button>
                            <button onClick={() => setPreviewRecord(record)} className="text-[10px] text-[#C5A059] uppercase font-bold transition-colors border-l border-[#E8E2D9] pl-2 ml-1">
                              📄 Náhľad & PDF
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[#8C857B] text-center py-6">Tento pacient zatiaľ nemá žiadne lokálne záznamy.</p>
                  )}
                </div>
              )}

              {/* ZÁLOŽKA FOTOGRAFIE */}
              {activeFolder === 'fotodokumentacia' && (
                <div>
                  {!activePhotoCategory ? (
                    <>
                      <p className="text-[10px] uppercase text-[#8C857B] font-bold mb-4">Fotografické zložky pacienta</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {PHOTO_CATEGORIES.map(cat => {
                          const key = `${selectedPatient.id}_${cat}`;
                          const count = patientPhotos[key]?.length || 0;
                          return (
                            <div key={cat} onClick={() => setActivePhotoCategory(cat)} className="border border-[#E8E2D9] rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#C5A059] hover:bg-[#FBF9F6] transition-all group">
                              <span className="text-3xl mb-2 grayscale opacity-80 group-hover:grayscale-0 transition-all">📁</span>
                              <span className="text-xs font-bold text-[#2C2A29] uppercase">{cat}</span>
                              <span className="text-[10px] text-[#8C857B] mt-1">{count} fotografií</span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-3">
                        <div className="flex items-center gap-3">
                          <button onClick={() => setActivePhotoCategory(null)} className="text-[18px] text-[#8C857B] hover:text-[#2C2A29] transition-colors">←</button>
                          <h3 className="text-sm font-bold text-[#2C2A29] uppercase">📁 {activePhotoCategory}</h3>
                        </div>
                        <label className="cursor-pointer bg-[#2C2A29] hover:bg-[#C5A059] text-white px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-bold transition-colors flex items-center gap-1 shadow-sm">
                          <span>+ Hromadné nahratie fotiek</span>
                          <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />
                        </label>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {patientPhotos[`${selectedPatient.id}_${activePhotoCategory}`]?.map((photo, idx) => (
                          <div key={idx} className="relative group rounded-lg overflow-hidden border border-[#E8E2D9] aspect-square bg-[#FBF9F6]">
                            <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ZÁLOŽKA PREDOPERAČNÉ */}
              {activeFolder === 'predoperacne' && (
                <div>
                  <p className="text-[10px] uppercase text-[#8C857B] font-bold mb-4">Výsledky laboratórií a vyšetrení</p>
                  <div className="border border-[#E8E2D9] rounded-lg p-3 flex justify-between items-center hover:bg-[#FBF9F6] transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="bg-rose-100 text-rose-600 p-2 rounded text-xs font-bold">PDF</div>
                      <div><p className="text-xs font-bold text-[#2C2A29]">Predoperačné interné vyšetrenie</p></div>
                    </div>
                    <button className="text-[10px] text-[#C5A059] uppercase font-bold">Stiahnuť</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}