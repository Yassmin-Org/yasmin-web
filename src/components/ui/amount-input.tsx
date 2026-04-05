"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  currency?: string;
  maxAmount?: number;
  error?: string;
  autoFocus?: boolean;
}

export function AmountInput({
  value,
  onChange,
  currency = "USDC",
  maxAmount = 50000,
  error,
  autoFocus,
}: AmountInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.]/g, "");
    // Only allow one decimal point
    const parts = raw.split(".");
    if (parts.length > 2) return;
    // Limit decimal places to 2
    if (parts[1] && parts[1].length > 2) return;

    const num = parseFloat(raw);
    if (num > maxAmount) return;

    onChange(raw);
  };

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "flex items-center justify-center gap-2 rounded-2xl border-2 bg-white px-6 py-8 transition-colors",
          error ? "border-red-300" : "border-gray-200 focus-within:border-yasmin"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        <span className="text-3xl font-light text-gray-400">$</span>
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          placeholder="0.00"
          className="w-full bg-transparent text-center text-4xl font-bold text-gray-900 outline-none placeholder:text-gray-300"
        />
      </div>
      <div className="flex items-center justify-between px-2">
        <span className="text-xs text-gray-500">{currency}</span>
        {error ? (
          <span className="text-xs text-red-600">{error}</span>
        ) : (
          <span className="text-xs text-gray-400">
            Max: ${maxAmount.toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}
