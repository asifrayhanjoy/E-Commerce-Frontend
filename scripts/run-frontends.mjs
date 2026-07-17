import { spawn } from "node:child_process";
import path from "node:path";

const nxBin = path.join(
  process.cwd(),
  "node_modules",
  ".bin",
  process.platform === "win32" ? "nx.cmd" : "nx"
);

const services = [
  {
    name: "customer:6001",
    args: ["dev", "E-Commerce", "--port=6001", "--webpack"],
  },
  {
    name: "seller:6002",
    args: ["dev", "seller-ui", "--port=6002", "--webpack"],
  },
  {
    name: "admin:6003",
    args: ["dev", "admin-ui", "--port=6003"],
  },
];

const children = new Map();
let shuttingDown = false;

const prefixOutput = (name, chunk, writer) => {
  const lines = chunk.toString().split(/\r?\n/);

  lines.forEach((line, index) => {
    if (!line && index === lines.length - 1) {
      return;
    }

    writer(`[${name}] ${line}\n`);
  });
};

const shutdown = (exitCode = 0) => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children.values()) {
    if (!child.killed) {
      child.kill("SIGINT");
    }
  }

  setTimeout(() => {
    for (const child of children.values()) {
      if (!child.killed) {
        child.kill("SIGTERM");
      }
    }

    process.exit(exitCode);
  }, 1500);
};

for (const service of services) {
  const child = spawn(nxBin, service.args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      FORCE_COLOR: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  children.set(service.name, child);

  child.stdout.on("data", (chunk) =>
    prefixOutput(service.name, chunk, process.stdout.write.bind(process.stdout))
  );
  child.stderr.on("data", (chunk) =>
    prefixOutput(service.name, chunk, process.stderr.write.bind(process.stderr))
  );

  child.on("exit", (code, signal) => {
    children.delete(service.name);

    if (!shuttingDown && code !== 0) {
      console.error(
        `[${service.name}] exited with ${signal || `code ${code}`}. Stopping all frontends.`
      );
      shutdown(code || 1);
    }
  });
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
