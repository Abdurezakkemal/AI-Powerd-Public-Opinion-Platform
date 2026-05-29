import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useLocation, useNavigate, Link } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { z } from "zod";
import { useAuth } from "../auth/AuthContext";
import { plannerApi } from "../api/planners";
import { ErrorAlert } from "../components/ErrorAlert";
import { PasswordField } from "../components/PasswordField";

const THEME_KEY = "civic_ui_theme";

function getInitialTheme() {
  if (typeof window === "undefined") return "dark";

  try {
    const storedTheme = window.localStorage.getItem(THEME_KEY);
    if (storedTheme === "light" || storedTheme === "dark") {
      return storedTheme;
    }

    return window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  } catch {
    return "dark";
  }
}

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export function LoginPage() {
  const { isAuthenticated, initializing, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(getInitialTheme);
  const [serverError, setServerError] = useState("");
  const [disabledAccount, setDisabledAccount] = useState(false);
  const [appealReason, setAppealReason] = useState("");
  const [appealNotice, setAppealNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Ignore storage errors.
    }
  }, [theme]);

  const isDark = theme === "dark";

  if (!initializing && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (values) => {
    setServerError("");
    setDisabledAccount(false);
    setAppealNotice("");
    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        setError(issue.path[0], { message: issue.message });
      });
      return;
    }

    try {
      setSubmitting(true);
      await login(parsed.data.email, parsed.data.password);
      const destination = location.state?.from?.pathname || "/dashboard";
      navigate(destination, { replace: true });
    } catch (error) {
      if (error.code === "ACCOUNT_DISABLED") {
        setDisabledAccount(true);
      }
      setServerError(error.message || "Login failed. Check your email and password.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitAppeal = async () => {
    setServerError("");
    setAppealNotice("");
    if (appealReason.trim().length < 20) {
      setServerError("Appeal reason must be at least 20 characters.");
      return;
    }
    try {
      setSubmitting(true);
      await plannerApi.submitDeactivationAppeal({
        email: getValues("email"),
        password: getValues("password"),
        reason: appealReason.trim(),
      });
      setAppealReason("");
      setDisabledAccount(false);
      setAppealNotice("Your appeal has been submitted. An admin will review it.");
    } catch (error) {
      setServerError(error.message || "Failed to submit appeal.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-shell grid min-h-screen bg-slate-100 px-4 py-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.75fr)] lg:px-10" data-theme={theme}>
      <section className="hidden items-center rounded-lg bg-teal-800 px-12 text-white shadow-soft lg:flex">
        <div className="max-w-xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-100">Civic Engagement Platform</p>
          <h1 className="mt-5 text-5xl font-black leading-tight tracking-tight">Policy feedback, organized for action.</h1>
          <p className="mt-5 text-lg leading-8 text-teal-50">
            Sign in as a planner, comment moderator, or admin to manage policies, review public sentiment, and keep participation workflows moving.
          </p>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-md items-center lg:max-w-none lg:pl-10">
        <div className="relative w-full">
          <div className="mb-4 flex justify-end lg:absolute lg:right-10 lg:top-8 lg:z-10 lg:mb-0">
            <button
              type="button"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition ${
                isDark
                  ? "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
              aria-pressed={isDark}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {isDark ? "Light mode" : "Dark mode"}
            </button>
          </div>

          <div className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
            <div className="mb-8">
              <span className="grid h-12 w-12 place-items-center rounded-lg bg-teal-700 text-sm font-black text-white">CP</span>
              <h2 className="mt-5 text-2xl font-bold text-slate-950">Login</h2>
              <p className="mt-1 text-sm text-slate-600">Use your planner, comment moderator, or admin account.</p>
            </div>

            <ErrorAlert message={serverError} />
            {appealNotice ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                {appealNotice}
              </div>
            ) : null}

            <form className="mt-5 space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Email</span>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                  type="email"
                  autoComplete="email"
                  {...register("email")}
                />
                {errors.email ? <span className="mt-1 block text-xs font-semibold text-rose-600">{errors.email.message}</span> : null}
              </label>

              <PasswordField
                label="Password"
                autoComplete="current-password"
                error={errors.password?.message}
                {...register("password")}
              />

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-60"
              >
                {submitting ? "Signing in..." : "Login"}
              </button>

              <div className="text-center">
                <Link
                  to="/forgot-password"
                  className="text-sm font-semibold text-teal-700 hover:text-teal-800"
                >
                  Forgot password?
                </Link>
              </div>
            </form>

            {disabledAccount ? (
              <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-bold text-amber-900">
                  Appeal deactivation
                </p>
                <textarea
                  rows="4"
                  value={appealReason}
                  onChange={(event) => setAppealReason(event.target.value)}
                  placeholder="Explain why your account should be reactivated."
                  className="mt-3 w-full rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-600"
                />
                <button
                  type="button"
                  disabled={submitting}
                  onClick={submitAppeal}
                  className="mt-3 rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-60"
                >
                  Submit appeal
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
