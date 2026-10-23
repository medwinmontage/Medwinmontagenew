import VideoManager from '@/components/admin/VideoManager';

export default function AdminVideosPage() {
  return (
    <div>
      <h2 className="font-display font-extrabold text-2xl sm:text-3xl mb-2">Videos</h2>
      <VideoManager />
    </div>
  );
}
