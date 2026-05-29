import { CheckCircle, ExternalLink, RefreshCw, XCircle, ShieldCheck, TimerReset } from "lucide-react";
import { useEffect, useState } from "react";
import { plannerApi } from "../api/planners";
import { EmptyState } from "../components/EmptyState";
import { ErrorAlert } from "../components/ErrorAlert";
import { showToast } from "../lib/toast";
import { LoadingState } from "../components/LoadingState";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { formatDate, getErrorMessage } from "../lib/format";

export function PlannerRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [activeTab, setActiveTab] = useState("requests");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [rejecting, setRejecting] = useState(null);
  const [resolvingAppeal, setResolvingAppeal] = useState(null);
  const [appealDecision, setAppealDecision] = useState("");
  const [reason, setReason] = useState("");

  async function loadRequests({ silent = false } = {}) {
    if (!silent) {
      setLoading(true);
    }
    setError("");
    try {
      const [result, appealResult] = await Promise.all([
        plannerApi.listPendingRequests(),
        plannerApi.listDeactivationAppeals({ status: "pending" }),
      ]);
      setRequests(Array.isArray(result) ? result : []);
      setAppeals(Array.isArray(appealResult) ? appealResult : []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load planner requests"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function approve(request) {
    setActionLoading(request._id);
    setError("");
    try {
      await plannerApi.approveRequest(request._id);
      setRequests((prev) => prev.filter((item) => item._id !== request._id));
      showToast("success", "Planner request approved.");
      await loadRequests({ silent: true });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to approve request"));
    } finally {
      setActionLoading("");
    }
  }

  async function reject() {
    if (!rejecting) return;
    if (reason.trim().length < 10) {
      setError("Rejection reason must be at least 10 characters.");
      return;
    }
    setActionLoading(rejecting._id);
    setError("");
    try {
      await plannerApi.rejectRequest(rejecting._id, reason.trim());
      setRequests((prev) => prev.filter((item) => item._id !== rejecting._id));
      showToast("success", "Planner request rejected.");
      setRejecting(null);
      setReason("");
      await loadRequests({ silent: true });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to reject request"));
    } finally {
      setActionLoading("");
    }
  }

  async function resolveAppeal() {
    if (!resolvingAppeal || !appealDecision) return;
    setActionLoading(resolvingAppeal._id);
    setError("");
    try {
      await plannerApi.resolveDeactivationAppeal(resolvingAppeal._id, {
        decision: appealDecision,
        adminNote: reason.trim(),
      });
      setAppeals((prev) => prev.filter((item) => item._id !== resolvingAppeal._id));
      const appealMsg =
        appealDecision === "approve"
          ? "Planner appeal approved and account reactivated."
          : "Planner appeal rejected.";
      showToast("success", appealMsg);
      setResolvingAppeal(null);
      setAppealDecision("");
      setReason("");
      await loadRequests({ silent: true });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to resolve appeal"));
    } finally {
      setActionLoading("");
    }
  }

  if (loading) return <LoadingState label="Loading planner requests" />;

  const requestCounts = {
    pendingRequests: requests.length,
    pendingAppeals: appeals.length,
  };

  const formatLanguages = (value) =>
    Array.isArray(value) ? value.join(", ") : value || "Not provided";

  return (
    <div>
      <PageHeader title="Planner Requests" description="Review citizen requests for planner access and planner deactivation appeals." />
      <ErrorAlert message={error} />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pending planner requests</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <p className="text-3xl font-black text-slate-950">{requestCounts.pendingRequests}</p>
            <ShieldCheck className="h-8 w-8 text-teal-700" />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pending deactivation appeals</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <p className="text-3xl font-black text-slate-950">{requestCounts.pendingAppeals}</p>
            <TimerReset className="h-8 w-8 text-amber-600" />
          </div>
        </div>
      </div>

      <div className="mb-5 flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("requests")}
          className={`rounded-t-lg px-4 py-2 text-sm font-bold ${
            activeTab === "requests"
              ? "border-b-2 border-teal-700 text-teal-700"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Planner Requests ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab("appeals")}
          className={`rounded-t-lg px-4 py-2 text-sm font-bold ${
            activeTab === "appeals"
              ? "border-b-2 border-teal-700 text-teal-700"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Deactivation Appeals ({appeals.length})
        </button>
      </div>

      {activeTab === "requests" && requests.length ? (
        <section className="space-y-3">
          {requests.map((request) => (
            <article key={request._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-bold text-slate-950">
                      {request.fullName || request.userId?.email || request.email || "Unknown applicant"}
                    </p>
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">Pending</span>
                  </div>
                  <p className="text-sm text-slate-600">
                    {request.region || request.userId?.region || "No region"}
                  </p>
                  <div className="grid gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid-cols-2 xl:grid-cols-3">
                    <span className="rounded-full bg-slate-100 px-3 py-1.5">Age {request.ageRange || request.userId?.ageRange || "N/A"}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1.5">Gender {request.gender || request.userId?.gender || "N/A"}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1.5">Occupation {request.occupation || request.userId?.occupation || "N/A"}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1.5">Education {request.education || request.userId?.education || "N/A"}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1.5">Language {request.preferredLanguage || "N/A"}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1.5">Spoken {formatLanguages(request.languagesSpoken)}</span>
                  </div>
                  <p className="max-w-3xl text-sm leading-6 text-slate-700">{request.reason}</p>
                  {request.proofFile ? (
                    <a
                      href={request.proofFile}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Supporting proof file
                    </a>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                    Submitted {formatDate(request.createdAt)}
                  </span>
                  <button
                    type="button"
                    disabled={actionLoading === request._id}
                    onClick={() => approve(request)}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading === request._id}
                    onClick={() => setRejecting(request)}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : activeTab === "requests" ? (
        <EmptyState title="No pending planner requests" description="New citizen requests will appear here." />
      ) : appeals.length ? (
        <section className="space-y-3">
          {appeals.map((appeal) => (
            <article key={appeal._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-bold text-slate-950">
                      {appeal.plannerId?.email || "Unknown"}
                    </p>
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">Pending appeal</span>
                  </div>
                  <p className="text-sm text-slate-600">{appeal.plannerId?.region || "No region"}</p>
                  <p className="max-w-3xl text-sm leading-6 text-slate-700">{appeal.reason}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                    Submitted {formatDate(appeal.createdAt)}
                  </span>
                  <button
                    type="button"
                    disabled={actionLoading === appeal._id}
                    onClick={() => {
                      setResolvingAppeal(appeal);
                      setAppealDecision("approve");
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading === appeal._id}
                    onClick={() => {
                      setResolvingAppeal(appeal);
                      setAppealDecision("reject");
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <EmptyState title="No pending deactivation appeals" description="Appeals from deactivated planners will appear here." />
      )}

      {rejecting ? (
        <Modal title="Reject planner request" onClose={() => setRejecting(null)}>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Provide a reason for rejecting {rejecting.userId?.email || "this applicant"}.</p>
            <textarea
              rows="4"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
            />
            <div className="flex justify-end gap-2">
              <button type="button" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50" onClick={() => setRejecting(null)}>Cancel</button>
              <button type="button" disabled={Boolean(actionLoading)} className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-bold text-white hover:bg-rose-800 disabled:opacity-50" onClick={reject}>Reject</button>
            </div>
          </div>
        </Modal>
      ) : null}

      {resolvingAppeal ? (
        <Modal title="Resolve planner appeal" onClose={() => setResolvingAppeal(null)}>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              {appealDecision === "approve"
                ? `Approve this appeal and reactivate ${resolvingAppeal.plannerId?.email || "the planner"}?`
                : `Reject the appeal from ${resolvingAppeal.plannerId?.email || "this planner"}?`}
            </p>
            <textarea
              rows="4"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Admin note (optional)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
            />
            <div className="flex justify-end gap-2">
              <button type="button" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50" onClick={() => setResolvingAppeal(null)}>Cancel</button>
              <button
                type="button"
                disabled={Boolean(actionLoading)}
                className={`rounded-lg px-4 py-2 text-sm font-bold text-white ${
                  appealDecision === "approve"
                    ? "bg-emerald-700 hover:bg-emerald-800"
                    : "bg-rose-700 hover:bg-rose-800"
                } disabled:opacity-50`}
                onClick={resolveAppeal}
              >
                {appealDecision === "approve" ? "Approve appeal" : "Reject appeal"}
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
