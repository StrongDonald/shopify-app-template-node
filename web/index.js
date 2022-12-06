// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import shopify from "./shopify.js";
import productCreator from "./product-creator.js";

const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT, 10);

// TODO: There should be provided by env vars
const DEV_INDEX_PATH = `${process.cwd()}/frontend/`;
const PROD_INDEX_PATH = `${process.cwd()}/frontend/dist/`;

// export for test use only
export async function createServer(
  isProd = process.env.NODE_ENV === "production"
) {
  const app = express();

  app.use("/api", shopify.auth());
  app.use("/api", shopify.webhooks({handlers: shopify.config.webhooks.handlers}));

  // All endpoints after this point will require an active session
  app.use("/api/*", shopify.authenticatedRequest());

  app.get("/api/products/count", async (_req, res) => {
    const countData = await shopify.api.rest.Product.count({
      session: res.locals.shopify.session,
    });
    res.status(200).send(countData);
  });

  app.get("/api/products/create", async (_req, res) => {
    let status = 200;
    let error = null;

    try {
      await productCreator(res.locals.shopify.session);
    } catch (e) {
      console.log(`Failed to process products/create: ${e.message}`);
      status = 500;
      error = e.message;
    }
    res.status(status).send({ success: status === 200, error });
  });

  if (isProd) {
    const compression = await import("compression").then(
      ({ default: fn }) => fn
    );
    const serveStatic = await import("serve-static").then(
      ({ default: fn }) => fn
    );
    app.use(compression());
    app.use(serveStatic(PROD_INDEX_PATH, { index: false }));
  }

  app.use("/*", shopify.ensureInstalled(), async (_req, res, _next) => {
    const htmlFile = join(
      isProd ? PROD_INDEX_PATH : DEV_INDEX_PATH,
      "index.html"
    );

    return res
      .status(200)
      .set("Content-Type", "text/html")
      .send(readFileSync(htmlFile));
  });

  return { app };
}

createServer().then(({ app }) => app.listen(PORT));
