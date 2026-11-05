'use client';

import React, { useState, useMemo } from 'react';
import { Calendar, Clock, Check, X, Sparkles, ShieldCheck, ChevronRight, CheckCircle2 } from 'lucide-react';
import { MeicetTreatmentPlanItem } from '@/types/meicet';
import { CalendarEvent } from '@/data/calendarConfig';

interface TreatmentSeriesBookingModalProps {
  isOpen: boolean;
  treatment: MeicetTreatmentPlanItem | null;
  patientName: string;
  patientId: string;
  onClose: () => void;
  onBookEvents: (events: Partial<CalendarEvent>[]) => void;
}

export const TreatmentSeriesBookingModal: React.FC<TreatmentSeriesBookingModalProps> = ({
  isOpen,
  treatment,
  patientName,
  patientId,
  onClose,
  onBookEvents
}) => {
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState<string>('10:00');
  const [includeMaintenance, setIncludeMaintenance] = useState<boolean>(true);

  const protocol = treatment?.protocol;
  const sessionsCount = protocol?.induction?.sessionsCount || treatment?.sessionsCount || 4;
  const intervalDays = protocol?.induction?.intervalDays || (treatment?.intervalWeeks ? treatment.intervalWeeks * 7 : 7);
  const maintenanceMonths = protocol?.maintenance?.intervalMonths || treatment?.maintenanceIntervalMonths || 6;

  // Vypočítať harmonogram termínov
  const scheduledDates = useMemo(() => {
    if (!startDate) return [];
    const list: { sessionIndex: number; label: string; dateStr: string; isMaintenance?: boolean }[] = [];
    
    const base = new Date(startDate);
    if (isNaN(base.getTime())) return [];

    for (let i = 0; i < sessionsCount; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i * intervalDays);
      const iso = d.toISOString().split('T')[0];
      list.push({
        sessionIndex: i + 1,
        label: `Sedenie ${i + 1}/${sessionsCount} (Kúra)`,
        dateStr: iso
      });
    }

    if (includeMaintenance && maintenanceMonths > 0) {
      const maintD = new Date(base);
      maintD.setMonth(base.getMonth() + maintenanceMonths);
      list.push({
        sessionIndex: sessionsCount + 1,
        label: `Udržiavacie ošetrenie (o ${maintenanceMonths} mes.)`,
        dateStr: maintD.toISOString().split('T')[0],
        isMaintenance: true
      });
    }

    return list;
  }, [startDate, sessionsCount, intervalDays, includeMaintenance, maintenanceMonths]);

  if (!isOpen || !treatment) return null;

  const formatSkDate = (isoStr: string) => {
    try {
      const [y, m, d] = isoStr.split('-');
      return `${d}.${m}.${y}`;
    } catch {
      return isoStr;
    }
  };

  const handleBookAllSeries = () => {
    const events: Partial<CalendarEvent>[] = scheduledDates.map(item => ({
      title: `${treatment.name} [${item.label}]`,
      patientName,
      patientId,
      date: item.dateStr,
      startTime,
      endTime: addMinutesToTime(startTime, 45),
      type: 'osetrenie',
      doctorName: 'MUDr. Ján Mráz',
      notes: `Zákrok z plánu pleti: ${treatment.name}.\nCieľ: ${treatment.targetArea}.\nProtokol: ${treatment.frequency || protocol?.summaryDisplay}.\nFáza: ${item.label}.\nPlánovaná investícia: ${treatment.pricePerSession ? `${treatment.pricePerSession} € / sedenie` : `${treatment.estimatedPrice} €`}.`
    }));

    onBookEvents(events);
    onClose();
  };

  const handleBookFirstOnly = () => {
    const fullTimelineText = scheduledDates
      .map(item => `• ${item.label}: ${formatSkDate(item.dateStr)} o ${startTime}`)
      .join('\n');

    const firstEvent: Partial<CalendarEvent> = {
      title: `${treatment.name} [Sedenie 1/${sessionsCount}]`,
      patientName,
      patientId,
      date: startDate,
      startTime,
      endTime: addMinutesToTime(startTime, 45),
      type: 'osetrenie',
      doctorName: 'MUDr. Ján Mráz',
      notes: `Zákrok z plánu pleti: ${treatment.name}.\nCieľ: ${treatment.targetArea}.\nProtokol: ${treatment.frequency || protocol?.summaryDisplay}.\n\n📅 Celkový harmonogram série:\n${fullTimelineText}`
    };

    onBookEvents([firstEvent]);
    onClose();
  };

  function addMinutesToTime(timeStr: string, minutesToAdd: number): string {
    try {
      const [hh, mm] = timeStr.split(':').map(Number);
      const totalMinutes = hh * 60 + mm + minutesToAdd;
      const newH = Math.floor(totalMinutes / 60) % 24;
      const newM = totalMinutes % 60;
      return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
    } catch {
      return '10:45';
    }
  }

  return (
    <div className="fixed inset-0 z-[250] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full border-2 border-[#C5A059] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* HLAVIČKA */}
        <div className="bg-gradient-to-r from-[#2C2A29] via-[#3E3A37] to-[#2C2A29] text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C5A059]/20 border border-[#C5A059]/50 flex items-center justify-center text-[#E8C882]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059] block">
                Plánovanie série do kalendára kliniky
              </span>
              <h3 className="font-serif font-bold text-base text-white truncate max-w-md">
                {treatment.name}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#E8DFC9] hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* TELO */}
        <div className="p-6 space-y-5 text-[#2C2A29] text-xs overflow-y-auto flex-1">
          {/* ZHRNUTIE PROTOKOLU */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">
                Pacient: {patientName} • Oblasť: {treatment.targetArea}
              </span>
              <div className="font-serif font-bold text-sm text-amber-950 mt-0.5">
                {treatment.frequency || protocol?.summaryDisplay || `Kúra: ${sessionsCount}x ➔ Udržiavanie`}
              </div>
            </div>
            {treatment.pricePerSession && (
              <div className="text-right shrink-0">
                <span className="text-xs text-amber-800 font-bold block">{treatment.pricePerSession} € / sedenie</span>
                {treatment.packagePrice && (
                  <span className="text-[10px] text-amber-700/80">Kúra: {treatment.packagePrice} €</span>
                )}
              </div>
            )}
          </div>

          {/* VSTUPNÝ DÁTUM A ČAS */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D9]">
            <div>
              <label className="text-[11px] font-bold text-[#5A524C] block mb-1">
                Dátum 1. sedenia:
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#D4C5B1] bg-white font-medium text-xs text-[#2C2A29] cursor-pointer"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-[#5A524C] block mb-1">
                Čas ošetrenia:
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#D4C5B1] bg-white font-medium text-xs text-[#2C2A29] cursor-pointer"
              />
            </div>
          </div>

          {/* ROZPIS TERMÍNOV SÉRIE */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#2C2A29] text-[11px] uppercase tracking-wider">
                Generovaný časový harmonogram ({scheduledDates.length} termínov):
              </span>
              <label className="flex items-center gap-1.5 text-xs text-[#6B635B] cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeMaintenance}
                  onChange={(e) => setIncludeMaintenance(e.target.checked)}
                  className="rounded text-[#C5A059] focus:ring-[#C5A059]"
                />
                <span>Zahrnúť udržiavanie (o {maintenanceMonths} mes.)</span>
              </label>
            </div>

            <div className="border border-[#E8E2D9] rounded-2xl overflow-hidden divide-y divide-[#E8E2D9] bg-white">
              {scheduledDates.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 flex items-center justify-between text-xs transition-colors ${
                    item.isMaintenance ? 'bg-teal-50/60' : idx === 0 ? 'bg-amber-50/40' : 'hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        item.isMaintenance
                          ? 'bg-teal-600 text-white'
                          : 'bg-[#2C2A29] text-[#E8C882]'
                      }`}
                    >
                      {item.isMaintenance ? '🛡️' : item.sessionIndex}
                    </div>
                    <div>
                      <span className="font-bold text-[#2C2A29] block">
                        {item.label}
                      </span>
                      <span className="text-[10px] text-[#8C837A]">
                        {idx === 0
                          ? 'Vstupné iniciačné sedenie'
                          : item.isMaintenance
                          ? `Dlhodobá konsolidácia výsledku`
                          : `Odstup ${intervalDays} dní po predchádzajúcom sedení`}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-xs text-[#2C2A29] block">
                      {formatSkDate(item.dateStr)}
                    </span>
                    <span className="text-[10px] text-[#8C837A]">
                      {startTime} – {addMinutesToTime(startTime, 45)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PÄTIČKA S MOŽNOSŤAMI OBJEDNANIA */}
        <div className="p-4 bg-[#FAF7F2] border-t border-[#E8E2D9] flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#D4C5B1] bg-white hover:bg-stone-50 font-bold text-xs text-[#5A524C] cursor-pointer transition-colors"
          >
            Zavrieť
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleBookFirstOnly}
              className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl border border-[#C5A059] bg-white hover:bg-[#FAF7F2] text-[#8C6D2D] font-bold text-xs cursor-pointer transition-all"
              title="Objedná len 1. termín a celkový harmonogram série zapíše do poznámky v kalendári"
            >
              Objednať iba 1. sedenie
            </button>

            <button
              type="button"
              onClick={handleBookAllSeries}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#2C2A29] to-[#3E3A37] hover:from-black hover:to-[#2C2A29] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
            >
              <CheckCircle2 className="w-4 h-4 text-[#C5A059]" />
              <span>Objednať celú sériu ({scheduledDates.length} termínov)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
