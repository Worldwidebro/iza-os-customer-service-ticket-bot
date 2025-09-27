#!/bin/bash

# Security Testing Suite
# IZA OS Enterprise Security Standards

set -e

echo "🔍 Starting security testing suite..."

# Vulnerability scanning
echo "Running vulnerability scans..."
nmap -sS -O -sV -p- localhost

# Port scanning
echo "Scanning open ports..."
netstat -tuln

# File permission checks
echo "Checking file permissions..."
find /etc -type f -perm /o+w

# Service security checks
echo "Checking running services..."
systemctl list-units --type=service --state=running

# User account checks
echo "Checking user accounts..."
awk -F: '$3 == 0 {print $1}' /etc/passwd

# Password policy checks
echo "Checking password policies..."
grep -E "^PASS_MAX_DAYS|^PASS_MIN_DAYS|^PASS_WARN_AGE" /etc/login.defs

# Network security checks
echo "Checking network configuration..."
iptables -L -n

echo "✅ Security testing suite complete"
