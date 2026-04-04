"use client";

import { useSelector } from "react-redux";
import { useAuth } from "../contexts/auth-context";
import type { RootState } from "../api/store";

export function useBalance() {
  const { user } = useAuth();
  const wsBalance = useSelector((state: RootState) => state.websocket.balance);

  // Prefer WebSocket balance, fallback to user's balance from API
  const balance = wsBalance ?? user?.usdcBalance ?? 0;

  return {
    balance,
    formattedBalance: balance.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  };
}
