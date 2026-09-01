import React, { useState, useEffect } from 'react';
import { 
  Lock, User, AlertTriangle, Trash2, RefreshCw, 
  TrendingUp, Users, IndianRupee, Calendar, LogOut, 
  Search, PlusCircle, ShieldCheck, Gamepad2, Sword, Target, Sparkles, Flame,
  Video, Image, Play, Upload, X, Film, ImagePlus, Mail, Megaphone, Send, BellRing,
  Info, Swords, Trophy, ChevronLeft, ChevronRight, ChevronDown, Check, Layers
} from 'lucide-react';
import { STATIONS, GAMING_PACKAGES } from '../data';
import { Booking } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, getDocs, onSnapshot, getDocsFromServer, addDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { renderMediaElement } from './EventView';

interface FirebaseGamer {
  uid: string;
  name: string;
  email: string;
  phone: string;
  createdAt?: string;
  status?: string;
  lastActive?: number;
  profilePic?: string;
  gamerTag?: string;
  clanName?: string;
  favoriteGame?: string;
  activeWeapon?: string;
  motto?: string;
  profileId?: string;
  firstName?: string;
  lastName?: string;
}

const compressImage = (file: File, maxWidth = 1280, maxHeight = 800, quality = 0.72): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = document.createElement('img');
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => {
        reject(err);
      };
    };
    reader.onerror = (err) => {
      reject(err);
    };
  });
};

const base64ToBlob = (base64Data: string): Blob => {
  const parts = base64Data.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  return new Blob([uInt8Array], { type: contentType });
};

const PRESET_AVATARS = [
  { id: 'preset-spiderman', gradient: 'from-red-600 via-blue-900 to-black', text: '🕷️', label: 'Spider-Man' },
  { id: 'preset-kratos', gradient: 'from-zinc-400 via-stone-850 to-red-900', text: '🪓', label: 'Kratos' },
  { id: 'preset-chief', gradient: 'from-emerald-700 via-stone-900 to-amber-600', text: '🪐', label: 'Master Chief' },
  { id: 'preset-geralt', gradient: 'from-slate-400 via-neutral-900 to-zinc-950', text: '🐺', label: 'Geralt' },
  { id: 'preset-jett', gradient: 'from-sky-300 via-sky-950 to-slate-900', text: '💨', label: 'Jett' },
  { id: 'preset-doom', gradient: 'from-green-805 via-stone-950 to-red-950', text: '🔥', label: 'Doom Slayer' },
  { id: 'preset-arthur', gradient: 'from-amber-800 via-stone-900 to-orange-950', text: '🤠', label: 'Arthur' },
  { id: 'preset-ezio', gradient: 'from-zinc-100 via-rose-900 to-zinc-950', text: '🦅', label: 'Ezio' },
  { id: 'preset-steve', gradient: 'from-teal-600 via-emerald-950 to-stone-950', text: '🧱', label: 'Steve' },
  { id: 'preset-mario', gradient: 'from-red-600 via-amber-500 to-red-950', text: '🍄', label: 'Mario' },
];

export default function AdminView() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'bookings' | 'users' | 'events' | 'hero' | 'tournaments'>('bookings');
  const [eventSubTab, setEventSubTab] = useState<'bulletins' | 'tournaments'>('bulletins');
  const [isSectionDropdownOpen, setIsSectionDropdownOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [simulatedLoad, setSimulatedLoad] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSectionDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Real-time Event Posts state
  const [eventPosts, setEventPosts] = useState<any[]>([]);
  
  // Category 1: Photo Form States
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [photoPreset, setPhotoPreset] = useState(''); 
  const [photoFileBase64, setPhotoFileBase64] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [postingPhoto, setPostingPhoto] = useState(false);
  
  // Category 2: Video Form States
  const [videoCaption, setVideoCaption] = useState('');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [videoPreset, setVideoPreset] = useState('');
  const [videoFileBase64, setVideoFileBase64] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [postingVideo, setPostingVideo] = useState(false);

  // Custom Dynamic Hero states
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);

  // Tournaments state
  const [tourneyFile, setTourneyFile] = useState<File | null>(null);

  const uploadToServer = async (fileOrBase64: File | string, onProgress?: (pct: number) => void): Promise<string> => {
    let fileToUpload: File;

    if (typeof fileOrBase64 === 'string') {
      if (fileOrBase64.startsWith('/uploads/') || fileOrBase64.startsWith('http://') || fileOrBase64.startsWith('https://')) {
        return fileOrBase64;
      }
      if (fileOrBase64.startsWith('data:')) {
        const res = await fetch(fileOrBase64);
        const blob = await res.blob();
        const mime = blob.type || 'image/jpeg';
        const ext = mime.split('/')[1] || 'jpg';
        fileToUpload = new File([blob], `media-${Date.now()}.${ext}`, { type: mime });
      } else {
        return fileOrBase64;
      }
    } else {
      fileToUpload = fileOrBase64;
    }

    return new Promise((resolve, reject) => {
      const rawExt = fileToUpload.name.split('.').pop() || '';
      let extension = rawExt.toLowerCase();
      if (!extension) {
        if (fileToUpload.type.includes('mp4')) extension = 'mp4';
        else if (fileToUpload.type.includes('webm')) extension = 'webm';
        else if (fileToUpload.type.includes('quicktime')) extension = 'mov';
        else if (fileToUpload.type.includes('jpeg')) extension = 'jpg';
        else if (fileToUpload.type.includes('png')) extension = 'png';
        else extension = 'mp4';
      }

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload', true);
      xhr.setRequestHeader('Content-Type', fileToUpload.type || 'video/mp4');
      xhr.setRequestHeader('X-File-Extension', extension);

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data.url);
          } catch (err) {
            reject(new Error("Invalid JSON response from server upload endpoint"));
          }
        } else {
          if (xhr.status === 413 || (xhr.responseText && xhr.responseText.includes('413 Request Entity Too Large'))) {
            reject(new Error("File size is too large for the upload stream (HTTP 413). Please upload a smaller file or use a direct URL."));
          } else {
            const cleanText = (xhr.responseText || '').replace(/<[^>]*>?/gm, '').trim();
            reject(new Error(cleanText || `Upload failed with HTTP status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => reject(new Error("Network connection error during file upload"));
      xhr.ontimeout = () => reject(new Error("Upload operation timed out"));
      xhr.send(fileToUpload);
    });
  };
  
  // Dual Dynamic Hero Image Configuration states (Supports 2 Hero Slides)
  const [slide1File, setSlide1File] = useState<File | null>(null);
  const [slide1FileBase64, setSlide1FileBase64] = useState('');
  const [slide1UrlInput, setSlide1UrlInput] = useState('');
  const [slide1Preset, setSlide1Preset] = useState('');
  const [showSlide1Url, setShowSlide1Url] = useState(false);
  const [showSlide1Presets, setShowSlide1Presets] = useState(false);

  const [slide2File, setSlide2File] = useState<File | null>(null);
  const [slide2FileBase64, setSlide2FileBase64] = useState('');
  const [slide2UrlInput, setSlide2UrlInput] = useState('');
  const [slide2Preset, setSlide2Preset] = useState('');
  const [showSlide2Url, setShowSlide2Url] = useState(false);
  const [showSlide2Presets, setShowSlide2Presets] = useState(false);

  const [isUpdatingHero, setIsUpdatingHero] = useState(false);
  const [currentHeroImageOnDb, setCurrentHeroImageOnDb] = useState<string | null>(null);
  const [currentHeroImagesOnDb, setCurrentHeroImagesOnDb] = useState<string[]>([]);
  const [adminPreviewSlideIndex, setAdminPreviewSlideIndex] = useState(0);

  // Tournaments states
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [tournamentBookings, setTournamentBookings] = useState<any[]>([]);
  const [tourneyTitle, setTourneyTitle] = useState('');
  const [tourneyType, setTourneyType] = useState<'photo' | 'video'>('photo');
  const [tourneyCaption, setTourneyCaption] = useState('');
  const [tourneyPrice, setTourneyPrice] = useState('');
  const [tourneyMediaUrlInput, setTourneyMediaUrlInput] = useState('');
  const [tourneyFileBase64, setTourneyFileBase64] = useState('');
  const [tourneyDate, setTourneyDate] = useState('');
  const [tourneyTime, setTourneyTime] = useState('');
  const [postingTourney, setPostingTourney] = useState(false);
  const [tourneySuccessMsg, setTourneySuccessMsg] = useState('');
  const [tourneyErrorMsg, setTourneyErrorMsg] = useState('');
  const [showTourneyUrl, setShowTourneyUrl] = useState(false);

  const [eventErrorMsg, setEventErrorMsg] = useState('');
  const [eventSuccessMsg, setEventSuccessMsg] = useState('');

  // Toggles for premium inputs
  const [showPhotoUrl, setShowPhotoUrl] = useState(false);
  const [showPhotoPresets, setShowPhotoPresets] = useState(false);
  const [showVideoUrl, setShowVideoUrl] = useState(false);
  const [showVideoPresets, setShowVideoPresets] = useState(false);

  // Fallback constants for admin list when quota exceeded or database is empty/unreachable
  const FALLBACK_EVENTS = [
    {
      id: "fb-1",
      type: "photo",
      mediaUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800",
      caption: "🏆 DAILY ELITE MATCHMAKING MATCHES 🏆\n\nTake part in daily elite tournaments on our high-tier 240Hz esports machines in the cage arena. Drop in, register your team, and challenge active leaderboards or log instant bookings to hold your slot!",
      createdAt: Date.now() - 3600000 * 2
    },
    {
      id: "fb-2",
      type: "photo",
      mediaUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=800",
      caption: "💥 HARDWARE ALERT: RTX 4090 STATIONS ARE LIVE 💥\n\nDesk #1 to Desk #6 have been fully upgraded with RTX 4095 GPUs. Zero stutter, pristine responsiveness, extreme speed. Book your hourly station instantly!",
      createdAt: Date.now() - 3600000 * 26
    }
  ];

  const FALLBACK_USERS: FirebaseGamer[] = [
    {
      uid: "fb-u1",
      name: "Aarav Sharma",
      email: "aarav.sharma@gmail.com",
      phone: "98765 43210",
      createdAt: "6/15/2026",
      status: "online",
      lastActive: Date.now() - 5000,
      profilePic: "",
      gamerTag: "CYBER_STRIKER",
      clanName: "RED_VORTEX",
      favoriteGame: "Valorant",
      activeWeapon: "Vandal",
      motto: "Unseen. Unheard. Unbeaten.",
      profileId: "84532109",
      firstName: "Aarav",
      lastName: "Sharma"
    },
    {
      uid: "fb-u2",
      name: "Kabir Mehta",
      email: "kabir.m@gmail.com",
      phone: "98123 45678",
      createdAt: "6/16/2026",
      status: "offline",
      lastActive: Date.now() - 3600000 * 4,
      profilePic: "",
      gamerTag: "VORTEX_SNIPER",
      clanName: "RED_VORTEX",
      favoriteGame: "Counter Strike 2",
      activeWeapon: "AWP",
      motto: "One shot. One kill.",
      profileId: "47291038",
      firstName: "Kabir",
      lastName: "Mehta"
    },
    {
      uid: "fb-u3",
      name: "Rohan Das",
      email: "rohan.das@gmail.com",
      phone: "98234 56789",
      createdAt: "6/18/2026",
      status: "online",
      lastActive: Date.now() - 15000,
      profilePic: "",
      gamerTag: "CHRONO_TRIGGER",
      clanName: "SANDBOX_CLAN",
      favoriteGame: "Apex Legends",
      activeWeapon: "Wingman",
      motto: "Break the timeline.",
      profileId: "10984321",
      firstName: "Rohan",
      lastName: "Das"
    }
  ];

  // Live subscription for event posts
  useEffect(() => {
    if (!isAdminLoggedIn) return;
    const unsubscribeEvents = onSnapshot(collection(db, "events"), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setEventPosts(list);
    }, (error) => {
      console.warn("Live events snapshot error:", error);
      handleFirestoreError(error, OperationType.GET, "events");
    });
    return () => unsubscribeEvents();
  }, [isAdminLoggedIn]);

  // Live subscription for current hero image setting
  useEffect(() => {
    if (!isAdminLoggedIn) return;
    const unsubscribeHero = onSnapshot(doc(db, "settings", "hero"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.heroImages && Array.isArray(data.heroImages) && data.heroImages.length > 0) {
          setCurrentHeroImagesOnDb(data.heroImages);
          setCurrentHeroImageOnDb(data.heroImages[0] || null);
        } else if (data.heroImageUrl) {
          setCurrentHeroImagesOnDb([data.heroImageUrl]);
          setCurrentHeroImageOnDb(data.heroImageUrl);
        } else {
          setCurrentHeroImagesOnDb([]);
          setCurrentHeroImageOnDb(null);
        }
      } else {
        setCurrentHeroImagesOnDb([]);
        setCurrentHeroImageOnDb(null);
      }
    }, (error) => {
      console.warn("Error subscribing to current hero image setting status:", error);
      handleFirestoreError(error, OperationType.GET, "settings/hero");
    });
    return () => unsubscribeHero();
  }, [isAdminLoggedIn]);

  // Live subscription for tournaments
  useEffect(() => {
    if (!isAdminLoggedIn) return;
    const unsubscribeTournaments = onSnapshot(collection(db, "tournaments"), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setTournaments(list);
    }, (error) => {
      console.warn("Live tournaments snapshot error:", error);
      handleFirestoreError(error, OperationType.GET, "tournaments");
    });
    return () => unsubscribeTournaments();
  }, [isAdminLoggedIn]);

  // Live subscription for tournament bookings
  useEffect(() => {
    if (!isAdminLoggedIn) return;
    const unsubscribeTourneyBookings = onSnapshot(collection(db, "tournament_bookings"), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setTournamentBookings(list);
    }, (error) => {
      console.warn("Live tournament bookings snapshot error:", error);
      handleFirestoreError(error, OperationType.GET, "tournament_bookings");
    });
    return () => unsubscribeTourneyBookings();
  }, [isAdminLoggedIn]);

  const handlePostTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tourneyTitle.trim()) {
      setTourneyErrorMsg("Please write a tournament title!");
      return;
    }
    if (!tourneyCaption.trim()) {
      setTourneyErrorMsg("Please write a tournament caption!");
      return;
    }
    if (!tourneyPrice.trim()) {
      setTourneyErrorMsg("Please write an entry fee/price!");
      return;
    }
    
    let media = tourneyMediaUrlInput || tourneyFileBase64;
    if (!media && !tourneyFile) {
      setTourneyErrorMsg("Please choose a tournament photo banner!");
      return;
    }
    
    setPostingTourney(true);
    setTourneyErrorMsg('');
    setTourneySuccessMsg('');
    
    try {
      if (tourneyFile) {
        setTourneySuccessMsg("Compressing and saving tournament banner...");
        try {
          media = await compressImage(tourneyFile, 1280, 800, 0.75);
        } catch (compErr) {
          console.warn("Image compression failed, using base64 buffer:", compErr);
          if (tourneyFileBase64 && tourneyFileBase64.startsWith('data:image')) {
            media = tourneyFileBase64;
          } else {
            throw compErr;
          }
        }
      }

      setTourneySuccessMsg("Publishing tournament banner...");

      try {
        await addDoc(collection(db, "tournaments"), {
          title: tourneyTitle.trim(),
          type: 'photo',
          mediaUrl: media,
          caption: tourneyCaption.trim(),
          price: tourneyPrice.trim(),
          createdAt: Date.now(),
          eventDate: tourneyDate || '',
          eventTime: tourneyTime || ''
        });
      } catch (dbErr) {
        handleFirestoreError(dbErr, OperationType.CREATE, "tournaments");
        return;
      }
      
      setTourneySuccessMsg("✓ Tournament published successfully!");
      setTourneyTitle('');
      setTourneyCaption('');
      setTourneyPrice('');
      setTourneyMediaUrlInput('');
      setTourneyFileBase64('');
      setTourneyFile(null);
      setTourneyDate('');
      setTourneyTime('');
      setTimeout(() => setTourneySuccessMsg(''), 4000);
    } catch (error) {
      console.error("Error posting tournament:", error);
      const msg = error instanceof Error ? error.message : String(error);
      setTourneyErrorMsg(msg || "Failed to publish tournament.");
    } finally {
      setPostingTourney(false);
    }
  };

  const handleDeleteTournament = async (id: string) => {
    try {
      await deleteDoc(doc(db, "tournaments", id));
      setTourneySuccessMsg("Tournament deleted successfully!");
      setTimeout(() => setTourneySuccessMsg(''), 3000);
    } catch (error) {
      console.error("Error deleting tournament:", error);
      setTourneyErrorMsg("Failed to delete tournament: " + (error instanceof Error ? error.message : String(error)));
      setTimeout(() => setTourneyErrorMsg(''), 4000);
      handleFirestoreError(error, OperationType.DELETE, `tournaments/${id}`);
    }
  };

  const handleDeleteTourneyBooking = async (id: string) => {
    try {
      await deleteDoc(doc(db, "tournament_bookings", id));
      setTourneySuccessMsg("Booking record deleted!");
      setTimeout(() => setTourneySuccessMsg(''), 3000);
    } catch (error) {
      console.error("Error deleting booking:", error);
      setTourneyErrorMsg("Failed to delete booking: " + (error instanceof Error ? error.message : String(error)));
      setTimeout(() => setTourneyErrorMsg(''), 4000);
      handleFirestoreError(error, OperationType.DELETE, `tournament_bookings/${id}`);
    }
  };

  const handleUpdateHeroImage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsUpdatingHero(true);
    setEventErrorMsg('');
    setEventSuccessMsg('');
    
    try {
      // Resolve Slide 1 image: prioritize persistent Base64 / Preset / URL
      let s1 = slide1Preset || slide1UrlInput || slide1FileBase64;
      if (!s1 && slide1File) {
        try {
          s1 = await compressImage(slide1File, 1280, 800, 0.72);
        } catch (compErr) {
          console.error("Slide 1 compression error:", compErr);
        }
      }
      if (!s1 && currentHeroImagesOnDb[0] && !currentHeroImagesOnDb[0].startsWith('/uploads/')) {
        s1 = currentHeroImagesOnDb[0];
      }

      // Resolve Slide 2 image: prioritize persistent Base64 / Preset / URL
      let s2 = slide2Preset || slide2UrlInput || slide2FileBase64;
      if (!s2 && slide2File) {
        try {
          s2 = await compressImage(slide2File, 1280, 800, 0.72);
        } catch (compErr) {
          console.error("Slide 2 compression error:", compErr);
        }
      }
      if (!s2 && currentHeroImagesOnDb[1] && !currentHeroImagesOnDb[1].startsWith('/uploads/')) {
        s2 = currentHeroImagesOnDb[1];
      }

      const finalImages = [s1, s2].filter(Boolean) as string[];

      if (finalImages.length === 0) {
        setEventErrorMsg("Please select or upload at least one image for the homepage hero carousel!");
        setIsUpdatingHero(false);
        return;
      }

      try {
        await setDoc(doc(db, "settings", "hero"), {
          heroImageUrl: finalImages[0] || "",
          heroImages: finalImages,
          updatedAt: Date.now()
        });
      } catch (dbErr) {
        handleFirestoreError(dbErr, OperationType.WRITE, "settings/hero");
        return;
      }
      
      setEventSuccessMsg("Hero Carousel Photos (Dual Slides) permanently saved to database!");
      setSlide1UrlInput('');
      setSlide1Preset('');
      setSlide1FileBase64('');
      setSlide1File(null);
      setSlide2UrlInput('');
      setSlide2Preset('');
      setSlide2FileBase64('');
      setSlide2File(null);
      setTimeout(() => setEventSuccessMsg(''), 4000);
    } catch (error) {
      console.error("Error setting custom hero images:", error);
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('413') || msg.toLowerCase().includes('too large')) {
        setEventErrorMsg("One of the selected images is too large. Please use a compressed image or URL.");
      } else {
        setEventErrorMsg("Failed to update Hero images: " + msg);
      }
    } finally {
      setIsUpdatingHero(false);
    }
  };

  const handleResetHeroImage = async () => {
    setIsUpdatingHero(true);
    setEventErrorMsg('');
    setEventSuccessMsg('');
    try {
      await setDoc(doc(db, "settings", "hero"), {
        heroImageUrl: "",
        heroImages: [],
        updatedAt: Date.now()
      });
      setEventSuccessMsg("Hero Carousel reset to default images successfully!");
      setSlide1UrlInput('');
      setSlide1Preset('');
      setSlide1FileBase64('');
      setSlide1File(null);
      setSlide2UrlInput('');
      setSlide2Preset('');
      setSlide2FileBase64('');
      setSlide2File(null);
      setTimeout(() => setEventSuccessMsg(''), 4000);
    } catch (error) {
      console.error("Error resetting hero image:", error);
      setEventErrorMsg("Failed to reset: " + (error instanceof Error ? error.message : String(error)));
      handleFirestoreError(error, OperationType.WRITE, "settings/hero");
    } finally {
      setIsUpdatingHero(false);
    }
  };
  
  // Registered players state from Firebase
  const [registeredUsers, setRegisteredUsers] = useState<FirebaseGamer[]>([]);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [pingedStation, setPingedStation] = useState<string | null>(null);
  
  const [pendingDeleteUserId, setPendingDeleteUserId] = useState<string | null>(null);

  // Notifications states
  const [expandedNotificationUserId, setExpandedNotificationUserId] = useState<string | null>(null);
  const [notificationTitleMap, setNotificationTitleMap] = useState<Record<string, string>>({});
  const [notificationTextMap, setNotificationTextMap] = useState<Record<string, string>>({});
  
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  const handleSendNotification = async (userId: string) => {
    const title = notificationTitleMap[userId]?.trim() || "ADMIN ANNOUNCEMENT";
    const text = notificationTextMap[userId]?.trim();
    if (!text) return;

    try {
      const notifRef = doc(collection(db, 'users', userId, 'notifications'));
      await setDoc(notifRef, {
        id: notifRef.id,
        title,
        message: text,
        createdAt: Date.now(),
        viewed: false
      });
      // Clear inputs
      setNotificationTitleMap(prev => ({ ...prev, [userId]: '' }));
      setNotificationTextMap(prev => ({ ...prev, [userId]: '' }));
      setExpandedNotificationUserId(null);
    } catch (err) {
      console.error("Failed to send notification to user:", err);
      handleFirestoreError(err, OperationType.WRITE, `users/${userId}/notifications`);
    }
  };

  const handleBroadcastNotification = async () => {
    if (!broadcastMessage.trim()) return;
    setIsBroadcasting(true);
    setBroadcastSuccess(false);

    const title = broadcastTitle.trim() || "SYSTEM BROADCAST";
    const message = broadcastMessage.trim();

    try {
      for (const user of registeredUsers) {
        if (!user.uid || user.uid.startsWith('fb-')) continue;
        try {
          const notifRef = doc(collection(db, 'users', user.uid, 'notifications'));
          await setDoc(notifRef, {
            id: notifRef.id,
            title,
            message,
            createdAt: Date.now(),
            viewed: false
          });
        } catch (innerErr) {
          console.error(`Failed to send broadcast to user ${user.uid}:`, innerErr);
          handleFirestoreError(innerErr, OperationType.WRITE, `users/${user.uid}/notifications`);
        }
      }

      setBroadcastTitle('');
      setBroadcastMessage('');
      setBroadcastSuccess(true);
      setTimeout(() => setBroadcastSuccess(false), 5000);
    } catch (err) {
      console.error("Failed to broadcast notifications:", err);
      handleFirestoreError(err, OperationType.WRITE, "users/broadcast/notifications");
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      if (!userId.startsWith('fb-')) {
        await deleteDoc(doc(db, "users", userId));
      }
      setRegisteredUsers(prev => prev.filter(u => u.uid !== userId));
      setPendingDeleteUserId(null);
    } catch (err) {
      console.error("Error deleting user profile document:", err);
      handleFirestoreError(err, OperationType.DELETE, `users/${userId}`);
    }
  };

  // Manual booking states
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newStationId, setNewStationId] = useState(STATIONS[0].id);
  const [newHours, setNewHours] = useState(2);
  const [newTimeSlot, setNewTimeSlot] = useState('11:00 AM');
  const [adminBookingMsg, setAdminBookingMsg] = useState('');

  // Real-time ticking & auto-purge for rejected bookings
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
            setBookings(filteredList);
          } else {
            // Keep state in sync with local storage
            setBookings(currentList);
          }
        } catch (e) {
          console.error("Failed to sync/parse bookings in AdminView", e);
        }
      }
    };

    // Run immediately
    checkAndPurgeExpired();

    const interval = setInterval(() => {
      setTicker(prev => prev + 1);
      checkAndPurgeExpired();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loggedIn = sessionStorage.getItem('gic_admin_authenticated') === 'true';
    if (loggedIn) {
      setIsAdminLoggedIn(true);
    }
    loadReservations();
  }, []);

  useEffect(() => {
    if (!isAdminLoggedIn) return;

    setIsFetchingUsers(true);

    // Live subscription for instant updates on the Admin panel
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const fetched: FirebaseGamer[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetched.push({
          uid: data.uid || doc.id,
          name: data.name || 'Unknown Gamer',
          email: data.email || 'No email',
          phone: data.phone || 'No phone',
          createdAt: data.createdAt || 'N/A',
          status: data.status || 'offline',
          lastActive: data.lastActive || 0,
          profilePic: data.profilePic || '',
          gamerTag: data.gamerTag || '',
          clanName: data.clanName || '',
          favoriteGame: data.favoriteGame || '',
          activeWeapon: data.activeWeapon || '',
          motto: data.motto || '',
          profileId: data.profileId || '',
          firstName: data.firstName || '',
          lastName: data.lastName || ''
        });
      });
      setRegisteredUsers(fetched.length > 0 ? fetched : FALLBACK_USERS);
      setIsFetchingUsers(false);
    }, (error) => {
      console.warn("Live users listener error (handled gracefully, falling back to cached list):", error);
      setRegisteredUsers(FALLBACK_USERS);
      setIsFetchingUsers(false);
      handleFirestoreError(error, OperationType.GET, "users");
    });

    return () => unsubscribe();
  }, [isAdminLoggedIn]);

  const loadFirebaseUsers = () => {
    // Highly efficient fake-trigger backplane sync effect; actual data is handled in real-time by onSnapshot
    setIsFetchingUsers(true);
    setTimeout(() => {
      setIsFetchingUsers(false);
    }, 400);
  };

  const renderGamerAvatar = (pic: string, name: string) => {
    if (pic && pic.startsWith('PRESET:')) {
      const presetId = pic.split(':')[1];
      const preset = PRESET_AVATARS.find(p => p.id === presetId) || PRESET_AVATARS[0];
      return (
        <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${preset.gradient} border border-red-600/40 flex items-center justify-center text-xl shadow-inner shrink-0`}>
          <span>{preset.text}</span>
        </div>
      );
    } else if (pic) {
      return (
        <img 
          src={pic} 
          alt={name} 
          className="w-14 h-14 rounded-full object-cover border border-red-600/40 shadow-sm shrink-0"
          referrerPolicy="no-referrer"
        />
      );
    } else {
      return (
        <div className="w-14 h-14 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-red-500 font-bold font-mono text-lg shrink-0 shadow-inner">
          {name.charAt(0).toUpperCase()}
        </div>
      );
    }
  };

  const loadReservations = () => {
    const stored = localStorage.getItem('gic_bookings');
    if (stored) {
      try {
        setBookings(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const targetEmail = 'gameincage@gmail.com';
    const targetPassword = 'Arka@25';

    if (email.trim().toLowerCase() === targetEmail.toLowerCase() && password === targetPassword) {
      setIsAdminLoggedIn(true);
      sessionStorage.setItem('gic_admin_authenticated', 'true');
    } else {
      setLoginError('Incorrect email or password combination.');
    }
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem('gic_admin_authenticated');
    setEmail('');
    setPassword('');
  };

  const handleDeleteBooking = (id: string) => {
    const filtered = bookings.filter(b => b.id !== id);
    setBookings(filtered);
    localStorage.setItem('gic_bookings', JSON.stringify(filtered));
  };

  const handleApproveBooking = async (id: string) => {
    const bookingToApprove = bookings.find(b => b.id === id);
    if (bookingToApprove && bookingToApprove.userId) {
      try {
        const notifRef = doc(collection(db, 'users', bookingToApprove.userId, 'notifications'));
        await setDoc(notifRef, {
          id: notifRef.id,
          title: "Booking Confirmed",
          message: "your booking is confirmed enjoy the game",
          createdAt: Date.now(),
          viewed: false,
          autoDeleteAt: Date.now() + 20 * 60 * 1000 // 20 minutes from now
        });
      } catch (err) {
        console.error("Failed to send booking confirmation notification:", err);
      }
    }

    const updated = bookings.map(b => {
      if (b.id === id) {
        return { ...b, status: 'approved' as const };
      }
      return b;
    });
    setBookings(updated);
    localStorage.setItem('gic_bookings', JSON.stringify(updated));
  };

  const handleRejectBooking = (id: string) => {
    const updated = bookings.map(b => {
      if (b.id === id) {
        return { ...b, status: 'rejected' as const, rejectedAt: Date.now() };
      }
      return b;
    });
    setBookings(updated);
    localStorage.setItem('gic_bookings', JSON.stringify(updated));
  };

  const handleSeedMockData = () => {
    setSimulatedLoad(true);
    const mockBookings: Booking[] = [
      {
        id: 'gic-seed-111',
        name: 'Sourav Ganguly',
        phone: '09830012345',
        date: new Date().toISOString().split('T')[0],
        timeSlot: '11:00 AM',
        stationType: 'pc-viper',
        hours: 3,
        totalCost: 225,
        stationNumber: 4,
        isHappyHourApplied: true,
        notes: 'Needs red mechanical switches.',
        createdAt: new Date().toLocaleString()
      },
      {
        id: 'gic-seed-222',
        name: 'Anirban Das',
        phone: '09733519022',
        date: new Date().toISOString().split('T')[0],
        timeSlot: '04:00 PM',
        stationType: 'ps5-pro',
        hours: 2,
        totalCost: 160,
        stationNumber: 1,
        isHappyHourApplied: false,
        notes: 'Wants upgraded controllers.',
        createdAt: new Date().toLocaleString()
      },
      {
        id: 'gic-seed-333',
        name: 'Priya Chatterjee',
        phone: '09641011100',
        date: new Date().toISOString().split('T')[0],
        timeSlot: '10:30 AM',
        stationType: 'pc-apex',
        hours: 4,
        totalCost: 450,
        stationNumber: 9,
        isHappyHourApplied: true,
        notes: 'Coaching session setup.',
        createdAt: new Date().toLocaleString()
      }
    ];

    const currentBooked = [...bookings];
    const merged = [...currentBooked, ...mockBookings.filter(mb => !currentBooked.some(cb => cb.id === mb.id))];
    setBookings(merged);
    localStorage.setItem('gic_bookings', JSON.stringify(merged));
    
    setTimeout(() => {
      setSimulatedLoad(false);
    }, 500);
  };

  const handleAdminManualBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newClientPhone.trim()) {
      setAdminBookingMsg('Please enter details.');
      return;
    }

    const matchedStation = STATIONS.find(s => s.id === newStationId) || STATIONS[0];
    const generatedSubtotal = matchedStation.hourlyRate * newHours;

    const newBooking: Booking = {
      id: `gic-adm-${Date.now()}`,
      name: newClientName,
      phone: newClientPhone,
      date: new Date().toISOString().split('T')[0],
      timeSlot: newTimeSlot,
      stationType: newStationId,
      hours: newHours,
      totalCost: generatedSubtotal,
      stationNumber: Math.floor(Math.random() * 12) + 1,
      isHappyHourApplied: false,
      notes: 'MANUAL ENTRY',
      createdAt: new Date().toLocaleString()
    };

    const updated = [newBooking, ...bookings];
    setBookings(updated);
    localStorage.setItem('gic_bookings', JSON.stringify(updated));

    setNewClientName('');
    setNewClientPhone('');
    setAdminBookingMsg('Booking added successfully!');
    setTimeout(() => setAdminBookingMsg(''), 3000);
  };

  const handlePostPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoCaption.trim()) {
      setEventErrorMsg("Please write an image caption first!");
      return;
    }
    
    let media = photoPreset || photoUrlInput || photoFileBase64;
    if (!media && !photoFile) {
      setEventErrorMsg("Please choose an image: either upload a photo file, select a gaming preset, or enter an Image URL!");
      return;
    }
    
    setPostingPhoto(true);
    setEventErrorMsg('');
    setEventSuccessMsg('');
    
    try {
      if (photoFile) {
        setEventSuccessMsg("Compressing and storing photo...");
        try {
          media = await compressImage(photoFile, 1280, 800, 0.75);
        } catch (compErr) {
          console.warn("Compression failed, using base64 buffer:", compErr);
          if (photoFileBase64 && photoFileBase64.startsWith('data:image')) {
            media = photoFileBase64;
          } else {
            throw compErr;
          }
        }
      }

      setEventSuccessMsg("Publishing photo bulletin to database...");

      try {
        await addDoc(collection(db, "events"), {
          type: "photo",
          mediaUrl: media,
          caption: photoCaption.trim(),
          createdAt: Date.now()
        });
      } catch (dbErr) {
        handleFirestoreError(dbErr, OperationType.CREATE, "events");
        return;
      }
      
      setEventSuccessMsg("✓ Photo event posted successfully!");
      setPhotoCaption('');
      setPhotoUrlInput('');
      setPhotoPreset('');
      setPhotoFileBase64('');
      setPhotoFile(null);
      setTimeout(() => setEventSuccessMsg(''), 4000);
    } catch (error) {
      console.error("Error posting photo:", error);
      const msg = error instanceof Error ? error.message : String(error);
      setEventErrorMsg("Failed to upload photo: " + msg);
    } finally {
      setPostingPhoto(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    setEventErrorMsg('');
    setEventSuccessMsg('');
    try {
      await deleteDoc(doc(db, "events", postId));
      setEventSuccessMsg("Post deleted successfully.");
      setTimeout(() => setEventSuccessMsg(''), 3000);
    } catch (error) {
      console.error("Error deleting post:", error);
      setEventErrorMsg("Failed to delete post: " + (error instanceof Error ? error.message : String(error)));
      handleFirestoreError(error, OperationType.DELETE, `events/${postId}`);
    }
  };

  // Calculations
  const totalRevenue = bookings.reduce((acc, current) => acc + current.totalCost, 0);
  const totalHours = bookings.reduce((acc, current) => acc + current.hours, 0);
  const uniqueClients = Array.from(new Set(bookings.map(b => b.phone))).length;

  const filteredBookings = bookings.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.phone.includes(searchTerm) || 
    b.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // SIMPLE LOGIN DESIGN
  if (!isAdminLoggedIn) {
    return (
      <div className="py-16 px-4 max-w-md mx-auto">
        <div className="bg-white border border-gray-200 p-8 rounded-2xl shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="h-12 w-12 rounded-full bg-red-50 border border-red-100 mx-auto flex items-center justify-center text-red-500">
              <Lock className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-sans font-bold text-gray-900 tracking-tight">
              Admin Login
            </h2>
            <p className="text-xs text-gray-500">
              Enter your credentials to access the admin panel
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=""
                className="w-full bg-gray-50 border border-gray-300 rounded-lg py-2 px-3 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=""
                className="w-full bg-gray-50 border border-gray-300 rounded-lg py-2 px-3 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            {loginError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
              style={{ backgroundColor: '#dc2626' }}
            >
              Sign In
            </button>
          </form>

          <div className="pt-4 border-t border-gray-100 text-[10px] text-gray-400 text-center">
            Authorized Personnel Only
          </div>
        </div>
      </div>
    );
  }

  // SIMPLE DASHBOARD DESIGN
  return (
    <div className="pt-2 pb-8 px-4 max-w-5xl mx-auto space-y-6">
      
      {/* Top Admin Header with Logout */}
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-950 uppercase tracking-wide flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-red-600" />
            <span>Admin Control Room</span>
          </h2>
          <p className="text-xs text-gray-500">Real-time stats and registered gamer status feed</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-750 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Logout</span>
        </button>
      </div>

      {/* Metrics stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
          <div className="flex justify-between items-center text-gray-500 text-xs">
            <span>Total Revenue</span>
            <IndianRupee className="h-4 w-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">₹{totalRevenue}</p>
        </div>

        <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
          <div className="flex justify-between items-center text-gray-500 text-xs">
            <span>Total Bookings</span>
            <Calendar className="h-4 w-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{bookings.length}</p>
        </div>

        <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
          <div className="flex justify-between items-center text-gray-500 text-xs">
            <span>Total Hours Booked</span>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalHours} Hrs</p>
        </div>
      </div>

      {/* Admin Section Custom Dropdown Menu */}
      <div className="relative z-30" ref={dropdownRef}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-gray-200/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 font-mono">
              Admin Module
            </span>
          </div>
          
          <div className="relative w-full sm:w-80">
            {/* Dropdown Trigger Button */}
            <button
              type="button"
              onClick={() => setIsSectionDropdownOpen(prev => !prev)}
              className="w-full flex items-center justify-between gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-red-500/50 hover:shadow-md transition-all cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-red-500/20"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-red-50 text-red-600 border border-red-100">
                  {activeTab === 'bookings' && <Calendar className="h-4 w-4" />}
                  {activeTab === 'users' && <Users className="h-4 w-4" />}
                  {activeTab === 'events' && <Megaphone className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 tracking-wide truncate">
                    {activeTab === 'bookings' && `View Bookings (${bookings.length})`}
                    {activeTab === 'users' && `Registered Users (${registeredUsers.length})`}
                    {activeTab === 'events' && `Event Management (${eventPosts.length + tournaments.length})`}
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium">Click to switch section</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isSectionDropdownOpen ? 'rotate-180 text-red-600' : ''}`} />
              </div>
            </button>

            {/* Dropdown Menu Items */}
            {isSectionDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200/90 rounded-2xl shadow-xl overflow-hidden py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 mb-1">
                  Select Control Panel View
                </div>

                {[
                  {
                    id: 'bookings' as const,
                    label: 'View Bookings',
                    count: bookings.length,
                    icon: Calendar,
                    desc: 'Manage slot reservations & timing'
                  },
                  {
                    id: 'users' as const,
                    label: 'Registered Users',
                    count: registeredUsers.length,
                    icon: Users,
                    desc: 'View gamer profiles & balances'
                  },
                  {
                    id: 'events' as const,
                    label: 'Event Management',
                    count: eventPosts.length + tournaments.length,
                    icon: Megaphone,
                    desc: 'Bulletins, highlights & tournaments'
                  }
                ].map((item) => {
                  const isSelected = activeTab === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsSectionDropdownOpen(false);
                        if (item.id === 'users' && registeredUsers.length === 0) {
                          loadFirebaseUsers();
                        }
                      }}
                      className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-left transition-colors cursor-pointer ${
                        isSelected 
                          ? 'bg-red-50/80 text-red-600 font-bold' 
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs ${isSelected ? 'font-bold text-red-600' : 'font-semibold text-gray-800'}`}>
                              {item.label}
                            </span>
                            {item.count !== null && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                                isSelected ? 'bg-red-200/70 text-red-800' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {item.count}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 truncate">{item.desc}</p>
                        </div>
                      </div>

                      {isSelected && (
                        <Check className="h-4 w-4 text-red-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bookings Table List */}
      {activeTab === 'bookings' && (
        <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <h3 className="text-sm font-bold text-gray-950 uppercase tracking-wide">
              Active Bookings List
            </h3>

            {/* Simple Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, phone or ID..."
                className="bg-gray-50 border border-gray-200 rounded-lg py-1.5 pl-9 pr-3 text-xs text-gray-900 focus:outline-none focus:border-red-500 w-full sm:w-64"
              />
            </div>
          </div>

          {filteredBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-medium">
                    <th className="py-2.5 px-1 font-semibold uppercase text-[10px]">Client / ID</th>
                    <th className="py-2.5 px-1 font-semibold uppercase text-[10px]">Contact</th>
                    <th className="py-2.5 px-1 font-semibold uppercase text-[10px]">Station & slot no.</th>
                    <th className="py-2.5 px-1 font-semibold uppercase text-[10px] text-center">Duration</th>
                    <th className="py-2.5 px-1 font-semibold uppercase text-[10px] text-right">Fee</th>
                    <th className="py-2.5 px-1 font-semibold uppercase text-[10px] text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-700">
                  {filteredBookings.map((b) => {
                    const matchedPkg = GAMING_PACKAGES.find(p => p.id === b.stationType);
                    const matchedSt = STATIONS.find(s => s.id === b.stationType);
                    const displayName = matchedPkg ? matchedPkg.name : (matchedSt ? matchedSt.name : b.stationType || STATIONS[0].name);
                    return (
                      <tr key={b.id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-1">
                          <span className="font-bold text-gray-900 block">{b.name}</span>
                          <span className="text-[10px] text-gray-400 font-mono block">{b.id}</span>
                          
                          {/* Special Requirement Display */}
                          {b.notes && (
                            <div className="mt-1.5 p-1.5 bg-red-50 border border-red-100/60 rounded text-[10px] text-gray-700 max-w-xs sm:max-w-md">
                              <span className="font-black text-red-600 uppercase text-[8px] tracking-wider block mb-0.5">Special Requirement:</span>
                              <span className="font-sans leading-normal block">{b.notes}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-1 font-mono text-gray-600">
                          {b.phone}
                        </td>
                        <td className="py-3 px-1">
                          <div className="font-semibold text-gray-800">{displayName}</div>
                          <div className="text-[10px] text-red-600 font-medium uppercase font-mono">CAGE NO. {b.stationNumber}</div>
                        </td>
                        <td className="py-3 px-1 text-center text-gray-900 font-semibold font-mono">
                          {b.hours} Hrs
                        </td>
                        <td className="py-3 px-1 text-right text-gray-900 font-bold">
                          ₹{b.totalCost}
                        </td>
                        <td className="py-3 px-1 text-right">
                          <div className="flex flex-col items-end gap-1.5">
                            {(!b.status || b.status === 'pending') && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleApproveBooking(b.id)}
                                  className="px-2 py-1 text-[10px] font-mono uppercase font-black bg-green-600 hover:bg-green-700 text-white rounded cursor-pointer border-0 shadow-sm"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectBooking(b.id)}
                                  className="px-2 py-1 text-[10px] font-mono uppercase font-black bg-red-600 hover:bg-red-700 text-white rounded cursor-pointer border-0 shadow-sm"
                                >
                                  Reject
                                </button>
                              </div>
                            )}

                            {b.status === 'approved' && (
                              <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-widest bg-green-50 text-green-700 border border-green-200 rounded">
                                  ✓ Approved
                                </span>
                                <button
                                  onClick={() => handleRejectBooking(b.id)}
                                  className="px-1.5 py-0.5 text-[8px] font-mono uppercase bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-500 rounded border border-gray-200 cursor-pointer transition-colors"
                                >
                                  Reject
                                </button>
                              </div>
                            )}

                            {b.status === 'rejected' && (
                              <div className="flex flex-col items-end gap-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-widest bg-red-50 text-red-600 border border-red-100 rounded">
                                    ✗ Rejected
                                  </span>
                                  <button
                                    onClick={() => handleApproveBooking(b.id)}
                                    className="px-1.5 py-0.5 text-[8px] font-mono uppercase bg-gray-100 hover:bg-green-50 hover:text-green-600 text-gray-500 rounded border border-gray-200 cursor-pointer transition-colors"
                                  >
                                    Approve
                                  </button>
                                </div>
                                <span className="text-[8px] font-mono font-bold text-red-500 bg-red-50 px-1 py-0.2 rounded mt-0.5">
                                  DELETING IN {(() => {
                                    if (!b.rejectedAt) return "8:00";
                                    const remainingMs = Math.max(0, 8 * 60 * 1000 - (Date.now() - b.rejectedAt));
                                    const m = Math.floor(remainingMs / 60000);
                                    const s = Math.floor((remainingMs % 60000) / 1000);
                                    return `${m}:${String(s).padStart(2, '0')}`;
                                  })()}
                                </span>
                              </div>
                            )}

                            <button
                              onClick={() => handleDeleteBooking(b.id)}
                              className="text-[9px] text-gray-400 hover:text-red-600 transition-all cursor-pointer hover:underline bg-transparent border-0 p-0 font-mono uppercase font-semibold"
                            >
                              [ Force Delete ]
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-400 text-xs">
              No matching bookings found.
            </div>
          )}
        </div>
      )}



      {/* Firebase Registered Users List */}
      {activeTab === 'users' && (() => {
        const totalUserCount = registeredUsers.length;
        const onlineUsers = registeredUsers.filter(u => u.status === 'online' && u.lastActive && (Date.now() - u.lastActive) < 300000);
        const onlineUserCount = onlineUsers.length;
        const offlineUserCount = Math.max(0, totalUserCount - onlineUserCount);

        const displayedUsers = registeredUsers.filter(u => {
          const isActive = u.status === 'online' && u.lastActive && (Date.now() - u.lastActive) < 300000;
          if (userStatusFilter === 'online') return isActive;
          if (userStatusFilter === 'offline') return !isActive;
          return true;
        });

        const formattedLastSeen = (timestamp?: number) => {
          if (!timestamp) return 'No active pulse';
          const diffSec = Math.floor((Date.now() - timestamp) / 1000);
          if (diffSec < 60) return 'Pulse: 100% (Just now)';
          const diffMin = Math.floor(diffSec / 60);
          if (diffMin < 5) return 'Pulse: 100% (Online)';
          if (diffMin < 60) return `Pulse: Idle (${diffMin}m ago)`;
          const diffHr = Math.floor(diffMin / 60);
          return `Pulse: Offsite (${diffHr}h ago)`;
        };

        return (
          <div className="space-y-6">
            {/* Real-time Overview Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden">
                <div className="space-y-1 z-10">
                  <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase block">Total Gamers Matrix</span>
                  <p className="text-2xl font-black text-white font-mono">{totalUserCount}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800 text-slate-400">
                  <Users className="h-5 w-5" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-red-600/5 to-transparent pointer-events-none" />
              </div>

              <div className="bg-slate-900 border border-emerald-950 rounded-xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden">
                <div className="space-y-1 z-10">
                  <span className="text-[10px] text-emerald-400 font-mono tracking-widest uppercase block flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    Live Connection
                  </span>
                  <p className="text-2xl font-black text-emerald-400 font-mono">{onlineUserCount}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-950/40 text-emerald-400">
                  <Flame className="h-5 w-5 animate-pulse text-emerald-400" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 to-transparent pointer-events-none" />
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden">
                <div className="space-y-1 z-10">
                  <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase block">Offsite / Inactive</span>
                  <p className="text-2xl font-black text-slate-400 font-mono">{offlineUserCount}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/50 text-slate-500">
                  <User className="h-5 w-5" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-slate-600/5 to-transparent pointer-events-none" />
              </div>
            </div>

            {/* Broadcast System Alert form */}
            <div className="bg-[#111217] border border-red-600/30 rounded-[18px] p-5 space-y-3.5 shadow-xl shadow-red-950/5 text-left">
              <div className="flex items-center gap-2 border-b border-white/[0.06] pb-2.5">
                <Megaphone className="h-4 w-4 text-red-500 animate-pulse shrink-0" />
                <span className="font-mono text-xs uppercase tracking-widest text-red-500 font-bold">BROADCAST SYSTEM ANNOUNCEMENT TO ALL GAMERS</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-mono uppercase block">Alert Title</label>
                  <input 
                    type="text" 
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="e.g., HIGH LEVEL DUELS REGISTERING"
                    className="w-full bg-slate-950 text-white rounded-lg border border-slate-800 p-2 text-xs focus:outline-none focus:border-red-500 font-sans"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] text-gray-400 font-mono uppercase block">Alert Message</label>
                  <input 
                    type="text" 
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="e.g., Registrations for the 5v5 FPS tournament are closing. Lock in your slot now!"
                    className="w-full bg-slate-950 text-white rounded-lg border border-slate-800 p-2 text-xs focus:outline-none focus:border-red-500 font-sans"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1.5">
                <span className="text-[9px] text-gray-500 font-mono">This message will instantly show on the bell icon of all {registeredUsers.filter(u => u.uid && !u.uid.startsWith('fb-')).length} real gamers.</span>
                <button
                  onClick={handleBroadcastNotification}
                  disabled={isBroadcasting || !broadcastMessage.trim()}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-mono uppercase font-black tracking-wider cursor-pointer border-0 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isBroadcasting ? (
                    <>
                      <div className="h-3 w-3 border border-white border-t-transparent rounded-full animate-spin" />
                      <span>Broadcasting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Send Broadcast</span>
                    </>
                  )}
                </button>
              </div>
              {broadcastSuccess && (
                <p className="text-[10px] text-emerald-400 font-mono">✓ System-wide alert broadcasted successfully to all active gamer profiles!</p>
              )}
            </div>

            {/* Navigation & Controls Directory Row */}
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex bg-slate-100 p-1 rounded-lg gap-1 w-full sm:w-auto">
                <button
                  onClick={() => setUserStatusFilter('all')}
                  className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                    userStatusFilter === 'all'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  All Players ({totalUserCount})
                </button>
                <button
                  onClick={() => setUserStatusFilter('online')}
                  className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    userStatusFilter === 'online'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-emerald-700 hover:text-emerald-900 bg-emerald-50/50'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active ({onlineUserCount})
                </button>
                <button
                  onClick={() => setUserStatusFilter('offline')}
                  className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                    userStatusFilter === 'offline'
                      ? 'bg-slate-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Offline ({offlineUserCount})
                </button>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  onClick={loadFirebaseUsers}
                  disabled={isFetchingUsers}
                  className="p-1.5 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${isFetchingUsers ? 'animate-spin text-red-500' : ''}`} />
                  <span>Update Streams</span>
                </button>
              </div>
            </div>

            {/* List & Cards renderer */}
            {isFetchingUsers && registeredUsers.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-xl py-16 text-center flex flex-col items-center gap-2.5 shadow-sm">
                <div className="h-7 w-7 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-slate-500 font-mono uppercase tracking-widest">Awaiting Live Feed Sync...</span>
              </div>
            ) : displayedUsers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedUsers.map((u) => {
                  const isUserActive = u.status === 'online' && u.lastActive && (Date.now() - u.lastActive) < 300000;
                  
                  const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
                  const gamerTag = (u.gamerTag || '').trim();
                  const baseName = (u.name || '').trim();
                  
                  // Smart non-duplicating display name
                  let nameDisplay = baseName;
                  if (gamerTag && baseName && gamerTag.toLowerCase() !== baseName.toLowerCase()) {
                    nameDisplay = `${baseName} (${gamerTag})`;
                  } else if (fullName && baseName && fullName.toLowerCase() !== baseName.toLowerCase()) {
                    nameDisplay = `${baseName} (${fullName})`;
                  } else if (baseName) {
                    nameDisplay = baseName;
                  } else if (fullName) {
                    nameDisplay = fullName;
                  } else if (gamerTag) {
                    nameDisplay = gamerTag;
                  } else {
                    nameDisplay = 'Player';
                  }

                  const formatJoined = (created: any) => {
                    if (!created) return 'N/A';
                    if (typeof created === 'number') {
                      const d = new Date(created);
                      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
                    }
                    if (typeof created === 'string') {
                      if (created.includes('/')) return created;
                      const parsed = Date.parse(created);
                      if (!isNaN(parsed)) {
                        const d = new Date(parsed);
                        return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
                      }
                    }
                    return String(created);
                  };

                  const renderCompactAvatar = (pic: string, gamerName: string) => {
                    const sizeClasses = "w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shrink-0";
                    const borderStyle = "border-2 " + (isUserActive ? 'border-emerald-500' : 'border-[#5e4b8a]');
                    
                    if (pic && pic.startsWith('PRESET:')) {
                      const presetId = pic.split(':')[1];
                      const preset = PRESET_AVATARS.find(p => p.id === presetId) || PRESET_AVATARS[0];
                      return (
                        <div className={`${sizeClasses} bg-gradient-to-br ${preset.gradient} ${borderStyle} flex items-center justify-center text-sm shadow-inner`}>
                          <span>{preset.text}</span>
                        </div>
                      );
                    } else if (pic) {
                      return (
                        <img 
                          src={pic} 
                          alt={gamerName} 
                          className={`${sizeClasses} ${borderStyle}`}
                          referrerPolicy="no-referrer"
                        />
                      );
                    } else {
                      return (
                        <div className={`${sizeClasses} bg-slate-950 ${borderStyle} flex items-center justify-center text-violet-400 font-bold font-mono text-xs shadow-inner`}>
                          {(gamerName || 'P').charAt(0).toUpperCase()}
                        </div>
                      );
                    }
                  };

                  return (
                    <div 
                      key={u.uid} 
                      className={`bg-[#13141a]/95 border border-[#22242c] rounded-xl p-3 sm:p-3.5 flex flex-col gap-2.5 transition-all duration-300 hover:border-violet-500/40 relative group ${
                        isUserActive ? 'ring-1 ring-emerald-500/20' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        {/* Avatar & Details content wrapper */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="relative shrink-0">
                            {renderCompactAvatar(u.profilePic || '', u.name)}
                            {isUserActive && (
                              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-[#13141a] ring-1 ring-emerald-400/30 animate-pulse" />
                            )}
                          </div>

                          <div className="min-w-0 text-left">
                            <h4 className="text-xs sm:text-[13px] font-bold text-white tracking-tight truncate flex items-center gap-1 font-sans">
                              {nameDisplay}
                            </h4>
                            <div className="flex items-center gap-1 text-zinc-400 text-[10px] sm:text-[11px] mt-0.5 min-w-0">
                              <Mail className="h-3 w-3 text-zinc-500 shrink-0" />
                              <span className="truncate" title={u.email}>{u.email || 'No email registered'}</span>
                            </div>
                            <p className="text-[9.5px] text-zinc-500 mt-0.5 font-sans">
                              Joined {formatJoined(u.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* Action section: Notify or Delete with confirm option */}
                        <div className="flex items-center shrink-0">
                          {pendingDeleteUserId === u.uid ? (
                            <div className="flex items-center gap-1 animate-in slide-in-from-right-2 duration-150">
                              <button
                                onClick={() => handleDeleteUser(u.uid)}
                                className="px-2 py-0.5 bg-red-600 hover:bg-red-750 text-white rounded text-[9px] font-mono uppercase font-black tracking-wider cursor-pointer border-0"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => setPendingDeleteUserId(null)}
                                className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[9px] font-mono uppercase font-black tracking-wider cursor-pointer border-0"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-0.5">
                              {u.uid && !u.uid.startsWith('fb-') && (
                                <button
                                  onClick={() => setExpandedNotificationUserId(expandedNotificationUserId === u.uid ? null : u.uid)}
                                  className={`p-1.5 rounded-lg transition-all cursor-pointer bg-transparent border-0 ${
                                    expandedNotificationUserId === u.uid 
                                      ? 'text-red-500 bg-red-500/10' 
                                      : 'text-zinc-400 hover:text-red-500 hover:bg-white/[0.04]'
                                  }`}
                                  title="Send Direct Alert"
                                >
                                  <BellRing className="h-3.5 w-3.5" />
                                </button>
                              )}

                              <button
                                onClick={() => setPendingDeleteUserId(u.uid)}
                                className="p-1.5 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer bg-transparent border-0"
                                title="Delete User"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Expanded alert form */}
                      {expandedNotificationUserId === u.uid && (
                        <div className="border-t border-white/[0.06] pt-3.5 space-y-2.5 animate-in slide-in-from-top-2 duration-150 text-left">
                          <p className="text-[10px] text-red-500 font-mono uppercase tracking-widest font-black">COMPOSE GAMER DIRECT ALERT</p>
                          <div className="space-y-1.5">
                            <input 
                              type="text"
                              value={notificationTitleMap[u.uid] || ''}
                              onChange={(e) => setNotificationTitleMap(prev => ({ ...prev, [u.uid]: e.target.value }))}
                              placeholder="Title (e.g., TEAM ASSIGNMENT UPDATE)"
                              className="w-full bg-slate-950 text-white rounded-lg border border-slate-800 p-2 text-xs focus:outline-none focus:border-red-500 font-sans"
                            />
                            <textarea
                              rows={2}
                              value={notificationTextMap[u.uid] || ''}
                              onChange={(e) => setNotificationTextMap(prev => ({ ...prev, [u.uid]: e.target.value }))}
                              placeholder="Type custom alert text here..."
                              className="w-full bg-slate-950 text-white rounded-lg border border-slate-800 p-2 text-xs focus:outline-none focus:border-red-500 font-sans resize-none"
                            />
                          </div>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setExpandedNotificationUserId(null)}
                              className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md text-[10px] font-mono uppercase tracking-wider cursor-pointer border-0"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSendNotification(u.uid)}
                              disabled={!notificationTextMap[u.uid]?.trim()}
                              className="px-4 py-1 bg-red-600 hover:bg-red-750 text-white rounded-md text-[10px] font-mono uppercase tracking-wider cursor-pointer border-0 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                            >
                              <Send className="h-3 w-3" />
                              <span>Push Alert</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="border border-dashed border-gray-200 rounded-xl py-12 text-center text-gray-400 text-xs uppercase tracking-wider font-mono bg-slate-50">
                No players match selection: "{userStatusFilter}" status.
              </div>
            )}
          </div>
        );
      })()}

      {activeTab === 'events' && (
        <div className="space-y-8">
          {/* Unified Header with Sub-tabs */}
          <div className="bg-gray-950 border border-red-950/40 p-6 rounded-2xl shadow-lg relative overflow-hidden text-white">
            <div className="absolute top-0 right-0 p-3 text-[10px] font-mono text-gray-500 uppercase tracking-[0.25em]">
              Event & Tournament Backplane
            </div>
            <h3 className="text-xl font-bold uppercase tracking-wider text-red-500 flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-red-500 animate-pulse" />
              <span>Event &amp; Tournament Management</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
              Publish rich gaming media bulletins, cage match photos, highlight reels, and organize live tournaments with player registrations in one centralized hub.
            </p>

            {/* Sub-tabs Selector */}
            <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setEventSubTab('bulletins')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                  eventSubTab === 'bulletins'
                    ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.35)]'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                }`}
              >
                <Sparkles className="h-3 w-3" />
                <span>Events &amp; Bulletins ({eventPosts.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setEventSubTab('tournaments')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                  eventSubTab === 'tournaments'
                    ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.35)]'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                }`}
              >
                <Trophy className="h-3 w-3" />
                <span>Tournaments &amp; Brackets ({tournaments.length})</span>
              </button>
            </div>
          </div>

          {/* SubTab 1: Events & Bulletins */}
          {eventSubTab === 'bulletins' && (
            <div className="space-y-8">
              {/* Success / Error Messages */}
              {eventSuccessMsg && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-sans font-semibold uppercase tracking-wide flex items-center gap-2 animate-bounce">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>{eventSuccessMsg}</span>
                </div>
              )}
              {eventErrorMsg && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl font-mono flex items-center gap-2">
                  <span>⚠️ ERROR: {eventErrorMsg}</span>
                </div>
              )}

              {/* SubTab 1: Single Photo & Bulletin Form */}
              <div className="max-w-2xl mx-auto w-full">
                {/* Category: Photo Form */}
                <div className="bg-[#0c0d12] border border-white/[0.04] rounded-[24px] p-6 sm:p-8 space-y-6 flex flex-col justify-between hover:border-[#8b5cf6]/20 transition-all duration-300 shadow-xl">
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <div className="p-1 rounded-lg bg-[#5b32a1]/10 border border-[#5b32a1]/25 text-violet-400">
                      <ImagePlus className="h-5 w-5" />
                    </div>
                    <h4 className="text-sm font-black text-white uppercase tracking-[0.12em] font-mono">
                      Photo &amp; Bulletin Upload
                    </h4>
                  </div>

                  <form onSubmit={handlePostPhoto} className="space-y-4">
                    {/* Image Input Options */}
                    <div className="space-y-4">
                      {/* Option A: File upload */}
                      <div className="border-2 border-dashed border-[#5b32a1]/50 hover:border-[#8b5cf6] bg-black/40 rounded-[18px] p-8 text-center flex flex-col items-center justify-center cursor-pointer relative group transition-all">
                        <Upload className="h-10 w-10 text-gray-400 group-hover:text-violet-400 group-hover:scale-105 transition-all mb-2" />
                        
                        <span className="text-gray-400 font-sans text-xs sm:text-sm font-semibold tracking-wide">
                          {photoFile ? "✓ Custom Image Loaded" : "Click to select photo"}
                        </span>
                        
                        {photoFile && (
                          <span className="block text-[10px] text-emerald-400 font-mono mt-1 font-bold">
                            LOCAL FILE BUFFERED • READY TO POST
                          </span>
                        )}

                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const compressed = await compressImage(file);
                                setPhotoFileBase64(compressed);
                                const blob = base64ToBlob(compressed);
                                const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
                                setPhotoFile(compressedFile);
                                setPhotoPreset('');
                                setPhotoUrlInput('');
                                setEventErrorMsg('');
                              } catch (err) {
                                console.error("Compression failed:", err);
                                setEventErrorMsg("Failed to process image. Please try another file.");
                              }
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                      </div>

                      {/* Selectors for presets & URL */}
                      <div className="flex justify-center gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setShowPhotoUrl(!showPhotoUrl);
                            setShowPhotoPresets(false);
                          }}
                          className={`text-[9px] font-mono px-2.5 py-1 rounded-lg border transition-all ${
                            showPhotoUrl 
                              ? 'bg-[#5b32a1]/20 border-[#8b5cf6]/50 text-white' 
                              : 'bg-[#13141a] hover:bg-[#181922] border-white/5 text-gray-400 hover:text-white'
                          }`}
                        >
                          {photoUrlInput ? '✓ URL Configured' : '+ Enter URL Source'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowPhotoPresets(!showPhotoPresets);
                            setShowPhotoUrl(false);
                          }}
                          className={`text-[9px] font-mono px-2.5 py-1 rounded-lg border transition-all ${
                            showPhotoPresets 
                              ? 'bg-[#5b32a1]/20 border-[#8b5cf6]/50 text-white' 
                              : 'bg-[#13141a] hover:bg-[#181922] border-white/5 text-gray-400 hover:text-white'
                          }`}
                        >
                          {photoPreset ? '✓ Preset Selected' : '+ Use Gaming Preset'}
                        </button>
                      </div>

                      {/* Option B: Preset Selector Collapsible */}
                      {showPhotoPresets && (
                        <div className="p-3 bg-[#13141a] rounded-xl border border-white/5 space-y-2 animate-fade-in">
                          <span className="block text-[8px] font-mono uppercase text-[#8b5cf6] font-bold">Select Gaming Premium Preset</span>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { name: 'LAN Arena', url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800' },
                              { name: 'Cyber Neon Lights', url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=800' },
                              { name: 'Gamer Gear Console', url: 'https://images.unsplash.com/photo-1605901309584-818e25960a8f?auto=format&fit=crop&q=80&w=800' },
                              { name: 'Valorant Vibe Battle', url: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&q=80&w=800' },
                            ].map((preset) => (
                              <button
                                key={preset.name}
                                type="button"
                                onClick={() => {
                                  setPhotoPreset(preset.url);
                                  setPhotoUrlInput('');
                                  setPhotoFileBase64('');
                                  setPhotoFile(null);
                                }}
                                className={`text-[10px] font-mono text-left px-2 py-1.5 rounded border transition-colors ${
                                  photoPreset === preset.url 
                                    ? 'border-[#8b5cf6] bg-[#5b32a1]/20 text-white font-bold' 
                                    : 'border-white/10 hover:bg-white/5 text-gray-400'
                                }`}
                              >
                                {preset.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Option C: Image URL Collapsible */}
                      {showPhotoUrl && (
                        <div className="p-3 bg-[#13141a] rounded-xl border border-white/5 space-y-1.5 animate-fade-in">
                          <span className="block text-[8px] font-mono uppercase text-[#8b5cf6] font-bold">Enter URL Source</span>
                          <input
                            type="url"
                            value={photoUrlInput}
                            onChange={(e) => {
                              setPhotoUrlInput(e.target.value);
                              setPhotoPreset('');
                              setPhotoFileBase64('');
                              setPhotoFile(null);
                            }}
                            placeholder="https://example.com/tournament-banner.jpg"
                            className="w-full bg-[#08090d] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#8b5cf6]"
                          />
                        </div>
                      )}
                    </div>

                    {/* Photo Preview if Selected */}
                    {(photoPreset || photoUrlInput || photoFileBase64 || photoFile) && (
                      <div className="bg-[#13141a] border border-white/5 rounded-xl p-2.5 flex items-center gap-3">
                        <img 
                          src={photoPreset || photoUrlInput || (photoFile ? URL.createObjectURL(photoFile) : photoFileBase64)} 
                          alt="Preview" 
                          className="h-10 w-16 object-cover rounded-lg border border-white/10 shrink-0" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="block text-[8px] font-mono uppercase text-gray-500 font-bold">PREVIEW SOURCE LOADED</span>
                          <span className="text-[10px] text-gray-400 break-all truncate block">
                            {photoFile || photoFileBase64 ? 'Local Upload File' : (photoPreset || photoUrlInput)}
                          </span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => {
                            setPhotoFileBase64('');
                            setPhotoFile(null);
                            setPhotoPreset('');
                            setPhotoUrlInput('');
                          }}
                          className="p-1 text-gray-400 hover:text-red-500 text-xs font-mono"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {/* Caption Text Box */}
                    <div className="space-y-1">
                      <input
                        type="text"
                        required
                        value={photoCaption}
                        onChange={(e) => setPhotoCaption(e.target.value)}
                        placeholder="Enter photo caption..."
                        className="w-full bg-[#13141a] border border-white/[0.04] focus:border-[#8b5cf6] rounded-xl px-4 py-3.5 text-sm text-white placeholder-gray-500 focus:outline-none transition-all focus:ring-1 focus:ring-[#8b5cf6]/20"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={postingPhoto}
                      className="w-full bg-[#5b32a1] hover:bg-[#6c3fc4] text-white py-3.5 rounded-xl font-bold uppercase text-xs sm:text-sm tracking-widest transition-all duration-300 hover:shadow-[0_0_12px_rgba(139,92,246,0.3)] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                    >
                      {postingPhoto ? (
                        <>
                          <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <span>Post Photo</span>
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* Management List Section */}
              <div className="bg-[#0c0d12] border border-white/[0.04] rounded-[24px] p-6 sm:p-8 space-y-6 shadow-xl">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-[0.12em] flex items-center gap-2.5 font-mono">
                    <Film className="h-5 w-5 text-violet-400" />
                    <span>Currently Posted Events &amp; Bulletins ({eventPosts.length})</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Below is the live feed list published to the User-end page. Click delete to remove instantly.
                  </p>
                </div>

                {eventPosts.length === 0 ? (
                  <div className="py-12 border border-dashed border-white/10 rounded-2xl text-center text-gray-500 bg-black/40 text-xs font-mono uppercase tracking-wider">
                    No active event posts. Use the sections above to publish one!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {eventPosts.map((post) => (
                      <div 
                        key={post.id} 
                        className="border border-white/[0.05] rounded-2xl p-4 bg-black/40 flex flex-col justify-between space-y-4 shadow-xl group hover:border-[#8b5cf6]/30 transition-all duration-300 relative"
                      >
                        {/* Preview Area */}
                        <div className="w-full h-40 bg-black rounded-xl overflow-hidden relative border border-white/5">
                          {renderMediaElement(post.type, post.mediaUrl, post.caption)}
                          <div className="absolute top-3 left-3 bg-[#5b32a1] text-[8px] font-bold text-white uppercase px-2 py-0.5 rounded-md tracking-widest font-mono border border-[#8b5cf6]/30 pointer-events-none">
                            {post.type === 'photo' ? 'PHOTO' : 'VIDEO'}
                          </div>
                        </div>

                        {/* Meta info */}
                        <div className="space-y-2 flex-1 flex flex-col justify-between">
                          <p className="text-xs text-gray-300 line-clamp-3 font-sans leading-relaxed">
                            "{post.caption}"
                          </p>
                          <span className="block text-[9px] font-mono text-gray-500 uppercase tracking-widest pt-2 border-t border-white/[0.03]">
                            Published: {new Date(post.createdAt || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>

                        {/* Delete Action button */}
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="mt-2 w-full py-2.5 bg-red-950/20 hover:bg-red-900/30 border border-red-550/20 hover:border-red-550/50 rounded-xl text-[10px] sm:text-xs text-red-400 font-bold transition-all duration-300 uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer hover:shadow-[0_0_8px_rgba(239,68,68,0.15)] active:scale-[0.98]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete Instantly</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SubTab 2: Tournaments & Brackets */}
          {eventSubTab === 'tournaments' && (
            <div className="space-y-8">
              {/* Success / Error Messages */}
              {tourneySuccessMsg && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-sans font-semibold uppercase tracking-wide flex items-center gap-2 animate-bounce">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>{tourneySuccessMsg}</span>
                </div>
              )}
              {tourneyErrorMsg && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl font-mono flex items-center gap-2">
                  <span>⚠️ ERROR: {tourneyErrorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Create Tournament (span 5) */}
                <div className="lg:col-span-5 bg-[#0c0d12] border border-white/[0.04] rounded-[24px] p-6 sm:p-8 space-y-6 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-1 rounded-lg bg-red-500/10 border border-red-500/25 text-red-500">
                      <PlusCircle className="h-5 w-5" />
                    </div>
                    <h4 className="text-sm font-black text-white uppercase tracking-[0.12em] font-mono">
                      Publish New Tournament
                    </h4>
                  </div>

                  <form onSubmit={handlePostTournament} className="space-y-4 text-left">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-400 font-bold">
                        Tournament Title *
                      </label>
                      <input 
                        type="text" 
                        value={tourneyTitle}
                        onChange={(e) => setTourneyTitle(e.target.value)}
                        placeholder="e.g. VALORANT SUNDAY SHOWDOWN"
                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-400 font-bold">
                        Manual Entry Fee / Price *
                      </label>
                      <input 
                        type="text" 
                        value={tourneyPrice}
                        onChange={(e) => setTourneyPrice(e.target.value)}
                        placeholder="e.g. 500 BDT or Free Entry"
                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-red-500"
                      />
                    </div>

                    {/* Tournament Date and Time (Manually Set) */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-400 font-bold">
                          Tournament Date
                        </label>
                        <input 
                          type="date" 
                          value={tourneyDate}
                          onChange={(e) => setTourneyDate(e.target.value)}
                          className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-400 font-bold">
                          Tournament Time
                        </label>
                        <input 
                          type="time" 
                          value={tourneyTime}
                          onChange={(e) => setTourneyTime(e.target.value)}
                          className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                        />
                      </div>
                    </div>

                    {/* Media Input Options */}
                    <div className="space-y-3">
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-400 font-bold">
                        Tournament Photo Banner *
                      </label>
                      
                      {/* File Upload component for photo banner */}
                      <div className="border-2 border-dashed border-red-500/20 hover:border-red-500 bg-black/40 rounded-[18px] p-6 text-center flex flex-col items-center justify-center cursor-pointer relative group transition-all">
                        <Upload className="h-8 w-8 text-gray-400 group-hover:text-red-500 group-hover:scale-105 transition-all mb-2" />
                        <span className="text-gray-400 font-sans text-xs font-semibold">
                          {tourneyFile 
                            ? `✓ Image Loaded: ${tourneyFile.name}` 
                            : "Click to select tournament photo banner"
                          }
                        </span>
                        {tourneyFile && (
                          <span className="block text-[10px] text-emerald-400 font-mono mt-1 font-bold">
                            PHOTO READY • CLICK PUBLISH TO SAVE
                          </span>
                        )}
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const compressed = await compressImage(file);
                                setTourneyFileBase64(compressed);
                                const blob = base64ToBlob(compressed);
                                const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
                                setTourneyFile(compressedFile);
                                setTourneyMediaUrlInput('');
                                setTourneyErrorMsg('');
                              } catch (err) {
                                console.error("Compression failed:", err);
                                setTourneyErrorMsg("Failed to process image. Please try another file.");
                              }
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>

                      <div className="text-center text-[10px] text-gray-500 font-mono">
                        - OR -
                      </div>

                      {/* URL Toggle */}
                      <button
                        type="button"
                        onClick={() => setShowTourneyUrl(!showTourneyUrl)}
                        className="text-[10px] font-mono text-red-400 hover:text-red-300 hover:underline block cursor-pointer"
                      >
                        {showTourneyUrl ? "[ Hide URL Input ]" : "[ Enter Image URL directly ]"}
                      </button>

                      {showTourneyUrl && (
                        <input 
                          type="text"
                          value={tourneyMediaUrlInput}
                          onChange={(e) => {
                            setTourneyMediaUrlInput(e.target.value);
                            setTourneyFileBase64('');
                            setTourneyFile(null);
                          }}
                          placeholder="Enter tournament banner image URL"
                          className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-red-500"
                        />
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-400 font-bold">
                        Tournament Description / Rules *
                      </label>
                      <textarea 
                        value={tourneyCaption}
                        onChange={(e) => setTourneyCaption(e.target.value)}
                        rows={4}
                        placeholder="Provide rules, slot counts, schedule, and registration details."
                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={postingTourney}
                      className="w-full bg-red-600 hover:bg-red-500 text-white rounded-xl py-3 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {postingTourney ? "Publishing Tournament..." : "Publish Tournament"}
                    </button>
                  </form>
                </div>

                {/* Right: Active Tournaments & Bookings (span 7) */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Active list */}
                  <div className="bg-[#0c0d12] border border-white/[0.04] rounded-[24px] p-6 shadow-xl">
                    <h4 className="text-xs font-black text-white uppercase tracking-[0.12em] font-mono flex items-center gap-2 mb-4">
                      <Swords className="h-4 w-4 text-red-500" />
                      <span>Active Tournaments ({tournaments.length})</span>
                    </h4>

                    {tournaments.length === 0 ? (
                      <p className="text-xs text-gray-500 font-mono text-center py-8">
                        NO ACTIVE TOURNAMENTS REGISTERED. PUBLISH ONE ON THE LEFT.
                      </p>
                    ) : (
                      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                        {tournaments.map((t) => (
                          <div key={t.id} className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-xl flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              {t.mediaUrl && (
                                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-black relative">
                                  {renderMediaElement(t.type, t.mediaUrl, t.title)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <span className="block text-xs font-black text-white uppercase tracking-wider truncate">
                                  {t.title}
                                </span>
                                <span className="block text-[10px] font-mono text-red-400 mt-0.5">
                                  Fee: {t.price}
                                </span>
                              </div>
                            </div>

                            <button 
                              onClick={() => handleDeleteTournament(t.id)}
                              className="p-2 text-gray-500 hover:text-red-500 rounded-lg hover:bg-red-500/10 cursor-pointer"
                              title="Delete tournament"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tournament Bookings List */}
                  <div className="bg-[#0c0d12] border border-white/[0.04] rounded-[24px] p-6 shadow-xl">
                    <h4 className="text-xs font-black text-white uppercase tracking-[0.12em] font-mono flex items-center gap-2 mb-4">
                      <Users className="h-4 w-4 text-red-500" />
                      <span>Tournament Registrations ({tournamentBookings.length})</span>
                    </h4>

                    {tournamentBookings.length === 0 ? (
                      <p className="text-xs text-gray-500 font-mono text-center py-8">
                        NO TOURNAMENT REGISTRATIONS RECEIVED YET.
                      </p>
                    ) : (
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                        {tournamentBookings.map((tb) => (
                          <div key={tb.id} className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-xl space-y-3">
                            <div className="flex justify-between items-start gap-4">
                              <div>
                                <span className="bg-red-950/40 text-red-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded border border-red-900/60 uppercase">
                                  {tb.tournamentTitle || 'Unknown Tournament'}
                                </span>
                                <h5 className="text-xs font-black text-white uppercase mt-2">
                                  {tb.name} ({tb.gamerTag || 'No GamerTag'})
                                </h5>
                              </div>

                              <button 
                                onClick={() => handleDeleteTourneyBooking(tb.id)}
                                className="p-1.5 text-gray-500 hover:text-red-500 rounded hover:bg-red-500/10 cursor-pointer"
                                title="Delete booking"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-gray-400 pt-1 border-t border-white/[0.03]">
                              <div>
                                <span className="text-gray-500 block">Phone:</span> {tb.phone}
                              </div>
                              <div>
                                <span className="text-gray-500 block">Email:</span> {tb.email}
                              </div>
                              {tb.teamName && (
                                <div className="col-span-2">
                                  <span className="text-gray-500 block">Team Name:</span> {tb.teamName}
                                </div>
                              )}
                              <div className="col-span-2 text-right text-[9px] text-gray-600">
                                Registered: {tb.createdAt ? new Date(tb.createdAt).toLocaleString() : 'N/A'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'hero' && (
        <div className="space-y-8">
          {/* Header Description */}
          <div className="bg-gray-950 border border-red-950/40 p-6 rounded-2xl shadow-lg relative overflow-hidden text-white">
            <div className="absolute top-0 right-0 p-3 text-[10px] font-mono text-gray-500 uppercase tracking-[0.25em]">
              Dual Hero Carousel Sync
            </div>
            <h3 className="text-xl font-bold uppercase tracking-wider text-red-500 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-red-500 animate-pulse" />
              <span>Dual Hero Photo Carousel Manager</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
              Upload and manage two distinct hero photos that smoothly auto-slide and swipe left-to-right on the main homepage.
            </p>
          </div>

          {/* Success / Error Messages */}
          {eventSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-sans font-semibold uppercase tracking-wide flex items-center gap-2 animate-bounce">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span>{eventSuccessMsg}</span>
            </div>
          )}
          {eventErrorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl font-mono flex items-center gap-2">
              <span>⚠️ ERROR: {eventErrorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left side: Upload Form for Dual Slides */}
            <div className="lg:col-span-7 bg-[#0c0d12] border border-white/[0.04] rounded-[24px] p-6 sm:p-8 space-y-6 flex flex-col justify-between hover:border-[#8b5cf6]/20 transition-all duration-300 shadow-xl">
              <form onSubmit={handleUpdateHeroImage} className="space-y-8">
                
                {/* SLIDE 1 CONFIGURATION */}
                <div className="space-y-4 p-5 bg-[#13141a]/60 rounded-2xl border border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-red-500/20 text-red-400 font-mono text-xs font-bold flex items-center justify-center border border-red-500/30">
                        1
                      </span>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">
                        Hero Photo 1 (Primary Slide)
                      </h4>
                    </div>
                    {currentHeroImagesOnDb[0] && (
                      <span className="text-[10px] font-mono text-emerald-400">
                        Current: Active
                      </span>
                    )}
                  </div>

                  {/* Slide 1 Upload Box */}
                  <div className="border-2 border-dashed border-[#5b32a1]/40 hover:border-[#8b5cf6] bg-black/40 rounded-xl p-5 text-center flex flex-col items-center justify-center cursor-pointer relative group transition-all">
                    <Upload className="h-7 w-7 text-gray-400 group-hover:text-violet-400 transition-all mb-1" />
                    <span className="text-gray-300 font-sans text-xs font-semibold">
                      {slide1File ? "✓ Image Selected" : "Click to select Photo 1"}
                    </span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const compressed = await compressImage(file);
                            setSlide1FileBase64(compressed);
                            const blob = base64ToBlob(compressed);
                            const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
                            setSlide1File(compressedFile);
                            setSlide1Preset('');
                            setSlide1UrlInput('');
                            setEventErrorMsg('');
                          } catch (err) {
                            console.error("Compression failed:", err);
                            setEventErrorMsg("Failed to process image 1.");
                          }
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>

                  {/* Slide 1 Quick Options */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSlide1Url(!showSlide1Url);
                        setShowSlide1Presets(false);
                      }}
                      className={`text-[9px] font-mono px-2.5 py-1 rounded-lg border transition-all ${
                        showSlide1Url ? 'bg-[#5b32a1]/20 border-[#8b5cf6]/50 text-white' : 'bg-[#13141a] text-gray-400 hover:text-white border-white/5'
                      }`}
                    >
                      {slide1UrlInput ? '✓ URL Set' : '+ URL'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSlide1Presets(!showSlide1Presets);
                        setShowSlide1Url(false);
                      }}
                      className={`text-[9px] font-mono px-2.5 py-1 rounded-lg border transition-all ${
                        showSlide1Presets ? 'bg-[#5b32a1]/20 border-[#8b5cf6]/50 text-white' : 'bg-[#13141a] text-gray-400 hover:text-white border-white/5'
                      }`}
                    >
                      {slide1Preset ? '✓ Preset Set' : '+ Presets'}
                    </button>
                  </div>

                  {showSlide1Url && (
                    <input
                      type="url"
                      value={slide1UrlInput}
                      onChange={(e) => {
                        setSlide1UrlInput(e.target.value);
                        setSlide1Preset('');
                        setSlide1FileBase64('');
                        setSlide1File(null);
                      }}
                      placeholder="Photo 1 URL (https://...)"
                      className="w-full bg-[#08090d] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-red-500"
                    />
                  )}

                  {showSlide1Presets && (
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { name: 'Cyber Lounge', url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1200' },
                        { name: 'Tournament Arena', url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=1200' },
                      ].map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            setSlide1Preset(preset.url);
                            setSlide1UrlInput('');
                            setSlide1FileBase64('');
                            setSlide1File(null);
                          }}
                          className={`text-[10px] text-left px-2 py-1.5 rounded border transition-colors ${
                            slide1Preset === preset.url ? 'border-red-500 bg-red-950/20 text-white' : 'border-white/10 text-gray-400 hover:bg-white/5'
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {(slide1Preset || slide1UrlInput || slide1FileBase64 || slide1File) && (
                    <div className="bg-[#08090d] border border-white/10 rounded-lg p-2 flex items-center gap-2">
                      <img 
                        src={slide1Preset || slide1UrlInput || (slide1File ? URL.createObjectURL(slide1File) : slide1FileBase64)} 
                        alt="Slide 1 Preview" 
                        className="h-10 w-14 object-cover rounded shrink-0" 
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-[10px] text-gray-300 truncate flex-1 font-mono">
                        Ready for Slide 1
                      </span>
                      <button 
                        type="button"
                        onClick={() => {
                          setSlide1File(null);
                          setSlide1FileBase64('');
                          setSlide1UrlInput('');
                          setSlide1Preset('');
                        }}
                        className="text-[9px] text-red-400 hover:text-red-300 px-2 py-1 bg-red-950/20 rounded"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>


                {/* SLIDE 2 CONFIGURATION */}
                <div className="space-y-4 p-5 bg-[#13141a]/60 rounded-2xl border border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-red-500/20 text-red-400 font-mono text-xs font-bold flex items-center justify-center border border-red-500/30">
                        2
                      </span>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">
                        Hero Photo 2 (Secondary Slide)
                      </h4>
                    </div>
                    {currentHeroImagesOnDb[1] && (
                      <span className="text-[10px] font-mono text-emerald-400">
                        Current: Active
                      </span>
                    )}
                  </div>

                  {/* Slide 2 Upload Box */}
                  <div className="border-2 border-dashed border-[#5b32a1]/40 hover:border-[#8b5cf6] bg-black/40 rounded-xl p-5 text-center flex flex-col items-center justify-center cursor-pointer relative group transition-all">
                    <Upload className="h-7 w-7 text-gray-400 group-hover:text-violet-400 transition-all mb-1" />
                    <span className="text-gray-300 font-sans text-xs font-semibold">
                      {slide2File ? "✓ Image Selected" : "Click to select Photo 2"}
                    </span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const compressed = await compressImage(file);
                            setSlide2FileBase64(compressed);
                            const blob = base64ToBlob(compressed);
                            const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
                            setSlide2File(compressedFile);
                            setSlide2Preset('');
                            setSlide2UrlInput('');
                            setEventErrorMsg('');
                          } catch (err) {
                            console.error("Compression failed:", err);
                            setEventErrorMsg("Failed to process image 2.");
                          }
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>

                  {/* Slide 2 Quick Options */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSlide2Url(!showSlide2Url);
                        setShowSlide2Presets(false);
                      }}
                      className={`text-[9px] font-mono px-2.5 py-1 rounded-lg border transition-all ${
                        showSlide2Url ? 'bg-[#5b32a1]/20 border-[#8b5cf6]/50 text-white' : 'bg-[#13141a] text-gray-400 hover:text-white border-white/5'
                      }`}
                    >
                      {slide2UrlInput ? '✓ URL Set' : '+ URL'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSlide2Presets(!showSlide2Presets);
                        setShowSlide2Url(false);
                      }}
                      className={`text-[9px] font-mono px-2.5 py-1 rounded-lg border transition-all ${
                        showSlide2Presets ? 'bg-[#5b32a1]/20 border-[#8b5cf6]/50 text-white' : 'bg-[#13141a] text-gray-400 hover:text-white border-white/5'
                      }`}
                    >
                      {slide2Preset ? '✓ Preset Set' : '+ Presets'}
                    </button>
                  </div>

                  {showSlide2Url && (
                    <input
                      type="url"
                      value={slide2UrlInput}
                      onChange={(e) => {
                        setSlide2UrlInput(e.target.value);
                        setSlide2Preset('');
                        setSlide2FileBase64('');
                        setSlide2File(null);
                      }}
                      placeholder="Photo 2 URL (https://...)"
                      className="w-full bg-[#08090d] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-red-500"
                    />
                  )}

                  {showSlide2Presets && (
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { name: 'Red Gaming Setup', url: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&q=80&w=1200' },
                        { name: 'Billiards & Lounge', url: 'https://images.unsplash.com/photo-1577416412292-747c6607f055?auto=format&fit=crop&q=80&w=1200' },
                      ].map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            setSlide2Preset(preset.url);
                            setSlide2UrlInput('');
                            setSlide2FileBase64('');
                            setSlide2File(null);
                          }}
                          className={`text-[10px] text-left px-2 py-1.5 rounded border transition-colors ${
                            slide2Preset === preset.url ? 'border-red-500 bg-red-950/20 text-white' : 'border-white/10 text-gray-400 hover:bg-white/5'
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {(slide2Preset || slide2UrlInput || slide2FileBase64 || slide2File) && (
                    <div className="bg-[#08090d] border border-white/10 rounded-lg p-2 flex items-center gap-2">
                      <img 
                        src={slide2Preset || slide2UrlInput || (slide2File ? URL.createObjectURL(slide2File) : slide2FileBase64)} 
                        alt="Slide 2 Preview" 
                        className="h-10 w-14 object-cover rounded shrink-0" 
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-[10px] text-gray-300 truncate flex-1 font-mono">
                        Ready for Slide 2
                      </span>
                      <button 
                        type="button"
                        onClick={() => {
                          setSlide2File(null);
                          setSlide2FileBase64('');
                          setSlide2UrlInput('');
                          setSlide2Preset('');
                        }}
                        className="text-[9px] text-red-400 hover:text-red-300 px-2 py-1 bg-red-950/20 rounded"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>

                {/* Save & Reset Actions */}
                <div className="flex gap-2.5 pt-2">
                  <button
                    type="submit"
                    disabled={isUpdatingHero}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg font-bold uppercase text-[11px] tracking-wider transition-all duration-300 hover:shadow-[0_0_10px_rgba(220,38,38,0.3)] flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
                  >
                    {isUpdatingHero ? (
                      <>
                        <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>Publishing Dual Slides...</span>
                      </>
                    ) : (
                      <span>Publish Hero Carousel (Save Both Slides)</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleResetHeroImage}
                    disabled={isUpdatingHero}
                    className="px-3 py-2 bg-[#13141a] hover:bg-[#181922] border border-white/10 text-gray-300 rounded-lg font-mono text-[11px] uppercase tracking-wider transition-all cursor-pointer active:scale-[0.98]"
                  >
                    Reset Defaults
                  </button>
                </div>
              </form>
            </div>

            {/* Right side: Live Dual Slides Carousel Interactive Preview */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-[#0c0d12] border border-white/[0.04] rounded-[24px] p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-white uppercase tracking-[0.12em] font-mono flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-ping inline-block" />
                    <span>Live Carousel Preview</span>
                  </h4>
                  <span className="text-[10px] bg-red-950/30 text-red-400 border border-red-950/60 px-2 py-0.5 rounded-md font-mono font-bold uppercase tracking-widest">
                    {currentHeroImagesOnDb.length > 0 ? `${currentHeroImagesOnDb.length} SLIDES ACTIVE` : "DEFAULT DUAL SLIDES"}
                  </span>
                </div>

                {/* Interactive Mini Preview Box */}
                <div className="aspect-[16/10] bg-black rounded-2xl overflow-hidden relative border border-white/5 shadow-inner group">
                  {currentHeroImagesOnDb.length > 0 ? (
                    <img 
                      src={currentHeroImagesOnDb[adminPreviewSlideIndex % currentHeroImagesOnDb.length]} 
                      alt="Active Hero Image" 
                      className="w-full h-full object-cover transition-all duration-500"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1200";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-950/80 p-6 text-center shadow-inner">
                      <Image className="h-10 w-10 text-gray-600 mb-2" />
                      <span className="block text-xs text-gray-400 font-bold uppercase tracking-wider font-sans">
                        Showing Static Default Dual Slides
                      </span>
                      <span className="block text-[10px] text-gray-500 font-mono mt-1">
                        Slide 1: Real Cage Atmosphere • Slide 2: Dynamic Red Setup
                      </span>
                    </div>
                  )}

                  {/* Mini Preview Navigation buttons */}
                  {currentHeroImagesOnDb.length > 1 && (
                    <div className="absolute inset-0 flex items-center justify-between p-2 pointer-events-none">
                      <button
                        type="button"
                        onClick={() => setAdminPreviewSlideIndex((prev) => (prev - 1 + currentHeroImagesOnDb.length) % currentHeroImagesOnDb.length)}
                        className="p-1.5 rounded-full bg-black/60 text-white hover:bg-black/90 pointer-events-auto border border-white/20 transition-transform active:scale-95"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminPreviewSlideIndex((prev) => (prev + 1) % currentHeroImagesOnDb.length)}
                        className="p-1.5 rounded-full bg-black/60 text-white hover:bg-black/90 pointer-events-auto border border-white/20 transition-transform active:scale-95"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent pointer-events-none" />
                  <div className="absolute bottom-3 left-3 right-3 text-left pointer-events-none">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-red-400 font-bold block">
                      HOMEPAGE CAROUSEL PREVIEW
                    </span>
                    <span className="text-xs font-black text-white uppercase tracking-wider truncate block">
                      Auto-switches every 4.5s • Swipe gesture enabled
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-red-950/10 border border-red-950/20 rounded-xl space-y-1">
                  <span className="text-[9px] text-red-400 font-black tracking-widest uppercase font-mono block">
                    DUAL HERO SWIPE & AUTO SWITCH
                  </span>
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    Users on mobile or desktop can swipe left/right across the hero image, or let the slider automatically alternate between both photos.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
