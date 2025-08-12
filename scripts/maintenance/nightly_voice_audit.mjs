import { requireEnv } from "#voice-utils/env_guard.mjs";
// scripts/maintenance/nightly_voice_audit.mjs
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv"; dotenv.config({ path: ".env" });

const root = process.cwd();
const logDir = path.resolve(root, "logs/voice");
await fs.mkdir(logDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const logFile = path.join(logDir, `nightly_${stamp}.log`);

function run(label, cmd, args, env = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, ...env },
      cwd: root,
    });
    const lines = [];
    const pipe = (s, tag) => s.on("data", d => {
      const t = d.toString();
      lines.push(t);
      process.stdout.write(`[${label}] ${t}`);
    });
    pipe(p.stdout, "out");
    pipe(p.stderr, "err");
    p.on("close", code => {
      resolve({ code, out: lines.join("") });
    });
  });
}

async function appendLog(header, body) {
  const block = `\n\n===== ${header} @ ${new Date().toISOString()} =====\n${body}\n`;
  await fs.appendFile(logFile, block, "utf8");
}

async function main() {
  await appendLog("START", `Nightly voice audit starting…`);

  // 1) Rebuild + verify+retry (idempotent if everything is good)
  const rebuild = await run("rebuild",
    "node",
    ["scripts/maintenance/rebuild_variation_tests.mjs", "--verify-retry"],
  );
  await appendLog("REBUILD", rebuild.out);
  if (rebuild.code !== 0) {
    await appendLog("REBUILD_STATUS", `Non‑zero exit code: ${rebuild.code}`);
  }

  // 2) Cognition crossover: transcribe + top‑off any missing .txt (also idempotent)
  const cross = await run("cognition",
    "node",
    ["cognition/loops/voice_cognition_core.mjs"]
  );
  await appendLog("COGNITION", cross.out);
  if (cross.code !== 0) {
    await appendLog("COGNITION_STATUS", `Non‑zero exit code: ${cross.code}`);
  }

  // 3) Quick summary
  const summary = [
    `Rebuild exit:   ${rebuild.code}`,
    `Cognition exit: ${cross.code}`,
    `Log file:       ${logFile}`,
  ].join("\n");
  await appendLog("SUMMARY", summary);
  console.log("\n✅ Nightly voice audit complete.\n" + summary + "\n");
}

main().catch(async (err) => {
  const msg = (err && err.stack) ? err.stack : String(err);
  await appendLog("FATAL", msg);
  console.error("\n❌ Nightly voice audit crashed.\n", msg);
  process.exit(1);
});