'use client';

interface LiveStreamProps {
  streamUrl: string;
}

function getEmbedUrl(url: string): string | null {
  if (!url) return null;

  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=0`;
  }

  // YouTube live
  const ytLiveMatch = url.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/);
  if (ytLiveMatch) {
    return `https://www.youtube.com/embed/${ytLiveMatch[1]}?autoplay=1`;
  }

  // Facebook video
  if (url.includes('facebook.com') || url.includes('fb.watch')) {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&autoplay=true&width=800`;
  }

  // Direct URL (HLS, MP4, etc.) — return as-is for video tag
  return url;
}

function isDirectStream(url: string): boolean {
  return url.endsWith('.m3u8') || url.endsWith('.mp4') || url.endsWith('.webm') || url.startsWith('rtmp');
}

export default function LiveStream({ streamUrl }: LiveStreamProps) {
  if (!streamUrl) {
    return (
      <div className="w-full aspect-video bg-gray-900 rounded-xl flex flex-col items-center justify-center border border-gray-800">
        <span className="text-5xl mb-4">📺</span>
        <p className="text-gray-400 text-lg font-semibold">No Live Stream Available</p>
        <p className="text-gray-600 text-sm mt-1">Stream will appear here when available</p>
      </div>
    );
  }

  const embedUrl = getEmbedUrl(streamUrl);

  if (!embedUrl) {
    return (
      <div className="w-full aspect-video bg-gray-900 rounded-xl flex items-center justify-center border border-gray-800">
        <p className="text-gray-500">Invalid stream URL</p>
      </div>
    );
  }

  if (isDirectStream(streamUrl)) {
    return (
      <div className="w-full aspect-video rounded-xl overflow-hidden border border-red-900/30">
        <video
          className="w-full h-full object-cover"
          src={streamUrl}
          autoPlay
          controls
          playsInline
        />
      </div>
    );
  }

  return (
    <div className="w-full aspect-video rounded-xl overflow-hidden border border-red-900/30 relative">
      <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-red-600/90 text-white text-xs font-bold px-2 py-1 rounded">
        <span className="live-indicator">●</span> LIVE
      </div>
      <iframe
        src={embedUrl}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="E-Sabong Live Stream"
      />
    </div>
  );
}
