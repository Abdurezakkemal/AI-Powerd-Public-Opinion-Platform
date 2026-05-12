import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useEffect, useState } from "react";
import { analyticsApi } from "../api/analytics";
import { ETHIOPIAN_REGIONS, POLICY_TOPICS } from "../constants/regions";
import { EmptyState } from "../components/EmptyState";
import { ErrorAlert } from "../components/ErrorAlert";
import { LoadingState } from "../components/LoadingState";
import { MetricCard } from "../components/MetricCard";
import { PageHeader } from "../components/PageHeader";
import { formatNumber, getErrorMessage } from "../lib/format";

export function CrossAnalyticsPage() {
  const [filters, setFilters] = useState({ topics: "", region: "", startDate: "", endDate: "" });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAnalytics() {
    setLoading(true);
    setError("");
    try {
      const result = await analyticsApi.cross({
        topics: filters.topics || undefined,
        region: filters.region || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate ? `${filters.endDate}T23:59:59.000Z` : undefined,
      });
      setData(result);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load cross-policy analytics"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sentimentData = ["positive", "negative", "neutral"].map((name) => ({
    name,
    count: data?.sentimentCounts?.[name] || 0,
  }));

  return (
    <div>
      <PageHeader title="Cross Analytics" description="Compare shared engagement, sentiment, and keywords across policies." />
      <ErrorAlert message={error} />

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-5">
          <input
            list="topic-options"
            value={filters.topics}
            onChange={(event) => setFilters((current) => ({ ...current, topics: event.target.value }))}
            placeholder="Topic(s), comma separated"
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-600"
          />
          <datalist id="topic-options">
            {POLICY_TOPICS.map((topic) => <option key={topic} value={topic} />)}
          </datalist>
          <select
            value={filters.region}
            onChange={(event) => setFilters((current) => ({ ...current, region: event.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-600"
          >
            <option value="">All regions</option>
            {ETHIOPIAN_REGIONS.map((region) => <option key={region} value={region}>{region}</option>)}
          </select>
          <input type="date" value={filters.startDate} onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-600" />
          <input type="date" value={filters.endDate} onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-600" />
          <button type="button" onClick={loadAnalytics} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white hover:bg-teal-800">Apply</button>
        </div>
      </section>

      {loading ? <LoadingState label="Loading cross analytics" /> : data ? (
        <div className="mt-5 space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard label="Total votes" value={formatNumber(data.totalVotes)} />
            <MetricCard label="Total comments" value={formatNumber(data.totalComments)} />
            <MetricCard label="Keywords" value={formatNumber(data.topKeywords?.length)} />
          </div>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-slate-950">Sentiment</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={sentimentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0f766e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-slate-950">Top Keywords</h3>
            {data.topKeywords?.length ? (
              <div className="flex flex-wrap gap-2">
                {data.topKeywords.map((item) => (
                  <span key={item.keyword} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{item.keyword} ({item.count})</span>
                ))}
              </div>
            ) : <EmptyState title="No keywords found" description="Try a broader filter." />}
          </section>
        </div>
      ) : <EmptyState title="No cross-policy data" description="Try a broader filter." />}
    </div>
  );
}
