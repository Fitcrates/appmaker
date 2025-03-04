import React, { useState, useEffect, useRef } from 'react';
import TopMoviesCarusel from './TopMoviesCarusel';

const ParallaxWindow = ({ 
  videoSrc = '/media/ParalaxAnime.mp4', 
  width = screen.width, 
  height = screen.height,
  speed = 0.9, 
  lag = 0,
  autoPlay = true,
  muted = true,
  loop = true
}) => {
  const [offset, setOffset] = useState(0);
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Check if element is in viewport
      if (rect.top < windowHeight && rect.bottom > 0) {
        // Calculate how far element is from the center of viewport
        const scrollPosition = (rect.top + rect.height / 2 - windowHeight / 2) * speed;
        setOffset(scrollPosition);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial calculation
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [speed]);

  useEffect(() => {
    // Debug video loading
    if (videoRef.current) {
      videoRef.current.addEventListener('loadeddata', () => {
        console.log("Video loaded successfully!");
      });
      
      videoRef.current.addEventListener('error', (e) => {
        console.error("Video error:", e);
        setVideoError(true);
      });
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative overflow-hidden"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        clipPath: 'polygon(0 0%, 100% 0, 100% 100%, 0% 100%)',
        backgroundColor: 'backgroundMain', 
      }}
    >
      {videoError ? (
        <div className="absolute inset-0 flex items-center justify-center text-white">
          Error loading video: {videoSrc}
        </div>
      ) : (
        <video
          ref={videoRef}
          className="absolute w-full h-full object-cover"
          style={{
            transform: `translate(0px, ${offset}px)`,
            willChange: 'transform',
            transition: lag ? `transform ${lag}ms ease-out` : 'none',
          }}
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          playsInline
          width={width}
          height={height}
        >
          <source src={videoSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}
    </div>
  );
};

// Component to demonstrate usage
const ParallaxGallery = () => {
  return (
    
    
      
      <div className="flex justify-center bg-transparent">
        <div>

          <ParallaxWindow 
            videoSrc="/media/ParalaxAnime.mp4"
            width={screen.width}
            height={screen.height}
          />
         
        </div>
        
        <div>
    
        </div>
      </div>
    
  );
};

export default ParallaxGallery;