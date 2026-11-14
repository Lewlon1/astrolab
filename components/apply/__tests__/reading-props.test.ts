import * as React from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Reading from "@/components/lab/Reading";
import { composeReading } from "@/lib/lab/reading";
import { fakeChart } from "@/lib/lab/__tests__/helpers";
import { LAYER_LABELS, STANCE_LINE } from "@/content/lab/reading";
import { DEMO_STEPS } from "@/content/apply/demo";

// vitest compiles JSX with the classic runtime (no jsx option in vitest.config.ts), so the
// components look up a global React when they render.
(globalThis as { React?: typeof React }).React = React;

const reading = composeReading("Strength", fakeChart({ sun: "Leo", moon: "Pisces" }));
const html = (props: Record<string, unknown> = {}) =>
  renderToStaticMarkup(createElement(Reading, { reading, headingId: "r", ...props }));
const esc = (s: string) => s.replace(/'/g, "&#x27;");

describe("Reading options used by /apply", () => {
  it("defaults are unchanged for /lab: practice band and stance line both show", () => {
    const out = html();
    expect(out).toContain(LAYER_LABELS.test);
    expect(out).toContain(esc(reading.labNote.test));
    expect(out).toContain(esc(STANCE_LINE));
  });

  it("showPractice={false} holds back the practice step", () => {
    const out = html({ showPractice: false });
    expect(out).not.toContain(LAYER_LABELS.test);
    expect(out).not.toContain(esc(reading.labNote.test));
  });

  it("showStance={false} drops the stance line (its wording breaks the ad-page rules)", () => {
    expect(html({ showStance: false })).not.toContain(esc(STANCE_LINE));
  });
});

describe("demo steps", () => {
  it("run Draw → Map → Read → Test", () => {
    expect(DEMO_STEPS.map((s) => s.key)).toEqual(["draw", "map", "read", "test"]);
    for (const s of DEMO_STEPS) expect(s.lab && s.programme && s.title && s.rail).toBeTruthy();
  });
});
