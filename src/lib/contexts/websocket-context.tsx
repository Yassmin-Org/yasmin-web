"use client";

import React, { createContext, useContext, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useDispatch } from "react-redux";
import { useAuth } from "./auth-context";
import { getAccessTokenFromService } from "../api/http-service";
import {
  setConnected,
  setBalance,
  setLatestActivity,
  setPaymentRequestUpdated,
} from "../api/slices/websocket";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001";

interface WebSocketContextType {
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
});

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const dispatch = useDispatch();
  const balanceSocketRef = useRef<Socket | null>(null);
  const paymentSocketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const connectSockets = async () => {
      const token = await getAccessTokenFromService();
      if (!token) return;

      // Balance WebSocket
      const balanceSocket = io(`${WS_URL}/balance`, {
        auth: { token },
        transports: ["websocket", "polling"],
      });

      balanceSocket.on("connect", () => {
        dispatch(setConnected(true));
        balanceSocket.emit("join_balance", { userId: user.id });
      });

      balanceSocket.on("balance_update", (data: { balance: number }) => {
        dispatch(setBalance(data.balance));
      });

      balanceSocket.on("disconnect", () => {
        dispatch(setConnected(false));
      });

      balanceSocketRef.current = balanceSocket;

      // Payment Request WebSocket
      const paymentSocket = io(`${WS_URL}/payment-requests`, {
        auth: { token },
        transports: ["websocket", "polling"],
      });

      paymentSocket.on("connect", () => {
        paymentSocket.emit("join_payment_requests", { userId: user.id });
      });

      paymentSocket.on("payment_request_created", (data) => {
        dispatch(setLatestActivity(data));
      });

      paymentSocket.on("payment_request_fulfilled", (data) => {
        dispatch(setPaymentRequestUpdated(data.id));
        dispatch(setLatestActivity(data));
      });

      paymentSocket.on("payment_request_cancelled", (data) => {
        dispatch(setPaymentRequestUpdated(data.id));
      });

      paymentSocketRef.current = paymentSocket;
    };

    connectSockets();

    return () => {
      balanceSocketRef.current?.disconnect();
      paymentSocketRef.current?.disconnect();
      balanceSocketRef.current = null;
      paymentSocketRef.current = null;
    };
  }, [isAuthenticated, user, dispatch]);

  return (
    <WebSocketContext.Provider
      value={{
        isConnected: !!balanceSocketRef.current?.connected,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = () => useContext(WebSocketContext);
