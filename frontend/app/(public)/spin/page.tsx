"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import SpinWheelClient from "./_components/SpinWheelClient";
import { getSpinErrorMessage, spinWheel } from "@/services/spin.service";
import { getLeadGiftsByCampaignId, getLeadGiftsByQr } from "@/services/lead.service";
import type { SpinResponse } from "@/types/spin";
import CampaignHeader from "@/components/campaign/CampaignHeader";
import { getCampaignLandingByQr } from "@/services/campaign.service";
import { CampaignLandingDetails } from "@/types/campaign.types";
import OfferDetails from "@/components/campaign/OfferDetails";
import { LeadGiftItem } from "@/types/lead.types";

const defaultWheelSegments = [
  "MEGA PRIZE",
  "10% OFF",
  "BETTER LUCK NEXT TIME",
  "GIFT BOX",
  "20% OFF",
  "MOVIE PASS",
  "30% OFF",
  "BONUS ITEM",
];
const loseSegmentLabel = "BETTER LUCK NEXT TIME";

const defaultLanding: CampaignLandingDetails = {
  title: "Spin the Wheel Campaign",
  subtitle: "Buy, register, and spin for a chance to win exciting prizes.",
  offer: "Spin the Wheel & Win Exciting Prizes",
  prizes: ["Laptop Bag", "Smart TV", "Bluetooth Headphones", "Gift Vouchers"],
};

function ensureLoseSegment(segments: string[]): string[] {
  const cleaned = segments.map((segment) => segment.trim().toUpperCase()).filter(Boolean);
  if (cleaned.includes(loseSegmentLabel)) return cleaned;
  return [...cleaned, loseSegmentLabel];
}

export default function SpinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<SpinResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stopAngle, setStopAngle] = useState<number | null>(null);
  const [spinRequestId, setSpinRequestId] = useState(0);
  const [pendingResult, setPendingResult] = useState<SpinResponse | null>(null);
  const [wheelSegments, setWheelSegments] = useState<string[]>(defaultWheelSegments);
  const [landing, setLanding] = useState<CampaignLandingDetails>(defaultLanding);
  const [gifts, setGifts] = useState<LeadGiftItem[]>([]);
  const [giftsLoading, setGiftsLoading] = useState(false);
  

  const qrCode = searchParams.get("qr")?.trim() ?? "";
  
  const campaignId = useMemo<number | null>(() => {
    const raw = searchParams.get("campaignId");
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }, [searchParams]);

  const participationId = useMemo<number | null>(() => {
    const fromQuery = searchParams.get("participationId");
    if (fromQuery) {
      const parsed = Number(fromQuery);
      if (Number.isFinite(parsed)) return parsed;
    }
    if (typeof window === "undefined") return null;
    const fromLocalStorage = localStorage.getItem("participationId");
    if (!fromLocalStorage) return null;
    const parsed = Number(fromLocalStorage);
    return Number.isFinite(parsed) ? parsed : null;
  }, [searchParams]);

  useEffect(() => {
    if (participationId !== null) {
      localStorage.setItem("participationId", String(participationId));
    }
  }, [participationId]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const gifts =
          campaignId !== null
            ? await getLeadGiftsByCampaignId(campaignId)
            : qrCode
              ? await getLeadGiftsByQr(qrCode)
              : [];
        if (!mounted) return;
        const details = await getCampaignLandingByQr(qrCode);
        if (!mounted || !details) return;
        setLanding((prev) => ({
          ...prev,
          ...details,
        }));
        setGiftsLoading(true);
        void (async () => {
          try {
            const rows = await getLeadGiftsByQr(qrCode);
            if (!mounted) return;
            setGifts(rows);
          } catch {
            if (!mounted) return;
            setGifts([]);
          } finally {
            if (mounted) setGiftsLoading(false);
          }
        })();

        const nextSegments = gifts
          .map((gift) => gift.prizeName.trim().toUpperCase())
          .filter(Boolean);
        setWheelSegments(nextSegments.length > 1 ? ensureLoseSegment(nextSegments) : defaultWheelSegments);
      } catch {
        if (!mounted) return;
        setWheelSegments(defaultWheelSegments);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [campaignId, qrCode]);

  const navigateToResultPage = (result: SpinResponse) => {
    sessionStorage.setItem("latestSpinResult", JSON.stringify(result));
    const query = new URLSearchParams(searchParams.toString());
    query.set("participationId", String(result.participationId));
    router.push(`/spin/result?${query.toString()}`);
  };

  const handleSpin = async () => {
    if (isSpinning || loading || spinResult) return;
    if (participationId === null || Number.isNaN(participationId)) {
      const message = "Invalid request";
      setError(message);
      toast.error(message);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await spinWheel(participationId);
      setSpinResult(response);
      toast.success(response.message || "Spin completed");

      if (response.alreadySpun) {
        navigateToResultPage(response);
        setIsSpinning(false);
        return;
      }

      const totalSegments = Math.max(wheelSegments.length, 1);
      const loseIndex = wheelSegments.findIndex((segment) => segment === loseSegmentLabel);
      const fallbackWheelPosition = Number.isFinite(response.wheelPosition) ? response.wheelPosition : 0;
      const fallbackAngle = 360 - fallbackWheelPosition * (360 / totalSegments);
      const loseAngle = loseIndex >= 0 ? 360 - loseIndex * (360 / totalSegments) : fallbackAngle;
      const resolvedStopAngle =
        response.result === "LOSE"
          ? loseAngle
          : Number.isFinite(response.stopAngle)
            ? response.stopAngle
            : fallbackAngle;
      setStopAngle(resolvedStopAngle);
      setPendingResult(response);
      setIsSpinning(true);
      setSpinRequestId((prev) => prev + 1);
    } catch (err) {
      const message = getSpinErrorMessage(err);
      setError(message);
      toast.error(message);
      setIsSpinning(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSpinEnd = () => {
    setIsSpinning(false);
    if (pendingResult) {
      navigateToResultPage(pendingResult);
    }
  };

  return (
    <>
      <section className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 sm:gap-5">

      <CampaignHeader
          title={landing.title}
          subtitle={landing.subtitle}
          brandLogos={landing.brandLogos}
        />
        {/* <OfferDetails
          gifts={gifts}
          loading={giftsLoading}
          fallbackPrizes={landing.prizes}
          offerText={landing.offer}
        /> */}

        <SpinWheelClient
          participationId={participationId}
          isSpinning={isSpinning}
          loading={loading}
          error={error}
          spinResult={spinResult}
          stopAngle={stopAngle}
          spinRequestId={spinRequestId}
          wheelSegments={wheelSegments}
          onSpin={handleSpin}
          onSpinEnd={handleSpinEnd}
        />
      </div>
      </section>
    </>
  );
}
