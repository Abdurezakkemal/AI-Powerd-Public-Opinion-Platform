import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { userApi } from "../api/user";
import { useAuth } from "../auth/AuthContext";
import { ETHIOPIAN_REGIONS } from "../constants/regions";
import { ErrorAlert } from "../components/ErrorAlert";
import { LoadingState } from "../components/LoadingState";
import { PageHeader } from "../components/PageHeader";
import { getErrorMessage } from "../lib/format";

export function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [region, setRegion] = useState(user?.region || "");
  const [emailForm, setEmailForm] = useState({ newEmail: "", code: "" });
  const [phoneForm, setPhoneForm] = useState({ newPhone: "", code: "" });
  const [loading, setLoading] = useState(!user);
  const [submitting, setSubmitting] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (user) {
      setRegion(user.region || "");
      setLoading(false);
    }
  }, [user]);

  async function run(key, action, message) {
    setSubmitting(key);
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(message);
      await refreshUser();
    } catch (err) {
      setError(getErrorMessage(err, "Request failed"));
    } finally {
      setSubmitting("");
    }
  }

  if (loading) return <LoadingState label="Loading settings" />;

  return (
    <div>
      <PageHeader title="Settings" description="Manage your dashboard profile, contact verification, and password." />
      <ErrorAlert message={error} />
      {notice ? <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{notice}</div> : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Profile</h3>
          <div className="mt-4 space-y-3">
            <p className="text-sm text-slate-600"><strong>Email:</strong> {user?.email}</p>
            <p className="text-sm text-slate-600"><strong>Role:</strong> {user?.role}</p>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Region</span>
              <select value={region} onChange={(event) => setRegion(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-600">
                <option value="">No region</option>
                {ETHIOPIAN_REGIONS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <button disabled={submitting === "profile"} type="button" onClick={() => run("profile", () => userApi.update({ region }), "Profile updated.")} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-50">Save profile</button>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Password</h3>
          <p className="mt-2 text-sm text-slate-600">Change your password using the dedicated password form.</p>
          <Link to="/change-password" className="mt-4 inline-block rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white hover:bg-teal-800">Change password</Link>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Email change</h3>
          <div className="mt-4 grid gap-3">
            <input placeholder="new@email.com" value={emailForm.newEmail} onChange={(event) => setEmailForm((current) => ({ ...current, newEmail: event.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-600" />
            <div className="flex flex-wrap gap-2">
              <button disabled={submitting === "email-request"} type="button" onClick={() => run("email-request", () => userApi.requestEmailChange(emailForm.newEmail), "Verification code sent to the new email.")} className="rounded-lg border border-teal-200 px-4 py-2 text-sm font-bold text-teal-700 hover:bg-teal-50 disabled:opacity-50">Send code</button>
            </div>
            <input placeholder="verification code" value={emailForm.code} onChange={(event) => setEmailForm((current) => ({ ...current, code: event.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-600" />
            <button disabled={submitting === "email-verify"} type="button" onClick={() => run("email-verify", () => userApi.verifyEmailChange(emailForm.code), "Email updated.")} className="w-fit rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-50">Verify email</button>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Phone change</h3>
          <div className="mt-4 grid gap-3">
            <input placeholder="+251912345678" value={phoneForm.newPhone} onChange={(event) => setPhoneForm((current) => ({ ...current, newPhone: event.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-600" />
            <button disabled={submitting === "phone-request"} type="button" onClick={() => run("phone-request", () => userApi.requestPhoneChange(phoneForm.newPhone), "Phone verification code requested.")} className="w-fit rounded-lg border border-teal-200 px-4 py-2 text-sm font-bold text-teal-700 hover:bg-teal-50 disabled:opacity-50">Send code</button>
            <input placeholder="verification code" value={phoneForm.code} onChange={(event) => setPhoneForm((current) => ({ ...current, code: event.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-600" />
            <button disabled={submitting === "phone-verify"} type="button" onClick={() => run("phone-verify", () => userApi.verifyPhoneChange(phoneForm.newPhone, phoneForm.code), "Phone updated. You may need to sign in again.")} className="w-fit rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-50">Verify phone</button>
          </div>
        </section>
      </div>
    </div>
  );
}
