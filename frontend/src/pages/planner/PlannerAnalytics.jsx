import { plannerTrends } from "../../constants/mock/planner";

export default function PlannerAnalytics() {
  const maxVotes = Math.max(...plannerTrends.map((item) => item.votes));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="m-0 text-2xl font-bold text-slate-900">Planner analytics</h2>
        <p className="mt-1 text-sm text-slate-600">Track votes trend and campaign momentum across recent weeks.</p>
      </div>

      <section className="rounded-xl border border-slate-200 p-4">
        <h3 className="m-0 text-lg font-semibold text-slate-900">Weekly vote trend</h3>
        <div className="mt-4 flex h-56 items-end gap-3 rounded-xl bg-slate-50 p-4">
          {plannerTrends.map((item) => (
            <div key={item.period} className="flex flex-1 flex-col items-center gap-2">
              <div className="w-full rounded-t-xl bg-gradient-to-t from-emerald-700 to-emerald-400" style={{ height: `${(item.votes / maxVotes) * 100}%` }} />
              <span className="text-xs font-semibold text-slate-500">{item.period}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
