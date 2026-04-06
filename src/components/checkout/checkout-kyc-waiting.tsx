"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckoutProgress } from "./checkout-progress";
import { Clock, Check, RefreshCw, XCircle, AlertTriangle } from "lucide-react";
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
  const [kycStatus, setKycStatus] = useState<string>("checking");
  const [rejectionReasons, setRejectionReasons] = useState<string[]>([]);
  const [lastChecked, setLastChecked] = useState<string>("");
  const [checking, setChecking] = useState(false);

  const POLL_INTERVAL = 15; // seconds

  const headers = { Authorization: `Bearer ${token}` };

  const checkStatus = useCallback(async () => {
    setChecking(true);
    try {
      const res = await axios.get(`${API_URL}/accounts/status`, { headers });
      const data = res.data?.data || res.data;
      const status = (data?.status || "").toUpperCase();

      setLastChecked(new Date().toLocaleTimeString());

      if (status === "APPROVED" || status === "ACTIVE") {
        setKycStatus("approved");
        onApproved();
        return;
      } else if (status === "REJECTED") {
        setKycStatus("rejected");
        const issues = data?.submissionIssues || data?.rejection_reasons || [];
        setRejectionReasons(
          issues.map((i: { message?: string; reason?: string; developer_reason?: string }) =>
            i.message || i.reason || i.developer_reason || "Unknown reason"
          )
        );
        return;
      } else if (status === "SUBMITTED" || status === "UNDER_REVIEW") {
        setKycStatus("reviewing");
      } else {
        setKycStatus(status.toLowerCase() || "checking");
      }
    } catch {
      // Keep current status on error
    }
    setChecking(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Save state for return visits
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

  // Poll every 15 seconds
  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, POLL_INTERVAL * 1000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  return (
    <div className="space-y-4 text-center">
      <CheckoutProgress currentStep={3} totalSteps={5} />

      {/* STATUS DISPLAY */}
      <Card className="space-y-3 p-5">
        {/* Icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full" style={{
          backgroundColor: kycStatus === "approved" ? "rgb(0 152 84 / 0.15)" :
            kycStatus === "rejected" ? "rgb(239 68 68 / 0.15)" : "rgb(234 179 8 / 0.15)"
        }}>
          {kycStatus === "approved" ? (
            <Check className="h-7 w-7 text-yasmin" />
          ) : kycStatus === "rejected" ? (
            <XCircle className="h-7 w-7 text-red-500" />
          ) : (
            <Clock className="h-7 w-7 text-yellow-600" />
          )}
        </div>

        {/* Title */}
        <h2 className="text-lg font-semibold text-gray-900">
          {kycStatus === "approved" ? "Verification Approved!" :
            kycStatus === "rejected" ? "Verification Rejected" :
            "Verification In Progress"}
        </h2>

        {/* Status badge */}
        <div className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
          kycStatus === "approved" ? "bg-yasmin/15 text-yasmin-dark" :
          kycStatus === "rejected" ? "bg-red-100 text-red-700" :
          "bg-yellow-100 text-yellow-700"
        }`}>
          {kycStatus === "approved" ? "APPROVED" :
            kycStatus === "rejected" ? "REJECTED" :
            kycStatus === "reviewing" ? "UNDER REVIEW" :
            kycStatus.toUpperCase()}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-500">
          {kycStatus === "approved"
            ? "Your identity has been verified. Proceeding to payment..."
            : kycStatus === "rejected"
            ? "Your verification was not approved. See details below."
            : "Your documents are being reviewed. This page auto-refreshes every 15 seconds."}
        </p>

        {/* Last checked */}
        {lastChecked && (
          <p className="text-[10px] text-gray-400">
            Last checked: {lastChecked}
            {checking && " (checking...)"}
          </p>
        )}
      </Card>

      {/* REJECTION REASONS */}
      {kycStatus === "rejected" && rejectionReasons.length > 0 && (
        <div className="space-y-2 text-left">
          <p className="text-sm font-medium text-gray-700">Rejection reasons:</p>
          {rejectionReasons.map((reason, i) => (
            <div key={i} className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {reason}
            </div>
          ))}
        </div>
      )}

      {/* ACTIONS */}
      <div className="space-y-2">
        {/* Manual refresh */}
        {kycStatus !== "approved" && (
          <Button
            variant="outline"
            className="w-full"
            loading={checking}
            onClick={checkStatus}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Check Status Now
          </Button>
        )}

        {/* Go back to fix (for rejected or reviewing) */}
        {kycStatus !== "approved" && onGoBack && (
          <Button
            variant="ghost"
            className="w-full"
            onClick={onGoBack}
          >
            {kycStatus === "rejected" ? "Go back and resubmit" : "Go back and fix data"}
          </Button>
        )}

        {/* Copy link for later */}
        {kycStatus === "reviewing" && (
          <div className="rounded-lg bg-gray-50 p-3 text-left">
            <p className="text-xs font-medium text-gray-600">
              Bookmark this link to come back later:
            </p>
            <p className="mt-1 break-all text-[10px] font-mono text-yasmin">
              {typeof window !== "undefined" ? window.location.href : ""}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
