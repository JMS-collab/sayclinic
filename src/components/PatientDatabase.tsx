'use client';

import React, { useState, useRef } from 'react';

export interface Patient {
  id: string;
  name: string;
  birthNumber: string;
  phone: string;
  email: string;
  address: string;
  dob: string;
  insurance: string;
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

export default function PatientDatabase() {
  const [patients] = useState<Patient[]>(MOCK_PATIENTS);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeFolder, setActiveFolder] = useState<'dokumenty' | 'fotodokumentacia' | 'predoperacne'>('dokumenty');
  const [searchTerm, setSearchTerm] = useState('');

  // Fotodokumentácia State
  const [activePhotoCategory, setActivePhotoCategory] = useState<string | null>(null);
  const [patientPhotos, setPatientPhotos] = useState<Record<string, UploadedPhoto[]>>({
    'P1_Predoperačné': [
      { name: 'pred_zpredu.jpg', url: 'https://images.unsplash.com/photo-1512496015851-a90890f5c246?auto=format&fit=crop&w=300&q=80' },
      { name: 'pred_zboku.jpg', url: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=300&q=80' }
    ]
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.birthNumber.includes(searchTerm)
  );

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setActiveFolder('dokumenty');
    setActivePhotoCategory(null);
  };

  // Spracovanie HROMADNÉHO nahrávania fotiek
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !selectedPatient || !activePhotoCategory) return;
    
    // Vytvoríme URL náhľady pre všetky naraz označené fotky
    const newFiles: UploadedPhoto[] = Array.from(e.target.files).map(f => ({
      name: f.name,
      url: URL.createObjectURL(f)
    }));

    const key = `${selectedPatient.id}_${activePhotoCategory}`;
    
    setPatientPhotos(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), ...newFiles]
    }));

    // Reset inputu
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm min-h-[600px]">
      
      {/* POHĽAD 1: ZOZNAM PACIENTOV */}
      {!selectedPatient ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-4">
            <div>
              <h2 className="font-brand text-2xl font-bold text-[#2C2A29] uppercase">Kartotéka Pacientov</h2>
              <p className="text-[10px] uppercase tracking-widest text-[#8C857B]">Zoznam klientov a ich zdravotná história</p>
            </div>
            <button className="bg-[#2C2A29] hover:bg-[#C5A059] text-white px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold transition-colors shadow-sm">
              + Nový pacient
            </button>
          </div>

          <input
            type="text"
            placeholder="Vyhľadať pacienta podľa mena alebo rodného čísla..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-[#E8E2D9] p-3 rounded-xl bg-[#FBF9F6] text-xs focus:ring-2 focus:ring-[#C5A059] outline-none"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPatients.map(patient => (
              <div 
                key={patient.id} 
                onClick={() => handlePatientSelect(patient)}
                className="border border-[#E8E2D9] p-4 rounded-xl hover:border-[#C5A059] hover:shadow-md transition-all cursor-pointer bg-white group"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-[#2C2A29] group-hover:text-[#C5A059] transition-colors">{patient.name}</h3>
                  <span className="text-[9px] bg-[#FBF9F6] px-2 py-1 rounded text-[#8C857B] font-bold border border-[#E8E2D9]">{patient.insurance}</span>
                </div>
                <p className="text-xs text-[#8C857B]">RČ: {patient.birthNumber}</p>
                <p className="text-xs text-[#8C857B]">Tel: {patient.phone}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        
        /* POHĽAD 2: KARTA KONKRÉTNEHO PACIENTA */
        <div className="space-y-6">
          <button 
            onClick={() => setSelectedPatient(null)}
            className="text-[10px] uppercase font-bold text-[#8C857B] hover:text-[#2C2A29] flex items-center gap-1 transition-colors"
          >
            ← Späť na zoznam pacientov
          </button>

          {/* HLAVIČKA PACIENTA */}
          <div className="bg-[#FBF9F6] border border-[#E8E2D9] p-5 rounded-xl flex flex-col md:flex-row justify-between gap-4">
            <div>
              <h2 className="font-brand text-2xl font-bold text-[#2C2A29] uppercase">{selectedPatient.name}</h2>
              <p className="text-[10px] uppercase tracking-widest text-[#C5A059] font-bold">Karta pacienta</p>
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

          {/* ZÁLOŽKY (TABS) */}
          <div className="flex gap-2 border-b border-[#E8E2D9]">
            <button
              onClick={() => { setActiveFolder('dokumenty'); setActivePhotoCategory(null); }}
              className={`px-4 py-2 text-xs uppercase font-bold tracking-wider rounded-t-lg transition-colors ${
                activeFolder === 'dokumenty' ? 'bg-[#2C2A29] text-white' : 'bg-[#FBF9F6] text-[#8C857B] hover:bg-[#E8E2D9]'
              }`}
            >
              📄 Dokumenty
            </button>
            <button
              onClick={() => setActiveFolder('fotodokumentacia')}
              className={`px-4 py-2 text-xs uppercase font-bold tracking-wider rounded-t-lg transition-colors ${
                activeFolder === 'fotodokumentacia' ? 'bg-[#2C2A29] text-white' : 'bg-[#FBF9F6] text-[#8C857B] hover:bg-[#E8E2D9]'
              }`}
            >
              📸 Fotodokumentácia
            </button>
            <button
              onClick={() => { setActiveFolder('predoperacne'); setActivePhotoCategory(null); }}
              className={`px-4 py-2 text-xs uppercase font-bold tracking-wider rounded-t-lg transition-colors ${
                activeFolder === 'predoperacne' ? 'bg-[#2C2A29] text-white' : 'bg-[#FBF9F6] text-[#8C857B] hover:bg-[#E8E2D9]'
              }`}
            >
              🩸 Výsledky & Vyšetrenia
            </button>
          </div>

          {/* OBSAH ZLOŽIEK */}
          <div className="min-h-[350px] border border-[#E8E2D9] rounded-b-xl rounded-tr-xl p-5 bg-white">
            
            {/* 1. DOKUMENTY */}
            {activeFolder === 'dokumenty' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-[10px] uppercase text-[#8C857B] font-bold">História zdravotných záznamov (zoradené od najnovšieho)</p>
                  <button className="text-[11px] bg-[#C5A059] text-white px-3 py-1.5 rounded uppercase font-bold shadow-sm hover:bg-[#b38d45]">
                    + Vytvoriť nový záznam
                  </button>
                </div>
                
                <div className="border border-[#E8E2D9] rounded-lg p-3 flex justify-between items-center hover:bg-[#FBF9F6] transition-colors cursor-pointer">
                  <div>
                    <span className="text-[9px] bg-[#2C2A29] text-white px-2 py-0.5 rounded uppercase mr-2 font-bold">Operačný protokol</span>
                    <span className="text-xs font-bold text-[#2C2A29]">Augmentácia prsníkov</span>
                    <p className="text-[10px] text-[#8C857B] mt-1">Lekár: MUDr. Ján Mráz | Diagnóza: Z41.1</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-[#8C857B] font-bold">12.08.2026</p>
                    <button className="text-[10px] text-[#C5A059] uppercase font-bold mt-1">Stiahnuť PDF</button>
                  </div>
                </div>

                <div className="border border-[#E8E2D9] rounded-lg p-3 flex justify-between items-center hover:bg-[#FBF9F6] transition-colors cursor-pointer">
                  <div>
                    <span className="text-[9px] bg-[#C5A059] text-white px-2 py-0.5 rounded uppercase mr-2 font-bold">Vstupné vyšetrenie</span>
                    <span className="text-xs font-bold text-[#2C2A29]">Konzultácia - Augmentácia</span>
                    <p className="text-[10px] text-[#8C857B] mt-1">Lekár: MUDr. Ján Mráz</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-[#8C857B] font-bold">25.07.2026</p>
                    <button className="text-[10px] text-[#C5A059] uppercase font-bold mt-1">Stiahnuť PDF</button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. FOTODOKUMENTÁCIA (NOVÁ ŠTRUKTÚRA ZLOŽIEK) */}
            {activeFolder === 'fotodokumentacia' && (
              <div>
                {!activePhotoCategory ? (
                  // Zoznam 6 podzložiek pre fotografie
                  <>
                    <p className="text-[10px] uppercase text-[#8C857B] font-bold mb-4">Fotografické zložky pacienta</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {PHOTO_CATEGORIES.map(cat => {
                        const key = `${selectedPatient.id}_${cat}`;
                        const count = patientPhotos[key]?.length || 0;
                        return (
                          <div 
                            key={cat}
                            onClick={() => setActivePhotoCategory(cat)}
                            className="border border-[#E8E2D9] rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#C5A059] hover:bg-[#FBF9F6] transition-all group"
                          >
                            <span className="text-3xl mb-2 grayscale opacity-80 group-hover:grayscale-0 transition-all">📁</span>
                            <span className="text-xs font-bold text-[#2C2A29] uppercase">{cat}</span>
                            <span className="text-[10px] text-[#8C857B] mt-1">{count} fotografií</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  // Pohľad dovnútra konkrétnej zložky (napr. "Predoperačné")
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-3">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActivePhotoCategory(null)}
                          className="text-[18px] text-[#8C857B] hover:text-[#2C2A29] transition-colors"
                        >
                          ←
                        </button>
                        <h3 className="text-sm font-bold text-[#2C2A29] uppercase">📁 {activePhotoCategory}</h3>
                      </div>
                      
                      {/* NATIVE MULTIPLE FILE UPLOAD */}
                      <label className="cursor-pointer bg-[#2C2A29] hover:bg-[#C5A059] text-white px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-bold transition-colors flex items-center gap-1 shadow-sm">
                        <span>+ Hromadné nahratie fotiek</span>
                        {/* Atribút 'multiple' zabezpečuje, že môžeš označiť v PC hoci aj celú zložku (CTRL+A) */}
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*" 
                          className="hidden" 
                          ref={fileInputRef}
                          onChange={handlePhotoUpload} 
                        />
                      </label>
                    </div>

                    {/* Zobrazenie fotiek v zložke */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {patientPhotos[`${selectedPatient.id}_${activePhotoCategory}`]?.map((photo, idx) => (
                        <div key={idx} className="relative group rounded-lg overflow-hidden border border-[#E8E2D9] aspect-square bg-[#FBF9F6]">
                          <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                            <span className="text-[9px] text-white truncate w-full">{photo.name}</span>
                          </div>
                        </div>
                      ))}
                      
                      {(!patientPhotos[`${selectedPatient.id}_${activePhotoCategory}`] || patientPhotos[`${selectedPatient.id}_${activePhotoCategory}`].length === 0) && (
                         <div className="col-span-full py-8 text-center border-2 border-dashed border-[#E8E2D9] rounded-xl bg-[#FBF9F6]">
                            <p className="text-[#8C857B] text-xs">Zložka je zatiaľ prázdna.</p>
                            <p className="text-[10px] text-[#8C857B] mt-1">Klikni na tlačidlo vpravo hore a označ viacero fotiek naraz (Ctrl+A).</p>
                         </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. PREDOPERAČNÉ VYŠETRENIA */}
            {activeFolder === 'predoperacne' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-[10px] uppercase text-[#8C857B] font-bold">Výsledky laboratórií a vyšetrení</p>
                  <button className="bg-[#FBF9F6] border border-[#E8E2D9] text-[#2C2A29] px-3 py-1.5 rounded text-[10px] uppercase font-bold hover:border-[#C5A059]">
                    + Pridať PDF / Súbor
                  </button>
                </div>
                
                <div className="border border-[#E8E2D9] rounded-lg p-3 flex justify-between items-center hover:bg-[#FBF9F6] transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="bg-rose-100 text-rose-600 p-2 rounded text-xs font-bold">PDF</div>
                    <div>
                      <p className="text-xs font-bold text-[#2C2A29]">Predoperačné interné vyšetrenie</p>
                      <p className="text-[9px] text-[#8C857B] uppercase mt-0.5">Nahraté: 10.08.2026 | Dr. Novotný</p>
                    </div>
                  </div>
                  <button className="text-[10px] text-[#C5A059] uppercase font-bold">Stiahnuť</button>
                </div>

                <div className="border border-[#E8E2D9] rounded-lg p-3 flex justify-between items-center hover:bg-[#FBF9F6] transition-colors cursor-pointer mt-2">
                  <div className="flex items-center gap-3">
                    <div className="bg-rose-100 text-rose-600 p-2 rounded text-xs font-bold">PDF</div>
                    <div>
                      <p className="text-xs font-bold text-[#2C2A29]">Výsledky krvi (Krvný obraz, Koagulácia)</p>
                      <p className="text-[9px] text-[#8C857B] uppercase mt-0.5">Nahraté: 09.08.2026 | Synlab</p>
                    </div>
                  </div>
                  <button className="text-[10px] text-[#C5A059] uppercase font-bold">Stiahnuť</button>
                </div>
              </div>
            )}
            
          </div>
        </div>
      )}
    </div>
  );
}
