import { createApi } from "@reduxjs/toolkit/query/react";
import { apiBaseQuery } from "../base-query";
import type { WalapayDepositRequest, WalapayDepositResponse } from "../../types";

export const walapayApi = createApi({
  reducerPath: "walapayApi",
  baseQuery: apiBaseQuery(),
  tagTypes: ["Walapay"],
  endpoints: (builder) => ({
    // KYC form schema for a specific step
    getKycForm: builder.query<unknown, { flowKey: string }>({
      query: ({ flowKey }) => ({
        url: `/walapay/kyc/${flowKey}`,
      }),
    }),

    // Submit KYC data (create or resubmit)
    submitKyc: builder.mutation<unknown, unknown>({
      query: (data) => ({
        url: "/walapay/kyc",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Walapay"],
    }),

    // Submit KYC form step
    submitKycStep: builder.mutation<unknown, { flowKey: string; data: unknown }>({
      query: ({ flowKey, data }) => ({
        url: `/walapay/kyc/${flowKey}`,
        method: "POST",
        body: data,
      }),
    }),

    // Deposit endpoints
    getDepositCountries: builder.query<unknown, void>({
      query: () => ({
        url: "/walapay/deposit/countries",
      }),
    }),

    getDepositCurrency: builder.query<unknown, { country: string }>({
      query: ({ country }) => ({
        url: `/walapay/deposit/currency?country=${encodeURIComponent(country)}`,
      }),
    }),

    getDepositRail: builder.query<unknown, { country: string; currency: string }>({
      query: ({ country, currency }) => ({
        url: `/walapay/deposit/rail?country=${encodeURIComponent(country)}&currency=${encodeURIComponent(currency)}`,
      }),
    }),

    createDeposit: builder.mutation<WalapayDepositResponse, WalapayDepositRequest>({
      query: (data) => ({
        url: "/transactions/deposit",
        method: "POST",
        body: data,
      }),
    }),

    // Dropdown option endpoints (for dynamic form fields)
    getDropdownOptions: builder.query<unknown, { endpoint: string }>({
      query: ({ endpoint }) => ({
        url: endpoint.startsWith("/") ? endpoint : `/${endpoint}`,
      }),
    }),
  }),
});

export const {
  useGetKycFormQuery,
  useLazyGetKycFormQuery,
  useSubmitKycMutation,
  useSubmitKycStepMutation,
  useGetDepositCountriesQuery,
  useLazyGetDepositCountriesQuery,
  useGetDepositCurrencyQuery,
  useLazyGetDepositCurrencyQuery,
  useGetDepositRailQuery,
  useLazyGetDepositRailQuery,
  useCreateDepositMutation,
  useGetDropdownOptionsQuery,
  useLazyGetDropdownOptionsQuery,
} = walapayApi;
