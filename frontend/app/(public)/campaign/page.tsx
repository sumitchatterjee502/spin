"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import CampaignHeader from "@/components/campaign/CampaignHeader";
import LeadForm, { validateLeadForm } from "@/components/campaign/LeadForm";
import OfferDetails from "@/components/campaign/OfferDetails";
import { getCampaignLandingByQr } from "@/services/campaign.service";
import {
  getLeadGiftsByQr,
  getLeadSubmitFieldErrors,
  getLeadSubmitErrorMessage,
  submitLead,
} from "@/services/lead.service";
import type { CampaignLandingDetails } from "@/types/campaign.types";
import type { LeadFieldErrors, LeadFormData, LeadGiftItem } from "@/types/lead.types";

const initialForm: LeadFormData = {
  name: "",
  phone: "",
  email: "",
  address: "",
  receiptNumber: "",
  shopLocation: "",
  file: null,
  termsAccepted: false,
};

const defaultLanding: CampaignLandingDetails = {
  title: "Spin the Wheel Campaign",
  subtitle: "Buy, register, and spin for a chance to win exciting prizes.",
  offer: "Spin the Wheel & Win Exciting Prizes",
  prizes: ["Laptop Bag", "Smart TV", "Bluetooth Headphones", "Gift Vouchers"],
};

const fieldDomIds: Record<keyof LeadFormData, string> = {
  name: "lead-name",
  phone: "lead-phone",
  email: "lead-email",
  address: "lead-address",
  receiptNumber: "lead-receipt-number",
  shopLocation: "lead-shop-location",
  file: "lead-file",
  termsAccepted: "lead-terms",
};

export default function CampaignPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qrCode = searchParams.get("qr")?.trim() ?? "";

  const [landing, setLanding] = useState<CampaignLandingDetails>(defaultLanding);
  const [form, setForm] = useState<LeadFormData>(initialForm);
  const [errors, setErrors] = useState<LeadFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [gifts, setGifts] = useState<LeadGiftItem[]>([]);
  const [giftsLoading, setGiftsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!qrCode) return;
    void (async () => {
      const details = await getCampaignLandingByQr(qrCode);
      if (!mounted || !details) return;
      setLanding((prev) => ({
        ...prev,
        ...details,
      }));
    })();
    return () => {
      mounted = false;
    };
  }, [qrCode]);

  useEffect(() => {
    let mounted = true;
    if (!qrCode) {
      setGifts([]);
      return;
    }
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
    return () => {
      mounted = false;
    };
  }, [qrCode]);

  useEffect(() => {
    if (!form.file) {
      setPreviewUrl(null);
      return;
    }
    if (!form.file.type.startsWith("image/")) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(form.file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [form.file]);

  const canSubmit = useMemo(() => !submitting, [submitting]);

  function sanitizeFormValues(values: LeadFormData): LeadFormData {
    return {
      ...values,
      name: values.name.trim().replace(/\s{2,}/g, " "),
      phone: values.phone.trim().replace(/[^\d+]/g, ""),
      email: values.email.trim().toLowerCase(),
      address: values.address.trim().replace(/\s{2,}/g, " "),
      receiptNumber: values.receiptNumber.trim(),
      shopLocation: values.shopLocation.trim(),
    };
  }

  function scrollToErrorField(nextErrors: LeadFieldErrors) {
    const firstKey = Object.keys(nextErrors)[0] as keyof LeadFieldErrors | undefined;
    if (!firstKey) return;
    const id = fieldDomIds[firstKey as keyof LeadFormData];
    if (!id) return;
    const node = document.getElementById(id);
    if (node) {
      node.scrollIntoView({ behavior: "smooth", block: "center" });
      if ("focus" in node && typeof node.focus === "function") {
        node.focus();
      }
    }
  }

  function setField<K extends keyof LeadFormData>(field: K, value: LeadFormData[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    const sanitizedForm = sanitizeFormValues(form);
    const nextErrors = validateLeadForm(sanitizedForm);
    setForm(sanitizedForm);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      scrollToErrorField(nextErrors);
      toast.error("Please fix form errors before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", sanitizedForm.name);
      fd.append("phone", sanitizedForm.phone);
      fd.append("email", sanitizedForm.email);
      fd.append("address", sanitizedForm.address);
      fd.append("receiptNumber", sanitizedForm.receiptNumber);
      fd.append("shopLocation", sanitizedForm.shopLocation);
      fd.append("acceptTerms", String(sanitizedForm.termsAccepted));
      if (sanitizedForm.file) fd.append("file", sanitizedForm.file);
      if (qrCode) fd.append("qrCode", qrCode);

      const submitResult = await submitLead(fd);
      sessionStorage.setItem(
        "campaignUserProfile",
        JSON.stringify({
          name: sanitizedForm.name,
          phone: sanitizedForm.phone,
          email: sanitizedForm.email,
          address: sanitizedForm.address,
        })
      );
      toast.success("Thanks for participating!");
      setForm(initialForm);
      setErrors({});
      const spinParams = new URLSearchParams();
      if (qrCode) spinParams.set("qr", qrCode);
      if (submitResult.participationId !== null) {
        localStorage.setItem("participationId", String(submitResult.participationId));
      }
      if (submitResult.participationId !== null) {
        spinParams.set("participationId", String(submitResult.participationId));
      }
      const query = spinParams.toString();
      router.push(query ? `/spin?${query}` : "/spin");
    } catch (error) {
      const fieldErrors = getLeadSubmitFieldErrors(error);
      if (fieldErrors) {
        setErrors(fieldErrors);
        scrollToErrorField(fieldErrors);
      }
      toast.error(getLeadSubmitErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 sm:gap-5">
        <CampaignHeader
          title={landing.title}
          subtitle={landing.subtitle}
          brandLogos={landing.brandLogos}
        />
        <OfferDetails
          gifts={gifts}
          loading={giftsLoading}
          fallbackPrizes={landing.prizes}
          offerText={landing.offer}
        />
        <LeadForm
          form={form}
          errors={errors}
          submitting={submitting}
          previewUrl={previewUrl}
          onChange={setField}
          onSubmit={handleSubmit}
        />
      </div>
    </section>
  );
}
