import { prisma } from '@/lib/prisma';
import { ModalProvider } from '@/components/site/ModalContext';
import Header from '@/components/site/Header';
import Hero from '@/components/site/Hero';
import Who from '@/components/site/Who';
import About from '@/components/site/About';
import ServicesGrid from '@/components/site/ServicesGrid';
import PortfolioGrid from '@/components/site/PortfolioGrid';
import PackagesGrid from '@/components/site/PackagesGrid';
import Testimonials from '@/components/site/Testimonials';
import Faq from '@/components/site/Faq';
import Footer from '@/components/site/Footer';
import OfferModal from '@/components/site/OfferModal';
import BannerCarousel from '@/components/site/BannerCarousel';
import CrewSection from '@/components/site/CrewSection';
import Showreel from '@/components/site/Showreel';
import JsonLd from '@/components/site/JsonLd';
import LiveRefresh from '@/components/ui/LiveRefresh';
import type { Metadata } from 'next';
import { getSeo, pageMetadata, homeJsonLd, locationLabel } from '@/lib/seo';
import { bannerState } from '@/lib/links';
import BookingModal from '@/components/site/BookingModal';
import WizardModal from '@/components/site/WizardModal';
import QuoteModal from '@/components/site/QuoteModal';
import AccountModal from '@/components/site/AccountModal';

// Always fetch fresh from the database — this is what makes admin edits
// show up on the live site immediately, with no manual "publish"/cache-clear step.
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getSeo(), { path: '/' });
}

export default async function HomePage() {
  const [content, services, portfolio, packages, testimonials, faqs, eventTypes, offer, allBanners, reviews, videos, seo] = await Promise.all([
    prisma.siteContent.findUnique({ where: { id: 'singleton' } }),
    prisma.service.findMany({ where: { enabled: true }, orderBy: { order: 'asc' } }),
    prisma.portfolioItem.findMany({ where: { enabled: true }, orderBy: { order: 'asc' } }),
    prisma.package.findMany({ where: { enabled: true }, orderBy: { order: 'asc' } }),
    prisma.testimonial.findMany({ where: { enabled: true }, orderBy: { order: 'asc' } }),
    prisma.faq.findMany({ where: { enabled: true }, orderBy: { order: 'asc' } }),
    prisma.eventType.findMany({ where: { enabled: true }, orderBy: { order: 'asc' } }),
    prisma.offer.findFirst(),
    prisma.banner.findMany({ where: { enabled: true }, orderBy: { order: 'asc' } }),
    // Customer reviews an admin approved, where the customer agreed to public display.
    prisma.feedback.findMany({ where: { status: 'Approved', allowPublic: true }, orderBy: { createdAt: 'desc' }, include: { customer: { select: { name: true } } } }),
    prisma.video.findMany({ where: { enabled: true }, orderBy: { order: 'asc' } }),
    getSeo(),
  ]);

  if (!content) {
    return <div className="p-12 text-center text-muted">Run `npm run db:seed` to populate initial content.</div>;
  }

  const stats = (content.heroStats as { value: string; label: string }[]) || [];

  // The offer is never shown on page load. The header only gets a small gift
  // button (when there is something to show) that opens it on request.
  const offerLive = !!offer?.enabled && offer.endAt.getTime() > Date.now();
  const showOffer = offerLive || content.bookOfferEnabled;

  // Banners: expired ones are dropped here; upcoming ones are sent so they can
  // appear at their start time without a reload (the carousel re-checks the clock).
  const banners = allBanners.filter((b) => bannerState(b) !== 'EXPIRED').map((b) => ({
    id: b.id, name: b.name, imageUrl: b.imageUrl, mobileImageUrl: b.mobileImageUrl || '', altText: b.altText, linkType: b.linkType, linkUrl: b.linkUrl,
    enabled: b.enabled, timerEnabled: b.timerEnabled,
    startAt: b.startAt ? b.startAt.toISOString() : null, endAt: b.endAt ? b.endAt.toISOString() : null,
  }));

  const allReviews = [
    ...reviews.map((r) => ({ id: r.id, quote: r.text, name: r.customer?.name || 'Customer', role: 'Verified customer', rating: r.rating })),
    ...testimonials,
  ];

  // Local SEO, written as ordinary sentences from Admin → SEO Settings (nothing hidden, no keyword lists).
  const where = locationLabel(seo);
  const areas = Array.from(new Set([seo.city, ...seo.serviceAreas].filter(Boolean)));
  const areaLine = seo.localDescription
    || (where ? `Based in ${where}${seo.serviceAreas.length ? `, working with clients across ${seo.serviceAreas.join(', ')}` : ''}.` : '');
  const social = [content.socialInstagram, content.socialFacebook, content.socialYoutube, content.socialLinkedin, content.socialTwitter].filter(Boolean);

  // Admin → Site Settings → "Default theme for new visitors". Applied before
  // paint, and only for visitors who haven't picked a theme with the toggle.
  // "system" (or anything else) leaves the device preference set by layout.tsx.
  const defaultTheme = content.themeMode === 'light' || content.themeMode === 'dark' ? content.themeMode : null;

  return (
    <ModalProvider>
      {defaultTheme && (
        <script
          dangerouslySetInnerHTML={{ __html: `try{var s=localStorage.getItem('theme');if(s!=='light'&&s!=='dark')document.documentElement.setAttribute('data-theme','${defaultTheme}')}catch(e){}` }}
        />
      )}
      <a href="#main" className="btn btn-primary fixed left-3 top-3 z-[80] -translate-y-24 focus:translate-y-0">Skip to content</a>
      <Header showOffer={showOffer} offerLive={offerLive} logoUrl={content.logoUrl || undefined} />
      <main id="main">
        <Hero eyebrow={content.heroEyebrow} headline={content.heroHeadline} sub={content.heroSub} stats={stats} />
        <BannerCarousel banners={banners} />
        <hr className="divider" />
        <Who headline={content.whoHeadline} text={content.whoText} />
        <About />
        <ServicesGrid services={services} areaLine={areaLine} />
        <PortfolioGrid items={portfolio} />
        <Showreel videos={videos.map((v) => ({ id: v.id, title: v.title, caption: v.caption, source: v.source, url: v.url, posterUrl: v.posterUrl }))} />
        <PackagesGrid packages={packages} />
        <Faq items={faqs} />
        <CrewSection />
        <Testimonials items={allReviews} />
      </main>
      <Footer content={content as any} about={seo.businessDescription || undefined} serviceAreas={areas} />
      <BookingModal eventTypes={eventTypes} whatsappNumber={content.whatsappNumber || undefined} />
      <WizardModal services={services} whatsappNumber={content.whatsappNumber || undefined} />
      <QuoteModal />
      <AccountModal />
      <OfferModal
        offer={offer ? { enabled: offer.enabled, text: offer.text, url: offer.url, endAt: offer.endAt.toISOString() } : null}
        bookOfferEnabled={content.bookOfferEnabled}
      />
      <JsonLd
        data={homeJsonLd(seo, {
          phone: content.contactPhone, email: content.contactEmail, address: content.contactAddress, sameAs: social,
          logo: content.logoUrl || '/icon.png',
          services: services.map((s) => ({ title: s.title, desc: s.desc })),
          faqs: faqs.map((f) => ({ question: f.question, answer: f.answer })),
        })}
      />
      {/* Re-renders this page when an admin changes banners, content, SEO or reviews. */}
      <LiveRefresh topic="mm-public" pollMs={60000} />
    </ModalProvider>
  );
}
