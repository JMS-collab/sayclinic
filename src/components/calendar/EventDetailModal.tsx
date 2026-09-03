'use client';

import React, { useState } from 'react';
import { 
  CalendarEvent, 
  EventType, 
  FreeformCategory, 
  getRoomInfo, 
  FREEFORM_PRESETS,
  getAnesthesiaInfo,
  getClinicStayInfo
} from '@/data/calendarConfig';

interface EventDetailModalProps {
  event: CalendarEvent | null;
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
  onCancelClick?: (event: CalendarEvent) => void;
  onCancelRequest?: (event: CalendarEvent) => void;
  onToggleDepositPaid?: ((event: CalendarEvent) => void) | ((eventId: string, newStatus: boolean) => void);
  onOpenFolder?: (event: CalendarEvent) => void;
  onOpenPatientFolder?: (event: CalendarEvent) => void;
  onSendWhatsApp?: (event: CalendarEvent) => void;
  onSendSMS?: (event: CalendarEvent) => void;
  onToggleEmailPanel?: (event: CalendarEvent) => void;
  openEmailEventId?: string | null;
  setOpenEmailEventId?: (id: string | null) => void;
  emailSubject?: string;
  setEmailSubject?: (val: string) => void;
  emailBody?: string;
  setEmailBody?: (val: string) => void;
  isSendingEmail?: boolean;
  onSendEmailSubmit?: (event: CalendarEvent) => void;
  getEventPhone?: (event: CalendarEvent) => string;
  getEventEmail?: (event: CalendarEvent) => string;
  getEventTypeBadge?: (type: EventType, freeformCategory?: FreeformCategory) => React.ReactNode;
  onPhoneChange?: (eventId: string, phone: string) => void;
  onEmailChange?: (eventId: string, email: string) => void;
  attachAdvanceInvoice?: boolean;
  setAttachAdvanceInvoice?: (val: boolean) => void;
  attachInstructions?: boolean;
  setAttachInstructions?: (val: boolean) => void;
  attachPreOpInstructions?: boolean;
  setAttachPreOpInstructions?: (val: boolean) => void;
}

export default function EventDetailModal({
  event,
  onClose,
  onEdit,
  onCancelClick,
  onCancelRequest,
  onToggleDepositPaid,
  onOpenFolder,
  onOpenPatientFolder,
  onSendWhatsApp,
  onSendSMS,
  onToggleEmailPanel,
  openEmailEventId,
  setOpenEmailEventId,
  emailSubject: propEmailSubject,
  setEmailSubject: propSetEmailSubject,
  emailBody: propEmailBody,
  setEmailBody: propSetEmailBody,
  isSendingEmail = false,
  onSendEmailSubmit,
  getEventPhone,
  getEventEmail,
  getEventTypeBadge,
  onPhoneChange,
  onEmailChange,
  attachAdvanceInvoice = false,
  setAttachAdvanceInvoice,
  attachInstructions = false,
  setAttachInstructions,
  attachPreOpInstructions = false,
  setAttachPreOpInstructions
}: EventDetailModalProps) {
  // Local state fallbacks for email panel
  const [localEmailOpen, setLocalEmailOpen] = useState(false);
  const [localEmailSubject, setLocalEmailSubject] = useState(
    event ? `SAY CLINIC: Informácie k termínu - ${event.title}` : ''
  );
  const [localEmailBody, setLocalEmailBody] = useState(
    event ? `Dobrý deň ${event.patientName || 'klient'},\n\npripomíname Vám Váš termín na SAY CLINIC dňa ${event.date} o ${event.startTime}.\n\nS pozdravom,\nTím SAY CLINIC` : ''
  );

  if (!event) return null;

  const room = getRoomInfo(event.roomId);
  
  const durationMin = (() => {
    if (!event.startTime || !event.endTime) return 60;
    try {
      const [h1, m1] = event.startTime.split(':').map(Number);
      const [h2, m2] = event.endTime.split(':').map(Number);
      const min = (h2 * 60 + m2) - (h1 * 60 + m1);
      return isNaN(min) || min <= 0 ? 60 : min;
    } catch {
      return 60;
    }
  })();

  const formatEventDate = (d?: string) => {
    if (!d) return '';
    try {
      const parsed = new Date(d);
      return isNaN(parsed.getTime()) ? d : parsed.toLocaleDateString('sk-SK', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return d;
    }
  };

  const freeformPreset = FREEFORM_PRESETS.find(p => p.category === event.freeformCategory);

  const renderBadge = () => {
    if (getEventTypeBadge) {
      try {
        return getEventTypeBadge(event.type, event.freeformCategory);
      } catch {
        // fallback
      }
    }
    switch (event.type) {
      case 'operacia': 
        return <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded text-white bg-[#2C2A29]">🔪 Operácia</span>;
      case 'konzultacia': 
        return <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded text-amber-900 bg-amber-100 border border-amber-300">🩺 Konzultácia</span>;
      case 'osetrenie': 
        return <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded text-emerald-900 bg-emerald-100 border border-emerald-300">💉 Ošetrenie</span>;
      case 'kontrola': 
        return <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded text-blue-900 bg-blue-100 border border-blue-300">🔍 Kontrola</span>;
      case 'volno': 
        return <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded text-indigo-900 bg-indigo-100 border border-indigo-300">
          {freeformPreset?.icon || '📌'} {freeformPreset?.label || 'Interné / Voľno'}
        </span>;
      default: 
        return <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded text-gray-800 bg-gray-100">Termín</span>;
    }
  };

  const patientPhone = getEventPhone ? getEventPhone(event) : (event.patientPhone || '');
  const patientEmail = getEventEmail ? getEventEmail(event) : (event.patientEmail || '');

  const isEmailOpen = openEmailEventId !== undefined 
    ? openEmailEventId === event.id 
    : localEmailOpen;

  const toggleEmail = () => {
    if (onToggleEmailPanel) {
      onToggleEmailPanel(event);
    } else if (setOpenEmailEventId) {
      setOpenEmailEventId(openEmailEventId === event.id ? null : event.id);
    } else {
      setLocalEmailOpen(prev => !prev);
    }
  };

  const currentEmailSubject = propEmailSubject !== undefined ? propEmailSubject : localEmailSubject;
  const setEmailSubject = propSetEmailSubject || setLocalEmailSubject;

  const currentEmailBody = propEmailBody !== undefined ? propEmailBody : localEmailBody;
  const setEmailBody = propSetEmailBody || setLocalEmailBody;

  const handleToggleDeposit = () => {
    if (onToggleDepositPaid) {
      // Check if it expects event object or (id, newStatus)
      try {
        (onToggleDepositPaid as (evt: CalendarEvent) => void)(event);
      } catch {
        (onToggleDepositPaid as (id: string, s: boolean) => void)(event.id, !event.isDepositPaid);
      }
    }
  };

  const handleOpenFolderAction = () => {
    if (onOpenPatientFolder) onOpenPatientFolder(event);
    else if (onOpenFolder) onOpenFolder(event);
  };

  const handleCancelAction = () => {
    if (onCancelRequest) onCancelRequest(event);
    else if (onCancelClick) onCancelClick(event);
  };

  return (
    <div className="fixed inset-0 bg-[#2C2A29]/70 flex items-center justify-center z-50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white p-5 sm:p-6 rounded-2xl w-full max-w-xl shadow-2xl border border-[#E8E2D9] my-auto max-h-[92vh] flex flex-col">
        
        {/* HLAVIČKA */}
        <div className="border-b border-[#E8E2D9] pb-3 flex justify-between items-start shrink-0">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              {/* Odznak miestnosti / sály */}
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${room.badgeColor}`}>
                <span>{room.icon}</span>
                <span>{room.name}</span>
              </span>

              {renderBadge()}
              
              {event.isAllDay && (
                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase">
                  ☀️ Celodenná
                </span>
              )}
            </div>

            <h3 className="font-brand text-xl sm:text-2xl font-bold text-[#2C2A29] uppercase leading-tight">
              {event.title || (event.type === 'volno' ? 'Interná udalosť' : 'Termín pacienta')}
            </h3>
          </div>

          <button 
            type="button"
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm transition-colors shrink-0 ml-2 cursor-pointer"
            aria-label="Zatvoriť"
          >
            ✕
          </button>
        </div>

        {/* SCROLLOVATEĽNÝ OBSAH */}
        <div className="overflow-y-auto pr-1 space-y-3.5 my-3 text-xs flex-1">
          
          {/* AK JE ZRUŠENÝ */}
          {event.isCancelled && (
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl">
              <p className="text-rose-700 font-bold uppercase text-xs flex items-center gap-1">
                <span>❌</span> Termín bol Zrušený
              </p>
              <p className="text-rose-800 text-xs mt-1">Dôvod: <strong>{event.cancelReason || 'Neuvedený'}</strong></p>
            </div>
          )}

          {/* ŠPECIFICKÝ POHĽAD: VOĽNÝ POPIS / INTERNÁ UDALOSŤ (OBED, DOVOLENKA, TEAMBUILDING...) */}
          {event.type === 'volno' ? (
            <div className="bg-indigo-50/70 border border-indigo-200 p-4 rounded-xl space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl p-2 bg-white rounded-xl shadow-2xs border border-indigo-200">
                  {freeformPreset?.icon || '📌'}
                </span>
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider">
                    Interná udalosť • {freeformPreset?.label || 'Voľný popis'}
                  </span>
                  <h4 className="font-bold text-base text-indigo-950">{event.title}</h4>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-indigo-200/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-700 block">Dátum a čas</span>
                  <span className="font-semibold text-indigo-950">
                    {formatEventDate(event.date)} • {event.isAllDay ? 'Celý deň' : `${event.startTime} - ${event.endTime} (${durationMin} min)`}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-700 block">Pridelené</span>
                  <span className="font-semibold text-indigo-950">
                    👤 {event.assignedTo || event.doctorName || 'Celý tím kliniky'}
                  </span>
                </div>
              </div>

              {event.notes && (
                <div className="pt-2 border-t border-indigo-200/60">
                  <span className="text-[10px] uppercase font-bold text-indigo-700 block">Popis / Poznámka</span>
                  <p className="text-indigo-900 italic mt-0.5 whitespace-pre-line">{event.notes}</p>
                </div>
              )}
            </div>
          ) : (
            /* ŠTANDARDNÉ MEDICÍNSKE INFORMÁCIE O ZÁKROKU */
            <div className="space-y-3">
              
              {/* Základné info o termíne a pacientovi */}
              <div className="bg-[#FBF9F6] p-3.5 rounded-xl border border-[#E8E2D9] space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#8C857B] block">Pacient</span>
                    <span className="font-bold text-[#2C2A29] text-sm">{event.patientName || 'Bez mena'}</span>
                    
                    {patientPhone ? (
                      <span className="text-[11px] text-[#8C857B] font-mono block">📞 {patientPhone}</span>
                    ) : (
                      onPhoneChange && (
                        <div className="mt-1 flex items-center gap-1">
                          <input 
                            type="text" 
                            placeholder="+421 900 000 000" 
                            className="text-[11px] border border-[#E8E2D9] rounded px-1.5 py-0.5 bg-white font-mono"
                            onBlur={(e) => onPhoneChange(event.id, e.target.value)}
                          />
                        </div>
                      )
                    )}

                    {patientEmail ? (
                      <span className="text-[11px] text-[#8C857B] block">✉️ {patientEmail}</span>
                    ) : (
                      onEmailChange && (
                        <div className="mt-1 flex items-center gap-1">
                          <input 
                            type="email" 
                            placeholder="email@pacient.sk" 
                            className="text-[11px] border border-[#E8E2D9] rounded px-1.5 py-0.5 bg-white"
                            onBlur={(e) => onEmailChange(event.id, e.target.value)}
                          />
                        </div>
                      )
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#8C857B] block">Termín & Čas</span>
                    <span className="font-bold text-[#2C2A29]">
                      {formatEventDate(event.date)}
                    </span>
                    <span className="font-mono text-[#2C2A29] block font-bold text-xs mt-0.5">
                      ⏱️ {event.isAllDay ? 'Celý deň' : `${event.startTime} - ${event.endTime} (${durationMin} min)`}
                    </span>
                    <span className="text-[10px] text-[#8C857B] block mt-0.5">
                      📍 Pracovisko: <strong>{room.name}</strong>
                    </span>
                  </div>
                </div>

                {/* Cena a záloha */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E8E2D9]">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[#2C2A29] text-sm">
                      Cena: {event.totalPrice || 0} €
                    </span>
                    {event.depositAmount ? (
                      <span className="text-[#C5A059] font-bold text-xs">
                        Záloha: {event.depositAmount} €
                      </span>
                    ) : null}
                  </div>

                  {event.depositAmount ? (
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                      event.isDepositPaid ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'
                    }`}>
                      {event.isDepositPaid ? '🟢 Záloha hradená' : '🔴 Záloha nehradená'}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* ŠPECIFICKÉ PRE OPERÁCIU: OPERAČNÝ TÍM, VYBAVENIE, MATERIÁLY */}
              {event.type === 'operacia' && (
                <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#E0D8C8] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E0D8C8] pb-1.5">
                    <h5 className="font-bold uppercase text-[10px] text-[#2C2A29] flex items-center gap-1">
                      <span>🏥</span> Chirurgický protokol & Operačný tím
                    </h5>
                    <span className="text-[9px] font-bold text-[#C5A059] uppercase">Operačný deň</span>
                  </div>

                  {/* Druh anestézie a Pobyt na klinike */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Druh anestézie */}
                    <div className="p-2.5 bg-white rounded-lg border border-[#E0D8C8]">
                      <span className="text-[9px] uppercase font-bold text-[#8C857B] block flex items-center gap-1">
                        <span>💉</span> Druh anestézie
                      </span>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <strong className="text-xs font-bold text-[#2C2A29]">
                          {event.anesthesiaType || 'TIVA'}
                        </strong>
                        {(() => {
                          const info = getAnesthesiaInfo(event.anesthesiaType);
                          return info ? (
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${info.badge}`}>
                              {info.shortLabel}
                            </span>
                          ) : null;
                        })()}
                      </div>
                      <span className="text-[10px] text-[#8C857B] block mt-0.5">
                        {getAnesthesiaInfo(event.anesthesiaType)?.description || 'Operačný anestéziologický protokol'}
                      </span>
                    </div>

                    {/* Pobyt na klinike */}
                    <div className="p-2.5 bg-white rounded-lg border border-[#E0D8C8]">
                      <span className="text-[9px] uppercase font-bold text-[#8C857B] block flex items-center gap-1">
                        <span>{getClinicStayInfo(event.clinicStay)?.icon || '🏥'}</span> Pobyt na klinike
                      </span>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <strong className="text-xs font-bold text-[#2C2A29]">
                          {getClinicStayInfo(event.clinicStay)?.label || event.clinicStay || 'Dospanie na izbe'}
                        </strong>
                        {(() => {
                          const stay = getClinicStayInfo(event.clinicStay);
                          return stay ? (
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${stay.badge}`}>
                              {stay.icon} {stay.shortLabel}
                            </span>
                          ) : null;
                        })()}
                      </div>
                      <span className="text-[10px] text-[#8C857B] block mt-0.5">
                        {getClinicStayInfo(event.clinicStay)?.description || 'Režim pooperačnej starostlivosti'}
                      </span>
                    </div>
                  </div>

                  {/* Tímová matica */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 bg-white rounded-lg border border-[#E0D8C8]">
                      <span className="text-[9px] uppercase font-bold text-[#8C857B] block">🔪 Operatér</span>
                      <strong className="text-[#2C2A29]">{event.operator || event.doctorName || 'MUDr. Ján Mráz'}</strong>
                    </div>

                    <div className="p-2 bg-white rounded-lg border border-[#E0D8C8]">
                      <span className="text-[9px] uppercase font-bold text-[#8C857B] block">💉 Anesteziológ</span>
                      <strong className="text-[#2C2A29]">{event.anesthesiologist || 'Lokálna anestézia'}</strong>
                    </div>

                    <div className="p-2 bg-white rounded-lg border border-[#E0D8C8]">
                      <span className="text-[9px] uppercase font-bold text-[#8C857B] block">🩺 Anest. sestra</span>
                      <span className="text-[#2C2A29] font-medium">{event.anesthesiaNurse || 'Bc. Jana Malá'}</span>
                    </div>

                    <div className="p-2 bg-white rounded-lg border border-[#E0D8C8]">
                      <span className="text-[9px] uppercase font-bold text-[#8C857B] block">🧤 Inštrumentárka</span>
                      <span className="text-[#2C2A29] font-medium">{event.scrubNurse || 'Sabina Lenhartová'}</span>
                    </div>
                  </div>

                  {/* Špeciálne vybavenie */}
                  {event.specialEquipment && event.specialEquipment.length > 0 && (
                    <div className="pt-2 border-t border-[#E0D8C8]">
                      <span className="text-[9px] uppercase font-bold text-[#8C857B] block mb-1">
                        ⚡ Špeciálne vybavenie & Prístroje:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {event.specialEquipment.map(eq => (
                          <span key={eq} className="px-2 py-0.5 bg-[#2C2A29] text-white rounded text-[10px] font-bold">
                            {eq}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Materiály a implantáty */}
                  {((event.materials && event.materials.length > 0) || event.materialNotes) && (
                    <div className="pt-2 border-t border-[#E0D8C8]">
                      <span className="text-[9px] uppercase font-bold text-[#8C857B] block mb-1">
                        🍈 Potrebný materiál & Implantáty:
                      </span>
                      <div className="flex flex-wrap gap-1 mb-1">
                        {event.materials?.map(mat => (
                          <span key={mat} className="px-2 py-0.5 bg-[#C5A059] text-white rounded text-[10px] font-bold">
                            {mat}
                          </span>
                        ))}
                      </div>
                      {event.materialNotes && (
                        <p className="text-[11px] text-[#2C2A29] font-semibold bg-white p-1.5 rounded border border-[#E0D8C8]">
                          📝 Špecifikácia: {event.materialNotes}
                        </p>
                      )}
                    </div>
                  )}

                </div>
              )}

              {/* Poznámky */}
              {event.notes && (
                <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-[9px] uppercase font-bold text-gray-500 block mb-0.5">Poznámka:</span>
                  <p className="text-gray-800 italic">{event.notes}</p>
                </div>
              )}

            </div>
          )}

          {/* AKČNÉ TLAČIDLÁ PRE PACIENTA (WHATSAPP, SMS, EMAIL) - PRE MEDICÍNSKE ZÁKROKY */}
          {event.type !== 'volno' && !event.isCancelled && (
            <div className="space-y-2 pt-1">
              <span className="text-[10px] uppercase font-bold text-[#8C857B] block">Komunikácia s pacientom</span>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  type="button" 
                  onClick={() => onSendWhatsApp && onSendWhatsApp(event)} 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-[10px] font-bold uppercase shadow-2xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>💬</span> WhatsApp
                </button>
                <button 
                  type="button" 
                  onClick={() => onSendSMS && onSendSMS(event)} 
                  className="bg-[#2C2A29] hover:bg-[#C5A059] text-white py-2 rounded-xl text-[10px] font-bold uppercase shadow-2xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>📲</span> SMS správa
                </button>
                <button 
                  type="button" 
                  onClick={toggleEmail} 
                  className="bg-[#C5A059] hover:bg-[#b08d4b] text-white py-2 rounded-xl text-[10px] font-bold uppercase shadow-2xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>✉️</span> E-mail
                </button>
              </div>

              {/* TLAČIDLO OZNAČIŤ ZÁLOHU */}
              {event.depositAmount && event.depositAmount > 0 && onToggleDepositPaid && (
                <button
                  type="button"
                  onClick={handleToggleDeposit}
                  className={`w-full py-2 rounded-xl text-[10px] font-bold uppercase border transition-colors mt-1 cursor-pointer ${
                    event.isDepositPaid 
                      ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100' 
                      : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                  }`}
                >
                  {event.isDepositPaid ? '✕ Zrušiť úhradu zálohy' : '✓ Označiť zálohu ako HRADENÚ'}
                </button>
              )}
            </div>
          )}

          {/* OTVORENÝ EMAILOVÝ PANEL V DETAILE */}
          {isEmailOpen && (
            <div className="bg-[#FBF9F6] border border-[#C5A059] p-3.5 rounded-xl space-y-2.5 text-xs animate-fadeIn">
              <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-1.5">
                <span className="font-bold uppercase text-[#2C2A29] text-[10px]">
                  ✉️ Odoslať e-mail: {event.patientName}
                </span>
                <button 
                  type="button" 
                  onClick={toggleEmail} 
                  className="text-xs font-bold text-[#8C857B] hover:text-[#2C2A29] cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div>
                <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-1">Predmet</label>
                <input 
                  type="text" 
                  value={currentEmailSubject} 
                  onChange={e => setEmailSubject(e.target.value)} 
                  className="w-full border border-[#E8E2D9] p-1.5 rounded-lg bg-white text-xs font-semibold" 
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase font-bold text-[#8C857B] mb-1">Správa pre pacienta</label>
                <textarea 
                  rows={4} 
                  value={currentEmailBody} 
                  onChange={e => setEmailBody(e.target.value)} 
                  className="w-full border border-[#E8E2D9] p-1.5 rounded-lg bg-white text-xs font-mono" 
                />
              </div>

              {/* PRÍLOHY */}
              {(setAttachAdvanceInvoice || setAttachInstructions || setAttachPreOpInstructions) && (
                <div className="flex flex-wrap gap-3 py-1 bg-white p-2 rounded-lg border border-[#E8E2D9]">
                  {setAttachAdvanceInvoice && (
                    <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-[#2C2A29]">
                      <input 
                        type="checkbox" 
                        checked={attachAdvanceInvoice} 
                        onChange={e => setAttachAdvanceInvoice(e.target.checked)} 
                        className="accent-[#C5A059]" 
                      />
                      📄 Zálohová faktúra
                    </label>
                  )}
                  {setAttachInstructions && (
                    <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-[#2C2A29]">
                      <input 
                        type="checkbox" 
                        checked={attachInstructions} 
                        onChange={e => setAttachInstructions(e.target.checked)} 
                        className="accent-[#C5A059]" 
                      />
                      📋 Poučenie
                    </label>
                  )}
                  {setAttachPreOpInstructions && (
                    <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-[#2C2A29]">
                      <input 
                        type="checkbox" 
                        checked={attachPreOpInstructions} 
                        onChange={e => setAttachPreOpInstructions(e.target.checked)} 
                        className="accent-[#C5A059]" 
                      />
                      🩺 Predop. pokyny
                    </label>
                  )}
                </div>
              )}

              <div className="flex justify-end">
                <button 
                  type="button" 
                  disabled={isSendingEmail || !onSendEmailSubmit} 
                  onClick={() => onSendEmailSubmit && onSendEmailSubmit(event)} 
                  className="bg-[#C5A059] hover:bg-[#b08d4b] text-white px-4 py-1.5 rounded-lg font-bold text-[10px] uppercase shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSendingEmail ? 'Odosielam...' : 'Odoslať e-mail'}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* SPODNÁ LIŠTA S TLAČIDLAMI */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#E8E2D9] shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(event)}
              className="bg-white hover:bg-gray-100 text-[#2C2A29] border border-[#E8E2D9] px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>✏️</span> Upraviť
            </button>

            {!event.isCancelled && (onCancelRequest || onCancelClick) && (
              <button
                type="button"
                onClick={handleCancelAction}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-2 rounded-xl text-[10px] font-bold uppercase transition-colors cursor-pointer"
              >
                ✕ Zrušiť termín
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {event.type !== 'volno' && (onOpenPatientFolder || onOpenFolder) && (
              <button
                type="button"
                onClick={handleOpenFolderAction}
                className="bg-[#2C2A29] hover:bg-[#C5A059] text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>📁</span> Karta pacienta
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase text-[#8C857B] hover:text-[#2C2A29] cursor-pointer"
            >
              Zavrieť
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
