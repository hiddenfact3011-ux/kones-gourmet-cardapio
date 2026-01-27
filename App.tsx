
import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Settings, Search, X, Plus, Minus, Trash2, Camera, ChevronRight, Check, MapPin, CreditCard, ChevronLeft, Share2, ArrowRight, Sparkles, Clock, Send, AlertCircle, MapPinned, Star, MessageSquareQuote, Quote } from 'lucide-react';
import { Product, Category, AppSettings, CartItem, View, CartStep, Review } from './types';
import { DEFAULT_SETTINGS, INITIAL_CATEGORIES, INITIAL_PRODUCTS } from './constants';
import AdminDashboard from './components/AdminDashboard';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviews, setShowReviews] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [newReview, setNewReview] = useState({ name: '', stars: 5, comment: '' });

  const [view, setView] = useState<View>('menu');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartStep, setCartStep] = useState<CartStep>('items');
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
    const savedStats = localStorage.getItem('kones_stats_v2');
    const stats = savedStats ? JSON.parse(savedStats) : { visits: 0, history: [] };
    stats.visits += 1;
    localStorage.setItem('kones_stats_v2', JSON.stringify(stats));

    const savedReviews = localStorage.getItem('kones_reviews');
    if (savedReviews) setReviews(JSON.parse(savedReviews));
  }, []);

  const fetchData = async () => {
    try {
      const { data: s } = await supabase.from('settings').select('*').eq('id', 1).single();
      if (s?.data) {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...s.data,
          businessHours: (s.data.businessHours && s.data.businessHours.length > 0) 
            ? s.data.businessHours 
            : DEFAULT_SETTINGS.businessHours
        });
      }
      const { data: c } = await supabase.from('categories').select('*').order('name');
      if (c && c.length > 0) setCategories(c);
      const { data: p } = await supabase.from('products').select('*').order('name');
      if (p && p.length > 0) setProducts(p);
    } catch (err) { 
      console.warn('Modo demo ativo.'); 
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: settings.storeName,
          text: `Confira o cardápio da ${settings.storeName}! 🍦`,
          url: window.location.href,
        });
      } catch (err) { console.log('Erro ao compartilhar'); }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado!');
    }
  };

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 5.0;
    return reviews.reduce((acc, r) => acc + r.stars, 0) / reviews.length;
  }, [reviews]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch && p.active;
    });
  }, [products, selectedCategory, searchQuery]);

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

  const isStoreOpen = useMemo(() => {
    const now = new Date();
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const currentDay = dayNames[now.getDay()];
    const hours = settings.businessHours?.find(h => h.day === currentDay);
    if (!hours || !hours.isOpen) return false;
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    return currentTime >= hours.open && currentTime <= hours.close;
  }, [settings.businessHours]);

  if (view === 'admin') return <AdminDashboard settings={settings} setSettings={setSettings} categories={categories} setCategories={setCategories} products={products} setProducts={setProducts} onClose={() => setView('menu')} isAdminLoggedIn={isAdminLoggedIn} setIsAdminLoggedIn={setIsAdminLoggedIn} />;

  return (
    <div className="min-h-screen bg-white pb-24 font-['Inter']">
      {/* Header compact iFood style */}
      <div className="relative h-48 md:h-56">
        <img src={settings.banner} className="w-full h-full object-cover" alt="Banner" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute top-4 left-4 right-4 flex justify-between">
           <button onClick={() => setView('admin')} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white"><Settings size={20} /></button>
           <button onClick={handleShare} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white"><Share2 size={20} /></button>
        </div>
        <div className="absolute -bottom-6 left-4 flex items-end gap-4">
           <img src={settings.logo} className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg object-cover bg-white" alt="Logo" />
           <div className="pb-2">
              <h1 className="text-xl font-bold text-white drop-shadow-md">{settings.storeName}</h1>
              <div className="flex items-center gap-2 bg-white/90 px-2 py-0.5 rounded-lg w-fit mt-1">
                 <Star size={12} className="text-amber-500 fill-amber-500" />
                 <span className="text-[11px] font-bold text-gray-800">{averageRating.toFixed(1)}</span>
                 <span className="text-[10px] text-gray-400">• {reviews.length} avaliações</span>
              </div>
           </div>
        </div>
      </div>

      <div className="mt-10 px-4 max-w-4xl mx-auto space-y-4">
        <div className="flex items-center gap-4 text-xs font-medium text-gray-500 border-b pb-4">
           <div className="flex items-center gap-1">
              <Clock size={14} className="text-ifood" />
              <span>30-45 min</span>
           </div>
           <div className="flex items-center gap-1">
              <MapPin size={14} className="text-ifood" />
              <span>{settings.deliveryFee > 0 ? `Entrega R$ ${settings.deliveryFee.toFixed(2)}` : 'Entrega Grátis'}</span>
           </div>
           <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded ${isStoreOpen ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
              <span className="text-[10px] font-bold uppercase">{isStoreOpen ? 'Aberto' : 'Fechado'}</span>
           </div>
        </div>

        {/* Search */}
        <div className="relative pt-2">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
           <input 
             type="text" 
             placeholder="Busque por item ou ingrediente" 
             className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl outline-none text-sm font-medium focus:bg-white focus:ring-1 focus:ring-ifood transition"
             value={searchQuery}
             onChange={e => setSearchQuery(e.target.value)}
           />
        </div>
      </div>

      {/* Categories Sticky */}
      <div className="sticky top-0 z-40 bg-white border-b mt-4">
        <div className="px-4 max-w-4xl mx-auto flex gap-6 overflow-x-auto hide-scrollbar py-4">
           <button 
             onClick={() => setSelectedCategory('all')} 
             className={`text-sm font-bold whitespace-nowrap pb-1 border-b-2 transition-colors ${selectedCategory === 'all' ? 'text-ifood border-ifood' : 'text-gray-400 border-transparent'}`}
           >
             Início
           </button>
           {categories.map(cat => (
             <button 
               key={cat.id} 
               onClick={() => setSelectedCategory(cat.id)} 
               className={`text-sm font-bold whitespace-nowrap pb-1 border-b-2 transition-colors ${selectedCategory === cat.id ? 'text-ifood border-ifood' : 'text-gray-400 border-transparent'}`}
             >
               {cat.name}
             </button>
           ))}
        </div>
      </div>

      {/* Menu iFood Style */}
      <div className="px-4 max-w-4xl mx-auto mt-6 space-y-10">
        {categories.filter(c => selectedCategory === 'all' || c.id === selectedCategory).map(cat => {
          const catProds = filteredProducts.filter(p => p.categoryId === cat.id && p.active);
          if (catProds.length === 0) return null;
          return (
            <div key={cat.id} className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">{cat.name}</h3>
              <div className="grid grid-cols-1 gap-4">
                {catProds.map(p => (
                  <div 
                    key={p.id} 
                    onClick={() => { setSelectedProduct(p); setSelectedExtrasInModal([]); }}
                    className="flex justify-between items-start gap-4 p-4 border border-gray-100 rounded-xl hover:shadow-md transition cursor-pointer"
                  >
                    <div className="flex-1 space-y-1">
                      <h4 className="font-semibold text-gray-800 leading-tight">{p.name}</h4>
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{p.description}</p>
                      <div className="pt-2 flex items-center gap-3">
                         <span className="text-sm font-bold text-gray-900">R$ {p.price.toFixed(2)}</span>
                         {p.isDailySuggestion && <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">Sugestão</span>}
                      </div>
                    </div>
                    <div className="relative shrink-0">
                       <img src={p.image} className="w-24 h-24 rounded-lg object-cover" alt={p.name} />
                       <div className="absolute -bottom-2 right-2 bg-white shadow-md border border-gray-100 rounded-lg p-1 text-ifood">
                          <Plus size={16} strokeWidth={3} />
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Cart iFood Style */}
      {cart.length > 0 && !isCartOpen && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-50 bg-white border-t md:bg-transparent md:border-none">
          <button 
            onClick={() => { setIsCartOpen(true); setCartStep('items'); }}
            className="w-full max-w-4xl mx-auto bg-ifood text-white font-bold py-4 px-6 rounded-lg shadow-xl flex items-center justify-between animate-slide-in"
          >
            <div className="flex items-center gap-3">
               <div className="bg-white/20 w-6 h-6 rounded flex items-center justify-center text-xs">
                  {cart.reduce((acc, curr) => acc + curr.quantity, 0)}
               </div>
               <span className="text-sm">Ver sacola</span>
            </div>
            <span className="text-sm">R$ {cartTotal.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Item Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-sm overflow-hidden">
          <div className="bg-white w-full max-w-xl rounded-t-2xl md:rounded-2xl h-[90vh] md:h-auto max-h-[90vh] flex flex-col overflow-hidden animate-slide-in">
             <div className="relative h-48 md:h-56 shrink-0">
                <img src={selectedProduct.image} className="w-full h-full object-cover" alt={selectedProduct.name} />
                <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 bg-black/40 p-2 rounded-full text-white"><X size={20}/></button>
             </div>
             <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                <h2 className="text-xl font-bold text-gray-900">{selectedProduct.name}</h2>
                <p className="text-xs text-gray-500 mt-2 mb-6 leading-relaxed">{selectedProduct.description}</p>
                <div className="text-lg font-bold text-gray-900 mb-6">A partir de R$ {selectedProduct.price.toFixed(2)}</div>
                
                {selectedProduct.extras && selectedProduct.extras.length > 0 && (
                  <div className="space-y-4">
                     <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="text-xs font-bold text-gray-800">Escolha seus adicionais</span>
                     </div>
                     {selectedProduct.extras.map(e => (
                        <label key={e.id} className="flex items-center justify-between p-3 border-b border-gray-50 cursor-pointer">
                           <div className="flex items-center gap-3">
                              <input 
                                type="checkbox" 
                                checked={selectedExtrasInModal.includes(e.id)} 
                                onChange={() => setSelectedExtrasInModal(prev => prev.includes(e.id) ? prev.filter(x => x !== e.id) : [...prev, e.id])}
                                className="w-5 h-5 rounded border-gray-300 text-ifood focus:ring-ifood"
                              />
                              <span className="text-sm text-gray-700">{e.name}</span>
                           </div>
                           <span className="text-sm font-medium text-gray-600">+ R$ {e.price.toFixed(2)}</span>
                        </label>
                     ))}
                  </div>
                )}

                <div className="mt-8 space-y-2">
                   <h3 className="text-xs font-bold text-gray-800">Alguma observação?</h3>
                   <textarea 
                     id="obs" 
                     className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 h-24 outline-none text-sm placeholder:text-gray-400 focus:bg-white transition"
                     placeholder="Ex: Tirar cebola, maionese à parte..."
                   ></textarea>
                </div>
             </div>
             <div className="p-6 border-t bg-white flex items-center justify-between gap-4">
                <div className="flex items-center bg-gray-100 rounded-lg p-2">
                   <button onClick={() => { const el = document.getElementById('qty'); if(el) el.textContent = Math.max(1, parseInt(el.textContent!)-1).toString() }} className="p-1 text-ifood"><Minus size={18}/></button>
                   <span id="qty" className="font-bold text-base w-10 text-center">1</span>
                   <button onClick={() => { const el = document.getElementById('qty'); if(el) el.textContent = (parseInt(el.textContent!)+1).toString() }} className="p-1 text-ifood"><Plus size={18}/></button>
                </div>
                <button 
                  onClick={() => {
                    const qty = parseInt(document.getElementById('qty')?.textContent || '1');
                    const obs = (document.getElementById('obs') as HTMLTextAreaElement).value;
                    setCart([...cart, { id: Math.random().toString(36).substr(2, 9), productId: selectedProduct.id, quantity: qty, selectedExtras: selectedExtrasInModal, notes: obs }]);
                    setSelectedProduct(null);
                  }}
                  className="flex-1 bg-ifood text-white font-bold py-3 rounded-lg shadow-md hover:brightness-90 transition"
                >
                  Adicionar
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Cart Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[200] flex justify-end bg-black/60 backdrop-blur-sm">
           <div className="bg-white w-full max-w-xl h-full flex flex-col animate-slide-in shadow-2xl">
              <div className="p-4 border-b flex items-center justify-between bg-white">
                 <button onClick={() => {
                   if(cartStep === 'checkout') setCartStep('items');
                   else if(cartStep === 'confirm') setCartStep('checkout');
                   else setIsCartOpen(false);
                 }} className="p-2 text-ifood"><ChevronLeft size={24}/></button>
                 <h2 className="text-sm font-bold text-gray-800">
                    {cartStep === 'items' ? 'Minha sacola' : cartStep === 'checkout' ? 'Pagamento e Entrega' : 'Resumo'}
                 </h2>
                 <div className="w-10"></div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                 {cartStep === 'items' && (
                    <div className="space-y-6">
                       {cart.map(item => {
                         const p = products.find(pr => pr.id === item.productId);
                         return p ? (
                           <div key={item.id} className="flex justify-between items-center border-b border-gray-50 pb-4">
                              <div className="flex items-center gap-4">
                                 <span className="text-ifood font-bold text-sm">{item.quantity}x</span>
                                 <div>
                                    <h4 className="text-sm font-bold text-gray-800">{p.name}</h4>
                                    {item.selectedExtras.length > 0 && (
                                       <p className="text-[10px] text-gray-400">
                                          {item.selectedExtras.map(id => p.extras.find(e => e.id === id)?.name).join(', ')}
                                       </p>
                                    )}
                                    <p className="text-xs text-gray-900 font-bold mt-1">R$ {(p.price * item.quantity).toFixed(2)}</p>
                                 </div>
                              </div>
                              <button onClick={() => setCart(cart.filter(x => x.id !== item.id))} className="text-gray-300 hover:text-red-500 p-2"><Trash2 size={16}/></button>
                           </div>
                         ) : null;
                       })}
                       
                       <div className="pt-6 space-y-2">
                          <div className="flex justify-between text-xs text-gray-500"><span>Subtotal</span><span>R$ {cartTotal.toFixed(2)}</span></div>
                          <div className="flex justify-between text-xs text-gray-500"><span>Taxa de entrega</span><span>R$ {settings.deliveryFee.toFixed(2)}</span></div>
                          <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t"><span>Total</span><span>R$ {(cartTotal + settings.deliveryFee).toFixed(2)}</span></div>
                       </div>
                    </div>
                 )}

                 {cartStep === 'checkout' && (
                    <div className="space-y-6">
                       <div className="space-y-4">
                          <div className="bg-gray-50 p-4 rounded-xl">
                             <h4 className="text-xs font-bold text-gray-800 mb-4">Onde entregar?</h4>
                             <input type="text" placeholder="Seu Nome" className="w-full bg-white p-3 border border-gray-200 rounded-lg mb-2 text-sm outline-none" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} />
                             <input type="text" placeholder="Endereço (Rua, Número, Bairro)" className="w-full bg-white p-3 border border-gray-200 rounded-lg mb-2 text-sm outline-none" value={customerInfo.address} onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})} />
                             <input type="text" placeholder="Ponto de Referência" className="w-full bg-white p-3 border border-gray-200 rounded-lg text-sm outline-none" value={customerInfo.reference} onChange={e => setCustomerInfo({...customerInfo, reference: e.target.value})} />
                          </div>

                          <div className="bg-gray-50 p-4 rounded-xl">
                             <h4 className="text-xs font-bold text-gray-800 mb-4">Como pagar?</h4>
                             <div className="grid grid-cols-2 gap-2">
                                {['Pix', 'Dinheiro', 'Crédito', 'Débito'].map(m => (
                                   <button 
                                     key={m} 
                                     onClick={() => setCustomerInfo({...customerInfo, paymentMethod: m as any})}
                                     className={`p-3 rounded-lg border text-xs font-bold transition-all ${customerInfo.paymentMethod === m ? 'bg-ifood text-white border-ifood' : 'bg-white text-gray-500 border-gray-200'}`}
                                   >
                                      {m}
                                   </button>
                                ))}
                             </div>
                          </div>
                       </div>
                    </div>
                 )}

                 {cartStep === 'confirm' && (
                    <div className="text-center py-10 space-y-4">
                       <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Check size={32} strokeWidth={3} />
                       </div>
                       <h3 className="text-lg font-bold text-gray-900">Quase lá!</h3>
                       <p className="text-sm text-gray-500 px-6">Ao clicar no botão abaixo, você será redirecionado para o WhatsApp para finalizar seu pedido.</p>
                       <div className="bg-gray-50 p-4 rounded-xl mx-4 text-left">
                          <div className="flex justify-between items-center text-lg font-bold text-gray-900">
                             <span>Total do Pedido</span>
                             <span className="text-ifood">R$ {(cartTotal + settings.deliveryFee).toFixed(2)}</span>
                          </div>
                       </div>
                    </div>
                 )}
              </div>

              <div className="p-4 border-t bg-white">
                 {cartStep === 'items' && (
                    <button onClick={() => cart.length > 0 ? setCartStep('checkout') : alert('Adicione itens!')} className="w-full bg-ifood text-white font-bold py-4 rounded-lg shadow-md uppercase text-sm tracking-wider">Escolher forma de entrega</button>
                 )}
                 {cartStep === 'checkout' && (
                    <button onClick={() => customerInfo.name && customerInfo.address ? setCartStep('confirm') : alert('Preencha os dados de entrega!')} className="w-full bg-ifood text-white font-bold py-4 rounded-lg shadow-md uppercase text-sm tracking-wider">Continuar para o resumo</button>
                 )}
                 {cartStep === 'confirm' && (
                    <button onClick={() => {
                        let msg = `*NOVO PEDIDO - ${settings.storeName}*\n\n`;
                        msg += `👤 *Cliente:* ${customerInfo.name}\n`;
                        msg += `📍 *Endereço:* ${customerInfo.address}\n`;
                        if(customerInfo.reference) msg += `🔍 *Ref:* ${customerInfo.reference}\n`;
                        msg += `💳 *Pagamento:* ${customerInfo.paymentMethod}\n\n`;
                        msg += `🛒 *ITENS:*\n`;
                        cart.forEach(item => {
                          const p = products.find(prod => prod.id === item.productId);
                          if (p) {
                            msg += `• ${item.quantity}x ${p.name} (R$ ${(p.price * item.quantity).toFixed(2)})\n`;
                            item.selectedExtras.forEach(exId => {
                              const ex = p.extras.find(e => e.id === exId);
                              if(ex) msg += `  + ${ex.name}\n`;
                            });
                            if(item.notes) msg += `  💬 _${item.notes}_\n`;
                          }
                        });
                        msg += `\n💰 *Total:* R$ ${(cartTotal + settings.deliveryFee).toFixed(2)}`;
                        window.open(`https://wa.me/55${settings.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
                    }} className="w-full bg-green-600 text-white font-bold py-4 rounded-lg shadow-md flex items-center justify-center gap-2 uppercase text-sm tracking-wider">
                       <Send size={18}/> Enviar Pedido
                    </button>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;