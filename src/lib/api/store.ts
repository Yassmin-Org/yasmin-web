import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { usersApi } from "./slices/users";
import { transactionsApi } from "./slices/transactions";
import { activityApi } from "./slices/activity";
import { starsApi } from "./slices/stars";
import { kycApi } from "./slices/kyc";
import { bridgeApi } from "./slices/bridge";
import websocketReducer from "./slices/websocket";

export const store = configureStore({
  reducer: {
    [usersApi.reducerPath]: usersApi.reducer,
    [transactionsApi.reducerPath]: transactionsApi.reducer,
    [activityApi.reducerPath]: activityApi.reducer,
    [starsApi.reducerPath]: starsApi.reducer,
    [kycApi.reducerPath]: kycApi.reducer,
    [bridgeApi.reducerPath]: bridgeApi.reducer,
    websocket: websocketReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      usersApi.middleware,
      transactionsApi.middleware,
      activityApi.middleware,
      starsApi.middleware,
      kycApi.middleware,
      bridgeApi.middleware
    ),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
