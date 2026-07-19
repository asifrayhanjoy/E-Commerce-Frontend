import fs from "fs";
import { createRequire } from "module";
import { NextResponse } from "next/server";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnyRecord = Record<string, any>;

declare global {
  var __customerUiPrismaClient: any | undefined;
}

const backendBases = [
  process.env.NEXT_PUBLIC_API_URL,
  process.env.NEXT_PUBLIC_SERVER_URI,
  "http://localhost:8383/api/v1",
  "http://localhost:8080/api/v1",
].filter(Boolean) as string[];

const customizationUrls = [
  process.env.NEXT_PUBLIC_ADMIN_CUSTOMIZATION_URL,
  "http://localhost:6003/api/admin/customization",
  ...backendBases.flatMap((base) => [
    `${base}/admin/customization`,
    `${base}/auth/admin/customization`,
  ]),
].filter(Boolean) as string[];

const backendRootCandidates = [
  path.resolve(process.cwd(), "..", "E-Commerce-BG"),
  path.resolve(process.cwd(), "..", "..", "..", "E-Commerce-BG"),
  path.resolve(process.cwd(), "..", "..", "..", "..", "E-Commerce-BG"),
  "/Users/asifrayhan/Downloads/E-Commerce/E-Commerce-BG",
];

const parseEnvFile = (envPath: string) => {
  if (!fs.existsSync(envPath)) return;

  fs.readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) return;

      const index = trimmed.indexOf("=");
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");

      if (key === "DATABASE_URL" || process.env[key] === undefined) {
        process.env[key] = value;
      }
    });
};

const getBackendRoot = () =>
  backendRootCandidates.find((candidate) =>
    fs.existsSync(path.join(candidate, "package.json"))
  );

const getPrisma = () => {
  if (globalThis.__customerUiPrismaClient) {
    return globalThis.__customerUiPrismaClient;
  }

  const backendRoot = getBackendRoot();

  if (!backendRoot) {
    throw new Error("Backend root was not found.");
  }

  parseEnvFile(path.join(backendRoot, ".env"));
  parseEnvFile(path.join(backendRoot, "apps", "E-Commerce-BG", ".env"));
  parseEnvFile(path.join(backendRoot, "apps", "E-Commerce-BG", "product-service", ".env"));
  const requireFromBackend = createRequire(path.join(backendRoot, "package.json"));
  const { PrismaClient } = requireFromBackend("@prisma/client");
  globalThis.__customerUiPrismaClient = new PrismaClient();

  return globalThis.__customerUiPrismaClient;
};

const normalizeMongoValue = (value: any): any => {
  if (value && typeof value === "object") {
    if (typeof value.$oid === "string") return value.$oid;
    if (value.$date?.$numberLong) return Number(value.$date.$numberLong);
    if (value.$date) return value.$date;
    if (value.$numberInt) return Number(value.$numberInt);
    if (value.$numberDouble) return Number(value.$numberDouble);
    if (value.$numberLong) return Number(value.$numberLong);
  }

  return value;
};

const getImageUrlFromValue = (value: unknown): string => {
  const normalizedValue = normalizeMongoValue(value);

  if (typeof normalizedValue === "string") {
    return normalizedValue.trim();
  }

  if (Array.isArray(normalizedValue)) {
    for (const image of normalizedValue) {
      const url = getImageUrlFromValue(image);

      if (url) {
        return url;
      }
    }
  }

  if (normalizedValue && typeof normalizedValue === "object") {
    const record = normalizedValue as Record<string, unknown>;

    return getImageUrlFromValue(
      record.url ??
        record.secure_url ??
        record.secureUrl ??
        record.src ??
        record.image ??
        record.imageUrl ??
        record.logoUrl ??
        record.logo ??
        record.siteLogo ??
        record.avatar ??
        record.avatarUrl ??
        record.profilePhoto ??
        record.profilePhotoUrl ??
        record.profileImage ??
        record.profileImageUrl ??
        record.bannerUrl ??
        record.banner ??
        record.siteBanner ??
        record.coverPhoto ??
        record.coverPhotoUrl ??
        record.coverImage ??
        record.coverImageUrl ??
        record.coverBanner ??
        record.coverBannerUrl
    );
  }

  return "";
};

const getImageUrl = (...values: unknown[]) => {
  for (const value of values) {
    const url = getImageUrlFromValue(value);

    if (url) {
      return url;
    }
  }

  return "";
};

const mapCustomization = (config: AnyRecord = {}) => ({
  logoUrl: getImageUrl(
    config.logoUrl,
    config.logo,
    config.siteLogo,
    config.profilePhoto,
    config.profilePhotoUrl,
    config.profileImage,
    config.profileImageUrl,
    config.avatar,
    config.avatarUrl,
    config.image,
    config.imageUrl
  ),
  bannerUrl: getImageUrl(
    config.bannerUrl,
    config.banner,
    config.siteBanner,
    config.coverPhoto,
    config.coverPhotoUrl,
    config.coverImage,
    config.coverImageUrl,
    config.coverBanner,
    config.coverBannerUrl
  ),
});

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

const getBackendCustomization = async () => {
  for (const url of customizationUrls) {
    try {
      const response = await fetch(url, {
        cache: "no-store",
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const customization = data?.customization ?? data?.data ?? data;
      const mappedCustomization = mapCustomization(customization);

      if (mappedCustomization.logoUrl || mappedCustomization.bannerUrl) {
        return mappedCustomization;
      }
    } catch {
      continue;
    }
  }

  return null;
};

const getDatabaseCustomization = async () => {
  const prisma = getPrisma();
  const result = (await prisma.$runCommandRaw({
    find: "site_config",
    sort: {
      updatedAt: -1,
      createdAt: -1,
    },
    batchSize: 50,
  })) as AnyRecord;
  const configs = (result?.cursor?.firstBatch ?? []) as AnyRecord[];
  const mappedConfigs = configs.map((config) => mapCustomization(config));

  return (
    mappedConfigs.find(
      (customization) => customization.logoUrl || customization.bannerUrl
    ) ??
    mappedConfigs[0] ??
    mapCustomization()
  );
};

export async function GET() {
  const backendCustomization = await getBackendCustomization();

  if (backendCustomization?.logoUrl || backendCustomization?.bannerUrl) {
    return NextResponse.json(
      {
        success: true,
        customization: backendCustomization,
      },
      {
        headers: noStoreHeaders,
      }
    );
  }

  try {
    const customization = await getDatabaseCustomization();

    return NextResponse.json(
      {
        success: true,
        customization,
      },
      {
        headers: noStoreHeaders,
      }
    );
  } catch {
    return NextResponse.json(
      {
        success: true,
        customization: {
          logoUrl: "",
          bannerUrl: "",
        },
      },
      {
        headers: noStoreHeaders,
      }
    );
  }
}
