// voice/utils/env_guard.mjs
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

// --- Load .env from the repo root ---
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.warn(chalk.yellow(`⚠️  .env file not found at ${envPath}`));
}

/**
 * Normalize arguments so callers can pass either:
 *   requireEnv('A','B','C')  // varargs
 *   requireEnv(['A','B','C'])// array
 */
function normalizeVarList(args) {
  if (args.length === 1 && Array.isArray(args[0])) return args[0];
  return Array.from(args);
}

/**
 * Require specific environment variables to be present.
 * @param {string[]|...string} vars – List of required environment variable names.
 * Returns an object mapping each var name to its value from process.env.
 */
export function requireEnv(...args) {
  const vars = normalizeVarList(args);
  const missing = vars.filter(v => !process.env[v] || process.env[v].trim() === '');
  if (missing.length > 0) {
    const msg = `Missing required env var(s): ${missing.join(', ')}`;
    console.error(chalk.red(`✗ ${msg}`));
    throw new Error(msg);
  }
  console.log(chalk.green(`✓ Environment variables OK: ${vars.join(', ')}`));
  return vars.reduce((acc, v) => {
    acc[v] = process.env[v];
    return acc;
  }, {});
}

/**
 * Summarize selected env vars without revealing full secrets.
 * @param {string[]|...string} vars
 * Returns an object mapping each var name to a masked or '(not set)' value.
 */
export function summarizeEnv(...args) {
  const vars = normalizeVarList(args);

  const summary = {};
  vars.forEach(v => {
    if (process.env[v]) {
      const val = process.env[v];
      summary[v] = val.length > 10 ? `${val.slice(0, 6)}…${val.slice(-4)}` : val;
    } else {
      summary[v] = '(not set)';
    }
  });

  console.log(chalk.cyanBright(JSON.stringify(summary, null, 2)));
  return summary;
}

export default {
  requireEnv,
  summarizeEnv
};