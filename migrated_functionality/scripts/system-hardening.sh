#!/bin/bash

# System Security Hardening
# IZA OS Enterprise Security Standards

set -e

echo "🔒 Starting system security hardening..."

# Update system packages
apt-get update && apt-get upgrade -y

# Install security tools
apt-get install -y ufw fail2ban logwatch rkhunter chkrootkit

# Configure firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Configure fail2ban
systemctl enable fail2ban
systemctl start fail2ban

# Disable unnecessary services
systemctl disable telnet
systemctl disable rsh
systemctl disable rlogin
systemctl disable ftp

# Set secure permissions
chmod 600 /etc/shadow
chmod 644 /etc/passwd
chmod 644 /etc/group

echo "✅ System hardening complete"
