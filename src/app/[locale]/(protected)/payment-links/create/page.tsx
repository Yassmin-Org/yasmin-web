"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AmountInput } from "@/components/ui/amount-input";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useCreatePaymentRequestMutation } from "@/lib/api/slices/transactions";
import { PaymentRequestType } from "@/lib/types";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Check, Copy, Share2, Plus, List } from "lucide-react";
import { copyToClipboard } from "@/lib/utils";

type Step = "form" | "success";

export default function CreatePaymentLinkPage() {
  const tc = useTranslations("common");
  const router = useRouter();

  const [step, setStep] = useState<Step>("form");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [paymentCode, setPaymentCode] = useState("");
  const [copied, setCopied] = useState(false);

  const [createRequest, { isLoading }] = useCreatePaymentRequestMutation();

  const paymentLink = paymentCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/pay/${paymentCode}`
    : "";

  const handleCreate = async () => {
    try {
      const result = await createRequest({
        amount: parseFloat(amount),
        type: PaymentRequestType.PAYLINK,
        note: note || undefined,
      }).unwrap();
      const resData = result as unknown as Record<string, unknown>;
      const innerData = resData?.data as Record<string, unknown> | undefined;
      setPaymentCode((innerData?.code || resData?.code || "") as string);
      setStep("success");
    } catch {
      // Error handled by RTK Query
    }
  };

  const handleCopy = async () => {
    await copyToClipboard(paymentLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Yasmin Payment Link",
        text: `Pay $${parseFloat(amount).toFixed(2)}${note ? ` - ${note}` : ""}`,
        url: paymentLink,
      });
    } else {
      handleCopy();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="rounded-lg p-1 hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Create Payment Link</h1>
      </div>

      {step === "form" && (
        <div className="space-y-4">
          <AmountInput value={amount} onChange={setAmount} autoFocus />

          <Input
            label="Description (optional)"
            placeholder="e.g. Invoice #123, Website design"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <Button
            size="lg"
            className="w-full"
            disabled={!amount || parseFloat(amount) <= 0}
            loading={isLoading}
            onClick={handleCreate}
          >
            Create Payment Link
          </Button>
        </div>
      )}

      {step === "success" && (
        <div className="space-y-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <Check className="h-7 w-7 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Payment Link Created!
            </h2>
          </div>

          <Card className="space-y-4 py-6">
            <p className="text-2xl font-bold text-gray-900">
              ${parseFloat(amount).toFixed(2)}
            </p>
            {note && <p className="text-sm text-gray-500">{note}</p>}

            <div className="flex justify-center">
              <QRCodeSVG value={paymentLink} size={160} level="M" />
            </div>

            <div className="rounded-lg bg-gray-50 px-3 py-2">
              <p className="break-all text-xs text-gray-600">{paymentLink}</p>
            </div>
          </Card>

          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="mr-2 h-4 w-4" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              {copied ? tc("copied") : tc("copy")}
            </Button>
            <Button size="lg" className="flex-1" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              {tc("share")}
            </Button>
          </div>

          <div className="flex gap-3">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => {
                setStep("form");
                setAmount("");
                setNote("");
                setPaymentCode("");
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Another
            </Button>
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => router.push("/payment-links")}
            >
              <List className="mr-2 h-4 w-4" />
              View All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
