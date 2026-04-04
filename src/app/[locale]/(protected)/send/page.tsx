"use client";

import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AmountInput } from "@/components/ui/amount-input";
import { Card } from "@/components/ui/card";
import { useLazySearchUsersQuery } from "@/lib/api/slices/users";
import { useCreateUsdcTransferMutation } from "@/lib/api/slices/transactions";
import { useBalance } from "@/lib/hooks/use-balance";
import { ArrowLeft, Check } from "lucide-react";
import type { User } from "@/lib/types";

type Step = "search" | "amount" | "confirm" | "success";

export default function SendPage() {
  const t = useTranslations("send");
  const tc = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillTo = searchParams.get("to");

  const [step, setStep] = useState<Step>(prefillTo ? "amount" : "search");
  const [query, setQuery] = useState(prefillTo || "");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const [searchUsers, { data: searchResults, isLoading: searching }] =
    useLazySearchUsersQuery();
  const [createTransfer, { isLoading: sending }] =
    useCreateUsdcTransferMutation();
  const { balance, formattedBalance } = useBalance();

  const handleSearch = (value: string) => {
    setQuery(value);
    if (value.length >= 2) {
      searchUsers({ username: value });
    }
  };

  const handleSelectUser = async (user: User) => {
    setSelectedUser(user);
    setStep("amount");
  };

  const handleConfirm = async () => {
    if (!selectedUser) return;
    try {
      await createTransfer({
        destinationWalletAddress: selectedUser.walletAddress,
        amount: parseFloat(amount),
        notes: note || undefined,
      }).unwrap();
      setStep("success");
    } catch {
      // Error handled by RTK Query
    }
  };

  if (step === "success") {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">{t("success")}</h2>
        <p className="text-sm text-gray-500">
          ${parseFloat(amount).toFixed(2)} to @{selectedUser?.username}
        </p>
        <Button onClick={() => router.push("/dashboard")}>{tc("done")}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (step === "confirm") setStep("amount");
            else if (step === "amount") setStep("search");
            else router.back();
          }}
          className="rounded-lg p-1 hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>
      </div>

      {step === "search" && (
        <div className="space-y-4">
          <Input
            placeholder={t("searchPlaceholder")}
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
          />
          <div className="space-y-2">
            {searchResults?.data?.map((user) => (
              <button
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className="flex w-full items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 text-left transition-colors hover:bg-gray-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 font-bold text-gray-600">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-900">
                  @{user.username}
                </span>
              </button>
            ))}
            {searching && (
              <p className="text-center text-sm text-gray-400">
                {tc("loading")}
              </p>
            )}
          </div>
        </div>
      )}

      {step === "amount" && (
        <div className="space-y-4">
          {selectedUser && (
            <Card className="flex items-center gap-3 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 font-bold text-gray-600">
                {selectedUser.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">@{selectedUser.username}</p>
                <p className="text-xs text-gray-400">
                  Balance: ${formattedBalance}
                </p>
              </div>
            </Card>
          )}

          <AmountInput
            value={amount}
            onChange={setAmount}
            error={
              parseFloat(amount) > balance
                ? "Insufficient balance"
                : undefined
            }
            autoFocus
          />

          <Input
            placeholder={t("addNote")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <Button
            size="lg"
            className="w-full"
            disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > balance}
            onClick={() => setStep("confirm")}
          >
            {tc("continue")}
          </Button>
        </div>
      )}

      {step === "confirm" && (
        <div className="space-y-4">
          <Card className="space-y-3">
            <h2 className="font-semibold text-gray-900">{t("confirmTitle")}</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">{t("to")}</span>
                <span className="font-medium">@{selectedUser?.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t("amount")}</span>
                <span className="font-medium">
                  ${parseFloat(amount).toFixed(2)}
                </span>
              </div>
              {note && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Note</span>
                  <span className="font-medium">{note}</span>
                </div>
              )}
            </div>
          </Card>

          <Button
            size="lg"
            className="w-full"
            loading={sending}
            onClick={handleConfirm}
          >
            {t("sendButton")}
          </Button>
        </div>
      )}
    </div>
  );
}
