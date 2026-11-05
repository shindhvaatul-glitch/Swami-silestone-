import { Driver, TripEntry, Vehicle } from '../types';

const STORAGE_KEYS = {
  VEHICLES: 'swami_transport_vehicles_v1',
  DRIVERS: 'swami_transport_drivers_v1',
  TRIPS: 'swami_transport_trips_v1',
  AUTH: 'swami_transport_auth_v1',
};

// Generate list of 26 Drivers
const INITIAL_DRIVERS: Driver[] = [
  { id: 'DRV01', name: 'रमेश भाई यादव', phone: '+91 98250 11001', pin: '1111', assignedVehiclePlate: 'GJ-27-T-1001' },
  { id: 'DRV02', name: 'सुरेश कुमार गुर्जर', phone: '+91 98250 11002', pin: '1111', assignedVehiclePlate: 'GJ-27-T-1002' },
  { id: 'DRV03', name: 'महेंद्र सिंह जाट', phone: '+91 98250 11003', pin: '1111', assignedVehiclePlate: 'GJ-27-T-1003' },
  { id: 'DRV04', name: 'राजेश कुमार पटेल', phone: '+91 98250 11004', pin: '1111', assignedVehiclePlate: 'GJ-27-T-1004' },
  { id: 'DRV05', name: 'दिनेश कुमार शर्मा', phone: '+91 98250 11005', pin: '1111', assignedVehiclePlate: 'GJ-27-T-1005' },
  { id: 'DRV06', name: 'कुलदीप सिंह धालीवाल', phone: '+91 98250 11006', pin: '1111', assignedVehiclePlate: 'GJ-27-T-1006' },
  { id: 'DRV07', name: 'विक्रम सिंह सोलंकी', phone: '+91 98250 11007', pin: '1111', assignedVehiclePlate: 'GJ-27-T-1007' },
  { id: 'DRV08', name: 'जितेंद्र चौधरी', phone: '+91 98250 11008', pin: '1111', assignedVehiclePlate: 'GJ-27-T-1008' },
  { id: 'DRV09', name: 'मुकेश कुमार मीणा', phone: '+91 98250 11009', pin: '1111', assignedVehiclePlate: 'GJ-27-T-1009' },
  { id: 'DRV10', name: 'विनोद सिंह शेखावत', phone: '+91 98250 11010', pin: '1111', assignedVehiclePlate: 'GJ-27-T-1010' },
  { id: 'DRV11', name: 'संतोष कुमार पाल', phone: '+91 98250 11011', pin: '1111', assignedVehiclePlate: 'GJ-27-T-1011' },
  { id: 'DRV12', name: 'बलवंत सिंह संधू', phone: '+91 98250 11012', pin: '1111', assignedVehiclePlate: 'GJ-27-T-1012' },
  { id: 'DRV13', name: 'हरपाल सिंह बाजवा', phone: '+91 98250 11013', pin: '1111', assignedVehiclePlate: 'GJ-27-T-1013' },
  { id: 'DRV14', name: 'संजय कुमार निषाद', phone: '+91 98250 11014', pin: '1111', assignedVehiclePlate: 'GJ-27-T-1014' },
  { id: 'DRV15', name: 'धर्मेन्द्र सिंह तोमर', phone: '+91 98250 11015', pin: '1111', assignedVehiclePlate: 'GJ-27-T-1015' },
  { id: 'DRV16', name: 'अनिल कुमार मौर्य', phone: '+91 98250 11016', pin: '1111', assignedVehiclePlate: 'GJ-27-T-1016' },
  { id: 'DRV17', name: 'जसविंदर सिंह बराड़', phone: '+91 98250 11017', pin: '1111', assignedVehiclePlate: 'GJ-27-T-1017' },
  { id: 'DRV18', name: 'प्रदीप कुमार बघेल', phone: '+91 98250 11018', pin: '1111', assignedVehiclePlate: 'GJ-27-T-1018' },
  { id: 'DRV19', name: 'मनोज कुमार तिवारी', phone: '+91 98250 11019', pin: '1111', assignedVehiclePlate: 'GJ-27-T-1019' },
  { id: 'DRV20', name: 'राकेश कुमार विश्वकर्मा', phone: '+91 98250 11020', pin: '1111', assignedVehiclePlate: 'GJ-27-T-1020' },
  { id: 'DRV21', name: 'अशोक कुमार सैन', phone: '+91 98250 11021', pin: '1111', assignedVehiclePlate: 'GJ-27-T-1021' },
  { id: 'DRV22', name: 'पवन कुमार लोधी', phone: '+91 98250 11022', pin: '1111', assignedVehiclePlate: 'GJ-27-T-1022' },
  { id: 'DRV23', name: 'कमलेश कुमार राजभर', phone: '+91 98250 11023', pin: '1111', assignedVehiclePlate: 'GJ-27-T-1023' },
  { id: 'DRV24', name: 'सुनील कुमार बिश्नोई', phone: '+91 98250 11024', pin: '1111', assignedVehiclePlate: 'GJ-27-T-1024' },
  { id: 'DRV25', name: 'गुरप्रीत सिंह रंधावा', phone: '+91 98250 11025', pin: '1111', assignedVehiclePlate: 'GJ-27-T-1025' },
  { id: 'DRV26', name: 'देवेंद्र सिंह राठौड़', phone: '+91 98250 11026', pin: '1111', assignedVehiclePlate: 'GJ-27-T-1026' },
];

// Generate list of 26 Vehicles GJ-27-T-1001 to GJ-27-T-1026
const INITIAL_VEHICLES: Vehicle[] = Array.from({ length: 26 }, (_, i) => {
  const num = 1001 + i;
  const plate = `GJ-27-T-${num}`;
  const driver = INITIAL_DRIVERS[i];
  const models = [
    'टाटा सिग्ना 2823.K (10 व्हीलर)',
    'अशोक लीलैंड 2820 (10 व्हीलर)',
    'भारतबेंज 2823R (10 व्हीलर)',
    'टाटा प्राइमा 3525.K (12 व्हीलर)',
    'आइशर प्रो 6028 (10 व्हीलर)',
  ];
  return {
    plateNumber: plate,
    truckIndex: i + 1,
    assignedDriverId: driver.id,
    assignedDriverName: driver.name,
    model: models[i % models.length],
    status: (i === 0 || i === 1 || i === 4 || i === 9 || i === 17) ? 'in_trip' : 'available',
  };
});

// Sample realistic initial trips (5 trips)
const INITIAL_TRIPS: TripEntry[] = [
  {
    id: 'TRIP-1026-01',
    date: '2026-11-01',
    vehiclePlate: 'GJ-27-T-1001',
    driverId: 'DRV01',
    driverName: 'रमेश भाई यादव',
    routeFrom: 'सूरत',
    routeTo: 'मुम्बई (भिवंडी)',
    weightMT: 28.5,
    advanceShilak: 18000,
    driverBhatta: 2500,
    unloadingCharge: 1200,
    pettyExpenses: [
      { id: 'pe-1', name: 'टोल टैक्स (फास्टैग)', amount: 3200 },
      { id: 'pe-2', name: 'यूरिया / AdBlue', amount: 950 },
      { id: 'pe-3', name: 'चाय-नाश्ता', amount: 350 },
    ],
    totalPettyExpenses: 4500,
    totalExpenses: 8200,
    netShilak: 9800,
    notes: 'कस्टमर ने माल समय पर खाली करवा दिया। सुरक्षित डिलीवरी।',
    createdAt: '2026-11-01T10:30:00.000Z',
  },
  {
    id: 'TRIP-1026-02',
    date: '2026-11-01',
    vehiclePlate: 'GJ-27-T-1002',
    driverId: 'DRV02',
    driverName: 'सुरेश कुमार गुर्जर',
    routeFrom: 'अहमदाबाद',
    routeTo: 'दिल्ली (संजय गांधी ट्रांसपोर्ट नगर)',
    weightMT: 32.0,
    advanceShilak: 28000,
    driverBhatta: 4000,
    unloadingCharge: 1800,
    pettyExpenses: [
      { id: 'pe-4', name: 'टोल टैक्स', amount: 7500 },
      { id: 'pe-5', name: 'पंचर / टायर रिपेयर', amount: 650 },
      { id: 'pe-6', name: 'कांटा पर्ची (धर्मकांटा)', amount: 200 },
    ],
    totalPettyExpenses: 8350,
    totalExpenses: 14150,
    netShilak: 13850,
    notes: 'दिल्ली में सुबह 6 बजे गाड़ी अनलोड हो गई।',
    createdAt: '2026-11-01T15:45:00.000Z',
  },
  {
    id: 'TRIP-1026-03',
    date: '2026-10-31',
    vehiclePlate: 'GJ-27-T-1005',
    driverId: 'DRV05',
    driverName: 'दिनेश कुमार शर्मा',
    routeFrom: 'वडोदरा',
    routeTo: 'जयपुर (विश्वकर्मा इंडस्ट्रियल)',
    weightMT: 26.0,
    advanceShilak: 22000,
    driverBhatta: 3200,
    unloadingCharge: 1500,
    pettyExpenses: [
      { id: 'pe-7', name: 'टोल टैक्स', amount: 4800 },
      { id: 'pe-8', name: 'यूरिया / AdBlue', amount: 1100 },
      { id: 'pe-9', name: 'पुलिस / आरटीओ एंट्री', amount: 500 },
    ],
    totalPettyExpenses: 6400,
    totalExpenses: 11100,
    netShilak: 10900,
    notes: 'पार्टी से अनलोडिंग की पर्ची ले ली है।',
    createdAt: '2026-10-31T18:20:00.000Z',
  },
  {
    id: 'TRIP-1026-04',
    date: '2026-10-30',
    vehiclePlate: 'GJ-27-T-1010',
    driverId: 'DRV10',
    driverName: 'विनोद सिंह शेखावत',
    routeFrom: 'अंकलेश्वर',
    routeTo: 'पुणे (चाकन MIDC)',
    weightMT: 30.5,
    advanceShilak: 20000,
    driverBhatta: 3000,
    unloadingCharge: 1600,
    pettyExpenses: [
      { id: 'pe-10', name: 'टोल टैक्स', amount: 4200 },
      { id: 'pe-11', name: 'छोटा रिपेयर (पट्टा बदला)', amount: 1800 },
    ],
    totalPettyExpenses: 6000,
    totalExpenses: 10600,
    netShilak: 9400,
    notes: 'रास्ते में पट्टा टूट गया था, नया लगवाया।',
    createdAt: '2026-10-30T14:10:00.000Z',
  },
  {
    id: 'TRIP-1026-05',
    date: '2026-10-29',
    vehiclePlate: 'GJ-27-T-1018',
    driverId: 'DRV18',
    driverName: 'प्रदीप कुमार बघेल',
    routeFrom: 'राजकोट',
    routeTo: 'इंदौर (लोहा मंडी)',
    weightMT: 24.0,
    advanceShilak: 16000,
    driverBhatta: 2800,
    unloadingCharge: 1400,
    pettyExpenses: [
      { id: 'pe-12', name: 'टोल टैक्स', amount: 3600 },
      { id: 'pe-13', name: 'चाय-नाश्ता', amount: 400 },
    ],
    totalPettyExpenses: 4000,
    totalExpenses: 8200,
    netShilak: 7800,
    notes: 'इंदौर में खाली होकर वापसी का फेरा देखा जा रहा है।',
    createdAt: '2026-10-29T11:00:00.000Z',
  },
];

export const storage = {
  getVehicles(): Vehicle[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.VEHICLES);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(INITIAL_VEHICLES));
        return INITIAL_VEHICLES;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_VEHICLES;
    }
  },

  saveVehicles(vehicles: Vehicle[]) {
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));
  },

  getDrivers(): Driver[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DRIVERS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(INITIAL_DRIVERS));
        return INITIAL_DRIVERS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_DRIVERS;
    }
  },

  saveDrivers(drivers: Driver[]) {
    localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(drivers));
  },

  getTrips(): TripEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRIPS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(INITIAL_TRIPS));
        return INITIAL_TRIPS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_TRIPS;
    }
  },

  saveTrips(trips: TripEntry[]) {
    localStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(trips));
  },

  addTrip(trip: TripEntry): TripEntry[] {
    const trips = this.getTrips();
    const updated = [trip, ...trips];
    this.saveTrips(updated);
    return updated;
  },

  deleteTrip(tripId: string): TripEntry[] {
    const trips = this.getTrips();
    const updated = trips.filter((t) => t.id !== tripId);
    this.saveTrips(updated);
    return updated;
  },

  reassignDriver(plateNumber: string, newDriverId: string, newDriverName: string) {
    const vehicles = this.getVehicles();
    const updatedVehicles = vehicles.map((v) => {
      if (v.plateNumber === plateNumber) {
        return {
          ...v,
          assignedDriverId: newDriverId,
          assignedDriverName: newDriverName,
        };
      }
      return v;
    });
    this.saveVehicles(updatedVehicles);

    const drivers = this.getDrivers();
    const updatedDrivers = drivers.map((d) => {
      if (d.id === newDriverId) {
        return { ...d, assignedVehiclePlate: plateNumber };
      }
      // If someone else had this plate, clear or keep
      return d;
    });
    this.saveDrivers(updatedDrivers);

    return { vehicles: updatedVehicles, drivers: updatedDrivers };
  },

  resetAllData() {
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(INITIAL_VEHICLES));
    localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(INITIAL_DRIVERS));
    localStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(INITIAL_TRIPS));
  },
};
