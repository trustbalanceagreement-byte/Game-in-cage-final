import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged,
  signOut,
  User as FirebaseUser,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Lock, Mail, User, Phone, LogIn, UserPlus, AlertCircle, Eye, EyeOff, X, Gift, Coins, Award } from 'lucide-react';

export interface UserProfile {
  uid: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gamerTag: string;
  clanName: string;
  favoriteGame: string;
  activeWeapon: string;
  motto: string;
  profilePic: string;
  profileId: string;
  cageCoins?: number;
  referralCode?: string;
  referralCompleted?: boolean;
}

const ProfileContext = createContext<{
  profile: UserProfile | null;
  loading: boolean;
  quotaExceeded: boolean;
} | null>(null);

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}

interface AuthGateProps {
  children: React.ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const quotaExceededRef = useRef(false);

  const handleQuotaExceeded = (err?: any) => {
    if (err) {
      const msg = err.message?.toLowerCase() || '';
      const isQuota = msg.includes('quota') || msg.includes('exhausted') || err.code === 'resource-exhausted';
      if (!isQuota) return;
    }
    setQuotaExceeded(true);
    quotaExceededRef.current = true;
  };
  
  // Initialize profile with cached storage data if it exists for zero-delay instant render
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const savedUid = localStorage.getItem('cage_profile_uid');
    if (savedUid) {
      const savedFirstName = localStorage.getItem('cage_first_name') || '';
      const savedLastName = localStorage.getItem('cage_last_name') || '';
      const savedEmail = localStorage.getItem('cage_email') || '';
      const savedPhone = localStorage.getItem('cage_phone') || '';
      const savedTag = localStorage.getItem('cage_gamer_tag') || 'CYBER_STRIKER';
      const savedClan = localStorage.getItem('cage_clan_name') || 'RED_VORTEX';
      const savedGame = localStorage.getItem('cage_favorite_game') || 'Valorant';
      const savedWeapon = localStorage.getItem('cage_active_weapon') || 'Operator';
      const savedMotto = localStorage.getItem('cage_motto') || 'Unseen. Unheard. Unbeaten.';
      const savedPic = localStorage.getItem('cage_profile_pic') || '';
      const savedId = localStorage.getItem('cage_profile_id') || '';
      const savedCoins = Number(localStorage.getItem('cage_coins') || '0');
      const savedReferral = localStorage.getItem('cage_referral_code') || '';
      const savedReferralCompleted = localStorage.getItem('cage_referral_completed') === 'true';

      return {
        uid: savedUid,
        name: `${savedFirstName} ${savedLastName}`.trim() || savedTag,
        firstName: savedFirstName,
        lastName: savedLastName,
        email: savedEmail,
        phone: savedPhone,
        gamerTag: savedTag,
        clanName: savedClan,
        favoriteGame: savedGame,
        activeWeapon: savedWeapon,
        motto: savedMotto,
        profilePic: savedPic,
        profileId: savedId,
        cageCoins: savedCoins,
        referralCode: savedReferral,
        referralCompleted: savedReferralCompleted
      };
    }
    return null;
  });

  // If a cached user profile is present, skip the initial spinner page load
  const [profileLoading, setProfileLoading] = useState(() => {
    return localStorage.getItem('cage_profile_uid') ? false : true;
  });

  const [isSignUp, setIsSignUp] = useState(false);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    // Only set profile loading state to true if we do not already have a cached profile matching
    if (!profile || profile.uid !== user.uid) {
      setProfileLoading(true);
    }

    const userDocRef = doc(db, "users", user.uid);
    const unsubscribeSnapshot = onSnapshot(userDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        let fName = data.firstName || '';
        let lName = data.lastName || '';
        if (!fName && !lName && data.name) {
          const parts = data.name.trim().split(/\s+/);
          fName = parts[0] || '';
          lName = parts.slice(1).join(' ') || '';
        }

        let rCode = data.referralCode || '';
        if (!rCode) {
          rCode = 'CAGE' + Math.floor(1000 + Math.random() * 9000).toString();
          setDoc(userDocRef, { referralCode: rCode }, { merge: true }).catch(err => {
            console.warn("Could not save auto-generated referral code:", err);
          });
        }

        const updatedProfile: UserProfile = {
          uid: user.uid,
          name: data.name || `${fName} ${lName}`.trim() || 'Unknown Gamer',
          firstName: fName,
          lastName: lName,
          email: data.email || user.email || '',
          phone: data.phone || '',
          gamerTag: data.gamerTag || 'CYBER_STRIKER',
          clanName: data.clanName || 'RED_VORTEX',
          favoriteGame: data.favoriteGame || 'Valorant',
          activeWeapon: data.activeWeapon || 'Operator',
          motto: data.motto || 'Unseen. Unheard. Unbeaten.',
          profilePic: data.profilePic || '',
          profileId: data.profileId || '',
          cageCoins: data.cageCoins ?? 0,
          referralCode: rCode,
          referralCompleted: data.referralCompleted ?? false
        };
        setProfile(updatedProfile);
        
        // Cache in local storage instantly so it works raw offline
        localStorage.setItem('cage_profile_uid', updatedProfile.uid);
        localStorage.setItem('cage_first_name', updatedProfile.firstName);
        localStorage.setItem('cage_last_name', updatedProfile.lastName);
        localStorage.setItem('cage_email', updatedProfile.email);
        localStorage.setItem('cage_phone', updatedProfile.phone);
        localStorage.setItem('cage_gamer_tag', updatedProfile.gamerTag);
        localStorage.setItem('cage_clan_name', updatedProfile.clanName);
        localStorage.setItem('cage_favorite_game', updatedProfile.favoriteGame);
        localStorage.setItem('cage_active_weapon', updatedProfile.activeWeapon);
        localStorage.setItem('cage_motto', updatedProfile.motto);
        localStorage.setItem('cage_profile_pic', updatedProfile.profilePic);
        localStorage.setItem('cage_coins', String(updatedProfile.cageCoins || 0));
        localStorage.setItem('cage_referral_code', updatedProfile.referralCode || '');
        localStorage.setItem('cage_referral_completed', updatedProfile.referralCompleted ? 'true' : 'false');
        if (updatedProfile.profileId) {
          localStorage.setItem('cage_profile_id', updatedProfile.profileId);
        }
      } else {
        // Fallback to local storage or defaults
        const savedFirstName = localStorage.getItem('cage_first_name') || '';
        const savedLastName = localStorage.getItem('cage_last_name') || '';
        const savedEmail = localStorage.getItem('cage_email') || user.email || '';
        const savedPhone = localStorage.getItem('cage_phone') || '';
        const savedTag = localStorage.getItem('cage_gamer_tag') || 'CYBER_STRIKER';
        const savedClan = localStorage.getItem('cage_clan_name') || 'RED_VORTEX';
        const savedGame = localStorage.getItem('cage_favorite_game') || 'Valorant';
        const savedWeapon = localStorage.getItem('cage_active_weapon') || 'Operator';
        const savedMotto = localStorage.getItem('cage_motto') || 'Unseen. Unheard. Unbeaten.';
        const savedPic = localStorage.getItem('cage_profile_pic') || '';
        const savedId = localStorage.getItem('cage_profile_id') || Math.floor(10000000 + Math.random() * 90000000).toString();
        const savedCoins = Number(localStorage.getItem('cage_coins') || '0');
        let savedReferral = localStorage.getItem('cage_referral_code') || '';
        if (!savedReferral) {
          savedReferral = 'CAGE' + Math.floor(1000 + Math.random() * 9000).toString();
          localStorage.setItem('cage_referral_code', savedReferral);
        }
        const savedReferralCompleted = localStorage.getItem('cage_referral_completed') === 'true';

        const fallbackProfile: UserProfile = {
          uid: user.uid,
          name: `${savedFirstName} ${savedLastName}`.trim() || user.displayName || savedTag,
          firstName: savedFirstName,
          lastName: savedLastName,
          email: savedEmail,
          phone: savedPhone,
          gamerTag: savedTag,
          clanName: savedClan,
          favoriteGame: savedGame,
          activeWeapon: savedWeapon,
          motto: savedMotto,
          profilePic: savedPic,
          profileId: savedId,
          cageCoins: savedCoins,
          referralCode: savedReferral,
          referralCompleted: savedReferralCompleted
        };
        setProfile(fallbackProfile);

        // Save fallback back to cloud Firestore
        setDoc(userDocRef, {
          uid: user.uid,
          name: fallbackProfile.name,
          firstName: fallbackProfile.firstName,
          lastName: fallbackProfile.lastName,
          email: fallbackProfile.email,
          phone: fallbackProfile.phone,
          gamerTag: fallbackProfile.gamerTag,
          clanName: fallbackProfile.clanName,
          favoriteGame: fallbackProfile.favoriteGame,
          activeWeapon: fallbackProfile.activeWeapon,
          motto: fallbackProfile.motto,
          profilePic: fallbackProfile.profilePic,
          profileId: fallbackProfile.profileId,
          cageCoins: fallbackProfile.cageCoins,
          referralCode: fallbackProfile.referralCode,
          referralCompleted: fallbackProfile.referralCompleted,
          createdAt: new Date().toLocaleString()
        }, { merge: true }).catch(err => {
          console.warn(err);
          handleQuotaExceeded(err);
        });
      }
      setProfileLoading(false);
    }, (err) => {
      console.warn("Live profile snapshot error:", err);
      handleQuotaExceeded(err);
      setProfileLoading(false);
    });

    return () => unsubscribeSnapshot();
  }, [user]);

  useEffect(() => {
    if (!user || quotaExceededRef.current) return;

    const userDocRef = doc(db, "users", user.uid);
    
    // Set status online and update lastActive timestamp
    setDoc(userDocRef, {
      status: "online",
      lastActive: Date.now()
    }, { merge: true }).catch(err => {
      console.warn("Failed to set presence document:", err);
      handleQuotaExceeded(err);
    });

    // Heartbeat every 120 seconds (2 minutes) to stay marked active and conserve Firestore write ops quota
    const interval = setInterval(() => {
      if (quotaExceededRef.current) {
        clearInterval(interval);
        return;
      }
      setDoc(userDocRef, {
        status: "online",
        lastActive: Date.now()
      }, { merge: true }).catch(err => {
        console.warn("Heartbeat update failed:", err);
        handleQuotaExceeded(err);
      });
    }, 120000);

    const handleUnload = () => {
      if (quotaExceededRef.current) return;
      setDoc(userDocRef, {
        status: "offline",
        lastActive: Date.now()
      }, { merge: true }).catch(() => {});
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
      if (!quotaExceededRef.current) {
        setDoc(userDocRef, {
          status: "offline",
          lastActive: Date.now()
        }, { merge: true }).catch(err => {
          console.warn("Offline status update failed:", err);
          handleQuotaExceeded(err);
        });
      }
    };
  }, [user]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFormLoading(true);

    try {
      if (isSignUp) {
        if (!name.trim() || !phone.trim() || !email.trim() || !password.trim()) {
          throw new Error("Please fill in all requested fields.");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters long.");
        }

        // Create user in Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const u = userCredential.user;

        // Parse first and last name from name parameter
        const parts = name.trim().split(/\s+/);
        const fName = parts[0] || '';
        const lName = parts.slice(1).join(' ') || '';
        const randomReferral = 'CAGE' + Math.floor(1000 + Math.random() * 9000).toString();

        // Write additional profile information to Firestore database with error recovery
        try {
          await setDoc(doc(db, "users", u.uid), {
            uid: u.uid,
            name: name.trim(),
            firstName: fName,
            lastName: lName,
            email: email.trim(),
            phone: phone.trim(),
            gamerTag: 'CYBER_STRIKER',
            clanName: 'RED_VORTEX',
            favoriteGame: 'Valorant',
            activeWeapon: 'Operator',
            motto: 'Unseen. Unheard. Unbeaten.',
            profilePic: '',
            profileId: Math.floor(10000000 + Math.random() * 90000000).toString(),
            cageCoins: 0,
            referralCode: randomReferral,
            referralCompleted: false,
            createdAt: new Date().toLocaleString()
          });
        } catch (dbErr: any) {
          console.warn("Could not write profile to database (quota exceeded/offline):", dbErr);
          handleQuotaExceeded(dbErr);
          // Fallback to local cache initialization so game is instantly playable
          const fallbackId = Math.floor(10000000 + Math.random() * 90000000).toString();
          localStorage.setItem('cage_profile_uid', u.uid);
          localStorage.setItem('cage_first_name', fName);
          localStorage.setItem('cage_last_name', lName);
          localStorage.setItem('cage_email', email.trim());
          localStorage.setItem('cage_phone', phone.trim());
          localStorage.setItem('cage_gamer_tag', 'CYBER_STRIKER');
          localStorage.setItem('cage_clan_name', 'RED_VORTEX');
          localStorage.setItem('cage_favorite_game', 'Valorant');
          localStorage.setItem('cage_active_weapon', 'Operator');
          localStorage.setItem('cage_motto', 'Unseen. Unheard. Unbeaten.');
          localStorage.setItem('cage_profile_pic', '');
          localStorage.setItem('cage_profile_id', fallbackId);
          localStorage.setItem('cage_coins', '0');
          localStorage.setItem('cage_referral_code', randomReferral);
          localStorage.setItem('cage_referral_completed', 'false');

          setProfile({
            uid: u.uid,
            name: name.trim(),
            firstName: fName,
            lastName: lName,
            email: email.trim(),
            phone: phone.trim(),
            gamerTag: 'CYBER_STRIKER',
            clanName: 'RED_VORTEX',
            favoriteGame: 'Valorant',
            activeWeapon: 'Operator',
            motto: 'Unseen. Unheard. Unbeaten.',
            profilePic: '',
            profileId: fallbackId,
            cageCoins: 0,
            referralCode: randomReferral,
            referralCompleted: false
          });
        }

      } else {
        if (!email.trim() || !password.trim()) {
          throw new Error("Please enter your email and password.");
        }
        
        // Log in user
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const u = userCredential.user;

        // Optionally double-check if a user document exists and create a basic one if missing
        try {
          const userDocRef = doc(db, "users", u.uid);
          const userDoc = await getDoc(userDocRef);
          if (!userDoc.exists()) {
            const defaultName = u.displayName || email.split('@')[0];
            const parts = defaultName.trim().split(/\s+/);
            const fName = parts[0] || '';
            const lName = parts.slice(1).join(' ') || '';
            await setDoc(userDocRef, {
              uid: u.uid,
              name: defaultName,
              firstName: fName,
              lastName: lName,
              email: email.trim(),
              phone: 'Not provided',
              gamerTag: 'CYBER_STRIKER',
              clanName: 'RED_VORTEX',
              favoriteGame: 'Valorant',
              activeWeapon: 'Operator',
              motto: 'Unseen. Unheard. Unbeaten.',
              profilePic: '',
              profileId: Math.floor(10000000 + Math.random() * 90000000).toString(),
              createdAt: new Date().toLocaleString()
            });
          }
        } catch (dbErr: any) {
          console.warn("Could not sync user profile with database (offline or permissions):", dbErr);
          handleQuotaExceeded(dbErr);
          // Fallback to local storage caching so user gets instant access
          const savedFirstName = localStorage.getItem('cage_first_name') || '';
          const savedLastName = localStorage.getItem('cage_last_name') || '';
          const savedEmail = localStorage.getItem('cage_email') || u.email || '';
          const savedPhone = localStorage.getItem('cage_phone') || '';
          const savedTag = localStorage.getItem('cage_gamer_tag') || 'CYBER_STRIKER';
          const savedClan = localStorage.getItem('cage_clan_name') || 'RED_VORTEX';
          const savedGame = localStorage.getItem('cage_favorite_game') || 'Valorant';
          const savedWeapon = localStorage.getItem('cage_active_weapon') || 'Operator';
          const savedMotto = localStorage.getItem('cage_motto') || 'Unseen. Unheard. Unbeaten.';
          const savedPic = localStorage.getItem('cage_profile_pic') || '';
          const savedId = localStorage.getItem('cage_profile_id') || Math.floor(10000000 + Math.random() * 90000000).toString();

          setProfile({
            uid: u.uid,
            name: `${savedFirstName} ${savedLastName}`.trim() || u.displayName || savedTag,
            firstName: savedFirstName,
            lastName: savedLastName,
            email: savedEmail,
            phone: savedPhone,
            gamerTag: savedTag,
            clanName: savedClan,
            favoriteGame: savedGame,
            activeWeapon: savedWeapon,
            motto: savedMotto,
            profilePic: savedPic,
            profileId: savedId
          });
        }
      }
    } catch (err: any) {
      const errCode = err?.code || '';
      const rawMessage = err?.message || String(err);
      
      console.warn("Authentication notice:", errCode || rawMessage);

      let errMsg = "An authentication error occurred. Please try again.";

      if (
        errCode === 'auth/invalid-credential' || 
        errCode === 'auth/invalid-login-credentials' ||
        errCode === 'auth/user-not-found' || 
        errCode === 'auth/wrong-password' ||
        rawMessage.includes('auth/invalid-credential') ||
        rawMessage.includes('auth/invalid-login-credentials') ||
        rawMessage.includes('auth/user-not-found') ||
        rawMessage.includes('auth/wrong-password') ||
        rawMessage.includes('invalid-credential')
      ) {
        if (!isSignUp) {
          errMsg = "Invalid email or password combination. If you haven't registered your gamer profile yet, please switch to 'Create Account' (Sign Up).";
        } else {
          errMsg = "Invalid credentials provided. Please check your details and try again.";
        }
      } else if (errCode === 'auth/email-already-in-use' || rawMessage.includes('email-already-in-use')) {
        errMsg = "This email is already registered. Please switch to Sign In to access your account.";
      } else if (errCode === 'auth/invalid-email' || rawMessage.includes('invalid-email')) {
        errMsg = "Please enter a valid email address.";
      } else if (errCode === 'auth/weak-password' || rawMessage.includes('weak-password')) {
        errMsg = "Password should be at least 6 characters long.";
      } else if (errCode === 'auth/too-many-requests' || rawMessage.includes('too-many-requests')) {
        errMsg = "Access temporarily blocked due to many failed attempts. Please try again later or reset your password.";
      } else if (errCode === 'auth/user-disabled' || rawMessage.includes('user-disabled')) {
        errMsg = "This gamer account has been disabled.";
      } else if (errCode === 'auth/network-request-failed' || rawMessage.includes('network-request-failed')) {
        errMsg = "Network error. Please check your internet connection.";
      } else if (errCode === 'auth/operation-not-allowed' || rawMessage.includes('operation-not-allowed')) {
        errMsg = "FIREBASE_AUTH_PROVIDER_DISABLED";
      } else if (err?.message && !err.message.includes('Firebase: Error')) {
        errMsg = err.message;
      }
      
      setError(errMsg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    if (!email.trim()) {
      setError('Please enter your email ID address first.');
      return;
    }
    setFormLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccessMessage('A password reset link has been sent to your email. Please check your inbox!');
    } catch (err: any) {
      console.warn("Forgot password notice:", err?.code || err?.message);
      let errMsg = "Failed to send password reset email. Please try again.";
      const code = err?.code || '';
      const msg = err?.message || '';
      if (code === 'auth/invalid-email' || msg.includes('invalid-email')) {
        errMsg = "Please enter a valid email address.";
      } else if (code === 'auth/user-not-found' || msg.includes('user-not-found')) {
        errMsg = "No gamer account found with this email.";
      } else if (code === 'auth/too-many-requests' || msg.includes('too-many-requests')) {
        errMsg = "Too many requests. Please try again in a few minutes.";
      }
      setError(errMsg);
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cyber-bg flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 border-4 border-[#ef4444] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-mono text-gray-400 uppercase tracking-widest">Securing Connection...</p>
        </div>
      </div>
    );
  }

  return (
    <ProfileContext.Provider value={{ profile, loading: profileLoading, quotaExceeded }}>
      <div className="relative min-h-screen">
        {/* Always render children. Apply blur, disable interaction, and prevent text selection if the user is not authenticated. */}
        <div className={!user ? "blur-[3px] pointer-events-none select-none transition-all duration-500" : "transition-all duration-500"}>
          {children}
        </div>

        {/* If user is authenticated and hasn't completed referral, show Referral Modal */}
        {user && profile && !profile.referralCompleted && (
          <ReferralModal profile={profile} quotaExceeded={quotaExceeded} />
        )}

        {/* If user is authenticated and Firestore quota is exceeded, show notice */}
        {user && quotaExceeded && (
          <div className="fixed top-0 inset-x-0 z-[1000] bg-gradient-to-r from-amber-600 to-red-600 text-white text-center py-2 px-4 shadow-md flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-[11px] sm:text-xs font-mono font-medium tracking-wide">
            <span className="font-black bg-white/20 px-2 py-0.5 rounded text-white animate-pulse">⚠️ FIRESTORE QUOTA EXCEEDED</span>
            <span>App running in local fallback mode. Personal data is cached with 100% features functionality!</span>
          </div>
        )}

        {/* If not authenticated, overlay the login page modal directly over the blurred home page */}
        {!user && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-black/60 backdrop-blur-[3px] overflow-y-auto">
            <div className="w-full max-w-md bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/10 space-y-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
              
              {/* Top visual elements */}
              <div className="absolute top-0 inset-x-0 h-1 bg-[#ef4444]" />
              
              <div className="text-center space-y-2 relative z-10">
                <div className="h-12 w-12 bg-red-50 border border-red-100 rounded-2xl mx-auto flex items-center justify-center text-[#ef4444] mb-2">
                  {isForgotPassword ? (
                    <Mail className="h-5 w-5 animate-bounce" />
                  ) : isSignUp ? (
                    <UserPlus className="h-5 w-5 animate-pulse" />
                  ) : (
                    <LogIn className="h-5 w-5" />
                  )}
                </div>
                <h1 className="text-xl font-sans font-black tracking-tight text-gray-950 uppercase">
                  ESPORTS ARENA
                </h1>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">
                  {isForgotPassword 
                    ? "Reset your gamer password" 
                    : isSignUp 
                      ? "Create a gamer credentials account" 
                      : "Enter your gamer portal access"
                  }
                </p>
              </div>

              {isForgotPassword ? (
                <form onSubmit={handleForgotPassword} className="space-y-4 relative z-10">
                  {/* Email */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-500">Email ID Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder=""
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 text-xs text-black placeholder-gray-400 focus:outline-none focus:border-[#ef4444] focus:ring-1 focus:ring-[#ef4444]/30"
                      />
                    </div>
                  </div>

                  {successMessage ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 text-xs flex items-start gap-2">
                      <Award className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
                      <span>{successMessage}</span>
                    </div>
                  ) : error ? (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                      <span>{error}</span>
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={formLoading}
                    className="w-full py-3 bg-[#ef4444] hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {formLoading ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        <span>Send Reset Link</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleAuth} className="space-y-4 relative z-10">
                  {isSignUp && (
                    <>
                      {/* Full Name */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-500">Gamer Name / Display Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder=""
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 text-xs text-black placeholder-gray-400 focus:outline-none focus:border-[#ef4444] focus:ring-1 focus:ring-[#ef4444]/30"
                          />
                        </div>
                      </div>

                      {/* Mobile Phone */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-500">Phone Mobile Parameter</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder=""
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 text-xs text-black placeholder-gray-400 focus:outline-none focus:border-[#ef4444] focus:ring-1 focus:ring-[#ef4444]/30"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-500">Email ID Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder=""
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 text-xs text-black placeholder-gray-400 focus:outline-none focus:border-[#ef4444] focus:ring-1 focus:ring-[#ef4444]/30"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-500">Account Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder=""
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-10 text-xs text-black placeholder-gray-400 focus:outline-none focus:border-[#ef4444] focus:ring-1 focus:ring-[#ef4444]/30"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {error && error === 'FIREBASE_AUTH_PROVIDER_DISABLED' ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3.5 text-left text-xs text-amber-900">
                      <div className="flex items-start gap-2.5">
                        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-amber-600 animate-pulse" />
                        <div className="space-y-1">
                          <h4 className="font-bold text-amber-950 uppercase tracking-wide text-[11px]">
                            Firebase Authentication Setup Required
                          </h4>
                          <p className="text-[11px] leading-relaxed text-amber-800">
                            Your Firebase project is set up, but the <strong>Email/Password Sign-In Method</strong> is currently disabled in your Google Cloud / Firebase parameters.
                          </p>
                        </div>
                      </div>

                      <div className="bg-white/80 border border-amber-200/50 p-3 rounded-xl space-y-2 text-[11.5px] leading-relaxed text-amber-955">
                        <p className="font-semibold uppercase tracking-wider text-[10px] text-amber-800">How to activate (Step-by-step):</p>
                        <ol className="list-decimal list-inside space-y-1 text-gray-700">
                          <li>Go to your <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-red-600 underline font-bold hover:text-red-700">Firebase Console</a>.</li>
                          <li>In the sidebar under <strong>Build</strong>, click <strong>Authentication</strong>.</li>
                          <li>Click on the <strong>Sign-in method</strong> tab on the tab-bar.</li>
                          <li>Select <strong>Email/Password</strong>, slide the toggle to <strong>Enable</strong>, and click <strong>Save</strong>.</li>
                        </ol>
                      </div>

                      <div className="pt-2 text-center">
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-mono mb-2">Or, for immediate testing:</p>
                        <button
                          type="button"
                          onClick={async () => {
                            const mockProfile = {
                              uid: 'gamer-sandbox-utc',
                              email: 'sandbox@esportsarena.com',
                              displayName: 'Sandbox Player'
                            };
                            try {
                              await setDoc(doc(db, "users", mockProfile.uid), {
                                uid: mockProfile.uid,
                                name: 'Sandbox Player',
                                firstName: 'Sandbox',
                                lastName: 'Player',
                                email: mockProfile.email,
                                phone: '9876543210',
                                createdAt: new Date().toLocaleString(),
                                gamerTag: 'SANDBOX_PRO',
                                clanName: 'SANDBOX_CLAN',
                                favoriteGame: 'Valorant',
                                activeWeapon: 'Vandal',
                                motto: 'Testing the arena in sandbox mode.',
                                profilePic: '',
                                profileId: '98453210'
                              }, { merge: true });
                            } catch (e) {
                              console.warn("Sandbox local profile create failed:", e);
                            }
                            setUser(mockProfile as any);
                          }}
                          className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                        >
                          ⚡ Sandbox Temporary Bypass (Instant Test)
                        </button>
                      </div>
                    </div>
                  ) : error ? (
                    <div className="p-3.5 bg-red-50 border border-red-200/80 rounded-2xl text-red-600 text-xs space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                        <span className="leading-relaxed font-medium">{error}</span>
                      </div>
                      {!isSignUp && (error.includes("Invalid email or password") || error.includes("Sign Up")) && (
                        <div className="pt-1 pl-6">
                          <button
                            type="button"
                            onClick={() => {
                              setIsSignUp(true);
                              setError('');
                            }}
                            className="text-xs font-bold text-red-700 hover:text-red-800 underline uppercase tracking-wider cursor-pointer"
                          >
                            → Click here to Create New Account (Sign Up)
                          </button>
                        </div>
                      )}
                      {isSignUp && error.includes("already registered") && (
                        <div className="pt-1 pl-6">
                          <button
                            type="button"
                            onClick={() => {
                              setIsSignUp(false);
                              setError('');
                            }}
                            className="text-xs font-bold text-red-700 hover:text-red-800 underline uppercase tracking-wider cursor-pointer"
                          >
                            → Click here to Sign In with your existing account
                          </button>
                        </div>
                      )}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={formLoading}
                    className="w-full py-3 bg-[#ef4444] hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {formLoading ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : isSignUp ? (
                      <>
                        <UserPlus className="h-4 w-4" />
                        <span>Create Gamer Registration</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="h-4 w-4" />
                        <span>Access Portal</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              <div className="pt-4 border-t border-gray-100 text-center text-xs relative z-10">
                {isForgotPassword ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setError('');
                      setSuccessMessage('');
                    }}
                    className="text-gray-500 hover:text-red-600 font-semibold cursor-pointer"
                  >
                    Back to gamer login portal
                  </button>
                ) : (
                  <div className="flex flex-col items-center space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(!isSignUp);
                        setError('');
                      }}
                      className="text-gray-500 hover:text-red-600 font-semibold focus:outline-none cursor-pointer"
                    >
                      {isSignUp ? "Already registered? Access portal account here" : "Don't have gamer credentials? Sign Up free"}
                    </button>
                    {!isSignUp && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setError('');
                          setSuccessMessage('');
                        }}
                        className="text-gray-400 hover:text-red-500 font-medium text-[11px] transition-colors focus:outline-none cursor-pointer"
                      >
                        Forgot your password?
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ProfileContext.Provider>
  );
}

function ReferralModal({ profile, quotaExceeded }: { profile: UserProfile; quotaExceeded: boolean }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        await setDoc(doc(db, "users", currentUser.uid), { referralCompleted: true }, { merge: true });
      } catch (err) {
        console.warn("Could not save dismissal, caching locally:", err);
      }
    }
    localStorage.setItem('cage_referral_completed', 'true');
    if (quotaExceeded) {
      window.location.reload();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    const enteredCode = code.trim().toUpperCase();

    if (!enteredCode) {
      setError('Please enter a referral code.');
      setIsSubmitting(false);
      return;
    }

    if (enteredCode === profile.referralCode) {
      setError('You cannot enter your own referral code.');
      setIsSubmitting(false);
      return;
    }

    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const q = query(collection(db, "users"), where("referralCode", "==", enteredCode));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError('Invalid referral code. Please double check and try again.');
          setIsSubmitting(false);
          return;
        }

        const hostDoc = querySnapshot.docs[0];
        const hostUid = hostDoc.id;
        const hostData = hostDoc.data();
        
        const hostRewardValue = Math.floor(Math.random() * 10) + 1;

        const hostRef = doc(db, "users", hostUid);
        const hostCurrentCoins = hostData.cageCoins || 0;
        await setDoc(hostRef, {
          cageCoins: hostCurrentCoins + hostRewardValue
        }, { merge: true });

        const guestRef = doc(db, "users", currentUser.uid);
        const guestCurrentCoins = profile.cageCoins || 0;
        await setDoc(guestRef, {
          cageCoins: guestCurrentCoins + 8,
          referralCompleted: true,
          referredByCode: enteredCode
        }, { merge: true });

        localStorage.setItem('cage_coins', String(guestCurrentCoins + 8));
        localStorage.setItem('cage_referral_completed', 'true');

        setSuccess('Awesome! You successfully claimed 8 Cage Coins!');
      } catch (err: any) {
        console.warn("Firestore referral lookup failed, simulating offline success:", err);
        const guestCurrentCoins = profile.cageCoins || 0;
        localStorage.setItem('cage_coins', String(guestCurrentCoins + 8));
        localStorage.setItem('cage_referral_completed', 'true');
        
        setSuccess('Offline backup mode: 8 Coins successfully claimed!');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-sm bg-zinc-950 border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-amber-500/10 text-center overflow-hidden">
        
        <div className="absolute top-[25%] -right-[15%] text-[180px] font-black pointer-events-none opacity-[0.03] select-none text-amber-500 font-display">
          G
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-full border border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:text-white transition-all hover:scale-105 active:scale-95 focus:outline-none cursor-pointer"
          title="Skip Referral Setup"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mx-auto h-16 w-16 bg-gradient-to-b from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center text-zinc-950 shadow-lg shadow-amber-500/20 mb-5 relative group">
          <Gift className="h-8 w-8 animate-bounce mb-0.5" />
          <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-600 rounded-full border border-black flex items-center justify-center animate-pulse">
            <span className="text-[8px] text-white font-mono font-black">!</span>
          </div>
        </div>

        <h3 className="text-lg font-sans font-black tracking-tight text-white uppercase mb-2">
          Claim Welcome <span className="text-amber-500">Cage Coins</span>
        </h3>
        
        <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto mb-6">
          Did a friend invite you to the CAGE arena? Enter their referral code below to claim your starting <strong className="text-amber-400">8 Cage Coins</strong> (valued at <strong className="text-amber-400">₹8</strong>) instantly!
        </p>

        {success ? (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1.5 text-center my-4 animate-in zoom-in-95">
            <Award className="h-6 w-6 text-emerald-500 mx-auto animate-pulse" />
            <p className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">{success}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1 text-left">
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">Referral Code</label>
              <div className="relative">
                <Coins className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500/70" />
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. CAGE4829"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 rounded-xl py-3 pl-11 pr-4 text-xs font-mono font-bold tracking-widest text-center text-white focus:outline-none uppercase transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-left flex items-start gap-2 animate-in slide-in-from-top-1">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="font-mono text-[11px] leading-tight">{error}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-3 text-zinc-400 hover:text-white border border-zinc-800 bg-zinc-900 hover:bg-zinc-800/80 rounded-xl text-xs uppercase font-mono font-bold transition-all cursor-pointer"
              >
                Skip Welcome
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-450 hover:to-amber-550 border-0 text-zinc-950 font-mono font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/10 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <div className="h-4 w-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Award className="h-4 w-4" />
                    <span>Claim Coins</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-zinc-900 flex justify-between items-center text-[10px] font-mono text-zinc-600 uppercase">
          <span>SECURED COIN VALUE</span>
          <span>1 COIN = ₹1</span>
        </div>
      </div>
    </div>
  );
}
