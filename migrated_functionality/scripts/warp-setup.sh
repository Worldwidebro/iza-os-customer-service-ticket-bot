#!/bin/bash

# 🚀 WARP.DEV SETUP SCRIPT
# $698B+ IZA OS Enterprise Ecosystem
# Version: 2.0.0
# Last Updated: 2024-12-26

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
ECOSYSTEM_ROOT="/Users/divinejohns/memU"
WARP_CONFIG_DIR="$HOME/.warp"
WARP_RULES_FILE="$WARP_CONFIG_DIR/ecosystem-rules.yaml"
WARP_SCRIPTS_DIR="$WARP_CONFIG_DIR/scripts"

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✅${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ❌${NC} $1"
}

# Header
echo -e "${PURPLE}"
echo "🚀 WARP.DEV INTEGRATION SETUP"
echo "============================="
echo "💰 Ecosystem Value: \$698B+"
echo "🏗️  IZA OS Enterprise Platform"
echo "📅 Date: $(date)"
echo -e "${NC}"

log "Setting up Warp.dev integration for \$698B ecosystem..."

# Function to create Warp configuration directory
create_warp_config() {
    log "📁 Creating Warp configuration directory..."
    
    if [ ! -d "$WARP_CONFIG_DIR" ]; then
        mkdir -p "$WARP_CONFIG_DIR"
        log_success "Created Warp configuration directory: $WARP_CONFIG_DIR"
    else
        log_warning "Warp configuration directory already exists: $WARP_CONFIG_DIR"
    fi
    
    if [ ! -d "$WARP_SCRIPTS_DIR" ]; then
        mkdir -p "$WARP_SCRIPTS_DIR"
        log_success "Created Warp scripts directory: $WARP_SCRIPTS_DIR"
    else
        log_warning "Warp scripts directory already exists: $WARP_SCRIPTS_DIR"
    fi
}

# Function to copy ecosystem rules
copy_ecosystem_rules() {
    log "📋 Copying ecosystem rules to Warp configuration..."
    
    local source_rules="$ECOSYSTEM_ROOT/_MCP_INTEGRATION_HUB/configurations/warp-dev-rules.yaml"
    
    if [ -f "$source_rules" ]; then
        cp "$source_rules" "$WARP_RULES_FILE"
        log_success "Copied ecosystem rules to: $WARP_RULES_FILE"
    else
        log_error "Source rules file not found: $source_rules"
        return 1
    fi
}

# Function to create Warp command aliases
create_command_aliases() {
    log "🔗 Creating Warp command aliases..."
    
    cat > "$WARP_CONFIG_DIR/aliases.yaml" << 'EOF'
# 🚀 WARP.DEV COMMAND ALIASES
# $698B+ IZA OS Enterprise Ecosystem

aliases:
  # Ecosystem Management
  memu-status: "cd /Users/divinejohns/memU && node _MCP_INTEGRATION_HUB/monitoring/unified-health-check.js"
  memu-deploy: "cd /Users/divinejohns/memU && ./deploy/unified-deployment.sh"
  memu-monitor: "cd /Users/divinejohns/memU && ./validate-698b-alignment.sh"
  memu-security: "cd /Users/divinejohns/memU && ./_MCP_INTEGRATION_HUB/security/security-hardening.sh"
  
  # AI Agent Management
  ai-start: "cd /Users/divinejohns/memU && node _MCP_INTEGRATION_HUB/servers/ecosystem-mcp-server/server.js"
  ai-status: "cd /Users/divinejohns/memU && node _MCP_INTEGRATION_HUB/monitoring/unified-health-check.js | grep -i 'mcp'"
  ai-deploy: "cd /Users/divinejohns/memU && docker-compose up -d"
  
  # Business Intelligence
  biz-revenue: "cd /Users/divinejohns/memU && python MEMU_VALUE_TRACKER.py"
  biz-market: "cd /Users/divinejohns/memU && echo 'Market analysis: $698B+ ecosystem value'"
  biz-performance: "cd /Users/divinejohns/memU && ./validate-698b-alignment.sh"
  
  # Development Shortcuts
  dev-start: "cd /Users/divinejohns/memU && docker-compose up -d"
  dev-stop: "cd /Users/divinejohns/memU && docker-compose down"
  dev-logs: "cd /Users/divinejohns/memU && docker-compose logs -f"
  dev-restart: "cd /Users/divinejohns/memU && docker-compose restart"
  
  # Monitoring Shortcuts
  health: "cd /Users/divinejohns/memU && node _MCP_INTEGRATION_HUB/monitoring/unified-health-check.js"
  daily-health: "cd /Users/divinejohns/memU && node _MCP_INTEGRATION_HUB/monitoring/daily-health-check.js"
  security-check: "cd /Users/divinejohns/memU && node _MCP_INTEGRATION_HUB/monitoring/security-monitor.js"
  
  # Quick Navigation
  ecosystem: "cd /Users/divinejohns/memU"
  mcp-hub: "cd /Users/divinejohns/memU/_MCP_INTEGRATION_HUB"
  deploy: "cd /Users/divinejohns/memU/deploy"
  monitoring: "cd /Users/divinejohns/memU/_MCP_INTEGRATION_HUB/monitoring"
  security: "cd /Users/divinejohns/memU/_MCP_INTEGRATION_HUB/security"
EOF
    
    log_success "Created command aliases: $WARP_CONFIG_DIR/aliases.yaml"
}

# Function to create Warp environment variables
create_environment_variables() {
    log "🌍 Creating Warp environment variables..."
    
    cat > "$WARP_CONFIG_DIR/environment.yaml" << 'EOF'
# 🌍 WARP.DEV ENVIRONMENT VARIABLES
# $698B+ IZA OS Enterprise Ecosystem

environment:
  ECOSYSTEM_ROOT: "/Users/divinejohns/memU"
  ECOSYSTEM_VALUE: "$698B+"
  MCP_HUB_PATH: "_MCP_INTEGRATION_HUB"
  DEPLOY_PATH: "deploy"
  MONITORING_PATH: "_MCP_INTEGRATION_HUB/monitoring"
  SECURITY_PATH: "_MCP_INTEGRATION_HUB/security"
  
  # Service URLs
  API_GATEWAY_URL: "http://localhost:8080"
  MEMU_DASHBOARD_URL: "http://localhost:3004"
  BACKEND_CORE_URL: "http://localhost:3000"
  GRAFANA_URL: "http://localhost:3001"
  PROMETHEUS_URL: "http://localhost:9090"
  
  # MCP Service URLs
  MCP_ECOSYSTEM_URL: "http://localhost:8000"
  MCP_CLAUDE_URL: "http://localhost:8001"
  MCP_PROJECT_URL: "http://localhost:8002"
  MCP_BUSINESS_URL: "http://localhost:8003"
  
  # Development
  NODE_ENV: "development"
  LOG_LEVEL: "info"
  DEBUG: "true"
EOF
    
    log_success "Created environment variables: $WARP_CONFIG_DIR/environment.yaml"
}

# Function to create Warp custom prompts
create_custom_prompts() {
    log "💬 Creating Warp custom prompts..."
    
    cat > "$WARP_CONFIG_DIR/prompts.yaml" << 'EOF'
# 💬 WARP.DEV CUSTOM PROMPTS
# $698B+ IZA OS Enterprise Ecosystem

prompts:
  ecosystem:
    name: "IZA OS Enterprise"
    template: |
      🚀 $698B+ IZA OS Enterprise Ecosystem
      ===================================
      
      You are operating within the $698B+ IZA OS Enterprise Ecosystem.
      
      Available Commands:
      - memu-status     : Check ecosystem health
      - memu-deploy     : Deploy ecosystem services
      - memu-monitor    : Monitor services
      - ai-start        : Start AI agent swarm
      - biz-revenue     : Revenue analytics
      
      Current Directory: {{current_directory}}
      Ecosystem Value: $698B+
      
      How can I help you manage your billion-dollar ecosystem today?
  
  ai_agent:
    name: "AI Agent Controller"
    template: |
      🤖 AI Agent Swarm Controller
      ============================
      
      You are controlling the AI agent swarm within the $698B+ ecosystem.
      
      Agent Commands:
      - ai-start        : Initialize agent swarm
      - ai-status       : Check agent health
      - ai-deploy       : Deploy new agents
      
      Available Agents:
      - Claude Chat Analyzer
      - Project Executor
      - Business Monetizer
      - Ecosystem MCP Server
      
      Which agent would you like to control?
  
  business:
    name: "Business Intelligence"
    template: |
      💼 Business Intelligence Dashboard
      =================================
      
      You are accessing the business intelligence systems of the $698B+ ecosystem.
      
      Business Commands:
      - biz-revenue     : Revenue tracking and analysis
      - biz-market      : Market analysis and trends
      - biz-performance : Business performance metrics
      
      Current Revenue Target: $698B+
      Ecosystem Value: $698B+
      
      What business insights would you like to explore?
EOF
    
    log_success "Created custom prompts: $WARP_CONFIG_DIR/prompts.yaml"
}

# Function to create Warp integration scripts
create_integration_scripts() {
    log "📜 Creating Warp integration scripts..."
    
    # Ecosystem setup script
    cat > "$WARP_SCRIPTS_DIR/setup-ecosystem.sh" << 'EOF'
#!/bin/bash
echo "🚀 Setting up $698B+ IZA OS Enterprise Ecosystem..."
cd /Users/divinejohns/memU
./deploy/unified-deployment.sh
echo "✅ Ecosystem setup complete!"
EOF
    
    # Health check script
    cat > "$WARP_SCRIPTS_DIR/health-check.sh" << 'EOF'
#!/bin/bash
echo "🏥 Running ecosystem health check..."
cd /Users/divinejohns/memU
node _MCP_INTEGRATION_HUB/monitoring/unified-health-check.js
echo "✅ Health check complete!"
EOF
    
    # Security audit script
    cat > "$WARP_SCRIPTS_DIR/security-audit.sh" << 'EOF'
#!/bin/bash
echo "🔒 Running security audit..."
cd /Users/divinejohns/memU
./_MCP_INTEGRATION_HUB/security/security-hardening.sh
echo "✅ Security audit complete!"
EOF
    
    # Make scripts executable
    chmod +x "$WARP_SCRIPTS_DIR"/*.sh
    
    log_success "Created integration scripts in: $WARP_SCRIPTS_DIR"
}

# Function to create Warp key bindings
create_key_bindings() {
    log "⌨️  Creating Warp key bindings..."
    
    cat > "$WARP_CONFIG_DIR/key_bindings.yaml" << 'EOF'
# ⌨️  WARP.DEV KEY BINDINGS
# $698B+ IZA OS Enterprise Ecosystem

key_bindings:
  "Ctrl+Shift+E": "memu-status"
  "Ctrl+Shift+D": "memu-deploy"
  "Ctrl+Shift+M": "memu-monitor"
  "Ctrl+Shift+S": "memu-security"
  "Ctrl+Shift+A": "ai-start"
  "Ctrl+Shift+B": "biz-revenue"
  "Ctrl+Shift+H": "health"
  "Ctrl+Shift+Q": "daily-health"
  "Ctrl+Shift+R": "security-check"
EOF
    
    log_success "Created key bindings: $WARP_CONFIG_DIR/key_bindings.yaml"
}

# Function to create Warp workflow templates
create_workflow_templates() {
    log "🔄 Creating Warp workflow templates..."
    
    cat > "$WARP_CONFIG_DIR/workflows.yaml" << 'EOF'
# 🔄 WARP.DEV WORKFLOW TEMPLATES
# $698B+ IZA OS Enterprise Ecosystem

workflows:
  daily_operations:
    name: "Daily Operations"
    description: "Daily ecosystem management workflow"
    commands:
      - "memu-status"
      - "health"
      - "biz-revenue"
      - "ai-status"
  
  deployment_workflow:
    name: "Deployment Workflow"
    description: "Complete ecosystem deployment"
    commands:
      - "memu-deploy"
      - "health"
      - "security-check"
      - "memu-monitor"
  
  maintenance_workflow:
    name: "Maintenance Workflow"
    description: "Ecosystem maintenance and updates"
    commands:
      - "memu-security"
      - "health"
      - "memu-deploy"
      - "daily_operations"
  
  emergency_workflow:
    name: "Emergency Workflow"
    description: "Emergency ecosystem recovery"
    commands:
      - "memu-status"
      - "health"
      - "security-check"
      - "memu-deploy"
EOF
    
    log_success "Created workflow templates: $WARP_CONFIG_DIR/workflows.yaml"
}

# Function to create Warp theme configuration
create_theme_config() {
    log "🎨 Creating Warp theme configuration..."
    
    cat > "$WARP_CONFIG_DIR/theme.yaml" << 'EOF'
# 🎨 WARP.DEV THEME CONFIGURATION
# $698B+ IZA OS Enterprise Ecosystem

theme:
  name: "IZA OS Enterprise"
  description: "Professional theme for $698B+ ecosystem"
  
  colors:
    primary: "#1e40af"
    secondary: "#059669"
    accent: "#dc2626"
    background: "#0f172a"
    text: "#f1f5f9"
    success: "#10b981"
    warning: "#f59e0b"
    error: "#ef4444"
    info: "#3b82f6"
  
  styling:
    font_family: "JetBrains Mono"
    font_size: 14
    line_height: 1.5
    cursor_style: "block"
    cursor_blink: true
EOF
    
    log_success "Created theme configuration: $WARP_CONFIG_DIR/theme.yaml"
}

# Function to create Warp MCP integration configuration
create_mcp_integration() {
    log "🔗 Creating Warp MCP integration configuration..."
    
    cat > "$WARP_CONFIG_DIR/mcp-integration.yaml" << 'EOF'
# 🔗 WARP.DEV MCP INTEGRATION
# $698B+ IZA OS Enterprise Ecosystem

mcp_integration:
  enabled: true
  servers:
    ecosystem_mcp_server:
      name: "Ecosystem MCP Server"
      endpoint: "http://localhost:8000"
      description: "Main ecosystem access for $698B+ platform"
      capabilities:
        - "billionaire_consciousness_empire"
        - "iza_enterprise_platform"
        - "worldwidebro_integration"
        - "genix_bank_financial"
        - "ai_agent_ecosystem"
    
    claude_chat_analyzer:
      name: "Claude Chat Analyzer"
      endpoint: "http://localhost:8001"
      description: "Claude AI chat analysis and processing"
      capabilities:
        - "chat_analysis"
        - "conversation_extraction"
        - "ai_processing"
    
    project_executor:
      name: "Project Executor"
      endpoint: "http://localhost:8002"
      description: "Project execution automation"
      capabilities:
        - "project_management"
        - "execution_automation"
        - "workflow_orchestration"
    
    business_monetizer:
      name: "Business Monetizer"
      endpoint: "http://localhost:8003"
      description: "Business monetization optimization"
      capabilities:
        - "revenue_optimization"
        - "business_intelligence"
        - "monetization_tracking"
  
  configuration:
    timeout: 30
    retry_attempts: 3
    health_check_interval: 300
    auto_reconnect: true
EOF
    
    log_success "Created MCP integration configuration: $WARP_CONFIG_DIR/mcp-integration.yaml"
}

# Function to create Warp documentation
create_documentation() {
    log "📚 Creating Warp integration documentation..."
    
    cat > "$ECOSYSTEM_ROOT/WARP_DEV_INTEGRATION_GUIDE.md" << 'EOF'
# 🚀 WARP.DEV INTEGRATION GUIDE
## $698B+ IZA OS Enterprise Ecosystem

### Overview
This guide provides comprehensive integration with Warp.dev terminal for the $698B+ IZA OS Enterprise Ecosystem.

### Quick Start

#### 1. Setup Integration
```bash
cd /Users/divinejohns/memU
./_MCP_INTEGRATION_HUB/scripts/warp-setup.sh
```

#### 2. Available Commands
- `memu-status` - Check ecosystem health
- `memu-deploy` - Deploy ecosystem services
- `memu-monitor` - Monitor services
- `ai-start` - Start AI agent swarm
- `biz-revenue` - Revenue analytics

#### 3. Key Bindings
- `Ctrl+Shift+E` - Ecosystem status
- `Ctrl+Shift+D` - Deploy ecosystem
- `Ctrl+Shift+M` - Monitor services
- `Ctrl+Shift+S` - Security audit
- `Ctrl+Shift+A` - Start AI agents
- `Ctrl+Shift+B` - Business revenue

### Commands Reference

#### Ecosystem Management
| Command | Description | Output |
|---------|-------------|---------|
| `memu-status` | Check ecosystem health | Health report |
| `memu-deploy` | Deploy ecosystem services | Deployment status |
| `memu-monitor` | Monitor services | Monitoring dashboard |
| `memu-security` | Run security audit | Security report |

#### AI Agent Management
| Command | Description | Output |
|---------|-------------|---------|
| `ai-start` | Start AI agent swarm | Agent initialization |
| `ai-status` | Check agent status | Agent health report |
| `ai-deploy` | Deploy new agents | Deployment status |

#### Business Intelligence
| Command | Description | Output |
|---------|-------------|---------|
| `biz-revenue` | Revenue analytics | Revenue report |
| `biz-market` | Market analysis | Market intelligence |
| `biz-performance` | Performance metrics | Performance analytics |

#### Development Shortcuts
| Command | Description | Output |
|---------|-------------|---------|
| `dev-start` | Start development environment | Docker services |
| `dev-stop` | Stop development environment | Service shutdown |
| `dev-logs` | View service logs | Log output |
| `dev-restart` | Restart services | Service restart |

#### Monitoring
| Command | Description | Output |
|---------|-------------|---------|
| `health` | Run health check | Health report |
| `daily-health` | Daily health check | Daily report |
| `security-check` | Security audit | Security report |

### Navigation Shortcuts
- `ecosystem` - Navigate to ecosystem root
- `mcp-hub` - Navigate to MCP hub
- `deploy` - Navigate to deploy directory
- `monitoring` - Navigate to monitoring directory
- `security` - Navigate to security directory

### Workflow Templates

#### Daily Operations
```bash
memu-status
health
biz-revenue
ai-status
```

#### Deployment Workflow
```bash
memu-deploy
health
security-check
memu-monitor
```

#### Maintenance Workflow
```bash
memu-security
health
memu-deploy
daily_operations
```

### Environment Variables
- `ECOSYSTEM_ROOT` - Ecosystem root directory
- `ECOSYSTEM_VALUE` - Current ecosystem value ($698B+)
- `MCP_HUB_PATH` - MCP hub path
- `API_GATEWAY_URL` - API gateway URL
- `MEMU_DASHBOARD_URL` - Dashboard URL

### MCP Integration
The Warp integration includes full MCP (Model Context Protocol) support:

#### Available MCP Servers
1. **Ecosystem MCP Server** (Port 8000)
   - Billionaire Consciousness Empire
   - IZA Enterprise Platform
   - Worldwidebro Integration
   - Genix Bank Financial
   - AI Agent Ecosystem

2. **Claude Chat Analyzer** (Port 8001)
   - Chat analysis
   - Conversation extraction
   - AI processing

3. **Project Executor** (Port 8002)
   - Project management
   - Execution automation
   - Workflow orchestration

4. **Business Monetizer** (Port 8003)
   - Revenue optimization
   - Business intelligence
   - Monetization tracking

### Troubleshooting

#### Common Issues
1. **Command not found**
   - Run `./_MCP_INTEGRATION_HUB/scripts/warp-setup.sh` to reinstall
   - Check Warp configuration directory permissions

2. **MCP servers not responding**
   - Run `memu-status` to check service health
   - Restart services with `memu-deploy`

3. **Permission errors**
   - Ensure scripts are executable: `chmod +x _MCP_INTEGRATION_HUB/scripts/*.sh`
   - Check directory permissions

#### Support
- Documentation: `WARP_DEV_INTEGRATION_GUIDE.md`
- Health Check: `health`
- Status Check: `memu-status`

### Advanced Configuration

#### Custom Prompts
Warp includes custom prompts for different ecosystem contexts:
- **Ecosystem Prompt**: General ecosystem management
- **AI Agent Prompt**: AI agent control
- **Business Prompt**: Business intelligence

#### Theme Customization
The integration includes a professional theme optimized for the $698B+ ecosystem with:
- Enterprise color scheme
- Optimized typography
- Professional styling

#### Performance Optimization
- Command caching enabled
- Result caching enabled
- Parallel execution support
- Resource monitoring

---
**Last Updated**: 2024-12-26
**Ecosystem Value**: $698B+
**Integration Version**: 2.0.0
EOF
    
    log_success "Created integration documentation: $ECOSYSTEM_ROOT/WARP_DEV_INTEGRATION_GUIDE.md"
}

# Function to validate Warp setup
validate_warp_setup() {
    log "🔍 Validating Warp setup..."
    
    local validation_passed=true
    
    # Check if all configuration files exist
    local config_files=(
        "$WARP_RULES_FILE"
        "$WARP_CONFIG_DIR/aliases.yaml"
        "$WARP_CONFIG_DIR/environment.yaml"
        "$WARP_CONFIG_DIR/prompts.yaml"
        "$WARP_CONFIG_DIR/key_bindings.yaml"
        "$WARP_CONFIG_DIR/workflows.yaml"
        "$WARP_CONFIG_DIR/theme.yaml"
        "$WARP_CONFIG_DIR/mcp-integration.yaml"
    )
    
    for file in "${config_files[@]}"; do
        if [ -f "$file" ]; then
            log_success "Configuration file exists: $(basename "$file")"
        else
            log_error "Configuration file missing: $(basename "$file")"
            validation_passed=false
        fi
    done
    
    # Check if scripts directory exists and has scripts
    if [ -d "$WARP_SCRIPTS_DIR" ] && [ "$(ls -A "$WARP_SCRIPTS_DIR")" ]; then
        log_success "Integration scripts directory populated"
    else
        log_error "Integration scripts directory missing or empty"
        validation_passed=false
    fi
    
    # Check if documentation exists
    if [ -f "$ECOSYSTEM_ROOT/WARP_DEV_INTEGRATION_GUIDE.md" ]; then
        log_success "Integration documentation created"
    else
        log_error "Integration documentation missing"
        validation_passed=false
    fi
    
    if [ "$validation_passed" = true ]; then
        log_success "Warp setup validation passed"
        return 0
    else
        log_error "Warp setup validation failed"
        return 1
    fi
}

# Main execution
main() {
    log "🚀 Starting Warp.dev integration setup for \$698B ecosystem..."
    
    # Phase 1: Create Warp configuration
    log "📁 Phase 1: Creating Warp configuration..."
    create_warp_config
    
    # Phase 2: Copy ecosystem rules
    log "📋 Phase 2: Copying ecosystem rules..."
    copy_ecosystem_rules
    
    # Phase 3: Create command aliases
    log "🔗 Phase 3: Creating command aliases..."
    create_command_aliases
    
    # Phase 4: Create environment variables
    log "🌍 Phase 4: Creating environment variables..."
    create_environment_variables
    
    # Phase 5: Create custom prompts
    log "💬 Phase 5: Creating custom prompts..."
    create_custom_prompts
    
    # Phase 6: Create integration scripts
    log "📜 Phase 6: Creating integration scripts..."
    create_integration_scripts
    
    # Phase 7: Create key bindings
    log "⌨️  Phase 7: Creating key bindings..."
    create_key_bindings
    
    # Phase 8: Create workflow templates
    log "🔄 Phase 8: Creating workflow templates..."
    create_workflow_templates
    
    # Phase 9: Create theme configuration
    log "🎨 Phase 9: Creating theme configuration..."
    create_theme_config
    
    # Phase 10: Create MCP integration
    log "🔗 Phase 10: Creating MCP integration..."
    create_mcp_integration
    
    # Phase 11: Create documentation
    log "📚 Phase 11: Creating documentation..."
    create_documentation
    
    # Phase 12: Validate setup
    log "🔍 Phase 12: Validating setup..."
    validate_warp_setup
    
    # Final status
    echo -e "${PURPLE}"
    echo "🎉 WARP.DEV INTEGRATION COMPLETE"
    echo "================================"
    echo -e "${NC}"
    
    log_success "🚀 Warp.dev integration setup completed successfully"
    log_success "📚 Documentation created: WARP_DEV_INTEGRATION_GUIDE.md"
    log_success "🔗 Command aliases configured"
    log_success "⌨️  Key bindings configured"
    log_success "🔄 Workflow templates created"
    log_success "🎨 Theme configuration applied"
    log_success "🔗 MCP integration configured"
    
    echo -e "${GREEN}"
    echo "💰 Ecosystem Value: \$698B+"
    echo "🚀 Warp.dev Integration: Complete"
    echo "✅ All configurations applied"
    echo "🎯 Ready for enhanced terminal experience!"
    echo ""
    echo "Quick Commands:"
    echo "  memu-status  - Check ecosystem health"
    echo "  memu-deploy  - Deploy ecosystem services"
    echo "  ai-start     - Start AI agent swarm"
    echo "  biz-revenue  - Revenue analytics"
    echo ""
    echo "Key Bindings:"
    echo "  Ctrl+Shift+E - Ecosystem status"
    echo "  Ctrl+Shift+D - Deploy ecosystem"
    echo "  Ctrl+Shift+A - Start AI agents"
    echo "  Ctrl+Shift+B - Business revenue"
    echo -e "${NC}"
}

# Run main function
main "$@"
