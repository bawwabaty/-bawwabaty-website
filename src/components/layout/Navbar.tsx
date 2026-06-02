import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, Plane, User as UserIcon, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHome = location.pathname === '/';
  const isTransparent = isHome && !isScrolled && !isOpen;

  const navLinks = [
    { title: 'الرئيسية', path: '/' },
    { title: 'باقات العمرة', path: '/umrah' },
    { title: 'البرامج السياحية', path: '/tourism' },
    { title: 'الفنادق', path: '/hotels' },
    { title: 'خدماتنا', path: '/services' },
    { title: 'من نحن', path: '/about' },
    { title: 'اتصل بنا', path: '/contact' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${
      isTransparent
        ? 'bg-transparent shadow-none py-2'
        : 'bg-white/95 backdrop-blur-md shadow-sm py-0'
    }`}>
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-24 items-center">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <img 
                src="https://res.cloudinary.com/dl7hgexkl/image/upload/v1780314494/LOGO_BAWWABATY_vswaog.svg" 
                alt="بوابتي" 
                className="h-16 md:h-20 transition-all duration-300" 
                style={isTransparent ? { filter: 'brightness(0) invert(1)' } : undefined}
              />
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-baseline space-x-6 space-x-reverse">
              {navLinks.map((link) => {
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-4 py-2 rounded-xl text-lg font-bold transition-all ${
                      active
                        ? isTransparent
                          ? 'text-white bg-white/20'
                          : 'text-primary bg-primary/10'
                        : isTransparent
                          ? 'text-white/90 hover:text-white hover:bg-white/10'
                          : 'text-slate-600 hover:text-primary hover:bg-primary/5'
                    }`}
                  >
                    {link.title}
                  </Link>
                );
              })}
            </div>

            <div className={`flex items-center gap-4 mr-6 pl-6 border-r-2 ${isTransparent ? 'border-white/20' : 'border-slate-200'}`}>
              {user ? (
                <div className="flex items-center gap-4">
                  {isAdmin && (
                    <Link 
                      to="/admin" 
                      className={`text-lg font-bold transition-all ${
                        isTransparent 
                          ? 'text-white hover:text-white/80' 
                          : 'text-secondary hover:text-secondary-dark'
                      }`}
                    >
                      لوحة التحكم
                    </Link>
                  )}
                  <button 
                    onClick={logout} 
                    aria-label="تسجيل خروج" 
                    className={`p-3 rounded-full transition-colors ${
                      isTransparent
                        ? 'bg-white/10 text-white/80 hover:text-white hover:bg-white/20'
                        : 'bg-slate-50 text-slate-500 hover:text-red-500 hover:bg-red-50'
                    }`}
                    title="تسجيل خروج"
                  >
                    <LogOut className="w-6 h-6" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-lg font-bold transition-all shadow-md hover:shadow-lg ${
                    isTransparent
                      ? 'bg-white text-primary hover:bg-white/90'
                      : 'bg-primary hover:bg-primary-dark text-white'
                  }`}
                >
                  <UserIcon className="w-5 h-5" />
                  تسجيل الدخول
                </Link>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-label="القائمة"
              className={`focus:outline-none p-2 rounded-xl transition-colors ${
                isTransparent
                  ? 'text-white hover:bg-white/10'
                  : 'text-slate-600 hover:text-primary'
              }`}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-slate-100 bg-white"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                   onClick={() => setIsOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive(link.path)
                      ? 'text-primary bg-primary/5'
                      : 'text-slate-600 hover:text-primary hover:bg-slate-50'
                  }`}
                >
                  {link.title}
                </Link>
              ))}
              <div className="mt-4 pt-4 border-t border-slate-100">
                {user ? (
                  <div className="flex flex-col gap-2">
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-secondary hover:bg-slate-50">
                        لوحة التحكم
                      </Link>
                    )}
                    <button onClick={() => { logout(); setIsOpen(false); }} className="w-full text-right px-3 py-2 rounded-md text-base font-medium text-red-500 hover:bg-slate-50">
                      تسجيل خروج
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                     onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-primary hover:bg-slate-50"
                  >
                    تسجيل الدخول
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
