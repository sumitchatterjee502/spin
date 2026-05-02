"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import ProbabilitySummary from "@/components/probability/ProbabilitySummary";
import ProbabilityTable from "@/components/probability/ProbabilityTable";
import { listAdminPrizes } from "@/services/prize-config.service";
import {
  getProbabilityConfig,
  saveProbabilityConfig,
  snapProbabilityWeightsToIntegers,
} from "@/services/probability.service";
import type { ProbabilityItem } from "@/types/probability.types";
import { getProbabilityApiErrorMessage } from "@/utils/probabilityApiError";

const LOSE_DISPLAY = "Better luck next time";
const TOTAL_TARGET = 100;
const TOTAL_EPSILON = 0.0001;

function rowKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `p-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toPrizeNumber(id: string): number | null {
  const n = Number(id);
  return Number.isFinite(n) ? n : null;
}

function buildDefaultRowsFromPrizes(
  prizes: { id: string; name: string }[]
): ProbabilityItem[] {
  const wins: ProbabilityItem[] = [];
  for (const p of prizes) {
    const pid = toPrizeNumber(p.id);
    if (pid === null) continue;
    wins.push({
      prizeId: pid,
      prizeName: p.name,
      weight: 0,
      rowKey: rowKey(),
    });
  }
  wins.push({
    prizeId: null,
    prizeName: LOSE_DISPLAY,
    weight: TOTAL_TARGET,
    rowKey: rowKey(),
  });
  return wins;
}

function mergeConfigWithPrizes(
  cfg: NonNullable<Awaited<ReturnType<typeof getProbabilityConfig>>>,
  prizeNames: Map<number, string>
): ProbabilityItem[] {
  const out: ProbabilityItem[] = [];
  let hasLose = false;

  for (const row of cfg.probabilities) {
    const rk = rowKey();
    if (row.prizeId === null) {
      hasLose = true;
      out.push({
        prizeId: null,
        prizeName: row.prizeName ?? LOSE_DISPLAY,
        weight: row.weight,
        rowKey: rk,
      });
    } else {
      const name =
        row.prizeName ??
        prizeNames.get(row.prizeId) ??
        `Prize #${row.prizeId}`;
      out.push({
        prizeId: row.prizeId,
        prizeName: name,
        weight: row.weight,
        rowKey: rk,
      });
    }
  }

  if (!hasLose) {
    out.push({
      prizeId: null,
      prizeName: LOSE_DISPLAY,
      weight: 0,
      rowKey: rowKey(),
    });
  }

  return sortRowsWinThenLose(out);
}

function sortRowsWinThenLose(rows: ProbabilityItem[]): ProbabilityItem[] {
  const wins = rows.filter((r) => r.prizeId !== null);
  const lose = rows.filter((r) => r.prizeId === null);
  return [...wins, ...lose];
}

/** Add prize rows from catalog that are not already present (weight 0). */
function mergeCatalogPrizes(
  items: ProbabilityItem[],
  prizes: { id: string; name: string }[]
): ProbabilityItem[] {
  const existing = new Set(
    items.filter((i) => i.prizeId !== null).map((i) => i.prizeId as number)
  );
  const extra: ProbabilityItem[] = [];
  for (const p of prizes) {
    const pid = toPrizeNumber(p.id);
    if (pid === null || existing.has(pid)) continue;
    existing.add(pid);
    extra.push({
      prizeId: pid,
      prizeName: p.name,
      weight: 0,
      rowKey: rowKey(),
    });
  }
  if (extra.length === 0) return items;
  const wins = [...items.filter((i) => i.prizeId !== null), ...extra];
  const lose = items.filter((i) => i.prizeId === null);
  return [...wins, ...lose];
}

export type ProbabilityCampaignEditorProps = {
  campaignId: number;
  campaignTitle?: string;
};

export default function ProbabilityCampaignEditor({
  campaignId,
  campaignTitle,
}: ProbabilityCampaignEditorProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<ProbabilityItem[]>([]);
  const [autoBalanceLose, setAutoBalanceLose] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    await Promise.resolve();
    setLoading(true);
    try {
      const [cfg, prizes] = await Promise.all([
        getProbabilityConfig(campaignId, accessToken),
        listAdminPrizes(accessToken),
      ]);

      const nameById = new Map<number, string>();
      for (const p of prizes) {
        const n = toPrizeNumber(p.id);
        if (n !== null) nameById.set(n, p.name);
      }

      if (cfg && cfg.probabilities.length > 0) {
        setItems(
          snapProbabilityWeightsToIntegers(
            mergeCatalogPrizes(mergeConfigWithPrizes(cfg, nameById), prizes)
          )
        );
      } else {
        setItems(buildDefaultRowsFromPrizes(prizes));
      }
    } catch (e) {
      toast.error(
        getProbabilityApiErrorMessage(e, "Failed to load probability configuration.")
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [campaignId, accessToken]);

  useEffect(() => {
    if (status !== "authenticated" || !accessToken) return;
    void Promise.resolve().then(() => {
      void load();
    });
  }, [status, accessToken, load]);

  const totalWeight = useMemo(
    () => items.reduce((s, r) => s + (Number.isFinite(r.weight) ? r.weight : 0), 0),
    [items]
  );

  const remainingWeight = TOTAL_TARGET - totalWeight;

  const validation = useMemo(() => {
    const messages: string[] = [];
    const rowErrors: Record<string, string> = {};

    const loseRows = items.filter((i) => i.prizeId === null);
    const winRows = items.filter((i) => i.prizeId !== null);

    if (loseRows.length === 0) {
      messages.push("A “lose” outcome (non-winning) is required.");
    } else if (loseRows.length > 1) {
      messages.push("Only one lose outcome row is allowed.");
    }

    if (winRows.length === 0) {
      messages.push("At least one prize (winning) outcome is required.");
    }

    const winWeightSum = winRows.reduce((s, r) => s + r.weight, 0);
    if (winRows.length > 0 && winWeightSum <= 0) {
      messages.push("At least one winning outcome must have a weight greater than 0.");
    }

    for (const r of items) {
      if (r.weight < 0) {
        rowErrors[r.rowKey] = "Weight cannot be negative.";
      }
    }

    if (Math.abs(totalWeight - TOTAL_TARGET) > TOTAL_EPSILON) {
      messages.push(`Total weight must equal ${TOTAL_TARGET}% (currently ${Math.round(totalWeight * 1000) / 1000}%).`);
    }

    const isValid = messages.length === 0 && Object.keys(rowErrors).length === 0;
    return { messages, rowErrors, isValid };
  }, [items, totalWeight]);

  const rebalanceLose = useCallback((rows: ProbabilityItem[]): ProbabilityItem[] => {
    const wins = rows.filter((i) => i.prizeId !== null);
    const lose = rows.find((i) => i.prizeId === null);
    if (!lose) return rows;
    const sumWins = wins.reduce((s, r) => s + r.weight, 0);
    const newLoseWeight = Math.max(0, TOTAL_TARGET - sumWins);
    return rows.map((r) =>
      r.rowKey === lose.rowKey ? { ...r, weight: newLoseWeight } : r
    );
  }, []);

  const handleWeightChange = useCallback(
    (rowKey: string, nextWeight: number) => {
      setItems((prev) => {
        let updated = prev.map((r) =>
          r.rowKey === rowKey ? { ...r, weight: nextWeight } : r
        );
        if (autoBalanceLose) {
          updated = rebalanceLose(updated);
        }
        return updated;
      });
    },
    [autoBalanceLose, rebalanceLose]
  );

  const handleAutoBalanceToggle = useCallback((checked: boolean) => {
    setAutoBalanceLose(checked);
  }, []);

  useEffect(() => {
    if (!autoBalanceLose) return;
    void Promise.resolve().then(() => {
      setItems((prev) => rebalanceLose(prev));
    });
  }, [autoBalanceLose, rebalanceLose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      toast.error("You must be signed in to save.");
      return;
    }
    if (!validation.isValid) {
      toast.error("Fix validation errors before saving.");
      return;
    }

    const lose = items.find((i) => i.prizeId === null);
    if (!lose) {
      toast.error("Lose outcome row is missing.");
      return;
    }

    setSaving(true);
    try {
      await saveProbabilityConfig(
        {
          campaignId,
          probabilities: items.map((r) => ({
            prizeId: r.prizeId,
            weight: r.weight,
          })),
        },
        accessToken
      );
      toast.success("Probability configuration saved");
      router.push("/admin/probability-config");
    } catch (err) {
      toast.error(
        getProbabilityApiErrorMessage(err, "Failed to save probability configuration.")
      );
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || (loading && status === "authenticated")) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white p-8 text-slate-600">
        <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
        <p className="text-sm">Loading probability configuration…</p>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-6 py-8 text-center text-sm text-amber-900">
        Sign in to edit probability settings.
      </div>
    );
  }

  const tableDisabled = saving;

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-sm text-slate-500">
            <Link href="/admin/probability-config" className="hover:text-slate-800">
              Probability config
            </Link>
            <span className="mx-1.5 text-slate-400">/</span>
            <span className="text-slate-600">Campaign {campaignId}</span>
          </div>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">
            Spin probability weights
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Campaign:{" "}
            <span className="font-medium text-slate-800">
              {campaignTitle ?? `ID ${campaignId}`}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/probability-config"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Back
          </Link>
          <button
            type="submit"
            disabled={!validation.isValid || saving}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            Save configuration
          </button>
        </div>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">
          Probability configuration
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Weights are percentages. They must sum to exactly {TOTAL_TARGET}% across all
          outcomes.
        </p>
        <div className="mt-4">
          <ProbabilityTable
            items={items}
            onWeightChange={handleWeightChange}
            rowErrors={validation.rowErrors}
            disabled={tableDisabled}
            loseWeightLocked={autoBalanceLose}
          />
          {autoBalanceLose ? (
            <p className="mt-2 text-xs text-slate-500">
              “Better luck” weight is computed as {TOTAL_TARGET}% minus the sum of prize
              weights.
            </p>
          ) : null}
        </div>
      </section>

      <ProbabilitySummary
        totalWeight={totalWeight}
        remainingWeight={remainingWeight}
        isValid={validation.isValid}
        messages={validation.messages}
        autoBalanceLose={autoBalanceLose}
        onAutoBalanceChange={handleAutoBalanceToggle}
        disabled={tableDisabled}
      />
    </form>
  );
}
