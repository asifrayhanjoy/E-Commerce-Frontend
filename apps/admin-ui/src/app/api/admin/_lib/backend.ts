const isProduction = process.env.NODE_ENV === "production";

const unique = (values: string[]) =>
  values.filter((value, index, allValues) => value && allValues.indexOf(value) === index);

const trimTrailingSlash = (value: string) => value.trim().replace(/\/+$/, "");

const normalizeApiV1Base = (value?: string) => {
  if (!value?.trim()) return "";

  const base = trimTrailingSlash(value);
  if (/\/api\/v1$/i.test(base)) return base;
  if (/\/api$/i.test(base)) return `${base}/v1`;

  return `${base}/api/v1`;
};

const normalizeApiBase = (value?: string) => {
  if (!value?.trim()) return "";

  const base = trimTrailingSlash(value);
  if (/\/api$/i.test(base)) return base;
  if (/\/api\/v1$/i.test(base)) return base.replace(/\/v1$/i, "");

  return `${base}/api`;
};

export const getAdminBackendBases = () =>
  unique([
    normalizeApiV1Base(process.env.NEXT_PUBLIC_API_URL),
    normalizeApiV1Base(process.env.NEXT_PUBLIC_SERVER_URI),
    normalizeApiV1Base(process.env.API_GATEWAY_URL),
    ...(isProduction
      ? []
      : ["http://localhost:8383/api/v1", "http://localhost:8080/api/v1"]),
  ]);

export const getProductBackendBases = () =>
  unique([
    normalizeApiV1Base(process.env.PRODUCT_SERVICE_URL),
    ...getAdminBackendBases(),
    ...(isProduction ? [] : ["http://localhost:8181/api/v1"]),
  ]);

export const getOrderBackendBases = () =>
  unique([
    normalizeApiBase(process.env.ORDER_SERVICE_URL),
    ...getAdminBackendBases(),
    ...(isProduction ? [] : ["http://localhost:8282/api"]),
  ]);
