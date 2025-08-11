#!/usr/bin/env bash
. ./scripts/lib/env_guard.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OUTDIR="$ROOT/voice/wav_training"
SRCDIR="$OUTDIR/sources"
WAVDIR="$OUTDIR/wavs"
CLIPDIR="$OUTDIR/clips"
TRAINED="$ROOT/voice/trained"
LOGDIR="$ROOT/logs/voice/train_jarvis"
LISTFILE="$OUTDIR/el_mp3.lst"
DATASET_TARBALL="$TRAINED/jarvis_dataset_$(date -u +%Y%m%dT%H%M%SZ).tar.gz"

TARGET_SR=22050
LoudNorm="-filter:a loudnorm=I=-16:TP=-1.5:LRA=11:print_format=summary"
SilenceTrim="-af silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.25:stop_periods=1:stop_threshold=-45dB:stop_silence=0.35"

# Aim ~7 minutes (adjust as you like)
MAX_SECONDS=480

echo "🚀 Starting Jarvis voice cloning dataset builder ..."
mkdir -p "$SRCDIR" "$WAVDIR" "$CLIPDIR" "$TRAINED" "$LOGDIR"

command -v ffmpeg >/dev/null 2>&1 || { echo "❌ ffmpeg not found. Install ffmpeg first."; exit 1; }
command -v ffprobe >/dev/null 2>&1 || { echo "❌ ffprobe not found. Install ffmpeg (includes ffprobe)."; exit 1; }
echo "✔ ffmpeg found"

echo "🎯 Collecting ElevenLabs reference mp3s..."
node "$ROOT/scripts/voice/collect_el_refs.js" > "$LISTFILE"

if [[ ! -s "$LISTFILE" ]]; then
  echo "❌ No valid reference MP3s found."
  echo "   Tip: run: npm run doctor   (creates batch samples)"
  exit 1
fi

echo "✔ Reference list -> $LISTFILE"
echo "   $(wc -l < "$LISTFILE") files"

echo "📦 Staging sources -> $SRCDIR"
awk '!seen[$0]++' "$LISTFILE" | while IFS= read -r mp3; do
  base="$(basename "$mp3")"
  cp -f "$mp3" "$SRCDIR/$base"
done

echo "🎛  Converting/normalizing to $TARGET_SR Hz WAV and trimming silence..."
rm -f "$WAVDIR"/*.wav "$CLIPDIR"/*.wav

accum_seconds=0
while IFS= read -r mp3; do
  src="$SRCDIR/$(basename "$mp3")"
  wav="$WAVDIR/${src##*/}"
  wav="${wav%.mp3}.wav"

  # convert + normalize + mono + resample + silence trim
  if ! ffmpeg -hide_banner -loglevel error -y -i "$src" -vn -ac 1 -ar "$TARGET_SR" \
       $LoudNorm $SilenceTrim "$wav"; then
    echo "⚠️  ffmpeg failed for: $src (skipping)"
    continue
  fi

  dur=$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$wav" | awk '{printf "%.0f",$1}')
  [[ -z "$dur" ]] && dur=0

  if (( accum_seconds + dur > MAX_SECONDS )); then
    echo "⏹  Reached MAX_SECONDS=$MAX_SECONDS (have ${accum_seconds}s); stopping intake."
    break
  fi
  accum_seconds=$((accum_seconds + dur))
done < "$LISTFILE"

echo "⏱  Total staged duration ≈ ${accum_seconds}s (limit ${MAX_SECONDS}s)"
if (( accum_seconds < 120 )); then
  echo "⚠️  Only ~${accum_seconds}s collected. For a good clone, target 180–420s."
  echo "   Run: npm run doctor     (regenerates batch samples)"
fi

echo "✂️  Chunking into 6–12s clips -> $CLIPDIR"
for w in "$WAVDIR"/*.wav; do
  [[ -e "$w" ]] || continue
  base="$(basename "$w" .wav)"
  ffmpeg -hide_banner -loglevel error -y -i "$w" -f segment -segment_time 9 \
    -reset_timestamps 1 -c copy "$CLIPDIR/${base}_%03d.wav" || true
done

echo "📦 Packaging dataset -> $DATASET_TARBALL"
tar -czf "$DATASET_TARBALL" -C "$OUTDIR" wavs clips || {
  echo "⚠️  Could not create $DATASET_TARBALL (no wavs/clips?)"
}

MANIFEST="$TRAINED/jarvis_manifest_$(date -u +%Y%m%dT%H%M%SZ).txt"
{
  echo "dataset_root=$OUTDIR"
  echo "sample_rate=$TARGET_SR"
  echo "total_seconds=$accum_seconds"
  echo "wavs=$(ls -1 "$WAVDIR"/*.wav 2>/dev/null | wc -l | tr -d ' ')"
  echo "clips=$(ls -1 "$CLIPDIR"/*.wav 2>/dev/null | wc -l | tr -d ' ')"
  echo "tarball=$DATASET_TARBALL"
} > "$MANIFEST"

echo ""
echo "✅ Jarvis dataset build complete."
echo "   • Manifest: $MANIFEST"
echo "   • Tarball:  $DATASET_TARBALL"
echo "   • Next: feed this dataset to your chosen local TTS/voice‑clone trainer."