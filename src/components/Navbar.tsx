import React from 'react';
import { Truck, ShieldCheck, User, LogOut, RotateCcw } from 'lucide-react';
import { Driver } from '../types';

interface NavbarProps {
  currentRole: 'owner' | 'driver' | null;
  currentDriver: Driver | null;
  onLogout: () => void;
  onOpenLogin: (role?: 'owner' | 'driver') => void;
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  currentDriver,
  onLogout,
  onOpenLogin,
  onResetData,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Company Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <Truck className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2 font-['Hind',sans-serif]">
                  स्वामी ट्रांसपोर्ट मैनेजर
                </h1>
                <span className="hidden md:inline-block text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  26 गाड़ियों का बेड़ा
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                डिजिटल कच्चा चिट्ठा व फ्लीट लेजर सिस्टम
              </p>
            </div>
          </div>

          {/* Right Action & Role Pill */}
          <div className="flex items-center gap-2 sm:gap-4">
            {currentRole === 'owner' && (
              <div className="flex items-center gap-2 bg-indigo-950/80 border border-indigo-500/40 px-3 py-1.5 rounded-lg text-indigo-200 text-xs sm:text-sm">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span className="font-semibold">मालिक / एडमिन</span>
              </div>
            )}

            {currentRole === 'driver' && currentDriver && (
              <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/40 px-3 py-1.5 rounded-lg text-emerald-200 text-xs sm:text-sm">
                <User className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="font-bold">{currentDriver.name}</span>
                  <span className="text-[10px] text-emerald-300 block -mt-0.5 font-mono">
                    {currentDriver.assignedVehiclePlate}
                  </span>
                </div>
              </div>
            )}

            {currentRole ? (
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 text-xs sm:text-sm px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg border border-slate-700 transition cursor-pointer"
                title="लॉगआउट करें"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span className="hidden sm:inline">लॉगआउट</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenLogin('driver')}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs sm:text-sm font-semibold transition shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  ड्राइवर लॉगिन
                </button>
                <button
                  onClick={() => onOpenLogin('owner')}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs sm:text-sm font-semibold transition shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  मालिक लॉगिन
                </button>
              </div>
            )}

            <button
              onClick={onResetData}
              title="सैंपल डेटा रीसेट करें"
              className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition text-xs flex items-center cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
