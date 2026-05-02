"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import DistributionLimitsForm from "@/components/prize-config/DistributionLimitsForm";
import PrizeInventoryTable from "@/components/prize-config/PrizeInventoryTable";
import ProductPrizeMappingTable from "@/components/prize-config/ProductPrizeMappingTable";
import {
  createAdminPrize,
  getPrizeConfigByCampaignId,
  listAdminPrizes,
  listAdminProducts,
  savePrizeConfig,
} from "@/services/prize-config.service";
import type {
  AdminCatalogPrize,
  AdminCatalogProduct,
  DistributionLimits,
  ProductPrizeMappingRow,
} from "@/types/prize-config.types";
import { getPrizeConfigApiErrorMessage } from "@/utils/prizeConfigApiError";

export type PrizeConfigPageProps = {
  campaignId: string;
  mode: "create" | "edit";
  /** Optional display name (e.g. campaign title). */
  campaignTitle?: string;
};

function rowKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `row-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function mergeById<T extends { id: string }>(existing: T[], extra: T[]): T[] {
  const map = new Map<string, T>();
  for (const x of existing) map.set(x.id, x);
  for (const x of extra) {
    if (!map.has(x.id)) map.set(x.id, x);
  }
  return Array.from(map.values());
}

type FieldErrors = {
  mappings?: string;
  distribution?: Partial<Record<keyof DistributionLimits, string>>;
  inventory?: Record<string, string>;
};

function validate(
  mappings: ProductPrizeMappingRow[],
  inventoryStock: Record<string, string>,
  limits: DistributionLimits
): FieldErrors {
  const errors: FieldErrors = {};
  if (mappings.length === 0) {
    errors.mappings = "Add at least one product–prize mapping.";
  }
  const prizeIds = [...new Set(mappings.map((m) => m.prizeId))];
  const inv: Record<string, string> = {};
  for (const pid of prizeIds) {
    const raw = inventoryStock[pid];
    if (raw === undefined || String(raw).trim() === "") {
      inv[pid] = "Stock is required.";
      continue;
    }
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) {
      inv[pid] = "Stock must be a number greater than or equal to 0.";
    }
  }
  if (Object.keys(inv).length) errors.inventory = inv;

  const dist: Partial<Record<keyof DistributionLimits, string>> = {};
  if (limits.maxPerUser > limits.totalLimit) {
    dist.maxPerUser = "Max wins per user cannot exceed the total distribution cap.";
  }
  if (Object.keys(dist).length) errors.distribution = dist;

  return errors;
}

export default function PrizeConfigPage({
  campaignId,
  mode,
  campaignTitle,
}: PrizeConfigPageProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;

  const [bootLoading, setBootLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const [products, setProducts] = useState<AdminCatalogProduct[]>([]);
  const [prizes, setPrizes] = useState<AdminCatalogPrize[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [debouncedProductSearch, setDebouncedProductSearch] = useState("");
  const [productsLoading, setProductsLoading] = useState(false);

  const [mappings, setMappings] = useState<ProductPrizeMappingRow[]>([]);
  const [inventoryStock, setInventoryStock] = useState<Record<string, string>>(
    {}
  );
  const [remainingByPrize, setRemainingByPrize] = useState<
    Record<string, number>
  >({});

  const [limits, setLimits] = useState<DistributionLimits>({
    maxPerDay: 0,
    maxPerUser: 0,
    totalLimit: 0,
  });

  useEffect(() => {
    const t = window.setTimeout(
      () => setDebouncedProductSearch(productSearch.trim()),
      350
    );
    return () => window.clearTimeout(t);
  }, [productSearch]);

  useEffect(() => {
    if (status !== "authenticated" || !accessToken) return;
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      setProductsLoading(true);
      try {
        const list = await listAdminProducts(
          accessToken,
          debouncedProductSearch || undefined
        );
        if (!cancelled) {
          setProducts((prev) => mergeById(prev, list));
        }
      } catch (e) {
        if (!cancelled) {
          toast.error(
            getPrizeConfigApiErrorMessage(e, "Failed to load admin products.")
          );
          setProducts([]);
        }
      } finally {
        if (!cancelled) setProductsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, accessToken, debouncedProductSearch]);

  useEffect(() => {
    if (status !== "authenticated" || !accessToken) return;
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      setBootLoading(true);
      try {
        const [prizeList, cfg] = await Promise.all([
          listAdminPrizes(accessToken),
          getPrizeConfigByCampaignId(campaignId, accessToken),
        ]);
        if (cancelled) return;

        setPrizes(prizeList);

        if (!cfg) {
          setMappings([]);
          setInventoryStock({});
          setRemainingByPrize({});
          setLimits({ maxPerDay: 0, maxPerUser: 0, totalLimit: 0 });
          return;
        }

        const productById = new Map<string, AdminCatalogProduct>();
        const prizeById = new Map<string, AdminCatalogPrize>();
        for (const p of prizeList) prizeById.set(p.id, p);

        const initialProducts = await listAdminProducts(accessToken, undefined);
        if (cancelled) return;
        for (const p of initialProducts) productById.set(p.id, p);

        const nextMappings: ProductPrizeMappingRow[] = cfg.mappings.map(
          (m) => ({
            rowKey: rowKey(),
            productId: m.productId,
            productName:
              productById.get(m.productId)?.name ?? `Product (${m.productId})`,
            prizeId: m.prizeId,
            prizeName: prizeById.get(m.prizeId)?.name ?? `Prize (${m.prizeId})`,
          })
        );

        const missingProducts: AdminCatalogProduct[] = [];
        const missingPrizes: AdminCatalogPrize[] = [];
        for (const row of nextMappings) {
          if (!productById.has(row.productId)) {
            missingProducts.push({
              id: row.productId,
              name: row.productName,
            });
          }
          if (!prizeById.has(row.prizeId)) {
            missingPrizes.push({ id: row.prizeId, name: row.prizeName });
          }
        }

        setPrizes((prev) => mergeById(prev, [...prizeList, ...missingPrizes]));
        setProducts((prev) => mergeById(prev, [...initialProducts, ...missingProducts]));

        setMappings(nextMappings);

        const stock: Record<string, string> = {};
        const rem: Record<string, number> = {};
        for (const row of cfg.inventory) {
          stock[row.prizeId] = String(row.stock);
          if (typeof row.remainingStock === "number") {
            rem[row.prizeId] = row.remainingStock;
          }
        }
        setInventoryStock(stock);
        setRemainingByPrize(rem);
        setLimits(cfg.distributionLimits);
      } catch (e) {
        if (!cancelled) {
          toast.error(
            getPrizeConfigApiErrorMessage(e, "Failed to load prize configuration.")
          );
        }
      } finally {
        if (!cancelled) {
          setBootLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, accessToken, campaignId]);

  useEffect(() => {
    if (status !== "authenticated" || !accessToken) return;
    const prizeIds = [...new Set(mappings.map((m) => m.prizeId))];
    void Promise.resolve().then(() => {
      setInventoryStock((prev) => {
        const next = { ...prev };
        for (const pid of prizeIds) {
          if (next[pid] === undefined) next[pid] = "";
        }
        return next;
      });
    });
  }, [mappings, status, accessToken]);

  const mappingDuplicate = useMemo(() => {
    const seen = new Set<string>();
    for (const m of mappings) {
      if (seen.has(m.productId)) return true;
      seen.add(m.productId);
    }
    return false;
  }, [mappings]);

  const inventoryRows = useMemo(() => {
    const prizeIds = [...new Set(mappings.map((m) => m.prizeId))];
    return prizeIds.map((prizeId) => {
      const name =
        mappings.find((m) => m.prizeId === prizeId)?.prizeName ??
        prizes.find((p) => p.id === prizeId)?.name ??
        prizeId;
      return {
        prizeId,
        prizeName: name,
        stockInput: inventoryStock[prizeId] ?? "",
        remainingStock: remainingByPrize[prizeId],
      };
    });
  }, [mappings, inventoryStock, remainingByPrize, prizes]);

  const fieldErrors = useMemo(
    () => validate(mappings, inventoryStock, limits),
    [mappings, inventoryStock, limits]
  );

  const handleCreatePrize = useCallback(
    async (name: string) => {
      if (!accessToken) throw new Error("Not signed in.");
      const created = await createAdminPrize({ name }, accessToken);
      setPrizes((prev) => mergeById(prev, [created]));
      toast.success(`Prize “${created.name}” created.`);
      return created;
    },
    [accessToken]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    if (!accessToken) {
      toast.error("You must be signed in to save.");
      return;
    }
    const errs = validate(mappings, inventoryStock, limits);
    if (
      errs.mappings ||
      errs.inventory ||
      (errs.distribution && Object.keys(errs.distribution).length)
    ) {
      toast.error("Please fix the validation errors.");
      return;
    }
    if (mappingDuplicate) {
      toast.error("Each product can only map to one prize.");
      return;
    }

    const prizeIds = [...new Set(mappings.map((m) => m.prizeId))];
    const payload = {
      campaignId,
      mappings: mappings.map((m) => ({
        productId: m.productId,
        prizeId: m.prizeId,
      })),
      inventory: prizeIds.map((prizeId) => ({
        prizeId,
        stock: Number(inventoryStock[prizeId]),
      })),
      distributionLimits: limits,
    };

    setSubmitting(true);
    try {
      await savePrizeConfig(payload, accessToken);
      toast.success("Prize configuration saved.");
      router.push("/admin/prize-config");
    } catch (err) {
      toast.error(getPrizeConfigApiErrorMessage(err, "Failed to save configuration."));
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || (bootLoading && status === "authenticated")) {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white p-8 text-slate-600">
        <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
        <p className="text-sm">Loading prize configuration…</p>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-6 py-8 text-center text-sm text-amber-900">
        Sign in to manage prize configuration.
      </div>
    );
  }

  const duplicateMsg = mappingDuplicate
    ? "Each product may only appear once. Adjust or remove duplicate rows."
    : undefined;

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/admin/prize-config" className="hover:text-slate-800">
              Prize config
            </Link>
            <span aria-hidden>/</span>
            <span>{mode === "create" ? "Create" : "Edit"}</span>
          </div>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">
            {mode === "create" ? "New prize configuration" : "Edit prize configuration"}
          </h1>
          <p className="text-sm text-slate-600">
            Campaign:{" "}
            <span className="font-medium text-slate-800">
              {campaignTitle ?? `ID ${campaignId}`}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/prize-config"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            Save configuration
          </button>
        </div>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <header className="mb-4 border-b border-slate-100 pb-3">
          <h2 className="text-base font-semibold text-slate-900">
            Product–prize mapping
          </h2>
          <p className="text-sm text-slate-500">
            Choose which catalog product unlocks which prize on the wheel.
          </p>
        </header>
        <ProductPrizeMappingTable
          products={products}
          prizes={prizes}
          mappings={mappings}
          onChange={setMappings}
          onCreatePrize={(name) => handleCreatePrize(name)}
          productSearch={productSearch}
          onProductSearchChange={setProductSearch}
          productsLoading={productsLoading}
          disabled={submitting}
          duplicateProductError={duplicateMsg}
        />
        {submitAttempted && fieldErrors.mappings ? (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {fieldErrors.mappings}
          </p>
        ) : null}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <header className="mb-4 border-b border-slate-100 pb-3">
          <h2 className="text-base font-semibold text-slate-900">
            Prize inventory
          </h2>
          <p className="text-sm text-slate-500">
            Set physical stock for every prize used in the mapping above.
          </p>
        </header>
        <PrizeInventoryTable
          rows={inventoryRows}
          onStockChange={(prizeId, raw) =>
            setInventoryStock((prev) => ({ ...prev, [prizeId]: raw }))
          }
          errors={submitAttempted ? fieldErrors.inventory : undefined}
          disabled={submitting}
        />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <header className="mb-4 border-b border-slate-100 pb-3">
          <h2 className="text-base font-semibold text-slate-900">
            Distribution limits
          </h2>
          <p className="text-sm text-slate-500">
            Control pacing and caps for how prizes are issued.
          </p>
        </header>
        <DistributionLimitsForm
          value={limits}
          onChange={setLimits}
          errors={submitAttempted ? fieldErrors.distribution : undefined}
          disabled={submitting}
        />
      </section>
    </form>
  );
}
