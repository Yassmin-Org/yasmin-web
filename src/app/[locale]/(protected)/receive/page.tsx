"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AmountInput } from "@/components/ui/amount-input";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useCreatePaymentRequestMutation } from "@/lib/api/slices/transactions";
import { useAuth } from "@/lib/contexts/auth-context";
import { PaymentRequestType } from "@/lib/types";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Check, Copy, Share2 } from "lucide-react";
import { copyToClipboard } from "@/lib/utils";

type Step = "amount" | "confirm" | "success";

export default function ReceivePage() {
  const t = useTranslations("receive");
  const tc = useTranslations("common");
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [paymentCode, setPaymentCode] = useState("");
  const [copied, setCopied] = useState(false);

  const [createRequest, { isLoading }] = useCreatePaymentRequestMutation();

  const handleCreate = async () => {
    try {
      const result = await createRequest({
        amount: parseFloat(amount),
        type: PaymentRequestType.PAYLINK,
        note: note || undefined,
      }).unwrap();
      setPaymentCode(result.data.code);
      setStep("success");
    } catch {
      // Error handled by RTK Query
    }
  };

  const paymentLink = paymentCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/pay/${paymentCode}`
    : "";

  const handleCopy = async () => {
    await copyToClipboard(paymentLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Yasmin Payment",
        text: `Pay $${parseFloat(amount).toFixed(2)} to @${user?.username}`,
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
          onClick={() => {
            if (step === "confirm") setStep("amount");
            else router.back();
          }}
          className="rounded-lg p-1 hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>
      </div>

      {step === "amount" && (
        <div className="space-y-4">
          <AmountInput value={amount} onChange={setAmount} autoFocus />
          <Input
            placeholder={t("note")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <Button
            size="lg"
            className="w-full"
            disabled={!amount || parseFloat(amount) <= 0}
            onClick={() => setStep("confirm")}
          >
            {t("createRequest")}
          </Button>
        </div>
      )}

      {step === "confirm" && (
        <div className="space-y-4">
          <Card className="space-y-3">
            <h2 className="font-semibold text-gray-900">{t("requestPayment")}</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">{t("amount")}</span>
                <span className="font-medium">
                  ${parseFloat(amount).toFixed(2)}
                </span>
              </div>
              {note && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Note</span>
                  <span className="font-medium">{note}</span>
                </div>
              )}
            </div>
          </Card>
          <Button
            size="lg"
            className="w-full"
            loading={isLoading}
            onClick={handleCreate}
          >
            {tc("confirm")}
          </Button>
        </div>
      )}

      {step === "success" && (
        <div className="space-y-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <Check className="h-7 w-7 text-green-600" />
            </div>
            <p className="text-sm text-gray-500">{t("success")}</p>
          </div>

          <Card className="flex flex-col items-center gap-4 py-6">
            <p className="text-2xl font-bold text-gray-900">
              ${parseFloat(amount).toFixed(2)}
            </p>
            <QRCodeSVG value={paymentLink} size={180} level="M" />
            <p className="text-xs text-gray-400">{t("qrTitle")}</p>
          </Card>

          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={handleCopy}
            >
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? tc("copied") : tc("copy")}
            </Button>
            <Button size="lg" className="flex-1" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              {tc("share")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
