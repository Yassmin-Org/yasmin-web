"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AmountInput } from "@/components/ui/amount-input";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useGetKYCQuery } from "@/lib/api/slices/kyc";
import {
  useLazyGetDepositCountriesQuery,
  useLazyGetDepositCurrencyQuery,
  useLazyGetDepositRailQuery,
  useCreateDepositMutation,
} from "@/lib/api/slices/walapay";
import { ArrowLeft, Check, Copy, Shield, ChevronRight } from "lucide-react";
import { copyToClipboard, formatTimeRemaining } from "@/lib/utils";

type Step =
  | "check-kyc"
  | "select-country"
  | "select-currency"
  | "select-rail"
  | "amount"
  | "confirm"
  | "details";

export default function DepositPage() {
  const t = useTranslations("deposit");
  const tk = useTranslations("kyc");
  const tc = useTranslations("common");
  const router = useRouter();

  const { data: kycData, isLoading: kycLoading, isError: kycError } = useGetKYCQuery();
  const [fetchCountries, { data: countriesData }] = useLazyGetDepositCountriesQuery();
  const [fetchCurrencies, { data: currenciesData }] = useLazyGetDepositCurrencyQuery();
  const [fetchRails, { data: railsData }] = useLazyGetDepositRailQuery();
  const [createDeposit, { isLoading: creating }] = useCreateDepositMutation();

  const [step, setStep] = useState<Step>("check-kyc");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [selectedRail, setSelectedRail] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [depositDetails, setDepositDetails] = useState<Record<string, string>>({});
  const [countdown, setCountdown] = useState(300);
  const [copied, setCopied] = useState<string | null>(null);

  const kycStatus = kycData?.data;
  const isVerified = kycStatus?.status === "APPROVED" || kycStatus?.isYasminVerified;

  // Check KYC on load
  useEffect(() => {
    if (!kycLoading) {
      if (isVerified) {
        setStep("select-country");
        fetchCountries();
      }
    }
  }, [kycLoading, isVerified, fetchCountries]);

  // Countdown timer for deposit details
  useEffect(() => {
    if (step !== "details") return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const handleSelectCountry = (country: string) => {
    setSelectedCountry(country);
    fetchCurrencies({ country });
    setStep("select-currency");
  };

  const handleSelectCurrency = (currency: string) => {
    setSelectedCurrency(currency);
    fetchRails({ country: selectedCountry, currency });
    setStep("select-rail");
  };

  const handleSelectRail = (rail: string) => {
    setSelectedRail(rail);
    setStep("amount");
  };

  const handleCreateDeposit = async () => {
    try {
      const result = await createDeposit({
        amount: parseFloat(amount),
        currency: selectedCurrency,
        country: selectedCountry,
        rail: selectedRail,
        note: note || undefined,
      }).unwrap();
      setDepositDetails(result.data?.fundingInstructions || {});
      setCountdown(300);
      setStep("details");
    } catch {
      // Error handled by RTK Query
    }
  };

  const handleCopy = async (key: string, value: string) => {
    await copyToClipboard(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const countries = (countriesData as { data?: Array<{ code: string; name: string }> })?.data || [];
  const currencies = (currenciesData as { data?: Array<{ code: string; name: string }> })?.data || [];
  const rails = (railsData as { data?: Array<{ code: string; name: string }> })?.data || [];

  const goBack = () => {
    if (step === "details") router.push("/dashboard");
    else if (step === "confirm") setStep("amount");
    else if (step === "amount") setStep("select-rail");
    else if (step === "select-rail") setStep("select-currency");
    else if (step === "select-currency") setStep("select-country");
    else if (step === "select-country") router.back();
    else router.back();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={goBack} className="rounded-lg p-1 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>
      </div>

      {/* KYC Check */}
      {step === "check-kyc" && !kycLoading && (
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
            <Shield className="h-8 w-8 text-yellow-600" />
          </div>
          <h2 className="text-lg font-semibold">{tk("title")}</h2>
          <p className="text-sm text-gray-500">{tk("subtitle")}</p>
          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              const locale = localStorage.getItem("selected_language") || "en";
              window.location.href = `/${locale}/kyc`;
            }}
          >
            {tk("startVerification")}
          </Button>
        </div>
      )}

      {/* Country Selection */}
      {step === "select-country" && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">{t("selectCountry")}</p>
          <div className="space-y-2">
            {countries.map((country) => (
              <button
                key={country.code}
                onClick={() => handleSelectCountry(country.code)}
                className="flex w-full items-center justify-between rounded-xl border border-gray-100 bg-white p-4 transition-colors hover:bg-gray-50"
              >
                <span className="text-sm font-medium">{country.name}</span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
            ))}
            {countries.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-400">Loading countries...</p>
            )}
          </div>
        </div>
      )}

      {/* Currency Selection */}
      {step === "select-currency" && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">{t("selectPaymentMethod")}</p>
          <div className="space-y-2">
            {currencies.map((currency) => (
              <button
                key={currency.code}
                onClick={() => handleSelectCurrency(currency.code)}
                className="flex w-full items-center justify-between rounded-xl border border-gray-100 bg-white p-4 transition-colors hover:bg-gray-50"
              >
                <span className="text-sm font-medium">{currency.name || currency.code}</span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
            ))}
            {currencies.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-400">Loading currencies...</p>
            )}
          </div>
        </div>
      )}

      {/* Rail Selection */}
      {step === "select-rail" && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">{t("selectRail")}</p>
          <div className="space-y-2">
            {rails.map((rail) => (
              <button
                key={rail.code}
                onClick={() => handleSelectRail(rail.code)}
                className="flex w-full items-center justify-between rounded-xl border border-gray-100 bg-white p-4 transition-colors hover:bg-gray-50"
              >
                <span className="text-sm font-medium">{rail.name || rail.code}</span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
            ))}
            {rails.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-400">Loading payment methods...</p>
            )}
          </div>
        </div>
      )}

      {/* Amount */}
      {step === "amount" && (
        <div className="space-y-4">
          <AmountInput value={amount} onChange={setAmount} autoFocus />
          <Input
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <Button
            size="lg"
            className="w-full"
            disabled={!amount || parseFloat(amount) <= 0}
            onClick={() => setStep("confirm")}
          >
            {tc("continue")}
          </Button>
        </div>
      )}

      {/* Confirmation */}
      {step === "confirm" && (
        <div className="space-y-4">
          <Card className="space-y-3">
            <h2 className="font-semibold">{t("confirmation")}</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Amount</span>
                <span className="font-medium">${parseFloat(amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Currency</span>
                <span className="font-medium">{selectedCurrency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Method</span>
                <span className="font-medium">{selectedRail}</span>
              </div>
            </div>
          </Card>
          <Button
            size="lg"
            className="w-full"
            loading={creating}
            onClick={handleCreateDeposit}
          >
            {tc("confirm")}
          </Button>
        </div>
      )}

      {/* Deposit Details */}
      {step === "details" && (
        <div className="space-y-4">
          <div
            className={`rounded-lg p-3 text-center text-sm font-medium ${
              countdown <= 60
                ? "bg-red-50 text-red-700"
                : "bg-yellow-50 text-yellow-700"
            }`}
          >
            {t("timeRemaining")}: {formatTimeRemaining(countdown)}
          </div>

          <Card className="space-y-3">
            <h2 className="font-semibold">{t("details")}</h2>
            <div className="space-y-3">
              {Object.entries(depositDetails).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                >
                  <div>
                    <p className="text-xs text-gray-500">{key}</p>
                    <p className="text-sm font-medium text-gray-900">{value}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(key, value)}
                    className="rounded p-1 hover:bg-gray-200"
                  >
                    {copied === key ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </Card>

          <Button
            size="lg"
            className="w-full"
            onClick={() => router.push("/dashboard")}
          >
            {tc("done")}
          </Button>
        </div>
      )}
    </div>
  );
}
