
import React, { useState, useEffect } from 'react';
import { Settings, Search, X, MapPin, Clock, Star, ShoppingBag } from 'lucide-react';
import { Product, Category, AppSettings, CartItem, View } from './types';
import { DEFAULT_SETTINGS, INITIAL_CATEGORIES, INITIAL_PRODUCTS } from './constants';
import AdminDashboard from './components/AdminDashboard';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [view, setView] = useState<View>('menu');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: s } = await supabase.from('settings').select('*').eq('id', 1).single();
        if (s?.data) setSettings(s.data);
        const { data: c } = await supabase.from('categories').select('*').order('name');
        if (c?.length) setCategories(c);
        const { data: p } = await supabase.from('products').select('*').order('name');
        if (p?.length) setProducts(p);
      } catch (err) {
        console.warn("Usando dados locais (Offline)");
      }
    };
    load();
  }, []);

  const filtered = products.filter(p => {
    const mCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const mSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return mCat && mSearch && p.active;
  });

  const total = cart.reduce((acc, item) => {
    const p = products.find(prod => prod.id === item.productId);
    if (!p) return acc;
    const cat = categories.find(c => c.id === p.categoryId);
    const extrasPrice = item.selectedExtras.reduce((sum, id) => {
      const ex = [...(p.extras || []), ...(cat?.globalExtras || [])].find(e => e.id === id);
      return sum + (ex?.price || 0);
    }, 0);
    return acc + (p.price + extrasPrice) * item.quantity;
  }, 0);

  if (view === 'admin') return <AdminDashboard settings={settings} setSettings={setSettings} categories={categories} setCategories={setCategories} products={products} setProducts={setProducts} onClose={() => setView('menu')} isAdminLoggedIn={isAdminLoggedIn} setIsAdminLoggedIn={setIsAdminLoggedIn} />;

  return (
    <div className="min-h-screen bg-gray-50 pb-28 font-['Inter']">
      <div className="relative h-48 md:h-64">
        <img src={settings.banner} className="w-full h-full object-cover" alt="Banner" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <button onClick={() => setView('admin')} className="absolute top-5 left-5 p-2.5 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition"><Settings size={22}/></button>
        <div className="absolute -bottom-8 left-6 flex items-end gap-4">
          <img src={settings.logo} className="w-24 h-24 rounded-2xl border-4 border-white shadow-xl object-cover bg-white" alt="Logo" />
          <div className="pb-2">
            <h1 className="text-2xl font-black text-white drop-shadow-lg">{settings.storeName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="bg-amber-400 px-2 py-0.5 rounded flex items-center gap-1">
                <Star size={12} className="fill-black"/>
                <span className="text-[11px] font-black">5.0</span>
              </div>
              <span className="text-white/90 text-xs font-bold shadow-sm">Kones & Gourmet</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 px-5 max-w-2xl mx-auto space-y-5">
        <div className="flex justify-between items-center text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-white p-4 rounded-2xl shadow-sm">
          <span className="flex items-center gap-1.5"><Clock size={14} className="text-red-600"/> 30-45 min</span>
          <div className="h-4 w-px bg-gray-200" />
          <span className="flex items-center gap-1.5"><MapPin size={14} className="text-red-600"/> Entrega R$ {settings.deliveryFee.toFixed(2)}</span>
        </div>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-600 transition" size={18} />
          <input placeholder="Buscar no cardápio..." className="w-full pl-12 pr-5 py-4 bg-white rounded-2xl shadow-sm outline-none border-2 border-transparent focus:border-red-600/20 transition text-sm font-medium" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
      </div>

      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b mt-6 overflow-x-auto hide-scrollbar shadow-sm">
        <div className="px-5 flex gap-8 py-4">
          <button onClick={() => setSelectedCategory('all')} className={`text-xs font-black whitespace-nowrap tracking-widest ${selectedCategory === 'all' ? 'text-red-600 border-b-2 border-red-600 pb-1' : 'text-gray-400 hover:text-gray-600'}`}>TUDO</button>
          {categories.map(c => (
            <button key={c.id} onClick={() => setSelectedCategory(c.id)} className={`text-xs font-black whitespace-nowrap uppercase tracking-widest ${selectedCategory === c.id ? 'text-red-600 border-b-2 border-red-600 pb-1' : 'text-gray-400 hover:text-gray-600'}`}>{c.name}</button>
          ))}
        </div>
      </div>

      <div className="px-5 max-w-2xl mx-auto mt-8 space-y-10">
        {categories.filter(c => selectedCategory === 'all' || c.id === selectedCategory).map(cat => (
          <div key={cat.id} className="space-y-4">
            <h3 className="font-black text-lg text-gray-900 flex items-center gap-2">{cat.name}</h3>
            <div className="grid gap-4">
              {filtered.filter(p => p.categoryId === cat.id).map(p => (
                <div key={p.id} onClick={() => setSelectedProduct(p)} className="flex justify-between gap-4 p-4 bg-white rounded-[24px] shadow-sm hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer group border border-gray-100">
                  <div className="flex-1 space-y-2">
                    <h4 className="font-bold text-gray-800 group-hover:text-red-600 transition">{p.name}</h4>
                    <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{p.description}</p>
                    <p className="text-base font-black text-gray-900 pt-1 italic">R$ {p.price.toFixed(2)}</p>
                  </div>
                  <div className="relative w-24 h-24 shrink-0 overflow-hidden rounded-2xl shadow-inner">
                    <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" alt={p.name} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-5 z-50 flex justify-center">
          <button className="w-full max-w-2xl bg-red-600 text-white font-black py-5 rounded-2xl flex justify-between items-center px-8 shadow-[0_15px_30px_-10px_rgba(234,29,44,0.4)] hover:bg-red-700 transition-colors">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-1.5 rounded-lg"><ShoppingBag size={18}/></div>
              <span className="text-xs uppercase tracking-tighter">Sacola ({cart.length})</span>
            </div>
            <span className="text-base">R$ {total.toFixed(2)}</span>
          </button>
        </div>
      )}

      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm p-0 animate-slide-in">
          <div className="bg-white w-full max-w-xl rounded-t-[40px] max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="relative h-56 shrink-0">
              <img src={selectedProduct.image} className="w-full h-full object-cover" alt={selectedProduct.name} />
              <button onClick={() => setSelectedProduct(null)} className="absolute top-5 right-5 bg-black/40 backdrop-blur-md p-2 rounded-full text-white hover:bg-black/60 transition"><X size={24}/></button>
            </div>
            <div className="p-8 overflow-y-auto space-y-6 custom-scrollbar">
              <div>
                <h2 className="text-2xl font-black text-gray-900">{selectedProduct.name}</h2>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">{selectedProduct.description}</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Turbine seu Kone</p>
                  <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded font-bold">Opcional</span>
                </div>
                {[...(selectedProduct.extras || []), ...(categories.find(c => c.id === selectedProduct.categoryId)?.globalExtras || [])].map(e => (
                  <label key={e.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-red-50 transition border border-transparent hover:border-red-100 group">
                    <span className="text-sm font-bold text-gray-700 group-hover:text-red-900">{e.name} <span className="text-red-600 ml-1">+ R$ {e.price.toFixed(2)}</span></span>
                    <input type="checkbox" className="w-6 h-6 rounded-lg text-red-600 border-gray-300 focus:ring-red-500"/>
                  </label>
                ))}
              </div>
            </div>
            <div className="p-8 border-t bg-gray-50 flex gap-4">
              <button onClick={() => {
                setCart([...cart, { id: Math.random().toString(), productId: selectedProduct.id, quantity: 1, selectedExtras: [], notes: '' }]);
                setSelectedProduct(null);
              }} className="flex-1 bg-red-600 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-red-700 transition transform active:scale-95 uppercase tracking-wider">Adicionar à sacola</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
