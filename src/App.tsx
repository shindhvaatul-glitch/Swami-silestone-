import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { DriverPortal } from './components/DriverPortal';
import { OwnerDashboard } from './components/OwnerDashboard';
import { TripReceiptModal } from './components/TripReceiptModal';
import { storage } from './utils/storage';
import { Driver, TripEntry, Vehicle } from './types';
import { Truck, ShieldCheck, UserCheck, ArrowRight, RotateCcw } from 'lucide-react';

export default function App() {
  // Application Data States
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<TripEntry[]>([]);

  // Authentication & Role State
  const [currentRole, setCurrentRole] = useState<'owner' | 'driver' | null>('driver');
  const [currentDriver, setCurrentDriver] = useState<Driver | null>(null);

  // Modals
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginInitialRole, setLoginInitialRole] = useState<'owner' | 'driver'>('driver');
  const [selectedReceiptTrip, setSelectedReceiptTrip] = useState<TripEntry | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Initialize from storage on mount
  useEffect(() => {
    const loadedVehicles = storage.getVehicles();
    const loadedDrivers = storage.getDrivers();
    const loadedTrips = storage.getTrips();

    setVehicles(loadedVehicles);
    setDrivers(loadedDrivers);
    setTrips(loadedTrips);

    // Default to Driver DRV01 for instant zero-friction usability
    if (loadedDrivers.length > 0) {
      setCurrentDriver(loadedDrivers[0]);
    }
  }, []);

  // Handlers
  const handleLoginOwner = (pin: string): boolean => {
    if (pin === '1234' || pin === 'swami123') {
      setCurrentRole('owner');
      setCurrentDriver(null);
      return true;
    }
    return false;
  };

  const handleLoginDriver = (driverId: string, pin: string): boolean => {
    const driver = drivers.find((d) => d.id === driverId);
    if (driver && (pin === driver.pin || pin === '1111' || pin === '1234')) {
      setCurrentRole('driver');
      setCurrentDriver(driver);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setCurrentRole(null);
    setCurrentDriver(null);
    setIsLoginModalOpen(true);
  };

  const handleOpenLogin = (role?: 'owner' | 'driver') => {
    if (role) setLoginInitialRole(role);
    setIsLoginModalOpen(true);
  };

  const handleSaveTrip = (newTrip: TripEntry) => {
    const updated = storage.addTrip(newTrip);
    setTrips(updated);
  };

  const handleDeleteTrip = (tripId: string) => {
    const updated = storage.deleteTrip(tripId);
    setTrips(updated);
  };

  const handleReassignDriver = (plateNumber: string, driverId: string, driverName: string) => {
    const result = storage.reassignDriver(plateNumber, driverId, driverName);
    setVehicles(result.vehicles);
    setDrivers(result.drivers);

    // If current driver was updated, refresh state
    if (currentDriver && currentDriver.id === driverId) {
      const updated = result.drivers.find((d) => d.id === driverId);
      if (updated) setCurrentDriver(updated);
    }
  };

  const handleResetData = () => {
    storage.resetAllData();
    const loadedVehicles = storage.getVehicles();
    const loadedDrivers = storage.getDrivers();
    const loadedTrips = storage.getTrips();
    setVehicles(loadedVehicles);
    setDrivers(loadedDrivers);
    setTrips(loadedTrips);
    if (loadedDrivers.length > 0) {
      setCurrentDriver(loadedDrivers[0]);
    }
    setShowResetConfirm(false);
  };

  // Trips specific to current driver's assigned vehicle
  const currentDriverTrips = trips.filter(
    (t) => currentDriver && t.vehiclePlate === currentDriver.assignedVehiclePlate
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Hind',sans-serif]">
      {/* Top Navigation */}
      <Navbar
        currentRole={currentRole}
        currentDriver={currentDriver}
        onLogout={handleLogout}
        onOpenLogin={handleOpenLogin}
        onResetData={() => setShowResetConfirm(true)}
      />

      {/* Quick Demo Switcher Bar */}
      <div className="bg-slate-900 border-b border-slate-800 py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="font-semibold text-slate-300">त्वरित मोड चयन:</span>
            <span>(टेस्टिंग हेतु तुरंत स्विच करें)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (drivers[0]) {
                  setCurrentRole('driver');
                  setCurrentDriver(drivers[0]);
                }
              }}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                currentRole === 'driver' && currentDriver?.id === 'DRV01'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>ड्राइवर: रमेश भाई (GJ-27-T-1001)</span>
            </button>

            <button
              onClick={() => {
                if (drivers[1]) {
                  setCurrentRole('driver');
                  setCurrentDriver(drivers[1]);
                }
              }}
              className={`hidden sm:flex px-3 py-1 rounded-lg font-semibold transition cursor-pointer items-center gap-1.5 ${
                currentRole === 'driver' && currentDriver?.id === 'DRV02'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>ड्राइवर: सुरेश (GJ-27-T-1002)</span>
            </button>

            <button
              onClick={() => {
                setCurrentRole('owner');
                setCurrentDriver(null);
              }}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                currentRole === 'owner'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>मालिक डैशबोर्ड (26 ट्रक)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentRole === 'driver' && currentDriver && (
          <DriverPortal
            driver={currentDriver}
            onSaveTrip={handleSaveTrip}
            driverTrips={currentDriverTrips}
            onViewReceipt={(trip) => setSelectedReceiptTrip(trip)}
          />
        )}

        {currentRole === 'owner' && (
          <OwnerDashboard
            trips={trips}
            vehicles={vehicles}
            drivers={drivers}
            onDeleteTrip={handleDeleteTrip}
            onReassignDriver={handleReassignDriver}
            onViewReceipt={(trip) => setSelectedReceiptTrip(trip)}
            onAddNewTrip={handleSaveTrip}
          />
        )}

        {/* Guest View if logged out */}
        {!currentRole && (
          <div className="max-w-md mx-auto my-12 p-6 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
              <Truck className="w-9 h-9" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">स्वामी ट्रांसपोर्ट पोर्टल</h2>
              <p className="text-xs text-slate-400 mt-1">
                कृपया आगे बढ़ने के लिए अपनी भूमिका चुनें
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => handleOpenLogin('driver')}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>ड्राइवर मोबाइल पोर्टल में जाएं</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleOpenLogin('owner')}
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>मालिक / एडमिन डैशबोर्ड खोलें</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © 2026 स्वामी ट्रांसपोर्ट कंपनी (Swami Transport Co.) · 26 ट्रकों का पूर्ण डिजिटल हिसाब
          </span>
          <span className="text-slate-400 font-medium">
            सूरत · अहमदाबाद · मुम्बई · दिल्ली · इंदौर
          </span>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        drivers={drivers}
        initialRole={loginInitialRole}
        onLoginOwner={handleLoginOwner}
        onLoginDriver={handleLoginDriver}
      />

      {/* Printable Receipt & Photo Modal */}
      <TripReceiptModal
        trip={selectedReceiptTrip}
        onClose={() => setSelectedReceiptTrip(null)}
      />

      {/* Reset Data Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">सैंपल डेटा रीसेट करें?</h3>
              <p className="text-xs text-slate-400 mt-1">
                सभी 26 गाड़ियां, 26 ड्राइवर और 5 डिफ़ॉल्ट ट्रिप एंट्रीज पुनः लोड हो जाएंगी।
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition cursor-pointer"
              >
                रद्द करें
              </button>
              <button
                type="button"
                onClick={handleResetData}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-semibold transition shadow cursor-pointer"
              >
                हाँ, रीसेट करें
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
