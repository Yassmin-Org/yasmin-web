import { createApi } from "@reduxjs/toolkit/query/react";
import { apiBaseQuery } from "../base-query";
import type {
  CreateUserRequest,
  GetUserResponse,
  UserAvailabilityResponse,
  UserSearchResponse,
  User,
} from "../../types";

export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery: apiBaseQuery(),
  tagTypes: ["Users"],
  endpoints: (builder) => ({
    createUser: builder.mutation<GetUserResponse, CreateUserRequest>({
      query: (data) => ({
        url: "/users",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Users"],
    }),

    getUser: builder.query<GetUserResponse, void>({
      query: () => ({
        url: "/users/me",
      }),
      providesTags: ["Users"],
    }),

    checkAvailability: builder.query<
      UserAvailabilityResponse,
      { username?: string; phoneNumber?: string; countryCode?: string; email?: string }
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params.username) searchParams.set("username", params.username);
        if (params.phoneNumber) searchParams.set("phoneNumber", params.phoneNumber);
        if (params.countryCode) searchParams.set("countryCode", params.countryCode);
        if (params.email) searchParams.set("email", params.email);
        return {
          url: `/users/availability?${searchParams}`,
          requiresAuth: false,
        };
      },
    }),

    searchUsers: builder.query<UserSearchResponse, { username: string }>({
      query: (params) => ({
        url: `/users/search?username=${encodeURIComponent(params.username)}`,
      }),
    }),

    getUserById: builder.query<{ data: User; success: boolean }, { username: string }>({
      query: (params) => ({
        url: `/users/id?username=${encodeURIComponent(params.username)}`,
      }),
    }),

    updateCitizenship: builder.mutation<
      { success: boolean },
      { citizenship: string[] }
    >({
      query: (data) => ({
        url: "/users/citizenship",
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Users"],
    }),

    updateLegalResidence: builder.mutation<
      { success: boolean },
      { legalResidence: string[] }
    >({
      query: (data) => ({
        url: "/users/legal-residence",
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Users"],
    }),

    updateLanguage: builder.mutation<
      { success: boolean },
      { language: string }
    >({
      query: (data) => ({
        url: "/users/language",
        method: "PATCH",
        body: data,
      }),
    }),
  }),
});

export const {
  useCreateUserMutation,
  useGetUserQuery,
  useLazyGetUserQuery,
  useCheckAvailabilityQuery,
  useLazyCheckAvailabilityQuery,
  useSearchUsersQuery,
  useLazySearchUsersQuery,
  useGetUserByIdQuery,
  useLazyGetUserByIdQuery,
  useUpdateCitizenshipMutation,
  useUpdateLegalResidenceMutation,
  useUpdateLanguageMutation,
} = usersApi;
