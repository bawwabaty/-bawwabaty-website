import { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, ShieldOff, Trash2 } from 'lucide-react';
import { collection, onSnapshot, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersList: any[] = [];
      snapshot.forEach((doc) => {
        usersList.push({ id: doc.id, ...doc.data() });
      });
      setUsers(usersList);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching users: ', error);
      toast.error('حدث خطأ أثناء جلب المستخدمين');
      setLoading(false);
    });
    
    return () => unsub();
  }, []);

  const toggleRole = async (userId: string, currentRole: string) => {
    if (userId === currentUser?.uid) {
        toast.error('لا يمكنك تغيير صلاحيتك الشخصية');
        return;
    }
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
        await updateDoc(doc(db, 'users', userId), { role: newRole });
        toast.success(`تم تحويل المستخدم إلى ${newRole === 'admin' ? 'مدير' : 'مستخدم عادي'}`);
    } catch (error) {
        console.error(error);
        toast.error('حدث خطأ أثناء تعديل الصلاحية');
    }
  };

  const handleDelete = async (userId: string) => {
    if (userId === currentUser?.uid) {
        toast.error('لا يمكنك حذف حسابك الشخصي');
        return;
    }
    if (!window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
    try {
        await deleteDoc(doc(db, 'users', userId));
        toast.success('تم حذف المستخدم بنجاح');
    } catch (error) {
        console.error(error);
        toast.error('تأكد من أنك تملك صلاحيات كافية لحذف المستخدم');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">إدارة المستخدمين</h2>
          <p className="text-slate-500">إدارة مدراء النظام والصلاحيات</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-right min-w-[600px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-700">الاسم</th>
                <th className="px-6 py-4 font-bold text-slate-700">البريد الإلكتروني</th>
                <th className="px-6 py-4 font-bold text-slate-700">الصلاحية</th>
                <th className="px-6 py-4 font-bold text-slate-700">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">جاري التحميل...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">لا يوجد مستخدمين آخرين</td>
                </tr>
              ) : users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    {user.name}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${user.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                        {user.role === 'admin' ? 'مدير نظام' : 'مستخدم'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                        {user.role === 'admin' ? (
                           <button onClick={() => toggleRole(user.id, user.role)} title="إزالة صلاحية المدير" className="text-amber-600 hover:text-amber-700 font-medium px-3 py-1 bg-amber-50 rounded-lg transition-colors flex items-center gap-1"><ShieldOff className="w-4 h-4"/> إزالة كمدير</button>
                        ) : (
                           <button onClick={() => toggleRole(user.id, user.role)} title="ترقية إلى مدير" className="text-blue-600 hover:text-blue-700 font-medium px-3 py-1 bg-blue-50 rounded-lg transition-colors flex items-center gap-1"><Shield className="w-4 h-4"/> ترقية لمدير</button>
                        )}
                        <button onClick={() => handleDelete(user.id)} title="حذف" className="text-red-600 hover:text-red-700 font-medium px-3 py-1 bg-red-50 rounded-lg transition-colors flex items-center gap-1"><Trash2 className="w-4 h-4"/> حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
