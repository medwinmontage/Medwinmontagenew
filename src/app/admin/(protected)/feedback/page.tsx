import FeedbackManager from '@/components/admin/FeedbackManager';

export default function AdminFeedbackPage() {
  return (
    <div>
      <h2 className="font-display font-extrabold text-2xl sm:text-3xl mb-2">Reviews / Feedback</h2>
      <p className="text-sm text-muted mb-5 max-w-[70ch]">Reviews customers send from their portal. Only approved reviews that the customer allowed to be public appear on the website.</p>
      <FeedbackManager />
    </div>
  );
}
