
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowLeft, Settings, Tag, Store, Camera, Save, BarChart3, Wifi, WifiOff, X } from 'lucide-react';
import { AppSettings, Category, Product } from '../types';
import { ADMIN_PASSWORD } from '../constants';
import { supabase } from '../lib/supabase';

const AdminDashboard = ({ settings, setSettings, categories, setCategories, products, setProducts, onClose, isAdminLoggedIn, setIsAdminLoggedIn }: any) => {
  const [pass, setPass] = useState('');
  const [tab, setTab] = useState('sales');
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const check = async () => {
      const { error } = await supabase.from('settings').select('id').limit(1);
      setIsOnline(!error);
    };
    check();
  }, []);

  const save = async (table: string, data: any) => {
    setLoading(true);
    try {
      const { error } = table === 'settings' 
        ? await supabase.from('settings').upsert({ id: 1, data }) 
        : await supabase.from(table).upsert(data, { onConflict: 'id' });
      if (error) throw error;
      alert("✅ Silvia, salvo com sucesso!");
    } catch (e) { 
      console.error(e);
      alert("❌ Erro ao salvar no banco. Verifique sua internet."); 
    }
    setLoading(false);
  };

  const upload = (e: any, cb: any) => {
    const f = e.target.files?.[0];
    if (f) {
      const r = new FileReader();
      r.onloadend = () => cb(r.result);
      r.readAsDataURL(f);
    }
  };

  if (!isAdminLoggedIn) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-6">
      <div className="bg-white p-10 rounded-[40px] w-full max-w-sm text-center border-t-[10px] border-red-600 shadow-2xl">
        <Settings className="mx-auto text-red-600 mb-6" size={48}/>
        <h2 className="text-3xl font-black mb-2 italic">Painel Silvia</h2>
        <p className="text-gray-400 text-xs font-bold mb-8 uppercase tracking-widest">Kones Gourmet</p>
        <input type="password" className="w-full p-5 bg-gray-50 border-2 rounded-2xl mb-5 text-center text-3xl tracking-widest focus:border-red-600 outline-none transition" placeholder="****" value={pass} onChange={e => setPass(e.target.value)} />
        <button onClick={() => pass.trim() === ADMIN_PASSWORD ? setIsAdminLoggedIn(true) : alert("Senha Incorreta!")} className="w-full bg-red-600 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-red-700 transition active:scale-95 uppercase tracking-widest">Acessar</button>
        <button onClick={onClose} className="text-gray-400 mt-6 text-sm font-bold block mx-auto hover:text-gray-600">Voltar para a Loja</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-['Inter']">
      <header className="bg-zinc-900 text-white p-5 flex justify-between items-center sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition"><ArrowLeft size={22}/></button>
          <div>
            <span className="font-black text-xs uppercase block">Administração</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isOnline ? <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> : <div className="w-2 h-2 bg-red-500 rounded-full" />}
              <span className="text-[9px] font-black uppercase text-gray-400">{isOnline ? 'Online' : 'Desconectada'}</span>
            </div>
          </div>
        </div>
        <div className="flex bg-zinc-800 p-1 rounded-xl">
          {['sales', 'categories', 'products', 'store'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${tab === t ? 'bg-red-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>
              {t === 'sales' ? 'Vendas' : t === 'categories' ? 'Cat' : t === 'products' ? 'Prod' : 'Loja'}
            </button>
          ))}
        </div>
      </header>

      <main className="p-5 max-w-2xl mx-auto w-full flex-1 pb-24 space-y-6">
        {tab === 'sales' && (
          <div className="animate-slide-in space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-7 rounded-[32px] border text-center shadow-sm"><p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter mb-1">Faturamento Hoje</p><p className="text-3xl font-black text-zinc-800">R$ 450</p></div>
              <div className="bg-white p-7 rounded-[32px] border text-center shadow-sm"><p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter mb-1">Total do Mês</p><p className="text-3xl font-black text-red-600">R$ 12.400</p></div>
            </div>
            <div className="bg-white p-8 rounded-[40px] border shadow-sm">
              <h3 className="font-black mb-6 flex items-center gap-3 text-zinc-800"><BarChart3 size={20} className="text-red-600"/> Produtos Favoritos</h3>
              <div className="space-y-3">
                {[{n:'Kone Frango Catupiry', s:124}, {n:'Kone Nutella c/ Morango', s:98}].map((p, i) => (
                  <div key={i} className="flex justify-between text-sm p-4 bg-gray-50 rounded-2xl font-bold border border-gray-100 items-center">
                    <span className="text-gray-700">{p.n}</span>
                    <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-black">{p.s} vendas</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'store' && (
          <div className="bg-white p-8 rounded-[40px] border shadow-sm space-y-8 animate-slide-in">
            <div className="flex gap-6 items-center justify-center">
              <div className="relative w-24 h-24 shrink-0 group">
                <img src={settings.logo} className="w-full h-full rounded-[24px] object-cover border-4 border-gray-50 shadow-md" />
                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-[24px] flex items-center justify-center cursor-pointer"><Camera size={20} className="text-white"/><input type="file" className="hidden" accept="image/*" onChange={e => upload(e, (b:any) => setSettings({...settings, logo:b}))}/></label>
                <span className="text-[8px] font-black absolute -bottom-5 left-1/2 -translate-x-1/2 uppercase text-gray-400">Logo</span>
              </div>
              <div className="relative flex-1 h-24 group">
                <img src={settings.banner} className="w-full h-full rounded-[24px] object-cover border-4 border-gray-50 shadow-md" />
                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-[24px] flex items-center justify-center cursor-pointer"><Camera size={20} className="text-white"/><input type="file" className="hidden" accept="image/*" onChange={e => upload(e, (b:any) => setSettings({...settings, banner:b}))}/></label>
                <span className="text-[8px] font-black absolute -bottom-5 left-1/2 -translate-x-1/2 uppercase text-gray-400">Banner</span>
              </div>
            </div>
            <div className="space-y-4 pt-4">
              <input className="w-full p-5 bg-gray-50 rounded-2xl font-black border-2 focus:border-red-600 outline-none transition" value={settings.storeName} onChange={e => setSettings({...settings, storeName: e.target.value})} placeholder="Nome da Loja" />
              <div className="flex items-center bg-gray-50 rounded-2xl border-2 px-5 py-4 focus-within:border-red-600 transition">
                <span className="font-black text-gray-400 mr-2">R$</span>
                <input type="number" className="bg-transparent font-black w-full outline-none" value={settings.deliveryFee} onChange={e => setSettings({...settings, deliveryFee: parseFloat(e.target.value)})} placeholder="Taxa de Entrega" />
              </div>
            </div>
            <button onClick={() => save('settings', settings)} disabled={loading} className="w-full bg-red-600 text-white py-5 rounded-[24px] font-black uppercase shadow-xl hover:bg-red-700 transition flex items-center justify-center gap-3">
              <Save size={20}/> {loading ? 'SALVANDO...' : 'SALVAR CONFIGURAÇÕES'}
            </button>
          </div>
        )}

        {tab === 'categories' && (
          <div className="space-y-5 animate-slide-in">
            <button onClick={() => setCategories([...categories, {id: Math.random().toString(), name: 'Nova Categoria', globalExtras: []}])} className="bg-green-600 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase shadow-md flex items-center gap-2 hover:bg-green-700 transition">+ NOVA CATEGORIA</button>
            {categories.map((c: any, i: number) => (
              <div key={c.id} className="bg-white p-7 rounded-[32px] border shadow-sm space-y-5">
                <div className="flex gap-4 items-center">
                  <Tag className="text-red-600" size={20}/>
                  <input className="flex-1 font-black text-xl outline-none" value={c.name} onChange={e => { const nc = [...categories]; nc[i].name = e.target.value; setCategories(nc); }} />
                  <button onClick={() => setCategories(categories.filter((x:any)=>x.id!==c.id))} className="p-2 text-gray-300 hover:text-red-600 transition"><Trash2 size={20}/></button>
                </div>
                <div className="bg-gray-50 p-5 rounded-2xl space-y-4 border border-gray-100">
                  <div className="flex justify-between items-center"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Adicionais Padrão</span><button onClick={() => { const nc = [...categories]; nc[i].globalExtras = [...(nc[i].globalExtras || []), {id: Math.random().toString(), name: 'Novo', price: 0}]; setCategories(nc); }} className="text-red-600 font-black text-[10px] bg-red-50 px-3 py-1.5 rounded-full hover:bg-red-100 transition">+ ADICIONAR</button></div>
                  {c.globalExtras?.map((ex:any, ei:number) => (
                    <div key={ex.id} className="flex gap-3 bg-white p-3 rounded-xl border border-gray-200 items-center">
                      <input className="flex-1 text-xs font-bold outline-none" value={ex.name} onChange={e => { const nc = [...categories]; nc[i].globalExtras[ei].name = e.target.value; setCategories(nc); }} />
                      <input type="number" className="w-16 text-xs font-black text-red-600 text-right outline-none" value={ex.price} onChange={e => { const nc = [...categories]; nc[i].globalExtras[ei].price = parseFloat(e.target.value); setCategories(nc); }} />
                      {/* Fixed: Added missing X component import */}
                      <button onClick={() => { const nc = [...categories]; nc[i].globalExtras = nc[i].globalExtras.filter((x:any)=>x.id!==ex.id); setCategories(nc); }} className="text-gray-300"><X size={14}/></button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={() => save('categories', categories)} className="w-full bg-red-600 text-white py-5 rounded-[24px] font-black uppercase shadow-xl hover:bg-red-700 transition">SALVAR TODAS AS CATEGORIAS</button>
          </div>
        )}

        {tab === 'products' && (
          <div className="space-y-5 animate-slide-in">
            <button onClick={() => setProducts([...products, {id: Math.random().toString(), name: 'Kone', description: '', price: 0, image: 'https://picsum.photos/400/400', categoryId: categories[0]?.id, extras: [], active: true}])} className="bg-green-600 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase shadow-md flex items-center gap-2 hover:bg-green-700 transition">+ NOVO PRODUTO</button>
            {products.map((p: any, i: number) => (
              <div key={p.id} className="bg-white p-6 rounded-[32px] border shadow-sm flex flex-col md:flex-row gap-6 relative group">
                <div className="relative w-32 h-32 shrink-0 mx-auto group">
                  <img src={p.image} className="w-full h-full rounded-[24px] object-cover border-4 border-gray-50 shadow-inner" />
                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-[24px] flex items-center justify-center cursor-pointer"><Camera size={24} className="text-white"/><input type="file" className="hidden" accept="image/*" onChange={e => upload(e, (b:any) => { const np = [...products]; np[i].image = b; setProducts(np); })}/></label>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input className="w-full font-black text-lg outline-none bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-red-600/20" value={p.name} onChange={e => { const np = [...products]; np[i].name = e.target.value; setProducts(np); }} placeholder="Nome do Produto" />
                    <div className="flex items-center bg-gray-50 rounded-2xl border-2 border-transparent focus-within:border-red-600/20 px-4">
                      <span className="font-black text-red-600 mr-2">R$</span>
                      <input type="number" className="font-black w-full outline-none bg-transparent py-4" value={p.price} onChange={e => { const np = [...products]; np[i].price = parseFloat(e.target.value); setProducts(np); }} />
                    </div>
                  </div>
                  <textarea className="w-full text-sm text-gray-500 h-24 bg-gray-50 p-4 rounded-2xl outline-none border-2 border-transparent focus:border-red-600/20 resize-none leading-relaxed" value={p.description} onChange={e => { const np = [...products]; np[i].description = e.target.value; setProducts(np); }} placeholder="Descrição detalhada do Kone..." />
                </div>
                <button onClick={() => setProducts(products.filter((x:any)=>x.id!==p.id))} className="p-3 text-red-100 hover:text-red-600 hover:bg-red-50 rounded-2xl transition self-center"><Trash2 size={24}/></button>
              </div>
            ))}
            <button onClick={() => save('products', products)} className="w-full bg-red-600 text-white py-5 rounded-[24px] font-black uppercase shadow-xl hover:bg-red-700 transition">SALVAR TODOS OS PRODUTOS</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
