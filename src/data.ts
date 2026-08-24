import { StationConfig, TournamentEvent, MenuItem, Review, GamingPackage } from './types';
import packageCombo200Img from './assets/images/package_combo_200_1783184827410.jpg';
import packageVrPs5160Img from './assets/images/package_vr_ps5_160_1783184840905.jpg';
import ps5LoungeImg from './assets/images/ps5_lounge_setup_1783186972380.jpg';
import carSimImg from './assets/images/car_simulation_setup_1783186987657.jpg';
import vrPodImg from './assets/images/vr_pod_setup_1783187002909.jpg';
import poolLoungeImg from './assets/images/pool_lounge_setup_1783187015113.jpg';

export const CAFE_INFO = {
  name: "Game in Cage",
  tagline: "Unleash the Beast. Elevate Your Play.",
  rating: 4.9,
  reviewsCount: 387,
  location: "Ground Floor, B-5/29(C.A, B5, Block B, Kalyani, West Bengal 741235",
  gmapsLink: "https://maps.google.com/?q=Ground+Floor,+B-5/29(C.A,+B5,+Block+B,+Kalyani,+West+Bengal+741235",
  reviewLink: "https://maps.app.goo.gl/y3xawQXfekeVPTxa7",
  phone: "+91 9330105550",
  email: "gameincage@gmail.com",
  facebook: "https://www.facebook.com/share/1NmQc2kU1H/?mibextid=wwXIfr",
  instagram: "https://www.instagram.com/gameincage?utm_source=qr",
  openHours: "10:00 AM - 11:00 PM (Monday - Sunday)",
  happyHours: "10:00 AM - 2:00 PM (Monday - Sunday)",
  happyHourDiscount: 0.25, // 25% Off
  aboutText: "Game in Cage is Kalyani's ultimate gaming cafe, engineering an unparalleled high-performance environment for casual and competitive players alike. Built as a matrix of private and dual 'gaming cages', our arena is equipped with top-tier cutting-edge Hardware, professional consoles, immersive VR motion rigs, and premium gaming acoustics. Whether you're grinding ranked queues, competing in high-stakes local tournaments, or partying up with friends, we provide the ultimate steel-cage stadium atmosphere, backed by high-octane snacks and custom brewed fuels.",
};

export const STATIONS: StationConfig[] = [
  {
    id: "ps5-cage",
    name: "PlayStation 5 Console Cage",
    category: "console-cage",
    description: "Immersive Next-Gen console setup. Complete with a luxurious leather couch, pro controllers, and a high-fidelity soundbar system.",
    specs: [
      "Console: PlayStation 5 Slim",
      "Display: LG OLED C3 55\" 4K 120Hz TV",
      "Audio: Dolby Atmos Soundbar",
      "Controllers: 2x DualSense Wireless Controllers"
    ],
    hourlyRate: 120,
    startingPrice: 60,
    startingDuration: "30 Mins",
    image: ps5LoungeImg,
    features: ["Preloaded FIFA, GTA V, Tekken 8, Mortal Kombat 1", "Cozy couch seating for dual players", "High-frequency focus lighting"]
  },
  {
    id: "car-sim",
    name: "High-Speed Car Simulation",
    category: "car-sim",
    description: "Professional bucket-seat motion cockpit setup with a force-feedback leather wheel and panoramic triple screen projection.",
    specs: [
      "Rig: Professional Steering & Pedals Rig",
      "Display: Triple Curved Panoramic Displays",
      "Feedback: Force-Feedback Steering",
      "Seat: Racing Cockpit Bucket Seat"
    ],
    hourlyRate: 160,
    startingPrice: 80,
    startingDuration: "30 Mins",
    image: carSimImg,
    features: ["F1 23, Assetto Corsa, Forza Horizon preloaded", "Manual or automatic gear configurations", "Immersive virtual driving physics"]
  },
  {
    id: "vr-pod",
    name: "VR Dimension Pod",
    category: "vr-pod",
    description: "A secure, motion-tracked VR pod structure utilizing top-tier standalone headset tech and haptic feedback vests.",
    specs: [
      "Headset: Meta Quest 3 Elite (Wireless Link)",
      "Tracking: Multi-directional floor sensor arena",
      "Haptics: TactSuit X40 Haptic vest option",
      "Acoustics: Spatial 3D Audio Pod"
    ],
    hourlyRate: 250,
    startingPrice: 130,
    startingDuration: "30 Mins",
    image: vrPodImg,
    features: ["Beat Saber, Superhot, Half-Life Alyx preloaded", "Haptic vest support for true tactile realism", "Dedicated staff-guided safety support"]
  },
  {
    id: "pool-board",
    name: "Championship 8-Ball Pool Table",
    category: "pool",
    description: "Premium slate pool board featuring high-quality green felt, professional cue sticks, and perfect shadowless overhead lighting.",
    specs: [
      "Board: Championship Slate Pool Table",
      "Cues: Premium Ash Wood Cue Sticks",
      "Sets: Pro-Grade 8-Ball & 9-Ball Sets",
      "Lighting: Custom Shadowless Warm LED"
    ],
    hourlyRate: 200,
    startingPrice: 50,
    startingDuration: "15 Mins",
    minPersons: 2,
    image: poolLoungeImg,
    features: ["Minimum 2 players per booking required", "Comfortable player lounge seating", "Chalk, cues, and bridge sticks provided"]
  }
];

export const TOURNAMENTS: TournamentEvent[] = [
  {
    id: "t1",
    title: "Kalyani Cage Fight: Valorant 5v5",
    game: "Valorant",
    date: "June 27, 2026",
    time: "2:00 PM IST",
    prizePool: "₹25,000 Cash + Gaming Gear",
    maxTeams: 16,
    currentTeams: 11,
    description: "Prepare your tactics. The premier 5v5 Valorant cup in Kalyani returns. Played on our high-refresh-rate Beast Cages under low-latency tournament fiber. Registration includes team drinks.",
    entryFee: "₹500 / Team",
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=1200",
    tags: ["LAN Event", "5v5 Squads", "FPS Battle"],
    rules: [
      "Single elimination, best of 1. Finals best of 3.",
      "Played on official Kalyani server, tactical guidelines apply.",
      "Personal mice/keyboards are permitted but must check-in 1 hour early.",
      "Profanity or toxic outbursts will result in instant disqualification."
    ]
  },
  {
    id: "t2",
    title: "Iron Grid: Tekken 8 Cage Match",
    game: "Tekken 8",
    date: "July 04, 2026",
    time: "4:00 PM IST",
    prizePool: "₹10,000 Cash Prize + Custom Trophies",
    maxTeams: 32,
    currentTeams: 19,
    description: "Who ranks supreme inside the heavy metal console dome? Enter the cage and duel with the best fighters in West Bengal. Standard fight controllers provided, or bring your own fightsticks.",
    entryFee: "₹150 / Player",
    image: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&q=80&w=1200",
    tags: ["1v1 Solo", "Fight Night", "Console Arcade"],
    rules: [
      "Double elimination brackets, default game rules apply.",
      "Best of 3 matches, semi-finals and finals best of 5.",
      "Default stage pick is random, subsequent picks are loser's choice.",
      "Custom fight sticks must be plugged and configured 15 min prior."
    ]
  },
  {
    id: "t3",
    title: "FC 26 Summer Shootout",
    game: "EA Sports FC 26",
    date: "July 12, 2026",
    time: "1:00 PM IST",
    prizePool: "₹8,000 Tournament Credit + Goodie Bags",
    maxTeams: 24,
    currentTeams: 14,
    description: "Take the cup with your premier tactics on our 55-inch OLED console rigs. Smooth 120Hz rendering guarantees flawless gameplay and precision passing. Come solo and represent your favorite club.",
    entryFee: "₹100 / Player",
    image: "https://images.unsplash.com/photo-1508244751656-57494595f53d?auto=format&fit=crop&q=80&w=1200",
    tags: ["Console Sport", "1v1 Bracket", "Casual friendly"],
    rules: [
      "Single elimination tournament, custom match length of 6 minutes half.",
      "Tactical defending mode is mandatory.",
      "No custom squad adjustments; standard clubs/national teams only.",
      "Ties decided by immediate Extra Time and Penalties."
    ]
  }
];

export const MENU_ITEMS: MenuItem[] = [
  {
    id: "m1",
    name: "Chilli Paneer Cage Wraps",
    category: "Snacks",
    price: 130,
    isPopular: true
  },
  {
    id: "m2",
    name: "Golden Garlic Fries Basket",
    category: "Snacks",
    price: 90,
    description: "Thick-cut potato wedges hand-tossed with roasted local garlic parmesan dust. Served with hot ranch dip.",
  },
  {
    id: "m3",
    name: "The Respawn Burger (Chicken)",
    category: "Snacks",
    price: 160,
    description: "Crispy deep-fried premium chicken breast patte, glazed with dynamic house BBQ sauce and iceberg lettuce.",
    isPopular: true
  },
  {
    id: "m4",
    name: "Blue Lagoon Overdrive",
    category: "Drinks",
    price: 80,
    description: "Chilled mocktail with blue curacao, fresh lime squeeze, and carbonated mist. Refreshes instantly."
  },
  {
    id: "m5",
    name: "Hazelnut Cold Coffee (Nitro)",
    category: "Drinks",
    price: 110,
    description: "Freshly brewed West Bengal organic hazelnut beans, cold-pressed and served with textured creamy froth.",
    isPopular: true
  },
  {
    id: "m6",
    name: "Spiced Masala Chai",
    category: "Drinks",
    price: 40,
    description: "Traditional local favorite with crushed ginger and cardamoms. Keeps the focus up on night-long raids."
  },
  {
    id: "m7",
    name: "Monster Energy Fuel (Black)",
    category: "Energy Fuels",
    price: 110,
    description: "Original direct cold energy can to power up marathon sessions and tactical late night tournament grinds."
  },
  {
    id: "m8",
    name: "Gaming Grid Combo (Burger + Fries + Overdrive)",
    category: "Energy Fuels",
    price: 280,
    description: "Get the full setup: Respawn Burger, Garlic Fries, and a dynamic Blue Lagoon Overdrive. Saves 50 INR!",
    isPopular: true
  }
];

export const CUSTOMER_REVIEWS: Review[] = [
  {
    id: "r1",
    author: "Rohan Dasgupta",
    rating: 5,
    text: "Game in Cage is easily the best gaming spot in Kalyani! The RTX 4080 rigs are mind-blowing (smooth 240+ fps on Valorant), internet latency is literally 5ms, and the cage design is super cool. Checked the Happy Hours discount on Tuesday, got a high-end PC for just 60 bucks/hour!",
    date: "June 12, 2026",
    gamePlayed: "Valorant"
  },
  {
    id: "r2",
    author: "Priti Sengupta",
    rating: 5,
    text: "Highly recommend! Me and my friends booked the Console setup for double dates on Sunday. FIFA and Tekken on those massive OLED TVs feels so premium. Also, those Chilli Paneer wraps are incredibly tasty and clean to eat while gaming.",
    date: "June 14, 2026",
    gamePlayed: "FIFA 24"
  },
  {
    id: "r3",
    author: "Abhishek Roy",
    rating: 4,
    text: "Great atmosphere, excellent hardware. The VR Pods are extremely unique and worth every rupee of the 150/hr fee. Only feedback is that it gets very busy during weekends, so definitely use this website to book your Cage slot in advance!",
    date: "June 15, 2026",
    gamePlayed: "Meta Quest VR Racing"
  },
  {
    id: "r4",
    author: "Sneha Ghoshal",
    rating: 5,
    text: "Participated in the Valorant bracket last weekend. The coordination, low ping, and friendly local community made for an awesome event. Plus, the 4.9 online rating fits perfectly. Definitely returning!",
    date: "June 09, 2026",
    gamePlayed: "Competitive Valorant Tournament"
  }
];

export const GAMING_PACKAGES: GamingPackage[] = [
  {
    id: "pkg-combo-200",
    name: "Ultimate Combo Package",
    price: 200,
    duration: "1 Hour 15 Mins",
    image: packageCombo200Img,
    description: "Get the complete high-octane casual experience. Perfect for trying out multiple gaming zones in a single session.",
    details: [
      "45 Mins PS5 Console Gaming",
      "15 Mins VR Dimension Pod",
      "15 Mins 8-Ball Pool"
    ]
  },
  {
    id: "pkg-vr-ps5-160",
    name: "VR & Console Speedrun",
    price: 160,
    duration: "1 Hour",
    image: packageVrPs5160Img,
    description: "Dive straight into our most popular immersive platforms. Shift from hyper-realistic VR to cinematic PS5 action.",
    details: [
      "45 Mins PS5 Console Gaming",
      "15 Mins VR Dimension Pod"
    ]
  }
];
