/** Wire identifiers as returned/sent by `/admin/*` prize-config APIs. */
export type PrizeConfigId = string;

export type AdminCatalogProduct = {
  id: PrizeConfigId;
  name: string;
};

export type AdminCatalogPrize = {
  id: PrizeConfigId;
  name: string;
};

/** UI row for product ↔ prize mapping (includes display names). */
export type ProductPrizeMappingRow = {
  rowKey: string;
  productId: PrizeConfigId;
  productName: string;
  prizeId: PrizeConfigId;
  prizeName: string;
};

export type DistributionLimits = {
  maxPerDay: number;
  maxPerUser: number;
  totalLimit: number;
};

export type PrizeInventoryWire = {
  prizeId: PrizeConfigId;
  stock: number;
  /** When backend returns remaining quantity. */
  remainingStock?: number;
};

export type PrizeConfigWireMapping = {
  productId: PrizeConfigId;
  prizeId: PrizeConfigId;
};

export type SavePrizeConfigPayload = {
  campaignId: PrizeConfigId;
  mappings: PrizeConfigWireMapping[];
  inventory: { prizeId: PrizeConfigId; stock: number }[];
  distributionLimits: DistributionLimits;
};

export type PrizeConfigFromApi = {
  campaignId: PrizeConfigId;
  mappings: PrizeConfigWireMapping[];
  inventory: PrizeInventoryWire[];
  distributionLimits: DistributionLimits;
};
