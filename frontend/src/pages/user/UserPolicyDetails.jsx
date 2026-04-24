import { Link, useParams } from "react-router-dom";
import { mockPolicies } from "../../constants/mock/policies";

export default function UserPolicyDetails() {
  const { policyId } = useParams();
  const policy = mockPolicies.find((item) => item.id === policyId);

  if (!policy) {
    return (
      <div className="space-y-3">
        <h2 className="m-0 text-2xl font-bold text-slate-900">Policy not found</h2>
        <p className="text-slate-600">The selected policy does not exist in the current mock dataset.</p>
        <Link to="/user/policies" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
          Back to policies
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link to="/user/policies" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
        &larr; Back to policies
      </Link>

      <div>
        <p className="m-0 text-sm font-semibold uppercase tracking-wide text-emerald-700">{policy.policyCode}</p>
        <h2 className="m-0 mt-1 text-2xl font-bold text-slate-900">{policy.title}</h2>
      </div>

      <p className="text-slate-700">{policy.description}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="m-0 text-sm text-slate-500">Region</p>
          <p className="m-0 mt-1 font-semibold text-slate-900">{policy.region}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="m-0 text-sm text-slate-500">Voting deadline</p>
          <p className="m-0 mt-1 font-semibold text-slate-900">{policy.endDate}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="m-0 text-sm text-slate-500">Average rating</p>
          <p className="m-0 mt-1 font-semibold text-slate-900">{policy.averageRating}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="m-0 text-sm text-slate-500">Total votes</p>
          <p className="m-0 mt-1 font-semibold text-slate-900">{policy.totalVotes}</p>
        </div>
      </div>

      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5">
        <h3 className="m-0 text-lg font-semibold text-emerald-900">Feedback form comes next</h3>
        <p className="mb-0 mt-2 text-sm text-emerald-800">
          Next implementation step is the rating + comment form wired to POST /api/feedback.
        </p>
      </div>
    </div>
  );
}
