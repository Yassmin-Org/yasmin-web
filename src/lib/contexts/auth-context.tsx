"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { usePrivy } from "@privy-io/react-auth";
import { setGetAccessToken } from "../api/http-service";
import { useLazyGetUserQuery } from "../api/slices/users";
import type { User } from "../types";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  needsPin: boolean;
  pin: string | null;
  setPin: (pin: string) => void;
  verifyPin: (input: string) => boolean;
  clearLockScreen: () => void;
  logout: () => Promise<void>;
  refetchUser: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  needsPin: false,
  pin: null,
  setPin: () => {},
  verifyPin: () => false,
  clearLockScreen: () => {},
  logout: async () => {},
  refetchUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, logout: privyLogout, getAccessToken } = usePrivy();
  const [needsPin, setNeedsPin] = useState(false);
  const [pin, setStoredPin] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  const [triggerGetUser, { data: userData }] = useLazyGetUserQuery();

  // Set the access token function for the HTTP service
  useEffect(() => {
    if (ready && authenticated) {
      setGetAccessToken(getAccessToken);
    }
  }, [ready, authenticated, getAccessToken]);

  // Load PIN from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPin = localStorage.getItem("yasmin_pin");
      if (savedPin) {
        setStoredPin(savedPin);
        setIsLocked(true);
        setNeedsPin(true);
      }
    }
  }, []);

  // Fetch user when authenticated
  useEffect(() => {
    if (ready && authenticated) {
      triggerGetUser();
    }
  }, [ready, authenticated, triggerGetUser]);

  const setPin = useCallback((newPin: string) => {
    setStoredPin(newPin);
    localStorage.setItem("yasmin_pin", newPin);
    setNeedsPin(false);
    setIsLocked(false);
  }, []);

  const verifyPin = useCallback(
    (input: string) => {
      if (input === pin) {
        setIsLocked(false);
        setNeedsPin(false);
        return true;
      }
      return false;
    },
    [pin]
  );

  const clearLockScreen = useCallback(() => {
    setIsLocked(false);
    setNeedsPin(false);
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem("yasmin_pin");
    localStorage.removeItem("selected_language");
    setStoredPin(null);
    setNeedsPin(false);
    setIsLocked(false);
    await privyLogout();
  }, [privyLogout]);

  const refetchUser = useCallback(() => {
    triggerGetUser();
  }, [triggerGetUser]);

  const user = userData?.data ?? null;
  const isAuthenticated = ready && authenticated && !!user && !isLocked;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading: !ready,
        user,
        needsPin: isLocked && !!pin,
        pin,
        setPin,
        verifyPin,
        clearLockScreen,
        logout,
        refetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
