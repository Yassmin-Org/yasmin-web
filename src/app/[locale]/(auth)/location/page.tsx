"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { MapPin, Globe } from "lucide-react";

export default function LocationPage() {
  const t = useTranslations("location");
  const router = useRouter();

  const handleSelect = (location: "LOCAL" | "FOREIGN") => {
    localStorage.setItem("yasmin_location", location);
    if (location === "LOCAL") {
      // Local users go directly to email signup
      router.push("/auth-method?local=true");
    } else {
      router.push("/auth-method");
    }
  };

  return (
    <div className="space-y-8 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-sm text-gray-500">{t("subtitle")}</p>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => handleSelect("LOCAL")}
          className="flex w-full items-center gap-4 rounded-2xl border-2 border-gray-200 bg-white p-5 text-left transition-colors hover:border-yasmin hover:bg-yasmin/10"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yasmin/15">
            <MapPin className="h-6 w-6 text-yasmin" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{t("local")}</p>
          </div>
        </button>

        <button
          onClick={() => handleSelect("FOREIGN")}
          className="flex w-full items-center gap-4 rounded-2xl border-2 border-gray-200 bg-white p-5 text-left transition-colors hover:border-yasmin hover:bg-yasmin/10"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
            <Globe className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{t("foreign")}</p>
          </div>
        </button>
      </div>
    </div>
  );
}
