import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Phone, Star, Smile, ShieldCheck, Award, Copy, Check, Navigation, Compass, Map, ExternalLink, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { CAFE_INFO } from '../data';
import heroBg1 from '../assets/images/cage_hero_real_atmosphere_1782152442632.jpg';
import heroBg2 from '../assets/images/cage_hero_red_white_perfect_1782150866449.jpg';
import gtaPoster from '../assets/images/regenerated_image_1785825766465.jpg';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface HomeViewProps {
  setTab: (tab: string) => void;
}

export default function HomeView({ setTab }: HomeViewProps) {
  // Clock state for dynamic Happy Hours status checker
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  // Dynamic Hero Slides from Admin section / Firestore
  const [heroSlides, setHeroSlides] = useState<string[]>([heroBg1, heroBg2]);
  const [failedSlides, setFailedSlides] = useState<Record<string, boolean>>({});
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<number>(1);
  const [isAutoPlayPaused, setIsAutoPlayPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Helper to reliably return active slide image with default fallbacks
  const getSlideSource = (index: number): string => {
    const rawSlide = heroSlides[index];
    const defaultSlide = index % 2 === 0 ? heroBg1 : heroBg2;
    if (!rawSlide || typeof rawSlide !== 'string' || rawSlide.trim() === '') {
      return defaultSlide;
    }
    if (failedSlides[rawSlide]) {
      return defaultSlide;
    }
    return rawSlide;
  };

  // Clipboard copy state
  const [copiedAddress, setCopiedAddress] = useState(false);

  const copyAddressToClipboard = () => {
    navigator.clipboard.writeText(CAFE_INFO.location);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  // Auto-clock effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Listen to admin-defined dynamic hero images (supports multi-slide array)
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'hero'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.heroImages && Array.isArray(data.heroImages) && data.heroImages.length > 0) {
          // Filter out empty or null items
          const validSlides = data.heroImages.filter((img: any) => img && typeof img === 'string' && img.trim() !== '');
          if (validSlides.length > 0) {
            setHeroSlides(validSlides);
          } else {
            setHeroSlides([heroBg1, heroBg2]);
          }
        } else if (data.heroImageUrl && typeof data.heroImageUrl === 'string' && data.heroImageUrl.trim() !== '') {
          setHeroSlides([data.heroImageUrl, heroBg2]);
        } else {
          setHeroSlides([heroBg1, heroBg2]);
        }
      } else {
        setHeroSlides([heroBg1, heroBg2]);
      }
    }, (err) => {
      console.warn("Could not load dynamic hero setting, using local bundle static assets:", err);
      setHeroSlides([heroBg1, heroBg2]);
    });
    return unsub;
  }, []);

  // Auto-slide transition effect (every 4.5s)
  useEffect(() => {
    if (heroSlides.length <= 1 || isAutoPlayPaused) return;

    const interval = setInterval(() => {
      setSlideDirection(1);
      setCurrentSlideIndex((prev) => (prev + 1) % heroSlides.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [heroSlides.length, isAutoPlayPaused, currentSlideIndex]);

  const handleNextSlide = () => {
    setSlideDirection(1);
    setCurrentSlideIndex((prev) => (prev + 1) % heroSlides.length);
  };

  const handlePrevSlide = () => {
    setSlideDirection(-1);
    setCurrentSlideIndex((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  // Touch Swipe Handlers for mobile users (Left to Right / Right to Left)
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    // Minimum swipe delta 40px
    if (diff > 40) {
      // Swiped left -> next photo
      handleNextSlide();
    } else if (diff < -40) {
      // Swiped right -> prev photo
      handlePrevSlide();
    }
    setTouchStartX(null);
  };

  // Slide animation variants
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0.3,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: 'spring', stiffness: 260, damping: 30 },
        opacity: { duration: 0.4 },
      },
    },
    exit: (dir: number) => ({
      x: dir < 0 ? '100%' : '-100%',
      opacity: 0,
      transition: {
        x: { type: 'spring', stiffness: 260, damping: 30 },
        opacity: { duration: 0.3 },
      },
    }),
  };

  // Determine current cafe open and happy hour status
  const currentHours = currentTime.getHours();
  // Open Hours: 10 AM (10) to 11 PM (23)
  const isOpenNow = currentHours >= 10 && currentHours < 23;
  // Happy Hour: 10 AM (10) to 2 PM (14)
  const isHappyHourNow = currentHours >= 10 && currentHours < 14;

  return (
    <div className="space-y-20 pb-10 relative">
      
      {/* 1. IMMERSIVE HERO SECTION WITH DUAL-PHOTO SLIDER & SWIPE SUPPORT */}
      <motion.section 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative overflow-hidden -mx-4 sm:-mx-6 md:-mx-8 lg:-mx-12 -mt-2 sm:-mt-4 w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] md:w-[calc(100%+4rem)] lg:w-[calc(100%+6rem)] min-h-[460px] sm:min-h-[520px] md:min-h-[580px] lg:min-h-[640px] flex items-center justify-center text-center shadow-2xl rounded-none bg-black select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => setIsAutoPlayPaused(true)}
        onMouseLeave={() => setIsAutoPlayPaused(false)}
      >
        {/* Animated Background Slider Container */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {/* Ambient blurred fill for active slide */}
          <img 
            src={getSlideSource(currentSlideIndex)} 
            alt="Ambiance backdrop" 
            className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-35 scale-110 select-none pointer-events-none transition-all duration-700"
            referrerPolicy="no-referrer"
            onError={() => {
              const currentUrl = heroSlides[currentSlideIndex];
              if (currentUrl) {
                setFailedSlides(prev => ({ ...prev, [currentUrl]: true }));
              }
            }}
          />

          {/* Sliding Photos with AnimatePresence */}
          <AnimatePresence initial={false} custom={slideDirection}>
            <motion.div
              key={currentSlideIndex}
              custom={slideDirection}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none"
            >
              {/* Crisp full-frame hero image */}
              <img 
                src={getSlideSource(currentSlideIndex)} 
                alt={`Game in Cage Arena Hero Slide ${currentSlideIndex + 1}`} 
                className="w-full h-full object-contain sm:object-cover object-center select-none pointer-events-none"
                referrerPolicy="no-referrer"
                onError={() => {
                  const currentUrl = heroSlides[currentSlideIndex];
                  if (currentUrl) {
                    setFailedSlides(prev => ({ ...prev, [currentUrl]: true }));
                  }
                }}
              />
            </motion.div>
          </AnimatePresence>

          {/* Minimal overlays for high contrast text readability */}
          <div className="absolute inset-0 z-20 bg-black/25 pointer-events-none" />
          <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-14 z-20 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
        </div>

        {/* Hero Navigation Controls (Left / Right Arrow buttons) */}
        {heroSlides.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrevSlide();
              }}
              aria-label="Previous Slide"
              className="absolute left-2 sm:left-4 z-40 p-2 sm:p-2.5 rounded-full bg-black/40 hover:bg-black/75 border border-white/20 hover:border-white/50 text-white/80 hover:text-white transition-all cursor-pointer shadow-lg backdrop-blur-sm active:scale-95 group"
            >
              <ChevronLeft className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNextSlide();
              }}
              aria-label="Next Slide"
              className="absolute right-2 sm:right-4 z-40 p-2 sm:p-2.5 rounded-full bg-black/40 hover:bg-black/75 border border-white/20 hover:border-white/50 text-white/80 hover:text-white transition-all cursor-pointer shadow-lg backdrop-blur-sm active:scale-95 group"
            >
              <ChevronRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Pagination Dots */}
            <div className="absolute bottom-4 left-0 right-0 z-40 flex items-center justify-center gap-2 pointer-events-auto">
              {heroSlides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSlideDirection(idx > currentSlideIndex ? 1 : -1);
                    setCurrentSlideIndex(idx);
                  }}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentSlideIndex 
                      ? 'w-7 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' 
                      : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Hero Content Center Overlay */}
        <div className="relative z-30 max-w-4xl px-4 sm:px-6 md:px-8 py-8 space-y-6 sm:space-y-8 flex flex-col items-center pointer-events-auto">
          {/* Subtitle description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-xs sm:text-sm md:text-base text-gray-100 max-w-2xl mx-auto leading-relaxed tracking-wide font-normal font-sans drop-shadow-md"
          >
            Kalyani's premier gaming destination where sophisticated comfort meets competitive entertainment.
          </motion.p>

          {/* CTA Primary Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.6 }}
            className="flex items-center justify-center gap-4 flex-wrap pt-2"
          >
            <button
              onClick={() => setTab('service')}
              className="px-8 py-3.5 bg-transparent hover:bg-white/10 border border-white/70 hover:border-white text-white font-sans font-bold text-xs uppercase tracking-widest rounded-lg transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            >
              Explore Games
            </button>
            <button
              onClick={() => setTab('book')}
              className="px-8 py-3.5 bg-transparent hover:bg-white/10 border border-white/70 hover:border-white text-white font-sans font-bold text-xs uppercase tracking-widest rounded-lg transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            >
              Book Now
            </button>
          </motion.div>

        </div>
      </motion.section>

      {/* 3. THE ABOUT SECTION */}
      <motion.section 
        id="about-section" 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden bg-white/[0.02] border border-white/[0.05] p-6 sm:p-12 rounded-2xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Grid Card block (Matrix info) */}
          <div className="lg:col-span-5 order-2 lg:order-1 relative bg-black p-6 rounded-2xl flex flex-col justify-between h-80 border-t-2 border-[#ef4444]">
            <div className="absolute inset-0 opacity-[0.01] grid-overlay pointer-events-none" />
            
            <div className="relative z-10 flex items-center justify-between">
              <span className="font-mono text-[9px] text-[#ef4444] font-semibold tracking-widest uppercase bg-[#ef4444]/10 px-2.5 py-0.5 rounded-full">
                VERIFIED ACCREDITATION
              </span>
              <Award className="h-4.5 w-4.5 text-[#ef4444]" />
            </div>

            <div className="relative z-10 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex gap-1 items-center">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="h-3.5 w-3.5 fill-[#ef4444] text-[#ef4444]" />
                  ))}
                </div>
                <a
                  href={CAFE_INFO.reviewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#ef4444] hover:bg-white text-black font-mono font-bold text-[9px] uppercase tracking-wider rounded-lg transition-all duration-300 hover:scale-105 shadow-md shadow-[#ef4444]/20 cursor-pointer"
                >
                  <Star className="h-2.5 w-2.5 fill-current" />
                  <span>Review Us</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
              <p className="font-display font-normal text-2xl text-white uppercase leading-tight">
                4.9 Google <br />
                User Score
              </p>
              <p className="font-mono text-[10px] text-gray-500 max-w-sm">
                Highest accredited gaming lounge in West Bengal. Click <strong className="text-white hover:text-[#ef4444] transition-colors"><a href={CAFE_INFO.reviewLink} target="_blank" rel="noopener noreferrer">Review Us</a></strong> to directly open our Google Business Profile map page and submit your rating!
              </p>
            </div>

            <div className="relative z-10 border-t border-white/[0.04] pt-3 flex justify-between items-center text-[9px] font-mono text-gray-500 font-bold uppercase tracking-wider">
              <span>District Coordinate</span>
              <span className="text-[#ef4444]">#741235_CAGE</span>
            </div>
          </div>

          {/* Right about text block */}
          <div className="lg:col-span-7 order-1 lg:order-2 space-y-6">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-[#ef4444] font-semibold">
              <span className="h-1.5 w-1.5 bg-[#ef4444] rounded-full" />
              <span>THE GAME IN CAGE EXPERIENCE</span>
            </div>
            
            <h3 className="font-sans font-light text-2xl sm:text-3xl text-white tracking-tight uppercase">
              A private, premium retreat for modern enthusiasts
            </h3>

            <p className="text-gray-400 font-sans text-xs leading-relaxed">
              {CAFE_INFO.aboutText}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex gap-3 items-start p-4 bg-black/30 border border-white/[0.04] rounded-xl">
                <div className="p-2 bg-[#ef4444]/10 rounded-lg text-[#ef4444] mt-0.5 shrink-0">
                  <ShieldCheck className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="font-sans font-semibold text-xs text-white uppercase tracking-wider">Soundproof Acoustic Cabins</h4>
                  <p className="text-[11px] text-gray-400 font-sans mt-1 leading-relaxed">High physical partitions guarantee screen isolation and robust concentration blocks.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start p-4 bg-black/30 border border-white/[0.04] rounded-xl">
                <div className="p-2 bg-white/[0.03] text-gray-400 rounded-lg mt-0.5 shrink-0">
                  <Smile className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="font-sans font-semibold text-xs text-white uppercase tracking-wider">Pristine Hygiene Standard</h4>
                  <p className="text-[11px] text-gray-400 font-sans mt-1 leading-relaxed">Vigorous professional cleaning sweeps of keycaps, monitors, and headphones after every customer session.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </motion.section>

      {/* GTA 5 SECTION */}
      <motion.section
        id="gta5-section"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden bg-white/[0.02] border border-white/[0.05] p-6 sm:p-12 rounded-2xl flex flex-col items-center text-center space-y-6"
      >
        <div className="max-w-3xl w-full space-y-4">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-[#ef4444] font-semibold">
            <span className="h-1.5 w-1.5 bg-[#ef4444] rounded-full animate-pulse" />
            <span>EXCLUSIVE CAGE GAMEPLAY</span>
          </div>
          
          <h3 className="font-sans font-light text-2xl sm:text-3xl text-white tracking-tight uppercase">
            Grand Theft Auto V
          </h3>
        </div>

        {/* Poster Image */}
        <div className="relative group overflow-hidden rounded-xl border border-white/10 max-w-2xl w-full shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 z-10 pointer-events-none" />
          <img 
            src={gtaPoster} 
            alt="GTA 5 Gaming Poster" 
            referrerPolicy="no-referrer"
            className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
          />
        </div>

        {/* Content beneath poster */}
        <div className="space-y-3">
          <h4 className="font-sans font-bold text-xl sm:text-2xl text-white uppercase tracking-wide text-shadow-red">
            Let's play GTA 5
          </h4>
          <p className="text-gray-400 font-sans text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
            What are you waiting for? Let's play together.
          </p>
        </div>
      </motion.section>

      {/* 2. LIVE HUB STATUS CARD TIMELINE */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="w-full"
      >
        {/* Dynamic Occupancy Status panel */}
        <div className="w-full bg-white/[0.02] border border-white/[0.05] p-6 sm:p-8 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="space-y-4">
            <span className="font-mono text-[#ef4444] text-[10px] font-semibold tracking-[0.2em] uppercase bg-[#ef4444]/5 px-2.5 py-1 border border-[#ef4444]/10 rounded-full">
              LIVE ARENA TELEMETRY
            </span>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h3 className="font-sans font-medium text-lg uppercase tracking-wider text-white">
                Active Operations Status
              </h3>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${isOpenNow ? 'bg-[#ef4444] animate-pulse' : 'bg-red-500'}`} />
                <span className="text-xs font-mono font-semibold tracking-wider uppercase text-gray-400">
                  {isOpenNow ? 'GRID CONNECTED' : 'SYSTEM STANDBY'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-black/45 p-4 border border-white/[0.04] rounded-xl space-y-1">
                <span className="block text-[9px] font-mono text-gray-500 uppercase tracking-wider">GATE SCHEDULE</span>
                <span className="block text-xs font-semibold text-white">10:00 AM — 11:00 PM Daily</span>
                <span className="block text-[9px] font-mono text-[#ef4444] uppercase tracking-wider">
                  {isOpenNow ? '• ACTIVE UNTIL 11:00 PM' : '• CLOSED (Opens 10:00 AM)'}
                </span>
              </div>

              <div className="bg-black/45 p-4 border border-white/[0.04] rounded-xl space-y-1">
                <span className="block text-[9px] font-mono text-gray-500 uppercase tracking-wider">HAPPY HOUR BONUS</span>
                <span className="block text-xs font-semibold text-white">10:00 AM — 2:00 PM Daily</span>
                <span className="block text-[9px] font-mono uppercase tracking-wider text-[#ef4444]">
                  {isHappyHourNow ? '• 25% DISCOUNT ACTIVATED' : '• ENGAGES DAILY AT 10:00 AM'}
                </span>
              </div>
            </div>

          </div>
        </div>
      </motion.section>

      {/* 4. CAGE GEOLOCATION & MAP NAVIGATION */}
      <motion.section
        id="map-navigation-section"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden bg-white/[0.02] border border-white/[0.05] p-6 sm:p-12 rounded-2xl space-y-8"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/[0.04] pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-[#ef4444] font-semibold mb-2">
              <span className="h-1.5 w-1.5 bg-[#ef4444] rounded-full animate-pulse" />
              <span>SATELLITE ROUTING GRID</span>
            </div>
            <h3 className="font-['Arial'] font-bold text-[21px] leading-[28px] text-white tracking-tight uppercase">
              Arena Map Navigation
            </h3>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">COORDINATES:</span>
            <span className="font-mono text-xs text-[#ef4444] font-semibold bg-[#ef4444]/5 px-3 py-1.5 border border-[#ef4444]/10 rounded-lg">
              22.9751° N, 88.4345° E
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Interactive Map Embed */}
          <div className="lg:col-span-7 bg-black/60 rounded-xl border border-white/[0.05] p-3 flex flex-col h-[350px] sm:h-[480px] relative overflow-hidden group shadow-inner">
            <div className="absolute top-5 left-5 z-10 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2 pointer-events-none">
              <Compass className="h-3.5 w-3.5 text-[#ef4444] animate-spin-slow" />
              <span className="text-[9px] font-mono text-gray-300 font-bold uppercase tracking-wider">ACTIVE SIGNAL RECEIVER</span>
            </div>
            
            <iframe
              src="https://maps.google.com/maps?q=Ground%20Floor,%20B-5/29(C.A,%20B5,%20Block%20B,%20Kalyani,%20West%20Bengal%20741235&t=&z=16&ie=UTF8&iwloc=&output=embed"
              className="w-full h-full border-0 rounded-lg opacity-85 hover:opacity-100 transition-opacity duration-300 filter invert-[90%] hue-rotate-180 contrast-125"
              allowFullScreen
              loading="lazy"
              title="Game in Cage Interactive Navigation Map"
            />
          </div>

          {/* Right Column: Information & Live Navigation Controls */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              
              {/* Address detail card */}
              <div className="bg-black/40 border border-white/[0.04] p-5 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-gray-400">
                  <MapPin className="h-4.5 w-4.5 text-[#ef4444]" />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider">OFFICIAL HEADQUARTERS</span>
                </div>
                
                <p className="text-white font-sans text-xs sm:text-sm font-medium leading-relaxed">
                  {CAFE_INFO.location}
                </p>

                <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between">
                  <span className="text-[9px] font-mono text-gray-500 uppercase">Click to copy location data</span>
                  <button
                    onClick={copyAddressToClipboard}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.03] hover:bg-[#ef4444]/10 border border-white/5 hover:border-[#ef4444]/30 text-white hover:text-[#ef4444] rounded-md text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer font-semibold"
                  >
                    {copiedAddress ? (
                      <>
                        <Check className="h-3 w-3 text-[#ef4444]" />
                        <span>COPIED!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>COPY ADDRESS</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Wayfinder Cues / Directions guide */}
              <div className="bg-black/20 border border-white/[0.02] p-5 rounded-xl space-y-4">
                <div className="flex items-center gap-2 text-gray-400">
                  <Map className="h-4 w-4 text-[#ef4444]" />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider">LANDMARK &amp; ACCESS TIPS</span>
                </div>

                <div className="space-y-3.5 text-xs font-sans text-gray-400 leading-relaxed">
                  <div className="flex gap-3">
                    <span className="font-mono text-[10px] text-[#ef4444] font-bold bg-[#ef4444]/5 px-2 py-0.5 rounded shrink-0 h-fit">BY TRAIN</span>
                    <p className="text-[11px]">Just 5 minutes by auto or electric rickshaw from <strong className="text-white">Kalyani Junction Railway Station</strong>. Ask for Block B near Central Park.</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-mono text-[10px] text-gray-500 font-bold bg-white/5 px-2 py-0.5 rounded shrink-0 h-fit">BY ROAD</span>
                    <p className="text-[11px]">Situated on the spacious Block B Avenue. Look for our illuminated crimson Cage outdoor sign board. Dedicated bike parking and car parking is available.</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Main Action buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => window.open(CAFE_INFO.gmapsLink, '_blank')}
                className="w-full py-4 bg-[#ef4444] text-[#000000] hover:bg-white hover:text-black font-sans font-bold text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#ef4444]/5 hover:shadow-white/5 active:scale-[0.99]"
              >
                <Navigation className="h-4 w-4 fill-current" />
                <span>START GOOGLE MAPS NAVIGATION</span>
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => window.open(`https://maps.apple.com/?daddr=${encodeURIComponent(CAFE_INFO.location)}`, '_blank')}
                  className="flex-1 py-3 bg-white/[0.02] border border-white/10 hover:border-white/25 text-white hover:bg-white/[0.04] rounded-lg text-[10px] font-mono uppercase tracking-wider font-semibold transition-colors cursor-pointer text-center"
                >
                  Apple Maps
                </button>
                <button
                  onClick={() => window.open(`https://waze.com/ul?q=${encodeURIComponent(CAFE_INFO.location)}&navigate=yes`, '_blank')}
                  className="flex-1 py-3 bg-white/[0.02] border border-white/10 hover:border-white/25 text-white hover:bg-white/[0.04] rounded-lg text-[10px] font-mono uppercase tracking-wider font-semibold transition-colors cursor-pointer text-center"
                >
                  Waze Navigation
                </button>
              </div>
            </div>

          </div>

        </div>
      </motion.section>

    </div>
  );
}
