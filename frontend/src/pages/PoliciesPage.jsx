import {
  BarChart3,
  CalendarClock,
  Copy,
  Edit,
  FilePlus,
  History,
  Pause,
  Play,
  Power,
  RefreshCw,
  Archive,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { policyApi } from "../api/policies";
import { EmptyState } from "../components/EmptyState";
import { ErrorAlert } from "../components/ErrorAlert";
import { LoadingState } from "../components/LoadingState";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { ETHIOPIAN_REGIONS, POLICY_STATUSES } from "../constants/regions";
import { formatDate, getErrorMessage, toIsoFromDateInput } from "../lib/format";

const PAGE_SIZE = 20;

function Button({ children, icon: Icon, variant = "secondary", ...props }) {
  const classes =
    variant === "primary"
      ? "bg-teal-700 text-white hover:bg-teal-800"
      : variant === "danger"
        ? "border border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50";

  return (
    <button
      type="button"
      className={`inline-flex min-h-9 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold disabled:opacity-50 ${classes}`}
      {...props}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}

export function PoliciesPage() {
  const [policies, setPolicies] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [historyPolicy, setHistoryPolicy] = useState(null);
  const [historyEvents, setHistoryEvents] = useState([]);
  const [filters, setFilters] = useState({
    status: "",
    region: "",
    search: "",
    startDate: "",
    endDate: "",
    topic: "",
    includeArchived: false,
  });

  const loadPolicies = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await policyApi.list({
        status: filters.status || undefined,
        region: filters.region || undefined,
        topic: filters.topic || undefined,
        includeArchived: filters.includeArchived || filters.status === "archived" ? true : undefined,
        owner: "me",
        page,
        limit: PAGE_SIZE,
      });
      setPolicies(result.policies || []);
      setTotal(result.total || 0);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load policies"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.region, filters.topic, filters.includeArchived, page]);

  const filteredPolicies = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    const start = filters.startDate ? new Date(filters.startDate) : null;
    const end = filters.endDate ? new Date(filters.endDate) : null;

    return policies.filter((policy) => {
      const text = `${policy.title} ${policy.policyCode}`.toLowerCase();
      const matchesSearch = !query || text.includes(query);
      const policyStart = new Date(policy.startDate);
      const policyEnd = new Date(policy.endDate);
      const matchesStart = !start || policyStart >= start;
      const matchesEnd = !end || policyEnd <= end;
      return matchesSearch && matchesStart && matchesEnd;
    });
  }, [filters.search, filters.startDate, filters.endDate, policies]);

  const resetToFirstPage = (field, value) => {
    setPage(1);
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const runAction = async (key, action, successMessage) => {
    setActionLoading(key);
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(successMessage);
      await loadPolicies();
    } catch (err) {
      setError(getErrorMessage(err, "Action failed"));
    } finally {
      setActionLoading("");
    }
  };

  const showHistory = async (policy) => {
    setActionLoading(`history-${policy.id}`);
    setError("");
    try {
      const result = await policyApi.history(policy.id);
      setHistoryPolicy(policy);
      setHistoryEvents(result.events || []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load policy history"));
    } finally {
      setActionLoading("");
    }
  };

  const extendPolicy = async (policy) => {
    const value = window.prompt("Enter the new end date as YYYY-MM-DD", "");
    if (!value) return;
    await runAction(
      `extend-${policy.id}`,
      () => policyApi.extend(policy.id, toIsoFromDateInput(value, true)),
      "Policy end date updated.",
    );
  };

  const deletePolicy = async (policy) => {
    if (!window.confirm(`Delete "${policy.title}" permanently?`)) return;
    await runAction(`delete-${policy.id}`, () => policyApi.delete(policy.id), "Policy deleted.");
  };

  const clonePolicy = async (policy) => {
    await runAction(`clone-${policy.id}`, () => policyApi.clone(policy.id), "Policy cloned as a new draft.");
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageHeader
        title="Policies"
        description="Create draft policies, manage lifecycle states, and open analytics for active, paused, or closed policies."
        actions={
          <Link className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white hover:bg-teal-800" to="/policies/new">
            <FilePlus className="h-4 w-4" />
            Create New Policy
          </Link>
        }
      />

      <div className="space-y-3">
        <ErrorAlert message={error} />
        {notice ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{notice}</div> : null}
      </div>

      <section className="mt-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1.2fr_repeat(5,minmax(0,1fr))]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              placeholder="Search by title or code"
              value={filters.search}
              onChange={(event) => resetToFirstPage("search", event.target.value)}
            />
          </label>

          <select
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-600"
            value={filters.status}
            onChange={(event) => resetToFirstPage("status", event.target.value)}
          >
            <option value="">All statuses</option>
            {POLICY_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-600"
            value={filters.region}
            onChange={(event) => resetToFirstPage("region", event.target.value)}
          >
            <option value="">All regions</option>
            {ETHIOPIAN_REGIONS.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>

          <input
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-600"
            type="date"
            value={filters.startDate}
            onChange={(event) => resetToFirstPage("startDate", event.target.value)}
            aria-label="Filter by start date"
          />

          <input
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-600"
            type="date"
            value={filters.endDate}
            onChange={(event) => resetToFirstPage("endDate", event.target.value)}
            aria-label="Filter by end date"
          />

          <input
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-600"
            placeholder="Topic"
            value={filters.topic}
            onChange={(event) => resetToFirstPage("topic", event.target.value)}
          />
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 accent-teal-700"
            checked={filters.includeArchived}
            onChange={(event) => resetToFirstPage("includeArchived", event.target.checked)}
          />
          Include archived policies
        </label>
      </section>

      {loading ? (
        <LoadingState label="Loading policies" />
      ) : filteredPolicies.length ? (
        <section className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-bold">Title</th>
                  <th className="px-4 py-3 font-bold">Policy Code</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold">Target Regions</th>
                  <th className="px-4 py-3 font-bold">Dates</th>
                  <th className="px-4 py-3 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPolicies.map((policy) => {
                  const busy = actionLoading.endsWith(policy.id);
                  const analyticsAllowed = ["active", "paused", "closed"].includes(policy.status);
                  return (
                    <tr key={policy.id} className="align-top">
                      <td className="max-w-xs px-4 py-4">
                        <p className="font-bold text-slate-950">{policy.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{policy.description}</p>
                      </td>
                      <td className="px-4 py-4 font-mono text-xs font-bold text-slate-700">{policy.policyCode}</td>
                      <td className="px-4 py-4"><StatusBadge status={policy.status} /></td>
                      <td className="max-w-xs px-4 py-4 text-slate-600">{policy.targetRegions?.join(", ") || "None"}</td>
                      <td className="px-4 py-4 text-slate-600">
                        <div className="min-w-40">{formatDate(policy.startDate)}</div>
                        <div>{formatDate(policy.endDate)}</div>
                      </td>
                      <td className="min-w-[23rem] px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          {analyticsAllowed ? (
                            <Link
                              className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                              to={`/policies/${policy.id}/analytics`}
                            >
                              <BarChart3 className="h-4 w-4" />
                              Analytics
                            </Link>
                          ) : null}
                          {policy.status === "draft" ? (
                            <Link
                              className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                              to={`/policies/${policy.id}/edit`}
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </Link>
                          ) : null}
                          {policy.status === "draft" ? (
                            <Button disabled={busy} icon={Power} onClick={() => runAction(`publish-${policy.id}`, () => policyApi.publish(policy.id), "Policy published.")}>
                              Publish
                            </Button>
                          ) : null}
                          {policy.status === "published" ? (
                            <>
                              <Button disabled={busy} icon={RefreshCw} onClick={() => runAction(`unpublish-${policy.id}`, () => policyApi.unpublish(policy.id), "Policy unpublished.")}>
                                Unpublish
                              </Button>
                              <Button disabled={busy} icon={Play} onClick={() => runAction(`activate-${policy.id}`, () => policyApi.activate(policy.id), "Policy activated.")}>
                                Activate
                              </Button>
                            </>
                          ) : null}
                          {policy.status === "active" ? (
                            <Button disabled={busy} icon={Pause} onClick={() => runAction(`pause-${policy.id}`, () => policyApi.pause(policy.id), "Policy paused.")}>
                              Pause
                            </Button>
                          ) : null}
                          {policy.status === "paused" ? (
                            <Button disabled={busy} icon={Play} onClick={() => runAction(`resume-${policy.id}`, () => policyApi.resume(policy.id), "Policy resumed.")}>
                              Resume
                            </Button>
                          ) : null}
                          {["active", "paused"].includes(policy.status) ? (
                            <>
                              <Button disabled={busy} icon={CalendarClock} onClick={() => extendPolicy(policy)}>
                                Extend
                              </Button>
                              <Button disabled={busy} icon={Power} variant="danger" onClick={() => runAction(`close-${policy.id}`, () => policyApi.close(policy.id), "Policy closed.")}>
                                Close
                              </Button>
                            </>
                          ) : null}
                          {["draft", "published"].includes(policy.status) ? (
                            <Button disabled={busy} icon={Trash2} variant="danger" onClick={() => deletePolicy(policy)}>
                              Delete
                            </Button>
                          ) : null}
                          {policy.status !== "draft" && policy.status !== "archived" ? (
                            <Button disabled={busy} icon={Archive} variant="danger" onClick={() => runAction(`archive-${policy.id}`, () => policyApi.archive(policy.id), "Policy archived.")}>
                              Archive
                            </Button>
                          ) : null}
                          {policy.status === "archived" ? (
                            <Button disabled={busy} icon={RotateCcw} onClick={() => runAction(`restore-${policy.id}`, () => policyApi.restore(policy.id), "Policy restored to draft.")}>
                              Restore
                            </Button>
                          ) : null}
                          <Button disabled={busy} icon={Copy} onClick={() => clonePolicy(policy)}>
                            Clone
                          </Button>
                          <Button disabled={busy} icon={History} onClick={() => showHistory(policy)}>
                            History
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                Previous
              </Button>
              <Button disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>
                Next
              </Button>
            </div>
          </div>
        </section>
      ) : (
        <div className="mt-5">
          <EmptyState
            title="No policies match your filters"
            description="Adjust the status, region, date range, or search query to find policies."
            action={
              <Link className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white hover:bg-teal-800" to="/policies/new">
                Create New Policy
              </Link>
            }
          />
        </div>
      )}

      {historyPolicy ? (
        <Modal title={`History: ${historyPolicy.title}`} onClose={() => setHistoryPolicy(null)}>
          {historyEvents.length ? (
            <ol className="space-y-3">
              {historyEvents.map((event, index) => (
                <li key={`${event.action}-${event.timestamp}-${index}`} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold text-slate-950">{event.action}</p>
                    <p className="text-xs text-slate-500">{formatDate(event.timestamp)}</p>
                  </div>
                  <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{event.userRole || "unknown role"}</p>
                  {event.details ? (
                    <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">
                      {JSON.stringify(event.details, null, 2)}
                    </pre>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState title="No history events" description="This policy does not have audit events yet." />
          )}
        </Modal>
      ) : null}
    </div>
  );
}
