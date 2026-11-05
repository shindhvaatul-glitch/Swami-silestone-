import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTripTotals,
  formatINR,
  formatDate,
  generateWhatsAppMessage,
  generateLedgerCSV,
  computeFleetSummary,
} from './calculator';
import { TripEntry } from '../types';

test('calculateTripTotals correctly computes total expenses and positive net shilak', () => {
  const advance = 15000;
  const bhatta = 2500;
  const unloading = 1200;
  const petty = [
    { id: '1', name: 'टोल टैक्स', amount: 3200 },
    { id: '2', name: 'यूरिया (AdBlue)', amount: 1100 },
  ];

  const result = calculateTripTotals(advance, bhatta, unloading, petty);

  assert.equal(result.totalPettyExpenses, 4300);
  assert.equal(result.totalExpenses, 2500 + 1200 + 4300); // 8000
  assert.equal(result.netShilak, 7000);
  assert.equal(result.isPositive, true);
});

test('calculateTripTotals flags negative net shilak when expenses exceed advance', () => {
  const advance = 5000;
  const bhatta = 2000;
  const unloading = 1500;
  const petty = [
    { id: '1', name: 'टायर पंचर / नया टायर', amount: 4500 },
  ];

  const result = calculateTripTotals(advance, bhatta, unloading, petty);

  assert.equal(result.totalExpenses, 8000);
  assert.equal(result.netShilak, -3000);
  assert.equal(result.isPositive, false);
});

test('formatINR formats currency in Indian locale', () => {
  assert.equal(formatINR(15000), '₹ 15,000');
  assert.equal(formatINR(-3500), '-₹ 3,500');
  assert.equal(formatINR(0), '₹ 0');
});

test('formatDate converts ISO date to DD/MM/YYYY', () => {
  assert.equal(formatDate('2026-11-02'), '02/11/2026');
});

test('generateWhatsAppMessage creates comprehensive Hindi transport report', () => {
  const trip: TripEntry = {
    id: 'TRIP-101',
    date: '2026-11-02',
    vehiclePlate: 'GJ-27-T-1001',
    driverId: 'DRV01',
    driverName: 'रमेश भाई यादव',
    routeFrom: 'सूरत',
    routeTo: 'मुम्बई',
    weightMT: 28.5,
    advanceShilak: 20000,
    driverBhatta: 2500,
    unloadingCharge: 1500,
    pettyExpenses: [
      { id: '1', name: 'टोल टैक्स', amount: 3200 },
    ],
    totalPettyExpenses: 3200,
    totalExpenses: 7200,
    netShilak: 12800,
    createdAt: new Date().toISOString(),
  };

  const msg = generateWhatsAppMessage(trip);
  assert.ok(msg.includes('स्वामी ट्रांसपोर्ट मैनेजर'));
  assert.ok(msg.includes('GJ-27-T-1001'));
  assert.ok(msg.includes('रमेश भाई यादव'));
  assert.ok(msg.includes('सूरत से मुम्बई'));
  assert.ok(msg.includes('28.5 MT'));
  assert.ok(msg.includes('₹20,000'));
  assert.ok(msg.includes('ड्राइवर के पास शेष शिलक'));
});

test('generateLedgerCSV begins with UTF-8 BOM and outputs valid CSV rows', () => {
  const trips: TripEntry[] = [
    {
      id: 'TRIP-101',
      date: '2026-11-02',
      vehiclePlate: 'GJ-27-T-1001',
      driverId: 'DRV01',
      driverName: 'रमेश भाई यादव',
      routeFrom: 'सूरत',
      routeTo: 'मुम्बई',
      weightMT: 28.5,
      advanceShilak: 20000,
      driverBhatta: 2500,
      unloadingCharge: 1500,
      pettyExpenses: [{ id: '1', name: 'टोल टैक्स', amount: 3200 }],
      totalPettyExpenses: 3200,
      totalExpenses: 7200,
      netShilak: 12800,
      notes: 'समय पर डिलीवरी',
      createdAt: new Date().toISOString(),
    },
  ];

  const csv = generateLedgerCSV(trips);
  assert.ok(csv.startsWith('\uFEFF'), 'CSV must start with UTF-8 BOM for Excel');
  assert.ok(csv.includes('गाड़ी नंबर'));
  assert.ok(csv.includes('GJ-27-T-1001'));
});

test('computeFleetSummary aggregates correctly', () => {
  const trips: TripEntry[] = [
    {
      id: 'T1',
      date: '2026-11-01',
      vehiclePlate: 'GJ-27-T-1001',
      driverId: 'DRV01',
      driverName: 'ड्राइवर 1',
      routeFrom: 'A',
      routeTo: 'B',
      weightMT: 20,
      advanceShilak: 10000,
      driverBhatta: 2000,
      unloadingCharge: 1000,
      pettyExpenses: [],
      totalPettyExpenses: 0,
      totalExpenses: 3000,
      netShilak: 7000,
      createdAt: '',
    },
    {
      id: 'T2',
      date: '2026-11-02',
      vehiclePlate: 'GJ-27-T-1002',
      driverId: 'DRV02',
      driverName: 'ड्राइवर 2',
      routeFrom: 'C',
      routeTo: 'D',
      weightMT: 25,
      advanceShilak: 15000,
      driverBhatta: 2500,
      unloadingCharge: 1500,
      pettyExpenses: [{ id: '1', name: 'टोल', amount: 2000 }],
      totalPettyExpenses: 2000,
      totalExpenses: 6000,
      netShilak: 9000,
      createdAt: '',
    },
  ];

  const summary = computeFleetSummary(trips);
  assert.equal(summary.totalTrips, 2);
  assert.equal(summary.totalAdvance, 25000);
  assert.equal(summary.totalExpenses, 9000);
  assert.equal(summary.netCompanyBalance, 16000);
});
