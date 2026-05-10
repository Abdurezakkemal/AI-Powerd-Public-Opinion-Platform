import { Download, RefreshCw, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { adminApi } from "../api/admin";
import { ErrorAlert } from "../components/ErrorAlert";
import { LoadingState } from "../components/LoadingState";
import { PageHeader } from "../components/PageHeader";
import { formatDate, getErrorMessage } from "../lib/format";

const ACTION_COLORS = {
  CREATE: "bg-emerald-100 text-emerald-700",
  UPDATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-rose-100 text-rose-700",
  PUBLISH: "bg-purple-100 text-purple-700",
  ACTIVATE: "bg-teal-100 text-teal-700",
  CLOSE: "bg-slate-100 text-slate-700",
  APPROVE: "bg-emerald-100 text-emerald-700",
  REJECT: "bg-rose-100 text-rose-700",
  DEACTIVATE: "bg-slate-100 text-slate-700",
};

export function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    action: "",
    userId: "",
    userRole: "",
  });
  const [searchQuery, setSearchQuery] = useState("");

  const loadLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await adminApi.getAuditLogs({
        page,
        limit: 30,
        action: filters.action || undefined,
        userId: filters.userId || undefined,
        userRole: filters.userRole || undefined,
      });
      setLogs(result.logs || []);
      setTotalPages(result.pages || 1);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load audit logs"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters]);

  const handleExport = async () => {
    setExporting(true);
    setError("");
    try {
      const blob = await adminApi.exportAuditLogs({
        action: filters.action || undefined,
        userId: filters.userId || undefined,
        userRole: filters.userRole || undefined,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to export logs"));
    } finally {
      setExporting(false);
    }
  };

  const filtered = searchQuery.trim()
    ? logs.filter(
        (log) =>
          log._id?.toString()?.includes(searchQuery) ||
          log.details?.toString()?.toLowerCase()?.includes(searchQuery.toLowerCase())
      )
    : logs;

  if (loading) return <LoadingState label="Loading audit logs" />;

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        description="Track all admin and planner actions in the system. Export logs for compliance and analysis."
      />

      <div className="space-y-5">
        <ErrorAlert message={error} />

        {/* Filters */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900">Filters</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Action</span>
              <select
                value={filters.action}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, action: e.target.value }));
                  setPage(1);
                }}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              >
                <option value="">All Actions</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="PUBLISH">Publish</option>
                <option value="ACTIVATE">Activate</option>
                <option value="CLOSE">Close</option>
                <option value="APPROVE">Approve</option>
                <option value="REJECT">Reject</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">User Role</span>
              <select
                value={filters.userRole}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, userRole: e.target.value }));
                  setPage(1);
                }}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="planner">Planner</option>
                <option value="citizen">Citizen</option>
              </select>
            </label>

            <div className="flex gap-2 items-end">
              <button
                onClick={loadLogs}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 h-9"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>

              <button
                onClick={handleExport}
                disabled={exporting || logs.length === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3 py-2 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-50 h-9"
              >
                <Download className="h-4 w-4" />
                {exporting ? "Exporting..." : "Export CSV"}
              </button>
            </div>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Search details</span>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by ID or details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              />
            </div>
          </label>
        </div>

        {/* Logs Table */}
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white px-8 py-12 text-center">
            <p className="text-slate-600">No audit logs found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-slate-700">Timestamp</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-700">User</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-700">Action</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-700">Resource</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-700">Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-600">{formatDate(log.timestamp)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <p className="font-medium text-slate-900">{log.userId?.email || "Unknown"}</p>
                        <p className="text-xs text-slate-500 capitalize">{log.userRole}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold capitalize ${
                          ACTION_COLORS[log.action] || "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-900 font-medium">{log.resourceType}</p>
                      <p className="text-xs text-slate-500">{log.resourceId?.substring(0, 12)}...</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-600 truncate max-w-xs">
                        {JSON.stringify(log.details).substring(0, 50)}...
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              Page {page} of {totalPages} ({logs.length} records)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
