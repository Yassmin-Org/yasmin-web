"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/contexts/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { truncateAddress, copyToClipboard } from "@/lib/utils";
import { useBalance } from "@/lib/hooks/use-balance";
import {
  User,
  Wallet,
  Languages,
  Shield,
  Copy,
  Check,
  LogOut,
} from "lucide-react";
import { useState } from "react";

export default function ProfilePage() {
  const t = useTranslations("profile");
  const { user, logout } = useAuth();
  const { formattedBalance } = useBalance();
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    if (user?.walletAddress) {
      await copyToClipboard(user.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>

      {/* User Info */}
      <Card className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-yasmin/15 text-xl font-bold text-yasmin">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900">
            @{user.username}
          </p>
          <p className="text-sm text-gray-500">
            Balance: ${formattedBalance}
          </p>
        </div>
      </Card>

      {/* Wallet Address */}
      <Card className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Wallet className="h-4 w-4" />
          {t("walletAddress")}
        </div>
        <div className="flex items-center justify-between">
          <code className="text-sm text-gray-700">
            {truncateAddress(user.walletAddress, 10)}
          </code>
          <button
            onClick={handleCopyAddress}
            className="rounded p-1 hover:bg-gray-100"
          >
            {copied ? (
              <Check className="h-4 w-4 text-yasmin" />
            ) : (
              <Copy className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </div>
      </Card>

      {/* Settings Links */}
      <div className="space-y-2">
        <Link
          href="/kyc"
          className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 transition-colors hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium">Verification</span>
          </div>
        </Link>

        <button
          onClick={() => {
            const current = localStorage.getItem("selected_language") || "en";
            const newLang = current === "en" ? "ar" : "en";
            localStorage.setItem("selected_language", newLang);
            window.location.href = `/${newLang}/profile`;
          }}
          className="flex w-full items-center justify-between rounded-xl border border-gray-100 bg-white p-4 transition-colors hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <Languages className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium">{t("language")}</span>
          </div>
          <span className="text-sm text-gray-400">
            {localStorage.getItem("selected_language") === "ar"
              ? "العربية"
              : "English"}
          </span>
        </button>
      </div>

      {/* Logout */}
      <Button
        variant="danger"
        size="lg"
        className="w-full"
        onClick={logout}
      >
        <LogOut className="mr-2 h-4 w-4" />
        {t("logout")}
      </Button>
    </div>
  );
}
