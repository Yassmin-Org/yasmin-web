"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckoutProgress } from "./checkout-progress";
import { Check, ExternalLink } from "lucide-react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface BridgeKycData {
  kyc_link: string;
  tos_link: string;
  kyc_status: string;
  tos_status: string;
  customer_id?: string;
}

interface CheckoutKycBridgeProps {
  token: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  onComplete: () => void;
  onError: (msg: string) => void;
}

export function CheckoutKycBridge({
  token,
  email,
  firstName,
  lastName,
  onComplete,
  onError,
}: CheckoutKycBridgeProps) {
  const [kycData, setKycData] = useState<BridgeKycData | null>(null);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<"tos" | "kyc" | "done">("tos");

  const headers = { Authorization: `Bearer ${token}` };

  // Generate KYC link
  const generateKycLink = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/bridge/kyc/kyc-link`,
        { first_name: firstName, last_name: lastName, email },
        { headers }
      );
      const data = res.data?.data || res.data;
      setKycData(data);

      // Determine stage
      if (data.tos_status === "approved" && data.kyc_status === "approved") {
        onComplete();
      } else if (data.tos_status === "approved") {
        setStage("kyc");
      } else {
        setStage("tos");
      }
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : "Failed to start verification";
      onError(msg);
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, email, firstName, lastName]);

  // Refresh status
  const refreshStatus = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/bridge/kyc/kyc-link`, {
        headers,
      });
      const data = res.data?.data || res.data;
      setKycData(data);

      if (data.tos_status === "approved" && data.kyc_status === "approved") {
        onComplete();
      } else if (data.tos_status === "approved") {
        setStage("kyc");
      }
    } catch {
      // Ignore refresh errors
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Listen for messages from Bridge iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data =
          typeof event.data === "string"
            ? JSON.parse(event.data)
            : event.data;

        if (data?.signedAgreementId) {
          // TOS signed
          refreshStatus();
        }
        if (data?.status === "completed" || data?.inquiryId) {
          // KYC completed
          refreshStatus();
        }
      } catch {
        // Not a Bridge message
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [refreshStatus]);

  useEffect(() => {
    generateKycLink();
  }, [generateKycLink]);

  if (loading) {
    return (
      <div className="space-y-4">
        <CheckoutProgress currentStep={3} totalSteps={5} />
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-yasmin border-t-transparent" />
          <p className="text-sm text-gray-500">
            Preparing verification...
          </p>
        </div>
      </div>
    );
  }

  if (!kycData) return null;

  const iframeUrl =
    stage === "tos" ? kycData.tos_link : kycData.kyc_link;

  return (
    <div className="space-y-4">
      <CheckoutProgress currentStep={3} totalSteps={5} />
      <h2 className="text-lg font-semibold text-gray-900">
        {stage === "tos"
          ? "Terms of Service"
          : "Identity Verification"}
      </h2>
      <p className="text-xs text-gray-500">
        {stage === "tos"
          ? "Please review and accept the terms of service"
          : "Complete the identity verification to proceed"}
      </p>

      {iframeUrl ? (
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <iframe
            src={iframeUrl}
            className="h-[500px] w-full"
            allow="camera;microphone"
          />
        </div>
      ) : (
        <Card className="py-8 text-center">
          <p className="text-sm text-gray-500">
            Verification link is being prepared...
          </p>
        </Card>
      )}

      <Button
        size="lg"
        className="w-full"
        onClick={refreshStatus}
      >
        I&apos;ve completed this step
        <ExternalLink className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
