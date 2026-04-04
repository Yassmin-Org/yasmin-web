"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Globe } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function AuthMethodPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const isLocal = searchParams.get("local") === "true";
  const { login } = usePrivy();

  const handlePhoneAuth = () => {
    login({ loginMethods: ["sms"] });
    // After Privy auth, redirect to registration
    router.push("/register/step1");
  };

  const handleEmailAuth = () => {
    login({ loginMethods: ["email"] });
    router.push("/register/step1");
  };

  const handleGoogleAuth = () => {
    login({ loginMethods: ["google"] });
    router.push("/register/step1");
  };

  return (
    <div className="space-y-8 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-sm text-gray-500">{t("subtitle")}</p>
      </div>

      <div className="space-y-3">
        {!isLocal && (
          <Button
            variant="outline"
            size="lg"
            className="w-full justify-start gap-3"
            onClick={handlePhoneAuth}
          >
            <Phone className="h-5 w-5" />
            {t("phone")}
          </Button>
        )}

        <Button
          variant="outline"
          size="lg"
          className="w-full justify-start gap-3"
          onClick={handleEmailAuth}
        >
          <Mail className="h-5 w-5" />
          {t("email")}
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="w-full justify-start gap-3"
          onClick={handleGoogleAuth}
        >
          <Globe className="h-5 w-5" />
          {t("google")}
        </Button>
      </div>
    </div>
  );
}
