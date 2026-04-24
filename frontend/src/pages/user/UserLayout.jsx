import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/user", label: "Overview", end: true },
  { to: "/user/policies", label: "Policies" },
  { to: "/user/history", label: "My History" },
  { to: "/user/profile", label: "Profile" },
];

export default function UserLayout() {
  return (
    <div className="flex min-h-screen flex-col text-slate-900">
      <header className="animate-navbar-drop bg-white/90 backdrop-blur">
        <div className="flex w-full items-center gap-7 overflow-x-auto pl-10 pr-4 py-4 md:pl-16 md:pr-6 md:py-5">
          <div className="flex items-center gap-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-600 to-green-800 text-xs font-extrabold tracking-[0.08em] text-white">HV</span>
            <div>
              <p className="m-0 text-sm font-semibold text-slate-600">HizbView</p>
            </div>
          </div>

          <nav className="ml-3 flex min-w-max items-center gap-4" aria-label="User navigation">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  [
                    "rounded-lg px-4 py-1.5 text-sm font-semibold transition duration-300 hover:-translate-y-0.5 hover:shadow-sm",
                    isActive
                      ? "bg-emerald-600 text-white"
                      : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-800",
                  ].join(" ")
                }
                style={{ animationDelay: `${links.indexOf(link) * 70}ms` }}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex min-w-max items-center gap-3 transition duration-300 hover:-translate-y-0.5">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-orange-700 text-xs font-bold text-white">
              AB
            </div>
            <p className="m-0 pr-2 text-sm font-semibold text-slate-800">Alemu Belachew</p>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="w-full px-4 py-4 md:px-6 md:py-5">
          <section className="rounded-2xl bg-white p-4 shadow-sm md:p-5">
            <Outlet />
          </section>
        </div>
      </main>

      <footer className="bg-white px-4 py-4 text-center text-sm text-slate-500 md:px-6">
        HizbView © 2026. Built for civic participation.
      </footer>
    </div>
  );
}
