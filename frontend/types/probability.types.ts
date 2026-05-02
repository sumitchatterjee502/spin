/** Single outcome row in the probability editor (weights are percentages). */
export interface ProbabilityItem {
  prizeId: number | null;
  prizeName: string;
  weight: number;
  /** Stable key for list rendering (API may omit). */
  rowKey: string;
}

export type ProbabilityWireEntry = {
  prizeId: number | null;
  weight: number;
};

export type ProbabilityConfigFromApi = {
  campaignId: number;
  probabilities: Array<{
    prizeId: number | null;
    weight: number;
    prizeName?: string;
  }>;
};

export type SaveProbabilityConfigPayload = {
  campaignId: number;
  probabilities: ProbabilityWireEntry[];
};
