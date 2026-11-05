export interface PettyExpense {
  id: string;
  name: string;
  amount: number;
}

export interface TripEntry {
  id: string;
  date: string;
  vehiclePlate: string;
  driverId: string;
  driverName: string;
  routeFrom: string;
  routeTo: string;
  weightMT: number;
  advanceShilak: number;
  driverBhatta: number;
  unloadingCharge: number;
  pettyExpenses: PettyExpense[];
  totalPettyExpenses: number;
  totalExpenses: number;
  netShilak: number; // positive = balance with driver, negative = driver spent from own pocket
  biltyPhoto?: string | null;
  invoicePhoto?: string | null;
  notes?: string;
  createdAt: string;
}

export interface Vehicle {
  plateNumber: string;
  truckIndex: number; // 1 to 26
  assignedDriverId: string;
  assignedDriverName: string;
  model: string;
  status: 'available' | 'in_trip' | 'maintenance';
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  pin: string;
  assignedVehiclePlate: string;
}

export interface FleetSummary {
  totalTrips: number;
  totalAdvance: number;
  totalBhatta: number;
  totalUnloading: number;
  totalPettyExpenses: number;
  totalExpenses: number;
  netCompanyBalance: number;
}
