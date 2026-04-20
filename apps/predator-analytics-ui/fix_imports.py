import os

files = [
    "src/components/dimensional/GoogleAdvisoryPanel.tsx",
    "src/components/premium/AnalyticsDashboard.tsx",
    "src/components/super/CortexVisualizer.tsx",
    "src/components/super/EvolutionDashboard.tsx",
    "src/components/super/AutonomousLearningStack.tsx",
    "src/components/user/UserDashboard.tsx",
    "src/components/user/DailyGazette.tsx",
    "src/components/nas/NasArenaView.tsx",
    "src/components/nas/NasProvidersView.tsx",
    "src/components/nas/NasLeaderboardView.tsx",
    "src/components/llm/LLMDspyView.tsx",
    "src/components/llm/LLMInferenceView.tsx",
    "src/components/llm/LLMTrainingView.tsx",
    "src/components/databases/GraphDBView.tsx",
    "src/components/databases/VectorDBView.tsx",
    "src/components/databases/CalibrationView.tsx",
    "src/components/settings/FeatureTogglesGrid.tsx",
    "src/components/settings/BrainTrainerConfig.tsx",
    "src/components/settings/ApiKeysConfig.tsx"
]

base_path = "/Users/Shared/Predator_60/apps/predator-analytics-ui"

for rel_path in files:
    full_path = os.path.join(base_path, rel_path)
    if os.path.exists(full_path):
        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        new_content = content.replace("from '../TacticalCard'", "from '../ui/TacticalCard'")
        new_content = new_content.replace('from "../TacticalCard"', 'from "../ui/TacticalCard"')
        
        if new_content != content:
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {rel_path}")
        else:
            print(f"No changes needed for {rel_path}")
    else:
        print(f"File not found: {rel_path}")
