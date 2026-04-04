import { createApi } from "@reduxjs/toolkit/query/react";
import { apiBaseQuery } from "../base-query";
import type {
  WalapayDepositRequest,
  WalapayDepositResponse,
} from "../../types";

export const walapayApi = createApi({
  reducerPath: "walapayApi",
  baseQuery: apiBaseQuery(),
  tagTypes: ["Walapay"],
  endpoints: (builder) => ({
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

    submitWalapayKYC: builder.mutation<unknown, unknown>({
      query: (data) => ({
        url: "/walapay/kyc",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useGetDepositCountriesQuery,
  useLazyGetDepositCountriesQuery,
  useGetDepositCurrencyQuery,
  useLazyGetDepositCurrencyQuery,
  useGetDepositRailQuery,
  useLazyGetDepositRailQuery,
  useCreateDepositMutation,
  useSubmitWalapayKYCMutation,
} = walapayApi;
