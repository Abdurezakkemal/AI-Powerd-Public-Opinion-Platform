import { Link } from "react-router-dom";
import { plannerKpis, plannerPolicies } from "../../constants/mock/planner";

export default function PlannerDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="m-0 text-2xl font-bold text-slate-900">Planner dashboard</h2>
          <p className="mt-1 text-sm text-slate-600">Manage your policies, track engagement, and monitor feedback quality.</p>
        </div>
        <Link to="/planner/policies" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
          Open policy manager
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {plannerKpis.map((kpi) => (
          <article key={kpi.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="m-0 text-sm font-medium text-slate-500">{kpi.label}</p>
            <p className="m-0 mt-2 text-3xl font-bold text-slate-900">{kpi.value}</p>
            <p className="m-0 mt-2 text-xs font-semibold text-emerald-700">{kpi.change}</p>
          </article>
        ))}
      </div>

      <section className="rounded-xl border border-slate-200 p-4">
        <h3 className="m-0 text-lg font-semibold text-slate-900">My latest policies</h3>
        <div className="mt-3 grid gap-3">
          {plannerPolicies.slice(0, 3).map((policy) => (
            <article key={policy.id} className="rounded-lg bg-slate-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="m-0 font-semibold text-slate-900">{policy.title}</p>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">{policy.status}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{policy.policyCode} • Votes: {policy.totalVotes} • Rating: {policy.averageRating}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
