"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckoutProgress } from "./checkout-progress";
import { Clock, Check, RefreshCw } from "lucide-react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface CheckoutKycWaitingProps {
  token: string;
  provider: "walapay" | "bridge";
  paymentCode: string;
  amount: number;
  merchantUsername: string;
  onApproved: () => void;
  onError: (msg: string) => void;
  onGoBack?: () => void;
}

export function CheckoutKycWaiting({
  token,
  provider,
  paymentCode,
  amount,
  merchantUsername,
  onApproved,
  onError,
  onGoBack,
}: CheckoutKycWaitingProps) {
  const [polling, setPolling] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState<string>("checking");

  const POLL_INTERVAL = 10; // seconds
  const MAX_POLL_TIME = 300; // 5 minutes

  const headers = { Authorization: `Bearer ${token}` };

  const checkStatus = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/accounts/status`, { headers });
      const data = res.data?.data || res.data;

      const currentStatus = data?.status?.toUpperCase();

      if (
        currentStatus === "APPROVED" ||
        currentStatus === "ACTIVE"
      ) {
        setStatus("approved");
        setPolling(false);
        onApproved();
        return true;
      } else if (currentStatus === "REJECTED") {
        setStatus("rejected");
        setPolling(false);
        onError(
          "Verification was rejected. Please contact support."
        );
        return true;
      }

      setStatus("reviewing");
      return false;
    } catch {
      return false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Save state immediately so return visits work even if user closes browser early
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        `yasmin_checkout_${paymentCode}`,
        JSON.stringify({
          code: paymentCode,
          step: "kyc-waiting",
          provider,
          timestamp: Date.now(),
        })
      );
    }
  }, [paymentCode, provider]);

  // Polling loop
  useEffect(() => {
    if (!polling) return;

    const interval = setInterval(async () => {
      setElapsed((prev) => {
        const next = prev + POLL_INTERVAL;
        if (next >= MAX_POLL_TIME) {
          setPolling(false);
          setStatus("timeout");
          return next;
        }
        return next;
      });

      await checkStatus();
    }, POLL_INTERVAL * 1000);

    // Initial check
    checkStatus();

    return () => clearInterval(interval);
  }, [polling, checkStatus, paymentCode, provider]);

  const handleManualCheck = async () => {
    setStatus("checking");
    const done = await checkStatus();
    if (!done) setStatus("reviewing");
  };

  if (status === "approved") {
    return (
      <div className="space-y-4 text-center">
        <CheckoutProgress currentStep={4} totalSteps={5} />
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-yasmin/15">
          <Check className="h-7 w-7 text-yasmin" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">
          Verification Approved!
        </h2>
        <p className="text-sm text-gray-500">
          Proceeding to payment...
        </p>
      </div>
    );
  }

  if (status === "timeout") {
    return (
      <div className="space-y-4 text-center">
        <CheckoutProgress currentStep={3} totalSteps={5} />
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-yellow-100">
          <Clock className="h-7 w-7 text-yellow-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">
          Verification In Progress
        </h2>
        <p className="text-sm text-gray-500">
          Your verification is being reviewed. This can take a few minutes to a
          few hours.
        </p>

        <Card className="bg-gray-50 p-4 text-left">
          <p className="text-sm font-medium text-gray-700">
            Come back to this link to complete your payment:
          </p>
          <p className="mt-1 break-all text-xs font-mono text-yasmin">
            {typeof window !== "undefined" ? window.location.href : ""}
          </p>
        </Card>

        <p className="text-xs text-gray-400">
          We&apos;ll send an email to notify you when your verification is
          approved.
        </p>

        <Button variant="outline" className="w-full" onClick={handleManualCheck}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Check Status Now
        </Button>
      </div>
    );
  }

  // Polling / reviewing state
  return (
    <div className="space-y-4 text-center">
      <CheckoutProgress currentStep={3} totalSteps={5} />
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-yellow-100">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-yellow-600 border-t-transparent" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900">
        Verifying Your Identity
      </h2>
      <p className="text-sm text-gray-500">
        Your documents have been submitted and are under review. This can take a few minutes to a few hours.
      </p>
      <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
        Status: <span className="font-semibold">{status === "reviewing" ? "Under Review" : "Checking..."}</span>
      </div>

      <div className="rounded-lg bg-gray-50 p-3">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Checking every {POLL_INTERVAL}s</span>
          <span>
            {Math.floor(elapsed / 60)}:
            {(elapsed % 60).toString().padStart(2, "0")} /{" "}
            {Math.floor(MAX_POLL_TIME / 60)}:00
          </span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-gray-200">
          <div
            className="h-1.5 rounded-full bg-yasmin transition-all"
            style={{
              width: `${Math.min((elapsed / MAX_POLL_TIME) * 100, 100)}%`,
            }}
          />
        </div>
      </div>

      {onGoBack && (
        <Button variant="outline" className="w-full" onClick={onGoBack}>
          Go back and fix data
        </Button>
      )}
    </div>
  );
}
