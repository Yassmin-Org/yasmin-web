import { createApi } from "@reduxjs/toolkit/query/react";
import { apiBaseQuery } from "../base-query";

export const kycApi = createApi({
  reducerPath: "kycApi",
  baseQuery: apiBaseQuery(),
  tagTypes: ["KYC"],
  endpoints: (builder) => ({
    // Get KYC status (determines provider: walapay or bridge)
    getAccountStatus: builder.query<unknown, void>({
      query: () => ({
        url: "/accounts/status",
      }),
      providesTags: ["KYC"],
    }),

    // Get Yasmin verification status
    getKYC: builder.query<unknown, void>({
      query: () => ({
        url: "/kyc/me",
      }),
    }),

    // Unified KYC navigation (determines next form step for both providers)
    kycNavigation: builder.mutation<unknown, { currentFlow?: string; [key: string]: unknown }>({
      query: (data) => ({
        url: "/kyc/navigation",
        method: "POST",
        body: data,
      }),
    }),

    // Didit session (not used in payment link flow, kept for main app)
    createDiditSession: builder.mutation<unknown, { userId: string }>({
      query: (data) => ({
        url: "/kyc/didit/session",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["KYC"],
    }),

    // Resubmit KYC
    resubmitKYC: builder.mutation<unknown, unknown>({
      query: (data) => ({
        url: "/accounts/kyc-resubmit",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["KYC"],
    }),

    // Get KYC submission details (Walapay)
    getKYCSubmissionDetails: builder.query<unknown, void>({
      query: () => ({
        url: "/accounts/kyc-submission-details",
      }),
    }),
  }),
});

export const {
  useGetAccountStatusQuery,
  useLazyGetAccountStatusQuery,
  useGetKYCQuery,
  useLazyGetKYCQuery,
  useKycNavigationMutation,
  useCreateDiditSessionMutation,
  useResubmitKYCMutation,
  useGetKYCSubmissionDetailsQuery,
} = kycApi;
