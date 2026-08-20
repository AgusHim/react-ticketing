import type { User } from "@/types/user";
import { useEffect, useState } from "react";
import { AuthContext, type AuthContextType } from "./AuthContext";
import { getMe, login, logoutSession, refreshSession } from "@/api/user-api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        const restore = token ? getMe() : refreshSession();
        restore
            .then((currentUser) => {
                setUser(currentUser);
                localStorage.setItem("user", JSON.stringify(currentUser));
            })
            .catch(() => {
                localStorage.removeItem("user");
                localStorage.removeItem("token");
                setUser(null);
            })
            .finally(() => setIsInitialized(true));
    }, []);

    const handleLogin = async (email: string, password: string): Promise<User | null> => {
        try {
            const user = await login(email, password);

            setUser(user as User);
            navigate(user.role === "admin" ? "/dashboard" : "/account/communities");
            return user as User;
        } catch (err) {
            toast.error(`Gagal Login: ${err}`);
            return null;
        }

    };

    const logout = () => {
        void logoutSession().catch(() => undefined);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setUser(null);
        navigate("/login");
    };

    const value: AuthContextType = {
        user,
        handleLogin,
        logout,
        isAuthenticated: !!user,
        isInitialized,
        setUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
