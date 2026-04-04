"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { PrivyProvider, usePrivy } from "@privy-io/react-auth";
import { Provider } from "react-redux";
import { store } from "@/lib/api/store";
import { setGetAccessToken } from "@/lib/api/http-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { CheckoutProgress } from "@/components/checkout/checkout-progress";
import { LanguageSelector } from "@/components/checkout/language-selector";
import { countries } from "@/lib/data/countries";
import { copyToClipboard, formatTimeRemaining, truncateAddress } from "@/lib/utils";
import { generateConfirmationCode } from "@/lib/utils/confirmation-code";
import {
  ArrowLeft,
  Copy,
  Check,
  Wallet,
  CreditCard,
  ExternalLink,
  Download,
} from "lucide-react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";

type CheckoutStep =
  | "landing"
  | "crypto"
  | "crypto-success"
  | "fiat-details"
  | "fiat-kyc"
  | "fiat-deposit"
  | "success";

interface PaymentLinkData {
  id: string;
  code: string;
  amount: number;
  note?: string;
  receiverUserId: string;
  receiverUsername: string;
  receiverWalletAddress: string;
  isFulfilled: boolean;
  isCancelled: boolean;
  expiration: string;
}

function CheckoutContent() {
  const { code } = useParams<{ code: string }>();
  const { login, authenticated, ready, getAccessToken } = usePrivy();

  const [step, setStep] = useState<CheckoutStep>("landing");
  const [linkData, setLinkData] = useState<PaymentLinkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fiat flow state
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [citizenship, setCitizenship] = useState("");
  const [legalResidence, setLegalResidence] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);

  // KYC state
  const [kycUrl, setKycUrl] = useState<string | null>(null);

  // Deposit state
  const [depositDetails, setDepositDetails] = useState<Record<string, string>>({});
  const [countdown, setCountdown] = useState(300);

  // Crypto state
  const [copied, setCopied] = useState(false);

  // Success state
  const [confirmationCode, setConfirmationCode] = useState("");

  // Load payment link data
  useEffect(() => {
    const fetchLink = async () => {
      try {
        const res = await axios.get(`${API_URL}/transactions/payment-requests/${code}`);
        const data = res.data?.data || res.data;
        if (!data) throw new Error("Payment link not found");

        // Fetch receiver info
        let receiverUsername = "merchant";
        let receiverWallet = "";
        try {
          const userRes = await axios.get(`${API_URL}/users/id?username=${data.receiverUserId}`);
          const userData = userRes.data?.data || userRes.data;
          receiverUsername = userData?.username || "merchant";
          receiverWallet = userData?.walletAddress || "";
        } catch {
          // If we can't fetch user details, use ID
          receiverUsername = data.receiverUserId?.slice(0, 8) || "merchant";
        }

        setLinkData({
          id: data.id,
          code: data.code,
          amount: data.amount,
          note: data.note,
          receiverUserId: data.receiverUserId,
          receiverUsername,
          receiverWalletAddress: receiverWallet,
          isFulfilled: data.isFulfilled,
          isCancelled: data.isCancelled,
          expiration: data.expiration,
        });
      } catch {
        setError("Payment link not found or has expired.");
      }
      setLoading(false);
    };
    fetchLink();
  }, [code]);

  // Set Privy access token for API calls
  useEffect(() => {
    if (ready && authenticated) {
      setGetAccessToken(getAccessToken);
    }
  }, [ready, authenticated, getAccessToken]);

  // Countdown for deposit
  useEffect(() => {
    if (step !== "fiat-deposit") return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev <= 0 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const handleCopyAddress = async () => {
    if (linkData?.receiverWalletAddress) {
      await copyToClipboard(linkData.receiverWalletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCryptoSuccess = () => {
    setConfirmationCode(generateConfirmationCode());
    setStep("crypto-success");
  };

  // Create user silently after Privy auth
  const handleCreateUser = useCallback(async () => {
    if (!authenticated || creatingUser) return;
    setCreatingUser(true);

    try {
      const token = await getAccessToken();
      const headers = { Authorization: `Bearer ${token}` };

      // Generate username from email
      const prefix = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "").slice(0, 14);
      const suffix = Math.random().toString(36).slice(2, 6);
      const username = `${prefix}_${suffix}`;

      await axios.post(
        `${API_URL}/users`,
        {
          username,
          citizenship: [citizenship],
          legalResidence: [legalResidence],
          locationStatus: "FOREIGN",
          preferredLanguage: "en",
        },
        { headers }
      );

      // Now create KYC session
      try {
        const kycRes = await axios.post(
          `${API_URL}/kyc/didit/session`,
          {},
          { headers }
        );
        const kycData = kycRes.data?.data || kycRes.data;
        if (kycData?.url) {
          setKycUrl(kycData.url);
        }
      } catch {
        // KYC session creation may fail, continue
      }

      setStep("fiat-kyc");
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : "Failed to create account";
      setError(msg);
    }
    setCreatingUser(false);
  }, [authenticated, creatingUser, email, citizenship, legalResidence, getAccessToken]);

  // Handle fiat details submission
  const handleFiatDetails = async () => {
    if (!authenticated) {
      // Need to authenticate first
      await login({ loginMethods: ["email"] });
      return;
    }
    await handleCreateUser();
  };

  // Trigger user creation when Privy auth completes during fiat flow
  useEffect(() => {
    if (
      step === "fiat-details" &&
      authenticated &&
      email &&
      selectedCountry &&
      citizenship &&
      legalResidence &&
      !creatingUser
    ) {
      handleCreateUser();
    }
  }, [authenticated, step, email, selectedCountry, citizenship, legalResidence, creatingUser, handleCreateUser]);

  // Handle deposit creation after KYC
  const handleCreateDeposit = async () => {
    try {
      const token = await getAccessToken();
      const headers = { Authorization: `Bearer ${token}` };

      // Get available deposit countries/currencies/rails
      const countriesRes = await axios.get(
        `${API_URL}/walapay/deposit/countries`,
        { headers }
      );
      const depositCountries = countriesRes.data?.data || [];

      // Try to find customer's country in deposit options
      const countryMatch = depositCountries.find(
        (c: { code: string }) => c.code === selectedCountry
      );

      if (!countryMatch) {
        // Try Bridge
        const bridgeRes = await axios.get(
          `${API_URL}/bridge/deposit/countries`,
          { headers }
        );
        const bridgeCountries = bridgeRes.data?.data || [];
        const bridgeMatch = bridgeCountries.find(
          (c: { code: string }) => c.code === selectedCountry
        );

        if (!bridgeMatch) {
          setError("Deposits are not available in your country yet.");
          return;
        }
      }

      // Get currency
      const currRes = await axios.get(
        `${API_URL}/walapay/deposit/currency?country=${selectedCountry}`,
        { headers }
      );
      const currencies = currRes.data?.data || [];
      const currency = currencies[0]?.code || "USD";

      // Get rail
      const railRes = await axios.get(
        `${API_URL}/walapay/deposit/rail?country=${selectedCountry}&currency=${currency}`,
        { headers }
      );
      const rails = railRes.data?.data || [];
      const rail = rails[0]?.code || "bank_transfer";

      // Create deposit
      const depositRes = await axios.post(
        `${API_URL}/transactions/deposit`,
        {
          amount: linkData!.amount,
          currency,
          country: selectedCountry,
          rail,
        },
        { headers }
      );

      const depositData = depositRes.data?.data || depositRes.data;
      setDepositDetails(depositData?.fundingInstructions || {});
      setCountdown(300);
      setStep("fiat-deposit");
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : "Failed to create deposit";
      setError(msg);
    }
  };

  const handleDepositComplete = () => {
    setConfirmationCode(generateConfirmationCode());
    setStep("success");
  };

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
      </div>
    );
  }

  // Error or inactive link
  if (error || !linkData) {
    return (
      <Card className="w-full max-w-md space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
          <span className="text-xl">!</span>
        </div>
        <p className="text-sm text-red-600">{error || "Payment link not found"}</p>
      </Card>
    );
  }

  if (linkData.isCancelled) {
    return (
      <Card className="w-full max-w-md space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
          <span className="text-xl">✕</span>
        </div>
        <h2 className="text-lg font-semibold">Link Inactive</h2>
        <p className="text-sm text-gray-500">This payment link is no longer active.</p>
      </Card>
    );
  }

  const isExpired = new Date(linkData.expiration) < new Date();
  if (isExpired) {
    return (
      <Card className="w-full max-w-md space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
          <span className="text-xl">⏰</span>
        </div>
        <h2 className="text-lg font-semibold">Link Expired</h2>
        <p className="text-sm text-gray-500">This payment link has expired.</p>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md space-y-0 p-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        {step !== "landing" ? (
          <button
            onClick={() => {
              if (step === "crypto") setStep("landing");
              else if (step === "fiat-details") setStep("landing");
              else if (step === "fiat-kyc") setStep("fiat-details");
            }}
            className="rounded-lg p-1 hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4 text-gray-500" />
          </button>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-green-600">
            <span className="text-xs font-bold text-white">Y</span>
          </div>
          <span className="text-sm font-semibold text-gray-700">Yasmin</span>
        </div>
        <LanguageSelector />
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* LANDING */}
        {step === "landing" && (
          <>
            <div className="text-center space-y-1">
              <p className="text-sm text-gray-500">Pay @{linkData.receiverUsername}</p>
              <p className="text-3xl font-bold text-gray-900">
                ${linkData.amount.toFixed(2)}
              </p>
              {linkData.note && (
                <p className="text-sm text-gray-400">&ldquo;{linkData.note}&rdquo;</p>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setStep("crypto")}
                className="flex w-full items-center gap-4 rounded-xl border-2 border-gray-200 p-4 transition-colors hover:border-green-500 hover:bg-green-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                  <Wallet className="h-5 w-5 text-purple-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">Pay with Crypto</p>
                  <p className="text-xs text-gray-500">Send USDC on Base</p>
                </div>
              </button>

              <button
                onClick={() => setStep("fiat-details")}
                className="flex w-full items-center gap-4 rounded-xl border-2 border-gray-200 p-4 transition-colors hover:border-green-500 hover:bg-green-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">Pay with Card / Bank</p>
                  <p className="text-xs text-gray-500">Visa, Mastercard, Bank Transfer</p>
                </div>
              </button>
            </div>
          </>
        )}

        {/* CRYPTO PATH */}
        {step === "crypto" && (
          <div className="space-y-4 text-center">
            <p className="text-sm text-gray-500">
              Send exactly <span className="font-semibold">{linkData.amount.toFixed(2)} USDC</span>
            </p>
            <p className="text-xs text-gray-400">Network: Base</p>

            <div className="flex justify-center">
              <QRCodeSVG
                value={linkData.receiverWalletAddress}
                size={180}
                level="M"
              />
            </div>

            <div className="rounded-lg bg-gray-50 p-3">
              <p className="break-all text-xs font-mono text-gray-600">
                {linkData.receiverWalletAddress}
              </p>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleCopyAddress}
            >
              {copied ? (
                <Check className="mr-2 h-4 w-4" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              {copied ? "Copied!" : "Copy Address"}
            </Button>

            <div className="rounded-lg bg-yellow-50 p-3 text-xs text-yellow-700">
              Only send USDC on the Base network. Other tokens or networks will be lost.
            </div>

            <Button className="w-full" onClick={handleCryptoSuccess}>
              I&apos;ve sent the payment
            </Button>
          </div>
        )}

        {/* CRYPTO SUCCESS */}
        {step === "crypto-success" && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <Check className="h-7 w-7 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Payment Sent!</h2>
            <p className="text-sm text-gray-500">
              ${linkData.amount.toFixed(2)} to @{linkData.receiverUsername}
            </p>
            <Card className="bg-green-50 border-green-200">
              <p className="text-xs text-gray-500">Confirmation Code</p>
              <p className="text-2xl font-bold text-green-700">{confirmationCode}</p>
              <p className="mt-1 text-xs text-gray-400">Save this code as your receipt</p>
            </Card>
          </div>
        )}

        {/* FIAT: DETAILS */}
        {step === "fiat-details" && (
          <div className="space-y-4">
            <CheckoutProgress currentStep={1} totalSteps={4} />
            <h2 className="text-lg font-semibold text-gray-900">Your Details</h2>

            <Input
              label="Email"
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Full Name"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Country</label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm"
              >
                <option value="">Select country</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Citizenship</label>
              <select
                value={citizenship}
                onChange={(e) => setCitizenship(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm"
              >
                <option value="">Select citizenship</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Legal Residence</label>
              <select
                value={legalResidence}
                onChange={(e) => setLegalResidence(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm"
              >
                <option value="">Select legal residence</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <Button
              size="lg"
              className="w-full"
              disabled={!email || !fullName || !selectedCountry || !citizenship || !legalResidence}
              loading={creatingUser}
              onClick={handleFiatDetails}
            >
              Continue
            </Button>
          </div>
        )}

        {/* FIAT: KYC */}
        {step === "fiat-kyc" && (
          <div className="space-y-4">
            <CheckoutProgress currentStep={2} totalSteps={4} />
            <h2 className="text-lg font-semibold text-gray-900">Verify Your Identity</h2>

            {kycUrl ? (
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <iframe
                  src={kycUrl}
                  className="h-[500px] w-full"
                  allow="camera;microphone"
                />
              </div>
            ) : (
              <Card className="py-8 text-center">
                <p className="text-sm text-gray-500">
                  Verification is being prepared...
                </p>
              </Card>
            )}

            <Button
              size="lg"
              className="w-full"
              onClick={handleCreateDeposit}
            >
              I&apos;ve completed verification
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* FIAT: DEPOSIT DETAILS */}
        {step === "fiat-deposit" && (
          <div className="space-y-4">
            <CheckoutProgress currentStep={3} totalSteps={4} />
            <h2 className="text-lg font-semibold text-gray-900">Complete Payment</h2>

            <div
              className={`rounded-lg p-3 text-center text-sm font-medium ${
                countdown <= 60
                  ? "bg-red-50 text-red-700"
                  : "bg-yellow-50 text-yellow-700"
              }`}
            >
              {formatTimeRemaining(countdown)} remaining
            </div>

            <Card className="space-y-3">
              <p className="text-lg font-bold text-gray-900">
                ${linkData.amount.toFixed(2)}
              </p>
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
                    onClick={async () => {
                      await copyToClipboard(value);
                    }}
                    className="rounded p-1 hover:bg-gray-200"
                  >
                    <Copy className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              ))}
            </Card>

            <p className="text-xs text-center text-gray-400">
              Transfer this amount using your banking app
            </p>

            <Button
              size="lg"
              className="w-full"
              onClick={handleDepositComplete}
            >
              I&apos;ve completed the transfer
            </Button>
          </div>
        )}

        {/* SUCCESS */}
        {step === "success" && (
          <div className="space-y-4 text-center">
            <CheckoutProgress currentStep={4} totalSteps={4} />

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <Check className="h-7 w-7 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Payment Sent!</h2>
            <p className="text-sm text-gray-500">
              ${linkData.amount.toFixed(2)} to @{linkData.receiverUsername}
            </p>

            <Card className="bg-green-50 border-green-200">
              <p className="text-xs text-gray-500">Confirmation Code</p>
              <p className="text-2xl font-bold text-green-700">{confirmationCode}</p>
              <p className="mt-1 text-xs text-gray-400">Save this code as your receipt</p>
            </Card>

            <p className="text-xs text-gray-400">
              The merchant will receive your payment shortly.
            </p>

            <Button variant="outline" className="w-full" onClick={() => {}}>
              <Download className="mr-2 h-4 w-4" />
              Download Yasmin App
            </Button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 px-6 py-3 text-center">
        <p className="text-xs text-gray-400">Powered by Yasmin</p>
      </div>
    </Card>
  );
}

export default function PayPage() {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        appearance: { theme: "light", accentColor: "#16A34A" },
        embeddedWallets: { ethereum: { createOnLogin: "users-without-wallets" } },
        loginMethods: ["email"],
      }}
    >
      <Provider store={store}>
        <CheckoutContent />
      </Provider>
    </PrivyProvider>
  );
}
