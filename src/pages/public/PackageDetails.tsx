import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building, Calendar, CheckCircle2, ArrowLeft, Star, Clock, Image as ImageIcon } from 'lucide-react';
import * as Icons from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getWhatsAppUrl } from '../../lib/whatsapp';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export function PackageDetails() {
  const { id } = useParams();
  const [pkg, setPkg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>('');

  useDocumentTitle(pkg ? pkg.name : 'تفاصيل الباقة');

  useEffect(() => {
    const fetchPackage = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'packages', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPkg({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching package details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPackage();
  }, [id]);

  const images = useMemo(() => {
    if (!pkg) return [];
    const mainImg = pkg.coverImage || pkg.image || 'https://images.unsplash.com/photo-1591806336026-f825d72071a2?q=80&w=1200&auto=format&fit=crop';
    const all = [mainImg];
    if (pkg.coverImage && pkg.image) all.push(pkg.image);
    if (pkg.gallery && Array.isArray(pkg.gallery)) {
      all.push(...pkg.gallery);
    }
    return Array.from(new Set(all.filter(Boolean)));
  }, [pkg]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-primary font-bold text-xl">جاري التحميل...</div>;
  }

  if (!pkg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-3xl font-black text-slate-800 mb-4">الباقة غير موجودة</h2>
        <Link to="/umrah" className="text-primary hover:underline font-bold">العودة للباقات</Link>
      </div>
    );
  }

  const minPrice = pkg.programs?.reduce((min: number, p: any) => {
    let pMin = Infinity;
    Object.values(p.prices || {}).forEach((price: any) => {
      if (price > 0 && price < pMin) pMin = price;
    });
    return Math.min(min, pMin);
  }, Infinity);
  
  const displayPrice = minPrice === Infinity || isNaN(minPrice) ? 'تواصل معنا' : minPrice;
  const currentDisplayImage = selectedImage || images[0];

  return (
    <div className="bg-slate-50 min-h-screen pt-28 md:pt-32 pb-20 font-sans">
      
      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 block">
        <Link to={pkg.type === 'umrah' ? '/umrah' : '/tourism'} className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold">
          <ArrowLeft className="w-5 h-5" />
          العودة
        </Link>
      </div>

      {/* Main Image Header - Full width on mobile, rounded on desktop */}
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div className="relative bg-slate-200 sm:rounded-3xl overflow-hidden w-full aspect-video md:h-[500px]">
          <AnimatePresence mode="wait">
            <motion.img 
              key={currentDisplayImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              src={currentDisplayImage} 
              alt={pkg.name} 
              className="w-full h-full object-cover" 
            />
          </AnimatePresence>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Gallery Thumbnails - Detached, transparent background */}
        {images.length > 1 && (
          <div className="flex gap-3 py-6 overflow-x-auto w-full hide-scrollbar">
            {images.map((img, idx) => (
              <button 
                key={idx}
                onClick={() => setSelectedImage(img)}
                className={`relative w-20 h-14 md:w-28 md:h-20 shrink-0 rounded-xl overflow-hidden shadow-sm transition-all ${
                  currentDisplayImage === img ? 'ring-2 ring-primary ring-offset-2 ring-offset-slate-50 opacity-100 scale-105' : 'opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`Thumbnail ${idx}`} loading="lazy" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="py-6 md:py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Main Content Info */}
          <div className="lg:col-span-2 space-y-12">
            
            <div className="border-b border-slate-200 pb-8">
              {pkg.featured && (
                <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-sm font-bold mb-4">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  باقة مميزة
                </span>
              )}
              <h1 className="text-3xl md:text-5xl font-black text-slate-800 mb-6 leading-tight">
                {pkg.name}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-slate-600 font-medium">
                <span className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm">
                  <Calendar className="w-5 h-5 text-primary" />
                  {pkg.duration}
                </span>
                <span className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  {pkg.programs?.length || 1} برامج
                </span>
              </div>
            </div>

            <section>
              <h2 className="text-2xl font-black text-slate-800 mb-6">تفاصيل الباقة</h2>
              <div className="text-slate-600 leading-relaxed font-medium whitespace-pre-wrap text-lg">
                {pkg.description || 'لا يوجد وصف متاح.'}
              </div>
            </section>

            {pkg.features && pkg.features.length > 0 && (
              <section>
                <h2 className="text-2xl font-black text-slate-800 mb-6">ما تتضمنه الباقة</h2>
                <div className="flex flex-wrap items-center gap-3 md:gap-4">
                  {pkg.features.map((feature: any, idx: number) => {
                    const IconComp = (Icons as any)[feature.icon] || CheckCircle2;
                    return (
                    <div 
                      key={idx}
                      className="bg-white border border-slate-200 px-4 py-3 rounded-full flex flex-row items-center gap-3 hover:border-primary/40 transition-colors shadow-sm"
                    >
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                        <IconComp className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm md:text-base font-bold text-slate-700">{feature.text || feature}</span>
                    </div>
                  )})}
                </div>
              </section>
            )}

            {pkg.programs && pkg.programs.length > 0 && (
              <section>
                <h2 className="text-2xl font-black text-slate-800 mb-6">البرامج والأسعار الفندقية</h2>
                <div className="bg-white border text-center md:border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full whitespace-nowrap min-w-[600px]">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4 font-bold text-center text-slate-700">البرنامج</th>
                          <th className="px-6 py-4 font-bold text-center text-slate-700">فندق مكة</th>
                          <th className="px-6 py-4 font-bold text-center text-slate-700">فندق المدينة</th>
                          {pkg.roomTypes?.map((rt: string) => (
                            <th key={rt} className="px-6 py-4 font-bold text-primary text-center">{rt}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pkg.programs.map((prog: any) => (
                          <tr key={prog.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-5 font-bold text-slate-800">{prog.name}</td>
                            <td className="px-6 py-5 font-medium text-slate-600">{prog.makkahHotel}</td>
                            <td className="px-6 py-5 font-medium text-slate-600">{prog.madinahHotel}</td>
                            {pkg.roomTypes?.map((rt: string) => (
                              <td key={rt} className="px-6 py-5 font-black text-secondary text-center text-lg">
                                {prog.prices?.[rt] ? `${prog.prices[rt]}` : '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Sidebar Sticky Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-white border border-slate-200 rounded-3xl p-8 shadow-xl text-center">
              <div className="mb-6">
                <div className="text-sm font-bold text-slate-500 mb-2">السعر يبدأ من</div>
                <div className="text-4xl md:text-5xl font-black text-secondary">
                  {displayPrice}
                </div>
                {typeof displayPrice === 'number' && <div className="text-sm font-bold text-slate-500 mt-2">درهم مغربي (MAD)</div>}
              </div>
              
              <h3 className="text-xl font-bold text-slate-800 mb-4">هل أنت مستعد للرحلة؟</h3>
              <p className="text-slate-500 font-medium mb-6 text-sm">
                تواصل معنا الآن عبر واتساب لتأكيد الحجز أو الاستفسار عن مزيد من التفاصيل.
              </p>
              <a 
                href={getWhatsAppUrl(`السلام عليكم، أود حجز ${pkg.name} والتي تبدأ بسعر ${displayPrice} درهم`)} 
                target="_blank" rel="noreferrer"
                className="block w-full bg-secondary hover:bg-secondary-light text-white text-center py-4 text-xl rounded-2xl font-black transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                حجز عبر واتساب
              </a>
              
              <div className="mt-6 flex items-center justify-center gap-2 text-xs font-bold text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                رد سريع خلال ساعات العمل
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
