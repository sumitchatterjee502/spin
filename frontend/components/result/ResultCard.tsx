"use client";

import type { SpinResult } from "./types";

type ResultCardProps = {
  result: SpinResult;
};

export default function ResultCard({ result }: ResultCardProps) {
  const isWin = result.result === "WIN";
  const icon = isWin ? "🎉" : "🙂";
  const title = isWin ? "Congratulations!" : "Better luck next time";
  const resultLine = isWin
    ? `You won ${result.prize?.name ?? "a prize"}`
    : "Better luck next time";

  return (
    <div
      className={`rounded-xl border p-4 ${
        isWin ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl" aria-hidden>
          {icon}
        </span>
        <h2 className={`text-xl font-semibold ${isWin ? "text-emerald-700" : "text-slate-800"}`}>
          {title}
        </h2>
      </div>

      <p className="mt-4 text-sm text-slate-700">Thanks for participating</p>

      <p className={`mt-2 text-sm font-medium ${isWin ? "text-emerald-700" : "text-slate-700"}`}>
        {resultLine}
      </p>
    </div>
  );
}
