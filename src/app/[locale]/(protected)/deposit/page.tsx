"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AmountInput } from "@/components/ui/amount-input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/contexts/auth-context";
import { useBalance } from "@/lib/hooks/use-balance";
import {
  useCreateUsdcTransferMutation,
} from "@/lib/api/slices/transactions";
import {
  ArrowLeft,
  Wallet,
  MapPin,
  Check,
  Shield,
  Search,
  ChevronDown,
} from "lucide-react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

type CashoutStep =
  | "select"
  | "crypto-form"
  | "crypto-success"
  | "agent-form"
  | "agent-success";

export default function CashoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { balance, formattedBalance } = useBalance();

  const [step, setStep] = useState<CashoutStep>("select");
  const [error, setError] = useState<string | null>(null);

  // Crypto state
  const [walletAddress, setWalletAddress] = useState("");
  const [cryptoAmount, setCryptoAmount] = useState("");
  const [cashoutFee, setCashoutFee] = useState<number | null>(null);
  const [createCashout, { isLoading: cashingOut }] = useCreateUsdcTransferMutation();

  // Agent state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [agentLocation, setAgentLocation] = useState("");
  const [agentAmount, setAgentAmount] = useState("");
  const [agentFee, setAgentFee] = useState<number | null>(null);
  const [submittingAgent, setSubmittingAgent] = useState(false);

  // Location search state
  const [locations, setLocations] = useState<string[]>([]);
  const [locationSearch, setLocationSearch] = useState("");
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);

  const isVerified = user?.walletAddress !== "0x0000000000000000000000000000000000000000";

  // Fetch locations from backend
  const fetchLocations = useCallback(async (search?: string) => {
    setLoadingLocations(true);
    try {
      const url = search
        ? `${API_URL}/agents/locations/search?query=${encodeURIComponent(search)}`
        : `${API_URL}/agents/locations?page=1&limit=50`;
      const res = await axios.get(url);
      const data = res.data?.data || res.data;
      setLocations(data?.locations || []);
    } catch {
      setLocations([]);
    }
    setLoadingLocations(false);
  }, []);

  // Fetch locations when agent form opens
  useEffect(() => {
    if (step === "agent-form") {
      fetchLocations();
    }
  }, [step, fetchLocations]);

  // Search locations with debounce
  useEffect(() => {
    if (step !== "agent-form") return;
    const timer = setTimeout(() => {
      fetchLocations(locationSearch || undefined);
    }, 300);
    return () => clearTimeout(timer);
  }, [locationSearch, step, fetchLocations]);

  // Fetch USDC cashout fee
  const fetchCashoutFee = async () => {
    try {
      const token = localStorage.getItem("yasmin_pin") ? "auth" : "";
      const res = await axios.get(`${API_URL}/fees/usdc-cashout`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data?.data || res.data;
      setCashoutFee(data?.fee || data?.cashoutFee || 0);
    } catch {
      setCashoutFee(0);
    }
  };

  // Validate wallet address
  const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(walletAddress);
  const isSameWallet = walletAddress.toLowerCase() === user?.walletAddress?.toLowerCase();

  // Handle crypto cashout
  const handleCryptoCashout = async () => {
    if (!isValidAddress || isSameWallet) return;
    setError(null);
    try {
      await createCashout({
        destinationWalletAddress: walletAddress,
        amount: parseFloat(cryptoAmount),
      }).unwrap();
      setStep("crypto-success");
    } catch (err: unknown) {
      const apiErr = err as { message?: string; data?: { message?: string } };
      setError(apiErr?.data?.message || apiErr?.message || "Cashout failed");
    }
  };

  // Handle agent cashout
  const handleAgentCashout = async () => {
    setError(null);
    setSubmittingAgent(true);
    try {
      const token = await fetch(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer placeholder` },
      });
      // Use the cash-out-requests endpoint
      await axios.post(
        `${API_URL}/cash-out-requests`,
        {
          firstName,
          lastName,
          phoneNumber: `+963${phoneNumber}`,
          amount: parseFloat(agentAmount),
          location: agentLocation,
        },
        { headers: { "Content-Type": "application/json" } }
      );
      setStep("agent-success");
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr?.message || "Failed to submit cashout request");
    }
    setSubmittingAgent(false);
  };

  const goBack = () => {
    setError(null);
    if (step === "crypto-form" || step === "agent-form") setStep("select");
    else router.back();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={goBack} className="rounded-lg p-1 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Cash Out</h1>
      </div>

      {/* Balance */}
      <Card className="flex items-center justify-between bg-gray-50 p-4">
        <span className="text-sm text-gray-500">Available Balance</span>
        <span className="text-lg font-bold text-gray-900">${formattedBalance}</span>
      </Card>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-center text-sm text-red-700">
          {error}
        </div>
      )}

      {/* SELECT METHOD */}
      {step === "select" && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Choose cashout method</p>

          <button
            onClick={() => {
              fetchCashoutFee();
              setStep("crypto-form");
            }}
            className="flex w-full items-center gap-4 rounded-2xl border-2 border-gray-200 bg-white p-5 text-left transition-colors hover:border-green-500 hover:bg-green-50"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
              <Wallet className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">USDC Withdrawal</p>
              <p className="text-xs text-gray-500">
                Send USDC to any wallet on Base
              </p>
            </div>
          </button>

          <button
            onClick={() => {
              if (!isVerified) {
                setError("KYC verification required for agent cashout");
                return;
              }
              setStep("agent-form");
            }}
            className="flex w-full items-center gap-4 rounded-2xl border-2 border-gray-200 bg-white p-5 text-left transition-colors hover:border-green-500 hover:bg-green-50"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
              <MapPin className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Cash Out via Agent</p>
              <p className="text-xs text-gray-500">
                Receive cash from a local agent
              </p>
              {!isVerified && (
                <p className="mt-1 flex items-center gap-1 text-xs text-yellow-600">
                  <Shield className="h-3 w-3" /> KYC required
                </p>
              )}
            </div>
          </button>
        </div>
      )}

      {/* CRYPTO FORM */}
      {step === "crypto-form" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">USDC Withdrawal</h2>

          <Input
            label="Destination Wallet Address"
            placeholder="0x..."
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value.trim())}
            error={
              walletAddress && !isValidAddress
                ? "Invalid wallet address"
                : isSameWallet
                ? "Cannot send to your own wallet"
                : undefined
            }
          />

          <AmountInput
            value={cryptoAmount}
            onChange={setCryptoAmount}
            maxAmount={balance}
            error={
              cryptoAmount && parseFloat(cryptoAmount) > balance
                ? "Insufficient balance"
                : parseFloat(cryptoAmount) < 5 && cryptoAmount
                ? "Minimum $5.00"
                : undefined
            }
          />

          {cryptoAmount && parseFloat(cryptoAmount) >= 5 && (
            <Card className="space-y-2 bg-gray-50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Amount</span>
                <span className="font-medium">${parseFloat(cryptoAmount).toFixed(2)}</span>
              </div>
              {cashoutFee !== null && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Fee</span>
                  <span className="font-medium">${cashoutFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <span className="font-medium text-gray-700">You receive</span>
                <span className="font-bold text-gray-900">
                  ${(parseFloat(cryptoAmount) - (cashoutFee || 0)).toFixed(2)}
                </span>
              </div>
            </Card>
          )}

          <Button
            size="lg"
            className="w-full"
            disabled={
              !isValidAddress ||
              isSameWallet ||
              !cryptoAmount ||
              parseFloat(cryptoAmount) < 5 ||
              parseFloat(cryptoAmount) > balance
            }
            loading={cashingOut}
            onClick={handleCryptoCashout}
          >
            Withdraw USDC
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
            Withdrawal Submitted!
          </h2>
          <p className="text-sm text-gray-500">
            ${parseFloat(cryptoAmount).toFixed(2)} USDC sent to
          </p>
          <p className="break-all rounded-lg bg-gray-50 p-3 font-mono text-xs text-gray-600">
            {walletAddress}
          </p>
          <Button
            size="lg"
            className="w-full"
            onClick={() => router.push("/dashboard")}
          >
            Back to Dashboard
          </Button>
        </div>
      )}

      {/* AGENT FORM */}
      {step === "agent-form" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Cash Out via Agent
          </h2>

          <Input
            label="First Name"
            placeholder="Enter first name"
            value={firstName}
            onChange={(e) =>
              setFirstName(e.target.value.replace(/[^a-zA-Z\u0600-\u06FF\s]/g, ""))
            }
          />

          <Input
            label="Last Name"
            placeholder="Enter last name"
            value={lastName}
            onChange={(e) =>
              setLastName(e.target.value.replace(/[^a-zA-Z\u0600-\u06FF\s]/g, ""))
            }
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <div className="flex gap-2">
              <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500">
                +963
              </div>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="9XXXXXXXX"
                value={phoneNumber}
                onChange={(e) =>
                  setPhoneNumber(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Location
            </label>
            <div className="relative">
              <div
                onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm"
              >
                <span className={agentLocation ? "text-gray-900" : "text-gray-400"}>
                  {agentLocation || "Select location"}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>

              {showLocationDropdown && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                  <div className="sticky top-0 border-b border-gray-100 bg-white p-2">
                    <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                      <Search className="h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search locations..."
                        value={locationSearch}
                        onChange={(e) => setLocationSearch(e.target.value)}
                        className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {loadingLocations ? (
                      <div className="flex justify-center py-4">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                      </div>
                    ) : locations.length === 0 ? (
                      <p className="py-4 text-center text-sm text-gray-400">
                        No locations found
                      </p>
                    ) : (
                      locations.map((loc) => (
                        <button
                          key={loc}
                          onClick={() => {
                            setAgentLocation(loc);
                            setShowLocationDropdown(false);
                            setLocationSearch("");
                          }}
                          className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 ${
                            agentLocation === loc
                              ? "bg-green-50 font-medium text-green-700"
                              : "text-gray-700"
                          }`}
                        >
                          {loc}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <AmountInput
            value={agentAmount}
            onChange={setAgentAmount}
            maxAmount={balance}
            error={
              agentAmount && parseFloat(agentAmount) > balance
                ? "Insufficient balance"
                : parseFloat(agentAmount) < 5 && agentAmount
                ? "Minimum $5.00"
                : undefined
            }
          />

          {agentAmount && parseFloat(agentAmount) >= 5 && (
            <Card className="space-y-2 bg-gray-50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Amount requested</span>
                <span className="font-medium">
                  ${parseFloat(agentAmount).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Fees</span>
                <span className="font-medium">Calculated by agent</span>
              </div>
            </Card>
          )}

          <Button
            size="lg"
            className="w-full"
            disabled={
              !firstName ||
              !lastName ||
              phoneNumber.length < 9 ||
              !agentLocation ||
              !agentAmount ||
              parseFloat(agentAmount) < 5 ||
              parseFloat(agentAmount) > balance
            }
            loading={submittingAgent}
            onClick={handleAgentCashout}
          >
            Submit Cashout Request
          </Button>
        </div>
      )}

      {/* AGENT SUCCESS */}
      {step === "agent-success" && (
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <Check className="h-7 w-7 text-green-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            Request Submitted!
          </h2>
          <p className="text-sm text-gray-500">
            Your cashout request for ${parseFloat(agentAmount).toFixed(2)} has
            been submitted. An agent will contact you at +963{phoneNumber}.
          </p>
          <Button
            size="lg"
            className="w-full"
            onClick={() => router.push("/dashboard")}
          >
            Back to Dashboard
          </Button>
        </div>
      )}
    </div>
  );
}
