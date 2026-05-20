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
    <main className="relative min-h-screen overflow-hidden bg-[#05070d] text-white">
      <div className="pointer-events-none absolute inset-0 metal-grid opacity-35" aria-hidden="true" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[26rem] w-[min(42rem,calc(100vw-2rem))] -translate-x-1/2 rounded-full bg-[#8dbdff]/18 blur-[120px]" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[24rem] w-[min(32rem,calc(100vw-2rem))] rounded-full bg-slate-400/10 blur-[120px]" aria-hidden="true" />

      <header className="relative z-10 border-b border-white/10 bg-[#05070d]/80 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 text-sm font-black tracking-[0.18em] text-white">
            <span className="relative h-11 w-11 drop-shadow-[0_0_18px_rgba(141,189,255,0.28)]">
              <Image src="/brand/nexcall-mark-transparent.png" alt="" fill sizes="44px" className="object-contain" />
            </span>
            NEXCALL
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 bg-white/6 px-4 py-2 text-sm font-black text-white shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-blue-300/20"
          >
            <span className="hidden sm:inline">Back to Website</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </nav>
      </header>

      <section className={`relative z-10 mx-auto px-4 py-14 sm:px-6 lg:px-8 lg:py-20 ${maxWidthClassName}`}>
        {eyebrow ? (
          <p className="inline-flex rounded-full border border-white/15 bg-white/7 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#8dbdff]">
            {eyebrow}
          </p>
        ) : null}
        {title ? (
          <h1 className="mt-6 text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
            {title}
          </h1>
        ) : null}
        {summary ? (
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            {summary}
          </p>
        ) : null}
        {actions ? <div className="mt-8 flex flex-wrap gap-3">{actions}</div> : null}
        <div className={contentClassName}>{children}</div>
      </section>

      <footer className="relative z-10 border-t border-white/10 bg-black/20 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="relative h-9 w-9 drop-shadow-[0_0_14px_rgba(141,189,255,0.24)]">
              <Image src="/brand/nexcall-mark-transparent.png" alt="" fill sizes="36px" className="object-contain" />
            </span>
            <p className="max-w-xl">
              NexCall gives businesses AI receptionist coverage with clean handoffs to real people when needed.
            </p>
          </div>
          <div className="flex flex-col gap-2 font-bold text-slate-200 sm:flex-row sm:items-center sm:gap-5">
            <a className="transition hover:text-white" href={`mailto:${nexcallPublicContact.email}`}>
              {nexcallPublicContact.email}
            </a>
            <a className="transition hover:text-white" href={nexcallPublicContact.phoneHref}>
              {nexcallPublicContact.phone}
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
