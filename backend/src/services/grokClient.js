import axios from "axios";
import { config } from "../config.js";

function normalizeContent(content) {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }
        if (part && typeof part.text === "string") {
          return part.text;
        }
        return "";
      })
      .join("\n");
  }

  return "";
}

export async function callGrokChat(messages) {
  if (!config.xaiApiKey) {
    throw new Error("XAI_API_KEY is missing. Set it in backend/.env before running the pipeline.");
  }

  const endpoint = `${config.xaiBaseUrl.replace(/\/$/, "")}/chat/completions`;

  try {
    const response = await axios.post(
      endpoint,
      {
        model: config.xaiModel,
        temperature: 0.2,
        messages
      },
      {
        timeout: config.requestTimeoutMs,
        headers: {
          Authorization: `Bearer ${config.xaiApiKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    const normalized = normalizeContent(content);

    if (!normalized) {
      throw new Error("xAI returned an empty completion");
    }

    return normalized;
  } catch (error) {
    const providerMessage = error.response?.data?.error?.message || error.response?.data?.message;
    const detail = providerMessage || error.message;
    throw new Error(`xAI request failed: ${detail}`);
  }
}
