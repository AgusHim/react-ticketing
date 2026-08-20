import type { User } from "@/types/user";
import  { createContext, useContext } from "react";

export interface AuthContextType {
  user: User | null;
  handleLogin: (email:string, password:string) => Promise<User|null>;
  logout: () => void;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setUser:React.Dispatch<React.SetStateAction<User | null>>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
