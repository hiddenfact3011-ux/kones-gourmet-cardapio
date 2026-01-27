
import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Settings, Search, X, Plus, Minus, Trash2, Camera, ChevronRight, Check, MapPin, CreditCard, ChevronLeft, Share2 } from 'lucide-react';
import { Product, Category, AppSettings, CartItem, View, Extra } from './types';
import { DEFAULT_SETTINGS, INITIAL_CATEGORIES, INITIAL_PRODUCTS } from './constants';
import AdminDashboard from './components/AdminDashboard';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<View>('menu');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedExtrasInModal, setSelectedExtrasInModal] = useState<string[]>([]);

  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    address: '',
    reference: '',
    paymentMethod: 'Pix' as 'Pix' | 'Dinheiro' | 'Crédito' | 'Débito'
  });

  useEffect(() => {
    fetchData();

    // Ouvir mudanças em tempo real no Supabase
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, payload => {
        if (payload.new) setSettings((payload.new as any).data);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
    try {
      // Buscar Configurações
      const { data: s } = await supabase.from('settings').select('*').eq('id', 1).single();
      if (s?.data) setSettings(s.data);

      // Buscar Categorias
      const { data: c } = await supabase.from('categories').select('*').order('name');
      if (c && c.length > 0) setCategories(c);

      // Buscar Produtos
      const { data: p } = await supabase.from('products').select('*').order('name');
      if (p && p.length > 0) setProducts(p);
    } catch (err) {
      console.warn('Banco de dados vazio ou não configurado. Usando modo demonstração.');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch && p.active;
    });
  }, [products, selectedCategory, searchQuery]);

  const handleShare = async () => {
    const cleanUrl = window.location.origin + window.location.pathname;
    const shareData = {
      title: settings.storeName,
      text: `Peça agora na ${settings.storeName}! 🍟🥤`,
      url: cleanUrl,
    };

    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(cleanUrl);
        alert('Link copiado! Envie no WhatsApp para seus clientes.');
      }
    } catch (err) { console.log(err); }
  };

  const addToCart = (productId: string, quantity: number, selectedExtras: string[], notes: string) => {
    const newItem: CartItem = {
      id: Math.random().toString(36).substr(2, 9),
      productId,
      quantity,
      selectedExtras,
      notes
    };
    setCart([...cart, newItem]);
    setSelectedProduct(null);
    setSelectedExtrasInModal([]);
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return total;
      
      const extrasPrice = (item.selectedExtras || []).reduce((eTotal, extraId) => {
        const extra = product.extras?.find(e => e.id === extraId);
        return eTotal + (extra?.price || 0);
      }, 0);

      return total + (product.price + extrasPrice) * item.quantity;
    }, 0);
  }, [cart, products]);

  const modalTotal = useMemo(() => {
    if (!selectedProduct) return 0;
    const extrasTotal = selectedExtrasInModal.reduce((acc, extraId) => {
      const extra = selectedProduct.extras?.find(e => e.id === extraId);
      return acc + (extra?.price || 0);
    }, 0);
    return selectedProduct.price + extrasTotal;
  }, [selectedProduct, selectedExtrasInModal]);

  const handleCheckout = () => {
    if (!customerInfo.name || !customerInfo.address) {
      alert('Preencha seu nome e endereço para entrega.');
      return;
    }
    
    let message = `🚀 *NOVO PEDIDO: ${settings.storeName.toUpperCase()}*\n\n`;
    message += `👤 *Cliente:* ${customerInfo.name}\n`;
    message += `📍 *Endereço:* ${customerInfo.address}\n`;
    message += `📍 *Ponto de Ref:* ${customerInfo.reference || 'Não informado'}\n`;
    message += `💳 *Pagamento:* ${customerInfo.paymentMethod}\n\n`;
    
    message += `🛒 *ITENS DO PEDIDO:*\n`;
    cart.forEach(item => {
      const p = products.find(prod => prod.id === item.productId);
      if (p) {
        message += `✅ *${item.quantity}x ${p.name}* (R$ ${(p.price * item.quantity).toFixed(2)})\n`;
        item.selectedExtras?.forEach(exId => {
          const ex = p.extras?.find(e => e.id === exId);
          if(ex) message += `  + ${ex.name} (R$ ${ex.price.toFixed(2)})\n`;
        });
        if (item.notes) message += `   📝 Obs: _${item.notes}_\n`;
      }
    });

    message += `\n🛵 *Taxa de Entrega:* R$ ${settings.deliveryFee.toFixed(2)}\n`;
    message += `💰 *TOTAL A PAGAR:* R$ ${(cartTotal + settings.deliveryFee).toFixed(2)}\n\n`;
    
    if (customerInfo.paymentMethod === 'Pix') {
      message += `🔑 *Chave Pix para Pagamento:* \n_${settings.pixKey}_ \n(${settings.pixName})\n\n`;
    }

    message += `_Pedido feito via Cardápio Digital_`;
    
    const url = `https://wa.me/55${settings.whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const toggleExtra = (id: string) => {
    setSelectedExtrasInModal(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  if (view === 'admin') {
    return (
      <AdminDashboard 
        settings={settings}
        setSettings={setSettings}
        categories={categories}
        setCategories={setCategories}
        products={products}
        setProducts={setProducts}
        onClose={() => setView('menu')}
        isAdminLoggedIn={isAdminLoggedIn}
        setIsAdminLoggedIn={setIsAdminLoggedIn}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Top Banner & Actions */}
      <div className="relative h-56 md:h-72">
        <img src={settings.banner} alt="Banner" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-start justify-between p-4">
           <button onClick={handleShare} className="p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white hover:bg-white/40 transition shadow-lg"><Share2 size={24} /></button>
           <button onClick={() => setView('admin')} className="p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white hover:bg-white/40 transition shadow-lg"><Settings size={24} /></button>
        </div>
      </div>

      {/* Profile Header */}
      <div className="relative px-4 -mt-12 md:-mt-20 mb-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-[40px] shadow-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 border border-gray-100">
          <div className="relative">
            <img src={settings.logo} alt="Logo" className="w-28 h-28 md:w-40 md:h-40 rounded-[32px] border-8 border-white shadow-xl object-cover" />
            <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-white shadow-lg animate-pulse"></div>
          </div>
          <div className="text-center md:text-left flex-1 space-y-2">
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-none">{settings.storeName}</h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
              <span className="bg-red-50 text-red-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-red-100">Aberto Agora</span>
              <span className="text-gray-400 text-sm font-bold flex items-center gap-1"><MapPin size={16} className="text-red-500" /> Entrega R$ {settings.deliveryFee.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Categorias */}
      <div className="sticky top-0 z-30 bg-gray-50/90 backdrop-blur-2xl border-b overflow-x-auto hide-scrollbar py-4 mb-4">
        <div className="flex gap-3 px-4 max-w-4xl mx-auto">
          <button onClick={() => setSelectedCategory('all')} className={`px-8 py-4 rounded-[20px] text-sm font-black transition-all whitespace-nowrap shadow-sm ${selectedCategory === 'all' ? 'bg-red-600 text-white shadow-xl shadow-red-200 scale-105' : 'bg-white text-gray-400 border border-gray-100'}`}>🔥 Todos</button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`px-8 py-4 rounded-[20px] text-sm font-black transition-all whitespace-nowrap shadow-sm ${selectedCategory === cat.id ? 'bg-red-600 text-white shadow-xl shadow-red-200 scale-105' : 'bg-white text-gray-400 border border-gray-100'}`}>{cat.name}</button>
          ))}
        </div>
      </div>

      {/* Buscar */}
      <div className="px-4 max-w-4xl mx-auto mb-8">
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-red-600 transition" />
          <input type="text" placeholder="Qual vai ser o pedido de hoje?" className="w-full pl-16 pr-6 py-6 bg-white border-2 border-transparent focus:border-red-600 rounded-[32px] outline-none shadow-sm font-bold placeholder:text-gray-300 text-lg transition-all" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
      </div>

      {/* Lista de Produtos */}
      <div className="px-4 max-w-4xl mx-auto space-y-12 pb-12">
        {categories.filter(cat => selectedCategory === 'all' || cat.id === selectedCategory).map(cat => {
          const catProducts = filteredProducts.filter(p => p.categoryId === cat.id);
          if (catProducts.length === 0) return null;
          return (
            <div key={cat.id} className="space-y-6">
              <h2 className="text-2xl font-black text-gray-900 px-2 flex items-center gap-4">
                <div className="w-2 h-10 bg-red-600 rounded-full shadow-lg shadow-red-200"></div>
                {cat.name}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {catProducts.map(product => (
                  <div key={product.id} onClick={() => { setSelectedProduct(product); setSelectedExtrasInModal([]); }} className="flex bg-white rounded-[40px] shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden cursor-pointer group active:scale-[0.98]">
                    <div className="flex-1 p-6 flex flex-col justify-between">
                      <div className="space-y-2">
                        <h3 className="font-black text-xl text-gray-800 group-hover:text-red-600 transition leading-tight">{product.name}</h3>
                        <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed font-medium">{product.description}</p>
                      </div>
                      <div className="mt-4 font-black text-red-600 text-2xl tracking-tighter">R$ {product.price.toFixed(2)}</div>
                    </div>
                    <div className="w-32 h-32 md:w-44 md:h-44 p-4">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-[32px] shadow-lg group-hover:scale-110 transition duration-700" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Botão Flutuante Carrinho */}
      {cart.length > 0 && (
        <div className="fixed bottom-8 left-0 right-0 px-6 z-40 max-w-lg mx-auto">
          <button onClick={() => setIsCartOpen(true)} className="w-full bg-red-600 text-white font-black py-6 rounded-[32px] shadow-2xl flex items-center justify-between px-10 hover:bg-red-700 active:scale-95 transition-all animate-slide-in border-4 border-white/20">
            <div className="flex items-center gap-4">
              <div className="bg-white text-red-600 w-9 h-9 rounded-full flex items-center justify-center text-sm shadow-inner">{cart.length}</div>
              <span className="text-xl">Ver Sacola</span>
            </div>
            <span className="text-xl">R$ {cartTotal.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Modal Detalhe Produto */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-t-[50px] md:rounded-[60px] max-h-[95vh] md:max-h-none overflow-hidden flex flex-col animate-slide-in border-t-[12px] border-red-600 my-auto">
            <div className="relative h-64 md:h-80 shrink-0">
              <img src={selectedProduct.image} className="w-full h-full object-cover" />
              <button onClick={() => setSelectedProduct(null)} className="absolute top-6 right-6 bg-white p-3 rounded-full shadow-2xl hover:rotate-90 transition-all text-gray-900"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="p-8 md:p-10 overflow-y-auto flex-1 space-y-8 custom-scrollbar">
              <div className="space-y-3">
                <h2 className="text-4xl font-black text-gray-900 leading-none">{selectedProduct.name}</h2>
                <p className="text-gray-400 font-medium leading-relaxed text-lg">{selectedProduct.description}</p>
                <div className="text-3xl font-black text-red-600 tracking-tighter pt-2">R$ {selectedProduct.price.toFixed(2)}</div>
              </div>

              {/* ADICIONAIS */}
              {selectedProduct.extras && selectedProduct.extras.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-gray-50/50 p-5 rounded-[28px] border border-gray-100">
                    <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">Escolha seus adicionais</h3>
                    <span className="text-[9px] bg-gray-200 px-3 py-1.5 rounded-full font-black uppercase text-gray-500">Opcional</span>
                  </div>
                  <div className="space-y-3">
                    {selectedProduct.extras.map(extra => (
                      <label key={extra.id} className="flex items-center justify-between p-5 border-2 border-gray-50 rounded-[28px] cursor-pointer hover:border-red-600 transition active:scale-[0.99] group bg-white shadow-sm hover:shadow-xl">
                        <div className="flex items-center gap-4">
                          <input type="checkbox" checked={selectedExtrasInModal.includes(extra.id)} onChange={() => toggleExtra(extra.id)} className="w-6 h-6 rounded-xl text-red-600 border-gray-200 focus:ring-red-500 transition-all cursor-pointer" />
                          <span className="font-black text-gray-700 text-lg group-hover:text-red-600">{extra.name}</span>
                        </div>
                        <span className="text-red-600 font-black text-lg">+ R$ {extra.price.toFixed(2)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest ml-4">Instruções para a cozinha</h3>
                <textarea id="obs" className="w-full bg-gray-50 border-2 border-transparent focus:border-red-600 rounded-[35px] p-6 h-32 outline-none transition-all font-medium text-gray-600 shadow-inner" placeholder="Ex: Sem cebola, trocar por molho extra..."></textarea>
              </div>
            </div>

            <div className="p-8 border-t bg-white flex flex-col md:flex-row gap-4 shrink-0 shadow-2xl">
               <div className="flex items-center justify-between bg-gray-100 rounded-[30px] px-8 py-5 min-w-[180px]">
                  <button onClick={() => { const el = document.getElementById('qty'); if(el) el.textContent = Math.max(1, parseInt(el.textContent!)-1).toString() }} className="p-2 text-gray-400 hover:text-red-600 transition-all active:scale-125"><Minus strokeWidth={3} /></button>
                  <span id="qty" className="font-black text-3xl w-12 text-center text-gray-900">1</span>
                  <button onClick={() => { const el = document.getElementById('qty'); if(el) el.textContent = (parseInt(el.textContent!)+1).toString() }} className="p-2 text-gray-400 hover:text-red-600 transition-all active:scale-125"><Plus strokeWidth={3} /></button>
               </div>
               <button 
                onClick={() => {
                  const qty = parseInt(document.getElementById('qty')?.textContent || '1');
                  const obs = (document.getElementById('obs') as HTMLTextAreaElement).value;
                  addToCart(selectedProduct.id, qty, selectedExtrasInModal, obs);
                }}
                className="flex-1 bg-red-600 text-white font-black py-6 rounded-[30px] shadow-2xl shadow-red-200 active:scale-95 transition-all text-xl"
              >
                Adicionar • R$ {(modalTotal * (parseInt(document.getElementById('qty')?.textContent || '1'))).toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Carrinho / Checkout */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[200] flex justify-end bg-black/80 backdrop-blur-xl">
          <div className="bg-white w-full max-w-xl flex flex-col h-full animate-slide-in shadow-2xl border-l-[12px] border-red-600">
            <div className="p-8 border-b flex items-center justify-between bg-white sticky top-0 z-10">
              <button onClick={() => setIsCartOpen(false)} className="p-4 bg-gray-100 rounded-[20px] hover:bg-red-600 hover:text-white transition-all active:scale-90"><ChevronLeft size={28} /></button>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">Sua Sacola</h2>
              <button onClick={() => setCart([])} className="text-red-600 font-black text-xs uppercase tracking-widest px-6 py-2 hover:bg-red-50 rounded-full transition-all">Limpar</button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
              <div className="space-y-8">
                {cart.length === 0 ? (
                  <div className="text-center py-20 space-y-4">
                     <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-200"><ShoppingCart size={48}/></div>
                     <p className="font-black text-gray-400">Sua sacola está vazia.</p>
                     <button onClick={() => setIsCartOpen(false)} className="text-red-600 font-black uppercase text-xs tracking-widest underline">Voltar ao cardápio</button>
                  </div>
                ) : cart.map(item => {
                  const p = products.find(pr => pr.id === item.productId);
                  const itemExtras = item.selectedExtras?.map(exId => p?.extras?.find(e => e.id === exId)).filter(Boolean) || [];
                  return p ? (
                    <div key={item.id} className="flex gap-6 border-b border-gray-50 pb-8 animate-slide-in group">
                      <img src={p.image} className="w-24 h-24 rounded-[30px] object-cover shadow-xl border-4 border-gray-50" />
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-start">
                          <h4 className="font-black text-xl text-gray-900 leading-tight">{item.quantity}x {p.name}</h4>
                          <button onClick={() => removeFromCart(item.id)} className="text-gray-200 hover:text-red-600 transition-all p-2"><Trash2 size={22}/></button>
                        </div>
                        {itemExtras.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {itemExtras.map(ex => <span key={ex?.id} className="text-[10px] bg-red-50 text-red-600 px-3 py-1 rounded-full font-black border border-red-100">+{ex?.name}</span>)}
                          </div>
                        )}
                        {item.notes && <p className="text-[11px] text-amber-700 italic bg-amber-50 p-4 rounded-[20px] mt-4 border border-amber-100 font-medium">"{item.notes}"</p>}
                      </div>
                    </div>
                  ) : null;
                })}
              </div>

              {cart.length > 0 && (
                <>
                  {/* Entrega Form */}
                  <div className="space-y-8 pt-10 border-t border-gray-100">
                    <h3 className="font-black text-3xl flex items-center gap-3"><MapPin className="text-red-600" /> Onde Entregamos?</h3>
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 ml-3 uppercase tracking-widest">Seu Nome</label>
                        <input type="text" placeholder="Ex: Silvia Ferreira" className="w-full bg-gray-50 p-6 rounded-[28px] outline-none border-2 border-transparent focus:border-red-600 font-bold transition-all" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 ml-3 uppercase tracking-widest">Endereço Completo</label>
                        <input type="text" placeholder="Rua, Número, Bairro..." className="w-full bg-gray-50 p-6 rounded-[28px] outline-none border-2 border-transparent focus:border-red-600 font-bold transition-all" value={customerInfo.address} onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 ml-3 uppercase tracking-widest">Ponto de Referência</label>
                        <input type="text" placeholder="Ex: Perto do Supermercado..." className="w-full bg-gray-50 p-6 rounded-[28px] outline-none border-2 border-transparent focus:border-red-600 font-bold transition-all" value={customerInfo.reference} onChange={e => setCustomerInfo({...customerInfo, reference: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  {/* Pagamento Form */}
                  <div className="space-y-8 pt-10 border-t border-gray-100">
                    <h3 className="font-black text-3xl flex items-center gap-3"><CreditCard className="text-red-600" /> Pagamento</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {['Pix', 'Dinheiro', 'Débito', 'Crédito'].map(m => (
                        <button key={m} onClick={() => setCustomerInfo({...customerInfo, paymentMethod: m as any})} className={`p-6 rounded-[28px] border-2 font-black transition-all text-lg shadow-sm ${customerInfo.paymentMethod === m ? 'border-red-600 bg-red-50 text-red-600 scale-95' : 'bg-white text-gray-300 border-gray-50 hover:border-red-100'}`}>{m}</button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-8 border-t bg-gray-50/50 space-y-6 shadow-inner backdrop-blur-md">
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-400 font-black text-xs uppercase tracking-widest">
                    <span>Subtotal</span>
                    <span>R$ {cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400 font-black text-xs uppercase tracking-widest">
                    <span>Taxa de Entrega</span>
                    <span>R$ {settings.deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-black text-4xl text-gray-900 pt-4 leading-none">
                    <span>Total</span>
                    <span className="text-red-600 tracking-tighter">R$ {(cartTotal + settings.deliveryFee).toFixed(2)}</span>
                  </div>
                </div>
                <button onClick={handleCheckout} className="w-full bg-red-600 text-white font-black py-7 rounded-[35px] shadow-2xl shadow-red-200 text-xl hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-3">
                  <Check size={28} /> ENVIAR PEDIDO NO WHATSAPP
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
