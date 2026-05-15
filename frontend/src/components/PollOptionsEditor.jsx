import { Plus, Trash2 } from "lucide-react";

export function PollOptionsEditor({ options, onChange, maxOptions = 10 }) {
  const addOption = () => {
    const newId = `opt${options.length + 1}`;
    onChange([
      ...options,
      { id: newId, text: "", shortCode: String(options.length + 1) },
    ]);
  };

  const updateOption = (index, field, value) => {
    const updated = [...options];
    updated[index][field] = value;
    onChange(updated);
  };

  const removeOption = (index) => {
    const updated = [...options];
    updated.splice(index, 1);
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {options.map((opt, idx) => (
        <div
          key={idx}
          className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 p-3"
        >
          <div className="flex-1 min-w-[100px]">
            <label className="block text-xs font-semibold text-slate-500">
              ID
            </label>
            <input
              type="text"
              value={opt.id}
              onChange={(e) => updateOption(idx, "id", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-teal-600"
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-semibold text-slate-500">
              Label
            </label>
            <input
              type="text"
              value={opt.text}
              onChange={(e) => updateOption(idx, "text", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-teal-600"
              required
            />
          </div>
          <div className="flex-1 min-w-[80px]">
            <label className="block text-xs font-semibold text-slate-500">
              Short code
            </label>
            <input
              type="text"
              value={opt.shortCode}
              onChange={(e) => updateOption(idx, "shortCode", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-teal-600"
            />
          </div>
          <button
            type="button"
            onClick={() => removeOption(idx)}
            className="mb-1 rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      {options.length < maxOptions && (
        <button
          type="button"
          onClick={addOption}
          className="inline-flex items-center gap-2 rounded-lg border border-teal-200 px-3 py-1.5 text-sm font-semibold text-teal-700 hover:bg-teal-50"
        >
          <Plus className="h-4 w-4" />
          Add option
        </button>
      )}
      {options.length === maxOptions && (
        <p className="text-xs text-amber-600">
          Maximum {maxOptions} options reached.
        </p>
      )}
    </div>
  );
}
