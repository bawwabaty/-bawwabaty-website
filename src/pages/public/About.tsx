import { motion } from 'framer-motion';
import { Target, Eye, Shield, Users } from 'lucide-react';

export function About() {
  const values = [
    { icon: Shield, title: 'المصداقية', desc: 'نلتزم بالشفافية والوضوح في جميع تعاملاتنا.' },
    { icon: Target, title: 'الجودة', desc: 'تقديم خدمات ترقى لطموحات عملائنا الكرام.' },
    { icon: Eye, title: 'الرؤية', desc: 'الريادة في مجال السياحة والسفر على مستوى المملكة.' },
    { icon: Users, title: 'الاهتمام بالعميل', desc: 'رضا العميل وراحته هو غايتنا الأولى.' },
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="bg-slate-50 pt-32 pb-16 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-secondary font-bold mb-2 block">من نحن</span>
          <h1 className="text-4xl md:text-5xl font-black text-primary mb-6">وكالة بوابتي للسياحة والسفر</h1>
          <p className="text-slate-600 text-lg max-w-3xl mx-auto leading-relaxed">
            تأسست الوكالة لتكون بوابتكم نحو العالم، وتحديداً نحو الديار المقدسة. 
            نسعى جاهدين لتقديم أفضل الخدمات السياحية وتنظيم رحلات العمرة باحترافية عالية 
            تضمن لكم الراحة والطمأنينة.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-bold text-slate-800">رحلتك معنا تبدأ بالثقة</h2>
            <p className="text-slate-600 leading-relaxed text-lg">
              نحن نؤمن بأن السفر ليس مجرد انتقال من مكان لآخر، بل هو تجربة متكاملة يجب أن تترك أثراً جميلاً في النفس. لذلك، نحرص في "بوابتي" على الاهتمام بأدق التفاصيل، من اختيار خطوط الطيران المريحة، إلى الفنادق القريبة ووسائل النقل الحديثة.
            </p>
            <p className="text-slate-600 leading-relaxed text-lg">
              فريقنا مكون من خبراء في مجال السياحة الدينية والترفيهية، متواجدون على مدار الساعة لخدمتكم والإجابة على كافة استفساراتكم.
            </p>
            
            <div className="pt-6">
              <h3 className="text-xl font-bold text-slate-800 mb-4">قيمنا ومحاورنا</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {values.map((v, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                      <v.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 mb-1">{v.title}</h4>
                      <p className="text-sm text-slate-500 leading-relaxed">{v.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute inset-0 bg-secondary/10 rounded-3xl transform translate-x-4 translate-y-4"></div>
            <img 
              src="https://images.unsplash.com/photo-1542051812871-757500d5a371?q=80&w=1000&auto=format&fit=crop" 
              alt="About Us" 
              className="relative z-10 rounded-3xl object-cover shadow-2xl w-full h-[600px]"
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
