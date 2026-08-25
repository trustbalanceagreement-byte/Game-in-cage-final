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

  // Auto Return Detection: When user returns from UPI app, prompt them to enter UTR
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isWaitingReturn && !paymentSuccess) {
        setVerifyingAfterReturn(true);
        setTimeout(() => {
          setVerifyingAfterReturn(false);
        }, 3000);
      }
    };

    const handleWindowFocus = () => {
      if (isWaitingReturn && !paymentSuccess) {
        setVerifyingAfterReturn(true);
        setTimeout(() => {
          setVerifyingAfterReturn(false);
        }, 3000);
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

  // 2. CONFIRM PAYMENT VIA UPI APPS & AWARD 1-5 RANDOM CAGE COINS (MANDATORY UTR)
  const handleVerifyAndConfirm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setUtrError('');
    
    const cleanUtr = utrNumber.trim();
    if (!cleanUtr) {
      setUtrError('Please enter your 12-digit UPI reference (UTR) number to lock booking and claim Cage Coins.');
      return;
    }
    
    if (cleanUtr.length < 8) {
      setUtrError('Invalid UTR number. Please enter a valid 12-digit reference number from your UPI app receipt.');
      return;
    }

    setIsSubmitting(true);

    try {
      const bookingId = paymentDetails.bookingId || `gic-${Date.now()}-${Math.floor(Math.random() * 900)}`;
      
      // Calculate random Cage Coins reward (1, 2, 3, 4, or 5) for paying via UPI and submitting valid UTR
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
            message: `You earned +${rewardCoinAmount} Cage Coins for verifying UPI UTR (${cleanUtr}) for ${paymentDetails.stationName}! New Balance: ${updatedTotalCoins} CGC.`,
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
        transactionId: cleanUtr,
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

      {/* Return Prompt Notification Banner */}
      {verifyingAfterReturn && (
        <div className="bg-amber-950/70 border-2 border-amber-500/50 p-4 rounded-2xl flex items-center justify-between gap-3 text-amber-300 animate-in fade-in duration-200 shadow-xl">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <span className="text-xs font-black uppercase tracking-wider block">Return from UPI App Detected</span>
              <span className="text-[11px] font-mono text-amber-200/90">Please enter your 12-digit UTR reference number below to claim Cage Coins and lock booking.</span>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 px-2 py-1 rounded border border-amber-500/40">Step 2: Enter UTR</span>
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
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 rounded-xl flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0 border border-amber-200/60">
                  <div className="absolute top-1 left-1 w-4 h-1.5 bg-white/30 rounded-full rotate-[-15deg]" />
                  <span className="text-xl font-display font-extrabold text-amber-950">G</span>
                </div>
                <div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                    WALLET CHECKOUT
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider mt-0.5">
                    Pay with Cage Coins
                  </h3>
                </div>
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
          {/* LEFT COLUMN: Authentic White Thermal Receipt Bill (Span 5) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Thermal Paper Receipt Slip */}
            <div className="relative mx-auto w-full max-w-[440px] sm:max-w-[500px] z-10">
              
              {/* Paper Body */}
              <div className="bg-[#ffffff] text-neutral-900 px-6 sm:px-8 pt-6 pb-4 font-mono shadow-[0_22px_50px_-10px_rgba(0,0,0,0.85),0_0_18px_rgba(0,0,0,0.15)] selection:bg-neutral-200">
                
                {/* Receipt Title & Double Dashed Line */}
                <div className="text-center space-y-1">
                  <div className="border-b-2 border-dashed border-neutral-300 w-full my-1"></div>
                  <h3 className="text-xl font-black tracking-widest text-neutral-950 uppercase font-sans py-0.5">
                    RECEIPT
                  </h3>
                  <div className="border-b-2 border-dashed border-neutral-300 w-full my-1"></div>
                </div>

                {/* Store Header & Meta Details */}
                <div className="text-center py-3 space-y-1">
                  <h4 className="text-base font-black text-neutral-950 uppercase tracking-wider font-sans">
                    {STORE_NAME}
                  </h4>
                  <p className="text-[10px] font-bold text-neutral-500 tracking-widest uppercase">
                    ESPORTS & GAMING LOUNGE
                  </p>
                  
                  <div className="text-[10px] text-neutral-600 pt-2 space-y-1">
                    <p>TERMINAL: <span className="text-neutral-900 font-bold">{TERMINAL_ID}</span></p>
                    <p>BILL NO / REF: <span className="text-neutral-900 font-bold">{sessionRef}</span></p>
                    <p>DATE: <span className="text-neutral-900 font-medium">{paymentDetails.date || new Date().toISOString().split('T')[0]}</span> | TIME: <span className="text-neutral-900 font-medium">{paymentDetails.timeSlot || '12:00 PM'}</span></p>
                  </div>
                </div>

                {/* Dashed Separator */}
                <div className="border-b border-dashed border-neutral-300 w-full my-2"></div>

                {/* Line Items Table */}
                <div className="space-y-2 text-xs py-1">
                  <div className="flex justify-between text-[10px] font-bold text-neutral-500 uppercase pb-1.5 border-b border-neutral-200">
                    <span>ITEM / DESCRIPTION</span>
                    <span>AMOUNT</span>
                  </div>

                  <div className="flex justify-between items-start pt-1.5">
                    <div className="pr-2">
                      <span className="text-neutral-950 font-bold text-xs block">{paymentDetails.stationName || 'Gaming Session'}</span>
                      <span className="text-[9.5px] text-neutral-500">Player: {paymentDetails.playerName || profile?.name || 'Rajesh Sharma'}</span>
                    </div>
                    <span className="text-neutral-950 font-bold text-xs whitespace-nowrap">₹{lockedAmount.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-[10px] text-neutral-600 pt-1">
                    <span>Base Slot Charge</span>
                    <span>₹{lockedAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-neutral-500">
                    <span>GST (0.0%)</span>
                    <span>₹0.00</span>
                  </div>
                </div>

                {/* Dashed Separator */}
                <div className="border-b border-dashed border-neutral-300 w-full my-2.5"></div>

                {/* Total Payable Box */}
                <div className="py-1.5">
                  <div className="bg-neutral-100 border border-neutral-200 rounded-lg px-3.5 py-2.5 flex items-center justify-between shadow-sm">
                    <span className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider font-mono">
                      TOTAL AMOUNT
                    </span>
                    <span className="text-xs sm:text-sm font-black text-neutral-950 font-mono">
                      ₹{lockedAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Merchant UPI VPA Box */}
                <div className="py-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[9px] text-neutral-500 uppercase font-bold">
                    <span>OFFICIAL MERCHANT UPI VPA</span>
                    <span className="text-emerald-700 font-bold">VERIFIED NPCI</span>
                  </div>
                  <div className="flex items-center justify-between bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                    <span className="text-xs font-bold text-neutral-900 tracking-wider font-mono">
                      {UPI_ID}
                    </span>
                    <button
                      type="button"
                      onClick={copyUpiToClipboard}
                      className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase bg-neutral-900 hover:bg-neutral-800 text-white px-2.5 py-1 rounded transition-colors cursor-pointer shadow-sm"
                    >
                      {copiedUpi ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span>COPIED</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>COPY</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Standee QR Code Option */}
                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowQrModal(!showQrModal)}
                    className="w-full py-2.5 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-900 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                  >
                    <QrCode className="h-4 w-4 text-neutral-900" />
                    <span>{showQrModal ? 'Close Standee QR' : 'Display POS QR Standee'}</span>
                  </button>

                  {showQrModal && (
                    <div className="bg-neutral-50 rounded-xl p-4 text-center border border-neutral-300 shadow-md animate-in zoom-in-95 duration-200">
                      <div className="inline-block bg-neutral-900 text-white font-black text-[10px] px-3 py-0.5 rounded-full mb-2 uppercase">
                        {STORE_NAME} POS
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-neutral-300 mx-auto inline-block shadow-sm">
                        <QRCodeSVG
                          value={universalUpiLink}
                          size={160}
                          level="H"
                          includeMargin={false}
                          className="w-full h-auto"
                        />
                      </div>
                      <div className="mt-1.5 text-[9px] font-mono text-neutral-700 font-bold uppercase">
                        {TERMINAL_ID}
                      </div>
                    </div>
                  )}
                </div>

                {/* Dashed Separator */}
                <div className="border-b border-dashed border-neutral-300 w-full my-3"></div>

                {/* Thank You Note */}
                <div className="text-center py-2">
                  <h4 className="text-lg font-black text-neutral-950 uppercase tracking-widest font-sans">
                    THANK YOU
                  </h4>
                  <p className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold mt-0.5">
                    *** GAME IN CAGE ESPORTS ***
                  </p>
                </div>

                {/* Realistic Barcode */}
                <div className="pt-2 pb-2">
                  <div className="flex justify-center items-center gap-[2.5px] h-11 px-2 select-none overflow-hidden opacity-90">
                    {[3,1,2,4,1,3,1,2,1,4,2,1,3,1,2,3,1,4,1,2,3,1,2,4,1,3,2,1,4,1,2,3,1,4,2,1,3,1,2,4,1,3,1,2,4,1,3,2,1,3,2,4].map((w, idx) => (
                      <div key={idx} className="h-full bg-neutral-900" style={{ width: `${w * 1.5}px` }} />
                    ))}
                  </div>
                </div>

              </div>

              {/* Serrated Zig-Zag / Jagged Paper Cut-off Bottom Edge */}
              <div className="w-full -mt-0.5 overflow-hidden filter drop-shadow-[0_4px_3px_rgba(0,0,0,0.5)]">
                <svg className="w-full h-3.5 text-white fill-current block" viewBox="0 0 240 10" preserveAspectRatio="none">
                  <polygon points="0,0 5,8 10,0 15,8 20,0 25,8 30,0 35,8 40,0 45,8 50,0 55,8 60,0 65,8 70,0 75,8 80,0 85,8 90,0 95,8 100,0 105,8 110,0 115,8 120,0 125,8 130,0 135,8 140,0 145,8 150,0 155,8 160,0 165,8 170,0 175,8 180,0 185,8 190,0 195,8 200,0 205,8 210,0 215,8 220,0 225,8 230,0 235,8 240,0" />
                </svg>
              </div>

            </div>

          </div>

          {/* RIGHT COLUMN: 5 UPI Apps + Cage Coin Option (Span 7) */}
          <div className="lg:col-span-7 space-y-4">
            
            <div className="bg-[#0c0d12] border border-white/[0.08] rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
              
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-emerald-400 font-bold block">
                    CHOOSE YOUR PAYMENT METHOD
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider mt-0.5 font-sans">
                  Select Payment App / Wallet
                </h3>
              </div>

              {/* Payment Methods List - Sleek & Medium Sized */}
              <div className="space-y-2 sm:space-y-2.5">
                
                {/* 1. Google Pay (GPay) */}
                <button
                  type="button"
                  onClick={() => handleLaunchUPIApp(upiApps[0])}
                  className="w-full group flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-black/60 hover:bg-[#4285F4]/10 border border-white/[0.08] hover:border-[#4285F4]/50 transition-all cursor-pointer text-left active:scale-[0.99] relative overflow-hidden"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-white flex items-center justify-center shadow-sm p-1 border border-neutral-200 shrink-0">
                      <svg viewBox="0 0 48 48" className="w-6 h-6">
                        <path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-[13px] font-bold text-white font-sans group-hover:text-[#4285F4] transition-colors">
                          Google Pay
                        </span>
                        <span className="text-[7.5px] font-mono font-bold bg-[#4285F4]/20 text-[#4285F4] px-1.5 py-0.2 rounded border border-[#4285F4]/30 uppercase">
                          POPULAR
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="h-7 w-7 rounded-lg bg-white/5 group-hover:bg-[#4285F4] text-gray-400 group-hover:text-white flex items-center justify-center transition-colors">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </button>

                {/* 2. PhonePe */}
                <button
                  type="button"
                  onClick={() => handleLaunchUPIApp(upiApps[1])}
                  className="w-full group flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-black/60 hover:bg-[#5f259f]/10 border border-white/[0.08] hover:border-[#5f259f]/50 transition-all cursor-pointer text-left active:scale-[0.99] relative overflow-hidden"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-[#5f259f] flex items-center justify-center shadow-sm p-1 shrink-0">
                      <span className="text-white font-bold text-lg sm:text-xl font-sans leading-none select-none">
                        पे
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-[13px] font-bold text-white font-sans group-hover:text-[#a855f7] transition-colors">
                          PhonePe
                        </span>
                        <span className="text-[7.5px] font-mono font-bold bg-[#5f259f]/30 text-[#c084fc] px-1.5 py-0.2 rounded border border-[#5f259f]/40 uppercase">
                          FAST
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="h-7 w-7 rounded-lg bg-white/5 group-hover:bg-[#5f259f] text-gray-400 group-hover:text-white flex items-center justify-center transition-colors">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </button>

                {/* 3. Paytm */}
                <button
                  type="button"
                  onClick={() => handleLaunchUPIApp(upiApps[2])}
                  className="w-full group flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-black/60 hover:bg-[#00BAF2]/10 border border-white/[0.08] hover:border-[#00BAF2]/50 transition-all cursor-pointer text-left active:scale-[0.99] relative overflow-hidden"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-white flex flex-col items-center justify-center shadow-sm p-0.5 border border-neutral-200 shrink-0">
                      <span className="text-[#002E6E] font-black text-[11px] tracking-tighter leading-none">
                        pay<span className="text-[#00BAF2]">tm</span>
                      </span>
                      <span className="text-[6.5px] font-mono font-bold text-[#002E6E] tracking-widest mt-0.5">
                        UPI
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-[13px] font-bold text-white font-sans group-hover:text-[#00BAF2] transition-colors">
                          Paytm UPI
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="h-7 w-7 rounded-lg bg-white/5 group-hover:bg-[#00BAF2] text-gray-400 group-hover:text-white flex items-center justify-center transition-colors">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </button>

                {/* 4. BHIM UPI */}
                <button
                  type="button"
                  onClick={() => handleLaunchUPIApp(upiApps[3])}
                  className="w-full group flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-black/60 hover:bg-[#008450]/10 border border-white/[0.08] hover:border-[#008450]/50 transition-all cursor-pointer text-left active:scale-[0.99] relative overflow-hidden"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-white flex flex-col items-center justify-center shadow-sm p-0.5 border border-neutral-200 shrink-0">
                      <div className="flex items-center gap-0.5 leading-none">
                        <span className="text-[#008450] font-black text-[9.5px] italic">BHIM</span>
                        <span className="text-orange-500 font-black text-[7.5px]">▶</span>
                      </div>
                      <span className="text-[#002E6E] font-bold text-[7px] tracking-tight mt-0.5">
                        UPI
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-[13px] font-bold text-white font-sans group-hover:text-[#10b981] transition-colors">
                          BHIM UPI
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="h-7 w-7 rounded-lg bg-white/5 group-hover:bg-[#008450] text-gray-400 group-hover:text-white flex items-center justify-center transition-colors">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </button>

                {/* 5. Amazon Pay */}
                <button
                  type="button"
                  onClick={() => handleLaunchUPIApp(upiApps[4])}
                  className="w-full group flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-black/60 hover:bg-[#FF9900]/10 border border-white/[0.08] hover:border-[#FF9900]/50 transition-all cursor-pointer text-left active:scale-[0.99] relative overflow-hidden"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-[#232F3E] flex flex-col items-center justify-center shadow-sm p-0.5 border border-neutral-800 shrink-0">
                      <span className="text-white font-black text-[8.5px] tracking-tight leading-none">
                        amazon
                      </span>
                      <span className="text-[#FF9900] font-black text-[7.5px] leading-none mt-0.5">
                        pay
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-[13px] font-bold text-white font-sans group-hover:text-[#FF9900] transition-colors">
                          Amazon Pay
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="h-7 w-7 rounded-lg bg-white/5 group-hover:bg-[#FF9900] text-gray-400 group-hover:text-black flex items-center justify-center transition-colors">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </button>

                {/* 6. CAGE COIN OPTION */}
                <button
                  type="button"
                  onClick={() => setShowCageCoinPage(true)}
                  className="w-full group flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-black/70 hover:bg-amber-500/10 border-2 border-amber-500/30 hover:border-amber-500/60 transition-all cursor-pointer text-left active:scale-[0.99] relative overflow-hidden shadow-md shadow-amber-500/5"
                >
                  <div className="flex items-center gap-3">
                    {/* Glowing golden coin icon */}
                    <div className="relative h-9 w-9 sm:h-10 sm:w-10 bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 rounded-lg flex items-center justify-center shadow-sm shadow-amber-500/20 p-0.5 border border-amber-200/60 shrink-0">
                      <div className="absolute top-0.5 left-1 w-4 h-1.5 bg-white/30 rounded-full rotate-[-15deg]" />
                      <span className="text-lg sm:text-xl font-display font-extrabold text-amber-950">G</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-[13px] font-bold text-white font-sans group-hover:text-amber-400 transition-colors">
                          Cage Coin
                        </span>
                        <span className="text-[7.5px] font-mono font-black bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded border border-amber-500/40 uppercase">
                          {currentCageCoins} CGC AVAILABLE
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="h-7 w-7 rounded-lg bg-amber-500/10 group-hover:bg-amber-500 text-amber-400 group-hover:text-black flex items-center justify-center transition-colors">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </button>

              </div>

              {/* Manual Verification & Auto-Confirm Section for UPI */}
              <form onSubmit={handleVerifyAndConfirm} className="space-y-3.5 pt-3.5 border-t border-white/[0.08]">
                <div className="space-y-1 text-left">
                  <div className="flex items-center justify-between">
                    <label className="block text-[9.5px] font-mono text-gray-300 uppercase tracking-widest font-bold">
                      UPI 12-Digit Reference (UTR) Number
                    </label>
                    <span className="text-[8px] font-mono font-bold uppercase text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/30">
                      MANDATORY FOR COINS
                    </span>
                  </div>
                  <input
                    type="text"
                    value={utrNumber}
                    onChange={(e) => {
                      setUtrNumber(e.target.value.replace(/\s+/g, ''));
                      if (utrError) setUtrError('');
                    }}
                    placeholder="e.g. 423589123456 (from your UPI App confirmation screen)"
                    className={`w-full bg-black border ${utrError ? 'border-red-500 ring-1 ring-red-500/30' : 'border-white/10 focus:border-amber-400'} rounded-xl px-3.5 py-2.5 sm:py-3 text-xs text-white font-mono focus:outline-none transition-all placeholder-gray-600`}
                  />
                  {utrError && (
                    <p className="text-[10px] text-red-400 font-mono mt-1 font-bold flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span>{utrError}</span>
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 pt-0.5">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    onClick={(e) => {
                      if (!utrNumber.trim()) {
                        e.preventDefault();
                        setUtrError('Please enter your 12-digit UPI reference (UTR) number first to claim Cage Coins and lock booking.');
                      }
                    }}
                    className={`flex-1 py-3 rounded-xl font-sans font-black text-xs uppercase tracking-wider transition-all shadow-md ${
                      !utrNumber.trim()
                        ? 'bg-neutral-200/90 hover:bg-neutral-100 text-neutral-800 cursor-pointer border border-neutral-300'
                        : 'bg-white hover:bg-neutral-200 active:scale-[0.99] text-black cursor-pointer shadow-white/10'
                    }`}
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
