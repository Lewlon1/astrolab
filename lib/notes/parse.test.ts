import { describe, it, expect } from "vitest";
import { parseCaptureResponse } from "./parse";

const clean = {
  transcript: "raw text",
  notes: [
    {
      area: "clients",
      title: "Call with Sam",
      body: "Talked about Mars return.",
      client_name: "Sam",
      written_on: "2026-11-20",
      tasks: [{ text: "Send chart", due_on: "2026-11-25" }],
    },
    {
      area: "money",
      title: "Invoices",
      body: "Chase two invoices.",
      client_name: null,
      written_on: null,
      tasks: [],
    },
  ],
};

describe("parseCaptureResponse", () => {
  it("parses a clean JSON response", () => {
    const r = parseCaptureResponse(JSON.stringify(clean));
    expect(r.transcript).toBe("raw text");
    expect(r.notes).toHaveLength(2);
    expect(r.notes.map((n) => n.area)).toEqual(["clients", "money"]);
    expect(r.notes[0].tasks).toEqual([{ text: "Send chart", due_on: "2026-11-25" }]);
    expect(r.notes[0].client_name).toBe("Sam");
  });

  it("strips json code fences", () => {
    const fenced = "```json\n" + JSON.stringify(clean) + "\n```";
    expect(parseCaptureResponse(fenced)).toEqual(parseCaptureResponse(JSON.stringify(clean)));
  });

  it("maps unknown area to unsorted", () => {
    const r = parseCaptureResponse(
      JSON.stringify({ transcript: "t", notes: [{ ...clean.notes[0], area: "ideas" }] }),
    );
    expect(r.notes[0].area).toBe("unsorted");
  });

  it("keeps only valid ISO dates", () => {
    const mk = (d: string) =>
      parseCaptureResponse(
        JSON.stringify({
          transcript: "t",
          notes: [{ ...clean.notes[0], written_on: d, tasks: [{ text: "x", due_on: d }] }],
        }),
      ).notes[0];
    expect(mk("2026-11-20").written_on).toBe("2026-11-20");
    expect(mk("2026-11-20").tasks[0].due_on).toBe("2026-11-20");
    for (const bad of ["Friday", "2026-02-31", ""]) {
      expect(mk(bad).written_on).toBeNull();
      expect(mk(bad).tasks[0].due_on).toBeNull();
    }
  });

  it("drops empty tasks and trims text", () => {
    const r = parseCaptureResponse(
      JSON.stringify({
        transcript: "t",
        notes: [
          {
            ...clean.notes[0],
            tasks: [{ text: "  Do it  ", due_on: null }, { text: " ", due_on: null }],
          },
        ],
      }),
    );
    expect(r.notes[0].tasks).toEqual([{ text: "Do it", due_on: null }]);
  });

  it("fills a missing title from the first line of body, max 80 chars", () => {
    const long = "a".repeat(120);
    const r = parseCaptureResponse(
      JSON.stringify({
        transcript: "t",
        notes: [
          { ...clean.notes[0], title: "", body: "First line\nsecond" },
          { ...clean.notes[0], title: " ", body: long },
        ],
      }),
    );
    expect(r.notes[0].title).toBe("First line");
    expect(r.notes[1].title).toBe("a".repeat(80));
  });

  it("falls back to one unsorted note on non-JSON", () => {
    expect(parseCaptureResponse("I can't read this")).toEqual({
      transcript: "I can't read this",
      notes: [
        {
          area: "unsorted",
          title: "Unreadable page",
          body: "I can't read this",
          tasks: [],
          client_name: null,
          written_on: null,
        },
      ],
    });
  });

  it("falls back when notes array is empty but transcript exists", () => {
    const r = parseCaptureResponse(JSON.stringify({ transcript: "some text", notes: [] }));
    expect(r.transcript).toBe("some text");
    expect(r.notes).toEqual([
      {
        area: "unsorted",
        title: "Untitled page",
        body: "some text",
        tasks: [],
        client_name: null,
        written_on: null,
      },
    ]);
  });

  it("never throws on odd inputs", () => {
    const inputs = [
      "",
      "null",
      "[]",
      "[1,2]",
      "42",
      '"str"',
      '{"notes":"x"}',
      '{"notes":[{"tasks":null}]}',
      '{"notes":[null,1,"x"],"transcript":5}',
      '{"transcript":"t","notes":[{"area":5,"title":5,"body":5,"tasks":"x"}]}',
    ];
    for (const i of inputs) {
      const r = parseCaptureResponse(i);
      expect(typeof r.transcript).toBe("string");
      expect(r.notes.length).toBeGreaterThan(0);
    }
  });

  it("uses empty transcript when missing but notes exist", () => {
    const r = parseCaptureResponse(JSON.stringify({ notes: [clean.notes[0]] }));
    expect(r.transcript).toBe("");
    expect(r.notes).toHaveLength(1);
  });
});
