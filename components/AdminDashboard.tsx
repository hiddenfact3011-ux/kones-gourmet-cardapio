
import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Camera, ArrowLeft, Settings as SettingsIcon, Tag, Package, Copy, Check, PlusCircle, AlertTriangle, Database, Wifi, WifiOff, ExternalLink, Info, Code, Rocket, Eye, Sparkles } from 'lucide-react';
import { AppSettings, Category, Product, Extra } from '../types';
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

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  settings, setSettings, categories, setCategories, products, setProducts, onClose, isAdminLoggedIn, setIsAdminLoggedIn 
}) => {
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'settings' | 'categories' | 'products' | 'setup'>('settings');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [copied, setCopied] = useState(false);
  const [dbStatus, setDbStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const { error } = await supabase.from('settings').select('id').limit(1);
      if (error) throw error;
      setDbStatus('online');
    } catch (e) {
      setDbStatus('offline');
    }
  };

  const currentUrl = window.location.origin + window.location.pathname;
  const isDevelopment = currentUrl.includes('webcontainer') || currentUrl.includes('stackblitz') || currentUrl.includes('localhost');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) setIsAdminLoggedIn(true);
    else alert('Senha incorreta! Use: 2707');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveSettings = async (newSettings: AppSettings) => {
    setIsSaving(true);
    try {
      setSettings(newSettings);
      const { error } = await supabase.from('settings').upsert({ id: 1, data: newSettings });
      if (error) throw error;
      alert("Configurações salvas com sucesso!");
    } catch (err: any) {
      alert("Erro ao salvar no banco: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const saveProduct = async (prod: Product) => {
    setIsSaving(true);
    try {
      const isNew = !products.find(p => p.id === prod.id);
      if (isNew) {
        const { data, error } = await supabase.from('products').insert([prod]).select();
        if (error) throw error;
        if (data) setProducts([...products, data[0]]);
      } else {
        const { error } = await supabase.from('products').update(prod).eq('id', prod.id);
        if (error) throw error;
        setProducts(products.map(p => p.id === prod.id ? prod : p));
      }
      setEditingProduct(null);
    } catch (err: any) {
      alert("Erro ao salvar produto: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (confirm('Excluir este produto permanentemente?')) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) setProducts(products.filter(p => p.id !== id));
    }
  };

  const addCategory = async (name: string) => {
    const newCat = { id: Math.random().toString(36).substr(2, 9), name };
    const { error } = await supabase.from('categories').insert([newCat]);
    if (!error) setCategories([...categories, newCat]);
  };

  const deleteCategory = async (id: string) => {
    if (confirm('Excluir categoria?')) {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (!error) setCategories(categories.filter(c => c.id !== id));
    }
  };

  const addExtra = () => {
    if (!editingProduct) return;
    const newExtra: Extra = { id: Math.random().toString(36).substr(2, 9), name: '', price: 0 };
    setEditingProduct({
      ...editingProduct,
      extras: [...(editingProduct.extras || []), newExtra]
    });
  };

  const updateExtra = (id: string, field: keyof Extra, value: string | number) => {
    if (!editingProduct) return;
    const newExtras = (editingProduct.extras || []).map(e => 
      e.id === id ? { ...e, [field]: value } : e
    );
    setEditingProduct({ ...editingProduct, extras: newExtras });
  };

  const removeExtra = (id: string) => {
    if (!editingProduct) return;
    const newExtras = (editingProduct.extras || []).filter(e => e.id !== id);
    setEditingProduct({ ...editingProduct, extras: newExtras });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner' | 'prod') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (type === 'logo') setSettings({ ...settings, logo: base64 });
        if (type === 'banner') setSettings({ ...settings, banner: base64 });
        if (type === 'prod' && editingProduct) setEditingProduct({ ...editingProduct, image: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const sqlSetup = `CREATE TABLE IF NOT EXISTS settings (id integer primary key default 1, data jsonb);
CREATE TABLE IF NOT EXISTS categories (id text primary key, name text not null);
CREATE TABLE IF NOT EXISTS products (id text primary key, name text not null, description text, price float8, image text, categoryId text references categories(id), extras jsonb default '[]', active boolean default true);`;

  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
        <div className="bg-white p-10 rounded-[48px] shadow-2xl w-full max-w-md text-center border-t-[12px] border-red-600">
          <div className="mb-6 inline-flex p-4 bg-red-50 rounded-full text-red-600">
             <SettingsIcon size={48} />
          </div>
          <h2 className="text-3xl font-black mb-1 text-gray-900 leading-none">Painel Administrativo</h2>
          <p className="text-gray-400 mb-8 font-bold text-xs uppercase tracking-widest mt-2">Kones Gourmet</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" className="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl p-5 outline-none focus:border-red-600 transition text-center text-3xl tracking-[10px] font-black" placeholder="****" value={password} onChange={e => setPassword(e.target.value)} autoFocus />
            <button className="w-full bg-red-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-red-200 hover:bg-red-700 active:scale-95 transition-all text-lg uppercase tracking-widest">Acessar Sistema</button>
            <button type="button" onClick={onClose} className="text-gray-400 font-bold hover:text-red-600 text-sm">Voltar ao Cardápio</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="bg-black text-white p-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition"><ArrowLeft /></button>
          <div>
            <span className="font-black text-xl block leading-none">Administração</span>
            <div className="flex items-center gap-1.5 mt-1">
              <div className={`w-2 h-2 rounded-full ${dbStatus === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                Sincronização: {dbStatus === 'online' ? 'Ativa' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={onClose} className="bg-white/10 p-2 rounded-xl hover:bg-white/20 transition flex items-center gap-2 px-4 font-bold text-xs"><Eye size={16}/> Ver Loja</button>
            <button onClick={() => setIsAdminLoggedIn(false)} className="bg-red-600 px-6 py-2 rounded-xl font-bold text-sm hover:bg-red-700 transition">Sair</button>
        </div>
      </header>

      <nav className="flex border-b bg-white sticky top-[80px] z-40 overflow-x-auto hide-scrollbar">
        <button onClick={() => setActiveTab('settings')} className={`flex-1 p-5 font-black flex flex-col items-center gap-1 min-w-[100px] transition-all ${activeTab === 'settings' ? 'text-red-600 border-b-4 border-red-600 bg-red-50/30' : 'text-gray-300'}`}><SettingsIcon size={18} /> Geral</button>
        <button onClick={() => setActiveTab('categories')} className={`flex-1 p-5 font-black flex flex-col items-center gap-1 min-w-[100px] transition-all ${activeTab === 'categories' ? 'text-red-600 border-b-4 border-red-600 bg-red-50/30' : 'text-gray-300'}`}><Tag size={18} /> Categorias</button>
        <button onClick={() => setActiveTab('products')} className={`flex-1 p-5 font-black flex flex-col items-center gap-1 min-w-[100px] transition-all ${activeTab === 'products' ? 'text-red-600 border-b-4 border-red-600 bg-red-50/30' : 'text-gray-300'}`}><Package size={18} /> Produtos</button>
        <button onClick={() => setActiveTab('setup')} className={`flex-1 p-5 font-black flex flex-col items-center gap-1 min-w-[100px] transition-all ${activeTab === 'setup' ? 'text-blue-600 border-b-4 border-blue-600 bg-blue-50/30' : 'text-gray-300'}`}><Rocket size={18} /> Publicar</button>
      </nav>

      <main className="p-6 max-w-4xl mx-auto w-full flex-1 pb-24">
        {activeTab === 'setup' && (
          <div className="space-y-6 animate-slide-in">
             <div className="p-10 bg-gradient-to-br from-zinc-900 to-black text-white rounded-[48px] shadow-2xl relative overflow-hidden border-2 border-white/5">
                <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><Sparkles size={160} /></div>
                <h3 className="text-4xl font-black mb-6 flex items-center gap-3"><Sparkles className="text-yellow-400" /> Parabéns, Silvia!</h3>
                
                <p className="text-zinc-400 font-medium mb-10 leading-relaxed text-lg">
                  Sua loja <strong>{settings.storeName}</strong> está pronta para dominar o mercado! Agora é só espalhar o seu link oficial por aí.
                </p>

                <div className="bg-white/5 border border-white/10 p-8 rounded-[40px] space-y-6 relative z-10">
                   <p className="text-[11px] font-black text-red-500 uppercase tracking-[0.2em]">Seu Link de Vendas Profissional</p>
                   <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1 bg-black/60 p-5 rounded-[24px] border border-white/10 font-mono text-sm text-zinc-300 overflow-hidden text-ellipsis whitespace-nowrap flex items-center">
                         {currentUrl}
                      </div>
                      <button 
                        onClick={copyLink} 
                        className={`px-10 py-5 rounded-[24px] font-black flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl ${copied ? 'bg-green-600 text-white' : 'bg-white text-black hover:bg-zinc-200'}`}
                      >
                         {copied ? <Check size={24} /> : <Copy size={24}/>}
                         {copied ? 'Link Copiado!' : 'Copiar Link'}
                      </button>
                   </div>
                   {isDevelopment && (
                     <div className="flex items-center gap-2 text-amber-500 text-[10px] font-black uppercase mt-4 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                        <AlertTriangle size={14}/> Lembrete: Após criar o repositório no GitHub, você terá um link definitivo que nunca muda.
                     </div>
                   )}
                </div>

                <div className="mt-12 flex flex-col md:flex-row gap-4">
                    <a href={`https://wa.me/?text=${encodeURIComponent('Olá! Confira nosso novo cardápio digital: ' + currentUrl)}`} target="_blank" className="flex-1 bg-green-600 p-5 rounded-[28px] text-center font-black text-sm flex items-center justify-center gap-2 hover:bg-green-700 transition">
                        Compartilhar no WhatsApp
                    </a>
                    <button onClick={onClose} className="flex-1 bg-white/10 p-5 rounded-[28px] text-center font-black text-sm hover:bg-white/20 transition flex items-center justify-center gap-2">
                        <Eye size={18}/> Visualizar como Cliente
                    </button>
                </div>
             </div>

             <div className="p-8 border-2 border-blue-50 bg-blue-50/30 rounded-[40px] space-y-4">
                <div className="flex items-center gap-3 text-blue-800">
                   <Info size={28} />
                   <h3 className="font-black text-xl">Dica de Ouro</h3>
                </div>
                <p className="text-sm font-medium text-blue-700 leading-relaxed">
                  Coloque este link no campo <strong>"Site"</strong> do seu perfil do Instagram e mude a sua Bio para algo como: 
                  <em> "👇 Peça aqui os melhores Kones da região!"</em>. Isso aumenta muito as suas vendas!
                </p>
             </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8 animate-slide-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-3">
                <p className="font-black text-sm text-gray-700">Logo da Loja</p>
                <label className="block relative w-32 h-32 rounded-[32px] border-4 border-gray-100 overflow-hidden cursor-pointer hover:border-red-400 transition group shadow-md">
                  <img src={settings.logo} className="w-full h-full object-cover group-hover:opacity-40 transition" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><Camera className="text-red-600 w-8 h-8" /></div>
                  <input type="file" className="hidden" onChange={e => handleFileUpload(e, 'logo')} />
                </label>
              </div>
              <div className="space-y-3">
                <p className="font-black text-sm text-gray-700">Capa do Menu</p>
                <label className="block relative w-full h-32 rounded-[32px] border-4 border-gray-100 overflow-hidden cursor-pointer hover:border-red-400 transition group shadow-md">
                  <img src={settings.banner} className="w-full h-full object-cover group-hover:opacity-40 transition" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><Camera className="text-red-600 w-8 h-8" /></div>
                  <input type="file" className="hidden" onChange={e => handleFileUpload(e, 'banner')} />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="col-span-1 md:col-span-2">
                <label className="text-[10px] font-black text-gray-400 ml-2 uppercase tracking-widest">Nome do Estabelecimento</label>
                <input type="text" className="w-full p-4 bg-gray-50 rounded-2xl outline-none border-2 border-transparent focus:border-red-600 font-bold" value={settings.storeName} onChange={e => setSettings({...settings, storeName: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 ml-2 uppercase tracking-widest">WhatsApp (Ex: 64981324434)</label>
                <input type="text" className="w-full p-4 bg-gray-50 rounded-2xl outline-none border-2 border-transparent focus:border-red-600 font-bold" value={settings.whatsapp} onChange={e => setSettings({...settings, whatsapp: e.target.value.replace(/\D/g,'')})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 ml-2 uppercase tracking-widest">Taxa de Entrega (R$)</label>
                <input type="number" className="w-full p-4 bg-gray-50 rounded-2xl outline-none border-2 border-transparent focus:border-red-600 font-bold" value={settings.deliveryFee} onChange={e => setSettings({...settings, deliveryFee: Number(e.target.value)})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 ml-2 uppercase tracking-widest">Chave PIX</label>
                <input type="text" className="w-full p-4 bg-gray-50 rounded-2xl outline-none border-2 border-transparent focus:border-red-600 font-bold" value={settings.pixKey} onChange={e => setSettings({...settings, pixKey: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 ml-2 uppercase tracking-widest">Titular PIX</label>
                <input type="text" className="w-full p-4 bg-gray-50 rounded-2xl outline-none border-2 border-transparent focus:border-red-600 font-bold" value={settings.pixName} onChange={e => setSettings({...settings, pixName: e.target.value})} />
              </div>
            </div>
            
            <button 
              disabled={isSaving}
              onClick={() => saveSettings(settings)} 
              className="w-full bg-red-600 text-white py-6 rounded-[32px] font-black flex items-center justify-center gap-3 active:scale-95 transition-all shadow-2xl shadow-red-200 disabled:bg-gray-400"
            >
              {isSaving ? "Gravando..." : <><Save size={24} /> SALVAR ALTERAÇÕES GERAIS</>}
            </button>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-4 animate-slide-in">
            <div className="flex gap-2">
              <input id="newCat" type="text" placeholder="Nome da Categoria..." className="flex-1 p-4 bg-gray-50 rounded-2xl outline-none border-2 border-transparent focus:border-red-600 font-bold" />
              <button onClick={() => { const val = (document.getElementById('newCat') as HTMLInputElement).value; if(val) { addCategory(val); (document.getElementById('newCat') as HTMLInputElement).value = ''; } }} className="bg-red-600 text-white px-8 rounded-2xl font-black shadow-lg shadow-red-100 active:scale-95 transition">Add</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {categories.map(c => (
                <div key={c.id} className="flex justify-between items-center p-5 bg-white rounded-3xl border-2 border-gray-50 shadow-sm group hover:border-red-100 transition">
                  <span className="font-black text-gray-700">{c.name}</span>
                  <button onClick={() => deleteCategory(c.id)} className="text-red-600 p-2 hover:bg-red-50 rounded-xl transition md:opacity-0 group-hover:opacity-100"><Trash2 size={20} /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6 animate-slide-in">
            <button onClick={() => setEditingProduct({ id: Math.random().toString(36).substr(2, 9), name: '', description: '', price: 0, image: 'https://via.placeholder.com/300', categoryId: categories[0]?.id || '', extras: [], active: true })} className="w-full bg-green-600 text-white py-6 rounded-[32px] font-black shadow-xl shadow-green-100 flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-green-700">
              <Plus size={28} /> Novo Produto
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map(p => (
                <div key={p.id} className="p-4 border-2 border-gray-50 rounded-[32px] flex gap-4 items-center bg-white shadow-sm hover:shadow-lg transition cursor-default group">
                  <img src={p.image} className="w-20 h-20 rounded-[20px] object-cover border-2 border-gray-50 shadow-sm" />
                  <div className="flex-1">
                    <p className="font-black text-gray-800 leading-tight group-hover:text-red-600 transition">{p.name}</p>
                    <p className="text-sm font-black text-red-600 mt-1">R$ {p.price.toFixed(2)}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => setEditingProduct(p)} className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-red-600 hover:text-white transition shadow-sm"><SettingsIcon size={20} /></button>
                    <button onClick={() => deleteProduct(p.id)} className="p-3 bg-gray-50 text-gray-300 rounded-xl hover:bg-red-50 hover:text-red-600 transition shadow-sm"><Trash2 size={20} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {editingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-[48px] p-8 space-y-6 my-8 animate-slide-in relative border-t-[12px] border-red-600">
             <button onClick={() => setEditingProduct(null)} className="absolute top-6 right-6 p-3 bg-gray-100 rounded-full hover:rotate-90 transition-all"><X /></button>
             
             <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-1/2 space-y-4">
                  <label className="block relative aspect-square rounded-[40px] overflow-hidden border-4 border-gray-100 cursor-pointer group shadow-2xl">
                      <img src={editingProduct.image} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                        <Camera className="text-white w-12 h-12" />
                      </div>
                      <input type="file" className="hidden" onChange={e => handleFileUpload(e, 'prod')} />
                  </label>
                </div>

                <div className="flex-1 space-y-5">
                  <h3 className="text-3xl font-black text-gray-900 leading-none">Editar Produto</h3>
                  
                  <div className="space-y-4">
                    <input type="text" placeholder="Nome do Produto" className="w-full p-4 bg-gray-50 rounded-2xl outline-none border-2 border-transparent focus:border-red-600 font-bold" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
                    <textarea placeholder="Ingredientes..." className="w-full p-4 bg-gray-50 rounded-2xl outline-none h-24 border-2 border-transparent focus:border-red-600 text-sm font-medium" value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} />
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 ml-1 uppercase">Preço Venda</label>
                            <input type="number" step="0.01" className="w-full p-4 bg-gray-50 rounded-2xl outline-none border-2 border-transparent focus:border-red-600 font-black text-red-600" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 ml-1 uppercase">Categoria</label>
                            <select className="w-full p-4 bg-gray-50 rounded-2xl outline-none border-2 border-transparent focus:border-red-600 font-bold" value={editingProduct.categoryId} onChange={e => setEditingProduct({...editingProduct, categoryId: e.target.value})}>
                              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t-2 border-gray-50">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Opcionais</p>
                      <button onClick={addExtra} className="text-green-600 flex items-center gap-1 text-[10px] font-black hover:bg-green-50 px-2 py-1 rounded-lg transition border border-green-100"><PlusCircle size={12}/> ADICIONAR NOVO</button>
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {editingProduct.extras?.map((extra) => (
                        <div key={extra.id} className="flex gap-2 items-center">
                          <input type="text" placeholder="Nome" className="flex-1 p-3 bg-gray-50 border-2 border-transparent focus:border-red-200 rounded-xl text-xs font-bold" value={extra.name} onChange={e => updateExtra(extra.id, 'name', e.target.value)} />
                          <input type="number" placeholder="R$" className="w-20 p-3 bg-gray-50 border-2 border-transparent focus:border-red-200 rounded-xl text-xs font-black text-red-600" value={extra.price} onChange={e => updateExtra(extra.id, 'price', Number(e.target.value))} />
                          <button onClick={() => removeExtra(extra.id)} className="p-2 text-gray-300 hover:text-red-600 transition"><Trash2 size={16}/></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button 
                    disabled={isSaving}
                    onClick={() => saveProduct(editingProduct)} 
                    className="w-full bg-red-600 text-white py-5 rounded-[28px] font-black shadow-xl shadow-red-200 flex items-center justify-center gap-2 active:scale-95 transition-all text-lg"
                  >
                    {isSaving ? "Gravando..." : <><Save size={20} /> SALVAR PRODUTO</>}
                  </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
