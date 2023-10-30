import { Context } from "hono";
import { createClient } from "@supabase/supabase-js";
import { ICategory } from "./ICategory";
import { IEvent } from "./IEvents";
import { count } from "console";
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
  const { data, error } = await supabase.from("events").select("");
  if (error) throw error;
  return data;
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
    .from("events")
    .select(
      "id, description, title, subtitle, id_category, poster_path, backdrop_path, url, key, key2, id_type"
    )
    .eq("id_category", idCategory)
    .eq("status", 1)
    .or(`country.like.%${country}%,country.like.%general%`)
    .range(start, offset)
    .limit(ROWS_BY_PAGE);
  if (error) throw error;
  return data;
}

export async function findLiveById(c: Context, id: Number) {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY);
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createLive(c: Context, event: IEvent) {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY);
  const { error, data } = await supabase
    .from("events")
    .insert({
      description: event.description,
      title: event.title,
      subtitle: event.subtitle,
      id_category: event.id_category,
      poster_path: event.poster_path,
      backdrop_path: event.backdrop_path,
      url: event.url,
      key: event.key,
      key2: event.key2,
      id_type: event.id_type,
      country: event.country,
      status: event.status,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateLive(c: Context, id: Number, event: IEvent) {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY);
  const { error, data } = await supabase
    .from("events")
    .update({
      description: event.description,
      title: event.title,
      subtitle: event.subtitle,
      id_category: event.id_category,
      poster_path: event.poster_path,
      backdrop_path: event.backdrop_path,
      url: event.url,
      key: event.key,
      key2: event.key2,
      id_type: event.id_type,
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
  const { error, data } = await supabase.from("events").delete().eq("id", id);

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
    .from("events")
    .select(
      "id, description, title, subtitle, id_category, poster_path, backdrop_path, url, key, key2, id_type"
    )
    .eq("status", 1)
    .eq("id_category", idCategory)
    .or(`country.like.%${country}%,country.like.%general%`);
  if (error) throw error;
  return data;
}

export async function getTotalEvents(
  c: Context,
  idCategory: number,
  country: string
): Promise<any> {
  try {
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY);
    const { count, error } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("id_category", idCategory)
      .eq("status", 1)
      .or(`country.like.%${country}%,country.like.%general%`);
    if (error) throw error;
    return count;
  } catch (e) {
    console.error(e);
    return 0;
  }
}

// SUPABASE

export async function getDataDummy(c: Context) {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY);
  const { data, error } = await supabase.from("countries").select("*");
  if (error) throw error;
  return data;
}
