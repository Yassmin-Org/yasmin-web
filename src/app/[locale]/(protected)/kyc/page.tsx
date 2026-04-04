"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useGetKYCQuery, useCreateDiditSessionMutation } from "@/lib/api/slices/kyc";
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
} from "lucide-react";
import { useState } from "react";

export default function KYCPage() {
  const t = useTranslations("kyc");
  const tc = useTranslations("common");
  const router = useRouter();
  const { user } = useAuth();

  const { data: kycData, isLoading, refetch } = useGetKYCQuery();
  const [createSession, { isLoading: creating }] =
    useCreateDiditSessionMutation();
  const [sessionUrl, setSessionUrl] = useState<string | null>(null);

  const kyc = kycData?.data;

  const handleStartVerification = async () => {
    if (!user) return;
    try {
      const result = await createSession({ userId: user.id }).unwrap();
      setSessionUrl(result.data.sessionUrl);
    } catch {
      // Error handled by RTK Query
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
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
          {kyc?.status === "APPROVED" || kyc?.isYasminVerified ? (
            <CheckCircle className="h-8 w-8 text-green-600" />
          ) : kyc?.status === "REJECTED" ? (
            <XCircle className="h-8 w-8 text-red-600" />
          ) : kyc?.status === "SUBMITTED" || kyc?.status === "PENDING" ? (
            <Clock className="h-8 w-8 text-yellow-600" />
          ) : (
            <Shield className="h-8 w-8 text-gray-400" />
          )}
        </div>

        {/* Status text */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {kyc?.status === "APPROVED" || kyc?.isYasminVerified
              ? t("approved")
              : kyc?.status === "REJECTED"
              ? t("rejected")
              : kyc?.status === "SUBMITTED" || kyc?.status === "PENDING"
              ? t("underReview")
              : t("subtitle")}
          </h2>
        </div>

        {/* Rejection reasons */}
        {kyc?.status === "REJECTED" && kyc.submissionIssues && (
          <div className="space-y-2 text-left">
            {kyc.submissionIssues.map((issue, i) => (
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

      {/* Actions */}
      {!kyc?.isYasminVerified && kyc?.status !== "APPROVED" && (
        <Button
          size="lg"
          className="w-full"
          loading={creating}
          onClick={handleStartVerification}
        >
          {kyc?.status === "REJECTED" ? (
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

      {(kyc?.isYasminVerified || kyc?.status === "APPROVED") && (
        <Button
          size="lg"
          className="w-full"
          onClick={() => router.push("/deposit")}
        >
          Continue to Deposit
        </Button>
      )}
    </div>
  );
}
