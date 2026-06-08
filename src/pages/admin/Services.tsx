import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { collection, onSnapshot, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import toast from 'react-hot-toast';

interface Service {
  id: string;
  name: string;
  description: string;
}

export function AdminServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const defaultFormData = { name: '', description: '' };
  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    const q = query(collection(db, 'services'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Service[];
      setServices(data);
      setLoading(false);
    }, (error) => {
      toast.error('حدث خطأ أثناء جلب الخدمات');
      console.error(error);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const savePromise = async () => {
      if (editingId) {
        await updateDoc(doc(db, 'services', editingId), { ...formData });
      } else {
        await addDoc(collection(db, 'services'), { ...formData, createdAt: serverTimestamp() });
      }
      setIsModalOpen(false);
      setFormData(defaultFormData);
      setEditingId(null);
    };

    toast.promise(savePromise(), {
      loading: 'جاري الحفظ...',
      success: 'تم الحفظ بنجاح',
      error: 'حدث خطأ أثناء الحفظ'
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الخدمة؟')) return;
    try {
      await deleteDoc(doc(db, 'services', id));
      toast.success('تم الحذف بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  const openEditModal = (service: Service) => {
    setFormData({ name: service.name || '', description: service.description || '' });
    setEditingId(service.id);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">إدارة الخدمات</h2>
          <p className="text-slate-500">الخدمات الإضافية المقدمة للعملاء</p>
        </div>
        <button 
          onClick={() => { setFormData(defaultFormData); setEditingId(null); setIsModalOpen(true); }}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          إضافة خدمة
        </button>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-right min-w-[600px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-700">الاسم</th>
                <th className="px-6 py-4 font-bold text-slate-700">الوصف</th>
                <th className="px-6 py-4 font-bold text-slate-700">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-500">جاري التحميل...</td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-500">لا توجد خدمات مضافة حتى الآن</td>
                </tr>
              ) : services.map((service) => (
                <tr key={service.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Briefcase className="w-5 h-5 text-primary" />
                    </div>
                    {service.name}
                  </td>
                  <td className="px-6 py-4 text-slate-600 truncate max-w-xs">{service.description}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                       <button onClick={() => openEditModal(service)} className="text-primary hover:text-primary-dark font-medium px-3 py-1 bg-primary/10 rounded-lg transition-colors flex items-center gap-1"><Edit2 className="w-4 h-4"/> تعديل</button>
                       <button onClick={() => handleDelete(service.id)} className="text-red-600 hover:text-red-700 font-medium px-3 py-1 bg-red-50 rounded-lg transition-colors flex items-center gap-1"><Trash2 className="w-4 h-4"/> حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold">{editingId ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <form id="service-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">اسم الخدمة</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full rounded-lg border-slate-300 border p-3 focus:ring-primary focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">وصف الخدمة</label>
                  <textarea required rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full rounded-lg border-slate-300 border p-3 focus:ring-primary focus:border-primary resize-y" />
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition-colors">إلغاء</button>
              <button type="submit" form="service-form" className="px-6 py-2.5 rounded-xl font-medium text-white bg-primary hover:bg-primary-dark transition-colors flex items-center gap-2"><Save className="w-5 h-5" /> حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
