import { CheckCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../api/client";
import { userApi } from "../api/user";
import { readStoredAuth } from "../lib/storage";
import { EmptyState } from "../components/EmptyState";
import { ErrorAlert } from "../components/ErrorAlert";
import { LoadingState } from "../components/LoadingState";
import { PageHeader } from "../components/PageHeader";
import { formatDate, getErrorMessage } from "../lib/format";

export function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadNotifications() {
    setError("");
    try {
      const result = await userApi.getNotifications({ limit: 50, unreadOnly });
      setNotifications(result.notifications || []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load notifications"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unreadOnly]);

  useEffect(() => {
    const userId = readStoredAuth()?.userId;
    if (!userId) return undefined;

    const apiUrl = new URL(API_BASE_URL);
    const protocol = apiUrl.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(`${protocol}//${apiUrl.host}/socket.io/?EIO=4&transport=websocket`);

    socket.addEventListener("message", (event) => {
      const payload = String(event.data);
      if (payload.startsWith("0")) {
        socket.send(`40${JSON.stringify({ auth: { userId } })}`);
      } else if (payload === "2") {
        socket.send("3");
      } else if (payload.startsWith("42")) {
        loadNotifications();
      }
    });

    return () => socket.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function markRead(id) {
    await userApi.markNotificationRead(id);
    await loadNotifications();
  }

  async function markAllRead() {
    await userApi.markAllNotificationsRead();
    await loadNotifications();
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Review system alerts, collaboration updates, and policy events."
        actions={
          <>
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700">
              <input type="checkbox" className="h-4 w-4 accent-teal-700" checked={unreadOnly} onChange={(event) => setUnreadOnly(event.target.checked)} />
              Unread only
            </label>
            <button type="button" onClick={markAllRead} className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white hover:bg-teal-800"><CheckCheck className="h-4 w-4" />Mark all read</button>
          </>
        }
      />
      <ErrorAlert message={error} />
      {loading ? <LoadingState label="Loading notifications" /> : notifications.length ? (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <article key={notification._id} className={`rounded-lg border p-4 shadow-sm ${notification.read ? "border-slate-200 bg-white" : "border-teal-200 bg-teal-50"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{notification.type}</p>
                  <h3 className="mt-1 font-bold text-slate-950">{notification.title}</h3>
                </div>
                <span className="text-xs text-slate-500">{formatDate(notification.createdAt)}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-700">{notification.message}</p>
              {!notification.read ? (
                <button type="button" onClick={() => markRead(notification._id)} className="mt-3 rounded-lg border border-teal-200 bg-white px-3 py-1.5 text-xs font-bold text-teal-700 hover:bg-teal-50">Mark read</button>
              ) : null}
            </article>
          ))}
        </div>
      ) : <EmptyState title="No notifications" description="New alerts and updates will appear here." />}
    </div>
  );
}
