'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Upload, 
  FileText, 
  Plus, 
  Calendar as CalendarIcon, 
  Activity, 
  CheckCircle2, 
  Trash2, 
  ChevronRight,
  ShieldCheck,
  Flame,
  Award
} from 'lucide-react';
import { Patient, MedicalRecord } from '../PatientDatabase';
import { MeicetAnalysisResult } from '@/types/meicet';
import { MeicetService } from '@/services/meicetService';
import { MeicetUploadModal } from './MeicetUploadModal';
import { MeicetViewer } from './MeicetViewer';
import { createDemoMeicetResult } from '@/data/meicetDemoData';
import { CalendarEvent } from '@/data/calendarConfig';
import { PatientPlan } from '@/data/patientPlanConfig';

interface MeicetModuleProps {
  patient: Patient;
  patientRecords?: MedicalRecord[];
  onSaveToPatientPlans?: (plan: PatientPlan) => void;
  onScheduleTreatment?: (event: Partial<CalendarEvent>) => void;
  onTransferToCosmeticsPOS?: (products: any[]) => void;
}

export function MeicetModule({
  patient,
  patientRecords = [],
  onSaveToPatientPlans,
  onScheduleTreatment,
  onTransferToCosmeticsPOS
}: MeicetModuleProps) {
  const [reports, setReports] = useState<MeicetAnalysisResult[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Načítanie reportov pre tohto pacienta
  const loadReports = () => {
    if (!patient?.id) return;
    const patientReports = MeicetService.getReportsForPatient(patient.id);
    setReports(patientReports);
    if (patientReports.length > 0 && !selectedReportId) {
      setSelectedReportId(patientReports[0].id);
    }
  };

  useEffect(() => {
    loadReports();
  }, [patient?.id]);

  const activeReport = reports.find(r => r.id === selectedReportId) || reports[0] || null;

  const handleAnalysisComplete = (newReport: MeicetAnalysisResult) => {
    setReports(prev => [newReport, ...prev.filter(r => r.id !== newReport.id)]);
    setSelectedReportId(newReport.id);
    
    // Automaticky prepojiť s PatientPlans v karte pacienta
    if (onSaveToPatientPlans) {
      const plan = MeicetService.convertToPatientPlan(newReport);
      onSaveToPatientPlans(plan);
    }
  };

  const handleDeleteReport = (reportId: string) => {
    if (!confirm('Naozaj chcete vymazať túto Meicet analýzu?')) return;
    MeicetService.deleteReport(patient.id, reportId);
    setReports(prev => prev.filter(r => r.id !== reportId));
    if (selectedReportId === reportId) {
      setSelectedReportId(reports.find(r => r.id !== reportId)?.id || null);
    }
  };

  const handleCreateDemo = () => {
    const demo = createDemoMeicetResult(patient.id, patient.name, patient.birthNumber);
    MeicetService.saveReport(demo);
    setReports(prev => [demo, ...prev]);
    setSelectedReportId(demo.id);
    if (onSaveToPatientPlans) {
      onSaveToPatientPlans(MeicetService.convertToPatientPlan(demo));
    }
  };

  return (
    <div className="space-y-5">
      
      {/* HORNÝ PREPÍNAČ MEDZI HISTÓRIOU SKENOV A NOVÝM SKENOM */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#2C2A29] text-[#C5A059] flex items-center justify-center font-bold text-sm">
            🔬
          </div>
          <div>
            <h3 className="font-serif text-sm font-bold text-[#2C2A29]">
              Meicet Pro-A Skin Diagnostic Hub
            </h3>
            <p className="text-[10px] text-[#8C857B]">
              Evidencia 3D spektrálnych meraní pleti, posúdenie s anamnézou a ročné plány ošetrení
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {reports.length > 0 && (
            <div className="flex items-center gap-1.5 bg-white border border-[#E8E2D9] rounded-xl p-1 text-xs">
              <span className="text-[10px] uppercase font-bold text-[#8C857B] px-2">Sken:</span>
              {reports.map((r, idx) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedReportId(r.id)}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                    r.id === activeReport?.id
                      ? 'bg-[#2C2A29] text-white'
                      : 'text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#FAF8F5]'
                  }`}
                >
                  {r.scanDate} (Skóre {r.metrics.skinScoreOverall})
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#2C2A29] hover:bg-[#C5A059] text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Nahrať PDF Meicet Pro-A</span>
          </button>
        </div>
      </div>

      {/* AK EŠTE NIE JE ŽIADNY REPORT */}
      {reports.length === 0 ? (
        <div className="border-2 border-dashed border-[#E8E2D9] rounded-2xl p-10 bg-white text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#FAF8F5] to-white border border-[#C5A059] text-[#C5A059] mx-auto flex items-center justify-center text-3xl shadow-sm">
            🔬
          </div>

          <div className="max-w-xl mx-auto space-y-2">
            <h3 className="font-serif text-xl font-bold text-[#2C2A29]">
              Pre pacienta {patient.name} zatiaľ nebol nahratý report Meicet Pro-A
            </h3>
            <p className="text-xs text-[#8C857B] leading-relaxed">
              Analyzátor pleti <strong>Meicet Pro-A</strong> vyhotovuje pokročilý multispektrálny AI report (RGB svetlo, UV žiarenie, krížová polarizácia). Nahrajte PDF export priamo do systému — AI v súčinnosti s chirurgickou a dermatologickou anamnézou pacienta vytvorí komplexný <strong>12-mesačný plán ošetrení, personalizovanú skincare rutinu a protokol starostlivosti o jazvy</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#2C2A29] via-[#3A3836] to-[#2C2A29] hover:from-[#C5A059] hover:to-[#8C6D2D] text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-[#C5A059]" />
              <span>Nahrať Meicet Pro-A PDF report</span>
            </button>

            <button
              type="button"
              onClick={handleCreateDemo}
              className="px-5 py-3 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#C5A059] text-[#2C2A29] font-bold text-xs transition-colors flex items-center gap-2 shadow-2xs cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#C5A059]" />
              <span>Vyskúšať so vzorovým reportom Meicet</span>
            </button>
          </div>

          {/* PREHĽAD ČO SYSTÉM AUTOMATICKY ZHODNOTÍ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-3xl mx-auto pt-6 border-t border-[#E8E2D9]">
            <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9]">
              <span className="text-lg block mb-1">📊</span>
              <strong className="text-xs font-bold text-[#2C2A29] block">8 Multispektrálnych spektier</strong>
              <p className="text-[10px] text-[#8C857B]">Hydratácia (TEWL), póry, vrásky, UV fotopoškodenie, erytém, kožný maz a biologický vek.</p>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9]">
              <span className="text-lg block mb-1">🩹</span>
              <strong className="text-xs font-bold text-[#2C2A29] block">Protokol starostlivosti o jazvy</strong>
              <p className="text-[10px] text-[#8C857B]">Posúdenie zrenia jaziev po blefaroplastike/operáciách, silikónový gél, tlakové masáže, SPF 50+.</p>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9]">
              <span className="text-lg block mb-1">🗓️</span>
              <strong className="text-xs font-bold text-[#2C2A29] block">12-Mesačný plán ošetrení</strong>
              <p className="text-[10px] text-[#8C857B]">Sezónne rozdelenie (Q1-Q4) s rešpektovaním letného zákazu laserov a kontrolnými re-skenmi.</p>
            </div>
          </div>
        </div>
      ) : activeReport ? (
        <MeicetViewer
          report={activeReport}
          onSaveToPatientPlans={onSaveToPatientPlans}
          onScheduleTreatment={onScheduleTreatment}
          onTransferToCosmeticsPOS={onTransferToCosmeticsPOS}
          onNewScanRequested={() => setIsUploadModalOpen(true)}
        />
      ) : null}

      {/* UPLOAD MODAL */}
      {isUploadModalOpen && (
        <MeicetUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          patient={patient}
          patientRecords={patientRecords}
          onAnalysisComplete={handleAnalysisComplete}
        />
      )}

    </div>
  );
}
