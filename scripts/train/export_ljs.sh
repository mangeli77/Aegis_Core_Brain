#!/bin/bash
set -e

DATASET_DIR="dataset/local_ljs_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$DATASET_DIR"

echo "Copying curated clips to $DATASET_DIR ..."
cp -v core/voice/output/train/high_confidence/*.wav "$DATASET_DIR" || true
cp -v core/voice/output/train/high_confidence/*.txt "$DATASET_DIR" || true

echo "Dataset export complete: $DATASET_DIR"