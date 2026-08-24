import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomeView from './components/HomeView';
import ServiceView from './components/ServiceView';
import EventView from './components/EventView';
import BookView from './components/BookView';
import PaymentView from './components/PaymentView';
import ProfileView from './components/ProfileView';
import AdminView from './components/AdminView';
import AuthGate from './components/AuthGate';
import { PaymentDetails } from './types';

export default function App() {
  const [currentTab, setTab] = useState<string>('home');
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [paymentSession, setPaymentSession] = useState<PaymentDetails | null>(null);

  const renderContent = () => {
    switch (currentTab) {
      case 'home':
        return <HomeView setTab={setTab} />;
      case 'service':
        return (
          <ServiceView 
            setTab={setTab} 
            setSelectedStationId={setSelectedStationId} 
            setSelectedPackageId={setSelectedPackageId}
          />
        );
      case 'event':
        return (
          <EventView 
            onInitiatePayment={(details) => {
              setPaymentSession(details);
              setTab('payment');
            }}
            setTab={setTab}
          />
        );
      case 'book':
        return (
          <BookView 
            selectedStationId={selectedStationId} 
            setSelectedStationId={setSelectedStationId} 
            selectedPackageId={selectedPackageId}
            setSelectedPackageId={setSelectedPackageId}
            onInitiatePayment={(details) => {
              setPaymentSession(details);
              setTab('payment');
            }}
          />
        );
      case 'payment':
        return paymentSession ? (
          <PaymentView 
            paymentDetails={paymentSession}
            onBack={() => {
              if (paymentSession.stationName?.startsWith('Tournament:')) {
                setTab('event');
              } else {
                setTab('book');
              }
            }}
            onPaymentComplete={() => {
              if (paymentSession.stationName?.startsWith('Tournament:')) {
                setTab('event');
              } else {
                setTab('book');
              }
            }}
          />
        ) : (
          <BookView 
            selectedStationId={selectedStationId} 
            setSelectedStationId={setSelectedStationId} 
            selectedPackageId={selectedPackageId}
            setSelectedPackageId={setSelectedPackageId}
            onInitiatePayment={(details) => {
              setPaymentSession(details);
              setTab('payment');
            }}
          />
        );
      case 'profile':
        return <ProfileView />;
      case 'admin':
        return <AdminView />;
      default:
        return <HomeView setTab={setTab} />;
    }
  };

  return (
    <AuthGate>
      <div className="relative min-h-screen bg-cyber-bg text-gray-100 flex flex-col justify-between overflow-hidden">
        {/* Structural Ambient Grid Background Lines */}
        <div className="absolute inset-0 z-0 opacity-100 grid-overlay pointer-events-none" />
        
        {/* Giant watermark branding in background */}
        <div className="absolute top-[80px] right-[-100px] pointer-events-none opacity-[0.03] select-none z-0 hidden lg:block">
          <h1 className="text-[280px] font-black leading-none text-transparent uppercase font-display" style={{ WebkitTextStroke: '1px #ef4444' }}>
            CAGE
          </h1>
        </div>
        
        <div className="relative z-10 flex flex-col min-h-screen justify-between">
          {/* Navigation bar, sticky top */}
          <Navbar currentTab={currentTab} setTab={setTab} />

          {/* Primary View Container */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 relative z-10">
            <AnimatePresence mode="wait">
              <motion.div
                id="content-stage"
                key={currentTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Footer info blocks, bottom */}
          <Footer setTab={setTab} />
        </div>
      </div>
    </AuthGate>
  );
}
