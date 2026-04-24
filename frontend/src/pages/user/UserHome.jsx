import { Link } from "react-router-dom";
import overviewImage from "../../assets/policie.webp";

export default function UserHome() {
  const stats = [
    { label: "Active policies", value: "12" },
    { label: "My submissions", value: "8" },
    { label: "Votes this month", value: "24" },
  ];

  const trendBars = [42, 58, 35, 72, 64, 81, 56];
  const activityItems = [
    { label: "Policies reviewed", value: "18", tone: "bg-emerald-100 text-emerald-800" },
    { label: "Average rating given", value: "4.4", tone: "bg-amber-100 text-amber-800" },
    { label: "Positive sentiment", value: "76%", tone: "bg-sky-100 text-sky-800" },
    { label: "Regions following", value: "4", tone: "bg-violet-100 text-violet-800" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 to-green-800 p-5 text-white shadow-sm">
          <p className="mb-2 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90">
            Welcome back
          </p>
          <h2 className="m-0 text-2xl font-bold">Your citizen overview</h2>
          <p className="mt-2 max-w-xl text-sm text-emerald-50/90">
            Review current policy discussions, track your votes, and follow the latest public feedback from one dashboard.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {stats.map((stat) => (
              <article key={stat.label} className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                <p className="m-0 text-xs font-medium text-emerald-50/80">{stat.label}</p>
                <p className="m-0 mt-2 text-2xl font-bold text-white">{stat.value}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <img src={overviewImage} alt="Policies overview illustration" className="h-full w-full object-cover" />
        </section>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {activityItems.map((item) => (
          <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${item.tone}`}>
              {item.label}
            </span>
            <p className="m-0 mt-4 text-3xl font-bold text-slate-900">{item.value}</p>
            <p className="mt-2 text-sm text-slate-500">Current performance indicator</p>
          </article>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="m-0 text-lg font-semibold text-slate-900">Activity trend</h3>
              <p className="mt-1 text-sm text-slate-500">Your engagement over the last 7 days</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">Live</span>
          </div>

          <div className="mt-6 flex h-44 items-end gap-3 rounded-2xl bg-slate-50 p-4">
            {trendBars.map((height, index) => (
              <div key={height + index} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-2xl bg-gradient-to-t from-emerald-600 to-emerald-300 transition hover:from-emerald-700 hover:to-emerald-400"
                  style={{ height: `${height}%` }}
                />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="m-0 text-lg font-semibold text-slate-900">Overview cards</h3>
              <p className="mt-1 text-sm text-slate-500">A snapshot of your recent participation</p>
            </div>
            <Link to="/user/history" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
              View history
            </Link>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <article className="rounded-2xl bg-slate-50 p-4">
              <p className="m-0 text-sm font-medium text-slate-500">Most engaged region</p>
              <p className="m-0 mt-2 text-2xl font-bold text-slate-900">Addis Ababa</p>
            </article>
            <article className="rounded-2xl bg-slate-50 p-4">
              <p className="m-0 text-sm font-medium text-slate-500">Top policy voted</p>
              <p className="m-0 mt-2 text-2xl font-bold text-slate-900">Clean Water</p>
            </article>
            <article className="rounded-2xl bg-slate-50 p-4">
              <p className="m-0 text-sm font-medium text-slate-500">Average rating</p>
              <p className="m-0 mt-2 text-2xl font-bold text-slate-900">4.4 / 5</p>
            </article>
            <article className="rounded-2xl bg-slate-50 p-4">
              <p className="m-0 text-sm font-medium text-slate-500">Feedback streak</p>
              <p className="m-0 mt-2 text-2xl font-bold text-slate-900">4 weeks</p>
            </article>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
        <h3 className="m-0 text-lg font-semibold text-emerald-900">Ready to submit feedback?</h3>
        <p className="mb-4 mt-2 text-sm text-emerald-800">
          Open the policies page and select a policy to rate and comment.
        </p>
        <Link
          to="/user/policies"
          className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Browse policies
        </Link>
      </div>
    </div>
  );
}
