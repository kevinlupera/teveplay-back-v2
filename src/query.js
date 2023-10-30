import { Pool } from "pg";
import { encryptData } from "./encryption.js";
// import { createClient } from "@supabase/supabase-js";
require("dotenv").config();

const pool = new Pool({
  user: process.env.USERDB,
  host: process.env.HOST,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: 5432,
  ssl: {},
});

const ROWS_BY_PAGE = 10;

/* Category*/
const getCategories = async (request, response) => {
  try {
    pool.query(
      "SELECT * FROM categories ORDER BY id DESC",
      (error, resutls) => {
        if (error) {
          throw error;
        }
        response.status(200).json(formatResponse(resutls.rows)).end();
      }
    );
  } catch (error) {
    console.log("🚀 ~ file: queries.js:67 ~ getCategories ~ error:", error);
    response.status(500).end();
  }
};

const createCategory = async (request, response) => {
  try {
    const { name } = request.body;
    pool.query(
      "INSERT INTO categories (name) VALUES ($1) RETURNING *",
      [name],
      (error, results) => {
        if (error) {
          throw error;
        }
        response.status(201).send(`User added with ID: ${results.rows[0].id}`);
      }
    );
  } catch (error) {
    console.log("🚀 ~ file: queries.js:67 ~ getCategories ~ error:", error);
    response.status(500).end();
  }
};

const updateCategory = async (request, response) => {
  try {
    const id = parseInt(request.params.id);
    const { name } = request.body;
    pool.query(
      "UPDATE categories SET name = $1 WHERE id = $2",
      [name, id],
      (error, results) => {
        if (error) {
          throw error;
        }
        response
          .status(201)
          .send(`Category added with ID: ${results.rows[0].id}`);
      }
    );
  } catch (error) {
    console.log("🚀 ~ file: queries.js:67 ~ getCategories ~ error:", error);
    response.status(500).end();
  }
};

const deleteCategory = async (request, response) => {
  const id = parseInt(request.params.id);

  pool.query("DELETE FROM categories WHERE id = $1", [id], (error, results) => {
    if (error) {
      throw error;
    }
    response.status(200).send(`Category deleted with ID: ${id}`);
  });
};

/* Events */
async function getTotalEvents(idCategory, filterGeneralCountry) {
  let count = 0;
  let response;
  try {
    response = await pool.query(
      `SELECT count(id) FROM events where id_category = ${idCategory} and status = 1 ${filterGeneralCountry}`
    );
  } catch (error) {
    throw error;
  }
  return response ? response.rows[0].count : count;
}

const getEvents = async (request, response) => {
  try {
    const page = parseInt(request.params.page);
    const idCategory = parseInt(request.params.idCategory);
    const country = request.query.country;
    const offset = ROWS_BY_PAGE * (page - 1);

    let filterByCountry = country ? "'" + country + "'= ANY(country) or" : "";
    const filterGeneralCountry =
      ` and (${filterByCountry} ` + " 'general' = ANY(country))";
    const total = parseInt(
      await getTotalEvents(idCategory, filterGeneralCountry)
    );
    const totalPages = total ? parseInt(total / ROWS_BY_PAGE) + 1 : 0;
    const query = `
    SELECT id, description, title, subtitle, id_category, poster_path, backdrop_path, url, "key", key2, id_type
     FROM events where id_category = ${idCategory} and status = 1 ${filterGeneralCountry} ORDER BY id DESC LIMIT ${ROWS_BY_PAGE} OFFSET ${offset}`;

    pool.query(query, (error, resutls) => {
      if (error) {
        throw error;
      }
      response
        .status(200)
        .json(formatResponse(resutls.rows, page, totalPages, total))
        .end();
    });
  } catch (error) {
    console.log("🚀 ~ file: queries.js:47 ~ getEvents ~ error:", error);
    response.status(400).end();
  }
};

const getEvent = async (request, response) => {
  try {
    const id = parseInt(request.params.id);
    const query = `SELECT * FROM events where id = $1 and status = 1 LIMIT 1`;
    const values = [id];
    pool.query(query, values, (error, resutls) => {
      if (error) {
        throw error;
      }
      response.status(200).json(resutls.rows?.[0]).end();
    });
  } catch (error) {
    console.log("🚀 ~ file: queries.js:47 ~ getEvents ~ error:", error);
    response.status(400).end();
  }
};

const updateEvent = async (request, response) => {
  const id = parseInt(request.params.id);
  const {
    id_category,
    title,
    subtitle,
    poster_path,
    backdrop_path,
    url,
    key,
    key2,
    description,
    id_type,
    country,
  } = request.body;

  pool.query(
    'UPDATE events SET id_category = $1, title = $2, subtitle = $3, poster_path = $4, backdrop_path = $5, url = $6, "key" = $7, key2 = $8, description = $9, id_type = $10, country = $11 WHERE id = $12',
    [
      id_category,
      title,
      subtitle,
      poster_path,
      backdrop_path,
      url,
      key,
      key2,
      description,
      id_type,
      country,
      id,
    ],
    (error, results) => {
      if (error) {
        throw error;
      }
      response.status(200).send(`Event modified with ID: ${id}`);
    }
  );
};

const createEvent = async (request, response) => {
  const {
    id_category,
    title,
    subtitle,
    poster_path,
    backdrop_path,
    url,
    key,
    key2,
    description,
    id_type,
    country,
  } = request.body;

  const encryptedKey = encryptData(key);
  const encryptedKey2 = encryptData(key2);

  pool.query(
    'INSERT INTO events (id_category, title, subtitle, poster_path, backdrop_path, url, "key", key2, description, id_type, country) VALUES ($1, $2, $3, $4, $5, $6,$7, $8, $9, $10, $11) RETURNING *',
    [
      id_category,
      title,
      subtitle,
      poster_path,
      backdrop_path,
      url,
      encryptedKey,
      encryptedKey2,
      description,
      id_type,
      country,
    ],
    (error, results) => {
      if (error) {
        throw error;
      }
      response.status(201).send(`Event added with ID: ${results.rows[0].id}`);
    }
  );
};

function quoteField(params) {
  return `'${params}'`;
}

const deleteEvent = async (request, response) => {
  const id = parseInt(request.params.id);

  pool.query("DELETE FROM events WHERE id = $1", [id], (error, results) => {
    if (error) {
      throw error;
    }
    response.status(200).send(`Event deleted with ID: ${id}`);
  });
};

const formatResponse = (rows, page, totalPages, total) => {
  return {
    page,
    results: rows,
    total_pages: totalPages,
    total_results: total,
  };
};

const getVersion = async (request, response) => {
  try {
    pool.query(`SELECT * FROM versions LIMIT 1`, (error, resutls) => {
      if (error) {
        throw error;
      }
      response.status(200).json(resutls.rows?.[0]).end();
    });
  } catch (error) {
    console.log("🚀 ~ file: queries.js:268 ~ getVersion ~ error:", error);
    response.status(400).end();
  }
};


export default {
  // Categories
  getCategories,
  createCategory,
  deleteCategory,
  updateCategory,
  // Events
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  // Version
  getVersion,
};
