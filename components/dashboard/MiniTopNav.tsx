'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Check, Link2 } from 'lucide-react';

interface MiniTopNavProps {
  title: string;
  communityLink?: string;
  className?: string;
}

export default function MiniTopNav({
  title,
  communityLink = "https://ozza.com/coach/john-doe",
  className = ''
}: MiniTopNavProps) {
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Hide after scrolling down 100px
      setIsVisible(scrollY < 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(communityLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={`sticky top-3 z-20 mb-6 transition-all duration-300 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
    } ${className}`}>
      <div className="rounded-lg bg-gradient-to-r from-white/8 via-white/5 to-white/8 backdrop-blur-xl shadow-2xl">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-400">
              {title}
            </h2>
            
            <button
              onClick={handleCopyLink}
              className="group relative inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold text-emerald-300 hover:text-cyan-200 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 border border-emerald-400/30 hover:border-cyan-400/50 shadow-lg hover:shadow-emerald-500/25 transition-all duration-300"
            >
              <span className="absolute inset-0 scale-75 rounded-lg bg-white/10 opacity-0 transition ease-out group-hover:scale-100 group-hover:opacity-100 group-active:scale-105 group-active:bg-white/20" />
              {copied ? (
                <>
                  <Check className="relative w-4 h-4 text-cyan-400" />
                  <span className="relative text-cyan-400 font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="relative w-4 h-4" />
                  <span className="relative">Community Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}