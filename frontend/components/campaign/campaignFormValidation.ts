import type { CampaignFormValues } from "@/types/campaign.types";

function parseYmd(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export function validateCampaignForm(
  values: CampaignFormValues
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.name.trim()) {
    errors.name = "Campaign name is required.";
  }

  if (!values.startDate) {
    errors.startDate = "Start date is required.";
  }

  if (!values.endDate) {
    errors.endDate = "End date is required.";
  }

  if (values.startDate && values.endDate) {
    const start = parseYmd(values.startDate);
    const end = parseYmd(values.endDate);
    if (start && end && end <= start) {
      errors.endDate = "End date must be after start date.";
    }
  }

  if (!values.productIds.length) {
    errors.products = "Select at least one product.";
  }

  return errors;
}

export function serializeCampaignFormBaseline(v: CampaignFormValues): string {
  return JSON.stringify({
    name: v.name.trim(),
    startDate: v.startDate,
    endDate: v.endDate,
    status: v.status,
    productIds: [...v.productIds].sort((a, b) => a - b),
  });
}
