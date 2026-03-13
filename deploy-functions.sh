#!/bin/bash
# ─── Hotel Singularity OS — Deploy Cloud Functions ────────────────────────────
# Run this from the project root: bash deploy-functions.sh

set -e

PROJECT="singularity-property-os"

echo ""
echo "🚀  Hotel Singularity OS — Function Deployer"
echo "──────────────────────────────────────────────"
echo ""

# Build
echo "⚙️  Building functions..."
cd functions
node node_modules/typescript/bin/tsc
cd ..
echo "✅  Build successful"
echo ""

# Deploy
echo "☁️   Deploying to Firebase project: $PROJECT"
echo ""
npx firebase deploy --only functions --project "$PROJECT"

echo ""
echo "✅  Functions deployed!"
echo ""
echo "   enrollHotel        → creates hotel + auth user + Firestore bootstrap"
echo "   checkHotelDomain   → real-time slug availability check"
echo "   completeHotelSetup → saves setup wizard config"
echo "   requestStaffAccess → staff onboarding flow"
echo "   approveStaffRequest"
echo "   rejectStaffRequest"
echo "   getPendingRequests"
echo "   getAccessibleHotels"
echo ""
echo "📋  Next: Set Stripe keys in Firebase config if billing is needed:"
echo "   firebase functions:config:set stripe.secret_key=\"sk_live_...\" --project $PROJECT"
echo "   firebase functions:config:set stripe.price_starter=\"price_...\" --project $PROJECT"
echo ""
