import { execSync, spawn } from "node:child_process";
import { setTimeout } from "node:timers/promises";

async function main() {
  // Build main process first
  console.log("Building main process...");
  execSync("npx tsup", { stdio: "inherit" });

  // Start Next.js dev server
  const next = spawn("npx", ["next", "dev", "--port", "3456", "renderer"], {
    stdio: "inherit",
    shell: true,
  });

  // Wait for Next.js to start
  console.log("Waiting for Next.js dev server...");
  await setTimeout(4000);

  // Start Electron
  const electron = spawn("npx", ["electron", "."], {
    stdio: "inherit",
    shell: true,
  });

  // Handle cleanup
  const cleanup = () => {
    next.kill();
    electron.kill();
    process.exit();
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  electron.on("close", () => {
    next.kill();
    process.exit();
  });
}

main();
