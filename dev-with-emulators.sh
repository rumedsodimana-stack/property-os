#!/bin/bash
# ─── Hotel Singularity OS — Local Dev with Firebase Emulators ─────────────────
# Alternative to deploying: runs everything locally.
# Run this from the project root in ONE terminal, then:
#   VITE_USE_FIREBASE_EMULATORS=true npm run dev    ← in a second terminal

echo ""
echo "🔧  Hotel Singularity OS — Local Emulator Stack"
echo "────────────────────────────────────────────────"
echo ""
echo "This starts: Auth (9099) · Firestore (8085) · Functions (5001)"
echo ""
echo "In a second terminal, start the frontend with emulators:"
echo "  VITE_USE_FIREBASE_EMULATORS=true npm run dev"
echo ""
echo "Or add this line to .env.local and just run 'npm run dev':"
echo "  VITE_USE_FIREBASE_EMULATORS=true"
echo ""
echo "Starting emulators..."
echo ""

npx firebase emulators:start \
  --only auth,firestore,functions \
  --project singularity-property-os
