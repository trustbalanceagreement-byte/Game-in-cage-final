import React, { useState, useEffect, useRef } from 'react';
import { Menu, Home, Zap, Calendar, ClipboardCheck, User, ShieldAlert, LogOut, Bell } from 'lucide-react';
import Logo from './Logo';
import { useProfile } from './AuthGate';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, onSnapshot, doc, deleteDoc, query, orderBy } from 'firebase/firestore';

interface NavbarProps {
  currentTab: string;
  setTab: (tab: string) => void;
}

export default function Navbar({ currentTab, setTab }: NavbarProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const autoDismissTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { profile } = useProfile();

  // Load real-time notifications
  useEffect(() => {
    if (!profile?.uid) {
      setNotifications([]);
      return;
    }

    const notifRef = collection(db, 'users', profile.uid, 'notifications');
    const q = query(notifRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const now = Date.now();
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Identify and prune expired notifications
        const expiredIds: string[] = [];
        const activeList = list.filter((notif: any) => {
          const isExpired = (notif.autoDeleteAt && now >= notif.autoDeleteAt) ||
            (notif.title === "Booking Confirmed" && notif.createdAt && now - notif.createdAt >= 20 * 60 * 1000);
          
          if (isExpired) {
            expiredIds.push(notif.id);
            return false;
          }
          return true;
        });

        // Trigger asynchronous deletions in Firestore
        expiredIds.forEach(id => {
          deleteDoc(doc(db, 'users', profile.uid!, 'notifications', id))
            .catch(err => console.error("Error deleting expired notification:", err));
        });

        setNotifications(activeList);
      },
      (error) => {
        console.error("Error loading notifications:", error);
        handleFirestoreError(error, OperationType.LIST, notifRef.path);
      }
    );

    return () => unsubscribe();
  }, [profile?.uid]);

  // Periodically check and clean up expired notifications in real-time if page is kept open
  useEffect(() => {
    if (!profile?.uid) return;

    const interval = setInterval(() => {
      setNotifications(prev => {
        const now = Date.now();
        let changed = false;
        const filtered = prev.filter((notif: any) => {
          const isExpired = (notif.autoDeleteAt && now >= notif.autoDeleteAt) ||
            (notif.title === "Booking Confirmed" && notif.createdAt && now - notif.createdAt >= 20 * 60 * 1000);
          
          if (isExpired) {
            changed = true;
            deleteDoc(doc(db, 'users', profile.uid!, 'notifications', notif.id))
              .catch(err => console.error("Error deleting expired notification in interval:", err));
            return false;
          }
          return true;
        });
        return changed ? filtered : prev;
      });
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [profile?.uid]);

  // Handle auto-dismiss of notifications when dropdown is opened
  useEffect(() => {
    if (showNotificationsDropdown && notifications.length > 0) {
      // Clear autoDismissTimeout if it exists
      if (autoDismissTimeoutRef.current) {
        clearTimeout(autoDismissTimeoutRef.current);
      }

      // Automatically dismiss/clear all notifications after 4 seconds of viewing
      autoDismissTimeoutRef.current = setTimeout(() => {
        clearAllNotifications();
        setShowNotificationsDropdown(false);
      }, 4000);
    }

    return () => {
      if (autoDismissTimeoutRef.current) {
        clearTimeout(autoDismissTimeoutRef.current);
      }
    };
  }, [showNotificationsDropdown, notifications.length]);

  const clearAllNotifications = async () => {
    if (!profile?.uid || notifications.length === 0) return;
    const notifsToDelete = [...notifications];
    for (const notif of notifsToDelete) {
      try {
        const docRef = doc(db, 'users', profile.uid, 'notifications', notif.id);
        await deleteDoc(docRef);
      } catch (err) {
        console.error("Error deleting notification:", err);
      }
    }
  };

  const deleteNotification = async (id: string) => {
    if (!profile?.uid) return;
    try {
      const docRef = doc(db, 'users', profile.uid, 'notifications', id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const handleCloseNotifications = () => {
    setShowNotificationsDropdown(false);
    clearAllNotifications();
  };

  // The simplified navigation tabs mapped inside the new right-aligned three-dot menu
  const tabs = [
    { id: 'home', label: 'Home', icon: Home, desc: 'Arena Dashboard & Feed' },
    { id: 'event', label: 'Event', icon: Calendar, desc: 'Local & National Duels' },
    { id: 'service', label: 'Service', icon: Zap, desc: 'Core Computing Hardware' },
    { id: 'book', label: 'Book', icon: ClipboardCheck, desc: 'Lock Comfort Console' },
    { id: 'profile', label: 'Profile', icon: User, desc: 'Gamer Deck Credentials' },
    { id: 'admin', label: 'Admin Panel', icon: ShieldAlert, desc: 'Cage Overseer Commands' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-black border-b border-red-600/20">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6">
        
        {/* Left Side: Custom Brand Logo - scalable, responsive, ultra crisp vector */}
        <button 
          id="nav-logo"
          onClick={() => {
            setTab('home');
            setShowDropdown(false);
            setShowProfileDropdown(false);
          }} 
          className="flex items-center focus:outline-none cursor-pointer group text-left bg-transparent border-0 select-none py-1"
        >
          <Logo className="h-6 sm:h-7 md:h-8 max-w-[140px] sm:max-w-[180px] md:max-w-[220px] w-auto hover:opacity-90 active:scale-[0.98] transition-all" />
        </button>

        {/* Right Side: Profile Icon next to Premium Three-Line Trigger */}
        <div className="flex items-center gap-3">
          
          {/* Profile Icon and Dropdown */}
          <div className="relative">
            <button
              id="header-profile-trigger"
              onClick={() => {
                setShowProfileDropdown(!showProfileDropdown);
                setShowDropdown(false);
              }}
              className="h-9 w-9 rounded-full border border-white/10 hover:border-red-500 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center bg-zinc-950 overflow-hidden"
              aria-label="Toggle Profile Dropdown"
            >
              {profile?.profilePic ? (
                <img 
                  src={profile.profilePic} 
                  alt="Avatar" 
                  className="h-full w-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-full w-full bg-red-600/10 flex items-center justify-center text-red-500 font-bold text-xs uppercase font-mono">
                  {profile?.gamerTag?.slice(0, 2) || profile?.name?.slice(0, 2) || 'G'}
                </div>
              )}
            </button>

            {showProfileDropdown && (
              <>
                {/* Overlay backdrop to dismiss dropdown */}
                <div 
                  className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs" 
                  onClick={() => setShowProfileDropdown(false)} 
                />
                
                <div 
                  id="header-profile-popover" 
                  className="absolute right-0 mt-3 w-56 rounded-xl bg-black border border-red-600/30 p-3 shadow-2xl shadow-red-950/20 z-50 space-y-2.5 font-sans text-xs animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  <div className="px-1.5 py-1 border-b border-white/[0.06] pb-2">
                    <p className="font-bold text-white uppercase tracking-wider truncate font-mono text-[10px] text-red-500">
                      {profile?.gamerTag || 'GAMER'}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate mt-0.5 font-sans">
                      {profile?.email || 'No email synced'}
                    </p>
                  </div>
                  
                  <button
                    id="header-profile-signout"
                    onClick={async () => {
                      setShowProfileDropdown(false);
                      try {
                        await signOut(auth);
                        // Clean up cache
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
                        window.location.reload();
                      } catch (err) {
                        console.error("Sign out failed:", err);
                      }
                    }}
                    className="w-full text-left p-2 rounded-lg flex items-center justify-center gap-2 bg-red-600/10 border border-red-600/20 text-red-400 hover:bg-red-600/20 transition-all duration-200 cursor-pointer font-bold uppercase tracking-wider text-[10px]"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Bell Icon and Dropdown */}
          {(notifications.length > 0 || showNotificationsDropdown) && (
            <div className="relative">
              <button
                id="header-notifications-trigger"
                onClick={() => {
                  setShowNotificationsDropdown(!showNotificationsDropdown);
                  setShowDropdown(false);
                  setShowProfileDropdown(false);
                }}
                className={`p-2 rounded-lg border transition-all duration-200 cursor-pointer flex items-center justify-center relative ${
                  showNotificationsDropdown 
                    ? 'bg-red-600/10 border-red-500 text-red-500 animate-none' 
                    : 'bg-black border-white/10 text-white hover:text-red-500 hover:border-red-600/40 animate-pulse'
                }`}
                aria-label="View Notifications"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border border-black" />
              </button>

              {showNotificationsDropdown && (
                <>
                  {/* Overlay backdrop to dismiss dropdown */}
                  <div 
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs" 
                    onClick={handleCloseNotifications} 
                  />
                  
                  <div 
                    id="header-notifications-popover" 
                    className="absolute right-[-40px] sm:right-0 mt-3 w-80 rounded-xl bg-black border border-red-600/30 p-4 shadow-2xl shadow-red-950/20 z-50 space-y-3 font-sans text-xs animate-in fade-in slide-in-from-top-2 duration-150"
                  >
                    <div className="border-b border-white/[0.06] pb-2 flex items-center justify-between">
                      <span className="font-mono text-xs uppercase tracking-wider text-red-500 font-bold">SYSTEM BROADCAST</span>
                      <button 
                        onClick={handleCloseNotifications} 
                        className="text-gray-500 hover:text-white font-semibold cursor-pointer uppercase text-[9px] font-mono bg-transparent border-0"
                      >
                        Clear All
                      </button>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {notifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          className="p-3 bg-zinc-950/80 rounded-lg border border-white/[0.04] hover:border-red-600/20 transition-all text-left relative group animate-in fade-in duration-200"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-[11px] text-white tracking-wide uppercase font-mono">{notif.title}</span>
                            <span className="text-[8px] text-gray-500 font-mono">
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-300 font-normal leading-relaxed mt-1">{notif.message}</p>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              await deleteNotification(notif.id);
                            }}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-500 text-[11px] font-mono bg-transparent border-0 cursor-pointer font-bold"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="text-[9px] text-gray-500 font-mono text-center pt-1 flex items-center justify-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-red-500 animate-ping" />
                      <span>Viewing notification logs...</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Three-Line Navigation Trigger */}
          <div className="relative">
            <button
              id="three-lines-nav-trigger"
              onClick={() => {
                setShowDropdown(!showDropdown);
                setShowProfileDropdown(false);
              }}
              className={`p-2 rounded-lg border transition-all duration-200 cursor-pointer flex items-center justify-center ${
                showDropdown 
                  ? 'bg-red-600/10 border-red-500 text-red-500' 
                  : 'bg-black border-white/10 text-white hover:text-red-500 hover:border-red-600/40'
              }`}
              aria-label="Toggle Page Menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Elegant navigation dropdown popover */}
            {showDropdown && (
              <>
                {/* Overlay backdrop to dismiss dropdown */}
                <div 
                  className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs" 
                  onClick={() => setShowDropdown(false)} 
                />
                
                <div 
                  id="header-navigation-popover" 
                  className="absolute right-0 mt-3 w-72 rounded-xl bg-black border border-red-600/30 p-4 shadow-2xl shadow-red-950/20 z-50 space-y-3 font-sans text-xs animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  {/* Dropdown Options List */}
                  <div className="space-y-1.5">
                    {tabs.map((tab) => {
                      const isActive = currentTab === tab.id;
                      const IconComp = tab.icon;
                      return (
                        <button
                          id={`dropdown-nav-opt-${tab.id}`}
                          key={tab.id}
                          onClick={() => {
                            setTab(tab.id);
                            setShowDropdown(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-lg flex items-start gap-3 transition-all duration-200 cursor-pointer ${
                            isActive 
                              ? 'bg-red-600/15 border border-red-600/35 text-red-400' 
                              : 'bg-transparent border border-transparent text-white hover:bg-white/[0.04] hover:text-red-400'
                          }`}
                        >
                          <IconComp className={`h-4 w-4 mt-0.5 shrink-0 ${isActive ? 'text-red-500' : 'text-gray-400'}`} />
                          <div>
                            <div className="font-bold text-xs uppercase tracking-wider">{tab.label}</div>
                            <div className="text-[10px] text-gray-500 group-hover:text-gray-400 font-normal mt-0.5">{tab.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
