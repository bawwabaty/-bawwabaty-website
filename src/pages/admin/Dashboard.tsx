import { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Package, Users, Building2, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export function AdminDashboard() {
  const [stats, setStats] = useState({
    packages: 0,
    hotels: 0,
    users: 0,
    services: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [packagesSnap, hotelsSnap, usersSnap] = await Promise.all([
          getDocs(query(collection(db, 'packages'))),
          getDocs(query(collection(db, 'hotels'))),
          getDocs(query(collection(db, 'users')))
        ]);

        setStats({
          packages: packagesSnap.size,
          hotels: hotelsSnap.size,
          users: usersSnap.size,
          services: 0 // Stub
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { title: 'إجمالي الباقات', value: stats.packages, icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'الفنادق المسجلة', value: stats.hotels, icon: Building2, color: 'text-orange-600', bg: 'bg-orange-100' },
    { title: 'العملاء', value: stats.users, icon: Users, color: 'text-green-600', bg: 'bg-green-100' },
    { title: 'الخدمات المتاحة', value: stats.services, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">نظرة عامة</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4"
          >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${stat.bg}`}>
              <stat.icon className={`w-7 h-7 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{stat.title}</p>
              <h3 className="text-2xl font-black text-slate-800">
                {loading ? '...' : stat.value}
              </h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mt-8">
        <h3 className="text-lg font-bold text-slate-800 mb-4">أهلاً بك في لوحة التحكم</h3>
        <p className="text-slate-600">
          من هنا يمكنك إدارة محتوى الموقع بالكامل. يمكنك إضافة وتعديل وحذف باقات العمرة، وإدارة أسماء الفنادق والخدمات، والإطلاع على إحصائيات عامة للموقع.
        </p>
      </div>
    </div>
  );
}
