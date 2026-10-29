import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Menu, X, LogOut, BarChart3, Users, Zap, CheckCircle, Share2, Flag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const mobileMenuButtonRef = useRef(null);

  useEffect(() => {
    const movedFromSidebar = document.activeElement?.closest('#admin-navigation');
    setMobileSidebarOpen(false);
    if (movedFromSidebar) document.getElementById('admin-main-content')?.focus();
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileSidebarOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setMobileSidebarOpen(false);
        mobileMenuButtonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [mobileSidebarOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: BarChart3 },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/skills', label: 'Skills', icon: Zap },
    { path: '/admin/requests', label: 'Swap Requests', icon: Share2 },
    { path: '/admin/matches', label: 'Matches', icon: CheckCircle },
    { path: '/admin/reports', label: 'Reports', icon: Flag },
  ];

  return (
    <div className="flex min-h-screen bg-page">
      <a href="#admin-main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-white focus:px-4 focus:py-3 focus:font-semibold focus:text-primary focus:shadow-lg">
        Skip to main content
      </a>
      {mobileSidebarOpen && (
        <button type="button" aria-label="Close admin navigation" onClick={() => setMobileSidebarOpen(false)} className="fixed inset-0 z-30 bg-black/40 md:hidden" />
      )}
      {/* Sidebar */}
      <aside id="admin-navigation" aria-label="Admin navigation" className={`${sidebarOpen ? 'md:w-64' : 'md:w-20'} ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} fixed inset-y-0 left-0 z-40 w-64 md:sticky md:top-0 md:h-screen shrink-0 bg-gradient-to-b from-primary-dark via-primary to-[#185f57] text-white transition-all duration-300 shadow-xl`}>
        {/* Logo */}
        <div className="p-4 flex items-center justify-between">
          <span className={`text-2xl font-bold ${!sidebarOpen ? 'md:hidden' : ''}`}>Admin</span>
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close admin navigation"
            className="md:hidden min-h-11 min-w-11 flex items-center justify-center hover:bg-teal-600 rounded"
          >
            <X size={20} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Collapse admin navigation' : 'Expand admin navigation'}
            aria-expanded={sidebarOpen}
            className="hidden md:flex min-h-11 min-w-11 items-center justify-center hover:bg-teal-600 rounded"
          >
            {sidebarOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>

        {/* Navigation */}
        <nav aria-label="Admin pages" className="mt-8">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              aria-label={!sidebarOpen ? item.label : undefined}
              aria-current={location.pathname === item.path ? 'page' : undefined}
              onClick={() => setMobileSidebarOpen(false)}
              className={`flex min-h-11 items-center gap-3 px-4 py-3 hover:bg-teal-600 transition-colors group ${location.pathname === item.path ? 'bg-teal-900' : ''}`}
            >
              <item.icon size={20} aria-hidden="true" />
              <span className={`${!sidebarOpen ? 'md:hidden' : ''} group-hover:translate-x-1 transition-transform`}>
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-4 left-0 right-0 px-4">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full min-h-11 flex items-center gap-3 px-4 py-3 bg-red-700 hover:bg-red-800 rounded-lg transition-colors"
            aria-label={sidebarOpen ? 'Log out' : 'Log out of admin account'}
          >
            <LogOut size={20} aria-hidden="true" />
            <span className={!sidebarOpen ? 'md:hidden' : ''}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="min-w-0 flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur border-b border-surface-300/80 shadow-sm">
          <div className="px-4 sm:px-8 py-4 flex justify-between items-center gap-3">
            <button
              ref={mobileMenuButtonRef}
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open admin navigation"
              aria-expanded={mobileSidebarOpen}
              aria-controls="admin-navigation"
              className="md:hidden min-h-11 min-w-11 flex items-center justify-center rounded-lg hover:bg-gray-100"
            >
              <Menu size={22} aria-hidden="true" />
            </button>
            <h1 className="text-2xl font-bold tracking-tight text-primary">Admin Panel</h1>
            <div className="hidden sm:block text-right">
              <p className="text-gray-600 text-sm">Admin Dashboard</p>
              <p className="text-gray-500 text-xs">SkillSwap Platform</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <main id="admin-main-content" tabIndex={-1} className="flex-1 min-w-0">
          <div className="p-4 sm:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
