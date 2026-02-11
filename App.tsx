
import React, { useState, useEffect } from 'react';
import { Settings, Search, X, MapPin, Clock, Star, ShoppingBag, Send, ChevronRight, MessageCircle, Copy, CheckCircle2, Share2, Info } from 'lucide-react';
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
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [customerInfo, setCustomerInfo] = useState({ name: '', address: '', ref: '', payment: 'PIX' });

  useEffect(() => {
    const load = async () => {
      try {
        const { data: s } = await supabase.from('settings').select('*').eq('id', 1).single();
        if (s?.data) setSettings(s.data);
        const { data: c } = await supabase.from('categories').select('*').order('name');
        if (c?.length) setCategories(c);
        const { data: p } = await supabase.from('products').select('*').order('name');
        if (p?.length) setProducts(p);
      } catch (err) { console.warn("Modo Offline"); }
    };
    load();
  }, []);

  // CÁLCULO TOTAL: (Preço Base + Soma dos Adicionais) * Quantidade
  const total = cart.reduce((acc, item) => {
    const isPromo = item.productId === 'promo-item';
    const p = isPromo ? { price: settings.promotion?.price || 0, extras: [] as any[] } : products.find(prod => prod.id === item.productId);
    
    if (!p) return acc;
    
    const extrasPrice = item.selectedExtras.reduce((sum, id) => {
      const ex = p.extras?.find((e: any) => e.id === id);
      return sum + (ex?.price || 0);
    }, 0);
    
    return acc + (p.price + extrasPrice) * item.quantity;
  }, 0);

  const sendOrder = () => {
    if (!customerInfo.name || !customerInfo.address) return alert("Por favor, preencha nome e endereço!");
    
    let message = `*NOVO PEDIDO - ${settings.storeName.toUpperCase()}*\n\n`;
    message += `*CLIENTE:* ${customerInfo.name}\n`;
    message += `*ENDEREÇO:* ${customerInfo.address}\n`;
    message += `*REF:* ${customerInfo.ref}\n`;
    message += `*PAGAMENTO:* ${customerInfo.payment}\n\n`;
    
    message += `*ITENS:*\n`;
    cart.forEach(item => {
      const p = item.productId === 'promo-item' ? { name: settings.promotion?.name, price: settings.promotion?.price, extras: [] as any[] } : products.find(prod => prod.id === item.productId);
      if (p) {
        const itemExtras = item.selectedExtras.map(id => p.extras?.find((e: any) => e.id === id)).filter(Boolean);
        const extrasTotal = itemExtras.reduce((s, e) => s + (e?.price || 0), 0);
        const itemTotal = (p.price! + extrasTotal) * item.quantity;

        message += `✅ ${item.quantity}x ${p.name} (R$ ${itemTotal.toFixed(2)})\n`;
        itemExtras.forEach(ex => message += `   + ${ex?.name} (R$ ${ex?.price.toFixed(2)})\n`);
        if (item.notes) message += `   _Obs: ${item.notes}_\n`;
      }
    });

    message += `\n*TAXA ENTREGA:* R$ ${settings.deliveryFee.toFixed(2)}`;
    message += `\n*TOTAL DO PEDIDO:* R$ ${(total + settings.deliveryFee).toFixed(2)}`;

    const cleanPhone = settings.whatsapp.replace(/\D/g, '');
    const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  if (view === 'admin') return <AdminDashboard settings={settings} setSettings={setSettings} categories={categories} setCategories={setCategories} products={products} setProducts={setProducts} onClose={() => setView('menu')} isAdminLoggedIn={isAdminLoggedIn} setIsAdminLoggedIn={setIsAdminLoggedIn} />;

  return (
    <div className="min-h-screen bg-white pb-32 font-['Inter']">
      {/* HEADER ESTILO IFOOD */}
      <div className="relative h-44 md:h-56">
        <img src={settings.banner} className="w-full h-full object-cover" alt="Banner" />
        <div className="absolute inset-0 bg-black/30" />
        <button onClick={() => setView('admin')} className="absolute top-4 left-4 p-2.5 bg-white rounded-full shadow-lg text-gray-700 active:scale-90 transition"><Settings size={20}/></button>
        <button onClick={() => {}} className="absolute top-4 right-4 p-2.5 bg-white rounded-full shadow-lg text-gray-700 active:scale-90 transition"><Share2 size={20}/></button>
      </div>

      <div className="px-5 -mt-10 relative z-10">
        <div className="bg-white rounded-2xl p-5 shadow-xl flex items-center gap-4 border border-gray-100">
          <img src={settings.logo} className="w-20 h-20 rounded-xl object-cover border-2 border-white shadow-md" />
          <div className="flex-1">
            <h1 className="text-xl font-black text-gray-900 leading-tight">{settings.storeName}</h1>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="flex items-center gap-1 text-xs font-bold text-amber-500"><Star size={14} className="fill-amber-500"/> 4.9</span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs font-bold text-green-600">Aberto</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1 uppercase font-black tracking-wider">30-45 min • R$ {settings.deliveryFee.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* BUSCA */}
      <div className="px-5 mt-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            placeholder="Buscar no cardápio..." 
            className="w-full pl-12 pr-4 py-3.5 bg-gray-100 rounded-xl outline-none text-sm font-medium focus:bg-gray-200/50 transition"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* CATEGORIAS STICKY */}
      <div className="sticky top-0 z-40 bg-white border-b mt-6 overflow-x-auto hide-scrollbar shadow-sm">
        <div className="px-5 flex gap-6 py-4">
          <button onClick={() => setSelectedCategory('all')} className={`text-sm font-bold whitespace-nowrap pb-1 ${selectedCategory === 'all' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500'}`}>Destaques</button>
          {categories.map(c => (
            <button key={c.id} onClick={() => setSelectedCategory(c.id)} className={`text-sm font-bold whitespace-nowrap pb-1 capitalize ${selectedCategory === c.id ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500'}`}>{c.name}</button>
          ))}
        </div>
      </div>

      {/* PROMOÇÃO DO DIA */}
      {settings.promotion?.active && selectedCategory === 'all' && (
        <div className="px-5 mt-6">
          <div onClick={() => { setSelectedProduct({ id: 'promo-item', ...settings.promotion } as any); setSelectedExtras([]); setNotes(''); }} className="bg-red-50 rounded-2xl p-4 flex gap-4 border border-red-100 cursor-pointer hover:bg-red-100/50 transition group">
            <img src={settings.promotion.image} className="w-24 h-24 rounded-xl object-cover" />
            <div className="flex-1 py-1">
              <span className="bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded uppercase">Oferta Imperdível</span>
              <h3 className="font-bold text-gray-900 mt-1">{settings.promotion.name}</h3>
              <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{settings.promotion.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-red-600 font-black text-lg">R$ {settings.promotion.price.toFixed(2)}</p>
                <span className="text-[10px] text-gray-400 line-through font-bold">R$ {(settings.promotion.price * 1.3).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LISTA DE PRODUTOS ESTILO IFOOD */}
      <div className="px-5 mt-8 space-y-10">
        {categories.filter(c => selectedCategory === 'all' || c.id === selectedCategory).map(cat => (
          <div key={cat.id} className="space-y-4">
            <h3 className="font-black text-lg text-gray-900">{cat.name}</h3>
            <div className="grid gap-6">
              {products.filter(p => p.categoryId === cat.id && p.active && p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                <div key={p.id} onClick={() => { setSelectedProduct(p); setSelectedExtras([]); setNotes(''); }} className="flex justify-between gap-4 group cursor-pointer border-b border-gray-100 pb-6 last:border-0">
                  <div className="flex-1 space-y-1">
                    <h4 className="font-bold text-gray-800 text-base">{p.name}</h4>
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{p.description}</p>
                    <p className="text-base font-bold text-gray-900 pt-1">R$ {p.price.toFixed(2)}</p>
                  </div>
                  <div className="relative">
                    <img src={p.image} className="w-28 h-28 rounded-xl object-cover shadow-sm group-hover:scale-105 transition duration-300" />
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white px-4 py-1.5 rounded-lg shadow-md border border-gray-100 text-[10px] font-black text-red-600 uppercase">Adicionar</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* BOTÃO FLUTUANTE CARRINHO */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-lg z-50">
          <button onClick={() => setIsCartOpen(true)} className="w-full bg-red-600 text-white font-black py-4 rounded-xl flex justify-between items-center px-6 shadow-2xl active:scale-95 transition">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-1.5 rounded-lg"><ShoppingBag size={20}/></div>
              <span className="text-sm">Ver sacola</span>
            </div>
            <span className="text-sm">R$ {total.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* MODAL PRODUTO */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end justify-center">
          <div className="bg-white w-full max-w-xl rounded-t-[32px] max-h-[92vh] flex flex-col overflow-hidden animate-slide-in">
            <div className="relative h-56 md:h-64 shrink-0">
              <img src={selectedProduct.image} className="w-full h-full object-cover" />
              <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 bg-black/50 p-2.5 rounded-full text-white"><X size={20}/></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-8 flex-1 custom-scrollbar">
              <div>
                <h2 className="text-2xl font-black text-gray-900">{selectedProduct.name}</h2>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">{selectedProduct.description}</p>
                <p className="text-lg font-black text-red-600 mt-3">R$ {selectedProduct.price.toFixed(2)}</p>
              </div>

              {selectedProduct.extras.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Escolha seus adicionais</p>
                    <span className="text-[10px] bg-gray-200 px-2 py-0.5 rounded font-bold text-gray-600 uppercase">Opcional</span>
                  </div>
                  {selectedProduct.extras.map(e => (
                    <label key={e.id} className="flex justify-between items-center p-4 border rounded-2xl cursor-pointer hover:border-red-600/30 hover:bg-red-50/20 transition">
                      <span className="text-sm font-bold text-gray-700">{e.name} <span className="text-red-600 ml-1">+ R$ {e.price.toFixed(2)}</span></span>
                      <input type="checkbox" checked={selectedExtras.includes(e.id)} onChange={() => setSelectedExtras(prev => prev.includes(e.id) ? prev.filter(x => x !== e.id) : [...prev, e.id])} className="w-5 h-5 accent-red-600 rounded-md"/>
                    </label>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Alguma observação?</p>
                <textarea 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  placeholder="Ex: Tirar cebola, pouco sal, etc..." 
                  className="w-full p-4 bg-gray-100 rounded-2xl outline-none text-sm h-28 focus:ring-2 ring-red-600/20 transition resize-none font-medium"
                />
              </div>
            </div>
            <div className="p-6 border-t bg-white flex items-center gap-4">
              <button onClick={() => {
                setCart([...cart, { id: Math.random().toString(), productId: selectedProduct.id, quantity: 1, selectedExtras, notes }]);
                setSelectedProduct(null);
              }} className="flex-1 bg-red-600 text-white font-black py-4 rounded-xl shadow-lg uppercase text-xs tracking-widest hover:bg-red-700 transition">Adicionar • R$ {(selectedProduct.price + selectedExtras.reduce((s, id) => s + (selectedProduct.extras.find(e => e.id === id)?.price || 0), 0)).toFixed(2)}</button>
            </div>
          </div>
        </div>
      )}

      {/* CARRINHO / CHECKOUT */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-end justify-center">
          <div className="bg-white w-full max-w-xl rounded-t-[32px] max-h-[95vh] flex flex-col animate-slide-in">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-black text-gray-900">Sua Sacola</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 bg-gray-100 rounded-full text-gray-600"><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {/* ITENS NO CARRINHO */}
              <div className="space-y-6">
                {cart.map((item, idx) => {
                  const p = item.productId === 'promo-item' ? { name: settings.promotion?.name, price: settings.promotion?.price, extras: [] as any[] } : products.find(prod => prod.id === item.productId);
                  if (!p) return null;
                  const itemExtras = item.selectedExtras.map(id => p.extras?.find((e: any) => e.id === id));
                  const itemTotal = (p.price! + itemExtras.reduce((s, e) => s + (e?.price || 0), 0)) * item.quantity;

                  return (
                    <div key={item.id} className="flex justify-between items-start gap-4 pb-6 border-b border-gray-50 last:border-0">
                      <div className="flex-1 space-y-1">
                        <p className="font-bold text-gray-800">{item.quantity}x {p.name}</p>
                        {itemExtras.length > 0 && <p className="text-[10px] text-gray-400 font-medium italic">+ {itemExtras.map(e => e?.name).join(', ')}</p>}
                        {item.notes && <p className="text-[10px] text-gray-400 font-medium italic">Obs: {item.notes}</p>}
                        <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-[10px] font-black text-red-600 uppercase mt-2">Remover</button>
                      </div>
                      <p className="font-black text-sm text-gray-900">R$ {itemTotal.toFixed(2)}</p>
                    </div>
                  );
                })}
              </div>

              {/* DADOS DE ENTREGA */}
              <div className="space-y-4 bg-gray-50 p-6 rounded-3xl border border-gray-100">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><MapPin size={14}/> Dados de Entrega</h3>
                <input placeholder="Nome Completo" className="w-full p-4 rounded-xl border-2 border-transparent focus:border-red-600 bg-white shadow-sm outline-none font-bold text-sm" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} />
                <input placeholder="Endereço e Número" className="w-full p-4 rounded-xl border-2 border-transparent focus:border-red-600 bg-white shadow-sm outline-none font-bold text-sm" value={customerInfo.address} onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})} />
                <input placeholder="Ponto de Referência" className="w-full p-4 rounded-xl border-2 border-transparent focus:border-red-600 bg-white shadow-sm outline-none font-bold text-sm" value={customerInfo.ref} onChange={e => setCustomerInfo({...customerInfo, ref: e.target.value})} />
                
                <div className="pt-4 space-y-3">
                   <p className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Clock size={14}/> Forma de Pagamento</p>
                   <div className="grid grid-cols-3 gap-2">
                     {['PIX', 'Dinheiro', 'Cartão'].map(m => (
                       <button key={m} onClick={() => setCustomerInfo({...customerInfo, payment: m})} className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all ${customerInfo.payment === m ? 'bg-red-600 text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-200'}`}>{m}</button>
                     ))}
                   </div>
                </div>
              </div>

              {/* RESUMO VALORES */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between text-gray-500 font-bold text-sm"><span>Subtotal</span><span>R$ {total.toFixed(2)}</span></div>
                <div className="flex justify-between text-gray-500 font-bold text-sm"><span>Taxa de Entrega</span><span>R$ {settings.deliveryFee.toFixed(2)}</span></div>
                <div className="flex justify-between text-gray-900 font-black text-xl mt-2"><span>Total</span><span className="text-red-600">R$ {(total + settings.deliveryFee).toFixed(2)}</span></div>
              </div>
            </div>

            <div className="p-6 border-t bg-white">
              <button onClick={sendOrder} className="w-full bg-red-600 text-white font-black py-4 rounded-xl shadow-xl flex items-center justify-center gap-3 uppercase text-xs tracking-widest active:scale-95 transition">
                <MessageCircle size={20}/> Finalizar Pedido no WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
