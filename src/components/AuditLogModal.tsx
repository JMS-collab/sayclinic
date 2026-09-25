'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  ShieldAlert, 
  FileText, 
  Download, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Lock, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  Clock,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { UserAccount } from './LoginForm';
import { AuditLogService, AuditLogEntry, AuditActionCategory, AuditSeverity } from '../services/auditLogService';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
}

export default function AuditLogModal({
  isOpen,
  onClose,
  currentUser
}: AuditLogModalProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AuditActionCategory | 'ALL'>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<AuditSeverity | 'ALL'>('ALL');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Načítanie logov
  const refreshLogs = () => {
    setLogs(AuditLogService.getLogs());
  };

  useEffect(() => {
    if (isOpen) {
      refreshLogs();
    }
  }, [isOpen]);

  // Počúvanie nových logov
  useEffect(() => {
    const handleLogAdded = () => {
      if (isOpen) refreshLogs();
    };
    window.addEventListener('say_clinic_audit_log_added', handleLogAdded);
    return () => window.removeEventListener('say_clinic_audit_log_added', handleLogAdded);
  }, [isOpen]);

  // Filtrovanie
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (selectedCategory !== 'ALL' && log.category !== selectedCategory) return false;
      if (selectedSeverity !== 'ALL' && log.severity !== selectedSeverity) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchUser = log.userName.toLowerCase().includes(q) || log.userEmail.toLowerCase().includes(q);
        const matchAction = log.action.toLowerCase().includes(q);
        const matchDetails = log.details.toLowerCase().includes(q);
        const matchPatient = log.patientName?.toLowerCase().includes(q);
        return matchUser || matchAction || matchDetails || matchPatient;
      }
      return true;
    });
  }, [logs, selectedCategory, selectedSeverity, searchQuery]);

  // Štatistiky
  const stats = useMemo(() => {
    const total = logs.length;
    const critical = logs.filter(l => l.severity === 'critical').length;
    const warnings = logs.filter(l => l.severity === 'warning').length;
    const docs = logs.filter(l => l.category === 'DOCUMENT').length;
    const auth = logs.filter(l => l.category === 'AUTH').length;
    return { total, critical, warnings, docs, auth };
  }, [logs]);

  // Export CSV
  const handleExportCsv = () => {
    const csvContent = AuditLogService.exportCsv();
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SAY_CLINIC_GDPR_Audit_Log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Zaznamenať export do samotného auditu!
    AuditLogService.log({
      user: currentUser,
      category: 'SECURITY',
      action: 'EXPORT_AUDIT_LOG_CSV',
      details: `Používateľ ${currentUser.name} exportoval kompletný auditný záznam do súboru CSV.`,
      severity: 'warning'
    });

    setExportNotice('Auditný záznam bol stiahnutý vo formáte CSV.');
    setTimeout(() => setExportNotice(null), 4000);
  };

  // Export JSON
  const handleExportJson = () => {
    const jsonContent = AuditLogService.exportJson();
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SAY_CLINIC_GDPR_Audit_Log_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    AuditLogService.log({
      user: currentUser,
      category: 'SECURITY',
      action: 'EXPORT_AUDIT_LOG_JSON',
      details: `Používateľ ${currentUser.name} exportoval auditný denník do súboru JSON.`,
      severity: 'warning'
    });

    setExportNotice('Auditný záznam bol stiahnutý vo formáte JSON.');
    setTimeout(() => setExportNotice(null), 4000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#E8E2D9] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* HLAVIČKA */}
        <div className="px-6 py-5 border-b border-[#E8E2D9] bg-gradient-to-r from-[#FAF8F5] via-white to-[#FAF8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#2C2A29] text-[#C5A059] flex items-center justify-center shadow-md">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#2C2A29]">
                  Bezpečnostná auditná stopa (Audit Log)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider border border-emerald-200">
                  GDPR & HIPAA
                </span>
              </div>
              <p className="text-xs text-[#8C857B] mt-0.5">
                Nemenný denník prístupov k zdravotným záznamom, prihláseniam a bezpečnostným incidentom kliniky
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              title="Stiahnuť pre kontrolu ÚOOU alebo interný audit"
              className="px-3.5 py-2 rounded-xl bg-white border border-[#E8E2D9] hover:border-[#C5A059] text-[#2C2A29] text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Exportovať CSV</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#FAF8F5] rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NOTIFIKÁCIA EXPORTU */}
        {exportNotice && (
          <div className="bg-emerald-500 text-white px-6 py-2.5 text-xs font-medium flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>{exportNotice}</span>
            </div>
            <button onClick={() => setExportNotice(null)} className="text-white/80 hover:text-white">✕</button>
          </div>
        )}

        {/* ŠTATISTICKÁ LIŠTA */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 px-6 py-3.5 bg-[#FBF9F6] border-b border-[#E8E2D9] text-xs">
          <div className="bg-white p-2.5 rounded-xl border border-[#E8E2D9] text-center">
            <p className="text-[10px] text-[#8C857B] uppercase font-bold">Celkovo záznamov</p>
            <p className="text-base font-extrabold text-[#2C2A29] mt-0.5">{stats.total}</p>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-[#E8E2D9] text-center">
            <p className="text-[10px] text-[#8C857B] uppercase font-bold">Autentifikácie</p>
            <p className="text-base font-extrabold text-[#C5A059] mt-0.5">{stats.auth}</p>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-[#E8E2D9] text-center">
            <p className="text-[10px] text-[#8C857B] uppercase font-bold">Dokumenty & PDF</p>
            <p className="text-base font-extrabold text-sky-700 mt-0.5">{stats.docs}</p>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-[#E8E2D9] text-center">
            <p className="text-[10px] text-amber-700 uppercase font-bold">Varovania</p>
            <p className="text-base font-extrabold text-amber-700 mt-0.5">{stats.warnings}</p>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-[#E8E2D9] text-center col-span-2 sm:col-span-1">
            <p className="text-[10px] text-rose-700 uppercase font-bold">Brute-Force blokovania</p>
            <p className="text-base font-extrabold text-rose-700 mt-0.5">{stats.critical}</p>
          </div>
        </div>

        {/* VYHĽADÁVANIE A FILTRE */}
        <div className="p-4 sm:p-5 border-b border-[#E8E2D9] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8C857B] absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Vyhľadať podľa lekára, pacienta, akcie alebo detailu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#E8E2D9] rounded-xl text-xs outline-none focus:border-[#C5A059] bg-[#FAF8F5]/60 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-[#8C857B] hover:text-[#2C2A29]"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {/* Filter kategórií */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="border border-[#E8E2D9] rounded-xl px-3 py-2 text-xs bg-white text-[#2C2A29] outline-none focus:border-[#C5A059]"
            >
              <option value="ALL">Všetky kategórie</option>
              <option value="AUTH">🔑 Autentifikácia & Prihlásenia</option>
              <option value="PATIENT_RECORD">🗂️ Zdravotné karty pacientov</option>
              <option value="DOCUMENT">📄 Operačné protokoly & PDF</option>
              <option value="FINANCE">📊 Financie & P&L</option>
              <option value="AESTHETICS">💉 Botox & Výplne</option>
              <option value="SECURITY">🛡️ Bezpečnosť & Matica oprávnení</option>
            </select>

            {/* Filter závažnosti */}
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value as any)}
              className="border border-[#E8E2D9] rounded-xl px-3 py-2 text-xs bg-white text-[#2C2A29] outline-none focus:border-[#C5A059]"
            >
              <option value="ALL">Všetky úrovne</option>
              <option value="info">ℹ️ Bežná aktivita (Info)</option>
              <option value="warning">⚠️ Upozornenia (Warning)</option>
              <option value="critical">🚨 Závažné incidenty (Critical)</option>
            </select>

            <button
              type="button"
              onClick={refreshLogs}
              title="Obnoviť záznamy"
              className="p-2 border border-[#E8E2D9] rounded-xl text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ZOZNAM LOGOV */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5 bg-[#FAF8F5]/30">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-16 text-[#8C857B] space-y-2">
              <ShieldCheck className="w-12 h-12 mx-auto text-[#C5A059]/50" />
              <p className="text-sm font-semibold text-[#2C2A29]">Žiadne záznamy nezodpovedajú filtru</p>
              <p className="text-xs">Skúste upraviť hľadaný výraz alebo zvolenú kategóriu.</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isCritical = log.severity === 'critical';
              const isWarning = log.severity === 'warning';

              return (
                <div
                  key={log.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all text-xs bg-white ${
                    isCritical 
                      ? 'border-rose-300 bg-rose-50/40 shadow-xs' 
                      : isWarning 
                        ? 'border-amber-300 bg-amber-50/30' 
                        : 'border-[#E8E2D9] hover:border-[#C5A059]/60 shadow-2xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-[#E8E2D9]/60">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                        isCritical 
                          ? 'bg-rose-100 text-rose-800' 
                          : isWarning 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}>
                        {log.severity.toUpperCase()}
                      </span>

                      <span className="font-mono text-[11px] font-bold text-[#2C2A29]">
                        {log.action}
                      </span>

                      <span className="px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E8E2D9] text-[10px] text-[#8C857B] font-semibold">
                        {log.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-[#8C857B]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{log.formattedTime}</span>
                    </div>
                  </div>

                  <div className="pt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-[#2C2A29] leading-relaxed">
                        {log.details}
                      </p>
                      {log.patientName && (
                        <p className="text-[11px] text-[#C5A059] font-medium">
                          👤 Pacient: <strong>{log.patientName}</strong>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-[#5C554F] shrink-0 bg-[#FAF8F5] px-2.5 py-1.5 rounded-xl border border-[#E8E2D9]">
                      <User className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span className="font-semibold text-[#2C2A29]">{log.userName}</span>
                      <span className="text-[#8C857B]">({log.userRole})</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* PÄTIČKA S UPOZORNENÍM O GDPR SÚLADE */}
        <div className="px-6 py-3.5 bg-white border-t border-[#E8E2D9] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#8C857B]">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>GDPR Čl. 30 & 32 • Auditná stopa je automaticky generovaná a uchovávaná pre overenie integrity dát.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportJson}
              className="text-[#C5A059] hover:underline font-semibold cursor-pointer"
            >
              Export JSON
            </button>
            <span>•</span>
            <span className="text-[#2C2A29] font-bold">SAY CLINIC Security</span>
          </div>
        </div>

      </div>
    </div>
  );
}
