/**
 * Admin feature flags.
 *
 * Labs tools (Video Editor, Photoshop) run on mock data and are not part of any
 * revenue path, so they are hidden by default. Set NEXT_PUBLIC_ADMIN_LABS=1 (e.g. on
 * a preview deploy) to bring them back. Code stays; only the nav link and route go.
 *
 * NEXT_PUBLIC_ so the client-side nav can read it; Next inlines it at build time.
 */

export type AdminFeature = "videoEditor" | "photoshop";

const LABS: readonly AdminFeature[] = ["videoEditor", "photoshop"];

export function isAdminFeatureOn(
  feature: AdminFeature,
  labsFlag: string | undefined = process.env.NEXT_PUBLIC_ADMIN_LABS
): boolean {
  if (LABS.includes(feature)) return labsFlag === "1";
  return true;
}
