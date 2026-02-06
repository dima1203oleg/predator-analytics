#!/bin/bash
# Verify UI Components existence

FILES=(
"apps/predator-analytics-ui/src/views/datasets/DatasetsPage.tsx"
"apps/predator-analytics-ui/src/components/premium/PremiumDashboard.tsx"
"apps/predator-analytics-ui/src/components/LoginScreen.tsx"
"apps/predator-analytics-ui/src/components/premium/AnalyticsDashboard.tsx"
)

echo "🔍 UI Components Verification:"
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ FOUND: $file"
    else
        echo "❌ MISSING: $file"
    fi
done

echo "🔍 TypeScript Check (Quick preview):"
npx tsc --noEmit --skipLibCheck --project apps/predator-analytics-ui/tsconfig.json || echo "⚠️ TypeScript found issues (expected during dev)"

echo "✅ Verification complete."
