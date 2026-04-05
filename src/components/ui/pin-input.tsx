"use client";

import { cn } from "@/lib/utils";
import { useRef, useState, KeyboardEvent } from "react";

interface PinInputProps {
  length?: number;
  onComplete: (pin: string) => void;
  error?: string;
}

export function PinInput({ length = 4, onComplete, error }: PinInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newValues = [...values];
    newValues[index] = value.slice(-1);
    setValues(newValues);

    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    const pin = newValues.join("");
    if (pin.length === length) {
      onComplete(pin);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !values[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const reset = () => {
    setValues(Array(length).fill(""));
    inputRefs.current[0]?.focus();
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-center gap-3">
        {values.map((value, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={value}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className={cn(
              "h-14 w-14 rounded-xl border-2 bg-white text-center text-2xl font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-yasmin",
              error ? "border-red-300" : value ? "border-yasmin" : "border-gray-200"
            )}
          />
        ))}
      </div>
      {error && <p className="text-center text-sm text-red-600">{error}</p>}
    </div>
  );
}
