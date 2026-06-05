import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getApiUrl } from "../../lib/api";
import { Plus, Edit2, Trash2, X, Save, Image as ImageIcon, PlusCircle, Trash, RefreshCw, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const ROOM_TYPES = ['ثنائي', 'ثلاثي', 'رباعي', 'خماسي', 'سداسي'];

const AVAILABLE_ICONS = [
  { label: 'فندق', value: 'Building' },
  { label: 'طيران', value: 'Plane' },
  { label: 'تنقلات', value: 'Bus' },
  { label: 'تأشيرة', value: 'FileText' },
  { label: 'مرشد', value: 'Info' },
  { label: 'مزارات', value: 'MapPin' },
  { label: 'تميز', value: 'Star' },
  { label: 'تأكيد', value: 'CheckCircle2' }
];

interface Feature {
  text: string;
  icon: string;
}

interface Program {
  id: string;
  name: string;
  makkahHotel: string;
  madinahHotel: string;
  prices: Record<string, number>;
}

interface Package {
  id: string;
  type: 'umrah' | 'tourism';
  name: string;
  description: string;
  duration: string;
  features: Feature[];
  image: string;
  coverImage: string;
  gallery: string[];
  programs: Program[];
  roomTypes: string[];
  featured: boolean;
  capacity?: number;
}

export function AdminPackages() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [erpTrips, setErpTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const defaultFormData: Omit<Package, 'id'> = {
    type: 'umrah',
    name: '',
    description: '',
    duration: '',
    features: [],
    image: '',
    coverImage: '',
    gallery: [],
    programs: [],
    roomTypes: ['ثنائي', 'ثلاثي', 'رباعي'],
    featured: false,
    capacity: 50
  };

  const [formData, setFormData] = useState<Omit<Package, 'id'>>(defaultFormData);

  const fetchPackages = async () => {
    try {
      const q = query(collection(db, 'packages'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Package[];
      setPackages(data);

      const tripsRes = await fetch(getApiUrl("/api/trips"));
      if (tripsRes.ok) {
        const tripsData = await tripsRes.json();
        setErpTrips(tripsData);
      } else {
        const text = await tripsRes.text();
        throw new Error(`API Error: ${tripsRes.status} ${text.substring(0, 100)}`);
      }
    } catch (error: any) {
      toast.error(`حدث خطأ أثناء جلب البيانات: ${error?.message || error}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const syncPackagesToERP = async () => {
    setIsSyncing(true);
    const syncToast = toast.loading('جاري مزامنة الباقات مع المحاسبة...');
    try {
      if (packages.length === 0) {
        toast.dismiss(syncToast);
        setIsSyncing(false);
        return;
      }

      // Sync every package reliably
      for (const pkg of packages) {
        await fetch(getApiUrl("/api/trips/sync"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: pkg.id,
            name: pkg.name,
            capacity: pkg.capacity,
            minPrice: getMinPrice(pkg),
            image: pkg.image
          })
        });
      }
      
      toast.success(`تم مزامنة جميع الباقات مع المحاسبة بنجاح دون تكرار أو حذف بيانات`, { id: syncToast });
    } catch (error) {
      console.error("فشل مزامنة الباقات", error);
      toast.error("حدث خطأ أثناء المزامنة", { id: syncToast });
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const savePromise = async () => {
      if (editingId) {
        await updateDoc(doc(db, 'packages', editingId), {
          ...formData,
          updatedAt: serverTimestamp()
        });

        // Sync update to ERP in-place
        try {
          await fetch(getApiUrl("/api/trips/sync"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: editingId,
              name: formData.name,
              capacity: formData.capacity,
              minPrice: getMinPrice(formData as unknown as Package),
              image: formData.image
            })
          });
        } catch (syncError) {
          console.error("فشل مزامنة التعديلات مع المحاسبة", syncError);
        }
      } else {
        const docRef = await addDoc(collection(db, 'packages'), {
          ...formData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        // Sync creation to ERP automatically
        try {
          await fetch(getApiUrl("/api/trips/sync"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: docRef.id,
              name: formData.name,
              capacity: formData.capacity,
              minPrice: getMinPrice(formData as unknown as Package),
              image: formData.image
            })
          });
        } catch (syncError) {
          console.error("فشل إضافة الرحلة تلقائياً للمحاسبة", syncError);
        }
      }
      fetchPackages();
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
    if (!window.confirm('هل أنت متأكد من حذف هذه الباقة؟')) return;
    try {
      await deleteDoc(doc(db, 'packages', id));

      // Call sync delete to hide the corresponding trip in ERP
      try {
        await fetch(getApiUrl(`/api/trips/sync/${id}`), {
          method: "DELETE"
        });
      } catch (delError) {
        console.error("فشل حذف الرحلة المقابلة في المحاسبة", delError);
      }

      toast.success('تم الحذف بنجاح');
      fetchPackages();
    } catch (error) {
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  const openEditModal = (pkg: Package) => {
    setFormData({
      type: pkg.type || 'umrah',
      name: pkg.name || '',
      description: pkg.description || '',
      duration: pkg.duration || '',
      features: (pkg.features || []).map(f => typeof f === 'string' ? { text: f, icon: 'CheckCircle2' } : f),
      image: pkg.image || '',
      coverImage: pkg.coverImage || '',
      gallery: pkg.gallery || [],
      programs: pkg.programs || [],
      roomTypes: pkg.roomTypes || ['ثنائي', 'ثلاثي', 'رباعي'],
      featured: pkg.featured || false
    });
    setEditingId(pkg.id);
    setIsModalOpen(true);
  };

  // Program Management
  const addProgram = () => {
    const newProgram: Program = {
      id: Date.now().toString(),
      name: `برنامج ${formData.programs.length + 1}`,
      makkahHotel: '',
      madinahHotel: '',
      prices: {}
    };
    formData.roomTypes.forEach(rt => {
      newProgram.prices[rt] = 0;
    });
    setFormData({ ...formData, programs: [...formData.programs, newProgram] });
  };

  const removeProgram = (id: string) => {
    setFormData({ ...formData, programs: formData.programs.filter(p => p.id !== id) });
  };

  const updateProgram = (id: string, updates: Partial<Program>) => {
    setFormData({
      ...formData,
      programs: formData.programs.map(p => p.id === id ? { ...p, ...updates } : p)
    });
  };

  const updateProgramPrice = (programId: string, roomType: string, price: number) => {
    setFormData({
      ...formData,
      programs: formData.programs.map(p => {
        if (p.id === programId) {
          return { ...p, prices: { ...p.prices, [roomType]: price || 0 } };
        }
        return p;
      })
    });
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, { text: '', icon: 'CheckCircle2' }] });
  };

  const removeFeature = (idx: number) => {
    const newFeatures = [...formData.features];
    newFeatures.splice(idx, 1);
    setFormData({ ...formData, features: newFeatures });
  };

  const updateFeature = (idx: number, field: keyof Feature, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[idx] = { ...newFeatures[idx], [field]: value };
    setFormData({ ...formData, features: newFeatures });
  };

  const handleRoomTypeToggle = (rt: string) => {
    const isSelected = formData.roomTypes.includes(rt);
    const newRoomTypes = isSelected
      ? formData.roomTypes.filter(r => r !== rt)
      : [...formData.roomTypes, rt];
    setFormData({ ...formData, roomTypes: newRoomTypes });
  };

  // Utility to find minimum price of a package to display
  const getMinPrice = (pkg: Package) => {
    if (!pkg.programs || pkg.programs.length === 0) return 0;
    let min = Infinity;
    pkg.programs.forEach(p => {
      if (p.prices) {
        Object.values(p.prices).forEach(price => {
          if (price && price > 0 && price < min) min = price;
        });
      }
    });
    return min === Infinity ? 0 : min;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">إدارة الباقات</h2>
          <p className="text-slate-500">أضف، عدل، أو احذف باقات العمرة والسياحة المتاحة للحجز والتقديم عبر الموقع</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={syncPackagesToERP}
            disabled={isSyncing || loading || packages.length === 0}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            title="مزامنة الباقات السابقة مع لوحة المحاسبة وإدارة الرحلات"
          >
            <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
            مزامنة السابقة للمحاسبة
          </button>
          <button 
            onClick={() => { setFormData(defaultFormData); setEditingId(null); setIsModalOpen(true); }}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            إضافة باقة جديدة
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">جاري التحميل...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map(pkg => (
            <div key={pkg.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex flex-col">
              <div className="h-48 bg-slate-200 relative">
                {pkg.image ? (
                  <img src={pkg.image} alt={pkg.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                    <ImageIcon className="w-8 h-8 mb-2" />
                    <span>لا توجد صورة</span>
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-white/90 px-3 py-1 rounded-full text-xs font-bold text-primary">
                  {pkg.type === 'umrah' ? 'عمرة' : 'سياحة'}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-1">{pkg.name}</h3>
                <div className="text-2xl font-black text-secondary mb-2">يتوفر ابتداءً من {getMinPrice(pkg)} <span className="text-sm font-normal">MAD</span></div>
                <div className="text-sm text-slate-500 mb-4">{pkg.programs?.length || 0} برامج متاحة</div>
                
                <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-slate-100">
                  {(() => {
                     const matchedTrip = erpTrips.find(t => t.package_id === pkg.id);
                     if (matchedTrip) {
                       return (
                         <Link 
                           to={`/admin/trips/${matchedTrip.id}`} 
                           className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-primary font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-2 border border-slate-200"
                         >
                           إدارة الملف التفصيلي
                           <ArrowUpRight className="w-4 h-4" />
                         </Link>
                       );
                     }
                     return null;
                  })()}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => openEditModal(pkg)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" /> تعديل
                    </button>
                    <button 
                      onClick={() => handleDelete(pkg.id)}
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> حذف
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold">{editingId ? 'تعديل الباقة' : 'إضافة باقة جديدة'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="package-form" onSubmit={handleSubmit} className="space-y-8">
                
                {/* Basic Info */}
                <div>
                  <h4 className="text-lg font-bold text-primary mb-4 border-b pb-2">المعلومات الأساسية</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">نوع الباقة</label>
                      <select 
                        value={formData.type}
                        onChange={e => setFormData({...formData, type: e.target.value as 'umrah' | 'tourism'})}
                        className="w-full rounded-lg border-slate-300 border p-3 focus:ring-primary focus:border-primary"
                      >
                        <option value="umrah">عمرة</option>
                        <option value="tourism">سياحة</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">اسم الباقة</label>
                      <input 
                        type="text" required
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full rounded-lg border-slate-300 border p-3 focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">المدة (مثال: ١٤ يوم)</label>
                      <input 
                        type="text" required
                        value={formData.duration}
                        onChange={e => setFormData({...formData, duration: e.target.value})}
                        className="w-full rounded-lg border-slate-300 border p-3 focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">عدد المقاعد (إختياري)</label>
                      <input 
                        type="number" min="1"
                        value={formData.capacity || ''}
                        onChange={e => setFormData({...formData, capacity: parseInt(e.target.value) || undefined})}
                        className="w-full rounded-lg border-slate-300 border p-3 focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <div className="flex justify-between items-center mb-2 border-b pb-2">
                        <label className="block text-sm font-medium text-slate-700">المميزات</label>
                        <button type="button" onClick={addFeature} className="text-sm text-primary hover:text-primary-dark font-bold flex items-center gap-1">
                          <PlusCircle className="w-4 h-4" /> إضافة ميزة
                        </button>
                      </div>
                      <div className="space-y-3">
                        {formData.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <select 
                              value={feature.icon}
                              onChange={e => updateFeature(idx, 'icon', e.target.value)}
                              className="w-32 rounded-lg border-slate-300 border p-2 focus:ring-primary focus:border-primary text-sm"
                            >
                              {AVAILABLE_ICONS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                            </select>
                            <input 
                              type="text" required
                              value={feature.text}
                              onChange={e => updateFeature(idx, 'text', e.target.value)}
                              className="flex-1 rounded-lg border-slate-300 border p-2 focus:ring-primary focus:border-primary text-sm"
                              placeholder="وصف الميزة..."
                            />
                            <button 
                              type="button" 
                              onClick={() => removeFeature(idx)}
                              className="text-red-400 hover:text-red-600 bg-red-50 p-2 rounded-lg"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        {formData.features.length === 0 && <div className="text-sm text-slate-500 text-center py-2">لا توجد مميزات مضافة</div>}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">الوصف وتفاصيل الباقة</label>
                      <textarea 
                        required
                        rows={4}
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        className="w-full rounded-lg border-slate-300 border p-3 focus:ring-primary focus:border-primary resize-y"
                        placeholder="اكتب تفاصيل الباقة، الشروط، وأي معلومات هامة للعميل..."
                      />
                    </div>
                  </div>
                </div>

                {/* Media */}
                <div>
                  <h4 className="text-lg font-bold text-primary mb-4 border-b pb-2">الصور والوسائط</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-1">
                      <label className="block text-sm font-medium text-slate-700 mb-2">رابط الصورة الرئيسية (A4 طولية)</label>
                      <input 
                        type="url" required
                        value={formData.image}
                        onChange={e => setFormData({...formData, image: e.target.value})}
                        className="w-full rounded-lg border-slate-300 border p-3 focus:ring-primary focus:border-primary"
                        placeholder="https://example.com/main-image.jpg"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-sm font-medium text-slate-700 mb-2">رابط الصورة العريضة للغلاف (اختياري)</label>
                      <input 
                        type="url"
                        value={formData.coverImage}
                        onChange={e => setFormData({...formData, coverImage: e.target.value})}
                        className="w-full rounded-lg border-slate-300 border p-3 focus:ring-primary focus:border-primary"
                        placeholder="https://example.com/cover-image.jpg"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">معرض الصور الإضافية (روابط مفصولة بفاصلة)</label>
                      <textarea 
                        rows={3}
                        value={formData.gallery.join(',\n')}
                        onChange={e => setFormData({...formData, gallery: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})}
                        className="w-full rounded-lg border-slate-300 border p-3 focus:ring-primary focus:border-primary resize-y"
                        placeholder="https://image1.jpg,&#10;https://image2.jpg"
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing & Programs */}
                <div>
                  <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h4 className="text-lg font-bold text-primary">البرامج والأسعار</h4>
                  </div>
                  
                  <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="block text-sm font-medium text-slate-800 mb-3 block">اختر أنواع الغرف المتاحة في هذه الباقة (تطبق على جميع البرامج):</label>
                    <div className="flex flex-wrap gap-3">
                      {ROOM_TYPES.map(rt => (
                        <label key={rt} className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50">
                          <input 
                            type="checkbox"
                            checked={formData.roomTypes.includes(rt)}
                            onChange={() => handleRoomTypeToggle(rt)}
                            className="text-primary rounded"
                          />
                          <span className="font-medium text-slate-700">{rt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    {formData.programs.map((program, idx) => (
                      <div key={program.id} className="bg-white border-2 border-slate-100 rounded-xl p-5 relative shadow-sm">
                        <button 
                          type="button"
                          onClick={() => removeProgram(program.id)}
                          className="absolute top-4 left-4 text-red-400 hover:text-red-600 bg-red-50 p-2 rounded-lg"
                        >
                          <Trash className="w-5 h-5" />
                        </button>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pr-12">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">اسم البرنامج</label>
                            <input 
                              type="text" required
                              value={program.name}
                              onChange={e => updateProgram(program.id, { name: e.target.value })}
                              className="w-full rounded-lg border-slate-300 border p-2 focus:ring-primary focus:border-primary"
                              placeholder="مثال: البرنامج الأول"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">فندق مكة</label>
                            <input 
                              type="text" required
                              value={program.makkahHotel}
                              onChange={e => updateProgram(program.id, { makkahHotel: e.target.value })}
                              className="w-full rounded-lg border-slate-300 border p-2 focus:ring-primary focus:border-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">فندق المدينة</label>
                            <input 
                              type="text" required
                              value={program.madinahHotel}
                              onChange={e => updateProgram(program.id, { madinahHotel: e.target.value })}
                              className="w-full rounded-lg border-slate-300 border p-2 focus:ring-primary focus:border-primary"
                            />
                          </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-lg mt-4">
                          <div className="text-sm font-bold text-slate-700 mb-3">أسعار الغرف للبرنامج (MAD):</div>
                          {formData.roomTypes.length === 0 ? (
                            <div className="text-sm text-amber-600">يرجى تحديد أنواع الغرف المتاحة في الأعلى أولاً.</div>
                          ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                              {formData.roomTypes.map(rt => (
                                <div key={rt}>
                                  <label className="block text-xs font-medium text-slate-600 mb-1">{rt}</label>
                                  <input 
                                    type="number" required min="0" step="0.01"
                                    value={program.prices?.[rt] || ''}
                                    onChange={e => updateProgramPrice(program.id, rt, parseFloat(e.target.value))}
                                    className="w-full rounded-lg border-slate-300 border p-2 focus:ring-primary focus:border-primary text-sm"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    <button 
                      type="button"
                      onClick={addProgram}
                      className="w-full py-4 border-2 border-dashed border-primary/40 rounded-xl text-primary font-bold hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
                    >
                      <PlusCircle className="w-5 h-5" />
                      إضافة برنامج جديد
                    </button>
                    {formData.programs.length === 0 && (
                      <p className="text-red-500 text-sm font-bold text-center mt-2">يجب إضافة برنامج واحد على الأقل لكتابة الأسعار وتحديد الفنادق.</p>
                    )}
                  </div>
                </div>

              </form>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition-colors"
              >
                إلغاء
              </button>
              <button 
                type="submit" 
                form="package-form"
                disabled={formData.programs.length === 0}
                className="px-6 py-2.5 rounded-xl font-medium text-white bg-primary hover:bg-primary-dark transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                حفظ الباقة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
