import { requireEnv } from '../../core/voice/utils/env_guard.mjs';
import '../../_env.mjs';
// voice/utils/emotion_weights.mjs

/**
 * Analyze a transcribed phrase and return a basic emotion weight profile.
 * This is a naive implementation based on keyword associations.
 */

export function analyzeTone(text = '') {
  const weights = {
    neutral: 0,
    reflective: 0,
    assertive: 0,
    technical: 0,
    bonding: 0,
    confident: 0,
    defensive: 0,
    compassionate: 0,
    humorous: 0,
    sarcastic: 0,
    charismatic: 0,
    frustrated: 0,
    apologetic: 0,
  };

  const lc = text.toLowerCase();

  // Keyword mapping
  const patterns = [
    [/\bdata\b|\bmodel\b|\bprocess\b/, 'technical'],
    [/\bi believe\b|\bin my opinion\b/, 'reflective'],
    [/\blet’s go\b|\bdo it now\b/, 'assertive'],
    [/\btogether\b|\bteam\b/, 'bonding'],
    [/\bconfident\b|\bknow this\b/, 'confident'],
    [/\bno\b|\bthat’s wrong\b/, 'defensive'],
    [/\bsorry\b|\bmy fault\b/, 'apologetic'],
    [/\bhaha\b|\blol\b/, 'humorous'],
    [/\bsure, genius\b|\boh great\b/, 'sarcastic'],
    [/\btrust me\b|\byou can\b/, 'charismatic'],
    [/\bfrustrated\b|\bcan’t take\b/, 'frustrated'],
    [/\bcompassion\b|\bfeel for\b|\bunderstand\b/, 'compassionate'],
  ];

  let matched = false;

  for (const [regex, emotion] of patterns) {
    if (regex.test(lc)) {
      weights[emotion] += 1;
      matched = true;
    }
  }

  // If no specific emotion matched, boost neutral slightly
  if (!matched) weights.neutral += 1;

  return weights;
}