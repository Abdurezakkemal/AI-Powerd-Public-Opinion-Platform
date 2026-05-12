import { BarChart3, Bell, FileText, Inbox, LayoutDashboard, LogOut, Menu, Settings, Users, X, AlertCircle, TrendingUp, Clock, Lock } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const baseLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/policies", label: "Policies", icon: FileText },
  { to: "/analytics/cross", label: "Cross Analytics", icon: BarChart3 },
  { to: "/messages", label: "Messages", icon: Inbox },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/settings", label: "Settings", icon: Settings },
];

const adminLinks = [
  { to: "/users", label: "Planner Accounts", icon: Users },
  { to: "/citizens", label: "Citizens", icon: Users },
  { to: "/planner-requests", label: "Planner Requests", icon: Users },
  { to: "/comments/pending", label: "Pending Comments", icon: AlertCircle },
  { to: "/trends", label: "Trends", icon: TrendingUp },
  { to: "/audit-logs", label: "Audit Logs", icon: Clock },
];

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const links = role === "admin" ? [...baseLinks, ...adminLinks] : baseLinks;

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <div className="lg:hidden">
        {sidebarOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-slate-950/40"
            aria-label="Close navigation overlay"
            onClick={() => setSidebarOpen(false)}
          />
        ) : null}
      </div>

      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-teal-700 text-sm font-black text-white">
              CP
            </span>
            <div>
              <p className="m-0 text-sm font-bold text-slate-950">Civic Platform</p>
              <p className="m-0 text-xs text-slate-500">Planner dashboard</p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Dashboard navigation">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={`${link.to}-${link.label}`}
                to={link.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition",
                    isActive && link.label !== "Analytics"
                      ? "bg-teal-700 text-white shadow-sm"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
                  ].join(" ")
                }
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-4">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="truncate text-sm font-semibold text-slate-950">{user?.email || "Dashboard user"}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{role}</p>
            <NavLink
              to="/change-password"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                [
                  "mt-3 flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-semibold transition",
                  isActive
                    ? "bg-teal-700 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-700",
                ].join(" ")
              }
            >
              <Lock className="h-3.5 w-3.5" />
              Change password
            </NavLink>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-sm font-semibold text-slate-500">Welcome back</p>
              <h1 className="text-base font-bold text-slate-950 sm:text-lg">{user?.email || "Dashboard user"}</h1>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
