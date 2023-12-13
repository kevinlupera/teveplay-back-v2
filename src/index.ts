import { Hono } from "hono";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";
import { basicAuth } from "hono/basic-auth";
import { api } from "./api";
import { Bindings } from "./bindings";

const app = new Hono();
const token = "rwuy6434tgdgjhtiojiosi838tjue3";

// Prettier
app.use("*", prettyJSON({ space: 4 }));
// Cors
app.use("/api/*", cors());

app.get("/", (c) => c.text("Pretty API"));
// Error 404
app.notFound((c) => c.json({ message: "Not Found", code: 404 }, 404));

const middleware = new Hono<{ Bindings: Bindings }>();
middleware.use("*", prettyJSON());
app.use(
  "/api/*",
  basicAuth({
    username: "tvply",
    password: token,
  })
);
// API
app.route("/api", middleware);
app.route("/api", api);

export default app;
