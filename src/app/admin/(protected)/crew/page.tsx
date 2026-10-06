import CrewManager from '@/components/admin/CrewManager';

export default function AdminCrewPage() {
  return (
    <div>
      <h2 className="font-display font-extrabold text-2xl sm:text-3xl mb-2">Crew Applications</h2>
      <p className="text-sm text-muted mb-5 max-w-[70ch]">Applications from the &ldquo;Join as Crew&rdquo; page. Resumes are stored privately and can only be opened from here.</p>
      <CrewManager />
    </div>
  );
}
