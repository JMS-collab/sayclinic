'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  PackageCheck, 
  Trash2, 
  Layers, 
  Printer, 
  Save, 
  User, 
  History, 
  CheckCircle2, 
  ExternalLink, 
  Clock,
  PlusCircle,
  Eye,
  Calendar,
  Activity,
  Plus,
  BookmarkPlus,
  Bookmark,
  Star,
  X,
  Check,
  RotateCcw
} from 'lucide-react';
import { Patient, MedicalRecord } from './PatientDatabase';
import { 
  Sculpture2DViewer, 
  Vector2DItem, 
  SculptureViewType, 
  DrawingToolType, 
  VIEW_CONFIGS 
} from './Sculpture2DViewer';

export interface BodyTreatmentItem {
  id: string;
  zone: string;
  procedureName: string;
  productName: string;
  lotNumber: string;
  expiry: string;
  dosage: string;
  technique: string;
  depthMm?: string;
  notes: string;
  createdAt: string;
  color: string;
}

export interface AestheticTemplate {
  id: string;
  title: string;
  productName: string;
  lot: string;
  type: 'threads' | 'fanning' | 'point';
  color: string;
  description: string;
  vectors: Vector2DItem[];
  isCustom?: boolean;
  createdAt?: string;
}

export interface AestheticSession {
  id: string;
  patientId: string;
  date: string;
  formattedDate: string;
  title: string;
  doctor: string;
  protocolNumber: string;
  vectors: Vector2DItem[];
  bodyTreatments: BodyTreatmentItem[];
  notes?: string;
}

const PRESET_MATERIALS = [
  { name: 'Dysport 300IU (Botulotoxín A)', type: 'botox', lot: 'DYSP-4412B', expiry: '05/2027', unit: 'Speywood U', pricePerUnit: 3.5 },
  { name: 'Alluzience 200U (Ready-to-use tekutý neurotoxín)', type: 'botox', lot: 'ALL-2026-771', expiry: '08/2027', unit: 'Speywood U', pricePerUnit: 4.2 },
  { name: 'Restylane Kysse 1ml s Lidokaínom (Výplň pier)', type: 'filler', lot: 'RST-KYS-993A', expiry: '11/2027', unit: 'ml', pricePerUnit: 340 },
  { name: 'Profhilo H+L 2ml (32mg H-HA + 32mg L-HA Bioremodelácia)', type: 'meso', lot: 'PRO-2ML-881', expiry: '06/2027', unit: 'ml', pricePerUnit: 290 },
  { name: 'Radiesse (+) 1.5ml s Lidokaínom (CaHA Vektoring & Lifting)', type: 'biostimulator', lot: 'RAD-150-332', expiry: '01/2028', unit: 'ml', pricePerUnit: 420 },
  { name: 'Sculptra 10ml (PLLA Biostimulátor neokolagenéza)', type: 'biostimulator', lot: 'SCL-2026-881A', expiry: '09/2028', unit: 'ml', pricePerUnit: 480 },
  { name: 'Juvederm Voluma with Lidocaine 1ml', type: 'filler', lot: 'JUV-VOL-8812', expiry: '08/2027', unit: 'ml', pricePerUnit: 340 },
  { name: 'Juvederm Volift 1ml', type: 'filler', lot: 'JUV-VFT-1102', expiry: '11/2027', unit: 'ml', pricePerUnit: 320 },
  { name: 'Lemon Bottle Lipolysis 10ml', type: 'lipolysis', lot: 'LMN-9921-A', expiry: '12/2027', unit: 'ml', pricePerUnit: 120 },
  { name: 'Profhilo Body 3ml Kit', type: 'body', lot: 'PRO-BDY-441', expiry: '07/2027', unit: 'kit', pricePerUnit: 390 }
];

// Presets for Face (2D vectors)
const PRESET_PROCEDURES: {
  id: string;
  title: string;
  productName: string;
  lot: string;
  type: 'threads' | 'fanning' | 'point';
  color: string;
  description: string;
  vectors: Vector2DItem[];
}[] = [
  {
    id: 'dysport_full_upper',
    title: 'Dysport / Alluzience – Čelo, Glabela & Oči',
    productName: 'Dysport 300IU (Botulotoxín A)',
    lot: 'DYSP-4412B',
    type: 'point',
    color: '#3B82F6',
    description: 'Kompletná horná tretina tváre: frontálne vrásky čela, glabela (vráska hnevu) a periorbitálne vejáriky',
    vectors: [
      // ČELO (m. frontalis) - Horný rad (Y ≈ 205-210)
      {
        id: 'dys_f1',
        type: 'point',
        view: 'front',
        color: '#3B82F6',
        startPoint: { x: 220, y: 210 },
        zoneName: 'Čelo Ľ (m. frontalis lateralis)',
        productName: 'Dysport 300IU',
        lotNumber: 'DYSP-4412B',
        details: '10 Speywood U (intramuskulárne)',
        createdAt: '10:00'
      },
      {
        id: 'dys_f2',
        type: 'point',
        view: 'front',
        color: '#3B82F6',
        startPoint: { x: 260, y: 205 },
        zoneName: 'Čelo Ľ (m. frontalis medialis)',
        productName: 'Dysport 300IU',
        lotNumber: 'DYSP-4412B',
        details: '10 Speywood U (intramuskulárne)',
        createdAt: '10:00'
      },
      {
        id: 'dys_f3',
        type: 'point',
        view: 'front',
        color: '#3B82F6',
        startPoint: { x: 340, y: 205 },
        zoneName: 'Čelo P (m. frontalis medialis)',
        productName: 'Dysport 300IU',
        lotNumber: 'DYSP-4412B',
        details: '10 Speywood U (intramuskulárne)',
        createdAt: '10:00'
      },
      {
        id: 'dys_f4',
        type: 'point',
        view: 'front',
        color: '#3B82F6',
        startPoint: { x: 380, y: 210 },
        zoneName: 'Čelo P (m. frontalis lateralis)',
        productName: 'Dysport 300IU',
        lotNumber: 'DYSP-4412B',
        details: '10 Speywood U (intramuskulárne)',
        createdAt: '10:00'
      },
      // ČELO - Dolný bezpečnostný rad (Y ≈ 240)
      {
        id: 'dys_f5',
        type: 'point',
        view: 'front',
        color: '#3B82F6',
        startPoint: { x: 250, y: 240 },
        zoneName: 'Čelo Ľ (dolný bezpečnostný rad)',
        productName: 'Dysport 300IU',
        lotNumber: 'DYSP-4412B',
        details: '5 Speywood U',
        createdAt: '10:01'
      },
      {
        id: 'dys_f6',
        type: 'point',
        view: 'front',
        color: '#3B82F6',
        startPoint: { x: 350, y: 240 },
        zoneName: 'Čelo P (dolný bezpečnostný rad)',
        productName: 'Dysport 300IU',
        lotNumber: 'DYSP-4412B',
        details: '5 Speywood U',
        createdAt: '10:01'
      },
      // GLABELA (Procerus + Corrugator)
      {
        id: 'dys_g1',
        type: 'point',
        view: 'front',
        color: '#3B82F6',
        startPoint: { x: 300, y: 280 },
        zoneName: 'Glabela – m. procerus',
        productName: 'Dysport 300IU',
        lotNumber: 'DYSP-4412B',
        details: '15 Speywood U (intramuskulárne)',
        createdAt: '10:02'
      },
      {
        id: 'dys_g2',
        type: 'point',
        view: 'front',
        color: '#3B82F6',
        startPoint: { x: 278, y: 272 },
        zoneName: 'Glabela – m. corrugator Ľ (mediálny)',
        productName: 'Dysport 300IU',
        lotNumber: 'DYSP-4412B',
        details: '10 Speywood U (hlboko na periost)',
        createdAt: '10:02'
      },
      {
        id: 'dys_g3',
        type: 'point',
        view: 'front',
        color: '#3B82F6',
        startPoint: { x: 322, y: 272 },
        zoneName: 'Glabela – m. corrugator P (mediálny)',
        productName: 'Dysport 300IU',
        lotNumber: 'DYSP-4412B',
        details: '10 Speywood U (hlboko na periost)',
        createdAt: '10:02'
      },
      {
        id: 'dys_g4',
        type: 'point',
        view: 'front',
        color: '#3B82F6',
        startPoint: { x: 248, y: 268 },
        zoneName: 'Glabela – m. corrugator Ľ (laterálny chvost)',
        productName: 'Dysport 300IU',
        lotNumber: 'DYSP-4412B',
        details: '5 Speywood U (povrchovo)',
        createdAt: '10:03'
      },
      {
        id: 'dys_g5',
        type: 'point',
        view: 'front',
        color: '#3B82F6',
        startPoint: { x: 352, y: 268 },
        zoneName: 'Glabela – m. corrugator P (laterálny chvost)',
        productName: 'Dysport 300IU',
        lotNumber: 'DYSP-4412B',
        details: '5 Speywood U (povrchovo)',
        createdAt: '10:03'
      },
      // OČNÉ VEJÁRIKY (m. orbicularis oculi lateralis)
      {
        id: 'dys_e1',
        type: 'point',
        view: 'front',
        color: '#3B82F6',
        startPoint: { x: 195, y: 292 },
        zoneName: 'Očné vejáriky Ľ (horný bod)',
        productName: 'Dysport 300IU',
        lotNumber: 'DYSP-4412B',
        details: '8 Speywood U (subkutánny pľuzgierik)',
        createdAt: '10:04'
      },
      {
        id: 'dys_e2',
        type: 'point',
        view: 'front',
        color: '#3B82F6',
        startPoint: { x: 185, y: 308 },
        zoneName: 'Očné vejáriky Ľ (stredný laterálny bod)',
        productName: 'Dysport 300IU',
        lotNumber: 'DYSP-4412B',
        details: '8 Speywood U (subkutánny pľuzgierik)',
        createdAt: '10:04'
      },
      {
        id: 'dys_e3',
        type: 'point',
        view: 'front',
        color: '#3B82F6',
        startPoint: { x: 195, y: 324 },
        zoneName: 'Očné vejáriky Ľ (dolný bod)',
        productName: 'Dysport 300IU',
        lotNumber: 'DYSP-4412B',
        details: '8 Speywood U (subkutánny pľuzgierik)',
        createdAt: '10:04'
      },
      {
        id: 'dys_e4',
        type: 'point',
        view: 'front',
        color: '#3B82F6',
        startPoint: { x: 405, y: 292 },
        zoneName: 'Očné vejáriky P (horný bod)',
        productName: 'Dysport 300IU',
        lotNumber: 'DYSP-4412B',
        details: '8 Speywood U (subkutánny pľuzgierik)',
        createdAt: '10:05'
      },
      {
        id: 'dys_e5',
        type: 'point',
        view: 'front',
        color: '#3B82F6',
        startPoint: { x: 415, y: 308 },
        zoneName: 'Očné vejáriky P (stredný laterálny bod)',
        productName: 'Dysport 300IU',
        lotNumber: 'DYSP-4412B',
        details: '8 Speywood U (subkutánny pľuzgierik)',
        createdAt: '10:05'
      },
      {
        id: 'dys_e6',
        type: 'point',
        view: 'front',
        color: '#3B82F6',
        startPoint: { x: 405, y: 324 },
        zoneName: 'Očné vejáriky P (dolný bod)',
        productName: 'Dysport 300IU',
        lotNumber: 'DYSP-4412B',
        details: '8 Speywood U (subkutánny pľuzgierik)',
        createdAt: '10:05'
      }
    ]
  },
  {
    id: 'restylane_kysse_lips',
    title: 'Restylane Kysse – Modelácia a výplň pier',
    productName: 'Restylane Kysse 1ml s Lidokaínom',
    lot: 'RST-KYS-993A',
    type: 'point',
    color: '#EC4899',
    description: 'Prirodzená definícia kontúr, Amorovho luku, filtrálnych stĺpcov a zväčšenie objemu tela pier (OBT technológia)',
    vectors: [
      {
        id: 'kysse_1',
        type: 'point',
        view: 'front',
        color: '#EC4899',
        startPoint: { x: 293, y: 436 },
        zoneName: 'Amorov vrchol Ľ (Cupid\'s peak)',
        productName: 'Restylane Kysse 1ml',
        lotNumber: 'RST-KYS-993A',
        details: '0.05ml OBT mikrodávka na kontúru',
        createdAt: '10:10'
      },
      {
        id: 'kysse_2',
        type: 'point',
        view: 'front',
        color: '#EC4899',
        startPoint: { x: 307, y: 436 },
        zoneName: 'Amorov vrchol P (Cupid\'s peak)',
        productName: 'Restylane Kysse 1ml',
        lotNumber: 'RST-KYS-993A',
        details: '0.05ml OBT mikrodávka na kontúru',
        createdAt: '10:10'
      },
      {
        id: 'kysse_3',
        type: 'point',
        view: 'front',
        color: '#EC4899',
        startPoint: { x: 300, y: 439 },
        zoneName: 'Amorov stredový zárez (Notch)',
        productName: 'Restylane Kysse 1ml',
        lotNumber: 'RST-KYS-993A',
        details: '0.05ml definícia kontúry',
        createdAt: '10:11'
      },
      {
        id: 'kysse_4',
        type: 'point',
        view: 'front',
        color: '#EC4899',
        startPoint: { x: 278, y: 442 },
        zoneName: 'Kontúra hornej pery Ľ (Vermilion border)',
        productName: 'Restylane Kysse 1ml',
        lotNumber: 'RST-KYS-993A',
        details: '0.1ml retrográdna lineárna výplň',
        createdAt: '10:11'
      },
      {
        id: 'kysse_5',
        type: 'point',
        view: 'front',
        color: '#EC4899',
        startPoint: { x: 322, y: 442 },
        zoneName: 'Kontúra hornej pery P (Vermilion border)',
        productName: 'Restylane Kysse 1ml',
        lotNumber: 'RST-KYS-993A',
        details: '0.1ml retrográdna lineárna výplň',
        createdAt: '10:11'
      },
      {
        id: 'kysse_6',
        type: 'point',
        view: 'front',
        color: '#EC4899',
        startPoint: { x: 262, y: 448 },
        zoneName: 'Ústny kútik Ľ (Oral commissure)',
        productName: 'Restylane Kysse 1ml',
        lotNumber: 'RST-KYS-993A',
        details: '0.05ml podpora kútika',
        createdAt: '10:12'
      },
      {
        id: 'kysse_7',
        type: 'point',
        view: 'front',
        color: '#EC4899',
        startPoint: { x: 338, y: 448 },
        zoneName: 'Ústny kútik P (Oral commissure)',
        productName: 'Restylane Kysse 1ml',
        lotNumber: 'RST-KYS-993A',
        details: '0.05ml podpora kútika',
        createdAt: '10:12'
      },
      {
        id: 'kysse_8',
        type: 'point',
        view: 'front',
        color: '#EC4899',
        startPoint: { x: 300, y: 445 },
        zoneName: 'Stredový tuberkulus hornej pery',
        productName: 'Restylane Kysse 1ml',
        lotNumber: 'RST-KYS-993A',
        details: '0.15ml objem tela pery',
        createdAt: '10:13'
      },
      {
        id: 'kysse_9',
        type: 'point',
        view: 'front',
        color: '#EC4899',
        startPoint: { x: 288, y: 458 },
        zoneName: 'Dolný tuberkulus Ľ (Objem dolnej pery)',
        productName: 'Restylane Kysse 1ml',
        lotNumber: 'RST-KYS-993A',
        details: '0.2ml hĺbkový bolus tela pery',
        createdAt: '10:14'
      },
      {
        id: 'kysse_10',
        type: 'point',
        view: 'front',
        color: '#EC4899',
        startPoint: { x: 312, y: 458 },
        zoneName: 'Dolný tuberkulus P (Objem dolnej pery)',
        productName: 'Restylane Kysse 1ml',
        lotNumber: 'RST-KYS-993A',
        details: '0.2ml hĺbkový bolus tela pery',
        createdAt: '10:14'
      },
      {
        id: 'kysse_11',
        type: 'point',
        view: 'front',
        color: '#EC4899',
        startPoint: { x: 300, y: 466 },
        zoneName: 'Dolná kontúra pery (Stred vermilion border)',
        productName: 'Restylane Kysse 1ml',
        lotNumber: 'RST-KYS-993A',
        details: '0.05ml definícia dolnej kontúry',
        createdAt: '10:15'
      }
    ]
  },
  {
    id: 'profhilo_5bap',
    title: 'Profhilo – 5 BAP bodov (Bioremodelácia tváre)',
    productName: 'Profhilo H+L 2ml',
    lot: 'PRO-2ML-881',
    type: 'point',
    color: '#06B6D4',
    description: '5 bioestetických bodov (BAP technika) pre hĺbkovú hydratáciu, stimuláciu elastínu a lifting tkanív',
    vectors: [
      // ĽAVÁ STRANA (5 BAP bodov)
      {
        id: 'pro_bap_1l',
        type: 'point',
        view: 'front',
        color: '#06B6D4',
        startPoint: { x: 215, y: 340 },
        zoneName: 'BAP 1: Zygomatická prominencia Ľ',
        productName: 'Profhilo H+L 2ml',
        lotNumber: 'PRO-2ML-881',
        details: '0.2ml subkutánny bolus Ihla 29G',
        createdAt: '10:20'
      },
      {
        id: 'pro_bap_2l',
        type: 'point',
        view: 'front',
        color: '#06B6D4',
        startPoint: { x: 265, y: 395 },
        zoneName: 'BAP 2: Nazálna báza / Alar base Ľ',
        productName: 'Profhilo H+L 2ml',
        lotNumber: 'PRO-2ML-881',
        details: '0.2ml subkutánny bolus Ihla 29G',
        createdAt: '10:21'
      },
      {
        id: 'pro_bap_3l',
        type: 'point',
        view: 'front',
        color: '#06B6D4',
        startPoint: { x: 165, y: 360 },
        zoneName: 'BAP 3: Tragus / Preaurikulárne Ľ',
        productName: 'Profhilo H+L 2ml',
        lotNumber: 'PRO-2ML-881',
        details: '0.2ml subkutánny bolus Ihla 29G',
        createdAt: '10:22'
      },
      {
        id: 'pro_bap_4l',
        type: 'point',
        view: 'front',
        color: '#06B6D4',
        startPoint: { x: 282, y: 515 },
        zoneName: 'BAP 4: Mentum / Brada Ľ',
        productName: 'Profhilo H+L 2ml',
        lotNumber: 'PRO-2ML-881',
        details: '0.2ml subkutánny bolus Ihla 29G',
        createdAt: '10:23'
      },
      {
        id: 'pro_bap_5l',
        type: 'point',
        view: 'front',
        color: '#06B6D4',
        startPoint: { x: 190, y: 465 },
        zoneName: 'BAP 5: Mandibulárny uhol (Gonion) Ľ',
        productName: 'Profhilo H+L 2ml',
        lotNumber: 'PRO-2ML-881',
        details: '0.2ml subkutánny bolus Ihla 29G',
        createdAt: '10:24'
      },
      // PRAVÁ STRANA (5 BAP bodov)
      {
        id: 'pro_bap_1r',
        type: 'point',
        view: 'front',
        color: '#06B6D4',
        startPoint: { x: 385, y: 340 },
        zoneName: 'BAP 1: Zygomatická prominencia P',
        productName: 'Profhilo H+L 2ml',
        lotNumber: 'PRO-2ML-881',
        details: '0.2ml subkutánny bolus Ihla 29G',
        createdAt: '10:20'
      },
      {
        id: 'pro_bap_2r',
        type: 'point',
        view: 'front',
        color: '#06B6D4',
        startPoint: { x: 335, y: 395 },
        zoneName: 'BAP 2: Nazálna báza / Alar base P',
        productName: 'Profhilo H+L 2ml',
        lotNumber: 'PRO-2ML-881',
        details: '0.2ml subkutánny bolus Ihla 29G',
        createdAt: '10:21'
      },
      {
        id: 'pro_bap_3r',
        type: 'point',
        view: 'front',
        color: '#06B6D4',
        startPoint: { x: 435, y: 360 },
        zoneName: 'BAP 3: Tragus / Preaurikulárne P',
        productName: 'Profhilo H+L 2ml',
        lotNumber: 'PRO-2ML-881',
        details: '0.2ml subkutánny bolus Ihla 29G',
        createdAt: '10:22'
      },
      {
        id: 'pro_bap_4r',
        type: 'point',
        view: 'front',
        color: '#06B6D4',
        startPoint: { x: 318, y: 515 },
        zoneName: 'BAP 4: Mentum / Brada P',
        productName: 'Profhilo H+L 2ml',
        lotNumber: 'PRO-2ML-881',
        details: '0.2ml subkutánny bolus Ihla 29G',
        createdAt: '10:23'
      },
      {
        id: 'pro_bap_5r',
        type: 'point',
        view: 'front',
        color: '#06B6D4',
        startPoint: { x: 410, y: 465 },
        zoneName: 'BAP 5: Mandibulárny uhol (Gonion) P',
        productName: 'Profhilo H+L 2ml',
        lotNumber: 'PRO-2ML-881',
        details: '0.2ml subkutánny bolus Ihla 29G',
        createdAt: '10:24'
      }
    ]
  },
  {
    id: 'radiesse_jawline_lift',
    title: 'Radiesse (+) – Vektoring sánky & Líca',
    productName: 'Radiesse (+) 1.5ml s Lidokaínom',
    lot: 'RAD-150-332',
    type: 'fanning',
    color: '#D97706',
    description: 'Kanylový lifting kontúr dolnej sánky (Jawline) a malárny fanning pre spevnenie väzivového aparátu',
    vectors: [
      {
        id: 'rad_jaw_l',
        type: 'threads',
        view: 'front',
        color: '#D97706',
        startPoint: { x: 190, y: 465 },
        endPoint: { x: 282, y: 515 },
        zoneName: 'Jawline kontúra sánky Ľ (Lineárny vektor)',
        productName: 'Radiesse (+) 1.5ml',
        lotNumber: 'RAD-150-332',
        details: 'Kanyla 25G/50mm • 0.4ml retrográdna línia na kosť',
        createdAt: '10:30'
      },
      {
        id: 'rad_jaw_r',
        type: 'threads',
        view: 'front',
        color: '#D97706',
        startPoint: { x: 410, y: 465 },
        endPoint: { x: 318, y: 515 },
        zoneName: 'Jawline kontúra sánky P (Lineárny vektor)',
        productName: 'Radiesse (+) 1.5ml',
        lotNumber: 'RAD-150-332',
        details: 'Kanyla 25G/50mm • 0.4ml retrográdna línia na kosť',
        createdAt: '10:30'
      },
      {
        id: 'rad_fan_l',
        type: 'fanning',
        view: 'front',
        color: '#D97706',
        startPoint: { x: 185, y: 350 },
        endPoint: { x: 255, y: 375 },
        fanningRays: [
          { x: 255, y: 345 },
          { x: 265, y: 375 },
          { x: 255, y: 405 },
          { x: 230, y: 420 }
        ],
        zoneName: 'Malárny fanning Ľ (Subkutánna kolagenéza)',
        productName: 'Radiesse (+) 1.5ml',
        lotNumber: 'RAD-150-332',
        details: 'Kanyla 25G • 4 lúče • 0.35ml',
        createdAt: '10:32'
      },
      {
        id: 'rad_fan_r',
        type: 'fanning',
        view: 'front',
        color: '#D97706',
        startPoint: { x: 415, y: 350 },
        endPoint: { x: 345, y: 375 },
        fanningRays: [
          { x: 345, y: 345 },
          { x: 335, y: 375 },
          { x: 345, y: 405 },
          { x: 370, y: 420 }
        ],
        zoneName: 'Malárny fanning P (Subkutánna kolagenéza)',
        productName: 'Radiesse (+) 1.5ml',
        lotNumber: 'RAD-150-332',
        details: 'Kanyla 25G • 4 lúče • 0.35ml',
        createdAt: '10:32'
      }
    ]
  },
  {
    id: 'sculptra_midface',
    title: 'Sculptra – Biostimulačný fanning (Líca & Zygoma)',
    productName: 'Sculptra 10ml (PLLA Biostimulátor)',
    lot: 'SCL-2026-881A',
    type: 'fanning',
    color: '#C5A059',
    description: 'Vejárovitá aplikácia kanylou 25G do subkutánnej vrstvy líc a temporálnej fassie pre masívnu novotvorbu kolagénu',
    vectors: [
      {
        id: 'scl_front_l',
        type: 'fanning',
        view: 'front',
        color: '#C5A059',
        startPoint: { x: 185, y: 345 },
        endPoint: { x: 260, y: 395 },
        fanningRays: [
          { x: 255, y: 345 },
          { x: 265, y: 370 },
          { x: 260, y: 395 },
          { x: 245, y: 415 },
          { x: 220, y: 425 }
        ],
        zoneName: 'Zygomatická oblasť / Líce Ľ (Vejár)',
        productName: 'Sculptra 10ml (PLLA Biostimulátor)',
        lotNumber: 'SCL-2026-881A',
        details: 'Kanyla 25G/50mm • 5 lúčov • 2.5ml roztoku',
        createdAt: '10:40'
      },
      {
        id: 'scl_front_r',
        type: 'fanning',
        view: 'front',
        color: '#C5A059',
        startPoint: { x: 415, y: 345 },
        endPoint: { x: 340, y: 395 },
        fanningRays: [
          { x: 345, y: 345 },
          { x: 335, y: 370 },
          { x: 340, y: 395 },
          { x: 355, y: 415 },
          { x: 380, y: 425 }
        ],
        zoneName: 'Zygomatická oblasť / Líce P (Vejár)',
        productName: 'Sculptra 10ml (PLLA Biostimulátor)',
        lotNumber: 'SCL-2026-881A',
        details: 'Kanyla 25G/50mm • 5 lúčov • 2.5ml roztoku',
        createdAt: '10:40'
      }
    ]
  }
];

// Presets for Body Treatments
const BODY_ZONES = [
  'Gluteálna oblasť / Zadok (Sculptra Butt Lift / Objem)',
  'Brucho a podbruško (Laxita kože, Strie)',
  'Stehná – vonkajšie (Boky / Saddlebags)',
  'Stehná – vnútorné (Ochabnutá koža, Biostimulácia)',
  'Stehná – zadné & Podzadková ryha (Celulitída)',
  'Paže / Tricepsová zóna (Ochabnutie kože)',
  'Boky a driek (Love handles / Formovanie línie)',
  'Kolená – suprapatelárna zóna (Kožný previs)',
  'Dekolt a hrudník (Spánkové vrásky, Fotopoškodenie)',
  'Chrbát – subskapulárna zóna (Bra rolls)'
];

const BODY_PROCEDURES = [
  { name: 'Sculptra Body (PLLA Biostimulácia)', defaultProduct: 'Sculptra 10ml (PLLA Biostimulátor)', defaultTechnique: 'Kanyla 18G/70mm vějířovitě', color: '#C5A059' },
  { name: 'Radiesse Body Hyperdiluted (CaHA)', defaultProduct: 'Radiesse (+) 1.5ml (CaHA Vektoring)', defaultTechnique: 'Kanyla 22G riedenie 1:2', color: '#D97706' },
  { name: 'Injekčná lipolýza (Lemon Bottle)', defaultProduct: 'Lemon Bottle Lipolysis 10ml', defaultTechnique: 'Ihla 30G/13mm subkutánny depozit', color: '#10B981' },
  { name: 'Morpheus8 Body (Frakčná RF)', defaultProduct: 'Morpheus8 Body 24 Pin Tip', defaultTechnique: 'Hĺbka 4-7mm • Energia 45-60mJ', color: '#EF4444' },
  { name: 'Profhilo Body (Bioremodelácia)', defaultProduct: 'Profhilo Body 3ml Kit', defaultTechnique: '10-bodová BAP technika', color: '#06B6D4' },
  { name: 'PB Serum Medical (Enzýmová terapia)', defaultProduct: 'PB Serum High/Medium 1.5ml', defaultTechnique: 'Ihla 30G/13mm alebo kanyla 25G', color: '#8B5CF6' }
];

export function AestheticsModule({ 
  patients = [], 
  selectedPatientId,
  onSelectPatient,
  onOpenPatientFolder
}: { 
  patients?: Patient[]; 
  selectedPatientId?: string | null;
  onSelectPatient?: (id: string) => void;
  onOpenPatientFolder?: (patient: Patient) => void;
}) {
  const [localPatients, setLocalPatients] = useState<Patient[]>(patients);

  useEffect(() => {
    if (patients && patients.length > 0) {
      setLocalPatients(patients);
    } else {
      const saved = localStorage.getItem('say_clinic_patients');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLocalPatients(parsed);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [patients]);

  const activePatientId = selectedPatientId || (localPatients.length > 0 ? localPatients[0].id : 'P1');
  const currentPatient: Patient = localPatients.find(p => p.id === activePatientId) || localPatients[0] || {
    id: 'P1',
    name: 'Mária Kováčová',
    birthNumber: '885512/6789',
    phone: '+421 905 123 456',
    email: 'maria.kovacova@email.sk',
    address: 'Slnečná 15, Banská Bystrica',
    dob: '12.05.1988',
    insurance: '24 (Dôvera)'
  };

  // MAIN MODE: FACE (2D SCULPTURE) vs BODY (OŠETRENIE TELA) vs PROTOCOL A4
  const [activeAreaMode, setActiveAreaMode] = useState<'face' | 'body'>('face');
  const [viewMode, setViewMode] = useState<'editor' | 'protocol'>('editor');

  // 2D SCULPTURE VECTORS & TOOLS
  const [activeSculptureView, setActiveSculptureView] = useState<SculptureViewType>('front');
  const [vectors, setVectors] = useState<Vector2DItem[]>([
    ...PRESET_PROCEDURES[0].vectors
  ]);
  const [activeTool, setActiveTool] = useState<DrawingToolType>('select');
  const [activeColor, setActiveColor] = useState<string>('#C5A059');
  const [selectedVectorId, setSelectedVectorId] = useState<string | null>(null);
  const [selectedMaterialIdx, setSelectedMaterialIdx] = useState(0);

  // BODY TREATMENTS STATE
  const [bodyTreatments, setBodyTreatments] = useState<BodyTreatmentItem[]>([
    {
      id: 'bdy_demo_1',
      zone: 'Gluteálna oblasť / Zadok (Sculptra Butt Lift / Objem)',
      procedureName: 'Sculptra Body (PLLA Biostimulácia)',
      productName: 'Sculptra 10ml (PLLA Biostimulátor)',
      lotNumber: 'SCL-2026-881A',
      expiry: '09/2028',
      dosage: '2 ampulky (40ml roztoku 1:4)',
      technique: 'Kanyla 18G/70mm do subkutánneho tuku',
      depthMm: '6-8 mm',
      notes: 'Symetrická aplikácia 20ml vľavo a 20ml vpravo na horný vonkajší kvadrant.',
      createdAt: '11:00',
      color: '#C5A059'
    }
  ]);

  // Form for adding body treatment
  const [newBodyZone, setNewBodyZone] = useState(BODY_ZONES[0]);
  const [newBodyProcedureIdx, setNewBodyProcedureIdx] = useState(0);
  const [newBodyLot, setNewBodyLot] = useState('SCL-2026-881A');
  const [newBodyDosage, setNewBodyDosage] = useState('2 ampulky (40ml)');
  const [newBodyTechnique, setNewBodyTechnique] = useState('Kanyla 18G/70mm');
  const [newBodyNotes, setNewBodyNotes] = useState('');

  // SESSIONS & HISTORY
  const [sessions, setSessions] = useState<AestheticSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('current');
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [savedStatusMsg, setSavedStatusMsg] = useState<string | null>(null);
  const [protocolRecordNo] = useState(() => 'AES-884920');

  // Load history for patient
  useEffect(() => {
    if (!currentPatient?.id) return;
    const saved = localStorage.getItem('say_clinic_aesthetic_sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed[currentPatient.id]) {
          setSessions(parsed[currentPatient.id]);
        } else {
          setSessions([]);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [currentPatient?.id]);

  const currentMaterial = PRESET_MATERIALS[selectedMaterialIdx];

  // Counts
  const countThreads = vectors.filter(v => v.type === 'threads').length;
  const countFanning = vectors.filter(v => v.type === 'fanning').length;
  const countPoints = vectors.filter(v => v.type === 'point').length;

  const activeVector = vectors.find(v => v.id === selectedVectorId);

  // VLASTNÉ ŠABLÓNY (CUSTOM TEMPLATES) STATE & PERSISTENCIA
  const [customTemplates, setCustomTemplates] = useState<AestheticTemplate[]>([]);
  const [templateFilter, setTemplateFilter] = useState<'all' | 'custom' | 'standard'>('all');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateFormTitle, setTemplateFormTitle] = useState('');
  const [templateFormDesc, setTemplateFormDesc] = useState('');
  const [templateFormProduct, setTemplateFormProduct] = useState('');
  const [templateFormLot, setTemplateFormLot] = useState('');
  const [templateFormColor, setTemplateFormColor] = useState('#C5A059');
  const [templateFormScope, setTemplateFormScope] = useState<'all' | 'current_view'>('all');
  const [templateSuccessToast, setTemplateSuccessToast] = useState<string | null>(null);

  // Load custom templates from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('say_clinic_custom_aesthetic_templates');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCustomTemplates(parsed);
        }
      } catch (e) {
        console.error('Error loading custom templates:', e);
      }
    }
  }, []);

  // Save custom templates to localStorage
  const persistCustomTemplates = (tpls: AestheticTemplate[]) => {
    setCustomTemplates(tpls);
    try {
      localStorage.setItem('say_clinic_custom_aesthetic_templates', JSON.stringify(tpls));
    } catch (e) {
      console.error('Error saving custom templates:', e);
    }
  };

  // Open save template modal with smart defaults
  const handleOpenSaveTemplateModal = () => {
    if (vectors.length === 0) {
      alert('Nemáte nakreslené žiadne vektory na uloženie do šablóny. Najskôr nakreslite aspoň jeden bod alebo vektor.');
      return;
    }
    const currentViewVectors = vectors.filter(v => v.view === activeSculptureView);
    setTemplateFormTitle(`Moja šablóna (${new Date().toLocaleDateString('sk-SK')})`);
    setTemplateFormDesc(`Vlastná schéma procedúry obsahujúca ${vectors.length} vektorov/bodov`);
    setTemplateFormProduct(currentMaterial?.name || 'Vlastný materiál');
    setTemplateFormLot(currentMaterial?.lot || 'LOT-CUSTOM');
    setTemplateFormColor(activeColor || '#C5A059');
    setTemplateFormScope(currentViewVectors.length === vectors.length ? 'current_view' : 'all');
    setShowTemplateModal(true);
  };

  // Save new custom template
  const handleSaveCustomTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateFormTitle.trim()) {
      alert('Zadajte názov šablóny');
      return;
    }

    const vectorsToSave = templateFormScope === 'current_view'
      ? vectors.filter(v => v.view === activeSculptureView)
      : vectors;

    if (vectorsToSave.length === 0) {
      alert('Vybraný pohľad neobsahuje žiadne vektory.');
      return;
    }

    // Clone vectors with new clean IDs
    const clonedVectors: Vector2DItem[] = vectorsToSave.map((v, idx) => ({
      ...v,
      id: `tpl_vec_${Date.now()}_${idx}`
    }));

    // Determine main type
    const hasFanning = clonedVectors.some(v => v.type === 'fanning');
    const hasThreads = clonedVectors.some(v => v.type === 'threads' || v.type === 'vector');
    const type: 'threads' | 'fanning' | 'point' = hasFanning ? 'fanning' : hasThreads ? 'threads' : 'point';

    const newTemplate: AestheticTemplate = {
      id: `custom_tpl_${Date.now()}`,
      title: templateFormTitle.trim(),
      description: templateFormDesc.trim() || 'Vlastná schéma ošetrenia',
      productName: templateFormProduct.trim() || 'Kombinovaný produkt',
      lot: templateFormLot.trim() || 'LOT-CUSTOM',
      type,
      color: templateFormColor,
      vectors: clonedVectors,
      isCustom: true,
      createdAt: new Date().toISOString()
    };

    const updated = [newTemplate, ...customTemplates];
    persistCustomTemplates(updated);
    setShowTemplateModal(false);
    setTemplateSuccessToast(`Šablóna "${newTemplate.title}" bola úspešne uložená!`);
    setTimeout(() => setTemplateSuccessToast(null), 4000);
  };

  // Delete custom template
  const handleDeleteCustomTemplate = (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Naozaj chcete vymazať túto vlastnú šablónu?')) {
      const updated = customTemplates.filter(t => t.id !== templateId);
      persistCustomTemplates(updated);
    }
  };

  // Apply template (append or replace)
  const handleApplyTemplate = (template: AestheticTemplate, mode: 'append' | 'replace' = 'append') => {
    // Generate unique IDs for vectors when applying
    const freshVectors: Vector2DItem[] = template.vectors.map((v, idx) => ({
      ...v,
      id: `vec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${idx}`
    }));

    if (mode === 'replace') {
      setVectors(freshVectors);
    } else {
      setVectors(prev => [...prev, ...freshVectors]);
    }

    setActiveColor(template.color);
    if (template.type === 'threads') setActiveTool('threads');
    else if (template.type === 'fanning') setActiveTool('fanning');
    else setActiveTool('point');

    if (freshVectors.length > 0) {
      setActiveSculptureView(freshVectors[0].view);
    }

    setTemplateSuccessToast(`Šablóna "${template.title}" bola aplikovaná (+${freshVectors.length} vektorov).`);
    setTimeout(() => setTemplateSuccessToast(null), 3000);
  };

  // Combined list of templates
  const allTemplates: AestheticTemplate[] = [
    ...customTemplates,
    ...PRESET_PROCEDURES.map(p => ({ ...p, isCustom: false }))
  ];

  const displayedTemplates = allTemplates.filter(t => {
    if (templateFilter === 'custom') return t.isCustom;
    if (templateFilter === 'standard') return !t.isCustom;
    return true;
  });

  // Add body treatment
  const handleAddBodyTreatment = () => {
    const proc = BODY_PROCEDURES[newBodyProcedureIdx];
    const newItem: BodyTreatmentItem = {
      id: `bdy_${Date.now()}`,
      zone: newBodyZone,
      procedureName: proc.name,
      productName: proc.defaultProduct,
      lotNumber: newBodyLot,
      expiry: '09/2028',
      dosage: newBodyDosage,
      technique: newBodyTechnique,
      notes: newBodyNotes,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      color: proc.color
    };
    setBodyTreatments(prev => [newItem, ...prev]);
    setNewBodyNotes('');
    setSavedStatusMsg(`✅ Telové ošetrenie bolo pridané: ${proc.name}`);
    setTimeout(() => setSavedStatusMsg(null), 4000);
  };

  // Save session to history & medical record
  const handleSaveProtocolToPatientFolder = () => {
    if (!currentPatient) return;

    const todayDate = new Date().toISOString().split('T')[0];
    const formattedDateStr = new Date().toLocaleDateString('sk-SK');

    const faceVectorsList = vectors.map((v, idx) => 
      `${idx + 1}. [${v.type.toUpperCase()}] (${v.view}) ${v.zoneName}
   • Prípravok: ${v.productName}
   • Šarža (LOT): ${v.lotNumber}
   • Špecifikácia: ${v.details}`
    ).join('\n\n');

    const bodyTreatmentsList = bodyTreatments.map((b, idx) =>
      `${idx + 1}. ${b.zone}
   • Výkon: ${b.procedureName}
   • Prípravok & LOT: ${b.productName} (LOT: ${b.lotNumber})
   • Dávka / Objem: ${b.dosage}
   • Technika: ${b.technique}
   • Poznámka: ${b.notes || 'Bez komplikácií'}`
    ).join('\n\n');

    const fullContent = `PROTOKOL O APLIKÁCII ESTETICKÝCH LIEČIV, BIOMATERIÁLOV A TELOVÝCH OŠETRENÍ
Dátum výkonu: ${formattedDateStr}
Číslo protokolu: ${protocolRecordNo}
Ošetrujúci lekár: MUDr. Ján Mráz (SAY CLINIC)

SÚHRNNÝ PREHĽAD VÝKONU:
• Tvár & Krk: ${countPoints} bodových mikroinjekcií (Dysport / Restylane / Profhilo), ${countFanning} biostimulačných vejárov (Sculptra / Radiesse), ${countThreads} kanylových vektorov
• Ošetrenie tela: ${bodyTreatments.length} telových procedúr

1. OŠETRENIE TVÁRE, KRKU A DEKOLTU (2D SCULPTURE MAPPING):
${faceVectorsList || 'Žiadne nákresy na tvár.'}

2. OŠETRENIE TELA (TELOVÉ PROTOKOLY & BIOMATERIÁLY):
${bodyTreatmentsList || 'Žiadne telové procedúry.'}

POUČENIE PACIENTA & POOPERAČNÝ REŽIM:
Pacient bol riadne poučený o poaplikačnom a pooperačnom režime. V prípade niťového liftingu a biostimulácie dodržiavať pokojový režim, obmedziť mimiku a masáže ošetrených oblastí počas 14 dní. Chladenie suchým chladom pri opuchoch. Kontrola o 14 dní na klinike.`;

    const newRecord: MedicalRecord = {
      id: `rec-aes-${Date.now()}`,
      type: 'Estetický protokol',
      typeColor: 'bg-[#C5A059]',
      title: `Estetické ošetrenie (${vectors.length} vektorov tváre, ${bodyTreatments.length} telových zón)`,
      doctor: 'MUDr. Ján Mráz',
      diagnosis: 'Z41.1 (Esteticko-rekonštrukčný výkon)',
      date: todayDate,
      content: fullContent
    };

    const newSession: AestheticSession = {
      id: `sess_${Date.now()}`,
      patientId: currentPatient.id,
      date: todayDate,
      formattedDate: formattedDateStr,
      title: `${vectors.length > 0 ? 'Tvár & Krk' : ''} ${bodyTreatments.length > 0 ? '+ Ošetrenie tela' : ''}`,
      doctor: 'MUDr. Ján Mráz',
      protocolNumber: protocolRecordNo,
      vectors: [...vectors],
      bodyTreatments: [...bodyTreatments],
      notes: `Aplikácia vykonaná v plnom rozsahu bez komplikácií.`
    };

    try {
      // 1. Save to session storage
      const existingSessionsRaw = localStorage.getItem('say_clinic_aesthetic_sessions') || '{}';
      const existingSessions = JSON.parse(existingSessionsRaw);
      const patientSessionList = existingSessions[currentPatient.id] || [];
      const updatedSessionList = [newSession, ...patientSessionList];
      existingSessions[currentPatient.id] = updatedSessionList;
      localStorage.setItem('say_clinic_aesthetic_sessions', JSON.stringify(existingSessions));
      setSessions(updatedSessionList);
      setActiveSessionId(newSession.id);

      // 2. Save to medical records
      const existingRaw = localStorage.getItem('say_clinic_patient_records') || '{}';
      const existing = JSON.parse(existingRaw);
      const patientList = existing[currentPatient.id] || [];
      const updatedList = [newRecord, ...patientList];
      existing[currentPatient.id] = updatedList;
      localStorage.setItem('say_clinic_patient_records', JSON.stringify(existing));

      setSavedStatusMsg(`✅ Protokol bol úspešne uložený do karty pacienta: ${currentPatient.name}`);
      setTimeout(() => setSavedStatusMsg(null), 5000);
    } catch (e) {
      console.error(e);
      setSavedStatusMsg('❌ Chyba pri ukladaní.');
    }
  };

  // Switch to past session
  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    if (sessionId === 'current') {
      setVectors([...PRESET_PROCEDURES[0].vectors]);
      setBodyTreatments([]);
    } else {
      const past = sessions.find(s => s.id === sessionId);
      if (past) {
        setVectors([...(past.vectors || [])]);
        setBodyTreatments([...(past.bodyTreatments || [])]);
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* NOTIFIKÁCIA O ULOŽENÍ */}
      {savedStatusMsg && (
        <div className="fixed top-20 right-6 z-50 bg-[#2C2A29] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-[#C5A059] flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 print:hidden">
          <CheckCircle2 className="w-5 h-5 text-[#C5A059]" />
          <div className="text-xs">
            <p className="font-bold">{savedStatusMsg}</p>
            <p className="text-[10px] text-gray-300">Záznam je ihneď prístupný v zložke pacienta v Kartotéke.</p>
          </div>
          {onOpenPatientFolder && (
            <button
              type="button"
              onClick={() => onOpenPatientFolder(currentPatient)}
              className="ml-3 px-3 py-1 bg-[#C5A059] hover:bg-[#B38F46] text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Zobraziť v karte</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* HEADER: AMBIENT PANEL S VÝBEROM PACIENTA & REŽIMOV */}
      <div className="relative rounded-3xl p-6 backdrop-blur-3xl bg-white/70 border border-white/80 shadow-[0_8px_32px_0_rgba(197,160,89,0.08)] overflow-hidden print:hidden">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-gradient-to-br from-[#C5A059]/20 to-[#EAD8CA]/30 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2C2A29] to-[#433E3C] text-[#C5A059] flex items-center justify-center shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-serif font-bold text-[#2C2A29] tracking-wide">
                  Estetická medicína & Vektorové mapovanie
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#C5A059]/15 text-[#9C7D2B] border border-[#C5A059]/30">
                  2D Socha • Bočné pohľady • Telo
                </span>
              </div>
              <p className="text-xs text-[#8C857B] mt-0.5">
                Viacpohľadová 2D socha (Čelný, Profil Ľ/P, 3/4 Ľ/P) + Telové protokoly (Sculptra Body, Lipolýza, Radiesse)
              </p>
            </div>
          </div>

          {/* OVLÁDACIA LIŠTA V HLAVIČKE */}
          <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
            
            {/* VOLIČ PACIENTA */}
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-[#C5A059]/40 shadow-xs">
              <User className="w-4 h-4 text-[#C5A059]" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-[#8C857B] leading-none">Klient z kartotéky:</span>
                <select
                  value={currentPatient.id}
                  onChange={(e) => onSelectPatient && onSelectPatient(e.target.value)}
                  className="bg-transparent text-xs font-bold text-[#2C2A29] focus:outline-hidden cursor-pointer"
                >
                  {localPatients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.birthNumber || p.dob})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* HISTÓRIA ZÁKROKOV */}
            <button
              type="button"
              onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white border border-[#E8E2D9] hover:border-[#C5A059] text-xs font-medium text-[#2C2A29] transition-all shadow-xs cursor-pointer"
              title="História ošetrení pacienta"
            >
              <History className="w-4 h-4 text-[#C5A059]" />
              <span className="hidden sm:inline">História</span>
              <span className="w-5 h-5 rounded-full bg-[#FAF8F5] border border-[#E8E2D9] text-[10px] font-bold flex items-center justify-center">
                {sessions.length}
              </span>
            </button>

            {/* PREPÍNAČ REŽIMU: EDITOR VS PROTOKOL TLAČ */}
            <div className="flex items-center bg-[#FAF8F5]/80 p-1 rounded-2xl border border-[#E8E2D9]">
              <button
                type="button"
                onClick={() => setViewMode('editor')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  viewMode === 'editor' ? 'bg-[#2C2A29] text-white shadow-xs' : 'text-[#8C857B] hover:text-[#2C2A29]'
                }`}
              >
                Editor výkonu
              </button>
              <button
                type="button"
                onClick={() => setViewMode('protocol')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  viewMode === 'protocol' ? 'bg-[#2C2A29] text-white shadow-xs' : 'text-[#8C857B] hover:text-[#2C2A29]'
                }`}
              >
                Protokol (A4)
              </button>
            </div>

            {/* ULOŽIŤ DO ZLOŽKY */}
            <button
              type="button"
              onClick={handleSaveProtocolToPatientFolder}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-[#C5A059] to-[#B38F46] hover:from-[#B38F46] hover:to-[#9E7B35] text-white text-xs font-semibold shadow-md shadow-[#C5A059]/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Uložiť do zložky</span>
            </button>
          </div>
        </div>

        {/* TIMELINE / LIŠTA SEDENÍ */}
        <div className="mt-4 pt-3 border-t border-[#E8E2D9]/70 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#8C857B] flex items-center gap-1 uppercase tracking-wider shrink-0">
              <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
              Sedenie:
            </span>

            <button
              type="button"
              onClick={() => handleSelectSession('current')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeSessionId === 'current'
                  ? 'bg-[#2C2A29] text-white shadow-sm ring-2 ring-[#C5A059]'
                  : 'bg-white/90 text-[#2C2A29] border border-[#E8E2D9] hover:border-[#C5A059]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Dnešné sedenie (Aktuálny protokol)</span>
            </button>

            {sessions.map((sess) => (
              <button
                key={sess.id}
                type="button"
                onClick={() => handleSelectSession(sess.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  activeSessionId === sess.id
                    ? 'bg-[#C5A059] text-white shadow-sm ring-2 ring-[#2C2A29]'
                    : 'bg-white/80 text-[#2C2A29] border border-[#E8E2D9] hover:bg-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{sess.formattedDate} - {sess.title}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              setActiveSessionId('current');
              setVectors([]);
              setBodyTreatments([]);
              setSelectedVectorId(null);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/90 border border-[#E8E2D9] hover:border-[#C5A059] text-[11px] font-bold text-[#2C2A29] shrink-0 transition-colors cursor-pointer"
            title="Nový prázdny protokol"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Nový protokol</span>
          </button>
        </div>
      </div>

      {/* HISTÓRIA DRAWER */}
      {showHistoryDrawer && (
        <div className="rounded-3xl p-5 bg-[#FAF8F5] border border-[#E8E2D9] shadow-inner space-y-3 print:hidden animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#C5A059]" />
              <h3 className="text-xs font-bold text-[#2C2A29] uppercase tracking-wider">
                Archív ošetrení: {currentPatient.name}
              </h3>
            </div>
            <button 
              type="button"
              onClick={() => setShowHistoryDrawer(false)}
              className="text-xs text-[#8C857B] hover:text-[#2C2A29] font-bold cursor-pointer"
            >
              ✕ Zavrieť
            </button>
          </div>

          {sessions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {sessions.map(sess => (
                <div 
                  key={sess.id} 
                  onClick={() => handleSelectSession(sess.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    activeSessionId === sess.id 
                      ? 'bg-white border-[#C5A059] shadow-md ring-2 ring-[#C5A059]/30' 
                      : 'bg-white/80 border-[#E8E2D9] hover:border-[#C5A059] shadow-2xs'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold text-white bg-[#C5A059]">
                      {sess.formattedDate}
                    </span>
                    <span className="text-[10px] font-mono text-[#8C857B]">{sess.protocolNumber}</span>
                  </div>
                  <p className="text-xs font-bold text-[#2C2A29]">{sess.title}</p>
                  <p className="text-[10px] text-[#8C857B]">{sess.notes || `${sess.vectors?.length || 0} vektorov, ${sess.bodyTreatments?.length || 0} telových zón`}</p>
                  <div className="pt-2 flex items-center justify-between border-t border-[#E8E2D9]/60">
                    <span className="text-[10px] text-[#C5A059] font-semibold flex items-center gap-1">
                      <Eye className="w-3 h-3" /> Načítať ošetrenie
                    </span>
                    <span className="text-[10px] font-mono font-bold text-[#2C2A29]">
                      {(sess.vectors?.length || 0) + (sess.bodyTreatments?.length || 0)} položiek
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#8C857B] text-center py-4 bg-white/60 rounded-xl border border-dashed border-[#E8E2D9]">
              Pre tohto pacienta zatiaľ nie sú zaznamenané žiadne predchádzajúce ošetrenia.
            </p>
          )}
        </div>
      )}

      {/* HLAVNÝ PREPÍNAČ MEDZI TVÁROU (2D SOCHA) A TELOM (OŠETRENIE TELA) */}
      {viewMode === 'editor' && (
        <div className="flex items-center gap-3 print:hidden">
          <button
            type="button"
            onClick={() => setActiveAreaMode('face')}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeAreaMode === 'face'
                ? 'bg-[#2C2A29] text-white shadow-lg shadow-black/10 ring-2 ring-[#C5A059]'
                : 'bg-white hover:bg-[#FAF8F5] text-[#2C2A29] border border-[#E8E2D9]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#C5A059]" />
            <span>Tvár, krk & dekolt (2D Socha & Pohľady)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white">
              {vectors.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAreaMode('body')}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeAreaMode === 'body'
                ? 'bg-[#2C2A29] text-white shadow-lg shadow-black/10 ring-2 ring-[#C5A059]'
                : 'bg-white hover:bg-[#FAF8F5] text-[#2C2A29] border border-[#E8E2D9]'
            }`}
          >
            <Activity className="w-4 h-4 text-[#10B981]" />
            <span>Ošetrenie tela (Telové protokoly & Biomateriály)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white">
              {bodyTreatments.length}
            </span>
          </button>
        </div>
      )}

      {/* REŽIM 1: TVÁR, KRK A DEKOLT (2D SOCHA SO VŠETKÝMI POHĽADMI) */}
      {viewMode === 'editor' && activeAreaMode === 'face' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
          
          {/* ĽAVÝ PANEL: PRÍPRAVKY & ŠABLÓNY PROCEDÚR (3 COLS) */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* PRÍPRAVOK A ŠARŽA (LOT) */}
            <div className="rounded-3xl p-5 backdrop-blur-2xl bg-white/80 border border-white/90 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#2C2A29] uppercase tracking-wider flex items-center gap-1.5">
                  <PackageCheck className="w-4 h-4 text-[#C5A059]" />
                  Aktívny prípravok
                </span>
                <span className="text-[10px] text-[#8C857B] font-mono">LOT Tracking</span>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-medium text-[#8C857B]">Prípravok zo skladu:</label>
                <select
                  value={selectedMaterialIdx}
                  onChange={(e) => {
                    const idx = Number(e.target.value);
                    setSelectedMaterialIdx(idx);
                    const mat = PRESET_MATERIALS[idx];
                    if (mat.type === 'threads') {
                      setActiveTool('threads');
                      setActiveColor('#8B5CF6');
                    } else if (mat.type === 'biostimulator') {
                      setActiveTool('fanning');
                      setActiveColor('#C5A059');
                    } else if (mat.type === 'botox') {
                      setActiveTool('point');
                      setActiveColor('#3B82F6');
                    } else {
                      setActiveTool('point');
                      setActiveColor('#EC4899');
                    }
                  }}
                  className="w-full text-xs font-medium p-2.5 rounded-xl bg-white border border-[#E8E2D9] text-[#2C2A29] focus:outline-hidden focus:border-[#C5A059] shadow-inner cursor-pointer"
                >
                  {PRESET_MATERIALS.map((mat, idx) => (
                    <option key={idx} value={idx}>
                      {mat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#8C857B]">Šarža (LOT):</span>
                  <span className="font-mono font-bold text-[#2C2A29]">{currentMaterial.lot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8C857B]">Expirácia:</span>
                  <span className="font-mono text-[#8C857B]">{currentMaterial.expiry}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8C857B]">Typ aplikácie:</span>
                  <span className="font-bold text-[#C5A059] capitalize">{currentMaterial.type}</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-[#E8E2D9]/80 text-[11px] text-[#8C857B] space-y-1">
                <p className="font-bold text-[#2C2A29]">💡 Viacpohľadová 2D socha:</p>
                <p>1. Prepínajte hore medzi <strong className="text-[#2C2A29]">Čelným pohľadom, Profilom (Ľ/P)</strong> a <strong className="text-[#2C2A29]">3/4 pohľadom</strong>.</p>
                <p>2. Preťahovaním myšou (alebo nástrojom <strong>Posun / Ruka</strong>) môžete obraz posúvať a kolieskom / lupou zoomovať.</p>
                <p>3. Každý pohľad má vrstvy pre Dysport, Restylane Kysse, Profhilo a Radiesse.</p>
              </div>
            </div>

            {/* ANATOMICKÉ & VLASTNÉ ŠABLÓNY PROCEDÚR */}
            <div className="rounded-3xl p-5 backdrop-blur-2xl bg-white/80 border border-white/90 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#2C2A29] uppercase tracking-wider flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4 text-[#C5A059]" />
                  Šablóny procedúr
                </span>
                <span className="text-[10px] font-bold text-[#8C857B] bg-[#FAF8F5] px-2 py-0.5 rounded-full border border-[#E8E2D9]">
                  {allTemplates.length} celkom
                </span>
              </div>

              {/* TLAČIDLO: ULOŽIŤ AKTUÁLNY NÁKRES AKO NOVÚ VLASTNÚ ŠABLÓNU */}
              <button
                type="button"
                onClick={handleOpenSaveTemplateModal}
                className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-[#2C2A29] to-[#3D3A38] hover:from-[#C5A059] hover:to-[#B38F48] text-white text-xs font-bold transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer group"
                title="Uložiť nakreslené body a vektory ako novú opakovateľnú šablónu"
              >
                <BookmarkPlus className="w-4 h-4 text-[#F5E4B8] group-hover:text-white transition-colors" />
                <span>Uložiť nákres ako šablónu</span>
              </button>

              {/* FILTER PRE ŠABLÓNY */}
              <div className="flex items-center p-1 bg-[#FAF8F5] rounded-xl border border-[#E8E2D9] gap-1 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setTemplateFilter('all')}
                  className={`flex-1 py-1 rounded-lg transition-all cursor-pointer text-center ${
                    templateFilter === 'all'
                      ? 'bg-white text-[#2C2A29] shadow-2xs'
                      : 'text-[#8C857B] hover:text-[#2C2A29]'
                  }`}
                >
                  Všetky ({allTemplates.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateFilter('custom')}
                  className={`flex-1 py-1 rounded-lg transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
                    templateFilter === 'custom'
                      ? 'bg-[#C5A059] text-white shadow-2xs'
                      : 'text-[#8C857B] hover:text-[#2C2A29]'
                  }`}
                >
                  <Star className="w-2.5 h-2.5" />
                  <span>Vlastné ({customTemplates.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateFilter('standard')}
                  className={`flex-1 py-1 rounded-lg transition-all cursor-pointer text-center ${
                    templateFilter === 'standard'
                      ? 'bg-white text-[#2C2A29] shadow-2xs'
                      : 'text-[#8C857B] hover:text-[#2C2A29]'
                  }`}
                >
                  Štandard ({PRESET_PROCEDURES.length})
                </button>
              </div>

              {/* ZOZNAM ŠABLÓN */}
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {displayedTemplates.length > 0 ? (
                  displayedTemplates.map((template) => {
                    const viewsUsed = Array.from(new Set(template.vectors.map(v => v.view)));
                    return (
                      <div
                        key={template.id}
                        className={`p-3 rounded-2xl bg-white hover:bg-[#FAF8F5] border transition-all shadow-2xs relative group ${
                          template.isCustom 
                            ? 'border-[#C5A059]/40 hover:border-[#C5A059]' 
                            : 'border-[#E8E2D9] hover:border-[#C5A059]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-[#2C2A29] group-hover:text-[#C5A059] transition-colors line-clamp-1">
                                {template.title}
                              </span>
                              {template.isCustom && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-[#F5E4B8] text-[#856404] border border-[#E8E2D9]">
                                  ★ Vlastná
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-[#8C857B] mt-0.5 line-clamp-2">
                              {template.description}
                            </p>
                          </div>

                          <span
                            style={{ backgroundColor: `${template.color}20`, color: template.color }}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 font-mono"
                          >
                            +{template.vectors.length}
                          </span>
                        </div>

                        {/* ZOBRAZENÉ POHĽADY & AKČNÉ TLAČIDLÁ */}
                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[#E8E2D9]/70 text-[9px]">
                          <div className="flex items-center gap-1 text-[#8C857B] font-medium flex-wrap">
                            <span>Pohľady:</span>
                            {viewsUsed.map(v => (
                              <span key={v} className="px-1.5 py-0.2 rounded bg-[#FAF8F5] border border-[#E8E2D9] uppercase font-mono text-[8px]">
                                {v === 'front' ? 'Čelo' : v === 'profile_left' ? 'Ľ.Profil' : v === 'profile_right' ? 'P.Profil' : '3/4'}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center gap-1">
                            {template.isCustom && (
                              <button
                                type="button"
                                onClick={(e) => handleDeleteCustomTemplate(template.id, e)}
                                className="p-1 rounded-lg text-[#8C857B] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Vymazať túto vlastnú šablónu"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleApplyTemplate(template, 'append')}
                              className="px-2 py-1 rounded-lg bg-[#2C2A29] hover:bg-[#C5A059] text-white font-bold transition-colors cursor-pointer flex items-center gap-1 text-[10px]"
                              title="Pridať vektory šablóny k aktuálnemu nákresu"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Pridať</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (vectors.length === 0 || confirm('Nahradiť všetky aktuálne nákresy touto šablónou?')) {
                                  handleApplyTemplate(template, 'replace');
                                }
                              }}
                              className="px-2 py-1 rounded-lg bg-white hover:bg-[#F3EEE7] text-[#2C2A29] border border-[#E8E2D9] hover:border-[#C5A059] font-bold transition-colors cursor-pointer flex items-center gap-1 text-[10px]"
                              title="Vyčistiť plátno a nahradiť touto šablónou"
                            >
                              <RotateCcw className="w-3 h-3 text-[#8C857B]" />
                              <span>Nahradiť</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-6 text-center text-xs text-[#8C857B] bg-[#FAF8F5] rounded-2xl border border-dashed border-[#E8E2D9] space-y-1">
                    <p className="font-bold text-[#2C2A29]">Žiadne šablóny v tejto kategórii</p>
                    <p className="text-[10px]">
                      {templateFilter === 'custom' 
                        ? 'Nakreslite body na 2D sochu a kliknite na "Uložiť nákres ako šablónu".' 
                        : 'Vyberte inú kategóriu hore.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* STREDNÝ PANEL: 2D SOCHA A KRESLENIE (6 COLS) */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="w-full rounded-3xl p-6 backdrop-blur-3xl bg-white/85 border border-white shadow-[0_12px_40px_0_rgba(197,160,89,0.12)] relative flex flex-col items-center">
              
              {/* ŠTATISTICKÝ SUMÁR */}
              <div className="w-full flex items-center justify-between pb-4 border-b border-[#E8E2D9]/70 mb-4 gap-2">
                <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
                    <span className="text-[11px] font-bold text-[#2C2A29]">{countPoints} mikrovpichov (Toxín/Pery/BAP)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
                    <span className="text-[11px] font-bold text-[#2C2A29]">{countFanning} vejárov (Radiesse/Sculptra)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#EC4899]" />
                    <span className="text-[11px] font-bold text-[#2C2A29]">{countThreads} lineárnych vektorov</span>
                  </div>
                </div>

                <span className="text-[10px] uppercase font-bold text-[#C5A059] bg-[#C5A059]/10 px-2.5 py-1 rounded-xl">
                  2D Sculpture Engine
                </span>
              </div>

              {/* 2D SCULPTURE VIEWER */}
              <Sculpture2DViewer
                vectors={vectors}
                onVectorsChange={setVectors}
                activeTool={activeTool}
                onSelectTool={setActiveTool}
                activeColor={activeColor}
                onSelectColor={setActiveColor}
                currentProduct={currentMaterial}
                selectedVectorId={selectedVectorId}
                onSelectVector={setSelectedVectorId}
                activeView={activeSculptureView}
                onViewChange={setActiveSculptureView}
              />

              {/* LEGENDA */}
              <div className="w-full flex items-center justify-between text-[11px] text-[#8C857B] mt-4 pt-3 border-t border-[#E8E2D9]/70 flex-wrap gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1 font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#3B82F6]" /> Dysport / Alluzience
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#EC4899]" /> Restylane Kysse
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#06B6D4]" /> Profhilo 5 BAP
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#D97706]" /> Radiesse / Sculptra
                  </span>
                </div>
                <span className="font-serif italic text-xs">SAY CLINIC Aesthetic Sculpture</span>
              </div>
            </div>
          </div>

          {/* PRAVÝ PANEL: DETAIL NÁKRESU & ZOZNAM VŠETKÝCH VEKTOROV (3 COLS) */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* DETAIL ZVOLENÉHO VEKTORU */}
            {activeVector ? (
              <div className="rounded-3xl p-5 backdrop-blur-2xl bg-white/80 border border-white/90 shadow-md space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#2C2A29] uppercase tracking-wider">
                    Detail vektoru / nite
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setVectors(vectors.filter(v => v.id !== activeVector.id));
                      setSelectedVectorId(null);
                    }}
                    className="p-1 rounded-lg text-red-500 hover:bg-red-50 transition-colors text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Zmazať
                  </button>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-[#8C857B]">Pohľad:</label>
                    <div className="text-xs font-bold text-[#2C2A29] bg-[#FAF8F5] p-1.5 rounded-lg border border-[#E8E2D9]">
                      {VIEW_CONFIGS.find(v => v.id === activeVector.view)?.label || activeVector.view}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-[#8C857B]">Názov zóny / vektoru:</label>
                    <input
                      type="text"
                      value={activeVector.zoneName}
                      onChange={(e) => {
                        const updated = vectors.map(v => v.id === activeVector.id ? { ...v, zoneName: e.target.value } : v);
                        setVectors(updated);
                      }}
                      className="w-full text-xs font-semibold p-2 rounded-xl bg-white border border-[#E8E2D9] text-[#2C2A29] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[#8C857B]">Použitý materiál:</label>
                    <input
                      type="text"
                      value={activeVector.productName}
                      onChange={(e) => {
                        const updated = vectors.map(v => v.id === activeVector.id ? { ...v, productName: e.target.value } : v);
                        setVectors(updated);
                      }}
                      className="w-full text-xs p-2 rounded-xl bg-white border border-[#E8E2D9] text-[#2C2A29] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[#8C857B]">Špecifikácia / Dĺžka nite / Objem:</label>
                    <textarea
                      rows={2}
                      value={activeVector.details}
                      onChange={(e) => {
                        const updated = vectors.map(v => v.id === activeVector.id ? { ...v, details: e.target.value } : v);
                        setVectors(updated);
                      }}
                      className="w-full text-xs p-2 rounded-xl bg-white border border-[#E8E2D9] text-[#2C2A29] focus:outline-hidden resize-none"
                    />
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[10px] font-mono space-y-1">
                    <p><span className="text-[#8C857B]">Šarža:</span> {activeVector.lotNumber}</p>
                    <p><span className="text-[#8C857B]">Typ:</span> {activeVector.type}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl p-6 backdrop-blur-2xl bg-white/50 border border-white/60 text-center text-xs text-[#8C857B]">
                Kliknite na ktorýkoľvek vektor alebo niť na plátne pre úpravu podrobností.
              </div>
            )}

            {/* ZOZNAM VEKTOROV VŠETKÝCH POHĽADOV */}
            <div className="rounded-3xl p-5 backdrop-blur-2xl bg-white/80 border border-white/90 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#2C2A29] uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#C5A059]" />
                  Všetky vektory ({vectors.length})
                </span>
                <button
                  type="button"
                  onClick={() => setVectors([])}
                  className="text-[10px] text-red-500 hover:underline cursor-pointer"
                >
                  Vymazať všetko
                </button>
              </div>

              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {vectors.map((vec) => (
                  <div
                    key={vec.id}
                    onClick={() => {
                      setSelectedVectorId(vec.id);
                      setActiveSculptureView(vec.view);
                    }}
                    className={`p-2.5 rounded-2xl text-xs flex items-center justify-between cursor-pointer transition-all ${
                      vec.id === selectedVectorId
                        ? 'bg-[#2C2A29] text-white shadow-md'
                        : 'bg-white/80 hover:bg-white text-[#2C2A29] border border-[#E8E2D9]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span 
                        style={{ backgroundColor: vec.color }} 
                        className="w-3 h-3 rounded-full shrink-0 shadow-xs" 
                      />
                      <div className="truncate">
                        <p className="font-semibold truncate">{vec.zoneName}</p>
                        <p className={`text-[10px] truncate ${vec.id === selectedVectorId ? 'text-gray-300' : 'text-[#8C857B]'}`}>
                          {VIEW_CONFIGS.find(v => v.id === vec.view)?.shortLabel} • {vec.productName}
                        </p>
                      </div>
                    </div>

                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-lg shrink-0 ${
                      vec.id === selectedVectorId ? 'bg-white/20 text-white' : 'bg-[#FAF8F5] text-[#8C857B]'
                    }`}>
                      {vec.type}
                    </span>
                  </div>
                ))}

                {vectors.length === 0 && (
                  <p className="text-xs text-[#8C857B] text-center py-6">
                    Zatiaľ neboli nakreslené žiadne vektory ani nite.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REŽIM 2: OŠETRENIE TELA (TELOVÉ PROTOKOLY & BIOMATERIÁLY) */}
      {viewMode === 'editor' && activeAreaMode === 'body' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
          
          {/* ĽAVÝ PANEL: FORMULÁR PRE PRIDANIE TELOVÉHO OŠETRENIA (5 COLS) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-3xl p-6 backdrop-blur-3xl bg-white/85 border border-white shadow-[0_12px_40px_0_rgba(197,160,89,0.12)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D9]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#10B981]/15 text-[#10B981] flex items-center justify-center font-bold">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#2C2A29]">Nové ošetrenie tela</h3>
                    <p className="text-[11px] text-[#8C857B]">Zadajte zónu, materiál a aplikačný protokol</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-[#FAF8F5] text-[#8C857B] border border-[#E8E2D9]">
                  Body Protocol
                </span>
              </div>

              {/* 1. VÝBER TELOVEJ ZÓNY */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#2C2A29]">1. Anatomická telová zóna:</label>
                <select
                  value={newBodyZone}
                  onChange={(e) => setNewBodyZone(e.target.value)}
                  className="w-full text-xs font-medium p-3 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2C2A29] focus:outline-hidden focus:border-[#C5A059] shadow-inner cursor-pointer"
                >
                  {BODY_ZONES.map((zone, idx) => (
                    <option key={idx} value={zone}>
                      {zone}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. VÝBER PROCEDÚRY & TECHNOLÓGIE */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#2C2A29]">2. Procedúra & Biomateriál:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {BODY_PROCEDURES.map((proc, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setNewBodyProcedureIdx(idx);
                        setNewBodyTechnique(proc.defaultTechnique);
                      }}
                      className={`p-2.5 rounded-2xl text-left border transition-all cursor-pointer ${
                        newBodyProcedureIdx === idx
                          ? 'bg-[#2C2A29] text-white border-[#2C2A29] shadow-md'
                          : 'bg-white hover:bg-[#FAF8F5] text-[#2C2A29] border-[#E8E2D9]'
                      }`}
                    >
                      <p className="text-xs font-bold">{proc.name}</p>
                      <p className={`text-[10px] truncate ${newBodyProcedureIdx === idx ? 'text-gray-300' : 'text-[#8C857B]'}`}>
                        {proc.defaultProduct}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. DÁVKA, ŠARŽA & TECHNIKA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#8C857B]">Dávka / Objem / Počet:</label>
                  <input
                    type="text"
                    value={newBodyDosage}
                    onChange={(e) => setNewBodyDosage(e.target.value)}
                    placeholder="napr. 2 ampulky (40ml) alebo 10ml"
                    className="w-full text-xs p-2.5 rounded-xl bg-white border border-[#E8E2D9] text-[#2C2A29] focus:outline-hidden focus:border-[#C5A059]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#8C857B]">Šarža prípravku (LOT):</label>
                  <input
                    type="text"
                    value={newBodyLot}
                    onChange={(e) => setNewBodyLot(e.target.value)}
                    className="w-full text-xs font-mono font-bold p-2.5 rounded-xl bg-white border border-[#E8E2D9] text-[#2C2A29] focus:outline-hidden focus:border-[#C5A059]"
                  />
                </div>
              </div>

              {/* 4. APLIKAČNÁ TECHNIKA & HĹBKA */}
              <div>
                <label className="text-[11px] font-bold text-[#8C857B]">Aplikačná technika & Kanyla/Ihla:</label>
                <input
                  type="text"
                  value={newBodyTechnique}
                  onChange={(e) => setNewBodyTechnique(e.target.value)}
                  placeholder="napr. Kanyla 18G/70mm vějířovitě, hĺbka 6mm"
                  className="w-full text-xs p-2.5 rounded-xl bg-white border border-[#E8E2D9] text-[#2C2A29] focus:outline-hidden focus:border-[#C5A059]"
                />
              </div>

              {/* 5. POZNÁMKY LEKÁRA */}
              <div>
                <label className="text-[11px] font-bold text-[#8C857B]">Lekárske poznámky & Lokalizácia:</label>
                <textarea
                  rows={2}
                  value={newBodyNotes}
                  onChange={(e) => setNewBodyNotes(e.target.value)}
                  placeholder="napr. Ošetrenie ľavej a pravej strany symetricky, bez nežiaducich reakcií..."
                  className="w-full text-xs p-2.5 rounded-xl bg-white border border-[#E8E2D9] text-[#2C2A29] focus:outline-hidden resize-none"
                />
              </div>

              {/* TLAČIDLO PRIDAŤ OŠETRENIE */}
              <button
                type="button"
                onClick={handleAddBodyTreatment}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Pridať ošetrenie tela do protokolu</span>
              </button>
            </div>
          </div>

          {/* PRAVÝ PANEL: ZOZNAM APLIKOVANÝCH TELOVÝCH OŠETRENÍ (7 COLS) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-3xl p-6 backdrop-blur-3xl bg-white/85 border border-white shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D9]">
                <div>
                  <h3 className="text-sm font-bold text-[#2C2A29] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#10B981]" />
                    Vykonané a naplánované telové ošetrenia ({bodyTreatments.length})
                  </h3>
                  <p className="text-[11px] text-[#8C857B]">
                    Prehľad telových biomateriálov a protokolov pacienta {currentPatient.name}
                  </p>
                </div>
                {bodyTreatments.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setBodyTreatments([])}
                    className="text-xs text-red-500 hover:underline cursor-pointer"
                  >
                    Vyčistiť zoznam
                  </button>
                )}
              </div>

              {bodyTreatments.length > 0 ? (
                <div className="space-y-3">
                  {bodyTreatments.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] hover:border-[#C5A059] transition-all space-y-2 relative group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-[#2C2A29] text-white text-[11px] font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059]">
                              {item.procedureName}
                            </span>
                            <h4 className="text-xs font-bold text-[#2C2A29]">{item.zone}</h4>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setBodyTreatments(bodyTreatments.filter(b => b.id !== item.id))}
                          className="p-1 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 opacity-80 group-hover:opacity-100 transition-all cursor-pointer"
                          title="Odstrániť ošetrenie"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-[#E8E2D9]/70 text-[11px]">
                        <div>
                          <span className="text-[#8C857B] block text-[9px] uppercase font-bold">Prípravok & LOT:</span>
                          <span className="font-medium text-[#2C2A29]">{item.productName}</span>
                          <span className="font-mono text-[#C5A059] block text-[10px]">{item.lotNumber}</span>
                        </div>
                        <div>
                          <span className="text-[#8C857B] block text-[9px] uppercase font-bold">Dávka / Objem:</span>
                          <span className="font-bold text-[#2C2A29]">{item.dosage}</span>
                        </div>
                        <div>
                          <span className="text-[#8C857B] block text-[9px] uppercase font-bold">Technika:</span>
                          <span className="text-[#2C2A29]">{item.technique}</span>
                        </div>
                      </div>

                      {item.notes && (
                        <div className="p-2.5 rounded-xl bg-white border border-[#E8E2D9] text-[11px] text-[#8C857B]">
                          <strong className="text-[#2C2A29]">Poznámka:</strong> {item.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-[#8C857B] bg-[#FAF8F5] rounded-2xl border border-dashed border-[#E8E2D9] space-y-2">
                  <Activity className="w-8 h-8 text-[#C5A059]/50 mx-auto" />
                  <p className="font-bold text-[#2C2A29]">Zatiaľ nebolo pridané žiadne telové ošetrenie.</p>
                  <p className="text-[11px] max-w-sm mx-auto">
                    Použite formulár vľavo pre pridanie Sculptra Body, lipolýzy alebo spevnenia tela do dnešného protokolu.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LEKÁRSKY PROTOKOL (PRE TLAČ NA A4) */}
      {viewMode === 'protocol' && (
        <div className="max-w-4xl mx-auto rounded-3xl p-8 backdrop-blur-3xl bg-white/90 border border-white shadow-xl space-y-6 print:p-0 print:border-none print:shadow-none print:bg-white">
          
          <div id="printable-a4" className="printable-document bg-white p-8 sm:p-10 border border-[#E8E2D9] rounded-2xl shadow-sm text-xs leading-relaxed space-y-6 print:border-none print:shadow-none print:p-0">
            {/* HLAVIČKA */}
            <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-6">
              <div>
                <div className="text-2xl font-serif font-bold tracking-widest text-[#2C2A29]">
                  SAY CLINIC
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A059] font-bold mt-0.5">
                  PLASTICKÁ CHIRURGIA & DERMATOLÓGIA
                </div>
                <p className="text-[10px] text-[#8C857B] mt-1">Lazovná 43, 974 01 Banská Bystrica • www.sayclinic.sk</p>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-[#2C2A29]">Dátum: {new Date().toLocaleDateString('sk-SK')}</div>
                <div className="text-[10px] text-[#8C857B] font-mono">Číslo záznamu: {protocolRecordNo}</div>
              </div>
            </div>

            {/* PACIENT & LEKÁR */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] text-xs">
              <div>
                <p className="text-[10px] text-[#8C857B] uppercase font-bold">Pacient / Klient:</p>
                <p className="font-bold text-[#2C2A29] text-sm">{currentPatient.name}</p>
                <p className="text-[#8C857B]">Rodné číslo: {currentPatient.birthNumber || currentPatient.dob}</p>
                <p className="text-[#8C857B]">Poisťovňa: {currentPatient.insurance}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#8C857B] uppercase font-bold">Ošetrujúci lekár & pracovisko:</p>
                <p className="font-bold text-[#2C2A29] text-sm">MUDr. Ján Mráz</p>
                <p className="text-[#8C857B]">SAY CLINIC Banská Bystrica</p>
                <p className="text-[#8C857B]">Výkon: Aplikácia botulotoxínu, kyseliny hyalurónovej, biostimulátorov & telových procedúr</p>
              </div>
            </div>

            {/* SÚHRN */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] text-center">
                <span className="text-[10px] text-[#8C857B] uppercase font-bold">Bodové mikroinjekcie:</span>
                <p className="text-sm font-bold font-mono text-[#3B82F6]">{countPoints} bodov</p>
              </div>
              <div className="p-3 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] text-center">
                <span className="text-[10px] text-[#8C857B] uppercase font-bold">Biostimulácia / Vejáre:</span>
                <p className="text-sm font-bold font-mono text-[#D97706]">{countFanning} zón</p>
              </div>
              <div className="p-3 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] text-center">
                <span className="text-[10px] text-[#8C857B] uppercase font-bold">Ošetrenia tela:</span>
                <p className="text-sm font-bold font-mono text-[#10B981]">{bodyTreatments.length} výkonov</p>
              </div>
            </div>

            {/* 1. SEKCIA: TVÁR A KRK (VEKTORY) */}
            {vectors.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C2A29] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
                  1. Ošetrenie tváre, krku a dekoltu (Vektorové mapovanie & LOT):
                </h3>
                <div className="border border-[#E8E2D9] rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#FAF8F5] text-[#8C857B] font-bold border-b border-[#E8E2D9]">
                      <tr>
                        <th className="p-3">Pohľad & Zóna</th>
                        <th className="p-3">Použitý materiál</th>
                        <th className="p-3">Šarža (LOT)</th>
                        <th className="p-3">Špecifikácia / Dĺžka</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E2D9]/60">
                      {vectors.map((vec, idx) => (
                        <tr key={idx} className="hover:bg-white/60">
                          <td className="p-3 font-semibold text-[#2C2A29]">
                            <span className="uppercase text-[9px] font-bold text-[#8C857B] block">
                              {VIEW_CONFIGS.find(v => v.id === vec.view)?.shortLabel || vec.view} • {vec.type}
                            </span>
                            {vec.zoneName}
                          </td>
                          <td className="p-3 text-[#2C2A29]">{vec.productName}</td>
                          <td className="p-3 font-mono font-medium text-[#C5A059]">{vec.lotNumber}</td>
                          <td className="p-3 text-[#8C857B]">{vec.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. SEKCIA: OŠETRENIE TELA */}
            {bodyTreatments.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C2A29] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                  2. Ošetrenie tela (Telové protokoly & Biomateriály):
                </h3>
                <div className="border border-[#E8E2D9] rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#FAF8F5] text-[#8C857B] font-bold border-b border-[#E8E2D9]">
                      <tr>
                        <th className="p-3">Telová zóna</th>
                        <th className="p-3">Procedúra & Materiál</th>
                        <th className="p-3">Šarža (LOT)</th>
                        <th className="p-3">Dávka / Technika</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E2D9]/60">
                      {bodyTreatments.map((b, idx) => (
                        <tr key={idx} className="hover:bg-white/60">
                          <td className="p-3 font-semibold text-[#2C2A29]">
                            {b.zone}
                          </td>
                          <td className="p-3 text-[#2C2A29]">
                            <span className="font-bold block">{b.procedureName}</span>
                            <span className="text-[10px] text-[#8C857B]">{b.productName}</span>
                          </td>
                          <td className="p-3 font-mono font-medium text-[#C5A059]">{b.lotNumber}</td>
                          <td className="p-3 text-[#8C857B]">
                            <span className="font-bold text-[#2C2A29] block">{b.dosage}</span>
                            <span>{b.technique}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* PODPIS */}
            <div className="mt-12 pt-8 border-t border-[#E8E2D9] flex justify-between items-end text-[10px] text-[#8C857B]">
              <div>
                <p className="font-bold text-[#C5A059] mb-0.5">SAY CLINIC Aesthetic Protocol</p>
                <p>Lazovná 43, 974 01 Banská Bystrica</p>
              </div>
              <div className="text-center">
                <div className="w-44 border-b border-[#2C2A29] mb-2" />
                <span className="font-bold text-[#2C2A29]">MUDr. Ján Mráz</span><br />
                Pečiatka a podpis lekára
              </div>
            </div>
          </div>

          {/* OVLÁDACIA LIŠTA PROTOKOLU */}
          <div className="flex items-center justify-between pt-2 border-t border-[#E8E2D9] print:hidden">
            <button
              type="button"
              onClick={() => setViewMode('editor')}
              className="text-xs text-[#8C857B] hover:text-[#2C2A29] font-medium cursor-pointer"
            >
              ← Späť do editora
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#E8E2D9] hover:border-[#C5A059] text-xs font-semibold text-[#2C2A29] shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Tlačiť protokol (A4)
              </button>
              <button
                type="button"
                onClick={handleSaveProtocolToPatientFolder}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#2C2A29] hover:bg-[#C5A059] text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" /> Uložiť do zložky pacienta
              </button>
            </div>
          </div>

        </div>
      )}

      {/* MODAL: ULOŽIŤ NOVÚ VLASTNÚ ŠABLÓNU */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-150">
            {/* HLAVIČKA MODALU */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D9]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#C5A059]">
                  <BookmarkPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2C2A29]">Uložiť vlastnú šablónu</h3>
                  <p className="text-[11px] text-[#8C857B]">Vytvorte si opakovateľnú schému pre rýchlu aplikáciu</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="p-1.5 rounded-xl hover:bg-[#FAF8F5] text-[#8C857B] hover:text-[#2C2A29] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FORMULÁR */}
            <form onSubmit={handleSaveCustomTemplate} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#2C2A29] mb-1">
                  Názov šablóny <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={templateFormTitle}
                  onChange={(e) => setTemplateFormTitle(e.target.value)}
                  placeholder="napr. MUDr. Mráz – Full Face Lifting & Toxín"
                  className="w-full p-2.5 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] focus:bg-white focus:outline-hidden focus:border-[#C5A059] font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#2C2A29] mb-1">
                  Popis / Klinická indikácia
                </label>
                <textarea
                  rows={2}
                  value={templateFormDesc}
                  onChange={(e) => setTemplateFormDesc(e.target.value)}
                  placeholder="napr. Kombinovaný protokol: čelo a glabela toxín + kanyla jawline"
                  className="w-full p-2.5 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] focus:bg-white focus:outline-hidden focus:border-[#C5A059] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#2C2A29] mb-1">
                    Predvolený produkt
                  </label>
                  <input
                    type="text"
                    value={templateFormProduct}
                    onChange={(e) => setTemplateFormProduct(e.target.value)}
                    placeholder="napr. Radiesse + Dysport"
                    className="w-full p-2.5 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] focus:bg-white focus:outline-hidden focus:border-[#C5A059]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#2C2A29] mb-1">
                    Číslo šarže (LOT)
                  </label>
                  <input
                    type="text"
                    value={templateFormLot}
                    onChange={(e) => setTemplateFormLot(e.target.value)}
                    placeholder="napr. LOT-CUSTOM-01"
                    className="w-full p-2.5 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] focus:bg-white focus:outline-hidden focus:border-[#C5A059] font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* ROZSAH ULOŽENIA */}
              <div>
                <label className="block text-[11px] font-bold text-[#2C2A29] mb-1.5">
                  Rozsah ukladania vektorov:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className={`p-2.5 rounded-xl border cursor-pointer flex flex-col gap-0.5 transition-all ${
                    templateFormScope === 'all' 
                      ? 'bg-[#FAF8F5] border-[#C5A059] ring-1 ring-[#C5A059]' 
                      : 'bg-white border-[#E8E2D9] hover:border-gray-300'
                  }`}>
                    <div className="flex items-center gap-1.5 font-bold text-[#2C2A29]">
                      <input
                        type="radio"
                        name="templateScope"
                        checked={templateFormScope === 'all'}
                        onChange={() => setTemplateFormScope('all')}
                        className="text-[#C5A059] focus:ring-[#C5A059]"
                      />
                      <span>Všetky pohľady</span>
                    </div>
                    <span className="text-[10px] text-[#8C857B] pl-5">
                      Všetkých {vectors.length} vektorov
                    </span>
                  </label>

                  <label className={`p-2.5 rounded-xl border cursor-pointer flex flex-col gap-0.5 transition-all ${
                    templateFormScope === 'current_view' 
                      ? 'bg-[#FAF8F5] border-[#C5A059] ring-1 ring-[#C5A059]' 
                      : 'bg-white border-[#E8E2D9] hover:border-gray-300'
                  }`}>
                    <div className="flex items-center gap-1.5 font-bold text-[#2C2A29]">
                      <input
                        type="radio"
                        name="templateScope"
                        checked={templateFormScope === 'current_view'}
                        onChange={() => setTemplateFormScope('current_view')}
                        className="text-[#C5A059] focus:ring-[#C5A059]"
                      />
                      <span>Iba aktuálny pohľad</span>
                    </div>
                    <span className="text-[10px] text-[#8C857B] pl-5">
                      {vectors.filter(v => v.view === activeSculptureView).length} vektorov ({activeSculptureView})
                    </span>
                  </label>
                </div>
              </div>

              {/* VÝBER FARBY PRE ŠABLÓNU */}
              <div>
                <label className="block text-[11px] font-bold text-[#2C2A29] mb-1.5">
                  Farba štítku šablóny:
                </label>
                <div className="flex items-center gap-2">
                  {[
                    { color: '#C5A059', name: 'Zlatá' },
                    { color: '#3B82F6', name: 'Modrá' },
                    { color: '#EC4899', name: 'Ružová' },
                    { color: '#10B981', name: 'Zelená' },
                    { color: '#D97706', name: 'Jantárová' },
                    { color: '#8B5CF6', name: 'Fialová' },
                    { color: '#2C2A29', name: 'Tmavá' }
                  ].map(c => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => setTemplateFormColor(c.color)}
                      style={{ backgroundColor: c.color }}
                      className={`w-6 h-6 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                        templateFormColor === c.color ? 'scale-125 ring-2 ring-[#2C2A29] ring-offset-1' : 'hover:scale-110'
                      }`}
                      title={c.name}
                    >
                      {templateFormColor === c.color && <Check className="w-3 h-3 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* TLAČIDLÁ MODALU */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E8E2D9]">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8C857B] hover:bg-[#FAF8F5] hover:text-[#2C2A29] transition-colors cursor-pointer"
                >
                  Zrušiť
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#2C2A29] hover:bg-[#C5A059] text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Uložiť šablónu</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST FEEDBACK */}
      {templateSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#2C2A29] text-white px-4 py-3 rounded-2xl border border-[#C5A059] shadow-2xl flex items-center gap-2.5 text-xs font-medium animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-[#C5A059]" />
          <span>{templateSuccessToast}</span>
        </div>
      )}
    </div>
  );
}
