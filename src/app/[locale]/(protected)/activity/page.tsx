"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useGetActivityQuery } from "@/lib/api/slices/activity";
import { useAuth } from "@/lib/contexts/auth-context";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "@/i18n/navigation";

export default function ActivityPage() {
  const t = useTranslations("activity");
  const router = useRouter();
  const { user } = useAuth();
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useGetActivityQuery({
    page,
    limit: 20,
  });

  const activities = data?.data?.activities || [];
  const hasMore = data?.data?.hasMore || false;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="rounded-lg p-1 hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-yasmin border-t-transparent" />
        </div>
      ) : activities.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-400">
          No activity yet
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map((activity) => {
            const isSent =
              activity.type === "TRANSACTION" &&
              activity.fromUserId === user?.id;
            const isPending =
              (activity.type === "PAYMENT_REQUEST" ||
                activity.type === "PAYLINK") &&
              !activity.isFulfilled;

            return (
              <Link
                key={activity.id}
                href={`/activity/${activity.id}`}
                className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                      isSent
                        ? "bg-red-50 text-red-600"
                        : isPending
                        ? "bg-yellow-50 text-yellow-600"
                        : "bg-yasmin/10 text-yasmin"
                    }`}
                  >
                    {isSent ? "-" : isPending ? "?" : "+"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {isSent ? activity.toUsername : activity.fromUsername}
                    </p>
                    <p className="text-xs text-gray-400">
                      {activity.type === "PAYMENT_REQUEST"
                        ? isPending
                          ? t("pending")
                          : t("fulfilled")
                        : activity.type === "PAYLINK"
                        ? isPending
                          ? t("pending")
                          : t("fulfilled")
                        : isSent
                        ? t("sent")
                        : t("received")}
                      {" · "}
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    isSent ? "text-red-600" : "text-yasmin"
                  }`}
                >
                  {isSent ? "-" : "+"}${activity.value.toFixed(2)}
                </span>
              </Link>
            );
          })}

          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                loading={isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                {t("loadMore")}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
