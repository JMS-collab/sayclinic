'use client';

import React, { useState } from 'react';

interface ExpenseItem {
  id: string;
  date: string;
  title: string;
  category: 'Material' | 'Implants' | 'Rent' | 'Salaries' | 'Other';
  amount: number;
}

interface SaleItem {
  id: string;
  date: string;
  patientName: string;
  doctorName: string;
  serviceType: string;
  amount: number;
}

// Simulované dáta pre tržby a náklady SAY CLINIC
const INITIAL_SALES: SaleItem[] = [
  { id: 'S1', date: '2026-08-11', patientName: 'Ján Novák', doctorName: 'MUDr. Ján Mráz', serviceType: 'Augmentácia prsníkov', amount: 4100 },
  { id: 'S2', date: '2026-08-11', patientName: 'Anna Kováčová', doctorName: 'MUDr. Ján Mráz', serviceType: 'Botox - 1 oblasť', amount: 120 },
  { id: 'S3', date: '2026-08-10', patientName: 'Katarína Slaná', doctorName: 'MUDr. Zuzana Sroková', serviceType: 'Kyselina Hyalurónová 1ml', amount: 290 },
];

const INITIAL_EXPENSES: ExpenseItem[] = [
  { id: 'E1', date: '2026-08-01', title: 'Nákup implantátov Motiva', category: 'Implants', amount: 1200 },
  { id: 'E2', date: '2026-08-02', title: 'Nájomné priestorov', category: 'Rent', amount: 1500 },
  { id: 'E3', date: '2026-08-05', title: 'Zdravotnícky materiál & ihly', category: 'Material', amount: 450 },
];

export default function FinanceCRM() {
  const [sales] = useState<SaleItem[]>(INITIAL_SALES);
  const [expenses, setExpenses] = useState<ExpenseItem[]>(INITIAL_EXPENSES);

  // Form pre nový náklad
  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState<ExpenseItem['category']>('Material');
  const [expAmount, setExpAmount] = useState('');

  // Výpočty
  const totalRevenue = sales.reduce((acc, item) => acc + item.amount, 0);
  const totalExpenses = expenses.reduce((acc, item) => acc + item.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle || !expAmount) return;

    const newExpense: ExpenseItem = {
      id: `E-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      title: expTitle,
      category: expCategory,
      amount: parseFloat(expAmount) || 0,
    };

    setExpenses([newExpense, ...expenses]);
    setExpTitle('');
    setExpAmount('');
  };

  const exportCSV = () => {
    let csv = 'Typ;Dátum;Popis/Pacient;Kategória/Lekár;Suma (€)\n';
    sales.forEach((s) => {
      csv += `Tržba;${s.date};${s.patientName};${s.serviceType};${s.amount}\n`;
    });
    expenses.forEach((e) => {
      csv += `Náklad;${e.date};${e.title};${e.category};-${e.amount}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `SAY_CLINIC_Financny_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-8">
      {/* 3 HLAVNÉ METRIKY: TRŽBY, NÁKLADY, ZISK */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm border-l-4 border-l-emerald-600">
          <p className="text-[10px] uppercase tracking-widest text-[#8C857B] font-semibold">Celkové Tržby</p>
          <p className="text-3xl font-brand text-[#2C2A29] mt-2 font-bold">{totalRevenue.toFixed(2)} €</p>
          <p className="text-[10px] text-[#8C857B] mt-1">{sales.length} ošetrení</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm border-l-4 border-l-rose-500">
          <p className="text-[10px] uppercase tracking-widest text-[#8C857B] font-semibold">Prevádzkové Náklady</p>
          <p className="text-3xl font-brand text-rose-700 mt-2 font-bold">{totalExpenses.toFixed(2)} €</p>
          <p className="text-[10px] text-[#8C857B] mt-1">{expenses.length} položiek</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm border-l-4 border-l-[#C5A059]">
          <p className="text-[10px] uppercase tracking-widest text-[#8C857B] font-semibold">Čistý Zisk (Marža)</p>
          <p className="text-3xl font-brand text-[#2C2A29] mt-2 font-bold">{netProfit.toFixed(2)} €</p>
          <p className="text-[10px] text-[#C5A059] font-bold mt-1">Ziskovosť: {profitMargin} %</p>
        </div>
      </div>

      {/* FORMULÁR PRE PRIDANIE NÁKLADU + EXPORT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-4">
          <div className="border-b border-[#E8E2D9] pb-3">
            <h3 className="font-brand text-lg text-[#2C2A29] uppercase font-bold">Zaevidovať Náklad Ambulancie</h3>
            <p className="text-[10px] text-[#8C857B]">Materiál, nájom, mzdy, implantáty</p>
          </div>

          <form onSubmit={handleAddExpense} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase text-[#8C857B] mb-1">Názov položky</label>
              <input
                type="text"
                required
                placeholder="napr. Nákup Botoxu / Kyseliny"
                value={expTitle}
                onChange={(e) => setExpTitle(e.target.value)}
                className="w-full border border-[#E8E2D9] p-2.5 rounded-xl text-xs bg-[#FBF9F6] text-[#2C2A29]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1">Kategória</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value as ExpenseItem['category'])}
                  className="w-full border border-[#E8E2D9] p-2.5 rounded-xl text-xs bg-[#FBF9F6] text-[#2C2A29]"
                >
                  <option value="Material">Materiál & Lieky</option>
                  <option value="Implants">Implantáty</option>
                  <option value="Rent">Nájom & Režie</option>
                  <option value="Salaries">Mzdy</option>
                  <option value="Other">Ostatné</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#8C857B] mb-1">Suma (€)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  className="w-full border border-[#E8E2D9] p-2.5 rounded-xl text-xs bg-[#FBF9F6] text-[#2C2A29]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#2C2A29] hover:bg-[#C5A059] text-white py-3 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-sm font-medium"
            >
              + Pridať náklad
            </button>
          </form>
        </div>

        {/* TABUĽKA POHYBOV & EXPORT DO CSV */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-3">
            <div>
              <h3 className="font-brand text-lg text-[#2C2A29] uppercase font-bold">Finančný prehľad & Účtovníctvo</h3>
              <p className="text-[10px] text-[#8C857B]">Prehľad tržieb a výdavkov v reálnom čase</p>
            </div>
            <button
              onClick={exportCSV}
              className="bg-[#C5A059] hover:bg-[#b08d48] text-white text-xs px-3.5 py-2 rounded-xl uppercase tracking-wider transition-colors font-medium shadow-sm"
            >
              📥 Export CSV pre účtovníčku
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E8E2D9] text-[10px] uppercase text-[#8C857B] bg-[#FBF9F6]">
                  <th className="p-2.5">Dátum</th>
                  <th className="p-2.5">Typ / Položka</th>
                  <th className="p-2.5">Detaily</th>
                  <th className="p-2.5 text-right">Suma (€)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9]">
                {/* Tržby */}
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-[#FBF9F6]">
                    <td className="p-2.5 text-[#8C857B] font-mono">{s.date}</td>
                    <td className="p-2.5 font-semibold text-emerald-700">Tržba ({s.serviceType})</td>
                    <td className="p-2.5 text-[#2C2A29]">{s.patientName}</td>
                    <td className="p-2.5 text-right font-bold text-emerald-700">+{s.amount.toFixed(2)} €</td>
                  </tr>
                ))}
                {/* Náklady */}
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-[#FBF9F6]">
                    <td className="p-2.5 text-[#8C857B] font-mono">{e.date}</td>
                    <td className="p-2.5 font-semibold text-rose-600">Náklad ({e.category})</td>
                    <td className="p-2.5 text-[#2C2A29]">{e.title}</td>
                    <td className="p-2.5 text-right font-bold text-rose-600">-{e.amount.toFixed(2)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
