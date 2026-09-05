export type Lane = 'north' | 'east' | 'south' | 'west';
export type EmergencyKind = 'ambulance' | 'firetruck';
export type VehicleKind = 'car' | 'truck' | EmergencyKind;
export interface EmergencyRequest { at: number; lane: Lane; kind: EmergencyKind }
export interface TrafficRules {
  shiftSeconds: number;
  resetCost: number;
  recoverySeconds: number;
  initialTokens: number;
  maxFrameSeconds: number;
  substepSeconds: number;
  vehicleWidth: number;
  followingGap: number;
  vehicles: Record<VehicleKind, { length: number; speed: number }>;
  queue: { stop: number; gap: number; limit: number };
  arrivals: { firstAt: number; interval: number; laterInterval: number; speedupAt: number; truckEvery: number };
  trucksAt: number;
  mutation: { at: number; warningSeconds: number };
  closure: { lane: Lane; start: number; end: number; warningSeconds: number };
  /** Earliest dispatch times. A delayed request stays FIFO and gets its own warning. */
  emergencies: readonly EmergencyRequest[];
  emergencyWarningSeconds: number;
}

/** Edit this file to tune the prototype. Gameplay uses no hidden random dispatch. */
export const trafficRules: TrafficRules = {
  shiftSeconds: 120,
  resetCost: 8,
  recoverySeconds: 1.2,
  initialTokens: 20,
  maxFrameSeconds: 0.25,
  substepSeconds: 1 / 60,
  vehicleWidth: 26,
  followingGap: 12,
  vehicles: {
    car: { length: 44, speed: 220 },
    truck: { length: 68, speed: 150 },
    ambulance: { length: 44, speed: 220 },
    firetruck: { length: 68, speed: 180 },
  },
  queue: { stop: 240, gap: 80, limit: 4 },
  arrivals: { firstAt: 2, interval: 1.7, laterInterval: 1.35, speedupAt: 45, truckEvery: 5 },
  trucksAt: 25,
  mutation: { at: 45, warningSeconds: 5 },
  closure: { lane: 'north', start: 85, end: 95, warningSeconds: 5 },
  emergencyWarningSeconds: 3,
  emergencies: [
    { at: 12, lane: 'east', kind: 'ambulance' },
    { at: 30, lane: 'north', kind: 'firetruck' },
    { at: 48, lane: 'west', kind: 'ambulance' },
    { at: 66, lane: 'south', kind: 'firetruck' },
    { at: 84, lane: 'east', kind: 'ambulance' },
    { at: 102, lane: 'north', kind: 'firetruck' },
  ],
};
