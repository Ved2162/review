// Simple localStorage-based store for restaurants & analytics.
// Keeps the app fully client-side & minimal.
//
// Storage keys and admin credentials are centralized in `src/constants/app.ts`.
// We re-export admin credential constants here so existing imports keep working.

import {
  STORAGE_KEYS,
  ADMIN_EMAIL as ADMIN_EMAIL_CONST,
  ADMIN_PASSWORD as ADMIN_PASSWORD_CONST,
} from "@/constants/app";

export type Restaurant = {
  id: string;
  name: string;
  googleReviewUrl: string;
  createdAt: number;
  scans: number;
  reviewsGenerated: number;
  businessType: string;
  customBusinessType?: string | null;
  keywords: string[];
  avoidWords: string[];
  brandTone: string;
  active: boolean;
};

const KEY = STORAGE_KEYS.restaurants;
const ADMIN_KEY = STORAGE_KEYS.adminSession;

export const ADMIN_EMAIL = ADMIN_EMAIL_CONST;
export const ADMIN_PASSWORD = ADMIN_PASSWORD_CONST;

function read(): Restaurant[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(list: Restaurant[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function listRestaurants(): Restaurant[] {
  return read().sort((a, b) => b.createdAt - a.createdAt);
}

export function getRestaurant(id: string): Restaurant | undefined {
  return read().find((r) => r.id === id);
}

export function addRestaurant(
  name: string,
  googleReviewUrl: string,
  extra?: Partial<Pick<Restaurant, "businessType" | "customBusinessType" | "keywords" | "avoidWords" | "brandTone">>,
): Restaurant {
  const r: Restaurant = {
    id: Math.random().toString(36).slice(2, 9),
    name,
    googleReviewUrl,
    createdAt: Date.now(),
    scans: 0,
    reviewsGenerated: 0,
    businessType: extra?.businessType ?? "restaurant",
    customBusinessType: extra?.customBusinessType ?? null,
    keywords: extra?.keywords ?? [],
    avoidWords: extra?.avoidWords ?? [],
    brandTone: extra?.brandTone ?? "friendly",
    active: true,
  };
  const list = read();
  list.push(r);
  write(list);
  return r;
}

export function deleteRestaurant(id: string) {
  write(read().filter((r) => r.id !== id));
}

export function incrementScans(id: string) {
  const list = read();
  const r = list.find((x) => x.id === id);
  if (r) {
    r.scans += 1;
    write(list);
  }
}

export function incrementReviews(id: string) {
  const list = read();
  const r = list.find((x) => x.id === id);
  if (r) {
    r.reviewsGenerated += 1;
    write(list);
  }
}

// Admin session
export function isAdminLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ADMIN_KEY) === "1";
}
export function setAdminLoggedIn(v: boolean) {
  if (v) localStorage.setItem(ADMIN_KEY, "1");
  else localStorage.removeItem(ADMIN_KEY);
}

// Encode restaurant info into a portable URL token so QR codes work on any device
// without requiring server-side storage.
function b64urlEncode(s: string): string {
  if (typeof window === "undefined") return "";
  const b = btoa(unescape(encodeURIComponent(s)));
  return b.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(s: string): string {
  if (typeof window === "undefined") return "";
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return decodeURIComponent(escape(atob(b)));
}

export function encodeRestaurantToken(
  r: Pick<Restaurant, "id" | "name" | "googleReviewUrl"> &
    Partial<Pick<Restaurant, "businessType" | "customBusinessType" | "keywords" | "avoidWords" | "brandTone">>,
): string {
  return b64urlEncode(
    JSON.stringify({
      i: r.id,
      n: r.name,
      u: r.googleReviewUrl,
      b: r.businessType,
      c: r.customBusinessType,
      k: r.keywords,
      a: r.avoidWords,
      t: r.brandTone,
    }),
  );
}

export function decodeRestaurantToken(token: string): Restaurant | null {
  try {
    const obj = JSON.parse(b64urlDecode(token)) as {
      i: string;
      n: string;
      u: string;
      b?: string;
      c?: string | null;
      k?: string[];
      a?: string[];
      t?: string;
    };
    if (!obj?.n || !obj?.u) return null;
    return {
      id: obj.i || "shared",
      name: obj.n,
      googleReviewUrl: obj.u,
      createdAt: 0,
      scans: 0,
      reviewsGenerated: 0,
      businessType: obj.b ?? "restaurant",
      customBusinessType: obj.c ?? null,
      keywords: obj.k ?? [],
      avoidWords: obj.a ?? [],
      brandTone: obj.t ?? "friendly",
      active: true,
    };
  } catch {
    return null;
  }
}
