'use client';

import React, { forwardRef } from 'react';
import { PatientPlan } from '@/data/patientPlanConfig';
import { synthesizeEbmPatientPlan, resolveSelectedProcedures } from '@/services/ebmPlanSynthesizer';

interface PatientPlanPdfDocumentProps {
  plan: PatientPlan;
  patient?: {
    id?: string;
    name?: string;
    birthNumber?: string;
    dob?: string;
    phone?: string;
    email?: string;
    address?: string;
    insurance?: string;
  };
  currentDateStr?: string;
}

export const PatientPlanPdfDocument = forwardRef<HTMLDivElement, PatientPlanPdfDocumentProps>(
  ({ plan, patient, currentDateStr }, ref) => {
    const today = currentDateStr || new Date(plan.createdAt || Date.now()).toLocaleDateString('sk-SK', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const patientName = patient?.name || plan.patientName || 'Pacient';
    const patientBirthNumber = patient?.birthNumber || plan.patientBirthNumber || 'Neuvedené';
    const patientDob = patient?.dob || '';
    const patientInsurance = patient?.insurance || 'Dôvera';
    const patientPhone = patient?.phone || '';
    const patientEmail = patient?.email || '';

    const planTypeLabel = 
      plan.planType === 'annual_aesthetic' ? 'Ročný estetický & anti-aging plán' :
      plan.planType === 'pre_post_op' ? 'Predoperačný a pooperačný liečebný plán' :
      'Komplexný individuálny plán liečby a starostlivosti';

    const totalTreatmentsPrice = plan.annualTreatments?.reduce((sum, t) => sum + (t.estimatedPrice || 0), 0) || 0;
    const totalCosmeticsPrice = (
      (plan.cosmeticsRoutine?.morning?.reduce((sum, c) => sum + (c.price || 0), 0) || 0) +
      (plan.cosmeticsRoutine?.evening?.reduce((sum, c) => sum + (c.price || 0), 0) || 0)
    );

    const ebmRef = synthesizeEbmPatientPlan({
      basePlan: plan,
      patientId: plan.patientId,
      patientName: plan.patientName,
      patientBirthNumber: plan.patientBirthNumber,
      doctorName: plan.doctorName,
      skinType: plan.analysisSummary?.skinType,
      selectedProcedureIds: plan.selectedProceduresList,
      existingTreatments: plan.annualTreatments
    });
    const patientFriendlySummary = plan.patientFriendlySummary || ebmRef.patientFriendlySummary;
    const verifiedGuidelines =
      plan.verifiedGuidelinesUsed && plan.verifiedGuidelinesUsed.length > 0
        ? plan.verifiedGuidelinesUsed
        : ebmRef.verifiedGuidelinesUsed || [];

    return (
      <div
        ref={ref}
        id="printable-patient-plan-doc"
        style={{
          width: '794px', // Presná šírka A4 pri 96 DPI
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
        {/* 1. HLAVIČKA KLINIKY SAY CLINIC */}
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
              alt="SAY CLINIC"
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
              Plán Starostlivosti Pacienta
            </span>
            <p
              style={{
                margin: '6px 0 0 0',
                fontWeight: 'bold',
                color: '#2C2A29',
                fontSize: '11px'
              }}
            >
              {plan.doctorName || 'MUDr. Ján Mráz'}
            </p>
            <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#8C857B' }}>
              Dátum vyhotovenia: <strong>{today}</strong>
            </p>
            <p style={{ margin: '1px 0 0 0', fontSize: '9px', color: '#C5A059', fontFamily: 'monospace' }}>
              Protokol ID: SAY-PL-{plan.patientId}-{new Date().getFullYear()}
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. PROFIL PACIENTA & KLINICKÝ CIEĽ */}
        {/* ========================================================================= */}
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
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #E8E2D9',
              paddingBottom: '8px',
              marginBottom: '10px'
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '10px',
                  color: '#C5A059',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
              >
                Identifikácia pacienta & Klinický protokol
              </span>
              <h2 style={{ margin: '2px 0 0 0', fontSize: '13px', fontWeight: 'bold', color: '#2C2A29' }}>
                {(plan.title || '')
                  .replace(/Komplexný sekvenčný plán:\s*Facelift\s*➔\s*Viečka\s*➔\s*Frakčný Laser\s*\(3-v-1\)/gi, 'Ročný plán pacienta (3-v-1)')
                  .replace(/Facelift\s*➔\s*Viečka\s*➔\s*Frakčný Laser\s*\(3-v-1\)/gi, 'Ročný plán (3-v-1)')
                  .trim() || 'Plán starostlivosti & liečby'}
              </h2>
            </div>
            <span
              style={{
                fontSize: '9px',
                color: '#2C2A29',
                fontWeight: 'bold',
                backgroundColor: '#ffffff',
                border: '1px solid #C5A059',
                padding: '3px 8px',
                borderRadius: '4px'
              }}
            >
              {planTypeLabel}
            </span>
          </div>

          <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', marginBottom: '8px' }}>
            <tbody>
              <tr>
                <td style={{ padding: '3px 0', color: '#8C857B', width: '20%', fontSize: '10px', textTransform: 'uppercase' }}>
                  Meno pacienta:
                </td>
                <td style={{ padding: '3px 0', fontWeight: 'bold', color: '#2C2A29', width: '35%' }}>
                  {patientName} {patientDob ? `(${patientDob})` : ''}
                </td>
                <td style={{ padding: '3px 0', color: '#8C857B', width: '20%', fontSize: '10px', textTransform: 'uppercase' }}>
                  Typ pleti / Fototyp:
                </td>
                <td style={{ padding: '3px 0', fontWeight: 'bold', color: '#C5A059' }}>
                  {plan.analysisSummary?.skinTonePhototype || 'Fitzpatrick II'} • {plan.analysisSummary?.skinType || 'Zmiešaná'}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '3px 0', color: '#8C857B', fontSize: '10px', textTransform: 'uppercase' }}>
                  Rodné číslo:
                </td>
                <td style={{ padding: '3px 0', fontWeight: 'bold', color: '#2C2A29', fontFamily: 'monospace' }}>
                  {patientBirthNumber}
                </td>
                <td style={{ padding: '3px 0', color: '#8C857B', fontSize: '10px', textTransform: 'uppercase' }}>
                  Poisťovňa / Kontakt:
                </td>
                <td style={{ padding: '3px 0', fontWeight: '600', color: '#2C2A29' }}>
                  {patientInsurance} {patientPhone ? `• ${patientPhone}` : ''}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Indikácia & Cieľ liečby */}
          {(() => {
            const isAutoFacelift = plan.diagnosisOrGoal?.toLowerCase().includes('kompletná etapovitá chirurgická a laserová rejuvenácia tváre');
            const cleanDiag = isAutoFacelift ? '' : (plan.diagnosisOrGoal || '').trim();
            if (!cleanDiag) return null;
            return (
              <div style={{ marginTop: '8px', borderTop: '1px dashed #E8E2D9', paddingTop: '8px' }}>
                <span style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', color: '#8C857B', letterSpacing: '0.5px', display: 'block', marginBottom: '3px' }}>
                  Klinická indikácia a stanovený cieľ liečby:
                </span>
                <p style={{ margin: 0, fontSize: '10.5px', color: '#2C2A29', lineHeight: '1.45' }}>
                  {cleanDiag}
                </p>
              </div>
            );
          })()}

          {/* Analyzované zóny a ciele */}
          {plan.analysisSummary?.mainConcerns && plan.analysisSummary.mainConcerns.length > 0 && (
            <div style={{ marginTop: '8px', borderTop: '1px dashed #E8E2D9', paddingTop: '8px' }}>
              <span style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', color: '#8C857B', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>
                Hlavné terapeutické oblasti:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {plan.analysisSummary.mainConcerns.map((concern, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '9px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #E8E2D9',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      color: '#2C2A29',
                      fontWeight: '600'
                    }}
                  >
                    • {concern}
                  </span>
                ))}
                {plan.analysisSummary.vectorZones?.map((zone, idx) => (
                  <span
                    key={`z-${idx}`}
                    style={{
                      fontSize: '9px',
                      backgroundColor: '#F5EFEB',
                      border: '1px solid #C5A059',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      color: '#8C6C26',
                      fontWeight: 'bold'
                    }}
                  >
                    📍 {zone}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Zrozumiteľný sprievodca pre pacienta & Overené medicínske guideliny (EBM) */}
          {patientFriendlySummary && (
            <div
              style={{
                marginTop: '10px',
                backgroundColor: '#ECFDF5',
                border: '1px solid #A7F3D0',
                borderRadius: '8px',
                padding: '10px 12px'
              }}
            >
              <strong
                style={{
                  fontSize: '9px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  color: '#065F46',
                  letterSpacing: '0.5px',
                  display: 'block',
                  marginBottom: '3px'
                }}
              >
                👤 Zrozumiteľný sprievodca plánom pre pacienta (Prečo sú kroky takto zoradené):
              </strong>
              <p style={{ margin: 0, fontSize: '9.5px', color: '#064E3B', lineHeight: '1.45' }}>
                {patientFriendlySummary}
              </p>

              {verifiedGuidelines.length > 0 && (
                <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed #A7F3D0' }}>
                  <span
                    style={{
                      fontSize: '8.5px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      color: '#047857',
                      display: 'block',
                      marginBottom: '3px'
                    }}
                  >
                    🔬 Overené medzinárodné medicínske guideliny a štúdie (Evidence-Based Medicine):
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {verifiedGuidelines.map((g, gIdx) => (
                      <div
                        key={gIdx}
                        style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #D1FAE5',
                          borderRadius: '5px',
                          padding: '4px 7px',
                          fontSize: '8px'
                        }}
                      >
                        <strong style={{ color: '#2C2A29', display: 'block' }}>
                          {g.title} ({g.organization})
                        </strong>
                        <span style={{ color: '#4B5563' }}>{g.summaryForPatient}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 3. DOMÁCA DERMOKOZMETICKÁ STAROSTLIVOSŤ (RANNÁ & VEČERNÁ RUTINA) */}
        {/* ========================================================================= */}
        {plan.cosmeticsRoutine && (
          <div
            style={{
              marginBottom: '22px',
              pageBreakInside: 'avoid'
            }}
          >
            <div
              style={{
                borderBottom: '1.5px solid #C5A059',
                paddingBottom: '6px',
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end'
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '11.5px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    color: '#2C2A29',
                    letterSpacing: '1px'
                  }}
                >
                  1. SAY Skincare (Meicet 3D Diagnostika, Domáca Rutina & Ošetrenia Pleti)
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '9px', color: '#8C857B' }}>
                  Duálna domáca starostlivosť (Základná vs. Prémiová starostlivosť) prepojená s ročným plánom pleti
                </p>
              </div>
              <span style={{ fontSize: '9px', color: '#C5A059', fontWeight: 'bold' }}>
                1. PILIER • SAY SKINCARE
              </span>
            </div>

            {plan.meicetMetrics && (
              <div
                style={{
                  backgroundColor: '#FAF8F5',
                  border: '1px solid #C5A059',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  marginBottom: '12px',
                  fontSize: '9px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <strong style={{ color: '#2C2A29', textTransform: 'uppercase' }}>
                    🔬 Meicet Pro-A 3D Spektrálna Diagnostika Pleti (Skóre: {plan.meicetMetrics.skinScoreOverall}/100 • Vek pleti: {plan.meicetMetrics.skinAge} r.)
                  </strong>
                  <span style={{ color: '#8C857B' }}>Fototyp: Fitzpatrick {plan.meicetMetrics.fitzpatrickPhototype}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', color: '#5C554E' }}>
                  <div>Hydratácia: <strong>{plan.meicetMetrics.hydration?.score ?? 65}%</strong></div>
                  <div>Póry: <strong>{plan.meicetMetrics.pores?.score ?? 68}%</strong></div>
                  <div>Vrásky: <strong>{plan.meicetMetrics.wrinkles?.score ?? 70}%</strong></div>
                  <div>Textúra: <strong>{plan.meicetMetrics.texture?.score ?? 75}%</strong></div>
                  <div>UV poškodenie: <strong>{plan.meicetMetrics.uvDamage?.score ?? 64}%</strong></div>
                  <div>Pigmentácie: <strong>{plan.meicetMetrics.brownSpots?.score ?? 69}%</strong></div>
                  <div>Cievky/Erytém: <strong>{plan.meicetMetrics.redAreas?.score ?? 66}%</strong></div>
                  <div>Maz/Porfyríny: <strong>{plan.meicetMetrics.sebumAndPorphyrins?.score ?? 72}%</strong></div>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {/* RANNÁ RUTINA */}
              <div
                style={{
                  border: '1px solid #E8E2D9',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    backgroundColor: '#FEF9F0',
                    borderBottom: '1px solid #F6E2BC',
                    padding: '8px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '13px' }}>☀️</span>
                    <strong style={{ fontSize: '10px', textTransform: 'uppercase', color: '#92400E' }}>
                      Ranná Rutina (Ochrana & Antioxidanty)
                    </strong>
                  </div>
                  <span style={{ fontSize: '8.5px', fontWeight: 'bold', color: '#B45309', backgroundColor: '#FDE68A', padding: '1px 6px', borderRadius: '3px' }}>
                    {plan.cosmeticsRoutine.morning?.length || 0} kroky
                  </span>
                </div>

                <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {plan.cosmeticsRoutine.morning?.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        paddingBottom: idx < plan.cosmeticsRoutine.morning.length - 1 ? '8px' : '0',
                        borderBottom: idx < plan.cosmeticsRoutine.morning.length - 1 ? '1px dashed #E8E2D9' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              backgroundColor: '#2C2A29',
                              color: '#C5A059',
                              fontSize: '8px',
                              fontWeight: 'bold',
                              width: '15px',
                              height: '15px',
                              borderRadius: '50%',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {item.step}
                          </span>
                          <span style={{ fontSize: '8.5px', fontWeight: 'bold', color: '#C5A059', textTransform: 'uppercase' }}>
                            {item.category}
                          </span>
                        </div>
                        {item.price && (
                          <span style={{ fontSize: '9px', fontWeight: 'bold', fontFamily: 'monospace', color: '#2C2A29' }}>
                            {item.price.toFixed(2)} €
                          </span>
                        )}
                      </div>

                      {item.standardOption && item.premiumOption ? (
                        <div style={{ marginLeft: '21px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F0F9FF', padding: '3px 6px', borderRadius: '4px', border: '1px solid #BAE6FD' }}>
                            <div style={{ fontSize: '9px', color: '#0369A1' }}>
                              <strong style={{ textTransform: 'uppercase', fontSize: '8px' }}>Základná starostlivosť</strong>
                              {item.standardOption.brand ? <span style={{ fontWeight: 'bold', color: '#0C4A6E' }}> [{item.standardOption.brand}]</span> : null}: {item.standardOption.productName}
                            </div>
                            <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#0C4A6E', fontFamily: 'monospace' }}>
                              {item.standardOption.price.toFixed(2)} €
                            </div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFBEB', padding: '3px 6px', borderRadius: '4px', border: '1px solid #FDE68A' }}>
                            <div style={{ fontSize: '9px', color: '#B45309' }}>
                              <strong style={{ textTransform: 'uppercase', fontSize: '8px' }}>Prémiová starostlivosť</strong>
                              {item.premiumOption.brand ? <span style={{ fontWeight: 'bold', color: '#78350F' }}> [{item.premiumOption.brand}]</span> : null}: {item.premiumOption.productName}
                            </div>
                            <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#78350F', fontFamily: 'monospace' }}>
                              {item.premiumOption.price.toFixed(2)} €
                            </div>
                          </div>
                          <div style={{ fontSize: '8.5px', color: '#5C554E', margin: '1px 0 0 0', lineHeight: '1.3' }}>
                            <strong>Aplikácia:</strong> {item.standardOption.usage || item.usage}
                          </div>
                        </div>
                      ) : (
                        <>
                          <div style={{ fontWeight: 'bold', fontSize: '10.5px', color: '#2C2A29', marginLeft: '21px' }}>
                            {item.productName} {item.brand ? `(${item.brand})` : ''}
                          </div>

                          <div style={{ fontSize: '9px', color: '#5C554E', margin: '2px 0 0 21px', lineHeight: '1.35' }}>
                            <strong>Aplikácia:</strong> {item.usage}
                          </div>

                          <div style={{ fontSize: '8.5px', color: '#78716C', fontStyle: 'italic', margin: '2px 0 0 21px' }}>
                            💡 <strong>Účel:</strong> {item.purpose}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* VEČERNÁ RUTINA */}
              <div
                style={{
                  border: '1px solid #E8E2D9',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    backgroundColor: '#F5F3FF',
                    borderBottom: '1px solid #DDD6FE',
                    padding: '8px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '13px' }}>🌙</span>
                    <strong style={{ fontSize: '10px', textTransform: 'uppercase', color: '#4C1D95' }}>
                      Večerná Rutina (Bunková Obnova & Regenerácia)
                    </strong>
                  </div>
                  <span style={{ fontSize: '8.5px', fontWeight: 'bold', color: '#6D28D9', backgroundColor: '#E9D5FF', padding: '1px 6px', borderRadius: '3px' }}>
                    {plan.cosmeticsRoutine.evening?.length || 0} kroky
                  </span>
                </div>

                <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {plan.cosmeticsRoutine.evening?.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        paddingBottom: idx < plan.cosmeticsRoutine.evening.length - 1 ? '8px' : '0',
                        borderBottom: idx < plan.cosmeticsRoutine.evening.length - 1 ? '1px dashed #E8E2D9' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              backgroundColor: '#2C2A29',
                              color: '#A78BFA',
                              fontSize: '8px',
                              fontWeight: 'bold',
                              width: '15px',
                              height: '15px',
                              borderRadius: '50%',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {item.step}
                          </span>
                          <span style={{ fontSize: '8.5px', fontWeight: 'bold', color: '#6D28D9', textTransform: 'uppercase' }}>
                            {item.category}
                          </span>
                        </div>
                        {item.price && (
                          <span style={{ fontSize: '9px', fontWeight: 'bold', fontFamily: 'monospace', color: '#2C2A29' }}>
                            {item.price.toFixed(2)} €
                          </span>
                        )}
                      </div>

                      {item.standardOption && item.premiumOption ? (
                        <div style={{ marginLeft: '21px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F0F9FF', padding: '3px 6px', borderRadius: '4px', border: '1px solid #BAE6FD' }}>
                            <div style={{ fontSize: '9px', color: '#0369A1' }}>
                              <strong style={{ textTransform: 'uppercase', fontSize: '8px' }}>Základná starostlivosť</strong>
                              {item.standardOption.brand ? <span style={{ fontWeight: 'bold', color: '#0C4A6E' }}> [{item.standardOption.brand}]</span> : null}: {item.standardOption.productName}
                            </div>
                            <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#0C4A6E', fontFamily: 'monospace' }}>
                              {item.standardOption.price.toFixed(2)} €
                            </div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFBEB', padding: '3px 6px', borderRadius: '4px', border: '1px solid #FDE68A' }}>
                            <div style={{ fontSize: '9px', color: '#B45309' }}>
                              <strong style={{ textTransform: 'uppercase', fontSize: '8px' }}>Prémiová starostlivosť</strong>
                              {item.premiumOption.brand ? <span style={{ fontWeight: 'bold', color: '#78350F' }}> [{item.premiumOption.brand}]</span> : null}: {item.premiumOption.productName}
                            </div>
                            <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#78350F', fontFamily: 'monospace' }}>
                              {item.premiumOption.price.toFixed(2)} €
                            </div>
                          </div>
                          <div style={{ fontSize: '8.5px', color: '#5C554E', margin: '1px 0 0 0', lineHeight: '1.3' }}>
                            <strong>Aplikácia:</strong> {item.standardOption.usage || item.usage}
                          </div>
                        </div>
                      ) : (
                        <>
                          <div style={{ fontWeight: 'bold', fontSize: '10.5px', color: '#2C2A29', marginLeft: '21px' }}>
                            {item.productName} {item.brand ? `(${item.brand})` : ''}
                          </div>

                          <div style={{ fontSize: '9px', color: '#5C554E', margin: '2px 0 0 21px', lineHeight: '1.35' }}>
                            <strong>Aplikácia:</strong> {item.usage}
                          </div>

                          <div style={{ fontSize: '8.5px', color: '#78716C', fontStyle: 'italic', margin: '2px 0 0 21px' }}>
                            💡 <strong>Účel:</strong> {item.purpose}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Špeciálna týždenná starostlivosť */}
            {plan.cosmeticsRoutine.specialWeeklyCare && plan.cosmeticsRoutine.specialWeeklyCare.length > 0 && (
              <div
                style={{
                  marginTop: '10px',
                  backgroundColor: '#FAF8F5',
                  border: '1px solid #E8E2D9',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '9.5px'
                }}
              >
                <strong style={{ color: '#C5A059', textTransform: 'uppercase', fontSize: '9px', letterSpacing: '0.5px' }}>
                  Doplnková týždenná & nutričná starostlivosť:
                </strong>
                <ul style={{ margin: '4px 0 0 0', paddingLeft: '14px', color: '#5C554E', lineHeight: '1.4' }}>
                  {plan.cosmeticsRoutine.specialWeeklyCare.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. ROČNÝ HARMONOGRAM PROCEDÚR NA 12 MESIACOV */}
        {/* ========================================================================= */}
        {plan.annualTreatments && plan.annualTreatments.length > 0 && (
          <div
            style={{
              marginBottom: '22px',
              pageBreakInside: 'avoid'
            }}
          >
            <div
              style={{
                borderBottom: '1.5px solid #C5A059',
                paddingBottom: '6px',
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end'
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '11.5px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    color: '#2C2A29',
                    letterSpacing: '1px'
                  }}
                >
                  2. Ročný Plán (Sekvencia operačných výkonov, laserov & ošetrení)
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '9px', color: '#8C857B' }}>
                  Individuálne zostavená postupnosť zákrokov s rešpektovaním hojenia a sezónnosti
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '9.5px', fontWeight: 'bold', color: '#2C2A29' }}>
                  Odhadovaný rozpočet procedúr: <strong style={{ color: '#C5A059' }}>{totalTreatmentsPrice.toFixed(0)} €</strong>
                </span>
              </div>
            </div>

            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '10px',
                border: '1px solid #E8E2D9'
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#FAF8F5', color: '#8C857B', textTransform: 'uppercase', fontSize: '8.5px' }}>
                  <th style={{ padding: '6px 8px', border: '1px solid #E8E2D9', textAlign: 'left', width: '15%' }}>Obdobie</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #E8E2D9', textAlign: 'left', width: '22%' }}>Kategória</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #E8E2D9', textAlign: 'left', width: '38%' }}>Procedúra & Terapeutický cieľ</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #E8E2D9', textAlign: 'left', width: '15%' }}>Rozsah / Zóna</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #E8E2D9', textAlign: 'right', width: '10%' }}>Cena</th>
                </tr>
              </thead>
              <tbody>
                {plan.annualTreatments.map((t, idx) => {
                  const categoryBadgeColor = 
                    t.category === 'laser' ? { bg: '#F3E8FF', text: '#6B21A8', border: '#D8B4FE', label: 'Laser & Prístroje' } :
                    t.category === 'injectable' ? { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD', label: 'Injekčná aplikácia' } :
                    t.category === 'surgery' ? { bg: '#FFE4E6', text: '#BE123C', border: '#FECDD3', label: 'Chirurgický zákrok' } :
                    t.category === 'scar_care' ? { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A', label: 'Terapia jaziev' } :
                    { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0', label: 'Pleťová terapia' };

                  return (
                    <tr
                      key={t.id || idx}
                      style={{
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#FCFBF9'
                      }}
                    >
                      {/* Obdobie */}
                      <td style={{ padding: '6px 8px', border: '1px solid #E8E2D9', verticalAlign: 'top', fontWeight: 'bold', color: '#2C2A29' }}>
                        📅 {t.seasonOrMonth}
                      </td>

                      {/* Kategória */}
                      <td style={{ padding: '6px 8px', border: '1px solid #E8E2D9', verticalAlign: 'top' }}>
                        <span
                          style={{
                            backgroundColor: categoryBadgeColor.bg,
                            color: categoryBadgeColor.text,
                            border: `1px solid ${categoryBadgeColor.border}`,
                            padding: '1.5px 5px',
                            borderRadius: '3px',
                            fontSize: '8px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase'
                          }}
                        >
                          {categoryBadgeColor.label}
                        </span>
                        {t.priority === 'high' && (
                          <span style={{ display: 'block', fontSize: '8px', color: '#BE123C', fontWeight: 'bold', marginTop: '2px' }}>
                            ★ Kľúčový zákrok
                          </span>
                        )}
                      </td>

                      {/* Procedúra a poznámky */}
                      <td style={{ padding: '6px 8px', border: '1px solid #E8E2D9', verticalAlign: 'top' }}>
                        {(() => {
                          const matchedEbm = resolveSelectedProcedures(undefined, [t], t.name)[0];
                          const explanation = t.patientExplanation || matchedEbm?.patientExplanation;
                          const guideline = t.clinicalGuideline || matchedEbm?.clinicalGuideline;
                          const recovery = t.recoveryTime || matchedEbm?.recoveryTimePatient;
                          return (
                            <>
                              <strong style={{ fontSize: '10.5px', color: '#2C2A29', display: 'block' }}>
                                {t.name}
                              </strong>
                              {t.notes && (
                                <span style={{ fontSize: '9px', color: '#6B6357', fontStyle: 'italic', display: 'block', marginTop: '2px' }}>
                                  🩺 {t.notes}
                                </span>
                              )}
                              {explanation && (
                                <div style={{ fontSize: '8.5px', color: '#065F46', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '4px', padding: '3px 6px', marginTop: '4px', lineHeight: '1.35' }}>
                                  <strong>👤 Pre pacienta:</strong> {explanation}
                                </div>
                              )}
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '3px', fontSize: '8px', color: '#78716C' }}>
                                {recovery && (
                                  <span>⏱️ <strong>Rekonvalescencia:</strong> {recovery}</span>
                                )}
                                {guideline && (
                                  <span>🔬 <strong>EBM:</strong> {guideline}</span>
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </td>

                      {/* Rozsah / Zóna */}
                      <td style={{ padding: '6px 8px', border: '1px solid #E8E2D9', verticalAlign: 'top', fontSize: '9.5px', color: '#5C554E' }}>
                        <div><strong>Zóna:</strong> {t.targetArea}</div>
                        <div><strong>Frekvencia:</strong> {t.frequencyOrSessions}</div>
                      </td>

                      {/* Cena */}
                      <td style={{ padding: '6px 8px', border: '1px solid #E8E2D9', verticalAlign: 'top', textAlign: 'right', fontWeight: 'bold', fontFamily: 'monospace', color: '#2C2A29' }}>
                        {t.estimatedPrice ? `${t.estimatedPrice} €` : 'V cene'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. PREDOPERAČNÁ PRÍPRAVA PACIENTA (AK JE SÚČASŤOU) */}
        {/* ========================================================================= */}
        {plan.preOpCare && (
          <div
            style={{
              marginBottom: '22px',
              pageBreakInside: 'avoid'
            }}
          >
            <div
              style={{
                borderBottom: '1.5px solid #C5A059',
                paddingBottom: '6px',
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end'
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '11.5px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    color: '#2C2A29',
                    letterSpacing: '1px'
                  }}
                >
                  3. SAY Care – Predoperačný protokol & Prehabilitácia ({plan.preOpCare.procedureName})
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '9px', color: '#8C857B' }}>
                  4 piliere predoperačnej prípravy (Medicínska prehabilitácia, Psychologická, Nutričná a Fyzická príprava)
                </p>
              </div>
              <span style={{ fontSize: '9px', color: '#B45309', fontWeight: 'bold', backgroundColor: '#FEF3C7', padding: '2px 8px', borderRadius: '4px' }}>
                3. PILIER • SAY CARE PRE-OP
              </span>
            </div>

            {plan.preOpCare.prehabilitation && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px', fontSize: '8.5px' }}>
                <div style={{ backgroundColor: '#FAF8F5', border: '1px solid #E8E2D9', borderRadius: '6px', padding: '6px 8px' }}>
                  <strong style={{ color: '#2C2A29', display: 'block', marginBottom: '3px' }}>🩺 1. Medicínska prehabilitácia (Bezpečnosť):</strong>
                  <ul style={{ margin: 0, paddingLeft: '12px', color: '#5C554E', lineHeight: '1.4' }}>
                    {plan.preOpCare.prehabilitation.medicalPrehab.map((item, i) => (
                      <li key={i} style={{ marginBottom: '2px' }}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div style={{ backgroundColor: '#FAF8F5', border: '1px solid #E8E2D9', borderRadius: '6px', padding: '6px 8px' }}>
                  <strong style={{ color: '#2C2A29', display: 'block', marginBottom: '3px' }}>🧠 2. Psychologická príprava (Stres & Odolnosť):</strong>
                  <ul style={{ margin: 0, paddingLeft: '12px', color: '#5C554E', lineHeight: '1.4' }}>
                    {plan.preOpCare.prehabilitation.psychologicalPrep.map((item, i) => (
                      <li key={i} style={{ marginBottom: '2px' }}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div style={{ backgroundColor: '#FAF8F5', border: '1px solid #E8E2D9', borderRadius: '6px', padding: '6px 8px' }}>
                  <strong style={{ color: '#2C2A29', display: 'block', marginBottom: '3px' }}>🥗 3. Nutričná príprava (Bielkoviny & Hojenie):</strong>
                  <ul style={{ margin: 0, paddingLeft: '12px', color: '#5C554E', lineHeight: '1.4' }}>
                    {plan.preOpCare.prehabilitation.nutritionalPrep.map((item, i) => (
                      <li key={i} style={{ marginBottom: '2px' }}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div style={{ backgroundColor: '#FAF8F5', border: '1px solid #E8E2D9', borderRadius: '6px', padding: '6px 8px' }}>
                  <strong style={{ color: '#2C2A29', display: 'block', marginBottom: '3px' }}>🏃‍♀️ 4. Fyzická príprava (Silový tréning veľkých svalov):</strong>
                  <ul style={{ margin: 0, paddingLeft: '12px', color: '#5C554E', lineHeight: '1.4' }}>
                    {plan.preOpCare.prehabilitation.physicalPrep.map((item, i) => (
                      <li key={i} style={{ marginBottom: '2px' }}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {plan.preOpCare.instructions.map((ins) => (
                <div
                  key={ins.id}
                  style={{
                    border: '1px solid #E8E2D9',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    backgroundColor: ins.mandatory ? '#FEF9F0' : '#ffffff'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          backgroundColor: '#2C2A29',
                          color: '#ffffff',
                          fontSize: '8px',
                          fontWeight: 'bold',
                          padding: '1.5px 6px',
                          borderRadius: '3px',
                          fontFamily: 'monospace'
                        }}
                      >
                        {ins.timeframe}
                      </span>
                      <strong style={{ fontSize: '10.5px', color: '#2C2A29' }}>
                        {ins.title}
                      </strong>
                    </div>
                    {ins.mandatory && (
                      <span style={{ fontSize: '8px', fontWeight: 'bold', color: '#B91C1C', textTransform: 'uppercase', backgroundColor: '#FEE2E2', padding: '1px 5px', borderRadius: '3px' }}>
                        Povinné
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '2px 0 0 0', fontSize: '9.5px', color: '#5C554E', lineHeight: '1.4' }}>
                    {ins.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 6. POOPERAČNÁ REKONVALESCENCIA & SAY CLINIC PROTOKOL STAROSTLIVOSTI O JAZVY */}
        {/* ========================================================================= */}
        {plan.postOpCare && (
          <div
            style={{
              marginBottom: '22px',
              pageBreakInside: 'avoid'
            }}
          >
            <div
              style={{
                borderBottom: '1.5px solid #C5A059',
                paddingBottom: '6px',
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end'
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '11.5px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    color: '#2C2A29',
                    letterSpacing: '1px'
                  }}
                >
                  4. SAY Care – Pooperačný protokol (Jazvy, Lymfodrenáž, Laser & Rekonvalescencia)
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '9px', color: '#8C857B' }}>
                  Fázový harmonogram zotavenia tkanív, lymfodrenáž, tlakové masáže, silikónová liečba a laserová korekcia
                </p>
              </div>
              <span style={{ fontSize: '9px', color: '#C5A059', fontWeight: 'bold' }}>
                3. PILIER • SAY CARE POST-OP
              </span>
            </div>

            {/* Zvýraznený protokol starostlivosti o jazvy */}
            {plan.postOpCare.scarProtocol && (
              <div
                style={{
                  backgroundColor: '#FAF8F5',
                  border: '1.5px solid #C5A059',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  marginBottom: '12px'
                }}
              >
                <strong style={{ fontSize: '10px', textTransform: 'uppercase', color: '#2C2A29', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>
                  🩹 4 Piliere pooperačného SAY Care protokolu (Jazvy, Lymfodrenáž & Laser):
                </strong>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #E8E2D9', borderRadius: '6px', padding: '8px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#C5A059', display: 'block', marginBottom: '2px' }}>
                      1. Silikónový gél / náplasti (Jazvy)
                    </span>
                    <p style={{ margin: 0, fontSize: '8.5px', color: '#5C554E', lineHeight: '1.35' }}>
                      {plan.postOpCare.scarProtocol.siliconeApplication}
                    </p>
                  </div>

                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #E8E2D9', borderRadius: '6px', padding: '8px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#0369A1', display: 'block', marginBottom: '2px' }}>
                      2. Tlakové masáže jaziev
                    </span>
                    <p style={{ margin: 0, fontSize: '8.5px', color: '#5C554E', lineHeight: '1.35' }}>
                      {plan.postOpCare.scarProtocol.pressureMassage}
                    </p>
                  </div>

                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #E8E2D9', borderRadius: '6px', padding: '8px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#047857', display: 'block', marginBottom: '2px' }}>
                      3. Lymfodrenáž & Kompresívny režim
                    </span>
                    <p style={{ margin: 0, fontSize: '8.5px', color: '#5C554E', lineHeight: '1.35' }}>
                      {plan.postOpCare.scarProtocol.lymphaticDrainage || 'Manuálna a prístrojová lymfodrenáž od 10.–14. pooperačného dňa v kombinácii s kompresívnym prádlom.'}
                    </p>
                  </div>

                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #E8E2D9', borderRadius: '6px', padding: '8px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#6D28D9', display: 'block', marginBottom: '2px' }}>
                      4. Laserová korekcia & SPF 50+ fotoprotekcia
                    </span>
                    <p style={{ margin: 0, fontSize: '8.5px', color: '#5C554E', lineHeight: '1.35' }}>
                      {plan.postOpCare.scarProtocol.laserTherapy || plan.postOpCare.scarProtocol.sunProtection}
                    </p>
                  </div>
                </div>

                {plan.postOpCare.scarProtocol.advancedScarTherapies && (
                  <div style={{ marginTop: '8px', borderTop: '1px dashed #E8E2D9', paddingTop: '6px', fontSize: '9px' }}>
                    <strong style={{ color: '#2C2A29' }}>Odporúčané klinické zákroky na jazvu:</strong>{' '}
                    <span style={{ color: '#7E22CE' }}>
                      {plan.postOpCare.scarProtocol.advancedScarTherapies.join(' • ')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Fázy zotavenia */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {plan.postOpCare.phases.map((phase) => (
                <div
                  key={phase.phaseId}
                  style={{
                    border: '1px solid #E8E2D9',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid #F0EBE1', paddingBottom: '4px', marginBottom: '6px' }}>
                    <div>
                      <span style={{ fontSize: '8.5px', fontWeight: 'bold', color: '#C5A059', textTransform: 'uppercase' }}>
                        {phase.period}
                      </span>
                      <strong style={{ display: 'block', fontSize: '10.5px', color: '#2C2A29' }}>
                        {phase.title}
                      </strong>
                    </div>
                    <span style={{ fontSize: '8px', fontFamily: 'monospace', color: '#8C857B', backgroundColor: '#F5F5F4', padding: '1px 5px', borderRadius: '3px' }}>
                      {phase.focus}
                    </span>
                  </div>

                  <ul style={{ margin: '0 0 6px 0', paddingLeft: '14px', fontSize: '9px', color: '#5C554E', lineHeight: '1.35' }}>
                    {phase.instructions.map((ins, i) => (
                      <li key={i}>{ins}</li>
                    ))}
                  </ul>

                  {phase.warningSigns && phase.warningSigns.length > 0 && (
                    <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '4px', padding: '4px 6px', fontSize: '8.5px', color: '#991B1B' }}>
                      <strong>⚠️ Varovné príznaky (kontaktujte kliniku):</strong> {phase.warningSigns.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 7. POZNÁMKA OŠETRUJÚCEHO LEKÁRA */}
        {/* ========================================================================= */}
        {plan.doctorNote && (
          <div
            style={{
              backgroundColor: '#FAF8F5',
              border: '1px solid #E8E2D9',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '20px',
              fontSize: '10px',
              pageBreakInside: 'avoid'
            }}
          >
            <strong style={{ color: '#C5A059', textTransform: 'uppercase', fontSize: '9px', letterSpacing: '0.5px', display: 'block', marginBottom: '3px' }}>
              Poznámka ošetrujúceho lekára:
            </strong>
            <p style={{ margin: 0, color: '#2C2A29', fontStyle: 'italic', lineHeight: '1.45' }}>
              {plan.doctorNote}
            </p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 8. ZÁVER, PEČIATKA & PODPIS LEKÁRA */}
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
              Tento liečebný a ošetrujúci plán je personalizovaným medicínskym protokolom vytvoreným pre pacienta. Presné termíny zákrokov a prípadné úpravy indikácií sa prispôsobujú aktuálnemu stavu tkanív pacienta.
            </p>
            <p style={{ margin: '3px 0 0 0', color: '#C5A059' }}>
              Vytlačené z interného klinického systému SAY CLINIC
            </p>
          </div>

          <div style={{ textAlign: 'center', width: '220px' }}>
            <div style={{ width: '180px', borderBottom: '1px solid #2C2A29', margin: '0 auto 6px auto' }} />
            <p style={{ margin: 0, fontWeight: 'bold', color: '#2C2A29', fontSize: '11px' }}>
              {plan.doctorName || 'MUDr. Ján Mráz'}
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

PatientPlanPdfDocument.displayName = 'PatientPlanPdfDocument';
