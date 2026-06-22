import { createFileRoute, useParams, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Star,
  Sparkles,
  Copy,
  Check,
  RefreshCcw,
  ExternalLink,
  Edit3,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import {
  decodeRestaurantToken,
  getRestaurant,
  incrementReviews,
  incrementScans,
  type Restaurant,
} from "@/lib/storage";
import { generateReviews } from "@/lib/ai.functions";
import { getBusinessTypeLabel } from "@/lib/business-types";
import {
  getRestaurantFromCloud,
  recordRestaurantReview,
  recordRestaurantScan,
} from "@/lib/restaurants.functions";
import { toast, Toaster } from "sonner";

export const Route = createFileRoute("/r/$id")({
  head: () => ({
    meta: [{ title: "Leave a Review" }],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    d: typeof s.d === "string" ? s.d : undefined,
  }),
  component: ReviewPage,
});

type Step = "language" | "rating" | "reviews";
type Lang = "english" | "hindi" | "gujarati";

const LANG_LABELS: Record<Lang, { name: string; native: string }> = {
  english: { name: "English", native: "English" },
  hindi: { name: "Hindi", native: "हिन्दी" },
  gujarati: { name: "Gujarati", native: "ગુજરાતી" },
};

function ReviewPage() {
  const { id } = useParams({ from: "/r/$id" });
  const { d } = useSearch({ from: "/r/$id" });
  const [restaurant, setRestaurant] = useState<Restaurant | null | undefined>(undefined);
  const [step, setStep] = useState<Step>("language");
  const [lang, setLang] = useState<Lang | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [reviews, setReviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const callGenerate = useServerFn(generateReviews);
  const getCloudRestaurant = useServerFn(getRestaurantFromCloud);
  const recordScan = useServerFn(recordRestaurantScan);
  const recordReview = useServerFn(recordRestaurantReview);

  useEffect(() => {
    let cancelled = false;
    async function loadRestaurant() {
      const local = getRestaurant(id);
      if (local) {
        if (!cancelled) setRestaurant(local);
        incrementScans(local.id);
        recordScan({ data: { id: local.id } }).catch(() => undefined);
        return;
      }

      try {
        const result = await getCloudRestaurant({ data: { id } });
        if (result.restaurant) {
          if (!cancelled) setRestaurant(result.restaurant);
          recordScan({ data: { id } }).catch(() => undefined);
          return;
        }
      } catch {
        // Keep QR fallback working even if the shared database is temporarily unavailable.
      }

      if (d) {
        const decoded = decodeRestaurantToken(d);
        if (!cancelled) setRestaurant(decoded);
        return;
      }

      if (!cancelled) setRestaurant(null);
    }
    loadRestaurant();
    return () => {
      cancelled = true;
    };
  }, [id, d, getCloudRestaurant, recordScan]);

  async function fetchReviews(r: Restaurant, l: Lang, rt: number) {
    setLoading(true);
    setReviews([]);
    setSelectedIdx(null);
    setEditingIdx(null);
    try {
      const out = await callGenerate({
        data: {
          rating: rt,
          language: l,
          tone: r.brandTone || "friendly",
          restaurantName: r.name,
          useEmoji: true,
          count: 4,
          businessTypeLabel: getBusinessTypeLabel(r.businessType, r.customBusinessType),
          keywords: r.keywords ?? [],
          avoidWords: r.avoidWords ?? [],
        },
      });
      setReviews(out.reviews);
      incrementReviews(r.id);
      recordReview({ data: { id: r.id } }).catch(() => undefined);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setLoading(false);
    }
  }

  function handleRating(rt: number) {
    if (!restaurant || !lang) return;
    setRating(rt);
    setStep("reviews");
    fetchReviews(restaurant, lang, rt);
  }

  async function handleCopy(text: string, idx: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedIdx(null), 1500);
    } catch {
      toast.error("Copy failed");
    }
  }

  function openGoogle() {
    if (!restaurant) return;
    window.open(restaurant.googleReviewUrl, "_blank");
  }

  if (restaurant === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (restaurant === null) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center">
        <div className="glass rounded-3xl p-8 max-w-md">
          <h1 className="text-2xl font-bold">Restaurant not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This QR code isn't linked to a registered restaurant.
          </p>
        </div>
      </div>
    );
  }

  if (restaurant.active === false) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center">
        <div className="glass rounded-3xl p-8 max-w-md">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <Sparkles className="h-6 w-6 text-muted-foreground" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">{restaurant.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Reviews are temporarily paused for this business. Please check back soon ✨
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-5 py-8 max-w-xl mx-auto">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Powered by AI
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">{restaurant.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">We'd love your honest feedback ✨</p>
      </div>

      {/* Step 1: Language */}
      {step === "language" && (
        <div className="glass rounded-3xl p-6 animate-in fade-in slide-in-from-bottom-4">
          <h2 className="text-lg font-semibold text-center">Choose your language</h2>
          <p className="text-xs text-center text-muted-foreground mt-1">
            ભાષા પસંદ કરો · भाषा चुनें
          </p>
          <div className="mt-6 grid gap-3">
            {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => {
                  setLang(l);
                  setStep("rating");
                }}
                className="group w-full glass rounded-2xl px-5 py-4 flex items-center justify-between hover:scale-[1.02] transition-transform"
              >
                <div className="text-left">
                  <div className="text-base font-semibold">{LANG_LABELS[l].native}</div>
                  <div className="text-xs text-muted-foreground">{LANG_LABELS[l].name}</div>
                </div>
                <div className="h-9 w-9 rounded-full btn-gradient flex items-center justify-center">
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Rating */}
      {step === "rating" && (
        <div className="glass rounded-3xl p-6 animate-in fade-in slide-in-from-bottom-4">
          <button
            onClick={() => setStep("language")}
            className="text-xs text-muted-foreground inline-flex items-center gap-1 mb-4"
          >
            <ArrowLeft className="h-3 w-3" /> Back
          </button>
          <h2 className="text-lg font-semibold text-center">How was your experience?</h2>
          <p className="text-xs text-center text-muted-foreground mt-1">Tap a star to rate</p>
          <div className="mt-8 flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                onClick={() => handleRating(i)}
                className="p-1 hover:scale-125 active:scale-95 transition-transform"
                aria-label={`${i} star${i > 1 ? "s" : ""}`}
              >
                <Star className="h-12 w-12 text-[oklch(0.82_0.16_85)] fill-[oklch(0.82_0.16_85)] drop-shadow" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Reviews */}
      {step === "reviews" && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setStep("rating");
                setReviews([]);
              }}
              className="text-xs text-muted-foreground inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" /> Back
            </button>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i <= (rating ?? 0)
                      ? "fill-[oklch(0.82_0.16_85)] text-[oklch(0.82_0.16_85)]"
                      : "text-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            onClick={() => restaurant && lang && rating && fetchReviews(restaurant, lang, rating)}
            disabled={loading}
            className="w-full glass rounded-2xl py-3 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Generating fresh reviews..." : "Generate new suggestions"}
          </button>

          {loading && reviews.length === 0 && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass rounded-2xl p-5 animate-pulse">
                  <div className="h-3 w-3/4 bg-muted rounded mb-2" />
                  <div className="h-3 w-full bg-muted rounded mb-2" />
                  <div className="h-3 w-1/2 bg-muted rounded" />
                </div>
              ))}
            </div>
          )}

          {reviews.map((text, idx) => {
            const isSelected = selectedIdx === idx;
            const isEditing = editingIdx === idx;
            return (
              <div
                key={idx}
                className={`glass rounded-2xl p-5 transition-all ${
                  isSelected ? "ring-2 ring-primary" : ""
                }`}
              >
                {isEditing ? (
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    rows={5}
                    className="w-full resize-none rounded-xl border border-border bg-background/60 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => {
                          const next = [...reviews];
                          next[idx] = editValue;
                          setReviews(next);
                          setEditingIdx(null);
                        }}
                        className="rounded-full btn-gradient px-4 py-1.5 text-xs font-semibold"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingIdx(null)}
                        className="rounded-full glass px-4 py-1.5 text-xs font-semibold"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleCopy(text, idx)}
                        className="rounded-full glass px-4 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        {copiedIdx === idx ? (
                          <>
                            <Check className="h-3.5 w-3.5" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" /> Copy
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditingIdx(idx);
                          setEditValue(text);
                        }}
                        className="rounded-full glass px-4 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => {
                          setSelectedIdx(idx);
                          handleCopy(text, idx);
                          setTimeout(openGoogle, 400);
                        }}
                        className="rounded-full btn-gradient px-4 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        Post on Google <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {!loading && reviews.length > 0 && (
            <p className="text-center text-xs text-muted-foreground pt-2">
              Tip: We'll copy your chosen review and open Google for you to paste & post.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
