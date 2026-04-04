"use client";

import React from "react";
import { Provider } from "react-redux";
import { PrivyProvider } from "@privy-io/react-auth";
import { store } from "@/lib/api/store";
import { AuthProvider } from "@/lib/contexts/auth-context";
import { WebSocketProvider } from "@/lib/contexts/websocket-context";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        appearance: {
          theme: "light",
          accentColor: "#16A34A",
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        loginMethods: ["email", "sms", "google"],
      }}
    >
      <Provider store={store}>
        <AuthProvider>
          <WebSocketProvider>{children}</WebSocketProvider>
        </AuthProvider>
      </Provider>
    </PrivyProvider>
  );
}
