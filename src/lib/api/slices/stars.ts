import { createApi } from "@reduxjs/toolkit/query/react";
import { apiBaseQuery } from "../base-query";
import type { GetStarsResponse } from "../../types";

export const starsApi = createApi({
  reducerPath: "starsApi",
  baseQuery: apiBaseQuery(),
  tagTypes: ["Stars"],
  endpoints: (builder) => ({
    getStars: builder.query<GetStarsResponse, void>({
      query: () => ({
        url: "/users/star/all",
      }),
      providesTags: ["Stars"],
    }),

    addStar: builder.mutation<{ success: boolean }, { starredUserId: string }>({
      query: ({ starredUserId }) => ({
        url: `/users/star/${starredUserId}`,
        method: "POST",
      }),
      invalidatesTags: ["Stars"],
    }),

    removeStar: builder.mutation<{ success: boolean }, { starredUserId: string }>({
      query: ({ starredUserId }) => ({
        url: `/users/star/${starredUserId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Stars"],
    }),
  }),
});

export const {
  useGetStarsQuery,
  useLazyGetStarsQuery,
  useAddStarMutation,
  useRemoveStarMutation,
} = starsApi;
