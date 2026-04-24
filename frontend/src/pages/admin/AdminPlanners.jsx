import { useState } from "react";
import { planners as plannerSeed } from "../../constants/mock/admin";

export default function AdminPlanners() {
  const [planners, setPlanners] = useState(plannerSeed);
  const [newPlanner, setNewPlanner] = useState({ email: "", password: "" });

  const togglePlanner = (id) => {
    setPlanners((previous) =>
      previous.map((planner) =>
        planner.id === id ? { ...planner, active: !planner.active } : planner,
      ),
    );
  };

  const createPlanner = (event) => {
    event.preventDefault();
    if (!newPlanner.email || !newPlanner.password) {
      return;
    }

    setPlanners((previous) => [
      {
        id: `p${previous.length + 1}`,
        email: newPlanner.email,
        active: true,
        verified: true,
        createdAt: "2026-04-14",
      },
      ...previous,
    ]);
    setNewPlanner({ email: "", password: "" });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="m-0 text-2xl font-bold text-slate-900">Planner management</h2>
        <p className="mt-1 text-sm text-slate-600">Create planners and activate/deactivate accounts.</p>
      </div>

      <form onSubmit={createPlanner} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_1fr_auto]">
        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          placeholder="planner@hizbview.et"
          type="email"
          value={newPlanner.email}
          onChange={(event) => setNewPlanner((prev) => ({ ...prev, email: event.target.value }))}
        />
        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          placeholder="temporary password"
          type="password"
          value={newPlanner.password}
          onChange={(event) => setNewPlanner((prev) => ({ ...prev, password: event.target.value }))}
        />
        <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800" type="submit">
          Create planner
        </button>
      </form>

      <div className="grid gap-3">
        {planners.map((planner) => (
          <article key={planner.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="m-0 text-base font-semibold text-slate-900">{planner.email}</p>
                <p className="mt-1 text-xs text-slate-500">Created: {planner.createdAt} • Verified: {planner.verified ? "Yes" : "No"}</p>
              </div>
              <button
                className={[
                  "rounded-lg px-3 py-1.5 text-xs font-semibold",
                  planner.active ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700",
                ].join(" ")}
                type="button"
                onClick={() => togglePlanner(planner.id)}
              >
                {planner.active ? "Deactivate" : "Activate"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
