'use client';

import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface MedicalRecordData {
  patientName: string;
  birthNumber: string;
  diagnosisCode: string;
  notes: string;
  date: string;
  doctorName: string;
  transactionId?: string;
}

export default function PdfExportButton({ record }: { record: MedicalRecordData }) {
  const [generating, setGenerating] = useState(false);

  const generatePdf = async () => {
    setGenerating(true);

    const printElement = document.createElement('div');
    printElement.style.padding = '40px';
    printElement.style.width = '800px';
    printElement.style.background = '#ffffff';
    printElement.style.fontFamily = 'sans-serif';
    printElement.style.position = 'absolute';
    printElement.style.left = '-9999px';

    printElement.innerHTML = `
      <div style="border-bottom: 2px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h1 style="font-size: 22px; margin: 0; color: #1e3a8a; font-weight: bold;">SayClinic Ambulancia s.r.o.</h1>
          <p style="font-size: 12px; color: #6b7280; margin: 4px 0 0 0;">Ambulantná lekárska správa / Dekurzus</p>
        </div>
        <div style="text-align: right; font-size: 11px; color: #4b5563;">
          <p style="margin: 0;"><strong>Dátum ošetrenia:</strong> ${record.date}</p>
          <p style="margin: 2px 0 0 0;"><strong>NCZI ID:</strong> ${record.transactionId || 'MOCK-TX-LOCAL'}</p>
        </div>
      </div>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <h3 style="font-size: 14px; margin: 0 0 12px 0; color: #334155; text-transform: uppercase; letter-spacing: 0.5px;">Údaje o pacientovi</h3>
        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
          <tr>
            <td style="padding: 4px 0; color: #64748b; width: 30%;">Meno a Priezvisko:</td>
            <td style="padding: 4px 0; font-weight: bold; color: #0f172a;">${record.patientName}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Rodné číslo:</td>
            <td style="padding: 4px 0; font-weight: bold; color: #0f172a;">${record.birthNumber}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Diagnóza (MKCH-10):</td>
            <td style="padding: 4px 0; font-weight: bold; color: #1d4ed8;">${record.diagnosisCode}</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 32px;">
        <h3 style="font-size: 14px; margin: 0 0 8px 0; color: #334155; text-transform: uppercase; letter-spacing: 0.5px;">Lekársky nález / Dekurzus</h3>
        <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; font-size: 13px; color: #1e293b; min-height: 120px; white-space: pre-wrap; line-height: 1.6;">
          ${record.notes || 'Bez špeciálneho záznamu.'}
        </div>
      </div>

      <div style="margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 12px; color: #64748b;">
        <div>
          <p style="margin: 0;">Vytlačené zo systému app.sayclinic.sk</p>
        </div>
        <div style="text-align: center; border-top: 1px dashed #94a3b8; width: 220px; padding-top: 8px;">
          <p style="margin: 0; font-weight: bold; color: #0f172a;">${record.doctorName}</p>
          <p style="margin: 2px 0 0 0; font-size: 11px;">Pečiatka a podpis lekára</p>
        </div>
      </div>
    `;

    document.body.appendChild(printElement);

    try {
      const canvas = await html2canvas(printElement, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Dekurzus_${record.birthNumber.replace('/', '_')}.pdf`);
    } catch (err) {
      console.error('Chyba pri generovaní PDF:', err);
    } finally {
      document.body.removeChild(printElement);
      setGenerating(false);
    }
  };

  return (
    <button
      onClick={generatePdf}
      disabled={generating}
      className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold py-1.5 px-3 rounded-lg border border-gray-300 transition-colors disabled:opacity-50"
    >
      📄 {generating ? 'Generujem PDF...' : 'Stiahnuť PDF'}
    </button>
  );
}
