import { isValidElement } from "react";
import { Link } from "react-router-dom";

export function EmptyState({ title, description, action }) {
  const actionNode = isValidElement(action)
    ? action
    : action?.label && action?.to
      ? (
        <Link
          to={action.to}
          className="inline-flex items-center rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white hover:bg-teal-800"
        >
          {action.label}
        </Link>
        )
      : null;

  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
      <h3 className="text-lg font-bold text-slate-950">{title}</h3>
      {description ? <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">{description}</p> : null}
      {actionNode ? <div className="mt-5">{actionNode}</div> : null}
    </div>
  );
}
