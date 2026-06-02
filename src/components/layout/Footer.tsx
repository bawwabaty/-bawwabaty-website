import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Facebook, Instagram } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-20 border-t border-slate-800">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          <div className="col-span-1">
             <div className="flex items-center gap-2 mb-6">
               <img src="https://res.cloudinary.com/dl7hgexkl/image/upload/v1780314494/LOGO_BAWWABATY_vswaog.svg" alt="بوابتي" className="h-20 md:h-28 brightness-0 invert" />
            </div>
            <p className="text-base md:text-lg text-slate-400 mb-8 leading-relaxed">
              وكالتك الموثوقة لخدمات السياحة والسفر والعمرة. نقدم أفضل الباقات والخدمات المتكاملة لتجربة سفر لا تُنسى.
            </p>
            <div className="flex gap-4">
              <a href="https://web.facebook.com/p/%D8%A8%D9%88%D8%A7%D8%A8%D8%AA%D9%8I-%D9%84%D9%84%D8%B3%D9%8A%D8%A7%D8%AD%D9%8A-%D9%88-%D8%A7%D9%84%D8%B3%D9%81%D8%B1-61570841673325/?_rdc=1&_rdr#" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-3 rounded-full hover:bg-secondary" title="تابعنا على فيسبوك"><Facebook className="w-6 h-6"/></a>
              <a href="https://www.instagram.com/bawwabaty_travel/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-3 rounded-full hover:bg-secondary" title="تابعنا على انستغرام"><Instagram className="w-6 h-6"/></a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-bold text-2xl mb-6">روابط سريعة</h3>
            <ul className="space-y-4 text-base md:text-lg text-slate-400">
              <li><Link to="/about" className="hover:text-secondary transition-colors">من نحن</Link></li>
              <li><Link to="/services" className="hover:text-secondary transition-colors">خدماتنا</Link></li>
              <li><Link to="/umrah" className="hover:text-secondary transition-colors">باقات العمرة</Link></li>
              <li><Link to="/tourism" className="hover:text-secondary transition-colors">البرامج السياحية</Link></li>
              <li><Link to="/faq" className="hover:text-secondary transition-colors">الأسئلة الشائعة</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold text-2xl mb-6">خدمات العمرة</h3>
            <ul className="space-y-4 text-base md:text-lg text-slate-400">
              <li><Link to="/umrah" className="hover:text-secondary transition-colors">عمرة شهر رمضان</Link></li>
              <li><Link to="/umrah" className="hover:text-secondary transition-colors">عمرة المولد النبوي</Link></li>
              <li><Link to="/umrah" className="hover:text-secondary transition-colors">باقات العمرة الاقتصادية</Link></li>
              <li><Link to="/umrah" className="hover:text-secondary transition-colors">باقات العمرة المميزة (VIP)</Link></li>
              <li><Link to="/services" className="hover:text-secondary transition-colors">خدمات التأشيرات</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold text-2xl mb-6">معلومات التواصل</h3>
            <ul className="space-y-6 text-base md:text-lg text-slate-400">
              <li className="flex items-start gap-4">
                <MapPin className="w-6 h-6 text-secondary shrink-0 mt-1" />
                <span className="leading-relaxed">64 شارع حسن العلوي عين البرجة الطابق الأول، الدار البيضاء</span>
              </li>
              <li className="flex items-center gap-4">
                <Phone className="w-6 h-6 text-secondary shrink-0" />
                <span dir="ltr" className="font-sans font-medium">0520948350 / 0679797906</span>
              </li>
              <li className="flex items-center gap-4">
                <Mail className="w-6 h-6 text-secondary shrink-0" />
                <span className="font-sans font-medium">contact@bawwabaty.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-slate-800 text-center text-base text-slate-500 flex flex-col md:flex-row justify-between items-center gap-6">
          <p>جميع الحقوق محفوظة © {new Date().getFullYear()} وكالة بوابتي للسياحة والسفر</p>
          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-white transition-colors">الشروط والأحكام</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">سياسة الخصوصية</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
