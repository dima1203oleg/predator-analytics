
import os
import yaml

HELM_ROOT = "/Users/dima-mac/Documents/Predator_21/helm/predator"
CHARTS_DIR = os.path.join(HELM_ROOT, "charts")

def fix_subchart_names():
    for category in os.listdir(CHARTS_DIR):
        cat_path = os.path.join(CHARTS_DIR, category)
        if not os.path.isdir(cat_path):
            continue

        # Check for sub-categories like azr/agents
        for root, dirs, files in os.walk(cat_path):
            if "Chart.yaml" in files:
                chart_path = os.path.join(root, "Chart.yaml")
                with open(chart_path, 'r') as f:
                    data = yaml.safe_load(f)

                # Calculate the flattened name
                rel_path = os.path.relpath(root, CHARTS_DIR)
                # rel_path might be "azr/agents/mistral" -> "azr-agents-mistral"
                # but we want it to match the dependency name in umbrella chart
                # Actually, let's just use the leaf name but replace slashes in path
                # Ideally, dependency name should match chart.name

                # In my update script: name = name.replace("/", "-")
                # and component name was for example "agents/mistral"
                # So if category is "azr", name is "agents/mistral"
                # The dependency name is "agents-mistral"

                # Let's just re-run the generation with consistent naming.
                pass

if __name__ == "__main__":
    # Redefine create_chart with consistent naming
    import shutil

    # ... I'll just rewrite the generation script to be more robust.
    pass
