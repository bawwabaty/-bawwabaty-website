import { useState, useEffect } from "react";
import { CashJournal as CashJournalType } from "../../erp-types";
import { Download, Plus, Wallet, TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight, X } from "lucide-react";
import toast from "react-hot-toast";

export function CashJournal() {
  const [journal, setJournal] = useState<CashJournalType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    entity: '',
    type: 'Encaissement',
    amount: '',
    payment_method: 'Cash',
    currency: 'MAD'
  });

  const fetchData = () => {
    fetch("/api/cash-journal")
      .then(r => r.json())
      .then(setJournal)
      .catch(console.error);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.entity || !form.amount) {
      toast.error('الرجاء ملء جميع الحقول المطلوبة');
      return;
    }
    
    try {
      const res = await fetch("/api/cash-journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: form.entity,
          type: form.type,
          amount: parseFloat(form.amount) || 0,
          payment_method: form.payment_method,
          currency: form.currency
        })
      });
      if (!res.ok) throw new Error("فشل الحفظ");
      toast.success("تم الحفظ بنجاح");
      setIsModalOpen(false);
      setForm({ entity: '', type: 'Encaissement', amount: '', payment_method: 'Cash', currency: 'MAD' });
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const totalFormat = (v: number) => new Intl.NumberFormat('ar-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(v);

  const totalIn = journal.filter(j => j.type === 'Encaissement').reduce((s, j) => s + (parseFloat(j.amount as any) || 0), 0);
  const totalOut = journal.filter(j => j.type === 'Décaissement').reduce((s, j) => s + (parseFloat(j.amount as any) || 0), 0);
  const balance = totalIn - totalOut;

  let balanceColor = "bg-emerald-50 border-emerald-200 text-emerald-700";
  if (balance < 0) balanceColor = "bg-rose-50 border-rose-200 text-rose-700";
  else if (balance < 10000) balanceColor = "bg-orange-50 border-orange-200 text-orange-700";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <h1 className="text-3xl font-black text-slate-800">يومية الصندوق والبنك</h1>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-colors shadow-sm text-sm">
            <Download className="w-4 h-4" />
            تصدير Excel
          </button>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-colors shadow-sm text-sm">
            <Plus className="w-4 h-4" />
            عملية مالية يدوية
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-slate-500 font-bold mb-1">إجمالي المداخيل</div>
            <div className="text-2xl font-black text-emerald-600" dir="ltr">{totalFormat(totalIn)}</div>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500"><TrendingUp className="w-6 h-6" /></div>
        </div>
        
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-slate-500 font-bold mb-1">إجمالي المخرجات (مصاريف)</div>
            <div className="text-2xl font-black text-rose-600" dir="ltr">{totalFormat(totalOut)}</div>
          </div>
          <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500"><TrendingDown className="w-6 h-6" /></div>
        </div>

        <div className={`rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-between ${balanceColor} border transition-colors`}>
          <div>
            <div className="font-bold mb-1 opacity-80">الرصيد الفعلي (Solde)</div>
            <div className="text-3xl font-black tracking-tight" dir="ltr">{totalFormat(balance)}</div>
            {balance < 0 && <div className="text-xs font-bold mt-1 text-rose-600">!! تحذير الرصيد سلبي !!</div>}
          </div>
          <div className="w-12 h-12 rounded-full bg-white/50 flex items-center justify-center"><Wallet className="w-6 h-6" /></div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800">سجل العمليات المالية (Cash Journal)</h2>
        </div>
        <div className="overflow-x-auto p-4">
          <table className="w-full text-right whitespace-nowrap border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="px-4 py-3 font-bold text-slate-500 border border-slate-200">التاريخ</th>
                <th className="px-4 py-3 font-bold text-slate-500 border border-slate-200">المرجع</th>
                <th className="px-4 py-3 font-bold text-slate-500 border border-slate-200">الجهة / الشرح</th>
                <th className="px-4 py-3 font-bold text-emerald-600 border border-slate-200 bg-emerald-50/50 text-center">مدين (Encaissement)</th>
                <th className="px-4 py-3 font-bold text-rose-600 border border-slate-200 bg-rose-50/50 text-center">دائن (Décaissement)</th>
                <th className="px-4 py-3 font-bold text-slate-800 border border-slate-200 bg-slate-200/50 text-center">الرصيد التراكمي</th>
              </tr>
            </thead>
            <tbody>
              {journal.length === 0 && (<tr><td colSpan={6} className="py-8 text-center text-slate-400 font-bold border border-slate-200">لا توجد عمليات مالية</td></tr>)}
              {journal.map(j => {
                const isInc = j.type === 'Encaissement';
                return (
                  <tr key={j.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-slate-500 border border-slate-200">{j.date?.replace('T', ' ').substring(0, 16)}</td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-slate-400 border border-slate-200">{j.receipt_ref}</td>
                    <td className="px-4 py-3 font-bold text-slate-700 border border-slate-200">{j.entity}</td>
                    <td className="px-4 py-3 border border-slate-200 text-center bg-emerald-50/10">
                       {isInc ? (
                         <div className="flex items-center gap-2 justify-center text-emerald-600 font-black">
                           <ArrowDownLeft className="w-4 h-4" />
                           <span dir="ltr">{totalFormat(j.amount)}</span>
                         </div>
                       ) : '-'}
                    </td>
                    <td className="px-4 py-3 border border-slate-200 text-center bg-rose-50/10">
                       {!isInc ? (
                         <div className="flex items-center gap-2 justify-center text-rose-600 font-black">
                           <ArrowUpRight className="w-4 h-4" />
                           <span dir="ltr">{totalFormat(j.amount)}</span>
                         </div>
                       ) : '-'}
                    </td>
                    <td className="px-4 py-3 border border-slate-200 text-center bg-slate-50 font-black text-slate-800" dir="ltr">
                      {totalFormat(j.solde_cumule || 0)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                عملية مالية يدوية
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">نوع العملية *</label>
                <div className="flex gap-4">
                  <label className="flex-1 flex items-center justify-center gap-2 border border-slate-200 rounded-xl p-3 cursor-pointer hover:border-emerald-500 transition-colors">
                    <input type="radio" value="Encaissement" checked={form.type === 'Encaissement'} onChange={e => setForm({...form, type: e.target.value})} className="hidden" />
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${form.type === 'Encaissement' ? 'border-emerald-500' : 'border-slate-300'}`}>
                      {form.type === 'Encaissement' && <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
                    </div>
                    <span className="font-bold text-slate-700">مدين (مداخيل)</span>
                  </label>
                  <label className="flex-1 flex items-center justify-center gap-2 border border-slate-200 rounded-xl p-3 cursor-pointer hover:border-rose-500 transition-colors">
                    <input type="radio" value="Décaissement" checked={form.type === 'Décaissement'} onChange={e => setForm({...form, type: e.target.value})} className="hidden" />
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${form.type === 'Décaissement' ? 'border-rose-500' : 'border-slate-300'}`}>
                      {form.type === 'Décaissement' && <div className="w-2 h-2 rounded-full bg-rose-500"></div>}
                    </div>
                    <span className="font-bold text-slate-700">دائن (مصاريف)</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">الجهة / الشرح *</label>
                <input required type="text" value={form.entity} onChange={e => setForm({...form, entity: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary" placeholder="اسم الجهة أو شرح العملية" />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">المبلغ (MAD) *</label>
                <input required type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary font-bold" />
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">إلغاء</button>
                <button type="submit" className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl transition-colors shadow-md">حفظ العملية</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
