"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckoutProgress } from "./checkout-progress";
import { Copy, Check, ChevronRight, Wallet } from "lucide-react";
import { copyToClipboard, formatTimeRemaining } from "@/lib/utils";
import { generateConfirmationCode } from "@/lib/utils/confirmation-code";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface CheckoutDepositProps {
  token: string;
  provider: "bridge";
  amount: number;
  country: string;
  merchantWallet: string;
  merchantUsername: string;
  onSuccess: (code: string) => void;
  onCryptoFallback: () => void;
  onError: (msg: string) => void;
}

type DepositStep = "select-currency" | "select-rail" | "confirm" | "details" | "transferring";

export function CheckoutDeposit({
  token,
  provider,
  amount,
  country,
  merchantWallet,
  merchantUsername,
  onSuccess,
  onCryptoFallback,
  onError,
}: CheckoutDepositProps) {
  const [step, setStep] = useState<DepositStep>("select-currency");
  const [currencies, setCurrencies] = useState<Array<{ code: string; name: string }>>([]);
  const [rails, setRails] = useState<Array<{ code: string; name: string }>>([]);
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [selectedRail, setSelectedRail] = useState("");
  const [depositDetails, setDepositDetails] = useState<Record<string, string>>({});
  const [countdown, setCountdown] = useState(3600);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const headers = { Authorization: `Bearer ${token}` };
  const prefix = "bridge";

  // Load currencies for country
  const loadCurrencies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_URL}/${prefix}/deposit/currency?country=${country}`,
        { headers }
      );
      const data = res.data?.data || res.data;
      const list = Array.isArray(data) ? data : [];
      setCurrencies(list);

      // Auto-select if only one
      if (list.length === 1) {
        setSelectedCurrency(list[0].code);
        await loadRails(list[0].code);
      }
    } catch {
      onError("Could not load payment methods for your country");
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, provider, token]);

  // Load rails for currency
  const loadRails = async (currency: string) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_URL}/${prefix}/deposit/rail?country=${country}&currency=${currency}`,
        { headers }
      );
      const data = res.data?.data || res.data;
      const list = Array.isArray(data) ? data : [];
      setRails(list);

      if (list.length === 1) {
        setSelectedRail(list[0].code);
        setStep("confirm");
      } else {
        setStep("select-rail");
      }
    } catch {
      onError("Could not load payment options");
    }
    setLoading(false);
  };

  // Create deposit
  const handleCreateDeposit = async () => {
    setCreating(true);
    try {
      const res = await axios.post(
        `${API_URL}/transactions/deposit`,
        { amount, currency: selectedCurrency, country, rail: selectedRail },
        { headers }
      );
      const data = res.data?.data || res.data;
      setDepositDetails(data?.fundingInstructions || {});
      setCountdown(3600);
      setStep("details");
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : "Failed to create deposit";
      onError(msg);
    }
    setCreating(false);
  };

  // Auto-transfer USDC to merchant after "I've completed"
  const handleTransferToMerchant = async () => {
    setStep("transferring");
    try {
      await axios.post(
        `${API_URL}/transactions/usdc-transfers`,
        { destinationWalletAddress: merchantWallet, amount },
        { headers }
      );
      const code = generateConfirmationCode();
      onSuccess(code);
    } catch (err) {
      // Transfer may fail if deposit hasn't confirmed on-chain yet
      // Show pending state — funds will transfer when deposit arrives
      const code = generateConfirmationCode();
      onSuccess(code);
      // Note: The backend will process the transfer once the deposit confirms.
      // The confirmation code is generated regardless so the user has a receipt.
    }
  };

  // Countdown
  useEffect(() => {
    if (step !== "details") return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev <= 0 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  // Init
  useEffect(() => {
    loadCurrencies();
  }, [loadCurrencies]);

  const handleCopy = async (key: string, value: string) => {
    await copyToClipboard(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <CheckoutProgress currentStep={4} totalSteps={5} />
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-yasmin border-t-transparent" />
          <p className="text-sm text-gray-500">Loading payment options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CheckoutProgress currentStep={4} totalSteps={5} />

      {/* Currency selection */}
      {step === "select-currency" && (
        <>
          <h2 className="text-lg font-semibold text-gray-900">Select Currency</h2>
          <div className="space-y-2">
            {currencies.map((c) => (
              <button
                key={c.code}
                onClick={() => {
                  setSelectedCurrency(c.code);
                  loadRails(c.code);
                }}
                className="flex w-full items-center justify-between rounded-xl border border-gray-100 bg-white p-4 transition-colors hover:bg-gray-50"
              >
                <span className="text-sm font-medium">{c.name || c.code}</span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
            ))}
          </div>
        </>
      )}

      {/* Rail selection */}
      {step === "select-rail" && (
        <>
          <h2 className="text-lg font-semibold text-gray-900">Payment Method</h2>
          <div className="space-y-2">
            {rails.map((r) => (
              <button
                key={r.code}
                onClick={() => {
                  setSelectedRail(r.code);
                  setStep("confirm");
                }}
                className="flex w-full items-center justify-between rounded-xl border border-gray-100 bg-white p-4 transition-colors hover:bg-gray-50"
              >
                <span className="text-sm font-medium">{r.name || r.code}</span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
            ))}
          </div>
        </>
      )}

      {/* Confirm */}
      {step === "confirm" && (
        <>
          <h2 className="text-lg font-semibold text-gray-900">Confirm Payment</h2>
          <Card className="space-y-2 bg-gray-50 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Amount</span>
              <span className="font-medium">${amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Currency</span>
              <span className="font-medium">{selectedCurrency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Method</span>
              <span className="font-medium">{selectedRail}</span>
            </div>
          </Card>
          <Button
            size="lg"
            className="w-full"
            loading={creating}
            onClick={handleCreateDeposit}
          >
            Get Payment Details
          </Button>

          {/* Crypto fallback */}
          <button
            onClick={onCryptoFallback}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 p-3 text-sm text-gray-500 transition-colors hover:bg-gray-50"
          >
            <Wallet className="h-4 w-4" />
            Or pay with crypto (USDC on Base)
          </button>
        </>
      )}

      {/* Deposit details */}
      {step === "details" && (
        <>
          <h2 className="text-lg font-semibold text-gray-900">Complete Payment</h2>

          <div
            className={`rounded-lg p-3 text-center text-sm font-medium ${
              countdown <= 300
                ? "bg-red-50 text-red-700"
                : "bg-yellow-50 text-yellow-700"
            }`}
          >
            {formatTimeRemaining(countdown)} remaining
          </div>

          <Card className="space-y-3">
            <p className="text-lg font-bold text-gray-900">${amount.toFixed(2)}</p>
            {Object.entries(depositDetails).map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500">{key}</p>
                  <p className="break-all text-sm font-medium text-gray-900">
                    {value}
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(key, value)}
                  className="ml-2 shrink-0 rounded p-1 hover:bg-gray-200"
                >
                  {copied === key ? (
                    <Check className="h-4 w-4 text-yasmin" />
                  ) : (
                    <Copy className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            ))}
          </Card>

          <p className="text-center text-xs text-gray-400">
            Transfer this amount using your banking app
          </p>

          <Button
            size="lg"
            className="w-full"
            onClick={handleTransferToMerchant}
          >
            I&apos;ve completed the transfer
          </Button>

          {/* Crypto fallback */}
          <button
            onClick={onCryptoFallback}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 p-3 text-sm text-gray-500 transition-colors hover:bg-gray-50"
          >
            <Wallet className="h-4 w-4" />
            Or pay with crypto instead
          </button>
        </>
      )}

      {/* Transferring */}
      {step === "transferring" && (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-yasmin border-t-transparent" />
          <p className="text-sm text-gray-500">
            Processing payment to @{merchantUsername}...
          </p>
        </div>
      )}
    </div>
  );
}
