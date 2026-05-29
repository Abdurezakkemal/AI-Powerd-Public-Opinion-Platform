import { showToast } from "../lib/toast";

export function ErrorAlert({ message }) {
  if (!message) return null;
  // emit a global toast and don't render inline
  try {
    showToast("error", message);
  } catch (e) {
    /* ignore */
  }
  return null;
}
