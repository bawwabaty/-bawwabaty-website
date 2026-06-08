import React, { useState, useEffect } from "react";
import { Reservation, Trip } from "../../erp-types";
import { CreditCard, Plus, Plane, Users, CheckCircle, Clock, AlertTriangle, XCircle, Home, X, Trash, Phone, Printer } from "lucide-react";
import toast from "react-hot-toast";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useERPSync } from "../../hooks/useERPSync";
import { useAuth } from "../../context/AuthContext";

import { getApiUrl } from "../../lib/api";

export function Reservations() {
  const { loading, isAdmin } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  
  const [form, setForm] = useState({
    client_name: '', client_phone: '', trip_id: '', program: '', room_type: '', seats: '1', agreed_price: '', paid_amount: '', status: 'En attente'
  });

  const [receiptData, setReceiptData] = useState<any>(null);

  const fetchData = React.useCallback(() => {
    fetch(getApiUrl("/api/reservations")).then(r => r.json()).then(setReservations).catch(console.error);
  }, []);
  
  const fetchTrips = React.useCallback(() => {
    fetch(getApiUrl("/api/trips")).then(r => r.json()).then(setTrips).catch(console.error);
  }, []);

  const loadData = React.useCallback(() => {
    fetchData();
    fetchTrips();
  }, [fetchData, fetchTrips]);

  useERPSync(loadData);

  useEffect(() => {
    if (loading || !isAdmin) return;

    loadData();
    const unsub = onSnapshot(collection(db, 'packages'), (snap) => {
      setPackages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [loading, isAdmin, loadData]);
  
  // Logic to auto-fill price based on package
  useEffect(() => {
    if (form.trip_id && form.program && form.room_type) {
      const selectedTrip = trips.find(t => t.id.toString() === form.trip_id);
      if (selectedTrip) {
        const pkg = packages.find(p => p.name === selectedTrip.destination);
        if (pkg) {
          const program = pkg.programs?.find((p: any) => p.name === form.program);
          if (program && program.prices && program.prices[form.room_type]) {
            setForm(prev => ({ ...prev, agreed_price: program.prices[form.room_type].toString() }));
          }
        }
      }
    }
  }, [form.trip_id, form.program, form.room_type, trips, packages]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.trip_id || !form.client_name || !form.agreed_price) {
      toast.error("يرجى ملء كافة الحقول");
      return;
    }
    
    // Check trip capacity
    const selectedTrip = trips.find(t => t.id.toString() === form.trip_id);
    if (selectedTrip && (selectedTrip.remaining_seats || 0) < parseInt(form.seats)) {
      toast.error("لا يوجد عدد كافي من المقاعد المتاحة في هذه الرحلة");
      return;
    }

    try {
      const res = await fetch(getApiUrl("/api/reservations"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطأ مجهول");
      toast.success("تم تأكيد الحجز");
      
      const paidAmt = parseFloat(form.paid_amount);
      if (!isNaN(paidAmt) && paidAmt > 0) {
        setReceiptData({
          client: form.client_name,
          date: new Date().toISOString().split('T')[0],
          amount: paidAmt,
          trip: selectedTrip?.destination || 'Unspecified Trip'
        });
      }

      setForm({ client_name: '', client_phone: '', trip_id: '', program: '', room_type: '', seats: '1', agreed_price: '', paid_amount: '', status: 'En attente' });
      fetchData();
      fetchTrips(); // Refresh remaining seats
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      const res = await fetch(getApiUrl(`/api/reservations/${id}/status`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        toast.success("تم تحديث حالة الحجز");
        fetchData();
      }
    } catch {
      toast.error("حدث خطأ");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الحجز؟")) return;
    try {
      const res = await fetch(getApiUrl(`/api/reservations/${id}`), { method: "DELETE" });
      if (res.ok) {
        toast.success("تم الحذف بنجاح");
        fetchData();
      } else {
        toast.error("حدث خطأ أثناء الحذف");
      }
    } catch {
      toast.error("حدث خطأ أثناء الحذف");
    }
  };

  const handlePayment = async (r: Reservation) => {
    const amountStr = window.prompt(`أدخل المبلغ المراد تسديده لـ ${r.client?.full_name} (المتبقي: ${r.remain}):`);
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      toast.error("مبلغ غير صحيح");
      return;
    }
    
    try {
      const res = await fetch(getApiUrl(`/api/reservations/${r.id}/pay`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount })
      });
      if (res.ok) {
        toast.success("تم تسجيل الدفعة بنجاح");
        setReceiptData({
           client: r.client?.full_name,
           date: new Date().toISOString().split('T')[0],
           amount: amount,
           trip: r.trip_name || r.trip_code
        });
        fetchData();
      } else {
        toast.error("حدث خطأ أثناء تسجيل الدفعة");
      }
    } catch {
      toast.error("حدث خطأ أثناء تسجيل الدفعة");
    }
  };

  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData('reservationId', id.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, statusId: string) => {
    e.preventDefault();
    const idStr = e.dataTransfer.getData('reservationId');
    if (!idStr) return;
    const resId = parseInt(idStr);
    
    const reservation = reservations.find(r => r.id === resId);
    if (reservation && reservation.status !== statusId) {
       // Optimistic UI update
       setReservations(prev => prev.map(r => r.id === resId ? {...r, status: statusId as any} : r));
       await updateStatus(resId, statusId);
    }
  };

  const statuses = [
    { id: 'En attente', label: 'قيد الانتظار', icon: Clock, color: 'bg-amber-100 border-amber-200 text-amber-700', headerBg: 'bg-amber-500' },
    { id: 'Confirmée', label: 'مؤكدة', icon: CheckCircle, color: 'bg-emerald-100 border-emerald-200 text-emerald-700', headerBg: 'bg-emerald-500' },
    { id: 'Annulée-Non-Restituée', label: 'ملغاة بدون استرداد', icon: AlertTriangle, color: 'bg-orange-100 border-orange-200 text-orange-700', headerBg: 'bg-orange-500' },
    { id: 'Annulée-Restituée', label: 'ملغاة مستردة', icon: XCircle, color: 'bg-rose-100 border-rose-200 text-rose-700', headerBg: 'bg-rose-500' },
  ];

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
        <h1 className="text-3xl font-black text-slate-800">إدارة الحجوزات</h1>
        
      {/* Quick Add Form */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
         <div className="flex justify-between items-center mb-4">
           <h3 className="font-bold text-slate-800">إضافة حجز جديد</h3>
         </div>
         <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
           <div className="space-y-1">
             <label className="text-xs font-bold text-slate-500">اسم العميل *</label>
             <div className="relative">
               <input required type="text" placeholder="اسم العميل" value={form.client_name} onChange={e => setForm({...form, client_name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-9 text-sm focus:outline-none focus:border-primary" />
               {form.client_name && (
                 <button type="button" onClick={() => setForm({...form, client_name: ''})} className="absolute right-2 top-2.5 text-slate-400 hover:text-rose-500 cursor-pointer">
                   <X className="w-4 h-4" />
                 </button>
               )}
             </div>
           </div>

           <div className="space-y-1">
             <label className="text-xs font-bold text-slate-500">رقم الهاتف (الواتساب)</label>
             <input type="text" placeholder="مثال: 212600000000" value={form.client_phone} onChange={e => setForm({...form, client_phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
           </div>
           
           <div className="space-y-1">
             <label className="text-xs font-bold text-slate-500">الرحلة المجدولة *</label>
             <select required value={form.trip_id} onChange={e => setForm({...form, trip_id: e.target.value, program: '', room_type: '', agreed_price: '', paid_amount: ''})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary">
               <option value="" disabled>اختر الرحلة</option>
               {trips.map(t => (
                 <option key={t.id} value={t.id} disabled={(t.remaining_seats || 0) <= 0}>{t.code} - {t.destination} (متبقي {t.remaining_seats})</option>
               ))}
             </select>
           </div>

           {(() => {
             const selectedTrip = trips.find(t => t.id.toString() === form.trip_id);
             const pkg = selectedTrip ? packages.find(p => p.name === selectedTrip.destination) : null;
             
             return (
               <>
                 <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500">البرنامج *</label>
                   <select required value={form.program} onChange={e => setForm({...form, program: e.target.value, room_type: '', agreed_price: '', paid_amount: ''})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary disabled:opacity-50" disabled={!pkg || !pkg.programs?.length}>
                     <option value="" disabled>اختر البرنامج</option>
                     {pkg?.programs?.map((p: any) => (
                       <option key={p.name} value={p.name}>{p.name}</option>
                     ))}
                   </select>
                 </div>

                 <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500">الغرفة *</label>
                   <select required value={form.room_type} onChange={e => setForm({...form, room_type: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary disabled:opacity-50" disabled={!form.program}>
                     <option value="" disabled>اختر الغرفة</option>
                     {pkg?.roomTypes?.map((rt: string) => (
                       <option key={rt} value={rt}>{rt}</option>
                     ))}
                   </select>
                 </div>
               </>
             );
           })()}
           
           <div className="space-y-1">
             <label className="text-xs font-bold text-slate-500">عدد الأفراد (المقاعد) *</label>
             <input required type="number" min="1" value={form.seats} onChange={e => setForm({...form, seats: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
           </div>

           <div className="space-y-1">
             <label className="text-xs font-bold text-slate-500">السعر *</label>
             <input required type="number" step="0.01" value={form.agreed_price} onChange={e => setForm({...form, agreed_price: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
           </div>

           <div className="space-y-1">
             <label className="text-xs font-bold text-slate-500">المبلغ المسدد</label>
             <input type="number" step="0.01" value={form.paid_amount} onChange={e => setForm({...form, paid_amount: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
           </div>

           <div className="flex items-end lg:col-span-1">
             <button type="submit" className="w-full bg-primary hover:bg-primary-dark text-white p-2 h-[38px] rounded-xl font-bold flex items-center justify-center transition-colors shadow-sm">
               <Plus className="w-5 h-5 ml-2" />
               إضافة الحجز
             </button>
           </div>
         </form>
      </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
        {statuses.map(col => {
          const colReservations = reservations.filter(r => r.status === col.id);
          return (
            <div 
              key={col.id} 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className="bg-slate-100/50 rounded-3xl border border-slate-200 p-4 flex flex-col min-w-[300px]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full ${col.headerBg} text-white flex items-center justify-center shadow-sm`}>
                    <col.icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-700">{col.label}</h3>
                </div>
                <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-lg text-sm font-bold">{colReservations.length}</span>
              </div>
              
              <div className="flex-1 space-y-3 overflow-y-auto min-h-[200px]">
                {colReservations.map(r => (
                  <div 
                    key={r.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, r.id)}
                    className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow group cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-mono font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">{r.reservation_code}</span>
                      <select 
                        value={r.status}
                        onChange={(e) => updateStatus(r.id, e.target.value)}
                        className={`text-xs font-bold rounded-lg border-0 cursor-pointer focus:ring-0 ${col.color}`}
                      >
                        {statuses.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    </div>
                    
                    <h4 className="font-black text-slate-800 mb-1">{r.client?.full_name || 'عميل غير معروف'}</h4>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-3">
                      <Plane className="w-3 h-3 text-slate-400" /> {r.trip_name || r.trip_code}
                      <span className="mx-1">•</span>
                      <Users className="w-3 h-3 text-slate-400" /> {r.seats} أفراد
                    </div>
                    
                    <div className="pt-3 border-t border-slate-50 flex justify-between items-center">
                      <div className="text-xs font-bold text-slate-400">الإجمالي</div>
                      <div className="font-black text-slate-800" dir="ltr">{new Intl.NumberFormat('ar-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(r.agreed_price)}</div>
                    </div>
                    
                    {(r.remain !== undefined && r.remain > 0) && (
                      <div className="mt-2 text-[10px] font-bold text-rose-500 bg-rose-50 rounded pl-2 pr-2 py-1 flex justify-between tracking-wide">
                        <span>المتبقي:</span>
                        <span dir="ltr">{new Intl.NumberFormat('ar-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(r.remain)}</span>
                      </div>
                    )}

                    <div className="mt-3 flex gap-2 justify-end flex-wrap">
                      {(r.remain !== undefined && r.remain > 0 && r.client?.phone) && (
                        <a 
                          href={`https://wa.me/${r.client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`مرحباً ${r.client?.full_name}، نود تذكيركم بأن هناك مبلغ متبقي قدره ${r.remain} درهم بخصوص حجز رحلة ${r.trip_name || r.trip_code || ''}. نشكركم على ثقتكم.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 px-2 text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded font-bold transition-colors flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          تذكير
                        </a>
                      )}
                      {(r.remain !== undefined && r.remain > 0) && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handlePayment(r); }} 
                          className="p-1 px-2 text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded font-bold transition-colors"
                        >
                          إضافة دفعة
                        </button>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }} 
                        className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Receipt Modal */}
      {receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:bg-white print:p-0">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-xl print:shadow-none print:w-full print:max-w-none print:rounded-none">
            <div className="print:hidden flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
                تم الدفع بنجاح
              </h2>
              <button onClick={() => setReceiptData(null)} className="text-slate-400 hover:text-rose-500 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 print:p-10" id="receipt-content">
              <div className="text-center mb-8 border-b-2 border-slate-100 pb-8">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">بوابة مكة</h1>
                <p className="text-slate-500 mt-1 font-bold">إيصال سداد</p>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                  <span className="text-slate-500 font-bold">التاريخ</span>
                  <span className="font-bold text-slate-800">{receiptData.date}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                  <span className="text-slate-500 font-bold">العميل</span>
                  <span className="font-bold text-slate-800">{receiptData.client}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                  <span className="text-slate-500 font-bold">البيان (الرحلة)</span>
                  <span className="font-bold text-slate-800">{receiptData.trip}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl print:border print:border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-slate-800">المبلغ المسدد</span>
                  <span className="text-2xl font-black text-emerald-600" dir="ltr">
                    {new Intl.NumberFormat('ar-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(receiptData.amount)}
                  </span>
                </div>
              </div>

              <div className="mt-12 text-center text-sm text-slate-400 font-bold">
                <p>شكراً لثقتكم بنا.</p>
                <p className="mt-1">تم إصدار هذا الإيصال إلكترونياً.</p>
              </div>
            </div>

            <div className="print:hidden p-6 border-t border-slate-100 flex gap-3 bg-slate-50/50">
              <button 
                onClick={() => window.print()} 
                className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl transition-all shadow-sm hover:shadow flex items-center justify-center gap-2"
              >
                <Printer className="w-5 h-5" />
                طباعة / حفظ PDF
              </button>
              <button 
                onClick={() => setReceiptData(null)} 
                className="flex-1 py-3 text-slate-600 font-bold border border-slate-200 bg-white hover:bg-slate-50 rounded-xl transition-all shadow-sm"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
