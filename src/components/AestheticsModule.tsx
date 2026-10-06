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
  Pencil
} from 'lucide-react';
import { Patient, MedicalRecord } from './PatientDatabase';
import { InventoryService } from '../services/inventoryService';
import { exportElementToPdf } from '../lib/pdfGenerator';
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

export interface AestheticSession {
  id: string;
  patientId: string;
  date: string;
  formattedDate: string;
  doctor: string;
  protocolNumber: string;
  title: string;
  vectors: Vector2DItem[];
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
    recommendations: `• Neľahať si minimálne 4 hodiny po aplikácii botulotoxínu.
• Vyhnúť sa saune, soláriu a športu na 48 hodín.
• Chladenie suchým chladom pri drobných hematómoch.`,
    nextStep: 'Kontrola nástupu plného účinku o 14 dní. Následná aplikácia o 5 mesiacov.',
    appliedMaterialsSummary: 'Dysport 300IU (LOT: DYSP-4412B) • 7 aplikačných bodov',
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

  const activeMaterial = PRESET_MATERIALS[selectedMaterialIdx] || PRESET_MATERIALS[0];
  const [activeColor, setActiveColor] = useState<string>(activeMaterial.color);

  // ŠABLÓNY STATE
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
  const [templateFilterCategory, setTemplateFilterCategory] = useState<string>('all');
  const [showSaveCustomTemplateModal, setShowSaveCustomTemplateModal] = useState(false);
  const [customTemplateTitle, setCustomTemplateTitle] = useState('');
  const [customTemplatePrice, setCustomTemplatePrice] = useState(150);

  // FORMULÁR CENY A ODPORÚČANÍ (PRE REPORT A ULOŽENIE)
  const [sessionPrice, setSessionPrice] = useState<number>(120);
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
    setSessionPrice(120);
    setSessionProtocolNo(`AES-${Date.now().toString().slice(-6)}`);
  }, [currentPatient?.id]);

  // APLIKÁCIA ŠABLÓNY
  const handleApplyTemplate = (tpl: AestheticTemplate, mode: 'append' | 'replace' = 'append') => {
    // Klonovanie vektorov s unikátnymi ID
    const freshVectors: Vector2DItem[] = tpl.vectors.map((v, i) => ({
      ...v,
      id: `pt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}_${i}`
    }));

    if (mode === 'replace') {
      setVectors(freshVectors);
      setAppliedTemplateTitles([tpl.title]);
      setSessionPrice(tpl.price);
    } else {
      setVectors(prev => [...prev, ...freshVectors]);
      setAppliedTemplateTitles(prev => prev.includes(tpl.title) ? prev : [...prev, tpl.title]);
      setSessionPrice(prev => prev + tpl.price);
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

  // Uloženie vlastnej šablóny z aktuálneho nákresu
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
    setTemplatesList(updated);
    try {
      localStorage.setItem('say_clinic_aesthetic_templates_v4', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }

    setShowSaveCustomTemplateModal(false);
    setCustomTemplateTitle('');
    setToastMsg(`Vlastná šablóna "${newTpl.title}" bola úspešne uložená!`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Výber preparátu
  const handleSelectMaterial = (idx: number) => {
    setSelectedMaterialIdx(idx);
    const mat = PRESET_MATERIALS[idx];
    setActiveColor(mat.color);

    if (mat.type === 'biostimulator') {
      setActiveTool('fanning');
    } else {
      setActiveTool('point');
    }
  };

  // Uloženie ošetrenia do karty pacienta
  const handleSaveSession = () => {
    if (vectors.length === 0) {
      alert('Pred uložením označte na soche aspoň jeden aplikačný bod.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const formattedDate = new Date().toLocaleDateString('sk-SK');

    const materialsMap: Record<string, number> = {};
    vectors.forEach(v => {
      materialsMap[v.productName] = (materialsMap[v.productName] || 0) + 1;
    });
    const summaryStr = Object.entries(materialsMap)
      .map(([name, count]) => `${name} (${count} bodov)`)
      .join(', ');

    const newSession: AestheticSession = {
      id: `sess_${Date.now()}`,
      patientId: currentPatient.id,
      date: todayStr,
      formattedDate,
      doctor: 'MUDr. Ján Mráz',
      protocolNumber: sessionProtocolNo,
      title: appliedTemplateTitles.length > 0 ? appliedTemplateTitles.join(' + ') : `Estetické ošetrenie (${summaryStr})`,
      vectors: [...vectors],
      price: sessionPrice,
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
      Object.keys(materialsMap).forEach(pName => {
        const mat = PRESET_MATERIALS.find(m => m.name === pName);
        InventoryService.logMaterialUsage({
          patientId: currentPatient.id,
          patientName: currentPatient.name,
          patientBirthNumber: currentPatient.birthNumber,
          sourceType: 'estetika',
          procedureName: `Estetická aplikácia (${pName})`,
          itemName: pName,
          category: 'estetika',
          quantity: 1,
          lotNumber: mat?.lot || 'LOT-2026',
          performerName: 'MUDr. Ján Mráz',
          notes: `Aplikovaných ${materialsMap[pName]} bodov`
        });
      });

      // Uloženie do zdravotného záznamu pacienta
      const recordText = `ESTETICKÉ OŠETRENIE TVÁRE (2D SOCHA)
Dátum: ${formattedDate}
Číslo: ${sessionProtocolNo}
Lekár: MUDr. Ján Mráz
Šablóny / Procedúry: ${appliedTemplateTitles.join(', ') || 'Individuálny nákres'}
Aplikované látky: ${summaryStr}
Celková cena: ${sessionPrice} €
Odporúčania: ${sessionRecommendations}
Ďalší termín: ${sessionNextStep}`;

      const newRecord: MedicalRecord = {
        id: `rec-aes-${Date.now()}`,
        type: 'Estetický protokol',
        date: formattedDate,
        doctor: 'MUDr. Ján Mráz',
        title: `Estetika: ${appliedTemplateTitles.join(' + ') || summaryStr}`,
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
    // Ak nie sme v reporte, prepneme do reportu na moment tlače
    const previousTab = activeTab;
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
      }
    `;
    document.head.appendChild(tempStyle);

    setTimeout(() => {
      const cleanup = () => {
        tempStyle.remove();
        window.removeEventListener('afterprint', cleanup);
      };
      window.addEventListener('afterprint', cleanup);
      window.print();
    }, 150);
  };

  // Stiahnutie A4 PDF
  const handleDownloadPdf = async () => {
    const el = document.getElementById('printable-a4');
    if (!el) return;
    try {
      setIsExportingPdf(true);
      await exportElementToPdf(
        el,
        {
          format: 'a4',
          headerTitle: 'SAY CLINIC – Estetické ošetrenie',
          patientName: currentPatient.name
        },
        currentPatient.name,
        new Date().toISOString().split('T')[0]
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
                  setSessionPrice(selectedHistorySession.price || 120);
                  setSessionRecommendations(selectedHistorySession.recommendations || DEFAULT_RECOMMENDATIONS);
                  setSessionNextStep(selectedHistorySession.nextStep || DEFAULT_NEXT_STEP);
                  setAppliedTemplateTitles(selectedHistorySession.appliedTemplatesList || []);
                  setActiveTab('editor');
                  setToastMsg('Body z tohto ošetrenia boli načítané do nového ošetrenia.');
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
                  <span>Uložiť nákres ako šablónu</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAllTemplatesModal(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FAF8F5] hover:bg-[#F3EEE7] border border-[#E8E2D9] text-[11px] font-bold text-[#2C2A29] transition-all cursor-pointer"
                >
                  <span>Všetky šablóny ({templatesList.length}) →</span>
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
                  <span className="text-[#8C857B] text-[11px]">Vyrátaná cena:</span>
                  <span className="font-bold font-mono text-sm text-[#2C2A29] bg-white px-2.5 py-1 rounded-lg border border-[#C5A059]/40">
                    {sessionPrice} €
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* RÝCHLE PREPARÁTY PRE VOĽNÉ DOKRESLOVANIE */}
          <div className="p-3 bg-white/90 rounded-2xl border border-[#E8E2D9] shadow-2xs">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-bold text-[#8C857B] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#C5A059]" />
                Alebo vyberte materiál a klikajte individuálne body:
              </span>
              <span className="text-[11px] text-[#8C857B]">
                Aktívny: <strong className="text-[#2C2A29]">{activeMaterial.name}</strong> (LOT: {activeMaterial.lot})
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {PRESET_MATERIALS.map((mat, idx) => {
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
                      <span className={`text-[9px] uppercase font-bold ${isSelected ? 'text-[#F5E4B8]' : 'text-[#8C857B]'}`}>
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

          {/* SPODNÝ SÚHRN: CENA, ODPORÚČANIA A A4 TLAČ */}
          <div className="rounded-3xl p-5 bg-white border border-[#E8E2D9] shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-[#2C2A29] uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#C5A059]" />
              Zhrnutie pre klienta & A4 report
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* 1. Cena */}
              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-1.5">
                <label className="text-[11px] font-bold text-[#8C857B] flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-[#C5A059]" />
                  Celková cena ošetrenia (€):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={sessionPrice}
                    onChange={(e) => setSessionPrice(Number(e.target.value) || 0)}
                    className="w-full text-base font-bold p-2.5 rounded-xl bg-white border border-[#E8E2D9] text-[#2C2A29] focus:outline-hidden focus:border-[#C5A059]"
                  />
                  <span className="absolute right-3 top-2.5 text-sm font-bold text-[#8C857B]">€</span>
                </div>
                <p className="text-[10px] text-[#8C857B]">
                  Vyrátané zo šablón (môžete kedykoľvek prepísať na požadovanú sumu).
                </p>
              </div>

              {/* 2. Odporúčania */}
              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-1.5">
                <label className="text-[11px] font-bold text-[#8C857B] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                  Odporúčania po zákroku:
                </label>
                <textarea
                  rows={3}
                  value={sessionRecommendations}
                  onChange={(e) => setSessionRecommendations(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl bg-white border border-[#E8E2D9] text-[#2C2A29] focus:outline-hidden resize-none"
                  placeholder="Inštrukcie pre domáci režim..."
                />
              </div>

              {/* 3. Ďalší postup */}
              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-1.5">
                <label className="text-[11px] font-bold text-[#8C857B] flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#3B82F6]" />
                  Ďalší postup & Plánovaný termín:
                </label>
                <textarea
                  rows={3}
                  value={sessionNextStep}
                  onChange={(e) => setSessionNextStep(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl bg-white border border-[#E8E2D9] text-[#2C2A29] focus:outline-hidden resize-none"
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
                      setSessionPrice(selectedHistorySession.price);
                      setSessionRecommendations(selectedHistorySession.recommendations);
                      setSessionNextStep(selectedHistorySession.nextStep);
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

            {/* 1. ČO BOLO APLIKOVANÉ */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C2A29] flex items-center gap-1.5 pb-1 border-b border-[#E8E2D9]">
                <span className="w-2 h-2 rounded-full bg-[#C5A059]" />
                1. Prehľad aplikácie (Čo bolo aplikované):
              </h3>

              {appliedTemplateTitles.length > 0 && (
                <div className="text-[11px] font-medium text-[#8C857B]">
                  Zvolené procedúry: <strong className="text-[#2C2A29]">{appliedTemplateTitles.join(' + ')}</strong>
                </div>
              )}

              {vectors.length > 0 ? (
                <div className="border border-[#E8E2D9] rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF8F5] text-[#8C857B] font-bold border-b border-[#E8E2D9]">
                      <tr>
                        <th className="p-2.5">Preparát</th>
                        <th className="p-2.5">Šarža (LOT)</th>
                        <th className="p-2.5">Ošetrené oblasti & Zóny</th>
                        <th className="p-2.5 text-right">Počet bodov / Dávka</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E2D9]">
                      {(() => {
                        const grouped: Record<string, { lot: string; zones: string[]; points: number; details: string }> = {};
                        vectors.forEach(v => {
                          if (!grouped[v.productName]) {
                            grouped[v.productName] = {
                              lot: v.lotNumber,
                              zones: [],
                              points: 0,
                              details: v.details
                            };
                          }
                          grouped[v.productName].points++;
                          if (!grouped[v.productName].zones.includes(v.zoneName)) {
                            grouped[v.productName].zones.push(v.zoneName);
                          }
                        });

                        return Object.entries(grouped).map(([prodName, data], i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="p-2.5 font-bold text-[#2C2A29]">{prodName}</td>
                            <td className="p-2.5 font-mono text-[#C5A059] text-[11px]">{data.lot}</td>
                            <td className="p-2.5 text-[#2C2A29]">{data.zones.slice(0, 3).join(', ')}{data.zones.length > 3 ? ` (+${data.zones.length - 3} ďalších)` : ''}</td>
                            <td className="p-2.5 text-right font-bold text-[#2C2A29]">{data.points} mikrovpichov</td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-[#8C857B] italic p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E2D9]">
                  Neboli vyznačené žiadne body aplikácie.
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

            {/* 3. CENA OŠETRENIA & 4. ĎALŠÍ POSTUP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* 3. CENA */}
              <div className="p-4 rounded-xl border border-[#C5A059]/40 bg-[#FAF8F5]">
                <span className="text-[10px] uppercase font-bold text-[#8C857B] block mb-1">
                  3. Celková cena ošetrenia:
                </span>
                <div className="text-xl font-bold font-mono text-[#2C2A29]">
                  {sessionPrice.toFixed(2)} €
                </div>
                <div className="text-[10px] text-[#8C857B] mt-0.5">
                  Vrátane aplikovaného materiálu a aplikačného výkonu.
                </div>
              </div>

              {/* 4. ĎALŠÍ POSTUP */}
              <div className="p-4 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5]">
                <span className="text-[10px] uppercase font-bold text-[#8C857B] block mb-1">
                  4. Ďalší postup a plánovaná kontrola:
                </span>
                <div className="text-xs font-semibold text-[#2C2A29]">
                  {sessionNextStep || DEFAULT_NEXT_STEP}
                </div>
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
      {/* MODAL: KATALÓG VŠETKÝCH ŠABLÓN SO ZOBRAZENÍM CENY A POPISU               */}
      {/* ========================================================================= */}
      {showAllTemplatesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in print:hidden">
          <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D9]">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-[#C5A059]" />
                <div>
                  <h3 className="text-sm font-bold text-[#2C2A29]">Katalóg estetických šablón</h3>
                  <p className="text-[11px] text-[#8C857B]">Vyberte preddefinovanú alebo vlastnú šablónu pre okamžité nanesenie bodov a výpočet ceny</p>
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

            {/* Filtre */}
            <div className="flex items-center gap-1.5 p-1 bg-[#FAF8F5] rounded-xl border border-[#E8E2D9] text-xs">
              {[
                { id: 'all', label: 'Všetky' },
                { id: 'botox', label: 'Botulotoxín' },
                { id: 'filler', label: 'Kyselina hyalurónová' },
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

            {/* Zoznam šablón */}
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
                      <span className="text-base font-bold font-mono text-[#2C2A29] bg-white px-2.5 py-1 rounded-xl border border-[#E8E2D9]">
                        {tpl.price} €
                      </span>
                      <div className="flex items-center gap-1.5">
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
      {/* MODAL: ULOŽIŤ AKTUÁLNY NÁKRES AKO VLASTNÚ ŠABLÓNU                        */}
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
