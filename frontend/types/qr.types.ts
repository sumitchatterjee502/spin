/** Single QR → campaign mapping row from admin APIs. */
export interface QRMapping {
  id: number;
  /** Public token embedded in scan URLs (not internal DB ids). */
  code: string;
  campaignId: number;
  campaignName?: string;
  redirectUrl: string;
  createdAt: string;
}

/** `POST /admin/qr-mappings` — server assigns code + redirect URL. */
export type CreateQRMappingAutoPayload = {
  campaignId: number;
};

/** `POST /admin/qr-mappings` — client supplies opaque code. */
export type CreateQRMappingCustomPayload = {
  code: string;
  campaignId: number;
};

/** `PATCH /admin/qr-mappings/:id` */
export type UpdateQRMappingPayload = {
  campaignId: number;
};

/** Create form → parent (routes to correct POST body). */
export type QRMappingsCreateFormSubmit =
  | { kind: "auto"; campaignId: number }
  | { kind: "custom"; code: string; campaignId: number };

/** Edit form → parent */
export type QRMappingsEditFormSubmit = {
  campaignId: number;
};
