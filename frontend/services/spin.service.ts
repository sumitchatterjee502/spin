import axios from "axios";
import type { SpinResponse } from "@/types/spin";

const SPIN_API_BASE_URL = "http://localhost:3000";

type SpinRequestPayload = {
  participationId: number;
};

export async function spinWheel(participationId: number): Promise<SpinResponse> {
  const payload: SpinRequestPayload = { participationId };
  const { data } = await axios.post<SpinResponse>(`${SPIN_API_BASE_URL}/spin`, payload, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return data;
}

export function getSpinErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return "Something went wrong. Please try again.";
  }

  const status = error.response?.status;
  if (status === 400) return "Invalid request";
  if (status === 404) return "Participation not found";
  if (status === 409) return "You have already spun";
  if (status === 500) return "Server error. Please try again.";
  return "Something went wrong. Please try again.";
}
