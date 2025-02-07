import React from 'react';
import Navbar from './Navbar';
import { Footer } from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <Navbar />
      <main className="flex-grow w-full min-w-full">
        {children}
      </main>
      <Footer />
    </div>
  );
}
