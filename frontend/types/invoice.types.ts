export type InvoiceStatus = "APPROVED" | "PROCESSING" | "DISPATCHED" | "DELIVERED";

export interface InvoiceEntry {
  participationId: number;
  name: string;
  phone: string;
  email: string;
  shopLocation: string;
  prizeName: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  verifiedAt: string;
  updatedAt: string;
}

export interface InvoiceFilters {
  status?: InvoiceStatus | "";
  storeLocation?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface InvoiceSummary {
  approved: number;
  processing: number;
  dispatched: number;
  delivered: number;
}

export interface InvoiceListResult {
  entries: InvoiceEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface UpdateInvoiceStatusPayload {
  status: Exclude<InvoiceStatus, "APPROVED">;
}
