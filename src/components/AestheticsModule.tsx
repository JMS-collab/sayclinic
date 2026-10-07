'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Printer, 
  Download, 
  Save, 
  User, 
  History, 
  CheckCircle2, 
  Clock, 
  ArrowLeft, 
  Trash2, 
  Calendar, 
  DollarSign, 
  FileText, 
  Check, 
  RotateCcw, 
  ShieldCheck,
  Eye,
  Plus,
  Bookmark,
  BookmarkPlus,
  Star,
  X,
  Pencil,
  Settings,
  Percent,
  Tag,
  RefreshCw,
  Layers
} from 'lucide-react';
import { Patient, MedicalRecord } from './PatientDatabase';
import { InventoryService } from '../services/inventoryService';
import { exportElementToPdf, generatePdfFilename } from '../lib/pdfGenerator';
import { 
  Sculpture2DViewer, 
  Vector2DItem, 
  SculptureViewType, 
  DrawingToolType 
} from './Sculpture2DViewer';

export interface AestheticMaterial {
  id: string;
  name: string;
  type: 'botox' | 'filler' | 'meso' | 'biostimulator';
  categoryLabel: string;
  lot: string;
  color: string;
  defaultUnit: string;
  defaultUnits: number;
  defaultPrice: number;
  recommendedTechnique: string;
}

export const PRESET_MATERIALS: AestheticMaterial[] = [
  {
    id: 'dysport',
    name: 'Dysport 300IU',
    type: 'botox',
    categoryLabel: 'Botulotoxín A',
    lot: 'DYSP-4412B',
    color: '#3B82F6',
    defaultUnit: 'Speywood',
    defaultUnits: 10,
    defaultPrice: 120,
    recommendedTechnique: 'Intramuskulárne mikrovpichy'
  },
  {
    id: 'alluzience',
    name: 'Alluzience 200U',
    type: 'botox',
    categoryLabel: 'Tekutý neurotoxín',
    lot: 'ALL-2026-771',
    color: '#3B82F6',
    defaultUnit: 'Speywood',
    defaultUnits: 10,
    defaultPrice: 140,
    recommendedTechnique: 'Presné subkutánne/IM vpichy'
  },
  {
    id: 'restylane_kysse',
    name: 'Restylane Kysse 1ml',
    type: 'filler',
    categoryLabel: 'Výplň pier (HA)',
    lot: 'RST-KYS-993A',
    color: '#EC4899',
    defaultUnit: 'ml',
    defaultUnits: 0.1,
    defaultPrice: 340,
    recommendedTechnique: 'OBT mikrodepozity kontúry a tela pier'
  },
  {
    id: 'juvederm_voluma',
    name: 'Juvederm Voluma 1ml',
    type: 'filler',
    categoryLabel: 'Objemová výplň (HA)',
    lot: 'JUV-VOL-8812',
    color: '#EC4899',
    defaultUnit: 'ml',
    defaultUnits: 0.2,
    defaultPrice: 340,
    recommendedTechnique: 'Bolus na periost / kanyla líca a brada'
  },
  {
    id: 'profhilo',
    name: 'Profhilo H+L 2ml',
    type: 'meso',
    categoryLabel: 'Bioremodelácia',
    lot: 'PRO-2ML-881',
    color: '#10B981',
    defaultUnit: 'ml',
    defaultUnits: 0.2,
    defaultPrice: 290,
    recommendedTechnique: '5-bodová BAP technika (Bio Aesthetic Points)'
  },
  {
    id: 'radiesse',
    name: 'Radiesse (+) 1.5ml',
    type: 'biostimulator',
    categoryLabel: 'CaHA Vektoring',
    lot: 'RAD-150-332',
    color: '#D97706',
    defaultUnit: 'ml',
    defaultUnits: 0.3,
    defaultPrice: 420,
    recommendedTechnique: 'Kanylový vějířovitý vektoring'
  },
  {
    id: 'sculptra',
    name: 'Sculptra 10ml',
    type: 'biostimulator',
    categoryLabel: 'PLLA Neokolagenéza',
    lot: 'SCL-2026-881A',
    color: '#C5A059',
    defaultUnit: 'ml',
    defaultUnits: 0.5,
    defaultPrice: 480,
    recommendedTechnique: 'Hlboký subkutánny vejárovitý nános kanylou'
  }
];

export interface AestheticTemplate {
  id: string;
  title: string;
  category: 'botox' | 'filler' | 'meso' | 'biostimulator';
  productName: string;
  lot: string;
  price: number;
  type: 'point' | 'fanning' | 'threads';
  color: string;
  description: string;
  recommendations?: string;
  vectors: Vector2DItem[];
  isCustom?: boolean;
}

export const PRESET_PROCEDURES: AestheticTemplate[] = [
  {
    id: 'dysport_glabella',
    title: 'Botox Glabela (Vráska hnevu)',
    category: 'botox',
    productName: 'Dysport 300IU',
    lot: 'DYSP-4412B',
    price: 120,
    type: 'point',
    color: '#3B82F6',
    description: 'Izolované ošetrenie glabelárneho komplexu (m. procerus a m. corrugator bilaterálne).',
    recommendations: '• 4 hodiny po aplikácii neľahať a nepredkláňať sa.\n• 48 hodín bez sauny, solária a intenzívneho športu.',
    vectors: [
      {
        id: 'tpl_g1',
        type: 'point',
        view: 'front',
        color: '#3B82F6',
        startPoint: { x: 300, y: 258 },
        zoneName: 'Glabela – m. procerus',
        productName: 'Dysport 300IU',
        lotNumber: 'DYSP-4412B',
        details: '15 Speywood U',
        units: 15,
        unitsUnit: 'Speywood',
        createdAt: '10:00'
      },
      {
        id: 'tpl_g2',
        type: 'point',
        view: 'front',
        color: '#3B82F6',
        startPoint: { x: 278, y: 272 },
        zoneName: 'Glabela – m. corrugator Ľ (mediálny)',
        productName: 'Dysport 300IU',
        lotNumber: 'DYSP-4412B',
        details: '10 Speywood U',
        units: 10,
        unitsUnit: 'Speywood',
        createdAt: '10:00'
      },
      {
        id: 'tpl_g3',
        type: 'point',
        view: 'front',
        color: '#3B82F6',
        startPoint: { x: 322, y: 272 },
        zoneName: 'Glabela – m. corrugator P (mediálny)',
        productName: 'Dysport 300IU',
        lotNumber: 'DYSP-4412B',
        details: '10 Speywood U',
        units: 10,
        unitsUnit: 'Speywood',
        createdAt: '10:00'
      },
      {
        id: 'tpl_g4',
        type: 'point',
        view: 'front',
        color: '#3B82F6',
        startPoint: { x: 248, y: 268 },
        zoneName: 'Glabela – m. corrugator Ľ (chvost)',
        productName: 'Dysport 300IU',
        lotNumber: 'DYSP-4412B',
        details: '5 Speywood U',
        units: 5,
        unitsUnit: 'Speywood',
        createdAt: '10:00'
      },
      {
        id: 'tpl_g5',
        type: 'point',
        view: 'front',
        color: '#3B82F6',
        startPoint: { x: 352, y: 268 },
        zoneName: 'Glabela – m. corrugator P (chvost)',
        productName: 'Dysport 300IU',
        lotNumber: 'DYSP-4412B',
        details: '5 Speywood U',
        units: 5,
        unitsUnit: 'Speywood',
        createdAt: '10:00'
      }
    ]
  },
  {
    id: 'dysport_forehead',
    title: 'Botox Čelo (Horizontálne vrásky)',
    category: 'botox',
    productName: 'Dysport 300IU',
    lot: 'DYSP-4412B',
    price: 120,
    type: 'point',
    color: '#3B82F6',
    description: 'Horizontálne vrásky čela (m. frontalis) so zachovaním prirodzenej polohy obočia.',
    recommendations: '• 4 hodiny po aplikácii neľahať a nepredkláňať sa.\n• 48 hodín bez sauny, solária a športu.',
    vectors: [
      {
        id: 'tpl_f1',
        type: 'point',
        view: 'front',
        color: '#3B82F6',
        startPoint: { x: 220, y: 210 },
        zoneName: 'Čelo Ľ lateralis',
        productName: 'Dysport 300IU',
        lotNumber: 'DYSP-4412B',
        details: '10 Speywood U',
        units: 10,
        unitsUnit: 'Speywood',
        createdAt: '10:00'
      },
      {
        id: 'tpl_f2',
        type: 'point',
        view: 'front',
        color: '#3B82F6',
        startPoint: { x: 260, y: 205 },
        zoneName: 'Čelo Ľ medialis',
        productName: 'Dysport 300IU',
        lotNumber: 'DYSP-4412B',
        details: '10 Speywood U',
        units: 10,
        unitsUnit: 'Speywood',
        createdAt: '10:00'
      },
      {
        id: 'tpl_f3',
        type: 'point',
        view: 'front',
        color: '#3B82F6',
        startPoint: { x: 300, y: 195 },
        zoneName: 'Čelo stred',
        productName: 'Dysport 300IU',
        lotNumber: 'DYSP-4412B',
        details: '10 Speywood U',
        units: 10,
        unitsUnit: 'Speywood',
        createdAt: '10:00'
      },
      {
        id: 'tpl_f4',
        type: 'point',
        view: 'front',
        color: '#3B82F6',
        startPoint: { x: 340, y: 205 },
        zoneName: 'Čelo P medialis',
        productName: 'Dysport 300IU',
        lotNumber: 'DYSP-4412B',
        details: '10 Speywood U',
        units: 10,
        unitsUnit: 'Speywood',
        createdAt: '10:00'
      },
      {
        id: 'tpl_f5',
        type: 'point',
        view: 'front',
        color: '#3B82F6',
        startPoint: { x: 380, y: 210 },
        zoneName: 'Čelo P lateralis',
        productName: 'Dysport 300IU',
        lotNumber: 'DYSP-4412B',
        details: '10 Speywood U',
        units: 10,
        unitsUnit: 'Speywood',
        createdAt: '10:00'
      }
    ]
  },
  {
    id: 'dysport_crows_feet',
    title: 'Botox Očné vejáriky (Oči)',
    category: 'botox',
    productName: 'Dysport 300IU',
    lot: 'DYSP-4412B',
    price: 120,
    type: 'point',
    color: '#3B82F6',
    description: 'Periorbitálne vrásky laterálneho kútika oka (m. orbicularis oculi).',
    recommendations: '• Nešúchať si oči, neaplikovať dráždivú kozmetiku 24h.\n• Suchý chlad pri miernom opuchu.',
    vectors: [
      { id: 'tpl_e1', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 195, y: 292 }, zoneName: 'Očné vejáriky Ľ (horný)', productName: 'Dysport 300IU', lotNumber: 'DYSP-4412B', details: '8 Speywood U', units: 8, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_e2', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 185, y: 308 }, zoneName: 'Očné vejáriky Ľ (stredný)', productName: 'Dysport 300IU', lotNumber: 'DYSP-4412B', details: '8 Speywood U', units: 8, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_e3', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 195, y: 324 }, zoneName: 'Očné vejáriky Ľ (dolný)', productName: 'Dysport 300IU', lotNumber: 'DYSP-4412B', details: '8 Speywood U', units: 8, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_e4', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 405, y: 292 }, zoneName: 'Očné vejáriky P (horný)', productName: 'Dysport 300IU', lotNumber: 'DYSP-4412B', details: '8 Speywood U', units: 8, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_e5', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 415, y: 308 }, zoneName: 'Očné vejáriky P (stredný)', productName: 'Dysport 300IU', lotNumber: 'DYSP-4412B', details: '8 Speywood U', units: 8, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_e6', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 405, y: 324 }, zoneName: 'Očné vejáriky P (dolný)', productName: 'Dysport 300IU', lotNumber: 'DYSP-4412B', details: '8 Speywood U', units: 8, unitsUnit: 'Speywood', createdAt: '10:00' }
    ]
  },
  {
    id: 'dysport_forehead_glabella',
    title: 'Botox Čelo + Glabela (Kombinácia)',
    category: 'botox',
    productName: 'Dysport 300IU',
    lot: 'DYSP-4412B',
    price: 200,
    type: 'point',
    color: '#3B82F6',
    description: 'Najčastejšie kombinované ošetrenie čela a glately s cenovým zvýhodnením.',
    recommendations: '• 4 hodiny po aplikácii neľahať.\n• 48 hodín bez sauny a športu.',
    vectors: [
      { id: 'tpl_fg1', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 300, y: 258 }, zoneName: 'Glabela – procerus', productName: 'Dysport 300IU', lotNumber: 'DYSP-4412B', details: '15 Sp U', units: 15, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_fg2', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 278, y: 272 }, zoneName: 'Glabela – corrugator Ľ', productName: 'Dysport 300IU', lotNumber: 'DYSP-4412B', details: '10 Sp U', units: 10, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_fg3', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 322, y: 272 }, zoneName: 'Glabela – corrugator P', productName: 'Dysport 300IU', lotNumber: 'DYSP-4412B', details: '10 Sp U', units: 10, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_fg4', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 220, y: 210 }, zoneName: 'Čelo Ľ lateralis', productName: 'Dysport 300IU', lotNumber: 'DYSP-4412B', details: '10 Sp U', units: 10, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_fg5', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 260, y: 205 }, zoneName: 'Čelo Ľ medialis', productName: 'Dysport 300IU', lotNumber: 'DYSP-4412B', details: '10 Sp U', units: 10, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_fg6', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 340, y: 205 }, zoneName: 'Čelo P medialis', productName: 'Dysport 300IU', lotNumber: 'DYSP-4412B', details: '10 Sp U', units: 10, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_fg7', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 380, y: 210 }, zoneName: 'Čelo P lateralis', productName: 'Dysport 300IU', lotNumber: 'DYSP-4412B', details: '10 Sp U', units: 10, unitsUnit: 'Speywood', createdAt: '10:00' }
    ]
  },
  {
    id: 'dysport_full_upper',
    title: 'Botox Horná tretina (Čelo + Glabela + Oči)',
    category: 'botox',
    productName: 'Dysport 300IU',
    lot: 'DYSP-4412B',
    price: 280,
    type: 'point',
    color: '#3B82F6',
    description: 'Kompletná horná tretina tváre: čelo, glabela a očné vejáriky (komplexný vyhladzujúci balík).',
    recommendations: '• 4 hodiny po aplikácii neľahať a nepredkláňať sa.\n• 48 hodín bez sauny, solária a športu.',
    vectors: [
      { id: 'tpl_u1', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 300, y: 258 }, zoneName: 'Glabela – procerus', productName: 'Dysport 300IU', lotNumber: 'DYSP-4412B', details: '15 Sp U', units: 15, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_u2', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 278, y: 272 }, zoneName: 'Glabela – corrugator Ľ', productName: 'Dysport 300IU', lotNumber: 'DYSP-4412B', details: '10 Sp U', units: 10, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_u3', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 322, y: 272 }, zoneName: 'Glabela – corrugator P', productName: 'Dysport 300IU', lotNumber: 'DYSP-4412B', details: '10 Sp U', units: 10, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_u4', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 220, y: 210 }, zoneName: 'Čelo Ľ lateralis', productName: 'Dysport 300IU', lotNumber: 'DYSP-4412B', details: '10 Sp U', units: 10, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_u5', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 260, y: 205 }, zoneName: 'Čelo Ľ medialis', productName: 'Dysport 300IU', lotNumber: 'DYSP-4412B', details: '10 Sp U', units: 10, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_u6', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 340, y: 205 }, zoneName: 'Čelo P medialis', productName: 'Dysport 300IU', lotNumber: 'DYSP-4412B', details: '10 Sp U', units: 10, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_u7', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 380, y: 210 }, zoneName: 'Čelo P lateralis', productName: 'Dysport 300IU', lotNumber: 'DYSP-4412B', details: '10 Sp U', units: 10, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_u8', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 195, y: 292 }, zoneName: 'Očné vejáriky Ľ', productName: 'Dysport 300IU', lotNumber: 'DYSP-4412B', details: '8 Sp U', units: 8, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_u9', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 185, y: 308 }, zoneName: 'Očné vejáriky Ľ', productName: 'Dysport 300IU', lotNumber: 'DYSP-4412B', details: '8 Sp U', units: 8, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_u10', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 405, y: 292 }, zoneName: 'Očné vejáriky P', productName: 'Dysport 300IU', lotNumber: 'DYSP-4412B', details: '8 Sp U', units: 8, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_u11', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 415, y: 308 }, zoneName: 'Očné vejáriky P', productName: 'Dysport 300IU', lotNumber: 'DYSP-4412B', details: '8 Sp U', units: 8, unitsUnit: 'Speywood', createdAt: '10:00' }
    ]
  },
  {
    id: 'restylane_kysse_lips',
    title: 'Restylane Kysse – Modelácia a výplň pier (1ml)',
    category: 'filler',
    productName: 'Restylane Kysse 1ml',
    lot: 'RST-KYS-993A',
    price: 340,
    type: 'point',
    color: '#EC4899',
    description: 'Prirodzená definícia kontúr, Amorovho luku a zväčšenie objemu tela pier.',
    recommendations: '• Nefajčiť a nepiť horúce nápoje počas 24 hodín.\n• Používať čistý balzam, chladiť suchým chladom.\n• 48 hodín bez bozkávania a intenzívneho športu.',
    vectors: [
      { id: 'tpl_l1', type: 'point', view: 'front', color: '#EC4899', startPoint: { x: 293, y: 436 }, zoneName: 'Amorov vrchol Ľ', productName: 'Restylane Kysse 1ml', lotNumber: 'RST-KYS-993A', details: '0.05ml OBT', units: 0.05, unitsUnit: 'ml', createdAt: '10:00' },
      { id: 'tpl_l2', type: 'point', view: 'front', color: '#EC4899', startPoint: { x: 307, y: 436 }, zoneName: 'Amorov vrchol P', productName: 'Restylane Kysse 1ml', lotNumber: 'RST-KYS-993A', details: '0.05ml OBT', units: 0.05, unitsUnit: 'ml', createdAt: '10:00' },
      { id: 'tpl_l3', type: 'point', view: 'front', color: '#EC4899', startPoint: { x: 300, y: 439 }, zoneName: 'Amorov zárez', productName: 'Restylane Kysse 1ml', lotNumber: 'RST-KYS-993A', details: '0.05ml', units: 0.05, unitsUnit: 'ml', createdAt: '10:00' },
      { id: 'tpl_l4', type: 'point', view: 'front', color: '#EC4899', startPoint: { x: 278, y: 442 }, zoneName: 'Kontúra hornej pery Ľ', productName: 'Restylane Kysse 1ml', lotNumber: 'RST-KYS-993A', details: '0.1ml', units: 0.1, unitsUnit: 'ml', createdAt: '10:00' },
      { id: 'tpl_l5', type: 'point', view: 'front', color: '#EC4899', startPoint: { x: 322, y: 442 }, zoneName: 'Kontúra hornej pery P', productName: 'Restylane Kysse 1ml', lotNumber: 'RST-KYS-993A', details: '0.1ml', units: 0.1, unitsUnit: 'ml', createdAt: '10:00' },
      { id: 'tpl_l6', type: 'point', view: 'front', color: '#EC4899', startPoint: { x: 285, y: 456 }, zoneName: 'Telo dolnej pery Ľ', productName: 'Restylane Kysse 1ml', lotNumber: 'RST-KYS-993A', details: '0.15ml', units: 0.15, unitsUnit: 'ml', createdAt: '10:00' },
      { id: 'tpl_l7', type: 'point', view: 'front', color: '#EC4899', startPoint: { x: 315, y: 456 }, zoneName: 'Telo dolnej pery P', productName: 'Restylane Kysse 1ml', lotNumber: 'RST-KYS-993A', details: '0.15ml', units: 0.15, unitsUnit: 'ml', createdAt: '10:00' }
    ]
  },
  {
    id: 'profhilo_5bap',
    title: 'Profhilo H+L – 5 BAP Bioremodelácia tváre (2ml)',
    category: 'meso',
    productName: 'Profhilo H+L 2ml',
    lot: 'PRO-2ML-881',
    price: 290,
    type: 'point',
    color: '#10B981',
    description: '10 bioestetických bodov (5 vľavo, 5 vpravo) pre hĺbkovú hydratáciu a elasticitu tváre.',
    recommendations: '• Nemasírovať papulky po BAP bodoch – vstrebu sa do 24-48 hodín.\n• Vynechať saunu a fitko na 48 hodín.',
    vectors: [
      { id: 'tpl_b1', type: 'point', view: 'front', color: '#10B981', startPoint: { x: 235, y: 335 }, zoneName: 'Zygomatická prominencia Ľ', productName: 'Profhilo H+L 2ml', lotNumber: 'PRO-2ML-881', details: '0.2ml BAP', units: 0.2, unitsUnit: 'ml', createdAt: '10:00' },
      { id: 'tpl_b2', type: 'point', view: 'front', color: '#10B981', startPoint: { x: 250, y: 390 }, zoneName: 'Nazálna báza Ľ', productName: 'Profhilo H+L 2ml', lotNumber: 'PRO-2ML-881', details: '0.2ml BAP', units: 0.2, unitsUnit: 'ml', createdAt: '10:00' },
      { id: 'tpl_b3', type: 'point', view: 'front', color: '#10B981', startPoint: { x: 215, y: 430 }, zoneName: 'Tragus Ľ', productName: 'Profhilo H+L 2ml', lotNumber: 'PRO-2ML-881', details: '0.2ml BAP', units: 0.2, unitsUnit: 'ml', createdAt: '10:00' },
      { id: 'tpl_b4', type: 'point', view: 'front', color: '#10B981', startPoint: { x: 270, y: 485 }, zoneName: 'Brada Ľ', productName: 'Profhilo H+L 2ml', lotNumber: 'PRO-2ML-881', details: '0.2ml BAP', units: 0.2, unitsUnit: 'ml', createdAt: '10:00' },
      { id: 'tpl_b5', type: 'point', view: 'front', color: '#10B981', startPoint: { x: 210, y: 495 }, zoneName: 'Mandibulárny uhol Ľ', productName: 'Profhilo H+L 2ml', lotNumber: 'PRO-2ML-881', details: '0.2ml BAP', units: 0.2, unitsUnit: 'ml', createdAt: '10:00' },
      { id: 'tpl_b6', type: 'point', view: 'front', color: '#10B981', startPoint: { x: 365, y: 335 }, zoneName: 'Zygomatická prominencia P', productName: 'Profhilo H+L 2ml', lotNumber: 'PRO-2ML-881', details: '0.2ml BAP', units: 0.2, unitsUnit: 'ml', createdAt: '10:00' },
      { id: 'tpl_b7', type: 'point', view: 'front', color: '#10B981', startPoint: { x: 350, y: 390 }, zoneName: 'Nazálna báza P', productName: 'Profhilo H+L 2ml', lotNumber: 'PRO-2ML-881', details: '0.2ml BAP', units: 0.2, unitsUnit: 'ml', createdAt: '10:00' },
      { id: 'tpl_b8', type: 'point', view: 'front', color: '#10B981', startPoint: { x: 385, y: 430 }, zoneName: 'Tragus P', productName: 'Profhilo H+L 2ml', lotNumber: 'PRO-2ML-881', details: '0.2ml BAP', units: 0.2, unitsUnit: 'ml', createdAt: '10:00' },
      { id: 'tpl_b9', type: 'point', view: 'front', color: '#10B981', startPoint: { x: 330, y: 485 }, zoneName: 'Brada P', productName: 'Profhilo H+L 2ml', lotNumber: 'PRO-2ML-881', details: '0.2ml BAP', units: 0.2, unitsUnit: 'ml', createdAt: '10:00' },
      { id: 'tpl_b10', type: 'point', view: 'front', color: '#10B981', startPoint: { x: 390, y: 495 }, zoneName: 'Mandibulárny uhol P', productName: 'Profhilo H+L 2ml', lotNumber: 'PRO-2ML-881', details: '0.2ml BAP', units: 0.2, unitsUnit: 'ml', createdAt: '10:00' }
    ]
  },
  {
    id: 'radiesse_vectoring',
    title: 'Radiesse (+) 1.5ml – Vektoring sánky & Lifting',
    category: 'biostimulator',
    productName: 'Radiesse (+) 1.5ml',
    lot: 'RAD-150-332',
    price: 420,
    type: 'fanning',
    color: '#D97706',
    description: 'CaHA kanylový lifting kontúr dolnej čeľuste, kútikov a zygomy.',
    recommendations: '• Kľudový režim, nemasírovať ošetrené zóny 7 dní.\n• Kontrola o 3-4 týždne.',
    vectors: [
      {
        id: 'tpl_r1',
        type: 'fanning',
        view: 'front',
        color: '#D97706',
        startPoint: { x: 215, y: 450 },
        endPoint: { x: 270, y: 480 },
        fanningRays: [
          { x: 260, y: 460 },
          { x: 270, y: 480 },
          { x: 255, y: 500 }
        ],
        zoneName: 'Mandibulárny vektoring Ľ',
        productName: 'Radiesse (+) 1.5ml',
        lotNumber: 'RAD-150-332',
        details: '0.75ml kanyla 25G',
        createdAt: '10:00'
      },
      {
        id: 'tpl_r2',
        type: 'fanning',
        view: 'front',
        color: '#D97706',
        startPoint: { x: 385, y: 450 },
        endPoint: { x: 330, y: 480 },
        fanningRays: [
          { x: 340, y: 460 },
          { x: 330, y: 480 },
          { x: 345, y: 500 }
        ],
        zoneName: 'Mandibulárny vektoring P',
        productName: 'Radiesse (+) 1.5ml',
        lotNumber: 'RAD-150-332',
        details: '0.75ml kanyla 25G',
        createdAt: '10:00'
      }
    ]
  },
  {
    id: 'sculptra_cheeks',
    title: 'Sculptra 10ml – PLLA Neokolagenéza líca',
    category: 'biostimulator',
    productName: 'Sculptra 10ml',
    lot: 'SCL-2026-881A',
    price: 480,
    type: 'fanning',
    color: '#C5A059',
    description: 'Biostimulačný nános PLLA pre obnovu objemu a pevnosti hlbokých vrstiev kože.',
    recommendations: '• Dodržiavať pravidlo masáže 5x5: masírovať ošetrenú oblasť 5 minút, 5-krát denne, počas 5 dní.\n• Chladenie suchým chladom.',
    vectors: [
      {
        id: 'tpl_s1',
        type: 'fanning',
        view: 'front',
        color: '#C5A059',
        startPoint: { x: 235, y: 350 },
        endPoint: { x: 275, y: 410 },
        fanningRays: [
          { x: 260, y: 360 },
          { x: 275, y: 385 },
          { x: 275, y: 410 },
          { x: 260, y: 430 }
        ],
        zoneName: 'Zygomatický vejár Ľ',
        productName: 'Sculptra 10ml',
        lotNumber: 'SCL-2026-881A',
        details: '5ml PLLA suspenzia',
        createdAt: '10:00'
      },
      {
        id: 'tpl_s2',
        type: 'fanning',
        view: 'front',
        color: '#C5A059',
        startPoint: { x: 365, y: 350 },
        endPoint: { x: 325, y: 410 },
        fanningRays: [
          { x: 340, y: 360 },
          { x: 325, y: 385 },
          { x: 325, y: 410 },
          { x: 340, y: 430 }
        ],
        zoneName: 'Zygomatický vejár P',
        productName: 'Sculptra 10ml',
        lotNumber: 'SCL-2026-881A',
        details: '5ml PLLA suspenzia',
        createdAt: '10:00'
      }
    ]
  }
];

export interface TreatmentLineItem {
  id: string;
  title: string;
  price: number;
  lot?: string;
  category?: string;
}

export interface AestheticSession {
  id: string;
  patientId: string;
  date: string;
  formattedDate: string;
  doctor: string;
  protocolNumber: string;
  title: string;
  vectors: Vector2DItem[];
  lineItems?: TreatmentLineItem[];
  subtotal?: number;
  discountType?: 'percent' | 'fixed';
  discountValue?: number;
  price: number;
  recommendations: string;
  nextStep: string;
  appliedMaterialsSummary?: string;
  appliedTemplatesList?: string[];
}

const DEFAULT_RECOMMENDATIONS = `• Neľahať si a nepredkláňať sa minimálne 4 hodiny po aplikácii botulotoxínu.
• Vynechať intenzívny šport, fitness a ťažkú fyzickú námahu počas 48 hodín.
• Vyhnúť sa saune, pare, vírivke a soláriu minimálne na 72 hodín.
• Neaplikovať make-up na miesta vpichov počas prvých 12 hodín.
• V prípade opuchu alebo hematómu prikladať suchý chlad (nie priamo ľad na kožu).`;

const DEFAULT_NEXT_STEP = 'Kontrola na klinike o 14 dní (vyhodnotenie efektu a symetrie). Udržiavacia aplikácia o 5 až 6 mesiacov.';

const INITIAL_DEMO_SESSIONS: AestheticSession[] = [
  {
    id: 'sess_demo_1',
    patientId: 'P1',
    date: '2026-01-15',
    formattedDate: '15.01.2026',
    doctor: 'MUDr. Ján Mráz',
    protocolNumber: 'AES-2026-081',
    title: 'Botox Glabela + Čelo',
    price: 200,
    subtotal: 200,
    discountType: 'percent',
    discountValue: 0,
    lineItems: [
      { id: 'li_d1', title: 'Dysport, m. frontalis bilat., 4 vpichy strana, celkovo 50IU', price: 120, lot: 'DYSP-4412B' },
      { id: 'li_d2', title: 'Dysport, glabela – m. procerus a corrugator bilat.', price: 80, lot: 'DYSP-4412B' }
    ],
    recommendations: `• Neľahať si minimálne 4 hodiny po aplikácii botulotoxínu.
• Vyhnúť sa saune, soláriu a športu na 48 hodín.
• Chladenie suchým chladom pri drobných hematómoch.`,
    nextStep: 'Kontrola nástupu plného účinku o 14 dní. Následná aplikácia o 5 mesiacov.',
    appliedMaterialsSummary: 'Dysport 300IU (LOT: DYSP-4412B) • 6 bodov',
    appliedTemplatesList: ['Botox Čelo + Glabela (Kombinácia)'],
    vectors: [
      { id: 'd1', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 260, y: 205 }, zoneName: 'Čelo Ľ (m. frontalis)', productName: 'Dysport 300IU', lotNumber: 'DYSP-4412B', details: '10 Speywood U', units: 10, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'd2', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 340, y: 205 }, zoneName: 'Čelo P (m. frontalis)', productName: 'Dysport 300IU', lotNumber: 'DYSP-4412B', details: '10 Speywood U', units: 10, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'd3', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 300, y: 195 }, zoneName: 'Čelo stred', productName: 'Dysport 300IU', lotNumber: 'DYSP-4412B', details: '10 Speywood U', units: 10, unitsUnit: 'Speywood', createdAt: '10:01' },
      { id: 'd4', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 300, y: 258 }, zoneName: 'Glabela – procerus', productName: 'Dysport 300IU', lotNumber: 'DYSP-4412B', details: '15 Speywood U', units: 15, unitsUnit: 'Speywood', createdAt: '10:02' },
      { id: 'd5', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 278, y: 272 }, zoneName: 'Glabela – corrugator Ľ', productName: 'Dysport 300IU', lotNumber: 'DYSP-4412B', details: '10 Speywood U', units: 10, unitsUnit: 'Speywood', createdAt: '10:02' },
      { id: 'd6', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 322, y: 272 }, zoneName: 'Glabela – corrugator P', productName: 'Dysport 300IU', lotNumber: 'DYSP-4412B', details: '10 Speywood U', units: 10, unitsUnit: 'Speywood', createdAt: '10:02' }
    ]
  }
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
          if (Array.isArray(parsed) && parsed.length > 0) setLocalPatients(parsed);
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

  // HLAVNÝ REŽIM
  const [activeTab, setActiveTab] = useState<'editor' | 'history' | 'report'>('editor');

  // SOCHA STATE
  const [activeSculptureView, setActiveSculptureView] = useState<SculptureViewType>('front');
  const [vectors, setVectors] = useState<Vector2DItem[]>([]);
  const [activeTool, setActiveTool] = useState<DrawingToolType>('point');
  const [selectedMaterialIdx, setSelectedMaterialIdx] = useState(0);
  const [selectedVectorId, setSelectedVectorId] = useState<string | null>(null);

  // MATERIÁLY & PREPARÁTY (PERSISTENTNÝ ZOZNAM S MOŽNOSŤOU PRIDÁVANIA A ZMENY CIEN)
  const [materialsList, setMaterialsList] = useState<AestheticMaterial[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('say_clinic_aesthetic_materials_v2');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return PRESET_MATERIALS;
  });

  const activeMaterial = materialsList[selectedMaterialIdx] || materialsList[0] || PRESET_MATERIALS[0];
  const [activeColor, setActiveColor] = useState<string>(activeMaterial.color);

  // ŠABLÓNY STATE (PERSISTENTNÝ ZOZNAM S MOŽNOSŤOU PRIDÁVANIA A ZMENY CIEN)
  const [templatesList, setTemplatesList] = useState<AestheticTemplate[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('say_clinic_aesthetic_templates_v4');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return PRESET_PROCEDURES;
  });

  const [appliedTemplateTitles, setAppliedTemplateTitles] = useState<string[]>([]);
  const [showAllTemplatesModal, setShowAllTemplatesModal] = useState(false);
  const [showMaterialsManagerModal, setShowMaterialsManagerModal] = useState(false);
  const [templateFilterCategory, setTemplateFilterCategory] = useState<string>('all');
  
  // MODÁLNE OKNÁ PRE NOVÉ ŠABLÓNY A MATERIÁLY
  const [showSaveCustomTemplateModal, setShowSaveCustomTemplateModal] = useState(false);
  const [customTemplateTitle, setCustomTemplateTitle] = useState('');
  const [customTemplatePrice, setCustomTemplatePrice] = useState(150);

  // EDITÁCIA EXISTUJÚCICH ŠABLÓN A MATERIÁLOV
  const [editingTemplate, setEditingTemplate] = useState<AestheticTemplate | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<AestheticMaterial | null>(null);

  // FORMULÁR PRE PRIDANIE NOVEJ LÁTKY
  const [newMatName, setNewMatName] = useState('');
  const [newMatType, setNewMatType] = useState<'botox' | 'filler' | 'meso' | 'biostimulator'>('botox');
  const [newMatCategory, setNewMatCategory] = useState('Botulotoxín A');
  const [newMatLot, setNewMatLot] = useState('LOT-2026-01');
  const [newMatColor, setNewMatColor] = useState('#3B82F6');
  const [newMatPrice, setNewMatPrice] = useState<number>(120);
  const [newMatUnit, setNewMatUnit] = useState('Speywood');
  const [newMatTechnique, setNewMatTechnique] = useState('Presné intramuskulárne vpichy');

  // FORMULÁR PRE PRIDANIE NOVEJ ŠABLÓNY
  const [newTplTitle, setNewTplTitle] = useState('');
  const [newTplCategory, setNewTplCategory] = useState<'botox' | 'filler' | 'meso' | 'biostimulator'>('botox');
  const [newTplProductName, setNewTplProductName] = useState('Dysport 300IU');
  const [newTplPrice, setNewTplPrice] = useState<number>(120);
  const [newTplDesc, setNewTplDesc] = useState('');
  const [newTplRec, setNewTplRec] = useState('');

  // POLOŽKY OŠETRENIA (ROZPIS CIEN PRE KLIENTA & A4 REPORT)
  const [lineItems, setLineItems] = useState<TreatmentLineItem[]>([
    {
      id: 'li_initial',
      title: 'Dysport, m. frontalis bilat., 4 vpichy strana, celkovo 50IU',
      price: 120,
      lot: 'DYSP-4412B'
    }
  ]);
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState<number>(0);

  // VÝPOČET SUMÁRNYCH CIEN
  const subtotal = lineItems.reduce((acc, it) => acc + (Number(it.price) || 0), 0);
  const discountAmount = discountType === 'percent'
    ? Math.round(((subtotal * (Number(discountValue) || 0)) / 100) * 100) / 100
    : Math.min(Number(discountValue) || 0, subtotal);
  const finalTotalPrice = Math.max(0, subtotal - discountAmount);

  // ODPORÚČANIA A POSTUP
  const [sessionRecommendations, setSessionRecommendations] = useState<string>(DEFAULT_RECOMMENDATIONS);
  const [sessionNextStep, setSessionNextStep] = useState<string>(DEFAULT_NEXT_STEP);
  const [sessionProtocolNo, setSessionProtocolNo] = useState<string>(() => `AES-${Date.now().toString().slice(-6)}`);

  // HISTÓRIA SEDENÍ PRE TOHTO PACIENTA
  const [sessions, setSessions] = useState<AestheticSession[]>([]);
  const [selectedHistorySessionId, setSelectedHistorySessionId] = useState<string | null>(null);

  // FEEDBACK TOAST & PDF
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Načítanie histórie zo storage pre aktuálneho pacienta
  useEffect(() => {
    if (!currentPatient?.id) return;
    try {
      const saved = localStorage.getItem('say_clinic_aesthetic_sessions');
      let allSessions: Record<string, AestheticSession[]> = {};
      if (saved) {
        allSessions = JSON.parse(saved);
      }
      const patientSessions = allSessions[currentPatient.id] || (currentPatient.id === 'P1' ? INITIAL_DEMO_SESSIONS : []);
      setSessions(patientSessions);
      if (patientSessions.length > 0) {
        setSelectedHistorySessionId(patientSessions[0].id);
      } else {
        setSelectedHistorySessionId(null);
      }
    } catch (e) {
      console.error(e);
      setSessions([]);
    }

    setVectors([]);
    setAppliedTemplateTitles([]);
    setSelectedVectorId(null);
    setDiscountValue(0);
    setSessionProtocolNo(`AES-${Date.now().toString().slice(-6)}`);
  }, [currentPatient?.id]);

  // ULOŽENIE A SYNCHRONIZÁCIA LÁTOK DO STORAGE
  const saveMaterialsToStorage = (updated: AestheticMaterial[]) => {
    setMaterialsList(updated);
    try {
      localStorage.setItem('say_clinic_aesthetic_materials_v2', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // ULOŽENIE A SYNCHRONIZÁCIA ŠABLÓN DO STORAGE
  const saveTemplatesToStorage = (updated: AestheticTemplate[]) => {
    setTemplatesList(updated);
    try {
      localStorage.setItem('say_clinic_aesthetic_templates_v4', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // ZMENA CENY LÁTKY
  const handleUpdateMaterialPrice = (id: string, newPrice: number) => {
    const updated = materialsList.map(m => m.id === id ? { ...m, defaultPrice: Math.max(0, newPrice) } : m);
    saveMaterialsToStorage(updated);
  };

  // ZMENA CENY ŠABLÓNY
  const handleUpdateTemplatePrice = (id: string, newPrice: number) => {
    const updated = templatesList.map(t => t.id === id ? { ...t, price: Math.max(0, newPrice) } : t);
    saveTemplatesToStorage(updated);
  };

  // PRIDANIE NOVEJ LÁTKY
  const handleAddNewMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatName.trim()) return;

    const newMaterial: AestheticMaterial = {
      id: `mat_${Date.now()}`,
      name: newMatName.trim(),
      type: newMatType,
      categoryLabel: newMatCategory.trim() || 'Estetický preparát',
      lot: newMatLot.trim() || 'LOT-2026',
      color: newMatColor,
      defaultUnit: newMatUnit,
      defaultUnits: 1,
      defaultPrice: Number(newMatPrice) || 0,
      recommendedTechnique: newMatTechnique.trim() || 'Štandardná aplikácia'
    };

    const updated = [...materialsList, newMaterial];
    saveMaterialsToStorage(updated);
    setNewMatName('');
    setToastMsg(`✅ Látka "${newMaterial.name}" bola pridaná (cena: ${newMaterial.defaultPrice} €)`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // ZMAZANIE LÁTKY
  const handleDeleteMaterial = (id: string) => {
    if (confirm('Naozaj chcete odstrániť túto látku zo zoznamu?')) {
      const updated = materialsList.filter(m => m.id !== id);
      saveMaterialsToStorage(updated);
      if (selectedMaterialIdx >= updated.length) {
        setSelectedMaterialIdx(0);
      }
    }
  };

  // PRIDANIE NOVEJ ŠABLÓNY
  const handleAddNewTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTplTitle.trim()) return;

    const chosenMat = materialsList.find(m => m.name === newTplProductName) || activeMaterial;

    const newTemplate: AestheticTemplate = {
      id: `tpl_custom_${Date.now()}`,
      title: newTplTitle.trim(),
      category: newTplCategory,
      productName: newTplProductName,
      lot: chosenMat.lot,
      price: Number(newTplPrice) || 0,
      type: chosenMat.type === 'biostimulator' ? 'fanning' : 'point',
      color: chosenMat.color,
      description: newTplDesc.trim() || 'Aplikačný protokol SAY CLINIC',
      recommendations: newTplRec.trim() || DEFAULT_RECOMMENDATIONS,
      vectors: vectors.length > 0 ? [...vectors] : [],
      isCustom: true
    };

    const updated = [newTemplate, ...templatesList];
    saveTemplatesToStorage(updated);
    setNewTplTitle('');
    setNewTplDesc('');
    setNewTplRec('');
    setToastMsg(`✅ Šablóna "${newTemplate.title}" bola úspešne vytvorená (${newTemplate.price} €)`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // ZMAZANIE ŠABLÓNY
  const handleDeleteTemplate = (id: string) => {
    if (confirm('Naozaj chcete vymazať túto šablónu?')) {
      const updated = templatesList.filter(t => t.id !== id);
      saveTemplatesToStorage(updated);
    }
  };

  // APLIKÁCIA ŠABLÓNY
  const handleApplyTemplate = (tpl: AestheticTemplate, mode: 'append' | 'replace' = 'append') => {
    const freshVectors: Vector2DItem[] = tpl.vectors.map((v, i) => ({
      ...v,
      id: `pt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}_${i}`
    }));

    const lineItemTitle = tpl.description && !tpl.description.startsWith('Izolované') && !tpl.description.startsWith('Horizontálne')
      ? `${tpl.productName}, ${tpl.description}`
      : `${tpl.productName}, ${tpl.title.replace(/Botox |Výplň |Kyselina Hyalurónová – /gi, '')}`;

    const newLineItem: TreatmentLineItem = {
      id: `li_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: lineItemTitle,
      price: tpl.price,
      lot: tpl.lot,
      category: tpl.category
    };

    if (mode === 'replace') {
      setVectors(freshVectors);
      setAppliedTemplateTitles([tpl.title]);
      setLineItems([newLineItem]);
    } else {
      setVectors(prev => [...prev, ...freshVectors]);
      setAppliedTemplateTitles(prev => prev.includes(tpl.title) ? prev : [...prev, tpl.title]);
      setLineItems(prev => [...prev, newLineItem]);
    }

    if (tpl.recommendations) {
      setSessionRecommendations(tpl.recommendations);
    }

    setActiveColor(tpl.color);
    if (tpl.type === 'fanning') setActiveTool('fanning');
    else if (tpl.type === 'threads') setActiveTool('threads');
    else setActiveTool('point');

    if (freshVectors.length > 0) {
      setActiveSculptureView(freshVectors[0].view);
    }

    setShowAllTemplatesModal(false);
    setToastMsg(`Aplikovaná šablóna: "${tpl.title}" (+${tpl.price} €)`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Uloženie nákresu zo sochy ako vlastnej šablóny
  const handleSaveCustomTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTemplateTitle.trim()) return;
    if (vectors.length === 0) {
      alert('Pred uložením šablóny nakreslite aspoň jeden bod na sochu.');
      return;
    }

    const newTpl: AestheticTemplate = {
      id: `custom_tpl_${Date.now()}`,
      title: customTemplateTitle.trim(),
      category: activeMaterial.type,
      productName: activeMaterial.name,
      lot: activeMaterial.lot,
      price: customTemplatePrice,
      type: activeTool === 'fanning' ? 'fanning' : activeTool === 'threads' ? 'threads' : 'point',
      color: activeColor,
      description: `Vlastná schéma ošetrenia (${vectors.length} bodov)`,
      recommendations: sessionRecommendations,
      vectors: [...vectors],
      isCustom: true
    };

    const updated = [newTpl, ...templatesList];
    saveTemplatesToStorage(updated);
    setShowSaveCustomTemplateModal(false);
    setCustomTemplateTitle('');
    setToastMsg(`Vlastná šablóna "${newTpl.title}" bola úspešne uložená!`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Výber preparátu
  const handleSelectMaterial = (idx: number) => {
    setSelectedMaterialIdx(idx);
    const mat = materialsList[idx] || PRESET_MATERIALS[0];
    setActiveColor(mat.color);

    if (mat.type === 'biostimulator') {
      setActiveTool('fanning');
    } else {
      setActiveTool('point');
    }
  };

  // Pridanie riadku ošetrenia (napr. Sculptra 10 ml líca, spánky)
  const handleAddLineItem = (title?: string, price?: number) => {
    const newItem: TreatmentLineItem = {
      id: `li_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: title || `${activeMaterial.name}, individuálna aplikácia`,
      price: price !== undefined ? price : activeMaterial.defaultPrice,
      lot: activeMaterial.lot
    };
    setLineItems(prev => [...prev, newItem]);
  };

  // Úprava riadku ošetrenia
  const handleUpdateLineItem = (id: string, updates: Partial<TreatmentLineItem>) => {
    setLineItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  // Zmazanie riadku ošetrenia
  const handleDeleteLineItem = (id: string) => {
    setLineItems(prev => prev.filter(item => item.id !== id));
  };

  // Uloženie ošetrenia do karty pacienta
  const handleSaveSession = () => {
    if (vectors.length === 0 && lineItems.length === 0) {
      alert('Pred uložením zadajte aspoň jednu položku ošetrenia alebo vyznačte body na soche.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const formattedDate = new Date().toLocaleDateString('sk-SK');

    const summaryStr = lineItems.map(it => it.title).join(' • ');

    const newSession: AestheticSession = {
      id: `sess_${Date.now()}`,
      patientId: currentPatient.id,
      date: todayStr,
      formattedDate,
      doctor: 'MUDr. Ján Mráz',
      protocolNumber: sessionProtocolNo,
      title: lineItems.length > 0 ? lineItems[0].title : `Estetické ošetrenie (${vectors.length} bodov)`,
      vectors: [...vectors],
      lineItems: [...lineItems],
      subtotal,
      discountType,
      discountValue,
      price: finalTotalPrice,
      recommendations: sessionRecommendations,
      nextStep: sessionNextStep,
      appliedMaterialsSummary: summaryStr,
      appliedTemplatesList: appliedTemplateTitles
    };

    try {
      const saved = localStorage.getItem('say_clinic_aesthetic_sessions');
      const allSessions: Record<string, AestheticSession[]> = saved ? JSON.parse(saved) : {};
      const patientSessions = allSessions[currentPatient.id] || [];
      const updated = [newSession, ...patientSessions];
      allSessions[currentPatient.id] = updated;
      localStorage.setItem('say_clinic_aesthetic_sessions', JSON.stringify(allSessions));

      setSessions(updated);
      setSelectedHistorySessionId(newSession.id);

      // Odpísanie materiálu zo skladu
      lineItems.forEach(item => {
        InventoryService.logMaterialUsage({
          patientId: currentPatient.id,
          patientName: currentPatient.name,
          patientBirthNumber: currentPatient.birthNumber,
          sourceType: 'estetika',
          procedureName: item.title,
          itemName: item.title.split(',')[0],
          category: 'estetika',
          quantity: 1,
          lotNumber: item.lot || 'LOT-2026',
          performerName: 'MUDr. Ján Mráz',
          notes: `Cena: ${item.price} €`
        });
      });

      // Uloženie do zdravotného záznamu pacienta
      const lineItemsSummaryText = lineItems.map(it => `• ${it.title} (${it.price} €)`).join('\n');
      const recordText = `ESTETICKÉ OŠETRENIE TVÁRE (SAY CLINIC)
Dátum: ${formattedDate}
Číslo protokolu: ${sessionProtocolNo}
Ošetrujúci lekár: MUDr. Ján Mráz

Aplikované látky a výkony:
${lineItemsSummaryText || 'Individuálny nákres'}

Medzisúčet: ${subtotal.toFixed(2)} €
Zľava: ${discountAmount > 0 ? `-${discountAmount.toFixed(2)} € (${discountType === 'percent' ? discountValue + '%' : 'pevná suma'})` : 'Bez zľavy'}
Výsledná cena: ${finalTotalPrice.toFixed(2)} €

Odporúčania po ošetrení:
${sessionRecommendations}

Ďalší postup a plán:
${sessionNextStep}`;

      const newRecord: MedicalRecord = {
        id: `rec-aes-${Date.now()}`,
        type: 'Estetický protokol',
        date: formattedDate,
        doctor: 'MUDr. Ján Mráz',
        title: `Estetika: ${lineItems[0]?.title || 'Estetické ošetrenie'} (${finalTotalPrice} €)`,
        content: recordText
      };

      const existingRecordsStr = localStorage.getItem(`say_clinic_records_${currentPatient.id}`);
      const existingRecords: MedicalRecord[] = existingRecordsStr ? JSON.parse(existingRecordsStr) : [];
      localStorage.setItem(`say_clinic_records_${currentPatient.id}`, JSON.stringify([newRecord, ...existingRecords]));

      setToastMsg(`✅ Ošetrenie bolo úspešne uložené do karty pacienta (${formattedDate})`);
      setTimeout(() => setToastMsg(null), 4000);
    } catch (e) {
      console.error(e);
      setToastMsg('❌ Chyba pri ukladaní ošetrenia.');
    }
  };

  // ROBUSTNÁ TLAČ (BEZPEČNÁ IZOLÁCIA PRE WINDOW.PRINT)
  const handlePrint = () => {
    if (activeTab !== 'report') {
      setActiveTab('report');
    }

    const existingStyle = document.getElementById('say-aesthetics-print-style');
    if (existingStyle) existingStyle.remove();

    const tempStyle = document.createElement('style');
    tempStyle.id = 'say-aesthetics-print-style';
    tempStyle.innerHTML = `
      @page {
        size: A4 portrait !important;
        margin: 10mm 12mm !important;
      }
      @media print {
        html, body {
          background: #ffffff !important;
          margin: 0 !important;
          padding: 0 !important;
          height: auto !important;
          overflow: visible !important;
        }
        body * { visibility: hidden !important; }
        #printable-a4, #printable-a4 * { visibility: visible !important; }
        #printable-a4 {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
          border: none !important;
          background: #ffffff !important;
          display: block !important;
        }
        .print\\:hidden {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(tempStyle);

    const cleanup = () => {
      tempStyle.remove();
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup, { once: true });

    setTimeout(() => {
      window.focus();
      try {
        window.print();
      } catch (err) {
        console.warn('Direct print failed, using PDF export fallback', err);
        handleDownloadPdf();
      }
    }, 250);
    setTimeout(cleanup, 3000);
  };

  // Stiahnutie A4 PDF
  const handleDownloadPdf = async () => {
    const el = document.getElementById('printable-a4');
    if (!el) return;
    try {
      setIsExportingPdf(true);
      const todayIso = new Date().toISOString().split('T')[0];
      const filename = generatePdfFilename('Esteticky_Report_A4', currentPatient.name, todayIso);
      await exportElementToPdf(
        el,
        filename,
        {
          format: 'a4',
          headerTitle: 'SAY CLINIC – Estetické ošetrenie',
          patientName: currentPatient.name
        }
      );
      setToastMsg('✅ A4 report bol stiahnutý do PDF.');
      setTimeout(() => setToastMsg(null), 3000);
    } catch (e) {
      console.error(e);
      setToastMsg('❌ Chyba pri generovaní PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const selectedHistorySession = sessions.find(s => s.id === selectedHistorySessionId) || sessions[0];

  return (
    <div className="space-y-4">
      
      {/* NOTIFIKÁCIA */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-[#2C2A29] text-white px-5 py-3 rounded-2xl shadow-2xl border border-[#C5A059] flex items-center gap-3 animate-in fade-in duration-200 print:hidden">
          <CheckCircle2 className="w-5 h-5 text-[#C5A059]" />
          <span className="text-xs font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* HLAVNÁ HORNÁ LIŠTA: PACIENT & REŽIMY */}
      <div className="rounded-3xl p-4 sm:p-5 bg-white/90 backdrop-blur-xl border border-[#E8E2D9] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden">
        
        {/* Pacient */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#2C2A29] to-[#433E3C] text-[#C5A059] flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059]">Estetická medicína</span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-[#8C857B]">2D Socha tváre</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <User className="w-3.5 h-3.5 text-[#8C857B]" />
              <select
                value={currentPatient.id}
                onChange={(e) => onSelectPatient && onSelectPatient(e.target.value)}
                className="text-sm font-bold text-[#2C2A29] bg-transparent focus:outline-hidden cursor-pointer hover:text-[#C5A059] transition-colors"
              >
                {localPatients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.birthNumber || p.dob})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Prepínač režimov (3 voľby) */}
        <div className="flex items-center gap-1.5 p-1 bg-[#FAF8F5] rounded-2xl border border-[#E8E2D9] self-stretch md:self-auto justify-between">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'editor'
                ? 'bg-[#2C2A29] text-white shadow-xs'
                : 'text-[#8C857B] hover:text-[#2C2A29]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Nové ošetrenie</span>
            {vectors.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#C5A059] text-white text-[10px] font-bold flex items-center justify-center ml-0.5">
                {vectors.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-[#2C2A29] text-white shadow-xs'
                : 'text-[#8C857B] hover:text-[#2C2A29]'
            }`}
          >
            <History className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Predošlé ošetrenia</span>
            {sessions.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#E8E2D9] text-[#2C2A29] text-[10px] font-bold flex items-center justify-center ml-0.5">
                {sessions.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('report')}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'report'
                ? 'bg-[#2C2A29] text-white shadow-xs'
                : 'text-[#8C857B] hover:text-[#2C2A29]'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>A4 Klientsky report</span>
          </button>
        </div>

        {/* Akčné tlačidlá vpravo */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          {activeTab === 'editor' && (
            <>
              {vectors.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Naozaj chcete vyčistiť všetky body a resetovať výpočet?')) {
                      setVectors([]);
                      setAppliedTemplateTitles([]);
                      setSelectedVectorId(null);
                      setSessionPrice(120);
                    }
                  }}
                  className="p-2 rounded-xl text-[#8C857B] hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer border border-transparent hover:border-red-200"
                  title="Vyčistiť body a šablóny"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#E8E2D9] hover:border-[#C5A059] text-xs font-bold text-[#2C2A29] shadow-2xs transition-all cursor-pointer"
                title="Vytlačiť A4 report tohto ošetrenia"
              >
                <Printer className="w-3.5 h-3.5 text-[#C5A059]" />
                <span className="hidden sm:inline">Tlačiť A4</span>
              </button>

              <button
                type="button"
                onClick={handleSaveSession}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#B38F46] hover:from-[#B38F46] hover:to-[#9E7B35] text-white text-xs font-bold shadow-sm transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <Save className="w-4 h-4" />
                <span>Uložiť ošetrenie</span>
              </button>
            </>
          )}

          {activeTab === 'history' && (
            <button
              type="button"
              onClick={() => {
                if (selectedHistorySession) {
                  setVectors([...selectedHistorySession.vectors]);
                  setLineItems(
                    selectedHistorySession.lineItems && selectedHistorySession.lineItems.length > 0
                      ? [...selectedHistorySession.lineItems]
                      : [{ id: 'li_h1', title: selectedHistorySession.appliedMaterialsSummary || selectedHistorySession.title, price: selectedHistorySession.price }]
                  );
                  setDiscountType(selectedHistorySession.discountType || 'percent');
                  setDiscountValue(selectedHistorySession.discountValue || 0);
                  setSessionRecommendations(selectedHistorySession.recommendations || DEFAULT_RECOMMENDATIONS);
                  setSessionNextStep(selectedHistorySession.nextStep || DEFAULT_NEXT_STEP);
                  setAppliedTemplateTitles(selectedHistorySession.appliedTemplatesList || []);
                  setActiveTab('editor');
                  setToastMsg('Body a rozpis z tohto ošetrenia boli načítané do nového ošetrenia.');
                  setTimeout(() => setToastMsg(null), 3000);
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#E8E2D9] hover:border-[#C5A059] text-xs font-bold text-[#2C2A29] shadow-2xs transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Použiť ako vzor</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. REŽIM EDITOR: ŠABLÓNY, VÝPOČET CENY A 2D SOCHA V STREDE               */}
      {/* ========================================================================= */}
      {activeTab === 'editor' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          
          {/* LIŠTA ŠABLÓN: VÝBER ŠABLÓNY -> NANESENIE BODOV -> VÝPOČET CENY */}
          <div className="p-4 bg-white/95 rounded-3xl border border-[#E8E2D9] shadow-xs space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-[#C5A059]" />
                <span className="text-xs font-bold text-[#2C2A29] uppercase tracking-wider">
                  Šablóny procedúr & Automatický výpočet ceny:
                </span>
                <span className="text-[10px] text-[#8C857B] bg-[#FAF8F5] px-2 py-0.5 rounded-full border border-[#E8E2D9]">
                  Kliknutím aplikujete body a sumu
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSaveCustomTemplateModal(true)}
                  disabled={vectors.length === 0}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-[#E8E2D9] hover:border-[#C5A059] text-[11px] font-bold text-[#2C2A29] transition-all disabled:opacity-40 cursor-pointer shadow-2xs"
                  title="Uložiť aktuálne nakreslené body na soche ako novú opakovateľnú šablónu"
                >
                  <BookmarkPlus className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Uložiť nákres</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAllTemplatesModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2C2A29] hover:bg-[#C5A059] text-white text-[11px] font-bold transition-all cursor-pointer shadow-xs"
                >
                  <Settings className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Katalóg & Ceny šablón ({templatesList.length})</span>
                </button>
              </div>
            </div>

            {/* Rýchle tlačidlá najčastejších šablón */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {templatesList.slice(0, 8).map((tpl) => {
                const isApplied = appliedTemplateTitles.includes(tpl.title);
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl, 'append')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 border ${
                      isApplied
                        ? 'bg-[#2C2A29] text-white border-[#2C2A29] shadow-xs ring-2 ring-[#C5A059]'
                        : 'bg-[#FAF8F5] hover:bg-white text-[#2C2A29] border-[#E8E2D9] hover:border-[#C5A059]'
                    }`}
                    title={tpl.description}
                  >
                    <span style={{ backgroundColor: tpl.color }} className="w-2 h-2 rounded-full shrink-0" />
                    <span>{tpl.title}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                      isApplied ? 'bg-[#C5A059] text-white' : 'bg-white border border-[#E8E2D9] text-[#2C2A29]'
                    }`}>
                      {tpl.price} €
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Aktuálny rozpis ceny a aplikovaných šablón */}
            {appliedTemplateTitles.length > 0 && (
              <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] flex items-center justify-between text-xs flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C857B]">
                    Aplikované šablóny:
                  </span>
                  {appliedTemplateTitles.map((t, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-lg bg-white border border-[#E8E2D9] font-medium text-[#2C2A29] flex items-center gap-1">
                      <span>{t}</span>
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[#8C857B] text-[11px]">Medzisúčet:</span>
                  <span className="font-bold font-mono text-sm text-[#2C2A29] bg-white px-2.5 py-1 rounded-lg border border-[#C5A059]/40">
                    {subtotal.toFixed(2)} €
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* RÝCHLE PREPARÁTY PRE VOĽNÉ DOKRESLOVANIE & SPRÁVA LÁTOK */}
          <div className="p-3 bg-white/90 rounded-2xl border border-[#E8E2D9] shadow-2xs">
            <div className="flex items-center justify-between mb-2 px-1 flex-wrap gap-2">
              <span className="text-[11px] font-bold text-[#8C857B] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#C5A059]" />
                Látky & Materiály pre aplikáciu bodov:
              </span>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#8C857B]">
                  Vybraný: <strong className="text-[#2C2A29]">{activeMaterial.name}</strong> ({activeMaterial.defaultPrice} €)
                </span>
                <button
                  type="button"
                  onClick={() => setShowMaterialsManagerModal(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E8E2D9] hover:border-[#C5A059] text-[10px] font-bold text-[#2C2A29] transition-all cursor-pointer shadow-2xs"
                  title="Pridať nové látky alebo upraviť ceny"
                >
                  <Settings className="w-3 h-3 text-[#C5A059]" />
                  <span>Správa látok & Cien</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {materialsList.map((mat, idx) => {
                const isSelected = selectedMaterialIdx === idx;
                return (
                  <button
                    key={mat.id}
                    type="button"
                    onClick={() => handleSelectMaterial(idx)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#2C2A29] text-white border-[#2C2A29] shadow-md ring-2 ring-[#C5A059]'
                        : 'bg-[#FAF8F5] hover:bg-white text-[#2C2A29] border-[#E8E2D9] hover:border-[#C5A059]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span 
                        style={{ backgroundColor: mat.color }} 
                        className="w-2.5 h-2.5 rounded-full shadow-xs" 
                      />
                      <span className={`text-[9px] uppercase font-bold font-mono ${isSelected ? 'text-[#F5E4B8]' : 'text-[#8C857B]'}`}>
                        {mat.defaultPrice} €
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-bold truncate leading-tight">{mat.name}</div>
                      <div className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-gray-300' : 'text-[#8C857B]'}`}>
                        {mat.categoryLabel}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* HLAVNÁ ČASŤ: 2D SOCHA V STREDE */}
          <div className="rounded-3xl p-4 sm:p-6 bg-white/95 border border-[#E8E2D9] shadow-sm flex flex-col items-center">
            
            <div className="w-full flex items-center justify-between pb-3 border-b border-[#E8E2D9] mb-3 text-xs flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span className="font-bold text-[#2C2A29] flex items-center gap-1.5">
                  <span style={{ backgroundColor: activeMaterial.color }} className="w-3 h-3 rounded-full" />
                  {activeMaterial.name}
                </span>
                <span className="text-[#8C857B]">·</span>
                <span className="text-[#8C857B]">{activeMaterial.recommendedTechnique}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[#8C857B]">Počet bodov na soche:</span>
                <span className="font-bold text-[#2C2A29] bg-[#FAF8F5] px-2 py-0.5 rounded-lg border border-[#E8E2D9]">
                  {vectors.length} bodov
                </span>
              </div>
            </div>

            {/* Samotná 2D Socha */}
            <div className="w-full max-w-3xl flex flex-col items-center">
              <Sculpture2DViewer
                vectors={vectors}
                onVectorsChange={setVectors}
                activeTool={activeTool}
                onSelectTool={setActiveTool}
                activeColor={activeColor}
                onSelectColor={setActiveColor}
                currentProduct={{
                  name: activeMaterial.name,
                  lot: activeMaterial.lot,
                  type: activeMaterial.type
                }}
                selectedVectorId={selectedVectorId}
                onSelectVector={setSelectedVectorId}
                activeView={activeSculptureView}
                onViewChange={setActiveSculptureView}
                readOnly={false}
              />
            </div>
          </div>

          {/* POLOŽKY OŠETRENIA, VÝPOČET CENY, ZĽAVA A A4 ZHRNUTIE */}
          <div className="rounded-3xl p-5 bg-white border border-[#E8E2D9] shadow-xs space-y-4">
            
            <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-3 flex-wrap gap-2">
              <div>
                <h3 className="text-xs font-bold text-[#2C2A29] uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#C5A059]" />
                  Aplikované výkony a látky (Rozpis pre A4 report & vyúčtovanie)
                </h3>
                <p className="text-[11px] text-[#8C857B] mt-0.5">
                  Presný názov a cena, ktoré sa vytlačia na klientsky A4 report (napr. Dysport, m. frontalis bilat., 4 vpichy strana, celkovo 50IU)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddLineItem()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E8E2D9] hover:border-[#C5A059] text-xs font-bold text-[#2C2A29] transition-all cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Pridať vlastný riadok</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddLineItem(`${activeMaterial.name}, aplikácia`, activeMaterial.defaultPrice)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] hover:border-[#C5A059] text-xs font-bold text-[#2C2A29] transition-all cursor-pointer"
                >
                  <span>+ Pridať {activeMaterial.name} ({activeMaterial.defaultPrice} €)</span>
                </button>
              </div>
            </div>

            {/* EDITOVATEĽNÝ ZOZNAM POLOŽIEK */}
            <div className="space-y-2">
              {lineItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl border border-[#E8E2D9] hover:border-[#C5A059]/60 bg-[#FAF8F5]/50 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-[#2C2A29] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => handleUpdateLineItem(item.id, { title: e.target.value })}
                      placeholder="Napr. Dysport, m. frontalis bilat., 4 vpichy strana, celkovo 50IU"
                      className="w-full text-xs font-semibold text-[#2C2A29] bg-white px-3 py-2 rounded-xl border border-[#E8E2D9] focus:outline-hidden focus:border-[#C5A059]"
                    />
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="5"
                        value={item.price}
                        onChange={(e) => handleUpdateLineItem(item.id, { price: Number(e.target.value) || 0 })}
                        className="w-24 text-xs font-bold font-mono text-[#2C2A29] bg-white p-2 pr-6 rounded-xl border border-[#E8E2D9] focus:outline-hidden focus:border-[#C5A059] text-right"
                      />
                      <span className="absolute right-2 top-2 text-xs font-bold text-[#8C857B]">€</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteLineItem(item.id)}
                      className="p-2 rounded-xl text-[#8C857B] hover:text-red-500 hover:bg-red-50 cursor-pointer transition-colors"
                      title="Odstrániť túto položku"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {lineItems.length === 0 && (
                <div className="p-4 text-center text-xs text-[#8C857B] bg-[#FAF8F5] rounded-2xl border border-dashed border-[#E8E2D9]">
                  Zatiaľ nie sú pridané žiadne položky. Vyberte šablónu hore alebo kliknite na &quot;Pridať vlastný riadok&quot;.
                </div>
              )}
            </div>

            {/* SEKCIA ZĽAVA & FINANČNÝ ROZPIS */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              
              {/* Voľba zľavy */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#8C857B] uppercase tracking-wider flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-[#C5A059]" />
                  Zľava pre klienta:
                </label>
                
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[0, 5, 10, 15, 20].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => {
                        setDiscountType('percent');
                        setDiscountValue(pct);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        discountType === 'percent' && discountValue === pct
                          ? 'bg-[#2C2A29] text-white shadow-2xs'
                          : 'bg-white text-[#2C2A29] border border-[#E8E2D9] hover:border-[#C5A059]'
                      }`}
                    >
                      {pct === 0 ? 'Bez zľavy' : `-${pct} %`}
                    </button>
                  ))}

                  <div className="flex items-center gap-1 ml-1">
                    <input
                      type="number"
                      min="0"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                      placeholder="Suma"
                      className="w-16 p-1.5 text-xs font-bold font-mono bg-white rounded-xl border border-[#E8E2D9] focus:outline-hidden text-center"
                    />
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as 'percent' | 'fixed')}
                      className="p-1.5 text-xs font-bold bg-white rounded-xl border border-[#E8E2D9] focus:outline-hidden cursor-pointer"
                    >
                      <option value="percent">%</option>
                      <option value="fixed">€</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Súhrn: Medzisúčet, Zľava, Výsledná cena */}
              <div className="bg-white p-3.5 rounded-2xl border border-[#E8E2D9] space-y-1 text-xs">
                <div className="flex justify-between items-center text-[#8C857B]">
                  <span>Medzisúčet položiek:</span>
                  <span className="font-mono font-semibold text-[#2C2A29]">{subtotal.toFixed(2)} €</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-[#10B981] font-semibold">
                    <span>Zľava {discountType === 'percent' ? `(${discountValue} %)` : '(pevná)'}:</span>
                    <span className="font-mono font-bold">- {discountAmount.toFixed(2)} €</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-[#E8E2D9]">
                  <span className="font-bold uppercase tracking-wider text-[#2C2A29]">
                    Spolu výsledná cena:
                  </span>
                  <span className="text-base font-bold font-mono text-[#2C2A29] bg-[#FAF8F5] px-3 py-1 rounded-xl border border-[#C5A059]/40 shadow-2xs">
                    {finalTotalPrice.toFixed(2)} €
                  </span>
                </div>
              </div>

            </div>

            {/* ODPORÚČANIA A TERMÍN KONTROLY */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-1.5">
                <label className="text-[11px] font-bold text-[#8C857B] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                  Odporúčania po zákroku:
                </label>
                <textarea
                  rows={3}
                  value={sessionRecommendations}
                  onChange={(e) => setSessionRecommendations(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-white border border-[#E8E2D9] text-[#2C2A29] focus:outline-hidden resize-none"
                  placeholder="Inštrukcie pre domáci režim..."
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-1.5">
                <label className="text-[11px] font-bold text-[#8C857B] flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#3B82F6]" />
                  Ďalší postup & Plánovaný termín:
                </label>
                <textarea
                  rows={3}
                  value={sessionNextStep}
                  onChange={(e) => setSessionNextStep(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-white border border-[#E8E2D9] text-[#2C2A29] focus:outline-hidden resize-none"
                  placeholder="Kontrola o 14 dní..."
                />
              </div>
            </div>

            {/* Akcie na konci formulára */}
            <div className="flex items-center justify-between pt-2 border-t border-[#E8E2D9] flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('report')}
                className="text-xs text-[#8C857B] hover:text-[#2C2A29] font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Náhľad pred tlačou A4</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white border border-[#E8E2D9] hover:border-[#C5A059] text-xs font-bold text-[#2C2A29] shadow-2xs transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-[#C5A059]" />
                  <span>Tlačiť A4 report</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isExportingPdf}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#2C2A29] hover:bg-[#C5A059] text-white text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4 text-[#C5A059]" />
                  <span>{isExportingPdf ? 'Pripravujem PDF...' : 'Stiahnuť A4 PDF'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveSession}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#C5A059] to-[#B38F46] hover:from-[#B38F46] hover:to-[#9E7B35] text-white text-xs font-bold shadow-md shadow-[#C5A059]/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Uložiť ošetrenie do karty pacienta</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. REŽIM HISTÓRIA: LEN TVAR SOCHY S PRESNE OZNAČENÝMI BODMI              */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          
          {/* LIŠTA DÁTUMOV PREDOŠLÝCH OŠETRENÍ */}
          <div className="p-3.5 bg-white/95 rounded-2xl border border-[#E8E2D9] shadow-2xs">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-bold text-[#8C857B] uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-[#C5A059]" />
                Uložené predchádzajúce ošetrenia pacienta {currentPatient.name}:
              </span>
              <span className="text-[11px] font-semibold text-[#8C857B]">
                {sessions.length} zaznamenaných sedení
              </span>
            </div>

            {sessions.length > 0 ? (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {sessions.map((sess) => {
                  const isSelected = selectedHistorySessionId === sess.id;
                  return (
                    <button
                      key={sess.id}
                      type="button"
                      onClick={() => setSelectedHistorySessionId(sess.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 border ${
                        isSelected
                          ? 'bg-[#2C2A29] text-white border-[#2C2A29] shadow-sm ring-2 ring-[#C5A059]'
                          : 'bg-[#FAF8F5] hover:bg-white text-[#2C2A29] border-[#E8E2D9] hover:border-[#C5A059]'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>{sess.formattedDate}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-[11px] font-medium opacity-80">{sess.price} €</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        isSelected ? 'bg-[#C5A059] text-white' : 'bg-[#E8E2D9] text-[#2C2A29]'
                      }`}>
                        {sess.vectors?.length || 0} bodov
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-[#8C857B] bg-[#FAF8F5] rounded-xl border border-dashed border-[#E8E2D9]">
                Pre tohto pacienta zatiaľ nie sú zaznamenané žiadne predchádzajúce ošetrenia.
              </div>
            )}
          </div>

          {/* VIZUÁLNA KARTA SOCHY S PRESNE OZNAČENÝMI BODMI (READ ONLY) */}
          {selectedHistorySession ? (
            <div className="rounded-3xl p-4 sm:p-6 bg-white/95 border border-[#E8E2D9] shadow-sm flex flex-col items-center">
              
              <div className="w-full flex items-center justify-between pb-3 border-b border-[#E8E2D9] mb-3 text-xs flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-xl bg-[#C5A059] text-white font-bold text-xs">
                    {selectedHistorySession.formattedDate}
                  </span>
                  <span className="font-bold text-[#2C2A29]">{selectedHistorySession.title}</span>
                  <span className="text-[#8C857B] font-mono">({selectedHistorySession.protocolNumber})</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setVectors([...selectedHistorySession.vectors]);
                      setLineItems(
                        selectedHistorySession.lineItems && selectedHistorySession.lineItems.length > 0
                          ? [...selectedHistorySession.lineItems]
                          : [{ id: 'li_h1', title: selectedHistorySession.appliedMaterialsSummary || selectedHistorySession.title, price: selectedHistorySession.price }]
                      );
                      setDiscountType(selectedHistorySession.discountType || 'percent');
                      setDiscountValue(selectedHistorySession.discountValue || 0);
                      setSessionRecommendations(selectedHistorySession.recommendations);
                      setSessionNextStep(selectedHistorySession.nextStep);
                      setSessionProtocolNo(selectedHistorySession.protocolNumber || `AES-${Date.now().toString().slice(-6)}`);
                      setAppliedTemplateTitles(selectedHistorySession.appliedTemplatesList || []);
                      setActiveTab('report');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF8F5] hover:bg-[#F4EEE5] text-[#2C2A29] border border-[#E8E2D9] font-bold text-xs cursor-pointer transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Zobraziť A4 report tohto dňa</span>
                  </button>
                </div>
              </div>

              {/* Socha s presne označenými bodmi */}
              <div className="w-full max-w-3xl flex flex-col items-center">
                <Sculpture2DViewer
                  vectors={selectedHistorySession.vectors || []}
                  onVectorsChange={() => {}}
                  activeTool="select"
                  onSelectTool={() => {}}
                  activeColor="#C5A059"
                  onSelectColor={() => {}}
                  activeView={activeSculptureView}
                  onViewChange={setActiveSculptureView}
                  readOnly={true}
                />
              </div>

              {/* Jednoduchý prehľad sedenia pod sochou */}
              <div className="w-full mt-4 pt-3 border-t border-[#E8E2D9] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9]">
                  <span className="text-[10px] text-[#8C857B] uppercase font-bold block mb-1">Aplikované materiály:</span>
                  <span className="font-semibold text-[#2C2A29]">
                    {selectedHistorySession.appliedMaterialsSummary || 'Aplikácia preparátov'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9]">
                  <span className="text-[10px] text-[#8C857B] uppercase font-bold block mb-1">Účtovaná cena:</span>
                  <span className="font-bold text-sm text-[#2C2A29]">
                    {selectedHistorySession.price} €
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9]">
                  <span className="text-[10px] text-[#8C857B] uppercase font-bold block mb-1">Ďalší termín / Kontrola:</span>
                  <span className="text-[#2C2A29]">
                    {selectedHistorySession.nextStep || 'Bez špecifikácie'}
                  </span>
                </div>
              </div>

            </div>
          ) : null}

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. REŽIM A4 REPORT: JEDNODUCHÝ SUHRN PRE KLIENTA                          */}
      {/* ========================================================================= */}
      {activeTab === 'report' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          
          {/* OVLÁDACIA LIŠTA PRE TLAČ A PDF */}
          <div className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-[#E8E2D9] shadow-xs print:hidden">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className="flex items-center gap-1.5 text-xs text-[#8C857B] hover:text-[#2C2A29] font-bold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Späť na sochu</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[#E8E2D9] hover:border-[#C5A059] text-xs font-bold text-[#2C2A29] shadow-2xs cursor-pointer transition-all"
              >
                <Printer className="w-4 h-4 text-[#C5A059]" />
                <span>Tlačiť (A4)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isExportingPdf}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2C2A29] hover:bg-[#C5A059] text-white text-xs font-bold shadow-sm cursor-pointer transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isExportingPdf ? 'Pripravujem PDF...' : 'Stiahnuť A4 PDF'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SAMOTNÝ A4 REPORT (VŽDY PRÍTOMNÝ V DOM PRE TLAČ AJ NÁHĽAD) */}
      <div className={`${activeTab === 'report' ? 'block' : 'hidden'} print:block`}>
        <div className="max-w-4xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-[#E8E2D9] shadow-lg print:p-0 print:border-none print:shadow-none print:max-w-none">
          
          <div id="printable-a4" className="printable-document bg-white p-6 sm:p-8 space-y-6 text-xs text-[#2C2A29] leading-relaxed">
            
            {/* HLAVIČKA KLINIKY */}
            <div className="flex items-center justify-between border-b-2 border-[#C5A059] pb-5">
              <div>
                <h1 className="text-2xl font-serif font-bold tracking-wider text-[#2C2A29]">
                  SAY CLINIC
                </h1>
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#C5A059] mt-0.5">
                  PLASTICKÁ CHIRURGIA & ESTETICKÁ MEDICÍNA
                </p>
                <p className="text-[10px] text-[#8C857B] mt-1">
                  Lazovná 43, 974 01 Banská Bystrica • Tel: +421 905 123 456 • www.sayclinic.sk
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-[#2C2A29]">Dátum: {new Date().toLocaleDateString('sk-SK')}</div>
                <div className="text-[10px] text-[#8C857B] font-mono mt-0.5">Protokol: {sessionProtocolNo}</div>
                <div className="text-[10px] font-semibold text-[#C5A059] mt-1">Správa pre klienta</div>
              </div>
            </div>

            {/* IDENTIFIKÁCIA PACIENTA & LEKÁRA */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9]">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#8C857B] block">Klient:</span>
                <div className="font-bold text-sm text-[#2C2A29]">{currentPatient.name}</div>
                <div className="text-[11px] text-[#8C857B]">
                  {currentPatient.birthNumber ? `Rodné číslo: ${currentPatient.birthNumber}` : `Dátum nar.: ${currentPatient.dob}`}
                </div>
                {currentPatient.phone && (
                  <div className="text-[11px] text-[#8C857B]">Tel: {currentPatient.phone}</div>
                )}
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-[#8C857B] block">Ošetrujúci lekár:</span>
                <div className="font-bold text-sm text-[#2C2A29]">MUDr. Ján Mráz</div>
                <div className="text-[11px] text-[#8C857B]">Špecializácia: Plastická chirurgia & Estetika</div>
                <div className="text-[11px] text-[#8C857B]">Pracovisko: SAY CLINIC Banská Bystrica</div>
              </div>
            </div>

            {/* 1. ČO BOLO APLIKOVANÉ / POLOŽKY VÝKONU */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C2A29] flex items-center gap-1.5 pb-1 border-b border-[#E8E2D9]">
                <span className="w-2 h-2 rounded-full bg-[#C5A059]" />
                1. Aplikované látky a výkony:
              </h3>

              {lineItems.length > 0 ? (
                <div className="border border-[#E8E2D9] rounded-2xl overflow-hidden bg-white">
                  <div className="divide-y divide-[#E8E2D9]">
                    {lineItems.map((item, idx) => (
                      <div key={item.id || idx} className="p-3.5 flex items-start justify-between gap-4">
                        <div className="space-y-0.5">
                          <div className="font-bold text-xs text-[#2C2A29] leading-snug">
                            • {item.title}
                          </div>
                          {item.lot && (
                            <div className="text-[10px] text-[#8C857B]">
                              Šarža (LOT): <span className="font-mono text-[#C5A059]">{item.lot}</span>
                            </div>
                          )}
                        </div>
                        <div className="font-bold font-mono text-xs text-[#2C2A29] shrink-0 text-right">
                          {(Number(item.price) || 0).toFixed(2)} €
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* FINANČNÝ SÚHRN: MEDZISÚČET, ZĽAVA, VÝSLEDNÁ CENA */}
                  <div className="bg-[#FAF8F5] p-3.5 border-t border-[#E8E2D9] space-y-1.5">
                    <div className="flex justify-between items-center text-xs text-[#8C857B]">
                      <span>Medzisúčet:</span>
                      <span className="font-mono font-semibold text-[#2C2A29]">{subtotal.toFixed(2)} €</span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex justify-between items-center text-xs text-[#10B981] font-semibold">
                        <span>Zľava {discountType === 'percent' ? `(${discountValue} %)` : ''}:</span>
                        <span className="font-mono font-bold">- {discountAmount.toFixed(2)} €</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t border-[#E8E2D9]">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#2C2A29]">
                        Spolu výsledná cena:
                      </span>
                      <span className="text-base font-bold font-mono text-[#2C2A29] bg-white px-3 py-1 rounded-xl border border-[#C5A059]/50 shadow-2xs">
                        {finalTotalPrice.toFixed(2)} €
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#8C857B] italic p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E2D9]">
                  Neboli zadané žiadne položky ošetrenia.
                </p>
              )}
            </div>

            {/* 2. ODPORÚČANIA LEKÁRA (POAPLIKAČNÝ REŽIM) */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C2A29] flex items-center gap-1.5 pb-1 border-b border-[#E8E2D9]">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                2. Odporúčania lekára a domáci režim:
              </h3>
              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[11px] whitespace-pre-line leading-relaxed text-[#2C2A29]">
                {sessionRecommendations || DEFAULT_RECOMMENDATIONS}
              </div>
            </div>

            {/* 3. ĎALŠÍ POSTUP A PLÁNOVANÁ KONTROLA */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C2A29] flex items-center gap-1.5 pb-1 border-b border-[#E8E2D9]">
                <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                3. Ďalší postup a plánovaná kontrola:
              </h3>
              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-xs font-semibold text-[#2C2A29]">
                {sessionNextStep || DEFAULT_NEXT_STEP}
              </div>
            </div>

            {/* PODPIS A PEČIATKA */}
            <div className="pt-8 mt-6 border-t border-[#E8E2D9] flex items-end justify-between text-[10px] text-[#8C857B]">
              <div>
                <div className="font-bold text-[#C5A059]">SAY CLINIC Aesthetic Medicine</div>
                <div>Lazovná 43, 974 01 Banská Bystrica</div>
              </div>

              <div className="text-center">
                <div className="w-48 border-b border-[#2C2A29] mb-1.5" />
                <div className="font-bold text-[#2C2A29]">MUDr. Ján Mráz</div>
                <div>Pečiatka a podpis lekára</div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: KATALÓG & SPRÁVA ŠABLÓN SO ZMENOU CIEN A VYTVÁRANÍM             */}
      {/* ========================================================================= */}
      {showAllTemplatesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in print:hidden">
          <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[88vh] flex flex-col">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D9]">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-[#C5A059]" />
                <div>
                  <h3 className="text-sm font-bold text-[#2C2A29]">Katalóg & Správa estetických šablón</h3>
                  <p className="text-[11px] text-[#8C857B]">Môžete priamo prepísať ceny šablón, pridať nové šablóny alebo ich aplikovať na sochu</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAllTemplatesModal(false)}
                className="p-1 rounded-xl text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#FAF8F5] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filtre a tlačidlo vytvorenia novej šablóny */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 p-1 bg-[#FAF8F5] rounded-xl border border-[#E8E2D9] text-xs">
                {[
                  { id: 'all', label: 'Všetky' },
                  { id: 'botox', label: 'Botulotoxín' },
                  { id: 'filler', label: 'Výplne' },
                  { id: 'biostimulator', label: 'Biostimulátory' },
                  { id: 'custom', label: 'Vlastné' }
                ].map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setTemplateFilterCategory(f.id)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      templateFilterCategory === f.id
                        ? 'bg-white text-[#2C2A29] shadow-2xs'
                        : 'text-[#8C857B] hover:text-[#2C2A29]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Obnoviť pôvodné preddefinované šablóny a ich ceny?')) {
                      saveTemplatesToStorage(PRESET_PROCEDURES);
                      setToastMsg('Pôvodné šablóny boli obnovené.');
                      setTimeout(() => setToastMsg(null), 3000);
                    }
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-semibold text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#FAF8F5] cursor-pointer"
                  title="Obnoviť predvolené továrenské šablóny"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Obnoviť pôvodné</span>
                </button>
              </div>
            </div>

            {/* Formulár rýchleho vytvorenia novej šablóny */}
            <details className="group border border-[#E8E2D9] rounded-2xl p-3 bg-[#FAF8F5]/60 text-xs">
              <summary className="font-bold text-[#2C2A29] cursor-pointer flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[#C5A059]">
                  <Plus className="w-4 h-4" />
                  <span>Vytvoriť novú šablónu s vlastnou cenou</span>
                </span>
                <span className="text-[10px] text-[#8C857B] group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <form onSubmit={handleAddNewTemplate} className="space-y-3 pt-3 mt-2 border-t border-[#E8E2D9]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-[#8C857B] mb-1">Názov šablóny:</label>
                    <input
                      type="text"
                      required
                      value={newTplTitle}
                      onChange={(e) => setNewTplTitle(e.target.value)}
                      placeholder="Napr. Botox Glabela + Čelo (Duo)"
                      className="w-full p-2 bg-white rounded-xl border border-[#E8E2D9] text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#8C857B] mb-1">Cena (€):</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={newTplPrice}
                      onChange={(e) => setNewTplPrice(Number(e.target.value) || 0)}
                      className="w-full p-2 bg-white rounded-xl border border-[#E8E2D9] text-xs font-bold font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-[#8C857B] mb-1">Použitý preparát:</label>
                    <select
                      value={newTplProductName}
                      onChange={(e) => setNewTplProductName(e.target.value)}
                      className="w-full p-2 bg-white rounded-xl border border-[#E8E2D9] text-xs font-semibold cursor-pointer"
                    >
                      {materialsList.map(m => (
                        <option key={m.id} value={m.name}>{m.name} ({m.defaultPrice} €)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#8C857B] mb-1">Kategória:</label>
                    <select
                      value={newTplCategory}
                      onChange={(e) => setNewTplCategory(e.target.value as any)}
                      className="w-full p-2 bg-white rounded-xl border border-[#E8E2D9] text-xs font-semibold cursor-pointer"
                    >
                      <option value="botox">Botulotoxín</option>
                      <option value="filler">Kyselina hyalurónová (Výplň)</option>
                      <option value="meso">Bioremodelácia / Mezo</option>
                      <option value="biostimulator">Biostimulátor</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#8C857B] mb-1">Popis / Zóny aplikácie (pre klienta):</label>
                  <input
                    type="text"
                    value={newTplDesc}
                    onChange={(e) => setNewTplDesc(e.target.value)}
                    placeholder="Napr. m. frontalis bilat., 4 vpichy strana, celkovo 50IU"
                    className="w-full p-2 bg-white rounded-xl border border-[#E8E2D9] text-xs"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#2C2A29] hover:bg-[#C5A059] text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
                  >
                    Uložiť šablónu do katalógu
                  </button>
                </div>
              </form>
            </details>

            {/* Zoznam šablón s priamou úpravou cien */}
            <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
              {templatesList
                .filter(t => {
                  if (templateFilterCategory === 'custom') return t.isCustom;
                  if (templateFilterCategory === 'all') return true;
                  return t.category === templateFilterCategory;
                })
                .map((tpl) => (
                  <div
                    key={tpl.id}
                    className="p-3.5 rounded-2xl border border-[#E8E2D9] hover:border-[#C5A059] bg-[#FAF8F5]/60 hover:bg-white transition-all flex items-start justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span style={{ backgroundColor: tpl.color }} className="w-2.5 h-2.5 rounded-full shrink-0" />
                        <h4 className="text-xs font-bold text-[#2C2A29] truncate">{tpl.title}</h4>
                        {tpl.isCustom && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-[#F5E4B8] text-[#856404]">
                            Vlastná
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#8C857B] mt-1 leading-snug">{tpl.description}</p>
                      <div className="flex items-center gap-3 text-[10px] text-[#8C857B] mt-2">
                        <span>Preparát: <strong className="text-[#2C2A29]">{tpl.productName}</strong></span>
                        <span>·</span>
                        <span>{tpl.vectors.length} bodov</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {/* Priamo editovateľná cena */}
                      <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-[#E8E2D9]">
                        <span className="text-[10px] text-[#8C857B] font-bold">Cena:</span>
                        <input
                          type="number"
                          min="0"
                          step="5"
                          value={tpl.price}
                          onChange={(e) => handleUpdateTemplatePrice(tpl.id, Number(e.target.value) || 0)}
                          className="w-14 text-xs font-bold font-mono text-[#2C2A29] bg-transparent focus:outline-hidden text-right"
                          title="Kliknutím upravíte cenu tejto šablóny"
                        />
                        <span className="text-xs font-bold text-[#2C2A29]">€</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {tpl.isCustom && (
                          <button
                            type="button"
                            onClick={() => handleDeleteTemplate(tpl.id)}
                            className="p-1.5 rounded-lg text-[#8C857B] hover:text-red-500 hover:bg-red-50 cursor-pointer"
                            title="Zmazať šablónu"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleApplyTemplate(tpl, 'replace')}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white hover:bg-gray-100 text-[#2C2A29] border border-[#E8E2D9] cursor-pointer"
                          title="Vyčistiť existujúce a použiť len túto šablónu"
                        >
                          Nahradiť
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyTemplate(tpl, 'append')}
                          className="px-3 py-1 rounded-lg text-[10px] font-bold bg-[#2C2A29] hover:bg-[#C5A059] text-white cursor-pointer shadow-xs"
                          title="Pridať body a pripočítať cenu"
                        >
                          + Pridať
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: SPRÁVA MATERIÁLOV & PREPARÁTOV (PRIDAŤ LÁTKY, ZMENIŤ CENY)     */}
      {/* ========================================================================= */}
      {showMaterialsManagerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in print:hidden">
          <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[88vh] flex flex-col">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D9]">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#C5A059]" />
                <div>
                  <h3 className="text-sm font-bold text-[#2C2A29]">Správa materiálov & preparátov</h3>
                  <p className="text-[11px] text-[#8C857B]">Pridajte nové látky do kliniky alebo upravte ceny existujúcich preparátov</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMaterialsManagerModal(false)}
                className="p-1 rounded-xl text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#FAF8F5] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulár pre pridanie novej látky */}
            <details className="group border border-[#E8E2D9] rounded-2xl p-3 bg-[#FAF8F5]/60 text-xs">
              <summary className="font-bold text-[#2C2A29] cursor-pointer flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[#C5A059]">
                  <Plus className="w-4 h-4" />
                  <span>Pridať novú látku / preparát do ponuky</span>
                </span>
                <span className="text-[10px] text-[#8C857B] group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <form onSubmit={handleAddNewMaterial} className="space-y-3 pt-3 mt-2 border-t border-[#E8E2D9]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-[#8C857B] mb-1">Názov preparátu:</label>
                    <input
                      type="text"
                      required
                      value={newMatName}
                      onChange={(e) => setNewMatName(e.target.value)}
                      placeholder="Napr. Juvederm Volite 1ml"
                      className="w-full p-2 bg-white rounded-xl border border-[#E8E2D9] text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#8C857B] mb-1">Kategória látky:</label>
                    <select
                      value={newMatType}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setNewMatType(val);
                        if (val === 'botox') {
                          setNewMatCategory('Botulotoxín A');
                          setNewMatColor('#3B82F6');
                          setNewMatUnit('Speywood');
                        } else if (val === 'filler') {
                          setNewMatCategory('Výplň (HA)');
                          setNewMatColor('#EC4899');
                          setNewMatUnit('ml');
                        } else if (val === 'meso') {
                          setNewMatCategory('Bioremodelácia');
                          setNewMatColor('#10B981');
                          setNewMatUnit('ml');
                        } else {
                          setNewMatCategory('Biostimulátor');
                          setNewMatColor('#C5A059');
                          setNewMatUnit('ml');
                        }
                      }}
                      className="w-full p-2 bg-white rounded-xl border border-[#E8E2D9] text-xs font-semibold cursor-pointer"
                    >
                      <option value="botox">Botulotoxín</option>
                      <option value="filler">Výplň (Kyselina hyalurónová)</option>
                      <option value="meso">Bioremodelácia / Mezoterapia</option>
                      <option value="biostimulator">Biostimulátor kolagénu</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-[#8C857B] mb-1">Šarža (LOT):</label>
                    <input
                      type="text"
                      value={newMatLot}
                      onChange={(e) => setNewMatLot(e.target.value)}
                      className="w-full p-2 bg-white rounded-xl border border-[#E8E2D9] text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#8C857B] mb-1">Cena (€):</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={newMatPrice}
                      onChange={(e) => setNewMatPrice(Number(e.target.value) || 0)}
                      className="w-full p-2 bg-white rounded-xl border border-[#E8E2D9] text-xs font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#8C857B] mb-1">Farba bodu na soche:</label>
                    <div className="flex items-center gap-1.5 pt-1">
                      {['#3B82F6', '#EC4899', '#10B981', '#C5A059', '#8B5CF6', '#F59E0B'].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewMatColor(c)}
                          style={{ backgroundColor: c }}
                          className={`w-6 h-6 rounded-full cursor-pointer transition-all ${
                            newMatColor === c ? 'ring-2 ring-offset-2 ring-[#2C2A29]' : 'opacity-80 hover:opacity-100'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#8C857B] mb-1">Odporúčaná technika:</label>
                  <input
                    type="text"
                    value={newMatTechnique}
                    onChange={(e) => setNewMatTechnique(e.target.value)}
                    placeholder="Napr. Kanylový vejárovitý nános na periost"
                    className="w-full p-2 bg-white rounded-xl border border-[#E8E2D9] text-xs"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#2C2A29] hover:bg-[#C5A059] text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
                  >
                    Pridať látku do databázy
                  </button>
                </div>
              </form>
            </details>

            {/* Zoznam látok s okamžitou úpravou cien */}
            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
              <div className="flex items-center justify-between px-1 text-[11px] font-bold text-[#8C857B]">
                <span>Preparát & Šarža</span>
                <span>Základná cena (€)</span>
              </div>

              {materialsList.map((mat) => (
                <div
                  key={mat.id}
                  className="p-3 rounded-2xl border border-[#E8E2D9] bg-[#FAF8F5]/60 hover:bg-white flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span style={{ backgroundColor: mat.color }} className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#2C2A29] truncate">{mat.name}</div>
                      <div className="text-[10px] text-[#8C857B] flex items-center gap-2">
                        <span>{mat.categoryLabel}</span>
                        <span>·</span>
                        <span className="font-mono text-[#C5A059]">LOT: {mat.lot}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="5"
                        value={mat.defaultPrice}
                        onChange={(e) => handleUpdateMaterialPrice(mat.id, Number(e.target.value) || 0)}
                        className="w-20 text-xs font-bold font-mono text-[#2C2A29] bg-white p-2 pr-5 rounded-xl border border-[#E8E2D9] focus:outline-hidden focus:border-[#C5A059] text-right"
                        title="Kliknutím upravíte cenu preparátu"
                      />
                      <span className="absolute right-2 top-2 text-xs font-bold text-[#8C857B]">€</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteMaterial(mat.id)}
                      className="p-2 rounded-xl text-[#8C857B] hover:text-red-500 hover:bg-red-50 cursor-pointer transition-colors"
                      title="Odstrániť látku"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#E8E2D9]">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Obnoviť pôvodný preddefinovaný zoznam látok a cien?')) {
                    saveMaterialsToStorage(PRESET_MATERIALS);
                    setToastMsg('Pôvodný zoznam látok bol obnovený.');
                    setTimeout(() => setToastMsg(null), 3000);
                  }
                }}
                className="flex items-center gap-1.5 text-xs text-[#8C857B] hover:text-[#2C2A29] cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Obnoviť pôvodné látky</span>
              </button>

              <button
                type="button"
                onClick={() => setShowMaterialsManagerModal(false)}
                className="px-5 py-2 rounded-xl bg-[#2C2A29] text-white text-xs font-bold hover:bg-[#C5A059] transition-all cursor-pointer shadow-xs"
              >
                Hotovo
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ULOŽIŤ AKTUÁLNY NÁKRES AKO VLASTNÚ ŠABLÓNU                      */}
      {/* ========================================================================= */}
      {showSaveCustomTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in print:hidden">
          <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-2xl max-w-md w-full p-6 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D9]">
              <div className="flex items-center gap-2">
                <BookmarkPlus className="w-5 h-5 text-[#C5A059]" />
                <h3 className="text-sm font-bold text-[#2C2A29]">Uložiť vlastnú šablónu</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSaveCustomTemplateModal(false)}
                className="p-1 rounded-xl text-[#8C857B] hover:text-[#2C2A29] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomTemplate} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#8C857B] mb-1">Názov šablóny:</label>
                <input
                  type="text"
                  required
                  value={customTemplateTitle}
                  onChange={(e) => setCustomTemplateTitle(e.target.value)}
                  placeholder="Napr. Môj protokol pery + brada"
                  className="w-full p-2.5 rounded-xl border border-[#E8E2D9] bg-white font-semibold text-[#2C2A29] focus:outline-hidden focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#8C857B] mb-1">Cena ošetrenia (€):</label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  required
                  value={customTemplatePrice}
                  onChange={(e) => setCustomTemplatePrice(Number(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-xl border border-[#E8E2D9] bg-white font-bold font-mono text-[#2C2A29] focus:outline-hidden focus:border-[#C5A059]"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[11px] text-[#8C857B]">
                Bude uložených <strong className="text-[#2C2A29]">{vectors.length}</strong> vyznačených bodov s aktívnym preparátom <strong className="text-[#2C2A29]">{activeMaterial.name}</strong>.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E2D9]">
                <button
                  type="button"
                  onClick={() => setShowSaveCustomTemplateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8C857B] hover:bg-[#FAF8F5] cursor-pointer"
                >
                  Zrušiť
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#2C2A29] hover:bg-[#C5A059] text-white shadow-sm transition-all cursor-pointer"
                >
                  Uložiť šablónu
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
