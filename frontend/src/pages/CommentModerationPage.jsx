import { RefreshCw, CheckCircle, XCircle, AlertCircle, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { adminApi } from "../api/admin";
import { ErrorAlert } from "../components/ErrorAlert";
import { LoadingState } from "../components/LoadingState";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { getErrorMessage, formatDate } from "../lib/format";

const SENTIMENT_COLORS = {
  positive: "bg-emerald-100 text-emerald-700",
  negative: "bg-rose-100 text-rose-700",
  neutral: "bg-slate-100 text-slate-700",
};

export function CommentModerationPage() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedComment, setSelectedComment] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionType, setActionType] = useState(null);

  const loadComments = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await adminApi.getPendingComments({
        page,
        limit: 20,
      });
      setComments(result.comments || []);
      setTotalPages(result.pages || 1);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load pending comments"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const performAction = async (commentId, status) => {
    setActionLoading(commentId);
    setError("");
    setNotice("");

    try {
      await adminApi.updateComment(commentId, { status });
      setNotice(`Comment ${status}.`);
      setModalOpen(false);
      setSelectedComment(null);
      await loadComments();
    } catch (err) {
      setError(getErrorMessage(err, `Failed to ${status} comment`));
    } finally {
      setActionLoading("");
    }
  };

  const retryComment = async (commentId) => {
    setActionLoading(commentId);
    setError("");
    setNotice("");

    try {
      await adminApi.retryComment(commentId);
      setNotice("AI analysis retried.");
      await loadComments();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to retry comment analysis"));
    } finally {
      setActionLoading("");
    }
  };

  const retryAll = async () => {
    if (!confirm("Retry AI analysis for all pending comments?")) return;

    setActionLoading("retry-all");
    setError("");
    setNotice("");

    try {
      await adminApi.retryAllComments();
      setNotice("Batch retry initiated.");
      await loadComments();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to retry all comments"));
    } finally {
      setActionLoading("");
    }
  };

  const deleteComment = async (commentId) => {
    if (!confirm("Delete this comment? This cannot be undone.")) return;

    setActionLoading(commentId);
    setError("");
    setNotice("");

    try {
      await adminApi.deleteComment(commentId);
      setNotice("Comment deleted.");
      setModalOpen(false);
      setSelectedComment(null);
      await loadComments();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete comment"));
    } finally {
      setActionLoading("");
    }
  };

  if (loading) return <LoadingState label="Loading pending comments" />;

  return (
    <div>
      <PageHeader
        title="Comment Moderation"
        description="Review and manage comments that failed AI sentiment analysis. Retry analysis, approve, reject, or delete."
      />

      <div className="space-y-5">
        <ErrorAlert message={error} />
        {notice && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-700">
            {notice}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={loadComments}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>

          <button
            onClick={retryAll}
            disabled={comments.length === 0 || actionLoading === "retry-all"}
            className="inline-flex items-center gap-2 rounded-lg border border-teal-300 bg-teal-50 px-3 py-2.5 text-sm font-bold text-teal-700 hover:bg-teal-100 disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            Retry All ({comments.length})
          </button>
        </div>

        {comments.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white px-8 py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <p className="font-semibold text-slate-900">No pending comments</p>
            <p className="text-sm text-slate-600">All comments have been processed by AI.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
              <div
                key={comment._id}
                className="rounded-lg border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-600">
                      Policy: <span className="text-slate-900 font-bold">{comment.policyId?.title || "Deleted"}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Comment by {comment.userId?.email || "Unknown"} • {formatDate(comment.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {comment.sentiment?.label && (
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold capitalize ${
                          SENTIMENT_COLORS[comment.sentiment?.label] || "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {comment.sentiment?.label}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-3 rounded-lg bg-slate-50 p-3">
                  <p className="text-sm text-slate-900">{comment.comment}</p>
                </div>

                <div className="mb-3 space-y-1">
                  {comment.keywords && comment.keywords.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-1">Keywords:</p>
                      <div className="flex flex-wrap gap-1">
                        {comment.keywords.map((kw, i) => (
                          <span
                            key={i}
                            className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {comment.sentiment?.confidence !== undefined && (
                    <p className="text-xs text-slate-600">
                      <strong>Confidence:</strong> {(comment.sentiment.confidence * 100).toFixed(1)}%
                    </p>
                  )}
                  {comment.errorReason && (
                    <div className="rounded bg-rose-50 p-2 border border-rose-200">
                      <p className="text-xs text-rose-700">
                        <strong>Error:</strong> {comment.errorReason}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-200">
                  <button
                    onClick={() => {
                      setSelectedComment(comment);
                      setActionType("approve");
                      setModalOpen(true);
                    }}
                    disabled={actionLoading === comment._id}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Approve
                  </button>

                  <button
                    onClick={() => {
                      setSelectedComment(comment);
                      setActionType("reject");
                      setModalOpen(true);
                    }}
                    disabled={actionLoading === comment._id}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject
                  </button>

                  <button
                    onClick={() => retryComment(comment._id)}
                    disabled={actionLoading === comment._id}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Retry
                  </button>

                  <button
                    onClick={() => deleteComment(comment._id)}
                    disabled={actionLoading === comment._id}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
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

      {modalOpen && selectedComment && (
        <Modal title={`${actionType === "approve" ? "Approve" : "Reject"} Comment`} onClose={() => setModalOpen(false)}>
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-sm text-slate-900">"{selectedComment.comment}"</p>
            </div>

            <p className="text-sm text-slate-600">
              {actionType === "approve"
                ? "Approve this comment? It will be published and visible in analytics."
                : "Reject this comment? It will be hidden from analytics."}
            </p>

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
              <button
                onClick={() => setModalOpen(false)}
                type="button"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => performAction(selectedComment._id, actionType)}
                disabled={actionLoading === selectedComment._id}
                type="button"
                className={`rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-50 ${
                  actionType === "approve"
                    ? "bg-emerald-700 hover:bg-emerald-800"
                    : "bg-rose-700 hover:bg-rose-800"
                }`}
              >
                {actionLoading === selectedComment._id ? "Processing..." : actionType === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
