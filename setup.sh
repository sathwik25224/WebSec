#!/usr/bin/env bash
set -euo pipefail
command -v node >/dev/null || { echo "Node.js is required"; exit 1; }
command -v npm >/dev/null || { echo "npm is required"; exit 1; }
npm_config_cache=/tmp/cyberlearn-npm npm install
mkdir -p data uploads demo-data
[ -f .env ] || cp .env.example .env
npm run reset
echo "CyberLearn is ready at http://127.0.0.1:3000"
echo "Admin: admin@cyberlearn.local / DemoAdmin123!"
echo "Learner: alice@cyberlearn.local / alice123"
