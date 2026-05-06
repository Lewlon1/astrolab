// TODO Phase 2: replace with real birth data + dynamic personal-hit calculation
// in the FastAPI Lambda using pyswisseph. Until then, these illustrative 15°
// values let the personal-hits UI render with placeholder data.

import type { Sign } from "./types";

export const GABS_NATAL: Record<string, { sign: Sign; degree: number }> = {
  Sun: { sign: "Pisces", degree: 15 },
  Moon: { sign: "Sagittarius", degree: 15 },
  Ascendant: { sign: "Taurus", degree: 15 },
};
