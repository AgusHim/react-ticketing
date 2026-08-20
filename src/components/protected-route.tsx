// src/components/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = () => {
    const { user, isInitialized } = useAuth();

    if (!isInitialized) {
        return <div className="flex min-h-svh items-center justify-center font-bold">Memuat sesi...</div>
    }
    if (user == null) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
