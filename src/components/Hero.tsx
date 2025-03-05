import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import '../index.css';

const Hero = () => {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const videoRef = useRef(null);
  const videoPath = "/media/ParalaxAnime.mp4";
  const placeholderPath = "/media/PlaceholderVid.webp";
  
  // Preload the video
  useEffect(() => {
    const preloadLink = document.createElement('link');
    preloadLink.rel = 'preload';
    preloadLink.as = 'fetch';
    preloadLink.href = videoPath;
    document.head.appendChild(preloadLink);
    
    // Clean up
    return () => {
      if (document.head.contains(preloadLink)) {
        document.head.removeChild(preloadLink);
      }
    };
  }, []);

  // Handle video playback issues
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    // Monitor and restart video if paused unexpectedly
    const checkPlayback = () => {
      if (videoElement.paused && isVideoLoaded) {
        videoElement.play().catch(err => console.log('Auto-play failed:', err));
      }
    };

    // Set up event listeners for potential playback interruptions
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkPlayback();
      }
    };

    const handleResize = () => {
      // Debounce the resize event to prevent excessive checks
      clearTimeout(window.resizeTimer);
      window.resizeTimer = setTimeout(checkPlayback, 200);
    };

    const handleFocus = () => checkPlayback();

    // Check periodically if video is playing
    const playbackInterval = setInterval(checkPlayback, 5000);

    // Add all event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('resize', handleResize);
    window.addEventListener('focus', handleFocus);
    videoElement.addEventListener('pause', checkPlayback);
    
    // Clean up event listeners
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

  // Handle initial load and play
  const handleVideoLoaded = () => {
    const video = videoRef.current;
    if (video) {
      // Ensure video plays after loading
      video.play()
        .then(() => {
          setIsVideoLoaded(true);
        })
        .catch(err => {
          console.log('Initial play failed:', err);
          // Still mark as loaded, just without autoplay
          setIsVideoLoaded(true);
        });
    }
  };

  return (
    <div className="relative w-full">
      {/* Hero Section */}
      <section className="relative w-full h-screen">
        {/* Background Container */}
        <div className="absolute inset-0 w-full h-full overflow-hidden bg-black">
          {/* WebP Placeholder Image */}
          <img
            src={placeholderPath}
            alt="Video placeholder"
            className="absolute top-0 left-0 w-full h-full object-cover object-[80%_100%]"
            style={{ display: isVideoLoaded ? 'none' : 'block' }}
          />
          
          {/* Video that replaces the placeholder when loaded */}
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
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40  border-b border-b-[#4ef1d6] " />
        </div>

        {/* Hero Content */}
        <div className="relative h-full max-w-[100rem] mx-auto  px-4 sm:px-6 lg:px-8 flex items-end pb-20 z-10">
          <div className="w-full flex flex-col  justify-between items-center lg:items-start">
            {/* Text + Arrow Container */}
            <div className="flex flex-col  items-center text-center lg:text-left lg:items-start space-y-8 lg:space-y-4 ">
              <div>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="tilt-neon5 bg-clip-text text-[#4ef1d6] drop-shadow-[0_0_8px_#4ef1d6]"
                >
                  Discover Anime
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="tilt-neon2 text-white"
                >
                  Explore your favorite genres and find new series to watch
                </motion.p>
              </div>

              {/* Scroll Arrow */}
              <motion.button
                onClick={() => {
                  document.getElementById('topAnime')?.scrollIntoView({ behavior: 'smooth' });
                }}
                whileHover={{ scale: 1.1 }}
                className="items-start"
                aria-label="Scroll to content"
              >
                <div className="cyberpunk-neon-btn ">
                <span>View</span>
                <ArrowDown className="w-4 h-4 lg:w-6 lg:h-6" />
                </div>
              </motion.button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Hero;
