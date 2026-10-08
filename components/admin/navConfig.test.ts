import { describe, expect, it } from "vitest";
import { activeGroup, activeItem, NAV_GROUPS, visibleNavGroups } from "./navConfig";

const hrefs = (labs?: string) => visibleNavGroups(labs).flatMap((g) => g.items.map((i) => i.href));

describe("visibleNavGroups", () => {
  it("has five groups, none empty", () => {
    const groups = visibleNavGroups(undefined);
    expect(groups.map((g) => g.label)).toEqual(["Today", "Clients", "Content", "Website", "Insights"]);
    for (const g of groups) expect(g.items.length).toBeGreaterThan(0);
  });

  it("hides labs tools by default", () => {
    expect(hrefs(undefined)).not.toContain("/admin/video-editor");
    expect(hrefs(undefined)).not.toContain("/admin/photoshop");
  });

  it("shows labs tools when the flag is on", () => {
    expect(hrefs("1")).toContain("/admin/video-editor");
    expect(hrefs("1")).toContain("/admin/photoshop");
  });

  it("every link is a unique /admin route", () => {
    const all = NAV_GROUPS.flatMap((g) => g.items.map((i) => i.href));
    expect(new Set(all).size).toBe(all.length);
    for (const h of all) expect(h.startsWith("/admin")).toBe(true);
  });
});

describe("activeGroup / activeItem", () => {
  const groups = visibleNavGroups(undefined);

  it("matches the dashboard only exactly", () => {
    expect(activeGroup("/admin", groups)).toBe("Today");
    expect(activeGroup("/admin/blog", groups)).toBe("Website");
  });

  it("matches nested pages to their section", () => {
    expect(activeGroup("/admin/blog/abc", groups)).toBe("Website");
    expect(activeGroup("/admin/engagement/accounts", groups)).toBe("Content");
    expect(activeItem("/admin/services/new", groups)?.label).toBe("Services & prices");
  });

  it("does not match on a shared prefix", () => {
    // /admin/leads must not light up for /admin/lead-queue
    expect(activeItem("/admin/lead-queue", groups)?.label).toBe("Lead Queue");
  });

  it("returns null for unknown or hidden routes", () => {
    expect(activeGroup("/admin/video-editor", groups)).toBeNull();
    expect(activeGroup("/admin/login", groups)).toBeNull();
  });
});
