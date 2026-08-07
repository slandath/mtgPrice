import { buildApp } from "./app.js";
import { db } from "./index.js";

const PORT = Number(process.env.PORT) || 3000;

async function start() {
  const app = await buildApp();
  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
    app.log.info(`Server listening on port ${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  let shuttingDown = false;

  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    app.log.info(`Received ${signal}, shutting down...`);
    const results = await Promise.allSettled([app.close(), db.$client.end()]);
    const failures = results.filter((r) => r.status === "rejected");
    if (failures.length > 0) {
      app.log.error("One or more cleanup steps failed during shutdown");
      process.exit(1);
    }
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start();
