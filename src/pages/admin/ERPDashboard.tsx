import { useState, useEffect, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, CreditCard, Receipt, Wallet, Plane } from "lucide-react";
import { Trip } from "../../erp-types";
import { getApiUrl } from "../../lib/api";
import { useERPSync } from "../../hooks/useERPSync";

export function ERPDashboard() {
  const [stats, setStats] = useState({
    chiffre_d_affaires: 0,
    total_paiement: 0,
    total_charges: 0,
    rentabilite: 0
  });
  const [trips, setTrips] = useState<Trip[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  const fetchDashboardData = useCallback(() => {
    fetch(getApiUrl("/api/dashboard"))
      .then(r => r.json())
      .then(setStats)
      .catch(console.error);

    fetch(getApiUrl("/api/trips"))
      .then(r => r.json())
      .then(setTrips)
      .catch(console.error);

    fetch(getApiUrl("/api/cash-journal"))
      .then(r => r.json())
      .then(journal => {
         // Aggregate by date for chart (simple mock aggregation)
         const grouped: Record<string, any> = {};
         [...journal].reverse().forEach((j: any) => {
            const date = j.date.split("T")[0];
            if (!grouped[date]) grouped[date] = { date, income: 0, expense: 0 };
            if (j.type === 'Encaissement') grouped[date].income += parseFloat(j.amount);
            else grouped[date].expense += parseFloat(j.amount);
         });
         const data = Object.values(grouped).slice(-15);
         if (data.length === 0) {
            // Mock data if empty
            const mock = [];
            for (let i = 10; i >= 1; i--) {
               const d = new Date();
               d.setDate(d.getDate() - i);
               mock.push({ date: d.toISOString().split('T')[0], income: Math.round(Math.random() * 5000), expense: Math.round(Math.random() * 3000) });
            }
            setChartData(mock);
         } else {
            setChartData(data);
         }
      })
      .catch(console.error);
  }, []);

  useERPSync(fetchDashboardData);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('ar-MA', { style: 'currency', currency: 'MAD' }).format(val);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-slate-800">لوحة المحاسبة</h1>
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-3 rounded-2xl font-bold flex items-center gap-3 shadow-sm">
          <Wallet className="w-6 h-6" />
          <div className="text-sm opacity-80">رصيد الصندوق الفوري:</div>
          <div className="text-lg" dir="ltr">{formatCurrency(stats.total_paiement - stats.total_charges)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="إجمالي المبيعات المؤكدة" value={stats.chiffre_d_affaires} icon={TrendingUp} color="blue" />
        <StatCard title="إجمالي المقبوضات (الصندوق)" value={stats.total_paiement} icon={CreditCard} color="emerald" />
        <StatCard title="إجمالي المصاريف" value={stats.total_charges} icon={Receipt} color="rose" />
        <StatCard title="صافي الربح" value={stats.rentabilite} icon={Wallet} color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-6">البيانات المالية (مداخيل مقابل مصاريف)</h2>
          <div className="h-80 w-full" dir="ltr">
            <ResponsiveContainer>
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(value) => `${value}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                />
                <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={3} name="المدخول" />
                <Area type="monotone" dataKey="expense" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={3} name="المصاريف" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
          <h2 className="text-xl font-bold text-slate-800 mb-6">حالة الرحلات</h2>
          <div className="space-y-4 flex-1 overflow-y-auto">
            {trips.length === 0 && <div className="text-slate-500 text-center py-10">لا توجد رحلات حالية.</div>}
            {trips.map(trip => {
               const fillPerc = Math.min(100, Math.round(((trip.booked_seats || 0) / (trip.capacity || 1)) * 100)) || 0;
               let barColor = "bg-blue-500";
               if (fillPerc >= 90) barColor = "bg-rose-500";
               else if (fillPerc >= 70) barColor = "bg-orange-500";
               
               return (
                 <div key={trip.id} className="p-4 rounded-2xl border border-slate-100 hover:shadow-md transition-shadow group">
                   <div className="flex justify-between items-start mb-2">
                     <div className="flex items-center gap-2">
                       <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                         <Plane className="w-4 h-4" />
                       </div>
                       <div>
                         <div className="font-bold text-slate-800">{trip.code}</div>
                         <div className="text-xs text-slate-500">{trip.destination}</div>
                       </div>
                     </div>
                     <div className="text-left">
                       <div className="text-xs text-slate-500">صافي الربح</div>
                       <div className={`font-bold ${(trip.net_profit || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} dir="ltr">
                         {formatCurrency(trip.net_profit || 0)}
                       </div>
                     </div>
                   </div>
                   <div className="mt-3">
                     <div className="flex justify-between text-xs mb-1 font-bold">
                       <span className="text-slate-500">حجز {trip.booked_seats} من {trip.capacity}</span>
                       <span className={fillPerc >= 90 ? 'text-rose-500' : 'text-slate-600'}>{fillPerc}%</span>
                     </div>
                     <div className="w-full bg-slate-100 rounded-full h-2">
                       <div className={`${barColor} h-2 rounded-full transition-all duration-1000`} style={{ width: `${fillPerc}%` }}></div>
                     </div>
                   </div>
                 </div>
               )
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
    indigo: 'bg-indigo-50 text-indigo-600'
  };
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <h3 className="text-slate-500 font-bold text-sm">{title}</h3>
        <div className={`p-3 rounded-2xl ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="text-3xl font-black text-slate-800 mt-4" dir="ltr">
        {new Intl.NumberFormat('ar-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(value)}
      </div>
    </div>
  );
}
