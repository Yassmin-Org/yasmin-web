"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useGetAccountStatusQuery, useCreateDiditSessionMutation } from "@/lib/api/slices/kyc";
import { useAuth } from "@/lib/contexts/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";

export default function KYCPage() {
  const t = useTranslations("kyc");
  const tc = useTranslations("common");
  const router = useRouter();
  const { user } = useAuth();

  const { data: kycData, isLoading, isError: kycError, refetch } = useGetAccountStatusQuery() as { data: Record<string, unknown> | undefined; isLoading: boolean; isError: boolean; refetch: () => void };
  const [createSession, { isLoading: creating }] =
    useCreateDiditSessionMutation();
  const [sessionUrl, setSessionUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const kyc = (kycData as Record<string, unknown>)?.data as Record<string, unknown> | undefined;

  const handleStartVerification = async () => {
    if (!user) {
      setError("No user found. Please log in again.");
      return;
    }
    setError(null);
    try {
      const result = await createSession({ userId: user.id }).unwrap() as Record<string, unknown>;
      const data = result?.data as Record<string, string> | undefined;
      const url = data?.url || data?.sessionUrl;
      if (url) {
        setSessionUrl(url);
      } else {
        setError("No verification session URL received. Please try again.");
      }
    } catch (err: unknown) {
      const apiError = err as { message?: string; data?: { message?: string } };
      setError(
        apiError?.message ||
        apiError?.data?.message ||
        "Failed to start verification. Make sure you have a real account (not demo)."
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-yasmin border-t-transparent" />
      </div>
    );
  }

  // If session URL is open, show iframe
  if (sessionUrl) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSessionUrl(null);
              refetch();
            }}
            className="rounded-lg p-1 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <iframe
            src={sessionUrl}
            className="h-[600px] w-full"
            allow="camera;microphone"
          />
        </div>
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => {
            setSessionUrl(null);
            refetch();
          }}
        >
          {tc("done")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="rounded-lg p-1 hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>
      </div>

      <Card className="space-y-4 text-center">
        {/* Status icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          {kycError ? (
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          ) : String(kyc?.status || "") === "APPROVED" || !!kyc?.isYasminVerified ? (
            <CheckCircle className="h-8 w-8 text-yasmin" />
          ) : String(kyc?.status || "") === "REJECTED" ? (
            <XCircle className="h-8 w-8 text-red-600" />
          ) : String(kyc?.status || "") === "SUBMITTED" || String(kyc?.status || "") === "PENDING" ? (
            <Clock className="h-8 w-8 text-yellow-600" />
          ) : (
            <Shield className="h-8 w-8 text-gray-400" />
          )}
        </div>

        {/* Status text */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {kycError
              ? t("subtitle")
              : String(kyc?.status || "") === "APPROVED" || !!kyc?.isYasminVerified
              ? t("approved")
              : String(kyc?.status || "") === "REJECTED"
              ? t("rejected")
              : String(kyc?.status || "") === "SUBMITTED" || String(kyc?.status || "") === "PENDING"
              ? t("underReview")
              : t("subtitle")}
          </h2>
        </div>

        {/* Rejection reasons */}
        {String(kyc?.status || "") === "REJECTED" && (kyc?.submissionIssues as Array<{reason:string}> | undefined) && (
          <div className="space-y-2 text-left">
            {((kyc?.submissionIssues as Array<{reason:string}>) || []).map((issue, i) => (
              <div
                key={i}
                className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                {issue.reason}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Error message */}
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-center text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Actions */}
      {(!kyc || (!kyc.isYasminVerified && kyc.status !== "APPROVED")) && (
        <Button
          size="lg"
          className="w-full"
          loading={creating}
          onClick={handleStartVerification}
        >
          {String(kyc?.status || "") === "REJECTED" ? (
            <>
              {t("resubmit")} <ExternalLink className="ml-2 h-4 w-4" />
            </>
          ) : (
            <>
              {t("startVerification")}{" "}
              <ExternalLink className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      )}

      {kyc && (kyc.isYasminVerified || kyc.status === "APPROVED") && (
        <Button
          size="lg"
          className="w-full"
          onClick={() => router.push("/deposit")}
        >
          Continue to Deposit
        </Button>
      )}

      {/* Back to dashboard */}
      <Button
        variant="ghost"
        size="lg"
        className="w-full"
        onClick={() => router.push("/dashboard")}
      >
        Back to Dashboard
      </Button>
    </div>
  );
}
