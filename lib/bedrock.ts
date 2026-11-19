import {
  BedrockRuntimeClient,
  ConverseCommand,
  type ConverseCommandOutput,
} from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Model IDs — check your Bedrock console for exact IDs available in your region
export const MODELS = {
  SONNET: "eu.anthropic.claude-sonnet-4-6", // creative + analytical tasks (Sonnet 4 retired Nov 2026)
  HAIKU: "eu.anthropic.claude-haiku-4-5-20251001-v1:0", // fast + cheap tasks
} as const;

export type ModelId = (typeof MODELS)[keyof typeof MODELS];

export async function invokeModel(
  modelId: ModelId,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 4096
): Promise<string> {
  const command = new ConverseCommand({
    modelId,
    system: [{ text: systemPrompt }],
    messages: [
      {
        role: "user",
        content: [{ text: userPrompt }],
      },
    ],
    inferenceConfig: {
      maxTokens,
      temperature: 0.7,
    },
  });

  const response = await client.send(command);

  const outputMessage = response.output?.message;
  if (!outputMessage?.content?.[0]) {
    throw new Error("Empty response from Bedrock");
  }

  const textBlock = outputMessage.content.find(
    (block) => "text" in block
  );
  if (!textBlock || !("text" in textBlock)) {
    throw new Error("No text content in Bedrock response");
  }

  return textBlock.text as string;
}

export type ImageInput = {
  bytes: Uint8Array;
  format: "jpeg" | "png" | "webp";
};

/**
 * Abort a vision call after this long so the caller can record the failure and
 * reply before Vercel kills the function at its 300s maxDuration.
 */
export const VISION_TIMEOUT_MS = 240_000;

export const TOO_LONG_MESSAGE =
  "This capture was too long to read in one go — try sending fewer pages at a time.";

/** Text of a Converse reply; throws if it was cut off at the token cap or empty. */
export function readVisionResponse(
  response: Pick<ConverseCommandOutput, "output" | "stopReason">
): string {
  if (response.stopReason === "max_tokens") throw new Error(TOO_LONG_MESSAGE);
  const textBlock = response.output?.message?.content?.find(
    (block) => "text" in block
  );
  if (!textBlock || !("text" in textBlock) || !textBlock.text) {
    throw new Error("No text content in Bedrock response");
  }
  return textBlock.text;
}

// Vision call: image blocks first, then the instruction text. Temperature 0 —
// transcription should be faithful, not creative.
export async function invokeModelWithImages(
  modelId: ModelId,
  systemPrompt: string,
  userPrompt: string,
  images: ImageInput[],
  maxTokens: number = 8192
): Promise<string> {
  const command = new ConverseCommand({
    modelId,
    system: [{ text: systemPrompt }],
    messages: [
      {
        role: "user",
        content: [
          ...images.map((img) => ({
            image: { format: img.format, source: { bytes: img.bytes } },
          })),
          { text: userPrompt },
        ],
      },
    ],
    inferenceConfig: {
      maxTokens,
      temperature: 0,
    },
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), VISION_TIMEOUT_MS);
  let response: ConverseCommandOutput;
  try {
    response = await client.send(command, { abortSignal: controller.signal });
  } catch (e) {
    if (controller.signal.aborted) {
      throw new Error(
        `Reading the page took longer than ${VISION_TIMEOUT_MS / 1000}s and was stopped.`
      );
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }

  return readVisionResponse(response);
}

// Helper to invoke and parse JSON response
export async function invokeModelJSON<T>(
  modelId: ModelId,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 4096
): Promise<T> {
  const raw = await invokeModel(modelId, systemPrompt, userPrompt, maxTokens);

  // Strip markdown code fences if present
  const cleaned = raw
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch (e) {
    throw new Error(
      `Failed to parse JSON from Bedrock response: ${e}. Raw: ${cleaned.substring(0, 200)}`
    );
  }
}
