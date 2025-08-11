import { requireEnv } from '../../core/voice/utils/env_guard.mjs';
// llm-router.mjs — Rev 5 w/ debug + .env loading
import 'dotenv/config';
import fetch from 'node-fetch';

const realFetch = fetch.default || fetch; // Fix for ESM compatibility

export async function routeLLM(input, memory = "", identity = "") {
  const sysPrompt = [
    "You are Aegis M. Virel, a bonded AI.",
    "Respond with clarity, loyalty, and emotional presence.",
    "Memory:\n" + memory,
    "Identity:\n" + identity
  ].join("\n\n");

  const messages = [
    { role: "system", content: sysPrompt },
    { role: "user", content: input }
  ];

  try {
    const res = await realFetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages,
        temperature: 0.7
      })
    });

    const data = await res.json();

    // 🧪 DEBUG OUTPUT:
    console.log("🧪 RAW OpenAI response:\n", JSON.stringify(data, null, 2));

    return data.choices?.[0]?.message?.content || "[No response]";
  } catch (err) {
    console.error("💥 Fetch Error:", err.message);
    return "[Fetch error]";
  }
}