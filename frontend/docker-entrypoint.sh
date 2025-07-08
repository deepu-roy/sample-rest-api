#!/bin/sh

# Generate env-config.js with current environment variables
cat <<EOF > /usr/share/nginx/html/js/env-config.js
window._env_ = {
  API_HOST: "${API_HOST:-localhost}",
  API_PORT: "${API_PORT:-3000}"
};
EOF

# Start nginx
nginx -g 'daemon off;'
