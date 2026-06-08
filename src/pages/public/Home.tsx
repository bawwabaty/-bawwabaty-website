import React from 'react';
import { motion } from 'framer-motion';
import { Plane, Star, ShieldCheck, Clock, MapPin, Building, Building2, Map as MapIcon, ArrowLeft, Ticket, Users, FileText, Bus, CheckCircle2, Headset, ThumbsUp, CreditCard, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { FloatingSocial } from '../../components/FloatingSocial';
import { getWhatsAppUrl } from '../../lib/whatsapp';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const servicesList = [
  {
    id: 1,
    title: 'تذاكر الطيران',
    description: 'نقوم بحجز رحلاتنا حصرياً مع شركات طيران موثوقة لضمان راحتكم وجودة الخدمة خلال رحلتكم للعمرة.',
    icon: Plane,
    color: 'bg-primary/5',
    iconColor: 'text-primary'
  },
  {
    id: 2,
    title: 'الفنادق',
    description: 'تشمل باقات العمرة لدينا فنادق ذات جودة عالية تقع على مسافة قريبة سيراً على الأقدام، وتتوفر في فئات مختلفة من الأسعار والراحة.',
    icon: Building2,
    color: 'bg-secondary/5',
    iconColor: 'text-secondary'
  },
  {
    id: 3,
    title: 'تأشيرة العمرة',
    description: 'بفضل خبرتنا الواسعة ونهجنا المهني، يمكننا تقديم المشورة الشخصية لكم ونتولى إجراءات طلب تأشيرة العمرة بالكامل.',
    icon: FileText,
    color: 'bg-slate-100',
    iconColor: 'text-slate-700'
  },
  {
    id: 4,
    title: 'المرافقة',
    description: 'يمتلك مرافقونا في رحلات العمرة المعرفة اللازمة لمساعدتكم بشكل جيد أثناء رحلتكم. كما أنهم يتحدثون عدة لغات مثل: العربية، الهولندية، الإنجليزية، والأمازيغية.',
    icon: Users,
    color: 'bg-primary/5',
    iconColor: 'text-primary'
  },
  {
    id: 5,
    title: 'الجولات السياحية',
    description: 'بالإضافة إلى العمرة، استمتعوا بجولات رائعة إلى أهم المواقع (الإسلامية)، سواء مع مرافقة أو بدونها.',
    icon: MapIcon,
    color: 'bg-secondary/5',
    iconColor: 'text-secondary'
  }
];

const CustomSelect = ({ value, onChange, options, placeholder }: { value: string, onChange: (v: string) => void, options: {value: string, label: string}[], placeholder: string }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-0 text-center text-xs sm:text-sm text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all flex items-center justify-center cursor-pointer"
        dir="rtl"
      >
        <span className="truncate px-1">{value ? options.find(o => o.value === value)?.label : placeholder}</span>
      </button>
      {open && (
        <ul className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-[144px] overflow-y-auto py-1 custom-scrollbar">
          {options.map((opt) => (
            <li
              key={opt.value}
              onMouseDown={() => { onChange(opt.value); setOpen(false); }}
              className={`px-2 py-2 text-sm text-center cursor-pointer font-bold ${value === opt.value ? 'bg-primary/10 text-primary' : 'text-slate-700 hover:bg-slate-100'}`}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export function Home() {
  useDocumentTitle('الرئيسية');
  const navigate = useNavigate();
  const [featuredPackages, setFeaturedPackages] = useState<any[]>([]);
  const [searchTab, setSearchTab] = useState<'umrah' | 'hotels' | 'flights'>('umrah');
  const [searchQuery, setSearchQuery] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [travelers, setTravelers] = useState('1');

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const q = query(
      collection(db, 'packages'),
      where('type', '==', 'umrah')
    );
    const unsub = onSnapshot(q, (snapshot) => {
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
    }, (error) => {
      console.error("Error fetching featured packages:", error);
    });

    return () => unsub();
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const queryLower = searchQuery.trim().toLowerCase();
    
    // Determine active search type
    let searchType = searchTab;
    if (queryLower.includes('عمرة') || queryLower.includes('العمرة') || queryLower.includes('باقة')) {
      searchType = 'umrah';
    } else if (queryLower.includes('فندق') || queryLower.includes('فنادق')) {
      searchType = 'hotels';
    } else if (queryLower.includes('طيران') || queryLower.includes('تذكرة') || queryLower.includes('رحلة')) {
      searchType = 'flights';
    }

    if (searchType === 'umrah') {
      navigate('/umrah');
    } else {
      const travelDateStr = day && month && year ? `${year}/${month}/${day}` : 'غير محدد';
      const serviceName = searchType === 'hotels' ? 'حجز الفنادق والإقامة' : 'حجز تذاكر الطيران';
      const text = `السلام عليكم ورحمة الله، أود الاستفسار عن خدمة (${serviceName}).
      
- الوجهة المطلوبة: ${searchQuery || 'طلب مباشر'}
- تاريخ السفر المتوقع: ${travelDateStr}
- عدد المسافرين: ${travelers} مسافر
شكراً لكم.`;

      const whatsappUrl = getWhatsAppUrl(text);
      window.open(whatsappUrl, '_blank', 'noreferrer,noopener');
    }
  };

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative min-h-[100svh] sm:min-h-screen flex items-center justify-center overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-20">
        <div className="absolute inset-0 w-full h-full">
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/55 to-slate-900/40 z-10" />
          <motion.img 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            src="https://res.cloudinary.com/dl7hgexkl/image/upload/v1780421551/sulthan-auliya-XykW1VgvTa4-unsplash_1_akdekv.jpg" 
            alt="Mecca Background" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl mx-auto mt-8 sm:mt-0"
          >
            <motion.span 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-block px-5 py-2 rounded-full bg-white/20 backdrop-blur-md text-sm md:text-base font-bold mb-6 border border-white/30 shadow-lg"
            >
              بوابتك نحو العالم، رحلتك الإيمانية تبدأ هنا
            </motion.span>
              <h1 
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-sans font-black mb-4 sm:mb-6 leading-[1.3] md:leading-[1.2] drop-shadow-2xl text-white"
            >
               رحلتك الإيمانية والسياحية تبدأ بضغطة زر
            </h1>
            <p 
              className="text-base sm:text-lg md:text-xl text-slate-200 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed drop-shadow-lg font-medium px-2 sm:px-4"
            >
              نقدم لكم أرقى خدمات السفر والعمرة باحترافية عالية، لتستمتعوا برحلة مريحة وروحانية تدوم ذكراها.
            </p>
          </motion.div>

          {/* Premium Tabbed Search Engine Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="w-full max-w-4xl mt-4 sm:mt-6 px-1 sm:px-4"
          >
            <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-5 sm:p-7 text-right text-slate-800">
              {/* Tabs list */}
              <div className="flex gap-2 mb-6 border-b border-slate-100 pb-4 overflow-x-auto select-none no-scrollbar">
                <button
                  type="button"
                  onClick={() => setSearchTab('umrah')}
                  className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-sm sm:text-base transition-all whitespace-nowrap cursor-pointer ${
                    searchTab === 'umrah'
                      ? 'bg-secondary text-white shadow-md'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Star className="w-4 h-4 shrink-0" />
                  باقات العمرة
                </button>
                <button
                  type="button"
                  onClick={() => setSearchTab('hotels')}
                  className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-sm sm:text-base transition-all whitespace-nowrap cursor-pointer ${
                    searchTab === 'hotels'
                      ? 'bg-secondary text-white shadow-md'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Building className="w-4 h-4 shrink-0" />
                  الفنادق
                </button>
                <button
                  type="button"
                  onClick={() => setSearchTab('flights')}
                  className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-sm sm:text-base transition-all whitespace-nowrap cursor-pointer ${
                    searchTab === 'flights'
                      ? 'bg-secondary text-white shadow-md'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Plane className="w-4 h-4 shrink-0" />
                  تذاكر الطيران
                </button>
              </div>

              {/* Form Input elements */}
              <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                {/* Search Text field */}
                <div className="md:col-span-5 space-y-2 text-right">
                  <label className="block text-xs sm:text-sm font-bold text-slate-600 pr-1">أين تريد الذهاب؟</label>
                  <div className="relative">
                    <MapPin className="absolute right-4 top-3.5 text-slate-400 w-5 h-5 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={
                        searchTab === 'umrah' 
                          ? "مثال: عمرة رمضان، الباقة المميزة..." 
                          : searchTab === 'hotels'
                            ? "مثال: فندق مكة، المدينة..."
                            : "مثال: رحلة الدار البيضاء، جدة..."
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pr-11 pl-4 text-sm sm:text-base text-slate-800 placeholder:text-slate-400 font-bold focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Date Input */}
                <div className="md:col-span-3 space-y-2 text-right z-30">
                  <label className="block text-xs sm:text-sm font-bold text-slate-600 pr-1">تاريخ السفر المقدر</label>
                  <div className="flex gap-2">
                    {/* Day */}
                    <div className="w-1/3">
                      <CustomSelect
                        value={day}
                        onChange={setDay}
                        options={[...Array(31)].map((_, i) => {
                          const val = String(i+1).padStart(2, '0');
                          return { value: val, label: val };
                        })}
                        placeholder="اليوم"
                      />
                    </div>
                    {/* Month */}
                    <div className="w-1/3">
                      <CustomSelect
                        value={month}
                        onChange={setMonth}
                        options={[...Array(12)].map((_, i) => {
                          const val = String(i+1).padStart(2, '0');
                          return { value: val, label: val };
                        })}
                        placeholder="الشهر"
                      />
                    </div>
                    {/* Year */}
                    <div className="w-1/3">
                      <CustomSelect
                        value={year}
                        onChange={setYear}
                        options={[currentYear, currentYear+1, currentYear+2].map(y => ({
                          value: String(y),
                          label: String(y)
                        }))}
                        placeholder="السنة"
                      />
                    </div>
                  </div>
                </div>

                {/* Travelers dropdown */}
                <div className="md:col-span-2 space-y-2 text-right">
                  <label className="block text-xs sm:text-sm font-bold text-slate-600 pr-1">المسافرين</label>
                  <div className="relative">
                    <Users className="absolute right-4 top-3.5 text-slate-400 w-5 h-5 pointer-events-none" />
                    <select
                      value={travelers}
                      onChange={(e) => setTravelers(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pr-11 pl-4 text-sm sm:text-base text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none cursor-pointer"
                    >
                      <option value="1">1 فرد</option>
                      <option value="2">2 فرد</option>
                      <option value="3">3 أفراد</option>
                      <option value="4">4 أفراد</option>
                      <option value="5+">5+ أفراد</option>
                    </select>
                  </div>
                </div>

                {/* Action button */}
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary-dark text-white font-bold text-base py-3.5 px-6 rounded-2xl shadow-lg hover:shadow-primary/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    ابحث
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>

            {/* Float quick actions */}
            <div className="flex flex-row justify-center md:justify-start items-center gap-4 mt-6">
              <Link 
                to="/umrah" 
                className="bg-secondary/95 hover:bg-secondary text-white px-6 py-3 rounded-full font-bold text-sm sm:text-base transition-all flex items-center gap-2 shadow-lg hover:shadow-secondary/30 hover:scale-105"
              >
                تصفح باقات العمرة
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <Link 
                to="/services" 
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3 rounded-full font-bold text-sm sm:text-base transition-all hover:scale-105"
              >
                خدماتنا السياحية
              </Link>
            </div>
          </motion.div>
        </div>
      </section>



      {/* Services Section */}
      <section className="py-20 lg:py-28 bg-white overflow-hidden relative">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16 md:mb-24"
          >
            <h2 className="text-4xl md:text-5xl font-black text-primary tracking-tight">خدماتنا</h2>
          </motion.div>

          {/* Wavy Background Path & Services Grid */}
          <div className="relative">
            <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 hidden lg:block opacity-30 pointer-events-none" style={{ height: '300px', marginTop: '-30px' }}>
              <svg width="100%" height="100%" viewBox="0 0 1200 300" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                <path d="M 1200 120 Q 1050 200 900 150 T 600 180 T 300 130 T 0 180" stroke="#94A3B8" strokeWidth="2" strokeDasharray="6 6" fill="none" />
                <circle cx="1180" cy="125" r="6" fill="#E2E8F0" />
                <circle cx="20" cy="180" r="6" fill="#E2E8F0" />
              </svg>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-4 relative z-10">
              {servicesList.map((service, index) => {
                const Icon = service.icon;
                return (
                  <motion.div key={service.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6, delay: index * 0.1 }} className="flex flex-col items-center text-center group">
                    <div className={`w-28 h-28 rounded-3xl ${service.color} ${service.iconColor} flex items-center justify-center mb-6 shadow-sm border border-slate-100 relative transition-transform duration-500 group-hover:-translate-y-2`} style={{ borderRadius: '50% 40% 60% 40% / 40% 50% 40% 60%' }}>
                      <Icon className="w-12 h-12 relative z-10" strokeWidth={1.5} />
                      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-slate-200"></div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-3">{service.title}</h3>
                    <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-[200px] md:max-w-none">{service.description}</p>
                  </motion.div>
                );
              })}
            </div>
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
            <h2 className="text-4xl md:text-5xl font-black text-primary tracking-tight mb-6 leading-tight">باقات <span className="text-secondary">العمرة المميزة</span></h2>
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
                 <Link to={`/package/${pkg.id}`} className="block relative aspect-[210/297] overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent z-10 transition-opacity group-hover:opacity-80" />
                   <img src={pkg.image || 'https://images.unsplash.com/photo-1591806336026-f825d72071a2?q=80&w=800&auto=format&fit=crop'} loading="lazy" alt={pkg.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                   
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
                       {pkg.programs?.length || 1} برنامج
                     </li>
                     <li className="flex items-center gap-3 text-slate-700 font-bold text-base">
                       <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                         <Plane className="w-5 h-5 text-primary" />
                       </div>
                       طيران عبر {pkg.airline || 'عدة خطوط'}
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



      {/* Airlines Partners Section */}
      <section className="py-16 bg-white overflow-hidden relative" dir="ltr">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
            dir="rtl"
          >
            <h3 className="text-3xl md:text-4xl font-black text-primary mb-4 tracking-tight">شركاء <span className="text-secondary">النجاح</span></h3>
            <p className="text-slate-500 text-lg font-medium max-w-2xl mx-auto">نعتز بشراكتنا مع أفضل خطوط الطيران العالمية</p>
          </motion.div>
          
          <div className="flex items-center justify-center gap-2 md:gap-6 relative group">
            {/* Nav Left */}
            <button 
              onClick={() => {
                const el = document.getElementById('partners-slider');
                if (el) el.scrollBy({ left: -160, behavior: 'smooth' });
              }}
              className="p-2 md:p-3 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-primary transition-all flex-shrink-0 z-10 shadow-sm opacity-100 md:opacity-0 group-hover:opacity-100"
              aria-label="Previous partners"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            
            {/* Slider Container */}
            <div 
              id="partners-slider"
              className="flex gap-10 md:gap-14 items-center overflow-x-auto snap-x snap-mandatory hide-scrollbar py-4 px-2 w-full max-w-5xl"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <style dangerouslySetInnerHTML={{__html: `
                .hide-scrollbar::-webkit-scrollbar { display: none; }
              `}} />
              {[
                { name: 'الخطوط السعودية', logo: 'https://res.cloudinary.com/dl7hgexkl/image/upload/v1780315423/saudia_LOGO_cfemva.svg', large: true },
                { name: 'الخطوط الملكية المغربية', logo: 'https://res.cloudinary.com/dl7hgexkl/image/upload/v1780315422/Logo_Royal_Air_Maroc_khdu4h.svg', large: true },
                { name: 'الإتحاد للطيران', logo: 'https://res.cloudinary.com/dl7hgexkl/image/upload/v1780315422/etihad-airways-1_u5ovxt.svg', small: true },
                { name: 'الخطوط الجوية القطرية', logo: 'https://res.cloudinary.com/dl7hgexkl/image/upload/v1780313927/Qatar_Airways-Logo.wine_bsqktc.svg', large: true },
                { name: 'طيران ناس', logo: 'https://res.cloudinary.com/dl7hgexkl/image/upload/v1780315422/LOGO_FLYNAS_dmxq9p.svg', small: true },
                { name: 'الخطوط الجوية التركية', logo: 'https://res.cloudinary.com/dl7hgexkl/image/upload/v1780315656/Colorful_double-line_horizontal_Turkish_Airlines_logo_w3s08i.svg', large: true },
                { name: 'مصر للطيران', logo: 'https://res.cloudinary.com/dl7hgexkl/image/upload/v1780315476/mada_social_media_4-2.5_m.pdf_izobjv.svg', large: true }
              ].map((airline, idx) => (
                <div key={idx} className={`snap-center flex-shrink-0 ${airline.large ? 'w-48 md:w-64 h-16 md:h-20' : 'w-24 md:w-32 h-10 md:h-12'} flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity duration-300`}>
                  <img src={airline.logo} alt={airline.name} title={airline.name} loading="lazy" className="max-w-full max-h-full object-contain drop-shadow-sm" />
                </div>
              ))}
            </div>
            
            {/* Nav Right */}
            <button 
              onClick={() => {
                const el = document.getElementById('partners-slider');
                if (el) el.scrollBy({ left: 160, behavior: 'smooth' });
              }}
              className="p-2 md:p-3 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-primary transition-all flex-shrink-0 z-10 shadow-sm opacity-100 md:opacity-0 group-hover:opacity-100"
              aria-label="Next partners"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </button>
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
            <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight tracking-tight text-white">
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

      <FloatingSocial />
    </div>
  );
}
