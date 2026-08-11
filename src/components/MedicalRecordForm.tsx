'use client';

import React, { useState } from 'react';
import { HealthProService, HealthProResponse } from '../services/healthpro';

// DÔLEŽITÉ: Musí tu byť "export default function", nie iba "export function"
export default function MedicalRecordForm() {
  const [birthNumber, setBirthNumber] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HealthProResponse | null>(null);

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
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-xl shadow-md border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Nový zdravotný záznam (app.sayclinic.sk)</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rodné číslo pacienta:
          </label>
          <input
            type="text"
            required
            placeholder="napr. 850101/1234"
            value={birthNumber}
            onChange={(e) => setBirthNumber(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kód diagnózy (MKCH):
          </label>
          <input
            type="text"
            required
            placeholder="napr. J20.9"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lekárska správa / Dekurzus:
          </label>
          <textarea
            rows={3}
            placeholder="Subjektívny a objektívny nález..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:bg-blue-300"
        >
          {loading ? 'Odosielam do eZdravia...' : 'Odoslať do HealthPro (eZdravie)'}
        </button>
      </form>

      {result && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${result.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          <p className="font-semibold">{result.message}</p>
          {result.transactionId && (
            <p className="text-xs mt-1 text-gray-600">ID Transakcie: {result.transactionId}</p>
          )}
        </div>
      )}
    </div>
  );
}
