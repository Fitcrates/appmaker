import React from 'react';
import { HashLink } from 'react-router-hash-link';
import { Telescope } from 'lucide-react';

const ExplorePointer = () => {
  return (
    <div id="explorePointer" className="relative py-24 w-full overflow-hidden">
      {/* Full SVG  with neon arrows */}
      <div className="absolute inset-0 w-full h-full">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 1400 500" 
          width="100%" 
          height="100%" 
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Background  */}
          <defs>
            <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            
            {/* Responsive viewBox for arrow positioning */}
            <symbol id="arrowLeft" viewBox="0 0 100 200">
              <polyline 
                points="20,50 70,100 20,150"
                fill="none"
                stroke="#ff13f0" 
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </symbol>
            
            <symbol id="arrowRight" viewBox="0 0 100 200">
              <polyline 
                points="80,50 30,100 80,150"
                fill="none"
                stroke="#ff13f0" 
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </symbol>
          </defs>
          
          {/* Background fill */}
          <rect width="1200" height="400" fill="url(#bgGradient)" />
          
          {/* Left side arrows with responsive positioning */}
          <g filter="url(#glow-left)" className="left-arrows">
            <use href="#arrowLeft" x="13%" y="0" width="12%" height="100%" opacity="1.0" />
            <use href="#arrowLeft" x="18%" y="0" width="12%" height="100%" opacity="0.9" />
          </g>
          
          {/* Right side arrows with responsive positioning */}
          <g filter="url(#glow-right)" className="right-arrows">
            <use href="#arrowRight" x="75%" y="0" width="12%" height="100%" opacity="1.0" />
            <use href="#arrowRight" x="70%" y="0" width="12%" height="100%" opacity="0.9" />
          </g>
          
          {/* Enhanced glow filters */}
          <defs>
            <filter id="glow-left" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feFlood floodColor="#ff13f0" floodOpacity="0.7" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            
            <filter id="glow-right" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feFlood floodColor="#ff13f0" floodOpacity="0.7" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>
      </div>
      
      {/* Content Section */}
      <div className="max-w-[100rem] mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center relative z-10">
        <div className="tilt-neonCustom bg-clip-text text-[#4ef1d6] drop-shadow-[0_0_8px_#4ef1d6] mb-8">
          <span className="hidden md:block">Transform the way</span> 
          <span className="hidden md:block">you discover anime</span>
          </div>
          
          <HashLink 
            to="/genres#exploreAnime" 
            className="flex  flex-col md:flex-row gap-2 px-8 py-3 cyberpunk-neon-btn text-white -mt-8 md:mt-0"
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
  );
};

export default ExplorePointer;