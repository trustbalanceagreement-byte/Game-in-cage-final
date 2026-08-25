import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, Tv, Eye, Star, Zap, ShoppingCart, Search, Plus, Minus, CheckCircle, Flame, Sparkles, Trophy } from 'lucide-react';
import { STATIONS, MENU_ITEMS, GAMING_PACKAGES } from '../data';
import { StationConfig, MenuItem } from '../types';

interface ServiceViewProps {
  setTab: (tab: string) => void;
  setSelectedStationId: (id: string | null) => void;
  setSelectedPackageId: (id: string | null) => void;
}

export default function ServiceView({ setTab, setSelectedStationId, setSelectedPackageId }: ServiceViewProps) {
  // Station filter states
  const [stationFilter, setStationFilter] = useState<'all' | 'console-cage' | 'car-sim' | 'vr-pod' | 'pool'>('all');
  const [selectedStation, setSelectedStation] = useState<StationConfig | null>(null);

  // Menu states
  const [menuSearch, setMenuSearch] = useState('');
  const [menuFilter, setMenuFilter] = useState<'All' | 'Snacks' | 'Drinks' | 'Energy Fuels'>('All');
  
  // Platter cart simulator state
  const [cart, setCart] = useState<{ [id: string]: number }>({});
  const [checkoutMsg, setCheckoutMsg] = useState<string | null>(null);

  // Lock body scroll and completely hide footer when modal is active
  useEffect(() => {
    if (selectedStation) {
      document.body.classList.add('hide-footer-for-modal');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('hide-footer-for-modal');
      document.body.style.overflow = '';
    }
    return () => {
      document.body.classList.remove('hide-footer-for-modal');
      document.body.style.overflow = '';
    };
  }, [selectedStation]);

  const filteredStations = STATIONS.filter(s => {
    if (stationFilter === 'all') return true;
    return s.category === stationFilter;
  });

  const filteredMenu = MENU_ITEMS.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase()) || 
                          item.description.toLowerCase().includes(menuSearch.toLowerCase());
    const matchesCategory = menuFilter === 'All' || item.category === menuFilter;
    return matchesSearch && matchesCategory;
  });

  // Cart operations
  const addToCart = (id: string) => {
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    setCheckoutMsg(null);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const copy = { ...prev };
      const currentQty = copy[id] || 0;
      if (currentQty <= 1) {
        delete copy[id];
      } else {
        copy[id] = currentQty - 1;
      }
      return copy;
    });
    setCheckoutMsg(null);
  };

  const clearCart = () => {
    setCart({});
    setCheckoutMsg(null);
  };

  // Compute cart totals
  const totalCartItems = (Object.values(cart) as number[]).reduce((a: number, b: number) => a + b, 0);
  const totalCartCost = (Object.entries(cart) as [string, number][]).reduce((sum: number, [id, qty]: [string, number]) => {
    const item = MENU_ITEMS.find(m => m.id === id);
    return sum + (item ? item.price : 0) * qty;
  }, 0);

  const handleBookRig = (stationId: string) => {
    setSelectedPackageId(null);
    setSelectedStationId(stationId);
    setTab('book');
  };

  const handleBookPackage = (pkgId: string) => {
    setSelectedStationId(null);
    setSelectedPackageId(pkgId);
    setTab('book');
  };

  const executeCheckout = () => {
    setCheckoutMsg(`Estimated total: ₹${totalCartCost}. Platter order mapped to your active session table checklist!`);
    setTimeout(() => {
      setCheckoutMsg(null);
    }, 8000);
  };

  return (
    <div className="space-y-12 pt-2 pb-8">
      {/* SECTION HEADER */}
      <div className="text-center space-y-2">
        <span className="font-mono text-[#ef4444] text-[10px] font-semibold tracking-[0.2em] uppercase">SPECIFICATION MATRIX</span>
        <h2 className="font-['Arial'] text-center font-normal text-xl sm:text-2xl text-white tracking-tight uppercase">
          Stations &amp; <span className="text-[#ef4444] font-['Arial'] font-normal not-italic no-underline">Refreshments</span>
        </h2>
        <p className="text-gray-400 text-xs max-w-lg mx-auto font-sans leading-relaxed">
          Inspect our elite tactile configurations and pre-select high-frequency focus fuels designed for prolonged session comfort.
        </p>
      </div>

      {/* 1. INTERACTIVE STATION CONFIGS */}
      <section className="space-y-5">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 border-b border-white/[0.04] pb-4">
          <div>
            <h3 className="font-sans font-medium text-sm sm:text-base text-white uppercase tracking-wider flex items-center gap-2">
              <Cpu className="h-4 w-4 text-[#ef4444]" />
              <span>COOPERATIVE MATRIX ZONES</span>
            </h3>
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mt-0.5">PRIVATE LAYOUT SHELTERS MINIMIZE VISUAL AND AUDIO SPILLAGE</p>
          </div>

          {/* Station category options */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: 'All Cages' },
              { id: 'console-cage', label: 'PS5 Cages' },
              { id: 'car-sim', label: 'Car Simulators' },
              { id: 'vr-pod', label: 'VR Decks' },
              { id: 'pool', label: '8-Ball Pool' }
            ].map((btn) => (
              <button
                id={`station-filter-${btn.id}`}
                key={btn.id}
                onClick={() => setStationFilter(btn.id as any)}
                className={`px-2.5 py-1 rounded-lg font-sans text-[11px] font-medium uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                  stationFilter === btn.id 
                    ? 'bg-[#ef4444] text-[#000000]' 
                    : 'bg-white/[0.02] text-gray-400 border border-white/5 hover:border-[#ef4444]/20 hover:text-white'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stations grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredStations.map((station) => (
            <div 
              key={station.id}
              className="group bg-white/[0.02] border border-white/[0.04] rounded-2xl overflow-hidden flex flex-col justify-between shadow-xl hover:border-[#ef4444]/25 transition-all duration-300"
            >
              <div className="relative h-48 sm:h-52 overflow-hidden bg-black">
                <img 
                  src={station.image} 
                  alt={station.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-50 group-hover:opacity-75"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-transparent to-transparent" />
                
                {/* Hourly Rate Overlay Badge */}
                <div className="absolute top-3 right-3 rounded-lg bg-[#000000]/90 text-[#ef4444] font-mono text-[10px] font-bold px-2.5 py-1 border border-[#ef4444]/20 shadow-md uppercase tracking-wider">
                  {station.id === 'pool-board' ? '₹50/15min' : `₹${station.hourlyRate}/hr`}
                </div>
              </div>

              <div className="p-4 sm:p-5 space-y-3.5 flex-1 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <h4 className="font-mono font-bold text-sm sm:text-base text-white tracking-wide uppercase not-italic no-underline">
                    {station.name}
                  </h4>

                  {/* Custom Pricing Details Block */}
                  <div className="bg-[#ef4444]/5 border border-[#ef4444]/20 rounded-xl p-2.5 my-2">
                    <span className="block text-[8.5px] font-mono text-[#ef4444] uppercase tracking-widest mb-1 font-bold">Pricing details</span>
                    <div className="flex flex-col gap-0.5 text-[11px]">
                      <div className="flex justify-between items-center text-white">
                        <span className="font-sans text-gray-300 text-[11px]">Rate:</span>
                        <span className="font-mono font-bold text-white text-[11px]">
                          {station.id === 'pool-board' ? '₹50 per person' : `₹${station.hourlyRate} (1 Hour)`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-gray-400">
                        <span>Starting Price:</span>
                        <span className="font-mono text-[#ef4444] font-semibold text-[10px]">
                          {station.id === 'pool-board' 
                            ? '₹50 / Person (15 min)' 
                            : `₹${station.startingPrice} (${station.startingDuration || '30 Mins'})`}
                        </span>
                      </div>
                      {station.minPersons && (
                        <div className="text-[9px] text-[#ef4444] font-mono mt-0.5 border-t border-white/5 pt-0.5 uppercase">
                          ⚠️ Minimum {station.minPersons} persons required
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="block text-[8.5px] font-mono text-gray-500 uppercase tracking-widest mb-1.5 font-bold">Hardware Specifications</span>
                    <div className="space-y-1.5 bg-black/40 p-2.5 sm:p-3 border border-white/[0.04] rounded-xl">
                      {station.specs.slice(0, 3).map((spec, index) => (
                        <div key={index} className="flex gap-1.5 text-[11px] font-mono text-gray-300 leading-snug">
                          <span className="text-[#ef4444] font-bold">•</span>
                          <span>{spec}</span>
                        </div>
                      ))}
                      {station.specs.length > 3 && (
                        <div className="text-[8px] text-[#ef4444] font-mono text-right font-semibold uppercase tracking-widest pt-0.5">
                          + {station.specs.length - 3} SPEC DETAILS AVAILABLE
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2.5 items-center pt-1">
                  <button
                    id={`details-btn-${station.id}`}
                    onClick={() => setSelectedStation(station)}
                    className="flex-1 py-2 rounded-lg bg-white/[0.02] border border-white/10 hover:border-[#ef4444]/30 text-gray-300 hover:text-white font-sans text-[11px] uppercase tracking-wider font-bold transition-colors cursor-pointer"
                  >
                    View Specs
                  </button>
                  <button
                    id={`book-rig-btn-${station.id}`}
                    onClick={() => handleBookRig(station.id)}
                    className="flex-1 py-2 rounded-lg bg-[#ef4444] text-[#000000] hover:bg-white text-[11px] uppercase tracking-wider font-bold transition-colors cursor-pointer"
                  >
                    Book Cage
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. EXCLUSIVE GAMING COMBOS */}
      <section className="space-y-5">
        <div className="border-b border-white/[0.04] pb-4">
          <h3 className="font-mono font-semibold text-sm sm:text-base text-white uppercase tracking-wider flex items-center gap-2">
            <Trophy className="h-4 w-4 text-[#ef4444]" />
            <span>EXCLUSIVE GAMING COMBOS</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {GAMING_PACKAGES.map((pkg) => (
            <div 
              key={pkg.id}
              className="group bg-white/[0.02] border border-[#ef4444]/20 hover:border-[#ef4444]/65 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xl transition-all duration-300"
            >
              <div className="relative h-48 sm:h-52 overflow-hidden bg-black">
                <img 
                  src={pkg.image} 
                  alt={pkg.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60 group-hover:opacity-85"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-transparent to-transparent" />
                
                {/* Flat Price Badge */}
                <div className="absolute top-3 right-3 rounded-lg bg-[#ef4444] text-[#000000] font-mono text-xs font-black px-3 py-1 shadow-lg uppercase tracking-wider">
                  ₹{pkg.price} Flat Rate
                </div>

                {/* Duration Badge */}
                <div className="absolute bottom-3 left-3 rounded-md bg-[#000000]/80 text-[#ef4444] font-mono text-[10px] px-2 py-1 border border-[#ef4444]/20 shadow-md">
                  {pkg.duration} Total
                </div>
              </div>

              <div className="p-4 sm:p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-mono font-bold text-sm sm:text-base text-white tracking-wide uppercase not-italic no-underline">
                      {pkg.name}
                    </h4>
                  </div>

                  <div>
                    <span className="block text-[8.5px] font-mono text-gray-500 uppercase tracking-widest mb-1.5 font-bold">What's Included in Package</span>
                    <div className="grid grid-cols-1 gap-1.5 bg-black/50 p-3 border border-white/[0.04] rounded-xl">
                      {pkg.details.map((detail, index) => (
                        <div key={index} className="flex gap-2 items-center text-[11px] font-mono text-gray-300">
                          <CheckCircle className="h-3.5 w-3.5 text-[#ef4444] flex-shrink-0" />
                          <span>{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    id={`book-package-btn-${pkg.id}`}
                    onClick={() => handleBookPackage(pkg.id)}
                    className="w-full py-2.5 rounded-lg bg-[#ef4444] text-[#000000] hover:bg-white text-[11px] uppercase tracking-wider font-bold transition-colors cursor-pointer"
                  >
                    Book Package Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. DYNAMIC MODAL DETAIL VIEW FOR STATIONS */}
      {selectedStation && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div 
            className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100000]"
            onClick={() => setSelectedStation(null)}
          />
          <div className="relative z-[100001] bg-[#000000] border border-white/10 rounded-2xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 overflow-hidden my-auto">
            <div className="absolute inset-0 opacity-[0.01] grid-overlay pointer-events-none" />
            
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <span className="font-mono text-[8.5px] text-[#ef4444] uppercase font-bold tracking-widest">{selectedStation.category} SYSTEM INTEGRITY</span>
                <h3 className="font-display font-medium text-lg sm:text-xl text-white tracking-wide uppercase italic mt-0.5">{selectedStation.name}</h3>
              </div>
              <button 
                id="close-spec-modal"
                onClick={() => setSelectedStation(null)}
                className="p-1 px-2.5 bg-black/60 rounded-lg border border-white/10 hover:border-white/30 font-mono text-[9px] uppercase font-bold text-gray-400 hover:text-white cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="relative z-10 text-[11px] text-gray-400 font-sans leading-relaxed">
              {selectedStation.description}
            </div>

            <div className="relative z-10 space-y-1.5">
              <span className="block text-[8.5px] font-mono text-gray-500 uppercase tracking-widest leading-none font-bold">SPECIFICATION OVERVIEW</span>
              <div className="bg-black/65 p-3 rounded-xl border border-white/[0.04] space-y-1.5">
                {selectedStation.specs.map((item, id) => (
                  <div key={id} className="flex gap-1.5 text-[11px] font-mono text-gray-300">
                    <span className="text-[#ef4444] font-bold">•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 space-y-1.5">
              <span className="block text-[8.5px] font-mono text-gray-500 uppercase tracking-widest leading-none font-bold">SHELTER BENEFITS</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1">
                {selectedStation.features.map((feat, idx) => (
                  <div key={idx} className="flex gap-1.5 items-center text-[10px] text-gray-400 font-sans">
                    <CheckCircle className="h-3 w-3 text-[#ef4444] flex-shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 pt-3 border-t border-white/[0.06] flex items-center justify-between gap-3">
              <div>
                <span className="block text-[8.5px] font-mono text-gray-500 uppercase font-semibold">UNIT PAYABLE RATE</span>
                <span className="font-sans font-light text-white text-base">₹{selectedStation.hourlyRate} <span className="text-[10px] text-gray-400 font-mono">/ hr</span></span>
              </div>
              <div className="flex gap-2">
                <button
                  id="modal-cancel-btn"
                  onClick={() => setSelectedStation(null)}
                  className="px-3 py-1.5 bg-transparent border border-white/10 rounded-lg text-[11px] font-sans font-semibold text-gray-400 hover:text-white uppercase cursor-pointer"
                >
                  Close
                </button>
                <button
                  id="modal-book-btn"
                  onClick={() => {
                    const id = selectedStation.id;
                    setSelectedStation(null);
                    handleBookRig(id);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-[#ef4444] text-[#000000] hover:bg-white text-[11px] font-sans font-semibold uppercase tracking-wider cursor-pointer"
                >
                  Reserve Grid
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
