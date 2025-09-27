#!/bin/bash

# Docker Security Hardening
# IZA OS Enterprise Security Standards

set -e

echo "🐳 Starting Docker security hardening..."

# Create docker daemon config
cat > /etc/docker/daemon.json << 'EOL'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "live-restore": true,
  "userland-proxy": false,
  "no-new-privileges": true,
  "seccomp-profile": "/etc/docker/seccomp.json",
  "apparmor-profile": "docker-default"
}
EOL

# Restart Docker daemon
systemctl restart docker

# Run security scans
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  -v /tmp:/tmp \
  aquasec/trivy image --exit-code 0 --severity HIGH,CRITICAL \
  $(docker images --format "table {{.Repository}}:{{.Tag}}" | tail -n +2)

echo "✅ Docker security hardening complete"
