# Magic Review — AI-Powered QR Review Generator

Help local businesses (cafés, salons, shops, restaurants) collect more Google reviews by letting customers scan a QR code, pick a rating, and post an AI-generated review in their own language (English / Hindi / Gujarati) with a single tap.

**Live demo:** https://magic-review-orbitx.lovable.app

---

## Features

- 🎯 **QR-code review flow** — customer scans → picks language → rates → gets 4 AI-suggested reviews → copies & posts on Google in one tap.
- 🌐 **Multi-language** — English, Hindi, Gujarati out of the box.
- 🤖 **AI-generated reviews** — uses Google Gemini 2.5 Flash via the Lovable AI Gateway. Tunable per business (tone, keywords, words to avoid, business type).
- 🏪 **Admin dashboard** — add/manage businesses, view scans & reviews-generated counts, download QR codes.
- ☁️ **Shared cloud storage** — businesses live in Lovable Cloud (Supabase) so QR codes work on any device.
- 📱 **Mobile-first PWA-friendly UI** — glassmorphism design, tap-friendly targets, fast SSR via TanStack Start.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | [TanStack Start](https://tanstack.com/start) v1 (React 19, file-based routing, SSR) |
| Build tool | Vite 7 |
| Styling | Tailwind CSS v4 + shadcn/ui + Radix primitives |
| Backend | Lovable Cloud (Supabase Postgres + Auth) |
| AI | Lovable AI Gateway → `google/gemini-2.5-flash` |
| Server logic | TanStack `createServerFn` (typed RPC) |
| Deployment | Cloudflare Workers (via Lovable publish) |
| Language | TypeScript (strict) |

---

## Folder Structure

```
.
├── docs/                      # Architecture, deployment, handover docs
│   ├── architecture.md
│   ├── deployment.md
│   └── handover.md
├── public/                    # Static assets served as-is
├── src/
│   ├── assets/                # Imported images / icons
│   ├── components/ui/         # shadcn primitives
│   ├── constants/             # Centralized app constants & storage keys
│   ├── hooks/                 # Reusable React hooks
│   ├── integrations/supabase/ # Auto-generated Lovable Cloud client (do not edit)
│   ├── lib/                   # Business logic & server functions
│   │   ├── ai.functions.ts            # AI review generation serverFn
│   │   ├── restaurants.functions.ts   # Cloud CRUD serverFns
│   │   ├── storage.ts                 # Local cache + token codec
│   │   └── business-types.ts          # Business type registry
│   ├── routes/                # File-based routes (do NOT rename — QR URLs depend on them)
│   │   ├── __root.tsx                 # Root shell
│   │   ├── index.tsx                  # Landing
│   │   ├── admin.tsx                  # Admin dashboard
│   │   └── r.$id.tsx                  # Public review flow (target of QR codes)
│   ├── styles.css             # Tailwind v4 entry + design tokens
│   ├── router.tsx             # Router config
│   └── start.ts               # TanStack Start instance + middleware
├── supabase/                  # Migrations (auto-applied via Lovable Cloud)
├── .env.example               # Copy to .env and fill in
└── package.json
```

> **Important:** Files under `src/routes/` define public URLs. Renaming `r.$id.tsx` would break every QR code already printed in the wild. Do not move route files without a redirect plan.

---

## Quick Start

### Prerequisites
- [Bun](https://bun.sh) (recommended) or Node.js 20+
- A Lovable Cloud project (or your own Supabase project) for the database & AI gateway

### Install & run

```bash
git clone <your-repo-url>
cd magic-review
bun install                      # or: npm install
cp .env.example .env             # fill in the values (see below)
bun run dev                      # http://localhost:3000
```

### Build

```bash
bun run build                    # production build
bun run preview                  # preview the production build
```

### Lint & format

```bash
bun run lint
bun run format
```

---

## Environment Variables

See [`.env.example`](./.env.example) for the full list. Summary:

| Variable | Where it's used | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | Browser + server | Public — safe to ship in client bundle |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Browser + server | Public — anon/publishable key only |
| `VITE_SUPABASE_PROJECT_ID` | Tooling | Project ref id |
| `SUPABASE_URL` | Server only | Same value as VITE_SUPABASE_URL |
| `SUPABASE_PUBLISHABLE_KEY` | Server only | Same value as the VITE_ one |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Supabase service role key for server admin operations |
| `LOVABLE_API_KEY` | Server only (auto-injected on Lovable Cloud) | AI Gateway key — never commit |

On Lovable Cloud these are managed for you; you only set them manually for self-hosting.

---

## Deployment

The app is deployed via Lovable (Cloudflare Workers under the hood).

- **Frontend changes** → click **Publish → Update** in the Lovable editor.
- **Backend changes** (server functions, migrations) → deploy automatically on save.

For self-hosting, see [`docs/deployment.md`](./docs/deployment.md).

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| QR scan shows "Restaurant not found" | Business saved only to one browser's localStorage and Cloud copy missing | Re-create the business in `/admin` — it will sync to Cloud |
| "Failed to generate" toast on review page | AI Gateway credit exhausted or `LOVABLE_API_KEY` missing | Check Lovable Cloud usage / refill credits |
| Blank page after `bun run dev` | Stale `src/routeTree.gen.ts` | Delete it; Vite plugin regenerates on next start |
| Admin login fails | Hardcoded creds in `src/lib/storage.ts` were changed | Reset them or migrate to real auth (recommended for production) |

---

## Roadmap / Known Limitations

- **Admin auth is a hardcoded password** shipped in the client bundle. Replace with Lovable Cloud auth + a `user_roles` table before serious commercial use. See `docs/handover.md`.
- No automated test suite yet.
- Analytics counts are eventually consistent (local + cloud writes).

---

## Contributing

1. Fork & branch from `main` (`feat/<short-name>` or `fix/<short-name>`).
2. Run `bun run lint && bun run format` before opening a PR.
3. Keep route filenames stable — they're public URLs.
4. PRs that change UI/behavior should include a short before/after note.

---

## License

MIT — see [`LICENSE`](./LICENSE).
