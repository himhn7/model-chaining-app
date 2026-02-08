import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 4000),
  xaiApiKey: process.env.XAI_API_KEY || "",
  xaiBaseUrl: process.env.XAI_BASE_URL || "https://api.x.ai/v1",
  xaiModel: process.env.XAI_MODEL || "grok-2-latest",
  requestTimeoutMs: Number(process.env.XAI_TIMEOUT_MS || 45000)
};
