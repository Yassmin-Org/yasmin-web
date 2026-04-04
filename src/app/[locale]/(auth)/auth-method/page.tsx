"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Globe } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function AuthMethodPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const isLocal = searchParams.get("local") === "true";
  const { login, authenticated, ready } = usePrivy();

  // When Privy auth completes, navigate to registration
  useEffect(() => {
    if (ready && authenticated) {
      router.push("/register/step1");
    }
  }, [ready, authenticated, router]);

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
            onClick={() => login({ loginMethods: ["sms"] })}
          >
            <Phone className="h-5 w-5" />
            {t("phone")}
          </Button>
        )}

        <Button
          variant="outline"
          size="lg"
          className="w-full justify-start gap-3"
          onClick={() => login({ loginMethods: ["email"] })}
        >
          <Mail className="h-5 w-5" />
          {t("email")}
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="w-full justify-start gap-3"
          onClick={() => login({ loginMethods: ["google"] })}
        >
          <Globe className="h-5 w-5" />
          {t("google")}
        </Button>
      </div>
    </div>
  );
}
