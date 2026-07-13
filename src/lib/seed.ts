import type { Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense } from "./types";

const daysFromNow = (d: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + d);
  return dt.toISOString().slice(0, 10);
};
const isoAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

// Indian commercial vehicle registrations (state code + district + series + number)
export const seedVehicles: Vehicle[] = [
  { id: "v1", reg: "MH 12 AB 4521", name: "Tata Ace Gold", type: "Van", capacityKg: 750, odometer: 84210, acquisitionCost: 480000, status: "Available", region: "Maharashtra" },
  { id: "v2", reg: "DL 01 LC 7788", name: "Tata Prima 4028.S", type: "Truck", capacityKg: 22000, odometer: 210330, acquisitionCost: 3200000, status: "On Trip", region: "Delhi" },
  { id: "v3", reg: "KA 05 MG 0912", name: "Ashok Leyland 4225", type: "Semi", capacityKg: 40000, odometer: 342100, acquisitionCost: 4100000, status: "In Shop", region: "Karnataka" },
  { id: "v4", reg: "TN 22 CJ 3301", name: "Mahindra Bolero Pik-Up", type: "Pickup", capacityKg: 1500, odometer: 45120, acquisitionCost: 820000, status: "Available", region: "Tamil Nadu" },
  { id: "v5", reg: "GJ 05 BR 6644", name: "Eicher Pro 2049", type: "Van", capacityKg: 1700, odometer: 112400, acquisitionCost: 1450000, status: "On Trip", region: "Gujarat" },
  { id: "v6", reg: "KL 07 AN 2210", name: "Tata LPT 1109 Reefer", type: "Refrigerated", capacityKg: 3500, odometer: 67210, acquisitionCost: 2100000, status: "Available", region: "Kerala" },
  { id: "v7", reg: "UP 14 CT 5590", name: "BharatBenz 2823R", type: "Truck", capacityKg: 18000, odometer: 189440, acquisitionCost: 3600000, status: "Available", region: "Uttar Pradesh" },
  { id: "v8", reg: "RJ 14 GA 0812", name: "Ashok Leyland Dost+", type: "Van", capacityKg: 1500, odometer: 92100, acquisitionCost: 890000, status: "Retired", region: "Rajasthan" },
  { id: "v9", reg: "WB 20 DL 4477", name: "Mahindra Furio 17", type: "Pickup", capacityKg: 11000, odometer: 22400, acquisitionCost: 2200000, status: "Available", region: "West Bengal" },
  { id: "v10", reg: "PB 10 CX 1188", name: "Tata Signa 4825.TK", type: "Semi", capacityKg: 36000, odometer: 401200, acquisitionCost: 3900000, status: "On Trip", region: "Punjab" },
  { id: "v11", reg: "TS 09 EK 6621", name: "Eicher Pro 3015 Reefer", type: "Refrigerated", capacityKg: 4200, odometer: 51300, acquisitionCost: 2400000, status: "In Shop", region: "Telangana" },
  { id: "v12", reg: "HR 26 BW 3355", name: "BharatBenz 3523R", type: "Truck", capacityKg: 20000, odometer: 155900, acquisitionCost: 3800000, status: "Available", region: "Haryana" },
];

export const seedDrivers: Driver[] = [
  { id: "d1", name: "Arjun Sharma", license: "MH14 20230011029", licenseCategory: "HMV", licenseExpiry: daysFromNow(420), phone: "+91 98220 40142", safetyScore: 94, status: "Available", region: "Maharashtra" },
  { id: "d2", name: "Priya Iyer", license: "DL07 20210042201", licenseCategory: "HMV", licenseExpiry: daysFromNow(210), phone: "+91 98110 30198", safetyScore: 88, status: "On Trip", region: "Delhi" },
  { id: "d3", name: "Ravi Kumar", license: "KA03 20190098823", licenseCategory: "HTV", licenseExpiry: daysFromNow(18), phone: "+91 98450 60177", safetyScore: 76, status: "Available", region: "Karnataka" },
  { id: "d4", name: "Deepika Nair", license: "KL08 20220014410", licenseCategory: "LMV", licenseExpiry: daysFromNow(-5), phone: "+91 94470 90155", safetyScore: 82, status: "Off Duty", region: "Kerala" },
  { id: "d5", name: "Rohit Patel", license: "GJ05 20200066620", licenseCategory: "HMV", licenseExpiry: daysFromNow(660), phone: "+91 99250 10121", safetyScore: 91, status: "On Trip", region: "Gujarat" },
  { id: "d6", name: "Fatima Khan", license: "UP32 20230099987", licenseCategory: "HTV", licenseExpiry: daysFromNow(305), phone: "+91 93190 80189", safetyScore: 97, status: "Available", region: "Uttar Pradesh" },
  { id: "d7", name: "Manpreet Singh", license: "PB10 20180051145", licenseCategory: "HMV", licenseExpiry: daysFromNow(60), phone: "+91 98150 70166", safetyScore: 71, status: "Suspended", region: "Punjab" },
  { id: "d8", name: "Ananya Reddy", license: "TS09 20210073378", licenseCategory: "LMV", licenseExpiry: daysFromNow(510), phone: "+91 96760 20111", safetyScore: 89, status: "Available", region: "Telangana" },
  { id: "d9", name: "Vikram Rathore", license: "RJ14 20200087712", licenseCategory: "HTV", licenseExpiry: daysFromNow(45), phone: "+91 94140 30133", safetyScore: 85, status: "On Trip", region: "Rajasthan" },
  { id: "d10", name: "Sanjay Menon", license: "TN22 20220022244", licenseCategory: "HMV", licenseExpiry: daysFromNow(730), phone: "+91 94440 50102", safetyScore: 93, status: "Off Duty", region: "Tamil Nadu" },
];


export const seedTrips: Trip[] = [
  { id: "t1", code: "TRP-2041", source: "Mumbai, MH", destination: "Pune, MH", vehicleId: "v2", driverId: "d2", cargoKg: 18500, plannedKm: 150, status: "Dispatched", createdAt: isoAgo(6), dispatchedAt: isoAgo(4) },
  { id: "t2", code: "TRP-2042", source: "Ahmedabad, GJ", destination: "Surat, GJ", vehicleId: "v5", driverId: "d5", cargoKg: 1600, plannedKm: 265, status: "Dispatched", createdAt: isoAgo(8), dispatchedAt: isoAgo(3) },
  { id: "t3", code: "TRP-2043", source: "Delhi, DL", destination: "Jaipur, RJ", vehicleId: "v10", driverId: "d9", cargoKg: 32000, plannedKm: 280, status: "Dispatched", createdAt: isoAgo(14), dispatchedAt: isoAgo(10) },
  { id: "t4", code: "TRP-2038", source: "Chennai, TN", destination: "Bengaluru, KA", vehicleId: "v1", driverId: "d1", cargoKg: 620, plannedKm: 350, actualKm: 358, fuelLiters: 42, revenue: 24500, status: "Completed", createdAt: isoAgo(48), dispatchedAt: isoAgo(46), completedAt: isoAgo(30) },
  { id: "t5", code: "TRP-2039", source: "Kochi, KL", destination: "Hyderabad, TS", vehicleId: "v6", driverId: "d6", cargoKg: 3100, plannedKm: 1050, actualKm: 1071, fuelLiters: 196, revenue: 88000, status: "Completed", createdAt: isoAgo(72), dispatchedAt: isoAgo(70), completedAt: isoAgo(52) },
  { id: "t6", code: "TRP-2044", source: "Lucknow, UP", destination: "Kanpur, UP", vehicleId: "v7", driverId: "d8", cargoKg: 15000, plannedKm: 90, status: "Draft", createdAt: isoAgo(2) },
  { id: "t7", code: "TRP-2045", source: "Gurugram, HR", destination: "Chandigarh, PB", vehicleId: "v12", driverId: "d10", cargoKg: 16800, plannedKm: 260, status: "Draft", createdAt: isoAgo(1) },
  { id: "t8", code: "TRP-2036", source: "Coimbatore, TN", destination: "Madurai, TN", vehicleId: "v4", driverId: "d3", cargoKg: 1280, plannedKm: 215, status: "Cancelled", createdAt: isoAgo(90) },
  { id: "t9", code: "TRP-2032", source: "Kolkata, WB", destination: "Ranchi, JH", vehicleId: "v1", driverId: "d1", cargoKg: 480, plannedKm: 405, actualKm: 411, fuelLiters: 48, revenue: 26800, status: "Completed", createdAt: isoAgo(120), completedAt: isoAgo(100) },
  { id: "t10", code: "TRP-2031", source: "Nagpur, MH", destination: "Bhopal, MP", vehicleId: "v7", driverId: "d6", cargoKg: 12400, plannedKm: 355, actualKm: 366, fuelLiters: 74, revenue: 42100, status: "Completed", createdAt: isoAgo(140), completedAt: isoAgo(120) },
];

export const seedMaintenance: MaintenanceLog[] = [
  { id: "m1", vehicleId: "v3", type: "Engine overhaul", notes: "Cylinder liner replacement, ~5 days at Bengaluru workshop", cost: 148000, openedAt: isoAgo(72) },
  { id: "m2", vehicleId: "v11", type: "Reefer unit service", notes: "Compressor swap at Hyderabad depot", cost: 82000, openedAt: isoAgo(30) },
  { id: "m3", vehicleId: "v1", type: "Oil change + tyre rotation", notes: "15W-40, all-terrain radial", cost: 12800, openedAt: isoAgo(240), closedAt: isoAgo(230) },
  { id: "m4", vehicleId: "v7", type: "Brake pads", notes: "Front axle overhaul", cost: 24500, openedAt: isoAgo(400), closedAt: isoAgo(390) },
];

export const seedFuel: FuelLog[] = [
  { id: "f1", vehicleId: "v1", tripId: "t4", liters: 42, cost: 4200, date: new Date(Date.now() - 30 * 3600_000).toISOString().slice(0, 10) },
  { id: "f2", vehicleId: "v6", tripId: "t5", liters: 196, cost: 19400, date: new Date(Date.now() - 52 * 3600_000).toISOString().slice(0, 10) },
  { id: "f3", vehicleId: "v1", tripId: "t9", liters: 48, cost: 4820, date: new Date(Date.now() - 100 * 3600_000).toISOString().slice(0, 10) },
  { id: "f4", vehicleId: "v7", tripId: "t10", liters: 74, cost: 7350, date: new Date(Date.now() - 120 * 3600_000).toISOString().slice(0, 10) },
  { id: "f5", vehicleId: "v2", liters: 210, cost: 21050, date: new Date(Date.now() - 4 * 3600_000).toISOString().slice(0, 10) },
];

export const seedExpenses: Expense[] = [
  { id: "e1", vehicleId: "v1", tripId: "t4", category: "Toll", amount: 1450, date: new Date().toISOString().slice(0, 10) },
  { id: "e2", vehicleId: "v6", tripId: "t5", category: "Parking", amount: 320, date: new Date().toISOString().slice(0, 10) },
  { id: "e3", vehicleId: "v2", category: "Toll", amount: 980, date: new Date().toISOString().slice(0, 10) },
];
