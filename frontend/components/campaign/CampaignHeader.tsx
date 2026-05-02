"use client";

import Image from "next/image";

type CampaignHeaderProps = {
  title: string;
  subtitle?: string;
  brandLogos?: string[];
};

export default function CampaignHeader({
  title,
  subtitle,
  brandLogos = [],
}: CampaignHeaderProps) {
  return (
    <section className="rounded-2xl bg-slate-900 p-5 text-white shadow-lg sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
        Spin Campaign
      </p>
      <h1 className="mt-2 text-2xl font-semibold leading-tight sm:text-3xl">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-2 max-w-2xl text-sm text-slate-200 sm:text-base">
          {subtitle}
        </p>
      ) : null}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {brandLogos.length > 0 ? (
          brandLogos.map((logo, idx) => (
            <div
              key={`${logo}-${idx}`}
              className="flex h-16 items-center justify-center rounded-lg bg-white/10 p-2"
            >
              <Image
                src={logo}
                alt={`Brand ${idx + 1}`}
                width={160}
                height={56}
                className="max-h-12 w-auto object-contain"
                unoptimized
              />
            </div>
          ))
        ) : (
          <></>
          
        )}
      </div>
    </section>
  );
}
