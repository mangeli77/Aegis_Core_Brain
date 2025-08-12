import { requireEnv } from "#voice-utils/env_guard.mjs";
import '../../_env.mjs';

// scripts/test/test_api_keys.mjs
// Robust API key tester for OpenAI + ElevenLabs

import fetch from "node-fetch";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from repo root (two dirs up from scripts/test/)
const repoRoot = path.resolve(__dirname, "..", "..");
const envPath = path.join(repoRoot, ".env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  // Fallback to default .env resolution
  dotenv.config();
}

const openaiKey = process.env.OPENAI_API_KEY || "";
const elevenKey = process.env.ELEVENLABS_API_KEY || "";
const voiceId   = process.env.ELEVENLABS_VOICE_ID || ""; // optional but recommended

function mask(k) {
  if (!k) return "(empty)";
  if (k.length <= 8) return "*".repeat(k.length);
  return k.slice(0, 4) + "…" + k.slice(-4);
}

console.log("Repo root:", repoRoot);
console.log("ENV file :", fs.existsSync(envPath) ? envPath : "(default)");
console.log("OPENAI_API_KEY        :", mask(openaiKey));
console.log("ELEVENLABS_API_KEY    :", mask(elevenKey));
console.log("ELEVENLABS_VOICE_ID   :", voiceId || "(not set)");
console.log("");

// ---------- OpenAI test ----------
async function testOpenAI() {
  console.log("🧠 Testing OpenAI key (chat.completions)...");
  if (!openaiKey) {
    console.warn("  ⚠️  OPENAI_API_KEY is empty. Skipping.");
    return;
  }
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: "Say 'pong' only." }],
        temperature: 0,
      }),
    });

    const txt = await res.text();
    let data;
    try { data = JSON.parse(txt); } catch { data = txt; }

    if (res.ok && data?.choices?.[0]?.message?.content) {
      console.log("  ✅ OpenAI OK:", JSON.stringify(data.choices[0].message.content));
    } else {
      console.error("  ❌ OpenAI error:", res.status, res.statusText, data);
    }
  } catch (err) {
    console.error("  ❌ OpenAI fetch failed:", err?.message || err);
  }
}

// ---------- ElevenLabs tests ----------
async function testElevenUser() {
  console.log("\n🗣️  Testing ElevenLabs key (/v1/user)...");
  if (!elevenKey) {
    console.warn("  ⚠️  ELEVENLABS_API_KEY is empty. Skipping.");
    return false;
  }
  try {
    const res = await fetch("https://api.elevenlabs.io/v1/user", {
      headers: {
        "xi-api-key": elevenKey,
        Accept: "application/json",
      },
    });
    const txt = await res.text();
    let data; try { data = JSON.parse(txt); } catch { data = txt; }

    if (res.ok) {
      console.log("  ✅ ElevenLabs auth OK (user info retrieved).");
      return true;
    } else {
      console.error("  ❌ ElevenLabs /user error:", res.status, res.statusText, data);
      return false;
    }
  } catch (err) {
    console.error("  ❌ ElevenLabs /user failed:", err?.message || err);
    return false;
  }
}

async function testElevenVoiceLookup() {
  console.log("\n🔎 Testing ElevenLabs voice lookup...");
  if (!elevenKey) return false;
  if (!voiceId) {
    console.warn("  ⚠️  ELEVENLABS_VOICE_ID not set. Skipping voice lookup.");
    return false;
  }
  try {
    const url = `https://api.elevenlabs.io/v1/voices/${encodeURIComponent(voiceId)}`;
    const res = await fetch(url, {
      headers: {
        "xi-api-key": elevenKey,
        Accept: "application/json",
      },
    });
    const txt = await res.text();
    let data; try { data = JSON.parse(txt); } catch { data = txt; }

    if (res.ok && data?.voice_id === voiceId) {
      console.log(`  ✅ Voice found: ${data.name || voiceId}`);
      return true;
    } else {
      console.warn("  ⚠️ Voice not found or unauthorized:", res.status, res.statusText, data);
      return false;
    }
  } catch (err) {
    console.error("  ❌ ElevenLabs voice lookup failed:", err?.message || err);
    return false;
  }
}

async function testElevenTinyTTS() {
  console.log("\n🎧 Testing ElevenLabs tiny TTS probe (no file saved)...");
  if (!elevenKey || !voiceId) {
    console.warn("  ⚠️  Missing ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID. Skipping TTS probe.");
    return false;
  }
  try {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": elevenKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: "test ping",
        model_id: process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.35,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    });

    const ok = res.ok;
    const buf = ok ? Buffer.from(await res.arrayBuffer()) : null;
    if (ok && buf && buf.length > 200) {
      console.log(`  ✅ ElevenLabs TTS OK (received ${buf.length} bytes).`);
      return true;
    } else {
      const txt = await res.text().catch(() => "<no text>");
      console.error("  ❌ ElevenLabs TTS error:", res.status, res.statusText, txt);
      return false;
    }
  } catch (err) {
    console.error("  ❌ ElevenLabs TTS fetch failed:", err?.message || err);
    return false;
  }
}

await testOpenAI();
const authOK  = await testElevenUser();
const voiceOK = await testElevenVoiceLookup();
const ttsOK   = await testElevenTinyTTS();

console.log("\nSummary:");
console.log("  OpenAI            :", openaiKey ? "checked" : "skipped");
console.log("  ElevenLabs auth   :", authOK ? "OK" : "FAIL");
console.log("  ElevenLabs voice  :", voiceOK ? "OK" : (voiceId ? "NOT FOUND/NO ACCESS" : "skipped"));
console.log("  ElevenLabs TTS    :", ttsOK ? "OK" : "FAIL/skipped");
