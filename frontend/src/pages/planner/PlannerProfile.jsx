import { useState } from "react";

export default function PlannerProfile() {
  const [profile, setProfile] = useState({
    username: "Planner User",
    email: "planner.north@hizbview.et",
    phone: "+251911234567",
    region: "North Cluster",
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="m-0 text-2xl font-bold text-slate-900">Planner profile</h2>
        <p className="mt-1 text-sm text-slate-600">Manage your planner account details.</p>
      </div>

      <form className="grid gap-4 rounded-xl border border-slate-200 p-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-slate-700">Username</span>
          <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={profile.username} onChange={(e) => setProfile((p) => ({ ...p, username: e.target.value }))} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-slate-700">Email</span>
          <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-slate-700">Phone</span>
          <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-slate-700">Region</span>
          <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={profile.region} onChange={(e) => setProfile((p) => ({ ...p, region: e.target.value }))} />
        </label>
        <div className="md:col-span-2 flex gap-2">
          <button type="button" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Save profile</button>
          <button type="button" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Change password</button>
        </div>
      </form>
    </div>
  );
}
