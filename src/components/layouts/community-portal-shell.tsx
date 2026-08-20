import { Link, NavLink, Outlet, useParams } from "react-router-dom";
import { IconLayoutDashboard, IconSettings, IconUsers } from "@tabler/icons-react";

export function CommunityPortalShell() {
  const { communityId = "" } = useParams();
  const base = `/portal/${communityId}`;

  return (
    <div className="min-h-svh bg-bg-app md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-b-2 border-neo-border bg-white p-4 md:min-h-svh md:border-b-0 md:border-r-2">
        <Link to="/account/communities" className="text-xl font-black">usloop.id</Link>
        <p className="mt-2 break-all text-xs text-muted-foreground">Community: {communityId}</p>
        <nav className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-1">
          <NavLink
            end
            to={base}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-xl border-2 border-neo-border px-3 py-2 text-sm font-bold ${
                isActive ? "bg-neo-yellow-solid" : "bg-white"
              }`
            }
          >
            <IconLayoutDashboard className="size-5" /> Ringkasan
          </NavLink>
          <NavLink
            to={`${base}/members`}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-xl border-2 border-neo-border px-3 py-2 text-sm font-bold ${
                isActive ? "bg-neo-yellow-solid" : "bg-white"
              }`
            }
          >
            <IconUsers className="size-5" /> Tim
          </NavLink>
          <NavLink
            to={`${base}/profile`}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-xl border-2 border-neo-border px-3 py-2 text-sm font-bold ${
                isActive ? "bg-neo-yellow-solid" : "bg-white"
              }`
            }
          >
            <IconSettings className="size-5" /> Profil
          </NavLink>
        </nav>
      </aside>
      <main className="min-w-0 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
