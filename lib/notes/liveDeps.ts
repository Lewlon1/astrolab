/** Production wiring for processCapture: Sonnet on Bedrock, Madrid date. */

import type { SupabaseClient } from "@supabase/supabase-js";
import { invokeModelWithImages, MODELS } from "@/lib/bedrock";
import { todayInMadrid } from "@/lib/dailyActions";
import { buildSystemPrompt, buildUserPrompt } from "./prompt";
import type { ProcessDeps } from "./process";

export function liveDeps(supabase: SupabaseClient): ProcessDeps {
  return {
    supabase,
    model: MODELS.SONNET,
    today: todayInMadrid,
    transcribe: (images, captureDate) =>
      invokeModelWithImages(
        MODELS.SONNET,
        buildSystemPrompt(),
        buildUserPrompt(captureDate),
        images,
        // Room for the verbatim transcript plus the notes JSON for six pages.
        16000
      ),
  };
}
