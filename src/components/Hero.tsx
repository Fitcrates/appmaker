import { useState, useEffect, useRef } from 'react';
import { HashLink } from 'react-router-hash-link';
import '../index.css';

const Hero = () => {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const videoRef = useRef(null);
  const videoPath = "/media/ParalaxAnime.mp4";
  const placeholderPath = "/media/PlaceholderVid.webp";
  
  // Preload assets
  useEffect(() => {
    // Only preload the placeholder image
    const preloadImage = document.createElement('link');
    preloadImage.rel = 'preload';
    preloadImage.as = 'image';
    preloadImage.href = placeholderPath;
    preloadImage.type = 'image/webp';
    document.head.appendChild(preloadImage);
    
    // Clean up
    return () => {
      document.head.removeChild(preloadImage);
    };
  }, []);

  // Handle video playback issues
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const checkPlayback = () => {
      if (videoElement.paused && isVideoLoaded) {
        videoElement.play().catch(err => console.log('Auto-play failed:', err));
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkPlayback();
      }
    };

    const handleResize = () => {
      clearTimeout(window.resizeTimer);
      window.resizeTimer = setTimeout(checkPlayback, 200);
    };

    const handleFocus = () => checkPlayback();
    const playbackInterval = setInterval(checkPlayback, 5000);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('resize', handleResize);
    window.addEventListener('focus', handleFocus);
    videoElement.addEventListener('pause', checkPlayback);
    
    return () => {
      clearInterval(playbackInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('focus', handleFocus);
      if (videoElement) {
        videoElement.removeEventListener('pause', checkPlayback);
      }
    };
  }, [isVideoLoaded]);

  const handleVideoLoaded = () => {
    const video = videoRef.current;
    if (video) {
      video.play()
        .then(() => setIsVideoLoaded(true))
        .catch(() => setIsVideoLoaded(true));
    }
  };

  const handleVideoError = () => {
    console.warn('Video loading failed, falling back to placeholder');
    setIsVideoLoaded(false);
  };

  return (
    <div className="relative w-full">
      <section className="relative w-full h-screen">
        <div className="absolute inset-0 w-full h-full overflow-hidden bg-black">
          {/* Optimized WebP Placeholder */}
          <img
            src={placeholderPath}
            alt="Video placeholder"
            className="absolute top-0 left-0 w-full h-full object-cover object-[80%_100%]"
            style={{ display: isVideoLoaded ? 'none' : 'block' }}
            width="1920"
            height="1080"
            loading="eager"
            decoding="sync"
          />
          
          {/* Optimized Video */}
          <video
            ref={videoRef}
            className={`absolute top-0 left-0 w-full h-full object-cover object-[80%_100%] transition-opacity duration-500 ${
              isVideoLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            src={videoPath}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onCanPlay={handleVideoLoaded}
            onError={handleVideoError}
          />
          
          <div className="absolute inset-0 bg-black/40 border-b border-b-[#4ef1d6]" />
        </div>

        <div className="relative h-full max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 flex items-end pb-20 z-10">
          <div className="w-full flex flex-col justify-between items-center lg:items-start">
            <div className="flex flex-col items-center text-center lg:text-left lg:items-start space-y-8 lg:space-y-4">
              <div>
                <h1 className="tilt-neon5 bg-clip-text text-[#4ef1d6] drop-shadow-[0_0_8px_#4ef1d6] leading-[1] text-4xl md:text-5xl lg:text-6xl font-bold">
                  Discover Anime
                </h1>
                <p className="tilt-neon2 text-white text-lg md:text-xl mt-4">
                  Explore your favorite genres and find new series to watch
                </p>
              </div>

              <HashLink 
                to="/genres#exploreAnime" 
                className="flex flex-col md:flex-row gap-2 px-8 py-3 cyberpunk-neon-btn text-white -mt-8 md:mt-0"
                scroll={(el) => {
                  setTimeout(() => {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 100);
                }}
              >
                <span>Search</span>
              </HashLink>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Hero;
