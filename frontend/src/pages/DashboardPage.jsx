import { Activity, FileText, Star, Vote } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../api/admin";
import { analyticsApi } from "../api/analytics";
import { policyApi } from "../api/policies";
import { useAuth } from "../auth/AuthContext";
import { AIHealthCard } from "../components/AIHealthCard";
import { EmptyState } from "../components/EmptyState";
import { ErrorAlert } from "../components/ErrorAlert";
import { LoadingState } from "../components/LoadingState";
import { MetricCard } from "../components/MetricCard";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { formatDate, formatNumber, formatRating, getErrorMessage } from "../lib/format";

export function DashboardPage() {
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adminStats, setAdminStats] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [policyStats, setPolicyStats] = useState({ totalVotes: 0, averageRating: 0 });

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError("");
      try {
        if (role === "admin") {
          const stats = await adminApi.dashboardStats();
          if (active) setAdminStats(stats);
        }

        const policyResult = await policyApi.list({
          owner: role === "planner" ? "me" : undefined,
          limit: 100,
        });
        const nextPolicies = policyResult.policies || [];
        const analyticPolicies = nextPolicies.filter((policy) => ["active", "paused", "closed"].includes(policy.status));
        const summaries = await Promise.allSettled(
          analyticPolicies.map((policy) => analyticsApi.summary(policy.id)),
        );
        const totals = summaries.reduce(
          (acc, item) => {
            if (item.status !== "fulfilled") return acc;
            const votes = Number(item.value.totalVotes || 0);
            acc.totalVotes += votes;
            acc.ratingVoteWeight += Number(item.value.averageRating || 0) * votes;
            return acc;
          },
          { totalVotes: 0, ratingVoteWeight: 0 },
        );

        if (active) {
          setPolicies(nextPolicies);
          setPolicyStats({
            totalVotes: totals.totalVotes,
            averageRating: totals.totalVotes ? totals.ratingVoteWeight / totals.totalVotes : 0,
          });
        }
      } catch (err) {
        if (active) setError(getErrorMessage(err, "Failed to load dashboard data"));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, [role]);

  const summary = useMemo(() => {
    if (role === "admin" && adminStats) {
      return {
        activePolicies: adminStats.policies?.active || 0,
        totalVotes: adminStats.votes?.total || 0,
        averageRating: adminStats.votes?.averageRating || 0,
        helper: `${formatNumber(adminStats.votes?.app)} app, ${formatNumber(adminStats.votes?.sms)} SMS`,
      };
    }

    return {
      activePolicies: policies.filter((policy) => policy.status === "active").length,
      totalVotes: policyStats.totalVotes,
      averageRating: policyStats.averageRating,
      helper: "Derived from visible policy analytics",
    };
  }, [adminStats, policies, policyStats, role]);

  if (loading) return <LoadingState label="Loading dashboard" />;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="A concise summary of policy activity, voting volume, and current engagement signals."
        actions={
          <Link className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white hover:bg-teal-800" to="/policies/new">
            Create policy
          </Link>
        }
      />
      <ErrorAlert message={error} />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Active policies" value={formatNumber(summary.activePolicies)} icon={FileText} helper="Currently open for voting" />
        <MetricCard label="Total votes" value={formatNumber(summary.totalVotes)} icon={Vote} helper={summary.helper} />
        <MetricCard label="Average rating" value={formatRating(summary.averageRating)} icon={Star} helper="Weighted by vote count where available" />
      </div>

      {role === "admin" && adminStats ? (
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <MetricCard label="Active planners" value={formatNumber(adminStats.planners?.active)} icon={Activity} helper={`${formatNumber(adminStats.planners?.total)} total planners`} />
          <MetricCard label="Pending comments" value={formatNumber(adminStats.comments?.pendingReview)} helper="Awaiting moderation or AI retry" />
          <AIHealthCard />
        </div>
      ) : null}

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-950">Recent policies</h3>
            <p className="text-sm text-slate-500">Latest visible policies from the backend.</p>
          </div>
          <Link className="text-sm font-bold text-teal-700 hover:text-teal-900" to="/policies">
            View all
          </Link>
        </div>

        {policies.length ? (
          <div className="divide-y divide-slate-100">
            {policies.slice(0, 6).map((policy) => (
              <Link
                key={policy.id}
                to={`/policies/${policy.id}/analytics`}
                className="grid gap-3 py-4 hover:bg-slate-50 sm:grid-cols-[minmax(0,1fr)_auto_auto]"
              >
                <div>
                  <p className="font-semibold text-slate-950">{policy.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{policy.policyCode} • {policy.targetRegions?.join(", ")}</p>
                </div>
                <StatusBadge status={policy.status} />
                <p className="text-sm text-slate-500">{formatDate(policy.startDate)} to {formatDate(policy.endDate)}</p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="No policies yet" description="Create a draft policy to start collecting public feedback." />
        )}
      </section>
    </div>
  );
}
