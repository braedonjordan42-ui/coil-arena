#!/usr/bin/env bash
set -euo pipefail

GAME_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PORT="${PORT:-8000}"
HOST="127.0.0.1"
URL="http://${HOST}:${PORT}/"

if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3 is required. Install it with: sudo apt install python3"
  exit 1
fi

if ! command -v xdg-open >/dev/null 2>&1; then
  echo "xdg-open was not found. Install desktop utilities with: sudo apt install xdg-utils"
  echo "You can still open ${URL} manually after the server starts."
fi

cd "$GAME_DIR"
python3 - "$PORT" "$HOST" <<'PY' &
import sys, http.server, functools
class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # always serve the newest files (avoids old cached game code)
        self.send_header("Cache-Control", "no-store")
        super().end_headers()
    def log_message(self, *a): pass
port, host = int(sys.argv[1]), sys.argv[2]
http.server.ThreadingHTTPServer((host, port), NoCache).serve_forever()
PY
SERVER_PID=$!
cleanup() {
  kill "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

for _ in {1..30}; do
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "Could not start the local server on port ${PORT}."
    echo "If the port is busy, try: PORT=8001 ./run-parrot.sh"
    wait "$SERVER_PID" || true
    exit 1
  fi
  if python3 -c "import urllib.request; urllib.request.urlopen('${URL}', timeout=1).read(1)" >/dev/null 2>&1; then
    break
  fi
  sleep 0.2
done

echo "Coil Arena is running at ${URL}"
echo "Keep this terminal open. Press Ctrl+C to stop the server."
if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$URL" >/dev/null 2>&1 || echo "Open ${URL} in your browser."
fi
wait "$SERVER_PID"
