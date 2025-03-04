/* AnimeCarousel.css */
.carousel-container {
  position: relative;
  width: 100%;
  height: 50vh; /* Consider a min-height value here */
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  overflow: hidden; /* Prevent content from spilling out */
}

.carousel {
  position: relative;
  width: 90%; 
  height: 100%; /* Match parent height */
  perspective: 700px;
  transform-style: preserve-3d;
}
.carousel-title {
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  pointer-events: none;
  height: 80%;
  width: 90%;
  max-width: 600px;
  display: flex;
  justify-content: center;
}
  
.cards-container {
  position: relative;
  width: 100%;
  height: 100%; 
  transform-style: preserve-3d;
  transform: rotateX(-0deg);
  animation: rotate 30s linear infinite;
}
  
  @keyframes rotate {
    0% {
      transform: rotateX(-15deg) rotateY(0deg);
    }
    100% {
      transform: rotateX(-15deg) rotateY(360deg);
    }
  }
  
  .card {
    position: absolute;
    width: 120px;
    height: 180px;
    left: calc(50% - 60px); /* Center more precisely */
    top: calc(37% - 100px); /* Center vertically */
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 5px 15px rgb(117, 11, 255);
    cursor: pointer;
    transform-style: preserve-3d;
    /* Added display flex to properly organize content */
    display: flex;
    flex-direction: column;
  }
  
  .card img {
    width: 100%;
    height: 85%; /* Reduced to make room for title */
    object-fit: cover;
    z-index: 4;
  }
  
  /* New styles for the movie title */
  .card .movie-title {
    width: 100%;
    min-height: 15%; /* Give some space for title */
    padding: 4px;
    background: transparent;
    color: rgb(255, 255, 255);
    font-size: 0.5rem;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    z-index: 5;
  }
  
  .card:hover {
    box-shadow: 0 0 20px rgb(47, 255, 238);
  }
  
  .pagination {
    position: absolute;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    color: white;
  }
  
  /* Responsive Breakpoints */
  
  /* Large Tablets */
  @media (max-width: 992px) {
    .carousel {
      width: 700px;
      height: 400px;
    }
    
    .carousel-title {
      width: 100%;
      max-width: 450px;
    }
    
    .card {
      width: 120px;
      height: 180px;
      left: calc(50% - 60px);
      top: calc(35% - 90px);
    }
  }
  
  /* Small Tablets */
  @media (max-width: 768px) {
    .carousel {
      width: 700px;
      height: 400px;
    }
    
    .carousel-title {
      width: 100%;
      max-width: 450px;
    }
    
    .card {
      width: 100px;
      height: 180px;
      left: calc(50% - 80px);
      top: calc(45% - 120px);
    }
    
    .card .movie-title {
      font-size: 9px;
    }
    
    .cards-container {
      transform: rotateX(-10deg);
    }
    
    @keyframes rotate {
      0% {
        transform: rotateX(-5deg) rotateY(0deg);
      }
      100% {
        transform: rotateX(-5deg) rotateY(360deg);
      }
    }
  }
  
  /* Large Smartphones */
@media (max-width: 576px) {
  .carousel {
    width: 90%;
    max-width: 200px;
    height: 400px;
    perspective: 1500px;
  }
  
  .carousel-title {
    width: 150%;
    max-width: 450px;
  }

  
  .card {
    width: 130px;
    height: 200px;
    left: calc(50% - 65px);
    top: calc(50% - 95px);
  }
  
  .card .movie-title {
    font-size: 10px;
    -webkit-line-clamp: 1;
    padding: 2px;
  }
  
  .cards-container {
    transform: rotateX(-45deg);
  }
}

/* Small Smartphones */
@media (max-width: 375px) {
  .carousel {
    height: 320px;
  }
  
  .carousel-title {
    width: 150%;
    max-width: 350px;
  }
  
  .card {
    width: 110px;
    height: 200px;
    left: calc(50% - 55px);
    top: calc(30% - 80px);
    border-radius: 6px;
  }
  
  .cards-container {
    transform: rotateX(-30deg);
  }
  
  .cards-container {
    animation: rotate 40s linear infinite;
  }
}
  
  /* Handle landscape orientation on mobile */
  @media (max-height: 500px) and (max-width: 900px) {
    .carousel {
      height: 70vh;
    }
    
    .card {
      width: 120px;
      height: 180px;
      left: calc(50% - 60px);
      top: calc(50% - 90px);
    }
    
    .carousel-title {
      font-size: 6rem;
    }
  }
  
  /* Loading and error states */
  .loading-text, .error-text {
    font-size: 1.5rem;
    color: white;
    text-align: center;
  }
