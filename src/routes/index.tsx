import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, QrCode, Star, ArrowRight, Languages, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ReviewGenie — AI Google Reviews for Restaurants & Cafes" },
      {
        name: "description",
        content:
          "Help guests leave great Google reviews in seconds. Multilingual, AI-generated, QR-powered.",
      },
      { property: "og:title", content: "ReviewGenie — AI Google Reviews" },
      {
        property: "og:description",
        content: "QR → language → rating → AI review. Effortless feedback for your business.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl btn-gradient">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">ReviewGenie</span>
        </div>
        <Link
          to="/admin"
          className="rounded-full glass px-5 py-2 text-sm font-medium hover:scale-105 transition-transform"
        >
          Admin
        </Link>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pt-16 pb-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium">
          <Zap className="h-3.5 w-3.5 text-primary" />
          AI-powered · Multilingual · No app needed
        </div>
        <h1 className="mt-6 text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight">
          Turn every meal into a <span className="text-gradient">5-star review</span>.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Guests scan your QR, pick a language and rating, and AI writes a natural review they
          can post to Google in seconds.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 rounded-full btn-gradient px-7 py-3.5 text-sm font-semibold"
          >
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#how"
            className="inline-flex items-center gap-2 rounded-full glass px-7 py-3.5 text-sm font-semibold"
          >
            See how it works
          </a>
        </div>

        {/* Star preview */}
        <div className="mt-16 mx-auto max-w-md glass rounded-3xl p-8">
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className="h-9 w-9 fill-[oklch(0.82_0.16_85)] text-[oklch(0.82_0.16_85)]"
              />
            ))}
          </div>
          <p className="mt-4 text-sm italic text-muted-foreground">
            "Loved the cozy ambiance and the staff was so friendly. Will be back!"
          </p>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="text-center text-3xl md:text-4xl font-bold tracking-tight">
          Three taps. One great review.
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: QrCode,
              title: "Scan",
              text: "Guest scans the QR on the table or bill.",
            },
            {
              icon: Languages,
              title: "Choose",
              text: "Pick language (Gujarati / Hindi / English) and rating.",
            },
            {
              icon: Sparkles,
              title: "Post",
              text: "AI drafts a natural review. They edit, copy, and post on Google.",
            },
          ].map(({ icon: Icon, title, text }, i) => (
            <div key={title} className="glass rounded-2xl p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl btn-gradient">
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-4 text-xs font-semibold text-muted-foreground">
                STEP {i + 1}
              </div>
              <h3 className="mt-1 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/50 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} ReviewGenie — Built with love.
      </footer>
    </div>
  );
}
