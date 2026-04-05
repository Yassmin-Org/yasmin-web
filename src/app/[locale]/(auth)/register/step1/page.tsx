"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLazyCheckAvailabilityQuery } from "@/lib/api/slices/users";
import { Check, X } from "lucide-react";

export default function RegisterStep1() {
  const t = useTranslations("register");
  const tc = useTranslations("common");
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [checkAvailability, { isLoading }] = useLazyCheckAvailabilityQuery();

  const isValid = /^[a-zA-Z0-9]{3,20}$/.test(username);

  useEffect(() => {
    if (!isValid) {
      setIsAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const result = await checkAvailability({ username }).unwrap();
        setIsAvailable(result.data?.isAvailable ?? true);
      } catch {
        // If API is unreachable, assume available so user can proceed
        setIsAvailable(true);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username, isValid, checkAvailability]);

  const handleContinue = () => {
    if (isAvailable) {
      localStorage.setItem("yasmin_reg_username", username);
      router.push("/register/citizenship");
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold text-gray-900">{t("step1Title")}</h1>
        <p className="text-sm text-gray-500">{t("step1Subtitle")}</p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Input
            id="username"
            placeholder={t("usernamePlaceholder")}
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            hint={t("usernameHint")}
            error={
              username && !isValid
                ? t("usernameHint")
                : isAvailable === false
                ? t("usernameTaken")
                : undefined
            }
          />
          {isValid && isAvailable !== null && (
            <div className="absolute right-3 top-3">
              {isAvailable ? (
                <Check className="h-5 w-5 text-yasmin" />
              ) : (
                <X className="h-5 w-5 text-red-500" />
              )}
            </div>
          )}
        </div>

        {isAvailable && (
          <p className="text-sm text-yasmin">{t("usernameAvailable")}</p>
        )}

        <Button
          size="lg"
          className="w-full"
          disabled={!isAvailable || isLoading}
          onClick={handleContinue}
        >
          {tc("continue")}
        </Button>
      </div>
    </div>
  );
}
