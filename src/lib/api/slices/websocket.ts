import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { ActivityItem } from "../../types";

interface WebSocketState {
  isConnected: boolean;
  balance: number | null;
  balanceUpdatedAt: string | null;
  latestActivity: ActivityItem | null;
  paymentRequestUpdated: string | null;
}

const initialState: WebSocketState = {
  isConnected: false,
  balance: null,
  balanceUpdatedAt: null,
  latestActivity: null,
  paymentRequestUpdated: null,
};

const websocketSlice = createSlice({
  name: "websocket",
  initialState,
  reducers: {
    setConnected(state, action: PayloadAction<boolean>) {
      state.isConnected = action.payload;
    },
    setBalance(state, action: PayloadAction<number>) {
      state.balance = action.payload;
      state.balanceUpdatedAt = new Date().toISOString();
    },
    setLatestActivity(state, action: PayloadAction<ActivityItem>) {
      state.latestActivity = action.payload;
    },
    setPaymentRequestUpdated(state, action: PayloadAction<string>) {
      state.paymentRequestUpdated = action.payload;
    },
    resetWebSocket() {
      return initialState;
    },
  },
});

export const {
  setConnected,
  setBalance,
  setLatestActivity,
  setPaymentRequestUpdated,
  resetWebSocket,
} = websocketSlice.actions;

export default websocketSlice.reducer;
