"use client";

import { useAuth } from "@/lib/contexts/auth-context";
import { useRouter } from "@/i18n/navigation";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Home,
  Clock,
  LogOut,
  Landmark,
  LinkIcon,
  ArrowUpFromLine,
} from "lucide-react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, needsPin, logout, user } = useAuth();
  const router = useRouter();
  const t = useTranslations("dashboard");

  useEffect(() => {
    if (!isLoading) {
      if (needsPin) {
        router.replace("/pin");
      } else if (!isAuthenticated) {
        router.replace("/");
      }
    }
  }, [isAuthenticated, isLoading, needsPin, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <span className="text-lg font-bold text-green-600">Yasmin</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              @{user?.username}
            </span>
            <button
              onClick={logout}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6">
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="sticky bottom-0 z-30 border-t border-gray-100 bg-white">
        <div className="mx-auto flex max-w-lg items-center justify-around py-2">
          <NavItem href="/dashboard" icon={Home} label={t("title")} />
          <NavItem href="/payment-links/create" icon={LinkIcon} label="Payment Link" />
          <NavItem href="/deposit" icon={Landmark} label="Cash Out" />
          <NavItem href="/activity" icon={Clock} label="Activity" />
        </div>
      </nav>
    </div>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-0.5 px-2 py-1 text-gray-400 transition-colors hover:text-green-600"
    >
      <Icon className="h-5 w-5" />
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}
