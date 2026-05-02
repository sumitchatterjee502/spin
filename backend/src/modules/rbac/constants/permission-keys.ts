/**
 * Application permission keys (resource:action).
 * Keep in sync with DB seed / admin assignments.
 */
export const PermissionKey = {
  RbacManage: 'rbac:manage',

  CampaignRead: 'campaign:read',
  CampaignWrite: 'campaign:write',
  CampaignDelete: 'campaign:delete',

  ProductRead: 'product:read',
  ProductWrite: 'product:write',

  ParticipationRead: 'participation:read',
  SpinExecute: 'spin:execute',

  FraudReview: 'fraud:review',
  VerificationRead: 'invoice-validation:read',
  FulfillmentProcess: 'invoice-validation:read',
  NotificationSend: 'notification:send',
} as const;

export type PermissionKey = (typeof PermissionKey)[keyof typeof PermissionKey];

export const ALL_PERMISSION_KEYS = Object.values(
  PermissionKey,
) as PermissionKey[];
