import { createApi } from "@reduxjs/toolkit/query/react";
import { apiBaseQuery } from "../base-query";
import type { GetKYCResponse, CreateDiditSessionResponse } from "../../types";

export const kycApi = createApi({
  reducerPath: "kycApi",
  baseQuery: apiBaseQuery(),
  tagTypes: ["KYC"],
  endpoints: (builder) => ({
    getKYC: builder.query<GetKYCResponse, void>({
      query: () => ({
        url: "/accounts/status",
      }),
      providesTags: ["KYC"],
    }),

    getKYCSubmissionDetails: builder.query<unknown, void>({
      query: () => ({
        url: "/accounts/kyc-submission-details",
      }),
    }),

    createDiditSession: builder.mutation<
      CreateDiditSessionResponse,
      { userId: string }
    >({
      query: (data) => ({
        url: "/kyc/didit/session",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["KYC"],
    }),

    resubmitKYC: builder.mutation<unknown, void>({
      query: () => ({
        url: "/accounts/kyc-resubmit",
        method: "PUT",
      }),
      invalidatesTags: ["KYC"],
    }),
  }),
});

export const {
  useGetKYCQuery,
  useLazyGetKYCQuery,
  useGetKYCSubmissionDetailsQuery,
  useCreateDiditSessionMutation,
  useResubmitKYCMutation,
} = kycApi;
