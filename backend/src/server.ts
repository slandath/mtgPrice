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

  const shutdown = async () => {
    app.log.info("Shutting down...");
    await app.close();
    await db.$client.end();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

start();
