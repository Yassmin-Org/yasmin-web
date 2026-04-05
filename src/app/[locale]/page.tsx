"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/contexts/auth-context";
import { useEffect } from "react";

export default function WelcomePage() {
  const t = useTranslations("welcome");
  const router = useRouter();
  const { isAuthenticated, needsPin, isLoading, needsRegistration, isPrivyAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (isPrivyAuthenticated && needsRegistration) {
      // Authenticated with Privy but no backend user — go to registration
      router.replace("/register/step1");
    } else if (needsPin) {
      router.replace("/pin");
    } else if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, needsPin, isLoading, needsRegistration, isPrivyAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-yasmin border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="space-y-2">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-yasmin">
            <span className="text-3xl font-bold text-white">Y</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-gray-500">{t("subtitle")}</p>
        </div>

        <div className="flex justify-center gap-3">
          <button
            onClick={() => {
              localStorage.setItem("selected_language", "en");
              router.replace("/", { locale: "en" });
            }}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            English
          </button>
          <button
            onClick={() => {
              localStorage.setItem("selected_language", "ar");
              router.replace("/", { locale: "ar" });
            }}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            العربية
          </button>
        </div>

        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full"
            onClick={() => router.push("/location")}
          >
            {t("getStarted")}
          </Button>
          <button
            onClick={() => router.push("/login")}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {t("alreadyHaveAccount")}{" "}
            <span className="font-medium text-yasmin">{t("login")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
