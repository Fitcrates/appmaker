import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Home, List, Calendar, Github, Star } from 'lucide-react';

export function Footer() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Navigation Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="flex items-center gap-2 hover:text-white transition-colors">
                  <Home className="h-4 w-4" />
                  Home
                </Link>
              </li>
              <li>
                <Link to="/genre" className="flex items-center gap-2 hover:text-white transition-colors">
                  <List className="h-4 w-4" />
                  Explore anime by genre
                </Link>
              </li>
              <li>
              <Link to="https://docs.api.jikan.moe/" className="flex items-center gap-2 hover:text-white transition-colors">
                  <List className="h-4 w-4" />
                  Featuring Jikan API
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => scrollToSection('top-anime')}
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <Star className="h-4 w-4" />
                  Top Anime
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('schedule')}
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <Calendar className="h-4 w-4" />
                  Schedule
                </button>
              </li>
            </ul>
          </div>

          {/* Search */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Search</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => {
                    const searchButton = document.querySelector('[aria-label="Search"]');
                    if (searchButton instanceof HTMLElement) {
                      searchButton.click();
                    }
                  }}
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <Search className="h-4 w-4" />
                  Search Anime
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Anime Search. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
