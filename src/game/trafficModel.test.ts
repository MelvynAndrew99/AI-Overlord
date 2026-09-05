import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createTrafficModel, RESET_COST } from './trafficModel.ts';
import type { Lane } from './trafficModel.ts';

type Model = ReturnType<typeof createTrafficModel>;
function advance(model: Model, seconds: number) {
  const steps = Math.round(seconds * 60);
  for (let i = 0; i < steps; i++) model.update(1 / 60);
}

for (const lanes of [['north', 'south'], ['east', 'west']] as Lane[][]) {
  test(`opposing ${lanes.join('/')} traffic uses separate safe paths`, () => {
    const model = createTrafficModel();
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
  const model = createTrafficModel();
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
  const model = createTrafficModel();
  model.release('north');
  advance(model, 1.2);
  model.release('east');
  advance(model, 3);
  assert.equal(model.state.crashes, 0);
  assert.equal(model.state.cleared, 2);
});

test('same-lane double taps cannot overlap cars, and following cars respect a truck', () => {
  const model = createTrafficModel();
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
  const model = createTrafficModel();
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
  const model = createTrafficModel();
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
  const model = createTrafficModel();
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
  const model = createTrafficModel();
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
  const first = createTrafficModel();
  first.release('north'); first.release('east');
  advance(first, 0.75);
  const second = createTrafficModel();
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
  const model = createTrafficModel();
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
  const model = createTrafficModel();
  advance(model, 2.1);
  model.release('north');
  const moving = model.state.vehicles.find(v => v.lane === 'north' && !v.waiting)!;
  const waiting = model.state.vehicles.find(v => v.lane === 'north' && v.waiting)!;
  assert.ok(moving.progress - waiting.progress >= 56);
  advance(model, 0.1);
  assert.ok(moving.progress - waiting.progress >= 56 - 1e-9);
});
