import axios, { AxiosHeaders } from "axios";

const configuredApiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(
  /\/api\/v1\/?$/,
  ""
);
const apiBaseUrl =
  typeof window === "undefined" ? configuredApiBaseUrl.replace(/\/$/, "") : "";

const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

const authRefreshExcludedPaths = [
  "/api/v1/auth/login-seller",
  "/api/v1/auth/seller-register",
  "/api/v1/auth/verify-seller",
  "/api/v1/auth/create-shop",
  "/api/v1/auth/create-stripe-link",
  "/api/v1/auth/refresh-token",
];

const shouldSkipAuthRefresh = (url?: string) =>
  Boolean(url && authRefreshExcludedPaths.some((path) => url.includes(path)));

let isRefreshing = false;
let refreshSubscribers: (() => void)[] = [];

// Handle logout and prevent infinite loops
const handleLogout = () => {
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
};

// Handle adding a new access token to queued requests
const subscribeTokenRefresh = (callback: () => void) => {
  refreshSubscribers.push(callback);
};

// Execute queued requests after refresh
const onRefreshSuccess = () => {
  refreshSubscribers.forEach((callback) => callback());
  refreshSubscribers = [];
};

// Handle API requests
axiosInstance.interceptors.request.use(
  (config) => {
    config.headers = AxiosHeaders.from(config.headers);
    config.headers.set("x-auth-role", "seller");

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle expired tokens and refresh logic
axiosInstance.interceptors.response.use((response) => response, async (error) => {
    const originalRequest = error.config;

    if (!originalRequest || shouldSkipAuthRefresh(originalRequest.url)) {
      return Promise.reject(error);
    }

    // prevent infinite retry loop
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh(() =>
            resolve(axiosInstance(originalRequest))
          );
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post(
          `${apiBaseUrl}/api/v1/auth/refresh-token`,
          { role: "seller" },
          {
            withCredentials: true,
            headers: {
              "x-auth-role": "seller",
            },
          }
        );

        isRefreshing = false;
        onRefreshSuccess();

        return axiosInstance(originalRequest);
      } catch (error) {
        isRefreshing = false;
        refreshSubscribers = [];
        handleLogout();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
