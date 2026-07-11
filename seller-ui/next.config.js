//@ts-check

const devWatchIgnored = [
  "**/.git/**",
  "**/.next/**",
  "**/.nx/**",
  "**/.turbo/**",
  "**/coverage/**",
  "**/dist/**",
  "**/node_modules/**",
  "**/out-tsc/**",
  "**/test-output/**",
];

function mergeIgnoredWatchPaths(existingIgnored) {
  const existing = (Array.isArray(existingIgnored) ? existingIgnored : [existingIgnored]).filter(
    (ignored) => typeof ignored === "string" && ignored.trim() !== ""
  );
  return [...existing, ...devWatchIgnored].filter(
    (ignored, index, ignoredPaths) => ignoredPaths.indexOf(ignored) === index
  );
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js options go here
  // See: https://nextjs.org/docs/app/api-reference/config/next-config-js
  compiler: {
    styledComponents: true,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...(config.watchOptions || {}),
        aggregateTimeout: 1000,
        ignored: mergeIgnoredWatchPaths(config.watchOptions?.ignored),
      };
    }
    return config;
  },
};

module.exports = nextConfig;
