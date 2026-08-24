import React, { useState, useRef, useEffect } from 'react';
import { User, Shield, Edit2, Check, RefreshCw, Copy, Trash2, LogOut, Coins, Gift, Plus } from 'lucide-react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useProfile } from './AuthGate';
import gtaPoster from '../assets/images/regenerated_image_1785825766465.jpg';
import dbdPoster from '../assets/images/dbd_oni_poster_1785702645171.jpg';
import witcher3Poster from '../assets/images/regenerated_image_1785791509479.jpg';
import godofwarPoster from '../assets/images/regenerated_image_1785791512523.jpg';
import spidermanPoster from '../assets/images/regenerated_image_1785825118332.jpg';
import nfsPoster from '../assets/images/regenerated_image_1785791519553.jpg';
import starwarsPoster from '../assets/images/regenerated_image_1785791524976.jpg';
import sekiroPoster from '../assets/images/regenerated_image_1785791527638.jpg';
import horizonPoster from '../assets/images/regenerated_image_1785824353021.jpg';
import eldenringPoster from '../assets/images/regenerated_image_1785824355280.jpg';
import doomPoster from '../assets/images/regenerated_image_1785824356729.jpg';
import valhallaPoster from '../assets/images/regenerated_image_1785824827860.jpg';
import tombraiderPoster from '../assets/images/regenerated_image_1785825768606.jpg';
import deathstrandingPoster from '../assets/images/regenerated_image_1785825770123.jpg';
import rdr2Poster from '../assets/images/regenerated_image_1785826140542.jpg';
import tsushimaPoster from '../assets/images/regenerated_image_1785827151440.jpg';
import cybersamuraiPoster from '../assets/images/cyber_samurai_ai_poster_1783849329015.jpg';

function AnimatedCounter({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let start = displayValue;
    const end = value;
    if (start === end) return;

    const startTime = performance.now();
    let animationFrameId: number;

    const updateCounter = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function - easeOutQuad
      const easedProgress = progress * (2 - progress);
      const current = Math.floor(start + (end - start) * easedProgress);

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateCounter);
      } else {
        setDisplayValue(end);
      }
    };

    animationFrameId = requestAnimationFrame(updateCounter);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [value, duration]);

  return <span>{displayValue}</span>;
}

const STEAM_GAMES = [
  { id: 'cyberpunk', name: 'Cyberpunk 2077', appId: '1091500' },
  { id: 'horizon', name: 'Horizon Forbidden West', appId: '2420110' },
  { id: 'doom', name: 'Doom Eternal', appId: '782330' },
  { id: 'valhalla', name: "Assassin's Creed Valhalla", appId: '2208920' },
  { id: 'eldenring', name: 'Elden Ring', appId: '1245620' },
  { id: 'sekiro', name: 'Sekiro: Shadows Die Twice', appId: '814380' },
  { id: 'starwars', name: 'Star Wars Jedi: Survivor', appId: '1774580' },
  { id: 'godofwar', name: 'God of War', appId: '1593500' },
  { id: 'witcher3', name: 'The Witcher 3: Wild Hunt', appId: '292030' },
  { id: 'cod', name: 'Call of Duty: Modern Warfare', appId: '1938090' },
  { id: 'spiderman', name: "Marvel's Spider-Man Remastered", appId: '1817070' },
  { id: 'nfs', name: 'Need for Speed Unbound', appId: '1262540' },
  { id: 'rdr2', name: 'Red Dead Redemption II', appId: '1174180' },
  { id: 'dbd', name: 'Dead by Daylight', appId: '381210' },
  { id: 're4', name: 'Resident Evil 4', appId: '2050650' },
  { id: 'tombraider', name: 'Shadow of the Tomb Raider', appId: '750920' },
  { id: 'gtav', name: 'Grand Theft Auto V', appId: '271590' },
  { id: 'tsushima', name: 'Ghost of Tsushima', appId: '2215430' },
  { id: 'deathstranding', name: 'Death Stranding', appId: '1190460' },
  { id: 'cybersamurai', name: 'Cyber Samurai', appId: '1091500' }
];

const GAME_POSTERS = STEAM_GAMES.map(game => {
  let url = `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${game.appId}/library_600x900.jpg`;
  if (game.id === 'gtav') url = gtaPoster;
  else if (game.id === 'dbd') url = dbdPoster;
  else if (game.id === 'sekiro') url = sekiroPoster;
  else if (game.id === 'starwars') url = starwarsPoster;
  else if (game.id === 'godofwar') url = godofwarPoster;
  else if (game.id === 'witcher3') url = witcher3Poster;
  else if (game.id === 'spiderman') url = spidermanPoster;
  else if (game.id === 'nfs') url = nfsPoster;
  else if (game.id === 'horizon') url = horizonPoster;
  else if (game.id === 'eldenring') url = eldenringPoster;
  else if (game.id === 'doom') url = doomPoster;
  else if (game.id === 'valhalla') url = valhallaPoster;
  else if (game.id === 'tombraider') url = tombraiderPoster;
  else if (game.id === 'deathstranding') url = deathstrandingPoster;
  else if (game.id === 'rdr2') url = rdr2Poster;
  else if (game.id === 'tsushima') url = tsushimaPoster;
  else if (game.id === 'cybersamurai') url = cybersamuraiPoster;

  return {
    id: game.id,
    name: game.name,
    url
  };
});

export default function ProfileView() {
  const { profile, loading, quotaExceeded } = useProfile();
  
  const [isSavingPic, setIsSavingPic] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [localUploadPic, setLocalUploadPic] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isGamePosterModalOpen, setIsGamePosterModalOpen] = useState(false);
  
  // Inline edit states
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editGamerTag, setEditGamerTag] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Reset optimistic local image once snapshot is synchronized
  useEffect(() => {
    if (profile?.profilePic) {
      setLocalUploadPic(null);
    }
  }, [profile?.profilePic]);

  // Lock body scroll and completely hide footer when "Set Gaming DP" modal is active
  useEffect(() => {
    if (isGamePosterModalOpen) {
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
  }, [isGamePosterModalOpen]);

  // 10 Prominent Gaming Characters with stylized backgrounds and representative faces/emblems
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

  if (loading || !profile) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-neutral-500 uppercase tracking-widest animate-pulse">Synchronizing Gamer Deck...</p>
        </div>
      </div>
    );
  }

  // Map values directly from real-time profile state to preserve downstream rendering references exactly
  const firstName = profile.firstName;
  const lastName = profile.lastName;
  const email = profile.email;
  const phone = profile.phone;
  const gamerTag = profile.gamerTag;
  const clanName = profile.clanName;
  const favoriteGame = profile.favoriteGame;
  const activeWeapon = profile.activeWeapon;
  const motto = profile.motto;
  const profilePic = profile.profilePic;
  const profileId = profile.profileId;

  const generate8DigitId = () => {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
  };

  const regenerateId = async () => {
    const newId = generate8DigitId();
    const currentUser = auth.currentUser;
    localStorage.setItem('cage_profile_id', newId);
    if (quotaExceeded) {
      window.location.reload();
      return;
    }
    if (currentUser) {
      try {
        await setDoc(doc(db, "users", currentUser.uid), { profileId: newId }, { merge: true });
      } catch (e) {
        console.warn("Could not save profile ID in cloud, saved locally:", e);
      }
    }
  };

  const startEditing = () => {
    setEditFirstName(firstName);
    setEditLastName(lastName);
    setEditEmail(email);
    setEditPhone(phone);
    setEditGamerTag(gamerTag);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const handleSaveEdits = async () => {
    const currentUser = auth.currentUser;
    
    // Always instantly write to localStorage so the changes persist in fallback mode
    localStorage.setItem('cage_first_name', editFirstName.trim());
    localStorage.setItem('cage_last_name', editLastName.trim());
    localStorage.setItem('cage_email', editEmail.trim());
    localStorage.setItem('cage_phone', editPhone.trim());
    localStorage.setItem('cage_gamer_tag', editGamerTag.trim());

    if (quotaExceeded) {
      setIsEditing(false);
      window.location.reload();
      return;
    }

    if (currentUser) {
      try {
        await setDoc(doc(db, "users", currentUser.uid), {
          firstName: editFirstName.trim(),
          lastName: editLastName.trim(),
          name: `${editFirstName.trim()} ${editLastName.trim()}`.trim(),
          email: editEmail.trim(),
          phone: editPhone.trim(),
          gamerTag: editGamerTag.trim()
        }, { merge: true });
        setIsEditing(false);
      } catch (e) {
        console.warn("Could not save to Cloud Firestore database, stored locally:", e);
        setIsEditing(false);
        // Force reload page to re-render cached profile values from local state
        window.location.reload();
      }
    }
  };

  // Drag and Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload a valid image file (PNG, JPG, or WEBP).');
      return;
    }
    
    setUploadError('');
    setUploadSuccess(false);
    setIsSavingPic(true);

    try {
      // 1. Convert to compressed, scaled-down base64 to ensure it remains well under Firestore's 1MB document size limit (usually ~20-40KB)
      const compressedBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxWidth = 350;
            const maxHeight = 350;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
              }
            } else {
              if (height > maxHeight) {
                width = Math.round((width * maxHeight) / height);
                height = maxHeight;
              }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(e.target?.result as string);
              return;
            }

            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            resolve(dataUrl);
          };
          img.onerror = () => reject(new Error('Failed to load image into browser layout.'));
          img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Failed to read files.'));
        reader.readAsDataURL(file);
      });

      // 2. Optimistic UI: Sync to local state and localStorage immediately
      setLocalUploadPic(compressedBase64);
      localStorage.setItem('cage_profile_pic', compressedBase64);

      if (quotaExceeded) {
        setIsSavingPic(false);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
        return;
      }

      // 3. Persist compressed image base64 directly into Firestore
      const currentUser = auth.currentUser;
      if (currentUser) {
        await setDoc(doc(db, "users", currentUser.uid), { profilePic: compressedBase64 }, { merge: true });
        setIsSavingPic(false);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        setIsSavingPic(false);
      }
    } catch (err: any) {
      console.error("Error compressing/uploading profile image:", err);
      setUploadError(err?.message || 'Failed to process and upload profile picture.');
      setIsSavingPic(false);
    }
  };

  const handleSelectPreset = async (presetId: string) => {
    const preset = PRESET_AVATARS.find(p => p.id === presetId);
    if (preset) {
      const presetPicVal = `PRESET:${presetId}`;
      localStorage.setItem('cage_profile_pic', presetPicVal);

      if (quotaExceeded) {
        window.location.reload();
        return;
      }

      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          await setDoc(doc(db, "users", currentUser.uid), { profilePic: presetPicVal }, { merge: true });
        } catch (e) {
          console.warn("Could not save preset avatar to Firestore, saved locally:", e);
          window.location.reload();
        }
      }
    }
  };

  const handleSelectGamePoster = async (imageUrl: string) => {
    setIsSavingPic(true);
    setUploadError('');
    setUploadSuccess(false);

    try {
      // 1. Optimistic UI: Sync to local state and localStorage immediately
      setLocalUploadPic(imageUrl);
      localStorage.setItem('cage_profile_pic', imageUrl);

      if (quotaExceeded) {
        setIsSavingPic(false);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
        setIsGamePosterModalOpen(false);
        return;
      }

      // 2. Persist directly into Firestore
      const currentUser = auth.currentUser;
      if (currentUser) {
        await setDoc(doc(db, "users", currentUser.uid), { profilePic: imageUrl }, { merge: true });
        setIsSavingPic(false);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        setIsSavingPic(false);
      }
      setIsGamePosterModalOpen(false);
    } catch (err: any) {
      console.error("Error setting game poster as avatar:", err);
      setUploadError(err?.message || 'Failed to update profile picture.');
      setIsSavingPic(false);
      setIsGamePosterModalOpen(false);
    }
  };

  const deleteProfilePic = async () => {
    localStorage.setItem('cage_profile_pic', '');

    if (quotaExceeded) {
       window.location.reload();
       return;
    }

    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        await setDoc(doc(db, "users", currentUser.uid), { profilePic: "" }, { merge: true });
      } catch (e) {
        console.warn("Could not clear avatar in cloud, cleared locally:", e);
        window.location.reload();
      }
    }
  };



  const scrollPresets = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const copyIdToClipboard = () => {
    navigator.clipboard.writeText(profileId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const copyReferralToClipboard = () => {
    if (profile?.referralCode) {
      navigator.clipboard.writeText(profile.referralCode);
      setCopiedReferral(true);
      setTimeout(() => setCopiedReferral(false), 2000);
    }
  };

  const renderProfileImage = () => {
    const activePic = localUploadPic || profilePic;
    let imgNode;
    if (activePic && activePic.startsWith('PRESET:')) {
      const presetId = activePic.split(':')[1];
      const preset = PRESET_AVATARS.find(p => p.id === presetId) || PRESET_AVATARS[0];
      imgNode = (
        <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${preset.gradient} border-[3px] border-red-600 flex items-center justify-center text-4xl shadow-lg shadow-red-950/40 relative group`}>
          <span>{preset.text}</span>
        </div>
      );
    } else if (activePic) {
      imgNode = (
        <img 
          src={activePic} 
          alt="User Profile" 
          className="w-32 h-32 rounded-full object-cover border-[3px] border-red-600 shadow-lg shadow-red-950/40"
          referrerPolicy="no-referrer"
        />
      );
    } else {
      imgNode = (
        <div className="w-32 h-32 rounded-full bg-neutral-900 border-[3px] border-dashed border-red-600/30 flex flex-col items-center justify-center text-gray-500 shadow-inner">
          <User className="h-12 w-12 text-gray-600 mb-1" />
          <span className="text-[10px] uppercase font-mono tracking-wider">NO AVATAR</span>
        </div>
      );
    }

    return (
      <div className="relative">
        {imgNode}
        {isSavingPic && (
          <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center border-2 border-red-500">
            <RefreshCw className="h-5 w-5 text-red-500 animate-spin" />
            <span className="text-[8px] text-white font-mono uppercase tracking-widest font-black mt-1">SAVING...</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="pt-2 pb-10 max-w-4xl mx-auto space-y-12">
      {/* Page Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600/10 border border-red-600/20 rounded-full text-red-500 text-[10px] font-mono font-bold tracking-[0.16em] uppercase">
          <Shield className="h-3.5 w-3.5" />
          <span>CYBER_IDENTITY_DECK</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-sans font-black tracking-tight text-white uppercase">
          Gamer <span className="text-red-500 font-sans font-bold not-italic no-underline">Profile</span>
        </h2>
        <p className="text-xs text-gray-400 font-sans max-w-md mx-auto">
          Customize your e-arena credentials, upload visual identity parameters, and sync your dynamic battle status inside the CAGE.
        </p>
      </div>

      {/* Cage Coins Display Card */}
      <div className="max-w-md mx-auto w-full bg-[#111115] border border-amber-500/20 rounded-2xl p-5 shadow-xl relative overflow-hidden group">
        {/* Shiny absolute watermark 'G' background decoration */}
        <div className="absolute top-[20%] -right-[10%] text-[130px] font-black pointer-events-none opacity-[0.02] select-none text-amber-500 font-display">
          G
        </div>
        
        <div className="flex items-center gap-5">
          {/* Golden circle coin icon with glass glare shine accent */}
          <div className="relative h-16 w-16 bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/10 shrink-0 border border-amber-200/50">
            {/* Top right glass glow reflection line */}
            <div className="absolute top-1 left-2 w-8 h-2.5 bg-white/20 rounded-full rotate-[-15deg]" />
            {/* Inner coin carving circle border */}
            <div className="absolute inset-1 rounded-full border border-amber-300/40" />
            <span className="text-3xl font-display font-extrabold text-amber-955 select-none text-amber-950">G</span>
          </div>

          <div className="text-left space-y-0.5">
            <span className="text-[10px] font-mono tracking-[0.18em] text-amber-500 font-black uppercase block">
              CAGE COINS
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-sans font-black text-amber-400 tracking-tight flex items-baseline select-none">
                <AnimatedCounter value={profile.cageCoins || 0} />
              </span>
              <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-wider">CGC</span>
            </div>
          </div>
        </div>

        {/* Divider line style */}
        <div className="h-[1px] bg-zinc-800/85 my-4" />

        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 uppercase font-black">
          <div className="flex items-center gap-1.5 font-bold tracking-wider">
            <span className="inline-block h-1.5 w-1.5 bg-amber-500 rounded-full animate-ping" />
            <span>1 Cage Coin = ₹1</span>
          </div>
          <div className="text-amber-500 font-black tracking-widest bg-amber-500/5 px-2 py-1 rounded-md border border-amber-500/10">
            ₹<AnimatedCounter value={profile.cageCoins || 0} /> VALUE
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-stretch justify-center gap-8 max-w-3xl mx-auto">
        
        {/* Profile White Card */}
        <div className="flex-1 bg-white border border-red-500/30 p-6 rounded-2xl flex flex-col items-center relative overflow-hidden group shadow-lg shadow-red-500/5">
          {/* Visual tech matrix style guidelines */}
          <div className="absolute top-0 left-0 w-8 h-[1px] bg-red-500/50" />
          <div className="absolute top-0 left-0 w-[1px] h-8 bg-red-500/50" />
          <div className="absolute bottom-0 right-0 w-8 h-[1px] bg-red-500/50" />
          <div className="absolute bottom-0 right-0 w-[1px] h-8 bg-red-500/50" />
          
          <div className="relative">
            <button 
              onClick={() => setIsGamePosterModalOpen(true)}
              className="relative cursor-pointer group focus:outline-none bg-transparent border-0 p-0 block hover:scale-[1.03] transition-all duration-300 animate-in fade-in"
              title="Select gaming avatar"
              disabled={isEditing}
            >
              {renderProfileImage()}
            </button>

            {/* Plus Icon to open the game wallpaper selection modal */}
            {!isEditing && (
              <button
                onClick={() => setIsGamePosterModalOpen(true)}
                className="absolute bottom-1 right-1 bg-red-600 hover:bg-red-500 text-black hover:scale-110 active:scale-95 transition-all duration-200 p-2 rounded-full shadow-md border-2 border-white cursor-pointer z-10 flex items-center justify-center"
                title="Select premium gaming avatar"
              >
                <Plus className="h-4 w-4 stroke-[3px]" />
              </button>
            )}
          </div>



          {uploadSuccess && (
            <div className="mt-4 p-2.5 w-full bg-emerald-50 border border-emerald-200 rounded-xl text-center text-emerald-800 font-mono text-[10px] font-black uppercase tracking-wider animate-in slide-in-from-top-1">
              ✓ PROFILE DP SAVED SUCCESSFULLY!
            </div>
          )}

          {uploadError && (
            <div className="mt-4 p-2.5 w-full bg-red-50 border border-red-200 rounded-xl text-center text-red-800 font-mono text-[10px] font-black uppercase tracking-wider animate-in slide-in-from-top-1">
              ⚠ {uploadError}
            </div>
          )}

          {/* Fields editing and displaying inside the white box */}
          <div className="mt-5 w-full border-t border-neutral-100 pt-4 space-y-4 text-left">
            {!isEditing ? (
              // Read-only state
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block font-bold">Full Name</span>
                  <span className="text-sm font-sans font-extrabold text-zinc-950 block mt-0.5">
                    {firstName || lastName ? `${firstName} ${lastName}` : 'Not registered'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pb-1">
                  <div>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block font-bold">First Name</span>
                    <span className="text-xs font-sans font-bold text-zinc-900 block mt-0.5">
                      {firstName || 'Not registered'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block font-bold">Last Name</span>
                    <span className="text-xs font-sans font-bold text-zinc-900 block mt-0.5">
                      {lastName || 'Not registered'}
                    </span>
                  </div>
                </div>
                <div className="border-t border-neutral-100 pt-3">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block font-bold">Email ID</span>
                  <span className="text-xs font-sans font-semibold text-zinc-900 break-all block mt-0.5">
                    {email || 'Not registered'}
                  </span>
                </div>
                <div className="border-t border-neutral-100 pt-3">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block font-bold">Phone Number</span>
                  <span className="text-xs font-sans font-semibold text-zinc-900 block mt-0.5">
                    {phone || 'Not registered'}
                  </span>
                </div>
                <div className="border-t border-neutral-100 pt-3">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block font-bold">Gaming Tag Name</span>
                  <span className="text-xs font-mono font-bold text-black block mt-0.5 tracking-wider uppercase">
                    // {gamerTag || 'NOT_SET'}
                  </span>
                </div>

                <div className="border-t border-zinc-150 pt-4 mt-2">
                  <div className="bg-gradient-to-br from-amber-50 via-amber-100/40 to-amber-100/80 border border-amber-200 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-mono text-amber-800 uppercase tracking-[0.10em] block font-black mb-1">
                      🎁 Invite your friend get 10 cage coin
                    </span>
                    <p className="text-[10px] text-amber-750 font-sans max-w-xs mx-auto leading-relaxed font-semibold mb-2.5">
                      Your friend gets starting 8 coins. You get a random code bonus of 1 to 10 coins!
                    </p>
                    <div className="flex items-center justify-between bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 max-w-[200px] mx-auto shadow-sm">
                      <span className="text-xs font-mono font-bold text-amber-950 tracking-widest uppercase">
                        {profile?.referralCode}
                      </span>
                      <button
                        onClick={copyReferralToClipboard}
                        className="p-1.5 text-amber-700 hover:text-amber-950 transition-all focus:outline-none bg-transparent border-0 cursor-pointer"
                        title="Copy Referral Code"
                      >
                        {copiedReferral ? (
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Inline interactive editing state inside the white box
              <div className="space-y-3.5 animate-in fade-in duration-200">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-mono uppercase tracking-wider text-zinc-500 font-bold">First Name</label>
                    <input
                      type="text"
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      className="w-full bg-neutral-50 hover:bg-neutral-100/50 border border-neutral-200 focus:border-red-500 focus:ring-1 focus:ring-red-500/30 rounded-lg px-3 py-2 text-xs text-neutral-900 font-sans focus:outline-none transition-all font-semibold"
                      placeholder="Enter First Name..."
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-mono uppercase tracking-wider text-zinc-500 font-bold">Last Name</label>
                    <input
                      type="text"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      className="w-full bg-neutral-50 hover:bg-neutral-100/50 border border-neutral-200 focus:border-red-500 focus:ring-1 focus:ring-red-500/30 rounded-lg px-3 py-2 text-xs text-neutral-900 font-sans focus:outline-none transition-all font-semibold"
                      placeholder="Enter Last Name..."
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-mono uppercase tracking-wider text-zinc-500 font-bold">Email ID</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-neutral-50 hover:bg-neutral-100/50 border border-neutral-200 focus:border-red-500 focus:ring-1 focus:ring-red-500/30 rounded-lg px-3 py-2 text-xs text-neutral-950 font-sans focus:outline-none transition-all font-semibold"
                    placeholder="Enter Email Address..."
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-mono uppercase tracking-wider text-zinc-500 font-bold">Phone Number</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-neutral-50 hover:bg-neutral-100/50 border border-neutral-200 focus:border-red-500 focus:ring-1 focus:ring-red-500/30 rounded-lg px-3 py-2 text-xs text-neutral-950 font-sans focus:outline-none transition-all font-semibold"
                    placeholder="Enter Phone Number..."
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-mono uppercase tracking-wider text-zinc-500 font-bold">Gaming Tag name</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-600 font-mono text-xs font-black select-none">
                      //
                    </span>
                    <input
                      type="text"
                      value={editGamerTag}
                      onChange={(e) => setEditGamerTag(e.target.value)}
                      className="w-full bg-neutral-50 hover:bg-neutral-100/50 border border-neutral-200 focus:border-red-500 focus:ring-1 focus:ring-red-500/30 rounded-lg px-3 pl-8 py-2 text-xs text-black font-mono focus:outline-none uppercase font-extrabold tracking-wider transition-all"
                      placeholder="Enter Gaming Tag..."
                      required
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Crucial requirement: small eight-digit profile ID below the picture (visible in black) */}
          <div className="mt-5 w-full border-t border-neutral-150 pt-4 flex flex-col items-center space-y-1">
            <span className="text-[10px] font-mono text-black uppercase tracking-widest font-black">TOTAL ACCESS ID</span>
            <div id="profile-id-display" className="flex items-center gap-2 bg-neutral-100 px-2.5 py-1.5 rounded-lg border border-neutral-300">
              <span className="text-xs font-mono font-bold text-black tracking-widest">{profileId}</span>
              <button 
                onClick={copyIdToClipboard}
                className="p-1 text-neutral-600 hover:text-black transition-colors focus:outline-none bg-transparent border-0 cursor-pointer"
                title="Copy ID to Clipboard"
              >
                {copiedId ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
            <div className="flex gap-4 justify-center pt-2">
              <button 
                onClick={regenerateId}
                className="text-[9px] font-mono text-black hover:text-red-600 flex items-center gap-1.5 tracking-widest uppercase transition-colors bg-transparent border-0 font-extrabold cursor-pointer"
              >
                <RefreshCw className="h-3 w-3 text-black" />
                <span>Rolling ID</span>
              </button>
              {profilePic && !isEditing && (
                <button 
                  onClick={deleteProfilePic}
                  className="text-[9px] font-mono text-neutral-500 hover:text-red-600 flex items-center gap-1.5 tracking-widest uppercase transition-colors bg-transparent border-0 cursor-pointer font-bold"
                >
                  <Trash2 className="h-3 w-3 text-neutral-505" />
                  <span>Clear Pic</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Control Options panel next to the box */}
        <div className="flex flex-col md:w-56 shrink-0 gap-4 text-left animate-in fade-in">
          {!isEditing ? (
            <button
              onClick={startEditing}
              className="w-full px-4 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 hover:scale-[1.02] active:scale-[0.98] text-black flex items-center justify-center gap-2 text-xs uppercase font-mono tracking-wider font-black transition-all cursor-pointer shadow-lg shadow-red-600/20"
            >
              <Edit2 className="h-4 w-4" />
              <span>Edit Profile</span>
            </button>
          ) : (
            <div className="flex flex-col gap-2.5">
              <button
                onClick={handleSaveEdits}
                className="w-full px-4 py-3.5 rounded-xl bg-green-600 hover:bg-green-500 hover:scale-[1.02] active:scale-[0.98] text-black flex items-center justify-center gap-2 text-xs uppercase font-mono tracking-wider font-black transition-all cursor-pointer shadow-lg shadow-green-600/20 animate-pulse"
              >
                <Check className="h-4 w-4" />
                <span>Save Profile</span>
              </button>
              <button
                onClick={cancelEditing}
                className="w-full px-4 py-3 rounded-xl border border-white/10 text-neutral-400 hover:text-white hover:bg-white/[0.04] flex items-center justify-center gap-2 text-xs uppercase font-mono tracking-wider font-bold transition-all cursor-pointer"
              >
                <span>Cancel</span>
              </button>
            </div>
          )}

          <button
            onClick={async () => {
              try {
                await signOut(auth);
                localStorage.removeItem('cage_profile_uid');
                localStorage.removeItem('cage_first_name');
                localStorage.removeItem('cage_last_name');
                localStorage.removeItem('cage_email');
                localStorage.removeItem('cage_phone');
                localStorage.removeItem('cage_gamer_tag');
                localStorage.removeItem('cage_clan_name');
                localStorage.removeItem('cage_favorite_game');
                localStorage.removeItem('cage_active_weapon');
                localStorage.removeItem('cage_motto');
                localStorage.removeItem('cage_profile_pic');
                localStorage.removeItem('cage_profile_id');
                localStorage.removeItem('cage_coins');
                localStorage.removeItem('cage_referral_code');
                localStorage.removeItem('cage_referral_completed');
              } catch (err) {
                console.warn("Sign out notice:", err);
              }
            }}
            className="w-full px-4 py-3.5 rounded-xl border border-white/10 hover:border-red-600/30 hover:bg-red-950/20 text-neutral-400 hover:text-red-500 flex items-center justify-center gap-2 text-xs uppercase font-mono tracking-wider font-bold transition-all cursor-pointer bg-black/30"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>

      </div>

      {/* Game Avatar Selection Modal */}
      {isGamePosterModalOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100000]"
            onClick={() => setIsGamePosterModalOpen(false)}
          />
          
          {/* Modal Container */}
          <div className="relative z-[100001] bg-[#0d0d11] border-2 border-red-500/40 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl shadow-red-950/80 max-h-[85vh] flex flex-col animate-in scale-in duration-300">
            {/* Header */}
            <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between shrink-0 bg-[#0d0d11]">
              <div className="space-y-1">
                <h3 className="text-lg font-mono font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                  Select Gaming DP
                </h3>
                <p className="text-[11px] font-sans text-neutral-400">
                  Tap on your favorite game art to immediately update your cyber deck avatar.
                </p>
              </div>
              <button
                onClick={() => setIsGamePosterModalOpen(false)}
                className="text-neutral-400 hover:text-white transition-colors text-xs font-mono uppercase bg-neutral-900 border border-zinc-800 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-neutral-800"
              >
                Close
              </button>
            </div>

            {/* Scrollable grid area */}
            <div className="p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-red-600 scrollbar-track-zinc-950 space-y-4 bg-[#0d0d11]">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-2">
                {GAME_POSTERS.map((game) => {
                  const isCurrent = (localUploadPic || profilePic) === game.url;
                  return (
                    <button
                      key={game.id}
                      onClick={() => handleSelectGamePoster(game.url)}
                      title={game.name}
                      className={`group relative text-left bg-neutral-900/60 hover:bg-neutral-900 border rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] outline-none flex flex-col ${
                        isCurrent ? 'border-red-600 ring-2 ring-red-600/30' : 'border-zinc-800 hover:border-red-500/50'
                      }`}
                    >
                      <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-950">
                        <img
                          src={game.url}
                          alt={game.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />
                        
                        {isCurrent && (
                          <div className="absolute top-2 right-2 bg-red-600 text-black font-black p-1 rounded-full shadow-lg">
                            <Check className="h-3.5 w-3.5 stroke-[3.5px]" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
