import { createApi } from "@reduxjs/toolkit/query/react";
import { apiBaseQuery } from "../base-query";
import type {
  BridgeTransferRequest,
  BridgeTransferResponse,
} from "../../types";

export const bridgeApi = createApi({
  reducerPath: "bridgeApi",
  baseQuery: apiBaseQuery(),
  tagTypes: ["Bridge"],
  endpoints: (builder) => ({
    createBridgeCustomer: builder.mutation<
      unknown,
      { firstName: string; lastName: string; email: string }
    >({
      query: (data) => ({
        url: "/bridge",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Bridge"],
    }),

    getBridgeKycLink: builder.query<unknown, void>({
      query: () => ({
        url: "/bridge/kyc-link",
      }),
      providesTags: ["Bridge"],
    }),

    createBridgeKycLink: builder.mutation<unknown, void>({
      query: () => ({
        url: "/bridge/kyc-link",
        method: "POST",
      }),
    }),

    getTosLinks: builder.mutation<unknown, void>({
      query: () => ({
        url: "/bridge/tos-links",
        method: "POST",
      }),
    }),

    createBridgeTransfer: builder.mutation<
      BridgeTransferResponse,
      BridgeTransferRequest
    >({
      query: (data) => ({
        url: "/bridge/transfers",
        method: "POST",
        body: data,
      }),
    }),

    getDepositCountries: builder.query<unknown, void>({
      query: () => ({
        url: "/bridge/deposit/countries",
      }),
    }),

    getDepositCurrency: builder.query<unknown, { country: string }>({
      query: ({ country }) => ({
        url: `/bridge/deposit/currency?country=${encodeURIComponent(country)}`,
      }),
    }),

    getDepositRail: builder.query<unknown, { country: string; currency: string }>({
      query: ({ country, currency }) => ({
        url: `/bridge/deposit/rail?country=${encodeURIComponent(country)}&currency=${encodeURIComponent(currency)}`,
      }),
    }),

    getBridgeCustomer: builder.query<unknown, { customerId: string }>({
      query: ({ customerId }) => ({
        url: `/bridge/customers/${customerId}`,
      }),
    }),
  }),
});

export const {
  useCreateBridgeCustomerMutation,
  useGetBridgeKycLinkQuery,
  useLazyGetBridgeKycLinkQuery,
  useCreateBridgeKycLinkMutation,
  useGetTosLinksMutation,
  useCreateBridgeTransferMutation,
  useGetDepositCountriesQuery,
  useLazyGetDepositCountriesQuery,
  useGetDepositCurrencyQuery,
  useGetDepositRailQuery,
  useGetBridgeCustomerQuery,
  useLazyGetBridgeCustomerQuery,
} = bridgeApi;
