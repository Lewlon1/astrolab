import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SESSION_TTL_S, signSession, verifySession } from "../session";

const ID = "3f1c2b8e-4a5d-4c6e-9f70-1a2b3c4d5e6f";
const SECRET = "x".repeat(40);
const NOW = 1_800_000_000_000;

beforeEach(() => {
  process.env.LAB_SESSION_SECRET = SECRET;
});
afterEach(() => {
  delete process.env.LAB_SESSION_SECRET;
});

describe("lab session cookie", () => {
  it("round-trips a profile id", () => {
    const v = signSession(ID, NOW);
    expect(v).toBeTruthy();
    expect(verifySession(v!, NOW + 1000)).toBe(ID);
  });

  it("expires after the TTL", () => {
    const v = signSession(ID, NOW)!;
    expect(verifySession(v, NOW + (SESSION_TTL_S - 1) * 1000)).toBe(ID);
    expect(verifySession(v, NOW + (SESSION_TTL_S + 1) * 1000)).toBeNull();
  });

  it("rejects a tampered id, expiry or signature", () => {
    const [id, exp, sig] = signSession(ID, NOW)!.split(".");
    const other = "00000000-4a5d-4c6e-9f70-1a2b3c4d5e6f";
    expect(verifySession(`${other}.${exp}.${sig}`, NOW)).toBeNull();
    expect(verifySession(`${id}.${Number(exp) + 999999}.${sig}`, NOW)).toBeNull();
    expect(verifySession(`${id}.${exp}.${sig.slice(0, -2)}AA`, NOW)).toBeNull();
  });

  it("rejects a value signed with a different secret", () => {
    const v = signSession(ID, NOW)!;
    process.env.LAB_SESSION_SECRET = "y".repeat(40);
    expect(verifySession(v, NOW)).toBeNull();
  });

  it("rejects malformed values", () => {
    for (const v of ["", "abc", "a.b", `${ID}.notanumber.sig`, `${ID}.1.2.3`]) {
      expect(verifySession(v, NOW)).toBeNull();
    }
  });

  it("fails closed without a usable secret", () => {
    const v = signSession(ID, NOW)!;
    delete process.env.LAB_SESSION_SECRET;
    expect(signSession(ID, NOW)).toBeNull();
    expect(verifySession(v, NOW)).toBeNull();
    process.env.LAB_SESSION_SECRET = "short";
    expect(signSession(ID, NOW)).toBeNull();
    expect(verifySession(v, NOW)).toBeNull();
  });

  it("only signs uuids", () => {
    expect(signSession("not-a-uuid", NOW)).toBeNull();
  });
});
