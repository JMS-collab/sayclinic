'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Check, 
  Plus, 
  Trash2, 
  User, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Briefcase,
  Copy,
  ExternalLink,
  Flame,
  FolderKanban
} from 'lucide-react';
import { UserAccount, SAY_CLINIC_USERS } from './LoginForm';
import { RealtimeSyncService } from '../services/realtimeSyncService';

export interface OperativeNote {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: string;
  createdById: string;
  createdByName: string;
  createdByRole?: string;
  assignedToId: string; // 'all' or user id
  assignedToName: string;
  createdAt: string;
  priority?: 'normal' | 'high' | 'urgent';
  source?: 'note' | 'project';
  projectId?: string;
  projectTitle?: string;
  taskId?: string;
}

export const INITIAL_OPERATIVE_NOTES: OperativeNote[] = [
  {
    id: 'op-note-1',
    text: 'Skontrolovať predoperačné výsledky pre p. Máriu Kováčovú (09:00)',
    completed: false,
    createdById: 'u1',
    createdByName: 'MUDr. Ján Mráz',
    createdByRole: 'ceo',
    assignedToId: 'u1',
    assignedToName: 'MUDr. Ján Mráz',
    createdAt: '2026-09-03T08:15:00Z',
    priority: 'high',
    source: 'note',
  },
  {
    id: 'op-note-2',
    text: 'Pripraviť operačný protokol a overiť informovaný súhlas na zajtrajšiu augmentáciu',
    completed: false,
    createdById: 'u4',
    createdByName: 'Ing. Barbara Mecerodová, MBA',
    createdByRole: 'manager',
    assignedToId: 'u1',
    assignedToName: 'MUDr. Ján Mráz',
    createdAt: '2026-09-03T08:45:00Z',
    priority: 'urgent',
    source: 'note',
  },
  {
    id: 'op-note-3',
    text: 'Pripraviť sterilný set Vaser a odsávacie kanyly PAL na sálu B',
    completed: false,
    createdById: 'u1',
    createdByName: 'MUDr. Ján Mráz',
    createdByRole: 'ceo',
    assignedToId: 'u7',
    assignedToName: 'Sabina Lenhartová',
    createdAt: '2026-09-03T09:00:00Z',
    priority: 'high',
    source: 'note',
  },
  {
    id: 'op-note-4',
    text: 'Podpísať prepúšťaciu správu pre pacienta Petra Vargu (izba 2)',
    completed: false,
    createdById: 'u6',
    createdByName: 'Ema Foltáni',
    createdByRole: 'nurse',
    assignedToId: 'u1',
    assignedToName: 'MUDr. Ján Mráz',
    createdAt: '2026-09-03T09:30:00Z',
    priority: 'normal',
    source: 'note',
  },
  {
    id: 'op-note-5',
    text: 'Objednať kompresnú bielizeň Lipoelastic veľkosť M a L pre oddelenie',
    completed: true,
    completedAt: '2026-09-02T16:30:00Z',
    createdById: 'u5',
    createdByName: 'Mgr. Elena Solivajsová',
    createdByRole: 'manager',
    assignedToId: 'all',
    assignedToName: 'Celý tím',
    createdAt: '2026-09-02T10:00:00Z',
    priority: 'normal',
    source: 'note',
  },
  {
    id: 'op-note-6',
    text: 'Doplniť lokálne anestetikum Supracain a sterilné rúška do zákrokovne',
    completed: false,
    createdById: 'u2',
    createdByName: 'MUDr. Zuzana Sroková',
    createdByRole: 'doctor',
    assignedToId: 'u6',
    assignedToName: 'Ema Foltáni',
    createdAt: '2026-09-03T07:30:00Z',
    priority: 'normal',
    source: 'note',
  },
];

interface OperativeNotesWidgetProps {
  currentUser: UserAccount;
  onConvertToProject?: (noteText: string, noteId: string) => void;
  onOpenProjects?: () => void;
}

type FilterScope = 'all_mine' | 'assigned_to_me' | 'created_by_me';

export default function OperativeNotesWidget({
  currentUser,
  onConvertToProject,
  onOpenProjects,
}: OperativeNotesWidgetProps) {
  const [notes, setNotes] = useState<OperativeNote[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>(currentUser.id);
  const [newPriority, setNewPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [filterScope, setFilterScope] = useState<FilterScope>('all_mine');
  const [showCompleted, setShowCompleted] = useState(true);
  const [isExpandedForm, setIsExpandedForm] = useState(false);

  // Kontextové menu po pravom kliknutí na poznámku/úlohu
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    note: OperativeNote | null;
  }>({ isOpen: false, x: 0, y: 0, note: null });

  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Zatvorenie kontextového menu pri kliknutí mimo alebo stlačení Escape
  useEffect(() => {
    if (!contextMenu.isOpen) return;
    const handleClose = () => setContextMenu(prev => ({ ...prev, isOpen: false }));
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('mousedown', handleClose);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClose);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [contextMenu.isOpen]);

  // 1. Načítanie poznámok z localStorage a real-time synchronizácia
  useEffect(() => {
    try {
      const saved = localStorage.getItem('say_clinic_operative_notes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (typeof parsed[0] === 'string') {
            const converted: OperativeNote[] = (parsed as unknown as string[]).map((str, idx) => ({
              id: `migrated-${idx}-${Date.now()}`,
              text: str,
              completed: false,
              createdById: currentUser.id,
              createdByName: currentUser.name,
              assignedToId: currentUser.id,
              assignedToName: currentUser.name,
              createdAt: new Date().toISOString(),
              priority: 'normal',
              source: 'note',
            }));
            setNotes(converted);
            localStorage.setItem('say_clinic_operative_notes', JSON.stringify(converted));
          } else {
            setNotes(parsed);
          }
        } else {
          setNotes(INITIAL_OPERATIVE_NOTES);
        }
      } else {
        setNotes(INITIAL_OPERATIVE_NOTES);
        localStorage.setItem('say_clinic_operative_notes', JSON.stringify(INITIAL_OPERATIVE_NOTES));
      }

      // Načítanie projektov pre extrakciu pridelených úloh
      const savedProjects = localStorage.getItem('say_clinic_projects');
      if (savedProjects) {
        const parsedProj = JSON.parse(savedProjects);
        if (Array.isArray(parsedProj)) setProjects(parsedProj);
      }
    } catch (e) {
      console.error('Chyba načítania operatívnych poznámok:', e);
      setNotes(INITIAL_OPERATIVE_NOTES);
    }

    // Odber zmien v reálnom čase zo siete SAY CLINIC
    const unsubNotes = RealtimeSyncService.subscribe('operative_notes', (updated: any) => {
      if (Array.isArray(updated)) {
        setNotes(updated);
      }
    });

    const unsubProjects = RealtimeSyncService.subscribe('projects', (updatedProj: any) => {
      if (Array.isArray(updatedProj)) {
        setProjects(updatedProj);
      }
    });

    return () => {
      unsubNotes();
      unsubProjects();
    };
  }, [currentUser.id, currentUser.name]);

  // Uloženie zmien poznámok + vysielanie cez RealtimeSyncService
  const saveNotes = (updated: OperativeNote[]) => {
    setNotes(updated);
    try {
      localStorage.setItem('say_clinic_operative_notes', JSON.stringify(updated));
      RealtimeSyncService.publish('operative_notes', updated, currentUser.id);
    } catch (e) {
      console.error('Chyba zápisu operatívnych poznámok:', e);
    }
  };

  // Uloženie projektov pri zmene stavu projektovej úlohy
  const saveProjects = (updatedProjects: any[]) => {
    setProjects(updatedProjects);
    try {
      localStorage.setItem('say_clinic_projects', JSON.stringify(updatedProjects));
      RealtimeSyncService.publish('projects', updatedProjects, currentUser.id);
    } catch (e) {
      console.error('Chyba zápisu projektov:', e);
    }
  };

  // Synchronizácia nového priradenia pri zmene používateľa
  useEffect(() => {
    setSelectedAssigneeId(currentUser.id);
  }, [currentUser.id]);

  // Prepojenie projektových úloh priradených používateľovi do zoznamu úloh
  const projectTasksAsNotes = useMemo((): OperativeNote[] => {
    const list: OperativeNote[] = [];
    if (!Array.isArray(projects)) return list;

    projects.forEach((proj: any) => {
      if (!proj || !Array.isArray(proj.tasks)) return;
      proj.tasks.forEach((task: any) => {
        if (!task) return;
        const isMine = task.assignedToId === currentUser.id || task.createdById === currentUser.id;
        if (isMine) {
          list.push({
            id: `proj-task-${task.id}`,
            text: task.title,
            completed: Boolean(task.completed),
            completedAt: task.completedAt,
            createdById: task.createdById || proj.createdById || 'u1',
            createdByName: task.createdByName || proj.createdByName || 'Vedenie kliniky',
            assignedToId: task.assignedToId || currentUser.id,
            assignedToName: task.assignedToName || currentUser.name,
            createdAt: proj.createdAt || new Date().toISOString(),
            priority: (task.priority === 'urgent' || task.priority === 'high') ? task.priority : 'normal',
            source: 'project',
            projectId: proj.id,
            projectTitle: proj.title,
            taskId: task.id,
          });
        }
      });
    });
    return list;
  }, [projects, currentUser.id, currentUser.name]);

  // Kombinovaný zoznam poznámok a projektových úloh
  const allCombinedItems = useMemo(() => {
    return [...notes, ...projectTasksAsNotes];
  }, [notes, projectTasksAsNotes]);

  // 2. Filtrovanie
  const filteredNotes = useMemo(() => {
    return allCombinedItems.filter((n) => {
      const isCreatedByMe = n.createdById === currentUser.id;
      const isAssignedToMe = n.assignedToId === currentUser.id || n.assignedToId === 'all';

      if (!isCreatedByMe && !isAssignedToMe) {
        return false;
      }

      if (filterScope === 'assigned_to_me' && !isAssignedToMe) return false;
      if (filterScope === 'created_by_me' && !isCreatedByMe) return false;

      if (!showCompleted && n.completed) return false;

      return true;
    });
  }, [allCombinedItems, currentUser.id, filterScope, showCompleted]);

  // Počítadlá pre aktuálneho používateľa
  const counts = useMemo(() => {
    const myTotal = allCombinedItems.filter(n => n.createdById === currentUser.id || n.assignedToId === currentUser.id || n.assignedToId === 'all');
    const myActive = myTotal.filter(n => !n.completed);
    const myCompleted = myTotal.filter(n => n.completed);
    const assignedToMe = allCombinedItems.filter(n => (n.assignedToId === currentUser.id || n.assignedToId === 'all') && !n.completed);
    const createdByMe = allCombinedItems.filter(n => n.createdById === currentUser.id && !n.completed);

    return {
      total: myTotal.length,
      active: myActive.length,
      completed: myCompleted.length,
      assignedActive: assignedToMe.length,
      createdActive: createdByMe.length,
    };
  }, [allCombinedItems, currentUser.id]);

  // Označenie poznámky alebo projektovej úlohy ako splnenej / nesplnenej
  const handleToggleComplete = (item: OperativeNote) => {
    if (item.source === 'project' && item.projectId && item.taskId) {
      const updatedProjects = projects.map((p: any) => {
        if (p.id === item.projectId) {
          const updatedTasks = p.tasks.map((t: any) => {
            if (t.id === item.taskId) {
              const nextDone = !t.completed;
              return {
                ...t,
                completed: nextDone,
                completedAt: nextDone ? new Date().toISOString() : undefined,
              };
            }
            return t;
          });
          return { ...p, tasks: updatedTasks };
        }
        return p;
      });
      saveProjects(updatedProjects);
      return;
    }

    const updated = notes.map((n) => {
      if (n.id === item.id) {
        const nextCompleted = !n.completed;
        return {
          ...n,
          completed: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : undefined,
        };
      }
      return n;
    });
    saveNotes(updated);
  };

  // Zmena priority poznámky
  const handleChangePriority = (noteId: string, priority: 'normal' | 'high' | 'urgent') => {
    const updated = notes.map(n => n.id === noteId ? { ...n, priority } : n);
    saveNotes(updated);
    setContextMenu(prev => ({ ...prev, isOpen: false }));
  };

  // Pridanie novej poznámky
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    let assigneeName = 'Celý tím';
    if (selectedAssigneeId === currentUser.id) {
      assigneeName = currentUser.name;
    } else if (selectedAssigneeId !== 'all') {
      const user = SAY_CLINIC_USERS.find(u => u.id === selectedAssigneeId);
      if (user) assigneeName = user.name;
    }

    const newNoteItem: OperativeNote = {
      id: `op-${Date.now()}`,
      text: newNoteText.trim(),
      completed: false,
      createdById: currentUser.id,
      createdByName: currentUser.name,
      createdByRole: currentUser.role,
      assignedToId: selectedAssigneeId,
      assignedToName: assigneeName,
      createdAt: new Date().toISOString(),
      priority: newPriority,
      source: 'note',
    };

    saveNotes([newNoteItem, ...notes]);
    setNewNoteText('');
    setNewPriority('normal');
    setIsExpandedForm(false);
  };

  // Vymazanie poznámky
  const handleDeleteNote = (noteId: string) => {
    const updated = notes.filter(n => n.id !== noteId);
    saveNotes(updated);
    setContextMenu(prev => ({ ...prev, isOpen: false }));
  };

  // Konverzia na projekt
  const handleConvert = (note: OperativeNote) => {
    if (onConvertToProject) {
      onConvertToProject(note.text, note.id);
    }
    handleDeleteNote(note.id);
  };

  // Spracovanie pravého kliknutia (Right Click Context Menu)
  const handleContextMenu = (e: React.MouseEvent, note: OperativeNote) => {
    e.preventDefault();
    e.stopPropagation();
    const x = Math.min(e.clientX, window.innerWidth - 260);
    const y = Math.min(e.clientY, window.innerHeight - 280);
    setContextMenu({
      isOpen: true,
      x: Math.max(10, x),
      y: Math.max(10, y),
      note,
    });
  };

  return (
    <div className="bg-white border border-[#E8E2D9] rounded-2xl p-5 shadow-sm space-y-4">
      {/* Hlavička modulu s počítadlom */}
      <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-brand text-sm font-bold text-[#2C2A29] uppercase tracking-wide">
              Operatívne Poznámky
            </h3>
            {counts.active > 0 && (
              <span className="bg-[#C5A059] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                {counts.active} aktívnych
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#8C857B] mt-0.5">
            Zobrazené: <strong className="text-[#2C2A29]">vytvorené vami</strong> & <strong className="text-[#2C2A29]">pridelené vám</strong>
          </p>
        </div>

        {/* Prepínač zobrazenia dokončených */}
        <button
          type="button"
          onClick={() => setShowCompleted(!showCompleted)}
          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1 ${
            showCompleted 
              ? 'bg-[#FAF7F2] text-[#8C857B] border-[#E0D8C8] hover:border-[#C5A059]' 
              : 'bg-white text-[#C5A059] border-[#C5A059]/40'
          }`}
          title="Zobraziť alebo skryť splnené poznámky"
        >
          <CheckCircle2 className="w-3 h-3" />
          <span>{showCompleted ? 'Skryť hotové' : `Hotové (${counts.completed})`}</span>
        </button>
      </div>

      {/* Rýchle filtre: Všetky moje / Pridelené mne / Vytvorené mnou */}
      <div className="flex items-center gap-1.5 p-1 bg-[#FBF9F6] border border-[#E8E2D9] rounded-xl text-xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setFilterScope('all_mine')}
          className={`flex-1 min-w-[110px] py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all text-center flex items-center justify-center gap-1 ${
            filterScope === 'all_mine'
              ? 'bg-[#2C2A29] text-white shadow-xs'
              : 'text-[#8C857B] hover:text-[#2C2A29]'
          }`}
        >
          <span>Všetky moje</span>
          <span className="text-[9px] opacity-75">({counts.active})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterScope('assigned_to_me')}
          className={`flex-1 min-w-[110px] py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all text-center flex items-center justify-center gap-1 ${
            filterScope === 'assigned_to_me'
              ? 'bg-[#C5A059] text-white shadow-xs'
              : 'text-[#8C857B] hover:text-[#2C2A29]'
          }`}
        >
          <span>📥 Pridelené mne</span>
          <span className="text-[9px] opacity-75">({counts.assignedActive})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterScope('created_by_me')}
          className={`flex-1 min-w-[110px] py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all text-center flex items-center justify-center gap-1 ${
            filterScope === 'created_by_me'
              ? 'bg-[#4A4036] text-white shadow-xs'
              : 'text-[#8C857B] hover:text-[#2C2A29]'
          }`}
        >
          <span>📤 Vytvorené mnou</span>
          <span className="text-[9px] opacity-75">({counts.createdActive})</span>
        </button>
      </div>

      {/* Formulár pre pridanie novej poznámky */}
      <form onSubmit={handleAddNote} className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Pridať operatívnu pripomienku alebo úlohu..."
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            onFocus={() => setIsExpandedForm(true)}
            className="flex-1 border border-[#E8E2D9] p-2.5 rounded-xl text-xs bg-[#FBF9F6] outline-none focus:border-[#C5A059] focus:bg-white transition-all placeholder:text-[#8C857B]"
          />
          <button
            type="submit"
            disabled={!newNoteText.trim()}
            className="bg-[#C5A059] hover:bg-[#A88440] disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1 shadow-xs flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pridať</span>
          </button>
        </div>

        {/* Rozšírené možnosti: Komu prideliť & Priorita */}
        {isExpandedForm && (
          <div className="p-3 bg-[#FAF7F2] border border-[#E0D8C8] rounded-xl space-y-2.5 text-xs animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              {/* Komu prideliť */}
              <div className="flex items-center gap-2 flex-1">
                <label className="text-[10px] uppercase font-bold text-[#8C857B] flex items-center gap-1 whitespace-nowrap">
                  <User className="w-3 h-3" /> Komu prideliť:
                </label>
                <select
                  value={selectedAssigneeId}
                  onChange={(e) => setSelectedAssigneeId(e.target.value)}
                  className="bg-white border border-[#D5CEBF] rounded-lg px-2.5 py-1 text-xs font-medium text-[#2C2A29] outline-none focus:border-[#C5A059] flex-1 max-w-[240px]"
                >
                  <option value={currentUser.id}>👤 Mne ({currentUser.name})</option>
                  <option value="all">👥 Celý tím kliniky</option>
                  <optgroup label="Lekári a chirurgia">
                    {SAY_CLINIC_USERS.filter(u => u.role === 'doctor' || u.role === 'ceo').map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.title})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Manažment & Recepcia">
                    {SAY_CLINIC_USERS.filter(u => u.role === 'manager').map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.title})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Sestry & Operačná sála">
                    {SAY_CLINIC_USERS.filter(u => u.role === 'nurse').map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.title})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Priorita */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] uppercase font-bold text-[#8C857B]">Priorita:</span>
                <button
                  type="button"
                  onClick={() => setNewPriority('normal')}
                  className={`px-2.5 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                    newPriority === 'normal'
                      ? 'bg-white text-[#2C2A29] border-[#2C2A29] shadow-2xs'
                      : 'bg-transparent text-[#8C857B] border-[#E0D8C8]'
                  }`}
                >
                  Štandard
                </button>
                <button
                  type="button"
                  onClick={() => setNewPriority('high')}
                  className={`px-2.5 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                    newPriority === 'high'
                      ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs font-extrabold'
                      : 'bg-transparent text-[#8C857B] border-[#E0D8C8]'
                  }`}
                >
                  ⚡ Vysoká
                </button>
                <button
                  type="button"
                  onClick={() => setNewPriority('urgent')}
                  className={`px-2.5 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                    newPriority === 'urgent'
                      ? 'bg-rose-100 text-rose-800 border-rose-400 shadow-2xs font-extrabold'
                      : 'bg-transparent text-[#8C857B] border-[#E0D8C8]'
                  }`}
                >
                  🔥 Urgentné
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center pt-1 border-t border-[#E8E2D9]">
              <span className="text-[10px] text-[#8C857B]">
                Zadal: <strong className="text-[#2C2A29]">{currentUser.name}</strong>
              </span>
              <button
                type="button"
                onClick={() => setIsExpandedForm(false)}
                className="text-[10px] text-[#8C857B] hover:text-[#2C2A29] underline cursor-pointer"
              >
                Zavrieť možnosti
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Zoznam poznámok */}
      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-0.5 relative">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-8 text-[#8C857B] text-xs italic bg-[#FBF9F6] rounded-xl border border-[#E8E2D9] px-4 space-y-1">
            <p>Žiadne operatívne poznámky v tomto zobrazení.</p>
            <p className="text-[10px] text-[#B0A79B] not-italic">
              Zobrazujú sa tu všetky pripomienky, ktoré ste vytvorili, alebo ktoré vám tím pridelil.
            </p>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const isCreatedByMe = note.createdById === currentUser.id;
            const isAssignedToMe = note.assignedToId === currentUser.id;
            const isAssignedToAll = note.assignedToId === 'all';
            const isPersonal = isCreatedByMe && isAssignedToMe;
            const isProject = note.source === 'project';

            return (
              <div
                key={note.id}
                onContextMenu={(e) => handleContextMenu(e, note)}
                className={`p-3 rounded-xl border transition-all flex items-start gap-3 group relative select-none cursor-default ${
                  note.completed
                    ? 'bg-[#F9F8F6] border-[#EBE6DF] opacity-70'
                    : note.priority === 'urgent'
                    ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
                    : note.priority === 'high'
                    ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
                    : 'bg-[#FBF9F6] border-[#E8E2D9] hover:border-[#C5A059] hover:bg-white'
                }`}
                title="Pravým kliknutím otvoríte možnosti poznámky"
              >
                {/* 1. TLAČIDLO PRE OZNAČENIE AKO SPLNENÉ */}
                <button
                  type="button"
                  onClick={() => handleToggleComplete(note)}
                  title={note.completed ? 'Označiť ako nesplnené' : 'Označiť ako splnené'}
                  className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                    note.completed
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-[#C5A059] bg-white hover:bg-[#C5A059]/10 text-transparent hover:text-[#C5A059]'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </button>

                {/* 2. OBSAH POZNÁMKY */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-xs font-medium leading-snug break-words ${
                        note.completed
                          ? 'line-through text-[#8C857B]'
                          : 'text-[#2C2A29]'
                      }`}
                    >
                      {note.text}
                    </p>

                    {/* Odznak priority */}
                    {note.priority === 'urgent' && !note.completed ? (
                      <span className="flex-shrink-0 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-0.5">
                        <AlertCircle className="w-2.5 h-2.5" /> Urgent
                      </span>
                    ) : note.priority === 'high' && !note.completed ? (
                      <span className="flex-shrink-0 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-0.5">
                        <Flame className="w-2.5 h-2.5 text-amber-600" /> Vysoká
                      </span>
                    ) : null}
                  </div>

                  {/* Štítky pôvodu a pridelenia */}
                  <div className="flex items-center gap-1.5 flex-wrap text-[9px]">
                    {/* Odznak projektu */}
                    {isProject && (
                      <span className="bg-sky-50 text-sky-800 border border-sky-300 font-bold px-1.5 py-0.2 rounded-md flex items-center gap-1">
                        <FolderKanban className="w-2.5 h-2.5 text-sky-600" />
                        <span>Projekt: {note.projectTitle || 'Poverenie'}</span>
                      </span>
                    )}

                    {/* Stav pridelenia */}
                    {isPersonal ? (
                      <span className="bg-purple-100 text-purple-900 border border-purple-200 font-bold px-1.5 py-0.2 rounded-md">
                        👤 Moja osobná
                      </span>
                    ) : isAssignedToMe ? (
                      <span className="bg-amber-100 text-amber-900 border border-amber-200 font-bold px-1.5 py-0.2 rounded-md flex items-center gap-1">
                        <span>📥 Pridelené mne</span>
                        <span className="opacity-75 font-normal">od {note.createdByName}</span>
                      </span>
                    ) : isCreatedByMe ? (
                      <span className="bg-sky-100 text-sky-900 border border-sky-200 font-bold px-1.5 py-0.2 rounded-md flex items-center gap-1">
                        <span>📤 Zadal som</span>
                        <span className="opacity-75 font-normal">pre {note.assignedToName}</span>
                      </span>
                    ) : isAssignedToAll ? (
                      <span className="bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold px-1.5 py-0.2 rounded-md">
                        👥 Celý tím
                      </span>
                    ) : null}

                    {/* Čas splnenia / vytvorenia */}
                    {note.completed ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                        ✓ Splnené
                      </span>
                    ) : (
                      <span className="text-[#8C857B] flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(note.createdAt).toLocaleDateString('sk-SK', { day: 'numeric', month: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>

                {/* 3. AKCIE: PREMENIŤ NA PROJEKT / VYMAZAŤ */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!note.completed && !isProject && (
                    <button
                      type="button"
                      onClick={() => handleConvert(note)}
                      title="Premeniť túto poznámku na projekt / delegované poverenie"
                      className="text-[9px] bg-[#C5A059] hover:bg-[#9C7D3D] text-white px-2 py-1 rounded-md font-bold transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Briefcase className="w-2.5 h-2.5" />
                      <span className="hidden sm:inline">+ Projekt</span>
                    </button>
                  )}

                  {!isProject && (
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note.id)}
                      title="Odstrániť poznámku"
                      className="text-[#8C857B] hover:text-rose-600 font-bold p-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* PLÁVAJÚCE KONTEXTOVÉ MENU (RIGHT CLICK) PRE POZNÁMKU */}
      {contextMenu.isOpen && contextMenu.note && (
        <div
          ref={contextMenuRef}
          className="fixed z-[160] w-64 bg-white/98 backdrop-blur-xl border border-[#E8E2D9] rounded-2xl shadow-[0_20px_50px_rgba(44,42,41,0.22)] overflow-hidden text-xs text-[#2C2A29] flex flex-col animate-in fade-in zoom-in-95 duration-150 select-none"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* HLAVIČKA MENU */}
          <div className="px-3.5 py-2.5 bg-[#2C2A29] text-white border-b border-[#3E3A37]">
            <p className="font-bold text-xs truncate text-white">
              {contextMenu.note.text}
            </p>
            <div className="text-[10px] text-[#C5A059] mt-0.5 flex items-center justify-between">
              <span>{contextMenu.note.source === 'project' ? 'Úloha z projektu' : 'Operatívna poznámka'}</span>
              <span>{contextMenu.note.priority ? `Priorita: ${contextMenu.note.priority}` : ''}</span>
            </div>
          </div>

          <div className="p-1.5 space-y-0.5">
            {/* Stav splnenia */}
            <button
              type="button"
              onClick={() => {
                if (contextMenu.note) handleToggleComplete(contextMenu.note);
                setContextMenu(prev => ({ ...prev, isOpen: false }));
              }}
              className="w-full px-3 py-2 rounded-xl text-left font-semibold hover:bg-[#FAF8F5] flex items-center gap-2.5 transition-colors cursor-pointer text-[#2C2A29]"
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${contextMenu.note.completed ? 'text-[#8C857B]' : 'text-emerald-600'}`} />
              <span>{contextMenu.note.completed ? 'Označiť ako aktívne (nesplnené)' : 'Označiť ako splnené'}</span>
            </button>

            {/* Zmena priority (len pre bežné poznámky) */}
            {contextMenu.note.source !== 'project' && (
              <div className="px-3 py-1.5 border-t border-b border-[#E8E2D9]/60 my-1">
                <span className="text-[9px] uppercase tracking-wider font-bold text-[#8C857B] block mb-1">
                  Zmeniť prioritu:
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => contextMenu.note && handleChangePriority(contextMenu.note.id, 'normal')}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                      contextMenu.note.priority === 'normal'
                        ? 'bg-[#2C2A29] text-white border-[#2C2A29]'
                        : 'bg-white text-[#6B6357] border-[#E8E2D9] hover:border-[#C5A059]'
                    }`}
                  >
                    Štandard
                  </button>
                  <button
                    type="button"
                    onClick={() => contextMenu.note && handleChangePriority(contextMenu.note.id, 'high')}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                      contextMenu.note.priority === 'high'
                        ? 'bg-amber-100 text-amber-900 border-amber-400'
                        : 'bg-white text-amber-800 border-[#E8E2D9] hover:border-amber-300'
                    }`}
                  >
                    Vysoká
                  </button>
                  <button
                    type="button"
                    onClick={() => contextMenu.note && handleChangePriority(contextMenu.note.id, 'urgent')}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                      contextMenu.note.priority === 'urgent'
                        ? 'bg-rose-100 text-rose-800 border-rose-400'
                        : 'bg-white text-rose-700 border-[#E8E2D9] hover:border-rose-300'
                    }`}
                  >
                    Urgent
                  </button>
                </div>
              </div>
            )}

            {/* Premeniť na projekt */}
            {contextMenu.note.source !== 'project' && !contextMenu.note.completed && (
              <button
                type="button"
                onClick={() => {
                  if (contextMenu.note) handleConvert(contextMenu.note);
                  setContextMenu(prev => ({ ...prev, isOpen: false }));
                }}
                className="w-full px-3 py-2 rounded-xl text-left font-semibold hover:bg-amber-50 text-amber-900 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Briefcase className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Premeniť na projekt / delegovať</span>
              </button>
            )}

            {/* Kopírovať text */}
            <button
              type="button"
              onClick={() => {
                if (contextMenu.note) {
                  navigator.clipboard.writeText(contextMenu.note.text);
                }
                setContextMenu(prev => ({ ...prev, isOpen: false }));
              }}
              className="w-full px-3 py-2 rounded-xl text-left font-semibold hover:bg-[#FAF8F5] flex items-center gap-2.5 transition-colors cursor-pointer text-[#2C2A29]"
            >
              <Copy className="w-3.5 h-3.5 text-[#8C857B]" />
              <span>Kopírovať text úlohy</span>
            </button>

            {/* Vymazať poznámku */}
            {contextMenu.note.source !== 'project' && (
              <div className="pt-1 border-t border-[#E8E2D9]/80">
                <button
                  type="button"
                  onClick={() => {
                    if (contextMenu.note) handleDeleteNote(contextMenu.note.id);
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left font-semibold hover:bg-rose-50 text-rose-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Odstrániť poznámku</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Odkaz na projektový manažment */}
      <div className="pt-2 border-t border-[#E8E2D9] flex items-center justify-between text-xs">
        <span className="text-[#8C857B] text-[11px]">
          Plné delegovanie tímových úloh:
        </span>
        <button
          type="button"
          onClick={onOpenProjects}
          className="font-bold text-[#C5A059] hover:text-[#9C7D3D] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>Projekty & Sála (CEO)</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}
