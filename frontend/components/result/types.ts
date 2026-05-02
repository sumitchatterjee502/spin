export interface SpinResult {
  participationId: number;
  result: "WIN" | "LOSE";
  prize?: {
    id: number;
    name: string;
  } | null;
  message: string;
}
