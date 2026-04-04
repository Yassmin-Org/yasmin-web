"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useGetActivityByIdQuery } from "@/lib/api/slices/activity";
import {
  useFulfillPaymentRequestMutation,
  useCancelPaymentRequestMutation,
} from "@/lib/api/slices/transactions";
import { useAuth } from "@/lib/contexts/auth-context";
import { useBalance } from "@/lib/hooks/use-balance";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, X, Share2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function ActivityDetailPage() {
  const t = useTranslations("activity");
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { balance } = useBalance();

  const { data, isLoading } = useGetActivityByIdQuery({ id });
  const [fulfillRequest, { isLoading: fulfilling }] =
    useFulfillPaymentRequestMutation();
  const [cancelRequest, { isLoading: cancelling }] =
    useCancelPaymentRequestMutation();

  const activity = data?.data;

  // Expiration countdown
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!activity?.expiration) return;
    const updateTimer = () => {
      const diff = Math.max(
        0,
        Math.floor(
          (new Date(activity.expiration!).getTime() - Date.now()) / 1000
        )
      );
      setTimeLeft(diff);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activity?.expiration]);

  if (isLoading || !activity) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
      </div>
    );
  }

  const isReceiver = activity.toUserId === user?.id;
  const isSender = activity.fromUserId === user?.id;
  const isPending =
    (activity.type === "PAYMENT_REQUEST" || activity.type === "PAYLINK") &&
    !activity.isFulfilled &&
    !activity.isCancelled;
  const isExpired = timeLeft !== null && timeLeft <= 0;
  const canFulfill =
    isPending &&
    !isExpired &&
    isSender &&
    activity.code &&
    balance >= activity.value;
  const canCancel = isPending && !isExpired && isReceiver;

  const handleFulfill = async () => {
    if (!activity.code) return;
    try {
      await fulfillRequest({ code: activity.code }).unwrap();
      router.back();
    } catch {
      // Error handled by RTK Query
    }
  };

  const handleCancel = async () => {
    try {
      await cancelRequest({ id: activity.id }).unwrap();
      router.back();
    } catch {
      // Error handled by RTK Query
    }
  };

  const handleShare = async () => {
    const link = `${window.location.origin}/send/${activity.code}`;
    if (navigator.share) {
      await navigator.share({
        title: "Yasmin Payment",
        text: `Pay $${activity.value.toFixed(2)}`,
        url: link,
      });
    } else {
      navigator.clipboard.writeText(link);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="rounded-lg p-1 hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Transaction Detail</h1>
      </div>

      <Card className="space-y-4 text-center">
        <p
          className={`text-3xl font-bold ${
            isSender && activity.type === "TRANSACTION"
              ? "text-red-600"
              : "text-green-600"
          }`}
        >
          {isSender && activity.type === "TRANSACTION" ? "-" : ""}$
          {activity.value.toFixed(2)}
        </p>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">From</span>
            <span className="font-medium">@{activity.fromUsername}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">To</span>
            <span className="font-medium">@{activity.toUsername}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Type</span>
            <span className="font-medium">{activity.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Status</span>
            <span
              className={`font-medium ${
                activity.isFulfilled
                  ? "text-green-600"
                  : activity.isCancelled
                  ? "text-red-600"
                  : isExpired
                  ? "text-gray-400"
                  : "text-yellow-600"
              }`}
            >
              {activity.isFulfilled
                ? t("fulfilled")
                : activity.isCancelled
                ? t("cancelled")
                : isExpired
                ? t("expired")
                : t("pending")}
            </span>
          </div>
          {activity.notes && (
            <div className="flex justify-between">
              <span className="text-gray-500">Note</span>
              <span className="font-medium">{activity.notes}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Date</span>
            <span className="font-medium">
              {new Date(activity.createdAt).toLocaleString()}
            </span>
          </div>
        </div>

        {isPending && !isExpired && timeLeft !== null && (
          <div className="rounded-lg bg-yellow-50 p-2 text-sm text-yellow-700">
            {t("expiresIn")}: {Math.floor(timeLeft / 60)}:
            {(timeLeft % 60).toString().padStart(2, "0")}
          </div>
        )}
      </Card>

      <div className="flex gap-3">
        {canFulfill && (
          <Button
            size="lg"
            className="flex-1"
            loading={fulfilling}
            onClick={handleFulfill}
          >
            <Check className="mr-2 h-4 w-4" />
            {t("confirmPayment")}
          </Button>
        )}
        {canCancel && (
          <Button
            variant="danger"
            size="lg"
            className="flex-1"
            loading={cancelling}
            onClick={handleCancel}
          >
            <X className="mr-2 h-4 w-4" />
            {t("cancelRequest")}
          </Button>
        )}
        {isPending && isReceiver && activity.type === "PAYLINK" && (
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={handleShare}
          >
            <Share2 className="mr-2 h-4 w-4" />
            {t("sharePaylink")}
          </Button>
        )}
      </div>
    </div>
  );
}
