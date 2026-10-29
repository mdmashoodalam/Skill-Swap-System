import { Navigate } from "react-router-dom";
import useAuth from "../context/AuthContext";

export default function ProtectedAdminRoute({ children }) {
  const { auth, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (auth.role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// import { Navigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';

// export default function ProtectedAdminRoute({ children }) {
//   const { user } = useAuth();

//   if (!user) {
//     return <Navigate to="/login" replace />;
//   }

//   if (user.role !== 'ADMIN') {
//     return <Navigate to="/dashboard" replace />;
//   }

//   return children;
// }
