#!/bin/sh
# Write runtime env vars into the served static files
cat > /app/dist/env.js <<EOF
window.__ENV = {
  VITE_API_BASE_URL: "${VITE_API_BASE_URL:-}"
};
EOF
exec serve -s dist -l ${PORT:-3000}
