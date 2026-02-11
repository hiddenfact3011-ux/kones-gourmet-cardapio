
import React, { useState } from 'react';
import { Plus, Trash2, ArrowLeft, Settings, Tag, Store, Camera, Save, BarChart3, Star, CheckCircle2, X, TrendingUp, Link, Copy, Package, LayoutDashboard, UtensilsCrossed, Clock } from 'lucide-react';
import { AppSettings, Category, Product, DaySchedule } from '../types';
import { ADMIN_PASSWORD } from '../constants';
import { supabase } from '../lib/supabase';

const AdminDashboard = ({ settings, setSettings, categories, setCategories, products, setProducts, onClose, isAdminLoggedIn, setIsAdminLoggedIn }: any) => {
  const [pass, setPass] = useState('');
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const OFFICIAL_URL = 'https://kones-gourmet-cardapio.vercel.app/';

  const generateId = () => Math.floor(Math.random() * 1000000).toString();

  const save = async (table: string, data: any) => {
    setLoading(true);
    try {
      let dataToSave = data;
      
      if (table === 'products') {
        dataToSave = data.map((p: any) => ({
          id: p.id,
          name: p.name || 'Sem nome',
          description: p.description || '',
          price: Number(p.price) || 0,
          image: p.image,
          categoryId: p.categoryId,
          extras: p.extras || [],
          active: p.active !== false
        }));
      } else if (table === 'categories') {
        dataToSave = data.map((c: any) => ({
          id: c.id,
          name: c.name || 'Nova Categoria'
        }));
      }

      let error;
      if (table === 'settings') {
        const { error: upsertError } = await supabase.from('settings').upsert({ id: 1, data: dataToSave });
        error = upsertError;
      } else {
        const { error: upsertError } = await supabase.from(table).upsert(dataToSave, { onConflict: 'id' });
        error = upsertError;
      }

      if (error) throw error;
      alert("✅ Silvia, tudo salvo com sucesso!");
    } catch (e: any) {
      console.error("Erro completo:", e);
      // Silvia, se o projeto estiver pausado, o erro cai aqui:
      if (e.message === 'Failed to fetch' || (e.status === 0)) {
        alert("⚠️ PROJETO PAUSADO NO SUPABASE\n\nSilvia, seu banco de dados entrou em repouso. Siga estes passos:\n\n1. Entre em app.supabase.com\n2. Clique no projeto 'Kones Gourmet'\n3. Clique em 'Restore Project'\n4. Espere 1 minuto e tente salvar aqui novamente.");
      } else {
        alert(`❌ Erro ao salvar: ${e.message || 'Erro de conexão'}`);
      }
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

  const updateBusinessHours = (day: string, field: keyof DaySchedule, value: any) => {
    const hours = { ...(settings.businessHours || {}) };
    hours[day] = { ...hours[day], [field]: value };
    setSettings({ ...settings, businessHours: hours });
  };

  if (!isAdminLoggedIn) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white p-10 rounded-3xl w-full max-w-sm text-center shadow-2xl border border-gray-100">
        <div className="bg-red-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"><Settings className="text-red-600" size={32}/></div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Painel do Parceiro</h2>
        <p className="text-xs text-gray-400 font-bold mb-8 uppercase tracking-widest">Acesso Restrito</p>
        <input type="password" title="Senha" className="w-full p-4 bg-gray-100 rounded-xl mb-4 text-center text-2xl tracking-[0.5em] focus:ring-2 ring-red-600/20 outline-none transition" placeholder="****" value={pass} onChange={e => setPass(e.target.value)} />
        <button onClick={() => pass === ADMIN_PASSWORD ? setIsAdminLoggedIn(true) : alert("Senha incorreta!")} className="w-full bg-red-600 text-white font-black py-4 rounded-xl shadow-lg active:scale-95 transition">Entrar agora</button>
        <button onClick={onClose} className="mt-6 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-red-600">Voltar ao Cardápio</button>
      </div>
    </div>
  );

  const daysLabels: Record<string, string> = {
    seg: 'Segunda-feira', ter: 'Terça-feira', qua: 'Quarta-feira', qui: 'Quinta-feira', 
    sex: 'Sexta-feira', sab: 'Sábado', dom: 'Domingo'
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-['Inter']">
      <header className="bg-white border-b p-4 sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition"><ArrowLeft size={20}/></button>
          <h1 className="font-black text-gray-900 uppercase text-[10px] tracking-[0.2em]">Gestor de Cardápio</h1>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {[
            { id: 'overview', icon: LayoutDashboard, label: 'Geral' },
            { id: 'products', icon: Package, label: 'Itens' },
            { id: 'categories', icon: Tag, label: 'Cat' },
            { id: 'settings', icon: Store, label: 'Loja' }
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${tab === t.id ? 'bg-white text-red-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
              <t.icon size={14}/> <span className="hidden md:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 p-5 max-w-4xl mx-auto w-full pb-20">
        {tab === 'overview' && (
          <div className="space-y-6 animate-slide-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-3xl border shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vendas Hoje</p>
                <p className="text-3xl font-black text-gray-900 mt-2 italic">R$ 0,00</p>
                <div className="mt-4 flex items-center gap-1 text-green-500 font-bold text-[10px]"><TrendingUp size={12}/> +0% que ontem</div>
              </div>
              <div className="bg-white p-6 rounded-3xl border shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vendas Mês</p>
                <p className="text-3xl font-black text-red-600 mt-2 italic">R$ 0,00</p>
                <div className="mt-4 flex items-center gap-1 text-gray-400 font-bold text-[10px]"><CheckCircle2 size={12}/> Meta: R$ 5.000,00</div>
              </div>
              <div className="bg-white p-6 rounded-3xl border shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ticket Médio</p>
                <p className="text-3xl font-black text-gray-900 mt-2 italic">R$ 0,00</p>
                <div className="mt-4 flex items-center gap-1 text-gray-400 font-bold text-[10px]"><Package size={12}/> 0 pedidos</div>
              </div>
            </div>

            <div className="bg-red-600 p-8 rounded-[32px] text-white shadow-xl flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black italic">Divulgue seu Link!</h3>
                <p className="text-xs font-bold opacity-80 mt-1">{OFFICIAL_URL}</p>
                <button onClick={() => { navigator.clipboard.writeText(OFFICIAL_URL); alert("Link copiado!"); }} className="mt-4 bg-white text-red-600 px-6 py-2 rounded-full font-black text-[10px] uppercase shadow-lg active:scale-95 transition flex items-center gap-2"><Copy size={14}/> Copiar Link</button>
              </div>
              <div className="hidden md:block bg-white/10 p-4 rounded-3xl backdrop-blur-md"><Link size={48} className="opacity-50"/></div>
            </div>
          </div>
        )}

        {tab === 'products' && (
          <div className="space-y-6 animate-slide-in">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border shadow-sm">
               <h3 className="font-black text-gray-900 uppercase text-xs">Gestão de Itens ({products.length})</h3>
               <button onClick={() => setProducts([{ id: generateId(), name: 'Novo Item', description: '', price: 0, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400', categoryId: categories[0]?.id || '', extras: [], active: true }, ...products])} className="bg-red-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 shadow-lg active:scale-95 transition"><Plus size={16}/> Novo Produto</button>
            </div>

            <div className="grid gap-6">
              {products.map((p: any, i: number) => (
                <div key={p.id} className="bg-white p-6 rounded-[32px] border shadow-sm space-y-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="relative w-32 h-32 shrink-0 mx-auto">
                      <img src={p.image} className="w-full h-full rounded-2xl object-cover border shadow-inner" />
                      <label className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center rounded-2xl cursor-pointer transition text-white"><Camera size={20}/><input type="file" className="hidden" onChange={e => upload(e, (b: any) => { const np = [...products]; np[i].image = b; setProducts(np); })}/></label>
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <input className="w-full p-4 bg-gray-50 rounded-xl font-black outline-none border focus:border-red-600 transition" value={p.name} onChange={e => { const np = [...products]; np[i].name = e.target.value; setProducts(np); }} placeholder="Nome" />
                        <div className="flex items-center bg-gray-50 rounded-xl px-4 border focus-within:border-red-600 transition">
                          <span className="font-black text-red-600 mr-2">R$</span>
                          <input type="number" className="w-full py-4 bg-transparent font-black outline-none" value={p.price} onChange={e => { const np = [...products]; np[i].price = parseFloat(e.target.value); setProducts(np); }} />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <select className="w-full p-4 bg-gray-50 rounded-xl font-bold border outline-none" value={p.categoryId} onChange={e => { const np = [...products]; np[i].categoryId = e.target.value; setProducts(np); }}>
                          {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <textarea className="w-full p-4 bg-gray-50 rounded-xl font-medium border h-14 resize-none outline-none focus:border-red-600 transition" value={p.description} onChange={e => { const np = [...products]; np[i].description = e.target.value; setProducts(np); }} placeholder="Descrição curta..." />
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-50 p-5 rounded-2xl border">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Adicionais</p>
                      <button onClick={() => { const np = [...products]; np[i].extras = [...(np[i].extras || []), { id: generateId(), name: 'Novo Extra', price: 0 }]; setProducts(np); }} className="text-red-600 font-black text-[9px] uppercase border border-red-200 px-3 py-1 rounded-full bg-white hover:bg-red-50 transition">+ Novo Extra</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {p.extras?.map((ex: any, ei: number) => (
                        <div key={ex.id} className="flex gap-2 bg-white p-2 rounded-xl border items-center shadow-sm">
                          <input className="flex-1 text-[10px] font-bold outline-none pl-2" value={ex.name} onChange={e => { const np = [...products]; np[i].extras[ei].name = e.target.value; setProducts(np); }} />
                          <div className="flex items-center text-[10px] font-black bg-gray-50 px-2 rounded-lg">
                            <span className="text-red-600 mr-1">R$</span>
                            <input type="number" className="w-12 py-2 bg-transparent outline-none text-right" value={ex.price} onChange={e => { const np = [...products]; np[i].extras[ei].price = parseFloat(e.target.value); setProducts(np); }} />
                          </div>
                          <button onClick={() => { const np = [...products]; np[i].extras = np[i].extras.filter((x: any) => x.id !== ex.id); setProducts(np); }} className="p-2 text-gray-300 hover:text-red-600 transition"><X size={14}/></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <button onClick={() => { const np = [...products]; np[i].active = !np[i].active; setProducts(np); }} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase transition ${p.active ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>{p.active ? 'Ativo' : 'Pausado'}</button>
                      <button onClick={() => { if(confirm("Deseja remover este item?")) setProducts(products.filter((x:any)=>x.id!==p.id)) }} className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase text-gray-300 hover:text-red-600 transition">Remover</button>
                    </div>
                    <button onClick={() => save('products', products)} disabled={loading} className="bg-gray-900 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase shadow-md active:scale-95 transition">Salvar Item</button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => save('products', products)} disabled={loading} className="w-full bg-red-600 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest mt-4 disabled:opacity-50">Salvar Todos os Itens</button>
          </div>
        )}

        {tab === 'categories' && (
          <div className="space-y-6 animate-slide-in">
            <button onClick={() => setCategories([{ id: generateId(), name: 'Nova Categoria' }, ...categories])} className="bg-red-600 text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase shadow-lg active:scale-95 transition flex items-center gap-2"><Plus size={16}/> Nova Categoria</button>
            <div className="grid gap-3">
              {categories.map((c: any, i: number) => (
                <div key={c.id} className="bg-white p-5 rounded-2xl border shadow-sm flex items-center gap-4">
                  <UtensilsCrossed className="text-red-600" size={18}/>
                  <input className="flex-1 font-bold text-gray-800 outline-none" value={c.name} onChange={e => { const nc = [...categories]; nc[i].name = e.target.value; setCategories(nc); }} />
                  <button onClick={() => { if(confirm("Deseja excluir esta categoria?")) setCategories(categories.filter((x:any)=>x.id!==c.id)) }} className="p-2 text-gray-300 hover:text-red-600 transition"><Trash2 size={18}/></button>
                </div>
              ))}
            </div>
            <button onClick={() => save('categories', categories)} disabled={loading} className="w-full bg-gray-900 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest mt-4">Salvar Categorias</button>
          </div>
        )}

        {tab === 'settings' && (
          <div className="space-y-8 animate-slide-in">
            <div className="bg-white p-8 rounded-[32px] border shadow-sm space-y-8">
               <h3 className="font-black text-gray-900 uppercase text-xs flex items-center gap-2"><Store size={18} className="text-red-600"/> Perfil da Loja</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Logo da Loja</p>
                   <div className="relative w-32 h-32">
                     <img src={settings.logo} className="w-full h-full rounded-2xl object-cover border" />
                     <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 rounded-2xl cursor-pointer transition text-white"><Camera/><input type="file" className="hidden" onChange={e => upload(e, (b:any) => setSettings({...settings, logo:b}))}/></label>
                   </div>
                 </div>
                 <div className="space-y-2">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Capa (Banner)</p>
                   <div className="relative h-32">
                     <img src={settings.banner} className="w-full h-full rounded-2xl object-cover border" />
                     <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 rounded-2xl cursor-pointer transition text-white"><Camera/><input type="file" className="hidden" onChange={e => upload(e, (b:any) => setSettings({...settings, banner:b}))}/></label>
                   </div>
                 </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <input className="w-full p-4 bg-gray-100 rounded-xl font-bold border outline-none focus:border-red-600" value={settings.storeName} onChange={e => setSettings({...settings, storeName: e.target.value})} placeholder="Nome da Loja" />
                 <input className="w-full p-4 bg-gray-100 rounded-xl font-bold border outline-none focus:border-red-600" value={settings.whatsapp} onChange={e => setSettings({...settings, whatsapp: e.target.value})} placeholder="WhatsApp (DDD + Número)" />
                 <div className="flex items-center bg-gray-100 p-4 rounded-xl border focus-within:border-red-600">
                    <span className="font-bold text-gray-400 mr-2 text-sm">Entrega R$</span>
                    <input type="number" className="w-full bg-transparent font-bold outline-none" value={settings.deliveryFee} onChange={e => setSettings({...settings, deliveryFee: parseFloat(e.target.value)})} />
                 </div>
               </div>

               <div className="bg-red-50 p-6 rounded-2xl space-y-4">
                 <h4 className="text-[10px] font-black text-red-600 uppercase tracking-widest">Configurações Financeiras (PIX)</h4>
                 <input className="w-full p-4 bg-white rounded-xl font-bold border outline-none" value={settings.pixKey} onChange={e => setSettings({...settings, pixKey: e.target.value})} placeholder="Chave PIX" />
                 <input className="w-full p-4 bg-white rounded-xl font-bold border outline-none" value={settings.pixName} onChange={e => setSettings({...settings, pixName: e.target.value})} placeholder="Nome do Titular" />
               </div>

               {/* HORÁRIOS DE FUNCIONAMENTO */}
               <div className="pt-6 space-y-4">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Clock size={16}/> Horários de Funcionamento</h4>
                  <div className="grid gap-3">
                    {Object.keys(daysLabels).map((day) => {
                      const dayData = settings.businessHours?.[day] || { open: '18:00', close: '23:00', closed: false };
                      return (
                        <div key={day} className="flex flex-col md:flex-row md:items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <span className="w-32 font-bold text-sm text-gray-700">{daysLabels[day]}</span>
                          <div className="flex flex-1 items-center gap-2">
                            <input 
                              type="time" 
                              disabled={dayData.closed}
                              className="bg-white p-2 rounded-lg border text-sm outline-none focus:border-red-600 disabled:opacity-50" 
                              value={dayData.open} 
                              onChange={(e) => updateBusinessHours(day, 'open', e.target.value)}
                            />
                            <span className="text-gray-400">até</span>
                            <input 
                              type="time" 
                              disabled={dayData.closed}
                              className="bg-white p-2 rounded-lg border text-sm outline-none focus:border-red-600 disabled:opacity-50" 
                              value={dayData.close} 
                              onChange={(e) => updateBusinessHours(day, 'close', e.target.value)}
                            />
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={dayData.closed} 
                              onChange={(e) => updateBusinessHours(day, 'closed', e.target.checked)}
                              className="w-4 h-4 accent-red-600"
                            />
                            <span className="text-[10px] font-black uppercase text-gray-400">Fechado</span>
                          </label>
                        </div>
                      )
                    })}
                  </div>
               </div>
            </div>

            <button onClick={() => save('settings', settings)} disabled={loading} className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-red-700 transition">Salvar Configurações</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
