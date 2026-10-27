import type { Metadata } from 'next';
import { requireCrew } from '@/lib/session';
import SiteBar from '@/components/site/SiteBar';
import CrewPortal from '@/components/crew/CrewPortal';
import CrewGate from '@/components/crew/CrewGate';

export const dynamic = 'force-dynamic';

// Private page: never indexed, and every request re-checks the session.
export const metadata: Metadata = { title: 'Crew Dashboard', robots: { index: false, follow: false } };

export default async function CrewPage() {
  const crew = await requireCrew();
  return (
    <>
      <SiteBar />
      <main className="relative min-h-[70vh]">
        {crew ? (
          <CrewPortal crewId={crew.id} />
        ) : (
          <div className="px-5 pt-14 pb-20">
            <CrewGate title="Crew login" intro="Log in to follow your application and read messages from the team, or create a crew account." />
          </div>
        )}
      </main>
    </>
  );
}
