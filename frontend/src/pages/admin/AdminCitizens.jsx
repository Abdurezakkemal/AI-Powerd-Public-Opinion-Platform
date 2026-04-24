import { useState } from "react";
import { citizens as citizensSeed } from "../../constants/mock/admin";

export default function AdminCitizens() {
  const [citizens, setCitizens] = useState(citizensSeed);

  const toggleCitizen = (id) => {
    setCitizens((previous) =>
      previous.map((citizen) =>
        citizen.id === id ? { ...citizen, active: !citizen.active } : citizen,
      ),
    );
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="m-0 text-2xl font-bold text-slate-900">Citizen management</h2>
        <p className="mt-1 text-sm text-slate-600">Review citizen accounts and toggle account status.</p>
      </div>

      <div className="grid gap-3">
        {citizens.map((citizen) => (
          <article key={citizen.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="m-0 text-base font-semibold text-slate-900">{citizen.email}</p>
                <p className="mt-1 text-xs text-slate-500">Region: {citizen.region} • Created: {citizen.createdAt} • Verified: {citizen.verified ? "Yes" : "No"}</p>
              </div>
              <button
                className={[
                  "rounded-lg px-3 py-1.5 text-xs font-semibold",
                  citizen.active ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700",
                ].join(" ")}
                type="button"
                onClick={() => toggleCitizen(citizen.id)}
              >
                {citizen.active ? "Deactivate" : "Activate"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
