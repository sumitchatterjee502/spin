"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { Product } from "@/types/campaign.types";
import { getProducts } from "@/services/product.service";
import { getCampaignApiErrorMessage } from "@/utils/campaignApiError";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

type ProductMultiSelectProps = {
  value: number[];
  onChange: (productIds: number[]) => void;
  disabled?: boolean;
  error?: string;
};

export default function ProductMultiSelect({
  value,
  onChange,
  disabled,
  error,
}: ProductMultiSelectProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") {
      return;
    }
    if (status !== "authenticated" || !session?.accessToken) {
      setLoading(false);
      setProducts([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const list = await getProducts(session.accessToken);
        if (!cancelled) setProducts(list);
      } catch (e) {
        toast.error(getCampaignApiErrorMessage(e, "Failed to load products."));
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, session?.accessToken]);

  const toggle = (id: number) => {
    if (disabled) return;
    if (value.includes(id)) {
      onChange(value.filter((x) => x !== id));
    } else {
      onChange([...value, id]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-6 text-sm text-slate-600">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Loading products…
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        No products available. Add products in the backend first.
      </p>
    );
  }

  return (
    <div>
      <div
        className={`max-h-56 overflow-y-auto rounded border p-2 ${
          error ? "border-red-300 bg-red-50/50" : "border-slate-200 bg-white"
        }`}
        role="group"
        aria-label="Products"
      >
        <ul className="space-y-1">
          {products.map((p) => {
            const checked = value.includes(p.id);
            return (
              <li key={p.id}>
                <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-slate-50">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggle(p.id)}
                  />
                  <span className="text-slate-800">{p.name}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>
      {error ? (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
