import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import AppLayout from './layouts/AppLayout'
import AdminLayout from './layouts/AdminLayout'
import ProtectedRoute from './components/ProtectedRoute'
import ProtectedAdminRoute from './components/ProtectedAdminRoute'

const LandingPage = lazy(() => import('./pages/LandingPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const MatchesPage = lazy(() => import('./pages/MatchesPage'))
const RequestsPage = lazy(() => import('./pages/RequestsPage'))
const ChatPage = lazy(() => import('./pages/ChatPage'))
const ChatRoomPage = lazy(() => import('./pages/ChatRoomPage'))
const SessionsPage = lazy(() => import('./pages/SessionsPage'))
const ReviewsPage = lazy(() => import('./pages/ReviewsPage'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'))
const SkillsPage = lazy(() => import('./pages/SkillsPage'))
const GoalsPage = lazy(() => import('./pages/GoalsPage'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminSkills = lazy(() => import('./pages/admin/AdminSkills'))
const AdminRequests = lazy(() => import('./pages/admin/AdminRequests'))
const AdminMatches = lazy(() => import('./pages/admin/AdminMatches'))
const AdminReports = lazy(() => import('./pages/admin/AdminReports'))

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-primary">Loading…</div>}>
        <Routes>
        <Route path="/" element={<AppLayout><LandingPage /></AppLayout>} />
        <Route path="/login" element={<AppLayout><LoginPage /></AppLayout>} />
        <Route path="/register" element={<AppLayout><RegisterPage /></AppLayout>} />
        <Route path="/forgot-password" element={<AppLayout><ForgotPasswordPage /></AppLayout>} />
        <Route path="/reset-password" element={<AppLayout><ResetPasswordPage /></AppLayout>} />
        <Route path="/verify-email" element={<AppLayout><VerifyEmailPage /></AppLayout>} />
        <Route path="/dashboard" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><AppLayout><ProfilePage /></AppLayout></ProtectedRoute>} />
        <Route path="/matches" element={<ProtectedRoute><AppLayout><MatchesPage /></AppLayout></ProtectedRoute>} />
        <Route path="/requests" element={<ProtectedRoute><AppLayout><RequestsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><AppLayout><ChatPage /></AppLayout></ProtectedRoute>} />
        <Route path="/chat/:matchId" element={<ProtectedRoute><AppLayout><ChatRoomPage /></AppLayout></ProtectedRoute>} />
        <Route path="/sessions" element={<ProtectedRoute><AppLayout><SessionsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/reviews" element={<ProtectedRoute><AppLayout><ReviewsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><AppLayout><NotificationsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/skills" element={<ProtectedRoute><AppLayout><SkillsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/goals" element={<ProtectedRoute><AppLayout><GoalsPage /></AppLayout></ProtectedRoute>} />

        {/* Admin routes */}
        <Route element={<ProtectedAdminRoute><AdminLayout /></ProtectedAdminRoute>}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/skills" element={<AdminSkills />} />
          <Route path="/admin/requests" element={<AdminRequests />} />
          <Route path="/admin/matches" element={<AdminMatches />} />
          <Route path="/admin/reports" element={<AdminReports />} />
        </Route>
        </Routes>
      </Suspense>
      </NotificationProvider>
    </AuthProvider>
  )
}
