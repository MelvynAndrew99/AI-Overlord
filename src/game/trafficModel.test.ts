import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createTrafficModel, RESET_COST } from './trafficModel.ts';
import type { Lane } from './trafficModel.ts';
import { trafficRules } from './trafficRules.ts';
import type { EmergencyRequest } from './trafficRules.ts';
// Isolate ordinary mechanics from scheduled automatic clears.
function ordinaryModel() { return createTrafficModel({ ...trafficRules, emergencies: [] }); }

type Model = ReturnType<typeof createTrafficModel>;
function advance(model: Model, seconds: number) {
  const steps = Math.round(seconds * 60);
  for (let i = 0; i < steps; i++) model.update(1 / 60);
}

for (const lanes of [['north', 'south'], ['east', 'west']] as Lane[][]) {
  test(`opposing ${lanes.join('/')} traffic uses separate safe paths`, () => {
    const model = ordinaryModel();
    const ids = model.state.vehicles.filter(v => lanes.includes(v.lane)).map(v => v.id);
    lanes.forEach(lane => assert.equal(model.release(lane), true));
    advance(model, 3);
    assert.equal(model.state.crashes, 0);
    assert.equal(model.state.cleared, 2);
    assert.equal(model.state.tokens, 22);
    assert.equal(model.state.vehicles.some(v => ids.includes(v.id)), false);
  });
}

test('simultaneous perpendicular cars collide physically, recover, and allow more work', () => {
  const model = ordinaryModel();
  model.release('north');
  model.release('east');
  advance(model, 0.25);
  assert.equal(model.state.crashes, 0, 'releasing perpendicular lanes is not itself a collision');
  advance(model, 0.5);
  assert.equal(model.state.crashes, 1);
  assert.equal(model.state.vehicles.filter(v => v.crashed).length, 2);
  assert.equal(model.state.tokens, 14);
  advance(model, 1.5);
  assert.equal(model.state.vehicles.some(v => v.crashed), false);
  assert.equal(model.state.cleared, 0, 'wreck removal is not successful work');
  model.release('south');
  advance(model, 3);
  assert.equal(model.state.cleared, 1);
  assert.equal(model.state.tokens, 15);
});

test('perpendicular cars separated in time do not collide', () => {
  const model = ordinaryModel();
  model.release('north');
  advance(model, 1.2);
  model.release('east');
  advance(model, 3);
  assert.equal(model.state.crashes, 0);
  assert.equal(model.state.cleared, 2);
});

test('same-lane double taps cannot overlap cars, and following cars respect a truck', () => {
  const model = ordinaryModel();
  advance(model, 2.1);
  const truck = model.state.vehicles.find(v => v.lane === 'north')!;
  truck.kind = 'truck'; // Fixture isolates truck-following from the authored schedule.
  assert.equal(model.release('north'), true);
  assert.equal(model.release('north'), false);
  advance(model, 0.6);
  assert.equal(model.release('north'), true);
  for (let i = 0; i < 90; i++) {
    model.update(1 / 60);
    const moving = model.state.vehicles.filter(v => v.lane === 'north' && !v.waiting);
    assert.ok(moving[0].progress - moving[1].progress >= 68 - 0.001);
  }
});

test('rotation is warned, authored once, and reset has an explicit nonrepeatable cost', () => {
  const model = ordinaryModel();
  assert.equal(model.resetContext(), false);
  assert.equal(model.state.tokens, 20);
  advance(model, 40.1);
  assert.equal(model.state.rule, 'normal');
  assert.match(model.state.message, /45 seconds/);
  advance(model, 5);
  assert.equal(model.state.rule, 'rotate');
  assert.equal(model.release('north'), true);
  assert.equal(model.state.vehicles.find(v => !v.waiting)?.lane, 'north', 'release receives already-resolved lane');
  const tokens = model.state.tokens;
  assert.equal(model.resetContext(), true);
  assert.equal(model.state.tokens, tokens - RESET_COST);
  assert.equal(model.state.rule, 'normal');
  assert.equal(model.resetContext(), false);
  advance(model, 5);
  assert.equal(model.state.rule, 'normal', 'the old memo must not immediately reapply');
});

test('insufficient reset funds do not prevent earning more tokens', () => {
  const model = ordinaryModel();
  advance(model, 45.1);
  model.state.tokens = 0;
  assert.equal(model.resetContext(), false);
  assert.equal(model.state.rule, 'rotate');
  model.release('north');
  advance(model, 3);
  assert.equal(model.state.cleared, 1);
  assert.equal(model.state.tokens, 1);
});

test('incoming north closure blocks release and new arrivals, then reopens', () => {
  const model = ordinaryModel();
  advance(model, 84.9);
  model.release('north');
  const crossing = model.state.vehicles.find(v => v.lane === 'north' && !v.waiting)!;
  advance(model, 0.2);
  assert.equal(model.state.closedLane, 'north');
  assert.equal(model.release('north'), false);
  advance(model, 3);
  assert.equal(model.state.vehicles.some(v => v.id === crossing.id), false);
  assert.equal(model.state.cleared, 1);
  advance(model, 7);
  assert.equal(model.state.closedLane, null);
  assert.equal(model.release('north'), true);
});

test('invalid/large deltas are safe and finished shifts are immutable', () => {
  const model = ordinaryModel();
  model.update(NaN); model.update(Infinity); model.update(-1);
  assert.equal(model.state.elapsed, 0);
  model.update(100);
  assert.ok(Math.abs(model.state.elapsed - 0.25) < 1e-9);
  advance(model, 120);
  assert.equal(model.state.finished, true);
  assert.equal(model.state.remaining, 0);
  const snapshot = JSON.stringify(model.state);
  model.update(1); model.release('east'); model.resetContext();
  assert.equal(JSON.stringify(model.state), snapshot);
});

test('new shifts isolate counters, vehicles, rules and recovery state', () => {
  const first = ordinaryModel();
  first.release('north'); first.release('east');
  advance(first, 0.75);
  const second = ordinaryModel();
  assert.equal(second.state.elapsed, 0);
  assert.equal(second.state.crashes, 0);
  assert.equal(second.state.tokens, 20);
  assert.equal(second.state.rule, 'normal');
  assert.equal(second.state.vehicles.length, 4);
  advance(first, 50);
  assert.equal(second.state.vehicles.every(v => v.waiting && !v.crashed), true);
  assert.equal(second.state.elapsed, 0);
});

test('consistent successful work accelerates token earnings at five-car combos', () => {
  const model = ordinaryModel();
  for (let i = 0; i < 6; i++) {
    const next = model.state.vehicles.find(v => v.waiting)!;
    assert.equal(model.release(next.lane), true);
    advance(model, 3);
  }
  assert.equal(model.state.combo, 6);
  assert.equal(model.state.cleared, 6);
  assert.equal(model.state.tokens, 28, 'first four earn1 each, fifth and sixth earn2 each');
  assert.equal(model.state.score, 70);
});

test('a queue never jumps inside its departing head vehicle', () => {
  const model = ordinaryModel();
  advance(model, 2.1);
  model.release('north');
  const moving = model.state.vehicles.find(v => v.lane === 'north' && !v.waiting)!;
  const waiting = model.state.vehicles.find(v => v.lane === 'north' && v.waiting)!;
  assert.ok(moving.progress - waiting.progress >= 56);
  advance(model, 0.1);
  assert.ok(moving.progress - waiting.progress >= 56 - 1e-9);
});


function emergencyVehicles(model: Model) {
  return model.state.vehicles.filter(v => v.kind === 'ambulance' || v.kind === 'firetruck');
}
function emergencyModel(emergencies: EmergencyRequest[]) {
  return createTrafficModel({ ...trafficRules, emergencies });
}

test('default no-input shift automatically clears both emergency kinds without crashes', () => {
  const model = createTrafficModel();
  const seen = new Set<string>();
  const warnings = new Set<string>();
  for (let frame = 0; frame < 7201; frame++) {
    model.update(1 / 60);
    assert.ok(emergencyVehicles(model).length <= 1);
    for (const vehicle of emergencyVehicles(model)) {
      assert.equal(vehicle.waiting, false);
      seen.add(vehicle.kind);
      assert.equal(model.state.emergency?.kind, vehicle.kind);
    }
    if (model.state.emergency && model.state.emergency.seconds >= 2.99) warnings.add(model.state.emergency.kind);
  }
  assert.deepEqual([...seen].sort(), ['ambulance', 'firetruck']);
  assert.deepEqual([...warnings].sort(), ['ambulance', 'firetruck']);
  assert.equal(model.state.crashes, 0);
  assert.equal(model.state.cleared, trafficRules.emergencies.length);
  assert.equal(model.state.tokens, 40);
  assert.equal(model.state.finished, true);
  assert.equal(model.state.emergency, null);
});

test('overlapping requests remain FIFO, each with three seconds warning and no emergency overlap', () => {
  const model = emergencyModel([
    { at: 4, lane: 'east', kind: 'ambulance' },
    { at: 4, lane: 'west', kind: 'firetruck' },
    { at: 4, lane: 'north', kind: 'ambulance' },
  ]);
  const seen = new Set<number>();
  const order: string[] = [];
  const warningStart = new Map<string, number>();
  for (let frame = 0; frame < 1500; frame++) {
    model.update(1 / 60);
    const warning = model.state.emergency;
    if (warning && warning.seconds > 0 && !warningStart.has(warning.lane)) warningStart.set(warning.lane, model.state.elapsed);
    const active = emergencyVehicles(model);
    assert.ok(active.length <= 1, 'emergency traversal and wreck identities are globally serialized');
    if (active[0] && !seen.has(active[0].id)) {
      seen.add(active[0].id);
      order.push(active[0].lane);
      assert.ok(model.state.elapsed - warningStart.get(active[0].lane)! >= 3 - 1e-8);
    }
  }
  assert.deepEqual(order, ['east', 'west', 'north']);
  assert.equal(model.state.cleared, 3);
  assert.equal(model.state.crashes, 0);
});

test('ordinary traffic can collide with a warned emergency and the next emergency waits for wreck removal', () => {
  const model = emergencyModel([
    { at: 4, lane: 'east', kind: 'ambulance' },
    { at: 4, lane: 'south', kind: 'firetruck' },
  ]);
  advance(model, 3);
  assert.equal(model.state.emergency?.lane, 'east');
  assert.ok(model.state.emergency!.seconds > 0.9);
  advance(model, 1);
  model.release('north');
  advance(model, 0.75);
  assert.equal(model.state.crashes, 1);
  assert.equal(emergencyVehicles(model).length, 1);
  assert.equal(emergencyVehicles(model)[0].crashed, true);
  assert.equal(model.state.emergency?.kind, 'ambulance');
  advance(model, 0.5);
  assert.equal(model.state.emergency?.kind, 'ambulance', 'wreck still owns dispatch slot');
  advance(model, 1);
  assert.equal(emergencyVehicles(model).length, 0);
  assert.equal(model.state.emergency?.kind, 'firetruck');
  assert.ok(model.state.emergency!.seconds > 2);
  advance(model, 6);
  assert.equal(model.state.cleared, 1);
  assert.equal(model.state.crashes, 1);
});

test('closed approach defers automatic dispatch without discarding the request', () => {
  const model = createTrafficModel({ ...trafficRules,
    closure: { lane: 'north', start: 3, end: 6, warningSeconds: 1 },
    emergencies: [{ at: 4, lane: 'north', kind: 'firetruck' }],
  });
  advance(model, 5);
  assert.equal(model.state.closedLane, 'north');
  assert.equal(emergencyVehicles(model).length, 0);
  assert.equal(model.state.emergency?.seconds, 0);
  advance(model, 1.1);
  assert.equal(model.state.closedLane, null);
  assert.equal(emergencyVehicles(model).length, 1);
  advance(model, 4);
  assert.equal(model.state.cleared, 1);
});

test('dispatch waits for same-approach clearance and the ordinary queue yields', () => {
  const model = emergencyModel([{ at: 4, lane: 'east', kind: 'ambulance' }]);
  advance(model, 3.9);
  model.release('east');
  advance(model, 0.15);
  assert.equal(emergencyVehicles(model).length, 0);
  assert.equal(model.state.emergency?.seconds, 0);
  advance(model, 0.3);
  const emergency = emergencyVehicles(model)[0];
  assert.ok(emergency);
  const preceding = model.state.vehicles.find(v => v.lane === 'east' && !v.waiting && v.kind === 'car')!;
  assert.ok(preceding.progress - emergency.progress >= 56 - 1e-8);
  const queued = model.state.vehicles.find(v => v.lane === 'east' && v.waiting)!;
  assert.ok(emergency.progress - queued.progress >= 56 - 1e-8);
  assert.equal(model.state.crashes, 0);
});

test('restart isolates emergency queue, configuration and active vehicle', () => {
  const requests: EmergencyRequest[] = [{ at: 4, lane: 'east', kind: 'ambulance' }];
  const first = emergencyModel(requests);
  requests[0].lane = 'west';
  advance(first, 4.1);
  assert.equal(emergencyVehicles(first)[0].lane, 'east', 'existing shift snapshots caller configuration');
  const second = emergencyModel(requests);
  assert.equal(Boolean(second.state.emergency), false);
  advance(second, 1.1);
  assert.equal(second.state.emergency?.lane, 'west');
  assert.equal(emergencyVehicles(second).length, 0);
  advance(first, 3);
  assert.equal(second.state.cleared, 0);
  assert.equal(second.state.elapsed < 2, true);
});
