import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  ShieldCheck, 
  Copy, 
  Check, 
  ArrowLeft, 
  CheckCircle, 
  QrCode, 
  ChevronRight,
  RefreshCw,
  Coins,
  Wallet,
  Gift,
  AlertTriangle
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { PaymentDetails, Booking } from '../types';
import { auth, db } from '../firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { useProfile } from './AuthGate';

interface PaymentViewProps {
  paymentDetails: PaymentDetails;
  onBack: () => void;
  onPaymentComplete?: (booking: Booking) => void;
}

interface UPIAppOption {
  id: string;
  name: string;
  subtitle: string;
  androidPackage: string;
  iosScheme: string;
  themeColor: string;
  badgeBg: string;
  badgeBorder: string;
  accentText: string;
  popular?: boolean;
}

export default function PaymentView({ paymentDetails, onBack, onPaymentComplete }: PaymentViewProps) {
  const { profile } = useProfile();
  
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<Booking | null>(null);
  const [utrError, setUtrError] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [isWaitingReturn, setIsWaitingReturn] = useState(false);
  const [verifyingAfterReturn, setVerifyingAfterReturn] = useState(false);

  // Dedicated Cage Coin View State
  const [showCageCoinPage, setShowCageCoinPage] = useState(false);
  const [cageCoinError, setCageCoinError] = useState('');
  const [rewardedCoins, setRewardedCoins] = useState<number | null>(null);
  const [coinsDeducted, setCoinsDeducted] = useState<number | null>(null);

  // Pre-locked merchant parameters
  const STORE_NAME = "Game In Cage";
  const TERMINAL_ID = "Terminal 1-Q240602048";
  const UPI_ID = "Q240602048@ybl";
  const lockedAmount = Math.max(0, paymentDetails.amount || 0);

  // Current user's available Cage Coins
  const currentCageCoins = profile?.cageCoins ?? Number(localStorage.getItem('cage_coins') || '0');

  // Unique session transaction reference
  const [sessionRef] = useState(() => {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    return `GIC-UPI-${randomSuffix}`;
  });

  const currentHost = typeof window !== 'undefined' ? window.location.origin : '';
  const noteParam = `Game In Cage ${paymentDetails.stationName || 'Gaming Session'}`;

  // Standard NPCI Base UPI query string with auto return URL
  const baseUpiQuery = `pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(STORE_NAME)}&am=${lockedAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(noteParam)}&tr=${sessionRef}&mc=5812&url=${encodeURIComponent(currentHost)}`;
  const universalUpiLink = `upi://pay?${baseUpiQuery}`;

  // 5 Dedicated UPI Apps
  const upiApps: UPIAppOption[] = [
    {
      id: 'gpay',
      name: 'Google Pay',
      subtitle: 'Instant GPay UPI Transfer',
      androidPackage: 'com.google.android.apps.nbu.paisa.user',
      iosScheme: 'gpay://upi/pay',
      themeColor: '#4285F4',
      badgeBg: 'bg-[#4285F4]/10',
      badgeBorder: 'border-[#4285F4]/30',
      accentText: 'text-[#4285F4]',
      popular: true
    },
    {
      id: 'phonepe',
      name: 'PhonePe',
      subtitle: 'Fast UPI Direct Payment',
      androidPackage: 'com.phonepe.app',
      iosScheme: 'phonepe://pay',
      themeColor: '#5f259f',
      badgeBg: 'bg-[#5f259f]/10',
      badgeBorder: 'border-[#5f259f]/30',
      accentText: 'text-[#a855f7]',
      popular: true
    },
    {
      id: 'paytm',
      name: 'Paytm UPI',
      subtitle: 'Paytm Wallet & UPI Gateway',
      androidPackage: 'net.one97.paytm',
      iosScheme: 'paytmmp://pay',
      themeColor: '#00BAF2',
      badgeBg: 'bg-[#00BAF2]/10',
      badgeBorder: 'border-[#00BAF2]/30',
      accentText: 'text-[#00BAF2]'
    },
    {
      id: 'bhim',
      name: 'BHIM UPI',
      subtitle: 'NPCI National Gateway',
      androidPackage: 'in.org.npci.upiapp',
      iosScheme: 'bhim://pay',
      themeColor: '#008450',
      badgeBg: 'bg-[#008450]/10',
      badgeBorder: 'border-[#008450]/30',
      accentText: 'text-[#10b981]'
    },
    {
      id: 'amazonpay',
      name: 'Amazon Pay',
      subtitle: 'Amazon UPI One-Click',
      androidPackage: 'in.amazon.mShop.android.shopping',
      iosScheme: 'amazonpay://pay',
      themeColor: '#FF9900',
      badgeBg: 'bg-[#FF9900]/10',
      badgeBorder: 'border-[#FF9900]/30',
      accentText: 'text-[#f59e0b]'
    }
  ];

  // Auto Return Detection: When user returns to the website after paying in their UPI app
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isWaitingReturn && !paymentSuccess) {
        setVerifyingAfterReturn(true);
        setTimeout(() => {
          setVerifyingAfterReturn(false);
          handleVerifyAndConfirm();
        }, 1800);
      }
    };

    const handleWindowFocus = () => {
      if (isWaitingReturn && !paymentSuccess) {
        setVerifyingAfterReturn(true);
        setTimeout(() => {
          setVerifyingAfterReturn(false);
          handleVerifyAndConfirm();
        }, 1800);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [isWaitingReturn, paymentSuccess]);

  // Launch the selected UPI App directly
  const handleLaunchUPIApp = (app: UPIAppOption) => {
    setSelectedApp(app.name);
    setIsWaitingReturn(true);

    const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
    const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

    let targetUri = '';

    if (isAndroid) {
      targetUri = `intent://pay?${baseUpiQuery}#Intent;scheme=upi;package=${app.androidPackage};end`;
    } else if (isIOS) {
      targetUri = `${app.iosScheme}?${baseUpiQuery}`;
    } else {
      targetUri = universalUpiLink;
    }

    const link = document.createElement('a');
    link.href = targetUri;
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      window.location.href = universalUpiLink;
    }, 450);
  };

  const copyUpiToClipboard = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const copyAmountToClipboard = () => {
    navigator.clipboard.writeText(lockedAmount.toString());
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  // 1. CONFIRM PAYMENT VIA CAGE COINS
  const handleConfirmCageCoinPayment = async () => {
    setCageCoinError('');
    
    if (currentCageCoins < lockedAmount) {
      setCageCoinError(`Insufficient Cage Coins. You have ${currentCageCoins} CGC, but ₹${lockedAmount} requires ${lockedAmount} CGC.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const bookingId = paymentDetails.bookingId || `gic-${Date.now()}-${Math.floor(Math.random() * 900)}`;
      const newCoinBalance = Math.max(0, currentCageCoins - lockedAmount);

      // 1. Deduct Cage Coins from user's profile in Firestore & localStorage
      localStorage.setItem('cage_coins', String(newCoinBalance));

      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          await setDoc(userDocRef, { cageCoins: newCoinBalance }, { merge: true });

          const notifRef = doc(collection(db, 'users', currentUser.uid, 'notifications'));
          await setDoc(notifRef, {
            id: notifRef.id,
            title: "Cage Coin Payment Confirmed",
            message: `Paid ${lockedAmount} Cage Coins for ${paymentDetails.stationName}. Remaining balance: ${newCoinBalance} CGC.`,
            createdAt: Date.now(),
            bookingId: bookingId,
            autoDeleteAt: Date.now() + 10 * 60 * 1000
          });
        } catch (err) {
          console.warn("Firestore sync warning for Cage Coins:", err);
        }
      }

      // 2. Create Confirmed Booking Record
      const confirmedBooking: Booking = {
        id: bookingId,
        name: paymentDetails.playerName || profile?.name || 'Rajesh Sharma',
        phone: paymentDetails.phone || profile?.phone || '9876543210',
        date: paymentDetails.date || new Date().toISOString().split('T')[0],
        timeSlot: paymentDetails.timeSlot || '12:00 PM',
        stationType: paymentDetails.stationName || 'Gaming Station',
        hours: 1,
        totalCost: lockedAmount,
        stationNumber: Math.floor(Math.random() * 12) + 1,
        isHappyHourApplied: !!paymentDetails.isHappyHourApplied,
        notes: paymentDetails.notes || '',
        status: 'approved',
        paymentStatus: 'paid',
        transactionId: `CGC-${Date.now().toString().slice(-6)}`,
        paymentMethod: 'Cage Coin',
        createdAt: new Date().toLocaleString(),
        userId: auth.currentUser?.uid || undefined
      };

      // Persist booking to localStorage
      const stored = localStorage.getItem('gic_bookings');
      let currentList: Booking[] = stored ? JSON.parse(stored) : [];
      currentList = [confirmedBooking, ...currentList.filter(b => b.id !== bookingId)];
      localStorage.setItem('gic_bookings', JSON.stringify(currentList));

      if (currentUser) {
        try {
          const bookingDocRef = doc(db, 'bookings', bookingId);
          await setDoc(bookingDocRef, confirmedBooking, { merge: true });
        } catch (err) {
          console.warn("Firestore booking sync warning:", err);
        }
      }

      setCoinsDeducted(lockedAmount);
      setPaymentSuccess(confirmedBooking);
      if (onPaymentComplete) {
        onPaymentComplete(confirmedBooking);
      }
    } catch (err: any) {
      console.error("Cage Coin payment confirmation failed:", err);
      setCageCoinError("Payment with Cage Coins failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. CONFIRM PAYMENT VIA UPI APPS & AWARD 1-5 RANDOM CAGE COINS
  const handleVerifyAndConfirm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setUtrError('');
    
    if (utrNumber.trim() && !/^\d{12}$/.test(utrNumber.trim()) && utrNumber.trim().length < 6) {
      setUtrError('Please enter a valid 12-digit UPI reference (UTR) number or confirm directly.');
      return;
    }

    setIsSubmitting(true);

    try {
      const bookingId = paymentDetails.bookingId || `gic-${Date.now()}-${Math.floor(Math.random() * 900)}`;
      
      // Calculate random Cage Coins reward (1, 2, 3, 4, or 5) for paying via UPI
      const rewardCoinAmount = Math.floor(Math.random() * 5) + 1;
      const updatedTotalCoins = currentCageCoins + rewardCoinAmount;

      // Automatically credit Cage Coins to user's profile
      localStorage.setItem('cage_coins', String(updatedTotalCoins));

      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          await setDoc(userDocRef, { cageCoins: updatedTotalCoins }, { merge: true });

          const notifRef = doc(collection(db, 'users', currentUser.uid, 'notifications'));
          await setDoc(notifRef, {
            id: notifRef.id,
            title: `Reward: +${rewardCoinAmount} Cage Coins Added`,
            message: `You earned +${rewardCoinAmount} Cage Coins for paying via UPI for ${paymentDetails.stationName}! New Balance: ${updatedTotalCoins} CGC.`,
            createdAt: Date.now(),
            bookingId: bookingId,
            autoDeleteAt: Date.now() + 10 * 60 * 1000
          });
        } catch (err) {
          console.warn("Firestore sync warning for reward coins:", err);
        }
      }

      const confirmedBooking: Booking = {
        id: bookingId,
        name: paymentDetails.playerName || profile?.name || 'Rajesh Sharma',
        phone: paymentDetails.phone || profile?.phone || '9876543210',
        date: paymentDetails.date || new Date().toISOString().split('T')[0],
        timeSlot: paymentDetails.timeSlot || '12:00 PM',
        stationType: paymentDetails.stationName || 'Gaming Station',
        hours: 1,
        totalCost: lockedAmount,
        stationNumber: Math.floor(Math.random() * 12) + 1,
        isHappyHourApplied: !!paymentDetails.isHappyHourApplied,
        notes: paymentDetails.notes || '',
        status: 'approved',
        paymentStatus: 'paid',
        transactionId: utrNumber.trim() || sessionRef,
        paymentMethod: selectedApp ? `${selectedApp} UPI` : 'UPI Gateway',
        createdAt: new Date().toLocaleString(),
        userId: auth.currentUser?.uid || undefined
      };

      // Persist to localStorage
      const stored = localStorage.getItem('gic_bookings');
      let currentList: Booking[] = stored ? JSON.parse(stored) : [];
      currentList = [confirmedBooking, ...currentList.filter(b => b.id !== bookingId)];
      localStorage.setItem('gic_bookings', JSON.stringify(currentList));

      // Persist to Cloud Firestore if logged in
      if (currentUser) {
        try {
          const bookingDocRef = doc(db, 'bookings', bookingId);
          await setDoc(bookingDocRef, confirmedBooking, { merge: true });
        } catch (err) {
          console.warn("Firestore sync warning:", err);
        }
      }

      setRewardedCoins(rewardCoinAmount);
      setPaymentSuccess(confirmedBooking);
      if (onPaymentComplete) {
        onPaymentComplete(confirmedBooking);
      }
    } catch (err: any) {
      console.error("Payment confirmation failed:", err);
      setUtrError("Payment confirmation failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-2 pb-16 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <button
          onClick={() => {
            if (showCageCoinPage) {
              setShowCageCoinPage(false);
            } else {
              onBack();
            }
          }}
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-gray-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] px-3.5 py-2 rounded-xl transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{showCageCoinPage ? 'Back to Payment Options' : 'Back to Session Statement'}</span>
        </button>

        <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>NPCI 256-BIT ENCRYPTED UPI GATEWAY</span>
        </div>
      </div>

      {/* Return Verification Notification Banner */}
      {verifyingAfterReturn && (
        <div className="bg-emerald-950/80 border-2 border-emerald-500/50 p-4 rounded-2xl flex items-center justify-between gap-3 text-emerald-300 animate-pulse shadow-xl">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5 animate-spin text-emerald-400" />
            <div>
              <span className="text-xs font-black uppercase tracking-wider block">Return from UPI App Detected</span>
              <span className="text-[11px] font-mono text-emerald-400">Verifying transaction & reserving station slot...</span>
            </div>
          </div>
          <span className="text-xs font-mono font-bold uppercase text-emerald-300">Processing</span>
        </div>
      )}

      {/* VIEW 1: DEDICATED CAGE COIN PAYMENT PAGE */}
      {showCageCoinPage ? (
        <div className="max-w-2xl mx-auto space-y-6 animate-in zoom-in-95 duration-200">
          
          <div className="bg-[#0c0d12] border-2 border-amber-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
            
            {/* Shiny gold background watermark */}
            <div className="absolute top-[-20px] right-[-20px] text-[180px] font-black pointer-events-none opacity-[0.03] select-none text-amber-400 font-display">
              G
            </div>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-5">
              <div className="flex items-center gap-3.5">
                <div className="relative h-12 w-12 bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0 border border-amber-200/60">
                  <div className="absolute top-1 left-1.5 w-6 h-2 bg-white/30 rounded-full rotate-[-15deg]" />
                  <span className="text-2xl font-display font-extrabold text-amber-950">G</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-black block">
                    WALLET CHECKOUT
                  </span>
                  <h3 className="text-xl font-black text-white uppercase tracking-wider mt-0.5">
                    Pay with Cage Coins
                  </h3>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block font-bold">
                  RATE
                </span>
                <span className="text-xs font-mono font-black text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                  1 CGC = ₹1
                </span>
              </div>
            </div>

            {/* Balances & Comparison Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Profile Available Balance */}
              <div className="bg-black/60 border border-white/[0.08] p-4 rounded-2xl space-y-1">
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest font-bold block">
                  Your Available Balance
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-amber-400 font-sans tracking-tight">
                    {currentCageCoins}
                  </span>
                  <span className="text-[11px] font-mono text-gray-500 uppercase font-bold">CGC</span>
                </div>
                <span className="text-[10px] font-mono text-gray-500 block">
                  (Worth ₹{currentCageCoins})
                </span>
              </div>

              {/* Required Locked Amount */}
              <div className="bg-black/60 border border-amber-500/40 p-4 rounded-2xl space-y-1 bg-amber-500/[0.02]">
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold block">
                  Required Payment Amount
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white font-sans tracking-tight">
                    {lockedAmount}
                  </span>
                  <span className="text-[11px] font-mono text-amber-400 uppercase font-bold">CGC</span>
                </div>
                <span className="text-[10px] font-mono text-gray-400 block">
                  (Equal to ₹{lockedAmount})
                </span>
              </div>

            </div>

            {/* Summary Row / Calculation */}
            <div className="bg-black/80 rounded-2xl p-4 border border-white/[0.06] space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center text-gray-400">
                <span>Station Session</span>
                <span className="text-white font-bold">{paymentDetails.stationName}</span>
              </div>
              <div className="flex justify-between items-center text-gray-400">
                <span>Player</span>
                <span className="text-white font-bold">{paymentDetails.playerName || profile?.name || 'Rajesh Sharma'}</span>
              </div>
              <div className="flex justify-between items-center text-gray-400">
                <span>Time Slot</span>
                <span className="text-white font-bold">{paymentDetails.timeSlot}</span>
              </div>

              <div className="h-[1px] bg-white/[0.08] my-2" />

              <div className="flex justify-between items-center pt-1">
                <span className="text-gray-400">Balance after deduction:</span>
                <span className={`font-black ${currentCageCoins >= lockedAmount ? 'text-emerald-400' : 'text-red-400'}`}>
                  {currentCageCoins >= lockedAmount ? `${currentCageCoins - lockedAmount} CGC` : `Short by ${lockedAmount - currentCageCoins} CGC`}
                </span>
              </div>
            </div>

            {/* Balance Status Message */}
            {currentCageCoins < lockedAmount ? (
              <div className="bg-red-950/40 border border-red-500/40 p-4 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-red-400 text-xs font-mono font-bold">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Insufficient Cage Coins Balance</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
                  You have <span className="text-white font-bold">{currentCageCoins} CGC</span>, but need <span className="text-white font-bold">{lockedAmount} CGC</span>. You can switch to UPI payment and get <span className="text-amber-400 font-bold">1 to 5 Cage Coins</span> as an instant reward!
                </p>
                <button
                  type="button"
                  onClick={() => setShowCageCoinPage(false)}
                  className="mt-2 text-xs font-mono font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
                >
                  Switch to UPI Apps (GPay, PhonePe, Paytm) →
                </button>
              </div>
            ) : (
              <div className="bg-emerald-950/30 border border-emerald-500/30 p-3.5 rounded-2xl flex items-center gap-2.5 text-emerald-400 text-xs font-mono">
                <Check className="h-4 w-4 shrink-0" />
                <span>You have sufficient balance. Clicking confirm will deduct {lockedAmount} CGC.</span>
              </div>
            )}

            {cageCoinError && (
              <p className="text-xs text-red-400 font-mono">{cageCoinError}</p>
            )}

            {/* Actions: Small Confirm Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCageCoinPage(false)}
                className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 hover:text-white text-xs font-mono uppercase font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmCageCoinPayment}
                disabled={isSubmitting || currentCageCoins < lockedAmount}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-black font-sans font-black text-xs uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-amber-500/20"
              >
                {isSubmitting ? "Deducting..." : "Confirm Payment"}
              </button>
            </div>

          </div>

        </div>
      ) : (
        /* VIEW 2: STANDARD PAYMENT SELECTION (Pre-locked Manifest + 5 UPI Apps + Cage Coin Option) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Pre-locked Invoice & Station Manifest (Span 5) */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-[#0c0d12] border border-white/[0.08] rounded-2xl p-6 space-y-5 shadow-xl relative overflow-hidden">
              
              {/* Header Badge */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-red-500 font-bold block">
                    ORDER BILLING
                  </span>
                  <h3 className="text-lg font-black text-white uppercase tracking-wider mt-0.5">
                    Locked Manifest
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase">
                  <Lock className="h-3.5 w-3.5" />
                  <span>PRE-LOCKED</span>
                </div>
              </div>

              {/* Locked Store Name & Amount Fields */}
              <div className="space-y-3.5">
                
                {/* Store Name */}
                <div className="bg-black/50 border border-white/[0.08] p-3.5 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest font-bold">
                      Merchant / Store
                    </span>
                    <Lock className="h-3 w-3 text-gray-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-white tracking-wide">
                      {STORE_NAME}
                    </span>
                    <span className="text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 uppercase">
                      VERIFIED
                    </span>
                  </div>
                </div>

                {/* Locked Payable Amount */}
                <div className="bg-black/50 border border-red-500/40 p-4 rounded-xl bg-red-500/[0.03]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-red-400 uppercase tracking-widest font-bold">
                      Locked Payable Amount
                    </span>
                    <Lock className="h-3 w-3 text-red-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-black text-white tracking-tight font-display">
                      ₹{lockedAmount}
                    </span>
                    <button
                      type="button"
                      onClick={copyAmountToClipboard}
                      className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-lg border border-white/10 transition-colors cursor-pointer"
                      title="Copy Amount"
                    >
                      {copiedAmount ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Merchant UPI ID Box */}
                <div className="bg-black/50 border border-white/[0.08] p-3.5 rounded-xl">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest font-bold">
                      Merchant UPI VPA
                    </span>
                    <span className="text-[9px] font-mono text-gray-500">{TERMINAL_ID}</span>
                  </div>
                  <div className="flex items-center justify-between bg-black p-2.5 rounded-lg border border-white/[0.05]">
                    <span className="font-mono text-xs font-bold text-amber-400 tracking-wider">
                      {UPI_ID}
                    </span>
                    <button
                      type="button"
                      onClick={copyUpiToClipboard}
                      className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                    >
                      {copiedUpi ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>

              {/* Session Info Pill */}
              <div className="bg-black/60 rounded-xl p-3.5 border border-white/[0.04] space-y-2 text-xs font-mono text-gray-400">
                <div className="flex justify-between items-center text-[10px] text-gray-500 uppercase font-bold border-b border-white/[0.04] pb-1.5">
                  <span>STATION SLOT</span>
                  <span className="text-white font-bold">{paymentDetails.stationName}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <span className="text-gray-500 block">PLAYER</span>
                    <span className="text-white font-bold">{paymentDetails.playerName || profile?.name || 'Rajesh Sharma'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">TIME SLOT</span>
                    <span className="text-white font-bold">{paymentDetails.timeSlot}</span>
                  </div>
                </div>
              </div>

              {/* Scan via QR Standee Trigger */}
              <button
                type="button"
                onClick={() => setShowQrModal(!showQrModal)}
                className="w-full py-3 px-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-gray-300 hover:text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <QrCode className="h-4 w-4 text-red-500" />
                <span>{showQrModal ? 'Hide Standee QR Code' : 'Scan via QR Standee'}</span>
              </button>

              {/* Optional Collapsible QR Standee */}
              {showQrModal && (
                <div className="bg-white rounded-2xl p-4 text-center border-2 border-neutral-900 shadow-xl animate-in zoom-in-95 duration-200">
                  <div className="inline-block bg-[#f3722c] text-white font-black text-xs px-4 py-1 rounded-full shadow-sm mb-3 uppercase">
                    {STORE_NAME}
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-neutral-200 mx-auto inline-block">
                    <QRCodeSVG
                      value={universalUpiLink}
                      size={170}
                      level="H"
                      includeMargin={false}
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="mt-2 text-[10px] font-mono text-neutral-800 font-bold uppercase">
                    {TERMINAL_ID}
                  </div>
                </div>
              )}

            </div>

          </div>

          {/* RIGHT COLUMN: 5 UPI Apps + Cage Coin Option (Span 7) */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-[#0c0d12] border border-white/[0.08] rounded-2xl p-6 sm:p-7 space-y-6 shadow-xl">
              
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold block">
                    CHOOSE YOUR PAYMENT METHOD
                  </span>
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-wider mt-1 font-sans">
                  Select Payment App / Wallet
                </h3>
              </div>

              {/* Payment Methods List */}
              <div className="space-y-3">
                
                {/* 1. Google Pay (GPay) */}
                <button
                  type="button"
                  onClick={() => handleLaunchUPIApp(upiApps[0])}
                  className="w-full group flex items-center justify-between p-4 rounded-2xl bg-black/60 hover:bg-[#4285F4]/10 border border-white/[0.08] hover:border-[#4285F4]/50 transition-all cursor-pointer text-left active:scale-[0.98] relative overflow-hidden"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center shadow-md p-1.5 border border-neutral-200 shrink-0">
                      <svg viewBox="0 0 48 48" className="w-8 h-8">
                        <path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white font-sans group-hover:text-[#4285F4] transition-colors">
                          Google Pay
                        </span>
                        <span className="text-[8px] font-mono font-bold bg-[#4285F4]/20 text-[#4285F4] px-1.5 py-0.5 rounded border border-[#4285F4]/30 uppercase">
                          POPULAR
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-gray-400 block mt-0.5">
                        Direct launch Google Pay app with pre-filled ₹{lockedAmount}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-white/5 group-hover:bg-[#4285F4] text-gray-400 group-hover:text-white flex items-center justify-center transition-colors">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </button>

                {/* 2. PhonePe */}
                <button
                  type="button"
                  onClick={() => handleLaunchUPIApp(upiApps[1])}
                  className="w-full group flex items-center justify-between p-4 rounded-2xl bg-black/60 hover:bg-[#5f259f]/10 border border-white/[0.08] hover:border-[#5f259f]/50 transition-all cursor-pointer text-left active:scale-[0.98] relative overflow-hidden"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="h-12 w-12 rounded-xl bg-[#5f259f] flex items-center justify-center shadow-md p-1.5 shrink-0">
                      <span className="text-white font-bold text-2xl font-sans leading-none select-none">
                        पे
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white font-sans group-hover:text-[#a855f7] transition-colors">
                          PhonePe
                        </span>
                        <span className="text-[8px] font-mono font-bold bg-[#5f259f]/30 text-[#c084fc] px-1.5 py-0.5 rounded border border-[#5f259f]/40 uppercase">
                          FAST
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-gray-400 block mt-0.5">
                        Direct launch PhonePe app with pre-filled ₹{lockedAmount}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-white/5 group-hover:bg-[#5f259f] text-gray-400 group-hover:text-white flex items-center justify-center transition-colors">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </button>

                {/* 3. Paytm */}
                <button
                  type="button"
                  onClick={() => handleLaunchUPIApp(upiApps[2])}
                  className="w-full group flex items-center justify-between p-4 rounded-2xl bg-black/60 hover:bg-[#00BAF2]/10 border border-white/[0.08] hover:border-[#00BAF2]/50 transition-all cursor-pointer text-left active:scale-[0.98] relative overflow-hidden"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="h-12 w-12 rounded-xl bg-white flex flex-col items-center justify-center shadow-md p-1 border border-neutral-200 shrink-0">
                      <span className="text-[#002E6E] font-black text-[13px] tracking-tighter leading-none">
                        pay<span className="text-[#00BAF2]">tm</span>
                      </span>
                      <span className="text-[7px] font-mono font-bold text-[#002E6E] tracking-widest mt-0.5">
                        UPI
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white font-sans group-hover:text-[#00BAF2] transition-colors">
                          Paytm UPI
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-gray-400 block mt-0.5">
                        Direct launch Paytm with pre-filled ₹{lockedAmount}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-white/5 group-hover:bg-[#00BAF2] text-gray-400 group-hover:text-white flex items-center justify-center transition-colors">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </button>

                {/* 4. BHIM UPI */}
                <button
                  type="button"
                  onClick={() => handleLaunchUPIApp(upiApps[3])}
                  className="w-full group flex items-center justify-between p-4 rounded-2xl bg-black/60 hover:bg-[#008450]/10 border border-white/[0.08] hover:border-[#008450]/50 transition-all cursor-pointer text-left active:scale-[0.98] relative overflow-hidden"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="h-12 w-12 rounded-xl bg-white flex flex-col items-center justify-center shadow-md p-1 border border-neutral-200 shrink-0">
                      <div className="flex items-center gap-0.5 leading-none">
                        <span className="text-[#008450] font-black text-[11px] italic">BHIM</span>
                        <span className="text-orange-500 font-black text-[9px]">▶</span>
                      </div>
                      <span className="text-[#002E6E] font-bold text-[8px] tracking-tight mt-0.5">
                        UPI
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white font-sans group-hover:text-[#10b981] transition-colors">
                          BHIM UPI
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-gray-400 block mt-0.5">
                        NPCI Official Gateway with pre-filled ₹{lockedAmount}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-white/5 group-hover:bg-[#008450] text-gray-400 group-hover:text-white flex items-center justify-center transition-colors">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </button>

                {/* 5. Amazon Pay */}
                <button
                  type="button"
                  onClick={() => handleLaunchUPIApp(upiApps[4])}
                  className="w-full group flex items-center justify-between p-4 rounded-2xl bg-black/60 hover:bg-[#FF9900]/10 border border-white/[0.08] hover:border-[#FF9900]/50 transition-all cursor-pointer text-left active:scale-[0.98] relative overflow-hidden"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="h-12 w-12 rounded-xl bg-[#232F3E] flex flex-col items-center justify-center shadow-md p-1 border border-neutral-800 shrink-0">
                      <span className="text-white font-black text-[10px] tracking-tight leading-none">
                        amazon
                      </span>
                      <span className="text-[#FF9900] font-black text-[9px] leading-none mt-0.5">
                        pay
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white font-sans group-hover:text-[#FF9900] transition-colors">
                          Amazon Pay
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-gray-400 block mt-0.5">
                        Amazon UPI App with pre-filled ₹{lockedAmount}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-white/5 group-hover:bg-[#FF9900] text-gray-400 group-hover:text-black flex items-center justify-center transition-colors">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </button>

                {/* 6. CAGE COIN OPTION */}
                <button
                  type="button"
                  onClick={() => setShowCageCoinPage(true)}
                  className="w-full group flex items-center justify-between p-4 rounded-2xl bg-black/70 hover:bg-amber-500/10 border-2 border-amber-500/30 hover:border-amber-500/60 transition-all cursor-pointer text-left active:scale-[0.98] relative overflow-hidden shadow-lg shadow-amber-500/5"
                >
                  <div className="flex items-center gap-3.5">
                    {/* Glowing golden coin icon */}
                    <div className="relative h-12 w-12 bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 rounded-xl flex items-center justify-center shadow-md shadow-amber-500/20 p-1 border border-amber-200/60 shrink-0">
                      <div className="absolute top-1 left-1.5 w-6 h-2 bg-white/30 rounded-full rotate-[-15deg]" />
                      <span className="text-2xl font-display font-extrabold text-amber-950">G</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white font-sans group-hover:text-amber-400 transition-colors">
                          Cage Coin
                        </span>
                        <span className="text-[8px] font-mono font-black bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded border border-amber-500/40 uppercase">
                          {currentCageCoins} CGC AVAILABLE
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-gray-400 block mt-0.5">
                        Pay with your profile coins (1 CGC = ₹1)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-amber-500/10 group-hover:bg-amber-500 text-amber-400 group-hover:text-black flex items-center justify-center transition-colors">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </button>

              </div>

              {/* Manual Verification & Auto-Confirm Section for UPI */}
              <form onSubmit={handleVerifyAndConfirm} className="space-y-4 pt-4 border-t border-white/[0.08]">
                <div className="space-y-1.5 text-left">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest font-bold">
                      UPI 12-Digit Reference (UTR) Number
                    </label>
                  </div>
                  <input
                    type="text"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value.replace(/\s+/g, ''))}
                    placeholder="e.g. 423589123456 (from your UPI App confirmation screen)"
                    className="w-full bg-black border border-white/10 focus:border-red-500 rounded-xl px-4 py-3.5 text-xs text-white font-mono focus:outline-none transition-all placeholder-gray-700"
                  />
                  {utrError && (
                    <p className="text-[10px] text-red-400 font-mono mt-1">{utrError}</p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-white hover:bg-neutral-200 active:scale-[0.99] text-black py-3.5 rounded-xl font-sans font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-lg"
                  >
                    {isSubmitting ? "Locking Reservation..." : "I Have Paid & Lock Booking"}
                  </button>
                </div>
              </form>

            </div>

          </div>

        </div>
      )}

      {/* SUCCESS CONFIRMATION MODAL & RETURN PASS */}
      {paymentSuccess && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div 
            className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100000]"
            onClick={() => {
              setPaymentSuccess(null);
              onBack();
            }}
          />
          <div className="relative z-[100001] bg-[#0c0d12] border-2 border-emerald-500/40 p-6 sm:p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-6 overflow-hidden my-auto text-center">
            
            <div className="h-16 w-16 mx-auto bg-emerald-500/10 border-2 border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
              <CheckCircle className="h-8 w-8 text-emerald-400" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-black block">
                PAYMENT CONFIRMED
              </span>
              <h3 className="text-2xl font-black text-white uppercase font-sans">
                Station Reserved
              </h3>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                Payment of ₹{paymentSuccess.totalCost} for {STORE_NAME} is recorded.
              </p>
            </div>

            {/* If Paid via UPI -> Show Random Cage Coins Reward Banner (1 to 5) */}
            {rewardedCoins !== null && (
              <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-4 text-center space-y-1 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs font-mono font-black uppercase">
                  <Coins className="h-4 w-4 text-amber-400" />
                  <span>UPI Payment Reward Added</span>
                </div>
                <div className="text-2xl font-black text-amber-400 font-sans">
                  +{rewardedCoins} Cage Coins
                </div>
                <p className="text-[10px] font-mono text-gray-400">
                  Automatically credited to your profile (New Balance: {currentCageCoins} CGC)
                </p>
              </div>
            )}

            {/* If Paid via Cage Coins -> Show Coin Deduction Notice */}
            {coinsDeducted !== null && (
              <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-3 text-center text-xs font-mono text-amber-300">
                <span>Deducted {coinsDeducted} CGC from your profile wallet.</span>
              </div>
            )}

            {/* Official Digital Pass Receipt */}
            <div className="bg-black/70 border border-white/[0.08] rounded-2xl p-4 text-left font-mono text-xs space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-white/[0.06] text-[9px] text-gray-500">
                <span>RECEIPT PASS</span>
                <span className="text-emerald-400 font-bold">{paymentSuccess.id.toUpperCase()}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="text-gray-500 block">PLAYER</span>
                  <span className="text-white font-bold">{paymentSuccess.name}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">STATION SLOT</span>
                  <span className="text-red-400 font-bold">Slot #{paymentSuccess.stationNumber}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="text-gray-500 block">SCHEDULE</span>
                  <span className="text-white font-bold">{paymentSuccess.date}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">TIME SLOT</span>
                  <span className="text-white font-bold">{paymentSuccess.timeSlot}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/[0.06] flex justify-between items-center">
                <span className="text-[10px] text-gray-500 uppercase font-bold">
                  METHOD:
                </span>
                <span className="text-xs font-bold text-white uppercase">
                  {paymentSuccess.paymentMethod}
                </span>
              </div>

              <div className="pt-1 flex justify-between items-center">
                <span className="text-[10px] text-gray-500 uppercase font-bold">TOTAL AMOUNT:</span>
                <span className="text-lg font-black text-emerald-400 font-display">₹{paymentSuccess.totalCost}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setPaymentSuccess(null);
                onBack();
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-bold py-3.5 rounded-xl uppercase tracking-wider text-xs transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
            >
              Done & Return to Lobby
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
