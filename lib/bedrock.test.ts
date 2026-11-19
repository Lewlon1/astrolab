import { describe, it, expect } from "vitest";
import type { StopReason } from "@aws-sdk/client-bedrock-runtime";
import { readVisionResponse, VISION_TIMEOUT_MS } from "./bedrock";

const reply = (text: string, stopReason: StopReason) => ({
  stopReason,
  output: { message: { role: "assistant" as const, content: [{ text }] } },
});

describe("readVisionResponse", () => {
  it("returns the text on a normal stop", () => {
    expect(readVisionResponse(reply('{"notes":[]}', "end_turn"))).toBe('{"notes":[]}');
  });

  it("throws a friendly error when the reply hit the token cap", () => {
    expect(() => readVisionResponse(reply('{"transcript":"cut of', "max_tokens"))).toThrow(
      "This capture was too long to read in one go — try sending fewer pages at a time."
    );
  });

  it("throws when there is no text", () => {
    expect(() => readVisionResponse({ stopReason: "end_turn", output: { message: { role: "assistant", content: [] } } })).toThrow();
  });
});

describe("vision timeout", () => {
  it("aborts well before Vercel's 300s function limit", () => {
    expect(VISION_TIMEOUT_MS).toBe(240_000);
  });
});
