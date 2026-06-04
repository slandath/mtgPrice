import cron from "node-cron";
import { buildApp } from "./app";
import { refreshAllPrices } from "./services/refreshAllPrices";

const PORT = Number(process.env.PORT) || 3000;

async function start() {
  const app = await buildApp();
  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
    app.log.info(`Server listening on port ${PORT}`);

    // Weekly price refresh - Sunday midnight UTC
    cron.schedule(
      "0 0 * * 0",
      async () => {
        app.log.info("Starting weekly price refresh...");
        try {
          const results = await refreshAllPrices();
          app.log.info({ results }, "Weekly price refresh completed");
        } catch (error) {
          app.log.error({ err: error }, "Weekly price refresh failed");
        }
      },
      { timezone: "UTC" },
    );
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}
start();
