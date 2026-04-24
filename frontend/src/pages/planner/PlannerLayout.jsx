import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/planner", label: "Dashboard", end: true },
  { to: "/planner/policies", label: "Policies" },
  { to: "/planner/feedback", label: "Feedback" },
  { to: "/planner/analytics", label: "Analytics" },
  { to: "/planner/profile", label: "Profile" },
  { to: "/planner/settings", label: "Settings" },
];

export default function PlannerLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-emerald-50/20 text-slate-900">
      <header className="border-b border-slate-200 bg-white/95">
        <div className="flex w-full items-center gap-5 overflow-x-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-700 to-green-600 text-xs font-bold tracking-[0.08em] text-white">
              HV
            </span>
            <div>
              <p className="m-0 text-sm font-semibold text-slate-500">HizbView</p>
              <p className="m-0 text-base font-bold text-slate-900">Planner Workspace</p>
            </div>
          </div>

          <nav className="ml-4 flex min-w-max items-center gap-2" aria-label="Planner navigation">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  [
                    "rounded-lg px-3 py-1.5 text-sm font-semibold transition",
                    isActive
                      ? "bg-emerald-600 text-white"
                      : "text-slate-700 hover:bg-emerald-100 hover:text-emerald-900",
                  ].join(" ")
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex min-w-max items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
              PL
            </div>
            <p className="m-0 text-sm font-semibold text-slate-800">Planner User</p>
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
