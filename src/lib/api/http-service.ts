import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
  isAxiosError,
} from "axios";

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  requiresAuth?: boolean;
}

let getAccessTokenFn: (() => Promise<string | null>) | null = null;

export function setGetAccessToken(fn: () => Promise<string | null>) {
  getAccessTokenFn = fn;
}

export async function getAccessTokenFromService(): Promise<string | null> {
  if (getAccessTokenFn) {
    try {
      return await getAccessTokenFn();
    } catch {
      return null;
    }
  }
  return null;
}

export class HttpService {
  private readonly instance: AxiosInstance;

  constructor(baseURL: string) {
    this.instance = axios.create({
      baseURL,
      timeout: 120000,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.instance.interceptors.request.use(
      async (config: CustomAxiosRequestConfig) => {
        const authHeader = config.headers?.Authorization;
        const requiresAuth = config.requiresAuth !== false;

        if (requiresAuth && !authHeader && authHeader !== null) {
          if (getAccessTokenFn) {
            try {
              const token = await getAccessTokenFn();
              if (token) {
                config.headers = config.headers || {};
                config.headers.Authorization = `Bearer ${token}`;
              }
            } catch {
              // silently fail
            }
          }
        }

        const language = localStorage.getItem("selected_language") || "en";
        config.headers["Accept-Language"] = language;

        return config;
      },
      (error: AxiosError) => Promise.reject(error)
    );

    this.instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as CustomAxiosRequestConfig;

        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest._retry
        ) {
          originalRequest._retry = true;
          const requiresAuth = originalRequest.requiresAuth !== false;

          if (requiresAuth && getAccessTokenFn) {
            try {
              const newToken = await getAccessTokenFn();
              if (newToken) {
                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return this.instance(originalRequest);
              }
            } catch {
              return Promise.reject(error);
            }
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<T>(url, config);
    return response.data;
  }
}
