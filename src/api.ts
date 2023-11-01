import { Hono } from "hono";
import { cors } from "hono/cors";
import { Bindings } from "./bindings";
import {
  createCategory,
  createLive,
  createMetadata,
  deleteCategory,
  deleteLive,
  deleteMetadata,
  editVersion,
  findAllCategories,
  findAllLives,
  findAllMetadata,
  findCategoryById,
  findEventsByFilters,
  findLiveById,
  findLivesByPage,
  findMetadataById,
  getTotalEvents,
  getVersion,
  updateCategory,
  updateLive,
  updateMetadata,
} from "./query";
import { ICategory } from "./ICategory";
import { IStream } from "./IStream";
import { IMetadata } from "./IMetadata";

const ROWS_BY_PAGE: number = 10;
const api = new Hono<{ Bindings: Bindings }>();

api.use("/events/*", cors());
api.use("/version/*", cors());
api.use("/categories/*", cors());

api.get("/", (c) => {
  return c.json({ message: "Hello" });
});

// Version
api.get("/version", async (c) => {
  try {
    let results = await getVersion(c);
    return c.json(results);
  } catch (e) {
    console.error(e);
    return c.json({ error: e }, 500);
  }
});

api.put("/version", async (c) => {
  try {
    const { version }: any = await c.req.json();
    let result = await editVersion(c, version);
    return c.json(result);
  } catch (e) {
    if (e?.code == "PGRST116") {
      return c.json({ error: "NOT FOUND" }, 404);
    }
    console.error(e);
    return c.json({ error: e }, 500);
  }
});

// Categories

api.get("/categories", async (c) => {
  try {
    let results = await findAllCategories(c);
    return c.json(results);
  } catch (e) {
    console.error(e);
    return c.json({ error: e }, 500);
  }
});

api.get("/categories/:id", async (c) => {
  try {
    const id = c.req.param("id") ? Number(c.req.param("id")) : null;
    let results = await findCategoryById(c, id);
    if (results.length == 0) {
      return c.json({ error: "NOT FOUND" }, 404);
    }
    return c.json(results);
  } catch (e) {
    if (e?.code == "PGRST116") {
      return c.json({ error: "NOT FOUND" }, 404);
    }
    console.error(e);
    return c.json({ error: e }, 500);
  }
});

api.post("/categories", async (c) => {
  try {
    const category: ICategory = await c.req.json();
    let result = await createCategory(c, category);
    return c.json(result);
  } catch (e) {
    console.error(e);
    return c.json({ error: e }, 500);
  }
});

api.put("/categories/:id", async (c) => {
  try {
    const id = c.req.param("id") ? Number(c.req.param("id")) : null;
    const category: ICategory = await c.req.json();
    let result = await updateCategory(c, id, category);
    return c.json(result);
  } catch (e) {
    if (e?.code == "PGRST116") {
      return c.json({ error: "NOT FOUND" }, 404);
    }
    console.error(e);
    return c.json({ error: e }, 500);
  }
});

api.delete("/categories/:id", async (c) => {
  try {
    const id = c.req.param("id") ? Number(c.req.param("id")) : null;
    await findCategoryById(c, id);
    await deleteCategory(c, id);
    return c.json({
      code: true,
      message: `Resource with ID: ${id} deleted`,
    });
  } catch (e: any) {
    if (e?.code == "PGRST116") {
      return c.json({ error: "NOT FOUND" }, 404);
    }
    console.error(e);
    return c.json({ error: e }, 500);
  }
});

// Events

api.get("/lives", async (c) => {
  try {
    const page = c.req.query("page") ? Number(c.req.query("page")) : 1;
    const idCategory = c.req.query("category")
      ? Number(c.req.query("category"))
      : null;
    const country = c.req.query("country") ? c.req.query("country") : null;
    if (!idCategory || !country) {
      return c.json(
        { code: 400, message: "Query params: category, country is mandatory!" },
        400
      );
    }

    const start = ROWS_BY_PAGE * (page - 1);
    const total: number = await getTotalEvents(c, idCategory, country);

    const totalPages = total ? Math.round(total / ROWS_BY_PAGE) : 0;
    let results = await findLivesByPage(
      c,
      idCategory,
      country,
      start,
      page * ROWS_BY_PAGE
    );
    return c.json(formatResponse(results, page, totalPages, total));
  } catch (e) {
    console.error(e);
    return c.json({ error: e }, 500);
  }
});

api.get("/lives/:id", async (c) => {
  try {
    const id = c.req.param("id") ? Number(c.req.param("id")) : null;
    let results = await findLiveById(c, id);
    return c.json(results);
  } catch (e) {
    if (e?.code == "PGRST116") {
      return c.json({ error: "NOT FOUND" }, 404);
    }
    console.error(e);
    return c.json({ error: e }, 500);
  }
});

api.post("/lives", async (c) => {
  try {
    const event: IStream = await c.req.json();
    let result = await createLive(c, event);
    return c.json(result);
  } catch (e) {
    console.error(e);
    return c.json({ error: e }, 500);
  }
});

api.put("/lives/:id", async (c) => {
  try {
    const id = c.req.param("id") ? Number(c.req.param("id")) : null;
    const event: IStream = await c.req.json();
    let result = await updateLive(c, id, event);
    return c.json(result);
  } catch (e) {
    if (e?.code == "PGRST116") {
      return c.json({ error: "NOT FOUND" }, 404);
    }
    console.error(e);
    return c.json({ error: e }, 500);
  }
});

api.delete("/lives/:id", async (c) => {
  try {
    const id = c.req.param("id") ? Number(c.req.param("id")) : null;
    await findLiveById(c, id);
    await deleteLive(c, id);
    return c.json({
      code: true,
      message: `Resource with ID: ${id} deleted`,
    });
  } catch (e: any) {
    if (e?.code == "PGRST116") {
      return c.json({ error: "NOT FOUND" }, 404);
    }
    console.error(e);
    return c.json({ error: e }, 500);
  }
});

api.get("/events", async (c) => {
  try {
    const idCategory = c.req.query("category")
      ? Number(c.req.query("category"))
      : null;
    const country = c.req.query("country") ? c.req.query("country") : null;
    if (!country && !idCategory) {
      let results = await findAllLives(c);
      return c.json(results);
    }
    let results = await findEventsByFilters(c, idCategory, country);
    return c.json(results);
  } catch (e) {
    console.error(e);
    return c.json({ error: e }, 500);
  }
});

const formatResponse = (
  rows: any,
  page: number,
  totalPages: number,
  total: number
) => {
  return {
    page,
    results: rows,
    total_pages: totalPages,
    total_results: total,
  };
};

// Metadata


api.get("/metadatas", async (c) => {
  try {
    let results = await findAllMetadata(c);
    return c.json(results);
  } catch (e) {
    console.error(e);
    return c.json({ error: e }, 500);
  }
});

api.get("/metadatas/:id", async (c) => {
  try {
    const id = c.req.param("id") ? Number(c.req.param("id")) : null;
    let results = await findMetadataById(c, id);
    if (results.length == 0) {
      return c.json({ error: "NOT FOUND" }, 404);
    }
    return c.json(results);
  } catch (e) {
    if (e?.code == "PGRST116") {
      return c.json({ error: "NOT FOUND" }, 404);
    }
    console.error(e);
    return c.json({ error: e }, 500);
  }
});

api.post("/metadatas", async (c) => {
  try {
    const metadata: IMetadata = await c.req.json();
    let result = await createMetadata(c, metadata);
    return c.json(result);
  } catch (e) {
    console.error(e);
    return c.json({ error: e }, 500);
  }
});

api.put("/metadatas/:id", async (c) => {
  try {
    const id = c.req.param("id") ? Number(c.req.param("id")) : null;
    const metadata: IMetadata = await c.req.json();
    let result = await updateMetadata(c, id, metadata);
    return c.json(result);
  } catch (e) {
    if (e?.code == "PGRST116") {
      return c.json({ error: "NOT FOUND" }, 404);
    }
    console.error(e);
    return c.json({ error: e }, 500);
  }
});

api.delete("/metadatas/:id", async (c) => {
  try {
    const id = c.req.param("id") ? Number(c.req.param("id")) : null;
    await findMetadataById(c, id);
    await deleteMetadata(c, id);
    return c.json({
      code: true,
      message: `Resource with ID: ${id} deleted`,
    });
  } catch (e: any) {
    if (e?.code == "PGRST116") {
      return c.json({ error: "NOT FOUND" }, 404);
    }
    console.error(e);
    return c.json({ error: e }, 500);
  }
});

export { api };
