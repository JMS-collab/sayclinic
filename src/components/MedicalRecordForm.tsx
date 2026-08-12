'use client';

import React, { useState } from 'react';
import { HealthProService, HealthProResponse } from '../services/healthpro';

const OBJ_MACROS: Record<string, string> = {
  viecka: "VIEČKA:\n• Objem znížený, v neadekvátnej distribúcii\n• Koža v prebytku\n• Orbitálny tuk prolabuje na horných aj dolných mihalniciach",
  nos: "NOS:\n• Dorsum: vyššej projekcie, primeranej šírky\n• Špička: v hyperprojekcii, bulbózna",
  prsniky: "PRSNÍKY:\n• BW:\n• SNN:\n• Ptóza: -\n• Symetria: Áno",
  brucho: "BRUCHO:\n• Koža: v prebytku, nízkej elasticity\n• Podkožie: PT brucho, boky"
};

interface FormProps {
  onRecordCreated?: (sale: {
    date: string;
    patientName: string;
    doctorName: string;
    serviceType: string;
    amount: number;
  }) => void;
}

export default function MedicalRecordForm({ onRecordCreated }: FormProps) {
  const [patientName, setPatientName] = useState('');
  const [birthNumber, setBirthNumber] = useState('');
  const [doctor, setDoctor] = useState('MUDr. Ján Mráz');
  const [serviceType, setServiceType] = useState('Vstupné vyšetrenie / Konzultácia');
  const [price, setPrice] = useState('50');
  const [diagnosis, setDiagnosis] = useState('Z41.1 - Estetická chirurgická úprava');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HealthProResponse | null>(null);

  const insertMacro = (key: string) => {
    if (!key || !OBJ_MACROS[key]) return;
    setNotes((prev) => (prev ? prev + "\n\n" + OBJ_MACROS[key] : OBJ_MACROS[key]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const response = await HealthProService.sendMedicalRecord({
      patientBirthNumber: birthNumber,
      diagnosisCode: diagnosis,
      notes: notes,
      doctorLicenseCode: 'LEK-123456',
    });

    setResult(response);
    setLoading(false);

    // Ak je ošetrenie úspešné, automaticky ho zapíšeme do tržieb vo Financiách
    if (response.success && onRecordCreated) {
      onRecordCreated({
        date: new Date().toISOString().split('T')[0],
        patientName: patientName || 'Neznámy pacient',
        doctorName: doctor,
        serviceType: serviceType,
        amount: parseFloat(price) || 0,
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Formulár */}
      <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-4">
        <div className="border-b border-[#E8E2D9] pb-3">
          <h2 className="font-brand text-xl font-light text-[#2C2A29] uppercase">
            Generátor Dokumentov SAY CLINIC
          </h2>
          <p className="text-[9px] uppercase tracking-widest text-[#8C857B]">
            Ambulantný nález, dekurzus & vyúčtovanie
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              <label className="block text-[10px] uppercase text-[#8C857B] mb-1">Meno a priezvisko</label>
              <input
                type="text"
                required
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="napr. Mária Kováčová"
                className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase text-[#8C857B] mb-1">Rodné číslo</label>
              <input
                type="text"
                required
                value={birthNumber}
                onChange={(e) => setBirthNumber(e.target.value)}
                placeholder="885512/6789"
                className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-[#8C857B] mb-1">Diagnóza (MKCH-10)</label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]"
              />
            </div>
          </div>

          {/* Názov úkonu & Suma */}
          <div className="grid grid-cols-3 gap-3 bg-[#FBF9F6] p-3 rounded-xl border border-[#E8E2D9]">
            <div className="col-span-2">
              <label className="block text-[10px] uppercase text-[#8C857B] mb-1">Vyúčtovaný úkon / Zákrok</label>
              <input
                type="text"
                required
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                placeholder="Augmentácia / Botox / Konzultácia"
                className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-[#8C857B] mb-1">Cena (€)</label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border border-[#E8E2D9] p-2 rounded-lg text-xs bg-white text-[#2C2A29] font-bold"
              />
            </div>
          </div>

          {/* Makrá */}
          <div>
            <label className="block font-light text-[#8C857B] uppercase text-[10px] tracking-wider mb-1">
              Vložiť makro (Plastická chirurgia):
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
            <label className="block text-[10px] uppercase text-[#8C857B] mb-1">Lekársky nález / Anamnéza</label>
            <textarea
              rows={5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anamnéza, lokalizácia, nález..."
              className="w-full border border-[#E8E2D9] p-3 rounded-xl text-xs bg-white text-[#2C2A29]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2C2A29] hover:bg-[#C5A059] text-white font-medium py-3 px-6 rounded-xl transition-colors text-xs uppercase tracking-wider disabled:opacity-50"
          >
            {loading ? 'Spracovávam v eZdraví...' : 'Odoslať do HealthPro & Zaevidovať Tržbu'}
          </button>
        </form>

        {result && (
          <div className={`p-3 rounded-xl text-xs border ${result.success ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
            <p className="font-semibold">{result.message}</p>
            {result.transactionId && <p className="text-[10px] mt-1 font-mono">ID Transakcie: {result.transactionId}</p>}
          </div>
        )}
      </div>

      {/* Náhľad A4 Správy */}
      <div className="lg:col-span-6 bg-white p-8 rounded-2xl border border-[#E8E2D9] shadow-sm">
        <h3 className="text-[10px] font-light text-[#8C857B] uppercase tracking-widest mb-4">
          Náhľad tlačového dokumentu (A4)
        </h3>

        <div className="border border-[#E8E2D9] p-6 rounded-xl bg-white text-xs leading-relaxed min-h-[480px]">
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
            <p><strong>Úkon:</strong> {serviceType} ({price} €)</p>
            <p><strong>Diagnóza:</strong> {diagnosis}</p>
          </div>

          <div className="space-y-2 mb-8">
            <p className="font-semibold text-[10px] uppercase text-[#8C857B]">Lekársky nález:</p>
            <div className="whitespace-pre-line text-xs text-[#2C2A29]">
              {notes || 'Tuto sa zobrazí vygenerovaný nález...'}
            </div>
          </div>

          <div className="mt-12 border-t border-[#E8E2D9] pt-4 flex justify-between items-end text-[10px] text-[#8C857B]">
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
