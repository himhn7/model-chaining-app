const TRAFFIC_LEVELS = new Set(["low", "medium", "high"]);

function parsePositiveNumber(value, label, errors) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    errors.push(`${label} must be a positive number`);
    return null;
  }
  return parsed;
}

export function validatePipelineInput(input) {
  const errors = [];

  if (!input || typeof input !== "object") {
    return { isValid: false, errors: ["Request body must be a JSON object"], value: null };
  }

  const region = typeof input.region === "string" ? input.region.trim() : "";
  if (!region) {
    errors.push("region is required");
  }

  const compute = input.compute || {};
  const storage = input.storage || {};

  const cpu = parsePositiveNumber(compute.cpu, "compute.cpu", errors);
  const ramGb = parsePositiveNumber(compute.ramGb, "compute.ramGb", errors);
  const storageSizeGb = parsePositiveNumber(storage.sizeGb, "storage.sizeGb", errors);

  const storageType = typeof storage.type === "string" ? storage.type.trim() : "";
  if (!storageType) {
    errors.push("storage.type is required");
  }

  const databaseType = typeof input.databaseType === "string" ? input.databaseType.trim() : "";
  if (!databaseType) {
    errors.push("databaseType is required");
  }

  const trafficLevelRaw = typeof input.trafficLevel === "string" ? input.trafficLevel.trim().toLowerCase() : "";
  if (!TRAFFIC_LEVELS.has(trafficLevelRaw)) {
    errors.push("trafficLevel must be one of: low, medium, high");
  }

  if (errors.length > 0) {
    return { isValid: false, errors, value: null };
  }

  return {
    isValid: true,
    errors: [],
    value: {
      region,
      compute: {
        cpu,
        ramGb
      },
      storage: {
        type: storageType,
        sizeGb: storageSizeGb
      },
      databaseType,
      trafficLevel: trafficLevelRaw
    }
  };
}
