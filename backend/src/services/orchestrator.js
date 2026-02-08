import { callGrokChat } from "./grokClient.js";
import { extractJsonObject } from "../utils/json.js";

const PROVIDERS = ["AWS", "GCP", "Azure"];

function asStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter(Boolean);
}

function normalizeCost(cost) {
  const minRaw = Number(cost?.min ?? cost?.minimum ?? 0);
  const maxRaw = Number(cost?.max ?? cost?.maximum ?? minRaw);

  const min = Number.isFinite(minRaw) && minRaw >= 0 ? minRaw : 0;
  const max = Number.isFinite(maxRaw) && maxRaw >= min ? maxRaw : min;

  return { min, max };
}

function normalizeServices(services) {
  if (!Array.isArray(services)) {
    return [];
  }

  return services
    .map((service) => {
      const name = typeof service?.name === "string" ? service.name.trim() : "";
      const reason = typeof service?.reason === "string" ? service.reason.trim() : "";
      if (!name) {
        return null;
      }
      return { name, reason };
    })
    .filter(Boolean);
}

function buildCloudMessages(provider, requirements) {
  return [
    {
      role: "system",
      content: `You are the ${provider} agent in a multi-cloud planning pipeline. Return strict JSON only.`
    },
    {
      role: "user",
      content: [
        "Create an infrastructure plan for this workload.",
        "Return JSON with this exact schema:",
        "{",
        '  "provider": "' + provider + '",',
        '  "services": [{"name": "", "reason": ""}],',
        '  "estimatedMonthlyCostUsd": {"min": 0, "max": 0},',
        '  "pros": [""],',
        '  "cons": [""],',
        '  "architectureSummary": ""',
        "}",
        "Use realistic cloud services and rough monthly ranges.",
        `Infrastructure requirements: ${JSON.stringify(requirements)}`
      ].join("\n")
    }
  ];
}

function normalizeCloudPlan(provider, parsed) {
  return {
    provider,
    services: normalizeServices(parsed.services),
    estimatedMonthlyCostUsd: normalizeCost(parsed.estimatedMonthlyCostUsd),
    pros: asStringArray(parsed.pros),
    cons: asStringArray(parsed.cons),
    architectureSummary: typeof parsed.architectureSummary === "string" ? parsed.architectureSummary.trim() : ""
  };
}

function buildFinalMessages(requirements, cloudPlans) {
  return [
    {
      role: "system",
      content: "You are the Final Recommendation Agent in a fan-in stage. Return strict JSON only."
    },
    {
      role: "user",
      content: [
        "Compare the provider plans and choose the best fit.",
        "Return JSON with this exact schema:",
        "{",
        '  "recommendedProvider": "AWS|GCP|Azure",',
        '  "rationale": "",',
        '  "architectureSummary": "",',
        '  "costTable": [{"provider": "", "min": 0, "max": 0}],',
        '  "tradeoffs": [""]',
        "}",
        `Requirements: ${JSON.stringify(requirements)}`,
        `Provider plans: ${JSON.stringify(cloudPlans)}`
      ].join("\n")
    }
  ];
}

function normalizeFinalRecommendation(parsed, cloudPlans) {
  const fallbackCostTable = cloudPlans.map((plan) => ({
    provider: plan.provider,
    min: plan.estimatedMonthlyCostUsd.min,
    max: plan.estimatedMonthlyCostUsd.max
  }));

  const costTable = Array.isArray(parsed.costTable)
    ? parsed.costTable
        .map((row) => {
          const provider = typeof row?.provider === "string" ? row.provider.trim() : "";
          if (!provider) {
            return null;
          }
          return {
            provider,
            min: Number.isFinite(Number(row.min)) ? Number(row.min) : 0,
            max: Number.isFinite(Number(row.max)) ? Number(row.max) : 0
          };
        })
        .filter(Boolean)
    : fallbackCostTable;

  return {
    recommendedProvider:
      typeof parsed.recommendedProvider === "string" && parsed.recommendedProvider.trim()
        ? parsed.recommendedProvider.trim()
        : cloudPlans[0].provider,
    rationale: typeof parsed.rationale === "string" ? parsed.rationale.trim() : "",
    architectureSummary: typeof parsed.architectureSummary === "string" ? parsed.architectureSummary.trim() : "",
    costTable,
    tradeoffs: asStringArray(parsed.tradeoffs)
  };
}

export async function runPipeline(requirements, dependencies = {}) {
  const callModel = dependencies.callModel || callGrokChat;
  const startedAt = new Date().toISOString();

  const cloudPlans = await Promise.all(
    PROVIDERS.map(async (provider) => {
      const raw = await callModel(buildCloudMessages(provider, requirements));
      const parsed = extractJsonObject(raw);
      return normalizeCloudPlan(provider, parsed);
    })
  );

  const finalRaw = await callModel(buildFinalMessages(requirements, cloudPlans));
  const finalParsed = extractJsonObject(finalRaw);
  const finalRecommendation = normalizeFinalRecommendation(finalParsed, cloudPlans);

  return {
    startedAt,
    completedAt: new Date().toISOString(),
    cloudPlans,
    finalRecommendation
  };
}
