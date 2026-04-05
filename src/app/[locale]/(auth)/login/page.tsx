"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useAuth } from "@/lib/contexts/auth-context";

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const { login } = usePrivy();
  const { isAuthenticated, needsPin, isLoading, needsRegistration, isPrivyAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (isPrivyAuthenticated && needsRegistration) {
      // Privy user exists but no backend account — go register
      router.replace("/register/step1");
    } else if (needsPin) {
      router.replace("/pin");
    } else if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, needsPin, needsRegistration, isPrivyAuthenticated, router]);

  return (
    <div className="space-y-8 text-center">
      <div className="space-y-2">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-yasmin">
          <span className="text-2xl font-bold text-white">Y</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{t("loginTitle")}</h1>
        <p className="text-sm text-gray-500">{t("loginSubtitle")}</p>
      </div>

      <Button
        size="lg"
        className="w-full"
        onClick={() => login()}
      >
        Sign In
      </Button>
    </div>
  );
}
