import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Home",
};

export default function Home() {
  const statusInfo = {
    stable: { emoji: "🟢", label: "Stable" },
    static: { emoji: "📄", label: "Static Page" },
    broken: { emoji: "❌", label: "Broken" },
  } as const;
  type Status = keyof typeof statusInfo;

  const projects: Array<{
    title: string;
    description: string;
    icon: string;
    href: string;
    status: Status;
  }> = [
      {
        title: "BioChem Project",
        description: "Because school is important",
        icon: "👥",
        href: "/dna",
        status: "static",
      },
      {
        title: "Twitter",
        description: "A clone of Twitter, because everyone seems to do it these days",
        icon: "💬",
        href: "/twitter",
        status: "broken",
      },
      {
        title: "Careers",
        description: "Explore roles and opportunities",
        icon: "💼",
        href: "/careers",
        status: "static",
      },
      {
        title: "Sevodal",
        description: "Daily seven-letter puzzle challenge",
        icon: "🧪",
        href: "/sevodal",
        status: "stable",
      },
      {
        title: "Pong",
        description: "Classic arcade game built with Phaser",
        icon: "🏓",
        href: "/pong",
        status: "broken",
      },
      {
        title: "Slinko",
        description: "A classic Plinko game.",
        icon: "🕹️",
        href: "/slinko",
        status: "stable",
      },
      {
        title: "Asteroids",
        description: "Classic arcade game, but in space.",
        icon: "☄️",
        href: "/asteroid",
        status: "stable",
      },
      {
        title: "Digital Clock",
        description: "A clock with digits. No, the other kind of digits.",
        icon: "🕐",
        href: "/digital-clock",
        status: "stable",
      },
    ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#030617] via-[#061028] to-[#0a1b3d] text-slate-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-6 py-12 sm:px-10 lg:py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
          EthanHicks.com
        </p>
        <div className="flex flex-wrap gap-6 text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
          <a
            href="https://github.com/et-hicks"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 transition hover:text-slate-200"
          >
            GitHub
            <span className="flex items-center gap-1 text-xs tracking-[0.2em] text-slate-500">
              <span aria-hidden>↗</span>
            </span>
          </a>
          <a
            href="https://www.linkedin.com/in/ethan-m-hicks/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 transition hover:text-slate-200"
          >
            LinkedIn
            <span className="flex items-center gap-1 text-xs tracking-[0.2em] text-slate-500">
              <span aria-hidden>↗</span>
            </span>
          </a>
        </div>

        <div className="grid gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="space-y-6">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-500">
                Home
              </p>
              <h1 className="mt-2 text-5xl font-semibold text-white sm:text-6xl">
                Welcome
              </h1>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-300">
                {Object.entries(statusInfo).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span aria-hidden>{value.emoji}</span>
                    <span className="uppercase tracking-[0.15em] text-xs text-slate-400">
                      {value.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-5 text-base leading-relaxed">
              <p className="text-sky-300">
                My name is Ethan Hicks, and I am a Software Engineer.
                This is a website that I use to aggregate projects into a central location.
                Whether they are vibe-coded, unc coded, or simply static text, I use this space to play around.
              </p>
              <p className="text-sky-300">
                You can find projects to the left, with sarcastic descriptors of course.
                Most of the source code is on my github.
                My resume is on the careers page.
              </p>
              <p className="text-sky-300">
                The warrenty for all this software is as-is.
                Nothing here is garunteed to work.
                Please use the key up top to determine if you actually want to travel to that webpage.
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
                    <div className="ml-auto text-2xl" aria-label={statusInfo[project.status].label}>
                      <span aria-hidden>{statusInfo[project.status].emoji}</span>
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
