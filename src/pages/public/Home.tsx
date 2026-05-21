import { motion } from 'framer-motion';
import { Plane, Star, ShieldCheck, Clock, MapPin, Building, ArrowLeft, Ticket, Users, FileText, Bus, CheckCircle2, Headset, ThumbsUp, CreditCard, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { FloatingWhatsApp } from '../../components/FloatingWhatsApp';
import { getWhatsAppUrl } from '../../lib/whatsapp';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

export function Home() {
  const [featuredPackages, setFeaturedPackages] = useState<any[]>([]);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const q = query(
          collection(db, 'packages'),
          where('type', '==', 'umrah')
        );
        const snapshot = await getDocs(q);
        let pkgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        
        // Sort manually by creation time
        pkgs.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        
        // Try to filter explicitly featured ones
        const trulyFeatured = pkgs.filter(p => p.featured);
        if (trulyFeatured.length >= 3) {
          setFeaturedPackages(trulyFeatured.slice(0, 3));
        } else if (trulyFeatured.length > 0) {
          setFeaturedPackages(trulyFeatured);
        } else {
          // If none are specifically featured, show the top 3 newest
          setFeaturedPackages(pkgs.slice(0, 3));
        }
      } catch (error) {
        console.error("Error fetching featured packages:", error);
      }
    };
    fetchFeatured();
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
    <div className="relative">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-20">
        <div className="absolute inset-0 w-full h-full">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-dark/90 to-primary/50 z-10" />
          <motion.img 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            src="https://images.unsplash.com/photo-1591806336026-f825d72071a2?q=80&w=2400&auto=format&fit=crop" 
            alt="Mecca Background" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl mx-auto"
          >
            <motion.span 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-block px-6 py-2 rounded-full bg-white/20 backdrop-blur-md text-base font-bold mb-8 border border-white/30 shadow-lg"
            >
              بوابتك نحو العالم
            </motion.span>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 md:mb-8 leading-[1.3] md:leading-[1.2] drop-shadow-2xl"
            >
               رحلتك الإيمانية تبدأ <span className="text-secondary">هنا</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-lg md:text-2xl text-slate-100 mb-8 md:mb-12 leading-relaxed drop-shadow-lg font-medium max-w-3xl mx-auto px-2"
            >
              نقدم لكم أرقى خدمات السفر والعمرة باحترافية عالية، لتستمتعوا برحلة مريحة وروحانية تدوم ذكراها.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mt-8"
            >
              <Link 
                to="/umrah" 
                className="bg-secondary hover:bg-secondary-light text-white px-6 md:px-8 py-3.5 md:py-4 rounded-full text-lg md:text-xl font-bold transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(243,112,33,0.4)] flex items-center gap-3 w-full sm:w-auto justify-center"
              >
                تصفح باقات العمرة
                <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
              </Link>
              <Link 
                to="/services" 
                className="bg-white hover:bg-slate-50 text-primary px-6 md:px-8 py-3.5 md:py-4 rounded-full text-lg md:text-xl font-bold transition-all hover:scale-105 shadow-xl w-full sm:w-auto justify-center"
              >
                خدماتنا السياحية
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 lg:py-28 bg-white relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              <span className="text-primary">بوابتك</span> <span className="text-secondary">نحو العالم</span>
            </h2>
            <p className="text-slate-500 text-lg md:text-xl font-medium max-w-3xl mx-auto leading-relaxed">نقدم باقة متكاملة من خدمات السفر والعمرة لتجربة لا تُنسى تلبي كافة احتياجاتكم</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
            {/* Travel Services Card */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="bg-slate-50 rounded-3xl p-6 md:p-8 hover:shadow-xl transition-all duration-500 border border-slate-100 group flex flex-col"
            >
              <div className="flex flex-col xl:flex-row items-center justify-between gap-4 mb-6 border-b border-slate-200 pb-6 text-center xl:text-right">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shrink-0">
                  <Plane className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-2xl lg:text-3xl font-black text-primary w-full">خدمات السفر</h3>
              </div>
              <ul className="space-y-4 flex-1">
                {[
                  { text: 'استخراج التأشيرات السياحية والعمل', icon: Ticket },
                  { text: 'حجز تذاكر الطيران على جميع الخطوط', icon: Plane },
                  { text: 'حجز الفنادق والإقامة مع خيارات متنوعة', icon: Building },
                  { text: 'تنظيم رحلات العمل والرحلات العائلية', icon: Users }
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-slate-700 text-base md:text-lg font-bold">
                    <div className="w-8 h-8 bg-white shadow-sm rounded-lg flex items-center justify-center shrink-0">
                      <item.icon className="w-4 h-4 text-slate-400" />
                    </div>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Umrah Services Card */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-orange-50/50 rounded-3xl p-6 md:p-8 hover:shadow-xl transition-all duration-500 border border-orange-100/50 group flex flex-col"
            >
              <div className="flex flex-col xl:flex-row items-center justify-between gap-4 mb-6 border-b border-orange-200/50 pb-6 text-center xl:text-right">
                <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shrink-0">
                  <BookOpen className="w-7 h-7 text-secondary" />
                </div>
                <h3 className="text-2xl lg:text-3xl font-black text-secondary w-full">خدمات العمرة</h3>
              </div>
              <ul className="space-y-4 flex-1">
                 {[
                  { text: 'إقامات متنوعة في مكة والمدينة بالقرب من الحرم', icon: Building },
                  { text: 'وسائل نقل حديثة ومريحة', icon: Bus },
                  { text: 'باقات متكاملة تشمل التذاكر والتأشيرات', icon: FileText },
                  { text: 'مزارات تاريخية ودينية مع مرشدين معتمدين', icon: MapPin }
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-slate-700 text-base md:text-lg font-bold">
                    <div className="w-8 h-8 bg-white shadow-sm rounded-lg flex items-center justify-center shrink-0">
                      <item.icon className="w-4 h-4 text-slate-400" />
                    </div>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Packages Outline */}
      <section className="py-20 lg:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black text-primary mb-6 leading-tight">باقات العمرة المميزة</h2>
            <p className="text-slate-600 text-lg md:text-xl font-medium max-w-3xl mx-auto leading-relaxed">اختر من بين باقاتنا المتنوعة التي صُممت بعناية لتناسب جميع احتياجاتكم الدينية والسياحية.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
             {featuredPackages.map((pkg, item) => (
               <motion.div 
                 key={pkg.id}
                 initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: item * 0.1, duration: 0.5 }}
                 className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-100 group flex flex-col"
               >
                 <Link to={`/package/${pkg.id}`} className="block relative aspect-[4/3] overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent z-10 transition-opacity group-hover:opacity-80" />
                   <img src={pkg.image || 'https://images.unsplash.com/photo-1591806336026-f825d72071a2?q=80&w=800&auto=format&fit=crop'} alt={pkg.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                   
                   {pkg.featured && (
                     <div className="absolute top-4 right-4 z-20 bg-secondary/95 backdrop-blur px-4 py-2 rounded-full text-white font-bold text-sm shadow-md">
                       مميز
                     </div>
                   )}
                   
                   <div className="absolute bottom-0 w-full p-6 z-20 text-white">
                     <h3 className="text-2xl font-black mb-2">{pkg.name}</h3>
                     <div className="flex items-center justify-between">
                       <span className="text-3xl font-black text-secondary">{getMinPrice(pkg)} {typeof getMinPrice(pkg) === 'number' && <span className="text-sm font-bold">MAD</span>}</span>
                       <span className="bg-white/20 backdrop-blur px-4 py-1.5 rounded-full text-sm font-bold">{pkg.duration}</span>
                     </div>
                   </div>
                 </Link>
                 
                 <div className="p-6 flex-grow flex flex-col justify-between">
                   <ul className="space-y-4 mb-6">
                     <li className="flex items-center gap-3 text-slate-700 font-bold text-base">
                       <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                         <Building className="w-5 h-5 text-primary" />
                       </div>
                       {pkg.programs?.length || 1} برامج فندقية
                     </li>
                     <li className="flex items-center gap-3 text-slate-700 font-bold text-base">
                       <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                         <Plane className="w-5 h-5 text-primary" />
                       </div>
                       طيران وتأشيرة
                     </li>
                   </ul>
                   <div className="flex items-center gap-3">
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
             {featuredPackages.length === 0 && (
               <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 text-slate-500 font-bold">
                 جاري تحميل الباقات المميزة...
               </div>
             )}
          </div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <Link to="/umrah" className="inline-flex items-center justify-center gap-3 text-primary text-xl md:text-2xl font-black hover:text-secondary transition-colors group">
              <span className="border-b-2 border-transparent group-hover:border-secondary pb-1 transition-all">عرض جميع الباقات</span>
              <ArrowLeft className="w-6 h-6 transform group-hover:-translate-x-2 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="py-20 lg:py-28 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
            {/* Images Side */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative order-2 lg:order-1 h-[350px] sm:h-[450px] md:h-[550px]"
            >
              <div className="absolute top-0 right-0 w-[65%] h-[70%]">
                <img 
                  src="https://images.unsplash.com/photo-1542051812871-757500d5a371?q=80&w=1200&auto=format&fit=crop" 
                  alt="Madinah" 
                  className="w-full h-full object-cover rounded-3xl shadow-xl"
                />
              </div>
              <div className="absolute bottom-0 left-0 w-[65%] h-[60%] z-20">
                <img 
                  src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1200&auto=format&fit=crop" 
                  alt="Travel plane" 
                  className="w-full h-full object-cover rounded-3xl shadow-xl border-4 md:border-8 border-white"
                />
              </div>
              {/* 15+ Years Badge */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 bg-white w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full shadow-2xl flex flex-col items-center justify-center border-4 md:border-8 border-orange-50">
                <span className="text-3xl sm:text-4xl md:text-5xl font-black text-secondary">١٥+</span>
                <span className="text-xs sm:text-sm md:text-base font-bold text-slate-600 mt-0.5 md:mt-1">عاماً من</span>
                <span className="text-xs sm:text-sm md:text-base font-bold text-slate-600">الخبرة</span>
              </div>
            </motion.div>

            {/* Content Side */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-1 lg:order-2 space-y-8"
            >
              <div>
                <h2 className="text-4xl md:text-5xl font-black mb-4 text-primary leading-tight">من نحن؟</h2>
                <h3 className="text-3xl md:text-4xl font-black text-secondary leading-tight">بوابتك للعالم</h3>
              </div>
              <p className="text-lg md:text-xl text-slate-600 leading-relaxed font-medium">
                تأسست وكالة بوابتي للسياحة والسفر لتكون رائدة في مجال تقديم الخدمات السياحية المتكاملة. نهدف إلى توفير أسهل الطرق وأفضل العروض لعملائنا لاكتشاف العالم وصناعة ذكريات لا تُنسى.
              </p>
              
              <ul className="space-y-4">
                {[
                  "مصداقية عالية وشفافية في التعامل",
                  "فريق عمل متخصص ذو خبرة واسعة",
                  "عروض حصرية وخصومات مستمرة",
                  "تنوع في الباقات لتناسب جميع الأذواق"
                ].map((item, idx) => (
                  <motion.li 
                    key={idx} 
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-4 text-lg md:text-xl text-slate-700 font-bold"
                  >
                    <CheckCircle2 className="w-6 h-6 text-secondary shrink-0" />
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ul>

              <Link 
                to="/about"
                className="inline-flex items-center gap-3 bg-primary hover:bg-primary-dark text-white px-8 py-4 text-lg rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 mt-6"
              >
                اقرأ المزيد عنا
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 lg:py-28 bg-primary text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 3px 3px, white 1.5px, transparent 0)', backgroundSize: '32px 32px' }}></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
              لماذا تختار <span className="text-secondary">بوابتي؟</span>
            </h2>
            <p className="text-blue-100 text-lg md:text-xl font-medium max-w-3xl mx-auto">نحرص دائماً على تقديم أفضل تجربة لعملائنا من خلال الخدمات المميزة التي تلبي تطلعاتكم</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {[
              { icon: Clock, title: 'حجز سريع', desc: 'نظام حجز مبسط وسريع يتيح لك إتمام إجراءات سفرك في دقائق.' },
              { icon: CreditCard, title: 'دفع آمن', desc: 'نوفر طرق دفع متعددة وآمنة لضمان سرية معلوماتكم وحمايتها.' },
              { icon: ThumbsUp, title: 'أفضل الأسعار', desc: 'نضمن لكم الحصول على أفضل الأسعار التنافسية لرحلاتكم وإقامتكم.' },
              { icon: Headset, title: 'دعم فني 24/7', desc: 'فريقنا متاح دائماً للرد على استفساراتكم وحل أي مشكلة باحترافية.' }
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="bg-primary-light/20 backdrop-blur-md p-8 rounded-3xl border border-white/10 hover:bg-primary-light/30 transition-all duration-300 hover:-translate-y-2 group"
              >
                <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-blue-100/90 text-base font-medium leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <FloatingWhatsApp />
    </div>
  );
}
