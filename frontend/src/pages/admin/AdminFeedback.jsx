import { useState } from "react";
import { pendingFeedback as feedbackSeed } from "../../constants/mock/admin";

export default function AdminFeedback() {
  const [feedback, setFeedback] = useState(feedbackSeed);

  const markProcessed = (id) => {
    setFeedback((previous) =>
      previous.map((item) =>
        item.id === id ? { ...item, status: "processed" } : item,
      ),
    );
  };

  const retrySingle = (id) => {
    setFeedback((previous) =>
      previous.map((item) =>
        item.id === id ? { ...item, status: "queued for retry" } : item,
      ),
    );
  };

  const retryAll = () => {
    setFeedback((previous) =>
      previous.map((item) => ({ ...item, status: "queued for retry" })),
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="m-0 text-2xl font-bold text-slate-900">Feedback moderation</h2>
          <p className="mt-1 text-sm text-slate-600">Process pending comments and retry AI analysis where needed.</p>
        </div>
        <button onClick={retryAll} type="button" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
          Retry all pending
        </button>
      </div>

      <div className="grid gap-3">
        {feedback.map((item) => (
          <article key={item.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="m-0 text-sm font-semibold text-emerald-700">{item.policyTitle}</p>
                <p className="mt-1 text-xs text-slate-500">{item.userEmail} • {item.createdAt}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{item.status}</span>
            </div>

            <p className="mt-3 text-sm text-slate-700">{item.comment}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => markProcessed(item.id)}
                type="button"
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                Mark processed
              </button>
              <button
                onClick={() => retrySingle(item.id)}
                type="button"
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Retry analysis
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
