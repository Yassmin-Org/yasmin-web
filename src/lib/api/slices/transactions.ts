import { createApi } from "@reduxjs/toolkit/query/react";
import { apiBaseQuery } from "../base-query";
import type {
  UsdcTransferRequest,
  UsdcTransferResponse,
  CreatePaymentRequestRequest,
  CreatePaymentRequestResponse,
  FulfillPaymentRequestResponse,
  GetPaymentRequestResponse,
} from "../../types";

export const transactionsApi = createApi({
  reducerPath: "transactionsApi",
  baseQuery: apiBaseQuery(),
  tagTypes: ["Transactions", "Activity"],
  endpoints: (builder) => ({
    createUsdcTransfer: builder.mutation<UsdcTransferResponse, UsdcTransferRequest>({
      query: (data) => ({
        url: "/transactions/usdc-transfers",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Transactions", { type: "Activity", id: "LIST" }],
    }),

    createPaymentRequest: builder.mutation<
      CreatePaymentRequestResponse,
      CreatePaymentRequestRequest
    >({
      query: (data) => ({
        url: "/transactions/payment-requests",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Transactions", { type: "Activity", id: "LIST" }],
    }),

    fulfillPaymentRequest: builder.mutation<
      FulfillPaymentRequestResponse,
      { code: string }
    >({
      query: ({ code }) => ({
        url: `/transactions/payment-requests/${code}/fulfillment`,
        method: "POST",
      }),
      invalidatesTags: ["Transactions", { type: "Activity", id: "LIST" }],
    }),

    cancelPaymentRequest: builder.mutation<{ success: boolean }, { id: string }>({
      query: ({ id }) => ({
        url: `/transactions/payment-requests/${id}/cancel`,
        method: "POST",
      }),
      invalidatesTags: ["Transactions", { type: "Activity", id: "LIST" }],
    }),

    getPaymentRequest: builder.query<GetPaymentRequestResponse, { code: string }>({
      query: ({ code }) => ({
        url: `/transactions/payment-requests/${code}`,
      }),
      providesTags: (_result, _error, { code }) => [
        { type: "Transactions", id: code },
      ],
    }),
  }),
});

export const {
  useCreateUsdcTransferMutation,
  useCreatePaymentRequestMutation,
  useFulfillPaymentRequestMutation,
  useCancelPaymentRequestMutation,
  useGetPaymentRequestQuery,
  useLazyGetPaymentRequestQuery,
} = transactionsApi;
