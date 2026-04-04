import { createApi } from "@reduxjs/toolkit/query/react";
import { apiBaseQuery } from "../base-query";
import type {
  BridgeKycLinkResponse,
  BridgeTransferRequest,
  BridgeTransferResponse,
  TosLinksResponse,
} from "../../types";

export const bridgeApi = createApi({
  reducerPath: "bridgeApi",
  baseQuery: apiBaseQuery(),
  tagTypes: ["Bridge"],
  endpoints: (builder) => ({
    createBridgeAccount: builder.mutation<
      { success: boolean },
      { firstName: string; lastName: string; email: string }
    >({
      query: (data) => ({
        url: "/transactions/account/activate-bridge",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Bridge"],
    }),

    getBridgeKycLink: builder.query<BridgeKycLinkResponse, { customerId: string }>({
      query: ({ customerId }) => ({
        url: `/bridge/kyc-link?customerId=${customerId}`,
      }),
      providesTags: ["Bridge"],
    }),

    getTosLinks: builder.query<TosLinksResponse, void>({
      query: () => ({
        url: "/bridge/tos",
        requiresAuth: false,
      }),
    }),

    createBridgeTransfer: builder.mutation<
      BridgeTransferResponse,
      BridgeTransferRequest
    >({
      query: (data) => ({
        url: "/bridge/transfer",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useCreateBridgeAccountMutation,
  useGetBridgeKycLinkQuery,
  useLazyGetBridgeKycLinkQuery,
  useGetTosLinksQuery,
  useCreateBridgeTransferMutation,
} = bridgeApi;
