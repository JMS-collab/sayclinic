'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FolderKanban,
  ListTodo,
  Plus,
  Clock,
  Users,
  Paperclip,
  ExternalLink,
  Trash2,
  Search,
  Filter,
  CheckSquare,
  Square,
  MessageSquare,
  Send,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Shield,
  Briefcase,
  X,
  Flame,
  GripVertical,
  CheckCircle2
} from 'lucide-react';
import { UserAccount, SAY_CLINIC_USERS } from './LoginForm';
import { LiquidAvatar } from './LiquidAvatar';

export type ProjectCategory = 'operativa' | 'manazment' | 'sklad' | 'marketing' | 'legislativa' | 'ostatne';
export type ProjectStatus = 'planning' | 'in_progress' | 'review' | 'completed' | 'on_hold';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ProjectAttachment {
  id: string;
  name: string;
  type: 'file' | 'link';
  url: string; // Data URL or external link
  size?: string;
  fileType?: string;
  uploadedAt: string;
  uploadedByName: string;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  assignedToId: string;
  assignedToName: string;
  assignedToRole: string;
  createdById: string;
  createdByName: string;
  deadline?: string;
  completed: boolean;
  priority: ProjectPriority;
  completedAt?: string;
  attachments?: ProjectAttachment[];
}

export interface ProjectComment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  text: string;
  timestamp: string;
}

export interface Project {
  id: string;
  title: string;
  category: ProjectCategory;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  leadId: string;
  leadName: string;
  assigneeIds: string[];
  deadline: string;
  startDate: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  budget?: number;
  attachments: ProjectAttachment[];
  tasks: ProjectTask[];
  comments: ProjectComment[];
}

const CATEGORY_CONFIG: Record<ProjectCategory, { label: string; color: string; bg: string; border: string }> = {
  operativa: { label: 'Operatíva & Medicína', color: 'text-sky-800', bg: 'bg-sky-50', border: 'border-sky-200' },
  manazment: { label: 'Manažment & Recepcia', color: 'text-[#8A6827]', bg: 'bg-[#FAF4E9]', border: 'border-[#E6D4B2]' },
  sklad: { label: 'Sklad & Materiál', color: 'text-emerald-800', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  marketing: { label: 'Marketing & Klienti', color: 'text-purple-800', bg: 'bg-purple-50', border: 'border-purple-200' },
  legislativa: { label: 'Legislatíva & Hygiena', color: 'text-amber-800', bg: 'bg-amber-50', border: 'border-amber-200' },
  ostatne: { label: 'Ostatné', color: 'text-stone-700', bg: 'bg-stone-100', border: 'border-stone-200' },
};

const STATUS_CONFIG: Record<ProjectStatus, { label: string; shortLabel: string; subtitle: string; dot: string; badge: string }> = {
  planning: { 
    label: 'Nové (Plánovanie)', 
    shortLabel: 'Nové', 
    subtitle: 'Nové úlohy & plánovanie', 
    dot: 'bg-slate-400', 
    badge: 'bg-slate-100 text-slate-700 border-slate-200' 
  },
  in_progress: { 
    label: 'Rozpracované', 
    shortLabel: 'Rozpracované', 
    subtitle: 'Aktívne prebiehajúce', 
    dot: 'bg-blue-500', 
    badge: 'bg-blue-50 text-blue-700 border-blue-200' 
  },
  review: { 
    label: 'Na kontrolu CEO', 
    shortLabel: 'Kontrola CEO', 
    subtitle: 'Čaká na revíziu vedenia', 
    dot: 'bg-amber-500', 
    badge: 'bg-amber-50 text-amber-800 border-amber-200 font-semibold' 
  },
  completed: { 
    label: 'Hotové', 
    shortLabel: 'Hotové', 
    subtitle: 'Úspešne dokončené', 
    dot: 'bg-emerald-500', 
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' 
  },
  on_hold: { 
    label: 'Pozastavené', 
    shortLabel: 'Pozastavené', 
    subtitle: 'Dočasne odložené', 
    dot: 'bg-rose-400', 
    badge: 'bg-rose-50 text-rose-700 border-rose-200' 
  },
};

const PRIORITY_CONFIG: Record<ProjectPriority, { label: string; badge: string; icon?: boolean }> = {
  low: { label: 'Nízka', badge: 'bg-gray-100 text-gray-600 border-gray-200' },
  medium: { label: 'Stredná', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  high: { label: 'Vysoká', badge: 'bg-amber-100 text-amber-800 border-amber-300' },
  urgent: { label: 'Kritická', badge: 'bg-rose-100 text-rose-800 border-rose-300 font-bold', icon: true },
};

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'PRJ-1',
    title: 'Otvorenie 2. dennej operačnej sály (Plastika & Zákroky)',
    category: 'operativa',
    description: 'Kompletné vybavenie a kolaudácia sály B pre jednodňovú chirurgiu a liposukcie. Zabezpečiť certifikácie odsávačiek, sterilizačný denník a dodávku nového operačného stola Maquet.',
    status: 'in_progress',
    priority: 'urgent',
    leadId: 'u1',
    leadName: 'MUDr. Ján Mráz',
    assigneeIds: ['u1', 'u4', 'u7'],
    deadline: '2026-10-15',
    startDate: '2026-08-15',
    createdById: 'u1',
    createdByName: 'MUDr. Ján Mráz (CEO)',
    createdAt: '2026-08-15T09:00:00.000Z',
    updatedAt: '2026-09-02T14:30:00.000Z',
    budget: 35000,
    attachments: [
      {
        id: 'att-1',
        name: 'Hygienicky_standard_RUVZ_2026.pdf',
        type: 'file',
        url: '#sample-doc',
        size: '2.4 MB',
        fileType: 'application/pdf',
        uploadedAt: '2026-08-18',
        uploadedByName: 'Ing. Barbara Mecerodová, MBA',
      },
      {
        id: 'att-2',
        name: 'Specifikacia_operacneho_stola_Maquet.pdf',
        type: 'file',
        url: '#sample-doc',
        size: '1.1 MB',
        fileType: 'application/pdf',
        uploadedAt: '2026-08-20',
        uploadedByName: 'Sabina Lenhartová',
      },
      {
        id: 'att-3',
        name: 'Google Drive - Architektonický plán sály B',
        type: 'link',
        url: 'https://drive.google.com/drive/folders/sayclinic-sala-b',
        uploadedAt: '2026-08-21',
        uploadedByName: 'MUDr. Ján Mráz',
      },
    ],
    tasks: [
      {
        id: 'tsk-101',
        projectId: 'PRJ-1',
        title: 'Kontrola sterility a validácia autoklávu Melag',
        description: 'Vykonať Bowie-Dick test a zapísať do protokolu o sterilizácii.',
        assignedToId: 'u7',
        assignedToName: 'Sabina Lenhartová',
        assignedToRole: 'nurse',
        createdById: 'u1',
        createdByName: 'MUDr. Ján Mráz',
        deadline: '2026-09-08',
        completed: true,
        priority: 'high',
        completedAt: '2026-09-01',
      },
      {
        id: 'tsk-102',
        projectId: 'PRJ-1',
        title: 'Objednávka kompresných pásov a sady kanyly Vaser',
        description: 'Zabezpečiť 10 ks kompresných odevov Lipoelastic veľkosť S, M, L.',
        assignedToId: 'u4',
        assignedToName: 'Ing. Barbara Mecerodová, MBA',
        assignedToRole: 'manager',
        createdById: 'u1',
        createdByName: 'MUDr. Ján Mráz',
        deadline: '2026-09-14',
        completed: false,
        priority: 'urgent',
      },
      {
        id: 'tsk-103',
        projectId: 'PRJ-1',
        title: 'Dohodnúť zmluvu o likvidácii biologického odpadu s OLO',
        description: 'Pripraviť dodatok pre novú sálu a harmonogram odvozov.',
        assignedToId: 'u4',
        assignedToName: 'Ing. Barbara Mecerodová, MBA',
        assignedToRole: 'manager',
        createdById: 'u1',
        createdByName: 'MUDr. Ján Mráz',
        deadline: '2026-09-20',
        completed: false,
        priority: 'medium',
      },
      {
        id: 'tsk-104',
        projectId: 'PRJ-1',
        title: 'Finálna inšpekcia hygieny a povolenie na prevádzku RÚVZ',
        description: 'Pripraviť kompletné protokoly na podpis.',
        assignedToId: 'u1',
        assignedToName: 'MUDr. Ján Mráz',
        assignedToRole: 'ceo',
        createdById: 'u1',
        createdByName: 'MUDr. Ján Mráz',
        deadline: '2026-10-01',
        completed: false,
        priority: 'high',
      },
    ],
    comments: [
      {
        id: 'c-1',
        authorId: 'u1',
        authorName: 'MUDr. Ján Mráz',
        authorRole: 'CEO',
        text: 'Barbara a Sabina, priorita číslo 1 pre september. Termín otvorenia je pevný pre naplánované operácie v októbri.',
        timestamp: '2026-08-15 10:15',
      },
      {
        id: 'c-2',
        authorId: 'u4',
        authorName: 'Ing. Barbara Mecerodová, MBA',
        authorRole: 'Manažment',
        text: 'Autokláv a testy prebehli v poriadku. Dodávka stola Maquet je potvrdená na 25. septembra.',
        timestamp: '2026-09-02 11:40',
      },
    ],
  },
  {
    id: 'PRJ-2',
    title: 'Zavedenie nového protokolu pre Dermálne výplne & Botox',
    category: 'operativa',
    description: 'Štandardizácia digitálneho informovaného súhlasu cez iPad pre klientky pred aplikáciou kyseliny hyalurónovej. Tlač poučení po zákroku a nastavenie kontrolných SMS po 14 dňoch.',
    status: 'review',
    priority: 'high',
    leadId: 'u1',
    leadName: 'MUDr. Ján Mráz',
    assigneeIds: ['u5', 'u6', 'u2'],
    deadline: '2026-09-25',
    startDate: '2026-08-25',
    createdById: 'u1',
    createdByName: 'MUDr. Ján Mráz (CEO)',
    createdAt: '2026-08-25T11:00:00.000Z',
    updatedAt: '2026-09-03T08:00:00.000Z',
    attachments: [
      {
        id: 'att-4',
        name: 'Vzor_suhlas_Kyselina_Hyaluronova_2026.pdf',
        type: 'file',
        url: '#sample-doc',
        size: '850 KB',
        fileType: 'application/pdf',
        uploadedAt: '2026-08-28',
        uploadedByName: 'Mgr. Elena Solivajsová',
      },
    ],
    tasks: [
      {
        id: 'tsk-201',
        projectId: 'PRJ-2',
        title: 'Nahrať nové vzory informovaných súhlasov do systému',
        assignedToId: 'u5',
        assignedToName: 'Mgr. Elena Solivajsová',
        assignedToRole: 'manager',
        createdById: 'u1',
        createdByName: 'MUDr. Ján Mráz',
        deadline: '2026-09-01',
        completed: true,
        priority: 'high',
        completedAt: '2026-08-30',
      },
      {
        id: 'tsk-202',
        projectId: 'PRJ-2',
        title: 'Nastavenie zásobníkov a chladničky na botulotoxíny (Dysport / Botox)',
        assignedToId: 'u6',
        assignedToName: 'Ema Foltáni',
        assignedToRole: 'nurse',
        createdById: 'u1',
        createdByName: 'MUDr. Ján Mráz',
        deadline: '2026-09-05',
        completed: true,
        priority: 'medium',
        completedAt: '2026-09-02',
      },
      {
        id: 'tsk-203',
        projectId: 'PRJ-2',
        title: 'Kontrola šablóny automatických SMS pripomienok na kontrolu po 14 dňoch',
        assignedToId: 'u5',
        assignedToName: 'Mgr. Elena Solivajsová',
        assignedToRole: 'manager',
        createdById: 'u1',
        createdByName: 'MUDr. Ján Mráz',
        deadline: '2026-09-15',
        completed: false,
        priority: 'high',
      },
    ],
    comments: [
      {
        id: 'c-3',
        authorId: 'u5',
        authorName: 'Mgr. Elena Solivajsová',
        authorRole: 'Manažment',
        text: 'Pripravila som šablónu súhlasov, čaká na finálne prečítanie pánom doktorom.',
        timestamp: '2026-09-01 16:20',
      },
    ],
  },
  {
    id: 'PRJ-3',
    title: 'Jesenná kampaň Dermokozmetiky & Bezpečné skladové zásoby',
    category: 'marketing',
    description: 'Objednávka nového radu SPF krémov a regeneračných sér po laserových a chirurgických zákrokoch. Príprava uvítacích balíčkov pre pacientky po operácii.',
    status: 'in_progress',
    priority: 'medium',
    leadId: 'u4',
    leadName: 'Ing. Barbara Mecerodová, MBA',
    assigneeIds: ['u4', 'u5', 'u6'],
    deadline: '2026-09-30',
    startDate: '2026-09-01',
    createdById: 'u1',
    createdByName: 'MUDr. Ján Mráz (CEO)',
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-03T09:10:00.000Z',
    attachments: [
      {
        id: 'att-5',
        name: 'Google Sheets - Cenník a marže Medik8_SkinCeuticals.xlsx',
        type: 'link',
        url: 'https://docs.google.com/spreadsheets/d/sayclinic-dermokozmetika',
        uploadedAt: '2026-09-02',
        uploadedByName: 'Ing. Barbara Mecerodová, MBA',
      },
    ],
    tasks: [
      {
        id: 'tsk-301',
        projectId: 'PRJ-3',
        title: 'Inventúra aktuálneho zostatku kozmetiky na predajni',
        assignedToId: 'u6',
        assignedToName: 'Ema Foltáni',
        assignedToRole: 'nurse',
        createdById: 'u4',
        createdByName: 'Ing. Barbara Mecerodová, MBA',
        deadline: '2026-09-06',
        completed: true,
        priority: 'medium',
        completedAt: '2026-09-02',
      },
      {
        id: 'tsk-302',
        projectId: 'PRJ-3',
        title: 'Cenová ponuka a dohodnutie zľavy od distribútora',
        assignedToId: 'u4',
        assignedToName: 'Ing. Barbara Mecerodová, MBA',
        assignedToRole: 'manager',
        createdById: 'u4',
        createdByName: 'Ing. Barbara Mecerodová, MBA',
        deadline: '2026-09-18',
        completed: false,
        priority: 'high',
      },
      {
        id: 'tsk-303',
        projectId: 'PRJ-3',
        title: 'Príprava darčekových tašiek SAY CLINIC pre VIP pacientov',
        assignedToId: 'u5',
        assignedToName: 'Mgr. Elena Solivajsová',
        assignedToRole: 'manager',
        createdById: 'u4',
        createdByName: 'Ing. Barbara Mecerodová, MBA',
        deadline: '2026-09-28',
        completed: false,
        priority: 'low',
      },
    ],
    comments: [],
  },
  {
    id: 'PRJ-4',
    title: 'Audit predoperačných vyšetrení a internistických konzílií',
    category: 'legislativa',
    description: 'Aktualizácia kontrolného checklistu pre sestry pred celkovou anestéziou. Zabezpečiť rýchlejší príjem výsledkov krvi a EKG od spádových internistov.',
    status: 'planning',
    priority: 'high',
    leadId: 'u1',
    leadName: 'MUDr. Ján Mráz',
    assigneeIds: ['u7', 'u1'],
    deadline: '2026-10-10',
    startDate: '2026-09-03',
    createdById: 'u1',
    createdByName: 'MUDr. Ján Mráz (CEO)',
    createdAt: '2026-09-03T08:00:00.000Z',
    updatedAt: '2026-09-03T08:00:00.000Z',
    attachments: [],
    tasks: [
      {
        id: 'tsk-401',
        projectId: 'PRJ-4',
        title: 'Vytvoriť checklist 10 kľúčových bodov pre anesteziológa',
        assignedToId: 'u7',
        assignedToName: 'Sabina Lenhartová',
        assignedToRole: 'nurse',
        createdById: 'u1',
        createdByName: 'MUDr. Ján Mráz',
        deadline: '2026-10-02',
        completed: false,
        priority: 'high',
      },
      {
        id: 'tsk-402',
        projectId: 'PRJ-4',
        title: 'Podpísať zmluvu s laboratóriom Medirex na statimové odbery',
        assignedToId: 'u1',
        assignedToName: 'MUDr. Ján Mráz',
        assignedToRole: 'ceo',
        createdById: 'u1',
        createdByName: 'MUDr. Ján Mráz',
        deadline: '2026-10-08',
        completed: false,
        priority: 'urgent',
      },
    ],
    comments: [],
  },
];

interface ProjectManagementProps {
  currentUser: UserAccount;
  onConvertNoteToProject?: (title: string) => void;
}

export default function ProjectManagement({ currentUser }: ProjectManagementProps) {
  // Persistence in localStorage
  const [projects, setProjects] = useState<Project[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('say_clinic_projects');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Chyba načítania projektov:', e);
        }
      }
    }
    return INITIAL_PROJECTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('say_clinic_projects', JSON.stringify(projects));
    } catch (e) {
      console.error('Chyba ukladania projektov:', e);
    }
  }, [projects]);

  // Is CEO permission check
  const isCeo = currentUser.role === 'ceo' || currentUser.email === 'mraz@sayclinic.sk' || currentUser.id === 'u1';

  // Filters and views
  const [activeView, setActiveView] = useState<'kanban' | 'list' | 'team'>('kanban');
  const [filterRole, setFilterRole] = useState<'all' | 'my' | 'managers' | 'nurses' | 'urgent'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Active selected project for detail drawer
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);

  // New project form state
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectCategory, setNewProjectCategory] = useState<ProjectCategory>('operativa');
  const [newProjectPriority, setNewProjectPriority] = useState<ProjectPriority>('medium');
  const [newProjectLeadId, setNewProjectLeadId] = useState(currentUser.id);
  const [newProjectAssignees, setNewProjectAssignees] = useState<string[]>([currentUser.id]);
  const [newProjectDeadline, setNewProjectDeadline] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectBudget, setNewProjectBudget] = useState<string>('');

  // Initial task in project modal
  const [initialTaskTitle, setInitialTaskTitle] = useState('');
  const [initialTaskAssignee, setInitialTaskAssignee] = useState('u4');

  // New task standalone form state
  const [taskModalProjectId, setTaskModalProjectId] = useState<string>('');
  const [taskModalTitle, setTaskModalTitle] = useState('');
  const [taskModalAssigneeId, setTaskModalAssigneeId] = useState('u4');
  const [taskModalDeadline, setTaskModalDeadline] = useState('');
  const [taskModalPriority, setTaskModalPriority] = useState<ProjectPriority>('medium');
  const [taskModalDescription, setTaskModalDescription] = useState('');

  // Attachment adding state in project drawer
  const [attachmentMode, setAttachmentMode] = useState<'file' | 'link'>('file');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Comment input state
  const [newCommentText, setNewCommentText] = useState('');

  // Drag and Drop state for Kanban board
  const [draggingProjectId, setDraggingProjectId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<ProjectStatus | null>(null);
  const [justDragged, setJustDragged] = useState(false);
  const [dragToast, setDragToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Synchronize selectedProject when projects change
  useEffect(() => {
    if (selectedProject) {
      const updated = projects.find((p) => p.id === selectedProject.id);
      if (updated) setSelectedProject(updated);
    }
  }, [projects]);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalProjects = projects.length;
    let inProgressCount = 0;
    let reviewCount = 0;
    let completedCount = 0;
    let totalTasks = 0;
    let completedTasks = 0;
    let myTasksCount = 0;
    let urgentCount = 0;

    projects.forEach((p) => {
      if (p.status === 'in_progress') inProgressCount++;
      if (p.status === 'review') reviewCount++;
      if (p.status === 'completed') completedCount++;
      if (p.priority === 'urgent' && p.status !== 'completed') urgentCount++;

      p.tasks.forEach((t) => {
        totalTasks++;
        if (t.completed) completedTasks++;
        if (t.assignedToId === currentUser.id && !t.completed) myTasksCount++;
      });
    });

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalProjects,
      inProgressCount,
      reviewCount,
      completedCount,
      totalTasks,
      completedTasks,
      myTasksCount,
      urgentCount,
      completionRate,
    };
  }, [projects, currentUser.id]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // Category search
      if (categoryFilter !== 'all' && project.category !== categoryFilter) {
        return false;
      }

      // Role filter
      if (filterRole === 'my') {
        const isAssigned = project.assigneeIds.includes(currentUser.id) || project.leadId === currentUser.id;
        const hasMyTask = project.tasks.some((t) => t.assignedToId === currentUser.id);
        if (!isAssigned && !hasMyTask) return false;
      } else if (filterRole === 'managers') {
        // assigned to managers (u4 Barbara, u5 Elena)
        const hasManager = project.assigneeIds.some((id) => {
          const user = SAY_CLINIC_USERS.find((u) => u.id === id);
          return user?.role === 'manager';
        });
        if (!hasManager) return false;
      } else if (filterRole === 'nurses') {
        // assigned to nurses (u6 Ema, u7 Sabina)
        const hasNurse = project.assigneeIds.some((id) => {
          const user = SAY_CLINIC_USERS.find((u) => u.id === id);
          return user?.role === 'nurse';
        });
        if (!hasNurse) return false;
      } else if (filterRole === 'urgent') {
        if (project.priority !== 'urgent' && !project.tasks.some((t) => t.priority === 'urgent' && !t.completed)) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = project.title.toLowerCase().includes(q);
        const matchesDesc = project.description.toLowerCase().includes(q);
        const matchesLead = project.leadName.toLowerCase().includes(q);
        const matchesTasks = project.tasks.some((t) => t.title.toLowerCase().includes(q) || t.assignedToName.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesLead && !matchesTasks) return false;
      }

      return true;
    });
  }, [projects, categoryFilter, filterRole, searchQuery, currentUser.id]);

  // Handlers for Project CRUD
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle.trim()) return;

    const leadUser = SAY_CLINIC_USERS.find((u) => u.id === newProjectLeadId);

    const initialTasksList: ProjectTask[] = [];
    if (initialTaskTitle.trim()) {
      const assignedUser = SAY_CLINIC_USERS.find((u) => u.id === initialTaskAssignee);
      initialTasksList.push({
        id: `tsk-${Date.now()}-1`,
        projectId: `PRJ-${Date.now()}`,
        title: initialTaskTitle.trim(),
        assignedToId: initialTaskAssignee,
        assignedToName: assignedUser?.name || 'Klinický tím',
        assignedToRole: assignedUser?.role || 'staff',
        createdById: currentUser.id,
        createdByName: currentUser.name,
        completed: false,
        priority: newProjectPriority,
        deadline: newProjectDeadline,
      });
    }

    const newProject: Project = {
      id: `PRJ-${Date.now()}`,
      title: newProjectTitle.trim(),
      category: newProjectCategory,
      description: newProjectDescription.trim() || 'Bez doplňujúceho popisu.',
      status: 'planning',
      priority: newProjectPriority,
      leadId: newProjectLeadId,
      leadName: leadUser?.name || currentUser.name,
      assigneeIds: newProjectAssignees.length > 0 ? newProjectAssignees : [currentUser.id],
      deadline: newProjectDeadline || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      startDate: new Date().toISOString().split('T')[0],
      createdById: currentUser.id,
      createdByName: `${currentUser.name} (${isCeo ? 'CEO' : currentUser.title})`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      budget: newProjectBudget ? parseFloat(newProjectBudget) : undefined,
      attachments: [],
      tasks: initialTasksList,
      comments: [
        {
          id: `c-${Date.now()}`,
          authorId: currentUser.id,
          authorName: currentUser.name,
          authorRole: isCeo ? 'CEO & Zakladateľ' : currentUser.title,
          text: `Projekt bol vytvorený. Cieľový termín: ${newProjectDeadline || 'do 14 dní'}.`,
          timestamp: new Date().toLocaleDateString('sk-SK') + ' ' + new Date().toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    };

    setProjects((prev) => [newProject, ...prev]);
    setIsCreateModalOpen(false);

    // Reset form
    setNewProjectTitle('');
    setNewProjectDescription('');
    setNewProjectDeadline('');
    setNewProjectBudget('');
    setInitialTaskTitle('');
    setSelectedProject(newProject);
  };

  const handleUpdateProjectStatus = (projectId: string, newStatus: ProjectStatus) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const updated = {
            ...p,
            status: newStatus,
            updatedAt: new Date().toISOString(),
            comments: [
              ...p.comments,
              {
                id: `c-${Date.now()}`,
                authorId: currentUser.id,
                authorName: currentUser.name,
                authorRole: isCeo ? 'CEO' : currentUser.title,
                text: `Zmena stavu projektu na: "${STATUS_CONFIG[newStatus].label}"`,
                timestamp: new Date().toLocaleDateString('sk-SK') + ' ' + new Date().toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' }),
              },
            ],
          };
          if (selectedProject?.id === projectId) {
            setSelectedProject(updated);
          }
          return updated;
        }
        return p;
      })
    );
  };

  const handleMoveProjectStatus = (projectId: string, targetStatus: ProjectStatus) => {
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) return;
    if (proj.status === targetStatus) return;

    handleUpdateProjectStatus(projectId, targetStatus);

    const titleTruncated = proj.title.length > 36 ? proj.title.slice(0, 36) + '...' : proj.title;
    setDragToast({
      message: `Projekt „${titleTruncated}“ presunutý do: ${STATUS_CONFIG[targetStatus].shortLabel}`,
      type: 'success',
    });
    setTimeout(() => {
      setDragToast(null);
    }, 3500);
  };

  const handleDeleteProject = (projectId: string) => {
    if (!confirm('Naozaj si želáte natrvalo vymazať tento projekt a všetky jeho úlohy?')) return;
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    if (selectedProject?.id === projectId) setSelectedProject(null);
  };

  // Toggle Task Completion
  const handleToggleTask = (projectId: string, taskId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const updatedTasks = p.tasks.map((t) => {
            if (t.id === taskId) {
              const willBeCompleted = !t.completed;
              return {
                ...t,
                completed: willBeCompleted,
                completedAt: willBeCompleted ? new Date().toISOString().split('T')[0] : undefined,
              };
            }
            return t;
          });

          // Check if all tasks completed -> optionally change status
          const allDone = updatedTasks.length > 0 && updatedTasks.every((t) => t.completed);

          return {
            ...p,
            status: allDone && p.status !== 'completed' ? 'review' : p.status,
            tasks: updatedTasks,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );
  };

  // Add Task directly to a project
  const handleAddTaskToProject = (e: React.FormEvent) => {
    e.preventDefault();
    const targetProjId = selectedProject ? selectedProject.id : taskModalProjectId;
    if (!targetProjId || !taskModalTitle.trim()) return;

    const assignedUser = SAY_CLINIC_USERS.find((u) => u.id === taskModalAssigneeId);

    const newTask: ProjectTask = {
      id: `tsk-${Date.now()}`,
      projectId: targetProjId,
      title: taskModalTitle.trim(),
      description: taskModalDescription.trim() || undefined,
      assignedToId: taskModalAssigneeId,
      assignedToName: assignedUser?.name || 'Personál',
      assignedToRole: assignedUser?.role || 'staff',
      createdById: currentUser.id,
      createdByName: currentUser.name,
      deadline: taskModalDeadline || undefined,
      completed: false,
      priority: taskModalPriority,
    };

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === targetProjId) {
          // ensure assignee is added to project assignees if not already
          const newAssignees = p.assigneeIds.includes(taskModalAssigneeId) ? p.assigneeIds : [...p.assigneeIds, taskModalAssigneeId];
          return {
            ...p,
            assigneeIds: newAssignees,
            tasks: [newTask, ...p.tasks],
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );

    // Reset task form
    setTaskModalTitle('');
    setTaskModalDescription('');
    setTaskModalDeadline('');
    setIsCreateTaskModalOpen(false);
  };

  // Delete Task
  const handleDeleteTask = (projectId: string, taskId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          return {
            ...p,
            tasks: p.tasks.filter((t) => t.id !== taskId),
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );
  };

  // Attachments Handling
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedProject || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const sizeKb = (file.size / 1024).toFixed(0) + ' KB';

      const newAtt: ProjectAttachment = {
        id: `att-${Date.now()}`,
        name: file.name,
        type: 'file',
        url: dataUrl,
        size: sizeKb,
        fileType: file.type,
        uploadedAt: new Date().toISOString().split('T')[0],
        uploadedByName: currentUser.name,
      };

      setProjects((prev) =>
        prev.map((p) => {
          if (p.id === selectedProject.id) {
            return {
              ...p,
              attachments: [newAtt, ...p.attachments],
              updatedAt: new Date().toISOString(),
            };
          }
          return p;
        })
      );
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddLinkAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !linkUrl.trim()) return;

    let validUrl = linkUrl.trim();
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = 'https://' + validUrl;
    }

    const newAtt: ProjectAttachment = {
      id: `att-${Date.now()}`,
      name: linkTitle.trim() || validUrl,
      type: 'link',
      url: validUrl,
      uploadedAt: new Date().toISOString().split('T')[0],
      uploadedByName: currentUser.name,
    };

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === selectedProject.id) {
          return {
            ...p,
            attachments: [newAtt, ...p.attachments],
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );

    setLinkTitle('');
    setLinkUrl('');
  };

  const handleDeleteAttachment = (projectId: string, attId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          return {
            ...p,
            attachments: p.attachments.filter((a) => a.id !== attId),
          };
        }
        return p;
      })
    );
  };

  // Comments Handling
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newCommentText.trim()) return;

    const comment: ProjectComment = {
      id: `c-${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: isCeo ? 'CEO & Zakladateľ' : currentUser.title,
      text: newCommentText.trim(),
      timestamp: new Date().toLocaleDateString('sk-SK') + ' ' + new Date().toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' }),
    };

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === selectedProject.id) {
          return {
            ...p,
            comments: [...p.comments, comment],
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );

    setNewCommentText('');
  };

  // Helper to compute progress
  const getProjectProgress = (p: Project) => {
    if (p.tasks.length === 0) return p.status === 'completed' ? 100 : 0;
    const done = p.tasks.filter((t) => t.completed).length;
    return Math.round((done / p.tasks.length) * 100);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. CEO HEADER & STRATEGIC COMMAND BAR */}
      <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-gradient-to-r from-white via-white to-[#FBF9F6]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-[#C5A059] tracking-widest flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#C5A059]" /> SAY CLINIC • EXECUTIVE PROJECT MANAGEMENT
            </span>
            {isCeo && (
              <span className="bg-[#2C2A29] text-[#C5A059] text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border border-[#C5A059]/40">
                ⭐ CEO ROLA AKTÍVNA
              </span>
            )}
          </div>
          <h1 className="font-brand text-2xl md:text-3xl font-light text-[#2C2A29] uppercase mt-1">
            Projekty & <span className="font-bold">Klinická Operatíva</span>
          </h1>
          <p className="text-xs text-[#8C857B] mt-1 max-w-2xl">
            Koordinácia projektov, delegovanie úloh medzi manažmentom (Ing. Barbara Mecerodová, Mgr. Elena Solivajsová),
            zdravotnými sestrami (Ema Foltáni, Sabina Lenhartová) a lekárskym tímom.
          </p>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <button
            onClick={() => setIsCreateTaskModalOpen(true)}
            className="flex-1 sm:flex-none border border-[#E8E2D9] hover:border-[#C5A059] bg-white text-[#2C2A29] px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all shadow-sm flex items-center justify-center gap-2 group"
          >
            <Plus className="w-4 h-4 text-[#C5A059] group-hover:scale-110 transition-transform" />
            <span>Zadať Úlohu</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex-1 sm:flex-none bg-[#2C2A29] hover:bg-[#1f1d1c] text-white border border-[#C5A059]/50 hover:border-[#C5A059] px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 group"
          >
            <Briefcase className="w-4 h-4 text-[#C5A059] group-hover:rotate-12 transition-transform" />
            <span>+ Nový Projekt (CEO)</span>
          </button>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white border border-[#E8E2D9] p-4 rounded-xl shadow-sm">
          <p className="text-[10px] uppercase text-[#8C857B] font-bold">Celkovo projektov</p>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-bold text-[#2C2A29]">{stats.totalProjects}</p>
            <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-semibold">
              {stats.inProgressCount} v riešení
            </span>
          </div>
          <p className="text-[10px] text-[#8C857B] mt-1">Klinické & administratívne</p>
        </div>

        <div className="bg-white border border-[#E8E2D9] p-4 rounded-xl shadow-sm">
          <p className="text-[10px] uppercase text-[#8C857B] font-bold">Moje pridelené úlohy</p>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-bold text-[#C5A059]">{stats.myTasksCount}</p>
            <span className="text-[10px] text-[#C5A059] bg-[#C5A059]/10 px-1.5 py-0.5 rounded font-semibold">
              Pre Vás
            </span>
          </div>
          <p className="text-[10px] text-[#8C857B] mt-1">{currentUser.name}</p>
        </div>

        <div className="bg-white border border-[#E8E2D9] p-4 rounded-xl shadow-sm">
          <p className="text-[10px] uppercase text-[#8C857B] font-bold">Na schválenie (Review)</p>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-bold text-amber-700">{stats.reviewCount}</p>
            <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-semibold">
              Čaká CEO
            </span>
          </div>
          <p className="text-[10px] text-[#8C857B] mt-1">Pripravené na kontrolu</p>
        </div>

        <div className="bg-white border border-[#E8E2D9] p-4 rounded-xl shadow-sm">
          <p className="text-[10px] uppercase text-[#8C857B] font-bold">Plnenie úloh kliniky</p>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-bold text-emerald-700">{stats.completionRate}%</p>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold">
              {stats.completedTasks}/{stats.totalTasks}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-emerald-600 h-1.5 rounded-full transition-all" style={{ width: `${stats.completionRate}%` }} />
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white border border-[#E8E2D9] p-4 rounded-xl shadow-sm">
          <p className="text-[10px] uppercase text-rose-700 font-bold flex items-center gap-1">
            <Flame className="w-3 h-3" /> Urgentné úlohy
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-bold text-rose-700">{stats.urgentCount}</p>
            <span className="text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded font-semibold">
              Kritická priorita
            </span>
          </div>
          <p className="text-[10px] text-[#8C857B] mt-1">Najvyššia priorita</p>
        </div>
      </div>

      {/* 3. TOOLBAR & FILTERS */}
      <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          {/* FILTER TABS */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#FBF9F6] p-1 rounded-xl border border-[#E8E2D9] text-xs">
            <button
              onClick={() => setFilterRole('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filterRole === 'all' ? 'bg-[#2C2A29] text-white shadow-sm' : 'text-[#8C857B] hover:text-[#2C2A29]'
              }`}
            >
              Všetky projekty ({projects.length})
            </button>
            <button
              onClick={() => setFilterRole('my')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 ${
                filterRole === 'my' ? 'bg-[#C5A059] text-white shadow-sm' : 'text-[#8C857B] hover:text-[#2C2A29]'
              }`}
            >
              <span>Moje úlohy</span>
              <span className="text-[10px] bg-white/25 px-1.5 py-0.2 rounded-full font-bold">{stats.myTasksCount}</span>
            </button>
            <button
              onClick={() => setFilterRole('managers')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filterRole === 'managers' ? 'bg-[#2C2A29] text-white shadow-sm' : 'text-[#8C857B] hover:text-[#2C2A29]'
              }`}
            >
              Manažérky (Barbara & Elena)
            </button>
            <button
              onClick={() => setFilterRole('nurses')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filterRole === 'nurses' ? 'bg-[#2C2A29] text-white shadow-sm' : 'text-[#8C857B] hover:text-[#2C2A29]'
              }`}
            >
              Sestry (Ema & Sabina)
            </button>
            <button
              onClick={() => setFilterRole('urgent')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filterRole === 'urgent' ? 'bg-rose-700 text-white shadow-sm' : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              Kritické ⚠️
            </button>
          </div>

          {/* VIEW SWITCHER */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <div className="flex bg-[#FBF9F6] border border-[#E8E2D9] rounded-xl p-1 text-xs">
              <button
                onClick={() => setActiveView('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeView === 'kanban' ? 'bg-white text-[#2C2A29] shadow-sm font-bold' : 'text-[#8C857B] hover:text-[#2C2A29]'
                }`}
                title="Kanban nástenka podľa stavu"
              >
                <FolderKanban className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kanban</span>
              </button>
              <button
                onClick={() => setActiveView('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeView === 'list' ? 'bg-white text-[#2C2A29] shadow-sm font-bold' : 'text-[#8C857B] hover:text-[#2C2A29]'
                }`}
                title="Tabuľkový zoznam"
              >
                <ListTodo className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Zoznam</span>
              </button>
              <button
                onClick={() => setActiveView('team')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeView === 'team' ? 'bg-white text-[#2C2A29] shadow-sm font-bold' : 'text-[#8C857B] hover:text-[#2C2A29]'
                }`}
                title="Tímová matica"
              >
                <Users className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tím</span>
              </button>
            </div>
          </div>
        </div>

        {/* SEARCH & CATEGORY SELECTOR */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-[#E8E2D9]/70">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8C857B] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Hľadať v projektoch, úlohách, zodpovedných osobách..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#FBF9F6] border border-[#E8E2D9] rounded-xl text-xs outline-none focus:border-[#C5A059] focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#8C857B]" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#FBF9F6] border border-[#E8E2D9] rounded-xl px-3 py-2 text-xs outline-none focus:border-[#C5A059] font-medium text-[#2C2A29]"
            >
              <option value="all">Všetky kategórie</option>
              <option value="operativa">Operatíva & Medicína</option>
              <option value="manazment">Manažment & Recepcia</option>
              <option value="sklad">Sklad & Materiál</option>
              <option value="marketing">Marketing & Klienti</option>
              <option value="legislativa">Legislatíva & Hygiena</option>
              <option value="ostatne">Ostatné</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. MAIN VIEWS (KANBAN / LIST / TEAM) */}

      {/* A) KANBAN VIEW WITH DRAG AND DROP */}
      {activeView === 'kanban' && (
        <div className="space-y-4">
          {/* DRAG & DROP INSTRUCTION BANNER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[#FBF9F6] border border-[#E8E2D9] rounded-xl px-4 py-2.5 text-xs text-[#8C857B]">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#C5A059]/15 text-[#8A6827] font-bold text-xs flex-shrink-0">
                <GripVertical className="w-3.5 h-3.5" />
              </span>
              <p className="leading-snug">
                <strong className="text-[#2C2A29]">Interaktívny Drag & Drop Kanban:</strong>{' '}
                Uchopte kartu projektu a potiahnutím ju presuňte medzi stĺpcami{' '}
                <span className="text-[#2C2A29] font-semibold">Nové → Rozpracované → Na kontrolu CEO → Hotové</span>.
              </p>
            </div>
            {draggingProjectId ? (
              <div className="flex items-center gap-1.5 text-[#C5A059] font-bold text-[11px] bg-white border border-[#C5A059]/40 px-2.5 py-1 rounded-full animate-pulse self-start sm:self-auto shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#C5A059] animate-ping" />
                <span>Presun aktívny — pustite nad cieľovým stĺpcom</span>
              </div>
            ) : (
              <div className="text-[11px] text-[#A8A095] hidden md:block">
                Karty môžete presúvať myšou alebo tlačidlami na karte
              </div>
            )}
          </div>

          {/* KANBAN COLUMNS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {(['planning', 'in_progress', 'review', 'completed'] as ProjectStatus[]).map((statusKey) => {
              const columnProjects = filteredProjects.filter((p) => p.status === statusKey);
              const cfg = STATUS_CONFIG[statusKey];
              const isColumnTarget = dragOverStatus === statusKey;

              return (
                <div
                  key={statusKey}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverStatus !== statusKey) {
                      setDragOverStatus(statusKey);
                    }
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setDragOverStatus(statusKey);
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      if (dragOverStatus === statusKey) {
                        setDragOverStatus(null);
                      }
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const droppedId = e.dataTransfer.getData('text/plain') || draggingProjectId;
                    if (droppedId) {
                      handleMoveProjectStatus(droppedId, statusKey);
                    }
                    setDraggingProjectId(null);
                    setDragOverStatus(null);
                  }}
                  className={`flex flex-col rounded-2xl p-4 min-h-[520px] transition-all duration-200 ${
                    isColumnTarget
                      ? 'bg-[#F4ECE0] border-2 border-[#C5A059] ring-4 ring-[#C5A059]/20 shadow-lg scale-[1.01]'
                      : draggingProjectId
                      ? 'bg-[#FAF8F5] border-2 border-dashed border-[#DCD5C9]'
                      : 'bg-[#F7F5F0] border border-[#E8E2D9]'
                  }`}
                >
                  {/* COLUMN HEADER */}
                  <div className="flex justify-between items-start pb-3 mb-3 border-b border-[#E8E2D9]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                        <h3 className="text-xs font-black uppercase tracking-wider text-[#2C2A29]">
                          {cfg.label}
                        </h3>
                      </div>
                      <p className="text-[10px] text-[#8C857B] mt-0.5 pl-4.5 font-medium">
                        {cfg.subtitle}
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-[#8C857B] bg-white px-2 py-0.5 rounded-full border border-[#E8E2D9] shadow-2xs">
                      {columnProjects.length}
                    </span>
                  </div>

                  {/* COLUMN CARDS & DROP ZONE */}
                  <div className="space-y-3.5 flex-1 flex flex-col">
                    {/* ACTIVE DROP TARGET INDICATOR */}
                    {isColumnTarget && (
                      <div className="border-2 border-dashed border-[#C5A059] bg-[#FAF5EC] text-[#8A6827] rounded-xl p-3 text-center text-xs font-bold flex items-center justify-center gap-2 animate-pulse shadow-xs mb-1">
                        <CheckCircle2 className="w-4 h-4 text-[#C5A059]" />
                        <span>Pustiť sem pre zaradenie do: {cfg.shortLabel}</span>
                      </div>
                    )}

                    {columnProjects.length === 0 && !isColumnTarget ? (
                      <div className="h-36 border-2 border-dashed border-[#E8E2D9] rounded-xl flex flex-col items-center justify-center text-[#8C857B] text-[11px] italic gap-1 p-4 text-center bg-white/40">
                        <span>Žiadny projekt v tejto fáze</span>
                        <span className="text-[10px] text-[#A8A095] not-italic">Presuňte sem kartu myšou (Drag & Drop)</span>
                      </div>
                    ) : (
                      columnProjects.map((project) => {
                        const progress = getProjectProgress(project);
                        const cat = CATEGORY_CONFIG[project.category];
                        const prio = PRIORITY_CONFIG[project.priority];
                        const isOverdue = new Date(project.deadline) < new Date() && project.status !== 'completed';
                        const isBeingDragged = draggingProjectId === project.id;

                        return (
                          <div
                            key={project.id}
                            draggable={true}
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', project.id);
                              e.dataTransfer.effectAllowed = 'move';
                              setDraggingProjectId(project.id);
                            }}
                            onDragEnd={() => {
                              setDraggingProjectId(null);
                              setDragOverStatus(null);
                              setJustDragged(true);
                              setTimeout(() => setJustDragged(false), 200);
                            }}
                            onClick={() => {
                              if (justDragged) return;
                              setSelectedProject(project);
                            }}
                            className={`bg-white border rounded-xl p-4 shadow-sm transition-all cursor-grab active:cursor-grabbing group space-y-3 select-none ${
                              isBeingDragged
                                ? 'opacity-40 scale-[0.98] border-[#C5A059] ring-2 ring-[#C5A059] shadow-xl rotate-1'
                                : 'border-[#E8E2D9] hover:border-[#C5A059] hover:shadow-md'
                            }`}
                          >
                            {/* CATEGORY, PRIORITY & DRAG HANDLE */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${cat.bg} ${cat.color} ${cat.border}`}>
                                  {cat.label}
                                </span>
                                <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${prio.badge}`}>
                                  {prio.label}
                                </span>
                              </div>

                              <div 
                                className="flex items-center gap-1 text-[#B0A79B] group-hover:text-[#C5A059] p-1 rounded hover:bg-[#F4EFE6] transition-colors"
                                title="Uchopiť a potiahnuť (Drag & Drop) do iného stĺpca"
                              >
                                <GripVertical className="w-4 h-4" />
                              </div>
                            </div>

                            {/* TITLE & DESCRIPTION */}
                            <div>
                              <h4 className="font-bold text-sm text-[#2C2A29] group-hover:text-[#C5A059] transition-colors leading-snug">
                                {project.title}
                              </h4>
                              <p className="text-[11px] text-[#8C857B] line-clamp-2 mt-1 leading-relaxed">
                                {project.description}
                              </p>
                            </div>

                            {/* PROGRESS BAR */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] text-[#8C857B]">
                                <span>Úlohy ({project.tasks.filter((t) => t.completed).length}/{project.tasks.length})</span>
                                <span className="font-bold text-[#2C2A29]">{progress}%</span>
                              </div>
                              <div className="w-full bg-[#FBF9F6] border border-[#E8E2D9] rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    progress === 100 ? 'bg-emerald-600' : progress > 50 ? 'bg-[#C5A059]' : 'bg-[#2C2A29]'
                                  }`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>

                            {/* FOOTER: ASSIGNEES & DEADLINE */}
                            <div className="flex items-center justify-between pt-2 border-t border-[#E8E2D9]/60 text-xs">
                              {/* AVATAR STACK */}
                              <div className="flex -space-x-1.5 overflow-hidden">
                                {project.assigneeIds.map((userId) => {
                                  const user = SAY_CLINIC_USERS.find((u) => u.id === userId);
                                  if (!user) return null;
                                  return (
                                    <div
                                      key={userId}
                                      title={`${user.name} (${user.title})`}
                                      className="w-6 h-6 rounded-full border border-white bg-white overflow-hidden flex-shrink-0"
                                    >
                                      <LiquidAvatar id={user.id} name={user.name} role={user.role} />
                                    </div>
                                  );
                                })}
                              </div>

                              {/* DEADLINE & ATTACHMENTS COUNTERS */}
                              <div className="flex items-center gap-2 text-[10px]">
                                {project.attachments.length > 0 && (
                                  <span className="flex items-center gap-0.5 text-[#8C857B]" title={`${project.attachments.length} príloh`}>
                                    <Paperclip className="w-3 h-3" />
                                    <span>{project.attachments.length}</span>
                                  </span>
                                )}
                                <span
                                  className={`font-mono flex items-center gap-1 ${
                                    isOverdue ? 'text-rose-600 font-bold' : 'text-[#8C857B]'
                                  }`}
                                >
                                  <Clock className="w-3 h-3" />
                                  {new Date(project.deadline).toLocaleDateString('sk-SK', { day: 'numeric', month: 'numeric' })}
                                </span>
                              </div>
                            </div>

                            {/* QUICK STATUS SWITCH (Alternative 1-Click Transitions) */}
                            <div 
                              onClick={(e) => e.stopPropagation()} 
                              className="pt-2 border-t border-[#E8E2D9]/50 flex items-center justify-between text-[10px]"
                            >
                              <span className="text-[#A8A095] text-[9px] flex items-center gap-0.5">
                                <GripVertical className="w-2.5 h-2.5" />
                                <span>Presun:</span>
                              </span>

                              <div className="flex items-center gap-1">
                                {project.status !== 'planning' && (
                                  <button
                                    type="button"
                                    onClick={() => handleMoveProjectStatus(project.id, 'planning')}
                                    title="Presunúť do stĺpca Nové"
                                    className="px-1.5 py-0.5 rounded bg-[#FAF7F2] hover:bg-[#EAE4D7] text-[#444] font-medium border border-[#E0D8C8] transition-colors"
                                  >
                                    ← Nové
                                  </button>
                                )}
                                {project.status !== 'in_progress' && (
                                  <button
                                    type="button"
                                    onClick={() => handleMoveProjectStatus(project.id, 'in_progress')}
                                    title="Presunúť do stĺpca Rozpracované"
                                    className="px-1.5 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-800 font-medium border border-blue-200 transition-colors"
                                  >
                                    {project.status === 'planning' ? 'Rozpracovať →' : '← Rozpracované'}
                                  </button>
                                )}
                                {project.status !== 'review' && project.status !== 'completed' && (
                                  <button
                                    type="button"
                                    onClick={() => handleMoveProjectStatus(project.id, 'review')}
                                    title="Odoslať na kontrolu CEO"
                                    className="px-1.5 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 font-medium border border-amber-200 transition-colors"
                                  >
                                    Kontrola →
                                  </button>
                                )}
                                {project.status !== 'completed' && (
                                  <button
                                    type="button"
                                    onClick={() => handleMoveProjectStatus(project.id, 'completed')}
                                    title="Označiť ako hotové"
                                    className="px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 transition-colors flex items-center gap-0.5"
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Hotovo</span>
                                  </button>
                                )}
                                {project.status === 'completed' && (
                                  <button
                                    type="button"
                                    onClick={() => handleMoveProjectStatus(project.id, 'in_progress')}
                                    title="Znovu otvoriť projekt do Rozpracované"
                                    className="px-1.5 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 font-medium border border-amber-200 transition-colors"
                                  >
                                    ↺ Otvoriť
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* QUICK ADD IN COLUMN */}
                  <button
                    onClick={() => {
                      setIsCreateModalOpen(true);
                    }}
                    className="mt-3 w-full py-2 border border-dashed border-[#E8E2D9] hover:border-[#C5A059] rounded-xl text-xs text-[#8C857B] hover:text-[#2C2A29] bg-white/60 hover:bg-white transition-all flex items-center justify-center gap-1.5 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Pridať projekt</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* B) TABLE / LIST VIEW */}
      {activeView === 'list' && (
        <div className="bg-white border border-[#E8E2D9] rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FBF9F6] border-b border-[#E8E2D9] text-[#8C857B] uppercase tracking-wider text-[10px]">
                  <th className="p-4">Projekt / Názov</th>
                  <th className="p-4">Kategória</th>
                  <th className="p-4">Stav</th>
                  <th className="p-4">Priorita</th>
                  <th className="p-4">Vedúci & Tím</th>
                  <th className="p-4">Plnenie úloh</th>
                  <th className="p-4">Termín (Deadline)</th>
                  <th className="p-4 text-right">Akcia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9]">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-[#8C857B] italic">
                      Nenašli sa žiadne projekty zodpovedajúce filtrom.
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((project) => {
                    const progress = getProjectProgress(project);
                    const cat = CATEGORY_CONFIG[project.category];
                    const stat = STATUS_CONFIG[project.status];
                    const prio = PRIORITY_CONFIG[project.priority];
                    const isOverdue = new Date(project.deadline) < new Date() && project.status !== 'completed';

                    return (
                      <tr
                        key={project.id}
                        onClick={() => setSelectedProject(project)}
                        className="hover:bg-[#FBF9F6] transition-colors cursor-pointer group"
                      >
                        <td className="p-4">
                          <p className="font-bold text-[#2C2A29] group-hover:text-[#C5A059] transition-colors">
                            {project.title}
                          </p>
                          <p className="text-[10px] text-[#8C857B] line-clamp-1 mt-0.5">{project.description}</p>
                        </td>
                        <td className="p-4">
                          <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border ${cat.bg} ${cat.color} ${cat.border}`}>
                            {cat.label}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`text-[10px] px-2 py-0.5 rounded border ${stat.badge} font-medium`}>
                            {stat.label}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`text-[10px] px-2 py-0.5 rounded border ${prio.badge}`}>
                            {prio.label}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-1 overflow-hidden">
                              {project.assigneeIds.slice(0, 3).map((uId) => {
                                const user = SAY_CLINIC_USERS.find((u) => u.id === uId);
                                if (!user) return null;
                                return (
                                  <div key={uId} className="w-5 h-5 rounded-full border border-white overflow-hidden">
                                    <LiquidAvatar id={user.id} name={user.name} role={user.role} />
                                  </div>
                                );
                              })}
                            </div>
                            <span className="text-[11px] text-[#2C2A29] font-medium">{project.leadName}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="w-32 space-y-1">
                            <div className="flex justify-between text-[10px] text-[#8C857B]">
                              <span>{project.tasks.filter((t) => t.completed).length}/{project.tasks.length}</span>
                              <span className="font-bold text-[#2C2A29]">{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-[#C5A059] h-1.5 rounded-full" style={{ width: `${progress}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-xs">
                          <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-[#2C2A29]'}>
                            {project.deadline}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProject(project);
                            }}
                            className="text-xs font-bold text-[#C5A059] hover:underline"
                          >
                            Otvoriť →
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* C) TEAM MATRIX VIEW */}
      {activeView === 'team' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {SAY_CLINIC_USERS.map((user) => {
            // All tasks assigned to this user
            const userTasks: { project: Project; task: ProjectTask }[] = [];
            projects.forEach((p) => {
              p.tasks.forEach((t) => {
                if (t.assignedToId === user.id) {
                  userTasks.push({ project: p, task: t });
                }
              });
            });

            const openTasks = userTasks.filter((item) => !item.task.completed);
            const doneTasks = userTasks.filter((item) => item.task.completed);

            return (
              <div key={user.id} className="bg-white border border-[#E8E2D9] rounded-2xl p-5 shadow-sm space-y-4">
                {/* USER PROFILE CARD */}
                <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full border border-[#C5A059] p-0.5 bg-white shadow-sm overflow-hidden">
                      <LiquidAvatar id={user.id} name={user.name} role={user.role} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#2C2A29]">{user.name}</h4>
                      <p className="text-[10px] uppercase tracking-wider text-[#C5A059] font-semibold">
                        {user.role === 'ceo' ? 'CEO & Primár' : user.title}
                      </p>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {openTasks.length} otvorených
                    </span>
                  </div>
                </div>

                {/* TASKS LIST */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {userTasks.length === 0 ? (
                    <p className="text-xs text-[#8C857B] italic text-center py-6">
                      Žiadne pridelené úlohy v aktívnych projektoch.
                    </p>
                  ) : (
                    userTasks.map(({ project, task }) => (
                      <div
                        key={task.id}
                        className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-3 transition-all ${
                          task.completed
                            ? 'bg-[#FBF9F6] border-[#E8E2D9] text-[#8C857B]'
                            : 'bg-white border-[#E8E2D9] hover:border-[#C5A059] text-[#2C2A29]'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 flex-1">
                          <button
                            onClick={() => handleToggleTask(project.id, task.id)}
                            className="mt-0.5 text-[#C5A059] hover:text-[#2C2A29] flex-shrink-0"
                          >
                            {task.completed ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Square className="w-4 h-4 text-[#8C857B]" />
                            )}
                          </button>
                          <div>
                            <p className={`font-semibold ${task.completed ? 'line-through text-[#8C857B]' : 'text-[#2C2A29]'}`}>
                              {task.title}
                            </p>
                            <p className="text-[10px] text-[#8C857B] mt-0.5">Projekt: {project.title}</p>
                          </div>
                        </div>

                        {task.deadline && (
                          <span className="text-[9px] font-mono text-[#8C857B] bg-[#FBF9F6] px-1.5 py-0.5 rounded border border-[#E8E2D9] flex-shrink-0">
                            {task.deadline}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* FOOTER STATS */}
                <div className="pt-2 border-t border-[#E8E2D9] flex justify-between text-[11px] text-[#8C857B]">
                  <span>Dokončené úlohy: {doneTasks.length}</span>
                  <button
                    onClick={() => {
                      setTaskModalAssigneeId(user.id);
                      setIsCreateTaskModalOpen(true);
                    }}
                    className="text-[#C5A059] hover:underline font-bold"
                  >
                    + Zadať úlohu pre {user.name.split(' ')[0]}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. PROJECT DETAIL SLIDE-OVER / MODAL */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col border-l border-[#E8E2D9] animate-in slide-in-from-right duration-300">
            {/* MODAL HEADER */}
            <div className="p-6 border-b border-[#E8E2D9] bg-[#FBF9F6] flex justify-between items-start">
              <div className="space-y-1.5 pr-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${CATEGORY_CONFIG[selectedProject.category].bg} ${CATEGORY_CONFIG[selectedProject.category].color} ${CATEGORY_CONFIG[selectedProject.category].border}`}>
                    {CATEGORY_CONFIG[selectedProject.category].label}
                  </span>

                  {/* STATUS SELECTOR DROPDOWN */}
                  <select
                    value={selectedProject.status}
                    onChange={(e) => handleUpdateProjectStatus(selectedProject.id, e.target.value as ProjectStatus)}
                    className="bg-white border border-[#E8E2D9] rounded-lg px-2.5 py-0.5 text-xs font-bold text-[#2C2A29] outline-none focus:border-[#C5A059]"
                  >
                    <option value="planning">⚪ Plánovanie</option>
                    <option value="in_progress">🔵 V riešení</option>
                    <option value="review">🟠 Na kontrolu CEO</option>
                    <option value="completed">🟢 Dokončené</option>
                    <option value="on_hold">🔴 Pozastavené</option>
                  </select>

                  <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border ${PRIORITY_CONFIG[selectedProject.priority].badge}`}>
                    {PRIORITY_CONFIG[selectedProject.priority].label} priorita
                  </span>
                </div>

                <h2 className="text-xl font-bold text-[#2C2A29]">{selectedProject.title}</h2>
                <p className="text-xs text-[#8C857B]">
                  Vytvoril: {selectedProject.createdByName} • {new Date(selectedProject.createdAt).toLocaleDateString('sk-SK')}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {isCeo && (
                  <button
                    onClick={() => handleDeleteProject(selectedProject.id)}
                    className="p-2 text-[#8C857B] hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Zmazať projekt"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setSelectedProject(null)}
                  className="p-2 text-[#8C857B] hover:text-[#2C2A29] rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* MODAL BODY (SCROLLABLE) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* KEY METRICS BAR */}
              <div className="grid grid-cols-3 gap-4 bg-[#FBF9F6] p-4 rounded-xl border border-[#E8E2D9] text-xs">
                <div>
                  <span className="text-[10px] text-[#8C857B] uppercase font-bold block">Vedúci projektu</span>
                  <span className="font-semibold text-[#2C2A29] mt-0.5 block">{selectedProject.leadName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#8C857B] uppercase font-bold block">Termín odovzdania</span>
                  <span className="font-mono font-semibold text-[#2C2A29] mt-0.5 block">{selectedProject.deadline}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#8C857B] uppercase font-bold block">Rozpočet / Alokácia</span>
                  <span className="font-semibold text-[#C5A059] mt-0.5 block">
                    {selectedProject.budget ? `${selectedProject.budget.toLocaleString('sk-SK')} €` : 'Interné'}
                  </span>
                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold uppercase text-[#8C857B] tracking-wider">Popis & Zadanie</h3>
                <div className="p-4 bg-white border border-[#E8E2D9] rounded-xl text-xs text-[#2C2A29] leading-relaxed">
                  {selectedProject.description}
                </div>
              </div>

              {/* ASSIGNED TEAM MEMBERS */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase text-[#8C857B] tracking-wider flex items-center justify-between">
                  <span>Pridelený Tím ({selectedProject.assigneeIds.length})</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.assigneeIds.map((uId) => {
                    const user = SAY_CLINIC_USERS.find((u) => u.id === uId);
                    if (!user) return null;
                    return (
                      <div
                        key={uId}
                        className="flex items-center gap-2 bg-[#FBF9F6] border border-[#E8E2D9] px-3 py-1.5 rounded-xl text-xs"
                      >
                        <div className="w-5 h-5 rounded-full overflow-hidden">
                          <LiquidAvatar id={user.id} name={user.name} role={user.role} />
                        </div>
                        <span className="font-semibold text-[#2C2A29]">{user.name}</span>
                        <span className="text-[10px] text-[#C5A059]">({user.role === 'ceo' ? 'CEO' : user.role === 'manager' ? 'Manažérka' : user.role === 'nurse' ? 'Sestra' : 'Lekár'})</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* TASKS CHECKLIST SECTION */}
              <div className="space-y-3 pt-3 border-t border-[#E8E2D9]">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-bold uppercase text-[#8C857B] tracking-wider">
                      Úlohy & Zoznam krokov ({selectedProject.tasks.filter((t) => t.completed).length}/{selectedProject.tasks.length})
                    </h3>
                    <p className="text-[11px] text-[#8C857B]">
                      {getProjectProgress(selectedProject)}% splnené
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setTaskModalProjectId(selectedProject.id);
                      setIsCreateTaskModalOpen(true);
                    }}
                    className="text-xs bg-[#FBF9F6] hover:bg-[#C5A059] hover:text-white border border-[#E8E2D9] text-[#2C2A29] px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Pridať úlohu
                  </button>
                </div>

                <div className="space-y-2">
                  {selectedProject.tasks.length === 0 ? (
                    <div className="p-6 text-center border-2 border-dashed border-[#E8E2D9] rounded-xl text-xs text-[#8C857B] italic">
                      Tento projekt zatiaľ nemá definované žiadne jednotlivé úlohy.
                    </div>
                  ) : (
                    selectedProject.tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 transition-all ${
                          task.completed
                            ? 'bg-[#FBF9F6] border-[#E8E2D9] text-[#8C857B]'
                            : 'bg-white border-[#E8E2D9] hover:border-[#C5A059] text-[#2C2A29]'
                        }`}
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <button
                            onClick={() => handleToggleTask(selectedProject.id, task.id)}
                            className="mt-0.5 text-[#C5A059] hover:scale-110 transition-transform"
                          >
                            {task.completed ? (
                              <CheckSquare className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <Square className="w-5 h-5 text-[#8C857B]" />
                            )}
                          </button>

                          <div className="space-y-1 flex-1">
                            <p className={`text-xs font-semibold ${task.completed ? 'line-through text-[#8C857B]' : 'text-[#2C2A29]'}`}>
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-[11px] text-[#8C857B]">{task.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 text-[10px] text-[#8C857B] pt-0.5">
                              <span className="flex items-center gap-1 text-[#2C2A29] font-medium">
                                👤 {task.assignedToName} ({task.assignedToRole})
                              </span>
                              {task.deadline && (
                                <span className="font-mono">📅 Do: {task.deadline}</span>
                              )}
                              <span className={`px-1.5 py-0.2 rounded border ${PRIORITY_CONFIG[task.priority].badge}`}>
                                {PRIORITY_CONFIG[task.priority].label}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteTask(selectedProject.id, task.id)}
                          className="text-[#8C857B] hover:text-rose-600 p-1 opacity-60 hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* ATTACHMENTS & DOCUMENT HANDLING SECTION */}
              <div className="space-y-3 pt-3 border-t border-[#E8E2D9]">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase text-[#8C857B] tracking-wider flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5" /> Prílohy, Dokumenty & Odkazy ({selectedProject.attachments.length})
                  </h3>
                </div>

                {/* ATTACHMENT ADDING CONTROLS */}
                <div className="bg-[#FBF9F6] border border-[#E8E2D9] rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => setAttachmentMode('file')}
                      className={`px-3 py-1 rounded-lg font-medium transition-all ${
                        attachmentMode === 'file' ? 'bg-[#2C2A29] text-white' : 'text-[#8C857B] hover:text-[#2C2A29]'
                      }`}
                    >
                      📁 Nahrať súbor (PDF, Excel, Foto)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttachmentMode('link')}
                      className={`px-3 py-1 rounded-lg font-medium transition-all ${
                        attachmentMode === 'link' ? 'bg-[#2C2A29] text-white' : 'text-[#8C857B] hover:text-[#2C2A29]'
                      }`}
                    >
                      🔗 Pridať odkaz (Google Drive, Web)
                    </button>
                  </div>

                  {attachmentMode === 'file' ? (
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#2C2A29] file:text-white hover:file:bg-[#C5A059] file:cursor-pointer text-[#8C857B]"
                      />
                      <span className="text-[11px] text-[#8C857B] italic">Podporované: PDF, DOCX, XLSX, JPG, PNG</span>
                    </div>
                  ) : (
                    <form onSubmit={handleAddLinkAttachment} className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Názov odkazu (napr. Google Drive - Rozpočet)..."
                        value={linkTitle}
                        onChange={(e) => setLinkTitle(e.target.value)}
                        className="flex-1 bg-white border border-[#E8E2D9] rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[#C5A059]"
                      />
                      <input
                        type="text"
                        placeholder="https://drive.google.com/..."
                        required
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        className="flex-1 bg-white border border-[#E8E2D9] rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[#C5A059]"
                      />
                      <button
                        type="submit"
                        className="bg-[#C5A059] text-white px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#9C7D3D] transition-colors"
                      >
                        Pridať
                      </button>
                    </form>
                  )}
                </div>

                {/* ATTACHMENT LIST */}
                <div className="space-y-2">
                  {selectedProject.attachments.length === 0 ? (
                    <p className="text-xs text-[#8C857B] italic text-center py-3">
                      Zatiaľ neboli nahrané žiadne dokumenty ani odkazy.
                    </p>
                  ) : (
                    selectedProject.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="p-3 bg-white border border-[#E8E2D9] rounded-xl flex items-center justify-between text-xs hover:border-[#C5A059] transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E8E2D9] flex items-center justify-center text-[#C5A059]">
                            {att.type === 'link' ? (
                              <ExternalLink className="w-4 h-4" />
                            ) : att.name.endsWith('.pdf') ? (
                              <FileText className="w-4 h-4 text-rose-600" />
                            ) : att.name.endsWith('.xlsx') || att.name.endsWith('.xls') ? (
                              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <ImageIcon className="w-4 h-4 text-sky-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-[#2C2A29]">{att.name}</p>
                            <p className="text-[10px] text-[#8C857B]">
                              {att.size ? `${att.size} • ` : ''}Nahral: {att.uploadedByName} ({att.uploadedAt})
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={att.type === 'file' ? att.name : undefined}
                            className="p-1.5 text-[#C5A059] hover:text-[#2C2A29] rounded-lg hover:bg-gray-50 font-semibold flex items-center gap-1 text-[11px]"
                          >
                            {att.type === 'link' ? 'Otvoriť link ↗' : 'Stiahnuť ⤓'}
                          </a>
                          <button
                            onClick={() => handleDeleteAttachment(selectedProject.id, att.id)}
                            className="p-1.5 text-[#8C857B] hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* COMMENTS & ACTIVITY LOG */}
              <div className="space-y-3 pt-3 border-t border-[#E8E2D9]">
                <h3 className="text-xs font-bold uppercase text-[#8C857B] tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Operatívna Komunikácia & Záznamy ({selectedProject.comments.length})
                </h3>

                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {selectedProject.comments.map((comm) => (
                    <div key={comm.id} className="p-3 bg-[#FBF9F6] border border-[#E8E2D9] rounded-xl text-xs space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-[#2C2A29]">
                          {comm.authorName} <span className="text-[#C5A059]">({comm.authorRole})</span>
                        </span>
                        <span className="text-[#8C857B] font-mono">{comm.timestamp}</span>
                      </div>
                      <p className="text-[#2C2A29] leading-relaxed">{comm.text}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Napíšte poznámku, schválenie alebo inštrukciu..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="flex-1 bg-white border border-[#E8E2D9] rounded-xl px-3 py-2 text-xs outline-none focus:border-[#C5A059]"
                  />
                  <button
                    type="submit"
                    className="bg-[#2C2A29] hover:bg-[#C5A059] text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" /> Odoslať
                  </button>
                </form>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="p-4 border-t border-[#E8E2D9] bg-[#FBF9F6] flex justify-between items-center">
              <span className="text-xs text-[#8C857B]">
                ID: {selectedProject.id} • Posledná úprava:{' '}
                {new Date(selectedProject.updatedAt).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <button
                onClick={() => setSelectedProject(null)}
                className="bg-[#2C2A29] text-white px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#C5A059] transition-colors"
              >
                Zavrieť detail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. CREATE NEW PROJECT MODAL (CEO) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-[#E8E2D9] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#C5A059] tracking-widest block">CEO Poverenie</span>
                <h3 className="text-lg font-bold text-[#2C2A29] uppercase">Vytvoriť Nový Projekt</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#8C857B] hover:text-[#2C2A29] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              {/* TITLE */}
              <div>
                <label className="text-xs font-bold uppercase text-[#8C857B] tracking-wider block mb-1">
                  Názov projektu *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Napr. Kolaudácia sály B, Školenie personálu na novú technológiu..."
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  className="w-full bg-[#FBF9F6] border border-[#E8E2D9] rounded-xl px-4 py-2.5 text-xs text-[#2C2A29] outline-none focus:border-[#C5A059] focus:bg-white font-medium"
                />
              </div>

              {/* CATEGORY & PRIORITY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-[#8C857B] tracking-wider block mb-1">
                    Kategória
                  </label>
                  <select
                    value={newProjectCategory}
                    onChange={(e) => setNewProjectCategory(e.target.value as ProjectCategory)}
                    className="w-full bg-[#FBF9F6] border border-[#E8E2D9] rounded-xl px-3 py-2 text-xs text-[#2C2A29] outline-none focus:border-[#C5A059]"
                  >
                    <option value="operativa">Operatíva & Medicína</option>
                    <option value="manazment">Manažment & Recepcia</option>
                    <option value="sklad">Sklad & Materiál</option>
                    <option value="marketing">Marketing & Klienti</option>
                    <option value="legislativa">Legislatíva & Hygiena</option>
                    <option value="ostatne">Ostatné</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-[#8C857B] tracking-wider block mb-1">
                    Priorita
                  </label>
                  <select
                    value={newProjectPriority}
                    onChange={(e) => setNewProjectPriority(e.target.value as ProjectPriority)}
                    className="w-full bg-[#FBF9F6] border border-[#E8E2D9] rounded-xl px-3 py-2 text-xs text-[#2C2A29] outline-none focus:border-[#C5A059]"
                  >
                    <option value="low">Nízka</option>
                    <option value="medium">Stredná</option>
                    <option value="high">Vysoká</option>
                    <option value="urgent">Kritická (Urgentná)</option>
                  </select>
                </div>
              </div>

              {/* LEAD & DEADLINE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-[#8C857B] tracking-wider block mb-1">
                    Vedúci projektu (Lead)
                  </label>
                  <select
                    value={newProjectLeadId}
                    onChange={(e) => setNewProjectLeadId(e.target.value)}
                    className="w-full bg-[#FBF9F6] border border-[#E8E2D9] rounded-xl px-3 py-2 text-xs text-[#2C2A29] outline-none focus:border-[#C5A059]"
                  >
                    {SAY_CLINIC_USERS.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role === 'ceo' ? 'CEO' : u.title})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-[#8C857B] tracking-wider block mb-1">
                    Termín dokončenia (Deadline) *
                  </label>
                  <input
                    type="date"
                    required
                    value={newProjectDeadline}
                    onChange={(e) => setNewProjectDeadline(e.target.value)}
                    className="w-full bg-[#FBF9F6] border border-[#E8E2D9] rounded-xl px-3 py-2 text-xs text-[#2C2A29] outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              {/* ASSIGNEES MULTI-SELECT CHECKBOXES */}
              <div>
                <label className="text-xs font-bold uppercase text-[#8C857B] tracking-wider block mb-1.5">
                  Prideliť tím (Manažérky & Sestry)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#FBF9F6] p-3 rounded-xl border border-[#E8E2D9]">
                  {SAY_CLINIC_USERS.map((user) => {
                    const isSelected = newProjectAssignees.includes(user.id);
                    return (
                      <label
                        key={user.id}
                        className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-white border-[#C5A059] shadow-xs text-[#2C2A29]'
                            : 'bg-transparent border-transparent hover:bg-white/60 text-[#8C857B]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewProjectAssignees((prev) => [...prev, user.id]);
                            } else {
                              setNewProjectAssignees((prev) => prev.filter((id) => id !== user.id));
                            }
                          }}
                          className="rounded text-[#C5A059] focus:ring-0"
                        />
                        <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                          <LiquidAvatar id={user.id} name={user.name} role={user.role} />
                        </div>
                        <div className="truncate">
                          <span className="font-semibold block truncate">{user.name}</span>
                          <span className="text-[9px] text-[#C5A059] block">
                            {user.role === 'ceo' ? 'CEO' : user.role === 'manager' ? 'Manažérka' : user.role === 'nurse' ? 'Sestra' : 'Lekár'}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="text-xs font-bold uppercase text-[#8C857B] tracking-wider block mb-1">
                  Podrobný popis & Zadanie
                </label>
                <textarea
                  rows={3}
                  placeholder="Definujte rozsah projektu, špecifikácie a očakávaný výstup..."
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  className="w-full bg-[#FBF9F6] border border-[#E8E2D9] rounded-xl p-3 text-xs text-[#2C2A29] outline-none focus:border-[#C5A059] focus:bg-white"
                />
              </div>

              {/* OPTIONAL FIRST TASK */}
              <div className="bg-[#FBF9F6] border border-[#E8E2D9] p-3.5 rounded-xl space-y-2">
                <span className="text-[10px] uppercase font-bold text-[#8C857B] tracking-wider block">
                  Prvá okamžitá úloha (voliteľné)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Názov úlohy..."
                    value={initialTaskTitle}
                    onChange={(e) => setInitialTaskTitle(e.target.value)}
                    className="sm:col-span-2 bg-white border border-[#E8E2D9] rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[#C5A059]"
                  />
                  <select
                    value={initialTaskAssignee}
                    onChange={(e) => setInitialTaskAssignee(e.target.value)}
                    className="bg-white border border-[#E8E2D9] rounded-lg px-2 py-1.5 text-xs outline-none focus:border-[#C5A059]"
                  >
                    {SAY_CLINIC_USERS.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name.split(' ')[0]} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 bg-[#FBF9F6] hover:bg-gray-100 text-[#8C857B] text-xs font-bold uppercase rounded-xl transition-colors"
                >
                  Zrušiť
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#2C2A29] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-md"
                >
                  Vytvoriť Projekt →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. QUICK TASK CREATION MODAL */}
      {isCreateTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-[#E8E2D9] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#C5A059] tracking-widest block">Operatívna Úloha</span>
                <h3 className="text-base font-bold text-[#2C2A29] uppercase">Zadať Novú Úlohu</h3>
              </div>
              <button
                onClick={() => setIsCreateTaskModalOpen(false)}
                className="text-[#8C857B] hover:text-[#2C2A29]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTaskToProject} className="space-y-3.5">
              {/* SELECT PROJECT IF NOT IN DETAIL DRAWER */}
              {!selectedProject && (
                <div>
                  <label className="text-xs font-bold uppercase text-[#8C857B] tracking-wider block mb-1">
                    Priradiť k projektu *
                  </label>
                  <select
                    required
                    value={taskModalProjectId}
                    onChange={(e) => setTaskModalProjectId(e.target.value)}
                    className="w-full bg-[#FBF9F6] border border-[#E8E2D9] rounded-xl px-3 py-2 text-xs text-[#2C2A29] outline-none focus:border-[#C5A059]"
                  >
                    <option value="">-- Vyberte projekt --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-bold uppercase text-[#8C857B] tracking-wider block mb-1">
                  Názov úlohy *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Napr. Objednať špeciálne obväzy, Pripraviť zmluvu..."
                  value={taskModalTitle}
                  onChange={(e) => setTaskModalTitle(e.target.value)}
                  className="w-full bg-[#FBF9F6] border border-[#E8E2D9] rounded-xl px-3 py-2 text-xs text-[#2C2A29] outline-none focus:border-[#C5A059] font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-[#8C857B] tracking-wider block mb-1">
                    Zodpovedná osoba *
                  </label>
                  <select
                    value={taskModalAssigneeId}
                    onChange={(e) => setTaskModalAssigneeId(e.target.value)}
                    className="w-full bg-[#FBF9F6] border border-[#E8E2D9] rounded-xl px-3 py-2 text-xs text-[#2C2A29] outline-none focus:border-[#C5A059]"
                  >
                    {SAY_CLINIC_USERS.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role === 'ceo' ? 'CEO' : u.role === 'manager' ? 'Manažérka' : u.role === 'nurse' ? 'Sestra' : 'Lekár'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-[#8C857B] tracking-wider block mb-1">
                    Priorita
                  </label>
                  <select
                    value={taskModalPriority}
                    onChange={(e) => setTaskModalPriority(e.target.value as ProjectPriority)}
                    className="w-full bg-[#FBF9F6] border border-[#E8E2D9] rounded-xl px-3 py-2 text-xs text-[#2C2A29] outline-none focus:border-[#C5A059]"
                  >
                    <option value="low">Nízka</option>
                    <option value="medium">Stredná</option>
                    <option value="high">Vysoká</option>
                    <option value="urgent">Kritická</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-[#8C857B] tracking-wider block mb-1">
                  Termín splnenia (Deadline)
                </label>
                <input
                  type="date"
                  value={taskModalDeadline}
                  onChange={(e) => setTaskModalDeadline(e.target.value)}
                  className="w-full bg-[#FBF9F6] border border-[#E8E2D9] rounded-xl px-3 py-2 text-xs text-[#2C2A29] outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-[#8C857B] tracking-wider block mb-1">
                  Poznámka / Detaily
                </label>
                <textarea
                  rows={2}
                  placeholder="Doplňujúce inštrukcie pre povereného pracovníka..."
                  value={taskModalDescription}
                  onChange={(e) => setTaskModalDescription(e.target.value)}
                  className="w-full bg-[#FBF9F6] border border-[#E8E2D9] rounded-xl p-2.5 text-xs text-[#2C2A29] outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateTaskModalOpen(false)}
                  className="flex-1 py-2 bg-[#FBF9F6] hover:bg-gray-100 text-[#8C857B] text-xs font-bold uppercase rounded-xl transition-colors"
                >
                  Zrušiť
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#2C2A29] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-md"
                >
                  Zadať Úlohu →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRAG & DROP CONFIRMATION TOAST */}
      {dragToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#2C2A29] text-white text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 border border-[#C5A059]/50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="font-medium">{dragToast.message}</span>
          <button
            type="button"
            onClick={() => setDragToast(null)}
            className="ml-2 text-stone-400 hover:text-white p-0.5 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
