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
  useGetWalapayOptionsQuery,
  useCreateDepositMutation,
} from "@/lib/api/slices/walapay";
import { ArrowLeft, Check, Copy, Shield, ChevronRight } from "lucide-react";
import { copyToClipboard, formatTimeRemaining } from "@/lib/utils";
import { Link } from "@/i18n/navigation";

type Step =
  | "check-kyc"
  | "select-country"
  | "select-payment"
  | "amount"
  | "confirm"
  | "details";

export default function DepositPage() {
  const t = useTranslations("deposit");
  const tk = useTranslations("kyc");
  const tc = useTranslations("common");
  const router = useRouter();

  const { data: kycData, isLoading: kycLoading } = useGetKYCQuery();
  const { data: optionsData } = useGetWalapayOptionsQuery();
  const [createDeposit, { isLoading: creating }] = useCreateDepositMutation();

  const [step, setStep] = useState<Step>("check-kyc");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCurrency, setSelectedCurrency] = useState<string>("");
  const [selectedRail, setSelectedRail] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [depositDetails, setDepositDetails] = useState<Record<string, string>>(
    {}
  );
  const [countdown, setCountdown] = useState(300); // 5 minutes
  const [copied, setCopied] = useState<string | null>(null);

  const kycStatus = kycData?.data?.status;
  const isVerified =
    kycStatus === "APPROVED" || kycData?.data?.isYasminVerified;
  const countries = optionsData?.data?.countries || [];

  // Check KYC on load
  useEffect(() => {
    if (!kycLoading) {
      if (isVerified) {
        setStep("select-country");
      }
    }
  }, [kycLoading, isVerified]);

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

  const handleCreateDeposit = async () => {
    try {
      const result = await createDeposit({
        amount: parseFloat(amount),
        currency: selectedCurrency,
        country: selectedCountry,
        rail: selectedRail,
        note: note || undefined,
      }).unwrap();
      setDepositDetails(result.data.fundingInstructions || {});
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

  const selectedCountryData = countries.find(
    (c) => c.code === selectedCountry
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (step === "details") {
              router.push("/dashboard");
            } else if (step === "confirm") setStep("amount");
            else if (step === "amount") setStep("select-payment");
            else if (step === "select-payment") setStep("select-country");
            else router.back();
          }}
          className="rounded-lg p-1 hover:bg-gray-100"
        >
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
          <Link href="/kyc">
            <Button size="lg" className="w-full">
              {tk("startVerification")}
            </Button>
          </Link>
        </div>
      )}

      {/* Country Selection */}
      {step === "select-country" && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">
            {t("selectCountry")}
          </p>
          <div className="space-y-2">
            {countries.map((country) => (
              <button
                key={country.code}
                onClick={() => {
                  setSelectedCountry(country.code);
                  if (country.currencies.length === 1) {
                    setSelectedCurrency(country.currencies[0]);
                    if (country.rails.length === 1) {
                      setSelectedRail(country.rails[0]);
                      setStep("amount");
                    } else {
                      setStep("select-payment");
                    }
                  } else {
                    setStep("select-payment");
                  }
                }}
                className="flex w-full items-center justify-between rounded-xl border border-gray-100 bg-white p-4 transition-colors hover:bg-gray-50"
              >
                <span className="text-sm font-medium">{country.name}</span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Payment Method Selection */}
      {step === "select-payment" && selectedCountryData && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">
            {t("selectPaymentMethod")}
          </p>
          {selectedCountryData.currencies.map((currency) =>
            selectedCountryData.rails.map((rail) => (
              <button
                key={`${currency}-${rail}`}
                onClick={() => {
                  setSelectedCurrency(currency);
                  setSelectedRail(rail);
                  setStep("amount");
                }}
                className="flex w-full items-center justify-between rounded-xl border border-gray-100 bg-white p-4 transition-colors hover:bg-gray-50"
              >
                <div>
                  <p className="text-sm font-medium">{rail}</p>
                  <p className="text-xs text-gray-400">{currency}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
            ))
          )}
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
                <span className="font-medium">
                  ${parseFloat(amount).toFixed(2)}
                </span>
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
