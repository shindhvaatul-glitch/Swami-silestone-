import React, { useState } from 'react';
import { Truck, ShieldCheck, User, KeyRound, X, AlertCircle } from 'lucide-react';
import { Driver } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  drivers: Driver[];
  initialRole?: 'owner' | 'driver';
  onLoginOwner: (pin: string) => boolean;
  onLoginDriver: (driverId: string, pin: string) => boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  drivers,
  initialRole = 'driver',
  onLoginOwner,
  onLoginDriver,
}) => {
  const [activeTab, setActiveTab] = useState<'driver' | 'owner'>(initialRole);
  const [selectedDriverId, setSelectedDriverId] = useState<string>(drivers[0]?.id || 'DRV01');
  const [driverPin, setDriverPin] = useState<string>('1111');
  const [ownerPin, setOwnerPin] = useState<string>('1234');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedDriver = drivers.find((d) => d.id === selectedDriverId) || drivers[0];

  const handleDriverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const success = onLoginDriver(selectedDriverId, driverPin);
    if (!success) {
      setErrorMsg('गलत ड्राइवर पिन! कृपया सही 4-अंकों का पिन डालें (डिफ़ॉल्ट पिन: 1111)');
    } else {
      onClose();
    }
  };

  const handleOwnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const success = onLoginOwner(ownerPin);
    if (!success) {
      setErrorMsg('गलत मालिक पिन! कृपया सही पिन डालें (डिफ़ॉल्ट पिन: 1234)');
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base sm:text-lg">सिस्टम लॉगिन पोर्टल</h3>
              <p className="text-xs text-slate-400">स्वामी ट्रांसपोर्ट - कृपया अपनी भूमिका चुनें</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-950/60 m-4 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setActiveTab('driver');
              setErrorMsg(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
              activeTab === 'driver'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <User className="w-4 h-4" />
            <span>ड्राइवर लॉगिन</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('owner');
              setErrorMsg(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
              activeTab === 'owner'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>मालिक / एडमिन</span>
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mx-4 mb-3 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab 1: Driver Form */}
        {activeTab === 'driver' && (
          <form onSubmit={handleDriverSubmit} className="p-4 sm:p-5 pt-0 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ड्राइवर का नाम व आईडी चुनें
              </label>
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              >
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.id}) - गाड़ी: {d.assignedVehiclePlate}
                  </option>
                ))}
              </select>
            </div>

            {/* Vehicle Locked Banner */}
            {selectedDriver && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block">आपकी अधिकृत गाड़ी:</span>
                  <span className="text-emerald-300 font-bold font-mono text-sm">
                    {selectedDriver.assignedVehiclePlate}
                  </span>
                </div>
                <span className="text-[11px] px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 font-medium">
                  🔒 ऑटो-लॉक
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ड्राइवर पिन (4 अंक)
              </label>
              <div className="relative">
                <input
                  type="password"
                  maxLength={6}
                  value={driverPin}
                  onChange={(e) => setDriverPin(e.target.value)}
                  placeholder="डिफ़ॉल्ट पिन: 1111"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-3 text-white text-base tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  required
                />
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1 text-center">
                डेमो के लिए पिन: <span className="font-mono text-emerald-400 font-bold">1111</span>
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-700/20 transition cursor-pointer text-base flex items-center justify-center gap-2"
            >
              <span>ड्राइवर पोर्टल में प्रवेश करें</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedDriverId('DRV01');
                setDriverPin('1111');
                onLoginDriver('DRV01', '1111');
                onClose();
              }}
              className="w-full py-2 bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs rounded-lg border border-slate-700 transition cursor-pointer"
            >
              ⚡ एक-क्लिक से डेमो ड्राइवर (रमेश भाई) लॉगिन करें
            </button>
          </form>
        )}

        {/* Tab 2: Owner Form */}
        {activeTab === 'owner' && (
          <form onSubmit={handleOwnerSubmit} className="p-4 sm:p-5 pt-0 space-y-4">
            <div className="p-3.5 bg-indigo-950/40 border border-indigo-500/30 rounded-xl text-xs text-indigo-200">
              <p className="font-semibold mb-1">मालिक नियंत्रण कक्ष:</p>
              <p className="text-slate-400">
                यहाँ से आप 26 ट्रकों का लेजर, सभी ड्राइवरों का हिसाब, और एक्सेल रिपोर्ट देख सकेंगे।
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                मालिक पिन / पासवर्ड
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={ownerPin}
                  onChange={(e) => setOwnerPin(e.target.value)}
                  placeholder="मालिक पिन (जैसे 1234)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-3 text-white text-base tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  required
                />
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1 text-center">
                डिफ़ॉल्ट एडमिन पिन: <span className="font-mono text-indigo-400 font-bold">1234</span> या <span className="font-mono text-indigo-400 font-bold">swami123</span>
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-700/20 transition cursor-pointer text-base flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>मालिक डैशबोर्ड खोलें</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOwnerPin('1234');
                onLoginOwner('1234');
                onClose();
              }}
              className="w-full py-2 bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs rounded-lg border border-slate-700 transition cursor-pointer"
            >
              ⚡ एक-क्लिक से मालिक (पिन: 1234) लॉगिन करें
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
