import { createApi } from "@reduxjs/toolkit/query/react";
import { apiBaseQuery } from "../base-query";
import type {
  WalapayAccountResponse,
  WalapayAccountStatusResponse,
  WalapayDepositRequest,
  WalapayDepositResponse,
  WalapayOptionsResponse,
} from "../../types";

export const walapayApi = createApi({
  reducerPath: "walapayApi",
  baseQuery: apiBaseQuery(),
  tagTypes: ["Walapay"],
  endpoints: (builder) => ({
    createWalapayAccount: builder.mutation<
      WalapayAccountResponse,
      {
        firstName: string;
        lastName: string;
        email: string;
        phoneNumber: string;
        countryCode: string;
      }
    >({
      query: (data) => ({
        url: "/transactions/account/activate-wallapay",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Walapay"],
    }),

    getAccountStatus: builder.query<WalapayAccountStatusResponse, void>({
      query: () => ({
        url: "/walapay/account/status",
      }),
      providesTags: ["Walapay"],
    }),

    getWalapayOptions: builder.query<WalapayOptionsResponse, void>({
      query: () => ({
        url: "/walapay/options",
      }),
    }),

    createDeposit: builder.mutation<WalapayDepositResponse, WalapayDepositRequest>({
      query: (data) => ({
        url: "/transactions/deposit",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useCreateWalapayAccountMutation,
  useGetAccountStatusQuery,
  useLazyGetAccountStatusQuery,
  useGetWalapayOptionsQuery,
  useLazyGetWalapayOptionsQuery,
  useCreateDepositMutation,
} = walapayApi;
