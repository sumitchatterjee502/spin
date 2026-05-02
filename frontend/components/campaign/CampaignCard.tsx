import Link from "next/link";
import type { Campaign } from "@/types/campaign.types";
import { formatCampaignDate } from "@/utils/formatCampaignDate";

type CampaignCardProps = {
  campaign: Campaign;
};

function StatusBadge({ status }: { status: Campaign["status"] }) {
  const active = status === "ACTIVE";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        active
          ? "bg-emerald-100 text-emerald-800"
          : "bg-slate-200 text-slate-700"
      }`}
    >
      {status}
    </span>
  );
}

export default function CampaignCard({ campaign }: CampaignCardProps) {
  return (
    <article className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-900">{campaign.name}</h3>
        <StatusBadge status={campaign.status} />
      </div>
      <dl className="mt-3 space-y-1 text-sm text-slate-600">
        <div className="flex justify-between gap-2">
          <dt>Start</dt>
          <dd className="text-slate-800">
            {formatCampaignDate(campaign.startDate)}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>End</dt>
          <dd className="text-slate-800">
            {formatCampaignDate(campaign.endDate)}
          </dd>
        </div>
      </dl>
      <div className="mt-4 flex justify-end">
        <Link
          href={`/campaigns-setup/${campaign.id}/edit`}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          Edit
        </Link>
      </div>
    </article>
  );
}
