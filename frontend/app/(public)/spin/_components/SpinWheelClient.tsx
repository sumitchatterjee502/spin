"use client";

import { useEffect, useState } from "react";
import type { SpinResponse } from "@/types/spin";

const segmentColors = ["#f6df3d", "#f8803e", "#79c3ea", "#0a2f5a"];

type StoredCampaignProfile = {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
};

type SpinWheelClientProps = {
  participationId: number | null;
  isSpinning: boolean;
  loading: boolean;
  error: string | null;
  spinResult: SpinResponse | null;
  stopAngle: number | null;
  spinRequestId: number;
  wheelSegments: string[];
  onSpin: () => void;
  onSpinEnd: () => void;
};

export default function SpinWheelClient({
  participationId,
  isSpinning,
  loading,
  error,
  spinResult,
  stopAngle,
  spinRequestId,
  wheelSegments,
  onSpin,
  onSpinEnd,
}: SpinWheelClientProps) {
  const [rotation, setRotation] = useState(0);

  const [campaignProfile] = useState<StoredCampaignProfile>(() => {
    const raw = sessionStorage.getItem("campaignUserProfile");
    if (!raw) {
      return {};
    }
    try {
      return JSON.parse(raw) as StoredCampaignProfile;
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (spinRequestId <= 0 || stopAngle === null) {
      return;
    }
    const normalizedStopAngle = ((stopAngle % 360) + 360) % 360;
    setRotation((prev) => prev + 6 * 360 + normalizedStopAngle);
  }, [spinRequestId, stopAngle]);

  const hasCompletedSpin = Boolean(spinResult);

  return (
    <section className="">
      {/* <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Spin Wheel Campaign</h1>
        <p className="mt-2 text-sm text-slate-600">Participation ID: {participationId}</p>
        <div className="mt-5 space-y-2 rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
          <p>
            <span className="font-medium">Name:</span> {campaignProfile.name || "N/A"}
          </p>
          <p>
            <span className="font-medium">Phone:</span> {campaignProfile.phone || "N/A"}
          </p>
          <p>
            <span className="font-medium">Email:</span> {campaignProfile.email || "N/A"}
          </p>
          <p>
            <span className="font-medium">Address:</span> {campaignProfile.address || "N/A"}
          </p>
        </div>
      </div> */}

      <div className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="relative mt-4 h-72 w-72 sm:h-80 sm:w-80">
          <div className={`absolute -right-3 top-9 z-30 ${/*isSpinning ? "pointer-shake" :*/ "rotate-[20deg]"}`}>
            <div className="h-0 w-0 border-b-[14px] border-l-[24px] border-t-[14px] border-b-transparent border-l-red-600 border-t-transparent drop-shadow-sm" />
          </div>
          <div
            onTransitionEnd={() => {
              if (isSpinning) {
                onSpinEnd();
              }
            }}
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: "transform 3.5s cubic-bezier(0.17, 0.67, 0.24, 0.99)",
            }}
            className="relative h-full w-full rounded-full border-8 border-white shadow-[0_0_0_6px_#e5e7eb]"
            aria-label="Spin wheel"
          >
            <div
              className="relative h-full w-full rounded-full"
              style={{
                background: `conic-gradient(${Array.from({ length: wheelSegments.length })
                  .map(
                    (_, i) =>
                      `${segmentColors[i % segmentColors.length]} ${i * (360 / wheelSegments.length)}deg ${(i + 1) * (360 / wheelSegments.length)}deg`
                  )
                  .join(", ")})`,
              }}
            >
              {wheelSegments.map((item, index) => {
                const degrees = 360 / wheelSegments.length;
                return (
                  <div
                    key={`divider-${index}`}
                    className="absolute left-1/2 top-1/2 h-1/2 w-[2px] bg-white/90"
                    style={{
                      transform: `translate(-50%, -100%) rotate(${index * degrees}deg)`,
                      transformOrigin: "bottom center",
                    }}
                  />
                );
              })}
              {wheelSegments.map((item, index) => {
                const degrees = 360 / wheelSegments.length;
                const rotationDeg = index * degrees + degrees / 2;
                return (
                  <div
                    key={`${item}-${index}`}
                    className="absolute left-1/2 top-1/2 w-24 text-center text-[11px] font-bold tracking-wide sm:w-28 sm:text-xs"
                    style={{
                      transform: `translate(-50%, -50%) rotate(${rotationDeg}deg) translateY(-115px) rotate(90deg)`,
                      color: index % 4 === 3 ? "#d2ec4d" : "#11233a",
                    }}
                  >
                    {item}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <button
          type="button"
          disabled={loading || isSpinning || hasCompletedSpin}
          onClick={onSpin}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-black px-8 py-3 font-semibold tracking-wider text-white disabled:opacity-70"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              LOADING...
            </>
          ) : isSpinning ? (
            "SPINNING..."
          ) : hasCompletedSpin ? (
            "SPIN COMPLETED"
          ) : (
            "SPIN"
          )}
        </button>
        {error ? <p className="mt-3 text-sm font-medium text-red-600">{error}</p> : null}
      </div>
    </section>
  );
}
