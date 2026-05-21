import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { PublicLayout } from './components/layout/PublicLayout';
import { AdminLayout } from './components/layout/AdminLayout';

// Public Pages
import { Home } from './pages/public/Home';
import { Login } from './pages/public/Login';
import { UmrahPackages } from './pages/public/UmrahPackages';
import { Contact } from './pages/public/Contact';
import { About } from './pages/public/About';
import { PackageDetails } from './pages/public/PackageDetails';

// Placeholders for incomplete public pages
const Services = () => <div className="p-8 text-center text-2xl font-bold">الخدمات (قيد الإنشاء)</div>;
const Tourism = () => <div className="p-8 text-center text-2xl font-bold">البرامج السياحية (قيد الإنشاء)</div>;
const Hotels = () => <div className="p-8 text-center text-2xl font-bold">الفنادق (قيد الإنشاء)</div>;
const FAQ = () => <div className="p-8 text-center text-2xl font-bold">الأسئلة الشائعة (قيد الإنشاء)</div>;

// Admin Pages
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminPackages } from './pages/admin/Packages';
import { AdminHotels } from './pages/admin/Hotels';
import { AdminServices } from './pages/admin/Services';
import { AdminUsers } from './pages/admin/Users';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-center" toastOptions={{ className: 'font-sans' }} />
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
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="packages" element={<AdminPackages />} />
            <Route path="hotels" element={<AdminHotels />} />
            <Route path="services" element={<AdminServices />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
