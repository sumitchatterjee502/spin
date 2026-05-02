"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type {
  AdminCatalogPrize,
  AdminCatalogProduct,
  ProductPrizeMappingRow,
} from "@/types/prize-config.types";

export type ProductPrizeMappingTableProps = {
  products: AdminCatalogProduct[];
  prizes: AdminCatalogPrize[];
  mappings: ProductPrizeMappingRow[];
  onChange: (next: ProductPrizeMappingRow[]) => void;
  onCreatePrize: (name: string) => Promise<AdminCatalogPrize>;
  productSearch: string;
  onProductSearchChange: (q: string) => void;
  productsLoading?: boolean;
  disabled?: boolean;
  duplicateProductError?: string;
};

function rowKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `row-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function ProductPrizeMappingTable({
  products,
  prizes,
  mappings,
  onChange,
  onCreatePrize,
  productSearch,
  onProductSearchChange,
  productsLoading,
  disabled,
  duplicateProductError,
}: ProductPrizeMappingTableProps) {
  const [draftProductId, setDraftProductId] = useState("");
  const [draftPrizeId, setDraftPrizeId] = useState("");
  const [newPrizeName, setNewPrizeName] = useState("");
  const [creatingPrize, setCreatingPrize] = useState(false);

  const mappedProductIds = useMemo(
    () => new Set(mappings.map((m) => m.productId)),
    [mappings]
  );

  const productsForDraft = useMemo(
    () => products.filter((p) => !mappedProductIds.has(p.id)),
    [products, mappedProductIds]
  );

  const addMapping = () => {
    if (!draftProductId || !draftPrizeId) return;
    const p = products.find((x) => x.id === draftProductId);
    const z = prizes.find((x) => x.id === draftPrizeId);
    if (!p || !z) return;
    if (mappedProductIds.has(p.id)) return;
    onChange([
      ...mappings,
      {
        rowKey: rowKey(),
        productId: p.id,
        productName: p.name,
        prizeId: z.id,
        prizeName: z.name,
      },
    ]);
    setDraftProductId("");
    setDraftPrizeId("");
  };

  const updateRow = (rowKey: string, patch: Partial<ProductPrizeMappingRow>) => {
    onChange(
      mappings.map((m) => (m.rowKey === rowKey ? { ...m, ...patch } : m))
    );
  };

  const removeRow = (rowKey: string) => {
    if (
      typeof window !== "undefined" &&
      !window.confirm("Remove this product–prize mapping?")
    ) {
      return;
    }
    onChange(mappings.filter((m) => m.rowKey !== rowKey));
  };

  const handleCreatePrize = async () => {
    const name = newPrizeName.trim();
    if (!name || creatingPrize) return;
    setCreatingPrize(true);
    try {
      const created = await onCreatePrize(name);
      setNewPrizeName("");
      setDraftPrizeId(created.id);
    } finally {
      setCreatingPrize(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-slate-200 bg-slate-50/80 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Add mapping
        </p>
        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="min-w-0 flex-1">
            <label
              htmlFor="prize-config-product-search"
              className="block text-xs font-medium text-slate-600"
            >
              Search products
            </label>
            <input
              id="prize-config-product-search"
              type="search"
              disabled={disabled}
              value={productSearch}
              onChange={(e) => onProductSearchChange(e.target.value)}
              placeholder="Filter catalog…"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>
          <div className="min-w-0 flex-1">
            <label
              htmlFor="prize-config-draft-product"
              className="block text-xs font-medium text-slate-600"
            >
              Product
            </label>
            <select
              id="prize-config-draft-product"
              disabled={disabled || productsLoading}
              value={draftProductId}
              onChange={(e) => setDraftProductId(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              <option value="">Select product…</option>
              {productsForDraft.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0 flex-1">
            <label
              htmlFor="prize-config-draft-prize"
              className="block text-xs font-medium text-slate-600"
            >
              Prize
            </label>
            <select
              id="prize-config-draft-prize"
              disabled={disabled}
              value={draftPrizeId}
              onChange={(e) => setDraftPrizeId(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              <option value="">Select prize…</option>
              {prizes.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            disabled={
              disabled || !draftProductId || !draftPrizeId || Boolean(productsLoading)
            }
            onClick={addMapping}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add mapping
          </button>
        </div>
        <div className="mt-4 flex flex-col gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label
              htmlFor="prize-config-new-prize"
              className="block text-xs font-medium text-slate-600"
            >
              Or create new prize
            </label>
            <input
              id="prize-config-new-prize"
              type="text"
              disabled={disabled || creatingPrize}
              value={newPrizeName}
              onChange={(e) => setNewPrizeName(e.target.value)}
              placeholder="Prize name"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>
          <button
            type="button"
            disabled={disabled || creatingPrize || !newPrizeName.trim()}
            onClick={() => void handleCreatePrize()}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creatingPrize ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            Create prize
          </button>
        </div>
        {duplicateProductError ? (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {duplicateProductError}
          </p>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-md border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                Product
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                Prize
              </th>
              <th className="w-24 px-4 py-3 text-right font-semibold text-slate-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {mappings.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  No mappings yet. Use the form above to add your first row.
                </td>
              </tr>
            ) : (
              mappings.map((m) => (
                <tr key={m.rowKey}>
                  <td className="px-4 py-2">
                    <select
                      disabled={disabled}
                      value={m.productId}
                      onChange={(e) => {
                        const id = e.target.value;
                        const pr = products.find((x) => x.id === id);
                        if (!pr) return;
                        if (
                          mappings.some(
                            (x) => x.rowKey !== m.rowKey && x.productId === id
                          )
                        ) {
                          return;
                        }
                        updateRow(m.rowKey, {
                          productId: pr.id,
                          productName: pr.name,
                        });
                      }}
                      className="w-full max-w-xs rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    >
                      {products.map((p) => (
                        <option
                          key={p.id}
                          value={p.id}
                          disabled={
                            mappings.some(
                              (x) => x.rowKey !== m.rowKey && x.productId === p.id
                            )
                          }
                        >
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <select
                      disabled={disabled}
                      value={m.prizeId}
                      onChange={(e) => {
                        const id = e.target.value;
                        const pr = prizes.find((x) => x.id === id);
                        if (!pr) return;
                        updateRow(m.rowKey, {
                          prizeId: pr.id,
                          prizeName: pr.name,
                        });
                      }}
                      className="w-full max-w-xs rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    >
                      {prizes.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => removeRow(m.rowKey)}
                      className="inline-flex rounded-md p-2 text-red-700 hover:bg-red-50 disabled:opacity-40"
                      aria-label="Remove mapping"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
