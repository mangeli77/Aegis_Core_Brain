import { requireEnv } from '../../core/voice/utils/env_guard.mjs';
// Voice Emotion Weights – Rev 5
export const emotionProfiles = {
  calm: { stability: 0.7, similarity_boost: 0.9 },
  assertive: { stability: 0.3, similarity_boost: 0.8 },
  reflective: { stability: 0.8, similarity_boost: 0.95 },
  warm: { stability: 0.5, similarity_boost: 0.92 }
};
