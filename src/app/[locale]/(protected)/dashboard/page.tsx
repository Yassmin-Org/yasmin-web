"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/contexts/auth-context";
import { useBalance } from "@/lib/hooks/use-balance";
import { useGetActivityQuery } from "@/lib/api/slices/activity";
import { useCancelPaymentRequestMutation } from "@/lib/api/slices/transactions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { LinkIcon, Landmark, ChevronRight, Copy, Check, Trash2, Plus } from "lucide-react";
import { copyToClipboard } from "@/lib/utils";
import { useState } from "react";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const { user } = useAuth();
  const { formattedBalance } = useBalance();
  const { data: activityData } = useGetActivityQuery({ page: 1, limit: 50 });
  const [cancelRequest] = useCancelPaymentRequestMutation();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activities = activityData?.data?.activities || [];

  // Filter PAYLINKs created by this user
  const paylinks = activities.filter(
    (a) => a.type === "PAYLINK" && a.fromUserId === user?.id
  );

  // Recent non-paylink activity
  const recentActivity = activities.filter((a) => a.type !== "PAYLINK").slice(0, 5);

  const handleCopy = async (code: string) => {
    const link = `${window.location.origin}/pay/${code}`;
    await copyToClipboard(link);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    try {
      await cancelRequest({ id }).unwrap();
    } catch {
      // Error handled
    }
  };

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-yasmin to-yasmin-dark text-white">
        <p className="text-sm font-medium text-white/80">{t("balance")}</p>
        <p className="mt-1 text-3xl font-bold">${formattedBalance}</p>
        {user && (
          <p className="mt-2 text-xs text-white/70">
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
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yasmin/15">
            <LinkIcon className="h-5 w-5 text-yasmin" />
          </div>
          <span className="text-xs font-medium text-gray-700">
            {t("paymentLink")}
          </span>
        </Link>
        <Link
          href="/deposit"
          className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
            <Landmark className="h-5 w-5 text-purple-600" />
          </div>
          <span className="text-xs font-medium text-gray-700">
            {t("cashOut")}
          </span>
        </Link>
      </div>

      {/* Payment Links */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            {t("paymentLink")}s
          </h2>
          <Link
            href="/payment-links/create"
            className="flex items-center text-xs text-yasmin hover:text-yasmin-dark"
          >
            <Plus className="h-3 w-3 mr-1" /> New
          </Link>
        </div>

        {paylinks.length === 0 ? (
          <Card className="py-6 text-center">
            <p className="text-sm text-gray-400">No payment links yet</p>
            <Link href="/payment-links/create">
              <Button size="sm" className="mt-3">
                <Plus className="mr-1 h-3 w-3" /> Create First Link
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-2">
            {paylinks.map((link) => {
              const isActive = !link.isCancelled && !link.isFulfilled &&
                (!link.expiration || new Date(link.expiration) > new Date());
              const isFulfilled = link.isFulfilled;
              const isExpired = link.expiration && new Date(link.expiration) < new Date();

              return (
                <Card key={link.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-gray-900">
                          ${link.value.toFixed(2)}
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            isFulfilled
                              ? "bg-yasmin/15 text-yasmin-dark"
                              : isActive
                              ? "bg-blue-50 text-blue-600"
                              : isExpired
                              ? "bg-gray-100 text-gray-400"
                              : "bg-red-50 text-red-500"
                          }`}
                        >
                          {isFulfilled ? "Paid" : isActive ? "Active" : isExpired ? "Expired" : "Cancelled"}
                        </span>
                      </div>
                      {link.notes && (
                        <p className="mt-0.5 truncate text-xs text-gray-500">
                          {link.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {isActive && link.code && (
                        <button
                          onClick={() => handleCopy(link.code!)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          title="Copy link"
                        >
                          {copiedId === link.code ? (
                            <Check className="h-4 w-4 text-yasmin" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      )}
                      {isActive && (
                        <button
                          onClick={() => handleDelete(link.id)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                          title="Delete link"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            {t("recentActivity")}
          </h2>
          <Link
            href="/activity"
            className="flex items-center text-xs text-yasmin hover:text-yasmin-dark"
          >
            {t("viewAll")} <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {recentActivity.length === 0 ? (
          <Card className="text-center">
            <p className="text-sm text-gray-400">{t("noActivity")}</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((activity) => (
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
}
