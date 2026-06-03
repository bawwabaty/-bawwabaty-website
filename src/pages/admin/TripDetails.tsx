import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, FileText, BedDouble, Users, Wallet, TrendingUp, Download, Trash2 } from "lucide-react";
import { Trip, Reservation, Expense } from "../../erp-types";
import toast from "react-hot-toast";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { getApiUrl } from "../../lib/api";

export function TripDetails() {
  const { id } = useParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [activeTab, setActiveTab] = useState<'reservations' | 'expenses' | 'rooming'>('reservations');

  useEffect(() => {
    fetch(getApiUrl(`/api/trips/${id}`))
      .then(r => r.json())
      .then(data => {
        setTrip(data);
        setReservations(data.reservations || []);
        setExpenses(data.expenses || []);
      })
      .catch(console.error);
  }, [id]);

  if (!trip) return <div className="text-center p-12">جاري التحميل...</div>;

  const formatCurrency = (v: number) => new Intl.NumberFormat('ar-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(v);
  
  const totalRevenue = reservations.filter(r => r.status !== 'Annulée-Restituée').reduce((sum, r) => sum + (parseFloat(r.agreed_price as any) || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount as any) || 0), 0);
  const profit = totalRevenue - totalExpenses;
  const isProfitable = profit >= 0;
  
  const bookedSeats = reservations.filter(r => r.status !== 'Annulée-Restituée').reduce((sum, r) => sum + (Number(r.seats) || 1), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <Link to="/admin/trips" className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-full transition-colors text-slate-500">
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-800">{trip.destination}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${isProfitable ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {isProfitable ? 'رابحة' : 'خاسرة'}
              </span>
            </div>
            <div className="text-sm text-slate-500 mt-1 font-medium">{trip.code} | {trip.start_date} إلى {trip.end_date}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-sm transition-colors shadow-sm">
            <FileText className="w-4 h-4 text-slate-400" />
            تقرير التقدير Devis
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-sm transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            Rooming List
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 mb-1">الامتلاء (المقاعد المنحجزة)</div>
            <div className="text-xl font-black text-slate-800">{bookedSeats} <span className="text-sm font-medium text-slate-400">من {trip.capacity}</span></div>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500"><Users className="w-5 h-5" /></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 mb-1">المدخول الإجمالي للرحلة</div>
            <div className="text-xl font-black text-slate-800" dir="ltr">{formatCurrency(totalRevenue)}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500"><TrendingUp className="w-5 h-5" /></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 mb-1">المصاريف المتراكمة</div>
            <div className="text-xl font-black text-slate-800" dir="ltr">{formatCurrency(totalExpenses)}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500"><Wallet className="w-5 h-5" /></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 mb-1">الربحية الصافية</div>
            <div className={`text-xl font-black ${isProfitable ? 'text-emerald-500' : 'text-rose-500'}`} dir="ltr">{formatCurrency(profit)}</div>
          </div>
          <div className={`w-10 h-10 rounded-full ${isProfitable ? 'bg-emerald-50' : 'bg-rose-50'} flex items-center justify-center ${isProfitable ? 'text-emerald-600' : 'text-rose-600'}`}>
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          <button onClick={() => setActiveTab('reservations')} className={`flex-1 py-4 font-bold text-sm text-center transition-colors border-b-2 ${activeTab === 'reservations' ? 'border-primary text-primary bg-white' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}>
            الحجوزات والركاب ({reservations.length})
          </button>
          <button onClick={() => setActiveTab('expenses')} className={`flex-1 py-4 font-bold text-sm text-center transition-colors border-b-2 ${activeTab === 'expenses' ? 'border-primary text-primary bg-white' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}>
            مصاريف الرحلة ({expenses.length})
          </button>
          <button onClick={() => setActiveTab('rooming')} className={`flex-1 py-4 font-bold text-sm text-center transition-colors border-b-2 ${activeTab === 'rooming' ? 'border-primary text-primary bg-white' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}>
            توزيع الغرف Rooming List
          </button>
        </div>
        <div className="p-6">
          {activeTab === 'reservations' && (
            <div className="overflow-x-auto">
              <table className="w-full text-right whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-bold rounded-r-xl">المرجع PNR</th>
                    <th className="px-4 py-3 font-bold">اسم العميل / المنظم</th>
                    <th className="px-4 py-3 font-bold">المقاعد</th>
                    <th className="px-4 py-3 font-bold">السعر المتفق</th>
                    <th className="px-4 py-3 font-bold rounded-l-xl">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {reservations.length === 0 && (<tr><td colSpan={5} className="py-8 text-center text-slate-400">لا يوجد حجوزات مرتبطة بالرحلة</td></tr>)}
                  {reservations.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 font-mono text-sm text-slate-600">{r.reservation_code}</td>
                      <td className="px-4 py-4 font-bold text-slate-800">{r.client?.full_name || (r as any).client_name}</td>
                      <td className="px-4 py-4 font-bold text-slate-700">{r.seats}</td>
                      <td className="px-4 py-4 font-bold text-emerald-600" dir="ltr">{formatCurrency(r.agreed_price)}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${r.status === 'Confirmée' ? 'bg-emerald-100 text-emerald-700' : r.status === 'En attente' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'expenses' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {expenses.length === 0 && <div className="col-span-full py-8 text-center text-slate-400">لا توجد مصاريف خاصة رحلة</div>}
              {expenses.map(e => (
                <div key={e.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50 hover:bg-white hover:shadow-sm transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                       <span className="text-xs font-bold bg-slate-200 text-slate-700 px-2 py-1 rounded">{e.type}</span>
                       <span className="text-xs text-slate-400">{e.date.split('T')[0]}</span>
                    </div>
                    <div className="font-bold text-slate-800 text-lg mb-2">{e.description}</div>
                  </div>
                  <div className="font-black text-xl text-rose-600 border-t border-slate-200 pt-3 mt-2" dir="ltr">
                    {formatCurrency(e.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'rooming' && (
            <RoomingList reservations={reservations} tripName={trip.destination} tripCode={trip.code} onSave={async (updates) => {
              for (const u of updates) {
                await fetch(getApiUrl(`/api/reservations/${u.id}/status`), { // Mock endpoint to save notes or update it
                   method: 'PUT',
                   headers: {'Content-Type': 'application/json'},
                   body: JSON.stringify(u)
                });
              }
              toast.success("تم حفظ توزيع الغرف");
            }} />
          )}
        </div>
      </div>
    </div>
  );
}

function RoomingList({ reservations, tripName, tripCode, onSave }: { reservations: Reservation[], tripName: string, tripCode: string, onSave: (updates: any[]) => void }) {
  const [unassigned, setUnassigned] = useState<Reservation[]>([]);
  const [rooms, setRooms] = useState<{id: string, name: string, capacity: number, program?: string, roomType?: string, reservations: Reservation[]}[]>([]);
  const [packageData, setPackageData] = useState<any>(null);

  useEffect(() => {
    const fetchPackageAndSetup = async () => {
      const validRes = reservations.filter(r => r.status === 'Confirmée');
      
      try {
        const q = query(collection(db, 'packages'), where('name', '==', tripName));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          const pkgData = snap.docs[0].data();
          setPackageData(pkgData);
          const programs = pkgData.programs || [];
          const roomTypes = pkgData.roomTypes || [];
          
          let generatedRooms: any[] = [];
          
          // First, group reservations by program and room_type
          const resGroups: Record<string, Reservation[]> = {};
          validRes.forEach(res => {
             const key = `${res.program || 'unknown'}-${res.room_type || 'unknown'}`;
             if (!resGroups[key]) resGroups[key] = [];
             resGroups[key].push(res);
          });
          
          let index = 1;
          
          programs.forEach((prog: any) => {
            roomTypes.forEach((rt: string) => {
              let capacity = 4;
              if (rt.includes('ثنائي') || rt.includes('2')) capacity = 2;
              else if (rt.includes('ثلاثي') || rt.includes('3')) capacity = 3;
              else if (rt.includes('رباعي') || rt.includes('4')) capacity = 4;
              else if (rt.includes('خماسي') || rt.includes('5')) capacity = 5;
              
              const key = `${prog.name}-${rt}`;
              const matchingRes = resGroups[key] || [];
              
              // Create enough rooms to hold the reservations of this type
              let currentRoomReservations: Reservation[] = [];
              let currentRoomSeats = 0;
              
              matchingRes.forEach(res => {
                 const seats = Number(res.seats) || 1;
                 if (currentRoomSeats + seats > capacity && currentRoomReservations.length > 0) {
                    // Push current room and start a new one
                    generatedRooms.push({
                      id: `room_${index++}`,
                      name: `غرفة ${index-1}`,
                      program: prog.name,
                      roomType: rt,
                      capacity: capacity,
                      reservations: currentRoomReservations
                    });
                    currentRoomReservations = [];
                    currentRoomSeats = 0;
                 }
                 currentRoomReservations.push(res);
                 currentRoomSeats += seats;
              });
              
              // Always create at least one room for this combination, or push the remaining one
              generatedRooms.push({
                id: `room_${index++}`,
                name: `غرفة ${index-1}`,
                program: prog.name,
                roomType: rt,
                capacity: capacity,
                reservations: currentRoomReservations
              });
            });
          });
          
          if (generatedRooms.length > 0) {
            // Find reservations that didn't match any generated room program/type
            const assignedResIds = new Set(generatedRooms.flatMap(r => r.reservations.map(res => res.id)));
            const unassignedRes = validRes.filter(r => !assignedResIds.has(r.id));
            
            setUnassigned(unassignedRes);
            setRooms(generatedRooms);
            return;
          }
        }
      } catch (err) {
        console.error(err);
      }
      
      // Fallback
      const initialRooms = Array.from({length: 10}).map((_, i) => ({
        id: `room_${i+1}`,
        name: `غرفة ${i+1}`,
        capacity: 4,
        reservations: [] as Reservation[]
      }));
      setUnassigned(validRes);
      setRooms(initialRooms);
    };
    
    fetchPackageAndSetup();
  }, [reservations, tripName]);

  const handleDragStart = (e: React.DragEvent, resId: number, sourceRoomId: string | null) => {
    e.dataTransfer.setData('resId', resId.toString());
    e.dataTransfer.setData('source', sourceRoomId || 'unassigned');
  };

  const handleDrop = (e: React.DragEvent, targetRoomId: string | null) => {
    e.preventDefault();
    const resId = parseInt(e.dataTransfer.getData('resId'));
    const sourceId = e.dataTransfer.getData('source');

    if (sourceId === (targetRoomId || 'unassigned')) return;

    let resCard: Reservation | undefined;
    
    // Extract from source
    if (sourceId === 'unassigned') {
      resCard = unassigned.find(r => r.id === resId);
      setUnassigned(prev => prev.filter(r => r.id !== resId));
    } else {
      const sourceRoom = rooms.find(r => r.id === sourceId);
      if (sourceRoom) {
        resCard = sourceRoom.reservations.find(r => r.id === resId);
        setRooms(prev => prev.map(r => r.id === sourceId ? { ...r, reservations: r.reservations.filter(rs => rs.id !== resId) } : r));
      }
    }

    if (!resCard) return;

    // Add to target
    if (targetRoomId === null) {
      setUnassigned(prev => [...prev, resCard!]);
    } else {
      setRooms(prev => prev.map(r => r.id === targetRoomId ? { ...r, reservations: [...r.reservations, resCard!] } : r));
    }
  };

  const exportExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      
      const data: any[] = [];
      rooms.filter(r => r.reservations.length > 0).forEach(room => {
        room.reservations.forEach(res => {
          data.push({
            'رقم الغرفة': room.name,
            'اسم العميل/الجهة': res.client?.full_name || res.client_name,
            'عدد الأفراد': res.seats,
            'نوع الغرفة المطلوبة': res.room_type || '-',
            'البرنامج': res.program || '-',
            'رقم الحجز': res.reservation_code
          });
        });
      });

      const ws = XLSX.utils.json_to_sheet(data);
      ws['!dir'] = 'rtl';
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Rooming List");
      XLSX.writeFile(wb, `RoomingList_${tripCode}.xlsx`);
    } catch (e) {
      console.error(e);
      alert("Please ensure xlsx is installed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
         <div>
           <h3 className="font-bold text-slate-800">توزيع الغرف التفاعلي</h3>
           <p className="text-sm text-slate-500">اسحب الحجوزات المؤكدة ووزعها على الغرف</p>
         </div>
         <div className="flex gap-2">
           <button onClick={() => setRooms(prev => [...prev, { id: `room_${Date.now()}`, name: `غرفة جديدة`, capacity: 4, reservations: [] }])} className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-bold text-sm transition-colors cursor-pointer">
             + إضافة غرفة
           </button>
           <button onClick={exportExcel} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm transition-colors cursor-pointer shadow-sm">
             تصدير ملف Excel
           </button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
         <div 
           className="col-span-1 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-4 min-h-[400px]"
           onDragOver={e => e.preventDefault()}
           onDrop={e => handleDrop(e, null)}
         >
           <h4 className="font-bold text-slate-700 mb-4 sticky top-0">غير موزعة ({unassigned.length})</h4>
           <div className="space-y-3">
             {unassigned.map(res => (
               <div 
                 key={res.id} 
                 draggable
                 onDragStart={e => handleDragStart(e, res.id, null)}
                 className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:border-primary transition-colors"
               >
                 <div className="font-bold text-sm text-slate-800 mb-1">{res.client?.full_name || res.client_name}</div>
                 <div className="flex gap-2 text-xs font-bold text-slate-500">
                    <span className="bg-slate-100 px-2 py-0.5 rounded">{res.seats} ركاب</span>
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">{res.room_type || 'غير محدد'}</span>
                 </div>
               </div>
             ))}
           </div>
         </div>

         <div className="col-span-1 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {rooms.map(room => {
              const currentSeats = room.reservations.reduce((s, r) => s + (Number(r.seats) || 1), 0);
              return (
              <div 
                key={room.id}
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleDrop(e, room.id)}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col min-h-[150px]"
              >
                <div className="flex justify-between items-center mb-1 pb-1">
                  <div className="flex items-center gap-2">
                    <input type="text" value={room.name} onChange={e => setRooms(prev => prev.map(r => r.id === room.id ? {...r, name: e.target.value} : r))} className="font-bold text-slate-800 max-w-[120px] focus:outline-none focus:border-b focus:border-primary border-b border-transparent" />
                    <button onClick={() => {
                        setUnassigned(prev => [...prev, ...room.reservations]);
                        setRooms(prev => prev.filter(r => r.id !== room.id));
                    }} className="text-slate-400 hover:text-rose-500 transition-colors" title="حذف الغرفة">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${currentSeats > room.capacity ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>{currentSeats} / {room.capacity}</span>
                </div>
                
                <div className="flex gap-2 mb-3 border-b border-slate-100 pb-2">
                   <div className="flex-1">
                     <select value={room.program || ''} onChange={e => setRooms(prev => prev.map(r => r.id === room.id ? {...r, program: e.target.value} : r))} className="w-full text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-primary">
                        <option value="">اختر البرنامج</option>
                        {packageData?.programs?.map((p: any) => (
                           <option key={p.name} value={p.name}>{p.name}</option>
                        ))}
                     </select>
                   </div>
                   <div className="flex-1">
                     <select value={room.roomType || ''} onChange={e => {
                        const newType = e.target.value;
                        let newCapacity = room.capacity;
                        if (newType.includes('ثنائي') || newType.includes('2')) newCapacity = 2;
                        else if (newType.includes('ثلاثي') || newType.includes('3')) newCapacity = 3;
                        else if (newType.includes('رباعي') || newType.includes('4')) newCapacity = 4;
                        else if (newType.includes('خماسي') || newType.includes('5')) newCapacity = 5;
                        setRooms(prev => prev.map(r => r.id === room.id ? {...r, roomType: newType, capacity: newCapacity} : r));
                     }} className="w-full text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-primary">
                        <option value="">اختر الغرفة</option>
                        {packageData?.roomTypes?.map((rt: string) => (
                           <option key={rt} value={rt}>{rt}</option>
                        ))}
                     </select>
                   </div>
                </div>
                
                <div className="flex-1 space-y-2">
                  {room.reservations.length === 0 && <div className="text-center text-xs text-slate-400 py-4 font-medium">اسحب الحجوزات إلى هنا</div>}
                  {room.reservations.map(res => (
                    <div 
                      key={res.id}
                      draggable
                      onDragStart={e => handleDragStart(e, res.id, room.id)}
                      className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-sm cursor-grab flex justify-between items-center"
                    >
                      <div className="font-bold text-slate-700 truncate mr-2" title={res.client?.full_name || res.client_name}>{res.client?.full_name || res.client_name}</div>
                      <div className="text-xs font-bold bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">{res.seats}</div>
                    </div>
                  ))}
                </div>
              </div>
            )})}
         </div>
      </div>
    </div>
  );
}
