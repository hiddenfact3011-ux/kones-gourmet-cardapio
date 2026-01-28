
import React, { useState, useEffect } from 'react';
import { Settings, Search, X, MapPin, Clock, Star, ShoppingBag, Send, ChevronRight, MessageCircle, Copy, CheckCircle2, Share2 } from 'lucide-react';
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
  
  // Checkout Info
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

  const total = cart.reduce((acc, item) => {
    const p = products.find(prod => prod.id === item.productId);
    if (!p) return acc;
    const extrasPrice = item.selectedExtras.reduce((sum, id) => {
      const ex = p.extras.find(e => e.id === id);
      return sum + (ex?.price || 0);
    }, 0);
    return acc + (p.price + extrasPrice) * item.quantity;
  }, 0);

  const handleShare = async () => {
    const shareUrl = 'https://kones-gourmet-cardapio.vercel.app';
    const shareData = {
      title: settings.storeName,
      text: `Confira o cardápio da ${settings.storeName}!`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copiado para a área de transferência!');
      }
    } catch (err) {
      console.log('Erro ao compartilhar', err);
    }
  };

  const sendOrder = () => {
    if (!customerInfo.name || !customerInfo.address) return alert("Silvia, peça ao cliente para preencher nome e endereço!");
    
    let message = `*NOVO PEDIDO - KONES GOURMET*\n\n`;
    message += `*Cliente:* ${customerInfo.name}\n`;
    message += `*Endereço:* ${customerInfo.address}\n`;
    message += `*Ref:* ${customerInfo.ref}\n`;
    message += `*Pagamento:* ${customerInfo.payment}\n`;
    
    if (customerInfo.payment === 'PIX') {
      message += `_(Aguardando comprovante do PIX: ${settings.pixKey})_\n`;
    }
    
    message += `\n*ITENS:*\n`;

    cart.forEach(item => {
      const p = products.find(prod => prod.id === item.productId);
      if (p) {
        message += `• ${item.quantity}x ${p.name} (R$ ${p.price.toFixed(2)})\n`;
        item.selectedExtras.forEach(exId => {
          const ex = p.extras.find(e => e.id === exId);
          if (ex) message += `  + ${ex.name} (R$ ${ex.price.toFixed(2)})\n`;
        });
        if (item.notes) message += `  _Obs: ${item.notes}_\n`;
      }
    });

    message += `\n*Taxa Entrega:* R$ ${settings.deliveryFee.toFixed(2)}`;
    message += `\n*TOTAL:* R$ ${(total + settings.deliveryFee).toFixed(2)}`;

    const url = `https://api.whatsapp.com/send?phone=55${settings.whatsapp}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handlePromotionClick = () => {
    if (settings.promotion?.active) {
      const promoProduct: Product = {
        id: 'promo-item',
        name: settings.promotion.name,
        description: settings.promotion.description,
        price: settings.promotion.price,
        image: settings.promotion.image,
        categoryId: 'promo',
        extras: [],
        active: true
      };
      setSelectedProduct(promoProduct);
      setSelectedExtras([]);
      setNotes('');
    }
  };

  if (view === 'admin') return <AdminDashboard settings={settings} setSettings={setSettings} categories={categories} setCategories={setCategories} products={products} setProducts={setProducts} onClose={() => setView('menu')} isAdminLoggedIn={isAdminLoggedIn} setIsAdminLoggedIn={setIsAdminLoggedIn} />;

  return (
    <div className="min-h-screen bg-gray-50 pb-28 font-['Inter']">
      {/* HEADER */}
      <div className="relative h-48 md:h-64">
        <img src={settings.banner} className="w-full h-full object-cover" alt="Banner" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <button onClick={() => setView('admin')} className="absolute top-5 left-5 p-2.5 bg-white/10 backdrop-blur-md rounded-full text-white"><Settings size={22}/></button>
        <button onClick={handleShare} className="absolute top-5 right-5 p-2.5 bg-white/10 backdrop-blur-md rounded-full text-white"><Share2 size={22}/></button>
        <div className="absolute -bottom-8 left-6 flex items-end gap-4">
          <img src={settings.logo} className="w-24 h-24 rounded-2xl border-4 border-white shadow-xl object-cover bg-white" />
          <div className="pb-2 text-white">
            <h1 className="text-2xl font-black drop-shadow-lg">{settings.storeName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-amber-400 font-bold flex items-center gap-1 bg-black/20 px-2 rounded"><Star size={12} className="fill-amber-400"/> 5.0</span>
              <span className="text-[10px] uppercase font-black tracking-widest text-white/80">Aberto Agora</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 px-5 max-w-2xl mx-auto space-y-6">
        {settings.promotion?.active && (
          <div 
            className="bg-gradient-to-r from-red-600 to-red-800 rounded-[32px] p-1 shadow-lg animate-pulse hover:animate-none cursor-pointer overflow-hidden transform active:scale-95 transition" 
            onClick={handlePromotionClick}
          >
            <div className="bg-white rounded-[31px] p-4 flex gap-4 items-center">
              <img src={settings.promotion.image} className="w-20 h-20 rounded-2xl object-cover shadow-md" />
              <div className="flex-1">
                <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase mb-1 inline-block">Aproveite Agora</span>
                <h3 className="font-black text-gray-900 leading-tight">{settings.promotion.name}</h3>
                <p className="text-[10px] text-gray-500 line-clamp-1">{settings.promotion.description}</p>
                <div className="flex items-center gap-2">
                   <p className="text-red-600 font-black text-lg">R$ {settings.promotion.price.toFixed(2)}</p>
                   <span className="text-[10px] bg-red-50 text-red-600 px-2 rounded-full font-bold">Promoção do Dia</span>
                </div>
              </div>
              <div className="bg-red-600 p-2 rounded-full text-white shadow-lg"><ShoppingBag size={18}/></div>
            </div>
          </div>
        )}

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input placeholder="Buscar no cardápio..." className="w-full pl-12 pr-5 py-4 bg-white rounded-2xl shadow-sm outline-none border-2 border-transparent focus:border-red-600/20 transition text-sm font-medium" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
      </div>

      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b mt-6 overflow-x-auto hide-scrollbar">
        <div className="px-5 flex gap-8 py-4">
          <button onClick={() => setSelectedCategory('all')} className={`text-xs font-black whitespace-nowrap tracking-widest ${selectedCategory === 'all' ? 'text-red-600 border-b-2 border-red-600 pb-1' : 'text-gray-400'}`}>TUDO</button>
          {categories.map(c => (
            <button key={c.id} onClick={() => setSelectedCategory(c.id)} className={`text-xs font-black whitespace-nowrap uppercase tracking-widest ${selectedCategory === c.id ? 'text-red-600 border-b-2 border-red-600 pb-1' : 'text-gray-400'}`}>{c.name}</button>
          ))}
        </div>
      </div>

      <div className="px-5 max-w-2xl mx-auto mt-8 space-y-10">
        {categories.filter(c => selectedCategory === 'all' || c.id === selectedCategory).map(cat => (
          <div key={cat.id} className="space-y-4">
            <h3 className="font-black text-lg text-gray-900">{cat.name}</h3>
            <div className="grid gap-4">
              {products.filter(p => p.categoryId === cat.id && p.active && p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                <div key={p.id} onClick={() => { setSelectedProduct(p); setSelectedExtras([]); setNotes(''); }} className="flex justify-between gap-4 p-4 bg-white rounded-[24px] shadow-sm hover:shadow-md transition cursor-pointer border border-gray-100 group">
                  <div className="flex-1 space-y-1">
                    <h4 className="font-bold text-gray-800 group-hover:text-red-600">{p.name}</h4>
                    <p className="text-xs text-gray-400 line-clamp-2">{p.description}</p>
                    <p className="text-base font-black text-gray-900 pt-1 italic">R$ {p.price.toFixed(2)}</p>
                  </div>
                  <img src={p.image} className="w-24 h-24 rounded-2xl object-cover shadow-inner" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-5 z-50 flex justify-center">
          <button onClick={() => setIsCartOpen(true)} className="w-full max-w-2xl bg-red-600 text-white font-black py-5 rounded-2xl flex justify-between items-center px-8 shadow-xl">
            <span className="flex items-center gap-2"><ShoppingBag size={20}/> Ver Sacola ({cart.length})</span>
            <span className="text-lg">R$ {total.toFixed(2)}</span>
          </button>
        </div>
      )}

      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm animate-slide-in">
          <div className="bg-white w-full max-w-xl rounded-t-[40px] max-h-[95vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="relative h-60">
              <img src={selectedProduct.image} className="w-full h-full object-cover" />
              <button onClick={() => setSelectedProduct(null)} className="absolute top-5 right-5 bg-black/40 p-2 rounded-full text-white"><X size={24}/></button>
            </div>
            <div className="p-8 overflow-y-auto space-y-6">
              <div>
                <h2 className="text-2xl font-black">{selectedProduct.name}</h2>
                <p className="text-sm text-gray-400 mt-1">{selectedProduct.description}</p>
              </div>

              {selectedProduct.extras.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Turbine seu Kone</p>
                  {selectedProduct.extras.map(e => (
                    <label key={e.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl cursor-pointer border border-transparent hover:border-red-100 transition">
                      <span className="text-sm font-bold">{e.name} <span className="text-red-600 ml-1">+ R$ {e.price.toFixed(2)}</span></span>
                      <input type="checkbox" checked={selectedExtras.includes(e.id)} onChange={() => setSelectedExtras(prev => prev.includes(e.id) ? prev.filter(x => x !== e.id) : [...prev, e.id])} className="w-6 h-6 rounded-lg text-red-600"/>
                    </label>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs font-black text-gray-400 uppercase">Observações / Retirar algo?</p>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ex: Tirar cebola, pouco molho..." className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-red-600/20 outline-none text-sm resize-none h-24 font-medium" />
              </div>
            </div>
            <div className="p-8 border-t bg-gray-50">
              <button onClick={() => {
                setCart([...cart, { id: Math.random().toString(), productId: selectedProduct.id, quantity: 1, selectedExtras, notes }]);
                setSelectedProduct(null);
              }} className="w-full bg-red-600 text-white font-black py-5 rounded-2xl shadow-xl uppercase tracking-widest active:scale-95 transition">Adicionar à Sacola - R$ {(selectedProduct.price + selectedExtras.reduce((s, id) => s + (selectedProduct.extras.find(e => e.id === id)?.price || 0), 0)).toFixed(2)}</button>
            </div>
          </div>
        </div>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-t-[40px] max-h-[95vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center bg-white rounded-t-[40px] sticky top-0 z-10">
              <h2 className="text-xl font-black">Sua Sacola</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 bg-gray-100 rounded-full"><X size={20}/></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
              <div className="space-y-4">
                {cart.map((item, idx) => {
                  const p = products.find(prod => prod.id === item.productId) || (item.productId === 'promo-item' ? { name: item.productId, price: total / item.quantity, extras: [] } : null);
                  const itemName = item.productId === 'promo-item' ? cart[idx].notes.includes('Promo') ? 'Promoção do Dia' : products.find(prod => prod.id === item.productId)?.name || 'Item' : products.find(prod => prod.id === item.productId)?.name;
                  const itemPrice = item.productId === 'promo-item' ? settings.promotion?.price || 0 : products.find(prod => prod.id === item.productId)?.price || 0;

                  return p ? (
                    <div key={item.id} className="flex justify-between items-start border-b border-gray-100 pb-4">
                      <div className="flex-1">
                        <p className="font-bold text-gray-800">{item.quantity}x {p.name}</p>
                        <p className="text-[10px] text-gray-400 italic">
                          {item.selectedExtras.map(id => p.extras?.find(e => e.id === id)?.name).filter(Boolean).join(', ')}
                          {item.notes && ` | Obs: ${item.notes}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-sm text-red-600">R$ {(itemPrice + item.selectedExtras.reduce((s, id) => s + (p.extras?.find(e => e.id === id)?.price || 0), 0)).toFixed(2)}</p>
                        <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-[10px] font-bold text-gray-300 underline mt-1">Remover</button>
                      </div>
                    </div>
                  ) : null;
                })}
              </div>

              <div className="space-y-4 bg-gray-50 p-6 rounded-[32px] border border-gray-100 shadow-inner">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest text-center mb-2">Finalizar Pedido</p>
                <input placeholder="Seu Nome Completo" className="w-full p-4 rounded-xl border-2 border-white focus:border-red-600 outline-none font-bold shadow-sm transition" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} />
                <input placeholder="Endereço (Rua, Nº, Bairro)" className="w-full p-4 rounded-xl border-2 border-white focus:border-red-600 outline-none font-bold shadow-sm transition" value={customerInfo.address} onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})} />
                <input placeholder="Ponto de Referência" className="w-full p-4 rounded-xl border-2 border-white focus:border-red-600 outline-none font-bold shadow-sm transition" value={customerInfo.ref} onChange={e => setCustomerInfo({...customerInfo, ref: e.target.value})} />
                
                <div className="space-y-2 mt-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase ml-2">Forma de Pagamento</p>
                  <div className="flex gap-2">
                    {['PIX', 'DINHEIRO', 'CARTÃO'].map(m => (
                      <button key={m} onClick={() => setCustomerInfo({...customerInfo, payment: m})} className={`flex-1 py-3 rounded-xl font-black text-[10px] border-2 transition-all ${customerInfo.payment === m ? 'bg-red-600 border-red-600 text-white shadow-md scale-105' : 'bg-white border-transparent text-gray-400'}`}>{m}</button>
                    ))}
                  </div>
                </div>

                {customerInfo.payment === 'PIX' && (
                  <div className="mt-4 p-4 bg-red-50 rounded-2xl border border-red-100 animate-slide-in">
                    <p className="text-[10px] font-black text-red-600 uppercase mb-2 flex items-center gap-1"><Copy size={12}/> Copie a Chave PIX abaixo</p>
                    <div className="bg-white p-3 rounded-lg border border-red-200 flex justify-between items-center group cursor-pointer" onClick={() => {navigator.clipboard.writeText(settings.pixKey); alert("Chave copiada!")}}>
                      <div>
                        <p className="text-xs font-black text-gray-900 break-all">{settings.pixKey}</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">{settings.pixName}</p>
                      </div>
                      <Copy size={16} className="text-red-600 shrink-0"/>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between text-gray-400 text-sm font-medium"><span>Subtotal</span><span>R$ {total.toFixed(2)}</span></div>
                <div className="flex justify-between text-gray-400 text-sm font-medium"><span>Taxa de Entrega</span><span>R$ {settings.deliveryFee.toFixed(2)}</span></div>
                <div className="flex justify-between font-black text-2xl text-gray-900 mt-2"><span>TOTAL</span><span className="text-red-600">R$ {(total + settings.deliveryFee).toFixed(2)}</span></div>
              </div>
            </div>
            <div className="p-8 border-t bg-white">
              <button onClick={sendOrder} className="w-full bg-red-600 text-white font-black py-5 rounded-2xl shadow-[0_10px_20px_-5px_rgba(234,29,44,0.4)] flex items-center justify-center gap-3 uppercase tracking-widest active:scale-95 transition">
                <MessageCircle size={24}/> Enviar para o WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
