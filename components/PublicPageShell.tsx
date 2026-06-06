import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type PublicPageShellProps = {
  eyebrow?: string;
  title?: string;
  summary?: string;
  children: ReactNode;
  actions?: ReactNode;
  maxWidthClassName?: string;
  contentClassName?: string;
};

export const nexcallPublicContact = {
  email: "nexcall@proton.me",
  phone: "(202) 200-6578",
  phoneHref: "tel:+12022006578"
};

export function PublicPageShell({
  eyebrow,
  title,
  summary,
  children,
  actions,
  maxWidthClassName = "max-w-4xl",
  contentClassName = ""
}: PublicPageShellProps) {
  return (
    <main className="system-shell relative min-h-screen overflow-hidden text-[#172033]">
      <div className="pointer-events-none absolute inset-0 opacity-20" aria-hidden="true" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[24rem] w-[min(40rem,calc(100vw-2rem))] -translate-x-1/2 rounded-full bg-[#f0dfb8]/55 blur-[130px]" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[22rem] w-[min(30rem,calc(100vw-2rem))] rounded-full bg-[#dbeccf]/50 blur-[130px]" aria-hidden="true" />

      <header className="relative z-10 border-b border-[#d7d0c2] bg-[rgba(250,246,240,0.88)] backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 text-sm font-black tracking-[0.18em] text-[#172033]">
            <span className="brand-mark-shell relative h-11 w-11">
              <Image
                src="/brand/nexcall-mark-transparent.png"
                alt=""
                fill
                sizes="44px"
                className="brand-mark-img object-contain"
              />
            </span>
            NEXCALL
          </Link>
          <Link
            href="/"
            className="system-button-secondary inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-sm font-black shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:border-[#baff39]/30 hover:text-[#baff39] focus:outline-none focus:ring-4 focus:ring-[#baff39]/15"
          >
            <span className="hidden sm:inline">Back to Website</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </nav>
      </header>

      <section className={`relative z-10 mx-auto px-4 py-14 sm:px-6 lg:px-8 lg:py-20 ${maxWidthClassName}`}>
        {eyebrow ? (
          <p className="inline-flex rounded-full border border-[#baff39]/15 bg-[#baff39]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#baff39]">
            {eyebrow}
          </p>
        ) : null}
        {title ? (
          <h1 className="mt-6 text-4xl font-black leading-tight text-[#172033] sm:text-5xl lg:text-6xl">
            {title}
          </h1>
        ) : null}
        {summary ? (
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#4b5a67]">
            {summary}
          </p>
        ) : null}
        {actions ? <div className="mt-8 flex flex-wrap gap-3">{actions}</div> : null}
        <div className={contentClassName}>{children}</div>
      </section>

      <footer className="relative z-10 border-t border-[#d7d0c2] bg-[rgba(255,251,245,0.85)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 text-sm text-[#4b5a67] md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="brand-mark-shell relative h-9 w-9">
              <Image
                src="/brand/nexcall-mark-transparent.png"
                alt=""
                fill
                sizes="36px"
                className="brand-mark-img object-contain"
              />
            </span>
            <p className="max-w-xl">
              NexCall gives businesses calm call coverage with clean handoffs to real people when needed.
            </p>
          </div>
          <div className="flex flex-col gap-2 font-bold text-[#172033] sm:flex-row sm:items-center sm:gap-5">
            <a className="transition hover:text-[#5d8c2a]" href={`mailto:${nexcallPublicContact.email}`}>
              {nexcallPublicContact.email}
            </a>
            <a className="transition hover:text-[#5d8c2a]" href={nexcallPublicContact.phoneHref}>
              {nexcallPublicContact.phone}
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
