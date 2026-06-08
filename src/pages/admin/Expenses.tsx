import React, { useState, useEffect } from "react";
import { Expense, Trip } from "../../erp-types";
import { Receipt, Plane, ArrowRight, DollarSign, Wallet, CheckSquare, Square, Trash } from "lucide-react";
import toast from "react-hot-toast";
import { getApiUrl } from "../../lib/api";
import { useERPSync } from "../../hooks/useERPSync";

export function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  
  const [form, setForm] = useState({
    description: '', amount: '', type: 'Fixe', trip_id: '', pay_now: false
  });

  const fetchExpenses = () => fetch(getApiUrl("/api/expenses")).then(r => r.json()).then(setExpenses).catch(console.error);
  const fetchTrips = () => fetch(getApiUrl("/api/trips")).then(r => r.json()).then(setTrips).catch(console.error);

  useERPSync(() => {
    fetchExpenses();
    fetchTrips();
  });

  useEffect(() => {
    fetchExpenses();
    fetchTrips();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا المصروف؟")) return;
    try {
      const res = await fetch(getApiUrl(`/api/expenses/${id}`), { method: "DELETE" });
      if (res.ok) {
        toast.success("تم الحذف بنجاح");
        fetchExpenses();
      } else {
        toast.error("حدث خطأ أثناء الحذف");
      }
    } catch {
      toast.error("حدث خطأ أثناء الحذف");
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description || !form.amount) {
      toast.error("يرجى إدخال البيان والمبلغ");
      return;
    }
    try {
      const res = await fetch(getApiUrl("/api/expenses"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({...form, trip_id: form.type === 'Fixe' ? null : form.trip_id })
      });
      if (res.ok) {
        toast.success("تم تسجيل المصروف");
        setForm({ description: '', amount: '', type: 'Fixe', trip_id: '', pay_now: false });
        fetchExpenses();
      }
    } catch {
      toast.error("حدث خطأ");
    }
  };

  const totalFormat = (v: number) => new Intl.NumberFormat('ar-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(v);
  
  const totalExpenses = expenses.reduce((s, e) => s + (parseFloat(e.amount as any) || 0), 0);
  const totalFixe = expenses.filter(e => e.type === 'Fixe').reduce((s, e) => s + (parseFloat(e.amount as any) || 0), 0);
  const totalVar = expenses.filter(e => e.type === 'Variable').reduce((s, e) => s + (parseFloat(e.amount as any) || 0), 0);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black text-slate-800">إدارة المصاريف</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="relative z-10 flex justify-between items-start">
             <div>
               <div className="text-rose-100 font-bold mb-1">إجمالي المصاريف</div>
               <div className="text-3xl font-black" dir="ltr">{totalFormat(totalExpenses)}</div>
             </div>
             <div className="bg-white/20 p-3 rounded-2xl"><Receipt className="w-6 h-6 text-white" /></div>
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex justify-between items-start">
           <div>
             <div className="text-slate-500 font-bold mb-1">مصاريف عامة (ثابتة)</div>
             <div className="text-2xl font-black text-slate-800" dir="ltr">{totalFormat(totalFixe)}</div>
           </div>
           <div className="bg-slate-50 p-3 rounded-2xl"><Wallet className="w-6 h-6 text-slate-400" /></div>
        </div>
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex justify-between items-start">
           <div>
             <div className="text-slate-500 font-bold mb-1">مصاريف رحلات (متغيرة)</div>
             <div className="text-2xl font-black text-slate-800" dir="ltr">{totalFormat(totalVar)}</div>
           </div>
           <div className="bg-slate-50 p-3 rounded-2xl"><Plane className="w-6 h-6 text-slate-400" /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <PlusIcon className="w-5 h-5 text-primary" />
              تسجيل مصروف جديد
            </h2>
            <form onSubmit={handleAdd} className="space-y-5">
               <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">نوع المصروف</label>
                  <div className="flex bg-slate-50 p-1 rounded-xl">
                    <button type="button" onClick={() => setForm({...form, type: 'Fixe'})} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${form.type === 'Fixe' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>عام (ثابت)</button>
                    <button type="button" onClick={() => setForm({...form, type: 'Variable'})} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${form.type === 'Variable' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>رحلة (متغير)</button>
                  </div>
               </div>
               
               {form.type === 'Variable' && (
                 <div>
                   <label className="block text-xs font-bold text-slate-500 mb-1">اختر الرحلة</label>
                   <select required value={form.trip_id} onChange={e => setForm({...form, trip_id: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-primary">
                     <option value="" disabled>-- اختيار --</option>
                     {trips.map(t => <option key={t.id} value={t.id}>{t.code} - {t.destination}</option>)}
                   </select>
                 </div>
               )}

               <div>
                 <label className="block text-xs font-bold text-slate-500 mb-1">البيان / الوصف</label>
                 <input required type="text" placeholder="مثال: فاتورة كهرباء" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-primary" />
               </div>

               <div>
                 <label className="block text-xs font-bold text-slate-500 mb-1">المبلغ (MAD)</label>
                 <div className="relative">
                   <DollarSign className="w-5 h-5 text-slate-400 absolute right-4 top-3.5" />
                   <input required type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-12 pl-4 py-3 text-slate-800 focus:outline-none focus:border-primary" placeholder="0.00" />
                 </div>
               </div>

               <div className="pt-2">
                 <label className="flex items-center gap-3 cursor-pointer group">
                   <div onClick={() => setForm({...form, pay_now: !form.pay_now})}>
                     {form.pay_now ? <CheckSquare className="w-6 h-6 text-primary" /> : <Square className="w-6 h-6 text-slate-300 group-hover:text-primary transition-colors" />}
                   </div>
                   <div>
                     <div className="font-bold text-slate-800 text-sm">صرف فوري من الصندوق</div>
                     <div className="text-xs text-slate-500">سيتم تسجيل العملية تلقائياً كـ (Décaissement Auto)</div>
                   </div>
                 </label>
               </div>

               <button type="submit" className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl transition-all shadow-md">
                 حفظ المصروف
               </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 h-full flex flex-col">
            <h2 className="text-xl font-bold text-slate-800 mb-6">أرشيف المصاريف</h2>
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-right whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-bold rounded-r-xl">التاريخ</th>
                    <th className="px-4 py-3 font-bold">البيان</th>
                    <th className="px-4 py-3 font-bold">النوع</th>
                    <th className="px-4 py-3 font-bold">المبلغ</th>
                    <th className="px-4 py-3 font-bold rounded-l-xl">تعامل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {expenses.length === 0 && (<tr><td colSpan={5} className="py-8 text-center text-slate-400">لا توجد مصاريف مسجلة</td></tr>)}
                  {expenses.slice().reverse().map(e => (
                    <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 text-sm text-slate-500">{e.date?.split('T')[0]}</td>
                      <td className="px-4 py-4 font-bold text-slate-800">{e.description}</td>
                      <td className="px-4 py-4">
                        {e.type === 'Fixe' ? (
                          <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-600">عام</span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-700">رحلة - {e.trip_code}</span>
                        )}
                      </td>
                      <td className="px-4 py-4 font-black text-rose-600" dir="ltr">{totalFormat(e.amount)}</td>
                      <td className="px-4 py-4">
                        <button onClick={() => handleDelete(e.id)} className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors">
                          <Trash className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlusIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 12h14"/><path d="M12 5v14"/></svg>;
}
