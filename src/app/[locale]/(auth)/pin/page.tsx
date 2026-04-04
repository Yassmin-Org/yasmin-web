"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { PinInput } from "@/components/ui/pin-input";
import { useAuth } from "@/lib/contexts/auth-context";

export default function PinLockPage() {
  const t = useTranslations("pin");
  const router = useRouter();
  const { verifyPin } = useAuth();
  const [error, setError] = useState("");

  const handleComplete = (pin: string) => {
    if (verifyPin(pin)) {
      router.replace("/dashboard");
    } else {
      setError("Incorrect PIN");
      setTimeout(() => setError(""), 2000);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-600">
            <span className="text-2xl font-bold text-white">Y</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-sm text-gray-500">{t("subtitle")}</p>
        </div>

        <PinInput key={error} onComplete={handleComplete} error={error} />

        <button className="text-sm text-gray-400 hover:text-gray-600">
          {t("forgot")}
        </button>
      </div>
    </div>
  );
}
