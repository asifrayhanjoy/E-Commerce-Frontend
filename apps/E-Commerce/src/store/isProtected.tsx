type CustomAxiosRequestConfig = {
  requireAuth: boolean;
};

export const isProtected: CustomAxiosRequestConfig = {
  requireAuth: true,
};