import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { mockPolicies } from "../../constants/mock/policies";

const MY_REGION = "Addis Ababa";

export default function UserPolicies() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredPolicies = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    let policies = mockPolicies;

    if (activeFilter === "popular") {
      policies = policies.filter((policy) => policy.averageRating >= 4.2 || policy.totalVotes >= 180);
    }

    if (activeFilter === "my-region") {
      policies = policies.filter((policy) => policy.region === MY_REGION);
    }

    if (!query) {
      return policies;
    }

    return policies.filter((policy) => {
      const searchableText = [
        policy.title,
        policy.policyCode,
        policy.description,
        policy.region,
        policy.status,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [searchTerm, activeFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={[
            "rounded-full px-3 py-1.5 text-xs font-semibold transition",
            activeFilter === "all"
              ? "bg-emerald-600 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800",
          ].join(" ")}
          onClick={() => setActiveFilter("all")}
        >
          All
        </button>
        <button
          type="button"
          className={[
            "rounded-full px-3 py-1.5 text-xs font-semibold transition",
            activeFilter === "popular"
              ? "bg-emerald-600 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800",
          ].join(" ")}
          onClick={() => setActiveFilter("popular")}
        >
          Popular
        </button>
        <button
          type="button"
          className={[
            "rounded-full px-3 py-1.5 text-xs font-semibold transition",
            activeFilter === "my-region"
              ? "bg-emerald-600 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800",
          ].join(" ")}
          onClick={() => setActiveFilter("my-region")}
        >
          My region
        </button>

        <div className="ml-auto rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
          <label className="flex items-center gap-2 text-slate-500" htmlFor="policy-search">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              id="policy-search"
              className="w-[260px] border-none bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none sm:w-[340px]"
              placeholder="Search policies"
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredPolicies.map((policy) => (
          <article key={policy.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="m-0 text-sm font-semibold uppercase tracking-wide text-emerald-700">
                  {policy.policyCode}
                </p>
                <h3 className="m-0 mt-1 text-lg font-semibold text-slate-900">{policy.title}</h3>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                {policy.status}
              </span>
            </div>

            <p className="mb-3 mt-2 text-sm text-slate-600">{policy.description}</p>

            <div className="flex flex-wrap gap-3 text-xs font-medium text-slate-600">
              <span className="rounded bg-slate-100 px-2 py-1">Region: {policy.region}</span>
              <span className="rounded bg-slate-100 px-2 py-1">Votes: {policy.totalVotes}</span>
              <span className="rounded bg-slate-100 px-2 py-1">Avg rating: {policy.averageRating}</span>
              <span className="rounded bg-slate-100 px-2 py-1">Ends: {policy.endDate}</span>
            </div>

            <Link
              to={`/user/policies/${policy.id}`}
              className="mt-4 inline-flex rounded-lg border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              View details
            </Link>
          </article>
        ))}

        {filteredPolicies.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
            <p className="m-0 font-semibold text-slate-800">No matching policies found.</p>
            <p className="mt-2 text-sm text-slate-500">Try another keyword like region name or policy code.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
