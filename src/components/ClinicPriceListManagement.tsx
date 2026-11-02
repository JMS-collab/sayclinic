'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Tag, 
  Plus, 
  Printer, 
  Download, 
  Filter, 
  Check, 
  Copy, 
  Edit2, 
  Trash2, 
  RotateCcw,
  Sparkles,
  Layers,
  ChevronDown,
  X,
  ArrowUpDown
} from 'lucide-react';
import { CLINIC_PRICE_LIST, ClinicPriceItem } from '../data/clinicPriceList';
import { UserAccount } from './LoginForm';

interface ClinicPriceListManagementProps {
  currentUser?: UserAccount;
}

const CATEGORY_TABS: { id: string; label: string; icon: string }[] = [
  { id: 'all', label: 'Všetky položky', icon: '✨' },
  { id: 'face_surgery', label: 'Chirurgia tváre & krku', icon: '👤' },
  { id: 'breast_surgery', label: 'Chirurgia prsníkov', icon: '👙' },
  { id: 'body_contouring_liposuction', label: 'Telo & Liposukcia', icon: '🩺' },
  { id: 'injectables_aesthetics', label: 'Injekčná estetika', icon: '💉' },
  { id: 'hand_surgery', label: 'Chirurgia ruky', icon: '✋' },
  { id: 'dermatosurgery', label: 'Dermatochirurgia', icon: '🔬' },
  { id: 'consultation_stay', label: 'Konzultácie & Pobyt', icon: '🏥' },
  { id: 'compression_garments', label: 'Lipoelastic bielizeň', icon: '👗' },
  { id: 'diagnostics', label: 'Vyšetrenia', icon: '📋' },
];

export const ClinicPriceListManagement: React.FC<ClinicPriceListManagementProps> = ({ currentUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'category' | 'price_asc' | 'price_desc' | 'name'>('category');
  
  // Custom prices / items override from localStorage
  const [items, setItems] = useState<ClinicPriceItem[]>(CLINIC_PRICE_LIST);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ClinicPriceItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // New item form state
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState<number>(100);
  const [newItemCategory, setNewItemCategory] = useState<ClinicPriceItem['category']>('injectables_aesthetics');

  // Load any overrides from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('say_clinic_custom_price_list');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
        }
      }
    } catch {
      // fallback to initial
    }
  }, []);

  // Save changes to localStorage
  const saveItems = (updated: ClinicPriceItem[]) => {
    setItems(updated);
    try {
      localStorage.setItem('say_clinic_custom_price_list', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Reset to default
  const handleResetToDefault = () => {
    if (confirm('Naozaj chcete resetovať cenník na pôvodné výrobné hodnoty SAY CLINIC?')) {
      setItems(CLINIC_PRICE_LIST);
      localStorage.removeItem('say_clinic_custom_price_list');
    }
  };

  // Handle edit price
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const updated = items.map(item => item.id === editingItem.id ? editingItem : item);
    saveItems(updated);
    setEditingItem(null);
  };

  // Handle add item
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || newItemPrice <= 0) return;

    const matchedCat = CATEGORY_TABS.find(c => c.id === newItemCategory);
    const newItem: ClinicPriceItem = {
      id: `custom_${Date.now()}`,
      name: newItemName.trim(),
      price: newItemPrice,
      currency: '€',
      category: newItemCategory,
      categoryLabel: matchedCat ? matchedCat.label : 'Iné',
    };

    saveItems([newItem, ...items]);
    setNewItemName('');
    setNewItemPrice(100);
    setIsAddModalOpen(false);
  };

  // Handle delete item
  const handleDeleteItem = (id: string) => {
    if (confirm('Odstrániť túto položku z cenníka?')) {
      saveItems(items.filter(i => i.id !== id));
    }
  };

  // Copy item info to clipboard
  const handleCopy = (item: ClinicPriceItem) => {
    navigator.clipboard.writeText(`${item.name} — ${item.price.toLocaleString('sk-SK')} €`);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered & sorted items
  const filteredItems = useMemo(() => {
    return items
      .filter(item => {
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch = 
          !query ||
          item.name.toLowerCase().includes(query) ||
          item.categoryLabel.toLowerCase().includes(query) ||
          item.price.toString().includes(query);
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.price - b.price;
        if (sortBy === 'price_desc') return b.price - a.price;
        if (sortBy === 'name') return a.name.localeCompare(b.name, 'sk');
        return a.category.localeCompare(b.category);
      });
  }, [items, selectedCategory, searchQuery, sortBy]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = { all: items.length };
    items.forEach(i => {
      map[i.category] = (map[i.category] || 0) + 1;
    });
    return map;
  }, [items]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Názov výkonu', 'Kategória', 'Cena (€)'];
    const rows = items.map(i => [
      `"${i.name.replace(/"/g, '""')}"`,
      `"${i.categoryLabel.replace(/"/g, '""')}"`,
      i.price
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SAY_CLINIC_Cennik_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* 1. TOP HEADER & HERO CARDS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#C5A059]">
              <Tag className="w-5 h-5" />
            </span>
            <h3 className="font-brand text-xl font-bold text-[#2C2A29] uppercase tracking-wider">
              Oficiálny Cenník Kliniky SAY CLINIC
            </h3>
          </div>
          <p className="text-xs text-[#8C857B]">
            Kompletný zoznam výkonov, plastických operácií, estetických procedúr a pooperačnej starostlivosti.
          </p>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2C2A29] hover:bg-[#1E1C1B] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#C5A059]" />
            <span>Pridať položku</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#F4EEE6] text-[#2C2A29] border border-[#E8E2D9] text-xs font-semibold transition-all cursor-pointer"
            title="Exportovať do Excelu (CSV)"
          >
            <Download className="w-3.5 h-3.5 text-[#8C857B]" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#F4EEE6] text-[#2C2A29] border border-[#E8E2D9] text-xs font-semibold transition-all cursor-pointer"
            title="Vytlačiť cenník"
          >
            <Printer className="w-3.5 h-3.5 text-[#8C857B]" />
            <span>Tlačiť</span>
          </button>

          <button
            type="button"
            onClick={handleResetToDefault}
            className="p-2 rounded-xl bg-[#FAF8F5] hover:bg-rose-50 text-[#8C857B] hover:text-rose-600 border border-[#E8E2D9] transition-all cursor-pointer"
            title="Obnoviť predvolený cenník SAY CLINIC"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. STATS PILLS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-[#E8E2D9] shadow-2xs">
          <span className="text-[10px] text-[#8C857B] uppercase font-bold tracking-wider block mb-0.5">Celkovo položiek</span>
          <span className="text-2xl font-bold font-brand text-[#2C2A29]">{items.length}</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#E8E2D9] shadow-2xs">
          <span className="text-[10px] text-[#8C857B] uppercase font-bold tracking-wider block mb-0.5">Kategórií</span>
          <span className="text-2xl font-bold font-brand text-[#C5A059]">{CATEGORY_TABS.length - 1}</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#E8E2D9] shadow-2xs">
          <span className="text-[10px] text-[#8C857B] uppercase font-bold tracking-wider block mb-0.5">Základná konzultácia</span>
          <span className="text-2xl font-bold font-brand text-[#2C2A29]">50 €</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#E8E2D9] shadow-2xs">
          <span className="text-[10px] text-[#8C857B] uppercase font-bold tracking-wider block mb-0.5">Cenový rozsah</span>
          <span className="text-lg font-bold font-brand text-[#2C2A29]">20 € — 6 000 €</span>
        </div>
      </div>

      {/* 3. SEARCH & CATEGORY FILTERS */}
      <div className="space-y-3 bg-white p-4 rounded-3xl border border-[#E8E2D9] shadow-xs">
        
        {/* TOP ROW: SEARCH & SORT */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C857B]" />
            <input
              type="text"
              placeholder="Hľadať výkon (napr. facelift, viečka, botox, lipoelastic, augmentácia)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] focus:outline-none focus:border-[#C5A059] text-[#2C2A29]"
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C857B] hover:text-[#2C2A29]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-xs text-[#2C2A29]">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#8C857B]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-semibold outline-none cursor-pointer"
              >
                <option value="category">Zoradiť: Kategória</option>
                <option value="price_desc">Cena: Najvyššia prvá</option>
                <option value="price_asc">Cena: Najnižšia prvá</option>
                <option value="name">Názov: Abecedne (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* BOTTOM ROW: CATEGORY PILLS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {CATEGORY_TABS.map((tab) => {
            const count = categoryCounts[tab.id] || 0;
            const isSelected = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#2C2A29] text-white shadow-2xs'
                    : 'bg-[#FAF8F5] text-[#8C857B] hover:text-[#2C2A29] border border-[#E8E2D9]'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${isSelected ? 'bg-white/20 text-white' : 'bg-[#E8E2D9]/60 text-[#8C857B]'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. ITEMS TABLE */}
      <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#E8E2D9] text-[10px] text-[#8C857B] uppercase font-bold tracking-wider">
                <th className="py-3 px-5">Položka / Výkon</th>
                <th className="py-3 px-4">Kategória</th>
                <th className="py-3 px-5 text-right">Cena s DPH</th>
                <th className="py-3 px-4 text-center w-28">Akcie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D9]/60 text-xs">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[#8C857B]">
                    Nenašli sa žiadne položky zodpovedajúce filtru „{searchQuery}“.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isCopied = copiedId === item.id;
                  return (
                    <tr 
                      key={item.id}
                      className="hover:bg-[#FAF8F5]/80 transition-colors group"
                    >
                      <td className="py-3 px-5 font-semibold text-[#2C2A29]">
                        <div className="flex items-center gap-2">
                          <span>{item.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-semibold bg-[#FAF8F5] text-[#8C857B] border border-[#E8E2D9]">
                          {item.categoryLabel}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-right font-bold font-brand text-sm text-[#2C2A29]">
                        {item.price.toLocaleString('sk-SK')} €
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          
                          {/* COPY QUICK BUTTON */}
                          <button
                            type="button"
                            onClick={() => handleCopy(item)}
                            className="p-1.5 rounded-lg hover:bg-white text-[#8C857B] hover:text-[#2C2A29] transition-colors cursor-pointer"
                            title="Skopírovať názov a cenu"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>

                          {/* EDIT BUTTON */}
                          <button
                            type="button"
                            onClick={() => setEditingItem(item)}
                            className="p-1.5 rounded-lg hover:bg-white text-[#8C857B] hover:text-[#C5A059] transition-colors cursor-pointer"
                            title="Upraviť cenu alebo názov"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* DELETE BUTTON (IF CUSTOM) */}
                          {item.id.startsWith('custom_') && (
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-[#8C857B] hover:text-rose-600 transition-colors cursor-pointer"
                              title="Vymazať položku"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. EDIT MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-[#E8E2D9] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-3">
              <h4 className="font-bold text-sm text-[#2C2A29] uppercase tracking-wider">
                Upraviť položku cenníka
              </h4>
              <button 
                type="button" 
                onClick={() => setEditingItem(null)}
                className="text-[#8C857B] hover:text-[#2C2A29]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[#8C857B] uppercase block mb-1">
                  Názov výkonu / služby
                </label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] focus:outline-none focus:border-[#C5A059] text-[#2C2A29]"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#8C857B] uppercase block mb-1">
                  Cena v € (s DPH)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={editingItem.price}
                  onChange={(e) => setEditingItem({ ...editingItem, price: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] focus:outline-none focus:border-[#C5A059] text-[#2C2A29] font-bold"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E2D9]">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8C857B] hover:text-[#2C2A29]"
                >
                  Zrušiť
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2C2A29] hover:bg-[#1E1C1B] text-white text-xs font-bold transition-all shadow-xs"
                >
                  Uložiť zmenu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. ADD NEW ITEM MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-[#E8E2D9] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-3">
              <h4 className="font-bold text-sm text-[#2C2A29] uppercase tracking-wider">
                Pridať nový výkon do cenníka
              </h4>
              <button 
                type="button" 
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#8C857B] hover:text-[#2C2A29]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[#8C857B] uppercase block mb-1">
                  Názov výkonu / preparátu
                </label>
                <input
                  type="text"
                  placeholder="napr. Kombinovaný peeling s mezoterapiou"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] focus:outline-none focus:border-[#C5A059] text-[#2C2A29]"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#8C857B] uppercase block mb-1">
                  Kategória
                </label>
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] focus:outline-none focus:border-[#C5A059] text-[#2C2A29] cursor-pointer"
                >
                  {CATEGORY_TABS.filter(c => c.id !== 'all').map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#8C857B] uppercase block mb-1">
                  Cena v € (s DPH)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] focus:outline-none focus:border-[#C5A059] text-[#2C2A29] font-bold"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E2D9]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8C857B] hover:text-[#2C2A29]"
                >
                  Zrušiť
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2C2A29] hover:bg-[#1E1C1B] text-white text-xs font-bold transition-all shadow-xs"
                >
                  Pridať položku
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ClinicPriceListManagement;
