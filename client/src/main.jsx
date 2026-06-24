import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const goalsList = [
  "Understand community sentiment",
  "Find customer pain points",
  "Analyse competitors",
  "Identify content opportunities",
  "Find high-intent communities",
  "Improve positioning",
  "Discover objections",
  "Build authority"
];

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function App() {
  const [step, setStep] = useState(1);
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    website: "",
    budget: "",
    brandName: "",
    industry: "",
    description: "",
    competitors: "",
    audience: "",
    platforms: "",
    context: "",
    goals: []
  });

  const update = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const toggleGoal = (goal) => {
    setForm({
      ...form,
      goals: form.goals.includes(goal)
        ? form.goals.filter((g) => g !== goal)
        : [...form.goals, goal]
    });
  };

  const canContinue = () => {
    if (step === 1) return form.name && form.email && form.company;
    if (step === 2) return form.brandName && form.industry && form.description;
    return true;
  };

  const generateBrief = async () => {
    setLoading(true);
    setError("");
    setBrief("");

    try {
      const response = await fetch("/api/generate-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setBrief(data.brief);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(1);
    setBrief("");
    setError("");
    setForm({
      name: "",
      email: "",
      company: "",
      website: "",
      budget: "",
      brandName: "",
      industry: "",
      description: "",
      competitors: "",
      audience: "",
      platforms: "",
      context: "",
      goals: []
    });
  };

  return (
    <main className="app">
      <section className="card">
        <div className="topbar">
          <p className="eyebrow">The Redditrepreneur</p>
          <p className="step">Step {brief ? "Complete" : `${step} of 4`}</p>
        </div>

        <h1>Community Intelligence Brief Generator</h1>
        <p className="sub">
          Get a custom research brief for your brand, category, competitors and online communities.
        </p>

        {!brief && (
          <>
            {step === 1 && (
              <div className="form">
                <h2>Your details</h2>
                <Field label="Name">
                  <input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Your name" />
                </Field>
                <Field label="Email">
                  <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="you@company.com" />
                </Field>
                <Field label="Company">
                  <input value={form.company} onChange={(e) => update("company", e.target.value)} placeholder="Company name" />
                </Field>
                <Field label="Website">
                  <input value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="https://..." />
                </Field>
                <Field label="Research budget">
                  <select value={form.budget} onChange={(e) => update("budget", e.target.value)}>
                    <option value="">Select one</option>
                    <option>Just exploring</option>
                    <option>Under £500</option>
                    <option>£500 to £2,000</option>
                    <option>£2,000+</option>
                  </select>
                </Field>
              </div>
            )}

            {step === 2 && (
              <div className="form">
                <h2>Brand information</h2>
                <Field label="Brand name">
                  <input value={form.brandName} onChange={(e) => update("brandName", e.target.value)} placeholder="Brand name" />
                </Field>
                <Field label="Industry category">
                  <input value={form.industry} onChange={(e) => update("industry", e.target.value)} placeholder="SaaS, ecommerce, fintech, football, creator, etc." />
                </Field>
                <Field label="Brand description">
                  <textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="What does the brand do?" />
                </Field>
                <Field label="Competitors">
                  <textarea value={form.competitors} onChange={(e) => update("competitors", e.target.value)} placeholder="List key competitors or alternatives" />
                </Field>
              </div>
            )}

            {step === 3 && (
              <div className="form">
                <h2>Audience and platforms</h2>
                <Field label="Target audience">
                  <textarea value={form.audience} onChange={(e) => update("audience", e.target.value)} placeholder="Who are you trying to understand or reach?" />
                </Field>
                <Field label="Platforms to prioritise">
                  <input value={form.platforms} onChange={(e) => update("platforms", e.target.value)} placeholder="Reddit, TikTok, YouTube, X, LinkedIn, forums..." />
                </Field>
                <Field label="Additional context">
                  <textarea value={form.context} onChange={(e) => update("context", e.target.value)} placeholder="Anything else we should know?" />
                </Field>
              </div>
            )}

            {step === 4 && (
              <div>
                <h2>Research goals</h2>
                <div className="goals">
                  {goalsList.map((goal) => (
                    <button
                      type="button"
                      key={goal}
                      className={form.goals.includes(goal) ? "goal selected" : "goal"}
                      onClick={() => toggleGoal(goal)}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && <p className="error">{error}</p>}

            <div className="nav">
              {step > 1 && <button className="secondary" onClick={() => setStep(step - 1)}>Back</button>}
              {step < 4 && (
                <button disabled={!canContinue()} onClick={() => setStep(step + 1)}>
                  Next
                </button>
              )}
              {step === 4 && (
                <button onClick={generateBrief} disabled={loading}>
                  {loading ? "Generating..." : "Generate Brief"}
                </button>
              )}
            </div>
          </>
        )}

        {brief && (
          <div className="result">
            <h2>Your Community Intelligence Brief</h2>
            <pre>{brief}</pre>

            <div className="resultButtons">
              <button onClick={() => navigator.clipboard.writeText(brief)}>Copy Brief</button>
              <button className="secondary" onClick={reset}>New Brief</button>
              <a className="cta" href="https://theredditrepreneur.com/#contact" target="_blank" rel="noreferrer">
                Book a Community Intelligence Audit
              </a>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
