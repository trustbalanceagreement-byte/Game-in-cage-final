export interface Booking {
  id: string;
  name: string;
  phone: string;
  date: string;
  timeSlot: string; // e.g. "14:00"
  stationType: string; // e.g. "pc-beast", "ps5-cage", etc.
  hours: number;
  totalCost: number;
  stationNumber: number;
  isHappyHourApplied: boolean;
  notes?: string;
  status?: 'pending' | 'approved' | 'rejected';
  rejectedAt?: number;
  createdAt: string;
  userId?: string;
  paymentStatus?: 'paid' | 'unpaid' | 'pending';
  transactionId?: string;
  paymentMethod?: string;
}

export interface PaymentDetails {
  bookingId?: string;
  storeName: string; // Pre-locked "Game In Cage"
  terminalId: string; // "Terminal 1-Q240602048"
  upiId: string; // "Q240602048@ybl"
  amount: number; // Pre-locked amount from Session Statement
  stationName: string;
  duration: string;
  timeSlot: string;
  date: string;
  playerName: string;
  phone: string;
  notes?: string;
  isHappyHourApplied?: boolean;
  subtotal?: number;
  discount?: number;
}

export interface TournamentEvent {
  id: string;
  title: string;
  game: string;
  date: string; // e.g. "June 25, 2026"
  time: string; // e.g. "14:00"
  prizePool: string;
  maxTeams: number;
  currentTeams: number;
  description: string;
  entryFee: string;
  image: string;
  tags: string[];
  rules: string[];
}

export interface StationConfig {
  id: string;
  name: string;
  category: 'pc-rig' | 'console-cage' | 'vr-pod' | 'vip-arena' | 'pool' | 'car-sim';
  description: string;
  specs: string[];
  hourlyRate: number; // in INR e.g. 80, 100, 150
  image: string;
  features: string[];
  startingPrice?: number;
  startingDuration?: string;
  minPersons?: number;
}

export interface GamingPackage {
  id: string;
  name: string;
  price: number;
  duration: string;
  details: string[];
  image: string;
  description: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: 'Snacks' | 'Drinks' | 'Energy Fuels';
  price: number;
  description?: string;
  isPopular?: boolean;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  gamePlayed?: string;
}
