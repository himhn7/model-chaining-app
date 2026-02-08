import test from "node:test";
import assert from "node:assert/strict";
import { runPipeline } from "../src/services/orchestrator.js";

const requirements = {
  region: "us-east-1",
  compute: { cpu: 4, ramGb: 16 },
  storage: { type: "ssd", sizeGb: 250 },
  databaseType: "postgresql",
  trafficLevel: "medium"
};

test("runPipeline executes AWS/GCP/Azure fan-out in parallel", async () => {
  const starts = {};

  const callModel = async (messages) => {
    const system = messages[0]?.content || "";

    if (system.includes("Final Recommendation Agent")) {
      return JSON.stringify({
        recommendedProvider: "AWS",
        rationale: "Best balance for this workload.",
        architectureSummary: "Use managed compute + managed database.",
        costTable: [
          { provider: "AWS", min: 320, max: 410 },
          { provider: "GCP", min: 340, max: 430 },
          { provider: "Azure", min: 360, max: 460 }
        ],
        tradeoffs: ["Vendor lock-in risk"]
      });
    }

    const provider = ["AWS", "GCP", "Azure"].find((name) => system.includes(name));
    starts[provider] = Date.now();

    await new Promise((resolve) => setTimeout(resolve, 180));

    return JSON.stringify({
      provider,
      services: [{ name: `${provider} Compute`, reason: "General purpose workloads" }],
      estimatedMonthlyCostUsd: { min: 300, max: 450 },
      pros: ["Mature ecosystem"],
      cons: ["Complex pricing"],
      architectureSummary: `${provider} plan summary`
    });
  };

  const t0 = Date.now();
  const result = await runPipeline(requirements, { callModel });
  const elapsedMs = Date.now() - t0;

  assert.equal(result.cloudPlans.length, 3);
  assert.equal(result.finalRecommendation.recommendedProvider, "AWS");

  const cloudStarts = Object.values(starts);
  assert.equal(cloudStarts.length, 3);
  const spreadMs = Math.max(...cloudStarts) - Math.min(...cloudStarts);

  assert.ok(spreadMs < 80, `Cloud calls should start close together, spread was ${spreadMs}ms`);
  assert.ok(elapsedMs < 450, `Pipeline took too long (${elapsedMs}ms); fan-out may not be parallel`);
});
