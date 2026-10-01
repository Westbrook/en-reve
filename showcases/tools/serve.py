#!/usr/bin/env python3
"""Serve each production build on its own origin; no dev clients or instrumentation."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from functools import partial
import threading, signal, json
ROOT=Path(__file__).resolve().parents[1]
PROJECTS=[entry['id'] for entry in json.loads((ROOT/'performance/registry/systems.json').read_text())]
servers=[]
for index,name in enumerate(PROJECTS):
 directory=ROOT/name/'dist'
 if not directory.is_dir():raise SystemExit(f'Build {name} first')
 server=ThreadingHTTPServer(('127.0.0.1',4510+index),partial(SimpleHTTPRequestHandler,directory=str(directory)))
 servers.append(server);threading.Thread(target=server.serve_forever,daemon=True).start()
 print(f'{name}: http://127.0.0.1:{4510+index}',flush=True)
try:signal.pause()
except KeyboardInterrupt:pass
finally:
 for server in servers:server.shutdown()
