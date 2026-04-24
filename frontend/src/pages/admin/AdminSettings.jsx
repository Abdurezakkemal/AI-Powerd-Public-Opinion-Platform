import { auditLogs } from "../../constants/mock/admin";

export default function AdminSettings() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="m-0 text-2xl font-bold text-slate-900">System settings</h2>
        <p className="mt-1 text-sm text-slate-600">Configure operational settings and review audit activity.</p>
      </div>

      <section className="rounded-xl border border-slate-200 p-4">
        <h3 className="m-0 text-lg font-semibold text-slate-900">Operational controls</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <input className="h-4 w-4 accent-slate-800" type="checkbox" defaultChecked />
            Enable global API rate limiting
          </label>
          <label className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <input className="h-4 w-4 accent-slate-800" type="checkbox" defaultChecked />
            Allow planner account creation
          </label>
          <label className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <input className="h-4 w-4 accent-slate-800" type="checkbox" defaultChecked />
            Process feedback with AI worker
          </label>
          <label className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <input className="h-4 w-4 accent-slate-800" type="checkbox" />
            Maintenance mode
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 p-4">
        <h3 className="m-0 text-lg font-semibold text-slate-900">Audit log</h3>
        <div className="mt-3 grid gap-2">
          {auditLogs.map((log) => (
            <article key={log.id} className="rounded-lg bg-slate-50 px-3 py-2">
              <p className="m-0 text-sm font-semibold text-slate-800">{log.action}</p>
              <p className="mt-1 text-xs text-slate-500">{log.actor} • {log.target} • {log.at}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
