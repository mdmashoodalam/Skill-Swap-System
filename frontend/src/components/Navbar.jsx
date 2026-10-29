import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, Bell, LogOut, User, Home } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNotifications } from '../context/NotificationContext';

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const mobileMenuButtonRef = useRef(null);

  useEffect(() => {
    const movedFromMenu = document.activeElement?.closest('#mobile-navigation-menu')
    setMobileOpen(false);
    if (movedFromMenu) document.getElementById('main-content')?.focus();
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
        mobileMenuButtonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [mobileOpen]);

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const handleLogout = () => { logout(); setMobileOpen(false); };

  return (
    <nav aria-label="Main navigation" className="bg-white/95 backdrop-blur-md border-b border-surface-300/80 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link to="/" aria-label="SkillSwap home" className="flex items-center gap-2 flex-shrink-0 rounded-lg">
              <div aria-hidden="true" className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-xl font-bold text-white">S</span>
            </div>
            <span className="hidden sm:flex font-bold text-xl tracking-tight text-primary">SkillSwap</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-0.5">
            {isAuthenticated && (
              <>
                <NavLink to="/dashboard" isActive={isActive('/dashboard')} icon={<Home size={18} />}>Dashboard</NavLink>
                <NavLink to="/matches"   isActive={isActive('/matches')}>Matches</NavLink>
                <NavLink to="/skills"    isActive={isActive('/skills')}>Skills</NavLink>
                <NavLink to="/goals"     isActive={isActive('/goals')}>Goals</NavLink>
                <NavLink to="/requests"  isActive={isActive('/requests')}>Requests</NavLink>
                <NavLink to="/chat"      isActive={isActive('/chat')}>Chat</NavLink>
                <NavLink to="/sessions"  isActive={isActive('/sessions')}>Sessions</NavLink>
              </>
            )}
          </div>

          {/* Right Side */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link to="/notifications" aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'} className="min-h-11 min-w-11 p-2 hover:bg-cream-100 rounded-lg transition-colors relative inline-flex items-center justify-center">
                  <Bell size={20} aria-hidden="true" className="text-grey-400" />
                  <span className="sr-only" aria-live="polite" aria-atomic="true">
                    {unreadCount > 0 ? `${unreadCount} unread notifications` : 'No unread notifications'}
                  </span>
                  {unreadCount > 0 && (
                    <span aria-hidden="true" className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link to="/profile" aria-label="Your profile" className="min-h-11 min-w-11 p-2 hover:bg-cream-100 rounded-lg transition-colors inline-flex items-center justify-center">
                  <User size={20} aria-hidden="true" className="text-grey-400" />
                </Link>
                <button onClick={handleLogout} className="btn-secondary min-h-11 flex items-center gap-2">
                  <LogOut size={18} aria-hidden="true" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login"    className="btn-tertiary">Login</Link>
                <Link to="/register" className="btn-primary">Sign Up</Link>
              </>
            )}
          </div>

          {/* Mobile Button */}
          <button
            ref={mobileMenuButtonRef}
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden min-h-11 min-w-11 flex items-center justify-center hover:bg-cream-100 rounded-lg"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation-menu"
          >
            {mobileOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div id="mobile-navigation-menu" hidden={!mobileOpen} className="lg:hidden border-t border-surface-300 py-4">
            {isAuthenticated ? (
              <>
                <MobileNavLink to="/dashboard"     onClick={() => setMobileOpen(false)}>Dashboard</MobileNavLink>
                <MobileNavLink to="/matches"        onClick={() => setMobileOpen(false)}>Matches</MobileNavLink>
                <MobileNavLink to="/skills"         onClick={() => setMobileOpen(false)}>Skills</MobileNavLink>
                <MobileNavLink to="/requests"       onClick={() => setMobileOpen(false)}>Requests</MobileNavLink>
                <MobileNavLink to="/chat"           onClick={() => setMobileOpen(false)}>Chat</MobileNavLink>
                <MobileNavLink to="/sessions"       onClick={() => setMobileOpen(false)}>Sessions</MobileNavLink>
                <MobileNavLink to="/goals"          onClick={() => setMobileOpen(false)}>Goals</MobileNavLink>
                <MobileNavLink to="/notifications"  onClick={() => setMobileOpen(false)}>
                  Notifications {unreadCount > 0 && `(${unreadCount})`}
                </MobileNavLink>
                <MobileNavLink to="/profile"        onClick={() => setMobileOpen(false)}>Profile</MobileNavLink>
                <button
                  onClick={handleLogout}
                  className="w-full min-h-11 text-left px-4 py-3 hover:bg-cream-100 text-red-700 font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <MobileNavLink to="/login"    onClick={() => setMobileOpen(false)}>Login</MobileNavLink>
                <MobileNavLink to="/register" onClick={() => setMobileOpen(false)}>Sign Up</MobileNavLink>
              </>
            )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, isActive, children, icon }) {
  return (
    <Link to={to} aria-current={isActive ? 'page' : undefined} className={`min-h-11 px-2.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors ${
      isActive ? 'bg-primary text-white' : 'text-primary hover:bg-cream-100'
    }`}>
      {icon && <span aria-hidden="true">{icon}</span>}{children}
    </Link>
  );
}

function MobileNavLink({ to, children, onClick }) {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);
  return (
    <Link to={to} onClick={onClick} aria-current={isActive ? 'page' : undefined} className={`flex min-h-11 items-center px-4 py-3 hover:bg-cream-100 text-primary font-medium ${isActive ? 'bg-cream-100' : ''}`}>
      {children}
    </Link>
  );
}
