"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { CampaignFormValues } from "@/types/campaign.types";
import {
  createCampaign,
  mapProductsToCampaign,
  updateCampaign,
} from "@/services/campaign.service";
import { getCampaignApiErrorMessage } from "@/utils/campaignApiError";
import ProductMultiSelect from "./ProductMultiSelect";
import {
  serializeCampaignFormBaseline,
  validateCampaignForm,
} from "./campaignFormValidation";

export type CampaignFormProps = {
  mode: "create" | "edit";
  campaignId?: number;
  initialValues: CampaignFormValues;
  /** When this changes, the form resets to `initialValues` (e.g. after fetch). */
  syncKey?: string | number;
  onDirtyChange?: (dirty: boolean) => void;
};

function emptyTouch(): Record<string, boolean> {
  return {};
}

export default function CampaignForm({
  mode,
  campaignId,
  initialValues,
  syncKey,
  onDirtyChange,
}: CampaignFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const [values, setValues] = useState<CampaignFormValues>(initialValues);
  const [touched, setTouched] = useState<Record<string, boolean>>(emptyTouch);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const latestInitialRef = useRef(initialValues);
  latestInitialRef.current = initialValues;
  const baselineRef = useRef(serializeCampaignFormBaseline(initialValues));

  useEffect(() => {
    const next = latestInitialRef.current;
    setValues(next);
    setTouched(emptyTouch());
    setSubmitAttempted(false);
    baselineRef.current = serializeCampaignFormBaseline(next);
  }, [syncKey]);

  const errors = validateCampaignForm(values);
  const showFieldError = (field: keyof typeof errors) =>
    (touched[field] || submitAttempted) && errors[field];

  const isDirty =
    serializeCampaignFormBaseline(values) !== baselineRef.current;

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    const vErrors = validateCampaignForm(values);
    if (Object.keys(vErrors).length) {
      setTouched({
        name: true,
        startDate: true,
        endDate: true,
        products: true,
      });
      toast.error("Please fix the validation errors.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "create") {
        const created = await createCampaign(
          {
            name: values.name.trim(),
            startDate: values.startDate,
            endDate: values.endDate,
            status: values.status,
          },
          accessToken
        );
        const id = created.id;
        try {
          await mapProductsToCampaign(
            id,
            values.productIds,
            accessToken,
            true
          );
        } catch (mapErr) {
          toast.error(
            getCampaignApiErrorMessage(
              mapErr,
              "Campaign was created but product mapping failed."
            )
          );
          router.push(`/campaigns-setup/${id}/edit`);
          return;
        }
        toast.success("Campaign created successfully");
        router.push("/campaigns-setup");
        return;
      }

      if (mode === "edit" && campaignId != null) {
        await updateCampaign(
          campaignId,
          {
            name: values.name.trim(),
            startDate: values.startDate,
            endDate: values.endDate,
            status: values.status,
          },
          accessToken
        );
        await mapProductsToCampaign(
          campaignId,
          values.productIds,
          accessToken,
          true
        );
        toast.success("Campaign updated successfully");
        router.push("/campaigns-setup");
        return;
      }

      toast.error("Missing campaign id for edit.");
    } catch (err) {
      toast.error(getCampaignApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmLeave = useCallback(() => {
    if (!isDirty) return true;
    return window.confirm(
      "You have unsaved changes. Leave without saving?"
    );
  }, [isDirty]);

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
      <div>
        <label
          htmlFor="campaign-name"
          className="block text-sm font-medium text-slate-700"
        >
          Campaign name
        </label>
        <input
          id="campaign-name"
          type="text"
          autoComplete="off"
          disabled={submitting}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
          value={values.name}
          onChange={(e) =>
            setValues((v) => ({ ...v, name: e.target.value }))
          }
          onBlur={() => setTouched((t) => ({ ...t, name: true }))}
        />
        {showFieldError("name") ? (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {errors.name}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="start-date"
            className="block text-sm font-medium text-slate-700"
          >
            Start date
          </label>
          <input
            id="start-date"
            type="date"
            disabled={submitting}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
            value={values.startDate}
            onChange={(e) =>
              setValues((v) => ({ ...v, startDate: e.target.value }))
            }
            onBlur={() => setTouched((t) => ({ ...t, startDate: true }))}
          />
          {showFieldError("startDate") ? (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {errors.startDate}
            </p>
          ) : null}
        </div>
        <div>
          <label
            htmlFor="end-date"
            className="block text-sm font-medium text-slate-700"
          >
            End date
          </label>
          <input
            id="end-date"
            type="date"
            disabled={submitting}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
            value={values.endDate}
            onChange={(e) =>
              setValues((v) => ({ ...v, endDate: e.target.value }))
            }
            onBlur={() => setTouched((t) => ({ ...t, endDate: true }))}
          />
          {showFieldError("endDate") ? (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {errors.endDate}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <span className="block text-sm font-medium text-slate-700">
          Status
        </span>
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={() =>
              setValues((v) => ({ ...v, status: "ACTIVE" }))
            }
            className={`rounded-full px-3 py-1 text-sm font-medium transition ${
              values.status === "ACTIVE"
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Active
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() =>
              setValues((v) => ({ ...v, status: "INACTIVE" }))
            }
            className={`rounded-full px-3 py-1 text-sm font-medium transition ${
              values.status === "INACTIVE"
                ? "bg-slate-700 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Inactive
          </button>
        </div>
      </div>

      <div>
        <span className="block text-sm font-medium text-slate-700">
          Products
        </span>
        <p className="mt-0.5 text-xs text-slate-500">
          Select one or more products for this campaign.
        </p>
        <div className="mt-2">
          <ProductMultiSelect
            value={values.productIds}
            onChange={(productIds) => {
              setValues((v) => ({ ...v, productIds }));
              setTouched((t) => ({ ...t, products: true }));
            }}
            disabled={submitting}
            error={
              (touched.products || submitAttempted) && errors.products
                ? errors.products
                : undefined
            }
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Saving…
            </>
          ) : mode === "create" ? (
            "Create campaign"
          ) : (
            "Save changes"
          )}
        </button>
        <Link
          href="/campaigns-setup"
          onClick={(e) => {
            if (!confirmLeave()) e.preventDefault();
          }}
          className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
