import axios from "axios";

const GENERIC_ERROR = "Something went wrong. Please try again.";

function normalizeMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const message = (payload as { message?: unknown }).message;
  if (typeof message === "string" && message.trim()) return message;
  if (Array.isArray(message) && message.length) {
    return message.map(String).filter(Boolean).join(", ");
  }
  if (message && typeof message === "object") {
    const parts = Object.values(message as Record<string, unknown>)
      .flat()
      .map(String)
      .filter(Boolean);
    if (parts.length) return parts.join(", ");
  }
  return null;
}

export function getCampaignApiErrorMessage(
  error: unknown,
  fallback = GENERIC_ERROR
): string {
  if (!axios.isAxiosError(error)) return fallback;

  const status = error.response?.status;
  const body = error.response?.data;

  if (status === 400) {
    return normalizeMessage(body) ?? "Please check the form and try again.";
  }
  if (status === 404) return "Campaign not found.";
  if (status === 409) return "Duplicate campaign.";
  if (status === 500) return GENERIC_ERROR;

  return normalizeMessage(body) ?? fallback;
}
