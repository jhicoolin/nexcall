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

    /* Try #1: cache-bust. Works when old HTML serves stale chunk names.
       Use script tag hrefs as the build fingerprint (works in App Router). */
    var scripts=document.querySelectorAll('script[src*="_next/static"]');
    var buildKey='nc_heal_'+(scripts.length>0?scripts[0].src.slice(-12):'x');

    if(!sessionStorage.getItem(buildKey)){
      sessionStorage.setItem(buildKey,'1');
      var loc=window.location;
      window.location.replace(loc.pathname+'?_nc='+Date.now()+(loc.hash||''));
      return;
    }

    /* Try #2: Still broken after cache-bust — likely browser security
       (Firefox Enhanced Tracking Protection / NoScript / extension).
       Show a visible in-page notice with direct contact fallback. */
    if(document.getElementById('nc-js-notice'))return;
    var n=document.createElement('div');
    n.id='nc-js-notice';
    n.style.cssText='position:fixed;bottom:80px;right:16px;left:16px;z-index:9998;max-width:420px;margin:0 auto;background:#080e08;border:1px solid rgba(168,255,0,0.45);border-radius:14px;padding:18px 20px;font-family:system-ui,sans-serif;box-shadow:0 12px 40px rgba(0,0,0,0.65)';
    n.innerHTML='<p style="color:#A8FF00;font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;margin:0 0 8px">JavaScript blocked</p>'
      +'<p style="color:#f8fbff;font-size:14px;font-weight:600;margin:0 0 8px;line-height:1.5">Interactive features require JavaScript.</p>'
      +'<p style="color:#9CA3AF;font-size:13px;margin:0 0 14px;line-height:1.55">In Firefox: click the <strong style="color:#f8fbff">shield icon 🛡</strong> in the address bar and turn off Enhanced Tracking Protection for this site. Then reload.</p>'
      +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
      +'<a href="tel:+12022006578" style="background:#A8FF00;color:#000;font-size:13px;font-weight:800;padding:9px 16px;border-radius:7px;text-decoration:none;display:inline-flex;align-items:center;gap:6px">📞 Call us</a>'
      +'<a href="mailto:nexcall@proton.me" style="border:1px solid rgba(255,255,255,0.18);color:#f8fbff;font-size:13px;font-weight:600;padding:9px 14px;border-radius:7px;text-decoration:none">✉ Email</a>'
      +'<button onclick="document.getElementById(\'nc-js-notice\').remove()" style="border:1px solid rgba(255,255,255,0.1);background:transparent;color:#6B7280;font-size:12px;padding:9px 12px;border-radius:7px;cursor:pointer">Dismiss</button>'
      +'</div>';
    document.body.appendChild(n);
  }, 3000);

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
