import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  encodeRestaurantToken,
  isAdminLoggedIn,
  listRestaurants,
  setAdminLoggedIn,
  type Restaurant,
} from "@/lib/storage";
import {
  addRestaurantToCloud,
  deleteRestaurantFromCloud,
  listRestaurantsFromCloud,
  setRestaurantActiveInCloud,
  syncLegacyRestaurantsToCloud,
} from "@/lib/restaurants.functions";
import {
  BUSINESS_TYPES,
  BRAND_TONES,
  getBusinessTypeLabel,
  getBusinessTypePreset,
} from "@/lib/business-types";
import {
  Sparkles,
  Plus,
  LogOut,
  QrCode,
  Download,
  Trash2,
  Eye,
  MessageSquare,
  ExternalLink,
  Copy,
  Check,
  X,
} from "lucide-react";
import { toast, Toaster } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — ReviewGenie" }] }),
  component: AdminPage,
});

function AdminPage() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(isAdminLoggedIn());
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <div className="min-h-screen">
      <Toaster position="top-center" richColors />
      {authed ? (
        <Dashboard onLogout={() => setAuthed(false)} />
      ) : (
        <Login onLogin={() => setAuthed(true)} />
      )}
    </div>
  );
}

function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();

    const normalizeValue = (value: string) => value.replace(/['"\s]/g, "").toLowerCase();
    const normalizedEmail = normalizeValue(email);
    const normalizedPassword = normalizeValue(password);
    const validCredentials = [[ADMIN_EMAIL, ADMIN_PASSWORD]].some(([storedEmail, storedPassword]) => {
      const expectedEmail = normalizeValue(storedEmail);
      const expectedPassword = normalizeValue(storedPassword);
      return normalizedEmail === expectedEmail && normalizedPassword === expectedPassword;
    });

    if (validCredentials) {
      setAdminLoggedIn(true);
      onLogin();
      toast.success("Welcome back");
    } else {
      toast.error("Invalid credentials");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={submit} className="glass rounded-3xl p-8 w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl btn-gradient">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-bold tracking-tight">ReviewGenie Admin</span>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-center">Sign in</h1>
        <div className="mt-6 space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
          <button
            type="submit"
            className="w-full rounded-xl btn-gradient py-3 text-sm font-semibold"
          >
            Sign in
          </button>
        </div>
      </form>
    </div>
  );
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [list, setList] = useState<Restaurant[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [qrFor, setQrFor] = useState<Restaurant | null>(null);

  const listCloud = useServerFn(listRestaurantsFromCloud);
  const deleteCloud = useServerFn(deleteRestaurantFromCloud);
  const setActiveCloud = useServerFn(setRestaurantActiveInCloud);
  const syncLegacy = useServerFn(syncLegacyRestaurantsToCloud);

  async function refresh() {
    const result = await listCloud();
    setList(result.restaurants);
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const legacyRestaurants = listRestaurants();
        if (legacyRestaurants.length > 0) {
          await syncLegacy({ data: { restaurants: legacyRestaurants } });
        }
        const result = await listCloud();
        if (!cancelled) setList(result.restaurants);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load restaurants");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [listCloud, syncLegacy]);

  async function remove(id: string) {
    if (!confirm("Delete this business?")) return;
    try {
      await deleteCloud({ data: { id } });
      await refresh();
      toast.success("Deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
    }
  }

  async function toggleActive(r: Restaurant) {
    const next = !r.active;
    // Optimistic update
    setList((curr) => curr.map((x) => (x.id === r.id ? { ...x, active: next } : x)));
    try {
      await setActiveCloud({ data: { id: r.id, active: next } });
      toast.success(next ? "Scanner enabled" : "Scanner paused");
    } catch (error) {
      // Revert
      setList((curr) => curr.map((x) => (x.id === r.id ? { ...x, active: !next } : x)));
      toast.error(error instanceof Error ? error.message : "Failed to update");
    }
  }

  const totalScans = list.reduce((s, r) => s + r.scans, 0);
  const totalReviews = list.reduce((s, r) => s + r.reviewsGenerated, 0);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl btn-gradient">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-bold tracking-tight">Admin Dashboard</span>
        </div>
        <button
          onClick={() => {
            setAdminLoggedIn(false);
            onLogout();
          }}
          className="rounded-full glass px-4 py-2 text-sm font-medium inline-flex items-center gap-1.5"
        >
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Businesses" value={list.length} icon={Sparkles} />
        <StatCard label="Total Scans" value={totalScans} icon={Eye} />
        <StatCard label="Reviews Generated" value={totalReviews} icon={MessageSquare} />
      </div>

      {/* Add */}
      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Your businesses</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="rounded-full btn-gradient px-5 py-2.5 text-sm font-semibold inline-flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" /> Add business
        </button>
      </div>

      {/* List */}
      <div className="mt-6 space-y-3">
        {list.length === 0 && (
          <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">
            No businesses yet. Add your first one to generate a QR code.
          </div>
        )}
        {list.map((r) => {
          const typeLabel = getBusinessTypeLabel(r.businessType, r.customBusinessType);
          const preset = getBusinessTypePreset(r.businessType);
          return (
            <div
              key={r.id}
              className={`glass rounded-2xl p-5 transition-opacity ${r.active ? "" : "opacity-60"}`}
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-semibold truncate">{r.name}</h3>
                    <span className="text-xs rounded-full px-2 py-0.5 bg-primary/10 text-primary">
                      {preset?.emoji ?? "✨"} {typeLabel}
                    </span>
                    <span className="text-xs rounded-full px-2 py-0.5 glass capitalize">
                      {r.brandTone}
                    </span>
                    {!r.active && (
                      <span className="text-xs rounded-full px-2 py-0.5 bg-destructive/10 text-destructive font-medium">
                        Paused
                      </span>
                    )}
                  </div>
                  <a
                    href={r.googleReviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 truncate max-w-xs mt-1"
                  >
                    {r.googleReviewUrl} <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </a>
                  {r.keywords.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {r.keywords.slice(0, 6).map((k) => (
                        <span key={k} className="text-[10px] px-2 py-0.5 rounded-full bg-muted">
                          {k}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                    <span>
                      <Eye className="inline h-3 w-3 mr-1" />
                      {r.scans} scans
                    </span>
                    <span>
                      <MessageSquare className="inline h-3 w-3 mr-1" />
                      {r.reviewsGenerated} reviews
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap items-center">
                  <button
                    onClick={() => toggleActive(r)}
                    role="switch"
                    aria-checked={r.active}
                    aria-label={r.active ? "Pause scanner" : "Enable scanner"}
                    title={r.active ? "Scanner is ON — tap to pause" : "Scanner is OFF — tap to enable"}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                      r.active ? "btn-gradient" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                        r.active ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => setQrFor(r)}
                    className="rounded-full btn-gradient px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <QrCode className="h-3.5 w-3.5" /> QR
                  </button>
                  <button
                    onClick={() => remove(r.id)}
                    className="rounded-full glass px-3 py-2 text-xs font-semibold"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showAdd && (
        <BusinessSetupModal
          onClose={() => setShowAdd(false)}
          onCreated={async () => {
            setShowAdd(false);
            await refresh();
            toast.success("Business created");
          }}
        />
      )}

      {qrFor && <QrModal restaurant={qrFor} onClose={() => setQrFor(null)} />}
    </div>
  );
}

function BusinessSetupModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [typeId, setTypeId] = useState<string>("");
  const [customType, setCustomType] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [avoidWords, setAvoidWords] = useState<string[]>([]);
  const [avoidInput, setAvoidInput] = useState("");
  const [tone, setTone] = useState("friendly");
  const [saving, setSaving] = useState(false);

  const addCloud = useServerFn(addRestaurantToCloud);
  const preset = useMemo(() => getBusinessTypePreset(typeId), [typeId]);

  function selectType(id: string) {
    setTypeId(id);
    const p = getBusinessTypePreset(id);
    if (p) setKeywords(p.keywords);
  }

  function addKeyword(value: string, target: "kw" | "av") {
    const v = value.trim().toLowerCase();
    if (!v) return;
    if (target === "kw") {
      if (!keywords.includes(v)) setKeywords([...keywords, v]);
      setKeywordInput("");
    } else {
      if (!avoidWords.includes(v)) setAvoidWords([...avoidWords, v]);
      setAvoidInput("");
    }
  }

  async function submit() {
    if (!name.trim() || !url.trim()) {
      setStep(1);
      toast.error("Business name and review link required");
      return;
    }
    if (!typeId) {
      setStep(2);
      toast.error("Pick a business type");
      return;
    }
    if (typeId === "other" && !customType.trim()) {
      setStep(2);
      toast.error("Enter your business type");
      return;
    }
    setSaving(true);
    try {
      await addCloud({
        data: {
          name: name.trim(),
          googleReviewUrl: url.trim(),
          businessType: typeId,
          customBusinessType: typeId === "other" ? customType.trim() : null,
          keywords,
          avoidWords,
          brandTone: tone,
        },
      });
      onCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add business");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-8 overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="glass rounded-3xl p-6 w-full max-w-2xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Set up your business</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="rounded-full glass p-2" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress */}
        <div className="mt-4 flex gap-1.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${
                i <= step ? "btn-gradient" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="mt-6 space-y-3">
            <label className="block text-sm font-medium">Business Name</label>
            <input
              placeholder="e.g. Ved's Cafe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <label className="block text-sm font-medium mt-3">Google Review Link</label>
            <input
              placeholder="https://g.page/r/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              type="url"
              className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex justify-end pt-3">
              <button
                onClick={() => {
                  if (!name.trim() || !url.trim()) {
                    toast.error("Fill both fields");
                    return;
                  }
                  setStep(2);
                }}
                className="rounded-full btn-gradient px-6 py-2.5 text-sm font-semibold"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Business Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                {BUSINESS_TYPES.map((b) => {
                  const active = typeId === b.id;
                  return (
                    <button
                      key={b.id}
                      onClick={() => selectType(b.id)}
                      className={`text-left rounded-xl px-3 py-3 border transition-all ${
                        active
                          ? "border-primary bg-primary/10 ring-2 ring-primary"
                          : "border-border bg-background/40 hover:border-primary/50"
                      }`}
                    >
                      <div className="text-lg">{b.emoji}</div>
                      <div className="text-xs font-medium mt-1 leading-tight">{b.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {typeId === "other" && (
              <div>
                <label className="block text-sm font-medium mb-2">Enter Your Business Type</label>
                <input
                  placeholder="e.g. Music Studio"
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}

            {typeId && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  AI Context Keywords
                  <span className="text-xs text-muted-foreground font-normal ml-1">
                    (auto-filled — edit freely)
                  </span>
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {keywords.map((k) => (
                    <span
                      key={k}
                      className="text-xs inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary"
                    >
                      {k}
                      <button onClick={() => setKeywords(keywords.filter((x) => x !== k))}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    placeholder="Add keyword and press Enter"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addKeyword(keywordInput, "kw");
                      }
                    }}
                    className="flex-1 rounded-xl border border-border bg-background/60 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={() => addKeyword(keywordInput, "kw")}
                    className="rounded-xl glass px-4 text-sm"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-3">
              <button onClick={() => setStep(1)} className="rounded-full glass px-5 py-2 text-sm">
                Back
              </button>
              <button
                onClick={() => {
                  if (!typeId) return toast.error("Pick a business type");
                  if (typeId === "other" && !customType.trim())
                    return toast.error("Enter your business type");
                  setStep(3);
                }}
                className="rounded-full btn-gradient px-6 py-2.5 text-sm font-semibold"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-6 space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">
                Words To Avoid
                <span className="text-xs text-muted-foreground font-normal ml-1">
                  (optional — AI will never use these)
                </span>
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {avoidWords.map((k) => (
                  <span
                    key={k}
                    className="text-xs inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-destructive/10 text-destructive"
                  >
                    {k}
                    <button onClick={() => setAvoidWords(avoidWords.filter((x) => x !== k))}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  placeholder="e.g. spicy, masala"
                  value={avoidInput}
                  onChange={(e) => setAvoidInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addKeyword(avoidInput, "av");
                    }
                  }}
                  className="flex-1 rounded-xl border border-border bg-background/60 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={() => addKeyword(avoidInput, "av")}
                  className="rounded-xl glass px-4 text-sm"
                >
                  Add
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Brand Tone</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {BRAND_TONES.map((t) => {
                  const active = tone === t.value;
                  return (
                    <button
                      key={t.value}
                      onClick={() => setTone(t.value)}
                      className={`rounded-xl px-3 py-2.5 text-sm font-medium border transition-all ${
                        active
                          ? "border-primary bg-primary/10 ring-2 ring-primary"
                          : "border-border bg-background/40 hover:border-primary/50"
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="glass rounded-xl p-3 text-xs text-muted-foreground">
              <strong className="text-foreground">Summary:</strong> {name || "—"} ·{" "}
              {preset?.emoji} {typeId === "other" ? customType : preset?.label} ·{" "}
              <span className="capitalize">{tone}</span> · {keywords.length} keywords ·{" "}
              {avoidWords.length} avoid
            </div>

            <div className="flex justify-between pt-2">
              <button onClick={() => setStep(2)} className="rounded-full glass px-5 py-2 text-sm">
                Back
              </button>
              <button
                onClick={submit}
                disabled={saving}
                className="rounded-full btn-gradient px-6 py-2.5 text-sm font-semibold disabled:opacity-60"
              >
                {saving ? "Creating..." : "Create & Generate QR"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-2 text-3xl font-bold tracking-tight">{value}</div>
    </div>
  );
}

function QrModal({ restaurant, onClose }: { restaurant: Restaurant; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const token = encodeRestaurantToken(restaurant);
  const url =
    typeof window !== "undefined" ? `${window.location.origin}/r/${restaurant.id}?d=${token}` : "";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=10&data=${encodeURIComponent(
    url,
  )}`;

  function download() {
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = `${restaurant.name.replace(/\s+/g, "-")}-qr.png`;
    a.target = "_blank";
    a.rel = "noreferrer";
    a.click();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-6 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="glass rounded-3xl p-6 max-w-sm w-full text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold">{restaurant.name}</h3>
        <p className="text-xs text-muted-foreground mt-1">Scan to leave a review</p>
        <div className="mt-5 mx-auto bg-white p-4 rounded-2xl inline-block shadow">
          <img src={qrUrl} alt="QR code" className="h-60 w-60" />
        </div>
        <div className="mt-4 flex items-center gap-2 glass rounded-xl px-3 py-2 text-xs">
          <span className="truncate flex-1 text-left text-muted-foreground">{url}</span>
          <button onClick={copyLink} className="flex-shrink-0">
            {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
        <div className="mt-4 flex gap-2 justify-center">
          <button
            onClick={download}
            className="rounded-full btn-gradient px-5 py-2.5 text-sm font-semibold inline-flex items-center gap-1.5"
          >
            <Download className="h-4 w-4" /> Download
          </button>
          <button
            onClick={onClose}
            className="rounded-full glass px-5 py-2.5 text-sm font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
