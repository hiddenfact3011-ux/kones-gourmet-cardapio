
import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Camera, ArrowLeft, Settings as SettingsIcon, Tag, Package, Copy, Check, Layout, ShieldAlert, BarChart3, Clock, Eye, EyeOff, Star, TrendingUp, Users, ShoppingBag } from 'lucide-react';
import { AppSettings, Category, Product } from '../types';
import { ADMIN_PASSWORD } from '../constants';
import { supabase } from '../lib/supabase';

interface AdminDashboardProps {
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
  categories: Category[];
  setCategories: (c: Category[]) => void;
  products: Product[];
  setProducts: (p: Product[]) => void;
  onClose: () => void;
  isAdminLoggedIn: boolean;
  setIsAdminLoggedIn: (val: boolean) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ settings, setSettings, categories, setCategories, products, setProducts, onClose, isAdminLoggedIn, setIsAdminLoggedIn }) => {
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings' | 'categories' | 'products' | 'hours'>('dashboard');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) setIsAdminLoggedIn(true);
    else alert('Senha incorreta!');
  };

  const saveSettings = async (newSettings: AppSettings) => {
    setIsSaving(true);
    try {
      setSettings(newSettings);
      await supabase.from('settings').upsert({ id: 1, data: newSettings });
      alert("Sucesso!");
    } catch (err) { alert("Erro ao salvar"); } finally { setIsSaving(false); }
  };

  const toggleProductActive = async (product: Product) => {
    const updated = { ...product, active: !product.active };
    await supabase.from('products').update(updated).eq('id', product.id);
    setProducts(products.map(p => p.id === product.id ? updated : p));
  };

  const setDailySuggestion = async (productId: string) => {
    const updatedProds = products.map(p => ({ ...p, isDailySuggestion: p.id === productId }));
    for(const p of updatedProds) {
       await supabase.from('products').update(p).eq('id', p.id);
    }
    setProducts(updatedProds);
  };

  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
        <div className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-md text-center border-t-[12px] border-red-600">
          <SettingsIcon size={48} className="mx-auto text-red-600 mb-6"/>
          <h2 className="text-3xl font-black mb-8 text-gray-900">Admin</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" className="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl p-5 outline-none focus:border-red-600 text-center text-3xl tracking-[10px]" placeholder="****" value={password} onChange={e => setPassword(e.target.value)} autoFocus />
            <button className="w-full bg-red-600 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-red-700 transition-all uppercase tracking-widest">Acessar</button>
            <button type="button" onClick={onClose} className="text-gray-400 font-bold hover:text-red-600 text-sm">Voltar</button>
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
          <span className="font-black text-lg uppercase tracking-widest">Painel Kones</span>
        </div>
        <button onClick={() => setIsAdminLoggedIn(false)} className="bg-red-600 px-6 py-2 rounded-xl font-bold text-xs hover:bg-red-700 transition">SAIR</button>
      </header>

      <nav className="flex border-b bg-white sticky top-[80px] z-40 overflow-x-auto hide-scrollbar">
        <button onClick={() => setActiveTab('dashboard')} className={`flex-1 p-5 font-black flex flex-col items-center gap-1 min-w-[100px] transition-all text-[10px] uppercase tracking-widest ${activeTab === 'dashboard' ? 'text-red-600 border-b-4 border-red-600 bg-red-50/30' : 'text-gray-300'}`}><BarChart3 size={18} /> Resumo</button>
        <button onClick={() => setActiveTab('products')} className={`flex-1 p-5 font-black flex flex-col items-center gap-1 min-w-[100px] transition-all text-[10px] uppercase tracking-widest ${activeTab === 'products' ? 'text-red-600 border-b-4 border-red-600 bg-red-50/30' : 'text-gray-300'}`}><Package size={18} /> Itens</button>
        <button onClick={() => setActiveTab('hours')} className={`flex-1 p-5 font-black flex flex-col items-center gap-1 min-w-[100px] transition-all text-[10px] uppercase tracking-widest ${activeTab === 'hours' ? 'text-red-600 border-b-4 border-red-600 bg-red-50/30' : 'text-gray-300'}`}><Clock size={18} /> Horários</button>
        <button onClick={() => setActiveTab('settings')} className={`flex-1 p-5 font-black flex flex-col items-center gap-1 min-w-[100px] transition-all text-[10px] uppercase tracking-widest ${activeTab === 'settings' ? 'text-red-600 border-b-4 border-red-600 bg-red-50/30' : 'text-gray-300'}`}><SettingsIcon size={18} /> Loja</button>
      </nav>

      <main className="p-6 max-w-5xl mx-auto w-full flex-1 pb-24">
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-slide-in">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-1">
                   <div className="bg-blue-50 text-blue-500 w-10 h-10 rounded-full flex items-center justify-center"><TrendingUp size={20}/></div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pt-4">Vendas Hoje</p>
                   <p className="text-2xl font-black text-gray-900 leading-none">R$ 458,90</p>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-1">
                   <div className="bg-green-50 text-green-500 w-10 h-10 rounded-full flex items-center justify-center"><ShoppingBag size={20}/></div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pt-4">Pedidos</p>
                   <p className="text-2xl font-black text-gray-900 leading-none">12</p>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-1">
                   <div className="bg-purple-50 text-purple-500 w-10 h-10 rounded-full flex items-center justify-center"><Users size={20}/></div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pt-4">Visitas</p>
                   <p className="text-2xl font-black text-gray-900 leading-none">1.2k</p>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-1">
                   <div className="bg-amber-50 text-amber-500 w-10 h-10 rounded-full flex items-center justify-center"><Star size={20}/></div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pt-4">Ticket Médio</p>
                   <p className="text-2xl font-black text-gray-900 leading-none">R$ 38,24</p>
                </div>
             </div>

             <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2">🏆 Mais Vendidos</h3>
                <div className="space-y-4">
                   {products.slice(0, 3).map((p, idx) => (
                      <div key={p.id} className="flex items-center gap-4">
                         <span className="font-black text-red-600 text-lg w-6">#{idx+1}</span>
                         <img src={p.image} className="w-12 h-12 rounded-xl object-cover" />
                         <div className="flex-1">
                            <p className="font-bold text-sm text-gray-800">{p.name}</p>
                            <div className="h-1.5 w-full bg-gray-50 rounded-full mt-1 overflow-hidden">
                               <div className="h-full bg-red-600 rounded-full" style={{width: `${100 - (idx * 30)}%`}}></div>
                            </div>
                         </div>
                         <span className="font-black text-gray-400 text-xs">{(20 - idx * 5)} vds</span>
                      </div>
                   ))}
                </div>
             </div>

             <div className="bg-zinc-900 p-8 rounded-[40px] text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-5"><TrendingUp size={160}/></div>
                <h3 className="text-lg font-black mb-6 uppercase tracking-widest text-red-500">Desempenho Semanal</h3>
                <div className="flex items-end justify-between h-40 gap-2">
                   {[40, 60, 35, 90, 75, 55, 100].map((val, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                         <div className="w-full bg-red-600 rounded-t-xl transition-all duration-1000" style={{height: `${val}%`}}></div>
                         <span className="text-[8px] font-black text-zinc-500">SEG TER QUA QUI SEX SAB DOM'.split(' ')[i]</span>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'products' && (
           <div className="space-y-6 animate-slide-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {products.map(p => (
                   <div key={p.id} className={`bg-white p-4 rounded-3xl border-2 transition-all flex items-center gap-4 shadow-sm ${p.active ? 'border-gray-50' : 'border-red-100 bg-red-50/10'}`}>
                      <div className="relative">
                        <img src={p.image} className={`w-16 h-16 rounded-xl object-cover ${!p.active && 'grayscale'}`} />
                        {!p.active && <div className="absolute inset-0 bg-red-600/20 rounded-xl flex items-center justify-center"><EyeOff className="text-red-600" size={20}/></div>}
                      </div>
                      <div className="flex-1">
                         <h4 className={`font-black text-sm ${!p.active ? 'text-gray-400' : 'text-gray-800'}`}>{p.name}</h4>
                         <p className="text-red-600 font-black text-xs">R$ {p.price.toFixed(2)}</p>
                      </div>
                      <div className="flex gap-2">
                         <button onClick={() => setDailySuggestion(p.id)} className={`p-2 rounded-xl transition ${p.isDailySuggestion ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-300'}`} title="Sugestão do Dia"><Star size={16}/></button>
                         <button onClick={() => toggleProductActive(p)} className={`p-2 rounded-xl transition ${p.active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`} title={p.active ? 'Pausar no Cardápio' : 'Ativar no Cardápio'}>{p.active ? <Eye size={16}/> : <EyeOff size={16}/>}</button>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        )}

        {activeTab === 'hours' && (
          <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm space-y-6 animate-slide-in">
             <h3 className="font-black text-gray-900 flex items-center gap-2 text-xl"><Clock className="text-red-600"/> Horários de Funcionamento</h3>
             <div className="space-y-3">
                {settings.businessHours?.map((h, i) => (
                   <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <span className="font-black text-gray-700 w-24 text-sm">{h.day}</span>
                      <div className="flex items-center gap-2">
                         <input type="time" className="bg-white border-2 border-gray-200 rounded-lg p-1 text-xs font-bold" value={h.open} />
                         <span className="font-black text-gray-300">-</span>
                         <input type="time" className="bg-white border-2 border-gray-200 rounded-lg p-1 text-xs font-bold" value={h.close} />
                      </div>
                      <button onClick={() => {
                        const newHours = [...settings.businessHours!];
                        newHours[i].isOpen = !newHours[i].isOpen;
                        saveSettings({...settings, businessHours: newHours});
                      }} className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase transition-all ${h.isOpen ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{h.isOpen ? 'ABERTO' : 'FECHADO'}</button>
                   </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'settings' && (
           <div className="space-y-8 animate-slide-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Nome da Loja</p>
                    <input type="text" className="w-full p-5 bg-white border-2 border-gray-50 rounded-[28px] outline-none font-bold" value={settings.storeName} onChange={e => setSettings({...settings, storeName: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Taxa de Entrega (R$)</p>
                    <input type="number" className="w-full p-5 bg-white border-2 border-gray-50 rounded-[28px] outline-none font-bold" value={settings.deliveryFee} onChange={e => setSettings({...settings, deliveryFee: Number(e.target.value)})} />
                 </div>
              </div>
              <button disabled={isSaving} onClick={() => saveSettings(settings)} className="w-full bg-red-600 text-white py-6 rounded-[32px] font-black shadow-xl shadow-red-100 uppercase tracking-widest">Salvar Alterações</button>
           </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
