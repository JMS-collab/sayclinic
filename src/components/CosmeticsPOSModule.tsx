'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Package,
  Pencil,
  Sparkles,
  RotateCcw,
  X,
  AlertCircle,
  ArrowRight,
  Tag,
  SlidersHorizontal,
  FileCheck
} from 'lucide-react';
import { Patient } from './PatientDatabase';
import { 
  CosmeticProduct, 
  CosmeticBrand, 
  CosmeticCategory, 
  getCosmeticsCatalog, 
  saveCosmeticsCatalog, 
  resetCosmeticsCatalog 
} from '@/data/cosmeticsCatalog';
import { PatientPlan, CosmeticRoutineItem } from '@/data/patientPlanConfig';

interface CartItem {
  product: CosmeticProduct;
  quantity: number;
}

interface CosmeticsPOSModuleProps {
  patients?: Patient[];
  onSaleCompleted?: (saleData: any) => void;
  initialSelectedPatientId?: string;
  initialPrefillItems?: Array<{
    name: string;
    brand?: string;
    price?: number;
    quantity?: number;
  }>;
}

export function CosmeticsPOSModule({ 
  patients = [],
  onSaleCompleted,
  initialSelectedPatientId,
  initialPrefillItems
}: CosmeticsPOSModuleProps) {
  const [catalog, setCatalog] = useState<CosmeticProduct[]>(() => getCosmeticsCatalog());
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Košík
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
  const [selectedPatientId, setSelectedPatientId] = useState<string>(initialSelectedPatientId || '');
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  const [lastReceipt, setLastReceipt] = useState<any>(null);
  const [receiptSeq, setReceiptSeq] = useState<number>(10482);

  // Modal editácie / pridania produktu
  const [isEditingProduct, setIsEditingProduct] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Partial<CosmeticProduct> | null>(null);

  // Synchronizácia predvyplneného pacienta alebo položiek z propov
  useEffect(() => {
    if (initialSelectedPatientId) {
      setSelectedPatientId(initialSelectedPatientId);
    }
  }, [initialSelectedPatientId]);

  useEffect(() => {
    if (initialPrefillItems && initialPrefillItems.length > 0) {
      const newCartItems: CartItem[] = [];
      initialPrefillItems.forEach(item => {
        const found = catalog.find(p => 
          p.name.toLowerCase().includes(item.name.toLowerCase()) || 
          item.name.toLowerCase().includes(p.name.toLowerCase())
        );
        if (found) {
          newCartItems.push({ product: found, quantity: item.quantity || 1 });
        } else {
          // Vytvoríme syntetickú položku
          const customProd: CosmeticProduct = {
            id: `CUSTOM-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            brand: (item.brand as CosmeticBrand) || 'SAY Clinic Lab',
            name: item.name,
            category: 'skincare',
            description: 'Naordinované v pláne pacienta',
            volume: 'Balenie',
            price: item.price || 35,
            stock: 99,
            badge: 'Z plánu',
            imageColor: 'from-amber-100 to-amber-200'
          };
          newCartItems.push({ product: customProd, quantity: item.quantity || 1 });
        }
      });
      if (newCartItems.length > 0) {
        setCart(prev => {
          const merged = [...prev];
          newCartItems.forEach(newItem => {
            const exIdx = merged.findIndex(m => m.product.name.toLowerCase() === newItem.product.name.toLowerCase());
            if (exIdx >= 0) {
              merged[exIdx].quantity += newItem.quantity;
            } else {
              merged.push(newItem);
            }
          });
          return merged;
        });
      }
    }
  }, [initialPrefillItems, catalog]);

  // Načítanie plánov pre vybraného pacienta z localStorage
  const activePatientPlan = useMemo<PatientPlan | null>(() => {
    if (!selectedPatientId || typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem('say_clinic_patient_plans');
      if (saved) {
        const allPlans: Record<string, PatientPlan[]> = JSON.parse(saved);
        const patientPlans = allPlans[selectedPatientId];
        if (patientPlans && patientPlans.length > 0) {
          return patientPlans[0]; // Najnovší plán
        }
      }
    } catch (e) {
      console.error('Chyba načítania plánov v POS:', e);
    }
    return null;
  }, [selectedPatientId]);

  // Položky naordinovanej domácej kozmetiky z plánu vybraného pacienta
  const patientPlanRoutine = useMemo(() => {
    if (!activePatientPlan?.cosmeticsRoutine) return [];
    const morning = (activePatientPlan.cosmeticsRoutine.morning || []).map(m => ({ ...m, timeOfDay: 'Ráno' }));
    const evening = (activePatientPlan.cosmeticsRoutine.evening || []).map(e => ({ ...e, timeOfDay: 'Večer' }));
    return [...morning, ...evening];
  }, [activePatientPlan]);

  // Pomocná funkcia na nájdenie produktu v katalógu podľa rutiny
  const findProductForRoutineItem = (routineItem: CosmeticRoutineItem): CosmeticProduct => {
    const directMatch = catalog.find(p => 
      p.name.toLowerCase().includes(routineItem.productName.toLowerCase()) ||
      routineItem.productName.toLowerCase().includes(p.name.toLowerCase())
    );
    if (directMatch) return directMatch;

    return {
      id: `PLAN-REC-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      brand: (routineItem.brand as CosmeticBrand) || 'SAY Clinic Lab',
      name: routineItem.productName,
      category: 'skincare',
      description: routineItem.purpose || routineItem.usage || 'Odporúčané lekárom v pláne pacienta',
      volume: 'Balenie',
      price: routineItem.price || 39,
      stock: 50,
      badge: 'Z plánu pacienta',
      imageColor: 'from-amber-100 to-amber-200'
    };
  };

  // Vloženie celého plánu do košíka (1-klik)
  const handleAddAllFromPatientPlan = () => {
    if (patientPlanRoutine.length === 0) return;

    setCart(prev => {
      const nextCart = [...prev];
      patientPlanRoutine.forEach(item => {
        const prod = findProductForRoutineItem(item);
        const existingIdx = nextCart.findIndex(c => c.product.name.toLowerCase() === prod.name.toLowerCase());
        if (existingIdx >= 0) {
          nextCart[existingIdx].quantity += 1;
        } else {
          nextCart.push({ product: prod, quantity: 1 });
        }
      });
      return nextCart;
    });
  };

  // Vloženie jednej položky z plánu do košíka
  const handleAddSingleRoutineItem = (item: CosmeticRoutineItem) => {
    const prod = findProductForRoutineItem(item);
    addToCart(prod);
  };

  // Filtrovaný katalóg
  const filteredProducts = useMemo(() => {
    return catalog.filter(item => {
      const matchesBrand = selectedBrand === 'all' || item.brand === selectedBrand;
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        item.name.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.keyIngredients && item.keyIngredients.some(k => k.toLowerCase().includes(q)));
      
      return matchesBrand && matchesCategory && matchesSearch;
    });
  }, [catalog, selectedBrand, selectedCategory, searchQuery]);

  // Pridanie do košíka
  const addToCart = (product: CosmeticProduct) => {
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

  // Otvorenie editora produktu
  const handleEditProduct = (prod: CosmeticProduct, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProduct({ ...prod });
    setIsEditingProduct(true);
  };

  // Vytvorenie nového produktu
  const handleCreateNewProduct = () => {
    setEditingProduct({
      id: `PROD-${Date.now()}`,
      brand: 'SkinCeuticals',
      name: '',
      category: 'serums',
      description: '',
      volume: '30 ml',
      price: 49.00,
      stock: 10,
      badge: 'Novinka',
      imageColor: 'from-amber-100 to-amber-200'
    });
    setIsEditingProduct(true);
  };

  // Uloženie upraveného produktu
  const handleSaveEditedProduct = () => {
    if (!editingProduct || !editingProduct.name || !editingProduct.brand) return;

    const fullProduct: CosmeticProduct = {
      id: editingProduct.id || `PROD-${Date.now()}`,
      brand: (editingProduct.brand as CosmeticBrand) || 'SkinCeuticals',
      name: editingProduct.name,
      category: (editingProduct.category as CosmeticCategory) || 'serums',
      description: editingProduct.description || '',
      volume: editingProduct.volume || '50 ml',
      price: Number(editingProduct.price) || 0,
      stock: Number(editingProduct.stock) || 0,
      badge: editingProduct.badge || undefined,
      imageUrl: editingProduct.imageUrl || undefined,
      imageColor: editingProduct.imageColor || 'from-amber-100 to-amber-200',
      keyIngredients: editingProduct.keyIngredients || []
    };

    setCatalog(prev => {
      const exists = prev.find(p => p.id === fullProduct.id);
      let updated: CosmeticProduct[];
      if (exists) {
        updated = prev.map(p => p.id === fullProduct.id ? fullProduct : p);
      } else {
        updated = [fullProduct, ...prev];
      }
      saveCosmeticsCatalog(updated);
      return updated;
    });

    // Aktualizujeme aj položky v košíku ak sa zmenila cena
    setCart(prev => prev.map(c => 
      c.product.id === fullProduct.id ? { ...c, product: fullProduct } : c
    ));

    setIsEditingProduct(false);
    setEditingProduct(null);
  };

  // Zmazanie produktu
  const handleDeleteProduct = (productId: string) => {
    if (!window.confirm('Naozaj chcete odstrániť tento produkt z katalógu kliniky?')) return;
    setCatalog(prev => {
      const updated = prev.filter(p => p.id !== productId);
      saveCosmeticsCatalog(updated);
      return updated;
    });
    removeFromCart(productId);
    setIsEditingProduct(false);
  };

  // Obnovenie predvoleného portfólia
  const handleResetCatalog = () => {
    if (window.confirm('Chcete obnoviť predvolený katalóg kliniky (SkinCeuticals, La Roche-Posay, CeraVe, Vichy, SAY Clinic)? Vaše zmeny budú resetované.')) {
      const def = resetCosmeticsCatalog();
      setCatalog(def);
    }
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
    const receiptNumStr = `POS-${receiptSeq}`;
    const receiptData = {
      receiptNumber: receiptNumStr,
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
    setCatalog(prev => {
      const updated = prev.map(prod => {
        const inCart = cart.find(c => c.product.id === prod.id);
        if (inCart) {
          return { ...prod, stock: Math.max(0, prod.stock - inCart.quantity) };
        }
        return prod;
      });
      saveCosmeticsCatalog(updated);
      return updated;
    });

    setLastReceipt(receiptData);
    setIsReceiptModalOpen(true);
    setCart([]);
    setDiscountPercent(0);
    setReceiptSeq(prev => prev + 1);

    if (onSaleCompleted) {
      onSaleCompleted({
        date: new Date().toISOString().split('T')[0],
        patientName: receiptData.patientName,
        doctorName: 'Recepcia / Predaj kozmetiky',
        serviceType: `Dermokozmetika & Starostlivosť (${totalItems} ks)`,
        amount: total
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER KARTY */}
      <div className="relative rounded-3xl p-6 backdrop-blur-3xl bg-white/75 border border-white/80 shadow-[0_8px_32px_0_rgba(197,160,89,0.08)] overflow-hidden">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-gradient-to-br from-[#C5A059]/20 to-[#EAD8CA]/30 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2C2A29] to-[#433E3C] text-[#C5A059] flex items-center justify-center shadow-md">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-serif font-bold text-[#2C2A29] tracking-wide">
                  Predaj kozmetiky & Recepčný POS Pult
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#C5A059]/15 text-[#9C7D2B] border border-[#C5A059]/30">
                  Priamy pultový predaj
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  Portfólio 2026
                </span>
              </div>
              <p className="text-xs text-[#8C857B] mt-0.5">
                Oficiálne portfólio <strong>SkinCeuticals, La Roche-Posay, CeraVe, Vichy</strong> a <strong>SAY Clinic Lab</strong> s možnosťou úpravy cien a skladu
              </p>
            </div>
          </div>

          {/* AKCIE SPRÁVY KATALÓGU */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCreateNewProduct}
              className="px-3.5 py-2 rounded-2xl bg-[#2C2A29] hover:bg-[#C5A059] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Pridať produkt</span>
            </button>
            <button
              onClick={handleResetCatalog}
              title="Obnoviť predvolené portfólio kliniky"
              className="p-2 rounded-2xl bg-white hover:bg-stone-100 text-[#8C857B] border border-[#E8E2D9] text-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <div className="px-3.5 py-2 rounded-2xl bg-white/80 border border-[#E8E2D9] text-right shadow-2xs">
              <span className="text-[9px] uppercase font-bold text-[#8C857B] block">Položiek v ponuke</span>
              <span className="text-xs font-bold text-[#2C2A29] font-mono">
                {catalog.length} produktov ({catalog.reduce((sum, p) => sum + p.stock, 0)} ks)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* NOTIFIKÁCIA ODPORÚČANEJ KOZMETIKY Z PLÁNU VYBRANÉHO PACIENTA */}
      {activePatientPlan && patientPlanRoutine.length > 0 && (
        <div className="rounded-3xl p-5 bg-gradient-to-r from-amber-500/10 via-amber-100/40 to-yellow-500/10 border-2 border-[#C5A059]/40 shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#C5A059] text-white flex items-center justify-center text-sm shadow-xs">
                ✨
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-[#2C2A29] uppercase tracking-wider">
                    Odporúčaná domáca kozmetika z liečebného plánu pacienta
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#2C2A29] text-[#C5A059]">
                    MUDr. Ján Mráz
                  </span>
                </div>
                <p className="text-xs text-[#8C857B]">
                  Plán: <strong>{activePatientPlan.title}</strong> • {patientPlanRoutine.length} naordinovaných produktov
                </p>
              </div>
            </div>

            <button
              onClick={handleAddAllFromPatientPlan}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#9E7B35] text-white text-xs font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Vložiť celú odporúčanú rutinu do košíka (1-klik)</span>
            </button>
          </div>

          {/* Rýchly prehľad položiek z plánu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
            {patientPlanRoutine.map((item, idx) => (
              <div 
                key={idx} 
                className="bg-white/90 border border-[#C5A059]/30 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-2xs hover:border-[#C5A059] transition-all"
              >
                <div className="truncate pr-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-bold uppercase text-[#C5A059]">
                      {item.timeOfDay} • {item.category}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-[#2C2A29] truncate" title={item.productName}>
                    {item.productName}
                  </p>
                  <p className="text-[10px] text-[#8C857B] font-mono">
                    {item.brand} • {item.price ? `${item.price} €` : 'cca 35 €'}
                  </p>
                </div>
                <button
                  onClick={() => handleAddSingleRoutineItem(item)}
                  title="Vložiť tento produkt do košíka"
                  className="p-1.5 rounded-lg bg-[#FAF8F5] hover:bg-[#C5A059] text-[#2C2A29] hover:text-white border border-[#E8E2D9] transition-all flex-shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HLAVNÝ OBSAH - KATALÓG (8 COLS) + POKLADŇA / KOŠÍK (4 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* KATALÓG PRODUKTOV (8 COLS) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* LIŠTA ZNAČIEK (BRAND FILTER) */}
          <div className="rounded-3xl p-3.5 backdrop-blur-2xl bg-white/80 border border-white/90 shadow-xs flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-3.5">
            <span className="text-[10px] font-bold uppercase text-[#8C857B] tracking-wider px-2 shrink-0">
              Značka:
            </span>
            {[
              { id: 'all', label: 'Všetky značky' },
              { id: 'SkinCeuticals', label: 'SkinCeuticals' },
              { id: 'La Roche-Posay', label: 'La Roche-Posay' },
              { id: 'CeraVe', label: 'CeraVe' },
              { id: 'Vichy', label: 'Vichy' },
              { id: 'SAY Clinic Lab', label: 'SAY Clinic Lab' },
              { id: 'Dermaceutic', label: 'Dermaceutic' }
            ].map(b => (
              <button
                key={b.id}
                onClick={() => setSelectedBrand(b.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedBrand === b.id
                    ? 'bg-[#2C2A29] text-[#C5A059] shadow-sm'
                    : 'bg-[#FAF8F5] hover:bg-white text-[#6B6357] border border-[#E8E2D9]'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* VYHĽADÁVANIE A KATEGÓRIE */}
          <div className="rounded-3xl p-4 backdrop-blur-2xl bg-white/70 border border-white/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Vyhľadávanie */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-[#8C857B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Hľadať produkt, aktívnu látku (napr. retinol, C E Ferulic)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#E8E2D9] text-xs text-[#2C2A29] focus:outline-hidden focus:border-[#C5A059] shadow-inner"
              />
            </div>

            {/* Kategórie filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {[
                { id: 'all', label: 'Všetko' },
                { id: 'serums', label: 'Séra & Vitamín C' },
                { id: 'sun_care', label: 'SPF & Slnko' },
                { id: 'post_op', label: 'Po zákroku & Hojenie' },
                { id: 'skincare', label: 'Krémy & Hydratácia' },
                { id: 'cleanser', label: 'Čistenie' },
                { id: 'retinoids', label: 'Anti-Aging & Retinol' },
                { id: 'collagen_body', label: 'Výživa & Telo' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-[#C5A059] text-white shadow-xs'
                      : 'bg-white/80 hover:bg-white text-[#8C857B] border border-[#E8E2D9]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* VÝPIS POČTU NÁJDENÝCH PRODUKTOV */}
          <div className="flex justify-between items-center px-1 text-xs text-[#8C857B]">
            <span>Zobrazených <strong>{filteredProducts.length}</strong> produktov</span>
            {selectedBrand !== 'all' && (
              <span className="text-[#C5A059] font-semibold">
                Filtrované: {selectedBrand}
              </span>
            )}
          </div>

          {/* GRID PRODUKTOV */}
          {filteredProducts.length === 0 ? (
            <div className="rounded-3xl p-12 bg-white/60 border border-[#E8E2D9] text-center space-y-3">
              <Package className="w-12 h-12 text-[#8C857B] mx-auto opacity-50" />
              <h3 className="text-sm font-bold text-[#2C2A29]">Žiaden produkt nezodpovedá filtru</h3>
              <p className="text-xs text-[#8C857B]">Skúste upraviť hľadaný výraz alebo vybrať inú kategóriu či značku.</p>
              <button
                onClick={() => { setSelectedBrand('all'); setSelectedCategory('all'); setSearchQuery(''); }}
                className="text-xs text-[#C5A059] font-bold hover:underline"
              >
                Zrušiť všetky filtre
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="group relative rounded-3xl p-5 backdrop-blur-2xl bg-white/80 border border-white/90 hover:border-[#C5A059]/50 shadow-[0_4px_20px_0_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_0_rgba(197,160,89,0.15)] transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* HORNÝ ŠTÍTOK A AKCIE */}
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${
                        product.brand === 'SkinCeuticals' ? 'bg-amber-100 text-amber-900 border border-amber-200' :
                        product.brand === 'La Roche-Posay' ? 'bg-blue-100 text-blue-900 border border-blue-200' :
                        product.brand === 'CeraVe' ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' :
                        product.brand === 'Vichy' ? 'bg-rose-100 text-rose-900 border border-rose-200' :
                        'bg-stone-100 text-stone-900 border border-stone-200'
                      }`}>
                        {product.brand}
                      </span>
                      
                      <div className="flex items-center gap-1">
                        {product.badge && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#C5A059]/15 text-[#9C7D2B] border border-[#C5A059]/30">
                            {product.badge}
                          </span>
                        )}
                        {/* Tlačidlo rýchlej editácie produktu */}
                        <button
                          onClick={(e) => handleEditProduct(product, e)}
                          title="Upraviť cenu, sklad alebo obrázok"
                          className="p-1 rounded-lg text-stone-400 hover:text-[#C5A059] hover:bg-stone-100 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* VIZUÁL / OBRÁZOK PRODUKTU */}
                    <div className={`w-full h-32 rounded-2xl bg-gradient-to-br ${product.imageColor} border border-white/90 shadow-inner flex items-center justify-center mb-3.5 relative overflow-hidden group-hover:scale-[1.01] transition-transform`}>
                      {product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-full h-full object-cover rounded-2xl"
                          onError={(e) => {
                            // Skryť poškodený obrázok a zobraziť fallback
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px]" />
                          <div className="relative z-10 text-center p-2">
                            <Package className="w-8 h-8 text-[#2C2A29]/60 mx-auto mb-1" />
                            <span className="text-[10px] font-bold text-[#2C2A29]/80 uppercase tracking-wider block">
                              {product.brand}
                            </span>
                          </div>
                        </>
                      )}
                      <span className="absolute bottom-2 right-2 text-[10px] font-mono font-bold bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-md text-[#2C2A29] shadow-2xs border border-[#E8E2D9]">
                        {product.volume}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-[#2C2A29] group-hover:text-[#C5A059] transition-colors line-clamp-2 leading-snug">
                      {product.name}
                    </h3>
                    <p className="text-[11px] text-[#8C857B] mt-1 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>

                    {/* Kľúčové zložky */}
                    {product.keyIngredients && product.keyIngredients.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {product.keyIngredients.slice(0, 2).map((ing, i) => (
                          <span key={i} className="text-[9px] bg-white/70 text-stone-600 px-1.5 py-0.2 rounded border border-[#E8E2D9]">
                            {ing}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3.5 mt-3 border-t border-[#E8E2D9]/70 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-[#8C857B]">Cena s DPH:</span>
                        <span className="text-[10px] font-mono text-emerald-600 font-bold">
                          ({product.stock} ks skladom)
                        </span>
                      </div>
                      <span className="text-base font-bold font-mono text-[#2C2A29]">
                        {product.price.toFixed(2)} €
                      </span>
                    </div>

                    <button
                      onClick={() => addToCart(product)}
                      disabled={product.stock <= 0}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer ${
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
          )}
        </div>

        {/* PRAVÝ PULT: POKLADŇA / KOŠÍK (4 COLS) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-3xl p-6 backdrop-blur-3xl bg-white/90 border border-white shadow-lg space-y-4 sticky top-24">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D9]">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#C5A059]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#2C2A29]">
                  Nákupný košík
                </h2>
              </div>
              <span className="text-xs font-bold text-[#8C857B] font-mono bg-[#FAF8F5] px-2.5 py-0.5 rounded-lg border border-[#E8E2D9]">
                {totalItems} ks
              </span>
            </div>

            {/* Priradenie k pacientovi */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-[#8C857B] tracking-wider block">
                Zákazník / Pacient kliniky:
              </label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full text-xs font-medium p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2C2A29] focus:outline-hidden focus:border-[#C5A059]"
              >
                <option value="">Pultový predaj (Neregistrovaný hosť)</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.birthNumber || p.dob})</option>
                ))}
              </select>
            </div>

            {/* POLOŽKY V KOŠÍKU */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#8C857B] border border-dashed border-[#E8E2D9] rounded-2xl p-4">
                  Košík je prázdny. Vyberte produkty z katalógu vyššie alebo vložte odporúčanú rutinu pacienta.
                </div>
              ) : (
                cart.map(({ product, quantity }) => (
                  <div
                    key={product.id}
                    className="p-2.5 rounded-2xl bg-white border border-[#E8E2D9] shadow-2xs flex items-center justify-between gap-2"
                  >
                    <div className="truncate pr-1">
                      <p className="text-xs font-bold text-[#2C2A29] truncate">{product.name}</p>
                      <p className="text-[10px] text-[#8C857B] font-mono">
                        <span className="text-[#C5A059] font-semibold">{product.brand}</span> • {product.price.toFixed(2)} € / ks
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <div className="flex items-center bg-[#FAF8F5] border border-[#E8E2D9] rounded-lg p-0.5">
                        <button
                          onClick={() => updateQuantity(product.id, -1)}
                          className="p-1 rounded-md text-[#8C857B] hover:bg-white hover:text-[#2C2A29] cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold font-mono px-2 text-[#2C2A29]">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(product.id, 1)}
                          className="p-1 rounded-md text-[#8C857B] hover:bg-white hover:text-[#2C2A29] cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-xs font-bold font-mono text-[#2C2A29] min-w-[50px] text-right">
                        {(product.price * quantity).toFixed(2)} €
                      </span>

                      <button
                        onClick={() => removeFromCart(product.id)}
                        className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
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
                    className={`py-1.5 rounded-xl border text-center transition-all cursor-pointer ${
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
                  className={`flex items-center justify-center gap-2 py-2 rounded-xl border transition-all cursor-pointer ${
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
                  className={`flex items-center justify-center gap-2 py-2 rounded-xl border transition-all cursor-pointer ${
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
                className={`w-full py-3.5 rounded-2xl text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
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

      {/* MODAL EDITÁCIE PRODUKTU (CENA, SKLAD, OBRÁZOK, POPIS) */}
      {isEditingProduct && editingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-[#E8E2D9]">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#C5A059]" />
                <h3 className="font-serif font-bold text-base text-[#2C2A29]">
                  {editingProduct.id?.startsWith('PROD-') && !catalog.some(p => p.id === editingProduct.id) ? 'Pridať nový produkt' : 'Upraviť produkt & Cenu'}
                </h3>
              </div>
              <button
                onClick={() => setIsEditingProduct(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-[#2C2A29] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Názov produktu */}
              <div>
                <label className="font-bold text-[#8C857B] block mb-1 uppercase tracking-wider text-[10px]">
                  Názov produktu:
                </label>
                <input
                  type="text"
                  value={editingProduct.name || ''}
                  onChange={(e) => setEditingProduct(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-[#E8E2D9] font-medium text-[#2C2A29] focus:border-[#C5A059] focus:outline-hidden"
                  placeholder="napr. C E Ferulic Sérum"
                />
              </div>

              {/* Značka a Kategória */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#8C857B] block mb-1 uppercase tracking-wider text-[10px]">
                    Značka:
                  </label>
                  <select
                    value={editingProduct.brand || 'SkinCeuticals'}
                    onChange={(e) => setEditingProduct(prev => ({ ...prev, brand: e.target.value as CosmeticBrand }))}
                    className="w-full p-2.5 rounded-xl border border-[#E8E2D9] font-medium text-[#2C2A29] focus:border-[#C5A059] focus:outline-hidden"
                  >
                    <option value="SkinCeuticals">SkinCeuticals</option>
                    <option value="La Roche-Posay">La Roche-Posay</option>
                    <option value="CeraVe">CeraVe</option>
                    <option value="Vichy">Vichy</option>
                    <option value="SAY Clinic Lab">SAY Clinic Lab</option>
                    <option value="Dermaceutic">Dermaceutic</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#8C857B] block mb-1 uppercase tracking-wider text-[10px]">
                    Kategória:
                  </label>
                  <select
                    value={editingProduct.category || 'serums'}
                    onChange={(e) => setEditingProduct(prev => ({ ...prev, category: e.target.value as CosmeticCategory }))}
                    className="w-full p-2.5 rounded-xl border border-[#E8E2D9] font-medium text-[#2C2A29] focus:border-[#C5A059] focus:outline-hidden"
                  >
                    <option value="serums">Séra & Antioxidanty</option>
                    <option value="skincare">Krémy & Hydratácia</option>
                    <option value="sun_care">SPF & Slnko</option>
                    <option value="post_op">Po zákroku & Hojenie</option>
                    <option value="cleanser">Čistenie pleti</option>
                    <option value="retinoids">Anti-Aging & Retinol</option>
                    <option value="collagen_body">Výživa & Telo</option>
                  </select>
                </div>
              </div>

              {/* Cena, Sklad, Objem */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-[#8C857B] block mb-1 uppercase tracking-wider text-[10px]">
                    Cena (€ s DPH):
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    value={editingProduct.price ?? 0}
                    onChange={(e) => setEditingProduct(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full p-2.5 rounded-xl border border-[#E8E2D9] font-mono font-bold text-[#2C2A29] focus:border-[#C5A059] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#8C857B] block mb-1 uppercase tracking-wider text-[10px]">
                    Sklad (ks):
                  </label>
                  <input
                    type="number"
                    value={editingProduct.stock ?? 0}
                    onChange={(e) => setEditingProduct(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                    className="w-full p-2.5 rounded-xl border border-[#E8E2D9] font-mono font-bold text-[#2C2A29] focus:border-[#C5A059] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#8C857B] block mb-1 uppercase tracking-wider text-[10px]">
                    Objem:
                  </label>
                  <input
                    type="text"
                    value={editingProduct.volume || ''}
                    onChange={(e) => setEditingProduct(prev => ({ ...prev, volume: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-[#E8E2D9] font-medium text-[#2C2A29] focus:border-[#C5A059] focus:outline-hidden"
                    placeholder="30 ml"
                  />
                </div>
              </div>

              {/* URL Obrázka & Odznak */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#8C857B] block mb-1 uppercase tracking-wider text-[10px]">
                    Obrázok (URL adresa):
                  </label>
                  <input
                    type="text"
                    value={editingProduct.imageUrl || ''}
                    onChange={(e) => setEditingProduct(prev => ({ ...prev, imageUrl: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-[#E8E2D9] text-[#2C2A29] focus:border-[#C5A059] focus:outline-hidden"
                    placeholder="https://.../obrazok.jpg"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#8C857B] block mb-1 uppercase tracking-wider text-[10px]">
                    Odznak / Badge:
                  </label>
                  <input
                    type="text"
                    value={editingProduct.badge || ''}
                    onChange={(e) => setEditingProduct(prev => ({ ...prev, badge: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-[#E8E2D9] text-[#2C2A29] focus:border-[#C5A059] focus:outline-hidden"
                    placeholder="Bestseller, Po zákroku..."
                  />
                </div>
              </div>

              {/* Popis produktu */}
              <div>
                <label className="font-bold text-[#8C857B] block mb-1 uppercase tracking-wider text-[10px]">
                  Klinický popis & Indikácia:
                </label>
                <textarea
                  rows={3}
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-[#E8E2D9] text-xs text-[#2C2A29] focus:border-[#C5A059] focus:outline-hidden resize-none leading-relaxed"
                  placeholder="Klinické účinky, aktívne látky, použitie po zákrokoch..."
                />
              </div>
            </div>

            {/* Tlačidlá akcie */}
            <div className="flex items-center justify-between pt-3 border-t border-[#E8E2D9]">
              {editingProduct.id && catalog.some(p => p.id === editingProduct.id) && (
                <button
                  type="button"
                  onClick={() => handleDeleteProduct(editingProduct.id!)}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Zmazať</span>
                </button>
              )}
              <div className="flex gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setIsEditingProduct(false)}
                  className="px-4 py-2 rounded-xl border border-[#E8E2D9] text-xs font-semibold text-[#8C857B] hover:bg-stone-50 cursor-pointer"
                >
                  Zrušiť
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditedProduct}
                  className="px-5 py-2 rounded-xl bg-[#2C2A29] hover:bg-[#C5A059] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Uložiť zmeny
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                <span className="text-[#2C2A29] font-sans font-bold">{lastReceipt.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span>Platba:</span>
                <span>{lastReceipt.paymentMethod === 'card' ? 'Platobná karta' : 'Hotovosť'}</span>
              </div>
            </div>

            {/* Položky */}
            <div className="border-t border-b border-[#E8E2D9] py-3 space-y-1.5 text-xs max-h-52 overflow-y-auto">
              {lastReceipt.items.map((item: CartItem, i: number) => (
                <div key={i} className="flex justify-between">
                  <span className="truncate pr-2">
                    {item.quantity}x <span className="font-semibold text-[#2C2A29]">{item.product.name}</span>
                  </span>
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
                className="flex-1 py-2.5 rounded-xl border border-[#E8E2D9] text-xs font-semibold text-[#2C2A29] hover:bg-[#FAF8F5] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Tlačiť doklad
              </button>
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#2C2A29] text-white text-xs font-semibold shadow-md cursor-pointer"
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
