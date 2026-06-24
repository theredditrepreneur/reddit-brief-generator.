import express from "express";
import cors from "cors";
import path from "path";
import { Resend } from "resend";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function required(value, name) {
  if (!value || String(value).trim().length === 0) {
    throw new Error(`${name} is required`);
  }
}

async function sendLeadEmail(payload, brief) {
  if (!process.env.RESEND_API_KEY || !process.env.LEAD_TO_EMAIL || !process.env.LEAD_FROM_EMAIL) {
    console.log("Resend not configured. Skipping lead email.");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const subject = `New Community Intelligence Brief Lead: ${payload.company || payload.brandName}`;

  const text = `
NEW COMMUNITY INTELLIGENCE BRIEF LEAD

CONTACT
Name: ${payload.name}
Email: ${payload.email}
Company: ${payload.company}
Website: ${payload.website || "Not provided"}
Budget: ${payload.budget || "Not provided"}

BRAND
Brand name: ${payload.brandName}
Industry: ${payload.industry}
Description: ${payload.description}
Competitors: ${payload.competitors || "Not provided"}

AUDIENCE
Target audience: ${payload.audience || "Not provided"}
Platforms: ${payload.platforms || "Not provided"}
Additional context: ${payload.context || "Not provided"}

GOALS
${(payload.goals || []).join(", ") || "None selected"}

GENERATED BRIEF
${brief}
`;

  const { error } = await resend.emails.send({
    from: process.env.LEAD_FROM_EMAIL,
    to: [process.env.LEAD_TO_EMAIL],
    replyTo: payload.email,
    subject,
    text
  });

  if (error) {
    console.error("Resend email error:", error);
  }
}
app.post("/api/generate-brief", async (req, res) => {
  try {
    const payload = req.body;

    required(payload.name, "Name");
    required(payload.email, "Email");
    required(payload.company, "Company");
    required(payload.brandName, "Brand name");
    required(payload.industry, "Industry");
    required(payload.description, "Description");

    const prompt = `
You are The Redditrepreneur Community Intelligence Brief Generator.

Create a strategic Community Intelligence Brief for this brand.

CONTACT CONTEXT
Name: ${payload.name}
Company: ${payload.company}
Website: ${payload.website || "Not provided"}
Research budget: ${payload.budget || "Not provided"}

BRAND CONTEXT
Brand name: ${payload.brandName}
Industry/category: ${payload.industry}
Description: ${payload.description}
Competitors: ${payload.competitors || "Not provided"}

AUDIENCE CONTEXT
Target audience: ${payload.audience || "Not provided"}
Platforms to prioritise: ${payload.platforms || "Reddit, TikTok, YouTube, X, niche forums"}
Additional context: ${payload.context || "Not provided"}

RESEARCH GOALS
${(payload.goals || []).join(", ") || "No goals selected"}

Create the brief with these sections:

1. Brief Overview
2. Research Questions
3. Community Signals To Track
4. Platforms & Specific Communities To Investigate
5. Competitor Intelligence Scope
6. Success Metrics
7. Strategic Context
8. Recommended Next Step

Tone:
- Strategic
- Clear
- Human
- Specific to the brand
- The Redditrepreneur voice
- Do not sound like generic marketing software

Important:
Do not end with “Ready when you are” or address the user by name in the final sentence.
Give enough value for the user to understand what should be investigated.
Do not complete the full audit.
Position the Community Intelligence Audit as the natural next step.
`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: prompt
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      return res.status(500).json({ error: "The brief could not be generated. Please try again." });
    }

    const brief =
      data.output_text ||
      data.output?.[0]?.content?.[0]?.text ||
      "Brief generated, but no text was returned.";

    await sendLeadEmail(payload, brief);

    res.json({ brief });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Something went wrong." });
  }
});

app.use(express.static(path.join(__dirname, "client", "dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Community Intelligence Brief Generator running on port ${PORT}`);
});
