import type { Metadata } from 'next';
import Link from 'next/link';
import { getSeo, pageMetadata } from '@/lib/seo';

const SERVICES = [
  ['digital-marketing', 'Digital Marketing', 'Social media content, creative campaigns and practical digital marketing support.'],
  ['website-development', 'Website Development', 'Responsive websites for small businesses, service providers and creators.'],
  ['ai-video-creation', 'AI Video Creation', 'AI-assisted concepts and promotional video content.'],
  ['video-editing', 'Video Editing', 'Reels, business promotions, event highlights and creator videos.'],
  ['graphic-logo-design', 'Graphic and Logo Design', 'Brand identity, logos, posters and promotional graphics.'],
  ['videography-and-event-shoots', 'Videography and Event Shoots', 'Selected business shoots, events and special occasions.'],
  ['vehicle-delivery-shoots', 'Vehicle Delivery Shoots', 'Vehicle handover photos and short videos.'],
  ['content-and-script-writing', 'Content and Script Writing', 'Content ideas, captions and scripts for promotional videos.'],
  ['political-and-public-events', 'Political and Public Event Coverage', 'Video coverage and edits for public meetings and events.'],
] as const;

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getSeo(), {
    path: '/services',
    title: 'Creative & Digital Services in Thanjavur | Medwin Montage',
    description: 'Explore budget-friendly digital marketing, website development, AI video creation, video editing, videography, logo design, posters, scripts and event shoots from Medwin Montage.',
  });
}

export default function ServicesPage() {
  return (
    <main className="min-h-screen py-14 sm:py-20">
      <div className="container-x">
        <p className="eyebrow mb-4">MEDWIN MONTAGE</p>
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl mb-5">Creative &amp; Digital Services</h1>
        <p className="lede max-w-3xl mb-10">Budget-conscious creative and digital support for businesses, creators, events and individuals in Thanjavur and nearby areas. Choose a service or request a quote tailored to your requirements.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SERVICES.map(([slug, title, description]) => (
            <article className="card card-hover p-6" key={slug}>
              <h2 className="font-display font-bold text-xl mb-3">{title}</h2>
              <p className="text-muted mb-5">{description}</p>
              <Link className="underline underline-offset-4 font-semibold" href={`/services/${slug}`}>Explore service</Link>
            </article>
          ))}
        </div>
        <p className="text-muted mt-10">Every project is quoted according to scope, timing, location and deliverables. Contact us to discuss your budget before confirming a booking.</p>
      </div>
    </main>
  );
}
