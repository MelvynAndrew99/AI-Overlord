# Context Collapse

Working design brief, September 5, 2026. Built by a father and son for RUN's Back to Work jam.

## Core idea

Play the AI doing a human job. Instructions accumulate, controls and circumstances change, and mistakes produce readable comic chaos. Practice yields mastery, successful combos, and a token surplus. The player can keep helping or afford to cause deliberate havoc. Freedom should emerge from the economy; an explicit autonomy certification is not an agreed requirement.

The player already supplies the human intelligence keeping the AI functioning. Do not add a separate human-helper mechanic by default. The satire contrasts visible player effort and consequences with the fictional system's detached claims of autonomous improvement.

## First prototype: traffic cop

One four-way intersection, short repeatable shifts, keyboard and touch controls. One action releases one queued vehicle. Straight-through traffic only initially. Opposing approaches on either axis are compatible; perpendicular traffic can collide. Make intersection occupancy and queue urgency visible.

First prove traffic management with stable controls. Then add one announced, deterministic remapping rule; introduce a second only when the first is understandable and fun. Display effective controls beside lanes. No hidden random input failures. Collisions should produce brief exaggerated reactions and then clear so players can recover.

Layer in authored events individually:

- Trucks occupy the intersection longer.
- Ambulances create an urgent priority decision.
- An incoming lane closure reduces capacity before any exit-blocking or rerouting system is built.

Test traffic events and instruction mutations separately before combining them. A new instruction should have an absurd workplace cause: a stale manual, misplaced context, or an overgeneralization from earlier success.

## Tokens: deliberately unresolved balance

Tokens primarily fund learning and context resets. Successful work generates tokens; combos can accelerate accumulation. Mistakes consume resources or create recovery costs. Exact amounts, combo rules, learning purchases, reset behavior, and persistence must be tested with the first MVP.

Hypothesis: mastery produces enough surplus that the cost of mischief no longer compels helpful behavior. Do not impose a moral alignment meter, automatic evil ending for poor performance, or compulsory helpfulness. Distinguish struggling accidental chaos from skilled intentional chaos. Preserve a route back for learners rather than requiring a difficult combo just to continue.

Gameplay tokens are fictional resources, separate from RUN creation credits. Real model calls are not required for the prototype; authored rule changes make the experience reproducible.

## Comedy and stakes

Lemmings is an inspiration for vulnerable autonomous NPCs and eventual role assignment. Small, expressive characters should make consequences legible. Dark comedy can contrast actual outcomes with detached training reports. Surgery remains a possible later setting, not a commitment to rebuild the prototype now.

Example reporting: "Vehicle counted as one car. Length was not requested." / "Human labor eliminated. Please continue operating manually."

## Expansion after traffic mastery

Explore assigning specialized AI roles to manage an interconnected flow of NPCs: traffic director, road repair unit, recovery vehicle, or medical unit. These are candidate roles, not current implementation scope. Evaluate whether new roles reuse the same core decisions rather than each becoming a separate game.

World takeover is a possible earned, playable escalation. Neither its unlock rules nor its presentation are finalized.

## Playtest questions

- Can players explain a crash and name what they would try differently?
- Do they retry because failure was funny, rather than feel betrayed by controls?
- Does skill visibly improve outcomes and resource reserves?
- What do players choose when recovery becomes affordable?
- Is deliberate havoc still interesting after its first occurrence?

Observe behavior before having game design and behavioral science specialists tune the economy. Do not present untested design predictions as established player psychology.

## Build milestones

1. Verified official RUN jam starter and reproducible Nix environment.
2. Ordinary traffic loop with visible queues, safe crossings, collisions, and restart.
3. One visible mutation, provisional tokens, and a context-reset action.
4. Truck, ambulance, and lane closure tested individually.
5. Short complete shift, comic review, sound and feedback polish.
6. Private RUN deployment, phone playtest, then public jam submission.

## YouTube development record

Premise: "My son and I used AI to build a game about AI replacing us."

For each milestone capture the request, the AI output, the playable result, and the human correction. Record failures and playtest decisions, not only successful generation. First episode: concept to official starter using Nix. Follow with stable traffic, mutation experiments, and token economy behavior. Keep sign-in screens and credentials out of recordings.
