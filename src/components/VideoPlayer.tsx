import React, { useEffect, useRef } from 'react';
import { X, Maximize, Minimize } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  onClose: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, title, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Function to get video ID from YouTube URL
  const getYouTubeVideoId = (url: string) => {
    // Try to get video ID from embed URL first
    const embedMatch = url.match(/embed\/([\w-]{11})/);
    if (embedMatch) return embedMatch[1];

    // Try other YouTube URL formats
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
    return match ? match[1] : '';
  };

  const videoId = getYouTubeVideoId(videoUrl);
  console.log('Video URL:', videoUrl);
  console.log('Video ID:', videoId);

  // Handle fullscreen
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Error attempting to toggle full-screen:', err);
    }
  };

  // Clean up iframe when component unmounts
  useEffect(() => {
    return () => {
      if (iframeRef.current) {
        iframeRef.current.src = '';
      }
    };
  }, []);

  if (!videoId) {
    console.error('Invalid YouTube URL:', videoUrl);
    return null;
  }

  // Preserve existing URL parameters and add our own
  const urlParams = new URLSearchParams(videoUrl.split('?')[1] || '');
  urlParams.set('autoplay', '1');
  urlParams.set('rel', '0');
  urlParams.set('modestbranding', '1');
  urlParams.set('iv_load_policy', '3');
  urlParams.set('enablejsapi', '1');

  const embedUrl = `https://www.youtube.com/embed/${videoId}?${urlParams.toString()}`;

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black rounded-lg overflow-hidden"
      style={{ 
        contain: 'strict',
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        minHeight: '60vh'
      }}
    >
      <iframe
        ref={iframeRef}
        src={embedUrl}
        title={title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
        style={{
          border: 'none',
          backgroundColor: 'black',
          contain: 'strict',
        }}
      />

      {/* Controls */}
      <div className="absolute top-4 right-4 flex items-center space-x-2 z-10">
        <button
          onClick={toggleFullscreen}
          className="p-2 text-white bg-black/50 rounded-full hover:bg-black/70 transition-colors"
          title="Toggle fullscreen"
        >
          {document.fullscreenElement ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>
        <button
          onClick={onClose}
          className="p-2 text-white bg-black/50 rounded-full hover:bg-black/70 transition-colors"
          title="Close"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};
