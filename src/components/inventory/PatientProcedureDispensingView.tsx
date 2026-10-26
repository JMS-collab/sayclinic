'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, 
  Check, 
  Clock, 
  Plus, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Boxes, 
  Trash2, 
  User, 
  Calendar as CalendarIcon, 
  Stethoscope
} from 'lucide-react';
import { 
  InventoryService, 
  InventoryItem, 
  MaterialUsageLog, 
  MaterialBundle,
  FrequentItemRecommendation
} from '../../services/inventoryService';
import { CloudRecordService, CloudMedicalRecord } from '../../services/cloudRecordService';
import { CalendarEvent } from '../../data/calendarConfig';

export interface PatientSummary {
  id: string;
  name: string;
  birthNumber: string;
  phone?: string;
  insurance?: string;
}

export interface UnifiedProcedureItem {
  id: string;
  title: string;
  type: string;
  date: string;
  doctor?: string;
  notes?: string;
  source: 'record' | 'calendar' | 'manual';
}

interface PatientProcedureDispensingViewProps {
  patient?: PatientSummary | null;
  allPatients?: PatientSummary[];
  calendarEvents?: CalendarEvent[];
  onSelectPatient?: (patient: PatientSummary | null) => void;
  isEmbeddedInPatientCard?: boolean;
}

export default function PatientProcedureDispensingView({
  patient: initialPatient,
  allPatients = [],
  calendarEvents: initialCalendarEvents,
  onSelectPatient,
  isEmbeddedInPatientCard = false
}: PatientProcedureDispensingViewProps) {
  // Aktuálne vybraný pacient
  const [selectedPatient, setSelectedPatient] = useState<PatientSummary | null>(initialPatient || null);
  const [patientSearch, setPatientSearch] = useState('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);

  // Skladové dáta a logy
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [usageLogs, setUsageLogs] = useState<MaterialUsageLog[]>([]);
  const [records, setRecords] = useState<CloudMedicalRecord[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  // Rozbalené výkony (akordeón)
  const [expandedProcedureId, setExpandedProcedureId] = useState<string | null>(null);

  // Formulárové stavy pre odpis
  const [performerName, setPerformerName] = useState('Službukonajúca sestra');
  const [customStockItemId, setCustomStockItemId] = useState('');
  const [customStockQty, setCustomStockQty] = useState(1);
  const [customStockLot, setCustomStockLot] = useState('');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    if (initialPatient) {
      setSelectedPatient(initialPatient);
    }
  }, [initialPatient]);

  // Načítanie skladu a logov
  const refreshData = () => {
    setInventory(InventoryService.getInventory());
    if (selectedPatient) {
      const logs = InventoryService.getLogsForPatient(
        selectedPatient.id, 
        selectedPatient.birthNumber, 
        selectedPatient.name
      );
      setUsageLogs(logs);
    } else {
      setUsageLogs([]);
    }
  };

  useEffect(() => {
    refreshData();

    const onInvChange = () => refreshData();
    const onLogChange = () => refreshData();

    window.addEventListener('say_clinic_inventory_changed', onInvChange);
    window.addEventListener('say_clinic_material_usage_logged', onLogChange);

    return () => {
      window.removeEventListener('say_clinic_inventory_changed', onInvChange);
      window.removeEventListener('say_clinic_material_usage_logged', onLogChange);
    };
  }, [selectedPatient]);

  // Načítanie záznamov a kalendára pre vybraného pacienta
  useEffect(() => {
    if (!selectedPatient) {
      setRecords([]);
      setCalendarEvents([]);
      return;
    }

    // 1. Záznamy
    CloudRecordService.getPatientRecordsFromCloud(selectedPatient.id, selectedPatient.birthNumber)
      .then(recs => {
        if (recs && recs.length > 0) {
          setRecords(recs);
        } else {
          setRecords([]);
        }
      })
      .catch(() => setRecords([]));

    // 2. Kalendár
    try {
      let eventsToFilter = initialCalendarEvents;
      if (!eventsToFilter) {
        const rawCal = localStorage.getItem('say_clinic_calendar_events');
        if (rawCal) {
          eventsToFilter = JSON.parse(rawCal);
        }
      }
      if (eventsToFilter && eventsToFilter.length > 0) {
        const filtered = eventsToFilter.filter(evt => 
          (evt.patientId && evt.patientId === selectedPatient.id) ||
          (evt.patientName && selectedPatient.name && (
            evt.patientName.toLowerCase().includes(selectedPatient.name.toLowerCase()) ||
            selectedPatient.name.toLowerCase().includes(evt.patientName.toLowerCase())
          ))
        );
        setCalendarEvents(filtered);
      } else {
        setCalendarEvents([]);
      }
    } catch {
      setCalendarEvents([]);
    }
  }, [selectedPatient, initialCalendarEvents]);

  // Vytvorenie zjednoteného zoznamu výkonov pacienta
  const proceduresList: UnifiedProcedureItem[] = useMemo(() => {
    const list: UnifiedProcedureItem[] = [];

    // Zo zdravotných záznamov
    records.forEach(rec => {
      list.push({
        id: `rec-${rec.id}`,
        title: rec.title || rec.type || 'Lekárske vyšetrenie',
        type: rec.type,
        date: rec.date,
        doctor: rec.doctor,
        notes: rec.diagnosis,
        source: 'record'
      });
    });

    // Z kalendára (ak nie sú duplicitné k rovnakému dňu)
    calendarEvents.forEach(evt => {
      const alreadyHasRecord = list.some(item => 
        item.date === evt.date && 
        (item.title.toLowerCase().includes(evt.title.toLowerCase()) || evt.title.toLowerCase().includes(item.title.toLowerCase()))
      );
      if (!alreadyHasRecord) {
        list.push({
          id: `cal-${evt.id}`,
          title: evt.operationTitle || evt.title || 'Plánovaný operačný výkon',
          type: evt.type === 'operacia' ? 'Operačný protokol' : evt.type === 'kontrola' ? 'Kontrolné vyšetrenie' : 'Klinický výkon',
          date: evt.date,
          doctor: evt.operationDoctor || evt.doctorName || evt.assignedTo,
          notes: evt.notes,
          source: 'calendar'
        });
      }
    });

    // Zoradenie od najnovších po staršie
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Ak pacient nemá zatiaľ žiadny záznam, poskytneme predvolený výkon na odpis
    if (list.length === 0 && selectedPatient) {
      list.push({
        id: `default-${selectedPatient.id}`,
        title: 'Ambulantné ošetrenie a pooperačná kontrola',
        type: 'Kontrolné vyšetrenie',
        date: new Date().toISOString().split('T')[0],
        doctor: 'MUDr. Ján Mráz',
        source: 'manual'
      });
    }

    return list;
  }, [records, calendarEvents, selectedPatient]);

  // Pomocná funkcia: Získanie odpísaných položiek pre daný výkon
  const getLogsForProcedure = (proc: UnifiedProcedureItem) => {
    return usageLogs.filter(log => {
      const pTitle = proc.title.toLowerCase().trim();
      const lTitle = (log.procedureName || '').toLowerCase().trim();
      return lTitle.includes(pTitle) || pTitle.includes(lTitle) || log.date === proc.date;
    });
  };

  // 1-klikové zaevidovanie jednej položky z najčastejších
  const handleQuickAddFrequentItem = (proc: UnifiedProcedureItem, itemRef: FrequentItemRecommendation) => {
    if (!selectedPatient) return;
    const invItem = inventory.find(i => i.id === itemRef.itemId);

    InventoryService.logMaterialUsage({
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      patientBirthNumber: selectedPatient.birthNumber,
      sourceType: proc.type.toLowerCase().includes('opera') ? 'operacia' : 'ambulancia',
      procedureName: proc.title,
      itemId: invItem?.id || itemRef.itemId,
      itemName: invItem?.name || itemRef.name,
      category: invItem?.category || itemRef.category || 'spotrebny',
      quantity: itemRef.defaultQty || 1,
      unit: invItem?.unit || itemRef.unit || 'ks',
      lotNumber: invItem?.lotNumber,
      performerName: performerName || 'Službukonajúca sestra',
      notes: `Rýchly odpis najčastejšej položky pre: ${proc.title}`
    });

    refreshData();
    showToast(`Položka "${itemRef.name}" (${itemRef.defaultQty} ${itemRef.unit}) bola odpísaná.`);
  };

  // 1-klikový odpis celého predpísaného balíka
  const handleApplyBundleForProcedure = (proc: UnifiedProcedureItem, bundle: MaterialBundle) => {
    if (!selectedPatient) return;

    const logged = InventoryService.applyBundle({
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      patientBirthNumber: selectedPatient.birthNumber,
      bundleId: bundle.id,
      performerName: performerName || 'Službukonajúca sestra',
      notes: `Predpísaný balík k výkonu: ${proc.title}`
    });

    refreshData();
    showToast(`Celý balík "${bundle.serviceName}" (${logged.length} položiek) bol úspešne odpísaný.`);
  };

  // Pridanie manuálnej položky zo skladu k výkonu
  const handleAddCustomStockItem = (proc: UnifiedProcedureItem) => {
    if (!selectedPatient || !customStockItemId) return;
    const item = inventory.find(i => i.id === customStockItemId);
    if (!item) return;

    InventoryService.logMaterialUsage({
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      patientBirthNumber: selectedPatient.birthNumber,
      sourceType: proc.type.toLowerCase().includes('opera') ? 'operacia' : 'ambulancia',
      procedureName: proc.title,
      itemId: item.id,
      itemName: item.name,
      category: item.category,
      quantity: Number(customStockQty) || 1,
      unit: item.unit,
      lotNumber: customStockLot || item.lotNumber,
      performerName: performerName || 'Službukonajúca sestra',
      notes: `Manuálne pridaná položka k: ${proc.title}`
    });

    setCustomStockItemId('');
    setCustomStockQty(1);
    setCustomStockLot('');
    refreshData();
    showToast(`Položka "${item.name}" bola odpísaná.`);
  };

  // Filtrovaní pacienti pre vyhľadávač
  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return allPatients.slice(0, 8);
    const q = patientSearch.toLowerCase();
    return allPatients.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.birthNumber.replace(/\D/g, '').includes(q.replace(/\D/g, ''))
    ).slice(0, 10);
  }, [allPatients, patientSearch]);

  return (
    <div className="space-y-5">
      {/* TOAST NOTIFIKÁCIA */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#2C2A29] text-white px-4 py-3 rounded-2xl shadow-2xl border border-[#C5A059]/40 flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="p-1 rounded-full bg-[#C5A059] text-white">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HLAVIČKA A VÝBER PACIENTA (AK NIE JE VLOŽENÉ PRIAMO V KARTE) */}
      {!isEmbeddedInPatientCard ? (
        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#E8E2D9] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FAF7F2] to-[#F3EAD8] border border-[#C5A059]/40 flex items-center justify-center text-sm font-bold text-[#C5A059]">
                  📦
                </span>
                <h3 className="font-brand text-base font-bold text-[#2C2A29] uppercase tracking-wide">
                  Odpis spotreby materiálu na pacienta
                </h3>
              </div>
              <p className="text-xs text-[#8C857B] mt-0.5">
                Prehľad vyšetrení a operácií konkrétneho pacienta s rozkliknutím najčastejších položiek a balíkov
              </p>
            </div>

            {/* ZODPOVEDNÁ SESTRA */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] uppercase font-bold text-[#8C857B] shrink-0">
                Sestra / personál:
              </label>
              <input
                type="text"
                value={performerName}
                onChange={e => setPerformerName(e.target.value)}
                className="border border-[#E8E2D9] px-2.5 py-1.5 rounded-xl text-xs bg-[#FAF8F5] text-[#2C2A29] font-medium outline-none focus:border-[#C5A059]"
              />
            </div>
          </div>

          {/* VYHĽADÁVANIE A VÝBER PACIENTA */}
          <div className="relative">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#8C857B] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Vyhľadajte pacienta podľa mena alebo rodného čísla pre odpis spotreby..."
                  value={patientSearch}
                  onChange={e => {
                    setPatientSearch(e.target.value);
                    setIsPatientDropdownOpen(true);
                  }}
                  onFocus={() => setIsPatientDropdownOpen(true)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E8E2D9] text-xs bg-white focus:border-[#C5A059] outline-none"
                />
              </div>

              {selectedPatient && (
                <div className="flex items-center gap-2 bg-[#FAF7F2] border border-[#C5A059]/40 px-3 py-1.5 rounded-xl shrink-0">
                  <User className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span className="text-xs font-bold text-[#2C2A29]">{selectedPatient.name}</span>
                  <span className="text-[10px] font-mono text-[#8C857B]">({selectedPatient.birthNumber})</span>
                </div>
              )}
            </div>

            {/* Rozbaľovací zoznam pacientov */}
            {isPatientDropdownOpen && allPatients.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E8E2D9] rounded-2xl shadow-xl z-40 max-h-56 overflow-y-auto divide-y divide-[#E8E2D9]">
                {filteredPatients.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedPatient(p);
                      setIsPatientDropdownOpen(false);
                      setPatientSearch('');
                      if (onSelectPatient) onSelectPatient(p);
                    }}
                    className="w-full p-2.5 text-left hover:bg-[#FAF8F5] flex items-center justify-between transition-colors cursor-pointer text-xs"
                  >
                    <div>
                      <strong className="text-[#2C2A29]">{p.name}</strong>
                      <span className="text-[#8C857B] ml-2 font-mono text-[11px]">{p.birthNumber}</span>
                    </div>
                    <span className="text-[10px] text-[#C5A059] font-bold">Vybrať pacienta →</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* VLOŽENÉ DO KARTY PACIENTA: KOMPAKTNÁ LIŠTA */
        <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl p-3.5 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white border border-[#C5A059]/40 text-[#C5A059] flex items-center justify-center font-bold text-sm shadow-2xs">
              📦
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#2C2A29] uppercase tracking-wide">
                Prevádzkový odpis materiálu zo skladu
              </h4>
              <p className="text-[11px] text-[#8C857B]">
                Vyberte vyšetrenie alebo operáciu pre okamžitý odpis najčastejších položiek alebo predpísaného balíka
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#8C857B] font-bold uppercase">Sestra:</span>
            <input
              type="text"
              value={performerName}
              onChange={e => setPerformerName(e.target.value)}
              className="border border-[#E8E2D9] px-2.5 py-1 rounded-lg text-xs bg-white text-[#2C2A29] font-medium outline-none focus:border-[#C5A059]"
            />
          </div>
        </div>
      )}

      {/* AK NIE JE VYBRANÝ PACIENT */}
      {!selectedPatient && (
        <div className="bg-white border border-dashed border-[#E8E2D9] rounded-2xl p-12 text-center space-y-2">
          <p className="text-3xl">👥</p>
          <h4 className="text-sm font-bold text-[#2C2A29]">Vyberte pacienta pre odpis materiálu</h4>
          <p className="text-xs text-[#8C857B] max-w-sm mx-auto">
            Zadajte meno alebo rodné číslo vo vyhľadávači vyššie, aby sa zobrazil zoznam jeho vyšetrení a operácií.
          </p>
        </div>
      )}

      {/* ZOZNAM VÝKONOV A OPERÁCIÍ PACIENTA */}
      {selectedPatient && (
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8C857B]">
              Vyšetrenia & Operácie pacienta ({proceduresList.length}):
            </span>
            <span className="text-[11px] text-[#8C857B]">
              Kliknutím na výkon rozbalíte zoznam najčastejších položiek a balíka
            </span>
          </div>

          {proceduresList.length === 0 ? (
            <div className="bg-white border border-[#E8E2D9] rounded-2xl p-8 text-center text-xs text-[#8C857B]">
              Tento pacient zatiaľ nemá evidované žiadne vyšetrenia ani operácie v systéme.
            </div>
          ) : (
            <div className="space-y-3">
              {proceduresList.map(proc => {
                const procLogs = getLogsForProcedure(proc);
                const isDeducted = procLogs.length > 0;
                const isExpanded = expandedProcedureId === proc.id;
                const frequentItems = InventoryService.getFrequentItemsForProcedure(proc.title);
                const suggestedBundle = InventoryService.suggestBundleForProcedure(proc.title);

                return (
                  <div
                    key={proc.id}
                    className={`bg-white border rounded-2xl transition-all shadow-2xs overflow-hidden ${
                      isExpanded 
                        ? 'border-[#C5A059] ring-1 ring-[#C5A059]/20' 
                        : 'border-[#E8E2D9] hover:border-[#C5A059]/60'
                    }`}
                  >
                    {/* HLAVIČKA KARTY VÝKONU */}
                    <div
                      onClick={() => setExpandedProcedureId(isExpanded ? null : proc.id)}
                      className="p-4 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none bg-gradient-to-r from-white to-[#FDFCFB]"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold ${
                          proc.type.toLowerCase().includes('opera') 
                            ? 'bg-purple-100 text-purple-900 border border-purple-200' 
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                        }`}>
                          {proc.type.toLowerCase().includes('opera') ? '🏥' : '🩺'}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-sm text-[#2C2A29] truncate">
                              {proc.title}
                            </h4>
                            <span className="text-[10px] uppercase font-bold text-[#8C857B] bg-black/5 px-2 py-0.5 rounded">
                              {proc.type}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-[#8C857B] mt-1">
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="w-3 h-3 text-[#C5A059]" />
                              <span>{proc.date}</span>
                            </span>
                            {proc.doctor && (
                              <span className="flex items-center gap-1">
                                <Stethoscope className="w-3 h-3 text-[#8C857B]" />
                                <span>{proc.doctor}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* STAV ODPISU A TLAČIDLO ROZBALENIA */}
                      <div className="flex items-center gap-3">
                        {isDeducted ? (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold shadow-2xs">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Odpísané ({procLogs.length} pol.)</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold shadow-2xs">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Čaká na odpis</span>
                          </div>
                        )}

                        <div className="w-8 h-8 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] flex items-center justify-center text-[#8C857B] transition-transform">
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-[#C5A059]" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>

                    {/* ROZBALENÝ PANEL ODPISU (NAJČASTEJŠIE POLOŽKY + BALÍK) */}
                    {isExpanded && (
                      <div className="border-t border-[#E8E2D9] p-4 sm:p-5 bg-[#FAF8F5] space-y-5 animate-in fade-in duration-150">
                        
                        {/* 1. BALÍK VÝKONU */}
                        {suggestedBundle && (
                          <div className="bg-white border border-[#C5A059]/40 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm">📦</span>
                                <h5 className="font-bold text-xs text-[#2C2A29] uppercase tracking-wide">
                                  Predpísaný balík: {suggestedBundle.serviceName}
                                </h5>
                                <span className="text-[10px] bg-[#C5A059]/15 text-[#C5A059] px-2 py-0.5 rounded-full font-bold">
                                  {suggestedBundle.items.length} položiek
                                </span>
                              </div>
                              <p className="text-[11px] text-[#8C857B] mt-1">
                                {suggestedBundle.description}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleApplyBundleForProcedure(proc, suggestedBundle)}
                              className="px-4 py-2 bg-[#C5A059] hover:bg-[#b08d48] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Aplikovať celý balík</span>
                            </button>
                          </div>
                        )}

                        {/* 2. NAJČASTEJŠIE POUŽÍVANÉ SKLADOVÉ POLOŽKY */}
                        <div className="space-y-2.5">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] uppercase font-bold tracking-wider text-[#8C857B] flex items-center gap-1.5">
                              <span>⚡</span>
                              <span>Najčastejšie používané položky pre tento výkon (1-klikový odpis):</span>
                            </label>
                            <span className="text-[10px] text-[#8C857B]">
                              Kliknutím na čip okamžite odpíšete štandardné množstvo
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                            {frequentItems.map(itemRef => {
                              const stockItem = inventory.find(i => i.id === itemRef.itemId);
                              const isAvailable = stockItem ? stockItem.quantity > 0 : true;

                              return (
                                <button
                                  key={itemRef.itemId}
                                  type="button"
                                  onClick={() => handleQuickAddFrequentItem(proc, itemRef)}
                                  className="p-3 bg-white hover:bg-[#FAF7F2] border border-[#E8E2D9] hover:border-[#C5A059] rounded-xl text-left transition-all shadow-2xs group cursor-pointer flex flex-col justify-between"
                                >
                                  <div>
                                    <div className="flex justify-between items-start gap-1">
                                      <span className="font-bold text-xs text-[#2C2A29] group-hover:text-[#C5A059] transition-colors line-clamp-1">
                                        {itemRef.name}
                                      </span>
                                      <span className="text-[9px] bg-black/5 px-1.5 py-0.5 rounded uppercase font-mono text-[#8C857B]">
                                        {itemRef.category}
                                      </span>
                                    </div>
                                    {itemRef.reason && (
                                      <p className="text-[10px] text-[#8C857B] mt-0.5 italic">
                                        {itemRef.reason}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex justify-between items-center pt-2 mt-2 border-t border-[#F0EBE1] text-[11px]">
                                    <span className="text-[#8C857B]">
                                      Sklad: <strong className={isAvailable ? 'text-emerald-700' : 'text-rose-600'}>
                                        {stockItem ? `${stockItem.quantity} ${stockItem.unit}` : 'K dispozícii'}
                                      </strong>
                                    </span>
                                    <span className="font-bold text-[#C5A059] group-hover:underline">
                                      + {itemRef.defaultQty} {itemRef.unit}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 3. MANUÁLNY VÝBER ĎALŠEJ SKLADOVEJ POLOŽKY */}
                        <div className="bg-white border border-[#E8E2D9] rounded-xl p-3.5 space-y-2">
                          <label className="block text-[10px] uppercase font-bold text-[#8C857B]">
                            + Vybrať inú položku zo skladu k tomuto výkonu:
                          </label>

                          <div className="flex flex-wrap sm:flex-nowrap gap-2">
                            <select
                              value={customStockItemId}
                              onChange={e => setCustomStockItemId(e.target.value)}
                              className="flex-1 border border-[#E8E2D9] p-2 rounded-xl text-xs bg-white focus:border-[#C5A059] outline-none"
                            >
                              <option value="">Vyberte položku materiálu, šitia alebo prádla...</option>
                              {inventory.map(item => (
                                <option key={item.id} value={item.id}>
                                  {item.name} (Zásoba: {item.quantity} {item.unit}) [{item.supplier}]
                                </option>
                              ))}
                            </select>

                            <input
                              type="number"
                              min="1"
                              value={customStockQty}
                              onChange={e => setCustomStockQty(Math.max(1, parseInt(e.target.value) || 1))}
                              placeholder="Množ."
                              className="w-20 border border-[#E8E2D9] p-2 rounded-xl text-xs text-center font-bold bg-white"
                            />

                            <button
                              type="button"
                              disabled={!customStockItemId}
                              onClick={() => handleAddCustomStockItem(proc)}
                              className="px-4 py-2 bg-[#2C2A29] hover:bg-[#C5A059] text-white text-xs font-bold rounded-xl disabled:opacity-40 transition-colors cursor-pointer shrink-0"
                            >
                              + Pridať k výkonu
                            </button>
                          </div>
                        </div>

                        {/* 4. PREHĽAD UŽ ODPÍSANÝCH POLOŽIEK K TOMUTO VÝKONU */}
                        <div className="space-y-2 pt-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-[10px] uppercase font-bold text-[#8C857B]">
                              Zaevidovaný minutý materiál k tomuto výkonu ({procLogs.length}):
                            </span>
                          </div>

                          {procLogs.length === 0 ? (
                            <div className="p-3 bg-white border border-[#E8E2D9] rounded-xl text-center text-xs text-[#8C857B]">
                              K tomuto výkonu zatiaľ nebol odpísaný žiaden materiál. Vyberte položky vyššie.
                            </div>
                          ) : (
                            <div className="border border-[#E8E2D9] rounded-xl divide-y divide-[#E8E2D9] bg-white overflow-hidden shadow-2xs">
                              {procLogs.map(log => (
                                <div key={log.id} className="p-2.5 flex items-center justify-between gap-3 text-xs">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                    <div>
                                      <p className="font-semibold text-[#2C2A29]">{log.itemName}</p>
                                      <p className="text-[10px] text-[#8C857B]">
                                        {log.notes} • Zapísal: <strong className="text-[#2C2A29]">{log.performerName}</strong> ({log.date} {log.time})
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 shrink-0">
                                    <span className="font-bold text-xs bg-[#FAF8F5] px-2.5 py-1 rounded-lg border border-[#E8E2D9]">
                                      {log.quantity} {log.unit}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
