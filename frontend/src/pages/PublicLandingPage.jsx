import {
  ArrowRight,
  BarChart3,
  Download,
  FileText,
  Globe2,
  Rocket,
  ShieldCheck,
  Vote,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { plannerApi } from "../api/planners";
import { publicApi } from "../api/public";
import { ErrorAlert } from "../components/ErrorAlert";
import { LoadingState } from "../components/LoadingState";
import { ETHIOPIAN_REGIONS, LANGUAGES } from "../constants/regions";
import { formatDate, getErrorMessage } from "../lib/format";
import { showToast } from "../lib/toast";

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  region: "",
  ageRange: "25-34",
  gender: "prefer-not-to-say",
  occupation: "government-employee",
  education: "bachelors",
  preferredLanguage: "en",
  languagesSpoken: "en",
  organization: "",
  reason: "",
  proofFile: null,
};

const AGE_RANGES = ["18-24", "25-34", "35-44", "45-54", "55+"];

const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
];

const OCCUPATIONS = [
  { value: "student", label: "Student" },
  { value: "farmer", label: "Farmer" },
  { value: "merchant", label: "Merchant" },
  { value: "government-employee", label: "Government Employee" },
  { value: "private-sector", label: "Private Sector" },
  { value: "unemployed", label: "Unemployed" },
  { value: "other", label: "Other" },
];

const EDUCATIONS = [
  { value: "no-formal", label: "No Formal Education" },
  { value: "primary", label: "Primary School" },
  { value: "secondary", label: "Secondary School" },
  { value: "diploma", label: "Diploma" },
  { value: "bachelors", label: "Bachelor's Degree" },
  { value: "postgraduate", label: "Postgraduate Degree" },
];

const LANGUAGE_OPTIONS = LANGUAGES.filter((language) => language.value !== "all");

const APP_DOWNLOAD_URL = import.meta.env.VITE_MOBILE_APP_URL || "#download-app";

const navigationItems = [
  { label: "Overview", href: "#overview" },
  { label: "Planner access", href: "#planner-request" },
  { label: "Download", href: "#download-app" },
];

function approximateCount(value, fallback = "10+") {
  if (!Number.isFinite(value) || value <= 0) return fallback;
  const rounded = Math.max(5, Math.round(value / 5) * 5);
  return `${rounded}+`;
}

function SentimentBar({ policy }) {
  const total = policy.sentiment.positive + policy.sentiment.negative + policy.sentiment.neutral;
  if (!total) {
    return <p className="text-xs text-slate-500">No public sentiment data yet.</p>;
  }

  const positive = Math.round((policy.sentiment.positive / total) * 100);
  const neutral = Math.round((policy.sentiment.neutral / total) * 100);
  const negative = Math.max(0, 100 - positive - neutral);

  return (
    <div className="space-y-2">
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="flex h-full w-full">
          <div className="bg-emerald-500" style={{ width: `${positive}%` }} />
          <div className="bg-amber-400" style={{ width: `${neutral}%` }} />
          <div className="bg-rose-500" style={{ width: `${negative}%` }} />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
          Positive {approximateCount(policy.sentiment.positive, "5+")}
        </span>
        <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">
          Neutral {approximateCount(policy.sentiment.neutral, "5+")}
        </span>
        <span className="rounded-full bg-rose-50 px-2 py-1 text-rose-700">
          Negative {approximateCount(policy.sentiment.negative, "5+")}
        </span>
      </div>
    </div>
  );
}

export function PublicLandingPage() {
  const [landingData, setLandingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(initialForm);
  const proofFileRef = useRef(null);

  useEffect(() => {
    let active = true;

    async function loadLanding() {
      setLoading(true);
      setError("");
      try {
        const result = await publicApi.getLandingData();
        if (active) {
          setLandingData(result);
        }
      } catch (err) {
        if (active) {
          setError(getErrorMessage(err, "Failed to load public dashboard"));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadLanding();
    return () => {
      active = false;
    };
  }, []);

  const summary = useMemo(
    () =>
      landingData?.summary || {
        closedPolicies: 0,
        totalVotes: 0,
        totalComments: 0,
      },
    [landingData?.summary],
  );

  const policies = landingData?.policies || [];

  const topHighlights = useMemo(
    () => [
      { label: "Closed policies", value: approximateCount(summary.closedPolicies, "10+"), icon: Vote },
      { label: "Votes counted", value: approximateCount(summary.totalVotes, "50+"), icon: BarChart3 },
      { label: "Public comments", value: approximateCount(summary.totalComments, "150+"), icon: FileText },
      { label: "Live policy results", value: "Always visible", icon: ShieldCheck },
    ],
    [summary],
  );

  async function submitPlannerRequest(event) {
    event.preventDefault();
    setError("");

    if (
      !form.fullName.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.region.trim() ||
      !form.ageRange.trim() ||
      !form.gender.trim() ||
      !form.occupation.trim() ||
      !form.education.trim() ||
      !form.preferredLanguage.trim() ||
      !form.languagesSpoken.trim() ||
      !form.organization.trim() ||
      !form.reason.trim() ||
      !form.proofFile
    ) {
      setError("Please complete every planner request field and upload a supporting proof file before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("applicantType", "nonCitizen");
      formData.append("fullName", form.fullName.trim());
      formData.append("email", form.email.trim());
      formData.append("phone", form.phone.trim());
      formData.append("region", form.region);
      formData.append("ageRange", form.ageRange);
      formData.append("gender", form.gender);
      formData.append("occupation", form.occupation);
      formData.append("education", form.education);
      formData.append("preferredLanguage", form.preferredLanguage);
      formData.append("languagesSpoken", form.languagesSpoken);
      formData.append("organization", form.organization.trim());
      formData.append("reason", form.reason.trim());
      formData.append("proofFile", form.proofFile);

      await plannerApi.requestPlanner(formData);
      setForm(initialForm);
      if (proofFileRef.current) {
        proofFileRef.current.value = "";
      }
      showToast("success", "Planner request submitted.");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to submit planner request"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(13,148,136,0.14),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(245,158,11,0.10),_transparent_26%),linear-gradient(180deg,_#fffdf8_0%,_#f8f4eb_100%)] text-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <ErrorAlert message={error} />

        <header className="rounded-[2rem] border border-slate-200 bg-white/90 px-5 py-4 text-slate-950 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur sm:px-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700">
                <Globe2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-teal-700">Civic Platform</p>
                <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                  Open governance, made simple.
                </h1>
              </div>
            </div>

            <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-600">
              {navigationItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="rounded-full border border-slate-200 px-3 py-1.5 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </header>

        {loading ? (
          <div className="mt-6">
            <LoadingState label="Loading public dashboard" />
          </div>
        ) : (
          <>
            <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4" id="overview">
              {topHighlights.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.05)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                        <p className="mt-2 text-3xl font-black text-slate-950">{item.value}</p>
                      </div>
                      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-50 text-teal-700">
                        <Icon className="h-5 w-5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </section>

            <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_25px_80px_rgba(15,23,42,0.07)]">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-700">Closed vote analytics</p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight">Top 10 closed policies</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                    Browse the closed policies and view their result summaries directly on this page.
                  </p>
                </div>
              </div>

              <div className="mt-6" id="analytics">
                <div className="space-y-4">
                  {policies.length ? (
                    policies.map((policy) => {
                      return (
                        <article
                          key={policy.id}
                          className="w-full rounded-[1.6rem] border border-slate-200 bg-slate-50/80 p-4 text-left transition hover:border-slate-300 hover:bg-white"
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[11px] font-bold text-white">Closed policy</span>
                                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500 shadow-sm">Result available</span>
                              </div>
                              <p className="mt-3 truncate text-lg font-bold text-slate-950">{policy.title}</p>
                              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{policy.description}</p>
                              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                {policy.policyCode} • {policy.targetRegions?.join(", ") || "All regions"} • Closed {formatDate(policy.endDate)}
                              </p>
                            </div>

                            <div className="grid min-w-[180px] gap-2 text-sm">
                              <div className="rounded-2xl bg-white px-3 py-2 shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Votes</p>
                                <p className="mt-1 text-lg font-black text-slate-950">{approximateCount(policy.voteCount, "5+")}</p>
                              </div>
                              <div className="rounded-2xl bg-white px-3 py-2 shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Comments</p>
                                <p className="mt-1 text-lg font-black text-slate-950">{approximateCount(policy.commentCount, "10+")}</p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                            <SentimentBar policy={policy} />
                            <Link
                              to={`/public/policies/${policy.id}/analytics`}
                              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-teal-800"
                            >
                              <BarChart3 className="h-4 w-4" />
                              Analytics
                            </Link>
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-slate-500">
                      No closed policies are available yet.
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="mt-6 space-y-6">
              <section
                id="planner-request"
                className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]"
              >
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-teal-700">
                  <Rocket className="h-3.5 w-3.5" />
                  Request planner access
                </div>
                <h2 className="mt-3 text-2xl font-black tracking-tight">Become a planner without creating an account.</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  No account creation first. Send your request and an admin can review it.
                </p>

                <form onSubmit={submitPlannerRequest} className="mt-5 space-y-3">
                  <input
                    value={form.fullName}
                    onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-teal-600"
                    placeholder="Full name"
                    autoComplete="name"
                  />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-teal-600"
                    placeholder="Email address"
                    autoComplete="email"
                  />
                  <input
                    type="tel"
                    inputMode="tel"
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-teal-600"
                    placeholder="Phone number (+251 9XX XXX XXX)"
                    autoComplete="tel"
                  />
                  <select
                    value={form.region}
                    onChange={(event) => setForm((current) => ({ ...current, region: event.target.value }))}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-teal-600"
                  >
                    <option value="">Select region</option>
                    {ETHIOPIAN_REGIONS.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                  <div className="grid gap-3 md:grid-cols-2">
                    <select
                      value={form.ageRange}
                      onChange={(event) => setForm((current) => ({ ...current, ageRange: event.target.value }))}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-teal-600"
                    >
                      <option value="">Select age range</option>
                      {AGE_RANGES.map((ageRange) => (
                        <option key={ageRange} value={ageRange}>
                          {ageRange}
                        </option>
                      ))}
                    </select>
                    <select
                      value={form.gender}
                      onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-teal-600"
                    >
                      <option value="">Select gender</option>
                      {GENDERS.map((gender) => (
                        <option key={gender.value} value={gender.value}>
                          {gender.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <select
                      value={form.occupation}
                      onChange={(event) => setForm((current) => ({ ...current, occupation: event.target.value }))}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-teal-600"
                    >
                      <option value="">Select occupation</option>
                      {OCCUPATIONS.map((occupation) => (
                        <option key={occupation.value} value={occupation.value}>
                          {occupation.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={form.education}
                      onChange={(event) => setForm((current) => ({ ...current, education: event.target.value }))}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-teal-600"
                    >
                      <option value="">Select education</option>
                      {EDUCATIONS.map((education) => (
                        <option key={education.value} value={education.value}>
                          {education.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <select
                      value={form.preferredLanguage}
                      onChange={(event) => setForm((current) => ({ ...current, preferredLanguage: event.target.value }))}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-teal-600"
                    >
                      <option value="">Preferred language</option>
                      {LANGUAGE_OPTIONS.map((language) => (
                        <option key={language.value} value={language.value}>
                          {language.label}
                        </option>
                      ))}
                    </select>
                    <input
                      value={form.languagesSpoken}
                      onChange={(event) => setForm((current) => ({ ...current, languagesSpoken: event.target.value }))}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-teal-600"
                      placeholder="Languages spoken"
                    />
                  </div>
                  <input
                    value={form.organization}
                    onChange={(event) => setForm((current) => ({ ...current, organization: event.target.value }))}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-teal-600"
                    placeholder="Organization"
                  />
                  <input
                    type="file"
                    ref={proofFileRef}
                    required
                    aria-label="Supporting proof file"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,image/*,application/pdf"
                    onChange={(event) => setForm((current) => ({ ...current, proofFile: event.target.files?.[0] || null }))}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none file:mr-4 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:text-sm file:font-bold file:text-teal-700 focus:border-teal-600"
                  />
                  <textarea
                    rows="5"
                    value={form.reason}
                    onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-teal-600"
                    placeholder="Reason"
                  />

                  <button
                    disabled={submitting}
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
                  >
                    <ArrowRight className="h-4 w-4" />
                    {submitting ? "Submitting..." : "Send planner request"}
                  </button>
                </form>
              </section>

              <section
                id="download-app"
                className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]"
              >
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-teal-700">
                  <Download className="h-3.5 w-3.5" />
                  Download the app
                </div>
                <h2 className="mt-3 text-2xl font-black tracking-tight">Take the platform with you.</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Use the mobile app for faster access to updates, policies, and engagement tools.
                </p>
                <a
                  href={APP_DOWNLOAD_URL}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  Download mobile app
                  <ArrowRight className="h-4 w-4" />
                </a>
              </section>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
