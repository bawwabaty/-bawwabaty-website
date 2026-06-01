import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export function AdminAccount() {
  const { user, profile } = useAuth();
  const [name, setName] = useState(profile?.name || user?.displayName || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setSaving(true);
      await updateDoc(doc(db, 'users', user.uid), {
        name: name,
      });
      toast.success('تم الحفظ بنجاح');
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      console.error(error);
      toast.error('حدث خطأ أثناء حفظ التغييرات');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">إعدادات الحساب</h2>
        <p className="text-slate-500 mb-8">تعديل بياناتك الشخصية</p>

        <form onSubmit={handleSave} className="max-w-xl space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">الاسم</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full pr-10 py-3 border border-slate-200 rounded-xl focus:ring-primary focus:border-primary bg-slate-50"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">البريد الإلكتروني</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                className="block w-full text-left pr-10 py-3 border border-slate-200 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed"
                dir="ltr"
              />
            </div>
            <p className="text-xs text-slate-500">لا يمكن تغيير البريد الإلكتروني</p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 justify-center w-full sm:w-auto bg-primary hover:bg-primary-dark disabled:bg-slate-300 text-white px-8 py-3 rounded-xl font-bold transition-colors"
          >
            <Save className="w-5 h-5" />
            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </form>
      </div>
    </div>
  );
}
