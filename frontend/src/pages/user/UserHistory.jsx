import { Link } from "react-router-dom";
import { mockHistory } from "../../constants/mock/policies";

export default function UserHistory() {
  const formatVoteTime = (votedAt) => {
    const date = new Date(votedAt);
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="m-0 text-2xl font-bold text-slate-900">My voted polls</h2>
        <p className="mt-2 text-slate-600">A timeline of the polls you voted on, with vote time and policy details.</p>
      </div>

      <div className="grid gap-4">
        {mockHistory.map((item) => (
          <article key={item.id} className="rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="m-0 text-sm font-semibold uppercase tracking-wide text-emerald-700">
                  {item.policyCode}
                </p>
                <h3 className="m-0 mt-1 text-base font-semibold text-slate-900">{item.policyTitle}</h3>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                Voted {formatVoteTime(item.votedAt)}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-800">Rating: {item.rating}/5</span>
              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-blue-800">Sentiment: {item.sentiment}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">Vote time: {formatVoteTime(item.votedAt)}</span>
            </div>

            <div className="mt-4 rounded-lg bg-slate-50 p-3">
              <p className="m-0 text-sm text-slate-600">
                You voted on <span className="font-semibold text-slate-900">{item.policyTitle}</span>. Open the policy details to review the full proposal and your rating context.
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to={`/user/policies/${item.policyId}`}
                className="inline-flex rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                View details
              </Link>
              <Link
                to={`/user/policies/${item.policyId}`}
                className="inline-flex rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                See policy
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
