import React, { useState } from 'react';
import {
  X,
  Printer,
  Share2,
  Truck,
  Calendar,
  User,
  Scale,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { TripEntry } from '../types';
import { formatINR, formatDate, generateWhatsAppMessage } from '../utils/calculator';

interface TripReceiptModalProps {
  trip: TripEntry | null;
  onClose: () => void;
}

export const TripReceiptModal: React.FC<TripReceiptModalProps> = ({ trip, onClose }) => {
  const [activeTab, setActiveTab] = useState<'receipt' | 'docs'>('receipt');
  const [fullImage, setFullImage] = useState<string | null>(null);

  if (!trip) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    const msg = generateWhatsAppMessage(trip);
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Header (Hidden in Print) */}
        <div className="print:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-base">कच्चा चिट्ठा - डिजिटल पर्ची</span>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono">
              {trip.id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-800 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setActiveTab('receipt')}
                className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                  activeTab === 'receipt' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'
                }`}
              >
                पर्ची
              </button>
              <button
                onClick={() => setActiveTab('docs')}
                className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                  activeTab === 'docs' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'
                }`}
              >
                LR / इनवॉइस ({[trip.biltyPhoto, trip.invoicePhoto].filter(Boolean).length})
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition cursor-pointer"
              title="पर्ची प्रिंट करें"
            >
              <Printer className="w-4 h-4 text-indigo-400" />
            </button>

            <button
              onClick={handleWhatsApp}
              className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition cursor-pointer"
              title="व्हाट्सएप पर भेजें"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-4">
          {activeTab === 'receipt' ? (
            /* PRINTABLE TRANSPORT SLIP */
            <div className="bg-white text-slate-900 rounded-xl p-5 sm:p-7 shadow-lg border border-slate-300 print:border-none print:shadow-none print:p-0">
              {/* Slip Header */}
              <div className="text-center border-b-2 border-slate-900 pb-3 mb-4">
                <span className="text-[10px] tracking-widest uppercase font-bold text-slate-600 block">
                  ॥ श्री गणेशाय नमः ॥
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight font-['Hind',sans-serif]">
                  स्वामी ट्रांसपोर्ट कंपनी
                </h2>
                <p className="text-xs text-slate-600">
                  ऑल इंडिया ट्रांसपोर्ट कॉन्ट्रैक्टर व फ्लीट ऑपरेटर (२६ ट्रकों का बेड़ा)
                </p>
                <div className="inline-block mt-1 px-3 py-0.5 bg-slate-100 rounded text-xs font-bold text-slate-800 border border-slate-300">
                  डिजिटल कच्चा चिट्ठा / ट्रिप हिसाब पर्ची
                </div>
              </div>

              {/* Trip Meta Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 block">पर्ची नंबर (Trip ID):</span>
                  <strong className="text-slate-900 font-mono text-sm">{trip.id}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">तारीख (Date):</span>
                  <strong className="text-slate-900">{formatDate(trip.date)}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">गाड़ी नंबर (Truck No):</span>
                  <strong className="text-indigo-900 font-mono text-sm font-black">
                    {trip.vehiclePlate}
                  </strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">चालक का नाम (Driver):</span>
                  <strong className="text-slate-900">{trip.driverName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">रूट (कहाँ से कहाँ):</span>
                  <strong className="text-slate-900">
                    {trip.routeFrom} से {trip.routeTo}
                  </strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">लोड माल / वज़न:</span>
                  <strong className="text-slate-900">{trip.weightMT} MT (टन)</strong>
                </div>
              </div>

              {/* Shilak & Expense Ledger */}
              <div className="border border-slate-900 rounded-lg overflow-hidden mb-4">
                <table className="w-full text-xs">
                  <thead className="bg-slate-900 text-white font-bold">
                    <tr>
                      <th className="py-2 px-3 text-left">मद (विवरण)</th>
                      <th className="py-2 px-3 text-right">रकम (रुपये ₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr className="bg-amber-50/70 font-semibold">
                      <td className="py-2 px-3 text-amber-950">
                        १. ट्रांसपोर्ट से मिली एडवांस शिलक (Cash Received)
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-amber-950 font-mono">
                        {formatINR(trip.advanceShilak)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-700">
                        २. ड्राइवर भत्ता (Daily Allowance)
                      </td>
                      <td className="py-2 px-3 text-right text-slate-800 font-mono">
                        {formatINR(trip.driverBhatta)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-700">
                        ३. खाली / अनलोडिंग मजदूरी चार्ज
                      </td>
                      <td className="py-2 px-3 text-right text-slate-800 font-mono">
                        {formatINR(trip.unloadingCharge)}
                      </td>
                    </tr>

                    {/* Dynamic Petty Items */}
                    {trip.pettyExpenses && trip.pettyExpenses.length > 0 && (
                      trip.pettyExpenses.map((exp) => (
                        <tr key={exp.id} className="text-slate-600 bg-slate-50/50">
                          <td className="py-1.5 px-3 pl-6">
                            • {exp.name}
                          </td>
                          <td className="py-1.5 px-3 text-right text-slate-800 font-mono">
                            {formatINR(exp.amount)}
                          </td>
                        </tr>
                      ))
                    )}

                    {/* Total Expenses Row */}
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                      <td className="py-2.5 px-3 text-slate-900">
                        कुल हुआ खर्चा (Total Expenses)
                      </td>
                      <td className="py-2.5 px-3 text-right text-rose-700 font-mono text-sm">
                        {formatINR(trip.totalExpenses)}
                      </td>
                    </tr>

                    {/* Net Shilak Row */}
                    <tr
                      className={`font-black text-sm border-t-2 border-slate-900 ${
                        trip.netShilak >= 0 ? 'bg-emerald-50 text-emerald-950' : 'bg-rose-50 text-rose-950'
                      }`}
                    >
                      <td className="py-3 px-3">
                        {trip.netShilak >= 0
                          ? 'बचा हुआ शिलक (ड्राइवर के पास रोकड़ शेष)'
                          : 'शुद्ध शेष (ड्राइवर को कंपनी द्वारा देय)'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-base">
                        {formatINR(trip.netShilak)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Notes */}
              {trip.notes && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 mb-6">
                  <strong>रिमार्क / खास नोट: </strong> {trip.notes}
                </div>
              )}

              {/* Signatures */}
              <div className="flex justify-between items-end pt-6 border-t border-dashed border-slate-300 text-xs">
                <div className="text-center">
                  <div className="w-32 border-b border-slate-900 mb-1" />
                  <span className="text-slate-600 font-medium">चालक (ड्राइवर) हस्ताक्षर</span>
                </div>
                <div className="text-center">
                  <div className="w-32 border-b border-slate-900 mb-1" />
                  <span className="text-slate-600 font-medium">मालिक / मुनीम हस्ताक्षर</span>
                </div>
              </div>
            </div>
          ) : (
            /* ATTACHED DOCUMENTS & PHOTOS TAB */
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white">संलग्न दस्तावेज़ व तस्वीरें</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Bilty Photo */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <span className="text-xs font-semibold text-slate-300 block mb-2">
                    ट्रांसपोर्ट बिल्टी (LR कॉपी)
                  </span>
                  {trip.biltyPhoto ? (
                    <div
                      onClick={() => setFullImage(trip.biltyPhoto!)}
                      className="cursor-pointer group relative rounded-lg overflow-hidden border border-slate-800 bg-black"
                    >
                      <img
                        src={trip.biltyPhoto}
                        alt="Bilty"
                        className="w-full h-56 object-contain group-hover:opacity-90 transition"
                      />
                      <span className="absolute bottom-2 right-2 text-[10px] bg-slate-900/90 text-white px-2 py-0.5 rounded">
                        बड़ा करने के लिए छुएं
                      </span>
                    </div>
                  ) : (
                    <div className="h-44 border border-dashed border-slate-800 rounded-lg flex flex-col items-center justify-center text-slate-500 text-xs">
                      <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
                      <span>कोई बिल्टी फोटो अपलोड नहीं की गई</span>
                    </div>
                  )}
                </div>

                {/* Invoice Photo */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <span className="text-xs font-semibold text-slate-300 block mb-2">
                    चालान / इनवॉइस
                  </span>
                  {trip.invoicePhoto ? (
                    <div
                      onClick={() => setFullImage(trip.invoicePhoto!)}
                      className="cursor-pointer group relative rounded-lg overflow-hidden border border-slate-800 bg-black"
                    >
                      <img
                        src={trip.invoicePhoto}
                        alt="Invoice"
                        className="w-full h-56 object-contain group-hover:opacity-90 transition"
                      />
                      <span className="absolute bottom-2 right-2 text-[10px] bg-slate-900/90 text-white px-2 py-0.5 rounded">
                        बड़ा करने के लिए छुएं
                      </span>
                    </div>
                  ) : (
                    <div className="h-44 border border-dashed border-slate-800 rounded-lg flex flex-col items-center justify-center text-slate-500 text-xs">
                      <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
                      <span>कोई चालान फोटो अपलोड नहीं की गई</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Full Image Preview Overlay */}
        {fullImage && (
          <div
            onClick={() => setFullImage(null)}
            className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
          >
            <div className="relative max-w-4xl max-h-[90vh]">
              <img src={fullImage} alt="Full View" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
              <button
                onClick={() => setFullImage(null)}
                className="absolute top-2 right-2 p-2 bg-slate-900/80 text-white rounded-full hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
