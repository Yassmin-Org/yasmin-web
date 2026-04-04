"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/contexts/auth-context";
import { useBalance } from "@/lib/hooks/use-balance";
import { useGetActivityQuery } from "@/lib/api/slices/activity";
import { useGetStarsQuery } from "@/lib/api/slices/stars";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { Send, ArrowDownCircle, Landmark, ChevronRight } from "lucide-react";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const { user } = useAuth();
  const { formattedBalance } = useBalance();
  const { data: activityData } = useGetActivityQuery({ page: 1, limit: 5 });
  const { data: starsData } = useGetStarsQuery();

  const activities = activityData?.data?.activities || [];
  const stars = starsData?.data || [];

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white">
        <p className="text-sm font-medium text-green-100">{t("balance")}</p>
        <p className="mt-1 text-3xl font-bold">${formattedBalance}</p>
        {user && (
          <p className="mt-2 text-xs text-green-200">
            {t("flowers")}: {user.points}
          </p>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <Link
          href="/send"
          className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
            <Send className="h-5 w-5 text-green-600" />
          </div>
          <span className="text-xs font-medium text-gray-700">{t("send")}</span>
        </Link>
        <Link
          href="/receive"
          className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <ArrowDownCircle className="h-5 w-5 text-blue-600" />
          </div>
          <span className="text-xs font-medium text-gray-700">
            {t("receive")}
          </span>
        </Link>
        <Link
          href="/deposit"
          className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
            <Landmark className="h-5 w-5 text-purple-600" />
          </div>
          <span className="text-xs font-medium text-gray-700">
            {t("deposit")}
          </span>
        </Link>
      </div>

      {/* Quick Send */}
      {stars.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">
            {t("quickSend")}
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {stars.map((star) => (
              <Link
                key={star.id}
                href={`/send?to=${star.username}`}
                className="flex flex-shrink-0 flex-col items-center gap-1"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">
                  {star.username.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[60px] truncate text-[10px] text-gray-500">
                  {star.username}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            {t("recentActivity")}
          </h2>
          <Link
            href="/activity"
            className="flex items-center text-xs text-green-600 hover:text-green-700"
          >
            {t("viewAll")} <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {activities.length === 0 ? (
          <Card className="text-center">
            <p className="text-sm text-gray-400">{t("noActivity")}</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {activities.map((activity) => (
              <ActivityRow key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityRow({
  activity,
}: {
  activity: {
    id: string;
    type: string;
    fromUsername: string;
    toUsername: string;
    value: number;
    createdAt: string;
    isFulfilled?: boolean;
  };
}) {
  const isSent = activity.type === "TRANSACTION";
  const isPending =
    (activity.type === "PAYMENT_REQUEST" || activity.type === "PAYLINK") &&
    !activity.isFulfilled;

  return (
    <Link
      href={`/activity/${activity.id}`}
      className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-3 transition-colors hover:bg-gray-50"
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${
            isSent
              ? "bg-red-50 text-red-600"
              : isPending
              ? "bg-yellow-50 text-yellow-600"
              : "bg-green-50 text-green-600"
          }`}
        >
          {isSent ? "-" : isPending ? "?" : "+"}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">
            {isSent ? activity.toUsername : activity.fromUsername}
          </p>
          <p className="text-xs text-gray-400">
            {new Date(activity.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      <span
        className={`text-sm font-semibold ${
          isSent ? "text-red-600" : "text-green-600"
        }`}
      >
        {isSent ? "-" : "+"}${activity.value.toFixed(2)}
      </span>
    </Link>
  );
}
