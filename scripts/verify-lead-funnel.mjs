/**
 * Assertion harness for the lead funnel's pure logic.
 *
 * Dependency-free: run it with `node scripts/verify-lead-funnel.mjs`. Node 22.6+
 * strips the type annotations from the imported .ts module natively, so this
 * needs no build step, no loader and no test framework.
 *
 * What matters here is the stage machine. `stageRank` MUST agree with the
 * `lead_stage_rank` SQL function in migration 014 — if they drift, the UI will
 * offer stage moves that the database silently swallows, and the bug will look
 * like "the dropdown doesn't work".
 */

import assert from "node:assert/strict";

import {
  STAGE_ORDER,
  canAdvance,
  formatSource,
  formatStage,
  leadDisplayName,
  nextStageFor,
  normalizeSource,
  normalizeStage,
  normalizeTrack,
  stageRank,
} from "../lib/leadStages.ts";

let passed = 0;
function check(name, fn) {
  fn();
  passed++;
  console.log(`  ok  ${name}`);
}

console.log("\nstageRank — must mirror lead_stage_rank in migration 014");

check("ranks the spec vocabulary 1..5", () => {
  assert.equal(stageRank("lead"), 1);
  assert.equal(stageRank("code_delivered"), 2);
  assert.equal(stageRank("engaged"), 3);
  assert.equal(stageRank("booked"), 4);
  assert.equal(stageRank("client"), 5);
});

check("ranks the legacy vocabulary identically", () => {
  assert.equal(stageRank("new"), stageRank("lead"));
  assert.equal(stageRank("voice_note_sent"), stageRank("code_delivered"));
  assert.equal(stageRank("nurturing"), stageRank("engaged"));
  assert.equal(stageRank("converted"), stageRank("client"));
});

check("ranks unknown, null and undefined as 0", () => {
  assert.equal(stageRank("nonsense"), 0);
  assert.equal(stageRank(null), 0);
  assert.equal(stageRank(undefined), 0);
});

check("STAGE_ORDER is strictly increasing", () => {
  for (let i = 1; i < STAGE_ORDER.length; i++) {
    assert.ok(
      stageRank(STAGE_ORDER[i]) > stageRank(STAGE_ORDER[i - 1]),
      `${STAGE_ORDER[i]} should outrank ${STAGE_ORDER[i - 1]}`
    );
  }
});

console.log("\nnormalizeStage");

check("passes through the new vocabulary", () => {
  for (const s of STAGE_ORDER) assert.equal(normalizeStage(s), s);
});

check("maps every legacy value forward", () => {
  assert.equal(normalizeStage("new"), "lead");
  assert.equal(normalizeStage("voice_note_sent"), "code_delivered");
  assert.equal(normalizeStage("nurturing"), "engaged");
  assert.equal(normalizeStage("converted"), "client");
  assert.equal(normalizeStage("booked"), "booked");
});

check("falls back to lead for unknown/empty, without faking progress", () => {
  assert.equal(normalizeStage("nonsense"), "lead");
  assert.equal(normalizeStage(null), "lead");
  assert.equal(normalizeStage(""), "lead");
  // The fallback must not become a way to rank above nothing.
  assert.equal(stageRank("nonsense"), 0);
});

console.log("\ncanAdvance — mirrors trg_leads_no_stage_regression");

check("allows forward moves", () => {
  assert.ok(canAdvance("lead", "code_delivered"));
  assert.ok(canAdvance("lead", "client"));
  assert.ok(canAdvance("engaged", "booked"));
});

check("blocks backward moves", () => {
  assert.ok(!canAdvance("booked", "lead"));
  assert.ok(!canAdvance("client", "booked"));
  assert.ok(!canAdvance("engaged", "code_delivered"));
});

check("treats an equal stage as not an advance (webhook replay is a no-op)", () => {
  for (const s of STAGE_ORDER) assert.ok(!canAdvance(s, s));
});

check("works across the vocabulary boundary during the deploy window", () => {
  // A row still reading 'voice_note_sent' must not be re-advanced to
  // 'code_delivered', and must not be draggable back to 'lead'.
  assert.ok(!canAdvance("voice_note_sent", "code_delivered"));
  assert.ok(!canAdvance("voice_note_sent", "lead"));
  assert.ok(canAdvance("voice_note_sent", "engaged"));
  assert.ok(!canAdvance("converted", "booked"));
});

console.log("\nnextStageFor — warm leads skip code_delivered");

check("maps events to the stage they imply", () => {
  assert.equal(nextStageFor("cold", "capture"), "lead");
  assert.equal(nextStageFor("cold", "code_delivered"), "code_delivered");
  assert.equal(nextStageFor("cold", "dm_reply"), "engaged");
  assert.equal(nextStageFor("cold", "pricing_click"), "engaged");
  assert.equal(nextStageFor("cold", "booking"), "booked");
  assert.equal(nextStageFor("cold", "purchase"), "client");
});

check("a warm lead is never eligible for code_delivered", () => {
  assert.equal(nextStageFor("warm", "code_delivered"), null);
  // Everything else still applies to warm leads.
  assert.equal(nextStageFor("warm", "capture"), "lead");
  assert.equal(nextStageFor("warm", "booking"), "booked");
  assert.equal(nextStageFor("warm", "purchase"), "client");
});

check("returns null for events that imply no stage", () => {
  assert.equal(nextStageFor("cold", "opened"), null);
  assert.equal(nextStageFor("cold", "actioned"), null);
  assert.equal(nextStageFor("cold", "note"), null);
  assert.equal(nextStageFor("cold", "nonsense"), null);
});

console.log("\nsource and track");

check("normalizeSource maps legacy values and rejects unknowns", () => {
  assert.equal(normalizeSource("website_form"), "website");
  assert.equal(normalizeSource("event_qr"), "event");
  assert.equal(normalizeSource("mailerlite"), "mailerlite");
  assert.equal(normalizeSource("csv_import"), "csv_import");
  assert.equal(normalizeSource("nonsense"), null);
  assert.equal(normalizeSource(null), null);
});

check("normalizeTrack defaults to cold", () => {
  assert.equal(normalizeTrack("warm"), "warm");
  assert.equal(normalizeTrack("cold"), "cold");
  assert.equal(normalizeTrack(null), "cold");
  assert.equal(normalizeTrack("nonsense"), "cold");
});

check("every source the importers write has a label", () => {
  // These are the values sync/route.ts and upload/route.ts actually insert.
  for (const s of ["mailerlite", "csv_import", "manychat", "website"]) {
    assert.notEqual(formatSource(s), s, `${s} should have a human label`);
  }
});

check("formatStage labels legacy rows too", () => {
  assert.equal(formatStage("voice_note_sent"), "Code delivered");
  assert.equal(formatStage("client"), "Client");
});

console.log("\nleadDisplayName — email is nullable from migration 014");

check("prefers name, then email, then handle", () => {
  assert.equal(leadDisplayName({ name: "Ana", email: "a@b.c" }), "Ana");
  assert.equal(leadDisplayName({ name: null, email: "a@b.c" }), "a@b.c");
  assert.equal(
    leadDisplayName({ name: null, email: null, ig_handle: "gabs" }),
    "@gabs"
  );
});

check("does not double the @ on a handle that already has one", () => {
  assert.equal(leadDisplayName({ ig_handle: "@gabs" }), "@gabs");
});

check("never returns an empty string", () => {
  assert.equal(leadDisplayName({}), "Anonymous");
  assert.equal(leadDisplayName({ name: null, email: null, ig_handle: null }), "Anonymous");
});

console.log(`\n${passed} checks passed.\n`);
