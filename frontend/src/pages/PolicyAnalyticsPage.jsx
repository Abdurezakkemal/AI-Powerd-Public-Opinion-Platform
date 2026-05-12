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
import { plannerApi } from "../api/planners";
import { EmptyState } from "../components/EmptyState";
import { ErrorAlert } from "../components/ErrorAlert";
import { LoadingState } from "../components/LoadingState";
import { MetricCard } from "../components/MetricCard";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { LANGUAGES } from "../constants/regions";
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
  const [timeseries, setTimeseries] = useState(null);
  const [heatmap, setHeatmap] = useState(null);
  const [demographics, setDemographics] = useState(null);
  const [correlation, setCorrelation] = useState(null);
  const [dimension, setDimension] = useState("region");
  const [associates, setAssociates] = useState([]);
  const [plannerMatches, setPlannerMatches] = useState([]);
  const [associateForm, setAssociateForm] = useState({
    language: "en",
    plannerEmail: "",
    permissions: ["view_analytics"],
  });

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

    async function loadExtendedAnalytics() {
      try {
        const params = {
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
        };
        const [seriesResult, heatmapResult, demographicResult, associatesResult] = await Promise.allSettled([
          analyticsApi.timeseries(id, { ...params, bucket: "week" }),
          analyticsApi.heatmap({ ...params, policyId: id, interval: "week", byRegion: true }),
          analyticsApi.demographics(id, { ...params, dimension }),
          plannerApi.listAssociates(id),
        ]);
        if (!active) return;
        setTimeseries(seriesResult.status === "fulfilled" ? seriesResult.value : null);
        setHeatmap(heatmapResult.status === "fulfilled" ? heatmapResult.value : null);
        setDemographics(demographicResult.status === "fulfilled" ? demographicResult.value : null);
        setAssociates(associatesResult.status === "fulfilled" && Array.isArray(associatesResult.value) ? associatesResult.value : []);
      } catch {
        if (active) {
          setTimeseries(null);
          setHeatmap(null);
          setDemographics(null);
        }
      }
    }

    loadExtendedAnalytics();
    return () => {
      active = false;
    };
  }, [id, filters.startDate, filters.endDate, dimension]);

  useEffect(() => {
    if (analytics?.pollType !== "multipleChoice") {
      setCorrelation(null);
      return;
    }
    let active = true;
    analyticsApi.correlation(id, { minSupport: 1 })
      .then((result) => {
        if (active) setCorrelation(result);
      })
      .catch(() => {
        if (active) setCorrelation(null);
      });
    return () => {
      active = false;
    };
  }, [analytics?.pollType, id]);

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

  const ratingData = useMemo(() => {
    const distribution = analytics?.distribution || analytics?.ratingDistribution || {};
    return [1, 2, 3, 4, 5].map((rating) => ({
      rating: `${rating} star`,
      votes: distribution[rating] || distribution[String(rating)] || 0,
    }));
  }, [analytics]);

  const sentimentData = useMemo(
    () =>
      ["positive", "negative", "neutral"].map((name) => ({
        name,
        value: analytics?.sentimentCounts?.[name] || 0,
      })),
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

  const metricValue = analytics?.averageRating ?? analytics?.average ?? analytics?.approvePercentage ?? analytics?.yesPercentage ?? 0;
  const metricLabel = ["rating", "likert"].includes(analytics?.pollType) ? "Average rating" : analytics?.pollType === "approval" ? "Approval %" : analytics?.pollType === "binary" ? "Yes %" : "Primary metric";

  const optionResultData = analytics?.results || analytics?.firstChoiceResults || [];
  const timeseriesData = timeseries?.data || [];
  const heatmapData = heatmap?.data || [];
  const demographicData = demographics?.data || [];

  const refreshAssociates = async () => {
    try {
      const result = await plannerApi.listAssociates(id);
      setAssociates(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load associates"));
    }
  };

  const searchAssociates = async () => {
    try {
      const result = await plannerApi.search(associateForm.language);
      setPlannerMatches(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to search planners"));
    }
  };

  const addAssociate = async () => {
    if (!associateForm.plannerEmail) {
      setError("Choose a planner before adding an associate.");
      return;
    }
    try {
      await plannerApi.addAssociate(id, {
        plannerEmail: associateForm.plannerEmail,
        permissions: associateForm.permissions,
      });
      setAssociateForm((current) => ({ ...current, plannerEmail: "" }));
      await refreshAssociates();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to add associate"));
    }
  };

  const toggleAssociatePermission = async (associate, permission) => {
    const next = associate.permissions?.includes(permission)
      ? associate.permissions.filter((item) => item !== permission)
      : [...(associate.permissions || []), permission];
    try {
      await plannerApi.updateAssociate(id, associate._id, next);
      await refreshAssociates();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update associate"));
    }
  };

  const revokeAssociate = async (associate) => {
    if (!window.confirm(`Revoke ${associate.plannerId?.email || "this associate"}?`)) return;
    try {
      await plannerApi.revokeAssociate(id, associate._id);
      await refreshAssociates();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to revoke associate"));
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
            <MetricCard label={metricLabel} value={["rating", "likert"].includes(analytics.pollType) ? formatRating(metricValue) : String(metricValue)} helper={analytics.pollType} />
            <MetricCard label="Total votes" value={formatNumber(analytics.totalVotes)} helper="Across selected filters" />
            <MetricCard label="Comments analyzed" value={formatNumber(sentimentData.reduce((sum, item) => sum + item.value, 0))} helper="Sentiment-tagged comments" />
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            {["rating", "likert"].includes(analytics.pollType) ? (
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
            ) : null}

            {optionResultData.length ? (
              <ChartCard title={analytics.pollType === "rankedChoice" ? "First choice results" : "Option results"}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={optionResultData.map((item) => ({ name: item.text || item.id, votes: item.count ?? item.firstChoiceCount ?? 0 }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="votes" fill="#0f766e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            ) : null}

            {analytics.pollType === "binary" ? (
              <ChartCard title="Binary result">
                <div className="grid gap-4 sm:grid-cols-2">
                  <MetricCard label="Yes" value={formatNumber(analytics.yesCount)} helper={`${analytics.yesPercentage}%`} />
                  <MetricCard label="No" value={formatNumber(analytics.noCount)} helper={`${analytics.noPercentage}%`} />
                </div>
              </ChartCard>
            ) : null}

            {analytics.pollType === "approval" ? (
              <ChartCard title="Approval result">
                <div className="grid gap-4 sm:grid-cols-2">
                  <MetricCard label="Approve" value={formatNumber(analytics.approveCount)} helper={`${analytics.approvePercentage}%`} />
                  <MetricCard label="Reject" value={formatNumber(analytics.rejectCount)} helper={`${analytics.rejectPercentage}%`} />
                  <MetricCard label="Abstain" value={formatNumber(analytics.abstainCount)} helper={`${analytics.abstainPercentage}%`} />
                  <MetricCard label="Net approval" value={formatNumber(analytics.netApproval)} />
                </div>
              </ChartCard>
            ) : null}

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

            <ChartCard title="Timeseries">
              {timeseriesData.length ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={timeseriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="bucket" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="totalVotes" fill="#14b8a6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState title="No timeseries data" description="Votes over time will appear here." />
              )}
            </ChartCard>

            <ChartCard title="Heatmap by region">
              {heatmapData.length ? (
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Period</th>
                        <th className="px-3 py-2">Region</th>
                        <th className="px-3 py-2">Votes</th>
                        <th className="px-3 py-2">Sentiment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {heatmapData.map((item, index) => (
                        <tr key={`${item.period}-${item.region}-${index}`}>
                          <td className="px-3 py-2">{item.period}</td>
                          <td className="px-3 py-2">{item.region || "All"}</td>
                          <td className="px-3 py-2">{formatNumber(item.totalVotes)}</td>
                          <td className="px-3 py-2">{item.averageSentiment}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState title="No heatmap data" description="Regional vote buckets will appear here." />
              )}
            </ChartCard>

            <ChartCard title="Demographic breakdown">
              <div className="mb-3">
                <select value={dimension} onChange={(event) => setDimension(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600">
                  <option value="region">Region</option>
                  <option value="ageRange">Age range</option>
                  <option value="gender">Gender</option>
                  <option value="occupation">Occupation</option>
                  <option value="education">Education</option>
                </select>
              </div>
              {demographicData.length ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={demographicData.map((item) => ({ name: item[dimension], votes: item.totalVotes }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="votes" fill="#0f766e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              ) : <EmptyState title="No demographic data" description="Breakdowns appear after matching votes are available." />}
            </ChartCard>

            {correlation?.correlations?.length ? (
              <ChartCard title="Option correlation">
                <div className="space-y-2">
                  {correlation.correlations.map((item) => (
                    <div key={`${item.optionA}-${item.optionB}`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                      <span className="font-bold">{item.optionA}</span> with <span className="font-bold">{item.optionB}</span>: {item.coOccurrenceCount} ({item.percentage}%)
                    </div>
                  ))}
                </div>
              </ChartCard>
            ) : null}

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

      <section className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-950">Associates</h3>
            <p className="text-sm text-slate-500">Assign planners to help with analytics, exports, replies, and moderation.</p>
          </div>
          <button type="button" onClick={searchAssociates} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">Search planners</button>
        </div>

        <div className="grid gap-3 lg:grid-cols-[12rem_minmax(0,1fr)_auto]">
          <select value={associateForm.language} onChange={(event) => setAssociateForm((current) => ({ ...current, language: event.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600">
            {LANGUAGES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <select value={associateForm.plannerEmail} onChange={(event) => setAssociateForm((current) => ({ ...current, plannerEmail: event.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600">
            <option value="">Choose planner</option>
            {plannerMatches.map((planner) => <option key={planner._id} value={planner.email}>{planner.email}</option>)}
          </select>
          <button type="button" onClick={addAssociate} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white hover:bg-teal-800">Add associate</button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {["view_analytics", "moderate_comments", "reply_official", "export_data"].map((permission) => (
            <label key={permission} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 accent-teal-700"
                checked={associateForm.permissions.includes(permission)}
                onChange={(event) => setAssociateForm((current) => ({
                  ...current,
                  permissions: event.target.checked
                    ? [...current.permissions, permission]
                    : current.permissions.filter((item) => item !== permission),
                }))}
              />
              {permission}
            </label>
          ))}
        </div>

        {associates.length ? (
          <div className="mt-4 divide-y divide-slate-100">
            {associates.map((associate) => (
              <div key={associate._id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-bold text-slate-950">{associate.plannerId?.email || "Unknown planner"}</p>
                  <p className="text-xs text-slate-500">Assigned {formatDate(associate.assignedAt)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["view_analytics", "moderate_comments", "reply_official", "export_data"].map((permission) => (
                    <button
                      key={permission}
                      type="button"
                      onClick={() => toggleAssociatePermission(associate, permission)}
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${associate.permissions?.includes(permission) ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-500"}`}
                    >
                      {permission}
                    </button>
                  ))}
                  <button type="button" onClick={() => revokeAssociate(associate)} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50">Revoke</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No associates" description="Search by language and add a planner collaborator." />
        )}
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
