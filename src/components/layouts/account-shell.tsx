import { Link, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export function AccountShell() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-svh bg-bg-app">
      <header className="border-b-2 border-neo-border bg-white">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center gap-4 px-4 py-3">
          <Link to="/" className="text-xl font-black">usloop.id</Link>
          <nav className="ml-4 hidden gap-4 text-sm font-bold sm:flex">
            <Link to="/account/communities">Komunitas Saya</Link>
            <Link to="/account/following">Komunitas Diikuti</Link>
            <Link to="/account/sessions">Sesi Perangkat</Link>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm font-semibold sm:inline">{user?.name}</span>
            <Button type="button" variant="outline" size="sm" onClick={logout}>
              Keluar
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
