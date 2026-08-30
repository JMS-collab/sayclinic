'use client';

import React, { useState } from 'react';
import { generatePdfFilename, exportElementToPdf } from '../lib/pdfGenerator';

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
    printElement.style.width = '794px';
    printElement.style.background = '#ffffff';
    printElement.style.fontFamily = 'Montserrat, sans-serif';
    printElement.style.position = 'absolute';
    printElement.style.left = '-9999px';
    printElement.style.color = '#2C2A29';

    printElement.innerHTML = `
      <div style="border-bottom: 2px solid #C5A059; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 14px;">
          <img src="/logo.png" style="height: 48px; width: auto; object-fit: contain;" alt="SAY BY MRAZ" />
          <div style="border-left: 1px solid #E8E2D9; padding-left: 14px;">
            <h1 style="font-size: 20px; margin: 0; color: #2C2A29; font-weight: 300; letter-spacing: 2px; text-transform: uppercase;">SAY CLINIC</h1>
            <p style="font-size: 8px; color: #C5A059; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; margin: 2px 0 0 0;">Plastická chirurgia & Dermatológia</p>
            <p style="font-size: 9px; color: #8C857B; margin: 2px 0 0 0;">Lazovná 43, 974 01 Banská Bystrica | www.sayclinic.sk</p>
          </div>
        </div>
        <div style="text-align: right; font-size: 10px; color: #8C857B;">
          <span style="background: #2C2A29; color: #ffffff; padding: 3px 8px; border-radius: 4px; font-size: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Lekárska správa</span>
          <p style="margin: 6px 0 0 0; font-weight: bold; color: #2C2A29; font-size: 11px;">${record.doctorName || 'MUDr. Ján Mráz'}</p>
          <p style="margin: 2px 0 0 0;">Dátum: ${record.date || new Date().toLocaleDateString('sk-SK')}</p>
        </div>
      </div>

      <div style="background-color: #FBF9F6; border: 1px solid #E8E2D9; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <h3 style="font-size: 10px; margin: 0 0 10px 0; color: #C5A059; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Údaje o pacientovi</h3>
        <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
          <tr>
            <td style="padding: 4px 0; color: #8C857B; width: 30%; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Meno a Priezvisko:</td>
            <td style="padding: 4px 0; font-weight: bold; color: #2C2A29;">${record.patientName}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #8C857B; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Rodné číslo:</td>
            <td style="padding: 4px 0; font-weight: bold; color: #2C2A29; font-family: monospace;">${record.birthNumber}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #8C857B; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Diagnóza (MKCH-10):</td>
            <td style="padding: 4px 0; font-weight: bold; color: #C5A059;">${record.diagnosisCode}</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 32px;">
        <h3 style="font-size: 10px; margin: 0 0 8px 0; color: #C5A059; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #E8E2D9; padding-bottom: 4px;">Lekársky nález / Dekurzus</h3>
        <div style="border: 1px solid #E8E2D9; border-radius: 12px; padding: 16px; font-size: 12px; color: #2C2A29; min-height: 160px; white-space: pre-wrap; line-height: 1.6; background: #ffffff;">
          ${record.notes || 'Bez špeciálneho záznamu.'}
        </div>
      </div>

      <div style="margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 10px; color: #8C857B; border-top: 1px solid #E8E2D9; pt: 16px;">
        <div>
          <p style="margin: 0;">Vytlačené z interného systému SAY CLINIC</p>
        </div>
        <div style="text-align: center; width: 200px; padding-top: 8px;">
          <div style="width: 160px; border-bottom: 1px solid #2C2A29; margin: 0 auto 6px auto;"></div>
          <p style="margin: 0; font-weight: bold; color: #2C2A29;">${record.doctorName}</p>
          <p style="margin: 2px 0 0 0; font-size: 9px;">Pečiatka a podpis lekára</p>
        </div>
      </div>
    `;

    document.body.appendChild(printElement);

    try {
      const filename = generatePdfFilename('Lekarska_Sprava', record.patientName, record.date);
      await exportElementToPdf(printElement, filename);
    } catch (err) {
      console.error('Chyba pri generovaní PDF:', err);
      alert('Nastala chyba pri exporte do PDF.');
    } finally {
      document.body.removeChild(printElement);
      setGenerating(false);
    }
  };

  return (
    <button
      onClick={generatePdf}
      disabled={generating}
      className="inline-flex items-center gap-1.5 bg-[#FBF9F6] hover:bg-[#F4EFEA] text-[#2C2A29] text-xs font-semibold py-1.5 px-3 rounded-lg border border-[#E8E2D9] transition-all disabled:opacity-50 cursor-pointer shadow-xs hover:border-[#C5A059]"
    >
      📄 {generating ? 'Generujem PDF...' : 'Stiahnuť PDF'}
    </button>
  );
}
