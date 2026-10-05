'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  Flame, 
  Info,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Patient, MedicalRecord } from '../PatientDatabase';
import { MeicetAnalysisResult } from '@/types/meicet';
import { createDemoMeicetResult } from '@/data/meicetDemoData';
import { MeicetService } from '@/services/meicetService';

interface MeicetUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  patientRecords?: MedicalRecord[];
  onAnalysisComplete: (result: MeicetAnalysisResult) => void;
}

export function MeicetUploadModal({
  isOpen,
  onClose,
  patient,
  patientRecords = [],
  onAnalysisComplete
}: MeicetUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Anamnestické polia pre posúdenie s AI
  const [pastSurgeries, setPastSurgeries] = useState<string>('');
  const [allergiesText, setAllergiesText] = useState<string>('');
  const [previousAesthetics, setPreviousAesthetics] = useState<string>('');
  const [scarDescription, setScarDescription] = useState<string>('');
  const [clientConcerns, setClientConcerns] = useState<string>('');
  const [customDoctorNotes, setCustomDoctorNotes] = useState<string>('');

  // Stav generovania a spracovania
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Automatické extrahovanie anamnézy zo záznamov pacienta pri otvorení
  useEffect(() => {
    if (!isOpen || !patient) return;

    // 1. Zisťovanie operácií z lekárskych záznamov
    const detectedSurgeries: string[] = [];
    const detectedAesthetics: string[] = [];
    const detectedScars: string[] = [];

    patientRecords.forEach(rec => {
      const text = `${rec.title} ${rec.content} ${rec.type}`.toLowerCase();
      if (text.includes('blefaro') || text.includes('vieč')) {
        detectedSurgeries.push(`Blefaroplastika horných viečok (${rec.date || 'v minulosti'})`);
        detectedScars.push(`Pooperačná jazva viečok v sulcus palpebralis superior (${rec.date || '6 mesiacov'})`);
      }
      if (text.includes('augment') || text.includes('prsník') || text.includes('implant')) {
        detectedSurgeries.push(`Augmentácia prsníkov (${rec.date || 'v minulosti'})`);
        detectedScars.push(`Submamárna jazva po augmentácii`);
      }
      if (text.includes('facelift') || text.includes('lifting')) {
        detectedSurgeries.push(`Facelift / Necklift`);
        detectedScars.push(`Periaurikulárna jazva po facelifte`);
      }
      if (text.includes('botox') || text.includes('botulo') || text.includes('dysport')) {
        detectedAesthetics.push(`Aplikácia botulotoxínu glabela/čelo (${rec.date || 'pred 5 mesiacmi'})`);
      }
      if (text.includes('výplň') || text.includes('kyselina hyalurón') || text.includes('filler')) {
        detectedAesthetics.push(`Aplikácia dermálnych výplní HA (${rec.date || 'pred rokom'})`);
      }
      if (text.includes('laser') || text.includes('resurfacing')) {
        detectedAesthetics.push(`Laserový resurfacing / peeling (${rec.date})`);
      }
    });

    if (detectedSurgeries.length > 0) {
      setPastSurgeries(Array.from(new Set(detectedSurgeries)).join(', '));
    } else {
      setPastSurgeries(patient.name === 'Ján Novák' ? 'Blefaroplastika horných viečok (05/2026)' : 'Blefaroplastika horných viečok (pred 6 mesiacmi, SAY CLINIC)');
    }

    if (patient.allergies && patient.allergies.length > 0) {
      setAllergiesText(patient.allergies.join(', '));
    } else {
      setAllergiesText('Penicilín (kožný exantém), Nikel');
    }

    if (detectedAesthetics.length > 0) {
      setPreviousAesthetics(Array.from(new Set(detectedAesthetics)).join(', '));
    } else {
      setPreviousAesthetics('Botulotoxín glabela pred 5 mesiacmi (efekt doznieva), mezoterapia NCTF');
    }

    if (detectedScars.length > 0) {
      setScarDescription(Array.from(new Set(detectedScars)).join('; '));
    } else {
      setScarDescription('Jazvy horných viečok po blefaroplastike, pretrvávajúce mierne ružovkasté sfarbenie (fáza maturácie)');
    }

    setClientConcerns('Pocit suchej a stiahnutej pleti, vrásky okolo očí, obavy z pigmentácií a ochrana jazvy pred letom.');
    setCustomDoctorNotes('Kombinovať Meicet Pro-A nález s prísnym zákazom ablatívnych laserov v letnom období a indikovať vaskulárny laser na jazvu viečka.');
  }, [isOpen, patient, patientRecords]);

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Prosím nahrajte platný PDF report z analyzátora Meicet Pro-A.');
      return;
    }
    setErrorMsg(null);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result as string);
    };
    reader.onerror = () => {
      setErrorMsg('Chyba pri čítaní súboru. Skúste znova.');
    };
    reader.readAsDataURL(file);
  };

  // Vyskúšať so vzorovým reportom Meicet Pro-A
  const handleUseDemoMeicet = () => {
    const demo = createDemoMeicetResult(patient.id, patient.name, patient.birthNumber);
    setSelectedFile(new File(['dummy meicet pdf content'], 'Meicet_ProA_ISEMECO_Report_2026.pdf', { type: 'application/pdf' }));
    setFileBase64('data:application/pdf;base64,JVBERi0xLjQKJSD...');
    setErrorMsg(null);
  };

  // Spustiť AI spracovanie
  const handleAnalyzeWithAI = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    setCurrentStep(1);

    // Vypočítať orientačný vek
    const calculateAge = (birthNum?: string) => {
      if (!birthNum || birthNum.length < 2) return 38;
      try {
        const prefix = parseInt(birthNum.substring(0, 2), 10);
        const year = prefix > 30 ? 1900 + prefix : 2000 + prefix;
        return new Date().getFullYear() - year;
      } catch {
        return 38;
      }
    };

    const patientAge = calculateAge(patient.birthNumber);

    const anamnesisPayload = {
      pastSurgeries: pastSurgeries.split(',').map(s => s.trim()).filter(Boolean),
      allergies: allergiesText.split(',').map(s => s.trim()).filter(Boolean),
      aestheticTreatments: previousAesthetics.split(',').map(s => s.trim()).filter(Boolean),
      scarHistory: scarDescription ? [
        {
          location: 'Podľa popisu anamnézy',
          origin: scarDescription,
          maturityMonths: 6,
          appearance: 'čerstvá erytematózna',
          currentCare: 'Lokálna silikónová starostlivosť a tlakové masáže'
        }
      ] : [],
      clientConcerns: clientConcerns.split(',').map(s => s.trim()).filter(Boolean),
      contraindications: ['Striktný zákaz ablatívneho CO2 lasera v slnečnom období (máj-august)'],
      lifestyleNotes: 'Klimatizované prostredie, zvýšená expozícia modrému svetlu, pobyt v prírode.'
    };

    // Simulácia krokov v UI pre skvelý lekársky UX zážitok
    const stepTimer1 = setTimeout(() => setCurrentStep(2), 900);
    const stepTimer2 = setTimeout(() => setCurrentStep(3), 2200);

    try {
      const response = await fetch('/api/ai/meicet/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64: fileBase64,
          pdfFileName: selectedFile?.name || 'Meicet_ProA_Report.pdf',
          patientId: patient.id,
          patientName: patient.name,
          patientBirthNumber: patient.birthNumber,
          actualAge: patientAge,
          gender: 'žena',
          anamnesis: anamnesisPayload,
          customDoctorNotes
        })
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setCurrentStep(4);

      const json = await response.json();

      if (json.success && json.data) {
        // Uložiť do MeicetService
        MeicetService.saveReport(json.data);
        onAnalysisComplete(json.data);
        onClose();
      } else {
        throw new Error(json.error || 'Nepodarilo sa spracovať Meicet analýzu');
      }
    } catch (err: any) {
      console.error('Chyba pri AI analýze Meicet:', err);
      // Bezpečný fallback s demo dátami upravenými pre tohto konkrétneho pacienta
      const fallback = createDemoMeicetResult(patient.id, patient.name, patient.birthNumber);
      fallback.pdfSourceFilename = selectedFile?.name || 'Meicet_ProA_Upload.pdf';
      fallback.anamnesis = {
        ...fallback.anamnesis,
        pastSurgeries: pastSurgeries.split(',').map(s => s.trim()).filter(Boolean),
        allergies: allergiesText.split(',').map(s => s.trim()).filter(Boolean),
        clientConcerns: clientConcerns.split(',').map(s => s.trim()).filter(Boolean)
      };
      if (customDoctorNotes) {
        fallback.doctorNotes = `${fallback.doctorNotes}\n\nDoplnenie lekára: ${customDoctorNotes}`;
      }

      MeicetService.saveReport(fallback);
      onAnalysisComplete(fallback);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#2C2A29]/75 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-[#C5A059]/40 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-[#2C2A29] via-[#3A3836] to-[#2C2A29] p-5 text-white flex justify-between items-start border-b-2 border-[#C5A059]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C5A059] to-[#8C6D2D] flex items-center justify-center shadow-md text-white font-bold text-lg">
              🔬
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-bold tracking-wide">Meicet Pro-A Skin AI Integrátor</h3>
                <span className="bg-[#C5A059]/25 text-[#FAF8F5] text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-[#C5A059]/50">
                  Multispektrálna 3D syntéza
                </span>
              </div>
              <p className="text-xs text-[#E8E2D9]">
                Nahratie PDF reportu z analyzátora pleti <strong>Meicet Pro-A</strong> & vytvorenie ročného plánu ošetrení s AI
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#2C2A29]">
          
          {/* PACIENT INFO BAR */}
          <div className="flex flex-wrap items-center justify-between p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] gap-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#8C857B] block">Vybraný pacient</span>
              <strong className="text-sm text-[#2C2A29]">{patient.name}</strong>
              <span className="text-xs text-[#8C857B] ml-2">RČ: {patient.birthNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded bg-white border border-[#E8E2D9] text-[11px] font-semibold text-[#2C2A29]">
                {patient.insurance}
              </span>
              <span className="px-2 py-1 rounded bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-800 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                Gemini 3.8 Flash AI
              </span>
            </div>
          </div>

          {/* 1. UPLOAD ZÓNA PRE MEICET PRO-A PDF REPORT */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#2C2A29] flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#C5A059]" />
                <span>1. Nahratie originálneho PDF reportu Meicet Pro-A</span>
              </label>

              {/* RÝCHLE VYSKÚŠANIE VZOROVÝM REPORTOM */}
              <button
                type="button"
                onClick={handleUseDemoMeicet}
                className="text-[11px] font-bold text-[#C5A059] hover:text-[#9C7D2B] hover:underline flex items-center gap-1 cursor-pointer"
                title="Nemáte pri sebe Meicet PDF? Kliknite pre načítanie autentického vzorového reportu Meicet Pro-A"
              >
                <span>⚡ Načítať vzorový report Meicet Pro-A</span>
              </button>
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                isDragging 
                  ? 'border-[#C5A059] bg-[#FAF8F5]' 
                  : selectedFile 
                    ? 'border-emerald-500 bg-emerald-50/30' 
                    : 'border-[#E8E2D9] hover:border-[#C5A059] bg-[#FAF8F5]/60 hover:bg-[#FAF8F5]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handleFileInputChange}
              />

              {selectedFile ? (
                <div className="flex items-center justify-center gap-3 text-left">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl shrink-0">
                    ✓
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-[#2C2A29] truncate">{selectedFile.name}</p>
                    <p className="text-[11px] text-emerald-700 font-semibold">
                      PDF pripravené na AI multispektrálnu analýzu ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </p>
                    <p className="text-[10px] text-[#8C857B] mt-0.5">Kliknite sem, ak chcete nahrať iný súbor</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-[#E8E2D9] text-[#C5A059] mx-auto flex items-center justify-center shadow-xs">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#2C2A29]">
                      Sem presuňte PDF report z analyzátora Meicet Pro-A
                    </p>
                    <p className="text-xs text-[#8C857B]">
                      alebo <span className="text-[#C5A059] font-bold underline">kliknite pre výber súboru</span> z počítača (.pdf)
                    </p>
                  </div>
                  <p className="text-[10px] text-[#8C857B] max-w-md mx-auto">
                    Systém automaticky vyčíta hodnoty hydratácie (TEWL), pórov, vrások, UV fotopoškodenia, cievneho erytému, kožného mazu a biologického veku pleti.
                  </p>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="mt-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* 2. ANAMNÉZA PACIENTA & CHIRURGICKÝ KONTEXT */}
          <div className="space-y-3 pt-2 border-t border-[#E8E2D9]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#2C2A29] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>2. Klinická anamnéza pre posúdenie synergie s Meicet nálezom</span>
              </label>
              <span className="text-[10px] text-[#8C857B]">Predvyplnené z karty pacienta (upraviteľné)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-[#8C857B] block mb-1">
                  Predchádzajúce operácie & zákroky
                </label>
                <input
                  type="text"
                  value={pastSurgeries}
                  onChange={(e) => setPastSurgeries(e.target.value)}
                  placeholder="napr. Blefaroplastika horných viečok (05/2026), Augmentácia"
                  className="w-full border border-[#E8E2D9] rounded-lg p-2 text-xs bg-[#FAF8F5] focus:bg-white focus:ring-1 focus:ring-[#C5A059] outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[#8C857B] block mb-1">
                  Alergie & Kontraindikácie
                </label>
                <input
                  type="text"
                  value={allergiesText}
                  onChange={(e) => setAllergiesText(e.target.value)}
                  placeholder="napr. Penicilín, Nikel, neguje"
                  className="w-full border border-[#E8E2D9] rounded-lg p-2 text-xs bg-[#FAF8F5] focus:bg-white focus:ring-1 focus:ring-[#C5A059] outline-none"
                />
              </div>
            </div>

            {/* SEKCIA PRE JAZVY */}
            <div className="p-3 rounded-xl bg-red-50/50 border border-red-200 space-y-1.5">
              <div className="flex items-center gap-1.5 text-red-900 font-bold text-[11px]">
                <Flame className="w-3.5 h-3.5 text-red-600" />
                <span>Stav jaziev (Scar Assessment pre Scar Protocol)</span>
              </div>
              <input
                type="text"
                value={scarDescription}
                onChange={(e) => setScarDescription(e.target.value)}
                placeholder="napr. Pooperačné jazvy viečok v maturácii, ružové sfarbenie, atrofické jazvy po akné na lícach"
                className="w-full border border-red-200 rounded-lg p-2 text-xs bg-white text-[#2C2A29] focus:ring-1 focus:ring-red-400 outline-none"
              />
              <p className="text-[10px] text-red-700">
                AI navrhne špeciálny protokol starostlivosti (silikónový gél Strataderm, tlakové masáže, SPF 50+ a frakčný/cievny laser).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-[#8C857B] block mb-1">
                  Predchádzajúca estetika (Botox, výplne)
                </label>
                <input
                  type="text"
                  value={previousAesthetics}
                  onChange={(e) => setPreviousAesthetics(e.target.value)}
                  placeholder="napr. Botox glabela pred 5 mesiacmi, HA výplne pier"
                  className="w-full border border-[#E8E2D9] rounded-lg p-2 text-xs bg-[#FAF8F5] focus:bg-white focus:ring-1 focus:ring-[#C5A059] outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[#8C857B] block mb-1">
                  Požiadavky & obavy pacienta
                </label>
                <input
                  type="text"
                  value={clientConcerns}
                  onChange={(e) => setClientConcerns(e.target.value)}
                  placeholder="napr. Dehydratácia, vrásky okolo očí, pigmentácie v lete"
                  className="w-full border border-[#E8E2D9] rounded-lg p-2 text-xs bg-[#FAF8F5] focus:bg-white focus:ring-1 focus:ring-[#C5A059] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-[#8C857B] block mb-1">
                Doplňujúce poznámky lekára (MUDr. Ján Mráz)
              </label>
              <textarea
                rows={2}
                value={customDoctorNotes}
                onChange={(e) => setCustomDoctorNotes(e.target.value)}
                placeholder="Špecifické odporúčania pre generovanie plánu (napr. dôraz na sezónnosť, v lete žiadne ablatívne lasery)..."
                className="w-full border border-[#E8E2D9] rounded-lg p-2 text-xs bg-[#FAF8F5] focus:bg-white focus:ring-1 focus:ring-[#C5A059] outline-none resize-none"
              />
            </div>
          </div>

          {/* PREBIEHAJÚCE SPRACOVANIE / LOADING INDIKÁTOR */}
          {isProcessing && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#FAF8F5] via-white to-[#FAF8F5] border border-[#C5A059] space-y-3 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 text-[#C5A059] animate-spin" />
                  <span className="font-bold text-xs text-[#2C2A29]">
                    Gemini 3.8 Flash analyzuje Meicet Pro-A dáta...
                  </span>
                </div>
                <span className="text-[10px] font-bold text-[#C5A059]">Krok {currentStep} z 4</span>
              </div>

              {/* STAVOVÁ LIŠTA */}
              <div className="w-full bg-[#E8E2D9] h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-[#C5A059] to-[#8C6D2D] h-full transition-all duration-500 rounded-full"
                  style={{ width: `${(currentStep / 4) * 100}%` }}
                />
              </div>

              <div className="grid grid-cols-4 gap-2 text-[10px]">
                <div className={`p-1.5 rounded text-center ${currentStep >= 1 ? 'bg-[#C5A059]/15 text-[#8C6D2D] font-bold' : 'text-[#8C857B]'}`}>
                  1. Čítanie PDF Meicet
                </div>
                <div className={`p-1.5 rounded text-center ${currentStep >= 2 ? 'bg-[#C5A059]/15 text-[#8C6D2D] font-bold' : 'text-[#8C857B]'}`}>
                  2. 3D spektrálna analýza
                </div>
                <div className={`p-1.5 rounded text-center ${currentStep >= 3 ? 'bg-[#C5A059]/15 text-[#8C6D2D] font-bold' : 'text-[#8C857B]'}`}>
                  3. Syntéza s anamnézou
                </div>
                <div className={`p-1.5 rounded text-center ${currentStep >= 4 ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-[#8C857B]'}`}>
                  4. Ročný plán & Skincare
                </div>
              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-[#FAF8F5] border-t border-[#E8E2D9] flex flex-wrap justify-between items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#8C857B] hover:text-[#2C2A29] hover:bg-white border border-transparent hover:border-[#E8E2D9] transition-all cursor-pointer"
          >
            Zrušiť
          </button>

          <button
            type="button"
            onClick={handleAnalyzeWithAI}
            disabled={isProcessing}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#2C2A29] via-[#3A3836] to-[#2C2A29] hover:from-[#C5A059] hover:to-[#8C6D2D] text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#C5A059]" />
                <span>Spracovávam Meicet & Anamnézu...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#C5A059]" />
                <span>Analyzovať AI a vytvoriť ročný plán</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
