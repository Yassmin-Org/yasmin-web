"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { PinInput } from "@/components/ui/pin-input";
import { useAuth } from "@/lib/contexts/auth-context";

export default function PinPage() {
  const t = useTranslations("register");
  const router = useRouter();
  const { setPin: savePin } = useAuth();
  const [step, setStep] = useState<"create" | "confirm">("create");
  const [firstPin, setFirstPin] = useState("");
  const [error, setError] = useState("");

  const handleCreate = (pin: string) => {
    setFirstPin(pin);
    setStep("confirm");
    setError("");
  };

  const handleConfirm = (pin: string) => {
    if (pin === firstPin) {
      savePin(pin);
      router.replace("/dashboard");
    } else {
      setError(t("pinMismatch"));
      setStep("create");
      setFirstPin("");
    }
  };

  return (
    <div className="space-y-8 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">
          {step === "create" ? t("step4Title") : t("step5Title")}
        </h1>
        <p className="text-sm text-gray-500">
          {step === "create" ? t("step4Subtitle") : t("step5Subtitle")}
        </p>
      </div>

      <PinInput
        key={step + error}
        onComplete={step === "create" ? handleCreate : handleConfirm}
        error={error}
      />
    </div>
  );
}
