export type SpinApiResult = "WIN" | "LOSE";

export type SpinPrize = {
  id: number;
  name: string;
};

export type SpinResponse = {
  participationId: number;
  result: SpinApiResult;
  prize: SpinPrize | null;
  wheelPosition: number;
  stopAngle: number;
  alreadySpun: boolean;
  message: string;
};
