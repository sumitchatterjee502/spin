export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED" | "DISPATCHED" | "DELIVERED" | "RECEIVED" | "PROCESSING";

export interface VerificationEntry {
  id: number;
  name: string;
  phone: string;
  email: string;
  prizeName?: string;
  result?: "WIN" | "LOSE";
  shopLocation: string;
  receiptNumber: string;
  fileUrl: string;
  status: VerificationStatus;
  createdAt: string;
  purchaseDate?: string;
  remarks?: string;
  invoiceNumber?: string;
}

export interface VerificationFilters {
  status?: VerificationStatus | "";
  storeLocation?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "name" | "status";
  sortOrder?: "ASC" | "DESC";
}

export interface VerificationListResult {
  entries: VerificationEntry[];
  total: number;
  page: number;
  limit: number;
}

export type VerificationActionType = "APPROVE" | "REJECT";
