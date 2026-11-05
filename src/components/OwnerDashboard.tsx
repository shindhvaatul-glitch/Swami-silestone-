import React, { useState, useMemo } from 'react';
import {
  Truck,
  Download,
  Filter,
  FileSpreadsheet,
  Users,
  Calendar,
  Search,
  Eye,
  Trash2,
  FileText,
  Plus,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Receipt,
  Share2,
  Sparkles,
  Camera,
  Loader2,
} from 'lucide-react';
import { Driver, TripEntry, Vehicle } from '../types';
import {
  computeFleetSummary,
  formatINR,
  formatDate,
  generateLedgerCSV,
  generateWhatsAppMessage,
} from '../utils/calculator';

interface OwnerDashboardProps {
  trips: TripEntry[];
  vehicles: Vehicle[];
  drivers: Driver[];
  onDeleteTrip: (tripId: string) => void;
  onReassignDriver: (plate: string, driverId: string, driverName: string) => void;
  onViewReceipt: (trip: TripEntry) => void;
  onAddNewTrip: (trip: TripEntry) => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  trips,
  vehicles,
  drivers,
  onDeleteTrip,
  onReassignDriver,
  onViewReceipt,
  onAddNewTrip,
}) => {
  // Navigation Sub-Tabs
  const [activeTab, setActiveTab] = useState<'ledger' | 'fleet' | 'drivers' | 'new_trip'>('ledger');

  // Filters for Master Ledger
  const [filterVehicle, setFilterVehicle] = useState<string>('all');
  const [filterFromDate, setFilterFromDate] = useState<string>('');
  const [filterToDate, setFilterToDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Delete Confirmation Modal State
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);

  // Driver Assignment Manager Modal State
  const [editingVehiclePlate, setEditingVehiclePlate] = useState<string | null>(null);
  const [selectedDriverForAssign, setSelectedDriverForAssign] = useState<string>(drivers[0]?.id || '');

  // Manual Trip Entry State (Owner adding a trip for any vehicle)
  const [manualPlate, setManualPlate] = useState<string>(vehicles[0]?.plateNumber || 'GJ-27-T-1001');
  const [manualRouteFrom, setManualRouteFrom] = useState('');
  const [manualRouteTo, setManualRouteTo] = useState('');
  const [manualWeightMT, setManualWeightMT] = useState('');
  const [manualAdvance, setManualAdvance] = useState('');
  const [manualBhatta, setManualBhatta] = useState('');
  const [manualUnloading, setManualUnloading] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [manualSuccessMsg, setManualSuccessMsg] = useState(false);
  const [ownerIsScanning, setOwnerIsScanning] = useState(false);
  const [ownerScanMsg, setOwnerScanMsg] = useState<string | null>(null);

  const handleOwnerPhotoScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOwnerIsScanning(true);
    setOwnerScanMsg(null);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64Data = ev.target?.result as string;
      try {
        const response = await fetch('/api/scan-bilty', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64Data }),
        });
        const res = await response.json();
        if (res.success && res.data) {
          const d = res.data;
          if (d.routeFrom) setManualRouteFrom(d.routeFrom);
          if (d.routeTo) setManualRouteTo(d.routeTo);
          if (d.weightMT) setManualWeightMT(String(d.weightMT));
          if (d.unloadingCharge) setManualUnloading(String(d.unloadingCharge));
          if (d.driverBhatta) setManualBhatta(String(d.driverBhatta));
          if (d.notes) setManualNotes(d.notes);
          if (d.vehiclePlate) {
            const foundV = vehicles.find((v) => v.plateNumber === d.vehiclePlate);
            if (foundV) setManualPlate(foundV.plateNumber);
          }
          setOwnerScanMsg('✅ पर्ची से रूट, वज़न व खर्चे स्वतः भर गए हैं! कृपया एडवांस शिलक दर्ज करें।');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setOwnerIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleOwnerDemoScan = () => {
    setOwnerIsScanning(true);
    setTimeout(() => {
      setManualRouteFrom('अहमदाबाद (साणंद GIDC)');
      setManualRouteTo('दिल्ली (संजय गांधी ट्रांसपोर्ट नगर)');
      setManualWeightMT('32.0');
      setManualBhatta('4000');
      setManualUnloading('1800');
      setManualNotes('ऑटो पार्ट्स 45 पैलेट (AI स्कैन द्वारा)');
      setOwnerIsScanning(false);
      setOwnerScanMsg('✅ डेमो बिल्टी का डाटा स्वतः भर गया! कृपया मिली शिलक / एडवांस भरें।');
    }, 1000);
  };

  // Fleet Metrics (all trips)
  const overallSummary = useMemo(() => computeFleetSummary(trips), [trips]);

  // Filtered trips for Master Ledger
  const filteredTrips = useMemo(() => {
    return trips.filter((t) => {
      // Vehicle filter
      if (filterVehicle !== 'all' && t.vehiclePlate !== filterVehicle) return false;

      // Date range filter
      if (filterFromDate && t.date < filterFromDate) return false;
      if (filterToDate && t.date > filterToDate) return false;

      // Search query (driver, route, or trip id)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesPlate = t.vehiclePlate.toLowerCase().includes(query);
        const matchesDriver = t.driverName.toLowerCase().includes(query);
        const matchesRoute = `${t.routeFrom} ${t.routeTo}`.toLowerCase().includes(query);
        const matchesId = t.id.toLowerCase().includes(query);
        if (!matchesPlate && !matchesDriver && !matchesRoute && !matchesId) return false;
      }

      return true;
    });
  }, [trips, filterVehicle, filterFromDate, filterToDate, searchQuery]);

  // Filtered Summary
  const filteredSummary = useMemo(() => computeFleetSummary(filteredTrips), [filteredTrips]);

  // Download CSV Report
  const handleDownloadCSV = () => {
    const csvContent = generateLedgerCSV(filteredTrips);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp = new Date().toISOString().split('T')[0];
    link.href = url;
    link.setAttribute('download', `स्वामी_ट्रांसपोर्ट_लेजर_${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reassign Driver Submit
  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehiclePlate) return;
    const targetDriver = drivers.find((d) => d.id === selectedDriverForAssign);
    if (!targetDriver) return;

    onReassignDriver(editingVehiclePlate, targetDriver.id, targetDriver.name);
    setEditingVehiclePlate(null);
  };

  // Owner Manual Trip Submit
  const handleManualTripSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const assignedVehicle = vehicles.find((v) => v.plateNumber === manualPlate);
    const driverId = assignedVehicle?.assignedDriverId || 'DRV01';
    const driverName = assignedVehicle?.assignedDriverName || 'ड्राइवर';

    const adv = Number(manualAdvance) || 0;
    const bhatta = Number(manualBhatta) || 0;
    const unloading = Number(manualUnloading) || 0;
    const totalExp = bhatta + unloading;
    const net = adv - totalExp;

    const newTrip: TripEntry = {
      id: `TRIP-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      vehiclePlate: manualPlate,
      driverId,
      driverName,
      routeFrom: manualRouteFrom.trim(),
      routeTo: manualRouteTo.trim(),
      weightMT: Number(manualWeightMT) || 0,
      advanceShilak: adv,
      driverBhatta: bhatta,
      unloadingCharge: unloading,
      pettyExpenses: [],
      totalPettyExpenses: 0,
      totalExpenses: totalExp,
      netShilak: net,
      notes: manualNotes.trim() ? `(मालिक द्वारा दर्ज) ${manualNotes.trim()}` : '(मालिक द्वारा दर्ज)',
      createdAt: new Date().toISOString(),
    };

    onAddNewTrip(newTrip);
    setManualSuccessMsg(true);
    setManualRouteFrom('');
    setManualRouteTo('');
    setManualWeightMT('');
    setManualAdvance('');
    setManualBhatta('');
    setManualUnloading('');
    setManualNotes('');
    setTimeout(() => setManualSuccessMsg(false), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6">
      {/* OWNER BANNER & NAVIGATION BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
              मालिक कंट्रोल पैनल
            </span>
            <span className="text-xs text-slate-400">कुल गाड़ियां: {vehicles.length}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            फ्लीट प्रबंधन व मास्टर लेजर
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            सभी 26 ट्रकों का दैनिक हिसाब, एडवांस शिलक, खर्चे और ड्राइवर आवंटन
          </p>
        </div>

        {/* View Mode Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl self-start md:self-auto">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'ledger'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>मास्टर लेजर</span>
          </button>

          <button
            onClick={() => setActiveTab('fleet')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'fleet'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>26 ट्रकों का सारांश</span>
          </button>

          <button
            onClick={() => setActiveTab('drivers')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'drivers'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>गाड़ी-ड्राइवर आवंटन</span>
          </button>

          <button
            onClick={() => setActiveTab('new_trip')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'new_trip'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>+ नयी एंट्री</span>
          </button>
        </div>
      </div>

      {/* 5 TOP FLEET METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Trips */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>कुल ट्रिप्स</span>
            <Truck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white mt-1">
            {overallSummary.totalTrips}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">26 गाड़ियों में से</span>
        </div>

        {/* Total Advance Shilak */}
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-amber-300 text-xs font-semibold">
            <span>कुल एडवांस शिलक</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-400 mt-1">
            {formatINR(overallSummary.totalAdvance)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">रोकड़ दी गई</span>
        </div>

        {/* Total Bhatta & Unloading */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-300 text-xs">
            <span>अनलोडिंग व भत्ता</span>
            <Receipt className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-200 mt-1">
            {formatINR(overallSummary.totalBhatta + overallSummary.totalUnloading)}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">प्राथमिक खर्चे</span>
        </div>

        {/* Total Other Expenses */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-300 text-xs">
            <span>अन्य अतिरिक्त खर्चे</span>
            <Receipt className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-300 mt-1">
            {formatINR(overallSummary.totalPettyExpenses)}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">टोल, यूरिया, रिपेयर आदि</span>
        </div>

        {/* Net Remaining Shilak / Company Balance */}
        <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-indigo-950/70 to-slate-900 border border-indigo-500/40 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-indigo-300 text-xs font-bold">
            <span>कुल शेष शिलक</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
            {formatINR(overallSummary.netCompanyBalance)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">ड्राइवरों के पास शुद्ध बाकी</span>
        </div>
      </div>

      {/* TAB 1: MASTER LEDGER TABLE */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          {/* Filters Bar & Excel Download */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">लेजर फ़िल्टर व खोज</h3>
                <span className="text-xs text-slate-400">
                  (दिख रहे: {filteredTrips.length} रिकॉर्ड)
                </span>
              </div>

              {/* Excel / CSV Export Button */}
              <button
                onClick={handleDownloadCSV}
                className="self-start lg:self-auto py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-700/20 text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer"
                title="Excel / CSV रिपोर्ट डाउनलोड करें"
              >
                <Download className="w-4 h-4" />
                <span>Excel / CSV रिपोर्ट डाउनलोड करें</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Vehicle Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  गाड़ी नंबर चुनें
                </label>
                <select
                  value={filterVehicle}
                  onChange={(e) => setFilterVehicle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">सभी 26 गाड़ियां</option>
                  {vehicles.map((v) => (
                    <option key={v.plateNumber} value={v.plateNumber}>
                      {v.plateNumber} ({v.assignedDriverName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date From */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  कब से (From Date)
                </label>
                <input
                  type="date"
                  value={filterFromDate}
                  onChange={(e) => setFilterFromDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  कब तक (To Date)
                </label>
                <input
                  type="date"
                  value={filterToDate}
                  onChange={(e) => setFilterToDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Search Box */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  ड्राइवर / रूट खोजें
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="उदा. रमेश, सूरत, मुम्बई..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Search className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5" />
                </div>
              </div>
            </div>

            {/* Clear Filters helper */}
            {(filterVehicle !== 'all' || filterFromDate || filterToDate || searchQuery) && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-xs">
                <span className="text-amber-400 font-medium">फ़िल्टर सक्रिय है</span>
                <button
                  onClick={() => {
                    setFilterVehicle('all');
                    setFilterFromDate('');
                    setFilterToDate('');
                    setSearchQuery('');
                  }}
                  className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>फ़िल्टर हटाएं</span>
                </button>
              </div>
            )}
          </div>

          {/* Master Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">तारीख व आईडी</th>
                    <th className="py-3 px-4">गाड़ी व ड्राइवर</th>
                    <th className="py-3 px-4">रूट व वज़न</th>
                    <th className="py-3 px-4 text-right">एडवांस शिलक</th>
                    <th className="py-3 px-4 text-right">अनलोडिंग+भत्ता</th>
                    <th className="py-3 px-4 text-right">अन्य खर्चे</th>
                    <th className="py-3 px-4 text-right">कुल खर्चा</th>
                    <th className="py-3 px-4 text-right">बचा हुआ शिलक</th>
                    <th className="py-3 px-4 text-center">दस्तावेज़</th>
                    <th className="py-3 px-4 text-center">कार्रवाई</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredTrips.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        <Truck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <p className="font-medium">कोई ट्रिप रिकॉर्ड नहीं मिला।</p>
                        <p className="text-xs text-slate-500 mt-1">
                          कृपया फ़िल्टर बदलें या नयी ट्रिप दर्ज करें।
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredTrips.map((trip) => (
                      <tr key={trip.id} className="hover:bg-slate-800/40 transition">
                        {/* Date & ID */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-amber-400 block">
                            {trip.id}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {formatDate(trip.date)}
                          </span>
                        </td>

                        {/* Vehicle & Driver */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-white text-sm block">
                            {trip.vehiclePlate}
                          </span>
                          <span className="text-xs text-slate-400 block">
                            {trip.driverName}
                          </span>
                        </td>

                        {/* Route & Weight */}
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-200 flex items-center gap-1">
                            <span>{trip.routeFrom}</span>
                            <ArrowRight className="w-3 h-3 text-slate-500" />
                            <span>{trip.routeTo}</span>
                          </div>
                          <span className="text-[11px] text-emerald-400 font-semibold block mt-0.5">
                            {trip.weightMT} MT
                          </span>
                        </td>

                        {/* Advance Received */}
                        <td className="py-3.5 px-4 text-right font-bold text-amber-400">
                          {formatINR(trip.advanceShilak)}
                        </td>

                        {/* Bhatta & Unloading */}
                        <td className="py-3.5 px-4 text-right text-slate-300">
                          {formatINR(trip.driverBhatta + trip.unloadingCharge)}
                        </td>

                        {/* Other Expenses */}
                        <td className="py-3.5 px-4 text-right text-slate-300">
                          {formatINR(trip.totalPettyExpenses)}
                          {trip.pettyExpenses && trip.pettyExpenses.length > 0 && (
                            <span className="text-[10px] text-slate-500 block">
                              ({trip.pettyExpenses.length} मदें)
                            </span>
                          )}
                        </td>

                        {/* Total Expenses */}
                        <td className="py-3.5 px-4 text-right font-bold text-rose-300">
                          {formatINR(trip.totalExpenses)}
                        </td>

                        {/* Net Shilak */}
                        <td className="py-3.5 px-4 text-right">
                          <span
                            className={`font-black text-sm font-mono ${
                              trip.netShilak >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {formatINR(trip.netShilak)}
                          </span>
                        </td>

                        {/* Documents / Photos */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {trip.biltyPhoto ? (
                              <button
                                onClick={() => onViewReceipt(trip)}
                                className="w-8 h-8 rounded bg-slate-800 border border-slate-700 overflow-hidden hover:scale-110 transition cursor-pointer"
                                title="बिल्टी (LR) देखें"
                              >
                                <img
                                  src={trip.biltyPhoto}
                                  alt="LR"
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-600">-</span>
                            )}
                            {trip.invoicePhoto ? (
                              <button
                                onClick={() => onViewReceipt(trip)}
                                className="w-8 h-8 rounded bg-slate-800 border border-slate-700 overflow-hidden hover:scale-110 transition cursor-pointer"
                                title="इनवॉइस देखें"
                              >
                                <img
                                  src={trip.invoicePhoto}
                                  alt="Invoice"
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ) : null}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => onViewReceipt(trip)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition cursor-pointer"
                              title="कच्चा चिट्ठा पर्ची देखें / प्रिंट करें"
                            >
                              <FileText className="w-4 h-4 text-amber-400" />
                            </button>
                            <button
                              onClick={() => {
                                const msg = generateWhatsAppMessage(trip);
                                window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                              }}
                              className="p-1.5 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-400 rounded-lg transition cursor-pointer"
                              title="व्हाट्सएप पर शेयर करें"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteCandidateId(trip.id)}
                              className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 rounded-lg transition cursor-pointer"
                              title="एंट्री डिलीट करें"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Filtered Totals Footer */}
            {filteredTrips.length > 0 && (
              <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
                <span className="text-slate-400">
                  कुल प्रविष्टियां:{' '}
                  <strong className="text-white">{filteredTrips.length}</strong>
                </span>
                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                  <div>
                    <span className="text-slate-400">कुल एडवांस: </span>
                    <strong className="text-amber-400">{formatINR(filteredSummary.totalAdvance)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">कुल खर्चे: </span>
                    <strong className="text-rose-400">{formatINR(filteredSummary.totalExpenses)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">शुद्ध बाकी: </span>
                    <strong
                      className={
                        filteredSummary.netCompanyBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }
                    >
                      {formatINR(filteredSummary.netCompanyBalance)}
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: 26 TRUCKS FLEET SUMMARY GRID */}
      {activeTab === 'fleet' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-white text-lg">26 गाड़ियों का बेड़ा (Fleet Overview)</h3>
              <p className="text-xs text-slate-400">
                प्रत्येक ट्रक की वर्तमान स्थिति, सक्रिय फेरे और खाता लेजर
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {vehicles.map((v) => {
              const truckTrips = trips.filter((t) => t.vehiclePlate === v.plateNumber);
              const summary = computeFleetSummary(truckTrips);

              return (
                <div
                  key={v.plateNumber}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 shadow-lg transition flex flex-col justify-between"
                >
                  <div>
                    {/* Header with Truck Index & Plate */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-bold">
                        #{v.truckIndex}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          v.status === 'in_trip'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {v.status === 'in_trip' ? 'रास्ते में / ऑन ट्रिप' : 'उपलब्ध / स्टैंडबाय'}
                      </span>
                    </div>

                    <h4 className="text-lg font-black font-mono text-amber-400 tracking-wider">
                      {v.plateNumber}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{v.model}</p>

                    {/* Driver details */}
                    <div className="mt-3 p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] text-slate-500 block uppercase font-semibold">
                        आवंटित ड्राइवर
                      </span>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-xs font-bold text-white">{v.assignedDriverName}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {v.assignedDriverId}
                        </span>
                      </div>
                    </div>

                    {/* Mini Stats */}
                    <div className="grid grid-cols-3 gap-2 text-center mt-3 text-xs">
                      <div className="bg-slate-950/60 p-2 rounded-lg">
                        <span className="text-[10px] text-slate-500 block">ट्रिप्स</span>
                        <span className="font-bold text-white">{truckTrips.length}</span>
                      </div>
                      <div className="bg-slate-950/60 p-2 rounded-lg">
                        <span className="text-[10px] text-slate-500 block">एडवांस</span>
                        <span className="font-bold text-amber-400">
                          {formatINR(summary.totalAdvance)}
                        </span>
                      </div>
                      <div className="bg-slate-950/60 p-2 rounded-lg">
                        <span className="text-[10px] text-slate-500 block">खर्चे</span>
                        <span className="font-bold text-rose-400">
                          {formatINR(summary.totalExpenses)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setFilterVehicle(v.plateNumber);
                        setActiveTab('ledger');
                      }}
                      className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
                      <span>लेजर देखें</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditingVehiclePlate(v.plateNumber);
                        setSelectedDriverForAssign(v.assignedDriverId);
                      }}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition cursor-pointer"
                      title="ड्राइवर बदलें"
                    >
                      <Users className="w-4 h-4 text-emerald-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: DRIVER-VEHICLE ASSIGNMENT MANAGER */}
      {activeTab === 'drivers' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5">
          <div>
            <h3 className="font-bold text-white text-lg">गाड़ी व ड्राइवर लिंकिंग प्रबंधन</h3>
            <p className="text-xs text-slate-400">
              मालिक किसी भी समय किसी भी ट्रक का ड्राइवर बदल सकता है। ट्रक का पुराना इतिहास सुरक्षित रहेगा।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vehicles.map((v) => (
              <div
                key={v.plateNumber}
                className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-amber-400 text-sm">
                      {v.plateNumber}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">#{v.truckIndex}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    वर्तमान ड्राइवर:{' '}
                    <span className="font-bold text-emerald-400">{v.assignedDriverName}</span>{' '}
                    <span className="font-mono text-slate-500">({v.assignedDriverId})</span>
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingVehiclePlate(v.plateNumber);
                    setSelectedDriverForAssign(v.assignedDriverId);
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer shrink-0"
                >
                  ड्राइवर बदलें
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: MANUAL TRIP ENTRY BY OWNER */}
      {activeTab === 'new_trip' && (
        <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-lg">मालिक द्वारा सीधी ट्रिप प्रविष्टि</h3>
            <p className="text-xs text-slate-400">
              यदि ड्राइवर के पास स्मार्टफोन नहीं है, तो मालिक यहाँ से किसी भी गाड़ी की एंट्री कर सकता है।
            </p>
          </div>

          {manualSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>ट्रिप सफलता के साथ लेजर में दर्ज हो गई!</span>
            </div>
          )}

          {/* AI Scanner for Owner */}
          <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white">स्मार्ट AI बिल्टी / पर्ची ऑटो-फिल</span>
            </div>
            <p className="text-[11px] text-slate-300">
              बिल्टी या पर्ची की फोटो अपलोड करें — रूट, वज़न व खर्चे स्वतः भर जाएंगे। फिर केवल शिलक (एडवांस) डालें।
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <label className="py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow">
                {ownerIsScanning ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>स्कैनिंग जारी है...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5" />
                    <span>फोटो अपलोड / स्कैन करें</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  disabled={ownerIsScanning}
                  onChange={handleOwnerPhotoScan}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={handleOwnerDemoScan}
                disabled={ownerIsScanning}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer border border-slate-700"
              >
                <span>⚡ डेमो बिल्टी टेस्ट</span>
              </button>
            </div>
            {ownerScanMsg && (
              <p className="text-xs text-emerald-300 font-semibold bg-emerald-950/60 p-2 rounded border border-emerald-500/30">
                {ownerScanMsg}
              </p>
            )}
          </div>

          <form onSubmit={handleManualTripSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                गाड़ी नंबर चुनें
              </label>
              <select
                value={manualPlate}
                onChange={(e) => setManualPlate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm"
              >
                {vehicles.map((v) => (
                  <option key={v.plateNumber} value={v.plateNumber}>
                    {v.plateNumber} - {v.assignedDriverName}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  रूट कहाँ से (Origin)
                </label>
                <input
                  type="text"
                  value={manualRouteFrom}
                  onChange={(e) => setManualRouteFrom(e.target.value)}
                  placeholder="उदा. सूरत"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  रूट कहाँ तक (Destination)
                </label>
                <input
                  type="text"
                  value={manualRouteTo}
                  onChange={(e) => setManualRouteTo(e.target.value)}
                  placeholder="उदा. मुम्बई"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  वज़न (MT टन)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={manualWeightMT}
                  onChange={(e) => setManualWeightMT(e.target.value)}
                  placeholder="28.5"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  एडवांस शिलक (₹)
                </label>
                <input
                  type="number"
                  value={manualAdvance}
                  onChange={(e) => setManualAdvance(e.target.value)}
                  placeholder="15000"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  भत्ता + अनलोडिंग (₹)
                </label>
                <input
                  type="number"
                  value={manualBhatta}
                  onChange={(e) => setManualBhatta(e.target.value)}
                  placeholder="3500"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                रिमार्क / नोट्स
              </label>
              <input
                type="text"
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                placeholder="पार्टी का नाम या विशेष विवरण"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition cursor-pointer"
            >
              लेजर में ट्रिप दर्ज करें
            </button>
          </form>
        </div>
      )}

      {/* REASSIGN DRIVER MODAL */}
      {editingVehiclePlate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-lg">गाड़ी के लिए ड्राइवर बदलें</h3>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block">गाड़ी नंबर:</span>
              <span className="text-base font-black font-mono text-amber-400">
                {editingVehiclePlate}
              </span>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  नया ड्राइवर चुनें
                </label>
                <select
                  value={selectedDriverForAssign}
                  onChange={(e) => setSelectedDriverForAssign(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm"
                >
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.id}) - वर्तमान गाड़ी: {d.assignedVehiclePlate}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingVehiclePlate(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition shadow cursor-pointer"
                >
                  ड्राइवर असाइन करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteCandidateId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">क्या आप यह एंट्री हटाना चाहते हैं?</h3>
              <p className="text-xs text-slate-400 mt-1">
                ट्रिप आईडी <strong className="text-amber-400">{deleteCandidateId}</strong> हमेशा के
                लिए लेजर से हटा दी जाएगी।
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCandidateId(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition cursor-pointer"
              >
                रद्द करें
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteTrip(deleteCandidateId);
                  setDeleteCandidateId(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-semibold transition shadow cursor-pointer"
              >
                हाँ, डिलीट करें
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
