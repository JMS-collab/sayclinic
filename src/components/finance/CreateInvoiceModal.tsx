'use client';

import React, { useState } from 'react';
import { 
  Invoice, 
  InvoiceType, 
  PaymentMethod, 
  InvoiceLineItem, 
  FinanceBillingService 
} from '@/services/financeBillingService';
import { Patient } from '../PatientDatabase';
import { 
  X, 
  Plus, 
  Trash2, 
  FileText 
} from 'lucide-react';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvoiceCreated: (invoice: Invoice) => void;
  patients: Patient[];
  initialPatientName?: string;
  initialProcedureName?: string;
  initialAmount?: number;
  initialType?: InvoiceType;
}

export default function CreateInvoiceModal({
  isOpen,
  onClose,
  onInvoiceCreated,
  patients,
  initialPatientName = '',
  initialProcedureName = '',
  initialAmount = 800,
  initialType = 'advance'
}: CreateInvoiceModalProps) {
  const [invoiceType, setInvoiceType] = useState<InvoiceType>(initialType);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientName, setPatientName] = useState(initialPatientName);
  const [patientBirthNumber, setPatientBirthNumber] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientAddress, setPatientAddress] = useState('');

  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [notes, setNotes] = useState(
    invoiceType === 'advance' 
      ? 'Záloha na rezerváciu termínu operácie a operačnej sály.' 
      : 'Konečné vyúčtovanie poskytnutej zdravotnej starostlivosti a materiálu.'
  );

  const [items, setItems] = useState<InvoiceLineItem[]>(() => [
    {
      id: 'it-init-1',
      description: initialProcedureName 
        ? (initialType === 'advance' ? `Záloha: ${initialProcedureName}` : initialProcedureName)
        : (initialType === 'advance' ? 'Záloha na plánovanú operáciu' : 'Operačný zákrok v celkovej anestézii'),
      quantity: 1,
      unit: 'výkon',
      unitPrice: initialAmount,
      vatRate: 0,
      total: initialAmount
    }
  ]);

  const handlePatientSelect = (pId: string) => {
    setSelectedPatientId(pId);
    const pat = patients.find(p => p.id === pId);
    if (pat) {
      setPatientName(pat.name);
      setPatientBirthNumber(pat.birthNumber);
      setPatientPhone(pat.phone);
      setPatientEmail(pat.email);
      setPatientAddress(pat.address);
    }
  };

  const addItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: `it-${prev.length + 1}`,
        description: 'Doplnkový materiál / služba',
        quantity: 1,
        unit: 'ks',
        unitPrice: 100,
        vatRate: 0,
        total: 100
      }
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter(i => i.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceLineItem, val: any) => {
    setItems(items.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: val };
      if (field === 'quantity' || field === 'unitPrice' || field === 'vatRate') {
        const qty = field === 'quantity' ? Number(val) : item.quantity;
        const price = field === 'unitPrice' ? Number(val) : item.unitPrice;
        updated.total = qty * price;
      }
      return updated;
    }));
  };

  const totalAmount = items.reduce((acc, item) => acc + item.total, 0);
  const subtotal = totalAmount; // Zjednodušené bez extra DPH pri oslobodenom
  const vatAmount = items.reduce((acc, item) => {
    if (item.vatRate > 0) {
      const base = item.total / (1 + item.vatRate / 100);
      return acc + (item.total - base);
    }
    return acc;
  }, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      alert('Prosím, zadajte meno pacienta.');
      return;
    }

    const nextNumber = FinanceBillingService.generateNextInvoiceNumber(invoiceType);
    const variableSymbol = nextNumber.replace(/\D/g, '');

    const newInvoice: Invoice = {
      id: `inv-${nextNumber.toLowerCase()}`,
      invoiceNumber: nextNumber,
      type: invoiceType,
      patientId: selectedPatientId || undefined,
      patientName,
      patientBirthNumber,
      patientPhone,
      patientEmail,
      patientAddress,
      issueDate,
      dueDate,
      status: 'unpaid',
      paymentMethod,
      variableSymbol,
      items,
      subtotal: parseFloat(subtotal.toFixed(2)),
      vatAmount: parseFloat(vatAmount.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      paidAmount: 0,
      remainingAmount: parseFloat(totalAmount.toFixed(2)),
      appliedCredit: 0,
      notes,
      createdBy: 'SAY CLINIC Manažment'
    };

    FinanceBillingService.saveInvoice(newInvoice);
    onInvoiceCreated(newInvoice);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-[#E8E2D9] my-8 overflow-hidden">
        
        {/* HLAVIČKA MODÁLU */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#FBF9F6] border-b border-[#E8E2D9]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#2C2A29] flex items-center justify-center text-[#C5A059]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-brand text-lg font-bold text-[#2C2A29] uppercase">
                {invoiceType === 'advance' ? 'Nová Zálohová faktúra' : 'Nová Vyúčtovacia faktúra'}
              </h3>
              <p className="text-[10px] text-[#8C857B] uppercase tracking-wider">
                Vystavenie oficiálneho dokladu pre klienta
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#E8E2D9]/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* PREPÍNAČ TYPU DOKLADU */}
          <div className="grid grid-cols-2 gap-3 p-1.5 bg-[#FBF9F6] rounded-2xl border border-[#E8E2D9]">
            <button
              type="button"
              onClick={() => {
                setInvoiceType('advance');
                setNotes('Záloha na rezerváciu termínu operácie a operačnej sály.');
              }}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                invoiceType === 'advance'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs'
                  : 'text-[#8C857B] hover:text-[#2C2A29]'
              }`}
            >
              📄 Zálohová faktúra (ZF)
            </button>
            <button
              type="button"
              onClick={() => {
                setInvoiceType('standard');
                setNotes('Konečné vyúčtovanie poskytnutej zdravotnej starostlivosti a materiálu.');
              }}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                invoiceType === 'standard'
                  ? 'bg-purple-100 text-purple-900 border border-purple-300 shadow-xs'
                  : 'text-[#8C857B] hover:text-[#2C2A29]'
              }`}
            >
              🧾 Ostrá faktúra / Daňový doklad (FA)
            </button>
          </div>

          {/* VÝBER PACIENTA Z DATABÁZY */}
          {patients.length > 0 && (
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">
                Vybrať existujúceho pacienta z kartotéky
              </label>
              <select
                value={selectedPatientId}
                onChange={(e) => handlePatientSelect(e.target.value)}
                className="w-full border border-[#E8E2D9] p-2.5 rounded-xl text-xs bg-[#FBF9F6] text-[#2C2A29]"
              >
                <option value="">-- Zadať manuálne alebo vybrať z databázy --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.birthNumber || p.phone})</option>
                ))}
              </select>
            </div>
          )}

          {/* ÚDAJE O PACIENTOVI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Meno a priezvisko *</label>
              <input
                type="text"
                required
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full border border-[#E8E2D9] p-2 rounded-xl text-xs bg-white text-[#2C2A29]"
                placeholder="napr. Katarína Kováčová"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Rodné číslo / Dátum narodenia</label>
              <input
                type="text"
                value={patientBirthNumber}
                onChange={(e) => setPatientBirthNumber(e.target.value)}
                className="w-full border border-[#E8E2D9] p-2 rounded-xl text-xs bg-white text-[#2C2A29]"
                placeholder="napr. 915214/4512"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Telefón</label>
              <input
                type="text"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                className="w-full border border-[#E8E2D9] p-2 rounded-xl text-xs bg-white text-[#2C2A29]"
                placeholder="+421 905 123 456"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Email</label>
              <input
                type="email"
                value={patientEmail}
                onChange={(e) => setPatientEmail(e.target.value)}
                className="w-full border border-[#E8E2D9] p-2 rounded-xl text-xs bg-white text-[#2C2A29]"
                placeholder="pacient@email.sk"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Bydlisko / Adresa</label>
              <input
                type="text"
                value={patientAddress}
                onChange={(e) => setPatientAddress(e.target.value)}
                className="w-full border border-[#E8E2D9] p-2 rounded-xl text-xs bg-white text-[#2C2A29]"
                placeholder="Ulica, Mesto, PSČ"
              />
            </div>
          </div>

          {/* DÁTUMY A PLATOBNÁ METÓDA */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Dátum vystavenia</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full border border-[#E8E2D9] p-2 rounded-xl text-xs bg-white text-[#2C2A29]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Dátum splatnosti</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border border-[#E8E2D9] p-2 rounded-xl text-xs bg-white text-[#2C2A29]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Spôsob úhrady</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full border border-[#E8E2D9] p-2 rounded-xl text-xs bg-white text-[#2C2A29]"
              >
                <option value="bank_transfer">Bankový prevod (QR kód)</option>
                <option value="card">Platobná karta / Terminál</option>
                <option value="cash">Hotovosť</option>
                <option value="credit_deduction">Odpočet z kreditu</option>
              </select>
            </div>
          </div>

          {/* POLOŽKY DOKLADU */}
          <div className="space-y-3 border-t border-[#E8E2D9] pt-4">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-xs uppercase text-[#2C2A29] tracking-wider">Položky faktúry</h4>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 text-xs font-bold text-[#C5A059] hover:text-[#b08d48]"
              >
                <Plus className="w-3.5 h-3.5" />
                Pridať položku
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-[#FBF9F6] p-2.5 rounded-xl border border-[#E8E2D9]">
                  <div className="col-span-6">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      placeholder="Popis položky"
                      className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                      placeholder="Počet"
                      className="w-full border border-[#E8E2D9] p-1.5 rounded-lg text-xs bg-white text-center font-mono"
                    />
                  </div>
                  <div className="col-span-3">
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)}
                        placeholder="Cena"
                        className="w-full border border-[#E8E2D9] p-1.5 pr-6 rounded-lg text-xs bg-white text-right font-mono font-bold"
                      />
                      <span className="absolute right-2 top-1.5 text-xs text-[#8C857B]">€</span>
                    </div>
                  </div>
                  <div className="col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length <= 1}
                      className="text-rose-500 hover:text-rose-700 disabled:opacity-30 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 text-right">
              <div className="bg-[#2C2A29] text-white p-3 rounded-xl min-w-48 text-right">
                <p className="text-[10px] text-[#8C857B] uppercase font-bold">Celková suma s DPH</p>
                <p className="text-xl font-mono font-bold text-[#C5A059]">{totalAmount.toFixed(2)} €</p>
              </div>
            </div>
          </div>

          {/* POZNÁMKA */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-[#8C857B] mb-1">Poznámka na faktúre</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-[#E8E2D9] p-2 rounded-xl text-xs bg-white text-[#2C2A29]"
            />
          </div>

          {/* TLAČIDLÁ */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#E8E2D9]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#E8E2D9] text-xs font-bold text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#FBF9F6]"
            >
              Zrušiť
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#2C2A29] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
            >
              Vystaviť {invoiceType === 'advance' ? 'zálohovú faktúru' : 'faktúru'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
