import http.server
import socketserver

PORT = 3030
DIRECTORY = "/Users/Shared/Predator_60/apps/predator-analytics-ui/dist"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

socketserver.TCPServer.allow_reuse_address = True
try:
    with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
        print(f"🚀 PREDATOR UI Simulator serving at http://localhost:{PORT}")
        httpd.serve_forever()
except Exception as e:
    print(f"❌ Error: {e}")
