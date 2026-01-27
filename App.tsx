
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
    const savedStats = localStorage.getItem('kones_stats');
    const stats = savedStats ? JSON.parse(savedStats) : { salesToday: 0, ordersCount: 0, visits: 0, ticketMedio: 0 };
    stats.visits += 1;
    localStorage.setItem('kones_stats', JSON.stringify(stats));

    // Carregar avaliações do localStorage para ser funcional imediato
    const savedReviews = localStorage.getItem('kones_reviews');
    if (savedReviews) setReviews(JSON.parse(savedReviews));

    const channel = supabase.channel('schema-db-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, fetchData).on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, fetchData).on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchData).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
    try {
      const { data: s } = await supabase.from('settings').select('*').eq('id', 1).single();
      if (s?.data) setSettings(s.data);
      const { data: c } = await supabase.from('categories').select('*').order('name');
      if (c && c.length > 0) setCategories(c);
      const { data: p } = await supabase.from('products').select('*').order('name');
      if (p && p.length > 0) setProducts(p);
    } catch (err) { console.warn('Modo demo.'); }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: settings.storeName,
          text: `Confira o cardápio da ${settings.storeName}! 🍦`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Erro ao compartilhar');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  };

  const submitReview = () => {
    if (!newReview.name || !newReview.comment) return alert('Preencha seu nome e comentário!');
    const review: Review = {
      id: Math.random().toString(36).substr(2, 9),
      customerName: newReview.name,
      stars: newReview.stars,
      comment: newReview.comment,
      date: new Date().toLocaleDateString('pt-BR')
    };
    const updated = [review, ...reviews];
    setReviews(updated);
    localStorage.setItem('kones_reviews', JSON.stringify(updated));
    setNewReview({ name: '', stars: 5, comment: '' });
    setIsReviewModalOpen(false);
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

  const dailySuggestion = useMemo(() => {
    return products.find(p => p.isDailySuggestion && p.active);
  }, [products]);

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

  const handleCheckout = () => {
    const totalPedido = cartTotal + settings.deliveryFee;
    const savedStats = localStorage.getItem('kones_stats');
    const stats = savedStats ? JSON.parse(savedStats) : { salesToday: 0, ordersCount: 0, visits: 0, ticketMedio: 0 };
    stats.salesToday += totalPedido;
    stats.ordersCount += 1;
    stats.ticketMedio = stats.salesToday / stats.ordersCount;
    localStorage.setItem('kones_stats', JSON.stringify(stats));

    let message = `🚀 *PEDIDO - ${settings.storeName.toUpperCase()}*\n\n`;
    message += `👤 *Cliente:* ${customerInfo.name}\n`;
    message += `📍 *Endereço:* ${customerInfo.address}\n`;
    if (customerInfo.reference) message += `🔍 *Ponto de Ref:* ${customerInfo.reference}\n`;
    message += `💳 *Pagamento:* ${customerInfo.paymentMethod}\n\n`;
    message += `🛒 *ITENS:*\n`;
    cart.forEach(item => {
      const p = products.find(prod => prod.id === item.productId);
      if (p) {
        message += `✅ *${item.quantity}x ${p.name}*\n`;
        item.selectedExtras?.forEach(exId => {
          const ex = p.extras?.find(e => e.id === exId);
          if(ex) message += `  + ${ex.name}\n`;
        });
        if (item.notes) message += `   📝 _${item.notes}_\n`;
      }
    });
    message += `\n💰 *TOTAL:* R$ ${totalPedido.toFixed(2)}\n`;
    window.open(`https://wa.me/55${settings.whatsapp}?text=${encodeURIComponent(message)}`, '_blank');
    setCart([]);
    setIsCartOpen(false);
    setCartStep('items');
  };

  if (view === 'admin') return <AdminDashboard settings={settings} setSettings={setSettings} categories={categories} setCategories={setCategories} products={products} setProducts={setProducts} onClose={() => setView('menu')} isAdminLoggedIn={isAdminLoggedIn} setIsAdminLoggedIn={setIsAdminLoggedIn} />;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-['Inter']">
      <div className="relative h-32 md:h-44 overflow-hidden">
        <img src={settings.banner} className="w-full h-full object-cover brightness-75 scale-105" alt="Banner Loja" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent"></div>
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
           <button onClick={() => setView('admin')} className="p-2.5 bg-black/30 backdrop-blur-md rounded-2xl text-white hover:bg-red-600 transition shadow-lg border border-white/10"><Settings size={20} /></button>
           <button onClick={handleShare} className="p-2.5 bg-black/30 backdrop-blur-md rounded-2xl text-white hover:bg-red-600 transition shadow-lg border border-white/10"><Share2 size={20} /></button>
        </div>
      </div>

      <div className="relative px-4 flex flex-col items-center -mt-16 md:-mt-20 mb-8">
        <div className="relative group">
          <img src={settings.logo} className="w-28 h-28 md:w-36 md:h-36 rounded-full border-[6px] border-white shadow-2xl object-cover" alt="Logo" />
          <div className="absolute -bottom-1 -right-1 bg-green-500 w-6 h-6 rounded-full border-4 border-white shadow-lg"></div>
        </div>
        <div className="text-center mt-4 space-y-1">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight">{settings.storeName}</h1>
          <div className="flex flex-col items-center gap-2 mt-2">
            <div className="flex items-center gap-1">
               {[1,2,3,4,5].map(s => <Star key={s} size={14} className={s <= Math.round(averageRating) ? "text-amber-400 fill-amber-400" : "text-gray-200"} />)}
               <span className="text-xs font-black text-gray-400 ml-1">{averageRating.toFixed(1)} ({reviews.length} avaliações)</span>
            </div>
            <div className="flex items-center justify-center gap-3">
               <div className="flex items-center gap-1.5 bg-green-50 text-green-600 px-3 py-1 rounded-full border border-green-100">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-black uppercase tracking-wider">Aberto Agora</span>
               </div>
               <span className="text-xs font-bold text-gray-400 flex items-center gap-1"><MapPin size={12} className="text-red-500"/> {settings.deliveryFee > 0 ? `Entrega R$ ${settings.deliveryFee.toFixed(2)}` : 'Entrega Grátis'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO DE AVALIAÇÕES */}
      <div className="px-4 max-w-4xl mx-auto mb-10">
         <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-black text-gray-900 flex items-center gap-2"><MessageSquareQuote size={20} className="text-red-600"/> O que dizem de nós</h3>
               <button onClick={() => setShowReviews(!showReviews)} className="text-[10px] font-black text-red-600 uppercase tracking-widest bg-red-50 px-3 py-1.5 rounded-full border border-red-100 transition-all hover:bg-red-600 hover:text-white">
                  {showReviews ? 'Ocultar Depoimentos' : 'Ver Avaliações'}
               </button>
            </div>

            {showReviews && (
              <div className="space-y-4 animate-slide-in">
                 {reviews.length === 0 ? (
                    <p className="text-center text-gray-400 text-xs py-4 font-medium italic">Nenhuma avaliação ainda. Seja o primeiro!</p>
                 ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                       {reviews.map(r => (
                          <div key={r.id} className="bg-gray-50 p-4 rounded-2xl relative border border-gray-100">
                             <Quote size={24} className="absolute top-2 right-2 text-red-100 opacity-50" />
                             <div className="flex items-center gap-1 mb-1">
                                {[1,2,3,4,5].map(s => <Star key={s} size={10} className={s <= r.stars ? "text-amber-400 fill-amber-400" : "text-gray-200"} />)}
                             </div>
                             <p className="text-[11px] font-bold text-gray-900 leading-tight mb-2">"{r.comment}"</p>
                             <div className="flex justify-between items-center text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                <span>{r.customerName}</span>
                                <span>{r.date}</span>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>
            )}
            
            <button onClick={() => setIsReviewModalOpen(true)} className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all">
               <Star size={14}/> Avaliar Experiência
            </button>
         </div>
      </div>

      {dailySuggestion && (
        <div className="px-4 max-w-4xl mx-auto mb-10">
           <div onClick={() => { setSelectedProduct(dailySuggestion); setSelectedExtrasInModal([]); }} className="bg-gradient-to-r from-zinc-900 to-black rounded-[32px] p-6 shadow-xl text-white flex items-center justify-between gap-6 cursor-pointer hover:scale-[1.01] transition-transform overflow-hidden relative group border border-white/5">
              <div className="absolute -right-4 -top-4 opacity-10 rotate-12 group-hover:rotate-45 transition-transform"><Sparkles size={160} /></div>
              <div className="flex-1 space-y-1 relative z-10">
                 <span className="text-red-500 text-[10px] font-black uppercase tracking-[3px] flex items-center gap-2 mb-1"><div className="w-1 h-1 bg-red-500 rounded-full"></div> Sugestão da Silvia</span>
                 <h2 className="text-2xl font-black leading-tight">{dailySuggestion.name}</h2>
                 <p className="text-gray-400 text-xs font-medium leading-relaxed line-clamp-2">{dailySuggestion.description}</p>
                 <div className="text-2xl font-black pt-2 text-white">R$ {dailySuggestion.price.toFixed(2)}</div>
              </div>
              <div className="w-24 h-24 md:w-32 md:h-32 shrink-0 relative z-10">
                 <img src={dailySuggestion.image} className="w-full h-full object-cover rounded-2xl shadow-2xl border-2 border-white/10" alt="Sugestão" />
              </div>
           </div>
        </div>
      )}

      <div className="sticky top-0 z-40 bg-gray-50/80 backdrop-blur-xl border-b pb-4 pt-2">
        <div className="px-4 max-w-4xl mx-auto space-y-4">
           <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-red-600 transition-colors" size={20} />
              <input type="text" placeholder="Qual Cone vai hoje?" className="w-full pl-14 pr-6 py-4 bg-white border-2 border-transparent focus:border-red-600 rounded-2xl outline-none shadow-sm font-bold text-sm transition-all" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
           </div>
           <div className="flex gap-2 overflow-x-auto hide-scrollbar">
              <button onClick={() => setSelectedCategory('all')} className={`px-6 py-3 rounded-xl text-xs font-black transition-all whitespace-nowrap shadow-sm border ${selectedCategory === 'all' ? 'bg-red-600 text-white border-red-600 shadow-red-100' : 'bg-white text-gray-400 border-gray-100'}`}>TODOS</button>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`px-6 py-3 rounded-xl text-xs font-black transition-all whitespace-nowrap shadow-sm border ${selectedCategory === cat.id ? 'bg-red-600 text-white border-red-600 shadow-red-100' : 'bg-white text-gray-400 border-gray-100'}`}>{cat.name.toUpperCase()}</button>
              ))}
           </div>
        </div>
      </div>

      <div className="px-4 max-w-4xl mx-auto mt-8 space-y-12">
        {categories.filter(c => selectedCategory === 'all' || c.id === selectedCategory).map(cat => {
          const catProds = filteredProducts.filter(p => p.categoryId === cat.id && p.active);
          if (catProds.length === 0) return null;
          return (
            <div key={cat.id} className="space-y-6">
              <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3 tracking-tight"><div className="w-2 h-8 bg-red-600 rounded-full shadow-lg shadow-red-200"></div> {cat.name}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {catProds.map(p => (
                  <div key={p.id} onClick={() => { setSelectedProduct(p); setSelectedExtrasInModal([]); }} className="bg-white p-4 rounded-[32px] shadow-sm border border-gray-100 flex gap-4 cursor-pointer hover:shadow-xl hover:border-red-50 active:scale-95 transition-all duration-300">
                    <div className="flex-1 space-y-1">
                      <h4 className="font-black text-gray-900 line-clamp-1 text-lg">{p.name}</h4>
                      <p className="text-[11px] text-gray-400 font-medium line-clamp-2 leading-relaxed">{p.description}</p>
                      <div className="text-xl font-black text-red-600 pt-3 tracking-tighter">R$ {p.price.toFixed(2)}</div>
                    </div>
                    <img src={p.image} className="w-24 h-24 md:w-28 md:h-28 rounded-3xl object-cover shadow-sm" alt={p.name} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {cart.length > 0 && !isCartOpen && (
        <div className="fixed bottom-6 left-6 right-6 z-50 max-w-lg mx-auto">
          <button onClick={() => { setIsCartOpen(true); setCartStep('items'); }} className="w-full bg-red-600 text-white font-black py-5 rounded-3xl shadow-2xl flex items-center justify-between px-10 animate-slide-in border-4 border-white/20 hover:scale-[1.02] transition-transform">
            <div className="flex items-center gap-4">
              <div className="bg-white text-red-600 w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-inner font-black">{cart.length}</div>
              <span className="text-sm tracking-widest uppercase">Sacola</span>
            </div>
            <span className="text-xl font-black">R$ {cartTotal.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Modal de Avaliação */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl p-8 animate-slide-in relative overflow-hidden">
              <button onClick={() => setIsReviewModalOpen(false)} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full"><X size={20}/></button>
              <h3 className="text-2xl font-black text-gray-900 mb-2">Avaliar Kones</h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-8">Sua opinião vale muito para nós!</p>
              
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Qual seu nome?</label>
                    <input type="text" className="w-full bg-gray-50 p-5 rounded-[24px] outline-none border-2 border-transparent focus:border-red-600 font-bold transition-all" value={newReview.name} onChange={e => setNewReview({...newReview, name: e.target.value})} />
                 </div>
                 
                 <div className="space-y-2 flex flex-col items-center">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Quantas estrelas?</label>
                    <div className="flex gap-2">
                       {[1,2,3,4,5].map(s => (
                         <button key={s} onClick={() => setNewReview({...newReview, stars: s})} className="transition-transform active:scale-125">
                            <Star size={36} className={s <= newReview.stars ? "text-amber-400 fill-amber-400" : "text-gray-100"} />
                         </button>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Seu Comentário</label>
                    <textarea className="w-full bg-gray-50 p-5 rounded-[24px] outline-none border-2 border-transparent focus:border-red-600 font-bold transition-all h-32" placeholder="O que achou do sabor e do atendimento?" value={newReview.comment} onChange={e => setNewReview({...newReview, comment: e.target.value})} />
                 </div>

                 <button onClick={submitReview} className="w-full bg-red-600 text-white py-5 rounded-[24px] font-black shadow-xl shadow-red-200 uppercase tracking-widest text-xs hover:bg-red-700 transition-all">Enviar Avaliação</button>
              </div>
           </div>
        </div>
      )}

      {/* Modal Produto */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/90 backdrop-blur-md overflow-hidden">
          <div className="bg-white w-full max-w-xl rounded-t-[40px] md:rounded-[40px] max-h-[95vh] flex flex-col overflow-hidden animate-slide-in shadow-2xl">
            <div className="relative h-56 md:h-64 shrink-0">
               <img src={selectedProduct.image} className="w-full h-full object-cover" alt={selectedProduct.name} />
               <button onClick={() => setSelectedProduct(null)} className="absolute top-5 right-5 bg-white/20 backdrop-blur-md p-2.5 rounded-full text-white hover:bg-red-600 transition-colors"><X size={20}/></button>
            </div>
            <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
               <h2 className="text-3xl font-black text-gray-900 leading-none">{selectedProduct.name}</h2>
               <p className="text-sm text-gray-400 font-medium mt-2 mb-8 leading-relaxed">{selectedProduct.description}</p>
               
               {selectedProduct.extras && selectedProduct.extras.length > 0 && (
                 <div className="space-y-4 mb-10">
                    <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                       <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Adicionais Opcionais</span>
                       <span className="text-[9px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-black">TURBINE SEU CONE</span>
                    </div>
                    {selectedProduct.extras.map(e => (
                      <label key={e.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border-2 border-gray-50 hover:border-red-600 transition cursor-pointer group shadow-sm">
                        <div className="flex items-center gap-4">
                           <input type="checkbox" title="Selecionar adicional" checked={selectedExtrasInModal.includes(e.id)} onChange={() => {
                             setSelectedExtrasInModal(prev => prev.includes(e.id) ? prev.filter(x => x !== e.id) : [...prev, e.id]);
                           }} className="w-6 h-6 rounded-lg text-red-600 border-gray-200" />
                           <span className="font-black text-gray-700 text-sm group-hover:text-red-600">{e.name}</span>
                        </div>
                        <span className="text-red-600 font-black text-sm">R$ {e.price.toFixed(2)}</span>
                      </label>
                    ))}
                 </div>
               )}

               <div className="space-y-3">
                  <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Alguma Observação?</h3>
                  <textarea id="obs" className="w-full bg-gray-50 border-2 border-transparent focus:border-red-600 rounded-[28px] p-6 h-28 outline-none font-medium text-sm text-gray-600 shadow-inner transition-all" placeholder="Ex: Sem cebola, trocar ingrediente..."></textarea>
               </div>
            </div>

            <div className="p-8 border-t bg-white flex gap-4 shadow-2xl">
               <div className="flex items-center bg-gray-100 rounded-3xl px-5 py-4 shrink-0">
                  <button onClick={() => { const el = document.getElementById('qty'); if(el) el.textContent = Math.max(1, parseInt(el.textContent!)-1).toString() }} className="p-1 text-gray-400 hover:text-red-600 active:scale-125 transition-transform"><Minus size={20} strokeWidth={3}/></button>
                  <span id="qty" className="font-black text-2xl w-12 text-center">1</span>
                  <button onClick={() => { const el = document.getElementById('qty'); if(el) el.textContent = (parseInt(el.textContent!)+1).toString() }} className="p-1 text-gray-400 hover:text-red-600 active:scale-125 transition-transform"><Plus size={20} strokeWidth={3}/></button>
               </div>
               <button onClick={() => {
                 const qty = parseInt(document.getElementById('qty')?.textContent || '1');
                 const obs = (document.getElementById('obs') as HTMLTextAreaElement).value;
                 setCart([...cart, { id: Math.random().toString(36).substr(2, 9), productId: selectedProduct.id, quantity: qty, selectedExtras: selectedExtrasInModal, notes: obs }]);
                 setSelectedProduct(null);
               }} className="flex-1 bg-red-600 text-white font-black py-5 rounded-3xl shadow-xl shadow-red-200 active:scale-95 transition-all text-sm uppercase tracking-[2px]">Adicionar à Sacola</button>
            </div>
          </div>
        </div>
      )}

      {/* Sacola Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[200] flex justify-end bg-black/80 backdrop-blur-xl">
          <div className="bg-white w-full max-w-xl h-full flex flex-col animate-slide-in shadow-2xl md:border-l-[10px] border-red-600">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10 shadow-sm">
               <button onClick={() => {
                 if(cartStep === 'checkout') setCartStep('items');
                 else if(cartStep === 'confirm') setCartStep('checkout');
                 else setIsCartOpen(false);
               }} className="p-3 bg-gray-100 rounded-2xl hover:bg-red-600 hover:text-white transition-all"><ChevronLeft size={24}/></button>
               <h2 className="text-xl font-black text-gray-900 uppercase tracking-[4px]">
                 {cartStep === 'items' && 'Sacola'}
                 {cartStep === 'checkout' && 'Entrega'}
                 {cartStep === 'confirm' && 'Conferir'}
               </h2>
               <div className="w-12"></div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
               {cartStep === 'items' && (
                 <div className="space-y-6">
                    {cart.map(item => {
                      const p = products.find(pr => pr.id === item.productId);
                      return p ? (
                        <div key={item.id} className="flex gap-5 border-b border-gray-50 pb-8 group animate-slide-in">
                           <img src={p.image} className="w-20 h-20 rounded-[28px] object-cover shadow-md border-2 border-gray-50" alt={p.name} />
                           <div className="flex-1 space-y-1">
                              <div className="flex justify-between items-start">
                                 <h4 className="font-black text-gray-900">{item.quantity}x {p.name}</h4>
                                 <button onClick={() => setCart(cart.filter(x => x.id !== item.id))} className="text-gray-200 hover:text-red-600 transition-colors p-1"><Trash2 size={18}/></button>
                              </div>
                              <p className="text-[11px] text-gray-400 font-medium line-clamp-1">{p.description}</p>
                              <div className="text-red-600 font-black text-base mt-2">R$ {(p.price * item.quantity).toFixed(2)}</div>
                           </div>
                        </div>
                      ) : null;
                    })}
                 </div>
               )}

               {cartStep === 'checkout' && (
                 <div className="space-y-8 animate-slide-in">
                    <div className="bg-red-50 p-6 rounded-[32px] border border-red-100 flex items-center gap-4">
                       <MapPin className="text-red-600" size={32}/>
                       <p className="text-sm font-black text-red-900 uppercase tracking-widest leading-tight">Preencha os dados<br/>para a entrega</p>
                    </div>
                    <div className="space-y-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Seu Nome</label>
                          <input type="text" placeholder="Como te chamamos?" className="w-full bg-gray-50 p-6 rounded-[28px] outline-none border-2 border-transparent focus:border-red-600 font-bold transition-all" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Endereço Completo</label>
                          <input type="text" placeholder="Rua, número, bairro..." className="w-full bg-gray-50 p-6 rounded-[28px] outline-none border-2 border-transparent focus:border-red-600 font-bold transition-all" value={customerInfo.address} onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Ponto de Referência</label>
                          <div className="relative">
                             <MapPinned className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                             <input type="text" placeholder="Perto de onde?" className="w-full pl-14 pr-6 py-5 bg-gray-50 rounded-[28px] outline-none border-2 border-transparent focus:border-red-600 font-bold transition-all" value={customerInfo.reference} onChange={e => setCustomerInfo({...customerInfo, reference: e.target.value})} />
                          </div>
                       </div>
                       <div className="pt-6 space-y-4">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Forma de Pagamento</p>
                          <div className="grid grid-cols-2 gap-3">
                             {['Pix', 'Dinheiro', 'Crédito', 'Débito'].map(m => (
                               <button key={m} onClick={() => setCustomerInfo({...customerInfo, paymentMethod: m as any})} className={`p-5 rounded-[24px] border-2 font-black text-xs transition-all tracking-widest ${customerInfo.paymentMethod === m ? 'border-red-600 bg-red-50 text-red-600' : 'bg-white text-gray-300 border-gray-50 hover:border-red-100'}`}>{m.toUpperCase()}</button>
                             ))}
                          </div>
                       </div>
                    </div>
                 </div>
               )}

               {cartStep === 'confirm' && (
                 <div className="space-y-10 animate-slide-in text-center py-6">
                    <div className="w-28 h-28 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-inner ring-8 ring-green-100/30"><Check size={56} strokeWidth={3} /></div>
                    <div className="space-y-2">
                       <h3 className="text-3xl font-black text-gray-900 tracking-tight">Pedido Quase Lá!</h3>
                       <p className="text-gray-400 font-medium text-sm px-10">Agora é só enviar para o nosso WhatsApp e aguardar seu Cone fresquinho!</p>
                    </div>
                    <div className="bg-white p-8 rounded-[40px] text-left space-y-4 border-2 border-gray-50 shadow-sm relative overflow-hidden">
                       <div className="absolute top-0 left-0 w-2 h-full bg-red-600"></div>
                       <p className="text-[11px] font-black text-gray-400 uppercase tracking-[3px]">Total do Pedido</p>
                       <div className="flex justify-between font-bold text-gray-700 text-sm"><span>Subtotal Itens</span><span>R$ {cartTotal.toFixed(2)}</span></div>
                       <div className="flex justify-between font-bold text-gray-700 text-sm"><span>Taxa de Entrega</span><span>R$ {settings.deliveryFee.toFixed(2)}</span></div>
                       <div className="flex justify-between text-4xl font-black text-gray-900 pt-6 border-t mt-4 leading-none tracking-tighter"><span>Total</span><span className="text-red-600">R$ {(cartTotal + settings.deliveryFee).toFixed(2)}</span></div>
                    </div>
                 </div>
               )}
            </div>

            <div className="p-8 border-t bg-gray-50/80 space-y-4 shadow-inner backdrop-blur-md">
               {cartStep === 'items' && (
                 <button onClick={() => { if(cart.length === 0) alert('Adicione itens!'); else setCartStep('checkout'); }} className="w-full bg-red-600 text-white font-black py-6 rounded-[28px] shadow-2xl shadow-red-200 uppercase tracking-[3px] text-sm hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-3">
                   CONTINUAR <ArrowRight size={20}/>
                 </button>
               )}
               {cartStep === 'checkout' && (
                 <button onClick={() => { if(!customerInfo.name || !customerInfo.address) alert('Por favor, preencha os dados!'); else setCartStep('confirm'); }} className="w-full bg-red-600 text-white font-black py-6 rounded-[28px] shadow-2xl shadow-red-200 uppercase tracking-[3px] text-sm hover:bg-red-700 active:scale-95 transition-all">
                   CONFERIR PEDIDO
                 </button>
               )}
               {cartStep === 'confirm' && (
                 <button onClick={handleCheckout} className="w-full bg-green-600 text-white font-black py-5 rounded-[28px] shadow-2xl shadow-green-200 flex items-center justify-center gap-3 uppercase tracking-[2px] text-sm hover:bg-green-700 active:scale-95 transition-all">
                   <Send size={20}/> ENVIAR WHATSAPP
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
