import { analyticsSummary } from "../../constants/mock/admin";

export default function AdminAnalytics() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="m-0 text-2xl font-bold text-slate-900">Analytics center</h2>
        <p className="mt-1 text-sm text-slate-600">Review policy-level performance, sentiment distribution, and engagement.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {analyticsSummary.map((item) => (
          <article key={item.policy} className="rounded-xl border border-slate-200 p-4">
            <h3 className="m-0 text-base font-semibold text-slate-900">{item.policy}</h3>
            <div className="mt-3 grid gap-2 text-sm text-slate-700">
              <p className="m-0">Votes: <span className="font-semibold">{item.votes}</span></p>
              <p className="m-0">Average rating: <span className="font-semibold">{item.averageRating}</span></p>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <div>
                <div className="mb-1 flex justify-between"><span>Positive</span><span>{item.positive}%</span></div>
                <div className="h-2 rounded bg-slate-100"><div className="h-2 rounded bg-emerald-500" style={{ width: `${item.positive}%` }} /></div>
              </div>
              <div>
                <div className="mb-1 flex justify-between"><span>Neutral</span><span>{item.neutral}%</span></div>
                <div className="h-2 rounded bg-slate-100"><div className="h-2 rounded bg-amber-500" style={{ width: `${item.neutral}%` }} /></div>
              </div>
              <div>
                <div className="mb-1 flex justify-between"><span>Negative</span><span>{item.negative}%</span></div>
                <div className="h-2 rounded bg-slate-100"><div className="h-2 rounded bg-rose-500" style={{ width: `${item.negative}%` }} /></div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
