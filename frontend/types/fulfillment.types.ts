export type FulfillmentStatus = "APPROVED" | "CONFIRMED" | "DISPATCHED" | "DELIVERED";
export type SlaStatus = "WITHIN_SLA" | "BREACHED" | "NOT_STARTED";

export interface FulfillmentFilters {
  status?: FulfillmentStatus | "";
  storeLocation?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface FulfillmentEntry {
  participationId: number;
  name: string;
  prize: string;
  invoiceNumber: string;
  status: FulfillmentStatus;
  slaStatus: SlaStatus;
  address: string;
  trackingId: string;
  deliveryPartner: string;
  storeLocation: string;
  remarks: string;
  confirmedAt: string;
  dispatchDate: string;
  deliveryDate: string;
  updatedAt: string;
  isLocked: boolean;
}

export interface FulfillmentMeta {
  total: number;
  page: number;
  limit: number;
}

export interface FulfillmentListResult {
  data: FulfillmentEntry[];
  meta: FulfillmentMeta;
}

export interface ConfirmWinnerPayload {
  address: string;
  remarks: string;
}

export interface DispatchPrizePayload {
  dispatchDate: string;
  trackingId?: string;
  deliveryPartner?: string;
}
