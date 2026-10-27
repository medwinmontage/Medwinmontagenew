import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/site/JsonLd';
import { getSeo, pageMetadata, siteBase } from '@/lib/seo';

const SERVICES = {
  'digital-marketing': {
    title: 'Digital Marketing',
    heading: 'Affordable Digital Marketing Services in Thanjavur',
    description: 'Practical digital marketing support for local businesses, creators and growing brands. Discuss social media content, video creatives, campaign planning and a budget that fits your goals.',
    meta: 'Affordable digital marketing services in Thanjavur for small businesses, creators and brands. Discuss social media content, creative campaigns and pricing with Medwin Montage.',
    keywords: ['digital marketing Thanjavur', 'digital marketing near me', 'social media marketing Thanjavur'],
    includes: ['Social media content planning', 'Creative videos and promotional posts', 'Campaign and content ideas', 'Flexible service options for different budgets'],
  },
  'website-development': {
    title: 'Website Development',
    heading: 'Website Development for Businesses and Creators',
    description: 'Get a website designed around your business goals, services and customers, with responsive layouts and clear enquiry paths.',
    meta: 'Website development for small businesses, service providers and creators in Thanjavur and across Tamil Nadu. Discuss your requirements and budget with Medwin Montage.',
    keywords: ['website development Thanjavur', 'website design for small business', 'freelance website developer Tamil Nadu'],
    includes: ['Business and portfolio websites', 'Responsive mobile-friendly layouts', 'Service, contact and enquiry sections', 'Project scope and quote based on requirements'],
  },
  'ai-video-creation': {
    title: 'AI Video Creation',
    heading: 'AI Video Creation for Brands and Promotions',
    description: 'Explore AI-assisted video concepts, visual storytelling and promotional content for businesses, creators and campaigns.',
    meta: 'AI video creation and AI-assisted promotional videos for businesses and creators in Thanjavur and Tamil Nadu. Ask Medwin Montage about suitable formats and pricing.',
    keywords: ['AI video creation Tamil Nadu', 'AI video creator Thanjavur', 'AI promotional videos'],
    includes: ['AI-assisted visual concepts', 'Short promotional video ideas', 'Social media-ready creative formats', 'Scope and pricing discussed before work begins'],
  },
  'video-editing': {
    title: 'Video Editing',
    heading: 'Professional Video Editing at a Budget-Friendly Price',
    description: 'Turn your footage into clear, engaging videos for social media, business promotions, events and personal projects.',
    meta: 'Video editing services in Thanjavur for reels, business promotions, event highlights and creator content. Ask Medwin Montage for a quote based on your footage and editing needs.',
    keywords: ['video editing Thanjavur', 'affordable video editor', 'reels editing Tamil Nadu'],
    includes: ['Reels and short-form video editing', 'Titles, transitions and text overlays', 'Colour and audio finishing where appropriate', 'Edits planned to match the brief and deadline'],
  },
  'graphic-logo-design': {
    title: 'Graphic and Logo Design',
    heading: 'Graphic Design, Posters and Logo Design',
    description: 'Consistent visual design for business identity, digital promotions, social posts, posters and event announcements.',
    meta: 'Graphic design, logo design and poster design in Thanjavur for businesses, events, creators and social media campaigns. Request a quote from Medwin Montage.',
    keywords: ['logo design Thanjavur', 'graphic designing near me', 'poster design Thanjavur'],
    includes: ['Logo and brand identity concepts', 'Promotional posters and social media graphics', 'Event and announcement creatives', 'Design direction based on your brand and audience'],
  },
  'videography-and-event-shoots': {
    title: 'Videography and Event Shoots',
    heading: 'Videography and Event Shoot Services',
    description: 'Plan video coverage for suitable business events, special occasions, promotional shoots and selected local assignments.',
    meta: 'Videography and event shoot services in Thanjavur and nearby areas. Discuss event coverage, deliverables, schedule and budget with Medwin Montage.',
    keywords: ['videography Thanjavur', 'event videography Thanjavur', 'special occasion video shoot'],
    includes: ['Business and promotional shoots', 'Selected special occasions and event highlights', 'Planning for shots and final deliverables', 'Availability and travel requirements confirmed before booking'],
  },
  'vehicle-delivery-shoots': {
    title: 'Vehicle Delivery Shoots',
    heading: 'Vehicle Delivery Photos and Video Shoots',
    description: 'Capture vehicle handovers and delivery moments with planned photos or short videos for customers, dealerships and social media.',
    meta: 'Vehicle delivery shoot and handover video services in Thanjavur. Contact Medwin Montage to confirm availability, coverage and pricing.',
    keywords: ['vehicle delivery shoot Thanjavur', 'car delivery video shoot', 'vehicle handover photography'],
    includes: ['Vehicle handover moments', 'Short delivery videos for social media', 'Shot planning based on location and time', 'Custom quote according to coverage and editing'],
  },
  'content-and-script-writing': {
    title: 'Content and Script Writing',
    heading: 'Content Ideas, Captions and Video Scripts',
    description: 'Get help planning clear content and scripts for business videos, promotional reels, explainers and social media posts.',
    meta: 'Content creation support, social media captions and video script writing for businesses and creators in Tamil Nadu. Discuss your project with Medwin Montage.',
    keywords: ['video script writing Tamil Nadu', 'social media content creation', 'promotional video script'],
    includes: ['Short-form video concepts', 'Reel and promotional scripts', 'Captions and content outlines', 'Messaging tailored to your audience and objective'],
  },
  'political-and-public-events': {
    title: 'Political and Public Event Coverage',
    heading: 'Political and Public Event Video Coverage',
    description: 'Discuss video coverage and post-production for public meetings, campaign events and community programmes, subject to availability and a clear brief.',
    meta: 'Political event and public meeting video coverage in Thanjavur and nearby areas. Confirm event details, schedule, deliverables and pricing with Medwin Montage.',
    keywords: ['political event videography Thanjavur', 'public meeting video coverage', 'campaign event video editing'],
    includes: ['Event coverage planning', 'Highlight edits and approved clips', 'Clear schedule and deliverable agreement', 'Availability and permissions confirmed before booking'],
  },
} as const;

type ServiceSlug = keyof typeof SERVICES;

export function generateStaticParams() {
  return Object.keys(SERVICES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!(slug in SERVICES)) return {};
  const service = SERVICES[slug as ServiceSlug];
  const seo = await getSeo();
  return pageMetadata(seo, {
    path: `/services/${slug}`,
    title: `${service.title} in Thanjavur | Medwin Montage`,
    description: service.meta,
  });
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!(slug in SERVICES)) notFound();
  const service = SERVICES[slug as ServiceSlug];
  const seo = await getSeo();
  const base = siteBase(seo);
  const url = `${base}/services/${slug}`;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title,
    serviceType: service.title,
    description: service.meta,
    url,
    provider: {
      '@type': 'ProfessionalService',
      name: seo.businessName || 'Medwin Montage',
      url: base,
      areaServed: [seo.city || 'Thanjavur', ...seo.serviceAreas].filter(Boolean),
    },
    areaServed: [seo.city || 'Thanjavur', ...seo.serviceAreas].filter(Boolean),
  };

  return (
    <main className="min-h-screen py-14 sm:py-20">
      <JsonLd data={[schema]} />
      <div className="container-x max-w-4xl">
        <p className="eyebrow mb-4">MEDWIN MONTAGE · FREELANCING CREATIVE &amp; DIGITAL SERVICES</p>
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl mb-6">{service.heading}</h1>
        <p className="lede max-w-3xl mb-8">{service.description}</p>
        <p className="text-muted mb-10">Budget-friendly options for small businesses, creators and individuals. Pricing depends on the project scope, time, location and deliverables. Share your requirements for a clear quote before booking.</p>

        <section className="card p-6 sm:p-8 mb-8" aria-labelledby="included-heading">
          <h2 id="included-heading" className="font-display font-bold text-2xl mb-5">How we can help</h2>
          <ul className="list-disc pl-6 space-y-3">
            {service.includes.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="font-display font-bold text-2xl mb-3">Serving Thanjavur and nearby areas</h2>
          <p className="text-muted">Medwin Montage works with clients on creative and digital projects in Thanjavur and, depending on the service and schedule, across Tamil Nadu and Kerala. Ask about remote services or local shoot availability before confirming.</p>
        </section>

        <div className="flex flex-wrap gap-3 mb-12">
          <Link className="btn btn-primary" href="/#services">Explore all services</Link>
          <Link className="btn btn-secondary" href="/#contact">Request a quote</Link>
        </div>

        <section className="border-t border-[var(--line)] pt-8">
          <h2 className="font-display font-bold text-2xl mb-4">More services</h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {Object.entries(SERVICES).filter(([key]) => key !== slug).map(([key, item]) => (
              <li key={key}><Link className="underline underline-offset-4" href={`/services/${key}`}>{item.title}</Link></li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
