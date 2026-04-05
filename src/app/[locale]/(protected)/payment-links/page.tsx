"use client";

import { useRouter, Link } from "@/i18n/navigation";
import { useGetActivityQuery } from "@/lib/api/slices/activity";
import { useAuth } from "@/lib/contexts/auth-context";
import { useCancelPaymentRequestMutation } from "@/lib/api/slices/transactions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Copy, Check, XCircle } from "lucide-react";
import { useState } from "react";
import { copyToClipboard } from "@/lib/utils";

export default function PaymentLinksPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data } = useGetActivityQuery({ page: 1, limit: 100 });
  const [cancelRequest] = useCancelPaymentRequestMutation();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter only PAYLINKs created by this user
  const paylinks =
    data?.data?.activities?.filter(
      (a) => a.type === "PAYLINK" && a.fromUserId === user?.id
    ) || [];

  const handleCopy = async (code: string) => {
    const link = `${window.location.origin}/pay/${code}`;
    await copyToClipboard(link);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeactivate = async (id: string) => {
    try {
      await cancelRequest({ id }).unwrap();
    } catch {
      // Error handled
    }
  };

  const getStatus = (item: (typeof paylinks)[0]) => {
    if (item.isCancelled) return "inactive";
    const expired =
      item.expiration && new Date(item.expiration) < new Date();
    if (expired) return "expired";
    if (item.isFulfilled) return "paid";
    return "active";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-lg p-1 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Payment Links</h1>
        </div>
        <Link href="/payment-links/create">
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Create
          </Button>
        </Link>
      </div>

      {paylinks.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="text-sm text-gray-400">No payment links yet</p>
          <Link href="/payment-links/create">
            <Button size="sm" className="mt-4">
              <Plus className="mr-1 h-4 w-4" />
              Create Your First Link
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {paylinks.map((link) => {
            const status = getStatus(link);
            return (
              <Card key={link.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-bold text-gray-900">
                      ${link.value.toFixed(2)}
                    </p>
                    {link.notes && (
                      <p className="text-sm text-gray-500">{link.notes}</p>
                    )}
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      status === "active"
                        ? "bg-yasmin/15 text-yasmin-dark"
                        : status === "paid"
                        ? "bg-blue-100 text-blue-700"
                        : status === "expired"
                        ? "bg-gray-100 text-gray-500"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                </div>

                {link.expiration && status === "active" && (
                  <p className="text-xs text-gray-400">
                    Expires{" "}
                    {new Date(link.expiration).toLocaleDateString()}
                  </p>
                )}

                {status === "active" && link.code && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(link.code!)}
                    >
                      {copiedId === link.code ? (
                        <Check className="mr-1 h-3 w-3" />
                      ) : (
                        <Copy className="mr-1 h-3 w-3" />
                      )}
                      {copiedId === link.code ? "Copied" : "Copy Link"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeactivate(link.id)}
                    >
                      <XCircle className="mr-1 h-3 w-3" />
                      Deactivate
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
