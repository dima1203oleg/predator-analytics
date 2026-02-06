
import os
import yaml

HELM_ROOT = "/Users/dima-mac/Documents/Predator_21/charts"
UMBRELLA_DIR = os.path.join(HELM_ROOT, "predator-umbrella")
OS_CHARTS_DIR = HELM_ROOT # Where the category folders live

# Define the structure based on what generate_v30_helm.py produces
# We need to scan the directory to find all generated charts
def find_all_charts():
    charts = []
    if not os.path.exists(OS_CHARTS_DIR):
        print(f"Chats dir {OS_CHARTS_DIR} does not exist")
        return []

    for category in os.listdir(OS_CHARTS_DIR):
        cat_path = os.path.join(OS_CHARTS_DIR, category)
        if os.path.isdir(cat_path) and category != "predator-umbrella":
            # Search recursively or just one level?
            # generate_v30_helm.py creates: charts/category/component_path
            # Example: charts/api/gateway
            for root, dirs, files in os.walk(cat_path):
                if "Chart.yaml" in files:
                    # This is a chart
                    # Get relative path from umbrella dir? No, dependencies can be local paths
                    # Path from charts root
                    rel_path = os.path.relpath(root, OS_CHARTS_DIR)
                    name = rel_path.replace("/", "-")
                    # Chart name inside Chart.yaml might be different, let's read it
                    try:
                        with open(os.path.join(root, "Chart.yaml"), 'r') as f:
                            chart_data = yaml.safe_load(f)
                            chart_name = chart_data.get("name", name)
                            version = chart_data.get("version", "0.1.0")

                            # Dependency path needs to be relative to the umbrella chart location
                            # Umbrella is at charts/predator-umbrella
                            # Subchart is at charts/category/component
                            # Relative path: ../category/component
                            dep_path = os.path.join("..", rel_path)

                            charts.append({
                                "name": chart_name,
                                "version": version,
                                "repository": f"file://{dep_path}"
                            })
                    except Exception as e:
                        print(f"Skipping {root}: {e}")
    return charts

def create_umbrella():
    os.makedirs(UMBRELLA_DIR, exist_ok=True)
    dependencies = find_all_charts()

    print(f"Found {len(dependencies)} sub-charts.")

    chart_yaml = {
        "apiVersion": "v2",
        "name": "predator-umbrella",
        "description": "Predator Analytics v30 Full Stack (Umbrella)",
        "type": "application",
        "version": "1.0.0",
        "appVersion": "30.0.0",
        "dependencies": dependencies
    }

    with open(os.path.join(UMBRELLA_DIR, "Chart.yaml"), 'w') as f:
        yaml.dump(chart_yaml, f, sort_keys=False)

    print(f"Umbrella Chart created at {UMBRELLA_DIR}/Chart.yaml")

    # Create basic values.yaml that can override global settings
    values_yaml = {
        "global": {
            "environment": "production",
            "domain": "predator.local"
        }
    }
    with open(os.path.join(UMBRELLA_DIR, "values.yaml"), 'w') as f:
        yaml.dump(values_yaml, f)

if __name__ == "__main__":
    create_umbrella()
