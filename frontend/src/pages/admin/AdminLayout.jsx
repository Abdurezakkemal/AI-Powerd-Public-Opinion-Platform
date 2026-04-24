import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/planners", label: "Planners" },
  { to: "/admin/citizens", label: "Citizens" },
  { to: "/admin/feedback", label: "Moderation" },
  { to: "/admin/analytics", label: "Analytics" },
  { to: "/admin/settings", label: "Settings" },
];

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="flex w-full items-center gap-6 overflow-x-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-600 text-xs font-bold tracking-[0.08em] text-white">
              HV
            </span>
            <div>
              <p className="m-0 text-sm font-semibold text-slate-500">HizbView</p>
              <p className="m-0 text-base font-bold text-slate-900">Admin Console</p>
            </div>
          </div>

          <nav className="ml-4 flex min-w-max items-center gap-2" aria-label="Admin navigation">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  [
                    "rounded-lg px-3 py-1.5 text-sm font-semibold transition",
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100",
                  ].join(" ")
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex min-w-max items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
              AD
            </div>
            <p className="m-0 text-sm font-semibold text-slate-800">Admin User</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-5">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <Outlet />
        </section>
      </main>
    </div>
  );
}






