import ThemeToggle from './ThemeToggle';
import Icon from './Icon';
import SiteBell from '@/components/notify/SiteBell';
import { BRAND_NAME, BRAND_TAGLINE, BRAND_MARK } from '@/lib/brand';

/** Compact top bar for pages other than the home page (crew form, customer portal). */
export default function SiteBar({ logoUrl, children }: { logoUrl?: string; children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-40 px-3 pt-3">
      <div className="nav-shell is-scrolled max-w-6xl mx-auto flex items-center justify-between gap-3 pl-3.5 pr-2.5 py-2.5">
        <a href="/" className="flex items-center gap-2.5 min-w-0" aria-label={`${BRAND_NAME} — home`}>
          <img src={logoUrl || BRAND_MARK} alt="" width={40} height={40} className="h-10 w-10 object-contain flex-shrink-0" />
          <span className="min-w-0 leading-none">
            <span className="block font-display font-extrabold text-[15px] tracking-tight whitespace-nowrap">{BRAND_NAME}</span>
            <span className="hidden min-[400px]:block mt-1 text-[10.5px] font-semibold text-muted whitespace-nowrap">{BRAND_TAGLINE}</span>
          </span>
        </a>
        <div className="flex items-center gap-2 flex-shrink-0">
          {children}
          <SiteBell />
          <ThemeToggle />
          <a href="/" className="btn btn-ghost btn-sm"><Icon name="home" /><span className="hidden sm:inline">Back to site</span></a>
        </div>
      </div>
    </header>
  );
}
