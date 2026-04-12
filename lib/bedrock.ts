import {
  BedrockRuntimeClient,
  ConverseCommand,
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
  SONNET: "eu.anthropic.claude-sonnet-4-20250514-v1:0", // creative + analytical tasks
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
