import { RefreshCw, Lock, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { adminApi } from "../api/admin";
import { ErrorAlert } from "../components/ErrorAlert";
import { LoadingState } from "../components/LoadingState";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { formatDate, getErrorMessage } from "../lib/format";

export function CitizenManagementPage() {
  const [citizens, setCitizens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeFilter, setActiveFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedCitizen, setSelectedCitizen] = useState(null);

  const loadCitizens = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await adminApi.listCitizens({
        page,
        limit: 20,
        active: activeFilter === "" ? undefined : activeFilter === "true",
      });
      setCitizens(result.citizens || []);
      setTotalPages(result.pages || 1);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load citizens"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCitizens();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, activeFilter]);

  const filtered = searchQuery.trim()
    ? citizens.filter(
        (c) =>
          c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.region.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : citizens;

  const toggleStatus = async (citizen) => {
    setError("");
    setNotice("");
    setActionLoading(citizen._id);

    try {
      await adminApi.updateCitizenStatus(citizen._id, !citizen.active);
      setNotice(`${citizen.email} ${citizen.active ? "deactivated" : "activated"}.`);
      await loadCitizens();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update citizen status"));
    } finally {
      setActionLoading("");
    }
  };

  const openResetModal = (citizen) => {
    setSelectedCitizen(citizen);
    setResetModalOpen(true);
  };

  const handlePasswordReset = async () => {
    if (!selectedCitizen) return;

    setError("");
    setNotice("");
    setActionLoading(selectedCitizen._id);

    try {
      await adminApi.initiatePasswordReset(selectedCitizen._id);
      setNotice(`Password reset email sent to ${selectedCitizen.email}.`);
      setResetModalOpen(false);
      setSelectedCitizen(null);
      await loadCitizens();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to initiate password reset"));
    } finally {
      setActionLoading("");
    }
  };

  if (loading) return <LoadingState label="Loading citizens" />;

  return (
    <div>
      <PageHeader
        title="Citizen Management"
        description="View, filter, and manage citizen accounts. Activate or deactivate users and initiate password resets."
      />

      <div className="space-y-5">
        <ErrorAlert message={error} />
        {notice && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-700">
            {notice}
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by email or region..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={activeFilter}
              onChange={(e) => {
                setActiveFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>

            <button
              onClick={loadCitizens}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white px-8 py-12 text-center">
            <p className="text-slate-600">No citizens found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left font-bold text-slate-700">Email</th>
                  <th className="px-5 py-3 text-left font-bold text-slate-700">Region</th>
                  <th className="px-5 py-3 text-left font-bold text-slate-700">Verified</th>
                  <th className="px-5 py-3 text-left font-bold text-slate-700">Status</th>
                  <th className="px-5 py-3 text-left font-bold text-slate-700">Joined</th>
                  <th className="px-5 py-3 text-right font-bold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((citizen) => (
                  <tr key={citizen._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <span className="font-medium text-slate-950">{citizen.email}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{citizen.region}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-bold ${
                          citizen.verified ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {citizen.verified ? "Verified" : "Pending"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-bold ${
                          citizen.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {citizen.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600 text-xs">
                      {formatDate(citizen.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => toggleStatus(citizen)}
                          disabled={actionLoading === citizen._id}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold ${
                            citizen.active
                              ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                              : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          } disabled:opacity-50`}
                        >
                          {actionLoading === citizen._id ? "..." : citizen.active ? "Deactivate" : "Activate"}
                        </button>

                        <button
                          onClick={() => openResetModal(citizen)}
                          disabled={actionLoading === citizen._id}
                          title="Send password reset email"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          <Lock className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Page {page} of {totalPages}
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

      {resetModalOpen && selectedCitizen && (
        <Modal title="Reset Password" onClose={() => setResetModalOpen(false)}>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Send a password reset email to <strong>{selectedCitizen.email}</strong>?
            </p>
            <p className="text-sm text-slate-500">
              They will receive an email with a link to create a new password. The link expires in 1 hour.
            </p>
            <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
              <button
                onClick={() => setResetModalOpen(false)}
                type="button"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordReset}
                disabled={actionLoading === selectedCitizen._id}
                type="button"
                className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-50"
              >
                {actionLoading === selectedCitizen._id ? "Sending..." : "Send reset email"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
