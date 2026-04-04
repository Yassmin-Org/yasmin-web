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
  isPrivyReady: boolean;
  isPrivyAuthenticated: boolean;
  needsRegistration: boolean;
  user: User | null;
  needsPin: boolean;
  pin: string | null;
  setPin: (pin: string) => void;
  verifyPin: (input: string) => boolean;
  clearLockScreen: () => void;
  logout: () => Promise<void>;
  refetchUser: () => void;
  setUserFromRegistration: (user: User) => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  isPrivyReady: false,
  isPrivyAuthenticated: false,
  needsRegistration: false,
  user: null,
  needsPin: false,
  pin: null,
  setPin: () => {},
  verifyPin: () => false,
  clearLockScreen: () => {},
  logout: async () => {},
  refetchUser: () => {},
  setUserFromRegistration: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, logout: privyLogout, getAccessToken } = usePrivy();
  const [needsPin, setNeedsPin] = useState(false);
  const [pin, setStoredPin] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [resolvedUser, setResolvedUser] = useState<User | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [needsRegistration, setNeedsRegistration] = useState(false);

  const [triggerGetUser] = useLazyGetUserQuery();

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

  // Fetch user once when authenticated with Privy
  useEffect(() => {
    if (!ready || !authenticated || authResolved) return;

    const fetchUser = async () => {
      try {
        const result = await triggerGetUser().unwrap();
        if (result?.data) {
          setResolvedUser(result.data);
          setNeedsRegistration(false);
        } else {
          // Privy authenticated but no backend user — needs registration
          setNeedsRegistration(true);
        }
      } catch {
        // Backend returned error (404 = user doesn't exist, or network error)
        // Either way, user needs to register
        setNeedsRegistration(true);
      }
      setAuthResolved(true);
    };

    fetchUser();
  }, [ready, authenticated, authResolved, triggerGetUser]);

  // If not authenticated with Privy, mark as resolved
  useEffect(() => {
    if (ready && !authenticated) {
      setAuthResolved(true);
      setNeedsRegistration(false);
    }
  }, [ready, authenticated]);

  const setUserFromRegistration = useCallback((user: User) => {
    setResolvedUser(user);
    setNeedsRegistration(false);
  }, []);

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
    localStorage.removeItem("yasmin_location");
    setStoredPin(null);
    setNeedsPin(false);
    setIsLocked(false);
    setResolvedUser(null);
    setAuthResolved(false);
    setNeedsRegistration(false);
    await privyLogout();
  }, [privyLogout]);

  const refetchUser = useCallback(async () => {
    try {
      const result = await triggerGetUser().unwrap();
      if (result?.data) {
        setResolvedUser(result.data);
        setNeedsRegistration(false);
      }
    } catch {
      // keep existing user
    }
  }, [triggerGetUser]);

  const isAuthenticated = ready && authenticated && !!resolvedUser && !isLocked;
  const isLoading = !ready || (authenticated && !authResolved);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        isPrivyReady: ready,
        isPrivyAuthenticated: authenticated,
        needsRegistration,
        user: resolvedUser,
        needsPin: isLocked && !!pin,
        pin,
        setPin,
        verifyPin,
        clearLockScreen,
        logout,
        refetchUser,
        setUserFromRegistration,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
