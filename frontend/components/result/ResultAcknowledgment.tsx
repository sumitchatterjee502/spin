"use client";

import Link from "next/link";
import ResultCard from "./ResultCard";
import ParticipationDetails from "./ParticipationDetails";
import type { SpinResult } from "./types";

type ResultAcknowledgmentProps = {
  result?: SpinResult | null;
  onClose?: () => void;
};

export default function ResultAcknowledgment({ result, onClose }: ResultAcknowledgmentProps) {
  if (!result) {
    return (
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        <p className="text-center text-base font-medium text-slate-700">
          Something went wrong. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl transition-all duration-300 ease-out sm:p-8">
      <div className="space-y-4">
        <ResultCard result={result} />

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900">Verification pending</p>
          <p className="mt-1 text-sm text-slate-600">
            Our team will verify your submission and contact you if you win.
          </p>
        </div>

        <ParticipationDetails participationId={result.participationId} />

        <div className="flex flex-col gap-2 pt-1 sm:flex-row">
          <Link
            href="/campaign"
            className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 sm:w-auto"
          >
            Go to Home
          </Link>
          <button
            type="button"
            disabled
            className="inline-flex w-full items-center justify-center rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-400 sm:w-auto"
          >
            Check Status
          </button>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex w-full items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 sm:ml-auto sm:w-auto"
            >
              Close
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
