import { requireEnv } from "#voice-utils/env_guard.mjs";
// scripts/test/openai_probe.mjs
import 'dotenv/config';
import OpenAI from "openai";

// Load key from environment
const apiKey = process.env.OPENAI_API_KEY?.trim();

if (!apiKey) {
  console.error("❌ No OpenAI API key found in environment (.env.mjs).");
  process.exit(1);
}

const client = new OpenAI({ apiKey });

try {
  const list = await client.models.list();
  const modelNames = list.data.map(m => m.id);

  console.log("✅ OpenAI key is valid.");
  console.log("Available models:", modelNames);
  
} catch (err) {
  if (err.status === 401) {
    console.error("❌ OpenAI API key is invalid or unauthorized.");
  } else {
    console.error("❌ Error contacting OpenAI:", err.message);
  }
  process.exit(1);
}