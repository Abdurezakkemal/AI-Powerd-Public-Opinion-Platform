import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { plannerPolicies } from "../../constants/mock/planner";

export default function PlannerPolicyEditor() {
  const { policyId } = useParams();
  const policy = useMemo(
    () => plannerPolicies.find((item) => item.id === policyId),
    [policyId],
  );

  const [formState, setFormState] = useState(() => ({
    title: policy?.title || "",
    description: policy?.description || "",
    startDate: policy?.startDate || "",
    endDate: policy?.endDate || "",
  }));

  if (!policy) {
    return (
      <div className="space-y-3">
        <h2 className="m-0 text-2xl font-bold text-slate-900">Policy not found</h2>
        <p className="text-sm text-slate-600">The selected policy does not exist in this demo dataset.</p>
        <Link to="/planner/policies" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">Back to policies</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link to="/planner/policies" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">&larr; Back to policy list</Link>

      <div>
        <p className="m-0 text-xs font-semibold uppercase tracking-wide text-emerald-700">{policy.policyCode}</p>
        <h2 className="m-0 mt-1 text-2xl font-bold text-slate-900">Policy editor</h2>
      </div>

      <form className="grid gap-4 rounded-xl border border-slate-200 p-4">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-slate-700">Title</span>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            value={formState.title}
            onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-slate-700">Description</span>
          <textarea
            rows="5"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            value={formState.description}
            onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-700">Start date</span>
            <input
              type="date"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              value={formState.startDate}
              onChange={(event) => setFormState((prev) => ({ ...prev, startDate: event.target.value }))}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-700">End date</span>
            <input
              type="date"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              value={formState.endDate}
              onChange={(event) => setFormState((prev) => ({ ...prev, endDate: event.target.value }))}
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Save draft</button>
          <button type="button" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Publish / Activate</button>
          <button type="button" className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50">Close policy</button>
        </div>
      </form>
    </div>
  );
}
