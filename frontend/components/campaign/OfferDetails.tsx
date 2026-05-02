"use client";

import { Gift } from "lucide-react";
import type { LeadGiftItem } from "@/types/lead.types";

type OfferDetailsProps = {
  gifts?: LeadGiftItem[];
  loading?: boolean;
  fallbackPrizes?: string[];
  offerText?: string;
};

const defaultPrizeNames = ["Laptop Bag", "Smart TV", "Bluetooth Headphones", "Gift Vouchers"];

export default function OfferDetails({
  gifts = [],
  loading = false,
  fallbackPrizes = defaultPrizeNames,
  offerText = "Spin the Wheel & Win Exciting Prizes",
}: OfferDetailsProps) {
  const prizeNames =
    gifts.length > 0 ? gifts.map((g) => g.prizeName) : fallbackPrizes;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">
        {offerText}
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Register with your purchase details for a chance to win instantly.
      </p>
      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Loading campaign gifts…</p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {prizeNames.map((prize) => {
            const gift = gifts.find((g) => g.prizeName === prize);
            const inStock = gift?.inStock ?? true;
            return (
              <span
                key={gift ? String(gift.prizeId) : prize}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                  inStock
                    ? "border-slate-200 bg-slate-50 text-slate-700"
                    : "border-amber-200 bg-amber-50 text-amber-800"
                }`}
              >
                <Gift className="h-3.5 w-3.5" aria-hidden />
                {prize}
                {gift && !gift.inStock ? " (Out of stock)" : null}
              </span>
            );
          })}
        </div>
      )}
    </section>
  );
}
