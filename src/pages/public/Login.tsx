import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Lock, Mail, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export function Login() {
  const { user, loginWithGoogle, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

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
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden p-8 border border-slate-100"
      >
        <div className="text-center mb-8">
           <span className="text-4xl font-black text-primary font-sans tracking-tight mb-2 block">
                بوابت<span className="text-secondary">ي</span>
           </span>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">أهلاً بك مجدداً</h2>
          <p className="text-slate-500">سجل دخولك لمتابعة حجوزاتك وإدارة حسابك</p>
        </div>

        <div className="space-y-6">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول بواسطة جوجل'}
          </button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">أو</span>
            </div>
          </div>

          <div className="text-center text-sm text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100">
            لتسجيل الدخول كمسؤول (Admin)، يرجى استخدام بريد إلكتروني معتمد مثل: <br/> <strong className="text-primary mt-2 inline-block">bawwabaty@gmail.com</strong>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
