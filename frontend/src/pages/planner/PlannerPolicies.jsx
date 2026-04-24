import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { plannerPolicies as policiesSeed } from "../../constants/mock/planner";

export default function PlannerPolicies() {
  const [policies, setPolicies] = useState(policiesSeed);
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [formError, setFormError] = useState("");
  const [newPoll, setNewPoll] = useState({
    title: "",
    policyCode: "",
    description: "",
    targetRegions: "",
    startDate: "",
    endDate: "",
    status: "draft",
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return policies.filter((p) => {
      const statusMatch = statusFilter === "all" || p.status === statusFilter;
      const textMatch = !q || `${p.title} ${p.policyCode} ${p.description}`.toLowerCase().includes(q);
      return statusMatch && textMatch;
    });
  }, [policies, query, statusFilter]);

  const createPoll = (event) => {
    event.preventDefault();
    setFormError("");

    const regions = newPoll.targetRegions
      .split(",")
      .map((region) => region.trim())
      .filter(Boolean);

    if (!newPoll.title || !newPoll.description || !newPoll.startDate || !newPoll.endDate || regions.length === 0) {
      setFormError("Please fill in title, description, target regions, start date, and end date.");
      return;
    }

    if (newPoll.startDate >= newPoll.endDate) {
      setFormError("Start date must be before end date.");
      return;
    }

    const generatedCode = newPoll.policyCode || `POLL${policies.length + 101}`;
    const generatedId = newPoll.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

    setPolicies((prev) => [
      {
        id: generatedId || `policy-${prev.length + 1}`,
        title: newPoll.title,
        policyCode: generatedCode,
        status: newPoll.status,
        targetRegions: regions,
        startDate: newPoll.startDate,
        endDate: newPoll.endDate,
        averageRating: 0,
        totalVotes: 0,
        description: newPoll.description,
      },
      ...prev,
    ]);

    setNewPoll({
      title: "",
      policyCode: "",
      description: "",
      targetRegions: "",
      startDate: "",
      endDate: "",
      status: "draft",
    });
    setShowCreatePoll(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="m-0 text-2xl font-bold text-slate-900">Policy management</h2>
          <p className="mt-1 text-sm text-slate-600">Create polls, update active ones, and close campaigns.</p>
        </div>
        <button
          onClick={() => setShowCreatePoll(true)}
          type="button"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Create poll
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[
          ["all", "All"],
          ["draft", "Draft"],
          ["active", "Active"],
          ["closed", "Closed"],
        ].map(([value, label]) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            type="button"
            className={[
              "rounded-full px-3 py-1.5 text-xs font-semibold",
              statusFilter === value ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700",
            ].join(" ")}
          >
            {label}
          </button>
        ))}

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="ml-auto rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          placeholder="Search title or code"
        />
      </div>

      <div className="grid gap-3">
        {filtered.map((policy) => (
          <article key={policy.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="m-0 text-xs font-semibold uppercase tracking-wide text-emerald-700">{policy.policyCode}</p>
                <h3 className="m-0 mt-1 text-lg font-semibold text-slate-900">{policy.title}</h3>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{policy.status}</span>
            </div>

            <p className="mt-2 text-sm text-slate-600">{policy.description}</p>
            <p className="mt-2 text-xs text-slate-500">Regions: {policy.targetRegions.join(", ")} • {policy.startDate} to {policy.endDate}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              <Link to={`/planner/policies/${policy.id}`} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800">Open editor</Link>
              <button type="button" className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Toggle status</button>
            </div>
          </article>
        ))}
      </div>

      {showCreatePoll ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          onClick={() => setShowCreatePoll(false)}
        >
          <div
            className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="m-0 text-xl font-bold text-slate-900">Create poll</h3>
                <p className="mt-1 text-sm text-slate-600">Fill all required information to create a new poll.</p>
              </div>
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => setShowCreatePoll(false)}
              >
                Close
              </button>
            </div>

            <form onSubmit={createPoll} className="grid gap-3 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Poll title *</span>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  value={newPoll.title}
                  onChange={(event) => setNewPoll((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="e.g. Community Water Access Upgrade"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Policy code (optional)</span>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  value={newPoll.policyCode}
                  onChange={(event) => setNewPoll((prev) => ({ ...prev, policyCode: event.target.value.toUpperCase() }))}
                  placeholder="AUTO GENERATED"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Status</span>
                <select
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  value={newPoll.status}
                  onChange={(event) => setNewPoll((prev) => ({ ...prev, status: event.target.value }))}
                >
                  <option value="draft">draft</option>
                  <option value="active">active</option>
                </select>
              </label>

              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Description *</span>
                <textarea
                  rows="4"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  value={newPoll.description}
                  onChange={(event) => setNewPoll((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Describe the poll objective, implementation plan, and expected impact."
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Target regions * (comma separated)</span>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  value={newPoll.targetRegions}
                  onChange={(event) => setNewPoll((prev) => ({ ...prev, targetRegions: event.target.value }))}
                  placeholder="Addis Ababa, Oromia"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Start date *</span>
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  value={newPoll.startDate}
                  onChange={(event) => setNewPoll((prev) => ({ ...prev, startDate: event.target.value }))}
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">End date *</span>
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  value={newPoll.endDate}
                  onChange={(event) => setNewPoll((prev) => ({ ...prev, endDate: event.target.value }))}
                />
              </label>

              {formError ? <p className="m-0 text-sm font-semibold text-rose-600 md:col-span-2">{formError}</p> : null}

              <div className="md:col-span-2 flex flex-wrap gap-2">
                <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                  Save poll
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  onClick={() => setShowCreatePoll(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
