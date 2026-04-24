import { Link } from "react-router-dom";
import { adminKpis, pendingFeedback } from "../../constants/mock/admin";

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="m-0 text-2xl font-bold text-slate-900">Admin dashboard</h2>
          <p className="mt-1 text-sm text-slate-600">Operational overview for user management, moderation, and analytics.</p>
        </div>
        <Link to="/admin/feedback" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
          Review pending feedback
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {adminKpis.map((kpi) => (
          <article key={kpi.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="m-0 text-sm font-medium text-slate-500">{kpi.label}</p>
            <p className="m-0 mt-2 text-3xl font-bold text-slate-900">{kpi.value}</p>
            <p className="m-0 mt-2 text-xs font-semibold text-emerald-700">{kpi.change} this cycle</p>
          </article>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-xl border border-slate-200 p-4">
          <h3 className="m-0 text-lg font-semibold text-slate-900">Moderation queue</h3>
          <div className="mt-3 grid gap-3">
            {pendingFeedback.slice(0, 3).map((item) => (
              <article key={item.id} className="rounded-lg bg-slate-50 p-3">
                <p className="m-0 text-sm font-semibold text-slate-800">{item.policyTitle}</p>
                <p className="mt-1 text-xs text-slate-500">{item.userEmail} • {item.createdAt}</p>
                <p className="mt-2 text-sm text-slate-600">{item.comment}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 p-4">
          <h3 className="m-0 text-lg font-semibold text-slate-900">Quick actions</h3>
          <div className="mt-3 grid gap-2">
            <Link to="/admin/planners" className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-200">Manage planners</Link>
            <Link to="/admin/citizens" className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-200">Manage citizens</Link>
            <Link to="/admin/analytics" className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-200">Open analytics</Link>
            <Link to="/admin/settings" className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-200">System settings</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
