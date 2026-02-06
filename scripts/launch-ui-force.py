import http.server
import os
import socketserver


PORT = 8080
DIRECTORY = "apps/predator-analytics-ui/dist"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        path = self.path.split('?')[0]
        if '.' not in path:
             self.path = '/index.html'
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

try:
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving UI v30 at http://localhost:{PORT}")
        httpd.serve_forever()
except Exception as e:
    print(f"Error: {e}")
