import http.server
import socketserver

PORT = 3030
DIRECTORY = "apps/predator-analytics-ui/dist"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        # Redirect all non-file requests to index.html for SPA routing
        path = self.path.split('?')[0]
        if '.' not in path:
             self.path = '/index.html'
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

try:
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        httpd.serve_forever()
except Exception:
    pass
except KeyboardInterrupt:
    pass
