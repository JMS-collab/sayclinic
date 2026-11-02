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
  ArrowUpDown,
  Gift,
  ShieldCheck,
  Clock,
  Percent,
  CheckCircle2,
  Info,
  SlidersHorizontal,
  Flame,
  Award
} from 'lucide-react';
import { 
  CLINIC_PRICE_LIST, 
  CLINIC_PACKAGES, 
  ClinicPriceItem, 
  ClinicPackageItem,
  ClinicPriceCategory,
  calculateLoyaltyPrice,
  isSurgeryCategory
} from '../data/clinicPriceList';
import { UserAccount } from './LoginForm';

interface ClinicPriceListManagementProps {
  currentUser?: UserAccount;
}

const CATEGORY_TABS: { id: string; label: string; icon: string }[] = [
  { id: 'all', label: 'Všetky položky', icon: '✨' },
  { id: 'laser_devices', label: 'Lasery & Prístroje', icon: '⚡' },
  { id: 'injectables_aesthetics', label: 'Injekčná estetika', icon: '💉' },
  { id: 'skincare_cosmetics', label: 'Skincare & Kozmetika', icon: '🧴' },
  { id: 'physio_lymph_massage', label: 'Lymfodrenáže & Masáže', icon: '💆‍♀️' },
  { id: 'face_surgery', label: 'Chirurgia tváre & krku', icon: '👤' },
  { id: 'breast_surgery', label: 'Chirurgia prsníkov', icon: '👙' },
  { id: 'body_contouring_liposuction', label: 'Telo & Liposukcia', icon: '🩺' },
  { id: 'dermatosurgery', label: 'Dermatochirurgia', icon: '🔬' },
  { id: 'hand_surgery', label: 'Chirurgia ruky', icon: '✋' },
  { id: 'compression_garments', label: 'Lipoelastic bielizeň', icon: '👗' },
  { id: 'consultation_stay', label: 'Konzultácia & Pobyt', icon: '🏥' },
  { id: 'diagnostics', label: 'Vyšetrenia', icon: '📋' },
];

const PACKAGE_CATEGORIES: { id: string; label: string }[] = [
  { id: 'all', label: 'Všetky balíky' },
  { id: 'postop_care', label: 'Pooperačná starostlivosť & NPWT' },
  { id: 'surgery', label: 'Sálové kombinované operácie' },
  { id: 'periorbital', label: 'Očné viečka & Okolie' },
  { id: 'laser_skin', label: 'Lasery & Pleť' },
  { id: 'injectables', label: 'Biostimulátory & Injekcie' },
  { id: 'skincare', label: 'Skincare & Bariéra' },
];

export const ClinicPriceListManagement: React.FC<ClinicPriceListManagementProps> = ({ currentUser }) => {
  // Navigation: Items list vs. Packages
  const [activeView, setActiveView] = useState<'items' | 'packages'>('items');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPackageCategory, setSelectedPackageCategory] = useState('all');
  const [selectedPackageTier, setSelectedPackageTier] = useState<'all' | 'basic' | 'premium'>('all');
  const [sortBy, setSortBy] = useState<'category' | 'price_asc' | 'price_desc' | 'name'>('category');

  // Loyalty View State: 'all' shows all 3 tiers columns, or single tier
  const [selectedLoyaltyTier, setSelectedLoyaltyTier] = useState<'all_columns' | 'basic' | 'premium' | 'vip'>('all_columns');

  // Items State (persisted to localStorage)
  const [items, setItems] = useState<ClinicPriceItem[]>(CLINIC_PRICE_LIST);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [editingItem, setEditingItem] = useState<ClinicPriceItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add Item Form State
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState<number>(100);
  const [newItemCategory, setNewItemCategory] = useState<ClinicPriceCategory>('injectables_aesthetics');
  const [newItemDescription, setNewItemDescription] = useState('');

  // Show Toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load overrides from localStorage
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
      // fallback
    }
  }, []);

  // Save changes to localStorage & notify system
  const saveItems = (updated: ClinicPriceItem[]) => {
    setItems(updated);
    try {
      localStorage.setItem('say_clinic_custom_price_list', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('say_clinic_pricelist_changed', { detail: updated }));
    } catch {
      // ignore
    }
  };

  // Reset to Factory Default
  const handleResetToDefault = () => {
    if (confirm('Naozaj chcete obnoviť cenník SAY CLINIC na pôvodné výrobné hodnoty pre Banskú Bystricu? Všetky manuálne úpravy budú nahradené.')) {
      setItems(CLINIC_PRICE_LIST);
      localStorage.removeItem('say_clinic_custom_price_list');
      window.dispatchEvent(new CustomEvent('say_clinic_pricelist_changed', { detail: CLINIC_PRICE_LIST }));
      showToast('Cenník bol úspešne obnovený na oficiálne hodnoty SAY CLINIC.');
    }
  };

  // Handle Edit Save
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const updated = items.map(item => item.id === editingItem.id ? editingItem : item);
    saveItems(updated);
    setEditingItem(null);
    showToast(`Položka "${editingItem.name}" bola úspešne upravená.`);
  };

  // Handle Add Item
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || newItemPrice <= 0) return;

    const matchedCat = CATEGORY_TABS.find(c => c.id === newItemCategory);
    const isSurgery = isSurgeryCategory(newItemCategory);

    const newItem: ClinicPriceItem = {
      id: `custom_${Date.now()}`,
      name: newItemName.trim(),
      price: newItemPrice,
      currency: '€',
      category: newItemCategory,
      categoryLabel: matchedCat ? matchedCat.label : 'Iné',
      description: newItemDescription.trim() || undefined,
      isSurgery
    };

    saveItems([newItem, ...items]);
    setNewItemName('');
    setNewItemPrice(100);
    setNewItemDescription('');
    setIsAddModalOpen(false);
    showToast(`Položka "${newItem.name}" bola pridaná do cenníka.`);
  };

  // Handle Delete ANY Item (Allowed as requested by user)
  const handleDeleteItem = (itemToDelete: ClinicPriceItem) => {
    if (confirm(`Naozaj chcete vymazať položku "${itemToDelete.name}" z cenníka kliniky?`)) {
      const updated = items.filter(i => i.id !== itemToDelete.id);
      saveItems(updated);
      showToast(`Položka "${itemToDelete.name}" bola odstránená.`);
    }
  };

  // Copy quick info
  const handleCopy = (item: ClinicPriceItem) => {
    const pPrem = calculateLoyaltyPrice(item.price, item.category, 'premium');
    const pVip = calculateLoyaltyPrice(item.price, item.category, 'vip');
    const text = item.isSurgery 
      ? `${item.name} — ${item.price.toLocaleString('sk-SK')} € (Sálový výkon)`
      : `${item.name} — Basic: ${item.price} € | Premium (-5%): ${pPrem} € | VIP (-10%): ${pVip} €`;
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Copy Package Offer for Reception/Client
  const handleCopyPackageOffer = (pkg: ClinicPackageItem) => {
    const premPrice = calculateLoyaltyPrice(pkg.price, 'package', 'premium');
    const vipPrice = calculateLoyaltyPrice(pkg.price, 'package', 'vip');

    let text = `✨ SAY CLINIC — Cenová ponuka: ${pkg.name}\n`;
    text += `Úroveň: ${pkg.tier === 'premium' ? 'PREMIUM' : 'BASIC'}\n`;
    text += `Popis: ${pkg.description}\n\n`;
    text += `Zahrnuté výkony a starostlivosť:\n`;
    pkg.includedItems.forEach((inc, idx) => {
      text += `  ${idx + 1}. ${inc}\n`;
    });
    text += `\nCena balíka:\n`;
    text += `• Štandardná hodnota: ${pkg.regularPrice.toLocaleString('sk-SK')} €\n`;
    text += `• Zvýhodnená balíková cena: ${pkg.price.toLocaleString('sk-SK')} € (Úspora pre Vás: –${pkg.savings} €)\n`;
    if (!pkg.isSurgery) {
      text += `• Cena pre vernostného klienta Premium (–5 %): ${premPrice} €\n`;
      text += `• Cena pre vernostného klienta VIP (–10 %): ${vipPrice} €\n`;
    }
    text += `\nPlatnosť ponuky a kúr: 12 mesiacov. Konzultácie a objednávky: recepcia@sayclinic.sk`;

    navigator.clipboard.writeText(text);
    setCopiedId(pkg.id);
    showToast(`Ponuka balíka "${pkg.name}" bola skopírovaná do schránky pre klienta.`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return items
      .filter(item => {
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch = 
          !query ||
          item.name.toLowerCase().includes(query) ||
          item.categoryLabel.toLowerCase().includes(query) ||
          (item.description && item.description.toLowerCase().includes(query)) ||
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

  // Filtered packages
  const filteredPackages = useMemo(() => {
    return CLINIC_PACKAGES.filter(pkg => {
      const matchesCategory = selectedPackageCategory === 'all' || pkg.category === selectedPackageCategory;
      const matchesTier = selectedPackageTier === 'all' || pkg.tier === selectedPackageTier;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !query ||
        pkg.name.toLowerCase().includes(query) ||
        pkg.description.toLowerCase().includes(query) ||
        pkg.includedItems.some(i => i.toLowerCase().includes(query));
      return matchesCategory && matchesTier && matchesSearch;
    });
  }, [selectedPackageCategory, selectedPackageTier, searchQuery]);

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
    const headers = ['Názov položky / výkonu', 'Kategória', 'Základná cena (€)', 'Premium cena -5% (€)', 'VIP cena -10% (€)', 'Sálová operácia', 'Popis'];
    const rows = items.map(i => {
      const pPrem = calculateLoyaltyPrice(i.price, i.category, 'premium');
      const pVip = calculateLoyaltyPrice(i.price, i.category, 'vip');
      return [
        `"${i.name.replace(/"/g, '""')}"`,
        `"${i.categoryLabel.replace(/"/g, '""')}"`,
        i.price,
        pPrem,
        pVip,
        i.isSurgery ? 'Áno (Bez zľavy)' : 'Nie',
        `"${(i.description || '').replace(/"/g, '""')}"`
      ];
    });
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SAY_CLINIC_Cennik_BB_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* TOAST ALERT */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#2C2A29] text-white text-xs px-4 py-3 rounded-2xl shadow-xl border border-[#C5A059] animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-[#C5A059]" />
          <span>{toastMessage}</span>
        </div>
      )}

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
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E8E2D9] font-bold text-[#8C857B]">
              Banská Bystrica
            </span>
          </div>
          <p className="text-xs text-[#8C857B]">
            Správa cien, prístrojových ošetrení, plastických operácií, vernostných úrovní (Basic, Premium, VIP) a pooperačných balíkov.
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
            title="Exportovať cenník do Excelu (CSV)"
          >
            <Download className="w-3.5 h-3.5 text-[#8C857B]" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#F4EEE6] text-[#2C2A29] border border-[#E8E2D9] text-xs font-semibold transition-all cursor-pointer"
            title="Vytlačiť cenník pre recepciu"
          >
            <Printer className="w-3.5 h-3.5 text-[#8C857B]" />
            <span>Tlačiť</span>
          </button>

          <button
            type="button"
            onClick={handleResetToDefault}
            className="p-2 rounded-xl bg-[#FAF8F5] hover:bg-rose-50 text-[#8C857B] hover:text-rose-600 border border-[#E8E2D9] transition-all cursor-pointer"
            title="Obnoviť predvolený cenník SAY CLINIC (výrobné nastavenia)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. OPERATIONAL PROTOCOL & POLICY BANNER */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#FAF8F5] p-4 rounded-3xl border border-[#E8E2D9] text-xs">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
          <div>
            <strong className="text-[#2C2A29] block">Rezervačná záloha na sálu: 30 %</strong>
            <span className="text-[11px] text-[#8C857B]">Záväzná rezervácia termínu operácie; bezplatné preloženie do 14 dní pred výkonom.</span>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
          <div>
            <strong className="text-[#2C2A29] block">Reoperácie do 12 mes.: 350 €/h</strong>
            <span className="text-[11px] text-[#8C857B]">Korekcia vlastného výkonu: honorár chirurga je bezplatný, pacient hradí len réžiu sály a anestéziu.</span>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <Percent className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
          <div>
            <strong className="text-[#2C2A29] block">–10 % na estetické kombinácie</strong>
            <span className="text-[11px] text-[#8C857B]">Platí na Botox 2 a 3 oblasti, každý ďalší ml kyseliny hyalurónovej v sedení a kúry.</span>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
          <div>
            <strong className="text-[#2C2A29] block">Anestézia a pobyt extra</strong>
            <span className="text-[11px] text-[#8C857B]">Celková anestézia (130 €/h) a hospitalizácia (200 €/deň) sa kalkulujú do cenovej ponuky podľa dĺžky výkonu.</span>
          </div>
        </div>
      </div>

      {/* 3. MAIN VIEW SWITCHER: POLOŽKOVÝ CENNÍK VS. BALÍKY SLUŽIEB */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#E8E2D9] shadow-xs">
        <div className="flex items-center gap-1.5 bg-[#FAF8F5] p-1 rounded-xl border border-[#E8E2D9]">
          <button
            type="button"
            onClick={() => setActiveView('items')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeView === 'items'
                ? 'bg-[#2C2A29] text-white shadow-xs'
                : 'text-[#8C857B] hover:text-[#2C2A29]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>📋 Položkový cenník ({items.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('packages')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeView === 'packages'
                ? 'bg-[#2C2A29] text-white shadow-xs'
                : 'text-[#8C857B] hover:text-[#2C2A29]'
            }`}
          >
            <Gift className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>🎁 Balíky služieb & Zvýhodnené kombinácie ({CLINIC_PACKAGES.length})</span>
          </button>
        </div>

        {/* LOYALTY TIER FILTER SELECTOR */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#8C857B] font-bold uppercase hidden lg:inline">Vernostná úroveň:</span>
          <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#E8E2D9] text-xs">
            <button
              type="button"
              onClick={() => setSelectedLoyaltyTier('all_columns')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                selectedLoyaltyTier === 'all_columns'
                  ? 'bg-white text-[#2C2A29] shadow-xs border border-[#E8E2D9]'
                  : 'text-[#8C857B] hover:text-[#2C2A29]'
              }`}
            >
              Všetky úrovne
            </button>
            <button
              type="button"
              onClick={() => setSelectedLoyaltyTier('basic')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                selectedLoyaltyTier === 'basic'
                  ? 'bg-stone-200 text-stone-900 shadow-xs'
                  : 'text-[#8C857B] hover:text-[#2C2A29]'
              }`}
            >
              Basic (0%)
            </button>
            <button
              type="button"
              onClick={() => setSelectedLoyaltyTier('premium')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                selectedLoyaltyTier === 'premium'
                  ? 'bg-amber-100 text-amber-900 shadow-xs'
                  : 'text-[#8C857B] hover:text-[#2C2A29]'
              }`}
            >
              Premium (–5%)
            </button>
            <button
              type="button"
              onClick={() => setSelectedLoyaltyTier('vip')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                selectedLoyaltyTier === 'vip'
                  ? 'bg-[#2C2A29] text-[#C5A059] shadow-xs font-bold'
                  : 'text-[#8C857B] hover:text-[#2C2A29]'
              }`}
            >
              ★ VIP (–10%)
            </button>
          </div>
        </div>
      </div>

      {/* 4. VIEW 1: POLOŽKOVÝ CENNÍK */}
      {activeView === 'items' && (
        <div className="space-y-4">
          
          {/* SEARCH & CATEGORY FILTERS */}
          <div className="space-y-3 bg-white p-4 rounded-3xl border border-[#E8E2D9] shadow-xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C857B]" />
                <input
                  type="text"
                  placeholder="Hľadať výkon, preparát, laser alebo značku (napr. coolpeel, rejuran, botox, skinceuticals, facelift)..."
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

            {/* CATEGORY TABS SCROLLABLE */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              {CATEGORY_TABS.map((tab) => {
                const count = categoryCounts[tab.id] || 0;
                const isSelected = selectedCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedCategory(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
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

          {/* TABLE OF ITEMS */}
          <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F5] border-b border-[#E8E2D9] text-[10px] text-[#8C857B] uppercase font-bold tracking-wider">
                    <th className="py-3 px-5">Položka / Výkon kliniky</th>
                    <th className="py-3 px-4">Kategória</th>
                    
                    {selectedLoyaltyTier === 'all_columns' ? (
                      <>
                        <th className="py-3 px-4 text-right">Základná cena (Basic)</th>
                        <th className="py-3 px-4 text-right text-amber-900">Premium (–5 %)</th>
                        <th className="py-3 px-4 text-right text-[#C5A059]">VIP (–10 %)</th>
                      </>
                    ) : (
                      <th className="py-3 px-5 text-right">
                        Cena pre {selectedLoyaltyTier === 'basic' ? 'Basic' : selectedLoyaltyTier === 'premium' ? 'Premium (–5 %)' : 'VIP (–10 %)'}
                      </th>
                    )}

                    <th className="py-3 px-4 text-center w-28">Akcie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D9]/60 text-xs">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#8C857B]">
                        Nenašli sa žiadne položky zodpovedajúce filtru „{searchQuery}“.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const isCopied = copiedId === item.id;
                      const premPrice = calculateLoyaltyPrice(item.price, item.category, 'premium');
                      const vipPrice = calculateLoyaltyPrice(item.price, item.category, 'vip');

                      return (
                        <tr key={item.id} className="hover:bg-[#FAF8F5]/80 transition-colors group">
                          <td className="py-3 px-5 font-semibold text-[#2C2A29]">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span>{item.name}</span>
                                {item.isSurgery && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200 font-semibold" title="Na chirurgické výkony na sále sa neuplatňuje vernostná zľava">
                                    Sálový výkon
                                  </span>
                                )}
                              </div>
                              {item.description && (
                                <span className="text-[11px] text-[#8C857B] font-normal line-clamp-1 mt-0.5">
                                  {item.description}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-semibold bg-[#FAF8F5] text-[#8C857B] border border-[#E8E2D9]">
                              {item.categoryLabel}
                            </span>
                          </td>

                          {selectedLoyaltyTier === 'all_columns' ? (
                            <>
                              <td className="py-3 px-4 text-right font-bold font-brand text-sm text-[#2C2A29]">
                                {item.price.toLocaleString('sk-SK')} €
                              </td>
                              <td className="py-3 px-4 text-right font-semibold text-xs text-amber-900">
                                {item.isSurgery ? '—' : `${premPrice.toLocaleString('sk-SK')} €`}
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-xs text-[#C5A059]">
                                {item.isSurgery ? '—' : `${vipPrice.toLocaleString('sk-SK')} €`}
                              </td>
                            </>
                          ) : (
                            <td className="py-3 px-5 text-right font-bold font-brand text-sm text-[#2C2A29]">
                              {selectedLoyaltyTier === 'basic'
                                ? `${item.price.toLocaleString('sk-SK')} €`
                                : selectedLoyaltyTier === 'premium'
                                ? item.isSurgery ? `${item.price.toLocaleString('sk-SK')} €` : `${premPrice.toLocaleString('sk-SK')} €`
                                : item.isSurgery ? `${item.price.toLocaleString('sk-SK')} €` : `${vipPrice.toLocaleString('sk-SK')} €`
                              }
                            </td>
                          )}

                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => handleCopy(item)}
                                className="p-1.5 rounded-lg hover:bg-white text-[#8C857B] hover:text-[#2C2A29] transition-colors cursor-pointer"
                                title="Skopírovať názov a ceny pre klienta"
                              >
                                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>

                              <button
                                type="button"
                                onClick={() => setEditingItem(item)}
                                className="p-1.5 rounded-lg hover:bg-white text-[#8C857B] hover:text-[#C5A059] transition-colors cursor-pointer"
                                title="Upraviť cenu, názov alebo kategóriu"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item)}
                                className="p-1.5 rounded-lg hover:bg-rose-50 text-[#8C857B] hover:text-rose-600 transition-colors cursor-pointer"
                                title="Odstrániť položku z cenníka"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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
        </div>
      )}

      {/* 5. VIEW 2: BALÍKY SLUŽIEB & ZVÝHODNENÉ KOMBINÁCIE (Basic vs. Premium) */}
      {activeView === 'packages' && (
        <div className="space-y-4">
          
          {/* PACKAGE FILTERS */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-[#E8E2D9] shadow-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
              {PACKAGE_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedPackageCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedPackageCategory === cat.id
                      ? 'bg-[#2C2A29] text-white shadow-2xs'
                      : 'bg-[#FAF8F5] text-[#8C857B] hover:text-[#2C2A29] border border-[#E8E2D9]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 bg-[#FAF8F5] p-1 rounded-xl border border-[#E8E2D9] text-xs self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setSelectedPackageTier('all')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  selectedPackageTier === 'all' ? 'bg-white text-[#2C2A29] shadow-xs' : 'text-[#8C857B]'
                }`}
              >
                Všetky úrovne
              </button>
              <button
                type="button"
                onClick={() => setSelectedPackageTier('basic')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  selectedPackageTier === 'basic' ? 'bg-stone-200 text-stone-900 shadow-xs' : 'text-[#8C857B]'
                }`}
              >
                Basic
              </button>
              <button
                type="button"
                onClick={() => setSelectedPackageTier('premium')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedPackageTier === 'premium' ? 'bg-[#2C2A29] text-[#C5A059] shadow-xs' : 'text-[#8C857B]'
                }`}
              >
                ✨ Premium
              </button>
            </div>
          </div>

          {/* PACKAGE CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPackages.map(pkg => {
              const isCopied = copiedId === pkg.id;
              const premPrice = calculateLoyaltyPrice(pkg.price, 'package', 'premium');
              const vipPrice = calculateLoyaltyPrice(pkg.price, 'package', 'vip');

              return (
                <div 
                  key={pkg.id} 
                  className={`flex flex-col justify-between p-6 rounded-3xl border transition-all hover:shadow-md ${
                    pkg.tier === 'premium' 
                      ? 'bg-gradient-to-br from-white via-white to-[#FAF6EE] border-[#C5A059]/40 shadow-xs' 
                      : 'bg-white border-[#E8E2D9] shadow-2xs'
                  }`}
                >
                  <div>
                    {/* CARD HEADER */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          pkg.tier === 'premium' 
                            ? 'bg-[#2C2A29] text-[#C5A059]' 
                            : 'bg-stone-100 text-stone-700 border border-stone-200'
                        }`}>
                          {pkg.tier === 'premium' ? '✨ Premium Balík' : 'Basic Balík'}
                        </span>
                        {pkg.badge && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                            {pkg.badge}
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-[#8C857B] font-semibold bg-[#FAF8F5] px-2 py-0.5 rounded-lg border border-[#E8E2D9]">
                        {pkg.categoryLabel}
                      </span>
                    </div>

                    <h4 className="font-brand text-base font-bold text-[#2C2A29] mb-1">
                      {pkg.name}
                    </h4>
                    <p className="text-xs text-[#8C857B] mb-4">
                      {pkg.description}
                    </p>

                    {/* INCLUDED ITEMS LIST */}
                    <div className="space-y-1.5 mb-5 bg-[#FAF8F5]/80 p-3.5 rounded-2xl border border-[#E8E2D9]/60">
                      <span className="text-[10px] font-bold text-[#8C857B] uppercase tracking-wider block mb-1">
                        Zahrnuté výkony a starostlivosť:
                      </span>
                      {pkg.includedItems.map((inc, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-[#2C2A29]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A059] shrink-0 mt-0.5" />
                          <span>{inc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PRICING FOOTER */}
                  <div className="pt-4 border-t border-[#E8E2D9] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#8C857B] line-through">
                          {pkg.regularPrice.toLocaleString('sk-SK')} €
                        </span>
                        <span className="text-xl font-bold font-brand text-[#2C2A29]">
                          {pkg.price.toLocaleString('sk-SK')} €
                        </span>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                          Úspora –{pkg.savings} €
                        </span>
                      </div>

                      {/* LOYALTY TIER PRICES (IF NOT SURGERY) */}
                      {!pkg.isSurgery && (
                        <div className="flex items-center gap-3 text-[11px] text-[#8C857B] mt-1">
                          <span>Premium (–5%): <strong className="text-amber-900">{premPrice} €</strong></span>
                          <span>•</span>
                          <span>VIP (–10%): <strong className="text-[#C5A059]">{vipPrice} €</strong></span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyPackageOffer(pkg)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2C2A29] hover:bg-[#1E1C1B] text-white text-xs font-bold transition-all shadow-xs cursor-pointer w-full sm:w-auto justify-center"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#C5A059]" />}
                      <span>{isCopied ? 'Skopírované!' : 'Kopírovať ponuku'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. EDIT ITEM MODAL */}
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
                  Názov výkonu / preparátu
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
                  Kategória
                </label>
                <select
                  value={editingItem.category}
                  onChange={(e) => {
                    const catId = e.target.value as ClinicPriceCategory;
                    const matchedCat = CATEGORY_TABS.find(c => c.id === catId);
                    setEditingItem({
                      ...editingItem,
                      category: catId,
                      categoryLabel: matchedCat ? matchedCat.label : 'Iné',
                      isSurgery: isSurgeryCategory(catId)
                    });
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] focus:outline-none focus:border-[#C5A059] text-[#2C2A29] cursor-pointer"
                >
                  {CATEGORY_TABS.filter(c => c.id !== 'all').map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#8C857B] uppercase block mb-1">
                  Základná cena v € (s DPH)
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

              <div>
                <label className="text-[11px] font-bold text-[#8C857B] uppercase block mb-1">
                  Popis / Poznámka pre recepciu
                </label>
                <textarea
                  rows={2}
                  value={editingItem.description || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  placeholder="Voliteľný stručný popis výkonu alebo indikácie..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] focus:outline-none focus:border-[#C5A059] text-[#2C2A29]"
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
                  className="px-5 py-2 rounded-xl bg-[#2C2A29] hover:bg-[#1E1C1B] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Uložiť zmenu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. ADD NEW ITEM MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-[#E8E2D9] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-3">
              <h4 className="font-bold text-sm text-[#2C2A29] uppercase tracking-wider">
                Pridať novú položku do cenníka
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
                  onChange={(e) => setNewItemCategory(e.target.value as ClinicPriceCategory)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] focus:outline-none focus:border-[#C5A059] text-[#2C2A29] cursor-pointer"
                >
                  {CATEGORY_TABS.filter(c => c.id !== 'all').map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#8C857B] uppercase block mb-1">
                  Základná cena v € (s DPH)
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

              <div>
                <label className="text-[11px] font-bold text-[#8C857B] uppercase block mb-1">
                  Popis / Poznámka pre recepciu
                </label>
                <textarea
                  rows={2}
                  value={newItemDescription}
                  onChange={(e) => setNewItemDescription(e.target.value)}
                  placeholder="Voliteľný stručný popis ošetrenia alebo obsahu..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] focus:outline-none focus:border-[#C5A059] text-[#2C2A29]"
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
                  className="px-5 py-2 rounded-xl bg-[#2C2A29] hover:bg-[#1E1C1B] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
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
