"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useCreateUserMutation } from "@/lib/api/slices/users";
import { useAuth } from "@/lib/contexts/auth-context";
import { Button } from "@/components/ui/button";

export default function CreateAccountPage() {
  const router = useRouter();
  const { authenticated, ready } = usePrivy();
  const { setUserFromRegistration } = useAuth();
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

        const result = await createUser({
          username,
          citizenship,
          legalResidence,
          locationStatus,
          preferredLanguage: language,
        }).unwrap();

        // Set the real user in auth context
        if (result?.data) {
          setUserFromRegistration(result.data);
        }

        // Clean up registration data
        localStorage.removeItem("yasmin_reg_username");
        localStorage.removeItem("yasmin_reg_citizenship");
        localStorage.removeItem("yasmin_reg_legalResidence");

        router.push("/register/pin");
      } catch (err: unknown) {
        const apiError = err as { message?: string; data?: { message?: string } };
        setError(
          apiError?.data?.message ||
          apiError?.message ||
          "Failed to create account. Please try again."
        );
        setCreating(false);
      }
    };

    create();
  }, [ready, authenticated, creating, createUser, router, setUserFromRegistration]);

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
        <div className="space-y-2">
          <Button
            variant="primary"
            onClick={() => {
              setError(null);
              setCreating(false);
            }}
          >
            Try Again
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.push("/register/step1")}
          >
            Change Username
          </Button>
        </div>
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
