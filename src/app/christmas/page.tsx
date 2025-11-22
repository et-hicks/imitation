import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Christmas Wishlist",
};

const wishlistItems = [
  "stainless steel pan (non-non-stick)",
  "raw denim pants (this is expensive)",
  "ipad pro 13 in case (i’m buying myself one for getting a new job)",
  "keyboard and mouse",
  "sturdy flannel shirts",
  "masculin jewelry",
];

const aiSuggestions = [
  "Lightweight down jacket for chilly belays",
  "Performance climbing harness with breathable padding",
  "Wireless earbuds with strong water resistance",
  "Portable crash pad for bouldering sessions",
  "Merino wool base layers for versatile layering",
  "Grip-strength trainer or hangboard for at-home sessions",
  "Everyday carry backpack with laptop and gear compartments",
  "Rugged trail running shoes for cross-training",
  "Compact travel tripod for action or climb photos",
  "Multi-tool with knife, pliers, and bit driver",
  "Technical hiking pants with stretch and reinforced knees",
  "Smartwatch with GPS and fitness tracking",
  "Titanium or stainless steel water bottle",
  "Breathable performance socks built for long days",
  "Leather bracelet or minimalist chain to pair with the jewelry vibe",
  "Portable power bank for devices on climbing trips",
  "Slim wallet with RFID protection",
  "Touchscreen-friendly insulated gloves",
  "Climbing chalk and durable chalk bag",
];

export default function ChristmasPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-12 sm:px-10 lg:py-16">
        <header className="space-y-2 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Holiday List</p>
          <h1 className="text-4xl font-semibold text-white sm:text-5xl">Christmas Wishlist</h1>
          <p className="text-base text-slate-300">
            Gifts and gear ideas inspired by the things you already love.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Requested Items</h2>
          <ul className="space-y-3 rounded-2xl border border-white/5 bg-white/5 p-5 shadow-[0_15px_30px_rgba(15,23,42,0.35)]">
            {wishlistItems.map((item) => (
              <li key={item} className="flex items-start gap-3 text-lg text-slate-50">
                <span aria-hidden className="mt-1 text-sky-300">
                  •
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">AI Generated Suggestions</h2>
          <p className="text-slate-300">
            Extra ideas tailored to a 28-year-old active guy who loves climbing,
            fashion, and tech.
          </p>
          <ul className="grid gap-3 rounded-2xl border border-white/5 bg-[#0f172a] p-5 shadow-[0_15px_30px_rgba(15,23,42,0.35)] sm:grid-cols-2">
            {aiSuggestions.map((suggestion) => (
              <li key={suggestion} className="flex items-start gap-3 text-base text-slate-100">
                <span aria-hidden className="mt-1 text-emerald-300">
                  •
                </span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
