// Indian states + cities used across filters and the route map.
// City coordinates are approximate lon/lat (deg). They're only used to plot
// stylised markers inside a fixed SVG viewBox so absolute accuracy isn't required.

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

// State code → full state name (for parsing trip strings like "Mumbai, MH")
export const STATE_CODE: Record<string, string> = {
  AP: "Andhra Pradesh",
  AS: "Assam",
  BR: "Bihar",
  CG: "Chhattisgarh",
  DL: "Delhi",
  GA: "Goa",
  GJ: "Gujarat",
  HR: "Haryana",
  HP: "Himachal Pradesh",
  JH: "Jharkhand",
  KA: "Karnataka",
  KL: "Kerala",
  MP: "Madhya Pradesh",
  MH: "Maharashtra",
  OD: "Odisha",
  PB: "Punjab",
  RJ: "Rajasthan",
  TN: "Tamil Nadu",
  TS: "Telangana",
  UP: "Uttar Pradesh",
  UK: "Uttarakhand",
  WB: "West Bengal",
};

export interface City {
  name: string;
  state: string;
  lon: number;
  lat: number;
}

export const INDIAN_CITIES: City[] = [
  { name: "Mumbai", state: "Maharashtra", lon: 72.87, lat: 19.07 },
  { name: "Pune", state: "Maharashtra", lon: 73.85, lat: 18.52 },
  { name: "Nagpur", state: "Maharashtra", lon: 79.09, lat: 21.14 },
  { name: "Delhi", state: "Delhi", lon: 77.1, lat: 28.7 },
  { name: "Gurugram", state: "Haryana", lon: 77.02, lat: 28.45 },
  { name: "Chandigarh", state: "Punjab", lon: 76.77, lat: 30.73 },
  { name: "Jaipur", state: "Rajasthan", lon: 75.79, lat: 26.91 },
  { name: "Ahmedabad", state: "Gujarat", lon: 72.57, lat: 23.02 },
  { name: "Surat", state: "Gujarat", lon: 72.83, lat: 21.17 },
  { name: "Bengaluru", state: "Karnataka", lon: 77.59, lat: 12.97 },
  { name: "Chennai", state: "Tamil Nadu", lon: 80.27, lat: 13.08 },
  { name: "Coimbatore", state: "Tamil Nadu", lon: 76.96, lat: 11.02 },
  { name: "Madurai", state: "Tamil Nadu", lon: 78.12, lat: 9.93 },
  { name: "Kochi", state: "Kerala", lon: 76.27, lat: 9.93 },
  { name: "Hyderabad", state: "Telangana", lon: 78.49, lat: 17.38 },
  { name: "Kolkata", state: "West Bengal", lon: 88.36, lat: 22.57 },
  { name: "Ranchi", state: "Jharkhand", lon: 85.33, lat: 23.35 },
  { name: "Lucknow", state: "Uttar Pradesh", lon: 80.94, lat: 26.85 },
  { name: "Kanpur", state: "Uttar Pradesh", lon: 80.32, lat: 26.44 },
  { name: "Bhopal", state: "Madhya Pradesh", lon: 77.41, lat: 23.26 },
];

/** Extract "State" from strings like "Mumbai, MH" using the two-letter suffix. */
export function stateFromLocation(loc?: string): string | null {
  if (!loc) return null;
  const m = loc.match(/,\s*([A-Z]{2})\s*$/);
  return m ? (STATE_CODE[m[1]] ?? null) : null;
}

/** Extract "City" (segment before the comma). */
export function cityFromLocation(loc?: string): string | null {
  if (!loc) return null;
  const [c] = loc.split(",");
  return c?.trim() || null;
}

/** Project lon/lat into a fixed SVG viewBox for a stylised India map. */
export function project(lon: number, lat: number, w = 320, h = 340) {
  // India roughly spans lon 68→97 and lat 8→37
  const x = ((lon - 68) / (97 - 68)) * w;
  const y = h - ((lat - 6) / (37 - 6)) * h;
  return { x, y };
}
