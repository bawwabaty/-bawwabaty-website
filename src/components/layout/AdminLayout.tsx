import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Package, Building2, Briefcase, Users as UsersIcon, LogOut, Menu, X, Settings } from 'lucide-react';
import { useState } from 'react';

export function AdminLayout() {
  const { user, isAdmin, loading, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (loading) return <div className="min-h-screen flex items-center justify-center">جاري التحميل...</div>;
  
  if (!user || !isAdmin) {
    return <Navigate to="/login" />;
  }

  const menuItems = [
    { icon: LayoutDashboard, label: 'لوحة القيادة', path: '/admin', exact: true },
    { icon: Package, label: 'إدارة الباقات', path: '/admin/packages' },
    { icon: Building2, label: 'إدارة الفنادق', path: '/admin/hotels' },
    { icon: Briefcase, label: 'إدارة الخدمات', path: '/admin/services' },
    { icon: UsersIcon, label: 'إدارة المستخدمين', path: '/admin/users' },
    { icon: Settings, label: 'إعدادات الحساب', path: '/admin/account' },
  ];

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
      
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
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
              {menuItems.find(i => isActive(i.path))?.label || 'لوحة القيادة'}
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
    </div>
  );
}
