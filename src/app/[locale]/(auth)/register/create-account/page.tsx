"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useCreateUserMutation } from "@/lib/api/slices/users";

export default function CreateAccountPage() {
  const router = useRouter();
  const { authenticated, ready } = usePrivy();
  const [createUser] = useCreateUserMutation();
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!authenticated) {
      router.replace("/auth-method");
      return;
    }
    if (creating) return;

    const create = async () => {
      setCreating(true);
      try {
        const username = localStorage.getItem("yasmin_reg_username") || "";
        const citizenship = JSON.parse(
          localStorage.getItem("yasmin_reg_citizenship") || "[]"
        );
        const legalResidence = JSON.parse(
          localStorage.getItem("yasmin_reg_legalResidence") || "[]"
        );
        const locationStatus =
          (localStorage.getItem("yasmin_location") as "LOCAL" | "FOREIGN") ||
          "FOREIGN";
        const language = localStorage.getItem("selected_language") || "en";

        await createUser({
          username,
          citizenship,
          legalResidence,
          locationStatus,
          preferredLanguage: language,
        }).unwrap();

        // Clean up registration data
        localStorage.removeItem("yasmin_reg_username");
        localStorage.removeItem("yasmin_reg_citizenship");
        localStorage.removeItem("yasmin_reg_legalResidence");

        router.push("/register/pin");
      } catch (err: unknown) {
        const message =
          err && typeof err === "object" && "message" in err
            ? (err as { message: string }).message
            : "Failed to create account";
        setError(message);
        setCreating(false);
      }
    };

    create();
  }, [ready, authenticated, creating, createUser, router]);

  if (error) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <span className="text-2xl">!</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">
          Account Creation Failed
        </h2>
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={() => {
            setError(null);
            setCreating(false);
          }}
          className="text-sm font-medium text-green-600 hover:text-green-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
      <p className="text-sm text-gray-500">Creating your account...</p>
    </div>
  );
}
