import { Context, Hono } from "hono";
// import * as model from "./model";
import { Bindings } from "./bindings";
import { cors } from "hono/cors";

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
    let results = await c.env.DB.prepare("SELECT * FROM versions").first();
    return c.json(results);
  } catch (e) {
    return c.json({ err: e }, 500);
  }
});

// Events

// Categories

api.get("/categories", async (c) => {
  try {
    let { results } = await c.env.DB.prepare(
      "SELECT * FROM categories ORDER BY id DESC"
    ).all();
    return c.json(results);
  } catch (e) {
    console.error(e);
    return c.json({ err: e }, 500);
  }
});

api.get("/categories/:id", async (c) => {
  try {
    const id = c.req.param("id");
    let { results } = await c.env.DB.prepare(
      "SELECT * FROM categories WHERE id = ?"
    )
      .bind(id)
      .all();
    if (results.length == 0) {
      return c.json({ err: "NOT FOUND" }, 404);
    }
    return c.json(results[0]);
  } catch (e) {
    console.error(e);
    return c.json({ err: e }, 500);
  }
});

api.post("/categories", async (c) => {
  try {
    const { name }: any = await c.req.json();
    let { results } = await c.env.DB.prepare(
      "INSERT INTO categories (name) VALUES (?) RETURNING id"
    )
      .bind(name)
      .all();
    let result = await c.env.DB.prepare(
      "SELECT * FROM categories WHERE id = ? ORDER BY id DESC"
    )
      .bind(results[0].id)
      .first();
    return c.json(result);
  } catch (e) {
    console.error(e);
    return c.json({ err: e }, 500);
  }
});

api.put("/categories/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { name }: any = await c.req.json();
    if (id != null) {
      let { results } = await c.env.DB.prepare(
        "SELECT id FROM categories WHERE id = ? ORDER BY id DESC"
      )
        .bind(id)
        .all();
      if (results.length == 0) {
        return c.json({ err: "NOT FOUND" }, 404);
      }
    }

    let { results } = await c.env.DB.prepare(
      "UPDATE categories SET name = ? WHERE id = ? RETURNING *"
    )
      .bind(name, id)
      .all();
    return c.json(results[0]);
  } catch (e) {
    console.error(e);
    return c.json({ err: e }, 500);
  }
});

api.delete("/categories/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (id != null) {
      let { results } = await c.env.DB.prepare(
        "SELECT id FROM categories WHERE id = ? ORDER BY id DESC"
      )
        .bind(id)
        .all();
      if (results.length == 0) {
        return c.json({ err: "NOT FOUND" }, 404);
      }
    }
    let { results } = await c.env.DB.prepare(
      "DELETE FROM categories WHERE id = ? RETURNING 1"
    )
      .bind(id)
      .all();
    const success = results ? true : false;
    return c.json({ code: success });
  } catch (e) {
    console.error(e);
    return c.json({ err: e }, 500);
  }
});

// events

async function getTotalEvents(
  c: Context,
  idCategory: number,
  filterGeneralCountry: string
): Promise<number> {
  try {
    let count = await c.env.DB.prepare(
      `SELECT count(id) as count FROM events where id_category = ${idCategory} and status = 1 ${filterGeneralCountry}`
    ).first("count");
    return parseInt(count);
  } catch (e) {
    console.error(e)
    return 0;
  }
}

api.get("/events", async (c) => {
  try {
    const page = c.req.query("page") ? parseInt(c.req.query("page")) : 1;
    const idCategory = c.req.query("category")
      ? parseInt(c.req.query("category"))
      : null;
    const country = c.req.query("country") ? c.req.query("country") : null;
    if (!idCategory || !country) {
      return c.json(
        { code: 400, message: "Query params: category, country is mandatory!" },
        400
      );
    }

    const offset = ROWS_BY_PAGE * (page - 1);

    const filterGeneralCountry =
      `and (country like '%${country}%' or country like '%general%')`;
    const total: number = await getTotalEvents(
      c,
      idCategory,
      filterGeneralCountry
    );
    const totalPages = total ? Math.round(total / ROWS_BY_PAGE) : 0;
    const query = `
    SELECT id, description, title, subtitle, id_category, poster_path, backdrop_path, url, "key", key2, id_type, country
     FROM events where id_category = ? and status = 1 and (country like ? or country like '%general%') ORDER BY id DESC LIMIT ${ROWS_BY_PAGE} OFFSET ${offset}`;

    let { results } = await c.env.DB.prepare(query)
      .bind(idCategory, `%${country}%`)
      .all();
    return c.json(formatResponse(results, page, totalPages, total));
  } catch (e) {
    console.error(e);
    return c.json({ err: e }, 500);
  }
});

api.get("/events/:id", async (c) => {
  try {
    const id = c.req.param("id");
    let { results } = await c.env.DB.prepare(
      "SELECT * FROM events WHERE id = ?"
    )
      .bind(id)
      .all();
    if (results.length == 0) {
      return c.json({ err: "NOT FOUND" }, 404);
    }
    return c.json(results[0]);
  } catch (e) {
    console.error(e);
    return c.json({ err: e }, 500);
  }
});
// api.get("/events/:id", async (c) => {
//   try {
//     const id = c.req.param("id");
//     let { results } = await c.env.DB.prepare(
//       "SELECT * FROM categories WHERE id = ? ORDER BY id DESC"
//     )
//       .bind(id)
//       .all();
//     if (results.length == 0) {
//       return c.json({ err: "NOT FOUND" }, 404);
//     }
//     return c.json(results[0]);
//   } catch (e) {
//     console.error(e);
//     return c.json({ err: e }, 500);
//   }
// });

// api.post("/events", async (c) => {
//   try {
//     const { name }: any = await c.req.json();
//     let { results } = await c.env.DB.prepare(
//       "INSERT INTO categories (name) VALUES (?) RETURNING id"
//     )
//       .bind(name)
//       .all();
//     let result = await c.env.DB.prepare(
//       "SELECT * FROM categories WHERE id = ? ORDER BY id DESC"
//     )
//       .bind(results[0].id)
//       .first();
//     return c.json(result);
//   } catch (e) {
//     console.error(e);
//     return c.json({ err: e }, 500);
//   }
// });

// api.put("/events/:id", async (c) => {
//   try {
//     const id = c.req.param("id");
//     const { name }: any = await c.req.json();
//     if (id != null) {
//       let { results } = await c.env.DB.prepare(
//         "SELECT id FROM categories WHERE id = ? ORDER BY id DESC"
//       )
//         .bind(id)
//         .all();
//       if (results.length == 0) {
//         return c.json({ err: "NOT FOUND" }, 404);
//       }
//     }

//     let { results } = await c.env.DB.prepare(
//       "UPDATE categories SET name = ? WHERE id = ? RETURNING *"
//     )
//       .bind(name, id)
//       .all();
//     return c.json(results[0]);
//   } catch (e) {
//     console.error(e);
//     return c.json({ err: e }, 500);
//   }
// });

// api.delete("/events/:id", async (c) => {
//   try {
//     const id = c.req.param("id");
//     if (id != null) {
//       let { results } = await c.env.DB.prepare(
//         "SELECT id FROM categories WHERE id = ? ORDER BY id DESC"
//       )
//         .bind(id)
//         .all();
//       if (results.length == 0) {
//         return c.json({ err: "NOT FOUND" }, 404);
//       }
//     }
//     let { results } = await c.env.DB.prepare(
//       "DELETE FROM categories WHERE id = ? RETURNING 1"
//     )
//       .bind(id)
//       .all();
//     const success = results ? true : false;
//     return c.json({ code: success });
//   } catch (e) {
//     console.error(e);
//     return c.json({ err: e }, 500);
//   }
// });

// api.get("/posts", async (c) => {
//   const posts = await model.getPosts(c.env.BLOG_EXAMPLE);
//   return c.json({ posts: posts, ok: true });
// });

// api.post("/posts", async (c) => {
//   const param = await c.req.json();
//   const newPost = await model.createPost(
//     c.env.BLOG_EXAMPLE,
//     param as model.Param
//   );
//   if (!newPost) {
//     return c.json({ error: "Can not create new post", ok: false }, 422);
//   }
//   return c.json({ post: newPost, ok: true }, 201);
// });

// api.get("/posts/:id", async (c) => {
//   const id = c.req.param("id");
//   const post = await model.getPost(c.env.BLOG_EXAMPLE, id);
//   if (!post) {
//     return c.json({ error: "Not Found", ok: false }, 404);
//   }
//   return c.json({ post: post, ok: true });
// });

// api.put("/posts/:id", async (c) => {
//   const id = c.req.param("id");
//   const post = await model.getPost(c.env.BLOG_EXAMPLE, id);
//   if (!post) {
//     // 204 No Content
//     return new Response(null, { status: 204 });
//   }
//   const param = await c.req.json();
//   const success = await model.updatePost(
//     c.env.BLOG_EXAMPLE,
//     id,
//     param as model.Param
//   );
//   return c.json({ ok: success });
// });

// api.delete("/posts/:id", async (c) => {
//   const id = c.req.param("id");
//   const post = await model.getPost(c.env.BLOG_EXAMPLE, id);
//   if (!post) {
//     // 204 No Content
//     return new Response(null, { status: 204 });
//   }
//   const success = await model.deletePost(c.env.BLOG_EXAMPLE, id);
//   return c.json({ ok: success });
// });

api.get("/event/:id", async (c) => {
  const userId = c.req.param("id");
  try {
    let { results } = await c.env.DB.prepare(
      "SELECT * FROM users WHERE user_id = ?"
    )
      .bind(userId)
      .all();
    return c.json(results);
  } catch (e) {
    return c.json({ err: e }, 500);
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
export { api };
