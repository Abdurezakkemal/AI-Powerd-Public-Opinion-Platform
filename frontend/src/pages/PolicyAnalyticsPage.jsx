import { ArrowLeft, Download, FilterX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { analyticsApi } from "../api/analytics";
import { policyApi } from "../api/policies";
import { EmptyState } from "../components/EmptyState";
import { ErrorAlert } from "../components/ErrorAlert";
import { LoadingState } from "../components/LoadingState";
import { MetricCard } from "../components/MetricCard";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { formatDate, formatNumber, formatRating, getErrorMessage } from "../lib/format";

const SENTIMENT_COLORS = {
  positive: "#059669",
  negative: "#e11d48",
  neutral: "#64748b",
};

const PAGE_SIZE = 10;

export function PolicyAnalyticsPage() {
  const { id } = useParams();
  const [policy, setPolicy] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentTotal, setCommentTotal] = useState(0);
  const [commentPage, setCommentPage] = useState(1);
  const [filters, setFilters] = useState({ startDate: "", endDate: "", sentiment: "" });
  const [selectedKeyword, setSelectedKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadOverview() {
      setLoading(true);
      setError("");
      try {
        const params = {
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
        };
        const [policyResult, analyticsResult] = await Promise.all([
          policyApi.get(id),
          analyticsApi.summary(id, params),
        ]);
        if (!active) return;
        setPolicy(policyResult);
        setAnalytics(analyticsResult);
      } catch (err) {
        if (active) setError(getErrorMessage(err, "Failed to load analytics"));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadOverview();
    return () => {
      active = false;
    };
  }, [id, filters.startDate, filters.endDate]);

  useEffect(() => {
    let active = true;

    async function loadComments() {
      setCommentsLoading(true);
      setError("");
      try {
        const result = await analyticsApi.comments(id, {
          page: commentPage,
          limit: PAGE_SIZE,
          sentiment: filters.sentiment || undefined,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
        });
        if (!active) return;
        setComments(result.comments || []);
        setCommentTotal(result.total || 0);
      } catch (err) {
        if (active) setError(getErrorMessage(err, "Failed to load comments"));
      } finally {
        if (active) setCommentsLoading(false);
      }
    }

    loadComments();
    return () => {
      active = false;
    };
  }, [id, commentPage, filters.sentiment, filters.startDate, filters.endDate]);

  const ratingData = useMemo(
    () =>
      [1, 2, 3, 4, 5].map((rating) => ({
        rating: `${rating} star`,
        votes: analytics?.ratingDistribution?.[rating] || 0,
      })),
    [analytics],
  );

  const sentimentData = useMemo(
    () =>
      ["positive", "negative", "neutral"].map((name) => ({
        name,
        value: analytics?.sentimentCounts?.[name] || 0,
      })),
    [analytics],
  );

  const voteSplitData = useMemo(
    () => [
      { channel: "App", votes: analytics?.appVotes || 0 },
      { channel: "SMS", votes: analytics?.smsVotes || 0 },
    ],
    [analytics],
  );

  const keywordData = analytics?.topKeywords || [];
  const visibleComments = selectedKeyword
    ? comments.filter((comment) => comment.keywords?.includes(selectedKeyword))
    : comments;
  const totalCommentPages = Math.max(1, Math.ceil(commentTotal / PAGE_SIZE));

  const updateFilter = (name, value) => {
    setCommentPage(1);
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const downloadCsv = async () => {
    setExporting(true);
    setError("");
    try {
      const blob = await analyticsApi.exportCsv(id, {
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `policy-${id}-analytics.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to export CSV"));
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <LoadingState label="Loading analytics" />;

  return (
    <div>
      <PageHeader
        title={policy?.title || analytics?.title || "Policy analytics"}
        description={policy ? `${policy.policyCode} • ${policy.targetRegions?.join(", ")} • ${formatDate(policy.startDate)} to ${formatDate(policy.endDate)}` : ""}
        actions={
          <>
            <Link className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50" to="/policies">
              <ArrowLeft className="h-4 w-4" />
              Policies
            </Link>
            <button
              type="button"
              disabled={exporting}
              onClick={downloadCsv}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {exporting ? "Exporting..." : "Export CSV"}
            </button>
          </>
        }
      />

      <div className="space-y-3">
        <ErrorAlert message={error} />
        {policy ? <StatusBadge status={policy.status} /> : null}
      </div>

      <section className="mt-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-600"
            type="date"
            value={filters.startDate}
            onChange={(event) => updateFilter("startDate", event.target.value)}
            aria-label="Start date"
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-600"
            type="date"
            value={filters.endDate}
            onChange={(event) => updateFilter("endDate", event.target.value)}
            aria-label="End date"
          />
          <select
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-600"
            value={filters.sentiment}
            onChange={(event) => updateFilter("sentiment", event.target.value)}
          >
            <option value="">All sentiments</option>
            <option value="positive">Positive</option>
            <option value="negative">Negative</option>
            <option value="neutral">Neutral</option>
          </select>
        </div>
      </section>

      {analytics ? (
        <>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <MetricCard label="Average rating" value={formatRating(analytics.averageRating)} helper="Across selected date range" />
            <MetricCard label="Total votes" value={formatNumber(analytics.totalVotes)} helper={`${formatNumber(analytics.appVotes)} app, ${formatNumber(analytics.smsVotes)} SMS`} />
            <MetricCard label="Comments analyzed" value={formatNumber(sentimentData.reduce((sum, item) => sum + item.value, 0))} helper="Sentiment-tagged comments" />
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            <ChartCard title="Rating distribution">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={ratingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rating" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="votes" fill="#0f766e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Sentiment">
              {sentimentData.some((item) => item.value > 0) ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={sentimentData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={96} paddingAngle={2}>
                      {sentimentData.map((entry) => (
                        <Cell key={entry.name} fill={SENTIMENT_COLORS[entry.name]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState title="No sentiment yet" description="Comments will appear here after AI processing completes." />
              )}
            </ChartCard>

            <ChartCard title="App vs SMS votes">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={voteSplitData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="channel" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="votes" fill="#14b8a6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Keywords">
              {keywordData.length ? (
                <div className="space-y-2">
                  {keywordData.map((item) => (
                    <button
                      key={item.keyword}
                      type="button"
                      onClick={() => setSelectedKeyword((current) => (current === item.keyword ? "" : item.keyword))}
                      className={[
                        "grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm",
                        selectedKeyword === item.keyword
                          ? "border-teal-500 bg-teal-50 text-teal-900"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <span className="truncate font-semibold">{item.keyword}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">{item.count}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState title="No keywords yet" description="Keyword extraction results will appear after comments are processed." />
              )}
            </ChartCard>
          </div>
        </>
      ) : (
        <div className="mt-5">
          <EmptyState title="No analytics available" description="Analytics are available for active, paused, and closed policies." />
        </div>
      )}

      <section className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-950">Comments</h3>
            <p className="text-sm text-slate-500">
              {selectedKeyword ? `Filtered by keyword "${selectedKeyword}"` : "Raw citizen comments with sentiment and keywords."}
            </p>
          </div>
          {selectedKeyword ? (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
              onClick={() => setSelectedKeyword("")}
            >
              <FilterX className="h-4 w-4" />
              Clear keyword
            </button>
          ) : null}
        </div>

        {commentsLoading ? (
          <LoadingState label="Loading comments" />
        ) : visibleComments.length ? (
          <div className="space-y-3">
            {visibleComments.map((comment) => (
              <article key={comment.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={[
                      "rounded-full px-2.5 py-1 text-xs font-bold capitalize",
                      comment.sentiment === "positive"
                        ? "bg-emerald-100 text-emerald-700"
                        : comment.sentiment === "negative"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-slate-100 text-slate-700",
                    ].join(" ")}
                  >
                    {comment.sentiment || "pending"}
                  </span>
                  <span className="text-xs text-slate-500">{formatDate(comment.createdAt)}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-700">{comment.text}</p>
                {comment.keywords?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {comment.keywords.map((keyword) => (
                      <button
                        key={keyword}
                        type="button"
                        onClick={() => setSelectedKeyword(keyword)}
                        className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-teal-50 hover:text-teal-700"
                      >
                        {keyword}
                      </button>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="No comments found" description="Try changing the sentiment, date, or keyword filters." />
        )}

        <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <span>Page {commentPage} of {totalCommentPages}</span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={commentPage <= 1}
              onClick={() => setCommentPage((current) => Math.max(1, current - 1))}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={commentPage >= totalCommentPages}
              onClick={() => setCommentPage((current) => current + 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-lg font-bold text-slate-950">{title}</h3>
      {children}
    </section>
  );
}
