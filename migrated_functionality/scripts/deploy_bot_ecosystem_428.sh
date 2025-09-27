#!/bin/bash
# IZA OS Bot Ecosystem Deployment

set -euo pipefail

echo "🤖 Deploying IZA OS Bot Ecosystem..."

# Deploy core bots
kubectl apply -f k8s/core-bots/

# Deploy monitoring bots
kubectl apply -f k8s/monitoring-bots/

# Deploy security bots
kubectl apply -f k8s/security-bots/

# Deploy analytics bots
kubectl apply -f k8s/analytics-bots/

# Deploy infrastructure bots
kubectl apply -f k8s/infrastructure-bots/

echo "✅ Bot Ecosystem Deployment Complete!"
