import { BaseQueryFn } from "@reduxjs/toolkit/query";
import axios from "axios";
import { getAccessTokenFromService } from "./http-service";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface ApiError {
  message: string;
  status?: number;
  statusText?: string;
  code?: string;
  errorCode?: string;
  statusCode?: number;
}

export const apiBaseQuery =
  (): BaseQueryFn<
    {
      url: string;
      method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
      body?: unknown;
      params?: Record<string, string>;
      requiresAuth?: boolean;
    },
    unknown,
    ApiError
  > =>
  async ({ url, method = "GET", body, params, requiresAuth = true }) => {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Language":
          typeof window !== "undefined"
            ? localStorage.getItem("selected_language") || "en"
            : "en",
      };

      if (requiresAuth) {
        const token = await getAccessTokenFromService();
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
      }

      const response = await axios({
        url: `${API_URL}${url}`,
        method,
        data: body,
        params,
        headers,
        timeout: 120000,
      });

      return { data: response.data };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const data = error.response.data as {
          message?: string;
          errorCode?: string;
          statusCode?: number;
        };
        return {
          error: {
            message: data?.message || error.message || "Request failed",
            status: error.response.status,
            statusText: error.response.statusText,
            code: error.code,
            errorCode: data?.errorCode,
            statusCode: data?.statusCode,
          },
        };
      }

      return {
        error: {
          message:
            error instanceof Error ? error.message : "Unknown error occurred",
        },
      };
    }
  };
