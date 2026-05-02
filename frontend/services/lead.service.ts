import axios from "axios";
import axiosInstance from "@/utils/axiosInstance";
import { extractResponseData } from "@/lib/api/standardResponse";
import type { LeadFieldErrors, LeadGiftItem } from "@/types/lead.types";

export type LeadSubmitResult = {
  participationId: number | null;
};

export async function submitLead(formData: FormData): Promise<LeadSubmitResult> {
  const { data } = await axiosInstance.post<unknown>("/leads/submit", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  const payload = extractResponseData(data);
  const body =
    payload !== null && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : {};

  const rawParticipationId = body.participationId;
  const parsedId =
    typeof rawParticipationId === "number"
      ? rawParticipationId
      : typeof rawParticipationId === "string" && rawParticipationId.trim() !== ""
        ? Number(rawParticipationId)
        : Number.NaN;

  return {
    participationId: Number.isFinite(parsedId) ? parsedId : null,
  };
}

function normalizeLeadGiftItems(raw: unknown): LeadGiftItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const r = item as Record<string, unknown>;
      return {
        prizeId: Number(r.prizeId),
        prizeName: String(r.prizeName ?? "").trim(),
        stock: Number(r.stock ?? 0),
        inStock: Boolean(r.inStock),
      } as LeadGiftItem;
    })
    .filter((x) => Number.isFinite(x.prizeId) && x.prizeName.length > 0);
}

export async function getLeadGiftsByQr(qrCode: string): Promise<LeadGiftItem[]> {
  const qr = qrCode.trim();
  if (!qr) return [];
  const { data } = await axiosInstance.get<unknown>("/leads/gifts", {
    params: { qrCode: qr },
  });
  const payload = extractResponseData(data);
  if (payload !== null && typeof payload === "object" && !Array.isArray(payload)) {
    const gifts = (payload as Record<string, unknown>).gifts;
    return normalizeLeadGiftItems(gifts);
  }
  return [];
}

export async function getLeadGiftsByCampaignId(campaignId: number): Promise<LeadGiftItem[]> {
  if (!Number.isFinite(campaignId)) return [];
  const { data } = await axiosInstance.get<unknown>("/leads/gifts", {
    params: { campaignId },
  });
  const payload = extractResponseData(data);
  if (payload !== null && typeof payload === "object" && !Array.isArray(payload)) {
    const gifts = (payload as Record<string, unknown>).gifts;
    return normalizeLeadGiftItems(gifts);
  }
  return [];
}

const leadFieldKeys: Array<keyof LeadFieldErrors> = [
  "name",
  "phone",
  "email",
  "address",
  "receiptNumber",
  "shopLocation",
  "file",
  "termsAccepted",
];

export function getLeadSubmitFieldErrors(error: unknown): LeadFieldErrors | null {
  if (!axios.isAxiosError(error) || error.response?.status !== 400) {
    return null;
  }
  const payload = extractResponseData(error.response.data);
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const body = payload as Record<string, unknown>;
  const source =
    body.errors && typeof body.errors === "object" && !Array.isArray(body.errors)
      ? (body.errors as Record<string, unknown>)
      : body;

  const nextErrors: LeadFieldErrors = {};
  for (const field of leadFieldKeys) {
    const value = source[field];
    if (typeof value === "string" && value.trim()) {
      nextErrors[field] = value.trim();
    }
  }

  return Object.keys(nextErrors).length > 0 ? nextErrors : null;
}

export function getLeadSubmitErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return "Unable to submit right now. Please try again.";
  }
  const status = error.response?.status;
  if (status === 400) return "Please correct highlighted fields and try again.";
  if (status === 409) return "Duplicate receipt detected.";
  if (status === 413) return "File too large. Please upload a file up to 5MB.";
  if (status === 415) return "Invalid file type. Use JPG, PNG, WEBP, or PDF.";
  if (status === 500) return "Server error. Please try again shortly.";
  return "Unable to submit right now. Please try again.";
}
