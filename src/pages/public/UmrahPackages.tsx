import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Plane, Building, Clock, MapPin } from 'lucide-react';
import * as Icons from 'lucide-react';
import { getWhatsAppUrl } from '../../lib/whatsapp';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export function UmrahPackages() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUmrahPackages = async () => {
      try {
        const q = query(
          collection(db, 'packages'),
          where('type', '==', 'umrah')
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        data.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        setPackages(data);
      } catch (error) {
        console.error("Error fetching packages:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUmrahPackages();
  }, []);

  const getMinPrice = (pkg: any) => {
    if (!pkg.programs || pkg.programs.length === 0) return 'تواصل معنا';
    let min = Infinity;
    pkg.programs.forEach((p: any) => {
      if (p.prices) {
        Object.values(p.prices).forEach((price: any) => {
          if (price > 0 && price < min) min = price;
        });
      }
    });
    return min === Infinity ? 'تواصل معنا' : min;
  };

  return (
    <div className="bg-slate-50 min-h-screen pt-32 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-secondary font-bold mb-2 block">عروضنا الخاصة</span>
          <h1 className="text-4xl md:text-5xl font-black text-primary mb-4">باقات العمرة</h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            اختر من بين باقاتنا المتنوعة التي صُممت بعناية لتناسب جميع احتياجاتكم، مع توفير أرقى الفنادق وأفضل الخدمات لرحلة روحانية لا تُنسى.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {/* Skeleton Loading */}
             {[1,2,3].map(i => (
               <div key={i} className="animate-pulse bg-white rounded-[2rem] overflow-hidden shadow-sm h-[500px]">
                 <div className="bg-slate-200 h-[60%] w-full"></div>
                 <div className="p-6">
                   <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
                   <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
                   <div className="h-4 bg-slate-200 rounded w-full mb-6"></div>
                   <div className="h-12 bg-slate-200 rounded-xl w-full"></div>
                 </div>
               </div>
             ))}
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
            <Plane className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-slate-700 mb-2">لا توجد باقات حالياً</h3>
            <p className="text-slate-500">سيتم إضافة باقات جديدة قريباً، تفضل بزيارتنا لاحقاً.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {packages.map((pkg, idx) => (
              <motion.div 
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-[2rem] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-100 group flex flex-col"
              >
                <div className="relative aspect-[3/4] overflow-hidden shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent z-10" />
                  <img 
                    src={pkg.image || "https://images.unsplash.com/photo-1565552643982-2d8ba9f2e30f?q=80&w=800&auto=format&fit=crop"} 
                    alt={pkg.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  />
                  
                  {pkg.featured && (
                    <div className="absolute top-4 right-4 z-20 bg-secondary px-4 py-1.5 rounded-full text-white font-bold text-sm shadow-md">
                      الأكثر طلباً
                    </div>
                  )}
                  
                  <div className="absolute bottom-0 w-full p-6 z-20 text-white">
                    <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-black text-secondary">{getMinPrice(pkg)} {typeof getMinPrice(pkg) === 'number' && <span className="text-sm font-bold">MAD</span>}</span>
                      <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm flex items-center gap-1 font-bold">
                        <Clock className="w-4 h-4" />
                        {pkg.duration}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                  {pkg.description && (
                    <p className="text-slate-600 font-medium mb-4 line-clamp-3">{pkg.description}</p>
                  )}
                  
                  <ul className="space-y-3 mb-6 flex-1">
                    <li className="flex items-center gap-3 text-slate-700 font-bold">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Building className="w-4 h-4 text-primary" />
                      </div>
                      <span>فنادق {pkg.programs?.length || 1} برامج</span>
                    </li>
                    <li className="flex items-center gap-3 text-slate-700 font-bold">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 text-primary" />
                      </div>
                      <span>{pkg.roomTypes?.length || 0} أنواع غرف</span>
                    </li>
                    {pkg.features && pkg.features.length > 0 && pkg.features.slice(0,2).map((feat: any, i: number) => {
                      const IconComp = (Icons as any)[feat.icon] || Plane;
                      return (
                      <li key={i} className="flex items-center gap-3 text-slate-700 font-bold">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <IconComp className="w-4 h-4 text-primary" />
                        </div>
                        <span>{feat.text || feat}</span>
                      </li>
                    )})}
                  </ul>

                    <div className="flex flex-col xl:flex-row items-center gap-3 mt-auto">
                      <Link
                        to={`/package/${pkg.id}`}
                        className="w-full bg-primary text-white hover:bg-primary-dark text-center py-3.5 text-lg rounded-xl font-bold transition-all shadow-md hover:shadow-lg"
                      >
                        احجز الآن
                      </Link>
                    </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
