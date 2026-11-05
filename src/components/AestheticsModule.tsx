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
  Layers,
  Award,
  Compass,
  PackageCheck,
  Package,
  Search,
  Stethoscope,
  CheckSquare,
  Square,
  Info,
  ShieldAlert,
  ArrowRight,
  MoreVertical,
  Copy,
  Target,
  Edit3
} from 'lucide-react';
import { Patient, MedicalRecord } from './PatientDatabase';
import { InventoryService, PatientMaterialDepotItem } from '../services/inventoryService';
import { FinanceBillingService } from '../services/financeBillingService';
import { LoyaltyService } from '../services/loyaltyService';
import ClientLoyaltyModal from './ClientLoyaltyModal';
import { RealtimeSyncService } from '../services/realtimeSyncService';
import { exportElementToPdf, generatePdfFilename } from '../lib/pdfGenerator';
import { 
  Sculpture2DViewer, 
  Vector2DItem, 
  SculptureViewType, 
  DrawingToolType 
} from './Sculpture2DViewer';
import { Sculpture3DViewer } from './Sculpture3DViewer';
import { getClinicPrice, CLINIC_PRICE_LIST, ClinicPriceItem } from '../data/clinicPriceList';

export const AESTHETIC_DOCTORS = [
  'MUDr. Ján Mráz',
  'MUDr. Zuzana Sroková, MPH',
  'MUDr. Minh Tuong Tran'
];

export interface AestheticMaterial {
  id: string;
  name: string;
  type: 'botox' | 'filler' | 'meso' | 'biostimulator';
  categoryLabel: string;
  color: string;
  defaultUnit: string;
  defaultUnits: number;
  defaultPrice: number;
  recommendedTechnique: string;
}

export const PRESET_MATERIALS: AestheticMaterial[] = [
  {
    id: 'dysport',
    name: 'Dysport 300IU (Botox 1 oblasť)',
    type: 'botox',
    categoryLabel: 'Botulotoxín A',
    color: '#3B82F6',
    defaultUnit: 'Speywood',
    defaultUnits: 10,
    defaultPrice: getClinicPrice('botox_1_area', 120),
    recommendedTechnique: 'Intramuskulárne mikrovpichy'
  },
  {
    id: 'botox_masseter',
    name: 'Botox – Zúženie tváre (Masseter)',
    type: 'botox',
    categoryLabel: 'Botulotoxín A',
    color: '#3B82F6',
    defaultUnit: 'Speywood',
    defaultUnits: 25,
    defaultPrice: getClinicPrice('botox_masseter', 300),
    recommendedTechnique: 'Hlboké intramuskulárne bolusy do m. masseter'
  },
  {
    id: 'botox_hyperhidrosis',
    name: 'Botox – Odstránenie potenia v podpaží',
    type: 'botox',
    categoryLabel: 'Botulotoxín A',
    color: '#2563EB',
    defaultUnit: 'Speywood',
    defaultUnits: 50,
    defaultPrice: getClinicPrice('botox_hyperhidrosis', 400),
    recommendedTechnique: 'Intradermálna mriežka 0.1ml na bod'
  },
  {
    id: 'ha_05ml',
    name: 'Kyselina hyalurónová (0,5ml)',
    type: 'filler',
    categoryLabel: 'Výplň (HA 0.5ml)',
    color: '#F472B6',
    defaultUnit: 'ml',
    defaultUnits: 0.1,
    defaultPrice: getClinicPrice('hyaluronic_acid_05ml', 180),
    recommendedTechnique: 'Jemná hydratácia pier / vrások'
  },
  // --- RESTYLANE PORTFOLIO (Galderma NASHA & OBT) ---
  {
    id: 'restylane_classic',
    name: 'Restylane 1ml (Lidocaine)',
    type: 'filler',
    categoryLabel: 'Výplň vrások (HA 1ml)',
    color: '#E11D48',
    defaultUnit: 'ml',
    defaultUnits: 0.2,
    defaultPrice: getClinicPrice('ha_1ml', 290),
    recommendedTechnique: 'NASHA technológia, stredná dermis / lineárna technika'
  },
  {
    id: 'restylane_lyft',
    name: 'Restylane Lyft 1ml (Zygoma & Líca)',
    type: 'filler',
    categoryLabel: 'Objem & Lifting (HA 1ml)',
    color: '#DB2777',
    defaultUnit: 'ml',
    defaultUnits: 0.2,
    defaultPrice: getClinicPrice('ha_1ml', 290),
    recommendedTechnique: 'Bolus na periost / kanyla 25G líca, zygoma a brada'
  },
  {
    id: 'restylane_kysse',
    name: 'Restylane Kysse 1ml (Pery & Periorál)',
    type: 'filler',
    categoryLabel: 'Výplň pier (HA 1ml)',
    color: '#EC4899',
    defaultUnit: 'ml',
    defaultUnits: 0.1,
    defaultPrice: getClinicPrice('ha_1ml', 290),
    recommendedTechnique: 'OBT mikrodepozity kontúry a tela pier'
  },
  {
    id: 'restylane_volyme',
    name: 'Restylane Volyme 1ml (Objem tváre & Spánky)',
    type: 'filler',
    categoryLabel: 'Volumizácia (HA 1ml)',
    color: '#C026D3',
    defaultUnit: 'ml',
    defaultUnits: 0.2,
    defaultPrice: getClinicPrice('ha_1ml', 290),
    recommendedTechnique: 'OBT hlboká volumizácia líc a spánkových depresií'
  },
  {
    id: 'restylane_defyne',
    name: 'Restylane Defyne 1ml (Hlboké ryhy & Sánka)',
    type: 'filler',
    categoryLabel: 'Dynamická výplň (HA 1ml)',
    color: '#9333EA',
    defaultUnit: 'ml',
    defaultUnits: 0.2,
    defaultPrice: getClinicPrice('ha_1ml', 290),
    recommendedTechnique: 'OBT dynamická projekcia brady a nasolabiálnych rýh'
  },
  {
    id: 'restylane_refyne',
    name: 'Restylane Refyne 1ml (Dynamické línie)',
    type: 'filler',
    categoryLabel: 'Pružná výplň (HA 1ml)',
    color: '#A855F7',
    defaultUnit: 'ml',
    defaultUnits: 0.1,
    defaultPrice: getClinicPrice('ha_1ml', 290),
    recommendedTechnique: 'OBT stredná dermis pre mimicky flexibilné línie'
  },
  {
    id: 'restylane_skinboosters',
    name: 'Restylane Skinboosters Vital 1ml',
    type: 'meso',
    categoryLabel: 'Hĺbková hydratácia dermis',
    color: '#06B6D4',
    defaultUnit: 'ml',
    defaultUnits: 0.1,
    defaultPrice: getClinicPrice('skinbooster_1ml', 300),
    recommendedTechnique: 'NASHA mikropapuly do strednej až hlbokej dermis'
  },

  // --- TEOXANE ---
  {
    id: 'teosyal_redensity2',
    name: 'Teosyal PureSense Redensity II 1ml (Kruhy pod očami)',
    type: 'filler',
    categoryLabel: 'Periorbitálna výplň (HA 1ml)',
    color: '#F43F5E',
    defaultUnit: 'ml',
    defaultUnits: 0.1,
    defaultPrice: 300,
    recommendedTechnique: 'Supraperiostálna aplikácia kanylou 27G / ihlou do sulcus infraorbitalis (Tear Trough)'
  },
  {
    id: 'rejuran_healer',
    name: 'Rejuran Healer (2ml Polynukleotidy)',
    type: 'meso',
    categoryLabel: 'Polynukleotidy PN',
    color: '#0EA5E9',
    defaultUnit: 'ml',
    defaultUnits: 0.2,
    defaultPrice: getClinicPrice('rejuran_healer_2ml', 290),
    recommendedTechnique: 'Intradermálne mikropapuly celá tvár'
  },
  {
    id: 'rejuran_i',
    name: 'Rejuran I (1ml Očné okolie)',
    type: 'meso',
    categoryLabel: 'Polynukleotidy Oči',
    color: '#38BDF8',
    defaultUnit: 'ml',
    defaultUnits: 0.1,
    defaultPrice: getClinicPrice('rejuran_i_1ml', 190),
    recommendedTechnique: 'Jemné periorbitálne mikropapuly'
  },
  {
    id: 'rejuran_s',
    name: 'Rejuran S (1ml Jazvy & Akné)',
    type: 'meso',
    categoryLabel: 'Polynukleotidy Jazvy',
    color: '#0284C7',
    defaultUnit: 'ml',
    defaultUnits: 0.1,
    defaultPrice: getClinicPrice('rejuran_s_1ml', 190),
    recommendedTechnique: 'Subcízia a intradermálna aplikácia pod bázu jazvy'
  },
  {
    id: 'crystal_hydro',
    name: 'Crystal Hydro PDRN (3ml)',
    type: 'meso',
    categoryLabel: 'PDRN + HA + Niacínamid',
    color: '#14B8A6',
    defaultUnit: 'ml',
    defaultUnits: 0.3,
    defaultPrice: getClinicPrice('crystal_hydro_pdrn', 210),
    recommendedTechnique: 'Multipunktúrna mezoterapia tváre a krku'
  },
  {
    id: 'philart',
    name: 'PhilArt / Nucleofill (2ml)',
    type: 'meso',
    categoryLabel: 'Polynukleotidy',
    color: '#0D9488',
    defaultUnit: 'ml',
    defaultUnits: 0.2,
    defaultPrice: getClinicPrice('philart_2ml', 300),
    recommendedTechnique: '5-bodová alebo multipunktúrna biostimulácia'
  },
  {
    id: 'exosomes_asce',
    name: 'Exozómy ASCE+ SRLV',
    type: 'meso',
    categoryLabel: 'Exozómy & Regenerácia',
    color: '#8B5CF6',
    defaultUnit: 'ampulka',
    defaultUnits: 1,
    defaultPrice: getClinicPrice('exosomes_asce', 320),
    recommendedTechnique: 'Aplikácia s microneedlingom alebo po laseri'
  },
  {
    id: 'profhilo',
    name: 'Profhilo H+L 2ml',
    type: 'meso',
    categoryLabel: 'Bioremodelácia',
    color: '#10B981',
    defaultUnit: 'ml',
    defaultUnits: 0.2,
    defaultPrice: getClinicPrice('profhilo_2ml', 290),
    recommendedTechnique: '5-bodová BAP technika (Bio Aesthetic Points)'
  },
  {
    id: 'sculptra',
    name: 'Sculptra (1 fľaštička)',
    type: 'biostimulator',
    categoryLabel: 'PLLA Neokolagenéza',
    color: '#C5A059',
    defaultUnit: 'fľaštička',
    defaultUnits: 1,
    defaultPrice: getClinicPrice('sculptra_1vial', 450),
    recommendedTechnique: 'Hlboký subkutánny vejárovitý nános kanylou'
  },
  {
    id: 'hyaluronidase',
    name: 'Aplikácia hyaluronidázy 150UI',
    type: 'meso',
    categoryLabel: 'Korekcia výplní',
    color: '#EF4444',
    defaultUnit: 'IU',
    defaultUnits: 150,
    defaultPrice: getClinicPrice('hyaluronidase', 80),
    recommendedTechnique: 'Cielené rozpustenie HA výplne mikroihlou'
  },
  {
    id: 'biorepeel',
    name: 'BioRePeelCl3 / PRX-T33 (Tvár)',
    type: 'meso',
    categoryLabel: 'Biorevitalizačný peeling',
    color: '#F59E0B',
    defaultUnit: 'ošetrenie',
    defaultUnits: 1,
    defaultPrice: getClinicPrice('biorepeel_face', 90),
    recommendedTechnique: 'Dvojfázový TCA biorevitalizačný peeling'
  },
  {
    id: 'chemical_peel_tca',
    name: 'Lekársky TCA peeling (stredne hlboký)',
    type: 'meso',
    categoryLabel: 'Lekársky TCA peeling',
    color: '#D97706',
    defaultUnit: 'ošetrenie',
    defaultUnits: 1,
    defaultPrice: getClinicPrice('chemical_peel_tca', 110),
    recommendedTechnique: 'Stredne hlboký lekársky TCA peeling s kontrolou frostu'
  },
  {
    id: 'microneedling_dermapen',
    name: 'Lekársky Microneedling (Dermapen 4 + HA)',
    type: 'meso',
    categoryLabel: 'Microneedling Dermapen 4',
    color: '#E11D48',
    defaultUnit: 'ošetrenie',
    defaultUnits: 1,
    defaultPrice: getClinicPrice('microneedling_dermapen', 140),
    recommendedTechnique: 'Frakčný mikroihličkový indukčný protokol kolagénu'
  },
  {
    id: 'client_material_refill',
    name: 'Doplnenie už zakúpeného materiálu',
    type: 'filler',
    categoryLabel: 'Aplikácia',
    color: '#8B5CF6',
    defaultUnit: 'aplikácia',
    defaultUnits: 1,
    defaultPrice: getClinicPrice('client_material_refill', 50),
    recommendedTechnique: 'Aplikácia pacientom doneseného preparátu'
  }
];

export interface AestheticTemplate {
  id: string;
  title: string;
  category: 'botox' | 'filler' | 'pdrn' | 'meso' | 'exosomes' | 'microneedling' | 'laser' | 'biostimulator';
  productName: string;
  price: number;
  doctor?: string; // 'MUDr. Ján Mráz' | 'MUDr. Zuzana Sroková, MPH' | 'MUDr. Minh Tuong Tran' | 'all'
  defaultTotalVolume?: number;
  defaultUsedVolume?: number;
  defaultUnit?: string;
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
    price: getClinicPrice('botox_1_area', 120),
    doctor: 'all',
    defaultTotalVolume: 300,
    defaultUsedVolume: 50,
    defaultUnit: 'Speywood',
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
    price: getClinicPrice('botox_1_area', 120),
    doctor: 'all',
    defaultTotalVolume: 300,
    defaultUsedVolume: 50,
    defaultUnit: 'Speywood',
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
    price: getClinicPrice('botox_1_area', 120),
    doctor: 'all',
    defaultTotalVolume: 300,
    defaultUsedVolume: 50,
    defaultUnit: 'Speywood',
    type: 'point',
    color: '#3B82F6',
    description: 'Periorbitálne vrásky laterálneho kútika oka (m. orbicularis oculi).',
    recommendations: '• Nešúchať si oči, neaplikovať dráždivú kozmetiku 24h.\n• Suchý chlad pri miernom opuchu.',
    vectors: [
      { id: 'tpl_e1', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 195, y: 292 }, zoneName: 'Očné vejáriky Ľ (horný)', productName: 'Dysport 300IU', details: '8 Speywood U', units: 8, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_e2', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 185, y: 308 }, zoneName: 'Očné vejáriky Ľ (stredný)', productName: 'Dysport 300IU', details: '8 Speywood U', units: 8, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_e3', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 195, y: 324 }, zoneName: 'Očné vejáriky Ľ (dolný)', productName: 'Dysport 300IU', details: '8 Speywood U', units: 8, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_e4', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 405, y: 292 }, zoneName: 'Očné vejáriky P (horný)', productName: 'Dysport 300IU', details: '8 Speywood U', units: 8, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_e5', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 415, y: 308 }, zoneName: 'Očné vejáriky P (stredný)', productName: 'Dysport 300IU', details: '8 Speywood U', units: 8, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_e6', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 405, y: 324 }, zoneName: 'Očné vejáriky P (dolný)', productName: 'Dysport 300IU', details: '8 Speywood U', units: 8, unitsUnit: 'Speywood', createdAt: '10:00' }
    ]
  },
  {
    id: 'dysport_forehead_glabella',
    title: 'Botox Čelo + Glabela (Kombinácia)',
    category: 'botox',
    productName: 'Dysport 300IU',
    price: getClinicPrice('botox_2_areas', 200),
    doctor: 'MUDr. Ján Mráz',
    defaultTotalVolume: 300,
    defaultUsedVolume: 100,
    defaultUnit: 'Speywood',
    type: 'point',
    color: '#3B82F6',
    description: 'Najčastejšie kombinované ošetrenie čela a glately s cenovým zvýhodnením.',
    recommendations: '• 4 hodiny po aplikácii neľahať.\n• 48 hodín bez sauny a športu.',
    vectors: [
      { id: 'tpl_fg1', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 300, y: 258 }, zoneName: 'Glabela – procerus', productName: 'Dysport 300IU', details: '15 Sp U', units: 15, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_fg2', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 278, y: 272 }, zoneName: 'Glabela – corrugator Ľ', productName: 'Dysport 300IU', details: '10 Sp U', units: 10, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_fg3', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 322, y: 272 }, zoneName: 'Glabela – corrugator P', productName: 'Dysport 300IU', details: '10 Sp U', units: 10, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_fg4', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 220, y: 210 }, zoneName: 'Čelo Ľ lateralis', productName: 'Dysport 300IU', details: '10 Sp U', units: 10, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_fg5', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 260, y: 205 }, zoneName: 'Čelo Ľ medialis', productName: 'Dysport 300IU', details: '10 Sp U', units: 10, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_fg6', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 340, y: 205 }, zoneName: 'Čelo P medialis', productName: 'Dysport 300IU', details: '10 Sp U', units: 10, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_fg7', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 380, y: 210 }, zoneName: 'Čelo P lateralis', productName: 'Dysport 300IU', details: '10 Sp U', units: 10, unitsUnit: 'Speywood', createdAt: '10:00' }
    ]
  },
  {
    id: 'dysport_full_upper',
    title: 'Botox Horná tretina (Čelo + Glabela + Oči)',
    category: 'botox',
    productName: 'Dysport 300IU',
    price: getClinicPrice('botox_3_areas', 280),
    doctor: 'MUDr. Ján Mráz',
    defaultTotalVolume: 300,
    defaultUsedVolume: 150,
    defaultUnit: 'Speywood',
    type: 'point',
    color: '#3B82F6',
    description: 'Kompletná horná tretina tváre: čelo, glabela a očné vejáriky (komplexný vyhladzujúci balík).',
    recommendations: '• 4 hodiny po aplikácii neľahať a nepredkláňať sa.\n• 48 hodín bez sauny, solária a športu.',
    vectors: [
      { id: 'tpl_u1', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 300, y: 258 }, zoneName: 'Glabela – procerus', productName: 'Dysport 300IU', details: '15 Sp U', units: 15, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_u2', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 278, y: 272 }, zoneName: 'Glabela – corrugator Ľ', productName: 'Dysport 300IU', details: '10 Sp U', units: 10, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_u3', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 322, y: 272 }, zoneName: 'Glabela – corrugator P', productName: 'Dysport 300IU', details: '10 Sp U', units: 10, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_u4', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 220, y: 210 }, zoneName: 'Čelo Ľ lateralis', productName: 'Dysport 300IU', details: '10 Sp U', units: 10, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_u5', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 260, y: 205 }, zoneName: 'Čelo Ľ medialis', productName: 'Dysport 300IU', details: '10 Sp U', units: 10, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_u6', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 340, y: 205 }, zoneName: 'Čelo P medialis', productName: 'Dysport 300IU', details: '10 Sp U', units: 10, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_u7', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 380, y: 210 }, zoneName: 'Čelo P lateralis', productName: 'Dysport 300IU', details: '10 Sp U', units: 10, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_u8', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 195, y: 292 }, zoneName: 'Očné vejáriky Ľ', productName: 'Dysport 300IU', details: '8 Sp U', units: 8, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_u9', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 185, y: 308 }, zoneName: 'Očné vejáriky Ľ', productName: 'Dysport 300IU', details: '8 Sp U', units: 8, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_u10', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 405, y: 292 }, zoneName: 'Očné vejáriky P', productName: 'Dysport 300IU', details: '8 Sp U', units: 8, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_u11', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 415, y: 308 }, zoneName: 'Očné vejáriky P', productName: 'Dysport 300IU', details: '8 Sp U', units: 8, unitsUnit: 'Speywood', createdAt: '10:00' }
    ]
  },
  {
    id: 'restylane_kysse_lips',
    title: 'Restylane Kysse – Modelácia a výplň pier (1ml)',
    category: 'filler',
    productName: 'Restylane Kysse 1ml',
    price: getClinicPrice('hyaluronic_acid_1ml', 290),
    doctor: 'MUDr. Ján Mráz',
    defaultTotalVolume: 1.0,
    defaultUsedVolume: 1.0,
    defaultUnit: 'ml',
    type: 'point',
    color: '#EC4899',
    description: 'Prirodzená definícia kontúr, Amorovho luku a zväčšenie objemu tela pier.',
    recommendations: '• Nefajčiť a nepiť horúce nápoje počas 24 hodín.\n• Používať čistý balzam, chladiť suchým chladom.\n• 48 hodín bez bozkávania a intenzívneho športu.',
    vectors: [
      { id: 'tpl_l1', type: 'point', view: 'front', color: '#EC4899', startPoint: { x: 293, y: 436 }, zoneName: 'Amorov vrchol Ľ', productName: 'Restylane Kysse 1ml', details: '0.05ml OBT', units: 0.05, unitsUnit: 'ml', createdAt: '10:00' },
      { id: 'tpl_l2', type: 'point', view: 'front', color: '#EC4899', startPoint: { x: 307, y: 436 }, zoneName: 'Amorov vrchol P', productName: 'Restylane Kysse 1ml', details: '0.05ml OBT', units: 0.05, unitsUnit: 'ml', createdAt: '10:00' },
      { id: 'tpl_l3', type: 'point', view: 'front', color: '#EC4899', startPoint: { x: 300, y: 439 }, zoneName: 'Amorov zárez', productName: 'Restylane Kysse 1ml', details: '0.05ml', units: 0.05, unitsUnit: 'ml', createdAt: '10:00' },
      { id: 'tpl_l4', type: 'point', view: 'front', color: '#EC4899', startPoint: { x: 278, y: 442 }, zoneName: 'Kontúra hornej pery Ľ', productName: 'Restylane Kysse 1ml', details: '0.1ml', units: 0.1, unitsUnit: 'ml', createdAt: '10:00' },
      { id: 'tpl_l5', type: 'point', view: 'front', color: '#EC4899', startPoint: { x: 322, y: 442 }, zoneName: 'Kontúra hornej pery P', productName: 'Restylane Kysse 1ml', details: '0.1ml', units: 0.1, unitsUnit: 'ml', createdAt: '10:00' },
      { id: 'tpl_l6', type: 'point', view: 'front', color: '#EC4899', startPoint: { x: 285, y: 456 }, zoneName: 'Telo dolnej pery Ľ', productName: 'Restylane Kysse 1ml', details: '0.15ml', units: 0.15, unitsUnit: 'ml', createdAt: '10:00' },
      { id: 'tpl_l7', type: 'point', view: 'front', color: '#EC4899', startPoint: { x: 315, y: 456 }, zoneName: 'Telo dolnej pery P', productName: 'Restylane Kysse 1ml', details: '0.15ml', units: 0.15, unitsUnit: 'ml', createdAt: '10:00' }
    ]
  },
  {
    id: 'profhilo_5bap',
    title: 'Profhilo H+L – 5 BAP Bioremodelácia tváre (2ml)',
    category: 'meso',
    productName: 'Profhilo H+L 2ml',
    price: getClinicPrice('profhilo_2ml', 290),
    doctor: 'all',
    defaultTotalVolume: 2.0,
    defaultUsedVolume: 2.0,
    defaultUnit: 'ml',
    type: 'point',
    color: '#10B981',
    description: '10 bioestetických bodov (5 vľavo, 5 vpravo) pre hĺbkovú hydratáciu a elasticitu tváre.',
    recommendations: '• Nemasírovať papulky po BAP bodoch – vstrebú sa do 24-48 hodín.\n• Vynechať saunu a fitko na 48 hodín.',
    vectors: [
      { id: 'tpl_b1', type: 'point', view: 'front', color: '#10B981', startPoint: { x: 235, y: 335 }, zoneName: 'Zygomatická prominencia Ľ', productName: 'Profhilo H+L 2ml', details: '0.2ml BAP', units: 0.2, unitsUnit: 'ml', createdAt: '10:00' },
      { id: 'tpl_b2', type: 'point', view: 'front', color: '#10B981', startPoint: { x: 250, y: 390 }, zoneName: 'Nazálna báza Ľ', productName: 'Profhilo H+L 2ml', details: '0.2ml BAP', units: 0.2, unitsUnit: 'ml', createdAt: '10:00' },
      { id: 'tpl_b3', type: 'point', view: 'front', color: '#10B981', startPoint: { x: 215, y: 430 }, zoneName: 'Tragus Ľ', productName: 'Profhilo H+L 2ml', details: '0.2ml BAP', units: 0.2, unitsUnit: 'ml', createdAt: '10:00' },
      { id: 'tpl_b4', type: 'point', view: 'front', color: '#10B981', startPoint: { x: 270, y: 485 }, zoneName: 'Brada Ľ', productName: 'Profhilo H+L 2ml', details: '0.2ml BAP', units: 0.2, unitsUnit: 'ml', createdAt: '10:00' },
      { id: 'tpl_b5', type: 'point', view: 'front', color: '#10B981', startPoint: { x: 210, y: 495 }, zoneName: 'Mandibulárny uhol Ľ', productName: 'Profhilo H+L 2ml', details: '0.2ml BAP', units: 0.2, unitsUnit: 'ml', createdAt: '10:00' },
      { id: 'tpl_b6', type: 'point', view: 'front', color: '#10B981', startPoint: { x: 365, y: 335 }, zoneName: 'Zygomatická prominencia P', productName: 'Profhilo H+L 2ml', details: '0.2ml BAP', units: 0.2, unitsUnit: 'ml', createdAt: '10:00' },
      { id: 'tpl_b7', type: 'point', view: 'front', color: '#10B981', startPoint: { x: 350, y: 390 }, zoneName: 'Nazálna báza P', productName: 'Profhilo H+L 2ml', details: '0.2ml BAP', units: 0.2, unitsUnit: 'ml', createdAt: '10:00' },
      { id: 'tpl_b8', type: 'point', view: 'front', color: '#10B981', startPoint: { x: 385, y: 430 }, zoneName: 'Tragus P', productName: 'Profhilo H+L 2ml', details: '0.2ml BAP', units: 0.2, unitsUnit: 'ml', createdAt: '10:00' },
      { id: 'tpl_b9', type: 'point', view: 'front', color: '#10B981', startPoint: { x: 330, y: 485 }, zoneName: 'Brada P', productName: 'Profhilo H+L 2ml', details: '0.2ml BAP', units: 0.2, unitsUnit: 'ml', createdAt: '10:00' },
      { id: 'tpl_b10', type: 'point', view: 'front', color: '#10B981', startPoint: { x: 390, y: 495 }, zoneName: 'Mandibulárny uhol P', productName: 'Profhilo H+L 2ml', details: '0.2ml BAP', units: 0.2, unitsUnit: 'ml', createdAt: '10:00' }
    ]
  },
  {
    id: 'rejuran_healer_fullface',
    title: 'Rejuran Healer (2ml) – Polynukleotidová obnova pleti',
    category: 'meso',
    productName: 'Rejuran Healer (2ml Polynukleotidy)',
    price: getClinicPrice('rejuran_healer_2ml', 290),
    doctor: 'MUDr. Zuzana Sroková, MPH',
    defaultTotalVolume: 2.0,
    defaultUsedVolume: 2.0,
    defaultUnit: 'ml',
    type: 'point',
    color: '#0EA5E9',
    description: 'Intradermálna aplikácia polynukleotidov (PN) pre bunkovú opravu dermis, redukciu pórov a spevnenie pleti.',
    recommendations: '• Drobné papulky vymiznú do 24-36 hodín – nemasírovať.\n• Používať SPF 50+ a vynechať saunu 48 hodín.',
    vectors: [
      { id: 'tpl_rj1', type: 'point', view: 'front', color: '#0EA5E9', startPoint: { x: 245, y: 345 }, zoneName: 'Líce Ľ (horná zóna)', productName: 'Rejuran Healer (2ml Polynukleotidy)', details: '0.5ml mikropapuly', units: 0.5, unitsUnit: 'ml', createdAt: '10:00' },
      { id: 'tpl_rj2', type: 'point', view: 'front', color: '#0EA5E9', startPoint: { x: 255, y: 405 }, zoneName: 'Líce Ľ (dolná zóna)', productName: 'Rejuran Healer (2ml Polynukleotidy)', details: '0.5ml mikropapuly', units: 0.5, unitsUnit: 'ml', createdAt: '10:00' },
      { id: 'tpl_rj3', type: 'point', view: 'front', color: '#0EA5E9', startPoint: { x: 355, y: 345 }, zoneName: 'Líce P (horná zóna)', productName: 'Rejuran Healer (2ml Polynukleotidy)', details: '0.5ml mikropapuly', units: 0.5, unitsUnit: 'ml', createdAt: '10:00' },
      { id: 'tpl_rj4', type: 'point', view: 'front', color: '#0EA5E9', startPoint: { x: 345, y: 405 }, zoneName: 'Líce P (dolná zóna)', productName: 'Rejuran Healer (2ml Polynukleotidy)', details: '0.5ml mikropapuly', units: 0.5, unitsUnit: 'ml', createdAt: '10:00' }
    ]
  },
  {
    id: 'restylane_lyft_cheeks',
    title: 'Restylane Lyft 1ml – Líca, Zygoma & Kontúry',
    category: 'filler',
    productName: 'Restylane Lyft 1ml',
    price: getClinicPrice('ha_1ml', 290),
    doctor: 'MUDr. Zuzana Sroková, MPH',
    defaultTotalVolume: 1.0,
    defaultUsedVolume: 1.0,
    defaultUnit: 'ml',
    type: 'point',
    color: '#DB2777',
    description: 'Hlboká volumizácia lícnych kostí (zygoma), obnova mladistvého objemu strednej tretiny a lifting pomocou technológie NASHA.',
    recommendations: '• 48 hodín bez tlaku na líca, spať na chrbte.\n• Vyhnúť sa saune, alkoholu a ťažkej námahe 72 hodín.',
    vectors: [
      { id: 'tpl_rl1', type: 'point', view: 'front', color: '#DB2777', startPoint: { x: 235, y: 340 }, zoneName: 'Zygomatická oblasť Ľ (apex)', productName: 'Restylane Lyft 1ml', details: '0.25ml bolus na kosť', units: 0.25, unitsUnit: 'ml', createdAt: '10:00' },
      { id: 'tpl_rl2', type: 'point', view: 'front', color: '#DB2777', startPoint: { x: 255, y: 360 }, zoneName: 'Malar bone Ľ', productName: 'Restylane Lyft 1ml', details: '0.25ml bolus na kosť', units: 0.25, unitsUnit: 'ml', createdAt: '10:00' },
      { id: 'tpl_rl3', type: 'point', view: 'front', color: '#DB2777', startPoint: { x: 365, y: 340 }, zoneName: 'Zygomatická oblasť P (apex)', productName: 'Restylane Lyft 1ml', details: '0.25ml bolus na kosť', units: 0.25, unitsUnit: 'ml', createdAt: '10:00' },
      { id: 'tpl_rl4', type: 'point', view: 'front', color: '#DB2777', startPoint: { x: 345, y: 360 }, zoneName: 'Malar bone P', productName: 'Restylane Lyft 1ml', details: '0.25ml bolus na kosť', units: 0.25, unitsUnit: 'ml', createdAt: '10:00' }
    ]
  },
  {
    id: 'teosyal_redensity2_teartrough',
    title: 'Teosyal PureSense Redensity II 1ml – Kruhy pod očami & Tear Trough',
    category: 'filler',
    productName: 'Teosyal PureSense Redensity II 1ml',
    price: 300,
    doctor: 'MUDr. Zuzana Sroková, MPH',
    defaultTotalVolume: 1.0,
    defaultUsedVolume: 0.8,
    defaultUnit: 'ml',
    type: 'point',
    color: '#F43F5E',
    description: 'Špecializovaný dermo-reštrukturalizačný gél na slzné ryhy a kruhy pod očami. Minimálne viaže vodu, eliminuje riziko ranných opuchov (Tyndallov efekt).',
    recommendations: '• 24h jemný suchý chladivý obklad, nepretierať a nemasírovať očné okolie.\n• Spať s vyvýšenou hlavou.\n• Zvyšných 0.2ml je možné odložiť do skladu kliniky pre pacientku na mikrodokorekciu o 3-4 týždne.',
    vectors: [
      { id: 'tpl_tr1', type: 'point', view: 'front', color: '#F43F5E', startPoint: { x: 260, y: 310 }, zoneName: 'Slzná ryha (Tear trough) Ľ', productName: 'Teosyal PureSense Redensity II 1ml', details: '0.4ml kanyla 27G na periost', units: 0.4, unitsUnit: 'ml', createdAt: '10:00' },
      { id: 'tpl_tr2', type: 'point', view: 'front', color: '#F43F5E', startPoint: { x: 340, y: 310 }, zoneName: 'Slzná ryha (Tear trough) P', productName: 'Teosyal PureSense Redensity II 1ml', details: '0.4ml kanyla 27G na periost', units: 0.4, unitsUnit: 'ml', createdAt: '10:00' }
    ]
  },
  {
    id: 'restylane_defyne_jaw',
    title: 'Restylane Defyne 1ml – Brada & Mandibulárna línia',
    category: 'filler',
    productName: 'Restylane Defyne 1ml',
    price: getClinicPrice('ha_1ml', 290),
    doctor: 'MUDr. Minh Tuong Tran',
    defaultTotalVolume: 1.0,
    defaultUsedVolume: 1.0,
    defaultUnit: 'ml',
    type: 'point',
    color: '#9333EA',
    description: 'Dynamická definícia kontúry sánky a projekcie brady technológiou OBT, ktorá zachováva prirodzený pohyb pri mimike.',
    recommendations: '• 48 hodín bez tlaku na bradu a čeľusť.\n• Vyhnúť sa saune a alkoholu.',
    vectors: [
      { id: 'tpl_rd1', type: 'point', view: 'front', color: '#9333EA', startPoint: { x: 300, y: 520 }, zoneName: 'Pogonion (projekcia brady)', productName: 'Restylane Defyne 1ml', details: '0.5ml bolus na kosť', units: 0.5, unitsUnit: 'ml', createdAt: '10:00' },
      { id: 'tpl_rd2', type: 'point', view: 'front', color: '#9333EA', startPoint: { x: 250, y: 495 }, zoneName: 'Pre-jowl sulcus Ľ', productName: 'Restylane Defyne 1ml', details: '0.25ml', units: 0.25, unitsUnit: 'ml', createdAt: '10:00' },
      { id: 'tpl_rd3', type: 'point', view: 'front', color: '#9333EA', startPoint: { x: 350, y: 495 }, zoneName: 'Pre-jowl sulcus P', productName: 'Restylane Defyne 1ml', details: '0.25ml', units: 0.25, unitsUnit: 'ml', createdAt: '10:00' }
    ]
  },
  {
    id: 'botox_masseter_jaw',
    title: 'Botox Masseter – Zúženie tváre & Bruxizmus',
    category: 'botox',
    productName: 'Dysport 300IU (Masseter)',
    price: getClinicPrice('botox_masseter', 300),
    doctor: 'MUDr. Minh Tuong Tran',
    defaultTotalVolume: 300,
    defaultUsedVolume: 100,
    defaultUnit: 'Speywood',
    type: 'point',
    color: '#2563EB',
    description: 'Hlboká intramuskulárna aplikácia do žuvacieho svalu (m. masseter) pre zoštíhlenie dolnej tretiny a úľavu od nočného zatínania.',
    recommendations: '• 4 hodiny po aplikácii neľahať si.\n• Vyhnúť sa žuvačkám a veľmi tvrdej strave prvé 3 dni.\n• Nástup zoštíhľujúceho efektu do 3-4 týždňov.',
    vectors: [
      { id: 'tpl_m1', type: 'point', view: 'front', color: '#2563EB', startPoint: { x: 220, y: 470 }, zoneName: 'Masseter Ľ (hlavný bolus)', productName: 'Dysport 300IU', details: '25 Speywood U', units: 25, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_m2', type: 'point', view: 'front', color: '#2563EB', startPoint: { x: 230, y: 490 }, zoneName: 'Masseter Ľ (dolný bod)', productName: 'Dysport 300IU', details: '25 Speywood U', units: 25, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_m3', type: 'point', view: 'front', color: '#2563EB', startPoint: { x: 380, y: 470 }, zoneName: 'Masseter P (hlavný bolus)', productName: 'Dysport 300IU', details: '25 Speywood U', units: 25, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'tpl_m4', type: 'point', view: 'front', color: '#2563EB', startPoint: { x: 370, y: 490 }, zoneName: 'Masseter P (dolný bod)', productName: 'Dysport 300IU', details: '25 Speywood U', units: 25, unitsUnit: 'Speywood', createdAt: '10:00' }
    ]
  },
  {
    id: 'sculptra_cheeks',
    title: 'Sculptra – PLLA Neokolagenéza líca (1 fľaštička)',
    category: 'biostimulator',
    productName: 'Sculptra (1 fľaštička)',
    price: getClinicPrice('sculptra_1vial', 450),
    doctor: 'MUDr. Ján Mráz',
    defaultTotalVolume: 1.0,
    defaultUsedVolume: 1.0,
    defaultUnit: 'fľaštička',
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
        productName: 'Sculptra (1 fľaštička)',
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
        productName: 'Sculptra (1 fľaštička)',
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
  templateId?: string;
  templateTitle?: string;
  totalVolume?: number;
  usedVolume?: number;
  remainingVolume?: number;
  unit?: string;
  storeRemainingToDepot?: boolean;
  doctorName?: string;
  isFromDepot?: boolean;
  depotOriginId?: string;
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
      { id: 'li_d1', title: 'Dysport, m. frontalis bilat., 4 vpichy strana, celkovo 50IU', price: 120 },
      { id: 'li_d2', title: 'Dysport, glabela – m. procerus a corrugator bilat.', price: 80 }
    ],
    recommendations: `• Neľahať si minimálne 4 hodiny po aplikácii botulotoxínu.
• Vyhnúť sa saune, soláriu a športu na 48 hodín.
• Chladenie suchým chladom pri drobných hematómoch.`,
    nextStep: 'Kontrola nástupu plného účinku o 14 dní. Následná aplikácia o 5 mesiacov.',
    appliedMaterialsSummary: 'Dysport 300IU • 6 bodov',
    appliedTemplatesList: ['Botox Čelo + Glabela (Kombinácia)'],
    vectors: [
      { id: 'd1', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 260, y: 205 }, zoneName: 'Čelo Ľ (m. frontalis)', productName: 'Dysport 300IU', details: '10 Speywood U', units: 10, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'd2', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 340, y: 205 }, zoneName: 'Čelo P (m. frontalis)', productName: 'Dysport 300IU', details: '10 Speywood U', units: 10, unitsUnit: 'Speywood', createdAt: '10:00' },
      { id: 'd3', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 300, y: 195 }, zoneName: 'Čelo stred', productName: 'Dysport 300IU', details: '10 Speywood U', units: 10, unitsUnit: 'Speywood', createdAt: '10:01' },
      { id: 'd4', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 300, y: 258 }, zoneName: 'Glabela – procerus', productName: 'Dysport 300IU', details: '15 Speywood U', units: 15, unitsUnit: 'Speywood', createdAt: '10:02' },
      { id: 'd5', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 278, y: 272 }, zoneName: 'Glabela – corrugator Ľ', productName: 'Dysport 300IU', details: '10 Speywood U', units: 10, unitsUnit: 'Speywood', createdAt: '10:02' },
      { id: 'd6', type: 'point', view: 'front', color: '#3B82F6', startPoint: { x: 322, y: 272 }, zoneName: 'Glabela – corrugator P', productName: 'Dysport 300IU', details: '10 Speywood U', units: 10, unitsUnit: 'Speywood', createdAt: '10:02' }
    ]
  }
];

export function AestheticsModule({ 
  patients = [], 
  selectedPatientId,
  onSelectPatient,
  onOpenPatientFolder,
  onSessionCompleted
}: { 
  patients?: Patient[]; 
  selectedPatientId?: string | null;
  onSelectPatient?: (id: string) => void;
  onOpenPatientFolder?: (patient: Patient) => void;
  onSessionCompleted?: (sale: { date: string; patientName: string; doctorName: string; serviceType: string; amount: number }) => void;
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
  const [sculptureMode, setSculptureMode] = useState<'2d' | '3d'>('2d');
  const [historySculptureMode, setHistorySculptureMode] = useState<'2d' | '3d'>('2d');
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
  const [lastActiveTemplateId, setLastActiveTemplateId] = useState<string | null>(null);
  const [saveTemplateMode, setSaveTemplateMode] = useState<'update' | 'new'>('update');
  const [selectedTemplateToOverwriteId, setSelectedTemplateToOverwriteId] = useState<string>('');
  const [showAllTemplatesModal, setShowAllTemplatesModal] = useState(false);
  const [showMaterialsManagerModal, setShowMaterialsManagerModal] = useState(false);
  const [templateFilterCategory, setTemplateFilterCategory] = useState<string>('all');

  // OŠETRUJÚCI LEKÁR (PREDVOĽBA PRE ŠABLÓNY A OŠETRENIE)
  const [selectedDoctor, setSelectedDoctor] = useState<string>('MUDr. Ján Mráz');

  // ZOSTATKY MATERIÁLU PACIENTKY V SKLADE (KLIENTSKÝ DEPOZIT)
  const [patientDepotItems, setPatientDepotItems] = useState<PatientMaterialDepotItem[]>([]);

  // KATALÓG: ŠABLÓNY vs CENNÍK
  const [catalogTab, setCatalogTab] = useState<'templates' | 'pricelist'>('templates');
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [catalogCategory, setCatalogCategory] = useState<string>('all');

  const refreshPatientDepot = React.useCallback(() => {
    if (currentPatient?.id) {
      const active = InventoryService.getActivePatientDepot(currentPatient.id);
      setPatientDepotItems(active);
    } else {
      setPatientDepotItems([]);
    }
  }, [currentPatient?.id]);

  useEffect(() => {
    refreshPatientDepot();
    const handleDepotChange = () => refreshPatientDepot();
    window.addEventListener('say_clinic_patient_depot_changed', handleDepotChange);
    return () => window.removeEventListener('say_clinic_patient_depot_changed', handleDepotChange);
  }, [refreshPatientDepot]);

  // Filtrovanie šablón podľa lekára, kategórie a vyhľadávania
  const doctorTemplates = React.useMemo(() => {
    return templatesList.filter(tpl => {
      const matchesDoctor = !tpl.doctor || tpl.doctor === 'all' || tpl.doctor === selectedDoctor;
      if (!matchesDoctor) return false;
      if (catalogCategory !== 'all') {
        if (catalogCategory === 'pdrn') {
          if (tpl.category !== 'pdrn' && tpl.category !== 'meso') return false;
        } else if (catalogCategory === 'filler') {
          if (tpl.category !== 'filler') return false;
        } else if (catalogCategory === 'botox') {
          if (tpl.category !== 'botox') return false;
        } else if (tpl.category !== catalogCategory) {
          return false;
        }
      }
      if (catalogSearch.trim()) {
        const q = catalogSearch.toLowerCase();
        return tpl.title.toLowerCase().includes(q) || tpl.productName.toLowerCase().includes(q) || (tpl.description && tpl.description.toLowerCase().includes(q));
      }
      return true;
    });
  }, [templatesList, selectedDoctor, catalogCategory, catalogSearch]);

  // Filtrovanie cenníka kliniky pre estetické výkony
  const filteredPriceList = React.useMemo(() => {
    const list = CLINIC_PRICE_LIST.filter(item => {
      // Striktne len relevantná estetika (injekčná estetika & prístroje priradené k estetike)
      if (item.category !== 'injectables_aesthetics') return false;

      const nameLower = item.name.toLowerCase();
      const descLower = (item.description || '').toLowerCase();
      const idLower = item.id.toLowerCase();

      // Striktne vylúčenie Radiesse a Juvéderm
      if (nameLower.includes('radiesse') || idLower.includes('radiesse')) return false;
      if (nameLower.includes('juvéderm') || nameLower.includes('juvederm') || idLower.includes('juvederm')) return false;

      if (catalogCategory !== 'all') {
        if (catalogCategory === 'filler' && !nameLower.includes('restylane') && !nameLower.includes('teosyal') && !nameLower.includes('kyselina') && !nameLower.includes('výplň') && !idLower.includes('ha_') && !idLower.includes('hyaluronidase')) return false;
        if (catalogCategory === 'botox' && !nameLower.includes('botox') && !nameLower.includes('dysport')) return false;
        if (catalogCategory === 'refill' && !nameLower.includes('doplnenie') && !nameLower.includes('dopich') && !idLower.includes('addition')) return false;
        if (catalogCategory === 'pdrn' && !nameLower.includes('rejuran') && !nameLower.includes('pdrn') && !nameLower.includes('polynukleotid') && !nameLower.includes('profhilo') && !nameLower.includes('philart')) return false;
        if (catalogCategory === 'exosomes' && !nameLower.includes('exozóm') && !nameLower.includes('asce')) return false;
        if (catalogCategory === 'microneedling' && !nameLower.includes('dermapen') && !nameLower.includes('microneedling')) return false;
        if (catalogCategory === 'laser' && !nameLower.includes('co2') && !nameLower.includes('coolpeel') && !idLower.includes('co2')) return false;
      }

      if (catalogSearch.trim()) {
        const q = catalogSearch.toLowerCase();
        return nameLower.includes(q) || descLower.includes(q) || item.categoryLabel.toLowerCase().includes(q);
      }
      return true;
    });

    // Zaručená deduplikácia podľa unikátneho ID
    const seenIds = new Set<string>();
    return list.filter(item => {
      if (seenIds.has(item.id)) return false;
      seenIds.add(item.id);
      return true;
    });
  }, [catalogCategory, catalogSearch]);
  
  // MODÁLNE OKNÁ PRE NOVÉ ŠABLÓNY A MATERIÁLY
  const [showSaveCustomTemplateModal, setShowSaveCustomTemplateModal] = useState(false);
  const [customTemplateTitle, setCustomTemplateTitle] = useState('');
  const [customTemplatePrice, setCustomTemplatePrice] = useState(150);

  // EDITÁCIA EXISTUJÚCICH ŠABLÓN A MATERIÁLOV
  const [editingTemplate, setEditingTemplate] = useState<AestheticTemplate | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<AestheticMaterial | null>(null);

  // KONTEXTOVÉ MENU PRE ŠABLÓNU (PRAVÝ KLIK)
  const [templateContextMenu, setTemplateContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    template: AestheticTemplate | null;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    template: null
  });

  // REŽIM ÚPRAVY BODOV ŠABLÓNY NA SOCHE TVÁRE
  const [templatePointsEditing, setTemplatePointsEditing] = useState<AestheticTemplate | null>(null);
  const [patientVectorsBackup, setPatientVectorsBackup] = useState<Vector2DItem[] | null>(null);

  // FORMULÁR PRE DETAILNÚ EDITÁCIU ŠABLÓNY
  const [editTemplateForm, setEditTemplateForm] = useState<{
    id: string;
    title: string;
    category: AestheticTemplate['category'];
    productName: string;
    price: number;
    doctor: string;
    defaultTotalVolume: number;
    defaultUsedVolume: number;
    defaultUnit: string;
    type: 'point' | 'fanning' | 'threads';
    color: string;
    description: string;
    recommendations: string;
    vectors: Vector2DItem[];
    isCustom?: boolean;
  } | null>(null);

  // FORMULÁR PRE PRIDANIE NOVEJ LÁTKY
  const [newMatName, setNewMatName] = useState('');
  const [newMatType, setNewMatType] = useState<'botox' | 'filler' | 'meso' | 'biostimulator'>('botox');
  const [newMatCategory, setNewMatCategory] = useState('Botulotoxín A');
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
      totalVolume: 50,
      usedVolume: 50,
      remainingVolume: 0,
      unit: 'Speywood',
      storeRemainingToDepot: false,
      doctorName: 'MUDr. Ján Mráz'
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
  const [loyaltyVersion, setLoyaltyVersion] = useState<number>(0);
  const [showLoyaltyModal, setShowLoyaltyModal] = useState<boolean>(false);

  const currentPatientLoyalty = React.useMemo(() => {
    if (!currentPatient?.name) return null;
    return LoyaltyService.calculateClientLoyalty(currentPatient);
  }, [currentPatient, loyaltyVersion, sessions.length]);

  useEffect(() => {
    const handleLoyaltyChange = () => setLoyaltyVersion(v => v + 1);
    window.addEventListener('say_clinic_loyalty_changed', handleLoyaltyChange);
    return () => window.removeEventListener('say_clinic_loyalty_changed', handleLoyaltyChange);
  }, []);

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
    const loyaltyCalc = LoyaltyService.calculateClientLoyalty(currentPatient);
    setDiscountType('percent');
    setDiscountValue(loyaltyCalc.tierDef.discountPercent);
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

  // ZMAZANIE ŠABLÓNY Z KATALÓGU
  const handleDeleteTemplate = (id: string) => {
    const tpl = templatesList.find(t => t.id === id);
    if (!tpl) return;
    if (confirm(`Naozaj chcete vymazať šablónu "${tpl.title}" z katalógu?`)) {
      const updated = templatesList.filter(t => t.id !== id);
      saveTemplatesToStorage(updated);
      setAppliedTemplateTitles(prev => prev.filter(t => t !== tpl.title));
      setToastMsg(`🗑️ Šablóna "${tpl.title}" bola vymazaná.`);
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  // OTVORENIE KONTEXTOVÉHO MENU ŠABLÓNY (PRAVÝ KLIK ALEBO IKONA)
  const handleOpenTemplateContextMenu = (e: React.MouseEvent, tpl: AestheticTemplate) => {
    e.preventDefault();
    e.stopPropagation();
    const menuWidth = 250;
    const menuHeight = 240;
    const x = Math.min(e.clientX, window.innerWidth - menuWidth - 16);
    const y = Math.min(e.clientY, window.innerHeight - menuHeight - 16);
    setTemplateContextMenu({
      isOpen: true,
      x: Math.max(16, x),
      y: Math.max(16, y),
      template: tpl
    });
  };

  // OTVORENIE MODÁLU PRE EDITÁCIU ŠABLÓNY
  const handleOpenEditTemplate = (tpl: AestheticTemplate) => {
    setEditTemplateForm({
      id: tpl.id,
      title: tpl.title,
      category: tpl.category,
      productName: tpl.productName,
      price: tpl.price,
      doctor: tpl.doctor || 'all',
      defaultTotalVolume: tpl.defaultTotalVolume ?? (tpl.category === 'botox' ? 300 : 1.0),
      defaultUsedVolume: tpl.defaultUsedVolume ?? (tpl.category === 'botox' ? 50 : 1.0),
      defaultUnit: tpl.defaultUnit ?? (tpl.category === 'botox' ? 'Speywood' : 'ml'),
      type: tpl.type || 'point',
      color: tpl.color || '#3B82F6',
      description: tpl.description || '',
      recommendations: tpl.recommendations || DEFAULT_RECOMMENDATIONS,
      vectors: tpl.vectors ? tpl.vectors.map(v => ({ ...v })) : [],
      isCustom: tpl.isCustom
    });
    setEditingTemplate(tpl);
  };

  // ULOŽENIE UPRAVENEJ ŠABLÓNY Z FORMULÁRA
  const handleSaveEditedTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTemplateForm || !editTemplateForm.title.trim()) return;

    const updatedTemplates = templatesList.map(t => {
      if (t.id === editTemplateForm.id) {
        return {
          ...t,
          title: editTemplateForm.title.trim(),
          category: editTemplateForm.category,
          productName: editTemplateForm.productName,
          price: Number(editTemplateForm.price) || 0,
          doctor: editTemplateForm.doctor,
          defaultTotalVolume: Number(editTemplateForm.defaultTotalVolume) || 1.0,
          defaultUsedVolume: Number(editTemplateForm.defaultUsedVolume) || 1.0,
          defaultUnit: editTemplateForm.defaultUnit,
          type: editTemplateForm.type,
          color: editTemplateForm.color,
          description: editTemplateForm.description.trim(),
          recommendations: editTemplateForm.recommendations.trim(),
          vectors: editTemplateForm.vectors
        };
      }
      return t;
    });

    saveTemplatesToStorage(updatedTemplates);
    setToastMsg(`✅ Šablóna "${editTemplateForm.title}" bola úspešne upravená.`);
    setTimeout(() => setToastMsg(null), 3000);
    setEditingTemplate(null);
    setEditTemplateForm(null);
  };

  // SPUSTENIE REŽIMU ÚPRAVY BODOV ŠABLÓNY NA SOCHE TVÁRE
  const handleStartEditingTemplatePointsOnFace = (tpl: AestheticTemplate) => {
    setPatientVectorsBackup([...vectors]);
    const tplVectors = (tpl.vectors || []).map((v, i) => ({
      ...v,
      id: `pt_${tpl.id}_${Date.now()}_${i}`
    }));
    setVectors(tplVectors);
    setTemplatePointsEditing(tpl);
    setActiveColor(tpl.color);
    if (tpl.vectors && tpl.vectors.length > 0 && tpl.vectors[0].view) {
      setActiveSculptureView(tpl.vectors[0].view);
    }
    setToastMsg(`🎯 Aktivovaný režim úpravy bodov šablóny: "${tpl.title}". Klikajte do tváre a zmeny uložte.`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // ULOŽENIE BODOV ZO SOCHY DO ŠABLÓNY
  const handleSaveTemplatePointsFromFace = () => {
    if (!templatePointsEditing) return;

    const newTemplateVectors: Vector2DItem[] = vectors.map((v, i) => ({
      ...v,
      id: `tpl_${templatePointsEditing.id}_pt${i + 1}`,
      productName: templatePointsEditing.productName,
      color: templatePointsEditing.color
    }));

    const updatedTemplates = templatesList.map(t => {
      if (t.id === templatePointsEditing.id) {
        return {
          ...t,
          ...templatePointsEditing,
          vectors: newTemplateVectors
        };
      }
      return t;
    });

    saveTemplatesToStorage(updatedTemplates);

    // Ponechaj novo upravené body na tvári, aby lekár videl výsledok
    setPatientVectorsBackup(null);
    setLastActiveTemplateId(templatePointsEditing.id);
    setSelectedTemplateToOverwriteId(templatePointsEditing.id);
    setAppliedTemplateTitles(prev => prev.includes(templatePointsEditing.title) ? prev : [...prev, templatePointsEditing.title]);

    setToastMsg(`✅ Body šablóny "${templatePointsEditing.title}" boli úspešne uložené (${newTemplateVectors.length} bodov).`);
    setTimeout(() => setToastMsg(null), 3500);
    setTemplatePointsEditing(null);
  };

  // PRIAME ULOŽENIE / PREPÍSANIE BODOV V EXISTUJÚCEJ ŠABLÓNE (Z TVÁRE)
  const handleOverwriteTemplatePoints = (targetIdOrTitle?: string | null) => {
    if (vectors.length === 0) {
      alert('Na tvári sa nenachádzajú žiadne body na uloženie.');
      return;
    }

    // Nájdi šablónu podľa zadaného ID / Title, alebo naposledy aktívnej
    let target = templatesList.find(t => 
      t.id === targetIdOrTitle || 
      t.title === targetIdOrTitle
    );

    if (!target && lastActiveTemplateId) {
      target = templatesList.find(t => t.id === lastActiveTemplateId);
    }

    if (!target && appliedTemplateTitles.length > 0) {
      target = templatesList.find(t => t.title === appliedTemplateTitles[appliedTemplateTitles.length - 1]);
    }

    if (!target && templatesList.length > 0) {
      target = templatesList[0];
    }

    if (!target) {
      alert('Nepodarilo sa nájsť šablónu na prepísanie.');
      return;
    }

    // Priprav čisté vektory pre šablónu
    const cleanVectors: Vector2DItem[] = vectors.map((v, i) => ({
      ...v,
      id: `tpl_${target.id}_pt${i + 1}`,
      productName: target.productName,
      color: target.color
    }));

    const updatedTemplates = templatesList.map(t => {
      if (t.id === target.id) {
        return {
          ...t,
          vectors: cleanVectors
        };
      }
      return t;
    });

    saveTemplatesToStorage(updatedTemplates);
    setLastActiveTemplateId(target.id);
    setSelectedTemplateToOverwriteId(target.id);
    setAppliedTemplateTitles(prev => prev.includes(target.title) ? prev : [...prev, target.title]);
    setToastMsg(`✅ Body boli úspešne uložené do šablóny "${target.title}" (${cleanVectors.length} bodov)!`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // ZRUŠENIE REŽIMU ÚPRAVY BODOV ZO SOCHY
  const handleCancelTemplatePointsEditing = () => {
    if (patientVectorsBackup !== null) {
      setVectors(patientVectorsBackup);
      setPatientVectorsBackup(null);
    } else {
      setVectors([]);
    }
    setTemplatePointsEditing(null);
    setToastMsg('Úprava bodov šablóny bola zrušená.');
    setTimeout(() => setToastMsg(null), 2500);
  };

  // DUPLIKOVANIE ŠABLÓNY
  const handleDuplicateTemplate = (tpl: AestheticTemplate) => {
    const duplicate: AestheticTemplate = {
      ...tpl,
      id: `tpl_custom_${Date.now()}`,
      title: `${tpl.title} (kópia)`,
      isCustom: true,
      vectors: (tpl.vectors || []).map((v, i) => ({
        ...v,
        id: `tpl_dup_${Date.now()}_${i}`
      }))
    };
    const updated = [duplicate, ...templatesList];
    saveTemplatesToStorage(updated);
    setToastMsg(`✅ Šablóna bola zduplikovaná: "${duplicate.title}"`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // ODSTRÁNENIE APLIKOVANEJ ŠABLÓNY Z AKTUÁLNEHO SEDENIA
  const handleRemoveAppliedTemplate = (tplTitle: string) => {
    const tpl = templatesList.find(t => t.title === tplTitle);
    const tplId = tpl?.id;

    // 1. Odober zo zoznamu aplikovaných šablón
    setAppliedTemplateTitles(prev => prev.filter(t => t !== tplTitle));

    // 2. Odober z cenníka (line items)
    setLineItems(prev => prev.filter(li => {
      if (tplId && li.templateId === tplId) return false;
      if (li.templateTitle === tplTitle) return false;
      if (li.title.toLowerCase().includes(tplTitle.toLowerCase())) return false;
      if (tpl && li.title.includes(tpl.productName) && li.price === tpl.price) return false;
      return true;
    }));

    // 3. Odober body nanesené touto šablónou
    if (tplId) {
      setVectors(prev => prev.filter(v => !v.id.includes(tplId)));
    }

    setToastMsg(`Šablóna "${tplTitle}" bola odobratá z mapy.`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // APLIKÁCIA ŠABLÓNY
  const handleApplyTemplate = (tpl: AestheticTemplate, mode: 'append' | 'replace' = 'append') => {
    const freshVectors: Vector2DItem[] = tpl.vectors.map((v, i) => ({
      ...v,
      id: `pt_${tpl.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}_${i}`
    }));

    const lineItemTitle = tpl.description && !tpl.description.startsWith('Izolované') && !tpl.description.startsWith('Horizontálne')
      ? `${tpl.productName}, ${tpl.description}`
      : `${tpl.productName}, ${tpl.title.replace(/Botox |Výplň |Kyselina Hyalurónová – /gi, '')}`;

    const defaultTot = tpl.defaultTotalVolume !== undefined ? tpl.defaultTotalVolume : (tpl.category === 'botox' ? 50 : 1.0);
    const defaultUsed = tpl.defaultUsedVolume !== undefined ? tpl.defaultUsedVolume : defaultTot;
    const defaultUnit = tpl.defaultUnit || (tpl.category === 'botox' ? 'Speywood' : 'ml');

    const newLineItem: TreatmentLineItem = {
      id: `li_${tpl.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: lineItemTitle,
      price: tpl.price,
      category: tpl.category,
      templateId: tpl.id,
      templateTitle: tpl.title,
      totalVolume: defaultTot,
      usedVolume: defaultUsed,
      remainingVolume: Math.max(0, Math.round((defaultTot - defaultUsed) * 100) / 100),
      unit: defaultUnit,
      storeRemainingToDepot: false,
      doctorName: selectedDoctor
    };

    setLastActiveTemplateId(tpl.id);
    setSelectedTemplateToOverwriteId(tpl.id);

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
    setToastMsg(`✅ Aplikovaná šablóna: "${tpl.title}" (+${tpl.price} €)`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // PRIDANIE POLOŽKY Z OFICIÁLNEHO CENNÍKA SAY CLINIC
  const handleAddPriceListItem = (item: ClinicPriceItem) => {
    const isBotox = item.name.toLowerCase().includes('botox') || item.name.toLowerCase().includes('dysport');
    let defVol = 1.0;
    let defUnit = 'ml';
    if (isBotox) {
      defVol = item.name.includes('3 oblasti') ? 150 : item.name.includes('2 oblasti') ? 100 : 50;
      defUnit = 'Speywood';
    } else if (item.name.includes('0,5ml') || item.name.includes('0.5ml')) {
      defVol = 0.5;
    } else if (item.name.includes('2ml')) {
      defVol = 2.0;
    } else if (item.name.includes('1,5ml') || item.name.includes('1.5ml')) {
      defVol = 1.5;
    }

    const newLineItem: TreatmentLineItem = {
      id: `li_pl_${item.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: item.name,
      price: item.price,
      category: item.category,
      totalVolume: defVol,
      usedVolume: defVol,
      remainingVolume: 0,
      unit: defUnit,
      storeRemainingToDepot: false,
      doctorName: selectedDoctor
    };

    setLineItems(prev => [...prev, newLineItem]);
    setToastMsg(`✅ Inkorporované z cenníka: "${item.name}" (${item.price} €)`);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // UPLATNENIE ZOSTATKU MATERIÁLU ZO SKLADU PACIENTKY
  const handleApplyDepotItem = (depot: PatientMaterialDepotItem) => {
    const newLineItem: TreatmentLineItem = {
      id: `li_depot_${depot.id}_${Date.now()}`,
      title: `${depot.materialName} (Uplatnený zostatok zo skladu kliniky)`,
      price: 0,
      totalVolume: depot.remainingVolume,
      usedVolume: depot.remainingVolume,
      remainingVolume: 0,
      unit: depot.unit,
      lot: depot.lotNumber,
      doctorName: selectedDoctor,
      isFromDepot: true,
      depotOriginId: depot.id
    };

    setLineItems(prev => [...prev, newLineItem]);
    setToastMsg(`📦 Uplatnený zostatok ${depot.remainingVolume} ${depot.unit} ${depot.materialName} zo dňa ${depot.dateCreated}`);
    setTimeout(() => setToastMsg(null), 3500);
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
    const isBotox = activeMaterial.type === 'botox';
    const defVol = isBotox ? 50 : 1.0;
    const defUnit = activeMaterial.defaultUnit || (isBotox ? 'Speywood' : 'ml');

    const newItem: TreatmentLineItem = {
      id: `li_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: title || `${activeMaterial.name}, individuálna aplikácia`,
      price: price !== undefined ? price : activeMaterial.defaultPrice,
      totalVolume: defVol,
      usedVolume: defVol,
      remainingVolume: 0,
      unit: defUnit,
      storeRemainingToDepot: false,
      doctorName: selectedDoctor
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

  // Uloženie ošetrenia do karty pacienta, skladu a klientskeho depozitu
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
      doctor: selectedDoctor,
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
      RealtimeSyncService.publish('aesthetic_sessions', allSessions);

      setSessions(updated);
      setSelectedHistorySessionId(newSession.id);

      let savedToDepotCount = 0;

      // 1. Odpísanie materiálu zo skladu & správa klientskeho depozitu
      if (lineItems.length > 0) {
        lineItems.forEach(item => {
          // A. Odpísanie zo všeobecného skladu kliniky (ak to nie je starší zostatok zo skladu)
          if (!item.isFromDepot) {
            InventoryService.logMaterialUsage({
              patientId: currentPatient.id,
              patientName: currentPatient.name,
              patientBirthNumber: currentPatient.birthNumber,
              sourceType: 'estetika',
              procedureName: item.title,
              itemName: item.title.split(',')[0],
              category: 'estetika',
              quantity: item.usedVolume !== undefined ? item.usedVolume : 1,
              unit: item.unit || 'ks',
              lotNumber: item.lot,
              performerName: selectedDoctor,
              notes: `Cena: ${item.price} € • Minuté: ${item.usedVolume ?? 1} ${item.unit || ''} (Protokol ${sessionProtocolNo})`
            });
          }

          // B. Uloženie nevyčerpaného zostatku do klientskeho depozitu pacientky
          if (item.remainingVolume && item.remainingVolume > 0 && item.storeRemainingToDepot) {
            InventoryService.addPatientDepotItem({
              patientId: currentPatient.id,
              patientName: currentPatient.name,
              patientBirthNumber: currentPatient.birthNumber,
              materialName: item.title.split(',')[0],
              category: item.category || 'estetika',
              lotNumber: item.lot || '',
              totalVolume: item.totalVolume || 1.0,
              usedVolume: item.usedVolume || (item.totalVolume ? item.totalVolume - item.remainingVolume : 0),
              remainingVolume: item.remainingVolume,
              unit: item.unit || 'ml',
              doctorName: selectedDoctor,
              storageLocation: 'Chladnička zákrokovňa - box Klienti',
              sessionId: newSession.id,
              notes: `Ošetrenie z ${formattedDate} (${sessionProtocolNo})`
            });
            savedToDepotCount++;
          }

          // C. Ak bol uplatnený zostatok zo skladu z minulých návštev, označíme ho za spotrebovaný
          if (item.isFromDepot && item.depotOriginId) {
            InventoryService.consumeDepotItem(item.depotOriginId, item.usedVolume || item.totalVolume || 1, newSession.id);
          }
        });
      } else if (vectors.length > 0) {
        const groupedProducts = new Map<string, number>();
        vectors.forEach(v => {
          const pName = v.productName || activeMaterial.name;
          groupedProducts.set(pName, (groupedProducts.get(pName) || 0) + 1);
        });
        groupedProducts.forEach((count, pName) => {
          InventoryService.logMaterialUsage({
            patientId: currentPatient.id,
            patientName: currentPatient.name,
            patientBirthNumber: currentPatient.birthNumber,
            sourceType: 'estetika',
            procedureName: newSession.title,
            itemName: pName,
            category: 'estetika',
            quantity: 1,
            performerName: selectedDoctor,
            notes: `Aplikované v ${count} bodoch (${sessionProtocolNo})`
          });
        });
      }

      // Aktualizácia klientskeho depozitu
      refreshPatientDepot();

      // 2. Uloženie do zdravotného záznamu pacienta s presným rozpisom objemov
      const lineItemsSummaryText = lineItems.map(it => {
        let volText = '';
        if (it.totalVolume !== undefined) {
          volText = ` [Balenie: ${it.totalVolume}${it.unit || 'ml'}, Minuté: ${it.usedVolume}${it.unit || 'ml'}${it.remainingVolume && it.remainingVolume > 0 ? `, Odložený zostatok: ${it.remainingVolume}${it.unit || 'ml'}` : ''}]`;
        }
        if (it.isFromDepot) volText = ' [Uplatnený zostatok zo skladu]';
        return `• ${it.title}${volText} (${it.price} €)`;
      }).join('\n');

      const recordText = `ESTETICKÉ OŠETRENIE TVÁRE (SAY CLINIC)
Dátum: ${formattedDate}
Číslo protokolu: ${sessionProtocolNo}
Ošetrujúci lekár: ${selectedDoctor}

Aplikované látky, minutý objem a zostatky:
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
        typeColor: 'bg-pink-100 text-pink-800',
        diagnosis: 'Estetická dermatológia a korektívna chirurgia',
        date: formattedDate,
        doctor: selectedDoctor,
        title: `Estetika: ${lineItems[0]?.title || 'Estetické ošetrenie'} (${finalTotalPrice} €)`,
        content: recordText
      };

      const existingRecordsStr = localStorage.getItem(`say_clinic_records_${currentPatient.id}`);
      const existingRecords: MedicalRecord[] = existingRecordsStr ? JSON.parse(existingRecordsStr) : [];
      const updatedRecords = [newRecord, ...existingRecords];
      localStorage.setItem(`say_clinic_records_${currentPatient.id}`, JSON.stringify(updatedRecords));
      window.dispatchEvent(new CustomEvent('say_clinic_patient_records_changed', { detail: { patientId: currentPatient.id, records: updatedRecords } }));

      // 3. Automatické prepojenie do Pokladne POS a Financií (čakajúci účet + nákladová marža)
      FinanceBillingService.recordClinicalProcedureCheckout({
        patientId: currentPatient.id,
        patientName: currentPatient.name,
        patientBirthNumber: currentPatient.birthNumber,
        patientPhone: currentPatient.phone,
        patientEmail: currentPatient.email,
        patientAddress: currentPatient.address,
        doctorName: selectedDoctor,
        sourceModule: 'aesthetics',
        procedureTitle: newSession.title,
        protocolNumber: sessionProtocolNo,
        items: lineItems.map(li => ({
          id: li.id,
          name: li.title,
          brand: 'Estetická medicína SAY',
          price: Number(li.price) || 0,
          quantity: 1
        })),
        subtotal,
        discountAmount,
        totalAmount: finalTotalPrice,
        notes: `Estetický protokol ${sessionProtocolNo} (${lineItems.length} položiek)`
      });

      if (finalTotalPrice > 0) {
        LoyaltyService.recordTransaction({
          patientId: currentPatient.id,
          patientName: currentPatient.name,
          date: todayStr,
          category: 'treatment',
          title: `Estetika: ${newSession.title}`,
          amount: finalTotalPrice,
          originalAmount: subtotal,
          discountPercent: discountType === 'percent' ? discountValue : undefined,
          sourceId: sessionProtocolNo
        });
        setLoyaltyVersion(v => v + 1);
      }

      if (onSessionCompleted && finalTotalPrice > 0) {
        onSessionCompleted({
          date: todayStr,
          patientName: currentPatient.name,
          doctorName: selectedDoctor,
          serviceType: `Estetika: ${newSession.title}`,
          amount: finalTotalPrice
        });
      }

      setToastMsg(`✅ Uložené • Odpísané zo skladu ${savedToDepotCount > 0 ? `• Odložený zostatok pre pacientku v sklade (${savedToDepotCount} položiek)` : ''} • POS účet (${finalTotalPrice.toFixed(2)} €)`);
      setTimeout(() => setToastMsg(null), 4500);
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
              {(vectors.length > 0 || appliedTemplateTitles.length > 0 || lineItems.length > 0) && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Naozaj chcete vyčistiť všetky body a resetovať výpočet?')) {
                      setVectors([]);
                      setAppliedTemplateTitles([]);
                      setSelectedVectorId(null);
                      setLineItems([]);
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
      {/* 1. REŽIM EDITOR: SIDE-BY-SIDE POHĽAD (VĽAVO TVÁR, VPRAVO LEKÁR, ŠABLÓNY, CENNÍK & ROZPIS) */}
      {/* ========================================================================= */}
      {activeTab === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start animate-in fade-in duration-150">
          
          {/* ĽAVÁ STRANA: SOCHA TVÁRE (2D / 3D) S KRESLENÍM BODOV */}
          <div className="lg:col-span-5 xl:col-span-5 space-y-4 lg:sticky lg:top-4">
            
            {/* ZLATÁ LIŠTA: REŽIM ÚPRAVY BODOV ŠABLÓNY */}
            {templatePointsEditing && (
              <div className="w-full p-3.5 rounded-3xl bg-[#2C2A29] text-white border-2 border-[#C5A059] shadow-xl flex items-center justify-between gap-3 flex-wrap animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-[#C5A059]/20 border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059] shrink-0">
                    <Target className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">Režim úpravy bodov:</span>
                      <span className="text-xs font-bold text-[#C5A059]">"{templatePointsEditing.title}"</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-200 font-mono font-bold">
                        {vectors.length} {vectors.length === 1 ? 'bod' : vectors.length < 5 ? 'body' : 'bodov'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-300 mt-0.5">
                      Klikaním do tváre pridávate/posúvate body. Pravým klikom na bod na tvári upravíte dávku alebo bod vymažete.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCancelTemplatePointsEditing}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    Zrušiť
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveTemplatePointsFromFace}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#C5A059] hover:bg-[#d6b26d] text-[#2C2A29] transition-all shadow-md cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Uložiť body do šablóny</span>
                  </button>
                </div>
              </div>
            )}

            <div className="rounded-3xl p-4 bg-white/95 border border-[#E8E2D9] shadow-sm flex flex-col items-center">
              
              {/* Horná lišta sochy */}
              <div className="w-full flex items-center justify-between pb-3 border-b border-[#E8E2D9] mb-3 text-xs flex-wrap gap-2">
                {/* 2D ⇄ 3D Prepínač */}
                <div className="flex items-center p-1 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setSculptureMode('2d')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      sculptureMode === '2d'
                        ? 'bg-[#2C2A29] text-white shadow-xs'
                        : 'text-[#8C857B] hover:text-[#2C2A29]'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>2D Schéma</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSculptureMode('3d')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      sculptureMode === '3d'
                        ? 'bg-[#2C2A29] text-white shadow-xs'
                        : 'text-[#8C857B] hover:text-[#2C2A29]'
                    }`}
                  >
                    <Compass className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>3D Model 360°</span>
                  </button>
                </div>

                {/* Počet bodov & Vyčistiť */}
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#2C2A29] bg-[#FAF8F5] px-2.5 py-1 rounded-xl border border-[#E8E2D9] text-[11px]">
                    {vectors.length} bodov
                  </span>
                  {vectors.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Naozaj chcete vyčistiť všetky body z tváre?')) {
                          setVectors([]);
                          setSelectedVectorId(null);
                        }
                      }}
                      className="p-1.5 rounded-xl text-[#8C857B] hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                      title="Vyčistiť body na tvári"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Informácia o aktívnom materiáli pre voľné dokresľovanie bodov */}
              <div className="w-full flex items-center justify-between px-1 mb-2 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span style={{ backgroundColor: activeMaterial.color }} className="w-2.5 h-2.5 rounded-full shrink-0" />
                  <span className="font-bold text-[#2C2A29] truncate">{activeMaterial.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMaterialsManagerModal(true)}
                  className="text-[10px] font-bold text-[#8C857B] hover:text-[#2C2A29] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Settings className="w-3 h-3 text-[#C5A059]" />
                  <span>Správa látok</span>
                </button>
              </div>

              {/* Samotná socha (2D alebo 3D) */}
              <div className="w-full flex flex-col items-center">
                {sculptureMode === '2d' ? (
                  <Sculpture2DViewer
                    vectors={vectors}
                    onVectorsChange={setVectors}
                    activeTool={activeTool}
                    onSelectTool={setActiveTool}
                    activeColor={activeColor}
                    onSelectColor={setActiveColor}
                    currentProduct={{
                      name: activeMaterial.name,
                      lot: '',
                      type: activeMaterial.type
                    }}
                    selectedVectorId={selectedVectorId}
                    onSelectVector={setSelectedVectorId}
                    activeView={activeSculptureView}
                    onViewChange={setActiveSculptureView}
                    readOnly={false}
                  />
                ) : (
                  <Sculpture3DViewer
                    vectors={vectors}
                    onVectorsChange={setVectors}
                    activeTool={activeTool as any}
                    onSelectTool={setActiveTool as any}
                    activeColor={activeColor}
                    onSelectColor={setActiveColor}
                    currentProduct={{
                      name: activeMaterial.name,
                      type: activeMaterial.type,
                      unit: activeMaterial.defaultUnit
                    }}
                    selectedVectorId={selectedVectorId}
                    onSelectVector={setSelectedVectorId}
                    onAddFatPadProcedure={(pad) => {
                      handleAddLineItem(`${pad.slovakName} (${pad.layerLabel}) - ${pad.recommendedMaterial} [${pad.defaultDose}]`, activeMaterial.defaultPrice);
                    }}
                    readOnly={false}
                  />
                )}
              </div>

              {/* RÝCHLE ULOŽENIE NÁKRESU Z TVÁRE DO ŠABLÓNY */}
              <div className="w-full mt-3 pt-3 border-t border-[#E8E2D9] flex items-center justify-between gap-2 flex-wrap text-xs">
                {(() => {
                  const activeTpl = templatesList.find(t => 
                    (lastActiveTemplateId && t.id === lastActiveTemplateId) || 
                    (appliedTemplateTitles.length > 0 && t.title === appliedTemplateTitles[appliedTemplateTitles.length - 1])
                  );

                  if (activeTpl && vectors.length > 0) {
                    return (
                      <>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Bookmark className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[10px] text-[#8C857B] block leading-none">Aktívna šablóna:</span>
                            <span className="text-[11px] font-bold text-[#2C2A29] truncate block max-w-[160px]" title={activeTpl.title}>
                              {activeTpl.title}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOverwriteTemplatePoints(activeTpl.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2C2A29] hover:bg-[#C5A059] text-white text-[11px] font-bold transition-all shadow-xs cursor-pointer"
                            title={`Uložiť ${vectors.length} bodov z tváre priamo do šablóny "${activeTpl.title}"`}
                          >
                            <Save className="w-3.5 h-3.5 text-[#C5A059]" />
                            <span>Uložiť do šablóny</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTemplateToOverwriteId(activeTpl.id);
                              setSaveTemplateMode('update');
                              setShowSaveCustomTemplateModal(true);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-gray-50 border border-[#E8E2D9] text-[10px] font-semibold text-[#8C857B] hover:text-[#2C2A29] transition-all cursor-pointer"
                            title="Možnosti uloženia (zvoliť inú šablónu alebo vytvoriť novú)"
                          >
                            Možnosti...
                          </button>
                        </div>
                      </>
                    );
                  }

                  return (
                    <>
                      <span className="text-[11px] text-[#8C857B]">
                        {vectors.length > 0 ? `${vectors.length} bodov na tvári` : 'Nový nákres na tvári?'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (templatesList.length > 0) {
                            setSelectedTemplateToOverwriteId(templatesList[0].id);
                          }
                          setSaveTemplateMode(templatesList.length > 0 ? 'update' : 'new');
                          setShowSaveCustomTemplateModal(true);
                        }}
                        disabled={vectors.length === 0}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-[#E8E2D9] hover:border-[#C5A059] text-[11px] font-bold text-[#2C2A29] shadow-2xs transition-all disabled:opacity-40 cursor-pointer"
                        title="Uložiť body do existujúcej alebo novej šablóny"
                      >
                        <Save className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>Uložiť do šablóny</span>
                      </button>
                    </>
                  );
                })()}
              </div>

            </div>
          </div>

          {/* PRAVÁ STRANA: OŠETRUJÚCI LEKÁR, ŠABLÓNY, CENNÍK & INKORPOROVANÝ ROZPIS */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-4">
            
            {/* 1. HLAVIČKA: VÝBER LEKÁRA & ZOSTATOK PACIENTKY V SKLADE */}
            <div className="p-4 bg-white/95 rounded-3xl border border-[#E8E2D9] shadow-xs space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#2C2A29] to-[#433E3C] text-[#C5A059] flex items-center justify-center shrink-0">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C857B] block">
                      Aplikujúci lekár (Filtruje šablóny & cenník):
                    </span>
                    <select
                      value={selectedDoctor}
                      onChange={(e) => setSelectedDoctor(e.target.value)}
                      className="text-sm font-bold text-[#2C2A29] bg-transparent focus:outline-hidden cursor-pointer hover:text-[#C5A059] transition-colors"
                    >
                      {AESTHETIC_DOCTORS.map(doc => (
                        <option key={doc} value={doc}>{doc}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAllTemplatesModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E8E2D9] hover:border-[#C5A059] text-[11px] font-bold text-[#2C2A29] transition-all cursor-pointer shadow-2xs"
                  >
                    <Settings className="w-3 h-3 text-[#C5A059]" />
                    <span>Katalóg šablón ({templatesList.length})</span>
                  </button>
                </div>
              </div>

              {/* UPOZORNENIE: ZOSTATOK MATERIÁLU PACIENTKY V SKLADE */}
              {patientDepotItems.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#FAF8F5] via-[#FFFBF2] to-[#FAF8F5] border-2 border-[#C5A059] shadow-xs animate-in fade-in duration-200">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#C5A059] text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <PackageCheck className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059]">
                            Odložený zostatok pacientky v sklade:
                          </span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <div className="text-xs font-bold text-[#2C2A29] truncate">
                          {patientDepotItems.map(d => `${d.remainingVolume} ${d.unit} ${d.materialName}`).join(' • ')}
                        </div>
                        <div className="text-[10px] text-[#8C857B] truncate">
                          Uskladnené: {patientDepotItems[0].dateCreated} (Lekár: {patientDepotItems[0].doctorName})
                          {patientDepotItems[0].lotNumber ? ` • Šarža: ${patientDepotItems[0].lotNumber}` : ''}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyDepotItem(patientDepotItems[0])}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#B38F46] hover:from-[#B38F46] text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5 hover:scale-[1.02] shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Uplatniť zostatok zo skladu (0 €)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. KATALÓG: ŠABLÓNY LEKÁRA vs CENNÍK KLINIKY (ZOZNAM NA PRIAMU INKORPORÁCIU) */}
            <div className="p-4 bg-white/95 rounded-3xl border border-[#E8E2D9] shadow-xs space-y-3">
              {/* Prepínač záložiek & Vyhľadávanie */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center p-1 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9]">
                  <button
                    type="button"
                    onClick={() => setCatalogTab('templates')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      catalogTab === 'templates'
                        ? 'bg-[#2C2A29] text-white shadow-xs'
                        : 'text-[#8C857B] hover:text-[#2C2A29]'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Šablóny lekára ({doctorTemplates.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogTab('pricelist')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      catalogTab === 'pricelist'
                        ? 'bg-[#2C2A29] text-white shadow-xs'
                        : 'text-[#8C857B] hover:text-[#2C2A29]'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Cenník kliniky ({filteredPriceList.length})</span>
                  </button>
                </div>

                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-[#8C857B] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder={catalogTab === 'templates' ? "Hľadať šablónu (napr. čelo, pery)..." : "Hľadať v cenníku SAY CLINIC..."}
                    className="w-full text-xs pl-8 pr-3 py-1.5 bg-[#FAF8F5] rounded-xl border border-[#E8E2D9] focus:outline-hidden focus:border-[#C5A059] text-[#2C2A29]"
                  />
                </div>
              </div>

              {/* Kategórie filter pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {[
                  { id: 'all', label: 'Všetky' },
                  { id: 'filler', label: 'Výplne' },
                  { id: 'botox', label: 'Botox' },
                  { id: 'refill', label: 'Dopich' },
                  { id: 'pdrn', label: 'PDRN' },
                  { id: 'exosomes', label: 'Exozómy' },
                  { id: 'microneedling', label: 'Microneedling' },
                  { id: 'laser', label: 'CO2 Laser' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCatalogCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                      catalogCategory === cat.id
                        ? 'bg-[#2C2A29] text-white shadow-2xs'
                        : 'bg-[#FAF8F5] text-[#8C857B] hover:bg-white hover:text-[#2C2A29] border border-[#E8E2D9]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* ZOZNAM ŠABLÓN LEKÁRA (Kliknutím inkorporuje na klienta) */}
              {catalogTab === 'templates' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                  {doctorTemplates.map((tpl, idx) => {
                    const isApplied = appliedTemplateTitles.includes(tpl.title);
                    return (
                      <button
                        key={`doc-tpl-${tpl.id}-${idx}`}
                        type="button"
                        onClick={() => {
                          if (isApplied) {
                            handleRemoveAppliedTemplate(tpl.title);
                          } else {
                            handleApplyTemplate(tpl, 'append');
                          }
                        }}
                        onContextMenu={(e) => handleOpenTemplateContextMenu(e, tpl)}
                        title="Kliknutím aplikujete na tvár. Pravý klik: Upraviť šablónu, body a parametre"
                        className={`group/card p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isApplied
                            ? 'bg-[#2C2A29] text-white border-[#2C2A29] shadow-sm ring-2 ring-[#C5A059]'
                            : 'bg-[#FAF8F5]/80 hover:bg-white text-[#2C2A29] border-[#E8E2D9] hover:border-[#C5A059]'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <div className="flex items-center gap-1.5">
                            <span style={{ backgroundColor: tpl.color }} className="w-2.5 h-2.5 rounded-full shrink-0" />
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isApplied ? 'text-gray-300' : 'text-[#8C857B]'}`}>
                              {tpl.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg ${
                              isApplied ? 'bg-[#C5A059] text-white' : 'bg-white border border-[#E8E2D9] text-[#2C2A29]'
                            }`}>
                              {tpl.price} €
                            </span>
                            <span
                              role="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenTemplateContextMenu(e, tpl);
                              }}
                              className={`p-1 rounded-lg transition-colors opacity-70 group-hover/card:opacity-100 ${
                                isApplied ? 'hover:bg-white/20 text-white' : 'hover:bg-black/5 text-[#8C857B] hover:text-[#2C2A29]'
                              }`}
                              title="Možnosti šablóny (pravý klik alebo klik)"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>

                        <div className="text-xs font-bold leading-snug line-clamp-1">{tpl.title}</div>
                        <div className={`text-[10px] mt-0.5 flex items-center justify-between ${isApplied ? 'text-gray-300' : 'text-[#8C857B]'}`}>
                          <span>{tpl.productName} ({tpl.vectors?.length ?? 0} bodov)</span>
                          <span className="font-semibold">{isApplied ? '✓ Aplikované (klik = zrušiť)' : '+ Pridať na klienta'}</span>
                        </div>
                      </button>
                    );
                  })}
                  {doctorTemplates.length === 0 && (
                    <div className="col-span-2 p-4 text-center text-xs text-[#8C857B] bg-[#FAF8F5] rounded-2xl border border-dashed border-[#E8E2D9]">
                      Pre vybraného lekára ({selectedDoctor}) a filter sa nenašli žiadne šablóny.
                    </div>
                  )}
                </div>
              )}

              {/* ZOZNAM POLOŽIEK CENNÍKA (Kliknutím inkorporuje na klienta) */}
              {catalogTab === 'pricelist' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                  {filteredPriceList.map((item, idx) => (
                    <button
                      key={`aesthetics-price-${item.id}-${idx}`}
                      type="button"
                      onClick={() => handleAddPriceListItem(item)}
                      className="p-2.5 rounded-2xl border border-[#E8E2D9] hover:border-[#C5A059] bg-[#FAF8F5]/80 hover:bg-white text-left transition-all cursor-pointer flex flex-col justify-between group shadow-2xs"
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C857B]">
                          {item.categoryLabel}
                        </span>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-white border border-[#E8E2D9] text-[#2C2A29] group-hover:border-[#C5A059]">
                          {item.price} €
                        </span>
                      </div>
                      <div className="text-xs font-bold text-[#2C2A29] line-clamp-1 group-hover:text-[#C5A059] transition-colors">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-[#8C857B] mt-0.5 flex items-center justify-between">
                        <span className="truncate max-w-[200px]">{item.description || 'Výkon podľa cenníka'}</span>
                        <span className="font-semibold text-[#C5A059] shrink-0">+ Inkorporovať</span>
                      </div>
                    </button>
                  ))}
                  {filteredPriceList.length === 0 && (
                    <div className="col-span-2 p-4 text-center text-xs text-[#8C857B] bg-[#FAF8F5] rounded-2xl border border-dashed border-[#E8E2D9]">
                      V cenníku sa nenašli žiadne položky zodpovedajúce hľadaniu.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. INKORPOROVANÝ ROZPIS VÝKONOV & MATERIÁLU KLIENTA (Live editovateľný zoznam s minútym objemom a zostatkom) */}
            <div className="rounded-3xl p-4 bg-white border border-[#E8E2D9] shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-2.5 flex-wrap gap-2">
                <div>
                  <h3 className="text-xs font-bold text-[#2C2A29] uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#C5A059]" />
                    Inkorporované výkony a materiál klienta ({lineItems.length}):
                  </h3>
                  <p className="text-[10px] text-[#8C857B]">
                    Zadajte minutý objem a zostatok pre odloženie do skladu
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddLineItem()}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-[#E8E2D9] hover:border-[#C5A059] text-[11px] font-bold text-[#2C2A29] transition-all cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Pridať vlastný riadok</span>
                  </button>
                </div>
              </div>

              {/* Zoznam live položiek */}
              <div className="space-y-2.5">
                {lineItems.map((item, idx) => {
                  const totVol = Number(item.totalVolume ?? 1.0);
                  const usedVol = Number(item.usedVolume ?? totVol);
                  const remVol = Math.max(0, Math.round((totVol - usedVol) * 100) / 100);

                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl border border-[#E8E2D9] hover:border-[#C5A059]/60 bg-[#FAF8F5]/60 space-y-2 transition-all shadow-2xs"
                    >
                      {/* Riadok 1: Názov, cena a mazanie */}
                      <div className="flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-[#2C2A29] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => handleUpdateLineItem(item.id, { title: e.target.value })}
                            placeholder="Názov výkonu alebo aplikovaného materiálu"
                            className="w-full text-xs font-semibold text-[#2C2A29] bg-white px-2.5 py-1.5 rounded-xl border border-[#E8E2D9] focus:outline-hidden focus:border-[#C5A059]"
                          />
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="5"
                              value={item.price}
                              onChange={(e) => handleUpdateLineItem(item.id, { price: Number(e.target.value) || 0 })}
                              className="w-20 text-xs font-bold font-mono text-[#2C2A29] bg-white p-1.5 pr-5 rounded-xl border border-[#E8E2D9] focus:outline-hidden focus:border-[#C5A059] text-right"
                            />
                            <span className="absolute right-2 top-1.5 text-xs font-bold text-[#8C857B]">€</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteLineItem(item.id)}
                            className="p-1.5 rounded-xl text-[#8C857B] hover:text-red-500 hover:bg-red-50 cursor-pointer transition-colors"
                            title="Odstrániť položku"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Riadok 2: Evidencia objemu (Celkovo, Minuté, Zostatok, Odložiť do skladu) */}
                      <div className="p-2 bg-white rounded-xl border border-[#E8E2D9] flex items-center justify-between gap-3 text-xs flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Celkový objem balenia */}
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-[#8C857B]">Balenie:</span>
                            <input
                              type="number"
                              step="0.05"
                              min="0"
                              value={item.totalVolume ?? 1.0}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                const currentUsed = item.usedVolume ?? val;
                                const newRem = Math.max(0, Math.round((val - currentUsed) * 100) / 100);
                                handleUpdateLineItem(item.id, { 
                                  totalVolume: val, 
                                  remainingVolume: newRem,
                                  storeRemainingToDepot: newRem > 0 ? (item.storeRemainingToDepot ?? true) : false
                                });
                              }}
                              className="w-14 px-1.5 py-1 text-xs font-mono font-bold text-[#2C2A29] bg-[#FAF8F5] rounded-lg border border-[#E8E2D9] focus:outline-hidden text-center"
                            />
                            <select
                              value={item.unit || 'ml'}
                              onChange={(e) => handleUpdateLineItem(item.id, { unit: e.target.value })}
                              className="text-[10px] font-bold bg-[#FAF8F5] px-1 py-1 rounded-lg border border-[#E8E2D9] focus:outline-hidden cursor-pointer"
                            >
                              <option value="ml">ml</option>
                              <option value="Speywood">Speywood U</option>
                              <option value="IU">IU</option>
                              <option value="fľaštička">fľaštička</option>
                              <option value="ampulka">ampulka</option>
                            </select>
                          </div>

                          <span className="text-[#E8E2D9]">|</span>

                          {/* Minutý objem */}
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-[#2C2A29]">Minuté:</span>
                            <input
                              type="number"
                              step="0.05"
                              min="0"
                              value={item.usedVolume ?? (item.totalVolume ?? 1.0)}
                              onChange={(e) => {
                                const used = Number(e.target.value) || 0;
                                const tot = item.totalVolume ?? 1.0;
                                const newRem = Math.max(0, Math.round((tot - used) * 100) / 100);
                                handleUpdateLineItem(item.id, { 
                                  usedVolume: used, 
                                  remainingVolume: newRem,
                                  storeRemainingToDepot: newRem > 0 ? (item.storeRemainingToDepot ?? true) : false
                                });
                              }}
                              className="w-14 px-1.5 py-1 text-xs font-mono font-bold text-[#2C2A29] bg-[#FAF8F5] rounded-lg border border-[#C5A059] focus:outline-hidden text-center"
                            />
                            <span className="text-[10px] text-[#8C857B]">{item.unit || 'ml'}</span>
                          </div>

                          <span className="text-[#E8E2D9]">|</span>

                          {/* Vypočítaný zostatok */}
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-[#8C857B]">Zostatok:</span>
                            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg ${
                              remVol > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-[#8C857B]'
                            }`}>
                              {remVol} {item.unit || 'ml'}
                            </span>
                          </div>
                        </div>

                        {/* Možnosť odložiť do skladu pre pacientku */}
                        {remVol > 0 && (
                          <label className="flex items-center gap-1.5 cursor-pointer bg-emerald-50/70 hover:bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 transition-colors">
                            <input
                              type="checkbox"
                              checked={item.storeRemainingToDepot ?? true}
                              onChange={(e) => handleUpdateLineItem(item.id, { storeRemainingToDepot: e.target.checked })}
                              className="w-3.5 h-3.5 accent-emerald-600 rounded cursor-pointer"
                            />
                            <span className="text-[10px] font-bold text-emerald-800">
                              📦 Odložiť do skladu pre pacientku
                            </span>
                          </label>
                        )}

                        {item.isFromDepot && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                            ✓ Uplatnené zo skladu
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {lineItems.length === 0 && (
                  <div className="p-4 text-center text-xs text-[#8C857B] bg-[#FAF8F5] rounded-2xl border border-dashed border-[#E8E2D9]">
                    Zatiaľ nie sú inkorporované žiadne položky. Vyberte šablónu alebo položku z cenníka hore.
                  </div>
                )}
              </div>

              {/* 4. SÚHRN: ZĽAVA, CELKOVÁ CENA & AKCIE */}
              <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#E8E2D9] space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap text-xs">
                  {/* Zľava */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold uppercase text-[#8C857B]">Zľava:</span>
                    {[0, 5, 10, 15, 20].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          setDiscountType('percent');
                          setDiscountValue(pct);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          discountType === 'percent' && discountValue === pct
                            ? 'bg-[#2C2A29] text-white shadow-2xs'
                            : 'bg-white text-[#2C2A29] border border-[#E8E2D9]'
                        }`}
                      >
                        {pct === 0 ? '0%' : `-${pct}%`}
                      </button>
                    ))}
                  </div>

                  {/* Sumár */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] text-[#8C857B] block">Medzisúčet: {subtotal.toFixed(2)} €</span>
                      {discountAmount > 0 && (
                        <span className="text-[10px] font-bold text-emerald-600 block">- {discountAmount.toFixed(2)} € zľava</span>
                      )}
                    </div>
                    <div className="text-base font-bold font-mono text-[#2C2A29] bg-white px-3 py-1 rounded-xl border border-[#C5A059] shadow-2xs">
                      {finalTotalPrice.toFixed(2)} €
                    </div>
                  </div>
                </div>

                {/* Odporúčania a postup */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-[#E8E2D9]">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#8C857B] uppercase flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-[#10B981]" />
                      Odporúčania po zákroku:
                    </label>
                    <textarea
                      rows={2}
                      value={sessionRecommendations}
                      onChange={(e) => setSessionRecommendations(e.target.value)}
                      className="w-full text-[11px] p-2 rounded-xl bg-white border border-[#E8E2D9] text-[#2C2A29] focus:outline-hidden resize-none"
                      placeholder="Inštrukcie pre domáci režim..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#8C857B] uppercase flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#3B82F6]" />
                      Ďalšia kontrola / Návšteva:
                    </label>
                    <textarea
                      rows={2}
                      value={sessionNextStep}
                      onChange={(e) => setSessionNextStep(e.target.value)}
                      className="w-full text-[11px] p-2 rounded-xl bg-white border border-[#E8E2D9] text-[#2C2A29] focus:outline-hidden resize-none"
                      placeholder="Kontrola o 14 dní..."
                    />
                  </div>
                </div>

                {/* Tlačidlá akcie */}
                <div className="flex items-center justify-between pt-2 border-t border-[#E8E2D9] flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('report')}
                    className="text-xs text-[#8C857B] hover:text-[#2C2A29] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Náhľad A4 reportu</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white border border-[#E8E2D9] hover:border-[#C5A059] text-xs font-bold text-[#2C2A29] shadow-2xs transition-all cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span className="hidden sm:inline">Tlačiť A4</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveSession}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#B38F46] hover:from-[#B38F46] hover:to-[#9E7B35] text-white text-xs font-bold shadow-md shadow-[#C5A059]/20 transition-all hover:scale-[1.02] cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Uložiť ošetrenie do karty</span>
                    </button>
                  </div>
                </div>

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

                  {/* 2D ⇄ 3D PREPÍNAČ PRE HISTÓRIU */}
                  <div className="flex items-center p-1 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setHistorySculptureMode('2d')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        historySculptureMode === '2d'
                          ? 'bg-[#2C2A29] text-white shadow-xs'
                          : 'text-[#8C857B] hover:text-[#2C2A29]'
                      }`}
                    >
                      <Layers className="w-3 h-3 text-[#C5A059]" />
                      <span>2D</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistorySculptureMode('3d')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        historySculptureMode === '3d'
                          ? 'bg-[#2C2A29] text-white shadow-xs'
                          : 'text-[#8C857B] hover:text-[#2C2A29]'
                      }`}
                    >
                      <Compass className="w-3 h-3 text-[#C5A059]" />
                      <span>3D</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Socha s presne označenými bodmi (2D / 3D) */}
              <div className="w-full max-w-3xl flex flex-col items-center">
                {historySculptureMode === '2d' ? (
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
                ) : (
                  <Sculpture3DViewer
                    vectors={selectedHistorySession.vectors || []}
                    onVectorsChange={() => {}}
                    activeTool="rotate"
                    onSelectTool={() => {}}
                    activeColor="#C5A059"
                    onSelectColor={() => {}}
                    readOnly={true}
                  />
                )}
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
                <div className="font-bold text-sm text-[#2C2A29]">{selectedDoctor}</div>
                <div className="text-[11px] text-[#8C857B]">Špecializácia: Plastická chirurgia & Estetická medicína</div>
                <div className="text-[11px] text-[#8C857B]">Pracovisko: SAY CLINIC Banská Bystrica</div>
              </div>
            </div>

            {/* 1. ČO BOLO APLIKOVANÉ / POLOŽKY VÝKONU */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C2A29] flex items-center gap-1.5 pb-1 border-b border-[#E8E2D9]">
                <span className="w-2 h-2 rounded-full bg-[#C5A059]" />
                1. Aplikované látky, minutý objem a zostatky:
              </h3>

              {lineItems.length > 0 ? (
                <div className="border border-[#E8E2D9] rounded-2xl overflow-hidden bg-white">
                  <div className="divide-y divide-[#E8E2D9]">
                    {lineItems.map((item, idx) => (
                      <div key={item.id || idx} className="p-3.5 flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="font-bold text-xs text-[#2C2A29] leading-snug">
                            • {item.title}
                          </div>
                          {item.totalVolume !== undefined && (
                            <div className="text-[10px] text-[#8C857B] flex items-center gap-2 flex-wrap">
                              <span>Minutý objem: <strong className="text-[#2C2A29]">{item.usedVolume ?? item.totalVolume} {item.unit || 'ml'}</strong> (z celkového balenia {item.totalVolume} {item.unit || 'ml'})</span>
                              {item.remainingVolume && item.remainingVolume > 0 && item.storeRemainingToDepot && (
                                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-bold">
                                  📦 Uskladnený zostatok pre klientku: {item.remainingVolume} {item.unit || 'ml'}
                                </span>
                              )}
                              {item.isFromDepot && (
                                <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 font-bold">
                                  ✓ Uplatnený zostatok zo skladu
                                </span>
                              )}
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
                <div className="font-bold text-[#2C2A29]">{selectedDoctor}</div>
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
                  <p className="text-[11px] text-[#8C857B]">Môžete upravovať ceny, vymazať nepotrebné šablóny (ikona koša 🗑️), pridať nové alebo ich aplikovať na tvár</p>
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
                    onContextMenu={(e) => handleOpenTemplateContextMenu(e, tpl)}
                    className="p-3.5 rounded-2xl border border-[#E8E2D9] hover:border-[#C5A059] bg-[#FAF8F5]/60 hover:bg-white transition-all flex items-start justify-between gap-3 group/row"
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
                        <button
                          type="button"
                          onClick={(e) => handleOpenTemplateContextMenu(e, tpl)}
                          className="p-1.5 rounded-lg text-[#8C857B] hover:text-[#C5A059] hover:bg-[#FAF8F5] cursor-pointer transition-colors"
                          title="Možnosti šablóny (pravý klik)"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAllTemplatesModal(false);
                            handleOpenEditTemplate(tpl);
                          }}
                          className="p-1.5 rounded-lg text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#FAF8F5] cursor-pointer transition-colors"
                          title={`Upraviť šablónu a body "${tpl.title}"`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(tpl.id)}
                          className="p-1.5 rounded-lg text-[#8C857B] hover:text-red-500 hover:bg-red-50 cursor-pointer transition-colors"
                          title={`Vymazať šablónu "${tpl.title}" z katalógu`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
                      placeholder="Napr. Restylane Lyft 1ml alebo Teosyal Redensity II"
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                <span>Preparát</span>
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
      {/* MODAL 3: ULOŽIŤ NÁKRES DO EXISTUJÚCEJ ALEBO NOVEJ ŠABLÓNY                 */}
      {/* ========================================================================= */}
      {showSaveCustomTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in print:hidden">
          <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-2xl max-w-md w-full p-6 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D9]">
              <div className="flex items-center gap-2">
                <BookmarkPlus className="w-5 h-5 text-[#C5A059]" />
                <h3 className="text-sm font-bold text-[#2C2A29]">Uložiť body do šablóny</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSaveCustomTemplateModal(false)}
                className="p-1 rounded-xl text-[#8C857B] hover:text-[#2C2A29] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Prepínač: Prepísať existujúcu vs Vytvoriť novú */}
            <div className="flex items-center p-1 bg-[#FAF8F5] rounded-xl border border-[#E8E2D9]">
              <button
                type="button"
                onClick={() => setSaveTemplateMode('update')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  saveTemplateMode === 'update'
                    ? 'bg-[#2C2A29] text-white shadow-2xs'
                    : 'text-[#8C857B] hover:text-[#2C2A29]'
                }`}
              >
                Prepísať existujúcu
              </button>
              <button
                type="button"
                onClick={() => setSaveTemplateMode('new')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  saveTemplateMode === 'new'
                    ? 'bg-[#2C2A29] text-white shadow-2xs'
                    : 'text-[#8C857B] hover:text-[#2C2A29]'
                }`}
              >
                Vytvoriť novú
              </button>
            </div>

            {saveTemplateMode === 'update' ? (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-[#8C857B] mb-1">Vyberte cieľovú šablónu:</label>
                  <select
                    value={selectedTemplateToOverwriteId || (lastActiveTemplateId || (templatesList[0]?.id ?? ''))}
                    onChange={(e) => setSelectedTemplateToOverwriteId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E8E2D9] bg-white font-bold text-[#2C2A29] focus:outline-hidden focus:border-[#C5A059] cursor-pointer"
                  >
                    {templatesList.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.title} ({t.vectors.length} pôvodných bodov, {t.price} €)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[11px] text-[#8C857B] space-y-1">
                  <div>
                    Do vybranej šablóny sa uloží aktuálnych <strong className="text-[#2C2A29]">{vectors.length}</strong> vyznačených bodov z tváre.
                  </div>
                  <div className="text-[10px] text-[#C5A059] font-medium">
                    Pôvodné body v šablóne budú nahradené týmto novým nákresom.
                  </div>
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
                    type="button"
                    onClick={() => {
                      const targetId = selectedTemplateToOverwriteId || lastActiveTemplateId || templatesList[0]?.id;
                      if (targetId) {
                        handleOverwriteTemplatePoints(targetId);
                        setShowSaveCustomTemplateModal(false);
                      }
                    }}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-[#2C2A29] hover:bg-[#C5A059] text-white shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Prepísať body v šablóne</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveCustomTemplate} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-[#8C857B] mb-1">Názov novej šablóny:</label>
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
                    Vytvoriť novú šablónu
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {currentPatient && (
        <ClientLoyaltyModal
          isOpen={showLoyaltyModal}
          onClose={() => setShowLoyaltyModal(false)}
          patientId={currentPatient.id}
          patientName={currentPatient.name}
          onLoyaltyUpdated={(updated) => {
            setLoyaltyVersion(v => v + 1);
            setDiscountType('percent');
            setDiscountValue(updated.tierDef.discountPercent);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: DETAILNÁ ÚPRAVA ŠABLÓNY A BODOV                                 */}
      {/* ========================================================================= */}
      {editingTemplate && editTemplateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in print:hidden">
          <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D9]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#C5A059]/15 flex items-center justify-center text-[#C5A059]">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2C2A29]">
                    Úprava šablóny: <span className="text-[#C5A059]">{editTemplateForm.title}</span>
                  </h3>
                  <p className="text-[11px] text-[#8C857B]">
                    Zmeňte názov, lekára, preparát, cenu, predvolené objemy alebo aplikačné body
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingTemplate(null);
                  setEditTemplateForm(null);
                }}
                className="p-1 rounded-xl text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#FAF8F5] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulár */}
            <form onSubmit={handleSaveEditedTemplate} className="space-y-4 overflow-y-auto flex-1 pr-1 text-xs">
              
              {/* Názov a Kategória */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#8C857B] mb-1">Názov šablóny:</label>
                  <input
                    type="text"
                    required
                    value={editTemplateForm.title}
                    onChange={(e) => setEditTemplateForm(prev => prev ? ({ ...prev, title: e.target.value }) : null)}
                    className="w-full p-2.5 bg-white rounded-xl border border-[#E8E2D9] font-bold text-[#2C2A29] focus:outline-hidden focus:border-[#C5A059]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#8C857B] mb-1">Kategória:</label>
                  <select
                    value={editTemplateForm.category}
                    onChange={(e) => setEditTemplateForm(prev => prev ? ({ ...prev, category: e.target.value as any }) : null)}
                    className="w-full p-2.5 bg-white rounded-xl border border-[#E8E2D9] font-semibold text-[#2C2A29] cursor-pointer focus:outline-hidden focus:border-[#C5A059]"
                  >
                    <option value="filler">Výplň (Kyselina hyalurónová)</option>
                    <option value="botox">Botulotoxín</option>
                    <option value="pdrn">PDRN & Polynukleotidy</option>
                    <option value="meso">Bioremodelácia / Mezoterapia</option>
                    <option value="exosomes">Exozómy</option>
                    <option value="microneedling">Microneedling</option>
                    <option value="laser">CO2 Laser</option>
                    <option value="biostimulator">Biostimulátor kolagénu</option>
                  </select>
                </div>
              </div>

              {/* Lekár a Preparát */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#8C857B] mb-1">Ošetrujúci lekár:</label>
                  <select
                    value={editTemplateForm.doctor}
                    onChange={(e) => setEditTemplateForm(prev => prev ? ({ ...prev, doctor: e.target.value }) : null)}
                    className="w-full p-2.5 bg-white rounded-xl border border-[#E8E2D9] font-semibold text-[#2C2A29] cursor-pointer focus:outline-hidden focus:border-[#C5A059]"
                  >
                    <option value="all">Všetci lekári (spoločná šablóna)</option>
                    {AESTHETIC_DOCTORS.map(doc => (
                      <option key={doc} value={doc}>{doc}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#8C857B] mb-1">Preparát / Produkt:</label>
                  <input
                    type="text"
                    required
                    value={editTemplateForm.productName}
                    onChange={(e) => setEditTemplateForm(prev => prev ? ({ ...prev, productName: e.target.value }) : null)}
                    placeholder="Napr. Restylane Kysse 1 ml"
                    className="w-full p-2.5 bg-white rounded-xl border border-[#E8E2D9] font-semibold text-[#2C2A29] focus:outline-hidden focus:border-[#C5A059]"
                  />
                </div>
              </div>

              {/* Cena, Objemy a Jednotka */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-[#FAF8F5] rounded-2xl border border-[#E8E2D9]">
                <div>
                  <label className="block text-[10px] font-bold text-[#8C857B] mb-1">Cena (€):</label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    required
                    value={editTemplateForm.price}
                    onChange={(e) => setEditTemplateForm(prev => prev ? ({ ...prev, price: Number(e.target.value) || 0 }) : null)}
                    className="w-full p-2 bg-white rounded-xl border border-[#E8E2D9] font-bold font-mono text-[#2C2A29] text-right focus:outline-hidden focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#8C857B] mb-1">Celé balenie:</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={editTemplateForm.defaultTotalVolume}
                    onChange={(e) => setEditTemplateForm(prev => prev ? ({ ...prev, defaultTotalVolume: Number(e.target.value) || 0 }) : null)}
                    className="w-full p-2 bg-white rounded-xl border border-[#E8E2D9] font-bold font-mono text-[#2C2A29] text-right focus:outline-hidden focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#8C857B] mb-1">Predvolene minuté:</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={editTemplateForm.defaultUsedVolume}
                    onChange={(e) => setEditTemplateForm(prev => prev ? ({ ...prev, defaultUsedVolume: Number(e.target.value) || 0 }) : null)}
                    className="w-full p-2 bg-white rounded-xl border border-[#E8E2D9] font-bold font-mono text-[#2C2A29] text-right focus:outline-hidden focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#8C857B] mb-1">Jednotka:</label>
                  <select
                    value={editTemplateForm.defaultUnit}
                    onChange={(e) => setEditTemplateForm(prev => prev ? ({ ...prev, defaultUnit: e.target.value }) : null)}
                    className="w-full p-2 bg-white rounded-xl border border-[#E8E2D9] font-semibold text-[#2C2A29] cursor-pointer focus:outline-hidden focus:border-[#C5A059]"
                  >
                    <option value="ml">ml</option>
                    <option value="Speywood">Speywood</option>
                    <option value="IU">IU</option>
                    <option value="amp">ampulka</option>
                    <option value="sedenie">sedenie</option>
                  </select>
                </div>
              </div>

              {/* Farba a Typ aplikácie */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-[10px] font-bold text-[#8C857B] mb-1">Farba bodov šablóny:</label>
                  <div className="flex items-center gap-1.5 pt-1">
                    {['#3B82F6', '#EC4899', '#10B981', '#C5A059', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4'].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditTemplateForm(prev => prev ? ({ ...prev, color: c }) : null)}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-full cursor-pointer transition-all ${
                          editTemplateForm.color === c ? 'ring-2 ring-offset-2 ring-[#2C2A29] scale-110' : 'opacity-80 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#8C857B] mb-1">Typ aplikácie:</label>
                  <div className="flex items-center gap-2">
                    {[
                      { id: 'point', label: 'Bodový vpich' },
                      { id: 'fanning', label: 'Vejár (kanyla)' },
                      { id: 'threads', label: 'Lineárne vlákna' }
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setEditTemplateForm(prev => prev ? ({ ...prev, type: t.id as any }) : null)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          editTemplateForm.type === t.id
                            ? 'bg-[#2C2A29] text-white shadow-xs'
                            : 'bg-[#FAF8F5] text-[#8C857B] hover:text-[#2C2A29] border border-[#E8E2D9]'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Popis a aplikačné zóny */}
              <div>
                <label className="block text-[10px] font-bold text-[#8C857B] mb-1">Popis / Zóny aplikácie (pre klienta):</label>
                <input
                  type="text"
                  value={editTemplateForm.description}
                  onChange={(e) => setEditTemplateForm(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                  placeholder="Napr. m. corrugator a m. procerus, celkovo 50 Speywood U"
                  className="w-full p-2.5 bg-white rounded-xl border border-[#E8E2D9] text-xs font-medium focus:outline-hidden focus:border-[#C5A059]"
                />
              </div>

              {/* SEKCIA: APLIKAČNÉ BODY ŠABLÓNY */}
              <div className="p-3.5 rounded-2xl border border-[#E8E2D9] bg-[#FAF8F5]/60 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#C5A059]" />
                    <span className="font-bold text-xs text-[#2C2A29]">
                      Aplikačné body šablóny ({editTemplateForm.vectors.length}):
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const newPt: Vector2DItem = {
                          id: `tpl_pt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                          type: editTemplateForm.type,
                          view: 'front',
                          color: editTemplateForm.color,
                          startPoint: { x: 300, y: 280 },
                          zoneName: 'Nový bod',
                          productName: editTemplateForm.productName,
                          details: `${editTemplateForm.category === 'botox' ? '10 Speywood' : '0.05 ml'}`,
                          units: editTemplateForm.category === 'botox' ? 10 : 0.05,
                          unitsUnit: editTemplateForm.defaultUnit,
                          createdAt: '12:00'
                        };
                        setEditTemplateForm(prev => prev ? ({ ...prev, vectors: [...prev.vectors, newPt] }) : null);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-white hover:bg-gray-50 border border-[#E8E2D9] text-[#2C2A29] cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-[#C5A059]" />
                      <span>Pridať bod</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        // Spustenie priamej úpravy na soche tváre
                        const tplToEdit: AestheticTemplate = {
                          ...editingTemplate!,
                          ...editTemplateForm
                        };
                        setEditingTemplate(null);
                        setEditTemplateForm(null);
                        handleStartEditingTemplatePointsOnFace(tplToEdit);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-bold bg-[#2C2A29] hover:bg-[#C5A059] text-white cursor-pointer shadow-xs transition-colors"
                      title="Otvorí sochu tváre a umožní klikať priamo do tváre"
                    >
                      <Target className="w-3 h-3 text-[#C5A059]" />
                      <span>Upraviť body na soche tváre</span>
                    </button>
                  </div>
                </div>

                {/* Zoznam bodov */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {editTemplateForm.vectors.map((vec, vIdx) => (
                    <div
                      key={`edit-vec-${vec.id || vIdx}`}
                      className="p-2.5 rounded-xl border border-[#E8E2D9] bg-white text-xs flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span
                          style={{ backgroundColor: editTemplateForm.color }}
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                        />
                        <span className="font-mono font-bold text-[11px] text-[#8C857B] shrink-0">
                          #{vIdx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={vec.zoneName || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditTemplateForm(prev => {
                                if (!prev) return null;
                                const newVecs = [...prev.vectors];
                                newVecs[vIdx] = { ...newVecs[vIdx], zoneName: val };
                                return { ...prev, vectors: newVecs };
                              });
                            }}
                            placeholder="Názov zóny (napr. m. frontalis)"
                            className="w-full text-xs font-semibold text-[#2C2A29] bg-transparent focus:outline-hidden border-b border-transparent focus:border-[#C5A059]"
                          />
                          <div className="flex items-center gap-2 text-[10px] text-[#8C857B] mt-0.5">
                            <span className="uppercase font-mono font-bold px-1.5 py-0.2 rounded-md bg-[#FAF8F5] border border-[#E8E2D9]">
                              {vec.view === 'front' ? 'Čelný' : vec.view.includes('profile') ? 'Profil' : '3/4 pohľad'}
                            </span>
                            <span>{vec.type === 'fanning' ? 'Vejár' : vec.type === 'threads' ? 'Lineár' : 'Vpich'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1 bg-[#FAF8F5] px-2 py-1 rounded-xl border border-[#E8E2D9]">
                          <span className="text-[10px] text-[#8C857B]">Dávka:</span>
                          <input
                            type="number"
                            step={editTemplateForm.category === 'botox' ? '5' : '0.01'}
                            min="0"
                            value={vec.units ?? ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setEditTemplateForm(prev => {
                                if (!prev) return null;
                                const newVecs = [...prev.vectors];
                                newVecs[vIdx] = { 
                                  ...newVecs[vIdx], 
                                  units: val, 
                                  details: `${val} ${prev.defaultUnit}` 
                                };
                                return { ...prev, vectors: newVecs };
                              });
                            }}
                            className="w-12 text-xs font-bold font-mono text-[#2C2A29] bg-transparent focus:outline-hidden text-right"
                          />
                          <span className="text-[10px] font-bold text-[#8C857B]">{editTemplateForm.defaultUnit}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setEditTemplateForm(prev => {
                              if (!prev) return null;
                              return {
                                ...prev,
                                vectors: prev.vectors.filter((_, idx) => idx !== vIdx)
                              };
                            });
                          }}
                          className="p-1.5 rounded-lg text-[#8C857B] hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Odstrániť tento bod zo šablóny"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {editTemplateForm.vectors.length === 0 && (
                    <div className="p-3 text-center text-xs text-[#8C857B] bg-white rounded-xl border border-dashed border-[#E8E2D9]">
                      Šablóna zatiaľ nemá žiadne body. Kliknite na "Upraviť body na soche tváre" pre interaktívne nanesenie.
                    </div>
                  )}
                </div>
              </div>

              {/* Tlačidlá modálu */}
              <div className="flex items-center justify-between pt-3 border-t border-[#E8E2D9]">
                <button
                  type="button"
                  onClick={() => {
                    setEditingTemplate(null);
                    setEditTemplateForm(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8C857B] hover:bg-[#FAF8F5] cursor-pointer"
                >
                  Zrušiť
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#2C2A29] hover:bg-[#C5A059] text-white shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Uložiť zmeny v šablóne</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* KONTEXTOVÉ MENU PRE ŠABLÓNU (PRAVÝ KLIK)                                */}
      {/* ========================================================================= */}
      {templateContextMenu.isOpen && templateContextMenu.template && (
        <div
          className="fixed inset-0 z-50 bg-black/10 backdrop-blur-2xs"
          onClick={() => setTemplateContextMenu(prev => ({ ...prev, isOpen: false }))}
          onContextMenu={(e) => {
            e.preventDefault();
            setTemplateContextMenu(prev => ({ ...prev, isOpen: false }));
          }}
        >
          <div
            style={{
              position: 'fixed',
              left: templateContextMenu.x,
              top: templateContextMenu.y
            }}
            className="bg-[#2C2A29] text-white rounded-2xl border border-[#C5A059]/40 shadow-2xl py-1.5 min-w-[240px] text-xs font-semibold animate-in fade-in zoom-in-95 z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3.5 py-2 border-b border-white/10 flex items-center justify-between gap-2">
              <span className="font-bold text-[#C5A059] truncate max-w-[180px]">
                {templateContextMenu.template.title}
              </span>
              <span
                style={{ backgroundColor: templateContextMenu.template.color }}
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
              />
            </div>

            {/* PRIAME ULOŽENIE BODOV Z TVÁRE DO TEJTO ŠABLÓNY */}
            {vectors.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const tpl = templateContextMenu.template;
                  setTemplateContextMenu(prev => ({ ...prev, isOpen: false }));
                  if (tpl) handleOverwriteTemplatePoints(tpl.id);
                }}
                className="w-full px-3.5 py-2.5 text-left bg-[#C5A059]/15 hover:bg-[#C5A059]/30 text-[#E8C882] flex items-center gap-2.5 cursor-pointer transition-colors font-bold border-b border-white/10"
              >
                <Save className="w-4 h-4 text-[#C5A059] shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white">Uložiť body z tváre do tejto šablóny</div>
                  <div className="text-[10px] text-[#C5A059] font-normal">Prepíše body šablóny aktuálnym nákresom ({vectors.length} bodov)</div>
                </div>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                const tpl = templateContextMenu.template;
                setTemplateContextMenu(prev => ({ ...prev, isOpen: false }));
                if (tpl) handleOpenEditTemplate(tpl);
              }}
              className="w-full px-3.5 py-2 text-left hover:bg-white/10 flex items-center gap-2.5 cursor-pointer transition-colors text-gray-200 hover:text-white"
            >
              <Pencil className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Upraviť šablónu & parametre</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const tpl = templateContextMenu.template;
                setTemplateContextMenu(prev => ({ ...prev, isOpen: false }));
                if (tpl) handleStartEditingTemplatePointsOnFace(tpl);
              }}
              className="w-full px-3.5 py-2 text-left hover:bg-white/10 flex items-center gap-2.5 cursor-pointer transition-colors text-gray-200 hover:text-white"
            >
              <Target className="w-3.5 h-3.5 text-blue-400" />
              <span>Upraviť body na soche tváre</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const tpl = templateContextMenu.template;
                setTemplateContextMenu(prev => ({ ...prev, isOpen: false }));
                if (tpl) handleDuplicateTemplate(tpl);
              }}
              className="w-full px-3.5 py-2 text-left hover:bg-white/10 flex items-center gap-2.5 cursor-pointer transition-colors text-gray-200 hover:text-white"
            >
              <Copy className="w-3.5 h-3.5 text-emerald-400" />
              <span>Duplikovať šablónu</span>
            </button>

            <div className="my-1 border-t border-white/10" />

            <button
              type="button"
              onClick={() => {
                const tpl = templateContextMenu.template;
                setTemplateContextMenu(prev => ({ ...prev, isOpen: false }));
                if (tpl) handleDeleteTemplate(tpl.id);
              }}
              className="w-full px-3.5 py-2 text-left hover:bg-red-500/20 text-red-400 hover:text-red-300 flex items-center gap-2.5 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Vymazať šablónu</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
