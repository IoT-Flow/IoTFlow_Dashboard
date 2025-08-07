#!/bin/sh
# env.sh - Replace environment variables in runtime

# Replace env vars in JS files
for file in /usr/share/nginx/html/static/js/*.js; do
    if [ -f "$file" ]; then
        # Replace REACT_APP environment variables
        sed -i 's|REACT_APP_API_URL_PLACEHOLDER|'${REACT_APP_API_URL:-http://localhost:3001/api}'|g' "$file"
        sed -i 's|REACT_APP_WS_URL_PLACEHOLDER|'${REACT_APP_WS_URL:-ws://localhost:3001/ws}'|g' "$file"
    fi
done
