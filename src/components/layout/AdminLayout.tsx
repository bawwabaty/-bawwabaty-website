import { Outlet, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Package, Building2, Briefcase, Users as UsersIcon, Settings, Plane, CreditCard, Receipt, Wallet, LogOut, Menu, X, Search, Command, Calculator } from 'lucide-react';
import { useState, useEffect } from 'react';

export function AdminLayout() {
  const { user, isAdmin, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showPalette, setShowPalette] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowPalette(p => !p);
      }
      if (e.key === 'Escape') {
        setShowPalette(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center">جاري التحميل...</div>;
  
  if (!user || !isAdmin) {
    return <Navigate to="/login" />;
  }

  const erpItems = [
    { icon: Calculator, label: 'لوحة المحاسبة', path: '/admin/erp', exact: false },
    { icon: Plane, label: 'إدارة الرحلات والباقات', path: '/admin/packages', exact: false },
    { icon: CreditCard, label: 'الحجوزات', path: '/admin/reservations', exact: false },
    { icon: Receipt, label: 'المصاريف', path: '/admin/expenses', exact: false },
    { icon: Wallet, label: 'يومية الصندوق والبنك', path: '/admin/cash-journal', exact: false },
  ];

  const adminItems = [
    { icon: LayoutDashboard, label: 'لوحة القيادة (الموقع)', path: '/admin', exact: true },
    { icon: Building2, label: 'إدارة الفنادق', path: '/admin/hotels' },
    { icon: Briefcase, label: 'إدارة الخدمات', path: '/admin/services' },
    { icon: UsersIcon, label: 'إدارة المستخدمين', path: '/admin/users' },
    { icon: Settings, label: 'إعدادات الحساب', path: '/admin/account' },
  ];

  const allItems = [...erpItems, ...adminItems];

  const isActive = (path: string, exact?: boolean) => {
    if (exact && location.pathname !== path) return false;
    if (!exact && location.pathname === '/admin') return false; // Avoid matching all for non exact
    if (!exact) return location.pathname.startsWith(path);
    return location.pathname === path;
  };

  const SidebarContent = () => (
    <>
      <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800">
        <Link to="/" className="block w-full">
          <img src="https://res.cloudinary.com/dl7hgexkl/image/upload/v1780314494/LOGO_BAWWABATY_vswaog.svg" alt="بوابتي" className="h-10 mx-auto" />
          <span className="text-xs font-normal text-slate-400 block text-center mt-2">لوحة الإدارة</span>
        </Link>
        <button 
          className="lg:hidden text-slate-300 hover:text-white"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="إغلاق القائمة"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      
      <nav className="flex-1 py-6 px-3 overflow-y-auto space-y-6">
        <div>
          <div className="px-4 text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">نظام إدارة الوكالة (ERP)</div>
          <div className="space-y-1">
            {erpItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path, item.exact)
                    ? 'bg-primary text-white'
                    : 'hover:bg-slate-800 hover:text-white text-slate-300'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div>
           <div className="px-4 text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">بوابة الموقع الإلكتروني</div>
           <div className="space-y-1">
             {adminItems.map((item) => (
               <Link
                 key={item.path}
                 to={item.path}
                 onClick={() => setIsMobileMenuOpen(false)}
                 className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                   isActive(item.path, item.exact)
                     ? 'bg-primary text-white'
                     : 'hover:bg-slate-800 hover:text-white text-slate-300'
                 }`}
               >
                 <item.icon className="w-5 h-5" />
                 <span className="font-medium">{item.label}</span>
               </Link>
             ))}
           </div>
        </div>
      </nav>
      
      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full text-right rounded-lg hover:bg-slate-800 hover:text-white transition-colors text-slate-400"
        >
          <LogOut className="w-5 h-5 text-red-400" />
          <span className="font-medium">تسجيل خروج</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-20 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 right-0 h-full w-64 bg-slate-900 text-slate-300 flex flex-col z-30 transition-transform duration-300 ease-in-out lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:mr-64 flex flex-col min-h-screen w-full transition-all">
        <header className="bg-white shadow-sm h-20 flex items-center px-4 lg:px-8 justify-between sticky top-0 z-10 w-full">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden text-slate-600 hover:text-primary transition-colors p-2"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="فتح القائمة"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-slate-800 hidden sm:block">
              {allItems.find(i => isActive(i.path))?.label || 'لوحة القيادة'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-sm text-slate-600 font-medium hidden sm:block">مرحباً، {user.displayName}</div>
             <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden shrink-0">
               {user.photoURL ? <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : user.displayName?.charAt(0) || 'م'}
             </div>
          </div>
        </header>
        <div className="p-4 lg:p-8 flex-1 w-full max-w-full overflow-x-hidden">
          <Outlet />
        </div>
      </main>
      {showPalette && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-start justify-center pt-[15vh]" onClick={() => setShowPalette(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center px-4 py-3 border-b border-slate-100">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input type="text" placeholder="ما الذي تبحث عنه؟ (حجز، رحلة، مصروف)..." className="w-full bg-transparent border-0 focus:ring-0 px-4 text-slate-800 placeholder-slate-400 outline-none" autoFocus />
              <div className="flex items-center gap-1 shrink-0">
                <kbd className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-xs">ESC</kbd>
              </div>
            </div>
            <div className="p-2 py-4">
              <div className="px-3 text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">صفحات سريعة</div>
              {allItems.map(item => (
                 <button key={item.path} onClick={() => { navigate(item.path); setShowPalette(false); }} className="w-full text-right flex items-center justify-between px-3 py-3 rounded-lg hover:bg-slate-50 text-slate-700 transition-colors">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                       <item.icon className="w-4 h-4" />
                     </div>
                     <span className="font-semibold">{item.label}</span>
                   </div>
                 </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
