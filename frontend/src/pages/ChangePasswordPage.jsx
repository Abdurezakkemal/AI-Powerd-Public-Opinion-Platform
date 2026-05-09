import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { PageHeader } from "../components/PageHeader";
import { ErrorAlert } from "../components/ErrorAlert";
import { userApi } from "../api/user";
import { getErrorMessage } from "../lib/format";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Confirm password is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data) => {
    setError("");
    setSuccess(false);

    const parsed = changePasswordSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      setError(firstError.message);
      return;
    }

    try {
      setSubmitting(true);
      await userApi.changePassword(data.currentPassword, data.newPassword);
      setSuccess(true);
      reset();
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to change password"));
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div>
        <PageHeader
          title="Password changed"
          description="Your password has been successfully updated."
        />

        <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mx-auto max-w-md">
            <div className="flex flex-col items-center text-center">
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-emerald-100">
                <Lock className="h-6 w-6 text-emerald-700" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-950">Password updated</h2>
              <p className="mt-2 text-sm text-slate-600">
                Your password has been changed successfully. You'll be redirected to the dashboard.
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Change password"
        description="Update your account password. Choose a strong password with a mix of characters."
      />

      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mx-auto max-w-md">
          <ErrorAlert message={error} />

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Current password</span>
              <input
                type="password"
                {...register("currentPassword")}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={submitting}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100 disabled:bg-slate-100"
              />
              {errors.currentPassword && (
                <p className="mt-1 text-sm text-rose-600">{errors.currentPassword.message}</p>
              )}
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">New password</span>
              <input
                type="password"
                {...register("newPassword")}
                placeholder="••••••••"
                autoComplete="new-password"
                disabled={submitting}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100 disabled:bg-slate-100"
              />
              {errors.newPassword && (
                <p className="mt-1 text-sm text-rose-600">{errors.newPassword.message}</p>
              )}
              <p className="mt-1 text-xs text-slate-500">Minimum 6 characters</p>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Confirm new password</span>
              <input
                type="password"
                {...register("confirmPassword")}
                placeholder="••••••••"
                autoComplete="new-password"
                disabled={submitting}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100 disabled:bg-slate-100"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-rose-600">{errors.confirmPassword.message}</p>
              )}
            </label>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-50"
              >
                {submitting ? "Changing..." : "Change password"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                disabled={submitting}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
