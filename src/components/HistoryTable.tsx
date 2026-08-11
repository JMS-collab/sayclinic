'use client';

import React, { useState } from 'react';

// Typ pre záznam ošetrenia
export interface MedicalRecordItem {
  id: string;
  patientName: string;
  birthNumber: string;
  diagnosisCode: string;
  notes: string;
  date: string;
  doctorName: string;
  healthproStatus: 'SENT' | 'PENDING' | 'FAILED';
  transactionId?: string;
}

// Simulované (MOCK) dáta ošetrení
const MOCK_RECORDS: MedicalRecordItem[] = [
  {
    id: 'REC-101',
    patientName: 'Ján Novák',
    birthNumber: '800512/7412',
    diagnosisCode: 'J20.9',
    notes: 'Akútna bronchitída, predpísaný ATB liek.',
    date: '11.08.2026 09:15',
    doctorName: 'MUDr. Peter Kováč',
    healthproStatus: 'SENT',
    transactionId: 'MOCK-TX-884219',
  },
  {
    id: 'REC-102',
    patientName: 'Anna Kováčová',
    birthNumber: '925315/6548',
    diagnosisCode: 'I10',
    notes: 'Esenciálna hypertenzia - kontrola tlaku krvi.',
    date: '11.08.2026 10:30',
    doctorName: 'MUDr. Peter Kováč',
    healthproStatus: 'SENT',
    transactionId: 'MOCK-TX-109234',
  },
  {
    id: 'REC-103',
    patientName: 'Katarína Slaná',
    birthNumber: '885820/1234',
    diagnosisCode: 'E11.9',
    notes: 'Diabetes mellitus 2. typu bez komplikácií.',
    date: '10.08.2026 14:00',
    doctorName: 'Sestra Mária Nováková',
    healthproStatus: 'FAILED',
  },
];

export default function HistoryTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Filtrovanie záznamov
  const filteredRecords = MOCK_RECORDS.filter((rec) => {
    const matchesSearch =
      rec.birthNumber.includes(searchTerm) ||
      rec.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.diagnosisCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || rec.healthproStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">História ošetrení pacientov</h2>
          <p className="text-xs text-gray-500">Prehľad dekurzusov odoslaných do NCZI / HealthPro</p>
        </div>

        {/* Vyhľadávanie a Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Vyhľadať rodné číslo, meno alebo MKCH..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none w-full sm:w-64"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
          >
            <option value="ALL">Všetky stavy</option>
            <option value="SENT">Odoslané (NCZI OK)</option>
            <option value="FAILED">Chybná transakcia</option>
          </select>
        </div>
      </div>

      {/* Tabuľka */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="py-3 px-4">Dátum & Čas</th>
              <th className="py-3 px-4">Pacient</th>
              <th className="py-3 px-4">Rodné číslo</th>
              <th className="py-3 px-4">Diagnóza</th>
              <th className="py-3 px-4">Ošetrujúci</th>
              <th className="py-3 px-4">Stav eZdravia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filteredRecords.length > 0 ? (
              filteredRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-3.5 px-4 text-gray-600 font-mono text-xs whitespace-nowrap">{rec.date}</td>
                  <td className="py-3.5 px-4 font-semibold text-gray-900">{rec.patientName}</td>
                  <td className="py-3.5 px-4 font-mono text-xs text-gray-600">{rec.birthNumber}</td>
                  <td className="py-3.5 px-4">
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono font-bold text-xs">
                      {rec.diagnosisCode}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-gray-700">{rec.doctorName}</td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {rec.healthproStatus === 'SENT' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Odoslané
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Chyba NCZI
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500">
                  Nenašli sa žiadne záznamy zodpovedajúce vyhľadávaniu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
