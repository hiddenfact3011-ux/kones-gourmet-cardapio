
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowLeft, Settings, Tag, Store, Camera, Save, BarChart3, Star, CheckCircle2, X } from 'lucide-react';
import { AppSettings, Category, Product } from '../types';
import { ADMIN_PASSWORD } from '../constants';
import { supabase } from '../lib/supabase';

const AdminDashboard = ({ settings, setSettings, categories, setCategories, products, setProducts, onClose, isAdminLoggedIn, setIsAdminLoggedIn }: any) => {
  const [pass, setPass] = useState('');
  const [tab, setTab] = useState('sales');
  const [loading, setLoading] = useState(false);

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

  if (!isAdminLoggedIn) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-6">
      <div className="bg-white p-10 rounded-[40px] w-full max-w-sm text-center border-t-[10px] border-red-600 shadow-2xl">
        <Settings className="mx-auto text-red-600 mb-6" size={48}/>
        <h2 className="text-3xl font-black mb-2 italic">Painel Silvia</h2>
        <input type="password" className="w-full p-5 bg-gray-50 border-2 rounded-2xl mb-5 text-center text-3xl tracking-widest focus:border-red-600 outline-none transition" placeholder="****" value={pass} onChange={e => setPass(e.target.value)} />
        <button onClick={() => pass.trim() === ADMIN_PASSWORD ? setIsAdminLoggedIn(true) : alert("Senha Incorreta!")} className="w-full bg-red-600 text-white font-black py-5 rounded-2xl uppercase tracking-widest shadow-xl">Acessar</button>
        <button onClick={onClose} className="text-gray-400 mt-6 text-sm font-bold block mx-auto">Voltar</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-['Inter']">
      <header className="bg-zinc-900 text-white p-5 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition"><ArrowLeft size={22}/></button>
          <span className="font-black text-xs uppercase block">Administração Silvia</span>
        </div>
        <div className="flex bg-zinc-800 p-1 rounded-xl">
          {['sales', 'categories', 'products', 'store'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${tab === t ? 'bg-red-600 text-white' : 'text-gray-400'}`}>
              {t === 'sales' ? 'Vendas' : t === 'categories' ? 'Cat' : t === 'products' ? 'Prod' : 'Loja'}
            </button>
          ))}
        </div>
      </header>

      <main className="p-5 max-w-2xl mx-auto w-full flex-1 pb-24 space-y-6">
        {tab === 'sales' && (
          <div className="space-y-5 animate-slide-in">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-7 rounded-[32px] border text-center"><p className="text-[10px] text-gray-400 font-black uppercase mb-1">Hoje</p><p className="text-3xl font-black text-zinc-800">R$ 0,00</p></div>
              <div className="bg-white p-7 rounded-[32px] border text-center"><p className="text-[10px] text-gray-400 font-black uppercase mb-1">Mês</p><p className="text-3xl font-black text-red-600">R$ 0,00</p></div>
            </div>
            <div className="bg-white p-8 rounded-[40px] border text-center py-12">
              <CheckCircle2 size={48} className="mx-auto text-green-500 mb-4"/>
              <p className="font-bold text-gray-400 uppercase text-xs tracking-widest">Aguardando seu primeiro pedido!</p>
            </div>
          </div>
        )}

        {tab === 'store' && (
          <div className="animate-slide-in space-y-8">
            <div className="bg-white p-8 rounded-[40px] border shadow-sm space-y-8">
              <h3 className="font-black flex items-center gap-2"><Store size={20} className="text-red-600"/> Dados da Loja</h3>
              <div className="flex gap-6 items-center justify-center">
                <div className="relative w-20 h-20 group">
                  <img src={settings.logo} className="w-full h-full rounded-[20px] object-cover border-4 border-gray-50 shadow-md" />
                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-[20px] flex items-center justify-center cursor-pointer"><Camera size={16} className="text-white"/><input type="file" className="hidden" accept="image/*" onChange={e => upload(e, (b:any) => setSettings({...settings, logo:b}))}/></label>
                </div>
                <div className="relative flex-1 h-20 group">
                  <img src={settings.banner} className="w-full h-full rounded-[20px] object-cover border-4 border-gray-50 shadow-md" />
                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-[20px] flex items-center justify-center cursor-pointer"><Camera size={16} className="text-white"/><input type="file" className="hidden" accept="image/*" onChange={e => upload(e, (b:any) => setSettings({...settings, banner:b}))}/></label>
                </div>
              </div>
              <div className="space-y-4 pt-4">
                <input className="w-full p-5 bg-gray-50 rounded-2xl font-black border-2 focus:border-red-600 outline-none" value={settings.storeName} onChange={e => setSettings({...settings, storeName: e.target.value})} placeholder="Nome da Loja" />
                <input className="w-full p-5 bg-gray-50 rounded-2xl font-black border-2 focus:border-red-600 outline-none" value={settings.whatsapp} onChange={e => setSettings({...settings, whatsapp: e.target.value})} placeholder="WhatsApp (DDD + Número)" />
                <div className="flex items-center bg-gray-50 rounded-2xl border-2 px-5 py-4 focus-within:border-red-600 transition">
                  <span className="font-black text-gray-400 mr-2">Taxa Entrega R$</span>
                  <input type="number" className="bg-transparent font-black w-full outline-none" value={settings.deliveryFee} onChange={e => setSettings({...settings, deliveryFee: parseFloat(e.target.value)})} />
                </div>
              </div>
            </div>

            {/* EDIÇÃO DA PROMOÇÃO */}
            <div className="bg-white p-8 rounded-[40px] border shadow-sm space-y-6 border-red-600/30">
              <h3 className="font-black flex items-center gap-2"><Star size={20} className="text-red-600"/> Promoção do Dia</h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={settings.promotion?.active} onChange={e => setSettings({...settings, promotion: {...(settings.promotion || {}), active: e.target.checked}})} className="w-6 h-6 text-red-600 rounded-lg"/>
                <span className="font-black text-sm uppercase">Ativar Destaque no Topo</span>
              </label>
              <div className="flex gap-4">
                <div className="relative w-24 h-24 shrink-0 group">
                  <img src={settings.promotion?.image} className="w-full h-full rounded-2xl object-cover border-4 border-gray-50 shadow-md" />
                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-2xl flex items-center justify-center cursor-pointer"><Camera size={20} className="text-white"/><input type="file" className="hidden" onChange={e => upload(e, (b:any) => setSettings({...settings, promotion: {...settings.promotion, image: b}}))}/></label>
                </div>
                <div className="flex-1 space-y-2">
                  <input className="w-full p-3 bg-gray-50 rounded-xl font-bold outline-none text-sm" value={settings.promotion?.name} onChange={e => setSettings({...settings, promotion: {...settings.promotion, name: e.target.value}})} placeholder="Nome do Item" />
                  <input className="w-full p-3 bg-gray-50 rounded-xl font-bold outline-none text-sm text-red-600" type="number" value={settings.promotion?.price} onChange={e => setSettings({...settings, promotion: {...settings.promotion, price: parseFloat(e.target.value)}})} placeholder="Preço Promo" />
                </div>
              </div>
            </div>
            <button onClick={() => save('settings', settings)} className="w-full bg-red-600 text-white py-5 rounded-[24px] font-black uppercase shadow-xl">Salvar Tudo</button>
          </div>
        )}

        {tab === 'categories' && (
          <div className="space-y-5 animate-slide-in">
            <button onClick={() => setCategories([...categories, {id: Math.random().toString(), name: 'Nova Categoria'}])} className="bg-green-600 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase">+ NOVA CATEGORIA</button>
            {categories.map((c: any, i: number) => (
              <div key={c.id} className="bg-white p-7 rounded-[32px] border shadow-sm flex items-center gap-4">
                <Tag className="text-red-600" size={20}/>
                <input className="flex-1 font-black text-xl outline-none" value={c.name} onChange={e => { const nc = [...categories]; nc[i].name = e.target.value; setCategories(nc); }} />
                <button onClick={() => setCategories(categories.filter((x:any)=>x.id!==c.id))} className="p-2 text-gray-300 hover:text-red-600"><Trash2 size={20}/></button>
              </div>
            ))}
            <button onClick={() => save('categories', categories)} className="w-full bg-red-600 text-white py-5 rounded-[24px] font-black uppercase shadow-xl">Salvar Categorias</button>
          </div>
        )}

        {tab === 'products' && (
          <div className="space-y-5 animate-slide-in">
            <button onClick={() => setProducts([...products, {id: Math.random().toString(), name: 'Kone', description: '', price: 0, image: 'https://picsum.photos/400/400', categoryId: categories[0]?.id, extras: [], active: true}])} className="bg-green-600 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase">+ NOVO PRODUTO</button>
            {products.map((p: any, i: number) => (
              <div key={p.id} className="bg-white p-6 rounded-[32px] border shadow-sm flex flex-col gap-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="relative w-32 h-32 shrink-0 mx-auto group">
                    <img src={p.image} className="w-full h-full rounded-[24px] object-cover border-4 border-gray-50 shadow-inner" />
                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-[24px] flex items-center justify-center cursor-pointer"><Camera size={24} className="text-white"/><input type="file" className="hidden" onChange={e => upload(e, (b:any) => { const np = [...products]; np[i].image = b; setProducts(np); })}/></label>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input className="w-full font-black text-lg outline-none bg-gray-50 p-4 rounded-2xl" value={p.name} onChange={e => { const np = [...products]; np[i].name = e.target.value; setProducts(np); }} placeholder="Nome" />
                      <div className="flex items-center bg-gray-50 rounded-2xl px-4">
                        <span className="font-black text-red-600 mr-2">R$</span>
                        <input type="number" className="font-black w-full outline-none bg-transparent py-4" value={p.price} onChange={e => { const np = [...products]; np[i].price = parseFloat(e.target.value); setProducts(np); }} />
                      </div>
                    </div>
                    <select className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none border-r-[16px] border-transparent" value={p.categoryId} onChange={e => { const np = [...products]; np[i].categoryId = e.target.value; setProducts(np); }}>
                      {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <textarea className="w-full text-sm text-gray-500 h-20 bg-gray-50 p-4 rounded-2xl outline-none resize-none" value={p.description} onChange={e => { const np = [...products]; np[i].description = e.target.value; setProducts(np); }} placeholder="Descrição do produto..." />
                  </div>
                </div>

                {/* ADICIONAIS DO PRODUTO */}
                <div className="bg-gray-50 p-5 rounded-[24px] space-y-3">
                  <div className="flex justify-between items-center"><span className="text-[10px] font-black text-gray-400 uppercase">Adicionais deste Produto</span><button onClick={() => { const np = [...products]; np[i].extras = [...(np[i].extras || []), {id: Math.random().toString(), name: 'Adicional', price: 0}]; setProducts(np); }} className="text-red-600 font-black text-[10px] bg-white px-3 py-1.5 rounded-full">+ ADICIONAR</button></div>
                  {p.extras?.map((ex:any, ei:number) => (
                    <div key={ex.id} className="flex gap-3 bg-white p-3 rounded-xl items-center shadow-sm">
                      <input className="flex-1 text-xs font-bold outline-none" value={ex.name} onChange={e => { const np = [...products]; np[i].extras[ei].name = e.target.value; setProducts(np); }} />
                      <input type="number" className="w-16 text-xs font-black text-red-600 text-right outline-none" value={ex.price} onChange={e => { const np = [...products]; np[i].extras[ei].price = parseFloat(e.target.value); setProducts(np); }} />
                      <button onClick={() => { const np = [...products]; np[i].extras = np[i].extras.filter((x:any)=>x.id!==ex.id); setProducts(np); }} className="text-gray-300"><X size={14}/></button>
                    </div>
                  ))}
                </div>
                <button onClick={() => setProducts(products.filter((x:any)=>x.id!==p.id))} className="text-red-600 font-bold text-xs uppercase flex items-center gap-2 justify-center"><Trash2 size={16}/> Excluir Produto</button>
              </div>
            ))}
            <button onClick={() => save('products', products)} className="w-full bg-red-600 text-white py-5 rounded-[24px] font-black uppercase shadow-xl">Salvar Todos os Produtos</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
