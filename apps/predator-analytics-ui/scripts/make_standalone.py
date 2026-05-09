import os
import base64
import re

dist_dir = "/Users/Shared/Predator_60/apps/predator-analytics-ui/dist"
index_path = os.path.join(dist_dir, "index.html")
js_path = os.path.join(dist_dir, "assets/index-frHzyyyd.js")
logo_path = os.path.join(dist_dir, "assets/predator-raptor-logo-x3h0paId.png")
output_path = os.path.join(dist_dir, "standalone.html")

print(f"Reading {index_path}...")
with open(index_path, "r") as f:
    html = f.read()

print(f"Reading {js_path}...")
with open(js_path, "r") as f:
    js = f.read()

# Encode logo to base64
print(f"Encoding {logo_path}...")
if os.path.exists(logo_path):
    with open(logo_path, "rb") as f:
        logo_b64 = base64.b64encode(f.read()).decode()
    js = js.replace("./assets/predator-raptor-logo-x3h0paId.png", f"data:image/png;base64,{logo_b64}")

# Global Mocking Layer (Sovereign Simulator)
mocking_script = """
<script>
console.log("🚀 SFE_MODE: Activating Sovereign Simulator...");
window.__BACKEND_NODES__ = {
    "SOVEREIGN": "http://127.0.0.1:8000",
    "HYBRID": "http://192.168.0.114:8000",
    "CLOUD": "https://api.predator.ai"
};
window.__BACKEND_OFFLINE_MODE__ = true;

// Mock Fetch
const originalFetch = window.fetch;
window.fetch = async (url, options) => {
    console.log(`[SIMULATOR] Fetch intercepted: ${url}`);
    if (url.includes('/api/v1/health')) {
        return new Response(JSON.stringify({ status: "OPERATIONAL", version: "63.0-ELITE" }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    // Return empty success for most things in simulator mode
    return new Response(JSON.stringify({ data: [], status: "MOCK_SUCCESS" }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
};

// Mock XHR (for Cytoscape/others)
const originalXHR = window.XMLHttpRequest;
window.XMLHttpRequest = function() {
    const xhr = new originalXHR();
    const originalOpen = xhr.open;
    xhr.open = function(method, url) {
        console.log(`[SIMULATOR] XHR intercepted: ${url}`);
        this._is_mock = true;
        return originalOpen.apply(this, arguments);
    };
    return xhr;
};
</script>
"""

# Replace module script and inject Mocking Layer + JS
target_script = '<script type="module" crossorigin src="./assets/index-frHzyyyd.js"></script>'
if target_script in html:
    html = html.replace(target_script, f'{mocking_script}<script>{js}</script>')
else:
    print("Warning: Target script tag not found!")

# Also fix the icon path just in case
html = html.replace('href="./vite.svg"', 'href="https://vitejs.dev/logo.svg"')

print(f"Writing {output_path}...")
with open(output_path, "w") as f:
    f.write(html)

print("Done! Standalone HTML generated.")
