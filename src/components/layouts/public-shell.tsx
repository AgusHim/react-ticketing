import { Link, NavLink, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export function PublicShell() {
  const { user, isInitialized } = useAuth();

  return (
    <div className="min-h-svh bg-bg-app">
      <header className="sticky top-0 z-40 border-b-2 border-neo-border bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
          <Link to="/" className="text-xl font-black tracking-tight">
            usloop.id
          </Link>
          <nav className="hidden items-center gap-5 text-sm font-bold md:flex">
            <NavLink to="/" className={({ isActive }) => isActive ? "underline decoration-2 underline-offset-4" : ""}>
              Event
            </NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {isInitialized && user ? (
              <Button asChild size="sm">
                <Link to={user.role === "admin" ? "/dashboard" : "/account/communities"}>
                  Dashboard
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline" size="sm">
                  <Link to="/login">Masuk</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/register">Daftar</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
