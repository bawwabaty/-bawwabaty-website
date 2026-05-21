import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { getWhatsAppUrl } from '../../lib/whatsapp';

export function Contact() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate sending
    setTimeout(() => {
      toast.success('تم إرسال رسالتك بنجاح. سنتواصل معك قريباً.');
      setLoading(false);
      (e.target as HTMLFormElement).reset();
    }, 1500);
  };

  return (
    <div className="bg-slate-50 min-h-screen pt-32 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-secondary font-bold mb-2 block">بوابتي للسياحة والسفر</span>
          <h1 className="text-4xl md:text-5xl font-black text-primary mb-4">اتصل بنا</h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            نحن هنا للإجابة على جميع استفساراتكم. نسعد بتواصلكم معنا عبر القنوات التالية أو بزيارة مقر الوكالة.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Info Side */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex items-start gap-4 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                <MapPin className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">العنوان</h3>
                <p className="text-slate-600 leading-relaxed">
                  64 شارع حسن العلوي عين البرجة الطابق الأول،<br/>الدار البيضاء، المملكة المغربية
                </p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex items-start gap-4 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center shrink-0">
                <Phone className="w-7 h-7 text-secondary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">أرقام التواصل</h3>
                <div className="space-y-2">
                  <p className="text-slate-600 font-medium font-sans" dir="ltr">0520 94 83 50</p>
                  <p className="text-slate-600 font-medium font-sans" dir="ltr">0679 79 79 06</p>
                </div>
                <a 
                  href={getWhatsAppUrl("السلام عليكم، لدي استفسار")} 
                  target="_blank" rel="noreferrer"
                  className="mt-4 inline-block text-secondary font-bold hover:text-secondary-dark transition-colors"
                >
                  تواصل عبر واتساب &larr;
                </a>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex items-start gap-4 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0">
                <Mail className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">البريد الإلكتروني</h3>
                <p className="text-slate-600 font-sans">contact@bawwabaty.com</p>
              </div>
            </div>
          </div>

          {/* Form Side */}
          <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-xl border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">أرسل لنا رسالة</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">الاسم الكامل</label>
                <input 
                  type="text" required
                  className="w-full rounded-xl border-slate-300 border p-3 focus:ring-primary focus:border-primary transition-colors bg-slate-50 focus:bg-white"
                  placeholder="محمد أحمد"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">رقم الهاتف</label>
                <input 
                  type="tel" required dir="ltr"
                  className="w-full text-right rounded-xl border-slate-300 border p-3 focus:ring-primary focus:border-primary transition-colors bg-slate-50 focus:bg-white"
                  placeholder="06XX XX XX XX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">نص الرسالة</label>
                <textarea 
                  required rows={4}
                  className="w-full rounded-xl border-slate-300 border p-3 focus:ring-primary focus:border-primary transition-colors bg-slate-50 focus:bg-white resize-none"
                  placeholder="اكتب استفسارك هنا..."
                ></textarea>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? 'جاري الإرسال...' : (
                  <>
                    <Send className="w-5 h-5 ml-1" />
                    إرسال الرسالة
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
