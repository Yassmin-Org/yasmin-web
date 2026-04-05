"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { countries, pinnedCountries } from "@/lib/data/countries";
import { Check } from "lucide-react";

export default function LegalResidencePage() {
  const t = useTranslations("register");
  const tc = useTranslations("common");
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  const pinned = countries.filter((c) => pinnedCountries.includes(c.code));
  const others = countries.filter((c) => !pinnedCountries.includes(c.code));

  const toggleCountry = (code: string) => {
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleContinue = () => {
    localStorage.setItem(
      "yasmin_reg_legalResidence",
      JSON.stringify(selected)
    );
    router.push("/register/create-account");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("legalResidenceTitle")}
        </h1>
        <p className="text-sm text-gray-500">{t("legalResidenceSubtitle")}</p>
      </div>

      <div className="max-h-80 space-y-1 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2">
        {[...pinned, ...others].map((country) => (
          <button
            key={country.code}
            onClick={() => toggleCountry(country.code)}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors ${
              selected.includes(country.code)
                ? "bg-yasmin/10 text-yasmin-dark"
                : "hover:bg-gray-50"
            }`}
          >
            <span className="flex items-center gap-3">
              <span className="text-xl">{country.flag}</span>
              <span className="text-sm font-medium">{country.name}</span>
            </span>
            {selected.includes(country.code) && (
              <Check className="h-4 w-4 text-yasmin" />
            )}
          </button>
        ))}
      </div>

      <Button
        size="lg"
        className="w-full"
        disabled={selected.length === 0}
        onClick={handleContinue}
      >
        {tc("continue")}
      </Button>
    </div>
  );
}
