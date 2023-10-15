import { Hono } from "hono";
import { cache } from "hono/cache";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";
import { api } from "./api";
import { Bindings } from "./bindings";

const app = new Hono();
// Prettier
app.use("*", prettyJSON({ space: 4 }));
// Cors
app.use("/api/*", cors());
// Cache
app.get(
  "*",
  cache({
    cacheName: "my-app",
    cacheControl: "max-age=3600",
  })
);

app.get("/", (c) => c.text("Pretty API"));
// Error 404
app.notFound((c) => c.json({ message: "Not Found", ok: false }, 404));

const middleware = new Hono<{ Bindings: Bindings }>();
middleware.use("*", prettyJSON());

// API
app.route("/api", middleware);
app.route("/api", api);

export default app;
