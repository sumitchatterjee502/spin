export interface LeadFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  receiptNumber: string;
  shopLocation: string;
  file: File | null;
  termsAccepted: boolean;
}

export type LeadFieldErrors = Partial<
  Record<keyof LeadFormData, string>
>;

export interface LeadGiftItem {
  prizeId: number;
  prizeName: string;
  stock: number;
  inStock: boolean;
}
