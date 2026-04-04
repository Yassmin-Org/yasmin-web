"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/contexts/auth-context";
import { useBalance } from "@/lib/hooks/use-balance";
import { useGetActivityQuery } from "@/lib/api/slices/activity";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { LinkIcon, Landmark, ChevronRight } from "lucide-react";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const { user } = useAuth();
  const { formattedBalance } = useBalance();
  const { data: activityData } = useGetActivityQuery({ page: 1, limit: 5 });

  const activities = activityData?.data?.activities || [];

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
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/payment-links/create"
          className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
            <LinkIcon className="h-5 w-5 text-green-600" />
          </div>
          <span className="text-xs font-medium text-gray-700">
            Payment Link
          </span>
        </Link>
        <Link
          href="/deposit"
          className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
            <Landmark className="h-5 w-5 text-purple-600" />
          </div>
          <span className="text-xs font-medium text-gray-700">Cash Out</span>
        </Link>
      </div>

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
