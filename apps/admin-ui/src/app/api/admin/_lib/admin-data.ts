import fs from "fs";
import { createRequire } from "module";
import path from "path";

type AnyRecord = Record<string, any>;

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

declare global {
  var __adminUiPrismaClient: any | undefined;
  var __adminUiMongoClient: any | undefined;
}

const fallbackImage =
  "https://placehold.co/80x80/111827/ffffff?text=Item";

const backendRootCandidates = [
  path.resolve(process.cwd(), "..", "E-Commerce-BG"),
  path.resolve(process.cwd(), "..", "..", "..", "E-Commerce-BG"),
  path.resolve(process.cwd(), "..", "..", "..", "..", "E-Commerce-BG"),
  "/Users/asifrayhan/Downloads/E-Commerce/E-Commerce-BG",
];

const parseEnvFile = (envPath: string) => {
  if (!fs.existsSync(envPath)) return;

  const envText = fs.readFileSync(envPath, "utf8");
  envText.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) return;

    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const rawValue = trimmed.slice(index + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");

    if (key === "DATABASE_URL") {
      process.env[key] = value;
      return;
    }

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
};

const getBackendRoot = () =>
  backendRootCandidates.find((candidate) =>
    fs.existsSync(path.join(candidate, "package.json"))
  );

const getBackendRequire = () => {
  const backendRoot = getBackendRoot();
  if (!backendRoot) {
    throw new Error("Backend root was not found.");
  }

  parseEnvFile(path.join(backendRoot, ".env"));
  return createRequire(path.join(backendRoot, "package.json"));
};

const getPrisma = () => {
  if (globalThis.__adminUiPrismaClient) {
    return globalThis.__adminUiPrismaClient;
  }

  const requireFromBackend = getBackendRequire();
  const { PrismaClient } = requireFromBackend("@prisma/client");

  globalThis.__adminUiPrismaClient = new PrismaClient();
  return globalThis.__adminUiPrismaClient;
};

const collectionNames: Record<string, string> = {
  admin: "admins",
  admins: "admins",
  user: "users",
  users: "users",
  user_address: "user_addresses",
  user_addresses: "user_addresses",
  userAddresses: "user_addresses",
  image: "images",
  images: "images",
  product: "products",
  products: "products",
  event: "events",
  events: "events",
  seller: "sellers",
  sellers: "sellers",
  shop: "shops",
  shops: "shops",
  order: "orders",
  orders: "orders",
  notification: "notifications",
  notifications: "notifications",
  site_config: "site_config",
  siteConfig: "site_config",
  customization: "site_config",
};

const getCollectionName = (names: string[]) =>
  names.map((name) => collectionNames[name]).find(Boolean);

const safeRawFindAll = async (names: string[]) => {
  const collectionName = getCollectionName(names);
  if (!collectionName) return [];

  try {
    const prisma = getPrisma();
    if (!prisma?.$runCommandRaw) return [];

    const result = await prisma.$runCommandRaw({
      find: collectionName,
      sort: { createdAt: -1 },
      batchSize: 500,
    });

    return result?.cursor?.firstBatch ?? [];
  } catch {
    return [];
  }
};

const safeRawFindFirst = async (names: string[], id: string) => {
  const collectionName = getCollectionName(names);
  if (!collectionName) return null;

  try {
    const prisma = getPrisma();
    if (!prisma?.$runCommandRaw) return null;

    const ids = [id];
    if (!id.startsWith("#")) ids.push(`#${id}`);
    if (id.startsWith("#")) ids.push(id.slice(1));

    const objectIds = ids
      .filter((candidate) => /^[a-f\d]{24}$/i.test(candidate))
      .map((candidate) => ({ _id: { $oid: candidate } }));

    const result = await prisma.$runCommandRaw({
      find: collectionName,
      filter: {
        $or: [
          ...objectIds,
          ...ids.flatMap((candidate) => [
            { id: candidate },
            { orderId: candidate },
            { productId: candidate },
            { eventId: candidate },
            { userId: candidate },
            { sellerId: candidate },
            { shopId: candidate },
          ]),
        ],
      },
      limit: 1,
    });

    return result?.cursor?.firstBatch?.[0] ?? null;
  } catch {
    return null;
  }
};

const getMongoDatabase = async () => {
  const requireFromBackend = getBackendRequire();
  const { MongoClient } = requireFromBackend("mongodb");
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing.");
  }

  if (!globalThis.__adminUiMongoClient) {
    globalThis.__adminUiMongoClient = new MongoClient(databaseUrl);
    await globalThis.__adminUiMongoClient.connect();
  }

  return globalThis.__adminUiMongoClient.db();
};

const safeMongoFindAll = async (names: string[]) => {
  const collectionName = getCollectionName(names);
  if (!collectionName) return [];

  try {
    const database = await getMongoDatabase();
    return await database
      .collection(collectionName)
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
  } catch {
    try {
      const database = await getMongoDatabase();
      return await database.collection(collectionName).find({}).toArray();
    } catch {
      return [];
    }
  }
};

const safeMongoFindFirst = async (names: string[], id: string) => {
  const collectionName = getCollectionName(names);
  if (!collectionName) return null;

  try {
    const requireFromBackend = getBackendRequire();
    const { ObjectId } = requireFromBackend("mongodb");
    const database = await getMongoDatabase();
    const ids = [id];
    if (!id.startsWith("#")) ids.push(`#${id}`);
    if (id.startsWith("#")) ids.push(id.slice(1));

    const objectIds = ids
      .filter((candidate) => ObjectId.isValid(candidate))
      .map((candidate) => new ObjectId(candidate));

    return await database.collection(collectionName).findOne({
      $or: [
        ...objectIds.map((candidate) => ({ _id: candidate })),
        ...ids.flatMap((candidate) => [
          { id: candidate },
          { orderId: candidate },
          { productId: candidate },
          { eventId: candidate },
          { userId: candidate },
          { sellerId: candidate },
          { shopId: candidate },
        ]),
      ],
    });
  } catch {
    return null;
  }
};

const getDelegate = (names: string[]) => {
  const prisma = getPrisma();
  return names.map((name) => prisma[name]).find(Boolean);
};

const safeFindAll = async (names: string[]) => {
  let delegate;
  try {
    delegate = getDelegate(names);
  } catch {
    return safeMongoFindAll(names);
  }

  if (!delegate?.findMany) {
    const rawRows = await safeRawFindAll(names);
    return rawRows.length ? rawRows : await safeMongoFindAll(names);
  }

  try {
    const rows = await delegate.findMany({ orderBy: { createdAt: "desc" } });
    if (rows.length) return rows;
    const rawRows = await safeRawFindAll(names);
    return rawRows.length ? rawRows : await safeMongoFindAll(names);
  } catch {
    try {
      const rows = await delegate.findMany();
      if (rows.length) return rows;
      const rawRows = await safeRawFindAll(names);
      return rawRows.length ? rawRows : await safeMongoFindAll(names);
    } catch {
      const rawRows = await safeRawFindAll(names);
      return rawRows.length ? rawRows : await safeMongoFindAll(names);
    }
  }
};

const safeFindFirst = async (names: string[], id: string) => {
  let delegate;
  try {
    delegate = getDelegate(names);
  } catch {
    return safeMongoFindFirst(names, id);
  }

  if (!delegate?.findFirst) {
    return (await safeRawFindFirst(names, id)) ?? safeMongoFindFirst(names, id);
  }

  const ids = [id];
  if (!id.startsWith("#")) ids.push(`#${id}`);
  if (id.startsWith("#")) ids.push(id.slice(1));

  for (const candidate of ids) {
    try {
      const row = await delegate.findFirst({
        where: {
          OR: [
            { id: candidate },
            { orderId: candidate },
            { productId: candidate },
            { eventId: candidate },
            { userId: candidate },
            { sellerId: candidate },
            { shopId: candidate },
          ],
        },
      });
      if (row) return row;
    } catch {
      try {
        const rows = await safeFindAll(names);
        return rows.find((row: AnyRecord) => getId(row) === id) ?? null;
      } catch {
        return null;
      }
    }
  }

  return (await safeRawFindFirst(names, id)) ?? safeMongoFindFirst(names, id);
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

const getIdValue = (value: any) => {
  const normalizedValue = normalizeMongoValue(value);
  return normalizedValue ? String(normalizedValue) : "";
};

const getId = (row: AnyRecord) =>
  getIdValue(row?.id ?? row?._id ?? row?.orderId ?? row?.productId ?? row?.eventId);

const getText = (...values: any[]) => {
  const value = values.map(normalizeMongoValue).find(
    (item) => typeof item === "string" && item.trim().length > 0
  );
  return value ? value.trim() : "";
};

const getNumber = (...values: any[]) => {
  for (const rawValue of values) {
    const value = normalizeMongoValue(rawValue);
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return 0;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);

const getDateValue = (value: any) => {
  const normalizedValue = normalizeMongoValue(value);
  if (!normalizedValue) return null;
  const date = new Date(normalizedValue);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value: any) => {
  const date = getDateValue(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("en-GB").format(date);
};

const imageFieldNames = [
  "url",
  "secure_url",
  "secureUrl",
  "src",
  "path",
  "image",
  "imageUrl",
  "image_url",
  "avatar",
  "avatarUrl",
  "avatar_url",
  "thumbnail",
  "thumbnailUrl",
  "thumbnail_url",
  "profileImage",
  "profile_image",
  "profilePicture",
  "profile_picture",
  "picture",
  "photo",
  "logo",
];

const getImageFromValue = (value: any): string => {
  const normalizedValue = normalizeMongoValue(value);

  if (typeof normalizedValue === "string") {
    const image = normalizedValue.trim();
    if (!image || image === "null" || image === "undefined") return "";

    if (image.startsWith("{") || image.startsWith("[")) {
      try {
        return getImageFromValue(JSON.parse(image));
      } catch {
        return image;
      }
    }

    return image;
  }

  if (Array.isArray(normalizedValue)) {
    for (const item of normalizedValue) {
      const image = getImageFromValue(item);
      if (image) return image;
    }
  }

  if (normalizedValue && typeof normalizedValue === "object") {
    for (const fieldName of imageFieldNames) {
      const image = getImageFromValue(normalizedValue[fieldName]);
      if (image) return image;
    }
  }

  return "";
};

const getOptionalImage = (...values: any[]) => {
  for (const value of values) {
    const image = getImageFromValue(value);
    if (image) return image;
  }

  return "";
};

const getImage = (...values: any[]) => getOptionalImage(...values) || fallbackImage;

const getStringList = (...values: any[]) => {
  for (const value of values) {
    if (Array.isArray(value)) {
      return value.map((item) => String(item)).filter(Boolean);
    }

    if (typeof value === "string" && value.trim()) {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
};

const stringifyValue = (...values: any[]) => {
  const value = values.find((item) => item !== undefined && item !== null && item !== "");
  if (Array.isArray(value)) return value.join(", ");
  if (value && typeof value === "object") return JSON.stringify(value);
  return value ? String(value) : "";
};

const paginate = <T>(items: T[], page: number, limit: number) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Number(limit) || 10);
  const start = (safePage - 1) * safeLimit;

  const distributionByCountry = mappedSellers.reduce<Record<string, number>>(
    (accumulator, seller) => {
      const country = getText(seller.country, "Global");
      accumulator[country] = (accumulator[country] ?? 0) + 1;
      return accumulator;
    },
    {}
  );

  return {
    items: items.slice(start, start + safeLimit),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: items.length,
      totalPages: Math.max(1, Math.ceil(items.length / safeLimit)),
    } satisfies Pagination,
  };
};

const includesSearch = (row: AnyRecord, search: string, keys: string[]) => {
  if (!search.trim()) return true;
  const query = search.trim().toLowerCase();
  return keys.some((key) => String(row[key] ?? "").toLowerCase().includes(query));
};

const byId = (rows: AnyRecord[]) =>
  new Map(rows.map((row) => [getId(row), row]).filter(([id]) => Boolean(id)));

const uniqueRows = <T extends AnyRecord>(rows: T[]) => {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const id = getId(row);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

const sortByDateDesc = <T extends AnyRecord>(rows: T[]) =>
  [...rows].sort((a, b) => {
    const aDate = getDateValue(a.createdAt ?? a.updatedAt)?.getTime() ?? 0;
    const bDate = getDateValue(b.createdAt ?? b.updatedAt)?.getTime() ?? 0;
    return bDate - aDate;
  });

const loadBaseTables = async () => {
  const [products, events, users, sellers, shops, orders, images, addresses] =
    await Promise.all([
    safeFindAll(["product", "products"]),
    safeFindAll(["event", "events"]),
    safeFindAll(["user", "users"]),
    safeFindAll(["seller", "sellers"]),
    safeFindAll(["shop", "shops"]),
    safeFindAll(["order", "orders"]),
    safeFindAll(["image", "images"]),
    safeFindAll(["user_address", "user_addresses", "userAddresses"]),
  ]);

  return { products, events, users, sellers, shops, orders, images, addresses };
};

const findShopForRow = (
  row: AnyRecord,
  shops: AnyRecord[],
  sellers: AnyRecord[] = []
) => {
  const shopsById = byId(shops);
  const sellersById = byId(sellers);
  const seller = sellersById.get(getIdValue(row.sellerId ?? row.vendorId));

  return (
    shopsById.get(getIdValue(row.shopId ?? row.storeId)) ??
    shops.find(
      (shop) =>
        getIdValue(shop.sellerId) === getIdValue(row.sellerId ?? seller?.id) ||
        getIdValue(shop.userId) === getIdValue(row.userId ?? seller?.userId)
    ) ??
    seller?.shop ??
    row.shop ??
    null
  );
};

const mapProduct = (
  product: AnyRecord,
  shops: AnyRecord[],
  sellers: AnyRecord[],
  images: AnyRecord[] = []
) => {
  const id = getId(product);
  const shop = findShopForRow(product, shops, sellers);
  const image = images.find((item) => getIdValue(item.productId) === id);
  const price = getNumber(product.sale_price, product.salePrice, product.price, product.regular_price);
  const regularPrice = getNumber(product.regular_price, product.regularPrice, product.compareAtPrice, price);

  return {
    id,
    image: getImage(image?.url, product.images, product.image, product.thumbnail),
    title: getText(product.title, product.name, product.productName, "Untitled product"),
    slug: getText(product.slug, product.handle, product.id),
    price: formatCurrency(price),
    regularPrice: formatCurrency(regularPrice),
    stock: `${getNumber(product.stock, product.quantity, product.inventory)} left`,
    stockCount: getNumber(product.stock, product.quantity, product.inventory),
    category: getText(product.category, product.categoryName, product.subCategory, "Uncategorized"),
    subCategory: getText(product.subCategory, product.sub_category, "Uncategorized"),
    rating: getNumber(product.ratings, product.rating, product.averageRating),
    shop: getText(shop?.name, product.shopName, product.storeName, "Unknown"),
    shopId: getText(shop?.id, product.shopId),
    status: getText(product.status, product.productStatus, "Active"),
    brand: getText(product.brand, product.brandName, "Generic"),
    tags: stringifyValue(product.tags),
    colors: stringifyValue(product.colors),
    sizes: getStringList(product.sizes, product.size),
    warranty: getText(product.warranty, "Not specified"),
    videoUrl: getText(product.video_url, product.videoUrl),
    shortDescription: getText(product.short_description, product.shortDescription, product.description),
    detailedDescription: getText(
      product.detailed_description,
      product.detailedDescription,
      product.description
    ),
    customSpecifications:
      product.custom_specifications ?? product.customSpecifications ?? {},
    customProperties: product.custom_properties ?? product.customProperties ?? {},
    created: formatDate(product.createdAt),
    createdAt: product.createdAt,
    description: getText(
      product.detailed_description,
      product.description,
      product.short_description
    ),
  };
};

const mapEvent = (
  event: AnyRecord,
  shops: AnyRecord[],
  sellers: AnyRecord[],
  products: AnyRecord[],
  images: AnyRecord[] = []
) => {
  const eventId = getId(event);
  const product = byId(products).get(getIdValue(event.productId));
  const productId = getId(product ?? event);
  const image = images.find(
    (item) =>
      getIdValue(item.productId) === eventId ||
      getIdValue(item.productId) === productId
  );
  const shop = findShopForRow(event, shops, sellers) ?? findShopForRow(product ?? {}, shops, sellers);

  return {
    id: eventId,
    image: getImage(image?.url, event.images, event.image, product?.images, product?.image),
    title: getText(event.title, event.name, product?.title, "Untitled event"),
    price: formatCurrency(
      getNumber(event.sale_price, event.salePrice, event.price, product?.sale_price, product?.price)
    ),
    stock: getNumber(event.stock, event.quantity, product?.stock),
    start: formatDate(event.start_date ?? event.startDate ?? event.startsAt ?? event.starting_date),
    end: formatDate(event.end_date ?? event.endDate ?? event.endsAt ?? event.ending_date),
    shopName: getText(shop?.name, event.shopName, product?.shopName, "Unknown"),
    createdAt: event.createdAt,
  };
};

const mapUser = (
  user: AnyRecord,
  orders: AnyRecord[] = [],
  images: AnyRecord[] = []
) => {
  const id = getId(user);
  const email = getText(user.email, user.loginEmail);
  const userImage = images.find((item) => getIdValue(item.userId) === id);
  const image = getImage(userImage?.url, user.avatar, user.image, user.picture);

  return {
    id,
    image,
    avatar: image,
    name: getText(user.name, user.fullName, user.username, "Unknown user"),
    email,
    role: getText(user.role, user.type, "User"),
    phone: getText(user.phone, user.phone_number, user.phoneNumber),
    orders: orders.filter(
      (order) =>
        getIdValue(order.userId ?? order.customerId ?? order.buyerId) === id ||
        Boolean(email && getText(order.email, order.customerEmail, order.buyerEmail) === email)
    ).length,
    joined: formatDate(user.createdAt),
    createdAt: user.createdAt,
  };
};

const adminEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeAdminEmail = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const getAdminHttpError = (message: string, status: number) =>
  Object.assign(new Error(message), { status });

const isDuplicateAdminError = (error: unknown) => {
  const code = (error as { code?: string | number })?.code;
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  return (
    code === "P2002" ||
    code === 11000 ||
    message.includes("e11000") ||
    message.includes("duplicate key")
  );
};

const hashAdminPassword = async (password: string) => {
  const requireFromBackend = getBackendRequire();
  const bcrypt = requireFromBackend("bcryptjs");
  return bcrypt.hash(password, 10) as Promise<string>;
};

const mapAdmin = (admin: AnyRecord) => ({
  id: getId(admin),
  name: getText(admin.name, "Admin"),
  email: getText(admin.email),
  role: "admin",
  createdAt: admin.createdAt,
});

export const normalizeAdminAccount = (admin: AnyRecord) => mapAdmin(admin);

export const getDatabaseAdmins = async (
  search = "",
  page = 1,
  limit = 100
) => {
  const admins = await safeFindAll(["admin", "admins"]);
  const mapped = sortByDateDesc(admins.map(mapAdmin)).filter((admin) =>
    includesSearch(admin, search, ["name", "email", "role"])
  );
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Number(limit) || 100);
  const totalAdmins = mapped.length;
  const totalPages = Math.max(1, Math.ceil(totalAdmins / safeLimit));
  const currentPage = Math.min(safePage, totalPages);
  const start = (currentPage - 1) * safeLimit;

  return {
    admins: mapped.slice(start, start + safeLimit),
    pagination: {
      page: currentPage,
      limit: safeLimit,
      total: totalAdmins,
      totalAdmins,
      totalPages,
    },
  };
};

export const createDatabaseAdmin = async ({
  email: rawEmail,
  password: rawPassword,
}: {
  email: string;
  password: string;
}) => {
  const email = normalizeAdminEmail(rawEmail);
  const password = typeof rawPassword === "string" ? rawPassword : "";

  if (!email || !password) {
    throw getAdminHttpError("Admin Gmail and password are required.", 400);
  }

  if (!adminEmailRegex.test(email)) {
    throw getAdminHttpError("Enter a valid admin Gmail.", 400);
  }

  const existingAdmin = (await safeFindAll(["admin", "admins"])).find(
    (admin: AnyRecord) => normalizeAdminEmail(admin.email) === email
  );

  if (existingAdmin) {
    throw getAdminHttpError("Admin already exists with this Gmail.", 409);
  }

  const adminData = {
    name: "Admin",
    email,
    password: await hashAdminPassword(password),
  };

  try {
    const delegate = getDelegate(["admin", "admins"]);

    if (delegate?.create) {
      return mapAdmin(
        await delegate.create({
          data: adminData,
        })
      );
    }
  } catch (error) {
    if (isDuplicateAdminError(error)) {
      throw getAdminHttpError("Admin already exists with this Gmail.", 409);
    }
  }

  try {
    const prisma = getPrisma();
    const now = new Date();
    const rawAdminData = {
      ...adminData,
      createdAt: { $date: now.toISOString() },
      updatedAt: { $date: now.toISOString() },
    };

    if (!prisma?.$runCommandRaw) {
      throw getAdminHttpError("Admin database connection is unavailable.", 500);
    }

    await prisma.$runCommandRaw({
      insert: "admins",
      documents: [rawAdminData],
    });
    const admin = (await safeRawFindAll(["admin", "admins"])).find(
      (row: AnyRecord) => normalizeAdminEmail(row.email) === email
    );

    return mapAdmin(admin ?? { ...adminData, createdAt: now });
  } catch (error) {
    if (isDuplicateAdminError(error)) {
      throw getAdminHttpError("Admin already exists with this Gmail.", 409);
    }

    throw error;
  }
};

const mapNotification = (notification: AnyRecord) => ({
  id: getId(notification),
  title: getText(notification.title, "Notification"),
  message: getText(notification.message),
  creatorId: getText(notification.creatorId, "admin"),
  receiverId: getText(notification.receiverId, "all"),
  redirectLink: getText(notification.redirect_link, notification.redirectLink),
  created: formatDate(notification.createdAt),
  createdAt: notification.createdAt,
});

export const normalizeAdminNotification = (notification: AnyRecord) =>
  mapNotification(notification);

const getNotificationHttpError = (message: string, status: number) =>
  Object.assign(new Error(message), { status });

const getNotificationPayload = (body: AnyRecord) => ({
  title: getText(body.title),
  message: getText(body.message),
  creatorId: getText(body.creatorId, "admin"),
  receiverId: getText(body.receiverId, body.target, "all"),
  redirectLink: getText(body.redirectLink, body.redirect_link),
});

export const getDatabaseNotifications = async (
  search = "",
  page = 1,
  limit = 20
) => {
  const notifications = await safeFindAll(["notification", "notifications"]);
  const mapped = sortByDateDesc(notifications.map(mapNotification)).filter(
    (notification) =>
      includesSearch(notification, search, [
        "title",
        "message",
        "creatorId",
        "receiverId",
      ])
  );
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Number(limit) || 20);
  const totalNotifications = mapped.length;
  const totalPages = Math.max(1, Math.ceil(totalNotifications / safeLimit));
  const currentPage = Math.min(safePage, totalPages);
  const start = (currentPage - 1) * safeLimit;

  return {
    notifications: mapped.slice(start, start + safeLimit),
    pagination: {
      page: currentPage,
      limit: safeLimit,
      total: totalNotifications,
      totalNotifications,
      totalPages,
    },
  };
};

export const createDatabaseNotification = async (body: AnyRecord) => {
  const payload = getNotificationPayload(body);

  if (!payload.title || !payload.message) {
    throw getNotificationHttpError(
      "Notification title and message are required.",
      400
    );
  }

  const data = {
    title: payload.title,
    message: payload.message,
    creatorId: payload.creatorId,
    receiverId: payload.receiverId,
    redirect_link: payload.redirectLink || null,
  };

  try {
    const delegate = getDelegate(["notification", "notifications"]);

    if (delegate?.create) {
      return mapNotification(
        await delegate.create({
          data,
        })
      );
    }
  } catch {
  }

  try {
    const prisma = getPrisma();
    const now = new Date();

    if (!prisma?.$runCommandRaw) {
      throw getNotificationHttpError(
        "Notification database connection is unavailable.",
        500
      );
    }

    await prisma.$runCommandRaw({
      insert: "notifications",
      documents: [
        {
          ...data,
          createdAt: { $date: now.toISOString() },
          updatedAt: { $date: now.toISOString() },
        },
      ],
    });

    const notification = (await safeRawFindAll([
      "notification",
      "notifications",
    ])).find(
      (row: AnyRecord) =>
        getText(row.title) === data.title &&
        getText(row.message) === data.message &&
        getText(row.receiverId) === data.receiverId
    );

    return mapNotification(notification ?? { ...data, createdAt: now });
  } catch (error) {
    throw error;
  }
};

const defaultCustomization = {
  categories: [
    "Electronics",
    "Fashion",
    "Home & Kitchen",
    "Sports & Fitness",
  ],
  subCategories: {
    Electronics: ["Mobiles", "Laptops", "Accessories", "Gaming"],
    Fashion: ["Men", "Women", "Kids", "Footwear"],
    "Home & Kitchen": ["Furniture", "Appliances", "Decor"],
    "Sports & Fitness": ["Gym Equipment", "Outdoor Sports", "Wearables"],
  },
  logoUrl: "",
  bannerUrl: "",
};

const getStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
    : [];

const mapCustomization = (config: AnyRecord = {}) => ({
  id: getId(config),
  categories: getStringArray(config.categories).length
    ? getStringArray(config.categories)
    : defaultCustomization.categories,
  subCategories:
    config.subCategories && typeof config.subCategories === "object"
      ? config.subCategories
      : defaultCustomization.subCategories,
  logoUrl: getText(
    config.logoUrl,
    config.logo,
    config.siteLogo,
    config.profilePhoto,
    config.profilePhotoUrl,
    config.avatar,
    config.avatarUrl
  ),
  bannerUrl: getText(
    config.bannerUrl,
    config.banner,
    config.siteBanner,
    config.coverPhoto,
    config.coverPhotoUrl,
    config.coverBanner,
    config.coverBannerUrl
  ),
  updatedAt: config.updatedAt,
});

const normalizeCustomizationImage = (value: unknown) => {
  const image = typeof value === "string" ? value.trim() : "";

  if (!image) {
    return "";
  }

  if (/^data:image\/[a-z0-9.+-]+;base64,/i.test(image)) {
    return image;
  }

  if (/^https?:\/\//i.test(image) || image.startsWith("/")) {
    return image;
  }

  throw getNotificationHttpError("Images must be uploaded from your PC.", 400);
};

const getCustomizationSubCategoryPayload = (
  value: unknown,
  fallbackCategory?: unknown,
  fallbackSubCategory?: unknown
) => {
  const record =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as AnyRecord)
      : {};

  return {
    category: getText(record.category, fallbackCategory),
    subCategory: getText(
      record.subCategory,
      record.subcategory,
      record.value,
      fallbackSubCategory,
      typeof value === "string" ? value : undefined
    ),
  };
};

const findCaseInsensitive = (items: string[], value: string) =>
  items.find((item) => item.toLowerCase() === value.toLowerCase());

const findSubCategoryGroupKey = (
  subCategories: Record<string, string[]>,
  category: string
) =>
  Object.keys(subCategories).find(
    (key) => key.toLowerCase() === category.toLowerCase()
  );

const getCustomizationUpdate = (body: AnyRecord) => {
  const update: AnyRecord = {};

  if (body.categories !== undefined) {
    update.categories = Array.from(
      new Set(
        getStringArray(body.categories).map((category) =>
          category.trim()
        )
      )
    );
  }

  if (body.category !== undefined) {
    const category = getText(body.category);
    if (!category) {
      throw getNotificationHttpError("Category name is required.", 400);
    }

    update.addCategory = category;
  }

  if (body.deleteCategory !== undefined) {
    const category = getText(body.deleteCategory);
    if (!category) {
      throw getNotificationHttpError("Category name is required.", 400);
    }

    update.deleteCategory = category;
  }

  if (
    body.addSubCategory !== undefined ||
    body.subCategory !== undefined ||
    body.subcategory !== undefined
  ) {
    const payload = getCustomizationSubCategoryPayload(
      body.addSubCategory,
      body.subCategoryCategory,
      body.subCategory ?? body.subcategory
    );

    if (!payload.category || !payload.subCategory) {
      throw getNotificationHttpError(
        "Category and sub category are required.",
        400
      );
    }

    update.addSubCategory = payload;
  }

  if (body.deleteSubCategory !== undefined) {
    const payload = getCustomizationSubCategoryPayload(
      body.deleteSubCategory,
      body.deleteSubCategoryCategory,
      body.deleteSubCategoryValue
    );

    if (!payload.category || !payload.subCategory) {
      throw getNotificationHttpError(
        "Category and sub category are required.",
        400
      );
    }

    update.deleteSubCategory = payload;
  }

  if (
    body.logoUrl !== undefined ||
    body.logo !== undefined ||
    body.siteLogo !== undefined ||
    body.profilePhoto !== undefined ||
    body.profilePhotoUrl !== undefined ||
    body.avatar !== undefined ||
    body.avatarUrl !== undefined
  ) {
    update.logoUrl = normalizeCustomizationImage(
      body.logoUrl ??
        body.logo ??
        body.siteLogo ??
        body.profilePhoto ??
        body.profilePhotoUrl ??
        body.avatar ??
        body.avatarUrl
    );
  }

  if (
    body.bannerUrl !== undefined ||
    body.banner !== undefined ||
    body.siteBanner !== undefined ||
    body.coverPhoto !== undefined ||
    body.coverPhotoUrl !== undefined ||
    body.coverBanner !== undefined ||
    body.coverBannerUrl !== undefined
  ) {
    update.bannerUrl = normalizeCustomizationImage(
      body.bannerUrl ??
        body.banner ??
        body.siteBanner ??
        body.coverPhoto ??
        body.coverPhotoUrl ??
        body.coverBanner ??
        body.coverBannerUrl
    );
  }

  return update;
};

export const getDatabaseCustomization = async () => {
  const configs = await safeRawFindAll(["site_config", "siteConfig"]);
  const mappedConfigs = configs.map(mapCustomization);

  return (
    mappedConfigs.find(
      (customization) => customization.logoUrl || customization.bannerUrl
    ) ??
    mappedConfigs[0] ??
    mapCustomization(defaultCustomization)
  );
};

export const updateDatabaseCustomization = async (body: AnyRecord) => {
  const prisma = getPrisma();

  if (!prisma?.$runCommandRaw) {
    throw getNotificationHttpError(
      "Customization database connection is unavailable.",
      500
    );
  }

  const current = await getDatabaseCustomization();
  const payload = getCustomizationUpdate(body);
  let categories = current.categories;
  const subCategories = Object.entries(current.subCategories || {}).reduce<
    Record<string, string[]>
  >((result, [category, values]) => {
    result[category] = getStringArray(values);
    return result;
  }, {});

  if (payload.categories) {
    categories = payload.categories;
  }

  if (payload.addCategory) {
    const existingCategory = findCaseInsensitive(
      categories,
      String(payload.addCategory)
    );

    if (!existingCategory) {
      categories = [...categories, payload.addCategory];
    }

    subCategories[existingCategory || payload.addCategory] =
      subCategories[existingCategory || payload.addCategory] || [];
  }

  if (payload.deleteCategory) {
    const categoryToDelete = String(payload.deleteCategory);
    const groupKey =
      findSubCategoryGroupKey(subCategories, categoryToDelete) ||
      categoryToDelete;

    categories = categories.filter(
      (category) =>
        category.toLowerCase() !== categoryToDelete.toLowerCase()
    );
    delete subCategories[groupKey];
  }

  if (payload.addSubCategory) {
    const { category, subCategory } = payload.addSubCategory;
    const existingCategory =
      findCaseInsensitive(categories, category) ||
      findSubCategoryGroupKey(subCategories, category) ||
      category;

    if (!findCaseInsensitive(categories, existingCategory)) {
      categories = [...categories, existingCategory];
    }

    const categoryKey =
      findCaseInsensitive(categories, existingCategory) || existingCategory;
    const existingGroupKey =
      findSubCategoryGroupKey(subCategories, categoryKey) || categoryKey;
    const currentSubCategories = getStringArray(
      subCategories[existingGroupKey]
    );

    if (
      !findCaseInsensitive(currentSubCategories, String(subCategory))
    ) {
      currentSubCategories.push(subCategory);
    }

    if (existingGroupKey !== categoryKey) {
      delete subCategories[existingGroupKey];
    }

    subCategories[categoryKey] = currentSubCategories;
  }

  if (payload.deleteSubCategory) {
    const { category, subCategory } = payload.deleteSubCategory;
    const categoryKey =
      findCaseInsensitive(categories, category) ||
      findSubCategoryGroupKey(subCategories, category) ||
      category;
    const existingGroupKey =
      findSubCategoryGroupKey(subCategories, categoryKey) || categoryKey;

    if (subCategories[existingGroupKey]) {
      subCategories[existingGroupKey] = getStringArray(
        subCategories[existingGroupKey]
      ).filter(
        (item) => item.toLowerCase() !== String(subCategory).toLowerCase()
      );
    }
  }

  const now = new Date();
  const update: AnyRecord = {
    categories,
    subCategories,
    updatedAt: { $date: now.toISOString() },
  };

  if (payload.logoUrl !== undefined) {
    update.logoUrl = payload.logoUrl;
    update.profilePhotoUrl = payload.logoUrl;
  } else if (current.logoUrl) {
    update.logoUrl = current.logoUrl;
    update.profilePhotoUrl = current.logoUrl;
  }

  if (payload.bannerUrl !== undefined) {
    update.bannerUrl = payload.bannerUrl;
    update.coverPhotoUrl = payload.bannerUrl;
  } else if (current.bannerUrl) {
    update.bannerUrl = current.bannerUrl;
    update.coverPhotoUrl = current.bannerUrl;
  }

  await prisma.$runCommandRaw({
    update: "site_config",
    updates: [
      {
        q: {},
        u: {
          $set: update,
          $setOnInsert: {
            createdAt: { $date: now.toISOString() },
          },
        },
        upsert: true,
      },
    ],
  });

  return getDatabaseCustomization();
};

const mapSeller = (
  seller: AnyRecord,
  users: AnyRecord[],
  shops: AnyRecord[],
  images: AnyRecord[] = [],
  sourceShop?: AnyRecord
) => {
  const usersById = byId(users);
  const shop = sourceShop ?? findShopForRow(seller, shops);
  const user =
    usersById.get(getIdValue(seller.userId ?? seller.ownerId ?? shop?.userId)) ??
    users.find((item) => item.email && item.email === seller.email);
  const shopImage = images.find((item) => getIdValue(item.shopId) === getId(shop ?? {}));

  return {
    id: getId(seller) || getId(shop ?? {}),
    avatar: getOptionalImage(
      shopImage?.url,
      seller.avatar,
      seller.avatarUrl,
      seller.avatar_url,
      seller.image,
      seller.imageUrl,
      seller.image_url,
      seller.picture,
      seller.photo,
      seller.profileImage,
      seller.profile_image,
      seller.profilePicture,
      seller.profile_picture,
      seller.logo,
      user?.avatar,
      user?.avatarUrl,
      user?.avatar_url,
      user?.image,
      user?.imageUrl,
      user?.image_url,
      user?.picture,
      user?.photo,
      user?.profileImage,
      user?.profile_image,
      user?.profilePicture,
      user?.profile_picture,
      shop?.avatar,
      shop?.avatarUrl,
      shop?.avatar_url,
      shop?.image,
      shop?.imageUrl,
      shop?.image_url,
      shop?.picture,
      shop?.photo,
      shop?.logo
    ),
    name: getText(seller.name, user?.name, shop?.sellerName, "Unknown seller"),
    email: getText(seller.email, user?.email, shop?.email),
    shopName: getText(shop?.name, seller.shopName, seller.storeName, "Unknown"),
    shopId: getText(shop?.id, seller.shopId),
    address: getText(shop?.address, seller.address, user?.address, "Not provided"),
    country: getText(shop?.country, seller.country, user?.country, "Global"),
    joined: formatDate(seller.createdAt ?? shop?.createdAt ?? user?.createdAt),
    createdAt: seller.createdAt ?? shop?.createdAt ?? user?.createdAt,
  };
};

export const normalizeAdminSeller = (seller: AnyRecord) => {
  const rawShop = seller.shop ?? seller.shops ?? seller.store ?? seller.storefront;
  const rawUser = seller.user ?? seller.users ?? seller.owner ?? seller.account;
  const shop = rawShop && typeof rawShop === "object" ? rawShop : {};
  const user = rawUser && typeof rawUser === "object" ? rawUser : {};
  const id =
    getId(seller) ||
    getId(shop) ||
    getId(user) ||
    getIdValue(seller.sellerId ?? seller.seller_id ?? seller.shopId ?? seller.shop_id);
  const shopId =
    getId(shop) ||
    getIdValue(seller.shopId ?? seller.shop_id ?? seller.storeId ?? seller.store_id) ||
    id;
  const createdAt = seller.createdAt ?? seller.created_at ?? shop.createdAt ?? user.createdAt;

  return {
    ...seller,
    id,
    shopId,
    avatar: getOptionalImage(
      seller.avatar,
      seller.avatarUrl,
      seller.avatar_url,
      seller.image,
      seller.imageUrl,
      seller.image_url,
      seller.picture,
      seller.photo,
      seller.profileImage,
      seller.profile_image,
      seller.profilePicture,
      seller.profile_picture,
      seller.logo,
      shop.avatar,
      shop.avatarUrl,
      shop.avatar_url,
      shop.image,
      shop.imageUrl,
      shop.image_url,
      shop.picture,
      shop.photo,
      shop.logo,
      user.avatar,
      user.avatarUrl,
      user.avatar_url,
      user.image,
      user.imageUrl,
      user.image_url,
      user.picture,
      user.photo,
      user.profileImage,
      user.profile_image,
      user.profilePicture,
      user.profile_picture,
      seller.images,
      shop.images,
      user.images
    ),
    name: getText(seller.name, user.name, user.fullName, user.username, shop.sellerName, "Unknown seller"),
    email: getText(seller.email, user.email, shop.email),
    shopName: getText(shop.name, seller.shopName, seller.shop_name, seller.storeName, seller.store_name, "Unknown"),
    address: getText(shop.address, seller.address, user.address, "Not provided"),
    country: getText(shop.country, seller.country, user.country, "Global"),
    category: getText(shop.category, seller.category),
    rating: getNumber(shop.ratings, shop.rating, seller.ratings, seller.rating),
    phone: getText(seller.phone, seller.phoneNumber, seller.phone_number, user.phone, user.phoneNumber, user.phone_number),
    joined: getText(seller.joined, seller.created) || formatDate(createdAt),
    updated: getText(seller.updated) || formatDate(seller.updatedAt ?? seller.updated_at ?? shop.updatedAt ?? user.updatedAt),
    createdAt,
  };
};

const mapOrder = (
  order: AnyRecord,
  users: AnyRecord[],
  shops: AnyRecord[],
  sellers: AnyRecord[],
  addresses: AnyRecord[] = []
) => {
  const usersById = byId(users);
  const buyer = usersById.get(getIdValue(order.userId ?? order.customerId ?? order.buyerId));
  const shop = findShopForRow(order, shops, sellers);
  const total = getNumber(
    order.total,
    order.totalAmount,
    order.totalPrice,
    order.amount,
    order.price,
    order.paidAmount
  );
  const status = getText(order.status, order.orderStatus, order.paymentStatus, "Pending");
  const orderId = getText(order.orderId, order.id);
  const savedAddress = addresses.find(
    (address) =>
      getId(address) === getIdValue(order.shippingAddressId) ||
      getIdValue(address.userId) === getIdValue(order.userId)
  );
  const rawAddress = order.shippingAddress ?? order.address ?? savedAddress ?? {};
  const shippingAddress =
    typeof rawAddress === "string"
      ? {
          name: "",
          street: rawAddress,
          cityLine: "",
          country: "",
        }
      : {
          name: getText(rawAddress.name, rawAddress.fullName, rawAddress.receiverName),
          street: getText(rawAddress.street, rawAddress.address1, rawAddress.address),
          cityLine: getText(
            rawAddress.cityLine,
            [rawAddress.city, rawAddress.state, rawAddress.zipCode, rawAddress.postalCode]
              .filter(Boolean)
              .join(", ")
          ),
          country: getText(rawAddress.country),
        };
  const sourceItems = Array.isArray(order.items ?? order.orderItems ?? order.products)
    ? order.items ?? order.orderItems ?? order.products
    : Array.isArray(order.cart)
    ? order.cart
    : Array.isArray(order.cart?.items)
    ? order.cart.items
    : [];
  const items = sourceItems.map((item: AnyRecord, index: number) => ({
        id: getText(item.id, item.productId, `${orderId}-${index}`),
        title: getText(item.title, item.name, item.productName, item.product?.title, "Item"),
        quantity: getNumber(item.quantity, item.qty, 1),
        size: getText(item.size, item.selectedSize),
        price: formatCurrency(getNumber(item.price, item.sale_price, item.total, item.product?.price)),
        image: getImage(item.image, item.images, item.product?.image, item.product?.images),
      }));

  return {
    id: getId(order),
    orderId,
    shop: getText(shop?.name, order.shopName, order.storeName, "Unknown"),
    buyer: getText(buyer?.name, order.customerName, order.buyerName, "Unknown"),
    customer: getText(buyer?.name, order.customerName, order.buyerName, "Unknown"),
    total: formatCurrency(total),
    totalValue: total,
    amount: formatCurrency(total),
    status,
    paymentStatus: getText(order.paymentStatus, order.payment_status, status),
    deliveryStatus: getText(order.deliveryStatus, order.delivery_status, order.status, "Ordered"),
    totalPaid: formatCurrency(total),
    date: formatDate(order.createdAt ?? order.date),
    createdAt: order.createdAt,
    shippingAddress,
    items,
  };
};

export const getDatabaseProducts = async (
  search = "",
  page = 1,
  limit = 10
) => {
  const { products, shops, sellers, images } = await loadBaseTables();
  const mapped = sortByDateDesc(
    products.map((product: AnyRecord) => mapProduct(product, shops, sellers, images))
  ).filter((product) =>
    includesSearch(product, search, ["title", "category", "shop"])
  );
  const { items, pagination } = paginate(mapped, page, limit);

  return {
    products: items,
    pagination: { ...pagination, totalProducts: pagination.total },
  };
};

export const getDatabaseProduct = async (productId: string) => {
  const { shops, sellers, images } = await loadBaseTables();
  const product = await safeFindFirst(["product", "products"], productId);
  return product ? mapProduct(product, shops, sellers, images) : null;
};

export const getDatabaseEvents = async (search = "", page = 1, limit = 10) => {
  const { events, shops, sellers, products, images } = await loadBaseTables();
  const productEvents = products.filter(
    (product: AnyRecord) => product.starting_date || product.ending_date
  );
  const sourceEvents = uniqueRows([...events, ...productEvents]);
  const mapped = sortByDateDesc(
    sourceEvents.map((event: AnyRecord) =>
      mapEvent(event, shops, sellers, products, images)
    )
  ).filter((event) =>
    includesSearch(event, search, ["title", "shopName"])
  );
  const { items, pagination } = paginate(mapped, page, limit);

  return {
    events: items,
    pagination: { ...pagination, totalEvents: pagination.total },
  };
};

export const getDatabaseUsers = async (search = "", page = 1, limit = 10) => {
  const { users, orders, images } = await loadBaseTables();
  const mapped = sortByDateDesc(
    users.map((user: AnyRecord) => mapUser(user, orders, images))
  ).filter((user) =>
    includesSearch(user, search, ["name", "email", "role"])
  );
  const { items, pagination } = paginate(mapped, page, limit);

  return {
    users: items,
    pagination: { ...pagination, totalUsers: pagination.total },
  };
};

export const getDatabaseUser = async (userId: string) => {
  const { orders, images } = await loadBaseTables();
  const user = await safeFindFirst(["user", "users"], userId);
  return user ? mapUser(user, orders, images) : null;
};

export const getDatabaseSellers = async (search = "", page = 1, limit = 10) => {
  const { users, sellers, shops, images } = await loadBaseTables();
  const fromSellers = sellers.map((seller: AnyRecord) =>
    mapSeller(seller, users, shops, images)
  );
  const fromShops = shops.map((shop: AnyRecord) =>
    mapSeller(
      sellers.find(
        (seller: AnyRecord) =>
          getId(seller) === getIdValue(shop.sellerId) ||
          getIdValue(seller.userId) === getIdValue(shop.userId)
      ) ?? shop,
      users,
      shops,
      images,
      shop
    )
  );
  const mapped = sortByDateDesc(uniqueRows([...fromSellers, ...fromShops])).filter(
    (seller) => includesSearch(seller, search, ["name", "email", "shopName", "address"])
  );
  const { items, pagination } = paginate(mapped, page, limit);

  return {
    sellers: items,
    pagination: { ...pagination, totalSellers: pagination.total },
  };
};

export const getDatabaseSeller = async (sellerId: string) => {
  const { users, shops, images } = await loadBaseTables();
  const seller =
    (await safeFindFirst(["seller", "sellers"], sellerId)) ??
    (await safeFindFirst(["shop", "shops"], sellerId));

  return seller ? mapSeller(seller, users, shops, images) : null;
};

export const getDatabaseOrders = async (search = "") => {
  const { orders, users, shops, sellers, addresses } = await loadBaseTables();
  return sortByDateDesc(
    orders.map((order: AnyRecord) =>
      mapOrder(order, users, shops, sellers, addresses)
    )
  ).filter((order) =>
    includesSearch(order, search, ["orderId", "shop", "buyer", "status"])
  );
};

export const getDatabaseOrder = async (orderId: string) => {
  const { users, shops, sellers, addresses } = await loadBaseTables();
  const order = await safeFindFirst(["order", "orders"], orderId);
  return order ? mapOrder(order, users, shops, sellers, addresses) : null;
};

export const getDatabaseDashboard = async () => {
  const { products, events, users, sellers, shops, orders, images, addresses } =
    await loadBaseTables();
  const eventRecords = uniqueRows([
    ...events,
    ...products.filter(
      (product: AnyRecord) => product.starting_date || product.ending_date
    ),
  ]);
  const mappedOrders = orders.map((order: AnyRecord) =>
    mapOrder(order, users, shops, sellers, addresses)
  );

  const now = new Date();
  const months = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 6 + index, 1);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      month: date.toLocaleString("en-US", { month: "short" }),
      total: 0,
      count: 0,
    };
  });

  mappedOrders.forEach((order) => {
    const date = getDateValue(order.createdAt);
    if (!date) return;

    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const bucket = months.find((month) => month.key === key);
    if (bucket) {
      bucket.total += Number(order.totalValue) || 0;
      bucket.count += 1;
    }
  });

  let activeRevenueIndex = -1;
  for (let index = months.length - 1; index >= 0; index -= 1) {
    const month = months[index];
    if (month && (month.total > 0 || month.count > 0)) {
      activeRevenueIndex = index;
      break;
    }
  }
  if (activeRevenueIndex === -1) activeRevenueIndex = Math.min(4, months.length - 1);

  const revenue = months.map((month, index) => ({
    month: month.month,
    total: month.total,
    count: month.count,
    active: index === activeRevenueIndex,
  }));

  const mappedSellers = uniqueRows([
    ...sellers.map((seller: AnyRecord) => mapSeller(seller, users, shops, images)),
    ...shops.map((shop: AnyRecord) => mapSeller(shop, users, shops, images, shop)),
  ]);
  const markerRevenue = revenue[activeRevenueIndex] ?? revenue[0] ?? {
    month: "May",
    total: 0,
    count: 0,
  };

  return {
    stats: {
      totalUsers: users.length,
      totalSellers: mappedSellers.length,
      totalProducts: products.length,
      totalEvents: eventRecords.length,
      totalOrders: orders.length,
      totalRevenue: mappedOrders.reduce(
        (sum, order) => sum + (Number(order.totalValue) || 0),
        0
      ),
      successfulOrders: mappedOrders.filter((order) =>
        ["paid", "delivered", "completed", "success"].includes(
          order.status.toLowerCase()
        )
      ).length,
      pendingOrders: mappedOrders.filter((order) =>
        order.status.toLowerCase().includes("pending")
      ).length,
    },
    revenue,
    revenueMarker: {
      index: activeRevenueIndex,
      month: markerRevenue.month,
      value: markerRevenue.count,
      total: markerRevenue.total,
    },
    deviceUsage: {
      phone: Math.max(users.length, 1),
      tablet: Math.max(Math.round(users.length * 0.35), 1),
      computer: Math.max(Math.round(users.length * 0.45), 1),
    },
    distribution:
      mappedSellers.length > 0
        ? Object.entries(distributionByCountry).map(([country, sellers]) => ({
            country,
            sellers,
          }))
        : [{ country: "Global", sellers: 0 }],
    recentOrders: mappedOrders.slice(0, 6).map((order) => ({
      id: order.orderId,
      customer: order.customer,
      amount: order.total,
      status: order.status,
    })),
  };
};
