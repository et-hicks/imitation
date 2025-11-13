import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Home",
};

export default function Home() {
  const projects = [
    {
      title: "Twitter",
      description: "A clone of Twitter, because everyone seems to do it these days",
      icon: "💬",
      href: "/twitter",
    },
    {
      title: "BioChem Project",
      description: "Because school is important",
      icon: "👥",
      href: "/dna",
    },
    {
      title: "Careers",
      description: "Explore roles and opportunities",
      icon: "💼",
      href: "/careers",
    },
    {
      title: "Sevodal",
      description: "Daily seven-letter puzzle challenge",
      icon: "🧪",
      href: "/sevodal",
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#030617] via-[#061028] to-[#0a1b3d] text-slate-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-6 py-12 sm:px-10 lg:py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
          EthanHicks.com
        </p>

        <div className="grid gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="space-y-6">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-500">
                Home
              </p>
              <h1 className="mt-2 text-5xl font-semibold text-white sm:text-6xl">
                Welcome
              </h1>
            </div>

            <p className="text-lg text-slate-300">
              Subheading for description or instructions
            </p>

            <div className="space-y-5 text-base leading-relaxed">
              <p className="text-sky-300">
                Body text for your whole article or post. We&apos;ll put in some
                lorem ipsum to show how a filled-out page might look.
              </p>
              <p className="text-sky-300">
                Exceptetur efficient emerging, minim veniam anim aute carefully
                curated Ginza conversation exquisite perfect nostrud nisi,
                intricate content. Qui, international first-class nulla elit.
              </p>
              <p className="text-sky-300">
                Punctual adipisicing, essential lovely queen tempor eiusmod
                iurure. Exclusiva izakaya charming Scandinaviam impeccable aute,
                quality of life soft power pariatur Melbourne.
              </p>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-3xl font-semibold text-white">Projects</h2>

            <div className="space-y-4">
              {projects.map((project) => (
                <Link
                  key={project.title}
                  href={project.href}
                  className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-2xl"
                >
                  <article className="flex items-center gap-4 rounded-2xl border border-white/5 bg-[#f4f0ff0d] px-5 py-4 shadow-[0_15px_30px_rgba(15,23,42,0.35)] transition hover:-translate-y-0.5 hover:border-white/10 hover:bg-[#f4f0ff1a] hover:shadow-[0_18px_32px_rgba(15,23,42,0.45)] backdrop-blur">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-xl">
                      <span aria-hidden>{project.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-white">
                        {project.title}
                      </h3>
                      <p className="text-sm text-slate-300">
                        {project.description}
                      </p>
                    </div>
                    <div className="ml-auto flex items-center gap-2 text-white/50">
                      <span className="inline-block h-2 w-2 rounded-full bg-white/50" />
                      <span className="inline-block h-2 w-2 rounded-full bg-white/30" />
                      <span className="inline-block h-2 w-2 rounded-full bg-white/20" />
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
