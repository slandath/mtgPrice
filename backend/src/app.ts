import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import rateLimit from "@fastify/rate-limit";
import fastifySensible from "@fastify/sensible";
import Fastify, { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import path from "node:path";
import { fileURLToPath } from "node:url";
import inventoryRoutes from "./routes/inventory";
import { auth } from "./utils/auth";
import { request } from "node:http";

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function getAllowedOrigins(): string | string[] {
  const corsOrigin = process.env.CORS_ORIGIN;
  if (!corsOrigin) {
    return "http://localhost:5173";
  }
  const origins = corsOrigin.split(",").map((origin) => origin.trim());
  return origins.length === 1 ? origins[0] : origins;
}

export async function buildApp() {
  const app = Fastify({
    logger: true,
    trustProxy: true,
  });
  await app.register(fastifySensible);
  await app.register(cors, {
    origin: getAllowedOrigins(),
    credentials: true,
    // methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    // allowedHeaders: ["Content-Type", "Authorization"],
  });

  await app.register(
    async (scoped) => {
      await scoped.register(rateLimit, {
        global: false,
        max: 10,
        timeWindow: "1 minute",
      });
      // Use Better-Auth's built-in handler
      scoped.all("/*", async (request, reply) => {
        try {
          const url = new URL(request.url, `${request.protocol}://${request.headers.host}`);
          const body =
            request.method === "GET" || request.method === "HEAD"
              ? undefined
              : request.body && typeof request.body === "object"
                ? JSON.stringify(request.body)
                : undefined;
          const headers = new Headers();
          for (const [key, value] of Object.entries(request.headers)) {
            if (value !== undefined)
              headers.set(key, Array.isArray(value) ? value.join(",") : value);
          }

          const req = new Request(url, {
            method: request.method,
            headers,
            ...(body ? { body } : {}),
          });
          const response = await auth.handler(req);
          reply.status(response.status);
          const setCookieHeaders: string[] = [];
          response.headers.forEach((value, key) => {
            if (key.toLowerCase() === "set-cookie") {
              setCookieHeaders.push(value);
            } else {
              reply.header(key, value);
            }
          });
          if (setCookieHeaders.length > 0) reply.header("set-cookie", setCookieHeaders);
          const responseBody = await response.text();
          return responseBody;
        } catch (error) {
          request.log.error({ err: error }, "Auth handler error");
          reply.status(500).send({ error: "Authentication failed" });
        }
      });
    },
    { prefix: "/api/auth" },
  );

  await app.register(inventoryRoutes, { prefix: "/api/inventory" });

  await app.register(fastifyStatic, {
    root: path.join(__dirname, "../../frontend/dist"),
    wildcard: false
  })

  app.setNotFoundHandler(async (request, reply) => {
    if (request.method === "GET") {
      return reply.sendFile("index.html")
    }
    return reply.status(404).send({ error: "Not found" })
  })

  app.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    request.log.error({ err: error }, "Unhandled route error");
    if (error.statusCode && error.statusCode < 500) {
      return reply.status(error.statusCode).send({ error: error.message });
    }
    return reply.status(500).send({ error: "Internal server error" });
  });

  return app;
}
