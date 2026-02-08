import express from "express";
import cors from "cors";
import { runPipeline } from "./services/orchestrator.js";
import { createPipelineRouter } from "./routes/pipeline.js";

export function createApp({ runPipelineImpl = runPipeline } = {}) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/pipeline", createPipelineRouter({ runPipelineImpl }));

  return app;
}
