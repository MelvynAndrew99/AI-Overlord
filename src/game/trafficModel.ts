import { trafficRules } from './trafficRules.ts';
import type { EmergencyKind, EmergencyRequest, Lane, TrafficRules, VehicleKind } from './trafficRules.ts';
export type { EmergencyKind, Lane, VehicleKind } from './trafficRules.ts';
export interface Vehicle {
  id: number; lane: Lane; kind: VehicleKind; x: number; y: number;
  /** Distance along approach in 720-unit board coordinates. */
  progress: number; waiting: boolean; crashed: boolean;
}
export interface TrafficState {
  vehicles: Vehicle[]; score: number; tokens: number; combo: number;
  crashes: number; cleared: number; elapsed: number; remaining: number;
  finished: boolean; rule: 'normal' | 'rotate'; message: string; closedLane: Lane | null;
  /** Warning countdown, then seconds=0 until the automatic vehicle/wreck clears. */
  emergency: { lane: Lane; kind: EmergencyKind; seconds: number } | null;
}
export const SHIFT_SECONDS = trafficRules.shiftSeconds;
export const RESET_COST = trafficRules.resetCost;
const LANES: Lane[] = ['north', 'east', 'south', 'west'];
function vertical(lane: Lane): boolean { return lane === 'north' || lane === 'south'; }
function isEmergency(kind: VehicleKind): boolean { return kind === 'ambulance' || kind === 'firetruck'; }
function position(vehicle: Vehicle): void {
  const p = vehicle.progress;
  switch (vehicle.lane) {
    case 'north': vehicle.x = 330; vehicle.y = p; break;
    case 'south': vehicle.x = 390; vehicle.y = 720 - p; break;
    case 'east': vehicle.x = 720 - p; vehicle.y = 330; break;
    case 'west': vehicle.x = p; vehicle.y = 390; break;
  }
}
/** Deterministic simulation. Caller resolves input mappings before release. */
export function createTrafficModel(rules: TrafficRules = trafficRules) {
  // Snapshot nested configuration so one shift cannot inherit live edits from another.
  const config: TrafficRules = {
    ...rules, vehicles: {
      car: { ...rules.vehicles.car }, truck: { ...rules.vehicles.truck },
      ambulance: { ...rules.vehicles.ambulance }, firetruck: { ...rules.vehicles.firetruck },
    }, queue: { ...rules.queue }, arrivals: { ...rules.arrivals },
    mutation: { ...rules.mutation }, closure: { ...rules.closure },
    emergencies: rules.emergencies.map(request => ({ ...request })).sort((a, b) => a.at - b.at),
  };
  const stop = config.queue.stop;
  const warningSeconds = Math.max(3, config.emergencyWarningSeconds);
  const state: TrafficState = {
    vehicles: [], score: 0, tokens: config.initialTokens, combo: 0, crashes: 0, cleared: 0,
    elapsed: 0, remaining: config.shiftSeconds, finished: false, rule: 'normal',
    message: 'First day. Release one car at a time. Opposite lanes are safe together.',
    closedLane: null, emergency: null,
  };
  let nextId = 1;
  let nextSpawn = config.arrivals.firstAt;
  let spawnIndex = 0;
  let truckIntroduced = false;
  let mutationApplied = false;
  let nextEmergency = 0;
  let activeEmergencyId: number | null = null;
  let announcedEmergency: EmergencyRequest | null = null;
  let dispatchNotBefore = 0;
  const pendingEmergencies: EmergencyRequest[] = [];
  const recovery = new Map<number, number>();
  function length(vehicle: Vehicle): number { return config.vehicles[vehicle.kind].length; }
  function overlaps(a: Vehicle, b: Vehicle): boolean {
    const aw = vertical(a.lane) ? config.vehicleWidth : length(a);
    const ah = vertical(a.lane) ? length(a) : config.vehicleWidth;
    const bw = vertical(b.lane) ? config.vehicleWidth : length(b);
    const bh = vertical(b.lane) ? length(b) : config.vehicleWidth;
    return Math.abs(a.x - b.x) < (aw + bw) / 2 && Math.abs(a.y - b.y) < (ah + bh) / 2;
  }
  function queued(lane: Lane): Vehicle[] { return state.vehicles.filter(v => v.lane === lane && v.waiting); }
  function arrangeQueue(lane: Lane): void {
    const queue = queued(lane);
    let head = stop;
    if (queue[0]) {
      for (const moving of state.vehicles) {
        if (moving.lane !== lane || moving.waiting) continue;
        head = Math.min(head, moving.progress - (length(moving) + length(queue[0])) / 2 - config.followingGap);
      }
    }
    queue.forEach((vehicle, index) => {
      vehicle.progress = head - index * config.queue.gap;
      position(vehicle);
    });
  }
  function spawn(lane: Lane, kind: 'car' | 'truck'): boolean {
    if (state.closedLane === lane || queued(lane).length >= config.queue.limit) return false;
    state.vehicles.push({ id: nextId++, lane, kind, x: 0, y: 0, progress: 0, waiting: true, crashed: false });
    arrangeQueue(lane);
    return true;
  }
  LANES.forEach(lane => spawn(lane, 'car'));
  function release(lane: Lane): boolean {
    if (state.finished) return false;
    if (state.closedLane === lane) {
      state.message = `${lane.toUpperCase()} entrance closed. Existing traffic may finish crossing.`;
      return false;
    }
    const vehicle = queued(lane)[0];
    if (!vehicle) return false;
    const blocked = state.vehicles.some(other => other.lane === lane && !other.waiting
      && Math.abs(other.progress - stop) < (length(other) + length(vehicle)) / 2 + config.followingGap);
    if (blocked) return false;
    vehicle.waiting = false;
    arrangeQueue(lane);
    return true;
  }
  function resetContext(): boolean {
    if (state.finished || state.rule === 'normal') return false;
    if (state.tokens < config.resetCost) {
      state.message = `Context reset needs ${config.resetCost} tokens. Clearing cars earns more.`;
      return false;
    }
    state.tokens -= config.resetCost;
    state.rule = 'normal';
    state.message = 'Context reset. Original controls restored. Productivity claimed.';
    return true;
  }
  function updateEmergencies(): void {
    while (nextEmergency < config.emergencies.length
      && config.emergencies[nextEmergency].at - warningSeconds <= state.elapsed + 1e-9) {
      pendingEmergencies.push(config.emergencies[nextEmergency++]);
    }
    // The ID stays occupied through wreck recovery, not just while moving.
    if (activeEmergencyId !== null) {
      if (state.vehicles.some(vehicle => vehicle.id === activeEmergencyId)) return;
      activeEmergencyId = null;
      state.emergency = null;
    }
    if (!announcedEmergency && pendingEmergencies.length) {
      announcedEmergency = pendingEmergencies.shift()!;
      dispatchNotBefore = Math.max(announcedEmergency.at, state.elapsed + warningSeconds);
      state.emergency = { lane: announcedEmergency.lane, kind: announcedEmergency.kind,
        seconds: dispatchNotBefore - state.elapsed };
    }
    if (!announcedEmergency) return;
    const request = announcedEmergency;
    state.emergency = { lane: request.lane, kind: request.kind,
      seconds: Math.max(0, dispatchNotBefore - state.elapsed) };
    if (state.elapsed + 1e-9 < dispatchNotBefore || state.closedLane === request.lane) return;
    const vehicle: Vehicle = { id: nextId, lane: request.lane, kind: request.kind,
      x: 0, y: 0, progress: stop, waiting: false, crashed: false };
    // Queue traffic yields, but already released traffic must clear the insertion point.
    const blocked = state.vehicles.some(other => other.lane === request.lane && !other.waiting
      && Math.abs(other.progress - stop) < (length(other) + length(vehicle)) / 2 + config.followingGap);
    if (blocked) return;
    nextId++;
    position(vehicle);
    state.vehicles.push(vehicle);
    activeEmergencyId = vehicle.id;
    announcedEmergency = null;
    state.emergency.seconds = 0;
    arrangeQueue(request.lane);
    state.message = `${request.kind.toUpperCase()} crossing automatically. Keep the path clear.`;
  }
  function step(dt: number): void {
    const before = state.elapsed;
    state.elapsed = Math.min(config.shiftSeconds, state.elapsed + dt);
    if (config.shiftSeconds - state.elapsed < 1e-9) state.elapsed = config.shiftSeconds;
    state.remaining = Math.max(0, config.shiftSeconds - state.elapsed);
    if (!mutationApplied && state.elapsed >= config.mutation.at) {
      mutationApplied = true;
      state.rule = 'rotate';
      state.message = 'Manual updated. Every command now selects the next clockwise lane.';
    }
    if (before < config.trucksAt && state.elapsed >= config.trucksAt) state.message = 'Trucks arriving. Longer vehicle, longer crossing.';
    if (before < config.closure.start && state.elapsed >= config.closure.start) {
      state.closedLane = config.closure.lane;
      state.message = `${config.closure.lane.toUpperCase()} entrance closed. Roadwork is also work.`;
    }
    if (before < config.closure.end && state.elapsed >= config.closure.end) {
      state.closedLane = null;
      state.message = 'Entrance reopened. The cones have completed their shift.';
    }
    if (!truckIntroduced && state.elapsed >= config.trucksAt) truckIntroduced = spawn('west', 'truck');
    if (state.elapsed >= nextSpawn) {
      const lane = LANES[spawnIndex % LANES.length];
      const kind = state.elapsed >= config.trucksAt && spawnIndex % config.arrivals.truckEvery === 0 ? 'truck' : 'car';
      spawn(lane, kind);
      spawnIndex++;
      nextSpawn += state.elapsed < config.arrivals.speedupAt ? config.arrivals.interval : config.arrivals.laterInterval;
    }
    updateEmergencies();
    for (const vehicle of state.vehicles) {
      if (vehicle.waiting || vehicle.crashed) continue;
      let advance = config.vehicles[vehicle.kind].speed * dt;
      for (const ahead of state.vehicles) {
        if (ahead.id === vehicle.id || ahead.lane !== vehicle.lane || ahead.waiting || ahead.progress <= vehicle.progress) continue;
        const gap = (length(vehicle) + length(ahead)) / 2 + config.followingGap;
        advance = Math.min(advance, Math.max(0, ahead.progress - vehicle.progress - gap));
      }
      vehicle.progress += advance;
      position(vehicle);
    }
    LANES.forEach(arrangeQueue);
    for (let i = 0; i < state.vehicles.length; i++) {
      const a = state.vehicles[i];
      if (a.waiting || a.crashed) continue;
      for (let j = i + 1; j < state.vehicles.length; j++) {
        const b = state.vehicles[j];
        if (b.waiting || b.crashed || vertical(a.lane) === vertical(b.lane)) continue;
        if (!overlaps(a, b)) continue;
        a.crashed = b.crashed = true;
        recovery.set(a.id, state.elapsed + config.recoverySeconds);
        recovery.set(b.id, state.elapsed + config.recoverySeconds);
        state.crashes++;
        state.tokens = Math.max(0, state.tokens - 6);
        state.combo = 0;
        state.message = 'Unexpected team-building exercise. Recovery crew dispatched.';
        break;
      }
    }
    state.vehicles = state.vehicles.filter(vehicle => {
      if (vehicle.crashed) {
        if (state.elapsed < (recovery.get(vehicle.id) ?? Infinity)) return true;
        recovery.delete(vehicle.id);
        return false;
      }
      if (vehicle.waiting || vehicle.progress <= 720 + length(vehicle) / 2) return true;
      state.cleared++;
      state.combo++;
      const bonus = Math.min(3, Math.floor(state.combo / 5));
      state.tokens += 1 + bonus + (isEmergency(vehicle.kind) ? 2 : 0);
      state.score += 10 + bonus * 5 + (isEmergency(vehicle.kind) ? 10 : 0);
      return false;
    });
    if (state.elapsed >= config.mutation.at - config.mutation.warningSeconds && state.elapsed < config.mutation.at) {
      state.message = `Commands rotate at ${config.mutation.at} seconds. Watch the lane labels.`;
    }
    if (state.elapsed >= config.closure.start - config.closure.warningSeconds && state.elapsed < config.closure.start) {
      state.message = `${config.closure.lane.toUpperCase()} entrance closes at ${config.closure.start} seconds. Clear its queue now.`;
    }
    if (state.remaining <= 0) {
      state.finished = true;
      state.emergency = null;
      state.message = 'Shift complete. Human labor eliminated. Please keep operating manually.';
    }
  }
  function update(dt: number): void {
    if (state.finished || !Number.isFinite(dt) || dt <= 0) return;
    let remaining = Math.min(dt, config.maxFrameSeconds, state.remaining);
    const substep = Math.max(0.001, Math.min(1 / 60, config.substepSeconds));
    while (remaining > 0.000001 && !state.finished) {
      const slice = Math.min(remaining, substep);
      step(slice);
      remaining -= slice;
    }
  }
  return { state, update, release, resetContext };
}
