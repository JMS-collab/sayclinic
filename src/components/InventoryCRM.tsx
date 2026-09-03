'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  InventoryService, 
  InventoryItem, 
  MaterialUsageLog, 
  MaterialBundle, 
  OrderItem,
  InventoryCategory,
  MaterialUsageSourceType 
} from '../services/inventoryService';

export default function InventoryCRM() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [usageLogs, setUsageLogs] = useState<MaterialUsageLog[]>([]);
  const [bundles, setBundles] = useState<MaterialBundle[]>([]);
  const [reorderList, setReorderList] = useState<OrderItem[]>([]);
  
  const [activeTab, setActiveTab] = useState<'items' | 'usage' | 'reorder' | 'bundles'>('items');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Filtre pre knihu spotreby
  const [usageSearch, setUsageSearch] = useState('');
  const [usageSourceFilter, setUsageSourceFilter] = useState<string>('all');

  // Filtre pre objednávky
  const [supplierFilter, setSupplierFilter] = useState<string>('all');

  // Modaly
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isRestocking, setIsRestocking] = useState(false);
  const [isManualUsageModal, setIsManualUsageModal] = useState(false);
  const [selectedItemForRestock, setSelectedItemForRestock] = useState<InventoryItem | null>(null);

  // Form states pre novú položku
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    name: '',
    category: 'estetika',
    quantity: 10,
    unit: 'ks',
    minQuantity: 5,
    optimalQuantity: 15,
    costPerUnit: 0,
    supplier: '',
    supplierCode: '',
    lotNumber: '',
    expirationDate: '',
    location: ''
  });

  // Form states pre príjem / naskladnenie
  const [restockQty, setRestockQty] = useState(5);
  const [restockLot, setRestockLot] = useState('');
  const [restockExp, setRestockExp] = useState('');

  // Form states pre manuálny odpis
  const [manualUsageItemId, setManualUsageItemId] = useState('');
  const [manualUsageQty, setManualUsageQty] = useState(1);
  const [manualUsagePatient, setManualUsagePatient] = useState('');
  const [manualUsageProcedure, setManualUsageProcedure] = useState('Ambulantné ošetrenie / Spotreba');
  const [manualUsageType, setManualUsageType] = useState<MaterialUsageSourceType>('ambulancia');
  const [manualUsageNote, setManualUsageNote] = useState('');

  // Notifikácia
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Načítanie dát
  const refreshAllData = () => {
    const inv = InventoryService.getInventory();
    setInventory(inv);
    setUsageLogs(InventoryService.getUsageLogs());
    setBundles(InventoryService.getBundles());
    setReorderList(InventoryService.getReorderItems());
  };

  useEffect(() => {
    refreshAllData();

    const handleInvChange = () => refreshAllData();
    const handleLogChange = () => refreshAllData();

    window.addEventListener('say_clinic_inventory_changed', handleInvChange);
    window.addEventListener('say_clinic_material_usage_logged', handleLogChange);

    return () => {
      window.removeEventListener('say_clinic_inventory_changed', handleInvChange);
      window.removeEventListener('say_clinic_material_usage_logged', handleLogChange);
    };
  }, []);

  // Metriky skladu
  const stats = useMemo(() => {
    const totalItems = inventory.length;
    const totalInventoryValue = inventory.reduce((acc, item) => acc + (item.quantity * item.costPerUnit), 0);
    const lowStockCount = inventory.filter(item => item.quantity <= item.minQuantity).length;
    
    // Počet minutých materiálov za posledných 30 dní
    const totalLoggedUsages = usageLogs.length;
    const totalCostOfUsedMaterials = usageLogs.reduce((acc, log) => acc + (log.costAtUsage || 0), 0);

    return {
      totalItems,
      totalInventoryValue,
      lowStockCount,
      totalLoggedUsages,
      totalCostOfUsedMaterials
    };
  }, [inventory, usageLogs]);

  // Zoznam unikátnych dodávateľov
  const suppliersList = useMemo(() => {
    const set = new Set<string>();
    inventory.forEach(i => {
      if (i.supplier) set.add(i.supplier);
    });
    return Array.from(set);
  }, [inventory]);

  // Filtrované skladové zásoby
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.lotNumber && item.lotNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.supplier && item.supplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.supplierCode && item.supplierCode.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchLowStock = !onlyLowStock || (item.quantity <= item.minQuantity);

      return matchSearch && matchCategory && matchLowStock;
    });
  }, [inventory, searchTerm, selectedCategory, onlyLowStock]);

  // Filtrovaná kniha spotreby
  const filteredUsageLogs = useMemo(() => {
    return usageLogs.filter(log => {
      const matchSearch = log.patientName.toLowerCase().includes(usageSearch.toLowerCase()) ||
        log.itemName.toLowerCase().includes(usageSearch.toLowerCase()) ||
        log.procedureName.toLowerCase().includes(usageSearch.toLowerCase()) ||
        (log.lotNumber && log.lotNumber.toLowerCase().includes(usageSearch.toLowerCase())) ||
        (log.patientBirthNumber && log.patientBirthNumber.includes(usageSearch)) ||
        (log.performerName && log.performerName.toLowerCase().includes(usageSearch.toLowerCase()));

      const matchSource = usageSourceFilter === 'all' || log.sourceType === usageSourceFilter;

      return matchSearch && matchSource;
    });
  }, [usageLogs, usageSearch, usageSourceFilter]);

  // Filtrovaný zoznam objednávok
  const filteredReorderList = useMemo(() => {
    if (supplierFilter === 'all') return reorderList;
    return reorderList.filter(item => item.supplier === supplierFilter);
  }, [reorderList, supplierFilter]);

  // Handlery
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name) return;

    const itemToAdd: InventoryItem = {
      id: `inv-${Date.now()}`,
      name: newItem.name,
      category: (newItem.category as InventoryCategory) || 'spotrebny',
      quantity: Number(newItem.quantity) || 0,
      unit: (newItem.unit as any) || 'ks',
      minQuantity: Number(newItem.minQuantity) || 1,
      optimalQuantity: Number(newItem.optimalQuantity) || 10,
      costPerUnit: Number(newItem.costPerUnit) || 0,
      supplier: newItem.supplier || 'Všeobecný dodávateľ',
      supplierCode: newItem.supplierCode,
      lotNumber: newItem.lotNumber,
      expirationDate: newItem.expirationDate,
      location: newItem.location || 'Sklad'
    };

    const updated = [itemToAdd, ...inventory];
    InventoryService.saveInventory(updated);
    setIsAddingItem(false);
    showToast(`Položka "${itemToAdd.name}" bola úspešne pridaná na sklad.`);
  };

  const handleQuickAdjustStock = (itemId: string, delta: number) => {
    const updated = inventory.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity: Math.max(0, item.quantity + delta)
        };
      }
      return item;
    });
    InventoryService.saveInventory(updated);
  };

  const handleOpenRestock = (item: InventoryItem) => {
    setSelectedItemForRestock(item);
    setRestockQty(Math.max(1, (item.optimalQuantity || item.minQuantity * 2) - item.quantity));
    setRestockLot(item.lotNumber || '');
    setRestockExp(item.expirationDate || '');
    setIsRestocking(true);
  };

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForRestock) return;

    InventoryService.restockItem(
      selectedItemForRestock.id,
      Number(restockQty) || 1,
      restockLot,
      restockExp
    );

    setIsRestocking(false);
    showToast(`Príjem tovaru: Na sklad bolo pridaných ${restockQty} ${selectedItemForRestock.unit} položky "${selectedItemForRestock.name}".`);
  };

  const handleManualUsageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUsageItemId) return;
    const item = inventory.find(i => i.id === manualUsageItemId);
    if (!item) return;

    InventoryService.logMaterialUsage({
      patientName: manualUsagePatient || 'Klinika / Ambulancia SAY',
      sourceType: manualUsageType,
      procedureName: manualUsageProcedure,
      itemId: item.id,
      itemName: item.name,
      category: item.category,
      quantity: Number(manualUsageQty) || 1,
      unit: item.unit,
      lotNumber: item.lotNumber,
      performerName: 'Personál SAY CLINIC',
      notes: manualUsageNote
    });

    setIsManualUsageModal(false);
    setManualUsageItemId('');
    setManualUsagePatient('');
    setManualUsageNote('');
    showToast(`Odpísaných ${manualUsageQty} ${item.unit} položky "${item.name}". Záznam uložený do Knihy spotreby.`);
  };

  const copyOrderToClipboard = () => {
    const lines = [
      `OBJEDNÁVKA MATERIÁLU - SAY CLINIC (${new Date().toLocaleDateString('sk-SK')})`,
      supplierFilter !== 'all' ? `Dodávateľ: ${supplierFilter}` : 'Všetci dodávatelia',
      '------------------------------------------------------------',
      ...filteredReorderList.map((item, idx) => 
        `${idx + 1}. ${item.name} - ${item.quantity} ${item.unit} (Dodávateľ: ${item.supplier})`
      ),
      '------------------------------------------------------------',
      `Celkový počet položiek: ${filteredReorderList.length}`,
      `Odhadovaná hodnota: ${filteredReorderList.reduce((acc, i) => acc + (i.quantity * i.costPerUnit), 0).toFixed(2)} € bez DPH`
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    showToast('Objednávkový zoznam bol skopírovaný do schránky.');
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'estetika': return '💉 Estetika / Botox';
      case 'implantaty': return '🏥 Implantáty';
      case 'kompresivne_pradlo': return '👙 Poop. prádlo';
      case 'sijaci_material': return '🧵 Šitie & Hemostáza';
      case 'anestezia': return '💊 Anestézia & Lieky';
      case 'ambulantny_material': return '🩹 Ambulancia & Krytie';
      case 'spotrebny': return '🧤 Spotrebný materiál';
      default: return cat;
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-6">
      
      {/* TOAST NOTIFIKÁCIA */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#2C2A29] text-white px-4 py-3 rounded-xl shadow-xl border border-[#C5A059] flex items-center gap-2 text-xs font-semibold animate-fade-in">
          <span>📦</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HLAVIČKA SKLADU & KARTY ŠTATISTÍK */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-[#E8E2D9] pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-brand text-2xl font-bold text-[#2C2A29] uppercase">Sklad & Kniha spotreby materiálu</h2>
            <span className="bg-[#C5A059]/15 text-[#C5A059] text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-[#C5A059]/30">
              SAY CLINIC Management
            </span>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-[#8C857B] mt-0.5">
            Automatické sledovanie spotreby pri operáciách, estetike, ambulancii a výdaji prádla
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setIsManualUsageModal(true)}
            className="bg-[#FAF8F5] hover:bg-[#F0EBE1] text-[#2C2A29] border border-[#E8E2D9] px-3 py-2 rounded-xl text-xs uppercase font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <span>📉 + Manuálny odpis</span>
          </button>
          <button 
            onClick={() => setIsAddingItem(true)}
            className="bg-[#2C2A29] hover:bg-[#C5A059] text-white px-4 py-2 rounded-xl text-xs uppercase font-bold transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            <span>+ Nová položka</span>
          </button>
        </div>
      </div>

      {/* RÝCHLE METRIKY */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E8E2D9]">
          <span className="text-[10px] uppercase text-[#8C857B] font-bold block">Položky na sklade</span>
          <span className="text-xl font-bold text-[#2C2A29] font-mono">{stats.totalItems} druhov</span>
          <span className="text-[10px] text-[#8C857B] block mt-0.5">Hodnota: {stats.totalInventoryValue.toLocaleString('sk-SK', { minimumFractionDigits: 2 })} €</span>
        </div>

        <div className={`p-3.5 rounded-xl border ${stats.lowStockCount > 0 ? 'bg-amber-50/70 border-amber-300' : 'bg-[#FAF8F5] border-[#E8E2D9]'}`}>
          <span className="text-[10px] uppercase text-[#8C857B] font-bold block">Pod minimálnou zásobou</span>
          <span className={`text-xl font-bold font-mono ${stats.lowStockCount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
            {stats.lowStockCount} položiek
          </span>
          <span className="text-[10px] text-[#8C857B] block mt-0.5">Vyžaduje doobjednanie</span>
        </div>

        <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E8E2D9]">
          <span className="text-[10px] uppercase text-[#8C857B] font-bold block">Minutý materiál (Log)</span>
          <span className="text-xl font-bold text-[#2C2A29] font-mono">{stats.totalLoggedUsages} záznamov</span>
          <span className="text-[10px] text-[#8C857B] block mt-0.5">Auto-odpis z výkonov</span>
        </div>

        <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E8E2D9]">
          <span className="text-[10px] uppercase text-[#8C857B] font-bold block">Hodnota spotreby</span>
          <span className="text-xl font-bold text-[#C5A059] font-mono">
            {stats.totalCostOfUsedMaterials.toLocaleString('sk-SK', { minimumFractionDigits: 2 })} €
          </span>
          <span className="text-[10px] text-[#8C857B] block mt-0.5">Priama materiálová réžia</span>
        </div>
      </div>

      {/* HLAVNÉ NAVIGAČNÉ ZÁLOŽKY SKLADU */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E8E2D9] pb-1">
        <button
          onClick={() => setActiveTab('items')}
          className={`px-4 py-2.5 rounded-xl text-xs uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'items' 
              ? 'bg-[#2C2A29] text-white shadow-sm' 
              : 'bg-[#FAF8F5] text-[#8C857B] hover:bg-[#E8E2D9]'
          }`}
        >
          <span>📦 Skladové zásoby ({inventory.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('usage')}
          className={`px-4 py-2.5 rounded-xl text-xs uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'usage' 
              ? 'bg-[#2C2A29] text-white shadow-sm' 
              : 'bg-[#FAF8F5] text-[#8C857B] hover:bg-[#E8E2D9]'
          }`}
        >
          <span>📋 Kniha spotreby / Minutý materiál ({usageLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reorder')}
          className={`px-4 py-2.5 rounded-xl text-xs uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'reorder' 
              ? 'bg-[#2C2A29] text-white shadow-sm' 
              : 'bg-[#FAF8F5] text-[#8C857B] hover:bg-[#E8E2D9]'
          }`}
        >
          <span>🛒 Zoznam na objednávanie</span>
          {reorderList.length > 0 && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'reorder' ? 'bg-[#C5A059] text-white' : 'bg-rose-500 text-white'
            }`}>
              {reorderList.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('bundles')}
          className={`px-4 py-2.5 rounded-xl text-xs uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'bundles' 
              ? 'bg-[#2C2A29] text-white shadow-sm' 
              : 'bg-[#FAF8F5] text-[#8C857B] hover:bg-[#E8E2D9]'
          }`}
        >
          <span>🧪 Balíčky pre výkony ({bundles.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. ZÁLOŽKA: SKLADOVÉ ZÁSOBY                                               */}
      {/* ========================================================================= */}
      {activeTab === 'items' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-3 items-center">
            <input 
              type="text" 
              placeholder="Vyhľadať materiál, liek, šaržu LOT, kód dodávateľa..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="border border-[#E8E2D9] p-2.5 rounded-xl text-xs bg-[#FBF9F6] w-full sm:flex-1 outline-none focus:border-[#C5A059]" 
            />

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select 
                value={selectedCategory} 
                onChange={e => setSelectedCategory(e.target.value)}
                className="border border-[#E8E2D9] p-2.5 rounded-xl text-xs bg-[#FBF9F6] font-semibold text-[#2C2A29]"
              >
                <option value="all">Všetky kategórie ({inventory.length})</option>
                <option value="estetika">Estetika (Botox/Výplne)</option>
                <option value="implantaty">Implantáty</option>
                <option value="kompresivne_pradlo">Pooperačné prádlo</option>
                <option value="sijaci_material">Šijací materiál & Hemostáza</option>
                <option value="anestezia">Anestézia & Farmaká</option>
                <option value="ambulantny_material">Ambulancia & Krytie</option>
                <option value="spotrebny">Spotrebný materiál</option>
              </select>

              <label className="flex items-center gap-1.5 text-xs text-[#2C2A29] bg-[#FAF8F5] px-3 py-2 rounded-xl border border-[#E8E2D9] cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={onlyLowStock} 
                  onChange={e => setOnlyLowStock(e.target.checked)}
                  className="rounded text-[#C5A059]"
                />
                <span className="font-semibold text-rose-700">Iba pod minimom ({stats.lowStockCount})</span>
              </label>
            </div>
          </div>

          <div className="overflow-x-auto border border-[#E8E2D9] rounded-xl shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-[#E8E2D9] text-[10px] uppercase text-[#8C857B] font-bold">
                  <th className="p-3">Názov materiálu & Kód</th>
                  <th className="p-3">Kategória</th>
                  <th className="p-3">Dodávateľ / Umiestnenie</th>
                  <th className="p-3 text-center">Aktuálna zásoba</th>
                  <th className="p-3">Min. zásoba</th>
                  <th className="p-3 font-mono">Cena / ks</th>
                  <th className="p-3 font-mono">Hodnota</th>
                  <th className="p-3">Šarža (LOT)</th>
                  <th className="p-3 text-right">Rýchle akcie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9]">
                {filteredInventory.map(item => {
                  const isLow = item.quantity <= item.minQuantity;
                  return (
                    <tr key={item.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-[#2C2A29]">{item.name}</div>
                        <div className="text-[10px] text-[#8C857B] flex gap-2">
                          {item.supplierCode && <span>Kód: <code className="text-[#2C2A29]">{item.supplierCode}</code></span>}
                          {item.expirationDate && <span>EXP: <span className="font-mono">{item.expirationDate}</span></span>}
                        </div>
                      </td>

                      <td className="p-3">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E8E2D9] text-[#2C2A29]">
                          {getCategoryLabel(item.category)}
                        </span>
                      </td>

                      <td className="p-3 text-[#2C2A29]">
                        <div className="font-semibold">{item.supplier || '---'}</div>
                        <div className="text-[10px] text-[#8C857B]">{item.location || 'Sklad'}</div>
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleQuickAdjustStock(item.id, -1)}
                            className="w-5 h-5 rounded bg-gray-100 hover:bg-rose-100 hover:text-rose-700 text-gray-600 font-bold flex items-center justify-center cursor-pointer text-xs"
                            title="Znížiť o 1"
                          >
                            -
                          </button>
                          <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                            isLow ? 'bg-rose-100 text-rose-700 font-extrabold' : 'bg-emerald-50 text-emerald-800'
                          }`}>
                            {item.quantity} {item.unit}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuickAdjustStock(item.id, 1)}
                            className="w-5 h-5 rounded bg-gray-100 hover:bg-emerald-100 hover:text-emerald-700 text-gray-600 font-bold flex items-center justify-center cursor-pointer text-xs"
                            title="Zvýšiť o 1"
                          >
                            +
                          </button>
                        </div>
                        {isLow && (
                          <span className="block text-[8px] uppercase tracking-wider text-rose-600 font-bold mt-0.5">
                            ⚠️ Objednať
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-[#8C857B] font-mono">
                        {item.minQuantity} {item.unit}
                      </td>

                      <td className="p-3 font-mono">{item.costPerUnit.toFixed(2)} €</td>

                      <td className="p-3 font-mono font-bold text-[#2C2A29]">
                        {(item.quantity * item.costPerUnit).toFixed(2)} €
                      </td>

                      <td className="p-3 font-mono text-xs text-[#8C857B]">
                        {item.lotNumber ? <span className="bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#E8E2D9] text-[#C5A059] font-bold">{item.lotNumber}</span> : '---'}
                      </td>

                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenRestock(item)}
                          className="bg-[#2C2A29] hover:bg-[#C5A059] text-white px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold transition-colors cursor-pointer shadow-2xs"
                        >
                          + Naskladniť
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ZÁLOŽKA: KNIHA SPOTREBY / MINUTÝ MATERIÁL                               */}
      {/* ========================================================================= */}
      {activeTab === 'usage' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-3 items-center">
            <input 
              type="text" 
              placeholder="Vyhľadať pacienta, rodné číslo, výkon, materiál, šaržu LOT alebo lekára..." 
              value={usageSearch} 
              onChange={e => setUsageSearch(e.target.value)} 
              className="border border-[#E8E2D9] p-2.5 rounded-xl text-xs bg-[#FBF9F6] w-full sm:flex-1 outline-none focus:border-[#C5A059]" 
            />

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select 
                value={usageSourceFilter} 
                onChange={e => setUsageSourceFilter(e.target.value)}
                className="border border-[#E8E2D9] p-2.5 rounded-xl text-xs bg-[#FBF9F6] font-semibold text-[#2C2A29]"
              >
                <option value="all">Všetky zdroje spotreby ({usageLogs.length})</option>
                <option value="operacia">🏥 Operácie & Sála</option>
                <option value="estetika">💉 Estetické aplikácie</option>
                <option value="pradlo">👙 Vydané pooperačné prádlo</option>
                <option value="ambulancia">🩺 Ambulancia & Preväzy</option>
                <option value="manualny_odpis">✏️ Manuálny odpis</option>
              </select>

              <button
                type="button"
                onClick={() => window.print()}
                className="bg-[#FAF8F5] hover:bg-[#F0EBE1] text-[#2C2A29] border border-[#E8E2D9] px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                title="Vytlačiť protokol o spotrebe"
              >
                🖨️ Tlač knihy
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-[#E8E2D9] rounded-xl shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-[#E8E2D9] text-[10px] uppercase text-[#8C857B] font-bold">
                  <th className="p-3">Dátum & Čas</th>
                  <th className="p-3">Klient / Pacient</th>
                  <th className="p-3">Typ & Výkon</th>
                  <th className="p-3">Použitý materiál</th>
                  <th className="p-3 text-center">Množstvo</th>
                  <th className="p-3">Šarža LOT / SN</th>
                  <th className="p-3">Ošetrujúci personál</th>
                  <th className="p-3">Poznámka</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9]">
                {filteredUsageLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-[#8C857B]">
                      Žiadne záznamy spotreby nevyhovujú zvolenému filtru.
                    </td>
                  </tr>
                ) : (
                  filteredUsageLogs.map(log => (
                    <tr key={log.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                      <td className="p-3 font-mono text-[11px] text-[#2C2A29]">
                        <span className="font-bold block">{log.date}</span>
                        <span className="text-[#8C857B] text-[10px]">{log.time}</span>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-[#2C2A29]">{log.patientName}</div>
                        {log.patientBirthNumber && (
                          <div className="text-[10px] text-[#8C857B] font-mono">RČ: {log.patientBirthNumber}</div>
                        )}
                      </td>

                      <td className="p-3">
                        <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full inline-block mb-1 ${
                          log.sourceType === 'operacia'
                            ? 'bg-rose-100 text-rose-800'
                            : log.sourceType === 'estetika'
                            ? 'bg-purple-100 text-purple-800'
                            : log.sourceType === 'pradlo'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {log.sourceType === 'operacia' ? '🏥 Operácia' : log.sourceType === 'estetika' ? '💉 Estetika' : log.sourceType === 'pradlo' ? '👙 Prádlo' : '🩺 Ambulancia'}
                        </span>
                        <div className="font-medium text-[#2C2A29] text-[11px]">{log.procedureName}</div>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-[#2C2A29]">{log.itemName}</div>
                        <div className="text-[10px] text-[#8C857B]">{log.category}</div>
                      </td>

                      <td className="p-3 text-center">
                        <span className="font-mono font-bold bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#E8E2D9] text-[#2C2A29]">
                          {log.quantity} {log.unit}
                        </span>
                      </td>

                      <td className="p-3 font-mono text-[11px]">
                        {log.lotNumber && (
                          <span className="block text-[#C5A059] font-bold">LOT: {log.lotNumber}</span>
                        )}
                        {log.serialNumber && (
                          <span className="block text-[#2C2A29] text-[10px]">SN: {log.serialNumber}</span>
                        )}
                        {!log.lotNumber && !log.serialNumber && <span className="text-[#8C857B]">---</span>}
                      </td>

                      <td className="p-3 text-[#2C2A29]">
                        <span className="font-medium">{log.performerName}</span>
                      </td>

                      <td className="p-3 text-[11px] text-[#8C857B] max-w-xs truncate">
                        {log.notes || '---'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ZÁLOŽKA: ZOZNAM NA OBJEDNÁVANIE MATERIÁLU                             */}
      {/* ========================================================================= */}
      {activeTab === 'reorder' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-3 items-center bg-[#FAF8F5] p-4 rounded-xl border border-[#E8E2D9]">
            <div>
              <h3 className="font-bold text-sm text-[#2C2A29] uppercase">
                Automatický nákupný zoznam materiálu (Reorder List)
              </h3>
              <p className="text-xs text-[#8C857B]">
                Položky, ktorých aktuálna skladová zásoba klesla pod definované minimum. Odporúčané množstvo zabezpečí optimálnu zásobu.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={supplierFilter}
                onChange={e => setSupplierFilter(e.target.value)}
                className="border border-[#E8E2D9] p-2 rounded-xl text-xs bg-white font-semibold text-[#2C2A29]"
              >
                <option value="all">Všetci dodávatelia ({suppliersList.length})</option>
                {suppliersList.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={copyOrderToClipboard}
                className="bg-[#2C2A29] hover:bg-[#C5A059] text-white px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <span>📋 Kopírovať pre dodávateľa</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="bg-white hover:bg-[#FAF8F5] text-[#2C2A29] border border-[#E8E2D9] px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                🖨️ Tlačiť
              </button>
            </div>
          </div>

          {filteredReorderList.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-emerald-300 rounded-2xl bg-emerald-50/50">
              <p className="text-4xl mb-2">✅</p>
              <h4 className="font-bold text-emerald-800 text-sm">Všetky zásoby sú v optimálnom stave</h4>
              <p className="text-xs text-emerald-700 max-w-md mx-auto mt-1">
                Žiadna položka v kategórii {supplierFilter !== 'all' ? `"${supplierFilter}"` : 'skladu'} aktuálne nie je pod minimálnou hranicou.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-[#E8E2D9] rounded-xl shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FAF8F5] border-b border-[#E8E2D9] text-[10px] uppercase text-[#8C857B] font-bold">
                    <th className="p-3">Materiál / Liek</th>
                    <th className="p-3">Dodávateľ</th>
                    <th className="p-3 text-center">Aktuálny stav</th>
                    <th className="p-3 text-center font-bold text-amber-700">Potrebné objednať</th>
                    <th className="p-3 font-mono">Jedn. cena</th>
                    <th className="p-3 font-mono">Predpokladaná cena</th>
                    <th className="p-3 text-right">Akcia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D9]">
                  {filteredReorderList.map(item => {
                    const invItem = inventory.find(i => i.id === item.itemId);
                    const estCost = item.quantity * item.costPerUnit;

                    return (
                      <tr key={item.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-[#2C2A29]">{item.name}</div>
                          <div className="text-[10px] text-[#8C857B]">
                            Minimálna stanovená zásoba: <strong>{invItem?.minQuantity} {item.unit}</strong>
                          </div>
                        </td>

                        <td className="p-3 font-semibold text-[#2C2A29]">
                          {item.supplier}
                        </td>

                        <td className="p-3 text-center">
                          <span className="font-mono font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-xs">
                            {invItem?.quantity || 0} {item.unit}
                          </span>
                        </td>

                        <td className="p-3 text-center">
                          <span className="font-mono font-bold text-sm bg-amber-100 text-amber-800 px-3 py-1 rounded-lg border border-amber-300 inline-block">
                            + {item.quantity} {item.unit}
                          </span>
                        </td>

                        <td className="p-3 font-mono">{item.costPerUnit.toFixed(2)} €</td>

                        <td className="p-3 font-mono font-bold text-[#2C2A29]">
                          {estCost.toFixed(2)} €
                        </td>

                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              if (invItem) handleOpenRestock(invItem);
                            }}
                            className="bg-[#2C2A29] hover:bg-[#C5A059] text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors cursor-pointer"
                          >
                            Naskladniť
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-[#FAF8F5] border-t-2 border-[#E8E2D9] font-bold text-xs">
                    <td colSpan={5} className="p-3 uppercase text-right text-[#8C857B]">
                      Spolu predpokladané náklady na objednanie:
                    </td>
                    <td className="p-3 font-mono text-sm text-[#2C2A29]">
                      {filteredReorderList.reduce((acc, i) => acc + (i.quantity * i.costPerUnit), 0).toFixed(2)} € bez DPH
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ZÁLOŽKA: BALÍČKY PRE VÝKONY                                             */}
      {/* ========================================================================= */}
      {activeTab === 'bundles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bundles.map(bundle => {
            const totalBundleCost = bundle.items.reduce((acc, bItem) => {
              const invItem = inventory.find(i => i.id === bItem.itemId);
              return acc + (invItem ? invItem.costPerUnit * bItem.quantity : 0);
            }, 0);

            return (
              <div key={bundle.id} className="border border-[#E8E2D9] rounded-xl p-5 bg-[#FAF8F5] space-y-3">
                <div className="flex justify-between items-start border-b pb-2 border-[#E8E2D9]">
                  <div>
                    <h4 className="font-bold text-sm text-[#2C2A29] uppercase">{bundle.serviceName}</h4>
                    <p className="text-[11px] text-[#8C857B]">{bundle.description}</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#C5A059] bg-white px-2.5 py-1 rounded-lg border border-[#E8E2D9] shrink-0">
                    Náklady: {totalBundleCost.toFixed(2)} €
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <p className="text-[10px] uppercase text-[#8C857B] font-bold">Automaticky odpisované položky:</p>
                  <ul className="space-y-1.5">
                    {bundle.items.map((bItem, idx) => {
                      const invItem = inventory.find(i => i.id === bItem.itemId);
                      return (
                        <li key={idx} className="flex justify-between items-center bg-white p-2 rounded-lg border border-[#E8E2D9]">
                          <div>
                            <span className="font-semibold text-[#2C2A29]">{invItem?.name || bItem.itemId}</span>
                            <span className="ml-2 text-[9px] text-[#8C857B] uppercase bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#E8E2D9]">{invItem?.category}</span>
                          </div>
                          <span className="font-mono font-bold">
                            {bItem.quantity} {invItem?.unit} ({(invItem ? invItem.costPerUnit * bItem.quantity : 0).toFixed(2)} €)
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PRIDANIE NOVEJ POLOŽKY                                             */}
      {/* ========================================================================= */}
      {isAddingItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-xs p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-xl border border-[#E8E2D9] space-y-4">
            <div className="flex justify-between items-center border-b pb-3 border-[#E8E2D9]">
              <h3 className="font-brand text-base font-bold text-[#2C2A29] uppercase">Nová položka na sklad SAY CLINIC</h3>
              <button onClick={() => setIsAddingItem(false)} className="text-[#8C857B] hover:text-[#2C2A29] font-bold text-lg cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Názov materiálu / lieku *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="napr. Motiva Ergonomix Demi 340cc" 
                  value={newItem.name} 
                  onChange={e => setNewItem({...newItem, name: e.target.value})} 
                  className="w-full border border-[#E8E2D9] p-2.5 rounded-xl bg-white focus:border-[#C5A059] outline-none" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Kategória</label>
                  <select 
                    value={newItem.category} 
                    onChange={e => setNewItem({...newItem, category: e.target.value as any})} 
                    className="w-full border border-[#E8E2D9] p-2 rounded-xl bg-white"
                  >
                    <option value="estetika">💉 Estetika (Botox/Výplne)</option>
                    <option value="implantaty">🏥 Implantáty</option>
                    <option value="kompresivne_pradlo">👙 Pooperačné prádlo</option>
                    <option value="sijaci_material">🧵 Šijací materiál</option>
                    <option value="anestezia">💊 Anestézia & Farmaká</option>
                    <option value="ambulantny_material">🩹 Ambulancia & Krytie</option>
                    <option value="spotrebny">🧤 Spotrebný materiál</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Merná jednotka</label>
                  <select 
                    value={newItem.unit} 
                    onChange={e => setNewItem({...newItem, unit: e.target.value as any})} 
                    className="w-full border border-[#E8E2D9] p-2 rounded-xl bg-white"
                  >
                    <option value="ks">ks (kus)</option>
                    <option value="vialka">vialka</option>
                    <option value="bal">balenie</option>
                    <option value="ml">ml</option>
                    <option value="pár">pár</option>
                    <option value="set">set</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Počiatočná zásoba</label>
                  <input 
                    type="number" 
                    required 
                    value={newItem.quantity} 
                    onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})} 
                    className="w-full border border-[#E8E2D9] p-2 rounded-xl bg-white" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Min. zásoba</label>
                  <input 
                    type="number" 
                    required 
                    value={newItem.minQuantity} 
                    onChange={e => setNewItem({...newItem, minQuantity: Number(e.target.value)})} 
                    className="w-full border border-[#E8E2D9] p-2 rounded-xl bg-white" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Nákupná cena (€)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    value={newItem.costPerUnit} 
                    onChange={e => setNewItem({...newItem, costPerUnit: Number(e.target.value)})} 
                    className="w-full border border-[#E8E2D9] p-2 rounded-xl bg-white" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Dodávateľ</label>
                  <input 
                    type="text" 
                    placeholder="napr. Galderma, Lipoelastic" 
                    value={newItem.supplier} 
                    onChange={e => setNewItem({...newItem, supplier: e.target.value})} 
                    className="w-full border border-[#E8E2D9] p-2 rounded-xl bg-white" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Umiestnenie (sklad/polica)</label>
                  <input 
                    type="text" 
                    placeholder="napr. Chladnička 1, Sklad prádla" 
                    value={newItem.location} 
                    onChange={e => setNewItem({...newItem, location: e.target.value})} 
                    className="w-full border border-[#E8E2D9] p-2 rounded-xl bg-white" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Šarža (LOT)</label>
                  <input 
                    type="text" 
                    placeholder="LOT-2026" 
                    value={newItem.lotNumber} 
                    onChange={e => setNewItem({...newItem, lotNumber: e.target.value})} 
                    className="w-full border border-[#E8E2D9] p-2 rounded-xl bg-white" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Dátum expirácie</label>
                  <input 
                    type="date" 
                    value={newItem.expirationDate} 
                    onChange={e => setNewItem({...newItem, expirationDate: e.target.value})} 
                    className="w-full border border-[#E8E2D9] p-2 rounded-xl bg-white" 
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#E8E2D9]">
                <button 
                  type="button" 
                  onClick={() => setIsAddingItem(false)} 
                  className="px-4 py-2 font-bold text-[#8C857B] cursor-pointer"
                >
                  Zrušiť
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-[#2C2A29] hover:bg-[#C5A059] text-white font-bold rounded-xl uppercase tracking-wider cursor-pointer shadow-xs transition-colors"
                >
                  Uložiť na sklad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NASKLADNENIE / PRÍJEM TOVARU                                       */}
      {/* ========================================================================= */}
      {isRestocking && selectedItemForRestock && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-xs p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-xl border border-[#E8E2D9] space-y-4">
            <div className="flex justify-between items-center border-b pb-3 border-[#E8E2D9]">
              <div>
                <h3 className="font-brand text-base font-bold text-[#2C2A29] uppercase">Príjem tovaru / Naskladnenie</h3>
                <p className="text-xs text-[#8C857B]">{selectedItemForRestock.name}</p>
              </div>
              <button onClick={() => setIsRestocking(false)} className="text-[#8C857B] hover:text-[#2C2A29] font-bold text-lg cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Množstvo na príjem ({selectedItemForRestock.unit}) *</label>
                <input 
                  type="number" 
                  min="1" 
                  required 
                  value={restockQty} 
                  onChange={e => setRestockQty(Math.max(1, parseInt(e.target.value) || 1))} 
                  className="w-full border border-[#E8E2D9] p-2.5 rounded-xl bg-white font-bold text-base" 
                />
                <p className="text-[10px] text-[#8C857B] mt-1">
                  Aktuálna zásoba: {selectedItemForRestock.quantity} {selectedItemForRestock.unit} → Nová zásoba bude: <strong>{selectedItemForRestock.quantity + restockQty} {selectedItemForRestock.unit}</strong>
                </p>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Nová šarža (LOT)</label>
                <input 
                  type="text" 
                  value={restockLot} 
                  onChange={e => setRestockLot(e.target.value)} 
                  className="w-full border border-[#E8E2D9] p-2 rounded-xl bg-white" 
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Dátum expirácie</label>
                <input 
                  type="date" 
                  value={restockExp} 
                  onChange={e => setRestockExp(e.target.value)} 
                  className="w-full border border-[#E8E2D9] p-2 rounded-xl bg-white" 
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E8E2D9]">
                <button 
                  type="button" 
                  onClick={() => setIsRestocking(false)} 
                  className="px-4 py-2 font-bold text-[#8C857B] cursor-pointer"
                >
                  Zrušiť
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-[#C5A059] hover:bg-[#b08d48] text-white font-bold rounded-xl uppercase tracking-wider cursor-pointer shadow-xs transition-colors"
                >
                  Potvrdiť príjem
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MANUÁLNY ODPIS MATERIÁLU                                           */}
      {/* ========================================================================= */}
      {isManualUsageModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-xs p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-xl border border-[#E8E2D9] space-y-4">
            <div className="flex justify-between items-center border-b pb-3 border-[#E8E2D9]">
              <h3 className="font-brand text-base font-bold text-[#2C2A29] uppercase">Manuálny odpis materiálu / Spotreba</h3>
              <button onClick={() => setIsManualUsageModal(false)} className="text-[#8C857B] hover:text-[#2C2A29] font-bold text-lg cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleManualUsageSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Položka na odpis *</label>
                <select
                  value={manualUsageItemId}
                  onChange={e => setManualUsageItemId(e.target.value)}
                  required
                  className="w-full border border-[#E8E2D9] p-2.5 rounded-xl bg-white"
                >
                  <option value="" disabled>Vyberte materiál zo skladu...</option>
                  {inventory.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} (Zásoba: {item.quantity} {item.unit}) [{item.supplier}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Množstvo *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={manualUsageQty}
                    onChange={e => setManualUsageQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full border border-[#E8E2D9] p-2 rounded-xl bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Typ spotreby</label>
                  <select
                    value={manualUsageType}
                    onChange={e => setManualUsageType(e.target.value as any)}
                    className="w-full border border-[#E8E2D9] p-2 rounded-xl bg-white"
                  >
                    <option value="ambulancia">🩺 Ambulancia / Preväz</option>
                    <option value="operacia">🏥 Operácia / Sála</option>
                    <option value="estetika">💉 Estetická aplikácia</option>
                    <option value="pradlo">👙 Výdaj prádla</option>
                    <option value="manualny_odpis">⚠️ Poškodenie / Expirácia</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Meno pacienta / Účel</label>
                <input
                  type="text"
                  placeholder="napr. Mária Kováčová alebo 'Ambulantná spotreba'"
                  value={manualUsagePatient}
                  onChange={e => setManualUsagePatient(e.target.value)}
                  className="w-full border border-[#E8E2D9] p-2 rounded-xl bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Názov výkonu</label>
                <input
                  type="text"
                  value={manualUsageProcedure}
                  onChange={e => setManualUsageProcedure(e.target.value)}
                  className="w-full border border-[#E8E2D9] p-2 rounded-xl bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Poznámka</label>
                <input
                  type="text"
                  placeholder="Dôvod odpisu, špecifikácia..."
                  value={manualUsageNote}
                  onChange={e => setManualUsageNote(e.target.value)}
                  className="w-full border border-[#E8E2D9] p-2 rounded-xl bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E8E2D9]">
                <button
                  type="button"
                  onClick={() => setIsManualUsageModal(false)}
                  className="px-4 py-2 font-bold text-[#8C857B] cursor-pointer"
                >
                  Zrušiť
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2C2A29] hover:bg-[#C5A059] text-white font-bold rounded-xl uppercase tracking-wider cursor-pointer shadow-xs transition-colors"
                >
                  Odpísať zo skladu & Zalogovať
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
