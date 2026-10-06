import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Manrope } from 'next/font/google';
import { getSeo, baseMetadata } from '@/lib/seo';
import './globals.css';

const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-display', display: 'swap' });
const body = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-body', display: 'swap' });

// Site-wide defaults come from Admin → SEO Settings (falls back to built-in
// values if the database can't be reached, e.g. while building).
export async function generateMetadata(): Promise<Metadata> {
  return baseMetadata(await getSeo());
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#050505' },
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
  ],
};

// Runs before first paint, so the page never flashes the wrong theme.
// Order: the visitor's saved choice, otherwise their device setting.
// (The home page can additionally apply the admin's "default theme" — see page.tsx.)
const THEME_SCRIPT = `(function(){try{var d=document.documentElement;d.classList.add('js');var s=localStorage.getItem('theme');if(s!=='light'&&s!=='dark'){s=window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}d.setAttribute('data-theme',s);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
