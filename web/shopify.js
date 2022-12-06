import { LogSeverity } from "@shopify/shopify-api";
import { restResources } from "@shopify/shopify-api/rest/admin/2022-10";
import { shopifyApp } from "@shopify/shopify-app-express";
import { SQLiteSessionStorage } from "@shopify/shopify-app-express/session-storage/sqlite";

const DB_PATH = `${process.cwd()}/database.sqlite`;

const shopify = shopifyApp({
  api: {
    restResources,
  },
  // This should be replaced with your preferred storage strategy
  sessionStorage: new SQLiteSessionStorage(DB_PATH),
});

export default shopify;
