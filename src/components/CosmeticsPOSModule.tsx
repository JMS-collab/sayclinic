'use client';

import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle, 
  Printer, 
  CreditCard, 
  Banknote, 
  Percent, 
  Package, 
  Sparkles,
  Tag
} from 'lucide-react';
import { Patient } from './PatientDatabase';

interface ProductItem {
  id: string;
  category: 'skincare' | 'post_op' | 'serums' | 'sun_care' | 'collagen';
  name: string;
  brand: string;
  description: string;
  volume: string;
  price: number;
  stock: number;
  badge?: string;
  imageColor: string;
}

const COSMETICS_CATALOG: ProductItem[] = [
  {
    id: 'COS-01',
    category: 'serums',
    name: 'SAY Clinic Cellular Renewal Elixir',
    brand: 'SAY Clinic Lab',
    description: 'Vysokokoncentrované omladzujúce sérum s EGF faktormi a kyselinou hyalurónovou.',
    volume: '30 ml',
    price: 89,
    stock: 24,
    badge: 'Bestseller',
    imageColor: 'from-amber-100 to-amber-200'
  },
  {
    id: 'COS-02',
    category: 'sun_care',
    name: 'Advanced Mineral Invisible Fluid SPF 50+',
    brand: 'SAY Clinic Sun',
    description: '100% minerálny fotoprotekčný fluid pre pleť po zákrokoch a laserovom ošetrení.',
    volume: '50 ml',
    price: 42,
    stock: 38,
    badge: 'Po zákroku',
    imageColor: 'from-orange-100 to-amber-100'
  },
  {
    id: 'COS-03',
    category: 'post_op',
    name: 'Cicatrix Recovery Balm & Arnica',
    brand: 'SAY Pharma',
    description: 'Intenzívny hojivý balzam na redukciu opuchov, modrín a zjemnenie jaziev po operácii.',
    volume: '50 ml',
    price: 38,
    stock: 19,
    badge: 'Hojenie',
    imageColor: 'from-emerald-100 to-teal-100'
  },
  {
    id: 'COS-04',
    category: 'skincare',
    name: 'Hydra-Barrier Ceramide Cream',
    brand: 'SAY Clinic Lab',
    description: 'Hĺbkovo regeneračný krém s 5 typmi ceramidov pre obnovu lipidovej bariéry.',
    volume: '50 ml',
    price: 59,
    stock: 15,
    imageColor: 'from-blue-100 to-indigo-100'
  },
  {
    id: 'COS-05',
    category: 'collagen',
    name: 'Marine Pure Collagen Peptides 10,000mg',
    brand: 'SAY NutriCare',
    description: 'Rybí bioaktívny kolagén s vitamínom C, zinkom a biotínom na 30 dní.',
    volume: '30 sáčkov',
    price: 65,
    stock: 42,
    badge: 'Výživa',
    imageColor: 'from-pink-100 to-rose-100'
  },
  {
    id: 'COS-06',
    category: 'serums',
    name: 'CE Ferulic Triple Antioxidant',
    brand: 'SkinCeuticals',
    description: 'Referenčné antioxidačné sérum s 15% čistým vitamínom C a 1% vitamínom E.',
    volume: '30 ml',
    price: 165,
    stock: 8,
    imageColor: 'from-yellow-100 to-amber-200'
  },
  {
    id: 'COS-07',
    category: 'post_op',
    name: 'K-Ceutic Post-Treatment Recovery Cream',
    brand: 'Dermaceutic',
    description: 'Obnovujúci krém s komplexom K pre rýchle upokojenie začervenania po laseri.',
    volume: '30 ml',
    price: 49,
    stock: 11,
    imageColor: 'from-stone-100 to-amber-100'
  },
  {
    id: 'COS-08',
    category: 'skincare',
    name: 'Gentle Foaming Cleanser pH 5.5',
    brand: 'SAY Clinic Lab',
    description: 'Hodvábna čistiaca pena bez sulfátov s harmančekom a pantenolom.',
    volume: '150 ml',
    price: 28,
    stock: 31,
    imageColor: 'from-teal-50 to-blue-50'
  },
];

interface CartItem {
  product: ProductItem;
  quantity: number;
}

export function CosmeticsPOSModule({ 
  patients = [],
  onSaleCompleted 
}: { 
  patients?: Patient[];
  onSaleCompleted?: (saleData: any) => void;
}) {
  const [catalog, setCatalog] = useState<ProductItem[]>(COSMETICS_CATALOG);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([
    { product: COSMETICS_CATALOG[0], quantity: 1 },
    { product: COSMETICS_CATALOG[1], quantity: 1 },
  ]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  const [lastReceipt, setLastReceipt] = useState<any>(null);

  // Filtrovaný katalóg
  const filteredProducts = catalog.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Pridanie do košíka
  const addToCart = (product: ProductItem) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  // Zmena množstva
  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  // Odstránenie z košíka
  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  // Výpočty cien
  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const total = subtotal - discountAmount;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Dokončenie predaja
  const handleCheckout = () => {
    if (cart.length === 0) return;

    const patient = patients.find(p => p.id === selectedPatientId);
    const receiptData = {
      receiptNumber: `POS-${Date.now().toString().slice(-6)}`,
      date: new Date().toLocaleDateString('sk-SK'),
      time: new Date().toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' }),
      items: [...cart],
      subtotal,
      discountPercent,
      discountAmount,
      total,
      paymentMethod,
      patientName: patient ? patient.name : 'Pultový predaj (Hosť)',
      cashier: 'Recepcia SAY CLINIC',
    };

    // Odpočet zo skladu
    setCatalog(prev => prev.map(prod => {
      const inCart = cart.find(c => c.product.id === prod.id);
      if (inCart) {
        return { ...prod, stock: Math.max(0, prod.stock - inCart.quantity) };
      }
      return prod;
    }));

    setLastReceipt(receiptData);
    setIsReceiptModalOpen(true);
    setCart([]);
    setDiscountPercent(0);

    if (onSaleCompleted) {
      onSaleCompleted({
        date: new Date().toISOString().split('T')[0],
        patientName: receiptData.patientName,
        doctorName: 'Recepcia / Predaj kozmetiky',
        serviceType: `Kozmetika & Starostlivosť (${totalItems} ks)`,
        amount: total
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER KARTY */}
      <div className="relative rounded-3xl p-6 backdrop-blur-3xl bg-white/70 border border-white/80 shadow-[0_8px_32px_0_rgba(197,160,89,0.08)] overflow-hidden">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-gradient-to-br from-[#C5A059]/20 to-[#EAD8CA]/30 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2C2A29] to-[#433E3C] text-[#C5A059] flex items-center justify-center shadow-md">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-serif font-bold text-[#2C2A29] tracking-wide">
                  Predaj kozmetiky & Recepčný POS Pult
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#C5A059]/15 text-[#9C7D2B] border border-[#C5A059]/30">
                  Priamy pultový predaj
                </span>
              </div>
              <p className="text-xs text-[#8C857B] mt-0.5">
                Katalóg liečebnej dermokozmetiky, pooperačnej starostlivosti a výživových doplnkov SAY Clinic
              </p>
            </div>
          </div>

          {/* RÝCHLE ŠTATISTIKY SKLADU */}
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-2xl bg-white/80 border border-[#E8E2D9] text-right shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-[#8C857B] block">Položiek na sklade</span>
              <span className="text-sm font-bold text-[#2C2A29] font-mono">
                {catalog.reduce((sum, p) => sum + p.stock, 0)} ks
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* HLAVNÝ OBSAH - KATALÓG (8 COLS) + POKLADŇA / KOŠÍK (4 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* KATALÓG PRODUKTOV (8 COLS) */}
        <div className="lg:col-span-8 space-y-4">
          {/* VYHĽADÁVANIE A KATEGÓRIE */}
          <div className="rounded-3xl p-4 backdrop-blur-2xl bg-white/70 border border-white/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Vyhľadávanie */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#8C857B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Hľadať produkt alebo značku..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#E8E2D9] text-xs text-[#2C2A29] focus:outline-hidden focus:border-[#C5A059] shadow-inner"
              />
            </div>

            {/* Kategórie filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {[
                { id: 'all', label: 'Všetko' },
                { id: 'serums', label: 'Séra' },
                { id: 'sun_care', label: 'SPF & Slnko' },
                { id: 'post_op', label: 'Po operácii' },
                { id: 'skincare', label: 'Krémy' },
                { id: 'collagen', label: 'Kolagény' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-[#2C2A29] text-white shadow-xs'
                      : 'bg-white/80 hover:bg-white text-[#8C857B] border border-[#E8E2D9]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* GRID PRODUKTOV V LIQUID GLASS ŠTÝLE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="group relative rounded-3xl p-5 backdrop-blur-2xl bg-white/75 border border-white/80 hover:border-[#C5A059]/50 shadow-[0_4px_20px_0_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_0_rgba(197,160,89,0.15)] transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* HORNÝ ŠTÍTOK A OBRÁZOK */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-[10px] uppercase font-bold text-[#C5A059] tracking-wider">
                      {product.brand}
                    </span>
                    {product.badge && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#C5A059]/15 text-[#9C7D2B] border border-[#C5A059]/30">
                        {product.badge}
                      </span>
                    )}
                  </div>

                  {/* KOSMETICKÁ LIQUID GLASS IKONA */}
                  <div className={`w-full h-28 rounded-2xl bg-gradient-to-br ${product.imageColor} border border-white/90 shadow-inner flex items-center justify-center mb-3.5 relative overflow-hidden group-hover:scale-[1.02] transition-transform`}>
                    <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px]" />
                    <Package className="w-10 h-10 text-[#2C2A29]/70 relative z-10" />
                    <span className="absolute bottom-2 right-2 text-[10px] font-mono font-bold bg-white/80 px-2 py-0.5 rounded-md text-[#2C2A29]">
                      {product.volume}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-[#2C2A29] group-hover:text-[#C5A059] transition-colors line-clamp-2 leading-tight">
                    {product.name}
                  </h3>
                  <p className="text-[11px] text-[#8C857B] mt-1 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                <div className="pt-4 mt-3 border-t border-[#E8E2D9]/70 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#8C857B] block">Cena s DPH</span>
                    <span className="text-base font-bold font-mono text-[#2C2A29]">
                      {product.price.toFixed(2)} €
                    </span>
                  </div>

                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.stock <= 0}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all ${
                      product.stock > 0
                        ? 'bg-[#2C2A29] hover:bg-[#C5A059] text-white hover:scale-105 active:scale-95'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{product.stock > 0 ? 'Vložiť' : 'Vypredané'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PRAVÝ PULT: POKLADŇA / KOŠÍK (4 COLS) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-3xl p-6 backdrop-blur-3xl bg-white/85 border border-white shadow-lg space-y-4 sticky top-24">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D9]">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#C5A059]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#2C2A29]">
                  Nákupný košík
                </h2>
              </div>
              <span className="text-xs font-bold text-[#8C857B] font-mono bg-[#FAF8F5] px-2 py-0.5 rounded-lg border border-[#E8E2D9]">
                {totalItems} ks
              </span>
            </div>

            {/* Priradenie k pacientovi */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-[#8C857B] tracking-wider">
                Priradiť k pacientovi (voliteľné):
              </label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full text-xs font-medium p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2C2A29] focus:outline-hidden"
              >
                <option value="">Pultový predaj (Neregistrovaný hosť)</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.birthNumber || p.dob})</option>
                ))}
              </select>
            </div>

            {/* POLOŽKY V KOŠÍKU */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#8C857B]">
                  Košík je prázdny. Kliknite na produkt pre pridanie.
                </div>
              ) : (
                cart.map(({ product, quantity }) => (
                  <div
                    key={product.id}
                    className="p-2.5 rounded-2xl bg-white border border-[#E8E2D9] shadow-2xs flex items-center justify-between gap-2"
                  >
                    <div className="truncate pr-1">
                      <p className="text-xs font-bold text-[#2C2A29] truncate">{product.name}</p>
                      <p className="text-[10px] text-[#8C857B] font-mono">{product.price} € / ks</p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <div className="flex items-center bg-[#FAF8F5] border border-[#E8E2D9] rounded-lg p-0.5">
                        <button
                          onClick={() => updateQuantity(product.id, -1)}
                          className="p-1 rounded-md text-[#8C857B] hover:bg-white hover:text-[#2C2A29]"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold font-mono px-2 text-[#2C2A29]">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(product.id, 1)}
                          className="p-1 rounded-md text-[#8C857B] hover:bg-white hover:text-[#2C2A29]"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-xs font-bold font-mono text-[#2C2A29] min-w-[45px] text-right">
                        {(product.price * quantity).toFixed(2)} €
                      </span>

                      <button
                        onClick={() => removeFromCart(product.id)}
                        className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ZĽAVA PRE VIP / KLIENTOV */}
            <div className="pt-2 border-t border-[#E8E2D9]/60">
              <label className="text-[10px] uppercase font-bold text-[#8C857B] tracking-wider block mb-1.5">
                Klientska / VIP zľava:
              </label>
              <div className="grid grid-cols-4 gap-1.5 text-xs font-semibold">
                {[0, 5, 10, 15].map(disc => (
                  <button
                    key={disc}
                    onClick={() => setDiscountPercent(disc)}
                    className={`py-1.5 rounded-xl border text-center transition-all ${
                      discountPercent === disc
                        ? 'bg-[#C5A059] text-white border-[#C5A059]'
                        : 'bg-[#FAF8F5] text-[#8C857B] border-[#E8E2D9] hover:bg-white'
                    }`}
                  >
                    {disc === 0 ? 'Bez' : `-${disc}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* PLATOBNÁ METÓDA */}
            <div>
              <label className="text-[10px] uppercase font-bold text-[#8C857B] tracking-wider block mb-1.5">
                Spôsob platby:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`flex items-center justify-center gap-2 py-2 rounded-xl border transition-all ${
                    paymentMethod === 'card'
                      ? 'bg-[#2C2A29] text-white border-[#2C2A29] shadow-xs'
                      : 'bg-[#FAF8F5] text-[#8C857B] border-[#E8E2D9]'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Platobná karta</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex items-center justify-center gap-2 py-2 rounded-xl border transition-all ${
                    paymentMethod === 'cash'
                      ? 'bg-[#2C2A29] text-white border-[#2C2A29] shadow-xs'
                      : 'bg-[#FAF8F5] text-[#8C857B] border-[#E8E2D9]'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5" />
                  <span>Hotovosť</span>
                </button>
              </div>
            </div>

            {/* SÚČET A TLAČIDLO ÚHRADY */}
            <div className="pt-3 border-t border-[#E8E2D9] space-y-2">
              <div className="flex justify-between text-xs text-[#8C857B]">
                <span>Medzisúčet:</span>
                <span className="font-mono">{subtotal.toFixed(2)} €</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between text-xs text-rose-600 font-semibold">
                  <span>VIP Zľava ({discountPercent}%):</span>
                  <span className="font-mono">-{discountAmount.toFixed(2)} €</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-[#2C2A29] pt-1">
                <span>Spolu k úhrade:</span>
                <span className="font-mono text-lg text-[#C5A059]">{total.toFixed(2)} €</span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className={`w-full py-3.5 rounded-2xl text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg transition-all ${
                  cart.length > 0
                    ? 'bg-gradient-to-r from-[#C5A059] to-[#9E7B35] text-white hover:scale-[1.02] active:scale-[0.98] shadow-[#C5A059]/30'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>Prijať platbu & Vytlačiť doklad</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* MODAL: TLAČENÝ POKLADNIČNÝ DOKLAD */}
      {isReceiptModalOpen && lastReceipt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center border-b border-[#E8E2D9] pb-4">
              <div className="font-serif font-bold text-base tracking-widest text-[#2C2A29]">
                SAY CLINIC
              </div>
              <p className="text-[10px] text-[#8C857B] uppercase tracking-wider">
                Doklad o úhrade dermokozmetiky
              </p>
            </div>

            <div className="text-xs space-y-1 text-[#8C857B] font-mono">
              <div className="flex justify-between">
                <span>Doklad č.:</span>
                <strong className="text-[#2C2A29]">{lastReceipt.receiptNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span>Dátum a čas:</span>
                <span>{lastReceipt.date} {lastReceipt.time}</span>
              </div>
              <div className="flex justify-between">
                <span>Zákazník:</span>
                <span className="text-[#2C2A29]">{lastReceipt.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span>Platba:</span>
                <span>{lastReceipt.paymentMethod === 'card' ? 'Platobná karta' : 'Hotovosť'}</span>
              </div>
            </div>

            {/* Položky */}
            <div className="border-t border-b border-[#E8E2D9] py-3 space-y-1.5 text-xs">
              {lastReceipt.items.map((item: CartItem, i: number) => (
                <div key={i} className="flex justify-between">
                  <span className="truncate pr-2">{item.quantity}x {item.product.name}</span>
                  <span className="font-mono font-bold flex-shrink-0">
                    {(item.product.price * item.quantity).toFixed(2)} €
                  </span>
                </div>
              ))}
            </div>

            {/* Celková suma */}
            <div className="space-y-1 text-xs">
              {lastReceipt.discountPercent > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>Zľava {lastReceipt.discountPercent}%:</span>
                  <span>-{lastReceipt.discountAmount.toFixed(2)} €</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-[#2C2A29]">
                <span>CELKOM S DPH:</span>
                <span className="font-mono text-base text-[#C5A059]">{lastReceipt.total.toFixed(2)} €</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl border border-[#E8E2D9] text-xs font-semibold text-[#2C2A29] hover:bg-[#FAF8F5] flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Tlačiť doklad
              </button>
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#2C2A29] text-white text-xs font-semibold shadow-md"
              >
                Hotovo (Zavrieť)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
