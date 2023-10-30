import { Context } from "hono";
import { createClient } from "@supabase/supabase-js";
import { ICategory } from "./ICategory";
import { IEvent } from "./IEvents";
import { count } from "console";
import { IMetadata } from "./IMetadata";
// require("dotenv").config();

// const supabase = createClient(
//   process.env.SUPABASE_URL,
//   process.env.SUPABASE_KEY
// );

const ROWS_BY_PAGE = 10;

// Categories
export async function findAllCategories(c: Context) {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY);
  const { data, error } = await supabase.from("categories").select("*");
  if (error) throw error;
  return data;
}

export async function findCategoryById(c: Context, id: Number) {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY);
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createCategory(c: Context, category: ICategory) {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY);
  const { error, data } = await supabase
    .from("categories")
    .insert({
      name: category.name,
      description: category.description,
      url: category.url,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCategory(
  c: Context,
  id: Number,
  category: ICategory
) {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY);
  const { error, data } = await supabase
    .from("categories")
    .update({
      name: category.name,
      description: category.description,
      url: category.url,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCategory(c: Context, id: Number) {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY);
  const { error, data } = await supabase
    .from("categories")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return data;
}

// Versions
export async function getVersion(c: Context) {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY);
  const { data, error } = await supabase.from("versions").select("*");

  if (error) throw error;
  return data?.[0];
}

export async function editVersion(c: Context, version: string) {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY);
  const { error, data } = await supabase
    .from("versions")
    .update({ version })
    .eq("id", 1)
    .select();

  if (error) throw error;
  return data?.[0];
}

// Lives

export async function findAllLives(c: Context) {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY);
  const { data, error } = await supabase
    .from("events_new")
    .select(
      "id, description, title, subtitle, id_category, poster_path, backdrop_path, id_type, metadatas!inner(url, key, key2, country)"
    );
  if (error) throw error;
  let results = [];
  data.map((event) => {
    const metadata = event?.metadatas;
    delete event.metadatas;
    results.push({ ...event, ...metadata });
  });
  return results;
}

export async function findLivesByPage(
  c: Context,
  idCategory: number,
  country: string,
  start: number,
  offset: number
) {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY);
  const { data, error } = await supabase
    .from("events_new")
    .select(
      "id, description, title, subtitle, id_category, poster_path, backdrop_path, id_type, metadatas!inner(url, key, key2, country)"
    )
    .eq("id_category", idCategory)
    .eq("status", 1)
    .or(`country.like.%${country}%,country.like.%general%`, {foreignTable: 'metadatas'})
    .range(start, offset)
    .limit(ROWS_BY_PAGE);
  if (error) throw error;
  let results = [];
  data.map((event) => {
    const metadata = event?.metadatas;
    delete event.metadatas;
    results.push({ ...event, ...metadata });
  });
  return results;
}

export async function findLiveById(c: Context, id: Number) {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY);
  const { data, error } = await supabase
    .from("events_new")
    .select(
      "id, description, title, subtitle, id_category, poster_path, backdrop_path, id_type, metadatas!inner(url, key, key2, country)"
    )
    .eq("id", id)
    .single();
  if (error) throw error;
  let results = [];
  const metadata = data?.metadatas;
  delete data.metadatas;
  results = { ...data, ...metadata };
  return results;
}

export async function createLive(c: Context, event: IEvent) {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY);
  const { error, data } = await supabase
    .from("events_new")
    .insert({
      description: event.description,
      title: event.title,
      subtitle: event.subtitle,
      id_category: event.id_category,
      id_metadata: event.id_metadata,
      poster_path: event.poster_path,
      backdrop_path: event.backdrop_path,
      id_type: event.id_type,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateLive(c: Context, id: Number, event: IEvent) {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY);
  const { error, data } = await supabase
    .from("events_new")
    .update({
      description: event.description,
      title: event.title,
      subtitle: event.subtitle,
      id_category: event.id_category,
      id_metadata: event.id_metadata,
      id_type: event.id_type,
      poster_path: event.poster_path,
      backdrop_path: event.backdrop_path,
      status: event.status,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteLive(c: Context, id: Number) {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY);
  const { error, data } = await supabase
    .from("events_new")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return data;
}

export async function findEventsByFilters(
  c: Context,
  idCategory: number,
  country: string
) {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY);
  const { data, error } = await supabase
    .from("events_new")
    .select(
      "id, description, title, subtitle, id_category, poster_path, backdrop_path, id_type, metadatas!inner(url, key, key2, country)"
    )
    .eq("status", 1)
    .eq("id_category", idCategory)
    .or(`country.like.%${country}%,country.like.%general%`, {foreignTable: 'metadatas'})
  if (error) throw error;
  let results = [];
  data.map((event) => {
    const metadata = event?.metadatas;
    delete event.metadatas;
    results.push({ ...event, ...metadata });
  });
  return results;
}

export async function getTotalEvents(
  c: Context,
  idCategory: number,
  country: string
): Promise<any> {
  try {
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY);
    const { count, error } = await supabase
      .from("events_new")
      .select("*", { count: "exact", head: true })
      .eq("id_category", idCategory)
      .eq("status", 1)
      .or(`country.like.%${country}%,country.like.%general%`, {foreignTable: 'metadatas'})
    if (error) throw error;
    return count;
  } catch (e) {
    console.error(e);
    return 0;
  }
}

// Metadata
export async function findAllMetadata(c: Context) {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY);
  const { data, error } = await supabase.from("metadatas").select("*");
  if (error) throw error;
  return data;
}

export async function findMetadataById(c: Context, id: Number) {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY);
  const { data, error } = await supabase
    .from("metadatas")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createMetadata(c: Context, metadata: IMetadata) {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY);
  const { error, data } = await supabase
    .from("metadatas")
    .insert({
      key: metadata.key,
      key2: metadata.key2,
      url: metadata.url,
      country: metadata.country,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateMetadata(
  c: Context,
  id: Number,
  metadata: IMetadata
) {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY);
  const { error, data } = await supabase
    .from("metadatas")
    .update({
      key: metadata.key,
      key2: metadata.key2,
      url: metadata.url,
      country: metadata.country,
      status: metadata.status,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMetadata(c: Context, id: Number) {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY);
  const { error, data } = await supabase
    .from("metadatas")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return data;
}
