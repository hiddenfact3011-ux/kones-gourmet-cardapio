
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Save, Plus, Trash2, Camera, ArrowLeft, Settings as SettingsIcon, Tag, Package, Copy, Check, Layout, ShieldAlert, BarChart3, Clock, Eye, EyeOff, Star, TrendingUp, Users, ShoppingBag, Edit3, Image as ImageIcon, RotateCcw, Upload, Layers, DollarSign } from 'lucide-react';
import { AppSettings, Category, Product, Extra, BusinessHours } from '../types';
import { ADMIN_PASSWORD, DEFAULT_SETTINGS } from '../constants';
import { supabase } from '../lib/supabase';

interface AdminDashboardProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  onClose: () => void;
  isAdminLoggedIn: boolean;
  setIsAdminLoggedIn: (val: boolean) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ settings, setSettings, categories, setCategories, products, setProducts, onClose, isAdminLoggedIn, setIsAdminLoggedIn }) => {
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'categories' | 'hours' | 'settings'>('dashboard');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [statsData, setStatsData] = useState({ visits: 0, history: [] as any[] });

  useEffect(() => {
    const saved = localStorage.getItem('kones_stats_v2');
    if (saved) setStatsData(JSON.parse(saved));
  }, []);

  const resetStats = () => {
    if (confirm('Zerar todas as estatísticas?')) {
      const empty = { visits: 0, history: [] };
      setStatsData(empty);
      localStorage.setItem('kones_stats_v2', JSON.stringify(empty));
    }
  };

  const dashboardStats = useMemo(() => {
    const today = new Date().toLocaleDateString();
    const todaySales = statsData.history.filter(o => new Date(o.date).toLocaleDateString() === today);
    const totalToday = todaySales.reduce((acc, curr) => acc + curr.total, 0);
    
    const prodCounts: Record<string, number> = {};
    statsData.history.forEach(order => {
      order.items.forEach((item: any) => {
        prodCounts[item.id] = (prodCounts[item.id] || 0) + item.qty;
      });
    });
    
    const topProdId = Object.entries(prodCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topProd = products.find(p => p.id === topProdId);

    return {
      salesToday: totalToday,
      ordersToday: todaySales.length,
      visits: statsData.visits,
      topProduct: topProd ? { name: topProd.name, qty: prodCounts[topProdId] } : null
    };
  }, [statsData, products]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) setIsAdminLoggedIn(true);
    else alert('Senha incorreta!');
  };

  // --- CORREÇÃO ROBUSTA: ADICIONAR CATEGORIA ---
  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{ name }])
        .select();

      if (error) throw error;

      // Busca a lista atualizada do banco para garantir que apareça na tela da Silvia
      const { data: list } = await supabase.from('categories').select('*').order('name');
      if (list && list.length > 0) {
        setCategories(list);
        setNewCategoryName('');
        alert(`Categoria "${name}" criada com sucesso!`);
      }
    } catch (err: any) {
      console.error('Erro ao criar categoria:', err);
      alert("Erro ao criar categoria. Verifique sua internet.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Excluir esta categoria?')) return;
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err: any) { 
      alert('Erro ao excluir.'); 
    }
  };

  // --- SALVAR CONFIGURAÇÕES ---
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const finalSettings = {
        ...settings,
        businessHours: settings.businessHours || DEFAULT_SETTINGS.businessHours
      };

      const { error } = await supabase
        .from('settings')
        .upsert({ id: 1, data: finalSettings });

      if (error) throw error;
      
      setSettings(finalSettings);
      alert("Salvo com sucesso!");
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      alert("Erro ao gravar dados.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setIsSaving(true);
    try {
      if (editingProduct.id.startsWith('temp-')) {
        const { id, ...prodData } = editingProduct;
        const { data, error } = await supabase.from('products').insert([prodData]).select();
        if (error) throw error;
        setProducts(prev => [...prev, data[0]]);
      } else {
        const { error } = await supabase.from('products').update(editingProduct).eq('id', editingProduct.id);
        if (error) throw error;
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? editingProduct : p));
      }
      setEditingProduct(null);
      alert('Produto atualizado!');
    } catch (err: any) { 
      alert("Erro ao salvar produto."); 
    } finally { 
      setIsSaving(false); 
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Excluir este produto?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) { alert("Erro ao excluir."); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'product' | 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (type === 'product' && editingProduct) setEditingProduct({ ...editingProduct, image: base64String });
        else if (type === 'logo') setSettings(prev => ({ ...prev, logo: base64String }));
        else if (type === 'banner') setSettings(prev => ({ ...prev, banner: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const displayHours = (settings.businessHours && settings.businessHours.length > 0) 
    ? settings.businessHours 
    : DEFAULT_SETTINGS.businessHours;

  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
        <div className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-md text-center border-t-[12px] border-red-600">
          <SettingsIcon size={48} className="mx-auto text-red-600 mb-6"/>
          <h2 className="text-3xl font-black mb-8 text-gray-900">Painel Silvia</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" title="Senha" className="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl p-5 outline-none focus:border-red-600 text-center text-3xl tracking-[10px]" placeholder="****" value={password} onChange={e => setPassword(e.target.value)} autoFocus />
            <button className="w-full bg-red-600 text-white font-black py-5 rounded-2xl shadow-xl uppercase">Acessar Painel</button>
            <button type="button" onClick={onClose} className="text-gray-400 font-bold hover:text-red-600 text-sm mt-4">Voltar</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-['Inter']">
      <header className="bg-zinc-900 text-white p-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition"><ArrowLeft /></button>
          <span className="font-black text-lg uppercase tracking-widest">Kones Admin</span>
        </div>
        <button onClick={() => setIsAdminLoggedIn(false)} className="bg-red-600 px-6 py-2 rounded-xl font-bold text-xs uppercase">DESLOGAR</button>
      </header>

      <nav className="flex border-b bg-white sticky top-[80px] z-40 overflow-x-auto hide-scrollbar">
        <button onClick={() => setActiveTab('dashboard')} className={`flex-1 p-5 font-black flex flex-col items-center gap-1 min-w-[100px] transition-all text-[10px] uppercase ${activeTab === 'dashboard' ? 'text-red-600 border-b-4 border-red-600 bg-red-50/10' : 'text-gray-300'}`}><BarChart3 size={18} /> Resumo</button>
        <button onClick={() => setActiveTab('products')} className={`flex-1 p-5 font-black flex flex-col items-center gap-1 min-w-[100px] transition-all text-[10px] uppercase ${activeTab === 'products' ? 'text-red-600 border-b-4 border-red-600 bg-red-50/10' : 'text-gray-300'}`}><Package size={18} /> Produtos</button>
        <button onClick={() => setActiveTab('categories')} className={`flex-1 p-5 font-black flex flex-col items-center gap-1 min-w-[100px] transition-all text-[10px] uppercase ${activeTab === 'categories' ? 'text-red-600 border-b-4 border-red-600 bg-red-50/10' : 'text-gray-300'}`}><Layers size={18} /> Categorias</button>
        <button onClick={() => setActiveTab('hours')} className={`flex-1 p-5 font-black flex flex-col items-center gap-1 min-w-[100px] transition-all text-[10px] uppercase ${activeTab === 'hours' ? 'text-red-600 border-b-4 border-red-600 bg-red-50/10' : 'text-gray-300'}`}><Clock size={18} /> Horários</button>
        <button onClick={() => setActiveTab('settings')} className={`flex-1 p-5 font-black flex flex-col items-center gap-1 min-w-[100px] transition-all text-[10px] uppercase ${activeTab === 'settings' ? 'text-red-600 border-b-4 border-red-600 bg-red-50/10' : 'text-gray-300'}`}><Layout size={18} /> Design</button>
      </nav>

      <main className="p-6 max-w-5xl mx-auto w-full flex-1 pb-32">
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-slide-in">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-gray-900">Desempenho</h2>
                <button onClick={resetStats} className="text-xs font-black text-red-600 bg-red-50 px-4 py-2 rounded-xl">ZERAR TUDO</button>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pt-4">Vendas Hoje</p>
                   <p className="text-2xl font-black text-gray-900">R$ {dashboardStats.salesToday.toFixed(2)}</p>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pt-4">Pedidos Hoje</p>
                   <p className="text-2xl font-black text-gray-900">{dashboardStats.ordersToday}</p>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pt-4">Visitas Totais</p>
                   <p className="text-2xl font-black text-gray-900">{dashboardStats.visits}</p>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pt-4">Mais Vendido</p>
                   <p className="text-sm font-black text-gray-900 truncate">{dashboardStats.topProduct?.name || 'Sem dados'}</p>
                   <span className="text-[9px] font-bold text-gray-400 uppercase">{dashboardStats.topProduct?.qty ? `${dashboardStats.topProduct.qty} unidades` : ''}</span>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'categories' && (
           <div className="space-y-8 animate-slide-in">
              <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                 <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2"><Layers className="text-red-600"/> Gerenciar Categorias</h3>
                 <div className="flex gap-2">
                    <input type="text" placeholder="Ex: Bebidas, Combos, Sobremesas" className="flex-1 p-5 bg-gray-50 border-2 border-transparent focus:border-red-600 rounded-[24px] outline-none font-bold" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} />
                    <button onClick={handleAddCategory} disabled={isSaving || !newCategoryName.trim()} className="bg-red-600 text-white px-8 rounded-[24px] font-black text-xs uppercase disabled:opacity-50">
                      {isSaving ? 'SALVANDO...' : 'ADICIONAR'}
                    </button>
                 </div>
                 <div className="space-y-2 mt-8">
                    {categories.length === 0 ? (
                      <p className="text-center text-gray-300 font-bold py-10">Crie sua primeira categoria acima.</p>
                    ) : (
                      categories.map(c => (
                        <div key={c.id} className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-red-200 transition-all">
                            <span className="font-black text-gray-700 text-sm uppercase tracking-widest">{c.name}</span>
                            <button onClick={() => deleteCategory(c.id)} className="p-3 text-red-300 hover:text-red-600 transition-colors"><Trash2 size={18}/></button>
                        </div>
                      ))
                    )}
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'products' && (
           <div className="space-y-6 animate-slide-in">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-gray-900">Itens do Cardápio</h2>
                <button onClick={() => setEditingProduct({ id: `temp-${Date.now()}`, name: '', description: '', price: 0, image: '', categoryId: categories[0]?.id || '', extras: [], active: true })} className="bg-red-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-lg shadow-red-200"><Plus size={16}/> NOVO PRODUTO</button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                 {products.map(p => (
                   <div key={p.id} className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-6 group">
                      <div className="relative shrink-0 w-20 h-20 overflow-hidden rounded-2xl">
                        <img src={p.image || 'https://via.placeholder.com/150'} className={`w-full h-full object-cover ${!p.active && 'grayscale'}`} />
                        {p.isDailySuggestion && <div className="absolute top-1 right-1 bg-amber-400 text-white p-1 rounded-full shadow-lg"><Star size={10} fill="currentColor"/></div>}
                      </div>
                      <div className="flex-1">
                         <h4 className="font-black text-gray-900 text-lg leading-tight">{p.name}</h4>
                         <p className="text-red-600 font-black text-sm">R$ {p.price.toFixed(2)}</p>
                         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{categories.find(c => c.id === p.categoryId)?.name || 'Sem Categoria'}</span>
                      </div>
                      <div className="flex gap-2">
                         <button onClick={() => setEditingProduct(p)} className="p-3 bg-gray-50 text-gray-600 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-colors"><Edit3 size={18}/></button>
                         <button onClick={() => deleteProduct(p.id)} className="p-3 bg-gray-50 text-gray-600 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 size={18}/></button>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        )}

        {activeTab === 'hours' && (
          <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm space-y-6 animate-slide-in">
             <h3 className="font-black text-gray-900 flex items-center gap-2 text-xl"><Clock className="text-red-600"/> Horários da Silvia</h3>
             <div className="space-y-3">
                {displayHours.map((h, i) => (
                   <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-gray-200 transition-all">
                      <span className="font-black text-gray-700 w-24 text-sm">{h.day}</span>
                      <div className="flex items-center gap-2">
                         <input type="time" title="Abre" className="bg-white border-2 border-gray-200 rounded-lg p-1.5 text-xs font-black outline-none focus:border-red-600" value={h.open} onChange={e => {
                            const nh = [...displayHours];
                            nh[i].open = e.target.value;
                            setSettings(prev => ({...prev, businessHours: nh}));
                         }} />
                         <span className="font-black text-gray-300">-</span>
                         <input type="time" title="Fecha" className="bg-white border-2 border-gray-200 rounded-lg p-1.5 text-xs font-black outline-none focus:border-red-600" value={h.close} onChange={e => {
                            const nh = [...displayHours];
                            nh[i].close = e.target.value;
                            setSettings(prev => ({...prev, businessHours: nh}));
                         }} />
                      </div>
                      <button onClick={() => {
                        const nh = [...displayHours];
                        nh[i].isOpen = !nh[i].isOpen;
                        setSettings(prev => ({...prev, businessHours: nh}));
                      }} className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase transition-all shadow-sm ${h.isOpen ? 'bg-green-100 text-green-600 border border-green-200' : 'bg-red-100 text-red-600 border border-red-200'}`}>
                        {h.isOpen ? 'ABERTO' : 'FECHADO'}
                      </button>
                   </div>
                ))}
             </div>
             <button onClick={handleSaveSettings} disabled={isSaving} className="w-full bg-zinc-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest mt-4 hover:bg-black transition-all shadow-xl disabled:opacity-50">
               {isSaving ? 'SALVANDO...' : 'SALVAR HORÁRIOS'}
             </button>
          </div>
        )}

        {activeTab === 'settings' && (
           <div className="space-y-8 animate-slide-in">
              <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
                 <h3 className="text-xl font-black text-gray-900 flex items-center gap-2"><ImageIcon className="text-red-600"/> Identidade e Taxas</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex flex-col items-center gap-4">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Logo</p>
                       <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-50 relative group bg-gray-100 shadow-inner">
                          <img src={settings.logo} className="w-full h-full object-cover" alt="Preview Logo" />
                          <button onClick={() => logoInputRef.current?.click()} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"><Camera size={32}/></button>
                       </div>
                       <input type="file" hidden ref={logoInputRef} accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
                    </div>
                    <div className="flex flex-col items-center gap-4">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Banner</p>
                       <div className="w-full h-32 rounded-[28px] overflow-hidden border-4 border-gray-50 relative group bg-gray-100 shadow-inner">
                          <img src={settings.banner} className="w-full h-full object-cover" alt="Preview Banner" />
                          <button onClick={() => bannerInputRef.current?.click()} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"><Camera size={32}/></button>
                       </div>
                       <input type="file" hidden ref={bannerInputRef} accept="image/*" onChange={(e) => handleFileUpload(e, 'banner')} />
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Taxa de Entrega (R$)</label>
                       <div className="relative">
                          <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18}/>
                          <input type="number" step="0.50" className="w-full pl-12 pr-6 py-5 bg-gray-50 border-2 border-transparent focus:border-red-600 rounded-[28px] outline-none font-bold" value={settings.deliveryFee} onChange={e => setSettings(prev => ({...prev, deliveryFee: Number(e.target.value)}))} />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">WhatsApp (Apenas Números)</label>
                       <input type="text" className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-red-600 rounded-[28px] outline-none font-bold" value={settings.whatsapp} onChange={e => setSettings(prev => ({...prev, whatsapp: e.target.value}))} />
                    </div>
                 </div>
              </div>
              <button disabled={isSaving} onClick={handleSaveSettings} className="w-full bg-red-600 text-white py-6 rounded-[32px] font-black shadow-xl shadow-red-100 uppercase tracking-widest hover:bg-red-700 transition-all">
                {isSaving ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
              </button>
           </div>
        )}
      </main>

      {editingProduct && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-in">
              <div className="p-8 border-b flex justify-between items-center bg-gray-50">
                 <h3 className="text-2xl font-black text-gray-900">{editingProduct.id.startsWith('temp-') ? 'Novo' : 'Editar'}</h3>
                 <button onClick={() => setEditingProduct(null)} className="p-2 bg-white rounded-xl shadow-sm"><X/></button>
              </div>
              <form onSubmit={handleProductSubmit} className="p-8 overflow-y-auto space-y-6 custom-scrollbar">
                 <div className="flex flex-col items-center gap-4 border-b pb-6">
                    <div onClick={() => fileInputRef.current?.click()} className="w-48 h-48 rounded-[32px] overflow-hidden border-4 border-white shadow-2xl bg-gray-50 relative group cursor-pointer">
                       <img src={editingProduct.image || 'https://via.placeholder.com/300?text=Sem+Foto'} className="w-full h-full object-cover" alt="Produto" />
                       <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Upload size={40} className="text-white"/></div>
                    </div>
                    <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={(e) => handleFileUpload(e, 'product')} />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input type="text" required placeholder="Nome" className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-red-600 outline-none font-bold" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
                    <input type="number" step="0.01" required placeholder="Preço" className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-red-600 outline-none font-bold" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})} />
                 </div>
                 <textarea placeholder="Descrição" className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-red-600 outline-none font-medium h-24" value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} />
                 <select className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-red-600 outline-none font-bold" value={editingProduct.categoryId} onChange={e => setEditingProduct({...editingProduct, categoryId: e.target.value})}>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>

                 <div className="space-y-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                       <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Extras deste Produto</h4>
                       <button type="button" onClick={() => setEditingProduct({...editingProduct, extras: [...editingProduct.extras, { id: Math.random().toString(36).substr(2, 9), name: '', price: 0 }]})} className="text-red-600 font-black text-[10px] border border-red-200 px-3 py-1 rounded-full">+ ADD EXTRA</button>
                    </div>
                    <div className="space-y-2">
                       {editingProduct.extras.map((ex, idx) => (
                         <div key={ex.id} className="flex gap-2">
                            <input type="text" placeholder="Nome" className="flex-1 p-3 bg-gray-50 rounded-xl outline-none font-bold text-xs" value={ex.name} onChange={e => {
                               const ne = [...editingProduct.extras];
                               ne[idx].name = e.target.value;
                               setEditingProduct({...editingProduct, extras: ne});
                            }} />
                            <input type="number" step="0.01" placeholder="R$" className="w-24 p-3 bg-gray-50 rounded-xl outline-none font-bold text-xs" value={ex.price} onChange={e => {
                               const ne = [...editingProduct.extras];
                               ne[idx].price = Number(e.target.value);
                               setEditingProduct({...editingProduct, extras: ne});
                            }} />
                            <button type="button" onClick={() => setEditingProduct({...editingProduct, extras: editingProduct.extras.filter((_, i) => i !== idx)})} className="p-3 text-red-300 hover:text-red-600 transition-colors"><Trash2 size={16}/></button>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="flex gap-4 pt-4 border-t">
                    <label className="flex-1 flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-2xl cursor-pointer">
                       <input type="checkbox" className="w-6 h-6 rounded-lg text-red-600" checked={editingProduct.active} onChange={e => setEditingProduct({...editingProduct, active: e.target.checked})} />
                       <span className="font-black text-xs uppercase tracking-widest text-gray-600">Disponível</span>
                    </label>
                    <label className="flex-1 flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-2xl cursor-pointer">
                       <input type="checkbox" className="w-6 h-6 rounded-lg text-amber-500" checked={editingProduct.isDailySuggestion} onChange={e => setEditingProduct({...editingProduct, isDailySuggestion: e.target.checked})} />
                       <span className="font-black text-xs uppercase tracking-widest text-gray-600">Sugestão</span>
                    </label>
                 </div>
              </form>
              <div className="p-8 border-t bg-gray-50">
                 <button type="submit" disabled={isSaving} onClick={handleProductSubmit} className="w-full bg-red-600 text-white py-5 rounded-[28px] font-black shadow-xl uppercase tracking-widest">SALVAR PRODUTO</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
