#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import { synth } from "../../core/voice/synth/index.mjs";

const text = process.argv.slice(2).join(" ") || "Aegis online.";
const out = `${os.tmpdir()}/aegis_say.mp3`;

const buf = await synth(text, {});
fs.writeFileSync(out, buf);
console.log(JSON.stringify({ ok: true, bytes: buf.length, out }, null, 2));
try { await (await import('node:child_process')).execSync(`afplay "${out}"`, { stdio: 'ignore' }); } catch {}
