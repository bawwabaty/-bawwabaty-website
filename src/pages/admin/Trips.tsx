import { useState, useEffect } from "react";
import { Plane, Calendar, Users, DollarSign, Calculator, ArrowLeft, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Trip } from "../../erp-types";

export function Trips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [simForm, setSimForm] = useState({ expenses: '', margin: '' });
  const [simResult, setSimResult] = useState<any>(null);
  const [loadingSim, setLoadingSim] = useState(false);
  
  const [tripForm, setTripForm] = useState({
    code: '', destination: '', capacity: '', default_price: '', start_date: '', end_date: ''
  });

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = () => {
    fetch("/api/trips")
      .then(r => r.json())
      .then(setTrips)
      .catch(console.error);
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSim(true);
    try {
      const res = await fetch("/api/trips/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expected_expenses: simForm.expenses, profit_margin: simForm.margin })
      });
      const data = await res.json();
      setSimResult(data);
    } catch {
      toast.error('حدث خطأ أثناء الحساب');
    } finally {
      setLoadingSim(false);
    }
  };

  const handleAddTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tripForm)
      });
      if (res.ok) {
        toast.success("تم إضافة الرحلة بنجاح");
        setTripForm({ code: '', destination: '', capacity: '', default_price: '', start_date: '', end_date: '' });
        fetchTrips();
      }
    } catch {
      toast.error('حدث خطأ');
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black text-slate-800">إدارة الرحلات والعروض</h1>

      <div className="pt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {trips.map(trip => {
            const currentCapacity = Number(trip.capacity) || 1;
            const currentBooked = Number(trip.booked_seats) || 0;
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
      </div>
    </div>
  );
}
