import { Navigate } from "react-router-dom";
import useAuth from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// import { Navigate } from 'react-router-dom'
// import { useAuth } from '../context/AuthContext'

// export default function ProtectedRoute({ children }) {
//   const { isAuthenticated } = useAuth()
//   return isAuthenticated ? children : <Navigate to="/login" replace />
// }
