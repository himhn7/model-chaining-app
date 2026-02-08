import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createApp } from "../src/app.js";

async function withServer(app, runTest) {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();

  try {
    await runTest(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("POST /pipeline/run returns 400 for invalid payload", async () => {
  const app = createApp({ runPipelineImpl: async () => ({}) });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/pipeline/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ region: "" })
    });

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.error, "Validation failed");
    assert.ok(Array.isArray(body.details));
    assert.ok(body.details.length > 0);
  });
});

test("POST /pipeline/run returns merged pipeline response", async () => {
  const fakePipelineResult = {
    startedAt: "2026-02-08T00:00:00.000Z",
    completedAt: "2026-02-08T00:00:01.000Z",
    cloudPlans: [
      {
        provider: "AWS",
        services: [{ name: "EC2", reason: "Compute" }],
        estimatedMonthlyCostUsd: { min: 300, max: 400 },
        pros: ["Strong ecosystem"],
        cons: ["Pricing complexity"],
        architectureSummary: "AWS architecture"
      }
    ],
    finalRecommendation: {
      recommendedProvider: "AWS",
      rationale: "Best cost/performance",
      architectureSummary: "Final merged architecture",
      costTable: [{ provider: "AWS", min: 300, max: 400 }],
      tradeoffs: ["Potential lock-in"]
    }
  };

  const app = createApp({ runPipelineImpl: async () => fakePipelineResult });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/pipeline/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        region: "us-east-1",
        compute: { cpu: 4, ramGb: 16 },
        storage: { type: "ssd", sizeGb: 200 },
        databaseType: "postgresql",
        trafficLevel: "medium"
      })
    });

    assert.equal(response.status, 200);
    const body = await response.json();

    assert.equal(body.status, "completed");
    assert.equal(body.cloudPlans.length, 1);
    assert.equal(body.finalRecommendation.recommendedProvider, "AWS");
    assert.equal(body.stages.length, 3);
  });
});
