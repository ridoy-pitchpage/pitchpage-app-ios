"""Serve the exported web bundle with single-page fallback.

`expo export --platform web` with output "single" produces one index.html and a
bundle. A plain static server 404s every route but /, so the e2e run could only
ever test the first screen. Anything that is not a real file is served the app
shell, which is what a host like Netlify or Vercel does for an SPA.

    python3 e2e/serve.py [port] [dist-dir]
"""

import http.server
import os
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8099
ROOT = sys.argv[2] if len(sys.argv) > 2 else "dist"


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def do_GET(self):
        path = self.path.split("?")[0].lstrip("/")
        if path and not os.path.isfile(os.path.join(ROOT, path)):
            self.path = "/index.html"
        return super().do_GET()

    def log_message(self, *args):
        pass


http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
