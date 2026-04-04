import { createApi } from "@reduxjs/toolkit/query/react";
import { apiBaseQuery } from "../base-query";
import type { ActivityResponse, SingleActivityResponse } from "../../types";

export const activityApi = createApi({
  reducerPath: "activityApi",
  baseQuery: apiBaseQuery(),
  tagTypes: ["Activity"],
  endpoints: (builder) => ({
    getActivity: builder.query<
      ActivityResponse,
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 20 }) => ({
        url: `/transactions/activities?page=${page}&limit=${limit}`,
      }),
      providesTags: ["Activity", { type: "Activity", id: "LIST" }],
    }),

    getActivityById: builder.query<SingleActivityResponse, { id: string }>({
      query: ({ id }) => ({
        url: `/transactions/activity/${id}`,
      }),
      providesTags: (_result, _error, { id }) => [{ type: "Activity", id }],
    }),
  }),
});

export const {
  useGetActivityQuery,
  useLazyGetActivityQuery,
  useGetActivityByIdQuery,
  useLazyGetActivityByIdQuery,
} = activityApi;
