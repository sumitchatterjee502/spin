import axios from "axios";
import { extractResponseData } from "@/lib/api/standardResponse";
import type {
  ProbabilityConfigFromApi,
  SaveProbabilityConfigPayload,
} from "@/types/probability.types";
import axiosInstance from "@/utils/axiosInstance";

function authHeaders(accessToken?: string | null) {
  return accessToken != null && accessToken !== ""
    ? { Authorization: `Bearer ${accessToken}` }
    : {};
}

function parsePrizeId(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "string" && raw.trim() === "") return null;
  if (typeof raw === "string" && raw.toLowerCase() === "null") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function parseWeight(raw: unknown): number {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Converts percentage weights to non-negative integers that sum to 100
 * (largest-remainder), so validators expecting `@IsInt()` accept the payload.
 */
function allocateIntegerPercentages(weights: number[]): number[] {
  const n = weights.length;
  if (n === 0) return [];
  const w = weights.map((x) => Math.max(0, Number(x)));
  const sum = w.reduce((a, b) => a + b, 0);
  const scaled =
    sum > 0 ? w.map((x) => (x / sum) * 100) : w.map(() => 100 / n);

  const floors = scaled.map((x) => Math.floor(x + 1e-9));
  let r = 100 - floors.reduce((a, b) => a + b, 0);
  const out = [...floors];
  const frac = scaled.map((x, i) => ({
    i,
    f: x - Math.floor(x + 1e-9),
  }));

  if (r > 0) {
    frac.sort((a, b) => b.f - a.f);
    for (let k = 0; k < r; k++) out[frac[k % n]!.i] += 1;
  } else if (r < 0) {
    frac.sort((a, b) => a.f - b.f);
    for (let k = 0; k < -r; k++) {
      const i = frac[k % n]!.i;
      out[i] = Math.max(0, out[i]! - 1);
    }
  }
  return out;
}

export function snapProbabilityWeightsToIntegers<
  T extends { weight: number },
>(list: T[]): T[] {
  const ints = allocateIntegerPercentages(list.map((p) => p.weight));
  return list.map((p, i) => ({ ...p, weight: ints[i] ?? 0 }));
}

function normalizeProbabilityConfigBody(
  body: unknown,
  campaignIdNum: number
): ProbabilityConfigFromApi {
  const payload = extractResponseData(body);
  const root =
    payload !== null && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : {};

  const cidRaw = root.campaignId;
  const campaignId =
    typeof cidRaw === "number" && Number.isFinite(cidRaw)
      ? cidRaw
      : Number(cidRaw) || campaignIdNum;

  const listRaw = root.probabilities;
  const probabilities = Array.isArray(listRaw)
    ? listRaw.map((row) => {
        const r = row as Record<string, unknown>;
        return {
          prizeId: parsePrizeId(r.prizeId),
          weight: parseWeight(r.weight),
          prizeName:
            typeof r.prizeName === "string" && r.prizeName.trim()
              ? r.prizeName.trim()
              : undefined,
        };
      })
    : [];

  return { campaignId, probabilities };
}

/**
 * `GET /admin/probability-config/:campaignId`
 * Returns `null` when no config exists (404).
 */
export async function getProbabilityConfig(
  campaignId: number,
  accessToken?: string | null
): Promise<ProbabilityConfigFromApi | null> {
  try {
    const { data } = await axiosInstance.get<unknown>(
      `/admin/probability-config/${encodeURIComponent(String(campaignId))}`,
      { headers: authHeaders(accessToken) }
    );
    return normalizeProbabilityConfigBody(data, campaignId);
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.status === 404) {
      return null;
    }
    throw e;
  }
}

/**
 * `POST /admin/probability-config`
 *
 * ```json
 * { "campaignId": 1, "probabilities": [{ "prizeId": 1, "weight": 5 }, { "prizeId": null, "weight": 85 }] }
 * ```
 */
export async function saveProbabilityConfig(
  data: SaveProbabilityConfigPayload,
  accessToken?: string | null
): Promise<void> {
  const rawWeights = data.probabilities.map((p) => Number(p.weight));
  const intWeights = allocateIntegerPercentages(rawWeights);

  await axiosInstance.post(
    "/admin/probability-config",
    {
      campaignId: data.campaignId,
      probabilities: data.probabilities.map((p, i) => ({
        prizeId: p.prizeId,
        weight: intWeights[i] ?? 0,
      })),
    },
    { headers: authHeaders(accessToken) }
  );
}
