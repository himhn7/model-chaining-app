export function extractJsonObject(text) {
  if (typeof text !== "string") {
    throw new Error("Model output is not a string");
  }

  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // Continue and try extracting fenced/plain JSON.
  }

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch) {
    return JSON.parse(fenceMatch[1]);
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
  }

  throw new Error("Unable to parse JSON from model output");
}
