import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, Play, Sparkles, Image, Video, Film, Swords, 
  Trophy, Info, X, ChevronRight, Phone, Send, CheckCircle, Award, Clock,
  CreditCard, Wallet, ArrowRight
} from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
import { PaymentDetails } from '../types';

interface EventViewProps {
  onInitiatePayment?: (details: PaymentDetails) => void;
  setTab?: (tab: string) => void;
}

interface EventPost {
  id: string;
  type: 'photo' | 'video';
  mediaUrl: string;
  caption: string;
  createdAt: number;
}

interface Tournament {
  id: string;
  title: string;
  type: 'photo' | 'video';
  mediaUrl: string;
  caption: string;
  price: string;
  createdAt: number;
  eventDate?: string;
  eventTime?: string;
}

// Helper function to format video/media URLs reliably (e.g. YouTube watch links, shorts, Vimeo)
export function formatEmbedUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  
  // YouTube watch link
  if (trimmed.includes('youtube.com/watch')) {
    const match = trimmed.match(/v=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=0&rel=0`;
    }
  }
  
  // YouTube short link (youtu.be)
  if (trimmed.includes('youtu.be/')) {
    const parts = trimmed.split('youtu.be/');
    if (parts[1]) {
      const id = parts[1].split('?')[0].split('/')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=0&rel=0`;
    }
  }

  // YouTube Shorts link
  if (trimmed.includes('youtube.com/shorts/')) {
    const parts = trimmed.split('youtube.com/shorts/');
    if (parts[1]) {
      const id = parts[1].split('?')[0].split('/')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=0&rel=0`;
    }
  }

  // Vimeo link
  if (trimmed.includes('vimeo.com/') && !trimmed.includes('player.vimeo.com')) {
    const parts = trimmed.split('vimeo.com/');
    if (parts[1]) {
      const id = parts[1].split('?')[0].split('/')[0];
      return `https://player.vimeo.com/video/${id}`;
    }
  }

  return trimmed;
}

// Check if media is an iframe embed link (YouTube, Vimeo, etc.)
export function isIframeEmbed(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return lower.includes('youtube.com') || lower.includes('youtu.be') || lower.includes('vimeo.com') || lower.includes('player.vimeo.com');
}

export function renderMediaElement(
  type: 'photo' | 'video', 
  mediaUrl: string, 
  titleOrCaption: string, 
  customClass: string = ''
) {
  if (!mediaUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-950 text-gray-500 font-mono text-xs">
        [NO MEDIA AVAILABLE]
      </div>
    );
  }

  // Detect video automatically if URL clearly indicates video file or embed
  const isVideo = type === 'video' || 
    isIframeEmbed(mediaUrl) || 
    /\.(mp4|webm|mov|mkv|avi|3gp)($|\?)/i.test(mediaUrl) || 
    mediaUrl.startsWith('data:video/') || 
    mediaUrl.startsWith('blob:');

  if (!isVideo) {
    return (
      <img 
        src={mediaUrl} 
        alt={titleOrCaption || 'Event Image'}
        referrerPolicy="no-referrer"
        className={`w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-[1.03] transition-all duration-500 ${customClass}`}
        onError={(e) => {
          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800";
        }}
      />
    );
  }

  // Video type
  const formattedUrl = formatEmbedUrl(mediaUrl);

  if (isIframeEmbed(formattedUrl)) {
    return (
      <iframe
        key={formattedUrl}
        src={formattedUrl}
        title={titleOrCaption || 'Event Video'}
        className={`w-full h-full border-0 ${customClass}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  // Direct video file (e.g., /uploads/..., blob:..., data:video/..., .mp4, .webm, .mov, etc.)
  let mimeType = 'video/mp4';
  if (formattedUrl.toLowerCase().endsWith('.webm')) mimeType = 'video/webm';
  if (formattedUrl.toLowerCase().endsWith('.mov')) mimeType = 'video/quicktime';

  return (
    <video 
      key={formattedUrl}
      controls 
      playsInline 
      preload="metadata"
      className={`w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity ${customClass}`}
    >
      <source src={formattedUrl} type={mimeType} />
      <source src={formattedUrl} />
      Your browser does not support playing this video format.
    </video>
  );
}

const FALLBACK_EVENTS: EventPost[] = [
  {
    id: "fb-1",
    type: "photo",
    mediaUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800",
    caption: "🏆 DAILY ELITE MATCHMAKING MATCHES 🏆\n\nTake part in daily elite tournaments on our high-tier 240Hz esports machines in the cage arena. Drop in, register your team, and challenge active leaderboards or log instant bookings to hold your slot!",
    createdAt: Date.now() - 3600000 * 2 // 2 hours ago
  },
  {
    id: "fb-2",
    type: "photo",
    mediaUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=800",
    caption: "💥 HARDWARE ALERT: RTX 4090 STATIONS ARE LIVE 💥\n\nDesk #1 to Desk #6 have been fully upgraded with RTX 4090 GPUs. Zero stutter, pristine responsiveness, extreme speed. Book your hourly station instantly!",
    createdAt: Date.now() - 3600000 * 26 // ~1 day ago
  }
];

const FALLBACK_TOURNAMENTS: Tournament[] = [
  {
    id: "tourney-fb-1",
    title: "🔥 GIC CS2 CHALLENGERS LEAGUE 🔥",
    type: "photo",
    mediaUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800",
    caption: "The flagship CS2 regional offline tournament at GIC. 16 Teams, 5v5 Competitive rules, Single Elimination bracket.\n\nSlots are highly limited. Complete your slot registration form, capture your ticket transaction screenshot, and dispatch it to WhatsApp to lock in your squad's position!",
    price: "1500 BDT per Team",
    createdAt: Date.now() - 3600000 * 5
  },
  {
    id: "tourney-fb-2",
    title: "🏆 VALORANT IMMORTALS DUEL 🏆",
    type: "photo",
    mediaUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=800",
    caption: "Show your precise mechanical aim in our 1v1 Mid-lane speed challenge. Played on elite 360Hz Esports monitors.\n\nWinner gets 50 hours of free high-tier station credits and exclusive merch!",
    price: "200 BDT per Player",
    createdAt: Date.now() - 3600000 * 24
  }
];

export default function EventView({ onInitiatePayment, setTab }: EventViewProps = {}) {
  const [posts, setPosts] = useState<EventPost[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingTournaments, setLoadingTournaments] = useState(true);

  // Modal / Form state
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [showHowToPopup, setShowHowToPopup] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [gamerTag, setGamerTag] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [teamName, setTeamName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  const handleProceedToPayment = () => {
    if (!selectedTournament) return;
    const rawPrice = selectedTournament.price || '0';
    const parsedAmount = Math.max(0, Number(rawPrice.replace(/[^0-9.]/g, '')) || 0);

    const paymentDetails: PaymentDetails = {
      bookingId: `tourn-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      storeName: "Game In Cage",
      terminalId: "Terminal 1-Q240602048",
      upiId: "Q240602048@ybl",
      amount: parsedAmount,
      stationName: `Tournament: ${selectedTournament.title}`,
      duration: 'Tournament Slot',
      timeSlot: selectedTournament.eventTime || 'Tournament Schedule',
      date: selectedTournament.eventDate || new Date().toISOString().split('T')[0],
      playerName: fullName.trim() || gamerTag.trim() || 'Rajesh Sharma',
      phone: phone.trim() || '9876543210',
      notes: `GamerTag: ${gamerTag.trim()} | Team: ${teamName.trim() || 'Solo'}`
    };

    closeBookingModal();

    if (onInitiatePayment) {
      onInitiatePayment(paymentDetails);
    } else if (setTab) {
      localStorage.setItem('gic_pending_payment', JSON.stringify(paymentDetails));
      setTab('payment');
    }
  };

  // Subscriptions
  useEffect(() => {
    const unsubscribeEvents = onSnapshot(collection(db, "events"), (snapshot) => {
      const list: EventPost[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          type: data.type || 'photo',
          mediaUrl: data.mediaUrl || '',
          caption: data.caption || '',
          createdAt: data.createdAt || Date.now()
        });
      });
      list.sort((a, b) => b.createdAt - a.createdAt);
      setPosts(list);
      setLoadingEvents(false);
    }, (error) => {
      console.warn("Events listener error:", error);
      setPosts([]);
      setLoadingEvents(false);
    });

    const unsubscribeTournaments = onSnapshot(collection(db, "tournaments"), (snapshot) => {
      const list: Tournament[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          title: data.title || '',
          type: data.type || 'photo',
          mediaUrl: data.mediaUrl || '',
          caption: data.caption || '',
          price: data.price || 'Free Entry',
          createdAt: data.createdAt || Date.now(),
          eventDate: data.eventDate || '',
          eventTime: data.eventTime || ''
        });
      });
      list.sort((a, b) => b.createdAt - a.createdAt);
      setTournaments(list); // Set list empty if no tournaments posted by admin
      setLoadingTournaments(false);
    }, (error) => {
      console.warn("Tournaments listener error:", error);
      setTournaments([]); // Stay empty on error
      setLoadingTournaments(false);
    });

    return () => {
      unsubscribeEvents();
      unsubscribeTournaments();
    };
  }, []);

  // Lock body scroll and completely hide footer when Tournament Registration modal is active
  useEffect(() => {
    if (selectedTournament) {
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
  }, [selectedTournament]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !gamerTag.trim() || !email.trim() || !phone.trim()) {
      setFormError("Please fill in all required fields!");
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      await addDoc(collection(db, "tournament_bookings"), {
        tournamentId: selectedTournament?.id || 'unknown',
        tournamentTitle: selectedTournament?.title || 'Unknown Tournament',
        name: fullName.trim(),
        gamerTag: gamerTag.trim(),
        email: email.trim(),
        phone: phone.trim(),
        teamName: teamName.trim(),
        createdAt: Date.now()
      });

      setBookingSuccess(true);
    } catch (err) {
      console.error("Booking error:", err);
      setFormError("Failed to register slot: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSubmitting(false);
    }
  };

  const closeBookingModal = () => {
    setSelectedTournament(null);
    setFullName('');
    setGamerTag('');
    setEmail('');
    setPhone('');
    setTeamName('');
    setBookingSuccess(false);
    setFormError('');
    setShowHowToPopup(false);
  };

  return (
    <div className="space-y-20 pt-2 pb-16">
      
      {/* ========================================== */}
      {/* TOURNAMENTS SECTION */}
      {/* ========================================== */}
      {(!loadingTournaments && tournaments.length > 0) && (
        <div className="space-y-12">
          <div className="text-center space-y-3">
            <span className="font-mono text-[#ef4444] text-xs font-semibold tracking-[0.2em] uppercase">GIC CHAMPIONSHIP CENTRAL</span>
            <h2 className="font-['Arial'] text-center font-normal text-2xl sm:text-3xl text-white tracking-tight uppercase">
              Active <span className="text-[#ef4444] font-['Arial'] font-normal not-italic no-underline">Tournaments</span>
            </h2>
            <p className="text-gray-400 text-xs sm:text-sm max-w-xl mx-auto font-sans leading-relaxed">
              Unleash your skills on our elite machines. Join live championships, secure slots, challenge local leaders, and win massive prizes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {tournaments.map((t) => (
              <motion.div 
                key={t.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white/[0.02] border border-red-500/10 rounded-3xl overflow-hidden shadow-2xl hover:border-red-500/35 transition-all duration-300 flex flex-col justify-between group h-full relative"
              >
                {/* Media Container */}
                <div className="relative h-60 bg-black overflow-hidden shrink-0">
                  {renderMediaElement(t.type, t.mediaUrl, t.title)}

                  {/* Badge Overlay */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="bg-red-650/90 font-mono border border-red-500/40 rounded-lg text-[9px] font-bold text-white px-3 py-1 uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
                      <Award className="h-3.5 w-3.5 text-white animate-pulse" />
                      <span>TOURNAMENT</span>
                    </span>
                  </div>

                  {/* Entry Fee overlay */}
                  <div className="absolute bottom-4 right-4 bg-black/90 border border-white/10 rounded-lg text-[10px] font-mono font-bold text-white px-3 py-1 uppercase tracking-wider shadow-lg">
                    Fee: <span className="text-red-400 font-bold">{t.price}</span>
                  </div>
                </div>

                {/* Info & Action Body */}
                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <h3 className="font-display font-medium text-xl text-white tracking-wide uppercase italic">
                      {t.title}
                    </h3>
                    <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-line">
                      {t.caption}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 text-left">
                      {t.eventDate && (
                        <div className="text-[10px] font-mono text-gray-300 flex items-center gap-1.5 uppercase font-semibold">
                          <Calendar className="h-3.5 w-3.5 text-red-500 shrink-0" />
                          <span>Date: {t.eventDate}</span>
                        </div>
                      )}
                      {t.eventTime && (
                        <div className="text-[10px] font-mono text-gray-300 flex items-center gap-1.5 uppercase font-semibold">
                          <Clock className="h-3.5 w-3.5 text-red-500 shrink-0" />
                          <span>Time: {t.eventTime}</span>
                        </div>
                      )}
                      <div className="text-[8px] font-mono text-gray-600 uppercase tracking-wide">
                        Posted: {new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedTournament(t)}
                      className="bg-red-600 hover:bg-red-500 text-white font-mono text-[10px] font-bold tracking-widest uppercase px-4 py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:shadow-lg hover:shadow-red-950/20 w-full sm:w-auto"
                    >
                      <span>Register Slot</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-white/[0.04] my-4" />

      {/* ========================================== */}
      {/* BULLETIN FEED SECTION (EXISTING) */}
      {/* ========================================== */}
      <div className="space-y-12">
        <div className="text-center space-y-3">
          <span className="font-mono text-[#ef4444] text-xs font-semibold tracking-[0.2em] uppercase">LIVE COMMUNIQUE &amp; BULLETIN</span>
          <h2 className="font-['Arial'] text-center font-normal text-2xl sm:text-3xl text-white tracking-tight uppercase">
            Feed &amp; <span className="text-[#ef4444] font-['Arial'] font-normal not-italic no-underline">Events</span>
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm max-w-xl mx-auto font-sans leading-relaxed">
            Stay synchronized with real-time tournament logs, video relays, match replays, and bulletin announcements posted directly by the control room.
          </p>
        </div>

        {loadingEvents ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <div className="h-8 w-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
            <p className="text-xs text-gray-500 font-mono uppercase tracking-widest">LOADING LIVE BULLETIN DATASTREAM...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="max-w-md mx-auto text-center border border-dashed border-white/10 rounded-2xl p-12 space-y-4 bg-white/[0.01]">
            <div className="h-12 w-12 rounded-full bg-red-500/10 border border-red-500/25 mx-auto flex items-center justify-center text-red-500">
              <Swords className="h-5 w-5" />
            </div>
            <p className="text-xs text-gray-400 font-mono uppercase tracking-wider leading-relaxed">
              No bulletin events are currently listed. Check back for elite live streams and broadcasts!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <motion.div 
                key={post.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden shadow-xl hover:border-[#ef4444]/20 transition-all duration-300 flex flex-col justify-between group h-full"
              >
                {/* Media Container */}
                <div className="relative h-64 bg-black overflow-hidden shrink-0">
                  {renderMediaElement(post.type, post.mediaUrl, post.caption)}

                  {/* Badge Overlay */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="bg-black/80 font-mono border border-white/10 rounded-lg text-[9px] font-bold text-[#ef4444] px-2.5 py-1 uppercase tracking-widest flex items-center gap-1.5">
                      {post.type === 'photo' ? <Image className="h-3 w-3" /> : <Film className="h-3 w-3" />}
                      <span>{post.type === 'photo' ? 'IMAGE' : 'VIDEO BROADCAST'}</span>
                    </span>
                  </div>
                </div>

                {/* Text / Captions block */}
                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-gray-300 font-sans leading-relaxed flex-1 whitespace-pre-line">
                    {post.caption}
                  </p>

                  <div className="border-t border-white/[0.04] pt-4 flex items-center justify-between text-[10px] font-mono text-gray-500">
                    <span className="flex items-center gap-1.5 uppercase font-medium">
                      <Calendar className="h-3.5 w-3.5 text-[#ef4444]" />
                      <span>{new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </span>
                    <span className="uppercase text-[9px]">GIC TRANSMITTED</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* REGISTRATION MODAL */}
      {/* ========================================== */}
      <AnimatePresence>
        {selectedTournament && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100000]"
              onClick={closeBookingModal}
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-[100001] bg-[#0b0c10] border border-red-500/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl shadow-red-950/80 my-8"
            >
              {/* Close Button */}
              <button 
                onClick={closeBookingModal}
                className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white rounded-full bg-white/[0.02] hover:bg-white/5 transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              {bookingSuccess ? (
                <div className="text-center py-4 space-y-4">
                  <div className="h-10 w-10 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-display font-medium text-lg sm:text-xl text-white uppercase tracking-wider">
                      Registration Submitted!
                    </h3>
                    <p className="text-[11px] text-gray-400 max-w-sm mx-auto leading-relaxed">
                      Your tournament slot is drafted. To confirm your entry, proceed with the final steps using our WhatsApp backplane.
                    </p>
                  </div>

                  {/* HOW TO PROMPT (Mandated) */}
                  <div className="bg-red-950/10 border border-red-900/30 rounded-xl p-3.5 text-left space-y-2">
                    <span className="text-[9px] font-mono text-red-400 font-bold tracking-widest uppercase flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5" />
                      <span>CRITICAL NEXT STEPS REQUIRED</span>
                    </span>
                    <ol className="text-[11px] text-gray-300 font-sans space-y-1.5 list-decimal pl-4 leading-relaxed">
                      <li>
                        <strong className="text-white">Form Submission</strong>: Your registration details are logged in our secure datastore.
                      </li>
                      <li>
                        <strong className="text-white">Complete Payment</strong>: Send the slot entry fee (<span className="text-red-400 font-mono font-bold">{selectedTournament.price}</span>) via our digital channel and capture a transaction screenshot.
                      </li>
                      <li>
                        <strong className="text-white">WhatsApp Transmission</strong>: Send us the payment screenshot on WhatsApp with your GamerTag.
                      </li>
                      <li>
                        <strong className="text-white">Store Verification</strong>: When you come to our store, show your payment screenshot to our front desk to receive your physical tournament badge!
                      </li>
                    </ol>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    {/* Primary Direct Payment Button */}
                    <button
                      type="button"
                      onClick={handleProceedToPayment}
                      className="w-full bg-gradient-to-r from-red-600 via-red-500 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white rounded-xl py-2.5 px-4 text-[11px] font-mono font-bold uppercase tracking-wider text-center flex items-center justify-center gap-2 shadow-lg shadow-red-950/60 active:scale-[0.99] transition-all cursor-pointer border border-red-400/30"
                    >
                      <CreditCard className="h-3.5 w-3.5 text-white" />
                      <span>Payment Now ({selectedTournament.price})</span>
                    </button>

                    {/* Close Action */}
                    <div>
                      <button 
                        onClick={closeBookingModal}
                        className="w-full bg-white/[0.04] hover:bg-white/10 text-gray-300 border border-white/10 rounded-xl py-2.5 text-[11px] font-mono uppercase tracking-wider cursor-pointer transition-colors"
                      >
                        Close Window
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Title & Info Button */}
                  <div className="space-y-1.5 text-left pr-8">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-red-950/40 text-red-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded border border-red-900/50 uppercase tracking-widest">
                        TOURNAMENT REGISTRATION
                      </span>
                      
                      {/* Mandated Info Button */}
                      <button
                        onClick={() => setShowHowToPopup(!showHowToPopup)}
                        className="p-1 text-gray-400 hover:text-red-400 rounded-full bg-white/[0.02] hover:bg-red-500/10 border border-white/5 transition-all cursor-pointer flex items-center justify-center"
                        title="How to Register"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </div>

                    <h3 className="font-sans font-black text-2xl text-white uppercase tracking-tight leading-none">
                      {selectedTournament.title}
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      Complete form registration below. Entry Fee: <span className="text-red-400 font-mono font-bold">{selectedTournament.price}</span>
                    </p>
                  </div>

                  {/* HOW TO FLOATING PANEL (When info button clicked) */}
                  <AnimatePresence>
                    {showHowToPopup && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-red-950/20 border border-red-500/25 p-4 rounded-2xl text-left space-y-3 shadow-inner">
                          <div className="flex justify-between items-center border-b border-red-950/40 pb-1.5">
                            <span className="text-[10px] font-mono text-red-400 font-black uppercase tracking-wider flex items-center gap-1">
                              <Info className="h-3.5 w-3.5" />
                              <span>How to Register Guide</span>
                            </span>
                            <button 
                              onClick={() => setShowHowToPopup(false)}
                              className="text-gray-500 hover:text-gray-300 text-[10px] font-mono"
                            >
                              [HIDE]
                            </button>
                          </div>
                          <ul className="text-xs text-gray-300 space-y-2 list-none">
                            <li className="flex gap-2">
                              <span className="text-red-400 font-mono font-bold">1.</span>
                              <span>How to form club / Fill up this secure registration form.</span>
                            </li>
                            <li className="flex gap-2">
                              <span className="text-red-400 font-mono font-bold">2.</span>
                              <span>Complete entry fee payment and capture a clear payment screenshot.</span>
                            </li>
                            <li className="flex gap-2">
                              <span className="text-red-400 font-mono font-bold">3.</span>
                              <span>Send us the payment screenshot via WhatsApp with your GamerTag.</span>
                            </li>
                            <li className="flex gap-2">
                              <span className="text-red-400 font-mono font-bold">4.</span>
                              <span>When you come to our store, show your payment screenshot to us to claim your slot!</span>
                            </li>
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Booking Form */}
                  <form onSubmit={handleRegister} className="space-y-4 text-left">
                    {formError && (
                      <p className="p-3 bg-red-950/25 text-red-400 text-xs rounded-xl font-mono border border-red-950/60">
                        ⚠️ ERROR: {formError}
                      </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block font-bold">
                          Full Name *
                        </label>
                        <input 
                          type="text" 
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder=""
                          className="w-full bg-black border border-white/10 focus:border-red-500 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block font-bold">
                          Gamer Tag *
                        </label>
                        <input 
                          type="text" 
                          required
                          value={gamerTag}
                          onChange={(e) => setGamerTag(e.target.value)}
                          placeholder=""
                          className="w-full bg-black border border-white/10 focus:border-red-500 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block font-bold">
                          Email Address *
                        </label>
                        <input 
                          type="email" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder=""
                          className="w-full bg-black border border-white/10 focus:border-red-500 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block font-bold">
                          Phone Number *
                        </label>
                        <input 
                          type="tel" 
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder=""
                          className="w-full bg-black border border-white/10 focus:border-red-500 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block font-bold">
                        Team Name (Optional)
                      </label>
                      <input 
                        type="text" 
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder=""
                        className="w-full bg-black border border-white/10 focus:border-red-500 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xl py-3.5 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {submitting ? "Registering slot..." : "Confirm & Register Slot"}
                    </button>
                  </form>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
