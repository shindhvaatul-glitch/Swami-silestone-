import React, { useState, useId, useRef } from 'react';
import {
  Truck,
  Plus,
  Trash2,
  Camera,
  Share2,
  CheckCircle2,
  Lock,
  ArrowRight,
  FileText,
  IndianRupee,
  Scale,
  MapPin,
  Calendar,
  Sparkles,
  Loader2,
  AlertCircle,
  HelpCircle,
  Upload,
} from 'lucide-react';
import { Driver, PettyExpense, TripEntry } from '../types';
import { calculateTripTotals, formatINR, generateWhatsAppMessage } from '../utils/calculator';

interface DriverPortalProps {
  driver: Driver;
  onSaveTrip: (trip: TripEntry) => void;
  driverTrips: TripEntry[];
  onViewReceipt: (trip: TripEntry) => void;
}

const COMMON_EXPENSE_NAMES = [
  'टोल टैक्स (फास्टैग / कैश)',
  'पंचर / टायर रिपेयर',
  'यूरिया / AdBlue खर्च',
  'पुलिस / आरटीओ एंट्री',
  'चाय-नाश्ता / खाना',
  'कांटा पर्ची (धर्मकांटा)',
  'छोटा रिपेयर / ग्रीसिंग',
  'पार्टी लेबर / हमाली',
  'अन्य फुटकर खर्चा',
];

export const DriverPortal: React.FC<DriverPortalProps> = ({
  driver,
  onSaveTrip,
  driverTrips,
  onViewReceipt,
}) => {
  const biltyInputId = useId();
  const invoiceInputId = useId();
  const quickScannerInputId = useId();
  const advanceInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [routeFrom, setRouteFrom] = useState('');
  const [routeTo, setRouteTo] = useState('');
  const [weightMT, setWeightMT] = useState<string>('');
  const [advanceShilak, setAdvanceShilak] = useState<string>('');
  const [driverBhatta, setDriverBhatta] = useState<string>('');
  const [unloadingCharge, setUnloadingCharge] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Dynamic Petty Expenses
  const [pettyExpenses, setPettyExpenses] = useState<PettyExpense[]>([
    { id: 'exp-1', name: 'टोल टैक्स (फास्टैग / कैश)', amount: 0 },
  ]);

  // Document Photos (base64)
  const [biltyPhoto, setBiltyPhoto] = useState<string | null>(null);
  const [invoicePhoto, setInvoicePhoto] = useState<string | null>(null);

  // AI OCR Scanning State
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Success Notification
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);
  const [lastSavedTrip, setLastSavedTrip] = useState<TripEntry | null>(null);

  // Real-time calculation
  const calculations = calculateTripTotals(
    Number(advanceShilak) || 0,
    Number(driverBhatta) || 0,
    Number(unloadingCharge) || 0,
    pettyExpenses
  );

  // Dynamic Petty Expenses Handlers
  const addPettyRow = () => {
    setPettyExpenses((prev) => [
      ...prev,
      { id: `exp-${Date.now()}`, name: COMMON_EXPENSE_NAMES[0], amount: 0 },
    ]);
  };

  const removePettyRow = (id: string) => {
    setPettyExpenses((prev) => prev.filter((item) => item.id !== id));
  };

  const updatePettyRow = (id: string, field: 'name' | 'amount', value: string | number) => {
    setPettyExpenses((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            [field]: field === 'amount' ? Math.max(0, Number(value) || 0) : value,
          };
        }
        return item;
      })
    );
  };

  const [lastScannedPhoto, setLastScannedPhoto] = useState<string | null>(null);

  const cleanErrorMessage = (rawError: string): string => {
    if (!rawError) return 'फोटो से डाटा पढ़ने में दिक्कत हुई। कृपया विवरण स्वयं भरें।';
    if (
      rawError.includes('503') ||
      rawError.includes('high demand') ||
      rawError.includes('UNAVAILABLE') ||
      rawError.includes('temporarily')
    ) {
      return 'AI सर्वर पर इस समय भारी ट्रैफिक (High Demand) है। कृपया नीचे "दोबारा कोशिश करें" दबाएं या "⚡ डेमो बिल्टी टेस्ट करें" से आगे बढ़ें।';
    }
    if (rawError.includes('429') || rawError.includes('RESOURCE_EXHAUSTED')) {
      return 'AI सीमा समाप्त हो गई है। कृपया थोड़ी देर बाद पुनः प्रयास करें।';
    }
    if (rawError.startsWith('{') || rawError.length > 120) {
      return 'फोटो पढ़ने में तकनीकी समस्या आई। कृपया दोबारा प्रयास करें या विवरण स्वयं भरें।';
    }
    return rawError;
  };

  // AI OCR Scanner API Call
  const performAIScan = async (base64Data: string) => {
    setIsScanning(true);
    setScanMessage(null);
    setLastScannedPhoto(base64Data);

    try {
      const response = await fetch('/api/scan-bilty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: 'image/jpeg',
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        const d = result.data;

        // Auto-fill extracted values
        if (d.routeFrom) setRouteFrom(d.routeFrom);
        if (d.routeTo) setRouteTo(d.routeTo);
        if (d.weightMT) setWeightMT(String(d.weightMT));
        if (d.unloadingCharge) setUnloadingCharge(String(d.unloadingCharge));
        if (d.driverBhatta) setDriverBhatta(String(d.driverBhatta));
        if (d.notes) setNotes(d.notes);

        if (Array.isArray(d.pettyExpenses) && d.pettyExpenses.length > 0) {
          const mappedPetty: PettyExpense[] = d.pettyExpenses.map((p: any, idx: number) => ({
            id: `scan-exp-${Date.now()}-${idx}`,
            name: p.name || 'अन्य खर्चा',
            amount: Number(p.amount) || 0,
          }));
          setPettyExpenses(mappedPetty);
        }

        const successText = result.isFallback
          ? 'ℹ️ AI सर्वर व्यस्त होने के कारण बुनियादी ड्राफ्ट भर दिया गया है। कृपया विवरण जांचें और शिलक (एडवांस) हाथ से भरें।'
          : '✅ फोटो से रूट, वज़न व खर्चे स्वतः भर गए हैं! कृपया अब नीचे मिली हुई शिलक (एडवांस) हाथ से भरें।';

        setScanMessage({
          type: 'success',
          text: successText,
        });

        // Focus on advance shilak input
        setTimeout(() => {
          advanceInputRef.current?.focus();
          advanceInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 500);
      } else {
        setScanMessage({
          type: 'error',
          text: cleanErrorMessage(result.error),
        });
      }
    } catch (err: any) {
      console.error(err);
      setScanMessage({
        type: 'error',
        text: cleanErrorMessage(err?.message || ''),
      });
    } finally {
      setIsScanning(false);
    }
  };

  // Photo handlers (compress + trigger AI scan)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'bilty' | 'invoice' | 'quick_scanner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);

        if (type === 'bilty' || type === 'quick_scanner') {
          setBiltyPhoto(compressedBase64);
        } else {
          setInvoicePhoto(compressedBase64);
        }

        // Trigger AI scan
        performAIScan(compressedBase64);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Demo auto-fill test (simulates instant Bilty AI recognition)
  const handleDemoScan = () => {
    setIsScanning(true);
    setScanMessage(null);

    setTimeout(() => {
      setRouteFrom('सूरत (हजीरा स्टील प्लांट)');
      setRouteTo('मुम्बई (भिवंडी गोदाम)');
      setWeightMT('28.5');
      setDriverBhatta('2500');
      setUnloadingCharge('1200');
      setNotes('स्टील कॉइल 3 नग - LR संख्या #8921 (ऑटो-स्कैन)');
      setPettyExpenses([
        { id: `demo-1`, name: 'टोल टैक्स (फास्टैग / कैश)', amount: 3200 },
        { id: `demo-2`, name: 'यूरिया / AdBlue खर्च', amount: 950 },
        { id: `demo-3`, name: 'कांटा पर्ची (धर्मकांटा)', amount: 200 },
      ]);
      setIsScanning(false);
      setScanMessage({
        type: 'success',
        text: '✅ बिल्टी का सारा डाटा स्वतः भर गया! अब केवल मिली हुई शिलक (एडवांस रोकड़) दर्ज करें।',
      });

      setTimeout(() => {
        advanceInputRef.current?.focus();
        advanceInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }, 1200);
  };

  // Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!routeFrom.trim() || !routeTo.trim()) {
      alert('कृपया रूट भरें (कहाँ से और कहाँ तक)!');
      return;
    }

    const newTripId = `TRIP-${Date.now().toString().slice(-6)}`;
    const newTrip: TripEntry = {
      id: newTripId,
      date: date || new Date().toISOString().split('T')[0],
      vehiclePlate: driver.assignedVehiclePlate,
      driverId: driver.id,
      driverName: driver.name,
      routeFrom: routeFrom.trim(),
      routeTo: routeTo.trim(),
      weightMT: Number(weightMT) || 0,
      advanceShilak: Number(advanceShilak) || 0,
      driverBhatta: Number(driverBhatta) || 0,
      unloadingCharge: Number(unloadingCharge) || 0,
      pettyExpenses: pettyExpenses.filter((p) => p.amount > 0 || p.name.trim().length > 0),
      totalPettyExpenses: calculations.totalPettyExpenses,
      totalExpenses: calculations.totalExpenses,
      netShilak: calculations.netShilak,
      biltyPhoto: biltyPhoto,
      invoicePhoto: invoicePhoto,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    onSaveTrip(newTrip);
    setLastSavedTrip(newTrip);
    setSavedSuccessMsg(`ट्रिप नंबर ${newTripId} सफलतापूर्वक दर्ज हो गया!`);

    // Reset Form for next entry while preserving driver lock
    setRouteFrom('');
    setRouteTo('');
    setWeightMT('');
    setAdvanceShilak('');
    setDriverBhatta('');
    setUnloadingCharge('');
    setNotes('');
    setBiltyPhoto(null);
    setInvoicePhoto(null);
    setScanMessage(null);
    setPettyExpenses([{ id: `exp-${Date.now()}`, name: COMMON_EXPENSE_NAMES[0], amount: 0 }]);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // One-click WhatsApp Share
  const handleShareWhatsApp = (trip: TripEntry) => {
    const message = generateWhatsAppMessage(trip);
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-5">
      {/* Driver & Locked Vehicle Header Card */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Truck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-emerald-400 font-semibold">
                  चालक (ड्राइवर):
                </span>
                <span className="text-base font-bold text-white">{driver.name}</span>
                <span className="text-xs text-slate-400 font-mono">({driver.id})</span>
              </div>
              <p className="text-xs text-slate-400">
                फोन: <span className="font-mono text-slate-300">{driver.phone}</span>
              </p>
            </div>
          </div>

          {/* Locked Plate Tag */}
          <div className="bg-slate-950/80 border border-amber-500/40 rounded-xl px-4 py-2 flex items-center justify-between sm:justify-start gap-3">
            <div>
              <span className="text-[10px] text-amber-300 font-semibold block uppercase">
                गाड़ी नंबर (लॉक्ड)
              </span>
              <span className="text-lg font-black text-amber-400 tracking-wider font-mono">
                {driver.assignedVehiclePlate}
              </span>
            </div>
            <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400" title="यह गाड़ी आपके लिए लॉक है">
              <Lock className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* NEW: AI SMART BILTY & SLIP AUTO-SCANNER PROMPT */}
      <div className="bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-900 border-2 border-indigo-500/40 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3 relative overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base sm:text-lg">
                  स्मार्ट AI बिल्टी / पर्ची स्कैनर
                </h3>
                <span className="text-[10px] bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded-full font-bold">
                  ऑटो-फिल
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                बिल्टी या पर्ची की फोटो खींचें — <strong className="text-indigo-300">रूट, वज़न और खर्चे स्वतः भर जाएंगे</strong>! आपको केवल मिली शिलक हाथ से डालनी होगी।
              </p>
            </div>
          </div>
        </div>

        {/* AI Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <label
            htmlFor={quickScannerInputId}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-lg ${
              isScanning
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/40'
            }`}
          >
            {isScanning ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-indigo-300" />
                <span>फोटो से डाटा पढ़ा जा रहा है (AI स्कैनिंग)...</span>
              </>
            ) : (
              <>
                <Camera className="w-5 h-5" />
                <span>📸 बिल्टी की फोटो लें / अपलोड करें (ऑटो-फिल)</span>
              </>
            )}
            <input
              id={quickScannerInputId}
              type="file"
              accept="image/*"
              capture="environment"
              disabled={isScanning}
              onChange={(e) => handlePhotoUpload(e, 'quick_scanner')}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={handleDemoScan}
            disabled={isScanning}
            className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            title="यदि आपके पास पर्ची नहीं है तो 1-क्लिक से डेमो टेस्ट करें"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>⚡ डेमो बिल्टी टेस्ट करें</span>
          </button>
        </div>

        {/* Scan Status Toast / Banner */}
        {scanMessage && (
          <div
            className={`p-3.5 rounded-xl border text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in ${
              scanMessage.type === 'success'
                ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
                : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {scanMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold leading-relaxed">{scanMessage.text}</p>
              </div>
            </div>

            {scanMessage.type === 'error' && (
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                {lastScannedPhoto && (
                  <button
                    type="button"
                    onClick={() => performAIScan(lastScannedPhoto)}
                    disabled={isScanning}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>🔄 दोबारा कोशिश करें</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleDemoScan}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer"
                >
                  <span>⚡ डेमो डेटा भरें</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Success Banner if recently saved */}
      {savedSuccessMsg && lastSavedTrip && (
        <div className="p-4 sm:p-5 bg-emerald-950/70 border border-emerald-500/40 rounded-2xl shadow-lg animate-in fade-in space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <h4 className="font-bold text-emerald-300 text-base">{savedSuccessMsg}</h4>
                <p className="text-xs text-emerald-200/80">
                  मालिक को हिसाब भेजने के लिए नीचे दिए गए हरे बटन को दबाएं।
                </p>
              </div>
            </div>
            <button
              onClick={() => setSavedSuccessMsg(null)}
              className="text-xs text-emerald-400/80 hover:text-white px-2 py-1"
            >
              हटाएं
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => handleShareWhatsApp(lastSavedTrip)}
              className="flex-1 min-w-[200px] py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow flex items-center justify-center gap-2 text-sm transition cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>व्हाट्सएप पर मालिक को हिसाब भेजें</span>
            </button>
            <button
              onClick={() => onViewReceipt(lastSavedTrip)}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl border border-slate-700 flex items-center justify-center gap-2 text-sm transition cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>कच्ची पर्ची देखें</span>
            </button>
          </div>
        </div>
      )}

      {/* MAIN TRIP LOGGING FORM */}
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {/* CARD 1: TRIP ROUTE & WEIGHT (Auto-filled by AI) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-white text-base">१. ट्रिप व रूट की जानकारी</h3>
            </div>
            {routeFrom && (
              <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>भर दिया गया</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                तारीख (Date)
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <Calendar className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                लोड किया गया माल / वज़न (MT - मीट्रिक टन)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={weightMT}
                  onChange={(e) => setWeightMT(e.target.value)}
                  placeholder="उदा. 28.5 MT"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <Scale className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                रूट: कहाँ से माल भरा (Origin)
              </label>
              <input
                type="text"
                value={routeFrom}
                onChange={(e) => setRouteFrom(e.target.value)}
                placeholder="उदा. सूरत / हजीरा / वडोदरा"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                रूट: कहाँ खाली होगा (Destination)
              </label>
              <input
                type="text"
                value={routeTo}
                onChange={(e) => setRouteTo(e.target.value)}
                placeholder="उदा. मुम्बई (भिवंडी) / दिल्ली / पुणे"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>
        </div>

        {/* CARD 2: SHILAK (ADVANCE - MANUAL) & PRIMARY ALLOWANCES */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white text-base">२. शिलक (एडवांस) व मुख्य खर्चे</h3>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
              ✍️ शिलक हाथ से भरें
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Shilak Advance Received - HIGHLIGHTED MANUAL INPUT */}
            <div className="bg-amber-950/30 border-2 border-amber-500/60 rounded-xl p-3.5 ring-2 ring-amber-500/20 shadow-lg">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-extrabold text-amber-300">
                  ट्रांसपोर्ट से मिली शिलक / एडवांस (₹)
                </label>
                <span className="text-[9px] uppercase tracking-wide bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded">
                  जरूरी
                </span>
              </div>
              <div className="relative">
                <input
                  ref={advanceInputRef}
                  type="number"
                  min="0"
                  value={advanceShilak}
                  onChange={(e) => setAdvanceShilak(e.target.value)}
                  placeholder="₹ 15,000"
                  className="w-full bg-slate-950 border-2 border-amber-500 rounded-lg px-3 py-2.5 text-amber-300 font-black text-lg focus:outline-none focus:ring-4 focus:ring-amber-500/40"
                  required
                />
              </div>
              <p className="text-[11px] text-amber-200/90 font-medium mt-1.5">
                👉 ड्राइवर को शुरुआत में मिली रोकड़ (हाथ से दर्ज करें)
              </p>
            </div>

            {/* Driver Bhatta */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
              <label className="block text-xs font-bold text-slate-200 mb-1.5">
                ड्राइवर भत्ता (₹ Daily Allowance)
              </label>
              <input
                type="number"
                min="0"
                value={driverBhatta}
                onChange={(e) => setDriverBhatta(e.target.value)}
                placeholder="₹ 2,500"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-white font-semibold text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">चालक का तयशुदा भत्ता</p>
            </div>

            {/* Unloading Charge */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
              <label className="block text-xs font-bold text-slate-200 mb-1.5">
                खाली / अनलोडिंग चार्ज (₹)
              </label>
              <input
                type="number"
                min="0"
                value={unloadingCharge}
                onChange={(e) => setUnloadingCharge(e.target.value)}
                placeholder="₹ 1,200"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-white font-semibold text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">हमाली व मजदूरी खर्चा</p>
            </div>
          </div>
        </div>

        {/* CARD 3: DYNAMIC PETTY EXPENSES */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="font-bold text-white text-base">३. अन्य अतिरिक्त खर्चे (फुटकर)</h3>
                <p className="text-xs text-slate-400">टोल, पंचर, यूरिया, पुलिस, धर्मकांटा आदि</p>
              </div>
            </div>

            <button
              type="button"
              onClick={addPettyRow}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ और खर्चा जोड़ें</span>
            </button>
          </div>

          {/* Dynamic Rows */}
          <div className="space-y-3">
            {pettyExpenses.map((exp, index) => (
              <div
                key={exp.id}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 p-3 bg-slate-950/80 border border-slate-800 rounded-xl"
              >
                <div className="flex-1">
                  <label className="block text-[11px] font-medium text-slate-400 mb-1 sm:hidden">
                    खर्चे का नाम (#{index + 1})
                  </label>
                  <select
                    value={exp.name}
                    onChange={(e) => updatePettyRow(exp.id, 'name', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {COMMON_EXPENSE_NAMES.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-full sm:w-44">
                  <label className="block text-[11px] font-medium text-slate-400 mb-1 sm:hidden">
                    रकम (₹)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={exp.amount || ''}
                      onChange={(e) => updatePettyRow(exp.id, 'amount', e.target.value)}
                      placeholder="₹ 0"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-emerald-400 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="absolute right-3 top-2 text-xs text-slate-500">₹</span>
                  </div>
                </div>

                {pettyExpenses.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePettyRow(exp.id)}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition self-end sm:self-center cursor-pointer"
                    title="खर्चा हटाएं"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={addPettyRow}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>और अन्य खर्चा पंक्ति जोड़ें</span>
            </button>
          </div>
        </div>

        {/* CARD 4: DOCUMENT / PHOTO UPLOADS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Camera className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-white text-base">४. बिल्टी व इनवॉइस की फोटो (LR & Bill)</h3>
              <p className="text-xs text-slate-400">कैमरे से फोटो खींचें या गैलरी से अपलोड करें</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Bilty Photo */}
            <div className="border border-dashed border-slate-700 rounded-xl p-3.5 text-center bg-slate-950/40">
              <span className="text-xs font-bold text-slate-300 block mb-2">
                १. ट्रांसपोर्ट बिल्टी (LR कॉपी)
              </span>
              {biltyPhoto ? (
                <div className="relative group">
                  <img
                    src={biltyPhoto}
                    alt="बिल्टी पूर्वावलोकन"
                    className="w-full h-36 object-contain rounded-lg bg-black border border-slate-800"
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      type="button"
                      onClick={() => performAIScan(biltyPhoto)}
                      className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 shadow transition cursor-pointer"
                      title="दोबारा AI स्कैन करें"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setBiltyPhoto(null)}
                      className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-500 shadow transition cursor-pointer"
                      title="फोटो हटाएं"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <label htmlFor={biltyInputId} className="flex flex-col items-center justify-center h-32 border border-slate-700/60 rounded-lg hover:border-emerald-500/60 transition cursor-pointer bg-slate-900/50 p-3">
                  <Camera className="w-7 h-7 text-emerald-400 mb-1.5" />
                  <span className="text-xs font-medium text-slate-300">
                    बिल्टी (LR) की फोटो लें / चुनें
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5">फोटो लेते ही AI स्वतः डाटा भर देगा</span>
                  <input
                    id={biltyInputId}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handlePhotoUpload(e, 'bilty')}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Invoice Photo */}
            <div className="border border-dashed border-slate-700 rounded-xl p-3.5 text-center bg-slate-950/40">
              <span className="text-xs font-bold text-slate-300 block mb-2">
                २. चालान / इनवॉइस (Bill)
              </span>
              {invoicePhoto ? (
                <div className="relative group">
                  <img
                    src={invoicePhoto}
                    alt="चालान पूर्वावलोकन"
                    className="w-full h-36 object-contain rounded-lg bg-black border border-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setInvoicePhoto(null)}
                    className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-500 shadow transition cursor-pointer"
                    title="फोटो हटाएं"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label htmlFor={invoiceInputId} className="flex flex-col items-center justify-center h-32 border border-slate-700/60 rounded-lg hover:border-indigo-500/60 transition cursor-pointer bg-slate-900/50 p-3">
                  <Camera className="w-7 h-7 text-indigo-400 mb-1.5" />
                  <span className="text-xs font-medium text-slate-300">
                    चालान (Invoice) की फोटो लें
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5">JPG, PNG समर्थित</span>
                  <input
                    id={invoiceInputId}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handlePhotoUpload(e, 'invoice')}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              रिमार्क / खास टिप्पणी (वैकल्पिक)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="उदा. रास्ते में बारिश थी / पार्टी ने देरी से अनलोड किया"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* CARD 5: LIVE CALCULATION & NET SHILAK CARD */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border-2 border-emerald-500/40 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-base sm:text-lg flex items-center gap-2">
              <span>५. लाइव हिसाब पर्ची (कैलकुलेशन)</span>
            </h3>
            <span className="text-xs font-semibold text-slate-400">तुरंत ऑटोमेटिक गणना</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block">मिली शिलक</span>
              <span className="text-base font-bold text-amber-400">
                {formatINR(Number(advanceShilak) || 0)}
              </span>
            </div>

            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block">भत्ता + अनलोडिंग</span>
              <span className="text-base font-bold text-slate-200">
                {formatINR((Number(driverBhatta) || 0) + (Number(unloadingCharge) || 0))}
              </span>
            </div>

            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block">अन्य खर्चे</span>
              <span className="text-base font-bold text-slate-200">
                {formatINR(calculations.totalPettyExpenses)}
              </span>
            </div>

            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-rose-900/40">
              <span className="text-[11px] text-rose-300 block">कुल खर्चा</span>
              <span className="text-base font-bold text-rose-400">
                {formatINR(calculations.totalExpenses)}
              </span>
            </div>
          </div>

          {/* NET SHILAK BADGE (EMERALD OR ROSE) */}
          <div
            className={`p-4 rounded-xl border text-center transition-all ${
              calculations.isPositive
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
            }`}
          >
            <span className="text-xs font-bold uppercase tracking-wider block">
              {calculations.isPositive
                ? '✅ बचा हुआ शिलक (ड्राइवर के पास शेष रोकड़)'
                : '⚠️ शुद्ध शेष (ड्राइवर ने जेब से ज्यादा खर्च किया / कंपनी देगी)'}
            </span>
            <div className="text-2xl sm:text-3xl font-black mt-1 font-mono tracking-wide">
              {formatINR(calculations.netShilak)}
            </div>
            <p className="text-[11px] opacity-80 mt-1">
              {calculations.isPositive
                ? 'यह रकम ड्राइवर को कंपनी को लौटानी है या अगली ट्रिप में जुड़ेगी।'
                : 'यह रकम कंपनी द्वारा ड्राइवर को तुरंत चुकाई जानी है।'}
            </p>
          </div>

          {/* ACTION BUTTONS */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              className="flex-1 py-4 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg rounded-xl shadow-xl shadow-emerald-700/30 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-6 h-6" />
              <span>ट्रिप एंट्री सबमिट करें</span>
            </button>
          </div>
        </div>
      </form>

      {/* DRIVER'S PAST TRIPS RECORD */}
      {driverTrips.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-white text-base">
                आपकी हालिया ट्रिप्स ({driver.assignedVehiclePlate})
              </h3>
              <p className="text-xs text-slate-400">पिछली भरी गई कच्ची पर्चियां</p>
            </div>
            <span className="text-xs px-2 py-1 bg-slate-800 text-slate-300 rounded-lg">
              कुल: {driverTrips.length}
            </span>
          </div>

          <div className="space-y-3">
            {driverTrips.map((trip) => (
              <div
                key={trip.id}
                className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-amber-400">{trip.id}</span>
                    <span className="text-slate-500 text-xs">·</span>
                    <span className="text-xs text-slate-400">{trip.date}</span>
                    <span className="text-slate-500 text-xs">·</span>
                    <span className="text-xs font-medium text-emerald-400">
                      {trip.weightMT} MT
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
                    <span>{trip.routeFrom}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    <span>{trip.routeTo}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-2">
                    <span>एडवांस: {formatINR(trip.advanceShilak)}</span>
                    <span>कुल खर्चा: {formatINR(trip.totalExpenses)}</span>
                    <span
                      className={`font-semibold ${
                        trip.netShilak >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      शेष: {formatINR(trip.netShilak)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => onViewReceipt(trip)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1 border border-slate-700 cursor-pointer"
                    title="पर्ची देखें"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>पर्ची</span>
                  </button>
                  <button
                    onClick={() => handleShareWhatsApp(trip)}
                    className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer"
                    title="व्हाट्सएप पर भेजें"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>व्हाट्सएप</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
