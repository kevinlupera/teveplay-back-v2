```
npm install
npm run dev
```

```
npm run deploy
```


# Pending

- Crear tabla metadata
- Agregar CRUD metadata
- Cambiar lógica de API lives y eventos
- Actualizar tabla events
- Ectualizar metadata de eventos



import { Context, Hono } from "hono";
import { cors } from "hono/cors";
import { Bindings } from "./bindings";
import { getDataDummy } from "./query";
// import encryption from './encryption.js';
import * as crypto from "crypto";

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
    console.error(e);
    return c.json({ error: e }, 500);
  }
});

api.put("/version", async (c) => {
  try {
    const { version }: any = await c.req.json();
    let { results } = await c.env.DB.prepare(
      "UPDATE versions SET version = ? RETURNING *"
    )
      .bind(version)
      .all();
    return c.json(results[0]);
  } catch (e) {
    console.error(e);
    return c.json({ error: e }, 500);
  }
});

// Categories

api.get("/categories", async (c) => {
  try {
    let { results } = await c.env.DB.prepare(
      "SELECT c.* FROM categories c, events e where e.status = 1 AND e.id_category = c.id GROUP BY c.id ORDER BY id DESC"
    ).all();
    return c.json(results);
  } catch (e) {
    console.error(e);
    return c.json({ error: e }, 500);
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
      return c.json({ error: "NOT FOUND" }, 404);
    }
    return c.json(results[0]);
  } catch (e) {
    console.error(e);
    return c.json({ error: e }, 500);
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
    return c.json({ error: e }, 500);
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
        return c.json({ error: "NOT FOUND" }, 404);
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
    return c.json({ error: e }, 500);
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
        return c.json({ error: "NOT FOUND" }, 404);
      }
    }
    let { results } = await c.env.DB.prepare(
      "DELETE FROM categories WHERE id = ? RETURNING 1"
    )
      .bind(id)
      .all();
    const success = results ? true : false;
    return c.json({
      code: success,
      message: `Resource with ID: ${id} deleted`,
    });
  } catch (e) {
    console.error(e);
    return c.json({ error: e }, 500);
  }
});

// Events

api.get("/lives", async (c) => {
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

    const filterGeneralCountry = `and (country like '%${country}%' or country like '%general%')`;
    const total: number = await getTotalEvents(
      c,
      idCategory,
      filterGeneralCountry
    );
    const totalPages = total ? Math.round(total / ROWS_BY_PAGE) : 0;
    const query = `
    SELECT id, description, title, subtitle, id_category, poster_path, backdrop_path, url, "key", key2, id_type
     FROM events where id_category = ? and status = 1 and (country like ? or country like '%general%') ORDER BY id DESC LIMIT ${ROWS_BY_PAGE} OFFSET ${offset}`;

    let { results } = await c.env.DB.prepare(query)
      .bind(idCategory, `%${country}%`)
      .all();
    return c.json(formatResponse(results, page, totalPages, total));
  } catch (e) {
    console.error(e);
    return c.json({ error: e }, 500);
  }
});

api.get("/lives/:id", async (c) => {
  try {
    const id = c.req.param("id");
    let { results } = await c.env.DB.prepare(
      "SELECT * FROM events WHERE id = ?"
    )
      .bind(id)
      .all();
    if (results.length == 0) {
      return c.json({ error: "NOT FOUND" }, 404);
    }
    return c.json(results[0]);
  } catch (e) {
    console.error(e);
    return c.json({ error: e }, 500);
  }
});

api.post("/lives", async (c) => {
  try {
    const {
      description,
      title,
      subtitle,
      id_category,
      poster_path,
      backdrop_path,
      url,
      key,
      key2,
      id_type,
      country,
      status,
    }: any = await c.req.json();
    let { results } = await c.env.DB.prepare(
      "INSERT INTO events (description,title,subtitle,id_category,poster_path,backdrop_path,url,key,key2,id_type,country,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?) RETURNING id"
    )
      .bind(
        description,
        title,
        subtitle,
        id_category,
        poster_path,
        backdrop_path,
        url,
        key,
        key2,
        id_type,
        country,
        status
      )
      .all();
    let result = await c.env.DB.prepare(
      "SELECT * FROM events WHERE id = ? ORDER BY id DESC"
    )
      .bind(results[0].id)
      .first();
    return c.json(result);
  } catch (e) {
    console.error(e);
    return c.json({ error: e }, 500);
  }
});

api.put("/lives/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const {
      description,
      title,
      subtitle,
      id_category,
      poster_path,
      backdrop_path,
      url,
      key,
      key2,
      id_type,
      country,
      status,
    }: any = await c.req.json();
    if (id != null) {
      let { results } = await c.env.DB.prepare(
        "SELECT id FROM events WHERE id = ? ORDER BY id DESC"
      )
        .bind(id)
        .all();
      if (results.length == 0) {
        return c.json({ error: "NOT FOUND" }, 404);
      }
    }

    let { results } = await c.env.DB.prepare(
      "UPDATE events SET description = ?, title = ?, subtitle = ?, id_category = ?, poster_path = ?, backdrop_path = ?, url = ?, key = ?, key2 = ?, id_type = ?, country = ?, status = ? WHERE id = ? RETURNING *"
    )
      .bind(
        description,
        title,
        subtitle,
        id_category,
        poster_path,
        backdrop_path,
        url,
        key,
        key2,
        id_type,
        country,
        status,
        id
      )
      .all();
    return c.json(results[0]);
  } catch (e) {
    console.error(e);
    return c.json({ error: e }, 500);
  }
});

api.delete("/lives/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (id != null) {
      let { results } = await c.env.DB.prepare(
        "SELECT id FROM events WHERE id = ?"
      )
        .bind(id)
        .all();
      if (results.length == 0) {
        return c.json({ error: "NOT FOUND" }, 404);
      }
    }
    let { results } = await c.env.DB.prepare(
      "DELETE FROM events WHERE id = ? RETURNING 1"
    )
      .bind(id)
      .all();
    const success = results ? true : false;
    return c.json({
      code: success,
      message: `Resource with ID: ${id} deleted`,
    });
  } catch (e) {
    console.error(e);
    return c.json({ error: e }, 500);
  }
});

api.get("/events", async (c) => {
  try {
    const idCategory = 1; // Eventos
    const country = c.req.query("country") ? c.req.query("country") : null;
    if (!country) {
      return c.json(
        { code: 400, message: "Query params: country is mandatory!" },
        400
      );
    }
    const query = `
    SELECT id, description, title, subtitle, id_category, poster_path, backdrop_path, url, "key", key2, id_type
     FROM events where id_category = ? and status = 1 and (country like ? or country like '%general%') ORDER BY id DESC`;

    let { results } = await c.env.DB.prepare(query)
      .bind(idCategory, `%${country}%`)
      .all();
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
    console.error(e);
    return 0;
  }
}

// Metadata


api.get("/metadatas", async (c) => {
  try {
    let { results } = await c.env.DB.prepare(
      "SELECT c.* FROM metadatas c ORDER BY id DESC"
    ).all();
    return c.json(results);
  } catch (e) {
    console.error(e);
    return c.json({ error: e }, 500);
  }
});

api.get("/metadatas/:id", async (c) => {
  try {
    const id = c.req.param("id");
    let { results } = await c.env.DB.prepare(
      "SELECT * FROM metadatas WHERE id = ?"
    )
      .bind(id)
      .all();
    if (results.length == 0) {
      return c.json({ error: "NOT FOUND" }, 404);
    }
    return c.json(results[0]);
  } catch (e) {
    console.error(e);
    return c.json({ error: e }, 500);
  }
});

api.post("/metadatas", async (c) => {
  try {
    const { url, key, key2, country, status }: any = await c.req.json();
    let { results } = await c.env.DB.prepare(
      "INSERT INTO metadatas (url, key, key2, country, status) VALUES (?, ?, ?, ?, ?) RETURNING id"
    )
      .bind(url, key, key2, country, status)
      .all();
    let result = await c.env.DB.prepare(
      "SELECT * FROM metadatas WHERE id = ? ORDER BY id DESC"
    )
      .bind(results[0].id)
      .first();
    return c.json(result);
  } catch (e) {
    console.error(e);
    return c.json({ error: e }, 500);
  }
});

api.put("/metadatas/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { url, key, key2, country, status }: any = await c.req.json();
    if (id != null) {
      let { results } = await c.env.DB.prepare(
        "SELECT id FROM metadatas WHERE id = ? ORDER BY id DESC"
      )
        .bind(id)
        .all();
      if (results.length == 0) {
        return c.json({ error: "NOT FOUND" }, 404);
      }
    }

    let { results } = await c.env.DB.prepare(
      "UPDATE metadatas SET url = ?, key = ?, key2 = ?, country = ?, status = ? WHERE id = ? RETURNING *"
    )
      .bind(url, key, key2, country, status, id)
      .all();
    return c.json(results[0]);
  } catch (e) {
    console.error(e);
    return c.json({ error: e }, 500);
  }
});

api.delete("/metadatas/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (id != null) {
      let { results } = await c.env.DB.prepare(
        "SELECT id FROM metadatas WHERE id = ? ORDER BY id DESC"
      )
        .bind(id)
        .all();
      if (results.length == 0) {
        return c.json({ error: "NOT FOUND" }, 404);
      }
    }
    let { results } = await c.env.DB.prepare(
      "DELETE FROM metadatas WHERE id = ? RETURNING 1"
    )
      .bind(id)
      .all();
    const success = results ? true : false;
    return c.json({
      code: success,
      message: `Resource with ID: ${id} deleted`,
    });
  } catch (e) {
    console.error(e);
    return c.json({ error: e }, 500);
  }
});


api.get("/encrypt", (c) => {
  try {
    const data = encrypt('hola', c.env.SECRET_KEY, c.env.SECRET_IV)
    
    return c.json({ data }); 
  } catch (err) {
    console.log("🚀 ~ file: api.ts:381 ~ api.get ~ error:", err)
    return c.json({ error: err }, 500);
  }
});

function encrypt(text: string, key: any, iv: string) {
  try {
  const algorithm = "aes-256-cbc";
  // Deriva la clave y el IV desde las cadenas UTF-8
  const derivedKey = Buffer.from(key, "utf8");
  console.log("🚀 ~ file: encryption.js:7 ~ encrypt ~ derivedKey:", derivedKey)
  const derivedIv = Buffer.from(iv, "utf8");
  console.log("🚀 ~ file: encryption.js:9 ~ encrypt ~ derivedIv:", derivedIv)
  let encrypted = "";

  let key2 = crypto.scryptSync(text, key, 32);
  console.log("🚀 ~ file: encryption.js:12 ~ encrypt ~ key2:", key2)

  // // Crea una instancia del cifrador AES-CTR con PKCS7
  // const cipher = crypto.createCipheriv(algorithm, derivedKey, derivedIv);
  // console.log("🚀 ~ file: encryption.js:16 ~ encrypt ~ cipher:", cipher)

  // // Cifra el texto en formato utf-8
  // encrypted = cipher.update(text, "utf8", "base64");
  // console.log("🚀 ~ file: encryption.js:20 ~ encrypt ~ encrypted:", encrypted)
  // cipher.setAutoPadding(true); // Habilita PKCS7
  // let base64Value = cipher.final("base64");
  // console.log("🚀 ~ file: encryption.js:23 ~ encrypt ~ base64Value:", base64Value)
    const base64Value = '-----'
  return base64Value;
} catch (err) {
console.log("🚀 ~ file: api.ts:415 ~ encrypt ~ error:", err)
return 'Error'
}
}

// Version
api.get("/countries", async (c) => {
  try {
    let results = await getDataDummy(c.req, c.res);
    return c.json(results);
  } catch (e) {
    console.error(e);
    return c.json({ error: e }, 500);
  }
});

export { api };
