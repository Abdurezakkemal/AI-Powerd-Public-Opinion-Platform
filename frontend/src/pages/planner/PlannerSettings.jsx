export default function PlannerSettings() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="m-0 text-2xl font-bold text-slate-900">Planner settings</h2>
        <p className="mt-1 text-sm text-slate-600">Configure planner workspace behavior and notifications.</p>
      </div>

      <section className="rounded-xl border border-slate-200 p-4">
        <h3 className="m-0 text-lg font-semibold text-slate-900">Workspace preferences</h3>
        <div className="mt-3 grid gap-2">
          <label className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <input className="h-4 w-4 accent-emerald-700" type="checkbox" defaultChecked />
            Email alerts for new feedback
          </label>
          <label className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <input className="h-4 w-4 accent-emerald-700" type="checkbox" defaultChecked />
            Weekly analytics digest
          </label>
          <label className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <input className="h-4 w-4 accent-emerald-700" type="checkbox" />
            Quiet mode outside office hours
          </label>
        </div>
      </section>
    </div>
  );
}
