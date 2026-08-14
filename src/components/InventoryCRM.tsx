'use client';

import React, { useState } from 'react';

export interface InventoryItem {
  id: string;
  name: string;
  category: 'estetika' | 'implantaty' | 'anestezia' | 'sijaci_material' | 'spotrebny';
  quantity: number;
  unit: 'ks' | 'ml' | 'bal' | 'vialka';
  minQuantity: number;
  costPerUnit: number; // Nákupná cena bez DPH
  expirationDate?: string;
  lotNumber?: string;
}

export interface MaterialBundle {
  id: string;
  serviceName: string; // napr. "Augmentácia prsníkov"
  items: { itemId: string; quantity: number }[];
}

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'i1', name: 'Botox 100U vialka', category: 'estetika', quantity: 12, unit: 'vialka', minQuantity: 5, costPerUnit: 140, expirationDate: '2027-05-10', lotNumber: 'BTX-99821' },
  { id: 'i2', name: 'Juvederm Voluma 1ml', category: 'estetika', quantity: 8, unit: 'ks', minQuantity: 3, costPerUnit: 110, expirationDate: '2026-11-20', lotNumber: 'JUV-4431' },
  { id: 'i3', name: 'Marcaine 0.5% 20ml', category: 'anestezia', quantity: 25, unit: 'vialka', minQuantity: 10, costPerUnit: 4.5, expirationDate: '2028-01-15', lotNumber: 'MAR-102' },
  { id: 'i4', name: 'Vicryl 3-0 ihla 75cm', category: 'sijaci_material', quantity: 40, unit: 'ks', minQuantity: 15, costPerUnit: 3.2, expirationDate: '2029-03-01' },
  { id: 'i5', name: 'Kompresná podprsenka PI Ideal', category: 'spotrebny', quantity: 14, unit: 'ks', minQuantity: 5, costPerUnit: 38 },
];

const INITIAL_BUNDLES: MaterialBundle[] = [
  {
    id: 'b1',
    serviceName: 'Augmentácia prsníkov',
    items: [
      { itemId: 'i3', quantity: 2 }, // 2x Marcaine
      { itemId: 'i4', quantity: 3 }, // 3x Vicryl
      { itemId: 'i5', quantity: 1 }, // 1x Podprsenka
    ]
  },
  {
    id: 'b2',
    serviceName: 'Aplikácia Botoxu (3 oblasti)',
    items: [
      { itemId: 'i1', quantity: 1 }, // 1x Botox vialka
    ]
  }
];

export default function InventoryCRM() {
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [bundles, setBundles] = useState<MaterialBundle[]>(INITIAL_BUNDLES);
  const [activeSubTab, setActiveSubTab] = useState<'items' | 'bundles'>('items');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Pridanie novej položky
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    name: '',
    category: 'estetika',
    quantity: 10,
    unit: 'ks',
    minQuantity: 5,
    costPerUnit: 0,
    lotNumber: '',
    expirationDate: ''
  });
  const [isAddingItem, setIsAddingItem] = useState(false);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.costPerUnit) return;

    const item: InventoryItem = {
      id: `i-${Date.now()}`,
      name: newItem.name,
      category: newItem.category as any,
      quantity: Number(newItem.quantity),
      unit: newItem.unit as any,
      minQuantity: Number(newItem.minQuantity),
      costPerUnit: Number(newItem.costPerUnit),
      expirationDate: newItem.expirationDate,
      lotNumber: newItem.lotNumber
    };

    setInventory(prev => [item, ...prev]);
    setIsAddingItem(false);
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || (item.lotNumber && item.lotNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-6">
      
      {/* HLAVIČKA SKLADU */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#E8E2D9] pb-4">
        <div>
          <h2 className="font-brand text-2xl font-bold text-[#2C2A29] uppercase">Sklad & Spotrebný materiál</h2>
          <p className="text-[10px] uppercase tracking-widest text-[#8C857B]">Správa liekov, anestézie, implantátov a balíčkov</p>
        </div>

        <div className="flex gap-2">
          <div className="bg-[#FBF9F6] p-1 border border-[#E8E2D9] rounded-xl flex gap-1 text-xs font-bold uppercase">
            <button 
              onClick={() => setActiveSubTab('items')} 
              className={`px-4 py-1.5 rounded-lg transition-all ${activeSubTab === 'items' ? 'bg-[#2C2A29] text-white' : 'text-[#8C857B]'}`}
            >
              📦 Zásoby ({inventory.length})
            </button>
            <button 
              onClick={() => setActiveSubTab('bundles')} 
              className={`px-4 py-1.5 rounded-lg transition-all ${activeSubTab === 'bundles' ? 'bg-[#2C2A29] text-white' : 'text-[#8C857B]'}`}
            >
              🧪 Balíčky pre výkony ({bundles.length})
            </button>
          </div>

          <button 
            onClick={() => setIsAddingItem(true)}
            className="bg-[#C5A059] hover:bg-[#b08d4b] text-white px-4 py-2 rounded-xl text-xs uppercase font-bold transition-colors shadow-sm"
          >
            + Pridať položku
          </button>
        </div>
      </div>

      {/* MODAL: PRIDANIE POLOŽKY */}
      {isAddingItem && (
        <div className="fixed inset-0 bg-[#2C2A29]/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-xl border border-[#E8E2D9]">
            <h3 className="font-brand text-lg font-bold text-[#2C2A29] uppercase border-b pb-3 mb-4">Nová položka na sklad</h3>
            <form onSubmit={handleAddItem} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Názov materiálu / lieku *</label>
                <input type="text" required placeholder="napr. Dysport 500U" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full border p-2 rounded-lg bg-[#FBF9F6]" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Kategória</label>
                  <select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value as any})} className="w-full border p-2 rounded-lg bg-[#FBF9F6]">
                    <option value="estetika">Estetika (Botox/Výplne)</option>
                    <option value="implantaty">Implantáty</option>
                    <option value="anestezia">Anestézia & Farmaká</option>
                    <option value="sijaci_material">Šijací materiál</option>
                    <option value="spotrebny">Spotrebný materiál</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Jednotka</label>
                  <select value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value as any})} className="w-full border p-2 rounded-lg bg-[#FBF9F6]">
                    <option value="ks">ks</option>
                    <option value="ml">ml</option>
                    <option value="vialka">vialka</option>
                    <option value="bal">balenie</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Množstvo</label>
                  <input type="number" required value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})} className="w-full border p-2 rounded-lg bg-[#FBF9F6]" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Min. zásoba</label>
                  <input type="number" required value={newItem.minQuantity} onChange={e => setNewItem({...newItem, minQuantity: Number(e.target.value)})} className="w-full border p-2 rounded-lg bg-[#FBF9F6]" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Nákupná cena (€)</label>
                  <input type="number" step="0.01" required value={newItem.costPerUnit} onChange={e => setNewItem({...newItem, costPerUnit: Number(e.target.value)})} className="w-full border p-2 rounded-lg bg-[#FBF9F6]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Šarža (LOT)</label>
                  <input type="text" placeholder="LOT-12345" value={newItem.lotNumber} onChange={e => setNewItem({...newItem, lotNumber: e.target.value})} className="w-full border p-2 rounded-lg bg-[#FBF9F6]" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-[#8C857B] font-bold mb-1">Expirácia</label>
                  <input type="date" value={newItem.expirationDate} onChange={e => setNewItem({...newItem, expirationDate: e.target.value})} className="w-full border p-2 rounded-lg bg-[#FBF9F6]" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                <button type="button" onClick={() => setIsAddingItem(false)} className="px-4 py-2 font-bold text-[#8C857B]">ZRUŠIŤ</button>
                <button type="submit" className="px-5 py-2 bg-[#2C2A29] text-white font-bold rounded-xl uppercase">ULOŽIŤ NA SKLAD</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POHĽAD 1: POLOŽKY SKLADU */}
      {activeSubTab === 'items' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <input 
              type="text" 
              placeholder="Vyhľadať materiál, liek, LOT šaržu..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="border p-2.5 rounded-xl text-xs bg-[#FBF9F6] flex-1 outline-none focus:border-[#C5A059]" 
            />
            <select 
              value={selectedCategory} 
              onChange={e => setSelectedCategory(e.target.value)}
              className="border p-2.5 rounded-xl text-xs bg-[#FBF9F6] font-bold text-[#2C2A29]"
            >
              <option value="all">Všetky kategórie</option>
              <option value="estetika">Estetika (Botox/Výplne)</option>
              <option value="implantaty">Implantáty</option>
              <option value="anestezia">Anestézia & Farmaká</option>
              <option value="sijaci_material">Šijací materiál</option>
              <option value="spotrebny">Spotrebný materiál</option>
            </select>
          </div>

          <div className="overflow-x-auto border border-[#E8E2D9] rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FBF9F6] border-b border-[#E8E2D9] text-[10px] uppercase text-[#8C857B] font-bold">
                  <th className="p-3">Názov materiálu</th>
                  <th className="p-3">Kategória</th>
                  <th className="p-3">Zásoba</th>
                  <th className="p-3">Jedn. Cena</th>
                  <th className="p-3">Celková hodnota</th>
                  <th className="p-3">Šarža (LOT)</th>
                  <th className="p-3">Expirácia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9]">
                {filteredInventory.map(item => {
                  const isLow = item.quantity <= item.minQuantity;
                  return (
                    <tr key={item.id} className="hover:bg-[#FBF9F6] transition-colors">
                      <td className="p-3 font-bold text-[#2C2A29]">
                        {item.name}
                        {isLow && <span className="ml-2 text-[8px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded uppercase font-bold">Nízka zásoba</span>}
                      </td>
                      <td className="p-3 text-[#8C857B] uppercase text-[10px] font-bold">{item.category.replace('_', ' ')}</td>
                      <td className="p-3 font-mono font-bold">
                        <span className={isLow ? 'text-rose-600' : 'text-emerald-700'}>{item.quantity} {item.unit}</span>
                      </td>
                      <td className="p-3 font-mono">{item.costPerUnit.toFixed(2)} €</td>
                      <td className="p-3 font-mono font-bold text-[#2C2A29]">{(item.quantity * item.costPerUnit).toFixed(2)} €</td>
                      <td className="p-3 font-mono text-[#8C857B]">{item.lotNumber || '---'}</td>
                      <td className="p-3 font-mono text-[#8C857B]">{item.expirationDate || '---'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* POHĽAD 2: BALÍČKY PRE VÝKONY */}
      {activeSubTab === 'bundles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bundles.map(bundle => {
            const totalBundleCost = bundle.items.reduce((acc, bItem) => {
              const invItem = inventory.find(i => i.id === bItem.itemId);
              return acc + (invItem ? invItem.costPerUnit * bItem.quantity : 0);
            }, 0);

            return (
              <div key={bundle.id} className="border border-[#E8E2D9] rounded-xl p-5 bg-[#FBF9F6] space-y-3">
                <div className="flex justify-between items-start border-b pb-2 border-[#E8E2D9]">
                  <h4 className="font-bold text-sm text-[#2C2A29] uppercase">{bundle.serviceName}</h4>
                  <span className="text-xs font-mono font-bold text-[#C5A059] bg-white px-2 py-1 rounded border">
                    Materiálové náklady: {totalBundleCost.toFixed(2)} €
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <p className="text-[10px] uppercase text-[#8C857B] font-bold">Skladové položky v balíčku:</p>
                  <ul className="space-y-1">
                    {bundle.items.map((bItem, idx) => {
                      const invItem = inventory.find(i => i.id === bItem.itemId);
                      return (
                        <li key={idx} className="flex justify-between bg-white p-2 rounded border border-[#E8E2D9]">
                          <span>{invItem?.name || 'Neznáma položka'}</span>
                          <span className="font-mono font-bold">{bItem.quantity} {invItem?.unit} ({(invItem ? invItem.costPerUnit * bItem.quantity : 0).toFixed(2)} €)</span>
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

    </div>
  );
}