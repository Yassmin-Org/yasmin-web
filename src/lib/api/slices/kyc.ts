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
        url: "/kyc/me",
      }),
      providesTags: ["KYC"],
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
  }),
});

export const {
  useGetKYCQuery,
  useLazyGetKYCQuery,
  useCreateDiditSessionMutation,
} = kycApi;
