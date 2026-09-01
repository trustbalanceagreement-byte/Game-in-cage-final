import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, User, Phone, CheckCircle, Trash2, ShieldAlert, Sparkles, Receipt, Laptop, Smartphone, Lock } from 'lucide-react';
import { CAFE_INFO, STATIONS, GAMING_PACKAGES } from '../data';
import { Booking, StationConfig, GamingPackage, PaymentDetails } from '../types';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import AnalogClockPicker from './AnalogClockPicker';

// Staggered entrance animation variants for station and package list items
const stationContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.08,
    },
  },
};

const stationItemVariants = {
  hidden: { 
    opacity: 0, 
    y: 14, 
    scale: 0.97 
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 420,
      damping: 28,
      mass: 0.7,
    },
  },
};

interface BookViewProps {
  selectedStationId: string | null;
  setSelectedStationId: (id: string | null) => void;
  selectedPackageId: string | null;
  setSelectedPackageId: (id: string | null) => void;
  onInitiatePayment?: (paymentDetails: PaymentDetails) => void;
}

export default function BookView({ 
  selectedStationId, 
  setSelectedStationId,
  selectedPackageId,
  setSelectedPackageId,
  onInitiatePayment
}: BookViewProps) {
  // Existing local bookings
  const [activeBookings, setActiveBookings] = useState<Booking[]>([]);
  
  // Form input states
  const [bookingType, setBookingType] = useState<'hourly' | 'package'>(selectedPackageId ? 'package' : 'hourly');
  const [packageId, setPackageId] = useState<string>(selectedPackageId || GAMING_PACKAGES[0].id);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [stationId, setStationId] = useState(selectedStationId || STATIONS[0].id);
  const [timeSlot, setTimeSlot] = useState("12:00:00 PM");
  const [selectedHour, setSelectedHour] = useState("12");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [selectedSecond, setSelectedSecond] = useState("00");
  const [selectedAmpm, setSelectedAmpm] = useState("PM");
  const [isManualTime, setIsManualTime] = useState(false);
  const [isClockOpen, setIsClockOpen] = useState(false);
  const [hours, setHours] = useState(1);
  const [durationUnit, setDurationUnit] = useState<'hours' | 'minutes'>('hours');
  const [playersCount, setPlayersCount] = useState(2);
  const [orderNotes, setOrderNotes] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState<Booking | null>(null);

  // Sync default duration and unit when stationId changes
  useEffect(() => {
    if (stationId === 'pool-board') {
      setHours(0.25);
      setDurationUnit('minutes');
    } else {
      setHours(1);
      setDurationUnit('hours');
    }
  }, [stationId]);

  // Lock body scroll and completely hide footer when modal or clock is active
  useEffect(() => {
    if (bookingSuccess || isClockOpen) {
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
  }, [bookingSuccess, isClockOpen]);

  // Sync custom hour/minute/second picker state to timeSlot
  useEffect(() => {
    if (!isManualTime) {
      setTimeSlot(`${selectedHour}:${selectedMinute}:${selectedSecond} ${selectedAmpm}`);
    }
  }, [selectedHour, selectedMinute, selectedSecond, selectedAmpm, isManualTime]);

  // Real-time synchronization & countdown clock ticker
  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    const checkAndPurgeExpired = () => {
      const stored = localStorage.getItem('gic_bookings');
      if (stored) {
        try {
          const currentList: Booking[] = JSON.parse(stored);
          const now = Date.now();
          let changed = false;
          
          // Purge bookings rejected over 8 minutes ago
          const filteredList = currentList.filter(b => {
            if (b.status === 'rejected' && b.rejectedAt) {
              const elapsedMs = now - b.rejectedAt;
              const hasExpired = elapsedMs >= 8 * 60 * 1000;
              if (hasExpired) {
                changed = true;
                return false;
              }
            }
            return true;
          });

          if (changed) {
            localStorage.setItem('gic_bookings', JSON.stringify(filteredList));
            setActiveBookings(filteredList);
          } else {
            // Keep state in sync with local storage if modified from other places
            setActiveBookings(currentList);
          }
        } catch (e) {
          console.error("Failed to sync/parse local storage bookings", e);
        }
      }
    };

    // Run immediately
    checkAndPurgeExpired();

    // Run every second for real-time feedback and automatic status tracking
    const interval = setInterval(() => {
      setTicker(prev => prev + 1);
      checkAndPurgeExpired();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Update form if selectedStationId/selectedPackageId changes from outer services page
  useEffect(() => {
    if (selectedStationId) {
      setStationId(selectedStationId);
      setBookingType('hourly');
    }
  }, [selectedStationId]);

  useEffect(() => {
    if (selectedPackageId) {
      setPackageId(selectedPackageId);
      setBookingType('package');
    }
  }, [selectedPackageId]);

  const activeStation = STATIONS.find(s => s.id === stationId) || STATIONS[0];
  const activePackage = GAMING_PACKAGES.find(p => p.id === packageId) || GAMING_PACKAGES[0];

  // Helper lists
  const availableSlots = [
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
    "5:00 PM",
    "6:00 PM",
    "7:00 PM",
    "8:00 PM",
    "9:00 PM",
    "10:00 PM"
  ];

  const isHappyHourSlot = (slot: string): boolean => {
    const hhSlots = ["10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM"];
    if (hhSlots.includes(slot)) return true;

    try {
      const cleaned = slot.trim().toUpperCase();
      const ampmMatch = cleaned.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/);
      if (ampmMatch) {
        let hour = parseInt(ampmMatch[1], 10);
        const minutes = ampmMatch[2] ? parseInt(ampmMatch[2], 10) : 0;
        const ampm = ampmMatch[3];
        
        if (ampm === 'PM' && hour !== 12) {
          hour += 12;
        } else if (ampm === 'AM' && hour === 12) {
          hour = 0;
        }
        
        const timeValue = hour + minutes / 60;
        return timeValue >= 10 && timeValue <= 14;
      }
    } catch (e) {
      // Ignore parsing errors
    }
    return false;
  };
  
  const appliesHappyHour = isHappyHourSlot(timeSlot);

  // Price Calculation
  const baseRate = activeStation.hourlyRate;
  let rawSubtotal = baseRate * hours;
  if (activeStation.id === 'vr-pod' && hours === 0.5) {
    rawSubtotal = 130;
  } else if (activeStation.id === 'pool-board') {
    rawSubtotal = playersCount * (hours / 0.25) * 50;
  }
  const discountAmount = appliesHappyHour ? Math.round(rawSubtotal * CAFE_INFO.happyHourDiscount) : 0;
  const netTotal = rawSubtotal - discountAmount;

  // Handle book submission
  const handlePerformBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !date) return;

    const isPkg = bookingType === 'package';
    const finalStationType = isPkg ? activePackage.id : activeStation.id;
    const finalHours = isPkg ? (activePackage.id === 'pkg-combo-200' ? 1.25 : 1) : hours;
    const finalTotalCost = isPkg ? activePackage.price : netTotal;
    const finalHappyHour = isPkg ? false : appliesHappyHour;
    const finalUnitName = isPkg ? activePackage.name : activeStation.name;
    const finalNotes = isPkg ? orderNotes : (activeStation.id === 'pool-board' ? `[Players: ${playersCount}] ${orderNotes}` : orderNotes);

    const newBooking: Booking = {
      id: `gic-${Date.now()}-${Math.floor(Math.random() * 900)}`,
      name,
      phone,
      date,
      timeSlot,
      stationType: finalStationType,
      hours: finalHours,
      totalCost: finalTotalCost,
      stationNumber: Math.floor(Math.random() * 12) + 1,
      isHappyHourApplied: finalHappyHour,
      notes: finalNotes,
      status: 'pending',
      createdAt: new Date().toLocaleString(),
      userId: auth.currentUser?.uid || undefined
    };

    const updated = [newBooking, ...activeBookings];
    setActiveBookings(updated);
    localStorage.setItem('gic_bookings', JSON.stringify(updated));

    // Trigger Firestore booking notification if authenticated
    try {
      const uid = auth.currentUser?.uid;
      if (uid) {
        const notifRef = doc(collection(db, 'users', uid, 'notifications'));
        await setDoc(notifRef, {
          id: notifRef.id,
          title: "Booking Initiated",
          message: `Your session for ${finalUnitName} (Slot #${newBooking.stationNumber}) has been submitted for approval.`,
          createdAt: Date.now(),
          viewed: false
        });
      }
    } catch (err) {
      console.error("Failed to push booking notification:", err);
      const uid = auth.currentUser?.uid;
      if (uid) {
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}/notifications`);
      }
    }

    // Success overlay
    setBookingSuccess(newBooking);
    
    // Clear primary fields
    setName('');
    setPhone('');
    setOrderNotes('');
    setSelectedStationId(null);
    setSelectedPackageId(null);
  };

  // Delete booking logic
  const handleDeleteBooking = (id: string) => {
    const filtrated = activeBookings.filter(b => b.id !== id);
    setActiveBookings(filtrated);
    localStorage.setItem('gic_bookings', JSON.stringify(filtrated));
  };

  return (
    <div className="space-y-16 pt-2 pb-8">
      {/* HEADER TITLE */}
      <div className="text-center space-y-3">
        <span className="font-mono text-[#ef4444] text-xs font-semibold tracking-[0.2em] uppercase">RESERVATION DIRECTORY</span>
        <h2 className="font-['Arial'] font-normal text-2xl sm:text-3xl text-white tracking-tight uppercase">
          Book your <span className="text-[#ef4444] font-['Arial'] font-normal not-italic no-underline">session</span>
        </h2>
        <p className="text-gray-400 text-xs sm:text-sm max-w-xl mx-auto font-sans leading-relaxed">
          Select premium computing configurations, set your timeframe guidelines, and enjoy happy hour discount perks automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COMPONENT: SUBMISSION FORM CARD */}
        <div className="lg:col-span-7 bg-white/[0.02] border border-white/[0.05] p-6 sm:p-8 rounded-2xl shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-['Arial'] not-italic font-medium text-lg text-white uppercase tracking-wider flex items-center gap-2">
                <Laptop className="h-5 w-5 text-[#ef4444]" />
                <span className="font-['Arial']">Cage Booking Form</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1 font-['Arial']">Configure specification parameters to lock your private physical rig instantly.</p>
            </div>

            {/* Mode Switcher Toggle */}
            <div className="grid grid-cols-2 gap-1 bg-black/40 p-1 rounded-xl border border-white/[0.04]">
              <button
                id="booking-type-hourly"
                type="button"
                onClick={() => setBookingType('hourly')}
                className={`px-3 py-1.5 rounded-lg text-center font-sans text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  bookingType === 'hourly'
                    ? 'bg-[#ef4444] text-[#000000]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Hourly
              </button>
              <button
                id="booking-type-package"
                type="button"
                onClick={() => setBookingType('package')}
                className={`px-3 py-1.5 rounded-lg text-center font-sans text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  bookingType === 'package'
                    ? 'bg-[#ef4444] text-[#000000]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Packages
              </button>
            </div>
          </div>

          <form onSubmit={handlePerformBooking} className="space-y-6 text-xs text-gray-300">
            {bookingType === 'package' ? (
              <div className="space-y-3">
                <label className="block text-[9px] font-mono text-gray-500 uppercase tracking-widest font-semibold">
                  1. SELECT SPECIAL GAMING PACKAGE
                </label>
                <motion.div 
                  key="packages-list-grid"
                  variants={stationContainerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                  {GAMING_PACKAGES.map((pkg) => (
                    <motion.button
                      id={`select-package-${pkg.id}`}
                      key={pkg.id}
                      type="button"
                      variants={stationItemVariants}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setPackageId(pkg.id);
                        setSelectedPackageId(pkg.id);
                      }}
                      className={`relative p-4 rounded-xl text-left flex flex-col justify-between transition-colors bg-black/40 ${
                        packageId === pkg.id 
                          ? 'border border-[#ef4444] text-white shadow-[#ef4444]/5' 
                          : 'border border-white/[0.04] text-gray-400 hover:border-white/10'
                      }`}
                    >
                      <div>
                        <span className="block font-sans font-semibold text-xs text-white uppercase tracking-wider truncate max-w-[180px]">{pkg.name}</span>
                        <span className="block text-[9px] font-mono text-[#ef4444] uppercase mt-1">₹{pkg.price} Flat Rate</span>
                        <span className="block text-[8px] font-mono text-gray-500 uppercase mt-0.5">{pkg.duration}</span>
                      </div>
                      {packageId === pkg.id && (
                        <span className="absolute top-4 right-4 bg-[#ef4444] text-[#000000] px-2 py-0.5 text-[8px] font-mono rounded-md font-bold">LOCKED</span>
                      )}
                    </motion.button>
                  ))}
                </motion.div>

                {/* Selected Package Details preview on form */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-3.5 bg-black/50 border border-white/[0.04] rounded-xl space-y-2"
                >
                  <span className="block text-[8px] font-mono text-[#ef4444] uppercase tracking-wider font-semibold">
                    PACKAGE DETAILS: {activePackage.name}
                  </span>
                  <p className="text-[10px] text-gray-400 leading-relaxed font-sans">{activePackage.description}</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {activePackage.details.map((detail, idx) => (
                      <span key={idx} className="bg-white/[0.03] border border-white/[0.04] text-gray-300 text-[9px] font-mono px-2 py-1 rounded-md flex items-center gap-1.5">
                        <span className="text-[#ef4444]">•</span> {detail}
                      </span>
                    ))}
                  </div>
                </motion.div>
              </div>
            ) : (
              /* 1. Station rig select block */
              <div className="space-y-3">
                <label className="block text-[9px] font-mono text-gray-500 uppercase tracking-widest font-semibold">
                  1. SELECT PREFERRED HARDWARE
                </label>
                <motion.div 
                  key="stations-list-grid"
                  variants={stationContainerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                  {STATIONS.map((st) => (
                    <motion.button
                      id={`select-station-${st.id}`}
                      key={st.id}
                      type="button"
                      variants={stationItemVariants}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setStationId(st.id);
                        setSelectedStationId(st.id);
                      }}
                      className={`relative p-4 rounded-xl text-left flex flex-col justify-between transition-colors bg-black/40 ${
                        stationId === st.id 
                          ? 'border border-[#ef4444] text-white shadow-[#ef4444]/5' 
                          : 'border border-white/[0.04] text-gray-400 hover:border-white/10'
                      }`}
                    >
                      <div>
                        <span className="block font-sans font-semibold text-xs text-white uppercase tracking-wider truncate max-w-[180px]">{st.name}</span>
                        <span className="block text-[9px] font-mono text-[#ef4444] uppercase mt-1">₹{st.hourlyRate} / hour</span>
                      </div>
                      {stationId === st.id && (
                        <span className="absolute top-4 right-4 bg-[#ef4444] text-[#000000] px-2 py-0.5 text-[8px] font-mono rounded-md font-bold">LOCKED</span>
                      )}
                    </motion.button>
                  ))}
                </motion.div>
              </div>
            )}

            {/* 2. Client Identity Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[9px] font-mono text-gray-500 uppercase tracking-widest font-semibold">
                  2. FULL NAME
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-600" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder=""
                    className="w-full bg-black rounded-lg border border-white/10 py-2.5 pl-10 pr-3 text-xs text-white focus:outline-none focus:border-[#ef4444] placeholder-gray-700"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[9px] font-mono text-gray-500 uppercase tracking-widest font-semibold">
                  3. DESK HELPDESK MOBILE
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-600" />
                  <input
                    type="tel"
                    required
                    pattern="^[0-9\-\+\s]{10,13}$"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder=""
                    className="w-full bg-black rounded-lg border border-white/10 py-2.5 pl-10 pr-3 text-xs text-white focus:outline-none focus:border-[#ef4444] placeholder-gray-700"
                  />
                </div>
              </div>
            </div>

            {/* 3. Date, slot and hours */}
            <div className={`grid grid-cols-1 ${activeStation.id === 'pool-board' && bookingType !== 'package' ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-3`}>
              <div className="space-y-1.5">
                <label className="block text-[9px] font-mono text-gray-500 uppercase tracking-widest font-semibold">
                  4. SESSION DATE
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-black rounded-lg border border-white/10 py-2.5 px-3 text-xs text-white focus:outline-none focus:border-[#ef4444]"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-[9px] font-mono text-gray-500 uppercase tracking-widest font-semibold">
                    5. SESSION HOUR START
                  </label>
                  {isManualTime && (
                    <button
                      type="button"
                      onClick={() => setIsManualTime(false)}
                      className="text-[8px] font-mono text-rose-400 hover:text-white uppercase tracking-wider font-extrabold transition-all cursor-pointer bg-rose-950/40 border border-rose-500/20 rounded-md py-0.5 px-2"
                    >
                      [ BACK TO DIAL ]
                    </button>
                  )}
                </div>
                {isManualTime ? (
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={timeSlot}
                      onChange={(e) => setTimeSlot(e.target.value)}
                      placeholder=""
                      className="w-full bg-black rounded-lg border border-white/10 py-2.5 px-3 text-xs text-white focus:outline-none focus:border-[#ef4444] placeholder-gray-700 font-mono font-bold"
                    />
                    <span className="absolute right-3 top-2.5 text-[8px] font-mono text-gray-500 uppercase font-semibold">
                      KEYBOARD
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsClockOpen(true)}
                    className="w-full bg-black rounded-lg border border-white/10 py-2.5 px-3 text-xs text-left text-white hover:border-rose-500/40 focus:outline-none transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <span className="font-mono font-bold tracking-wider text-rose-200 text-sm">
                      {selectedHour}:{selectedMinute}:{selectedSecond} {selectedAmpm}
                    </span>
                    <div className="flex items-center gap-1.5 text-[8px] font-mono text-rose-400 group-hover:text-white">
                      <span>OPEN CLOCK</span>
                      <Clock className="w-4 h-4 text-rose-500 animate-pulse" />
                    </div>
                  </button>
                )}

                {/* Highly-polished Analog Clock Dial Picker Portal Overlay */}
                <AnalogClockPicker
                  isOpen={isClockOpen}
                  onClose={() => setIsClockOpen(false)}
                  onKeyboardToggle={() => setIsManualTime(true)}
                  currentHour={selectedHour}
                  currentMinute={selectedMinute}
                  currentSecond={selectedSecond}
                  currentAmpm={selectedAmpm}
                  onSet={(hour, minute, second, ampm) => {
                    setSelectedHour(hour);
                    setSelectedMinute(minute);
                    setSelectedSecond(second);
                    setSelectedAmpm(ampm);
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-[9px] font-mono text-gray-500 uppercase tracking-widest font-semibold">
                    {activeStation.id === 'pool-board' ? '6. SESSION SPAN' : '6. SESSION SPAN Duration'}
                  </label>
                  {bookingType !== 'package' && (
                    <div className="flex bg-black rounded-md p-0.5 border border-white/5">
                      <button
                        type="button"
                        onClick={() => {
                          if (durationUnit === 'minutes') {
                            setDurationUnit('hours');
                          }
                        }}
                        className={`px-1.5 py-0.5 rounded text-[8px] font-mono uppercase font-bold tracking-wider transition-all cursor-pointer ${
                          durationUnit === 'hours'
                            ? 'bg-[#ef4444] text-black shadow'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        HRS
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (durationUnit === 'hours') {
                            setDurationUnit('minutes');
                          }
                        }}
                        className={`px-1.5 py-0.5 rounded text-[8px] font-mono uppercase font-bold tracking-wider transition-all cursor-pointer ${
                          durationUnit === 'minutes'
                            ? 'bg-[#ef4444] text-black shadow'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        MINS
                      </button>
                    </div>
                  )}
                </div>
                {bookingType === 'package' ? (
                  <div className="flex items-center bg-white/[0.01] border border-white/5 rounded-lg px-3 py-2.5 h-10 select-none text-gray-500 font-mono">
                    <span className="w-full text-center font-bold text-gray-400">{activePackage.duration}</span>
                    <span className="text-[8px] bg-[#ef4444]/15 border border-[#ef4444]/20 text-[#ef4444] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">LOCKED</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center bg-black rounded-lg border border-white/10 px-3">
                      <input
                        type="number"
                        min={durationUnit === 'minutes' ? (activeStation.id === 'pool-board' ? 15 : 30) : (activeStation.id === 'pool-board' ? 0.25 : 0.5)}
                        step={durationUnit === 'minutes' ? 5 : 0.25}
                        required
                        value={
                          hours === '' || isNaN(hours as any)
                            ? ''
                            : durationUnit === 'minutes'
                            ? Math.round((hours as number) * 60)
                            : hours
                        }
                        onChange={(e) => {
                          const valStr = e.target.value;
                          if (valStr === '') {
                            setHours('' as any);
                            return;
                          }
                          const valNum = Number(valStr);
                          if (isNaN(valNum)) return;
                          
                          if (durationUnit === 'minutes') {
                            setHours(valNum / 60);
                          } else {
                            setHours(valNum);
                          }
                        }}
                        className="w-full bg-transparent py-2.5 px-1 text-xs text-white text-center focus:outline-none font-bold"
                        placeholder={durationUnit === 'minutes' ? "Type minutes..." : "Type hours..."}
                      />
                      <span className="text-[9px] text-[#ef4444] font-mono font-bold whitespace-nowrap ml-1 uppercase">
                        {durationUnit === 'minutes' ? 'MINS' : 'HRS'}
                      </span>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {(activeStation.id === 'pool-board'
                        ? [
                            { label: '15 Min', hrs: 0.25 },
                            { label: '30 Min', hrs: 0.5 },
                            { label: '1 Hour', hrs: 1 },
                            { label: '2 Hours', hrs: 2 },
                          ]
                        : [
                            { label: '30 Min', hrs: 0.5 },
                            { label: '1 Hour', hrs: 1 },
                            { label: '2 Hours', hrs: 2 },
                            { label: '3 Hours', hrs: 3 },
                          ]
                      ).map((preset) => {
                        const isActive = Math.abs(hours - preset.hrs) < 0.001;
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => setHours(preset.hrs)}
                            className={`px-2 py-1 rounded text-[9px] font-mono border transition-all cursor-pointer ${
                              isActive
                                ? 'bg-[#ef4444]/10 border-[#ef4444] text-[#ef4444] font-bold'
                                : 'bg-black/40 border-white/5 text-gray-400 hover:border-white/20 hover:text-white'
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {activeStation.id === 'pool-board' && bookingType !== 'package' && (
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-mono text-gray-500 uppercase tracking-widest font-semibold">
                    7. NUMBER OF PLAYERS
                  </label>
                  <div className="flex items-center bg-black rounded-lg border border-white/10 px-3">
                    <input
                      type="number"
                      min={2}
                      required
                      value={playersCount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setPlayersCount(val >= 2 ? val : 2);
                      }}
                      className="w-full bg-transparent py-2.5 px-1 text-xs text-white text-center focus:outline-none font-bold"
                    />
                    <span className="text-[9px] text-[#ef4444] font-mono font-bold whitespace-nowrap ml-1">PLAYERS</span>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="block text-[9px] font-mono text-gray-500 uppercase tracking-widest font-semibold">
                7. SPECIAL REQUIREMENT (Optional)
              </label>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder=""
                rows={2}
                className="w-full bg-black rounded-lg border border-white/10 py-2 px-3 text-xs text-white focus:outline-none focus:border-[#ef4444] placeholder-gray-700 font-sans leading-normal"
              />
            </div>

            <button
              id="submit-book-manifest"
              type="submit"
              className="w-full py-3 rounded-lg bg-[#ef4444] hover:bg-white text-black font-semibold tracking-widest text-xs uppercase transition-colors cursor-pointer"
            >
              Secure Reservation
            </button>
          </form>
        </div>

        {/* RIGHT SIDEBAR: REALTIME REVENUE COMPUTATIONS */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Dynamic Invoice Estimator */}
          <div className="bg-white/[0.02] border border-white/[0.05] p-5 rounded-2xl shadow-sm space-y-4 sticky top-28">
            <h3 className="font-sans font-bold text-sm sm:text-base text-white uppercase tracking-wider flex items-center gap-2 pb-2.5 border-b border-white/[0.06]">
              <Receipt className="h-4 w-4 text-[#ef4444] shrink-0" />
              <span className="font-sans font-bold text-sm sm:text-base no-underline">Session Statement</span>
            </h3>

            <div className="space-y-3.5 font-mono text-xs">
              <div className="flex justify-between items-center text-gray-400">
                <span className="text-[10px] text-gray-500 font-semibold uppercase">DESIGNATION UNIT:</span>
                <span className="text-white font-semibold uppercase font-sans text-xs bg-black px-3 py-1 rounded-md border border-white/[0.04] max-w-[180px] truncate text-right">
                  {bookingType === 'package' ? activePackage.name : activeStation.name}
                </span>
              </div>

              <div className="flex justify-between items-center text-gray-400">
                <span className="text-[10px] text-gray-500 font-semibold uppercase">DURATION SPAN:</span>
                <span className="text-white font-medium">
                  {bookingType === 'package' ? activePackage.duration : `${hours} hour${hours > 1 ? 's' : ''} (${hours * 60} mins)`}
                </span>
              </div>

              <div className="flex justify-between items-center text-gray-400">
                <span className="text-[10px] text-gray-500 font-semibold uppercase">
                  {bookingType === 'package' ? "PRICING SCHEME:" : "CHARGE RATE:"}
                </span>
                <span className="text-white font-medium">
                  {bookingType === 'package' 
                    ? "Flat Bundle Promo" 
                    : activeStation.id === 'pool-board' 
                      ? "₹50/Person (15 Mins)" 
                      : `₹${baseRate} / hr`
                  }
                </span>
              </div>

              {activeStation.id === 'pool-board' && bookingType !== 'package' && (
                <div className="flex justify-between items-center text-gray-400">
                  <span className="text-[10px] text-gray-500 font-semibold uppercase">PLAYERS COUNT:</span>
                  <span className="text-[#ef4444] font-semibold">{playersCount} Players</span>
                </div>
              )}

              <div className="border-t border-white/[0.04] my-3 pt-3 flex justify-between items-center text-gray-400">
                <span className="text-[10px] text-gray-500 font-semibold uppercase">SUBTOTAL AMT:</span>
                <span className="text-white font-medium">₹{bookingType === 'package' ? activePackage.price : rawSubtotal}</span>
              </div>

              {bookingType === 'hourly' && appliesHappyHour && (
                <div className="flex justify-between items-center text-[#ef4444] font-medium bg-[#ef4444]/5 p-2.5 rounded-lg border border-[#ef4444]/10">
                  <span className="flex items-center gap-1.5 text-[9px] uppercase font-bold">
                    <Sparkles className="h-3.5 w-3.5 text-[#ef4444]" />
                    <span>25% HAPPY HOUR SAVING:</span>
                  </span>
                  <span>- ₹{discountAmount}</span>
                </div>
              )}

              <div className="border-t-2 border-dashed border-white/[0.04] pt-4 flex justify-between items-end">
                <div>
                  <span className="block text-[9px] text-gray-505 font-semibold text-gray-550 uppercase leading-none">Net Payable On-Spot:</span>
                  <span className="text-[8px] text-gray-500 font-mono mt-1 block">At Kalyani Counter desk</span>
                </div>
                <div className="text-2xl sm:text-3xl font-sans font-bold text-white tracking-tight">
                  ₹{bookingType === 'package' ? activePackage.price : netTotal}
                </div>
              </div>
            </div>

            {/* Clean, High-Contrast Payment Now Button */}
            <div className="pt-2">
              <button
                id="payment-now-btn"
                type="button"
                onClick={() => {
                  const isPkg = bookingType === 'package';
                  const finalStationName = isPkg ? activePackage.name : activeStation.name;
                  const finalDuration = isPkg ? activePackage.duration : `${hours} hour${hours > 1 ? 's' : ''}`;
                  const finalAmount = isPkg ? activePackage.price : netTotal;
                  const finalNotes = isPkg ? orderNotes : (activeStation.id === 'pool-board' ? `[Players: ${playersCount}] ${orderNotes}` : orderNotes);

                  const paymentInfo: PaymentDetails = {
                    storeName: "Game In Cage",
                    terminalId: "Terminal 1-Q240602048",
                    upiId: "Q240602048@ybl",
                    amount: finalAmount,
                    stationName: finalStationName,
                    duration: finalDuration,
                    timeSlot: timeSlot,
                    date: date,
                    playerName: name.trim() || 'Rajesh Sharma',
                    phone: phone.trim() || '9876543210',
                    notes: finalNotes,
                    isHappyHourApplied: bookingType === 'hourly' && appliesHappyHour,
                    subtotal: isPkg ? activePackage.price : rawSubtotal,
                    discount: discountAmount
                  };

                  if (onInitiatePayment) {
                    onInitiatePayment(paymentInfo);
                  }
                }}
                className="w-full py-2.5 px-4 rounded-lg bg-[#ef4444] hover:bg-[#dc2626] text-white font-sans font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center active:scale-[0.98]"
              >
                <span>PAYMENT NOW</span>
              </button>
            </div>
          </div>


        </div>
      </div>

      {/* DYNAMIC RESERVATION CONFIRMED SUCCESS WINDOW OVERLAY */}
      {bookingSuccess && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div 
            className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100000]"
            onClick={() => setBookingSuccess(null)}
          />
          <div className="relative z-[100001] bg-[#000000] border border-white/10 p-6 sm:p-8 rounded-2xl max-w-md w-full shadow-2xl space-y-6 overflow-hidden my-auto">
            <div className="absolute inset-0 opacity-[0.01] grid-overlay pointer-events-none" />
            
            <div className="relative z-10 text-center space-y-3">
              <div className="h-14 w-14 mx-auto bg-[#ef4444]/15 border border-[#ef4444]/30 rounded-full flex items-center justify-center text-[#ef4444]">
                <CheckCircle className="h-7 w-7 text-[#ef4444]" />
              </div>
              <h4 className="font-sans font-semibold text-xl text-white uppercase tracking-wider">CAGE RESERVED SUCCESS</h4>
              <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                Your high-comfort console or PC matrix is successfully locked! Present this receipt pass at check-in counter.
              </p>
            </div>

            {/* Simulated Printed Ticket Receipt */}
            <div className="relative z-10 bg-black/50 border border-white/[0.06] rounded-xl p-4 font-mono text-xs text-gray-400 space-y-4">
              <div className="flex justify-between items-center text-[9px] border-b border-white/[0.04] pb-2 text-gray-500 font-semibold">
                <span>STALKER DESK TICKET SYSTEM</span>
                <span className="text-[#ef4444] font-semibold">{bookingSuccess.id.toUpperCase()}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="block text-gray-600 text-[8px] font-bold uppercase">CLIENT PASS</span>
                  <strong className="text-white font-semibold">{bookingSuccess.name}</strong>
                </div>
                <div>
                  <span className="block text-gray-600 text-[8px] font-bold uppercase">BOOKING TIME</span>
                  <strong className="text-white font-semibold">{bookingSuccess.date}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="block text-gray-600 text-[8px] font-bold uppercase">SHIFT START</span>
                  <strong className="text-white font-semibold">{bookingSuccess.timeSlot}</strong>
                </div>
                <div>
                  <span className="block text-gray-600 text-[8px] font-bold uppercase">UNIT DESPATCH</span>
                  <strong className="text-[#ef4444] font-semibold uppercase">
                    {GAMING_PACKAGES.find(p => p.id === bookingSuccess.stationType)?.name || 
                     STATIONS.find(s => s.id === bookingSuccess.stationType)?.name || 
                     bookingSuccess.stationType} (Desk #{bookingSuccess.stationNumber})
                  </strong>
                </div>
              </div>

              <div className="border-t border-white/[0.04] pt-3 flex justify-between items-end">
                <span className="font-semibold uppercase text-[8px] text-gray-500">PAYABLE ON SLOT ENTER:</span>
                <span className="text-xl font-sans font-bold text-[#ef4444] tracking-tight">₹{bookingSuccess.totalCost}</span>
              </div>
            </div>

            <div className="relative z-10 pt-2">
              <button
                id="success-close-btn"
                onClick={() => setBookingSuccess(null)}
                className="w-full py-3 rounded-lg bg-[#ef4444] hover:bg-white text-black text-xs font-semibold tracking-wider uppercase cursor-pointer text-center block"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
