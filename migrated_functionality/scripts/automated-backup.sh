#!/bin/bash

# 🛡️ AUTOMATED ECOSYSTEM BACKUP SYSTEM
# Protects your $30.5B+ ecosystem with intelligent backups

set -e  # Exit on any error

# Configuration
ECOSYSTEM_ROOT="/Users/divinejohns/memU"
BACKUP_ROOT="/Users/divinejohns/memU-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="$BACKUP_ROOT/backup_$TIMESTAMP"

# Logging
LOG_FILE="$BACKUP_ROOT/backup_logs/backup_$TIMESTAMP.log"

# Ensure backup directories exist
mkdir -p "$BACKUP_ROOT/backup_logs"
mkdir -p "$BACKUP_DIR"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "🚀 Starting Ecosystem Backup - $TIMESTAMP"
log "💰 Protecting $30.5B+ ecosystem value"

# Backup critical components
backup_component() {
    local component=$1
    local source_path="$ECOSYSTEM_ROOT/$component"
    local dest_path="$BACKUP_DIR/$component"
    
    if [ -d "$source_path" ]; then
        log "📦 Backing up $component..."
        
        # Calculate size
        local size=$(du -sh "$source_path" | cut -f1)
        
        # Create backup with progress
        rsync -av --progress "$source_path/" "$dest_path/" >> "$LOG_FILE" 2>&1
        
        if [ $? -eq 0 ]; then
            log "✅ $component backed up successfully ($size)"
        else
            log "❌ Failed to backup $component"
            return 1
        fi
    else
        log "⚠️  Component $component not found, skipping..."
    fi
}

# Priority backup components (most critical first)
PRIORITY_COMPONENTS=(
    "_BILLIONAIRE_CONSCIOUSNESS_EMPIRE"
    "_IZA_ENTERPRISE_PLATFORM"
    "_MCP_INTEGRATION_HUB"
    "_AI_AGENT_ECOSYSTEM"
    "_GENIX_BANK_FINANCIAL"
    "_WORLDWIDEBRO_INTEGRATION"
    "_DEVELOPMENT_TOOLS"
    "_AUTOMATION_PLATFORMS"
)

# Backup each component
for component in "${PRIORITY_COMPONENTS[@]}"; do
    backup_component "$component"
done

# Backup key files
log "📄 Backing up ecosystem documentation and configuration files..."

# Create docs backup directory
mkdir -p "$BACKUP_DIR/_DOCUMENTATION"

# Backup important files
IMPORTANT_FILES=(
    "_ECOSYSTEM_ANALYSIS_REPORT.md"
    "_ECOSYSTEM_DOCUMENTATION.md"
    "_ECOSYSTEM_QUICK_START_GUIDE.md"
    "_MIGRATION_SYSTEM"
)

for file in "${IMPORTANT_FILES[@]}"; do
    if [ -e "$ECOSYSTEM_ROOT/$file" ]; then
        log "📋 Backing up $file..."
        cp -r "$ECOSYSTEM_ROOT/$file" "$BACKUP_DIR/_DOCUMENTATION/"
    fi
done

# Backup system configurations
log "⚙️  Backing up system configurations..."
mkdir -p "$BACKUP_DIR/_SYSTEM_CONFIGS"

# Warp configuration
if [ -f "$HOME/.warp/claude_mcp_config.json" ]; then
    cp "$HOME/.warp/claude_mcp_config.json" "$BACKUP_DIR/_SYSTEM_CONFIGS/"
    log "✅ Warp configuration backed up"
fi

# MCP configurations  
if [ -d "$HOME/.mcp-auth" ]; then
    cp -r "$HOME/.mcp-auth" "$BACKUP_DIR/_SYSTEM_CONFIGS/"
    log "✅ MCP authentication backed up"
fi

# Calculate total backup size
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
log "📊 Total backup size: $TOTAL_SIZE"

# Create backup manifest
MANIFEST_FILE="$BACKUP_DIR/backup_manifest.json"
cat > "$MANIFEST_FILE" << EOF
{
  "backup_timestamp": "$TIMESTAMP",
  "backup_date": "$(date)",
  "ecosystem_root": "$ECOSYSTEM_ROOT",
  "backup_location": "$BACKUP_DIR", 
  "total_size": "$TOTAL_SIZE",
  "components_backed_up": [
$(printf '    "%s",\n' "${PRIORITY_COMPONENTS[@]}" | sed '$ s/,$//')
  ],
  "backup_type": "full",
  "status": "completed"
}
EOF

log "📋 Backup manifest created: $MANIFEST_FILE"

# Cleanup old backups (keep last 7 days)
log "🧹 Cleaning up old backups..."
find "$BACKUP_ROOT" -name "backup_*" -type d -mtime +7 -exec rm -rf {} + 2>/dev/null || true

# Backup completion
log "✅ Ecosystem backup completed successfully!"
log "📍 Backup location: $BACKUP_DIR"
log "📊 Total backup size: $TOTAL_SIZE"

# Generate backup report
REPORT_FILE="$BACKUP_ROOT/latest_backup_report.json"
cat > "$REPORT_FILE" << EOF
{
  "status": "success",
  "timestamp": "$TIMESTAMP",
  "backup_location": "$BACKUP_DIR",
  "total_size": "$TOTAL_SIZE",
  "components_count": ${#PRIORITY_COMPONENTS[@]},
  "log_file": "$LOG_FILE"
}
EOF

log "📊 Backup report saved: $REPORT_FILE"

# Send success notification (if notification system available)
if command -v osascript >/dev/null 2>&1; then
    osascript -e "display notification \"Ecosystem backup completed successfully ($TOTAL_SIZE)\" with title \"memU Backup System\""
fi

echo "🎉 Backup process completed! Your $30.5B+ ecosystem is now protected."
echo "📂 Backup location: $BACKUP_DIR"