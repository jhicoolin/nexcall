import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nexcall.one";
const title = "NexCall - Never Miss Your Next Call";
const description =
  "NexCall helps businesses answer calls, capture lead details, support appointment requests, and send clean next steps to the team 24/7.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "NexCall",
  title,
  description,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/brand/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
      { url: "/favicon.ico", sizes: "any" }
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  },
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title,
    description,
    url: "/",
    siteName: "NexCall",
    type: "website",
    images: [
      {
        url: "/brand/nexcall-og.png",
        width: 1200,
        height: 630,
        alt: "NexCall metallic N headset logo with AI receptionist positioning"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/brand/nexcall-og.png"]
  },
  appleWebApp: {
    title: "NexCall",
    capable: true,
    statusBarStyle: "black-translucent"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#020403"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        {/* Vanilla-JS fallback: if React fails to hydrate (broken extension,
            GPU driver, etc.) the buttons still do something useful.
            Runs in capture phase ONLY if no __reactFiber is attached. */}
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `(function(){
  function hasReact(el){
    try{return Object.keys(el).some(function(k){return k.indexOf('__react')===0});}
    catch(e){return false;}
  }

  /* ── Self-healing cache buster ──────────────────────────────────────
     If React fails to hydrate (stale cached HTML loads old JS chunks
     that 404), we detect it after 2.5 s and redirect to a fresh URL
     with a cache-busting query param. The browser treats /?_nc=XYZ as
     a brand-new URL, fetches fresh HTML from the server, loads current
     chunks, React hydrates, buttons work.

     sessionStorage key is scoped to the Next.js buildId so:
     - No infinite loop within the same build.
     - Re-tries automatically when a new build ships.
  ── ──────────────────────────────────────────────────────────────── */
  setTimeout(function(){
    var btn=document.querySelector('button');
    if(!btn||hasReact(btn))return; // React is fine, do nothing

    var buildId=(window.__NEXT_DATA__&&window.__NEXT_DATA__.buildId)||'x';
    var key='nc_heal_'+buildId;
    if(sessionStorage.getItem(key))return; // already tried this build

    sessionStorage.setItem(key,'1');
    // Navigate to a cache-busting URL so the browser fetches fresh HTML
    var loc=window.location;
    var fresh=loc.pathname+'?_nc='+Date.now()+(loc.hash||'');
    window.location.replace(fresh);
  }, 2500);

  /* ── Manual-click fallback (belt & suspenders) ──────────────────────
     If the self-heal hasn't fired yet and the user clicks a demo/
     checkout button before 2.5 s, send them to /?demo=1 immediately.
  ── ──────────────────────────────────────────────────────────────── */
  document.addEventListener('click',function(e){
    var t=e.target;
    var btn=t.closest&&(t.closest('a[data-fallback-href]')||t.closest('button[data-fallback-href]'));
    if(!btn||hasReact(btn))return;
    e.preventDefault();e.stopPropagation();
    window.location.href=btn.getAttribute('data-fallback-href');
  },true);
})();`
          }}
        />
      </body>
    </html>
  );
}
