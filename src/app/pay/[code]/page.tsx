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
import { copyToClipboard, formatTimeRemaining } from "@/lib/utils";
import { generateConfirmationCode } from "@/lib/utils/confirmation-code";
import {
  ArrowLeft,
  Copy,
  Check,
  Wallet,
  CreditCard,
  ExternalLink,
  Download,
  AlertTriangle,
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
  const params = useParams();
  const code = typeof params.code === "string" ? params.code : "";
  const { login, authenticated, ready, getAccessToken } = usePrivy();

  const [step, setStep] = useState<CheckoutStep>("landing");
  const [linkData, setLinkData] = useState<PaymentLinkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fiat flow state
  const [email, setEmail] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [citizenship, setCitizenship] = useState("");
  const [legalResidence, setLegalResidence] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);
  const [userCreated, setUserCreated] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

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
    if (!code) return;
    const fetchLink = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/transactions/payment-requests/${code}`
        );
        const data = res.data?.data || res.data;
        if (!data) throw new Error("Payment link not found");

        let receiverUsername = "merchant";
        let receiverWallet = "";

        // Try to get receiver info from the response
        const receiver = data.receiver;
        if (receiver?.firstName) {
          receiverUsername = receiver.firstName;
        }

        // Check URL params for wallet address (passed when creating link)
        if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search);
          const walletParam = urlParams.get("w");
          if (walletParam) {
            receiverWallet = walletParam;
          }
        }

        // Try fetching user info via search (public endpoint)
        if (!receiverWallet) {
          try {
            const searchRes = await axios.get(
              `${API_URL}/users/availability?username=${data.receiverUserId}`,
            );
            // If user found, the receiverUserId might be a username
            if (searchRes.data?.data?.isAvailable === false) {
              receiverUsername = data.receiverUserId;
            }
          } catch {
            // Ignore
          }
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
      setLoggingIn(false);
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
    if (!authenticated || creatingUser || userCreated) return;
    setCreatingUser(true);
    setError(null);

    try {
      const token = await getAccessToken();
      const headers = { Authorization: `Bearer ${token}` };

      // Step 1: Create user (skip if already exists)
      try {
        const prefix = email
          .split("@")[0]
          .replace(/[^a-zA-Z0-9]/g, "")
          .slice(0, 14);
        const suffix = Math.random().toString(36).replace(/[^a-z0-9]/g, "").slice(0, 4);
        const username = `${prefix}${suffix}`.slice(0, 20);

        await axios.post(
          `${API_URL}/users`,
          {
            username,
            isAgent: false,
            email,
            citizenship: [citizenship],
            legalResidence: [legalResidence],
            preferredLanguage: "en",
          },
          { headers }
        );
      } catch (err: unknown) {
        // 409 = user already exists — fine, continue
        if (!axios.isAxiosError(err) || err.response?.status !== 409) {
          const msg = axios.isAxiosError(err)
            ? err.response?.data?.message || err.message
            : "Failed to create account";
          setError(msg);
          setCreatingUser(false);
          return;
        }
      }

      setUserCreated(true);

      // Step 2: Create KYC session
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
        // KYC session may fail, continue anyway
      }

      setStep("fiat-kyc");
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : "Something went wrong";
      setError(msg);
    }
    setCreatingUser(false);
  }, [authenticated, creatingUser, userCreated, email, citizenship, legalResidence, getAccessToken]);

  // Handle fiat details — step 1: validate form, step 2: Privy login, step 3: create user
  const handleFiatDetails = async () => {
    if (!email || !selectedCountry || !citizenship || !legalResidence) return;

    if (!authenticated) {
      // Open Privy OTP modal — user verifies email
      setLoggingIn(true);
      try {
        await login({ loginMethods: ["email"] });
        // After login completes, authenticated will be true
        // but we need to wait for the token to be ready
      } catch {
        setLoggingIn(false);
        return;
      }
      setLoggingIn(false);
      // Don't proceed here — the useEffect below will handle it
      return;
    }

    // Already authenticated — create user directly
    await handleCreateUser();
  };

  // After Privy auth completes, auto-create user (runs once)
  useEffect(() => {
    if (
      step === "fiat-details" &&
      ready &&
      authenticated &&
      !creatingUser &&
      !userCreated &&
      email &&
      selectedCountry &&
      citizenship &&
      legalResidence
    ) {
      handleCreateUser();
    }
    // Only re-run when authenticated or userCreated changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, userCreated]);

  // Handle deposit creation after KYC
  const handleCreateDeposit = async () => {
    if (!linkData) {
      setError("Payment link data missing.");
      return;
    }

    setError(null);

    try {
      const token = await getAccessToken();
      const headers = { Authorization: `Bearer ${token}` };

      // Check Walapay countries first
      let provider: "walapay" | "bridge" = "walapay";
      try {
        const countriesRes = await axios.get(
          `${API_URL}/walapay/deposit/countries`,
          { headers }
        );
        const depositCountries = countriesRes.data?.data || [];
        const match = depositCountries.find(
          (c: { code: string }) => c.code === selectedCountry
        );
        if (!match) provider = "bridge";
      } catch {
        provider = "bridge";
      }

      // If Bridge, check Bridge countries
      if (provider === "bridge") {
        try {
          const bridgeRes = await axios.get(
            `${API_URL}/bridge/deposit/countries`,
            { headers }
          );
          const bridgeCountries = bridgeRes.data?.data || [];
          const bridgeMatch = bridgeCountries.find(
            (c: { code: string }) => c.code === selectedCountry
          );
          if (!bridgeMatch) {
            setError(
              "Deposits are not available in your country yet. Please try paying with crypto."
            );
            return;
          }
        } catch {
          setError("Could not verify deposit availability. Please try again.");
          return;
        }
      }

      // Get currency
      const currUrl =
        provider === "walapay"
          ? `${API_URL}/walapay/deposit/currency?country=${selectedCountry}`
          : `${API_URL}/bridge/deposit/currency?country=${selectedCountry}`;
      const currRes = await axios.get(currUrl, { headers });
      const currencies = currRes.data?.data || [];

      if (currencies.length === 0) {
        setError("No payment methods available for your country.");
        return;
      }
      const currency = currencies[0]?.code;

      // Get rail
      const railUrl =
        provider === "walapay"
          ? `${API_URL}/walapay/deposit/rail?country=${selectedCountry}&currency=${currency}`
          : `${API_URL}/bridge/deposit/rail?country=${selectedCountry}&currency=${currency}`;
      const railRes = await axios.get(railUrl, { headers });
      const rails = railRes.data?.data || [];

      if (rails.length === 0) {
        setError("No payment rails available for your country and currency.");
        return;
      }
      const rail = rails[0]?.code;

      // Create deposit
      const depositRes = await axios.post(
        `${API_URL}/transactions/deposit`,
        {
          amount: linkData.amount,
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

  // Error or missing link
  if (!linkData && error) {
    return (
      <Card className="w-full max-w-md space-y-4 p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <p className="text-sm text-red-600">{error}</p>
      </Card>
    );
  }

  if (!linkData) return null;

  if (linkData.isCancelled) {
    return (
      <Card className="w-full max-w-md space-y-4 p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
          <AlertTriangle className="h-6 w-6 text-gray-400" />
        </div>
        <h2 className="text-lg font-semibold">Link Inactive</h2>
        <p className="text-sm text-gray-500">
          This payment link is no longer active.
        </p>
      </Card>
    );
  }

  const expirationDate = new Date(linkData.expiration);
  const isExpired =
    !isNaN(expirationDate.getTime()) && expirationDate < new Date();
  if (isExpired) {
    return (
      <Card className="w-full max-w-md space-y-4 p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
          <AlertTriangle className="h-6 w-6 text-gray-400" />
        </div>
        <h2 className="text-lg font-semibold">Link Expired</h2>
        <p className="text-sm text-gray-500">
          This payment link has expired.
        </p>
      </Card>
    );
  }

  const hasWallet = !!linkData.receiverWalletAddress;

  return (
    <Card className="w-full max-w-md overflow-hidden p-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        {step !== "landing" ? (
          <button
            onClick={() => {
              setError(null);
              if (step === "crypto" || step === "fiat-details")
                setStep("landing");
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

      <div className="space-y-6 px-6 py-6">
        {/* Error banner */}
        {error && step !== "landing" && (
          <div className="rounded-lg bg-red-50 p-3 text-center text-sm text-red-700">
            {error}
          </div>
        )}

        {/* LANDING */}
        {step === "landing" && (
          <>
            <div className="space-y-1 text-center">
              <p className="text-sm text-gray-500">
                Pay @{linkData.receiverUsername}
              </p>
              <p className="text-3xl font-bold text-gray-900">
                ${linkData.amount.toFixed(2)}
              </p>
              {linkData.note && (
                <p className="text-sm text-gray-400">
                  &ldquo;{linkData.note}&rdquo;
                </p>
              )}
            </div>

            <div className="space-y-3">
              {hasWallet && (
                <button
                  onClick={() => setStep("crypto")}
                  className="flex w-full items-center gap-4 rounded-xl border-2 border-gray-200 p-4 transition-colors hover:border-green-500 hover:bg-green-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                    <Wallet className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">
                      Pay with Crypto
                    </p>
                    <p className="text-xs text-gray-500">Send USDC on Base</p>
                  </div>
                </button>
              )}

              <button
                onClick={() => setStep("fiat-details")}
                className="flex w-full items-center gap-4 rounded-xl border-2 border-gray-200 p-4 transition-colors hover:border-green-500 hover:bg-green-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">
                    Pay with Card / Bank
                  </p>
                  <p className="text-xs text-gray-500">
                    Visa, Mastercard, Bank Transfer
                  </p>
                </div>
              </button>
            </div>
          </>
        )}

        {/* CRYPTO PATH */}
        {step === "crypto" && hasWallet && (
          <div className="space-y-4 text-center">
            <div className="rounded-xl bg-blue-50 p-4">
              <p className="text-sm text-gray-700">
                Send exactly{" "}
                <span className="font-bold text-blue-600">
                  {linkData.amount.toFixed(2)} USDC
                </span>
              </p>
              <p className="mt-1 text-sm text-gray-700">
                Network:{" "}
                <span className="font-bold text-blue-600">Base</span>
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <p className="mb-2 text-xs text-gray-500">Send to this address</p>
              <p className="break-all font-mono text-sm text-gray-800">
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
              Only send <span className="font-semibold">USDC</span> on the{" "}
              <span className="font-semibold">Base</span> network. Other tokens
              or networks will be lost.
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
            <h2 className="text-lg font-semibold text-gray-900">
              Payment Sent!
            </h2>
            <p className="text-sm text-gray-500">
              ${linkData.amount.toFixed(2)} to @{linkData.receiverUsername}
            </p>
            <Card className="border-green-200 bg-green-50">
              <p className="text-xs text-gray-500">Confirmation Code</p>
              <p className="text-2xl font-bold text-green-700">
                {confirmationCode}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Save this code as your receipt
              </p>
            </Card>
          </div>
        )}

        {/* FIAT: DETAILS */}
        {step === "fiat-details" && (
          <div className="space-y-4">
            <CheckoutProgress currentStep={1} totalSteps={4} />
            <h2 className="text-lg font-semibold text-gray-900">
              Your Details
            </h2>

            <Input
              label="Email"
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Country
              </label>
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
              <label className="block text-sm font-medium text-gray-700">
                Citizenship
              </label>
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
              <label className="block text-sm font-medium text-gray-700">
                Legal Residence
              </label>
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
              disabled={
                !email || !selectedCountry || !citizenship || !legalResidence
              }
              loading={creatingUser || loggingIn}
              onClick={handleFiatDetails}
            >
              {loggingIn ? "Verifying email..." : "Continue"}
            </Button>
          </div>
        )}

        {/* FIAT: KYC */}
        {step === "fiat-kyc" && (
          <div className="space-y-4">
            <CheckoutProgress currentStep={2} totalSteps={4} />
            <h2 className="text-lg font-semibold text-gray-900">
              Verify Your Identity
            </h2>

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
            <h2 className="text-lg font-semibold text-gray-900">
              Complete Payment
            </h2>

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
                      try {
                        await copyToClipboard(value);
                      } catch {
                        // clipboard may not be available
                      }
                    }}
                    className="rounded p-1 hover:bg-gray-200"
                  >
                    <Copy className="h-4 w-4 text-gray-400" />
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
            <h2 className="text-lg font-semibold text-gray-900">
              Payment Sent!
            </h2>
            <p className="text-sm text-gray-500">
              ${linkData.amount.toFixed(2)} to @{linkData.receiverUsername}
            </p>

            <Card className="border-green-200 bg-green-50">
              <p className="text-xs text-gray-500">Confirmation Code</p>
              <p className="text-2xl font-bold text-green-700">
                {confirmationCode}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Save this code as your receipt
              </p>
            </Card>

            <p className="text-xs text-gray-400">
              The merchant will receive your payment shortly.
            </p>

            <Button variant="outline" className="w-full">
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
        embeddedWallets: {
          ethereum: { createOnLogin: "users-without-wallets" },
        },
        loginMethods: ["email"],
      }}
    >
      <Provider store={store}>
        <CheckoutContent />
      </Provider>
    </PrivyProvider>
  );
}
