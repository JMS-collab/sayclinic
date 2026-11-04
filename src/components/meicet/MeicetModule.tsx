'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Upload, 
  CheckCircle2, 
  Trash2,
  Wand2
} from 'lucide-react';
import { Patient, MedicalRecord } from '../PatientDatabase';
import { MeicetAnalysisResult } from '@/types/meicet';
import { MeicetService } from '@/services/meicetService';
import { MeicetUploadModal } from './MeicetUploadModal';
import { MeicetViewer } from './MeicetViewer';
import { CalendarEvent } from '@/data/calendarConfig';
import { PatientPlan } from '@/data/patientPlanConfig';
import { QUICK_SKIN_CONCERN_PRESETS, createDemoMeicetResult } from '@/data/meicetDemoData';

interface MeicetModuleProps {
  patient?: Patient;
  selectedPatient?: Patient;
  patientRecords?: MedicalRecord[];
  onSaveToPatientPlans?: (plan: PatientPlan) => void;
  onNavigateToRoadmap?: (plan: PatientPlan) => void;
  onScheduleTreatment?: (event: Partial<CalendarEvent>) => void;
  onTransferToCosmeticsPOS?: (products: any[]) => void;
  onOpenInCosmeticsPOS?: (products: any[]) => void;
}

export function MeicetModule({
  patient: propPatient,
  selectedPatient,
  patientRecords = [],
  onSaveToPatientPlans,
  onNavigateToRoadmap,
  onScheduleTreatment,
  onTransferToCosmeticsPOS,
  onOpenInCosmeticsPOS
}: MeicetModuleProps) {
  const patient = propPatient || selectedPatient;
  const handleSavePlan = onSaveToPatientPlans || onNavigateToRoadmap;
  const handlePOS = onTransferToCosmeticsPOS || onOpenInCosmeticsPOS;

  const [reports, setReports] = useState<MeicetAnalysisResult[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([
    'dehydration_barrier',
    'redness_rosacea',
    'wrinkles_mimics'
  ]);
  const [quickTier, setQuickTier] = useState<'high_end' | 'mid_end'>('high_end');
  const [showQuickBuilder, setShowQuickBuilder] = useState(false);

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
    MeicetService.saveReport(newReport);
    setReports(prev => [newReport, ...prev.filter(r => r.id !== newReport.id)]);
    setSelectedReportId(newReport.id);
    setShowQuickBuilder(false);
  };

  const handleUpdateActiveReport = (updatedReport: MeicetAnalysisResult) => {
    MeicetService.saveReport(updatedReport);
    setReports(prev => prev.map(r => (r.id === updatedReport.id ? updatedReport : r)));
  };

  const handleQuickGenerateWithoutPdf = () => {
    if (!patient) return;
    const generated = createDemoMeicetResult(
      patient.id,
      patient.name,
      patient.birthNumber || '',
      quickTier,
      selectedConcerns
    );
    generated.pdfSourceFilename = 'Rychla_AI_Diagnostika_Pleti_SAY.pdf';
    handleAnalysisComplete(generated);
  };

  const toggleConcern = (id: string) => {
    setSelectedConcerns(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleDeleteReport = (reportId: string) => {
    if (!patient) return;
    if (!confirm('Naozaj chcete vymazať tento plán pleti a Meicet analýzu?')) return;
    MeicetService.deleteReport(patient.id, reportId);
    const remaining = reports.filter(r => r.id !== reportId);
    setReports(remaining);
    if (selectedReportId === reportId) {
      setSelectedReportId(remaining[0]?.id || null);
    }
  };

  if (!patient) {
    return (
      <div className="p-8 text-center text-xs text-[#8C857B] bg-[#FAF8F5] rounded-2xl border border-[#E8E2D9]">
        Vyberte pacienta pre zobrazenie a vytvorenie plánu pleti.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* HORNÁ LIŠTA: PREPÍNAČ SKENOV A RÝCHLE AKCIE */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#2C2A29] text-[#C5A059] flex items-center justify-center font-bold text-base shadow-xs">
            🔬
          </div>
          <div>
            <h3 className="font-serif text-sm font-bold text-[#2C2A29]">
              Meicet AI & Plán pleti (Stav pleti • Domáca Skincare • Ročný plán procedúr)
            </h3>
            <p className="text-[11px] text-[#8C857B]">
              Čisto pleťový a nechirurgický modul: diagnostika pleti, Basic/Premium Skincare a sezónne ošetrenia
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {reports.length > 0 && (
            <div className="flex items-center gap-1.5 bg-white border border-[#E8E2D9] rounded-xl p-1 text-xs">
              <span className="text-[10px] uppercase font-bold text-[#8C857B] px-2">História:</span>
              {reports.map((r) => (
                <div key={r.id} className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReportId(r.id);
                      setShowQuickBuilder(false);
                    }}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                      r.id === activeReport?.id && !showQuickBuilder
                        ? 'bg-[#2C2A29] text-white'
                        : 'text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    {r.scanDate} (Skóre {r.metrics.skinScoreOverall})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteReport(r.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                    title="Vymazať tento záznam"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {reports.length > 0 && (
            <button
              type="button"
              onClick={() => setShowQuickBuilder(prev => !prev)}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#2C2A29] border border-[#C5A059] font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>{showQuickBuilder ? 'Späť na aktívny plán' : '+ Rýchly plán pleti bez PDF'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#2C2A29] hover:bg-[#C5A059] text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Nahrať Meicet PDF</span>
          </button>
        </div>
      </div>

      {/* AK EŠTE NIE JE REPORT ALEBO JE OTVORENÝ RÝCHLY KONFIGURÁTOR */}
      {reports.length === 0 || showQuickBuilder ? (
        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E8E2D9] pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#C5A059] block">
                Vytvorenie plánu pleti pre: {patient?.name || 'Klient'}
              </span>
              <h4 className="font-serif text-lg font-bold text-[#2C2A29]">
                Vyberte spôsob diagnostiky pleti (Meicet PDF alebo Rýchle naklikanie problémov)
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-[#FAF8F5] hover:bg-[#2C2A29] text-[#2C2A29] hover:text-white border border-[#C5A059] font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-[#C5A059]" />
              <span>Mám PDF zo skenera Meicet Pro-A</span>
            </button>
          </div>

          {/* KROK 1: NAKLIKANIE HLAVNÝCH PROBLÉMOV PLETI */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-[#2C2A29] block">
              1. Hlavné problémy pleti pacienta (rýchla diagnostika bez PDF):
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {QUICK_SKIN_CONCERN_PRESETS.map(preset => {
                const isSelected = selectedConcerns.includes(preset.id);
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => toggleConcern(preset.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'bg-[#2C2A29] text-white border-[#C5A059] shadow-sm'
                        : 'bg-[#FAF8F5] hover:bg-white text-[#2C2A29] border-[#E8E2D9]'
                    }`}
                  >
                    <span className="text-xl shrink-0">{preset.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <strong className="text-xs font-bold block">{preset.label}</strong>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-[#C5A059] shrink-0" />}
                      </div>
                      <p className={`text-[10px] mt-1 leading-snug ${isSelected ? 'text-[#E8E2D9]' : 'text-[#8C857B]'}`}>
                        {preset.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* KROK 2: VOĽBA PREFEROVANEJ SKINCARE LÍNIE */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#E8E2D9]">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2C2A29]">
                2. Domáca Skincare rutina:
              </span>
              <button
                type="button"
                onClick={() => setQuickTier('mid_end')}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  quickTier === 'mid_end'
                    ? 'bg-sky-900 text-white border-sky-900 shadow-xs'
                    : 'bg-white text-[#2C2A29] border-[#E8E2D9] hover:border-sky-700'
                }`}
              >
                🧴 Basic (La Roche-Posay / CeraVe / Vichy)
              </button>
              <button
                type="button"
                onClick={() => setQuickTier('high_end')}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  quickTier === 'high_end'
                    ? 'bg-[#2C2A29] text-[#C5A059] border-[#C5A059] shadow-xs'
                    : 'bg-white text-[#2C2A29] border-[#E8E2D9] hover:border-[#C5A059]'
                }`}
              >
                💎 Premium (SkinCeuticals Medical-Grade)
              </button>
            </div>

            <button
              type="button"
              onClick={handleQuickGenerateWithoutPdf}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#8C6D2D] hover:from-[#d4b068] hover:to-[#9e7c36] text-white font-bold text-xs uppercase tracking-wider shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Vygenerovať AI Plán pleti & Skincare</span>
            </button>
          </div>
        </div>
      ) : activeReport ? (
        <MeicetViewer
          report={activeReport}
          onUpdateReport={handleUpdateActiveReport}
          onSaveToPatientPlans={handleSavePlan}
          onScheduleTreatment={onScheduleTreatment}
          onTransferToCosmeticsPOS={handlePOS}
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
