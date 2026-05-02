"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import CampaignHeader from "@/components/campaign/CampaignHeader";
import ResultAcknowledgment from "@/components/result/ResultAcknowledgment";
import type { SpinResult } from "@/components/result/types";
import { getCampaignLandingByQr } from "@/services/campaign.service";
import type { CampaignLandingDetails } from "@/types/campaign.types";

const defaultLanding: CampaignLandingDetails = {
  title: "Spin the Wheel Campaign",
  subtitle: "Buy, register, and spin for a chance to win exciting prizes.",
  offer: "Spin the Wheel & Win Exciting Prizes",
  prizes: ["Laptop Bag", "Smart TV", "Bluetooth Headphones", "Gift Vouchers"],
};

export default function SpinResultPage() {
  const searchParams = useSearchParams();
  const [landing, setLanding] = useState<CampaignLandingDetails>(defaultLanding);
  const [result, setResult] = useState<SpinResult | null>(null);

  const qrCode = searchParams.get("qr")?.trim() ?? "";

  useEffect(() => {
    let mounted = true;

    if (typeof window !== "undefined") {
      const raw = sessionStorage.getItem("latestSpinResult");
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as SpinResult;
          if (mounted) {
            setResult(parsed);
          }
        } catch {
          if (mounted) {
            setResult(null);
          }
        }
      }
    }

    void (async () => {
      try {
        const details = await getCampaignLandingByQr(qrCode);
        if (!mounted || !details) return;
        setLanding((prev) => ({
          ...prev,
          ...details,
        }));
      } catch {
        // Keep default landing copy if campaign details fail.
      }
    })();

    return () => {
      mounted = false;
    };
  }, [qrCode]);

  return (
    <section className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 sm:gap-5">
        <CampaignHeader
          title={landing.title}
          subtitle={landing.subtitle}
          brandLogos={landing.brandLogos}
        />
        <div className="flex justify-center">
          <ResultAcknowledgment result={result} />
        </div>
      </div>
    </section>
  );
}
