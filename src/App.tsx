import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { PublicLayout } from './components/layout/PublicLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import ScrollToTop from './components/ScrollToTop';

// Lazy load public pages
const Home = React.lazy(() => import('./pages/public/Home').then(m => ({ default: m.Home })));
const Login = React.lazy(() => import('./pages/public/Login').then(m => ({ default: m.Login })));
const UmrahPackages = React.lazy(() => import('./pages/public/UmrahPackages').then(m => ({ default: m.UmrahPackages })));
const Contact = React.lazy(() => import('./pages/public/Contact').then(m => ({ default: m.Contact })));
const About = React.lazy(() => import('./pages/public/About').then(m => ({ default: m.About })));
const PackageDetails = React.lazy(() => import('./pages/public/PackageDetails').then(m => ({ default: m.PackageDetails })));

// Placeholders for incomplete public pages
const Services = () => <div className="p-12 text-center text-2xl font-bold min-h-[60vh] flex items-center justify-center">الخدمات (قيد الإنشاء)</div>;
const Tourism = () => <div className="p-12 text-center text-2xl font-bold min-h-[60vh] flex items-center justify-center">البرامج السياحية (قيد الإنشاء)</div>;
const Hotels = () => <div className="p-12 text-center text-2xl font-bold min-h-[60vh] flex items-center justify-center">الفنادق (قيد الإنشاء)</div>;
const FAQ = () => <div className="p-12 text-center text-2xl font-bold min-h-[60vh] flex items-center justify-center">الأسئلة الشائعة (قيد الإنشاء)</div>;
const NotFound = () => <div className="p-12 text-center text-2xl font-bold min-h-[60vh] flex items-center justify-center flex-col gap-4"><span>404 - الصفحة غير موجودة</span><a href="/" className="text-primary text-base underline">العودة للرئيسية</a></div>;

// Lazy load admin pages
const AdminDashboard = React.lazy(() => import('./pages/admin/Dashboard').then(m => ({ default: m.AdminDashboard })));
const AdminPackages = React.lazy(() => import('./pages/admin/Packages').then(m => ({ default: m.AdminPackages })));
const AdminHotels = React.lazy(() => import('./pages/admin/Hotels').then(m => ({ default: m.AdminHotels })));
const AdminServices = React.lazy(() => import('./pages/admin/Services').then(m => ({ default: m.AdminServices })));
const AdminUsers = React.lazy(() => import('./pages/admin/Users').then(m => ({ default: m.AdminUsers })));
const AdminAccount = React.lazy(() => import('./pages/admin/Account').then(m => ({ default: m.AdminAccount })));

// ERP Pages
const ERPDashboard = React.lazy(() => import('./pages/admin/ERPDashboard').then(m => ({ default: m.ERPDashboard })));
const Trips = React.lazy(() => import('./pages/admin/Trips').then(m => ({ default: m.Trips })));
const TripDetails = React.lazy(() => import('./pages/admin/TripDetails').then(m => ({ default: m.TripDetails })));
const Reservations = React.lazy(() => import('./pages/admin/Reservations').then(m => ({ default: m.Reservations })));
const Expenses = React.lazy(() => import('./pages/admin/Expenses').then(m => ({ default: m.Expenses })));
const CashJournal = React.lazy(() => import('./pages/admin/CashJournal').then(m => ({ default: m.CashJournal })));

const SuspenseFallback = () => <div className="flex h-screen w-full items-center justify-center bg-slate-50"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Toaster position="top-center" toastOptions={{ className: 'font-sans font-bold text-center' }} />
        <Suspense fallback={<SuspenseFallback />}>
          <Routes>
            {/* Public Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/umrah" element={<UmrahPackages />} />
              <Route path="/package/:id" element={<PackageDetails />} />
              <Route path="/tourism" element={<Tourism />} />
              <Route path="/hotels" element={<Hotels />} />
              <Route path="/services" element={<Services />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/login" element={<Login />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="account" element={<AdminAccount />} />
              <Route path="packages" element={<AdminPackages />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="hotels" element={<AdminHotels />} />
              <Route path="services" element={<AdminServices />} />
              
              {/* ERP / Accounting System */}
              <Route path="erp" element={<ERPDashboard />} />
              <Route path="trips" element={<Trips />} />
              <Route path="trips/:id" element={<TripDetails />} />
              <Route path="reservations" element={<Reservations />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="cash-journal" element={<CashJournal />} />
              
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
