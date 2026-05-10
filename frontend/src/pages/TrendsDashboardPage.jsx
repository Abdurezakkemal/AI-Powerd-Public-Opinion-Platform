import { CalendarClock, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { adminApi } from "../api/admin";
import { ErrorAlert } from "../components/ErrorAlert";
import { LoadingState } from "../components/LoadingState";
import { PageHeader } from "../components/PageHeader";
import { MetricCard } from "../components/MetricCard";
import { getErrorMessage, toIsoFromDateInput, toDateInput } from "../lib/format";

export function TrendsDashboardPage() {
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dates, setDates] = useState({
    startDate: toDateInput(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)), // 30 days ago
    endDate: toDateInput(new Date()),
  });

  const loadTrends = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await adminApi.getTrends({
        startDate: dates.startDate ? toIsoFromDateInput(dates.startDate) : undefined,
        endDate: dates.endDate ? toIsoFromDateInput(dates.endDate, true) : undefined,
      });
      setTrends(result);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load trends"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrends();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDateChange = (field, value) => {
    setDates((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyFilter = () => {
    loadTrends();
  };

  const trendData = trends?.data || [];
  const totalVotes = trends?.totalVotes || 0;
  const totalNewUsers = trends?.newUsers || 0;
  const averageRating = trends?.averageRating || 0;

  if (loading) return <LoadingState label="Loading trends" />;

  return (
    <div>
      <PageHeader
        title="Trends & Analytics"
        description="View voting and engagement trends over time across all policies and regions."
      />

      <div className="space-y-5">
        <ErrorAlert message={error} />

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <CalendarClock className="h-5 w-5 text-slate-600" />
            <h3 className="font-bold text-slate-900">Date Range</h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Start Date</span>
              <input
                type="date"
                value={dates.startDate}
                onChange={(e) => handleDateChange("startDate", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">End Date</span>
              <input
                type="date"
                value={dates.endDate}
                onChange={(e) => handleDateChange("endDate", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              />
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleApplyFilter}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white hover:bg-teal-800"
            >
              <RefreshCw className="h-4 w-4" />
              Apply Filter
            </button>
          </div>
        </div>

        {trends && (
          <div className="space-y-5">
            {/* Summary Metrics */}
            <div className="grid gap-4 sm:grid-cols-4">
              <MetricCard label="Total Votes" value={totalVotes} />
              <MetricCard label="New Users" value={totalNewUsers} />
              <MetricCard label="Avg Rating" value={averageRating.toFixed(2)} />
              <MetricCard label="Interval" value={trends.interval || "day"} />
            </div>

            {trendData.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-white px-8 py-12 text-center">
                <p className="text-slate-600">No trends data found for the selected date range.</p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 font-bold text-slate-900">Votes Over Time</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="votes" stroke="#0d9488" strokeWidth={2} name="Votes" />
                      <Line type="monotone" dataKey="newUsers" stroke="#2563eb" strokeWidth={2} name="New Users" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 font-bold text-slate-900">Average Rating Over Time</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="avgRating" stroke="#0f766e" strokeWidth={2} name="Avg Rating" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {trends.sentimentTrend && trends.sentimentTrend.length > 0 && (
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 font-bold text-slate-900">Sentiment Distribution Over Time</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trends.sentimentTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="positive" stackId="sentiment" fill="#059669" name="Positive" />
                    <Bar dataKey="neutral" stackId="sentiment" fill="#64748b" name="Neutral" />
                    <Bar dataKey="negative" stackId="sentiment" fill="#e11d48" name="Negative" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {trends.byRegion && Object.keys(trends.byRegion).length > 0 && (
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 font-bold text-slate-900">Votes by Region</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-bold text-slate-700">Region</th>
                        <th className="px-4 py-3 text-right font-bold text-slate-700">Votes</th>
                        <th className="px-4 py-3 text-right font-bold text-slate-700">Avg Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(trends.byRegion).map(([region, data]) => (
                        <tr key={region} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">{region}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{data.votes || 0}</td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {(data.averageRating || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {trends.byChannel && (
              <div className="grid gap-4 sm:grid-cols-2">
                {Object.entries(trends.byChannel).map(([channel, count]) => (
                  <MetricCard
                    key={channel}
                    label={`${channel.charAt(0).toUpperCase() + channel.slice(1)} Votes`}
                    value={count}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
