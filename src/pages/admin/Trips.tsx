import React, { useState, useEffect } from "react";
import { Plane, Calendar, Users, DollarSign, Calculator, ArrowLeft, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { getApiUrl } from "../../lib/api";
import { Trip } from "../../erp-types";
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export function Trips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [autoSyncing, setAutoSyncing] = useState(true);

  useEffect(() => {
    initializeAndSyncTrips();
  }, []);

  const getMinPrice = (pkg: any) => {
    if (!pkg.programs || pkg.programs.length === 0) return 0;
    let min = Infinity;
    pkg.programs.forEach((p: any) => {
      Object.values(p.prices || {}).forEach((price: any) => {
        if (price > 0 && price < min) min = price;
      });
    });
    return min === Infinity ? 0 : min;
  };

  const initializeAndSyncTrips = async () => {
    setAutoSyncing(true);
    try {
      // 1. Load ERP Trips
      const resTrips = await fetch(getApiUrl("/api/trips"));
      if (!resTrips.ok) {
        const errorText = await resTrips.text();
        throw new Error(`Failed to load ERP trips (${resTrips.status}): ${errorText}`);
      }
      const erpTrips: Trip[] = await resTrips.json();

      // 2. Load Firestore Packages
      const q = query(collection(db, 'packages'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const packages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 3. Find missing packages or ones that need updating
      const tripsToSync = packages.filter((pkg: any) => {
        const matchingTrip = erpTrips.find((t: any) => t.package_id === pkg.id);
        return !matchingTrip || matchingTrip.destination !== pkg.name; // Keep it simple
      });

      // 4. Sync each missing/updated package concurrently to avoid timeouts
      await Promise.all(tripsToSync.map(async (pkg: any) => {
        try {
          const syncRes = await fetch(getApiUrl("/api/trips/sync"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: pkg.id,
              name: pkg.name,
              capacity: pkg.capacity || 50,
              minPrice: getMinPrice(pkg),
              image: pkg.image || ''
            })
          });
          if (!syncRes.ok) {
            const errData = await syncRes.text();
            console.error("Sync failed for package", pkg.id, errData);
          }
        } catch (syncErr) {
          console.error("Network or timeout error syncing package", pkg.id, syncErr);
        }
      }));

      // 5. Refetch ERP Trips
      const finalRes = await fetch(getApiUrl("/api/trips"));
      if (!finalRes.ok) throw new Error("Failed to refetch trips");
      const finalTrips = await finalRes.json();
      setTrips(finalTrips);
    } catch (err: any) {
      console.error("SYNC_ERROR_DETAILS:", err);
      toast.error('حدث خطأ أثناء مزامنة وتحميل البيانات: ' + (err.message || 'خطأ مجهول'));
    } finally {
      setAutoSyncing(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black text-slate-800">إدارة الرحلات والعروض</h1>

      <div className="pt-2">
        {autoSyncing ? (
          <div className="text-center py-12">
             <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
             <p className="text-slate-500 font-bold">جاري المزامنة التلقائية مع نظام الباقات وتحميل البيانات...</p>
          </div>
        ) : trips.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-dashed border-slate-200 text-center max-w-2xl mx-auto mt-8">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
              <Plane className="w-10 h-10 text-slate-400 rotate-12" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-3">لا توجد رحلات مجدولة حالياً</h3>
            <p className="text-slate-500 font-medium max-w-md mb-8 leading-relaxed">
              تتم مزامنة هذه الصفحة تلقائياً مع نظام الباقات. يبدو أنه لا توجد باقات مدخلة حتى الآن.
            </p>
            <Link 
              to="/admin/packages" 
              className="px-6 py-3.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            >
              الذهاب إلى إدارة الباقات
              <ArrowUpRight className="w-5 h-5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {trips.map(trip => {
              const currentCapacity = Number(trip.capacity) || 1;
              const currentBooked = Number((trip as any).booked_seats) || 0;
              const fillPerc = Math.min(100, Math.round((currentBooked / currentCapacity) * 100)) || 0;
              let barColor = "bg-blue-500";
              if (fillPerc >= 90) barColor = "bg-rose-500";
              else if (fillPerc >= 70) barColor = "bg-orange-500";

              return (
                <div key={trip.id} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col group">
                  <div className="h-32 relative flex items-end p-4">
                    <div className="absolute inset-0 bg-slate-900/60 z-10"></div>
                    <img src={trip.image || `https://images.unsplash.com/photo-1565552643952-ec7c7d75d4ce?q=80&w=600&auto=format&fit=crop&seed=${trip.id}`} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={trip.destination} />
                    <div className="relative z-20 w-full flex justify-between items-end">
                      <div>
                         <span className="bg-white/20 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full mb-2 inline-block">{trip.code}</span>
                         <h3 className="text-xl font-bold text-white line-clamp-1">{trip.destination}</h3>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-5 flex flex-col flex-1">
                     <div className="flex justify-between items-center mb-4">
                       <div className="text-sm text-slate-500 font-medium">التسعير الأساسي</div>
                       <div className="font-black text-lg text-slate-800" dir="ltr">{new Intl.NumberFormat('ar-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(trip.default_price)}</div>
                     </div>
                     
                     <div className="flex items-center gap-2 text-sm text-slate-500 mb-6 font-medium">
                       <Calendar className="w-4 h-4" />
                       {trip.start_date} <ArrowLeft className="w-3 h-3 mx-1" /> {trip.end_date}
                     </div>
                     
                     <div className="mt-auto">
                       <div className="flex justify-between text-xs mb-2 font-bold">
                         <span className="text-slate-500">حجز {currentBooked} من {currentCapacity}</span>
                         <span className={fillPerc >= 90 ? 'text-rose-500' : 'text-slate-600'}>{fillPerc}%</span>
                       </div>
                       <div className="w-full bg-slate-100 rounded-full h-2 mb-6">
                         <div className={`${barColor} h-2 rounded-full transition-all duration-1000`} style={{ width: `${fillPerc}%` }}></div>
                       </div>
                       
                       <Link to={`/admin/trips/${trip.id}`} className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-primary font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 border border-slate-200">
                         إدارة الملف التفصيلي
                         <ArrowUpRight className="w-4 h-4" />
                       </Link>
                     </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
}
