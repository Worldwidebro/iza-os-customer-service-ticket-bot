#!/usr/bin/env node

/**
 * 🔍 MCP SERVER HEALTH MONITORING SYSTEM
 * 
 * Monitors all MCP servers in the ecosystem and provides health status
 * Integrates with Warp.dev for real-time monitoring displays
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class MCPHealthMonitor {
  constructor() {
    this.ecosystemRoot = process.env.ECOSYSTEM_ROOT || "/Users/divinejohns/memU";
    this.mcpHubRoot = path.join(this.ecosystemRoot, "_MCP_INTEGRATION_HUB");
    this.serversPath = path.join(this.mcpHubRoot, "servers");
    this.configPath = path.join(this.mcpHubRoot, "configurations");
    this.healthData = {
      timestamp: new Date().toISOString(),
      overall_status: "unknown",
      servers: [],
      summary: {},
      recommendations: []
    };
  }

  async checkAllServers() {
    console.log("🔍 Starting MCP Server Health Check...\n");

    try {
      // Load server configurations
      const config = await this.loadMCPConfig();
      
      // Check each configured server
      for (const [serverName, serverConfig] of Object.entries(config.mcpServers || {})) {
        console.log(`Checking ${serverName}...`);
        const healthInfo = await this.checkSingleServer(serverName, serverConfig);
        this.healthData.servers.push(healthInfo);
      }

      // Discover additional servers
      const discoveredServers = await this.discoverServers();
      for (const server of discoveredServers) {
        if (!this.healthData.servers.find(s => s.name === server)) {
          console.log(`Checking discovered server ${server}...`);
          const healthInfo = await this.checkDiscoveredServer(server);
          this.healthData.servers.push(healthInfo);
        }
      }

      // Calculate overall health
      this.calculateOverallHealth();
      
      // Generate recommendations
      this.generateRecommendations();

      // Save health report
      await this.saveHealthReport();

      // Display results
      this.displayResults();

    } catch (error) {
      console.error(`❌ Health check failed: ${error.message}`);
      this.healthData.overall_status = "error";
      this.healthData.error = error.message;
    }

    return this.healthData;
  }

  async loadMCPConfig() {
    try {
      const warpConfigPath = path.join(this.configPath, "warp-integration.json");
      const configData = await fs.readFile(warpConfigPath, 'utf8');
      const config = JSON.parse(configData);
      return config.warp_mcp_integration || {};
    } catch (error) {
      console.log("⚠️  No Warp integration config found, checking legacy config...");
      try {
        const legacyConfigPath = path.join(this.configPath, "mcp_settings.json");
        const configData = await fs.readFile(legacyConfigPath, 'utf8');
        return JSON.parse(configData);
      } catch (legacyError) {
        return { mcpServers: {} };
      }
    }
  }

  async checkSingleServer(serverName, serverConfig) {
    const healthInfo = {
      name: serverName,
      status: "unknown",
      response_time: null,
      last_check: new Date().toISOString(),
      config: serverConfig,
      issues: [],
      capabilities: []
    };

    try {
      // Check if server file exists
      const serverPath = serverConfig.args?.[0];
      if (serverPath) {
        const fullPath = serverPath.startsWith('/') ? serverPath : path.join(this.ecosystemRoot, serverPath);
        try {
          await fs.access(fullPath);
          healthInfo.file_exists = true;
        } catch {
          healthInfo.file_exists = false;
          healthInfo.issues.push("Server file not found");
        }
      }

      // Check dependencies
      const dependencies = await this.checkDependencies(serverPath);
      healthInfo.dependencies = dependencies;

      // Try to ping server (simplified check)
      const startTime = Date.now();
      try {
        // This is a simplified check - in production you'd want to actually test MCP protocol
        if (healthInfo.file_exists) {
          const testResult = execSync(`node -c "${serverPath}"`, { 
            timeout: 5000,
            stdio: 'pipe'
          });
          healthInfo.syntax_valid = true;
        }
      } catch (error) {
        healthInfo.syntax_valid = false;
        healthInfo.issues.push(`Syntax error: ${error.message}`);
      }
      
      const endTime = Date.now();
      healthInfo.response_time = endTime - startTime;

      // Determine status
      if (healthInfo.issues.length === 0) {
        healthInfo.status = "healthy";
      } else if (healthInfo.file_exists && healthInfo.syntax_valid) {
        healthInfo.status = "warning";
      } else {
        healthInfo.status = "unhealthy";
      }

    } catch (error) {
      healthInfo.status = "error";
      healthInfo.error = error.message;
      healthInfo.issues.push(`Health check failed: ${error.message}`);
    }

    return healthInfo;
  }

  async checkDiscoveredServer(serverName) {
    const healthInfo = {
      name: serverName,
      status: "discovered",
      type: "discovered",
      last_check: new Date().toISOString(),
      issues: [],
      location: path.join(this.serversPath, serverName)
    };

    try {
      const serverPath = path.join(this.serversPath, serverName);
      const stats = await fs.stat(serverPath);
      
      if (stats.isDirectory()) {
        // Check for server.js or index.js
        const possibleFiles = ['server.js', 'index.js', 'main.js'];
        for (const file of possibleFiles) {
          const filePath = path.join(serverPath, file);
          try {
            await fs.access(filePath);
            healthInfo.entry_point = filePath;
            healthInfo.status = "available";
            break;
          } catch {
            continue;
          }
        }
      } else if (serverName.endsWith('.js')) {
        healthInfo.entry_point = serverPath;
        healthInfo.status = "available";
      }

    } catch (error) {
      healthInfo.status = "error";
      healthInfo.error = error.message;
    }

    return healthInfo;
  }

  async discoverServers() {
    try {
      const servers = await fs.readdir(this.serversPath);
      return servers.filter(server => 
        !server.startsWith('.') && 
        !server.includes('node_modules')
      );
    } catch (error) {
      return [];
    }
  }

  async checkDependencies(serverPath) {
    if (!serverPath) return { status: "unknown" };

    try {
      const serverDir = path.dirname(serverPath);
      const packageJsonPath = path.join(serverDir, 'package.json');
      
      try {
        await fs.access(packageJsonPath);
        const packageData = await fs.readFile(packageJsonPath, 'utf8');
        const packageInfo = JSON.parse(packageData);
        
        // Check if node_modules exists
        const nodeModulesPath = path.join(serverDir, 'node_modules');
        try {
          await fs.access(nodeModulesPath);
          return {
            status: "installed",
            package_json: true,
            node_modules: true,
            dependencies: Object.keys(packageInfo.dependencies || {})
          };
        } catch {
          return {
            status: "missing",
            package_json: true,
            node_modules: false,
            dependencies: Object.keys(packageInfo.dependencies || {}),
            issue: "Dependencies not installed"
          };
        }
      } catch {
        return {
          status: "no_package_json",
          package_json: false,
          node_modules: false
        };
      }
    } catch (error) {
      return {
        status: "error",
        error: error.message
      };
    }
  }

  calculateOverallHealth() {
    const servers = this.healthData.servers;
    const total = servers.length;
    const healthy = servers.filter(s => s.status === "healthy").length;
    const warning = servers.filter(s => s.status === "warning").length;
    const unhealthy = servers.filter(s => s.status === "unhealthy" || s.status === "error").length;
    const discovered = servers.filter(s => s.status === "discovered" || s.status === "available").length;

    this.healthData.summary = {
      total_servers: total,
      healthy_servers: healthy,
      warning_servers: warning,
      unhealthy_servers: unhealthy,
      discovered_servers: discovered,
      health_percentage: total > 0 ? Math.round((healthy / total) * 100) : 0
    };

    // Determine overall status
    if (healthy === total && total > 0) {
      this.healthData.overall_status = "healthy";
    } else if (unhealthy === 0 && total > 0) {
      this.healthData.overall_status = "warning";
    } else if (total === 0) {
      this.healthData.overall_status = "no_servers";
    } else {
      this.healthData.overall_status = "unhealthy";
    }
  }

  generateRecommendations() {
    const servers = this.healthData.servers;
    const recommendations = [];

    // Check for missing dependencies
    const missingDeps = servers.filter(s => s.dependencies?.status === "missing");
    if (missingDeps.length > 0) {
      recommendations.push({
        type: "dependencies",
        priority: "high",
        message: `Install dependencies for ${missingDeps.length} server(s)`,
        command: "cd [server_directory] && npm install"
      });
    }

    // Check for syntax errors
    const syntaxErrors = servers.filter(s => s.syntax_valid === false);
    if (syntaxErrors.length > 0) {
      recommendations.push({
        type: "syntax",
        priority: "critical",
        message: `Fix syntax errors in ${syntaxErrors.length} server(s)`,
        servers: syntaxErrors.map(s => s.name)
      });
    }

    // Check for discovered servers
    const discoveredServers = servers.filter(s => s.status === "available");
    if (discoveredServers.length > 0) {
      recommendations.push({
        type: "configuration",
        priority: "medium",
        message: `Configure ${discoveredServers.length} discovered server(s)`,
        servers: discoveredServers.map(s => s.name)
      });
    }

    // Performance recommendations
    const slowServers = servers.filter(s => s.response_time && s.response_time > 1000);
    if (slowServers.length > 0) {
      recommendations.push({
        type: "performance",
        priority: "medium",
        message: `Optimize ${slowServers.length} slow-responding server(s)`,
        servers: slowServers.map(s => s.name)
      });
    }

    this.healthData.recommendations = recommendations;
  }

  async saveHealthReport() {
    const reportPath = path.join(this.mcpHubRoot, "monitoring", "health-report.json");
    await fs.writeFile(reportPath, JSON.stringify(this.healthData, null, 2));

    // Also save a timestamped report
    const timestamp = new Date().toISOString().split('T')[0];
    const timestampedPath = path.join(this.mcpHubRoot, "monitoring", `health-report-${timestamp}.json`);
    await fs.writeFile(timestampedPath, JSON.stringify(this.healthData, null, 2));
  }

  displayResults() {
    console.log("\n" + "=".repeat(60));
    console.log("🔍 MCP ECOSYSTEM HEALTH REPORT");
    console.log("=".repeat(60));

    // Overall status
    const statusIcon = {
      "healthy": "✅",
      "warning": "⚠️ ",
      "unhealthy": "❌",
      "no_servers": "📭",
      "error": "💥"
    };

    console.log(`\n${statusIcon[this.healthData.overall_status]} Overall Status: ${this.healthData.overall_status.toUpperCase()}`);
    console.log(`📊 Health Score: ${this.healthData.summary.health_percentage}%`);

    // Summary
    console.log("\n📈 SUMMARY:");
    console.log(`   Total Servers: ${this.healthData.summary.total_servers}`);
    console.log(`   ✅ Healthy: ${this.healthData.summary.healthy_servers}`);
    console.log(`   ⚠️  Warning: ${this.healthData.summary.warning_servers}`);
    console.log(`   ❌ Unhealthy: ${this.healthData.summary.unhealthy_servers}`);
    console.log(`   🔍 Discovered: ${this.healthData.summary.discovered_servers}`);

    // Individual server status
    console.log("\n🖥️  SERVER STATUS:");
    for (const server of this.healthData.servers) {
      const icon = {
        "healthy": "✅",
        "warning": "⚠️ ",
        "unhealthy": "❌",
        "error": "💥",
        "discovered": "🔍",
        "available": "📦"
      };

      console.log(`   ${icon[server.status]} ${server.name}: ${server.status.toUpperCase()}`);
      
      if (server.response_time) {
        console.log(`      Response Time: ${server.response_time}ms`);
      }
      
      if (server.issues.length > 0) {
        console.log(`      Issues: ${server.issues.join(', ')}`);
      }
    }

    // Recommendations
    if (this.healthData.recommendations.length > 0) {
      console.log("\n💡 RECOMMENDATIONS:");
      for (const rec of this.healthData.recommendations) {
        const priorityIcon = {
          "critical": "🚨",
          "high": "⚡",
          "medium": "📋",
          "low": "💭"
        };
        console.log(`   ${priorityIcon[rec.priority]} ${rec.message}`);
        if (rec.command) {
          console.log(`      Command: ${rec.command}`);
        }
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log(`Report saved: ${new Date().toISOString()}`);
    console.log("=".repeat(60) + "\n");
  }
}

// Run health check if called directly
if (require.main === module) {
  const monitor = new MCPHealthMonitor();
  monitor.checkAllServers().catch(console.error);
}

module.exports = MCPHealthMonitor;