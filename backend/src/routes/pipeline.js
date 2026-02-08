import { Router } from "express";
import { validatePipelineInput } from "../utils/validation.js";

export function createPipelineRouter({ runPipelineImpl }) {
  const router = Router();

  router.post("/run", async (req, res) => {
    const validated = validatePipelineInput(req.body);
    if (!validated.isValid) {
      return res.status(400).json({
        error: "Validation failed",
        details: validated.errors
      });
    }

    try {
      const pipelineResult = await runPipelineImpl(validated.value);
      return res.json({
        status: "completed",
        stages: [
          { id: "validate", label: "Validate Input", status: "completed" },
          { id: "fan_out", label: "Fan-Out (AWS/GCP/Azure)", status: "completed" },
          { id: "fan_in", label: "Fan-In Final Recommendation", status: "completed" }
        ],
        input: validated.value,
        ...pipelineResult
      });
    } catch (error) {
      return res.status(500).json({
        error: "Pipeline execution failed",
        details: error.message
      });
    }
  });

  return router;
}
