import type { AxiosRequestConfig } from "axios";

type CustomAxiosRequestConfig = AxiosRequestConfig & {
  requireAuth: boolean;
};

export const isProtected: CustomAxiosRequestConfig = {
  requireAuth: true,
};
