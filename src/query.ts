import { Context } from "hono";
import { createClient } from "@supabase/supabase-js";
import { ICategory } from "./ICategory";
import { IStream } from "./IStream";
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
  const { data, error } = await supabase
    .from('categories_final_view')
    .select('*')
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
    .from("streams")
    .select(
      "id, url, key, key2, country, id_type, id_metadata, status, metadata!inner(description, title, subtitle, id_category, poster_path, backdrop_path)"
    )
    .eq("status", 1);
  if (error) throw error;
  let results = [];
  data.map((event) => {
    const metadata = event?.metadata;
    delete event.metadata;
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
    .from("streams")
    .select(
      "id, url, key, key2, country, id_type, id_metadata, status, metadata!inner(description, title, subtitle, id_category, poster_path, backdrop_path)"
    )
    .eq("metadata.id_category", idCategory)
    .eq("status", 1)
    .or(`country.like.%${country}%,country.like.%general%`)
    .range(start, offset)
    .limit(ROWS_BY_PAGE);
  if (error) throw error;
  let results = [];
  data.map((event) => {
    const metadata = event?.metadata;
    delete event.metadata;
    results.push({ ...event, ...metadata });
  });
  return results;
}

export async function findLiveById(c: Context, id: Number) {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY);
  const { data, error } = await supabase
    .from("streams")
    .select(
      "id, url, key, key2, country, id_type, id_metadata, status, metadata!inner(description, title, subtitle, id_category, poster_path, backdrop_path)"
    )
    .eq("id", id)
    .single();
  if (error) throw error;
  let results = [];
  const metadata = data?.metadata;
  delete data.metadata;
  results = { ...data, ...metadata };
  return results;
}

export async function createLive(c: Context, event: IStream) {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY);
  const { error, data } = await supabase
    .from("streams")
    .insert({
      id_type: event.id_type,
      id_metadata: event.id_metadata,
      key: event.key,
      key2: event.key2,
      url: event.url,
      country: event.country,
      status: event.status,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateLive(c: Context, id: Number, event: IStream) {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY);
  const { error, data } = await supabase
    .from("streams")
    .update({
      id_type: event.id_type,
      id_metadata: event.id_metadata,
      key: event.key,
      key2: event.key2,
      url: event.url,
      country: event.country,
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
  const { error, data } = await supabase.from("streams").delete().eq("id", id);

  if (error) throw error;
  return data;
}

export async function findEventsByFilters(c: Context, country: string) {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY);
  const { data, error } = await supabase
    .from("streams")
    .select(
      "id, url, key, key2, country, id_type, id_metadata, status, metadata!inner(description, title, subtitle, id_category, poster_path, backdrop_path)"
    )
    .or(`country.like.%${country}%,country.like.%general%`);
  if (error) throw error;
  let results = [];
  data.map((event) => {
    const metadata = event?.metadata;
    delete event.metadata;
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
      .from("streams")
      .select("*,metadata!inner(*)", { count: "exact", head: true })
      .eq("metadata.id_category", idCategory)
      .eq("status", 1)
      .or(`country.like.%${country}%,country.like.%general%`);
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
  const { data, error } = await supabase.from("metadata").select("*");
  if (error) throw error;
  return data;
}

export async function findMetadataById(c: Context, id: Number) {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY);
  const { data, error } = await supabase
    .from("metadata")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createMetadata(c: Context, metadata: IMetadata) {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY);
  const { error, data } = await supabase
    .from("metadata")
    .insert({
      title: metadata.title,
      description: metadata.description,
      subtitle: metadata.subtitle,
      poster_path: metadata.poster_path,
      backdrop_path: metadata.backdrop_path,
      status: metadata.status,
      id_category: metadata.id_category,
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
    .from("metadata")
    .update({
      description: metadata.description,
      title: metadata.title,
      subtitle: metadata.subtitle,
      poster_path: metadata.poster_path,
      backdrop_path: metadata.backdrop_path,
      id_category: metadata.id_category,
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
  const { error, data } = await supabase.from("metadata").delete().eq("id", id);

  if (error) throw error;
  return data;
}
