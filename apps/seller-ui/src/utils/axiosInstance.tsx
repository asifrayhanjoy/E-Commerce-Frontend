import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:8080",
  withCredentials: true,
});

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
  (config) => config,
  (error) => Promise.reject(error)
);

// Handle expired tokens and refresh logic
axiosInstance.interceptors.response.use((response) => response, async (error) => {
    const originalRequest = error.config;

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
          "http://localhost:8080/api/v1/auth/refresh-token",
          { role: "seller" },
          {
            withCredentials: true,
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
