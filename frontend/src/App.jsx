import { useMemo, useRef, useState } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"
});

const STAGES = [
  "Validate Input",
  "Fan-Out: AWS + GCP + Azure",
  "Fan-In: Final Recommendation"
];

const DEFAULT_FORM = {
  region: "us-east-1",
  cpu: 4,
  ramGb: 16,
  storageType: "ssd",
  storageSizeGb: 200,
  databaseType: "postgresql",
  trafficLevel: "medium"
};

function formatCost(cost) {
  if (!cost) {
    return "N/A";
  }
  return `$${cost.min} - $${cost.max}`;
}

export default function App() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [running, setRunning] = useState(false);
  const [activeStage, setActiveStage] = useState(-1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const stageTimers = useRef([]);

  const currentStageLabel = useMemo(() => {
    if (!running) {
      return result ? "Pipeline complete" : "Idle";
    }
    return STAGES[Math.max(activeStage, 0)] || STAGES[0];
  }, [running, activeStage, result]);

  function clearStageTimers() {
    stageTimers.current.forEach((timer) => clearTimeout(timer));
    stageTimers.current = [];
  }

  function scheduleVisualStageProgress() {
    setActiveStage(0);
    stageTimers.current.push(setTimeout(() => setActiveStage(1), 900));
    stageTimers.current.push(setTimeout(() => setActiveStage(2), 1900));
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    clearStageTimers();
    setError("");
    setResult(null);
    setRunning(true);
    scheduleVisualStageProgress();

    try {
      const payload = {
        region: form.region,
        compute: {
          cpu: Number(form.cpu),
          ramGb: Number(form.ramGb)
        },
        storage: {
          type: form.storageType,
          sizeGb: Number(form.storageSizeGb)
        },
        databaseType: form.databaseType,
        trafficLevel: form.trafficLevel
      };

      const response = await api.post("/pipeline/run", payload);
      setResult(response.data);
      setActiveStage(2);
    } catch (requestError) {
      const details = requestError.response?.data?.details;
      if (Array.isArray(details)) {
        setError(details.join(", "));
      } else if (typeof details === "string") {
        setError(details);
      } else {
        setError(requestError.message || "Pipeline failed");
      }
    } finally {
      clearStageTimers();
      setRunning(false);
    }
  }

  function handleReset() {
    clearStageTimers();
    setRunning(false);
    setActiveStage(-1);
    setError("");
    setResult(null);
    setForm(DEFAULT_FORM);
  }

  return (
    <div className="page">
      <main className="container">
        <h1>AI Multi-Cloud Infrastructure Planner</h1>
        <p className="subtitle">Fan-Out / Fan-In orchestration across AWS, GCP, and Azure via xAI Grok.</p>

        <form className="panel" onSubmit={handleSubmit}>
          <div className="grid">
            <label>
              Region
              <input name="region" value={form.region} onChange={handleChange} required />
            </label>
            <label>
              CPU (vCPU)
              <input name="cpu" type="number" min="1" value={form.cpu} onChange={handleChange} required />
            </label>
            <label>
              RAM (GB)
              <input name="ramGb" type="number" min="1" value={form.ramGb} onChange={handleChange} required />
            </label>
            <label>
              Storage Type
              <select name="storageType" value={form.storageType} onChange={handleChange}>
                <option value="ssd">SSD</option>
                <option value="hdd">HDD</option>
                <option value="object">Object Storage</option>
              </select>
            </label>
            <label>
              Storage Size (GB)
              <input
                name="storageSizeGb"
                type="number"
                min="1"
                value={form.storageSizeGb}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Database Type
              <select name="databaseType" value={form.databaseType} onChange={handleChange}>
                <option value="postgresql">PostgreSQL</option>
                <option value="mysql">MySQL</option>
                <option value="mongodb">MongoDB</option>
                <option value="redis">Redis</option>
              </select>
            </label>
            <label>
              Traffic Level
              <select name="trafficLevel" value={form.trafficLevel} onChange={handleChange}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
          </div>

          <div className="actions">
            <button type="submit" disabled={running}>{running ? "Running..." : "Run Pipeline"}</button>
            <button type="button" onClick={handleReset} disabled={running}>Reset</button>
          </div>
        </form>

        <section className="panel">
          <h2>Pipeline Stage</h2>
          <p className="current-stage">Current stage: {currentStageLabel}</p>
          <ul className="stages">
            {STAGES.map((stage, index) => {
              const state = running
                ? index < activeStage
                  ? "completed"
                  : index === activeStage
                    ? "active"
                    : "pending"
                : result
                  ? "completed"
                  : "pending";

              return (
                <li key={stage} className={`stage ${state}`}>
                  <span>{stage}</span>
                </li>
              );
            })}
          </ul>
        </section>

        {error && (
          <section className="panel error">
            <h2>Error</h2>
            <p>{error}</p>
          </section>
        )}

        {result && (
          <>
            <section className="panel">
              <h2>Fan-Out Results</h2>
              <div className="cards">
                {result.cloudPlans.map((plan) => (
                  <article key={plan.provider} className="card">
                    <h3>{plan.provider}</h3>
                    <p><strong>Estimated Monthly Cost:</strong> {formatCost(plan.estimatedMonthlyCostUsd)}</p>
                    <p><strong>Architecture:</strong> {plan.architectureSummary || "N/A"}</p>
                    <p><strong>Services:</strong></p>
                    <ul>
                      {plan.services.map((service) => (
                        <li key={`${plan.provider}-${service.name}`}>
                          {service.name}: {service.reason || "No detail"}
                        </li>
                      ))}
                    </ul>
                    <p><strong>Pros:</strong> {plan.pros.join("; ") || "N/A"}</p>
                    <p><strong>Cons:</strong> {plan.cons.join("; ") || "N/A"}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="panel">
              <h2>Final Recommendation (Fan-In)</h2>
              <p><strong>Recommended Provider:</strong> {result.finalRecommendation.recommendedProvider}</p>
              <p><strong>Rationale:</strong> {result.finalRecommendation.rationale}</p>
              <p><strong>Architecture Summary:</strong> {result.finalRecommendation.architectureSummary}</p>

              <h3>Cost Table</h3>
              <table>
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Min (USD)</th>
                    <th>Max (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  {result.finalRecommendation.costTable.map((row) => (
                    <tr key={`cost-${row.provider}`}>
                      <td>{row.provider}</td>
                      <td>{row.min}</td>
                      <td>{row.max}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
