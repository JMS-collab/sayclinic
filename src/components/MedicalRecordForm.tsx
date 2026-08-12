'use client';

import React, { useState } from 'react';

const OBJ_MACROS: Record<string, string> = {
  viecka: "VIEČKA:\n• Objem znížený, v neadekvátnej distribúcii\n• Koža v prebytku\n• Orbitálny tuk prolabuje na horných aj dolných mihalniciach\n• Laterálny kantálny uhol v norme\n• Midface s deficitom v tukových kompartmentoch",
  nos: "NOS:\n• Dorsum: vyššej projekcie, primeranej šírky\n• Špička: v hyperprojekcii, bulbózna\n• Septum: bez známok deviácie",
  prsniky: "PRSNÍKY:\n• BW:\n• SNN:\n• Ptóza: -\n• Symetria: Áno",
  brucho: "BRUCHO:\n• Koža: v prebytku, nízkej elasticity\n• Podkožie: PT brucho, boky\n• Brušná stena: diastáza okolie umbilika"
};

export default function MedicalRecordForm() {
  const [patientName, setPatientName] = useState('');
  const [birthNumber, setBirthNumber] = useState('');
  const [doctor, setDoctor] = useState('MUDr. Ján Mráz');
  const [diagnosis, setDiagnosis] = useState('Z41.1 - Estetická chirurgická úprava');
  const [notes, setNotes] = useState('');

  const insertMacro = (key: string) => {
    if (!key || !OBJ_MACROS[key]) return;
    setNotes((prev) => (prev ? prev + "\n\n" + OBJ_MACROS[key] : OBJ_MACROS[key]));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Ľavý Panel: Formulár */}
      <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-5">
        <div className="border-b border-[#E8E2D9] pb-4">
          <h2 className="font-brand text-xl font-light text-[#2C2A29] uppercase">
            Generátor Dokumentov SAY CLINIC
          </h2>
          <p className="text-[9px] uppercase tracking-widest text-[#8C857B]">
            Ambulantný nález & Dekurzus pre eZdravie
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] uppercase text-[#8C857B] mb-1">Ošetrujúci lekár</label>
            <select
              value={doctor}
              onChange={(e) => setDoctor(e.target.value)}
              className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]"
            >
              <option value="MUDr. Ján Mráz">MUDr. Ján Mráz</option>
              <option value="MUDr. Zuzana Sroková, MPH">MUDr. Zuzana Sroková, MPH</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase text-[#8C857B] mb-1">Meno Pacienta</label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="napr. Mária Kováčová"
              className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] uppercase text-[#8C857B] mb-1">Rodné číslo</label>
          <input
            type="text"
            value={birthNumber}
            onChange={(e) => setBirthNumber(e.target.value)}
            placeholder="885512/6789"
            className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]"
          />
        </div>

        {/* Makrá */}
        <div>
          <label className="block font-light text-[#8C857B] uppercase text-[10px] tracking-wider mb-1">
            Vložiť makro nálezu (Plastická chirurgia):
          </label>
          <select
            onChange={(e) => insertMacro(e.target.value)}
            className="w-full border border-[#E8E2D9] p-2 rounded-xl text-xs bg-white text-[#2C2A29]"
          >
            <option value="">-- Vyberte oblasť (makro) --</option>
            <option value="viecka">Viečka</option>
            <option value="nos">Nos</option>
            <option value="prsniky">Prsníky</option>
            <option value="brucho">Brucho</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] uppercase text-[#8C857B] mb-1">Objektívny nález / Dekurzus</label>
          <textarea
            rows={7}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anamnéza, lokalizácia, nález..."
            className="w-full border border-[#E8E2D9] p-3 rounded-xl text-xs bg-white text-[#2C2A29]"
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase text-[#8C857B] mb-1">Diagnóza MKCH-10</label>
          <input
            type="text"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]"
          />
        </div>
      </div>

      {/* Pravý Panel: Náhľad A4 Správy */}
      <div className="lg:col-span-6 bg-white p-8 rounded-2xl border border-[#E8E2D9] shadow-sm">
        <h3 className="text-[10px] font-light text-[#8C857B] uppercase tracking-widest mb-4">
          Náhľad tlačového dokumentu (A4)
        </h3>

        <div className="border border-[#E8E2D9] p-6 rounded-xl bg-white text-xs leading-relaxed min-h-[500px]">
          <div className="border-b border-[#E8E2D9] pb-4 mb-4 flex justify-between items-start">
            <div>
              <h2 className="font-brand text-lg font-light tracking-widest uppercase text-[#2C2A29]">
                SAY CLINIC
              </h2>
              <p className="text-[9px] uppercase tracking-[0.2em] text-[#C5A059] font-semibold">
                PLASTICKÁ CHIRURGIA & DERMATOLÓGIA
              </p>
            </div>
            <div className="text-right text-[10px] text-[#8C857B]">
              <p className="font-semibold text-[#2C2A29]">{doctor}</p>
              <p>Banská Bystrica</p>
            </div>
          </div>

          <div className="bg-[#FBF9F6] p-3 rounded-xl mb-4 border border-[#E8E2D9] text-xs">
            <p><strong>Pacient:</strong> {patientName || '---'}</p>
            <p><strong>Rodné číslo:</strong> {birthNumber || '---'}</p>
            <p><strong>Diagnóza:</strong> {diagnosis}</p>
          </div>

          <div className="space-y-3 mb-8">
            <p className="font-semibold text-[10px] uppercase text-[#8C857B]">Lekársky nález:</p>
            <div className="whitespace-pre-line text-xs text-[#2C2A29]">
              {notes || 'Tuto sa zobrazí vygenerovaný nález...'}
            </div>
          </div>

          <div className="mt-16 border-t border-[#E8E2D9] pt-4 flex justify-between items-end text-[10px] text-[#8C857B]">
            <p>www.sayclinic.sk</p>
            <p className="text-center">
              <span className="font-semibold text-[#2C2A29]">{doctor}</span><br />
              Pečiatka a podpis lekára
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
