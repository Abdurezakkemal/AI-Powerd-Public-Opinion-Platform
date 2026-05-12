import { ArrowLeft, Lightbulb, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { policyApi } from "../api/policies";
import { ErrorAlert } from "../components/ErrorAlert";
import { LoadingState } from "../components/LoadingState";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { ETHIOPIAN_REGIONS, POLL_TYPES, POLICY_TOPICS } from "../constants/regions";
import { getErrorMessage, toDateInput, toIsoFromDateInput } from "../lib/format";

const policySchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200, "Title must be 200 characters or less"),
    description: z.string().trim().min(1, "Description is required").max(2000, "Description must be 2000 characters or less"),
    targetRegions: z.array(z.string()).min(1, "Select at least one target region"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    pollType: z.enum(["rating", "binary", "multipleChoice", "likert", "approval", "rankedChoice"]),
    pollOptionsText: z.string().optional(),
    maxSelections: z.coerce.number().min(1).optional(),
    likertLabelsText: z.string().optional(),
    rankedChoiceMaxRank: z.coerce.number().min(1).optional(),
    topicsText: z.string().optional(),
    relevanceFactors: z.object({
      women: z.boolean().optional(),
      youth: z.boolean().optional(),
      farmers: z.boolean().optional(),
      urban: z.boolean().optional(),
      rural: z.boolean().optional(),
      privateSector: z.boolean().optional(),
      government: z.boolean().optional(),
    }),
    citizenAnalyticsVisibility: z.object({
      showResults: z.boolean().optional(),
      showBreakdown: z.boolean().optional(),
      showComments: z.boolean().optional(),
      showSentiment: z.boolean().optional(),
      allowTimeFilter: z.boolean().optional(),
    }),
  })
  .refine((value) => new Date(value.startDate) < new Date(value.endDate), {
    path: ["endDate"],
    message: "End date must be after start date",
  });

const emptyValues = {
  title: "",
  description: "",
  targetRegions: [],
  startDate: "",
  endDate: "",
  pollType: "rating",
  pollOptionsText: "",
  maxSelections: 1,
  likertLabelsText: "Very Dissatisfied\nDissatisfied\nNeutral\nSatisfied\nVery Satisfied",
  rankedChoiceMaxRank: 3,
  topicsText: "",
  relevanceFactors: {
    women: false,
    youth: false,
    farmers: false,
    urban: false,
    rural: false,
    privateSector: false,
    government: false,
  },
  citizenAnalyticsVisibility: {
    showResults: true,
    showBreakdown: false,
    showComments: false,
    showSentiment: false,
    allowTimeFilter: false,
  },
};

function optionsToText(options = []) {
  return options.map((option) => [option.id, option.text, option.shortCode].filter(Boolean).join("|")).join("\n");
}

function textToOptions(value = "") {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [id, text, shortCode] = line.split("|").map((part) => part?.trim());
      return {
        id: id || `opt${index + 1}`,
        text: text || id || `Option ${index + 1}`,
        shortCode: shortCode || String(index + 1),
      };
    });
}

function listFromText(value = "") {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function PolicyFormPage({ mode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = mode === "edit";
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [createdCode, setCreatedCode] = useState("");
  const [policy, setPolicy] = useState(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({ defaultValues: emptyValues });

  const selectedRegions = watch("targetRegions") || [];
  const pollType = watch("pollType");
  const topicsText = watch("topicsText") || "";
  const canEdit = !isEdit || policy?.status === "draft";

  useEffect(() => {
    let active = true;

    async function loadPolicy() {
      if (!isEdit) return;
      setLoading(true);
      setServerError("");
      try {
        const result = await policyApi.get(id);
        if (!active) return;
        setPolicy(result);
        reset({
          title: result.title || "",
          description: result.description || "",
          targetRegions: result.targetRegions || [],
          startDate: toDateInput(result.startDate),
          endDate: toDateInput(result.endDate),
          pollType: result.pollType || "rating",
          pollOptionsText: optionsToText(result.pollOptions || []),
          maxSelections: result.maxSelections || 1,
          likertLabelsText: (result.likertLabels || emptyValues.likertLabelsText.split("\n")).join("\n"),
          rankedChoiceMaxRank: result.rankedChoiceMaxRank || 3,
          topicsText: (result.topics || []).join(", "),
          relevanceFactors: { ...emptyValues.relevanceFactors, ...(result.relevanceFactors || {}) },
          citizenAnalyticsVisibility: {
            ...emptyValues.citizenAnalyticsVisibility,
            ...(result.citizenAnalyticsVisibility || {}),
          },
        });
      } catch (err) {
        if (active) setServerError(getErrorMessage(err, "Failed to load policy"));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPolicy();
    return () => {
      active = false;
    };
  }, [id, isEdit, reset]);

  const title = useMemo(() => (isEdit ? "Edit policy" : "Create policy"), [isEdit]);

  const toggleRegion = (region) => {
    const current = new Set(selectedRegions);
    if (current.has(region)) {
      current.delete(region);
    } else {
      current.add(region);
    }
    setValue("targetRegions", Array.from(current), { shouldValidate: true });
  };

  const submit = async (values) => {
    setServerError("");
    setCreatedCode("");
    const parsed = policySchema.safeParse(values);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        setError(issue.path[0], { message: issue.message });
      });
      return;
    }

    const pollOptions = textToOptions(parsed.data.pollOptionsText);
    if (["multipleChoice", "rankedChoice"].includes(parsed.data.pollType) && pollOptions.length === 0) {
      setError("pollOptionsText", { message: "Add at least one option as id|label|shortCode" });
      return;
    }
    const likertLabels = listFromText(parsed.data.likertLabelsText);
    if (parsed.data.pollType === "likert" && likertLabels.length !== 5) {
      setError("likertLabelsText", { message: "Likert policies need exactly 5 labels" });
      return;
    }

    const payload = {
      title: parsed.data.title,
      description: parsed.data.description,
      targetRegions: parsed.data.targetRegions,
      startDate: toIsoFromDateInput(parsed.data.startDate),
      endDate: toIsoFromDateInput(parsed.data.endDate, true),
      pollType: parsed.data.pollType,
      pollOptions,
      maxSelections: parsed.data.maxSelections,
      likertLabels,
      rankedChoiceMaxRank: parsed.data.rankedChoiceMaxRank,
      relevanceFactors: parsed.data.relevanceFactors,
      citizenAnalyticsVisibility: parsed.data.citizenAnalyticsVisibility,
      topics: listFromText(parsed.data.topicsText),
    };

    try {
      setSubmitting(true);
      if (isEdit) {
        await policyApi.update(id, payload);
        navigate("/policies", { replace: true });
      } else {
        const result = await policyApi.create(payload);
        setCreatedCode(result.policyCode);
        navigate(`/policies/${result.id}/edit`, { replace: true });
      }
    } catch (err) {
      setServerError(getErrorMessage(err, "Failed to save policy"));
    } finally {
      setSubmitting(false);
    }
  };

  const suggestTopics = async () => {
    setServerError("");
    const titleValue = watch("title") || "";
    const descriptionValue = watch("description") || "";
    const text = `${titleValue} ${descriptionValue}`.trim();
    if (text.length < 10) {
      setServerError("Add a title and description before requesting topic suggestions.");
      return;
    }
    try {
      const result = await policyApi.suggestTopics(text);
      const suggested = (result.topics || []).map((item) => item.topic);
      const merged = Array.from(new Set([...listFromText(topicsText), ...suggested]));
      setValue("topicsText", merged.join(", "), { shouldValidate: true });
    } catch (err) {
      setServerError(getErrorMessage(err, "Failed to suggest topics"));
    }
  };

  if (loading) return <LoadingState label="Loading policy" />;

  return (
    <div>
      <PageHeader
        title={title}
        description="Draft policies can be edited before publishing. The backend generates the policy code after create."
        actions={
          <Link className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50" to="/policies">
            <ArrowLeft className="h-4 w-4" />
            Back to policies
          </Link>
        }
      />

      <div className="space-y-3">
        <ErrorAlert message={serverError} />
        {createdCode ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            Policy created. Generated code: <span className="font-mono">{createdCode}</span>
          </div>
        ) : null}
        {policy ? (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            <span className="font-semibold text-slate-950">{policy.policyCode}</span>
            <StatusBadge status={policy.status} />
            {!canEdit ? <span>Only draft policies can be edited.</span> : null}
          </div>
        ) : null}
      </div>

      <form className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm" onSubmit={handleSubmit(submit)}>
        <fieldset disabled={!canEdit || submitting} className="grid gap-5">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Title</span>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              {...register("title")}
            />
            {errors.title ? <span className="mt-1 block text-xs font-semibold text-rose-600">{errors.title.message}</span> : null}
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Description</span>
            <textarea
              rows="6"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              {...register("description")}
            />
            {errors.description ? (
              <span className="mt-1 block text-xs font-semibold text-rose-600">{errors.description.message}</span>
            ) : null}
          </label>

          <div>
            <span className="text-sm font-semibold text-slate-700">Target Regions</span>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {ETHIOPIAN_REGIONS.map((region) => (
                <label key={region} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-teal-700"
                    checked={selectedRegions.includes(region)}
                    onChange={() => toggleRegion(region)}
                  />
                  {region}
                </label>
              ))}
            </div>
            {errors.targetRegions ? (
              <span className="mt-1 block text-xs font-semibold text-rose-600">{errors.targetRegions.message}</span>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Start Date</span>
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                {...register("startDate")}
              />
              {errors.startDate ? (
                <span className="mt-1 block text-xs font-semibold text-rose-600">{errors.startDate.message}</span>
              ) : null}
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">End Date</span>
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                {...register("endDate")}
              />
              {errors.endDate ? <span className="mt-1 block text-xs font-semibold text-rose-600">{errors.endDate.message}</span> : null}
            </label>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1fr)]">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Poll Type</span>
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                {...register("pollType")}
              >
                {POLL_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Topics</span>
              <div className="mt-1 flex gap-2">
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                  placeholder="Health, Water Supply"
                  {...register("topicsText")}
                />
                <button
                  type="button"
                  onClick={suggestTopics}
                  className="inline-flex items-center gap-2 rounded-lg border border-teal-200 px-3 py-2 text-sm font-bold text-teal-700 hover:bg-teal-50"
                >
                  <Lightbulb className="h-4 w-4" />
                  AI
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {POLICY_TOPICS.slice(0, 10).map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    onClick={() => {
                      const merged = Array.from(new Set([...listFromText(topicsText), topic]));
                      setValue("topicsText", merged.join(", "), { shouldValidate: true });
                    }}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </label>
          </div>

          {["multipleChoice", "rankedChoice"].includes(pollType) ? (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(12rem,0.35fr)]">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Poll Options</span>
                <textarea
                  rows="5"
                  placeholder={"opt1|Option one|1\nopt2|Option two|2"}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-sm outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                  {...register("pollOptionsText")}
                />
                {errors.pollOptionsText ? <span className="mt-1 block text-xs font-semibold text-rose-600">{errors.pollOptionsText.message}</span> : null}
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">{pollType === "rankedChoice" ? "Max Rank" : "Max Selections"}</span>
                <input
                  type="number"
                  min="1"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                  {...register(pollType === "rankedChoice" ? "rankedChoiceMaxRank" : "maxSelections")}
                />
              </label>
            </div>
          ) : null}

          {pollType === "likert" ? (
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Likert Labels</span>
              <textarea
                rows="5"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                {...register("likertLabelsText")}
              />
              {errors.likertLabelsText ? <span className="mt-1 block text-xs font-semibold text-rose-600">{errors.likertLabelsText.message}</span> : null}
            </label>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-2">
            <fieldset className="rounded-lg border border-slate-200 p-4">
              <legend className="px-1 text-sm font-bold text-slate-800">Relevance Factors</legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {Object.keys(emptyValues.relevanceFactors).map((key) => (
                  <label key={key} className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input type="checkbox" className="h-4 w-4 accent-teal-700" {...register(`relevanceFactors.${key}`)} />
                    {key}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="rounded-lg border border-slate-200 p-4">
              <legend className="px-1 text-sm font-bold text-slate-800">Citizen Analytics Visibility</legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {Object.keys(emptyValues.citizenAnalyticsVisibility).map((key) => (
                  <label key={key} className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input type="checkbox" className="h-4 w-4 accent-teal-700" {...register(`citizenAnalyticsVisibility.${key}`)} />
                    {key}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        </fieldset>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={!canEdit || submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {submitting ? "Saving..." : isEdit ? "Save changes" : "Create policy"}
          </button>
        </div>
      </form>
    </div>
  );
}
