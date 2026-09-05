'use client';

import React, { forwardRef } from 'react';
import { AIHealthRoadmap } from '@/data/healthRoadmapTypes';

interface AIHealthRoadmapPdfDocumentProps {
  roadmap: AIHealthRoadmap;
  patient: {
    id: string;
    name: string;
    birthNumber: string;
    dob?: string;
    phone?: string;
    email?: string;
  };
  currentDateStr?: string;
}

const getSeasonLabelWithIcon = (season: 'jar' | 'leto' | 'jesen' | 'zima') => {
  switch (season) {
    case 'jar':
      return { text: 'Jar', icon: '🌸', color: '#047857', bg: '#ECFDF5', border: '#A7F3D0' };
    case 'leto':
      return { text: 'Leto', icon: '☀️', color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' };
    case 'jesen':
      return { text: 'Jeseň', icon: '🍂', color: '#C2410C', bg: '#FFF7ED', border: '#FED7AA' };
    case 'zima':
      return { text: 'Zima', icon: '❄️', color: '#0369A1', bg: '#F0F9FF', border: '#BAE6FD' };
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'injectable':
      return { label: 'Injekčná estetika', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' };
    case 'laser_device':
      return { label: 'Laser & Prístroje', bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA' };
    case 'dermatology_care':
      return { label: 'Dermatologická starostlivosť', bg: '#FAF5FF', color: '#7E22CE', border: '#E9D5FF' };
    case 'surgical_followup':
      return { label: 'Chirurgická kontrola', bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' };
    case 'skincare_routine':
      return { label: 'Domáca starostlivosť', bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' };
    default:
      return { label: 'Klinické ošetrenie', bg: '#F3F4F6', color: '#374151', border: '#E5E7EB' };
  }
};

export const AIHealthRoadmapPdfDocument = forwardRef<HTMLDivElement, AIHealthRoadmapPdfDocumentProps>(
  ({ roadmap, patient, currentDateStr }, ref) => {
    const today = currentDateStr || new Date().toLocaleDateString('sk-SK', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    return (
      <div
        ref={ref}
        id="ai-health-roadmap-pdf-root"
        style={{
          width: '794px', // A4 width at 96 DPI
          backgroundColor: '#ffffff',
          color: '#2C2A29',
          fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          padding: '36px 40px',
          boxSizing: 'border-box',
          lineHeight: '1.45',
          fontSize: '11px',
          margin: '0 auto'
        }}
      >
        {/* ========================================================================= */}
        {/* 1. HLAVIČKA KLINIKY SAY CLINIC (SAY BY MRAZ) */}
        {/* ========================================================================= */}
        <div
          style={{
            borderBottom: '2.5px solid #C5A059',
            paddingBottom: '16px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img
              src="/logo.png"
              alt="SAY BY MRAZ"
              crossOrigin="anonymous"
              style={{
                height: '62px',
                width: 'auto',
                objectFit: 'contain'
              }}
            />
            <div
              style={{
                borderLeft: '1px solid #E8E2D9',
                paddingLeft: '14px',
                fontSize: '9px',
                color: '#8C857B',
                lineHeight: '1.35'
              }}
            >
              <p
                style={{
                  color: '#C5A059',
                  fontWeight: 'bold',
                  letterSpacing: '1.6px',
                  textTransform: 'uppercase',
                  margin: '0 0 3px 0'
                }}
              >
                Plastická chirurgia & Estetická dermatológia
              </p>
              <p style={{ margin: '0' }}>Lazovná 43, 974 01 Banská Bystrica</p>
              <p style={{ margin: '2px 0 0 0', color: '#2C2A29', fontWeight: '600' }}>
                Tel: +421 917 888 777 • E-mail: recepcia@sayclinic.sk • www.sayclinic.sk
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                background: '#2C2A29',
                color: '#ffffff',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '9px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '1.2px',
                display: 'inline-block'
              }}
            >
              AI Plán Liečby & Starostlivosti
            </span>
            <p
              style={{
                margin: '6px 0 0 0',
                fontWeight: 'bold',
                color: '#2C2A29',
                fontSize: '11px'
              }}
            >
              {roadmap.doctorName || 'MUDr. Ján Mráz'}
            </p>
            <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#8C857B' }}>
              Dátum vystavenia: <strong>{today}</strong>
            </p>
            <p style={{ margin: '1px 0 0 0', fontSize: '9px', color: '#C5A059', fontFamily: 'monospace' }}>
              Protokol ID: SAY-PL-{patient.id}-{new Date().getFullYear()}
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. PROFIL PACIENTA & KLINICKÉ ZHODNOTENIE */}
        {/* ========================================================================= */}
        <div
          style={{
            backgroundColor: '#FAF8F5',
            border: '1px solid #E8E2D9',
            borderRadius: '10px',
            padding: '14px 16px',
            marginBottom: '20px'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #E8E2D9',
              paddingBottom: '8px',
              marginBottom: '10px'
            }}
          >
            <span
              style={{
                fontSize: '10px',
                color: '#C5A059',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              Klinický profil pacienta & Vstupné parametre
            </span>
            <span style={{ fontSize: '9px', color: '#8C857B', fontWeight: '600' }}>
              SAY CLINIC Protokol 12M
            </span>
          </div>

          <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', marginBottom: '10px' }}>
            <tbody>
              <tr>
                <td style={{ padding: '3px 0', color: '#8C857B', width: '22%', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Meno pacienta:
                </td>
                <td style={{ padding: '3px 0', fontWeight: 'bold', color: '#2C2A29', width: '38%' }}>
                  {patient.name}
                </td>
                <td style={{ padding: '3px 0', color: '#8C857B', width: '20%', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Fototyp pleti:
                </td>
                <td style={{ padding: '3px 0', fontWeight: 'bold', color: '#C5A059' }}>
                  Fitzpatrick Typ {roadmap.patientAnalysis.fitzpatrickPhototype || 'II'}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '3px 0', color: '#8C857B', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Rodné číslo:
                </td>
                <td style={{ padding: '3px 0', fontWeight: 'bold', color: '#2C2A29', fontFamily: 'monospace' }}>
                  {patient.birthNumber || 'Neuvedené'}
                </td>
                <td style={{ padding: '3px 0', color: '#8C857B', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Analyzované dáta:
                </td>
                <td style={{ padding: '3px 0', fontWeight: '600', color: '#2C2A29' }}>
                  {roadmap.patientAnalysis.analyzedProceduresCount} zákrokov • {roadmap.patientAnalysis.analyzedAestheticSessionsCount} estet. ošetrení
                </td>
              </tr>
            </tbody>
          </table>

          {/* Indikácie / Identifikované ciele */}
          {roadmap.patientAnalysis.identifiedConcerns && roadmap.patientAnalysis.identifiedConcerns.length > 0 && (
            <div style={{ marginTop: '8px', borderTop: '1px dashed #E8E2D9', paddingTop: '8px' }}>
              <span style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', color: '#8C857B', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>
                Primárne ciele a indikované oblasti ošetrenia:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {roadmap.patientAnalysis.identifiedConcerns.map((concern, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '9px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #E8E2D9',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      color: '#2C2A29',
                      fontWeight: '600'
                    }}
                  >
                    • {concern}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Klinické posúdenie lekára */}
          {roadmap.patientAnalysis.clinicalAssessment && (
            <div style={{ marginTop: '8px', borderTop: '1px dashed #E8E2D9', paddingTop: '8px' }}>
              <span style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', color: '#8C857B', letterSpacing: '0.5px', display: 'block', marginBottom: '3px' }}>
                Klinické zhodnotenie lekára:
              </span>
              <p style={{ margin: '0', fontSize: '10px', color: '#2C2A29', lineHeight: '1.45' }}>
                {roadmap.patientAnalysis.clinicalAssessment}
              </p>
            </div>
          )}

          {/* Anamnestické a chirurgické súvislosti */}
          {roadmap.patientAnalysis.pastSurgeriesSummary && (
            <div style={{ marginTop: '6px', backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '6px', padding: '6px 10px' }}>
              <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#0369A1', textTransform: 'uppercase' }}>
                Chirurgické súvislosti:
              </span>
              <span style={{ fontSize: '10px', color: '#0C4A6E', marginLeft: '6px' }}>
                {roadmap.patientAnalysis.pastSurgeriesSummary}
              </span>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 3. 12-MESAČNÝ HARMONOGRAM OŠETRENÍ (MESIAC PO MESIACI) */}
        {/* ========================================================================= */}
        <div style={{ marginBottom: '22px' }}>
          <div
            style={{
              borderBottom: '1.5px solid #C5A059',
              paddingBottom: '6px',
              marginBottom: '14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end'
            }}
          >
            <div>
              <h3
                style={{
                  margin: '0',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  color: '#2C2A29',
                  letterSpacing: '1px'
                }}
              >
                12-Mesačný Harmonogram Ošetrení & Intervencií
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '9px', color: '#8C857B' }}>
                Štruktúrovaná sekvencia výkonov zohľadňujúca sezónnu bezpečnosť, hojenie a bunkovú obnovu
              </p>
            </div>
            <span style={{ fontSize: '9px', color: '#C5A059', fontWeight: 'bold' }}>
              12 Mesiacov / 4 Sezóny
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {roadmap.months.map((month) => {
              const seasonMeta = getSeasonLabelWithIcon(month.season);

              return (
                <div
                  key={month.monthIndex}
                  style={{
                    border: '1px solid #E8E2D9',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    overflow: 'hidden',
                    pageBreakInside: 'avoid'
                  }}
                >
                  {/* Hlavička mesiaca */}
                  <div
                    style={{
                      backgroundColor: '#FBF9F6',
                      borderBottom: '1px solid #E8E2D9',
                      padding: '7px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          backgroundColor: '#2C2A29',
                          color: '#ffffff',
                          fontSize: '9px',
                          fontWeight: 'bold',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          fontFamily: 'monospace'
                        }}
                      >
                        {month.monthIndex}.M
                      </span>
                      <span style={{ fontWeight: 'bold', fontSize: '11px', color: '#2C2A29' }}>
                        {month.name} ({month.calendarMonthName})
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          backgroundColor: seasonMeta.bg,
                          color: seasonMeta.color,
                          border: `1px solid ${seasonMeta.border}`,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          fontSize: '9px',
                          fontWeight: 'bold'
                        }}
                      >
                        {seasonMeta.icon} {seasonMeta.text}
                      </span>
                    </div>
                  </div>

                  {/* Zameranie a cieľ mesiaca */}
                  <div
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#FAFAF9',
                      borderBottom: '1px dashed #E8E2D9',
                      fontSize: '10px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <strong style={{ color: '#C5A059', textTransform: 'uppercase', fontSize: '9px', letterSpacing: '0.5px' }}>
                        Zameranie:
                      </strong>{' '}
                      <span style={{ color: '#2C2A29', fontWeight: '600' }}>{month.focusTheme}</span>
                    </div>
                    {month.clinicalGoal && (
                      <div style={{ color: '#8C857B', fontSize: '9px', fontStyle: 'italic', maxWidth: '50%' }}>
                        Cieľ: {month.clinicalGoal}
                      </div>
                    )}
                  </div>

                  {/* Zoznam intervencií */}
                  <div style={{ padding: '8px 12px' }}>
                    {month.interventions.map((inv, invIdx) => {
                      const typeMeta = getTypeLabel(inv.type);

                      return (
                        <div
                          key={inv.id || invIdx}
                          style={{
                            padding: '6px 0',
                            borderBottom: invIdx < month.interventions.length - 1 ? '1px solid #F0EBE1' : 'none'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span
                                style={{
                                  backgroundColor: typeMeta.bg,
                                  color: typeMeta.color,
                                  border: `1px solid ${typeMeta.border}`,
                                  fontSize: '8px',
                                  fontWeight: 'bold',
                                  padding: '1px 5px',
                                  borderRadius: '3px',
                                  textTransform: 'uppercase'
                                }}
                              >
                                {typeMeta.label}
                              </span>
                              <span style={{ fontWeight: 'bold', fontSize: '11px', color: '#2C2A29' }}>
                                {inv.title}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '9px', color: '#8C857B', backgroundColor: '#F3F4F6', padding: '1px 5px', borderRadius: '3px' }}>
                                Zóna: <strong>{inv.targetArea}</strong>
                              </span>
                              <span
                                style={{
                                  fontSize: '9px',
                                  fontWeight: 'bold',
                                  color: inv.priority === 'vysoká' ? '#B91C1C' : '#C5A059'
                                }}
                              >
                                {inv.intensity} intenzita
                              </span>
                            </div>
                          </div>

                          <p style={{ margin: '0 0 3px 0', fontSize: '10px', color: '#5C554E', lineHeight: '1.4' }}>
                            {inv.description}
                          </p>

                          {inv.clinicalRationale && (
                            <p style={{ margin: '2px 0 0 0', fontSize: '9px', color: '#8C857B', fontStyle: 'italic' }}>
                              <strong style={{ color: '#C5A059' }}>Klinické odôvodnenie:</strong> {inv.clinicalRationale}
                            </p>
                          )}

                          {inv.homeCareProduct && (
                            <p style={{ margin: '2px 0 0 0', fontSize: '9px', color: '#047857' }}>
                              <strong>Odporúčaný produkt SAY CLINIC:</strong> {inv.homeCareProduct}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. PROTOKOL DOMÁCEJ STAROSTLIVOSTI (SKINCARE ROUTINE SAY CLINIC) */}
        {/* ========================================================================= */}
        {roadmap.dailySkincareRoutine && (
          <div
            style={{
              backgroundColor: '#FAF8F5',
              border: '1px solid #E8E2D9',
              borderRadius: '10px',
              padding: '14px 16px',
              marginBottom: '20px',
              pageBreakInside: 'avoid'
            }}
          >
            <div
              style={{
                borderBottom: '1px solid #E8E2D9',
                paddingBottom: '8px',
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <h4
                style={{
                  margin: '0',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  color: '#C5A059',
                  letterSpacing: '1px'
                }}
              >
                Personalizovaný Protokol Domácej Starostlivosti (Skincare Routine)
              </h4>
              <span style={{ fontSize: '9px', color: '#8C857B', fontWeight: 'bold' }}>
                Dermokozmetika SAY CLINIC
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {/* RANNÁ RUTINA */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #E8E2D9', borderRadius: '8px', padding: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid #F0EBE1', paddingBottom: '6px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px' }}>☀️</span>
                  <span style={{ fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase', color: '#B45309' }}>
                    Ranná Rutina (Ochrana & Antioxidanty)
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {roadmap.dailySkincareRoutine.morning?.map((step, idx) => (
                    <div key={idx} style={{ fontSize: '9px', lineHeight: '1.35' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontWeight: 'bold', color: '#2C2A29' }}>
                          {step.step}. {step.category}: {step.productName}
                        </span>
                      </div>
                      <p style={{ margin: '1px 0 0 0', color: '#8C857B', fontSize: '8.5px' }}>
                        Účinné látky: <strong>{step.activeIngredients}</strong> • {step.usageNote}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* VEČERNÁ RUTINA */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #E8E2D9', borderRadius: '8px', padding: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid #F0EBE1', paddingBottom: '6px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px' }}>🌙</span>
                  <span style={{ fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase', color: '#4338CA' }}>
                    Večerná Rutina (Bunková Obnova & Bariéra)
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {roadmap.dailySkincareRoutine.evening?.map((step, idx) => (
                    <div key={idx} style={{ fontSize: '9px', lineHeight: '1.35' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontWeight: 'bold', color: '#2C2A29' }}>
                          {step.step}. {step.category}: {step.productName}
                        </span>
                      </div>
                      <p style={{ margin: '1px 0 0 0', color: '#8C857B', fontSize: '8.5px' }}>
                        Účinné látky: <strong>{step.activeIngredients}</strong> • {step.usageNote}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Týždenné kúry */}
            {roadmap.dailySkincareRoutine.weeklyTreatments && roadmap.dailySkincareRoutine.weeklyTreatments.length > 0 && (
              <div style={{ marginTop: '10px', borderTop: '1px dashed #E8E2D9', paddingTop: '8px', fontSize: '9.5px' }}>
                <strong style={{ color: '#8C857B', textTransform: 'uppercase', fontSize: '9px' }}>
                  Týždenné doplnkové ošetrenia:
                </strong>
                <span style={{ color: '#2C2A29', marginLeft: '6px' }}>
                  {roadmap.dailySkincareRoutine.weeklyTreatments.join(' • ')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. SEZÓNNE PRAVIDLÁ & BEZPEČNOSTNÉ POKYNY */}
        {/* ========================================================================= */}
        {roadmap.seasonalGuidelines && (
          <div
            style={{
              border: '1px solid #E8E2D9',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '20px',
              backgroundColor: '#ffffff',
              pageBreakInside: 'avoid'
            }}
          >
            <div style={{ borderBottom: '1px solid #E8E2D9', paddingBottom: '6px', marginBottom: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#C5A059', letterSpacing: '0.8px' }}>
                Sezónne Zásady Fotoprotekcie & Laserovej Bezpečnosti
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', fontSize: '9px' }}>
              <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '6px', padding: '6px' }}>
                <span style={{ fontWeight: 'bold', color: '#047857', display: 'block', marginBottom: '2px' }}>🌸 Jar</span>
                <p style={{ margin: 0, color: '#064E3B', fontSize: '8.5px', lineHeight: '1.3' }}>
                  {roadmap.seasonalGuidelines.jar}
                </p>
              </div>
              <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '6px', padding: '6px' }}>
                <span style={{ fontWeight: 'bold', color: '#B45309', display: 'block', marginBottom: '2px' }}>☀️ Leto</span>
                <p style={{ margin: 0, color: '#78350F', fontSize: '8.5px', lineHeight: '1.3' }}>
                  {roadmap.seasonalGuidelines.leto}
                </p>
              </div>
              <div style={{ backgroundColor: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '6px', padding: '6px' }}>
                <span style={{ fontWeight: 'bold', color: '#C2410C', display: 'block', marginBottom: '2px' }}>🍂 Jeseň</span>
                <p style={{ margin: 0, color: '#7C2D12', fontSize: '8.5px', lineHeight: '1.3' }}>
                  {roadmap.seasonalGuidelines.jesen}
                </p>
              </div>
              <div style={{ backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '6px', padding: '6px' }}>
                <span style={{ fontWeight: 'bold', color: '#0369A1', display: 'block', marginBottom: '2px' }}>❄️ Zima</span>
                <p style={{ margin: 0, color: '#0C4A6E', fontSize: '8.5px', lineHeight: '1.3' }}>
                  {roadmap.seasonalGuidelines.zima}
                </p>
              </div>
            </div>

            {/* Bezpečnostné upozornenia */}
            {roadmap.safetyPrecautions && roadmap.safetyPrecautions.length > 0 && (
              <div style={{ marginTop: '10px', borderTop: '1px dashed #E8E2D9', paddingTop: '8px' }}>
                <span style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', color: '#8C857B', display: 'block', marginBottom: '4px' }}>
                  Všeobecné medicínske prekaúcie pred a po ošetreniach:
                </span>
                <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '9px', color: '#5C554E', lineHeight: '1.4' }}>
                  {roadmap.safetyPrecautions.map((prec, pIdx) => (
                    <li key={pIdx}>{prec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 6. ZÁVER, PEČIATKA & PODPIS LEKÁRA */}
        {/* ========================================================================= */}
        <div
          style={{
            marginTop: '26px',
            borderTop: '1.5px solid #E8E2D9',
            paddingTop: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            pageBreakInside: 'avoid'
          }}
        >
          <div style={{ maxWidth: '420px', fontSize: '8.5px', color: '#8C857B', lineHeight: '1.4' }}>
            <p style={{ margin: '0 0 3px 0', fontWeight: 'bold', color: '#2C2A29' }}>
              SAY CLINIC • Centrum plastickej chirurgie a estetickej dermatológie
            </p>
            <p style={{ margin: 0 }}>
              Tento liečebný a ošetrujúci plán je personalizovaným medicínskym protokolom vytvoreným s podporou klinickej AI a garantovaným atestovaným lekárom. Presné termíny zákrokov a prípadné úpravy indikácií sa prispôsobujú aktuálnemu stavu tkanív pacienta.
            </p>
            <p style={{ margin: '3px 0 0 0', color: '#C5A059' }}>
              Vytlačené z interného klinického systému SAY CLINIC
            </p>
          </div>

          <div style={{ textAlign: 'center', width: '220px' }}>
            <div style={{ width: '180px', borderBottom: '1px solid #2C2A29', margin: '0 auto 6px auto' }} />
            <p style={{ margin: '0', fontWeight: 'bold', color: '#2C2A29', fontSize: '11px' }}>
              {roadmap.doctorName || 'MUDr. Ján Mráz'}
            </p>
            <p style={{ margin: '2px 0 0 0', fontSize: '9px', color: '#8C857B' }}>
              Atestovaný plastický chirurg & dermatológ
            </p>
            <p style={{ margin: '1px 0 0 0', fontSize: '8.5px', color: '#C5A059', fontStyle: 'italic' }}>
              Pečiatka a podpis lekára
            </p>
          </div>
        </div>
      </div>
    );
  }
);

AIHealthRoadmapPdfDocument.displayName = 'AIHealthRoadmapPdfDocument';
