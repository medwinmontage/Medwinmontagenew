import type { Metadata } from 'next';
import SiteBar from '@/components/site/SiteBar';
import CrewForm from '@/components/site/CrewForm';
import CrewGate from '@/components/crew/CrewGate';
import { prisma } from '@/lib/prisma';
import { requireCrew } from '@/lib/session';
import { StatusBadge } from '@/components/ui/StatusTimeline';
import JsonLd from '@/components/site/JsonLd';
import { getSeo, pageMetadata, breadcrumbJsonLd, locationLabel } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeo();
  const where = locationLabel(seo);
  return pageMetadata(seo, {
    path: '/join-as-crew',
    title: 'Join as Crew',
    description: `Apply to work with ${seo.businessName} as a freelance videographer, photographer, editor, designer, developer or marketer${where ? ` in and around ${where}` : ''}.`,
  });
}

export default async function JoinAsCrewPage() {
  const [seo, crew] = await Promise.all([getSeo(), requireCrew()]);
  // Crew must be signed in to apply. Someone who already applied sees their application instead of the form.
  const application = crew ? await prisma.crewApplication.findFirst({ where: { crewAccountId: crew.id } }) : null;
  return (
    <>
      <SiteBar />
      <main className="relative">
        <div className="hero-bg" aria-hidden><div className="light light-a" /></div>
        <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-6 pt-12 pb-20">
          <nav aria-label="Breadcrumb" className="text-sm text-muted mb-6">
            <a href="/" className="link-plain">Home</a> <span aria-hidden>/</span> <span aria-current="page" className="text-ink-2">Join as Crew</span>
          </nav>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl tracking-[-0.03em] mb-4 rise">Join as Crew in Medwin Montage</h1>
          <p className="lede mb-9 rise" style={{ ['--i' as string]: 1 }}>
            {!crew ? 'Log in or create a crew account to apply. You will get updates about your application right here on the site.'
              : application ? 'You have already applied — here is where it stands.'
              : 'Fill in the form and we will get back to you. Fields marked * are required.'}
          </p>
          {!crew ? (
            <CrewGate title="Log in or register to apply" intro="One quick account, then the application form opens." />
          ) : application ? (
            <div className="card p-6 sm:p-8 text-center" role="status">
              <p className="text-xs font-bold text-muted mb-2">Application #{application.ref} · {application.role}</p>
              <div className="mb-5"><StatusBadge status={application.status === 'New' ? 'Applied' : application.status} /></div>
              <a href="/crew" className="btn btn-primary">Open my crew dashboard</a>
            </div>
          ) : (
            <CrewForm name={crew.name} phone={crew.phone} />
          )}
        </div>
      </main>
      {seo.structuredData && <JsonLd data={[breadcrumbJsonLd(seo, [{ name: 'Home', path: '/' }, { name: 'Join as Crew', path: '/join-as-crew' }])]} />}
    </>
  );
}
