import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Mail, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export function Login() {
  useDocumentTitle('تسجيل الدخول');
  const { user, loginWithGoogle, loginWithEmail, registerWithEmail, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // If already logged in
  if (user) {
    return <Navigate to={isAdmin ? "/admin" : "/"} />;
  }

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await loginWithGoogle();
      toast.success('تم تسجيل الدخول بنجاح');
      navigate('/');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !name)) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      setLoading(true);
      if (isLogin) {
        await loginWithEmail(email, password);
        toast.success('تم تسجيل الدخول بنجاح');
      } else {
        await registerWithEmail(name, email, password);
        toast.success('تم إنشاء الحساب بنجاح');
      }
      navigate('/');
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          toast.error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      } else if (error.code === 'auth/email-already-in-use') {
          toast.error('البريد الإلكتروني مستخدم بالفعل');
      } else if (error.code === 'auth/weak-password') {
          toast.error('كلمة المرور ضعيفة، يجب أن تكون 6 أحرف على الأقل');
      } else {
          toast.error(error.message || 'حدث خطأ أثناء العملية');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 px-4 py-8 md:py-12 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden p-8 border border-slate-100"
      >
        <div className="text-center mb-8">
           <span className="text-4xl font-black text-primary font-sans tracking-tight mb-2 block">
                بوابت<span className="text-secondary">ي</span>
           </span>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">{isLogin ? 'أهلاً بك مجدداً' : 'إنشاء حساب جديد'}</h2>
          <p className="text-slate-500">{isLogin ? 'سجل دخولك لمتابعة حجوزاتك وإدارة حسابك' : 'انضم إلينا وابدأ في حجز رحلاتك بكل سهولة'}</p>
        </div>

        <div className="space-y-6">
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1"
                >
                  <label className="text-sm font-bold text-slate-700">الاسم الكامل</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full pr-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-primary focus:border-primary sm:text-sm bg-slate-50"
                      placeholder="أدخل اسمك الكامل"
                      disabled={loading}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">البريد الإلكتروني</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pr-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-primary focus:border-primary sm:text-sm bg-slate-50 text-left"
                  placeholder="name@example.com"
                  dir="ltr"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">كلمة المرور</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pr-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-primary focus:border-primary sm:text-sm bg-slate-50 text-left"
                  placeholder="كلمة المرور (6 أحرف على الأقل)"
                  dir="ltr"
                  disabled={loading}
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-lg font-bold text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:bg-primary/50 mt-4"
            >
              {loading ? (isLogin ? 'جاري تسجيل الدخول...' : 'جاري إنشاء الحساب...') : (isLogin ? 'تسجيل الدخول' : 'إنشاء حساب')}
            </button>
          </form>

          <div className="text-center">
            <button 
              type="button" 
              onClick={() => setIsLogin(!isLogin)} 
              className="text-primary hover:text-primary-dark font-bold text-sm"
              disabled={loading}
            >
              {isLogin ? 'ليس لديك حساب؟ إنشاء حساب جديد' : 'لديك حساب بالفعل؟ تسجيل الدخول'}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500 font-medium">أو</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            {loading ? 'الرجاء الانتظار...' : 'المتابعة بواسطة حساب جوجل'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
