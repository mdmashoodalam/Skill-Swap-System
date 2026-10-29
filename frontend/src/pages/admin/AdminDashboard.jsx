import React, { useState, useEffect } from 'react';
import { Users, Zap, TrendingUp, Share2 } from 'lucide-react';
import api from '../../api/client';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSkills: 0,
    totalMatches: 0,
    pendingRequests: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      // ✅ FIX: removed /api prefix — baseURL already includes /api
      const usersRes    = await api.get('/users');
      const skillsRes   = await api.get('/skills');
      const matchesRes  = await api.get('/matches/all');
      const requestsRes = await api.get('/swap-requests/all'); // ✅ FIX: was /incoming (no userId)

      setStats({
        totalUsers:      usersRes.data?.length    || 0,
        totalSkills:     skillsRes.data?.length   || 0,
        totalMatches:    matchesRes.data?.length  || 0,
        pendingRequests: requestsRes.data?.filter(r => r.status === 'PENDING').length || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{loading ? '-' : value}</p>
        </div>
        <Icon className="text-gray-300" size={40} />
      </div>
    </div>
  );

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-8">Dashboard Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={Users}     label="Total Users"       value={stats.totalUsers}      color="border-blue-500"   />
        <StatCard icon={Zap}       label="Total Skills"      value={stats.totalSkills}     color="border-yellow-500" />
        <StatCard icon={TrendingUp} label="Active Matches"   value={stats.totalMatches}    color="border-green-500"  />
        <StatCard icon={Share2}    label="Pending Requests"  value={stats.pendingRequests} color="border-purple-500" />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-600 font-medium transition-colors">
            View All Users
          </button>
          <button className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-yellow-600 font-medium transition-colors">
            Manage Skills
          </button>
          <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-green-600 font-medium transition-colors">
            Review Matches
          </button>
          <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-600 font-medium transition-colors">
            Pending Requests
          </button>
        </div>
      </div>
    </div>
  );
}