import { useState } from "react";
import { BrowserRouter, Link, Routes, Route } from "react-router-dom";
import UserLayout from "./pages/user/UserLayout";
import UserHome from "./pages/user/UserHome";
import UserPolicies from "./pages/user/UserPolicies";
import UserPolicyDetails from "./pages/user/UserPolicyDetails";
import UserHistory from "./pages/user/UserHistory";
import UserProfile from "./pages/user/UserProfile";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPlanners from "./pages/admin/AdminPlanners";
import AdminCitizens from "./pages/admin/AdminCitizens";
import AdminFeedback from "./pages/admin/AdminFeedback";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSettings from "./pages/admin/AdminSettings";
import PlannerLayout from "./pages/planner/PlannerLayout";
import PlannerDashboard from "./pages/planner/PlannerDashboard";
import PlannerPolicies from "./pages/planner/PlannerPolicies";
import PlannerPolicyEditor from "./pages/planner/PlannerPolicyEditor";
import PlannerFeedback from "./pages/planner/PlannerFeedback";
import PlannerAnalytics from "./pages/planner/PlannerAnalytics";
import PlannerProfile from "./pages/planner/PlannerProfile";
import PlannerSettings from "./pages/planner/PlannerSettings";

const features = [
  {
    title: "Policy insights",
    description: "See live feedback summaries, sentiment signals, and keywords at a glance.",
  },
  {
    title: "Role-based access",
    description: "Separate citizen, planner, and admin experiences without cluttering the UI.",
  },
  {
    title: "Fast AI analysis",
    description: "Connect comments to sentiment and keyword analysis through the AI service.",
  },
];

const steps = [
  "Sign in or create an account in a few steps.",
  "Browse active policies in your region and read details.",
  "Submit feedback, track history, and review analytics.",
];

const stats = [
  { value: "24/7", label: "access to policy updates" },
  { value: "1", label: "unified frontend for all roles" },
  { value: "AI", label: "assisted sentiment analysis" },
];

function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white to-emerald-50/30 text-slate-900">
      <div className="pointer-events-none absolute -left-24 bottom-20 h-56 w-56 rounded-full bg-emerald-400/10" />
      <div className="pointer-events-none absolute -right-28 top-24 h-80 w-80 rounded-full bg-emerald-500/10" />

      <header className="relative z-10 mx-auto flex w-[min(1120px,calc(100%-3rem))] flex-wrap items-center justify-between gap-4 py-6 max-[640px]:w-[calc(100%-1.75rem)]">
        <div className="flex items-center gap-3.5">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald-600 to-green-800 text-sm font-extrabold tracking-[0.08em] text-white shadow-[0_16px_36px_rgba(16,185,129,0.25)]">HV</span>
          <div>
            <p className="m-0 text-base font-bold text-slate-900">HizbView</p>
            <p className="m-0 text-sm text-slate-600">Public participation made clear</p>
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-5" aria-label="Primary navigation">
          <a className="font-semibold text-slate-700 transition hover:text-green-700" href="#features">Features</a>
          <a className="font-semibold text-slate-700 transition hover:text-green-700" href="#workflow">Workflow</a>
          <a className="font-semibold text-slate-700 transition hover:text-green-700" href="#cta">Get started</a>
        </nav>
        <div className="flex flex-wrap items-center gap-3">
          <Link className="font-semibold text-slate-700 transition hover:text-green-700" to="/login">Login</Link>
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-green-700/20 bg-white/90 px-4 font-bold text-green-900 transition hover:-translate-y-0.5 hover:shadow"
            to="/register"
          >
            Create account
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid w-[min(1120px,calc(100%-3rem))] grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] items-center gap-10 py-14 max-[980px]:grid-cols-1 max-[640px]:w-[calc(100%-1.75rem)] max-[980px]:pt-6">
          <div>
            <span className="mb-4 inline-flex items-center rounded-full bg-emerald-600/10 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.04em] text-green-700">White and green civic platform</span>
            <h1 className="m-0 max-w-[12ch] text-[clamp(2.7rem,5vw,5rem)] font-extrabold leading-[1.02] tracking-[-0.04em] text-slate-900 max-[980px]:max-w-full max-[640px]:text-[clamp(2.25rem,13vw,3.4rem)]">Turn public feedback into something people can actually use.</h1>
            <p className="mt-5 max-w-[60ch] text-[1.06rem] leading-8 text-slate-600">
              A clean frontend for citizens, planners, and admins to review policies, submit
              feedback, and track AI-assisted insights in one place.
            </p>
            <div className="mt-7 flex flex-wrap gap-3" id="cta">
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-green-700 px-5 font-bold text-white shadow-[0_16px_30px_rgba(22,163,74,0.22)] transition hover:-translate-y-0.5"
                to="/register"
              >
                Start free
              </Link>
              <a
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-green-700/20 bg-white/85 px-5 font-bold text-green-900 transition hover:-translate-y-0.5 hover:shadow"
                href="#features"
              >
                See features
              </a>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-3.5 max-[980px]:grid-cols-1" aria-label="Platform highlights">
              {stats.map((stat) => (
                <article
                  key={stat.label}
                  className="rounded-2xl border border-slate-300/40 bg-white/90 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur"
                >
                  <strong className="block text-2xl leading-none text-green-700">{stat.value}</strong>
                  <span className="mt-2 block text-sm text-slate-600">{stat.label}</span>
                </article>
              ))}
            </div>
          </div>

          <aside
            className="rounded-[1.85rem] border border-slate-300/40 bg-white/90 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur"
            aria-label="Product preview"
          >
            <div className="flex gap-2 pb-4">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            </div>
            <div className="rounded-3xl bg-[linear-gradient(160deg,rgba(22,163,74,0.08),rgba(255,255,255,0.96))] p-7">
              <p className="mb-3 inline-flex text-xs font-bold uppercase tracking-[0.04em] text-green-700">Live overview</p>
              <h2 className="m-0 text-[clamp(1.8rem,3vw,2.65rem)] font-extrabold leading-[1.05] tracking-[-0.04em] text-slate-900">Green by design. Clear by default.</h2>
              <ul className="mt-5 grid list-none gap-3.5 p-0">
                <li className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-500/15 bg-emerald-50/40 px-4 py-3.5">
                  <span className="font-semibold text-slate-700">Active policies</span>
                  <span className="font-extrabold text-green-700">12</span>
                </li>
                <li className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-500/15 bg-emerald-50/40 px-4 py-3.5">
                  <span className="font-semibold text-slate-700">Pending reviews</span>
                  <span className="font-extrabold text-green-700">4</span>
                </li>
                <li className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-500/15 bg-emerald-50/40 px-4 py-3.5">
                  <span className="font-semibold text-slate-700">AI confidence</span>
                  <span className="font-extrabold text-green-700">96%</span>
                </li>
              </ul>
            </div>
          </aside>
        </section>

        <section className="mx-auto w-[min(1120px,calc(100%-3rem))] py-10 max-[640px]:w-[calc(100%-1.75rem)]" id="features">
          <div className="mb-6 max-w-[760px]">
            <span className="mb-4 inline-flex items-center rounded-full bg-emerald-600/10 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.04em] text-green-700">Built for public service</span>
            <h2 className="m-0 text-[clamp(1.8rem,3vw,2.65rem)] font-extrabold leading-[1.05] tracking-[-0.04em] text-slate-900">Everything needed for a focused civic workflow.</h2>
          </div>
          <div className="grid grid-cols-3 gap-[18px] max-[980px]:grid-cols-1">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-3xl border border-slate-300/40 bg-white/90 p-[26px] shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur"
              >
                <div
                  className="h-[52px] w-[52px] rounded-[1.125rem] bg-gradient-to-br from-emerald-600/95 to-green-500/80 shadow-[0_16px_28px_rgba(16,185,129,0.2)]"
                  aria-hidden="true"
                />
                <h3 className="mb-2 mt-[18px] text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="m-0 leading-7 text-slate-600">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto w-[min(1120px,calc(100%-3rem))] pb-8 pt-10 max-[640px]:w-[calc(100%-1.75rem)]" id="workflow">
          <div className="mb-6 max-w-[640px]">
            <span className="mb-4 inline-flex items-center rounded-full bg-emerald-600/10 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.04em] text-green-700">Simple flow</span>
            <h2 className="m-0 text-[clamp(1.8rem,3vw,2.65rem)] font-extrabold leading-[1.05] tracking-[-0.04em] text-slate-900">From signup to analysis in three steps.</h2>
          </div>
          <div className="grid grid-cols-3 gap-[18px] max-[980px]:grid-cols-1">
            {steps.map((step, index) => (
              <article
                key={step}
                className="rounded-3xl border border-slate-300/40 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur"
              >
                <span className="mb-4 inline-flex font-extrabold tracking-[0.12em] text-green-700">0{index + 1}</span>
                <p className="m-0 leading-7 text-slate-700">{step}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/user" element={<UserLayout />}>
          <Route index element={<UserHome />} />
          <Route path="policies" element={<UserPolicies />} />
          <Route path="policies/:policyId" element={<UserPolicyDetails />} />
          <Route path="history" element={<UserHistory />} />
          <Route path="profile" element={<UserProfile />} />
        </Route>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="planners" element={<AdminPlanners />} />
          <Route path="citizens" element={<AdminCitizens />} />
          <Route path="feedback" element={<AdminFeedback />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
        <Route path="/planner" element={<PlannerLayout />}>
          <Route index element={<PlannerDashboard />} />
          <Route path="policies" element={<PlannerPolicies />} />
          <Route path="policies/:policyId" element={<PlannerPolicyEditor />} />
          <Route path="feedback" element={<PlannerFeedback />} />
          <Route path="analytics" element={<PlannerAnalytics />} />
          <Route path="profile" element={<PlannerProfile />} />
          <Route path="settings" element={<PlannerSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function LoginPage() {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setCredentials((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    if (!credentials.email || !credentials.password) {
      setError("Email and password are required.");
      return;
    }

    if (credentials.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitted(true);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-emerald-50/20 to-emerald-100/35 text-slate-900">
      <div className="pointer-events-none absolute -left-20 top-16 h-72 w-72 rounded-full bg-emerald-300/20 blur-2xl" />
      <div className="pointer-events-none absolute -right-24 bottom-16 h-72 w-72 rounded-full bg-green-400/15 blur-2xl" />

      <main className="relative z-10 mx-auto grid min-h-screen w-[min(1120px,calc(100%-3rem))] items-center gap-10 py-10 max-[960px]:grid-cols-1 max-[640px]:w-[calc(100%-1.75rem)]">
        <section className="rounded-[2rem] border border-emerald-700/10 bg-white/85 p-8 shadow-[0_28px_70px_rgba(15,23,42,0.12)] backdrop-blur max-[640px]:p-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-green-700">
            <span aria-hidden="true">&larr;</span>
            Back to home
          </Link>

          <div className="mt-5 flex items-center gap-3.5">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald-600 to-green-800 text-sm font-extrabold tracking-[0.08em] text-white">HV</span>
            <div>
              <p className="m-0 text-lg font-bold text-slate-900">HizbView</p>
              <p className="m-0 text-sm text-slate-600">Citizen Login</p>
            </div>
          </div>

          <h1 className="mt-6 text-[clamp(2rem,4vw,3rem)] font-extrabold leading-tight tracking-[-0.03em] text-slate-900">
            Welcome back to your civic dashboard.
          </h1>
          <p className="mt-4 max-w-[56ch] leading-7 text-slate-600">
            Log in to access active policies, submit feedback, and track your participation history
            on HizbView.
          </p>

          <div className="mt-7 grid gap-3 text-sm text-slate-700">
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
              <span className="h-2 w-2 rounded-full bg-green-600" />
              Secure JWT sessions (7-day validity)
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
              <span className="h-2 w-2 rounded-full bg-green-600" />
              Role-aware access for citizen, planner, and admin
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
              <span className="h-2 w-2 rounded-full bg-green-600" />
              Fast onboarding with OTP-verified accounts
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_22px_60px_rgba(15,23,42,0.11)] max-[640px]:p-6">
          <h2 className="m-0 text-2xl font-bold text-slate-900">Login</h2>
          <p className="mb-6 mt-2 text-sm text-slate-600">Enter your email and password to continue.</p>

          {error ? (
            <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          ) : null}

          {isSubmitted ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-medium text-emerald-800">
              Login form is valid. Next step: connect this submit action to <span className="font-bold">POST /api/auth/login</span>.
            </div>
          ) : null}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Email</span>
              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={credentials.email}
                onChange={handleChange}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Password</span>
              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                type="password"
                name="password"
                placeholder="Enter your password"
                value={credentials.password}
                onChange={handleChange}
              />
            </label>

            <div className="flex items-center justify-between gap-3 max-[460px]:flex-col max-[460px]:items-start">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  className="h-4 w-4 accent-emerald-600"
                  type="checkbox"
                  name="rememberMe"
                  checked={credentials.rememberMe}
                  onChange={handleChange}
                />
                Remember me
              </label>
              <button type="button" className="text-sm font-semibold text-green-700 transition hover:text-green-800">
                Forgot password?
              </button>
            </div>

            <button
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-green-700 px-5 font-bold text-white shadow-[0_16px_30px_rgba(22,163,74,0.22)] transition hover:-translate-y-0.5"
              type="submit"
            >
              Login
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-600">
            New to HizbView?{" "}
            <Link className="font-semibold text-green-700 hover:text-green-800" to="/register">
              Create an account
            </Link>
          </p>

          <p className="mt-3 text-center text-xs text-slate-500">
            For demo: {" "}
            <Link className="font-semibold text-emerald-700 hover:text-emerald-800" to="/user">
              Open user dashboard
            </Link>
            {" "}|{" "}
            <Link className="font-semibold text-green-700 hover:text-green-900" to="/planner">
              Open planner workspace
            </Link>
            {" "}|{" "}
            <Link className="font-semibold text-slate-700 hover:text-slate-900" to="/admin">
              Open admin console
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}

function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    phone: "+251",
    region: "",
    agree: false,
  });

  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    if (!formData.email || !formData.password || !formData.phone || !formData.region) {
      setError("Please fill in all required fields.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!formData.agree) {
      setError("You must agree to the terms to create an account.");
      return;
    }

    setIsSubmitted(true);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-emerald-50/20 to-emerald-100/35 text-slate-900">
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-emerald-300/20 blur-2xl" />
      <div className="pointer-events-none absolute -right-24 bottom-16 h-72 w-72 rounded-full bg-green-400/15 blur-2xl" />

      <main className="relative z-10 mx-auto grid min-h-screen w-[min(1120px,calc(100%-3rem))] items-center gap-10 py-10 max-[960px]:grid-cols-1 max-[640px]:w-[calc(100%-1.75rem)]">
        <section className="rounded-[2rem] border border-emerald-700/10 bg-white/85 p-8 shadow-[0_28px_70px_rgba(15,23,42,0.12)] backdrop-blur max-[640px]:p-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-green-700">
            <span aria-hidden="true">&larr;</span>
            Back to home
          </Link>

          <div className="mt-5 flex items-center gap-3.5">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald-600 to-green-800 text-sm font-extrabold tracking-[0.08em] text-white">HV</span>
            <div>
              <p className="m-0 text-lg font-bold text-slate-900">HizbView</p>
              <p className="m-0 text-sm text-slate-600">Citizen Registration</p>
            </div>
          </div>

          <h1 className="mt-6 text-[clamp(2rem,4vw,3rem)] font-extrabold leading-tight tracking-[-0.03em] text-slate-900">
            Create your account and start participating.
          </h1>
          <p className="mt-4 max-w-[56ch] leading-7 text-slate-600">
            Register with your email, password, phone number, and region. You will receive an OTP
            after signup to verify your account.
          </p>

          <div className="mt-7 grid gap-3 text-sm text-slate-700">
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
              <span className="h-2 w-2 rounded-full bg-green-600" />
              OTP verification enabled
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
              <span className="h-2 w-2 rounded-full bg-green-600" />
              Region-based policy access
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
              <span className="h-2 w-2 rounded-full bg-green-600" />
              Single account for app and analytics history
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_22px_60px_rgba(15,23,42,0.11)] max-[640px]:p-6">
          <h2 className="m-0 text-2xl font-bold text-slate-900">Register</h2>
          <p className="mb-6 mt-2 text-sm text-slate-600">All fields marked with * are required.</p>

          {error ? (
            <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          ) : null}

          {isSubmitted ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-medium text-emerald-800">
              Registration form is valid. Next step: connect this submit action to your backend
              endpoint at <span className="font-bold">POST /api/auth/register</span>.
            </div>
          ) : null}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Email *</span>
              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </label>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Password *</span>
                <input
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  type="password"
                  name="password"
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Confirm password *</span>
                <input
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  type="password"
                  name="confirmPassword"
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Phone *</span>
                <input
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  type="tel"
                  name="phone"
                  placeholder="+251912345678"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Region *</span>
                <input
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  type="text"
                  name="region"
                  placeholder="Addis Ababa"
                  value={formData.region}
                  onChange={handleChange}
                />
              </label>
            </div>

            <label className="mt-2 flex items-start gap-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              <input
                className="mt-0.5 h-4 w-4 accent-emerald-600"
                type="checkbox"
                name="agree"
                checked={formData.agree}
                onChange={handleChange}
              />
              I agree to HizbView's terms and confirm that my information is accurate.
            </label>

            <button
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-green-700 px-5 font-bold text-white shadow-[0_16px_30px_rgba(22,163,74,0.22)] transition hover:-translate-y-0.5"
              type="submit"
            >
              Create account
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link className="font-semibold text-green-700 hover:text-green-800" to="/login">
              Log in
            </Link>
          </p>

          <p className="mt-3 text-center text-xs text-slate-500">
            For demo: {" "}
            <Link className="font-semibold text-emerald-700 hover:text-emerald-800" to="/user">
              Open user dashboard
            </Link>
            {" "}|{" "}
            <Link className="font-semibold text-green-700 hover:text-green-900" to="/planner">
              Open planner workspace
            </Link>
            {" "}|{" "}
            <Link className="font-semibold text-slate-700 hover:text-slate-900" to="/admin">
              Open admin console
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}

export default App;