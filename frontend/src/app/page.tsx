// src/app/page.tsx
import VideoUpload from '@/components/VideoUpload';
import VideoList from '@/components/video/VideoList';



export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">
          Video Analysis Platform
        </h1>
        <VideoUpload />
        <VideoList />
      </main>
    </div>
  );
}