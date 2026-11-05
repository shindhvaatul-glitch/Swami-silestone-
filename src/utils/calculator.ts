import { PettyExpense, TripEntry, FleetSummary } from '../types';

/**
 * Calculates trip expense totals and remaining shilak balance.
 * Net Shilak = Advance Received - Total Expenses
 * Total Expenses = Bhatta + Unloading + Sum(Petty Expenses)
 */
export function calculateTripTotals(
  advance: number,
  bhatta: number,
  unloading: number,
  pettyExpenses: PettyExpense[]
): {
  totalPettyExpenses: number;
  totalExpenses: number;
  netShilak: number;
  isPositive: boolean;
} {
  const safeAdvance = Math.max(0, Number(advance) || 0);
  const safeBhatta = Math.max(0, Number(bhatta) || 0);
  const safeUnloading = Math.max(0, Number(unloading) || 0);

  const totalPettyExpenses = pettyExpenses.reduce(
    (sum, item) => sum + (Math.max(0, Number(item.amount) || 0)),
    0
  );

  const totalExpenses = safeBhatta + safeUnloading + totalPettyExpenses;
  const netShilak = safeAdvance - totalExpenses;

  return {
    totalPettyExpenses,
    totalExpenses,
    netShilak,
    isPositive: netShilak >= 0,
  };
}

/**
 * Formats a number to Indian Rupee (₹) format, e.g. ₹ 25,000 or -₹ 1,500
 */
export function formatINR(amount: number): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(Math.round(amount || 0));
  const formatted = absAmount.toLocaleString('en-IN');
  return isNegative ? `-₹ ${formatted}` : `₹ ${formatted}`;
}

/**
 * Formats date into standard Indian readable format DD/MM/YYYY
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Generates formatted WhatsApp text message for owner with Indian transport terms
 */
export function generateWhatsAppMessage(trip: TripEntry): string {
  const expenseLines = trip.pettyExpenses && trip.pettyExpenses.length > 0
    ? trip.pettyExpenses
        .map((e) => `   • ${e.name}: ₹${Number(e.amount).toLocaleString('en-IN')}`)
        .join('\n')
    : '   • कोई अतिरिक्त खर्चा नहीं';

  const balanceStatus = trip.netShilak >= 0
    ? `✅ ड्राइवर के पास शेष शिलक: ₹${Math.abs(trip.netShilak).toLocaleString('en-IN')}`
    : `⚠️ ड्राइवर को कंपनी से लेना बाकी: ₹${Math.abs(trip.netShilak).toLocaleString('en-IN')}`;

  const text = `🚚 *स्वामी ट्रांसपोर्ट मैनेजर - ट्रिप हिसाब पर्ची* 🚚
---------------------------------------
📋 *ट्रिप आईडी:* ${trip.id}
📅 *तारीख:* ${formatDate(trip.date)}
🚛 *गाड़ी नंबर:* ${trip.vehiclePlate}
👤 *ड्राइवर:* ${trip.driverName}
🛣️ *रूट:* ${trip.routeFrom} से ${trip.routeTo}
⚖️ *लोड / वज़न:* ${trip.weightMT} MT (टन)
---------------------------------------
💰 *मिली शिलक / एडवांस:* ₹${Number(trip.advanceShilak).toLocaleString('en-IN')}

📉 *खर्चों का विवरण:*
1. ड्राइवर भत्ता: ₹${Number(trip.driverBhatta).toLocaleString('en-IN')}
2. खाली / अनलोडिंग: ₹${Number(trip.unloadingCharge).toLocaleString('en-IN')}
3. अन्य खर्चे:
${expenseLines}
---------------------------------------
🔴 *कुल खर्चा:* ₹${Number(trip.totalExpenses).toLocaleString('en-IN')}
${balanceStatus}
${trip.notes ? `📝 *रिमार्क:* ${trip.notes}\n` : ''}---------------------------------------
_स्वामी ट्रांसपोर्ट कंपनी - डिजिटल पर्ची_`;

  return text;
}

/**
 * Generates an Excel-compatible CSV string with UTF-8 BOM (\uFEFF)
 * so Hindi Devanagari text displays correctly in MS Excel.
 */
export function generateLedgerCSV(trips: TripEntry[]): string {
  const headers = [
    'तारीख',
    'ट्रिप आईडी',
    'गाड़ी नंबर',
    'ड्राइवर नाम',
    'रूट (कहाँ से कहाँ)',
    'वज़न (MT टन)',
    'एडवांस शिलक (₹)',
    'खाली/अनलोडिंग (₹)',
    'ड्राइवर भत्ता (₹)',
    'अन्य अतिरिक्त खर्चे (₹)',
    'कुल खर्चा (₹)',
    'बचा हुआ शिलक / शेष (₹)',
    'अतिरिक्त खर्चों का विवरण',
    'नोट्स/रिमार्क',
  ];

  const rows = trips.map((t) => {
    const pettyDetails = t.pettyExpenses
      ? t.pettyExpenses.map((p) => `${p.name}: ${p.amount}`).join('; ')
      : '';
    const route = `"${t.routeFrom} से ${t.routeTo}"`;
    const notes = t.notes ? `"${t.notes.replace(/"/g, '""')}"` : '""';
    const pettyCol = `"${pettyDetails.replace(/"/g, '""')}"`;

    return [
      formatDate(t.date),
      t.id,
      t.vehiclePlate,
      `"${t.driverName}"`,
      route,
      t.weightMT,
      t.advanceShilak,
      t.unloadingCharge,
      t.driverBhatta,
      t.totalPettyExpenses,
      t.totalExpenses,
      t.netShilak,
      pettyCol,
      notes,
    ].join(',');
  });

  // \uFEFF is the UTF-8 Byte Order Mark for Excel support
  return '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
}

/**
 * Computes fleet metrics summary across all or filtered trips
 */
export function computeFleetSummary(trips: TripEntry[]): FleetSummary {
  return trips.reduce(
    (acc, trip) => {
      acc.totalTrips += 1;
      acc.totalAdvance += Number(trip.advanceShilak) || 0;
      acc.totalBhatta += Number(trip.driverBhatta) || 0;
      acc.totalUnloading += Number(trip.unloadingCharge) || 0;
      acc.totalPettyExpenses += Number(trip.totalPettyExpenses) || 0;
      acc.totalExpenses += Number(trip.totalExpenses) || 0;
      acc.netCompanyBalance += Number(trip.netShilak) || 0;
      return acc;
    },
    {
      totalTrips: 0,
      totalAdvance: 0,
      totalBhatta: 0,
      totalUnloading: 0,
      totalPettyExpenses: 0,
      totalExpenses: 0,
      netCompanyBalance: 0,
    }
  );
}
