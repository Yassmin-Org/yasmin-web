"use client";

import { cn } from "@/lib/utils";

interface CheckoutProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function CheckoutProgress({
  currentStep,
  totalSteps,
}: CheckoutProgressProps) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 flex-1 rounded-full transition-colors",
            i < currentStep ? "bg-green-500" : "bg-gray-200"
          )}
        />
      ))}
    </div>
  );
}
