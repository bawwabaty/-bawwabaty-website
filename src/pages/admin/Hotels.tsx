import { useState } from 'react';
import { Building2, Plus } from 'lucide-react';

export function AdminHotels() {
  const [hotels] = useState([
    { id: '1', name: 'فندق ساعة مكة فيرمونت', city: 'مكة المكرمة', stars: 5 },
    { id: '2', name: 'فندق بولمان زمزم المدينة', city: 'المدينة المنورة', stars: 5 },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">إدارة الفنادق</h2>
          <p className="text-slate-500">إدارة الفنادق المعروضة في الباقات</p>
        </div>
        <button className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2">
          <Plus className="w-5 h-5" />
          إضافة فندق
        </button>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
        <table className="w-full text-right">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 font-bold text-slate-700">الاسم</th>
              <th className="px-6 py-4 font-bold text-slate-700">المدينة</th>
              <th className="px-6 py-4 font-bold text-slate-700">التقييم</th>
              <th className="px-6 py-4 font-bold text-slate-700">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {hotels.map((hotel) => (
              <tr key={hotel.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  {hotel.name}
                </td>
                <td className="px-6 py-4 text-slate-600">{hotel.city}</td>
                <td className="px-6 py-4 text-secondary font-bold">{hotel.stars} نجوم</td>
                <td className="px-6 py-4">
                  <button className="text-primary hover:text-primary-dark font-medium px-3 py-1 bg-primary/10 rounded-lg">تعديل</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
