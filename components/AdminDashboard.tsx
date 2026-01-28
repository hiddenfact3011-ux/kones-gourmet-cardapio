
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowLeft, Settings, Tag, Store, Camera, Save, BarChart3, Star, CheckCircle2, X, TrendingUp, Link, Copy } from 'lucide-react';
import { AppSettings, Category, Product } from '../types';
import { ADMIN_PASSWORD } from '../constants';
import { supabase } from '../lib/supabase';

const AdminDashboard = ({ settings, setSettings, categories, setCategories, products, setProducts, onClose, isAdminLoggedIn, setIsAdminLoggedIn }: any) => {
  const [pass, setPass] = useState('');
  const [tab, setTab] = useState('sales');
  const [loading, setLoading] = useState(false);
  const OFFICIAL_URL = 'https://kones-gourmet-cardapio.vercel.app';

  const save = async (table: string, data: any) => {
    setLoading(true);
    try {
      const { error } = table === 'settings' 
        ? await supabase.from('settings').upsert({ id: 1, data }) 
        : await supabase.from(table).upsert(data, { onConflict: 'id' });
      if (error) throw error;
      alert("✅ Silvia, salvo com sucesso!");
    } catch (e) { alert("❌ Erro ao salvar."); }
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

  const copyLink = () => {
    navigator.clipboard.writeText(OFFICIAL_URL);
    alert("Link do cardápio copiado!");
  };

  if (!isAdminLoggedIn) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-6">
      <div className="bg-white p-10 rounded-[40px] w-full max-w-sm text-center border-t-[10px] border-red-600 shadow-2xl">
        <Settings className="mx-auto text-red-600 mb-6" size={48}/>
        <h2 className="text-3xl font-black mb-2 italic">Painel Silvia</h2>
        <input type="password" className="w-full p-5 bg-gray-50 border-2 rounded-2xl mb-5 text-center text-3xl tracking-widest focus:border-red-600 outline-none transition" placeholder="****" value={pass} onChange={e => setPass(e.target.value)} />
        <button onClick={() => pass.trim() === ADMIN_PASSWORD ? setIsAdminLoggedIn(true) : alert("Senha Incorreta!")} className="w-full bg-red-600 text-white font-black py-5 rounded-2xl uppercase tracking-widest shadow-xl transform active:scale-95 transition">Acessar</button>
        <button onClick={onClose} className="text-gray-400 mt-6 text-sm font-bold block mx-auto">Voltar</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-['Inter']">
      <header className="bg-zinc-900 text-white p-5 flex justify-between items-center sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition"><ArrowLeft size={22}/></button>
          <span className="font-black text-xs uppercase block">Administração Silvia</span>
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
          <div className="space-y-5 animate-slide-in">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-7 rounded-[32px] border text-center shadow-sm"><p className="text-[10px] text-gray-400 font-black uppercase mb-1 tracking-widest">Hoje</p><p className="text-3xl font-black text-zinc-800 italic">R$ 0,00</p></div>
              <div className="bg-white p-7 rounded-[32px] border text-center shadow-sm"><p className="text-[10px] text-gray-400 font-black uppercase mb-1 tracking-widest">Mês</p><p className="text-3xl font-black text-red-600 italic">R$ 0,00</p></div>
            </div>
            
            <div className="bg-white p-8 rounded-[40px] border shadow-sm flex items-center justify-between border-l-[12px] border-l-green-500">
               <div className="space-y-1">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">🏆 Produto Mais Vendido</p>
                 <h3 className="text-xl font-black text-gray-800 italic">Aguardando Vendas</h3>
                 <p className="text-xs font-bold text-gray-400">0 unidades este mês</p>
               </div>
               <div className="bg-green-100 p-4 rounded-3xl text-green-600"><TrendingUp size={32}/></div>
            </div>

            <div className="bg-white p-8 rounded-[40px] border text-center py-16 shadow-sm">
              <CheckCircle2 size={48} className="mx-auto text-green-500 mb-4 opacity-20"/>
              <p className="font-bold text-gray-300 uppercase text-[10px] tracking-[0.2em]">Seu próximo pedido aparecerá aqui</p>
            </div>
          </div>
        )}

        {tab === 'store' && (
          <div className="animate-slide-in space-y-8">
            {/* LINK DO APP PARA SILVIA COPIAR */}
            <div className="bg-red-600 p-8 rounded-[40px] shadow-xl text-white space-y-4">
               <h3 className="font-black flex items-center gap-2 uppercase tracking-widest text-xs"><Link size={18}/> Seu Link do Cardápio</h3>
               <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl flex justify-between items-center gap-4">
                 <p className="text-xs font-bold truncate opacity-80">{OFFICIAL_URL}</p>
                 <button onClick={copyLink} className="bg-white text-red-600 p-2 rounded-xl shadow-lg hover:scale-105 transition active:scale-95"><Copy size={18}/></button>
               </div>
               <p className="text-[10px] font-medium opacity-70">Silvia, este é o link que você deve enviar para seus clientes!</p>
            </div>

            <div className="bg-white p-8 rounded-[40px] border shadow-sm space-y-8">
              <h3 className="font-black flex items-center gap-2 text-zinc-800"><Store size={20} className="text-red-600"/> Dados da Loja</h3>
              <div className="flex gap-6 items-center justify-center">
                <div className="relative w-24 h-24 group">
                  <img src={settings.logo} className="w-full h-full rounded-[24px] object-cover border-4 border-gray-50 shadow-md" />
                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-[24px] flex items-center justify-center cursor-pointer"><Camera size={16} className="text-white"/><input type="file" className="hidden" accept="image/*" onChange={e => upload(e, (b:any) => setSettings({...settings, logo:b}))}/></label>
                </div>
                <div className="relative flex-1 h-24 group">
                  <img src={settings.banner} className="w-full h-full rounded-[24px] object-cover border-4 border-gray-50 shadow-md" />
                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-[24px] flex items-center justify-center cursor-pointer"><Camera size={16} className="text-white"/><input type="file" className="hidden" accept="image/*" onChange={e => upload(e, (b:any) => setSettings({...settings, banner:b}))}/></label>
                </div>
              </div>
              <div className="space-y-4 pt-4">
                <input className="w-full p-5 bg-gray-50 rounded-2xl font-black border-2 focus:border-red-600 outline-none transition" value={settings.storeName} onChange={e => setSettings({...settings, storeName: e.target.value})} placeholder="Nome da Loja" />
                <input className="w-full p-5 bg-gray-50 rounded-2xl font-black border-2 focus:border-red-600 outline-none transition" value={settings.whatsapp} onChange={e => setSettings({...settings, whatsapp: e.target.value})} placeholder="WhatsApp (Ex: 64981324434)" />
                <div className="flex items-center bg-gray-50 rounded-2xl border-2 px-5 py-4 focus-within:border-red-600 transition">
                  <span className="font-black text-gray-400 mr-2">Taxa Entrega R$</span>
                  <input type="number" className="bg-transparent font-black w-full outline-none" value={settings.deliveryFee} onChange={e => setSettings({...settings, deliveryFee: parseFloat(e.target.value)})} />
                </div>
                <div className="bg-red-50 p-6 rounded-[32px] border border-red-100 space-y-4">
                   <p className="text-[10px] font-black text-red-600 uppercase tracking-widest text-center">Configurações do PIX</p>
                   <input className="w-full p-4 bg-white rounded-xl font-bold border-2 focus:border-red-600 outline-none text-sm" value={settings.pixKey} onChange={e => setSettings({...settings, pixKey: e.target.value})} placeholder="Chave PIX (CPF, Celular ou Aleatória)" />
                   <input className="w-full p-4 bg-white rounded-xl font-bold border-2 focus:border-red-600 outline-none text-sm" value={settings.pixName} onChange={e => setSettings({...settings, pixName: e.target.value})} placeholder="Nome do Titular da Conta" />
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[40px] border shadow-sm space-y-6 border-red-600/30">
              <h3 className="font-black flex items-center gap-2 text-zinc-800"><Star size={20} className="text-red-600"/> Promoção do Dia</h3>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={settings.promotion?.active} onChange={e => setSettings({...settings, promotion: {...(settings.promotion || {}), active: e.target.checked}})} className="w-6 h-6 text-red-600 rounded-lg"/>
                <span className="font-black text-sm uppercase group-hover:text-red-600 transition">Ativar Destaque no Topo</span>
              </label>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="relative w-32 h-32 shrink-0 mx-auto group">
                  <img src={settings.promotion?.image} className="w-full h-full rounded-[32px] object-cover border-4 border-gray-50 shadow-md" />
                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-[32px] flex items-center justify-center cursor-pointer"><Camera size={20} className="text-white"/><input type="file" className="hidden" onChange={e => upload(e, (b:any) => setSettings({...settings, promotion: {...settings.promotion, image: b}}))}/></label>
                </div>
                <div className="flex-1 space-y-3">
                  <input className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 focus:border-red-600 transition" value={settings.promotion?.name} onChange={e => setSettings({...settings, promotion: {...settings.promotion, name: e.target.value}})} placeholder="Nome do Kone em Promo" />
                  <div className="flex items-center bg-gray-50 rounded-2xl border-2 px-4 focus-within:border-red-600 transition">
                     <span className="font-black text-red-600 mr-2">R$</span>
                     <input className="w-full py-4 bg-transparent font-black outline-none" type="number" value={settings.promotion?.price} onChange={e => setSettings({...settings, promotion: {...settings.promotion, price: parseFloat(e.target.value)}})} placeholder="0.00" />
                  </div>
                </div>
              </div>
              <textarea className="w-full p-4 bg-gray-50 rounded-2xl font-medium outline-none border-2 focus:border-red-600 transition h-24 resize-none" value={settings.promotion?.description} onChange={e => setSettings({...settings, promotion: {...settings.promotion, description: e.target.value}})} placeholder="Descrição curta para atrair o cliente..." />
            </div>
            <button onClick={() => save('settings', settings)} className="w-full bg-red-600 text-white py-6 rounded-[32px] font-black uppercase shadow-xl hover:bg-red-700 active:scale-95 transition tracking-widest">Salvar Configurações</button>
          </div>
        )}

        {tab === 'categories' && (
          <div className="space-y-5 animate-slide-in">
            <button onClick={() => setCategories([...categories, {id: Math.random().toString(), name: 'Nova Categoria'}])} className="bg-green-600 text-white px-8 py-5 rounded-3xl font-black text-xs uppercase shadow-lg hover:bg-green-700 transition">+ NOVA CATEGORIA</button>
            {categories.map((c: any, i: number) => (
              <div key={c.id} className="bg-white p-8 rounded-[40px] border shadow-sm flex items-center gap-4 group">
                <Tag className="text-red-600" size={20}/>
                <input className="flex-1 font-black text-xl outline-none group-focus-within:text-red-600 transition" value={c.name} onChange={e => { const nc = [...categories]; nc[i].name = e.target.value; setCategories(nc); }} />
                <button onClick={() => setCategories(categories.filter((x:any)=>x.id!==c.id))} className="p-3 text-gray-200 hover:text-red-600 hover:bg-red-50 rounded-2xl transition"><Trash2 size={20}/></button>
              </div>
            ))}
            <button onClick={() => save('categories', categories)} className="w-full bg-red-600 text-white py-6 rounded-[32px] font-black uppercase shadow-xl">Salvar Categorias</button>
          </div>
        )}

        {tab === 'products' && (
          <div className="space-y-5 animate-slide-in">
            <button onClick={() => setProducts([...products, {id: Math.random().toString(), name: 'Kone', description: '', price: 0, image: 'https://images.unsplash.com/photo-1613564834361-9436948817d1?w=400', categoryId: categories[0]?.id, extras: [], active: true}])} className="bg-green-600 text-white px-8 py-5 rounded-3xl font-black text-xs uppercase shadow-lg hover:bg-green-700 transition">+ NOVO PRODUTO</button>
            {products.map((p: any, i: number) => (
              <div key={p.id} className="bg-white p-8 rounded-[40px] border shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="relative w-40 h-40 shrink-0 mx-auto group">
                    <img src={p.image} className="w-full h-full rounded-[40px] object-cover border-4 border-gray-50 shadow-inner" />
                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-[40px] flex items-center justify-center cursor-pointer"><Camera size={28} className="text-white"/><input type="file" className="hidden" onChange={e => upload(e, (b:any) => { const np = [...products]; np[i].image = b; setProducts(np); })}/></label>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input className="w-full font-black text-xl outline-none bg-gray-50 p-5 rounded-2xl focus:border-red-600 transition border-2 border-transparent" value={p.name} onChange={e => { const np = [...products]; np[i].name = e.target.value; setProducts(np); }} placeholder="Nome" />
                      <div className="flex items-center bg-gray-50 rounded-2xl px-5 border-2 border-transparent focus-within:border-red-600 transition">
                        <span className="font-black text-red-600 mr-2">R$</span>
                        <input type="number" className="font-black w-full outline-none bg-transparent py-5" value={p.price} onChange={e => { const np = [...products]; np[i].price = parseFloat(e.target.value); setProducts(np); }} />
                      </div>
                    </div>
                    <select className="w-full p-5 bg-gray-50 rounded-2xl font-bold outline-none border-r-[20px] border-transparent cursor-pointer hover:bg-gray-100 transition" value={p.categoryId} onChange={e => { const np = [...products]; np[i].categoryId = e.target.value; setProducts(np); }}>
                      {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <textarea className="w-full text-sm font-medium text-gray-500 h-24 bg-gray-50 p-5 rounded-2xl outline-none resize-none focus:border-red-600 transition border-2 border-transparent" value={p.description} onChange={e => { const np = [...products]; np[i].description = e.target.value; setProducts(np); }} placeholder="Descreva os ingredientes do Kone..." />
                  </div>
                </div>

                <div className="bg-zinc-50 p-6 rounded-[32px] border border-zinc-100 space-y-4">
                  <div className="flex justify-between items-center px-2"><span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Turbine este Produto</span><button onClick={() => { const np = [...products]; np[i].extras = [...(np[i].extras || []), {id: Math.random().toString(), name: 'Extra', price: 0}]; setProducts(np); }} className="text-red-600 font-black text-[10px] bg-white px-4 py-2 rounded-full shadow-sm hover:shadow-md transition">+ NOVO ADICIONAL</button></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {p.extras?.map((ex:any, ei:number) => (
                      <div key={ex.id} className="flex gap-3 bg-white p-4 rounded-2xl items-center shadow-sm border border-zinc-100">
                        <input className="flex-1 text-xs font-bold outline-none" value={ex.name} onChange={e => { const np = [...products]; np[i].extras[ei].name = e.target.value; setProducts(np); }} />
                        <input type="number" className="w-14 text-xs font-black text-red-600 text-right outline-none bg-transparent" value={ex.price} onChange={e => { const np = [...products]; np[i].extras[ei].price = parseFloat(e.target.value); setProducts(np); }} />
                        <button onClick={() => { const np = [...products]; np[i].extras = np[i].extras.filter((x:any)=>x.id!==ex.id); setProducts(np); }} className="text-gray-200 hover:text-red-600 transition"><X size={16}/></button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2">
                   <button onClick={() => { const np = [...products]; np[i].active = !np[i].active; setProducts(np); }} className={`text-[10px] font-black uppercase px-4 py-2 rounded-full transition ${p.active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      {p.active ? 'Ativo no Cardápio' : 'Pausado'}
                   </button>
                   <button onClick={() => { if(confirm("Silvia, deseja excluir este produto?")) setProducts(products.filter((x:any)=>x.id!==p.id)) }} className="text-red-200 hover:text-red-600 font-bold text-[10px] uppercase flex items-center gap-2 transition"><Trash2 size={16}/> Remover</button>
                </div>
              </div>
            ))}
            <button onClick={() => save('products', products)} className="w-full bg-red-600 text-white py-6 rounded-[32px] font-black uppercase shadow-xl hover:bg-red-700 transition">Salvar Todos os Produtos</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
