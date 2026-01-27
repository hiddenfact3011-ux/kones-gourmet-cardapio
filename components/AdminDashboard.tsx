
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Save, Plus, Trash2, Camera, ArrowLeft, Settings as SettingsIcon, Tag, Package, Copy, Check, Layout, ShieldAlert, BarChart3, Clock, Eye, EyeOff, Star, TrendingUp, Users, ShoppingBag, Edit3, Image as ImageIcon, RotateCcw, Upload, Layers, DollarSign, ExternalLink, Share2 } from 'lucide-react';
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
  const [linkCopied, setLinkCopied] = useState(false);
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [statsData, setStatsData] = useState({ visits: 0, history: [] as any[] });

  useEffect(() => {
    const saved = localStorage.getItem('kones_stats_v2');
    if (saved) setStatsData(JSON.parse(saved));
  }, []);

  const copyStoreLink = () => {
    // Detecta automaticamente a URL que está no navegador agora
    const url = window.location.origin;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

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

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    setIsSaving(true);
    try {
      const { data, error } = await supabase.from('categories').insert([{ name }]).select();
      if (error) throw error;
      const { data: list } = await supabase.from('categories').select('*').order('name');
      if (list) {
        setCategories(list);
        setNewCategoryName('');
      }
    } catch (err: any) {
      alert("Erro ao salvar categoria.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCategory = async (id: string) => {
    if (!editingCategoryName.trim()) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('categories').update({ name: editingCategoryName }).eq('id', id);
      if (error) throw error;
      setCategories(prev => prev.map(c => c.id === id ? { ...c, name: editingCategoryName } : c));
      setEditingCategoryId(null);
      setEditingCategoryName('');
    } catch (err) {
      alert("Erro ao editar categoria.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Excluir esta categoria? Isso pode afetar os produtos nela.')) return;
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err: any) { 
      alert('Erro ao excluir.'); 
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const finalSettings = {
        ...settings,
        businessHours: settings.businessHours || DEFAULT_SETTINGS.businessHours
      };
      const { error } = await supabase.from('settings').upsert({ id: 1, data: finalSettings });
      if (error) throw error;
      setSettings(finalSettings);
      alert("Configurações salvas!");
    } catch (err: any) {
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
      alert('Produto salvo!');
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
             {/* Card do Link de Compartilhamento - Agora mais destacado */}
             <div className="bg-ifood p-8 rounded-[40px] text-white shadow-2xl shadow-red-200 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform">
                   <Share2 size={120} />
                </div>
                <div className="relative z-10 space-y-6">
                   <div>
                      <h3 className="text-xl font-black uppercase tracking-widest">Link do seu Cardápio</h3>
                      <p className="text-sm opacity-90 font-medium">Este é o endereço que você deve enviar para os clientes:</p>
                   </div>
                   <div className="flex flex-col gap-4">
                      <div className="bg-white/20 backdrop-blur-xl rounded-[24px] p-6 font-black text-lg break-all text-center border border-white/30">
                         {window.location.origin}
                      </div>
                      <button 
                        onClick={copyStoreLink}
                        className="bg-white text-ifood font-black px-8 py-5 rounded-[24px] flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl"
                      >
                         {linkCopied ? <Check size={24} strokeWidth={3}/> : <Copy size={24} strokeWidth={3}/>}
                         {linkCopied ? 'COPIADO COM SUCESSO!' : 'COPIAR LINK PARA WHATSAPP'}
                      </button>
                   </div>
                </div>
             </div>

             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-gray-900">Desempenho Atual</h2>
                <button onClick={resetStats} className="text-xs font-black text-red-600 bg-red-50 px-4 py-2 rounded-xl">LIMPAR DADOS</button>
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
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pt-4">Visitas</p>
                   <p className="text-2xl font-black text-gray-900">{dashboardStats.visits}</p>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pt-4">Destaque</p>
                   <p className="text-sm font-black text-gray-900 truncate">{dashboardStats.topProduct?.name || '---'}</p>
                </div>
             </div>
          </div>
        )}

        {/* Outras abas permanecem iguais */}
        {activeTab === 'categories' && (
           <div className="space-y-8 animate-slide-in">
              <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                 <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2"><Layers className="text-red-600"/> Gerenciar Categorias</h3>
                 <div className="flex gap-2 mb-10">
                    <input type="text" placeholder="Ex: Bebidas, Sobremesas..." className="flex-1 p-5 bg-gray-50 border-2 border-transparent focus:border-red-600 rounded-[24px] outline-none font-bold" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} />
                    <button onClick={handleAddCategory} disabled={isSaving || !newCategoryName.trim()} className="bg-red-600 text-white px-8 rounded-[24px] font-black text-xs uppercase disabled:opacity-50">
                      {isSaving ? '...' : 'ADD'}
                    </button>
                 </div>
                 <div className="space-y-2">
                    {categories.map(c => (
                      <div key={c.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                          {editingCategoryId === c.id ? (
                            <div className="flex-1 flex gap-2">
                               <input type="text" className="flex-1 p-2 bg-white border border-red-600 rounded-lg outline-none font-bold text-sm" value={editingCategoryName} onChange={e => setEditingCategoryName(e.target.value)} autoFocus />
                               <button onClick={() => handleEditCategory(c.id)} className="p-2 bg-green-500 text-white rounded-lg"><Check size={18}/></button>
                               <button onClick={() => setEditingCategoryId(null)} className="p-2 bg-gray-300 text-white rounded-lg"><X size={18}/></button>
                            </div>
                          ) : (
                            <>
                              <span className="font-black text-gray-700 text-sm uppercase tracking-widest">{c.name}</span>
                              <div className="flex gap-1">
                                <button onClick={() => { setEditingCategoryId(c.id); setEditingCategoryName(c.name); }} className="p-2 text-gray-400 hover:text-blue-600"><Edit3 size={18}/></button>
                                <button onClick={() => deleteCategory(c.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={18}/></button>
                              </div>
                            </>
                          )}
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        )}

        {/* Produtos, Horários e Design permanecem como estão */}
        {activeTab === 'products' && (
           <div className="space-y-6 animate-slide-in">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-gray-900">Seu Cardápio</h2>
                <button onClick={() => setEditingProduct({ id: `temp-${Date.now()}`, name: '', description: '', price: 0, image: '', categoryId: categories[0]?.id || '', extras: [], active: true })} className="bg-red-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-lg shadow-red-200"><Plus size={16}/> NOVO ITEM</button>
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
      </main>
      {/* ... restante do código de modais ... */}
    </div>
  );
};

export default AdminDashboard;