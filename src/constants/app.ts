/**
 * Centralized app constants.
 *
 * Keep magic strings (storage keys, default values, registered admin email) here
 * so they're easy to audit and change in one place.
 *
 * NOTE: `ADMIN_EMAIL` / `ADMIN_PASSWORD` are still shipped to the browser via
 * `src/lib/storage.ts` for backward compatibility with the current admin flow.
 * This is a known security limitation — see `docs/handover.md` for the
 * recommended migration to real Lovable Cloud auth.
 */

// ---- localStorage keys ------------------------------------------------------
export const STORAGE_KEYS = {
  restaurants: "review_app_restaurants_v1",
  adminSession: "review_app_admin_session_v1",
} as const;

// ---- Admin credentials (legacy — see note above) ----------------------------
export const ADMIN_EMAIL = "web.kingasterisk@gmail.com";
export const ADMIN_PASSWORD = "8980K!ng@33558980";

// ---- Defaults ---------------------------------------------------------------
export const DEFAULT_BRAND_TONE = "friendly";
export const DEFAULT_BUSINESS_TYPE = "restaurant";

// ---- AI generation ----------------------------------------------------------
export const DEFAULT_REVIEW_COUNT = 4;
