import { plannerComments } from "../../constants/mock/planner";

export default function PlannerFeedback() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="m-0 text-2xl font-bold text-slate-900">Feedback stream</h2>
        <p className="mt-1 text-sm text-slate-600">Recent citizen comments on your policies with sentiment tags.</p>
      </div>

      <div className="grid gap-3">
        {plannerComments.map((comment) => (
          <article key={comment.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="m-0 text-sm font-semibold text-slate-900">{comment.policyTitle}</p>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{comment.createdAt}</span>
            </div>

            <p className="mt-2 text-sm text-slate-700">{comment.text}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-blue-700">Sentiment: {comment.sentiment}</span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700">Confidence: {Math.round(comment.confidence * 100)}%</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
