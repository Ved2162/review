import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Restaurant } from "@/lib/storage";
import type { Tables } from "@/integrations/supabase/types";

type RestaurantRow = Tables<"restaurants"> & {
  business_type?: string;
  custom_business_type?: string | null;
  keywords?: string[];
  avoid_words?: string[];
  brand_tone?: string;
  active?: boolean;
};

const IdInput = z.object({ id: z.string().min(1).max(80) });
const AddInput = z.object({
  name: z.string().trim().min(1).max(120),
  googleReviewUrl: z.string().trim().url().max(2048),
  businessType: z.string().trim().min(1).max(40).default("restaurant"),
  customBusinessType: z.string().trim().max(80).nullable().optional(),
  keywords: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
  avoidWords: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
  brandTone: z.string().trim().min(1).max(30).default("friendly"),
});
const LegacyInput = z.object({
  restaurants: z
    .array(
      z.object({
        id: z.string().min(1).max(80),
        name: z.string().trim().min(1).max(120),
        googleReviewUrl: z.string().trim().url().max(2048),
        createdAt: z.number().optional().default(0),
        scans: z.number().int().min(0).optional().default(0),
        reviewsGenerated: z.number().int().min(0).optional().default(0),
      }),
    )
    .max(100),
});

function toRestaurant(row: RestaurantRow): Restaurant {
  return {
    id: row.id,
    name: row.name,
    googleReviewUrl: row.google_review_url,
    createdAt: new Date(row.created_at).getTime(),
    scans: row.scans,
    reviewsGenerated: row.reviews_generated,
    businessType: row.business_type ?? "restaurant",
    customBusinessType: row.custom_business_type ?? null,
    keywords: row.keywords ?? [],
    avoidWords: row.avoid_words ?? [],
    brandTone: row.brand_tone ?? "friendly",
    active: row.active ?? true,
  };
}

const SetActiveInput = z.object({ id: z.string().min(1).max(80), active: z.boolean() });

export const listRestaurantsFromCloud = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("restaurants")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return { restaurants: (data ?? []).map((r) => toRestaurant(r as RestaurantRow)) };
});

export const getRestaurantFromCloud = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => IdInput.parse(d))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("restaurants")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return { restaurant: row ? toRestaurant(row as RestaurantRow) : null };
  });

export const addRestaurantToCloud = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => AddInput.parse(d))
  .handler(async ({ data }) => {
    const id = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
    const { data: row, error } = await supabaseAdmin
      .from("restaurants")
      .insert({
        id,
        name: data.name,
        google_review_url: data.googleReviewUrl,
        business_type: data.businessType,
        custom_business_type: data.customBusinessType ?? null,
        keywords: data.keywords,
        avoid_words: data.avoidWords,
        brand_tone: data.brandTone,
      } as never)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return { restaurant: toRestaurant(row as RestaurantRow) };
  });

export const deleteRestaurantFromCloud = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => IdInput.parse(d))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("restaurants").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setRestaurantActiveInCloud = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SetActiveInput.parse(d))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("restaurants")
      .update({ active: data.active } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const recordRestaurantScan = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => IdInput.parse(d))
  .handler(async ({ data }) => {
    const { data: row, error: readError } = await supabaseAdmin
      .from("restaurants")
      .select("scans")
      .eq("id", data.id)
      .maybeSingle();
    if (readError || !row) return { ok: false };

    const { error } = await supabaseAdmin
      .from("restaurants")
      .update({ scans: row.scans + 1 })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const recordRestaurantReview = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => IdInput.parse(d))
  .handler(async ({ data }) => {
    const { data: row, error: readError } = await supabaseAdmin
      .from("restaurants")
      .select("reviews_generated")
      .eq("id", data.id)
      .maybeSingle();
    if (readError || !row) return { ok: false };

    const { error } = await supabaseAdmin
      .from("restaurants")
      .update({ reviews_generated: row.reviews_generated + 1 })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const syncLegacyRestaurantsToCloud = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => LegacyInput.parse(d))
  .handler(async ({ data }) => {
    if (data.restaurants.length === 0) return { count: 0 };

    const rows = data.restaurants.map((r) => ({
      id: r.id,
      name: r.name,
      google_review_url: r.googleReviewUrl,
      created_at: new Date(r.createdAt || Date.now()).toISOString(),
      scans: r.scans,
      reviews_generated: r.reviewsGenerated,
    }));

    const { error } = await supabaseAdmin.from("restaurants").upsert(rows, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return { count: rows.length };
  });
