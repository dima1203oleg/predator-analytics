import base64
import os
import re
import sys

# Налаштування шляхів
dist_dir = "/Users/Shared/Predator_60/apps/predator-analytics-ui/dist"
index_path = os.path.join(dist_dir, "index.html")
js_path = os.path.join(dist_dir, "assets/index-frHzyyyd.js")
logo_path = os.path.join(dist_dir, "assets/predator-raptor-logo-x3h0paId.png")
output_path = os.path.join(dist_dir, "standalone.html")

target_api = "https://predator-api.share.zrok.io/api/v1"
if len(sys.argv) > 1:
    target_api = sys.argv[1]

print(f"🚀 Generating INTELLIGENT Standalone: {target_api}")

with open(index_path) as f:
    html = f.read()
with open(js_path) as f:
    js = f.read()

if os.path.exists(logo_path):
    with open(logo_path, "rb") as f:
        logo_b64 = base64.b64encode(f.read()).decode()
    js = js.replace("./assets/predator-raptor-logo-x3h0paId.png", f"data:image/png;base64,{logo_b64}")

# JS Template with CORS Detection
mocking_script = """
<script>
console.log("🦅 PREDATOR ELITE BRIDGE: Ініціалізація...");

const DEFAULT_API = "@@TARGET_API@@";
const savedUrl = localStorage.getItem('PREDATOR_API_URL') || DEFAULT_API;

window.PREDATOR_CONFIG = {
    API_BASE_URL: savedUrl,
    MOCK_MODE: false
};

const injectControlPanel = () => {
    const panel = document.createElement('div');
    panel.id = 'elite-control-panel';
    panel.style = 'position:fixed; bottom:10px; right:10px; z-index:10000; background:rgba(1,4,9,0.95); border:1px solid #00F5FF; padding:12px; border-radius:8px; font-family:monospace; color:#00F5FF; font-size:11px; box-shadow:0 0 30px rgba(0,245,255,0.3); min-width:250px;';
    panel.innerHTML = `
        <div style="font-weight:bold; margin-bottom:8px; display:flex; justify-content:space-between;">
            <span>🛰️ SOVEREIGN LINK CONTROL</span>
            <span id="api-status-dot" style="color:#f43f5e;">●</span>
        </div>
        <input id="api-url-input" type="text" value="${window.PREDATOR_CONFIG.API_BASE_URL}" 
               style="background:#000; border:1px solid #333; color:#fff; width:100%; padding:5px; margin-bottom:8px; border-radius:4px; outline:none;">
        <button onclick="updateEliteApi()" 
                style="background:#00F5FF; color:#000; border:none; padding:6px; border-radius:4px; cursor:pointer; font-weight:bold; width:100%; margin-bottom:8px;">ОНОВИТИ ЗВ'ЯЗОК</button>
        <div id="cors-warning" style="display:none; color:#ff9800; background:rgba(255,152,0,0.1); padding:5px; border-radius:4px; margin-top:5px; font-size:10px;">
            ⚠️ <b>CORS Blocked</b>: Запустіть сервер:<br>
            <code style="display:block; background:#000; margin-top:3px; padding:2px;">python3 -m http.server 8080</code>
        </div>
        <div id="api-status-msg" style="margin-top:5px; color:#666;">Статус: Перевірка...</div>
    `;
    document.body.appendChild(panel);
    
    if (window.location.protocol === 'file:') {
        document.getElementById('cors-warning').style.display = 'block';
    }
};

window.updateEliteApi = () => {
    const newUrl = document.getElementById('api-url-input').value;
    localStorage.setItem('PREDATOR_API_URL', newUrl);
    window.location.reload();
};

const MOCK_DATA = {
    '/api/v1/health': { status: "OPERATIONAL", version: "63.0-ELITE", node: "COLAB-FAILOVER-SIM" },
    '/api/v1/infrastructure/nodes': [
        { id: "NVIDIA-compute", name: "NVIDIA Pro (Node-199)", status: "offline", load: 0, vram: "16GB" },
        { id: "colab-cluster", name: "Google Colab (Failover)", status: "degraded", load: 0, vram: "16GB" }
    ]
};

const originalFetch = window.fetch;
window.fetch = async (url, options) => {
    if (!url.startsWith('http')) {
       url = window.PREDATOR_CONFIG.API_BASE_URL + (url.startsWith('/') ? url : '/' + url);
    }
    
    try {
        const response = await originalFetch(url, { ...options, mode: 'cors' });
        if (response.ok || response.status === 401) {
           updateStatus("🟢 ONLINE", "#10b981");
           return response;
        }
        throw new Error("Offline");
    } catch (e) {
        console.warn("⚠️ Bridge: Falling back to MOCK data.");
        updateStatus("🔴 OFFLINE / CORS BLOCK", "#f43f5e");
        
        for (const [path, data] of Object.entries(MOCK_DATA)) {
            if (url.includes(path)) {
                return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
        }
        return new Response(JSON.stringify({ status: "MOCK", data: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
};

function updateStatus(text, color) {
    const msg = document.getElementById('api-status-msg');
    const dot = document.getElementById('api-status-dot');
    if (msg) { msg.innerHTML = text; msg.style.color = color; }
    if (dot) { dot.style.color = color; }
}

window.addEventListener('DOMContentLoaded', injectControlPanel);
</script>
""".replace("@@TARGET_API@@", target_api)

# Replace and write
target_script = '<script type="module" crossorigin src="./assets/index-frHzyyyd.js"></script>'
if target_script in html:
    html = html.replace(target_script, f'{mocking_script}<script>{js}</script>')
else:
    html = re.sub(r'<script type="module" crossorigin src="\./assets/index-.*?\.js"></script>',
                 f'{mocking_script}<script>{js}</script>', html)

html = html.replace('href="./vite.svg"', 'href="https://vitejs.dev/logo.svg"')

with open(output_path, "w") as f:
    f.write(html)

print("✨ Standalone ELITE UI ready!")
