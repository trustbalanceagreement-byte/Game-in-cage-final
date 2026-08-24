import React from 'react';
import { Phone, Mail, Clock, Trophy, Zap } from 'lucide-react';
import { CAFE_INFO } from '../data';
import Logo from './Logo';

interface FooterProps {
  setTab: (tab: string) => void;
}

export default function Footer({ setTab }: FooterProps) {
  return (
    <footer className="bg-black border-t border-red-600/20 mt-24 relative overflow-hidden">
      {/* Structural subtle dot overlay */}
      <div className="absolute inset-0 opacity-[0.02] grid-overlay pointer-events-none" />
      
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20 grid grid-cols-1 md:grid-cols-12 gap-10">
        
        {/* Column 1: Info and Branding Description */}
        <div className="md:col-span-5 space-y-5">
          <div className="flex items-center gap-3">
            <Logo className="h-8 sm:h-10 max-w-[200px] sm:max-w-[240px] w-auto select-none opacity-90 hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-xs text-gray-400 font-sans leading-relaxed">
            Kalyani's premier tech-forward electronic e-arena. Features premium low-latency setups, high-octane multiplayer console hives, immersive high-motion VR decks, and artisanal focusfuels.
          </p>


        </div>

        {/* Column 2: Hours and Times */}
        <div className="md:col-span-3 space-y-4">
          <h5 className="font-display font-medium text-xs text-white uppercase tracking-[0.2em] flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-red-500" />
            <span className="font-sans font-normal">OPERATING TIMES</span>
          </h5>
          <ul className="space-y-3.5 text-[11px] font-mono text-gray-400">
            <li className="border-b border-white/[0.04] pb-2 justify-between flex">
              <span className="font-semibold text-gray-500">MON — SUN</span>
              <span className="text-white font-medium">10:00 AM — 11:00 PM</span>
            </li>
          </ul>

          {/* Social Media Links */}
          <div className="pt-2 space-y-2">
            <span className="font-mono text-[11px] text-gray-400 font-semibold tracking-[0.15em] uppercase block">FOLLOW US</span>
            <div className="flex items-center gap-2.5">
              <a 
                href={CAFE_INFO.facebook}
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2.5 rounded-md bg-[#1877F2]/10 border border-[#1877F2]/30 text-[#1877F2] hover:bg-[#1877F2] hover:text-white transition-all duration-300 group flex items-center justify-center"
                title="Follow us on Facebook"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>

              <a 
                href={CAFE_INFO.instagram}
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2.5 rounded-md bg-gradient-to-r from-[#833AB4]/10 via-[#FD1D1D]/10 to-[#FCB045]/10 border border-[#E1306C]/30 text-[#E1306C] hover:from-[#833AB4] hover:via-[#FD1D1D] hover:to-[#FCB045] hover:text-white transition-all duration-300 group flex items-center justify-center"
                title="Follow us on Instagram"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Column 3: Contact Core */}
        <div className="md:col-span-4 space-y-4">
          <ul className="space-y-3.5 text-[11px] font-mono text-gray-400 leading-relaxed">
            <li className="space-y-2 font-semibold uppercase">
              <a href={`tel:${CAFE_INFO.phone}`} className="flex items-center gap-1.5 hover:text-white text-red-500 transition-colors">
                <Phone className="h-3.5 w-3.5 text-red-500" />
                <span className="font-bold font-['Arial'] not-italic">{CAFE_INFO.phone}</span>
              </a>
              <a href={`mailto:${CAFE_INFO.email}`} className="flex items-center gap-1.5 hover:text-white transition-colors text-gray-400">
                <Mail className="h-3.5 w-3.5 text-red-500" />
                <span className="font-['Arial']">{CAFE_INFO.email}</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Signature High-Contrast Deep Crimson Footer strip */}
      <div className="bg-neutral-950 border-t border-red-950/50 flex flex-col md:flex-row items-center justify-between py-6 px-6 sm:px-12 text-gray-400 font-medium text-[10px] uppercase tracking-[0.2em] font-sans gap-4">
        <span className="hover:text-red-500 transition-colors duration-300">Crafting the next generation e-arena experience</span>
        <span className="text-gray-600">Kalyani &bull; West Bengal</span>
        <span>&copy; 2024 Game in Cage</span>
      </div>
    </footer>
  );
}
