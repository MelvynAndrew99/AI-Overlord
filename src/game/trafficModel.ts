export type Lane = 'north' | 'east' | 'south' | 'west';
export type VehicleKind = 'car' | 'truck' | 'ambulance';
export interface Vehicle {
  id: number; lane: Lane; kind: VehicleKind; x: number; y: number;
  /** Distance along approach in 720-unit board coordinates. */
  progress: number; waiting: boolean; crashed: boolean;
}
export interface TrafficState {
  vehicles: Vehicle[]; score: number; tokens: number; combo: number;
  crashes: number; cleared: number; elapsed: number; remaining: number;
  finished: boolean; rule: 'normal' | 'rotate'; message: string; closedLane: Lane | null;
}
export const SHIFT_SECONDS = 120;
export const RESET_COST = 8;
const LANES: Lane[] = ['north', 'east', 'south', 'west'];
const STOP = 240;
const QUEUE_GAP = 80;
const MAX_QUEUE = 4;
const RECOVERY_SECONDS = 1.2;
function vertical(lane: Lane): boolean { return lane === 'north' || lane === 'south'; }
function length(vehicle: Vehicle): number { return vehicle.kind === 'truck' ? 68 : 44; }
function position(vehicle: Vehicle): void {
  const p = vehicle.progress;
  switch (vehicle.lane) {
    case 'north': vehicle.x = 330; vehicle.y = p; break;
    case 'south': vehicle.x = 390; vehicle.y = 720 - p; break;
    case 'east': vehicle.x = 720 - p; vehicle.y = 330; break;
    case 'west': vehicle.x = p; vehicle.y = 390; break;
  }
}
function overlaps(a: Vehicle, b: Vehicle): boolean {
  const aw = vertical(a.lane) ? 26 : length(a);
  const ah = vertical(a.lane) ? length(a) : 26;
  const bw = vertical(b.lane) ? 26 : length(b);
  const bh = vertical(b.lane) ? length(b) : 26;
  return Math.abs(a.x - b.x) < (aw + bw) / 2 && Math.abs(a.y - b.y) < (ah + bh) / 2;
}
/** Deterministic simulation. Caller resolves input mappings before release. */
export function createTrafficModel() {
  const state: TrafficState = {
    vehicles: [], score: 0, tokens: 20, combo: 0, crashes: 0, cleared: 0,
    elapsed: 0, remaining: SHIFT_SECONDS, finished: false, rule: 'normal',
    message: 'First day. Release one car at a time. Opposite lanes are safe together.', closedLane: null,
  };
  let nextId = 1;
  let nextSpawn = 2;
  let spawnIndex = 0;
  let truckIntroduced = false;
  let ambulanceIntroduced = false;
  let mutationApplied = false;
  const recovery = new Map<number, number>();
  function queued(lane: Lane): Vehicle[] { return state.vehicles.filter(v => v.lane === lane && v.waiting); }
  function arrangeQueue(lane: Lane): void {
    const queue = queued(lane);
    let head = STOP;
    if (queue[0]) {
      for (const moving of state.vehicles) {
        if (moving.lane !== lane || moving.waiting || moving.progress < STOP) continue;
        head = Math.min(head, moving.progress - (length(moving) + length(queue[0])) / 2 - 12);
      }
    }
    queue.forEach((vehicle, index) => {
      vehicle.progress = head - index * QUEUE_GAP;
      position(vehicle);
    });
  }
  function spawn(lane: Lane, kind: VehicleKind): boolean {
    if (state.closedLane === lane || queued(lane).length >= MAX_QUEUE) return false;
    state.vehicles.push({ id: nextId++, lane, kind, x: 0, y: 0, progress: 0, waiting: true, crashed: false });
    arrangeQueue(lane);
    return true;
  }
  LANES.forEach(lane => spawn(lane, 'car'));
  function release(lane: Lane): boolean {
    if (state.finished) return false;
    if (state.closedLane === lane) {
      state.message = 'North entrance closed. Existing traffic may finish crossing.';
      return false;
    }
    const vehicle = queued(lane)[0];
    if (!vehicle) return false;
    // Fast double taps cannot place vehicles inside each other.
    const blocked = state.vehicles.some(other => other.lane === lane && !other.waiting
      && other.progress >= STOP && other.progress - STOP < (length(other) + length(vehicle)) / 2 + 12);
    if (blocked) return false;
    vehicle.waiting = false;
    arrangeQueue(lane);
    return true;
  }
  function resetContext(): boolean {
    if (state.finished || state.rule === 'normal') return false;
    if (state.tokens < RESET_COST) {
      state.message = 'Context reset needs 8 tokens. Clearing cars earns more.';
      return false;
    }
    state.tokens -= RESET_COST;
    state.rule = 'normal';
    state.message = 'Context reset. Original controls restored. Productivity claimed.';
    return true;
  }
  function step(dt: number): void {
    const before = state.elapsed;
    state.elapsed = Math.min(SHIFT_SECONDS, state.elapsed + dt);
    if (SHIFT_SECONDS - state.elapsed < 1e-9) state.elapsed = SHIFT_SECONDS;
    state.remaining = Math.max(0, SHIFT_SECONDS - state.elapsed);
    if (!mutationApplied && state.elapsed >= 45) {
      mutationApplied = true;
      state.rule = 'rotate';
      state.message = 'Manual updated. Every command now selects the next clockwise lane.';
    }
    if (before < 25 && state.elapsed >= 25) state.message = 'Trucks arriving. Longer vehicle, longer crossing.';
    if (before < 65 && state.elapsed >= 65) state.message = 'Ambulances arriving. Clear one for bonus tokens.';
    if (before < 85 && state.elapsed >= 85) {
      state.closedLane = 'north';
      state.message = 'North entrance closed for 10 seconds. Roadwork is also work.';
    }
    if (before < 95 && state.elapsed >= 95) {
      state.closedLane = null;
      state.message = 'North entrance reopened. The cones have completed their shift.';
    }
    // Retry authored introductions if their approach was full.
    if (!truckIntroduced && state.elapsed >= 25) truckIntroduced = spawn('west', 'truck');
    if (!ambulanceIntroduced && state.elapsed >= 65) ambulanceIntroduced = spawn('east', 'ambulance');
    if (state.elapsed >= nextSpawn) {
      const lane = LANES[spawnIndex % LANES.length];
      const kind: VehicleKind = state.elapsed >= 65 && spawnIndex % 9 === 0
        ? 'ambulance' : state.elapsed >= 25 && spawnIndex % 5 === 0 ? 'truck' : 'car';
      spawn(lane, kind);
      spawnIndex++;
      nextSpawn += state.elapsed < 45 ? 1.7 : 1.35;
    }
    for (const vehicle of state.vehicles) {
      if (vehicle.waiting || vehicle.crashed) continue;
      let advance = (vehicle.kind === 'truck' ? 150 : 220) * dt;
      // Follow slower trucks and stopped wrecks, avoiding same-lane overlap.
      for (const ahead of state.vehicles) {
        if (ahead.id === vehicle.id || ahead.lane !== vehicle.lane || ahead.waiting || ahead.progress <= vehicle.progress) continue;
        const gap = (length(vehicle) + length(ahead)) / 2 + 12;
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
        recovery.set(a.id, state.elapsed + RECOVERY_SECONDS);
        recovery.set(b.id, state.elapsed + RECOVERY_SECONDS);
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
      state.tokens += 1 + bonus + (vehicle.kind === 'ambulance' ? 2 : 0);
      state.score += 10 + bonus * 5 + (vehicle.kind === 'ambulance' ? 10 : 0);
      return false;
    });
    // Advance notices remain visible even if a collision occurs during their window.
    if (state.elapsed >= 40 && state.elapsed < 45) state.message = 'Commands rotate at 45 seconds. Watch the lane labels.';
    if (state.elapsed >= 80 && state.elapsed < 85) state.message = 'North entrance closes at 85 seconds. Clear its queue now.';
    if (state.remaining <= 0) {
      state.finished = true;
      state.message = 'Shift complete. Human labor eliminated. Please keep operating manually.';
    }
  }
  function update(dt: number): void {
    if (state.finished || !Number.isFinite(dt) || dt <= 0) return;
    // Backgrounded tabs never simulate minutes on resume; small steps avoid tunneling.
    let remaining = Math.min(dt, 0.25, state.remaining);
    while (remaining > 0.000001 && !state.finished) {
      const slice = Math.min(remaining, 1 / 60);
      step(slice);
      remaining -= slice;
    }
  }
  return { state, update, release, resetContext };
}
