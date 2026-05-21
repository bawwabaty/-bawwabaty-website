import { useState } from 'react';
import { Users, UserPlus } from 'lucide-react';

export function AdminUsers() {
  const [users] = useState([
    { id: '1', name: 'المدير العام', email: 'admin@bawwabaty.com', role: 'admin' },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">إدارة المستخدمين</h2>
          <p className="text-slate-500">إدارة مدراء النظام والصلاحيات</p>
        </div>
        <button className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          مستخدم جديد
        </button>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
        <table className="w-full text-right">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 font-bold text-slate-700">الاسم</th>
              <th className="px-6 py-4 font-bold text-slate-700">البريد الإلكتروني</th>
              <th className="px-6 py-4 font-bold text-slate-700">الصلاحية</th>
              <th className="px-6 py-4 font-bold text-slate-700">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  {user.name}
                </td>
                <td className="px-6 py-4 text-slate-600">{user.email}</td>
                <td className="px-6 py-4">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">مدير نظام</span>
                </td>
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
